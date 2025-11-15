import { forwardRef, Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { TimetableModule } from 'src/timetable/timetable.module';
import { SubjectsModule } from 'src/subjects/subjects.module';
import { TagsModule } from 'src/tags/tags.module';
import { TeachersModule } from 'src/teachers/teachers.module';
import { YearsModule } from 'src/years/years.module';
import { GroupsModule } from 'src/groups/groups.module';
import { SubgroupsModule } from 'src/subgroups/subgroups.module';
import { RoomsModule } from 'src/rooms/rooms.module';
import { BuildingsModule } from 'src/buildings/buildings.module';
import { ActivitiesModule } from 'src/activities/activities.module';
import { UsersModule } from 'src/users/users.module';
import { DayModule } from 'src/day/day.module';
import { HourModule } from 'src/hour/hour.module';
import { ConstraintsModule } from 'src/constraints/constraints.module';
import { AgentTools } from './agent.service.tools';
import { ValidationService } from './agent.service.Validation ';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    ConfigModule,
    TimetableModule,
    SubjectsModule,
    TagsModule,
    TeachersModule,
    YearsModule,
    GroupsModule,
    SubgroupsModule,
    RoomsModule,
    BuildingsModule,
    ActivitiesModule,
    UsersModule,
    DayModule,
    HourModule,
    ConstraintsModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [],
  providers: [
    AgentService,
    AgentTools,
    ValidationService,
    {
      provide: 'gemini',
      useFactory: (configService: ConfigService) => {
        return new GoogleGenAI({ apiKey: configService.getOrThrow('AiKey') });
      },
      inject: [ConfigService],
    },
  ],
  exports: [AgentService,AgentTools],
})
export class AgentModule {}
