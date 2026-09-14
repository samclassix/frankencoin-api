# Task: Amplifier endpoints for the Frankencoin API

Self-contained implementation instructions for adding amplifier support to this API
(`@frankencoin/api`). Companion task: the ponder indexer side is specified in the ponder repo at
`docs/amplifier-indexing-task.md` and may be implemented in parallel — the interface contract
between the two is restated below, so this document does not depend on reading that one.

## Background

**UniswapAmplifiers** are Frankencoin minters that let users provide liquidity to a ZCHF/USD
Uniswap v3 pool while only supplying the dollar side — the ZCHF side is minted ("borrowed") by
the amplifier. Users hold **AmplifiedPosition** clone contracts (one per position, factory
pattern). Two production amplifiers exist:

| | Ethereum Mainnet | Optimism |
|---|---|---|
| UniswapAmplifier | `0xa1304E5Aaf83CDB7c2b367F50B99Bb0647ED8C58` | `0x15CE921192ad967Eb65ea1cc508DfA21120F0d8F` |
| Uniswap v3 pool | `0x8e4318e2cb1ae291254b187001a59a1f8ac78cef` (ZCHF/USDT, ZCHF = token0) | `0xC8A2E29D58B91C37a9d8DC6ab2535EB0b42C8F4b` (ZCHF/USDC, ZCHF = token1) |
| Borrowing limit | 2,500,000 ZCHF | 1,000,000 ZCHF |
| Expiration | 1806537599 (2027-03-31) | same |

**Goal:** serve amplifier data to the dApp's monitoring page — per-amplifier totals with a live
valuation of the Uniswap positions, a position list, and an activity log — and fold amplifier
debt/backing into the collateralization-ratio history.

**Design principle (agreed, do not deviate):** the indexer stores event-sourced facts only
(positions, ticks, liquidity, borrowed amounts). All **valuation** happens here, in this API,
because a Uniswap v3 position's token composition is a closed-form function of
(liquidity, tick range, current pool price) — one `slot0()` read per pool replaces any
swap-event tracking. No swap indexing exists and none should be requested.

## Interface contract: what ponder provides (GraphQL)

Three tables, all keyed with `chainId` (only chains 1 and 10 will have rows). Introspect the
GraphQL schema of the configured ponder instance for exact query/field casing before writing
queries — follow how the existing services build their `gql` documents.

