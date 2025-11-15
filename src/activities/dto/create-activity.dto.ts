import { IsInt, IsOptional, IsArray, ArrayNotEmpty, ArrayUnique, Min } from 'class-validator';

export class CreateActivityDto {
  @IsInt()
  @Min(1)
  duration: number;

  // single subject id
  @IsInt()
  subjectId: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  teachers?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  years?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  groups?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  subGroups?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  tags?: number[];
}
