import {
  EntitySubscriberInterface,
  EventSubscriber,
  In,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
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
    const { duration, years, groups, subGroups, teachers } =
      event.databaseEntity;
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

  async beforeUpdate(event: UpdateEvent<Activity>) {
    console.log('helloooooooooo')
     console.log(event.databaseEntity)
  const oldActivitydf = await event.manager.findOne(Activity, {
    where: { id: event.entity!.id },
    relations: ['teachers', 'groups', 'subGroups', 'years']
  });

  if (!oldActivitydf) {
    console.log('⚠️ Old activity not found');
    return;
  }  
  console.log(event.entity!.teachers)
    console.log(oldActivitydf!.teachers)  // We need both the old state and the new state to calculate the difference.
  // We need both the old state and the new state to calculate the difference.
    const oldActivity = event.databaseEntity;
      
    // Load the new activity with all relations
    const newActivity = await event.manager.findOne(Activity, {
      where: { id: oldActivity.id },
      relations: ['teachers', 'groups', 'subGroups', 'years'],
    });
    console.log(newActivity)

    if (!newActivity) return;

    // --- Part 1: Decrement counters based on the OLD state ---
    const oldDuration = oldActivity.duration;

    // Decrement Old Teachers
    if (oldActivity.teachers && oldActivity.teachers.length > 0) {
      const teacherIds = oldActivity.teachers.map((t) => t.id);
      await event.manager
        .getRepository(Teacher)
        .decrement({ id: In(teacherIds) }, 'assigned_hours', oldDuration);
    }
    // Decrement Old Groups
    if (oldActivity.groups && oldActivity.groups.length > 0) {
      const groupIds = oldActivity.groups.map((g) => g.id);
      await event.manager
        .getRepository(Group)
        .decrement({ id: In(groupIds) }, 'assigned_hours', oldDuration);
    }

    if (oldActivity.subGroups && oldActivity.subGroups.length > 0) {
      const subgroupIds = oldActivity.subGroups.map((sg) => sg.id);
      await event.manager
        .getRepository(SubGroup)
        .decrement({ id: In(subgroupIds) }, 'assigned_hours', oldDuration);
    }

    if (oldActivity.years && oldActivity.years.length > 0) {
      const yearIds = oldActivity.years.map((y) => y.id);
      await event.manager
        .getRepository(Year)
        .decrement({ id: In(yearIds) }, 'assigned_hours', oldDuration);
    }

    // --- Part 2: Increment counters based on the NEW state ---
    const newDuration = newActivity.duration;

    // Increment New Teachers
    if (newActivity.teachers && newActivity.teachers.length > 0) {
      const teacherIds = newActivity.teachers.map((t) => t.id);
      await event.manager
        .getRepository(Teacher)
        .increment({ id: In(teacherIds) }, 'assigned_hours', newDuration);
    }
    // Increment New Groups
    if (newActivity.groups && newActivity.groups.length > 0) {
      const groupIds = newActivity.groups.map((g) => g.id);
      await event.manager
        .getRepository(Group)
        .increment({ id: In(groupIds) }, 'assigned_hours', newDuration);
    }

    if (newActivity.subGroups && newActivity.subGroups.length > 0) {
      const subgroupIds = newActivity.subGroups.map((sg) => sg.id);
      await event.manager
        .getRepository(SubGroup)
        .increment({ id: In(subgroupIds) }, 'assigned_hours', newDuration);
    }

    if (newActivity.years && newActivity.years.length > 0) {
      const yearIds = newActivity.years.map((y) => y.id);
      await event.manager
        .getRepository(Year)
        .increment({ id: In(yearIds) }, 'assigned_hours', newDuration);
    }
  }
}
