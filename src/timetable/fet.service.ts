import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { Timetable } from './entity/timetable.entity';

@Injectable()
export class FetExportService {
  /**
   * Generates a FET-compatible XML string from a full timetable data object.
   * @param timetable The full timetable object with all relations loaded.
   * @returns A formatted XML string.
   */
  public generateFetXml(timetable: Timetable): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('fet', { version: '7.5.3' });

    // --- Header Information ---
    root.ele('Mode').txt('Official');
    root.ele('Institution_Name').txt(timetable.InstitutionName);
    root.ele('Comments').txt('Generated from Timetable App');

    // --- Days List ---
    const daysList = root.ele('Days_List');
    daysList.ele('Number_of_Days').txt(timetable.days.length.toString());
    for (const day of timetable.days) {
      const dayEle = daysList.ele('Day');
      dayEle.ele('Name').txt(day.name);
      dayEle.ele('Long_Name').txt(day.longName);
    }

    // --- Hours List ---
    const hoursList = root.ele('Hours_List');
    hoursList.ele('Number_of_Hours').txt(timetable.hours.length.toString());
    for (const hour of timetable.hours) {
      const hourEle = hoursList.ele('Hour');
      hourEle.ele('Name').txt(hour.name);
      hourEle.ele('Long_Name').txt(hour.longName);
    }

    // --- Subjects List ---
    const subjectsList = root.ele('Subjects_List');
    for (const subject of timetable.subjects) {
      const subjectEle = subjectsList.ele('Subject');
      subjectEle.ele('Name').txt(subject.name);
      subjectEle.ele('Long_Name').txt(subject.longName ?? '');
      subjectEle.ele('Code').txt('');
      subjectEle.ele('Comments').txt('');
    }

    // --- Activity Tags List ---
    const tagsList = root.ele('Activity_Tags_List');
    for (const tag of timetable.tags) {
      const tagEle = tagsList.ele('Activity_Tag');
      tagEle.ele('Name').txt(tag.name);
      tagEle.ele('Long_Name').txt(tag.longName ?? '');
      tagEle.ele('Code').txt('');
      tagEle.ele('Printable').txt('true');
      tagEle.ele('Comments').txt('');
    }

    // --- Teachers List ---
    const teachersList = root.ele('Teachers_List');
    for (const teacher of timetable.teachers) {
      const teacherEle = teachersList.ele('Teacher');
      teacherEle.ele('Name').txt(teacher.name);
      teacherEle.ele('Long_Name').txt(teacher.longName ?? '');
      teacherEle.ele('Code').txt('');
      teacherEle.ele('Target_Number_of_Hours').txt((teacher.targetHours ?? 0).toString());
      const qualifiedSubjectsEle = teacherEle.ele('Qualified_Subjects');
      if (teacher.qualifiedSubjects && teacher.qualifiedSubjects.length > 0) {
        for (const qs of teacher.qualifiedSubjects) {
          qualifiedSubjectsEle.ele('Qualified_Subject').txt(qs.name);
        }
      }
      teacherEle.ele('Comments').txt('');
    }
    
    // --- Students List (Years, Groups, Subgroups) ---
    const studentsList = root.ele('Students_List');
    for (const year of timetable.years) {
      const yearEle = studentsList.ele('Year');
      yearEle.ele('Name').txt(year.name);
      yearEle.ele('Long_Name').txt('');
      yearEle.ele('Code').txt('');
      yearEle.ele('Number_of_Students').txt('0');
      yearEle.ele('Comments').txt('');
      yearEle.ele('Number_of_Categories').txt('0');
      yearEle.ele('First_Category_Is_Permanent').txt('false');
      yearEle.ele('Separator').txt(' ');

      if (year.groups && year.groups.length > 0) {
        for (const group of year.groups) {
          const groupEle = yearEle.ele('Group');
          groupEle.ele('Name').txt(group.name);
          groupEle.ele('Long_Name').txt('');
          groupEle.ele('Code').txt('');
          groupEle.ele('Number_of_Students').txt('0');
          groupEle.ele('Comments').txt('');

          if (group.subGroups && group.subGroups.length > 0) {
            for (const subGroup of group.subGroups) {
              const subGroupEle = groupEle.ele('Subgroup');
              subGroupEle.ele('Name').txt(subGroup.name);
              subGroupEle.ele('Long_Name').txt('');
              subGroupEle.ele('Code').txt('');
              subGroupEle.ele('Number_of_Students').txt('0');
              subGroupEle.ele('Comments').txt('');
            }
          }
        }
      }
    }

    // --- Activities List ---
    const activitiesList = root.ele('Activities_List');
    for (const activity of timetable.activities) {
      const activityEle = activitiesList.ele('Activity');
      if (activity.teachers) {
        for (const teacher of activity.teachers) {
          activityEle.ele('Teacher').txt(teacher.name);
        }
      }
      if (activity.subject) {
        activityEle.ele('Subject').txt(activity.subject.name);
      }
      if (activity.tags) {
        for (const tag of activity.tags) {
          activityEle.ele('Activity_Tag').txt(tag.name);
        }
      }
      // Combine all student groups into a flat list
      if (activity.years) {
        for (const year of activity.years) activityEle.ele('Students').txt(year.name);
      }
      if (activity.groups) {
        for (const group of activity.groups) activityEle.ele('Students').txt(group.name);
      }
      if (activity.subGroups) {
        for (const subGroup of activity.subGroups) activityEle.ele('Students').txt(subGroup.name);
      }
      activityEle.ele('Duration').txt(activity.duration.toString());
      activityEle.ele('Total_Duration').txt(activity.duration.toString());
      activityEle.ele('Id').txt(activity.id.toString());
      activityEle.ele('Activity_Group_Id').txt('0');
      activityEle.ele('Active').txt('true');
      activityEle.ele('Comments').txt('');
    }

    // --- Buildings and Rooms Lists (Flattened) ---
    const buildingsList = root.ele('Buildings_List');
    const roomsList = root.ele('Rooms_List');
    for (const building of timetable.buildings) {
      const buildingEle = buildingsList.ele('Building');
      buildingEle.ele('Name').txt(building.name);
      buildingEle.ele('Long_Name').txt(building.longName ?? '');
      buildingEle.ele('Code').txt('');
      buildingEle.ele('Comments').txt('');

      if (building.rooms && building.rooms.length > 0) {
        for (const room of building.rooms) {
          const roomEle = roomsList.ele('Room');
          roomEle.ele('Name').txt(room.name);
          roomEle.ele('Long_Name').txt('');
          roomEle.ele('Code').txt('');
          roomEle.ele('Building').txt(building.name); // Link back to building by name
          roomEle.ele('Capacity').txt(room.capacity.toString());
          roomEle.ele('Virtual').txt('false');
          roomEle.ele('Comments').txt('');
        }
      }
    }

    // --- Placeholder Constraints Lists ---
    root.ele('Time_Constraints_List').ele('ConstraintBasicCompulsoryTime')
      .ele('Weight_Percentage').txt('100').up()
      .ele('Active').txt('true').up()
      .ele('Comments').txt('');

    root.ele('Space_Constraints_List').ele('ConstraintBasicCompulsorySpace')
      .ele('Weight_Percentage').txt('100').up()
      .ele('Active').txt('true').up()
      .ele('Comments').txt('');

    root.ele('Timetable_Generation_Options_List');

    // --- Finalize and format the XML ---
    return root.end({ prettyPrint: true });
  }
}