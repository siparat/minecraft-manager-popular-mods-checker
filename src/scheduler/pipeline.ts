import type { Logger } from 'pino';
import { evaluate, type RuleThresholds } from '../analyzer/rules.js';
import type { ITrendAnalyzer } from '../analyzer/types.js';
import { discoverFreshMods, type DiscoverySettings } from '../curseforge/discovery.js';
import type { CurseForgeClient } from '../curseforge/client.js';
import { getMod } from '../db/repositories/modsRepo.js';
import type { NotificationGate } from '../notifier/gate.js';
import type { NotifierRegistry } from '../notifier/registry.js';
import type { SnapshotService } from '../snapshot/snapshotService.js';

export interface PipelineSettings {
	discovery: DiscoverySettings;
	rules: RuleThresholds;
}

const SAVE_CHUNK = 25;

export interface PipelineDeps {
	client: CurseForgeClient;
	snapshotService: SnapshotService;
	analyzer: ITrendAnalyzer;
	gate: NotificationGate;
	registry: NotifierRegistry;
}

export class Pipeline {
	private running = false;

	constructor(
		private readonly deps: PipelineDeps,
		private readonly settings: PipelineSettings,
		private readonly logger: Logger
	) {}

	async runFreshCycle(): Promise<void> {
		if (this.running) {
			this.logger.warn('fresh cycle already running, skipping tick');
			return;
		}
		this.running = true;
		const startedAt = Date.now();

		try {
			const details = await discoverFreshMods(this.deps.client, this.settings.discovery, this.logger);

			const saved = { mods: 0, snapshots: 0, skipped: 0 };
			for (let offset = 0; offset < details.length; offset += SAVE_CHUNK) {
				const chunk = details.slice(offset, offset + SAVE_CHUNK);
				const result = await this.deps.snapshotService.saveMany(chunk);
				saved.mods += result.mods;
				saved.snapshots += result.snapshots;
				saved.skipped += result.skipped;
			}

			let events = 0;
			for (const detail of details) {
				if (await this.analyzeAndNotify(detail.modId)) events += 1;
			}

			this.logger.info(
				{ fresh: details.length, ...saved, events, durationMs: Date.now() - startedAt },
				'fresh cycle finished'
			);
		} finally {
			this.running = false;
		}
	}

	private async analyzeAndNotify(modId: string): Promise<boolean> {
		const trend = await this.deps.analyzer.analyze(modId);
		if (!trend) return false;

		const flags = evaluate(trend, this.settings.rules);
		if (flags.length === 0) return false;

		const mod = await getMod(modId);
		if (!mod) return false;

		const event = await this.deps.gate.build(
			{ modId: mod.id, name: mod.name, url: mod.url, author: mod.author ?? '' },
			trend,
			flags
		);
		if (!event) return false;

		await this.deps.registry.dispatch(event);
		await this.deps.gate.markSent(event);
		return true;
	}
}
