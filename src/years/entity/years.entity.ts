import { Activity } from 'src/activities/entity/activities.entity';
import { MaxGapsPerWeekConstraint } from 'src/constraints/entity/timeConstraints/maxGapConstraints.entity';
import { NotAvailableConstraint } from 'src/constraints/entity/timeConstraints/notavailableConstraints.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  ManyToOne,
  OneToOne,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name', 'timetable'])
export class Year {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'integer', default: 0 })
  assigned_hours: number;

  @OneToMany(() => Group, (group) => group.year)
  groups: Group[];

  @ManyToMany(() => Activity, (activity) => activity.years)
  activities: Activity[];

  @ManyToOne(() => Timetable, (timetable) => timetable.years, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  timetable: Timetable;

  @OneToMany(() => NotAvailableConstraint, (constraint) => constraint.year)
  NotAvailableConstraints: NotAvailableConstraint[];


  @OneToOne(() => MaxGapsPerWeekConstraint, (constraint) => constraint.year)
  maxGapsPerWeek: MaxGapsPerWeekConstraint;

  @Column({
    nullable: true,
  })
  maxGapsPerDay?: number;
}
