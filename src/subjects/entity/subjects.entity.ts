import { Activity } from 'src/activities/entity/activities.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  ManyToMany,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name', 'timetable'])
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
  })
  name: string;

  @Column({
    length: 255, // You can also define a length for the long name.
    nullable: true, // Make longName optional in case it's not always provided.
  })
  longName: string;

  @ManyToMany(() => Teacher, (teacher) => teacher.qualifiedSubjects)
  qualifiedTeachers: Teacher[];

  @OneToMany(() => Activity, (activity) => activity.subject)
  activities: Activity[];

  @ManyToOne(() => Timetable, (timetable) => timetable.subjects, {
    nullable: false,
  })
  timetable: Timetable;
}

