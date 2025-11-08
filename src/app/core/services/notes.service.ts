import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { HttpErrorResponse } from '@angular/common/http';

export interface NoteFilterParams {
  date?: string;  // 'YYYY-MM-DD'
  week?: string;  // 'YYYY-MM-DD'
  month?: number; // 1–12
  year?: number;  // YYYY
}

@Injectable({ providedIn: 'root' })
export class NoteService extends BaseApiService {
  private endpoint = '/v1/notes';

  /**
   * 🔹 Fetch notes for a specific time period
   */
  getNotes(filterParams: NoteFilterParams): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}`, {
        params: this.createHttpParams(filterParams),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getNotes', error)
        )
      );
  }

  /**
   * 🔹 Fetch all note days for a given month (calendar summary)
   * Example: /api/v1/notes/calendar-summary?year=2025&month=11
   */
  getNotesForMonth(year: number, month: number): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/calendar-summary`, {
        params: this.createHttpParams({ year, month }),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getNotesForMonth', error)
        )
      );
  }

  /**
   * 🔹 Fetch one note by ID
   */
  getNoteById(id: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getNoteById', error)
        )
      );
  }

  /**
   * 🔹 Create a new note
   */
  createNote(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}${this.endpoint}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('createNote', error)
        )
      );
  }

  /**
   * 🔹 Update an existing note
   */
  updateNote(id: string, data: any): Observable<any> {
    return this.http
      .patch<any>(`${this.baseUrl}${this.endpoint}/${id}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('updateNote', error)
        )
      );
  }

  /**
   * 🔹 Delete a note
   */
  deleteNote(id: string): Observable<any> {
    return this.http
      .delete<any>(`${this.baseUrl}${this.endpoint}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('deleteNote', error)
        )
      );
  }

  /**
   * 🔹 Optional helper – fetch login summary from notifications
   */
  getLoginSummary(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/notifications/login-summary`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getLoginSummary', error)
        )
      );
  }
}