import type { Logger } from 'pino';
import { httpPostJson } from '../http/client.js';
import type { TrendEvent } from './events.js';
import { formatTelegramMessage } from './format.js';
import type { Notifier } from './notifier.js';

interface TelegramResponse {
	ok: boolean;
	description?: string;
}

export class TelegramNotifier implements Notifier {
	readonly name = 'telegram';

	constructor(
		private readonly botToken: string,
		private readonly chatId: string,
		private readonly topicId: number | undefined,
		private readonly logger: Logger
	) {}

	async send(event: TrendEvent): Promise<void> {
		const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
		const response = await httpPostJson(url, {
			chat_id: this.chatId,
			...(this.topicId !== undefined ? { message_thread_id: this.topicId } : {}),
			text: formatTelegramMessage(event),
			parse_mode: 'HTML',
			disable_web_page_preview: false
		});

		if (response.status >= 400) {
			throw new Error(`telegram sendMessage http ${response.status}`);
		}

		const body = JSON.parse(response.body) as TelegramResponse;
		if (!body.ok) {
			throw new Error(`telegram sendMessage failed: ${body.description}`);
		}

		this.logger.debug({ modId: event.modId }, 'telegram message sent');
	}
}
