import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from './chat.models';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header-surface">
      <div class="header-left">
        @if (mobileView) {
          <button class="btn-ghost-circle" (click)="toggleSidebar.emit()">
            <i class="pi pi-bars"></i>
          </button>
        }
        
        <div class="channel-meta">
          <div class="title-row">
            <i class="pi" [ngClass]="getChannelIcon()"></i>
            <h2 class="channel-name">{{ activeChannel?.name || 'Select Workspace' }}</h2>
          </div>
          <div class="status-row">
            <span class="presence-dot"></span>
            <span class="member-count">{{ activeChannelUsers.length }} members online</span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn-ghost-primary" title="Add members" (click)="addMembers.emit()">
          <i class="pi pi-user-plus"></i>
        </button>
        <button class="btn-ghost" title="Channel settings" (click)="openSettings.emit()">
          <i class="pi pi-cog"></i>
        </button>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      z-index: var(--z-sticky);
    }

    .header-surface {
      height: 64px;
      padding: 0 var(--spacing-xl);
      background: var(--bg-surface-glass);
      backdrop-filter: blur(12px);
      border-bottom: var(--ui-border-width) solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: var(--shadow-sm);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .channel-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .title-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        
        i {
          font-size: var(--font-size-md);
          color: var(--text-muted);
        }

        .channel-name {
          margin: 0;
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          line-height: var(--line-height-tight);
        }
      }

      .status-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        
        .presence-dot {
          width: 6px;
          height: 6px;
          background: #10b981; // Success Green
          border-radius: 50%;
        }

        .member-count {
          font-size: var(--font-size-xs);
          color: var(--text-muted);
          font-weight: var(--font-weight-medium);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    /* --- Action Buttons --- */
    .btn-ghost, .btn-ghost-primary, .btn-ghost-circle {
      background: transparent;
      border: none;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: var(--transition-fast);
      color: var(--text-secondary);
      padding: var(--spacing-sm);
      border-radius: var(--ui-border-radius);

      &:hover {
        background: var(--color-gray-100);
        color: var(--text-primary);
      }
    }

    .btn-ghost-primary:hover {
      background: var(--color-primary-subtle);
      color: var(--color-primary);
    }

    .btn-ghost-circle {
      border-radius: 50%;
      width: 36px;
      height: 36px;
    }

    i { font-size: 1.1rem; }
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
//     <div class="chat-header">
//       <div class="header-left">
//         @if (mobileView) {
//         <button class="back" (click)="toggleSidebar.emit()">
//           <i class="pi pi-arrow-left"></i>
//         </button>
//         }
//         <div class="channel-info">
//           <h2>
//             <i class="pi pi-hashtag"></i>
//             {{ activeChannel?.name }}
//             @if (activeChannel?.type === 'private') {
//             <i class="pi pi-lock"></i>
//             } @else if (activeChannel?.type === 'dm') {
//             <i class="pi pi-user"></i>
//             }
//           </h2>
//           <p>{{ activeChannelUsers.length }} members online</p>
//         </div>
//       </div>
//       <!-- In chat-header.component.html -->
// <div class="header-actions">
//   <button class="btn-icon" title="Add members" (click)="addMembers.emit()">
//     <i class="pi pi-user-plus"></i>
//   </button>
//   <button class="btn-icon" title="Channel settings" (click)="openSettings.emit()">
//     <i class="pi pi-cog"></i>
//   </button>
// </div>
//       <!-- <div class="header-actions">
//         <button class="btn-icon" title="Channel settings" (click)="openSettings.emit()">
//           <i class="pi pi-cog"></i>
//         </button>
//       </div> -->
//     </div>
//   `,
//   styleUrls: ['./chat.component.scss']
// })
// export class ChatHeaderComponent {
//   @Input() activeChannel: Channel | null = null;
//   @Input() activeChannelUsers: string[] = [];
//   @Input() mobileView: boolean = false;

//   @Output() toggleSidebar = new EventEmitter<void>();
//   @Output() openSettings = new EventEmitter<void>();
//   // In chat-header.component.ts
// @Output() addMembers = new EventEmitter<void>();


// }