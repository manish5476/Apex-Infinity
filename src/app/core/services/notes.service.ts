import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Note, NoteFilterParams, DailyNoteCount, NoteAttachment } from '../models/note.types';

@Injectable({ providedIn: 'root' })
export class NoteService extends BaseApiService {
  // Only define the sub-path here. BaseApiService handles environment.apiUrl
  private endpoint = '/v1/notes';

  // --- 1. GET FILTERED NOTES ---
  getNotes(filterParams: NoteFilterParams): Observable<{ data: { notes: Note[] } }> {
    // Your BaseApiService automatically converts filterParams object to HttpParams
    return this.get(this.endpoint, filterParams, 'getNotes');
  }

  // --- 2. GET TIMELINE STATS ---
  // Returns the array of { day: 5, count: 2 } for the calendar strip
  getDailyNoteCounts(year: number, month: number): Observable<{ data: DailyNoteCount[] }> {
    return this.get(`${this.endpoint}/daily-count`, { year, month }, 'getDailyNoteCounts');
  }

  // --- 3. GET SINGLE NOTE ---
  getNoteById(id: string): Observable<{ data: { note: Note } }> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getNoteById');
  }

  // --- 4. CREATE NOTE (Step 2 of flow) ---
  createNote(data: Partial<Note>): Observable<{ data: { note: Note } }> {
    return this.post(this.endpoint, data, 'createNote');
  }

  // --- 5. UPDATE NOTE ---
  updateNote(id: string, data: Partial<Note>): Observable<{ data: { note: Note } }> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateNote');
  }

  // --- 6. DELETE NOTE ---
  deleteNote(id: string): Observable<void> {
    return this.delete(`${this.endpoint}/${id}`, 'deleteNote');
  }

  // --- 7. UPLOAD MEDIA (Step 1 of flow) ---
  // This bypasses the generic 'post' JSON behavior because we need FormData
  uploadMedia(files: File[]): Observable<{ data: NoteAttachment[] }> {
    const formData = new FormData();
    files.forEach(file => {
      // 'files' must match the backend multer.array('files')
      formData.append('files', file);
    });

    return this.post(`${this.endpoint}/upload-media`, formData, 'uploadMedia');
  }}