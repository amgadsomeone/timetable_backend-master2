import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum EntityType {
    TEACHER = 'TEACHER',
    YEAR = 'YEAR',
    GROUP = 'GROUP',
    SUBGROUP = 'SUBGROUP',
}

export class CreateNotAvailableConstraintDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    dayId: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    hourId: number;

    @ApiProperty({ enum: EntityType, example: EntityType.TEACHER })
    @IsEnum(EntityType)
    @IsNotEmpty()
    entityType: EntityType;

    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    entityId: number;
}

export class CreateNotAvailableConstraintsManyDto {
    @ApiProperty({ type: [CreateNotAvailableConstraintDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateNotAvailableConstraintDto)
    constraints: CreateNotAvailableConstraintDto[];
}
