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
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Groups')
@Controller('groups')
@ApiBearerAuth('bearerAuth')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get(':timetableId')
  findByTimetable(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.groupsService.findByTimetable(timetableId, userId);
  }

  @Post('timetable/:timetableId/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateGroupDto,
    @GetUserId() userId: number,
  ) {
    return this.groupsService.createOne(timetableId, userId, dto);
  }

  @Get(':timetableId/item/:id')
  findById(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.groupsService.findById(timetableId, id, userId);
  }

  @Patch(':timetableId/item/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupDto,
    @GetUserId() userId: number,
  ) {
    return this.groupsService.updateOne(timetableId, userId, id, dto);
  }

  @Delete(':timetableId/item/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.groupsService.deleteOne(timetableId, id, userId);
  }
}
