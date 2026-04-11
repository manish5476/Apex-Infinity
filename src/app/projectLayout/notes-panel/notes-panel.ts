import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '@core/services/api';
import { Drawer } from "primeng/drawer";

export interface ContextualNote {
  id?: string;
  content: string;
  timestamp: Date;
  createdBy: string;
  isImportant?: boolean;
}

@Component({
  selector: 'app-notes-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, Drawer],
  templateUrl: './notes-panel.html',
  styleUrl: './notes-panel.scss'
})
export class NotesPanelComponent {
  private apiService = inject(ApiService);

  @Input() entityType!: string;
  @Input() entityId?: string | number;

  @Input() isVisible = false;
  @Output() isVisibleChange = new EventEmitter<boolean>();

  // If we are in "Create" mode (no entityId), notes are held in memory
  // and emitted when the parent form is saved.
  @Output() notesDrafted = new EventEmitter<ContextualNote[]>();

  notes = signal<ContextualNote[]>([]);
  newNoteText = signal('');
  isImportantNewNote = signal(false);
  isLoading = signal(false);

  // Load notes dynamically whenever visibility changes to true
  ngOnChanges(changes: any) {
    if (changes['isVisible'] && this.isVisible && this.entityId) {
      this.loadNotes();
    }
  }

  closePanel() {
    this.isVisible = false;
    this.isVisibleChange.emit(this.isVisible);
  }

  loadNotes() {
    if (!this.entityId) return;
    this.isLoading.set(true);
    // Generic logic to fetch notes based on entityType and entityId
    // Replace with actual API call
    /*
    this.apiService.getNotesByEntity(this.entityType, this.entityId).subscribe({
      next: (data) => {
        this.notes.set(data.notes);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    */

    // Stub implementation for UI purposes
    setTimeout(() => {
      this.notes.set([
        { content: 'Customer requested delayed shipment.', timestamp: new Date(), createdBy: 'Admin', isImportant: true },
        { content: 'Follow up on payment next week.', timestamp: new Date(), createdBy: 'System' }
      ]);
      this.isLoading.set(false);
    }, 500);
  }

  addNote() {
    const content = this.newNoteText().trim();
    if (!content) return;

    const newNote: ContextualNote = {
      content,
      timestamp: new Date(),
      createdBy: 'Current User', // Resolve from auth store
      isImportant: this.isImportantNewNote()
    };

    if (this.entityId) {
      // Save directly to backend
      /*
      this.apiService.addNoteToEntity(this.entityType, this.entityId, newNote).subscribe(...)
      */

      // Stub
      this.notes.update(n => [newNote, ...n]);
    } else {
      // Create mode - hold in memory & emit
      this.notes.update(n => [newNote, ...n]);
      this.notesDrafted.emit(this.notes());
    }

    this.newNoteText.set('');
    this.isImportantNewNote.set(false);
  }
}
