import { logger } from '../observability/logger.js';
import { CardParser } from './cardParser.js';

export const parser = new CardParser(logger.child({ module: 'parser' }));

export { ModParseError } from './parse.js';
export type { Parser, ModDetails } from './types.js';
