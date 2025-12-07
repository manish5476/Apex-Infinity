import { Component, OnInit, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG & Icons
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
    TooltipModule, ImageModule,  ChipModule
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

  // --- State ---
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
  
  // Media Handling
  selectedFiles: File[] = [];
  imagePreviews: { url: string, file?: File }[] = [];

  // --- Computed ---
  currentMonthName = computed(() => 
    this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' })
  );

  allTags = computed(() => {
    const tags = new Set<string>();
    this.allNotes().forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  });

  filteredNotes = computed(() => {
    let notes = this.allNotes();
    
    // Filter by search
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      notes = notes.filter(n => 
        n.title?.toLowerCase().includes(query) || 
        n.content?.toLowerCase().includes(query)
      );
    }
    
    // Filter by tag
    if (this.filterTag() !== 'all') {
      notes = notes.filter(n => n.tags?.includes(this.filterTag()));
    }
    
    return notes;
  });

  notesGroupedByMonth = computed(() => {
    const grouped = new Map<string, Note[]>();
    
    this.filteredNotes().forEach(note => {
      const date = new Date(note.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(note);
    });
    
    // Sort by date descending
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, notes]) => ({
        monthKey: key,
        monthName: new Date(key).toLocaleString('default', { month: 'long', year: 'numeric' }),
        notes: notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }));
  });

  constructor() {
    this.noteForm = this.fb.group({
      _id: [null],
      title: ['', Validators.required],
      content: ['', Validators.required],
      tags: [[]],
      attachments: [[]],
      createdAt: [null]
    });

    effect(() => {
      this.buildCalendar(this.currentDate());
    });
  }

  ngOnInit() {
    this.loadNotesForDate(this.selectedDate());
    this.loadAllNotes();
  }

  getIndicators(count: number): number[] {
  // Returns an array of length N (max 3), e.g., [0, 1, 2]
  // .fill(0) ensures the array isn't "empty/sparse" so it iterates correctly
  return new Array(Math.min(count, 3)).fill(0);
}

  // =================================================================
  // CALENDAR LOGIC
  // =================================================================

  buildCalendar(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth(); 
    
    this.noteService.getDailyNoteCounts(year, month + 1).subscribe(res => {
      const stats = res.data || [];
      
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();

      const grid: CalendarDay[] = [];

      // Previous month padding
      for (let i = 0; i < firstDay; i++) {
        const d = daysInPrevMonth - firstDay + 1 + i;
        grid.push(this.createDayObj(new Date(year, month - 1, d), false, 0));
      }

      // Current month
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStat = stats.find(s => s.day === i);
        const count = dayStat ? dayStat.count : 0;
        grid.push(this.createDayObj(new Date(year, month, i), true, count));
      }

      // Next month padding
      const remaining = 42 - grid.length;
      for (let i = 1; i <= remaining; i++) {
        grid.push(this.createDayObj(new Date(year, month + 1, i), false, 0));
      }

      this.calendarDays.set(grid);
    });
  }

  createDayObj(date: Date, isCurrentMonth: boolean, count: number): CalendarDay {
    return {
      date: date,
      dayNum: date.getDate(),
      isCurrentMonth,
      isToday: this.isSameDate(date, new Date()),
      isSelected: this.isSameDate(date, this.selectedDate()),
      noteCount: count
    };
  }

  changeMonth(delta: number) {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    this.currentDate.set(newDate);
  }

  jumpToToday() {
    const today = new Date();
    this.currentDate.set(today);
    this.selectDay({ date: today } as CalendarDay);
  }

  selectDay(day: CalendarDay) {
    this.selectedDate.set(day.date);
    
    const updatedGrid = this.calendarDays().map(d => ({
      ...d,
      isSelected: this.isSameDate(d.date, day.date)
    }));
    this.calendarDays.set(updatedGrid);
    
    this.loadNotesForDate(day.date);
  }

  // =================================================================
  // DATA LOADING
  // =================================================================

  loadNotesForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    this.noteService.getNotes({ date: dateStr }).subscribe({
      next: (res) => this.dailyNotes.set(res.data.notes || []),
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Could not load notes'})
    });
  }

  loadAllNotes() {
    this.noteService.getNotes({}).subscribe({
      next: (res) => this.allNotes.set(res.data.notes || []),
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Could not load notes'})
    });
  }

  // =================================================================
  // EDITOR LOGIC
  // =================================================================

  openNewNote() {
    this.selectedNote = null;
    this.isPreviewMode = false;
    this.resetEditor();
    this.noteForm.patchValue({ createdAt: this.selectedDate() });
    this.isEditorVisible = true;
  }

  editNote(note: Note) {
    this.selectedNote = note;
    this.isPreviewMode = false;
    this.resetEditor();
    this.noteForm.patchValue(note);
    
    if (note.attachments) {
      this.imagePreviews = note.attachments.map(att => ({ url: att.url }));
    }
    
    this.isEditorVisible = true;
  }

  viewNote(note: Note) {
    this.selectedNote = note;
    this.isPreviewMode = true;
    this.resetEditor();
    this.noteForm.patchValue(note);
    
    if (note.attachments) {
      this.imagePreviews = note.attachments.map(att => ({ url: att.url }));
    }
    
    this.isEditorVisible = true;
  }

  resetEditor() {
    this.noteForm.reset({ title: '', content: '', tags: [], attachments: [], createdAt: null });
    this.selectedFiles = [];
    this.imagePreviews = [];
  }

  toggleEditMode() {
    this.isPreviewMode = !this.isPreviewMode;
  }

  deleteNote(note: Note) {
    if (!note._id || !confirm('Delete this note?')) return;
    
    this.noteService.deleteNote(note._id).subscribe({
      next: () => {
        this.loadNotesForDate(this.selectedDate());
        this.loadAllNotes();
        this.buildCalendar(this.currentDate());
        this.messageService.add({severity:'success', summary:'Deleted', detail:'Note deleted'});
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Delete failed'})
    });
  }

  // --- Media Handling ---
  triggerFileUpload() { 
    if (!this.isPreviewMode) {
      this.fileInput.nativeElement.click(); 
    }
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (!files.length) return;

    this.selectedFiles.push(...files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push({ url: e.target.result, file: file });
      };
      reader.readAsDataURL(file);
    });
  }

  removeAttachment(index: number) {
    if (this.isPreviewMode) return;
    
    const item = this.imagePreviews[index];
    
    if (item.file) {
      this.selectedFiles = this.selectedFiles.filter(f => f !== item.file);
    } else {
      const currentAtts = this.noteForm.get('attachments')?.value as NoteAttachment[];
      const updatedAtts = currentAtts.filter(a => a.url !== item.url);
      this.noteForm.patchValue({ attachments: updatedAtts });
    }
    
    this.imagePreviews.splice(index, 1);
  }

  // --- Saving ---
  saveNote() {
    if (this.noteForm.invalid || this.isPreviewMode) return;
    this.isSaving = true;

    const upload$ = this.selectedFiles.length > 0 
      ? this.noteService.uploadMedia(this.selectedFiles)
      : of({ data: [] });

    upload$.pipe(
      switchMap((res: any) => {
        const newAttachments = res.data || [];
        const existingAttachments = this.noteForm.get('attachments')?.value || [];
        const finalAttachments = [...existingAttachments, ...newAttachments];
        
        const payload = { ...this.noteForm.value, attachments: finalAttachments };
        if (!payload.createdAt) payload.createdAt = this.selectedDate();

        return this.selectedNote?._id 
          ? this.noteService.updateNote(this.selectedNote._id, payload)
          : this.noteService.createNote(payload);
      }),
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.isEditorVisible = false;
        this.loadNotesForDate(this.selectedDate());
        this.loadAllNotes();
        this.buildCalendar(this.currentDate());
        this.messageService.add({severity:'success', summary:'Saved', detail:'Entry saved successfully'});
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Save failed'})
    });
  }

  isSameDate(d1: Date, d2: Date): boolean {
    return d1.toDateString() === d2.toDateString();
  }

  // View switching
  switchView(view: 'calendar' | 'archive') {
    this.activeView.set(view);
  }

  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }
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

