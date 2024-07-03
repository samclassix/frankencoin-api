import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { http, createPublicClient, Chain } from 'viem';
import { mainnet, polygon } from 'viem/chains';
// import { ethereum3 } from './contracts/chains';
import * as dotenv from 'dotenv';
dotenv.config();

// CONFIG
export const CONFIG_PROFILE = process.env.CONFIG_PROFILE || 'mainnet'; // <<<<<< SELECT DEFAULT CONFIG HERE <<<<<<
export const CONFIG: { [key: string]: { indexer: string; rpc: string; chain: Chain } } = {
	localhost: {
		indexer: 'http://localhost:42069',
		// rpc: ethereum3.rpcUrls.default.http[0],
		rpc: process.env.RPC_URL_POLYGON,
		chain: polygon,
	},
	localhostMainnet: {
		indexer: 'http://localhost:42069',
		rpc: process.env.RPC_URL_MAINNET,
		chain: mainnet,
	},
	mainnet: {
		indexer: 'https://ponder.frankencoin.com',
		rpc: process.env.RPC_URL_MAINNET,
		chain: mainnet,
	},
	developer: {
		indexer: 'https://ponder.frankencoin.3dotshub.com',
		rpc: process.env.RPC_URL_MAINNET,
		chain: mainnet,
	},
	frankencoinOrganizationTestnet: {
		indexer: 'https://ponder.frankencoin.org',
		rpc: process.env.RPC_URL_POLYGON,
		chain: polygon,
	},
};

// PONDER CLIENT REQUEST
export const PONDER_CLIENT = new ApolloClient({
	uri: CONFIG[CONFIG_PROFILE].indexer,
	cache: new InMemoryCache(),
});

// VIEM CONFIG
export const VIEM_CHAIN = CONFIG[CONFIG_PROFILE].chain;
export const VIEM_CONFIG = createPublicClient({
	chain: VIEM_CHAIN,
	transport: http(CONFIG[CONFIG_PROFILE].rpc),
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
