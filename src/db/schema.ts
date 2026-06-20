import { bigint, bigserial, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const mods = pgTable(
	'mods',
	{
		id: text('id').primaryKey(),
		projectId: integer('project_id'),
		name: text('name').notNull(),
		url: text('url').notNull(),
		author: text('author'),
		categories: text('categories').array(),
		releaseDate: timestamp('release_date', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [index('idx_mods_release_date').on(table.releaseDate.desc())]
);

export const modSnapshots = pgTable(
	'mod_snapshots',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		modId: text('mod_id')
			.notNull()
			.references(() => mods.id, { onDelete: 'cascade' }),
		snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull(),
		downloads: bigint('downloads', { mode: 'number' }).notNull()
	},
	(table) => [index('idx_snapshots_mod_time').on(table.modId, table.snapshotAt.desc())]
);

export const sentNotifications = pgTable(
	'sent_notifications',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		modId: text('mod_id').notNull(),
		flag: text('flag').notNull(),
		sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [index('idx_sent_mod_flag_time').on(table.modId, table.flag, table.sentAt.desc())]
);

export type ModRow = typeof mods.$inferSelect;
export type NewModRow = typeof mods.$inferInsert;
export type SnapshotRow = typeof modSnapshots.$inferSelect;
export type NewSnapshotRow = typeof modSnapshots.$inferInsert;
export type SentNotificationRow = typeof sentNotifications.$inferSelect;
