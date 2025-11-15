import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entity/tags.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Timetable])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
