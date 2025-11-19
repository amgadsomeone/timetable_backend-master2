import { Building } from 'src/buildings/entity/buildings.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name', 'building'])
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
  })
  name: string;

  @Column({
    type: 'integer',
    default: 30000,
    nullable:true
  })
  capacity: number;

  @ManyToOne(() => Building, (building) => building.rooms, {
    onDelete: 'CASCADE',
  })
  building: Building;

  @ManyToOne(() => Timetable, (timetable) => timetable.rooms, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  timetable: Timetable;

}
