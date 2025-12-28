/* ---------------- ATTACHMENTS ---------------- */

export interface NoteAttachment {
  url: string;
  publicId: string;
  fileType: 'image' | 'video' | 'file';
}

/* ---------------- USER (POPULATED) ---------------- */

export interface NoteOwner {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
}

/* ---------------- NOTE ---------------- */

export interface Note {
  _id?: string;

  title?: string;
  content: string;
  tags?: string[];

  attachments: NoteAttachment[];

  // Relationships
  organizationId?: string;
  branchId?: string;
  owner?: NoteOwner;

  // Dates
  noteDate: string;      // 🔥 ACTUAL note date (calendar, filters)
  createdAt?: string;    // audit only
  updatedAt?: string;

  // Logic
  visibility?: 'public' | 'private' | 'team';
  importance?: 'low' | 'normal' | 'high';
  isPinned?: boolean;
}

/* ---------------- CALENDAR ---------------- */

export interface DailyNoteCount {
  day: number;
  count: number;
  hasHighPriority?: boolean;
}

/* ---------------- FILTERING ---------------- */

export interface NoteFilterParams {
  date?: string;   // YYYY-MM-DD
  week?: string;   // YYYY-MM-DD
  month?: number;  // 1–12
  year?: number;   // YYYY
  search?: string;

  relatedTo?: 'customer' | 'product' | 'invoice' | 'purchase' | 'other';
  relatedId?: string;
}