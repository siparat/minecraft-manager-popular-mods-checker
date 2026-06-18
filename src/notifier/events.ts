export interface EventSource {
	modId: string;
	name: string;
	url: string;
	author: string;
}

export interface TrendEvent {
	modId: string;
	name: string;
	url: string;
	author: string;
	totalDownloads?: number;
	delta1d?: number;
	delta7d?: number;
	delta14d?: number;
	delta30d?: number;
	flags: string[];
}
