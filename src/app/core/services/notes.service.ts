import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import {
  Note, Meeting, CalendarEvent, NoteStatistics, HeatMapData, NoteActivity
} from '../models/note.types';

@Injectable({ providedIn: 'root' })
export class NoteService extends BaseApiService {
  private endpoint = '/v1/notes';

  // ==========================================================================
  // 1. MEDIA & FILES
  // ==========================================================================

  uploadMedia(files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('attachments', f));
    return this.post<{ data: any[] }>(`${this.endpoint}/upload`, formData, 'uploadMedia');
  }

  // ==========================================================================
  // 2. SEARCH & GRAPH
  // ==========================================================================

  searchNotes(query: string) {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/search`, { q: query }, 'searchNotes');
  }

  getKnowledgeGraph() {
    return this.get<{ data: { nodes: any[]; links: any[] } }>(`${this.endpoint}/graph/network`, {}, 'getKnowledgeGraph');
  }

  // ==========================================================================
  // 3. ANALYTICS
  // ==========================================================================

  getHeatMapData(startDate?: string, endDate?: string, userId?: string) {
    return this.get<{ data: { heatMap: HeatMapData; stats: any } }>(
      `${this.endpoint}/analytics/heatmap`,
      { startDate, endDate, userId },
      'getHeatMapData'
    );
  }

  getNoteAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    return this.get<{ data: any }>(
      `${this.endpoint}/analytics/summary`,
      { period },
      'getNoteAnalytics'
    );
  }

  getNoteStatistics() {
    return this.get<{ data: NoteStatistics }>(`${this.endpoint}/stats/summary`, {}, 'getNoteStatistics');
  }

  getRecentActivity(limit: number = 20) {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/activity/recent`, { limit }, 'getRecentActivity');
  }

  // ==========================================================================
  // 4. CALENDAR
  // ==========================================================================

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

  // ==========================================================================
  // 5. EXPORT
  // ==========================================================================

  exportNoteData(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string) {
    return this.get<any>(`${this.endpoint}/export/data`, { format, startDate, endDate }, 'exportNoteData');
  }

  exportAllUserNotes(format: 'json' | 'csv' = 'json') {
    return this.get<any>(`${this.endpoint}/export/all`, { format }, 'exportAllUserNotes');
  }

  // ==========================================================================
  // 6. TEMPLATES
  // ==========================================================================

  createTemplate(data: any) {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/templates`, data, 'createTemplate');
  }

  getTemplate() {
    return this.get<{ data: { templates: Note[] } | Note[] }>(`${this.endpoint}/templates`, {}, 'getTemplates');
  }

  createFromTemplate(templateId: string) {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/templates/${templateId}/create`, {}, 'createFromTemplate');
  }

  updateTemplate(templateId: string, data: any) {
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/templates/${templateId}`, data, 'updateTemplate');
  }

  deleteTemplate(templateId: string) {
    return this.delete<void>(`${this.endpoint}/templates/${templateId}`, null, 'deleteTemplate');
  }

  // ==========================================================================
  // 7. BULK OPERATIONS
  // ==========================================================================

  bulkUpdateNotes(noteIds: string[], updates: Partial<Note>) {
    return this.patch<{ message: string; data: any }>(`${this.endpoint}/bulk/update`, { noteIds, updates }, 'bulkUpdateNotes');
  }

  bulkDeleteNotes(noteIds: string[]) {
    return this.delete<{ message: string; data: any }>(`${this.endpoint}/bulk/delete`, { body: { noteIds } }, 'bulkDeleteNotes');
  }

  // ==========================================================================
  // 8. TRASH
  // ==========================================================================

  getTrashBin() {
    return this.get<{ data: { notes: Note[]; pagination: any } }>(`${this.endpoint}/trash/bin`, {}, 'getTrashBin');
  }

  restoreFromTrash(id: string) {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/trash/${id}/restore`, {}, 'restoreFromTrash');
  }

  emptyTrash() {
    return this.delete<{ data: { notes: Note[]; pagination: any } }>(`${this.endpoint}/trash/empty`, {}, 'emptyTrash');
  }

  // ==========================================================================
  // 9. MEETINGS
  // ==========================================================================

  // --- Meeting CRUD ---
  createMeeting(data: any) {
    return this.post<{ data: { meeting: Meeting; note: Note } }>(`${this.endpoint}/meetings`, data, 'createMeeting');
  }

  getUserMeetings(status?: string, startDate?: string, endDate?: string) {
    return this.get<{ data: { meetings: Meeting[] } }>(`${this.endpoint}/meetings`, { status, startDate, endDate }, 'getUserMeetings');
  }

  getMeetingById(meetingId: string) {
    return this.get<{ data: { meeting: Meeting } }>(`${this.endpoint}/meetings/${meetingId}`, {}, 'getMeetingById');
  }

  updateMeeting(meetingId: string, data: any) {
    return this.patch<{ data: { meeting: Meeting } }>(`${this.endpoint}/meetings/${meetingId}`, data, 'updateMeeting');
  }

  cancelMeeting(meetingId: string) {
    return this.delete<{ message: string }>(`${this.endpoint}/meetings/${meetingId}/cancel`, null, 'cancelMeeting');
  }

  // --- Meeting RSVP & Attendance ---
  rsvpToMeeting(meetingId: string, response: 'accepted' | 'declined' | 'tentative') {
    return this.post<{ message: string }>(`${this.endpoint}/meetings/${meetingId}/rsvp`, { response }, 'rsvpToMeeting');
  }

  joinMeeting(meetingId: string) {
    return this.post<{ message: string }>(`${this.endpoint}/meetings/${meetingId}/join`, {}, 'joinMeeting');
  }

  leaveMeeting(meetingId: string) {
    return this.post<{ message: string }>(`${this.endpoint}/meetings/${meetingId}/leave`, {}, 'leaveMeeting');
  }

  // --- Participants ---
  addParticipants(meetingId: string, userIds: string[]) {
    return this.post<{ message: string }>(`${this.endpoint}/meetings/${meetingId}/participants`, { userIds }, 'addParticipants');
  }

  removeParticipant(meetingId: string, userId: string) {
    return this.delete<{ message: string }>(`${this.endpoint}/meetings/${meetingId}/participants/${userId}`, null, 'removeParticipant');
  }

  // --- Action Items ---
  addActionItem(meetingId: string, data: any) {
    return this.post<{ data: any }>(`${this.endpoint}/meetings/${meetingId}/action-items`, data, 'addActionItem');
  }

  convertActionItemToTask(meetingId: string, actionItemId: string) {
    return this.post<{ data: any }>(`${this.endpoint}/meetings/${meetingId}/action-items/${actionItemId}/convert`, {}, 'convertActionItemToTask');
  }

  // --- Polls ---
  createPoll(meetingId: string, data: any) {
    return this.post<{ data: any }>(`${this.endpoint}/meetings/${meetingId}/polls`, data, 'createPoll');
  }

  votePoll(meetingId: string, pollId: string, optionId: string) {
    return this.post<{ data: any }>(`${this.endpoint}/meetings/${meetingId}/polls/${pollId}/vote`, { optionId }, 'votePoll');
  }

  // --- Meeting Analytics ---
  getMeetingAnalytics() {
    return this.get<{ data: any }>(`${this.endpoint}/meetings/analytics/summary`, {}, 'getMeetingAnalytics');
  }

  // ==========================================================================
  // 10. SHARED LISTS
  // ==========================================================================

  getSharedNotesWithMe() {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/shared/with-me`, {}, 'getSharedNotesWithMe');
  }

  getNotesSharedByMe() {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/shared/by-me`, {}, 'getNotesSharedByMe');
  }

  // ==========================================================================
  // 11. ADMIN
  // ==========================================================================

  getAllOrganizationNotes(data: any) {
    return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/organization/all`, data, 'getAllOrganizationNotes');
  }

  // ==========================================================================
  // 12. CORE CRUD
  // ==========================================================================

  getNotes(params: any) {
    return this.get<{ data: { notes: Note[]; pagination: any } }>(this.endpoint, params, 'getNotes');
  }

  createNote(data: Partial<Note>) {
    return this.post<{ data: { note: Note; meeting?: Meeting } }>(this.endpoint, data, 'createNote');
  }

  // ==========================================================================
  // 13. PARAM ROUTES (/:id)
  // ==========================================================================

  // --- Comments ---
  getComments(id: string) {
    return this.get<{ data: any[] }>(`${this.endpoint}/${id}/comments`, {}, 'getComments');
  }

  addComment(id: string, content: string) {
    return this.post<{ data: any }>(`${this.endpoint}/${id}/comments`, { content }, 'addComment');
  }

  deleteComment(id: string, commentId: string) {
    return this.delete<void>(`${this.endpoint}/${id}/comments/${commentId}`, null, 'deleteComment');
  }

  reactToComment(id: string, commentId: string, reaction: string) {
    return this.post<{ data: any }>(`${this.endpoint}/${id}/comments/${commentId}/react`, { reaction }, 'reactToComment');
  }

  // --- Assignment ---
  assignUsers(id: string, userIds: string[]) {
    return this.post<{ data: any }>(`${this.endpoint}/${id}/assign`, { userIds }, 'assignUsers');
  }

  updateAssignmentStatus(id: string, status: string) {
    return this.patch<{ data: any }>(`${this.endpoint}/${id}/assignment-status`, { status }, 'updateAssignmentStatus');
  }

  // --- Checklist / Subtasks ---
  addChecklistItem(noteId: string, title: string) {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/${noteId}/checklist`, { title }, 'addChecklistItem');
  }

  toggleChecklistItem(noteId: string, subtaskId: string, completed: boolean) {
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${noteId}/checklist/${subtaskId}`, { completed }, 'toggleChecklistItem');
  }

  removeChecklistItem(noteId: string, subtaskId: string) {
    return this.delete<{ data: { note: Note } }>(`${this.endpoint}/${noteId}/checklist/${subtaskId}`, null, 'removeChecklistItem');
  }

  // --- Time Tracking ---
  logTime(id: string, durationMinutes: number, description?: string) {
    return this.post<{ data: any }>(`${this.endpoint}/${id}/time-log`, { durationMinutes, description }, 'logTime');
  }

  // --- Sharing & Permissions ---
  shareNote(id: string, userIds: string[], permission: 'viewer' | 'contributor' | 'admin' = 'viewer') {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/${id}/share`, { userIds, permission }, 'shareNote');
  }

  updateSharePermissions(id: string, userId: string, permission: string) {
    return this.patch<void>(`${this.endpoint}/${id}/share/permissions`, { userId, permission }, 'updateSharePermissions');
  }

  removeUserFromSharedNote(id: string, userId: string) {
    return this.delete<void>(`${this.endpoint}/${id}/share/${userId}`, null, 'removeUserFromSharedNote');
  }

  // --- Utility Actions ---
  linkNote(sourceNoteId: string, targetNoteId: string) {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/${sourceNoteId}/link`, { targetNoteId }, 'linkNote');
  }

  unlinkNote(sourceNoteId: string, targetNoteId: string) {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/${sourceNoteId}/unlink`, { targetNoteId }, 'unlinkNote');
  }

  convertToTask(id: string, dueDate?: string, priority?: string) {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/${id}/convert-to-task`, { dueDate, priority }, 'convertToTask');
  }

  duplicateNote(id: string) {
    return this.post<{ data: { note: Note } }>(`${this.endpoint}/${id}/duplicate`, {}, 'duplicateNote');
  }

  togglePinNote(id: string) {
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}/pin`, {}, 'togglePinNote');
  }

  archiveNote(id: string) {
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}/archive`, {}, 'archiveNote');
  }

  restoreNote(id: string) {
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}/restore`, {}, 'restoreNote');
  }

  // --- History & Hard Delete ---
  getNoteHistory(id: string) {
    return this.get<{ data: { activityLog: NoteActivity[] } }>(`${this.endpoint}/${id}/history`, {}, 'getNoteHistory');
  }

  hardDeleteNote(id: string) {
    return this.delete<void>(`${this.endpoint}/${id}/permanent`, null, 'hardDeleteNote');
  }

  // --- Standard CRUD ---
  getNoteById(id: string) {
    return this.get<{ data: { note: Note } }>(`${this.endpoint}/${id}`, {}, 'getNoteById');
  }

  updateNote(id: string, data: any) {
    return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}`, data, 'updateNote');
  }

  deleteNote(id: string) {
    return this.delete<void>(`${this.endpoint}/${id}`, null, 'deleteNote');
  }
}

// import { Injectable } from '@angular/core';
// import { BaseApiService } from './base-api.service';
// import {
//   Note, Meeting, CalendarEvent, NoteStatistics, HeatMapData, ActivityLog, Subtask
// } from '../models/note.types';

// @Injectable({ providedIn: 'root' })
// export class NoteService extends BaseApiService {
//   private endpoint = '/v1/notes';

//   // ==========================================================================
//   // 1. GLOBAL & STATIC MODULES
//   // ==========================================================================

//   // --- MEDIA UPLOAD ---
//   uploadMedia(files: File[]) {
//     const formData = new FormData();
//     files.forEach((f) => formData.append('attachments', f));
//     return this.post<{ data: any[] }>(`${this.endpoint}/upload`, formData, 'uploadMedia');
//   }

//   // --- SEARCH ---
//   searchNotes(query: string) {
//     return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/search`, { q: query }, 'searchNotes');
//   }

