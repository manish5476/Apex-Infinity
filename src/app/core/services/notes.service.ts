import { Injectable, inject } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { 
  Note, 
  NoteAttachment, 
  NoteFilterParams, 
  DailyNoteCount,
  // You might need to add these types to your models:
  Meeting,
  NoteAnalytics,
  HeatMapData,
  CalendarEvent
} from '../models/note.types';

@Injectable({ providedIn: 'root' })
export class NoteService extends BaseApiService {
  private endpoint = '/v1/notes';

  // ==================== BASIC CRUD ====================

  getNotes(params: NoteFilterParams) {
    return this.get<{ data: { notes: Note[]; pagination: any } }>(
      this.endpoint,
      params,
      'getNotes'
    );
  }

  getNoteById(id: string) {
    return this.get<{ data: { note: Note } }>(
      `${this.endpoint}/${id}`,
      {},
      'getNoteById'
    );
  }

  createNote(data: Partial<Note>) {
    return this.post<{ data: { note: Note; meeting?: Meeting } }>(
      this.endpoint,
      data,
      'createNote'
    );
  }

  updateNote(id: string, data: Partial<Note>) {
    return this.patch<{ data: { note: Note } }>(
      `${this.endpoint}/${id}`,
      data,
      'updateNote'
    );
  }

  deleteNote(id: string) {
    return this.delete<void>(
      `${this.endpoint}/${id}`,
      null,
      'deleteNote'
    );
  }

  // ==================== MEDIA & UPLOAD ====================

