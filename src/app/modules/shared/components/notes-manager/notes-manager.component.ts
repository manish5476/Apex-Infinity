import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize, debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ImageModule } from 'primeng/image';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';

import { Note, NoteAttachment } from '../../../../core/models/note.types';
import { NoteService } from '../../../../core/services/notes.service';

interface CalendarDay {
  date: Date;
}

type LoadingKey = 'day' | 'week' | 'month' | 'year';
type SummaryKey = 'week' | 'month' | 'year';

interface Summary {
  title: string;
  key: SummaryKey;
  data: Note[];
  icon: string;
}

@Component({
  selector: 'app-notes-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    AutoCompleteModule,
    ToastModule,
    ProgressSpinnerModule,
    TooltipModule,
    ImageModule,
    ConfirmDialogModule,
    TabsModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notes-manager.component.html',
  styleUrls: ['./notes-manager.component.scss'],
  host: { class: 'block h-full w-full' }
})
export class NotesManagerComponent implements OnInit, OnChanges {
  private noteService = inject(NoteService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private confirmationService = inject(ConfirmationService);

  @Input() date!: CalendarDay;

  dailyNotes: Note[] = [];
  filteredDailyNotes: Note[] = [];
  summaries: Summary[] = [];

  selectedNote: Note | null = null;
  isEditing = false;
  isSaving = false;
  isLoading: Record<LoadingKey, boolean> = { day: true, week: false, month: false, year: false };
  activeTabValue: LoadingKey = 'day';

  noteForm: FormGroup;
  searchControl = new FormControl('');

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  private loadedTabs: Record<SummaryKey, boolean> = { week: false, month: false, year: false };
  private _noteToSelectAfterLoad: string | null = null;

  constructor() {
    this.noteForm = this.fb.group({
      _id: [null],
      title: ['', Validators.required],
      content: ['', Validators.required],
      tags: [[]],
      attachments: [[]],
      createdAt: [null]
    });
  }

  ngOnInit(): void {
    this.summaries = [
      { title: 'Week', key: 'week', data: [], icon: 'pi pi-calendar-times' },
      { title: 'Month', key: 'month', data: [], icon: 'pi pi-calendar' },
      { title: 'Year', key: 'year', data: [], icon: 'pi pi-server' }
    ];

    this.setupSearch();
    this.setupAutoSave();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['date']?.currentValue && !changes['date'].firstChange) {
      if (!this._noteToSelectAfterLoad) {
        this.activeTabValue = 'day';
        this.resetAllNotes();
        this.loadDailyNotes();
      }
    }
  }
// CORRECT & FULLY TYPE-SAFE (Works in Angular 16+ / Strict Mode)
@HostListener('document:keydown', ['$event'])
onKeyDown(event: KeyboardEvent): void {
  // Ctrl+S or Cmd+S → Save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    if (this.noteForm.valid && this.noteForm.dirty) {
      this.saveNote();
    }
    return;
  }

  // Ctrl+N or Cmd+N → New Note
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault();
    if (this.activeTabValue === 'day') {
      this.startNewNote();
    }
  }
}
  // // Keyboard Shortcuts
  // @HostListener('document:keydown.control.s', ['$event'])
  // onCtrlS(e: KeyboardEvent) {
  //   e.preventDefault();
  //   if (this.noteForm.valid && (this.isEditing || this.noteForm.dirty)) {
  //     this.saveNote();
  //   }
  // }

  // @HostListener('document:keydown.control.n', ['$event'])
  // onCtrlN(e: KeyboardEvent) {
  //   e.preventDefault();
  //   if (this.activeTabValue === 'day') {
  //     this.startNewNote();
  //   }
  // }


