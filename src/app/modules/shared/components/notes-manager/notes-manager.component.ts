import { Component, OnInit, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ImageModule } from 'primeng/image';
import { ChipModule } from 'primeng/chip';
import { SelectButtonModule } from 'primeng/selectbutton';

import { NoteService } from '../../../../core/services/notes.service';
import { Note, NoteAttachment } from '../../../../core/models/note.types';

interface CalendarDay {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  noteCount: number;
}

@Component({
  selector: 'app-notes-manager',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DialogModule, ButtonModule,
    InputTextModule, TextareaModule, AutoCompleteModule, ToastModule,
    TooltipModule, ImageModule, ChipModule, SelectButtonModule
  ],
  providers: [MessageService],
  templateUrl: './notes-manager.component.html',
  styleUrls: ['./notes-manager.component.scss']
})
export class NotesManagerComponent implements OnInit {
  private noteService = inject(NoteService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  @ViewChild('fileInput') fileInput!: ElementRef;

  // --- State Signals ---
  currentDate = signal(new Date());
  selectedDate = signal(new Date());
  activeView = signal<'calendar' | 'archive'>('calendar');
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = signal('');
  filterTag = signal<string>('all');

  calendarDays = signal<CalendarDay[]>([]);
  dailyNotes = signal<Note[]>([]);
  allNotes = signal<Note[]>([]);

  // --- Editor State ---
  isEditorVisible = false;
  isPreviewMode = false;
  isSaving = false;
  noteForm: FormGroup;
  selectedNote: Note | null = null;
  selectedFiles: File[] = [];
  imagePreviews: { url: string, file?: File }[] = [];

  // --- Computed State ---
  currentMonthName = computed(() =>
    this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' })
  );

  allTags = computed(() => {
    const tags = new Set<string>();
    this.allNotes().forEach(note => note.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  });

  filteredNotes = computed(() => {
    let notes = this.allNotes();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      notes = notes.filter(n => n.title?.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
    }
    if (this.filterTag() !== 'all') {
      notes = notes.filter(n => n.tags?.includes(this.filterTag()));
    }
    return notes;
  });

  notesGroupedByMonth = computed(() => {
    const grouped = new Map<string, Note[]>();
    this.filteredNotes().forEach(note => {
      const date = new Date(note.noteDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped.has(monthKey)) grouped.set(monthKey, []);
      grouped.get(monthKey)!.push(note);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, notes]) => ({
        monthKey: key,
        monthName: new Date(key + '-02').toLocaleString('default', { month: 'long', year: 'numeric' }),
        notes: notes.sort((a, b) => new Date(b.noteDate).getTime() - new Date(a.noteDate).getTime())
      }));
  });

  constructor() {
    this.noteForm = this.fb.group({
      _id: [null],
      title: ['', Validators.required],
      content: ['', Validators.required],
      tags: [[]],
      attachments: [[]],
      noteDate: [null, Validators.required],
      visibility: ['public'],
      importance: ['normal'],
      isPinned: [false]
    });

    // Rebuild calendar whenever the view month changes
    effect(() => {
      this.buildCalendar(this.currentDate());
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.refreshAll();
  }

  // --- DATA FLOW ---
  refreshAll() {
    this.loadNotesForDate(this.selectedDate());
    this.loadAllNotes();
    this.buildCalendar(this.currentDate());
  }

  loadNotesForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    this.noteService.getNotes({ date: dateStr }).subscribe({
      next: (res) => this.dailyNotes.set(res.data.notes || []),
      error: () => this.showError('Failed to load notes for this day')
    });
  }

  loadAllNotes() {
    this.noteService.getNotes({}).subscribe({
      next: (res) => this.allNotes.set(res.data.notes || []),
      error: () => this.showError('Failed to load archive')
    });
  }

  // --- CALENDAR LOGIC ---
  buildCalendar(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    this.noteService.getDailyNoteCounts(year, month).subscribe(res => {
      const stats = res.data || [];
      const firstDay = new Date(year, month - 1, 1).getDay();
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

      const grid: CalendarDay[] = [];

      // Prev month padding
      for (let i = 0; i < firstDay; i++) {
        const d = daysInPrevMonth - firstDay + 1 + i;
        grid.push(this.createDayObj(new Date(year, month - 2, d), false, 0));
      }
      // Current month
      for (let i = 1; i <= daysInMonth; i++) {
        const count = stats.find(s => s.day === i)?.count || 0;
        grid.push(this.createDayObj(new Date(year, month - 1, i), true, count));
      }
      // Next month padding
      const remaining = 42 - grid.length;
      for (let i = 1; i <= remaining; i++) {
        grid.push(this.createDayObj(new Date(year, month, i), false, 0));
      }
      this.calendarDays.set(grid);
    });
  }

  createDayObj(date: Date, isCurrentMonth: boolean, count: number): CalendarDay {
    return {
      date,
      dayNum: date.getDate(),
      isCurrentMonth,
      isToday: this.isSameDate(date, new Date()),
      isSelected: this.isSameDate(date, this.selectedDate()),
      noteCount: count
    };
  }

  // --- UI ACTIONS ---
  selectDay(day: CalendarDay) {
    this.selectedDate.set(day.date);
    this.loadNotesForDate(day.date);
  }

  changeMonth(delta: number) {
    const next = new Date(this.currentDate());
    next.setMonth(next.getMonth() + delta);
    this.currentDate.set(next);
  }

  jumpToToday() {
    const today = new Date();
    this.currentDate.set(today);
    this.selectedDate.set(today);
    this.loadNotesForDate(today);
  }

  // --- EDITOR LOGIC ---
  openNewNote() {
    this.selectedNote = null;
    this.isPreviewMode = false;
    this.resetEditor();
    this.noteForm.patchValue({ noteDate: this.selectedDate().toISOString().split('T')[0] });
    this.isEditorVisible = true;
  }

  viewNote(note: Note) {
    this.selectedNote = note;
    this.isPreviewMode = true;
    this.noteForm.patchValue({
      ...note,
      noteDate: new Date(note.noteDate).toISOString().split('T')[0]
    });
    this.imagePreviews = note.attachments.map(a => ({ url: a.url }));
    this.isEditorVisible = true;
  }

  editNote(note: Note) {
    this.viewNote(note);
    this.isPreviewMode = false;
  }

  saveNote() {
    if (this.noteForm.invalid || this.isSaving) return;
    this.isSaving = true;

    const upload$ = this.selectedFiles.length > 0 
      ? this.noteService.uploadMedia(this.selectedFiles) 
      : of({ data: [] });

    upload$.pipe(
      switchMap(res => {
        const finalAttachments = [...(this.noteForm.value.attachments || []), ...res.data];
        const payload = { ...this.noteForm.value, attachments: finalAttachments };

        return this.selectedNote?._id 
          ? this.noteService.updateNote(this.selectedNote._id, payload)
          : this.noteService.createNote(payload);
      }),
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.isEditorVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Note saved' });
        this.refreshAll();
      },
      error: () => this.showError('Failed to save note')
    });
  }

