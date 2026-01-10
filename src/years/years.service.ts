import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Year } from './entity/years.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { CreateYearDto } from './dto/create-year.dto';
import { UpdateYearDto } from './dto/update-year.dto';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';
import { In } from 'typeorm';

@Injectable()
export class YearsService {
  constructor(
    @InjectRepository(Year)
    private readonly yearRepository: Repository<Year>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(SubGroup)
    private readonly subgroupRepository: Repository<SubGroup>,
  ) {}

  async findByTimetable(timetableId: number, userId: number) {
    return this.yearRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      order: { id: 'DESC' },
    });
  }

  async findYearsPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Year>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.yearRepository.findAndCount({
      where: {
        timetable: { id: timeTableId, User: { id: userId } },
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

  async createOne(timetableId: number, userId: number, dto: CreateYearDto) {
    const createdYear = await this.createMany(timetableId, userId, [dto]);
    return createdYear[0];
  }

  async ValidateNamesExist(timetableId: number, names: string[]) {
    const namesExist = await this.timetableRepository.count({
      relations: {
        years: true,
        groups: true,
        subGroups: true,
      },
      where: [
        {
          id: timetableId,
          years: { name: In(names) },
        },
        {
          id: timetableId,
          groups: { name: In(names) },
        },
        {
          id: timetableId,
          subGroups: { name: In(names) },
        },
      ],
      relationLoadStrategy: 'query',
    });
    console.log(namesExist);
    return namesExist > 0;
  }

  async createMany(timetableId: number, userId: number, dtos: CreateYearDto[]) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });

    if (!timetable) throw new NotFoundException();

    const incomingNames = new Set<string>();

    dtos.forEach((yeardto) => {
      if (incomingNames.has(yeardto.name)) {
        throw new ConflictException(
          `Duplicate name "${yeardto.name}" found in the request.`,
        );
      }
      incomingNames.add(yeardto.name);
    });
    console.time('validatetest');
    const nameExists = await this.ValidateNamesExist(timetableId, [
      ...incomingNames,
    ]);
    console.timeEnd('validatetest');

    if (nameExists) {
      throw new ConflictException(
        `this name already exist in the database in years or groups or subgroups.`,
      );
    }
    const entities = this.yearRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        timetable: { id: timetableId },
      })),
    );
    return this.yearRepository.save(entities);
  }

  async findById(timetableId: number, id: number, userId: number) {
    const year = await this.yearRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!year) throw new NotFoundException();
    return year;
  }

  async updateOne(
    timetableId: number,
    userId: number,
    id: number,
    dto: UpdateYearDto,
  ) {
    const existing = await this.yearRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!existing) throw new NotFoundException();

    if (dto.name && dto.name !== existing.name) {
      const yearExists = await this.yearRepository.find({
        where: {
          name: dto.name,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (yearExists.length > 0) {
        throw new BadRequestException(
          `this time table has a already a year with this name: ${dto.name}`,
        );
      }
      const groupExists = await this.groupRepository.find({
        where: {
          name: dto.name,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (groupExists.length > 0)
        throw new BadRequestException(
          `this time table has a already a group with this name: ${dto.name}`,
        );
      const subGroupExists = await this.subgroupRepository.find({
        where: {
          name: dto.name,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (subGroupExists.length > 0)
        throw new BadRequestException(
          `this time table has a already a subgroup with this name: ${dto.name}`,
        );
    }

    Object.assign(existing, dto);
    return this.yearRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.yearRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }

  async deleteMany(timetableId: number, userId: number, ids: number[]) {
    const toDelete = await this.yearRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toDelete.length !== ids.length) {
      throw new ForbiddenException(
        'Some years were not found or you do not have permission to delete them',
      );
    }
    
    const res = await this.yearRepository.remove(toDelete);
    return res.length;
  }

  async updateMany(
    timetableId: number,
    userId: number,
    updates: { id: number; data: Partial<CreateYearDto> }[],
  ) {
    const ids = updates.map((u) => u.id);

    const toUpdate = await this.yearRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toUpdate.length !== ids.length) {
      throw new ForbiddenException(
        'Some years were not found or you do not have permission to update them',
      );
    }

    toUpdate.forEach((year) => {
      const update = updates.find((u) => u.id === year.id);
      if (update) {
        if (update.data.name !== undefined) year.name = update.data.name;
      }
    });

    const result = await this.yearRepository.save(toUpdate);
    return result.length;
  }

  async getYearWithRelations(id: number, userId: number) {
    const year = await this.yearRepository.findOne({
      where: { id, timetable: { User: { id: userId } } },
      relations: {
        activities: {
          groups: true,
          subGroups: true,
          tags: true,
          subject: true,
          teachers: true,
          years: true,
        },
      },
      relationLoadStrategy: 'query',
    });
    if (!year) {
      throw new NotFoundException('Year not found');
    }
    return year.activities.map((activity) => ({
      id: activity.id,
      duration: activity.duration,
      subject: { name: activity.subject.name, id: activity.subject.id },
      teachers: activity.teachers.map((t) => ({ name: t.name, id: t.id })),
      years: activity.years.map((y) => ({ name: y.name, id: y.id })),
      groups: activity.groups.map((g) => ({ name: g.name, id: g.id })),
      subGroups: activity.subGroups.map((sg) => ({ name: sg.name, id: sg.id })),
      tags: activity.tags.map((t) => ({ name: t.name, id: t.id })),
    }));
  }
}
