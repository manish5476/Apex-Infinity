import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Channel, Message, Attachment } from '../services/chat.service';
import { Subscription } from 'rxjs';
import { MasterListService } from '../../core/services/master-list.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  // Services (public for template)
  public chatService = inject(ChatService);
  private masterList = inject(MasterListService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  // UI state
  channels: Channel[] = [];
  channelsSub?: Subscription;

  messages: Message[] = [];
  messagesSub?: Subscription;

  channelUsers: Record<string, string[]> = {};
  channelUsersSub?: Subscription;

  typingSub?: Subscription;
  typingUser: string | null = null;

  connectionSub?: Subscription;

  activeChannelId: string | null = null;
  currentUserId = '';
  messageInput = '';
  isUploading = false;

  // Create modal
  showCreateModal = false;
  newChannelName = '';
  isPrivateChannel = false;
  // members selection uses master list users
  masterUsers: { _id: string; name: string }[] = [];
  selectedMembers = new Set<string>();

  // helper
  private subs: Subscription[] = [];

  constructor() {}

  ngOnInit(): void {
    // sync caches from ChatService BehaviorSubjects (safe, no arrow in template)
    this.channelsSub = this.chatService.channels$.subscribe(list => {
      this.channels = list || [];
    });
    this.subs.push(this.channelsSub);

    this.messagesSub = this.chatService.messagesBatch$.subscribe(list => {
      this.messages = list || [];
      // small microtask to scroll after DOM updated
      setTimeout(() => this.scrollToBottom(), 80);
    });
    this.subs.push(this.messagesSub);

    this.channelUsersSub = this.chatService.channelUsers$.subscribe(map => {
      this.channelUsers = map || {};
    });
    this.subs.push(this.channelUsersSub);

    this.typingSub = this.chatService.typing$.subscribe(t => {
      if (t && t.channelId === this.activeChannelId && t.typing) {
        this.typingUser = t.userId;
      } else {
        this.typingUser = null;
      }
    });
    this.subs.push(this.typingSub);

    // read master users (if MasterListService has data cached)
    try {
      const users = (this.masterList as any).users?.() ?? []; // masterList.users is a signal -> call it
      this.masterUsers = users.map((u: any) => ({ _id: u._id, name: u.name }));
    } catch (e) {
      this.masterUsers = [];
    }

    // pick up current user id from token if present
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId = payload.sub || payload._id || '';
      } catch {
        this.currentUserId = '';
      }
    }

    // initial channels load (keeps compatible with your ChatService)
    this.chatService.listChannels().subscribe({
      next: (channels) => {
        this.chatService.channels$.next(channels);
        if (channels.length && !this.activeChannelId) {
          this.selectChannel(channels[0]);
        }
      },
      error: (err) => console.error('Failed to list channels', err)
    });
  }

  // ------------------------
  // CHANNEL UI ACTIONS
  // ------------------------
  selectChannel(channel: Channel) {
    if (!channel) return;
    if (this.activeChannelId === channel._id) return;

    // leave previous channel
    if (this.activeChannelId) {
      this.chatService.leaveChannel(this.activeChannelId);
    }

    this.activeChannelId = channel._id;
    // join new channel and fetch history
    this.chatService.joinChannel(this.activeChannelId);
    this.chatService.fetchMessages(this.activeChannelId).subscribe({
      next: (res: any) => {
        // backend returns { messages: Message[] }
        if (res?.messages) this.chatService.messagesBatch$.next(res.messages.reverse());
      },
      error: (err) => console.error('fetchMessages error', err)
    });
  }

  getChannelName(channelId: string | null): string {
    if (!channelId) return '';
    const c = this.channels.find(ch => ch._id === channelId);
    return c?.name ?? 'Unnamed';
  }

  // ------------------------
  // MESSAGES
  // ------------------------
  sendMessage() {
    if (!this.activeChannelId) return;
    const text = this.messageInput.trim();
    if (!text) return;

    // Use ChatService sendMessage (returns Promise or emits)
    this.chatService.sendMessage(this.activeChannelId, text, []).catch(err => {
      // if sendMessage returns Promise rejection, log; the service queues if offline
      console.error('sendMessage error', err);
    });

    this.messageInput = '';
    // typing stop
    this.chatService.setTyping(this.activeChannelId, false);
  }

  deleteMessage(msg: Message) {
    if (!msg._id) return;
    if (!confirm('Delete this message?')) return;
    this.chatService.deleteMessage(msg._id).subscribe({
      next: () => {
        // optimistic UI handled by socket event 'messageDeleted' in service
      }, error: (err) => console.error('delete failed', err)
    });
  }

  onTypingInput() {
    if (!this.activeChannelId) return;
    this.chatService.setTyping(this.activeChannelId, true);
    // local debounce to stop typing after 2s
    window.clearTimeout((this as any)._typingTimeout);
    (this as any)._typingTimeout = window.setTimeout(() => {
      this.chatService.setTyping(this.activeChannelId!, false);
    }, 1800);
  }

  // ------------------------
  // ATTACHMENTS
  // ------------------------
  triggerFilePicker() {
    this.fileInput?.nativeElement?.click();
  }

  handleFileUpload(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.activeChannelId) return;
    this.isUploading = true;

    this.chatService.uploadAttachment(file).subscribe({
      next: (attachment: Attachment) => {
        this.isUploading = false;
        // send message with attachment
        this.chatService.sendMessage(this.activeChannelId!, '', [attachment]).catch(err => console.error(err));
      },
      error: (err) => {
        this.isUploading = false;
        console.error('upload failed', err);
      }
    });

    // reset input
    input.value = '';
  }

  // ------------------------
  // CREATE CHANNEL (modal)
  // ------------------------
  openCreateModal() {
    this.showCreateModal = true;
    this.newChannelName = '';
    this.isPrivateChannel = false;
    this.selectedMembers.clear();
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  toggleMemberSelection(id: string) {
    if (this.selectedMembers.has(id)) this.selectedMembers.delete(id);
    else this.selectedMembers.add(id);
  }

  submitCreateChannel() {
    const name = this.newChannelName.trim();
    if (!name) return;

    const type = this.isPrivateChannel ? 'private' : 'public';
    // If private, use selectedMembers; always ensure creator is included
    let members: string[] = [];

    if (this.isPrivateChannel) {
      members = Array.from(this.selectedMembers).filter(Boolean);
      if (!members.includes(this.currentUserId) && this.currentUserId) members.push(this.currentUserId);
    }

    // Basic client-side sanitize to avoid empty strings
    members = members.filter(id => typeof id === 'string' && id.trim().length === 24 ? true : id.trim().length > 0);

    this.chatService.createChannel(name, type as any, members).subscribe({
      next: (ch: Channel) => {
        // update channel list locally and auto-select
        const updated = [...this.channels, ch];
        this.chatService.channels$.next(updated);
        this.showCreateModal = false;
        this.selectChannel(ch);
      },
      error: (err) => {
        console.error('createChannel error', err);
        alert('Failed to create channel');
      }
    });
  }

  // ------------------------
  // HELPERS & UTIL
  // ------------------------
  scrollToBottom() {
    if (!this.scrollContainer) {
      try { this.scrollContainer = (this as any).scrollContainer; } catch {}
    }
    if (this.scrollContainer?.nativeElement) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  getSenderId(msg: Message): string {
    if (!msg) return '';
    if (!msg.senderId) return '';
    return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
  }

  getSenderName(msg: Message): string {
    if (!msg || !msg.senderId) return 'Unknown';
    if (typeof msg.senderId === 'string') return msg.senderId.slice(0, 8);
    return msg.senderId.name || msg.senderId.email || 'User';
  }

  isImage(url?: string) {
    if (!url) return false;
    return /\.(jpe?g|png|gif|webp|svg)$/i.test(url) || url.includes('cloudinary');
  }

  // ------------------------
  // LIFECYCLE
  // ------------------------
  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    // Do not destroy ChatService here (shared)
  }
}



