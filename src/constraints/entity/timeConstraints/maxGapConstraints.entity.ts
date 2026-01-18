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

  @ManyToOne(() => Timetable, { onDelete: 'CASCADE' })
  @JoinColumn()
  timetable?: Timetable;

  @OneToOne(() => Teacher, { onDelete: 'CASCADE',nullable:true })
  @JoinColumn()
  teacher?: Teacher;

  @OneToOne(() => Year, { onDelete: 'CASCADE',nullable:true })
  @JoinColumn()
  year?: Year;

  @OneToOne(() => Group, { onDelete: 'CASCADE',nullable:true })
  @JoinColumn()
  group?: Group;

  @OneToOne(() => SubGroup, { onDelete: 'CASCADE' , nullable:true})
  @JoinColumn()
  subGroup?: SubGroup;
}
