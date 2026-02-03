
import { Component, inject, OnInit, OnDestroy, computed, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

// Import Components
import { ChatSidebarComponent } from './chat-sidebar.component';
import { ChatHeaderComponent } from './chat-header.component';
import { ChatMessagesComponent } from './chat-messages.component';
import { ChatComposerComponent } from './chat-composer.component';
import { ChatModalsComponent } from './chat-modals.component';

// Import Services
import { SocketService } from '../../core/services/socket.service';
import { MasterListService } from '../../core/services/master-list.service';
import { AppMessageService } from '../../core/services/message.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { ToastModule } from "primeng/toast";

// Import Models
import { ChatMessage, Channel, Attachment } from './chat.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ToastModule, 
    ChatSidebarComponent,
    ChatHeaderComponent,
    ChatMessagesComponent,
    ChatComposerComponent,
    ChatModalsComponent
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  // --- Services ---
  private socketService = inject(SocketService);
  public masterList = inject(MasterListService); // Public for template access if needed
  private http = inject(HttpClient);
  private messageService = inject(AppMessageService);
  private authService = inject(AuthService);

  // --- UI Signals & State ---
  channels = signal<Channel[]>([]);
  messages = signal<ChatMessage[]>([]);
  activeChannelId = signal<string | null>(null);
  currentUserId = signal<string>('');
  currentUser = signal<any>(null);
  
  // Presence & Typing
  isTyping = signal<boolean>(false);
  typingUsers = signal<Map<string, {userId: string, timestamp: number}>>(new Map());
  channelUsers = signal<Record<string, string[]>>({});
  onlineUsers = signal<Set<string>>(new Set());
  
  // Composer State
  messageInput = '';
  attachments: File[] = [];
  isUploading = false;
  uploadProgress = signal<number>(0);

  // Modal State
  showCreateModal = false;
  newChannelName = '';
  channelType = 'public';
  selectedMembers = new Set<string>();
  
  // Message Editing
  editingMessageId = signal<string | null>(null);
  editMessageText = '';

  // Channel Settings / Members
  showChannelSettings = false;
  showAddMembersModal = false;
  newMembers = new Set<string>();

  // Responsive Layout
  sidebarOpen = signal<boolean>(true);
  mobileView = signal<boolean>(false);

  // Computed Values
  activeChannel = computed(() => {
    const id = this.activeChannelId();
    return this.channels().find(ch => ch._id === id) || null;
  });

  activeChannelUsers = computed(() => {
    const id = this.activeChannelId();
    return id ? (this.channelUsers()[id] || []) : [];
  });
  
  typingIndicator = computed(() => {
    const channelId = this.activeChannelId();
    if (!channelId) return '';
    
    const typingMap = this.typingUsers();
    const typingInChannel = Array.from(typingMap.values())
      .filter(t => !t.userId.startsWith('temp_') && this.isUserInChannel(t.userId, channelId))
      .map(t => this.getUserName(t.userId))
      .filter(name => name !== this.getUserName(this.currentUserId())); // Exclude self
    
    if (typingInChannel.length === 0) return '';
    if (typingInChannel.length === 1) return `${typingInChannel[0]} is typing...`;
    if (typingInChannel.length === 2) return `${typingInChannel[0]} and ${typingInChannel[1]} are typing...`;
    return `${typingInChannel[0]} and ${typingInChannel.length - 1} others are typing...`;
  });

  unreadCounts = signal<Record<string, number>>({});
  
  // Infinite Scroll State
  loadingMore = false;
  hasMoreMessages = true;
  pageSize = 50;

  // Subscriptions & Timers
  private subs: Subscription[] = [];
  private typingTimeout: any = null;
  private cleanupTimer: any = null;

  // --- Lifecycle & Initialization ---

  @HostListener('window:resize')
  checkMobileView() {
    const isMobile = window.innerWidth < 768;
    this.mobileView.set(isMobile);
    if (isMobile) {
      this.sidebarOpen.set(false);
    } else {
      this.sidebarOpen.set(true);
    }
  }

  ngOnInit(): void {
    this.checkMobileView();
    this.loadCurrentUser();
    this.initializeSocketConnection();
    this.setupSocketListeners();
    this.loadChannels();
    
    // Cleanup old typing indicators every 2 seconds
    this.cleanupTimer = setInterval(() => this.cleanupTypingIndicators(), 2000);
  }

  loadCurrentUser() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId.set(user._id);
      this.currentUser.set(user);
    } else {
      // Fallback: Try decoding token
      const token = localStorage.getItem('apex_auth_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.currentUserId.set(payload.sub || payload._id);
          this.currentUser.set({ _id: payload.sub, name: payload.name });
        } catch (e) { console.error(e); }
      }
    }
  }

  initializeSocketConnection() {
    const token = localStorage.getItem('apex_auth_token');
    const orgId = this.getOrganizationId();
    const userId = this.currentUserId();
    
    if (token && userId) {
      this.socketService.connect(token, orgId, userId);
    }
  }

  getOrganizationId(): string {
    const token = localStorage.getItem('apex_auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.organizationId || '';
      } catch (e) { return ''; }
    }
    return '';
  }

  // --- Socket Listeners ---

  setupSocketListeners() {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];

    // 1. Channels
    this.subs.push(
      this.socketService.channels$.subscribe(list => {
        this.channels.set(list || []);
        // Auto-select first channel if none active
        if (this.channels().length > 0 && !this.activeChannelId()) {
          this.selectChannel(this.channels()[0]);
        }
      })
    );

    // 2. Messages
    // this.subs.push(
    //   this.socketService.messages$.subscribe((msg: ChatMessage) => {
    //     if (msg.channelId === this.activeChannelId()) {
    //       // Add to list if not duplicate
    //       this.messages.update(current => {
    //         if (current.some(m => m._id === msg._id)) return current;
    //         return [...current, msg];
    //       });
    //       this.markMessagesAsRead();
    //     } else {
    //       // Increment unread count
    //       if (msg.channelId) {
    //         const current = this.unreadCounts();
    //         this.unreadCounts.set({ ...current, [msg.channelId]: (current[msg.channelId] || 0) + 1 });
    //       }
    //     }
    //   })
    // );
    this.subs.push(
    this.socketService.messages$.subscribe((msg: ChatMessage) => {
      if (msg.channelId === this.activeChannelId()) {
        this.messages.update(current => {
          // 1. Prevent exact ID duplicates
          if (current.some(m => m._id === msg._id)) return current;

          // 2. Match server message with our local temp message
          const tempIndex = current.findIndex(m => 
            m._id?.startsWith('temp_') && 
            m.body === msg.body && 
            this.getSenderId(m) === this.getSenderId(msg)
          );

          if (tempIndex > -1) {
            const updated = [...current];
            updated[tempIndex] = msg; // Replace temp with real
            return updated;
          }

          return [...current, msg];
        });
        this.markMessagesAsRead();
      }
    })
  );

