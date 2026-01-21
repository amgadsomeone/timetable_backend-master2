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
import { Year } from 'src/years/entity/years.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Tag } from 'src/tags/entity/tags.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
  ) { }

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
    console.log(createdActivities);
    return createdActivities[0];
  }



  private async validateActivites(timetableId: number, dtos: CreateActivityDto[]) {
    const yearIds = [...new Set(dtos.flatMap((d) => d.years || []))];
    const teacherIds = [...new Set(dtos.flatMap((d) => d.teachers || []))];
    const groupIds = [...new Set(dtos.flatMap((d) => d.groups || []))];
    const subGroupIds = [...new Set(dtos.flatMap((d) => d.subGroups || []))];
    const tagIds = [...new Set(dtos.flatMap((d) => d.tags || []))];
    const subjectIds = [...new Set(dtos.map((d) => d.subjectId).filter((id) => !!id))];

    const query = this.timetableRepository
      .createQueryBuilder('timetable')
      .select('timetable.id');

    if (yearIds.length > 0) {
      query.addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(Year, 'year')
            .where('year.id IN (:...yearIds)')
            .andWhere('year.timetableId = :timetableId'),
        'yearsFoundCount',
      );
    }

    if (teacherIds.length > 0) {
      query.addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(Teacher, 'teacher')
            .where('teacher.id IN (:...teacherIds)')
            .andWhere('teacher.timetableId = :timetableId'),
        'teachersFoundCount',
      );
    }

    if (groupIds.length > 0) {
      query.addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(Group, 'group')
            .where('group.id IN (:...groupIds)')
            .andWhere('group.timetableId = :timetableId'),
        'groupsFoundCount',
      );
    }

    if (subGroupIds.length > 0) {
      query.addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(SubGroup, 'subGroup')
            .where('subGroup.id IN (:...subGroupIds)')
            .andWhere('subGroup.timetableId = :timetableId'),
        'subGroupsFoundCount',
      );
    }

    if (tagIds.length > 0) {
      query.addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(Tag, 'tag')
            .where('tag.id IN (:...tagIds)')
            .andWhere('tag.timetableId = :timetableId'),
        'tagsFoundCount',
      );
    }

    if (subjectIds.length > 0) {
      query.addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(Subject, 'subject')
            .where('subject.id IN (:...subjectIds)')
            .andWhere('subject.timetableId = :timetableId'),
        'subjectsFoundCount',
      );
    }

    const result = await query
      .setParameters({
        timetableId,
        yearIds,
        teacherIds,
        groupIds,
        subGroupIds,
        tagIds,
        subjectIds,
      })
      .where('timetable.id = :timetableId', { timetableId })
      .getRawOne();

    if (!result) {
      throw new BadRequestException('Timetable not found');
    }

    if (yearIds.length > 0 && Number(result.yearsFoundCount || 0) !== yearIds.length) {
      throw new BadRequestException('One or more Years do not belong to this timetable.');
    }

    if (teacherIds.length > 0 && Number(result.teachersFoundCount || 0) !== teacherIds.length) {
      throw new BadRequestException('One or more Teachers do not belong to this timetable.');
    }

    if (groupIds.length > 0 && Number(result.groupsFoundCount || 0) !== groupIds.length) {
      throw new BadRequestException('One or more Groups do not belong to this timetable.');
    }

    if (subGroupIds.length > 0 && Number(result.subGroupsFoundCount || 0) !== subGroupIds.length) {
      throw new BadRequestException('One or more SubGroups do not belong to this timetable.');
    }

    if (tagIds.length > 0 && Number(result.tagsFoundCount || 0) !== tagIds.length) {
      throw new BadRequestException('One or more Tags do not belong to this timetable.');
    }

    if (subjectIds.length > 0 && Number(result.subjectsFoundCount || 0) !== subjectIds.length) {
      throw new BadRequestException('One or more Subjects do not belong to this timetable.');
    }
  }

  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateActivityDto[],
  ) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) {
      throw new BadRequestException('Timetable not found');
    }
    await this.validateActivites(timetableId, dtos);

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

    return this.activityRepository.save(entitiesToSave);
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
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) {
      throw new BadRequestException('Timetable not found');
    }
    const existing = await this.activityRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!existing) {
      throw new NotFoundException('Activity not found');
    }
    if (dto.duration !== undefined) existing.duration = dto.duration;

    await this.validateActivites(timetableId, [
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
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) {
      throw new BadRequestException('Timetable not found');
    }
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
