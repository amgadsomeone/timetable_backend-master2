import { Activity } from 'src/activities/entity/activities.entity';
import { SpaceConstraint } from 'src/constraints/entity/spaceConstraints/spaceConstrainsts.entity';
import { MaxGapsPerWeekConstraint } from 'src/constraints/entity/timeConstraints/maxGapConstraints.entity';
import { NotAvailableConstraint } from 'src/constraints/entity/timeConstraints/notavailableConstraints.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Year } from 'src/years/entity/years.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  OneToOne,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name', 'timetable'])
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'integer', default: 0 })
  assigned_hours: number;

  @ManyToOne(() => Year, (year) => year.groups, { onDelete: 'CASCADE' })
  year: Year;

  // A Group has many SubGroups.
  @OneToMany(() => SubGroup, (subGroup) => subGroup.group)
  subGroups: SubGroup[];

  @ManyToMany(() => Activity, (activity) => activity.groups)
  activities: Activity[];

  @ManyToOne(() => Timetable, (timetable) => timetable.groups, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  timetable: Timetable;

  @OneToMany(() => NotAvailableConstraint, (constraint) => constraint.group)
  NotAvailableConstraints: NotAvailableConstraint[];

  @OneToMany(() => SpaceConstraint, (constraint) => constraint.group)
  spaceConstraints: SpaceConstraint[];

  @OneToOne(() => MaxGapsPerWeekConstraint, (constraint) => constraint.group)
  maxGapsPerWeek: MaxGapsPerWeekConstraint;
}
