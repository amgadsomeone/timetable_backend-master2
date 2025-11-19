import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubGroup } from './entity/subgroups.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { CreateSubGroupDto } from './dto/create-subgroup.dto';
import { UpdateSubGroupDto } from './dto/update-subgroup.dto';
import { Year } from 'src/years/entity/years.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class SubgroupsService {
  constructor(
    @InjectRepository(Year)
    private readonly yearRepository: Repository<Year>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(SubGroup)
    private readonly subGroupRepository: Repository<SubGroup>,
  ) {}

  async findByTimetable(timetableId: number, userId: number) {
    return this.subGroupRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      relations: { group: true },
      order: { id: 'DESC' },
    });
  }

  async findSubGroupPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<SubGroup>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.subGroupRepository.findAndCount({
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

  async createOne(timetableId: number, userId: number, dto: CreateSubGroupDto) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException();

    // validate parent group exists and belongs to timetable
    const group = await this.groupRepository.findOne({
      where: {
        id: dto.groupId,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
    if (!group)
      throw new NotFoundException('Parent group not found in this timetable');

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
    const subGroupExists = await this.subGroupRepository.find({
      where: {
        name: dto.name,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
    if (subGroupExists.length > 0)
      throw new BadRequestException(
        `this time table has a already a subgroup with this name: ${dto.name}`,
      );

    const entity = this.subGroupRepository.create({
      name: dto.name,
      group: { id: dto.groupId } as any,
      timetable: { id: timetableId } as any,
    });
    return this.subGroupRepository.save(entity);
  }
  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateSubGroupDto[],
  ) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { years: true, groups: true, subGroups: true },
    });
    if (!timetable) throw new NotFoundException();

    const existingYearNames = new Set(timetable.years.map((y) => y.name));
    const existingGroupNames = new Set(timetable.groups.map((g) => g.name));
    const existingSubGroupNames = new Set(
      timetable.subGroups.map((sg) => sg.name),
    );
    const incomingNames = new Set<string>();

    dtos.forEach((yeardto) => {
      if (existingYearNames.has(yeardto.name)) {
        throw new BadRequestException(
          `this time table has a already a year with this name: ${yeardto.name}`,
        );
      }
      if (existingGroupNames.has(yeardto.name)) {
        throw new BadRequestException(
          `this time table has a already a group with this name: ${yeardto.name}`,
        );
      }
      if (existingSubGroupNames.has(yeardto.name)) {
        throw new BadRequestException(
          `this time table has a already a subgroup with this name: ${yeardto.name}`,
        );
      }
      if (incomingNames.has(yeardto.name)) {
        throw new ConflictException(
          `Duplicate name "${yeardto.name}" found in the request.`,
        );
      }
      incomingNames.add(yeardto.name);
    });
    const entities = this.subGroupRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        timetable: { id: timetableId },
      })),
    );
    return this.subGroupRepository.save(entities);
  }

  async findById(timetableId: number, id: number, userId: number) {
    const e = await this.subGroupRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!e) throw new NotFoundException();
    return e;
  }

  async updateOne(
    timetableId: number,
    userId: number,
    id: number,
    dto: UpdateSubGroupDto,
  ) {
    const existing = await this.subGroupRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!existing) throw new NotFoundException();

    if (dto.groupId) {
      const group = await this.groupRepository.findOne({
        where: {
          id: dto.groupId,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (!group)
        throw new NotFoundException('Parent group not found in this timetable');
      existing.group = { id: dto.groupId } as any;
    }

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
      const subGroupExists = await this.subGroupRepository.find({
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
    return this.subGroupRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.subGroupRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }
}
