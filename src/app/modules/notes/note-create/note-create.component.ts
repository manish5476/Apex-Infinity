import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NoteAttachment } from '../../../core/models/note.types';
import { NoteService } from '../../../core/services/notes.service';

@Component({
  selector: 'app-note-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './note-create.component.html',
  styleUrls: ['./note-create.component.scss']
})
export class NoteCreateComponent {
  private fb = inject(FormBuilder);
  private noteService = inject(NoteService);
  private router = inject(Router);

  // Signals
  isSubmitting = signal(false);
  isUploading = signal(false);
  uploadedAttachments = signal<NoteAttachment[]>([]);

  // Form
  noteForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    content: ['', [Validators.required]],
    noteType: ['note'],
    priority: ['medium'],
    category: [''],
    tags: [''],
    startDate: [null as string | null],
    dueDate: [null as string | null],
    meetingDetails: this.fb.group({
      videoLink: [''],
      location: ['']
    })
  });

  priorities = ['low', 'medium', 'high', 'urgent'];
  
  noteTypes = [
    { value: 'note', label: '📝 Note' },
    { value: 'task', label: '✅ Task' },
    { value: 'meeting', label: '📅 Meeting' },
    { value: 'idea', label: '💡 Idea' },
    { value: 'project', label: '🚀 Project' }
  ];

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.isUploading.set(true);
    const files = Array.from(input.files);

    this.noteService.uploadMedia(files).subscribe({
      next: (response) => {
        // Append new files to existing array
        this.uploadedAttachments.update(curr => [...curr, ...response.data]);
        this.isUploading.set(false);
        input.value = ''; // Reset input so same file can be selected again if needed
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isUploading.set(false);
        alert('Failed to upload file. Please try again.');
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

    // 1. Handle Tags
    const tagArray = formVal.tags 
      ? formVal.tags.split(',').map(t => t.trim()).filter(Boolean) 
      : [];

    // 2. Construct Payload
    const payload: any = {
      ...formVal,
      tags: tagArray,
      attachments: this.uploadedAttachments(),
      // Auto-set meeting flag if type is meeting
      isMeeting: formVal.noteType === 'meeting'
    };

    // 3. Clean Empty Dates (Backend will error on empty strings)
    if (!payload.startDate) delete payload.startDate;
    if (!payload.dueDate) delete payload.dueDate;

    this.noteService.createNote(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/notes']);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
      }
    });
  }
}

// import { Component, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
// import { Router } from '@angular/router';
// import { NoteAttachment } from '../../../core/models/note.types';
// import { NoteService } from '../../../core/services/notes.service';

// @Component({
//   selector: 'app-note-create',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './note-create.component.html',
//   styleUrls: ['./note-create.component.scss']
// })
// export class NoteCreateComponent {
//   private fb = inject(FormBuilder);
//   private noteService = inject(NoteService);
//   private router = inject(Router);

//   // Signals for UI State
//   isSubmitting = signal(false);
//   isUploading = signal(false);
//   uploadedAttachments = signal<NoteAttachment[]>([]);
//   activeTab = signal<'details' | 'meeting'>('details'); // Toggle for advanced fields

//   // Main Form
//   noteForm = this.fb.group({
//     title: ['', [Validators.required, Validators.maxLength(100)]],
//     content: ['', [Validators.required]],
//     noteType: ['note'],
//     priority: ['medium'],
//     category: [''],
//     tags: [''], // Comma separated string for input
//     startDate: [null],
//     dueDate: [null],
//     // Meeting specific fields (optional group)
//     meetingDetails: this.fb.group({
//       link: [''],
//       location: ['']
//     })
//   });

//   // Priorities for dropdown
//   priorities = ['low', 'medium', 'high', 'urgent'];
  
//   // Note Types
//   noteTypes = [
//     { value: 'note', label: '📝 Note' },
//     { value: 'task', label: '✅ Task' },
//     { value: 'meeting', label: '📅 Meeting' },
//     { value: 'idea', label: '💡 Idea' },
//     { value: 'project', label: '🚀 Project' }
//   ];

//   /** Handle File Selection & Immediate Upload */
//   async onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (!input.files?.length) return;

//     this.isUploading.set(true);
//     const files = Array.from(input.files);

//     try {
//       this.noteService.uploadMedia(files).subscribe({
//         next: (response) => {
//           // Add new uploads to existing list
//           this.uploadedAttachments.update(current => [...current, ...response.data]);
//           this.isUploading.set(false);
//         },
//         error: (err) => {
//           console.error('Upload failed', err);
//           this.isUploading.set(false);
//         }
//       });
//     } catch (e) {
//       this.isUploading.set(false);
//     }
//   }

//   /** Remove an uploaded attachment */
//   removeAttachment(index: number) {
//     this.uploadedAttachments.update(files => files.filter((_, i) => i !== index));
//   }

//   /** Submit Form */
//   onSubmit() {
//     if (this.noteForm.invalid) {
//       this.noteForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formVal = this.noteForm.value;

//     // Process Tags
//     const tagArray = formVal.tags 
//       ? formVal.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) 
//       : [];

//     // Construct Payload
//     const payload: any = {
//       ...formVal,
//       tags: tagArray,
//       attachments: this.uploadedAttachments(), // Attach the uploaded file metadata
//       isMeeting: formVal.noteType === 'meeting'
//     };

//     // Clean up empty dates
//     if (!payload.startDate) delete payload.startDate;
//     if (!payload.dueDate) delete payload.dueDate;

//     this.noteService.createNote(payload).subscribe({
//       next: (res) => {
//         this.isSubmitting.set(false);
//         this.router.navigate(['/notes']); // Redirect to list
//       },
//       error: (err) => {
//         console.error('Creation failed', err);
//         this.isSubmitting.set(false);
//       }
//     });
//   }
// }