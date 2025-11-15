import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ description: 'Short subject name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Long subject name', required: false })
  @IsString()
  @IsOptional()
  longName?: string;
}
