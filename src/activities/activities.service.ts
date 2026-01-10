import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from './entity/activities.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
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
      order: { id: 'DESC' },
      relationLoadStrategy: 'query',
    });
  }

  async FindActivityAi(timetableId: number, userId: number) {
    return this.activityRepository.findAndCount({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      relations: { subject: true },
      order: { id: 'DESC' },
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
      relationLoadStrategy: 'query',
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

  async createOne(
    timetableId: number,
    userId: number,
    dto: CreateActivityDto,
  ): Promise<Activity> {
    const createdActivities = await this.createMany(timetableId, userId, [dto]);
    return createdActivities[0];
  }

  async validateActivites(
    timetableId,
    userID: number,
    dtos: CreateActivityDto[],
  ) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userID } },
      relations: {
        teachers: true,
        years: true,
        groups: true,
        subGroups: true,
        tags: true,
        subjects: true,
        hours: true,
      },
      select: {
        id: true,
        teachers: { id: true },
        years: { id: true },
        groups: { id: true },
        subGroups: { id: true },
        tags: { id: true },
        subjects: { id: true },
        hours: { id: true },
      },
      relationLoadStrategy: 'query',
    });

    if (!timetable) throw new NotFoundException('Timetable not found');

    const validTeacherIds = new Set(timetable.teachers.map((t) => t.id));
    const validYearIds = new Set(timetable.years.map((y) => y.id));
    const validGroupIds = new Set(timetable.groups.map((g) => g.id));
    const validSubGroupIds = new Set(timetable.subGroups.map((s) => s.id));
    const validTagIds = new Set(timetable.tags.map((t) => t.id));
    const validSubjectIds = new Set(timetable.subjects.map((s) => s.id));

    for (const dto of dtos) {
      if (dto.duration > timetable.hours.length) {
        throw new BadRequestException(
          `max durathion for this timetable is ${timetable.hours.length}`,
        );
      }
      // Validate Teachers
      if (dto.teachers?.some((id) => !validTeacherIds.has(id))) {
        throw new BadRequestException(
          `One or more Teachers do not belong to this timetable.`,
        );
      }
      // Validate Years
      if (dto.years?.some((id) => !validYearIds.has(id))) {
        throw new BadRequestException(
          `One or more Years do not belong to this timetable.`,
        );
      }
      // Validate Groups
      if (dto.groups?.some((id) => !validGroupIds.has(id))) {
        throw new BadRequestException(
          `One or more Groups do not belong to this timetable.`,
        );
      }
      // Validate SubGroups
      if (dto.subGroups?.some((id) => !validSubGroupIds.has(id))) {
        throw new BadRequestException(
          `One or more SubGroups do not belong to this timetable.`,
        );
      }
      // Validate Tags
      if (dto.tags?.some((id) => !validTagIds.has(id))) {
        throw new BadRequestException(
          `One or more Tags do not belong to this timetable.`,
        );
      }
      // Validate Subject (Single ID)
      if (dto.subjectId && !validSubjectIds.has(dto.subjectId)) {
        throw new BadRequestException(
          `The Subject does not belong to this timetable.`,
        );
      }
    }

    return true;
  }

  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateActivityDto[],
  ) {
    await this.validateActivites(timetableId, userId, dtos);

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

    return await this.activityRepository.save(entitiesToSave);
  }

  async findById(timetableId: number, id: number, userId: number) {
    const e = await this.activityRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
      relations: {
        teachers: true,
        groups: true,
        subGroups: true,
        years: true,
        subject: true,
        tags: true,
      },
      relationLoadStrategy: 'query',
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
    });
    if (!existing) {
      throw new NotFoundException('Activity not found');
    }
    if (dto.duration !== undefined) existing.duration = dto.duration;

    await this.validateActivites(timetableId, userId, [
      dto as CreateActivityDto,
    ]);
    if (dto.subjectId) existing.subject = { id: dto.subjectId } as any;
    if (dto.teachers)
      existing.teachers = dto.teachers.map((id) => ({ id }) as any);
    if (dto.years) existing.years = dto.years.map((id) => ({ id }) as any);
    if (dto.groups) existing.groups = dto.groups.map((id) => ({ id }) as any);
    if (dto.subGroups)
      existing.subGroups = dto.subGroups.map((id) => ({ id }) as any);
    if (dto.tags) existing.tags = dto.tags.map((id) => ({ id }) as any);

    return this.activityRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const activityToRemove = await this.activityRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });

    if (!activityToRemove) {
      throw new NotFoundException(`Activity with ID ${id} not found.`);
    }

    const res = await this.activityRepository.delete(id);
    return (res.affected ?? 0) > 0;
  }

  async deleteMany(timetableId: number, userId: number, ids: number[]) {
    const toDelete = await this.activityRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toDelete.length !== ids.length) {
      throw new ForbiddenException(
        'Some activities were not found or you do not have permission to delete them',
      );
    }

    const res = await this.activityRepository.remove(toDelete);
    return res.length;
  }

  async updateMany(
    timetableId: number,
    userId: number,
    updates: { id: number; data: Partial<CreateActivityDto> }[],
  ) {
    const ids = updates.map((u) => u.id);

    const toUpdate = await this.activityRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toUpdate.length !== ids.length) {
      throw new ForbiddenException(
        'Some activities were not found or you do not have permission to update them',
      );
    }
    await this.validateActivites(
      timetableId,
      userId,
      updates.map((u) => u.data as CreateActivityDto),
    );
    toUpdate.forEach((activity) => {
      const update = updates.find((u) => u.id === activity.id);
      if (update) {
        if (update.data.duration !== undefined)
          activity.duration = update.data.duration;
        if (update.data.subjectId !== undefined)
          activity.subject = { id: update.data.subjectId } as any;
        if (update.data.teachers !== undefined)
          activity.teachers = update.data.teachers.map(
            (id) => ({ id }) as any,
          ) as any;
        if (update.data.years !== undefined)
          activity.years = update.data.years.map(
            (id) => ({ id }) as any,
          ) as any;
        if (update.data.groups !== undefined)
          activity.groups = update.data.groups.map(
            (id) => ({ id }) as any,
          ) as any;
        if (update.data.subGroups !== undefined)
          activity.subGroups = update.data.subGroups.map(
            (id) => ({ id }) as any,
          ) as any;
        if (update.data.tags !== undefined)
          activity.tags = update.data.tags.map((id) => ({ id }) as any) as any;
      }
    });

    const result = await this.activityRepository.save(toUpdate as any);
    return result.length;
  }

  async getActivityWithRelations(id: number, userId: number) {
    const activity = await this.activityRepository.findOne({
      where: { id, timetable: { User: { id: userId } } },
      relations: {
        groups: true,
        subGroups: true,
        tags: true,
        subject: true,
        teachers: true,
        years: true,
      },
      relationLoadStrategy: 'query',
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return {
      id: activity.id,
      duration: activity.duration,
      subject: { name: activity.subject.name, id: activity.subject.id },
      teachers: activity.teachers.map((t) => ({ name: t.name, id: t.id })),
      years: activity.years.map((y) => ({ name: y.name, id: y.id })),
      groups: activity.groups.map((g) => ({ name: g.name, id: g.id })),
      subGroups: activity.subGroups.map((sg) => ({ name: sg.name, id: sg.id })),
      tags: activity.tags.map((t) => ({ name: t.name, id: t.id })),
    };
  }
}
