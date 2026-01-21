import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { Group } from './entity/groups.entity';
import { NotAvailableConstraint } from 'src/constraints/entity/timeConstraints/notavailableConstraints.entity';
import { Day } from 'src/day/entity/day.entity';
import { Hour } from 'src/hour/entity/hour.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { CreateGroupNotAvailableDto } from './dto/constraints.dto';

@Injectable()
export class GroupsConstraintsService {
    constructor(
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(NotAvailableConstraint)
        private readonly notAvailableRepository: Repository<NotAvailableConstraint>,
        @InjectRepository(Day)
        private readonly dayRepository: Repository<Day>,
        @InjectRepository(Hour)
        private readonly hourRepository: Repository<Hour>,
        @InjectRepository(Timetable)
        private readonly timetableRepository: Repository<Timetable>,
    ) { }

    // MaxGaps methods
    async setMaxGapsPerDayMany(
        userId: number,
        data: { id: number; maxGapPerDay: number }[],
    ) {
        const groups = await this.groupRepository.find({
            where: {
                id: In(data.map((d) => d.id)),
                timetable: { User: { id: userId } },
            },
        });
        if (groups.length !== data.length) {
            throw new NotFoundException(
                'Some groups were not found or you do not have permission to update them',
            );
        }
        groups.forEach((group) => {
            group.maxGapsPerDay =
                data.find((d) => d.id === group.id)?.maxGapPerDay ?? undefined;
        });
        await this.groupRepository.save(groups);
        return { updated: groups.length };
    }

    async resetMaxGapsPerDayMany(userId: number, ids: number[]) {
        const groups = await this.groupRepository.find({
            where: {
                id: In(ids),
                timetable: { User: { id: userId } },
            },
        });
        if (groups.length !== ids.length) {
            throw new NotFoundException(
                'Some groups were not found or you do not have permission to update them',
            );
        }
        groups.forEach((group) => {
            group.maxGapsPerDay = undefined;
        });
        await this.groupRepository.save(groups);
        return { reset: groups.length };
    }

    // NotAvailable methods
    async getWithNotAvailableConstraints(timetableId: number, userId: number) {
        return this.groupRepository.find({
            relations: {
                NotAvailableConstraints: true,
            },
            where: {
                timetable: { id: timetableId, User: { id: userId } },
                NotAvailableConstraints: {
                    id: Not(IsNull()),
                },
            },
        });
    }

    async setNotAvailableConstraintsMany(
        userId: number,
        timetableId: number,
        dtos: CreateGroupNotAvailableDto[],
    ) {
        const timetable = await this.timetableRepository.findOne({
            where: { id: timetableId, User: { id: userId } },
        });
        if (!timetable)
            throw new NotFoundException('Timetable not found or access denied');

        const dayIds = [...new Set(dtos.map((d) => d.dayId))];
        const hourIds = [...new Set(dtos.map((d) => d.hourId))];
        const groupIds = [...new Set(dtos.map((d) => d.groupId))];

        const [days, hours, groups] = await Promise.all([
            dayIds.length > 0
                ? this.dayRepository.find({
                    where: { id: In(dayIds), timetable: { User: { id: userId } } },
                })
                : Promise.resolve([]),
            hourIds.length > 0
                ? this.hourRepository.find({
                    where: { id: In(hourIds), timetable: { User: { id: userId } } },
                })
                : Promise.resolve([]),
            groupIds.length > 0
                ? this.groupRepository.find({
                    where: { id: In(groupIds), timetable: { User: { id: userId } } },
                })
                : Promise.resolve([]),
        ]);

        if (days.length !== dayIds.length)
            throw new NotFoundException('Some days not found or access denied');
        if (hours.length !== hourIds.length)
            throw new NotFoundException('Some hours not found or access denied');
        if (groups.length !== groupIds.length)
            throw new NotFoundException('Some groups not found or access denied');

        const dayMap = new Map(days.map((d) => [d.id, d]));
        const hourMap = new Map(hours.map((h) => [h.id, h]));
        const groupMap = new Map(groups.map((g) => [g.id, g]));

        const entities = dtos.map((dto) => {
            return this.notAvailableRepository.create({
                day: dayMap.get(dto.dayId),
                hour: hourMap.get(dto.hourId),
                group: groupMap.get(dto.groupId),
                timetable: { id: timetableId },
            });
        });

        // Check for existing duplicates
        const existing = await this.notAvailableRepository.find({
            where: entities.map((e) => ({
                day: { id: e.day.id },
                hour: { id: e.hour.id },
                group: { id: e.group?.id },
            })),
            relations: { group: true, day: true, hour: true },
        });

        if (existing.length > 0) {
            const violations = existing.map((conflict) => {
                const dayName = conflict.day?.name || `Day ${conflict.day?.id}`;
                const hourName = conflict.hour?.name || `Hour ${conflict.hour?.id}`;
                const groupName = conflict.group?.name || 'Unknown';
                return `Group "${groupName}" is already marked N/A on ${dayName} at ${hourName}`;
            });

            throw new BadRequestException(
                `Duplicate constraints detected:\n - ${violations.join('\n - ')}`,
            );
        }

        return this.notAvailableRepository.save(entities);
    }

    async getNotAvailableConstraints(timetableId: number, userId: number) {
        return this.notAvailableRepository.find({
            where: {
                timetable: { id: timetableId, User: { id: userId } },
                group: { id: Not(IsNull()) },
            },
            relations: { group: true, day: true, hour: true },
        });
    }

    async deleteNotAvailableConstraints(
        ids: number[],
        timetableId: number,
        userId: number,
    ) {
        const constraints = await this.notAvailableRepository.find({
            where: {
                id: In(ids),
                timetable: { id: timetableId, User: { id: userId } },
                group: { id: Not(IsNull()) },
            },
        });
        if (constraints.length !== ids.length) {
            throw new NotFoundException(
                'Some constraints were not found or access denied',
            );
        }
        await this.notAvailableRepository.remove(constraints);
        return { deleted: constraints.length };
    }
}
