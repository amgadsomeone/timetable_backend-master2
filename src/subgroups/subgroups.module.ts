import { Module } from '@nestjs/common';
import { SubgroupsController } from './subgroups.controller';
import { SubgroupsService } from './subgroups.service';
import { SubgroupsConstraintsController } from './subgroups.constraints.controller';
import { SubgroupsConstraintsService } from './subgroups.constraints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Year } from 'src/years/entity/years.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from './entity/subgroups.entity';
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
  controllers: [SubgroupsController, SubgroupsConstraintsController],
  providers: [SubgroupsService, SubgroupsConstraintsService],
  exports: [SubgroupsService],
})
export class SubgroupsModule { }

