import { logger } from '../observability/logger.js';
import { TrendAnalyzer } from './trendAnalyzer.js';

export const trendAnalyzer = new TrendAnalyzer(logger.child({ module: 'analyzer' }));

export { TrendAnalyzer as SqlTrendAnalyzer } from './trendAnalyzer.js';
export type { TrendAnalyzer, TrendResult } from './types.js';
