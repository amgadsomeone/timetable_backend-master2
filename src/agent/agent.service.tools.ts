import { GoogleGenAI } from '@google/genai';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
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
import { ResourceType, SimpleResourceType } from './types';
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
import { Parser } from 'json2csv';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Activity } from 'src/activities/entity/activities.entity';
import { Year } from 'src/years/entity/years.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Tag } from 'src/tags/entity/tags.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';

export enum RelationEntityType {
  Years = 'years',
  Groups = 'groups',
  SubGroups = 'subGroups',
  Subjects = 'subjects',
  Teachers = 'teachers',
  Tags = 'tags',
}

@Injectable()
export class AgentTools {
  private parser: Parser;
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
    private readonly dataSource: DataSource,
  ) {
    this.parser = new Parser({
      delimiter: '|',
      quote: '',
    });
  }

  async getResources(
    resourceType: ResourceType,
    timetableId: number,
    userId: number,
  ): Promise<string> {
    let data: any[];

    switch (resourceType) {
      case ResourceType.Subjects:
        data = await this.subjectsService.findSubjects(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
        }));
        break;
      case ResourceType.Teachers:
        data = await this.teachersService.findTeachers(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
        }));
        break;
      case ResourceType.Days:
        data = await this.daysService.findDays(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
        }));
        break;
      case ResourceType.Hours:
        data = await this.hoursService.findAllByTimetable(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
        }));
        break;
      case ResourceType.Years:
        data = await this.yearsService.findByTimetable(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
        }));
        break;
      case ResourceType.Groups:
        data = await this.groupsService.findByTimetable(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
          YearID: item.yearId,
        }));
        break;
      case ResourceType.SubGroups:
        data = await this.subgroupsService.findByTimetable(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
          GroupID: item.groupId,
        }));
        break;
      case ResourceType.Buildings:
        data = await this.buildingsService.findByTimetable(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
        }));
        break;
      case ResourceType.Rooms:
        data = await this.roomsService.findByTimetable(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
          BuildingID: item.buildingId,
        }));
        break;
      case ResourceType.Tags:
        data = await this.tagsService.findTags(timetableId, userId);
        data = data.map((item) => ({
          ID: item.id,
          Name: item.name,
        }));
        break;
      default:
        return `Error: Invalid resource type specified: '${resourceType}'.`;
    }

    if (data.length === 0) {
      return `No ${resourceType} found.`;
    }

    return this.parser.parse(data);
  }

  removeResources(
    type: ResourceType,
    timetableId: number,
    userId: number,
    resourceId: number[],
  ) {
    switch (type) {
      case ResourceType.Days:
        return this.daysService.deleteMany(timetableId, userId, resourceId);

      case ResourceType.Hours:
        return this.hoursService.deleteMany(timetableId, userId, resourceId);

      case ResourceType.Subjects:
        return this.subjectsService.deleteMany(timetableId, userId, resourceId);

      case ResourceType.Teachers:
        return this.teachersService.deleteMany(timetableId, userId, resourceId);

      case ResourceType.Buildings:
        return this.buildingsService.deleteMany(
          timetableId,
          userId,
          resourceId,
        );

      case ResourceType.Rooms:
        return this.roomsService.deleteMany(timetableId, userId, resourceId);

      case ResourceType.Years:
        return this.yearsService.deleteMany(timetableId, userId, resourceId);

      case ResourceType.Groups:
        return this.groupsService.deleteMany(timetableId, userId, resourceId);

      case ResourceType.SubGroups:
        return this.subgroupsService.deleteMany(
          timetableId,
          userId,
          resourceId,
        );

      case ResourceType.Tags:
        return this.tagsService.deleteMany(timetableId, userId, resourceId);

      case ResourceType.Activities:
        return this.activitiesService.deleteMany(
          timetableId,

          userId,
          resourceId,
        );

      default:
        return false;
    }
  }

  async createActivities(
    TimetableId: number,
    createActivites: CreateActivityDto[],
    userId: number,
  ) {
    const result = await this.activitiesService.createMany(
      TimetableId,
      userId,
      createActivites,
    );

    return result ? `Activities created successfully.` : result;
  }

  async CreateSimpleResourceMany(
    type: SimpleResourceType,
    timetableId: number,
    userId: number,
    data: {
      name: string;
      longname?: string;
      buildingId?: number;
      yearId?: number;
      groupId?: number;
      capacity?: number;
    }[],
  ): Promise<string> {
    try {
      let result: any[];

      switch (type) {
        case SimpleResourceType.SubGroups: {
          const groupId = data[0]?.groupId;
          if (!groupId) {
            throw new BadRequestException(
              'A groupId is required to create subgroups.',
            );
          }
          const dtos: CreateSubGroupDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
            groupId: item.groupId || groupId,
          }));
          result = await this.subgroupsService.createMany(
            timetableId,
            userId,
            dtos,
          );
          break;
        }

        case SimpleResourceType.Groups: {
          const yearId = data[0]?.yearId;
          if (!yearId) {
            throw new BadRequestException(
              'A yearId is required to create groups.',
            );
          }
          const dtos: CreateGroupDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
            yearId: item.yearId || yearId,
          }));
          result = await this.groupsService.createMany(
            timetableId,
            userId,
            dtos,
          );
          break;
        }

        case SimpleResourceType.Rooms: {
          const buildingId = data[0]?.buildingId;
          if (!buildingId) {
            throw new BadRequestException(
              'A buildingId is required to create rooms.',
            );
          }
          //room needs to be fixed later
          const dtos: CreateRoomDto[] = data.map((item) => ({
            name: item.name,
            capacity: item.capacity,
          }));
          result = await this.roomsService.createMany(buildingId, userId, dtos);
          break;
        }

        case SimpleResourceType.Days: {
          const dtos: CreateDayDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          result = await this.daysService.createMany(timetableId, userId, dtos);
          break;
        }

        case SimpleResourceType.Hours: {
          const dtos: CreateHourDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          result = await this.hoursService.createMany(
            timetableId,
            userId,
            dtos,
          );
          break;
        }

        case SimpleResourceType.Subjects: {
          const dtos: CreateSubjectDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          result = await this.subjectsService.createMany(
            timetableId,
            userId,
            dtos,
          );
          break;
        }

        case SimpleResourceType.Teachers: {
          const dtos: CreateTeacherDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          result = await this.teachersService.createMany(
            timetableId,
            userId,
            dtos,
          );
          break;
        }

        case SimpleResourceType.Buildings: {
          const dtos: CreateBuildingDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          result = await this.buildingsService.createMany(
            timetableId,
            userId,
            dtos,
          );
          break;
        }

        case SimpleResourceType.Years: {
          const dtos: CreateYearDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          result = await this.yearsService.createMany(
            timetableId,
            userId,
            dtos,
          );
          break;
        }

        case SimpleResourceType.Tags: {
          const dtos: CreateTagDto[] = data.map((item) => ({
            name: item.name,
            longName: item.longname,
          }));
          result = await this.tagsService.createMany(timetableId, userId, dtos);
          break;
        }

        default:
          throw new BadRequestException(`Unsupported resource type: '${type}'`);
      }

      // Format result with ID, Name, and parent ID if applicable
      let formattedResult: any[];
      switch (type) {
        case SimpleResourceType.Groups:
          formattedResult = result.map((item) => ({
            ID: item.id,
            Name: item.name,
            YearID: item.yearId,
          }));
          break;
        case SimpleResourceType.SubGroups:
          formattedResult = result.map((item) => ({
            ID: item.id,
            Name: item.name,
            GroupID: item.groupId,
          }));
          break;
        case SimpleResourceType.Rooms:
          formattedResult = result.map((item) => ({
            ID: item.id,
            Name: item.name,
            BuildingID: item.buildingId,
          }));
          break;
        default:
          formattedResult = result.map((item) => ({
            ID: item.id,
            Name: item.name,
          }));
      }

      if (formattedResult.length === 0) {
        return `No ${type} were created.`;
      }

      return this.parser.parse(formattedResult);
    } catch (error) {
      console.error(`Failed to create resources of type '${type}':`, error);
      throw error;
    }
  }

  async UpdateResource(
    type: SimpleResourceType,
    timetableId: number,
    userId: number,
    data: {
      id: number;
      name?: string;
      longname?: string;
      yearId?: number;
      groupId?: number;
    }[],
  ) {
    try {
      switch (type) {
        case SimpleResourceType.SubGroups: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
              longName: item.longname,
              groupId: item.groupId,
            } as Partial<CreateSubGroupDto>,
          }));
          return await this.subgroupsService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        case SimpleResourceType.Groups: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
              longName: item.longname,
              yearId: item.yearId,
            } as Partial<CreateGroupDto>,
          }));
          return await this.groupsService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        case SimpleResourceType.Rooms: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
            } as Partial<CreateRoomDto>,
          }));
          return await this.roomsService.updateMany(
            userId,
            updates,
          );
        }

        case SimpleResourceType.Days: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
              longName: item.longname,
            } as Partial<CreateDayDto>,
          }));
          return await this.daysService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        case SimpleResourceType.Hours: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
              longName: item.longname,
            } as Partial<CreateHourDto>,
          }));
          return await this.hoursService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        case SimpleResourceType.Subjects: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
              longName: item.longname,
            } as Partial<CreateSubjectDto>,
          }));
          return await this.subjectsService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        case SimpleResourceType.Teachers: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
              longName: item.longname,
            } as Partial<CreateTeacherDto>,
          }));
          return await this.teachersService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        case SimpleResourceType.Buildings: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
              longName: item.longname,
            } as Partial<CreateBuildingDto>,
          }));
          return await this.buildingsService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        case SimpleResourceType.Years: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
            } as Partial<CreateYearDto>,
          }));
          return await this.yearsService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        case SimpleResourceType.Tags: {
          const updates = data.map((item) => ({
            id: item.id,
            data: {
              name: item.name,
            } as Partial<CreateTagDto>,
          }));
          return await this.tagsService.updateMany(
            timetableId,
            userId,
            updates,
          );
        }

        default:
          throw new BadRequestException(`Unsupported resource type: ${type}`);
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to update resource: ${error.message}`,
      );
    }
  }

  async updateActivity(
    timetableId: number,
    userId: number,
    updates: {
      id: number;
      data: Partial<CreateActivityDto>;
    }[],
  ) {
    try {
      return await this.activitiesService.updateMany(
        timetableId,
        userId,
        updates,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to update activities: ${error.message}`,
      );
    }
  }

  async getEntityWithRelations(
    entityType: RelationEntityType,
    entityId: number,
    userId: number,
  ): Promise<string> {
    try {
      let activities: any[];

      switch (entityType) {
        case RelationEntityType.Years:
          activities = await this.yearsService.getYearWithRelations(
            entityId,
            userId,
          );
          break;
        case RelationEntityType.Groups:
          activities = await this.groupsService.getGroupWithRelations(
            entityId,
            userId,
          );
          break;
        case RelationEntityType.SubGroups:
          activities = await this.subgroupsService.getSubGroupWithRelations(
            entityId,
            userId,
          );
          break;
        case RelationEntityType.Teachers:
          activities = await this.teachersService.getTeacherWithRelations(
            entityId,
            userId,
          );
          break;
        case RelationEntityType.Tags:
          activities = await this.tagsService.getTagWithRelations(
            entityId,
            userId,
          );
          break;
        case RelationEntityType.Subjects:
          activities = await this.subjectsService.getSubjectWithRelations(
            entityId,
            userId,
          );
          break;
        default:
          throw new BadRequestException(
            `Unsupported entity type: ${entityType}`,
          );
      }

      if (!activities || activities.length === 0) {
        return `No activities found for this ${entityType}.`;
      }
      console.log(activities);
      const formattedActivities = activities.map((activity) => ({
        ActivityID: activity.id,
        Subject: activity.subject?.name || '',
        Teachers: activity.teachers?.map((t) => t.name).join(',') || '',
        Groups: activity.groups?.map((g) => g.name).join(',') || '',
        Years: activity.years?.map((y) => y.name).join(',') || '',
        SubGroups: activity.subGroups?.map((sg) => sg.name).join(',') || '',
        Tags: activity.tags?.map((tag) => tag.name).join(',') || '',
        Duration: activity.duration || '',

      }));

      return this.parser.parse(formattedActivities);
    } catch (error) {
      throw new BadRequestException(
        `Failed to get entity relations: ${error.message}`,
      );
    }
  }
}
