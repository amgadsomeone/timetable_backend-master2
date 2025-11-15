import { Activity } from 'src/activities/entity/activities.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true, // Ensures that every tag name is unique.
    length: 100,
  })
  name: string;

  @Column({
    length: 255,
    nullable: true, // It's common for the long name/description to be optional.
  })
  longName: string;

  @ManyToMany(() => Activity, (activity) => activity.tags)
  activities: Activity[];

  @ManyToOne(() => Timetable, (timetable) => timetable.tags, {
    nullable: false,
  })
  timetable: Timetable;
}
