import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { http, createPublicClient } from 'viem';
import { mainnet } from 'viem/chains';
import { ethereum3 } from '../contracts/chains';

// URIs
export const PONDER_URI_LOCALHOST = 'http://localhost:42069';
export const PONDER_URI_MAINNET = 'https://mainnetponder.frankencoin.com';
export const PONDER_URI_MAINDEV = 'https://maindevponder.frankencoin.com';
export const PONDER_URI_DEVELOPER = 'https://ponder.frankencoin.3dotshub.com';
export const PONDER_URI_DEVELOPER_ETH3 = 'https://eth3.ponder.frankencoin.3dotshub.com';

// >>>>>> SELECTED URI HERE <<<<<<
export const PONDER_URI_SELECTED = PONDER_URI_DEVELOPER;
// >>>>>> SELECTED URI HERE <<<<<<

// PONDER CLIENT REQUEST
export const PONDER_CLIENT = new ApolloClient({
	uri: PONDER_URI_SELECTED,
	cache: new InMemoryCache(),
});

// VIEM CONFIG
// >>>>>> SELECTED CHAIN HERE <<<<<<
export const VIEM_CHAIN = mainnet;
export const VIEM_CONFIG = createPublicClient({
	chain: VIEM_CHAIN,
	transport: http(
		(VIEM_CHAIN.id as number) === 1
			? process.env.ETHEREUM_RPC_URL || mainnet.rpcUrls.default.http[0]
			: ethereum3.rpcUrls.default.http[0]
	),
});

// COINGECKO API KEY
// FIXME: move to env or white list domain
export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || 'CG-8et9S7NgcRF3qDs3nghcxPz5'; // demo key @samclassix

// COINGECKO CLIENT
export const COINGECKO_CLIENT = (query: string) => {
	const hasParams = query.includes('?');
	const uri: string = `https://api.coingecko.com${query}`;
	return fetch(hasParams ? `${uri}&${COINGECKO_API_KEY}` : `${uri}?${COINGECKO_API_KEY}`);
};