  deleteNote(note: Note) {
    if (!note._id || !confirm('Are you sure you want to delete this note?')) return;
    this.noteService.deleteNote(note._id).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Deleted' });
      this.refreshAll();
    });
  }

  // --- MEDIA HANDLING ---
  triggerFileUpload() {
    if (!this.isPreviewMode) this.fileInput.nativeElement.click();
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push({ url: e.target.result, file });
        this.selectedFiles.push(file);
      };
      reader.readAsDataURL(file);
    });
  }

  removeAttachment(index: number) {
    const item = this.imagePreviews[index];
    if (item.file) {
      this.selectedFiles = this.selectedFiles.filter(f => f !== item.file);
    } else {
      const current = this.noteForm.get('attachments')?.value || [];
      this.noteForm.patchValue({ attachments: current.filter((_: any, i: number) => i !== index) });
    }
    this.imagePreviews.splice(index, 1);
  }

  // --- HELPERS ---
  private resetEditor() {
    this.noteForm.reset({ importance: 'normal', visibility: 'public', tags: [], attachments: [] });
    this.imagePreviews = [];
    this.selectedFiles = [];
  }

  private showError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  isSameDate = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  getIndicators = (count: number) => new Array(Math.min(count, 3)).fill(0);
  switchView(v: 'calendar' | 'archive') { this.activeView.set(v); }
  toggleViewMode() { this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid'); }
  toggleEditMode() { this.isPreviewMode = !this.isPreviewMode; }
}


