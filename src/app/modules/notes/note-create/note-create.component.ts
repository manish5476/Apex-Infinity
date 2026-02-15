import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { EditorModule } from 'primeng/editor';
import { DatePickerModule } from 'primeng/datepicker';
import { NoteAttachment } from '../../../core/models/note.types';
import { NoteService } from '../../../core/services/notes.service';
import Quill from 'quill';

@Component({
  selector: 'app-note-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EditorModule, DatePickerModule],
templateUrl:'./note-create.component.html',
styleUrl:'./note-create.component.scss'

})
export class NoteCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private noteService = inject(NoteService);
  private router = inject(Router);
  icons: any = Quill.import('ui/icons');

  // --- State ---
  isSubmitting = signal(false);
  isUploading = signal(false);
  uploadedAttachments = signal<NoteAttachment[]>([]);
  participantsList = signal<string[]>([]); // Store participant emails

  // --- Static Data ---
  priorities = ['low', 'medium', 'high', 'urgent'];
  noteTypes = [
    { value: 'note', label: 'Note', icon: '📝' },
    { value: 'task', label: 'Task', icon: '✅' },
    { value: 'meeting', label: 'Meeting', icon: '📅' },
    { value: 'idea', label: 'Idea', icon: '💡' },
    { value: 'project', label: 'Project', icon: '🚀' }
  ];

  // --- Form ---
  noteForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    content: ['', [Validators.required]],
    noteType: ['note'],
    priority: ['medium'],
    tags: [''],
    startDate: [null as Date | null],
    dueDate: [null as Date | null],
    isTemplate: [false],
    
    // Nested Group for Meeting
    meetingDetails: this.fb.group({
      location: [''],
      videoLink: ['']
    }),

    // Subtasks Array
    subtasks: this.fb.array([])
  });

  get subtasks() {
    return this.noteForm.get('subtasks') as FormArray;
  }

  isTemplateMode() {
    return this.noteForm.get('isTemplate')?.value;
  }

  // --- Methods ---
  ngOnInit(): void {
    // Custom icons setup
    this.icons.bold = '<i class="pi pi-bold"></i>';
    this.icons.italic = '<i class="pi pi-italic"></i>';
    this.icons.underline = '<i class="pi pi-underline"></i>';
    this.icons.list = {
      ordered: '<i class="pi pi-list"></i>',
      bullet: '<i class="pi pi-bars"></i>'
    };
    this.icons.bold = '<span class="ql-text-icon">B</span>';
    this.icons.italic = '<span class="ql-text-icon">I</span>';
    this.icons.underline = '<span class="ql-text-icon">U</span>';
    this.icons.link = '<i class="pi pi-link"></i>';
    this.icons['code-block'] = '<i class="pi pi-code"></i>';
  }

  resetForm() {
    this.noteForm.reset({ noteType: 'note', priority: 'medium', isTemplate: false });
    this.uploadedAttachments.set([]);
    this.participantsList.set([]);
    this.subtasks.clear();
  }

  addSubtask() {
    const taskGroup = this.fb.group({
      title: ['', Validators.required],
      completed: [false]
    });
    this.subtasks.push(taskGroup);
  }

  removeSubtask(index: number) {
    this.subtasks.removeAt(index);
  }

  addParticipant(input: HTMLInputElement) {
    const email = input.value.trim();
    if (email && !this.participantsList().includes(email)) {
      this.participantsList.update(list => [...list, email]);
      input.value = '';
    }
  }

  removeParticipant(index: number) {
    this.participantsList.update(list => list.filter((_, i) => i !== index));
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.isUploading.set(true);
    const files = Array.from(input.files);

    this.noteService.uploadMedia(files).subscribe({
      next: (response) => {
        this.uploadedAttachments.update(curr => [...curr, ...response.data]);
        this.isUploading.set(false);
        input.value = ''; 
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isUploading.set(false);
      }
    });
  }

  removeAttachment(index: number) {
    this.uploadedAttachments.update(files => files.filter((_, i) => i !== index));
  }

  onSubmit() {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.noteForm.value;

    // Process Tags
    const tagArray = formVal.tags 
      ? formVal.tags.split(',').map(t => t.trim()).filter(Boolean) 
      : [];

    const isMeeting = formVal.noteType === 'meeting';

    // Construct Payload
    const payload: any = {
      ...formVal,
      tags: tagArray,
      attachments: this.uploadedAttachments(),
      // MOCK: Participants should ideally be objectIds if backend is strict, 
      // but if the backend accepts emails for invites, this works.
      // If NOT, we might need to resolve emails to UserIds first. 
      // For now, assume the backend handles email invites or loose references.
      participants: this.participantsList().map(email => ({ email, role: 'attendee' })), 
      
      isMeeting,
      subtasks: formVal.subtasks?.filter((t: any) => t.title)
    };

    // Date Handling
    if (payload.startDate instanceof Date) payload.startDate = payload.startDate.toISOString();
    if (payload.dueDate instanceof Date) payload.dueDate = payload.dueDate.toISOString();
    
    // MEETING FIX: Ensure meetingDetails has startTime/endTime for backend
    if (isMeeting) {
      if (!payload.meetingDetails) payload.meetingDetails = {};
      
      // Map root dates to meeting details
      payload.meetingDetails.startTime = payload.startDate || new Date().toISOString();
      // Default end time to start + 1 hour if not set
      if (payload.dueDate) {
        payload.meetingDetails.endTime = payload.dueDate;
      } else {
        const start = new Date(payload.meetingDetails.startTime);
        start.setHours(start.getHours() + 1);
        payload.meetingDetails.endTime = start.toISOString();
      }

      // Ensure locationType exists
      if (payload.meetingDetails.videoLink) {
        payload.meetingDetails.locationType = 'virtual';
      } else if (payload.meetingDetails.location) {
        payload.meetingDetails.locationType = 'physical';
      } else {
        payload.meetingDetails.locationType = 'virtual'; // Default
      }
    } else {
      // Remove empty meetingDetails if not a meeting
      if (!payload.meetingDetails?.location && !payload.meetingDetails?.videoLink) {
          delete payload.meetingDetails;
      }
    }

    if (payload.isTemplate) {
      this.noteService.createTemplate(payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    } else {
      this.noteService.createNote(payload).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
    }
  }

  handleSuccess() {
    this.isSubmitting.set(false);
    this.router.navigate(['/notes']);
  }

  handleError(err: any) {
    console.error(err);
    this.isSubmitting.set(false);
  }
}

// import { Component, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
// import { Router } from '@angular/router';
// import { EditorModule } from 'primeng/editor';
// import { DatePickerModule } from 'primeng/datepicker';
// import { NoteAttachment } from '../../../core/models/note.types';
// import { NoteService } from '../../../core/services/notes.service';
// import Quill from 'quill';



// @Component({
//   selector: 'app-note-create',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, EditorModule, DatePickerModule],
//   template: `
//     <div class="create-container">

//       <!-- Header -->
//       <header class="page-header">
//         <div class="header-content">
//           <h1 class="page-title">
//             {{ isTemplateMode() ? 'Create Template' : 'Create New Note' }}
//           </h1>
//           <p class="page-subtitle">
//             {{ isTemplateMode() ? 'Define a structure for future notes.' : 'Capture ideas, schedule meetings, or track tasks.' }}
//           </p>
//         </div>
//         <div class="actions">
//           <button class="btn-ghost" (click)="resetForm()">
//             <i class="pi pi-refresh"></i> Clear
//           </button>
//           <button class="btn-ghost danger" routerLink="/notes">
//             <i class="pi pi-times"></i> Cancel
//           </button>
//         </div>
//       </header>

