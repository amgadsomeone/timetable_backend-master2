import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entity/rooms.entity';
import { Building } from 'src/buildings/entity/buildings.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
  ) {}

  // List rooms under a building
  async findByTimetable(timetable: number, userId: number) {
    return this.roomRepository.find({
      where: {
        timetable: { id: timetable, User: { id: userId } },
      },
      relations: { building: true },
      order: { id: 'DESC' },
    });
  }

  async findRoomsPaginated(
    buildingId: number,
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Room>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.roomRepository.findAndCount({
      where: {
        building: { id: buildingId, timetable: { User: { id: userId } } },
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

  async createOne(buildingId: number, userId: number, dto: CreateRoomDto) {
    // validate parent building
    const building = await this.buildingRepository.findOne({
      where: { id: buildingId, timetable: { User: { id: userId } } },
      relations: { timetable: true },
    });
    if (!building) throw new NotFoundException('Parent building not found');

    const existing = await this.roomRepository.findOne({
      where: { name: dto.name, building: { id: buildingId } },
    });
    if (existing)
      throw new ConflictException('Room name already exists for this building');

    const entity = this.roomRepository.create({
      name: dto.name,
      capacity: dto.capacity,
      building: { id: buildingId },
      timetable: { id: building.timetable.id },
    });
    return this.roomRepository.save(entity);
  }

  async createMany(buildingId: number, userId: number, dtos: CreateRoomDto[]) {
    const building = await this.buildingRepository.findOne({
      where: { id: buildingId, timetable: { User: { id: userId } } },
      relations: { rooms: true, timetable: true },
    });
    if (!building) throw new NotFoundException();
    const existingNames = new Set(building.rooms.map((y) => y.name));
    const incomingNames = new Set<string>();
    dtos.forEach((dto) => {
      if (existingNames.has(dto.name)) {
        throw new BadRequestException(
          `room name ${dto.name} already exist in this timetable`,
        );
      }
      if (incomingNames.has(dto.name)) {
        throw new ConflictException(
          `Duplicate name "${dto.name}" found in the request.`,
        );
      }
      incomingNames.add(dto.name);
    });
    const entities = this.roomRepository.create(
      dtos.map((dto) => ({
        name: dto.name,
        building: { id: buildingId },
        timetable: { id: building.timetable.id },
      })),
    );
    console.log(entities);
    return this.roomRepository.save(entities);
  }

  async findById(buildingId: number, id: number, userId: number) {
    const e = await this.roomRepository.findOne({
      where: {
        id,
        building: { id: buildingId, timetable: { User: { id: userId } } },
      },
    });
    if (!e) throw new NotFoundException();
    return e;
  }

  async updateOne(
    buildingId: number,
    id: number,
    userId: number,
    dto: UpdateRoomDto,
  ) {
    const existing = await this.roomRepository.findOne({
      where: {
        id,
        building: { id: buildingId, timetable: { User: { id: userId } } },
      },
    });

    if (!existing) throw new NotFoundException();

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.roomRepository.findOne({
        where: { name: dto.name, building: { id: buildingId } },
      });
      if (conflict && conflict.id !== id)
        throw new ConflictException(
          'Room name already exists for this building',
        );
    }

    Object.assign(existing, dto);
    return this.roomRepository.save(existing);
  }

  async deleteOne(buildingId: number, id: number, userId: number) {
    const res = await this.roomRepository.delete({
      id,
      building: { id: buildingId, timetable: { User: { id: userId } } },
    });
    return (res?.affected || 0) > 0;
  }
}
