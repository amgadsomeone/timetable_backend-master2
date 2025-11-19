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
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';
import { YearsService } from 'src/years/years.service';

@Injectable()
export class SubgroupsService {
  constructor(
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(SubGroup)
    private readonly subGroupRepository: Repository<SubGroup>,
    private readonly yearService: YearsService,
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
    const subGroup = await this.createMany(timetableId, userId, [dto]);
    return subGroup[0];
  }

  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateSubGroupDto[],
  ) {
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
    const nameExists = await this.yearService.ValidateNamesExist(timetableId, [
      ...incomingNames,
    ]);
    if (nameExists) {
      throw new ConflictException(
        `this name already exist in the database in years or groups or subgroups.`,
      );
    }
    const entities = this.subGroupRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        group: { id: dto.groupId },
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
