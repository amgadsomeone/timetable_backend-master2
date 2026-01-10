import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Building } from './entity/buildings.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
  ) {}

  async findByTimetable(timetableId: number, userId: number) {
    return this.buildingRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      order: { id: 'DESC' },
    });
  }

  async findBuildingsPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Building>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.buildingRepository.findAndCount({
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

  async createOne(timetableId: number, userId: number, dto: CreateBuildingDto) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException();

    const existing = await this.buildingRepository.findOne({
      where: {
        name: dto.name,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
    if (existing)
      throw new ConflictException(
        'Building name already exists for this timetable',
      );

    const entity = this.buildingRepository.create({
      name: dto.name,
      longName: dto.longName,
      timetable: { id: timetableId },
    });
    return this.buildingRepository.save(entity);
  }

  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateBuildingDto[],
  ) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { buildings: true },
      select: { id: true, User: { id: true }, buildings: { name: true } },
    });
    if (!timetable) throw new NotFoundException();
    const existingNames = new Set(timetable.buildings.map((y) => y.name));
    const incomingNames = new Set<string>();
    dtos.forEach((dto) => {
      if (existingNames.has(dto.name)) {
        throw new BadRequestException(
          `building name ${dto.name} already exist in this timetable`,
        );
      }
      if (incomingNames.has(dto.name)) {
        throw new ConflictException(
          `Duplicate name "${dto.name}" found in the request.`,
        );
      }
      incomingNames.add(dto.name);
    });
    const entities = this.buildingRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        timetable: { id: timetableId },
      })),
    );
    return this.buildingRepository.save(entities);
  }

  async findById(timetableId: number, id: number, userId: number) {
    const e = await this.buildingRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!e) throw new NotFoundException();
    return e;
  }

  async updateOne(
    timetableId: number,
    id: number,
    userId: number,
    dto: UpdateBuildingDto,
  ) {
    const existing = await this.buildingRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
    if (!existing) throw new NotFoundException();

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.buildingRepository.findOne({
        where: {
          name: dto.name,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (conflict && conflict.id !== id)
        throw new ConflictException(
          'Building name already exists for this timetable',
        );
    }

    Object.assign(existing, dto);
    return this.buildingRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.buildingRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }

  async deleteMany(timetableId: number, userId: number, ids: number[]) {
    const toDelete = await this.buildingRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toDelete.length !== ids.length) {
      throw new ForbiddenException(
        'Some buildings were not found or you do not have permission to delete them',
      );
    }
    
    const res = await this.buildingRepository.remove(toDelete);
    return res.length;
  }

  async updateMany(
    timetableId: number,
    userId: number,
    updates: { id: number; data: Partial<CreateBuildingDto> }[],
  ) {
    const ids = updates.map((u) => u.id);

    const toUpdate = await this.buildingRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toUpdate.length !== ids.length) {
      throw new ForbiddenException(
        'Some buildings were not found or you do not have permission to update them',
      );
    }

    toUpdate.forEach((building) => {
      const update = updates.find((u) => u.id === building.id);
      if (update) {
        if (update.data.name !== undefined) building.name = update.data.name;
        if (update.data.longName !== undefined) building.longName = update.data.longName;
      }
    });

    const result = await this.buildingRepository.save(toUpdate);
    return result.length;
  }
}
