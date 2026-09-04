// Uniswap v3 position valuation.
//
// A v3 position's token composition is a closed-form function of (liquidity, tick range, current pool price),
// so one slot0() read per pool is enough to value every position in it. These are exactly the amounts the pool
// pays out on burn, i.e. the redemption value at the current price. Uncollected fees are deliberately ignored —
// they belong to the position owners, not to the amplifier's backing.
//
// Floating point is fine here: this is display-grade, not settlement-grade.

const Q96 = 2 ** 96;

export type PositionAmounts = {
	amount0: number; // base units of token0
	amount1: number; // base units of token1
};

export function sqrtPriceFromX96(sqrtPriceX96: bigint): number {
	return Number(sqrtPriceX96) / Q96;
}

export function sqrtPriceFromTick(tick: number): number {
	return 1.0001 ** (tick / 2);
}

export function positionAmounts(liquidity: bigint, tickLow: number, tickHigh: number, sqrtP: number): PositionAmounts {
	const L = Number(liquidity);
	const sqrtPa = sqrtPriceFromTick(tickLow);
	const sqrtPb = sqrtPriceFromTick(tickHigh);

	if (sqrtP <= sqrtPa) {
		// entirely token0
		return { amount0: L * (1 / sqrtPa - 1 / sqrtPb), amount1: 0 };
	} else if (sqrtP >= sqrtPb) {
		// entirely token1
		return { amount0: 0, amount1: L * (sqrtPb - sqrtPa) };
	} else {
		return { amount0: L * (1 / sqrtP - 1 / sqrtPb), amount1: L * (sqrtP - sqrtPa) };
	}
}

// Price of one ZCHF in USD (human units), uniform across pools regardless of token ordering.
export function usdPerZchf(sqrtP: number, zchfIsToken0: boolean, usdDecimals: number, zchfDecimals: number = 18): number {
	const rawPrice = sqrtP * sqrtP; // token1 per token0, base units
	return (zchfIsToken0 ? rawPrice : 1 / rawPrice) * 10 ** (zchfDecimals - usdDecimals);
}
