import { Group } from 'src/groups/entity/groups.entity';
import { Room } from 'src/rooms/entity/rooms.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Year } from 'src/years/entity/years.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class SpaceConstraint {
  @PrimaryGeneratedColumn()
  id: number;

  // A space constraint MUST be for exactly one Room.
  @ManyToOne(() => Room, { nullable: false, eager: true, onDelete: 'CASCADE' })
  room: Room;

  // A constraint belongs to ONE of the following. The others will be null.
  @ManyToOne(() => Teacher, (teacher) => teacher.spaceConstraints, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  teacher?: Teacher;

  @ManyToOne(() => Year, (year) => year.spaceConstraints, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  year?: Year;

  @ManyToOne(() => Group, (group) => group.spaceConstraints, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  group?: Group;

  @ManyToOne(() => SubGroup, (subGroup) => subGroup.spaceConstraints, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  subGroup?: SubGroup;
}
