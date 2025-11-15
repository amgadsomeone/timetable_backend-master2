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
  ManyToOne,
  ManyToMany,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name', 'timetable'])
export class SubGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Group, (group) => group.subGroups, { onDelete: 'CASCADE' })
  group: Group;

  @ManyToMany(() => Activity, (activity) => activity.subGroups)
  activities: Activity[];

  @ManyToOne(() => Timetable, (timetable) => timetable.subGroups, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  timetable: Timetable;

  @OneToMany(() => NotAvailableConstraint, (constraint) => constraint.subGroup)
  NotAvailableConstraints: NotAvailableConstraint[];

  @OneToMany(() => SpaceConstraint, (constraint) => constraint.subGroup)
  spaceConstraints: SpaceConstraint[];

  @OneToOne(() => MaxGapsPerWeekConstraint, (constraint) => constraint.year)
  maxGapsPerWeek: MaxGapsPerWeekConstraint;
}