// import { Component, ElementRef, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ChatService, Channel, Message } from '../services/chat.service';
// import { Subject, takeUntil, combineLatest, map } from 'rxjs';
// import { ImageViewerDirective } from '../../modules/shared/directives/image-viewer.directive';

// @Component({
//   selector: 'app-chat-layout',
//   standalone: true,
//   imports: [CommonModule,ImageViewerDirective, FormsModule],
//   templateUrl: './chat.component.html',
//   styleUrls: ['./chat.component.scss']
// })
// export class ChatLayoutComponent implements OnInit, OnDestroy {

//   // Public for template access
//   public chatService = inject(ChatService);

//   @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
//   // State
//   activeChannelId: string | null = null;
//   currentUserdId = '';
//   messageInput = '';
//   isUploading = false;
  
//   // Modal State
//   showCreateModal = false;
//   newChannelName = '';
//   isPrivateChannel = false;

//   // Streams
//   channels$ = this.chatService.channels$;
//   messages$ = this.chatService.messagesBatch$;
  
//   // Helpers
//   channelsSnapshot: Channel[] = [];
//   private destroy$ = new Subject<void>();
//   private typingTimeout: any;

//   // Derive typing user name/id
//   typingUsers$ = combineLatest([
//     this.chatService.typing$,
//     this.chatService.channelUsers$
//   ]).pipe(
//     map(([typingEvent, usersMap]) => {
//       if (typingEvent.channelId === this.activeChannelId && typingEvent.typing) {
//         return typingEvent.userId; 
//       }
//       return null;
//     })
//   );

