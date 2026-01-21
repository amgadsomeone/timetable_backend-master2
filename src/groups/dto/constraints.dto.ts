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
export class CreateGroupNotAvailableDto {
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
    groupId: number;
}

export class CreateGroupNotAvailableManyDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    timetableId: number;

    @ApiProperty({ type: [CreateGroupNotAvailableDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateGroupNotAvailableDto)
    constraints: CreateGroupNotAvailableDto[];
}

export class DeleteNotAvailableConstraintsDto {
    @ApiProperty({ example: [1, 2, 3] })
    @IsArray()
    @IsInt({ each: true })
    ids: number[];
}