// ---------------------------------------------------------------------------------------
    // --- 1. Connection Status Monitor ---
  // Place this here to alert the user if the socket drops
  this.subs.push(
    this.socketService.connectionStatus$.subscribe(status => {
      if (status === 'disconnected') {
        this.messageService.showWarn('Connection Lost', 'Real-time updates are paused.');
      } else if (status === 'connected') {
        // Optional: toast when connection is restored
        console.log('Socket connection active');
      }
    })
  );

  // --- 2. Global Socket Error Catcher ---
  // This is the "Black Box" recorder. If the server sends an error (like FORBIDDEN), 
  // this will catch it and show you a toast.
  // Note: Ensure your SocketService has an 'error$' or similar Subject.
  // Based on your previous code, we can listen to the generic socket error:
  this.subs.push(
    this.socketService.connectionEstablished$.subscribe(() => {
       console.log('Handshake verified with server.');
    })
  );
// ---------------------------------------------------------------------------------------

    

    // Inside setupSocketListeners() in chat.component.ts
this.subs.push(
  this.socketService.messageEdited$.subscribe((updatedMsg: ChatMessage) => {
    // Log this to see if the event is actually arriving from the socket
    console.log('Socket Edit Received:', updatedMsg);

    this.messages.update(current => 
      current.map(m => {
        // Use a safe string comparison
        const isTarget = String(m._id) === String(updatedMsg._id);
        return isTarget ? updatedMsg : m;
      })
    );
  })
);
    // // 3. Message Edited
    // this.subs.push(
    //   this.socketService.messageEdited$.subscribe((msg: ChatMessage) => {
    //     if (msg.channelId === this.activeChannelId()) {
    //       this.messages.update(current => current.map(m => m._id === msg._id ? msg : m));
    //     }
    //   })
    // );

    // 4. Message Deleted
    this.subs.push(
      this.socketService.messageDeleted$.subscribe((data: any) => {
        if (data.channelId === this.activeChannelId()) {
          this.messages.update(current => current.map(m => {
            if (m._id === data.messageId) return { ...m, body: '', attachments: [], deleted: true };
            return m;
          }));
        }
      })
    );

    // 5. Typing
    this.subs.push(
      this.socketService.typing$.subscribe((t: any) => {
        if (t.channelId === this.activeChannelId() && t.userId !== this.currentUserId()) {
          const map = new Map(this.typingUsers());
          if (t.isTyping) {
            map.set(t.userId, { userId: t.userId, timestamp: Date.now() });
          } else {
            map.delete(t.userId);
          }
          this.typingUsers.set(map);
        }
      })
    );

    // 6. Presence
    this.subs.push(
      this.socketService.channelUsers$.subscribe(map => this.channelUsers.set(map || {})),
      this.socketService.onlineUsers$.subscribe(users => this.onlineUsers.set(users || new Set()))
    );
  }

  // --- Channel Management ---

  loadChannels() {
    this.socketService.listChannels().subscribe({
      next: (res) => this.socketService.setChannels(res),
      error: (err) => console.error(err)
    });
  }

  selectChannel(channel: Channel) {
    if (this.activeChannelId() === channel._id) return;
    
    // Leave previous
    const prev = this.activeChannelId();
    if (prev) this.socketService.leaveChannel(prev);

    // Join new
    this.activeChannelId.set(channel._id!);
    this.messages.set([]);
    this.hasMoreMessages = true;
    this.socketService.joinChannel(channel._id!);
    
    // Clear unread
    const unread = this.unreadCounts();
    if (unread[channel._id!]) {
      this.unreadCounts.set({ ...unread, [channel._id!]: 0 });
    }

    if (this.mobileView()) this.sidebarOpen.set(false);
    
    this.loadMoreMessages();
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  // --- Message Loading (Infinite Scroll) ---

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    // Load more when scrolled near top (e.g. < 100px)
    if (element.scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
      this.loadMoreMessages();
    }
  }

  loadMoreMessages() {
    if (this.loadingMore || !this.activeChannelId()) return;
    
    this.loadingMore = true;
    const oldestMessage = this.messages()[0];
    const before = oldestMessage?.createdAt;

    this.socketService.fetchMessagesHttp(this.activeChannelId()!, before, this.pageSize).subscribe({
      next: (res: any) => {
        const newMessages = res.messages || []; // Assuming API returns { messages: [] }
        
        if (newMessages.length > 0) {
          // If fetching older messages, prepend. If fresh load, set.
          if (before) {
            this.messages.update(current => [...newMessages, ...current]);
          } else {
            this.messages.set(newMessages);
          }
          this.hasMoreMessages = newMessages.length >= this.pageSize;
        } else {
          this.hasMoreMessages = false;
        }
        this.loadingMore = false;
      },
      error: () => this.loadingMore = false
    });
  }

  markMessagesAsRead() {
    // Logic to mark messages as read via socket or API
    // this.socketService.markRead(this.activeChannelId()!);
  }

  // --- Sending Messages ---

  onMessageSend(event: { message: string; attachments: File[] }) {
    const body = event.message;
    const files = event.attachments;
    
    if (files.length > 0) {
      this.uploadAttachmentsAndSendMessage(body, files);
    } else if (body.trim()) {
      this.sendMessageViaSocket(body, []);
    }
  }