//   ngOnInit() {
//     // Sync local snapshot for helper methods
//     this.channels$.pipe(takeUntil(this.destroy$)).subscribe(list => {
//       this.channelsSnapshot = list || [];
//     });

//     this.loadChannels();

//     // Decode Token for User ID
//     const token = localStorage.getItem('token');
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         this.currentUserdId = payload.sub || payload._id;
//       } catch (e) { console.error('Token decode error', e); }
//     }

//     // Auto-scroll on new messages
//     this.messages$.pipe(takeUntil(this.destroy$)).subscribe(() => 
//       setTimeout(() => this.scrollToBottom(), 100)
//     );
//   }

//   loadChannels() {
//     this.chatService.listChannels().subscribe({
//       next: (channels) => {
//         this.chatService.channels$.next(channels);
//         // Auto-select first channel
//         if (channels.length > 0 && !this.activeChannelId) {
//           this.selectChannel(channels[0]);
//         }
//       }
//     });
//   }

//   // --- Actions ---

//   selectChannel(channel: Channel) {
//     if (this.activeChannelId === channel._id) return;
//     if (this.activeChannelId) this.chatService.leaveChannel(this.activeChannelId);

//     this.activeChannelId = channel._id;
//     this.chatService.joinChannel(this.activeChannelId);

//     this.chatService.fetchMessages(this.activeChannelId).subscribe(res => {
//       this.chatService.messagesBatch$.next(res.messages.reverse());
//     });
//   }

//   sendMessage() {
//     if (!this.messageInput.trim() || !this.activeChannelId) return;
//     this.chatService.sendMessage(this.activeChannelId, this.messageInput);
//     this.messageInput = '';
//     this.onTyping();
//   }

//   deleteMessage(msg: Message) {
//     if (!msg._id) return;
//     if (confirm('Delete this message?')) {
//       this.chatService.deleteMessage(msg._id).subscribe();
//     }
//   }

//   handleFileUpload(event: any) {
//     const file = event.target.files[0];
//     if (!file) return;

//     this.isUploading = true;
//     this.chatService.uploadAttachment(file).subscribe({
//       next: (attachment) => {
//         this.isUploading = false;
//         // Send immediately with attachment
//         this.chatService.sendMessage(this.activeChannelId!, '', [attachment]);
//       },
//       error: (err) => {
//         console.error('Upload failed', err);
//         this.isUploading = false;
//       }
//     });
//     event.target.value = ''; 
//   }

//   // --- Modal ---
//   openCreateModal() { this.showCreateModal = true; this.newChannelName = ''; }
//   closeCreateModal() { this.showCreateModal = false; }
  
//   submitCreateChannel() {
//     if (!this.newChannelName.trim()) return;
//     const type = this.isPrivateChannel ? 'private' : 'public';
//     // Add current user to private list so backend doesn't lock you out
//     const members = this.isPrivateChannel ? [this.currentUserdId] : [];

//     this.chatService.createChannel(this.newChannelName, type, members).subscribe({
//       next: (newChannel) => {
//         this.closeCreateModal();
//         this.loadChannels();
//         this.selectChannel(newChannel);
//       }
//     });
//   }

//   // --- Utilities ---

//   onTyping() {
//     if (!this.activeChannelId) return;
//     this.chatService.setTyping(this.activeChannelId, true);
//     clearTimeout(this.typingTimeout);
//     this.typingTimeout = setTimeout(() => {
//       this.chatService.setTyping(this.activeChannelId!, false);
//     }, 2000);
//   }

//   scrollToBottom(): void {
//     if (this.scrollContainer) {
//       this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
//     }
//   }

//   getChannelName(id: string | null): string {
//     return this.channelsSnapshot.find(c => c._id === id)?.name ?? '';
//   }

//   getSenderId(msg: any): string {
//     if (!msg.senderId) return '';
//     return typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
//   }

//   getSenderName(msg: any): string {
//     if (!msg.senderId) return 'Unknown';
//     return typeof msg.senderId === 'object' ? (msg.senderId.name || 'User') : 'User';
//   }

//   isImage(url: string): boolean {
//     return url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null || url.includes('cloudinary');
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }