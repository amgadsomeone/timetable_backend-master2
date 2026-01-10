import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tag } from './entity/tags.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
  ) {}

  async findTags(timetableId: number, userId: number) {
    return this.tagRepository.find({
      where: { timetable: { id: timetableId, User: { id: userId } } },
      order: { id: 'DESC' },
    });
  }

  async findTagsPaginated(
    timeTableId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Tag>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.tagRepository.findAndCount({
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
    dto: CreateTagDto,
  ): Promise<Tag> {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
    });
    if (!timetable) throw new NotFoundException();
    const entity = this.tagRepository.create({
      ...dto,
      timetable: { id: timetableId } as any,
    });
    const existing = await this.tagRepository.findOne({
      where: {
        name: dto.name,
        timetable: { id: timetableId, User: { id: userId } },
      },
    });
    if (existing)
      throw new ConflictException('Tag name already exists for this timetable');
    return await this.tagRepository.save(entity);
  }

  async createMany(timetableId: number, userId: number, dtos: CreateTagDto[]) {
    const timetable = await this.timetableRepository.findOne({
      where: { id: timetableId, User: { id: userId } },
      relations: { tags: true },
      select: { id: true, User: { id: true }, tags: { name: true } },
    });
    if (!timetable) throw new NotFoundException();
    const existingNames = new Set(timetable.tags.map((y) => y.name));
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
    const entities = this.tagRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        timetable: { id: timetableId },
      })),
    );
    return this.tagRepository.save(entities);
  }

  async findById(
    timetableId: number,
    id: number,
    userId: number,
  ): Promise<Tag | null> {
    return this.tagRepository.findOne({
      where: { id, timetable: { id: timetableId, User: { id: userId } } },
    });
  }

  async updateOne(
    timetableId: number,
    id: number,
    userId: number,
    dto: Partial<CreateTagDto>,
  ): Promise<Tag> {
    const existing = await this.findById(timetableId, id, userId);
    if (!existing) throw new NotFoundException();
    Object.assign(existing, dto);
    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.tagRepository.findOne({
        where: {
          name: dto.name,
          timetable: { id: timetableId, User: { id: userId } },
        },
      });
      if (conflict && conflict.id !== id)
        throw new ConflictException(
          'Tag name already exists for this timetable',
        );
    }
    return await this.tagRepository.save(existing);
  }

  async deleteOne(timetableId: number, id: number, userId: number) {
    const res = await this.tagRepository.delete({
      id,
      timetable: { id: timetableId, User: { id: userId } },
    });
    return (res?.affected || 0) > 0;
  }

  async deleteMany(timetableId: number, userId: number, ids: number[]) {
    const toDelete = await this.tagRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toDelete.length !== ids.length) {
      throw new ForbiddenException(
        'Some tags were not found or you do not have permission to delete them',
      );
    }
    
    const res = await this.tagRepository.remove(toDelete);
    return res.length;
  }

  async updateMany(
    timetableId: number,
    userId: number,
    updates: { id: number; data: Partial<CreateTagDto> }[],
  ) {
    const ids = updates.map((u) => u.id);

    const toUpdate = await this.tagRepository.find({
      where: {
        id: In(ids),
        timetable: { id: timetableId, User: { id: userId } },
      },
    });

    if (toUpdate.length !== ids.length) {
      throw new ForbiddenException(
        'Some tags were not found or you do not have permission to update them',
      );
    }

    toUpdate.forEach((tag) => {
      const update = updates.find((u) => u.id === tag.id);
      if (update) {
        if (update.data.name !== undefined) tag.name = update.data.name;
      }
    });

    const result = await this.tagRepository.save(toUpdate);
    return result.length;
  }

  async getTagWithRelations(id: number, userId: number) {
    const tag = await this.tagRepository.findOne({
      where: { id, timetable: { User: { id: userId } } },
      relations: {
        activities: {
          groups: true,
          subGroups: true,
          tags: true,
          subject: true,
          teachers: true,
          years: true,
        },
      },
      relationLoadStrategy: 'query',
    });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag.activities.map((activity) => ({
      id: activity.id,
      duration: activity.duration,
      subject: { name: activity.subject.name, id: activity.subject.id },
      teachers: activity.teachers.map((t) => ({ name: t.name, id: t.id })),
      years: activity.years.map((y) => ({ name: y.name, id: y.id })),
      groups: activity.groups.map((g) => ({ name: g.name, id: g.id })),
      subGroups: activity.subGroups.map((sg) => ({ name: sg.name, id: sg.id })),
      tags: activity.tags.map((t) => ({ name: t.name, id: t.id })),
    }));
  }
}