//       <form [formGroup]="noteForm" (ngSubmit)="onSubmit()" class="glass-panel">
        
//         <!-- LEFT COLUMN: EDITOR -->
//         <div class="main-editor">
          
//           <!-- Title Input -->
//           <div class="form-group title-group">
//             <input type="text" formControlName="title" placeholder="Untitled Note..." class="input-title"
//               [class.error]="noteForm.get('title')?.invalid && noteForm.get('title')?.touched">
//             @if (noteForm.get('title')?.invalid && noteForm.get('title')?.touched) {
//               <span class="error-msg">Title is required</span>
//             }
//           </div>

//           <!-- Type Selector -->
//           <div class="type-tabs">
//             @for (type of noteTypes; track type.value) {
//               <label class="type-tab" [class.active]="noteForm.get('noteType')?.value === type.value">
//                 <input type="radio" formControlName="noteType" [value]="type.value" hidden>
//                 <span class="tab-icon">{{ type.icon }}</span>
//                 <span class="tab-label">{{ type.label }}</span>
//               </label>
//             }
//           </div>

//           <!-- Rich Text Editor -->
//           <div class="form-group content-wrapper">
//             <p-editor formControlName="content" [style]="{ height: '320px' }" placeholder="Start typing details...">
//               <ng-template pTemplate="header">
//                 <span class="ql-formats">
//                   <button type="button" class="ql-bold" aria-label="Bold"></button>
//                   <button type="button" class="ql-italic" aria-label="Italic"></button>
//                   <button type="button" class="ql-underline" aria-label="Underline"></button>
//                 </span>
//                 <span class="ql-formats">
//                   <button type="button" class="ql-list" value="ordered"></button>
//                   <button type="button" class="ql-list" value="bullet"></button>
//                 </span>
//                 <span class="ql-formats">
//                   <button type="button" class="ql-link"></button>
//                   <button type="button" class="ql-code-block"></button>
//                 </span>
//               </ng-template>
//             </p-editor>
//           </div>

//           <!-- Subtasks Section -->
//           <div class="subtasks-section">
//             <div class="section-header">
//               <label class="section-label"><i class="pi pi-check-square"></i> Checklist / Subtasks</label>
//               <button type="button" class="btn-text-action" (click)="addSubtask()">+ Add Item</button>
//             </div>
            
//             <div class="subtasks-list" formArrayName="subtasks">
//               @for (task of subtasks.controls; track i; let i = $index) {
//                 <div class="subtask-row" [formGroupName]="i">
//                   <input type="checkbox" formControlName="completed" class="checkbox-std">
//                   <input type="text" formControlName="title" placeholder="Task item..." class="input-std small">
//                   <button type="button" class="btn-icon-remove" (click)="removeSubtask(i)">×</button>
//                 </div>
//               }
//             </div>
//           </div>

//           <!-- Attachments List -->
//           @if (uploadedAttachments().length > 0) {
//             <div class="attachments-area">
//               <label class="section-label">Attachments</label>
//               <div class="file-grid">
//                 @for (file of uploadedAttachments(); track file; let i = $index) {
//                   <div class="attachment-pill">
//                     <span class="file-icon">📎</span>
//                     <div class="file-info">
//                       <span class="file-name">{{ file.fileName }}</span>
//                       <span class="file-size">{{ (file.size / 1024).toFixed(1) }} KB</span>
//                     </div>
//                     <button type="button" (click)="removeAttachment(i)" class="btn-remove">×</button>
//                   </div>
//                 }
//               </div>
//             </div>
//           }
//         </div>

//         <!-- RIGHT COLUMN: SIDEBAR -->
//         <div class="sidebar">

//           <!-- Template Toggle -->
//           <div class="sidebar-section">
//             <label class="checkbox-wrapper">
//               <input type="checkbox" formControlName="isTemplate">
//               <span class="label-text">Save as Template</span>
//             </label>
//           </div>

//           <!-- Priority -->
//           <div class="sidebar-section">
//             <label class="section-label">Priority</label>
//             <div class="priority-grid">
//               @for (p of priorities; track p) {
//                 <label class="priority-option" [class.selected]="noteForm.get('priority')?.value === p" [class]="p">
//                   <input type="radio" formControlName="priority" [value]="p" hidden>
//                   <span class="dot"></span> {{ p | titlecase }}
//                 </label>
//               }
//             </div>
//           </div>

//           <!-- Dates -->
//           <div class="sidebar-section">
//             <label class="section-label">Timeline</label>
//             <div class="date-group">
//               <div class="input-wrapper">
//                 <label class="sub-label">Start Date</label>
//                 <p-datepicker formControlName="startDate" 
//                               [showIcon]="true" 
//                               dateFormat="dd/mm/yy" 
//                               placeholder="Select date"
//                               styleClass="glass-date-picker"
//                               [showTime]="true">
//                 </p-datepicker>
//               </div>
//               <div class="input-wrapper">
//                 <label class="sub-label">Due Date</label>
//                 <p-datepicker formControlName="dueDate" 
//                               [showIcon]="true" 
//                               dateFormat="dd/mm/yy" 
//                               placeholder="Select date"
//                               styleClass="glass-date-picker"
//                               [showTime]="true">
//                 </p-datepicker>
//               </div>
//             </div>
//           </div>

//           <!-- Tags -->
//           <div class="sidebar-section">
//             <label class="section-label">Tags</label>
//             <input type="text" formControlName="tags" placeholder="e.g. #marketing, #v2" class="input-std">
//             <p class="help-text">Separate with commas</p>
//           </div>

//           <!-- Participants / Sharing -->
//           <div class="sidebar-section">
//             <label class="section-label">Participants</label>
//             <div class="participants-input">
//               <input type="text" #participantInput placeholder="Add by email..." class="input-std" (keydown.enter)="$event.preventDefault(); addParticipant(participantInput)">
//               <button type="button" class="btn-icon-add" (click)="addParticipant(participantInput)">+</button>
//             </div>
//             <div class="participants-list">
//               @for (p of participantsList(); track p; let i = $index) {
//                 <div class="participant-chip">
//                   <span>{{ p }}</span>
//                   <button type="button" (click)="removeParticipant(i)">×</button>
//                 </div>
//               }
//             </div>
//           </div>

//           <!-- Conditional: Meeting Info -->
//           @if (noteForm.get('noteType')?.value === 'meeting') {
//             <div class="sidebar-section highlight-section" formGroupName="meetingDetails">
//               <label class="section-label">Meeting Details</label>
//               <div class="form-row">
//                 <i class="pi pi-map-marker"></i>
//                 <input type="text" formControlName="location" placeholder="Location / Room" class="input-std">
//               </div>
//               <div class="form-row">
//                 <i class="pi pi-video"></i>
//                 <input type="text" formControlName="videoLink" placeholder="Video Link (Zoom/Meet)" class="input-std">
//               </div>
//             </div>
//           }

//           <!-- Upload -->
//           <div class="sidebar-section">
//             <label class="section-label">Add Files</label>
//             <label class="btn-upload" [class.loading]="isUploading()">
//               <input type="file" multiple (change)="onFileSelected($event)" hidden>
//               <i class="pi" [class.pi-cloud-upload]="!isUploading()" [class.pi-spin]="isUploading()" [class.pi-spinner]="isUploading()"></i>
//               <span>{{ isUploading() ? 'Uploading...' : 'Upload Attachments' }}</span>
//             </label>
//           </div>

