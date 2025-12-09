
import { Component, ElementRef, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Channel, Message } from '../services/chat.service';
import { Subject, takeUntil, combineLatest, map } from 'rxjs';
import { ImageViewerDirective } from '../../modules/shared/directives/image-viewer.directive';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [CommonModule,ImageViewerDirective, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatLayoutComponent implements OnInit, OnDestroy {

  // Public for template access
  public chatService = inject(ChatService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  // State
  activeChannelId: string | null = null;
  currentUserdId = '';
  messageInput = '';
  isUploading = false;
  
  // Modal State
  showCreateModal = false;
  newChannelName = '';
  isPrivateChannel = false;

  // Streams
  channels$ = this.chatService.channels$;
  messages$ = this.chatService.messagesBatch$;
  
  // Helpers
  channelsSnapshot: Channel[] = [];
  private destroy$ = new Subject<void>();
  private typingTimeout: any;

  // Derive typing user name/id
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

  ngOnInit() {
    // Sync local snapshot for helper methods
    this.channels$.pipe(takeUntil(this.destroy$)).subscribe(list => {
      this.channelsSnapshot = list || [];
    });

    this.loadChannels();

    // Decode Token for User ID
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserdId = payload.sub || payload._id;
      } catch (e) { console.error('Token decode error', e); }
    }

    // Auto-scroll on new messages
    this.messages$.pipe(takeUntil(this.destroy$)).subscribe(() => 
      setTimeout(() => this.scrollToBottom(), 100)
    );
  }

  loadChannels() {
    this.chatService.listChannels().subscribe({
      next: (channels) => {
        this.chatService.channels$.next(channels);
        // Auto-select first channel
        if (channels.length > 0 && !this.activeChannelId) {
          this.selectChannel(channels[0]);
        }
      }
    });
  }

  // --- Actions ---

  selectChannel(channel: Channel) {
    if (this.activeChannelId === channel._id) return;
    if (this.activeChannelId) this.chatService.leaveChannel(this.activeChannelId);

    this.activeChannelId = channel._id;
    this.chatService.joinChannel(this.activeChannelId);

    this.chatService.fetchMessages(this.activeChannelId).subscribe(res => {
      this.chatService.messagesBatch$.next(res.messages.reverse());
    });
  }

  sendMessage() {
    if (!this.messageInput.trim() || !this.activeChannelId) return;
    this.chatService.sendMessage(this.activeChannelId, this.messageInput);
    this.messageInput = '';
    this.onTyping();
  }

  deleteMessage(msg: Message) {
    if (!msg._id) return;
    if (confirm('Delete this message?')) {
      this.chatService.deleteMessage(msg._id).subscribe();
    }
  }

  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    this.chatService.uploadAttachment(file).subscribe({
      next: (attachment) => {
        this.isUploading = false;
        // Send immediately with attachment
        this.chatService.sendMessage(this.activeChannelId!, '', [attachment]);
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isUploading = false;
      }
    });
    event.target.value = ''; 
  }

  // --- Modal ---
  openCreateModal() { this.showCreateModal = true; this.newChannelName = ''; }
  closeCreateModal() { this.showCreateModal = false; }
  
  submitCreateChannel() {
    if (!this.newChannelName.trim()) return;
    const type = this.isPrivateChannel ? 'private' : 'public';
    // Add current user to private list so backend doesn't lock you out
    const members = this.isPrivateChannel ? [this.currentUserdId] : [];

    this.chatService.createChannel(this.newChannelName, type, members).subscribe({
      next: (newChannel) => {
        this.closeCreateModal();
        this.loadChannels();
        this.selectChannel(newChannel);
      }
    });
  }

  // --- Utilities ---

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
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  getChannelName(id: string | null): string {
    return this.channelsSnapshot.find(c => c._id === id)?.name ?? '';
  }

  getSenderId(msg: any): string {
    if (!msg.senderId) return '';
    return typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
  }

  getSenderName(msg: any): string {
    if (!msg.senderId) return 'Unknown';
    return typeof msg.senderId === 'object' ? (msg.senderId.name || 'User') : 'User';
  }

  isImage(url: string): boolean {
    return url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null || url.includes('cloudinary');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}