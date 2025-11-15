import { Chat } from 'src/chat/entity/chat.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clerkId: string;

  @Column({nullable:true})
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @OneToMany(() => Timetable, (timetable) => timetable.User, {
    nullable: false,
  })
  timetable: Timetable[];

  @OneToMany(() => Chat, (chat) => chat.user)
  chats: Chat[];
}
