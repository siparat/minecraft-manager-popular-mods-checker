import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { SnapshotService } from './snapshotService.js';

export const snapshotService = new SnapshotService(config.snapshot.minIntervalMs, logger.child({ module: 'snapshot' }));

export { SnapshotService } from './snapshotService.js';
export type { SaveResult } from './snapshotService.js';
