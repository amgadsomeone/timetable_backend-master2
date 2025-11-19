import { GoogleGenAI } from '@google/genai';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SubjectsService } from 'src/subjects/subjects.service';
import { TeachersService } from 'src/teachers/teachers.service';
import { ActivitiesService } from 'src/activities/activities.service';
import { YearsService } from 'src/years/years.service';
import { GroupsService } from 'src/groups/groups.service';
import { SubgroupsService } from 'src/subgroups/subgroups.service';
import { BuildingsService } from 'src/buildings/buildings.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { TagsService } from 'src/tags/tags.service';
import { DayService } from 'src/day/day.service';
import { HourService } from 'src/hour/hour.service';
import {
  addRecourse,
  RemoveResource,
  ResourceType,
  SimpleResourceType,
  UpdateResource,
} from './types';
import { CreateActivityDto } from 'src/activities/dto/create-activity.dto';
import { CreateGroupDto } from 'src/groups/dto/create-group.dto';
import { CreateSubGroupDto } from 'src/subgroups/dto/create-subgroup.dto';
import { CreateTeacherDto } from 'src/teachers/dto/create-teacher.dto';
import { CreateBuildingDto } from 'src/buildings/dto/create-building.dto';
import { CreateDayDto } from 'src/day/dto/create-day.dto';
import { CreateHourDto } from 'src/hour/dto/create-hour.dto';
import { CreateRoomDto } from 'src/rooms/dto/create-room.dto';
import { CreateSubjectDto } from 'src/subjects/dto/create-subject.dto';
import { CreateYearDto } from 'src/years/dto/create-year.dto';
import { CreateTagDto } from 'src/tags/dto/create-tag.dto';
@Injectable()
export class AgentTools {
  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly teachersService: TeachersService,
    private readonly activitiesService: ActivitiesService,
    private readonly daysService: DayService,
    private readonly hoursService: HourService,
    private readonly yearsService: YearsService,
    private readonly groupsService: GroupsService,
    private readonly subgroupsService: SubgroupsService,
    private readonly buildingsService: BuildingsService,
    private readonly roomsService: RoomsService,
    private readonly tagsService: TagsService,
    @Inject('gemini') private readonly ai: GoogleGenAI,
  ) {}

  async getResources(
    resourceType: ResourceType,
    timetableId: number,
    userId: number,
  ): Promise<string> {
    let results: any[];

    switch (resourceType) {
      case ResourceType.Subjects:
        results = await this.subjectsService.findSubjects(timetableId, userId);
        break;
      case ResourceType.Teachers:
        results = await this.teachersService.findTeachers(timetableId, userId);
        break;
      case ResourceType.Activities:
        results = await this.activitiesService.FindActivityAi(
          timetableId,
          userId,
        );
        break;
      case ResourceType.Days:
        results = await this.daysService.findDays(timetableId, userId);
        break;
      case ResourceType.Hours:
        results = await this.hoursService.findAllByTimetable(
          timetableId,
          userId,
        );
        break;
      case ResourceType.Years:
        results = await this.yearsService.findByTimetable(timetableId, userId);
        break;
      case ResourceType.Groups:
        results = await this.groupsService.findByTimetable(timetableId, userId);
        break;
      case ResourceType.SubGroups:
        results = await this.subgroupsService.findByTimetable(
          timetableId,
          userId,
        );
        break;
      case ResourceType.Buildings:
        results = await this.buildingsService.findByTimetable(
          timetableId,
          userId,
        );
        break;
      case ResourceType.Rooms:
        results = await this.roomsService.findByTimetable(timetableId, userId);
        break;
      case ResourceType.Tags:
        results = await this.tagsService.findTags(timetableId, userId);
        break;
      default:
        return `Error: Invalid resource type specified: '${resourceType}'.`;
    }

    return JSON.stringify(results, null, 2);
  }

  async modifySimpleResource(
    type: SimpleResourceType,
    timetableId: number,
    userId: number,
    data: { name: string; longname?: string },
    buildingId?: number,
    yearId?: number,
    groupId?: number,
    capacity?: number,
  ) {
    try {
      switch (type) {
        case SimpleResourceType.SubGroups: {
          if (!groupId) return 'error groupId must exist to create subgroup';
          const dto: CreateSubGroupDto = {
            name: data.name,
            groupId: groupId,
          };
          return await this.subgroupsService.createOne(
            timetableId,
            userId,
            dto,
          );
        }

        case SimpleResourceType.Groups: {
          if (!yearId) return 'error yearId must exist to create group';
          const dto: CreateGroupDto = {
            name: data.name,
            yearId: yearId,
          };
          return await this.groupsService.createone(timetableId, userId, dto);
        }

        case SimpleResourceType.Rooms: {
          if (!buildingId) return 'error buildingId must exist to create room';
          const dto: CreateRoomDto = {
            name: data.name,
            capacity: capacity,
          };
          return await this.roomsService.createOne(buildingId, userId, dto);
        }

        case SimpleResourceType.Days: {
          const dto: CreateDayDto = {
            name: data.name,
            longName: data.longname,
          };
          return await this.daysService.createOne(timetableId, userId, dto);
        }

        case SimpleResourceType.Hours: {
          const dto: CreateHourDto = {
            name: data.name,
            longName: data.longname,
          };
          return await this.hoursService.createOne(timetableId, userId, dto);
        }

        case SimpleResourceType.Subjects: {
          const dto: CreateSubjectDto = {
            name: data.name,
            longName: data.longname,
          };
          return await this.subjectsService.createOne(timetableId, userId, dto);
        }

        case SimpleResourceType.Teachers: {
          const dto: CreateTeacherDto = {
            name: data.name,
            longName: data.longname,
          };
          return await this.teachersService.createOne(timetableId, userId, dto);
        }

        case SimpleResourceType.Buildings: {
          const dto: CreateBuildingDto = {
            name: data.name,
            longName: data.longname,
          };
          return await this.buildingsService.createOne(
            timetableId,
            userId,
            dto,
          );
        }

        case SimpleResourceType.Years: {
          const dto: CreateYearDto = {
            name: data.name,
          };
          return await this.yearsService.createOne(timetableId, userId, dto);
        }

        case SimpleResourceType.Tags: {
          const dto: CreateTagDto = {
            name: data.name,
            longName: data.longname,
          };
          return await this.tagsService.createOne(timetableId, userId, dto);
        }

        default:
          return `error: unknown resource type ${type}`;
      }
    } catch (error) {
      return error;
    }
  }

  removeResourceSingle(
    type: ResourceType,
    timetableId: number,
    userId: number,
    resourceId: number,
  ) {
    // well delete does not need the timetable id but this is an ai slops
    switch (type) {
      case ResourceType.Days:
        return this.daysService.deleteOne(timetableId, userId, resourceId);

      case ResourceType.Hours:
        return this.hoursService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.Subjects:
        return this.subjectsService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.Teachers:
        return this.teachersService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.Buildings:
        return this.buildingsService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.Rooms:
        return this.roomsService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.Years:
        return this.yearsService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.Groups:
        return this.groupsService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.SubGroups:
        return this.subgroupsService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.Tags:
        return this.tagsService.deleteOne(timetableId, resourceId, userId);

      case ResourceType.Activities:
        return this.activitiesService.deleteOne(
          timetableId,
          resourceId,
          userId,
        );

      default:
        return false;
    }
  }

  createActivities(
    TimetableId: number,
    createActivites: CreateActivityDto[],
    userId: number,
  ) {
    return this.activitiesService.createMany(
      TimetableId,
      userId,
      createActivites,
    );
  }

  async modifySimpleResourceMany(
    type: SimpleResourceType,
    timetableId: number,
    userId: number,
    data: { name: string; longname?: string }[],
    buildingId?: number,
    yearId?: number,
    groupId?: number,
    capacity?: number,
  ) {

    try {
      switch (type) {
        case SimpleResourceType.SubGroups: {
          if (!groupId) {
            throw new BadRequestException(
              'A groupId is required to create subgroups.',
            );
          }
          const dtos: CreateSubGroupDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
            groupId: groupId,
          }));
          return await this.subgroupsService.createMany(
            timetableId,
            userId,
            dtos,
          );
        }

        case SimpleResourceType.Groups: {
          if (!yearId) {
            throw new BadRequestException(
              'A yearId is required to create groups.',
            );
          }
          const dtos: CreateGroupDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname, // Assuming CreateGroupDto also has longName
            yearId: yearId,
          }));
          console.log(dtos)
          return await this.groupsService.createMany(timetableId, userId, dtos);
        }

        case SimpleResourceType.Rooms: {
          if (!buildingId) {
            throw new BadRequestException(
              'A buildingId is required to create rooms.',
            );
          }
          const dtos: CreateRoomDto[] = data.map((item) => ({
            name: item.name,
            capacity: capacity, 
          }));
          return await this.roomsService.createMany(buildingId, userId, dtos);
        }

        case SimpleResourceType.Days: {
          const dtos: CreateDayDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          return await this.daysService.createMany(timetableId, userId, dtos);
        }

        case SimpleResourceType.Hours: {
          const dtos: CreateHourDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          return await this.hoursService.createMany(timetableId, userId, dtos);
        }

        case SimpleResourceType.Subjects: {
          const dtos: CreateSubjectDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          return await this.subjectsService.createMany(
            timetableId,
            userId,
            dtos,
          );
        }

        case SimpleResourceType.Teachers: {
          const dtos: CreateTeacherDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          return await this.teachersService.createMany(
            timetableId,
            userId,
            dtos,
          );
        }

        case SimpleResourceType.Buildings: {
          const dtos: CreateBuildingDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          return await this.buildingsService.createMany(
            timetableId,
            userId,
            dtos,
          );
        }

        case SimpleResourceType.Years: {
          const dtos: CreateYearDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname, // Assuming CreateYearDto can have longName
          }));
          return await this.yearsService.createMany(timetableId, userId, dtos);
        }

        case SimpleResourceType.Tags: {
          const dtos: CreateTagDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          return await this.tagsService.createMany(timetableId, userId, dtos);
        }

        default:
          // This provides a clean error for unsupported or misspelled resource types.
          throw new BadRequestException(`Unsupported resource type: '${type}'`);
      }
    } catch (error) {
      // Log the internal error for debugging.
      console.error(`Failed to create resources of type '${type}':`, error);
      // Re-throw the error so NestJS can handle it and send a proper HTTP response.
      throw error;
    }
  }
}
