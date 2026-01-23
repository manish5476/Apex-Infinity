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
  note = signal<Note | null>(null);
  activityLog = signal<ActivityLog[]>([]);
  
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);
  
  // UI Toggles
  showHistory = signal(false);
  newSubtaskTitle = signal('');

  // Computeds
  isTrash = computed(() => this.note()?.isDeleted || false);
  isArchived = computed(() => this.note()?.status === 'archived');
  progress = computed(() => {
    const subs = this.note()?.subtasks || [];
    if (!subs.length) return 0;
    const completed = subs.filter(s => s.completed).length;
    return Math.round((completed / subs.length) * 100);
  });

  // Edit Form
  editForm = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    priority: ['medium'],
    status: ['active'],
    tags: [''], 
    dueDate: [null as string | null]
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchNote(id);
        this.fetchHistory(id); // Load history in background
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
    // Assuming you implemented getNoteHistory in service
    // If not, use getRecentActivity or rely on populated activityLog
    if (this.noteService.getNoteHistory) {
      this.noteService.getNoteHistory(id).subscribe(res => {
         this.activityLog.set(res.data.activityLog);
      });
    }
  }

  patchForm(note: Note) {
    this.editForm.patchValue({
      title: note.title,
      content: note.content,
      priority: note.priority,
      status: note.status,
      tags: note.tags?.join(', '),
      dueDate: note.dueDate ? new Date(note.dueDate).toISOString().split('T')[0] : null
    });
  }

  // --- Core Actions ---

  toggleEdit() {
    this.isEditing.update(v => !v);
    if (this.isEditing() && this.note()) this.patchForm(this.note()!);
  }

  saveChanges() {
    if (this.editForm.invalid || !this.note()) return;

    this.isSaving.set(true);
    const formVal = this.editForm.value;
    
    const updates: Partial<Note> = {
      ...formVal,
      tags: formVal.tags?.split(',').map(t => t.trim()).filter(Boolean) || []
    } as any;

    this.noteService.updateNote(this.note()!._id, updates).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.isEditing.set(false);
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }

  // --- Subtask Management (New APIs) ---

  addSubtask(input: HTMLInputElement) {
    const title = input.value.trim();
    if (!title || !this.note()) return;

    // Optimistic UI update could happen here
    this.noteService.addSubtask(this.note()!._id, title).subscribe(res => {
      this.note.set(res.data.note);
      input.value = ''; // Clear input
    });
  }

  toggleSubtask(subtask: Subtask) {
    if (!this.note()) return;
    // Assuming backend endpoint exists, otherwise update via updateNote
    this.noteService.toggleSubtask(this.note()!._id, subtask._id!, !subtask.completed)
      .subscribe(res => this.note.set(res.data.note));
  }

  deleteSubtask(subtaskId: string) {
    if(!confirm('Remove this task?')) return;
    this.noteService.removeSubtask(this.note()!._id, subtaskId)
      .subscribe(res => this.note.set(res.data.note));
  }

  // --- Special Actions (Archive, Duplicate, Restore) ---

  archiveNote() {
    this.noteService.archiveNote(this.note()!._id).subscribe(res => {
      this.note.set(res.data.note);
      this.router.navigate(['/notes']); // Or stay and show archived state
    });
  }

  restoreNote() {
    this.noteService.restoreNote(this.note()!._id).subscribe(res => {
      this.note.set(res.data.note);
    });
  }

  duplicateNote() {
    this.noteService.duplicateNote(this.note()!._id).subscribe(res => {
      this.router.navigate(['/notes', res.data.note._id]);
    });
  }

  deleteNote() {
    // If already in trash (soft deleted), perform hard delete
    if (this.isTrash()) {
      if (!confirm('Permanently delete? This cannot be undone.')) return;
      this.noteService.hardDeleteNote(this.note()!._id).subscribe(() => {
         this.router.navigate(['/notes']);
      });
    } else {
      // Soft Delete
      if (!confirm('Move to trash?')) return;
      this.noteService.deleteNote(this.note()!._id).subscribe(() => {
        this.router.navigate(['/notes']);
      });
    }
  }

  convertToTask() {
    console.log(this.note());
    this.noteService.convertToTask(this.note()!.id).subscribe(res => {
       this.note.set(res.data.note);
    });
  }

  handleRSVP(response: 'accepted' | 'declined') {
    if (!this.note()?.meetingId) return;
    this.noteService.rsvpToMeeting(this.note()!.meetingId!, response).subscribe(() => {
      alert(`You have ${response} the meeting.`);
    });
  }

  downloadAttachment(file: NoteAttachment) {
    window.open(file.url, '_blank');
  }
}

