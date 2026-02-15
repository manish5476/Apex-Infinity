export type NoteType = 'note' | 'task' | 'meeting' | 'idea' | 'journal' | 'project';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type NoteStatus = 'draft' | 'active' | 'completed' | 'archived' | 'deferred';
export type Permission = 'viewer' | 'contributor' | 'admin';

export interface NoteAttachment {
  url: string;
  publicId: string;
  fileType: 'image' | 'file';
  fileName: string;
  size: number;
  uploadedAt?: Date;
}

export interface MeetingDetails {
  agenda?: string;
  minutes?: string;
  location?: string;
  meetingType?: 'in-person' | 'virtual' | 'hybrid';
  videoLink?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: Date;
}

export interface Subtask {
  _id?: string;
  title: string;
  completed: boolean;
  completedAt?: Date | string;
}

export interface ActivityLog {
  action: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string | Date;
}

export interface Participant {
  _id?: string;
  user: string | {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  // Expanded roles to include Meeting specific roles
  role: 'organizer' | 'attendee' | 'contributor' | 'viewer' | 'presenter' | 'guest';
  
  // Note Schema uses rsvp, Meeting Schema uses invitationStatus
  rsvp?: 'pending' | 'accepted' | 'declined' | 'tentative';
  invitationStatus?: 'pending' | 'accepted' | 'declined' | 'tentative';
  
  responseAt?: Date | string;
}

export interface Note {
  _id: string;
  organizationId: string;
  owner: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  title: string;
  content: string;
  summary?: string;
  
  noteType: NoteType;
  status: NoteStatus;
  priority: Priority;
  
  startDate?: string | Date;
  dueDate?: string | Date;
  completedAt?: string | Date;
  duration?: number;

  category?: string;
  tags: string[];
  
  isMeeting: boolean;
  isPinned: boolean;
  isTemplate: boolean;
  isDeleted: boolean;
  
  meetingDetails?: MeetingDetails;
  meetingId?: string; 
  participants: Participant[];
  attachments: NoteAttachment[];
  
  progress?: number;
  subtasks?: Subtask[];

  relatedNotes?: Array<{ _id: string; title: string; noteType: string; status: string }>;
  projectId?: string | { _id: string; name: string };
  activityLog?: ActivityLog[];

  sharedWith: Array<{ _id: string; name: string; email?: string }>;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay: boolean;
  color?: string;
  textColor?: string;
  extendedProps: {
    noteType?: string;
    status?: string;
    priority?: string;
    isMeeting?: boolean;
    participants?: string[];
    meetingId?: string;
  }; 
}

export interface NoteFilterParams {
  type?: NoteType;
  status?: NoteStatus;
  priority?: Priority;
  search?: string;
  category?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface DailyNoteCount {
  date: string;
  count: number;
  notes: string[];
}

export interface HeatMapData {
  [date: string]: {
    count: number;
    intensity: number;
  };
}

export interface NoteStatistics {
  totalNotes: { count: number }[];
  byType: { _id: NoteType; count: number }[];
  byStatus: { _id: NoteStatus; count: number }[];
  byPriority: { _id: Priority; count: number }[];
  recentActivity: Array<{
    _id: string;
    title: string;
    noteType: NoteType;
    status: NoteStatus;
    priority: Priority;
    updatedAt: string;
  }>;
}

export interface Meeting {
  _id: string;
  organizationId: string;
  title: string;
  description: string;
  agenda?: string;
  startTime: string | Date;
  endTime: string | Date;
  organizer: string | { _id: string; name: string; avatar?: string };
  
  // Updated status to include 'in-progress' and 'postponed'
  status: 'scheduled' | 'cancelled' | 'completed' | 'rescheduled' | 'in-progress' | 'postponed';
  
  // Updated locationType to match 'physical' instead of 'in-person'
  locationType?: 'physical' | 'virtual' | 'hybrid';
  
  // Added physicalLocation property
  physicalLocation?: string;
  