- **`AmplifierStatus`** — one row per amplifier per chain: `chainId`, `address`, `pool`, `usd`,
  `zchf`, `zchfIsToken0`, `expiration`, `limit`, `priceAnchorX96`, `totalBorrowed` (kept exactly
  in sync with the contract's `totalBorrowed()`), `positionCount`, `created`, `updated`.
- **`AmplifierPosition`** — one row per position clone: `chainId`, `position`, `amplifier`,
  `owner`, `tickLow`, `tickHigh`, `liquidity`, `borrowed`, `created`, `updated`.
  Caveat: `liquidity` can undercount if liquidity was donated to a clone directly on the pool
  (no event fires) — the live `totalLiquidity()` read is authoritative; see valuation below.
- **`AmplifierActivity`** — append-only Mint/Burn log: `chainId`, `txHash`, `count`,
  `amplifier`, `position`, `kind` (`'Mint'`/`'Burn'`), `liquidity`, `token0`, `token1`, `zchf`,
  `totalBorrowed`, `sender`, `created`, `blockheight`.

The test amplifier (`0x560E…2dA7`, expired) is not indexed and must not appear anywhere.

## Contract ABI

`@frankencoin/zchf` does not export the amplifier ABIs yet. Vendor a minimal local ABI (e.g.
`src/modules/amplifier/amplifier.abi.ts`) with just what the API reads: on `AmplifiedPosition`
the function `totalLiquidity() → uint128`; on the pool, `slot0()` is already available via
`UniswapV3PoolABI` from `@frankencoin/zchf`; ERC20 `symbol`/`decimals` via viem's `erc20Abi`.
Copy from the dApp repo `abis/UniswapAmplifier.ts` or the contracts repo
`abi/contracts/swap/UniswapAmplifier.sol/`. Leave a `// TODO: migrate to @frankencoin/zchf` note.

## Module scaffolding — follow the repo's existing conventions exactly

New folder `src/modules/amplifier/` with:

- `amplifier.types.ts` — query/response types (below)
- `amplifier.service.ts` — cached state + `update…()` methods
- `amplifier.controller.ts` — `@Controller('amplifier')` with Swagger annotations
  (`@ApiTags('Amplifier')`, `@ApiOperation`, `@ApiResponse`), mirroring
  `positions.controller.ts`
- `amplifier.module.ts` — registered in `src/app.module.ts`

Wire the refresh into `ApiService.updateWorkflow()` in `src/app.service.ts` with the guard
pattern used there:

```ts
if (this.guard('amplifiers', MIN)) promises.push(this.amplifier.updateAmplifiers());
```

One minute matches the freshness of a monitoring row; positions/activity can refresh in the
same method (they change rarely; the GraphQL queries are cheap).

## Service logic

`updateAmplifiers()` does, per chain (1 and 10):

1. Query the three ponder tables via `DataSourceManagerService` (primary/backup failover, same
   as `positions.service.ts`).
2. Once per amplifier (cache after first success): read `symbol`/`decimals` of the `usd` token
   via `VIEM_CONFIG[chainId]`.
3. Live multicall via `VIEM_CONFIG[chainId]`: `slot0()` on the pool and `totalLiquidity()` on
   every position clone. Use the returned `totalLiquidity()` as each position's liquidity
   (fall back to the indexed value if a read fails).
4. Compute the valuation (next section) and store everything in in-memory maps, following the
   `fetched…` field convention.

### Valuation math (floating point is fine — this is display-grade, not settlement-grade)

For each position with liquidity `L` and range `[tickLow, tickHigh]`, with
`sqrtP = Number(sqrtPriceX96) / 2**96`, `sqrtPa = 1.0001**(tickLow/2)`,
`sqrtPb = 1.0001**(tickHigh/2)`:

```
if sqrtP <= sqrtPa:  amount0 = L * (1/sqrtPa - 1/sqrtPb);   amount1 = 0
if sqrtP >= sqrtPb:  amount0 = 0;                           amount1 = L * (sqrtPb - sqrtPa)
else:                amount0 = L * (1/sqrtP - 1/sqrtPb);    amount1 = L * (sqrtP - sqrtPa)
```

`amount0`/`amount1` are in **base units** of token0/token1. Map to ZCHF/USD via
`zchfIsToken0` (from `AmplifierStatus`), then convert to human units with the decimals
(ZCHF: 18; USDT/USDC: 6). These formulas are exactly what the pool pays out on burn, so the
result is the redemption value at the current price (excluding uncollected fees — deliberately
ignored, they belong to the position owners; note this in a comment).

Price for the USD leg, uniform across both chains:

```
rawPrice   = sqrtP * sqrtP                          // token1 per token0, base units
usdPerZchf = (zchfIsToken0 ? rawPrice : 1/rawPrice) * 10**(18 - usdDecimals)
```

Sanity anchor: `usdPerZchf` must come out near 1.25 on mainnet and near 1.24 on Optimism
(deployment anchors 1.2525 USDT/ZCHF and 1.2364 USDC/ZCHF). If it comes out as ~0.8 or some
power of ten off, the orientation or decimals handling is wrong — fix it, do not "correct"
with a magic factor.

Per amplifier:

```
zchfAmount    = Σ position zchf amounts        (human units)
usdAmount     = Σ position usd amounts         (human units)
poolValueZchf = zchfAmount + usdAmount / usdPerZchf
avgCollRatio  = totalBorrowed > 0 ? poolValueZchf / totalBorrowed(human) : 0
```

## Endpoints

Follow the response conventions of the existing modules: `{ num, list }` wrappers, uint256
values serialized as **strings**, addresses checksummed or normalized like the neighboring
modules do it.

### `GET /amplifier/list`

Everything the monitoring page needs in one call. Returns `ApiAmplifierListing`:

```ts
export type AmplifierQuery = {
	chainId: number;
	address: Address;
	pool: Address;
	zchf: Address;
	usd: Address;
	usdSymbol: string;      // 'USDT' | 'USDC'
	usdDecimals: number;
	zchfIsToken0: boolean;
	expiration: number;     // unix seconds
	limit: string;          // uint256, 18 decimals
	totalBorrowed: string;  // uint256, 18 decimals
	positionCount: number;
	// valuation block (floats, human units)
	zchfAmount: number;
	usdAmount: number;
	usdPerZchf: number;
	poolValueZchf: number;
	avgCollRatio: number;   // poolValueZchf / totalBorrowed
	asOf: number;           // unix seconds of the valuation reads
};
export type ApiAmplifierListing = { num: number; list: AmplifierQuery[] };
```

### `GET /amplifier/positions/:address`

Positions of one amplifier (`:address` = amplifier address; resolve the chain from the cached
status map — the two amplifier addresses are distinct, no chain parameter needed; validate with
`isAddress` and return an empty listing for unknown addresses, mirroring how existing
controllers handle bad params). Returns `ApiAmplifierPositions`:

```ts
export type AmplifierPositionQuery = {
	chainId: number;
	position: Address;
	amplifier: Address;
	owner: Address;
	tickLow: number;
	tickHigh: number;
	liquidity: string;   // uint128, from live totalLiquidity()
	borrowed: string;    // uint256, 18 decimals
	created: number;
	// valuation at the same asOf as /amplifier/list
	zchfAmount: number;
	usdAmount: number;
};
export type ApiAmplifierPositions = { num: number; list: AmplifierPositionQuery[] };
```

### `GET /amplifier/activity/:address`

Mint/Burn log of one amplifier, newest first. Support `?limit=` (default 50, max 500) and
`?offset=` unless the neighboring modules use a different pagination idiom — if they do, copy
theirs. Returns `ApiAmplifierActivity` with rows matching the `AmplifierActivity` table
(uint values as strings, plus `kind`, `txHash`, `position`, `sender`, `created`).

## Health-ratio inclusion

`updateHistoryRatio()` in `src/modules/prices/prices.history.service.ts` appends the current
collateralization ratio to a stored daily series. It already includes the CHFAU stablecoin
bridge as an extra entry beside the collateral positions. Add the amplifiers the same way,
right after the `stablecoinBridges` block:

```ts
const amplifiers = this.amplifier.getList().list.map((a) => ({
	minted: formatFloat(BigInt(a.totalBorrowed), 18),
	marketPrice: a.avgCollRatio, // poolValue per 1 ZCHF of amplifier debt
	liqPrice: 1,
}));
const data = [...positionData, ...stablecoinBridges, ...amplifiers];
```

(`minted × marketPrice / liqPrice` then contributes exactly `poolValueZchf`.)

**Consistency check before enabling the Optimism amplifier here:** the ratio divides by
`this.frankencoin.getEcosystemFrankencoinInfo().token.supply`. Verify whether that supply is
the cross-chain total (including bridged ZCHF on Optimism) or mainnet-only:

- Cross-chain total → include **both** amplifiers (debt on Optimism is in the denominator, so
  its backing belongs in the numerator).
- Mainnet-only → include **only the mainnet amplifier**, and leave a comment explaining why.

Whichever branch applies, state it in a code comment. Symmetry between numerator and
denominator matters more than including everything. Since the series is append-only going
forward, no historical backfill is needed — amplifier inclusion simply starts on deploy day.

## Package exports

- Add `export * from '../src/modules/amplifier/amplifier.types';` to `exports/index.ts` so the
  dApp gets the types from `@frankencoin/api`.
- Bump the package version (minor), per repo habit.

## Validation (do all of these)

1. `yarn lint`, `yarn build`, tests pass.
2. Run locally against the production ponder (`yarn dev`) and check:
   - `/amplifier/list` returns 2 entries; `limit` and `expiration` match the deployment table
     above; `totalBorrowed` equals a direct `totalBorrowed()` `cast call`/viem read on each
     amplifier at the same time.
   - `usdPerZchf` ≈ 1.25 (mainnet) / 1.24 (Optimism); `poolValueZchf ≥` the sum of position
     `zchfAmount`s; `avgCollRatio` is plausibly ≥ ~1.7 (positions must post ≥ 0.8 × anchor in
     dollars per borrowed ZCHF, plus the ZCHF side itself) — a value near 1.0 or above 10
     indicates a math/orientation bug.
   - `/amplifier/positions/:address` counts match `positionCount`, and each position's
     `zchfAmount + usdAmount/usdPerZchf` sums (across positions) to `poolValueZchf`.
   - `/amplifier/activity/:address` row counts match the clones' Mint/Burn events on
     Etherscan / OP-Etherscan.
   - Unknown address on both `:address` endpoints → empty listing, HTTP 200 (no 500s).
3. Confirm one daily `updateHistoryRatio` run logs no errors and the appended ratio moved by a
   plausible small amount versus the previous day.

## Out of scope (do not build)

- Any ponder/schema changes (separate task in the ponder repo).
- Swap-event based valuation, historical valuation backfill, price time series for the
  Optimism pool.
- Telegram notifications for amplifier events.
- dApp changes (the dApp will consume these endpoints in a follow-up task).
