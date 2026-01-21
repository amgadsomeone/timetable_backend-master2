import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TeachersConstraintsController } from './teachers.constraints.controller';
import { TeachersConstraintsService } from './teachers.constraints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './entity/teacher.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { NotAvailableConstraint } from 'src/constraints/entity/timeConstraints/notavailableConstraints.entity';
import { Day } from 'src/day/entity/day.entity';
import { Hour } from 'src/hour/entity/hour.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      Timetable,
      NotAvailableConstraint,
      Day,
      Hour,
    ]),
  ],
  controllers: [TeachersController, TeachersConstraintsController],
  providers: [TeachersService, TeachersConstraintsService],
  exports: [TeachersService],
})
export class TeachersModule { }

