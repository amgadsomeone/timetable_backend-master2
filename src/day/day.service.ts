import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Day } from './entity/day.entity';
import { CreateDayDto } from './dto/create-day.dto';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class DayService {
  constructor(
    @InjectRepository(Day)
    private readonly dayRepository: Repository<Day>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
  ) {}

  async findDays(timeTableId: number, userId: number) {
    return this.dayRepository.find({
      where: { timetable: { id: timeTableId, User: { id: userId } } },
      order:{id:'DESC'}
    });
  }

  async findDaysPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Day>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.dayRepository.findAndCount({
      where: {
        timetable: { id: timeTableId, User: { id: userId } },
      },
      take: limit,
      skip: skip,
      order: {
        id: 'DESC',
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

  // Create single day for a timetable
  async createOne(
    timetableId: number,
    userId: number,
    dto: CreateDayDto,
  ): Promise<Day> {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException();
    const entity = this.dayRepository.create({
      ...dto,
      timetable: { id: timetableId },
    });
    // Pre-check uniqueness per timetable
    const existing = await this.dayRepository.findOne({
      where: {
        name: dto.name,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
    if (existing)
      throw new ConflictException('Day name already exists for this timetable');
    return await this.dayRepository.save(entity);
  }

  async findById(
    timetableId: number,
    userId: number,
    id: number,
  ): Promise<Day | null> {
    return this.dayRepository.findOne({
      where: {
        id,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
  }

  async createMany(timetableId: number, userId: number, dtos: CreateDayDto[]) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { days: true },
      select: { id: true, User: { id: true }, days: { name: true } },
    });
    if (!timetable) throw new NotFoundException();
    const existingNames = new Set(timetable.days.map((y) => y.name));
    const incomingNames = new Set<string>();
    dtos.forEach((dto) => {
      if (existingNames.has(dto.name)) {
        throw new BadRequestException(
          `hour name ${dto.name} already exist in this timetable`,
        );
      }
      if (incomingNames.has(dto.name)) {
        throw new ConflictException(
          `Duplicate name "${dto.name}" found in the request.`,
        );
      }
      incomingNames.add(dto.name);
    });
    const entities = this.dayRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        timetable: { id: timetableId },
      })),
    );
    return this.dayRepository.save(entities);
  }

  async updateOne(
    timetableId: number,
    id: number,
    userId: number,
    dto: Partial<CreateDayDto>,
  ): Promise<Day> {
    const existing = await this.findById(timetableId, userId, id);
    if (!existing) throw new NotFoundException();
    Object.assign(existing, dto);
    // If name is changing, ensure no other day in the timetable has the same name
    const conflict = await this.dayRepository.findOne({
      where: {
        name: dto.name,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
    if (conflict && conflict.id !== id) {
      throw new ConflictException('Day name already exists for this timetable');
    }

    return await this.dayRepository.save(existing);
  }

  async deleteOne(timetableId: number, userId: number, id: number) {
    const res = await this.dayRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }
}