//   // --- VISUALIZATION & ANALYTICS ---

//   // Graph Network (Nodes/Links)
//   getKnowledgeGraph() {
//     return this.get<{ data: { nodes: any[]; links: any[] } }>(`${this.endpoint}/graph/network`, {}, 'getKnowledgeGraph');
//   }

//   // Heatmap Data
//   getHeatMapData(startDate?: string, endDate?: string, userId?: string) {
//     return this.get<{ data: { heatMap: HeatMapData; stats: any } }>(
//       `${this.endpoint}/analytics/heatmap`,
//       { startDate, endDate, userId },
//       'getHeatMapData'
//     );
//   }

//   // General Analytics Summary
//   getNoteAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
//     return this.get<{ data: any }>(
//       `${this.endpoint}/analytics/summary`,
//       { period },
//       'getNoteAnalytics'
//     );
//   }

//   // --- CALENDAR MODULE ---

//   getCalendarView(start: string, end: string, view: 'month' | 'week' | 'day' = 'month') {
//     return this.get<{ data: { events: CalendarEvent[] } }>(
//       `${this.endpoint}/calendar/view`,
//       { start, end, view },
//       'getCalendarView'
//     );
//   }

//   getNotesForMonth(year: number, month: number) {
//     return this.get<{ data: Array<{ date: string; count: number; notes: string[] }> }>(
//       `${this.endpoint}/calendar/monthly`,
//       { year, month },
//       'getNotesForMonth'
//     );
//   }

//   // --- STATISTICS & ACTIVITY ---

//   getNoteStatistics() {
//     return this.get<{ data: NoteStatistics }>(`${this.endpoint}/stats/summary`, {}, 'getNoteStatistics');
//   }

//   getRecentActivity(limit: number = 20) {
//     return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/activity/recent`, { limit }, 'getRecentActivity');
//   }

//   // --- EXPORT MODULE ---

//   exportNoteData(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string) {
//     return this.get<any>(`${this.endpoint}/export/data`, { format, startDate, endDate }, 'exportNoteData');
//   }

//   exportAllUserNotes(format: 'json' | 'csv' = 'json') {
//     return this.get<any>(`${this.endpoint}/export/all`, { format }, 'exportAllUserNotes');
//   }

//   // --- TEMPLATES MODULE ---

//   createTemplate(data: any) {
//     return this.post<{ data: { note: Note } }>(`${this.endpoint}/templates`, data, 'createTemplate');
//   }

//   getTemplate() {
//     // Returns list of templates
//     return this.get<{ data: { templates: Note[] } | Note[] }>(`${this.endpoint}/templates`, {}, 'getTemplates');
//   }

//   createFromTemplate(templateId: string) {
//     return this.post<{ data: { note: Note } }>(
//       `${this.endpoint}/templates/${templateId}/create`,
//       {},
//       'createFromTemplate'
//     );
//   }

