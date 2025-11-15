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

  @ManyToOne(() => Subject, { nullable: false, })
  subject: Subject;

  @ManyToMany(() => Teacher, { nullable: true })
  @JoinTable()
  teachers: Teacher[];

  @ManyToMany(() => Year, { nullable: true })
  @JoinTable()
  years: Year[];

  @ManyToMany(() => Group, { nullable: true })
  @JoinTable()
  groups: Group[];

  @ManyToMany(() => SubGroup, { nullable: true })
  @JoinTable()
  subGroups: SubGroup[];

  @ManyToMany(() => Tag, { nullable: true })
  @JoinTable()
  tags: Tag[];

  @ManyToOne(() => Timetable, (timetable) => timetable.activities, {
    nullable: false,
  })
  timetable: Timetable;
}
