import {
  Component, inject, signal, computed,
  OnInit, ChangeDetectionStrategy, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NoteService } from '../../../core/services/notes.service';
import { AppMessageService } from '../../../core/services/message.service';
import { Note, NoteActivity, AssetAttachment, ChecklistItem } from '../../../core/models/note.types';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-note-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DatePickerModule, ButtonModule, TooltipModule],
  templateUrl: './note-detail.component.html',
  styleUrls: ['./note-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noteService = inject(NoteService);
  private messageService = inject(AppMessageService);
  private fb = inject(FormBuilder);

  // ── State ──────────────────────────────────────────────────────────────────
  note = signal<Note | null>(null);
  activityLog = signal<NoteActivity[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  isTrash = computed(() => this.note()?.isDeleted ?? false);
  isArchived = computed(() => this.note()?.status === 'archived');

  progress = computed(() => {
    const n = this.note();
    if (!n?.checklist?.length) return 0;
    const done = n.checklist.filter(s => s.completed).length;
    return Math.round((done / n.checklist.length) * 100);
  });

  /** Number of completed checklist items — exposed for the template (arrow fns not allowed in templates) */
  completedItemsCount = computed(() => {
    const n = this.note();
    if (!n?.checklist?.length) return 0;
    return n.checklist.filter(s => s.completed).length;
  });

  // ── Form ───────────────────────────────────────────────────────────────────
  editForm = this.fb.group({
    title: ['', Validators.required],
    content: [''],
    priority: ['medium'],
    status: ['open'],
    tags: [''],
    startDate: [null as string | Date | null],
    dueDate: [null as string | Date | null]
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.isEditing.set(false);
          // fetchNote already includes activityLog in the response —
          // do NOT call fetchHistory here or the log will be fetched twice.
          this.fetchNote(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  fetchNote(id: string): void {
    this.isLoading.set(true);
    this.noteService.getNoteById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          const note = res.data.note;
          this.note.set(note);
          this.patchForm(note);

          // Prefer the dedicated activityLog (full actor objects, changes detail).
          // Fall back to the embedded note.activityLog (older format: { user, timestamp })
          // and normalize it into the NoteActivity shape so the template works uniformly.
          const dedicated: NoteActivity[] = Array.isArray(res.data.activityLog)
            ? res.data.activityLog : [];

          if (dedicated.length) {
            this.activityLog.set(dedicated);
          } else {
            const embedded: any[] = Array.isArray((note as any).activityLog)
              ? (note as any).activityLog : [];
            // Normalize embedded shape { action, user, timestamp } → NoteActivity shape
            const normalized: NoteActivity[] = embedded.map(e => ({
              _id: e._id ?? e.timestamp,
              organizationId: note.organizationId,
              actor: typeof e.actor === 'object'
                ? e.actor
                : { _id: e.user ?? '', name: e.user ?? 'User' } as any,
              action: e.action,
              changes: e.changes,
              createdAt: e.createdAt ?? e.timestamp,
            }));
            this.activityLog.set(normalized);
          }

          this.isLoading.set(false);
        },
        error: err => {
          this.isLoading.set(false);
          this.messageService.handleHttpError(err);
          this.router.navigate(['/notes']);
        }
      });
  }

  fetchHistory(id: string): void {
    this.noteService.getNoteHistory(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        // Guard: API may return undefined / null — always store an array
        next: res => {
          this.activityLog.set(Array.isArray(res.data?.activityLog) ? res.data.activityLog : []);
        },
        error: err => this.messageService.handleHttpError(err)
      });
  }

  // ── Form helpers ───────────────────────────────────────────────────────────
  patchForm(note: Note): void {
    const toDateStr = (v?: string | Date | null) => {
      if (!v) return null;
      try { return new Date(v).toISOString().split('T')[0]; } catch { return null; }
    };

    this.editForm.patchValue({
      title: note.title,
      content: note.content ?? '',
      priority: note.priority,
      status: note.status,
      tags: note.tags?.join(', ') ?? '',
      startDate: toDateStr(note.startDate),
      dueDate: toDateStr(note.dueDate)
    });
  }

  // ── Edit / Save ────────────────────────────────────────────────────────────
  toggleEdit(): void {
    if (this.isEditing() && this.note()) {
      this.patchForm(this.note()!);
    }
    this.isEditing.update(v => !v);
  }

  saveChanges(): void {
    if (this.editForm.invalid || !this.note()) {
      this.editForm.markAllAsTouched();
      this.messageService.showWarn('Please fill in all required fields.');
      return;
    }
    this.isSaving.set(true);

    const v = this.editForm.value;
    const toISO = (d: any) =>
      d instanceof Date ? d.toISOString().split('T')[0] : d ?? null;

    const payload = {
      title: v.title,
      content: v.content,
      priority: v.priority,
      status: v.status,
      tags: (v.tags ?? '').split(',').map((t: string) => t.trim()).filter(Boolean),
      startDate: toISO(v.startDate),
      dueDate: toISO(v.dueDate)
    };

    this.noteService.updateNote(this.note()!._id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.note.set(res.data.note);
          this.isEditing.set(false);
          this.isSaving.set(false);
          this.messageService.showSuccess('Note updated successfully.');
          // Re-fetch the full note so activityLog is refreshed in one call
          this.fetchNote(res.data.note._id);
        },
        error: err => {
          this.isSaving.set(false);
          this.messageService.handleHttpError(err);
        }
      });
  }

  /** Friendly label for a field name from the activityLog changes */
  fieldLabel(field: string): string {
    const map: Record<string, string> = {
      title: 'Title', content: 'Content', status: 'Status', priority: 'Priority',
      startDate: 'Start Date', dueDate: 'Due Date', tags: 'Tags',
      assignees: 'Assignees', visibility: 'Visibility'
    };
    return map[field] ?? field;
  }

  /** Format activity log change values — renders ISO dates nicely, else returns value as string */
  formatChangeValue(val: any): string {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      try {
        return new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch { /* fall through */ }
    }
    if (Array.isArray(val)) return val.join(', ') || '(empty)';
    return String(val);
  }
  getInitials(name?: string): string {
    if (!name?.trim()) return '?';
    return name.trim().split(' ')
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  downloadAttachment(file: AssetAttachment): void {
    if ((file as any).url) window.open((file as any).url, '_blank');
  }

  // ── Checklist ──────────────────────────────────────────────────────────────
  addSubtask(input: HTMLInputElement): void {
    const val = input.value.trim();
    if (!val || !this.note()) return;
    this.noteService.addChecklistItem(this.note()!._id, val)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.note.set(res.data.note);
          input.value = '';
        },
        error: err => this.messageService.handleHttpError(err)
      });
  }

  toggleSubtask(item: ChecklistItem): void {
    if (!this.note() || !item._id) return;
    this.noteService.toggleChecklistItem(this.note()!._id, item._id, !item.completed)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => this.note.set(res.data.note),
        error: err => this.messageService.handleHttpError(err)
      });
  }

  deleteSubtask(id: string): void {
    if (!this.note()) return;
    this.noteService.removeChecklistItem(this.note()!._id, id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => this.note.set(res.data.note),
        error: (err: any) => this.messageService.handleHttpError(err)
      });
  }

  // ── Linking ────────────────────────────────────────────────────────────────
  openLinkDialog(): void {
    const id = prompt('Enter Note ID to link:');
    if (id && this.note()) {
      this.noteService.linkNote(this.note()!._id, id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(res => this.note.set(res.data.note));
    }
  }

  unlinkNote(targetId: string): void {
    if (!confirm('Remove this link?') || !this.note()) return;
    this.noteService.unlinkNote(this.note()!._id, targetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.note.set(res.data.note));
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  duplicateNote(): void {
    if (!this.note()) return;
    this.noteService.duplicateNote(this.note()!._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.messageService.showSuccess('Note duplicated.');
          this.router.navigate(['/notes', res.data.note._id]);
        },
        error: err => this.messageService.handleHttpError(err)
      });
  }

  archiveNote(): void {
    if (!this.note()) return;
    this.noteService.archiveNote(this.note()!._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.note.set(res.data.note);
          this.messageService.showSuccess('Note archived.');
        },
        error: err => this.messageService.handleHttpError(err)
      });
  }

  restoreNote(): void {
    if (!this.note()) return;
    const req$ = this.isTrash()
      ? this.noteService.restoreFromTrash(this.note()!._id)
      : this.noteService.restoreNote(this.note()!._id);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.note.set(res.data.note);
        this.messageService.showSuccess('Note restored.');
      },
      error: err => this.messageService.handleHttpError(err)
    });
  }

  deleteNote(): void {
    if (!this.note()?._id) return;
    const id = this.note()!._id;

    if (this.isTrash()) {
      if (!confirm('Permanently delete this note? This cannot be undone.')) return;
      this.noteService.hardDeleteNote(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.showSuccess('Note permanently deleted.');
            this.router.navigate(['/notes']);
          },
          error: err => this.messageService.handleHttpError(err)
        });
    } else {
      this.noteService.deleteNote(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.showSuccess('Note moved to trash.');
            this.router.navigate(['/notes']);
          },
          error: err => this.messageService.handleHttpError(err)
        });
    }
  }

  convertToTask(): void {
    if (!this.note()) return;
    this.noteService.convertToTask(this.note()!._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.note.set(res.data.note);
          this.messageService.showSuccess('Converted to task.');
        },
        error: err => this.messageService.handleHttpError(err)
      });
  }
}