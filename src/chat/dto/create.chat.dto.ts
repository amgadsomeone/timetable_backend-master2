import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateChatDto {
  @IsNumber()
  @IsNotEmpty()
  timetable: number;
}
