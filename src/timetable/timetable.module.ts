import { Module } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timetable } from './entity/timetable.entity';
import { TimetableController } from './timetable.controller';
import { FetExportService } from './fet.service';
import { TimetableGenerationService } from './timetable.generathion';
import { TimetableGenerationController } from './timetable.generate.controller';
import { User } from 'src/users/entity/users.entity';
import { ConfigModule } from '@nestjs/config';
import { TimetableProcessor } from './timetable.processor';
import { BullModule } from '@nestjs/bullmq';
import { Activity } from 'src/activities/entity/activities.entity';
import { Year } from 'src/years/entity/years.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';
import { Tag } from 'src/tags/entity/tags.entity';
import { Building } from 'src/buildings/entity/buildings.entity';
import { Day } from 'src/day/entity/day.entity';
import { Hour } from 'src/hour/entity/hour.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Timetable,
      User,
      Teacher,
      Year,
      Group,
      SubGroup,
      Subject,
      Tag,
      Activity,
      Building,
      Day,
      Hour,
    ]),
    ConfigModule,
    /* BullModule.registerQueue({
      name: 'timetable-generation',
    }),
    */
  ],
  controllers: [TimetableController, TimetableGenerationController],
  providers: [
    TimetableService,
    FetExportService,
    TimetableGenerationService,
    TimetableProcessor,
  ],
  exports: [TimetableService],
})
export class TimetableModule {}
