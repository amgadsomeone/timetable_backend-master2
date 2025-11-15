import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({ description: 'Short teacher name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Long teacher name', required: false })
  @IsString()
  @IsOptional()
  longName?: string;

  @ApiProperty({ description: 'Target hours for this teacher', required: false })
  @IsOptional()
  @IsNumber()
  targetHours?: number;

  @ApiProperty({ description: 'Array of subject ids that the teacher is qualified for', required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  qualifiedSubjects?: number[];
}
