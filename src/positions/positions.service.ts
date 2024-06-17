import { Injectable, Logger } from '@nestjs/common';
import { PONDER_CLIENT } from '../app.config';
import { gql } from '@apollo/client/core';
import { PositionQuery, PositionsQueryObjectArray } from './positions.types';
import { Interval } from '@nestjs/schedule';
import { getAddress } from 'viem';

@Injectable()
export class PositionsService {
	private readonly logger = new Logger(PositionsService.name);
	private fetchedPositions: PositionsQueryObjectArray = {};

	constructor() {
		setTimeout(() => this.updatePositons(), 100);
	}

	getPositions(): PositionsQueryObjectArray {
		return this.fetchedPositions;
	}

	@Interval(10_000)
	async updatePositons() {
		this.logger.debug('Updating positions');
		const { data } = await PONDER_CLIENT.query({
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
		if (data && data.positions) {
			data.positions.items.forEach(async (p: PositionQuery) => {
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
					collateralBalance: p.collateralBalance,

					limitForPosition: p.limitForPosition,
					limitForClones: p.limitForClones,
					availableForPosition: p.availableForPosition,
					availableForClones: p.availableForClones,
					minted: p.minted,
				};
			});
		}

		const a = Object.keys(list).length;
		const b = Object.keys(this.fetchedPositions).length;
		const diff = a - b;
		if (diff > 0) this.logger.log(`Positions merging, from ${b} to ${a} positions`);
		this.fetchedPositions = { ...this.fetchedPositions, ...list };
		return list;
	}
}
