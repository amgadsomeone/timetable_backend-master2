import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDayDto {
  @ApiProperty({ description: 'The short name of the day (e.g., Mon, Tue)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The full name of the day (e.g., Monday, Tuesday)',
  })
  @IsString()
  @IsOptional()
  longName?: string;
}