//           <!-- Footer Actions -->
//           <div class="sidebar-footer">
//             <button type="submit" class="btn-primary" [disabled]="noteForm.invalid || isSubmitting() || isUploading()">
//               <i class="pi pi-check" *ngIf="!isSubmitting()"></i>
//               <i class="pi pi-spin pi-spinner" *ngIf="isSubmitting()"></i>
//               {{ isSubmitting() ? 'Saving...' : (isTemplateMode() ? 'Save Template' : 'Create Note') }}
//             </button>
//           </div>

//         </div>
//       </form>
//     </div>
//   `,
//   styles: [`
//     /* ==================== STYLES ==================== */
//     :host {
//       display: block;
//       width: 100%;
//       height: 100%;
//       padding: var(--spacing-2xl);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//       overflow-y: auto;
//     }

//     .ql-text-icon {
//   font-weight: 700;
//   font-size: 14px;
//   color: var(--text-secondary);
// }


//     .create-container {
//       max-width: 1100px;
//       margin: 0 auto;
//       padding-bottom: 60px;
//     }

//     /* --- Header --- */
//     .page-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-xl);

//       .page-title {
//         font-family: var(--font-heading);
//         font-size: var(--font-size-3xl);
//         font-weight: 700;
//         color: var(--text-primary);
//         margin: 0 0 4px 0;
//       }
//       .page-subtitle {
//         color: var(--text-secondary);
//         font-size: var(--font-size-sm);
//         margin: 0;
//       }
//       .actions { display: flex; gap: var(--spacing-md); }
//     }

//     /* --- Main Layout --- */
//     .glass-panel {
//       display: grid;
//       grid-template-columns: 1fr 320px;
//       gap: var(--spacing-2xl);
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-secondary);
//       box-shadow: var(--shadow-xl);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-2xl);
      
//       @media (max-width: 900px) { grid-template-columns: 1fr; }
//     }

//     /* --- Left Column: Editor --- */
//     .main-editor {
//       display: flex; flex-direction: column; gap: var(--spacing-lg);
//     }

//     .input-title {
//       width: 100%;
//       background: transparent;
//       border: none;
//       font-family: var(--font-heading);
//       font-size: var(--font-size-4xl);
//       font-weight: 700;
//       color: var(--text-primary);
//       padding: var(--spacing-sm) 0;
//       outline: none;
//       transition: border-color 0.2s;
//       &::placeholder { color: var(--text-secondary); opacity: 0.4; }
//       &.error { border-bottom: 2px solid var(--color-error); }
//     }
//     .error-msg { color: var(--color-error); font-size: 11px; margin-top: 4px; }

//     /* Type Tabs */
//     .type-tabs {
//       display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;
      
//       .type-tab {
//         display: flex; align-items: center; gap: 6px;
//         padding: 6px 12px;
//         border-radius: var(--ui-border-radius);
//         font-size: var(--font-size-sm);
//         font-weight: 500;
//         cursor: pointer;
//         background: var(--bg-ternary);
//         color: var(--text-secondary);
//         border: 1px solid transparent;
//         transition: all 0.2s;

//         &:hover { background: var(--bg-hover); color: var(--text-primary); }
//         &.active {
//           background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
//           color: var(--accent-primary);
//           border-color: color-mix(in srgb, var(--accent-primary) 20%, transparent);
//         }
//       }
//     }

//     /* Subtasks */
//     .subtasks-section {
//       background: var(--bg-ternary);
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius);
      
//       .section-header {
//         display: flex; justify-content: space-between; margin-bottom: 8px;
//         .btn-text-action { background: none; border: none; color: var(--accent-primary); font-size: 11px; font-weight: 600; cursor: pointer; &:hover { text-decoration: underline; } }
//       }
      
//       .subtasks-list { display: flex; flex-direction: column; gap: 6px; }
      
//       .subtask-row {
//         display: flex; align-items: center; gap: 8px;
//         .checkbox-std { width: 16px; height: 16px; accent-color: var(--accent-primary); }
//         .btn-icon-remove { background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 16px; &:hover { color: var(--color-error); } }
//       }
//     }

//     /* Attachments */
//     .attachments-area {
//       margin-top: var(--spacing-md);
//       .file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-top: 8px; }
      
//       .attachment-pill {
//         display: flex; align-items: center; gap: 8px;
//         background: var(--bg-ternary);
//         padding: 6px 10px;
//         border-radius: var(--ui-border-radius);
//         border: 1px solid var(--border-secondary);
//         font-size: 11px;
        
//         .file-info { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
//         .file-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; color: var(--text-primary); }
//         .file-size { color: var(--text-tertiary); font-size: 9px; }
//         .btn-remove { background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 14px; &:hover { color: var(--color-error); } }
//       }
//     }

//     /* --- Right Column: Sidebar --- */
//     .sidebar {
//       border-left: 1px solid var(--border-secondary);
//       padding-left: var(--spacing-xl);
//       display: flex; flex-direction: column; gap: var(--spacing-xl);
      
//       @media (max-width: 900px) { border-left: none; padding-left: 0; border-top: 1px solid var(--border-secondary); padding-top: var(--spacing-xl); }
//     }

//     .sidebar-section {
//       display: flex; flex-direction: column; gap: 8px;
//       &.highlight-section { background: color-mix(in srgb, var(--accent-primary) 5%, transparent); padding: 10px; border-radius: var(--ui-border-radius); border: 1px dashed var(--accent-primary); }
      
//       .section-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); letter-spacing: 0.5px; }
//       .help-text { font-size: 10px; color: var(--text-tertiary); margin: 0; }
//     }

//     /* Checkbox Wrapper */
//     .checkbox-wrapper {
//       display: flex; align-items: center; gap: 8px; cursor: pointer;
//       input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent-primary); }
//       .label-text { font-size: 12px; font-weight: 600; color: var(--text-primary); }
//     }

//     /* Priority Grid */
//     .priority-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
//     .priority-option {
//       display: flex; align-items: center; gap: 6px; padding: 6px 8px;
//       border-radius: var(--ui-border-radius); font-size: 11px; cursor: pointer;
//       background: var(--bg-ternary); border: 1px solid transparent; color: var(--text-secondary);
      
//       .dot { width: 6px; height: 6px; border-radius: 50%; }
//       &.low .dot { background: #10b981; }
//       &.medium .dot { background: #3b82f6; }
//       &.high .dot { background: #f59e0b; }
//       &.urgent .dot { background: #ef4444; }

//       &:hover { background: var(--bg-hover); }
//       &.selected {
//         font-weight: 600; color: var(--text-primary); border-color: var(--border-primary);
//         background: var(--bg-primary); box-shadow: var(--shadow-sm);
//       }
//     }

//     /* Participants Input */
//     .participants-input {
//       display: flex; gap: 4px;
//       input { flex: 1; }
//       .btn-icon-add { background: var(--bg-ternary); border: 1px solid var(--border-secondary); width: 32px; border-radius: 4px; cursor: pointer; &:hover { background: var(--bg-hover); } }
//     }
//     .participants-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
//     .participant-chip {
//       background: var(--bg-ternary); padding: 2px 8px; border-radius: 12px; font-size: 10px; display: flex; align-items: center; gap: 4px; border: 1px solid var(--border-secondary);
//       button { background: none; border: none; font-size: 14px; cursor: pointer; line-height: 1; color: var(--text-tertiary); &:hover { color: var(--color-error); } }
//     }

