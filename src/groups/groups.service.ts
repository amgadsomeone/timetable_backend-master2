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
  ) {}

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
    const yearIds = new Set(timetable?.years.map((year) => year.id) || []);
    dtos.forEach((dto) => {
      if (!yearIds.has(dto.yearId)) {
        throw new BadRequestException(
          `One or more year do not belong to this timetable.`,
        );
      }
    });
    if (!timetable) throw new NotFoundException();

    const incomingNames = new Set<string>();

    dtos.forEach((dto) => {
      if (incomingNames.has(dto.name)) {
        throw new ConflictException(
          `Duplicate name "${dto.name}" found in the request.`,
        );
      }
      incomingNames.add(dto.name);
    });
    const nameExists = await this.yearService.ValidateNamesExist(timetableId, [
      ...incomingNames,
    ]);
    if (nameExists) {
      throw new ConflictException(
        `this name already exist in the database in years or groups or subgroups.`,
      );
    }
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
      const nameExists = await this.yearService.ValidateNamesExist(
        timetableId,
        [dto.name],
      );
      if (nameExists) {
        throw new ConflictException(
          `this name already exist in the database in years or groups or subgroups.`,
        );
      }
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
