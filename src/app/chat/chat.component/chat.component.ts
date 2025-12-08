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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


// import { Component, ElementRef, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ChatService, Channel, Message } from '../services/chat.service'; // Adjust path
// import { Subject, takeUntil, combineLatest, map } from 'rxjs';

// @Component({
//   selector: 'app-chat-layout',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './chat.component.html',
//   styleUrls: ['./chat.component.scss']
// })
// export class ChatLayoutComponent implements OnInit, OnDestroy {
//   // Services
//   private chatService = inject(ChatService);

//   // View Children (for auto-scroll)
//   @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

//   // State
//   activeChannelId: string | null = null;
//   currentUserdId: string = ''; // Ideally get this from your Auth Service
//   messageInput: string = '';
//   showCreateModal = false;
//   newChannelName = '';
//   isPrivateChannel = false;
//   // Observables
//   channels$ = this.chatService.channels$;
//   messages$ = this.chatService.messagesBatch$;

//   // Derived state for typing indicator in the active channel
//   typingUsers$ = combineLatest([
//     this.chatService.typing$,
//     this.chatService.channelUsers$ // mapping of channelId -> userIds
//   ]).pipe(
//     map(([typingEvent, usersMap]) => {
//       // In a real app, you map userId to a Name here. 
//       // For now, we return the logic for the template.
//       if (typingEvent.channelId === this.activeChannelId && typingEvent.typing) {
//         return typingEvent.userId; // Return ID of who is typing
//       }
//       return null;
//     })
//   );

//   private destroy$ = new Subject<void>();

//   ngOnInit() {
//     // 1. Initialize connection (Assume Auth service passed token to BootstrapService already)
//     // If not, call this.chatService.connect(token);

//     // 2. Fetch Channel List
//     this.loadChannels();

//     // 3. Decode token locally just to get "My User ID" for styling (Right vs Left alignment)
//     // In production, inject your AuthService here to get the ID.
//     const token = localStorage.getItem('token');
//     if (token) {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       this.currentUserdId = payload.sub || payload._id;
//     }

//     // 4. Auto-scroll on new messages
//     this.messages$.pipe(takeUntil(this.destroy$)).subscribe(() => {
//       setTimeout(() => this.scrollToBottom(), 100);
//     });
//   }

//   loadChannels() {
//     this.chatService.listChannels().subscribe({
//       next: (channels) => {
//         this.chatService.channels$.next(channels);
//         // Auto-select first channel if exists
//         if (channels.length > 0 && !this.activeChannelId) {
//           this.selectChannel(channels[0]);
//         }
//       }
//     });
//   }

//   // Add this method to open/close
//   openCreateModal() {
//     this.showCreateModal = true;
//     this.newChannelName = '';
//     this.isPrivateChannel = false;
//   }

//   closeCreateModal() {
//     this.showCreateModal = false;
//   }

//   // Add this method to submit the form
//   submitCreateChannel() {
//     if (!this.newChannelName.trim()) return;

//     const type = this.isPrivateChannel ? 'private' : 'public';

//     // Note: For private channels, you'd pass selected user IDs in the 3rd argument
//     this.chatService.createChannel(this.newChannelName, type, [])
//       .subscribe({
//         next: (newChannel) => {
//           // 1. Close modal
//           this.closeCreateModal();

//           // 2. Refresh channel list (or push manually to local array)
//           this.loadChannels();

//           // 3. Immediately select the new channel
//           this.selectChannel(newChannel);
//         },
//         error: (err) => console.error('Failed to create channel', err)
//       });
//   }

//   selectChannel(channel: Channel) {
//     if (this.activeChannelId === channel._id) return;

//     // Leave previous
//     if (this.activeChannelId) {
//       this.chatService.leaveChannel(this.activeChannelId);
//     }

//     this.activeChannelId = channel._id;

//     // Join new & Fetch history
//     this.chatService.joinChannel(this.activeChannelId);
//     this.chatService.fetchMessages(this.activeChannelId).subscribe(res => {
//       // The service socket listener handles the 'messages' event update, 
//       // but if fetchMessages returns REST data, update the subject manually:
//       this.chatService.messagesBatch$.next(res.messages.reverse());
//     });
//   }

//   sendMessage() {
//     if (!this.messageInput.trim() || !this.activeChannelId) return;

//     this.chatService.sendMessage(this.activeChannelId, this.messageInput);
//     this.messageInput = ''; // Clear input
//     this.onTyping(); // Stop typing indicator
//   }

//   // Handle typing debounce
//   private typingTimeout: any;
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

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }