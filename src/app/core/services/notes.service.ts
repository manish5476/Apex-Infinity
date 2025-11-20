import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface NoteFilterParams {
  date?: string;  // 'YYYY-MM-DD'
  week?: string;  // 'YYYY-MM-DD'
  month?: number; // 1–12
  year?: number;  // YYYY
}

@Injectable({ providedIn: 'root' })
export class NoteService extends BaseApiService {
  private endpoint = '/v1/notes';

  getNotes(filterParams: NoteFilterParams): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getNotes');
  }

  getNotesForMonth(year: number, month: number): Observable<any> {
    return this.get(`${this.endpoint}/calendar-summary`, { year, month }, 'getNotesForMonth');
  }

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
// import { catchError } from 'rxjs/operators';
// import { BaseApiService } from './base-api.service';
// import { HttpErrorResponse } from '@angular/common/http';

// export interface NoteFilterParams {
//   date?: string;  // 'YYYY-MM-DD'
//   week?: string;  // 'YYYY-MM-DD'
//   month?: number; // 1–12
//   year?: number;  // YYYY
// }

// @Injectable({ providedIn: 'root' })
// export class NoteService extends BaseApiService {
//   private endpoint = '/v1/notes';

//   /**
//    * 🔹 Fetch notes for a specific time period
//    */
//   getNotes(filterParams: NoteFilterParams): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}`, {
//         params: this.createHttpParams(filterParams),
//       })
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'getNotes')
//         )
//       );
//   }

//   /**
//    * 🔹 Fetch all note days for a given month (calendar summary)
//    * Example: /api/v1/notes/calendar-summary?year=2025&month=11
//    */
//   getNotesForMonth(year: number, month: number): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}/calendar-summary`, {
//         params: this.createHttpParams({ year, month }),
//       })
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'getNotesForMonth')
//         )
//       );
//   }

//   /**
//    * 🔹 Fetch one note by ID
//    */
//   getNoteById(id: string): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'getNoteById')
//         )
//       );
//   }

//   /**
//    * 🔹 Create a new note
//    */
//   createNote(data: any): Observable<any> {
//     return this.http
//       .post<any>(`${this.baseUrl}${this.endpoint}`, data)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'createNote')
//         )
//       );
//   }

//   /**
//    * 🔹 Update an existing note
//    */
//   updateNote(id: string, data: any): Observable<any> {
//     return this.http
//       .patch<any>(`${this.baseUrl}${this.endpoint}/${id}`, data)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'updateNote')
//         )
//       );
//   }

//   /**
//    * 🔹 Delete a note
//    */
//   deleteNote(id: string): Observable<any> {
//     return this.http
//       .delete<any>(`${this.baseUrl}${this.endpoint}/${id}`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'deleteNote')
//         )
//       );
//   }

//   /**
//    * 🔹 Optional helper – fetch login summary from notifications
//    */
//   getLoginSummary(): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}/v1/notifications/login-summary`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'getLoginSummary')
//         )
//       );
//   }
// }