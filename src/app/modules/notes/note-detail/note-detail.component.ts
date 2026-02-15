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
      tags: rawTags.split(',').map(t => t.trim()).filter(Boolean)
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

// import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { EditorModule } from 'primeng/editor';
// import { Note, NoteAttachment, Subtask, ActivityLog } from '../../../core/models/note.types';
// import { NoteService } from '../../../core/services/notes.service';
// import Quill from 'quill';

// @Component({
//   selector: 'app-note-detail',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterModule, EditorModule],
//   templateUrl: './note-detail.component.html',
//   styleUrls: ['./note-detail.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class NoteDetailComponent implements OnInit {
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

// // import { Component, inject, signal, computed, OnInit } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { EditorModule } from 'primeng/editor';
// // import { Note, NoteAttachment, Subtask, ActivityLog } from '../../../core/models/note.types';
// // import { NoteService } from '../../../core/services/notes.service';
// // import Quill from 'quill';

// // @Component({
// //   selector: 'app-note-detail',
// //   standalone: true,
// //   imports: [CommonModule, ReactiveFormsModule, RouterModule, EditorModule],
// //   template: `
// //     <div class="detail-container">

// //       <!-- ==================== LOADING OVERLAY ==================== -->
// //       @if (isLoading()) {
// //       <div class="loading-overlay">
// //         <div class="spinner"></div>
// //       </div>
// //       }

// //       @if (note(); as note) {

// //       <!-- ==================== SYSTEM BANNERS ==================== -->
// //       @if (isTrash()) {
// //       <div class="system-banner danger">
// //         <div class="banner-content">
// //           <i class="pi pi-trash"></i>
// //           <span>This note is in the trash. It will be permanently deleted in 30 days.</span>
// //         </div>
// //         <div class="banner-actions">
// //           <button class="btn-text" (click)="deleteNote()">Delete Forever</button>
// //           <button class="btn-solid" (click)="restoreNote()">Restore Note</button>
// //         </div>
// //       </div>
// //       }
// //       @if (isArchived()) {
// //       <div class="system-banner warning">
// //         <div class="banner-content">
// //           <i class="pi pi-box"></i>
// //           <span>This note is archived and read-only.</span>
// //         </div>
// //         <button class="btn-solid" (click)="restoreNote()">Unarchive</button>
// //       </div>
// //       }

// //       <!-- ==================== HEADER ==================== -->
// //       <header class="detail-header">
// //         <div class="left-nav">
// //           <button class="btn-back" routerLink="/notes">
// //             <i class="pi pi-arrow-left"></i> Back
// //           </button>
// //           <div class="breadcrumbs">
// //             <span class="crumb">Notes</span>
// //             <span class="separator">/</span>
// //             <span class="crumb active">{{ note.title }}</span>
// //           </div>
// //         </div>

// //         <div class="actions">
// //           @if (!isEditing()) {
// //             <span class="status-badge" [ngClass]="note.status">{{ note.status | titlecase }}</span>
            
// //             @if (!isTrash() && !isArchived()) {
// //               <button class="btn-icon" (click)="duplicateNote()" title="Duplicate Note">
// //                 <i class="pi pi-copy"></i>
// //               </button>
// //               <button class="btn-icon" (click)="convertToTask()" title="Convert to Task">
// //                 <i class="pi pi-check-square"></i>
// //               </button>
// //               <button class="btn-icon" (click)="archiveNote()" title="Archive">
// //                 <i class="pi pi-box"></i>
// //               </button>
// //               <div class="divider-v"></div>
// //               <button class="btn-primary" (click)="toggleEdit()">
// //                 <i class="pi pi-pencil"></i> Edit
// //               </button>
// //             }
// //           }

// //           @if (isEditing()) {
// //             <button class="btn-ghost" (click)="toggleEdit()">Cancel</button>
// //             <button class="btn-primary" (click)="saveChanges()" [disabled]="isSaving()">
// //               <i class="pi" [ngClass]="isSaving() ? 'pi-spin pi-spinner' : 'pi-check'"></i>
// //               {{ isSaving() ? 'Saving...' : 'Done' }}
// //             </button>
// //           }
// //         </div>
// //       </header>

// //       <div class="content-grid">

// //         <!-- ==================== MAIN DOCUMENT ==================== -->
// //         <main class="main-panel glass-panel" [class.editing]="isEditing()">

// //           <!-- READ MODE -->
// //           @if (!isEditing()) {
// //             <div class="read-view">
// //               <h1 class="note-title">{{ note.title }}</h1>

// //               <div class="meta-row">
// //                 <span class="priority-tag" [ngClass]="note.priority">
// //                   <i class="pi pi-flag"></i> {{ note.priority | titlecase }} Priority
// //                 </span>
// //                 <span class="meta-item">
// //                   <i class="pi pi-calendar"></i> {{ note.updatedAt | date:'mediumDate' }}
// //                 </span>
// //                 @if (note.noteType === 'meeting') {
// //                   <span class="meta-item highlight">
// //                     <i class="pi pi-video"></i> Meeting
// //                   </span>
// //                 }
// //               </div>

// //               <!-- Content Body -->
// //               <div class="note-body ql-editor" [innerHTML]="note.content"></div>

// //               <!-- Checklist / Subtasks -->
// //               <div class="subtasks-section">
// //                 <div class="section-header">
// //                   <h3>Checklist</h3>
// //                   @if (note.subtasks?.length) {
// //                     <span class="progress-text">{{ progress() }}% Done</span>
// //                   }
// //                 </div>

// //                 @if (note.subtasks?.length) {
// //                   <div class="progress-track">
// //                     <div class="progress-fill" [style.width.%]="progress()"></div>
// //                   </div>
// //                 }

// //                 <div class="subtask-list">
// //                   @for (task of note.subtasks; track task._id) {
// //                     <div class="subtask-item">
// //                       <label class="custom-checkbox">
// //                         <input type="checkbox" [checked]="task.completed" (change)="toggleSubtask(task)">
// //                         <span class="checkmark"></span>
// //                       </label>
// //                       <span class="task-text" [class.completed]="task.completed">{{ task.title }}</span>
// //                       <button class="btn-remove-task" (click)="deleteSubtask(task._id!)">
// //                         <i class="pi pi-times"></i>
// //                       </button>
// //                     </div>
// //                   }
// //                 </div>

// //                 <div class="add-subtask-row">
// //                   <i class="pi pi-plus"></i>
// //                   <input #taskInput type="text" placeholder="Add an item..." (keyup.enter)="addSubtask(taskInput)">
// //                 </div>
// //               </div>

// //               <!-- Linked References (Backlinks) -->
// //               <div class="linked-section">
// //                 <div class="section-header">
// //                   <h3>Linked References</h3>
// //                   <button class="btn-sm-action" (click)="openLinkDialog()">+ Link Note</button>
// //                 </div>
                
// //                 @if (note.relatedNotes?.length) {
// //                   <div class="links-grid">
// //                     @for (link of note.relatedNotes; track $any(link)._id) {
// //                       <!-- Assuming relatedNotes is populated by backend -->
// //                       <div class="link-card" routerLink="/notes/{{$any(link)._id}}">
// //                         <i class="pi pi-link"></i>
// //                         <span class="link-title">{{ $any(link).title || 'Untitled Note' }}</span>
// //                         <button class="btn-unlink" (click)="$event.stopPropagation(); unlinkNote($any(link)._id)">×</button>
// //                       </div>
// //                     }
// //                   </div>
// //                 } @else {
// //                   <p class="empty-text">No linked notes.</p>
// //                 }
// //               </div>

// //               <!-- Tags Footer -->
// //               @if (note.tags?.length) {
// //                 <div class="tags-footer">
// //                   @for (tag of note.tags; track tag) {
// //                     <span class="tag">#{{ tag }}</span>
// //                   }
// //                 </div>
// //               }
// //             </div>
// //           }

// //           <!-- EDIT MODE -->
// //           @if (isEditing()) {
// //             <form [formGroup]="editForm" class="edit-form">
// //               <div class="form-header">
// //                 <input type="text" formControlName="title" class="input-title-edit" placeholder="Note Title">
// //               </div>

// //               <div class="form-row">
// //                 <div class="field-group">
// //                   <label>Priority</label>
// //                   <select formControlName="priority" class="input-std">
// //                     <option value="low">Low</option>
// //                     <option value="medium">Medium</option>
// //                     <option value="high">High</option>
// //                     <option value="urgent">Urgent</option>
// //                   </select>
// //                 </div>
// //                 <div class="field-group">
// //                   <label>Date</label>
// //                   <input type="date" formControlName="startDate" class="input-std">
// //                 </div>
// //               </div>

