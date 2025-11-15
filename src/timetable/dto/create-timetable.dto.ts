import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTimetableDto {
  @ApiProperty({ description: 'The name of the institution' })
  @IsString()
  @IsNotEmpty()
  InstitutionName!: string;
}
