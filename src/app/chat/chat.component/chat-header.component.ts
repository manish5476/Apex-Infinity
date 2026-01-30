import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip'; // PrimeNG Tooltip
import { Channel } from './chat.models';

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
                @for (user of activeChannelUsers.slice(0, 3); track $index) {
                   <div class="avatar-circle" [style.z-index]="10 - $index">
                      <span>{{ user.charAt(0) | uppercase }}</span>
                   </div>
                }
                @if (activeChannelUsers.length > 3) {
                   <div class="avatar-circle more">+{{ activeChannelUsers.length - 3 }}</div>
                }
              </div>
              
              <span class="separator">•</span>
              <span class="status-text">{{ activeChannelUsers.length }} members online</span>
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
      z-index: var(--z-sticky);
      position: relative;
    }

    .header-surface {
      height: 72px; /* Slightly taller for cleaner layout */
      padding: 0 var(--spacing-xl);
      
      /* Theme Background Mapping */
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary);
      
      /* Flex Layout */
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-xl);
      
      /* Shadow for depth */
      box-shadow: var(--shadow-sm);
    }

    /* --- LEFT SECTION --- */
    .header-left {
      display: flex; align-items: center; gap: var(--spacing-lg);
      min-width: 200px;
    }

    .mobile-toggle {
       display: flex; align-items: center; justify-content: center;
       background: transparent; border: none; color: var(--text-primary);
       font-size: 1.2rem; cursor: pointer;
    }

    .channel-info {
      display: flex; flex-direction: column; gap: 2px;
      
      .title-row {
        display: flex; align-items: center; gap: var(--spacing-sm);
        
        .icon-wrapper {
           color: var(--text-secondary);
           font-size: 1.1rem;
        }
        
        .channel-name {
          margin: 0;
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }
        
        .badge-public {
           font-size: 0.6rem;
           text-transform: uppercase;
           background: var(--bg-ternary);
           color: var(--text-secondary);
           padding: 2px 6px;
           border-radius: 4px;
           font-weight: 700;
           border: 1px solid var(--border-secondary);
        }
      }

      .meta-row {
        display: flex; align-items: center; gap: var(--spacing-sm);
        
        .status-text {
          font-size: var(--font-size-xs);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
        }
        .separator { color: var(--border-secondary); font-size: 0.8rem; }
      }
    }
    
    /* Avatar Stack */
    .avatar-stack {
       display: flex; align-items: center;
       
       .avatar-circle {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--accent-primary);
          border: 2px solid var(--bg-secondary); /* Cutout effect */
          color: white;
          font-size: 0.6rem;
          display: flex; align-items: center; justify-content: center;
          margin-left: -6px;
          
          &:first-child { margin-left: 0; }
          &.more { background: var(--bg-ternary); color: var(--text-secondary); border-color: var(--border-primary); }
       }
    }

    /* --- CENTER SECTION (Search) --- */
    .header-center {
       flex: 1;
       display: flex; justify-content: center;
       @media (max-width: 768px) { display: none; }
    }
    
    .search-bar {
       display: flex; align-items: center; gap: var(--spacing-sm);
       background: var(--bg-ternary);
       border: 1px solid var(--border-secondary);
       padding: 8px 16px;
       border-radius: 20px;
       width: 100%; max-width: 400px;
       transition: var(--transition-base);
       
       i { color: var(--text-tertiary); }
       
       input {
          background: transparent; border: none; outline: none;
          color: var(--text-primary); width: 100%;
          font-size: var(--font-size-sm);
          &::placeholder { color: var(--text-tertiary); }
       }
       
       &:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--focus-ring-color);
          background: var(--bg-primary);
       }
    }

    /* --- RIGHT SECTION (Actions) --- */
    .header-actions {
      display: flex; align-items: center; gap: var(--spacing-sm);
    }
    
    .divider-vertical {
       width: 1px; height: 24px;
       background: var(--border-secondary);
       margin: 0 var(--spacing-xs);
    }

    .btn-action {
      background: transparent;
      border: none;
      width: 36px; height: 36px;
      border-radius: var(--ui-border-radius);
      color: var(--text-secondary);
      cursor: pointer;
      display: grid; place-items: center;
      transition: var(--transition-base);
      font-size: 1.1rem;

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }
      
      /* Primary Action Button (Add Member) */
      &.primary {
         background: var(--color-primary-bg); /* Tinted background */
         color: var(--accent-primary);
         
         &:hover {
            background: var(--accent-primary);
            color: #ffffff;
            box-shadow: var(--shadow-sm);
         }
      }
    }
  `]
})
export class ChatHeaderComponent {
  @Input() activeChannel: Channel | null = null;
  @Input() activeChannelUsers: string[] = [];
  @Input() mobileView: boolean = false;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();
  @Output() addMembers = new EventEmitter<void>();

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
// import { Channel } from './chat.models';

// @Component({
//   selector: 'app-chat-header',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <header class="header-surface">
//       <div class="header-left">
//         @if (mobileView) {
//           <button class="btn-ghost-circle" (click)="toggleSidebar.emit()">
//             <i class="pi pi-bars"></i>
//           </button>
//         }
        
//         <div class="channel-meta">
//           <div class="title-row">
//             <i class="pi" [ngClass]="getChannelIcon()"></i>
//             <h2 class="channel-name">{{ activeChannel?.name || 'Select Workspace' }}</h2>
//           </div>
//           <div class="status-row">
//             <span class="presence-dot"></span>
//             <span class="member-count">{{ activeChannelUsers.length }} members online</span>
//           </div>
//         </div>
//       </div>

//       <div class="header-actions">
//         <button class="btn-ghost-primary" title="Add members" (click)="addMembers.emit()">
//           <i class="pi pi-user-plus"></i>
//         </button>
//         <button class="btn-ghost" title="Channel settings" (click)="openSettings.emit()">
//           <i class="pi pi-cog"></i>
//         </button>
//       </div>
//     </header>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       z-index: var(--z-sticky);
//     }

//     .header-surface {
//       height: 64px;
//       padding: 0 var(--spacing-xl);
//       background: var(--bg-surface-glass);
//       backdrop-filter: blur(12px);
//       border-bottom: var(--ui-border-width) solid var(--border-subtle);
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       box-shadow: var(--shadow-sm);
//     }

//     .header-left {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-lg);
//     }

//     .channel-meta {
//       display: flex;
//       flex-direction: column;
//       gap: 2px;

//       .title-row {
//         display: flex;
//         align-items: center;
//         gap: var(--spacing-sm);
        
//         i {
//           font-size: var(--font-size-md);
//           color: var(--text-muted);
//         }

//         .channel-name {
//           margin: 0;
//           font-family: var(--font-heading);
//           font-size: var(--font-size-lg);
//           font-weight: var(--font-weight-semibold);
//           color: var(--text-primary);
//           line-height: var(--line-height-tight);
//         }
//       }

//       .status-row {
//         display: flex;
//         align-items: center;
//         gap: var(--spacing-xs);
        
//         .presence-dot {
//           width: 6px;
//           height: 6px;
//           background: #10b981; // Success Green
//           border-radius: 50%;
//         }

//         .member-count {
//           font-size: var(--font-size-xs);
//           color: var(--text-muted);
//           font-weight: var(--font-weight-medium);
//         }
//       }
//     }

//     .header-actions {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//     }

//     /* --- Action Buttons --- */
//     .btn-ghost, .btn-ghost-primary, .btn-ghost-circle {
//       background: transparent;
//       border: none;
//       cursor: pointer;
//       display: grid;
//       place-items: center;
//       transition: var(--transition-fast);
//       color: var(--text-secondary);
//       padding: var(--spacing-sm);
//       border-radius: var(--ui-border-radius);

//       &:hover {
//         background: var(--color-gray-100);
//         color: var(--text-primary);
//       }
//     }

//     .btn-ghost-primary:hover {
//       background: var(--color-primary-subtle);
//       color: var(--color-primary);
//     }

//     .btn-ghost-circle {
//       border-radius: 50%;
//       width: 36px;
//       height: 36px;
//     }

//     i { font-size: 1.1rem; }
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
