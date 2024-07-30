import { Injectable, Logger } from '@nestjs/common';
import { PONDER_CLIENT } from '../api.config';
import { gql } from '@apollo/client/core';
import { ApiMinterListing, ApiMinterMapping, MinterQuery, MinterQueryObjectArray } from './ecosystem.minter.types';
import { Address } from 'viem';

@Injectable()
export class EcosystemMinterService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedMinters: MinterQueryObjectArray = {};

	getMintersList(): ApiMinterListing {
		const m = Object.values(this.fetchedMinters) as MinterQuery[];
		return {
			num: m.length,
			list: m,
		};
	}

	getMintersMapping(): ApiMinterMapping {
		const m = this.fetchedMinters;
		return {
			num: Object.keys(m).length,
			addresses: Object.keys(m) as Address[],
			map: m,
		};
	}

	async updateMinters() {
		this.logger.debug('Updating minters');
		const { data } = await PONDER_CLIENT.query({
			fetchPolicy: 'no-cache',
			query: gql`
				query {
					minters(orderBy: "id", limit: 1000) {
						items {
							id
							minter
							applicationPeriod
							applicationFee
							applyMessage
							applyDate
							suggestor
							denyMessage
							denyDate
							vetor
						}
					}
				}
			`,
		});

		if (!data || !data.minters) {
			this.logger.warn('No minters found.');
			return;
		}

		const list: MinterQueryObjectArray = {};
		for (const m of data.minters.items as MinterQuery[]) {
			list[m.id.toLowerCase() as Address] = {
				id: m.id,
				minter: m.minter,
				applicationPeriod: m.applicationPeriod,
				applicationFee: m.applicationFee,
				applyMessage: m.applyMessage,
				applyDate: m.applyDate,
				suggestor: m.suggestor,
				denyMessage: m.denyMessage,
				denyDate: m.denyDate,
				vetor: m.vetor,
			};
		}

		const a = Object.keys(list).length;
		const b = Object.keys(this.fetchedMinters).length;
		const isDiff = a !== b;

		if (isDiff) this.logger.log(`Minters merging, from ${b} to ${a} entries`);
		this.fetchedMinters = { ...this.fetchedMinters, ...list };

		return list;
	}
}
