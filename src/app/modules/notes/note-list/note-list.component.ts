import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

// import { NoteService } from '../../services/note.service';
// import { Note, NoteFilterParams } from '../../models/note.types';
import { NoteCardComponent } from '../note-card/note-card.component';
import { NoteService } from '../../../core/services/notes.service';
import { Note, NoteFilterParams } from '../../../core/models/note.types';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NoteCardComponent],
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.scss']
})
export class NoteListComponent implements OnInit {
  private noteService = inject(NoteService);
  private router = inject(Router);

  // State Signals
  notes = signal<Note[]>([]);
  isLoading = signal(false);
  totalNotes = signal(0);
  
  // Search Control
  searchControl = new FormControl('');
  
  // Active Filters
  currentFilter: NoteFilterParams = {
    page: 1,
    limit: 12,
    sort: '-updatedAt'
  };

  ngOnInit() {
    this.fetchNotes();
    this.setupSearchListener();
  }

  fetchNotes() {
    this.isLoading.set(true);
    this.noteService.getNotes(this.currentFilter).subscribe({
      next: (res) => {
        this.notes.set(res.data.notes);
        this.totalNotes.set(res.data.pagination?.total || 0);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setupSearchListener() {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      // Use the specific search endpoint if query exists, else standard get
      if (query && query.length > 2) {
        this.isLoading.set(true);
        this.noteService.searchNotes(query).subscribe({
          next: (res) => {
            this.notes.set(res.data.notes);
            this.isLoading.set(false);
          }
        });
      } else if (!query) {
        this.fetchNotes(); // Reset to default list
      }
    });
  }

  // --- Actions ---

  onEdit(id: string) {
    this.router.navigate(['/notes', id]);
  }

  onPin(id: string) {
    this.noteService.togglePinNote(id).subscribe(() => {
      // Optimistic Update
      this.notes.update(notes => 
        notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
      );
    });
  }

  onDelete(id: string) {
    if(!confirm('Are you sure you want to delete this note?')) return;
    
    this.noteService.deleteNote(id).subscribe(() => {
      this.notes.update(notes => notes.filter(n => n._id !== id));
    });
  }

  createNew() {
    this.router.navigate(['/notes/create']);
  }
}