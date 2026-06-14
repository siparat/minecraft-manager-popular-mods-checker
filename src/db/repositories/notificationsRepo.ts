import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { sentNotifications } from '../schema.js';

export async function wasRecentlySent(modId: string, flag: string, withinHours: number): Promise<boolean> {
	const threshold = new Date(Date.now() - withinHours * 60 * 60 * 1000);
	const rows = await db
		.select({ id: sentNotifications.id })
		.from(sentNotifications)
		.where(
			and(
				eq(sentNotifications.modId, modId),
				eq(sentNotifications.flag, flag),
				gte(sentNotifications.sentAt, threshold)
			)
		)
		.limit(1);
	return rows.length > 0;
}

export async function recordSent(modId: string, flag: string): Promise<void> {
	await db.insert(sentNotifications).values({ modId, flag });
}

export async function countSent(): Promise<number> {
	const rows = await db.select({ value: sql<number>`count(*)::int` }).from(sentNotifications);
	return rows[0]?.value ?? 0;
}
