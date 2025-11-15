import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Year } from 'src/years/entity/years.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class MaxGapsPerWeekConstraint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  maxGaps: number;

  // This constraint is owned by ONE of the following. The others will be null.
  @OneToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn()
  teacher?: Teacher;

  @OneToOne(() => Year, { onDelete: 'CASCADE' })
  @JoinColumn()
  year?: Year;

  @OneToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn()
  group?: Group;

  @OneToOne(() => SubGroup, { onDelete: 'CASCADE' })
  @JoinColumn()
  subGroup?: SubGroup;
}
