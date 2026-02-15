import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { Note, NoteAttachment, Subtask, ActivityLog } from '../../../core/models/note.types';
import { NoteService } from '../../../core/services/notes.service';
import Quill from 'quill';

@Component({
  selector: 'app-note-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, EditorModule],
  templateUrl: './note-detail.component.html',
  styleUrls: ['./note-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteDetailComponent implements OnInit {
   private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noteService = inject(NoteService);
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

  constructor() {
    this.customizeQuill();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        // Reset state when navigating between notes
        this.isEditing.set(false);
        this.fetchNote(id);
        this.fetchHistory(id);
      }
    });
  }

  customizeQuill() {
    try {
      const icons: any = Quill.import('ui/icons');
      if (icons) {
        icons.bold = '<i class="pi pi-bold"></i>';
        icons.italic = '<i class="pi pi-italic"></i>';
        icons.underline = '<i class="pi pi-underline"></i>';
        icons.list = {
          ordered: '<i class="pi pi-list"></i>',
          bullet: '<i class="pi pi-bars"></i>'
        };
        icons.link = '<i class="pi pi-link"></i>';
        icons['code-block'] = '<i class="pi pi-code"></i>';
      }
    } catch (e) {
      console.warn('Quill icons could not be customized', e);
    }
  }

  // Helper to safely get initials
  getInitials(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  // --- Data ---
  fetchNote(id: string) {
    this.isLoading.set(true);
    this.noteService.getNoteById(id).subscribe({
      next: (res) => {
        this.note.set(res.data.note);
        this.patchForm(res.data.note);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/notes']);
      }
    });
  }

  fetchHistory(id: string) {
    this.noteService.getNoteHistory(id).subscribe(res => {
      this.activityLog.set(res.data.activityLog);
    });
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

  // --- Actions ---
  toggleEdit() {
    // If cancelling edit, reset form to current note state
    if (this.isEditing() && this.note()) {
      this.patchForm(this.note()!);
    }
    this.isEditing.update(v => !v);
  }

  saveChanges() {
    if (this.editForm.invalid || !this.note()) return;
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
        this.fetchHistory(res.data.note._id);
      },
      error: () => this.isSaving.set(false)
    });
  }

  // --- Subtasks ---
  addSubtask(input: HTMLInputElement) {
    const val = input.value.trim();
    if (!val || !this.note()) return;
    this.noteService.addSubtask(this.note()!._id, val).subscribe(res => {
      this.note.set(res.data.note);
      input.value = '';
    });
  }

  toggleSubtask(subtask: Subtask) {
    if (!this.note()) return;
    this.noteService.toggleSubtask(this.note()!._id, subtask._id!, !subtask.completed)
      .subscribe(res => this.note.set(res.data.note));
  }

  deleteSubtask(id: string) {
    if (!this.note()) return;
    this.noteService.removeSubtask(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
  }

  // --- Linking ---
  openLinkDialog() {
    const id = prompt('Enter Note ID to link (Mock Dialog):');
    if (id && this.note()) {
      this.noteService.linkNote(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
    }
  }

  unlinkNote(targetId: string) {
    if(!confirm('Remove link?') || !this.note()) return;
    this.noteService.unlinkNote(this.note()!._id, targetId).subscribe(res => this.note.set(res.data.note));
  }

  // --- General ---
  duplicateNote() {
    if (!this.note()) return;
    this.noteService.duplicateNote(this.note()!._id).subscribe(res => {
      this.router.navigate(['/notes', res.data.note._id]);
    });
  }

  convertToTask() {
    if (!this.note()) return;
    this.noteService.convertToTask(this.note()!._id).subscribe(res => this.note.set(res.data.note));
  }

  archiveNote() {
    if (!this.note()) return;
    this.noteService.archiveNote(this.note()!._id).subscribe(res => this.note.set(res.data.note));
  }

  restoreNote() {
    if (!this.note()) return;
    if (this.isTrash()) {
      this.noteService.restoreFromTrash(this.note()!._id).subscribe(res => this.note.set(res.data.note));
    } else {
      this.noteService.restoreNote(this.note()!._id).subscribe(res => this.note.set(res.data.note));
    }
  }

  deleteNote() {
    if (!this.note()) return;
    if (this.isTrash()) {
      if(!confirm('Permanently delete?')) return;
      this.noteService.hardDeleteNote(this.note()!._id).subscribe(() => this.router.navigate(['/notes']));
    } else {
      this.noteService.deleteNote(this.note()!._id).subscribe(() => this.router.navigate(['/notes']));
    }
  }

  downloadAttachment(file: NoteAttachment) {
    if (file.url) window.open(file.url, '_blank');
  }
}
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private noteService = inject(NoteService);
//   private fb = inject(FormBuilder);

//   // --- State ---
//   note = signal<Note | null>(null);
//   activityLog = signal<ActivityLog[]>([]);
//   isLoading = signal(true);
//   isSaving = signal(false);
//   isEditing = signal(false);

//   // --- Computed ---
//   isTrash = computed(() => this.note()?.isDeleted || false);
//   isArchived = computed(() => this.note()?.status === 'archived');
  
//   progress = computed(() => {
//     const n = this.note();
//     if (!n?.subtasks?.length) return 0;
//     const completed = n.subtasks.filter(s => s.completed).length;
//     return Math.round((completed / n.subtasks.length) * 100);
//   });

//   // --- Forms ---
//   editForm = this.fb.group({
//     title: ['', Validators.required],
//     content: ['', Validators.required],
//     priority: ['medium'],
//     tags: [''],
//     startDate: [null as string | null],
//     dueDate: [null as string | null]
//   });

//   constructor() {
//     this.customizeQuill();
//   }

//   ngOnInit() {
//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         // Reset state when navigating between notes
//         this.isEditing.set(false);
//         this.fetchNote(id);
//         this.fetchHistory(id);
//       }
//     });
//   }

//   customizeQuill() {
//     try {
//       const icons: any = Quill.import('ui/icons');
//       if (icons) {
//         icons.bold = '<i class="pi pi-bold"></i>';
//         icons.italic = '<i class="pi pi-italic"></i>';
//         icons.underline = '<i class="pi pi-underline"></i>';
//         icons.list = {
//           ordered: '<i class="pi pi-list"></i>',
//           bullet: '<i class="pi pi-bars"></i>'
//         };
//         icons.link = '<i class="pi pi-link"></i>';
//         icons['code-block'] = '<i class="pi pi-code"></i>';
//       }
//     } catch (e) {
//       console.warn('Quill icons could not be customized', e);
//     }
//   }

//   // Helper to safely get initials
//   getInitials(name?: string): string {
//     return name ? name.charAt(0).toUpperCase() : '?';
//   }

//   // --- Data ---
//   fetchNote(id: string) {
//     this.isLoading.set(true);
//     this.noteService.getNoteById(id).subscribe({
//       next: (res) => {
//         this.note.set(res.data.note);
//         this.patchForm(res.data.note);
//         this.isLoading.set(false);
//       },
//       error: () => {
//         this.isLoading.set(false);
//         this.router.navigate(['/notes']);
//       }
//     });
//   }

//   fetchHistory(id: string) {
//     this.noteService.getNoteHistory(id).subscribe(res => {
//       this.activityLog.set(res.data.activityLog);
//     });
//   }

//   patchForm(note: Note) {
//     const formatDate = (dateVal?: string | Date) => {
//       if (!dateVal) return null;
//       try {
//         return new Date(dateVal).toISOString().split('T')[0];
//       } catch (e) {
//         return null;
//       }
//     };

//     this.editForm.patchValue({
//       title: note.title,
//       content: note.content,
//       priority: note.priority,
//       tags: note.tags?.join(', ') || '',
//       startDate: formatDate(note.startDate),
//       dueDate: formatDate(note.dueDate)
//     });
//   }

//   // --- Actions ---
//   toggleEdit() {
//     // If cancelling edit, reset form to current note state
//     if (this.isEditing() && this.note()) {
//       this.patchForm(this.note()!);
//     }
//     this.isEditing.update(v => !v);
//   }

//   saveChanges() {
//     if (this.editForm.invalid || !this.note()) return;
//     this.isSaving.set(true);
    
//     const rawTags = this.editForm.get('tags')?.value || '';
//     const updates = {
//       ...this.editForm.value,
//       tags: rawTags.split(',').map(t => t.trim()).filter(Boolean)
//     };

//     this.noteService.updateNote(this.note()!._id, updates).subscribe({
//       next: (res) => {
//         this.note.set(res.data.note);
//         this.isEditing.set(false);
//         this.isSaving.set(false);
//         this.fetchHistory(res.data.note._id);
//       },
//       error: () => this.isSaving.set(false)
//     });
//   }

//   // --- Subtasks ---
//   addSubtask(input: HTMLInputElement) {
//     const val = input.value.trim();
//     if (!val || !this.note()) return;
//     this.noteService.addSubtask(this.note()!._id, val).subscribe(res => {
//       this.note.set(res.data.note);
//       input.value = '';
//     });
//   }

//   toggleSubtask(subtask: Subtask) {
//     if (!this.note()) return;
//     this.noteService.toggleSubtask(this.note()!._id, subtask._id!, !subtask.completed)
//       .subscribe(res => this.note.set(res.data.note));
//   }

//   deleteSubtask(id: string) {
//     if (!this.note()) return;
//     this.noteService.removeSubtask(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
//   }

//   // --- Linking ---
//   openLinkDialog() {
//     const id = prompt('Enter Note ID to link (Mock Dialog):');
//     if (id && this.note()) {
//       this.noteService.linkNote(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
//     }
//   }

//   unlinkNote(targetId: string) {
//     if(!confirm('Remove link?') || !this.note()) return;
//     this.noteService.unlinkNote(this.note()!._id, targetId).subscribe(res => this.note.set(res.data.note));
//   }

//   // --- General ---
//   duplicateNote() {
//     if (!this.note()) return;
//     this.noteService.duplicateNote(this.note()!._id).subscribe(res => {
//       this.router.navigate(['/notes', res.data.note._id]);
//     });
//   }

//   convertToTask() {
//     if (!this.note()) return;
//     this.noteService.convertToTask(this.note()!._id).subscribe(res => this.note.set(res.data.note));
//   }

//   archiveNote() {
//     if (!this.note()) return;
//     this.noteService.archiveNote(this.note()!._id).subscribe(res => this.note.set(res.data.note));
//   }

//   restoreNote() {
//     if (!this.note()) return;
//     if (this.isTrash()) {
//       this.noteService.restoreFromTrash(this.note()!._id).subscribe(res => this.note.set(res.data.note));
//     } else {
//       this.noteService.restoreNote(this.note()!._id).subscribe(res => this.note.set(res.data.note));
//     }
//   }

//   deleteNote() {
//     if (!this.note()) return;
//     if (this.isTrash()) {
//       if(!confirm('Permanently delete?')) return;
//       this.noteService.hardDeleteNote(this.note()!._id).subscribe(() => this.router.navigate(['/notes']));
//     } else {
//       this.noteService.deleteNote(this.note()!._id).subscribe(() => this.router.navigate(['/notes']));
//     }
//   }

//   downloadAttachment(file: NoteAttachment) {
//     if (file.url) window.open(file.url, '_blank');
//   }
// }
