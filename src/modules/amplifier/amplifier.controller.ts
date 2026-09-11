import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { isAddress, zeroAddress } from 'viem';
import { normalizeAddress } from 'utils/format';
import { AMPLIFIER_ACTIVITY_DEFAULT_LIMIT, AMPLIFIER_ACTIVITY_MAX_LIMIT, AmplifierService } from './amplifier.service';
import { ApiAmplifierActivity, ApiAmplifierListing, ApiAmplifierPositions } from './amplifier.types';

@ApiTags('Amplifier')
@Controller('amplifier')
export class AmplifierController {
	constructor(private readonly amplifier: AmplifierService) {}

	@Get('list')
	@ApiOperation({
		summary: 'Get all amplifiers',
		description:
			'Returns: ApiAmplifierListing, all production UniswapAmplifier minters (Ethereum mainnet and Optimism) with their ' +
			'contract parameters, total borrowed ZCHF, and a live valuation of the Uniswap v3 liquidity backing the debt. ' +
			'The valuation is computed from the current pool price (slot0) and the live liquidity of every amplified position; ' +
			'uncollected fees are excluded. Refreshed about once per minute.',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns an array of all amplifiers with parameters and valuation',
		schema: {
			type: 'ApiAmplifierListing',
			properties: {
				num: { type: 'number', description: 'Total number of amplifiers' },
				list: {
					type: 'array',
					description: 'Array of amplifier objects',
					items: {
						type: 'object',
						properties: {
							chainId: { type: 'number', description: 'Blockchain chain ID' },
							address: { type: 'string', description: 'UniswapAmplifier contract address' },
							pool: { type: 'string', description: 'Uniswap v3 pool address' },
							zchf: { type: 'string', description: 'ZCHF token address on this chain' },
							usd: { type: 'string', description: 'USD stablecoin address (USDT / USDC)' },
							usdSymbol: { type: 'string', description: 'USD stablecoin symbol' },
							usdDecimals: { type: 'number', description: 'USD stablecoin decimals' },
							zchfIsToken0: { type: 'boolean', description: 'Whether ZCHF is token0 of the pool' },
							expiration: { type: 'number', description: 'Amplifier expiration (Unix seconds)' },
							limit: { type: 'string', description: 'Borrowing limit in ZCHF (bigint as string, 18 decimals)' },
							totalBorrowed: { type: 'string', description: 'Total borrowed ZCHF (bigint as string, 18 decimals)' },
							positionCount: { type: 'number', description: 'Number of amplified positions' },
							zchfAmount: { type: 'number', description: 'ZCHF held by all positions at the current price' },
							usdAmount: { type: 'number', description: 'USD held by all positions at the current price' },
							usdPerZchf: { type: 'number', description: 'Current pool price in USD per ZCHF' },
							poolValueZchf: { type: 'number', description: 'Redemption value of all positions in ZCHF' },
							avgCollRatio: { type: 'number', description: 'poolValueZchf / totalBorrowed' },
							asOf: { type: 'number', description: 'Timestamp of the valuation reads (Unix seconds)' },
						},
					},
				},
			},
			example: {
				num: 1,
				list: [
					{
						chainId: 10,
						address: '0x15CE921192ad967Eb65ea1cc508DfA21120F0d8F',
						pool: '0xC8A2E29D58B91C37a9d8DC6ab2535EB0b42C8F4b',
						zchf: '0xd4DD9e2F021bB459D5A5F6c24c12fe09C5d45553',
						usd: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
						usdSymbol: 'USDC',
						usdDecimals: 6,
						zchfIsToken0: false,
						expiration: 1806537599,
						limit: '1000000000000000000000000',
						totalBorrowed: '167943316186082802573517',
						positionCount: 2,
						zchfAmount: 168142.894861801,
						usdAmount: 181504.10346831966,
						usdPerZchf: 1.2363688819712386,
						poolValueZchf: 314947.06157532556,
						avgCollRatio: 1.8753176293513012,
						asOf: 1788480000,
					},
				],
			},
		},
	})
	getList(): ApiAmplifierListing {
		return this.amplifier.getList();
	}

