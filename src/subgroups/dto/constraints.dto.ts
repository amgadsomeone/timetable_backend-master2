import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// MaxGaps DTOs
export class SetMaxGapItemDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    id: number;

    @ApiProperty({ example: 2 })
    @IsInt()
    @IsNotEmpty()
    maxGapPerDay: number;
}

export class SetMaxGapsDto {
    @ApiProperty({ type: [SetMaxGapItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SetMaxGapItemDto)
    data: SetMaxGapItemDto[];
}

export class ResetMaxGapsDto {
    @ApiProperty({ example: [1, 2, 3] })
    @IsArray()
    @IsInt({ each: true })
    ids: number[];
}

// NotAvailable DTOs
export class CreateSubgroupNotAvailableDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    dayId: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    hourId: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    subgroupId: number;
}

export class CreateSubgroupNotAvailableManyDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    timetableId: number;

    @ApiProperty({ type: [CreateSubgroupNotAvailableDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSubgroupNotAvailableDto)
    constraints: CreateSubgroupNotAvailableDto[];
}

export class DeleteNotAvailableConstraintsDto {
    @ApiProperty({ example: [1, 2, 3] })
    @IsArray()
    @IsInt({ each: true })
    ids: number[];
}
