import { IsInt, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateSubjectDto } from './create-subject.dto';

export class SaveSubjectsDto {
  @ApiProperty({ description: 'Timetable id' })
  @IsInt()
  timetableId: number;

  @ApiProperty({ type: [CreateSubjectDto], description: 'List of subjects' })
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectDto)
  @ArrayNotEmpty()
  subjects: CreateSubjectDto[];
}
