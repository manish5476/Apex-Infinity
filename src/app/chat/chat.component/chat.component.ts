import { Component, inject, OnInit, OnDestroy, computed, signal, HostListener, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize, forkJoin } from 'rxjs';

// Import Components
import { ChatSidebarComponent } from './chat-sidebar.component';
import { ChatHeaderComponent } from './chat-header.component';
import { ChatMessagesComponent } from './chat-messages.component';
import { ChatComposerComponent } from './chat-composer.component';
import { ChatModalsComponent } from './chat-modals.component';

// ✅ NEW: Import Split Services
// import { SocketConnectionService } from '../../core/services/socket-connection.service';
// import { ChatHttpService } from '../../core/services/chat-http.service';
// import { ChatStateService } from '../../core/services/chat-state.service';
import { MasterListService } from '../../core/services/master-list.service';
import { AppMessageService } from '../../core/services/message.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastModule } from "primeng/toast";

// Import Models
import { ChatMessage, Channel, Attachment } from './chat.models';
import { ChatHttpService } from '@core/services/socket/chat-http.service';
import { ChatStateService } from '@core/services/socket/chat-state.service';
import { SocketConnectionService } from '@core/services/socket/socket-connection.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
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
  private themeService = inject(ThemeService);
  public masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  private authService = inject(AuthService);

  // ✅ NEW: Inject the 3 specific services
  private socketConnection = inject(SocketConnectionService);
  private chatHttp = inject(ChatHttpService);
  private chatState = inject(ChatStateService);

  activeThemeId: any = 'theme-glass';

  // --- UI Signals & State ---
  channels = signal<Channel[]>([]);
  messages = signal<ChatMessage[]>([]);
  activeChannelId = signal<string | null>(null);
  currentUserId = signal<string>('');
  currentUser = signal<any>(null);

  // Presence & Typing
  isTyping = signal<boolean>(false);
  typingUsers = signal<Map<string, { userId: string, timestamp: number }>>(new Map());
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
    const channel = this.activeChannel();
    if (!channel) return [];
    const rawList = (channel.type === 'private' || channel.type === 'dm')
      ? (channel.members || [])
      : (this.channelUsers()[channel._id] || []);
    return rawList.filter((u: any) => typeof u === 'string' && u.length > 0);
  });

  // activeChannelUsers = computed(() => {
  //   const channel = this.activeChannel();
  //   if (!channel) return [];
  //   if (channel.type === 'private' || channel.type === 'dm') return channel.members || [];
  //   return this.channelUsers()[channel._id] || [];
  // });

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

  // Infinite Scroll State
  loadingMore = false;
  hasMoreMessages = true;
  pageSize = 50;

  // Subscriptions & Timers
  private subs: Subscription[] = [];
  private typingTimeout: any = null;
  private cleanupTimer: any = null;

  @HostListener('window:resize')
  checkMobileView() {
    const isMobile = window.innerWidth < 768;
    this.mobileView.set(isMobile);
    this.sidebarOpen.set(!isMobile);
  }

  ngOnInit(): void {
    this.checkMobileView();
    this.loadCurrentUser();
    // Note: Connection is now handled by app.component.ts on login!
    // But we setup listeners here for the chat state
    this.setupSocketListeners();
    this.loadChannels();
    this.cleanupTimer = setInterval(() => this.cleanupTypingIndicators(), 2000);
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
          this.currentUser.set({ _id: payload.sub, name: payload.name });
        } catch (e) { console.error(e); }
      }
    }
  }

  // --- Listeners ---

  setupSocketListeners() {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];

    // 1. Channels
    this.subs.push(
      this.chatState.channels$.subscribe((list: any) => {
        this.channels.set(list || []);
        const counts: Record<string, number> = {};
        list.forEach((c: any) => { if (c.unreadCount) counts[c._id] = c.unreadCount; });
        this.unreadCounts.update(prev => ({ ...counts, ...prev }));

        if (this.channels().length > 0 && !this.activeChannelId()) {
          this.selectChannel(this.channels()[0]);
        }
        if (this.activeChannelId() && !list.some((c: any) => c._id === this.activeChannelId())) {
          this.activeChannelId.set(null);
          this.messages.set([]);
        }
      })
    );

    // 2. New Messages
    this.subs.push(
      this.chatState.messages$.subscribe((msg: ChatMessage) => {
        if (msg.channelId === this.activeChannelId()) {
          this.messages.update(current => {
            if (current.some(m => m._id === msg._id)) return current;

            const tempIndex = current.findIndex(m =>
              m._id?.startsWith('temp_') && m.body === msg.body && this.getSenderId(m) === this.getSenderId(msg)
            );

            if (tempIndex > -1) {
              const updated = [...current];
              updated[tempIndex] = msg;
              return updated;
            }
            return [...current, msg];
          });
          this.markMessagesAsRead();
        } else {
          this.unreadCounts.update(counts => ({
            ...counts,
            [msg.channelId]: (counts[msg.channelId] || 0) + 1
          }));
        }
      })
    );

    // 3. Message Edited (Using SocketConnection wrapper)
    this.socketConnection.on('messageEdited', (updatedMsg: ChatMessage) => {
      this.messages.update(current =>
        current.map(m => String(m._id) === String(updatedMsg._id) ? updatedMsg : m)
      );
    });

    // 4. Message Deleted
    this.socketConnection.on('messageDeleted', (data: any) => {
      if (data.channelId === this.activeChannelId()) {
        this.messages.update(current => current.map(m => {
          if (String(m._id) === String(data.messageId)) {
            return { ...m, body: '', attachments: [], deleted: true };
          }
          return m;
        }));
      }
    });

    // 5. Connection Status
    this.subs.push(
      this.socketConnection.connectionStatus$.subscribe(status => {
        console.log(status);
        if (status === 'disconnected') {
          this.messageService.showWarn('Real-time updates are paused.');
        }
      })
    );

    // 6. Typing & Presence
    this.subs.push(
      this.chatState.typing$.subscribe((t: any) => {
        if (t.channelId === this.activeChannelId() && t.userId !== this.currentUserId()) {
          const map = new Map(this.typingUsers());
          if (t.typing) {
            map.set(t.userId, { userId: t.userId, timestamp: Date.now() });
          } else {
            map.delete(t.userId);
          }
          this.typingUsers.set(map);
        }
      }),
      this.chatState.channelUsers$.subscribe(map => this.channelUsers.set(map || {})),
      this.chatState.onlineUsers$.subscribe(users => this.onlineUsers.set(users || new Set()))
    );

    // 7. Read Receipts
    this.subs.push(
      this.chatState.readReceipt$.subscribe((data: any) => {
        if (data.channelId === this.activeChannelId()) {
          this.messages.update(current =>
            current.map(m => {
              if (data.messageIds && data.messageIds.includes(m._id!)) {
                const readBy = m.readBy || [];
                if (!readBy.includes(data.userId)) {
                  return { ...m, readBy: [...readBy, data.userId] };
                }
              }
              return m;
            })
          );
        }
      })
    );

    // 8. Theme Sync - Handled by ThemeService globally
  }

  changeTheme(newThemeId: string) {
    if (newThemeId === 'theme-dark') {
      this.themeService.setDarkMode(true);
    } else {
      this.themeService.setLightTheme(newThemeId);
    }
  }

  // --- Channel Management ---

  loadChannels() {
    this.chatHttp.listChannels().subscribe({
      next: (res) => this.chatState.channels$.next(res),
      error: (err) => console.error(err)
    });
  }

  selectChannel(channel: Channel) {
    if (this.activeChannelId() === channel._id) return;
    this.activeChannelId.set(channel._id!);
    this.messages.set([]);
    this.hasMoreMessages = true;

    this.chatState.joinChannel(channel._id!);

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

  // --- Message Loading ---

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    if (element.scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
      this.loadMoreMessages();
    }
  }

  loadMoreMessages() {
    if (this.loadingMore || !this.activeChannelId()) return;

    this.loadingMore = true;
    const oldestMessage = this.messages()[0];
    const before = oldestMessage?.createdAt;

    this.chatHttp.fetchMessages(this.activeChannelId()!, before, this.pageSize).subscribe({
      next: (res: any) => {
        const newMessages = res.messages || [];
        if (newMessages.length > 0) {
          if (before) {
            this.messages.update(current => [...newMessages, ...current]);
          } else {
            this.messages.set(newMessages);
          }
          this.hasMoreMessages = newMessages.length >= this.pageSize;
          this.markMessagesAsRead();
        } else {
          this.hasMoreMessages = false;
        }
        this.loadingMore = false;
      },
      error: () => this.loadingMore = false
    });
  }

  markMessagesAsRead() {
    const channelId = this.activeChannelId();
    if (!channelId || this.messages().length === 0) return;
    const lastMessage = this.messages()[this.messages().length - 1];

    if (lastMessage && lastMessage._id && !lastMessage._id.startsWith('temp_')) {
      this.chatState.markRead(channelId, [lastMessage._id]);
    }
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

    // Optimistic UI Update
    this.messages.update(msgs => [...msgs, optimisticMsg]);

    this.chatHttp.sendMessage({ channelId, body, attachments }).then((serverMsg: any) => {
      this.messages.update(curr => curr.map(m => m._id === tempId ? (serverMsg as ChatMessage) : m));
    }).catch(err => {
      this.messageService.handleHttpError(err);
      this.messages.update(msgs => msgs.filter(m => m._id !== tempId));
    });
  }
  uploadAttachmentsAndSendMessage(body: string, files: File[]) {
    this.isUploading = true;
    this.uploadProgress.set(0);

    const uploadObservables = files.map(file =>
      this.chatHttp.uploadAttachment(file).pipe(
        finalize(() => this.uploadProgress.update(p => p + (100 / files.length)))
      )
    );

    forkJoin(uploadObservables).subscribe({
      next: (uploadedAttachments: Attachment[]) => {
        this.isUploading = false;
        this.sendMessageViaSocket(body, uploadedAttachments);
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isUploading = false;
        this.messageService.handleHttpError(err);
      }
    });
  }

  // --- Typing ---

  onTypingInput() {
    const cid = this.activeChannelId();
    if (!cid) return;
    this.chatState.sendTyping(cid, true);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.chatState.sendTyping(cid, false);
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

  isUserInChannel(userId: string, channelId: string): boolean {
    const users = this.channelUsers()[channelId] || [];
    return users.includes(userId);
  }

  getUserName(userId: string): string {
    const user = this.masterList.users().find(u => u._id === userId);
    return user ? user.name : 'User';
  }

  // --- MODAL ACTIONS ---

  openCreateModal() { this.showCreateModal = true; this.newChannelName = ''; this.channelType = 'public'; }
  closeCreateModal() { this.showCreateModal = false; }

  submitCreateChannel() {
    const channelName = this.newChannelName?.trim();
    if (!channelName) return;

    const members = this.channelType === 'private' ? Array.from(this.selectedMembers) : [];
    if (this.channelType === 'private' && !members.includes(this.currentUserId())) {
      members.push(this.currentUserId());
    }

    this.chatHttp.createChannel(channelName, this.channelType, members).subscribe({
      next: (newChannel: any) => {
        this.closeCreateModal();
        this.newChannelName = '';
        this.selectedMembers.clear();
        this.messageService.showSuccess(`Channel #${newChannel.name} created!`);
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  toggleMemberSelection(userId: string) {
    if (this.selectedMembers.has(userId)) this.selectedMembers.delete(userId);
    else this.selectedMembers.add(userId);
  }

  toggleNewMemberSelection(userId: string) {
    if (this.newMembers.has(userId)) this.newMembers.delete(userId);
    else this.newMembers.add(userId);
  }

  openChannelSettings() { this.showChannelSettings = true; }
  closeChannelSettings() { this.showChannelSettings = false; }
  openAddMembersModal() { this.showAddMembersModal = true; this.newMembers.clear(); }
  closeAddMembersModal() { this.showAddMembersModal = false; }

  // --- Message Edit / Delete ---

  startEditingMessage(msg: ChatMessage) {
    this.editingMessageId.set(msg._id!);
    this.editMessageText = msg.body || '';
  }

  cancelEditing() {
    this.editingMessageId.set(null);
    this.editMessageText = '';
  }

  saveEditedMessage() {
    const id = this.editingMessageId();
    const text = this.editMessageText?.trim();
    if (!id || !text || id.startsWith('temp_')) return;

    this.messages.update(curr => curr.map(m =>
      String(m._id) === String(id) ? { ...m, body: text, editedAt: new Date().toISOString() } : m
    ));

    this.chatHttp.editMessage(id, text).subscribe({
      next: () => this.cancelEditing(),
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  deleteMessage(msg: ChatMessage) {
    if (!msg._id || msg._id.startsWith('temp_')) return;
    if (!confirm('Permanently delete this message?')) return;

    this.messages.update(curr => curr.map(m =>
      String(m._id) === String(msg._id) ? { ...m, body: '', attachments: [], deleted: true } : m
    ));

    this.chatHttp.deleteMessage(msg._id).subscribe({
      next: () => console.log('Deleted successfully on server'),
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  // --- File Logic ---
  onFilesSelected(files: File[]) { this.attachments = [...this.attachments, ...files]; }
  onAttachmentRemove(index: number) { this.attachments.splice(index, 1); }
  onInputClear() { this.messageInput = ''; this.attachments = []; }

  // --- Channel Actions ---
  onLeaveChannel() {
    const channelId = this.activeChannelId();
    if (!channelId) return;
    if (confirm(`Are you sure you want to leave #${this.activeChannel()?.name}?`)) {
      this.chatHttp.leaveChannel(channelId).subscribe({
        next: () => {
          this.messageService.showSuccess('You have left the channel.');
          this.channels.update(ch => ch.filter(c => c._id !== channelId));
          this.selectChannel(this.channels()[0] || null);
          this.closeChannelSettings();
        },
        error: (err) => this.messageService.handleHttpError(err)
      });
    }
  }

  onRemoveMember(targetUserId: string) {
    const channelId = this.activeChannelId();
    if (!channelId) return;
    const userName = this.getUserName(targetUserId);
    if (confirm(`Remove ${userName} from this channel?`)) {
      this.channels.update(all => all.map(c => {
        if (c._id === channelId && c.members) {
          return { ...c, members: c.members.filter(m => m !== targetUserId) };
        }
        return c;
      }));

      this.chatHttp.removeMember(channelId, targetUserId).subscribe({
        next: () => this.messageService.showSuccess(`${userName} was removed.`),
        error: (err) => this.messageService.handleHttpError(err)
      });
    }
  }

  submitAddMembers() {
    const channelId = this.activeChannelId();
    const membersToAdd = Array.from(this.newMembers);
    if (!channelId || membersToAdd.length === 0) return;

    let successCount = 0;
    this.closeAddMembersModal();

    membersToAdd.forEach(userId => {
      this.chatHttp.addMember(channelId, userId).subscribe({
        next: () => {
          successCount++;
          this.channels.update(all => all.map(c => {
            if (c._id === channelId) {
              const updatedMembers = c.members ? [...c.members] : [];
              if (!updatedMembers.includes(userId)) updatedMembers.push(userId);
              return { ...c, members: updatedMembers };
            }
            return c;
          }));

          if (successCount === membersToAdd.length) {
            this.messageService.showSuccess('Members added');
            this.newMembers.clear();
          }
        },
        error: (err) => this.messageService.handleHttpError(err)
      });
    });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
  }
}

