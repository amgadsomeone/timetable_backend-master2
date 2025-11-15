import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: 'Short tag name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Long tag name', required: false })
  @IsString()
  @IsOptional()
  longName?: string;
}
