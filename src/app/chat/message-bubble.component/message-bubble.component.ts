// src/app/chat/whatsapp/message-bubble.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../services/chat.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bubble" [class.me]="isMe()">
      <div class="bubble-body">{{ message.body }}</div>
      <div class="bubble-meta">
        <span class="time">{{ message.createdAt ? (message.createdAt | date:'shortTime') : '' }}</span>
        <span *ngIf="isMe()" class="read">✓✓</span>
      </div>
    </div>
  `,
  styles: [`
    .bubble { max-width: 72%; padding:8px 10px; border-radius:8px; margin:6px 0; background:#f3f3f3; display:inline-block; }
    .bubble.me { background:#dcf8c6; align-self:flex-end; }
    .bubble-body { white-space:pre-wrap; word-break:break-word; }
    .bubble-meta { font-size:10px; color:#666; margin-top:4px; display:flex; gap:6px; justify-content:flex-end; }
  `]
})
export class MessageBubbleComponent {
  @Input() message!: Message;

  isMe() {
    // simple: messages sent we optimistically mark as 'me' if senderId === 'me' or missing
    return this.message.senderId === 'me' || !this.message.senderId;
  }
}

// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-message-bubble.component',
//   imports: [],
//   templateUrl: './message-bubble.component.html',
//   styleUrl: './message-bubble.component.scss',
// })
// export class MessageBubbleComponent {

// }
