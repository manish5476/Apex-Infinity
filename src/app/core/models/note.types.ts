// ============================================================================
// ENUMS & LITERAL TYPES
// ============================================================================

export type ItemType = 'note' | 'task' | 'idea' | 'journal' | 'project' | 'meeting' | 'meeting_note';
export type NoteStatus = 'draft' | 'open' | 'in_progress' | 'in_review' | 'done' | 'archived' | 'cancelled';
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type Visibility = 'private' | 'assignees' | 'team' | 'department' | 'organization';
export type AssignmentStatus = 'pending' | 'accepted' | 'declined' | 'in_progress' | 'done' | 'verified';

export type MeetingStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type LocationType = 'physical' | 'virtual' | 'hybrid';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ============================================================================
// SHARED & UTILITY INTERFACES
// ============================================================================

export interface UserLight {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface GeoLocation {
  geoJson?: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  accuracy?: number; // Notes specific
  room?: string;     // Meeting specific
  floor?: string;    // Meeting specific
  building?: string; // Meeting specific
  directions?: string; // Meeting specific
}

export interface RecurrenceRule {
  enabled?: boolean;
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: Date | string;
  occurrences?: number;
  exceptions?: (Date | string)[];
  masterId?: string;   // Meetings
  parentId?: string;   // Notes
  occurrence?: number; // Meetings
}

export interface AssetAttachment {
  _id?: string;
  assetId?: string;
  url: string;
  publicId?: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadedBy?: string | UserLight;
  uploadedAt?: Date | string;
}

// ============================================================================
// NOTE SUB-DOCUMENTS
// ============================================================================

export interface Assignee {
  _id?: string;
  user: string | UserLight;
  assignedBy: string | UserLight;
  assignedAt?: Date | string;
  role: 'owner' | 'collaborator' | 'reviewer' | 'observer';
  status: AssignmentStatus;
  acceptedAt?: Date | string;
  completedAt?: Date | string;
  estimatedHours?: number;
  loggedHours?: number;
  notes?: string;
}

export interface ChecklistItem {
  _id?: string;
  title: string;
  completed: boolean;
  completedAt?: Date | string;
  completedBy?: string | UserLight;
  assignedTo?: string | UserLight;
  dueDate?: Date | string;
  order?: number;
}

export interface TimeLog {
  _id?: string;
  user: string | UserLight;
  startTime: Date | string;
  endTime?: Date | string;
  hours?: number;
  note?: string;
  loggedAt?: Date | string;
}

export interface Label {
  _id?: string;
  name: string;
  color: string;
}

export interface CustomField {
  key: string;
  value: any;
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'select';
}

// ============================================================================
// MEETING SUB-DOCUMENTS
// ============================================================================

export interface MeetingParticipant {
  _id?: string;
  user?: string | UserLight;
  externalEmail?: string;
  externalName?: string;
  role: 'organizer' | 'presenter' | 'attendee' | 'note_taker' | 'observer' | 'guest';
  invitationStatus: 'pending' | 'accepted' | 'declined' | 'tentative' | 'not_sent';
  invitedAt?: Date | string;
  respondedAt?: Date | string;
  responseNote?: string;
  attended?: boolean;
  joinedAt?: Date | string;
  leftAt?: Date | string;
  durationMinutes?: number;
  receiveRecording?: boolean;
}

export interface ActionItem {
  _id?: string;
  title: string;
  description?: string;
  assignedTo?: string | UserLight;
  dueDate?: Date | string;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  priority?: Priority;
  completedAt?: Date | string;
  noteId?: string; // If converted to a standalone task
}

export interface AgendaItem {
  _id?: string;
  order: number;
  title: string;
  description?: string;
  duration?: number;
  presenter?: string | UserLight;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  actualDuration?: number;
  notes?: string;
}

export interface MeetingPoll {
  _id?: string;
  question: string;
  options: Array<{ label: string; votes: string[] }>;
  isAnonymous?: boolean;
  closedAt?: Date | string;
  createdBy?: string | UserLight;
}

// ============================================================================
// MAIN MODELS
// ============================================================================

export interface Note {
  _id: string;
  organizationId: string;
  owner: UserLight;

  itemType: ItemType;
  title: string;
  content?: string;
  summary?: string;

  status: NoteStatus;
  priority: Priority;
  priorityOrder?: number;

  startDate?: string | Date;
  dueDate?: string | Date;
  completedAt?: string | Date;
  archivedAt?: string | Date;

  estimatedHours?: number;
  loggedHours?: number;
  timeLogs?: TimeLog[];
  recurrence?: RecurrenceRule;

  assignees?: Assignee[];
  watchers?: (string | UserLight)[];

  category?: string;
  tags: string[];
  labels?: Label[];

  checklist?: ChecklistItem[];
  progress?: number;

  location?: GeoLocation;

  visibility: Visibility;
  sharedWith: Array<{
    user: string | UserLight;
    permission: 'view' | 'comment' | 'edit';
    sharedAt?: Date | string;
    sharedBy?: string | UserLight;
  }>;
  visibleToDepartments?: string[];

  parentId?: string;
  relatedNotes?: Array<{ _id: string; title: string; itemType: string; status: string }>;
  projectId?: string | { _id: string; name: string };
  meetingId?: string;

  attachments: AssetAttachment[];

  isPinned: boolean;
  isTemplate: boolean;
  templateId?: string;

  customFields?: CustomField[];
  externalRefs?: Array<{ service: string; refId: string; url: string }>;