//     /* Inputs */
//     .input-std {
//       width: 100%; padding: 8px 10px; background: var(--bg-primary); border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius); color: var(--text-primary); font-size: 12px; outline: none;
//       transition: all 0.2s;
//       &:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-focus); }
//       &.small { padding: 4px 8px; font-size: 11px; }
//     }

//     .form-row { display: flex; align-items: center; gap: 8px; i { color: var(--text-tertiary); font-size: 12px; } }

//     /* Datepicker Overrides (Deep) */
//     ::ng-deep .glass-date-picker {
//       width: 100%;
//       .p-datepicker-input { 
//         background: var(--bg-primary); border: 1px solid var(--border-secondary); color: var(--text-primary); 
//         padding: 8px; font-size: 12px; border-radius: var(--ui-border-radius); width: 100%;
//         &:focus { border-color: var(--accent-primary); }
//       }
//     }

//     /* Buttons */
//     .btn-upload {
//       display: flex; align-items: center; justify-content: center; gap: 8px;
//       padding: 10px; border: 1px dashed var(--border-secondary); border-radius: var(--ui-border-radius);
//       color: var(--text-secondary); font-size: 12px; cursor: pointer; transition: all 0.2s;
//       &:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: var(--bg-ternary); }
//       &.loading { opacity: 0.7; cursor: wait; }
//     }

//     .btn-primary {
//       width: 100%; padding: 10px; background: var(--accent-primary); color: white; border: none;
//       border-radius: var(--ui-border-radius); font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
//       &:hover:not(:disabled) { background: var(--accent-hover); box-shadow: var(--shadow-md); }
//       &:disabled { opacity: 0.6; cursor: not-allowed; }
//     }

//     .btn-ghost {
//       background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 10px; border-radius: var(--ui-border-radius);
//       &:hover { background: var(--bg-ternary); color: var(--text-primary); }
//       &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
//     }

//     /* PrimeNG Editor Overrides */
//     ::ng-deep .p-editor-container {
//       border-radius: var(--ui-border-radius);
//       overflow: hidden;
//       border: 1px solid var(--border-secondary);
      
//       .p-editor-toolbar {
//         background: var(--bg-ternary);
//         border: none;
//         border-bottom: 1px solid var(--border-secondary);
//         padding: 6px;

//         /* Override SVG colors to match theme */
//         .ql-formats button svg {
//           .ql-stroke { stroke: var(--text-secondary); }
//           .ql-fill { fill: var(--text-secondary); }
//         }
        
//         .ql-formats button:hover svg,
//         .ql-formats button.ql-active svg {
//           .ql-stroke { stroke: var(--accent-primary); }
//           .ql-fill { fill: var(--accent-primary); }
//         }
//       }
      
//       .p-editor-content {
//         background: transparent;
//         border: none;
//         color: var(--text-primary);
//         font-family: var(--font-body);
//         font-size: 14px;
        
//         .ql-editor { padding: 12px; min-height: 200px; }
//         .ql-editor.ql-blank::before { color: var(--text-secondary); font-style: normal; opacity: 0.6; }
//       }
//     }
//   `]
// })
// export class NoteCreateComponent {
//   private fb = inject(FormBuilder);
//   private noteService = inject(NoteService);
//   private router = inject(Router);
//  icons :any= Quill.import('ui/icons');

//   // --- State ---
//   isSubmitting = signal(false);
//   isUploading = signal(false);
//   uploadedAttachments = signal<NoteAttachment[]>([]);
//   participantsList = signal<string[]>([]); // Store participant emails

//   // --- Static Data ---
//   priorities = ['low', 'medium', 'high', 'urgent'];
//   noteTypes = [
//     { value: 'note', label: 'Note', icon: '📝' },
//     { value: 'task', label: 'Task', icon: '✅' },
//     { value: 'meeting', label: 'Meeting', icon: '📅' },
//     { value: 'idea', label: 'Idea', icon: '💡' },
//     { value: 'project', label: 'Project', icon: '🚀' }
//   ];


//   // --- Form ---
//   noteForm = this.fb.group({
//     title: ['', [Validators.required, Validators.maxLength(100)]],
//     content: ['', [Validators.required]],
//     noteType: ['note'],
//     priority: ['medium'],
//     tags: [''],
//     startDate: [null as Date | null],
//     dueDate: [null as Date | null],
//     isTemplate: [false], // New: Template Toggle
    
//     // Nested Group for Meeting
//     meetingDetails: this.fb.group({
//       location: [''],
//       videoLink: ['']
//     }),

//     // Subtasks Array
//     subtasks: this.fb.array([])
//   });

//   get subtasks() {
//     return this.noteForm.get('subtasks') as FormArray;
//   }

//   isTemplateMode() {
//     return this.noteForm.get('isTemplate')?.value;
//   }

//   // --- Methods ---

//   ngOnInit(): void {
//     //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
//     //Add 'implements OnInit' to the class.
//     this.icons.bold = '<i class="pi pi-bold"></i>';
// this.icons.italic = '<i class="pi pi-italic"></i>';
// this.icons.underline = '<i class="pi pi-underline"></i>';

// this.icons.list = {
//   ordered: '<i class="pi pi-list"></i>',
//   bullet: '<i class="pi pi-bars"></i>'
// };
// this.icons.bold = '<span class="ql-text-icon">B</span>';
// this.icons.italic = '<span class="ql-text-icon">I</span>';
// this.icons.underline = '<span class="ql-text-icon">U</span>';


// this.icons.link = '<i class="pi pi-link"></i>';
// this.icons['code-block'] = '<i class="pi pi-code"></i>';

//   }
//   resetForm() {
//     this.noteForm.reset({ noteType: 'note', priority: 'medium', isTemplate: false });
//     this.uploadedAttachments.set([]);
//     this.participantsList.set([]);
//     this.subtasks.clear();
//   }

//   addSubtask() {
//     const taskGroup = this.fb.group({
//       title: ['', Validators.required],
//       completed: [false]
//     });
//     this.subtasks.push(taskGroup);
//   }

//   removeSubtask(index: number) {
//     this.subtasks.removeAt(index);
//   }

//   addParticipant(input: HTMLInputElement) {
//     const email = input.value.trim();
//     if (email && !this.participantsList().includes(email)) {
//       this.participantsList.update(list => [...list, email]);
//       input.value = '';
//     }
//   }

//   removeParticipant(index: number) {
//     this.participantsList.update(list => list.filter((_, i) => i !== index));
//   }

//   async onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (!input.files?.length) return;

//     this.isUploading.set(true);
//     const files = Array.from(input.files);

//     this.noteService.uploadMedia(files).subscribe({
//       next: (response) => {
//         this.uploadedAttachments.update(curr => [...curr, ...response.data]);
//         this.isUploading.set(false);
//         input.value = ''; 
//       },
//       error: (err) => {
//         console.error('Upload failed', err);
//         this.isUploading.set(false);
//       }
//     });
//   }

//   removeAttachment(index: number) {
//     this.uploadedAttachments.update(files => files.filter((_, i) => i !== index));
//   }

//   onSubmit() {
//     if (this.noteForm.invalid) {
//       this.noteForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formVal = this.noteForm.value;

