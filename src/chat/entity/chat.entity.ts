import { User } from 'src/users/entity/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  timetable: number;

  @ManyToOne(() => User, (user) => user.chats)
  user: User;

  @Column({ type: 'json', default: () => "'[]'" })
  content: any[];

  @CreateDateColumn()
  createdAt: Date;
}
