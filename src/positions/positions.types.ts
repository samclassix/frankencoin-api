import { Address } from 'viem';

export type PositionsQueryObjectArray = {
	[key: Address]: PositionQuery;
};

export type PositionQuery = {
	position: Address;
	owner: Address;
	zchf: Address;
	collateral: Address;
	price: string;

	created: number;
	isOriginal: boolean;
	isClone: boolean;
	denied: boolean;
	closed: boolean;
	original: Address;

	minimumCollateral: string;
	annualInterestPPM: number;
	reserveContribution: number;
	start: number;
	cooldown: number;
	expiration: number;
	challengePeriod: number;

	zchfName: string;
	zchfSymbol: string;
	zchfDecimals: number;

	collateralName: string;
	collateralSymbol: string;
	collateralDecimals: number;
	collateralBalance: string;

	limitForPosition: string;
	limitForClones: string;
	availableForPosition: string;
	availableForClones: string;
	minted: string;
};
