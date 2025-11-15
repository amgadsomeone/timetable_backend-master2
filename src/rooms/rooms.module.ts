import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Building } from 'src/buildings/entity/buildings.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Room } from './entity/rooms.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Building, Room, Timetable])],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
