import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import type { Request, Response } from 'express';
import { Readable } from 'typeorm/platform/PlatformTools.js';

@ApiTags('ai')
@Controller('ai')
@ApiBearerAuth('bearerAuth')
export class AiController {
  constructor(private readonly agentService: AgentService) {}

  @Post('')
  async Startconversation(@Req() req: Request, @Res() res: Response) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const stream = await this.agentService.Startconversation(req.body);
    const readableStream = Readable.fromWeb(stream as any);
    readableStream.pipe(res);
  }
}
