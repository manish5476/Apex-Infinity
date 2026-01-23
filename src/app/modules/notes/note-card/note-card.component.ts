import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../../../core/models/note.types';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-card.component.html',
  styleUrls: ['./note-card.component.scss']
})
export class NoteCardComponent {
  @Input({ required: true }) note!: Note;
  
  @Output() pin = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() share = new EventEmitter<string>();
  @Output() archive = new EventEmitter<string>();
  @Output() restore = new EventEmitter<string>();

  // Computed Properties
  get isOverdue(): boolean {
    if (!this.note.dueDate || this.note.status === 'completed') return false;
    return new Date(this.note.dueDate) < new Date();
  }

  get meetingTimeDisplay(): string | null {
    if (this.note.noteType !== 'meeting' || !this.note.startDate) return null;
    const start = new Date(this.note.startDate);
    return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  get progress(): number | null {
    if (!this.note.subtasks || this.note.subtasks.length === 0) return null;
    const completed = this.note.subtasks.filter(t => t.completed).length;
    return Math.round((completed / this.note.subtasks.length) * 100);
  }

  onCardClick() {
    this.edit.emit(this.note._id);
  }
}
