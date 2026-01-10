import { Injectable } from '@nestjs/common';
import * as z from 'zod';
import { tool } from '@langchain/core/tools';
import { AgentTools } from './agent.service.tools';
import { SimpleResourceType } from './types';

@Injectable()
export class LangChainToolsService {
  constructor(private readonly agentTools: AgentTools) {}

  createTools() {
    const getResources = tool(
      async (input, config: any) => {
        const timetableId = config.configurable?.context?.timetableId;
        const userId = config.configurable?.context?.userId;
        const results = await this.agentTools.getResources(
          input.resourceType as any,
          timetableId,
          userId,
        );
        return results;
      },
      {
        name: 'getResources',
        description:
          'Retrieve various resources and data from a timetable system including teachers, subjects, days, hours, years, groups, buildings, rooms, tags, and activities.',
        schema: z.object({
          resourceType: z
            .enum([
              'teachers',
              'subjects',
              'days',
              'hours',
              'years',
              'groups',
              'subGroups',
              'buildings',
              'rooms',
              'tags',
              'activities',
            ])
            .describe('The type of resource to retrieve from the timetable'),
        }),
      },
    );

    const createSimpleResourceMany = tool(
      async (input, config: any) => {
        const timetableId = config.configurable?.context?.timetableId;
        const userId = config.configurable?.context?.userId;
        const results = await this.agentTools.CreateSimpleResourceMany(
          input.resourceType as SimpleResourceType,
          timetableId,
          userId,
          input.resources.map((r) => ({
            name: r.name,
            longname: r.longName,
            buildingId: r.buildingId,
            yearId: r.yearId,
            groupId: r.groupId,
            capacity: r.capacity,
          })),
        );
        return results;
      },
      {
        name: 'createSimpleResourceMany',
        description:
          'Create multiple new timetable resources in batch (teachers, subjects, days, hours, years, groups, subgroups, buildings, rooms, or tags).',
        schema: z.object({
          resourceType: z
            .enum([
              'teachers',
              'subjects',
              'days',
              'hours',
              'years',
              'groups',
              'subGroups',
              'buildings',
              'rooms',
              'tags',
            ])
            .describe('Type of resources to create in the timetable'),
          resources: z
            .array(
              z.object({
                name: z
                  .string()
                  .describe('Short name or code for the resource'),
                longName: z
                  .string()
                  .optional()
                  .describe('Full descriptive name'),
                buildingId: z
                  .number()
                  .int()
                  .optional()
                  // this needs to be fixed later
                  .describe('Required for rooms - the building ID, use the same building id for all rooms being created if you need to create rooms in other building make another call with different building id but for one call one building id only'),
                yearId: z
                  .number()
                  .int()
                  .optional()
                  .describe('Required for groups - the academic year ID'),
                groupId: z
                  .number()
                  .int()
                  .optional()
                  .describe('Required for subgroups - the parent group ID'),
                capacity: z
                  .number()
                  .int()
                  .optional()
                  .describe(
                    'Optional for rooms - number of people it can hold',
                  ),
              }),
            )
            .min(1)
            .describe('Array of resources to create'),
        }),
      },
    );

    const updateResources = tool(
      async (input, config: any) => {
        const timetableId = config.configurable?.context?.timetableId;
        const userId = config.configurable?.context?.userId;
        const result = await this.agentTools.UpdateResource(
          input.resourceType as SimpleResourceType,
          timetableId,
          userId,
          input.updates.map((u) => ({
            id: u.id,
            name: u.name,
            longname: u.longName,
            yearId: u.yearId,
            groupId: u.groupId,
          })),
        );
        return `Successfully updated ${result} ${input.resourceType} resources`;
      },
      {
        name: 'updateResources',
        description:
          'Update multiple resources of the same type (teachers, subjects, days, hours, years, groups, subGroups, buildings, rooms, or tags) in batch.',
        schema: z.object({
          resourceType: z
            .enum([
              'teachers',
              'subjects',
              'days',
              'hours',
              'years',
              'groups',
              'subGroups',
              'buildings',
              'rooms',
              'tags',
            ])
            .describe('The type of resource to update'),
          updates: z
            .array(
              z.object({
                id: z
                  .number()
                  .int()
                  .describe('The ID of the resource to update'),
                name: z
                  .string()
                  .optional()
                  .describe('New name for the resource'),
                longName: z
                  .string()
                  .optional()
                  .describe('New long name for the resource'),
                yearId: z
                  .number()
                  .int()
                  .optional()
                  .describe('Parent year ID (for groups only)'),
                groupId: z
                  .number()
                  .int()
                  .optional()
                  .describe('Parent group ID (for subgroups only)'),
              }),
            )
            .describe('Array of updates with resource IDs and new values'),
        }),
      },
    );

    const updateActivities = tool(
      async (input, config: any) => {
        const timetableId = config.configurable?.context?.timetableId;
        const userId = config.configurable?.context?.userId;
        const result = await this.agentTools.updateActivity(
          timetableId,
          userId,
          input.updates,
        );
        return `Successfully updated ${result} activities`;
      },
      {
        name: 'updateActivities',
        description:
          'Update multiple activities with new duration, subject, or related entities (teachers, years, groups, subgroups, tags).',
        schema: z.object({
          updates: z
            .array(
              z.object({
                id: z
                  .number()
                  .int()
                  .describe('The ID of the activity to update'),
                data: z
                  .object({
                    duration: z
                      .number()
                      .int()
                      .optional()
                      .describe('Duration of the activity in hours'),
                    subjectId: z
                      .number()
                      .int()
                      .optional()
                      .describe('ID of the subject for this activity'),
                    teachers: z
                      .array(z.number().int())
                      .optional()
                      .describe(
                        'Array of teacher IDs assigned to this activity',
                      ),
                    years: z
                      .array(z.number().int())
                      .optional()
                      .describe('Array of year IDs for this activity'),
                    groups: z
                      .array(z.number().int())
                      .optional()
                      .describe('Array of group IDs for this activity'),
                    subGroups: z
                      .array(z.number().int())
                      .optional()
                      .describe('Array of subgroup IDs for this activity'),
                    tags: z
                      .array(z.number().int())
                      .optional()
                      .describe('Array of tag IDs for this activity'),
                  })
                  .describe('Partial activity data to update'),
              }),
            )
            .describe('Array of activities to update with their new values'),
        }),
      },
    );

    const getEntityWithRelations = tool(
      async (input, config: any) => {
        const userId = config.configurable?.context?.userId;
        const result = await this.agentTools.getEntityWithRelations(
          input.entityType as any,
          input.entityId,
          userId,
        );
        return result;
      },
      {
        name: 'getEntityWithRelations',
        description:
          'Retrieve an entity (Year, Group, SubGroup, Teacher, or Tag) along with all its related activities with complete details including subject, teachers, years, groups, subgroups, and tags.',
        schema: z.object({
          entityType: z
            .enum(['years', 'groups', 'subGroups', 'teachers', 'tags'])
            .describe('The type of entity to retrieve relations for'),
          entityId: z
            .number()
            .int()
            .describe('The unique identifier of the entity'),
        }),
      },
    );

    const createActivities = tool(
      async (input, config: any) => {
        const timetableId = config.configurable?.context?.timetableId;
        const userId = config.configurable?.context?.userId;
        const results = await this.agentTools.createActivities(
          timetableId,
          input.activities,
          userId,
        );
        return results;
      },
      {
        name: 'createActivities',
        description:
          'Create multiple new activities with subject, teachers, years, groups, subgroups, tags, and duration.',
        schema: z.object({
          activities: z
            .array(
              z.object({
                duration: z
                  .number()
                  .int()
                  .describe('Duration of the activity in hours'),
                subjectId: z
                  .number()
                  .int()
                  .describe('ID of the subject for this activity'),
                teachers: z
                  .array(z.number().int())
                  .optional()
                  .describe('Array of teacher IDs assigned to this activity'),
                years: z
                  .array(z.number().int())
                  .optional()
                  .describe('Array of year IDs for this activity'),
                groups: z
                  .array(z.number().int())
                  .optional()
                  .describe('Array of group IDs for this activity'),
                subGroups: z
                  .array(z.number().int())
                  .optional()
                  .describe('Array of subgroup IDs for this activity'),
                tags: z
                  .array(z.number().int())
                  .optional()
                  .describe('Array of tag IDs for this activity'),
              }),
            )
            .min(1)
            .describe('Array of activities to create'),
        }),
      },
    );

    const deleteResources = tool(
      async (input, config: any) => {
        const timetableId = config.configurable?.context?.timetableId;
        const userId = config.configurable?.context?.userId;
        const result = await this.agentTools.removeResources(
          input.resourceType as any,
          timetableId,
          userId,
          input.ids,
        );
        return `Successfully deleted ${result} ${input.resourceType} resources`;
      },
      {
        name: 'deleteResources',
        description:
          'Delete multiple resources of the same type in batch (teachers, subjects, days, hours, years, groups, subGroups, buildings, rooms, tags, or activities).',
        schema: z.object({
          resourceType: z
            .enum([
              'teachers',
              'subjects',
              'days',
              'hours',
              'years',
              'groups',
              'subGroups',
              'buildings',
              'rooms',
              'tags',
              'activities',
            ])
            .describe('The type of resource to delete'),
          ids: z
            .array(z.number().int())
            .min(1)
            .describe('Array of resource IDs to delete'),
        }),
      },
    );

    return [
      getResources,
      createSimpleResourceMany,
      createActivities,
      updateResources,
      updateActivities,
      getEntityWithRelations,
      deleteResources,
    ];
  }
}
