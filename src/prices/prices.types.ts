import { ERC20Info } from 'src/positions/positions.types';
import { Address } from 'viem';

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
