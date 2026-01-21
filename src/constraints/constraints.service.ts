import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { NotAvailableConstraint } from './entity/timeConstraints/notavailableConstraints.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Year } from 'src/years/entity/years.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';
import { Day } from 'src/day/entity/day.entity';
import { Hour } from 'src/hour/entity/hour.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { CreateNotAvailableConstraintDto, EntityType } from './dto/not-available-constraint.dto';

@Injectable()
export class ConstraintsService {
    constructor(
        @InjectRepository(NotAvailableConstraint)
        private readonly notAvailableRepository: Repository<NotAvailableConstraint>,
        @InjectRepository(Teacher)
        private readonly teacherRepository: Repository<Teacher>,
        @InjectRepository(Year)
        private readonly yearRepository: Repository<Year>,
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(SubGroup)
        private readonly subGroupRepository: Repository<SubGroup>,
        @InjectRepository(Day)
        private readonly dayRepository: Repository<Day>,
        @InjectRepository(Hour)
        private readonly hourRepository: Repository<Hour>,
        @InjectRepository(Timetable)
        private readonly timetableRepository: Repository<Timetable>,
    ) { }

    async setNotAvailableConstraintsMany(userId: number, timetableId: number, dtos: CreateNotAvailableConstraintDto[]) {
        const timetable = await this.timetableRepository.findOne({ where: { id: timetableId, User: { id: userId } } });
        if (!timetable) throw new NotFoundException('Timetable not found or access denied');
        const dayIds = [...new Set(dtos.map(d => d.dayId))];
        const hourIds = [...new Set(dtos.map(d => d.hourId))];

        const teacherIds = [...new Set(dtos.filter(d => d.entityType === EntityType.TEACHER).map(d => d.entityId))];
        const yearIds = [...new Set(dtos.filter(d => d.entityType === EntityType.YEAR).map(d => d.entityId))];
        const groupIds = [...new Set(dtos.filter(d => d.entityType === EntityType.GROUP).map(d => d.entityId))];
        const subgroupIds = [...new Set(dtos.filter(d => d.entityType === EntityType.SUBGROUP).map(d => d.entityId))];

        // this does not check for if they are in the same timetable but i guess its ok as it still belong to the same user
        const [days, hours, teachers, years, groups, subgroups] = await Promise.all([
            dayIds.length > 0 ? this.dayRepository.find({ where: { id: In(dayIds), timetable: { User: { id: userId } } } }) : Promise.resolve([]),
            hourIds.length > 0 ? this.hourRepository.find({ where: { id: In(hourIds), timetable: { User: { id: userId } } } }) : Promise.resolve([]),
            teacherIds.length > 0 ? this.teacherRepository.find({ where: { id: In(teacherIds), timetable: { User: { id: userId } } } }) : Promise.resolve([]),
            yearIds.length > 0 ? this.yearRepository.find({ where: { id: In(yearIds), timetable: { User: { id: userId } } } }) : Promise.resolve([]),
            groupIds.length > 0 ? this.groupRepository.find({ where: { id: In(groupIds), timetable: { User: { id: userId } } } }) : Promise.resolve([]),
            subgroupIds.length > 0 ? this.subGroupRepository.find({ where: { id: In(subgroupIds), timetable: { User: { id: userId } } } }) : Promise.resolve([]),
        ]);

        if (days.length !== dayIds.length) throw new NotFoundException('Some days not found or access denied');
        if (hours.length !== hourIds.length) throw new NotFoundException('Some hours not found or access denied');
        if (teachers.length !== teacherIds.length) throw new NotFoundException('Some teachers not found or access denied');
        if (years.length !== yearIds.length) throw new NotFoundException('Some years not found or access denied');
        if (groups.length !== groupIds.length) throw new NotFoundException('Some groups not found or access denied');
        if (subgroups.length !== subgroupIds.length) throw new NotFoundException('Some subgroups not found or access denied');

        const dayMap = new Map(days.map(d => [d.id, d]));
        const hourMap = new Map(hours.map(h => [h.id, h]));
        const teacherMap = new Map(teachers.map(t => [t.id, t]));
        const yearMap = new Map(years.map(y => [y.id, y]));
        const groupMap = new Map(groups.map(g => [g.id, g]));
        const subgroupMap = new Map(subgroups.map(sg => [sg.id, sg]));

        const entities = dtos.map(dto => {
            const entity = this.notAvailableRepository.create({
                day: dayMap.get(dto.dayId),
                hour: hourMap.get(dto.hourId),
                timetable: { id: timetableId }
            });

            switch (dto.entityType) {
                case EntityType.TEACHER:
                    entity.teacher = teacherMap.get(dto.entityId);
                    break;
                case EntityType.YEAR:
                    entity.year = yearMap.get(dto.entityId);
                    break;
                case EntityType.GROUP:
                    entity.group = groupMap.get(dto.entityId);
                    break;
                case EntityType.SUBGROUP:
                    entity.subGroup = subgroupMap.get(dto.entityId);
                    break;
            }
            return entity;
        });

        const existing = await this.notAvailableRepository.find({
            where: entities,
            relations: { teacher: true, year: true, group: true, subGroup: true },
            relationLoadStrategy: 'query'
        })

        if (existing.length > 0) {
            const violations = existing.map(conflict => {
                const dayName = conflict.day?.name || `Day ${conflict.day?.id}`;
                const hourName = conflict.hour?.name || `Hour ${conflict.hour?.id}`;

                let entityType = 'Entity';
                let entityName = 'Unknown';

                if (conflict.teacher) {
                    entityType = 'Teacher';
                    entityName = conflict.teacher.name;
                } else if (conflict.group) {
                    entityType = 'Group';
                    entityName = conflict.group.name;
                } else if (conflict.subGroup) {
                    entityType = 'SubGroup';
                    entityName = conflict.subGroup.name;
                } else if (conflict.year) {
                    entityType = 'Year';
                    entityName = conflict.year.name;
                }

                return `${entityType} "${entityName}" is already marked N/A on ${dayName} at ${hourName}`;
            });

            throw new BadRequestException(
                `Duplicate constraints detected:\n - ${violations.join('\n - ')}`
            );
        }
        return this.notAvailableRepository.save(entities);
    }

    async getNotAvailableConstraints(timetableId: number, userId: number, entityType: EntityType) {
        let searchEntity = {}
        if (entityType === EntityType.TEACHER) {
            searchEntity = { teacher: { id: Not(IsNull()) } }
        } else if (entityType === EntityType.YEAR) {
            searchEntity = { year: { id: Not(IsNull()) } }
        } else if (entityType === EntityType.GROUP) {
            searchEntity = { group: { id: Not(IsNull()) } }
        } else if (entityType === EntityType.SUBGROUP) {
            searchEntity = { subGroup: { id: Not(IsNull()) } }
        }
        return this.notAvailableRepository.find({
            where: { timetable: { id: timetableId, User: { id: userId } }, ...searchEntity },
            relations: { teacher: true, year: true, group: true, subGroup: true },
            relationLoadStrategy: 'query'
        });
    }

    async deleteNotAvailableConstraint(id: number[], timetableId: number, userId: number) {
        const constraints = await this.notAvailableRepository.find({
            where: {
                id: In(id), teacher: { timetable: { User: { id: userId } } },
                user: { id: userId },
            },
        });
        if (!constraints) throw new NotFoundException('Constraint not found or access denied');
        return this.notAvailableRepository.remove(constraints);
    }

}
