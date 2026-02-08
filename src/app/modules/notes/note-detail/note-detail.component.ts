import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Note, NoteAttachment, Subtask, ActivityLog } from '../../../core/models/note.types';
import { NoteService } from '../../../core/services/notes.service';

@Component({
  selector: 'app-note-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './note-detail.component.html',
  styleUrls: ['./note-detail.component.scss']
})
export class NoteDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noteService = inject(NoteService);
  private fb = inject(FormBuilder);

  // --- Signals & State ---
  // note is a Signal<Note | null>
  note = signal<Note | null>(null);
  activityLog = signal<ActivityLog[]>([]);
  
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);
  
  // Computeds (MUST access value with ())
  isTrash = computed(() => this.note()?.isDeleted || false);
  isArchived = computed(() => this.note()?.status === 'archived');
  
  progress = computed(() => {
    const n = this.note(); // Unwrap signal first
    if (!n || !n.subtasks || n.subtasks.length === 0) return 0;
    
    const completed = n.subtasks.filter(s => s.completed).length;
    return Math.round((completed / n.subtasks.length) * 100);
  });

  // Edit Form
  editForm = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    priority: ['medium'],
    status: ['active'],
    tags: [''], 
    startDate: [null as string | null], // Added to match template formControlName
    dueDate: [null as string | null],
    location: [''],
    link: ['']
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchNote(id);
        this.fetchHistory(id);
      }
    });
  }

  // --- Data Fetching ---

  fetchNote(id: string) {
    this.isLoading.set(true);
    this.noteService.getNoteById(id).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.patchForm(res.data.note);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/notes']);
      }
    });
  }

  fetchHistory(id: string) {
    if (this.noteService.getNoteHistory) {
      this.noteService.getNoteHistory(id).subscribe(res => {
         this.activityLog.set(res.data.activityLog);
      });
    }
  }

  patchForm(note: Note) {
    const formatDate = (dateString?: string | Date) => 
      dateString ? new Date(dateString).toISOString().split('T')[0] : null;

    this.editForm.patchValue({
      title: note.title,
      content: note.content,
      priority: note.priority,
      status: note.status,
      tags: note.tags?.join(', '),
      startDate: formatDate(note.startDate),
      dueDate: formatDate(note.dueDate),
      location: note.meetingDetails?.location || '',
      link: note.meetingDetails?.videoLink || ''
    });
  }

  // --- Core Actions ---

  toggleEdit() {
    this.isEditing.update(v => !v);
    if (this.isEditing() && this.note()) {
      this.patchForm(this.note()!);
    }
  }

  saveChanges() {
    const currentNote = this.note();
    if (this.editForm.invalid || !currentNote) return;

    this.isSaving.set(true);
    const formVal = this.editForm.value;
    
    const updates: any = {
      ...formVal,
      tags: formVal.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
      meetingDetails: {
        location: formVal.location,
        videoLink: formVal.link
      }
    };

    this.noteService.updateNote(currentNote._id, updates).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.isEditing.set(false);
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }

  // --- Subtask Management ---

  addSubtask(input: HTMLInputElement) {
    const title = input.value.trim();
    const currentNote = this.note();
    if (!title || !currentNote) return;

    this.noteService.addSubtask(currentNote._id, title).subscribe(res => {
      this.note.set(res.data.note);
      input.value = ''; 
    });
  }

  toggleSubtask(subtask: Subtask) {
    const currentNote = this.note();
    if (!currentNote) return;
    
    this.noteService.toggleSubtask(currentNote._id, subtask._id!, !subtask.completed)
      .subscribe(res => this.note.set(res.data.note));
  }

  deleteSubtask(subtaskId: string) {
    const currentNote = this.note();
    if(!currentNote || !confirm('Remove this task?')) return;
    
    this.noteService.removeSubtask(currentNote._id, subtaskId)
      .subscribe(res => this.note.set(res.data.note));
  }

  // --- Actions ---

  archiveNote() {
    const currentNote = this.note();
    if (!currentNote) return;
    this.noteService.archiveNote(currentNote._id).subscribe(res => {
      this.note.set(res.data.note);
      this.router.navigate(['/notes']); 
    });
  }

  restoreNote() {
    const currentNote = this.note();
    if (!currentNote) return;
    this.noteService.restoreNote(currentNote._id).subscribe(res => {
      this.note.set(res.data.note);
    });
  }

  duplicateNote() {
    const currentNote = this.note();
    if (!currentNote) return;
    this.noteService.duplicateNote(currentNote._id).subscribe(res => {
      this.router.navigate(['/notes', res.data.note._id]);
    });
  }

  deleteNote() {
    const currentNote = this.note();
    if (!currentNote) return;
    
    if (this.isTrash()) {
      if (!confirm('Permanently delete?')) return;
      this.noteService.hardDeleteNote(currentNote._id).subscribe(() => {
         this.router.navigate(['/notes']);
      });
    } else {
      if (!confirm('Move to trash?')) return;
      this.noteService.deleteNote(currentNote._id).subscribe(() => {
        this.router.navigate(['/notes']);
      });
    }
  }

  convertToTask() {
    const currentNote = this.note();
    if (!currentNote) return;
    // Use _id, not id
    this.noteService.convertToTask(currentNote._id).subscribe(res => {
       this.note.set(res.data.note);
    });
  }

  downloadAttachment(file: NoteAttachment) {
    if (file && file.url) {
      window.open(file.url, '_blank');
    }
  }
}