// import { Component, OnInit, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG & Icons
// import { DialogModule } from 'primeng/dialog';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { MessageService } from 'primeng/api';
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { ImageModule } from 'primeng/image';
// import { ChipModule } from 'primeng/chip';
// import { SelectButtonModule } from 'primeng/selectbutton'; // Added for importance/visibility

// import { NoteService } from '../../../../core/services/notes.service';
// import { Note, NoteAttachment } from '../../../../core/models/note.types';

// interface CalendarDay {
//   date: Date;
//   dayNum: number;
//   isCurrentMonth: boolean;
//   isToday: boolean;
//   isSelected: boolean;
//   noteCount: number;
// }

// @Component({
//   selector: 'app-notes-manager',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, DialogModule, ButtonModule,
//     InputTextModule, TextareaModule, AutoCompleteModule, ToastModule,
//     TooltipModule, ImageModule, ChipModule, SelectButtonModule
//   ],
//   providers: [MessageService],
//   templateUrl: './notes-manager.component.html',
//   styleUrls: ['./notes-manager.component.scss']
// })
// export class NotesManagerComponent implements OnInit {
//   private noteService = inject(NoteService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);

//   @ViewChild('fileInput') fileInput!: ElementRef;

//   // --- State Signals ---
//   currentDate = signal(new Date());
//   selectedDate = signal(new Date());
//   activeView = signal<'calendar' | 'archive'>('calendar');
//   viewMode = signal<'grid' | 'list'>('grid');
//   searchQuery = signal('');
//   filterTag = signal<string>('all');

//   calendarDays = signal<CalendarDay[]>([]);
//   dailyNotes = signal<Note[]>([]);
//   allNotes = signal<Note[]>([]);

//   // --- Editor State ---
//   isEditorVisible = false;
//   isPreviewMode = false;
//   isSaving = false;
//   noteForm: FormGroup;
//   selectedNote: Note | null = null;

//   // Media Handling
//   selectedFiles: File[] = [];
//   imagePreviews: { url: string, file?: File }[] = [];

//   // --- Computed ---
//   currentMonthName = computed(() =>
//     this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' })
//   );

//   allTags = computed(() => {
//     const tags = new Set<string>();
//     this.allNotes().forEach(note => {
//       note.tags?.forEach(tag => tags.add(tag));
//     });
//     return Array.from(tags);
//   });

//   filteredNotes = computed(() => {
//     let notes = this.allNotes();
//     const query = this.searchQuery().toLowerCase();
//     const tag = this.filterTag();

//     if (query) {
//       notes = notes.filter(n =>
//         n.title?.toLowerCase().includes(query) ||
//         n.content?.toLowerCase().includes(query)
//       );
//     }

//     if (tag !== 'all') {
//       notes = notes.filter(n => n.tags?.includes(tag));
//     }

//     return notes;
//   });

//   notesGroupedByMonth = computed(() => {
//     const grouped = new Map<string, Note[]>();

//     this.filteredNotes().forEach(note => {
//       // Use noteDate instead of createdAt for sorting/grouping
//       const date = new Date(note.noteDate);
//       const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

//       if (!grouped.has(monthKey)) {
//         grouped.set(monthKey, []);
//       }
//       grouped.get(monthKey)!.push(note);
//     });

//     return Array.from(grouped.entries())
//       .sort((a, b) => b[0].localeCompare(a[0]))
//       .map(([key, notes]) => ({
//         monthKey: key,
//         monthName: new Date(key + '-02').toLocaleString('default', { month: 'long', year: 'numeric' }),
//         notes: notes.sort((a, b) => new Date(b.noteDate).getTime() - new Date(a.noteDate).getTime())
//       }));
//   });

