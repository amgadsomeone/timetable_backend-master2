import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Get,
  Patch,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { HourService } from './hour.service';
import { CreateHourDto } from './dto/create-hour.dto';
import { UpdateHourDto } from './dto/update-hour.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('hour')
@ApiBearerAuth('bearerAuth')
export class HourController {
  constructor(private readonly hourService: HourService) {}

  // List
  @Get(':timetableId')
  findAll(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.hourService.findAllByTimetable(timetableId, userId);
  }

  @Post(':timetableId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateHourDto,
    @GetUserId() userId: number,
  ) {
    return this.hourService.createOnetest(timetableId, userId, dto);
  }
  // this endpoint is useless
  @Get(':timetableId/:id')
  findOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.hourService.findById(timetableId, id, userId);
  }

  @Patch(':timetableId/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHourDto,
    @GetUserId() userId: number,
  ) {
    return this.hourService.updateOne(timetableId, id, userId, dto);
  }

  @Delete(':timetableId/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.hourService.deleteOne(timetableId, id, userId);
  }
}