	@Get('positions/:address')
	@ApiOperation({
		summary: 'Get positions of an amplifier',
		description:
			'Returns: ApiAmplifierPositions, all amplified position clones of one amplifier with their tick range, live liquidity, ' +
			'borrowed ZCHF, and their current token composition (valued at the same time as /amplifier/list). ' +
			'Returns an empty listing for unknown or invalid addresses.',
	})
	@ApiParam({
		name: 'address',
		description: 'UniswapAmplifier contract address',
		example: '0x15CE921192ad967Eb65ea1cc508DfA21120F0d8F',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns an array of positions of the amplifier',
		schema: {
			type: 'ApiAmplifierPositions',
			properties: {
				num: { type: 'number', description: 'Number of positions' },
				list: {
					type: 'array',
					description: 'Array of position objects',
					items: {
						type: 'object',
						properties: {
							chainId: { type: 'number', description: 'Blockchain chain ID' },
							position: { type: 'string', description: 'AmplifiedPosition clone address' },
							amplifier: { type: 'string', description: 'UniswapAmplifier contract address' },
							owner: { type: 'string', description: 'Position owner address' },
							tickLow: { type: 'number', description: 'Lower tick of the range' },
							tickHigh: { type: 'number', description: 'Upper tick of the range' },
							liquidity: { type: 'string', description: 'Live liquidity (uint128 as string)' },
							borrowed: { type: 'string', description: 'Borrowed ZCHF (bigint as string, 18 decimals)' },
							created: { type: 'number', description: 'Creation timestamp (Unix seconds)' },
							zchfAmount: { type: 'number', description: 'ZCHF held by this position at the current price' },
							usdAmount: { type: 'number', description: 'USD held by this position at the current price' },
						},
					},
				},
			},
			example: {
				num: 1,
				list: [
					{
						chainId: 10,
						position: '0x8a80080D0b4C9c2A0FdA98C55f681dFfBB06Eb0A',
						amplifier: '0x15CE921192ad967Eb65ea1cc508DfA21120F0d8F',
						owner: '0x0A638e3386b8b829f6d823Bf10AcDD641E1b6026',
						tickLow: 274090,
						tickHigh: 274300,
						liquidity: '33441728943382046756',
						borrowed: '167943316186082802573517',
						created: 1788467515,
						zchfAmount: 168142.894861801,
						usdAmount: 181504.10346831966,
					},
				],
			},
		},
	})
	getPositions(@Param('address') address: string): ApiAmplifierPositions {
		if (!isAddress(address)) address = zeroAddress;
		return this.amplifier.getPositions(normalizeAddress(address));
	}

	@Get('activity/:address')
	@ApiOperation({
		summary: 'Get activity of an amplifier',
		description:
			'Returns: ApiAmplifierActivity, the Mint/Burn log of all positions of one amplifier, newest first. ' +
			'Supports pagination via limit (default 50, max 500) and offset. ' +
			'Returns an empty listing for unknown or invalid addresses.',
	})
	@ApiParam({
		name: 'address',
		description: 'UniswapAmplifier contract address',
		example: '0x15CE921192ad967Eb65ea1cc508DfA21120F0d8F',
	})
	@ApiQuery({ name: 'limit', required: false, description: 'Rows per page (default 50, max 500)' })
	@ApiQuery({ name: 'offset', required: false, description: 'Rows to skip (default 0)' })
	@ApiResponse({
		status: 200,
		description: 'Returns a page of Mint/Burn activity rows',
		schema: {
			type: 'ApiAmplifierActivity',
			properties: {
				num: { type: 'number', description: 'Number of rows in this page' },
				total: { type: 'number', description: 'Total number of rows for this amplifier' },
				list: {
					type: 'array',
					description: 'Array of activity objects, newest first',
					items: {
						type: 'object',
						properties: {
							chainId: { type: 'number', description: 'Blockchain chain ID' },
							txHash: { type: 'string', description: 'Transaction hash' },
							count: { type: 'number', description: 'Sequential activity counter' },
							amplifier: { type: 'string', description: 'UniswapAmplifier contract address' },
							position: { type: 'string', description: 'AmplifiedPosition clone address' },
							kind: { type: 'string', description: 'Activity type: Mint or Burn' },
							liquidity: { type: 'string', description: 'Liquidity added or removed (uint128 as string)' },
							token0: { type: 'string', description: 'token0 amount (bigint as string, base units)' },
							token1: { type: 'string', description: 'token1 amount (bigint as string, base units)' },
							zchf: { type: 'string', description: 'ZCHF borrowed (Mint) or repaid (Burn), 18 decimals' },
							totalBorrowed: { type: 'string', description: 'Amplifier-wide total borrowed after this event' },
							sender: { type: 'string', description: 'Transaction sender' },
							created: { type: 'number', description: 'Timestamp (Unix seconds)' },
							blockheight: { type: 'number', description: 'Block number' },
						},
					},
				},
			},
			example: {
				num: 1,
				total: 1,
				list: [
					{
						chainId: 10,
						txHash: '0x7fb6dfce68460a51fa2dbde8fc2f36c2f8664d5be3cd0fa6e317436bc78bb145',
						count: 76,
						amplifier: '0x15CE921192ad967Eb65ea1cc508DfA21120F0d8F',
						position: '0x8a80080D0b4C9c2A0FdA98C55f681dFfBB06Eb0A',
						kind: 'Mint',
						liquidity: '33441728943382046756',
						token0: '181750857970',
						token1: '167943316186082802573517',
						zchf: '167943316186082802573517',
						totalBorrowed: '167943316186082802573517',
						sender: '0x0A638e3386b8b829f6d823Bf10AcDD641E1b6026',
						created: 1788467553,
						blockheight: 156434388,
					},
				],
			},
		},
	})
	getActivity(@Param('address') address: string, @Query('limit') limit?: string, @Query('offset') offset?: string): ApiAmplifierActivity {
		if (!isAddress(address)) address = zeroAddress;
		const parsedLimit = Math.min(Math.max(parseInt(limit) || AMPLIFIER_ACTIVITY_DEFAULT_LIMIT, 1), AMPLIFIER_ACTIVITY_MAX_LIMIT);
		const parsedOffset = Math.max(parseInt(offset) || 0, 0);
		return this.amplifier.getActivity(normalizeAddress(address), parsedLimit, parsedOffset);
	}
}
