import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Res,
  NotFoundException,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { FetExportService } from './fet.service';
import { ClerkAuthGuard } from 'src/auth/gurds/clerk-auth.guard';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Timetable')
@Controller('timetable')
@ApiBearerAuth('bearerAuth')
export class TimetableController {
  constructor(
    private readonly timetableService: TimetableService,
    private readonly fetExportService: FetExportService,
  ) {}

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
  @Post()
  @ApiOperation({ summary: 'Create a new timetable' })
  @ApiResponse({
    status: 201,
    description: 'The timetable has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateTimetableDto })
  create(
    @Body() createTimetableDto: CreateTimetableDto,
    @GetUserId() userId: number,
  ) {
    return this.timetableService.create(createTimetableDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all timetables' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all timetables.',
  })
  findAll(@GetUserId() userId: number, @Query() paginationDto: PaginationDto) {
    return this.timetableService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a timetable by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved timetable.',
  })
  @ApiResponse({ status: 404, description: 'Timetable not found.' })
  @ApiParam({ name: 'id', description: 'ID of the timetable to retrieve' })
  findOne(@Param('id') id: number, @GetUserId() userId: number) {
    return this.timetableService.findOverviewWithQueryBuilder(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a timetable by ID' })
  @ApiResponse({
    status: 200,
    description: 'The timetable has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Timetable not found.' })
  @ApiBody({ type: UpdateTimetableDto })
  @ApiParam({ name: 'id', description: 'ID of the timetable to update' })
  update(
    @Param('id') id: string,
    @Body() updateTimetableDto: UpdateTimetableDto,
    @GetUserId() userId: number,
  ) {
    return this.timetableService.update(+id, updateTimetableDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a timetable by ID' })
  @ApiResponse({
    status: 200,
    description: 'The timetable has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Timetable not found.' })
  @ApiParam({ name: 'id', description: 'ID of the timetable to delete' })
  remove(@Param('id') id: string, @GetUserId() userId: number) {
    return this.timetableService.remove(+id, userId);
  }

  @Get('/:id/fet.xml')
  async exportTimetableAsFetXml(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @GetUserId() userId: number,
  ) {
    console.time('databaseQuery');
    console.time('plz');
    const fullTimetable = await this.timetableService.findFull(id, userId);
    console.timeEnd('plz');

    if (!fullTimetable) {
      throw new NotFoundException('Timetable not found');
    }
    console.timeEnd('databaseQuery');


    console.time('xmlGeneration');

    const xmlContent = this.fetExportService.generateFetXml(fullTimetable);
    console.timeEnd('xmlGeneration');

    res.header('Content-Type', 'application/xml');
    res.header(
      'Content-Disposition',
      `attachment; filename="timetable_${id}.fet"`,
    );
    res.send(xmlContent);
  }
}
