import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel, ChatMessage } from './chat.models';

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="messages-viewport" #scrollContainer (scroll)="onScroll($event)">
      @if (loadingMore) {
        <div class="system-loader"><i class="pi pi-spin pi-spinner"></i></div>
      }

      <div class="message-feed">
        @for (msg of messages; track msg._id; let i = $index) {
          @if (showDateSeparator(i, msg)) {
            <div class="date-row">
              <span class="date-label">{{ msg.createdAt | date:'MMMM d, y' }}</span>
            </div>
          }

          <div class="message-group" 
               [class.mine]="isMine(msg)" 
               [class.consecutive]="isConsecutive(i, msg)">
            
            @if (!isConsecutive(i, msg) && !isMine(msg)) {
              <div class="user-avatar" [title]="getSenderName(msg)">
                {{ getSenderAvatar(msg) }}
              </div>
            } @else if (!isMine(msg)) {
              <div class="avatar-spacer"></div>
            }

            <div class="message-body">
              @if (!isConsecutive(i, msg) && !isMine(msg)) {
                <span class="sender-name">{{ getSenderName(msg) }}</span>
              }

              <div class="bubble-wrapper">
                <div class="bubble" [class.deleted]="msg.deleted">
                  @if (msg.deleted) {
                    <span class="deleted-text"><i class="pi pi-ban"></i> This message was deleted</span>
                  } @else if (editingMessageId === msg._id) {
                    <div class="edit-mode">
                      <textarea [(ngModel)]="editMessageText" (keydown.enter)="handleEditEnter($event)"></textarea>
                      <div class="edit-btns">
                        <button (click)="saveEditedMessage.emit()">Save</button>
                        <button (click)="cancelEditing.emit()">Cancel</button>
                      </div>
                    </div>
                  } @else {
                    <div class="text-content">{{ msg.body }}</div>
                    
                    @if (msg.attachments?.length) {
                      <div class="attachment-grid">
                        @for (f of msg.attachments; track f.url) {
                          <div class="attachment-card">
                            @if (isImage(f.url)) {
                              <img [src]="f.url" alt="Attachment" class="img-preview" />
                            } @else {
                              <a [href]="f.url" target="_blank" class="file-link">
                                <i class="pi" [ngClass]="getFileIconClass(f.url)"></i>
                                <span>{{ f.name }}</span>
                              </a>
                            }
                          </div>
                        }
                      </div>
                    }
                  }
                </div>

                @if (!msg.deleted && isMine(msg) && editingMessageId !== msg._id) {
                  <div class="message-actions">
                    <button (click)="editMessage.emit(msg)"><i class="pi pi-pencil"></i></button>
                    <button (click)="deleteMessage.emit(msg)"><i class="pi pi-trash"></i></button>
                  </div>
                }
                
                <span class="timestamp">{{ msg.createdAt | date:'h:mm a' }}</span>
              </div>
            </div>
          </div>
        }
      </div>

      @if (typingIndicator) {
        <div class="typing-area">
          <div class="typing-bubble">
            <span></span><span></span><span></span>
          </div>
          <small>{{ typingIndicator }}</small>
        </div>
      }
    </div>
  `,
  styles: [`
  /* Inside chat-messages.component.ts @Component styles */

:host {
  display: flex;
  flex-direction: column;
  height: 100%; /* Fill the flex: 1 allocated by parent */
  overflow: hidden;
}

