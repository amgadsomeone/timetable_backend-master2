import {
  EntitySubscriberInterface,
  EventSubscriber,
  In,
  InsertEvent,
  RemoveEvent,
} from 'typeorm';
import { Activity } from './entity/activities.entity';
import { Teacher } from 'src/teachers/entity/teacher.entity';
import { Group } from 'src/groups/entity/groups.entity';
import { Year } from 'src/years/entity/years.entity';
import { SubGroup } from 'src/subgroups/entity/subgroups.entity';

@EventSubscriber()
export class ActivitySubscriber implements EntitySubscriberInterface<Activity> {
  listenTo() {
    return Activity;
  }

  async afterInsert(event: InsertEvent<Activity>) {
    console.log('AFTER ACTIVITY INSERTED: ', event.entity);
    const { duration, years, groups, subGroups, teachers } = event.entity;

    // 1. Update Teachers
    if (teachers && teachers.length > 0) {
      // First, get an array of just the IDs
      const teacherIds = teachers.map((teacher) => teacher.id);
      // Now, run ONE query to update all teachers in the list
      await event.manager
        .getRepository(Teacher)
        .increment({ id: In(teacherIds) }, 'assigned_hours', duration);
    }

    // 2. Update Groups
    if (groups && groups.length > 0) {
      const groupIds = groups.map((group) => group.id);
      await event.manager
        .getRepository(Group)
        .increment({ id: In(groupIds) }, 'assigned_hours', duration);
    }

    // 2. Update subgroups
    if (subGroups && subGroups.length > 0) {
      const subgroupsIds = subGroups.map((subGroup) => subGroup.id);
      await event.manager
        .getRepository(SubGroup)
        .increment({ id: In(subgroupsIds) }, 'assigned_hours', duration);
    }

    // 3. Update Years
    if (years && years.length > 0) {
      const yearIds = years.map((year) => year.id);
      await event.manager
        .getRepository(Year)
        .increment({ id: In(yearIds) }, 'assigned_hours', duration);
    }
  }

  async afterRemove(event: RemoveEvent<Activity>) {
    // Note: event.entity is undefined on remove, you need the ID
    console.log('AFTER ACTIVITY REMOVED: ', event.databaseEntity);

    const { duration, years, groups, subGroups, teachers } = event.databaseEntity;

    // 1. Update Teachers
    if (teachers && teachers.length > 0) {
      // First, get an array of just the IDs
      const teacherIds = teachers.map((teacher) => teacher.id);
      // Now, run ONE query to update all teachers in the list
      await event.manager
        .getRepository(Teacher)
        .decrement({ id: In(teacherIds) }, 'assigned_hours', duration);
    }

    // 2. Update Groups
    if (groups && groups.length > 0) {
      const groupIds = groups.map((group) => group.id);
      await event.manager
        .getRepository(Group)
        .decrement({ id: In(groupIds) }, 'assigned_hours', duration);
    }

    // 2. Update subgroups
    if (subGroups && subGroups.length > 0) {
      const subgroupsIds = subGroups.map((subGroup) => subGroup.id);
      await event.manager
        .getRepository(SubGroup)
        .decrement({ id: In(subgroupsIds) }, 'assigned_hours', duration);
    }

    // 3. Update Years
    if (years && years.length > 0) {
      const yearIds = years.map((year) => year.id);
      await event.manager
        .getRepository(Year)
        .decrement({ id: In(yearIds) }, 'assigned_hours', duration);
    }
  }

}
