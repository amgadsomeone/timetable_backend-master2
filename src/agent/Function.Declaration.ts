import {FunctionDeclaration, Type } from '@google/genai';

export const getResources: FunctionDeclaration = {
  name: 'getResources',
  description:
    'Retrieve various resources and data from a timetable system including teachers, subjects, days, hours, years, groups, buildings, rooms, tags, and activities',
  parameters: {
    type: Type.OBJECT,
    properties: {
      resourceType: {
        type: Type.STRING,
        description: 'The type of resource to retrieve from the timetable',
        enum: [
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
        ],
      },
      timetableId: {
        type: Type.NUMBER,
        description:
          'The unique identifier of the timetable to fetch resources from',
      },
    },
    required: ['resourceType', 'timetableId'],
  },
};

export const createResource: FunctionDeclaration = {
  name: 'createResource',
  description:
    'Create new timetable resources like teachers, subjects, schedule days, class periods, academic years, student groups, buildings, rooms, or tags',
  parameters: {
    type: Type.OBJECT,
    properties: {
      resourceType: {
        type: Type.STRING,
        description: 'Type of resource to create in the timetable',
        enum: [
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
        ],
      },
      name: {
        type: Type.STRING,
        description: 'Short name or code for the resource',
      },
      longName: {
        type: Type.STRING,
        description: 'Full descriptive name (optional)',
      },
      buildingId: {
        type: Type.NUMBER,
        description:
          'Required for rooms - the building where the room is located',
      },
      yearId: {
        type: Type.NUMBER,
        description:
          'Required for groups - the academic year the group belongs to',
      },
      groupId: {
        type: Type.NUMBER,
        description:
          'Required for subgroups - the parent group the subgroup belongs to',
      },
      capacity: {
        type: Type.NUMBER,
        description: 'Optional for rooms - number of people the room can hold',
      },
    },
    required: ['resourceType', 'name'],
  },
};

export const removeResourceSingle: FunctionDeclaration = {
  name: 'removeResourceSingle',
  description:
    'Delete a specific resource from the timetable system. Use this to remove teachers, subjects, days, hours, years, groups, subgroups, buildings, rooms, tags, or activities.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        description: 'The type of resource to delete',
        enum: [
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
        ],
      },
      resourceId: {
        type: Type.NUMBER,
        description: 'The ID of the specific resource to delete',
      },
    },
    required: ['type', 'resourceId'],
  },
};

export const createActivities: FunctionDeclaration = {
  name: 'createActivities',
  description:
    'Create a new activity in the timetable system. Activities represent scheduled events like classes, lessons, or meetings with specific duration, subject, and optional participants.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      duration: {
        type: Type.NUMBER,
        description: 'How long the activity lasts in time units (minimum 1)',
      },
      subjectId: {
        type: Type.NUMBER,
        description: 'The ID of the subject for this activity',
      },
      teachers: {
        type: Type.ARRAY,
        description: 'Optional array of teacher IDs assigned to this activity',
        items: {
          type: Type.NUMBER,
        },
      },
      years: {
        type: Type.ARRAY,
        description: 'Optional array of academic year IDs for this activity',
        items: {
          type: Type.NUMBER,
        },
      },
      groups: {
        type: Type.ARRAY,
        description: 'Optional array of student group IDs for this activity',
        items: {
          type: Type.NUMBER,
        },
      },
      subGroups: {
        type: Type.ARRAY,
        description: 'Optional array of student subgroup IDs for this activity',
        items: {
          type: Type.NUMBER,
        },
      },
      tags: {
        type: Type.ARRAY,
        description: 'Optional array of tag IDs to categorize this activity',
        items: {
          type: Type.NUMBER,
        },
      },
    },
    required: ['duration', 'subjectId'],
  },
};


export const createActivitiesMany: FunctionDeclaration = {
  name: 'createActivities',
  description:
    'Create one or more new activities in the timetable. Activities are scheduled events like classes or meetings.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      // The top-level property should be an array
      activities: {
        type: Type.ARRAY,
        description: 'An array of activity objects to be created.',
        // 'items' describes the shape of each object inside the array
        items: {
          type: Type.OBJECT,
          properties: {
            duration: {
              type: Type.NUMBER,
              description: 'How long the activity lasts in time units (minimum 1).',
            },
            subjectId: {
              type: Type.NUMBER,
              description: 'The ID of the subject for this activity.',
            },
            teachers: {
              type: Type.ARRAY,
              description: 'Optional array of teacher IDs.',
              items: { type: Type.NUMBER },
            },
            years: {
              type: Type.ARRAY,
              description: 'Optional array of academic year IDs.',
              items: { type: Type.NUMBER },
            },
            groups: {
              type: Type.ARRAY,
              description: 'Optional array of student group IDs.',
              items: { type: Type.NUMBER },
            },
            subGroups: {
              type: Type.ARRAY,
              description: 'Optional array of student subgroup IDs.',
              items: { type: Type.NUMBER },
            },
            tags: {
              type: Type.ARRAY,
              description: 'Optional array of tag IDs.',
              items: { type: Type.NUMBER },
            },
          },
          // These are required for each object within the array
          required: ['duration', 'subjectId'],
        },
      },
    },
    // This is the required top-level property
    required: ['activities'],
  },
};


export const createResourceMany: FunctionDeclaration = {
  name: 'createResource',
  description:
    'Create one or more new timetable resources of the same type (e.g., teachers, rooms, subjects).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      resourceType: {
        type: Type.STRING,
        description: 'The single type of resource to create for all items in the list.',
        enum: [
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
        ],
      },
      // NEW: An array property to hold all the resources to create
      resources: {
        type: Type.ARRAY,
        description: 'An array of resource objects to create, each with a name and optional long name.',
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Short name or code for the resource.',
            },
            longName: {
              type: Type.STRING,
              description: 'Full descriptive name (optional).',
            },
          },
          required: ['name'], // Each object in the array must have a name
        },
      },
      // These contextual IDs apply to ALL resources being created in the batch
      buildingId: {
        type: Type.NUMBER,
        description:
          'Required if resourceType is "rooms". The building ID where all rooms will be created.',
      },
      yearId: {
        type: Type.NUMBER,
        description:
          'Required if resourceType is "groups". The academic year ID for all groups.',
      },
      groupId: {
        type: Type.NUMBER,
        description:
          'Required if resourceType is "subGroups". The parent group ID for all subgroups.',
      },
      capacity: {
        type: Type.NUMBER,
        description: 'Optional for "rooms". Sets a default capacity for all rooms being created.',
      },
    },
    // The required properties are now the type and the array of resources
    required: ['resourceType', 'resources'],
  },
};