// Helper to handle senderId regardless of populated state
getSenderId(msg: any): string {
  if (!msg || !msg.senderId) return '';
  return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || msg.senderId.id || '');
}

  sendMessageViaSocket(body: string, attachments: Attachment[]) {
  const channelId = this.activeChannelId();
  if (!channelId) return;

  const tempId = `temp_${Date.now()}`;
  const optimisticMsg: ChatMessage = {
    _id: tempId,
    channelId,
    senderId: this.currentUserId(), 
    body,
    attachments,
    createdAt: new Date().toISOString()
  };
  
  // Show in UI immediately
  this.messages.update(msgs => [...msgs, optimisticMsg]);
  this.socketService.sendMessage({ channelId, body, attachments });
}
  
  // sendMessageViaSocket(body: string, attachments: Attachment[]) {
  //   const channelId = this.activeChannelId();
  //   if (!channelId) return;

  //   // Optimistic Update
  //   const tempId = `temp_${Date.now()}`;
  //   const optimisticMsg: ChatMessage = {
  //     _id: tempId,
  //     channelId,
  //     senderId: this.currentUserId(), // or full user object if needed by UI
  //     body,
  //     attachments,
  //     createdAt: new Date().toISOString(),
  //     read: false
  //   };
    
  //   this.messages.update(msgs => [...msgs, optimisticMsg]);
    
  //   // Clear Composer State via Bindings
  //   this.messageInput = '';
  //   this.attachments = [];
  //   this.uploadProgress.set(0);

  //   // Send
  //   this.socketService.sendMessage({ channelId, body, attachments });
  // }

  uploadAttachmentsAndSendMessage(body: string, files: File[]) {
    this.isUploading = true;
    this.uploadProgress.set(0);
    
    // Convert files to uploads sequentially or parallel
    // In a real app, use `this.socketService.upload(file)` which returns { name, url, type }
    
    const uploadObservables = files.map(file => 
      this.socketService.uploadAttachment(file).pipe(
        finalize(() => {
          this.uploadProgress.update(p => p + (100 / files.length));
        })
      )
    );

    // Mocking the result for now as I don't have your specific upload service signature
    // You would replace this Promise.all with `forkJoin(uploadObservables)`
    
    // --- REAL IMPLEMENTATION STUB ---
    /*
    forkJoin(uploadObservables).subscribe({
      next: (uploadedAttachments) => {
        this.isUploading = false;
        this.sendMessageViaSocket(body, uploadedAttachments);
      },
      error: (err) => {
        this.isUploading = false;
        this.messageService.showError('Upload Failed', err.message);
      }
    });
    */

    // --- MOCK IMPLEMENTATION (To make UI work immediately) ---
    setTimeout(() => {
        this.isUploading = false;
        const uploaded = files.map(f => ({ 
            name: f.name, 
            url: URL.createObjectURL(f), 
            type: f.type, 
            size: f.size 
        }));
        this.sendMessageViaSocket(body, uploaded);
    }, 1500); 
  }

  // --- Typing Indicators ---

  onTypingInput() {
    const cid = this.activeChannelId();
    if (!cid) return;

    this.socketService.sendTyping(cid, true);
    
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    
    this.typingTimeout = setTimeout(() => {
      this.socketService.sendTyping(cid, false);
    }, 2000);
  }

  cleanupTypingIndicators() {
    const now = Date.now();
    const map = new Map(this.typingUsers());
    let changed = false;
    
    map.forEach((val, key) => {
      if (now - val.timestamp > 3000) {
        map.delete(key);
        changed = true;
      }
    });
    
    if (changed) this.typingUsers.set(map);
  }

  // --- Helpers ---

  isUserInChannel(userId: string, channelId: string): boolean {
    const users = this.channelUsers()[channelId] || [];
    return users.includes(userId);
  }
  
  getUserName(userId: string): string {
    const user = this.masterList.users().find(u => u._id === userId);
    return user ? user.name : 'User';
  }

  // --- Modals & Popups ---

  // Channel Creation
  openCreateModal() { this.showCreateModal = true; this.newChannelName = ''; this.channelType = 'public'; }
  closeCreateModal() { this.showCreateModal = false; }
  
  submitCreateChannel() {
    if (!this.newChannelName.trim()) return;
    
    const members = this.channelType === 'private' ? Array.from(this.selectedMembers) : [];
    // Ensure current user is in private channel
    if (this.channelType === 'private' && !members.includes(this.currentUserId())) {
      members.push(this.currentUserId());
    }

    this.socketService.createChannelHttp(this.newChannelName, this.channelType, members).subscribe({
      next: (ch) => {
        this.channels.update(c => [ch, ...c]);
        this.selectChannel(ch);
        this.closeCreateModal();
        this.messageService.showSuccess('Created', `Channel #${ch.name} created.`);
      },
      error: (err) => this.messageService.handleHttpError(err, 'Creating channel')
    });
  }
  
  toggleMemberSelection(id: string) {
    if (this.selectedMembers.has(id)) this.selectedMembers.delete(id);
    else this.selectedMembers.add(id);
  }

  // Settings
  openChannelSettings() { this.showChannelSettings = true; }
  closeChannelSettings() { this.showChannelSettings = false; }
  
  // Add Members
  openAddMembersModal() { this.showAddMembersModal = true; this.newMembers.clear(); }
  closeAddMembersModal() { this.showAddMembersModal = false; }
  submitAddMembers() { 
    // Logic to add members via API
    this.closeAddMembersModal(); 
  }

  // --- Message Operations (Edit/Delete) ---

  startEditingMessage(msg: ChatMessage) {
    this.editingMessageId.set(msg._id!);
    this.editMessageText = msg.body || '';
  }

  cancelEditing() {
    this.editingMessageId.set(null);
    this.editMessageText = '';
  }

//   saveEditedMessage() {
//   const id = this.editingMessageId();
//   const text = this.editMessageText.trim();
  
//   if (!id || !text) return;

//   // 1. Update UI Optimistically immediately
//   this.messages.update(curr => 
//     curr.map(m => m._id === id ? { ...m, body: text, editedAt: new Date().toISOString() } : m)
//   );

//   // 2. Send to Server (Socket is better for real-time reflection)
//   this.socketService.editMessage(id, text);
  
