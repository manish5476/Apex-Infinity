import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  ViewChild,
  ElementRef,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize, debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ImageModule } from 'primeng/image';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';

import { Note } from '../../../../core/models/note.types';
import { NoteService } from '../../../../core/services/notes.service';

// --- Interfaces ---
type ViewMode = 'day' | 'week' | 'month' | 'year';

interface TimelineDay {
  date: Date;
  dayNum: number;
  dayName: string;
  count: number;
  intensity: number; // 0-3
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
    TooltipModule,
    ImageModule,
    ConfirmDialogModule,
    TabsModule,
    SkeletonModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notes-manager.component.html',
  styleUrls: ['./notes-manager.component.scss']
})
export class NotesManagerComponent implements OnInit {
  private noteService = inject(NoteService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private confirmationService = inject(ConfirmationService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  // --- State: Navigation & Timeline ---
  currentDate = signal(new Date()); // The month being viewed in timeline
  selectedDate = signal(new Date()); // The specific day selected
  timelineDays = signal<TimelineDay[]>([]);
  isTimelineLoading = signal(false);

  // --- State: Notes Data ---
  activeTabValue: ViewMode = 'day';
  dailyNotes: Note[] = [];
  filteredDailyNotes: Note[] = [];
  
  // Summary Data (Week/Month/Year view)
  summaries: any[] = [
    { title: 'Week', key: 'week', data: [], icon: 'pi pi-calendar-times' },
    { title: 'Month', key: 'month', data: [], icon: 'pi pi-calendar' },
    { title: 'Year', key: 'year', data: [], icon: 'pi pi-server' }
  ];

  // --- State: Editor ---
  selectedNote: Note | null = null;
  isEditing = false;
  isSaving = false;
  isContentLoading = signal(false);
  isFocusMode = false;

  noteForm: FormGroup;
  searchControl = new FormControl('');
  
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  // --- Computed ---
  currentMonthName = computed(() => 
    this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' })
  );

  constructor() {
    this.noteForm = this.fb.group({
      _id: [null],
      title: ['', Validators.required],
      content: ['', Validators.required],
      tags: [[]],
      attachments: [[]],
      createdAt: [null]
    });

    // Auto-scroll timeline when data loads
    effect(() => {
      if (!this.isTimelineLoading() && this.timelineDays().length > 0) {
        setTimeout(() => this.scrollToSelected(), 100);
      }
    });
  }

  ngOnInit(): void {
    this.setupSearch();
    this.setupAutoSave();
    
    // Initial Load
    this.loadTimelineData(); // Loads the strip
    this.loadDailyNotes();   // Loads notes for today
  }

  // ==========================================================================
  // 1. TIMELINE LOGIC (Merged from NoteTimelineComponent)
  // ==========================================================================

  loadTimelineData(): void {
    // this.isTimelineLoading.set(true);
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const tempDays: TimelineDay[] = [];

    // Generate days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      tempDays.push({
        date: date,
        dayNum: i,
        dayName: date.toLocaleDateString('default', { weekday: 'short' }),
        count: 0,
        intensity: 0
      });
    }

