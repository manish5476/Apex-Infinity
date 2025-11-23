// src/app/core/models/note.types.ts

export interface NoteAttachment {
  url: string;
  publicId: string; // Critical for deleting images later
  fileType: 'image' | 'video' | 'file';
}

export interface Note {
  _id?: string;
  title: string;
  content: string;
  tags: string[];
  
  // Updated to store objects, not just strings
  attachments: NoteAttachment[]; 
  
  // Relationships
  organizationId?: string;
  branchId?: string;
  owner?: string; // User ID
  
  // Logic
  isPinned: boolean;
  createdAt: string; // ISO Date String
  updatedAt: string;
}

// For the Timeline Dashboard
export interface DailyNoteCount {
  day: number;   // e.g., 5
  count: number; // e.g., 3 notes
}

// For Filtering
export interface NoteFilterParams {
  date?: string;  // 'YYYY-MM-DD'
  week?: string;  // 'YYYY-MM-DD'
  month?: number; // 1-12
  year?: number;  // YYYY
  search?: string;
}