//   updateTemplate(templateId: string, data: any) {
//     return this.patch<{ data: { note: Note } }>(
//       `${this.endpoint}/templates/${templateId}`,
//       data,
//       'updateTemplate'
//     );
//   }

//   deleteTemplate(templateId: string) {
//     return this.delete<void>(
//       `${this.endpoint}/templates/${templateId}`,
//       null,
//       'deleteTemplate'
//     );
//   }

//   // --- BULK OPERATIONS ---

//   bulkUpdateNotes(noteIds: string[], updates: Partial<Note>) {
//     return this.patch<{ message: string; data: any }>(
//       `${this.endpoint}/bulk/update`,
//       { noteIds, updates },
//       'bulkUpdateNotes'
//     );
//   }

//   bulkDeleteNotes(noteIds: string[]) {
//     return this.delete<{ message: string; data: any }>(
//       `${this.endpoint}/bulk/delete`,
//       { body: { noteIds } }, // Pass body for DELETE request
//       'bulkDeleteNotes'
//     );
//   }

//   // --- TRASH MANAGEMENT ---

//   getTrashBin() {
//     return this.get<{ data: { notes: Note[]; pagination: any } }>(`${this.endpoint}/trash/bin`, {}, 'getTrashBin');
//   }

//   restoreFromTrash(id: string) {
//     return this.post<{ data: { note: Note } }>(`${this.endpoint}/trash/${id}/restore`, {}, 'restoreFromTrash');
//   }

