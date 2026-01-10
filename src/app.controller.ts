import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AgentTools, RelationEntityType } from './agent/agent.service.tools';
import { realthionships } from './teachers/teachers.service';

@Controller()
@ApiBearerAuth('bearerAuth')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly agentTools: AgentTools,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('test-agent-tool')
  async testAgentTool() {
    const res = await this.agentTools.updateActivity(10, 2, [
      {
        id: 82,
        data: {
          teachers: [21],
          years: [16],
          duration: 3,
        },
      },
    ]);
    return res;
  }
}
