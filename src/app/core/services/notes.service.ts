import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import {
  Note,
  Meeting,
  CalendarEvent,
  NoteStatistics,
  HeatMapData,
  ActivityLog, // Ensure this is imported
  Subtask      // Ensure this is imported
} from '../models/note.types';

@Injectable({ providedIn: 'root' })
export class NoteService extends BaseApiService {
  private endpoint = '/v1/notes';

  // ==================== BASIC CRUD ====================

  getNotes(params: any) {
    return this.get<{ data: { notes: Note[]; pagination: any } }>(this.endpoint, params, 'getNotes');
  }

  getTrashBin() {
    return this.get<{ data: { notes: Note[]; pagination: any } }>(`${this.endpoint}/trash/bin`, {}, 'getNotes');
  }

  emptyTrash() {
    return this.delete<{ data: { notes: Note[]; pagination: any } }>(`${this.endpoint}/trash/empty`, {}, 'getNotes');
  }

  getNoteById(id: string) {
    return this.get<{ data: { note: Note } }>(`${this.endpoint}/${id}`, {}, 'getNoteById');
  }

  createNote(data: Partial<Note>) {
    return this.post<{ data: { note: Note; meeting?: Meeting } }>(this.endpoint, data, 'createNote');
  }

  createTemplate(data: any) {
    return this.post<{ data: { note: Note; meeting?: Meeting } }>(`${this.endpoint}/templates`, data, 'createNote');
  }


