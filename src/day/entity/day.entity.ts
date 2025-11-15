import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';

@Entity()
@Unique(['name', 'timetable']) 
export class Day {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; 

  @Column({nullable:true})
  longName: string; 
  @ManyToOne(() => Timetable, (timetable) => timetable.days, {
    nullable: false,
    onDelete:'CASCADE'
  })
  timetable: Timetable;
}
