import { CreateActivityDto } from 'src/activities/dto/create-activity.dto';
import { CreateBuildingDto } from 'src/buildings/dto/create-building.dto';
import { CreateDayDto } from 'src/day/dto/create-day.dto';
import { CreateGroupDto } from 'src/groups/dto/create-group.dto';
import { CreateHourDto } from 'src/hour/dto/create-hour.dto';
import { CreateRoomDto } from 'src/rooms/dto/create-room.dto';
import { CreateSubGroupDto } from 'src/subgroups/dto/create-subgroup.dto';
import { CreateSubjectDto } from 'src/subjects/dto/create-subject.dto';
import { CreateTagDto } from 'src/tags/dto/create-tag.dto';
import { CreateTeacherDto } from 'src/teachers/dto/create-teacher.dto';

export enum ResourceType {
  Teachers = 'teachers',
  Subjects = 'subjects',
  Days = 'days',
  Hours = 'hours',
  Years = 'years',
  Groups = 'groups',
  SubGroups = 'subGroups',
  Buildings = 'buildings',
  Rooms = 'rooms',
  Tags = 'tags',
  Activities = 'activities',
  Timetable = 'timetable',
}

export enum SimpleResourceType {
  Teachers = 'teachers',
  Subjects = 'subjects',
  Days = 'days',
  Hours = 'hours',
  Years = 'years',
  Groups = 'groups',
  SubGroups = 'subGroups',
  Buildings = 'buildings',
  Rooms = 'rooms',
  Tags = 'tags',
}
export class addRecourse {
  activites?: CreateActivityDto;
  subjects?: CreateSubjectDto;
  group?: CreateGroupDto;
  subgroups?: CreateSubGroupDto;
  teachers?: CreateTeacherDto;
  buildings?: CreateBuildingDto;
  rooms?: CreateRoomDto;
  days?: CreateDayDto;
  hours?: CreateHourDto;
  tags?: CreateTagDto;
}

export class RemoveResource {
  activityId?: number;
  subjectId?: number;
  groupId?: number;
  subGroupId?: number;
  teacherId?: number;
  buildingId?: number;
  roomId?: number;
  dayId?: number;
  hourId?: number;
  tagId?: number;
}

export class UpdateResource {
  activities?: { activityId: number; createActivity: CreateActivityDto };
  subjects?: { subjectId: number; createSubject: CreateSubjectDto };
  group?: { groupId: number; createGroup: CreateGroupDto };
  subgroups?: { subgroupId: number; createSubGroup: CreateSubGroupDto };
  teachers?: { teacherId: number; createTeacher: CreateTeacherDto };
  buildings?: { buildingId: number; createBuilding: CreateBuildingDto };
  rooms?: { roomId: number; createRoom: CreateRoomDto };
  days?: { dayId: number; createDay: CreateDayDto };
  hours?: { hourId: number; createHour: CreateHourDto };
  tags?: { tagId: number; createTag: CreateTagDto };
}

import { IsEnum, IsInt, Min } from 'class-validator';

export class GetResourcesDto {
  @IsEnum(ResourceType)
  resourceType: ResourceType;
}

import { IsString, IsOptional } from 'class-validator';


export class CreateResourceDto {
  @IsEnum(SimpleResourceType)
  type: SimpleResourceType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  longname?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  buildingId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  yearId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  groupId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class RemoveResourceDto {
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @IsInt()
  @Min(1)
  resourceId: number;
}

export const systemInstruction = `
You are a specialized AI assistant for managing educational timetables. 
the time table id is provieded by defult from the program you dont need to know it
also you talk with non tecincal people so dont say the underlying stuff 
like the fucthion names or the ids or any thing from the response that is tecnical 
make your massages easy and not tecincal also dont say that i told you to be non tecincal
here is the cook book for you  
you now can add activites and resources as arrays no need to add them one by one 
firstily you have those tools that you can use 
get resource it takes the resourse type and give you the datafrom the database for that resourse like a list of subject for that timetable
you have createresourse that will create a resourse whither its a teacher or a subject or any other resourse in the system 
it only add one resourse at once so if you want to add multable resouses you should call it multable time one after another 
if user said i want to add new teachers called amgad and eman and an arabic subject and a new year called first year or something 
you will add amgad finsh and then add eman and then add arabic as subject and so on 
you also have a remove resourse which will take the id of the time table and the resouse id 
you can get the resourse id eather by searching using the get resourse that will return all resouse in the timetable with its data from this time table 
or if you newwilly created it it will give you the result including the id of that newily created resourse 
lastly 
the create activity functhion this is the functhion that assien new activities for the timetable 
so if a user told you a teacher should teach an activity for this year or this group 
you can ask him more for the activity details like the durathion and so on 
and then create this activity
notice it just create one activity 
so if the user told you year 1 should take 12 arabic or something 4 for teacher1 and the rest of the 12 to teacher2 
you will accthily call this functhion 12 time to create all those new activities with their teacher and year of course if any 
but the most important thing you should make a little todo list for the task that is given to you and think more about and for longer time before acting 
make sure to have a plan 
and look if user said 
"remove teacher jake he is no longer with us 
and give his activities for eman and amgad"

you will start by cheaking the activites that jake used to have and after knowing them 
like jake used to have 18 activity 
4 for year1 for arabic 
and 6 for year2 for engilish so on... 
and then add those activites for those teachers that user told you about or ask him about 
after you make sure every thing is alright then you delete jake and all his activites 
got it  and you can call yourself by yourself untill you do the job 
like dont stop after one call if you didnt finish yet 
just keep going untill you finish
`;
