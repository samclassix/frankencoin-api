// --------------------------------------------------------------------------
// Ponder return types

// --------------------------------------------------------------------------
// Service

// --------------------------------------------------------------------------
// Api
export type ApiEcosystemFpsInfo = {
	values: {
		price: number;
		totalSupply: number;
		fpsMarketCapInChf: number;
	};
	raw: {
		price: string;
		totalSupply: string;
	};
};
