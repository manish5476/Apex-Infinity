import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { BehaviorSubject, Subject, Observable, timer, Subscription, map, distinctUntilChanged, shareReplay, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppMessageService } from './message.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { NotificationService } from './notification.service';

// --- INTERFACES ---

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
  publicId?: string;
}

export interface Message {
  _id?: string;
  channelId: string;
  senderId?: any; // populated object or string ID
  body?: string;
  attachments?: Attachment[];
  createdAt?: string;
  deleted?: boolean;
  read?: boolean;
  readBy?: string[];
  editedAt?: string;
  editedBy?: string;
}

export type ChatMessage = Message;

export interface Channel {
  _id: string;
  name?: string;
  type?: 'public' | 'private' | 'dm';
  members?: string[];
  isActive?: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt?: string;
  unreadCount?: number;
}

export interface NotificationData {
  _id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  isRead?: boolean;
  createdAt?: string;
  metadata?: any;
  recipientId?: string;
  createdBy?: string;
  readAt?: string;
  readBy?: string;
}

export interface AnnouncementData {
  _id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  senderId?: any;
  organizationId?: string;
  createdAt?: string;
}

export interface OnlineUser {
  userId: string;
  organizationId?: string;
  timestamp?: string;
}

export interface SystemStats {
  connectedUsers: number;
  orgOnlineUsers: number;
  channelPresence: number;
  totalConnections: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);
  private notificationService = inject(NotificationService);
  private socket: Socket | null = null;
  private readonly url = environment.socketUrl;
  private token: string | null = null;
  private userId: string | null = null;
  private orgId: string | null = null;

  // --- STATE STREAMS (Chat) ---
  public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  public socketId$ = new BehaviorSubject<string | null>(null);

  public messages$ = new Subject<Message>();
  public messagesBatch$ = new BehaviorSubject<Message[]>([]);

  public channels$ = new BehaviorSubject<Channel[]>([]);
  public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  public themeChanged$ = new Subject<{ themeId: string }>();
  public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
  public onlineUsersList$: Observable<OnlineUser[]> = this.onlineUsers$.pipe(
    map(users => Array.from(users).map(userId => ({ userId }))),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
    shareReplay(1)
  );

  public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean; timestamp?: string }>();

  // Message events
  public messageEdited$ = new Subject<Message>();

  // ✅ FIX: Define the full type here so it matches the listener
  public messageDeleted$ = new Subject<{ messageId: string; channelId: string; deletedBy: string; timestamp: string }>();

  public readReceipt$ = new Subject<{ userId: string; channelId: string; messageIds: string[] | null; timestamp: string }>();

  // Channel events
  public channelCreated$ = new Subject<Channel>();
  public channelUpdated$ = new Subject<Channel>();
  public channelActivity$ = new Subject<{ channelId: string; lastMessage: any }>();

  // --- STATE STREAMS (Notifications) ---
  private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSource.asObservable();
  public unreadCount$ = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.isRead).length),
    distinctUntilChanged()
  );
  public messageSent$ = new Subject<any>();
  // Announcements
  public announcement$ = new Subject<AnnouncementData>();

  // System events
  public forceLogout$ = new Subject<{ reason: string; timestamp: string }>();
  public systemStats$ = new Subject<SystemStats>();
  public connectionEstablished$ = new Subject<{ userId: string; socketId: string; timestamp: string }>();

  // Reconnect Logic
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectSub: Subscription | null = null;
  private pingInterval: any = null;

  // Rate Limiting (Token Bucket)
  private bucketTokens = 20;
  private bucketCapacity = 20;
  private bucketRefillIntervalMs = 1000;
  private bucketRefillSub: Subscription | null = null;

  // Internal Queue & Health
  private outboundQueue: Array<{ event: string; payload: any }> = [];
  private maxQueueSize = 100;
  private lastPongTime: number = 0;
  public connectionHealth$ = new BehaviorSubject<'healthy' | 'degraded' | 'poor'>('healthy');

  constructor() {
    this.startBucketRefill();
  }

  /**
   * Initialize Socket
   */
  connect(token: string, orgId: string, userId: string) {
    this.token = token;
    this.orgId = orgId;
    this.userId = userId;

    // Prevent double connection
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const opts: Partial<ManagerOptions & SocketOptions> = {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: false, // We handle reconnection manually for better control
      withCredentials: true,
      timeout: 30000,
      forceNew: false,
      autoConnect: true
    };

    try {
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }

      this.socket = io(this.url, opts);

      // ✅ Reset the pong timer immediately upon attempting connection
      this.lastPongTime = Date.now();

      this.setupListeners(orgId);
      this.startPingInterval();

    } catch (err) {
      console.error('Socket Init Failed:', err);
      this.handleReconnect(orgId);
    }
  }

  private setupListeners(orgId: string) {
    if (!this.socket) return;

    // --- CONNECTION EVENTS ---

    this.socket.on('connect', () => {
      console.log('✅ Chat Socket Connected');
      this.zone.run(() => {
        this.connectionStatus$.next('connected');
        this.reconnectAttempts = 0;

        // ✅ Reset pong time on confirmed connection
        this.lastPongTime = Date.now();
        this.connectionHealth$.next('healthy');

        this.flushQueue();

        this.socket?.emit('joinOrg', { organizationId: orgId });
        this.socket?.emit('subscribeNotifications');
        this.getInitialData();
      });
    });

    this.socket.on('themeChanged', (data: { themeId: string }) => {
      this.zone.run(() => {
        this.themeChanged$.next(data);
      });
    });

    // Inside setupListeners():
    this.socket.on('newNotification', (notification: NotificationData) => {
      this.notificationService.handleLiveNotification(notification);
    });

    this.socket.on('notificationRead', (data: { notificationId: string }) => {
      this.notificationService.markAsReadLocal(data.notificationId);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('💬 Chat Socket Error:', error.message);

      if (error.data?.code === 'TOKEN_EXPIRED') {
        this.zone.run(() => {
          this.connectionStatus$.next('reconnecting');

          // Silent Token Refresh
          this.authService.refreshToken().subscribe({
            next: (res: any) => {
              this.token = res.token;
              if (this.socket) {
                this.socket.auth = { token: res.token };
                this.socket.connect();
              }
            },
            error: (err) => {
              this.disconnect();
              this.messageService.handleHttpError(err)
            }
          });
        });
      } else {
        this.zone.run(() => {
          this.connectionStatus$.next('disconnected');
          this.handleReconnect(orgId);
        });
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket Disconnected:', reason);
      this.zone.run(() => {
        this.connectionStatus$.next('disconnected');
        this.socketId$.next(null);
        if (reason !== 'io client disconnect') this.handleReconnect(orgId);
      });
    });

    this.socket.on('connectionEstablished', (data: { userId: string; socketId: string; timestamp: string }) => {
      this.zone.run(() => this.connectionEstablished$.next(data));
    });

    this.socket.on('pong', (data: { timestamp: string }) => {
      this.lastPongTime = Date.now();
      const latency = Date.now() - new Date(data.timestamp).getTime();

      if (latency < 100) this.connectionHealth$.next('healthy');
      else if (latency < 500) this.connectionHealth$.next('degraded');
      else this.connectionHealth$.next('poor');
    });

    // --- MESSAGE EVENTS ---

    this.socket.on('newMessage', (msg: Message) => {
      this.zone.run(() => {
        this.messages$.next(msg);
        const currentBatch = this.messagesBatch$.value;
        const exists = currentBatch.some(m => m._id === msg._id);

        if (!exists) {
          this.messagesBatch$.next([...currentBatch, msg]);
        }
      });
    });

    this.socket.on('messageEdited', (msg: Message) => {
      this.zone.run(() => {
        this.messageEdited$.next(msg);
        const batch = this.messagesBatch$.value;
        const updatedBatch = batch.map(m => m._id === msg._id ? msg : m);
        this.messagesBatch$.next(updatedBatch);
      });
    });

    // ✅ FIX: Updated Listener Signature to match Subject
    this.socket.on('messageDeleted', (data: { messageId: string; channelId: string; deletedBy: string; timestamp: string }) => {
      this.zone.run(() => {
        // Emit to subject (now valid because data structure matches)
        this.messageDeleted$.next(data);

        const updated = this.messagesBatch$.value.map(m =>
          m._id === data.messageId ? { ...m, body: '', attachments: [], deleted: true } : m
        );
        this.messagesBatch$.next(updated);
      });
    });

    this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => {
      this.zone.run(() => {
        const current = this.messagesBatch$.value;
        const existingIds = new Set(current.map(m => m._id));
        const newMessages = payload.messages.reverse().filter(m => !existingIds.has(m._id));
        this.messagesBatch$.next([...newMessages, ...current]);
      });
    });

    this.socket.on('userTyping', (data: { userId: string; channelId: string; typing: boolean; timestamp?: string }) => {
      this.zone.run(() => this.typing$.next(data));
    });

    // Standard Socket.io Read Receipt
    this.socket.on('readReceipt', (data: { userId: string; channelId: string; messageIds: string[] | null; timestamp: string }) => {
      this.zone.run(() => this.readReceipt$.next(data));
    });

    // ✅ FIX: Listener for Backend HTTP-triggered Read Receipt
    // The backend calls this 'messageRead', but we want to map it to our existing 'readReceipt$' stream
    this.socket.on('messageRead', (data: { messageId: string, userId: string, readAt: string }) => {
      this.zone.run(() => {
        // Find channel for this message if possible, or assume active
        // Ideally backend sends channelId too. If missing, we might miss this update unless we scan.
        // But let's assume we can map it.
        const msg = this.messagesBatch$.value.find(m => m._id === data.messageId);
        if (msg) {
          this.readReceipt$.next({
            userId: data.userId,
            channelId: msg.channelId,
            messageIds: [data.messageId],
            timestamp: data.readAt
          });
        }
      });
    });

    // --- CHANNEL & PRESENCE EVENTS ---

    this.socket.on('channelCreated', (channel: Channel) => {
      this.zone.run(() => {
        const current = this.channels$.value;
        // Duplicate Check
        const exists = current.some(c => c._id === channel._id);

        if (!exists) {
          this.channelCreated$.next(channel);
          this.channels$.next([channel, ...current]);
          console.log(`🔔 New channel received: #${channel.name}`);
        }
      });
    });

    this.socket.on('channelUpdated', (channel: Channel) => {
      this.zone.run(() => {
        this.channelUpdated$.next(channel);
        const current = this.channels$.value;
        const updated = current.map(c => c._id === channel._id ? channel : c);
        this.channels$.next(updated);
      });
    });

    this.socket.on('removedFromChannel', (data: { channelId: string }) => {
      this.zone.run(() => {
        // 1. Remove channel from the list
        const currentChannels = this.channels$.value;
        const updatedChannels = currentChannels.filter(c => c._id !== data.channelId);
        this.channels$.next(updatedChannels);

        // 2. Clear messages for that channel from memory
        const currentMessages = this.messagesBatch$.value;
        const updatedMessages = currentMessages.filter(m => m.channelId !== data.channelId);
        this.messagesBatch$.next(updatedMessages);

        console.log(`🚫 You were removed from channel ${data.channelId}`);
      });
    });

    this.socket.on('channelUsers', (data: { channelId: string; users: string[] }) => {
      this.zone.run(() => {
        const current = this.channelUsers$.value;
        this.channelUsers$.next({ ...current, [data.channelId]: data.users });
      });
    });

    this.socket.on('userJoinedChannel', (data: { channelId: string; userId: string }) => {
      this.zone.run(() => {
        const current = this.channelUsers$.value;
        const users = current[data.channelId] || [];
        if (!users.includes(data.userId)) {
          this.channelUsers$.next({ ...current, [data.channelId]: [...users, data.userId] });
        }
      });
    });

    this.socket.on('userLeftChannel', (data: { channelId: string; userId: string }) => {
      this.zone.run(() => {
        const current = this.channelUsers$.value;
        const users = current[data.channelId] || [];
        this.channelUsers$.next({ ...current, [data.channelId]: users.filter(u => u !== data.userId) });
      });
    });

    this.socket.on('userOnline', (data: OnlineUser) => {
      this.zone.run(() => {
        const set = new Set(this.onlineUsers$.value);
        set.add(data.userId);
        this.onlineUsers$.next(set);
      });
    });

    this.socket.on('userOffline', (data: OnlineUser) => {
      this.zone.run(() => {
        const set = new Set(this.onlineUsers$.value);
        set.delete(data.userId);
        this.onlineUsers$.next(set);
      });
    });

    this.socket.on('orgOnlineUsers', (data: { organizationId: string; users: string[] }) => {
      this.zone.run(() => {
        const set = new Set(data.users);
        this.onlineUsers$.next(set);
      });
    });

    // --- NOTIFICATION & SYSTEM EVENTS ---

    this.socket.on('newNotification', (notification: NotificationData) => {
      this.zone.run(() => {
        const current = this.notificationsSource.value;
        this.notificationsSource.next([notification, ...current]);
        this.showToast(notification);
      });
    });

    this.socket.on('initialNotifications', (data: { notifications: NotificationData[] }) => {
      this.zone.run(() => {
        this.notificationsSource.next(data.notifications);
      });
    });

    this.socket.on('notificationRead', (data: { notificationId: string }) => {
      this.zone.run(() => {
        const current = this.notificationsSource.value;
        const updated = current.map(n =>
          n._id === data.notificationId ? { ...n, isRead: true } : n
        );
        this.notificationsSource.next(updated);
      });
    });

    this.socket.on('newAnnouncement', (payload: { data: AnnouncementData }) => {
      this.zone.run(() => {
        if (payload?.data) {
          this.announcement$.next(payload.data);
          this.showAnnouncementToast(payload.data);
        }
      });
    });

    this.socket.on('forceLogout', (data: { reason: string; timestamp: string }) => {
      this.zone.run(() => {
        this.forceLogout$.next(data);
        this.disconnect();
        console.warn('Force logout received:', data.reason);
      });
    });

    this.socket.on('systemStats', (stats: SystemStats) => {
      this.zone.run(() => this.systemStats$.next(stats));
    });

    this.socket.on('initialData', (data: any) => {
      this.zone.run(() => {
        if (data.channels) this.channels$.next(data.channels);
        console.log('📦 Initial Data Synced via Socket');
      });
    });
  }

  updateTheme(themeId: string) {
    this.socket?.emit('updateTheme', { themeId });
  }

  // ==========================================================================
  // 📤 PUBLIC API (ACTIONS)
  // ==========================================================================

  /**
   * ✅ HYBRID SEND MESSAGE: 
   * Uses HTTP for persistence, relies on Socket for broadcast.
   */
  sendMessage(payload: { channelId: string; body: string; attachments?: Attachment[]; tempId?: string }): Promise<Message> {
    const { channelId, body, attachments = [] } = payload;

    if (!channelId || (!body && !attachments.length)) {
      return Promise.reject(new Error('Invalid Payload'));
    }

    // Rate Limit Check
    if (!this.consumeBucket()) {
      return Promise.reject(new Error('Rate limit exceeded. Please slow down.'));
    }

    const httpPayload = { channelId, body, attachments };

    return lastValueFrom(
      this.http.post<Message>(`${environment.apiUrl}/v1/chat/messages`, httpPayload)
    );
  }

  createChannelHttp(name: string, type: any, members: string[] = []) {
    return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, { name, type, members });
  }

  leaveChannel(channelId: string) {
    return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/leave`, {});
  }

  addMember(channelId: string, userId: string) {
    return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/members`, { userId });
  }

  removeMember(channelId: string, userId: string) {
    return this.http.delete(`${environment.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`);
  }

  uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
  }

  // --- SOCKET-ONLY ACTIONS (Lightweight) ---

  joinChannel(channelId: string) {
    this.socket?.emit('joinChannel', { channelId });
  }

  getInitialData() {
    this.socket?.emit('getInitialData');
  }

  sendTyping(channelId: string, isTyping: boolean) {
    this.socket?.emit('typing', { channelId, typing: isTyping });
  }


  markRead(channelId: string, messageIds?: string[]) {
    // We also support HTTP mark read, but socket is faster for batch updates
    this.socket?.emit('markRead', { channelId, messageIds });
  }

  getSystemStats() {
    this.socket?.emit('admin:getStats');
  }

  forceDisconnectUser(targetUserId: string) {
    this.socket?.emit('admin:forceDisconnect', { targetUserId });
  }

  createAnnouncement(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetOrgId?: string) {
    const orgId = targetOrgId || this.orgId;
    if (!orgId) return;
    this.socket?.emit('createAnnouncement', { title, message, type, targetOrgId: orgId });
  }

  sendNotification(recipientId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', metadata?: any) {
    this.socket?.emit('sendNotification', { recipientId, title, message, type, metadata });
  }

  markNotificationRead(notificationId: string) {
    this.socket?.emit('markNotificationRead', { notificationId });
  }

  // --- HTTP FETCHERS ---

  listChannels() {
    return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
  }

  setChannels(channels: Channel[]) {
    this.channels$.next(channels);
  }

  fetchMessagesHttp(channelId: string, before?: string, limit = 50) {
    const params: any = { limit };
    if (before) params.before = before;
    return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
  }

  deleteMessage(messageId: string) {
    return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
  }

  editMessage(messageId: string, body: string) {
    return this.http.patch<Message>(`${environment.apiUrl}/v1/chat/messages/${messageId}`, { body });
  }

  getNotificationsHttp() {
    return this.http.get<NotificationData[]>(`${environment.apiUrl}/v1/notifications`);
  }

  // ==========================================================================
  // 🛠️ UTILITIES
  // ==========================================================================

  private handleReconnect(orgId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.messageService.showError('Unable to reconnect to server');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    if (this.reconnectSub) this.reconnectSub.unsubscribe();

    this.reconnectSub = timer(delay).subscribe(() => {
      if (this.token && this.orgId && this.userId) {
        this.connect(this.token, this.orgId, this.userId);
      }
    });
  }

  private startPingInterval() {
    if (this.pingInterval) clearInterval(this.pingInterval);

    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        const timeSinceLastPong = Date.now() - this.lastPongTime;

        if (this.lastPongTime > 0 && timeSinceLastPong > 30000) {
          console.warn(`⚠️ Connection unstable: No pong for ${Math.floor(timeSinceLastPong / 1000)}s`);
          this.zone.run(() => this.connectionHealth$.next('poor'));
        }

        this.socket.emit('ping');
      }
    }, 15000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Rate Limiting Methods
  private startBucketRefill() {
    if (this.bucketRefillSub) return;
    this.bucketRefillSub = timer(0, this.bucketRefillIntervalMs).subscribe(() => {
      this.bucketTokens = Math.min(this.bucketCapacity, this.bucketTokens + 1);
    });
  }

  private stopBucketRefill() {
    this.bucketRefillSub?.unsubscribe();
    this.bucketRefillSub = null;
  }

  private consumeBucket(): boolean {
    if (this.bucketTokens <= 0) return false;
    this.bucketTokens--;
    return true;
  }

  private flushQueue() {
    if (!this.socket?.connected) return;

    while (this.outboundQueue.length > 0) {
      const item = this.outboundQueue.shift();
      if (item) {
        this.socket.emit(item.event, item.payload);
      }
    }
  }

  disconnect() {
    this.stopPingInterval();
    this.stopBucketRefill();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionStatus$.next('disconnected');
    this.socketId$.next(null);
    if (this.reconnectSub) {
      this.reconnectSub.unsubscribe();
      this.reconnectSub = null;
    }
  }

  private showToast(notification: NotificationData) {
    switch (notification.type) {
      case 'success': this.messageService.showSuccess(`${notification.title}, ${notification.message}`); break;
      case 'error': this.messageService.showError(`${notification.title}, ${notification.message}`); break;
      case 'warning': this.messageService.showWarn(`${notification.title}, ${notification.message}`); break;
      case 'urgent': this.messageService.showError(`${notification.title}, ${notification.message}`); break;
      default: this.messageService.showInfo(`${notification.title}, ${notification.message}`); break;
    }
  }

  private showAnnouncementToast(announcement: AnnouncementData) {
    // const message = `${announcement.title}: ${announcement.message}`;
    switch (announcement.type) {
      case 'success': this.messageService.showSuccess(`${announcement.title}, ${announcement.message}`); break;
      case 'warning': this.messageService.showWarn(`${announcement.title}, ${announcement.message}`); break;
      case 'error': this.messageService.showError(`${announcement.title}, ${announcement.message}`); break;
      default: this.messageService.showInfo(`${announcement.title}, ${announcement.message}`); break;
    }
  }

  ngOnDestroy() {
    this.disconnect();
    this.connectionStatus$.complete();
    this.socketId$.complete();
    this.messages$.complete();
    this.messagesBatch$.complete();
    this.channels$.complete();
    this.channelUsers$.complete();
    this.onlineUsers$.complete();
    this.typing$.complete();
    this.messageEdited$.complete();
    this.messageDeleted$.complete();
    this.readReceipt$.complete();
    this.channelCreated$.complete();
    this.channelUpdated$.complete();
    this.channelActivity$.complete();
    this.notificationsSource.complete();
    this.announcement$.complete();
    this.forceLogout$.complete();
    this.systemStats$.complete();
    this.connectionEstablished$.complete();
    this.connectionHealth$.complete();
  }
}
