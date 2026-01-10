import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Subject } from './entity/subjects.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';
import { Day } from 'src/day/entity/day.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
  ) {}

  async findSubjects(timetableId: number, userId: number) {
    return this.subjectRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      order: { id: 'DESC' },
    });
  }

  async findSubjectsPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Subject>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.subjectRepository.findAndCount({
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

  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateSubjectDto[],
  ) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { subjects: true },
      select: { id: true, User: { id: true }, subjects: { name: true } },
    });
    if (!timetable) throw new NotFoundException();
    const existingNames = new Set(timetable.subjects.map((y) => y.name));
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
    const entities = this.subjectRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        timetable: { id: timetableId },
      })),
    );
    return this.subjectRepository.save(entities);
  }

  async createOne(
    timetableId: number,
    userId: number,
    dto: CreateSubjectDto,
  ): Promise<Subject> {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException();

    const existing = await this.subjectRepository.findOne({
      where: {
        name: dto.name,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
    if (existing)
      throw new ConflictException(
        'Subject name already exists for this timetable',
      );

    const entity = this.subjectRepository.create({
      name: dto.name,
      longName: dto.longName,
      timetable: { id: timetableId } as any,
    });
    return this.subjectRepository.save(entity);
  }

  async findById(timetableId: number, id: number, userId: number) {
    return this.subjectRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
  }

  async updateOne(
    timetableId: number,
    id: number,
    userId: number,
    dto: Partial<CreateSubjectDto>,
  ) {
    const existing = await this.findById(timetableId, id, userId);
    if (!existing) throw new NotFoundException();

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.subjectRepository.findOne({
        where: {
          name: dto.name,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (conflict && conflict.id !== id)
        throw new ConflictException(
          'Subject name already exists for this timetable',
        );
    }

    Object.assign(existing, dto);
    return this.subjectRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.subjectRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }

  async deleteMany(timetableId: number, userId: number, ids: number[]) {
    const toDelete = await this.subjectRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toDelete.length !== ids.length) {
      throw new ForbiddenException(
        'Some subjects were not found or you do not have permission to delete them',
      );
    }
    
    const res = await this.subjectRepository.remove(toDelete);
    return res.length;
  }

  async updateMany(
    timetableId: number,
    userId: number,
    updates: { id: number; data: Partial<CreateSubjectDto> }[],
  ) {
    const ids = updates.map((u) => u.id);

    const toUpdate = await this.subjectRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toUpdate.length !== ids.length) {
      throw new ForbiddenException(
        'Some subjects were not found or you do not have permission to update them',
      );
    }

    toUpdate.forEach((subject) => {
      const update = updates.find((u) => u.id === subject.id);
      if (update) {
        if (update.data.name !== undefined) subject.name = update.data.name;
        if (update.data.longName !== undefined) subject.longName = update.data.longName;
      }
    });

    const result = await this.subjectRepository.save(toUpdate);
    return result.length;
  }
}
