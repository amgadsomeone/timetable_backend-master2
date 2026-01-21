import { Day } from 'src/day/entity/day.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { Hour } from 'src/hour/entity/hour.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Year } from 'src/years/entity/years.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { User } from 'src/users/entity/users.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';

@Entity()
@Unique('UQ_NA_TEACHER', ['day', 'hour', 'teacher'])
@Unique('UQ_NA_YEAR', ['day', 'hour', 'year'])
@Unique('UQ_NA_GROUP', ['day', 'hour', 'group'])
@Unique('UQ_NA_SUBGROUP', ['day', 'hour', 'subGroup'])
export class NotAvailableConstraint {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Day, { nullable: false, eager: true, onDelete: 'CASCADE' })
  day: Day;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Timetable, { nullable: false, onDelete: 'CASCADE' })
  timetable: Timetable;
  @ManyToOne(() => Hour, { nullable: false, eager: true, onDelete: 'CASCADE' })
  hour: Hour;

  @ManyToOne(() => Teacher, (teacher) => teacher.NotAvailableConstraints, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  teacher?: Teacher;

  @ManyToOne(() => Year, (year) => year.NotAvailableConstraints, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  year?: Year;

  @ManyToOne(() => Group, (group) => group.NotAvailableConstraints, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  group?: Group;

  @ManyToOne(() => SubGroup, (subGroup) => subGroup.NotAvailableConstraints, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  subGroup?: SubGroup;
}
