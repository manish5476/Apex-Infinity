import { MessageService } from "primeng/api";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../../../core/services/notes.service';
// import { MasterListService } from '../../../core/services/master-list.service';
import { Note, ItemType, Assignee } from '../../../core/models/note.types';
import { AppMessageService } from "../../../core/services/message.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// Mock Interface for User (if not imported from models)
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, DatePipe, SlicePipe],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note-card.component.html',
  styleUrl: './note-card.component.scss'
})
export class NoteCardComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private noteService = inject(NoteService);
  // private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);

  // --- Inputs ---
  @Input({ required: true }) note!: Note;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() availableUsers: any[] = [];

  // --- Outputs ---
  @Output() pin = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() deleteHard = new EventEmitter<string>();
  @Output() archive = new EventEmitter<string>();
  @Output() restore = new EventEmitter<string>();
  @Output() share = new EventEmitter<string>();
  @Output() linkClick = new EventEmitter<string>();
  @Output() convertToTask = new EventEmitter<string>();

  // users = computed(() => this.masterList.users());

  showShareDialog = false;
  userSearch = '';
  selectedUserIds = new Set<string>();
  selectedPermission: 'viewer' | 'contributor' | 'admin' = 'viewer';
  isSharing = false;

  constructor(private cdr: ChangeDetectorRef) { }
  
  ngOnInit(): void {
    // if (!this.availableUsers || this.availableUsers.length === 0) {
    //   this.availableUsers = this.users();
    // }
  }

  // --- Computed Properties ---
  get isOverdue(): boolean {
    if (!this.note.dueDate || this.note.status === 'done') return false;
    return new Date(this.note.dueDate) < new Date();
  }

  get meetingDateDisplay(): string | null {
    if (this.note.itemType !== 'meeting' || !this.note.startDate) return null;
    return new Date(this.note.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  get meetingTimeDisplay(): string | null {
    if (this.note.itemType !== 'meeting' || !this.note.startDate) return null;
    return new Date(this.note.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  get progress(): number | null {
    if (!this.note.checklist || this.note.checklist.length === 0) return null;
    const completed = this.note.checklist.filter((t) => t.completed).length;
    return Math.round((completed / this.note.checklist.length) * 100);
  }

  getOwnerName(): string {
    if (!this.note.owner) return 'Unknown';
    if (typeof this.note.owner === 'string') return 'Unknown';
    return this.note.owner.name || 'Unknown';
  }

  getParticipantName(p: Assignee): string {
    if (!p.user) return 'Guest';
    if (typeof p.user === 'string') return 'Guest';
    return p.user.name || 'Guest';
  }

  // --- Methods ---

  onCardClick() {
    this.edit.emit(this.note._id);
  }

  getTypeIcon(type: ItemType): string {
    const map: Record<string, string> = {
      note: 'pi pi-file-o',
      meeting: 'pi pi-calendar',
      meeting_note: 'pi pi-calendar',
      task: 'pi pi-check-square',
      idea: 'pi pi-bolt',
      project: 'pi pi-briefcase',
      journal: 'pi pi-book'
    };
    return map[type] || 'pi pi-file';
  }

  getExcerpt(limit: number): string {
    const content = this.note.summary || this.note.content || '';
    // Strip HTML tags for clean excerpt if needed
    const text = content.replace(/<[^>]*>/g, '');
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // --- Share Logic ---
  openShareDialog() {
    this.showShareDialog = true;
    this.selectedUserIds.clear();
    this.userSearch = '';
  }

  closeShareDialog() {
    this.showShareDialog = false;
  }

  filteredUsers() {
    const term = this.userSearch.toLowerCase();
    return this.availableUsers.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  }

  toggleUserSelection(userId: string) {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  submitShare() {
    if (this.selectedUserIds.size === 0) {
      this.messageService.showWarn('No Users Selected: Please select at least one user to share with.');
      return;
    }

    this.isSharing = true;
    const userIds = Array.from(this.selectedUserIds);

    this.noteService.shareNote(this.note._id, userIds, this.selectedPermission).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.note = res.data.note;
          this.isSharing = false;

          // Simplified success message including the permission context
          this.messageService.showSuccess(`Note shared successfully with ${this.selectedPermission} access.`);

          this.closeShareDialog();
          this.share.emit(this.note._id);
        },
        error: (err) => {
          this.isSharing = false;
          // Replaced console.error with the global handler for precise feedback
          this.messageService.handleHttpError(err);
          // Ensure the UI reflects the state change if using OnPush
          this.cdr.markForCheck();
        }
      });
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
