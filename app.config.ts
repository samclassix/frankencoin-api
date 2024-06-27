import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { http, createPublicClient, Chain } from 'viem';
import { mainnet } from 'viem/chains';
import { ethereum3 } from './contracts/chains';

// URIs
export const URIS: { [key: string]: { app: string; api: string; ponder: string; chain: Chain } } = {
	localhost: {
		app: 'http://localhost:3000',
		api: 'http://localhost:3030',
		ponder: 'http://localhost:42069',
		chain: ethereum3,
	},
	mainnet: {
		app: 'https://app.frankencoin.com',
		api: 'https://api.frankencoin.com',
		ponder: 'https://ponder.frankencoin.com',
		chain: mainnet,
	},
	developer: {
		app: 'https://app.frankencoin.3dotshub.com',
		api: 'https://api.frankencoin.3dotshub.com',
		ponder: 'https://ponder.frankencoin.3dotshub.com',
		chain: mainnet,
	},
	frankencoinOrg: {
		app: 'https://app.frankencoin.org',
		api: 'https://api.frankencoin.org',
		ponder: 'https://ponder.frankencoin.org',
		chain: mainnet,
	},
};

// >>>>>> SELECTED URI HERE <<<<<<
export const URI_SELECTED = URIS.localhost;
// >>>>>> SELECTED URI HERE <<<<<<

// PONDER CLIENT REQUEST
export const PONDER_CLIENT = new ApolloClient({
	uri: URI_SELECTED.ponder,
	cache: new InMemoryCache(),
});

// VIEM CONFIG
// >>>>>> SELECTED CHAIN HERE <<<<<<
export const VIEM_CHAIN = URI_SELECTED.chain;
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
