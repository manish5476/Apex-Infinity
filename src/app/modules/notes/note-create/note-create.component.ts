import { Component, inject, signal, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService } from 'primeng/dynamicdialog';
import { NoteAttachment, Note } from '../../../core/models/note.types';
import { NoteService } from '../../../core/services/notes.service';
import { TemplateSelectorComponent } from '../template-selector/template-selector.component';
import { AppMessageService } from '../../../core/services/message.service';
import { TiptapEditorComponent } from '../../shared/components/tiptap-editor/tiptap-editor.component';

// ✅ Import our custom TipTap editor - replaces Quill/PrimeNG Editor

@Component({
  selector: 'app-note-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DatePickerModule,
    TiptapEditorComponent,  // ← replaces EditorModule
  ],
  providers: [DialogService],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './note-create.component.html',
  styleUrl: './note-create.component.scss'
})
export class NoteCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private noteService = inject(NoteService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private dialogService = inject(DialogService);

  // --- State ---
  isSubmitting = signal(false);
  isUploading = signal(false);
  uploadedAttachments = signal<NoteAttachment[]>([]);
  participantsList = signal<string[]>([]);
  wordCount = signal(0);

  priorities = ['low', 'medium', 'high', 'urgent'];
  noteTypes = [
    { value: 'note', label: 'Note', icon: '📝' },
    { value: 'task', label: 'Task', icon: '✅' },
    { value: 'meeting', label: 'Meeting', icon: '📅' },
    { value: 'idea', label: 'Idea', icon: '💡' },
    { value: 'project', label: 'Project', icon: '🚀' }
  ];

  // --- Form ---
  // 📝 content now stores TipTap JSON (no HTML tags!)
  noteForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    content: [null as any, [Validators.required]],
    noteType: ['note'],
    priority: ['medium'],
    tags: [''],
    startDate: [null as Date | null],
    dueDate: [null as Date | null],
    isTemplate: [false],
    meetingDetails: this.fb.group({
      location: [''],
      videoLink: ['']
    }),
    subtasks: this.fb.array([])
  });

  get subtasks() {
    return this.noteForm.get('subtasks') as FormArray;
  }

  isTemplateMode() {
    return this.noteForm.get('isTemplate')?.value;
  }

  ngOnInit(): void {
    // No Quill icon hacks needed — TipTap uses clean SVG toolbar
  }

  onWordCount(count: any) {
    this.wordCount.set(count);
  }

  addSubtask() {
    this.subtasks.push(this.fb.group({
      title: ['', Validators.required],
      completed: [false]
    }));
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

  removeAttachment(index: number) {
    this.uploadedAttachments.update(files => files.filter((_, i) => i !== index));
  }

  resetForm() {
    this.noteForm.reset({ noteType: 'note', priority: 'medium', isTemplate: false, content: null });
    this.uploadedAttachments.set([]);
    this.participantsList.set([]);
    this.subtasks.clear();
    this.wordCount.set(0);
    this.messageService.showInfo('Form has been cleared.');
  }

  openTemplateSelector() {
    const ref: any = this.dialogService.open(TemplateSelectorComponent, {
      header: 'Choose a Template',
      width: '700px',
      contentStyle: { overflow: 'visible' },
      baseZIndex: 10000,
      dismissableMask: true
    });

    ref.onClose.subscribe((template: Note) => {
      if (template) this.applyTemplate(template);
    });
  }

  applyTemplate(template: Note) {
    if (!confirm('Apply template? This will replace current content.')) return;

    this.noteForm.patchValue({
      title: template.title,
      // Template content might be HTML string — TipTap's writeValue handles both
      content: template.content,
      noteType: template.noteType,
      priority: template.priority,
      tags: template.tags?.join(', ')
    });

    this.messageService.showSuccess(`Template "${template.title}" applied.`);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.isUploading.set(true);
    const files = Array.from(input.files);

    this.noteService.uploadMedia(files).subscribe({
      next: (response) => {
        this.uploadedAttachments.update(curr => [...curr, ...response.data]);
        this.isUploading.set(false);
        this.messageService.showSuccess(`${files.length} file(s) uploaded.`);
        input.value = '';
      },
      error: (err) => {
        this.isUploading.set(false);
        this.messageService.handleHttpError(err);
      }
    });
  }

  onSubmit() {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      this.messageService.showWarn('Please fill in the required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.noteForm.getRawValue();

    const tagArray = formVal.tags
      ? formVal.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const isMeeting = formVal.noteType === 'meeting';

    const payload: any = {
      ...formVal,
      tags: tagArray,
      attachments: this.uploadedAttachments(),
      participants: this.participantsList().map(email => ({ email, role: 'attendee' })),
      isMeeting,
      subtasks: formVal.subtasks?.filter((t: any) => t.title),
      // Content is now TipTap JSON — stringify for API
      content: typeof formVal.content === 'object'
        ? JSON.stringify(formVal.content)
        : formVal.content
    };

    if (payload.startDate instanceof Date) payload.startDate = payload.startDate.toISOString();
    if (payload.dueDate instanceof Date) payload.dueDate = payload.dueDate.toISOString();

    if (isMeeting) {
      if (!payload.meetingDetails) payload.meetingDetails = {};
      payload.meetingDetails.startTime = payload.startDate || new Date().toISOString();
      if (payload.dueDate) {
        payload.meetingDetails.endTime = payload.dueDate;
      } else {
        const start = new Date(payload.meetingDetails.startTime);
        start.setHours(start.getHours() + 1);
        payload.meetingDetails.endTime = start.toISOString();
      }
      payload.meetingDetails.locationType = payload.meetingDetails.videoLink
        ? 'virtual'
        : payload.meetingDetails.location ? 'physical' : 'virtual';
    } else {
      if (!payload.meetingDetails?.location && !payload.meetingDetails?.videoLink) {
        delete payload.meetingDetails;
      }
    }

    const request$ = payload.isTemplate
      ? this.noteService.createTemplate(payload)
      : this.noteService.createNote(payload);

    request$.subscribe({
      next: () => {
        const type = payload.isTemplate ? 'Template' : 'Note';
        this.messageService.showSuccess(`${type} created successfully.`);
        this.handleSuccess();
      },
      error: (err) => this.handleError(err)
    });
  }

  handleSuccess() {
    this.isSubmitting.set(false);
    this.router.navigate(['/notes']);
  }

  handleError(err: any) {
    this.isSubmitting.set(false);
    this.messageService.handleHttpError(err);
  }
}

// import { Component, inject, signal, OnInit, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
// import { Router } from '@angular/router';
// import { EditorModule } from 'primeng/editor';
// import { DatePickerModule } from 'primeng/datepicker';
// import { DialogService } from 'primeng/dynamicdialog'; // Added
// import { NoteAttachment, Note } from '../../../core/models/note.types';
// import { NoteService } from '../../../core/services/notes.service';
// import { TemplateSelectorComponent } from '../template-selector/template-selector.component'; // Added
// import Quill from 'quill';
// import { AppMessageService } from '../../../core/services/message.service';

// @Component({
//   selector: 'app-note-create',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, EditorModule, DatePickerModule],
//   providers: [DialogService], // Added Provider
//   encapsulation: ViewEncapsulation.None,
//   templateUrl: './note-create.component.html',
//   styleUrl: './note-create.component.scss'
// })
// export class NoteCreateComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private noteService = inject(NoteService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   private dialogService = inject(DialogService);
//   icons: any = Quill.import('ui/icons');

//   // --- State ---
//   isSubmitting = signal(false);
//   isUploading = signal(false);
//   uploadedAttachments = signal<NoteAttachment[]>([]);
//   participantsList = signal<string[]>([]); // Store participant emails

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
//     isTemplate: [false],
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
//     // Custom icons setup
//     this.icons.bold = '<i class="pi pi-bold"></i>';
//     this.icons.italic = '<i class="pi pi-italic"></i>';
//     this.icons.underline = '<i class="pi pi-underline"></i>';
//     this.icons.list = {
//       ordered: '<i class="pi pi-list"></i>',
//       bullet: '<i class="pi pi-bars"></i>'
//     };
//     this.icons.bold = '<span class="ql-text-icon">B</span>';
//     this.icons.italic = '<span class="ql-text-icon">I</span>';
//     this.icons.underline = '<span class="ql-text-icon">U</span>';
//     this.icons.link = '<i class="pi pi-link"></i>';
//     this.icons['code-block'] = '<i class="pi pi-code"></i>';
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

//   removeAttachment(index: number) {
//     this.uploadedAttachments.update(files => files.filter((_, i) => i !== index));
//   }

//   resetForm() {
//     this.noteForm.reset({ noteType: 'note', priority: 'medium', isTemplate: false });
//     this.uploadedAttachments.set([]);
//     this.participantsList.set([]);
//     this.subtasks.clear();
//     this.messageService.showInfo('Form has been cleared.');
//   }

//   // === TEMPLATE INTEGRATION ===
//   openTemplateSelector() {
//     const ref: any = this.dialogService.open(TemplateSelectorComponent, {
//       header: 'Choose a Template',
//       width: '700px',
//       contentStyle: { overflow: 'visible' },
//       baseZIndex: 10000,
//       dismissableMask: true
//     });

//     ref.onClose.subscribe((template: Note) => {
//       if (template) {
//         this.applyTemplate(template);
//       }
//     });
//   }

//   applyTemplate(template: Note) {
//     // Note: Consider using your confirmationService here for a consistent look
//     if (!confirm('Apply template? This will replace current content.')) return;

//     this.noteForm.patchValue({
//       title: template.title,
//       content: template.content,
//       noteType: template.noteType,
//       priority: template.priority,
//       tags: template.tags?.join(', ')
//     });

//     this.messageService.showSuccess(`Template "${template.title}" applied.`);
//   }

//   onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (!input.files?.length) return;

//     this.isUploading.set(true);
//     const files = Array.from(input.files);

//     this.noteService.uploadMedia(files).subscribe({
//       next: (response) => {
//         this.uploadedAttachments.update(curr => [...curr, ...response.data]);
//         this.isUploading.set(false);
//         this.messageService.showSuccess(`${files.length} file(s) uploaded successfully.`);
//         input.value = '';
//       },
//       error: (err) => {
//         this.isUploading.set(false);
//         this.messageService.handleHttpError(err);
//       }
//     });
//   }

//   onSubmit() {
//     if (this.noteForm.invalid) {
//       this.noteForm.markAllAsTouched();
//       this.messageService.showWarn('Validation Error: Please fill in the required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formVal = this.noteForm.getRawValue(); // Using getRawValue for better type safety

//     const tagArray = formVal.tags
//       ? formVal.tags.split(',').map(t => t.trim()).filter(Boolean)
//       : [];

//     const isMeeting = formVal.noteType === 'meeting';

//     const payload: any = {
//       ...formVal,
//       tags: tagArray,
//       attachments: this.uploadedAttachments(),
//       participants: this.participantsList().map(email => ({ email, role: 'attendee' })),
//       isMeeting,
//       subtasks: formVal.subtasks?.filter((t: any) => t.title)
//     };

//     if (payload.startDate instanceof Date) payload.startDate = payload.startDate.toISOString();
//     if (payload.dueDate instanceof Date) payload.dueDate = payload.dueDate.toISOString();

//     if (isMeeting) {
//       if (!payload.meetingDetails) payload.meetingDetails = {};
//       payload.meetingDetails.startTime = payload.startDate || new Date().toISOString();

//       if (payload.dueDate) {
//         payload.meetingDetails.endTime = payload.dueDate;
//       } else {
//         const start = new Date(payload.meetingDetails.startTime);
//         start.setHours(start.getHours() + 1);
//         payload.meetingDetails.endTime = start.toISOString();
//       }

//       if (payload.meetingDetails.videoLink) {
//         payload.meetingDetails.locationType = 'virtual';
//       } else if (payload.meetingDetails.location) {
//         payload.meetingDetails.locationType = 'physical';
//       } else {
//         payload.meetingDetails.locationType = 'virtual';
//       }
//     } else {
//       if (!payload.meetingDetails?.location && !payload.meetingDetails?.videoLink) {
//         delete payload.meetingDetails;
//       }
//     }

//     const request$ = payload.isTemplate
//       ? this.noteService.createTemplate(payload)
//       : this.noteService.createNote(payload);

//     request$.subscribe({
//       next: () => {
//         const type = payload.isTemplate ? 'Template' : 'Note';
//         this.messageService.showSuccess(`${type} created successfully.`);
//         this.handleSuccess();
//       },
//       error: (err) => this.handleError(err)
//     });
//   }

//   handleSuccess() {
//     this.isSubmitting.set(false);
//     this.router.navigate(['/notes']);
//   }

//   handleError(err: any) {
//     this.isSubmitting.set(false);
//     this.messageService.handleHttpError(err);
//   }
// }