// import { Component, inject, signal, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Added RouterModule
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Note, NoteAttachment } from '../../../core/models/note.types';
// import { NoteService } from '../../../core/services/notes.service';

// @Component({
//   selector: 'app-note-detail',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterModule], // Required for routerLink
//   templateUrl: './note-detail.component.html',
//   styleUrls: ['./note-detail.component.scss']
// })
// export class NoteDetailComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private noteService = inject(NoteService);
//   private fb = inject(FormBuilder);

//   // State
//   note = signal<Note | null>(null);
//   isLoading = signal(true);
//   isEditing = signal(false);
//   isSaving = signal(false);

//   // Edit Form
//   editForm = this.fb.group({
//     title: ['', Validators.required],
//     content: ['', Validators.required],
//     priority: ['medium'],
//     status: ['active'],
//     tags: [''], 
//     dueDate: [null as string | null]
//   });

//   ngOnInit() {
//     // Angular router auto-unsubscribes from snapshot, but usually safer to subscribe to params if ID changes
//     // keeping snapshot for simplicity as per your request
//     const id = this.route.snapshot.paramMap.get('id');
//     if (id) this.fetchNote(id);
//   }

//   fetchNote(id: string) {
//     this.isLoading.set(true);
//     this.noteService.getNoteById(id).subscribe({
//       next: (res) => {
//         // Assuming res.data.note matches your structure
//         this.note.set(res.data.note);
//         this.patchForm(res.data.note);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.router.navigate(['/notes']);
//       }
//     });
//   }

//   patchForm(note: Note) {
//     this.editForm.patchValue({
//       title: note.title,
//       content: note.content,
//       priority: note.priority,
//       status: note.status,
//       tags: note.tags?.join(', '),
//       dueDate: note.dueDate ? new Date(note.dueDate).toISOString().split('T')[0] : null
//     });
//   }

//   toggleEdit() {
//     this.isEditing.update(v => !v);
//     if (this.isEditing() && this.note()) {
//       this.patchForm(this.note()!);
//     }
//   }

//   saveChanges() {
//     if (this.editForm.invalid || !this.note()) return;

//     this.isSaving.set(true);
//     const formVal = this.editForm.value;
    
//     const updates: Partial<any> = {
//       ...formVal,
//       tags: formVal.tags?.split(',').map(t => t.trim()).filter(Boolean) || []
//     };

//     this.noteService.updateNote(this.note()!._id, updates).subscribe({
//       next: (res) => {
//         this.note.set(res.data.note);
//         this.isEditing.set(false);
//         this.isSaving.set(false);
//       },
//       error: () => this.isSaving.set(false)
//     });
//   }

//   deleteNote() {
//     if (!confirm('Are you sure? This moves the note to trash.')) return;
//     this.noteService.deleteNote(this.note()!._id).subscribe(() => {
//       this.router.navigate(['/notes']);
//     });
//   }

//   handleRSVP(response: 'accepted' | 'declined') {
//     if (!this.note()?.meetingId) return;
//     this.noteService.rsvpToMeeting(this.note()!.meetingId!, response).subscribe(() => {
//       alert(`You have ${response} the meeting.`);
//     });
//   }

//   downloadAttachment(file: NoteAttachment) {
//     window.open(file.url, '_blank');
//   }
// }