//   emptyTrash() {
//     return this.delete<{ data: { notes: Note[]; pagination: any } }>(`${this.endpoint}/trash/empty`, {}, 'emptyTrash');
//   }

//   // --- MEETING MODULE ---

//   createMeeting(data: any) {
//     return this.post<{ data: { meeting: Meeting; note: Note } }>(`${this.endpoint}/meetings`, data, 'createMeeting');
//   }

//   getUserMeetings(status?: string, startDate?: string, endDate?: string) {
//     return this.get<{ data: { meetings: Meeting[] } }>(
//       `${this.endpoint}/meetings`,
//       { status, startDate, endDate },
//       'getUserMeetings'
//     );
//   }

//   updateMeetingStatus(meetingId: string, data: { status?: string; minutes?: string; actionItems?: any[] }) {
//     return this.patch<{ data: { meeting: Meeting } }>(
//       `${this.endpoint}/meetings/${meetingId}/status`,
//       data,
//       'updateMeetingStatus'
//     );
//   }

//   rsvpToMeeting(meetingId: string, response: 'accepted' | 'declined' | 'tentative') {
//     return this.post<{ message: string }>(
//       `${this.endpoint}/meetings/${meetingId}/rsvp`,
//       { response },
//       'rsvpToMeeting'
//     );
//   }

//   // --- SHARED LISTS ---

//   getSharedNotesWithMe() {
//     return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/shared/with-me`, {}, 'getSharedNotesWithMe');
//   }

//   getNotesSharedByMe() {
//     return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/shared/by-me`, {}, 'getNotesSharedByMe');
//   }

//   // --- ADMIN ---

//   getAllOrganizationNotes(data:any) {
//     return this.get<{ data: { notes: Note[] } }>(`${this.endpoint}/organization/all`, data,
//       'getAllOrganizationNotes'
//     );
//   }

//   // ==========================================================================
//   // 2. CORE CRUD & 3. ID-DEPENDENT ROUTES
//   // ==========================================================================

//   getNotes(params: any) {
//     return this.get<{ data: { notes: Note[]; pagination: any } }>(this.endpoint, params, 'getNotes');
//   }

//   createNote(data: Partial<Note>) {
//     return this.post<{ data: { note: Note; meeting?: Meeting } }>(this.endpoint, data, 'createNote');
//   }

