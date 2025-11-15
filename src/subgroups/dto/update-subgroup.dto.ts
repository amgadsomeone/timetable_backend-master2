import { PartialType } from '@nestjs/swagger';
import { CreateSubGroupDto } from './create-subgroup.dto';

export class UpdateSubGroupDto extends PartialType(CreateSubGroupDto) {}
