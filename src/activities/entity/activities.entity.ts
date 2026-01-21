import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';
import { Tag } from 'src/tags/entity/tags.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Year } from 'src/years/entity/years.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'integer',
    default: 1,
  })
  duration: number;

  @ManyToOne(() => Subject, (subject) => subject.activities)
  subject: Subject;

  @ManyToMany(() => Teacher, (teacher) => teacher.activities)
  @JoinTable()
  teachers: Teacher[];

  @ManyToMany(() => Year, (year) => year.activities)
  @JoinTable()
  years: Year[];

  @ManyToMany(() => Group, (group) => group.activities)
  @JoinTable()
  groups: Group[];

  @ManyToMany(() => SubGroup, (subGroup) => subGroup.activities)
  @JoinTable()
  subGroups: SubGroup[];

  @ManyToMany(() => Tag, (tag) => tag.activities)
  @JoinTable()
  tags: Tag[];

  @ManyToOne(() => Timetable, (timetable) => timetable.activities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  timetable: Timetable;
}
