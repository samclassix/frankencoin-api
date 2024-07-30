import { CONFIG, CONFIG_PROFILE } from 'api.config';

export function StartUpMessage(): string {
	const config = CONFIG[CONFIG_PROFILE];

	return `
*Hello again, from the Frankencoin API Bot!*

I have restarted and am back online, listening to changes within the Frankencoin ecosystem.

Api Version: ${process.env.npm_package_version}
Chain/Network: ${config.chain.name} (${config.chain.id})
Time: ${new Date().toString().split(' ').slice(0, 5).join(' ')}
                        `;
}
