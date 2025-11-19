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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Rooms')
@Controller('rooms')
@ApiBearerAuth('bearerAuth')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get(':timetable')
  findByBuilding(
    @Param('timetable', ParseIntPipe) TimetableId: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.roomsService.findByTimetable(TimetableId, userId);
  }

  @Post('building/:buildingId/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Body() dto: CreateRoomDto,
    @GetUserId() userId: number,
  ) {
    return this.roomsService.createMany(buildingId, userId, [dto]);
  }

  @Get('building/:buildingId/item/:id')
  findById(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.roomsService.findById(buildingId, id, userId);
  }

  @Patch('building/:buildingId/item/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomDto,
    @GetUserId() userId: number,
  ) {
    return this.roomsService.updateOne(buildingId, id, userId, dto);
  }

  @Delete('building/:buildingId/item/:id')
  deleteOne(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.roomsService.deleteOne(buildingId, id, userId);
  }
}
