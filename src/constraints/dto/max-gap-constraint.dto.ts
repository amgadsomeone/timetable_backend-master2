import { IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaxGapConstraintDto {
    @ApiProperty({ description: 'The maximum number of gaps allowed per week' })
    @IsNumber()
    @IsNotEmpty()
    maxGaps: number;

    @ApiProperty({ description: 'The ID of the timetable this constraint belongs to' })
    @IsNumber()
    @IsNotEmpty()
    timetableId: number;

    @ApiProperty({ description: 'The ID of the teacher this constraint applies to', required: false })
    @IsOptional()
    @IsNumber()
    teacherId?: number;

    @ApiProperty({ description: 'The ID of the year this constraint applies to', required: false })
    @IsOptional()
    @IsNumber()
    yearId?: number;

    @ApiProperty({ description: 'The ID of the group this constraint applies to', required: false })
    @IsOptional()
    @IsNumber()
    groupId?: number;

    @ApiProperty({ description: 'The ID of the subgroup this constraint applies to', required: false })
    @IsOptional()
    @IsNumber()
    subgroupId?: number;
}
