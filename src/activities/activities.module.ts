import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Year } from 'src/years/entity/years.entity';
import { group } from 'console';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';
import { Tag } from 'src/tags/entity/tags.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Activity } from './entity/activities.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      Timetable,
      Year,
      Group,
      SubGroup,
      Subject,
      Tag,
      Activity
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports:[ActivitiesService]
})
export class ActivitiesModule { }