// import { NoteService } from '../../../../core/services/notes.service';
// import { Note, NoteAttachment } from '../../../../core/models/note.types';

// interface CalendarDay {
//   date: Date;
//   dayNum: number;
//   isCurrentMonth: boolean;
//   isToday: boolean;
//   isSelected: boolean;
//   noteCount: number; // For the dots
// }

// @Component({
//   selector: 'app-notes-manager',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, 
//     InputTextModule, TextareaModule, AutoCompleteModule, ToastModule, 
//     TooltipModule, ImageModule
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

//   // --- State ---
//   currentDate = signal(new Date());
//   selectedDate = signal(new Date());
  
//   calendarDays = signal<CalendarDay[]>([]);
//   dailyNotes = signal<Note[]>([]);
  
//   // --- Editor State ---
//   isEditorVisible = false;
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

//   constructor() {
//     this.noteForm = this.fb.group({
//       _id: [null],
//       title: ['', Validators.required],
//       content: ['', Validators.required],
//       tags: [[]],
//       attachments: [[]], // Stores server-side URLs
//       createdAt: [null]
//     });

//     // Refresh calendar structure AND stats when month changes
//     effect(() => {
//       this.buildCalendar(this.currentDate());
//     });
//   }

//   ngOnInit() {
//     this.loadNotesForDate(this.selectedDate());
//   }

