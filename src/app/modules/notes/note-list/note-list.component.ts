import { MessageService } from "primeng/api";
import { Component, inject, signal, effect, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
import { NoteCardComponent, User } from '../note-card/note-card.component';
import { SharedNoteCardComponent } from '../shared-note-card.component';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';
import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
import { NoteService } from '../../../core/services/notes.service';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
import { AppMessageService } from "../../../core/services/message.service";

type FilterType = 'all' | 'favorites' | 'shared' | 'shared-by-me' | 'recent' | 'archived' | 'trash' | 'calendar';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NoteCardComponent, SharedNoteCardComponent, RecentActivityComponent, CalendarViewComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.scss'
})
export class NoteListComponent {
  private notesService = inject(NoteService);
  private messageService = inject(AppMessageService);
  private dialogServices = inject(DynamicDialogServices);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  notes = signal<Note[]>([]);
  stats = signal<NoteStatistics | null>(null);
  isLoading = signal(true);
  viewMode = signal<'grid' | 'list'>('grid');

  currentPage = signal(1);
  totalPages = signal(1);
  totalNotes = signal(0);

  activeFilter = signal<FilterType>('all');
  searchQuery = signal('');
  availableUsers = signal<User[]>([]);
  searchControl = this.fb.control('');
  dashboardStats = computed(() => {
    const s = this.stats() as any;
    if (!s) return { total: 0, active: 0, completed: 0 };
    const total = Array.isArray(s.totalNotes) ? (s.totalNotes[0]?.count || 0) : (s.totalNotes || 0);
    let completed = 0;
    if (Array.isArray(s.byStatus)) {
      const c = s.byStatus.find((i: any) => i._id === 'done'); completed = c ? c.count : 0;
    } else if (typeof s.byStatus === 'number') {
      completed = s.byStatus;
    }
    return {
      total: Number(total),
      completed: Number(completed),
      active: Math.max(0, Number(total) - Number(completed))
    };
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(val => {
        this.searchQuery.set(val || '');
        this.currentPage.set(1);
        this.loadNotes();
      });
    this.loadNotes();
    this.loadStats();
  }
  isSharedFilter(): boolean {
    const f = this.activeFilter();
    return f === 'shared' || f === 'shared-by-me';
  }

  handleSharedAction(action: string, id: string) {
    if (action === 'view') {
      this.onEditNote(id);
    } else if (action === 'unshare') {
      console.log('Unshare requested for', id);
    }
  }

  setFilter(filter: FilterType) {
    if (this.activeFilter() === filter) return;
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.searchControl.setValue('', { emitEvent: false }); // Clear search, prevent double trigger
    this.searchQuery.set('');
    this.loadNotes();
  }

  changePage(delta: number) {
    const newPage = this.currentPage() + delta;
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadNotes();
    }
  }

  // Helper to check if we should hide pagination
  isSpecialFilter(): boolean {
    const f = this.activeFilter();
    return f === 'trash' || f === 'shared' || f === 'shared-by-me' || f === 'recent' || f === 'calendar';
  }

  getEmptyMessage() {
    const map: Record<string, { title: string, desc: string }> = {
      all: { title: 'No notes found', desc: 'Capture your ideas, meetings, and tasks.' },
      favorites: { title: 'No favorites yet', desc: 'Pin notes to access them quickly here.' },
      shared: { title: 'No shared notes', desc: 'Notes shared with you will appear here.' },
      'shared-by-me': { title: 'No shared items', desc: 'Notes you share with others appear here.' },
      recent: { title: 'No recent activity', desc: 'Your recent updates will show up here.' },
      archived: { title: 'Archive is empty', desc: 'Archived notes are safely stored here.' },
      trash: { title: 'Trash is empty', desc: 'Deleted notes will appear here for 30 days.' },
      calendar: { title: 'Calendar', desc: '' } // Shouldn't be seen
    };
    return map[this.activeFilter()] || map['all'];
  }

  onEditNote(id: string) {
    this.router.navigate(['/notes', id]);
  }

  onShareNote(id: string) {
    console.log('Shared note:', id);
  }

