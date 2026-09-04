import { positionAmounts, sqrtPriceFromX96, usdPerZchf } from './amplifier.math';

// Live Optimism snapshot (ZCHF/USDC pool 0xC8A2...8F4b, ZCHF = token1), 2026-09-04
const OP_SQRT_PRICE_X96 = 0xdb910428749ef2d1722861e24aa5bn;
const OP_POSITION = { liquidity: 33441728943382046756n, tickLow: 274090, tickHigh: 274300 };

// Live Mainnet snapshot (ZCHF/USDT pool 0x8e43...8cef, ZCHF = token0), 2026-09-04
const MAINNET_SQRT_PRICE_X96 = 0x12a9fbf374916532bc46n;

describe('amplifier math', () => {
	it('prices ZCHF in USD near the deployment anchors on both chains', () => {
		const op = usdPerZchf(sqrtPriceFromX96(OP_SQRT_PRICE_X96), false, 6);
		expect(op).toBeGreaterThan(1.2);
		expect(op).toBeLessThan(1.3);

		const mainnet = usdPerZchf(sqrtPriceFromX96(MAINNET_SQRT_PRICE_X96), true, 6);
		expect(mainnet).toBeGreaterThan(1.2);
		expect(mainnet).toBeLessThan(1.3);
	});

	it('values an in-range position with both legs and a plausible collateral ratio', () => {
		const sqrtP = sqrtPriceFromX96(OP_SQRT_PRICE_X96);
		const { amount0, amount1 } = positionAmounts(OP_POSITION.liquidity, OP_POSITION.tickLow, OP_POSITION.tickHigh, sqrtP);
		const usd = amount0 / 1e6;
		const zchf = amount1 / 1e18;
		const price = usdPerZchf(sqrtP, false, 6);
		const borrowed = Number(167943316186082802573517n) / 1e18;

		expect(usd).toBeGreaterThan(100_000);
		expect(zchf).toBeGreaterThan(100_000);
		const ratio = (zchf + usd / price) / borrowed;
		expect(ratio).toBeGreaterThan(1.7);
		expect(ratio).toBeLessThan(3);
	});

	it('puts an out-of-range position entirely into one token', () => {
		const below = positionAmounts(1_000_000n, 100, 200, 1.0001 ** (50 / 2));
		expect(below.amount1).toBe(0);
		expect(below.amount0).toBeGreaterThan(0);

		const above = positionAmounts(1_000_000n, 100, 200, 1.0001 ** (250 / 2));
		expect(above.amount0).toBe(0);
		expect(above.amount1).toBeGreaterThan(0);
	});

	it('values zero liquidity as zero', () => {
		expect(positionAmounts(0n, 100, 200, 1.0001 ** (150 / 2))).toEqual({ amount0: 0, amount1: 0 });
	});
});
