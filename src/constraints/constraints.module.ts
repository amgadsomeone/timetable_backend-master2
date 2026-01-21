import { Module } from '@nestjs/common';
import { ConstraintsController } from './constraints.controller';
import { ConstraintsService } from './constraints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaxGapsPerWeekConstraint } from './entity/timeConstraints/maxGapConstraints.entity';
import { NotAvailableConstraint } from './entity/timeConstraints/notavailableConstraints.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Year } from 'src/years/entity/years.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';

import { Day } from 'src/day/entity/day.entity';
import { Hour } from 'src/hour/entity/hour.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaxGapsPerWeekConstraint,
      NotAvailableConstraint,
      Teacher,
      Timetable,
      Year,
      Group,
      SubGroup,
      Day,
      Hour,
    ]),
  ],
  controllers: [ConstraintsController],
  providers: [ConstraintsService],
})
export class ConstraintsModule { }
