import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { NoteService } from '../../../core/services/notes.service';
import { DynamicDialogServices } from './../../../core/services/dynamic-dialog-services';
import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
import { NoteCardComponent } from '../note-card/note-card.component';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NoteCardComponent],
  template: `
    <div class="dashboard-container">
      <!-- SIDEBAR FILTERS -->
      <aside class="filters-sidebar glass-panel">
        <div class="compose-btn-wrapper">
          <button class="btn-compose" routerLink="/notes/create">
            <span class="icon">＋</span> New Note
          </button>
        </div>

        <nav class="nav-menu">
          <button class="nav-item" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
            <span class="icon">📝</span> All Notes
            <span class="count">{{ stats()?.totalNotes || 0 }}</span>
          </button>
          <button class="nav-item" [class.active]="activeFilter() === 'favorites'" (click)="setFilter('favorites')">
            <span class="icon">⭐</span> Favorites
          </button>
          <button class="nav-item" [class.active]="activeFilter() === 'shared'" (click)="setFilter('shared')">
            <span class="icon">👥</span> Shared with me
          </button>
          <div class="divider"></div>
          <button class="nav-item" [class.active]="activeFilter() === 'archived'" (click)="setFilter('archived')">
            <span class="icon">🗄️</span> Archived
          </button>
          <button class="nav-item danger" [class.active]="activeFilter() === 'trash'" (click)="setFilter('trash')">
            <span class="icon">🗑️</span> Trash
          </button>
        </nav>

        @if (stats()) {
        <div class="stats-widget">
          <h3>Progress</h3>
          <div class="stat-row">
            <span>Completed Tasks</span>
            <span class="val success">{{ stats()?.byStatus || 0 }}</span>
          </div>
        </div>
        }
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content">
        <header class="top-bar glass-panel">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" [formControl]="searchControl" placeholder="Search notes, meetings, tags..."
              class="search-input">
          </div>
          <div class="action-wrapper">
            <button class="btn-icon" (click)="exportNotes()" title="Export Data">
              <span class="icon">📩</span>
            </button>
          </div>

          <div class="view-controls">
            <button class="btn-icon" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
              ⊞
            </button>
            <button class="btn-icon" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">
              ☰
            </button>
          </div>
        </header>

        <div class="content-area custom-scrollbar">
          @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
          }

          @if (!isLoading() && notes().length === 0) {
          <div class="empty-state">
            <div class="illustration">🍃</div>
            <h3>No notes found</h3>
            <p>Create your first note or check your filters.</p>
            <button class="btn-primary" routerLink="/notes/create">Create Note</button>
          </div>
          }

          @if (!isLoading() && notes().length > 0) {
          <div class="notes-grid" [class.list-layout]="viewMode() === 'list'">
            @for (note of notes(); track note._id) {
            <!-- 
                NOTE: I added (link)="onLinkNote($event)" here. 
                Ensure your NoteCardComponent emits this event.
            -->
            <app-note-card 
              [note]="note" 
              (edit)="onEditNote($event)" 
              (pin)="onPinNote($event)"
              (delete)="onDeleteNote($event)" 
              (archive)="onArchiveNote($event)" 
              (restore)="onRestoreNote($event)"
              (share)="onShareNote($event)"
              (link)="onLinkNote($event)">
            </app-note-card>
            }
          </div>
          }

          @if (!isLoading() && totalPages() > 1) {
          <div class="pagination">
            <button (click)="changePage(-1)" [disabled]="currentPage() === 1">Prev</button>
            <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button (click)="changePage(1)" [disabled]="currentPage() === totalPages()">Next</button>
          </div>
          }
        </div>
      </main>
    </div>
  `,
  styleUrls: ['./note-list.component.scss']
})
export class NoteListComponent {
  private notesService = inject(NoteService);
  private dialogServices = inject(DynamicDialogServices);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // --- State Signals ---
  notes = signal<Note[]>([]);
  stats = signal<NoteStatistics | null>(null);
  isLoading = signal(true);
  viewMode = signal<'grid' | 'list'>('grid');
  
  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalNotes = signal(0);

  // Filters State
  activeFilter = signal<'all' | 'favorites' | 'shared' | 'archived' | 'trash'>('all');
  searchQuery = signal('');

