import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryFailedError } from 'typeorm';
import { Activity } from './entity/activities.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Year } from 'src/years/entity/years.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Tag } from 'src/tags/entity/tags.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Year)
    private readonly yearRepository: Repository<Year>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(SubGroup)
    private readonly subGroupRepository: Repository<SubGroup>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async findByTimetable(timetableId: number, userId: number) {
    return this.activityRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      relations: {
        teachers: true,
        groups: true,
        subGroups: true,
        years: true,
        subject: true,
        tags: true,
      },
    });
  }

  async FindActivityAi(timetableId: number, userId: number) {
    return this.activityRepository.findAndCount({
      where: { timetable: { id: timetableId, User: { id: userId } } },
    });
  }

  async findActivityPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Activity>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.activityRepository.findAndCount({
      where: { timetable: { id: timeTableId, User: { id: userId } } },
      relations: {
        teachers: true,
        groups: true,
        subGroups: true,
        years: true,
        subject: true,
        tags: true,
      },
      take: limit,
      skip: skip,
      order: {
        id: 'ASC',
      },
    });

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      lastPage,
    };
  }

  // helper to validate many-to-many ids belong to timetable
  private async validateIdsInTimetable(
    repo: Repository<any>,
    ids: number[],
    timetableId: number,
    entityName: string,
    userId: number,
  ) {
    if (!ids || ids.length === 0) return [];

    // Add the timetable check directly to the where clause
    const entities = await repo.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } }, // <-- THE BETTER FIX
      },
    });

    if (entities.length !== ids.length) {
      throw new BadRequestException(
        `One or more ${entityName} IDs are invalid or do not belong to the specified timetable.`,
      );
    }

    return entities as any[]; // No further filtering is needed
  }

  async createOne(
    timetableId: number,
    userId: number,
    dto: CreateActivityDto,
  ): Promise<Activity> {
    const createdActivities = await this.createMany(timetableId, userId, [dto]);
    return createdActivities[0];
  }

  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateActivityDto[],
  ) {
    const timetableExists = await this.timetableRepository.existsBy({
      id: timetableId,
      User: { id: userId },
    });

    if (!timetableExists) {
      throw new NotFoundException(
        `Timetable with id ${timetableId} not found or access denied.`,
      );
    }

    // 2. Map DTOs to entities without any validation loops.
    // The structure is simple and fast.
    const entitiesToSave = dtos.map((activity) =>
      this.activityRepository.create({
        duration: activity.duration,
        timetable: { id: timetableId },
        subject: { id: activity.subjectId },
        teachers: (activity.teachers || []).map((id) => ({ id })),
        years: (activity.years || []).map((id) => ({ id })),
        groups: (activity.groups || []).map((id) => ({ id })),
        subGroups: (activity.subGroups || []).map((id) => ({ id })),
        tags: (activity.tags || []).map((id) => ({ id })),
      }),
    );

    // 3. Execute a single bulk insert operation inside a try-catch block.
    try {
      // Use .insert() for raw performance if you don't need entity listeners or cascades.
      // Use .save() if you need those features. .insert() is generally faster for bulk data.
      return await this.activityRepository.save(entitiesToSave);
    } catch (error) {
      // 4. Catch database-specific errors and convert them into a user-friendly message.
      if (error instanceof QueryFailedError && error.driverError?.code) {
        // The error code for foreign key violation can differ by database (e.g., '23503' in PostgreSQL)
        if (error.driverError.code === '23503') {
          // Example for PostgreSQL
          throw new BadRequestException(
            `Invalid data provided. One of the IDs for subject, teacher, year, group, sub-group, or tag does not exist in the specified timetable.`,
          );
        }
      }
      // Re-throw any other unexpected errors.
      throw error;
    }
  }

  async findById(timetableId: number, id: number, userId: number) {
    const e = await this.activityRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!e) throw new NotFoundException();
    return e;
  }

  async updateOne(
    timetableId: number,
    id: number,
    userId: number,
    dto: UpdateActivityDto,
  ) {
    const existing = await this.activityRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
      relations: { timetable: { hours: true } },
    });
    if (!existing) throw new NotFoundException();

    if (dto.duration! > existing.timetable.hours.length) {
      throw new BadRequestException(
        `max duration for this timetable is ${existing.timetable.hours.length}`,
      );
    }

    if ((dto as any).subjectId) {
      const subject = await this.subjectRepository.findOne({
        where: {
          id: (dto as any).subjectId,
          timetable: { id: timetableId },
        },
      });
      if (!subject)
        throw new BadRequestException('Subject not found in timetable');
      existing.subject = { id: (dto as any).subjectId } as any;
    }

    if (dto.teachers)
      existing.teachers = await this.validateIdsInTimetable(
        this.teacherRepository,
        dto.teachers || [],
        timetableId,
        'Teacher',
        userId,
      );

    if (dto.years)
      existing.years = await this.validateIdsInTimetable(
        this.yearRepository,
        dto.years || [],
        timetableId,
        'Year',
        userId,
      );
    if (dto.groups)
      existing.groups = await this.validateIdsInTimetable(
        this.groupRepository,
        dto.groups || [],
        timetableId,
        'Group',
        userId,
      );
    if (dto.subGroups)
      existing.subGroups = await this.validateIdsInTimetable(
        this.subGroupRepository,
        dto.subGroups || [],
        timetableId,
        'SubGroup',
        userId,
      );
    if (dto.tags)
      existing.tags = await this.validateIdsInTimetable(
        this.tagRepository,
        dto.tags || [],
        timetableId,
        'Tag',
        userId,
      );

    Object.assign(existing, dto);
    return this.activityRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    // this could resolve into cardisian exploding problem it gotta be fixed 
    const activityToRemove = await this.activityRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
      relations: ['teachers', 'groups', 'subGroups', 'years'],
    });

    // A good practice is to check if it even exists.
    if (!activityToRemove) {
      throw new NotFoundException(`Activity with ID ${id} not found.`);
    }

    const res = await this.activityRepository.remove(activityToRemove);
    return true;
  }
}
