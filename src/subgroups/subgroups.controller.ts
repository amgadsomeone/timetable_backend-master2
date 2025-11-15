import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubgroupsService } from './subgroups.service';
import { CreateSubGroupDto } from './dto/create-subgroup.dto';
import { UpdateSubGroupDto } from './dto/update-subgroup.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('SubGroups')
@Controller('subgroups')
@ApiBearerAuth('bearerAuth')
export class SubgroupsController {
  constructor(private readonly subgroupsService: SubgroupsService) {}

  @Get(':timetableId')
  findByTimetable(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.subgroupsService.findByTimetable(timetableId, userId);
  }

  @Post('timetable/:timetableId/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateSubGroupDto,
    @GetUserId() userId: number,
  ) {
    return this.subgroupsService.createOne(timetableId, userId, dto);
  }

  @Get(':timetableId/item/:id')
  findById(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.subgroupsService.findById(timetableId, id, userId);
  }

  @Patch(':timetableId/item/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubGroupDto,
    @GetUserId() userId: number,
  ) {
    return this.subgroupsService.updateOne(timetableId, userId, id, dto);
  }

  @Delete(':timetableId/item/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.subgroupsService.deleteOne(timetableId, id, userId);
  }
}
