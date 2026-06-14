import pLimit from 'p-limit';
import type { Logger } from 'pino';
import { evaluate, type RuleThresholds } from '../analyzer/rules.js';
import type { ITrendAnalyzer } from '../analyzer/types.js';
import type { Collector } from '../collector/types.js';
import { getMod, listModIds } from '../db/repositories/modsRepo.js';
import type { Parser } from '../parser/types.js';
import type { ModDetails } from '../parser/types.js';
import type { NotificationGate } from '../notifier/gate.js';
import type { NotifierRegistry } from '../notifier/registry.js';
import type { SnapshotService } from '../snapshot/snapshotService.js';

export interface PipelineSettings {
	maxPages: number;
	parseConcurrency: number;
	rules: RuleThresholds;
}

export interface PipelineDeps {
	collector: Collector;
	parser: Parser;
	snapshotService: SnapshotService;
	analyzer: ITrendAnalyzer;
	gate: NotificationGate;
	registry: NotifierRegistry;
}

export class Pipeline {
	private collectRunning = false;
	private analyzeRunning = false;

	constructor(
		private readonly deps: PipelineDeps,
		private readonly settings: PipelineSettings,
		private readonly logger: Logger
	) {}

	async runCollect(): Promise<void> {
		if (this.collectRunning) {
			this.logger.warn('collect already running, skipping tick');
			return;
		}
		this.collectRunning = true;
		const startedAt = Date.now();

		try {
			const cards = await this.deps.collector.collectAll(this.settings.maxPages);
			const limit = pLimit(this.settings.parseConcurrency);

			const parsed = await Promise.all(
				cards.map((card) =>
					limit(async () => {
						try {
							return await this.deps.parser.parse(card);
						} catch (err) {
							this.logger.warn({ modId: card.modId, err }, 'parse failed, skipping mod');
							return null;
						}
					})
				)
			);

			const details = parsed.filter((d): d is ModDetails => d !== null);
			const saved = await this.deps.snapshotService.saveMany(details);

			this.logger.info(
				{
					cards: cards.length,
					parsed: details.length,
					...saved,
					durationMs: Date.now() - startedAt
				},
				'collect run finished'
			);
		} finally {
			this.collectRunning = false;
		}
	}

	async runAnalyze(): Promise<void> {
		if (this.analyzeRunning) {
			this.logger.warn('analyze already running, skipping tick');
			return;
		}
		this.analyzeRunning = true;
		const startedAt = Date.now();

		try {
			const modIds = await listModIds();
			let events = 0;

			for (const modId of modIds) {
				const trend = await this.deps.analyzer.analyze(modId);
				if (!trend) continue;

				const flags = evaluate(trend, this.settings.rules);
				if (flags.length === 0) continue;

				const mod = await getMod(modId);
				if (!mod) continue;

				const event = await this.deps.gate.build(
					{
						modId: mod.id,
						name: mod.name,
						url: mod.url,
						author: mod.author ?? ''
					},
					trend,
					flags
				);
				if (!event) continue;

				await this.deps.registry.dispatch(event);
				await this.deps.gate.markSent(event);
				events += 1;
			}

			this.logger.info(
				{ mods: modIds.length, events, durationMs: Date.now() - startedAt },
				'analyze run finished'
			);
		} finally {
			this.analyzeRunning = false;
		}
	}
}