// //               <div class="editor-container">
// //                 <p-editor formControlName="content" [style]="{ height: '400px' }">
// //                     <ng-template pTemplate="header">
// //                     <span class="ql-formats">
// //                       <button type="button" class="ql-bold"></button>
// //                       <button type="button" class="ql-italic"></button>
// //                       <button type="button" class="ql-underline"></button>
// //                     </span>
// //                     <span class="ql-formats">
// //                       <button type="button" class="ql-list" value="ordered"></button>
// //                       <button type="button" class="ql-list" value="bullet"></button>
// //                       <button type="button" class="ql-link"></button>
// //                       <button type="button" class="ql-code-block"></button>
// //                     </span>
// //                   </ng-template>
// //                 </p-editor>
// //               </div>
              
// //               <div class="form-row">
// //                  <div class="field-group full">
// //                     <label>Tags (comma separated)</label>
// //                     <input type="text" formControlName="tags" class="input-std">
// //                  </div>
// //               </div>
// //             </form>
// //           }

// //         </main>

// //         <!-- ==================== SIDEBAR ==================== -->
// //         <aside class="sidebar-panel">

// //           <!-- Meeting Widget -->
// //           @if (note.noteType === 'meeting') {
// //             <div class="widget glass-panel meeting-widget">
// //               <h3>Meeting Details</h3>
// //               <div class="info-row">
// //                 <i class="pi pi-map-marker"></i>
// //                 <span>{{ note.meetingDetails?.location || 'No location' }}</span>
// //               </div>
// //               <div class="info-row">
// //                 <i class="pi pi-video"></i>
// //                 <a [href]="note.meetingDetails?.videoLink" target="_blank" class="link">
// //                   {{ note.meetingDetails?.videoLink ? 'Join Call' : 'No Link' }}
// //                 </a>
// //               </div>
// //             </div>
// //           }

// //           <!-- Attachments -->
// //           <div class="widget glass-panel">
// //             <div class="widget-header">
// //               <h3>Attachments</h3>
// //               <span class="badge">{{ note.attachments.length || 0 }}</span>
// //             </div>
            
// //             @if (note.attachments.length) {
// //               <ul class="file-list">
// //                 @for (file of note.attachments; track file.fileName) {
// //                   <li (click)="downloadAttachment(file)">
// //                     <div class="file-icon-box">
// //                       <i class="pi pi-file"></i>
// //                     </div>
// //                     <div class="file-info">
// //                       <span class="name">{{ file.fileName }}</span>
// //                       <span class="size">{{ file.size / 1024 | number:'1.0-0' }} KB</span>
// //                     </div>
// //                   </li>
// //                 }
// //               </ul>
// //             } @else {
// //               <div class="empty-widget">No files attached</div>
// //             }
// //           </div>

// //           <!-- Collaborators -->
// //           <div class="widget glass-panel">
// //             <h3>Collaborators</h3>
// //             <div class="collaborators-list">
// //               <div class="collaborator-row">
// //                 <div class="avatar owner">{{ getInitials(note.owner?.name) }}</div>
// //                 <div class="collab-info">
// //                   <span class="name">{{ note.owner?.name || 'Unknown' }}</span>
// //                   <span class="role">Owner</span>
// //                 </div>
// //               </div>
// //               @for (p of note.participants; track p._id) {
// //                 <div class="collaborator-row">
// //                   <!-- Fixed: Safe navigation added to p.user -->
// //                   <div class="avatar">{{ getInitials(p.user?.name) }}</div>
// //                   <div class="collab-info">
// //                     <span class="name">{{ p.user?.name || 'Guest' }}</span>
// //                     <span class="role">{{ p.role }}</span>
// //                   </div>
// //                 </div>
// //               }
// //             </div>
// //           </div>

// //           <!-- History -->
// //           <div class="widget glass-panel history-widget">
// //             <h3>Activity Log</h3>
// //             <div class="activity-timeline">
// //               @for (log of activityLog(); track log.timestamp) {
// //                 <div class="timeline-item">
// //                   <div class="timeline-dot"></div>
// //                   <div class="timeline-content">
// //                     <p class="log-text">
// //                       <span class="user">{{ log.user?.name || 'System' }}</span>
// //                       {{ log.action }}
// //                     </p>
// //                     <span class="log-time">{{ log.timestamp | date:'shortTime' }}</span>
// //                   </div>
// //                 </div>
// //               }
// //               @if (activityLog().length === 0) {
// //                 <div class="empty-widget">No recent history</div>
// //               }
// //             </div>
// //           </div>

// //         </aside>
// //       </div>
// //       }

// //       @if (!isLoading() && !note()) {
// //       <div class="empty-state">
// //         <i class="pi pi-search" style="font-size: 3rem; opacity: 0.5;"></i>
// //         <h2>Note not found</h2>
// //         <button class="btn-primary" routerLink="/notes">Back to Library</button>
// //       </div>
// //       }

// //     </div>
// //   `,
// //   styles: [`
// //     :host {
// //       display: block;
// //       height: 100%;
// //       overflow-y: auto;
// //       background: var(--bg-ternary);
// //       color: var(--text-primary);
// //       --sidebar-w: 300px;
// //     }
// //     .ql-text-icon {
// //       font-weight: 700;
// //       font-size: 14px;
// //       color: var(--text-secondary);
// //     }
// //     .detail-container {
// //       max-width: 1300px;
// //       margin: 0 auto;
// //       padding: var(--spacing-xl);
// //       min-height: 100%;
// //     }

// //     /* ==================== BANNERS ==================== */
// //     .system-banner {
// //       display: flex; justify-content: space-between; align-items: center;
// //       padding: var(--spacing-md) var(--spacing-lg);
// //       border-radius: var(--ui-border-radius);
// //       margin-bottom: var(--spacing-lg);
// //       font-size: var(--font-size-sm);
// //       animation: slideDown 0.3s ease-out;

// //       .banner-content { display: flex; align-items: center; gap: 10px; font-weight: 500; }
// //       .banner-actions { display: flex; gap: 10px; }

// //       &.danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
// //       &.warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }

// //       .btn-solid {
// //         background: white; border: 1px solid rgba(0,0,0,0.1); padding: 4px 12px;
// //         border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; color: inherit;
// //         &:hover { box-shadow: var(--shadow-sm); }
// //       }
// //       .btn-text { background: none; border: none; text-decoration: underline; cursor: pointer; color: inherit; font-size: 11px; font-weight: 600; }
// //     }

// //     /* ==================== HEADER ==================== */
// //     .detail-header {
// //       display: flex; justify-content: space-between; align-items: center;
// //       margin-bottom: var(--spacing-lg);

// //       .left-nav {
// //         display: flex; align-items: center; gap: var(--spacing-lg);
        
// //         .btn-back {
// //           background: none; border: none; color: var(--text-secondary); 
// //           display: flex; align-items: center; gap: 6px; font-weight: 600; cursor: pointer;
// //           transition: transform 0.2s;
// //           &:hover { color: var(--text-primary); transform: translateX(-4px); }
// //         }

// //         .breadcrumbs {
// //           display: flex; gap: 8px; font-size: var(--font-size-sm); color: var(--text-tertiary);
// //           .active { color: var(--text-primary); font-weight: 500; }
// //         }
// //       }

// //       .actions {
// //         display: flex; align-items: center; gap: 8px;

// //         .status-badge {
// //           font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
// //           padding: 4px 10px; border-radius: 99px; background: var(--bg-secondary); 
// //           color: var(--text-tertiary); margin-right: 12px;
// //         }

// //         .divider-v { width: 1px; height: 24px; background: var(--border-secondary); margin: 0 4px; }

// //         .btn-icon {
// //           width: 36px; height: 36px; border-radius: var(--ui-border-radius); border: 1px solid var(--border-secondary);
// //           background: var(--bg-primary); color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
// //           transition: all 0.2s;
// //           &:hover { background: var(--bg-hover); color: var(--text-primary); transform: translateY(-2px); }
// //         }

// //         .btn-primary {
// //           background: var(--accent-primary); color: white; padding: 8px 20px; border-radius: var(--ui-border-radius);
// //           border: none; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: var(--shadow-md);
// //           &:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
// //           &:disabled { opacity: 0.7; cursor: not-allowed; }
// //         }
        
// //         .btn-ghost {
// //           background: none; border: none; color: var(--text-secondary); padding: 8px 16px; font-weight: 600; cursor: pointer;
// //           &:hover { color: var(--text-primary); background: var(--bg-hover); border-radius: var(--ui-border-radius); }
// //         }
// //       }
// //     }

// //     /* ==================== LAYOUT ==================== */
// //     .content-grid {
// //       display: grid;
// //       grid-template-columns: 1fr var(--sidebar-w);
// //       gap: var(--spacing-xl);
// //       align-items: start;
      
// //       @media (max-width: 1000px) { grid-template-columns: 1fr; }
// //     }

// //     /* ==================== MAIN PANEL ==================== */
// //     .main-panel {
// //       background: var(--bg-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       padding: var(--spacing-2xl);
// //       min-height: 70vh;
// //       box-shadow: var(--shadow-sm);
// //       border: 1px solid var(--border-secondary);
// //       position: relative;

