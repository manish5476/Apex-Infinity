import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { Channel } from './chat.models';
import { MasterListService } from '../../core/services/master-list.service';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    <aside class="sidebar-surface" [class.is-collapsed]="!sidebarOpen">
      
      <div class="profile-area">
        <div class="user-block">
          <div class="user-avatar-main">
            {{ getInitials(currentUserId) }}
            <span class="status-indicator online"></span>
          </div>
          <div class="user-meta">
            <h4 class="user-name">{{ getUserName(currentUserId) }}</h4>
            <span class="org-label">Apex Workspace</span>
          </div>
        </div>
        <button class="btn-action-circle" (click)="createChannel.emit()" pTooltip="New Channel" tooltipPosition="bottom">
          <i class="pi pi-plus"></i>
        </button>
      </div>

      <div class="sidebar-scroller custom-scrollbar">
        
        <div class="nav-section">
          <div class="section-header">
            <span class="title">Channels</span>
            <span class="badge-count">{{ channels.length }}</span>
          </div>
          
          <div class="item-list">
            @for (ch of channels; track ch._id) {
              <div class="nav-item" 
                   [class.is-active]="ch._id === activeChannelId"
                   [class.is-disabled]="ch.isActive === false"
                   (click)="channelSelected.emit(ch)">
                
                <div class="item-prefix">
                  <i class="pi" [ngClass]="getChannelIcon(ch.type)"></i>
                </div>
                <span class="item-label">{{ ch.name || 'Unnamed' }}</span>
                
                @if (unreadCounts[ch._id] > 0) {
                  <span class="unread-pill">{{ unreadCounts[ch._id] }}</span>
                }
              </div>
            } @empty {
              <div class="empty-state">No channels found</div>
            }
          </div>
        </div>

        @if (activeChannelUsers.length > 0) {
          <div class="nav-section">
            <div class="section-header">
              <span class="title">Direct Messages</span>
            </div>
            
            <div class="item-list">
              @for (userId of activeChannelUsers; track userId) {
                @if (userId !== currentUserId) {
                  <div class="nav-item user-row">
                    <div class="user-avatar-sm">
                      {{ getInitials(userId) }}
                      @if (isUserOnline(userId)) { <span class="status-dot"></span> }
                    </div>
                    <span class="item-label">{{ getUserName(userId) }}</span>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>
      
      <div class="sidebar-footer">
         <button class="btn-footer">
            <i class="pi pi-cog"></i> Preferences
         </button>
      </div>

    </aside>
  `,
  styles: [`
    /* =========================================
       THEME MAPPING (Using Project Tokens)
       ========================================= */
    :host { 
      display: block; 
      height: 100%; 
      position: relative;
      z-index: var(--z-fixed);
    }

    .sidebar-surface {
      width: 280px; 
      height: 100%; 
      background: var(--bg-ternary); /* Darker sidebar background */
      border-right: 1px solid var(--border-primary);
      display: flex; flex-direction: column; 
      transition: width var(--transition-base), transform var(--transition-base);
      
      &.is-collapsed {
         display: none; /* Or use transform: translateX(-100%) for animation */
      }
    }

    /* --- Profile Area --- */
    .profile-area {
      padding: var(--spacing-lg) var(--spacing-xl);
      height: 72px; /* Matches header height */
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border-secondary);
      background: var(--bg-secondary); /* Slightly lighter header */
    }

    .user-block {
      display: flex; align-items: center; gap: var(--spacing-md);
      
      .user-avatar-main {
        width: 36px; height: 36px; border-radius: var(--ui-border-radius);
        background: var(--accent-primary); color: white; 
        display: grid; place-items: center;
        font-weight: 700; position: relative; font-size: var(--font-size-sm);
        
        .status-indicator {
          position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px;
          border-radius: 50%; border: 2px solid var(--bg-secondary);
          &.online { background: var(--color-success); }
        }
      }
      
      .user-meta {
        .user-name { 
          margin: 0; font-size: var(--font-size-sm); font-weight: 600; 
          color: var(--text-primary); font-family: var(--font-heading);
        }
        .org-label { 
          font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; 
        }
      }
    }
    
    .btn-action-circle {
      width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border-secondary);
      background: var(--bg-primary); color: var(--text-secondary);
      cursor: pointer; display: grid; place-items: center; transition: var(--transition-base);
      
      &:hover { 
        background: var(--accent-primary); color: white; border-color: var(--accent-primary); 
        transform: rotate(90deg);
      }
    }

    /* --- Scroller --- */
    .sidebar-scroller { 
      flex: 1; overflow-y: auto; padding: var(--spacing-lg) var(--spacing-md); 
    }

    /* --- Sections --- */
    .nav-section {
      margin-bottom: var(--spacing-xl);
      
      .section-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0 var(--spacing-sm) var(--spacing-xs); 
        margin-bottom: var(--spacing-xs);
        
        .title { 
          font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary); 
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .badge-count { 
          background: var(--bg-hover); color: var(--text-secondary);
          padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 600;
        }
      }
    }

    /* --- Nav Items --- */
    .nav-item {
      display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--ui-border-radius); cursor: pointer; 
      transition: var(--transition-colors);
      margin-bottom: 2px;
      color: var(--text-secondary);
      
      &:hover { 
        background: var(--bg-hover); color: var(--text-primary); 
      }
      
      &.is-active { 
        background: var(--accent-focus); color: var(--accent-primary); 
        font-weight: 500;
        
        .item-prefix { color: var(--accent-primary); }
      }
      
      &.is-disabled { opacity: 0.5; pointer-events: none; }
      
      .item-prefix { 
        color: var(--text-tertiary); font-size: 1rem; display: grid; place-items: center; width: 20px;
      }
      
      .item-label { 
        flex: 1; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
      }
      
      .unread-pill { 
        background: var(--color-error); color: white; 
        font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 10px; 
      }
    }

    /* --- User Row Specifics --- */
    .user-row {
       .user-avatar-sm {
          width: 24px; height: 24px; border-radius: 4px; 
          background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-secondary);
          display: grid; place-items: center; font-size: 0.65rem; font-weight: 700;
          position: relative;
          
          .status-dot {
             position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; 
             background: var(--color-success); border-radius: 50%; border: 1px solid var(--bg-ternary);
          }
       }
    }

    /* --- Footer --- */
    .sidebar-footer {
       padding: var(--spacing-md); border-top: 1px solid var(--border-secondary);
       background: var(--bg-secondary);
       
       .btn-footer {
          width: 100%; text-align: left; padding: var(--spacing-sm);
          background: transparent; border: none; color: var(--text-secondary);
          font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: var(--spacing-sm);
          border-radius: var(--ui-border-radius);
          &:hover { background: var(--bg-hover); color: var(--text-primary); }
       }
    }

    .empty-state { 
      padding: var(--spacing-lg); font-size: 0.8rem; color: var(--text-tertiary); 
      text-align: center; font-style: italic; 
    }
  `]
})
export class ChatSidebarComponent {
  private masterList = inject(MasterListService);

  @Input() channels: Channel[] = [];
  @Input() activeChannelId: string | null = null;
  @Input() currentUserId: string = '';
  @Input() sidebarOpen: boolean = true;
  @Input() unreadCounts: Record<string, number> = {};
  @Input() activeChannelUsers: string[] = [];
  @Input() onlineUsers: Set<string> = new Set();
  @Input() mobileView: boolean = false;
  
  @Output() channelSelected = new EventEmitter<Channel>();
  @Output() createChannel = new EventEmitter<void>();

  getInitials(userId: string): string {
    const user = this.getUserById(userId);
    return user?.name ? user.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  }

  getUserName(userId: string): string {
    return this.getUserById(userId)?.name || 'User';
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getChannelIcon(type?: string): string {
    if (type === 'private') return 'pi-lock';
    if (type === 'dm') return 'pi-user';
    return 'pi-hashtag';
  }

  private getUserById(userId: string): any {
    return this.masterList.users().find(u => u._id === userId);
  }
}

// import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Channel } from './chat.models';
// import { MasterListService } from '../../core/services/master-list.service';

// @Component({
//   selector: 'app-chat-sidebar',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <aside class="sidebar-surface" [class.is-collapsed]="!sidebarOpen">
//       <div class="profile-area">
//         <div class="user-block">
//           <div class="user-avatar-main">
//             {{ getInitials(currentUserId) }}
//             <span class="status-indicator online"></span>
//           </div>
//           <div class="user-meta">
//             <h4 class="user-name">{{ getUserName(currentUserId) }}</h4>
//             <span class="org-label">Apex Workspace</span>
//           </div>
//         </div>
//         <button class="btn-action-circle" (click)="createChannel.emit()" title="New Channel">
//           <i class="pi pi-plus"></i>
//         </button>
//       </div>

//       <div class="sidebar-scroller">
//         <div class="nav-section">
//           <div class="section-header">
//             <span class="title">Channels</span>
//             <span class="badge-count">{{ channels.length }}</span>
//           </div>
          
//           <div class="item-list">
//             @for (ch of channels; track ch._id) {
//               <div class="nav-item" 
//                    [class.is-active]="ch._id === activeChannelId"
//                    [class.is-disabled]="ch.isActive === false"
//                    (click)="channelSelected.emit(ch)">
//                 <div class="item-prefix">
//                   <i class="pi" [ngClass]="getChannelIcon(ch.type)"></i>
//                 </div>
//                 <span class="item-label">{{ ch.name || 'Unnamed' }}</span>
                
//                 @if (unreadCounts[ch._id] > 0) {
//                   <span class="unread-pill">{{ unreadCounts[ch._id] }}</span>
//                 }
//               </div>
//             } @empty {
//               <div class="empty-state">No channels found</div>
//             }
//           </div>
//         </div>

//         @if (activeChannelUsers.length > 0) {
//         <div class="nav-section">
//           <div class="section-header">
//             <span class="title">Active Now</span>
//           </div>
          
//           <div class="item-list">
//             @for (userId of activeChannelUsers; track userId) {
//               @if (userId !== currentUserId) {
//                 <div class="nav-item user-row">
//                   <div class="user-avatar-sm" [class.is-online]="isUserOnline(userId)">
//                     {{ getInitials(userId) }}
//                   </div>
//                   <span class="item-label">{{ getUserName(userId) }}</span>
//                 </div>
//               }
//             }
//           </div>
//         </div>
//         }
//       </div>
//     </aside>
//   `,
//   styles: [`
//     :host { display: block; height: 100%; }

