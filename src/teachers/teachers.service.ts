import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entity/teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';
import { In } from 'typeorm';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
  ) {}

  async findTeachers(timetableId: number, userId: number) {
    return this.teacherRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      order: { id: 'DESC' },
      select:{id:true,name:true,longName:true}
    });
  }
  async findTeachersPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Teacher>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.teacherRepository.findAndCount({
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
    dto: CreateTeacherDto,
  ): Promise<Teacher> {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException('timetable was not found');

    // uniqueness check
    const existing = await this.teacherRepository.findOne({
      where: { name: dto.name, timetable: { id: timetableId } as any },
    });
    if (existing)
      throw new ConflictException(
        'Teacher name already exists for this timetable',
      );

    // if qualifiedSubjects provided, validate they exist in timetable
    if (dto.qualifiedSubjects && dto.qualifiedSubjects.length > 0) {
      const subjects = await this.teacherRepository.manager.find(Subject, {
        where: {
          id: In(dto.qualifiedSubjects),
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      const foundIds = subjects.map((s) => s.id);
      const missing = dto.qualifiedSubjects.filter(
        (id) => !foundIds.includes(id),
      );
      if (missing.length > 0)
        throw new ConflictException(
          `The following subject id(s) do not exist for timetable ${timetableId}: ${missing.join(', ')}`,
        );
    }

    const entity = this.teacherRepository.create({
      name: dto.name,
      longName: dto.longName,
      targetHours: dto.targetHours,
      timetable: { id: timetableId } as any,
      qualifiedSubjects: dto.qualifiedSubjects
        ? dto.qualifiedSubjects.map((id) => ({ id }))
        : undefined,
    });

    const saved = await this.teacherRepository.save(entity as any);
    if (Array.isArray(saved)) return saved[0] as Teacher;
    return saved as Teacher;
  }

  async createMany(
    timetableId: number,
    userId: number,
    dtos: CreateTeacherDto[],
  ) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { teachers: true },
      select: { id: true, User: { id: true }, teachers: { name: true } },
    });
    if (!timetable) throw new NotFoundException();
    const existingNames = new Set(timetable.teachers.map((y) => y.name));
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
    const entities = this.teacherRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        timetable: { id: timetableId },
      })),
    );
    return this.teacherRepository.save(entities);
  }

  async findById(timetableId: number, id: number, userId: number) {
    return this.teacherRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
      relations: { activities: true },
    });
  }

  async updateOne(
    timetableId: number,
    id: number,
    userId: number,
    dto: Partial<CreateTeacherDto>,
  ) {
    const existing = await this.findById(timetableId, id, userId);
    if (!existing) throw new NotFoundException();

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.teacherRepository.findOne({
        where: {
          name: dto.name,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (conflict && conflict.id !== id)
        throw new ConflictException(
          'Teacher name already exists for this timetable',
        );
    }

    if (dto.qualifiedSubjects && dto.qualifiedSubjects.length > 0) {
      const subjects = await this.teacherRepository.manager.find(Subject, {
        where: {
          id: In(dto.qualifiedSubjects),
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      const foundIds = subjects.map((s) => s.id);
      const missing = dto.qualifiedSubjects.filter(
        (id) => !foundIds.includes(id),
      );
      if (missing.length > 0)
        throw new ConflictException(
          `The following subject id(s) do not exist for timetable ${timetableId}: ${missing.join(', ')}`,
        );
    }

    Object.assign(existing, dto);
    if (dto.qualifiedSubjects) {
      (existing as any).qualifiedSubjects = dto.qualifiedSubjects.map((id) => ({
        id,
      }));
    }
    return this.teacherRepository.save(existing as any);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.teacherRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }
}
