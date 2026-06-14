import { logger } from '../observability/logger.js';
import { TrendAnalyzer } from './trendAnalyzer.js';

export const trendAnalyzer = new TrendAnalyzer(logger.child({ module: 'analyzer' }));

export { TrendAnalyzer } from './trendAnalyzer.js';
export { evaluate, FLAGS, DEFAULT_RULES, type Flag, type RuleThresholds } from './rules.js';
export type { ITrendAnalyzer, TrendResult } from './types.js';