//     .sidebar-surface {
//       width: 280px; height: 100%; background: var(--color-gray-900);
//       border-right: var(--ui-border-width) solid var(--color-gray-800);
//       display: flex; flex-direction: column; transition: var(--transition-base);
//       color: var(--color-gray-300);
//     }

//     /* --- Profile Area --- */
//     .profile-area {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       height: 72px; display: flex; align-items: center; justify-content: space-between;
//       border-bottom: var(--ui-border-width) solid var(--color-gray-800);
//       background: rgba(0,0,0,0.1);
//     }

//     .user-block {
//       display: flex; align-items: center; gap: var(--spacing-md);
//       .user-avatar-main {
//         width: 36px; height: 36px; border-radius: var(--ui-border-radius);
//         background: var(--color-primary); color: white; display: grid; place-items: center;
//         font-weight: bold; position: relative; font-size: var(--font-size-sm);
//         .status-indicator {
//           position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px;
//           border-radius: 50%; border: 2px solid var(--color-gray-900);
//           &.online { background: #10b981; }
//         }
//       }
//       .user-meta {
//         .user-name { margin: 0; font-size: var(--font-size-sm); color: white; }
//         .org-label { font-size: 10px; color: var(--color-gray-500); text-transform: uppercase; }
//       }
//     }

