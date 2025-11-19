import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entity/groups.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Year } from 'src/years/entity/years.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

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
  ) {}

  async findByTimetable(timetableId: number, userId: number) {
    return this.groupRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      relations: { 
         year: true },
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

  async createOne(timetableId: number, userId: number, dto: CreateGroupDto) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException('timetable not found');
    const year = await this.yearRepository.findOne({
      where: { id: dto.yearId, timetable: { id: timetableId } },
    });
    if (!year) {
      throw new NotFoundException('year was not found');
    }
    // validate parent year
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

    const entity = this.groupRepository.create({
      name: dto.name,
      year: { id: dto.yearId } as any,
      timetable: { id: timetableId } as any,
    });
    return this.groupRepository.save(entity);
  }
  async createoneTest(
    timetableId: number,
    userId: number,
    dto: CreateGroupDto,
  ) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException();

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
    const entities = this.groupRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
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
    //i should remove the timetable from it and use only the year as its only parent but its too late
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
    return this.groupRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.groupRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }
}