//   // 3. Reset editing state
//   this.cancelEditing();
// }
  saveEditedMessage() {
  const id = this.editingMessageId();
  const text = this.editMessageText?.trim(); // Added optional chaining for safety
  
  // 🛑 Guard: Don't send if no ID, no text, or if it's still a temporary message
  if (!id || !text || id.startsWith('temp_')) return;

  // 1. Update UI Optimistically immediately
  this.messages.update(curr => 
    curr.map(m => {
      // Use String comparison to be 100% safe with Mongo IDs
      const isMatch = String(m._id) === String(id);
      return isMatch ? { ...m, body: text, editedAt: new Date().toISOString() } : m;
    })
  );

  // 2. Send to Server via Socket
  // This triggers the backend 'editMessage' listener we secured earlier
  this.socketService.editMessage(id, text);
  
  // 3. Reset UI state
  this.cancelEditing();
}
  // saveEditedMessage() {
  //   const id = this.editingMessageId();
  //   if (!id || !this.editMessageText.trim()) return;

  //   this.socketService.editMessageHttp(id, this.editMessageText).subscribe({
  //     next: (updated) => {
  //       this.messages.update(curr => curr.map(m => m._id === id ? updated : m));
  //       this.cancelEditing();
  //     }
  //   });
  // }

  // UPDATED: Use Socket for real-time delete
deleteMessage(msg: ChatMessage) {
  if (!msg._id || msg._id.startsWith('temp_')) return;
  if (!confirm('Permanently delete this message?')) return;

  // We emit via socket so EVERYONE hears it immediately
  this.socketService.deleteMessage(msg._id);
  
  // No need to manually update signals; the 'messageDeleted' 
  // socket listener above handles the UI update.
}
  // deleteMessage(msg: ChatMessage) {
  //   if (!confirm('Delete this message?')) return;
    
  //   this.socketService.deleteMessageHttp(msg._id!).subscribe({
  //     next: () => {
  //       this.messages.update(curr => curr.map(m => 
  //         m._id === msg._id ? { ...m, deleted: true, body: '', attachments: [] } : m
  //       ));
  //     }
  //   });
  // }

  // --- File Handlers passed to Composer ---
  
  onFilesSelected(files: File[]) {
    // This allows drag-and-drop in parent to update child, or child to notify parent
    this.attachments = [...this.attachments, ...files];
  }

  onAttachmentRemove(index: number) {
    this.attachments.splice(index, 1);
  }

  onInputClear() {
    this.messageInput = '';
    this.attachments = [];
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.socketService.disconnect();
  }
}

// import { Component, inject, OnInit, OnDestroy, computed, signal, HostListener } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subscription, finalize } from 'rxjs';
// import { HttpClient, HttpErrorResponse } from '@angular/common/http';

// // Import Components
// import { ChatSidebarComponent } from './chat-sidebar.component';
// import { ChatHeaderComponent } from './chat-header.component';
// import { ChatMessagesComponent } from './chat-messages.component';
// import { ChatComposerComponent } from './chat-composer.component';
// import { ChatModalsComponent } from './chat-modals.component';

// // Import Services
// import { SocketService } from '../../core/services/socket.service';
// import { MasterListService } from '../../core/services/master-list.service';
// import { AppMessageService } from '../../core/services/message.service';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { Toast } from "primeng/toast";

// // Import Models
// import { ChatMessage, Channel, Attachment } from './chat.models';

// @Component({
//   selector: 'app-chat',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     FormsModule, 
//     Toast, 
//     // DatePipe,
//     ChatSidebarComponent,
//     ChatHeaderComponent,
//     ChatMessagesComponent,
//     ChatComposerComponent,
//     ChatModalsComponent
//   ],
//   templateUrl: './chat.component.html',
//   styleUrls: ['./chat.component.scss']
// })
// export class ChatComponent implements OnInit, OnDestroy {
//   // Services
//   private socketService = inject(SocketService);
//   private masterList = inject(MasterListService);
//   private http = inject(HttpClient);
//   private messageService = inject(AppMessageService);
//   private authService = inject(AuthService);

//   // UI state - Using signals for reactivity
//   channels = signal<Channel[]>([]);
//   messages = signal<ChatMessage[]>([]);
//   activeChannelId = signal<string | null>(null);
//   currentUserId = signal<string>('');
//   currentUser = signal<any>(null);
//   messageInput:any;
//   isUploading = false;
//   isTyping = signal<boolean>(false);
//   typingUsers = signal<Map<string, {userId: string, timestamp: number}>>(new Map());
//   channelUsers = signal<Record<string, string[]>>({});
//   onlineUsers = signal<Set<string>>(new Set());
//   allUsers = signal<Map<string, any>>(new Map());

//   // Modal state
//   showCreateModal = false;
//   newChannelName = '';
//   channelType = 'public';
//   selectedMembers = new Set<string>();
  
//   // Message editing
//   editingMessageId = signal<string | null>(null);
//   editMessageText = '';

//   // Channel management
//   showChannelSettings = false;
//   showAddMembersModal = false;
//   newMembers = new Set<string>();

//   // Responsive sidebar
//   sidebarOpen = signal<boolean>(true);
//   mobileView = signal<boolean>(false);

//   // Upload state
//   attachments: File[] = [];
//   uploadProgress = signal<number>(0);

//   // Computed values
//   activeChannel = computed(() => {
//     const channelId = this.activeChannelId();
//     return this.channels().find(ch => ch._id === channelId) || null;
//   });

//   activeChannelUsers = computed(() => {
//     const channelId = this.activeChannelId();
//     return channelId ? this.channelUsers()[channelId] || [] : [];
//   });

//   typingIndicator = computed(() => {
//     const channelId = this.activeChannelId();
//     if (!channelId) return '';
    
//     const typingMap = this.typingUsers();
//     const typingInChannel = Array.from(typingMap.values())
//       .filter(t => !t.userId.startsWith('temp_') && this.isUserInChannel(t.userId, channelId))
//       .map(t => this.getUserName(t.userId))
//       .filter(name => name !== this.getUserName(this.currentUserId()));
    
//     if (typingInChannel.length === 0) return '';
//     if (typingInChannel.length === 1) return `${typingInChannel[0]} is typing...`;
//     if (typingInChannel.length === 2) return `${typingInChannel[0]} and ${typingInChannel[1]} are typing...`;
//     return `${typingInChannel[0]} and ${typingInChannel.length - 1} others are typing...`;
//   });

//   unreadCounts = signal<Record<string, number>>({});
//   lastReadTimestamps = signal<Record<string, number>>({});

//   // Infinite scroll
//   loadingMore = false;
//   hasMoreMessages = true;
//   pageSize = 50;

//   private subs: Subscription[] = [];
//   private typingTimeout: any = null;
//   private typingDebounceTime = 1000;
//   private cleanupTimer: any = null;

//   @HostListener('window:resize')
//   checkMobileView() {
//     this.mobileView.set(window.innerWidth < 768);
//     if (this.mobileView()) {
//       this.sidebarOpen.set(false);
//     }
//   }

//   ngOnInit(): void {
//     this.checkMobileView();
//     this.loadCurrentUser();
//     this.initializeSocketConnection();
//     this.setupSocketListeners();
//     this.loadChannels();
    
//     // Clean up old typing indicators periodically
//     this.cleanupTimer = setInterval(() => {
//       this.cleanupTypingIndicators();
//     }, 2000);
//   }

//   loadCurrentUser() {
//     const user = this.authService.getCurrentUser();
//     if (user) {
//       this.currentUserId.set(user._id);
//       this.currentUser.set(user);
//     } else {
//       const token = localStorage.getItem('apex_auth_token');
//       if (token) {
//         try {
//           const payload = JSON.parse(atob(token.split('.')[1]));
//           this.currentUserId.set(payload.sub || payload._id);
//           this.currentUser.set({ 
//             _id: payload.sub || payload._id, 
//             name: payload.name, 
//             email: payload.email 
//           });
//         } catch (error) {
//           console.error('Failed to parse token:', error);
//         }
//       }
//     }
//   }

//   initializeSocketConnection() {
//     const token = localStorage.getItem('apex_auth_token');
//     const orgId = this.getOrganizationId();
//     const userId = this.currentUserId();
    
//     if (token && orgId && userId) {
//       console.log('Initializing socket connection...');
//       this.socketService.connect(token, orgId, userId);
//     } else {
//       console.warn('Socket connection missing required data:', { token, orgId, userId });
//       this.messageService.showError('Connection Error', 'Unable to connect to chat. Please log in again.');
//     }
//   }

//   getOrganizationId(): string {
//     const token = localStorage.getItem('apex_auth_token');
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         return payload.organizationId || '';
//       } catch (error) {
//         console.error('Failed to parse organizationId from token:', error);
//       }
//     }
//     return '';
//   }

//   setupSocketListeners(): void {
//     // Clear existing subscriptions
//     this.subs.forEach(s => s.unsubscribe());
//     this.subs = [];

//     // 1. CHANNELS
//     this.subs.push(
//       this.socketService.channels$.subscribe((list: Channel[]) => {
//         console.log('Channels updated:', list?.length);
//         this.channels.set(list || []);
        
//         // Auto-select first channel if none selected
//         if (this.channels().length > 0 && !this.activeChannelId()) {
//           this.selectChannel(this.channels()[0]);
//         }
//       })
//     );

//     // 2. NEW MESSAGES
//     this.subs.push(
//       this.socketService.messages$.subscribe((msg: ChatMessage) => {
//         console.log('New message received:', msg);
        
//         if (msg.channelId === this.activeChannelId()) {
//           const current = this.messages();
//           // Avoid duplicates
//           if (msg._id && !current.some(m => m._id === msg._id)) {
//             this.messages.set([...current, msg]);
//             this.markMessagesAsRead();
//           }
//         }
//       })
//     );

//     // 3. MESSAGE EDITS
//     this.subs.push(
//       this.socketService.messageEdited$.subscribe((msg: ChatMessage) => {
//         console.log('Message edited:', msg);
//         if (msg.channelId === this.activeChannelId() && msg._id) {
//           const current = this.messages();
//           const updated = current.map(m => m._id === msg._id ? msg : m);
//           this.messages.set(updated);
//         }
//       })
//     );

//     // 4. MESSAGE DELETIONS
//     this.subs.push(
//       this.socketService.messageDeleted$.subscribe(data => {
//         console.log('Message deleted:', data);
//         if (data.channelId === this.activeChannelId()) {
//           const current = this.messages();
//           const updated = current.map(m => {
//             if (m._id === data.messageId) {
//               return { ...m, body: '', attachments: [], deleted: true };
//             }
//             return m;
//           });
//           this.messages.set(updated);
//         }
//       })
//     );

//     // 5. PRESENCE
//     this.subs.push(
//       this.socketService.channelUsers$.subscribe(map => {
//         this.channelUsers.set(map || {});
//       })
//     );

//     this.subs.push(
//       this.socketService.onlineUsers$.subscribe(users => {
//         this.onlineUsers.set(users);
//       })
//     );

//     // 6. TYPING
//     this.subs.push(
//       this.socketService.typing$.subscribe(t => {
//         console.log('Typing event:', t);
//         if (t.channelId === this.activeChannelId() && t.userId !== this.currentUserId()) {
//           const now = Date.now();
//           const typingMap = new Map(this.typingUsers());
//           typingMap.set(t.userId, { userId: t.userId, timestamp: now });
//           this.typingUsers.set(typingMap);
          
//           // Auto-remove after 3 seconds
//           setTimeout(() => {
//             const currentMap = new Map(this.typingUsers());
//             if (currentMap.has(t.userId)) {
//               const userData = currentMap.get(t.userId);
//               if (userData && now - userData.timestamp > 3000) {
//                 currentMap.delete(t.userId);
//                 this.typingUsers.set(currentMap);
//               }
//             }
//           }, 3000);
//         }
//       })
//     );

//     // 7. CHANNEL EVENTS
//     this.subs.push(
//       this.socketService.channelCreated$.subscribe((channel: Channel) => {
//         console.log('Channel created:', channel);
//         const current = this.channels();
//         if (channel._id && !current.some(c => c._id === channel._id)) {
//           this.channels.set([channel, ...current]);
//         }
//         this.messageService.showSuccess('Channel Created', `Channel "${channel.name}" created successfully`);
//       })
//     );
//   }

//   cleanupTypingIndicators() {
//     const now = Date.now();
//     const typingMap = new Map(this.typingUsers());
//     let changed = false;
    
//     for (const [userId, data] of typingMap.entries()) {
//       if (now - data.timestamp > 3000) {
//         typingMap.delete(userId);
//         changed = true;
//       }
//     }
    