//   // =================================================================
//   // 1. ADVANCED CALENDAR LOGIC
//   // =================================================================

//   buildCalendar(date: Date) {
//     const year = date.getFullYear();
//     const month = date.getMonth(); 
    
//     // 1. Fetch Stats from API (The "Counts" per day)
//     this.noteService.getDailyNoteCounts(year, month + 1).subscribe(res => {
//       const stats = res.data || []; // e.g., [{day: 5, count: 2}, {day: 12, count: 1}]
      
//       const firstDay = new Date(year, month, 1).getDay();
//       const daysInMonth = new Date(year, month + 1, 0).getDate();
//       const daysInPrevMonth = new Date(year, month, 0).getDate();

//       const grid: CalendarDay[] = [];

//       // Prev Month Padding
//       for (let i = 0; i < firstDay; i++) {
//         const d = daysInPrevMonth - firstDay + 1 + i;
//         grid.push(this.createDayObj(new Date(year, month - 1, d), false, 0));
//       }

//       // Current Month
//       for (let i = 1; i <= daysInMonth; i++) {
//         const dayStat = stats.find(s => s.day === i);
//         const count = dayStat ? dayStat.count : 0;
//         grid.push(this.createDayObj(new Date(year, month, i), true, count));
//       }

//       // Next Month Padding
//       const remaining = 42 - grid.length;
//       for (let i = 1; i <= remaining; i++) {
//         grid.push(this.createDayObj(new Date(year, month + 1, i), false, 0));
//       }

//       this.calendarDays.set(grid);
//     });
//   }

//   createDayObj(date: Date, isCurrentMonth: boolean, count: number): CalendarDay {
//     return {
//       date: date,
//       dayNum: date.getDate(),
//       isCurrentMonth,
//       isToday: this.isSameDate(date, new Date()),
//       isSelected: this.isSameDate(date, this.selectedDate()),
//       noteCount: count
//     };
//   }

//   changeMonth(delta: number) {
//     const newDate = new Date(this.currentDate());
//     newDate.setMonth(newDate.getMonth() + delta);
//     this.currentDate.set(newDate);
//   }

//   jumpToToday() {
//     const today = new Date();
//     this.currentDate.set(today);
//     this.selectDay({ date: today } as CalendarDay);
//   }

//   selectDay(day: CalendarDay) {
//     this.selectedDate.set(day.date);
    
//     // Re-calc "selected" boolean in grid without full rebuild
//     const updatedGrid = this.calendarDays().map(d => ({
//       ...d,
//       isSelected: this.isSameDate(d.date, day.date)
//     }));
//     this.calendarDays.set(updatedGrid);
    
