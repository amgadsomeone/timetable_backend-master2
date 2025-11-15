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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Tags')
@Controller('tags')
@ApiBearerAuth('bearerAuth')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get(':timeTable')
  @ApiOperation({ summary: 'Get tags by timeTableId' })
  @ApiResponse({ status: 200, description: 'Tags' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Param('timeTable', ParseIntPipe) id: number,
    @GetUserId() userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tagsService.findTags(id, userId);
  }

  @Post('timetable/:timetableId/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body() dto: CreateTagDto,
    @GetUserId() userId: number,
  ) {
    return this.tagsService.createOne(timetableId, userId, dto);
  }

  @Get(':timetableId/item/:id')
  findById(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.tagsService.findById(timetableId, id, userId);
  }

  @Patch(':timetableId/item/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTagDto,
    @GetUserId() userId: number,
  ) {
    return this.tagsService.updateOne(timetableId, id, userId, dto);
  }

  @Delete(':timetableId/item/:id')
  deleteOne(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return this.tagsService.deleteOne(timetableId, id, userId);
  }
}
