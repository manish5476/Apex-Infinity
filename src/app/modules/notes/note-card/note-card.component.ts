import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  computed, 
  inject, 
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../../../core/models/note.types';
import { MasterListService } from '../../../core/services/master-list.service';
import { NoteService } from '../../../core/services/notes.service';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- WRAPPER: Handles Grid vs List classes dynamically -->
    <div [class]="viewMode === 'list' ? 'note-item-list' : 'note-card-grid'"
         [class.is-pinned]="note.isPinned"
         [class.is-archived]="note.status === 'archived'"
         [class.is-deleted]="note.isDeleted"
         [class.priority-high]="note.priority === 'high'"
         (click)="onCardClick()">

      <!-- ==================== VIEW MODE: GRID (CARD) ==================== -->
      <ng-container *ngIf="viewMode === 'grid'">
        <!-- Header: Type & Pin -->
        <div class="card-header">
          <div class="badges">
            <span class="type-badge" [ngClass]="note.noteType">
              <i [class]="getTypeIcon(note.noteType)"></i>
              <span>{{ note.noteType | titlecase }}</span>
            </span>
            <span *ngIf="isOverdue" class="status-badge overdue">
              <i class="pi pi-exclamation-circle"></i> Due
            </span>
          </div>
          <button class="action-btn pin-btn" 
                  [class.active]="note.isPinned"
                  (click)="$event.stopPropagation(); pin.emit(note._id)">
            <i class="pi pi-thumbtack"></i>
          </button>
        </div>

        <!-- Body: Content -->
        <div class="card-body">
          <h3 class="note-title">{{ note.title || 'Untitled Note' }}</h3>
          
          <!-- Meeting Specifics -->
          <div *ngIf="note.noteType === 'meeting'" class="meeting-meta">
            <div class="meta-row">
              <i class="pi pi-clock"></i> {{ meetingTimeDisplay }}
            </div>
            <div *ngIf="note.meetingDetails?.location" class="meta-row">
              <i class="pi pi-map-marker"></i> {{ note.meetingDetails?.location }}
            </div>
          </div>

          <p class="note-excerpt">{{ getExcerpt(100) }}</p>

          <!-- Progress Bar -->
          <div *ngIf="progress !== null" class="progress-container">
            <div class="progress-info">
              <span>Task Progress</span>
              <span class="progress-val">{{ progress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" 
                   [style.width.%]="progress"
                   [class.complete]="progress === 100"></div>
            </div>
          </div>

          <!-- Tags -->
          <div class="tags-row" *ngIf="note.tags?.length">
            <span *ngFor="let tag of note.tags | slice:0:3" class="tag">#{{ tag }}</span>
            <span *ngIf="note.tags.length > 3" class="tag more">+{{ note.tags.length - 3 }}</span>
          </div>
        </div>

        <!-- Footer: Avatars & Actions -->
        <div class="card-footer">
          <div class="avatars">
            <div *ngFor="let p of note.participants | slice:0:3" 
                 class="avatar" 
                 [title]="p.user.name">
              {{ p.user.name.charAt(0) }}
            </div>
            <div *ngIf="note.participants.length > 3" class="avatar counter">
              +{{ note.participants.length - 3 }}
            </div>
          </div>
          
          <div class="actions" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="actionButtons"></ng-container>
          </div>
        </div>
      </ng-container>

      <!-- ==================== VIEW MODE: LIST ==================== -->
      <ng-container *ngIf="viewMode === 'list'">
        <!-- Drag Handle / Priority Strip -->
        <div class="list-strip" [ngClass]="note.priority || 'medium'"></div>
        
        <!-- Icon -->
        <div class="list-icon" [ngClass]="note.noteType">
          <i [class]="getTypeIcon(note.noteType)"></i>
        </div>

        <!-- Main Info -->
        <div class="list-main">
          <div class="list-header">
            <h3 class="list-title">{{ note.title || 'Untitled' }}</h3>
            <span *ngIf="isOverdue" class="list-badge overdue">Due</span>
          </div>
          <p class="list-excerpt">{{ getExcerpt(60) }}</p>
        </div>

        <!-- Meta Columns -->
        <div class="list-meta desktop-only">
          <div class="meta-item">
            <i class="pi pi-calendar"></i> {{ note.updatedAt | date:'MMM d' }}
          </div>
          <div class="meta-item" *ngIf="note.participants.length">
             <i class="pi pi-users"></i> {{ note.participants.length }}
          </div>
        </div>

        <!-- Tags -->
        <div class="list-tags desktop-only">
           <span *ngFor="let tag of note.tags | slice:0:2" class="tag">#{{tag}}</span>
        </div>

        <!-- Actions -->
        <div class="list-actions" (click)="$event.stopPropagation()">
          <button class="action-btn text-only" 
                  [class.active]="note.isPinned" 
                  (click)="pin.emit(note._id)">
            <i class="pi pi-thumbtack"></i>
          </button>
          <ng-container *ngTemplateOutlet="actionButtons"></ng-container>
        </div>
      </ng-container>

      <!-- ==================== SHARED TEMPLATES ==================== -->
      <ng-template #actionButtons>
        <ng-container *ngIf="!note.isDeleted && note.status !== 'archived'">
           <button class="action-btn" (click)="archive.emit(note._id)" title="Archive">
            <i class="pi pi-box"></i>
          </button>
          <button class="action-btn" (click)="openShareDialog()" title="Share">
            <i class="pi pi-share-alt"></i>
          </button>
          <button class="action-btn delete" (click)="delete.emit(note._id)" title="Delete">
            <i class="pi pi-trash"></i>
          </button>
        </ng-container>
        
        <ng-container *ngIf="note.isDeleted || note.status === 'archived'">
          <button class="action-btn restore" (click)="restore.emit(note._id)" title="Restore">
            <i class="pi pi-refresh"></i>
          </button>
          <button *ngIf="note.isDeleted" class="action-btn delete-hard" (click)="delete.emit(note._id)" title="Perm Delete">
            <i class="pi pi-times"></i>
          </button>
        </ng-container>
      </ng-template>

    </div>

    <!-- ==================== SHARE DIALOG OVERLAY ==================== -->
    <div *ngIf="showShareDialog" class="share-overlay" (click)="closeShareDialog()">
      <div class="share-dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h4>Share "{{note.title}}"</h4>
          <button class="close-btn" (click)="closeShareDialog()">×</button>
        </div>
        
        <div class="dialog-body">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input type="text" placeholder="Search users..." [(ngModel)]="userSearch">
          </div>

          <div class="user-list">
            <div *ngFor="let user of filteredUsers()" 
                 class="user-item" 
                 (click)="toggleUserSelection(user._id)"
                 [class.selected]="selectedUserIds.has(user._id)">
              
              <div class="user-info">
                <div class="avatar-sm">{{ user.name.charAt(0) }}</div>
                <div class="details">
                  <span class="name">{{ user['name'] }}</span>
                  <span class="email">{{ user['email'] }}</span>
                </div>
              </div>
              
              <div class="checkbox">
                <i class="pi pi-check" *ngIf="selectedUserIds.has(user._id)"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <div class="permissions">
            <label>Permission:</label>
            <select [(ngModel)]="selectedPermission">
              <option value="viewer">Viewer</option>
              <option value="contributor">Contributor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button class="btn-primary" 
                  [disabled]="selectedUserIds.size === 0 || isSharing"
                  (click)="submitShare()">
            {{ isSharing ? 'Sharing...' : 'Share' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ==================== VARIABLES MAPPING ==================== */
    :host {
      display: block;
      --card-bg: var(--bg-secondary);
      --card-border: var(--border-secondary);
      --text-main: var(--text-primary);
      --text-sub: var(--text-secondary);
      --highlight: var(--accent-primary);
    }

    /* ==================== GRID VIEW (CARD) ==================== */
    .note-card-grid {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      transition: var(--transition-base);
      cursor: pointer;
      position: relative;
      height: 100%;
      min-height: 200px;
      box-shadow: var(--shadow-sm);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--border-primary);
        
        .action-btn { opacity: 1; }
      }

      &.is-pinned { border-top: 3px solid var(--accent-secondary); }
      &.is-deleted { opacity: 0.7; filter: grayscale(1); }
      &.priority-high { border-left: 3px solid var(--color-error); }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .badges { display: flex; gap: var(--spacing-xs); }
    }

    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      padding: 2px 8px;
      border-radius: var(--ui-border-radius);
      background: var(--bg-ternary);
      color: var(--text-sub);

      &.meeting { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.task { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      &.project { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    }

    .status-badge {
      font-size: var(--font-size-xs);
      padding: 2px 6px;
      border-radius: var(--ui-border-radius-sm);
      &.overdue { background: var(--color-error-bg); color: var(--color-error); }
    }

    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);

      .note-title {
        font-family: var(--font-heading);
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-main);
        margin: 0;
        line-height: var(--line-height-tight);
      }

      .note-excerpt {
        font-size: var(--font-size-sm);
        color: var(--text-sub);
        line-height: var(--line-height-normal);
        margin: 0;
      }
    }

    .meeting-meta {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .meta-row { display: flex; align-items: center; gap: 4px; }
    }

    .progress-container {
      margin-top: auto;
      .progress-info {
        display: flex; 
        justify-content: space-between; 
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        margin-bottom: 2px;
      }
      .progress-track {
        height: 4px;
        background: var(--bg-ternary);
        border-radius: 2px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: var(--highlight);
        &.complete { background: var(--color-success); }
      }
    }

    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      .tag {
        font-size: 10px;
        padding: 1px 6px;
        background: var(--bg-ternary);
        border-radius: 4px;
        color: var(--text-tertiary);
      }
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--border-secondary);

      .avatars {
        display: flex;
        .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent-primary);
          color: white;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--card-bg);
          margin-left: -8px;
          &:first-child { margin-left: 0; }
          &.counter { background: var(--bg-ternary); color: var(--text-sub); }
        }
      }

      .actions {
        display: flex;
        gap: 2px;
      }
    }

    /* ==================== LIST VIEW ==================== */
    .note-item-list {
      display: flex;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--card-bg);
      border-bottom: 1px solid var(--border-secondary);
      gap: var(--spacing-md);
      cursor: pointer;
      transition: background-color var(--transition-fast);
      position: relative;
      overflow: hidden;

      &:hover {
        background: var(--bg-hover);
        .action-btn { opacity: 1; }
      }

      .list-strip {
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: transparent;
        &.high { background: var(--color-error); }
        &.medium { background: var(--color-warning); }
      }

      .list-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: var(--bg-ternary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-sub);
        flex-shrink: 0;
        
        &.meeting { color: #3b82f6; background: rgba(59,130,246,0.1); }
      }

      .list-main {
        flex: 1;
        min-width: 0;
        .list-header { display: flex; align-items: center; gap: 8px; }
        .list-title {
          font-family: var(--font-body);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
        .list-excerpt {
          font-size: var(--font-size-sm);
          color: var(--text-tertiary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
      }

      .list-meta, .list-tags {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        display: flex;
        gap: 12px;
        flex-shrink: 0;
        align-items: center;
      }

      .desktop-only {
        @media (max-width: 768px) { display: none; }
      }
    }

    /* ==================== BUTTONS ==================== */
    .action-btn {
      background: transparent;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: var(--ui-border-radius);
      color: var(--text-sub);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.2s;
      opacity: 0; /* Hidden by default until hover */

      &:hover { background: var(--bg-ternary); color: var(--text-main); }
      &.active { color: var(--accent-primary); opacity: 1; }
      &.delete:hover { background: var(--color-error-bg); color: var(--color-error); }
    }

    /* ==================== SHARE DIALOG ==================== */
    .share-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
    }

    .share-dialog {
      width: 400px;
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--border-primary);
      overflow: hidden;
      animation: fadeIn 0.2s ease-out;

      .dialog-header {
        padding: var(--spacing-md) var(--spacing-xl);
        border-bottom: 1px solid var(--border-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;
        h4 { margin: 0; font-size: var(--font-size-md); font-weight: 600; }
        .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-sub); }
      }

      .dialog-body {
        padding: var(--spacing-md);
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-secondary);
          padding: 8px;
          border-radius: var(--ui-border-radius);
          border: 1px solid var(--border-secondary);
          margin-bottom: 12px;
          
          input {
            border: none;
            background: transparent;
            width: 100%;
            outline: none;
            font-size: var(--font-size-sm);
            color: var(--text-main);
          }
        }

        .user-list {
          max-height: 250px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-radius: var(--ui-border-radius);
          cursor: pointer;
          
          &:hover { background: var(--bg-hover); }
          &.selected { background: var(--bg-active); border: 1px solid var(--accent-primary); }

          .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
            .avatar-sm {
              width: 28px; height: 28px;
              background: var(--accent-secondary);
              color: white;
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              font-size: 11px;
            }
            .details {
              display: flex; flex-direction: column;
              .name { font-size: var(--font-size-sm); font-weight: 500; }
              .email { font-size: 10px; color: var(--text-tertiary); }
            }
          }
        }
      }

      .dialog-footer {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .permissions select {
          margin-left: 8px;
          padding: 4px;
          border-radius: 4px;
          border: 1px solid var(--border-secondary);
          font-size: var(--font-size-sm);
        }

        .btn-primary {
          background: var(--accent-primary);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: var(--ui-border-radius);
          font-size: var(--font-size-sm);
          font-weight: 500;
          cursor: pointer;
          &:disabled { opacity: 0.5; cursor: not-allowed; }
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class NoteCardComponent {
  // Dependencies
  private masterList = inject(MasterListService);
  private noteService = inject(NoteService);

  // Inputs
  @Input({ required: true }) note!: Note;
  @Input() viewMode: 'grid' | 'list' = 'grid';

  // Outputs
  @Output() pin = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() archive = new EventEmitter<string>();
  @Output() restore = new EventEmitter<string>();
  @Output() share = new EventEmitter<string>(); // Emits after successful share if needed

  // Share Dialog State
  showShareDialog = false;
  userSearch = '';
  selectedUserIds = new Set<string>();
  selectedPermission = 'viewer';
  isSharing = false;

  // Computed Data from MasterList
  users = computed(() => this.masterList.users());

  // --- Computed Properties ---

  get isOverdue(): boolean {
    if (!this.note.dueDate || this.note.status === 'completed') return false;
    return new Date(this.note.dueDate) < new Date();
  }

  get meetingTimeDisplay(): string | null {
    if (this.note.noteType !== 'meeting' || !this.note.startDate) return null;
    return new Date(this.note.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  get progress(): number | null {
    if (!this.note.subtasks || this.note.subtasks.length === 0) return null;
    const completed = this.note.subtasks.filter(t => t.completed).length;
    return Math.round((completed / this.note.subtasks.length) * 100);
  }

  // --- Methods ---

  onCardClick() {
    this.edit.emit(this.note._id);
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      note: 'pi pi-file-o',
      meeting: 'pi pi-calendar',
      task: 'pi pi-check-square',
      idea: 'pi pi-bolt',
      project: 'pi pi-briefcase'
    };
    return map[type] || 'pi pi-file';
  }

  getExcerpt(limit: number): string {
    const content = this.note.summary || this.note.content || '';
    if (content.length <= limit) return content;
    return content.substring(0, limit) + '...';
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
    return (this.users() || []).filter(u => 
      u.name.toLowerCase().includes(term) || 
      u['email'].toLowerCase().includes(term)
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
console.log(this.note);
    this.noteService.shareNote(this.note._id, userIds, this.selectedPermission as 'viewer' | 'contributor' | 'admin'    ).subscribe({
      next: (res) => {
        // Update local note reference to reflect changes immediately
        this.note = res.data.note;
        this.isSharing = false;
        this.closeShareDialog();
        this.share.emit(this.note._id); // Notify parent
      },
      error: () => {
        this.isSharing = false;
        // Ideally show toast here
      }
    });
  }
}