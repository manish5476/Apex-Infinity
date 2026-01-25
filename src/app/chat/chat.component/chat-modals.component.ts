import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from './chat.models';
import { MasterListService } from '../../core/services/master-list.service';

@Component({
  selector: 'app-chat-modals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (showCreateModal) {
    <div class="modal-backdrop" (click)="closeCreateModal.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h3>Create new channel</h3>
          <button class="btn-close" (click)="closeCreateModal.emit()"><i class="pi pi-times"></i></button>
        </header>
        
        <div class="modal-body">
          <div class="form-field">
            <label>Name</label>
            <div class="input-addon">
              <span class="addon">#</span>
              <input type="text" [(ngModel)]="newChannelName" placeholder="e.g. marketing-updates" />
            </div>
          </div>
          
          <div class="form-field">
            <label>Visibility</label>
            <div class="radio-grid">
              <label class="radio-card" [class.active]="channelType === 'public'">
                <input type="radio" name="type" [(ngModel)]="channelType" value="public" />
                <div class="radio-content">
                  <i class="pi pi-hashtag"></i>
                  <div class="text">
                    <strong>Public</strong>
                    <span>Anyone in organization</span>
                  </div>
                </div>
              </label>
              <label class="radio-card" [class.active]="channelType === 'private'">
                <input type="radio" name="type" [(ngModel)]="channelType" value="private" />
                <div class="radio-content">
                  <i class="pi pi-lock"></i>
                  <div class="text">
                    <strong>Private</strong>
                    <span>Invited members only</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          @if (channelType === 'private') {
          <div class="form-field">
            <label>Add Initial Members</label>
            <div class="selector-list">
              @for (user of masterList.users(); track user._id) {
                @if (user._id !== currentUserId) {
                <label class="selector-item" [class.selected]="selectedMembers.has(user._id)">
                  <input type="checkbox" (change)="toggleMemberSelection.emit(user._id)" [checked]="selectedMembers.has(user._id)" />
                  <div class="user-avatar">{{ getInitials(user._id) }}</div>
                  <span class="user-name">{{ getUserName(user._id) }}</span>
                  <i class="pi pi-check-circle check-icon"></i>
                </label>
                }
              }
            </div>
          </div>
          }
        </div>
        
        <footer class="modal-footer">
          <button class="btn-secondary" (click)="closeCreateModal.emit()">Cancel</button>
          <button class="btn-primary" (click)="submitCreateChannel.emit()" [disabled]="!newChannelName.trim()">
            Create Channel
          </button>
        </footer>
      </div>
    </div>
    }

    @if (showChannelSettings) {
    <div class="modal-backdrop" (click)="closeChannelSettings.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="header-title">
            <h3>{{ activeChannel?.name }}</h3>
            <span class="badge-type">{{ activeChannel?.type }}</span>
          </div>
          <button class="btn-close" (click)="closeChannelSettings.emit()"><i class="pi pi-times"></i></button>
        </header>
        
        <div class="modal-body">
          <div class="section-title">Members — {{ activeChannelUsers.length }}</div>
          <div class="members-display-list">
            @for (userId of activeChannelUsers; track userId) {
            <div class="member-row">
              <div class="user-avatar" [class.online]="isUserOnline(userId)">{{ getInitials(userId) }}</div>
              <div class="member-info">
                <span class="name">{{ getUserName(userId) }}</span>
                @if (userId === currentUserId) { <span class="tag">You</span> }
              </div>
              @if (isUserOnline(userId)) { <span class="status-indicator">Active now</span> }
            </div>
            }
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); 
      backdrop-filter: blur(8px); z-index: var(--z-modal);
      display: grid; place-items: center; padding: var(--spacing-xl);
    }

    .modal-card {
      background: var(--bg-surface); width: 100%; max-width: 500px;
      border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-6xl);
      display: flex; flex-direction: column; overflow: hidden;
      animation: var(--transition-base) modalIn;
    }

    .modal-header {
      padding: var(--spacing-xl); border-bottom: 1px solid var(--border-subtle);
      display: flex; justify-content: space-between; align-items: center;
      h3 { font-family: var(--font-heading); margin: 0; font-size: var(--font-size-xl); }
    }

    .modal-body { padding: var(--spacing-xl); overflow-y: auto; max-height: 60vh; }

    .modal-footer {
      padding: var(--spacing-lg) var(--spacing-xl); background: var(--color-gray-50);
      border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: var(--spacing-md);
    }

    /* --- Form Elements --- */
    .form-field {
      margin-bottom: var(--spacing-xl);
      label { display: block; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-sm); color: var(--text-secondary); }
    }

    .input-addon {
      display: flex; background: var(--color-gray-50); border: 1px solid var(--border-subtle); border-radius: var(--ui-border-radius);
      &:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--focus-ring-color); }
      .addon { padding: 0 var(--spacing-md); display: grid; place-items: center; color: var(--text-muted); border-right: 1px solid var(--border-subtle); }
      input { flex: 1; background: transparent; border: none; padding: var(--spacing-md); outline: none; }
    }

    /* --- Radio Cards --- */
    .radio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .radio-card {
      border: 1px solid var(--border-subtle); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-md); cursor: pointer; transition: 0.2s;
      input { display: none; }
      &.active { border-color: var(--color-primary); background: var(--color-primary-subtle); }
      .radio-content { display: flex; align-items: flex-start; gap: var(--spacing-md); i { font-size: 1.2rem; color: var(--color-primary); } }
      .text { strong { display: block; font-size: var(--font-size-base); } span { font-size: var(--font-size-xs); color: var(--text-muted); } }
    }

    /* --- Member Selection --- */
    .selector-list { border: 1px solid var(--border-subtle); border-radius: var(--ui-border-radius); overflow: hidden; }
    .selector-item {
      display: flex; align-items: center; padding: var(--spacing-md); gap: var(--spacing-md); cursor: pointer; border-bottom: 1px solid var(--border-subtle);
      input { display: none; }
      &:last-child { border-bottom: none; }
      &:hover { background: var(--color-gray-50); }
      &.selected { background: var(--color-primary-subtle); .check-icon { opacity: 1; } }
      .user-avatar { width: 32px; height: 32px; background: var(--color-gray-200); border-radius: 4px; display: grid; place-items: center; font-size: 10px; font-weight: bold; }
      .user-name { flex: 1; font-size: var(--font-size-sm); }
      .check-icon { color: var(--color-primary); opacity: 0; transition: 0.2s; }
    }

    /* --- Member Display List --- */
    .member-row {
      display: flex; align-items: center; padding: var(--spacing-md) 0; gap: var(--spacing-md); border-bottom: 1px solid var(--border-subtle);
      .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-gray-100); display: grid; place-items: center; position: relative;
        &.online::after { content: ''; position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid white; border-radius: 50%; }
      }
      .member-info { flex: 1; display: flex; align-items: center; gap: var(--spacing-sm); .name { font-weight: 500; } .tag { background: var(--color-gray-200); font-size: 10px; padding: 2px 4px; border-radius: 4px; } }
      .status-indicator { font-size: var(--font-size-xs); color: #10b981; }
    }

    .btn-primary { background: var(--color-primary); color: white; border: none; padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--ui-border-radius); cursor: pointer; &:disabled { opacity: 0.5; } }
    .btn-secondary { background: white; border: 1px solid var(--border-subtle); padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--ui-border-radius); cursor: pointer; }

    @keyframes modalIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ChatModalsComponent {
  public masterList = inject(MasterListService);

  @Input() showCreateModal: boolean = false;
  @Input() showChannelSettings: boolean = false;
  @Input() showAddMembersModal: boolean = false;
  @Input() newChannelName: string = '';
  @Input() channelType: string = 'public';
  @Input() selectedMembers: Set<string> = new Set();
  @Input() newMembers: Set<string> = new Set();
  @Input() activeChannelUsers: string[] = [];
  @Input() currentUserId: string = '';
  @Input() activeChannel: Channel | null = null;
  @Input() onlineUsers: Set<string> = new Set();

  @Output() closeCreateModal = new EventEmitter<void>();
  @Output() closeChannelSettings = new EventEmitter<void>();
  @Output() closeAddMembersModal = new EventEmitter<void>();
  @Output() submitCreateChannel = new EventEmitter<void>();
  @Output() submitAddMembers = new EventEmitter<void>();
  @Output() toggleMemberSelection = new EventEmitter<string>();

  getInitials(userId: string): string {
    const user = this.getUserById(userId);
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return userId.slice(0, 2).toUpperCase();
  }

  getUserName(userId: string): string {
    const user = this.getUserById(userId);
    return user?.name || 'User';
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  private getUserById(userId: string): any {
    const users = this.masterList.users();
    return users.find(user => user._id === userId);
  }
}
