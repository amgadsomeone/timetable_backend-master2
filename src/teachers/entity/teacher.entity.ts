import { Activity } from 'src/activities/entity/activities.entity';
import { NotAvailableConstraint } from 'src/constraints/entity/timeConstraints/notavailableConstraints.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
  OneToMany,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name', 'timetable'])
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 150, // A slightly longer length to accommodate full names.
  })
  name: string;

  @Column({
    length: 255,
    nullable: true, // The long name (e.g., full title) can be optional.
  })
  longName: string;

  @Column({ type: 'integer', default: 0 })
  assigned_hours: number;

  @ManyToMany(() => Subject)
  @JoinTable()
  qualifiedSubjects: Subject[];

  @Column({
    nullable: true,
  })
  targetHours: number;

  @ManyToMany(() => Activity, (activity) => activity.teachers)
  activities: Activity[];

  @ManyToOne(() => Timetable, (timetable) => timetable.teachers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  timetable: Timetable;

  @OneToMany(() => NotAvailableConstraint, (constraint) => constraint.teacher)
  NotAvailableConstraints: NotAvailableConstraint[];
  /*
  @OneToMany(() => SpaceConstraint, (constraint) => constraint.teacher)
  spaceConstraints: SpaceConstraint[];

    @OneToOne(() => MaxGapsPerWeekConstraint, (constraint) => constraint.teacher)
    maxGapsPerWeek: MaxGapsPerWeekConstraint;
  */

  // if i was paid to do this i will make a separate entity to contain all the other constraints 
  @Column({
    nullable: true,
  })
  maxGapsPerDay?: number;
}
