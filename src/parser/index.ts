import { pageFetcher } from '../browser/index.js';
import { logger } from '../observability/logger.js';
import { HtmlParser } from './parser.js';

export const parser = new HtmlParser(pageFetcher, logger.child({ module: 'parser' }));

export { parseModDetails, ModParseError } from './parse.js';
export type { Parser, ModDetails } from './types.js';
