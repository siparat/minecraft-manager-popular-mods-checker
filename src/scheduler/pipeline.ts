import pLimit from 'p-limit';
import type { Logger } from 'pino';
import { evaluate, type RuleThresholds } from '../analyzer/rules.js';
import type { ITrendAnalyzer } from '../analyzer/types.js';
import type { Collector } from '../collector/types.js';
import { backdateAllMods, countMods, getMod, listNewModIds } from '../db/repositories/modsRepo.js';
import type { Parser } from '../parser/types.js';
import type { ModDetails } from '../parser/types.js';
import type { NotificationGate } from '../notifier/gate.js';
import type { NotifierRegistry } from '../notifier/registry.js';
import type { SnapshotService } from '../snapshot/snapshotService.js';

export interface PipelineSettings {
	maxPages: number;
	parseConcurrency: number;
	rules: RuleThresholds;
	newModMaxAgeMs: number;
}

// Persist results in chunks so data lands in the DB progressively and a crash
// mid-run doesn't discard everything parsed so far.
const SAVE_CHUNK = 25;

// On the very first run the whole top list is brand new to us; backdate it so those
// established mods don't masquerade as fresh releases for a month.
const BASELINE_BACKDATE_MS = 60 * 24 * 60 * 60 * 1000;

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

	// Seed run: collect everything once, mark all mods as old (not-new), then the caller exits.
	// After this, only mods that appear for the first time later are treated as fresh releases.
	async seedBaseline(): Promise<void> {
		this.logger.info('seed-baseline: collecting current mods');
		await this.runCollect(false);
		const marked = await backdateAllMods(new Date('1900-01-01T00:00:00Z'));
		this.logger.info({ marked }, 'seed-baseline finished: all mods marked as not-new');
	}

	async runCollect(analyzeAfter = true): Promise<void> {
		if (this.collectRunning) {
			this.logger.warn('collect already running, skipping tick');
			return;
		}
		this.collectRunning = true;
		const startedAt = Date.now();

		try {
			const isBaseline = (await countMods()) === 0;
			const seedCreatedAt = isBaseline ? new Date(Date.now() - BASELINE_BACKDATE_MS) : undefined;
			if (isBaseline) {
				this.logger.info('baseline run: seeding existing mods as not-new');
			}

			const cards = await this.deps.collector.collectAll(this.settings.maxPages);
			const limit = pLimit(this.settings.parseConcurrency);

			let parsed = 0;
			const saved = { mods: 0, snapshots: 0, skipped: 0 };

			for (let offset = 0; offset < cards.length; offset += SAVE_CHUNK) {
				const chunk = cards.slice(offset, offset + SAVE_CHUNK);

				const results = await Promise.all(
					chunk.map((card) =>
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

				const details = results.filter((d): d is ModDetails => d !== null);
				parsed += details.length;

				const chunkSaved = await this.deps.snapshotService.saveMany(details, seedCreatedAt);
				saved.mods += chunkSaved.mods;
				saved.snapshots += chunkSaved.snapshots;
				saved.skipped += chunkSaved.skipped;

				this.logger.info(
					{ processed: Math.min(offset + SAVE_CHUNK, cards.length), total: cards.length, parsed },
					'collect progress'
				);
			}

			this.logger.info(
				{
					cards: cards.length,
					parsed,
					...saved,
					durationMs: Date.now() - startedAt
				},
				'collect run finished'
			);
		} finally {
			this.collectRunning = false;
		}

		// Analyze immediately on fresh data so spikes are sent right away, not batched later.
		if (analyzeAfter) await this.runAnalyze();
	}

	async runAnalyze(): Promise<void> {
		if (this.analyzeRunning) {
			this.logger.warn('analyze already running, skipping tick');
			return;
		}
		this.analyzeRunning = true;
		const startedAt = Date.now();

		try {
			// Only newly tracked mods are eligible — we want fresh releases that spiked,
			// not old mods that merely gained popularity.
			const modIds = await listNewModIds(this.settings.newModMaxAgeMs);
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
