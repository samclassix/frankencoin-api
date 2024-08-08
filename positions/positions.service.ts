import { Injectable, Logger } from '@nestjs/common';
import { PONDER_CLIENT, VIEM_CONFIG } from '../api.config';
import { gql } from '@apollo/client/core';
import {
	ApiPositionsListing,
	ApiPositionsMapping,
	ApiPositionsOwners,
	OwnersPositionsObjectArray,
	PositionQuery,
	PositionsQueryObjectArray,
} from './positions.types';
import { Address, erc20Abi, getAddress } from 'viem';
import { FIVEDAYS_MS } from 'utils/const-helper';
import { PositionABI } from 'contracts/abis/Position';

@Injectable()
export class PositionsService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedPositions: PositionsQueryObjectArray = {};

	constructor() {}

	getPositionsList(): ApiPositionsListing {
		const pos = Object.values(this.fetchedPositions) as PositionQuery[];
		return {
			num: pos.length,
			list: pos,
		};
	}

	getPositionsMapping(): ApiPositionsMapping {
		const pos = this.fetchedPositions;
		return { num: Object.keys(pos).length, addresses: Object.keys(pos) as Address[], map: pos };
	}

	getPositionsOpen(): ApiPositionsMapping {
		const pos = this.getPositionsList().list;
		const open = pos.filter((p) => !p.closed && !p.denied);
		const mapped: PositionsQueryObjectArray = {};
		for (const p of open) {
			mapped[p.position] = p;
		}
		return { num: Object.keys(mapped).length, addresses: Object.keys(mapped) as Address[], map: mapped };
	}

	getPositionsRequests(): ApiPositionsMapping {
		const pos = this.getPositionsList().list;
		// FIXME: make time diff flexable, changeable between chains/SC
		const request = pos.filter((p) => p.start * 1000 + FIVEDAYS_MS > Date.now());
		const mapped: PositionsQueryObjectArray = {};
		for (const p of request) {
			mapped[p.position] = p;
		}
		return { num: Object.keys(mapped).length, addresses: Object.keys(mapped) as Address[], map: mapped };
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
							cooldown
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

		const items: PositionQuery[] = data.positions.items;
		const list: PositionsQueryObjectArray = {};
		const balanceOfDataPromises: Promise<bigint>[] = [];
		const mintedDataPromises: Promise<bigint>[] = [];

		for (const p of items) {
			// Forces the collateral balance to be overwritten with the latest blockchain state, instead of the ponder state.
			// This ensures that collateral transfers can be made without using the smart contract or application directly,
			// and the API will be aware of the updated state.
			balanceOfDataPromises.push(
				VIEM_CONFIG.readContract({
					address: p.collateral,
					abi: erc20Abi,
					functionName: 'balanceOf',
					args: [p.position],
				})
			);

			// fetch minted - See issue #11
			// https://github.com/Frankencoin-ZCHF/frankencoin-api/issues/11
			mintedDataPromises.push(
				VIEM_CONFIG.readContract({
					address: p.position,
					abi: PositionABI,
					functionName: 'minted',
				})
			);
		}

		// await for contract calls
		const balanceOfData = await Promise.allSettled(balanceOfDataPromises);
		const mintedData = await Promise.allSettled(mintedDataPromises);

		for (let idx = 0; idx < items.length; idx++) {
			const p = items[idx];
			const b = (balanceOfData[idx] as PromiseFulfilledResult<bigint>).value;
			const m = (mintedData[idx] as PromiseFulfilledResult<bigint>).value;

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
				collateralBalance: typeof b === 'bigint' ? b.toString() : p.position,

				limitForPosition: p.limitForPosition,
				limitForClones: p.limitForClones,
				availableForPosition: p.availableForPosition,
				availableForClones: p.availableForClones,
				minted: typeof m === 'bigint' ? m.toString() : p.minted,
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
