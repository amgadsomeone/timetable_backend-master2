import { Activity } from 'src/activities/entity/activities.entity';
import { SpaceConstraint } from 'src/constraints/entity/spaceConstraints/spaceConstrainsts.entity';
import { MaxGapsPerWeekConstraint } from 'src/constraints/entity/timeConstraints/maxGapConstraints.entity';
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
  OneToOne,
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
  })
  timetable: Timetable;

  @OneToMany(() => NotAvailableConstraint, (constraint) => constraint.teacher)
  NotAvailableConstraints: NotAvailableConstraint[];

  @OneToMany(() => SpaceConstraint, (constraint) => constraint.teacher)
  spaceConstraints: SpaceConstraint[];

  @OneToOne(() => MaxGapsPerWeekConstraint, (constraint) => constraint.teacher)
  maxGapsPerWeek: MaxGapsPerWeekConstraint;
}
