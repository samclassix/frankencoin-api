// --------------------------------------------------------------------------
// Api

export type ReportingToken = 'fps1' | 'fcs' | 'combined';

export const REPORTING_TOKENS: ReportingToken[] = ['fps1', 'fcs', 'combined'];

export type ApiFpsYearlyRow = {
	year: number;
	// raw amounts (18 decimals), as strings to preserve precision
	earnings: string;
	balance: string;
	value: string;
};

// --------------------------------------------------------------------------
// Internal

export type BalanceCheckpoint = {
	created: number; // unix seconds
	balance: bigint; // running balance for the address right after this event
};

export type EarningsDelta = {
	created: number; // unix seconds
	perFPS: bigint; // signed delta, 18 decimals
};
