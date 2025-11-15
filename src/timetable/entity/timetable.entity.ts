import { Activity } from 'src/activities/entity/activities.entity';
import { Building } from 'src/buildings/entity/buildings.entity';
import { Day } from 'src/day/entity/day.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { Hour } from 'src/hour/entity/hour.entity';
import { Room } from 'src/rooms/entity/rooms.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';
import { Tag } from 'src/tags/entity/tags.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { User } from 'src/users/entity/users.entity';
import { Year } from 'src/years/entity/years.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Timetable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable:false})
  InstitutionName: string;

  @Column({nullable:true})
  generatedTableUrl:string

  @OneToMany(() => Day, (day) => day.timetable)
  days: Day[];

  @OneToMany(() => Hour, (hour) => hour.timetable)
  hours: Hour[];

  @ManyToOne(() => User, (user) => user.timetable)
  User: User

  @OneToMany(() => Activity, (activity) => activity.timetable)
  activities: Activity[];

  @OneToMany(() => Teacher, (teacher) => teacher.timetable)
  teachers: Teacher[];

  @OneToMany(() => Tag, (tag) => tag.timetable)
  tags: Tag[];

  @OneToMany(() => Subject, (subject) => subject.timetable)
  subjects: Subject[];

  @OneToMany(() => Building, (building) => building.timetable)
  buildings: Building[];

  @OneToMany(() => Year, (year) => year.timetable)
  years: Year[];

  @OneToMany(() => Group, (group) => group.timetable)
  groups: Group[];

  @OneToMany(() => SubGroup, (subGroup) => subGroup.timetable)
  subGroups: SubGroup[];

  @OneToMany(() => Room, (room) => room.timetable)
  rooms: Room[];
}
