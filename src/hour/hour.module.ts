import { Module } from '@nestjs/common';
import { HourController } from './hour.controller';
import { HourService } from './hour.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hour } from './entity/hour.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hour,Timetable])],
  controllers: [HourController],
  providers: [HourService],
  exports: [HourService],
})
export class HourModule {}