  exportNotes() {
    this.dialogServices.openNoteExport();
  }

  // --- Data Loading ---
  loadNotes() {
    this.isLoading.set(true);
    const filter = this.activeFilter();

    if (this.isSpecialFilter()) {
      this.totalPages.set(1);
    }

    if (filter === 'calendar') {
      this.isLoading.set(false);
      return;
    }

    // Define the specific observable based on the filter
    let request$;

    switch (filter) {
      case 'recent': request$ = this.notesService.getRecentActivity(); break;
      case 'shared': request$ = this.notesService.getSharedNotesWithMe(); break;
      case 'shared-by-me': request$ = this.notesService.getNotesSharedByMe(); break;
      case 'trash': request$ = this.notesService.getTrashBin(); break;
      default:
        const params: NoteFilterParams = {
          page: this.currentPage(),
          limit: 12,
          search: this.searchQuery(),
          sort: '-createdAt'
        };
        if (filter === 'favorites') (params as any).isPinned = true;
        if (filter === 'archived') params.status = 'archived';
        request$ = this.notesService.getNotes(params);
    }

    request$.subscribe({
      next: (res: any) => {
        this.notes.set(res.data.notes);
        if (res.data.pagination) {
          this.totalPages.set(res.data.pagination.pages || 1);
          this.totalNotes.set(res.data.pagination.total || 0);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.handleHttpError(err);
      }
    });
  }

  loadStats() {
    this.notesService.getNoteStatistics().subscribe({
      next: (res) => this.stats.set(res.data),
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onPinNote(id: string) {
    this.notesService.togglePinNote(id).subscribe({
      next: () => {
        this.notes.update(notes =>
          notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
        );
        this.messageService.showSuccess('Note pin status updated.');
        if (this.activeFilter() === 'favorites') this.loadNotes();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onArchiveNote(id: string) {
    this.notesService.archiveNote(id).subscribe({
      next: () => {
        this.notes.update(notes => notes.filter(n => n._id !== id));
        this.messageService.showSuccess('Note moved to archive.');
        this.loadStats();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onDeleteNote(id: string) {
    // You could replace window.confirm with your confirmationService for consistency
    if (!confirm('Move this note to trash?')) return;
    this.notesService.deleteNote(id).subscribe({
      next: () => {
        this.notes.update(notes => notes.filter(n => n._id !== id));
        this.messageService.showSuccess('Note moved to trash.');
        this.loadStats();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onHardDeleteNote(id: string) {
    if (!confirm('Permanently delete this note? This cannot be undone.')) return;
    this.notesService.hardDeleteNote(id).subscribe({
      next: () => {
        this.notes.update(notes => notes.filter(n => n._id !== id));
        this.messageService.showSuccess('Note permanently deleted.');
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onRestoreNote(id: string) {
    const action$ = this.activeFilter() === 'trash'
      ? this.notesService.restoreFromTrash(id)
      : this.notesService.restoreNote(id);

    action$.subscribe({
      next: () => {
        this.notes.update(notes => notes.filter(n => n._id !== id));
        this.messageService.showSuccess('Note restored successfully.');
        this.loadStats();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onEmptyTrash() {
    if (!confirm('Are you sure you want to permanently delete ALL items in trash?')) return;
    this.notesService.emptyTrash().subscribe({
      next: () => {
        this.notes.set([]);
        this.messageService.showSuccess('Trash folder cleared.');
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onConvertToTask(id: string) {
    this.notesService.convertToTask(id).subscribe({
      next: () => {
        this.messageService.showSuccess('Note converted to task.');
        this.loadNotes();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onLinkNoteRequest(sourceId: string) {
    const ref: any = this.dialogServices.openNoteLinkDialog(sourceId);
    ref.onClose.subscribe((targetNote: Note) => {
      if (targetNote) {
        this.notesService.linkNote(sourceId, targetNote._id).subscribe({
          next: (res) => {
            this.messageService.showSuccess('Notes linked successfully.');
            this.notes.update(notes =>
              notes.map(n => n._id === sourceId ? res.data.note : n)
            );
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }
}
