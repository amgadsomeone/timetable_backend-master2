import { Module } from '@nestjs/common';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entity/subjects.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Timetable])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