//     this.loadNotesForDate(day.date);
//   }

//   // =================================================================
//   // 2. DATA & EDITOR LOGIC
//   // =================================================================

//   loadNotesForDate(date: Date) {
//     const dateStr = date.toISOString().split('T')[0];
//     this.noteService.getNotes({ date: dateStr }).subscribe({
//       next: (res) => this.dailyNotes.set(res.data.notes || []),
//       error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Could not load notes'})
//     });
//   }

//   openNewNote() {
//     this.selectedNote = null;
//     this.resetEditor();
//     this.noteForm.patchValue({ createdAt: this.selectedDate() });
//     this.isEditorVisible = true;
//   }

//   editNote(note: Note) {
//     this.selectedNote = note;
//     this.resetEditor();
//     this.noteForm.patchValue(note);
    
//     // Load existing server attachments
//     if (note.attachments) {
//       this.imagePreviews = note.attachments.map(att => ({ url: att.url }));
//     }
    
//     this.isEditorVisible = true;
//   }

//   resetEditor() {
//     this.noteForm.reset({ title: '', content: '', tags: [], attachments: [], createdAt: null });
//     this.selectedFiles = [];
//     this.imagePreviews = [];
//   }

//   // --- Media Handling ---
//   triggerFileUpload() { this.fileInput.nativeElement.click(); }

//   onFileSelect(event: any) {
//     const files = Array.from(event.target.files) as File[];
//     if (!files.length) return;

//     this.selectedFiles.push(...files);
    
//     // Generate local previews
//     files.forEach(file => {
//       const reader = new FileReader();
//       reader.onload = (e: any) => {
//         this.imagePreviews.push({ url: e.target.result, file: file });
//       };
//       reader.readAsDataURL(file);
//     });
//   }

//   removeAttachment(index: number) {
//     const item = this.imagePreviews[index];
    
//     // If it's a new file, remove from selectedFiles
//     if (item.file) {
//       this.selectedFiles = this.selectedFiles.filter(f => f !== item.file);
//     } else {
//       // If it's a server file (no file obj), remove from form control 'attachments'
//       const currentAtts = this.noteForm.get('attachments')?.value as NoteAttachment[];
//       const updatedAtts = currentAtts.filter(a => a.url !== item.url);
//       this.noteForm.patchValue({ attachments: updatedAtts });
//     }
    
//     this.imagePreviews.splice(index, 1);
//   }

//   // --- Saving ---
//   saveNote() {
//     if (this.noteForm.invalid) return;
//     this.isSaving = true;

//     // 1. Upload new files first (if any)
//     const upload$ = this.selectedFiles.length > 0 
//       ? this.noteService.uploadMedia(this.selectedFiles)
//       : of({ data: [] });

//     upload$.pipe(
//       switchMap((res: any) => {
//         const newAttachments = res.data || [];
//         const existingAttachments = this.noteForm.get('attachments')?.value || [];
        
//         // Combine old and new attachments
//         const finalAttachments = [...existingAttachments, ...newAttachments];
        
//         const payload = { ...this.noteForm.value, attachments: finalAttachments };
//         if (!payload.createdAt) payload.createdAt = this.selectedDate();

//         return this.selectedNote?._id 
//           ? this.noteService.updateNote(this.selectedNote._id, payload)
//           : this.noteService.createNote(payload);
//       }),
//       finalize(() => this.isSaving = false)
//     ).subscribe({
//       next: () => {
//         this.isEditorVisible = false;
//         this.loadNotesForDate(this.selectedDate()); // Refresh List
//         this.buildCalendar(this.currentDate()); // Refresh Dots (stats)
//         this.messageService.add({severity:'success', summary:'Saved', detail:'Entry saved successfully'});
//       },
//       error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Save failed'})
//     });
//   }

//   isSameDate(d1: Date, d2: Date): boolean {
//     return d1.toDateString() === d2.toDateString();
//   }
// }
