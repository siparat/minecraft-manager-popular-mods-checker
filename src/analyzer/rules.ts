import type { TrendResult } from './types.js';

export const FLAGS = {
	day: 'HOT_1D',
	week: 'HOT_7D',
	twoWeeks: 'HOT_14D',
	month: 'HOT_30D'
} as const;

export type Flag = (typeof FLAGS)[keyof typeof FLAGS];

export interface RuleThresholds {
	day: number;
	week: number;
	twoWeeks: number;
	month: number;
}

export const DEFAULT_RULES: RuleThresholds = {
	day: 1000,
	week: 10000,
	twoWeeks: 20000,
	month: 50000
};

export function evaluate(trend: TrendResult, rules: RuleThresholds = DEFAULT_RULES): Flag[] {
	const flags: Flag[] = [];
	if (trend.delta1d >= rules.day) flags.push(FLAGS.day);
	if (trend.delta7d >= rules.week) flags.push(FLAGS.week);
	if (trend.delta14d >= rules.twoWeeks) flags.push(FLAGS.twoWeeks);
	if (trend.delta30d >= rules.month) flags.push(FLAGS.month);
	return flags;
}
