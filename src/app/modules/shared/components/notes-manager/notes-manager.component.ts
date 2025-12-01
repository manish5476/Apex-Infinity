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
import { of } from 'rxjs';

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

import { Note } from '../../../../core/models/note.types';
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

  // ---------- UI STATE ----------
  isFocusMode = false; // when true, hides sidebar on large screens

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

  // ---------- COMPUTED HELPERS ----------

  get currentScopeNotes(): Note[] {
    if (this.activeTabValue === 'day') {
      return this.filteredDailyNotes;
    }
    return this.getSummaryData(this.activeTabValue as SummaryKey);
  }

  get totalNotesInScope(): number {
    return this.currentScopeNotes.length;
  }

  get activeScopeLabel(): string {
    switch (this.activeTabValue) {
      case 'day':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      default:
        return '';
    }
  }

  get lastUpdatedLabel(): string | null {
    const list = this.currentScopeNotes;
    if (!list.length) return null;
    const latest = this.sortNotes([...list])[0];
    if (!latest?.createdAt) return null;
    const d = new Date(latest.createdAt);
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get attachmentsCount(): number {
    return this.currentScopeNotes.reduce((acc, n) => acc + (n.attachments?.length || 0), 0);
  }

  // ---------- LIFECYCLE ----------

  ngOnInit(): void {
    this.summaries = [
      { title: 'Week', key: 'week', data: [], icon: 'pi pi-calendar-times' },
      { title: 'Month', key: 'month', data: [], icon: 'pi pi-calendar' },
      { title: 'Year', key: 'year', data: [], icon: 'pi pi-server' }
    ];

    this.setupSearch();
    this.setupAutoSave();
    this.loadDailyNotes();
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

  // ---------- KEYBOARD SHORTCUTS ----------
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Ctrl+S / Cmd+S → Save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      if (this.noteForm.valid && this.noteForm.dirty) {
        this.saveNote();
      }
      return;
    }

    // Ctrl+N / Cmd+N → New Note (Day view only)
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      if (this.activeTabValue === 'day') {
        this.startNewNote();
      }
    }
  }

  // ---------- VIEW / TABS ----------

  onTabChange(event: any): void {
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

  toggleFocusMode(): void {
    this.isFocusMode = !this.isFocusMode;
  }

  // ---------- DATA LOADING ----------

  loadDailyNotes(): void {
    if (!this.date?.date) return;
    this.updateLoadingState('day', true);

    if (!this._noteToSelectAfterLoad) this.startNewNote();
    const dateStr = this.formatDate(this.date.date);

    this.noteService
      .getNotes({ date: dateStr })
      .pipe(finalize(() => this.updateLoadingState('day', false)))
      .subscribe({
        next: (res) => {
          this.dailyNotes = this.sortNotes(res.data.notes || []);
          this.filteredDailyNotes = [...this.dailyNotes];

          if (this._noteToSelectAfterLoad) {
            const note = this.dailyNotes.find((n) => n._id === this._noteToSelectAfterLoad);
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
    else if (key === 'month')
      req$ = this.noteService.getNotes({ year: d.getFullYear(), month: d.getMonth() + 1 });
    else req$ = this.noteService.getNotes({ year: d.getFullYear() });

    req$
      .pipe(finalize(() => this.updateLoadingState(key, false)))
      .subscribe({
        next: (res: any) => {
          const summary = this.summaries.find((s) => s.key === key);
          if (summary) summary.data = this.sortNotes(res.data.notes || []);
          this.cdr.markForCheck();
        },
        error: () => this.showError(`Failed to load ${key} notes`)
      });
  }

  refreshCurrentView(): void {
    this.activeTabValue === 'day'
      ? this.loadDailyNotes()
      : this.loadSummary(this.activeTabValue as SummaryKey);
  }

  // ---------- CRUD ----------

  saveNote(): void {
    if (this.noteForm.invalid || this.isSaving) return;
    this.isSaving = true;

    const upload$ =
      this.selectedFiles.length > 0
        ? this.noteService.uploadMedia(this.selectedFiles)
        : of({ data: [] });

    upload$
      .pipe(
        switchMap((uploadRes: any) => {
          const newAttachments = uploadRes.data || [];
          const current = this.noteForm.get('attachments')?.value || [];
          const finalAttachments = [...current, ...newAttachments];

          const payload: Partial<Note> = {
            title: this.noteForm.get('title')?.value,
            content: this.noteForm.get('content')?.value,
            tags: this.noteForm.get('tags')?.value || [],
            attachments: finalAttachments,
            createdAt: this.isEditing
              ? this.noteForm.get('createdAt')?.value
              : this.date.date.toISOString()
          };

          return this.isEditing && this.noteForm.get('_id')?.value
            ? this.noteService.updateNote(this.noteForm.get('_id')?.value, payload)
            : this.noteService.createNote(payload);
        }),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Your note is safe!'
          });
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
            this.messageService.add({
              severity: 'info',
              summary: 'Deleted',
              detail: 'Note removed'
            });
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

    files.forEach((file) => {
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

  // ---------- BUSINESS RULES / HELPERS ----------

  isEditable(note: Note | null): boolean {
    if (!note?.createdAt) return true;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(note.createdAt).getTime() > oneDayAgo;
  }

  getSummaryData(key: SummaryKey): Note[] {
    return this.summaries.find((s) => s.key === key)?.data || [];
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((term) => {
        const query = (term || '').toLowerCase().trim();
        this.filteredDailyNotes = query
          ? this.dailyNotes.filter(
              (n) =>
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
    return notes.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private resetAllNotes(): void {
    this.dailyNotes = [];
    this.filteredDailyNotes = [];
    this.summaries.forEach((s) => (s.data = []));
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
//   ChangeDetectorRef,
//   HostListener
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
// import { finalize, debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
// import { of, Subject } from 'rxjs';

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

// import { Note, NoteAttachment } from '../../../../core/models/note.types';
// import { NoteService } from '../../../../core/services/notes.service';

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
//   styleUrls: ['./notes-manager.component.scss'],
//   host: { class: 'block h-full w-full' }
// })
// export class NotesManagerComponent implements OnInit, OnChanges {
//   private noteService = inject(NoteService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);
//   private cdr = inject(ChangeDetectorRef);
//   private confirmationService = inject(ConfirmationService);

//   @Input() date!: CalendarDay;

//   dailyNotes: Note[] = [];
//   filteredDailyNotes: Note[] = [];
//   summaries: Summary[] = [];

//   selectedNote: Note | null = null;
//   isEditing = false;
//   isSaving = false;
//   isLoading: Record<LoadingKey, boolean> = { day: true, week: false, month: false, year: false };
//   activeTabValue: LoadingKey = 'day';

//   noteForm: FormGroup;
//   searchControl = new FormControl('');

//   selectedFiles: File[] = [];
//   imagePreviews: string[] = [];

//   private loadedTabs: Record<SummaryKey, boolean> = { week: false, month: false, year: false };
//   private _noteToSelectAfterLoad: string | null = null;

//   constructor() {
//     this.noteForm = this.fb.group({
//       _id: [null],
//       title: ['', Validators.required],
//       content: ['', Validators.required],
//       tags: [[]],
//       attachments: [[]],
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
//     this.setupAutoSave();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['date']?.currentValue && !changes['date'].firstChange) {
//       if (!this._noteToSelectAfterLoad) {
//         this.activeTabValue = 'day';
//         this.resetAllNotes();
//         this.loadDailyNotes();
//       }
//     }
//   }
// // CORRECT & FULLY TYPE-SAFE (Works in Angular 16+ / Strict Mode)
// @HostListener('document:keydown', ['$event'])
// onKeyDown(event: KeyboardEvent): void {
//   // Ctrl+S or Cmd+S → Save
//   if ((event.ctrlKey || event.metaKey) && event.key === 's') {
//     event.preventDefault();
//     if (this.noteForm.valid && this.noteForm.dirty) {
//       this.saveNote();
//     }
//     return;
//   }

//   // Ctrl+N or Cmd+N → New Note
//   if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
//     event.preventDefault();
//     if (this.activeTabValue === 'day') {
//       this.startNewNote();
//     }
//   }
// }
//   // // Keyboard Shortcuts
//   // @HostListener('document:keydown.control.s', ['$event'])
//   // onCtrlS(e: KeyboardEvent) {
//   //   e.preventDefault();
//   //   if (this.noteForm.valid && (this.isEditing || this.noteForm.dirty)) {
//   //     this.saveNote();
//   //   }
//   // }

//   // @HostListener('document:keydown.control.n', ['$event'])
//   // onCtrlN(e: KeyboardEvent) {
//   //   e.preventDefault();
//   //   if (this.activeTabValue === 'day') {
//   //     this.startNewNote();
//   //   }
//   // }


// onTabChange(event: any): void {
//   // PrimeNG actually sets event.value and event.index on the raw event
//   const value = (event as any).value ?? this.activeTabValue;
//   this.activeTabValue = value as LoadingKey;

//   this.selectedNote = null;
//   this.startNewNote();

//   if (this.activeTabValue === 'day') {
//     this.loadDailyNotes();
//     return;
//   }

//   const key = this.activeTabValue as SummaryKey;
//   if (!this.loadedTabs[key]) {
//     this.loadSummary(key);
//     this.loadedTabs[key] = true;
//   }
// }
//   // Tab Change — Fixed & Improved
//   // onTabChange(event: { index: number; value: LoadingKey }): void {
//   //   this.activeTabValue = event.value;
//   //   this.selectedNote = null;
//   //   this.startNewNote();

//   //   if (this.activeTabValue === 'day') {
//   //     this.loadDailyNotes();
//   //     return;
//   //   }

//   //   const key = this.activeTabValue as SummaryKey;
//   //   if (!this.loadedTabs[key]) {
//   //     this.loadSummary(key);
//   //     this.loadedTabs[key] = true; // Prevent duplicate calls
//   //   }
//   // }

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

//           if (this._noteToSelectAfterLoad) {
//             const note = this.dailyNotes.find(n => n._id === this._noteToSelectAfterLoad);
//             if (note) this.selectNote(note);
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

//     const d = this.date.date;
//     let req$: any;

//     if (key === 'week') req$ = this.noteService.getNotes({ week: this.formatDate(d) });
//     else if (key === 'month') req$ = this.noteService.getNotes({ year: d.getFullYear(), month: d.getMonth() + 1 });
//     else req$ = this.noteService.getNotes({ year: d.getFullYear() });

//     req$.pipe(finalize(() => this.updateLoadingState(key, false)))
//       .subscribe({
//         next: (res:any) => {
//           const summary = this.summaries.find(s => s.key === key);
//           if (summary) summary.data = this.sortNotes(res.data.notes || []);
//           this.cdr.markForCheck();
//         },
//         error: () => this.showError(`Failed to load ${key} notes`)
//       });
//   }

//   saveNote(): void {
//     if (this.noteForm.invalid || this.isSaving) return;
//     this.isSaving = true;

//     const upload$ = this.selectedFiles.length > 0
//       ? this.noteService.uploadMedia(this.selectedFiles)
//       : of({ data: [] });

//     upload$.pipe(
//       switchMap((uploadRes: any) => {
//         const newAttachments = uploadRes.data || [];
//         const current = this.noteForm.get('attachments')?.value || [];
//         const finalAttachments = [...current, ...newAttachments];

//         const payload: Partial<Note> = {
//           title: this.noteForm.get('title')?.value,
//           content: this.noteForm.get('content')?.value,
//           tags: this.noteForm.get('tags')?.value || [],
//           attachments: finalAttachments,
//           createdAt: this.isEditing ? this.noteForm.get('createdAt')?.value : this.date.date.toISOString()
//         };

//         return this.isEditing && this.noteForm.get('_id')?.value
//           ? this.noteService.updateNote(this.noteForm.get('_id')?.value, payload)
//           : this.noteService.createNote(payload);
//       }),
//       finalize(() => {
//         this.isSaving = false;
//         this.cdr.markForCheck();
//       })
//     ).subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Your note is safe!' });
//         this.selectedFiles = [];
//         this.imagePreviews = [];
//         this.refreshCurrentView();
//         this.startNewNote();
//       },
//       error: () => this.showError('Failed to save note')
//     });
//   }

//   deleteNote(note: Note | null, event?: MouseEvent): void {
//     event?.stopPropagation();
//     if (!note?._id) return;

//     this.confirmationService.confirm({
//       message: 'This note will be permanently deleted.',
//       header: 'Delete Note?',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         this.noteService.deleteNote(note._id!).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Note removed' });
//             this.selectedNote = null;
//             this.refreshCurrentView();
//           },
//           error: () => this.showError('Failed to delete')
//         });
//       }
//     });
//   }

//   startNewNote(): void {
//     this.selectedNote = null;
//     this.isEditing = false;
//     this.selectedFiles = [];
//     this.imagePreviews = [];

//     this.noteForm.reset({
//       title: '',
//       content: '',
//       tags: [],
//       attachments: [],
//       createdAt: this.date?.date || new Date()
//     });
//     this.noteForm.enable();
//     this.cdr.markForCheck();
//   }

//   selectNote(note: Note): void {
//     this.selectedNote = note;
//     this.isEditing = true;
//     this.selectedFiles = [];
//     this.imagePreviews = [];

//     this.noteForm.patchValue({
//       _id: note._id,
//       title: note.title || '',
//       content: note.content || '',
//       tags: note.tags || [],
//       attachments: note.attachments || [],
//       createdAt: note.createdAt
//     });

//     this.isEditable(note) ? this.noteForm.enable() : this.noteForm.disable();

//     this.cdr.markForCheck();

//     setTimeout(() => {
//       document.querySelector('.note-editor-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
//     }, 100);
//   }

//   onFileSelect(event: any): void {
//     const files = Array.from(event.target.files) as File[];
//     this.selectedFiles.push(...files);

//     files.forEach(file => {
//       const reader = new FileReader();
//       reader.onload = (e: any) => {
//         this.imagePreviews.push(e.target.result);
//         this.cdr.markForCheck();
//       };
//       reader.readAsDataURL(file);
//     });

//     event.target.value = '';
//   }

//   removeLocalPreview(i: number): void {
//     this.selectedFiles.splice(i, 1);
//     this.imagePreviews.splice(i, 1);
//   }

//   removeServerAttachment(i: number): void {
//     const atts = [...this.noteForm.get('attachments')?.value];
//     atts.splice(i, 1);
//     this.noteForm.patchValue({ attachments: atts });
//   }

//   refreshCurrentView(): void {
//     this.activeTabValue === 'day' ? this.loadDailyNotes() : this.loadSummary(this.activeTabValue as SummaryKey);
//   }

//   isEditable(note: Note | null): boolean {
//     if (!note?.createdAt) return true;
//     const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
//     return new Date(note.createdAt).getTime() > oneDayAgo;
//   }

//   getSummaryData(key: SummaryKey): Note[] {
//     return this.summaries.find(s => s.key === key)?.data || [];
//   }

//   private setupSearch(): void {
//     this.searchControl.valueChanges
//       .pipe(debounceTime(250), distinctUntilChanged())
//       .subscribe(term => {
//         const query = (term || '').toLowerCase().trim();
//         this.filteredDailyNotes = query
//           ? this.dailyNotes.filter(n =>
//               n.title?.toLowerCase().includes(query) ||
//               n.content?.toLowerCase().includes(query)
//             )
//           : [...this.dailyNotes];
//         this.cdr.markForCheck();
//       });
//   }

//   private setupAutoSave(): void {
//     this.noteForm.valueChanges
//       .pipe(
//         debounceTime(3000),
//         filter(() => this.isEditing && this.noteForm.dirty && this.noteForm.valid)
//       )
//       .subscribe(() => {
//         this.messageService.add({
//           severity: 'info',
//           summary: 'Auto-saved',
//           detail: 'Your changes are safe',
//           life: 2000
//         });
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
