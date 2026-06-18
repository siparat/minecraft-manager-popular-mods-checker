export interface TrendResult {
	modId: string;
	current: number;
	delta1d: number;
	delta7d: number;
	delta14d: number;
	delta30d: number;
	flags: string[];
}

export interface ITrendAnalyzer {
	analyze(modId: string): Promise<TrendResult | null>;
	analyzeMany(modIds: string[]): Promise<TrendResult[]>;
}