  // Search Form
  searchControl = this.fb.control('');

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

  exportNotes() {
    this.dialogServices.openNoteExport();
  }

  loadNotes() {
    this.isLoading.set(true);
    
    const params: NoteFilterParams = {
      page: this.currentPage(),
      limit: 12,
      search: this.searchQuery(),
      sort: '-createdAt'
    };

    switch (this.activeFilter()) {
      case 'favorites': (params as any).isPinned = true; break;
      case 'archived': params.status = 'archived'; break;
      case 'trash': break; // Adjust if backend requires specific trash param
    }

    if (this.activeFilter() === 'shared') {
      this.notesService.getSharedNotesWithMe().subscribe({
        next: (res) => {
          this.notes.set(res.data.notes);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
      return;
    }

    this.notesService.getNotes(params).subscribe({
      next: (res) => {
        this.notes.set(res.data.notes);
        this.totalPages.set(res.data.pagination?.pages || 1);
        this.totalNotes.set(res.data.pagination?.total || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  loadStats() {
    this.notesService.getNoteStatistics().subscribe(res => {
      this.stats.set(res.data);
    });
  }

  // --- Actions ---

  setFilter(filter: 'all' | 'favorites' | 'shared' | 'archived' | 'trash') {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.loadNotes();
  }

  changePage(delta: number) {
    const newPage = this.currentPage() + delta;
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadNotes();
    }
  }

  // Card Actions
  onPinNote(id: string) {
    this.notesService.togglePinNote(id).subscribe(() => {
      this.notes.update(notes => 
        notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
      );
    });
  }

  onDeleteNote(id: string) {
    if(!confirm('Move to trash?')) return;
    this.notesService.deleteNote(id).subscribe(() => {
      this.notes.update(notes => notes.filter(n => n._id !== id));
      this.loadStats();
    });
  }

  onArchiveNote(id: string) {
    this.notesService.archiveNote(id).subscribe(() => {
      this.notes.update(notes => notes.filter(n => n._id !== id));
      this.loadStats();
    });
  }

  onRestoreNote(id: string) {
     this.notesService.restoreNote(id).subscribe(() => {
       this.loadNotes();
     });
  }

  onEditNote(id: string) {
    this.router.navigate(['/notes', id]);
  }

  onShareNote(id: string) {
    // Logic for share modal (already implemented in card or here)
    console.log('Sharing', id);
  }

  // NEW: Link Note Logic
  onLinkNote(sourceId: any) {
    const ref = this.dialogServices.openNoteLinkDialog(sourceId);
    
    if (ref) {
      ref.onClose.subscribe((targetNote: Note) => {
        if (targetNote) {
          // Perform the link API call
          this.notesService.linkNote(sourceId, targetNote._id).subscribe({
            next: (res) => {
              // Update the local note object to reflect the new link
              this.notes.update(notes => 
                notes.map(n => n._id === sourceId ? res.data.note : n)
              );
              // Ideally show a toast here: "Linked to ${targetNote.title}"
            },
            error: (err) => console.error('Failed to link note', err)
          });
        }
      });
    }
  }
}

// import { DynamicDialogServices } from './../../../core/services/dynamic-dialog-services';
// import { Dialog } from 'primeng/dialog';
// import { Component, inject, signal, effect, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// import { debounceTime, distinctUntilChanged } from 'rxjs';

// import { NoteService } from '../../../core/services/notes.service';
// import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
// import { NoteCardComponent } from '../note-card/note-card.component';

// @Component({
//   selector: 'app-note-list',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ReactiveFormsModule, NoteCardComponent],
//   templateUrl: './note-list.component.html',
//   styleUrls: ['./note-list.component.scss']
// })
// export class NoteListComponent {
//   private notesService = inject(NoteService);
//   private DynamicDialogServices = inject(DynamicDialogServices);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);

//   // --- State Signals ---
//   notes = signal<Note[]>([]);
//   stats = signal<NoteStatistics | null>(null);
//   isLoading = signal(true);
//   viewMode = signal<'grid' | 'list'>('grid');
  
//   // Pagination
//   currentPage = signal(1);
//   totalPages = signal(1);
//   totalNotes = signal(0);

//   // Filters State
//   activeFilter = signal<'all' | 'favorites' | 'shared' | 'archived' | 'trash'>('all');
//   searchQuery = signal('');

//   // Search Form
//   searchControl = this.fb.control('');

//   constructor() {
//     // Setup Search Debounce
//     this.searchControl.valueChanges
//       .pipe(debounceTime(300), distinctUntilChanged())
//       .subscribe(val => {
//         this.searchQuery.set(val || '');
//         this.currentPage.set(1); // Reset page on search
//         this.loadNotes();
//       });

//     // Initial Load
//     this.loadNotes();
//     this.loadStats();
//   }

//   // --- Data Fetching ---
// exportNotes(){
//   this.DynamicDialogServices.openNoteExport()
// }
//   loadNotes() {
//     this.isLoading.set(true);
    
//     const params: NoteFilterParams = {
//       page: this.currentPage(),
//       limit: 12,
//       search: this.searchQuery(),
//       sort: '-createdAt' // Default sort
//     };

//     // Apply specific filters based on active tab
//     switch (this.activeFilter()) {
//       case 'favorites':
//         // Assuming your API supports a 'pinned' or 'favorites' filter
//         // If not, you might filter client-side or add ?isPinned=true to API
//         (params as any).isPinned = true; 
//         break;
//       case 'shared':
//         // API logic for shared notes usually handled by a separate endpoint
//         // But if getNotes supports it:
//         // params.type = 'shared'; 
//         break;
//       case 'archived':
//         params.status = 'archived';
//         break;
//       case 'trash':
//         // Backend usually filters out deleted by default. 
//         // You might need a specific endpoint or param for trash.
//         // For now, let's assume standard notes.
//         break;
//     }

//     // Handle "Shared" specially if it requires a different API endpoint
//     if (this.activeFilter() === 'shared') {
//       this.notesService.getSharedNotesWithMe().subscribe({
//         next: (res) => {
//           this.notes.set(res.data.notes);
//           this.isLoading.set(false);
//         },
//         error: () => this.isLoading.set(false)
//       });
//       return;
//     }

//     // Standard Fetch
//     this.notesService.getNotes(params).subscribe({
//       next: (res) => {
//         this.notes.set(res.data.notes);
//         this.totalPages.set(res.data.pagination?.pages || 1);
//         this.totalNotes.set(res.data.pagination?.total || 0);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   loadStats() {
//     this.notesService.getNoteStatistics().subscribe(res => {
//       this.stats.set(res.data);
//     });
//   }

//   // --- Actions ---

//   setFilter(filter: 'all' | 'favorites' | 'shared' | 'archived' | 'trash') {
//     this.activeFilter.set(filter);
//     this.currentPage.set(1);
//     this.loadNotes();
//   }

//   changePage(delta: number) {
//     const newPage = this.currentPage() + delta;
//     if (newPage >= 1 && newPage <= this.totalPages()) {
//       this.currentPage.set(newPage);
//       this.loadNotes();
//     }
//   }

//   // Card Actions
//   onPinNote(id: string) {
//     this.notesService.togglePinNote(id).subscribe(() => {
//       // Optimistic update
//       this.notes.update(notes => 
//         notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
//       );
//     });
//   }

//   onDeleteNote(id: string) {
//     if(!confirm('Move to trash?')) return;
//     this.notesService.deleteNote(id).subscribe(() => {
//       this.notes.update(notes => notes.filter(n => n._id !== id));
//       this.loadStats(); // Refresh stats
//     });
//   }

//   onArchiveNote(id: string) {
//     this.notesService.archiveNote(id).subscribe(() => {
//       this.notes.update(notes => notes.filter(n => n._id !== id));
//       this.loadStats();
//     });
//   }

//   onRestoreNote(id: string) {
//      this.notesService.restoreNote(id).subscribe(() => {
//         // Refresh to move it out of archive/trash view
//         this.loadNotes();
//      });
//   }

//   onEditNote(id: string) {
//     this.router.navigate(['/notes', id]);
//   }

//   onShareNote(id: string) {
//     // Open a modal or navigate to share settings
//     // For now, just a placeholder alert or console
//     console.log('Open Share Modal for', id);
//   }
// }