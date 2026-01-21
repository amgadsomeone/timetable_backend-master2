import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsConstraintsController } from './groups.constraints.controller';
import { GroupsConstraintsService } from './groups.constraints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Year } from 'src/years/entity/years.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Group } from './entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { YearsModule } from 'src/years/years.module';
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
    YearsModule,
  ],
  controllers: [GroupsController, GroupsConstraintsController],
  providers: [GroupsService, GroupsConstraintsService],
  exports: [GroupsService],
})
export class GroupsModule { }