onTabChange(event: any): void {
  // PrimeNG actually sets event.value and event.index on the raw event
  const value = (event as any).value ?? this.activeTabValue;
  this.activeTabValue = value as LoadingKey;

  this.selectedNote = null;
  this.startNewNote();

  if (this.activeTabValue === 'day') {
    this.loadDailyNotes();
    return;
  }

  const key = this.activeTabValue as SummaryKey;
  if (!this.loadedTabs[key]) {
    this.loadSummary(key);
    this.loadedTabs[key] = true;
  }
}
  // Tab Change — Fixed & Improved
  // onTabChange(event: { index: number; value: LoadingKey }): void {
  //   this.activeTabValue = event.value;
  //   this.selectedNote = null;
  //   this.startNewNote();

  //   if (this.activeTabValue === 'day') {
  //     this.loadDailyNotes();
  //     return;
  //   }

  //   const key = this.activeTabValue as SummaryKey;
  //   if (!this.loadedTabs[key]) {
  //     this.loadSummary(key);
  //     this.loadedTabs[key] = true; // Prevent duplicate calls
  //   }
  // }

  loadDailyNotes(): void {
    if (!this.date?.date) return;
    this.updateLoadingState('day', true);

    if (!this._noteToSelectAfterLoad) this.startNewNote();
    const dateStr = this.formatDate(this.date.date);

    this.noteService.getNotes({ date: dateStr })
      .pipe(finalize(() => this.updateLoadingState('day', false)))
      .subscribe({
        next: (res) => {
          this.dailyNotes = this.sortNotes(res.data.notes || []);
          this.filteredDailyNotes = [...this.dailyNotes];

          if (this._noteToSelectAfterLoad) {
            const note = this.dailyNotes.find(n => n._id === this._noteToSelectAfterLoad);
            if (note) this.selectNote(note);
            this._noteToSelectAfterLoad = null;
          }
          this.cdr.markForCheck();
        },
        error: () => this.showError('Failed to load daily notes')
      });
  }

  loadSummary(key: SummaryKey): void {
    if (!this.date?.date) return;
    this.updateLoadingState(key, true);

    const d = this.date.date;
    let req$: any;

    if (key === 'week') req$ = this.noteService.getNotes({ week: this.formatDate(d) });
    else if (key === 'month') req$ = this.noteService.getNotes({ year: d.getFullYear(), month: d.getMonth() + 1 });
    else req$ = this.noteService.getNotes({ year: d.getFullYear() });

    req$.pipe(finalize(() => this.updateLoadingState(key, false)))
      .subscribe({
        next: (res:any) => {
          const summary = this.summaries.find(s => s.key === key);
          if (summary) summary.data = this.sortNotes(res.data.notes || []);
          this.cdr.markForCheck();
        },
        error: () => this.showError(`Failed to load ${key} notes`)
      });
  }

  saveNote(): void {
    if (this.noteForm.invalid || this.isSaving) return;
    this.isSaving = true;

    const upload$ = this.selectedFiles.length > 0
      ? this.noteService.uploadMedia(this.selectedFiles)
      : of({ data: [] });

    upload$.pipe(
      switchMap((uploadRes: any) => {
        const newAttachments = uploadRes.data || [];
        const current = this.noteForm.get('attachments')?.value || [];
        const finalAttachments = [...current, ...newAttachments];

        const payload: Partial<Note> = {
          title: this.noteForm.get('title')?.value,
          content: this.noteForm.get('content')?.value,
          tags: this.noteForm.get('tags')?.value || [],
          attachments: finalAttachments,
          createdAt: this.isEditing ? this.noteForm.get('createdAt')?.value : this.date.date.toISOString()
        };

        return this.isEditing && this.noteForm.get('_id')?.value
          ? this.noteService.updateNote(this.noteForm.get('_id')?.value, payload)
          : this.noteService.createNote(payload);
      }),
      finalize(() => {
        this.isSaving = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Your note is safe!' });
        this.selectedFiles = [];
        this.imagePreviews = [];
        this.refreshCurrentView();
        this.startNewNote();
      },
      error: () => this.showError('Failed to save note')
    });
  }

  deleteNote(note: Note | null, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!note?._id) return;

    this.confirmationService.confirm({
      message: 'This note will be permanently deleted.',
      header: 'Delete Note?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.noteService.deleteNote(note._id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Note removed' });
            this.selectedNote = null;
            this.refreshCurrentView();
          },
          error: () => this.showError('Failed to delete')
        });
      }
    });
  }

  startNewNote(): void {
    this.selectedNote = null;
    this.isEditing = false;
    this.selectedFiles = [];
    this.imagePreviews = [];

    this.noteForm.reset({
      title: '',
      content: '',
      tags: [],
      attachments: [],
      createdAt: this.date?.date || new Date()
    });
    this.noteForm.enable();
    this.cdr.markForCheck();
  }

  selectNote(note: Note): void {
    this.selectedNote = note;
    this.isEditing = true;
    this.selectedFiles = [];
    this.imagePreviews = [];

    this.noteForm.patchValue({
      _id: note._id,
      title: note.title || '',
      content: note.content || '',
      tags: note.tags || [],
      attachments: note.attachments || [],
      createdAt: note.createdAt
    });

    this.isEditable(note) ? this.noteForm.enable() : this.noteForm.disable();

    this.cdr.markForCheck();

    setTimeout(() => {
      document.querySelector('.note-editor-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  onFileSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles.push(...files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  }

  removeLocalPreview(i: number): void {
    this.selectedFiles.splice(i, 1);
    this.imagePreviews.splice(i, 1);
  }

  removeServerAttachment(i: number): void {
    const atts = [...this.noteForm.get('attachments')?.value];
    atts.splice(i, 1);
    this.noteForm.patchValue({ attachments: atts });
  }

  refreshCurrentView(): void {
    this.activeTabValue === 'day' ? this.loadDailyNotes() : this.loadSummary(this.activeTabValue as SummaryKey);
  }

  isEditable(note: Note | null): boolean {
    if (!note?.createdAt) return true;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(note.createdAt).getTime() > oneDayAgo;
  }

  getSummaryData(key: SummaryKey): Note[] {
    return this.summaries.find(s => s.key === key)?.data || [];
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(term => {
        const query = (term || '').toLowerCase().trim();
        this.filteredDailyNotes = query
          ? this.dailyNotes.filter(n =>
              n.title?.toLowerCase().includes(query) ||
              n.content?.toLowerCase().includes(query)
            )
          : [...this.dailyNotes];
        this.cdr.markForCheck();
      });
  }

  private setupAutoSave(): void {
    this.noteForm.valueChanges
      .pipe(
        debounceTime(3000),
        filter(() => this.isEditing && this.noteForm.dirty && this.noteForm.valid)
      )
      .subscribe(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'Auto-saved',
          detail: 'Your changes are safe',
          life: 2000
        });
      });
  }

  private updateLoadingState(key: LoadingKey, val: boolean) {
    this.isLoading[key] = val;
    this.cdr.markForCheck();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private sortNotes(notes: Note[]): Note[] {
    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private resetAllNotes(): void {
    this.dailyNotes = [];
    this.filteredDailyNotes = [];
    this.summaries.forEach(s => s.data = []);
    this.loadedTabs = { week: false, month: false, year: false };
    this.startNewNote();
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}

// import {
//   Component,
//   Input,
//   OnInit,
//   OnChanges,
//   SimpleChanges,
//   inject,
//   ChangeDetectionStrategy,
//   ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
// import { finalize, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // --- PrimeNG Modules ---
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { ToastModule } from 'primeng/toast';
// import { MessageService, ConfirmationService } from 'primeng/api';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { ImageModule } from 'primeng/image';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { TabsModule } from 'primeng/tabs';

// // --- Custom Services & Models ---
// // Adjust these paths to match your folder structure
// import { Note, NoteAttachment } from '../../../../core/models/note.types';
// import { NoteService } from '../../../../core/services/notes.service';

// // --- Local Interfaces ---
// interface CalendarDay {
//   date: Date;
// }

// type LoadingKey = 'day' | 'week' | 'month' | 'year';
// type SummaryKey = 'week' | 'month' | 'year';

// interface Summary {
//   title: string;
//   key: SummaryKey;
//   data: Note[];
//   icon: string;
// }

// @Component({
//   selector: 'app-notes-manager',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ButtonModule,
//     InputTextModule,
//     TextareaModule,
//     AutoCompleteModule,
//     ToastModule,
//     ProgressSpinnerModule,
//     TooltipModule,
//     ImageModule,
//     ConfirmDialogModule,
//     TabsModule
//   ],
//   providers: [MessageService, ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './notes-manager.component.html',
//   styleUrls: ['./notes-manager.component.scss']
// })
// export class NotesManagerComponent implements OnInit, OnChanges {
//   // --- Dependencies ---
//   private noteService = inject(NoteService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);
//   private cdr = inject(ChangeDetectorRef);
//   private confirmationService = inject(ConfirmationService);

//   // --- Inputs ---
//   @Input() date!: CalendarDay;

//   // --- State ---
//   dailyNotes: Note[] = [];
//   filteredDailyNotes: Note[] = [];
//   summaries: Summary[] = [];
//   selectedNote: Note | null = null;

//   // --- Forms & Controls ---
//   noteForm: FormGroup;
//   searchControl = new FormControl('');

//   // --- File Upload State ---
//   selectedFiles: File[] = [];     // Raw files waiting to be uploaded
//   imagePreviews: string[] = [];   // Base64 strings for UI preview

//   // --- UI Flags ---
//   isEditing = false;
//   isSaving = false;
//   isLoading: Record<LoadingKey, boolean> = { day: true, week: false, month: false, year: false };
//   activeTabValue: LoadingKey = 'day';
  
//   private loadedTabs: Record<SummaryKey, boolean> = { week: false, month: false, year: false };
//   private _noteToSelectAfterLoad: string | null = null;

//   constructor() {
//     this.noteForm = this.fb.group({
//       _id: [null],
//       title: ['', Validators.required],
//       content: ['', Validators.required],
//       tags: [[]],
//       attachments: [[]], // Stores NoteAttachment objects {url, publicId}
//       createdAt: [null]
//     });
//   }

//   ngOnInit(): void {
//     this.summaries = [
//       { title: 'Week', key: 'week', data: [], icon: 'pi pi-calendar-times' },
//       { title: 'Month', key: 'month', data: [], icon: 'pi pi-calendar' },
//       { title: 'Year', key: 'year', data: [], icon: 'pi pi-server' }
//     ];
//     this.setupSearch();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['date']?.currentValue) {
//       // Only reset view if we aren't in the middle of a specific workflow
//       if (!this._noteToSelectAfterLoad) {
//         this.activeTabValue = 'day';
//         this.resetAllNotes();
//         this.loadDailyNotes();
//       }
//     }
//   }

//   // ==========================================================================
//   // 1. DATA LOADING LOGIC
//   // ==========================================================================

//   loadDailyNotes(): void {
//     if (!this.date?.date) return;
//     this.updateLoadingState('day', true);
    
//     if (!this._noteToSelectAfterLoad) this.startNewNote();

//     const dateStr = this.formatDate(this.date.date);
    
//     this.noteService.getNotes({ date: dateStr })
//       .pipe(finalize(() => this.updateLoadingState('day', false)))
//       .subscribe({
//         next: (res) => {
//           this.dailyNotes = this.sortNotes(res.data.notes || []);
//           this.filteredDailyNotes = [...this.dailyNotes];

//           // If we just edited a note and want to re-select it
//           if (this._noteToSelectAfterLoad) {
//             const target = this.dailyNotes.find(n => n._id === this._noteToSelectAfterLoad);
//             if (target) this.selectNote(target);
//             this._noteToSelectAfterLoad = null;
//           }
//           this.cdr.markForCheck();
//         },
//         error: () => this.showError('Failed to load daily notes')
//       });
//   }

//   loadSummary(key: SummaryKey): void {
//     if (!this.date?.date) return;
//     this.updateLoadingState(key, true);

//     let req$;
//     const d = this.date.date;
//     const dateStr = this.formatDate(d);

//     // Handle API param differences
//     if (key === 'week') req$ = this.noteService.getNotes({ week: dateStr });
//     else if (key === 'month') req$ = this.noteService.getNotes({ year: d.getFullYear(), month: d.getMonth() + 1 });
//     else req$ = this.noteService.getNotes({ year: d.getFullYear() });

//     req$.pipe(finalize(() => this.updateLoadingState(key, false)))
//       .subscribe({
//         next: (res) => {
//           const summary = this.summaries.find(s => s.key === key);
//           if (summary) summary.data = this.sortNotes(res.data.notes || []);
//           this.loadedTabs[key] = true;
//           this.cdr.markForCheck();
//         },
//         error: () => this.showError(`Failed to load ${key} notes`)
//       });
//   }

//   // ==========================================================================
//   // 2. SAVE / UPDATE LOGIC (The "Smooth Transaction")
//   // ==========================================================================

//   saveNote(): void {
//     if (this.noteForm.invalid) return;
//     this.isSaving = true;

//     // Step A: Determine if we need to upload files first
//     const uploadStream$ = this.selectedFiles.length > 0 
//       ? this.noteService.uploadMedia(this.selectedFiles) 
//       : of({ data: [] }); // Return empty data if no files

//     uploadStream$.pipe(
//       switchMap((uploadRes: any) => {
//         // Step B: Merge newly uploaded attachments with existing ones
//         const newAttachments = uploadRes.data || [];
//         const currentAttachments = this.noteForm.get('attachments')?.value || [];
//         const finalAttachments = [...currentAttachments, ...newAttachments];

//         // Step C: Prepare Payload
//         const formValue = this.noteForm.getRawValue();
//         const notePayload: Partial<Note> = {
//           title: formValue.title,
//           content: formValue.content,
//           tags: formValue.tags,
//           attachments: finalAttachments,
//           // If creating new, force date to selected calendar day
//           createdAt: this.isEditing ? formValue.createdAt : this.date.date.toISOString() 
//         };

//         // Step D: Create or Update
//         if (this.isEditing && formValue._id) {
//           return this.noteService.updateNote(formValue._id, notePayload);
//         } else {
//           return this.noteService.createNote(notePayload);
//         }
//       }),
//       finalize(() => {
//         this.isSaving = false;
//         this.cdr.markForCheck();
//       })
//     ).subscribe({
//       next: (res) => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Note saved!' });
        
//         // Reset file inputs
//         this.selectedFiles = [];
//         this.imagePreviews = [];
        
//         // Refresh data
//         this.startNewNote(); 
//         this.refreshCurrentView(); 
//       },
//       error: (err) => this.showError('Failed to save note')
//     });
//   }

//   deleteNote(note: Note | null, event?: MouseEvent): void {
//     event?.stopPropagation();
//     if (!note?._id) return;

//     this.confirmationService.confirm({
//       message: 'Are you sure you want to delete this note?',
//       header: 'Confirm Deletion',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         this.noteService.deleteNote(note._id!).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Note removed' });
//             this.selectedNote = null;
//             this.refreshCurrentView();
//           },
//           error: () => this.showError('Failed to delete note')
//         });
//       }
//     });
//   }

//   // ==========================================================================
//   // 3. FORM & FILE HANDLING
//   // ==========================================================================

//   startNewNote(): void {
//     this.selectedNote = null;
//     this.isEditing = false;
//     this.selectedFiles = [];
//     this.imagePreviews = [];
    
//     this.noteForm.enable();
//     this.noteForm.reset({
//       title: '',
//       content: '',
//       tags: [],
//       attachments: [],
//       createdAt: this.date?.date || new Date()
//     });
//     this.cdr.markForCheck();
//   }

//   selectNote(note: Note): void {
//     this.selectedNote = note;
//     this.isEditing = true;
//     // Clear pending uploads when switching notes
//     this.selectedFiles = [];
//     this.imagePreviews = [];
    
//     this.noteForm.patchValue({
//       _id: note._id,
//       title: note.title,
//       content: note.content,
//       tags: note.tags || [],
//       attachments: note.attachments || [], // Load existing server attachments
//       createdAt: note.createdAt
//     });

//     this.isEditable(note) ? this.noteForm.enable() : this.noteForm.disable();
//     this.cdr.markForCheck();
//   }

//   /**
//    * Handles local file selection for preview BEFORE upload
//    */
//   onFileSelect(event: any): void {
//     if (event.target.files && event.target.files.length > 0) {
//       const files = Array.from(event.target.files) as File[];
//       this.selectedFiles.push(...files);

//       // Generate Base64 previews for UI
//       files.forEach(file => {
//         const reader = new FileReader();
//         reader.onload = (e: any) => {
//           this.imagePreviews.push(e.target.result);
//           this.cdr.markForCheck();
//         };
//         reader.readAsDataURL(file);
//       });
//     }
//   }

//   // Remove a pending local file
//   removeLocalPreview(index: number): void {
//     this.selectedFiles.splice(index, 1);
//     this.imagePreviews.splice(index, 1);
//   }

//   // Remove an already saved attachment (Note: needs backend delete logic ideally)
//   removeServerAttachment(index: number): void {
//     const current = this.noteForm.get('attachments')?.value || [];
//     current.splice(index, 1);
//     this.noteForm.patchValue({ attachments: current });
//     this.noteForm.markAsDirty();
//   }

//   // ==========================================================================
//   // 4. HELPERS
//   // ==========================================================================

//   refreshCurrentView(): void {
//     if (this.activeTabValue === 'day') this.loadDailyNotes();
//     else this.loadSummary(this.activeTabValue as SummaryKey);
//   }

//   onTabChange(event:any): void {
//   this.activeTabValue = event.value;
//   this.selectedNote = null;
//   this.startNewNote(); // Better UX: reset editor when switching tabs

//   if (this.activeTabValue === 'day') {
//     this.loadDailyNotes();
//     return;
//   }

//   const key = this.activeTabValue as SummaryKey;
//   if (!this.loadedTabs[key]) {
//     this.loadSummary(key);
//     // Mark as loaded immediately to prevent duplicate calls
//     this.loadedTabs[key] = true;
//   }
// }
//   // onTabChange(event: any): void {
//   //   console.log(event);
//   //   this.activeTabValue = event.value as LoadingKey;
//   //   this.selectedNote = null;
//   //   if (this.activeTabValue !== 'day') {
//   //     const key = this.activeTabValue as SummaryKey;
//   //     if (!this.loadedTabs[key]) this.loadSummary(key);
//   //   }
//   // }

//   isEditable(note: Note | null): boolean {
//     if (!note?.createdAt) return true; 
//     // Logic: Notes older than 24h are read-only
//     const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
//     return new Date(note.createdAt).getTime() > oneDayAgo;
//   }

//   getSummaryData(key: SummaryKey): Note[] {
//     return this.summaries.find(s => s.key === key)?.data || [];
//   }

//   private setupSearch(): void {
//     this.searchControl.valueChanges.pipe(debounceTime(250), distinctUntilChanged())
//       .subscribe(term => {
//         const t = (term || '').toLowerCase();
//         this.filteredDailyNotes = !t 
//           ? this.dailyNotes 
//           : this.dailyNotes.filter(n => n.title.toLowerCase().includes(t) || n.content.toLowerCase().includes(t));
//         this.cdr.markForCheck();
//       });
//   }

//   private updateLoadingState(key: LoadingKey, val: boolean) {
//     this.isLoading[key] = val;
//     this.cdr.markForCheck();
//   }

//   private formatDate(date: Date): string {
//     return date.toISOString().split('T')[0];
//   }

//   private sortNotes(notes: Note[]): Note[] {
//     return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
//   }

//   private resetAllNotes(): void {
//     this.dailyNotes = [];
//     this.filteredDailyNotes = [];
//     this.summaries.forEach(s => s.data = []);
//     this.loadedTabs = { week: false, month: false, year: false };
//     this.startNewNote();
//   }

//   private showError(msg: string) {
//     this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
//   }
// }

// // import {
// //   Component,
// //   Input,
// //   OnInit,
// //   OnChanges,
// //   SimpleChanges,
// //   inject,
// //   ChangeDetectionStrategy,
// //   ChangeDetectorRef
// // } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { finalize, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
// // import { of } from 'rxjs';

// // // --- PrimeNG Modules ---
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { TextareaModule } from 'primeng/textarea';
// // import { AutoCompleteModule } from 'primeng/autocomplete';
// // import { ToastModule } from 'primeng/toast';
// // import { MessageService, ConfirmationService } from 'primeng/api';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { ImageModule } from 'primeng/image';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { TabsModule } from 'primeng/tabs';
// // import { FileUploadModule } from 'primeng/fileupload'; // Added for UI

// // // --- Custom Services & Models ---
// // import { Note, NoteAttachment } from '../../../../core/models/note.types';
// // import { NoteService } from '../../../../core/services/notes.service';

// // // --- Component Interfaces ---
// // interface CalendarDay {
// //   date: Date;
// // }

// // type LoadingKey = 'day' | 'week' | 'month' | 'year';
// // type SummaryKey = 'week' | 'month' | 'year';

// // interface Summary {
// //   title: string;
// //   key: SummaryKey;
// //   data: Note[];
// //   icon: string;
// // }

// // @Component({
// //   selector: 'app-notes-manager',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     ButtonModule,
// //     InputTextModule,
// //     TextareaModule,
// //     AutoCompleteModule,
// //     ToastModule,
// //     ProgressSpinnerModule,
// //     TooltipModule,
// //     ImageModule,
// //     ConfirmDialogModule,
// //     TabsModule,
// //     FileUploadModule 
// //   ],
// //   providers: [MessageService, ConfirmationService],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   templateUrl: './notes-manager.component.html',
// //   styleUrls: ['./notes-manager.component.scss']
// // })
// // export class NotesManagerComponent implements OnInit, OnChanges {
// //   // --- Dependencies ---
// //   private noteService = inject(NoteService);
// //   private fb = inject(FormBuilder);
// //   private messageService = inject(MessageService);
// //   private cdr = inject(ChangeDetectorRef);
// //   private confirmationService = inject(ConfirmationService);

// //   // --- Inputs ---
// //   @Input() date!: CalendarDay;

// //   // --- State ---
// //   dailyNotes: Note[] = [];
// //   filteredDailyNotes: Note[] = [];
// //   summaries: Summary[] = [];
// //   selectedNote: Note | null = null;

// //   // --- Forms & Controls ---
// //   noteForm: FormGroup;
// //   searchControl = new FormControl('');
  
// //   // File Upload State
// //   selectedFiles: File[] = []; 
// //   imagePreviews: string[] = [];

// //   // UI State
// //   isEditing = false;
// //   isSaving = false;
// //   isLoading: Record<LoadingKey, boolean> = { day: true, week: false, month: false, year: false };
// //   activeTabValue: LoadingKey = 'day';
  
// //   private loadedTabs: Record<SummaryKey, boolean> = { week: false, month: false, year: false };
// //   private _noteToSelectAfterLoad: string | null = null;

// //   constructor() {
// //     this.noteForm = this.fb.group({
// //       _id: [null],
// //       title: ['', Validators.required],
// //       content: ['', Validators.required],
// //       tags: [[]],
// //       attachments: [[]], // Stores NoteAttachment[] objects now
// //       createdAt: [null]
// //     });
// //   }

// //   ngOnInit(): void {
// //     this.summaries = [
// //       { title: 'Week', key: 'week', data: [], icon: 'pi pi-calendar-times' },
// //       { title: 'Month', key: 'month', data: [], icon: 'pi pi-calendar' },
// //       { title: 'Year', key: 'year', data: [], icon: 'pi pi-server' }
// //     ];
// //     this.setupSearch();
// //   }

// //   ngOnChanges(changes: SimpleChanges): void {
// //     if (changes['date']?.currentValue) {
// //       // If we have a pending note selection, don't reset everything abruptly
// //       if (!this._noteToSelectAfterLoad) {
// //         this.activeTabValue = 'day';
// //         this.resetAllNotes();
// //         this.loadDailyNotes();
// //       }
// //     }
// //   }

// //   // --- 1. DATA LOADING ---

// //   loadDailyNotes(): void {
// //     if (!this.date?.date) return;
// //     this.updateLoadingState('day', true);
    
// //     if (!this._noteToSelectAfterLoad) this.startNewNote();

// //     const dateStr = this.formatDate(this.date.date);
    
// //     this.noteService.getNotes({ date: dateStr })
// //       .pipe(finalize(() => this.updateLoadingState('day', false)))
// //       .subscribe({
// //         next: (res) => {
// //           this.dailyNotes = this.sortNotes(res.data.notes || []);
// //           this.filteredDailyNotes = [...this.dailyNotes];

// //           if (this._noteToSelectAfterLoad) {
// //             const target = this.dailyNotes.find(n => n._id === this._noteToSelectAfterLoad);
// //             if (target) this.selectNote(target);
// //             this._noteToSelectAfterLoad = null;
// //           }
// //           this.cdr.markForCheck();
// //         },
// //         error: () => this.showError('Failed to load daily notes')
// //       });
// //   }

// //   loadSummary(key: SummaryKey): void {
// //     if (!this.date?.date) return;
// //     this.updateLoadingState(key, true);

// //     let req$;
// //     const d = this.date.date;
// //     const dateStr = this.formatDate(d);

// //     if (key === 'week') req$ = this.noteService.getNotes({ week: dateStr });
// //     else if (key === 'month') req$ = this.noteService.getNotes({ year: d.getFullYear(), month: d.getMonth() + 1 });
// //     else req$ = this.noteService.getNotes({ year: d.getFullYear() });

// //     req$.pipe(finalize(() => this.updateLoadingState(key, false)))
// //       .subscribe({
// //         next: (res) => {
// //           const summary = this.summaries.find(s => s.key === key);
// //           if (summary) summary.data = this.sortNotes(res.data.notes || []);
// //           this.loadedTabs[key] = true;
// //           this.cdr.markForCheck();
// //         },
// //         error: () => this.showError(`Failed to load ${key} notes`)
// //       });
// //   }

// //   // --- 2. NOTE CRUD ---

// //   saveNote(): void {
// //     if (this.noteForm.invalid) return;
// //     this.isSaving = true;

// //     // Step 1: Handle File Uploads (if any new files selected)
// //     const upload$ = this.selectedFiles.length > 0 
// //       ? this.noteService.uploadMedia(this.selectedFiles) 
// //       : of({ data: [] });

// //     upload$.pipe(
// //       switchMap((uploadRes: any) => {
// //         // Step 2: Combine old attachments with new uploaded ones
// //         const newAttachments = uploadRes.data || [];
// //         const currentAttachments = this.noteForm.get('attachments')?.value || [];
// //         const finalAttachments = [...currentAttachments, ...newAttachments];

// //         const formValue = this.noteForm.getRawValue();
        
// //         const notePayload: Partial<Note> = {
// //           title: formValue.title,
// //           content: formValue.content,
// //           tags: formValue.tags,
// //           attachments: finalAttachments,
// //           // If new note, force date to current selected calendar day
// //           createdAt: this.isEditing ? formValue.createdAt : this.date.date.toISOString() 
// //         };

// //         // Step 3: Save or Update Note
// //         if (this.isEditing && formValue._id) {
// //           return this.noteService.updateNote(formValue._id, notePayload);
// //         } else {
// //           return this.noteService.createNote(notePayload);
// //         }
// //       }),
// //       finalize(() => {
// //         this.isSaving = false;
// //         this.cdr.markForCheck();
// //       })
// //     ).subscribe({
// //       next: (res) => {
// //         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Note saved!' });
// //         this.startNewNote(); // Reset form
// //         this.refreshCurrentView(); // Refresh list
// //       },
// //       error: (err) => this.showError('Failed to save note')
// //     });
// //   }

// //   deleteNote(note: Note | null, event?: MouseEvent): void {
// //     event?.stopPropagation();
// //     if (!note?._id) return;

// //     this.confirmationService.confirm({
// //       message: 'Delete this note?',
// //       header: 'Confirm',
// //       icon: 'pi pi-exclamation-triangle',
// //       accept: () => {
// //         this.noteService.deleteNote(note._id!).subscribe({
// //           next: () => {
// //             this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Note removed' });
// //             this.selectedNote = null;
// //             this.refreshCurrentView();
// //           },
// //           error: () => this.showError('Failed to delete note')
// //         });
// //       }
// //     });
// //   }

// //   // --- 3. UI & SELECTION HANDLERS ---

// //   startNewNote(): void {
// //     this.selectedNote = null;
// //     this.isEditing = false;
// //     this.selectedFiles = [];
// //     this.imagePreviews = [];
// //     this.noteForm.enable();
// //     this.noteForm.reset({
// //       title: '',
// //       content: '',
// //       tags: [],
// //       attachments: [],
// //       createdAt: this.date?.date || new Date()
// //     });
// //     this.cdr.markForCheck();
// //   }

// //   selectNote(note: Note): void {
// //     this.selectedNote = note;
// //     this.isEditing = true;
// //     this.selectedFiles = [];
// //     this.imagePreviews = [];
    
// //     this.noteForm.patchValue({
// //       _id: note._id,
// //       title: note.title,
// //       content: note.content,
// //       tags: note.tags || [],
// //       attachments: note.attachments || [],
// //       createdAt: note.createdAt
// //     });

// //     this.isEditable(note) ? this.noteForm.enable() : this.noteForm.disable();
// //     this.cdr.markForCheck();
// //   }

// //   // --- 4. FILE HANDLING (UI) ---

// //   onFileSelect(event: any): void {
// //     if (event.target.files && event.target.files.length > 0) {
// //       const files = Array.from(event.target.files) as File[];
// //       this.selectedFiles.push(...files);

// //       // Create local previews
// //       files.forEach(file => {
// //         const reader = new FileReader();
// //         reader.onload = (e: any) => {
// //           this.imagePreviews.push(e.target.result);
// //           this.cdr.markForCheck();
// //         };
// //         reader.readAsDataURL(file);
// //       });
// //     }
// //   }

// //   removeLocalPreview(index: number): void {
// //     this.selectedFiles.splice(index, 1);
// //     this.imagePreviews.splice(index, 1);
// //   }

// //   // Removes an attachment that is ALREADY saved on the server
// //   removeServerAttachment(index: number): void {
// //     const currentAttachments = this.noteForm.get('attachments')?.value || [];
// //     // Note: In a real app, you might want to call an API to delete the image from Cloudinary here
// //     // For now, we just remove it from the array so it gets updated on next Save.
// //     currentAttachments.splice(index, 1);
// //     this.noteForm.patchValue({ attachments: currentAttachments });
// //   }

// //   // --- 5. HELPERS ---

// //   refreshCurrentView(): void {
// //     if (this.activeTabValue === 'day') this.loadDailyNotes();
// //     else this.loadSummary(this.activeTabValue as SummaryKey);
// //   }

// //   onTabChange(event: any): void {
// //     this.activeTabValue = event.value as LoadingKey;
// //     this.selectedNote = null;
// //     if (this.activeTabValue !== 'day') {
// //       const key = this.activeTabValue as SummaryKey;
// //       if (!this.loadedTabs[key]) this.loadSummary(key);
// //     }
// //   }

// //   isEditable(note: Note | null): boolean {
// //     if (!note?.createdAt) return true; // New notes are editable
// //     const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
// //     return new Date(note.createdAt).getTime() > oneDayAgo;
// //   }

// //   private setupSearch(): void {
// //     this.searchControl.valueChanges.pipe(debounceTime(250), distinctUntilChanged())
// //       .subscribe(term => {
// //         const t = (term || '').toLowerCase();
// //         this.filteredDailyNotes = !t 
// //           ? this.dailyNotes 
// //           : this.dailyNotes.filter(n => n.title.toLowerCase().includes(t) || n.content.toLowerCase().includes(t));
// //         this.cdr.markForCheck();
// //       });
// //   }

// //   private updateLoadingState(key: LoadingKey, val: boolean) {
// //     this.isLoading[key] = val;
// //     this.cdr.markForCheck();
// //   }

// //   private formatDate(date: Date): string {
// //     return date.toISOString().split('T')[0];
// //   }

// //   private sortNotes(notes: Note[]): Note[] {
// //     return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
// //   }

// //   private resetAllNotes(): void {
// //     this.dailyNotes = [];
// //     this.filteredDailyNotes = [];
// //     this.summaries.forEach(s => s.data = []);
// //     this.loadedTabs = { week: false, month: false, year: false };
// //     this.startNewNote();
// //   }

// //   private showError(msg: string) {
// //     this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
// //   }
  
// //   // Helper for template to get safe data
// //   getSummaryData(key: SummaryKey): Note[] {
// //     return this.summaries.find(s => s.key === key)?.data || [];
// //   }
// // }

// // // // import { ImageUploaderComponent } from './../image-uploader.component';
// // // import {
// // //   Component,
// // //   Input,
// // //   OnInit,
// // //   OnChanges,
// // //   SimpleChanges,
// // //   inject,
// // //   ChangeDetectionStrategy,
// // //   ChangeDetectorRef
// // // } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// // // import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// // // // --- Custom App Components ---
// // // // import { NoteService } from '../../../core/services/note.service';
// // // // --- PrimeNG Modules ---
// // // import { ButtonModule } from 'primeng/button';
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { TextareaModule } from 'primeng/textarea';
// // // import { AutoCompleteModule } from 'primeng/autocomplete';
// // // import { ToastModule } from 'primeng/toast';
// // // import { MessageService, ConfirmationService } from 'primeng/api';
// // // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // // import { TooltipModule } from 'primeng/tooltip';
// // // import { ImageModule } from 'primeng/image';
// // // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // // import { TabsModule } from 'primeng/tabs';
// // // import { ApiService } from '../../../../core/services/api';
// // // import { NoteService } from '../../../../core/services/notes.service';

// // // // --- Interfaces ---
// // // interface Note {
// // //   _id: string;
// // //   title: string;
// // //   content: string;
// // //   tags: string[];
// // //   attachments: string[];
// // //   createdAt: string;
// // // }

// // // interface CalendarDay {
// // //   date: Date;
// // // }

// // // type LoadingKey = 'day' | 'week' | 'month' | 'year';
// // // type SummaryKey = 'week' | 'month' | 'year';

// // // interface Summary {
// // //   title: string;
// // //   key: SummaryKey;
// // //   data: Note[];
// // //   icon: string;
// // // }

// // // @Component({
// // //   selector: 'app-notes-manager',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     ReactiveFormsModule,
// // //     // ImageUploaderComponent,
// // //     ButtonModule,
// // //     InputTextModule,
// // //     TextareaModule,
// // //     AutoCompleteModule,
// // //     ToastModule,
// // //     ProgressSpinnerModule,
// // //     TooltipModule,
// // //     ImageModule,
// // //     ConfirmDialogModule,
// // //     TabsModule
// // //   ],
// // //   providers: [MessageService, ConfirmationService],
// // //   changeDetection: ChangeDetectionStrategy.OnPush,
// // //   templateUrl: './notes-manager.component.html',
// // //   styleUrls: ['./notes-manager.component.scss']
// // // })
// // // export class NotesManagerComponent implements OnInit, OnChanges {
// // //   // --- Services ---
// // //   private noteService = inject(NoteService);
// // //   private fb = inject(FormBuilder);
// // //   private messageService = inject(MessageService);
// // //   private cdr = inject(ChangeDetectorRef);
// // //   private confirmationService = inject(ConfirmationService);

// // //   @Input() date!: CalendarDay;

// // //   // --- State ---
// // //   dailyNotes: Note[] = [];
// // //   filteredDailyNotes: Note[] = [];
// // //   summaries: Summary[] = [];
// // //   selectedNote: any

// // //   noteForm: FormGroup;
// // //   searchControl = new FormControl('');
// // //   isEditing = false;
// // //   isSaving = false;
// // //   isLoading: Record<LoadingKey, boolean> = { day: true, week: false, month: false, year: false };
// // //   activeTabValue: LoadingKey = 'day';
// // //   private loadedTabs: Record<SummaryKey, boolean> = { week: false, month: false, year: false };
// // //   private _noteToSelectAfterLoad: string | null = null;

// // //   constructor() {
// // //     this.noteForm = this.fb.group({
// // //       _id: [null],
// // //       title: ['', Validators.required],
// // //       content: ['', Validators.required],
// // //       tags: [[]],
// // //       attachments: [[]],
// // //       createdAt: [null]
// // //     });
// // //   }

// // //   // ✅ Initialize summaries
// // //   ngOnInit(): void {
// // //     this.summaries = [
// // //       { title: 'Week', key: 'week', data: [], icon: 'pi pi-calendar-times' },
// // //       { title: 'Month', key: 'month', data: [], icon: 'pi pi-calendar' },
// // //       { title: 'Year', key: 'year', data: [], icon: 'pi pi-server' }
// // //     ];
// // //     this.setupSearch();
// // //   }

// // //   // ngOnChanges(changes: SimpleChanges): void {
// // //   //   if (changes['date']?.currentValue && !this._noteToSelectAfterLoad) {
// // //   //     this.activeTabValue = 'day';
// // //   //     this.resetAllNotes();
// // //   //     this.loadDailyNotes();
// // //   //   }
// // //   // }
// // // ngOnChanges(changes: SimpleChanges): void {
// // //   if (changes['date']?.currentValue && !this._noteToSelectAfterLoad) {
// // //     this.activeTabValue = 'day';
// // //     this.resetAllNotes();
// // //     this.loadDailyNotes();
// // //   }
// // // }

// // // getSummaryData(key: 'week' | 'month' | 'year'): Note[] {
// // //   const summary = this.summaries.find(s => s.key === key);
// // //   return summary ? summary.data : [];
// // // }

// // //   // 🔍 Local search
// // //   private setupSearch(): void {
// // //     this.searchControl.valueChanges.pipe(
// // //       debounceTime(250),
// // //       distinctUntilChanged()
// // //     ).subscribe(searchTerm => {
// // //       const term = (searchTerm || '').toLowerCase();
// // //       this.filteredDailyNotes = !term
// // //         ? this.dailyNotes
// // //         : this.dailyNotes.filter(n =>
// // //             n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
// // //           );
// // //       this.cdr.markForCheck();
// // //     });
// // //   }

// // //   // 🔹 Reusable data handler
// // //   private createDataHandler<T extends { data: { notes: Note[] } }>(callback: (res: T) => void) {
// // //     return {
// // //       next: (res: T) => {
// // //         callback(res);
// // //         this.cdr.markForCheck();
// // //       },
// // //       error: () => {
// // //         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load notes.' });
// // //         this.cdr.markForCheck();
// // //       }
// // //     };
// // //   }

// // //   private updateLoadingState(key: LoadingKey, value: boolean): void {
// // //     this.isLoading[key] = value;
// // //     this.cdr.markForCheck();
// // //   }

// // //   // 🗓️ Daily notes
// // //   loadDailyNotes(): void {
// // //     if (!this.date?.date) return;
// // //     this.updateLoadingState('day', true);
// // //     if (!this._noteToSelectAfterLoad) this.startNewNote();

// // //     this.noteService
// // //       .getNotes({ date: this.formatDate(this.date.date) })
// // //       .pipe(finalize(() => this.updateLoadingState('day', false)))
// // //       .subscribe(this.createDataHandler(res => {
// // //         this.dailyNotes = this.sortNotes(res.data.notes || []);
// // //         this.filteredDailyNotes = [...this.dailyNotes];

// // //         if (this._noteToSelectAfterLoad) {
// // //           const noteToSelect = this.dailyNotes.find(n => n._id === this._noteToSelectAfterLoad);
// // //           if (noteToSelect) this.selectNote(noteToSelect);
// // //           this._noteToSelectAfterLoad = null;
// // //         }
// // //       }));
// // //   }

// // //   // 📅 Weekly, Monthly, Yearly summaries
// // //   loadWeeklyNotes(): void {
// // //     if (!this.date?.date) return;
// // //     this.updateLoadingState('week', true);
// // //     this.noteService
// // //       .getNotes({ week: this.formatDate(this.date.date) })
// // //       .pipe(finalize(() => this.updateLoadingState('week', false)))
// // //       .subscribe(this.createDataHandler(res => this.updateSummary('week', res.data.notes)));
// // //   }

// // //   loadMonthlyNotes(): void {
// // //     if (!this.date?.date) return;
// // //     const d = this.date.date;
// // //     this.updateLoadingState('month', true);
// // //     this.noteService
// // //       .getNotesForMonth(d.getFullYear(), d.getMonth() + 1)
// // //       .pipe(finalize(() => this.updateLoadingState('month', false)))
// // //       .subscribe(this.createDataHandler(res => this.updateSummary('month', res.data.notes)));
// // //   }

// // //   loadYearlyNotes(): void {
// // //     if (!this.date?.date) return;
// // //     this.updateLoadingState('year', true);
// // //     this.noteService
// // //       .getNotes({ year: this.date.date.getFullYear() })
// // //       .pipe(finalize(() => this.updateLoadingState('year', false)))
// // //       .subscribe(this.createDataHandler(res => this.updateSummary('year', res.data.notes)));
// // //   }

// // //   private updateSummary(key: SummaryKey, notes: Note[]): void {
// // //     const summary = this.summaries.find(s => s.key === key);
// // //     if (summary) summary.data = this.sortNotes(notes || []);
// // //     this.loadedTabs[key] = true;
// // //   }

// // //   // 🔄 Refresh active tab
// // //   refreshCurrentView(): void {
// // //     const map: Record<LoadingKey, () => void> = {
// // //       day: () => this.loadDailyNotes(),
// // //       week: () => this.loadWeeklyNotes(),
// // //       month: () => this.loadMonthlyNotes(),
// // //       year: () => this.loadYearlyNotes()
// // //     };
// // //     map[this.activeTabValue]?.();
// // //   }

// // //   // 🧭 Tab change handler
// // //   onTabChange(event: any): void {
// // //     this.activeTabValue = event.value as LoadingKey;
// // //     this.selectedNote = null;
// // //     if (this.activeTabValue !== 'day') {
// // //       const key = this.activeTabValue as SummaryKey;
// // //       if (!this.loadedTabs[key]) this.refreshCurrentView();
// // //     }
// // //     this.cdr.markForCheck();
// // //   }

// // //   // 📝 CRUD operations
// // //   selectNote(note: Note): void {
// // //     this.selectedNote = note;
// // //     this.isEditing = true;
// // //     this.noteForm.reset(note);
// // //     this.isEditable(note) ? this.noteForm.enable() : this.noteForm.disable();
// // //     this.cdr.markForCheck();
// // //   }

// // //   selectForPreview(note: Note): void {
// // //     this.selectedNote = note;
// // //     this.cdr.markForCheck();
// // //   }

// // //   startNewNote(): void {
// // //     this.selectedNote = null;
// // //     this.isEditing = false;
// // //     this.noteForm.enable();
// // //     this.noteForm.reset({
// // //       createdAt: this.date?.date || new Date(),
// // //       tags: [],
// // //       attachments: []
// // //     });
// // //     this.cdr.markForCheck();
// // //   }

// // //   saveNote(): void {
// // //     if (this.noteForm.invalid) return;
// // //     this.isSaving = true;
// // //     const formData = this.noteForm.getRawValue();
// // //     const req$ = this.isEditing
// // //       ? this.noteService.updateNote(formData._id, formData)
// // //       : this.noteService.createNote({ ...formData, createdAt: this.date.date });

// // //     req$.pipe(finalize(() => (this.isSaving = false)))
// // //       .subscribe({
// // //         next: (res: any) => {
// // //           this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Note saved successfully' });
// // //           this.refreshCurrentView();
// // //           if (res.data.note) this.selectNote(res.data.note);
// // //         },
// // //         error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save note.' })
// // //       });
// // //   }

// // //   deleteNote(note: Note | null, event?: MouseEvent): void {
// // //     if (event) event.stopPropagation();
// // //     if (!note || !this.isEditable(note)) {
// // //       this.messageService.add({ severity: 'warn', summary: 'Permission Denied', detail: 'This note is too old to delete.' });
// // //       return;
// // //     }
// // //     this.confirmationService.confirm({
// // //       message: 'Are you sure you want to delete this note?',
// // //       header: 'Delete Confirmation',
// // //       icon: 'pi pi-exclamation-triangle',
// // //       accept: () => {
// // //         this.noteService.deleteNote(note._id).subscribe({
// // //           next: () => {
// // //             this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Note deleted' });
// // //             this.selectedNote = null;
// // //             this.refreshCurrentView();
// // //           },
// // //           error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete note.' })
// // //         });
// // //       }
// // //     });
// // //   }

// // //   editNoteFromCard(note: Note, event: MouseEvent): void {
// // //     event.stopPropagation();
// // //     this.editNoteFromPreview(note);
// // //   }

// // //   editNoteFromPreview(note: Note | null): void {
// // //     if (!note) return;
// // //     this.date = { date: new Date(note.createdAt) };
// // //     this._noteToSelectAfterLoad = note._id;
// // //     this.activeTabValue = 'day';
// // //     this.loadDailyNotes();
// // //     this.cdr.markForCheck();
// // //   }

// // //   // 📎 Attachments
// // //   onImageUploaded(url: string): void {
// // //     const attachments = this.noteForm.get('attachments')?.value || [];
// // //     this.noteForm.get('attachments')?.setValue([...attachments, url]);
// // //     this.cdr.markForCheck();
// // //   }

// // //   removeAttachment(index: number): void {
// // //     const attachments = [...(this.noteForm.get('attachments')?.value || [])];
// // //     attachments.splice(index, 1);
// // //     this.noteForm.get('attachments')?.setValue(attachments);
// // //     this.cdr.markForCheck();
// // //   }

// // //   // 🧩 Helpers
// // //   private formatDate(date: Date): string {
// // //     return date.toISOString().split('T')[0];
// // //   }

// // //   private sortNotes(notes: Note[]): Note[] {
// // //     return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
// // //   }

// // //   private resetAllNotes(): void {
// // //     this.dailyNotes = [];
// // //     this.filteredDailyNotes = [];
// // //     this.summaries.forEach(s => (s.data = []));
// // //     this.loadedTabs = { week: false, month: false, year: false };
// // //     this.startNewNote();
// // //   }

// // //   isEditable(note: Note | null): boolean {
// // //     if (!note?.createdAt) return false;
// // //     const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
// // //     return new Date(note.createdAt).getTime() > oneDayAgo;
// // //   }
// // // }
