import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  longName?: string;
}