// //       &.editing { border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-focus); }

// //       /* Read View Typography */
// //       .note-title { font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; margin-bottom: var(--spacing-lg); }
      
// //       .meta-row {
// //         display: flex; gap: var(--spacing-lg); margin-bottom: var(--spacing-2xl); padding-bottom: var(--spacing-lg);
// //         border-bottom: 1px solid var(--border-secondary);
        
// //         .priority-tag {
// //           font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;
// //           &.low { background: #f0fdf4; color: #166534; }
// //           &.medium { background: #eff6ff; color: #1e40af; }
// //           &.high { background: #fff7ed; color: #9a3412; }
// //           &.urgent { background: #fef2f2; color: #991b1b; }
// //         }
// //         .meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); font-weight: 500; 
// //           &.highlight { color: var(--accent-primary); }
// //         }
// //       }

// //       .note-body {
// //         font-size: 1rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: var(--spacing-3xl);
// //         /* Quill Override */
// //         &.ql-editor { padding: 0; overflow: visible; }
// //       }

// //       /* Subtasks */
// //       .subtasks-section {
// //         background: var(--bg-secondary); border-radius: var(--ui-border-radius); padding: var(--spacing-lg); margin-bottom: var(--spacing-2xl);
// //         .section-header {
// //           display: flex; justify-content: space-between; margin-bottom: 12px;
// //           h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary); }
// //           .progress-text { font-size: 11px; font-weight: 600; color: var(--accent-primary); }
// //         }
// //         .progress-track { height: 4px; background: var(--bg-ternary); border-radius: 2px; margin-bottom: 16px; overflow: hidden; }
// //         .progress-fill { height: 100%; background: var(--color-success); transition: width 0.3s; }
        
// //         .subtask-list { display: flex; flex-direction: column; gap: 8px; }
// //         .subtask-item {
// //           display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 6px; transition: background 0.1s;
// //           &:hover { background: var(--bg-ternary); .btn-remove-task { opacity: 1; } }
          
// //           .task-text { flex: 1; font-size: 14px; color: var(--text-primary); &.completed { text-decoration: line-through; color: var(--text-tertiary); } }
// //           .btn-remove-task { opacity: 0; border: none; background: none; color: var(--text-tertiary); cursor: pointer; &:hover { color: var(--color-error); } }
// //         }

// //         .add-subtask-row {
// //           margin-top: 12px; display: flex; align-items: center; gap: 10px; color: var(--text-tertiary);
// //           input { background: transparent; border: none; flex: 1; outline: none; font-size: 14px; color: var(--text-primary); &::placeholder { color: var(--text-tertiary); } }
// //         }
// //       }

// //       /* Links */
// //       .linked-section {
// //         margin-bottom: var(--spacing-2xl);
// //         .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; h3 { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; } .btn-sm-action { background: none; border: none; color: var(--accent-primary); font-size: 11px; font-weight: 600; cursor: pointer; &:hover { text-decoration: underline; } } }
// //         .links-grid { display: flex; flex-wrap: wrap; gap: 8px; }
// //         .link-card {
// //           display: flex; align-items: center; gap: 6px; background: var(--bg-ternary); padding: 6px 12px; border-radius: 20px; font-size: 12px; color: var(--text-secondary); cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
// //           &:hover { background: var(--bg-hover); color: var(--accent-primary); border-color: var(--accent-primary); }
// //           .btn-unlink { background: none; border: none; margin-left: 4px; font-size: 14px; color: var(--text-tertiary); cursor: pointer; &:hover { color: var(--color-error); } }
// //         }
// //         .empty-text { font-size: 12px; color: var(--text-tertiary); font-style: italic; }
// //       }

// //       /* Custom Checkbox */
// //       .custom-checkbox {
// //         position: relative; display: block; width: 18px; height: 18px; cursor: pointer;
// //         input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
// //         .checkmark { position: absolute; top: 0; left: 0; height: 18px; width: 18px; background-color: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 4px; }
// //         input:checked ~ .checkmark { background-color: var(--accent-primary); border-color: var(--accent-primary); }
// //         .checkmark:after { content: ""; position: absolute; display: none; left: 6px; top: 2px; width: 4px; height: 9px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
// //         input:checked ~ .checkmark:after { display: block; }
// //       }

// //       /* Tags */
// //       .tags-footer { display: flex; gap: 8px; margin-top: auto; padding-top: var(--spacing-xl); border-top: 1px solid var(--border-subtle); .tag { background: var(--bg-ternary); color: var(--text-secondary); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-family: var(--font-mono); } }
// //     }

// //     /* ==================== EDIT FORM ==================== */
// //     .edit-form {
// //       display: flex; flex-direction: column; gap: var(--spacing-lg);
// //       .input-title-edit { font-size: 2rem; font-weight: 700; background: var(--bg-secondary); border: 1px solid var(--border-secondary); padding: 12px; border-radius: var(--ui-border-radius); width: 100%; outline: none; &:focus { border-color: var(--accent-primary); } }
// //       .form-row { display: flex; gap: var(--spacing-lg); .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; } } .full { width: 100%; } }
// //       .input-std { padding: 10px; border-radius: var(--ui-border-radius); border: 1px solid var(--border-secondary); background: var(--bg-secondary); color: var(--text-primary); width: 100%; &:focus { border-color: var(--accent-primary); outline: none; } }
      
// //       /* PrimeNG Editor Overrides */
// //       ::ng-deep .p-editor-container {
// //         border-radius: var(--ui-border-radius); overflow: hidden; border: 1px solid var(--border-secondary);
// //         .p-editor-toolbar { background: var(--bg-secondary); border: none; border-bottom: 1px solid var(--border-secondary); 
// //           .ql-formats button svg .ql-stroke { stroke: var(--text-secondary); } 
// //         }
// //         .p-editor-content { background: var(--bg-primary); border: none; color: var(--text-primary); font-size: 14px; .ql-editor { padding: 16px; } }
// //       }
// //     }

// //     /* ==================== SIDEBAR ==================== */
// //     .sidebar-panel {
// //       display: flex; flex-direction: column; gap: var(--spacing-lg);

// //       .widget {
// //         background: var(--bg-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); border: 1px solid var(--border-secondary); box-shadow: var(--shadow-sm);
        
// //         h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 12px; letter-spacing: 0.05em; }
        
// //         &.meeting-widget {
// //           border-left: 3px solid var(--accent-primary);
// //           .info-row { display: flex; gap: 10px; font-size: 12px; margin-bottom: 8px; i { color: var(--text-tertiary); } .link { color: var(--accent-primary); font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } } }
// //         }

// //         .widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; h3 { margin: 0; } .badge { font-size: 10px; background: var(--bg-ternary); padding: 2px 6px; border-radius: 10px; } }
// //       }

// //       /* Attachments */
// //       .file-list li {
// //         display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s;
// //         &:hover { background: var(--bg-ternary); }
// //         .file-icon-box { width: 32px; height: 32px; background: var(--bg-secondary); border-radius: 6px; display: grid; place-items: center; color: var(--text-secondary); }
// //         .file-info { display: flex; flex-direction: column; .name { font-size: 12px; font-weight: 500; } .size { font-size: 10px; color: var(--text-tertiary); } }
// //       }

// //       /* Collaborators */
// //       .collaborator-row {
// //         display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
// //         .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--accent-secondary); color: white; display: grid; place-items: center; font-size: 11px; font-weight: 600; &.owner { background: var(--accent-primary); } }
// //         .collab-info { display: flex; flex-direction: column; .name { font-size: 12px; font-weight: 600; } .role { font-size: 10px; color: var(--text-tertiary); } }
// //       }

// //       /* History Timeline */
// //       .activity-timeline {
// //         position: relative; padding-left: 8px;
// //         .timeline-item {
// //           display: flex; gap: 12px; padding-bottom: 16px; position: relative;
// //           &:before { content: ''; position: absolute; left: 3px; top: 6px; bottom: 0; width: 1px; background: var(--border-secondary); }
// //           &:last-child:before { display: none; }
          
// //           .timeline-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-tertiary); margin-top: 6px; position: relative; z-index: 1; }
// //           .timeline-content {
// //             .log-text { font-size: 11px; color: var(--text-secondary); margin: 0; line-height: 1.3; .user { font-weight: 700; color: var(--text-primary); } }
// //             .log-time { font-size: 10px; color: var(--text-tertiary); }
// //           }
// //         }
// //       }
// //       .empty-widget { font-size: 12px; color: var(--text-placeholder); text-align: center; font-style: italic; padding: 10px; }
// //     }
// //     /* PrimeNG Editor Overrides */
// //     ::ng-deep .p-editor-container {
// //       border-radius: var(--ui-border-radius);
// //       overflow: hidden;
// //       border: 1px solid var(--border-secondary);
      
// //       .p-editor-toolbar {
// //         background: var(--bg-ternary);
// //         border: none;
// //         border-bottom: 1px solid var(--border-secondary);
// //         padding: 6px;

// //         /* Override SVG colors to match theme */
// //         .ql-formats button svg {
// //           .ql-stroke { stroke: var(--text-secondary); }
// //           .ql-fill { fill: var(--text-secondary); }
// //         }
        
// //         .ql-formats button:hover svg,
// //         .ql-formats button.ql-active svg {
// //           .ql-stroke { stroke: var(--accent-primary); }
// //           .ql-fill { fill: var(--accent-primary); }
// //         }
// //       }
      
// //       .p-editor-content {
// //         background: transparent;
// //         border: none;
// //         color: var(--text-primary);
// //         font-family: var(--font-body);
// //         font-size: 14px;
        
// //         .ql-editor { padding: 12px; min-height: 200px; }
// //         .ql-editor.ql-blank::before { color: var(--text-secondary); font-style: normal; opacity: 0.6; }
// //       }
// //     }
    

// //     /* Loading & Empty */
// //     .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); z-index: 100; display: grid; place-items: center; backdrop-filter: blur(4px); }
// //     .spinner { width: 40px; height: 40px; border: 3px solid var(--border-secondary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
// //     .empty-state { text-align: center; margin-top: 100px; color: var(--text-tertiary); h2 { color: var(--text-primary); margin: 10px 0 20px; } }
// //     @keyframes spin { to { transform: rotate(360deg); } }
// //     @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
// //   `]
// // })
// // export class NoteDetailComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private noteService = inject(NoteService);
// //   private fb = inject(FormBuilder);

// //   // --- State ---
// //   note = signal<Note | null>(null);
// //   activityLog = signal<ActivityLog[]>([]);
// //   isLoading = signal(true);
// //   isSaving = signal(false);
// //   isEditing = signal(false);

// //   // --- Computed ---
// //   isTrash = computed(() => this.note()?.isDeleted || false);
// //   isArchived = computed(() => this.note()?.status === 'archived');
  
// //   progress = computed(() => {
// //     const n = this.note();
// //     if (!n?.subtasks?.length) return 0;
// //     const completed = n.subtasks.filter(s => s.completed).length;
// //     return Math.round((completed / n.subtasks.length) * 100);
// //   });

// //   // --- Forms ---
// //   editForm = this.fb.group({
// //     title: ['', Validators.required],
// //     content: ['', Validators.required],
// //     priority: ['medium'],
// //     tags: [''],
// //     startDate: [null as string | null],
// //     dueDate: [null as string | null]
// //   });

// //   constructor() {
// //     this.customizeQuill();
// //   }

// //   ngOnInit() {
// //     this.route.paramMap.subscribe(params => {
// //       const id = params.get('id');
// //       if (id) {
// //         this.fetchNote(id);
// //         this.fetchHistory(id);
// //       }
// //     });
// //   }

// //   customizeQuill() {
// //     // This needs to run to actually change the icons
// //     const icons: any = Quill.import('ui/icons');
// //     if (icons) {
// //       icons.bold = '<i class="pi pi-bold"></i>';
// //       icons.italic = '<i class="pi pi-italic"></i>';
// //       icons.underline = '<i class="pi pi-underline"></i>';
// //       icons.list = {
// //         ordered: '<i class="pi pi-list"></i>',
// //         bullet: '<i class="pi pi-bars"></i>'
// //       };
// //       icons.link = '<i class="pi pi-link"></i>';
// //       icons['code-block'] = '<i class="pi pi-code"></i>';
// //     }
// //   }

// //   // Helper to safely get initials
// //   getInitials(name?: string): string {
// //     return name ? name.charAt(0).toUpperCase() : '?';
// //   }

// //   // --- Data ---
// //   fetchNote(id: string) {
// //     this.isLoading.set(true);
// //     this.noteService.getNoteById(id).subscribe({
// //       next: (res) => {
// //         this.note.set(res.data.note);
// //         this.patchForm(res.data.note);
// //         this.isLoading.set(false);
// //       },
// //       error: () => this.router.navigate(['/notes'])
// //     });
// //   }

// //   fetchHistory(id: string) {
// //     this.noteService.getNoteHistory(id).subscribe(res => {
// //       this.activityLog.set(res.data.activityLog);
// //     });
// //   }

// //   patchForm(note: Note) {
// //     let safeDate = null;
// //     if (note.startDate) {
// //       try {
// //         safeDate = new Date(note.startDate).toISOString().split('T')[0];
// //       } catch (e) {
// //         console.warn('Invalid start date', note.startDate);
// //       }
// //     }

// //     this.editForm.patchValue({
// //       title: note.title,
// //       content: note.content,
// //       priority: note.priority,
// //       tags: note.tags?.join(', '),
// //       startDate: safeDate
// //     });
// //   }

// //   // --- Actions ---
// //   toggleEdit() {
// //     this.isEditing.update(v => !v);
// //     if (this.isEditing() && this.note()) this.patchForm(this.note()!);
// //   }

// //   saveChanges() {
// //     if (this.editForm.invalid || !this.note()) return;
// //     this.isSaving.set(true);
    
// //     const updates = {
// //       ...this.editForm.value,
// //       tags: this.editForm.value.tags?.split(',').map(t => t.trim()).filter(Boolean) || []
// //     };

// //     this.noteService.updateNote(this.note()!._id, updates).subscribe({
// //       next: (res) => {
// //         this.note.set(res.data.note);
// //         this.isEditing.set(false);
// //         this.isSaving.set(false);
// //         this.fetchHistory(res.data.note._id); // Refresh history
// //       },
// //       error: () => this.isSaving.set(false)
// //     });
// //   }

// //   // --- Subtasks ---
// //   addSubtask(input: HTMLInputElement) {
// //     const val = input.value.trim();
// //     if (!val || !this.note()) return;
// //     this.noteService.addSubtask(this.note()!._id, val).subscribe(res => {
// //       this.note.set(res.data.note);
// //       input.value = '';
// //     });
// //   }

// //   toggleSubtask(subtask: Subtask) {
// //     if (!this.note()) return;
// //     this.noteService.toggleSubtask(this.note()!._id, subtask._id!, !subtask.completed)
// //       .subscribe(res => this.note.set(res.data.note));
// //   }

// //   deleteSubtask(id: string) {
// //     if (!this.note()) return;
// //     this.noteService.removeSubtask(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
// //   }

// //   // --- Linking ---
// //   openLinkDialog() {
// //     const id = prompt('Enter Note ID to link (Mock Dialog):');
// //     if (id && this.note()) {
// //       this.noteService.linkNote(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
// //     }
// //   }

// //   unlinkNote(targetId: string) {
// //     if(!confirm('Remove link?') || !this.note()) return;
// //     this.noteService.unlinkNote(this.note()!._id, targetId).subscribe(res => this.note.set(res.data.note));
// //   }

// //   // --- General ---
// //   duplicateNote() {
// //     if (!this.note()) return;
// //     this.noteService.duplicateNote(this.note()!._id).subscribe(res => {
// //       this.router.navigate(['/notes', res.data.note._id]);
// //     });
// //   }

// //   convertToTask() {
// //     if (!this.note()) return;
// //     this.noteService.convertToTask(this.note()!._id).subscribe(res => this.note.set(res.data.note));
// //   }

// //   archiveNote() {
// //     if (!this.note()) return;
// //     this.noteService.archiveNote(this.note()!._id).subscribe(res => this.note.set(res.data.note));
// //   }

// //   restoreNote() {
// //     if (!this.note()) return;
// //     // Check context: is it in trash or archive?
// //     if (this.isTrash()) {
// //       this.noteService.restoreFromTrash(this.note()!._id).subscribe(res => this.note.set(res.data.note));
// //     } else {
// //       this.noteService.restoreNote(this.note()!._id).subscribe(res => this.note.set(res.data.note));
// //     }
// //   }

// //   deleteNote() {
// //     if (!this.note()) return;
// //     if (this.isTrash()) {
// //       if(!confirm('Permanently delete?')) return;
// //       this.noteService.hardDeleteNote(this.note()!._id).subscribe(() => this.router.navigate(['/notes']));
// //     } else {
// //       this.noteService.deleteNote(this.note()!._id).subscribe(() => this.router.navigate(['/notes']));
// //     }
// //   }

// //   downloadAttachment(file: NoteAttachment) {
// //     if (file.url) window.open(file.url, '_blank');
// //   }
// // }

// // // import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // // import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// // // import { EditorModule } from 'primeng/editor';
// // // import { Note, NoteAttachment, Subtask, ActivityLog } from '../../../core/models/note.types';
// // // import { NoteService } from '../../../core/services/notes.service';
// // // import Quill from 'quill';

// // // @Component({
// // //   selector: 'app-note-detail',
// // //   standalone: true,
// // //   imports: [CommonModule, ReactiveFormsModule, RouterModule, EditorModule],
// // //   template: `
// // //     <div class="detail-container">

// // //       <!-- ==================== LOADING OVERLAY ==================== -->
// // //       @if (isLoading()) {
// // //       <div class="loading-overlay">
// // //         <div class="spinner"></div>
// // //       </div>
// // //       }

// // //       @if (note(); as note) {

// // //       <!-- ==================== SYSTEM BANNERS ==================== -->
// // //       @if (isTrash()) {
// // //       <div class="system-banner danger">
// // //         <div class="banner-content">
// // //           <i class="pi pi-trash"></i>
// // //           <span>This note is in the trash. It will be permanently deleted in 30 days.</span>
// // //         </div>
// // //         <div class="banner-actions">
// // //           <button class="btn-text" (click)="deleteNote()">Delete Forever</button>
// // //           <button class="btn-solid" (click)="restoreNote()">Restore Note</button>
// // //         </div>
// // //       </div>
// // //       }
// // //       @if (isArchived()) {
// // //       <div class="system-banner warning">
// // //         <div class="banner-content">
// // //           <i class="pi pi-box"></i>
// // //           <span>This note is archived and read-only.</span>
// // //         </div>
// // //         <button class="btn-solid" (click)="restoreNote()">Unarchive</button>
// // //       </div>
// // //       }

// // //       <!-- ==================== HEADER ==================== -->
// // //       <header class="detail-header">
// // //         <div class="left-nav">
// // //           <button class="btn-back" routerLink="/notes">
// // //             <i class="pi pi-arrow-left"></i> Back
// // //           </button>
// // //           <div class="breadcrumbs">
// // //             <span class="crumb">Notes</span>
// // //             <span class="separator">/</span>
// // //             <span class="crumb active">{{ note.title }}</span>
// // //           </div>
// // //         </div>

// // //         <div class="actions">
// // //           @if (!isEditing()) {
// // //             <span class="status-badge" [ngClass]="note.status">{{ note.status | titlecase }}</span>
            
// // //             @if (!isTrash() && !isArchived()) {
// // //               <button class="btn-icon" (click)="duplicateNote()" title="Duplicate Note">
// // //                 <i class="pi pi-copy"></i>
// // //               </button>
// // //               <button class="btn-icon" (click)="convertToTask()" title="Convert to Task">
// // //                 <i class="pi pi-check-square"></i>
// // //               </button>
// // //               <button class="btn-icon" (click)="archiveNote()" title="Archive">
// // //                 <i class="pi pi-box"></i>
// // //               </button>
// // //               <div class="divider-v"></div>
// // //               <button class="btn-primary" (click)="toggleEdit()">
// // //                 <i class="pi pi-pencil"></i> Edit
// // //               </button>
// // //             }
// // //           }

// // //           @if (isEditing()) {
// // //             <button class="btn-ghost" (click)="toggleEdit()">Cancel</button>
// // //             <button class="btn-primary" (click)="saveChanges()" [disabled]="isSaving()">
// // //               <i class="pi" [ngClass]="isSaving() ? 'pi-spin pi-spinner' : 'pi-check'"></i>
// // //               {{ isSaving() ? 'Saving...' : 'Done' }}
// // //             </button>
// // //           }
// // //         </div>
// // //       </header>

// // //       <div class="content-grid">

// // //         <!-- ==================== MAIN DOCUMENT ==================== -->
// // //         <main class="main-panel glass-panel" [class.editing]="isEditing()">

// // //           <!-- READ MODE -->
// // //           @if (!isEditing()) {
// // //             <div class="read-view">
// // //               <h1 class="note-title">{{ note.title }}</h1>

// // //               <div class="meta-row">
// // //                 <span class="priority-tag" [ngClass]="note.priority">
// // //                   <i class="pi pi-flag"></i> {{ note.priority | titlecase }} Priority
// // //                 </span>
// // //                 <span class="meta-item">
// // //                   <i class="pi pi-calendar"></i> {{ note.updatedAt | date:'mediumDate' }}
// // //                 </span>
// // //                 @if (note.noteType === 'meeting') {
// // //                   <span class="meta-item highlight">
// // //                     <i class="pi pi-video"></i> Meeting
// // //                   </span>
// // //                 }
// // //               </div>

// // //               <!-- Content Body -->
// // //               <div class="note-body ql-editor" [innerHTML]="note.content"></div>

// // //               <!-- Checklist / Subtasks -->
// // //               <div class="subtasks-section">
// // //                 <div class="section-header">
// // //                   <h3>Checklist</h3>
// // //                   @if (note.subtasks?.length) {
// // //                     <span class="progress-text">{{ progress() }}% Done</span>
// // //                   }
// // //                 </div>

// // //                 @if (note.subtasks?.length) {
// // //                   <div class="progress-track">
// // //                     <div class="progress-fill" [style.width.%]="progress()"></div>
// // //                   </div>
// // //                 }

// // //                 <div class="subtask-list">
// // //                   @for (task of note.subtasks; track task._id) {
// // //                     <div class="subtask-item">
// // //                       <label class="custom-checkbox">
// // //                         <input type="checkbox" [checked]="task.completed" (change)="toggleSubtask(task)">
// // //                         <span class="checkmark"></span>
// // //                       </label>
// // //                       <span class="task-text" [class.completed]="task.completed">{{ task.title }}</span>
// // //                       <button class="btn-remove-task" (click)="deleteSubtask(task._id!)">
// // //                         <i class="pi pi-times"></i>
// // //                       </button>
// // //                     </div>
// // //                   }
// // //                 </div>

// // //                 <div class="add-subtask-row">
// // //                   <i class="pi pi-plus"></i>
// // //                   <input #taskInput type="text" placeholder="Add an item..." (keyup.enter)="addSubtask(taskInput)">
// // //                 </div>
// // //               </div>

// // //               <!-- Linked References (Backlinks) -->
// // //               <div class="linked-section">
// // //                 <div class="section-header">
// // //                   <h3>Linked References</h3>
// // //                   <button class="btn-sm-action" (click)="openLinkDialog()">+ Link Note</button>
// // //                 </div>
                
// // //                 @if (note.relatedNotes?.length) {
// // //                   <div class="links-grid">
// // //                     @for (link of note.relatedNotes; track $any(link)._id) {
// // //                       <!-- Assuming relatedNotes is populated by backend -->
// // //                       <div class="link-card" routerLink="/notes/{{$any(link)._id}}">
// // //                         <i class="pi pi-link"></i>
// // //                         <span class="link-title">{{ $any(link).title || 'Untitled Note' }}</span>
// // //                         <button class="btn-unlink" (click)="$event.stopPropagation(); unlinkNote($any(link)._id)">×</button>
// // //                       </div>
// // //                     }
// // //                   </div>
// // //                 } @else {
// // //                   <p class="empty-text">No linked notes.</p>
// // //                 }
// // //               </div>

// // //               <!-- Tags Footer -->
// // //               @if (note.tags?.length) {
// // //                 <div class="tags-footer">
// // //                   @for (tag of note.tags; track tag) {
// // //                     <span class="tag">#{{ tag }}</span>
// // //                   }
// // //                 </div>
// // //               }
// // //             </div>
// // //           }

// // //           <!-- EDIT MODE -->
// // //           @if (isEditing()) {
// // //             <form [formGroup]="editForm" class="edit-form">
// // //               <div class="form-header">
// // //                 <input type="text" formControlName="title" class="input-title-edit" placeholder="Note Title">
// // //               </div>

// // //               <div class="form-row">
// // //                 <div class="field-group">
// // //                   <label>Priority</label>
// // //                   <select formControlName="priority" class="input-std">
// // //                     <option value="low">Low</option>
// // //                     <option value="medium">Medium</option>
// // //                     <option value="high">High</option>
// // //                     <option value="urgent">Urgent</option>
// // //                   </select>
// // //                 </div>
// // //                 <div class="field-group">
// // //                   <label>Date</label>
// // //                   <!-- Native date for simplicity in edit mode, or use p-calendar -->
// // //                   <input type="date" formControlName="startDate" class="input-std">
// // //                 </div>
// // //               </div>

// // //               <div class="editor-container">
// // //                 <p-editor formControlName="content" [style]="{ height: '400px' }">
// // //                     <ng-template pTemplate="header">
// // //                     <span class="ql-formats">
// // //                       <button type="button" class="ql-bold"></button>
// // //                       <button type="button" class="ql-italic"></button>
// // //                       <button type="button" class="ql-underline"></button>
// // //                     </span>
// // //                     <span class="ql-formats">
// // //                       <button type="button" class="ql-list" value="ordered"></button>
// // //                       <button type="button" class="ql-list" value="bullet"></button>
// // //                     </span>
// // //                   </ng-template>
// // //                 </p-editor>
// // //               </div>
              
// // //               <div class="form-row">
// // //                  <div class="field-group full">
// // //                     <label>Tags (comma separated)</label>
// // //                     <input type="text" formControlName="tags" class="input-std">
// // //                  </div>
// // //               </div>
// // //             </form>
// // //           }

// // //         </main>

// // //         <!-- ==================== SIDEBAR ==================== -->
// // //         <aside class="sidebar-panel">

// // //           <!-- Meeting Widget -->
// // //           @if (note.noteType === 'meeting') {
// // //             <div class="widget glass-panel meeting-widget">
// // //               <h3>Meeting Details</h3>
// // //               <div class="info-row">
// // //                 <i class="pi pi-map-marker"></i>
// // //                 <span>{{ note.meetingDetails?.location || 'No location' }}</span>
// // //               </div>
// // //               <div class="info-row">
// // //                 <i class="pi pi-video"></i>
// // //                 <a [href]="note.meetingDetails?.videoLink" target="_blank" class="link">
// // //                   {{ note.meetingDetails?.videoLink ? 'Join Call' : 'No Link' }}
// // //                 </a>
// // //               </div>
// // //             </div>
// // //           }

// // //           <!-- Attachments -->
// // //           <div class="widget glass-panel">
// // //             <div class="widget-header">
// // //               <h3>Attachments</h3>
// // //               <span class="badge">{{ note.attachments.length || 0 }}</span>
// // //             </div>
            
// // //             @if (note.attachments.length) {
// // //               <ul class="file-list">
// // //                 @for (file of note.attachments; track file.fileName) {
// // //                   <li (click)="downloadAttachment(file)">
// // //                     <div class="file-icon-box">
// // //                       <i class="pi pi-file"></i>
// // //                     </div>
// // //                     <div class="file-info">
// // //                       <span class="name">{{ file.fileName }}</span>
// // //                       <span class="size">{{ file.size / 1024 | number:'1.0-0' }} KB</span>
// // //                     </div>
// // //                   </li>
// // //                 }
// // //               </ul>
// // //             } @else {
// // //               <div class="empty-widget">No files attached</div>
// // //             }
// // //           </div>

// // //           <!-- Collaborators -->
// // //           <div class="widget glass-panel">
// // //             <h3>Collaborators</h3>
// // //             <div class="collaborators-list">
// // //               <div class="collaborator-row">
// // //                 <div class="avatar owner">{{ note.owner.name.charAt(0) || 'U' }}</div>
// // //                 <div class="collab-info">
// // //                   <span class="name">{{ note.owner.name || 'Unknown' }}</span>
// // //                   <span class="role">Owner</span>
// // //                 </div>
// // //               </div>
// // //              @for (p of note.participants; track p._id) {
// // //   <div class="collaborator-row">
// // //     <div class="avatar">{{ p.user.name.charAt(0) || '?' }}</div>
// // //     <div class="collab-info">
// // //       <span class="name">{{ p.user.name || 'Guest' }}</span>
// // //       <span class="role">{{ p.role }}</span>
// // //     </div>
// // //   </div>
// // // }

// // //             </div>
// // //           </div>

// // //           <!-- History -->
// // //           <div class="widget glass-panel history-widget">
// // //             <h3>Activity Log</h3>
// // //             <div class="activity-timeline">
// // //               @for (log of activityLog(); track log.timestamp) {
// // //                 <div class="timeline-item">
// // //                   <div class="timeline-dot"></div>
// // //                   <div class="timeline-content">
// // //                     <p class="log-text">
// // //                       <span class="user">{{ log.user?.name || 'System' }}</span>
// // //                       {{ log.action }}
// // //                     </p>
// // //                     <span class="log-time">{{ log.timestamp | date:'shortTime' }}</span>
// // //                   </div>
// // //                 </div>
// // //               }
// // //               @if (activityLog().length === 0) {
// // //                 <div class="empty-widget">No recent history</div>
// // //               }
// // //             </div>
// // //           </div>

// // //         </aside>
// // //       </div>
// // //       }

// // //       @if (!isLoading() && !note()) {
// // //       <div class="empty-state">
// // //         <i class="pi pi-search" style="font-size: 3rem; opacity: 0.5;"></i>
// // //         <h2>Note not found</h2>
// // //         <button class="btn-primary" routerLink="/notes">Back to Library</button>
// // //       </div>
// // //       }

// // //     </div>
// // //   `,
// // //   styles: [`
// // //     :host {
// // //       display: block;
// // //       height: 100%;
// // //       overflow-y: auto;
// // //       background: var(--bg-ternary);
// // //       color: var(--text-primary);
// // //       --sidebar-w: 300px;
// // //     }
// // //     .ql-text-icon {
// // //   font-weight: 700;
// // //   font-size: 14px;
// // //   color: var(--text-secondary);
// // // }
// // //     .detail-container {
// // //       max-width: 1300px;
// // //       margin: 0 auto;
// // //       padding: var(--spacing-xl);
// // //       min-height: 100%;
// // //     }

// // //     /* ==================== BANNERS ==================== */
// // //     .system-banner {
// // //       display: flex; justify-content: space-between; align-items: center;
// // //       padding: var(--spacing-md) var(--spacing-lg);
// // //       border-radius: var(--ui-border-radius);
// // //       margin-bottom: var(--spacing-lg);
// // //       font-size: var(--font-size-sm);
// // //       animation: slideDown 0.3s ease-out;

// // //       .banner-content { display: flex; align-items: center; gap: 10px; font-weight: 500; }
// // //       .banner-actions { display: flex; gap: 10px; }

// // //       &.danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
// // //       &.warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }

// // //       .btn-solid {
// // //         background: white; border: 1px solid rgba(0,0,0,0.1); padding: 4px 12px;
// // //         border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; color: inherit;
// // //         &:hover { box-shadow: var(--shadow-sm); }
// // //       }
// // //       .btn-text { background: none; border: none; text-decoration: underline; cursor: pointer; color: inherit; font-size: 11px; font-weight: 600; }
// // //     }

// // //     /* ==================== HEADER ==================== */
// // //     .detail-header {
// // //       display: flex; justify-content: space-between; align-items: center;
// // //       margin-bottom: var(--spacing-lg);

// // //       .left-nav {
// // //         display: flex; align-items: center; gap: var(--spacing-lg);
        
// // //         .btn-back {
// // //           background: none; border: none; color: var(--text-secondary); 
// // //           display: flex; align-items: center; gap: 6px; font-weight: 600; cursor: pointer;
// // //           transition: transform 0.2s;
// // //           &:hover { color: var(--text-primary); transform: translateX(-4px); }
// // //         }

// // //         .breadcrumbs {
// // //           display: flex; gap: 8px; font-size: var(--font-size-sm); color: var(--text-tertiary);
// // //           .active { color: var(--text-primary); font-weight: 500; }
// // //         }
// // //       }

// // //       .actions {
// // //         display: flex; align-items: center; gap: 8px;

// // //         .status-badge {
// // //           font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
// // //           padding: 4px 10px; border-radius: 99px; background: var(--bg-secondary); 
// // //           color: var(--text-tertiary); margin-right: 12px;
// // //         }

// // //         .divider-v { width: 1px; height: 24px; background: var(--border-secondary); margin: 0 4px; }

// // //         .btn-icon {
// // //           width: 36px; height: 36px; border-radius: var(--ui-border-radius); border: 1px solid var(--border-secondary);
// // //           background: var(--bg-primary); color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
// // //           transition: all 0.2s;
// // //           &:hover { background: var(--bg-hover); color: var(--text-primary); transform: translateY(-2px); }
// // //         }

// // //         .btn-primary {
// // //           background: var(--accent-primary); color: white; padding: 8px 20px; border-radius: var(--ui-border-radius);
// // //           border: none; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: var(--shadow-md);
// // //           &:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
// // //           &:disabled { opacity: 0.7; cursor: not-allowed; }
// // //         }
        
// // //         .btn-ghost {
// // //           background: none; border: none; color: var(--text-secondary); padding: 8px 16px; font-weight: 600; cursor: pointer;
// // //           &:hover { color: var(--text-primary); background: var(--bg-hover); border-radius: var(--ui-border-radius); }
// // //         }
// // //       }
// // //     }

// // //     /* ==================== LAYOUT ==================== */
// // //     .content-grid {
// // //       display: grid;
// // //       grid-template-columns: 1fr var(--sidebar-w);
// // //       gap: var(--spacing-xl);
// // //       align-items: start;
      
// // //       @media (max-width: 1000px) { grid-template-columns: 1fr; }
// // //     }

// // //     /* ==================== MAIN PANEL ==================== */
// // //     .main-panel {
// // //       background: var(--bg-primary);
// // //       border-radius: var(--ui-border-radius-xl);
// // //       padding: var(--spacing-2xl);
// // //       min-height: 70vh;
// // //       box-shadow: var(--shadow-sm);
// // //       border: 1px solid var(--border-secondary);
// // //       position: relative;

// // //       &.editing { border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-focus); }

// // //       /* Read View Typography */
// // //       .note-title { font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; margin-bottom: var(--spacing-lg); }
      
// // //       .meta-row {
// // //         display: flex; gap: var(--spacing-lg); margin-bottom: var(--spacing-2xl); padding-bottom: var(--spacing-lg);
// // //         border-bottom: 1px solid var(--border-secondary);
        
// // //         .priority-tag {
// // //           font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;
// // //           &.low { background: #f0fdf4; color: #166534; }
// // //           &.medium { background: #eff6ff; color: #1e40af; }
// // //           &.high { background: #fff7ed; color: #9a3412; }
// // //           &.urgent { background: #fef2f2; color: #991b1b; }
// // //         }
// // //         .meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); font-weight: 500; 
// // //           &.highlight { color: var(--accent-primary); }
// // //         }
// // //       }

// // //       .note-body {
// // //         font-size: 1rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: var(--spacing-3xl);
// // //         /* Quill Override */
// // //         &.ql-editor { padding: 0; overflow: visible; }
// // //       }

// // //       /* Subtasks */
// // //       .subtasks-section {
// // //         background: var(--bg-secondary); border-radius: var(--ui-border-radius); padding: var(--spacing-lg); margin-bottom: var(--spacing-2xl);
// // //         .section-header {
// // //           display: flex; justify-content: space-between; margin-bottom: 12px;
// // //           h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary); }
// // //           .progress-text { font-size: 11px; font-weight: 600; color: var(--accent-primary); }
// // //         }
// // //         .progress-track { height: 4px; background: var(--bg-ternary); border-radius: 2px; margin-bottom: 16px; overflow: hidden; }
// // //         .progress-fill { height: 100%; background: var(--color-success); transition: width 0.3s; }
        
// // //         .subtask-list { display: flex; flex-direction: column; gap: 8px; }
// // //         .subtask-item {
// // //           display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 6px; transition: background 0.1s;
// // //           &:hover { background: var(--bg-ternary); .btn-remove-task { opacity: 1; } }
          
// // //           .task-text { flex: 1; font-size: 14px; color: var(--text-primary); &.completed { text-decoration: line-through; color: var(--text-tertiary); } }
// // //           .btn-remove-task { opacity: 0; border: none; background: none; color: var(--text-tertiary); cursor: pointer; &:hover { color: var(--color-error); } }
// // //         }

// // //         .add-subtask-row {
// // //           margin-top: 12px; display: flex; align-items: center; gap: 10px; color: var(--text-tertiary);
// // //           input { background: transparent; border: none; flex: 1; outline: none; font-size: 14px; color: var(--text-primary); &::placeholder { color: var(--text-tertiary); } }
// // //         }
// // //       }

// // //       /* Links */
// // //       .linked-section {
// // //         margin-bottom: var(--spacing-2xl);
// // //         .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; h3 { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; } .btn-sm-action { background: none; border: none; color: var(--accent-primary); font-size: 11px; font-weight: 600; cursor: pointer; &:hover { text-decoration: underline; } } }
// // //         .links-grid { display: flex; flex-wrap: wrap; gap: 8px; }
// // //         .link-card {
// // //           display: flex; align-items: center; gap: 6px; background: var(--bg-ternary); padding: 6px 12px; border-radius: 20px; font-size: 12px; color: var(--text-secondary); cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
// // //           &:hover { background: var(--bg-hover); color: var(--accent-primary); border-color: var(--accent-primary); }
// // //           .btn-unlink { background: none; border: none; margin-left: 4px; font-size: 14px; color: var(--text-tertiary); cursor: pointer; &:hover { color: var(--color-error); } }
// // //         }
// // //         .empty-text { font-size: 12px; color: var(--text-tertiary); font-style: italic; }
// // //       }

// // //       /* Custom Checkbox */
// // //       .custom-checkbox {
// // //         position: relative; display: block; width: 18px; height: 18px; cursor: pointer;
// // //         input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
// // //         .checkmark { position: absolute; top: 0; left: 0; height: 18px; width: 18px; background-color: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 4px; }
// // //         input:checked ~ .checkmark { background-color: var(--accent-primary); border-color: var(--accent-primary); }
// // //         .checkmark:after { content: ""; position: absolute; display: none; left: 6px; top: 2px; width: 4px; height: 9px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
// // //         input:checked ~ .checkmark:after { display: block; }
// // //       }

// // //       /* Tags */
// // //       .tags-footer { display: flex; gap: 8px; margin-top: auto; padding-top: var(--spacing-xl); border-top: 1px solid var(--border-subtle); .tag { background: var(--bg-ternary); color: var(--text-secondary); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-family: var(--font-mono); } }
// // //     }

// // //     /* ==================== EDIT FORM ==================== */
// // //     .edit-form {
// // //       display: flex; flex-direction: column; gap: var(--spacing-lg);
// // //       .input-title-edit { font-size: 2rem; font-weight: 700; background: var(--bg-secondary); border: 1px solid var(--border-secondary); padding: 12px; border-radius: var(--ui-border-radius); width: 100%; outline: none; &:focus { border-color: var(--accent-primary); } }
// // //       .form-row { display: flex; gap: var(--spacing-lg); .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; } } .full { width: 100%; } }
// // //       .input-std { padding: 10px; border-radius: var(--ui-border-radius); border: 1px solid var(--border-secondary); background: var(--bg-secondary); color: var(--text-primary); width: 100%; &:focus { border-color: var(--accent-primary); outline: none; } }
      
// // //       /* PrimeNG Editor Overrides */
// // //       ::ng-deep .p-editor-container {
// // //         border-radius: var(--ui-border-radius); overflow: hidden; border: 1px solid var(--border-secondary);
// // //         .p-editor-toolbar { background: var(--bg-secondary); border: none; border-bottom: 1px solid var(--border-secondary); 
// // //           .ql-formats button svg .ql-stroke { stroke: var(--text-secondary); } 
// // //         }
// // //         .p-editor-content { background: var(--bg-primary); border: none; color: var(--text-primary); font-size: 14px; .ql-editor { padding: 16px; } }
// // //       }
// // //     }

// // //     /* ==================== SIDEBAR ==================== */
// // //     .sidebar-panel {
// // //       display: flex; flex-direction: column; gap: var(--spacing-lg);

// // //       .widget {
// // //         background: var(--bg-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); border: 1px solid var(--border-secondary); box-shadow: var(--shadow-sm);
        
// // //         h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 12px; letter-spacing: 0.05em; }
        
// // //         &.meeting-widget {
// // //           border-left: 3px solid var(--accent-primary);
// // //           .info-row { display: flex; gap: 10px; font-size: 12px; margin-bottom: 8px; i { color: var(--text-tertiary); } .link { color: var(--accent-primary); font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } } }
// // //         }

// // //         .widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; h3 { margin: 0; } .badge { font-size: 10px; background: var(--bg-ternary); padding: 2px 6px; border-radius: 10px; } }
// // //       }

// // //       /* Attachments */
// // //       .file-list li {
// // //         display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s;
// // //         &:hover { background: var(--bg-ternary); }
// // //         .file-icon-box { width: 32px; height: 32px; background: var(--bg-secondary); border-radius: 6px; display: grid; place-items: center; color: var(--text-secondary); }
// // //         .file-info { display: flex; flex-direction: column; .name { font-size: 12px; font-weight: 500; } .size { font-size: 10px; color: var(--text-tertiary); } }
// // //       }

// // //       /* Collaborators */
// // //       .collaborator-row {
// // //         display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
// // //         .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--accent-secondary); color: white; display: grid; place-items: center; font-size: 11px; font-weight: 600; &.owner { background: var(--accent-primary); } }
// // //         .collab-info { display: flex; flex-direction: column; .name { font-size: 12px; font-weight: 600; } .role { font-size: 10px; color: var(--text-tertiary); } }
// // //       }

// // //       /* History Timeline */
// // //       .activity-timeline {
// // //         position: relative; padding-left: 8px;
// // //         .timeline-item {
// // //           display: flex; gap: 12px; padding-bottom: 16px; position: relative;
// // //           &:before { content: ''; position: absolute; left: 3px; top: 6px; bottom: 0; width: 1px; background: var(--border-secondary); }
// // //           &:last-child:before { display: none; }
          
// // //           .timeline-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-tertiary); margin-top: 6px; position: relative; z-index: 1; }
// // //           .timeline-content {
// // //             .log-text { font-size: 11px; color: var(--text-secondary); margin: 0; line-height: 1.3; .user { font-weight: 700; color: var(--text-primary); } }
// // //             .log-time { font-size: 10px; color: var(--text-tertiary); }
// // //           }
// // //         }
// // //       }
// // //       .empty-widget { font-size: 12px; color: var(--text-placeholder); text-align: center; font-style: italic; padding: 10px; }
// // //     }
// // //     /* PrimeNG Editor Overrides */
// // //     ::ng-deep .p-editor-container {
// // //       border-radius: var(--ui-border-radius);
// // //       overflow: hidden;
// // //       border: 1px solid var(--border-secondary);
      
