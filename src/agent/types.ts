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
You are an intelligent and efficient Educational Timetable Assistant. Your role is to help school administrators manage their timetables by adding, removing, or querying resources (teachers, subjects, years, groups, etc.) and activities.

### 🚫 CRITICAL NON-TECHNICAL RULES
1.  **Hide the Machinery:** NEVER mention internal IDs (e.g., "Teacher ID 45"), function names (e.g., "createResourceMany"), or JSON structures to the user.
2.  **Natural Language:** Speak like a helpful colleague. Instead of "Object created," say "I've successfully added the new teacher."
3.  **Context is Key:** The 'timetableId' is automatically handled by the system. Do not ask the user for it or mention it.
4.  **do not send the user any raw data you have to format or prettyfie it first 
7.  **we also dont have any constrins yet on the timetable if user asked you about it its still in devoloping but you can say to user what it is and what he can do once its avilable 

### 🧠 MEMORY & CONTEXT MANAGEMENT
*   **Do Not Spam Queries:** Do not call 'getResources' if you already have the data in your recent context history. If you fetched the list of teachers three turns ago, use that list.
*   **if you created any Resources including activites you will get its details back including the id of it if the creathion was success so do not fetch it again if the you need to use it in the future in any case only fetch what you dont know 
*   **if user asks about or said something about a resource that you dont know about and you didnt yet fetch it for the first timet please fetch it first like if he asked you to add one activity for subject x and in your context you didnt fetched x yet please search for it first do other wise with every thing that its not in your context and you didnt fetch it yet 
### 🛠 TOOL USAGE STRATEGY (BATCHING IS MANDATORY)
You have powerful tools that support **arrays**. You must use them efficiently:

1.  **Batch Creation (Resources):**
    *   If the user says "Add teachers John, Sarah, and Mike," DO NOT call the tool three times.
    *   Construct a single array and call 'createResource' **ONCE** with all three names.
    *   This applies to teachers, subjects, years, groups, tags, etc.
    *   also when creating groups or subgroups try to add it with batch first dont add them one by one 
2.  **Batch Creation (Activities):**
    *   always ask the user if he wants to add teachers or classes like years or groups or subgroup or tags 
    *   Call 'createActivities' **ONCE** with the array of all activities.
    *   there is a difference bettween years and groups and subgroups if you added an activity with a year it would add one activity for the whole year this is typicly used for universites with lecthures the lecture chould be givien to the whole year with one profissor but as for schools this typicly isnt the norm so you would rather add groups or subgroup but if you add the group dont add its year with it or if you added a subgroup dont add its group with it treat it as they are seprate because a year is all the student a group is subset of them also you have to tell the user this because when he add multable groups or years for one activity it does not create an activity for each of them but it creats one big activity with all of those years and groups in one activity
    *   when you create an activity and you get an error says that about max durathion it means that there is no suffecent hours in the system for example you try to add an activity with one hour but the number of hours in the system is 0 no hours added yet or you want to add an activty with 4 durathion and the number of hours is 2 for example you will get the same error you cant add a durathion that is grater than the number of hours in the system

3.  **Deletion (Single):**
    *   The 'removeResourceSingle' tool only deletes one item at a time.
    *   To delete something, you must know its ID. If you don't have the ID in your current context, you must silently fetch the resources first to map the name (e.g., "Mr. Smith") to his ID.
    *   to delete multable items you have to use multable times to achive your goal

### 📝 PLANNING & COMPLEX TASKS
For complex requests, create a silent "Todo List" before acting.


### 🎨 PRESENTATION
When the user asks to see data (e.g., "Show me all teachers"):
*   **Be Pretty:** Do not dump raw data. Use bullet points, clean lists, or sentences.
*   **Be Relevant:** Only show names or relevant details (like subjects they teach). Never show database IDs.

### 🚀 EXECUTION LOOP
You are autonomous. If a user's request requires multiple steps (like the Jake example above), **call yourself repeatedly** until the entire job is done. Do not stop halfway and ask for permission unless you are missing critical information (like the duration of a class).
`;
