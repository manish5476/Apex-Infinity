import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterListService } from '../../core/services/master-list.service';
import { Channel } from './chat.models';

@Component({
  selector: 'app-chat-modals',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  template: `
    <!-- 1. CREATE CHANNEL MODAL -->
    @if (showCreateModal) {
      <div class="modal-backdrop" (click)="closeCreateModal.emit()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          
          <header class="modal-header">
            <div class="header-content">
              <h3>Create Channel</h3>
              <p>Channels are where your team communicates.</p>
            </div>
            <button class="btn-close" (click)="closeCreateModal.emit()">
              <i class="pi pi-times"></i>
            </button>
          </header>
          
          <div class="modal-body custom-scrollbar">
            
            <div class="form-group">
              <label>Channel Name</label>
              <div class="input-wrapper prefix">
                <span class="prefix-icon">#</span>
                <input 
                  type="text" 
                  [ngModel]="newChannelName" 
                  (ngModelChange)="onNameInput($event)" 
                  placeholder="e.g. marketing-updates" 
                  autofocus />
              </div>
              <small>Names must be lowercase, without spaces.</small>
            </div>
            
            <div class="form-group">
              <label>Visibility</label>
              <div class="radio-cards">
                
                <label class="radio-card" [class.selected]="channelType === 'public'">
                  <input type="radio" name="type" 
                         [ngModel]="channelType" 
                         (ngModelChange)="onTypeChange('public')" 
                         value="public" />
                  <div class="card-icon"><i class="pi pi-hashtag"></i></div>
                  <div class="card-info">
                    <strong>Public</strong>
                    <span>Anyone in your workspace can view and join.</span>
                  </div>
                  <div class="check-circle"><i class="pi pi-check"></i></div>
                </label>

                <label class="radio-card" [class.selected]="channelType === 'private'">
                  <input type="radio" name="type" 
                         [ngModel]="channelType" 
                         (ngModelChange)="onTypeChange('private')" 
                         value="private" />
                  <div class="card-icon"><i class="pi pi-lock"></i></div>
                  <div class="card-info">
                    <strong>Private</strong>
                    <span>Only invited people can view and join.</span>
                  </div>
                  <div class="check-circle"><i class="pi pi-check"></i></div>
                </label>

              </div>
            </div>
            
            @if (channelType === 'private') {
              <div class="form-group slide-down">
                <label>Add Members</label>
                <div class="member-selector custom-scrollbar">
                  @for (user of masterList.users(); track user._id) {
                    @if (user._id !== currentUserId) {
                      <label class="member-option" [class.checked]="selectedMembers.has(user._id)">
                        <input type="checkbox" 
                               [checked]="selectedMembers.has(user._id)" 
                               (change)="toggleMemberSelection.emit(user._id)" />
                        
                        <div class="avatar">{{ getInitials(user._id) }}</div>
                        <span class="name">{{ getUserName(user._id) }}</span>
                        
                        <div class="checkbox-custom">
                          <i class="pi pi-check"></i>
                        </div>
                      </label>
                    }
                  }
                </div>
              </div>
            }
          </div>
          
          <footer class="modal-footer">
            <button class="btn-ghost" (click)="closeCreateModal.emit()">Cancel</button>
            <button class="btn-primary" (click)="submitCreateChannel.emit()" [disabled]="!newChannelName.trim()">
              Create Channel
            </button>
          </footer>

        </div>
      </div>
    }

    <!-- 2. CHANNEL SETTINGS MODAL -->
    @if (showChannelSettings) {
      <div class="modal-backdrop" (click)="closeChannelSettings.emit()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          
          <header class="modal-header">
            <div class="header-content">
              <h3>#{{ activeChannel?.name }}</h3>
              <div class="meta-badges">
                <span class="badge">{{ activeChannel?.type | titlecase }}</span>
                <span class="badge">{{ activeChannelUsers.length }} Members</span>
              </div>
            </div>
            <button class="btn-close" (click)="closeChannelSettings.emit()">
              <i class="pi pi-times"></i>
            </button>
          </header>
          
          <div class="modal-body custom-scrollbar">
            <div class="section-header">
              <h4>Members</h4>
              <!-- This button closes settings and emits event to open Add Members -->
              <button class="btn-text-primary" (click)="closeChannelSettings.emit(); openAddMembersModal.emit()">
                <i class="pi pi-user-plus"></i> Add People
              </button>
            </div>

            <div class="members-list">
              @for (userId of activeChannelUsers; track userId) {
                <div class="member-item">
                  <div class="avatar-wrapper">
                    <div class="avatar">{{ getInitials(userId) }}</div>
                    @if (isUserOnline(userId)) { <span class="status-dot online"></span> }
                  </div>
                  
                  <div class="member-details">
                    <span class="name">
                      {{ getUserName(userId) }}
                      @if (userId === currentUserId) { <span class="you-tag">(You)</span> }
                    </span>
                    <span class="status-text">{{ isUserOnline(userId) ? 'Active now' : 'Offline' }}</span>
                  </div>

                  <div class="member-actions" style="display: flex; gap: 8px;">
                    @if (userId !== currentUserId) {
                      <button class="btn-icon-ghost" title="Message">
                        <i class="pi pi-comment"></i>
                      </button>
                      
                      <button class="btn-icon-ghost danger" title="Remove User" (click)="removeMember.emit(userId)">
                        <i class="pi pi-trash" style="color: var(--color-error);"></i>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
            
            <div class="danger-zone" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-secondary);">
                <button class="btn-outlined-danger" (click)="leaveChannel.emit()" style="width: 100%; padding: 0.75rem; border: 1px solid var(--color-error); color: var(--color-error); background: transparent; border-radius: var(--ui-border-radius); cursor: pointer;">
                  <i class="pi pi-sign-out"></i> Leave Channel
                </button>
            </div>
          </div>
          
        </div>
      </div>
    }

    <!-- 3. ADD MEMBERS MODAL -->
    @if (showAddMembersModal) {
      <div class="modal-backdrop" (click)="closeAddMembersModal.emit()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          
          <header class="modal-header">
            <div class="header-content">
              <h3>Add Members</h3>
              <p>Add people to #{{ activeChannel?.name }}</p>
            </div>
            <button class="btn-close" (click)="closeAddMembersModal.emit()">
              <i class="pi pi-times"></i>
            </button>
          </header>
          
          <div class="modal-body custom-scrollbar">
            <div class="form-group">
              <label>Select Users</label>
              <div class="member-selector custom-scrollbar">
                @for (user of masterList.users(); track user._id) {
                  <!-- Show users who are NOT current user and NOT already in channel -->
                  @if (user._id !== currentUserId && !activeChannelUsers.includes(user._id)) {
                    <label class="member-option" [class.checked]="newMembers.has(user._id)">
                      <!-- ✅ FIX: Use toggleNewMemberSelection for this modal -->
                      <input type="checkbox" 
                             [checked]="newMembers.has(user._id)" 
                             (change)="toggleNewMemberSelection.emit(user._id)" />
                      
                      <div class="avatar">{{ getInitials(user._id) }}</div>
                      <span class="name">{{ getUserName(user._id) }}</span>
                      
                      <div class="checkbox-custom">
                        <i class="pi pi-check"></i>
                      </div>
                    </label>
                  }
                }
              </div>
            </div>
          </div>
          
          <footer class="modal-footer">
            <button class="btn-ghost" (click)="closeAddMembersModal.emit()">Cancel</button>
            <button class="btn-primary" (click)="submitAddMembers.emit()" [disabled]="newMembers.size === 0">
              Add Selected
            </button>
          </footer>

        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; z-index: var(--z-modal-backdrop);
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: grid; place-items: center;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-card {
      width: 90%; max-width: 520px;
      background: var(--bg-surface);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-2xl);
      border: 1px solid var(--border-primary);
      display: flex; flex-direction: column;
      max-height: 85vh;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: var(--spacing-xl);
      border-bottom: 1px solid var(--border-secondary);
      display: flex; justify-content: space-between; align-items: flex-start;
      h3 { margin: 0 0 var(--spacing-xs); font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
      p { margin: 0; color: var(--text-secondary); font-size: 0.875rem; }
      .btn-close { background: transparent; border: none; cursor: pointer; color: var(--text-tertiary); width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; &:hover { background: var(--bg-hover); color: var(--text-primary); } }
    }

    .modal-body { padding: var(--spacing-xl); overflow-y: auto; }

    .form-group {
      margin-bottom: var(--spacing-xl);
      label { display: block; margin-bottom: var(--spacing-sm); font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
      small { display: block; margin-top: 4px; color: var(--text-tertiary); font-size: 0.75rem; }
    }

    .input-wrapper {
      position: relative; display: flex; align-items: center;
      &.prefix input { padding-left: 2.5rem; }
      .prefix-icon { position: absolute; left: 1rem; color: var(--text-tertiary); font-weight: 600; pointer-events: none; }
      input { width: 100%; padding: 0.75rem 1rem; background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); color: var(--text-primary); font-family: var(--font-body); font-size: 0.95rem; outline: none; &:focus { background: var(--bg-primary); border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--focus-ring-color); } }
    }

    .radio-cards { display: grid; gap: var(--spacing-md); }
    .radio-card {
      display: flex; align-items: center; gap: var(--spacing-lg); padding: var(--spacing-lg); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); cursor: pointer; transition: var(--transition-base); position: relative;
      input { position: absolute; opacity: 0; }
      .card-icon { width: 40px; height: 40px; background: var(--bg-ternary); border-radius: 50%; display: grid; place-items: center; color: var(--text-secondary); font-size: 1.2rem; }
      .card-info { flex: 1; display: flex; flex-direction: column; strong { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; } span { color: var(--text-secondary); font-size: 0.8rem; } }
      .check-circle { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-secondary); display: grid; place-items: center; color: white; font-size: 0.7rem; i { opacity: 0; transform: scale(0); transition: transform 0.2s; } }
      &:hover { border-color: var(--text-tertiary); background: var(--bg-hover); }
      &.selected { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-surface)); .card-icon { background: var(--accent-primary); color: white; } .check-circle { background: var(--accent-primary); border-color: var(--accent-primary); i { opacity: 1; transform: scale(1); } } }
    }

    .member-selector { border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); max-height: 200px; overflow-y: auto; background: var(--bg-ternary); }
    .member-option {
      display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); cursor: pointer; border-bottom: 1px solid var(--border-subtle); &:last-child { border-bottom: none; } &:hover { background: var(--bg-hover); }
      input { position: absolute; opacity: 0; }
      .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-secondary); color: var(--accent-primary); font-weight: 700; font-size: 0.75rem; display: grid; place-items: center; }
      .name { flex: 1; font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }
      .checkbox-custom { width: 18px; height: 18px; border: 2px solid var(--text-tertiary); border-radius: 4px; display: grid; place-items: center; color: white; font-size: 0.7rem; transition: all 0.2s; i { opacity: 0; } }
      &.checked .checkbox-custom { background: var(--accent-primary); border-color: var(--accent-primary); i { opacity: 1; } }
    }

    .section-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);
      h4 { margin: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }
      .btn-text-primary { background: none; border: none; color: var(--accent-primary); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; &:hover { text-decoration: underline; } }
    }

    .member-item {
      display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--border-subtle);
      .avatar-wrapper { position: relative; }
      .avatar { width: 40px; height: 40px; background: var(--bg-ternary); border-radius: 50%; display: grid; place-items: center; font-weight: 600; color: var(--text-primary); }
      .status-dot { width: 10px; height: 10px; background: var(--color-success); border: 2px solid var(--bg-surface); border-radius: 50%; position: absolute; bottom: 0; right: 0; }
      .member-details { flex: 1; display: flex; flex-direction: column; .name { font-weight: 500; color: var(--text-primary); font-size: 0.95rem; } .you-tag { color: var(--text-tertiary); font-weight: 400; font-size: 0.8rem; margin-left: 4px; } .status-text { color: var(--text-secondary); font-size: 0.8rem; } }
      .btn-icon-ghost { width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent; color: var(--text-tertiary); cursor: pointer; display: grid; place-items: center; &:hover { background: var(--bg-hover); color: var(--text-primary); } }
      .btn-icon-ghost.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); }
    }

    .modal-footer { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-ternary); border-top: 1px solid var(--border-primary); display: flex; justify-content: flex-end; gap: var(--spacing-md); }
    .btn-ghost { padding: 0.6rem 1.2rem; background: transparent; border: 1px solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 500; transition: var(--transition-base); &:hover { background: var(--bg-hover); color: var(--text-primary); } }
    .btn-primary { padding: 0.6rem 1.5rem; background: var(--accent-primary); border: none; color: white; border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 600; box-shadow: var(--shadow-md); transition: var(--transition-base); &:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: var(--shadow-lg); } &:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; } }
    
    .meta-badges { display: flex; gap: 8px; margin-top: 4px; .badge { background: var(--bg-ternary); color: var(--text-secondary); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; } }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
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

  @Input() activeChannelUsers: string[] = [];
  @Input() currentUserId: string = '';
  @Input() activeChannel: Channel | null = null;
  @Input() onlineUsers: Set<string> = new Set();
  @Input() newMembers: Set<string> = new Set();

  // 🛑 SYNC EMITTERS
  @Output() newChannelNameChange = new EventEmitter<string>();
  @Output() channelTypeChange = new EventEmitter<string>();

  @Output() closeCreateModal = new EventEmitter<void>();
  @Output() closeChannelSettings = new EventEmitter<void>();
  @Output() closeAddMembersModal = new EventEmitter<void>();
  @Output() submitCreateChannel = new EventEmitter<void>();
  @Output() submitAddMembers = new EventEmitter<void>();
  @Output() toggleMemberSelection = new EventEmitter<string>();

  // ✅ NEW EVENTS
  @Output() leaveChannel = new EventEmitter<void>();
  @Output() removeMember = new EventEmitter<string>();
  @Output() openAddMembersModal = new EventEmitter<void>();
  @Output() toggleNewMemberSelection = new EventEmitter<string>(); // Added this

  onNameInput(value: string) {
    this.newChannelNameChange.emit(value);
  }

  onTypeChange(value: string) {
    this.channelTypeChange.emit(value);
  }

  getInitials(userId: string): string {
    const user = this.getUserById(userId);
    if (user?.name) {
      const parts = user.name.trim().split(' ');
      return parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return userId.slice(-2).toUpperCase();
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
