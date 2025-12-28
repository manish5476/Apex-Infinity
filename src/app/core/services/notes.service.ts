import { Injectable, inject } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { DailyNoteCount, Note, NoteAttachment, NoteFilterParams } from '../models/note.types';

@Injectable({ providedIn: 'root' })
export class NoteService extends BaseApiService {
  private endpoint = '/v1/notes';

  /** Fetch notes based on filters (date, search, etc.) */
  getNotes(params: NoteFilterParams) {
    return this.get<{ data: { notes: Note[] } }>(
      this.endpoint,
      params,
      'getNotes'
    );
  }

  /** Fetch counts of notes per day for the calendar view */
  getDailyNoteCounts(year: number, month: number) {
    return this.get<{ data: DailyNoteCount[] }>(
      `${this.endpoint}/calendar`,
      { year, month },
      'calendar'
    );
  }

  getNoteById(id: string) {
    return this.get<{ data: Note }>(
      `${this.endpoint}/${id}`,
      {},
      'getNoteById'
    );
  }

  createNote(data: Partial<Note>) {
    return this.post<{ data: Note }>(
      this.endpoint,
      data,
      'createNote'
    );
  }

  updateNote(id: string, data: Partial<Note>) {
    return this.patch<{ data: Note }>(
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

  /** Uploads files and returns NoteAttachment objects with URLs and IDs */
  uploadMedia(files: File[]) {
    const formData = new FormData();
    files.forEach(f => formData.append('attachments', f));
    return this.post<{ data: NoteAttachment[] }>(
      `${this.endpoint}/upload`,
      formData,
      'uploadMedia'
    );
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from './base-api.service';
// import { DailyNoteCount, Note, NoteAttachment, NoteFilterParams } from '../models/note.types';
// @Injectable({ providedIn: 'root' })
// export class NoteService extends BaseApiService {
//   private endpoint = '/v1/notes';

//   getNotes(params: NoteFilterParams) {
//     return this.get<{ data: { notes: Note[] } }>(
//       this.endpoint,
//       params,
//       'getNotes'
//     );
//   }

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