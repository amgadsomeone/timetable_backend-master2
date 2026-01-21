import { Activity } from 'src/activities/entity/activities.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Year } from 'src/years/entity/years.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class MaxGapsPerWeekConstraint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  maxGaps: number;

  @OneToOne(() => Teacher, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  teacher?: Teacher;

  @ManyToOne(() => Year, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  year?: Year;

  @ManyToOne(() => Group, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  group?: Group;

  @ManyToOne(() => SubGroup, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  subGroup?: SubGroup;
}
