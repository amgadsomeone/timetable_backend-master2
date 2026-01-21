import { Module } from '@nestjs/common';
import { YearsController } from './years.controller';
import { YearsService } from './years.service';
import { YearsConstraintsController } from './years.constraints.controller';
import { YearsConstraintsService } from './years.constraints.service';
import { Year } from './entity/years.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { NotAvailableConstraint } from 'src/constraints/entity/timeConstraints/notavailableConstraints.entity';
import { Day } from 'src/day/entity/day.entity';
import { Hour } from 'src/hour/entity/hour.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Year,
      Timetable,
      Group,
      SubGroup,
      NotAvailableConstraint,
      Day,
      Hour,
    ]),
  ],
  controllers: [YearsController, YearsConstraintsController],
  providers: [YearsService, YearsConstraintsService],
  exports: [YearsService],
})
export class YearsModule { }

