import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy
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
  templateUrl: './note-card.component.html',
  styleUrls: ['./note-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  // --- Helper Methods for Template (Fixes Type Errors) ---

  /**
   * Safely gets the owner's name, handling cases where owner is just an ID string
   */
  getOwnerName(): string {
    if (!this.note.owner) return 'Unknown';
    if (typeof this.note.owner === 'string') return 'Unknown';
    return this.note.owner.name || 'Unknown';
  }

  /**
   * Safely gets a participant's name, handling cases where user is just an ID string
   */
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

// import {
//   Component,
//   Input,
//   Output,
//   EventEmitter,
//   computed,
//   inject,
//   OnInit,
//   ChangeDetectionStrategy
// } from '@angular/core';
// import { CommonModule, TitleCasePipe, DatePipe, SlicePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { NoteService } from '../../../core/services/notes.service';
// import { MasterListService } from '../../../core/services/master-list.service';
// import { Note, NoteType } from '../../../core/models/note.types'; 

// // Mock Interface for User (if not imported from models)
// export interface User {
//   _id: string;
//   name: string;
//   email: string;
//   avatar?: string;
// }

// @Component({
//   selector: 'app-note-card',
//   standalone: true,
//   imports: [CommonModule, FormsModule, TitleCasePipe, DatePipe, SlicePipe],
//   templateUrl: './note-card.component.html',
//   styleUrls: ['./note-card.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class NoteCardComponent implements OnInit {
//   private noteService = inject(NoteService);
//   private masterList = inject(MasterListService);

//   // --- Inputs ---
//   @Input({ required: true }) note!: Note;
//   @Input() viewMode: 'grid' | 'list' = 'grid';
//   @Input() availableUsers: any[] = [];

//   // --- Outputs ---
//   @Output() pin = new EventEmitter<string>();
//   @Output() edit = new EventEmitter<string>();
//   @Output() delete = new EventEmitter<string>();      // Soft delete
//   @Output() deleteHard = new EventEmitter<string>();  // Permanent delete
//   @Output() archive = new EventEmitter<string>();
//   @Output() restore = new EventEmitter<string>();
//   @Output() share = new EventEmitter<string>();
//   @Output() linkClick = new EventEmitter<string>();
//   @Output() convertToTask = new EventEmitter<string>();

//   // --- Signals & State ---
//   users = computed(() => this.masterList.users());
  
//   // Share Dialog State
//   showShareDialog = false;
//   userSearch = '';
//   selectedUserIds = new Set<string>();
//   selectedPermission: 'viewer' | 'contributor' | 'admin' = 'viewer';
//   isSharing = false;

//   ngOnInit(): void {
//     // If availableUsers weren't passed in, fallback to master list
//     if (!this.availableUsers || this.availableUsers.length === 0) {
//       this.availableUsers = this.users();
//     }
//   }

//   // --- Computed Properties ---

//   get isOverdue(): boolean {
//     if (!this.note.dueDate || this.note.status === 'completed') return false;
//     return new Date(this.note.dueDate) < new Date();
//   }

//   get meetingDateDisplay(): string | null {
//     if (this.note.noteType !== 'meeting' || !this.note.startDate) return null;
//     return new Date(this.note.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
//   }

//   get meetingTimeDisplay(): string | null {
//     if (this.note.noteType !== 'meeting' || !this.note.startDate) return null;
//     return new Date(this.note.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   }

//   get progress(): number | null {
//     if (!this.note.subtasks || this.note.subtasks.length === 0) return null;
//     const completed = this.note.subtasks.filter((t) => t.completed).length;
//     return Math.round((completed / this.note.subtasks.length) * 100);
//   }

//   // --- Methods ---

//   onCardClick() {
//     this.edit.emit(this.note._id);
//   }

//   getTypeIcon(type: NoteType): string {
//     const map: Record<string, string> = {
//       note: 'pi pi-file-o',
//       meeting: 'pi pi-calendar',
//       task: 'pi pi-check-square',
//       idea: 'pi pi-bolt',
//       project: 'pi pi-briefcase',
//       journal: 'pi pi-book'
//     };
//     return map[type] || 'pi pi-file';
//   }

//   getExcerpt(limit: number): string {
//     const content = this.note.summary || this.note.content || '';
//     if (content.length <= limit) return content;
//     return content.substring(0, limit) + '...';
//   }

//   getAvatarColor(name: string): string {
//     const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
//     let hash = 0;
//     for (let i = 0; i < name.length; i++) {
//       hash = name.charCodeAt(i) + ((hash << 5) - hash);
//     }
//     return colors[Math.abs(hash) % colors.length];
//   }

//   // --- Share Logic ---

//   openShareDialog() {
//     this.showShareDialog = true;
//     this.selectedUserIds.clear();
//     this.userSearch = '';
//   }

//   closeShareDialog() {
//     this.showShareDialog = false;
//   }

//   filteredUsers() {
//     const term = this.userSearch.toLowerCase();
//     return this.availableUsers.filter(u =>
//       u.name.toLowerCase().includes(term) ||
//       u.email.toLowerCase().includes(term)
//     );
//   }

//   toggleUserSelection(userId: string) {
//     if (this.selectedUserIds.has(userId)) {
//       this.selectedUserIds.delete(userId);
//     } else {
//       this.selectedUserIds.add(userId);
//     }
//   }

//   submitShare() {
//     if (this.selectedUserIds.size === 0) return;

//     this.isSharing = true;
//     const userIds = Array.from(this.selectedUserIds);
    
//     // Assuming shareNote returns an Observable with { data: { note: Note } }
//     this.noteService.shareNote(this.note._id, userIds, this.selectedPermission)
//       .subscribe({
//         next: (res: any) => {
//           this.note = res.data.note; // Optimistic update
//           this.isSharing = false;
//           this.closeShareDialog();
//           this.share.emit(this.note._id);
//         },
//         error: (err) => {
//           console.error('Failed to share note', err);
//           this.isSharing = false;
//         }
//       });
//   }
// }

// // import {
// //   Component,
// //   Input,
// //   Output,
// //   EventEmitter,
// //   computed,
// //   inject,
// //   signal,
// //   ViewChild,
// //   ElementRef,
// //   OnChanges,
// //   SimpleChanges
// // } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';

// // // Mock Interfaces to ensure compilation if models aren't strictly defined yet
// // export interface User {
// //   _id: string;
// //   name: string;
// //   email: string;
// //   avatar?: string;
// // }

// // // Assuming the Note interface matches your backend model
// // import { NoteService } from '../../../core/services/notes.service';
// // import { Note } from '../../../core/models/note.types';
// // import { MasterListService } from '../../../core/services/master-list.service';

// // @Component({
// //   selector: 'app-note-card',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule],
// //   template: `
// //     <!-- WRAPPER -->
// //     <div [class]="viewMode === 'list' ? 'note-item-list' : 'note-card-grid'"
// //          [class.is-pinned]="note.isPinned"
// //          [class.is-archived]="note.status === 'archived'"
// //          [class.is-deleted]="note.isDeleted"
// //          [class.priority-high]="note.priority === 'high'"
// //          [class.priority-urgent]="note.priority === 'urgent'"
// //          (click)="onCardClick()">

// //       <!-- ==================== VIEW MODE: GRID (CARD) ==================== -->
// //       <ng-container *ngIf="viewMode === 'grid'">
// //         <!-- Header: Type, Status, Pin -->
// //         <div class="card-header">
// //           <div class="badges">
// //             <span class="type-badge" [ngClass]="note.noteType">
// //               <i [class]="getTypeIcon(note.noteType)"></i>
// //               <span>{{ note.noteType | titlecase }}</span>
// //             </span>
            
// //             <span *ngIf="isOverdue" class="status-badge overdue">
// //               <i class="pi pi-exclamation-circle"></i> Due
// //             </span>
            
// //             <!-- Linked Notes Indicator (New) -->
// //             <span *ngIf="note.relatedNotes?.length" class="status-badge linked" title="Has linked notes">
// //                <i class="pi pi-link"></i> {{note.relatedNotes?.length}}
// //             </span>
// //           </div>

// //           <button class="action-btn pin-btn" 
// //                   [class.active]="note.isPinned"
// //                   (click)="$event.stopPropagation(); pin.emit(note._id)">
// //             <i class="pi pi-thumbtack" [style.transform]="note.isPinned ? 'rotate(-45deg)' : 'none'"></i>
// //           </button>
// //         </div>

// //         <!-- Body: Content -->
// //         <div class="card-body">
// //           <h3 class="note-title" [title]="note.title">
// //             {{ note.title || 'Untitled Note' }}
// //           </h3>
          
// //           <!-- Meeting Specifics -->
// //           <div *ngIf="note.noteType === 'meeting'" class="meeting-meta">
// //             <div class="meta-row highlight">
// //               <i class="pi pi-clock"></i> 
// //               <span>{{ meetingDateDisplay }}</span>
// //               <span class="separator">•</span>
// //               <span>{{ meetingTimeDisplay }}</span>
// //             </div>
// //             <div *ngIf="note.meetingDetails?.location" class="meta-row">
// //               <i class="pi pi-map-marker"></i> {{ note.meetingDetails?.location }}
// //             </div>
// //           </div>

// //           <!-- Content Excerpt -->
// //           <p class="note-excerpt">{{ getExcerpt(100) }}</p>

// //           <!-- Progress Bar (Dynamic) -->
// //           <div *ngIf="progress !== null" class="progress-container">
// //             <div class="progress-info">
// //               <span>Progress</span>
// //               <span class="progress-val">{{ progress }}%</span>
// //             </div>
// //             <div class="progress-track">
// //               <div class="progress-fill" 
// //                    [style.width.%]="progress"
// //                    [class.complete]="progress === 100"
// //                    [class.started]="progress! > 0 && progress! < 100"></div>
// //             </div>
// //           </div>

// //           <!-- Tags & Relations -->
// //           <div class="tags-row" *ngIf="note.tags?.length">
// //             <span *ngFor="let tag of note.tags | slice:0:3" class="tag">#{{ tag }}</span>
// //             <span *ngIf="note.tags && note.tags.length > 3" class="tag more">+{{ note.tags.length - 3 }}</span>
// //           </div>
// //         </div>

// //         <!-- Footer: Avatars & Actions -->
// //         <div class="card-footer">
// //           <div class="avatars">
// //              <!-- Owner Avatar -->
// //             <div class="avatar owner" [title]="'Owner: ' + (note.owner.name || 'Unknown')">
// //               {{ (note.owner.name.charAt(0) || 'U') | uppercase }}
// //             </div>
// //             <!-- Participants -->
// //             <ng-container *ngFor="let p of note.participants | slice:0:2">
// //                  <div class="avatar" [title]="p.user.name">
// //                    {{ (p.user.name.charAt(0) || '?') | uppercase }}
// //                  </div>
// //             </ng-container>
// //             <div *ngIf="note.participants && note.participants.length > 2" class="avatar counter">
// //               +{{ note.participants.length - 2 }}
// //             </div>
// //           </div>
          
// //           <div class="actions" (click)="$event.stopPropagation()">
// //             <ng-container *ngTemplateOutlet="actionButtons"></ng-container>
// //           </div>
// //         </div>
// //       </ng-container>

// //       <!-- ==================== VIEW MODE: LIST ==================== -->
// //       <ng-container *ngIf="viewMode === 'list'">
// //         <!-- Priority Strip -->
// //         <div class="list-strip" [ngClass]="note.priority || 'medium'"></div>
        
// //         <!-- Icon -->
// //         <div class="list-icon" [ngClass]="note.noteType">
// //           <i [class]="getTypeIcon(note.noteType)"></i>
// //         </div>

// //         <!-- Main Info -->
// //         <div class="list-main">
// //           <div class="list-header">
// //             <h3 class="list-title">{{ note.title || 'Untitled' }}</h3>
// //             <span *ngIf="note.isPinned" class="icon-indicator"><i class="pi pi-thumbtack"></i></span>
// //             <span *ngIf="isOverdue" class="list-badge overdue">Due</span>
// //             <span *ngIf="note.relatedNotes?.length" class="list-badge linked"><i class="pi pi-link"></i> {{note.relatedNotes?.length}}</span>
// //           </div>
// //           <p class="list-excerpt">{{ getExcerpt(80) }}</p>
// //         </div>

// //         <!-- Meta Columns (Desktop) -->
// //         <div class="list-meta desktop-only">
// //            <div class="meta-item">
// //             <i class="pi pi-calendar"></i> {{ note.updatedAt | date:'MMM d' }}
// //           </div>
// //           <div class="meta-item users" *ngIf="note.participants && note.participants.length">
// //              <i class="pi pi-users"></i> {{ note.participants.length }}
// //           </div>
// //           <div class="meta-item progress" *ngIf="progress !== null">
// //             <div class="mini-progress-circle" [style.--p]="progress"></div>
// //             <span>{{progress}}%</span>
// //           </div>
// //         </div>

// //         <!-- Actions -->
// //         <div class="list-actions" (click)="$event.stopPropagation()">
// //            <ng-container *ngTemplateOutlet="actionButtons"></ng-container>
// //         </div>
// //       </ng-container>

// //       <!-- ==================== SHARED TEMPLATES: ACTIONS ==================== -->
// //       <ng-template #actionButtons>
        
// //         <!-- Active Note Actions -->
// //         <ng-container *ngIf="!note.isDeleted && note.status !== 'archived'">
// //            <!-- Quick Convert to Task -->
// //            <button *ngIf="note.noteType === 'note'" class="action-btn" (click)="convertToTask.emit(note._id)" title="Convert to Task">
// //               <i class="pi pi-check-square"></i>
// //            </button>

// //            <button class="action-btn" (click)="$event.stopPropagation(); linkClick.emit(note._id)" title="Link Note">
// //               <i class="pi pi-link"></i>
// //            </button>
           
// //            <button class="action-btn" (click)="openShareDialog()" title="Share">
// //             <i class="pi pi-share-alt"></i>
// //           </button>

// //            <button class="action-btn" (click)="archive.emit(note._id)" title="Archive">
// //             <i class="pi pi-box"></i>
// //           </button>
          
// //           <button class="action-btn delete" (click)="delete.emit(note._id)" title="Delete">
// //             <i class="pi pi-trash"></i>
// //           </button>
// //         </ng-container>
        
// //         <!-- Trash/Archived Actions -->
// //         <ng-container *ngIf="note.isDeleted || note.status === 'archived'">
// //           <button class="action-btn restore" (click)="restore.emit(note._id)" title="Restore">
// //             <i class="pi pi-refresh"></i>
// //           </button>
// //           <button *ngIf="note.isDeleted" class="action-btn delete-hard" (click)="deleteHard.emit(note._id)" title="Permanently Delete">
// //             <i class="pi pi-times"></i>
// //           </button>
// //         </ng-container>
// //       </ng-template>

// //     </div>

// //     <!-- ==================== SHARE DIALOG OVERLAY ==================== -->
// //     <div *ngIf="showShareDialog" class="share-overlay" (click)="closeShareDialog()">
// //       <div class="share-dialog" (click)="$event.stopPropagation()">
// //         <div class="dialog-header">
// //           <div class="title-group">
// //             <i class="pi pi-share-alt"></i>
// //             <h4>Share Note</h4>
// //           </div>
// //           <button class="close-btn" (click)="closeShareDialog()">×</button>
// //         </div>
        
// //         <div class="dialog-body">
// //           <p class="dialog-subtitle">Invite users to collaborate on <strong>{{note.title}}</strong></p>
          
// //           <div class="search-box">
// //             <i class="pi pi-search"></i>
// //             <input type="text" placeholder="Search by name or email..." [(ngModel)]="userSearch">
// //           </div>

// //           <div class="user-list">
// //             <div *ngFor="let user of filteredUsers()" 
// //                  class="user-item" 
// //                  (click)="toggleUserSelection(user._id)"
// //                  [class.selected]="selectedUserIds.has(user._id)">
              
// //               <div class="user-info">
// //                 <div class="avatar-sm" [style.backgroundColor]="getAvatarColor(user.name)">
// //                   {{ user.name.charAt(0) | uppercase }}
// //                 </div>
// //                 <div class="details">
// //                   <span class="name">{{ user.name }}</span>
// //                   <span class="email">{{ user.email }}</span>
// //                 </div>
// //               </div>
              
// //               <div class="checkbox">
// //                 <div class="check-circle" [class.checked]="selectedUserIds.has(user._id)">
// //                   <i class="pi pi-check"></i>
// //                 </div>
// //               </div>
// //             </div>
            
// //             <div *ngIf="filteredUsers().length === 0" class="empty-state">
// //               <span>No users found</span>
// //             </div>
// //           </div>
// //         </div>

// //         <div class="dialog-footer">
// //           <div class="permissions-group">
// //             <label>Access Level</label>
// //             <div class="select-wrapper">
// //               <select [(ngModel)]="selectedPermission">
// //                 <option value="viewer">Viewer (Read Only)</option>
// //                 <option value="contributor">Contributor (Edit)</option>
// //                 <option value="admin">Admin (Full Access)</option>
// //               </select>
// //               <i class="pi pi-chevron-down"></i>
// //             </div>
// //           </div>
// //           <button class="btn-primary" 
// //                   [disabled]="selectedUserIds.size === 0 || isSharing"
// //                   (click)="submitShare()">
// //             <i class="pi pi-send" *ngIf="!isSharing"></i>
// //             <i class="pi pi-spin pi-spinner" *ngIf="isSharing"></i>
// //             <span>{{ isSharing ? 'Sending...' : 'Invite Users' }}</span>
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     /* ==================== VARIABLES & TOKENS ==================== */
// //     :host {
// //       display: block;
// //       /* CSS Variables from Service */
// //       --card-bg: var(--bg-secondary);
// //       --card-border: var(--border-secondary);
// //       --text-main: var(--text-primary);
// //       --text-sub: var(--text-secondary);
// //       --highlight: var(--accent-primary);
      
// //       /* Local Tokens */
// //       --card-radius: var(--ui-border-radius-lg);
// //       --btn-hover-bg: var(--bg-ternary);
// //     }

// //     /* ==================== GRID VIEW ==================== */
// //     .note-card-grid {
// //       background: var(--card-bg);
// //       border: 1px solid var(--card-border);
// //       border-radius: var(--card-radius);
// //       padding: var(--spacing-lg);
// //       display: flex;
// //       flex-direction: column;
// //       gap: var(--spacing-md);
// //       transition: all 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
// //       cursor: pointer;
// //       position: relative;
// //       height: 100%;
// //       min-height: 220px;
// //       box-shadow: var(--shadow-sm);
// //       overflow: hidden;

// //       &:hover {
// //         transform: translateY(-3px);
// //         box-shadow: var(--shadow-lg);
// //         border-color: var(--border-primary);
        
// //         .action-btn { opacity: 1; transform: translateY(0); }
// //       }

// //       &.is-pinned { 
// //         border-top: 3px solid var(--accent-secondary); 
// //         background: linear-gradient(to bottom, color-mix(in srgb, var(--accent-secondary) 5%, var(--bg-secondary)), var(--bg-secondary));
// //       }
      
// //       &.priority-high { border-left: 3px solid var(--color-warning); }
// //       &.priority-urgent { border-left: 3px solid var(--color-error); }
      
// //       &.is-deleted, &.is-archived {
// //         opacity: 0.8;
// //         background: var(--bg-ternary);
// //         border-style: dashed;
// //         .note-title, .note-excerpt { color: var(--text-tertiary); }
// //       }
// //     }

// //     .card-header {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: flex-start;
// //       margin-bottom: var(--spacing-xs);
// //     }

// //     .badges { 
// //       display: flex; 
// //       gap: var(--spacing-sm); 
// //       flex-wrap: wrap;
// //     }

// //     .type-badge {
// //       display: inline-flex;
// //       align-items: center;
// //       gap: 6px;
// //       font-size: 11px;
// //       font-weight: 600;
// //       padding: 4px 8px;
// //       border-radius: var(--ui-border-radius);
// //       background: var(--bg-ternary);
// //       color: var(--text-secondary);
// //       text-transform: uppercase;
// //       letter-spacing: 0.5px;

// //       &.meeting { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
// //       &.task { background: rgba(16, 185, 129, 0.1); color: #10b981; }
// //       &.idea { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
// //       &.project { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
// //     }

// //     .status-badge {
// //       font-size: 10px;
// //       font-weight: 700;
// //       padding: 4px 8px;
// //       border-radius: var(--ui-border-radius);
// //       display: inline-flex;
// //       align-items: center;
// //       gap: 4px;
      
// //       &.overdue { background: var(--color-error-bg); color: var(--color-error); }
// //       &.linked { background: var(--accent-tertiary); color: var(--accent-primary); }
// //     }

// //     .card-body {
// //       flex: 1;
// //       display: flex;
// //       flex-direction: column;
// //       gap: var(--spacing-sm);

// //       .note-title {
// //         font-family: var(--font-heading);
// //         font-size: var(--font-size-md);
// //         font-weight: 600;
// //         color: var(--text-main);
// //         margin: 0;
// //         line-height: 1.3;
// //         display: -webkit-box;
// //         -webkit-line-clamp: 2;
// //         -webkit-box-orient: vertical;
// //         overflow: hidden;
// //       }

// //       .note-excerpt {
// //         font-family: var(--font-body);
// //         font-size: var(--font-size-sm);
// //         color: var(--text-sub);
// //         line-height: 1.5;
// //         margin: 0;
// //         opacity: 0.9;
// //       }
// //     }

// //     .meeting-meta {
// //       font-size: var(--font-size-xs);
// //       color: var(--text-tertiary);
// //       background: var(--bg-ternary);
// //       padding: 8px;
// //       border-radius: var(--ui-border-radius);
// //       display: flex;
// //       flex-direction: column;
// //       gap: 4px;
      
// //       .meta-row { 
// //         display: flex; 
// //         align-items: center; 
// //         gap: 6px; 
// //         &.highlight { color: var(--text-secondary); font-weight: 500; }
// //         .separator { opacity: 0.5; }
// //       }
// //     }

// //     .progress-container {
// //       margin-top: auto;
// //       padding-top: var(--spacing-sm);
      
// //       .progress-info {
// //         display: flex; 
// //         justify-content: space-between; 
// //         font-size: 10px;
// //         font-weight: 600;
// //         text-transform: uppercase;
// //         color: var(--text-tertiary);
// //         margin-bottom: 4px;
// //       }
// //       .progress-track {
// //         height: 6px;
// //         background: var(--bg-ternary);
// //         border-radius: 3px;
// //         overflow: hidden;
// //       }
// //       .progress-fill {
// //         height: 100%;
// //         background: var(--text-tertiary);
// //         transition: width 0.3s ease;
        
// //         &.started { background: var(--color-warning); }
// //         &.complete { background: var(--color-success); }
// //       }
// //     }

// //     .tags-row {
// //       display: flex;
// //       flex-wrap: wrap;
// //       gap: 6px;
// //       margin-top: 4px;
      
// //       .tag {
// //         font-size: 10px;
// //         font-family: var(--font-mono);
// //         padding: 2px 6px;
// //         background: var(--bg-ternary);
// //         border-radius: 4px;
// //         color: var(--text-secondary);
// //         border: 1px solid transparent;
// //         transition: all 0.2s;
        
// //         &:hover { border-color: var(--border-primary); color: var(--text-main); }
// //         &.more { background: transparent; color: var(--text-tertiary); }
// //       }
// //     }

// //     .card-footer {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       padding-top: var(--spacing-md);
// //       border-top: 1px solid var(--border-secondary);
// //       min-height: 40px;

// //       .avatars {
// //         display: flex;
// //         padding-left: 8px;
        
// //         .avatar {
// //           width: 26px;
// //           height: 26px;
// //           border-radius: 50%;
// //           background: var(--bg-ternary);
// //           color: var(--text-secondary);
// //           font-size: 10px;
// //           font-weight: 600;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           border: 2px solid var(--card-bg);
// //           margin-left: -10px;
// //           position: relative;
          
// //           &.owner { z-index: 5; background: var(--accent-primary); color: white; }
// //           &.counter { background: var(--bg-ternary); color: var(--text-sub); font-size: 9px; }
// //         }
// //       }

// //       .actions {
// //         display: flex;
// //         gap: 2px;
// //       }
// //     }

// //     /* ==================== LIST VIEW ==================== */
// //     .note-item-list {
// //       display: flex;
// //       align-items: center;
// //       padding: var(--spacing-sm) var(--spacing-md);
// //       background: var(--card-bg);
// //       border-bottom: 1px solid var(--border-secondary);
// //       gap: var(--spacing-md);
// //       cursor: pointer;
// //       transition: background-color 0.15s ease;
// //       position: relative;
// //       overflow: hidden;

// //       &:hover {
// //         background: var(--bg-hover);
// //         .list-title { color: var(--accent-primary); }
// //         .action-btn { opacity: 1; }
// //       }

// //       .list-strip {
// //         position: absolute;
// //         left: 0; top: 0; bottom: 0;
// //         width: 4px;
// //         background: transparent;
// //         &.high { background: var(--color-warning); }
// //         &.urgent { background: var(--color-error); }
// //       }

// //       .list-icon {
// //         width: 36px;
// //         height: 36px;
// //         border-radius: 8px;
// //         background: var(--bg-ternary);
// //         display: flex;
// //         align-items: center;
// //         justify-content: center;
// //         color: var(--text-sub);
// //         flex-shrink: 0;
// //         font-size: 1.1rem;
        
// //         &.meeting { color: #3b82f6; background: rgba(59,130,246,0.1); }
// //         &.task { color: #10b981; background: rgba(16,185,129,0.1); }
// //       }

// //       .list-main {
// //         flex: 1;
// //         min-width: 0;
        
// //         .list-header { 
// //           display: flex; 
// //           align-items: center; 
// //           gap: 8px; 
// //           margin-bottom: 2px;
// //         }
        
// //         .list-title {
// //           font-family: var(--font-body);
// //           font-size: var(--font-size-md);
// //           font-weight: 500;
// //           color: var(--text-main);
// //           white-space: nowrap;
// //           overflow: hidden;
// //           text-overflow: ellipsis;
// //           margin: 0;
// //         }
        
// //         .icon-indicator { color: var(--accent-secondary); font-size: 0.8rem; transform: rotate(-45deg); }

// //         .list-excerpt {
// //           font-size: var(--font-size-sm);
// //           color: var(--text-tertiary);
// //           white-space: nowrap;
// //           overflow: hidden;
// //           text-overflow: ellipsis;
// //           margin: 0;
// //         }
// //       }
      
// //       .list-badge {
// //          font-size: 9px;
// //          padding: 1px 5px;
// //          border-radius: 3px;
// //          font-weight: 600;
// //          text-transform: uppercase;
// //          &.overdue { background: var(--color-error-bg); color: var(--color-error); }
// //          &.linked { background: var(--bg-ternary); color: var(--text-secondary); display: flex; align-items: center; gap: 3px; }
// //       }

// //       .list-meta {
// //         font-size: var(--font-size-xs);
// //         color: var(--text-tertiary);
// //         display: flex;
// //         gap: 20px;
// //         flex-shrink: 0;
// //         align-items: center;
        
// //         .meta-item { display: flex; align-items: center; gap: 6px; width: 60px;}
// //         .meta-item.users { width: 40px; }
// //       }
      
// //       .desktop-only {
// //         @media (max-width: 768px) { display: none; }
// //       }
// //     }

// //     /* ==================== BUTTONS ==================== */
// //     .action-btn {
// //       background: transparent;
// //       border: none;
// //       width: 32px;
// //       height: 32px;
// //       border-radius: var(--ui-border-radius);
// //       color: var(--text-sub);
// //       cursor: pointer;
// //       display: flex;
// //       align-items: center;
// //       justify-content: center;
// //       font-size: 14px;
// //       transition: all 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
// //       opacity: 0; /* Hidden by default until hover */
// //       transform: translateY(2px);

// //       &:hover { background: var(--btn-hover-bg); color: var(--text-main); transform: translateY(0); }
// //       &.active { color: var(--accent-primary); opacity: 1; transform: translateY(0); }
      
// //       &.delete:hover { background: var(--color-error-bg); color: var(--color-error); }
// //       &.delete-hard:hover { background: #fee2e2; color: #dc2626; }
// //       &.restore:hover { background: #dcfce7; color: #16a34a; }
// //     }
    
// //     .list-actions .action-btn { opacity: 0; }
// //     .note-item-list:hover .list-actions .action-btn { opacity: 1; }

// //     /* ==================== SHARE DIALOG ==================== */
// //     .share-overlay {
// //       position: fixed;
// //       top: 0; left: 0; width: 100vw; height: 100vh;
// //       background: rgba(0,0,0,0.5);
// //       z-index: 9999;
// //       display: flex;
// //       align-items: center;
// //       justify-content: center;
// //       backdrop-filter: blur(4px);
// //       animation: fadeIn 0.2s ease-out;
// //     }

// //     .share-dialog {
// //       width: 100%;
// //       max-width: 420px;
// //       background: var(--bg-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       box-shadow: var(--shadow-2xl);
// //       border: 1px solid var(--border-primary);
// //       overflow: hidden;
// //       animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      
// //       .dialog-header {
// //         padding: var(--spacing-lg) var(--spacing-xl);
// //         border-bottom: 1px solid var(--border-secondary);
// //         display: flex;
// //         justify-content: space-between;
// //         align-items: center;
// //         background: var(--bg-secondary);
        
// //         .title-group {
// //            display: flex; align-items: center; gap: 10px;
// //            i { font-size: 1.2rem; color: var(--accent-primary); }
// //            h4 { margin: 0; font-size: var(--font-size-lg); font-weight: 600; color: var(--text-main); }
// //         }
        
// //         .close-btn { 
// //           background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-sub); 
// //           line-height: 1; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
// //           border-radius: 50%; transition: background 0.2s;
// //           &:hover { background: var(--bg-ternary); color: var(--text-main); }
// //         }
// //       }

// //       .dialog-body {
// //         padding: var(--spacing-xl);
        
// //         .dialog-subtitle { margin: 0 0 16px 0; color: var(--text-secondary); font-size: var(--font-size-sm); }
        
// //         .search-box {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //           background: var(--bg-secondary);
// //           padding: 10px 14px;
// //           border-radius: var(--ui-border-radius-lg);
// //           border: 1px solid var(--border-secondary);
// //           margin-bottom: 16px;
// //           transition: border-color 0.2s;
          
// //           &:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-focus); }
// //           i { color: var(--text-tertiary); }
          
// //           input {
// //             border: none;
// //             background: transparent;
// //             width: 100%;
// //             outline: none;
// //             font-size: var(--font-size-md);
// //             color: var(--text-main);
// //             &::placeholder { color: var(--text-tertiary); }
// //           }
// //         }

// //         .user-list {
// //           max-height: 240px;
// //           overflow-y: auto;
// //           display: flex;
// //           flex-direction: column;
// //           gap: 6px;
// //           padding-right: 4px;
          
// //           /* Scrollbar styling */
// //           &::-webkit-scrollbar { width: 6px; }
// //           &::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 3px; }
// //         }

// //         .user-item {
// //           display: flex;
// //           justify-content: space-between;
// //           align-items: center;
// //           padding: 8px 10px;
// //           border-radius: var(--ui-border-radius);
// //           cursor: pointer;
// //           transition: background 0.15s;
// //           border: 1px solid transparent;
          
// //           &:hover { background: var(--bg-hover); }
// //           &.selected { 
// //             background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-primary)); 
// //             border-color: var(--accent-focus); 
// //           }

// //           .user-info {
// //             display: flex;
// //             align-items: center;
// //             gap: 12px;
            
// //             .avatar-sm {
// //               width: 32px; height: 32px;
// //               color: white;
// //               border-radius: 50%;
// //               display: flex; align-items: center; justify-content: center;
// //               font-size: 12px; font-weight: 600;
// //               box-shadow: var(--shadow-sm);
// //             }
// //             .details {
// //               display: flex; flex-direction: column;
// //               .name { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-main); }
// //               .email { font-size: 11px; color: var(--text-tertiary); }
// //             }
// //           }
          
// //           .check-circle {
// //              width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-secondary);
// //              display: flex; align-items: center; justify-content: center; color: transparent;
// //              transition: all 0.2s;
// //              &.checked { background: var(--accent-primary); border-color: var(--accent-primary); color: white; font-size: 10px; }
// //           }
// //         }
        
// //         .empty-state { text-align: center; color: var(--text-tertiary); font-style: italic; padding: 20px; font-size: 13px; }
// //       }

// //       .dialog-footer {
// //         padding: var(--spacing-lg) var(--spacing-xl);
// //         background: var(--bg-secondary);
// //         border-top: 1px solid var(--border-secondary);
// //         display: flex;
// //         justify-content: space-between;
// //         align-items: center;

// //         .permissions-group {
// //            display: flex; flex-direction: column; gap: 4px;
// //            label { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; }
           
// //            .select-wrapper {
// //              position: relative;
// //              display: flex; align-items: center;
             
// //              select {
// //                appearance: none;
// //                background: var(--bg-primary);
// //                border: 1px solid var(--border-secondary);
// //                padding: 6px 28px 6px 10px;
// //                border-radius: var(--ui-border-radius);
// //                font-size: var(--font-size-sm);
// //                color: var(--text-main);
// //                cursor: pointer;
// //                &:focus { border-color: var(--accent-primary); outline: none; }
// //              }
// //              i { position: absolute; right: 8px; font-size: 10px; pointer-events: none; color: var(--text-secondary); }
// //            }
// //         }

// //         .btn-primary {
// //           background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
// //           color: white;
// //           border: none;
// //           padding: 10px 24px;
// //           border-radius: var(--ui-border-radius);
// //           font-size: var(--font-size-sm);
// //           font-weight: 600;
// //           cursor: pointer;
// //           display: flex; align-items: center; gap: 8px;
// //           box-shadow: var(--shadow-md);
// //           transition: all 0.2s;
          
// //           &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
// //           &:active:not(:disabled) { transform: translateY(0); }
// //           &:disabled { opacity: 0.6; cursor: not-allowed; filter: grayscale(1); box-shadow: none; }
// //         }
// //       }
// //     }

// //     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// //     @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
// //   `]
// // })
// // export class NoteCardComponent {
// //   private noteService = inject(NoteService);

// //   @Input({ required: true }) note!: Note;
// //   @Input() viewMode: 'grid' | 'list' = 'grid';
// //   @Input() availableUsers: any[] = []; // Input for share dialog users
// //   private masterList = inject(MasterListService);

// //   @Output() pin = new EventEmitter<string>();
// //   @Output() edit = new EventEmitter<string>();
// //   @Output() delete = new EventEmitter<string>(); // Soft delete
// //   @Output() deleteHard = new EventEmitter<string>(); // Permanent delete
// //   @Output() archive = new EventEmitter<string>();
// //   @Output() restore = new EventEmitter<string>();
// //   @Output() share = new EventEmitter<string>();
// //   @Output() linkClick = new EventEmitter<string>();
// //   @Output() convertToTask = new EventEmitter<string>();
// //   users = computed(() => this.masterList.users());

// //   // Share Dialog State
// //   showShareDialog = false;
// //   userSearch = '';
// //   selectedUserIds = new Set<string>();
// //   selectedPermission = 'viewer';
// //   isSharing = false;

// //   // --- Computed Properties ---

// //   get isOverdue(): boolean {
// //     if (!this.note.dueDate || this.note.status === 'completed') return false;
// //     return new Date(this.note.dueDate) < new Date();
// //   }

// //   get meetingDateDisplay(): string | null {
// //     if (this.note.noteType !== 'meeting' || !this.note.startDate) return null;
// //     return new Date(this.note.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
// //   }

// //   get meetingTimeDisplay(): string | null {
// //     if (this.note.noteType !== 'meeting' || !this.note.startDate) return null;
// //     return new Date(this.note.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// //   }

// //   get progress(): number | null {
// //     if (!this.note.subtasks || this.note.subtasks.length === 0) return null;
// //     const completed = this.note.subtasks.filter((t:any) => t.completed).length;
// //     return Math.round((completed / this.note.subtasks.length) * 100);
// //   }

// //   // --- Methods ---
// // ngOnInit(): void {
// //   //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
// //   //Add 'implements OnInit' to the class.
// //   this.availableUsers=this.users()
// // }

// //   onCardClick() {
// //     this.edit.emit(this.note._id);
// //   }

// //   getTypeIcon(type: string): string {
// //     const map: Record<string, string> = {
// //       note: 'pi pi-file-o',
// //       meeting: 'pi pi-calendar',
// //       task: 'pi pi-check-square',
// //       idea: 'pi pi-bolt',
// //       project: 'pi pi-briefcase',
// //       journal: 'pi pi-book'
// //     };
// //     return map[type] || 'pi pi-file';
// //   }

// //   getExcerpt(limit: number): string {
// //     const content = this.note.summary || this.note.content || '';
// //     if (content.length <= limit) return content;
// //     return content.substring(0, limit) + '...';
// //   }

// //   getAvatarColor(name: string): string {
// //     const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
// //     let hash = 0;
// //     for (let i = 0; i < name.length; i++) {
// //       hash = name.charCodeAt(i) + ((hash << 5) - hash);
// //     }
// //     return colors[Math.abs(hash) % colors.length];
// //   }

// //   // --- Share Logic ---

// //   openShareDialog() {
// //     this.showShareDialog = true;
// //     this.selectedUserIds.clear();
// //     this.userSearch = '';
// //   }

// //   closeShareDialog() {
// //     this.showShareDialog = false;
// //   }

// //   filteredUsers() {
// //     const term = this.userSearch.toLowerCase();
// //     return this.availableUsers.filter(u =>
// //       u.name.toLowerCase().includes(term) ||
// //       u.email.toLowerCase().includes(term)
// //     );
// //   }

// //   toggleUserSelection(userId: string) {
// //     if (this.selectedUserIds.has(userId)) {
// //       this.selectedUserIds.delete(userId);
// //     } else {
// //       this.selectedUserIds.add(userId);
// //     }
// //   }

// //   submitShare() {
// //     if (this.selectedUserIds.size === 0) return;

// //     this.isSharing = true;
// //     const userIds = Array.from(this.selectedUserIds);
    
// //     this.noteService.shareNote(this.note._id, userIds, this.selectedPermission as any).subscribe({
// //       next: (res) => {
// //         this.note = res.data.note; // Optimistic update
// //         this.isSharing = false;
// //         this.closeShareDialog();
// //         this.share.emit(this.note._id);
// //       },
// //       error: () => {
// //         this.isSharing = false;
// //       }
// //     });
// //   }
// // }
