import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Teachers')
@Controller('teachers')
@ApiBearerAuth('bearerAuth')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get(':timeTable')
  @ApiOperation({ summary: 'Get teachers by timeTableId' })
  @ApiResponse({ status: 200, description: 'Teachers' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Param('timeTable', ParseIntPipe) id: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.teachersService.findTeachers(id, userId);
  }

  @Post('timetable/:timetableId/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateTeacherDto,
    @GetUserId() userId: number,
  ) {
    return this.teachersService.createOne(timetableId, userId, dto);
  }

  @Get(':timetableId/item/:id')
  findById(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.teachersService.findById(timetableId, id, userId);
  }

  @Patch(':timetableId/item/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherDto,
    @GetUserId() userId: number,
  ) {
    return this.teachersService.updateOne(timetableId, id, userId, dto);
  }

  @Delete(':timetableId/item/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.teachersService.deleteOne(timetableId, id, userId);
  }
}
