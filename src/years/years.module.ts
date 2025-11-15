import { Module } from '@nestjs/common';
import { YearsController } from './years.controller';
import { YearsService } from './years.service';
import { Year } from './entity/years.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Year, Timetable, Group, SubGroup])],
  controllers: [YearsController],
  providers: [YearsService],
  exports: [YearsService],
})
export class YearsModule {}