//     // Process Tags (String -> Array)
//     const tagArray = formVal.tags 
//       ? formVal.tags.split(',').map(t => t.trim()).filter(Boolean) 
//       : [];

//     // Construct Payload
//     const payload: any = {
//       ...formVal,
//       tags: tagArray,
//       attachments: this.uploadedAttachments(),
//       // Add participants (mapping strings to expected object structure if needed by backend, or just array)
//       // Backend expects: participants: [{ user: ID, role: 'attendee' }] usually, but we are sending emails here.
//       // If backend handles email invites, we send this. If backend STRICTLY needs IDs, we'd need a user lookup first.
//       // For this UI demo, we'll assume the backend or service handles the resolution or accepts raw list for invites.
//       participants: this.participantsList().map(email => ({ email, role: 'attendee' })), 
      
//       isMeeting: formVal.noteType === 'meeting',
//       subtasks: formVal.subtasks?.filter((t: any) => t.title)
//     };

//     // Date Handling
//     if (payload.startDate instanceof Date) payload.startDate = payload.startDate.toISOString();
//     if (payload.dueDate instanceof Date) payload.dueDate = payload.dueDate.toISOString();
    
//     // Cleanup empty fields
//     if (!payload.meetingDetails?.location && !payload.meetingDetails?.videoLink) {
//         delete payload.meetingDetails;
//     }

//     // DECISION: Template vs Note
//     if (payload.isTemplate) {
//       this.noteService.createTemplate(payload).subscribe({
//         next: () => this.handleSuccess(),
//         error: (err) => this.handleError(err)
//       });
//     } else {
//       this.noteService.createNote(payload).subscribe({
//         next: () => this.handleSuccess(),
//         error: (err) => this.handleError(err)
//       });
//     }
//   }

//   handleSuccess() {
//     this.isSubmitting.set(false);
//     this.router.navigate(['/notes']);
//   }

//   handleError(err: any) {
//     console.error(err);
//     this.isSubmitting.set(false);
//   }
// }

// import { Component, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
// import { Router } from '@angular/router';
// import { EditorModule } from 'primeng/editor';
// import { DatePickerModule } from 'primeng/datepicker';
// import { NoteAttachment } from '../../../core/models/note.types';
// import { NoteService } from '../../../core/services/notes.service';

// @Component({
//   selector: 'app-note-create',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, EditorModule, DatePickerModule],
//   template: `
//     <div class="create-container">

//       <!-- Header -->
//       <header class="page-header">
//         <div class="header-content">
//           <h1 class="page-title">
//             {{ isTemplateMode() ? 'Create Template' : 'Create New Note' }}
//           </h1>
//           <p class="page-subtitle">
//             {{ isTemplateMode() ? 'Define a structure for future notes.' : 'Capture ideas, schedule meetings, or track tasks.' }}
//           </p>
//         </div>
//         <div class="actions">
//           <button class="btn-ghost" (click)="resetForm()">
//             <i class="pi pi-refresh"></i> Clear
//           </button>
//           <button class="btn-ghost danger" routerLink="/notes">
//             <i class="pi pi-times"></i> Cancel
//           </button>
//         </div>
//       </header>

//       <form [formGroup]="noteForm" (ngSubmit)="onSubmit()" class="glass-panel">
        
//         <!-- LEFT COLUMN: EDITOR -->
//         <div class="main-editor">
          
//           <!-- Title Input -->
//           <div class="form-group title-group">
//             <input type="text" formControlName="title" placeholder="Untitled Note..." class="input-title"
//               [class.error]="noteForm.get('title')?.invalid && noteForm.get('title')?.touched">
//             @if (noteForm.get('title')?.invalid && noteForm.get('title')?.touched) {
//               <span class="error-msg">Title is required</span>
//             }
//           </div>

//           <!-- Type Selector -->
//           <div class="type-tabs">
//             @for (type of noteTypes; track type.value) {
//               <label class="type-tab" [class.active]="noteForm.get('noteType')?.value === type.value">
//                 <input type="radio" formControlName="noteType" [value]="type.value" hidden>
//                 <span class="tab-icon">{{ type.icon }}</span>
//                 <span class="tab-label">{{ type.label }}</span>
//               </label>
//             }
//           </div>

//           <!-- Rich Text Editor -->
//           <div class="form-group content-wrapper">
//             <p-editor formControlName="content" [style]="{ height: '320px' }" placeholder="Start typing details...">
//               <ng-template pTemplate="header">
//                 <span class="ql-formats">
//                   <button type="button" class="ql-bold" aria-label="Bold"></button>
//                   <button type="button" class="ql-italic" aria-label="Italic"></button>
//                   <button type="button" class="ql-underline" aria-label="Underline"></button>
//                 </span>
//                 <span class="ql-formats">
//                   <button type="button" class="ql-list" value="ordered"></button>
//                   <button type="button" class="ql-list" value="bullet"></button>
//                 </span>
//                 <span class="ql-formats">
//                   <button type="button" class="ql-link"></button>
//                   <button type="button" class="ql-code-block"></button>
//                 </span>
//               </ng-template>
//             </p-editor>
//           </div>

//           <!-- Subtasks Section -->
//           <div class="subtasks-section">
//             <div class="section-header">
//               <label class="section-label"><i class="pi pi-check-square"></i> Checklist / Subtasks</label>
//               <button type="button" class="btn-text-action" (click)="addSubtask()">+ Add Item</button>
//             </div>
            
//             <div class="subtasks-list" formArrayName="subtasks">
//               @for (task of subtasks.controls; track i; let i = $index) {
//                 <div class="subtask-row" [formGroupName]="i">
//                   <input type="checkbox" formControlName="completed" class="checkbox-std">
//                   <input type="text" formControlName="title" placeholder="Task item..." class="input-std small">
//                   <button type="button" class="btn-icon-remove" (click)="removeSubtask(i)">×</button>
//                 </div>
//               }
//             </div>
//           </div>

//           <!-- Attachments List -->
//           @if (uploadedAttachments().length > 0) {
//             <div class="attachments-area">
//               <label class="section-label">Attachments</label>
//               <div class="file-grid">
//                 @for (file of uploadedAttachments(); track file; let i = $index) {
//                   <div class="attachment-pill">
//                     <span class="file-icon">📎</span>
//                     <div class="file-info">
//                       <span class="file-name">{{ file.fileName }}</span>
//                       <span class="file-size">{{ (file.size / 1024).toFixed(1) }} KB</span>
//                     </div>
//                     <button type="button" (click)="removeAttachment(i)" class="btn-remove">×</button>
//                   </div>
//                 }
//               </div>
//             </div>
//           }
//         </div>

//         <!-- RIGHT COLUMN: SIDEBAR -->
//         <div class="sidebar">

//           <!-- Template Toggle -->
//           <div class="sidebar-section">
//             <label class="checkbox-wrapper">
//               <input type="checkbox" formControlName="isTemplate">
//               <span class="label-text">Save as Template</span>
//             </label>
//           </div>

//           <!-- Priority -->
//           <div class="sidebar-section">
//             <label class="section-label">Priority</label>
//             <div class="priority-grid">
//               @for (p of priorities; track p) {
//                 <label class="priority-option" [class.selected]="noteForm.get('priority')?.value === p" [class]="p">
//                   <input type="radio" formControlName="priority" [value]="p" hidden>
//                   <span class="dot"></span> {{ p | titlecase }}
//                 </label>
//               }
//             </div>
//           </div>

