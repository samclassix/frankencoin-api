import { zeroAddress } from 'viem';
import { Address } from 'viem/accounts';
import { mainnet, polygon } from 'viem/chains';
import { ethereum3 } from './chains';

export interface ProtocolAddress {
	frankenCoin: Address;
	bridge: Address;
	xchf: Address;
	equity: Address;
	mintingHub: Address;
	wFPS: Address;
	positionFactory?: Address;

	bridgePolygonFrankencoin?: Address;
	bridgePolygonWfps?: Address;
	bridgeArbitrumFrankencoin?: Address;
	bridgeArbitrumWfps?: Address;
	bridgeOptimismFrankencoin?: Address;
	bridgeOptimismWfps?: Address;
}

export const ADDRESS: Record<number, ProtocolAddress> = {
	[mainnet.id]: {
		frankenCoin: '0xB58E61C3098d85632Df34EecfB899A1Ed80921cB',
		bridge: '0x7bbe8F18040aF0032f4C2435E7a76db6F1E346DF',
		xchf: '0xb4272071ecadd69d933adcd19ca99fe80664fc08',
		equity: '0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2',
		mintingHub: '0x7546762fdb1a6d9146b33960545C3f6394265219',
		wFPS: '0x5052D3Cc819f53116641e89b96Ff4cD1EE80B182',

		bridgePolygonFrankencoin: '0x02567e4b14b25549331fCEe2B56c647A8bAB16FD',
		bridgeArbitrumFrankencoin: '0xB33c4255938de7A6ec1200d397B2b2F329397F9B',
		bridgeOptimismFrankencoin: '0x4F8a84C442F9675610c680990EdDb2CCDDB8aB6f',
		bridgePolygonWfps: '0x54Cc50D5CC4914F0c5DA8b0581938dC590d29b3D',
		bridgeArbitrumWfps: zeroAddress,
		bridgeOptimismWfps: zeroAddress,
	},
	[ethereum3.id]: {
		frankenCoin: '0x9800f06718bB6F7FCAC181ED26753E2E670cb9e0',
		bridge: zeroAddress,
		xchf: zeroAddress,
		equity: '0x97e3bbF39138B1e7E1d06dd26E7E3b9d558b00b2',
		mintingHub: '0xA0d6ce30a8a4eab09eD74f434dcA4Ce4169aDd03',
		wFPS: zeroAddress,
	},
	[polygon.id]: {
		// For testing purposes only
		frankenCoin: '0xAFAA1F380957072762b80dc9036c451bcd6e774f',
		bridge: zeroAddress,
		xchf: zeroAddress,
		equity: '0x9f40894a2E47305DE4C79b53B48B7a57805065eA',
		mintingHub: '0xa3039043B2C5a74A39b139e389b7591Ab76d20d1',
		wFPS: zeroAddress,
	},
};
