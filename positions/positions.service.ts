import { Injectable, Logger } from '@nestjs/common';
import { PONDER_CLIENT, VIEM_CONFIG } from '../app.config';
import { gql } from '@apollo/client/core';
import {
	ApiPositionsListing,
	ApiPositionsOwners,
	OwnersPositionsObjectArray,
	PositionQuery,
	PositionsQueryObjectArray,
} from './positions.types';
import { Address, erc20Abi, getAddress } from 'viem';
import { FIVEDAYS_MS } from 'utils/const-helper';

@Injectable()
export class PositionsService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedPositions: PositionsQueryObjectArray = {};

	constructor() {}

	getPositionsList(): ApiPositionsListing {
		const pos = this.fetchedPositions;
		return { num: Object.keys(pos).length, list: pos };
	}

	getPositionsOpen(): ApiPositionsListing {
		const pos = this.fetchedPositions;
		const open = Object.values(pos).filter((p) => !p.closed && !p.denied);
		const mapped: PositionsQueryObjectArray = {};
		for (const p of open) {
			mapped[p.position] = p;
		}
		return { num: Object.keys(mapped).length, list: mapped };
	}

	getPositionsRequests(): ApiPositionsListing {
		// FIXME: make time diff flexable, changeable between chains/SC
		const pos = this.fetchedPositions;
		const request = Object.values(pos).filter((p) => p.start * 1000 + FIVEDAYS_MS > Date.now());
		const mapped: PositionsQueryObjectArray = {};
		for (const p of request) {
			mapped[p.position] = p;
		}
		return { num: Object.keys(mapped).length, list: mapped };
	}

	getPositionsOwners(): ApiPositionsOwners {
		const ow: OwnersPositionsObjectArray = {};
		for (const p of Object.values(this.fetchedPositions)) {
			const owner = p.owner.toLowerCase();
			if (!ow[owner]) ow[owner] = [];
			ow[owner].push(p);
		}
		return {
			num: Object.keys(ow).length,
			owners: Object.keys(ow) as Address[],
			map: ow,
		};
	}

	async updatePositons() {
		this.logger.debug('Updating positions');
		const { data } = await PONDER_CLIENT.query({
			fetchPolicy: 'no-cache',
			query: gql`
				query {
					positions(orderBy: "availableForClones", orderDirection: "desc") {
						items {
							position
							owner
							zchf
							collateral
							price

							created
							isOriginal
							isClone
							denied
							closed
							original

							minimumCollateral
							annualInterestPPM
							reserveContribution
							start

							expiration
							challengePeriod

							zchfName
							zchfSymbol
							zchfDecimals

							collateralName
							collateralSymbol
							collateralDecimals
							collateralBalance

							limitForPosition
							limitForClones
							availableForPosition
							availableForClones
							minted
						}
					}
				}
			`,
		});

		if (!data || !data.positions) {
			this.logger.warn('No positions found.');
			return;
		}

		const list: PositionsQueryObjectArray = {};

		for (const p of data.positions.items as PositionQuery[]) {
			/// Forces the collateral balance to be overwritten with the latest blockchain state, instead of the ponder state.
			/// This ensures that collateral transfers can be made without using the smart contract or application directly,
			/// and the API will be aware of the updated state.
			const fetchedBalance = await VIEM_CONFIG.readContract({
				address: p.collateral,
				abi: erc20Abi,
				functionName: 'balanceOf',
				args: [p.position],
			});

			list[p.position.toLowerCase()] = {
				position: getAddress(p.position),
				owner: getAddress(p.owner),
				zchf: getAddress(p.zchf),
				collateral: getAddress(p.collateral),
				price: p.price,

				created: p.created,
				isOriginal: p.isOriginal,
				isClone: p.isClone,
				denied: p.denied,
				closed: p.closed,
				original: getAddress(p.original),

				minimumCollateral: p.minimumCollateral,
				annualInterestPPM: p.annualInterestPPM,
				reserveContribution: p.reserveContribution,
				start: p.start,
				cooldown: p.cooldown,
				expiration: p.expiration,
				challengePeriod: p.challengePeriod,

				zchfName: p.zchfName,
				zchfSymbol: p.zchfSymbol,
				zchfDecimals: p.zchfDecimals,

				collateralName: p.collateralName,
				collateralSymbol: p.collateralSymbol,
				collateralDecimals: p.collateralDecimals,
				collateralBalance: fetchedBalance.toString(),

				limitForPosition: p.limitForPosition,
				limitForClones: p.limitForClones,
				availableForPosition: p.availableForPosition,
				availableForClones: p.availableForClones,
				minted: p.minted,
			};
		}

		const a = Object.keys(list).length;
		const b = Object.keys(this.fetchedPositions).length;
		const isDiff = a !== b;

		if (isDiff) this.logger.log(`Positions merging, from ${b} to ${a} positions`);
		this.fetchedPositions = { ...this.fetchedPositions, ...list };

		return list;
	}
}
