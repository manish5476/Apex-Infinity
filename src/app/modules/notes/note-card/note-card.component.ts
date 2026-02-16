import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../../../core/services/notes.service';
import { MasterListService } from '../../../core/services/master-list.service';
import { Note, NoteType, Participant } from '../../../core/models/note.types'; 

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
  template: `
    <!-- WRAPPER -->
    <div [class]="viewMode === 'list' ? 'note-item-list' : 'note-card-grid'" [class.is-pinned]="note.isPinned"
      [class.is-archived]="note.status === 'archived'" [class.is-deleted]="note.isDeleted"
      [class.priority-high]="note.priority === 'high'" [class.priority-urgent]="note.priority === 'urgent'"
      (click)="onCardClick()">

      <!-- ==================== VIEW MODE: GRID (CARD) ==================== -->
      @if (viewMode === 'grid') {
      <!-- Header: Type, Status, Pin -->
      <div class="card-header">
        <div class="badges">
          <span class="type-badge" [ngClass]="note.noteType">
            <i [class]="getTypeIcon(note.noteType)"></i>
            <span>{{ note.noteType | titlecase }}</span>
          </span>

          @if (isOverdue) {
          <span class="status-badge overdue">
            <i class="pi pi-exclamation-circle"></i> Due
          </span>
          }

          <!-- Linked Notes Indicator -->
          @if (note.relatedNotes?.length) {
          <span class="status-badge linked" title="Has linked notes">
            <i class="pi pi-link"></i> {{note.relatedNotes?.length}}
          </span>
          }
        </div>

        <button class="action-btn pin-btn" [class.active]="note.isPinned"
          (click)="$event.stopPropagation(); pin.emit(note._id)">
          <i class="pi pi-thumbtack" [style.transform]="note.isPinned ? 'rotate(-45deg)' : 'none'"></i>
        </button>
      </div>

      <!-- Body: Content -->
      <div class="card-body">
        <h3 class="note-title" [title]="note.title">
          {{ note.title || 'Untitled Note' }}
        </h3>

        <!-- Meeting Specifics -->
        @if (note.noteType === 'meeting') {
        <div class="meeting-meta">
          <div class="meta-row highlight">
            <i class="pi pi-clock"></i>
            <span>{{ meetingDateDisplay }}</span>
            <span class="separator">•</span>
            <span>{{ meetingTimeDisplay }}</span>
          </div>
          @if (note.meetingDetails?.location) {
          <div class="meta-row">
            <i class="pi pi-map-marker"></i> {{ note.meetingDetails?.location }}
          </div>
          }
        </div>
        }

        <!-- Content Excerpt -->
        <p class="note-excerpt">{{ getExcerpt(100) }}</p>

        <!-- Progress Bar (Dynamic) -->
        @if (progress !== null) {
        <div class="progress-container">
          <div class="progress-info">
            <span>Progress</span>
            <span class="progress-val">{{ progress }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progress" [class.complete]="progress === 100"
              [class.started]="progress! > 0 && progress! < 100"></div>
          </div>
        </div>
        }

        <!-- Tags -->
        @if (note.tags.length) {
        <div class="tags-row">
          @for (tag of note.tags | slice:0:3; track tag) {
          <span class="tag">#{{ tag }}</span>
          }
          @if (note.tags.length > 3) {
          <span class="tag more">+{{ note.tags.length - 3 }}</span>
          }
        </div>
        }
      </div>

      <!-- Footer: Avatars & Actions -->
      <div class="card-footer">
        <div class="avatars">

          <!-- Owner -->
          <div class="avatar owner" [title]="'Owner: ' + getOwnerName()">
            {{ getOwnerName().charAt(0) | uppercase }}
          </div>

          <!-- Participants -->
          @for (p of note.participants | slice:0:2; track p._id) {
          <div class="avatar" [title]="getParticipantName(p)">
            {{ getParticipantName(p).charAt(0) | uppercase }}
          </div>
          }

          @if (note.participants.length > 2) {
          <div class="avatar counter">
            +{{ note.participants.length - 2 }}
          </div>
          }

        </div>


        <div class="actions" (click)="$event.stopPropagation()">
          <ng-container *ngTemplateOutlet="actionButtons"></ng-container>
        </div>
      </div>
      }

      <!-- ==================== VIEW MODE: LIST ==================== -->
      @if (viewMode === 'list') {
      <!-- Priority Strip -->
      <div class="list-strip" [ngClass]="note.priority || 'medium'"></div>

      <!-- Icon -->
      <div class="list-icon" [ngClass]="note.noteType">
        <i [class]="getTypeIcon(note.noteType)"></i>
      </div>

      <!-- Main Info -->
      <div class="list-main">
        <div class="list-header">
          <h3 class="list-title">{{ note.title || 'Untitled' }}</h3>
          @if (note.isPinned) {
          <span class="icon-indicator"><i class="pi pi-thumbtack"></i></span>
          }
          @if (isOverdue) {
          <span class="list-badge overdue">Due</span>
          }
          @if (note.relatedNotes?.length) {
          <span class="list-badge linked"><i class="pi pi-link"></i> {{note.relatedNotes?.length}}</span>
          }
        </div>
        <p class="list-excerpt">{{ getExcerpt(80) }}</p>
      </div>

      <!-- Meta Columns (Desktop) -->
      <div class="list-meta desktop-only">
        <div class="meta-item">
          <i class="pi pi-calendar"></i> {{ note.updatedAt | date:'MMM d' }}
        </div>
        @if (note.participants && note.participants.length) {
        <div class="meta-item users">
          <i class="pi pi-users"></i> {{ note.participants.length }}
        </div>
        }
        @if (progress !== null) {
        <div class="meta-item progress">
          <div class="mini-progress-circle" [style.--p]="progress"></div>
          <span>{{progress}}%</span>
        </div>
        }
      </div>

      <!-- Actions -->
      <div class="list-actions" (click)="$event.stopPropagation()">
        <ng-container *ngTemplateOutlet="actionButtons"></ng-container>
      </div>
      }

      <!-- ==================== SHARED TEMPLATES: ACTIONS ==================== -->
      <ng-template #actionButtons>

        <!-- Active Note Actions -->
        @if (!note.isDeleted && note.status !== 'archived') {
        @if (note.noteType === 'note') {
        <button class="action-btn" (click)="convertToTask.emit(note._id)" title="Convert to Task">
          <i class="pi pi-check-square"></i>
        </button>
        }

        <button class="action-btn" (click)="$event.stopPropagation(); linkClick.emit(note._id)" title="Link Note">
          <i class="pi pi-link"></i>
        </button>

        <button class="action-btn" (click)="openShareDialog()" title="Share">
          <i class="pi pi-share-alt"></i>
        </button>

        <button class="action-btn" (click)="archive.emit(note._id)" title="Archive">
          <i class="pi pi-box"></i>
        </button>

        <button class="action-btn delete" (click)="delete.emit(note._id)" title="Delete">
          <i class="pi pi-trash"></i>
        </button>
        }

        <!-- Trash/Archived Actions -->
        @if (note.isDeleted || note.status === 'archived') {
        <button class="action-btn restore" (click)="restore.emit(note._id)" title="Restore">
          <i class="pi pi-refresh"></i>
        </button>
        @if (note.isDeleted) {
        <button class="action-btn delete-hard" (click)="deleteHard.emit(note._id)" title="Permanently Delete">
          <i class="pi pi-times"></i>
        </button>
        }
        }
      </ng-template>

    </div>

    <!-- ==================== SHARE DIALOG OVERLAY ==================== -->
    @if (showShareDialog) {
    <div class="share-overlay" (click)="closeShareDialog()">
      <div class="share-dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <div class="title-group">
            <i class="pi pi-share-alt"></i>
            <h4>Share Note</h4>
          </div>
          <button class="close-btn" (click)="closeShareDialog()">×</button>
        </div>

        <div class="dialog-body">
          <p class="dialog-subtitle">Invite users to collaborate on <strong>{{note.title}}</strong></p>

          <div class="search-box">
            <i class="pi pi-search"></i>
            <input type="text" placeholder="Search by name or email..." [(ngModel)]="userSearch">
          </div>

          <div class="user-list">
            @for (user of filteredUsers(); track user._id) {
            <div class="user-item" (click)="toggleUserSelection(user._id)" [class.selected]="selectedUserIds.has(user._id)">

              <div class="user-info">
                <div class="avatar-sm" [style.backgroundColor]="getAvatarColor(user.name)">
                  {{ user.name.charAt(0) | uppercase }}
                </div>
                <div class="details">
                  <span class="name">{{ user.name }}</span>
                  <span class="email">{{ user.email }}</span>
                </div>
              </div>

              <div class="checkbox">
                <div class="check-circle" [class.checked]="selectedUserIds.has(user._id)">
                  <i class="pi pi-check"></i>
                </div>
              </div>
            </div>
            }

            @if (filteredUsers().length === 0) {
            <div class="empty-state">
              <span>No users found</span>
            </div>
            }
          </div>
        </div>

        <div class="dialog-footer">
          <div class="permissions-group">
            <label>Access Level</label>
            <div class="select-wrapper">
              <select [(ngModel)]="selectedPermission">
                <option value="viewer">Viewer (Read Only)</option>
                <option value="contributor">Contributor (Edit)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
              <i class="pi pi-chevron-down"></i>
            </div>
          </div>
          <button class="btn-primary" [disabled]="selectedUserIds.size === 0 || isSharing" (click)="submitShare()">
            @if (!isSharing) {
            <i class="pi pi-send"></i>
            } @else {
            <i class="pi pi-spin pi-spinner"></i>
            }
            <span>{{ isSharing ? 'Sending...' : 'Invite Users' }}</span>
          </button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    /* ==================== CARD GRID STYLE ==================== */
    .note-card-grid {
      background: var(--bg-secondary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      transition: all 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
      cursor: pointer;
      position: relative;
      height: 100%;
      min-height: 200px; /* Consistent height hint */

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--border-primary);
        
        .card-footer .actions { opacity: 1; }
      }

      /* Priority Borders */
      &.priority-high { border-left: 3px solid var(--color-warning); }
      &.priority-urgent { border-left: 3px solid var(--color-error); }

      /* Card Header */
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-sm);

        .badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .type-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; text-transform: uppercase; font-weight: 700;
          padding: 3px 8px; border-radius: 99px;
          background: var(--bg-ternary); color: var(--text-secondary);
          
          i { font-size: 10px; }
          
          &.meeting { background: #f0fdf4; color: #15803d; }
          &.task { background: #eff6ff; color: #1d4ed8; }
          &.idea { background: #fffbeb; color: #b45309; }
        }

        .status-badge {
          font-size: 10px; padding: 3px 8px; border-radius: 99px; font-weight: 600; display: flex; align-items: center; gap: 4px;
          &.overdue { background: #fef2f2; color: #ef4444; }
          &.linked { background: var(--bg-ternary); color: var(--accent-primary); }
        }

        .pin-btn {
          background: none; border: none; color: var(--text-tertiary); cursor: pointer;
          transition: 0.2s; opacity: 0;
          &.active { opacity: 1; color: var(--accent-primary); }
        }
      }
      &:hover .card-header .pin-btn { opacity: 1; }

      /* Card Body */
      .card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);

        .note-title {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .note-excerpt {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
          opacity: 0.8;
        }

        /* Meeting Meta */
        .meeting-meta {
          background: var(--bg-ternary);
          border-radius: var(--ui-border-radius);
          padding: 8px;
          display: flex; flex-direction: column; gap: 4px;
          font-size: 11px; color: var(--text-secondary);
          
          .meta-row {
            display: flex; align-items: center; gap: 6px;
            &.highlight { color: var(--accent-primary); font-weight: 600; }
            .separator { opacity: 0.5; }
          }
        }

        /* Progress */
        .progress-container {
          margin-top: auto;
          .progress-info { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-tertiary); margin-bottom: 4px; font-weight: 600; text-transform: uppercase; }
          .progress-track { height: 4px; background: var(--bg-ternary); border-radius: 2px; overflow: hidden; }
          .progress-fill {
            height: 100%; background: var(--color-info);
            &.started { background: var(--accent-primary); }
            &.complete { background: var(--color-success); }
          }
        }

        /* Tags */
        .tags-row {
          display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;
          .tag { font-size: 10px; color: var(--text-tertiary); background: var(--bg-ternary); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); }
          .tag.more { background: transparent; }
        }
      }

      /* Card Footer */
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--spacing-md);
        border-top: 1px dashed var(--border-secondary);
        margin-top: var(--spacing-md);
        min-height: 32px;

        .avatars {
          display: flex;
          align-items: center;
          
          .avatar {
            width: 24px; height: 24px; border-radius: 50%;
            background: var(--accent-secondary); color: white;
            font-size: 9px; font-weight: 700;
            display: grid; place-items: center;
            border: 2px solid var(--bg-secondary);
            margin-right: -8px;
            
            &.owner { background: var(--accent-primary); z-index: 5; }
            &.counter { background: var(--bg-ternary); color: var(--text-secondary); font-size: 8px; z-index: 0; }
          }
        }

        .actions {
          display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s;
          .action-btn {
            width: 24px; height: 24px; border-radius: 4px;
            border: none; background: transparent;
            color: var(--text-tertiary); cursor: pointer;
            display: grid; place-items: center;
            &:hover { background: var(--bg-ternary); color: var(--text-primary); }
            &.delete:hover { color: var(--color-error); background: var(--color-error-bg); }
          }
        }
      }
    }

    /* ==================== LIST VIEW STYLE ==================== */
    .note-item-list {
      background: var(--bg-secondary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      transition: all 0.2s;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      &:hover {
        background: var(--bg-hover);
        border-color: var(--border-primary);
        .list-actions { opacity: 1; }
      }

      .list-strip {
        position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
        &.low { background: #10b981; }
        &.medium { background: #3b82f6; }
        &.high { background: #f59e0b; }
        &.urgent { background: #ef4444; }
      }

      .list-icon {
        width: 36px; height: 36px; border-radius: 8px;
        background: var(--bg-ternary); color: var(--text-secondary);
        display: grid; place-items: center; font-size: 1.1rem;
        flex-shrink: 0; margin-left: 8px;
      }

      .list-main {
        flex: 1; min-width: 0;
        .list-header {
          display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
          .list-title { font-size: var(--font-size-md); font-weight: 600; margin: 0; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .icon-indicator { color: var(--accent-primary); font-size: 10px; }
          .list-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; 
            &.overdue { background: #fee2e2; color: #ef4444; }
            &.linked { background: var(--bg-ternary); color: var(--text-secondary); display: flex; gap: 4px; align-items: center; }
          }
        }
        .list-excerpt { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8; }
      }

      .list-meta {
        display: flex; gap: var(--spacing-xl); align-items: center; color: var(--text-tertiary); font-size: var(--font-size-sm);
        .meta-item { display: flex; align-items: center; gap: 6px; width: 80px; }
        
        .progress { 
          .mini-progress-circle { 
            width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border-secondary); 
            background: conic-gradient(var(--accent-primary) calc(var(--p) * 1%), transparent 0);
          }
        }
      }

      .list-actions {
        display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s;
        .action-btn {
          width: 28px; height: 28px; border-radius: 4px; border: 1px solid transparent; background: transparent; color: var(--text-tertiary); cursor: pointer; display: grid; place-items: center;
          &:hover { background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); }
        }
      }
    }

    /* ==================== SHARE DIALOG ==================== */
    .share-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    .share-dialog {
      background: var(--bg-primary); width: 400px; max-width: 90vw;
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-2xl); border: 1px solid var(--border-primary);
      overflow: hidden; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      .dialog-header {
        padding: 16px 20px; border-bottom: 1px solid var(--border-secondary);
        display: flex; justify-content: space-between; align-items: center;
        background: var(--bg-secondary);
        
        .title-group { display: flex; gap: 8px; align-items: center; color: var(--text-primary); i { color: var(--accent-primary); } h4 { margin: 0; font-size: 16px; font-weight: 700; } }
        .close-btn { background: none; border: none; font-size: 20px; color: var(--text-tertiary); cursor: pointer; &:hover { color: var(--color-error); } }
      }

      .dialog-body {
        padding: 20px;
        .dialog-subtitle { margin: 0 0 16px 0; font-size: 13px; color: var(--text-secondary); strong { color: var(--text-primary); } }
        
        .search-box {
          position: relative; margin-bottom: 16px;
          i { position: absolute; left: 12px; top: 10px; color: var(--text-tertiary); }
          input { width: 100%; padding: 10px 12px 10px 36px; border-radius: 8px; border: 1px solid var(--border-secondary); background: var(--bg-secondary); color: var(--text-primary); outline: none; &:focus { border-color: var(--accent-primary); } }
        }

        .user-list {
          max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;
          
          .user-item {
            display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.1s;
            &:hover { background: var(--bg-hover); }
            &.selected { background: color-mix(in srgb, var(--accent-primary) 5%, transparent); .check-circle { background: var(--accent-primary); border-color: var(--accent-primary); i { transform: scale(1); } } }
            
            .user-info {
              display: flex; align-items: center; gap: 10px;
              .avatar-sm { width: 32px; height: 32px; border-radius: 50%; color: white; display: grid; place-items: center; font-size: 12px; font-weight: 600; }
              .details { display: flex; flex-direction: column; .name { font-size: 13px; font-weight: 500; color: var(--text-primary); } .email { font-size: 11px; color: var(--text-tertiary); } }
            }
            
            .check-circle {
              width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-secondary); display: grid; place-items: center; transition: 0.2s;
              i { color: white; font-size: 10px; transform: scale(0); transition: 0.2s; }
            }
          }
        }
      }

      .dialog-footer {
        padding: 16px 20px; border-top: 1px solid var(--border-secondary); background: var(--bg-secondary);
        display: flex; gap: 12px; align-items: flex-end;

        .permissions-group {
          flex: 1; display: flex; flex-direction: column; gap: 4px;
          label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; }
          .select-wrapper {
            position: relative;
            select { width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-secondary); background: var(--bg-primary); appearance: none; font-size: 13px; color: var(--text-primary); cursor: pointer; outline: none; &:focus { border-color: var(--accent-primary); } }
            i { position: absolute; right: 10px; top: 12px; font-size: 10px; pointer-events: none; color: var(--text-tertiary); }
          }
        }

        .btn-primary {
          background: var(--accent-primary); color: white; border: none; padding: 0 20px; height: 36px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px;
          &:disabled { opacity: 0.6; cursor: not-allowed; }
          &:hover:not(:disabled) { background: var(--accent-hover); }
        }
      }
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class NoteCardComponent implements OnInit {
  private noteService = inject(NoteService);
  private masterList = inject(MasterListService);

  // --- Inputs ---
  @Input({ required: true }) note!: Note;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() availableUsers: any[] = [];

  // --- Outputs ---
  @Output() pin = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();      // Soft delete
  @Output() deleteHard = new EventEmitter<string>();  // Permanent delete
  @Output() archive = new EventEmitter<string>();
  @Output() restore = new EventEmitter<string>();
  @Output() share = new EventEmitter<string>();
  @Output() linkClick = new EventEmitter<string>();
  @Output() convertToTask = new EventEmitter<string>();

  // --- Signals & State ---
  users = computed(() => this.masterList.users());
  
  // Share Dialog State
  showShareDialog = false;
  userSearch = '';
  selectedUserIds = new Set<string>();
  selectedPermission: 'viewer' | 'contributor' | 'admin' = 'viewer';
  isSharing = false;

  ngOnInit(): void {
    // If availableUsers weren't passed in, fallback to master list
    if (!this.availableUsers || this.availableUsers.length === 0) {
      this.availableUsers = this.users();
    }
  }

  // --- Computed Properties ---

  get isOverdue(): boolean {
    if (!this.note.dueDate || this.note.status === 'completed') return false;
    return new Date(this.note.dueDate) < new Date();
  }

  get meetingDateDisplay(): string | null {
    if (this.note.noteType !== 'meeting' || !this.note.startDate) return null;
    return new Date(this.note.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  get meetingTimeDisplay(): string | null {
    if (this.note.noteType !== 'meeting' || !this.note.startDate) return null;
    return new Date(this.note.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  get progress(): number | null {
    if (!this.note.subtasks || this.note.subtasks.length === 0) return null;
    const completed = this.note.subtasks.filter((t) => t.completed).length;
    return Math.round((completed / this.note.subtasks.length) * 100);
  }

  getOwnerName(): string {
    if (!this.note.owner) return 'Unknown';
    if (typeof this.note.owner === 'string') return 'Unknown';
    return this.note.owner.name || 'Unknown';
  }

  getParticipantName(p: Participant): string {
    if (!p.user) return 'Guest';
    if (typeof p.user === 'string') return 'Guest';
    return p.user.name || 'Guest';
  }

  // --- Methods ---

  onCardClick() {
    this.edit.emit(this.note._id);
  }

  getTypeIcon(type: NoteType): string {
    const map: Record<string, string> = {
      note: 'pi pi-file-o',
      meeting: 'pi pi-calendar',
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
    if (this.selectedUserIds.size === 0) return;
    this.isSharing = true;
    const userIds = Array.from(this.selectedUserIds);
    this.noteService.shareNote(this.note._id, userIds, this.selectedPermission)
      .subscribe({
        next: (res: any) => {
          this.note = res.data.note; // Optimistic update
          this.isSharing = false;
          this.closeShareDialog();
          this.share.emit(this.note._id);
        },
        error: (err) => {
          console.error('Failed to share note', err);
          this.isSharing = false;
        }
      });
  }
}
