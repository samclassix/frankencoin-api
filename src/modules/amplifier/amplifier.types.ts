import { ChainId } from '@frankencoin/zchf';
import { Address } from 'viem';

// --------------------------------------------------------------------------
// Ponder return types
export type AmplifierStatusPonder = {
	chainId: ChainId;
	address: Address;
	pool: Address;
	usd: Address;
	zchf: Address;
	zchfIsToken0: boolean;
	expiration: string;
	limit: string;
	priceAnchorX96: string;
	totalBorrowed: string;
	positionCount: number;
	created: string;
	updated: string;
};

export type AmplifierPositionPonder = {
	chainId: ChainId;
	position: Address;
	amplifier: Address;
	owner: Address;
	tickLow: number;
	tickHigh: number;
	liquidity: string;
	borrowed: string;
	created: string;
	updated: string;
};

export type AmplifierActivityPonder = {
	chainId: ChainId;
	txHash: string;
	count: string;
	amplifier: Address;
	position: Address;
	kind: 'Mint' | 'Burn';
	liquidity: string;
	token0: string;
	token1: string;
	zchf: string;
	totalBorrowed: string;
	sender: Address;
	created: string;
	blockheight: string;
};

// --------------------------------------------------------------------------
// Service / API types
export type AmplifierQuery = {
	chainId: ChainId;
	address: Address;
	pool: Address;
	zchf: Address;
	usd: Address;
	usdSymbol: string; // 'USDT' | 'USDC'
	usdDecimals: number;
	zchfIsToken0: boolean;
	expiration: number; // unix seconds
	limit: string; // uint256, 18 decimals
	totalBorrowed: string; // uint256, 18 decimals
	positionCount: number;
	// valuation block (floats, human units)
	zchfAmount: number;
	usdAmount: number;
	usdPerZchf: number;
	poolValueZchf: number;
	avgCollRatio: number; // poolValueZchf / totalBorrowed
	asOf: number; // unix seconds of the valuation reads
};

export type AmplifierPositionQuery = {
	chainId: ChainId;
	position: Address;
	amplifier: Address;
	owner: Address;
	tickLow: number;
	tickHigh: number;
	liquidity: string; // uint128, from live totalLiquidity()
	borrowed: string; // uint256, 18 decimals
	created: number;
	// valuation at the same asOf as /amplifier/list
	zchfAmount: number;
	usdAmount: number;
};

export type AmplifierActivityQuery = {
	chainId: ChainId;
	txHash: string;
	count: number;
	amplifier: Address;
	position: Address;
	kind: 'Mint' | 'Burn';
	liquidity: string; // uint128
	token0: string; // uint256, token0 base units
	token1: string; // uint256, token1 base units
	zchf: string; // uint256, 18 decimals (borrowed on Mint / repaid on Burn)
	totalBorrowed: string; // uint256, 18 decimals, amplifier-wide after this event
	sender: Address;
	created: number;
	blockheight: number;
};

export type AmplifierQueryObjectArray = {
	[key: Address]: AmplifierQuery;
};

export type AmplifierPositionsObjectArray = {
	[key: Address]: AmplifierPositionQuery[];
};

export type AmplifierActivityObjectArray = {
	[key: Address]: AmplifierActivityQuery[];
};

// --------------------------------------------------------------------------
// Api
export type ApiAmplifierListing = {
	num: number;
	list: AmplifierQuery[];
};

export type ApiAmplifierPositions = {
	num: number;
	list: AmplifierPositionQuery[];
};

export type ApiAmplifierActivity = {
	num: number; // rows in this page
	total: number; // rows available for this amplifier
	list: AmplifierActivityQuery[];
};
