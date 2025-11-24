import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';
import { Timetable } from './entity/timetable.entity';
import { PaginatedResult, PaginationDto } from 'src/common/dto/pagination.dto';
import { Year } from 'src/years/entity/years.entity';
import { Activity } from 'src/activities/entity/activities.entity';
import { Building } from 'src/buildings/entity/buildings.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Subject } from 'src/subjects/entity/subjects.entity';
import { Tag } from 'src/tags/entity/tags.entity';
import { Hour } from 'src/hour/entity/hour.entity';
import { Day } from 'src/day/entity/day.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';

export class TimetableOverviewDto {
  id: number;
  name: string; // Or any other timetable fields you need
  totalDays: number;
  totalHours: number;
  totalSubjects: number;
  totalTeachers: number;
  totalClasses: number;
  totalActivities: number;
}

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
    @InjectRepository(Year)
    private readonly yearRepository: Repository<Year>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Hour)
    private readonly hourRepository: Repository<Hour>,
    @InjectRepository(Day)
    private readonly dayRepository: Repository<Day>,
    @InjectRepository(Group)
    private readonly GroupRepository: Repository<Group>,
    @InjectRepository(SubGroup)
    private readonly SubGroupRepository: Repository<SubGroup>,
  ) {}

  async create(createTimetableDto: CreateTimetableDto, userId: number) {
    const timetable = this.timetableRepository.create({
      ...createTimetableDto,
      User: { id: userId },
    });
    return this.timetableRepository.save(timetable);
  }

  async findAll(userId: number): Promise<Timetable[]> {
    return this.timetableRepository.find({
      where: { User: { id: userId } },
      order: { id: 'DESC' },
    });
  }
  async findTimetablesPaginated(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Timetable>> {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [data, total] = await this.timetableRepository.findAndCount({
      where: {
        User: { id: userId },
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

  /**
   * Finds a single timetable by its ID.
   */
  async findOne(id: number, userId: number): Promise<Timetable> {
    const timetable = await this.timetableRepository.findOne({
      where: { id, User: { id: userId } },
      relations: ['days', 'hours'],
    });

    if (!timetable) {
      throw new NotFoundException(`Timetable with ID ${id} not found`);
    }
    return timetable;
  }

 
  async findFull(id: number, userId: number): Promise<Timetable> {
  const timetable = await this.timetableRepository.findOne({
    where: { id: id, User: { id: userId } },
    relations: {
      // Simple relations
      days: true,
      hours: true,
      tags: true,
      subjects: true,
      teachers: true,
      buildings: { rooms: true }, // Nested relation
      years: {groups:{subGroups:true}},

      // The "Dangerous" one is now safe!
      activities: {
        subject: true,
        teachers: true,
        tags: true,
        groups: true,
        subGroups: true,
        years: true,
      }
    },
    // THIS ONE LINE DOES THE MAGIC
    relationLoadStrategy: 'query', 
  });

  if (!timetable) throw new NotFoundException();

  return timetable;
}

  async findOverviewWithQueryBuilder(
    id: number,
    userId: number,
  ): Promise<TimetableOverviewDto> {
    // First, verify the user has access to this timetable. This is a crucial security step.
    const hasAccess = await this.timetableRepository.exists({
      where: { id: id, User: { id: userId } },
    });
    if (!hasAccess) {
      throw new NotFoundException('Timetable not found or access denied.');
    }

    // Now, build the main query.
    const result = await this.timetableRepository
      .createQueryBuilder('timetable')
      // Select the base fields from the timetable
      .select('timetable.id', 'id')
      .addSelect('timetable.InstitutionName', 'name') // Assuming you want to use InstitutionName

      // --- CORRECTED SUBQUERIES ---
      // Each subquery now correctly points to the foreign key on the respective table.

      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from('day', 'day') // Table alias 'day'
            .where('day.timetableId = timetable.id'), // Correct foreign key
        'totalDays',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from('hour', 'hour')
            .where('hour.timetableId = timetable.id'),
        'totalHours',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from('subject', 'subject')
            .where('subject.timetableId = timetable.id'),
        'totalSubjects',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from('teacher', 'teacher')
            .where('teacher.timetableId = timetable.id'),
        'totalTeachers',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from('activity', 'activity')
            .where('activity.timetableId = timetable.id'),
        'totalActivities',
      )
      // You mentioned "classes", let's assume the entity is named "ClassGroup"
      // or similar and the table is "class_group"
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)')
            .from('group', 'group_alias') // Assuming 'group' is the table for Classes/Groups
            .where('group_alias.timetableId = timetable.id'),
        'totalClasses', // Aliasing to 'totalClasses' as requested
      )

      // The main WHERE clause to find the specific timetable by its ID
      .where('timetable.id = :id', { id })
      // Use .getRawOne() because we are selecting custom fields
      .getRawOne();

    if (!result) {
      // This case should be rare since we already checked for existence, but it's good practice.
      throw new NotFoundException('Timetable was not found.');
    }

    // Parse the raw string results from the database into numbers
    return {
      id: result.id,
      name: result.name, // Will contain the InstitutionName
      totalDays: parseInt(result.totalDays, 10),
      totalHours: parseInt(result.totalHours, 10),
      totalSubjects: parseInt(result.totalSubjects, 10),
      totalTeachers: parseInt(result.totalTeachers, 10),
      totalClasses: parseInt(result.totalClasses, 10),
      totalActivities: parseInt(result.totalActivities, 10),
    };
  }
  /**
   * Updates a timetable's name. Note: Updating days/hours would require more complex logic
   * (e.g., deleting old ones and creating new ones), which can be added here.
   */
  async update(
    id: number,
    updateTimetableDto: UpdateTimetableDto,
    userId: number,
  ): Promise<Timetable> {
    const timetableToUpdate = await this.timetableRepository.findOne({
      where: { id: id, User: { id: userId } },
    });
    if (!timetableToUpdate) {
      throw new BadRequestException();
    }
    timetableToUpdate.InstitutionName =
      updateTimetableDto.InstitutionName ?? timetableToUpdate.InstitutionName;
    return this.timetableRepository.save(timetableToUpdate);
  }

  /**
   * Deletes a timetable. The onDelete: 'CASCADE' in the Day and Hour entities
   * will ensure all associated days and hours are also deleted.
   */
  async remove(id: number, userId: number): Promise<void> {
    const timetable = await this.findOne(id, userId); // Ensures it exists before trying to delete
    await this.timetableRepository.remove(timetable);
  }
}
