import { Injectable, Logger } from '@nestjs/common';
import { VIEM_CONFIG } from 'app.config';
import { ApiEcosystemFpsInfo } from './ecosystem.fps.types';
import { ABIS, ADDRESS } from 'contracts';

@Injectable()
export class EcosystemFpsService {
	private readonly logger = new Logger(this.constructor.name);

	async getEcosystemFpsInfo(): Promise<ApiEcosystemFpsInfo> {
		const chainId = VIEM_CONFIG.chain.id;
		const addr = ADDRESS[chainId].equity;

		const fetchedPrice = await VIEM_CONFIG.readContract({
			address: addr,
			abi: ABIS.EquityABI,
			functionName: 'price',
		});
		const fetchedTotalSupply = await VIEM_CONFIG.readContract({
			address: addr,
			abi: ABIS.EquityABI,
			functionName: 'totalSupply',
		});

		const p = parseInt(fetchedPrice.toString()) / 1e18;
		const s = parseInt(fetchedTotalSupply.toString()) / 1e18;

		return {
			values: {
				price: p,
				totalSupply: s,
				fpsMarketCapInChf: p * s,
			},
			raw: {
				price: fetchedPrice.toString(),
				totalSupply: fetchedTotalSupply.toString(),
			},
		};
	}
}
