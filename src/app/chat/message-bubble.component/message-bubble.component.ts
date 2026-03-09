import { Component, Input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../modules/auth/services/auth-service';
import { Message } from '../chat.component/chat.models'; // ✅ Unified interface path

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="message-container" [class.me]="isMe()">
      <div class="bubble" [class.me]="isMe()" [class.deleted]="message.deleted">
        
        @if (message.deleted) {
          <div class="bubble-body deleted-text">
            <i class="pi pi-ban mr-1"></i> This message was deleted
          </div>
        } @else {
          <div class="bubble-body">{{ message.body }}</div>
          
          @if (message.attachments && message.attachments.length > 0) {
            <div class="attachments-preview">
              @for (file of message.attachments; track file.url) {
                <a [href]="file.url" target="_blank" class="file-link">
                  <i class="pi pi-file"></i> {{ file.name }}
                </a>
              }
            </div>
          }

          <div class="bubble-meta">
            <span class="time">{{ message.createdAt | date:'shortTime' }}</span>
            
            @if (isMe()) {
              <span class="status-icons">
                @if (message.readBy && message.readBy.length > 1) {
                  <i class="pi pi-check-circle text-blue-500"></i>
                } @else {
                  <i class="pi pi-check text-500"></i>
                }
              </span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .message-container { display: flex; width: 100%; margin: 4px 0; justify-content: flex-start; }
    .message-container.me { justify-content: flex-end; }

    .bubble { 
      max-width: 75%; 
      padding: 8px 12px; 
      border-radius: 12px; 
      background: var(--surface-100, #f3f3f3); 
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      position: relative;
    }

    .bubble.me { 
      background: var(--primary-100, #dcf8c6); 
      border-bottom-right-radius: 2px; /* WhatsApp style tail */
    }

    .bubble:not(.me) {
      border-bottom-left-radius: 2px;
    }

    .bubble.deleted { opacity: 0.7; font-style: italic; }
    
    .bubble-body { white-space: pre-wrap; word-break: break-word; font-size: 0.95rem; color: #1e293b; }
    .deleted-text { font-size: 0.85rem; color: #64748b; }

    .bubble-meta { 
      font-size: 10px; 
      color: #64748b; 
      margin-top: 4px; 
      display: flex; 
      gap: 4px; 
      align-items: center;
      justify-content: flex-end; 
    }

    .attachments-preview {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      gap: 4px;

      .file-link {
        font-size: 0.8rem;
        color: var(--primary-700);
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    .status-icons i { font-size: 10px; }
  `]
})
export class MessageBubbleComponent {
  @Input() message!: Message;
  private authService = inject(AuthService);

  isMe(): boolean {
    const currentUserId = this.authService.getCurrentUser()?._id;
    const senderId = this.getSenderId(this.message);
    
    if (!senderId) return true; // Fallback for optimistic messages
    return String(senderId) === String(currentUserId);
  }

  private getSenderId(msg: Message): string {
    if (!msg.senderId) return '';
    // Handle cases where senderId might be populated or a raw string ID
    return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || msg.senderId.id);
  }
}