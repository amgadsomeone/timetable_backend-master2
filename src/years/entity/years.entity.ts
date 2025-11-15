import { Activity } from 'src/activities/entity/activities.entity';
import { SpaceConstraint } from 'src/constraints/entity/spaceConstraints/spaceConstrainsts.entity';
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
  name: string; // e.g., "2025-2026", "Freshman Year"

  // A Year has many Groups. This defines the "one" side of the relationship.
  @OneToMany(() => Group, (group) => group.year)
  groups: Group[];

  @ManyToMany(() => Activity, (activity) => activity.years)
  activities: Activity[];

  @ManyToOne(() => Timetable, (timetable) => timetable.years, {
    nullable: false,
  })
  timetable: Timetable;

  @OneToMany(() => NotAvailableConstraint, (constraint) => constraint.year)
  NotAvailableConstraints: NotAvailableConstraint[];

  @OneToMany(() => SpaceConstraint, (constraint) => constraint.year)
  spaceConstraints: SpaceConstraint[];

  @OneToOne(() => MaxGapsPerWeekConstraint, (constraint) => constraint.year)
  maxGapsPerWeek: MaxGapsPerWeekConstraint;
}