  commentCount?: number;
  viewCount?: number;
  lastViewedAt?: Date | string;
  lastViewedBy?: string | UserLight;

  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Virtuals
  isOverdue?: boolean;
  timeRemaining?: number;
  checklistProgress?: { done: number; total: number; percentage: number };
  totalLoggedHours?: number;
  subTasks?: Note[];
}

export interface Meeting {
  _id: string;
  organizationId: string;
  organizer: string | UserLight;
  branchId?: string;

  title: string;
  description?: string;
  timezone?: string;

  startTime: string | Date;
  endTime: string | Date;
  bufferBefore?: number;
  bufferAfter?: number;

  locationType: LocationType;
  physicalLocation?: string | GeoLocation;
  virtualLink?: string;
  virtual?: {
    platform: 'zoom' | 'teams' | 'meet' | 'webex' | 'custom';
    link?: string;
    meetingId?: string;
    password?: string;
    dialIn?: string;
  };

  participants: MeetingParticipant[];
  agendaItems?: AgendaItem[];
  agenda?: string;

  minutes?: string;
  linkedNoteId?: string;
  actionItems?: ActionItem[];
  polls?: MeetingPoll[];

  status: MeetingStatus;
  cancelReason?: string;
  postponedUntil?: Date | string;

  isRecurring?: boolean;
  recurrence?: RecurrenceRule;

  attachments?: AssetAttachment[];

  settings?: {
    waitingRoom?: boolean;
    muteOnEntry?: boolean;
    allowChat?: boolean;
    allowRecording?: boolean;
    autoRecording?: boolean;
    requireRSVP?: boolean;
    allowGuests?: boolean;
    autoAcceptJoin?: boolean;
  };

  recording?: {
    enabled: boolean;
    url?: string;
    duration?: number;
    startedAt?: Date | string;
    endedAt?: Date | string;
  };

  reminders?: Array<{
    channel: 'email' | 'push' | 'sms' | 'in_app';
    minutesBefore: number;
    sent?: boolean;
    sentAt?: Date | string;
  }>;

  analytics?: {
    invitedCount: number;
    acceptedCount: number;
    attendedCount: number;
    attendanceRate: number;
    avgDurationMins: number;
  };

  tags?: string[];
  category?: string;

  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;

  // Virtuals
  durationMinutes?: number;
  isUpcoming?: boolean;
  isPast?: boolean;
  isInProgress?: boolean;
  acceptanceRate?: number;
}

// ============================================================================
// ACTIVITY & COMMENTS
// ============================================================================

export interface NoteActivity {
  _id: string;
  noteId?: string;
  meetingId?: string;
  organizationId: string;
  actor: UserLight;
  action: string; // Matches backend enum (e.g., 'created', 'status_changed', etc.)
  changes?: {
    field?: string;
    oldValue?: any;
    newValue?: any;
  };
  meta?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface NoteComment {
  _id: string;
  noteId?: string;
  meetingId?: string;
  organizationId: string;
  author: UserLight;
  content: string;
  parentCommentId?: string;
  threadDepth?: number;
  reactions?: Array<{
    emoji: string;
    users: (string | UserLight)[];
  }>;
  mentions?: (string | UserLight)[];
  attachments?: AssetAttachment[];
  isEdited?: boolean;
  editedAt?: Date | string;
  editHistory?: Array<{ content: string; editedAt: Date | string }>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CALENDAR & ANALYTICS
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay: boolean;
  color?: string;
  textColor?: string;
  extendedProps: {
    itemType?: ItemType;
    status?: NoteStatus | MeetingStatus;
    priority?: Priority;
    isMeeting?: boolean;
    meetingId?: string;
    participants?: string[];
    locationType?: LocationType;
  };
}

export interface NoteFilterParams {
  itemType?: ItemType;
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

export interface HeatMapData {
  [date: string]: {
    count: number;
    intensity: number; // 0 to 4
    types: string[];
  };
}

export interface NoteStatistics {
  totalNotes: { count: number }[];
  byType: { _id: ItemType; count: number }[];
  byStatus: { _id: NoteStatus; count: number }[];
  byPriority: { _id: Priority; count: number }[];
  recentActivity: Array<{
    _id: string;
    title: string;
    itemType: ItemType;
    status: NoteStatus;
    priority: Priority;
    updatedAt: string;
  }>;
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
//   user: string | {
//     _id: string;
//     name: string;
//     email: string;
//     avatar?: string;
//   };
//   // Expanded roles to include Meeting specific roles
//   role: 'organizer' | 'attendee' | 'contributor' | 'viewer' | 'presenter' | 'guest';

//   // Note Schema uses rsvp, Meeting Schema uses invitationStatus
//   rsvp?: 'pending' | 'accepted' | 'declined' | 'tentative';
//   invitationStatus?: 'pending' | 'accepted' | 'declined' | 'tentative';

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
//   tags: string[];

//   isMeeting: boolean;
//   isPinned: boolean;
//   isTemplate: boolean;
//   isDeleted: boolean;

//   meetingDetails?: MeetingDetails;
//   meetingId?: string;
//   participants: any[];
//   attachments: NoteAttachment[];

//   progress?: number;
//   subtasks?: Subtask[];

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

//   // Updated status to include 'in-progress' and 'postponed'
//   status: 'scheduled' | 'cancelled' | 'completed' | 'rescheduled' | 'in-progress' | 'postponed';

//   // Updated locationType to match 'physical' instead of 'in-person'
//   locationType?: 'physical' | 'virtual' | 'hybrid';

//   // Added physicalLocation property
//   physicalLocation?: string;

//   virtualLink?: string;
//   participants?: Participant[];
//   minutes?: string;
//   actionItems?: any[];
// }