//   constructor() {
//     this.noteForm = this.fb.group({
//       _id: [null],
//       title: ['', Validators.required],
//       content: ['', Validators.required],
//       tags: [[]],
//       attachments: [[]],
//       noteDate: [null, Validators.required],
//       visibility: ['private'],
//       importance: ['normal'],
//       isPinned: [false]
//     });

//     effect(() => {
//       this.buildCalendar(this.currentDate());
//     });
//   }

//   ngOnInit() {
//     this.loadNotesForDate(this.selectedDate());
//     this.loadAllNotes();
//   }

//   // --- CALENDAR LOGIC ---
//   buildCalendar(date: Date) {
//     const year = date.getFullYear();
//     const month = date.getMonth() + 1;

//     this.noteService.getDailyNoteCounts(year, month).subscribe(res => {
//       const stats = res.data || [];
//       const firstDay = new Date(year, month - 1, 1).getDay();
//       const daysInMonth = new Date(year, month, 0).getDate();
//       const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

//       const grid: CalendarDay[] = [];

//       // Prev Month
//       for (let i = 0; i < firstDay; i++) {
//         const d = daysInPrevMonth - firstDay + 1 + i;
//         grid.push(this.createDayObj(new Date(year, month - 2, d), false, 0));
//       }
//       // Current Month
//       for (let i = 1; i <= daysInMonth; i++) {
//         const dayStat = stats.find(s => s.day === i);
//         grid.push(this.createDayObj(new Date(year, month - 1, i), true, dayStat?.count || 0));
//       }
//       // Next Month
//       const remaining = 42 - grid.length;
//       for (let i = 1; i <= remaining; i++) {
//         grid.push(this.createDayObj(new Date(year, month, i), false, 0));
//       }
//       this.calendarDays.set(grid);
//     });
//   }

//   createDayObj(date: Date, isCurrentMonth: boolean, count: number): CalendarDay {
//     return {
//       date,
//       dayNum: date.getDate(),
//       isCurrentMonth,
//       isToday: this.isSameDate(date, new Date()),
//       isSelected: this.isSameDate(date, this.selectedDate()),
//       noteCount: count
//     };
//   }

//   selectDay(day: CalendarDay) {
//     this.selectedDate.set(day.date);
//     this.loadNotesForDate(day.date);
//   }

//   // --- DATA LOADING ---
//   loadNotesForDate(date: Date) {
//     const dateStr = date.toISOString().split('T')[0];
//     this.noteService.getNotes({ date: dateStr }).subscribe({
//       next: (res) => this.dailyNotes.set(res.data.notes || []),
//       error: () => this.showError('Could not load daily notes')
//     });
//   }

//   loadAllNotes() {
//     this.noteService.getNotes({}).subscribe({
//       next: (res) => this.allNotes.set(res.data.notes || []),
//       error: () => this.showError('Could not load archive')
//     });
//   }

//   // --- EDITOR LOGIC ---
//   openNewNote() {
//     this.selectedNote = null;
//     this.isPreviewMode = false;
//     this.resetEditor();
//     // Set noteDate to the currently selected calendar day
//     this.noteForm.patchValue({ noteDate: this.selectedDate().toISOString().split('T')[0] });
//     this.isEditorVisible = true;
//   }

//   editNote(note: Note) {
//     this.selectedNote = note;
//     this.isPreviewMode = false;
//     this.resetEditor();
//     this.noteForm.patchValue({
//         ...note,
//         noteDate: new Date(note.noteDate).toISOString().split('T')[0]
//     });
//     this.imagePreviews = note.attachments.map(att => ({ url: att.url }));
//     this.isEditorVisible = true;
//   }

//   saveNote() {
//     if (this.noteForm.invalid || this.isPreviewMode) return;
//     this.isSaving = true;

