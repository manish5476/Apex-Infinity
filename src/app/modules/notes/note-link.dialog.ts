import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Note } from '../../core/models/note.types';
import { NoteService } from '../../core/services/notes.service';
import { AppMessageService } from '../../core/services/message.service';
import { of } from 'rxjs';


@Component({
  selector: 'app-note-link-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="link-container">
      <div class="search-section">
        <i class="pi pi-search search-icon"></i>
        <input 
          [formControl]="searchControl" 
          type="text" 
          placeholder="Search for a note to link..." 
          class="search-input"
          autofocus>
      </div>

      <div class="results-list custom-scrollbar">
        <!-- Loading State -->
        @if (isLoading) {
          <div class="state-msg">
            <i class="pi pi-spin pi-spinner"></i> Searching...
          </div>
        }

        <!-- Empty/Initial State -->
        @if (!isLoading && notes().length === 0) {
          <div class="state-msg">
            @if (searchControl.value) {
              <span>No notes found.</span>
            } @else {
              <span>Type to search notes.</span>
            }
          </div>
        }

        <!-- List -->
        @for (note of notes(); track note._id) {
          <div class="note-item" (click)="selectNote(note)">
            
            <div class="note-icon" [ngClass]="note.noteType">
              <i [class]="getTypeIcon(note.noteType)"></i>
            </div>
            
            <div class="note-info">
              <div class="note-title">{{ note.title || 'Untitled' }}</div>
              <div class="note-meta">
                <span>{{ note.updatedAt | date:'MMM d' }}</span>
                @if (note.tags.length) {
                  <span>•</span>
                  @for (tag of note.tags | slice:0:2; track tag) {
                    <span>#{{tag}} </span>
                  }
                }
              </div>
            </div>

            <i class="pi pi-link action-icon"></i>
          </div>
        }
      </div>

      <div class="dialog-footer">
        <button class="btn-cancel" (click)="close()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --bg-hover: var(--component-bg-hover, #f3f4f6);
      --border: var(--border-secondary, #e5e7eb);
      --text: var(--text-primary, #1f2937);
      --text-sub: var(--text-secondary, #6b7280);
      --accent: var(--accent-primary, #3b82f6);
    }

    .link-container {
      display: flex;
      flex-direction: column;
      height: 400px; /* Fixed height for list scrolling */
    }

    .search-section {
      position: relative;
      margin-bottom: 1rem;
      
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-sub);
      }

      .search-input {
        width: 100%;
        padding: 10px 10px 10px 36px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--bg-hover);
        outline: none;
        color: var(--text);
        
        &:focus {
          border-color: var(--accent);
          background: white;
        }
      }
    }

    .results-list {
      flex: 1;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .state-msg {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 100%;
      color: var(--text-sub);
      font-size: 0.875rem;
    }

    .note-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.2s;

      &:last-child { border-bottom: none; }
      &:hover { 
        background: var(--bg-hover); 
        .action-icon { opacity: 1; color: var(--accent); }
      }

      .note-icon {
        width: 32px; height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.05);
        color: var(--text-sub);
        &.meeting { color: #3b82f6; background: rgba(59,130,246,0.1); }
        &.task { color: #10b981; background: rgba(16,185,129,0.1); }
      }

      .note-info {
        flex: 1;
        min-width: 0;
        .note-title { font-weight: 500; font-size: 0.9rem; color: var(--text); }
        .note-meta { font-size: 0.75rem; color: var(--text-sub); }
      }

      .action-icon {
        opacity: 0;
        transition: opacity 0.2s;
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
    }

    .btn-cancel {
      background: none;
      border: none;
      color: var(--text-sub);
      cursor: pointer;
      font-weight: 500;
      &:hover { color: var(--text); }
    }
  `]
})
export class NoteLinkDialogComponent {
  ref = inject(DynamicDialogRef);
  config = inject(DynamicDialogConfig);
  noteService = inject(NoteService);
  messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef); // Essential for OnPush/Manual state updates
  searchControl = new FormControl('');
  notes = signal<Note[]>([]);
  isLoading = false;
  
  sourceNoteId: string = '';

 constructor() {
    this.sourceNoteId = this.config.data?.sourceNoteId;

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          this.notes.set([]);
          return of({ data: { notes: [] } }); // Return empty observable to keep stream alive
        }
        
        this.isLoading = true;
        this.cdr.markForCheck(); // Ensure spinner shows up on OnPush components
        
        return this.noteService.searchNotes(query).pipe(
          catchError((err) => {
            this.isLoading = false;
            this.messageService.handleHttpError(err);
            return of({ data: { notes: [] } }); // Gracefully handle search failure
          })
        );
      })
    ).subscribe({
      next: (res: any) => {
        // Filter out the current note so you don't link to self
        const filtered = (res.data?.notes || []).filter((n: Note) => n._id !== this.sourceNoteId);
        this.notes.set(filtered);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectNote(targetNote: Note) {
    this.ref.close(targetNote);
  }

  close() {
    this.ref.close();
  }

  getTypeIcon(type: string) {
    const map: any = { 
      note: 'pi pi-file', 
      meeting: 'pi pi-calendar', 
      task: 'pi pi-check-square' 
    };
    return map[type] || 'pi pi-file';
  }
}