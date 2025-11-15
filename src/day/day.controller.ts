import {
  Body,
  Controller,
  Param,
  Put,
  Get,
  Post,
  Patch,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { DayService } from './day.service';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('day')
@ApiBearerAuth('bearerAuth') // Match the name from your setupSwagger function
export class DayController {
  constructor(private readonly dayService: DayService) {}

  // List by timetable
  @Get(':timetableId')
  findDays(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.dayService.findDays(
      timetableId,
      userId,
    );
  }

  // Create one
  @Post(':timetableId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateDayDto,
    @GetUserId() userId: number,
  ) {
    return this.dayService.createOne(timetableId, userId, dto);
  }

  // Get one
  @Get(':timetableId/:id')
  findOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.dayService.findById(timetableId, userId, id);
  }

  // Update one
  @Patch(':timetableId/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDayDto,
    @GetUserId() userId: number,
  ) {
    return this.dayService.updateOne(timetableId, id, userId, dto);
  }

  // Delete one
  @Delete(':timetableId/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.dayService.deleteOne(timetableId, userId, id);
  }
}