  uploadMedia(files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('attachments', f));
    return this.post<{ data: NoteAttachment[] }>(
      `${this.endpoint}/upload`,
      formData,
      'uploadMedia'
    );
  }

  // ==================== SEARCH ====================

  searchNotes(query: string) {
    return this.get<{ data: { notes: Note[] } }>(
      `${this.endpoint}/search`,
      { q: query },
      'searchNotes'
    );
  }

  // ==================== CALENDAR & VIEWS ====================

  /** Get notes and meetings for the calendar grid */
  getCalendarView(start: string, end: string, view: 'month' | 'week' | 'day' = 'month') {
    return this.get<{ data: { events: CalendarEvent[] } }>(
      `${this.endpoint}/calendar/view`,
      { start, end, view },
      'getCalendarView'
    );
  }

  /** Get monthly frequency counts (heatmap/dots) */
  getDailyNoteCounts(year: number, month: number) {
    return this.get<{ data: DailyNoteCount[] }>(
      `${this.endpoint}/calendar/monthly`, // Corrected from backend route
      { year, month },
      'getDailyNoteCounts'
    );
  }

  // ==================== ANALYTICS & STATS ====================

  getHeatMapData(startDate?: string, endDate?: string, userId?: string) {
    return this.get<{ data: { heatMap: HeatMapData; stats: any } }>(
      `${this.endpoint}/analytics/heatmap`,
      { startDate, endDate, userId },
      'getHeatMapData'
    );
  }

  getNoteAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    return this.get<{ data: NoteAnalytics }>(
      `${this.endpoint}/analytics/summary`,
      { period },
      'getNoteAnalytics'
    );
  }

  getNoteStatistics() {
    return this.get<{ data: any }>(
      `${this.endpoint}/stats/summary`,
      {},
      'getNoteStatistics'
    );
  }

  getRecentActivity(limit: number = 20) {
    return this.get<{ data: { notes: Note[] } }>(
      `${this.endpoint}/activity/recent`,
      { limit },
      'getRecentActivity'
    );
  }

  exportNoteData(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string) {
    // Note: For CSV, you might need to handle Blob responses differently depending on your BaseApiService
    return this.get<any>(
      `${this.endpoint}/export/data`,
      { format, startDate, endDate },
      'exportNoteData'
    );
  }

  // ==================== SHARING & COLLABORATION ====================

  shareNote(id: string, userIds: string[], permission: 'viewer' | 'contributor' | 'admin' = 'viewer') {
    return this.post<{ data: { note: Note } }>(
      `${this.endpoint}/${id}/share`,
      { userIds, permission },
      'shareNote'
    );
  }

  getSharedNotesWithMe() {
    return this.get<{ data: { notes: Note[] } }>(
      `${this.endpoint}/shared/with-me`,
      {},
      'getSharedNotesWithMe'
    );
  }

  getNotesSharedByMe() {
    return this.get<{ data: { notes: Note[] } }>(
      `${this.endpoint}/shared/by-me`,
      {},
      'getNotesSharedByMe'
    );
  }

  updateSharePermissions(id: string, userId: string, permission: string) {
    return this.patch<void>(
      `${this.endpoint}/${id}/share/permissions`,
      { userId, permission },
      'updateSharePermissions'
    );
  }

  removeUserFromSharedNote(id: string, userId: string) {
    return this.delete<void>(
      `${this.endpoint}/${id}/share/${userId}`,
      null,
      'removeUserFromSharedNote'
    );
  }

  // ==================== TEMPLATES ====================

  createNoteTemplate(data: Partial<Note>) {
    return this.post<{ data: { template: Note } }>(
      `${this.endpoint}/templates`,
      data,
      'createNoteTemplate'
    );
  }

  getNoteTemplates() {
    return this.get<{ data: { templates: Note[] } }>(
      `${this.endpoint}/templates`,
      {},
      'getNoteTemplates'
    );
  }

  createFromTemplate(templateId: string, data: { title?: string; content?: string }) {
    return this.post<{ data: { note: Note } }>(
      `${this.endpoint}/templates/${templateId}/create`,
      data,
      'createFromTemplate'
    );
  }

  updateNoteTemplate(templateId: string, data: Partial<Note>) {
    return this.patch<{ data: { template: Note } }>(
      `${this.endpoint}/templates/${templateId}`,
      data,
      'updateNoteTemplate'
    );
  }

  deleteNoteTemplate(templateId: string) {
    return this.delete<void>(
      `${this.endpoint}/templates/${templateId}`,
      null,
      'deleteNoteTemplate'
    );
  }

  // ==================== BULK OPERATIONS ====================

  bulkUpdateNotes(noteIds: string[], updates: Partial<Note>) {
    return this.patch<{ message: string; data: any }>(
      `${this.endpoint}/bulk/update`,
      { noteIds, updates },
      'bulkUpdateNotes'
    );
  }

  bulkDeleteNotes(noteIds: string[]) {
    return this.delete<{ message: string; data: any }>(
      `${this.endpoint}/bulk/delete`,
      { body: { noteIds } }, // DELETE with body can be tricky, ensure BaseApiService supports it
      'bulkDeleteNotes'
    );
  }

  // ==================== SPECIAL ACTIONS ====================

  convertToTask(id: string, dueDate?: string, priority?: string) {
    return this.post<{ data: { note: Note } }>(
      `${this.endpoint}/${id}/convert-to-task`,
      { dueDate, priority },
      'convertToTask'
    );
  }

  togglePinNote(id: string) {
    return this.patch<{ data: { note: Note } }>(
      `${this.endpoint}/${id}/pin`,
      {},
      'togglePinNote'
    );
  }

  // ==================== MEETINGS ====================

  createMeeting(data: Partial<Meeting>) {
    return this.post<{ data: { meeting: Meeting; note: Note } }>(
      `${this.endpoint}/meetings`,
      data,
      'createMeeting'
    );
  }

  getUserMeetings(status?: string, startDate?: string, endDate?: string) {
    return this.get<{ data: { meetings: Meeting[] } }>(
      `${this.endpoint}/meetings`,
      { status, startDate, endDate },
      'getUserMeetings'
    );
  }

  updateMeetingStatus(meetingId: string, data: { status?: string; minutes?: string; actionItems?: any[] }) {
    return this.patch<{ data: { meeting: Meeting } }>(
      `${this.endpoint}/meetings/${meetingId}/status`,
      data,
      'updateMeetingStatus'
    );
  }

  rsvpToMeeting(meetingId: string, response: 'accepted' | 'declined' | 'tentative') {
    return this.post<{ message: string }>(
      `${this.endpoint}/meetings/${meetingId}/rsvp`,
      { response },
      'rsvpToMeeting'
    );
  }

  // ==================== ADMIN ====================

  getAllOrganizationNotes() {
    return this.get<{ data: { notes: Note[] } }>(
      `${this.endpoint}/organization/all`,
      {},
      'getAllOrganizationNotes'
    );
  }
}
// import { Injectable, inject } from '@angular/core';
// import { BaseApiService } from './base-api.service';
// import { DailyNoteCount, Note, NoteAttachment, NoteFilterParams } from '../models/note.types';