//     const upload$ = this.selectedFiles.length > 0
//       ? this.noteService.uploadMedia(this.selectedFiles)
//       : of({ data: [] });

//     upload$.pipe(
//       switchMap((res: any) => {
//         const newAtts = res.data || [];
//         const existingAtts = this.noteForm.get('attachments')?.value || [];
//         const payload = { 
//             ...this.noteForm.value, 
//             attachments: [...existingAtts, ...newAtts] 
//         };

//         return this.selectedNote?._id
//           ? this.noteService.updateNote(this.selectedNote._id, payload)
//           : this.noteService.createNote(payload);
//       }),
//       finalize(() => this.isSaving = false)
//     ).subscribe({
//       next: () => {
//         this.isEditorVisible = false;
//         this.refreshAll();
//         this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Note updated successfully' });
//       },
//       error: () => this.showError('Save failed')
//     });
//   }

//   deleteNote(note: Note) {
//     if (!note._id || !confirm('Delete this note permanentely?')) return;
//     this.noteService.deleteNote(note._id).subscribe({
//       next: () => {
//         this.refreshAll();
//         this.messageService.add({ severity: 'success', summary: 'Deleted' });
//       }
//     });
//   }

//   // --- HELPERS ---
//   private refreshAll() {
//     this.loadNotesForDate(this.selectedDate());
//     this.loadAllNotes();
//     this.buildCalendar(this.currentDate());
//   }

//   private resetEditor() {
//     this.noteForm.reset({ visibility: 'private', importance: 'normal', tags: [], attachments: [] });
//     this.selectedFiles = [];
//     this.imagePreviews = [];
//   }

//   private showError(msg: string) {
//     this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
//   }

//   isSameDate = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
//   getIndicators = (count: number) => new Array(Math.min(count, 3)).fill(0);
//   changeMonth = (delta: number) => {
//     const d = new Date(this.currentDate());
//     d.setMonth(d.getMonth() + delta);
//     this.currentDate.set(d);
//   };


//   viewNote(note: Note) {
//     this.selectedNote = note;
//     this.isPreviewMode = true;
//     this.resetEditor();
    
//     // Patch values including the new noteDate field
//     this.noteForm.patchValue({
//       ...note,
//       noteDate: new Date(note.noteDate).toISOString().split('T')[0]
//     });

//     if (note.attachments) {
//       this.imagePreviews = note.attachments.map(att => ({ url: att.url }));
//     }
//     this.isEditorVisible = true;
//   }

//   toggleEditMode() {
//     this.isPreviewMode = !this.isPreviewMode;
//   }

//   toggleViewMode() {
//     this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
//   }

//   switchView(view: 'calendar' | 'archive') {
//     this.activeView.set(view);
//   }

//   jumpToToday() {
//     const today = new Date();
//     this.currentDate.set(today);
//     this.selectedDate.set(today);
//     this.loadNotesForDate(today);
//   }triggerFileUpload() {
//     if (!this.isPreviewMode) {
//       this.fileInput.nativeElement.click();
//     }
//   }

//   onFileSelect(event: any) {
//     const files = Array.from(event.target.files) as File[];
//     if (!files.length) return;

//     this.selectedFiles.push(...files);

//     files.forEach(file => {
//       const reader = new FileReader();
//       reader.onload = (e: any) => {
//         this.imagePreviews.push({ url: e.target.result, file: file });
//       };
//       reader.readAsDataURL(file);
//     });
//   }

//   removeAttachment(index: number) {
//     if (this.isPreviewMode) return;

//     const item = this.imagePreviews[index];

//     if (item.file) {
//       // Remove from the files waiting to be uploaded
//       this.selectedFiles = this.selectedFiles.filter(f => f !== item.file);
//     } else {
//       // Remove from existing attachments in the form
//       const currentAtts = this.noteForm.get('attachments')?.value as NoteAttachment[];
//       const updatedAtts = currentAtts.filter((_, i) => i !== index);
//       this.noteForm.patchValue({ attachments: updatedAtts });
//     }

//     this.imagePreviews.splice(index, 1);
//   }

// }