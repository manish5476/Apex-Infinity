import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  effect,
  ChangeDetectorRef,
  signal,
  computed,
  HostListener
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Import Services
import { SocketService, ChatMessage, Channel, Attachment, NotificationData } from '../../core/services/socket.service';
import { MasterListService } from '../../core/services/master-list.service';
import { AppMessageService } from '../../core/services/message.service';
import { Toast } from "primeng/toast";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, Toast, DatePipe],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  // Services
  public socketService = inject(SocketService);
  public masterList = inject(MasterListService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(AppMessageService);



  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('messageInput') public messageInputEl!: ElementRef<HTMLTextAreaElement>;

  // UI state - Using signals for reactivity
  channels = signal<Channel[]>([]);
  messages = signal<ChatMessage[]>([]);
  messagesBatch = signal<ChatMessage[]>([]);
  
  activeChannelId = signal<string | null>(null);
  currentUserId = signal<string>('');
  messageInput = '';
  isUploading = false;
  isTyping = signal<boolean>(false);
  typingUsers = signal<Map<string, {userId: string, timestamp: number}>>(new Map());
  channelUsers = signal<Record<string, string[]>>({});
  onlineUsers = signal<Set<string>>(new Set());

  // Modal state
  showCreateModal = false;
  newChannelName = '';
  channelType = 'public';
  selectedMembers = new Set<string>();
  
  // Message editing
  editingMessageId = signal<string | null>(null);
  editMessageText = '';

  // Channel management
  showChannelSettings = false;
  showAddMembersModal = false;
  newMembers = new Set<string>();

  // Responsive sidebar
  sidebarOpen = signal<boolean>(true);
  mobileView = signal<boolean>(false);

  // Computed values
  activeChannel = computed(() => {
    const channelId = this.activeChannelId();
    return this.channels().find(ch => ch._id === channelId);
  });

  activeChannelUsers = computed(() => {
    const channelId = this.activeChannelId();
    return channelId ? this.channelUsers()[channelId] || [] : [];
  });

  typingIndicator = computed(() => {
    const channelId = this.activeChannelId();
    if (!channelId) return '';
    
    const typingMap = this.typingUsers();
    const typingInChannel = Array.from(typingMap.values())
      .filter(t => !t.userId.startsWith('temp_') && this.isUserInChannel(t.userId, channelId))
      .map(t => this.getUserName(t.userId))
      .filter(name => name !== this.getUserName(this.currentUserId()));
    
    if (typingInChannel.length === 0) return '';
    if (typingInChannel.length === 1) return `${typingInChannel[0]} is typing...`;
    if (typingInChannel.length === 2) return `${typingInChannel[0]} and ${typingInChannel[1]} are typing...`;
    return `${typingInChannel[0]} and ${typingInChannel.length - 1} others are typing...`;
  });

  unreadCounts = signal<Record<string, number>>({});
  lastReadTimestamps = signal<Record<string, number>>({});

  // Infinite scroll
  loadingMore = false;
  hasMoreMessages = true;
  pageSize = 50;

  private subs: Subscription[] = [];
  private typingTimeout: any = null;
  private typingDebounceTime = 300;

  constructor() {
    effect(() => {
      const users = this.masterList.users();
      this.cdr.markForCheck();
    });

    effect(() => {
      this.checkMobileView();
    });
  }

  ngOnInit(): void {
    this.checkMobileView();
    this.getCurrentUser();
    this.loadChannels();
    this.setupSocketListeners();
    
    // Auto-connect socket
    const token = localStorage.getItem('apex_auth_token');
    const orgId = this.getOrganizationId();
    if (token && orgId && this.currentUserId()) {
      this.socketService.connect(token, orgId, this.currentUserId());
    }
  }

 

  clearInput() {
    this.messageInput = '';
    this.autoResizeTextarea({ target: this.messageInputEl.nativeElement });
  }

  getOrganizationId(): string {
    const token = localStorage.getItem('apex_auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.organizationId || '';
      } catch {}
    }
    return '';
  }

  setupSocketListeners(): void {
    // --- 1. CHANNELS ---
    this.subs.push(this.socketService.channels$.subscribe(list => {
      this.channels.set(list || []);
      if (this.channels().length > 0 && !this.activeChannelId()) {
        this.selectChannel(this.channels()[0]);
      }
      this.cdr.markForCheck();
    }));

    // --- 2. MESSAGES ---
    this.subs.push(this.socketService.messages$.subscribe(msg => {
      if (msg.channelId === this.activeChannelId()) {
        const current = this.messages();
        this.messages.set([...current, msg]);
        this.markMessagesAsRead();
        setTimeout(() => this.scrollToBottom(), 100);
      }
      this.cdr.markForCheck();
    }));

    this.subs.push(this.socketService.messagesBatch$.subscribe(batch => {
      this.messagesBatch.set(batch || []);
      if (this.activeChannelId()) {
        this.loadMessagesForActiveChannel();
      }
      this.cdr.markForCheck();
    }));

    // --- 3. MESSAGE EDITS ---
    this.subs.push(this.socketService.messageEdited$.subscribe(msg => {
      if (msg.channelId === this.activeChannelId()) {
        const current = this.messages();
        const updated = current.map(m => m._id === msg._id ? msg : m);
        this.messages.set(updated);
        this.cdr.markForCheck();
      }
    }));

    // --- 4. MESSAGE DELETIONS ---
    this.subs.push(this.socketService.messageDeleted$.subscribe(data => {
      if (data.channelId === this.activeChannelId()) {
        const current = this.messages();
        const updated = current.map(m => {
          if (m._id === data.messageId) {
            return { ...m, body: '', attachments: [], deleted: true };
          }
          return m;
        });
        this.messages.set(updated);
        this.cdr.markForCheck();
      }
    }));

    // --- 5. PRESENCE ---
    this.subs.push(this.socketService.channelUsers$.subscribe(map => {
      this.channelUsers.set(map || {});
      this.cdr.markForCheck();
    }));

    this.subs.push(this.socketService.onlineUsers$.subscribe(users => {
      this.onlineUsers.set(users);
      this.cdr.markForCheck();
    }));

    // --- 6. TYPING ---
    this.subs.push(this.socketService.typing$.subscribe(t => {
      if (t.channelId === this.activeChannelId() && t.userId !== this.currentUserId()) {
        const now = Date.now();
        this.typingUsers().set(t.userId, { userId: t.userId, timestamp: now });
        
        // Clean up typing indicator after 3 seconds
        setTimeout(() => {
          if (this.typingUsers().has(t.userId)) {
            const userData = this.typingUsers().get(t.userId);
            if (userData && now - userData.timestamp > 3000) {
              this.typingUsers().delete(t.userId);
              this.cdr.markForCheck();
            }
          }
        }, 3000);
      }
      this.cdr.markForCheck();
    }));

    // --- 7. CHANNEL EVENTS ---
    this.subs.push(this.socketService.channelCreated$.subscribe(channel => {
      const current = this.channels();
      this.channels.set([channel, ...current]);
      this.messageService.showSuccess('Channel Created', `Channel "${channel.name}" created successfully`);
      this.cdr.markForCheck();
    }));

    this.subs.push(this.socketService.channelUpdated$.subscribe(channel => {
      const current = this.channels();
      const updated = current.map(c => c._id === channel._id ? channel : c);
      this.channels.set(updated);
      
      if (channel._id === this.activeChannelId()) {
        this.messageService.showInfo('Channel Updated', `Channel "${channel.name}" has been updated`);
      }
      this.cdr.markForCheck();
    }));

    // --- 8. NOTIFICATIONS ---
    this.subs.push(this.socketService.announcement$.subscribe(announcement => {
      this.messageService.showInfo(announcement.title, announcement.message, 8000 );
    }));

    // --- 9. CONNECTION STATUS ---
    this.subs.push(this.socketService.connectionStatus$.subscribe(status => {
      if (status === 'disconnected') {
        this.messageService.showWarn('Connection Lost', 'Attempting to reconnect...');
      } else if (status === 'connected') {
        this.messageService.showSuccess('Connected', 'Chat connection established');
      }
    }));
  }

  @HostListener('window:resize')
  checkMobileView() {
    this.mobileView.set(window.innerWidth < 768);
    if (this.mobileView()) {
      this.sidebarOpen.set(false);
    }
  }

  getCurrentUser() {
    const token = localStorage.getItem('apex_auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId.set(payload.sub || payload._id);
      } catch {}
    }
  }

  loadChannels() {
    this.socketService.listChannels().subscribe({
      next: (res) => {
        this.socketService.setChannels(res);
      },
      error: (err) => {
        this.messageService.handleHttpError(err, 'Loading channels');
      }
    });
  }

  selectChannel(channel: Channel) {
    if (!channel || this.activeChannelId() === channel._id) return;

    // Leave previous channel
    if (this.activeChannelId()) {
      this.socketService.leaveChannel(this.activeChannelId()!);
      this.markMessagesAsRead();
    }
    
    // Set new channel
    this.activeChannelId.set(channel._id);
    this.messages.set([]);
    this.hasMoreMessages = true;
    
    // Join new channel
    this.socketService.joinChannel(channel._id);
    
    // Close sidebar on mobile
    if (this.mobileView()) {
      this.sidebarOpen.set(false);
    }
    
    // Load messages
    this.loadMessagesForActiveChannel();
    
    // Mark as read
    this.markMessagesAsRead();
    
    this.cdr.markForCheck();
  }

  loadMessagesForActiveChannel() {
    const channelId = this.activeChannelId();
    if (!channelId) return;
    
    const batchMessages = this.messagesBatch().filter(m => m.channelId === channelId);
    this.messages.set(batchMessages);
    
    // Check if we need to load more
    if (batchMessages.length < this.pageSize) {
      this.loadMoreMessages();
    }
    
    setTimeout(() => this.scrollToBottom(), 100);
  }

  loadMoreMessages() {
    if (this.loadingMore || !this.hasMoreMessages || !this.activeChannelId()) return;
    
    this.loadingMore = true;
    const oldestMessage = this.messages()[0];
    const before = oldestMessage?.createdAt;
    
    // Use HTTP version instead of socket
    this.socketService.fetchMessagesHttp(this.activeChannelId()!, before, this.pageSize).subscribe({
      next: (res: any) => {
        if (res.messages?.length > 0) {
          const current = this.messages();
          this.messages.set([...res.messages.reverse(), ...current]);
          this.hasMoreMessages = res.messages.length === this.pageSize;
        } else {
          this.hasMoreMessages = false;
        }
        this.loadingMore = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.handleHttpError(err, 'Loading messages');
        this.loadingMore = false;
        this.cdr.markForCheck();
      }
    });
  }

  sendMessage() {
    const channelId = this.activeChannelId();
    const body = this.messageInput.trim();
    
    if (!channelId || (!body && !this.isUploading)) return;
    
    const payload = {
      channelId,
      body,
      attachments: []
    };

    this.socketService.sendMessage(payload);
    this.messageInput = '';
    this.stopTyping();
    
    // Reset textarea height
    if (this.messageInputEl) {
      this.messageInputEl.nativeElement.style.height = 'auto';
    }
    
    this.cdr.markForCheck();
  }

  startTyping() {
    if (!this.activeChannelId() || this.isTyping()) return;
    
    this.isTyping.set(true);
    this.socketService.sendTyping(this.activeChannelId()!, true);
    
    // Send typing indicator every 3 seconds while typing
    this.typingTimeout = setTimeout(() => {
      if (this.isTyping()) {
        this.socketService.sendTyping(this.activeChannelId()!, true);
      }
    }, 3000);
  }

  stopTyping() {
    if (!this.activeChannelId() || !this.isTyping()) return;
    
    this.isTyping.set(false);
    this.socketService.sendTyping(this.activeChannelId()!, false);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  onTypingInput() {
    this.startTyping();
    
    // Reset typing timer
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Debounce stop typing
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, this.typingDebounceTime);
  }

  handleFileUpload(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.activeChannelId()) return;

    this.isUploading = true;
    this.cdr.markForCheck();

    this.socketService.uploadAttachment(file).subscribe({
      next: (attachment: Attachment) => {
        this.isUploading = false;
        // Use the socket service to send message with attachment
        this.socketService.sendMessage({
          channelId: this.activeChannelId()!,
          body: '',
          attachments: [attachment]
        });
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.isUploading = false;
        this.messageService.handleHttpError(err, 'Uploading file');
        this.cdr.markForCheck();
      }
    });
    input.value = '';
  }

  triggerFilePicker() { 
    this.fileInput?.nativeElement?.click(); 
  }

  // --- Message Editing ---
  startEditingMessage(msg: ChatMessage) {
    if (this.getSenderId(msg) !== this.currentUserId()) return;
    
    this.editingMessageId.set(msg._id || null);
    this.editMessageText = msg.body || '';
    this.cdr.markForCheck();
  }

  cancelEditing() {
    this.editingMessageId.set(null);
    this.editMessageText = '';
    this.cdr.markForCheck();
  }

  saveEditedMessage() {
    const messageId = this.editingMessageId();
    if (!messageId || !this.editMessageText.trim()) return;
    
    // Use HTTP version for editing message
    this.socketService.editMessageHttp(messageId, this.editMessageText.trim()).subscribe({
      next: (updatedMessage: ChatMessage) => {
        this.cancelEditing();
        this.messageService.showSuccess('Message Updated', 'Message has been updated');
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.handleHttpError(err, 'Editing message');
      }
    });
  }

  deleteMessage(msg: ChatMessage) {
    if (!msg._id || this.getSenderId(msg) !== this.currentUserId()) return;
    
    if (confirm('Are you sure you want to delete this message?')) {
      // Use HTTP version for deleting message
      this.socketService.deleteMessageHttp(msg._id).subscribe({
        next: () => {
          this.messageService.showSuccess('Message Deleted', 'Message has been deleted');
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.handleHttpError(err, 'Deleting message');
        }
      });
    }
  }

  // --- Channel Management ---
  openCreateModal() { 
    this.showCreateModal = true; 
    this.newChannelName = ''; 
    this.channelType = 'public';
    this.selectedMembers.clear();
    this.cdr.markForCheck();
  }

  closeCreateModal() { 
    this.showCreateModal = false; 
    this.cdr.markForCheck();
  }
  
  toggleMemberSelection(id: string) {
    if (this.selectedMembers.has(id)) this.selectedMembers.delete(id);
    else this.selectedMembers.add(id);
  }

  submitCreateChannel() {
    if (!this.newChannelName.trim()) {
      this.messageService.showWarn('Validation', 'Channel name is required');
      return;
    }

    const members = this.channelType === 'public' ? [] : Array.from(this.selectedMembers);
    if (this.channelType !== 'public' && this.currentUserId()) {
      members.push(this.currentUserId());
    }

    // Use HTTP version for creating channel
    this.socketService.createChannelHttp(this.newChannelName, this.channelType as any, members)
      .subscribe({
        next: (ch: Channel) => {
          // Also create via socket for real-time updates
          this.socketService.createChannel(this.newChannelName, this.channelType as any, members);
          
          this.socketService.addChannel(ch);
          this.showCreateModal = false;
          this.selectChannel(ch);
          this.messageService.showSuccess('Channel Created', `Channel "${ch.name}" created successfully`);
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.handleHttpError(err, 'Creating channel');
        }
      });
  }

  // --- Channel Settings ---
  openChannelSettings() {
    this.showChannelSettings = true;
  }

  closeChannelSettings() {
    this.showChannelSettings = false;
  }

  openAddMembersModal() {
    this.newMembers.clear();
    this.showAddMembersModal = true;
  }

  closeAddMembersModal() {
    this.showAddMembersModal = false;
  }

  addMembersToChannel() {
    const channelId = this.activeChannelId();
    if (!channelId || this.newMembers.size === 0) return;

    const memberIds = Array.from(this.newMembers);
    // Note: You'll need to implement HTTP endpoint for adding multiple members
    // For now, we'll add one by one
    memberIds.forEach(memberId => {
      this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/members`, { userId: memberId })
        .subscribe({
          next: () => {
            this.messageService.showSuccess('Member Added', 'User added to channel');
          },
          error: (err: HttpErrorResponse) => {
            this.messageService.handleHttpError(err, 'Adding member');
          }
        });
    });

    this.closeAddMembersModal();
  }

  removeMember(userId: string) {
    const channelId = this.activeChannelId();
    if (!channelId || !confirm('Remove this member from channel?')) return;

    this.http.delete(`${environment.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`)
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Member Removed', 'User removed from channel');
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.handleHttpError(err, 'Removing member');
        }
      });
  }

  disableChannel() {
    const channelId = this.activeChannelId();
    if (!channelId || !confirm('Disable this channel?')) return;

    this.http.patch(`${environment.apiUrl}/v1/chat/channels/${channelId}/disable`, {})
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Channel Disabled', 'Channel has been disabled');
          this.closeChannelSettings();
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.handleHttpError(err, 'Disabling channel');
        }
      });
  }

  enableChannel() {
    const channelId = this.activeChannelId();
    if (!channelId) return;

    this.http.patch(`${environment.apiUrl}/v1/chat/channels/${channelId}/enable`, {})
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Channel Enabled', 'Channel has been enabled');
          this.closeChannelSettings();
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.handleHttpError(err, 'Enabling channel');
        }
      });
  }

  // --- Message Read Status ---
  markMessagesAsRead() {
    const channelId = this.activeChannelId();
    if (!channelId) return;

    const unreadMessages = this.messages()
      .filter(m => !m.read && this.getSenderId(m) !== this.currentUserId())
      .map(m => m._id)
      .filter((id): id is string => !!id);

    if (unreadMessages.length > 0) {
      this.socketService.markRead(channelId, unreadMessages);
      this.lastReadTimestamps.set({ ...this.lastReadTimestamps(), [channelId]: Date.now() });
    }
  }

  // --- Helper Methods ---
  isUserInChannel(userId: string, channelId: string): boolean {
    const users = this.channelUsers()[channelId] || [];
    return users.includes(userId);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers().has(userId);
  }

  getInitials(userId: string): string {
    const user = this.masterList.users().find(u => u._id === userId);
    if (user?.name) {
      return user.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return userId.slice(0, 2).toUpperCase();
  }

  getUserName(userId: string): string {
    const user = this.masterList.users().find(u => u._id === userId);
    return user?.name || userId.slice(0, 8);
  }

  getSenderId(msg: ChatMessage): string {
    if (!msg || !msg.senderId) return '';
    return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
  }

  getSenderName(msg: ChatMessage): string {
    if (!msg || !msg.senderId) return 'Unknown';
    if (typeof msg.senderId === 'object' && msg.senderId.name) return msg.senderId.name;
    if (typeof msg.senderId === 'string') {
      return this.getUserName(msg.senderId);
    }
    return 'User';
  }

  getSenderAvatar(msg: ChatMessage): string {
    const name = this.getSenderName(msg);
    return name.charAt(0).toUpperCase();
  }

  isImage(url?: string): boolean {
    if (!url) return false;
    return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(url) || url.includes('cloudinary') || url.includes('image');
  }

  isVideo(url?: string): boolean {
    if (!url) return false;
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(url) || url.includes('video');
  }

  isAudio(url?: string): boolean {
    if (!url) return false;
    return /\.(mp3|wav|ogg|flac|aac)$/i.test(url) || url.includes('audio');
  }

  getFileIconClass(url: string): string {
    if (this.isImage(url)) return 'pi-image';
    if (this.isVideo(url)) return 'pi-video';
    if (this.isAudio(url)) return 'pi-volume-up';
    if (/\.(pdf)$/i.test(url)) return 'pi-file-pdf';
    if (/\.(docx?|rtf)$/i.test(url)) return 'pi-file-word';
    if (/\.(xlsx?|csv)$/i.test(url)) return 'pi-file-excel';
    if (/\.(zip|rar|tar|gz)$/i.test(url)) return 'pi-file-archive';
    return 'pi-file';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showDateSeparator(index: number, msg: ChatMessage): boolean {
    if (index === 0) return true;
    const prevMsg = this.messages()[index - 1];
    if (!prevMsg || !msg.createdAt || !prevMsg.createdAt) return false;
    
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    const currentDate = new Date(msg.createdAt).toDateString();
    return prevDate !== currentDate;
  }

  sendOnEnter(event: any) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }

  onScroll() {
    const element = this.scrollContainer.nativeElement;
    if (element.scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
      this.loadMoreMessages();
    }
  }

  autoResizeTextarea(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    
    // Leave current channel
    if (this.activeChannelId()) {
      this.socketService.leaveChannel(this.activeChannelId()!);
      this.markMessagesAsRead();
    }
    
    // Stop typing
    this.stopTyping();
    
    // Clear timeouts
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }
}

// import {
//   Component,
//   ElementRef,
//   OnDestroy,
//   OnInit,
//   ViewChild,
//   inject,
//   effect,
//   ChangeDetectorRef,
//   signal,
//   computed,
//   HostListener
// } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subscription, debounceTime } from 'rxjs';
// import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// import { environment } from '../../../environments/environment';

// // Import Services
// import { SocketService, ChatMessage, Channel, Attachment, NotificationData } from '../../core/services/socket.service';
// import { MasterListService } from '../../core/services/master-list.service';
// import { AppMessageService } from '../../core/services/message.service';
// import { Toast } from "primeng/toast";

// @Component({
//   selector: 'app-chat',
//   standalone: true,
//   imports: [CommonModule, FormsModule, Toast, DatePipe],
//   templateUrl: './chat.component.html',
//   styleUrls: ['./chat.component.scss']
// })
// export class ChatComponent implements OnInit, OnDestroy {
//   // Services
//   public socketService = inject(SocketService);
//   private masterList = inject(MasterListService);
//   private http = inject(HttpClient);
//   private cdr = inject(ChangeDetectorRef);
//   private messageService = inject(AppMessageService);

//   @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
//   @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
//   @ViewChild('messageInput') private messageInputEl!: ElementRef<HTMLTextAreaElement>;

//   // UI state - Using signals for reactivity
//   channels = signal<Channel[]>([]);
//   messages = signal<ChatMessage[]>([]);
//   messagesBatch = signal<ChatMessage[]>([]);
  
//   activeChannelId = signal<string | null>(null);
//   currentUserId = signal<string>('');
//   messageInput = '';
//   isUploading = false;
//   isTyping = signal<boolean>(false);
//   typingUsers = signal<Map<string, {userId: string, timestamp: number}>>(new Map());
//   channelUsers = signal<Record<string, string[]>>({});
//   onlineUsers = signal<Set<string>>(new Set());

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

//   // Computed values
//   activeChannel = computed(() => {
//     const channelId = this.activeChannelId();
//     return this.channels().find(ch => ch._id === channelId);
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
//   private typingDebounceTime = 300;

//   constructor() {
//     effect(() => {
//       const users = this.masterList.users();
//       this.cdr.markForCheck();
//     });

//     effect(() => {
//       this.checkMobileView();
//     });
//   }

//   ngOnInit(): void {
//     this.checkMobileView();
//     this.getCurrentUser();
//     this.loadChannels();
//     this.setupSocketListeners();
    
//     // Auto-connect socket
//     const token = localStorage.getItem('apex_auth_token');
//     const orgId = this.getOrganizationId();
//     if (token && orgId && this.currentUserId()) {
//       this.socketService.connect(token, orgId, this.currentUserId());
//     }
//   }

//   getOrganizationId(): string {
//     const token = localStorage.getItem('apex_auth_token');
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         return payload.organizationId || '';
//       } catch {}
//     }
//     return '';
//   }

//   setupSocketListeners(): void {
//     // --- 1. CHANNELS ---
//     this.subs.push(this.socketService.channels$.subscribe(list => {
//       this.channels.set(list || []);
//       if (this.channels().length > 0 && !this.activeChannelId()) {
//         this.selectChannel(this.channels()[0]);
//       }
//       this.cdr.markForCheck();
//     }));

//     // --- 2. MESSAGES ---
//     this.subs.push(this.socketService.messages$.subscribe(msg => {
//       if (msg.channelId === this.activeChannelId()) {
//         const current = this.messages();
//         this.messages.set([...current, msg]);
//         this.markMessagesAsRead();
//         setTimeout(() => this.scrollToBottom(), 100);
//       }
//       this.cdr.markForCheck();
//     }));

//     this.subs.push(this.socketService.messagesBatch$.subscribe(batch => {
//       this.messagesBatch.set(batch || []);
//       if (this.activeChannelId()) {
//         this.loadMessagesForActiveChannel();
//       }
//       this.cdr.markForCheck();
//     }));

//     // --- 3. MESSAGE EDITS ---
//     this.subs.push(this.socketService.messageEdited$.subscribe(msg => {
//       if (msg.channelId === this.activeChannelId()) {
//         const current = this.messages();
//         const updated = current.map(m => m._id === msg._id ? msg : m);
//         this.messages.set(updated);
//         this.cdr.markForCheck();
//       }
//     }));

//     // --- 4. MESSAGE DELETIONS ---
//     this.subs.push(this.socketService.messageDeleted$.subscribe(data => {
//       if (data.channelId === this.activeChannelId()) {
//         const current = this.messages();
//         const updated = current.map(m => {
//           if (m._id === data.messageId) {
//             return { ...m, body: '', attachments: [], deleted: true };
//           }
//           return m;
//         });
//         this.messages.set(updated);
//         this.cdr.markForCheck();
//       }
//     }));

//     // --- 5. PRESENCE ---
//     this.subs.push(this.socketService.channelUsers$.subscribe(map => {
//       this.channelUsers.set(map || {});
//       this.cdr.markForCheck();
//     }));

//     this.subs.push(this.socketService.onlineUsers$.subscribe(users => {
//       this.onlineUsers.set(users);
//       this.cdr.markForCheck();
//     }));

//     // --- 6. TYPING ---
//     this.subs.push(this.socketService.typing$.subscribe(t => {
//       if (t.channelId === this.activeChannelId() && t.userId !== this.currentUserId()) {
//         const now = Date.now();
//         this.typingUsers().set(t.userId, { userId: t.userId, timestamp: now });
        
//         // Clean up typing indicator after 3 seconds
//         setTimeout(() => {
//           if (this.typingUsers().has(t.userId)) {
//             const userData = this.typingUsers().get(t.userId);
//             if (userData && now - userData.timestamp > 3000) {
//               this.typingUsers().delete(t.userId);
//               this.cdr.markForCheck();
//             }
//           }
//         }, 3000);
//       }
//       this.cdr.markForCheck();
//     }));

//     // --- 7. CHANNEL EVENTS ---
//     this.subs.push(this.socketService.channelCreated$.subscribe(channel => {
//       const current = this.channels();
//       this.channels.set([channel, ...current]);
//       this.messageService.showSuccess('Channel Created', `Channel "${channel.name}" created successfully`);
//       this.cdr.markForCheck();
//     }));

//     this.subs.push(this.socketService.channelUpdated$.subscribe(channel => {
//       const current = this.channels();
//       const updated = current.map(c => c._id === channel._id ? channel : c);
//       this.channels.set(updated);
      
//       if (channel._id === this.activeChannelId()) {
//         this.messageService.showInfo('Channel Updated', `Channel "${channel.name}" has been updated`);
//       }
//       this.cdr.markForCheck();
//     }));

//     // --- 8. NOTIFICATIONS ---
//     this.subs.push(this.socketService.announcement$.subscribe(announcement => {
//       this.messageService.showInfo(announcement.title, announcement.message, 8000);
//     }));

//     // --- 9. CONNECTION STATUS ---
//     this.subs.push(this.socketService.connectionStatus$.subscribe(status => {
//       if (status === 'disconnected') {
//         this.messageService.showWarn('Connection Lost', 'Attempting to reconnect...');
//       } else if (status === 'connected') {
//         this.messageService.showSuccess('Connected', 'Chat connection established');
//       }
//     }));
//   }

//   @HostListener('window:resize')
//   checkMobileView() {
//     this.mobileView.set(window.innerWidth < 768);
//     if (this.mobileView()) {
//       this.sidebarOpen.set(false);
//     }
//   }

//   getCurrentUser() {
//     const token = localStorage.getItem('apex_auth_token');
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         this.currentUserId.set(payload.sub || payload._id);
//       } catch {}
//     }
//   }

//   loadChannels() {
//     this.socketService.listChannels().subscribe({
//       next: (res) => {
//         this.socketService.setChannels(res);
//       },
//       error: (err) => {
//         this.messageService.handleHttpError(err, 'Loading channels');
//       }
//     });
//   }

//   selectChannel(channel: Channel) {
//     if (!channel || this.activeChannelId() === channel._id) return;

//     // Leave previous channel
//     if (this.activeChannelId()) {
//       this.socketService.leaveChannel(this.activeChannelId()!);
//       this.markMessagesAsRead();
//     }
    
//     // Set new channel
//     this.activeChannelId.set(channel._id);
//     this.messages.set([]);
//     this.hasMoreMessages = true;
    
//     // Join new channel
//     this.socketService.joinChannel(channel._id);
    
//     // Close sidebar on mobile
//     if (this.mobileView()) {
//       this.sidebarOpen.set(false);
//     }
    
//     // Load messages
//     this.loadMessagesForActiveChannel();
    
//     // Mark as read
//     this.markMessagesAsRead();
    
//     this.cdr.markForCheck();
//   }

//   loadMessagesForActiveChannel() {
//     const channelId = this.activeChannelId();
//     if (!channelId) return;
    
//     const batchMessages = this.messagesBatch().filter(m => m.channelId === channelId);
//     this.messages.set(batchMessages);
    
//     // Check if we need to load more
//     if (batchMessages.length < this.pageSize) {
//       this.loadMoreMessages();
//     }
    
//     setTimeout(() => this.scrollToBottom(), 100);
//   }

//   loadMoreMessages() {
//     if (this.loadingMore || !this.hasMoreMessages || !this.activeChannelId()) return;
    
//     this.loadingMore = true;
//     const oldestMessage = this.messages()[0];
//     const before = oldestMessage?.createdAt;
    
//     this.socketService.fetchMessages(this.activeChannelId()!, before, this.pageSize).subscribe({
//       next: (res: any) => {
//         if (res.messages?.length > 0) {
//           const current = this.messages();
//           this.messages.set([...res.messages.reverse(), ...current]);
//           this.hasMoreMessages = res.messages.length === this.pageSize;
//         } else {
//           this.hasMoreMessages = false;
//         }
//         this.loadingMore = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: HttpErrorResponse) => {
//         this.messageService.handleHttpError(err, 'Loading messages');
//         this.loadingMore = false;
//         this.cdr.markForCheck();
//       }
//     });
//   }

//   sendMessage() {
//     const channelId = this.activeChannelId();
//     const body = this.messageInput.trim();
    
//     if (!channelId || (!body && !this.isUploading)) return;
    
//     const payload = {
//       channelId,
//       body,
//       attachments: [],
//       senderId: this.currentUserId()
//     };

//     this.socketService.sendMessage(payload);
//     this.messageInput = '';
//     this.stopTyping();
    
//     // Reset textarea height
//     if (this.messageInputEl) {
//       this.messageInputEl.nativeElement.style.height = 'auto';
//     }
    
//     this.cdr.markForCheck();
//   }

//   startTyping() {
//     if (!this.activeChannelId() || this.isTyping()) return;
    
//     this.isTyping.set(true);
//     this.socketService.sendTyping(this.activeChannelId()!, true);
    
//     // Send typing indicator every 3 seconds while typing
//     this.typingTimeout = setTimeout(() => {
//       if (this.isTyping()) {
//         this.socketService.sendTyping(this.activeChannelId()!, true);
//       }
//     }, 3000);
//   }

//   stopTyping() {
//     if (!this.activeChannelId() || !this.isTyping()) return;
    
//     this.isTyping.set(false);
//     this.socketService.sendTyping(this.activeChannelId()!, false);
    
//     if (this.typingTimeout) {
//       clearTimeout(this.typingTimeout);
//       this.typingTimeout = null;
//     }
//   }

//   onTypingInput() {
//     this.startTyping();
    
//     // Reset typing timer
//     if (this.typingTimeout) {
//       clearTimeout(this.typingTimeout);
//     }
    
//     // Debounce stop typing
//     this.typingTimeout = setTimeout(() => {
//       this.stopTyping();
//     }, this.typingDebounceTime);
//   }

//   handleFileUpload(ev: Event) {
//     const input = ev.target as HTMLInputElement;
//     const file = input.files?.[0];
//     if (!file || !this.activeChannelId()) return;

//     this.isUploading = true;
//     this.cdr.markForCheck();

//     this.socketService.uploadAttachment(file).subscribe({
//       next: (attachment: Attachment) => {
//         this.isUploading = false;
//         this.socketService.sendMessage({
//           channelId: this.activeChannelId()!,
//           body: '',
//           attachments: [attachment],
//           senderId: this.currentUserId()
//         });
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.isUploading = false;
//         this.messageService.handleHttpError(err, 'Uploading file');
//         this.cdr.markForCheck();
//       }
//     });
//     input.value = '';
//   }

//   triggerFilePicker() { 
//     this.fileInput?.nativeElement?.click(); 
//   }

//   // --- Message Editing ---
//   startEditingMessage(msg: ChatMessage) {
//     if (this.getSenderId(msg) !== this.currentUserId()) return;
    
//     this.editingMessageId.set(msg._id || null);
//     this.editMessageText = msg.body || '';
//     this.cdr.markForCheck();
//   }

//   cancelEditing() {
//     this.editingMessageId.set(null);
//     this.editMessageText = '';
//     this.cdr.markForCheck();
//   }

//   saveEditedMessage() {
//     const messageId = this.editingMessageId();
//     if (!messageId || !this.editMessageText.trim()) return;
    
//     this.socketService.editMessage(messageId, this.editMessageText.trim());
//     this.cancelEditing();
//   }

//   deleteMessage(msg: ChatMessage) {
//     if (!msg._id || this.getSenderId(msg) !== this.currentUserId()) return;
    
//     if (confirm('Are you sure you want to delete this message?')) {
//       this.socketService.deleteMessage(msg._id).subscribe({
//         next: () => {
//           this.messageService.showSuccess('Message Deleted', 'Message has been deleted');
//         },
//         error: (err: HttpErrorResponse) => {
//           this.messageService.handleHttpError(err, 'Deleting message');
//         }
//       });
//     }
//   }

//   // --- Channel Management ---
//   openCreateModal() { 
//     this.showCreateModal = true; 
//     this.newChannelName = ''; 
//     this.channelType = 'public';
//     this.selectedMembers.clear();
//     this.cdr.markForCheck();
//   }

//   closeCreateModal() { 
//     this.showCreateModal = false; 
//     this.cdr.markForCheck();
//   }
  
//   toggleMemberSelection(id: string) {
//     if (this.selectedMembers.has(id)) this.selectedMembers.delete(id);
//     else this.selectedMembers.add(id);
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

//     this.socketService.createChannel(this.newChannelName, this.channelType as any, members)
//       .subscribe({
//         next: (ch: Channel) => {
//           this.socketService.addChannel(ch);
//           this.showCreateModal = false;
//           this.selectChannel(ch);
//           this.messageService.showSuccess('Channel Created', `Channel "${ch.name}" created successfully`);
//         },
//         error: (err: HttpErrorResponse) => {
//           this.messageService.handleHttpError(err, 'Creating channel');
//         }
//       });
//   }

//   // --- Channel Settings ---
//   openChannelSettings() {
//     this.showChannelSettings = true;
//   }

//   closeChannelSettings() {
//     this.showChannelSettings = false;
//   }

//   openAddMembersModal() {
//     this.newMembers.clear();
//     this.showAddMembersModal = true;
//   }

//   closeAddMembersModal() {
//     this.showAddMembersModal = false;
//   }

//   addMembersToChannel() {
//     const channelId = this.activeChannelId();
//     if (!channelId || this.newMembers.size === 0) return;

//     const memberIds = Array.from(this.newMembers);
//     // Note: You'll need to implement HTTP endpoint for adding multiple members
//     // For now, we'll add one by one
//     memberIds.forEach(memberId => {
//       this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/members`, { userId: memberId })
//         .subscribe({
//           next: () => {
//             this.messageService.showSuccess('Member Added', 'User added to channel');
//           },
//           error: (err) => {
//             this.messageService.handleHttpError(err, 'Adding member');
//           }
//         });
//     });

//     this.closeAddMembersModal();
//   }

//   removeMember(userId: string) {
//     const channelId = this.activeChannelId();
//     if (!channelId || !confirm('Remove this member from channel?')) return;

//     this.http.delete(`${environment.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`)
//       .subscribe({
//         next: () => {
//           this.messageService.showSuccess('Member Removed', 'User removed from channel');
//         },
//         error: (err) => {
//           this.messageService.handleHttpError(err, 'Removing member');
//         }
//       });
//   }

//   disableChannel() {
//     const channelId = this.activeChannelId();
//     if (!channelId || !confirm('Disable this channel?')) return;

//     this.http.patch(`${environment.apiUrl}/v1/chat/channels/${channelId}/disable`, {})
//       .subscribe({
//         next: () => {
//           this.messageService.showSuccess('Channel Disabled', 'Channel has been disabled');
//           this.closeChannelSettings();
//         },
//         error: (err) => {
//           this.messageService.handleHttpError(err, 'Disabling channel');
//         }
//       });
//   }

//   enableChannel() {
//     const channelId = this.activeChannelId();
//     if (!channelId) return;

//     this.http.patch(`${environment.apiUrl}/v1/chat/channels/${channelId}/enable`, {})
//       .subscribe({
//         next: () => {
//           this.messageService.showSuccess('Channel Enabled', 'Channel has been enabled');
//           this.closeChannelSettings();
//         },
//         error: (err) => {
//           this.messageService.handleHttpError(err, 'Enabling channel');
//         }
//       });
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
//     const user = this.masterList.users().find(u => u._id === userId);
//     if (user?.name) {
//       return user.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2);
//     }
//     return userId.slice(0, 2).toUpperCase();
//   }

//   getUserName(userId: string): string {
//     const user = this.masterList.users().find(u => u._id === userId);
//     return user?.name || userId.slice(0, 8);
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

//   isImage(url?: string): boolean {
//     if (!url) return false;
//     return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(url) || url.includes('cloudinary') || url.includes('image');
//   }

//   isVideo(url?: string): boolean {
//     if (!url) return false;
//     return /\.(mp4|webm|mov|avi|mkv)$/i.test(url) || url.includes('video');
//   }

//   isAudio(url?: string): boolean {
//     if (!url) return false;
//     return /\.(mp3|wav|ogg|flac|aac)$/i.test(url) || url.includes('audio');
//   }

//   getFileIconClass(url: string): string {
//     if (this.isImage(url)) return 'pi-image';
//     if (this.isVideo(url)) return 'pi-video';
//     if (this.isAudio(url)) return 'pi-volume-up';
//     if (/\.(pdf)$/i.test(url)) return 'pi-file-pdf';
//     if (/\.(docx?|rtf)$/i.test(url)) return 'pi-file-word';
//     if (/\.(xlsx?|csv)$/i.test(url)) return 'pi-file-excel';
//     if (/\.(zip|rar|tar|gz)$/i.test(url)) return 'pi-file-archive';
//     return 'pi-file';
//   }

//   formatFileSize(bytes?: number): string {
//     if (!bytes) return '';
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }

//   showDateSeparator(index: number, msg: ChatMessage): boolean {
//     if (index === 0) return true;
//     const prevMsg = this.messages()[index - 1];
//     if (!prevMsg || !msg.createdAt) return false;
    
//     const prevDate = new Date(prevMsg.createdAt).toDateString();
//     const currentDate = new Date(msg.createdAt).toDateString();
//     return prevDate !== currentDate;
//   }

//   sendOnEnter(event: KeyboardEvent) {
//     if (event.key === 'Enter' && !event.shiftKey) {
//       event.preventDefault();
//       this.sendMessage();
//     }
//   }

//   toggleSidebar() {
//     this.sidebarOpen.set(!this.sidebarOpen());
//   }

//   scrollToBottom() {
//     setTimeout(() => {
//       if (this.scrollContainer?.nativeElement) {
//         const el = this.scrollContainer.nativeElement;
//         el.scrollTop = el.scrollHeight;
//       }
//     }, 100);
//   }

//   onScroll() {
//     const element = this.scrollContainer.nativeElement;
//     if (element.scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
//       this.loadMoreMessages();
//     }
//   }

//   autoResizeTextarea(event: any) {
//     const textarea = event.target;
//     textarea.style.height = 'auto';
//     textarea.style.height = textarea.scrollHeight + 'px';
//   }

//   ngOnDestroy() {
//     this.subs.forEach(s => s.unsubscribe());
    
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
//   }
// }

// // import {
// //   Component,
// //   ElementRef,
// //   OnDestroy,
// //   OnInit,
// //   ViewChild,
// //   inject,
// //   effect,
// //   ChangeDetectorRef,
// //   signal,
// //   computed
// // } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { Subscription } from 'rxjs';
// // import { HttpClient } from '@angular/common/http';
// // import { environment } from '../../../environments/environment';

// // // Import Types
// // import { SocketService, ChatMessage, Channel } from '../../core/services/socket.service';
// // import { MasterListService } from '../../core/services/master-list.service';
// // import { Toast } from "primeng/toast";

// // @Component({
// //   selector: 'app-chat',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule, Toast],
// //   templateUrl: './chat.component.html',
// //   styleUrls: ['./chat.component.scss']
// // })
// // export class ChatComponent implements OnInit, OnDestroy {
// //   // Services
// //   public socketService = inject(SocketService);
// //   private masterList = inject(MasterListService);
// //   private http = inject(HttpClient);
// //   private cdr = inject(ChangeDetectorRef);

// //   @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
// //   @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

// //   // UI state - Using signals for reactivity
// //   channels = signal<Channel[]>([]);
// //   messages = signal<any[]>([]);
  
// //   activeChannelId = signal<string | null>(null);
// //   currentUserId = signal<string>('');
// //   messageInput = '';
// //   isUploading = false;
// //   typingUser = signal<string | null>(null);
// //   channelUsers = signal<Record<string, string[]>>({});

// //   // Modal state
// //   showCreateModal = false;
// //   newChannelName = '';
// //   isPrivateChannel = false;
// //   masterUsers: any[] = [];
// //   selectedMembers = new Set<string>();

// //   // Responsive sidebar
// //   sidebarOpen = signal<boolean>(true);
// //   mobileView = signal<boolean>(false);

// //   // Message reactions
// //   messageReactions = signal<Record<string, any>>({});

// //   // Computed values
// //   activeChannel = computed(() => {
// //     const channelId = this.activeChannelId();
// //     return this.channels().find(ch => ch._id === channelId);
// //   });

// //   activeChannelUsers = computed(() => {
// //     const channelId = this.activeChannelId();
// //     return channelId ? this.channelUsers()[channelId] || [] : [];
// //   });

// //   unreadCounts = signal<Record<string, number>>({});

// //   private subs: Subscription[] = [];

// //   constructor() {
// //     effect(() => {
// //       const users = this.masterList.users();
// //       this.masterUsers = users || [];
// //       this.cdr.markForCheck();
// //     });

// //     // Detect mobile view
// //     effect(() => {
// //       this.checkMobileView();
// //       window.addEventListener('resize', () => this.checkMobileView());
// //       return () => window.removeEventListener('resize', () => this.checkMobileView());
// //     });
// //   }

// //   ngOnInit(): void {
// //     this.checkMobileView();
    
// //     // --- 1. CHANNELS ---
// //     this.subs.push(this.socketService.channels$.subscribe(list => {
// //       this.channels.set(list || []);
// //       if (this.channels().length > 0 && !this.activeChannelId()) {
// //         this.selectChannel(this.channels()[0]);
// //       }
// //       this.cdr.markForCheck();
// //     }));

// //     // --- 2. MESSAGES ---
// //     this.subs.push(this.socketService.messagesBatch$.subscribe(list => {
// //       this.messages.set(list || []);
// //       this.cdr.markForCheck();
// //       setTimeout(() => this.scrollToBottom(), 100);
// //     }));

// //     // --- 3. PRESENCE ---
// //     this.subs.push(this.socketService.channelUsers$.subscribe(map => {
// //       this.channelUsers.set(map || {});
// //       this.cdr.markForCheck();
// //     }));

// //     // --- 4. TYPING ---
// //     this.subs.push(this.socketService.typing$.subscribe(t => {
// //       if (t.channelId === this.activeChannelId() && t.typing && t.userId !== this.currentUserId()) {
// //         const user = this.masterUsers.find(u => u._id === t.userId);
// //         this.typingUser.set(user ? user.name : 'Someone');
// //       } else {
// //         this.typingUser.set(null);
// //       }
// //       this.cdr.markForCheck();
// //     }));

// //     this.getCurrentUser();
// //     this.loadChannels();
// //   }

// //   checkMobileView() {
// //     this.mobileView.set(window.innerWidth < 768);
// //     if (this.mobileView()) {
// //       this.sidebarOpen.set(false);
// //     }
// //   }

// //   getCurrentUser() {
// //     const token = localStorage.getItem('apex_auth_token');
// //     if (token) {
// //       try {
// //         const payload = JSON.parse(atob(token.split('.')[1]));
// //         this.currentUserId.set(payload.sub || payload._id);
// //       } catch {}
// //     }
// //   }

// //   loadChannels() {
// //     this.socketService.listChannels().subscribe({
// //       next: (res) => this.socketService.channels$.next(res),
// //       error: (err) => console.error('Channel list failed', err)
// //     });
// //   }

// //   selectChannel(channel: Channel) {
// //     if (!channel) return;
// //     if (this.activeChannelId() === channel._id) return;

// //     if (this.activeChannelId()) {
// //       this.socketService.leaveChannel(this.activeChannelId()!);
// //     }
    
// //     this.activeChannelId.set(channel._id);
// //     this.socketService.joinChannel(channel._id);
    
// //     // Close sidebar on mobile when channel is selected
// //     if (this.mobileView()) {
// //       this.sidebarOpen.set(false);
// //     }
    
// //     this.socketService.fetchMessages(channel._id).subscribe({
// //       next: (res: any) => {
// //         if (res.messages) this.socketService.messagesBatch$.next(res.messages.reverse());
// //       }
// //     });
// //   }

// //   sendMessage() {
// //     if (!this.messageInput.trim() || !this.activeChannelId()) return;
    
// //     const msg: any = { 
// //       channelId: this.activeChannelId()!,
// //       body: this.messageInput.trim(),
// //       senderId: this.currentUserId(),
// //       attachments: []
// //     };

// //     this.socketService.sendMessage(msg);
// //     this.messageInput = '';
// //     this.socketService.sendTyping(this.activeChannelId()!, false);
// //     this.cdr.markForCheck();
// //   }

// //   handleFileUpload(ev: Event) {
// //     const input = ev.target as HTMLInputElement;
// //     const file = input.files?.[0];
// //     if (!file || !this.activeChannelId()) return;

// //     this.isUploading = true;
// //     this.cdr.markForCheck();

// //     this.socketService.uploadAttachment(file).subscribe({
// //       next: (attachment: any) => {
// //         this.isUploading = false;
// //         this.socketService.sendMessage({
// //           channelId: this.activeChannelId()!,
// //           body: '',
// //           attachments: [attachment],
// //           senderId: this.currentUserId()
// //         });
// //         this.cdr.markForCheck();
// //       },
// //       error: () => {
// //         this.isUploading = false;
// //         this.cdr.markForCheck();
// //       }
// //     });
// //     input.value = '';
// //   }

// //   triggerFilePicker() { this.fileInput?.nativeElement?.click(); }
  
// //   onTypingInput() { 
// //     if (this.activeChannelId()) this.socketService.sendTyping(this.activeChannelId()!, true); 
// //   }

// //   // --- Modal Logic ---
// //   openCreateModal() { 
// //     this.showCreateModal = true; 
// //     this.newChannelName = ''; 
// //     this.isPrivateChannel = false;
// //     this.selectedMembers.clear();
// //     this.cdr.markForCheck();
// //   }

// //   closeCreateModal() { 
// //     this.showCreateModal = false; 
// //     this.cdr.markForCheck();
// //   }
  
// //   toggleMemberSelection(id: string) {
// //     if (this.selectedMembers.has(id)) this.selectedMembers.delete(id);
// //     else this.selectedMembers.add(id);
// //   }

// //   submitCreateChannel() {
// //     if (!this.newChannelName.trim()) return;
// //     const members = this.isPrivateChannel ? Array.from(this.selectedMembers) : [];
// //     if (this.isPrivateChannel && this.currentUserId()) members.push(this.currentUserId());

// //     this.socketService.createChannel(this.newChannelName, this.isPrivateChannel ? 'private' : 'public', members)
// //       .subscribe(ch => {
// //         const current = this.socketService.channels$.value;
// //         this.socketService.channels$.next([...current, ch]);
// //         this.showCreateModal = false;
// //         this.selectChannel(ch);
// //         this.cdr.markForCheck();
// //       });
// //   }

// //   // --- Helpers ---
// //   getChannelName(id: string | null): string {
// //     if (!id) return '';
// //     const c = this.channels().find(ch => ch._id === id);
// //     return c?.name || 'Unnamed';
// //   }

// //   getSenderId(msg: ChatMessage): string {
// //     if (!msg || !msg.senderId) return '';
// //     return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
// //   }

// //   getSenderName(msg: ChatMessage): string {
// //     if (!msg || !msg.senderId) return 'Unknown';
// //     if (typeof msg.senderId === 'object' && msg.senderId.name) return msg.senderId.name;
// //     if (typeof msg.senderId === 'string') {
// //       const u = this.masterUsers.find(user => user._id === msg.senderId);
// //       if (u) return u.name;
// //       return msg.senderId.slice(0, 6);
// //     }
// //     return 'User';
// //   }

// //   getSenderAvatar(msg: ChatMessage): string {
// //     const name = this.getSenderName(msg);
// //     return name.charAt(0).toUpperCase();
// //   }

// //   isImage(url?: string): boolean {
// //     if (!url) return false;
// //     return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(url) || url.includes('cloudinary');
// //   }

// //   isVideo(url?: string): boolean {
// //     if (!url) return false;
// //     return /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
// //   }

// //   isAudio(url?: string): boolean {
// //     if (!url) return false;
// //     return /\.(mp3|wav|ogg|flac|aac)$/i.test(url);
// //   }

// //   getFileIcon(url?: string): string {
// //     if (!url) return '📄';
// //     if (this.isImage(url)) return '🖼️';
// //     if (this.isVideo(url)) return '🎬';
// //     if (this.isAudio(url)) return '🎵';
// //     if (/\.(pdf)$/i.test(url)) return '📕';
// //     if (/\.(docx?|rtf)$/i.test(url)) return '📝';
// //     if (/\.(xlsx?|csv)$/i.test(url)) return '📊';
// //     if (/\.(zip|rar|tar|gz)$/i.test(url)) return '📦';
// //     return '📄';
// //   }

// //   deleteMessage(msg: ChatMessage) {
// //     if (msg._id && confirm('Delete message?')) {
// //       this.socketService.deleteMessage(msg._id).subscribe();
// //     }
// //   }

// //   toggleSidebar() {
// //     this.sidebarOpen.set(!this.sidebarOpen());
// //   }

// //   scrollToBottom() {
// //     if (this.scrollContainer?.nativeElement) {
// //       const el = this.scrollContainer.nativeElement;
// //       el.scrollTop = el.scrollHeight;
// //     }
// //   }

// //   ngOnDestroy() {
// //     this.subs.forEach(s => s.unsubscribe());
// //   }
// //   // Add these methods to your component class:

// // // Get user initials for avatar
// // getInitials(userId: string): string {
// //   const user = this.masterUsers.find(u => u._id === userId);
// //   if (user?.name) {
// //     return user.name.split(' ').map((n:any) => n[0]).join('').toUpperCase().slice(0, 2);
// //   }
// //   return userId.slice(0, 2).toUpperCase();
// // }

// // // Get user name for display
// // getUserName(userId: string): string {
// //   const user = this.masterUsers.find(u => u._id === userId);
// //   return user?.name || userId.slice(0, 8);
// // }

// // // Show date separator between messages
// // showDateSeparator(index: number, msg: ChatMessage): boolean {
// //   if (index === 0) return true;
// //   const prevMsg = this.messages()[index - 1];
// //   if (!prevMsg || !msg.createdAt) return false;
  
// //   const prevDate = new Date(prevMsg?.createdAt).toDateString();
// //   const currentDate = new Date(msg.createdAt).toDateString();
// //   return prevDate !== currentDate;
// // }

// // // Handle Enter key with Shift for new line
// // sendOnEnter(event: any) {
// //   if (event.key === 'Enter' && !event.shiftKey) {
// //     event.preventDefault();
// //     this.sendMessage();
// //   }
// // }

// // // Get file icon class
// // getFileIconClass(url: string): string {
// //   if (this.isImage(url)) return 'pi-image';
// //   if (this.isVideo(url)) return 'pi-video';
// //   if (this.isAudio(url)) return 'pi-volume-up';
// //   if (/\.(pdf)$/i.test(url)) return 'pi-file-pdf';
// //   if (/\.(docx?|rtf)$/i.test(url)) return 'pi-file-word';
// //   if (/\.(xlsx?|csv)$/i.test(url)) return 'pi-file-excel';
// //   return 'pi-file';
// // }

// // // Get video type for <video> tag
// // getVideoType(url: string): string {
// //   if (url.endsWith('.mp4')) return 'video/mp4';
// //   if (url.endsWith('.webm')) return 'video/webm';
// //   if (url.endsWith('.mov')) return 'video/quicktime';
// //   return 'video/mp4';
// // }

// // // Get audio type for <audio> tag
// // getAudioType(url: string): string {
// //   if (url.endsWith('.mp3')) return 'audio/mpeg';
// //   if (url.endsWith('.wav')) return 'audio/wav';
// //   if (url.endsWith('.ogg')) return 'audio/ogg';
// //   return 'audio/mpeg';
// // }

// // // Format file size
// // formatFileSize(bytes?: number): string {
// //   if (!bytes) return '';
// //   if (bytes === 0) return '0 Bytes';
// //   const k = 1024;
// //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
// //   const i = Math.floor(Math.log(bytes) / Math.log(k));
// //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// // }
// // }
