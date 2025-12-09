import { Component, ElementRef, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Channel } from '../services/chat.service';
import { Subject, takeUntil, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatLayoutComponent implements OnInit, OnDestroy {

  // MUST BE PUBLIC FOR TEMPLATE
  public chatService = inject(ChatService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  activeChannelId: string | null = null;
  currentUserdId = '';
  messageInput = '';

  // Modal state
  showCreateModal = false;
  newChannelName = '';
  isPrivateChannel = false;

  // Observables
  channels$ = this.chatService.channels$;
  messages$ = this.chatService.messagesBatch$;

  // local cache for .find()
  channelsSnapshot: Channel[] = [];

  typingUsers$ = combineLatest([
    this.chatService.typing$,
    this.chatService.channelUsers$
  ]).pipe(
    map(([typingEvent, usersMap]) => {
      if (typingEvent.channelId === this.activeChannelId && typingEvent.typing) {
        return typingEvent.userId;
      }
      return null;
    })
  );

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.channels$.pipe(takeUntil(this.destroy$)).subscribe(list => {
      this.channelsSnapshot = list || [];
    });

    this.loadChannels();

    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserdId = payload.sub || payload._id;
    }

    this.messages$.pipe(takeUntil(this.destroy$)).subscribe(() =>
      setTimeout(() => this.scrollToBottom(), 100)
    );
  }

  // Helper for template
  getChannelName(id: string | null): string {
    if (!id) return '';
    return this.channelsSnapshot.find(c => c._id === id)?.name ?? '';
  }

  loadChannels() {
    this.chatService.listChannels().subscribe({
      next: (channels) => {
        this.chatService.channels$.next(channels);

        if (channels.length > 0 && !this.activeChannelId) {
          this.selectChannel(channels[0]);
        }
      }
    });
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.newChannelName = '';
    this.isPrivateChannel = false;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  submitCreateChannel() {
    if (!this.newChannelName.trim()) return;

    const type = this.isPrivateChannel ? 'private' : 'public';

    this.chatService.createChannel(this.newChannelName, type, [])
      .subscribe({
        next: (newChannel) => {
          this.closeCreateModal();
          this.loadChannels();
          this.selectChannel(newChannel);
        }
      });
  }

  selectChannel(channel: Channel) {
    if (this.activeChannelId === channel._id) return;

    if (this.activeChannelId) {
      this.chatService.leaveChannel(this.activeChannelId);
    }

    this.activeChannelId = channel._id;

    this.chatService.joinChannel(this.activeChannelId);

    this.chatService.fetchMessages(this.activeChannelId)
      .subscribe(res => {
        this.chatService.messagesBatch$.next(res.messages.reverse());
      });
  }

  sendMessage() {
    if (!this.messageInput.trim() || !this.activeChannelId) return;

    this.chatService.sendMessage(this.activeChannelId, this.messageInput);
    this.messageInput = '';
    this.onTyping();
  }

  private typingTimeout: any;

  onTyping() {
    if (!this.activeChannelId) return;

    this.chatService.setTyping(this.activeChannelId, true);

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.chatService.setTyping(this.activeChannelId!, false);
    }, 2000);
  }

  scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    }
  }
// Add this helper method
getSenderId(msg: any): string {
  if (!msg.senderId) return '';
  // If it's an object (populated), return ._id, else return the string itself
  return typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
}

getSenderName(msg: any): string {
  if (!msg.senderId) return 'Unknown';
  // If populated, return name. If string, return the ID as fallback.
  return typeof msg.senderId === 'object' ? (msg.senderId.name || 'User') : 'User';
}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