.messages-viewport {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  /* This ensures the scrollbar stays within the viewable area */
}

    .date-row {
      display: flex; justify-content: center; margin: var(--spacing-xl) 0;
      position: relative;
      &::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border-subtle); z-index: 1; }
      .date-label { 
        position: relative; z-index: 2; background: var(--color-gray-50); 
        padding: 0 var(--spacing-lg); font-size: var(--font-size-xs);
        color: var(--text-muted); font-weight: var(--font-weight-semibold);
      }
    }

    .message-group {
      display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-xs);
      max-width: 85%;
      &.mine { align-self: flex-end; flex-direction: row-reverse; max-width: 75%; margin-bottom: 2px;}
      &.consecutive { margin-top: -8px; }
    }

    .user-avatar {
      width: 32px; height: 32px; border-radius: var(--ui-border-radius);
      background: var(--color-primary-subtle); color: var(--color-primary);
      display: grid; place-items: center; font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xs); flex-shrink: 0; margin-top: 18px;
    }
    .avatar-spacer { width: 32px; flex-shrink: 0; }

    .message-body {
      display: flex; flex-direction: column;
      .sender-name { font-size: var(--font-size-xs); color: var(--text-muted); font-weight: var(--font-weight-semibold); margin-bottom: 4px; margin-left: 4px; }
    }

    .bubble-wrapper {
      position: relative; display: flex; align-items: center; gap: var(--spacing-md);
      &:hover .message-actions { opacity: 1; }
    }

    .bubble {
      padding: var(--spacing-md) var(--spacing-lg); background: var(--bg-surface);
      border: var(--ui-border-width) solid var(--border-subtle);
      border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-xs);
      font-size: var(--font-size-base); color: var(--text-primary);
      line-height: var(--line-height-normal); transition: var(--transition-fast);

      &.deleted { opacity: 0.6; font-style: italic; background: var(--color-gray-100); }
    }

    .mine .bubble {
      background: var(--color-primary); color: var(--color-on-primary); border: none;
      box-shadow: var(--shadow-sm);
    }

    .timestamp { font-size: 10px; color: var(--text-placeholder); margin-top: 4px; opacity: 0; transition: 0.2s; }
    .bubble-wrapper:hover .timestamp { opacity: 1; }

    .message-actions {
      display: flex; gap: 4px; opacity: 0; transition: 0.2s;
      button { background: var(--bg-surface); border: 1px solid var(--border-subtle); cursor: pointer; border-radius: 4px; padding: 4px; font-size: 12px; &:hover { color: var(--color-primary); } }
    }

    .typing-area { display: flex; align-items: center; gap: 8px; margin-top: 10px; color: var(--text-muted); }
  `]
})
export class ChatMessagesComponent {
  @Input() messages: ChatMessage[] = [];
  @Input() currentUserId: string = '';
  @Input() activeChannel: Channel | null = null;
  @Input() loadingMore: boolean = false;
  @Input() typingIndicator: string = '';
  @Input() editingMessageId: string | null = null;
  @Input() editMessageText: string = '';

  @Output() scroll = new EventEmitter<Event>();
  @Output() editMessage = new EventEmitter<ChatMessage>();
  @Output() deleteMessage = new EventEmitter<ChatMessage>();
  @Output() saveEditedMessage = new EventEmitter<void>();
  @Output() cancelEditing = new EventEmitter<void>();

  isMine(msg: ChatMessage): boolean {
    return this.getSenderId(msg) === this.currentUserId;
  }

  // Perfection: Check if this message is from the same user as the previous one
  isConsecutive(index: number, msg: ChatMessage): boolean {
    if (index === 0) return false;
    const prevMsg = this.messages[index - 1];
    return this.getSenderId(prevMsg) === this.getSenderId(msg) && !this.showDateSeparator(index, msg);
  }

  handleEditEnter(event: any) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.saveEditedMessage.emit();
    }
  }

  getSenderId(msg: ChatMessage): string {
    if (!msg || !msg.senderId) return '';
    return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
  }

  getSenderName(msg: ChatMessage): string {
    if (!msg || !msg.senderId) return 'Unknown';
    return typeof msg.senderId === 'object' && msg.senderId.name ? msg.senderId.name : 'User';
  }

  getSenderAvatar(msg: ChatMessage): string {
    return this.getSenderName(msg).charAt(0).toUpperCase();
  }

  getFileIconClass(url: string): string {
    if (!url) return 'pi-file';
    if (this.isImage(url)) return 'pi-image';
    if (/\.(pdf)$/i.test(url)) return 'pi-file-pdf';
    return 'pi-file';
  }

  isImage(url?: string): boolean {
    if (!url) return false;
    return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(url);
  }

  showDateSeparator(index: number, msg: ChatMessage): boolean {
    if (index === 0) return true;
    const prevMsg = this.messages[index - 1];
    if (!prevMsg || !msg.createdAt || !prevMsg.createdAt) return false;
    return new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
  }

  onScroll(event: Event) {
    this.scroll.emit(event);
  }
}

// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Channel,ChatMessage } from './chat.models';

// @Component({
//   selector: 'app-chat-messages',
//   standalone: true,
//   imports: [CommonModule, FormsModule, DatePipe],
//   template: `
//     <div class="messages-container" #scrollContainer (scroll)="onScroll($event)">
//       @if (loadingMore) {
//       <div class="loading">
//         <i class="pi pi-spinner pi-spin"></i>
//         Loading...
//       </div>
//       }

//       @if (messages.length === 0 && !loadingMore) {
//       <div class="empty-chat">
//         <i class="pi pi-comment"></i>
//         <h3>No messages yet</h3>
//         <p>Start the conversation in #{{ activeChannel?.name }}</p>
//       </div>
//       }

//       <div class="messages">
//         @for (msg of messages; track msg._id; let i = $index) {
//         @if (showDateSeparator(i, msg)) {
//         <div class="date-divider">
//           {{ msg.createdAt | date:'fullDate' }}
//         </div>
//         }

//         <div class="message" [class.mine]="getSenderId(msg) === currentUserId">
//           @if (getSenderId(msg) !== currentUserId) {
//           <div class="avatar">{{ getSenderAvatar(msg) }}</div>
//           }
          
