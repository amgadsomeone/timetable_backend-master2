import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Hour } from './entity/hour.entity';
import { CreateHourDto } from './dto/create-hour.dto';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class HourService {
  constructor(
    @InjectRepository(Hour)
    private readonly hourRepository: Repository<Hour>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
  ) {}

  async findAllByTimetable(
    timetableId: number,
    userId: number,
  ): Promise<Hour[]> {
    return this.hourRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      order: { id: 'ASC' },
    });
  }
  async findHoursPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Hour>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.hourRepository.findAndCount({
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

  async createOne(
    timetableId: number,
    userId: number,
    dto: CreateHourDto,
  ): Promise<Hour> {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException();
    const entity = this.hourRepository.create({
      ...dto,
      timetable: { id: timetableId },
    });
    const existing = await this.hourRepository.findOne({
      where: {
        name: dto.name,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
    if (existing)
      throw new ConflictException(
        'Hour name already exists for this timetable',
      );
    return await this.hourRepository.save(entity);
  }
  async createOnetest(timetableId: number, userId: number, dto: CreateHourDto) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException();

    const createdYear = await this.createMany(timetableId, userId, [dto]);
    return createdYear[0];
  }
  async createMany(timetableId: number, userId: number, dtos: CreateHourDto[]) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { hours: true },
      select: { id: true, User: { id: true }, hours: { name: true } },
    });
    if (!timetable) throw new NotFoundException();
    console.log(timetable);
    const existingHoursNames = new Set(timetable.hours.map((y) => y.name));
    const incomingNames = new Set<string>();
    dtos.forEach((hour) => {
      if (existingHoursNames.has(hour.name)) {
        throw new BadRequestException(
          `hour name ${hour.name} already exist in this timetable`,
        );
      }
      if (incomingNames.has(hour.name)) {
        throw new ConflictException(
          `Duplicate name "${hour.name}" found in the request.`,
        );
      }
      incomingNames.add(hour.name);
    });
    const entities = this.hourRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        timetable: { id: timetableId },
      })),
    );
    return this.hourRepository.save(entities);
  }

  async findById(
    timetableId: number,
    id: number,
    userId: number,
  ): Promise<Hour | null> {
    return this.hourRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
  }

  async updateOne(
    timetableId: number,
    id: number,
    userId: number,
    dto: Partial<CreateHourDto>,
  ): Promise<Hour> {
    const existing = await this.findById(timetableId, id, userId);
    if (!existing) throw new NotFoundException();
    Object.assign(existing, dto);
    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.hourRepository.findOne({
        where: {
          name: dto.name,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (conflict && conflict.id !== id)
        throw new ConflictException(
          'Hour name already exists for this timetable',
        );
    }
    return await this.hourRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.hourRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }
}