//     /* --- Sections & Items --- */
//     .sidebar-scroller { flex: 1; overflow-y: auto; padding: var(--spacing-md); }

//     .nav-section {
//       margin-bottom: var(--spacing-xl);
//       .section-header {
//         display: flex; justify-content: space-between; align-items: center;
//         padding: var(--spacing-sm) var(--spacing-md); margin-bottom: var(--spacing-xs);
//         .title { font-size: var(--font-size-xs); font-weight: bold; color: var(--color-gray-600); text-transform: uppercase; }
//         .badge-count { background: var(--color-gray-800); padding: 0 6px; border-radius: 4px; font-size: 10px; }
//       }
//     }

//     .nav-item {
//       display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius); cursor: pointer; transition: 0.2s;
//       margin-bottom: 2px;
//       &:hover { background: var(--color-gray-800); color: white; }
//       &.is-active { background: var(--color-primary); color: white; box-shadow: var(--shadow-sm); }
//       &.is-disabled { opacity: 0.3; pointer-events: none; }
      
//       .item-label { flex: 1; font-size: var(--font-size-base); }
//       .unread-pill { background: var(--color-primary); color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 10px; }
//     }

//     .user-avatar-sm {
//       width: 24px; height: 24px; border-radius: 4px; background: var(--color-gray-700);
//       display: grid; place-items: center; font-size: 10px; font-weight: bold;
//       position: relative;
//       &.is-online::after { content: ''; position: absolute; top: -1px; right: -1px; width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
//     }

//     .btn-action-circle {
//       width: 32px; height: 32px; border-radius: 50%; border: none;
//       background: var(--color-gray-800); color: var(--color-gray-400);
//       cursor: pointer; transition: 0.2s;
//       &:hover { background: var(--color-primary); color: white; transform: rotate(90deg); }
//     }

//     .empty-state { padding: var(--spacing-md); font-size: var(--font-size-xs); color: var(--color-gray-700); text-align: center; }
//   `]
// })
// export class ChatSidebarComponent {
//   private masterList = inject(MasterListService);

//   @Input() channels: Channel[] = [];
//   @Input() activeChannelId: string | null = null;
//   @Input() currentUserId: string = '';
//   @Input() sidebarOpen: boolean = true;
//   @Input() unreadCounts: Record<string, number> = {};
//   @Input() activeChannelUsers: string[] = [];
//   @Input() onlineUsers: Set<string> = new Set();
//   @Input() mobileView: boolean = false;
//   @Output() channelSelected = new EventEmitter<Channel>();
//   @Output() createChannel = new EventEmitter<void>();

//   getInitials(userId: string): string {
//     const user = this.getUserById(userId);
//     return user?.name ? user.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2) : '??';
//   }

//   getUserName(userId: string): string {
//     return this.getUserById(userId)?.name || 'User';
//   }

//   isUserOnline(userId: string): boolean {
//     return this.onlineUsers.has(userId);
//   }

//   getChannelIcon(type?: string): string {
//     if (type === 'private') return 'pi-lock';
//     if (type === 'dm') return 'pi-user';
//     return 'pi-hashtag';
//   }

//   private getUserById(userId: string): any {
//     return this.masterList.users().find(u => u._id === userId);
//   }
// }