//           <div class="content">
//             @if (getSenderId(msg) !== currentUserId) {
//             <div class="sender">{{ getSenderName(msg) }}</div>
//             }
            
//             <div class="bubble" [class.mine]="getSenderId(msg) === currentUserId">
//               @if (msg.deleted) {
//               <div class="deleted">
//                 <i class="pi pi-trash"></i>
//                 Message deleted
//               </div>
//               } @else if (editingMessageId === msg._id) {
//               <div class="editing">
//                 <textarea [(ngModel)]="editMessageText" 
//                           (keydown.enter)="$event.preventDefault()"
//                           (keydown.enter.shift)="saveEditedMessage.emit()"
//                           rows="3"></textarea>
//                 <div class="edit-actions">
//                   <button (click)="saveEditedMessage.emit()" class="btn-save">
//                     <i class="pi pi-check"></i> Save
//                   </button>
//                   <button (click)="cancelEditing.emit()" class="btn-cancel">
//                     <i class="pi pi-times"></i> Cancel
//                   </button>
//                 </div>
//               </div>
//               } @else {
//                 @if (msg.body) {
//                 <div class="text">{{ msg.body }}</div>
//                 }
                
//                 @if (msg.attachments?.length) {
//                 <div class="attachments">
//                   @for (f of msg.attachments; track f.url) {
//                   <div class="attachment">
//                     @if (isImage(f.url)) {
//                     <img [src]="f.url" alt="Attachment" loading="lazy" />
//                     } @else {
//                     <a [href]="f.url" target="_blank" class="file">
//                       <i class="pi" [ngClass]="getFileIconClass(f.url)"></i>
//                       <span>{{ f.name }}</span>
//                     </a>
//                     }
//                   </div>
//                   }
//                 </div>
//                 }
                
//                 @if (getSenderId(msg) === currentUserId) {
//                 <div class="actions">
//                   <button (click)="editMessage.emit(msg)" class="btn-action">
//                     <i class="pi pi-pencil"></i>
//                   </button>
//                   <button (click)="deleteMessage.emit(msg)" class="btn-action">
//                     <i class="pi pi-trash"></i>
//                   </button>
//                 </div>
//                 }
//               }
//             </div>
            
//             <div class="meta">
//               <span>{{ msg.createdAt | date:'h:mm a' }}</span>
//               @if (msg.editedAt) {
//               <span class="edited">(edited)</span>
//               }
//             </div>
//           </div>
//         </div>
//         }
//       </div>
//     </div>

//     @if (typingIndicator) {
//     <div class="typing">
//       <div class="dots">
//         <span></span><span></span><span></span>
//       </div>
//       {{ typingIndicator }}
//     </div>
//     }
//   `,
//   styleUrls: ['./chat.component.scss']
// })
// export class ChatMessagesComponent {
//   @Input() messages: ChatMessage[] = [];
//   @Input() currentUserId: string = '';
//   @Input() activeChannel: Channel | null = null;
//   @Input() loadingMore: boolean = false;
//   @Input() typingIndicator: string = '';
//   @Input() editingMessageId: string | null = null;
//   @Input() editMessageText: string = '';

//   @Output() scroll = new EventEmitter<Event>();
//   @Output() editMessage = new EventEmitter<ChatMessage>();
//   @Output() deleteMessage = new EventEmitter<ChatMessage>();
//   @Output() saveEditedMessage = new EventEmitter<void>();
//   @Output() cancelEditing = new EventEmitter<void>();

//   getSenderId(msg: ChatMessage): string {
//     if (!msg || !msg.senderId) return '';
//     return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
//   }

//   getSenderName(msg: ChatMessage): string {
//     if (!msg || !msg.senderId) return 'Unknown';
//     if (typeof msg.senderId === 'object' && msg.senderId.name) return msg.senderId.name;
//     return 'User';
//   }

//   getSenderAvatar(msg: ChatMessage): string {
//     const name = this.getSenderName(msg);
//     return name.charAt(0).toUpperCase();
//   }

//   getFileIconClass(url: string): string {
//     if (!url) return 'pi-file';
//     if (this.isImage(url)) return 'pi-image';
//     if (/\.(pdf)$/i.test(url)) return 'pi-file-pdf';
//     return 'pi-file';
//   }

//   isImage(url?: string): boolean {
//     if (!url) return false;
//     return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(url);
//   }

//   showDateSeparator(index: number, msg: ChatMessage): boolean {
//     if (index === 0) return true;
//     const prevMsg = this.messages[index - 1];
//     if (!prevMsg || !msg.createdAt || !prevMsg.createdAt) return false;
    
//     const prevDate = new Date(prevMsg.createdAt).toDateString();
//     const currentDate = new Date(msg.createdAt).toDateString();
//     return prevDate !== currentDate;
//   }

//   onScroll(event: Event) {
//     this.scroll.emit(event);
//   }
// }