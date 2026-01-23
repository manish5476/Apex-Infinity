import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { NoteService } from '../../../core/services/notes.service';
import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
import { NoteCardComponent } from '../note-card/note-card.component';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NoteCardComponent],
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.scss']
})
export class NoteListComponent {
  private notesService = inject(NoteService);
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
    // Setup Search Debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(val => {
        this.searchQuery.set(val || '');
        this.currentPage.set(1); // Reset page on search
        this.loadNotes();
      });

    // Initial Load
    this.loadNotes();
    this.loadStats();
  }

  // --- Data Fetching ---

  loadNotes() {
    this.isLoading.set(true);
    
    const params: NoteFilterParams = {
      page: this.currentPage(),
      limit: 12,
      search: this.searchQuery(),
      sort: '-createdAt' // Default sort
    };

    // Apply specific filters based on active tab
    switch (this.activeFilter()) {
      case 'favorites':
        // Assuming your API supports a 'pinned' or 'favorites' filter
        // If not, you might filter client-side or add ?isPinned=true to API
        (params as any).isPinned = true; 
        break;
      case 'shared':
        // API logic for shared notes usually handled by a separate endpoint
        // But if getNotes supports it:
        // params.type = 'shared'; 
        break;
      case 'archived':
        params.status = 'archived';
        break;
      case 'trash':
        // Backend usually filters out deleted by default. 
        // You might need a specific endpoint or param for trash.
        // For now, let's assume standard notes.
        break;
    }

    // Handle "Shared" specially if it requires a different API endpoint
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

    // Standard Fetch
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
      // Optimistic update
      this.notes.update(notes => 
        notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
      );
    });
  }

  onDeleteNote(id: string) {
    if(!confirm('Move to trash?')) return;
    this.notesService.deleteNote(id).subscribe(() => {
      this.notes.update(notes => notes.filter(n => n._id !== id));
      this.loadStats(); // Refresh stats
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
        // Refresh to move it out of archive/trash view
        this.loadNotes();
     });
  }

  onEditNote(id: string) {
    this.router.navigate(['/notes', id]);
  }

  onShareNote(id: string) {
    // Open a modal or navigate to share settings
    // For now, just a placeholder alert or console
    console.log('Open Share Modal for', id);
  }
}

// import { Component, inject, signal, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { debounceTime, distinctUntilChanged } from 'rxjs';

// // import { NoteService } from '../../services/note.service';
// // import { Note, NoteFilterParams } from '../../models/note.types';
// import { NoteCardComponent } from '../note-card/note-card.component';
// import { NoteService } from '../../../core/services/notes.service';
// import { Note, NoteFilterParams } from '../../../core/models/note.types';

// @Component({
//   selector: 'app-note-list',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, NoteCardComponent],
//   templateUrl: './note-list.component.html',
//   styleUrls: ['./note-list.component.scss']
// })
// export class NoteListComponent implements OnInit {
//   private noteService = inject(NoteService);
//   private router = inject(Router);

//   // State Signals
//   notes = signal<Note[]>([]);
//   isLoading = signal(false);
//   totalNotes = signal(0);
  
//   // Search Control
//   searchControl = new FormControl('');
  
//   // Active Filters
//   currentFilter: NoteFilterParams = {
//     page: 1,
//     limit: 12,
//     sort: '-updatedAt'
//   };

//   ngOnInit() {
//     this.fetchNotes();
//     this.setupSearchListener();
//   }

//   fetchNotes() {
//     this.isLoading.set(true);
//     this.noteService.getNotes(this.currentFilter).subscribe({
//       next: (res) => {
//         this.notes.set(res.data.notes);
//         this.totalNotes.set(res.data.pagination?.total || 0);
//         this.isLoading.set(false);
//       },
//       error: () => this.isLoading.set(false)
//     });
//   }

//   setupSearchListener() {
//     this.searchControl.valueChanges.pipe(
//       debounceTime(400),
//       distinctUntilChanged()
//     ).subscribe(query => {
//       // Use the specific search endpoint if query exists, else standard get
//       if (query && query.length > 2) {
//         this.isLoading.set(true);
//         this.noteService.searchNotes(query).subscribe({
//           next: (res) => {
//             this.notes.set(res.data.notes);
//             this.isLoading.set(false);
//           }
//         });
//       } else if (!query) {
//         this.fetchNotes(); // Reset to default list
//       }
//     });
//   }

//   // --- Actions ---

//   onEdit(id: string) {
//     this.router.navigate(['/notes', id]);
//   }

//   onPin(id: string) {
//     this.noteService.togglePinNote(id).subscribe(() => {
//       // Optimistic Update
//       this.notes.update(notes => 
//         notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
//       );
//     });
//   }

//   onDelete(id: string) {
//     if(!confirm('Are you sure you want to delete this note?')) return;
    
//     this.noteService.deleteNote(id).subscribe(() => {
//       this.notes.update(notes => notes.filter(n => n._id !== id));
//     });
//   }

//   createNew() {
//     this.router.navigate(['/notes/create']);
//   }
// }