import { Day } from 'src/day/entity/day.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { Hour } from 'src/hour/entity/hour.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Year } from 'src/years/entity/years.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class NotAvailableConstraint {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Day, { nullable: false, eager: true, onDelete: 'CASCADE' })
  day: Day;

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
