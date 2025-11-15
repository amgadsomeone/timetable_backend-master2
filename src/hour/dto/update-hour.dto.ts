import { PartialType } from '@nestjs/swagger';
import { CreateHourDto } from './create-hour.dto';

export class UpdateHourDto extends PartialType(CreateHourDto) {}
