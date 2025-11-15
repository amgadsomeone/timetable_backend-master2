import { Room } from 'src/rooms/entity/rooms.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Building {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
    length: 150,
  })
  name: string;

  @Column({
    length: 255,
    nullable: true,
  })
  longName: string;

  @OneToMany(() => Room, (room) => room.building)
  rooms: Room[];

  @ManyToOne(() => Timetable, (timetable) => timetable.buildings, {
    nullable: false,
  })
  timetable: Timetable;
}
