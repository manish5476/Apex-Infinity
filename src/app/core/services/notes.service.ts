import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface NoteFilterParams {
  date?: string;  // 'YYYY-MM-DD'
  week?: string;  // 'YYYY-MM-DD'
  month?: number; // 1–12
  year?: number;  // YYYY
}

// Interface for the daily note count response
export interface DailyNoteCount {
    day: number;
    count: number;
}

@Injectable({ providedIn: 'root' })
export class NoteService extends BaseApiService {
  private endpoint = '/v1/notes';

  getNotes(filterParams: NoteFilterParams): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getNotes');
  }

  // 🆕 NEW API FOR THE VISUAL TIMELINE
  getDailyNoteCounts(year: number, month: number): Observable<DailyNoteCount[]> {
    // Assuming a dedicated endpoint for performance, similar to the calendar-summary
    return this.get(`${this.endpoint}/daily-count`, { year, month }, 'getDailyNoteCounts');
  }

  getNotesForMonth(year: number, month: number): Observable<any> {
    return this.get(`${this.endpoint}/calendar-summary`, { year, month }, 'getNotesForMonth');
  }
  // ... rest of the CRUD methods (getNoteById, createNote, etc.)
  getNoteById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getNoteById');
  }
  createNote(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createNote');
  }
  updateNote(id: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateNote');
  }
  deleteNote(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, 'deleteNote');
  }
  getLoginSummary(): Observable<any> {
    return this.get('/v1/notifications/login-summary', {}, 'getLoginSummary');
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from './base-api.service';

// export interface NoteFilterParams {
//   date?: string;  // 'YYYY-MM-DD'
//   week?: string;  // 'YYYY-MM-DD'
//   month?: number; // 1–12
//   year?: number;  // YYYY
// }

// @Injectable({ providedIn: 'root' })
// export class NoteService extends BaseApiService {
//   private endpoint = '/v1/notes';

//   getNotes(filterParams: NoteFilterParams): Observable<any> {
//     return this.get(this.endpoint, filterParams, 'getNotes');
//   }

//   getNotesForMonth(year: number, month: number): Observable<any> {
//     return this.get(`${this.endpoint}/calendar-summary`, { year, month }, 'getNotesForMonth');
//   }

//   getNoteById(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}`, {}, 'getNoteById');
//   }

//   createNote(data: any): Observable<any> {
//     return this.post(this.endpoint, data, 'createNote');
//   }

//   updateNote(id: string, data: any): Observable<any> {
//     return this.patch(`${this.endpoint}/${id}`, data, 'updateNote');
//   }

//   deleteNote(id: string): Observable<any> {
//     return this.delete(`${this.endpoint}/${id}`, 'deleteNote');
//   }

//   getLoginSummary(): Observable<any> {
//     return this.get('/v1/notifications/login-summary', {}, 'getLoginSummary');
//   }
// }
