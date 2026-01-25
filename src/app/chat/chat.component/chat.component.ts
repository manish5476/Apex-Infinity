import { Component, inject, OnInit, OnDestroy, computed, signal, HostListener } from '@angular/core';
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
import { Toast } from "primeng/toast";

// Import Models
import { ChatMessage, Channel, Attachment } from './chat.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    Toast, 
    // DatePipe,
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
  // Services
  private socketService = inject(SocketService);
  private masterList = inject(MasterListService);
  private http = inject(HttpClient);
  private messageService = inject(AppMessageService);
  private authService = inject(AuthService);

  // UI state - Using signals for reactivity
  channels = signal<Channel[]>([]);
  messages = signal<ChatMessage[]>([]);
  activeChannelId = signal<string | null>(null);
  currentUserId = signal<string>('');
  currentUser = signal<any>(null);
  messageInput:any;
  isUploading = false;
  isTyping = signal<boolean>(false);
  typingUsers = signal<Map<string, {userId: string, timestamp: number}>>(new Map());
  channelUsers = signal<Record<string, string[]>>({});
  onlineUsers = signal<Set<string>>(new Set());
  allUsers = signal<Map<string, any>>(new Map());

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

  // Upload state
  attachments: File[] = [];
  uploadProgress = signal<number>(0);

  // Computed values
  activeChannel = computed(() => {
    const channelId = this.activeChannelId();
    return this.channels().find(ch => ch._id === channelId) || null;
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
  private typingDebounceTime = 1000;
  private cleanupTimer: any = null;

  @HostListener('window:resize')
  checkMobileView() {
    this.mobileView.set(window.innerWidth < 768);
    if (this.mobileView()) {
      this.sidebarOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.checkMobileView();
    this.loadCurrentUser();
    this.initializeSocketConnection();
    this.setupSocketListeners();
    this.loadChannels();
    
    // Clean up old typing indicators periodically
    this.cleanupTimer = setInterval(() => {
      this.cleanupTypingIndicators();
    }, 2000);
  }

  loadCurrentUser() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId.set(user._id);
      this.currentUser.set(user);
    } else {
      const token = localStorage.getItem('apex_auth_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.currentUserId.set(payload.sub || payload._id);
          this.currentUser.set({ 
            _id: payload.sub || payload._id, 
            name: payload.name, 
            email: payload.email 
          });
        } catch (error) {
          console.error('Failed to parse token:', error);
        }
      }
    }
  }

  initializeSocketConnection() {
    const token = localStorage.getItem('apex_auth_token');
    const orgId = this.getOrganizationId();
    const userId = this.currentUserId();
    
    if (token && orgId && userId) {
      console.log('Initializing socket connection...');
      this.socketService.connect(token, orgId, userId);
    } else {
      console.warn('Socket connection missing required data:', { token, orgId, userId });
      this.messageService.showError('Connection Error', 'Unable to connect to chat. Please log in again.');
    }
  }

  getOrganizationId(): string {
    const token = localStorage.getItem('apex_auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.organizationId || '';
      } catch (error) {
        console.error('Failed to parse organizationId from token:', error);
      }
    }
    return '';
  }

  setupSocketListeners(): void {
    // Clear existing subscriptions
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];

    // 1. CHANNELS
    this.subs.push(
      this.socketService.channels$.subscribe((list: Channel[]) => {
        console.log('Channels updated:', list?.length);
        this.channels.set(list || []);
        
        // Auto-select first channel if none selected
        if (this.channels().length > 0 && !this.activeChannelId()) {
          this.selectChannel(this.channels()[0]);
        }
      })
    );

    // 2. NEW MESSAGES
    this.subs.push(
      this.socketService.messages$.subscribe((msg: ChatMessage) => {
        console.log('New message received:', msg);
        
        if (msg.channelId === this.activeChannelId()) {
          const current = this.messages();
          // Avoid duplicates
          if (msg._id && !current.some(m => m._id === msg._id)) {
            this.messages.set([...current, msg]);
            this.markMessagesAsRead();
          }
        }
      })
    );

    // 3. MESSAGE EDITS
    this.subs.push(
      this.socketService.messageEdited$.subscribe((msg: ChatMessage) => {
        console.log('Message edited:', msg);
        if (msg.channelId === this.activeChannelId() && msg._id) {
          const current = this.messages();
          const updated = current.map(m => m._id === msg._id ? msg : m);
          this.messages.set(updated);
        }
      })
    );

    // 4. MESSAGE DELETIONS
    this.subs.push(
      this.socketService.messageDeleted$.subscribe(data => {
        console.log('Message deleted:', data);
        if (data.channelId === this.activeChannelId()) {
          const current = this.messages();
          const updated = current.map(m => {
            if (m._id === data.messageId) {
              return { ...m, body: '', attachments: [], deleted: true };
            }
            return m;
          });
          this.messages.set(updated);
        }
      })
    );

    // 5. PRESENCE
    this.subs.push(
      this.socketService.channelUsers$.subscribe(map => {
        this.channelUsers.set(map || {});
      })
    );

    this.subs.push(
      this.socketService.onlineUsers$.subscribe(users => {
        this.onlineUsers.set(users);
      })
    );

    // 6. TYPING
    this.subs.push(
      this.socketService.typing$.subscribe(t => {
        console.log('Typing event:', t);
        if (t.channelId === this.activeChannelId() && t.userId !== this.currentUserId()) {
          const now = Date.now();
          const typingMap = new Map(this.typingUsers());
          typingMap.set(t.userId, { userId: t.userId, timestamp: now });
          this.typingUsers.set(typingMap);
          
          // Auto-remove after 3 seconds
          setTimeout(() => {
            const currentMap = new Map(this.typingUsers());
            if (currentMap.has(t.userId)) {
              const userData = currentMap.get(t.userId);
              if (userData && now - userData.timestamp > 3000) {
                currentMap.delete(t.userId);
                this.typingUsers.set(currentMap);
              }
            }
          }, 3000);
        }
      })
    );

    // 7. CHANNEL EVENTS
    this.subs.push(
      this.socketService.channelCreated$.subscribe((channel: Channel) => {
        console.log('Channel created:', channel);
        const current = this.channels();
        if (channel._id && !current.some(c => c._id === channel._id)) {
          this.channels.set([channel, ...current]);
        }
        this.messageService.showSuccess('Channel Created', `Channel "${channel.name}" created successfully`);
      })
    );
  }

  cleanupTypingIndicators() {
    const now = Date.now();
    const typingMap = new Map(this.typingUsers());
    let changed = false;
    
    for (const [userId, data] of typingMap.entries()) {
      if (now - data.timestamp > 3000) {
        typingMap.delete(userId);
        changed = true;
      }
    }
    
    if (changed) {
      this.typingUsers.set(typingMap);
    }
  }

  loadChannels() {
    this.socketService.listChannels().subscribe({
      next: (res: Channel[]) => {
        console.log('Channels loaded via HTTP:', res);
        this.socketService.setChannels(res);
      },
      error: (err) => {
        console.error('Error loading channels:', err);
        this.messageService.handleHttpError(err, 'Loading channels');
      }
    });
  }

  selectChannel(channel: Channel) {
    if (!channel._id || this.activeChannelId() === channel._id) return;

    console.log('Selecting channel:', channel._id);

    // Leave previous channel
    const prevChannelId = this.activeChannelId();
    if (prevChannelId) {
      this.socketService.leaveChannel(prevChannelId);
      this.markMessagesAsRead();
    }
    
    // Set new channel
    this.activeChannelId.set(channel._id);
    this.messages.set([]);
    this.hasMoreMessages = true;
    this.editingMessageId.set(null);
    
    // Join new channel via socket
    this.socketService.joinChannel(channel._id);
    
    // Close sidebar on mobile
    if (this.mobileView()) {
      this.sidebarOpen.set(false);
    }
    
    // Load messages
    this.loadMessagesForActiveChannel();
    
    // Clear typing indicators
    const newTypingMap = new Map(this.typingUsers());
    newTypingMap.clear();
    this.typingUsers.set(newTypingMap);
  }

  loadMessagesForActiveChannel() {
    const channelId = this.activeChannelId();
    if (!channelId) return;
    
    console.log('Loading messages for channel:', channelId);
    
    // Clear existing messages
    this.messages.set([]);
    this.loadMoreMessages();
  }

  loadMoreMessages() {
    if (this.loadingMore || !this.hasMoreMessages || !this.activeChannelId()) return;
    
    this.loadingMore = true;
    const oldestMessage = this.messages()[0];
    const before = oldestMessage?.createdAt;
    
    console.log('Loading more messages, before:', before);
    
    this.socketService.fetchMessagesHttp(this.activeChannelId()!, before, this.pageSize).subscribe({
      next: (res: any) => {
        console.log('Messages loaded:', res.messages?.length);
        if (res.messages?.length > 0) {
          const socketMessages: ChatMessage[] = res.messages.reverse();
          
          const current = this.messages();
          
          // Filter out duplicates
          const existingIds = new Set(current.map(m => m._id));
          const uniqueNewMessages = socketMessages.filter(msg => 
            msg._id && !existingIds.has(msg._id)
          );
          
          if (before) {
            // Prepend for infinite scroll
            this.messages.set([...uniqueNewMessages, ...current]);
          } else {
            // First load or channel switch
            this.messages.set(uniqueNewMessages);
          }
          
          this.hasMoreMessages = res.messages.length === this.pageSize;
        } else {
          this.hasMoreMessages = false;
        }
        this.loadingMore = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading messages:', err);
        this.messageService.handleHttpError(err, 'Loading messages');
        this.loadingMore = false;
      }
    });
  }

  openChannelSettings() {
    this.showChannelSettings = true;
  }

