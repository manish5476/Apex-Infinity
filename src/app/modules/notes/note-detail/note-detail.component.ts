import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Note, NoteAttachment, Subtask, ActivityLog } from '../../../core/models/note.types';
import { NoteService } from '../../../core/services/notes.service';
import { AppMessageService } from '../../../core/services/message.service';
import { TiptapEditorComponent } from '../../shared/components/tiptap-editor/tiptap-editor.component';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

@Component({
  selector: 'app-note-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './note-detail.component.html',
  styleUrls: ['./note-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noteService = inject(NoteService);
  private messageServic = inject(AppMessageService);
  private fb = inject(FormBuilder);

  // --- State ---
  note = signal<Note | null>(null);
  activityLog = signal<ActivityLog[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);

  // --- Computed ---
  isTrash = computed(() => this.note()?.isDeleted || false);
  isArchived = computed(() => this.note()?.status === 'archived');

  progress = computed(() => {
    const n = this.note();
    if (!n?.subtasks?.length) return 0;
    const completed = n.subtasks.filter(s => s.completed).length;
    return Math.round((completed / n.subtasks.length) * 100);
  });

  // --- Forms ---
  editForm = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    priority: ['medium'],
    tags: [''],
    startDate: [null as string | null],
    dueDate: [null as string | null]
  });

  constructor() { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditing.set(false);
        this.fetchNote(id);
        this.fetchHistory(id);
      }
    });
  }

  /** Converts Tiptap JSON content (or raw HTML string) → safe HTML for [innerHTML] */
  getContentHtml(content: any): string {
    if (!content) return '';
    // Already an HTML string
    if (typeof content === 'string') {
      if (content.startsWith('<') || content === '') return content;
      try {
        const json = JSON.parse(content);
        return generateHTML(json, [
          StarterKit, Link, Underline,
          TaskList, TaskItem.configure({ nested: true })
        ]);
      } catch {
        return content;
      }
    }
    // Already a JSON object
    if (typeof content === 'object') {
      try {
        return generateHTML(content, [
          StarterKit, Link, Underline,
          TaskList, TaskItem.configure({ nested: true })
        ]);
      } catch {
        return '';
      }
    }
    return '';
  }

  // Helper to safely get initials
  getInitials(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  patchForm(note: Note) {
    const formatDate = (dateVal?: string | Date) => {
      if (!dateVal) return null;
      try {
        return new Date(dateVal).toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    };

    this.editForm.patchValue({
      title: note.title,
      content: note.content,
      priority: note.priority,
      tags: note.tags?.join(', ') || '',
      startDate: formatDate(note.startDate),
      dueDate: formatDate(note.dueDate)
    });
  }

  // --- Linking ---
  openLinkDialog() {
    const id = prompt('Enter Note ID to link (Mock Dialog):');
    if (id && this.note()) {
      this.noteService.linkNote(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
    }
  }

  unlinkNote(targetId: string) {
    if (!confirm('Remove link?') || !this.note()) return;
    this.noteService.unlinkNote(this.note()!._id, targetId).subscribe(res => this.note.set(res.data.note));
  }

  // --- General ---

  convertToTask() {
    if (!this.note()) return;
    this.noteService.convertToTask(this.note()!._id).subscribe(res => this.note.set(res.data.note));
  }

  downloadAttachment(file: NoteAttachment) {
    if (file.url) window.open(file.url, '_blank');
  }
  // ----------------------------------------------------------------------------------
  fetchNote(id: string) {
    this.isLoading.set(true);
    this.noteService.getNoteById(id).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.patchForm(res.data.note);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageServic.handleHttpError(err);
        this.router.navigate(['/notes']);
      }
    });
  }

  fetchHistory(id: string) {
    this.noteService.getNoteHistory(id).subscribe({
      next: (res) => this.activityLog.set(res.data.activityLog),
      error: (err) => this.messageServic.handleHttpError(err)
    });
  }

  // --- Actions ---
  toggleEdit() {
    if (this.isEditing() && this.note()) {
      this.patchForm(this.note()!);
    }
    this.isEditing.update(v => !v);
  }

  saveChanges() {
    if (this.editForm.invalid || !this.note()) {
      this.editForm.markAllAsTouched();
      this.messageServic.showWarn('Validation Error: Please correct the highlighted fields.');
      return;
    }
    this.isSaving.set(true);

    const rawTags = this.editForm.get('tags')?.value || '';
    const updates = {
      ...this.editForm.value,
      tags: rawTags.split(',').map((t: string) => t.trim()).filter(Boolean)
    };

    this.noteService.updateNote(this.note()!._id, updates).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.isEditing.set(false);
        this.isSaving.set(false);
        this.messageServic.showSuccess('Note updated successfully.');
        this.fetchHistory(res.data.note._id);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.messageServic.handleHttpError(err);
      }
    });
  }

  // --- Subtasks ---
  addSubtask(input: HTMLInputElement) {
    const val = input.value.trim();
    if (!val || !this.note()) return;
    this.noteService.addSubtask(this.note()!._id, val).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.messageServic.showSuccess('Subtask added.');
        input.value = '';
      },
      error: (err) => this.messageServic.handleHttpError(err)
    });
  }

  toggleSubtask(subtask: Subtask) {
    if (!this.note()) return;
    this.noteService.toggleSubtask(this.note()!._id, subtask._id!, !subtask.completed)
      .subscribe({
        next: (res) => this.note.set(res.data.note),
        error: (err) => this.messageServic.handleHttpError(err)
      });
  }

  deleteSubtask(id: string) {
    if (!this.note()) return;
    this.noteService.removeSubtask(this.note()!._id, id).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.messageServic.showSuccess('Subtask removed.');
      },
      error: (err) => this.messageServic.handleHttpError(err)
    });
  }

  // --- General Actions ---
  duplicateNote() {
    if (!this.note()) return;
    this.noteService.duplicateNote(this.note()!._id).subscribe({
      next: (res) => {
        this.messageServic.showSuccess('Note duplicated.');
        this.router.navigate(['/notes', res.data.note._id]);
      },
      error: (err) => this.messageServic.handleHttpError(err)
    });
  }

  archiveNote() {
    if (!this.note()) return;
    this.noteService.archiveNote(this.note()!._id).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.messageServic.showSuccess('Note moved to archive.');
      },
      error: (err) => this.messageServic.handleHttpError(err)
    });
  }

  restoreNote() {
    if (!this.note()) return;
    const isTrash = this.isTrash();
    const request$ = isTrash
      ? this.noteService.restoreFromTrash(this.note()!._id)
      : this.noteService.restoreNote(this.note()!._id);

    request$.subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.messageServic.showSuccess('Note restored successfully.');
      },
      error: (err) => this.messageServic.handleHttpError(err)
    });
  }

  deleteNote() {
    if (!this.note() || !this.note()?._id) return;
    const noteId = this.note()!._id;

    if (this.isTrash()) {
      if (!confirm('Permanently delete this note? This action cannot be undone.')) return;
      this.noteService.hardDeleteNote(noteId).subscribe({
        next: () => {
          this.messageServic.showSuccess('Note permanently deleted.');
          this.router.navigate(['/notes']);
        },
        error: (err) => this.messageServic.handleHttpError(err)
      });
    } else {
      this.noteService.deleteNote(noteId).subscribe({
        next: () => {
          this.messageServic.showSuccess('Note moved to trash.');
          this.router.navigate(['/notes']);
        },
        error: (err) => this.messageServic.handleHttpError(err)
      });
    }
  }
}