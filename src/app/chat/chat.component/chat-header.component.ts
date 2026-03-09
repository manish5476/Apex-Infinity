import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip'; 
import { Channel } from './chat.models';
import { MasterListService } from '../../core/services/master-list.service';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    <header class="header-surface">
      
      <div class="header-left">
        @if (mobileView) {
          <button class="btn-icon mobile-toggle" (click)="toggleSidebar.emit()">
            <i class="pi pi-bars"></i>
          </button>
        }
        
        <div class="channel-info">
          <div class="title-row">
            <div class="icon-wrapper">
               <i class="pi" [ngClass]="getChannelIcon()"></i>
            </div>
            <h2 class="channel-name">{{ activeChannel?.name || 'Select Workspace' }}</h2>
            @if (activeChannel?.type === 'public') {
               <span class="badge-public">Public</span>
            }
          </div>
          
          <div class="meta-row">
            @if (activeChannel) {
              <div class="avatar-stack">
                @for (userId of activeChannelUsers.slice(0, 3); track userId) {
                   @if (userId) {
                     <div class="avatar-circle" 
                          [style.z-index]="10 - $index" 
                          [pTooltip]="getUserName(userId)" 
                          tooltipPosition="bottom">
                       <span>{{ (getUserName(userId).charAt(0) || '?') | uppercase }}</span>
                     </div>
                   }
                }
                
                @if (activeChannelUsers.length > 3) {
                   <div class="avatar-circle more">+{{ activeChannelUsers.length - 3 }}</div>
                }
              </div>
              
              <span class="separator">•</span>
              <span class="status-text">{{ activeChannelUsers.length }} members</span>
            } @else {
               <span class="status-text">Welcome back!</span>
            }
          </div>
        </div>
      </div>

      <div class="header-center">
        <div class="search-bar">
           <i class="pi pi-search"></i>
           <input type="text" placeholder="Search messages..." />
        </div>
      </div>

      <div class="header-actions">
        
        <button class="btn-action primary" pTooltip="Add Members" tooltipPosition="bottom" (click)="addMembers.emit()">
          <i class="pi pi-user-plus"></i>
        </button>
        
        <button class="btn-action" pTooltip="Pinned Items" tooltipPosition="bottom">
           <i class="pi pi-bookmark"></i>
        </button>

        <div class="divider-vertical"></div>

        <button class="btn-action" pTooltip="Channel Settings" tooltipPosition="bottom" (click)="openSettings.emit()">
          <i class="pi pi-cog"></i>
        </button>
        
        <button class="btn-action" pTooltip="Details" tooltipPosition="bottom">
           <i class="pi pi-info-circle"></i>
        </button>

      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      z-index: 100;
      position: relative;
    }

    .header-surface {
      height: 72px;
      padding: 0 24px;
      background: var(--bg-secondary, #ffffff);
      border-bottom: 1px solid var(--border-primary, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .header-left {
      display: flex; 
      align-items: center; 
      gap: 16px;
      min-width: 200px;
    }

    .mobile-toggle {
       display: flex; 
       align-items: center; 
       justify-content: center;
       background: transparent; 
       border: none; 
       color: var(--text-primary);
       font-size: 1.2rem; 
       cursor: pointer;
    }

    .channel-info {
      display: flex; 
      flex-direction: column; 
      gap: 2px;
      
      .title-row {
        display: flex; 
        align-items: center; 
        gap: 8px;
        
        .icon-wrapper {
           color: var(--text-secondary);
           font-size: 1.1rem;
        }
        
        .channel-name {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .badge-public {
           font-size: 0.65rem;
           text-transform: uppercase;
           background: var(--bg-ternary, #f1f5f9);
           color: var(--text-secondary);
           padding: 2px 6px;
           border-radius: 4px;
           font-weight: 700;
           border: 1px solid var(--border-secondary, #cbd5e1);
        }
      }

      .meta-row {
        display: flex; 
        align-items: center; 
        gap: 8px;
        
        .status-text {
          font-size: 0.75rem;
          color: var(--text-tertiary, #64748b);
          font-weight: 500;
        }
        .separator { color: #cbd5e1; font-size: 0.8rem; }
      }
    }
    
    .avatar-stack {
       display: flex; 
       align-items: center;
       
       .avatar-circle {
          width: 24px; 
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #ffffff;
          color: white;
          font-size: 0.7rem;
          display: flex; 
          align-items: center; 
          justify-content: center;
          margin-left: -8px;
          
          &:first-child { margin-left: 0; }
          &.more { 
            background: #f1f5f9; 
            color: #64748b; 
            border-color: #e2e8f0; 
            font-weight: 600;
          }
       }
    }

    .header-center {
       flex: 1;
       display: flex; 
       justify-content: center;
       @media (max-width: 768px) { display: none; }
    }
    
    .search-bar {
       display: flex; 
       align-items: center; 
       gap: 8px;
       background: #f1f5f9;
       border: 1px solid #e2e8f0;
       padding: 8px 16px;
       border-radius: 20px;
       width: 100%; 
       max-width: 320px;
       
       i { color: #94a3b8; }
       
       input {
          background: transparent; 
          border: none; 
          outline: none;
          color: #1e293b; 
          width: 100%;
          font-size: 0.875rem;
          &::placeholder { color: #94a3b8; }
       }
    }

    .header-actions {
      display: flex; 
      align-items: center; 
      gap: 8px;
    }
    
    .divider-vertical {
       width: 1px; 
       height: 24px;
       background: #e2e8f0;
       margin: 0 4px;
    }

    .btn-action {
      background: transparent;
      border: none;
      width: 36px; 
      height: 36px;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      display: grid; 
      place-items: center;
      transition: all 0.2s;
      font-size: 1.1rem;

      &:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
      
      &.primary {
         background: #eff6ff;
         color: #3b82f6;
         &:hover {
            background: #3b82f6;
            color: #ffffff;
         }
      }
    }
  `]
})
export class ChatHeaderComponent {
  private masterList = inject(MasterListService);

  @Input() activeChannel: Channel | null = null;
  @Input() activeChannelUsers: string[] = []; // Expects array of User IDs
  @Input() mobileView: boolean = false;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();
  @Output() addMembers = new EventEmitter<void>();

  /**
   * Safe lookup for user names from the MasterList.
   * Prevents crashes if the ID is null or user isn't loaded.
   */
  getUserName(userId: string): string {
    if (!userId) return 'Unknown User';
    const user = this.masterList.users().find(u => u._id === userId);
    return user ? user.name : 'User';
  }

  getChannelIcon(): string {
    if (!this.activeChannel) return 'pi-hashtag';
    switch (this.activeChannel.type) {
      case 'private': return 'pi-lock';
      case 'dm': return 'pi-user';
      default: return 'pi-hashtag';
    }
  }
}




// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TooltipModule } from 'primeng/tooltip'; // PrimeNG Tooltip
// import { Channel } from './chat.models';

// @Component({
//   selector: 'app-chat-header',
//   standalone: true,
//   imports: [CommonModule, TooltipModule],
//   template: `
//     <header class="header-surface">
      
//       <div class="header-left">
//         @if (mobileView) {
//           <button class="btn-icon mobile-toggle" (click)="toggleSidebar.emit()">
//             <i class="pi pi-bars"></i>
//           </button>
//         }
        
//         <div class="channel-info">
//           <div class="title-row">
//             <div class="icon-wrapper">
//                <i class="pi" [ngClass]="getChannelIcon()"></i>
//             </div>
//             <h2 class="channel-name">{{ activeChannel?.name || 'Select Workspace' }}</h2>
//             @if (activeChannel?.type === 'public') {
//                <span class="badge-public">Public</span>
//             }
//           </div>
          
//           <div class="meta-row">
//             @if (activeChannel) {
//               <div class="avatar-stack">
//                 @for (user of activeChannelUsers.slice(0, 3); track $index) {
//                    <div class="avatar-circle" [style.z-index]="10 - $index">
//                       <span>{{ user.charAt(0) | uppercase }}</span>
//                    </div>
//                 }
//                 @if (activeChannelUsers.length > 3) {
//                    <div class="avatar-circle more">+{{ activeChannelUsers.length - 3 }}</div>
//                 }
//               </div>
              
//               <span class="separator">•</span>
//               <span class="status-text">{{ activeChannelUsers.length }} members online</span>
//             } @else {
//                <span class="status-text">Welcome back!</span>
//             }
//           </div>
//         </div>
//       </div>

//       <div class="header-center">
//         <div class="search-bar">
//            <i class="pi pi-search"></i>
//            <input type="text" placeholder="Search messages..." />
//         </div>
//       </div>

//       <div class="header-actions">
        
//         <button class="btn-action primary" pTooltip="Add Members" tooltipPosition="bottom" (click)="addMembers.emit()">
//           <i class="pi pi-user-plus"></i>
//         </button>
        
//         <button class="btn-action" pTooltip="Pinned Items" tooltipPosition="bottom">
//            <i class="pi pi-bookmark"></i>
//         </button>

//         <div class="divider-vertical"></div>

//         <button class="btn-action" pTooltip="Channel Settings" tooltipPosition="bottom" (click)="openSettings.emit()">
//           <i class="pi pi-cog"></i>
//         </button>
        
//         <button class="btn-action" pTooltip="Details" tooltipPosition="bottom">
//            <i class="pi pi-info-circle"></i>
//         </button>

//       </div>
//     </header>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       z-index: var(--z-sticky);
//       position: relative;
//     }

//     .header-surface {
//       height: 72px; /* Slightly taller for cleaner layout */
//       padding: 0 var(--spacing-xl);
      
//       /* Theme Background Mapping */
//       background: var(--bg-secondary);
//       border-bottom: 1px solid var(--border-primary);
      
//       /* Flex Layout */
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       gap: var(--spacing-xl);
      
//       /* Shadow for depth */
//       box-shadow: var(--shadow-sm);
//     }

//     /* --- LEFT SECTION --- */
//     .header-left {
//       display: flex; align-items: center; gap: var(--spacing-lg);
//       min-width: 200px;
//     }

//     .mobile-toggle {
//        display: flex; align-items: center; justify-content: center;
//        background: transparent; border: none; color: var(--text-primary);
//        font-size: 1.2rem; cursor: pointer;
//     }

//     .channel-info {
//       display: flex; flex-direction: column; gap: 2px;
      
//       .title-row {
//         display: flex; align-items: center; gap: var(--spacing-sm);
        
//         .icon-wrapper {
//            color: var(--text-secondary);
//            font-size: 1.1rem;
//         }
        
//         .channel-name {
//           margin: 0;
//           font-family: var(--font-heading);
//           font-size: var(--font-size-lg);
//           font-weight: var(--font-weight-bold);
//           color: var(--text-primary);
//         }
        
//         .badge-public {
//            font-size: 0.6rem;
//            text-transform: uppercase;
//            background: var(--bg-ternary);
//            color: var(--text-secondary);
//            padding: 2px 6px;
//            border-radius: 4px;
//            font-weight: 700;
//            border: 1px solid var(--border-secondary);
//         }
//       }

//       .meta-row {
//         display: flex; align-items: center; gap: var(--spacing-sm);
        
//         .status-text {
//           font-size: var(--font-size-xs);
//           color: var(--text-tertiary);
//           font-weight: var(--font-weight-medium);
//         }
//         .separator { color: var(--border-secondary); font-size: 0.8rem; }
//       }
//     }
    
//     /* Avatar Stack */
//     .avatar-stack {
//        display: flex; align-items: center;
       
//        .avatar-circle {
//           width: 20px; height: 20px;
//           border-radius: 50%;
//           background: var(--accent-primary);
//           border: 2px solid var(--bg-secondary); /* Cutout effect */
//           color: white;
//           font-size: 0.6rem;
//           display: flex; align-items: center; justify-content: center;
//           margin-left: -6px;
          
//           &:first-child { margin-left: 0; }
//           &.more { background: var(--bg-ternary); color: var(--text-secondary); border-color: var(--border-primary); }
//        }
//     }

//     /* --- CENTER SECTION (Search) --- */
//     .header-center {
//        flex: 1;
//        display: flex; justify-content: center;
//        @media (max-width: 768px) { display: none; }
//     }
    
//     .search-bar {
//        display: flex; align-items: center; gap: var(--spacing-sm);
//        background: var(--bg-ternary);
//        border: 1px solid var(--border-secondary);
//        padding: 8px 16px;
//        border-radius: 20px;
//        width: 100%; max-width: 400px;
//        transition: var(--transition-base);
       
//        i { color: var(--text-tertiary); }
       
//        input {
//           background: transparent; border: none; outline: none;
//           color: var(--text-primary); width: 100%;
//           font-size: var(--font-size-sm);
//           &::placeholder { color: var(--text-tertiary); }
//        }
       
//        &:focus-within {
//           border-color: var(--accent-primary);
//           box-shadow: 0 0 0 2px var(--focus-ring-color);
//           background: var(--bg-primary);
//        }
//     }

//     /* --- RIGHT SECTION (Actions) --- */
//     .header-actions {
//       display: flex; align-items: center; gap: var(--spacing-sm);
//     }
    
//     .divider-vertical {
//        width: 1px; height: 24px;
//        background: var(--border-secondary);
//        margin: 0 var(--spacing-xs);
//     }

//     .btn-action {
//       background: transparent;
//       border: none;
//       width: 36px; height: 36px;
//       border-radius: var(--ui-border-radius);
//       color: var(--text-secondary);
//       cursor: pointer;
//       display: grid; place-items: center;
//       transition: var(--transition-base);
//       font-size: 1.1rem;

//       &:hover {
//         background: var(--bg-hover);
//         color: var(--text-primary);
//       }
      
//       /* Primary Action Button (Add Member) */
//       &.primary {
//          background: var(--color-primary-bg); /* Tinted background */
//          color: var(--accent-primary);
         
//          &:hover {
//             background: var(--accent-primary);
//             color: #ffffff;
//             box-shadow: var(--shadow-sm);
//          }
//       }
//     }
//   `]
// })
// export class ChatHeaderComponent {
//   @Input() activeChannel: Channel | null = null;
//   @Input() activeChannelUsers: string[] = [];
//   @Input() mobileView: boolean = false;

//   @Output() toggleSidebar = new EventEmitter<void>();
//   @Output() openSettings = new EventEmitter<void>();
//   @Output() addMembers = new EventEmitter<void>();

//   getChannelIcon(): string {
//     if (!this.activeChannel) return 'pi-hashtag';
//     switch (this.activeChannel.type) {
//       case 'private': return 'pi-lock';
//       case 'dm': return 'pi-user';
//       default: return 'pi-hashtag';
//     }
//   }
// }