  virtualLink?: string;
  participants?: Participant[];
  minutes?: string;
  actionItems?: any[];
}

// export type NoteType = 'note' | 'task' | 'meeting' | 'idea' | 'journal' | 'project';
// export type Priority = 'low' | 'medium' | 'high' | 'urgent';
// export type NoteStatus = 'draft' | 'active' | 'completed' | 'archived' | 'deferred';
// export type Permission = 'viewer' | 'contributor' | 'admin';

// export interface NoteAttachment {
//   url: string;
//   publicId: string;
//   fileType: 'image' | 'file';
//   fileName: string;
//   size: number;
//   uploadedAt?: Date;
// }

// export interface MeetingDetails {
//   agenda?: string;
//   minutes?: string;
//   location?: string;
//   meetingType?: 'in-person' | 'virtual' | 'hybrid';
//   videoLink?: string;
//   recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
//   recurrenceEndDate?: Date;
// }

// export interface Subtask {
//   _id?: string;
//   title: string;
//   completed: boolean;
//   completedAt?: Date | string;
// }

// export interface ActivityLog {
//   action: string;
//   user: {
//     _id: string;
//     name: string;
//     avatar?: string;
//   };
//   timestamp: string | Date;
// }

// export interface Participant {
//   _id?: string;
//   user: {
//     _id: string;
//     name: string;
//     email: string;
//     avatar?: string;
//   };
//   role: 'organizer' | 'attendee' | 'contributor' | 'viewer';
//   rsvp: 'pending' | 'accepted' | 'declined' | 'tentative';
//   responseAt?: Date | string;
// }

// export interface Note {
//   _id: string;
//   organizationId: string;
//   owner: {
//     _id: string;
//     name: string;
//     email: string;
//     avatar?: string;
//   };
//   title: string;
//   content: string;
//   summary?: string;
  
//   noteType: NoteType;
//   status: NoteStatus;
//   priority: Priority;
  
//   startDate?: string | Date;
//   dueDate?: string | Date;
//   completedAt?: string | Date;
//   duration?: number;

//   category?: string;
//   tags: string[]; // Strictly string array
  
//   isMeeting: boolean;
//   isPinned: boolean;
//   isTemplate: boolean;
//   isDeleted: boolean;
  
//   meetingDetails?: MeetingDetails;
//   meetingId?: string; 
//   participants: Participant[];
//   attachments: NoteAttachment[];
  
//   progress?: number;
//   subtasks?: Subtask[];

//   // Populated for UI consumption
//   relatedNotes?: Array<{ _id: string; title: string; noteType: string; status: string }>;
//   projectId?: string | { _id: string; name: string };
//   activityLog?: ActivityLog[];

//   sharedWith: Array<{ _id: string; name: string; email?: string }>;

//   createdAt: string;
//   updatedAt: string;
//   deletedAt?: string;
// }

// export interface CalendarEvent {
//   id: string;
//   title: string;
//   start: string | Date;
//   end?: string | Date;
//   allDay: boolean;
//   color?: string;
//   textColor?: string;
//   extendedProps: {
//     noteType?: string;
//     status?: string;
//     priority?: string;
//     isMeeting?: boolean;
//     participants?: string[];
//     meetingId?: string;
//   }; 
// }

// export interface NoteFilterParams {
//   type?: NoteType;
//   status?: NoteStatus;
//   priority?: Priority;
//   search?: string;
//   category?: string;
//   tag?: string;
//   startDate?: string;
//   endDate?: string;
//   date?: string;
//   page?: number;
//   limit?: number;
//   sort?: string;
// }

// export interface DailyNoteCount {
//   date: string;
//   count: number;
//   notes: string[];
// }

// export interface HeatMapData {
//   [date: string]: {
//     count: number;
//     intensity: number;
//   };
// }

// // Aligned with the backend aggregation response structure
// export interface NoteStatistics {
//   totalNotes: { count: number }[];
//   byType: { _id: NoteType; count: number }[];
//   byStatus: { _id: NoteStatus; count: number }[];
//   byPriority: { _id: Priority; count: number }[];
//   recentActivity: Array<{
//     _id: string;
//     title: string;
//     noteType: NoteType;
//     status: NoteStatus;
//     priority: Priority;
//     updatedAt: string;
//   }>;
// }

// export interface Meeting {
//   _id: string;
//   organizationId: string;
//   title: string;
//   description: string;
//   agenda?: string;
//   startTime: string | Date;
//   endTime: string | Date;
//   organizer: string | { _id: string; name: string; avatar?: string };
//   status: 'scheduled' | 'cancelled' | 'completed' | 'rescheduled';
//   locationType?: 'in-person' | 'virtual' | 'hybrid';
//   virtualLink?: string;
//   participants?: Participant[];
//   minutes?: string;
//   actionItems?: any[];
// }



// // // src/app/core/models/note.types.ts

// // export type NoteType = 'note' | 'task' | 'meeting' | 'idea' | 'journal' | 'project';
// // export type Priority = 'low' | 'medium' | 'high' | 'urgent';
// // export type NoteStatus = 'draft' | 'active' | 'completed' | 'archived' | 'deferred';
// // export type Permission = 'viewer' | 'contributor' | 'admin';

// // export interface NoteAttachment {
// //   url: string;
// //   publicId: string;
// //   fileType: 'image' | 'file';
// //   fileName: string;
// //   size: number;
// //   uploadedAt?: Date;
// // }

// // export interface MeetingDetails {
// //   agenda?: string;
// //   minutes?: string;
// //   location?: string;
// //   meetingType?: 'in-person' | 'virtual' | 'hybrid';
// //   videoLink?: string;
// //   recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
// //   recurrenceEndDate?: Date;
// // }

// // export interface Subtask {
// //   title: string;
// //   _id:string;
// //   completed: boolean;
// //   completedAt?: Date;
// // }

// // export interface ActivityLog {
// //   action: string;
// //   user: any
// //   timestamp: string | Date;
// // }

// // export interface Participant {
// // _id: any;
// //   user: {
// //     _id: string;
// //     name: string;
// //     email: string;
// //     avatar?: string;
// //   };
// //   role: 'organizer' | 'attendee' | 'contributor' | 'viewer';
// //   rsvp: 'pending' | 'accepted' | 'declined' | 'tentative';
// //   responseAt?: Date;
// // }

// // // The Main Entity
// // export interface Note {
// //   _id: string;
// //   id: string;
// //   organizationId: string;
// //   owner: {
// //     _id: string;
// //     name: string;
// //     email: string;
// //     avatar?: string;
// //   };
// //   title: string;
// //   content: string;
// //   summary?: string;
  
// //   noteType: NoteType;
// //   status: NoteStatus;
// //   priority: Priority;
  
// //   startDate?: string | Date;
// //   dueDate?: string | Date;
// //   completedAt?: string | Date;
// //   duration?: number; // minutes

// //   category?: string;
// //   tags: any;
  
// //   // Feature flags
// //   isMeeting: boolean;
// //   isPinned: boolean;
// //   isTemplate: boolean;
// //   isDeleted: boolean; // Soft delete flag
  
// //   // Complex nested objects
// //   meetingDetails?: MeetingDetails;
// //   meetingId?: string; 
// //   participants: Participant[];
// //   attachments: NoteAttachment[];
  
// //   // Progress & Subtasks
// //   progress?: number; // 0-100
// //   subtasks?: Subtask[];

// //   // Linking & History
// //   relatedNotes?: string[] | Note[]; // IDs or Populated objects
// //   projectId?: string; // Reference ID
// //   activityLog?: ActivityLog[];

// //   // Sharing
// //   visibility: 'private' | 'team' | 'department' | 'organization';
// //   sharedWith: string[] | { _id: string; name: string }[]; // IDs or Populated users

// //   // Timestamps
// //   createdAt: string;
// //   updatedAt: string;
// //   deletedAt?: string;
// // }

// // // // For Calendar View
// // // export interface CalendarEvent {
// // //   id: string;
// // //   title: string;
// // //   start: string | Date;
// // //   end?: string | Date;
// // //   allDay: boolean;
// // //   color?: string;
// // //   textColor?: string;
// // //   extendedProps?: {
// // //     noteType: NoteType;
// // //     status: NoteStatus;
// // //     priority: Priority;
// // //     isMeeting: boolean;
// // //     type?: string; 
// // //     participants?: string[]; // Names of participants
// // //     meetingId?: string;
// // //   };
// // // }

// // // For API Requests
// // export interface NoteFilterParams {
// //   type?: NoteType;
// //   status?: NoteStatus;
// //   priority?: Priority;
// //   search?: string;
// //   category?: string;
// //   tag?: string;
// //   startDate?: string;
// //   endDate?: string;
// //   date?: string; // Specific date filter
// //   page?: number;
// //   limit?: number;
// //   sort?: string;
// // }

// // // Analytics Interfaces
// // export interface DailyNoteCount {
// //   date: string;
// //   count: number;
// //   notes: string[]; // IDs
// // }

// // export interface HeatMapData {
// //   [date: string]: {
// //     count: number;
// //     intensity: number; // 0 to 1
// //   };
// // }

// // export interface NoteStatistics {
// //   totalNotes: number;
// //   byType: { _id: NoteType; count: number }[];
// //   byStatus: { _id: NoteStatus; count: number }[];
// //   byPriority: { _id: Priority; count: number }[];
// //   recentActivity: Partial<Note>[];
// // }

// // export interface AnalyticsSummary {
// //   byType: { _id: NoteType; count: number }[];
// //   byStatus: { _id: NoteStatus; count: number }[];
// //   byPriority: { _id: Priority; count: number }[];
// //   dailyActivity: { _id: string; count: number }[];
// //   completionRate: { total: number; completed: number };
// //   topTags: { _id: string; count: number }[];
// //   period: 'week' | 'month' | 'quarter' | 'year';
// // }

// // // Separate Meeting Interface
// // export interface Meeting {
// //   _id: string;
// //   organizationId: string;
// //   title: string;
// //   description: string;
// //   agenda?: string;
// //   startTime: string | Date;
// //   endTime: string | Date;
// //   organizer: string | { _id: string; name: string; avatar?: string };
// //   status: 'scheduled' | 'cancelled' | 'completed' | 'rescheduled';
// //   locationType?: 'in-person' | 'virtual' | 'hybrid';
// //   virtualLink?: string;
// //   participants?: Participant[];
// //   minutes?: string;
// //   actionItems?: any[];
// // }
// // // src/app/core/models/note.types.ts

// // // ... other interfaces ...

// // export interface CalendarEvent {
// //   id: string;
// //   title: string;
// //   start: string | Date;
// //   end?: string | Date;
// //   allDay: boolean;
// //   color?: string;
// //   textColor?: string;
  
// //   // FIX: define the shape explicitly so the template knows what 'isMeeting' is
// //    extendedProps: {
// //     noteType?: string;
// //     status?: string;
// //     priority?: string;
// //     isMeeting?: boolean; // This is what the template is looking for
// //     participants?: string[];
// //     meetingId?: string;
// //   }; 
// // }