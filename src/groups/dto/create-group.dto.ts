import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  yearId: number;
}
