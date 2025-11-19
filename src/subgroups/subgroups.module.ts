import { Module } from '@nestjs/common';
import { SubgroupsController } from './subgroups.controller';
import { SubgroupsService } from './subgroups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Year } from 'src/years/entity/years.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from './entity/subgroups.entity';
import { YearsModule } from 'src/years/years.module';

@Module({
  imports: [TypeOrmModule.forFeature([Year, Timetable, Group, SubGroup]),YearsModule],
  controllers: [SubgroupsController],
  providers: [SubgroupsService],
  exports: [SubgroupsService],
})
export class SubgroupsModule {}
