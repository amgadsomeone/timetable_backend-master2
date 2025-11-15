import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHourDto {
  @ApiProperty({ description: 'The short name of the hour (e.g., 8:00)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The long name of the hour (e.g., 8:00 AM - 9:00 AM)',
  })
  @IsString()
  @IsOptional()
  longName?: string;
}