//     if (changed) {
//       this.typingUsers.set(typingMap);
//     }
//   }

//   loadChannels() {
//     this.socketService.listChannels().subscribe({
//       next: (res: Channel[]) => {
//         console.log('Channels loaded via HTTP:', res);
//         this.socketService.setChannels(res);
//       },
//       error: (err) => {
//         console.error('Error loading channels:', err);
//         this.messageService.handleHttpError(err, 'Loading channels');
//       }
//     });
//   }

//   selectChannel(channel: Channel) {
//     if (!channel._id || this.activeChannelId() === channel._id) return;

//     console.log('Selecting channel:', channel._id);

//     // Leave previous channel
//     const prevChannelId = this.activeChannelId();
//     if (prevChannelId) {
//       this.socketService.leaveChannel(prevChannelId);
//       this.markMessagesAsRead();
//     }
    
//     // Set new channel
//     this.activeChannelId.set(channel._id);
//     this.messages.set([]);
//     this.hasMoreMessages = true;
//     this.editingMessageId.set(null);
    
//     // Join new channel via socket
//     this.socketService.joinChannel(channel._id);
    
//     // Close sidebar on mobile
//     if (this.mobileView()) {
//       this.sidebarOpen.set(false);
//     }
    
//     // Load messages
//     this.loadMessagesForActiveChannel();
    
//     // Clear typing indicators
//     const newTypingMap = new Map(this.typingUsers());
//     newTypingMap.clear();
//     this.typingUsers.set(newTypingMap);
//   }

//   loadMessagesForActiveChannel() {
//     const channelId = this.activeChannelId();
//     if (!channelId) return;
    
//     console.log('Loading messages for channel:', channelId);
    
//     // Clear existing messages
//     this.messages.set([]);
//     this.loadMoreMessages();
//   }

//   loadMoreMessages() {
//     if (this.loadingMore || !this.hasMoreMessages || !this.activeChannelId()) return;
    
//     this.loadingMore = true;
//     const oldestMessage = this.messages()[0];
//     const before = oldestMessage?.createdAt;
    
//     console.log('Loading more messages, before:', before);
    
//     this.socketService.fetchMessagesHttp(this.activeChannelId()!, before, this.pageSize).subscribe({
//       next: (res: any) => {
//         console.log('Messages loaded:', res.messages?.length);
//         if (res.messages?.length > 0) {
//           const socketMessages: ChatMessage[] = res.messages.reverse();
          
//           const current = this.messages();
          
//           // Filter out duplicates
//           const existingIds = new Set(current.map(m => m._id));
//           const uniqueNewMessages = socketMessages.filter(msg => 
//             msg._id && !existingIds.has(msg._id)
//           );
          
//           if (before) {
//             // Prepend for infinite scroll
//             this.messages.set([...uniqueNewMessages, ...current]);
//           } else {
//             // First load or channel switch
//             this.messages.set(uniqueNewMessages);
//           }
          
//           this.hasMoreMessages = res.messages.length === this.pageSize;
//         } else {
//           this.hasMoreMessages = false;
//         }
//         this.loadingMore = false;
//       },
//       error: (err: HttpErrorResponse) => {
//         console.error('Error loading messages:', err);
//         this.messageService.handleHttpError(err, 'Loading messages');
//         this.loadingMore = false;
//       }
//     });
//   }

//   openChannelSettings() {
//     this.showChannelSettings = true;
//   }

// sendMessage() {
//   const channelId = this.activeChannelId();
//   const body = this.messageInput.trim();
  
//   if (!channelId) {
//     this.messageService.showWarn('Validation', 'Please select a channel');
//     return;
//   }
  
//   // Check if there's either a message body OR attachments
//   if (!body && this.attachments.length === 0) {
//     this.messageService.showWarn('Validation', 'Message or attachment is required');
//     return;
//   }
  
//   if (this.attachments.length > 0) {
//     this.uploadAttachmentsAndSendMessage(body);
//   } else {
//     this.sendMessageViaSocket(body, []);
//   }
// }

// onMessageSend(event: { message: string; attachments: File[] }) {
//   this.messageInput = event.message;
//   this.attachments = event.attachments;
//   this.sendMessage(); // Your existing send method
// }

// onFilesSelected(files: File[]) {
//   // Handle new file selections
//   this.attachments = [...this.attachments, ...files];
//   // Trigger upload if needed
// }

// onAttachmentRemove(index: number) {
//   this.attachments.splice(index, 1);
// }

// onInputClear() {
//   this.messageInput = '';
//   this.attachments = [];
// }
//   sendMessageViaSocket(body: string, attachments: Attachment[]) {
//     const channelId = this.activeChannelId();
//     if (!channelId) return;
    
//     const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
//     // Create optimistic message
//     const optimisticMessage: ChatMessage = {
//       _id: tempId,
//       channelId,
//       senderId: this.currentUserId(),
//       body,
//       attachments,
//       createdAt: new Date().toISOString(),
//       read: false
//     };
    
//     // Add to messages list
//     const current = this.messages();
//     this.messages.set([...current, optimisticMessage]);
    
//     // Clear input immediately for better UX
//     this.messageInput = '';
//     this.attachments = [];
//     this.uploadProgress.set(0);
    
//     // Stop typing
//     this.stopTyping();
    
//     // Send via socket
//     const payload = {
//       channelId,
//       body,
//       attachments
//     };
    
//     console.log('Sending message via socket:', payload);
//     this.socketService.sendMessage(payload);
//   }

//   uploadAttachmentsAndSendMessage(body: string) {
//     this.isUploading = true;
//     this.uploadProgress.set(0);
    
//     const uploadPromises = this.attachments.map(file => 
//       this.socketService.uploadAttachment(file).pipe(
//         finalize(() => {
//           this.uploadProgress.update(prev => prev + (100 / this.attachments.length));
//         })
//       ).toPromise()
//     );

//     Promise.all(uploadPromises)
//       .then((attachments: any[]) => {
//         this.isUploading = false;
//         this.uploadProgress.set(0);
//         this.sendMessageViaSocket(body, attachments);
//       })
//       .catch((error) => {
//         this.isUploading = false;
//         this.uploadProgress.set(0);
//         this.messageService.handleHttpError(error, 'Uploading files');
//       });
//   }

