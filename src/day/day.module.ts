import { Module } from '@nestjs/common';
import { DayController } from './day.controller';
import { DayService } from './day.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Day } from './entity/day.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Day,Timetable])],
  controllers: [DayController],
  providers: [DayService],
  exports: [DayService],
})
export class DayModule {}
