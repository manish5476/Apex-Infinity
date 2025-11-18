// import { ImageUploaderComponent } from './../image-uploader.component';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// --- Custom App Components ---
// import { NoteService } from '../../../core/services/note.service';
// --- PrimeNG Modules ---
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
import { ApiService } from '../../../../core/services/api';
import { NoteService } from '../../../../core/services/notes.service';

// --- Interfaces ---
interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  attachments: string[];
  createdAt: string;
}

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
    // ImageUploaderComponent,
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
  styleUrls: ['./notes-manager.component.scss']
})
export class NotesManagerComponent implements OnInit, OnChanges {
  // --- Services ---
  private noteService = inject(NoteService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private confirmationService = inject(ConfirmationService);

  @Input() date!: CalendarDay;

  // --- State ---
  dailyNotes: Note[] = [];
  filteredDailyNotes: Note[] = [];
  summaries: Summary[] = [];
  selectedNote: any

  noteForm: FormGroup;
  searchControl = new FormControl('');
  isEditing = false;
  isSaving = false;
  isLoading: Record<LoadingKey, boolean> = { day: true, week: false, month: false, year: false };
  activeTabValue: LoadingKey = 'day';
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

  // ✅ Initialize summaries
  ngOnInit(): void {
    this.summaries = [
      { title: 'Week', key: 'week', data: [], icon: 'pi pi-calendar-times' },
      { title: 'Month', key: 'month', data: [], icon: 'pi pi-calendar' },
      { title: 'Year', key: 'year', data: [], icon: 'pi pi-server' }
    ];
    this.setupSearch();
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['date']?.currentValue && !this._noteToSelectAfterLoad) {
  //     this.activeTabValue = 'day';
  //     this.resetAllNotes();
  //     this.loadDailyNotes();
  //   }
  // }
ngOnChanges(changes: SimpleChanges): void {
  if (changes['date']?.currentValue && !this._noteToSelectAfterLoad) {
    this.activeTabValue = 'day';
    this.resetAllNotes();
    this.loadDailyNotes();
  }
}

getSummaryData(key: 'week' | 'month' | 'year'): Note[] {
  const summary = this.summaries.find(s => s.key === key);
  return summary ? summary.data : [];
}

  // 🔍 Local search
  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      const term = (searchTerm || '').toLowerCase();
      this.filteredDailyNotes = !term
        ? this.dailyNotes
        : this.dailyNotes.filter(n =>
            n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
          );
      this.cdr.markForCheck();
    });
  }

  // 🔹 Reusable data handler
  private createDataHandler<T extends { data: { notes: Note[] } }>(callback: (res: T) => void) {
    return {
      next: (res: T) => {
        callback(res);
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load notes.' });
        this.cdr.markForCheck();
      }
    };
  }

  private updateLoadingState(key: LoadingKey, value: boolean): void {
    this.isLoading[key] = value;
    this.cdr.markForCheck();
  }

  // 🗓️ Daily notes
  loadDailyNotes(): void {
    if (!this.date?.date) return;
    this.updateLoadingState('day', true);
    if (!this._noteToSelectAfterLoad) this.startNewNote();

    this.noteService
      .getNotes({ date: this.formatDate(this.date.date) })
      .pipe(finalize(() => this.updateLoadingState('day', false)))
      .subscribe(this.createDataHandler(res => {
        this.dailyNotes = this.sortNotes(res.data.notes || []);
        this.filteredDailyNotes = [...this.dailyNotes];

        if (this._noteToSelectAfterLoad) {
          const noteToSelect = this.dailyNotes.find(n => n._id === this._noteToSelectAfterLoad);
          if (noteToSelect) this.selectNote(noteToSelect);
          this._noteToSelectAfterLoad = null;
        }
      }));
  }

  // 📅 Weekly, Monthly, Yearly summaries
  loadWeeklyNotes(): void {
    if (!this.date?.date) return;
    this.updateLoadingState('week', true);
    this.noteService
      .getNotes({ week: this.formatDate(this.date.date) })
      .pipe(finalize(() => this.updateLoadingState('week', false)))
      .subscribe(this.createDataHandler(res => this.updateSummary('week', res.data.notes)));
  }

  loadMonthlyNotes(): void {
    if (!this.date?.date) return;
    const d = this.date.date;
    this.updateLoadingState('month', true);
    this.noteService
      .getNotesForMonth(d.getFullYear(), d.getMonth() + 1)
      .pipe(finalize(() => this.updateLoadingState('month', false)))
      .subscribe(this.createDataHandler(res => this.updateSummary('month', res.data.notes)));
  }

  loadYearlyNotes(): void {
    if (!this.date?.date) return;
    this.updateLoadingState('year', true);
    this.noteService
      .getNotes({ year: this.date.date.getFullYear() })
      .pipe(finalize(() => this.updateLoadingState('year', false)))
      .subscribe(this.createDataHandler(res => this.updateSummary('year', res.data.notes)));
  }

  private updateSummary(key: SummaryKey, notes: Note[]): void {
    const summary = this.summaries.find(s => s.key === key);
    if (summary) summary.data = this.sortNotes(notes || []);
    this.loadedTabs[key] = true;
  }

  // 🔄 Refresh active tab
  refreshCurrentView(): void {
    const map: Record<LoadingKey, () => void> = {
      day: () => this.loadDailyNotes(),
      week: () => this.loadWeeklyNotes(),
      month: () => this.loadMonthlyNotes(),
      year: () => this.loadYearlyNotes()
    };
    map[this.activeTabValue]?.();
  }

  // 🧭 Tab change handler
  onTabChange(event: any): void {
    this.activeTabValue = event.value as LoadingKey;
    this.selectedNote = null;
    if (this.activeTabValue !== 'day') {
      const key = this.activeTabValue as SummaryKey;
      if (!this.loadedTabs[key]) this.refreshCurrentView();
    }
    this.cdr.markForCheck();
  }

  // 📝 CRUD operations
  selectNote(note: Note): void {
    this.selectedNote = note;
    this.isEditing = true;
    this.noteForm.reset(note);
    this.isEditable(note) ? this.noteForm.enable() : this.noteForm.disable();
    this.cdr.markForCheck();
  }

  selectForPreview(note: Note): void {
    this.selectedNote = note;
    this.cdr.markForCheck();
  }

  startNewNote(): void {
    this.selectedNote = null;
    this.isEditing = false;
    this.noteForm.enable();
    this.noteForm.reset({
      createdAt: this.date?.date || new Date(),
      tags: [],
      attachments: []
    });
    this.cdr.markForCheck();
  }

  saveNote(): void {
    if (this.noteForm.invalid) return;
    this.isSaving = true;
    const formData = this.noteForm.getRawValue();
    const req$ = this.isEditing
      ? this.noteService.updateNote(formData._id, formData)
      : this.noteService.createNote({ ...formData, createdAt: this.date.date });

    req$.pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Note saved successfully' });
          this.refreshCurrentView();
          if (res.data.note) this.selectNote(res.data.note);
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save note.' })
      });
  }

  deleteNote(note: Note | null, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!note || !this.isEditable(note)) {
      this.messageService.add({ severity: 'warn', summary: 'Permission Denied', detail: 'This note is too old to delete.' });
      return;
    }
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this note?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.noteService.deleteNote(note._id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Note deleted' });
            this.selectedNote = null;
            this.refreshCurrentView();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete note.' })
        });
      }
    });
  }

  editNoteFromCard(note: Note, event: MouseEvent): void {
    event.stopPropagation();
    this.editNoteFromPreview(note);
  }

  editNoteFromPreview(note: Note | null): void {
    if (!note) return;
    this.date = { date: new Date(note.createdAt) };
    this._noteToSelectAfterLoad = note._id;
    this.activeTabValue = 'day';
    this.loadDailyNotes();
    this.cdr.markForCheck();
  }

  // 📎 Attachments
  onImageUploaded(url: string): void {
    const attachments = this.noteForm.get('attachments')?.value || [];
    this.noteForm.get('attachments')?.setValue([...attachments, url]);
    this.cdr.markForCheck();
  }

  removeAttachment(index: number): void {
    const attachments = [...(this.noteForm.get('attachments')?.value || [])];
    attachments.splice(index, 1);
    this.noteForm.get('attachments')?.setValue(attachments);
    this.cdr.markForCheck();
  }

  // 🧩 Helpers
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private sortNotes(notes: Note[]): Note[] {
    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private resetAllNotes(): void {
    this.dailyNotes = [];
    this.filteredDailyNotes = [];
    this.summaries.forEach(s => (s.data = []));
    this.loadedTabs = { week: false, month: false, year: false };
    this.startNewNote();
  }

  isEditable(note: Note | null): boolean {
    if (!note?.createdAt) return false;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(note.createdAt).getTime() > oneDayAgo;
  }
}