//   startTyping() {
//     const channelId = this.activeChannelId();
//     if (!channelId || this.isTyping()) return;
    
//     console.log('Starting typing in channel:', channelId);
//     this.isTyping.set(true);
//     this.socketService.sendTyping(channelId, true);
    
//     // Send typing indicator every 3 seconds while typing
//     if (this.typingTimeout) {
//       clearTimeout(this.typingTimeout);
//     }
    
//     this.typingTimeout = setInterval(() => {
//       if (this.isTyping()) {
//         this.socketService.sendTyping(channelId, true);
//       }
//     }, 3000);
//   }

//   stopTyping() {
//     const channelId = this.activeChannelId();
//     if (!channelId || !this.isTyping()) return;
    
//     console.log('Stopping typing in channel:', channelId);
//     this.isTyping.set(false);
//     this.socketService.sendTyping(channelId, false);
    
//     if (this.typingTimeout) {
//       clearInterval(this.typingTimeout);
//       this.typingTimeout = null;
//     }
//   }

//   onTypingInput() {
//     this.startTyping();
    
//     // Debounce stop typing
//     if (this.typingTimeout) {
//       clearTimeout(this.typingTimeout);
//     }
    
//     this.typingTimeout = setTimeout(() => {
//       this.stopTyping();
//     }, this.typingDebounceTime);
//   }

//   handleFileUpload(ev: Event) {
//     const input = ev.target as HTMLInputElement;
//     const files = input.files;
//     if (!files || files.length === 0 || !this.activeChannelId()) return;
    
//     // Add files to attachments list
//     Array.from(files).forEach(file => {
//       this.attachments.push(file);
//     });
    
//     input.value = ''; // Reset input
//   }

//   removeAttachment(index: number) {
//     this.attachments.splice(index, 1);
//   }

//   triggerFilePicker() { 
//     const fileInput = document.createElement('input');
//     fileInput.type = 'file';
//     fileInput.multiple = true;
//     fileInput.onchange = (ev) => this.handleFileUpload(ev);
//     fileInput.click();
//   }

//   // --- Message Editing ---
//   startEditingMessage(msg: ChatMessage) {
//     if (!msg._id || this.getSenderId(msg) !== this.currentUserId() || msg.deleted) return;
    
//     this.editingMessageId.set(msg._id);
//     this.editMessageText = msg.body || '';
//   }

//   cancelEditing() {
//     this.editingMessageId.set(null);
//     this.editMessageText = '';
//   }

//   saveEditedMessage() {
//     const messageId = this.editingMessageId();
//     if (!messageId || !this.editMessageText.trim()) return;
    
//     console.log('Editing message:', messageId);
    
//     this.socketService.editMessageHttp(messageId, this.editMessageText.trim()).subscribe({
//       next: (updatedMessage: ChatMessage) => {
//         this.cancelEditing();
        
//         // Update local state
//         const current = this.messages();
//         const updated = current.map(m => m._id === messageId ? updatedMessage : m);
//         this.messages.set(updated);
        
//         this.messageService.showSuccess('Message Updated', 'Message has been updated');
//       },
//       error: (err: HttpErrorResponse) => {
//         this.messageService.handleHttpError(err, 'Editing message');
//       }
//     });
//   }

//   deleteMessage(msg: ChatMessage) {
//     if (!msg._id || this.getSenderId(msg) !== this.currentUserId() || msg.deleted) return;
    
//     if (confirm('Are you sure you want to delete this message?')) {
//       console.log('Deleting message:', msg._id);
      
//       this.socketService.deleteMessageHttp(msg._id).subscribe({
//         next: () => {
//           // Update local state
//           const current = this.messages();
//           const updated = current.map(m => {
//             if (m._id === msg._id) {
//               return { ...m, body: '', attachments: [], deleted: true };
//             }
//             return m;
//           });
//           this.messages.set(updated);
          
//           this.messageService.showSuccess('Message Deleted', 'Message has been deleted');
//         },
//         error: (err: HttpErrorResponse) => {
//           this.messageService.handleHttpError(err, 'Deleting message');
//         }
//       });
//     }
//   }

//   // --- Channel Creation ---
//   openCreateModal() { 
//     this.showCreateModal = true; 
//     this.newChannelName = ''; 
//     this.channelType = 'public';
//     this.selectedMembers.clear();
//   }

//   closeCreateModal() { 
//     this.showCreateModal = false; 
//   }
  
//   toggleMemberSelection(id: string) {
//     if (this.selectedMembers.has(id)) {
//       this.selectedMembers.delete(id);
//     } else {
//       this.selectedMembers.add(id);
//     }
//   }

//   submitCreateChannel() {
//     if (!this.newChannelName.trim()) {
//       this.messageService.showWarn('Validation', 'Channel name is required');
//       return;
//     }

//     const members = this.channelType === 'public' ? [] : Array.from(this.selectedMembers);
//     if (this.channelType !== 'public' && this.currentUserId()) {
//       members.push(this.currentUserId());
//     }

//     console.log('Creating channel:', this.newChannelName, this.channelType, members);

//     this.socketService.createChannelHttp(
//       this.newChannelName.trim(), 
//       this.channelType as 'public' | 'private' | 'dm', 
//       members
//     ).subscribe({
//       next: (ch: Channel) => {
//         console.log('Channel created:', ch);
        
//         // Also emit socket event for real-time
//         this.socketService.createChannel(
//           this.newChannelName.trim(),
//           this.channelType as 'public' | 'private' | 'dm',
//           members
//         );
        
//         this.showCreateModal = false;
//         this.selectChannel(ch);
//         this.messageService.showSuccess('Channel Created', `Channel "${ch.name}" created successfully`);
//       },
//       error: (err: HttpErrorResponse) => {
//         console.error('Error creating channel:', err);
//         this.messageService.handleHttpError(err, 'Creating channel');
//       }
//     });
//   }

//   // --- Message Read Status ---
//   markMessagesAsRead() {
//     const channelId = this.activeChannelId();
//     if (!channelId) return;

//     const unreadMessages = this.messages()
//       .filter(m => !m.read && this.getSenderId(m) !== this.currentUserId())
//       .map(m => m._id)
//       .filter((id): id is string => !!id);

