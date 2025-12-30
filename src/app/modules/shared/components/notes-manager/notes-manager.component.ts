import { Component, OnInit, inject, signal, computed, effect, ViewChild, ElementRef, HostListener } from '@angular/core';
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
import { ChipModule } from 'primeng/chip';

import { NoteService } from '../../../../core/services/notes.service';
import { Note } from '../../../../core/models/note.types';

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
    TooltipModule, ChipModule
  ],
  providers: [MessageService],
  templateUrl: './notes-manager.component.html',
  styleUrls: ['./notes-manager.component.scss']
})
export class NotesManagerComponent implements OnInit {
  private noteService = inject(NoteService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private elementRef = inject(ElementRef); // Injected for 3D effect

  @ViewChild('fileInput') fileInput!: ElementRef;

  // --- 3D TILT STATE (New UI Feature) ---
  rotateX = signal(0);
  rotateY = signal(0);

  // --- YOUR ORIGINAL STATE SIGNALS ---
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

  // --- YOUR ORIGINAL COMPUTED STATE ---
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

  // --- 3D TILT LOGIC (New UI Feature) ---
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const card = this.elementRef.nativeElement.querySelector('.erp-glass-widget');
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        this.rotateX.set(0); this.rotateY.set(0); return;
    }

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Subtle tilt
    this.rotateX.set(((y - centerY) / centerY) * -2);
    this.rotateY.set(((x - centerX) / centerX) * 2);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.rotateX.set(0); this.rotateY.set(0);
  }

  // --- YOUR ORIGINAL DATA FLOW ---
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

  // --- YOUR ORIGINAL CALENDAR LOGIC ---
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
        const count = stats.find((s:any) => s.day === i)?.count || 0;
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
