import { Address } from 'viem';

// --------------------------------------------------------------------------------
export type ERC20InfoObjectArray = {
	[key: Address]: ERC20Info;
};

export type ERC20Info = {
	address: Address;
	name: string;
	symbol: string;
	decimals: number;
};

// --------------------------------------------------------------------------------
// TODO: Implement other currencies
export type PriceQueryCurrencies = {
	usd: number;
	// chf: number;
	// eur: number;
};

export type PriceQuery = ERC20Info & {
	timestamp: number;
	price: PriceQueryCurrencies;
};

export type PriceQueryObjectArray = {
	[key: Address]: PriceQuery;
};
