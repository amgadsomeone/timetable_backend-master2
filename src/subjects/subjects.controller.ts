import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  ParseArrayPipe,
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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Subjects')
@Controller('subjects')
@ApiBearerAuth('bearerAuth')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(':timeTable')
  @ApiOperation({ summary: 'Get subject by timeTableId' })
  @ApiResponse({ status: 200, description: 'Subject' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Param('timeTable', ParseIntPipe) id: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.subjectsService.findSubjects(
      id,
      userId,
    );
  }

  @Post('timetable/:timetableId/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateSubjectDto,
    @GetUserId() userId: number,
  ) {
    return this.subjectsService.createOne(timetableId, userId, dto);
  }

  @Get(':timetableId/item/:id')
  findById(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.subjectsService.findById(timetableId, id, userId);
  }

  @Patch(':timetableId/item/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
    @GetUserId() userId: number,
  ) {
    return this.subjectsService.updateOne(timetableId, id, userId, dto);
  }

  @Delete(':timetableId/item/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.subjectsService.deleteOne(timetableId, id, userId);
  }
}
