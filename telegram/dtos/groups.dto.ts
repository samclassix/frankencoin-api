import { IsArray, IsString, IsNumber, IsOptional } from 'class-validator';

export class Groups {
	@IsString()
	apiVersion: string;

	@IsNumber()
	createdAt: number;

	@IsNumber()
	updatedAt: number;

	@IsArray()
	@IsString({ each: true })
	groups: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	ignore?: string[];
}