//           <!-- Dates -->
//           <div class="sidebar-section">
//             <label class="section-label">Timeline</label>
//             <div class="date-group">
//               <div class="input-wrapper">
//                 <label class="sub-label">Start Date</label>
//                 <p-datepicker formControlName="startDate" 
//                               [showIcon]="true" 
//                               dateFormat="dd/mm/yy" 
//                               placeholder="Select date"
//                               styleClass="glass-date-picker"
//                               [showTime]="true">
//                 </p-datepicker>
//               </div>
//               <div class="input-wrapper">
//                 <label class="sub-label">Due Date</label>
//                 <p-datepicker formControlName="dueDate" 
//                               [showIcon]="true" 
//                               dateFormat="dd/mm/yy" 
//                               placeholder="Select date"
//                               styleClass="glass-date-picker"
//                               [showTime]="true">
//                 </p-datepicker>
//               </div>
//             </div>
//           </div>

//           <!-- Tags -->
//           <div class="sidebar-section">
//             <label class="section-label">Tags</label>
//             <input type="text" formControlName="tags" placeholder="e.g. #marketing, #v2" class="input-std">
//             <p class="help-text">Separate with commas</p>
//           </div>

//           <!-- Participants / Sharing -->
//           <div class="sidebar-section">
//             <label class="section-label">Participants</label>
//             <div class="participants-input">
//               <input type="text" #participantInput placeholder="Add by email..." class="input-std" (keydown.enter)="$event.preventDefault(); addParticipant(participantInput)">
//               <button type="button" class="btn-icon-add" (click)="addParticipant(participantInput)">+</button>
//             </div>
//             <div class="participants-list">
//               @for (p of participantsList(); track p; let i = $index) {
//                 <div class="participant-chip">
//                   <span>{{ p }}</span>
//                   <button type="button" (click)="removeParticipant(i)">×</button>
//                 </div>
//               }
//             </div>
//           </div>

//           <!-- Conditional: Meeting Info -->
//           @if (noteForm.get('noteType')?.value === 'meeting') {
//             <div class="sidebar-section highlight-section" formGroupName="meetingDetails">
//               <label class="section-label">Meeting Details</label>
//               <div class="form-row">
//                 <i class="pi pi-map-marker"></i>
//                 <input type="text" formControlName="location" placeholder="Location / Room" class="input-std">
//               </div>
//               <div class="form-row">
//                 <i class="pi pi-video"></i>
//                 <input type="text" formControlName="videoLink" placeholder="Video Link (Zoom/Meet)" class="input-std">
//               </div>
//             </div>
//           }

//           <!-- Upload -->
//           <div class="sidebar-section">
//             <label class="section-label">Add Files</label>
//             <label class="btn-upload" [class.loading]="isUploading()">
//               <input type="file" multiple (change)="onFileSelected($event)" hidden>
//               <i class="pi" [class.pi-cloud-upload]="!isUploading()" [class.pi-spin]="isUploading()" [class.pi-spinner]="isUploading()"></i>
//               <span>{{ isUploading() ? 'Uploading...' : 'Upload Attachments' }}</span>
//             </label>
//           </div>

//           <!-- Footer Actions -->
//           <div class="sidebar-footer">
//             <button type="submit" class="btn-primary" [disabled]="noteForm.invalid || isSubmitting() || isUploading()">
//               <i class="pi pi-check" *ngIf="!isSubmitting()"></i>
//               <i class="pi pi-spin pi-spinner" *ngIf="isSubmitting()"></i>
//               {{ isSubmitting() ? 'Saving...' : (isTemplateMode() ? 'Save Template' : 'Create Note') }}
//             </button>
//           </div>

//         </div>
//       </form>
//     </div>
//   `,
//   styles: [`
//     /* ==================== STYLES ==================== */
//     :host {
//       display: block;
//       width: 100%;
//       height: 100%;
//       padding: var(--spacing-2xl);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//       overflow-y: auto;
//     }

//     .create-container {
//       max-width: 1100px;
//       margin: 0 auto;
//       padding-bottom: 60px;
//     }

//     /* --- Header --- */
//     .page-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-xl);

//       .page-title {
//         font-family: var(--font-heading);
//         font-size: var(--font-size-3xl);
//         font-weight: 700;
//         color: var(--text-primary);
//         margin: 0 0 4px 0;
//       }
//       .page-subtitle {
//         color: var(--text-secondary);
//         font-size: var(--font-size-sm);
//         margin: 0;
//       }
//       .actions { display: flex; gap: var(--spacing-md); }
//     }

//     /* --- Main Layout --- */
//     .glass-panel {
//       display: grid;
//       grid-template-columns: 1fr 320px;
//       gap: var(--spacing-2xl);
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-secondary);
//       box-shadow: var(--shadow-xl);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-2xl);
      
//       @media (max-width: 900px) { grid-template-columns: 1fr; }
//     }

//     /* --- Left Column: Editor --- */
//     .main-editor {
//       display: flex; flex-direction: column; gap: var(--spacing-lg);
//     }

//     .input-title {
//       width: 100%;
//       background: transparent;
//       border: none;
//       font-family: var(--font-heading);
//       font-size: var(--font-size-4xl);
//       font-weight: 700;
//       color: var(--text-primary);
//       padding: var(--spacing-sm) 0;
//       outline: none;
//       transition: border-color 0.2s;
//       &::placeholder { color: var(--text-secondary); opacity: 0.4; }
//       &.error { border-bottom: 2px solid var(--color-error); }
//     }
//     .error-msg { color: var(--color-error); font-size: 11px; margin-top: 4px; }

//     /* Type Tabs */
//     .type-tabs {
//       display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;
      
//       .type-tab {
//         display: flex; align-items: center; gap: 6px;
//         padding: 6px 12px;
//         border-radius: var(--ui-border-radius);
//         font-size: var(--font-size-sm);
//         font-weight: 500;
//         cursor: pointer;
//         background: var(--bg-ternary);
//         color: var(--text-secondary);
//         border: 1px solid transparent;
//         transition: all 0.2s;

//         &:hover { background: var(--bg-hover); color: var(--text-primary); }
//         &.active {
//           background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
//           color: var(--accent-primary);
//           border-color: color-mix(in srgb, var(--accent-primary) 20%, transparent);
//         }
//       }
//     }

//     /* Subtasks */
//     .subtasks-section {
//       background: var(--bg-ternary);
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius);
      
//       .section-header {
//         display: flex; justify-content: space-between; margin-bottom: 8px;
//         .btn-text-action { background: none; border: none; color: var(--accent-primary); font-size: 11px; font-weight: 600; cursor: pointer; &:hover { text-decoration: underline; } }
//       }
      
//       .subtasks-list { display: flex; flex-direction: column; gap: 6px; }
      
//       .subtask-row {
//         display: flex; align-items: center; gap: 8px;
//         .checkbox-std { width: 16px; height: 16px; accent-color: var(--accent-primary); }
//         .btn-icon-remove { background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 16px; &:hover { color: var(--color-error); } }
//       }
//     }

//     /* Attachments */
//     .attachments-area {
//       margin-top: var(--spacing-md);
//       .file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-top: 8px; }
      
//       .attachment-pill {
//         display: flex; align-items: center; gap: 8px;
//         background: var(--bg-ternary);
//         padding: 6px 10px;
//         border-radius: var(--ui-border-radius);
//         border: 1px solid var(--border-secondary);
//         font-size: 11px;
        
