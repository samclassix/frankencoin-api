// TODO: migrate to @frankencoin/zchf once it exports the amplifier ABIs.
// Minimal vendored subset of AmplifiedPosition (contracts/swap/UniswapAmplifier.sol) — only what the API reads.
export const AmplifiedPositionABI = [
	{
		inputs: [],
		name: 'totalLiquidity',
		outputs: [{ internalType: 'uint128', name: 'liquidity', type: 'uint128' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const;
