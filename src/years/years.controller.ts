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
import { YearsService } from './years.service';
import { CreateYearDto } from './dto/create-year.dto';
import { UpdateYearDto } from './dto/update-year.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Years')
@Controller('years')
@ApiBearerAuth('bearerAuth')
export class YearsController {
  constructor(private readonly yearsService: YearsService) {}

  @Get(':timetableId')
  findByTimetable(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.yearsService.findByTimetable(
      timetableId,
      userId,
    );
  }

  @Post('timetable/:timetableId/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateYearDto,
    @GetUserId() userId: number,
  ) {
    return this.yearsService.createOne(timetableId, userId, dto);
  }

  @Get(':timetableId/item/:id')
  findById(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.yearsService.findById(timetableId, id, userId);
  }

  @Patch(':timetableId/item/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateYearDto,
    @GetUserId() userId: number,
  ) {
    return this.yearsService.updateOne(timetableId, userId, id, dto);
  }

  @Delete(':timetableId/item/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.yearsService.deleteOne(timetableId, id, userId);
  }
}
