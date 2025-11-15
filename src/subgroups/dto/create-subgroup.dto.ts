import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateSubGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  groupId: number;
}