//         .file-info { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
//         .file-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; color: var(--text-primary); }
//         .file-size { color: var(--text-tertiary); font-size: 9px; }
//         .btn-remove { background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 14px; &:hover { color: var(--color-error); } }
//       }
//     }

//     /* --- Right Column: Sidebar --- */
//     .sidebar {
//       border-left: 1px solid var(--border-secondary);
//       padding-left: var(--spacing-xl);
//       display: flex; flex-direction: column; gap: var(--spacing-xl);
      
//       @media (max-width: 900px) { border-left: none; padding-left: 0; border-top: 1px solid var(--border-secondary); padding-top: var(--spacing-xl); }
//     }

//     .sidebar-section {
//       display: flex; flex-direction: column; gap: 8px;
//       &.highlight-section { background: color-mix(in srgb, var(--accent-primary) 5%, transparent); padding: 10px; border-radius: var(--ui-border-radius); border: 1px dashed var(--accent-primary); }
      
//       .section-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--text-tertiary); letter-spacing: 0.5px; }
//       .help-text { font-size: 10px; color: var(--text-tertiary); margin: 0; }
//     }

//     /* Checkbox Wrapper */
//     .checkbox-wrapper {
//       display: flex; align-items: center; gap: 8px; cursor: pointer;
//       input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent-primary); }
//       .label-text { font-size: 12px; font-weight: 600; color: var(--text-primary); }
//     }

//     /* Priority Grid */
//     .priority-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
//     .priority-option {
//       display: flex; align-items: center; gap: 6px; padding: 6px 8px;
//       border-radius: var(--ui-border-radius); font-size: 11px; cursor: pointer;
//       background: var(--bg-ternary); border: 1px solid transparent; color: var(--text-secondary);
      
//       .dot { width: 6px; height: 6px; border-radius: 50%; }
//       &.low .dot { background: #10b981; }
//       &.medium .dot { background: #3b82f6; }
//       &.high .dot { background: #f59e0b; }
//       &.urgent .dot { background: #ef4444; }

//       &:hover { background: var(--bg-hover); }
//       &.selected {
//         font-weight: 600; color: var(--text-primary); border-color: var(--border-primary);
//         background: var(--bg-primary); box-shadow: var(--shadow-sm);
//       }
//     }

//     /* Participants Input */
//     .participants-input {
//       display: flex; gap: 4px;
//       input { flex: 1; }
//       .btn-icon-add { background: var(--bg-ternary); border: 1px solid var(--border-secondary); width: 32px; border-radius: 4px; cursor: pointer; &:hover { background: var(--bg-hover); } }
//     }
//     .participants-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
//     .participant-chip {
//       background: var(--bg-ternary); padding: 2px 8px; border-radius: 12px; font-size: 10px; display: flex; align-items: center; gap: 4px; border: 1px solid var(--border-secondary);
//       button { background: none; border: none; font-size: 14px; cursor: pointer; line-height: 1; color: var(--text-tertiary); &:hover { color: var(--color-error); } }
//     }

//     /* Inputs */
//     .input-std {
//       width: 100%; padding: 8px 10px; background: var(--bg-primary); border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius); color: var(--text-primary); font-size: 12px; outline: none;
//       transition: all 0.2s;
//       &:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-focus); }
//       &.small { padding: 4px 8px; font-size: 11px; }
//     }

//     .form-row { display: flex; align-items: center; gap: 8px; i { color: var(--text-tertiary); font-size: 12px; } }

//     /* Datepicker Overrides (Deep) */
//     ::ng-deep .glass-date-picker {
//       width: 100%;
//       .p-datepicker-input { 
//         background: var(--bg-primary); border: 1px solid var(--border-secondary); color: var(--text-primary); 
//         padding: 8px; font-size: 12px; border-radius: var(--ui-border-radius); width: 100%;
//         &:focus { border-color: var(--accent-primary); }
//       }
//     }

//     /* Buttons */
//     .btn-upload {
//       display: flex; align-items: center; justify-content: center; gap: 8px;
//       padding: 10px; border: 1px dashed var(--border-secondary); border-radius: var(--ui-border-radius);
//       color: var(--text-secondary); font-size: 12px; cursor: pointer; transition: all 0.2s;
//       &:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: var(--bg-ternary); }
//       &.loading { opacity: 0.7; cursor: wait; }
//     }

//     .btn-primary {
//       width: 100%; padding: 10px; background: var(--accent-primary); color: white; border: none;
//       border-radius: var(--ui-border-radius); font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
//       &:hover:not(:disabled) { background: var(--accent-hover); box-shadow: var(--shadow-md); }
//       &:disabled { opacity: 0.6; cursor: not-allowed; }
//     }

//     .btn-ghost {
//       background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 10px; border-radius: var(--ui-border-radius);
//       &:hover { background: var(--bg-ternary); color: var(--text-primary); }
//       &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
//     }

//     /* PrimeNG Editor Overrides */
//     ::ng-deep .p-editor-container {
//       border-radius: var(--ui-border-radius);
//       overflow: hidden;
//       border: 1px solid var(--border-secondary);
      
//       .p-editor-toolbar {
//         background: var(--bg-ternary);
//         border: none;
//         border-bottom: 1px solid var(--border-secondary);
//         padding: 6px;
//       }
      
//       .p-editor-content {
//         background: transparent;
//         border: none;
//         color: var(--text-primary);
//         font-family: var(--font-body);
//         font-size: 14px;
        
//         .ql-editor { padding: 12px; min-height: 200px; }
//         .ql-editor.ql-blank::before { color: var(--text-secondary); font-style: normal; opacity: 0.6; }
//       }
//     }
//   `]
// })
// export class NoteCreateComponent {
//   private fb = inject(FormBuilder);
//   private noteService = inject(NoteService);
//   private router = inject(Router);

//   // --- State ---
//   isSubmitting = signal(false);
//   isUploading = signal(false);
//   uploadedAttachments = signal<NoteAttachment[]>([]);
//   participantsList = signal<string[]>([]); // Store participant emails

//   // --- Static Data ---
//   priorities = ['low', 'medium', 'high', 'urgent'];
//   noteTypes = [
//     { value: 'note', label: 'Note', icon: '📝' },
//     { value: 'task', label: 'Task', icon: '✅' },
//     { value: 'meeting', label: 'Meeting', icon: '📅' },
//     { value: 'idea', label: 'Idea', icon: '💡' },
//     { value: 'project', label: 'Project', icon: '🚀' }
//   ];

//   // --- Form ---
//   noteForm = this.fb.group({
//     title: ['', [Validators.required, Validators.maxLength(100)]],
//     content: ['', [Validators.required]],
//     noteType: ['note'],
//     priority: ['medium'],
//     tags: [''],
//     startDate: [null as Date | null],
//     dueDate: [null as Date | null],
//     isTemplate: [false], // New: Template Toggle
    
//     // Nested Group for Meeting
//     meetingDetails: this.fb.group({
//       location: [''],
//       videoLink: ['']
//     }),

//     // Subtasks Array
//     subtasks: this.fb.array([])
//   });

//   get subtasks() {
//     return this.noteForm.get('subtasks') as FormArray;
//   }

//   isTemplateMode() {
//     return this.noteForm.get('isTemplate')?.value;
//   }

//   // --- Methods ---

//   resetForm() {
//     this.noteForm.reset({ noteType: 'note', priority: 'medium', isTemplate: false });
//     this.uploadedAttachments.set([]);
//     this.participantsList.set([]);
//     this.subtasks.clear();
//   }

