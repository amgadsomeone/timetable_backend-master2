import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from './entity/groups.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Year } from 'src/years/entity/years.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';
import { YearsService } from 'src/years/years.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Year)
    private readonly yearRepository: Repository<Year>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(SubGroup)
    private readonly subgroupRepository: Repository<SubGroup>,
    private readonly yearService: YearsService,
  ) { }

  async findByTimetable(timetableId: number, userId: number) {
    return this.groupRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      relations: {
        year: true,
      },
      order: { id: 'DESC' },
    });
  }

  async findGroupsPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Group>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.groupRepository.findAndCount({
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

  async createone(timetableId: number, userId: number, dto: CreateGroupDto) {
    const CreateGroup = await this.createMany(timetableId, userId, [dto]);
    return CreateGroup[0];
  }
  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateGroupDto[],
  ) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { years: true },
      select: { years: { id: true }, id: true },
    });
    if (!timetable) throw new NotFoundException();

    const yearIds = new Set(timetable?.years.map((year) => year.id) || []);

    dtos.forEach((dto) => {
      if (!yearIds.has(dto.yearId)) {
        throw new BadRequestException(
          `One or more year do not belong to this timetable.`,
        );
      }
    });

    const incomingNames = new Set<string>();

    dtos.forEach((dto) => {
      if (incomingNames.has(dto.name)) {
        throw new ConflictException(
          `Duplicate name "${dto.name}" found in the request.`,
        );
      }
      incomingNames.add(dto.name);
    });
    await this.yearService.ValidateNamesExist(timetableId, [
      ...incomingNames,
    ]);
    const entities = this.groupRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        year: { id: dto.yearId },
        timetable: { id: timetableId },
      })),
    );
    return this.groupRepository.save(entities);
  }

  async findById(timetableId: number, id: number, userId: number) {
    const e = await this.groupRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!e) throw new NotFoundException();
    return e;
  }

  async updateOne(
    timetableId: number,
    userId: number,
    id: number,
    dto: UpdateGroupDto,
  ) {
    const existing = await this.groupRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!existing) throw new NotFoundException();

    if (dto.yearId) {
      const year = await this.yearRepository.findOne({
        where: {
          id: dto.yearId,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (!year)
        throw new NotFoundException('Parent year not found in this timetable');

      existing.year = year;
    }

    if (dto.name && dto.name !== existing.name) {
      await this.yearService.ValidateNamesExist(
        timetableId,
        [dto.name],
      );
    }

    Object.assign(existing, dto);
    return this.groupRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.groupRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }

  async deleteMany(timetableId: number, userId: number, ids: number[]) {
    const toDelete = await this.groupRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toDelete.length !== ids.length) {
      throw new ForbiddenException(
        'Some groups were not found or you do not have permission to delete them',
      );
    }

    const res = await this.groupRepository.remove(toDelete);
    return res.length;
  }

  async updateMany(
    timetableId: number,
    userId: number,
    updates: { id: number; data: Partial<CreateGroupDto> }[],
  ) {
    const ids = updates.map((u) => u.id);

    const toUpdate = await this.groupRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toUpdate.length !== ids.length) {
      throw new ForbiddenException(
        'Some groups were not found or you do not have permission to update them',
      );
    }
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { years: true },
      select: { years: { id: true }, id: true },
    });
    const yearIds = new Set(timetable?.years.map((year) => year.id) || []);
    updates.forEach((dto) => {
      if (dto.data.yearId !== undefined && !yearIds.has(dto.data.yearId)) {
        throw new BadRequestException(
          `One or more year do not belong to this timetable.`,
        );
      }
    });

    toUpdate.forEach((group) => {
      const update = updates.find((u) => u.id === group.id);
      if (update) {
        if (update.data.name !== undefined) group.name = update.data.name;
        if (update.data.yearId !== undefined)
          group.year = { id: update.data.yearId } as Year;
      }
    });

    const result = await this.groupRepository.save(toUpdate);
    return result.length;
  }

  async getGroupWithRelations(id: number, userId: number) {
    const group = await this.groupRepository.find({
      where: { id, timetable: { User: { id: userId } } },
      relations: {
        activities: true,
        subGroups: true,
        year: true,
        timetable: true,
      },
      relationLoadStrategy: 'query',
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    console.log(group);
    return group;
    /*
    return group.activities.map((activity) => ({
      id: activity.id,
      duration: activity.duration,
      subject: { name: activity.subject.name, id: activity.subject.id },
      teachers: activity.teachers.map((t) => ({ name: t.name, id: t.id })),
      years: activity.years.map((y) => ({ name: y.name, id: y.id })),
      groups: activity.groups.map((g) => ({ name: g.name, id: g.id })),
      subGroups: activity.subGroups.map((sg) => ({ name: sg.name, id: sg.id })),
      tags: activity.tags.map((t) => ({ name: t.name, id: t.id })),
    }));
    */
  }
}