//   getNoteById(id: string) {
//     return this.get<{ data: { note: Note } }>(`${this.endpoint}/${id}`, {}, 'getNoteById');
//   }

//   updateNote(id: string, data: any) {
//     return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}`, data, 'updateNote');
//   }

//   // Soft delete (Move to Trash)
//   deleteNote(id: string) {
//     return this.delete<void>(`${this.endpoint}/${id}`, null, 'deleteNote');
//   }

//   // Permanent Delete
//   hardDeleteNote(id: string) {
//     return this.delete<void>(`${this.endpoint}/${id}/permanent`, null, 'hardDeleteNote');
//   }

//   // --- SUBTASKS ---

//   addSubtask(noteId: string, title: string) {
//     return this.post<{ data: { note: Note } }>(
//       `${this.endpoint}/${noteId}/subtasks`,
//       { title },
//       'addSubtask'
//     );
//   }

//   toggleSubtask(noteId: string, subtaskId: string, completed: boolean) {
//     return this.patch<{ data: { note: Note } }>(
//       `${this.endpoint}/${noteId}/subtasks/${subtaskId}`,
//       { completed },
//       'toggleSubtask'
//     );
//   }

//   removeSubtask(noteId: string, subtaskId: string) {
//     return this.delete<{ data: { note: Note } }>(
//       `${this.endpoint}/${noteId}/subtasks/${subtaskId}`,
//       null,
//       'removeSubtask'
//     );
//   }

//   // --- SHARING & PERMISSIONS ---

//   shareNote(id: string, userIds: string[], permission: 'viewer' | 'contributor' | 'admin' = 'viewer') {
//     return this.post<{ data: { note: Note } }>(
//       `${this.endpoint}/${id}/share`,
//       { userIds, permission },
//       'shareNote'
//     );
//   }

//   updateSharePermissions(id: string, userId: string, permission: string) {
//     return this.patch<void>(
//       `${this.endpoint}/${id}/share/permissions`,
//       { userId, permission },
//       'updateSharePermissions'
//     );
//   }

//   removeUserFromSharedNote(id: string, userId: string) {
//     return this.delete<void>(
//       `${this.endpoint}/${id}/share/${userId}`,
//       null,
//       'removeUserFromSharedNote'
//     );
//   }

//   // --- UTILITY ACTIONS ---

//   linkNote(sourceNoteId: string, targetNoteId: string) {
//     return this.post<{ data: { note: Note } }>(
//       `${this.endpoint}/${sourceNoteId}/link`,
//       { targetNoteId },
//       'linkNote'
//     );
//   }

//   unlinkNote(sourceNoteId: string, targetNoteId: string) {
//     // Note: Assuming API supports delete for unlinking, otherwise this might need to use a different endpoint
//     // based on typical REST patterns.
//     return this.delete<{ data: { note: Note } }>(
//       `${this.endpoint}/${sourceNoteId}/link/${targetNoteId}`,
//       null,
//       'unlinkNote'
//     );
//   }

//   convertToTask(id: string, dueDate?: string, priority?: string) {
//     return this.post<{ data: { note: Note } }>(
//       `${this.endpoint}/${id}/convert-to-task`,
//       { dueDate, priority },
//       'convertToTask'
//     );
//   }

//   duplicateNote(id: string) {
//     return this.post<{ data: { note: Note } }>(`${this.endpoint}/${id}/duplicate`, {}, 'duplicateNote');
//   }

//   togglePinNote(id: string) {
//     return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}/pin`, {}, 'togglePinNote');
//   }

//   archiveNote(id: string) {
//     return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}/archive`, {}, 'archiveNote');
//   }

//   restoreNote(id: string) {
//     return this.patch<{ data: { note: Note } }>(`${this.endpoint}/${id}/restore`, {}, 'restoreNote');
//   }

//   // --- INFO & HISTORY ---

//   getNoteHistory(id: string) {
//     return this.get<{ data: { activityLog: ActivityLog[] } }>(`${this.endpoint}/${id}/history`, {}, 'getNoteHistory');
//   }
// }