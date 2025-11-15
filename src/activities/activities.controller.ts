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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Activities')
@Controller('activities')
@ApiBearerAuth('bearerAuth')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(':timetableId')
  findByTimetable(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.activitiesService.findByTimetable(timetableId, userId);
  }

  @Post(':timetableId/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateActivityDto,
    @GetUserId() userId: number,
  ) {
    return this.activitiesService.createOne(timetableId, userId, dto);
  }
  @Post(':timetableId/itemmany')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createMany(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateActivityDto[],
    @GetUserId() userId: number,
  ) {
    console.time('addactivity');

    const act = await this.activitiesService.createMany(
      timetableId,
      userId,
      dto,
    );


    
    console.timeEnd('addactivity');
    return {act};
  }

  @Get(':timetableId/item/:id')
  findById(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.activitiesService.findById(timetableId, id, userId);
  }

  @Patch(':timetableId/item/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
    @GetUserId() userId: number,
  ) {
    return this.activitiesService.updateOne(timetableId, id, userId, dto);
  }

  @Delete(':timetableId/item/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.activitiesService.deleteOne(timetableId, id, userId);
  }
}
