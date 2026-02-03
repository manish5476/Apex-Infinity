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
            <button class="btn-primary" (click)="submitCreateChannel.emit()" [disabled]="!newChannelName?.trim()">
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
              <button class="btn-text-primary">
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

                  @if (userId !== currentUserId) {
                    <button class="btn-icon-ghost" title="Message">
                      <i class="pi pi-comment"></i>
                    </button>
                  }
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
      position: fixed; inset: 0; z-index: var(--z-modal-backdrop);
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: grid; place-items: center;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-card {
      width: 90%; max-width: 520px;
      background: var(--bg-surface);
      border-radius: var(--ui-border-radius-xl);
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
  @Input() newMembers: Set<string> = new Set(); // 🛑 ADD THIS LINE
  @Input() newChannelName: string = '';
  @Input() channelType: string = 'public';
  @Input() selectedMembers: Set<string> = new Set();
  
  @Input() activeChannelUsers: string[] = [];
  @Input() currentUserId: string = '';
  @Input() activeChannel: Channel | null = null;
  @Input() onlineUsers: Set<string> = new Set();

  // 🛑 SYNC EMITTERS
  @Output() newChannelNameChange = new EventEmitter<string>();
  @Output() channelTypeChange = new EventEmitter<string>();
@Input() newMembers: Set<string> = new Set();
  @Output() closeCreateModal = new EventEmitter<void>();
  @Output() closeChannelSettings = new EventEmitter<void>();
  @Output() closeAddMembersModal = new EventEmitter<void>();
  @Output() submitCreateChannel = new EventEmitter<void>();
  @Output() submitAddMembers = new EventEmitter<void>();
  @Output() toggleMemberSelection = new EventEmitter<string>();

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
// import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MasterListService } from '../../core/services/master-list.service';
// import { Channel } from './chat.models';

// @Component({
//   selector: 'app-chat-modals',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './chat-modals.component.html', // Pointing to the template below
//   styles: [`
//     /* Backdrop */
//     .modal-backdrop {
//       position: fixed; inset: 0; z-index: var(--z-modal-backdrop);
//       background: rgba(0, 0, 0, 0.6);
//       backdrop-filter: blur(8px);
//       display: grid; place-items: center;
//       animation: fadeIn 0.2s ease-out;
//     }

//     /* Card */
//     .modal-card {
//       width: 90%; max-width: 520px;
//       background: var(--bg-surface);
//       border-radius: var(--ui-border-radius-xl);
//       box-shadow: var(--shadow-2xl);
//       border: 1px solid var(--border-primary);
//       display: flex; flex-direction: column;
//       max-height: 85vh;
//       animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
//     }

//     /* Header */
//     .modal-header {
//       padding: var(--spacing-xl);
//       border-bottom: 1px solid var(--border-secondary);
//       display: flex; justify-content: space-between; align-items: flex-start;
      
//       h3 { 
//         margin: 0 0 var(--spacing-xs); 
//         font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--text-primary);
//       }
//       p { margin: 0; color: var(--text-secondary); font-size: 0.875rem; }
      
//       .btn-close {
//         background: transparent; border: none; cursor: pointer; color: var(--text-tertiary);
//         width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center;
//         transition: var(--transition-colors);
//         &:hover { background: var(--bg-hover); color: var(--text-primary); }
//       }
//     }

//     /* Body */
//     .modal-body {
//       padding: var(--spacing-xl);
//       overflow-y: auto;
//     }

//     /* Form Groups */
//     .form-group {
//       margin-bottom: var(--spacing-xl);
//       label { 
//         display: block; margin-bottom: var(--spacing-sm); 
//         font-weight: 600; font-size: 0.875rem; color: var(--text-primary);
//       }
//       small { display: block; margin-top: 4px; color: var(--text-tertiary); font-size: 0.75rem; }
//     }

//     /* Inputs */
//     .input-wrapper {
//       position: relative; display: flex; align-items: center;
      
//       &.prefix input { padding-left: 2.5rem; }
      
//       .prefix-icon {
//         position: absolute; left: 1rem; color: var(--text-tertiary); font-weight: 600;
//         pointer-events: none;
//       }
      
//       input {
//         width: 100%; padding: 0.75rem 1rem;
//         background: var(--bg-ternary); border: 1px solid var(--border-secondary);
//         border-radius: var(--ui-border-radius); color: var(--text-primary);
//         font-family: var(--font-body); font-size: 0.95rem;
//         transition: var(--transition-base);
//         outline: none;
        
//         &:focus {
//           background: var(--bg-primary);
//           border-color: var(--accent-primary);
//           box-shadow: 0 0 0 3px var(--focus-ring-color);
//         }
//       }
//     }

//     /* Radio Cards */
//     .radio-cards { display: grid; gap: var(--spacing-md); }
    
//     .radio-card {
//       display: flex; align-items: center; gap: var(--spacing-lg);
//       padding: var(--spacing-lg);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       cursor: pointer; transition: var(--transition-base);
//       position: relative;
      
//       input { position: absolute; opacity: 0; }
      
//       .card-icon {
//         width: 40px; height: 40px; background: var(--bg-ternary);
//         border-radius: 50%; display: grid; place-items: center;
//         color: var(--text-secondary); font-size: 1.2rem;
//         transition: var(--transition-colors);
//       }
      
//       .card-info {
//         flex: 1; display: flex; flex-direction: column;
//         strong { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
//         span { color: var(--text-secondary); font-size: 0.8rem; }
//       }
      
//       .check-circle {
//         width: 20px; height: 20px; border-radius: 50%;
//         border: 2px solid var(--border-secondary);
//         display: grid; place-items: center; color: white; font-size: 0.7rem;
//         transition: var(--transition-base);
//         i { opacity: 0; transform: scale(0); transition: transform 0.2s; }
//       }
      
//       &:hover { border-color: var(--text-tertiary); background: var(--bg-hover); }
      
//       &.selected {
//         border-color: var(--accent-primary);
//         background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-surface));
        
//         .card-icon { background: var(--accent-primary); color: white; }
//         .check-circle { 
//           background: var(--accent-primary); border-color: var(--accent-primary);
//           i { opacity: 1; transform: scale(1); }
//         }
//       }
//     }

//     /* Member Selector */
//     .member-selector {
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       max-height: 200px; overflow-y: auto;
//       background: var(--bg-ternary);
//     }
    
//     .member-option {
//       display: flex; align-items: center; gap: var(--spacing-md);
//       padding: var(--spacing-md);
//       cursor: pointer; border-bottom: 1px solid var(--border-subtle);
//       transition: background 0.2s;
      
//       &:last-child { border-bottom: none; }
//       &:hover { background: var(--bg-hover); }
      
//       input { position: absolute; opacity: 0; }
      
//       .avatar {
//         width: 32px; height: 32px; border-radius: 50%;
//         background: var(--accent-secondary); color: var(--accent-primary);
//         font-weight: 700; font-size: 0.75rem;
//         display: grid; place-items: center;
//       }
      
//       .name { flex: 1; font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }
      
//       .checkbox-custom {
//         width: 18px; height: 18px; border: 2px solid var(--text-tertiary);
//         border-radius: 4px; display: grid; place-items: center;
//         color: white; font-size: 0.7rem; transition: all 0.2s;
//         i { opacity: 0; }
//       }
      
//       &.checked .checkbox-custom {
//         background: var(--accent-primary); border-color: var(--accent-primary);
//         i { opacity: 1; }
//       }
//     }

//     /* Footer */
//     .modal-footer {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-ternary); border-top: 1px solid var(--border-primary);
//       display: flex; justify-content: flex-end; gap: var(--spacing-md);
//     }

//     .btn-ghost {
//       padding: 0.6rem 1.2rem; background: transparent; border: 1px solid var(--border-primary);
//       color: var(--text-secondary); border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 500;
//       transition: var(--transition-base);
//       &:hover { background: var(--bg-hover); color: var(--text-primary); }
//     }

//     .btn-primary {
//       padding: 0.6rem 1.5rem; background: var(--accent-primary); border: none;
//       color: white; border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 600;
//       box-shadow: var(--shadow-md); transition: var(--transition-base);
      
//       &:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: var(--shadow-lg); }
//       &:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
//     }

//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
//   `]
// })
// export class ChatModalsComponent {
//   public masterList = inject(MasterListService);

//   @Input() showCreateModal: boolean = false;
//   @Input() showChannelSettings: boolean = false;
//   @Input() showAddMembersModal: boolean = false;
  
//   @Input() newChannelName: string = '';
//   @Input() channelType: string = 'public';
//   @Input() selectedMembers: Set<string> = new Set();
  
//   @Input() activeChannelUsers: string[] = [];
//   @Input() currentUserId: string = '';
//   @Input() activeChannel: Channel | null = null;
//   @Input() onlineUsers: Set<string> = new Set();

//   // 🛑 CRITICAL: New Emitters to sync values back to Parent
//   @Output() newChannelNameChange = new EventEmitter<string>();
//   @Output() channelTypeChange = new EventEmitter<string>();

//   @Output() closeCreateModal = new EventEmitter<void>();
//   @Output() closeChannelSettings = new EventEmitter<void>();
//   @Output() closeAddMembersModal = new EventEmitter<void>();
//   @Output() submitCreateChannel = new EventEmitter<void>();
//   @Output() submitAddMembers = new EventEmitter<void>();
//   @Output() toggleMemberSelection = new EventEmitter<string>();

//   // Methods to emit changes immediately as they happen
//   onNameInput(value: string) {
//     this.newChannelNameChange.emit(value);
//   }

//   onTypeChange(value: string) {
//     this.channelTypeChange.emit(value);
//   }

//   getInitials(userId: string): string {
//     const user = this.getUserById(userId);
//     if (user?.name) {
//       return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
//     }
//     return userId.slice(0, 2).toUpperCase();
//   }

//   getUserName(userId: string): string {
//     const user = this.getUserById(userId);
//     return user?.name || 'User';
//   }

//   isUserOnline(userId: string): boolean {
//     return this.onlineUsers.has(userId);
//   }

//   private getUserById(userId: string): any {
//     const users = this.masterList.users();
//     return users.find(user => user._id === userId);
//   }
// }
// // import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { MasterListService } from '../../core/services/master-list.service';
// // import { Channel } from './chat.models';

// // @Component({
// //   selector: 'app-chat-modals',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule],
// //   template: `
// //     @if (showCreateModal) {
// //       <div class="modal-backdrop" (click)="closeCreateModal.emit()">
// //         <div class="modal-card" (click)="$event.stopPropagation()">
          
// //           <header class="modal-header">
// //             <div class="header-content">
// //               <h3>Create Channel</h3>
// //               <p>Channels are where your team communicates.</p>
// //             </div>
// //             <button class="btn-close" (click)="closeCreateModal.emit()">
// //               <i class="pi pi-times"></i>
// //             </button>
// //           </header>
          
// //           <div class="modal-body custom-scrollbar">
            
// //             <div class="form-group">
// //               <label>Channel Name</label>
// //               <div class="input-wrapper prefix">
// //                 <span class="prefix-icon">#</span>
// //                 <input type="text" [(ngModel)]="newChannelName" placeholder="e.g. marketing-updates" autofocus />
// //               </div>
// //               <small>Names must be lowercase, without spaces.</small>
// //             </div>
            
// //             <div class="form-group">
// //               <label>Visibility</label>
// //               <div class="radio-cards">
                
// //                 <label class="radio-card" [class.selected]="channelType === 'public'">
// //                   <input type="radio" name="type" [(ngModel)]="channelType" value="public" />
// //                   <div class="card-icon"><i class="pi pi-hashtag"></i></div>
// //                   <div class="card-info">
// //                     <strong>Public</strong>
// //                     <span>Anyone in your workspace can view and join.</span>
// //                   </div>
// //                   <div class="check-circle"><i class="pi pi-check"></i></div>
// //                 </label>

// //                 <label class="radio-card" [class.selected]="channelType === 'private'">
// //                   <input type="radio" name="type" [(ngModel)]="channelType" value="private" />
// //                   <div class="card-icon"><i class="pi pi-lock"></i></div>
// //                   <div class="card-info">
// //                     <strong>Private</strong>
// //                     <span>Only invited people can view and join.</span>
// //                   </div>
// //                   <div class="check-circle"><i class="pi pi-check"></i></div>
// //                 </label>

// //               </div>
// //             </div>
            
// //             @if (channelType === 'private') {
// //               <div class="form-group slide-down">
// //                 <label>Add Members</label>
// //                 <div class="member-selector custom-scrollbar">
// //                   @for (user of masterList.users(); track user._id) {
// //                     @if (user._id !== currentUserId) {
// //                       <label class="member-option" [class.checked]="selectedMembers.has(user._id)">
// //                         <input type="checkbox" 
// //                                [checked]="selectedMembers.has(user._id)" 
// //                                (change)="toggleMemberSelection.emit(user._id)" />
                        
// //                         <div class="avatar">{{ getInitials(user._id) }}</div>
// //                         <span class="name">{{ getUserName(user._id) }}</span>
                        
// //                         <div class="checkbox-custom">
// //                           <i class="pi pi-check"></i>
// //                         </div>
// //                       </label>
// //                     }
// //                   }
// //                 </div>
// //               </div>
// //             }
// //           </div>
          
// //           <footer class="modal-footer">
// //             <button class="btn-ghost" (click)="closeCreateModal.emit()">Cancel</button>
// //             <button class="btn-primary" (click)="submitCreateChannel.emit()" [disabled]="!newChannelName.trim()">
// //               Create Channel
// //             </button>
// //           </footer>

// //         </div>
// //       </div>
// //     }

// //     @if (showChannelSettings) {
// //       <div class="modal-backdrop" (click)="closeChannelSettings.emit()">
// //         <div class="modal-card" (click)="$event.stopPropagation()">
          
// //           <header class="modal-header">
// //             <div class="header-content">
// //               <h3>#{{ activeChannel?.name }}</h3>
// //               <div class="meta-badges">
// //                 <span class="badge">{{ activeChannel?.type | titlecase }}</span>
// //                 <span class="badge">{{ activeChannelUsers.length }} Members</span>
// //               </div>
// //             </div>
// //             <button class="btn-close" (click)="closeChannelSettings.emit()">
// //               <i class="pi pi-times"></i>
// //             </button>
// //           </header>
          
// //           <div class="modal-body custom-scrollbar">
            
// //             <div class="section-header">
// //               <h4>Members</h4>
// //               <button class="btn-text-primary">
// //                 <i class="pi pi-user-plus"></i> Add People
// //               </button>
// //             </div>

// //             <div class="members-list">
// //               @for (userId of activeChannelUsers; track userId) {
// //                 <div class="member-item">
// //                   <div class="avatar-wrapper">
// //                     <div class="avatar">{{ getInitials(userId) }}</div>
// //                     @if (isUserOnline(userId)) { <span class="status-dot online"></span> }
// //                   </div>
                  
// //                   <div class="member-details">
// //                     <span class="name">
// //                       {{ getUserName(userId) }}
// //                       @if (userId === currentUserId) { <span class="you-tag">(You)</span> }
// //                     </span>
// //                     <span class="status-text">{{ isUserOnline(userId) ? 'Active now' : 'Offline' }}</span>
// //                   </div>

// //                   @if (userId !== currentUserId) {
// //                     <button class="btn-icon-ghost" title="Message">
// //                       <i class="pi pi-comment"></i>
// //                     </button>
// //                   }
// //                 </div>
// //               }
// //             </div>

// //           </div>
          
// //           </div>
// //       </div>
// //     }
// //   `,
// //   styles: [`
// //     /* =========================================
// //        THEME MAPPING (Using Project Tokens)
// //        ========================================= */
    
// //     /* Backdrop */
// //     .modal-backdrop {
// //       position: fixed; inset: 0; z-index: var(--z-modal-backdrop);
// //       background: rgba(0, 0, 0, 0.6);
// //       backdrop-filter: blur(8px);
// //       display: grid; place-items: center;
// //       animation: fadeIn 0.2s ease-out;
// //     }

// //     /* Card */
// //     .modal-card {
// //       width: 90%; max-width: 520px;
// //       background: var(--bg-surface); /* Matches app surface */
// //       border-radius: var(--ui-border-radius-xl);
// //       box-shadow: var(--shadow-2xl);
// //       border: 1px solid var(--border-primary);
// //       display: flex; flex-direction: column;
// //       max-height: 85vh;
// //       animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
// //     }

// //     /* Header */
// //     .modal-header {
// //       padding: var(--spacing-xl);
// //       border-bottom: 1px solid var(--border-secondary);
// //       display: flex; justify-content: space-between; align-items: flex-start;
      
// //       h3 { 
// //         margin: 0 0 var(--spacing-xs); 
// //         font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--text-primary);
// //       }
// //       p { margin: 0; color: var(--text-secondary); font-size: 0.875rem; }
      
// //       .btn-close {
// //         background: transparent; border: none; cursor: pointer; color: var(--text-tertiary);
// //         width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center;
// //         transition: var(--transition-colors);
// //         &:hover { background: var(--bg-hover); color: var(--text-primary); }
// //       }
// //     }

// //     /* Body */
// //     .modal-body {
// //       padding: var(--spacing-xl);
// //       overflow-y: auto;
// //     }

// //     /* Form Groups */
// //     .form-group {
// //       margin-bottom: var(--spacing-xl);
// //       label { 
// //         display: block; margin-bottom: var(--spacing-sm); 
// //         font-weight: 600; font-size: 0.875rem; color: var(--text-primary);
// //       }
// //       small { display: block; margin-top: 4px; color: var(--text-tertiary); font-size: 0.75rem; }
// //     }

// //     /* Inputs */
// //     .input-wrapper {
// //       position: relative; display: flex; align-items: center;
      
// //       &.prefix input { padding-left: 2.5rem; }
      
// //       .prefix-icon {
// //         position: absolute; left: 1rem; color: var(--text-tertiary); font-weight: 600;
// //         pointer-events: none;
// //       }
      
// //       input {
// //         width: 100%; padding: 0.75rem 1rem;
// //         background: var(--bg-ternary); border: 1px solid var(--border-secondary);
// //         border-radius: var(--ui-border-radius); color: var(--text-primary);
// //         font-family: var(--font-body); font-size: 0.95rem;
// //         transition: var(--transition-base);
// //         outline: none;
        
// //         &:focus {
// //           background: var(--bg-primary);
// //           border-color: var(--accent-primary);
// //           box-shadow: 0 0 0 3px var(--focus-ring-color);
// //         }
// //       }
// //     }

// //     /* Radio Cards */
// //     .radio-cards { display: grid; gap: var(--spacing-md); }
    
// //     .radio-card {
// //       display: flex; align-items: center; gap: var(--spacing-lg);
// //       padding: var(--spacing-lg);
// //       border: 1px solid var(--border-secondary);
// //       border-radius: var(--ui-border-radius-lg);
// //       cursor: pointer; transition: var(--transition-base);
// //       position: relative;
      
// //       input { position: absolute; opacity: 0; }
      
// //       .card-icon {
// //         width: 40px; height: 40px; background: var(--bg-ternary);
// //         border-radius: 50%; display: grid; place-items: center;
// //         color: var(--text-secondary); font-size: 1.2rem;
// //         transition: var(--transition-colors);
// //       }
      
// //       .card-info {
// //         flex: 1; display: flex; flex-direction: column;
// //         strong { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
// //         span { color: var(--text-secondary); font-size: 0.8rem; }
// //       }
      
// //       .check-circle {
// //         width: 20px; height: 20px; border-radius: 50%;
// //         border: 2px solid var(--border-secondary);
// //         display: grid; place-items: center; color: white; font-size: 0.7rem;
// //         transition: var(--transition-base);
// //         i { opacity: 0; transform: scale(0); transition: transform 0.2s; }
// //       }
      
// //       &:hover { border-color: var(--text-tertiary); background: var(--bg-hover); }
      
// //       &.selected {
// //         border-color: var(--accent-primary);
// //         background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-surface));
        
// //         .card-icon { background: var(--accent-primary); color: white; }
// //         .check-circle { 
// //           background: var(--accent-primary); border-color: var(--accent-primary);
// //           i { opacity: 1; transform: scale(1); }
// //         }
// //       }
// //     }

// //     /* Member Selector */
// //     .member-selector {
// //       border: 1px solid var(--border-secondary);
// //       border-radius: var(--ui-border-radius);
// //       max-height: 200px; overflow-y: auto;
// //       background: var(--bg-ternary);
// //     }
    
// //     .member-option {
// //       display: flex; align-items: center; gap: var(--spacing-md);
// //       padding: var(--spacing-md);
// //       cursor: pointer; border-bottom: 1px solid var(--border-subtle);
// //       transition: background 0.2s;
      
// //       &:last-child { border-bottom: none; }
// //       &:hover { background: var(--bg-hover); }
      
// //       input { position: absolute; opacity: 0; }
      
// //       .avatar {
// //         width: 32px; height: 32px; border-radius: 50%;
// //         background: var(--accent-secondary); color: var(--accent-primary);
// //         font-weight: 700; font-size: 0.75rem;
// //         display: grid; place-items: center;
// //       }
      
// //       .name { flex: 1; font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }
      
// //       .checkbox-custom {
// //         width: 18px; height: 18px; border: 2px solid var(--text-tertiary);
// //         border-radius: 4px; display: grid; place-items: center;
// //         color: white; font-size: 0.7rem; transition: all 0.2s;
// //         i { opacity: 0; }
// //       }
      
// //       &.checked .checkbox-custom {
// //         background: var(--accent-primary); border-color: var(--accent-primary);
// //         i { opacity: 1; }
// //       }
// //     }

// //     /* Members List (Settings) */
// //     .section-header {
// //       display: flex; justify-content: space-between; align-items: center;
// //       margin-bottom: var(--spacing-md);
// //       h4 { margin: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }
      
// //       .btn-text-primary {
// //         background: none; border: none; color: var(--accent-primary); font-weight: 600; cursor: pointer;
// //         display: flex; align-items: center; gap: 6px; font-size: 0.85rem;
// //         &:hover { text-decoration: underline; }
// //       }
// //     }
    
// //     .members-list { display: flex; flex-direction: column; }
    
// //     .member-item {
// //       display: flex; align-items: center; gap: var(--spacing-md);
// //       padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--border-subtle);
      
// //       .avatar-wrapper { position: relative; }
// //       .avatar { 
// //         width: 40px; height: 40px; background: var(--bg-ternary); 
// //         border-radius: 50%; display: grid; place-items: center; font-weight: 600; color: var(--text-primary);
// //       }
// //       .status-dot {
// //         width: 10px; height: 10px; background: var(--color-success);
// //         border: 2px solid var(--bg-surface); border-radius: 50%;
// //         position: absolute; bottom: 0; right: 0;
// //       }
      
// //       .member-details {
// //         flex: 1; display: flex; flex-direction: column;
// //         .name { font-weight: 500; color: var(--text-primary); font-size: 0.95rem; }
// //         .you-tag { color: var(--text-tertiary); font-weight: 400; font-size: 0.8rem; margin-left: 4px; }
// //         .status-text { color: var(--text-secondary); font-size: 0.8rem; }
// //       }
      
// //       .btn-icon-ghost {
// //         width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent;
// //         color: var(--text-tertiary); cursor: pointer; display: grid; place-items: center;
// //         &:hover { background: var(--bg-hover); color: var(--text-primary); }
// //       }
// //     }

// //     /* Footer */
// //     .modal-footer {
// //       padding: var(--spacing-lg) var(--spacing-xl);
// //       background: var(--bg-ternary); border-top: 1px solid var(--border-primary);
// //       display: flex; justify-content: flex-end; gap: var(--spacing-md);
// //     }

// //     .btn-ghost {
// //       padding: 0.6rem 1.2rem; background: transparent; border: 1px solid var(--border-primary);
// //       color: var(--text-secondary); border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 500;
// //       transition: var(--transition-base);
// //       &:hover { background: var(--bg-hover); color: var(--text-primary); }
// //     }

// //     .btn-primary {
// //       padding: 0.6rem 1.5rem; background: var(--accent-primary); border: none;
// //       color: white; border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 600;
// //       box-shadow: var(--shadow-md); transition: var(--transition-base);
      
// //       &:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: var(--shadow-lg); }
// //       &:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
// //     }

// //     /* Animations */
// //     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// //     @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
// //     .slide-down { animation: fadeIn 0.3s ease-out; }
// //   `]
// // })
// // export class ChatModalsComponent {
// //   public masterList = inject(MasterListService);

// //   @Input() showCreateModal: boolean = false;
// //   @Input() showChannelSettings: boolean = false;
// //   @Input() showAddMembersModal: boolean = false;
// //   @Input() newChannelName: string = '';
// //   @Input() channelType: string = 'public';
// //   @Input() selectedMembers: Set<string> = new Set();
// //   @Input() newMembers: Set<string> = new Set();
// //   @Input() activeChannelUsers: string[] = [];
// //   @Input() currentUserId: string = '';
// //   @Input() activeChannel: Channel | null = null;
// //   @Input() onlineUsers: Set<string> = new Set();

// //   @Output() closeCreateModal = new EventEmitter<void>();
// //   @Output() closeChannelSettings = new EventEmitter<void>();
// //   @Output() closeAddMembersModal = new EventEmitter<void>();
// //   @Output() submitCreateChannel = new EventEmitter<void>();
// //   @Output() submitAddMembers = new EventEmitter<void>();
// //   @Output() toggleMemberSelection = new EventEmitter<string>();

// //   getInitials(userId: string): string {
// //     const user = this.getUserById(userId);
// //     if (user?.name) {
// //       return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
// //     }
// //     return userId.slice(0, 2).toUpperCase();
// //   }

// //   getUserName(userId: string): string {
// //     const user = this.getUserById(userId);
// //     return user?.name || 'User';
// //   }

// //   isUserOnline(userId: string): boolean {
// //     return this.onlineUsers.has(userId);
// //   }

// //   private getUserById(userId: string): any {
// //     const users = this.masterList.users();
// //     return users.find(user => user._id === userId);
// //   }
// // }
// // // import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormsModule } from '@angular/forms';
// // // import { Channel } from './chat.models';
// // // import { MasterListService } from '../../core/services/master-list.service';

// // // @Component({
// // //   selector: 'app-chat-modals',
// // //   standalone: true,
// // //   imports: [CommonModule, FormsModule],
// // //   template: `
// // //     @if (showCreateModal) {
// // //     <div class="modal-backdrop" (click)="closeCreateModal.emit()">
// // //       <div class="modal-card" (click)="$event.stopPropagation()">
// // //         <header class="modal-header">
// // //           <h3>Create new channel</h3>
// // //           <button class="btn-close" (click)="closeCreateModal.emit()"><i class="pi pi-times"></i></button>
// // //         </header>
        
// // //         <div class="modal-body">
// // //           <div class="form-field">
// // //             <label>Name</label>
// // //             <div class="input-addon">
// // //               <span class="addon">#</span>
// // //               <input type="text" [(ngModel)]="newChannelName" placeholder="e.g. marketing-updates" />
// // //             </div>
// // //           </div>
          
// // //           <div class="form-field">
// // //             <label>Visibility</label>
// // //             <div class="radio-grid">
// // //               <label class="radio-card" [class.active]="channelType === 'public'">
// // //                 <input type="radio" name="type" [(ngModel)]="channelType" value="public" />
// // //                 <div class="radio-content">
// // //                   <i class="pi pi-hashtag"></i>
// // //                   <div class="text">
// // //                     <strong>Public</strong>
// // //                     <span>Anyone in organization</span>
// // //                   </div>
// // //                 </div>
// // //               </label>
// // //               <label class="radio-card" [class.active]="channelType === 'private'">
// // //                 <input type="radio" name="type" [(ngModel)]="channelType" value="private" />
// // //                 <div class="radio-content">
// // //                   <i class="pi pi-lock"></i>
// // //                   <div class="text">
// // //                     <strong>Private</strong>
// // //                     <span>Invited members only</span>
// // //                   </div>
// // //                 </div>
// // //               </label>
// // //             </div>
// // //           </div>
          
// // //           @if (channelType === 'private') {
// // //           <div class="form-field">
// // //             <label>Add Initial Members</label>
// // //             <div class="selector-list">
// // //               @for (user of masterList.users(); track user._id) {
// // //                 @if (user._id !== currentUserId) {
// // //                 <label class="selector-item" [class.selected]="selectedMembers.has(user._id)">
// // //                   <input type="checkbox" (change)="toggleMemberSelection.emit(user._id)" [checked]="selectedMembers.has(user._id)" />
// // //                   <div class="user-avatar">{{ getInitials(user._id) }}</div>
// // //                   <span class="user-name">{{ getUserName(user._id) }}</span>
// // //                   <i class="pi pi-check-circle check-icon"></i>
// // //                 </label>
// // //                 }
// // //               }
// // //             </div>
// // //           </div>
// // //           }
// // //         </div>
        
// // //         <footer class="modal-footer">
// // //           <button class="btn-secondary" (click)="closeCreateModal.emit()">Cancel</button>
// // //           <button class="btn-primary" (click)="submitCreateChannel.emit()" [disabled]="!newChannelName.trim()">
// // //             Create Channel
// // //           </button>
// // //         </footer>
// // //       </div>
// // //     </div>
// // //     }

// // //     @if (showChannelSettings) {
// // //     <div class="modal-backdrop" (click)="closeChannelSettings.emit()">
// // //       <div class="modal-card" (click)="$event.stopPropagation()">
// // //         <header class="modal-header">
// // //           <div class="header-title">
// // //             <h3>{{ activeChannel?.name }}</h3>
// // //             <span class="badge-type">{{ activeChannel?.type }}</span>
// // //           </div>
// // //           <button class="btn-close" (click)="closeChannelSettings.emit()"><i class="pi pi-times"></i></button>
// // //         </header>
        
// // //         <div class="modal-body">
// // //           <div class="section-title">Members — {{ activeChannelUsers.length }}</div>
// // //           <div class="members-display-list">
// // //             @for (userId of activeChannelUsers; track userId) {
// // //             <div class="member-row">
// // //               <div class="user-avatar" [class.online]="isUserOnline(userId)">{{ getInitials(userId) }}</div>
// // //               <div class="member-info">
// // //                 <span class="name">{{ getUserName(userId) }}</span>
// // //                 @if (userId === currentUserId) { <span class="tag">You</span> }
// // //               </div>
// // //               @if (isUserOnline(userId)) { <span class="status-indicator">Active now</span> }
// // //             </div>
// // //             }
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //     }
// // //   `,
// // //   styles: [`
// // //     .modal-backdrop {
// // //       position: fixed; inset: 0; background: rgba(0,0,0,0.4); 
// // //       backdrop-filter: blur(8px); z-index: var(--z-modal);
// // //       display: grid; place-items: center; padding: var(--spacing-xl);
// // //     }

// // //     .modal-card {
// // //       background: var(--bg-surface); width: 100%; max-width: 500px;
// // //       border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-6xl);
// // //       display: flex; flex-direction: column; overflow: hidden;
// // //       animation: var(--transition-base) modalIn;
// // //     }

// // //     .modal-header {
// // //       padding: var(--spacing-xl); border-bottom: 1px solid var(--border-subtle);
// // //       display: flex; justify-content: space-between; align-items: center;
// // //       h3 { font-family: var(--font-heading); margin: 0; font-size: var(--font-size-xl); }
// // //     }

// // //     .modal-body { padding: var(--spacing-xl); overflow-y: auto; max-height: 60vh; }

// // //     .modal-footer {
// // //       padding: var(--spacing-lg) var(--spacing-xl); background: var(--color-gray-50);
// // //       border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: var(--spacing-md);
// // //     }

// // //     /* --- Form Elements --- */
// // //     .form-field {
// // //       margin-bottom: var(--spacing-xl);
// // //       label { display: block; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-sm); color: var(--text-secondary); }
// // //     }

// // //     .input-addon {
// // //       display: flex; background: var(--color-gray-50); border: 1px solid var(--border-subtle); border-radius: var(--ui-border-radius);
// // //       &:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--focus-ring-color); }
// // //       .addon { padding: 0 var(--spacing-md); display: grid; place-items: center; color: var(--text-muted); border-right: 1px solid var(--border-subtle); }
// // //       input { flex: 1; background: transparent; border: none; padding: var(--spacing-md); outline: none; }
// // //     }

// // //     /* --- Radio Cards --- */
// // //     .radio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
// // //     .radio-card {
// // //       border: 1px solid var(--border-subtle); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-md); cursor: pointer; transition: 0.2s;
// // //       input { display: none; }
// // //       &.active { border-color: var(--color-primary); background: var(--color-primary-subtle); }
// // //       .radio-content { display: flex; align-items: flex-start; gap: var(--spacing-md); i { font-size: 1.2rem; color: var(--color-primary); } }
// // //       .text { strong { display: block; font-size: var(--font-size-base); } span { font-size: var(--font-size-xs); color: var(--text-muted); } }
// // //     }

// // //     /* --- Member Selection --- */
// // //     .selector-list { border: 1px solid var(--border-subtle); border-radius: var(--ui-border-radius); overflow: hidden; }
// // //     .selector-item {
// // //       display: flex; align-items: center; padding: var(--spacing-md); gap: var(--spacing-md); cursor: pointer; border-bottom: 1px solid var(--border-subtle);
// // //       input { display: none; }
// // //       &:last-child { border-bottom: none; }
// // //       &:hover { background: var(--color-gray-50); }
// // //       &.selected { background: var(--color-primary-subtle); .check-icon { opacity: 1; } }
// // //       .user-avatar { width: 32px; height: 32px; background: var(--color-gray-200); border-radius: 4px; display: grid; place-items: center; font-size: 10px; font-weight: bold; }
// // //       .user-name { flex: 1; font-size: var(--font-size-sm); }
// // //       .check-icon { color: var(--color-primary); opacity: 0; transition: 0.2s; }
// // //     }

// // //     /* --- Member Display List --- */
// // //     .member-row {
// // //       display: flex; align-items: center; padding: var(--spacing-md) 0; gap: var(--spacing-md); border-bottom: 1px solid var(--border-subtle);
// // //       .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-gray-100); display: grid; place-items: center; position: relative;
// // //         &.online::after { content: ''; position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid white; border-radius: 50%; }
// // //       }
// // //       .member-info { flex: 1; display: flex; align-items: center; gap: var(--spacing-sm); .name { font-weight: 500; } .tag { background: var(--color-gray-200); font-size: 10px; padding: 2px 4px; border-radius: 4px; } }
// // //       .status-indicator { font-size: var(--font-size-xs); color: #10b981; }
// // //     }

// // //     .btn-primary { background: var(--color-primary); color: white; border: none; padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--ui-border-radius); cursor: pointer; &:disabled { opacity: 0.5; } }
// // //     .btn-secondary { background: white; border: 1px solid var(--border-subtle); padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--ui-border-radius); cursor: pointer; }

// // //     @keyframes modalIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
// // //   `]
// // // })
// // // export class ChatModalsComponent {
// // //   public masterList = inject(MasterListService);

// // //   @Input() showCreateModal: boolean = false;
// // //   @Input() showChannelSettings: boolean = false;
// // //   @Input() showAddMembersModal: boolean = false;
// // //   @Input() newChannelName: string = '';
// // //   @Input() channelType: string = 'public';
// // //   @Input() selectedMembers: Set<string> = new Set();
// // //   @Input() newMembers: Set<string> = new Set();
// // //   @Input() activeChannelUsers: string[] = [];
// // //   @Input() currentUserId: string = '';
// // //   @Input() activeChannel: Channel | null = null;
// // //   @Input() onlineUsers: Set<string> = new Set();

// // //   @Output() closeCreateModal = new EventEmitter<void>();
// // //   @Output() closeChannelSettings = new EventEmitter<void>();
// // //   @Output() closeAddMembersModal = new EventEmitter<void>();
// // //   @Output() submitCreateChannel = new EventEmitter<void>();
// // //   @Output() submitAddMembers = new EventEmitter<void>();
// // //   @Output() toggleMemberSelection = new EventEmitter<string>();

// // //   getInitials(userId: string): string {
// // //     const user = this.getUserById(userId);
// // //     if (user?.name) {
// // //       return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
// // //     }
// // //     return userId.slice(0, 2).toUpperCase();
// // //   }

// // //   getUserName(userId: string): string {
// // //     const user = this.getUserById(userId);
// // //     return user?.name || 'User';
// // //   }

// // //   isUserOnline(userId: string): boolean {
// // //     return this.onlineUsers.has(userId);
// // //   }

// // //   private getUserById(userId: string): any {
// // //     const users = this.masterList.users();
// // //     return users.find(user => user._id === userId);
// // //   }
// // // }
