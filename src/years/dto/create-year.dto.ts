import { IsNotEmpty, IsString } from 'class-validator';

export class CreateYearDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