  restoreFromTrash(id: string) {
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/trash/${id}/restore`, {}, 'updateNote');
  }

  updateNote(id: string, data: any) {
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}`, data, 'updateNote');
  }

  // This is your SOFT delete (Move to Trash)
  deleteNote(id: string) {
    return this.delete<void>(`${this.endpoint}/${id}`, null, 'deleteNote');
  }

  // -------------------------------------------- pending 
  getTemplate() {
    return this.get<{ data: { note: Note; meeting?: Meeting } }>(`${this.endpoint}/templates`, {}, 'createNote');
  }

  // ==================== EXPORT ====================

  exportNoteData(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string) {
    return this.get<any>(`${this.endpoint}/export/data`, { format, startDate, endDate }, 'exportNoteData');
  }

  exportAllUserNotes(format: 'json' | 'csv' = 'json') {
    return this.get<any>(`${this.endpoint}/export/all`, { format }, 'exportAllUserNotes');
  }

  // ==================== MISSING: LINKING NOTES ====================
  linkNote(sourceNoteId: string, targetNoteId: string) {
    return this.post<{ data: { note: Note } }>(
      `${this.endpoint}/${sourceNoteId}/link`,
      { targetNoteId },
      'linkNote'
    );
  }
  unlinkNote(sourceNoteId: string, targetNoteId: string) {
    return this.delete<{ data: { note: Note } }>(
      `${this.endpoint}/${sourceNoteId}/link/${targetNoteId}`,
      null,
      'unlinkNote'
    );
  }

  // ==================== SHARING ====================

  shareNote(id: string, userIds: string[], permission: 'viewer' | 'contributor' | 'admin' = 'viewer') {
    console.log(id);
    return this.post<{ data: { note: Note } }>(
      `${this.endpoint}/${id}/share`,
      { userIds, permission },
      'shareNote'
    );
  }

  // ==================== MISSING: HARD DELETE & HISTORY ====================

  // FIXED: Added this method to fix "Property 'hardDeleteNote' does not exist"
  hardDeleteNote(id: string) {
    return this.delete<void>(
      `${this.endpoint}/${id}/permanent`,
      null,
      'hardDeleteNote'
    );
  }

  // FIXED: Added specific history fetch for the details panel
  getNoteHistory(id: string) {
    return this.get<{ data: { activityLog: ActivityLog[] } }>(
      `${this.endpoint}/${id}/history`,
      {},
      'getNoteHistory'
    );
  }

  // ==================== MISSING: SUBTASKS ====================
  // FIXED: These add the subtask functionality required by your UI

  addSubtask(noteId: string, title: string) {
    return this.post<{ data: { note: Note } }>(
      `${this.endpoint}/${noteId}/subtasks`,
      { title },
      'addSubtask'
    );
  }

  toggleSubtask(noteId: string, subtaskId: string, completed: boolean) {
    return this.patch<{ data: { note: Note } }>(
      `${this.endpoint}/${noteId}/subtasks/${subtaskId}`,
      { completed },
      'toggleSubtask'
    );
  }

  removeSubtask(noteId: string, subtaskId: string) {
    return this.delete<{ data: { note: Note } }>(
      `${this.endpoint}/${noteId}/subtasks/${subtaskId}`,
      null,
      'removeSubtask'
    );
  }


  // ==================== MEDIA UPLOAD ====================

  uploadMedia(files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('attachments', f));
    return this.post<{ data: any[] }>(`${this.endpoint}/upload`, formData, 'uploadMedia');
  }

  // ==================== ARCHIVE & RESTORE ====================

  archiveNote(id: string) {
    return this.patch<{ data: { note: Note } }>(
      `${this.endpoint}/${id}/archive`,
      {},
      'archiveNote'
    );
  }

  restoreNote(id: string) {
    return this.patch<{ data: { note: Note } }>(
      `${this.endpoint}/${id}/restore`,
      {},
      'restoreNote'
    );
  }

  // ==================== DUPLICATION ====================

  duplicateNote(id: string) {
    return this.post<{ data: { note: Note } }>(
      `${this.endpoint}/${id}/duplicate`,
      {},
      'duplicateNote'
    );
  }

  // ==================== SEARCH & CALENDAR ====================
  searchNotes(query: string) {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/search`, { q: query }, 'searchNotes');
  }

  getCalendarView(start: string, end: string, view: 'month' | 'week' | 'day' = 'month') {
    return this.get<{ data: { events: CalendarEvent[] } }>(
      `${this.endpoint}/calendar/view`,
      { start, end, view },
      'getCalendarView'
    );
  }

  getNotesForMonth(year: number, month: number) {
    return this.get<{ data: Array<{ date: string; count: number; notes: string[] }> }>(
      `${this.endpoint}/calendar/monthly`,
      { year, month },
      'getNotesForMonth'
    );
  }

  // ==================== ANALYTICS ====================

  getHeatMapData(startDate?: string, endDate?: string, userId?: string) {
    return this.get<{ data: { heatMap: HeatMapData; stats: any } }>(
      `${this.endpoint}/analytics/heatmap`,
      { startDate, endDate, userId },
      'getHeatMapData'
    );
  }

  getNoteStatistics() {
    return this.get<{ data: NoteStatistics }>(`${this.endpoint}/stats/summary`, {}, 'getNoteStatistics');
  }

  updateSharePermissions(id: string, userId: string, permission: string) {
    return this.patch<void>(`${this.endpoint}/${id}/share/permissions`, { userId, permission }, 'updateSharePermissions');
  }

  removeUserFromSharedNote(id: string, userId: string) {
    return this.delete<void>(`${this.endpoint}/${id}/share/${userId}`, null, 'removeUserFromSharedNote');
  }

  getNotesSharedByMe() {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/shared/by-me`, {}, 'getNotesSharedByMe');
  }

  getSharedNotesWithMe() {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/shared/with-me`, {}, 'getSharedNotesWithMe');
  }

  getRecentActivity(limit: number = 20) {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/activity/recent`, { limit }, 'getRecentActivity');
  } 

  // --------
// bad
  // getNoteAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  //   return this.get<{ data: any }>(`${this.endpoint}/analytics/summary`, { period }, 'getNoteAnalytics');
  // }



  // ==================== BULK OPERATIONS ==================== notimplemented

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
      { body: { noteIds } },
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
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}/pin`, {}, 'togglePinNote');
  }

  // ==================== MEETINGS ====================

  createMeeting(data: any) {
    return this.post<{ data: { meeting: Meeting; note: Note } }>(`${this.endpoint}/meetings`, data, 'createMeeting');
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
}