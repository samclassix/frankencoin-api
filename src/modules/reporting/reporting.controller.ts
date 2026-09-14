import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Address, isAddress } from 'viem';
import { ReportingService } from './reporting.service';
import { ApiFpsYearlyRow, REPORTING_TOKENS, ReportingToken } from './reporting.types';

@ApiTags('Reporting Controller')
@Controller('reporting/fps')
export class ReportingController {
	constructor(private readonly reporting: ReportingService) {}

	@Get('yearly')
	@ApiOperation({
		summary: 'Get yearly FPS1/FCS attributable income for an address',
		description:
			'Returns: ApiFpsYearlyRow[], the yearly attributable income, year-end balance, and year-end ZCHF value for an address, computed ' +
			"server-side from indexed FPS1 (Equity) and FCS balance/earnings history. Replaces the app's client-side ReportsFPSYearlyTable computation. " +
			"`token` selects fps1-only, fcs-only, or the combined position (default combined, since FCS's value tracks FPS1's price 1:1). " +
			"`year` optionally filters to a single year; the current (in-progress) year's values reflect accrued amounts up to now.",
	})
	@ApiQuery({
		name: 'address',
		required: true,
		description: 'Address to report on',
		example: '0x963eC454423CD543dB08bc38fC7B3036B425b301',
	})
	@ApiQuery({ name: 'token', required: false, enum: REPORTING_TOKENS, description: 'Defaults to combined' })
	@ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter to a single year; omit for the full history' })
	@ApiResponse({
		status: 200,
		description: 'Returns yearly report rows, most recent year first',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					year: { type: 'number' },
					earnings: { type: 'string', description: 'Attributable income for the year, in ZCHF wei' },
					balance: { type: 'string', description: 'Year-end token balance, in wei' },
					value: { type: 'string', description: 'Year-end balance valued in ZCHF, in wei' },
				},
			},
			example: [{ year: 2026, earnings: '1234500000000000000', balance: '1000000000000000000000', value: '1250000000000000000000' }],
		},
	})
	@ApiResponse({
		status: 200,
		description: 'Invalid input error',
		schema: { type: 'object', properties: { error: { type: 'string', example: 'Address not valid' } } },
	})
	async getYearly(
		@Query('address') address: string,
		@Query('token') token: string = 'combined',
		@Query('year') year?: string
	): Promise<ApiFpsYearlyRow[] | { error: string }> {
		if (!isAddress(address)) {
			return { error: 'Address not valid' };
		}
		if (!REPORTING_TOKENS.includes(token as ReportingToken)) {
			return { error: `Invalid token, expected one of: ${REPORTING_TOKENS.join(', ')}` };
		}

		let parsedYear: number | undefined;
		if (year !== undefined) {
			parsedYear = Number(year);
			if (!Number.isInteger(parsedYear)) {
				return { error: 'Invalid year' };
			}
		}

		return this.reporting.getFpsYearlyReport(address as Address, token as ReportingToken, parsedYear);
	}
}