// @Injectable({ providedIn: 'root' })
// export class NoteService extends BaseApiService {
//   private endpoint = '/v1/notes';

//   /** Fetch notes based on filters (date, search, etc.) */
//   getNotes(params: NoteFilterParams) {
//     return this.get<{ data: { notes: Note[] } }>(
//       this.endpoint,
//       params,
//       'getNotes'
//     );
//   }

//   /** Fetch counts of notes per day for the calendar view */
//   getDailyNoteCounts(year: number, month: number) {
//     return this.get<{ data: DailyNoteCount[] }>(
//       `${this.endpoint}/calendar`,
//       { year, month },
//       'calendar'
//     );
//   }

//   getNoteById(id: string) {
//     return this.get<{ data: Note }>(
//       `${this.endpoint}/${id}`,
//       {},
//       'getNoteById'
//     );
//   }

//   createNote(data: Partial<Note>) {
//     return this.post<{ data: Note }>(
//       this.endpoint,
//       data,
//       'createNote'
//     );
//   }

//   updateNote(id: string, data: Partial<Note>) {
//     return this.patch<{ data: Note }>(
//       `${this.endpoint}/${id}`,
//       data,
//       'updateNote'
//     );
//   }

//   deleteNote(id: string) {
//     return this.delete<void>(
//       `${this.endpoint}/${id}`,
//       null,
//       'deleteNote'
//     );
//   }

//   /** Uploads files and returns NoteAttachment objects with URLs and IDs */
//   uploadMedia(files: File[]) {
//     const formData = new FormData();
//     files.forEach(f => formData.append('attachments', f));
//     return this.post<{ data: NoteAttachment[] }>(
//       `${this.endpoint}/upload`,
//       formData,
//       'uploadMedia'
//     );
//   }
// }

// // import { Injectable } from '@angular/core';
// // import { Observable } from 'rxjs';
// // import { BaseApiService } from './base-api.service';
// // import { DailyNoteCount, Note, NoteAttachment, NoteFilterParams } from '../models/note.types';
// // @Injectable({ providedIn: 'root' })
// // export class NoteService extends BaseApiService {
// //   private endpoint = '/v1/notes';

// //   getNotes(params: NoteFilterParams) {
// //     return this.get<{ data: { notes: Note[] } }>(
// //       this.endpoint,
// //       params,
// //       'getNotes'
// //     );
// //   }

// //   getDailyNoteCounts(year: number, month: number) {
// //     return this.get<{ data: DailyNoteCount[] }>(
// //       `${this.endpoint}/calendar`,
// //       { year, month },
// //       'calendar'
// //     );
// //   }

// //   getNoteById(id: string) {
// //     return this.get<{ data: Note }>(
// //       `${this.endpoint}/${id}`,
// //       {},
// //       'getNoteById'
// //     );
// //   }

// //   createNote(data: Partial<Note>) {
// //     return this.post<{ data: Note }>(
// //       this.endpoint,
// //       data,
// //       'createNote'
// //     );
// //   }

// //   updateNote(id: string, data: Partial<Note>) {
// //     return this.patch<{ data: Note }>(
// //       `${this.endpoint}/${id}`,
// //       data,
// //       'updateNote'
// //     );
// //   }

// //   deleteNote(id: string) {
// //     return this.delete<void>(
// //       `${this.endpoint}/${id}`,
// //       null,
// //       'deleteNote'
// //     );
// //   }

// //   uploadMedia(files: File[]) {
// //     const formData = new FormData();
// //     files.forEach(f => formData.append('attachments', f));
// //     return this.post<{ data: NoteAttachment[] }>(
// //       `${this.endpoint}/upload`,
// //       formData,
// //       'uploadMedia'
// //     );
// //   }
// // }