    // Fetch counts from API
    this.noteService.getDailyNoteCounts(year, month).subscribe({
      next: (res: any) => {
        const apiCounts = res.data || [];
        const mapped = tempDays.map(day => {
          const match = apiCounts.find((c: any) => c.day === day.dayNum);
          const count = match ? (match.count ?? 0) : 0;
          return { ...day, count, intensity: this.calculateIntensity(count) };
        });
        this.timelineDays.set(mapped);
        this.isTimelineLoading.set(false);
      },
      error: () => {
        this.timelineDays.set(tempDays); // Show empty on error
        this.isTimelineLoading.set(false);
      }
    });
  }

  onDateSelect(date: Date): void {
    this.selectedDate.set(date);
    this.activeTabValue = 'day'; // Switch to day view
    this.scrollToSelected();
    this.loadDailyNotes(); // Fetch notes for this specific date
  }

  changeTimelineMonth(delta: number): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    newDate.setDate(1); 
    this.currentDate.set(newDate);
    this.loadTimelineData();
  }

  jumpToToday(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.selectedDate.set(today);
    this.loadTimelineData();
    this.loadDailyNotes();
  }

  scrollToSelected() {
    if (!this.scrollContainer?.nativeElement) return;
    const container = this.scrollContainer.nativeElement;
    const activeEl = container.querySelector('.day-card.active') as HTMLElement;
    if (activeEl) {
      const scrollPos = activeEl.offsetLeft - (container.offsetWidth / 2) + (activeEl.offsetWidth / 2);
      container.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }

  calculateIntensity(count: number): number {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    return 3;
  }

  isSameDate(d1: Date, d2: Date): boolean {
    return d1.toDateString() === d2.toDateString();
  }

  isToday(date: Date): boolean {
    return this.isSameDate(date, new Date());
  }

  getDotArray(count: number): number[] {
    return Array(Math.min(count, 3)).fill(0);
  }

  // ==========================================================================
  // 2. NOTES MANAGER LOGIC
  // ==========================================================================

  onTabChange(event: any): void {
    const value = (event as any).value ?? this.activeTabValue;
    this.activeTabValue = value as ViewMode;
    this.selectedNote = null;
    this.startNewNote();

    if (this.activeTabValue === 'day') {
      this.loadDailyNotes();
    } else {
      this.loadSummary(this.activeTabValue);
    }
  }

  loadDailyNotes(): void {
    this.isContentLoading.set(true);
    this.startNewNote(); // Reset form
    
    const dateStr = this.selectedDate().toISOString().split('T')[0];

    this.noteService.getNotes({ date: dateStr })
      .pipe(finalize(() => this.isContentLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.dailyNotes = this.sortNotes(res.data.notes || []);
          this.filteredDailyNotes = [...this.dailyNotes];
          this.cdr.markForCheck();
        },
        error: () => this.showError('Failed to load notes')
      });
  }

  loadSummary(key: string): void {
    this.isContentLoading.set(true);
    const d = this.selectedDate();
    let req$: any;

    if (key === 'week') req$ = this.noteService.getNotes({ week: d.toISOString().split('T')[0] });
    else if (key === 'month') req$ = this.noteService.getNotes({ year: d.getFullYear(), month: d.getMonth() + 1 });
    else req$ = this.noteService.getNotes({ year: d.getFullYear() });

    req$.pipe(finalize(() => this.isContentLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          const summary = this.summaries.find(s => s.key === key);
          if (summary) summary.data = this.sortNotes(res.data.notes || []);
          this.cdr.markForCheck();
        },
        error: () => this.showError('Failed to load summary')
      });
  }

  // --- Editor Logic ---

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
        
        const payload: Partial<Note> = {
          title: this.noteForm.get('title')?.value,
          content: this.noteForm.get('content')?.value,
          tags: this.noteForm.get('tags')?.value || [],
          attachments: [...current, ...newAttachments],
          // Important: Ensure date is set to selected Timeline date if new
          createdAt: this.isEditing ? this.noteForm.get('createdAt')?.value : this.selectedDate().toISOString()
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
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Note saved successfully' });
        this.selectedFiles = [];
        this.imagePreviews = [];
        
        // Refresh data & update Timeline counts!
        this.loadDailyNotes();
        this.loadTimelineData(); // Refresh dots
      },
      error: () => this.showError('Failed to save')
    });
  }

  deleteNote(note: Note | null, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!note?._id) return;

    this.confirmationService.confirm({
      message: 'Delete this note permanently?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.noteService.deleteNote(note._id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Note removed' });
            this.selectedNote = null;
            this.loadDailyNotes();
            this.loadTimelineData(); // Update dots
          }
        });
      }
    });
  }

  // --- Helpers ---

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
      createdAt: this.selectedDate() // Default to currently selected timeline date
    });
    this.noteForm.enable();
  }

  selectNote(note: Note): void {
    this.selectedNote = note;
    this.isEditing = true;
    this.selectedFiles = [];
    this.imagePreviews = []; // clear local previews
    
    this.noteForm.patchValue({
      _id: note._id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      attachments: note.attachments,
      createdAt: note.createdAt
    });

    this.isEditable(note) ? this.noteForm.enable() : this.noteForm.disable();
  }

  isEditable(note: Note | null): boolean {
    if (!note?.createdAt) return true;
    // Example rule: Locked after 24 hours (optional)
    // return new Date(note.createdAt).getTime() > Date.now() - 86400000;
    return true; 
  }

  getSummaryData(key: string): Note[] {
    return this.summaries.find(s => s.key === key)?.data || [];
  }

  toggleFocusMode() { this.isFocusMode = !this.isFocusMode; }

  // --- Internals ---

  private setupSearch() {
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(term => {
        const q = (term || '').toLowerCase();
        this.filteredDailyNotes = this.dailyNotes.filter(n => 
          n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
        );
      });
  }

  private setupAutoSave() {
    this.noteForm.valueChanges.pipe(
      debounceTime(3000),
      filter(() => this.isEditing && this.noteForm.dirty && this.noteForm.valid)
    ).subscribe(() => {
        // Optional: Implement silent auto-save here
    });
  }

  onFileSelect(event: any) {
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
  }

  removeLocalPreview(i: number) { this.selectedFiles.splice(i, 1); this.imagePreviews.splice(i, 1); }
  
  removeServerAttachment(i: number) {
    const atts = [...this.noteForm.get('attachments')?.value];
    atts.splice(i, 1);
    this.noteForm.patchValue({ attachments: atts });
  }

  private sortNotes(notes: Note[]) {
    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}