//     if (unreadMessages.length > 0) {
//       console.log('Marking messages as read:', unreadMessages.length);
//       this.socketService.markRead(channelId, unreadMessages);
//       this.lastReadTimestamps.set({ ...this.lastReadTimestamps(), [channelId]: Date.now() });
//     }
//   }

//   // --- Helper Methods ---
//   isUserInChannel(userId: string, channelId: string): boolean {
//     const users = this.channelUsers()[channelId] || [];
//     return users.includes(userId);
//   }

//   isUserOnline(userId: string): boolean {
//     return this.onlineUsers().has(userId);
//   }

//   getInitials(userId: string): string {
//     const user = this.allUsers().get(userId);
//     if (user?.name) {
//       return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
//     }
//     return userId.slice(0, 2).toUpperCase();
//   }

//   getUserName(userId: string): string {
//     const user = this.allUsers().get(userId);
//     return user?.name || 'User';
//   }

//   getSenderId(msg: ChatMessage): string {
//     if (!msg || !msg.senderId) return '';
//     return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
//   }

//   getSenderName(msg: ChatMessage): string {
//     if (!msg || !msg.senderId) return 'Unknown';
//     if (typeof msg.senderId === 'object' && msg.senderId.name) return msg.senderId.name;
//     if (typeof msg.senderId === 'string') {
//       return this.getUserName(msg.senderId);
//     }
//     return 'User';
//   }

//   getSenderAvatar(msg: ChatMessage): string {
//     const name = this.getSenderName(msg);
//     return name.charAt(0).toUpperCase();
//   }

//   getFileIconClass(url: string): string {
//     if (!url) return 'pi-file';
    
//     if (this.isImage(url)) return 'pi-image';
//     if (this.isVideo(url)) return 'pi-video';
//     if (this.isAudio(url)) return 'pi-volume-up';
//     if (/\.(pdf)$/i.test(url)) return 'pi-file-pdf';
//     if (/\.(docx?|rtf)$/i.test(url)) return 'pi-file-word';
//     if (/\.(xlsx?|csv)$/i.test(url)) return 'pi-file-excel';
//     if (/\.(zip|rar|tar|gz)$/i.test(url)) return 'pi-file-archive';
    
//     return 'pi-file';
//   }

//   isImage(url?: string): boolean {
//     if (!url) return false;
//     return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(url) || 
//            url.includes('cloudinary') || 
//            url.includes('image');
//   }

//   isVideo(url?: string): boolean {
//     if (!url) return false;
//     return /\.(mp4|webm|mov|avi|mkv)$/i.test(url) || 
//            url.includes('video');
//   }

//   isAudio(url?: string): boolean {
//     if (!url) return false;
//     return /\.(mp3|wav|ogg|flac|aac)$/i.test(url) || 
//            url.includes('audio');
//   }

//   formatFileSize(bytes?: number): string {
//     if (!bytes || bytes === 0) return '0 Bytes';
    
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
    
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }

//   hasMessageInput(): boolean {
//     return this.messageInput && this.messageInput.trim().length > 0;
//   }

//   showDateSeparator(index: number, msg: ChatMessage): boolean {
//     if (index === 0) return true;
//     const prevMsg = this.messages()[index - 1];
//     if (!prevMsg || !msg.createdAt || !prevMsg.createdAt) return false;
    
//     const prevDate = new Date(prevMsg.createdAt).toDateString();
//     const currentDate = new Date(msg.createdAt).toDateString();
//     return prevDate !== currentDate;
//   }

//   sendOnEnter(event: any) {
//     if (event.key === 'Enter' && !event.shiftKey) {
//       event.preventDefault();
//       this.sendMessage();
//     }
//   }

//   toggleSidebar() {
//     this.sidebarOpen.set(!this.sidebarOpen());
//   }

//   onScroll(event: Event) {
//     const element = event.target as HTMLElement;
//     if (element.scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
//       this.loadMoreMessages();
//     }
//   }

//   clearInput() {
//     this.messageInput = '';
//     this.attachments = [];
//     this.uploadProgress.set(0);
//     this.stopTyping();
//   }


// // Add these methods to your ChatComponent class (in chat.component.ts)

// // --- Channel Settings Methods ---
// closeChannelSettings() {
//   this.showChannelSettings = false;
// }

// // --- Add Members Modal Methods ---
// openAddMembersModal() {
//   this.showAddMembersModal = true;
//   this.newMembers.clear();
// }

// closeAddMembersModal() {
//   this.showAddMembersModal = false;
// }

// submitAddMembers() {
//   const channelId = this.activeChannelId();
//   if (!channelId || this.newMembers.size === 0) {
//     this.messageService.showWarn('Validation', 'Please select members to add');
//     return;
//   }

//   console.log('Adding members to channel:', channelId, Array.from(this.newMembers));
  
//   // Call your service to add members (you'll need to implement this in your SocketService)
//   // Example:
//   // this.socketService.addMembersToChannel(channelId, Array.from(this.newMembers))
//   //   .subscribe({
//   //     next: (updatedChannel) => {
//   //       this.showAddMembersModal = false;
//   //       this.newMembers.clear();
//   //       this.messageService.showSuccess('Members Added', 'Members have been added to the channel');
//   //     },
//   //     error: (err) => {
//   //       this.messageService.handleHttpError(err, 'Adding members');
//   //     }
//   //   });
  
//   // For now, just close the modal
//   this.showAddMembersModal = false;
//   this.newMembers.clear();
//   this.messageService.showInfo('Coming Soon', 'Add members feature will be implemented soon');
// }


//   ngOnDestroy() {
//     // Unsubscribe from all subscriptions
//     this.subs.forEach(s => s.unsubscribe());
//     this.subs = [];
    
//     // Leave current channel
//     if (this.activeChannelId()) {
//       this.socketService.leaveChannel(this.activeChannelId()!);
//       this.markMessagesAsRead();
//     }
    
//     // Stop typing
//     this.stopTyping();
    
//     // Clear timeouts
//     if (this.typingTimeout) {
//       clearTimeout(this.typingTimeout);
//     }
    
//     if (this.cleanupTimer) {
//       clearInterval(this.cleanupTimer);
//     }
    
//     // Disconnect socket
//     this.socketService.disconnect();
//   }
// }