// // //       .p-editor-toolbar {
// // //         background: var(--bg-ternary);
// // //         border: none;
// // //         border-bottom: 1px solid var(--border-secondary);
// // //         padding: 6px;

// // //         /* Override SVG colors to match theme */
// // //         .ql-formats button svg {
// // //           .ql-stroke { stroke: var(--text-secondary); }
// // //           .ql-fill { fill: var(--text-secondary); }
// // //         }
        
// // //         .ql-formats button:hover svg,
// // //         .ql-formats button.ql-active svg {
// // //           .ql-stroke { stroke: var(--accent-primary); }
// // //           .ql-fill { fill: var(--accent-primary); }
// // //         }
// // //       }
      
// // //       .p-editor-content {
// // //         background: transparent;
// // //         border: none;
// // //         color: var(--text-primary);
// // //         font-family: var(--font-body);
// // //         font-size: 14px;
        
// // //         .ql-editor { padding: 12px; min-height: 200px; }
// // //         .ql-editor.ql-blank::before { color: var(--text-secondary); font-style: normal; opacity: 0.6; }
// // //       }
// // //     }
    

// // //     /* Loading & Empty */
// // //     .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); z-index: 100; display: grid; place-items: center; backdrop-filter: blur(4px); }
// // //     .spinner { width: 40px; height: 40px; border: 3px solid var(--border-secondary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
// // //     .empty-state { text-align: center; margin-top: 100px; color: var(--text-tertiary); h2 { color: var(--text-primary); margin: 10px 0 20px; } }
// // //     @keyframes spin { to { transform: rotate(360deg); } }
// // //     @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
// // //   `]
// // // })
// // // export class NoteDetailComponent implements OnInit {
// // //   private route = inject(ActivatedRoute);
// // //   private router = inject(Router);
// // //   private noteService = inject(NoteService);
// // //   private fb = inject(FormBuilder);

// // //   // --- State ---
// // //   note = signal<Note | null>(null);
// // //   activityLog = signal<ActivityLog[]>([]);
// // //   isLoading = signal(true);
// // //   isSaving = signal(false);
// // //   isEditing = signal(false);

// // //   // --- Computed ---
// // //   isTrash = computed(() => this.note()?.isDeleted || false);
// // //   isArchived = computed(() => this.note()?.status === 'archived');

// // //   progress = computed(() => {
// // //     const n = this.note();
// // //     if (!n?.subtasks?.length) return 0;
// // //     const completed = n.subtasks.filter(s => s.completed).length;
// // //     return Math.round((completed / n.subtasks.length) * 100);
// // //   });

// // //   // --- Forms ---
// // //   editForm = this.fb.group({
// // //     title: ['', Validators.required],
// // //     content: ['', Validators.required],
// // //     priority: ['medium'],
// // //     tags: [''],
// // //     startDate: [null as string | null],
// // //     dueDate: [null as string | null]
// // //   });

// // //   ngOnInit() {
// // //     this.route.paramMap.subscribe(params => {
// // //       const id = params.get('id');
// // //       if (id) {
// // //         this.fetchNote(id);
// // //         this.fetchHistory(id);
// // //       }
// // //     });
// // //   }
// // //   icons: any = Quill.import('ui/icons');

// // //   quill(): any {
// // //     this.icons.bold = '<i class="pi pi-bold"></i>';
// // //     this.icons.italic = '<i class="pi pi-italic"></i>';
// // //     this.icons.underline = '<i class="pi pi-underline"></i>';
// // //     this.icons.list = {
// // //       ordered: '<i class="pi pi-list"></i>',
// // //       bullet: '<i class="pi pi-bars"></i>'
// // //     };
// // //     this.icons.bold = '<span class="ql-text-icon">B</span>';
// // //     this.icons.italic = '<span class="ql-text-icon">I</span>';
// // //     this.icons.underline = '<span class="ql-text-icon">U</span>';
// // //     this.icons.link = '<i class="pi pi-link"></i>';
// // //     this.icons['code-block'] = '<i class="pi pi-code"></i>';
// // //   }
// // //   // --- Data ---
// // //   fetchNote(id: string) {
// // //     this.isLoading.set(true);
// // //     this.noteService.getNoteById(id).subscribe({
// // //       next: (res) => {
// // //         this.note.set(res.data.note);
// // //         this.patchForm(res.data.note);
// // //         this.isLoading.set(false);
// // //       },
// // //       error: () => this.router.navigate(['/notes'])
// // //     });
// // //   }

// // //   fetchHistory(id: string) {
// // //     this.noteService.getNoteHistory(id).subscribe(res => {
// // //       this.activityLog.set(res.data.activityLog);
// // //     });
// // //   }

// // //   patchForm(note: Note) {
// // //     this.editForm.patchValue({
// // //       title: note.title,
// // //       content: note.content,
// // //       priority: note.priority,
// // //       tags: note.tags?.join(', '),
// // //       startDate: note.startDate ? new Date(note.startDate).toISOString().split('T')[0] : null
// // //     });
// // //   }

// // //   // --- Actions ---
// // //   toggleEdit() {
// // //     this.isEditing.update(v => !v);
// // //     if (this.isEditing() && this.note()) this.patchForm(this.note()!);
// // //   }

// // //   saveChanges() {
// // //     if (this.editForm.invalid || !this.note()) return;
// // //     this.isSaving.set(true);

// // //     const updates = {
// // //       ...this.editForm.value,
// // //       tags: this.editForm.value.tags?.split(',').map(t => t.trim()).filter(Boolean) || []
// // //     };

// // //     this.noteService.updateNote(this.note()!._id, updates).subscribe({
// // //       next: (res) => {
// // //         this.note.set(res.data.note);
// // //         this.isEditing.set(false);
// // //         this.isSaving.set(false);
// // //         this.fetchHistory(res.data.note._id); // Refresh history
// // //       },
// // //       error: () => this.isSaving.set(false)
// // //     });
// // //   }

// // //   // --- Subtasks ---
// // //   addSubtask(input: HTMLInputElement) {
// // //     const val = input.value.trim();
// // //     if (!val || !this.note()) return;
// // //     this.noteService.addSubtask(this.note()!._id, val).subscribe(res => {
// // //       this.note.set(res.data.note);
// // //       input.value = '';
// // //     });
// // //   }

// // //   toggleSubtask(subtask: Subtask) {
// // //     if (!this.note()) return;
// // //     this.noteService.toggleSubtask(this.note()!._id, subtask._id!, !subtask.completed)
// // //       .subscribe(res => this.note.set(res.data.note));
// // //   }

// // //   deleteSubtask(id: string) {
// // //     if (!this.note()) return;
// // //     this.noteService.removeSubtask(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
// // //   }

// // //   // --- Linking ---
// // //   openLinkDialog() {
// // //     const id = prompt('Enter Note ID to link (Mock Dialog):');
// // //     if (id && this.note()) {
// // //       this.noteService.linkNote(this.note()!._id, id).subscribe(res => this.note.set(res.data.note));
// // //     }
// // //   }

// // //   unlinkNote(targetId: string) {
// // //     if (!confirm('Remove link?') || !this.note()) return;
// // //     this.noteService.unlinkNote(this.note()!._id, targetId).subscribe(res => this.note.set(res.data.note));
// // //   }

// // //   // --- General ---
// // //   duplicateNote() {
// // //     if (!this.note()) return;
// // //     this.noteService.duplicateNote(this.note()!._id).subscribe(res => {
// // //       this.router.navigate(['/notes', res.data.note._id]);
// // //     });
// // //   }

// // //   convertToTask() {
// // //     if (!this.note()) return;
// // //     this.noteService.convertToTask(this.note()!._id).subscribe(res => this.note.set(res.data.note));
// // //   }

// // //   archiveNote() {
// // //     if (!this.note()) return;
// // //     this.noteService.archiveNote(this.note()!._id).subscribe(res => this.note.set(res.data.note));
// // //   }

// // //   restoreNote() {
// // //     if (!this.note()) return;
// // //     // Check context: is it in trash or archive?
// // //     if (this.isTrash()) {
// // //       this.noteService.restoreFromTrash(this.note()!._id).subscribe(res => this.note.set(res.data.note));
// // //     } else {
// // //       this.noteService.restoreNote(this.note()!._id).subscribe(res => this.note.set(res.data.note));
// // //     }
// // //   }

// // //   deleteNote() {
// // //     if (!this.note()) return;
// // //     if (this.isTrash()) {
// // //       if (!confirm('Permanently delete?')) return;
// // //       this.noteService.hardDeleteNote(this.note()!._id).subscribe(() => this.router.navigate(['/notes']));
// // //     } else {
// // //       this.noteService.deleteNote(this.note()!._id).subscribe(() => this.router.navigate(['/notes']));
// // //     }
// // //   }

// // //   downloadAttachment(file: NoteAttachment) {
// // //     if (file.url) window.open(file.url, '_blank');
// // //   }
// // // }