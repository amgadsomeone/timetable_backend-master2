import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Year } from 'src/years/entity/years.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Group } from './entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Year, Timetable, Group, SubGroup])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
