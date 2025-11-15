import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './entity/teacher.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher, Timetable])],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