sendMessage() {
  const channelId = this.activeChannelId();
  const body = this.messageInput.trim();
  
  if (!channelId) {
    this.messageService.showWarn('Validation', 'Please select a channel');
    return;
  }
  
  // Check if there's either a message body OR attachments
  if (!body && this.attachments.length === 0) {
    this.messageService.showWarn('Validation', 'Message or attachment is required');
    return;
  }
  
  if (this.attachments.length > 0) {
    this.uploadAttachmentsAndSendMessage(body);
  } else {
    this.sendMessageViaSocket(body, []);
  }
}

onMessageSend(event: { message: string; attachments: File[] }) {
  this.messageInput = event.message;
  this.attachments = event.attachments;
  this.sendMessage(); // Your existing send method
}

onFilesSelected(files: File[]) {
  // Handle new file selections
  this.attachments = [...this.attachments, ...files];
  // Trigger upload if needed
}

onAttachmentRemove(index: number) {
  this.attachments.splice(index, 1);
}

onInputClear() {
  this.messageInput = '';
  this.attachments = [];
}
  sendMessageViaSocket(body: string, attachments: Attachment[]) {
    const channelId = this.activeChannelId();
    if (!channelId) return;
    
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      _id: tempId,
      channelId,
      senderId: this.currentUserId(),
      body,
      attachments,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    // Add to messages list
    const current = this.messages();
    this.messages.set([...current, optimisticMessage]);
    
    // Clear input immediately for better UX
    this.messageInput = '';
    this.attachments = [];
    this.uploadProgress.set(0);
    
    // Stop typing
    this.stopTyping();
    
    // Send via socket
    const payload = {
      channelId,
      body,
      attachments
    };
    
    console.log('Sending message via socket:', payload);
    this.socketService.sendMessage(payload);
  }

  uploadAttachmentsAndSendMessage(body: string) {
    this.isUploading = true;
    this.uploadProgress.set(0);
    
    const uploadPromises = this.attachments.map(file => 
      this.socketService.uploadAttachment(file).pipe(
        finalize(() => {
          this.uploadProgress.update(prev => prev + (100 / this.attachments.length));
        })
      ).toPromise()
    );

    Promise.all(uploadPromises)
      .then((attachments: any[]) => {
        this.isUploading = false;
        this.uploadProgress.set(0);
        this.sendMessageViaSocket(body, attachments);
      })
      .catch((error) => {
        this.isUploading = false;
        this.uploadProgress.set(0);
        this.messageService.handleHttpError(error, 'Uploading files');
      });
  }

  startTyping() {
    const channelId = this.activeChannelId();
    if (!channelId || this.isTyping()) return;
    
    console.log('Starting typing in channel:', channelId);
    this.isTyping.set(true);
    this.socketService.sendTyping(channelId, true);
    
    // Send typing indicator every 3 seconds while typing
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setInterval(() => {
      if (this.isTyping()) {
        this.socketService.sendTyping(channelId, true);
      }
    }, 3000);
  }

  stopTyping() {
    const channelId = this.activeChannelId();
    if (!channelId || !this.isTyping()) return;
    
    console.log('Stopping typing in channel:', channelId);
    this.isTyping.set(false);
    this.socketService.sendTyping(channelId, false);
    
    if (this.typingTimeout) {
      clearInterval(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  onTypingInput() {
    this.startTyping();
    
    // Debounce stop typing
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, this.typingDebounceTime);
  }

  handleFileUpload(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0 || !this.activeChannelId()) return;
    
    // Add files to attachments list
    Array.from(files).forEach(file => {
      this.attachments.push(file);
    });
    
    input.value = ''; // Reset input
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  triggerFilePicker() { 
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = (ev) => this.handleFileUpload(ev);
    fileInput.click();
  }

  // --- Message Editing ---
  startEditingMessage(msg: ChatMessage) {
    if (!msg._id || this.getSenderId(msg) !== this.currentUserId() || msg.deleted) return;
    
    this.editingMessageId.set(msg._id);
    this.editMessageText = msg.body || '';
  }

  cancelEditing() {
    this.editingMessageId.set(null);
    this.editMessageText = '';
  }

  saveEditedMessage() {
    const messageId = this.editingMessageId();
    if (!messageId || !this.editMessageText.trim()) return;
    
    console.log('Editing message:', messageId);
    
    this.socketService.editMessageHttp(messageId, this.editMessageText.trim()).subscribe({
      next: (updatedMessage: ChatMessage) => {
        this.cancelEditing();
        
        // Update local state
        const current = this.messages();
        const updated = current.map(m => m._id === messageId ? updatedMessage : m);
        this.messages.set(updated);
        
        this.messageService.showSuccess('Message Updated', 'Message has been updated');
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.handleHttpError(err, 'Editing message');
      }
    });
  }

  deleteMessage(msg: ChatMessage) {
    if (!msg._id || this.getSenderId(msg) !== this.currentUserId() || msg.deleted) return;
    
    if (confirm('Are you sure you want to delete this message?')) {
      console.log('Deleting message:', msg._id);
      
      this.socketService.deleteMessageHttp(msg._id).subscribe({
        next: () => {
          // Update local state
          const current = this.messages();
          const updated = current.map(m => {
            if (m._id === msg._id) {
              return { ...m, body: '', attachments: [], deleted: true };
            }
            return m;
          });
          this.messages.set(updated);
          
          this.messageService.showSuccess('Message Deleted', 'Message has been deleted');
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.handleHttpError(err, 'Deleting message');
        }
      });
    }
  }

  // --- Channel Creation ---
  openCreateModal() { 
    this.showCreateModal = true; 
    this.newChannelName = ''; 
    this.channelType = 'public';
    this.selectedMembers.clear();
  }

  closeCreateModal() { 
    this.showCreateModal = false; 
  }
  
  toggleMemberSelection(id: string) {
    if (this.selectedMembers.has(id)) {
      this.selectedMembers.delete(id);
    } else {
      this.selectedMembers.add(id);
    }
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

    console.log('Creating channel:', this.newChannelName, this.channelType, members);

    this.socketService.createChannelHttp(
      this.newChannelName.trim(), 
      this.channelType as 'public' | 'private' | 'dm', 
      members
    ).subscribe({
      next: (ch: Channel) => {
        console.log('Channel created:', ch);
        
        // Also emit socket event for real-time
        this.socketService.createChannel(
          this.newChannelName.trim(),
          this.channelType as 'public' | 'private' | 'dm',
          members
        );
        
        this.showCreateModal = false;
        this.selectChannel(ch);
        this.messageService.showSuccess('Channel Created', `Channel "${ch.name}" created successfully`);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error creating channel:', err);
        this.messageService.handleHttpError(err, 'Creating channel');
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
      console.log('Marking messages as read:', unreadMessages.length);
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
    const user = this.allUsers().get(userId);
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return userId.slice(0, 2).toUpperCase();
  }

  getUserName(userId: string): string {
    const user = this.allUsers().get(userId);
    return user?.name || 'User';
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

  getFileIconClass(url: string): string {
    if (!url) return 'pi-file';
    
    if (this.isImage(url)) return 'pi-image';
    if (this.isVideo(url)) return 'pi-video';
    if (this.isAudio(url)) return 'pi-volume-up';
    if (/\.(pdf)$/i.test(url)) return 'pi-file-pdf';
    if (/\.(docx?|rtf)$/i.test(url)) return 'pi-file-word';
    if (/\.(xlsx?|csv)$/i.test(url)) return 'pi-file-excel';
    if (/\.(zip|rar|tar|gz)$/i.test(url)) return 'pi-file-archive';
    
    return 'pi-file';
  }

  isImage(url?: string): boolean {
    if (!url) return false;
    return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(url) || 
           url.includes('cloudinary') || 
           url.includes('image');
  }

  isVideo(url?: string): boolean {
    if (!url) return false;
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(url) || 
           url.includes('video');
  }

  isAudio(url?: string): boolean {
    if (!url) return false;
    return /\.(mp3|wav|ogg|flac|aac)$/i.test(url) || 
           url.includes('audio');
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  hasMessageInput(): boolean {
    return this.messageInput && this.messageInput.trim().length > 0;
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

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    if (element.scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
      this.loadMoreMessages();
    }
  }

  clearInput() {
    this.messageInput = '';
    this.attachments = [];
    this.uploadProgress.set(0);
    this.stopTyping();
  }


// Add these methods to your ChatComponent class (in chat.component.ts)

// --- Channel Settings Methods ---
closeChannelSettings() {
  this.showChannelSettings = false;
}

// --- Add Members Modal Methods ---
openAddMembersModal() {
  this.showAddMembersModal = true;
  this.newMembers.clear();
}

closeAddMembersModal() {
  this.showAddMembersModal = false;
}

submitAddMembers() {
  const channelId = this.activeChannelId();
  if (!channelId || this.newMembers.size === 0) {
    this.messageService.showWarn('Validation', 'Please select members to add');
    return;
  }

  console.log('Adding members to channel:', channelId, Array.from(this.newMembers));
  
  // Call your service to add members (you'll need to implement this in your SocketService)
  // Example:
  // this.socketService.addMembersToChannel(channelId, Array.from(this.newMembers))
  //   .subscribe({
  //     next: (updatedChannel) => {
  //       this.showAddMembersModal = false;
  //       this.newMembers.clear();
  //       this.messageService.showSuccess('Members Added', 'Members have been added to the channel');
  //     },
  //     error: (err) => {
  //       this.messageService.handleHttpError(err, 'Adding members');
  //     }
  //   });
  
  // For now, just close the modal
  this.showAddMembersModal = false;
  this.newMembers.clear();
  this.messageService.showInfo('Coming Soon', 'Add members feature will be implemented soon');
}


  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
    
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
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Disconnect socket
    this.socketService.disconnect();
  }
}

// import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
// import { ChatSidebarComponent } from './chat-sidebar.component';
// import { ChatHeaderComponent } from './chat-header.component';
// import { ChatMessagesComponent } from './chat-messages.component';
// import { ChatComposerComponent } from './chat-composer.component';
// import { ChatModalsComponent } from './chat-modals.component';
// import { SocketService } from '../../core/services/socket.service';
// import { MasterListService } from '../../core/services/master-list.service';
// import { AppMessageService } from '../../core/services/message.service';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { CommonModule } from '@angular/common';
// import { Subscription } from 'rxjs';

// export interface ChatMessage {
//   _id: string;
//   channelId: string;
//   senderId: any;
//   body: string;
//   attachments: any[];
//   createdAt: string;
//   read: boolean;
//   editedAt?: string;
//   deleted?: boolean;
// }

// export interface Channel {
//   _id: string;
//   name: string;
//   type: 'public' | 'private' | 'dm';
//   isActive: boolean;
// }

// export interface Attachment {
//   url: string;
//   name: string;
//   type: string;
// }

// @Component({
//   selector: 'app-chat',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ChatSidebarComponent,
//     ChatHeaderComponent,
//     ChatMessagesComponent,
//     ChatComposerComponent,
//     ChatModalsComponent
//   ],
  // template: `
  //   <div class="chat-system" [class.mobile-view]="mobileView()">
  //     @if (mobileView()) {
  //       <div class="mobile-header">
  //         <button class="sidebar-toggle" (click)="toggleSidebar()">
  //           <i class="pi" [class.pi-bars]="!sidebarOpen()" [class.pi-times]="sidebarOpen()"></i>
  //         </button>
  //         @if (activeChannel()) {
  //           <div class="channel-info">
  //             <h3>#{{ activeChannel()?.name }}</h3>
  //             <span class="online">{{ activeChannelUsers().length }} online</span>
  //           </div>
  //         }
  //       </div>
  //     }

  //     <app-chat-sidebar
  //       [channels]="channels()"
  //       [activeChannelId]="activeChannelId()"
  //       [currentUserId]="currentUserId()"
  //       [sidebarOpen]="sidebarOpen()"
  //       [mobileView]="mobileView()"
  //       [unreadCounts]="unreadCounts()"
  //       [activeChannelUsers]="activeChannelUsers()"
  //       [onlineUsers]="onlineUsers()"
  //       (channelSelected)="selectChannel($event)"
  //       (createChannel)="openCreateModal()"
  //       (toggleSidebar)="toggleSidebar()"
  //     ></app-chat-sidebar>

  //     <main class="chat-main">
  //       @if (activeChannelId()) {
  //         <app-chat-header
  //           [activeChannel]="activeChannel()"
  //           [activeChannelUsers]="activeChannelUsers()"
  //           [mobileView]="mobileView()"
  //           (toggleSidebar)="toggleSidebar()"
  //           (openSettings)="openChannelSettings()"
  //         ></app-chat-header>

  //         <app-chat-messages
  //           [messages]="messages()"
  //           [currentUserId]="currentUserId()"
  //           [activeChannel]="activeChannel()"
  //           [loadingMore]="loadingMore"
  //           [typingIndicator]="typingIndicator()"
  //           (scroll)="onScroll($event)"
  //           (editMessage)="startEditingMessage($event)"
  //           (deleteMessage)="deleteMessage($event)"
  //           (saveEditedMessage)="saveEditedMessage($event)"
  //           (cancelEditing)="cancelEditing()"
  //         ></app-chat-messages>

  //         <app-chat-composer
  //           [messageInput]="messageInput"
  //           [attachments]="attachments"
  //           [isUploading]="isUploading"
  //           [activeChannel]="activeChannel()"
  //           (sendMessage)="sendMessage()"
  //           (typingInput)="onTypingInput()"
  //           (fileUpload)="handleFileUpload($event)"
  //           (removeAttachment)="removeAttachment($event)"
  //           (clearInput)="clearInput()"
  //         ></app-chat-composer>
  //       } @else {
  //         <div class="welcome">
  //           <div class="welcome-content">
  //             <i class="pi pi-comments"></i>
  //             <h2>Welcome to Chat</h2>
  //             <p>Select a channel or create one to start chatting</p>
  //             <button (click)="openCreateModal()" class="btn-create-channel">
  //               <i class="pi pi-plus"></i> Create Channel
  //             </button>
  //           </div>
  //         </div>
  //       }
  //     </main>

  //     <app-chat-modals
  //       [showCreateModal]="showCreateModal"
  //       [showChannelSettings]="showChannelSettings"
  //       [showAddMembersModal]="showAddMembersModal"
  //       [newChannelName]="newChannelName"
  //       [channelType]="channelType"
  //       [selectedMembers]="selectedMembers"
  //       [newMembers]="newMembers"
  //       [activeChannelUsers]="activeChannelUsers()"
  //       [currentUserId]="currentUserId()"
  //       [activeChannel]="activeChannel()"
  //       (closeCreateModal)="closeCreateModal()"
  //       (closeChannelSettings)="closeChannelSettings()"
  //       (closeAddMembersModal)="closeAddMembersModal()"
  //       (submitCreateChannel)="submitCreateChannel()"
  //       (toggleMemberSelection)="toggleMemberSelection($event)"
  //     ></app-chat-modals>
  //   </div>
  // `,
//   styleUrls: ['./chat.component.scss']
// })
// export class ChatComponent implements OnInit, OnDestroy {
//   // Services
//   private socketService = inject(SocketService);
//   private masterList = inject(MasterListService);
//   private messageService = inject(AppMessageService);
//   private authService = inject(AuthService);

//   // UI state
//   channels = signal<Channel[]>([]);
//   messages = signal<ChatMessage[]>([]);
//   activeChannelId = signal<string | null>(null);
//   currentUserId = signal<string>('');
//   currentUser = signal<any>(null);
//   messageInput = '';
//   isUploading = false;
//   isTyping = signal<boolean>(false);
//   typingUsers = signal<Map<string, {userId: string, timestamp: number}>>(new Map());
//   channelUsers = signal<Record<string, string[]>>({});
//   onlineUsers = signal<Set<string>>(new Set());
//   allUsers = signal<Map<string, any>>(new Map());
//   unreadCounts = signal<Record<string, number>>({});
//   lastReadTimestamps = signal<Record<string, number>>({});

//   // Modal state
//   showCreateModal = false;
//   newChannelName = '';
//   channelType = 'public';
//   selectedMembers = new Set<string>();
//   showChannelSettings = false;
//   showAddMembersModal = false;
//   newMembers = new Set<string>();

//   // Message editing
//   editingMessageId = signal<string | null>(null);
//   editMessageText = '';

//   // Responsive
//   sidebarOpen = signal<boolean>(true);
//   mobileView = signal<boolean>(false);

//   // Upload state
//   attachments: File[] = [];
//   uploadProgress = signal<number>(0);

//   // Infinite scroll
//   loadingMore = false;
//   hasMoreMessages = true;
//   pageSize = 50;

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

//   private subs: Subscription[] = [];
//   private typingTimeout: any = null;
//   private typingDebounceTime = 1000;
//   private cleanupTimer: any = null;

//   ngOnInit(): void {
//     this.checkMobileView();
//     this.loadCurrentUser();
//     this.initializeSocketConnection();
//     this.setupSocketListeners();
//     this.loadChannels();
    
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
//       this.socketService.connect(token, orgId, userId);
//     } else {
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
//     this.subs.forEach(s => s.unsubscribe());
//     this.subs = [];

//     this.subs.push(
//       this.socketService.channels$.subscribe(list => {
//         this.channels.set(list || []);
//         if (this.channels().length > 0 && !this.activeChannelId()) {
//           this.selectChannel(this.channels()[0]);
//         }
//       })
//     );

//     this.subs.push(
//       this.socketService.messages$.subscribe(msg => {
//         if (msg.channelId === this.activeChannelId()) {
//           const current = this.messages();
//           if (!current.some(m => m._id === msg._id)) {
//             this.messages.set([...current, msg]);
//             this.markMessagesAsRead();
//           }
//         }
//       })
//     );

//     this.subs.push(
//       this.socketService.messageEdited$.subscribe(msg => {
//         if (msg.channelId === this.activeChannelId()) {
//           const current = this.messages();
//           const updated = current.map(m => m._id === msg._id ? msg : m);
//           this.messages.set(updated);
//         }
//       })
//     );

//     this.subs.push(
//       this.socketService.messageDeleted$.subscribe(data => {
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

//     this.subs.push(
//       this.socketService.typing$.subscribe(t => {
//         if (t.channelId === this.activeChannelId() && t.userId !== this.currentUserId()) {
//           const now = Date.now();
//           const typingMap = new Map(this.typingUsers());
//           typingMap.set(t.userId, { userId: t.userId, timestamp: now });
//           this.typingUsers.set(typingMap);
          
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

//   checkMobileView() {
//     this.mobileView.set(window.innerWidth < 768);
//     if (this.mobileView()) {
//       this.sidebarOpen.set(false);
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

//     const prevChannelId = this.activeChannelId();
//     if (prevChannelId) {
//       this.socketService.leaveChannel(prevChannelId);
//       this.markMessagesAsRead();
//     }
    
//     this.activeChannelId.set(channel._id);
//     this.messages.set([]);
//     this.hasMoreMessages = true;
//     this.editingMessageId.set(null);
    
//     this.socketService.joinChannel(channel._id);
    
//     if (this.mobileView()) {
//       this.sidebarOpen.set(false);
//     }
    
//     this.loadMessagesForActiveChannel();
    
//     const newTypingMap = new Map(this.typingUsers());
//     newTypingMap.clear();
//     this.typingUsers.set(newTypingMap);
//   }

//   loadMessagesForActiveChannel() {
//     const channelId = this.activeChannelId();
//     if (!channelId) return;
    
//     this.messages.set([]);
//     this.loadMoreMessages();
//   }

//   loadMoreMessages() {
//     if (this.loadingMore || !this.hasMoreMessages || !this.activeChannelId()) return;
    
//     this.loadingMore = true;
//     const oldestMessage = this.messages()[0];
//     const before = oldestMessage?.createdAt;
    
//     this.socketService.fetchMessagesHttp(this.activeChannelId()!, before, this.pageSize).subscribe({
//       next: (res: any) => {
//         if (res.messages?.length > 0) {
//           const newMessages = res.messages.reverse();
//           const current = this.messages();
          
//           const existingIds = new Set(current.map(m => m._id));
//           const uniqueNewMessages = newMessages.filter((msg: ChatMessage) => 
//             msg._id && !existingIds.has(msg._id)
//           );
          
//           if (before) {
//             this.messages.set([...uniqueNewMessages, ...current]);
//           } else {
//             this.messages.set(uniqueNewMessages);
//           }
          
//           this.hasMoreMessages = res.messages.length === this.pageSize;
//         } else {
//           this.hasMoreMessages = false;
//         }
//         this.loadingMore = false;
//       },
//       error: (err) => {
//         this.messageService.handleHttpError(err, 'Loading messages');
//         this.loadingMore = false;
//       }
//     });
//   }

//   sendMessage() {
//     const channelId = this.activeChannelId();
//     const body = this.messageInput.trim();
    
//     if (!channelId) {
//       this.messageService.showWarn('Validation', 'Please select a channel');
//       return;
//     }
    
//     if (this.attachments.length > 0) {
//       this.uploadAttachmentsAndSendMessage(body);
//     } else {
//       this.sendMessageViaSocket(body, []);
//     }
//   }

//   sendMessageViaSocket(body: string, attachments: any[]) {
//     const channelId = this.activeChannelId();
//     if (!channelId) return;
    
//     const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
//     const optimisticMessage: ChatMessage = {
//       _id: tempId,
//       channelId,
//       senderId: this.currentUserId(),
//       body,
//       attachments,
//       createdAt: new Date().toISOString(),
//       read: false
//     };
    
//     const current = this.messages();
//     this.messages.set([...current, optimisticMessage]);
    
//     this.messageInput = '';
//     this.attachments = [];
//     this.uploadProgress.set(0);
//     this.stopTyping();
    
//     const payload = {
//       channelId,
//       body,
//       attachments
//     };
    
//     this.socketService.sendMessage(payload);
//   }

//   uploadAttachmentsAndSendMessage(body: string) {
//     this.isUploading = true;
//     this.uploadProgress.set(0);
    
//     const uploadPromises = this.attachments.map(file => 
//       this.socketService.uploadAttachment(file).toPromise()
//     );

//     Promise.all(uploadPromises)
//       .then((attachments: any) => {
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
    
//     this.isTyping.set(true);
//     this.socketService.sendTyping(channelId, true);
    
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
    
//     this.isTyping.set(false);
//     this.socketService.sendTyping(channelId, false);
    
//     if (this.typingTimeout) {
//       clearInterval(this.typingTimeout);
//       this.typingTimeout = null;
//     }
//   }

//   onTypingInput() {
//     this.startTyping();
    
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
    
//     Array.from(files).forEach(file => {
//       this.attachments.push(file);
//     });
    
//     input.value = '';
//   }

//   removeAttachment(index: number) {
//     this.attachments.splice(index, 1);
//   }

//   startEditingMessage(msg: ChatMessage) {
//     if (this.getSenderId(msg) !== this.currentUserId() || msg.deleted) return;
    
//     this.editingMessageId.set(msg._id || null);
//     this.editMessageText = msg.body || '';
//   }

//   cancelEditing() {
//     this.editingMessageId.set(null);
//     this.editMessageText = '';
//   }

//   saveEditedMessage() {
//     const messageId = this.editingMessageId();
//     if (!messageId || !this.editMessageText.trim()) return;
    
//     this.socketService.editMessageHttp(messageId, this.editMessageText.trim()).subscribe({
//       next: (updatedMessage: ChatMessage) => {
//         this.cancelEditing();
        
//         const current = this.messages();
//         const updated = current.map(m => m._id === messageId ? updatedMessage : m);
//         this.messages.set(updated);
        
//         this.messageService.showSuccess('Message Updated', 'Message has been updated');
//       },
//       error: (err) => {
//         this.messageService.handleHttpError(err, 'Editing message');
//       }
//     });
//   }

//   deleteMessage(msg: ChatMessage) {
//     if (!msg._id || this.getSenderId(msg) !== this.currentUserId() || msg.deleted) return;
    
//     if (confirm('Are you sure you want to delete this message?')) {
//       this.socketService.deleteMessageHttp(msg._id).subscribe({
//         next: () => {
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
//         error: (err) => {
//           this.messageService.handleHttpError(err, 'Deleting message');
//         }
//       });
//     }
//   }

//   openChannelSettings() {
//     this.showChannelSettings = true;
//   }

//   openCreateModal() { 
//     this.showCreateModal = true; 
//     this.newChannelName = ''; 
//     this.channelType = 'public';
//     this.selectedMembers.clear();
//   }

//   closeCreateModal() { 
//     this.showCreateModal = false; 
//   }
  
//   closeChannelSettings() {
//     this.showChannelSettings = false;
//   }

//   closeAddMembersModal() {
//     this.showAddMembersModal = false;
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

//     this.socketService.createChannelHttp(
//       this.newChannelName.trim(), 
//       this.channelType as 'public' | 'private' | 'dm', 
//       members
//     ).subscribe({
//       next: (ch: Channel) => {
//         this.socketService.createChannel(
//           this.newChannelName.trim(),
//           this.channelType as 'public' | 'private' | 'dm',
//           members
//         );
        
//         this.showCreateModal = false;
//         this.selectChannel(ch);
//         this.messageService.showSuccess('Channel Created', `Channel "${ch.name}" created successfully`);
//       },
//       error: (err) => {
//         this.messageService.handleHttpError(err, 'Creating channel');
//       }
//     });
//   }

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

//   hasMessageInput(): any {
//     return this.messageInput && this.messageInput.trim().length > 0;
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

//   onScroll(event: any) {
//     if (event.target.scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
//       this.loadMoreMessages();
//     }
//   }

//   clearInput() {
//     this.messageInput = '';
//     this.attachments = [];
//     this.uploadProgress.set(0);
//     this.stopTyping();
//   }

//   ngOnDestroy() {
//     this.subs.forEach(s => s.unsubscribe());
//     this.subs = [];
    
//     if (this.activeChannelId()) {
//       this.socketService.leaveChannel(this.activeChannelId()!);
//       this.markMessagesAsRead();
//     }
    
//     this.stopTyping();
    
//     if (this.typingTimeout) {
//       clearTimeout(this.typingTimeout);
//     }
    
//     if (this.cleanupTimer) {
//       clearInterval(this.cleanupTimer);
//     }
    
//     this.socketService.disconnect();
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
// //   computed,
// //   HostListener
// // } from '@angular/core';
// // import { CommonModule, DatePipe } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { Subscription, debounceTime, finalize } from 'rxjs';
// // import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// // import { environment } from '../../../environments/environment';

// // // Import Services
// // import { SocketService, ChatMessage, Channel, Attachment } from '../../core/services/socket.service';
// // import { MasterListService } from '../../core/services/master-list.service';
// // import { AppMessageService } from '../../core/services/message.service';
// // import { Toast } from "primeng/toast";
// // import { AuthService } from '../../modules/auth/services/auth-service';

// // @Component({
// //   selector: 'app-chat',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule, Toast, DatePipe],
// //   templateUrl: './chat.component.html',
// //   styleUrls: ['./chat.component.scss']
// // })
// // export class ChatComponent implements OnInit, OnDestroy {
// //   // Services
// //   public  socketService = inject(SocketService);
// //   public masterList = inject(MasterListService);
// //   private http = inject(HttpClient);
// //   private cdr = inject(ChangeDetectorRef);
// //   private messageService = inject(AppMessageService);
// //   private authService = inject(AuthService);

// //   @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
// //   @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
// //   @ViewChild('messageInput') public messageInputEl!: ElementRef<HTMLTextAreaElement>;

// //   // UI state - Using signals for reactivity
// //   channels = signal<Channel[]>([]);
// //   messages = signal<ChatMessage[]>([]);
// //   activeChannelId = signal<string | null>(null);
// //   currentUserId = signal<string>('');
// //   currentUser = signal<any>(null);
// //   messageInput = '';
// //   isUploading = false;
// //   isTyping = signal<boolean>(false);
// //   typingUsers = signal<Map<string, {userId: string, timestamp: number}>>(new Map());
// //   channelUsers = signal<Record<string, string[]>>({});
// //   onlineUsers = signal<Set<string>>(new Set());
// //   allUsers = signal<Map<string, any>>(new Map());

// //   // Modal state
// //   showCreateModal = false;
// //   newChannelName = '';
// //   channelType = 'public';
// //   selectedMembers = new Set<string>();
  
// //   // Message editing
// //   editingMessageId = signal<string | null>(null);
// //   editMessageText = '';

// //   // Channel management
// //   showChannelSettings = false;
// //   showAddMembersModal = false;
// //   newMembers = new Set<string>();

// //   // Responsive sidebar
// //   sidebarOpen = signal<boolean>(true);
// //   mobileView = signal<boolean>(false);

// //   // Upload state
// //   attachments: File[] = [];
// //   uploadProgress = signal<number>(0);

// //   // Computed values
// //   activeChannel = computed(() => {
// //     const channelId = this.activeChannelId();
// //     return this.channels().find(ch => ch._id === channelId);
// //   });

// //   activeChannelUsers = computed(() => {
// //     const channelId = this.activeChannelId();
// //     return channelId ? this.channelUsers()[channelId] || [] : [];
// //   });

// //   typingIndicator = computed(() => {
// //     const channelId = this.activeChannelId();
// //     if (!channelId) return '';
    
// //     const typingMap = this.typingUsers();
// //     const typingInChannel = Array.from(typingMap.values())
// //       .filter(t => !t.userId.startsWith('temp_') && this.isUserInChannel(t.userId, channelId))
// //       .map(t => this.getUserName(t.userId))
// //       .filter(name => name !== this.getUserName(this.currentUserId()));
    
// //     if (typingInChannel.length === 0) return '';
// //     if (typingInChannel.length === 1) return `${typingInChannel[0]} is typing...`;
// //     if (typingInChannel.length === 2) return `${typingInChannel[0]} and ${typingInChannel[1]} are typing...`;
// //     return `${typingInChannel[0]} and ${typingInChannel.length - 1} others are typing...`;
// //   });

// //   unreadCounts = signal<Record<string, number>>({});
// //   lastReadTimestamps = signal<Record<string, number>>({});

// //   // Infinite scroll
// //   loadingMore = false;
// //   hasMoreMessages = true;
// //   pageSize = 50;

// //   private subs: Subscription[] = [];
// //   private typingTimeout: any = null;
// //   private typingDebounceTime = 1000;
// //   private cleanupTimer: any = null;

// //   constructor() {
// //     // Update user cache
// //     effect(() => {
// //       const users = this.masterList.users();
// //       const userMap = new Map<string, any>();
// //       users.forEach(user => userMap.set(user._id, user));
// //       this.allUsers.set(userMap);
// //       this.cdr.markForCheck();
// //     });

// //     effect(() => {
// //       this.checkMobileView();
// //     });
// //   }

// //   ngOnInit(): void {
// //     this.checkMobileView();
// //     this.loadCurrentUser();
// //     this.initializeSocketConnection();
// //     this.setupSocketListeners();
// //     this.loadChannels();
    
// //     // Clean up old typing indicators periodically
// //     this.cleanupTimer = setInterval(() => {
// //       this.cleanupTypingIndicators();
// //     }, 2000);
// //   }

// //   loadCurrentUser() {
// //     const user = this.authService.getCurrentUser();
// //     if (user) {
// //       this.currentUserId.set(user._id);
// //       this.currentUser.set(user);
// //     } else {
// //       const token = localStorage.getItem('apex_auth_token');
// //       if (token) {
// //         try {
// //           const payload = JSON.parse(atob(token.split('.')[1]));
// //           this.currentUserId.set(payload.sub || payload._id);
// //           this.currentUser.set({ 
// //             _id: payload.sub || payload._id, 
// //             name: payload.name, 
// //             email: payload.email 
// //           });
// //         } catch (error) {
// //           console.error('Failed to parse token:', error);
// //         }
// //       }
// //     }
// //   }

// //   // Add these methods to your ChatComponent class:

// // // For sender avatar (returns first letter of sender name)
// // getSenderAvatar(msg: ChatMessage): string {
// //   const name = this.getSenderName(msg);
// //   return name.charAt(0).toUpperCase();
// // }

// // // File type detection methods
// // getFileIconClass(url: string): string {
// //   if (!url) return 'pi-file';
  
// //   if (this.isImage(url)) return 'pi-image';
// //   if (this.isVideo(url)) return 'pi-video';
// //   if (this.isAudio(url)) return 'pi-volume-up';
// //   if (/\.(pdf)$/i.test(url)) return 'pi-file-pdf';
// //   if (/\.(docx?|rtf)$/i.test(url)) return 'pi-file-word';
// //   if (/\.(xlsx?|csv)$/i.test(url)) return 'pi-file-excel';
// //   if (/\.(zip|rar|tar|gz)$/i.test(url)) return 'pi-file-archive';
  
// //   return 'pi-file';
// // }

// // isImage(url?: string): boolean {
// //   if (!url) return false;
// //   return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(url) || 
// //          url.includes('cloudinary') || 
// //          url.includes('image');
// // }

// // isVideo(url?: string): boolean {
// //   if (!url) return false;
// //   return /\.(mp4|webm|mov|avi|mkv)$/i.test(url) || 
// //          url.includes('video');
// // }

// // isAudio(url?: string): boolean {
// //   if (!url) return false;
// //   return /\.(mp3|wav|ogg|flac|aac)$/i.test(url) || 
// //          url.includes('audio');
// // }

// // // For textarea trim issue - fix in template or add getter
// // // Instead of messageInput.trim() in template, use this method:
// // hasMessageInput(): any {
// //   return this.messageInput && this.messageInput.trim().length > 0;
// // }

// // // For closeChannelSettings - add this method
// // closeChannelSettings() {
// //   this.showChannelSettings = false;
// // }

// // // Also add closeAddMembersModal if missing
// // closeAddMembersModal() {
// //   this.showAddMembersModal = false;
// // }

// // // And closeCreateModal if missing
// // // closeCreateModal() {
// // //   this.showCreateModal = false;
// // // }

// // // Also add formatFileSize method which might be missing
// // formatFileSize(bytes?: number): string {
// //   if (!bytes || bytes === 0) return '0 Bytes';
  
// //   const k = 1024;
// //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
// //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  
// //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// // }

// //   initializeSocketConnection() {
// //     const token = localStorage.getItem('apex_auth_token');
// //     const orgId = this.getOrganizationId();
// //     const userId = this.currentUserId();
    
// //     if (token && orgId && userId) {
// //       console.log('Initializing socket connection...');
// //       this.socketService.connect(token, orgId, userId);
// //     } else {
// //       console.warn('Socket connection missing required data:', { token, orgId, userId });
// //       this.messageService.showError('Connection Error', 'Unable to connect to chat. Please log in again.');
// //     }
// //   }

// //   getOrganizationId(): string {
// //     const token = localStorage.getItem('apex_auth_token');
// //     if (token) {
// //       try {
// //         const payload = JSON.parse(atob(token.split('.')[1]));
// //         return payload.organizationId || '';
// //       } catch (error) {
// //         console.error('Failed to parse organizationId from token:', error);
// //       }
// //     }
// //     return '';
// //   }

// //   setupSocketListeners(): void {
// //     // Clear existing subscriptions
// //     this.subs.forEach(s => s.unsubscribe());
// //     this.subs = [];

// //     // 1. CHANNELS
// //     this.subs.push(
// //       this.socketService.channels$.subscribe(list => {
// //         console.log('Channels updated:', list?.length);
// //         this.channels.set(list || []);
        
// //         // Auto-select first channel if none selected
// //         if (this.channels().length > 0 && !this.activeChannelId()) {
// //           this.selectChannel(this.channels()[0]);
// //         }
// //         this.cdr.markForCheck();
// //       })
// //     );

// //     // 2. NEW MESSAGES
// //     this.subs.push(
// //       this.socketService.messages$.subscribe(msg => {
// //         console.log('New message received:', msg);
        
// //         if (msg.channelId === this.activeChannelId()) {
// //           const current = this.messages();
// //           // Avoid duplicates
// //           if (!current.some(m => m._id === msg._id)) {
// //             this.messages.set([...current, msg]);
// //             this.markMessagesAsRead();
// //             setTimeout(() => this.scrollToBottom(), 50);
// //           }
// //         }
// //         this.cdr.markForCheck();
// //       })
// //     );

// //     // 3. MESSAGE EDITS
// //     this.subs.push(
// //       this.socketService.messageEdited$.subscribe(msg => {
// //         console.log('Message edited:', msg);
// //         if (msg.channelId === this.activeChannelId()) {
// //           const current = this.messages();
// //           const updated = current.map(m => m._id === msg._id ? msg : m);
// //           this.messages.set(updated);
// //           this.cdr.markForCheck();
// //         }
// //       })
// //     );

// //     // 4. MESSAGE DELETIONS
// //     this.subs.push(
// //       this.socketService.messageDeleted$.subscribe(data => {
// //         console.log('Message deleted:', data);
// //         if (data.channelId === this.activeChannelId()) {
// //           const current = this.messages();
// //           const updated = current.map(m => {
// //             if (m._id === data.messageId) {
// //               return { ...m, body: '', attachments: [], deleted: true };
// //             }
// //             return m;
// //           });
// //           this.messages.set(updated);
// //           this.cdr.markForCheck();
// //         }
// //       })
// //     );

// //     // 5. PRESENCE
// //     this.subs.push(
// //       this.socketService.channelUsers$.subscribe(map => {
// //         this.channelUsers.set(map || {});
// //         this.cdr.markForCheck();
// //       })
// //     );

// //     this.subs.push(
// //       this.socketService.onlineUsers$.subscribe(users => {
// //         this.onlineUsers.set(users);
// //         this.cdr.markForCheck();
// //       })
// //     );

// //     // 6. TYPING
// //     this.subs.push(
// //       this.socketService.typing$.subscribe(t => {
// //         console.log('Typing event:', t);
// //         if (t.channelId === this.activeChannelId() && t.userId !== this.currentUserId()) {
// //           const now = Date.now();
// //           const typingMap = new Map(this.typingUsers());
// //           typingMap.set(t.userId, { userId: t.userId, timestamp: now });
// //           this.typingUsers.set(typingMap);
          
// //           // Auto-remove after 3 seconds
// //           setTimeout(() => {
// //             const currentMap = new Map(this.typingUsers());
// //             if (currentMap.has(t.userId)) {
// //               const userData = currentMap.get(t.userId);
// //               if (userData && now - userData.timestamp > 3000) {
// //                 currentMap.delete(t.userId);
// //                 this.typingUsers.set(currentMap);
// //                 this.cdr.markForCheck();
// //               }
// //             }
// //           }, 3000);
// //         }
// //         this.cdr.markForCheck();
// //       })
// //     );

// //     // 7. CHANNEL EVENTS
// //     this.subs.push(
// //       this.socketService.channelCreated$.subscribe(channel => {
// //         console.log('Channel created:', channel);
// //         const current = this.channels();
// //         if (!current.some(c => c._id === channel._id)) {
// //           this.channels.set([channel, ...current]);
// //         }
// //         this.messageService.showSuccess('Channel Created', `Channel "${channel.name}" created successfully`);
// //         this.cdr.markForCheck();
// //       })
// //     );

// //     // 8. CONNECTION STATUS
// //     this.subs.push(
// //       this.socketService.connectionStatus$.subscribe(status => {
// //         console.log('Connection status:', status);
// //         if (status === 'disconnected') {
// //           this.messageService.showWarn('Connection Lost', 'Attempting to reconnect...');
// //         } else if (status === 'connected') {
// //           this.messageService.showSuccess('Connected', 'Chat connection established');
// //           // Re-join active channel
// //           const activeId = this.activeChannelId();
// //           if (activeId) {
// //             this.socketService.joinChannel(activeId);
// //           }
// //         }
// //       })
// //     );
// //   }

// //   cleanupTypingIndicators() {
// //     const now = Date.now();
// //     const typingMap = new Map(this.typingUsers());
// //     let changed = false;
    
// //     for (const [userId, data] of typingMap.entries()) {
// //       if (now - data.timestamp > 3000) {
// //         typingMap.delete(userId);
// //         changed = true;
// //       }
// //     }
    
// //     if (changed) {
// //       this.typingUsers.set(typingMap);
// //       this.cdr.markForCheck();
// //     }
// //   }

// //   @HostListener('window:resize')
// //   checkMobileView() {
// //     this.mobileView.set(window.innerWidth < 768);
// //     if (this.mobileView()) {
// //       this.sidebarOpen.set(false);
// //     }
// //   }

// //   loadChannels() {
// //     this.socketService.listChannels().subscribe({
// //       next: (res) => {
// //         console.log('Channels loaded via HTTP:', res);
// //         this.socketService.setChannels(res);
// //       },
// //       error: (err) => {
// //         console.error('Error loading channels:', err);
// //         this.messageService.handleHttpError(err, 'Loading channels');
// //       }
// //     });
// //   }

// //   selectChannel(channel: Channel) {
// //     if (!channel || this.activeChannelId() === channel._id) return;

// //     console.log('Selecting channel:', channel._id);

// //     // Leave previous channel
// //     const prevChannelId = this.activeChannelId();
// //     if (prevChannelId) {
// //       this.socketService.leaveChannel(prevChannelId);
// //       this.markMessagesAsRead();
// //     }
    
// //     // Set new channel
// //     this.activeChannelId.set(channel._id);
// //     this.messages.set([]);
// //     this.hasMoreMessages = true;
// //     this.editingMessageId.set(null);
    
// //     // Join new channel via socket
// //     this.socketService.joinChannel(channel._id);
    
// //     // Close sidebar on mobile
// //     if (this.mobileView()) {
// //       this.sidebarOpen.set(false);
// //     }
    
// //     // Load messages
// //     this.loadMessagesForActiveChannel();
    
// //     // Clear typing indicators
// //     const newTypingMap = new Map(this.typingUsers());
// //     newTypingMap.clear();
// //     this.typingUsers.set(newTypingMap);
    
// //     this.cdr.markForCheck();
// //   }

// //   loadMessagesForActiveChannel() {
// //     const channelId = this.activeChannelId();
// //     if (!channelId) return;
    
// //     console.log('Loading messages for channel:', channelId);
    
// //     // Clear existing messages
// //     this.messages.set([]);
// //     this.loadMoreMessages();
// //   }

// //   loadMoreMessages() {
// //     if (this.loadingMore || !this.hasMoreMessages || !this.activeChannelId()) return;
    
// //     this.loadingMore = true;
// //     const oldestMessage = this.messages()[0];
// //     const before = oldestMessage?.createdAt;
    
// //     console.log('Loading more messages, before:', before);
    
// //     this.socketService.fetchMessagesHttp(this.activeChannelId()!, before, this.pageSize).subscribe({
// //       next: (res: any) => {
// //         console.log('Messages loaded:', res.messages?.length);
// //         if (res.messages?.length > 0) {
// //           const newMessages = res.messages.reverse();
// //           const current = this.messages();
          
// //           // Filter out duplicates
// //           const existingIds = new Set(current.map(m => m._id));
// //           const uniqueNewMessages = newMessages.filter((msg: ChatMessage) => 
// //             msg._id && !existingIds.has(msg._id)
// //           );
          
// //           if (before) {
// //             // Prepend for infinite scroll
// //             this.messages.set([...uniqueNewMessages, ...current]);
// //           } else {
// //             // First load or channel switch
// //             this.messages.set(uniqueNewMessages);
// //             setTimeout(() => this.scrollToBottom(), 100);
// //           }
          
// //           this.hasMoreMessages = res.messages.length === this.pageSize;
          
// //           if (!before) {
// //             setTimeout(() => this.scrollToBottom(), 100);
// //           }
// //         } else {
// //           this.hasMoreMessages = false;
// //         }
// //         this.loadingMore = false;
// //         this.cdr.markForCheck();
// //       },
// //       error: (err: HttpErrorResponse) => {
// //         console.error('Error loading messages:', err);
// //         this.messageService.handleHttpError(err, 'Loading messages');
// //         this.loadingMore = false;
// //         this.cdr.markForCheck();
// //       }
// //     });
// //   }

// //     openChannelSettings() {
// //     this.showChannelSettings = true;
// //   }



// //   sendMessage() {
// //     const channelId = this.activeChannelId();
// //     const body = this.messageInput.trim();
    
// //     if (!channelId) {
// //       this.messageService.showWarn('Validation', 'Please select a channel');
// //       return;
// //     }
    
// //     // if (!body && this.attachments.length === 0) {
// //     //   this.messageService.showWarn('Validation', 'Message or attachment is required');
// //     //   return;
// //     // }
    
// //     console.log('Sending message to channel:', channelId);
    
// //     if (this.attachments.length > 0) {
// //       this.uploadAttachmentsAndSendMessage(body);
// //     } else {
// //       this.sendMessageViaSocket(body, []);
// //     }
// //   }

// //   sendMessageViaSocket(body: string, attachments: Attachment[]) {
// //     const channelId = this.activeChannelId();
// //     if (!channelId) return;
    
// //     const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
// //     // Create optimistic message
// //     const optimisticMessage: ChatMessage = {
// //       _id: tempId,
// //       channelId,
// //       senderId: this.currentUserId(),
// //       body,
// //       attachments,
// //       createdAt: new Date().toISOString(),
// //       read: false
// //     };
    
// //     // Add to messages list
// //     const current = this.messages();
// //     this.messages.set([...current, optimisticMessage]);
    
// //     // Clear input immediately for better UX
// //     this.messageInput = '';
// //     this.attachments = [];
// //     this.uploadProgress.set(0);
    
// //     // Reset textarea height
// //     if (this.messageInputEl) {
// //       this.messageInputEl.nativeElement.style.height = 'auto';
// //     }
    
// //     // Stop typing
// //     this.stopTyping();
    
// //     // Send via socket
// //     const payload = {
// //       channelId,
// //       body,
// //       attachments
// //     };
    
// //     console.log('Sending message via socket:', payload);
// //     this.socketService.sendMessage(payload);
    
// //     setTimeout(() => this.scrollToBottom(), 50);
// //     this.cdr.markForCheck();
// //   }

// //   uploadAttachmentsAndSendMessage(body: string) {
// //     this.isUploading = true;
// //     this.uploadProgress.set(0);
    
// //     const uploadPromises = this.attachments.map(file => 
// //       this.socketService.uploadAttachment(file).pipe(
// //         finalize(() => {
// //           this.uploadProgress.update(prev => prev + (100 / this.attachments.length));
// //         })
// //       ).toPromise()
// //     );

// //     Promise.all(uploadPromises)
// //       .then((attachments: any) => {
// //         this.isUploading = false;
// //         this.uploadProgress.set(0);
// //         this.sendMessageViaSocket(body, attachments);
// //       })
// //       .catch((error) => {
// //         this.isUploading = false;
// //         this.uploadProgress.set(0);
// //         this.messageService.handleHttpError(error, 'Uploading files');
// //       });
// //   }

// //   startTyping() {
// //     const channelId = this.activeChannelId();
// //     if (!channelId || this.isTyping()) return;
    
// //     console.log('Starting typing in channel:', channelId);
// //     this.isTyping.set(true);
// //     this.socketService.sendTyping(channelId, true);
    
// //     // Send typing indicator every 3 seconds while typing
// //     if (this.typingTimeout) {
// //       clearTimeout(this.typingTimeout);
// //     }
    
// //     this.typingTimeout = setInterval(() => {
// //       if (this.isTyping()) {
// //         this.socketService.sendTyping(channelId, true);
// //       }
// //     }, 3000);
// //   }

// //   stopTyping() {
// //     const channelId = this.activeChannelId();
// //     if (!channelId || !this.isTyping()) return;
    
// //     console.log('Stopping typing in channel:', channelId);
// //     this.isTyping.set(false);
// //     this.socketService.sendTyping(channelId, false);
    
// //     if (this.typingTimeout) {
// //       clearInterval(this.typingTimeout);
// //       this.typingTimeout = null;
// //     }
// //   }

// //   onTypingInput() {
// //     this.startTyping();
    
// //     // Debounce stop typing
// //     if (this.typingTimeout) {
// //       clearTimeout(this.typingTimeout);
// //     }
    
// //     this.typingTimeout = setTimeout(() => {
// //       this.stopTyping();
// //     }, this.typingDebounceTime);
// //   }

// //   handleFileUpload(ev: Event) {
// //     const input = ev.target as HTMLInputElement;
// //     const files = input.files;
// //     if (!files || files.length === 0 || !this.activeChannelId()) return;
    
// //     // Add files to attachments list
// //     Array.from(files).forEach(file => {
// //       this.attachments.push(file);
// //     });
    
// //     this.cdr.markForCheck();
// //     input.value = ''; // Reset input
// //   }

// //   removeAttachment(index: number) {
// //     this.attachments.splice(index, 1);
// //     this.cdr.markForCheck();
// //   }

// //   triggerFilePicker() { 
// //     this.fileInput?.nativeElement?.click(); 
// //   }

// //   // --- Message Editing ---
// //   startEditingMessage(msg: ChatMessage) {
// //     if (this.getSenderId(msg) !== this.currentUserId() || msg.deleted) return;
    
// //     this.editingMessageId.set(msg._id || null);
// //     this.editMessageText = msg.body || '';
// //     this.cdr.markForCheck();
// //   }

// //   cancelEditing() {
// //     this.editingMessageId.set(null);
// //     this.editMessageText = '';
// //     this.cdr.markForCheck();
// //   }

// //   saveEditedMessage() {
// //     const messageId = this.editingMessageId();
// //     if (!messageId || !this.editMessageText.trim()) return;
    
// //     console.log('Editing message:', messageId);
    
// //     this.socketService.editMessageHttp(messageId, this.editMessageText.trim()).subscribe({
// //       next: (updatedMessage: ChatMessage) => {
// //         this.cancelEditing();
        
// //         // Update local state
// //         const current = this.messages();
// //         const updated = current.map(m => m._id === messageId ? updatedMessage : m);
// //         this.messages.set(updated);
        
// //         this.messageService.showSuccess('Message Updated', 'Message has been updated');
// //       },
// //       error: (err: HttpErrorResponse) => {
// //         this.messageService.handleHttpError(err, 'Editing message');
// //       }
// //     });
// //   }

// //   deleteMessage(msg: ChatMessage) {
// //     if (!msg._id || this.getSenderId(msg) !== this.currentUserId() || msg.deleted) return;
    
// //     if (confirm('Are you sure you want to delete this message?')) {
// //       console.log('Deleting message:', msg._id);
      
// //       this.socketService.deleteMessageHttp(msg._id).subscribe({
// //         next: () => {
// //           // Update local state
// //           const current = this.messages();
// //           const updated = current.map(m => {
// //             if (m._id === msg._id) {
// //               return { ...m, body: '', attachments: [], deleted: true };
// //             }
// //             return m;
// //           });
// //           this.messages.set(updated);
          
// //           this.messageService.showSuccess('Message Deleted', 'Message has been deleted');
// //         },
// //         error: (err: HttpErrorResponse) => {
// //           this.messageService.handleHttpError(err, 'Deleting message');
// //         }
// //       });
// //     }
// //   }

// //   // --- Channel Creation ---
// //   openCreateModal() { 
// //     this.showCreateModal = true; 
// //     this.newChannelName = ''; 
// //     this.channelType = 'public';
// //     this.selectedMembers.clear();
// //     this.cdr.markForCheck();
// //   }

// //   closeCreateModal() { 
// //     this.showCreateModal = false; 
// //     this.cdr.markForCheck();
// //   }
  
// //   toggleMemberSelection(id: string) {
// //     if (this.selectedMembers.has(id)) {
// //       this.selectedMembers.delete(id);
// //     } else {
// //       this.selectedMembers.add(id);
// //     }
// //   }

// //   submitCreateChannel() {
// //     if (!this.newChannelName.trim()) {
// //       this.messageService.showWarn('Validation', 'Channel name is required');
// //       return;
// //     }

// //     const members = this.channelType === 'public' ? [] : Array.from(this.selectedMembers);
// //     if (this.channelType !== 'public' && this.currentUserId()) {
// //       members.push(this.currentUserId());
// //     }

// //     console.log('Creating channel:', this.newChannelName, this.channelType, members);

// //     this.socketService.createChannelHttp(
// //       this.newChannelName.trim(), 
// //       this.channelType as 'public' | 'private' | 'dm', 
// //       members
// //     ).subscribe({
// //       next: (ch: Channel) => {
// //         console.log('Channel created:', ch);
        
// //         // Also emit socket event for real-time
// //         this.socketService.createChannel(
// //           this.newChannelName.trim(),
// //           this.channelType as 'public' | 'private' | 'dm',
// //           members
// //         );
        
// //         this.showCreateModal = false;
// //         this.selectChannel(ch);
// //         this.messageService.showSuccess('Channel Created', `Channel "${ch.name}" created successfully`);
// //       },
// //       error: (err: HttpErrorResponse) => {
// //         console.error('Error creating channel:', err);
// //         this.messageService.handleHttpError(err, 'Creating channel');
// //       }
// //     });
// //   }

// //   // --- Message Read Status ---
// //   markMessagesAsRead() {
// //     const channelId = this.activeChannelId();
// //     if (!channelId) return;

// //     const unreadMessages = this.messages()
// //       .filter(m => !m.read && this.getSenderId(m) !== this.currentUserId())
// //       .map(m => m._id)
// //       .filter((id): id is string => !!id);

// //     if (unreadMessages.length > 0) {
// //       console.log('Marking messages as read:', unreadMessages.length);
// //       this.socketService.markRead(channelId, unreadMessages);
// //       this.lastReadTimestamps.set({ ...this.lastReadTimestamps(), [channelId]: Date.now() });
// //     }
// //   }

// //   // --- Helper Methods ---
// //   isUserInChannel(userId: string, channelId: string): boolean {
// //     const users = this.channelUsers()[channelId] || [];
// //     return users.includes(userId);
// //   }

// //   isUserOnline(userId: string): boolean {
// //     return this.onlineUsers().has(userId);
// //   }

// //   getInitials(userId: string): string {
// //     const user = this.allUsers().get(userId);
// //     if (user?.name) {
// //       return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
// //     }
// //     return userId.slice(0, 2).toUpperCase();
// //   }

// //   getUserName(userId: string): string {
// //     const user = this.allUsers().get(userId);
// //     return user?.name || 'User';
// //   }

// //   getSenderId(msg: ChatMessage): string {
// //     if (!msg || !msg.senderId) return '';
// //     return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
// //   }

// //   getSenderName(msg: ChatMessage): string {
// //     if (!msg || !msg.senderId) return 'Unknown';
// //     if (typeof msg.senderId === 'object' && msg.senderId.name) return msg.senderId.name;
// //     if (typeof msg.senderId === 'string') {
// //       return this.getUserName(msg.senderId);
// //     }
// //     return 'User';
// //   }

// //   showDateSeparator(index: number, msg: ChatMessage): boolean {
// //     if (index === 0) return true;
// //     const prevMsg = this.messages()[index - 1];
// //     if (!prevMsg || !msg.createdAt || !prevMsg.createdAt) return false;
    
// //     const prevDate = new Date(prevMsg.createdAt).toDateString();
// //     const currentDate = new Date(msg.createdAt).toDateString();
// //     return prevDate !== currentDate;
// //   }

// //   sendOnEnter(event: any) {
// //     if (event.key === 'Enter' && !event.shiftKey) {
// //       event.preventDefault();
// //       this.sendMessage();
// //     }
// //   }

// //   toggleSidebar() {
// //     this.sidebarOpen.set(!this.sidebarOpen());
// //   }

// //   scrollToBottom() {
// //     setTimeout(() => {
// //       if (this.scrollContainer?.nativeElement) {
// //         const el = this.scrollContainer.nativeElement;
// //         el.scrollTop = el.scrollHeight;
// //       }
// //     }, 50);
// //   }

// //   onScroll() {
// //     const element = this.scrollContainer.nativeElement;
// //     if (element.scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
// //       this.loadMoreMessages();
// //     }
// //   }

// //   autoResizeTextarea(event: any) {
// //     const textarea = event.target;
// //     textarea.style.height = 'auto';
// //     textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
// //   }

// //   clearInput() {
// //     this.messageInput = '';
// //     this.attachments = [];
// //     this.uploadProgress.set(0);
// //     if (this.messageInputEl) {
// //       this.messageInputEl.nativeElement.style.height = 'auto';
// //     }
// //     this.stopTyping();
// //   }

// //   ngOnDestroy() {
// //     // Unsubscribe from all subscriptions
// //     this.subs.forEach(s => s.unsubscribe());
// //     this.subs = [];
    
// //     // Leave current channel
// //     if (this.activeChannelId()) {
// //       this.socketService.leaveChannel(this.activeChannelId()!);
// //       this.markMessagesAsRead();
// //     }
    
// //     // Stop typing
// //     this.stopTyping();
    
// //     // Clear timeouts
// //     if (this.typingTimeout) {
// //       clearTimeout(this.typingTimeout);
// //     }
    
// //     if (this.cleanupTimer) {
// //       clearInterval(this.cleanupTimer);
// //     }
    
// //     // Disconnect socket
// //     this.socketService.disconnect();
// //   }
// // }
