import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { SubGroup } from './entity/subgroups.entity';
import { NotAvailableConstraint } from 'src/constraints/entity/timeConstraints/notavailableConstraints.entity';
import { Day } from 'src/day/entity/day.entity';
import { Hour } from 'src/hour/entity/hour.entity';
import { Timetable } from 'src/timetable/entity/timetable.entity';
import { CreateSubgroupNotAvailableDto } from './dto/constraints.dto';

@Injectable()
export class SubgroupsConstraintsService {
    constructor(
        @InjectRepository(SubGroup)
        private readonly subgroupRepository: Repository<SubGroup>,
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
        const subgroups = await this.subgroupRepository.find({
            where: {
                id: In(data.map((d) => d.id)),
                timetable: { User: { id: userId } },
            },
        });
        if (subgroups.length !== data.length) {
            throw new NotFoundException(
                'Some subgroups were not found or you do not have permission to update them',
            );
        }
        subgroups.forEach((subgroup) => {
            subgroup.maxGapsPerDay =
                data.find((d) => d.id === subgroup.id)?.maxGapPerDay ?? undefined;
        });
        await this.subgroupRepository.save(subgroups);
        return { updated: subgroups.length };
    }

    async resetMaxGapsPerDayMany(userId: number, ids: number[]) {
        const subgroups = await this.subgroupRepository.find({
            where: {
                id: In(ids),
                timetable: { User: { id: userId } },
            },
        });
        if (subgroups.length !== ids.length) {
            throw new NotFoundException(
                'Some subgroups were not found or you do not have permission to update them',
            );
        }
        subgroups.forEach((subgroup) => {
            subgroup.maxGapsPerDay = undefined;
        });
        await this.subgroupRepository.save(subgroups);
        return { reset: subgroups.length };
    }

    // NotAvailable methods
    async getWithNotAvailableConstraints(timetableId: number, userId: number) {
        return this.subgroupRepository.find({
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
        dtos: CreateSubgroupNotAvailableDto[],
    ) {
        const timetable = await this.timetableRepository.findOne({
            where: { id: timetableId, User: { id: userId } },
        });
        if (!timetable)
            throw new NotFoundException('Timetable not found or access denied');

        const dayIds = [...new Set(dtos.map((d) => d.dayId))];
        const hourIds = [...new Set(dtos.map((d) => d.hourId))];
        const subgroupIds = [...new Set(dtos.map((d) => d.subgroupId))];

        const [days, hours, subgroups] = await Promise.all([
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
            subgroupIds.length > 0
                ? this.subgroupRepository.find({
                    where: { id: In(subgroupIds), timetable: { User: { id: userId } } },
                })
                : Promise.resolve([]),
        ]);

        if (days.length !== dayIds.length)
            throw new NotFoundException('Some days not found or access denied');
        if (hours.length !== hourIds.length)
            throw new NotFoundException('Some hours not found or access denied');
        if (subgroups.length !== subgroupIds.length)
            throw new NotFoundException('Some subgroups not found or access denied');

        const dayMap = new Map(days.map((d) => [d.id, d]));
        const hourMap = new Map(hours.map((h) => [h.id, h]));
        const subgroupMap = new Map(subgroups.map((sg) => [sg.id, sg]));

        const entities = dtos.map((dto) => {
            return this.notAvailableRepository.create({
                day: dayMap.get(dto.dayId),
                hour: hourMap.get(dto.hourId),
                subGroup: subgroupMap.get(dto.subgroupId),
                timetable: { id: timetableId },
            });
        });

        // Check for existing duplicates
        const existing = await this.notAvailableRepository.find({
            where: entities.map((e) => ({
                day: { id: e.day.id },
                hour: { id: e.hour.id },
                subGroup: { id: e.subGroup?.id },
            })),
            relations: { subGroup: true, day: true, hour: true },
        });

        if (existing.length > 0) {
            const violations = existing.map((conflict) => {
                const dayName = conflict.day?.name || `Day ${conflict.day?.id}`;
                const hourName = conflict.hour?.name || `Hour ${conflict.hour?.id}`;
                const subgroupName = conflict.subGroup?.name || 'Unknown';
                return `SubGroup "${subgroupName}" is already marked N/A on ${dayName} at ${hourName}`;
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
                subGroup: { id: Not(IsNull()) },
            },
            relations: { subGroup: true, day: true, hour: true },
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
                subGroup: { id: Not(IsNull()) },
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
