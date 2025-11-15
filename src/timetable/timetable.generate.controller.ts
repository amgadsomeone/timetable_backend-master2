import { Controller, Post, Param, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import archiver = require('archiver');
import * as fs from 'fs/promises';
import { TimetableGenerationService } from './timetable.generathion';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('timetables/:id/generate')
@ApiBearerAuth('bearerAuth') // Match the name from your setupSwagger function
export class TimetableGenerationController {
  constructor(private readonly generationService: TimetableGenerationService) {}

  @Post()
  async generateTimetable(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @GetUserId() userId: number,
  ) {
    return this.generationService.generateAndZip(id, userId, res);
  }
}
