import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-note-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="viewMode === 'list' ? 'shared-card-list' : 'shared-card-grid'"
         (click)="onClick()">
      
      <!-- ==================== GRID VIEW ==================== -->
      @if (viewMode === 'grid') {
        <div class="card-header">
          <div class="badges">
            <span class="type-badge" [ngClass]="note.noteType">
              <i [class]="getTypeIcon(note.noteType)"></i>
              <span>{{ note.noteType | titlecase }}</span>
            </span>
            <span class="share-badge" [class.by-me]="filterType === 'shared-by-me'">
              @if (filterType === 'shared-by-me') {
                <i class="pi pi-share-alt"></i> Shared by you
              } @else {
                <i class="pi pi-users"></i> Shared with you
              }
            </span>
          </div>
        </div>

        <div class="card-body">
          <h3 class="note-title">{{ note.title || 'Untitled' }}</h3>
          
          <div class="share-info">
            @if (filterType === 'shared-by-me') {
              <span class="label">Shared with:</span>
              <div class="avatars-row">
                @for (user of getSharedWithUsers() | slice:0:3; track user._id) {
                  <div class="avatar" [title]="user.name || user.email">
                    {{ (user.name?.charAt(0) || user.email?.charAt(0) || '?') | uppercase }}
                  </div>
                }
                @if (getSharedWithUsers().length > 3) {
                  <div class="avatar counter">+{{ getSharedWithUsers().length - 3 }}</div>
                }
                @if (getSharedWithUsers().length === 0) {
                  <span class="empty-text">No one yet</span>
                }
              </div>
            } @else {
              <!-- Shared WITH me (Show Owner) -->
              <span class="label">Owner:</span>
              <div class="owner-row">
                <div class="avatar owner">
                  {{ (getOwnerName().charAt(0) || '?') | uppercase }}
                </div>
                <span class="owner-name">{{ getOwnerName() }}</span>
              </div>
            }
          </div>

          <p class="excerpt" [innerHTML]="getExcerpt()"></p>
        </div>

        <div class="card-footer">
          <span class="date">{{ note.updatedAt | date:'mediumDate' }}</span>
          <div class="actions">
             <button class="btn-icon" (click)="$event.stopPropagation(); action.emit('view')">
                <i class="pi pi-eye"></i>
             </button>
             @if (filterType === 'shared-by-me') {
                <button class="btn-icon danger" (click)="$event.stopPropagation(); action.emit('unshare')">
                  <i class="pi pi-user-minus"></i>
                </button>
             }
          </div>
        </div>
      }

      <!-- ==================== LIST VIEW ==================== -->
      @if (viewMode === 'list') {
         <div class="list-icon" [ngClass]="note.noteType">
            <i [class]="getTypeIcon(note.noteType)"></i>
         </div>
         <div class="list-content">
            <h4 class="list-title">{{ note.title || 'Untitled' }}</h4>
            <div class="list-meta">
               @if (filterType === 'shared-by-me') {
                  <span>Shared with {{ getSharedWithUsers().length }} people</span>
               } @else {
                  <span>Owner: {{ getOwnerName() }}</span>
               }
               <span class="dot">•</span>
               <span>{{ note.updatedAt | date:'MMM d' }}</span>
            </div>
         </div>
         <div class="list-actions">
            <button class="btn-icon" (click)="$event.stopPropagation(); action.emit('view')">
              <i class="pi pi-arrow-right"></i>
            </button>
         </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    
    .shared-card-grid {
      background: var(--bg-secondary);
      border: 1px solid var(--border-secondary);
      border-radius: 12px;
      padding: 16px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--accent-primary); }
    }

    .card-header {
      display: flex; justify-content: space-between;
      .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    }

    .type-badge {
      font-size: 10px; padding: 2px 6px; border-radius: 4px; background: var(--bg-ternary); color: var(--text-secondary); text-transform: uppercase; font-weight: 700; display: flex; align-items: center; gap: 4px;
    }
    
    .share-badge {
      font-size: 10px; padding: 2px 8px; border-radius: 10px; background: #eff6ff; color: #3b82f6; font-weight: 600; display: flex; align-items: center; gap: 4px;
      &.by-me { background: #f0fdf4; color: #16a34a; }
    }

    .card-body {
      flex: 1; display: flex; flex-direction: column; gap: 10px;
      .note-title { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
      
      .share-info {
        background: var(--bg-ternary); padding: 8px; border-radius: 8px;
        .label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px; }
      }
      
      .excerpt { font-size: 13px; color: var(--text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; opacity: 0.8; }
    }

    /* Avatars */
    .avatars-row { display: flex; align-items: center; }
    .owner-row { display: flex; align-items: center; gap: 8px; }
    .avatar {
      width: 24px; height: 24px; border-radius: 50%; background: var(--accent-secondary); color: white; font-size: 10px; font-weight: 700; display: grid; place-items: center; border: 2px solid var(--bg-secondary); margin-left: -8px;
      &:first-child { margin-left: 0; }
      &.counter { background: var(--bg-ternary); color: var(--text-secondary); font-size: 9px; }
      &.owner { background: var(--accent-primary); margin: 0; }
    }
    .owner-name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
    .empty-text { font-size: 11px; color: var(--text-tertiary); font-style: italic; }

    .card-footer {
      display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-secondary); padding-top: 10px; margin-top: auto;
      .date { font-size: 11px; color: var(--text-tertiary); }
      .actions { display: flex; gap: 4px; }
    }

    .btn-icon {
      background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 4px; transition: 0.2s;
      &:hover { background: var(--bg-ternary); color: var(--text-primary); }
      &.danger:hover { background: #fee2e2; color: #ef4444; }
    }

    /* LIST VIEW */
    .shared-card-list {
      display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-secondary); cursor: pointer;
      &:hover { background: var(--bg-ternary); }
      
      .list-icon { width: 32px; height: 32px; background: var(--bg-ternary); border-radius: 6px; display: grid; place-items: center; color: var(--text-secondary); }
      .list-content { flex: 1; }
      .list-title { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: var(--text-primary); }
      .list-meta { font-size: 11px; color: var(--text-tertiary); display: flex; gap: 8px; }
    }
  `]
})
export class SharedNoteCardComponent {
  @Input({ required: true }) note!: any; // Using 'any' to handle the loose types from aggregations
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() filterType: 'shared' | 'shared-by-me' = 'shared';
  
  @Output() action = new EventEmitter<string>();

  onClick() {
    this.action.emit('view');
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      note: 'pi pi-file',
      task: 'pi pi-check-square',
      meeting: 'pi pi-calendar',
      idea: 'pi pi-bolt'
    };
    return map[type] || 'pi pi-file';
  }

  getExcerpt(): string {
    // Basic HTML strip for excerpt
    const content = this.note.summary || this.note.content || '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = content;
    const text = tmp.textContent || tmp.innerText || "";
    return text.substring(0, 80) + (text.length > 80 ? '...' : '');
  }

  // --- Helpers for Data Consistency ---

  getSharedWithUsers(): any[] {
    // In 'shared-by-me', sharedWith is populated as Object array
    if (Array.isArray(this.note.sharedWith) && typeof this.note.sharedWith[0] === 'object') {
      return this.note.sharedWith;
    }
    return [];
  }

  getOwnerName(): string {
    // In 'shared-with-me', owner is populated as Object
    if (this.note.owner && typeof this.note.owner === 'object') {
      return this.note.owner.name || this.note.owner.email || 'Unknown';
    }
    return 'Unknown';
  }
}