//   addSubtask() {
//     const taskGroup = this.fb.group({
//       title: ['', Validators.required],
//       completed: [false]
//     });
//     this.subtasks.push(taskGroup);
//   }

//   removeSubtask(index: number) {
//     this.subtasks.removeAt(index);
//   }

//   addParticipant(input: HTMLInputElement) {
//     const email = input.value.trim();
//     if (email && !this.participantsList().includes(email)) {
//       this.participantsList.update(list => [...list, email]);
//       input.value = '';
//     }
//   }

//   removeParticipant(index: number) {
//     this.participantsList.update(list => list.filter((_, i) => i !== index));
//   }

//   async onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (!input.files?.length) return;

//     this.isUploading.set(true);
//     const files = Array.from(input.files);

//     this.noteService.uploadMedia(files).subscribe({
//       next: (response) => {
//         this.uploadedAttachments.update(curr => [...curr, ...response.data]);
//         this.isUploading.set(false);
//         input.value = ''; 
//       },
//       error: (err) => {
//         console.error('Upload failed', err);
//         this.isUploading.set(false);
//       }
//     });
//   }

//   removeAttachment(index: number) {
//     this.uploadedAttachments.update(files => files.filter((_, i) => i !== index));
//   }

//   onSubmit() {
//     if (this.noteForm.invalid) {
//       this.noteForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formVal = this.noteForm.value;

//     // Process Tags (String -> Array)
//     const tagArray = formVal.tags 
//       ? formVal.tags.split(',').map(t => t.trim()).filter(Boolean) 
//       : [];

//     // Construct Payload
//     const payload: any = {
//       ...formVal,
//       tags: tagArray,
//       attachments: this.uploadedAttachments(),
//       // Add participants (mapping strings to expected object structure if needed by backend, or just array)
//       // Backend expects: participants: [{ user: ID, role: 'attendee' }] usually, but we are sending emails here.
//       // If backend handles email invites, we send this. If backend STRICTLY needs IDs, we'd need a user lookup first.
//       // For this UI demo, we'll assume the backend or service handles the resolution or accepts raw list for invites.
//       participants: this.participantsList().map(email => ({ email, role: 'attendee' })), 
      
//       isMeeting: formVal.noteType === 'meeting',
//       subtasks: formVal.subtasks?.filter((t: any) => t.title)
//     };

//     // Date Handling
//     if (payload.startDate instanceof Date) payload.startDate = payload.startDate.toISOString();
//     if (payload.dueDate instanceof Date) payload.dueDate = payload.dueDate.toISOString();
    
//     // Cleanup empty fields
//     if (!payload.meetingDetails?.location && !payload.meetingDetails?.videoLink) {
//         delete payload.meetingDetails;
//     }

//     // DECISION: Template vs Note
//     if (payload.isTemplate) {
//       this.noteService.createTemplate(payload).subscribe({
//         next: () => this.handleSuccess(),
//         error: (err) => this.handleError(err)
//       });
//     } else {
//       this.noteService.createNote(payload).subscribe({
//         next: () => this.handleSuccess(),
//         error: (err) => this.handleError(err)
//       });
//     }
//   }

//   handleSuccess() {
//     this.isSubmitting.set(false);
//     this.router.navigate(['/notes']);
//   }

//   handleError(err: any) {
//     console.error(err);
//     this.isSubmitting.set(false);
//   }
// }

// // import { Component, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { Router } from '@angular/router';
// // import { NoteAttachment } from '../../../core/models/note.types';
// // import { NoteService } from '../../../core/services/notes.service';
// // import { DatePicker } from 'primeng/datepicker'; // Import DatePicker

// // @Component({
// //   selector: 'app-note-create',
// //   standalone: true,
// //   imports: [CommonModule, ReactiveFormsModule, DatePicker], // Add to imports
// //   templateUrl: './note-create.component.html',
// //   styleUrls: ['./note-create.component.scss']
// // })
// // export class NoteCreateComponent {
// //   private fb = inject(FormBuilder);
// //   private noteService = inject(NoteService);
// //   private router = inject(Router);

// //   // Signals
// //   isSubmitting = signal(false);
// //   isUploading = signal(false);
// //   uploadedAttachments = signal<NoteAttachment[]>([]);

// //   // Form
// //   noteForm = this.fb.group({
// //     title: ['', [Validators.required, Validators.maxLength(100)]],
// //     content: ['', [Validators.required]],
// //     noteType: ['note'],
// //     priority: ['medium'],
// //     category: [''],
// //     tags: [''],
// //     // DatePickers return Date objects, initialize as null
// //     startDate: [null as Date | null],
// //     dueDate: [null as Date | null],
// //     meetingDetails: this.fb.group({
// //       videoLink: [''],
// //       location: ['']
// //     })
// //   });

// //   priorities = ['low', 'medium', 'high', 'urgent'];
  
// //   noteTypes = [
// //     { value: 'note', label: '📝 Note' },
// //     { value: 'task', label: '✅ Task' },
// //     { value: 'meeting', label: '📅 Meeting' },
// //     { value: 'idea', label: '💡 Idea' },
// //     { value: 'project', label: '🚀 Project' }
// //   ];

// //   async onFileSelected(event: Event) {
// //     const input = event.target as HTMLInputElement;
// //     if (!input.files?.length) return;

// //     this.isUploading.set(true);
// //     const files = Array.from(input.files);

// //     this.noteService.uploadMedia(files).subscribe({
// //       next: (response) => {
// //         this.uploadedAttachments.update(curr => [...curr, ...response.data]);
// //         this.isUploading.set(false);
// //         input.value = ''; 
// //       },
// //       error: (err) => {
// //         console.error('Upload failed', err);
// //         this.isUploading.set(false);
// //         alert('Failed to upload file. Please try again.');
// //       }
// //     });
// //   }

// //   removeAttachment(index: number) {
// //     this.uploadedAttachments.update(files => files.filter((_, i) => i !== index));
// //   }

// //   onSubmit() {
// //     if (this.noteForm.invalid) {
// //       this.noteForm.markAllAsTouched();
// //       return;
// //     }

// //     this.isSubmitting.set(true);
// //     const formVal = this.noteForm.value;

// //     // 1. Handle Tags
// //     const tagArray = formVal.tags 
// //       ? formVal.tags.split(',').map(t => t.trim()).filter(Boolean) 
// //       : [];

// //     // 2. Construct Payload
// //     const payload: any = {
// //       ...formVal,
// //       tags: tagArray,
// //       attachments: this.uploadedAttachments(),
// //       isMeeting: formVal.noteType === 'meeting'
// //     };

// //     // 3. Clean Empty Dates & Convert if needed
// //     // PrimeNG returns Date objects, ensure backend receives ISO string if required
// //     if (payload.startDate instanceof Date) payload.startDate = payload.startDate.toISOString();
// //     if (payload.dueDate instanceof Date) payload.dueDate = payload.dueDate.toISOString();
    
// //     if (!payload.startDate) delete payload.startDate;
// //     if (!payload.dueDate) delete payload.dueDate;

// //     this.noteService.createNote(payload).subscribe({
// //       next: () => {
// //         this.isSubmitting.set(false);
// //         this.router.navigate(['/notes']);
// //       },
// //       error: (err) => {
// //         console.error(err);
// //         this.isSubmitting.set(false);
// //       }
// //     });
// //   }
// // }