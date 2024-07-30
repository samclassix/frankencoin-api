import { CONFIG, CONFIG_PROFILE } from 'api.config';

export function ExplorerAddressUrl(address: string): string {
	const config = CONFIG[CONFIG_PROFILE];
	return config.chain.blockExplorers.default.url + `/address/${address}`;
}

export function AppUrl(path: string): string {
	const config = CONFIG[CONFIG_PROFILE];
	return `${config.chain.id == 1 ? 'https://app.frankencoin.com' : 'https://app.test.frankencoin.com'}${path}`;
}
