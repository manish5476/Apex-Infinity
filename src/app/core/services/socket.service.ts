import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { BehaviorSubject, Subject, Observable, timer, Subscription, map, distinctUntilChanged, shareReplay, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppMessageService } from './message.service';
import { AuthService } from '../../modules/auth/services/auth-service';

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
  
  public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
  public onlineUsersList$: Observable<OnlineUser[]> = this.onlineUsers$.pipe(
    map(users => Array.from(users).map(userId => ({ userId }))),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
    shareReplay(1)
  );
  
  public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean; timestamp?: string }>();
  
  // Message events
  public messageEdited$ = new Subject<Message>();
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
            error: () => {
              this.disconnect();
              this.messageService.showError('Session Expired', 'Please login again.');
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

    this.socket.on('messageDeleted', (data: any) => {
      this.zone.run(() => {
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

    this.socket.on('readReceipt', (data: { userId: string; channelId: string; messageIds: string[] | null; timestamp: string }) => {
      this.zone.run(() => this.readReceipt$.next(data));
    });

    // --- CHANNEL & PRESENCE EVENTS ---

    this.socket.on('channelCreated', (channel: Channel) => {
      this.zone.run(() => {
        const current = this.channels$.value;
        // ✅ FIX: Duplicate Check prevents double entry when creator receives own socket event
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

    // this.socket.on('addMember', (data: { channelId: string }) => {
    //   this.zone.run(() => {
    //     // 1. Remove channel from the list
    //     const currentChannels = this.channels$.value;
    //     const updatedChannels = currentChannels.filter(c => c._id !== data.channelId);
    //     this.channels$.next(updatedChannels);

    //     // 2. Clear messages for that channel from memory
    //     const currentMessages = this.messagesBatch$.value;
    //     const updatedMessages = currentMessages.filter(m => m.channelId !== data.channelId);
    //     this.messagesBatch$.next(updatedMessages);

    //     console.log(`🚫 You were removed from channel ${data.channelId}`);
    //   });
    // });
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

  // ==========================================================================
  // 📤 PUBLIC API (ACTIONS)
  // ==========================================================================

  /**
   * ✅ HYBRID SEND MESSAGE: 
   * Uses HTTP for persistence, relies on Socket for broadcast.
   * Updated to accept an object to match component call signature.
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
    
    // Uses HTTP POST to backend controller
    return lastValueFrom(
      this.http.post<Message>(`${environment.apiUrl}/v1/chat/messages`, httpPayload)
    );
  }

  /**
   * ✅ HTTP: Create Channel
   */
  createChannelHttp(name: string, type: any, members: string[] = []) {
    return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, { name, type, members });
  }

  /**
   * ✅ HTTP: Leave Channel
   */
  leaveChannel(channelId: string) {
    return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/leave`, {});
  }

  /**
   * ✅ HTTP: Add Member
   */
  addMember(channelId: string, userId: string) {
    return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/members`, { userId });
  }

  /**
   * ✅ HTTP: Remove Member (Kick)
   */
  removeMember(channelId: string, userId: string) {
    return this.http.delete(`${environment.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`);
  }

  /**
   * ✅ HTTP: Upload File
   */
  uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
  }

  // --- SOCKET-ONLY ACTIONS (Lightweight) ---

  joinChannel(channelId: string) {
    this.socket?.emit('joinChannel', { channelId });
  }

  // ✅ ADDED THIS METHOD TO FIX ERROR
  getInitialData() {
    this.socket?.emit('getInitialData');
  }

  sendTyping(channelId: string, isTyping: boolean) {
    this.socket?.emit('typing', { channelId, typing: isTyping });
  }

  markRead(channelId: string, messageIds?: string[]) {
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

  // --- HTTP FETCHERS (Standard REST) ---

  listChannels() {
    return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
  }

  // ✅ ADDED THIS METHOD TO FIX ERROR
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
      this.messageService.showError('Connection Lost', 'Unable to reconnect to server');
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
    this.stopBucketRefill(); // ✅ Added cleanup for bucket
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

  // --- Toast Helpers ---

  private showToast(notification: NotificationData) {
    switch (notification.type) {
      case 'success':
        this.messageService.showSuccess(notification.title, notification.message);
        break;
      case 'error':
        this.messageService.showError(notification.title, notification.message);
        break;
      case 'warning':
        this.messageService.showWarn(notification.title, notification.message);
        break;
      case 'urgent':
        this.messageService.showError(notification.title, notification.message, 1000);
        break;
      default:
        this.messageService.showInfo(notification.title, notification.message);
        break;
    }
  }

  private showAnnouncementToast(announcement: AnnouncementData) {
    const message = `${announcement.title}: ${announcement.message}`;
    switch (announcement.type) {
      case 'success': this.messageService.showSuccess('Announcement', message, 8000); break;
      case 'warning': this.messageService.showWarn('Announcement', message, 8000); break;
      case 'error': this.messageService.showError('Announcement', message, 8000); break;
      default: this.messageService.showInfo('Announcement', message, 8000); break;
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

// import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
// import { BehaviorSubject, Subject, Observable, timer, Subscription, map, distinctUntilChanged, shareReplay, lastValueFrom } from 'rxjs';
// import { environment } from '../../../environments/environment';
// import { AppMessageService } from './message.service';
// import { AuthService } from '../../modules/auth/services/auth-service';

// // --- INTERFACES ---

// export interface Attachment { 
//   name: string;
//   url: string;
//   type: string;
//   size?: number;
//   publicId?: string;
// }

// export interface Message {
//   _id?: string;
//   channelId: string;
//   senderId?: any; // populated object or string ID
//   body?: string;
//   attachments?: Attachment[];
//   createdAt?: string;
//   deleted?: boolean;
//   read?: boolean;
//   readBy?: string[];
//   editedAt?: string;
//   editedBy?: string;
// }

// export type ChatMessage = Message;

// export interface Channel {
//   _id: string;
//   name?: string;
//   type?: 'public' | 'private' | 'dm';
//   members?: string[];
//   isActive?: boolean;
//   organizationId?: string;
//   createdBy?: string;
//   createdAt?: string;
// }

// export interface NotificationData {
//   _id?: string;
//   title: string;
//   message: string;
//   type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
//   isRead?: boolean;
//   createdAt?: string;
//   metadata?: any;
//   recipientId?: string;
//   createdBy?: string;
//   readAt?: string;
//   readBy?: string;
// }

// export interface AnnouncementData {
//   _id?: string;
//   title: string;
//   message: string;
//   type?: 'info' | 'success' | 'warning' | 'error';
//   senderId?: any;
//   organizationId?: string;
//   createdAt?: string;
// }

// export interface OnlineUser {
//   userId: string;
//   organizationId?: string;
//   timestamp?: string;
// }

// export interface SystemStats {
//   connectedUsers: number;
//   orgOnlineUsers: number;
//   channelPresence: number;
//   totalConnections: number;
//   timestamp: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class SocketService implements OnDestroy {
//   private http = inject(HttpClient);
//   private zone = inject(NgZone);
//   private authService = inject(AuthService);
//   private messageService = inject(AppMessageService);

//   private socket: Socket | null = null;
//   private readonly url = environment.socketUrl; 
//   private token: string | null = null;
//   private userId: string | null = null;
//   private orgId: string | null = null;

//   // --- STATE STREAMS (Chat) ---
//   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
//   public socketId$ = new BehaviorSubject<string | null>(null);
  
//   public messages$ = new Subject<Message>();
//   public messagesBatch$ = new BehaviorSubject<Message[]>([]); 
  
//   public channels$ = new BehaviorSubject<Channel[]>([]);
//   public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  
//   public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
//   public onlineUsersList$: Observable<OnlineUser[]> = this.onlineUsers$.pipe(
//     map(users => Array.from(users).map(userId => ({ userId }))),
//     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
//     shareReplay(1)
//   );
  
//   public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean; timestamp?: string }>();
  
//   // Message events
//   public messageEdited$ = new Subject<Message>();
//   public messageDeleted$ = new Subject<{ messageId: string; channelId: string; deletedBy: string; timestamp: string }>();
//   public readReceipt$ = new Subject<{ userId: string; channelId: string; messageIds: string[] | null; timestamp: string }>();

//   // Channel events
//   public channelCreated$ = new Subject<Channel>();
//   public channelUpdated$ = new Subject<Channel>();
//   public channelActivity$ = new Subject<{ channelId: string; lastMessage: any }>();

//   // --- STATE STREAMS (Notifications) ---
//   private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
//   public notifications$ = this.notificationsSource.asObservable();
//   public unreadCount$ = this.notifications$.pipe(
//     map(notifications => notifications.filter(n => !n.isRead).length),
//     distinctUntilChanged()
//   );
//   public messageSent$ = new Subject<any>();
//   // Announcements
//   public announcement$ = new Subject<AnnouncementData>();

//   // System events
//   public forceLogout$ = new Subject<{ reason: string; timestamp: string }>();
//   public systemStats$ = new Subject<SystemStats>();
//   public connectionEstablished$ = new Subject<{ userId: string; socketId: string; timestamp: string }>();

//   // Reconnect Logic
//   private reconnectAttempts = 0;
//   private maxReconnectAttempts = 10;
//   private reconnectSub: Subscription | null = null;
//   private pingInterval: any = null;

//   // Rate Limiting (Token Bucket)
//   private bucketTokens = 20;
//   private bucketCapacity = 20;
//   private bucketRefillIntervalMs = 1000;
//   private bucketRefillSub: Subscription | null = null;

//   // Internal Queue & Health
//   private outboundQueue: Array<{ event: string; payload: any }> = [];
//   private maxQueueSize = 100;
//   private lastPongTime: number = 0;
//   public connectionHealth$ = new BehaviorSubject<'healthy' | 'degraded' | 'poor'>('healthy');

//   constructor() {
//     this.startBucketRefill();
//   }

//   /**
//    * Initialize Socket
//    */
//   connect(token: string, orgId: string, userId: string) {
//     this.token = token;
//     this.orgId = orgId;
//     this.userId = userId;
    
//     // Prevent double connection
//     if (this.socket?.connected) {
//       console.log('Socket already connected');
//       return;
//     }

//     const opts: Partial<ManagerOptions & SocketOptions> = {
//       transports: ['websocket', 'polling'],
//       auth: { token },
//       reconnection: false, // We handle reconnection manually for better control
//       withCredentials: true,
//       timeout: 30000,
//       forceNew: false,
//       autoConnect: true
//     };

//     try {
//       if (this.socket) {
//         this.socket.removeAllListeners();
//         this.socket.disconnect();
//       }

//       this.socket = io(this.url, opts);
      
//       // ✅ Reset the pong timer immediately upon attempting connection
//       this.lastPongTime = Date.now(); 

//       this.setupListeners(orgId);
//       this.startPingInterval();

//     } catch (err) {
//       console.error('Socket Init Failed:', err);
//       this.handleReconnect(orgId);
//     }
//   }

//   private setupListeners(orgId: string) {
//     if (!this.socket) return;

//     // --- CONNECTION EVENTS ---

//     this.socket.on('connect', () => {
//       console.log('✅ Chat Socket Connected');
//       this.zone.run(() => {
//         this.connectionStatus$.next('connected');
//         this.reconnectAttempts = 0;
        
//         // ✅ Reset pong time on confirmed connection
//         this.lastPongTime = Date.now(); 
//         this.connectionHealth$.next('healthy');

//         this.flushQueue();

//         this.socket?.emit('joinOrg', { organizationId: orgId });
//         this.socket?.emit('subscribeNotifications');
//         this.getInitialData();
//       });
//     });

//     this.socket.on('connect_error', (error: any) => {
//       console.error('💬 Chat Socket Error:', error.message);

//       if (error.data?.code === 'TOKEN_EXPIRED') {
//         this.zone.run(() => {
//           this.connectionStatus$.next('reconnecting');
          
//           // Silent Token Refresh
//           this.authService.refreshToken().subscribe({
//             next: (res: any) => {
//               this.token = res.token;
//               if (this.socket) {
//                 this.socket.auth = { token: res.token };
//                 this.socket.connect();
//               }
//             },
//             error: () => {
//               this.disconnect();
//               this.messageService.showError('Session Expired', 'Please login again.');
//             }
//           });
//         });
//       } else {
//         this.zone.run(() => {
//           this.connectionStatus$.next('disconnected');
//           this.handleReconnect(orgId);
//         });
//       }
//     });

//     this.socket.on('disconnect', (reason: string) => {
//       console.log('Socket Disconnected:', reason);
//       this.zone.run(() => {
//         this.connectionStatus$.next('disconnected');
//         this.socketId$.next(null);
//         if (reason !== 'io client disconnect') this.handleReconnect(orgId);
//       });
//     });

//     this.socket.on('connectionEstablished', (data: { userId: string; socketId: string; timestamp: string }) => {
//       this.zone.run(() => this.connectionEstablished$.next(data));
//     });

//     this.socket.on('pong', (data: { timestamp: string }) => {
//       this.lastPongTime = Date.now();
//       const latency = Date.now() - new Date(data.timestamp).getTime();
      
//       if (latency < 100) this.connectionHealth$.next('healthy');
//       else if (latency < 500) this.connectionHealth$.next('degraded');
//       else this.connectionHealth$.next('poor');
//     });

//     // --- MESSAGE EVENTS ---

//     this.socket.on('newMessage', (msg: Message) => {
//       this.zone.run(() => {
//         this.messages$.next(msg);
//         const currentBatch = this.messagesBatch$.value;
//         const exists = currentBatch.some(m => m._id === msg._id);
        
//         if (!exists) {
//           this.messagesBatch$.next([...currentBatch, msg]);
//         }
//       });
//     });

//     this.socket.on('messageEdited', (msg: Message) => {
//       this.zone.run(() => {
//         this.messageEdited$.next(msg);
//         const batch = this.messagesBatch$.value;
//         const updatedBatch = batch.map(m => m._id === msg._id ? msg : m);
//         this.messagesBatch$.next(updatedBatch);
//       });
//     });

//     this.socket.on('messageDeleted', (data: any) => {
//       this.zone.run(() => {
//         this.messageDeleted$.next(data);
//         const updated = this.messagesBatch$.value.map(m => 
//           m._id === data.messageId ? { ...m, body: '', attachments: [], deleted: true } : m
//         );
//         this.messagesBatch$.next(updated);
//       });
//     });
    
//     this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => {
//       this.zone.run(() => {
//         const current = this.messagesBatch$.value;
//         const existingIds = new Set(current.map(m => m._id));
//         const newMessages = payload.messages.reverse().filter(m => !existingIds.has(m._id));
//         this.messagesBatch$.next([...newMessages, ...current]);
//       });
//     });

//     this.socket.on('userTyping', (data: { userId: string; channelId: string; typing: boolean; timestamp?: string }) => {
//       this.zone.run(() => this.typing$.next(data));
//     });

//     this.socket.on('readReceipt', (data: { userId: string; channelId: string; messageIds: string[] | null; timestamp: string }) => {
//       this.zone.run(() => this.readReceipt$.next(data));
//     });

//     // --- CHANNEL & PRESENCE EVENTS ---

//     this.socket.on('channelCreated', (channel: Channel) => {
//       this.zone.run(() => {
//         const current = this.channels$.value;
//         // ✅ FIX: Duplicate Check prevents double entry when creator receives own socket event
//         const exists = current.some(c => c._id === channel._id);
        
//         if (!exists) {
//             this.channelCreated$.next(channel);
//             this.channels$.next([channel, ...current]);
//             console.log(`🔔 New channel received: #${channel.name}`);
//         }
//       });
//     });

//     this.socket.on('channelUpdated', (channel: Channel) => {
//       this.zone.run(() => {
//         this.channelUpdated$.next(channel);
//         const current = this.channels$.value;
//         const updated = current.map(c => c._id === channel._id ? channel : c);
//         this.channels$.next(updated);
//       });
//     });

//     this.socket.on('removedFromChannel', (data: { channelId: string }) => {
//       this.zone.run(() => {
//         // 1. Remove channel from the list
//         const currentChannels = this.channels$.value;
//         const updatedChannels = currentChannels.filter(c => c._id !== data.channelId);
//         this.channels$.next(updatedChannels);

//         // 2. Clear messages for that channel from memory
//         const currentMessages = this.messagesBatch$.value;
//         const updatedMessages = currentMessages.filter(m => m.channelId !== data.channelId);
//         this.messagesBatch$.next(updatedMessages);

//         console.log(`🚫 You were removed from channel ${data.channelId}`);
//       });
//     });

//     this.socket.on('channelUsers', (data: { channelId: string; users: string[] }) => {
//       this.zone.run(() => {
//         const current = this.channelUsers$.value;
//         this.channelUsers$.next({ ...current, [data.channelId]: data.users });
//       });
//     });

//     this.socket.on('userJoinedChannel', (data: { channelId: string; userId: string }) => {
//       this.zone.run(() => {
//         const current = this.channelUsers$.value;
//         const users = current[data.channelId] || [];
//         if (!users.includes(data.userId)) {
//           this.channelUsers$.next({ ...current, [data.channelId]: [...users, data.userId] });
//         }
//       });
//     });

//     this.socket.on('userLeftChannel', (data: { channelId: string; userId: string }) => {
//       this.zone.run(() => {
//         const current = this.channelUsers$.value;
//         const users = current[data.channelId] || [];
//         this.channelUsers$.next({ ...current, [data.channelId]: users.filter(u => u !== data.userId) });
//       });
//     });

//     this.socket.on('userOnline', (data: OnlineUser) => {
//       this.zone.run(() => {
//         const set = new Set(this.onlineUsers$.value);
//         set.add(data.userId);
//         this.onlineUsers$.next(set);
//       });
//     });

//     this.socket.on('userOffline', (data: OnlineUser) => {
//       this.zone.run(() => {
//         const set = new Set(this.onlineUsers$.value);
//         set.delete(data.userId);
//         this.onlineUsers$.next(set);
//       });
//     });

//     this.socket.on('orgOnlineUsers', (data: { organizationId: string; users: string[] }) => {
//       this.zone.run(() => {
//         const set = new Set(data.users);
//         this.onlineUsers$.next(set);
//       });
//     });

//     // --- NOTIFICATION & SYSTEM EVENTS ---

//     this.socket.on('newNotification', (notification: NotificationData) => {
//       this.zone.run(() => {
//         const current = this.notificationsSource.value;
//         this.notificationsSource.next([notification, ...current]);
//         this.showToast(notification);
//       });
//     });

//     this.socket.on('initialNotifications', (data: { notifications: NotificationData[] }) => {
//       this.zone.run(() => {
//         this.notificationsSource.next(data.notifications);
//       });
//     });

//     this.socket.on('notificationRead', (data: { notificationId: string }) => {
//       this.zone.run(() => {
//         const current = this.notificationsSource.value;
//         const updated = current.map(n => 
//           n._id === data.notificationId ? { ...n, isRead: true } : n
//         );
//         this.notificationsSource.next(updated);
//       });
//     });

//     this.socket.on('newAnnouncement', (payload: { data: AnnouncementData }) => {
//       this.zone.run(() => {
//         if (payload?.data) {
//           this.announcement$.next(payload.data);
//           this.showAnnouncementToast(payload.data);
//         }
//       });
//     });

//     this.socket.on('forceLogout', (data: { reason: string; timestamp: string }) => {
//       this.zone.run(() => {
//         this.forceLogout$.next(data);
//         this.disconnect();
//         console.warn('Force logout received:', data.reason);
//       });
//     });

//     this.socket.on('systemStats', (stats: SystemStats) => {
//       this.zone.run(() => this.systemStats$.next(stats));
//     });

//     this.socket.on('initialData', (data: any) => {
//       this.zone.run(() => {
//         if (data.channels) this.channels$.next(data.channels);
//         console.log('📦 Initial Data Synced via Socket');
//       });
//     });
//   }

//   // ==========================================================================
//   // 📤 PUBLIC API (ACTIONS)
//   // ==========================================================================

//   /**
//    * ✅ HYBRID SEND MESSAGE: 
//    * Uses HTTP for persistence, relies on Socket for broadcast.
//    * Updated to accept an object to match component call signature.
//    */
//   sendMessage(payload: { channelId: string; body: string; attachments?: Attachment[]; tempId?: string }): Promise<Message> {
//     const { channelId, body, attachments = [] } = payload;
    
//     if (!channelId || (!body && !attachments.length)) {
//         return Promise.reject(new Error('Invalid Payload'));
//     }

//     // Rate Limit Check
//     if (!this.consumeBucket()) {
//       return Promise.reject(new Error('Rate limit exceeded. Please slow down.'));
//     }

//     const httpPayload = { channelId, body, attachments };
    
//     // Uses HTTP POST to backend controller
//     return lastValueFrom(
//       this.http.post<Message>(`${environment.apiUrl}/v1/chat/messages`, httpPayload)
//     );
//   }

//   /**
//    * ✅ HTTP: Create Channel
//    */
//   createChannelHttp(name: string, type: any, members: string[] = []) {
//     return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, { name, type, members });
//   }

//   /**
//    * ✅ HTTP: Leave Channel
//    */
//   leaveChannel(channelId: string) {
//     return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/leave`, {});
//   }

//   /**
//    * ✅ HTTP: Add Member
//    */
//   addMember(channelId: string, userId: string) {
//     return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/members`, { userId });
//   }

//   /**
//    * ✅ HTTP: Remove Member (Kick)
//    */
//   removeMember(channelId: string, userId: string) {
//     return this.http.delete(`${environment.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`);
//   }

//   /**
//    * ✅ HTTP: Upload File
//    */
//   uploadAttachment(file: File) {
//     const formData = new FormData();
//     formData.append('file', file);
//     return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
//   }

//   // --- SOCKET-ONLY ACTIONS (Lightweight) ---

//   joinChannel(channelId: string) {
//     this.socket?.emit('joinChannel', { channelId });
//   }

//   // ✅ ADDED THIS METHOD TO FIX ERROR
//   getInitialData() {
//     this.socket?.emit('getInitialData');
//   }

//   sendTyping(channelId: string, isTyping: boolean) {
//     this.socket?.emit('typing', { channelId, typing: isTyping });
//   }

//   markRead(channelId: string, messageIds?: string[]) {
//     this.socket?.emit('markRead', { channelId, messageIds });
//   }

//   getSystemStats() {
//     this.socket?.emit('admin:getStats');
//   }

//   forceDisconnectUser(targetUserId: string) {
//     this.socket?.emit('admin:forceDisconnect', { targetUserId });
//   }

//   createAnnouncement(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetOrgId?: string) {
//     const orgId = targetOrgId || this.orgId;
//     if (!orgId) return;
//     this.socket?.emit('createAnnouncement', { title, message, type, targetOrgId: orgId });
//   }

//   sendNotification(recipientId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', metadata?: any) {
//     this.socket?.emit('sendNotification', { recipientId, title, message, type, metadata });
//   }

//   markNotificationRead(notificationId: string) {
//     this.socket?.emit('markNotificationRead', { notificationId });
//   }

//   // --- HTTP FETCHERS (Standard REST) ---

//   listChannels() {
//     return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
//   }

//   // ✅ ADDED THIS METHOD TO FIX ERROR
//   setChannels(channels: Channel[]) {
//     this.channels$.next(channels);
//   }

//   fetchMessagesHttp(channelId: string, before?: string, limit = 50) {
//     const params: any = { limit };
//     if (before) params.before = before;
//     return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
//   }

//   deleteMessage(messageId: string) {
//     return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
//   }

//   editMessage(messageId: string, body: string) {
//     return this.http.patch<Message>(`${environment.apiUrl}/v1/chat/messages/${messageId}`, { body });
//   }

//   getNotificationsHttp() {
//     return this.http.get<NotificationData[]>(`${environment.apiUrl}/v1/notifications`);
//   }

//   // ==========================================================================
//   // 🛠️ UTILITIES
//   // ==========================================================================

//   private handleReconnect(orgId: string) {
//     if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//       console.error('Max reconnection attempts reached');
//       this.messageService.showError('Connection Lost', 'Unable to reconnect to server');
//       return;
//     }
    
//     this.reconnectAttempts++;
//     const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
//     if (this.reconnectSub) this.reconnectSub.unsubscribe();
    
//     this.reconnectSub = timer(delay).subscribe(() => {
//       if (this.token && this.orgId && this.userId) {
//         this.connect(this.token, this.orgId, this.userId);
//       }
//     });
//   }

//   private startPingInterval() {
//     if (this.pingInterval) clearInterval(this.pingInterval);
    
//     this.pingInterval = setInterval(() => {
//       if (this.socket?.connected) {
//         const timeSinceLastPong = Date.now() - this.lastPongTime;
        
//         if (this.lastPongTime > 0 && timeSinceLastPong > 30000) {
//           console.warn(`⚠️ Connection unstable: No pong for ${Math.floor(timeSinceLastPong / 1000)}s`);
//           this.zone.run(() => this.connectionHealth$.next('poor'));
//         }

//         this.socket.emit('ping');
//       }
//     }, 15000);
//   }

//   private stopPingInterval() {
//     if (this.pingInterval) {
//       clearInterval(this.pingInterval);
//       this.pingInterval = null;
//     }
//   }

//   // Rate Limiting Methods
//   private startBucketRefill() {
//     if (this.bucketRefillSub) return;
//     this.bucketRefillSub = timer(0, this.bucketRefillIntervalMs).subscribe(() => {
//       this.bucketTokens = Math.min(this.bucketCapacity, this.bucketTokens + 1);
//     });
//   }

//   private stopBucketRefill() {
//     this.bucketRefillSub?.unsubscribe();
//     this.bucketRefillSub = null;
//   }

//   private consumeBucket(): boolean {
//     if (this.bucketTokens <= 0) return false;
//     this.bucketTokens--;
//     return true;
//   }

//   private flushQueue() {
//     if (!this.socket?.connected) return;
    
//     while (this.outboundQueue.length > 0) {
//       const item = this.outboundQueue.shift();
//       if (item) {
//         this.socket.emit(item.event, item.payload);
//       }
//     }
//   }

//   disconnect() {
//     this.stopPingInterval();
//     this.stopBucketRefill(); // ✅ Added cleanup for bucket
//     if (this.socket) {
//       this.socket.removeAllListeners();
//       this.socket.disconnect();
//       this.socket = null;
//     }
    
//     this.connectionStatus$.next('disconnected');
//     this.socketId$.next(null);
//     if (this.reconnectSub) {
//       this.reconnectSub.unsubscribe();
//       this.reconnectSub = null;
//     }
//   }

//   // --- Toast Helpers ---

//   private showToast(notification: NotificationData) {
//     switch (notification.type) {
//       case 'success':
//         this.messageService.showSuccess(notification.title, notification.message);
//         break;
//       case 'error':
//         this.messageService.showError(notification.title, notification.message);
//         break;
//       case 'warning':
//         this.messageService.showWarn(notification.title, notification.message);
//         break;
//       case 'urgent':
//         this.messageService.showError(notification.title, notification.message, 1000);
//         break;
//       default:
//         this.messageService.showInfo(notification.title, notification.message);
//         break;
//     }
//   }

//   private showAnnouncementToast(announcement: AnnouncementData) {
//     const message = `${announcement.title}: ${announcement.message}`;
//     switch (announcement.type) {
//       case 'success': this.messageService.showSuccess('Announcement', message, 8000); break;
//       case 'warning': this.messageService.showWarn('Announcement', message, 8000); break;
//       case 'error': this.messageService.showError('Announcement', message, 8000); break;
//       default: this.messageService.showInfo('Announcement', message, 8000); break;
//     }
//   }

//   ngOnDestroy() {
//     this.disconnect();
//     this.connectionStatus$.complete();
//     this.socketId$.complete();
//     this.messages$.complete();
//     this.messagesBatch$.complete();
//     this.channels$.complete();
//     this.channelUsers$.complete();
//     this.onlineUsers$.complete();
//     this.typing$.complete();
//     this.messageEdited$.complete();
//     this.messageDeleted$.complete();
//     this.readReceipt$.complete();
//     this.channelCreated$.complete();
//     this.channelUpdated$.complete();
//     this.channelActivity$.complete();
//     this.notificationsSource.complete();
//     this.announcement$.complete();
//     this.forceLogout$.complete();
//     this.systemStats$.complete();
//     this.connectionEstablished$.complete();
//     this.connectionHealth$.complete();
//   }
// }

// // import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
// // import { HttpClient } from '@angular/common/http';
// // import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
// // import { BehaviorSubject, Subject, Observable, timer, Subscription, map, distinctUntilChanged, shareReplay, lastValueFrom } from 'rxjs';
// // import { environment } from '../../../environments/environment';
// // import { AppMessageService } from './message.service';
// // import { AuthService } from '../../modules/auth/services/auth-service';

// // // --- INTERFACES ---

// // export interface Attachment { 
// //   name: string;
// //   url: string;
// //   type: string;
// //   size?: number;
// //   publicId?: string;
// // }

// // export interface Message {
// //   _id?: string;
// //   channelId: string;
// //   senderId?: any; // populated object or string ID
// //   body?: string;
// //   attachments?: Attachment[];
// //   createdAt?: string;
// //   deleted?: boolean;
// //   read?: boolean;
// //   readBy?: string[];
// //   editedAt?: string;
// //   editedBy?: string;
// // }

// // export type ChatMessage = Message;

// // export interface Channel {
// //   _id: string;
// //   name?: string;
// //   type?: 'public' | 'private' | 'dm';
// //   members?: string[];
// //   isActive?: boolean;
// //   organizationId?: string;
// //   createdBy?: string;
// //   createdAt?: string;
// // }

// // export interface NotificationData {
// //   _id?: string;
// //   title: string;
// //   message: string;
// //   type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
// //   isRead?: boolean;
// //   createdAt?: string;
// //   metadata?: any;
// //   recipientId?: string;
// //   createdBy?: string;
// //   readAt?: string;
// //   readBy?: string;
// // }

// // export interface AnnouncementData {
// //   _id?: string;
// //   title: string;
// //   message: string;
// //   type?: 'info' | 'success' | 'warning' | 'error';
// //   senderId?: any;
// //   organizationId?: string;
// //   createdAt?: string;
// // }

// // export interface OnlineUser {
// //   userId: string;
// //   organizationId?: string;
// //   timestamp?: string;
// // }

// // export interface SystemStats {
// //   connectedUsers: number;
// //   orgOnlineUsers: number;
// //   channelPresence: number;
// //   totalConnections: number;
// //   timestamp: string;
// // }

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class SocketService implements OnDestroy {
// //   private http = inject(HttpClient);
// //   private zone = inject(NgZone);
// //   private authService = inject(AuthService);
// //   private messageService = inject(AppMessageService);

// //   private socket: Socket | null = null;
// //   private readonly url = environment.socketUrl; 
// //   private token: string | null = null;
// //   private userId: string | null = null;
// //   private orgId: string | null = null;

// //   // --- STATE STREAMS (Chat) ---
// //   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
// //   public socketId$ = new BehaviorSubject<string | null>(null);
  
// //   public messages$ = new Subject<Message>();
// //   public messagesBatch$ = new BehaviorSubject<Message[]>([]); 
  
// //   public channels$ = new BehaviorSubject<Channel[]>([]);
// //   public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  
// //   public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
// //   public onlineUsersList$: Observable<OnlineUser[]> = this.onlineUsers$.pipe(
// //     map(users => Array.from(users).map(userId => ({ userId }))),
// //     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
// //     shareReplay(1)
// //   );
  
// //   public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean; timestamp?: string }>();
  
// //   // Message events
// //   public messageEdited$ = new Subject<Message>();
// //   public messageDeleted$ = new Subject<{ messageId: string; channelId: string; deletedBy: string; timestamp: string }>();
// //   public readReceipt$ = new Subject<{ userId: string; channelId: string; messageIds: string[] | null; timestamp: string }>();

// //   // Channel events
// //   public channelCreated$ = new Subject<Channel>();
// //   public channelUpdated$ = new Subject<Channel>();
// //   public channelActivity$ = new Subject<{ channelId: string; lastMessage: any }>();

// //   // --- STATE STREAMS (Notifications) ---
// //   private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
// //   public notifications$ = this.notificationsSource.asObservable();
// //   public unreadCount$ = this.notifications$.pipe(
// //     map(notifications => notifications.filter(n => !n.isRead).length),
// //     distinctUntilChanged()
// //   );
// //   public messageSent$ = new Subject<any>();
// //   // Announcements
// //   public announcement$ = new Subject<AnnouncementData>();

// //   // System events
// //   public forceLogout$ = new Subject<{ reason: string; timestamp: string }>();
// //   public systemStats$ = new Subject<SystemStats>();
// //   public connectionEstablished$ = new Subject<{ userId: string; socketId: string; timestamp: string }>();

// //   // Reconnect Logic
// //   private reconnectAttempts = 0;
// //   private maxReconnectAttempts = 10;
// //   private reconnectSub: Subscription | null = null;
// //   private pingInterval: any = null;

// //   // Internal Queue & Health
// //   private outboundQueue: Array<{ event: string; payload: any }> = [];
// //   private maxQueueSize = 100;
// //   private lastPongTime: number = 0;
// //   public connectionHealth$ = new BehaviorSubject<'healthy' | 'degraded' | 'poor'>('healthy');

// //   constructor() {}

// //   /**
// //    * Initialize Socket
// //    */
// //   connect(token: string, orgId: string, userId: string) {
// //     this.token = token;
// //     this.orgId = orgId;
// //     this.userId = userId;
    
// //     // Prevent double connection
// //     if (this.socket?.connected) {
// //       console.log('Socket already connected');
// //       return;
// //     }

// //     const opts: Partial<ManagerOptions & SocketOptions> = {
// //       transports: ['websocket', 'polling'],
// //       auth: { token },
// //       reconnection: false, // We handle reconnection manually for better control
// //       withCredentials: true,
// //       timeout: 30000,
// //       forceNew: false,
// //       autoConnect: true
// //     };

// //     try {
// //       if (this.socket) {
// //         this.socket.removeAllListeners();
// //         this.socket.disconnect();
// //       }

// //       this.socket = io(this.url, opts);
      
// //       // ✅ Reset the pong timer immediately upon attempting connection
// //       this.lastPongTime = Date.now(); 

// //       this.setupListeners(orgId);
// //       this.startPingInterval();

// //     } catch (err) {
// //       console.error('Socket Init Failed:', err);
// //       this.handleReconnect(orgId);
// //     }
// //   }

// //   private setupListeners(orgId: string) {
// //     if (!this.socket) return;

// //     // --- CONNECTION EVENTS ---

// //     this.socket.on('connect', () => {
// //       console.log('✅ Chat Socket Connected');
// //       this.zone.run(() => {
// //         this.connectionStatus$.next('connected');
// //         this.reconnectAttempts = 0;
        
// //         // ✅ Reset pong time on confirmed connection
// //         this.lastPongTime = Date.now(); 
// //         this.connectionHealth$.next('healthy');

// //         this.flushQueue();

// //         this.socket?.emit('joinOrg', { organizationId: orgId });
// //         this.socket?.emit('subscribeNotifications');
// //         this.getInitialData();
// //       });
// //     });

// //     this.socket.on('connect_error', (error: any) => {
// //       console.error('💬 Chat Socket Error:', error.message);

// //       if (error.data?.code === 'TOKEN_EXPIRED') {
// //         this.zone.run(() => {
// //           this.connectionStatus$.next('reconnecting');
          
// //           // Silent Token Refresh
// //           this.authService.refreshToken().subscribe({
// //             next: (res: any) => {
// //               this.token = res.token;
// //               if (this.socket) {
// //                 this.socket.auth = { token: res.token };
// //                 this.socket.connect();
// //               }
// //             },
// //             error: () => {
// //               this.disconnect();
// //               this.messageService.showError('Session Expired', 'Please login again.');
// //             }
// //           });
// //         });
// //       } else {
// //         this.zone.run(() => {
// //           this.connectionStatus$.next('disconnected');
// //           this.handleReconnect(orgId);
// //         });
// //       }
// //     });

// //     this.socket.on('disconnect', (reason: string) => {
// //       console.log('Socket Disconnected:', reason);
// //       this.zone.run(() => {
// //         this.connectionStatus$.next('disconnected');
// //         this.socketId$.next(null);
// //         if (reason !== 'io client disconnect') this.handleReconnect(orgId);
// //       });
// //     });

// //     this.socket.on('connectionEstablished', (data: { userId: string; socketId: string; timestamp: string }) => {
// //       this.zone.run(() => this.connectionEstablished$.next(data));
// //     });

// //     this.socket.on('pong', (data: { timestamp: string }) => {
// //       this.lastPongTime = Date.now();
// //       const latency = Date.now() - new Date(data.timestamp).getTime();
      
// //       if (latency < 100) this.connectionHealth$.next('healthy');
// //       else if (latency < 500) this.connectionHealth$.next('degraded');
// //       else this.connectionHealth$.next('poor');
// //     });

// //     // --- MESSAGE EVENTS ---

// //     this.socket.on('newMessage', (msg: Message) => {
// //       this.zone.run(() => {
// //         this.messages$.next(msg);
// //         const currentBatch = this.messagesBatch$.value;
// //         const exists = currentBatch.some(m => m._id === msg._id);
        
// //         if (!exists) {
// //           this.messagesBatch$.next([...currentBatch, msg]);
// //         }
// //       });
// //     });

// //     this.socket.on('messageEdited', (msg: Message) => {
// //       this.zone.run(() => {
// //         this.messageEdited$.next(msg);
// //         const batch = this.messagesBatch$.value;
// //         const updatedBatch = batch.map(m => m._id === msg._id ? msg : m);
// //         this.messagesBatch$.next(updatedBatch);
// //       });
// //     });

// //     this.socket.on('messageDeleted', (data: any) => {
// //       this.zone.run(() => {
// //         this.messageDeleted$.next(data);
// //         const updated = this.messagesBatch$.value.map(m => 
// //           m._id === data.messageId ? { ...m, body: '', attachments: [], deleted: true } : m
// //         );
// //         this.messagesBatch$.next(updated);
// //       });
// //     });
    
// //     this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => {
// //       this.zone.run(() => {
// //         const current = this.messagesBatch$.value;
// //         const existingIds = new Set(current.map(m => m._id));
// //         const newMessages = payload.messages.reverse().filter(m => !existingIds.has(m._id));
// //         this.messagesBatch$.next([...newMessages, ...current]);
// //       });
// //     });

// //     this.socket.on('userTyping', (data: { userId: string; channelId: string; typing: boolean; timestamp?: string }) => {
// //       this.zone.run(() => this.typing$.next(data));
// //     });

// //     this.socket.on('readReceipt', (data: { userId: string; channelId: string; messageIds: string[] | null; timestamp: string }) => {
// //       this.zone.run(() => this.readReceipt$.next(data));
// //     });

// //     // --- CHANNEL & PRESENCE EVENTS ---

// //     this.socket.on('channelCreated', (channel: Channel) => {
// //       this.zone.run(() => {
// //         const current = this.channels$.value;
// //         // ✅ FIX: Duplicate Check prevents double entry when creator receives own socket event
// //         const exists = current.some(c => c._id === channel._id);
        
// //         if (!exists) {
// //             this.channelCreated$.next(channel);
// //             this.channels$.next([channel, ...current]);
// //             console.log(`🔔 New channel received: #${channel.name}`);
// //         }
// //       });
// //     });

// //     this.socket.on('channelUpdated', (channel: Channel) => {
// //       this.zone.run(() => {
// //         this.channelUpdated$.next(channel);
// //         const current = this.channels$.value;
// //         const updated = current.map(c => c._id === channel._id ? channel : c);
// //         this.channels$.next(updated);
// //       });
// //     });

// //     this.socket.on('removedFromChannel', (data: { channelId: string }) => {
// //       this.zone.run(() => {
// //         // 1. Remove channel from the list
// //         const currentChannels = this.channels$.value;
// //         const updatedChannels = currentChannels.filter(c => c._id !== data.channelId);
// //         this.channels$.next(updatedChannels);

// //         // 2. Clear messages for that channel from memory
// //         const currentMessages = this.messagesBatch$.value;
// //         const updatedMessages = currentMessages.filter(m => m.channelId !== data.channelId);
// //         this.messagesBatch$.next(updatedMessages);

// //         console.log(`🚫 You were removed from channel ${data.channelId}`);
// //       });
// //     });

// //     this.socket.on('channelUsers', (data: { channelId: string; users: string[] }) => {
// //       this.zone.run(() => {
// //         const current = this.channelUsers$.value;
// //         this.channelUsers$.next({ ...current, [data.channelId]: data.users });
// //       });
// //     });

// //     this.socket.on('userJoinedChannel', (data: { channelId: string; userId: string }) => {
// //       this.zone.run(() => {
// //         const current = this.channelUsers$.value;
// //         const users = current[data.channelId] || [];
// //         if (!users.includes(data.userId)) {
// //           this.channelUsers$.next({ ...current, [data.channelId]: [...users, data.userId] });
// //         }
// //       });
// //     });

// //     this.socket.on('userLeftChannel', (data: { channelId: string; userId: string }) => {
// //       this.zone.run(() => {
// //         const current = this.channelUsers$.value;
// //         const users = current[data.channelId] || [];
// //         this.channelUsers$.next({ ...current, [data.channelId]: users.filter(u => u !== data.userId) });
// //       });
// //     });

// //     this.socket.on('userOnline', (data: OnlineUser) => {
// //       this.zone.run(() => {
// //         const set = new Set(this.onlineUsers$.value);
// //         set.add(data.userId);
// //         this.onlineUsers$.next(set);
// //       });
// //     });

// //     this.socket.on('userOffline', (data: OnlineUser) => {
// //       this.zone.run(() => {
// //         const set = new Set(this.onlineUsers$.value);
// //         set.delete(data.userId);
// //         this.onlineUsers$.next(set);
// //       });
// //     });

// //     this.socket.on('orgOnlineUsers', (data: { organizationId: string; users: string[] }) => {
// //       this.zone.run(() => {
// //         const set = new Set(data.users);
// //         this.onlineUsers$.next(set);
// //       });
// //     });

// //     // --- NOTIFICATION & SYSTEM EVENTS ---

// //     this.socket.on('newNotification', (notification: NotificationData) => {
// //       this.zone.run(() => {
// //         const current = this.notificationsSource.value;
// //         this.notificationsSource.next([notification, ...current]);
// //         this.showToast(notification);
// //       });
// //     });

// //     this.socket.on('initialNotifications', (data: { notifications: NotificationData[] }) => {
// //       this.zone.run(() => {
// //         this.notificationsSource.next(data.notifications);
// //       });
// //     });

// //     this.socket.on('notificationRead', (data: { notificationId: string }) => {
// //       this.zone.run(() => {
// //         const current = this.notificationsSource.value;
// //         const updated = current.map(n => 
// //           n._id === data.notificationId ? { ...n, isRead: true } : n
// //         );
// //         this.notificationsSource.next(updated);
// //       });
// //     });

// //     this.socket.on('newAnnouncement', (payload: { data: AnnouncementData }) => {
// //       this.zone.run(() => {
// //         if (payload?.data) {
// //           this.announcement$.next(payload.data);
// //           this.showAnnouncementToast(payload.data);
// //         }
// //       });
// //     });

// //     this.socket.on('forceLogout', (data: { reason: string; timestamp: string }) => {
// //       this.zone.run(() => {
// //         this.forceLogout$.next(data);
// //         this.disconnect();
// //         console.warn('Force logout received:', data.reason);
// //       });
// //     });

// //     this.socket.on('systemStats', (stats: SystemStats) => {
// //       this.zone.run(() => this.systemStats$.next(stats));
// //     });

// //     this.socket.on('initialData', (data: any) => {
// //       this.zone.run(() => {
// //         if (data.channels) this.channels$.next(data.channels);
// //         console.log('📦 Initial Data Synced via Socket');
// //       });
// //     });
// //   }

// //   // ==========================================================================
// //   // 📤 PUBLIC API (ACTIONS)
// //   // ==========================================================================

// //   /**
// //    * ✅ HYBRID SEND MESSAGE: 
// //    * Uses HTTP for persistence, relies on Socket for broadcast.
// //    * Updated to accept an object to match component call signature.
// //    */
// //   sendMessage(payload: { channelId: string; body: string; attachments?: Attachment[]; tempId?: string }): Promise<Message> {
// //     const { channelId, body, attachments = [] } = payload;
    
// //     if (!channelId || (!body && !attachments.length)) {
// //         return Promise.reject(new Error('Invalid Payload'));
// //     }

// //     const httpPayload = { channelId, body, attachments };
    
// //     // Uses HTTP POST to backend controller
// //     return lastValueFrom(
// //       this.http.post<Message>(`${environment.apiUrl}/v1/chat/messages`, httpPayload)
// //     );
// //   }

// //   /**
// //    * ✅ HTTP: Create Channel
// //    */
// //   createChannelHttp(name: string, type: any, members: string[] = []) {
// //     return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, { name, type, members });
// //   }

// //   /**
// //    * ✅ HTTP: Leave Channel
// //    */
// //   leaveChannel(channelId: string) {
// //     return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/leave`, {});
// //   }

// //   /**
// //    * ✅ HTTP: Add Member
// //    */
// //   addMember(channelId: string, userId: string) {
// //     return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/members`, { userId });
// //   }

// //   /**
// //    * ✅ HTTP: Remove Member (Kick)
// //    */
// //   removeMember(channelId: string, userId: string) {
// //     return this.http.delete(`${environment.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`);
// //   }

// //   /**
// //    * ✅ HTTP: Upload File
// //    */
// //   uploadAttachment(file: File) {
// //     const formData = new FormData();
// //     formData.append('file', file);
// //     return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
// //   }

// //   // --- SOCKET-ONLY ACTIONS (Lightweight) ---

// //   joinChannel(channelId: string) {
// //     this.socket?.emit('joinChannel', { channelId });
// //   }

// //   // ✅ ADDED THIS METHOD TO FIX ERROR
// //   getInitialData() {
// //     this.socket?.emit('getInitialData');
// //   }

// //   sendTyping(channelId: string, isTyping: boolean) {
// //     this.socket?.emit('typing', { channelId, typing: isTyping });
// //   }

// //   markRead(channelId: string, messageIds?: string[]) {
// //     this.socket?.emit('markRead', { channelId, messageIds });
// //   }

// //   getSystemStats() {
// //     this.socket?.emit('admin:getStats');
// //   }

// //   forceDisconnectUser(targetUserId: string) {
// //     this.socket?.emit('admin:forceDisconnect', { targetUserId });
// //   }

// //   createAnnouncement(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetOrgId?: string) {
// //     const orgId = targetOrgId || this.orgId;
// //     if (!orgId) return;
// //     this.socket?.emit('createAnnouncement', { title, message, type, targetOrgId: orgId });
// //   }

// //   sendNotification(recipientId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', metadata?: any) {
// //     this.socket?.emit('sendNotification', { recipientId, title, message, type, metadata });
// //   }

// //   markNotificationRead(notificationId: string) {
// //     this.socket?.emit('markNotificationRead', { notificationId });
// //   }

// //   // --- HTTP FETCHERS (Standard REST) ---

// //   listChannels() {
// //     return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
// //   }

// //   // ✅ ADDED THIS METHOD TO FIX ERROR
// //   setChannels(channels: Channel[]) {
// //     this.channels$.next(channels);
// //   }

// //   fetchMessagesHttp(channelId: string, before?: string, limit = 50) {
// //     const params: any = { limit };
// //     if (before) params.before = before;
// //     return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
// //   }

// //   deleteMessage(messageId: string) {
// //     return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
// //   }

// //   editMessage(messageId: string, body: string) {
// //     return this.http.patch<Message>(`${environment.apiUrl}/v1/chat/messages/${messageId}`, { body });
// //   }

// //   getNotificationsHttp() {
// //     return this.http.get<NotificationData[]>(`${environment.apiUrl}/v1/notifications`);
// //   }

// //   // ==========================================================================
// //   // 🛠️ UTILITIES
// //   // ==========================================================================

// //   private handleReconnect(orgId: string) {
// //     if (this.reconnectAttempts >= this.maxReconnectAttempts) {
// //       console.error('Max reconnection attempts reached');
// //       this.messageService.showError('Connection Lost', 'Unable to reconnect to server');
// //       return;
// //     }
    
// //     this.reconnectAttempts++;
// //     const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
// //     if (this.reconnectSub) this.reconnectSub.unsubscribe();
    
// //     this.reconnectSub = timer(delay).subscribe(() => {
// //       if (this.token && this.orgId && this.userId) {
// //         this.connect(this.token, this.orgId, this.userId);
// //       }
// //     });
// //   }

// //   private startPingInterval() {
// //     if (this.pingInterval) clearInterval(this.pingInterval);
    
// //     this.pingInterval = setInterval(() => {
// //       if (this.socket?.connected) {
// //         const timeSinceLastPong = Date.now() - this.lastPongTime;
        
// //         if (this.lastPongTime > 0 && timeSinceLastPong > 30000) {
// //           console.warn(`⚠️ Connection unstable: No pong for ${Math.floor(timeSinceLastPong / 1000)}s`);
// //           this.zone.run(() => this.connectionHealth$.next('poor'));
// //         }

// //         this.socket.emit('ping');
// //       }
// //     }, 15000);
// //   }

// //   private stopPingInterval() {
// //     if (this.pingInterval) {
// //       clearInterval(this.pingInterval);
// //       this.pingInterval = null;
// //     }
// //   }

// //   private flushQueue() {
// //     if (!this.socket?.connected) return;
    
// //     while (this.outboundQueue.length > 0) {
// //       const item = this.outboundQueue.shift();
// //       if (item) {
// //         this.socket.emit(item.event, item.payload);
// //       }
// //     }
// //   }

// //   disconnect() {
// //     this.stopPingInterval();
// //     if (this.socket) {
// //       this.socket.removeAllListeners();
// //       this.socket.disconnect();
// //       this.socket = null;
// //     }
    
// //     this.connectionStatus$.next('disconnected');
// //     this.socketId$.next(null);
// //     if (this.reconnectSub) {
// //       this.reconnectSub.unsubscribe();
// //       this.reconnectSub = null;
// //     }
// //   }

// //   // --- Toast Helpers ---

// //   private showToast(notification: NotificationData) {
// //     switch (notification.type) {
// //       case 'success':
// //         this.messageService.showSuccess(notification.title, notification.message);
// //         break;
// //       case 'error':
// //         this.messageService.showError(notification.title, notification.message);
// //         break;
// //       case 'warning':
// //         this.messageService.showWarn(notification.title, notification.message);
// //         break;
// //       case 'urgent':
// //         this.messageService.showError(notification.title, notification.message, 1000);
// //         break;
// //       default:
// //         this.messageService.showInfo(notification.title, notification.message);
// //         break;
// //     }
// //   }

// //   private showAnnouncementToast(announcement: AnnouncementData) {
// //     const message = `${announcement.title}: ${announcement.message}`;
// //     switch (announcement.type) {
// //       case 'success': this.messageService.showSuccess('Announcement', message, 8000); break;
// //       case 'warning': this.messageService.showWarn('Announcement', message, 8000); break;
// //       case 'error': this.messageService.showError('Announcement', message, 8000); break;
// //       default: this.messageService.showInfo('Announcement', message, 8000); break;
// //     }
// //   }

// //   ngOnDestroy() {
// //     this.disconnect();
// //     this.connectionStatus$.complete();
// //     this.socketId$.complete();
// //     this.messages$.complete();
// //     this.messagesBatch$.complete();
// //     this.channels$.complete();
// //     this.channelUsers$.complete();
// //     this.onlineUsers$.complete();
// //     this.typing$.complete();
// //     this.messageEdited$.complete();
// //     this.messageDeleted$.complete();
// //     this.readReceipt$.complete();
// //     this.channelCreated$.complete();
// //     this.channelUpdated$.complete();
// //     this.channelActivity$.complete();
// //     this.notificationsSource.complete();
// //     this.announcement$.complete();
// //     this.forceLogout$.complete();
// //     this.systemStats$.complete();
// //     this.connectionEstablished$.complete();
// //     this.connectionHealth$.complete();
// //   }
// // }


// // // +===========








// // // import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
// // // import { HttpClient } from '@angular/common/http';
// // // import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
// // // import { BehaviorSubject, Subject, Observable, timer, Subscription, map, distinctUntilChanged, shareReplay, lastValueFrom } from 'rxjs';
// // // import { environment } from '../../../environments/environment';
// // // import { AppMessageService } from './message.service';
// // // import { AuthService } from '../../modules/auth/services/auth-service';

// // // // --- INTERFACES ---

// // // export interface Attachment { 
// // //   name: string;
// // //   url: string;
// // //   type: string;
// // //   size?: number;
// // //   publicId?: string;
// // // }

// // // export interface Message {
// // //   _id?: string;
// // //   channelId: string;
// // //   senderId?: any; // populated object or string ID
// // //   body?: string;
// // //   attachments?: Attachment[];
// // //   createdAt?: string;
// // //   deleted?: boolean;
// // //   read?: boolean;
// // //   readBy?: string[];
// // //   editedAt?: string;
// // //   editedBy?: string;
// // // }

// // // export type ChatMessage = Message;

// // // export interface Channel {
// // //   _id: string;
// // //   name?: string;
// // //   type?: 'public' | 'private' | 'dm';
// // //   members?: string[];
// // //   isActive?: boolean;
// // //   organizationId?: string;
// // //   createdBy?: string;
// // //   createdAt?: string;
// // // }

// // // export interface NotificationData {
// // //   _id?: string;
// // //   title: string;
// // //   message: string;
// // //   type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
// // //   isRead?: boolean;
// // //   createdAt?: string;
// // //   metadata?: any;
// // //   recipientId?: string;
// // //   createdBy?: string;
// // //   readAt?: string;
// // //   readBy?: string;
// // // }

// // // export interface AnnouncementData {
// // //   _id?: string;
// // //   title: string;
// // //   message: string;
// // //   type?: 'info' | 'success' | 'warning' | 'error';
// // //   senderId?: any;
// // //   organizationId?: string;
// // //   createdAt?: string;
// // // }

// // // export interface OnlineUser {
// // //   userId: string;
// // //   organizationId?: string;
// // //   timestamp?: string;
// // // }

// // // export interface SystemStats {
// // //   connectedUsers: number;
// // //   orgOnlineUsers: number;
// // //   channelPresence: number;
// // //   totalConnections: number;
// // //   timestamp: string;
// // // }

// // // @Injectable({
// // //   providedIn: 'root'
// // // })
// // // export class SocketService implements OnDestroy {
// // //   private http = inject(HttpClient);
// // //   private zone = inject(NgZone);
// // //   private authService = inject(AuthService);
// // //   private messageService = inject(AppMessageService);

// // //   private socket: Socket | null = null;
// // //   private readonly url = environment.socketUrl; 
// // //   private token: string | null = null;
// // //   private userId: string | null = null;
// // //   private orgId: string | null = null;

// // //   // --- STATE STREAMS (Chat) ---
// // //   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
// // //   public socketId$ = new BehaviorSubject<string | null>(null);
  
// // //   public messages$ = new Subject<Message>();
// // //   public messagesBatch$ = new BehaviorSubject<Message[]>([]); 
  
// // //   public channels$ = new BehaviorSubject<Channel[]>([]);
// // //   public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  
// // //   public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
// // //   public onlineUsersList$: Observable<OnlineUser[]> = this.onlineUsers$.pipe(
// // //     map(users => Array.from(users).map(userId => ({ userId }))),
// // //     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
// // //     shareReplay(1)
// // //   );
  
// // //   public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean; timestamp?: string }>();
  
// // //   // Message events
// // //   public messageEdited$ = new Subject<Message>();
// // //   public messageDeleted$ = new Subject<{ messageId: string; channelId: string; deletedBy: string; timestamp: string }>();
// // //   public readReceipt$ = new Subject<{ userId: string; channelId: string; messageIds: string[] | null; timestamp: string }>();

// // //   // Channel events
// // //   public channelCreated$ = new Subject<Channel>();
// // //   public channelUpdated$ = new Subject<Channel>();
// // //   public channelActivity$ = new Subject<{ channelId: string; lastMessage: any }>();

// // //   // --- STATE STREAMS (Notifications) ---
// // //   private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
// // //   public notifications$ = this.notificationsSource.asObservable();
// // //   public unreadCount$ = this.notifications$.pipe(
// // //     map(notifications => notifications.filter(n => !n.isRead).length),
// // //     distinctUntilChanged()
// // //   );
// // //   public messageSent$ = new Subject<any>();
// // //   // Announcements
// // //   public announcement$ = new Subject<AnnouncementData>();

// // //   // System events
// // //   public forceLogout$ = new Subject<{ reason: string; timestamp: string }>();
// // //   public systemStats$ = new Subject<SystemStats>();
// // //   public connectionEstablished$ = new Subject<{ userId: string; socketId: string; timestamp: string }>();

// // //   // Reconnect Logic
// // //   private reconnectAttempts = 0;
// // //   private maxReconnectAttempts = 10;
// // //   private reconnectSub: Subscription | null = null;
// // //   private pingInterval: any = null;

// // //   // Internal Queue & Health
// // //   private outboundQueue: Array<{ event: string; payload: any }> = [];
// // //   private maxQueueSize = 100;
// // //   private lastPongTime: number = 0;
// // //   public connectionHealth$ = new BehaviorSubject<'healthy' | 'degraded' | 'poor'>('healthy');

// // //   constructor() {}

// // //   /**
// // //    * Initialize Socket
// // //    */
// // //   connect(token: string, orgId: string, userId: string) {
// // //     this.token = token;
// // //     this.orgId = orgId;
// // //     this.userId = userId;
    
// // //     // Prevent double connection
// // //     if (this.socket?.connected) {
// // //       console.log('Socket already connected');
// // //       return;
// // //     }

// // //     const opts: Partial<ManagerOptions & SocketOptions> = {
// // //       transports: ['websocket', 'polling'],
// // //       auth: { token },
// // //       reconnection: false, // We handle reconnection manually for better control
// // //       withCredentials: true,
// // //       timeout: 30000,
// // //       forceNew: false,
// // //       autoConnect: true
// // //     };

// // //     try {
// // //       if (this.socket) {
// // //         this.socket.removeAllListeners();
// // //         this.socket.disconnect();
// // //       }

// // //       this.socket = io(this.url, opts);
      
// // //       // ✅ Reset the pong timer immediately upon attempting connection
// // //       this.lastPongTime = Date.now(); 

// // //       this.setupListeners(orgId);
// // //       this.startPingInterval();

// // //     } catch (err) {
// // //       console.error('Socket Init Failed:', err);
// // //       this.handleReconnect(orgId);
// // //     }
// // //   }

// // //     getInitialData() {
// // //     this.socket?.emit('getInitialData');
// // //   }
  
// // //   private setupListeners(orgId: string) {
// // //     if (!this.socket) return;

// // //     // --- CONNECTION EVENTS ---

// // //     this.socket.on('connect', () => {
// // //       console.log('✅ Chat Socket Connected');
// // //       this.zone.run(() => {
// // //         this.connectionStatus$.next('connected');
// // //         this.reconnectAttempts = 0;
        
// // //         // ✅ Reset pong time on confirmed connection
// // //         this.lastPongTime = Date.now(); 
// // //         this.connectionHealth$.next('healthy');

// // //         this.flushQueue();

// // //         this.socket?.emit('joinOrg', { organizationId: orgId });
// // //         this.socket?.emit('subscribeNotifications');
// // //         this.getInitialData();
// // //       });
// // //     });

// // //     this.socket.on('connect_error', (error: any) => {
// // //       console.error('💬 Chat Socket Error:', error.message);

// // //       if (error.data?.code === 'TOKEN_EXPIRED') {
// // //         this.zone.run(() => {
// // //           this.connectionStatus$.next('reconnecting');
          
// // //           // Silent Token Refresh
// // //           this.authService.refreshToken().subscribe({
// // //             next: (res: any) => {
// // //               this.token = res.token;
// // //               if (this.socket) {
// // //                 this.socket.auth = { token: res.token };
// // //                 this.socket.connect();
// // //               }
// // //             },
// // //             error: () => {
// // //               this.disconnect();
// // //               this.messageService.showError('Session Expired', 'Please login again.');
// // //             }
// // //           });
// // //         });
// // //       } else {
// // //         this.zone.run(() => {
// // //           this.connectionStatus$.next('disconnected');
// // //           this.handleReconnect(orgId);
// // //         });
// // //       }
// // //     });

// // //     this.socket.on('disconnect', (reason: string) => {
// // //       console.log('Socket Disconnected:', reason);
// // //       this.zone.run(() => {
// // //         this.connectionStatus$.next('disconnected');
// // //         this.socketId$.next(null);
// // //         if (reason !== 'io client disconnect') this.handleReconnect(orgId);
// // //       });
// // //     });

// // //     this.socket.on('connectionEstablished', (data: { userId: string; socketId: string; timestamp: string }) => {
// // //       this.zone.run(() => this.connectionEstablished$.next(data));
// // //     });

// // //     this.socket.on('pong', (data: { timestamp: string }) => {
// // //       this.lastPongTime = Date.now();
// // //       const latency = Date.now() - new Date(data.timestamp).getTime();
      
// // //       if (latency < 100) this.connectionHealth$.next('healthy');
// // //       else if (latency < 500) this.connectionHealth$.next('degraded');
// // //       else this.connectionHealth$.next('poor');
// // //     });

// // //     // --- MESSAGE EVENTS ---

// // //     this.socket.on('newMessage', (msg: Message) => {
// // //       this.zone.run(() => {
// // //         this.messages$.next(msg);
// // //         const currentBatch = this.messagesBatch$.value;
// // //         const exists = currentBatch.some(m => m._id === msg._id);
        
// // //         if (!exists) {
// // //           this.messagesBatch$.next([...currentBatch, msg]);
// // //         }
// // //       });
// // //     });

// // //     this.socket.on('messageEdited', (msg: Message) => {
// // //       this.zone.run(() => {
// // //         this.messageEdited$.next(msg);
// // //         const batch = this.messagesBatch$.value;
// // //         const updatedBatch = batch.map(m => m._id === msg._id ? msg : m);
// // //         this.messagesBatch$.next(updatedBatch);
// // //       });
// // //     });

// // //     this.socket.on('messageDeleted', (data: any) => {
// // //       this.zone.run(() => {
// // //         this.messageDeleted$.next(data);
// // //         const updated = this.messagesBatch$.value.map(m => 
// // //           m._id === data.messageId ? { ...m, body: '', attachments: [], deleted: true } : m
// // //         );
// // //         this.messagesBatch$.next(updated);
// // //       });
// // //     });
    
// // //     this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => {
// // //       this.zone.run(() => {
// // //         const current = this.messagesBatch$.value;
// // //         const existingIds = new Set(current.map(m => m._id));
// // //         const newMessages = payload.messages.reverse().filter(m => !existingIds.has(m._id));
// // //         this.messagesBatch$.next([...newMessages, ...current]);
// // //       });
// // //     });

// // //     this.socket.on('userTyping', (data: { userId: string; channelId: string; typing: boolean; timestamp?: string }) => {
// // //       this.zone.run(() => this.typing$.next(data));
// // //     });

// // //     this.socket.on('readReceipt', (data: { userId: string; channelId: string; messageIds: string[] | null; timestamp: string }) => {
// // //       this.zone.run(() => this.readReceipt$.next(data));
// // //     });

// // //     // --- CHANNEL & PRESENCE EVENTS ---

// // //     this.socket.on('channelCreated', (channel: Channel) => {
// // //       this.zone.run(() => {
// // //         const current = this.channels$.value;
// // //         // ✅ FIX: Duplicate Check prevents double entry when creator receives own socket event
// // //         const exists = current.some(c => c._id === channel._id);
        
// // //         if (!exists) {
// // //             this.channelCreated$.next(channel);
// // //             this.channels$.next([channel, ...current]);
// // //             console.log(`🔔 New channel received: #${channel.name}`);
// // //         }
// // //       });
// // //     });

// // //     this.socket.on('channelUpdated', (channel: Channel) => {
// // //       this.zone.run(() => {
// // //         this.channelUpdated$.next(channel);
// // //         const current = this.channels$.value;
// // //         const updated = current.map(c => c._id === channel._id ? channel : c);
// // //         this.channels$.next(updated);
// // //       });
// // //     });

// // //     this.socket.on('removedFromChannel', (data: { channelId: string }) => {
// // //       this.zone.run(() => {
// // //         // 1. Remove channel from the list
// // //         const currentChannels = this.channels$.value;
// // //         const updatedChannels = currentChannels.filter(c => c._id !== data.channelId);
// // //         this.channels$.next(updatedChannels);

// // //         // 2. Clear messages for that channel from memory
// // //         const currentMessages = this.messagesBatch$.value;
// // //         const updatedMessages = currentMessages.filter(m => m.channelId !== data.channelId);
// // //         this.messagesBatch$.next(updatedMessages);

// // //         console.log(`🚫 You were removed from channel ${data.channelId}`);
// // //       });
// // //     });

// // //     this.socket.on('channelUsers', (data: { channelId: string; users: string[] }) => {
// // //       this.zone.run(() => {
// // //         const current = this.channelUsers$.value;
// // //         this.channelUsers$.next({ ...current, [data.channelId]: data.users });
// // //       });
// // //     });

// // //     this.socket.on('userJoinedChannel', (data: { channelId: string; userId: string }) => {
// // //       this.zone.run(() => {
// // //         const current = this.channelUsers$.value;
// // //         const users = current[data.channelId] || [];
// // //         if (!users.includes(data.userId)) {
// // //           this.channelUsers$.next({ ...current, [data.channelId]: [...users, data.userId] });
// // //         }
// // //       });
// // //     });

// // //     this.socket.on('userLeftChannel', (data: { channelId: string; userId: string }) => {
// // //       this.zone.run(() => {
// // //         const current = this.channelUsers$.value;
// // //         const users = current[data.channelId] || [];
// // //         this.channelUsers$.next({ ...current, [data.channelId]: users.filter(u => u !== data.userId) });
// // //       });
// // //     });

// // //     this.socket.on('userOnline', (data: OnlineUser) => {
// // //       this.zone.run(() => {
// // //         const set = new Set(this.onlineUsers$.value);
// // //         set.add(data.userId);
// // //         this.onlineUsers$.next(set);
// // //       });
// // //     });

// // //     this.socket.on('userOffline', (data: OnlineUser) => {
// // //       this.zone.run(() => {
// // //         const set = new Set(this.onlineUsers$.value);
// // //         set.delete(data.userId);
// // //         this.onlineUsers$.next(set);
// // //       });
// // //     });

// // //     this.socket.on('orgOnlineUsers', (data: { organizationId: string; users: string[] }) => {
// // //       this.zone.run(() => {
// // //         const set = new Set(data.users);
// // //         this.onlineUsers$.next(set);
// // //       });
// // //     });

// // //     // --- NOTIFICATION & SYSTEM EVENTS ---

// // //     this.socket.on('newNotification', (notification: NotificationData) => {
// // //       this.zone.run(() => {
// // //         const current = this.notificationsSource.value;
// // //         this.notificationsSource.next([notification, ...current]);
// // //         this.showToast(notification);
// // //       });
// // //     });

// // //     this.socket.on('initialNotifications', (data: { notifications: NotificationData[] }) => {
// // //       this.zone.run(() => {
// // //         this.notificationsSource.next(data.notifications);
// // //       });
// // //     });

// // //     this.socket.on('notificationRead', (data: { notificationId: string }) => {
// // //       this.zone.run(() => {
// // //         const current = this.notificationsSource.value;
// // //         const updated = current.map(n => 
// // //           n._id === data.notificationId ? { ...n, isRead: true } : n
// // //         );
// // //         this.notificationsSource.next(updated);
// // //       });
// // //     });

// // //     this.socket.on('newAnnouncement', (payload: { data: AnnouncementData }) => {
// // //       this.zone.run(() => {
// // //         if (payload?.data) {
// // //           this.announcement$.next(payload.data);
// // //           this.showAnnouncementToast(payload.data);
// // //         }
// // //       });
// // //     });

// // //     this.socket.on('forceLogout', (data: { reason: string; timestamp: string }) => {
// // //       this.zone.run(() => {
// // //         this.forceLogout$.next(data);
// // //         this.disconnect();
// // //         console.warn('Force logout received:', data.reason);
// // //       });
// // //     });

// // //     this.socket.on('systemStats', (stats: SystemStats) => {
// // //       this.zone.run(() => this.systemStats$.next(stats));
// // //     });

// // //     this.socket.on('initialData', (data: any) => {
// // //       this.zone.run(() => {
// // //         if (data.channels) this.channels$.next(data.channels);
// // //         console.log('📦 Initial Data Synced via Socket');
// // //       });
// // //     });
// // //   }

// // //   // ==========================================================================
// // //   // 📤 PUBLIC API (ACTIONS)
// // //   // ==========================================================================

// // //   /**
// // //    * ✅ HYBRID SEND MESSAGE: 
// // //    * Uses HTTP for persistence, relies on Socket for broadcast.
// // //    */
// // //   sendMessage(channelId: string, body: string, attachments: Attachment[] = []): Promise<Message> {
// // //     if (!channelId || (!body && !attachments.length)) {
// // //         return Promise.reject(new Error('Invalid Payload'));
// // //     }

// // //     const payload = { channelId, body, attachments };
    
// // //     // Uses HTTP POST to backend controller
// // //     return lastValueFrom(
// // //       this.http.post<Message>(`${environment.apiUrl}/v1/chat/messages`, payload)
// // //     );
// // //   }

// // //   /**
// // //    * ✅ HTTP: Create Channel
// // //    */
// // //   createChannelHttp(name: string, type: any, members: string[] = []) {
// // //     return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, { name, type, members });
// // //   }

// // //   /**
// // //    * ✅ HTTP: Leave Channel
// // //    */
// // //   leaveChannel(channelId: string) {
// // //     return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/leave`, {});
// // //   }

// // //   /**
// // //    * ✅ HTTP: Add Member
// // //    */
// // //   addMember(channelId: string, userId: string) {
// // //     return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/members`, { userId });
// // //   }

// // //   /**
// // //    * ✅ HTTP: Remove Member (Kick)
// // //    */
// // //   removeMember(channelId: string, userId: string) {
// // //     return this.http.delete(`${environment.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`);
// // //   }

// // //   /**
// // //    * ✅ HTTP: Upload File
// // //    */
// // //   uploadAttachment(file: File) {
// // //     const formData = new FormData();
// // //     formData.append('file', file);
// // //     return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
// // //   }

// // //   // --- SOCKET-ONLY ACTIONS (Lightweight) ---

// // //   joinChannel(channelId: string) {
// // //     this.socket?.emit('joinChannel', { channelId });
// // //   }

// // //   sendTyping(channelId: string, isTyping: boolean) {
// // //     this.socket?.emit('typing', { channelId, typing: isTyping });
// // //   }

// // //   markRead(channelId: string, messageIds?: string[]) {
// // //     this.socket?.emit('markRead', { channelId, messageIds });
// // //   }

// // //   getSystemStats() {
// // //     this.socket?.emit('admin:getStats');
// // //   }

// // //   forceDisconnectUser(targetUserId: string) {
// // //     this.socket?.emit('admin:forceDisconnect', { targetUserId });
// // //   }

// // //   createAnnouncement(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetOrgId?: string) {
// // //     const orgId = targetOrgId || this.orgId;
// // //     if (!orgId) return;
// // //     this.socket?.emit('createAnnouncement', { title, message, type, targetOrgId: orgId });
// // //   }

// // //   sendNotification(recipientId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', metadata?: any) {
// // //     this.socket?.emit('sendNotification', { recipientId, title, message, type, metadata });
// // //   }

// // //   markNotificationRead(notificationId: string) {
// // //     this.socket?.emit('markNotificationRead', { notificationId });
// // //   }

// // //   // --- HTTP FETCHERS (Standard REST) ---

// // //   listChannels() {
// // //     return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
// // //   }

// // //   fetchMessagesHttp(channelId: string, before?: string, limit = 50) {
// // //     const params: any = { limit };
// // //     if (before) params.before = before;
// // //     return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
// // //   }

// // //   deleteMessage(messageId: string) {
// // //     return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
// // //   }

// // //   editMessage(messageId: string, body: string) {
// // //     return this.http.patch<Message>(`${environment.apiUrl}/v1/chat/messages/${messageId}`, { body });
// // //   }

// // //   getNotificationsHttp() {
// // //     return this.http.get<NotificationData[]>(`${environment.apiUrl}/v1/notifications`);
// // //   }

// // //   // ==========================================================================
// // //   // 🛠️ UTILITIES
// // //   // ==========================================================================

// // //   private handleReconnect(orgId: string) {
// // //     if (this.reconnectAttempts >= this.maxReconnectAttempts) {
// // //       console.error('Max reconnection attempts reached');
// // //       this.messageService.showError('Connection Lost', 'Unable to reconnect to server');
// // //       return;
// // //     }
    
// // //     this.reconnectAttempts++;
// // //     const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
// // //     if (this.reconnectSub) this.reconnectSub.unsubscribe();
    
// // //     this.reconnectSub = timer(delay).subscribe(() => {
// // //       if (this.token && this.orgId && this.userId) {
// // //         this.connect(this.token, this.orgId, this.userId);
// // //       }
// // //     });
// // //   }

// // //   private startPingInterval() {
// // //     if (this.pingInterval) clearInterval(this.pingInterval);
    
// // //     this.pingInterval = setInterval(() => {
// // //       if (this.socket?.connected) {
// // //         const timeSinceLastPong = Date.now() - this.lastPongTime;
        
// // //         if (this.lastPongTime > 0 && timeSinceLastPong > 30000) {
// // //           console.warn(`⚠️ Connection unstable: No pong for ${Math.floor(timeSinceLastPong / 1000)}s`);
// // //           this.zone.run(() => this.connectionHealth$.next('poor'));
// // //         }

// // //         this.socket.emit('ping');
// // //       }
// // //     }, 15000);
// // //   }

// // //   private stopPingInterval() {
// // //     if (this.pingInterval) {
// // //       clearInterval(this.pingInterval);
// // //       this.pingInterval = null;
// // //     }
// // //   }

// // //   private flushQueue() {
// // //     if (!this.socket?.connected) return;
    
// // //     while (this.outboundQueue.length > 0) {
// // //       const item = this.outboundQueue.shift();
// // //       if (item) {
// // //         this.socket.emit(item.event, item.payload);
// // //       }
// // //     }
// // //   }

// // //   disconnect() {
// // //     this.stopPingInterval();
// // //     if (this.socket) {
// // //       this.socket.removeAllListeners();
// // //       this.socket.disconnect();
// // //       this.socket = null;
// // //     }
    
// // //     this.connectionStatus$.next('disconnected');
// // //     this.socketId$.next(null);
// // //     if (this.reconnectSub) {
// // //       this.reconnectSub.unsubscribe();
// // //       this.reconnectSub = null;
// // //     }
// // //   }

// // //   // --- Toast Helpers ---

// // //   private showToast(notification: NotificationData) {
// // //     switch (notification.type) {
// // //       case 'success':
// // //         this.messageService.showSuccess(notification.title, notification.message);
// // //         break;
// // //       case 'error':
// // //         this.messageService.showError(notification.title, notification.message);
// // //         break;
// // //       case 'warning':
// // //         this.messageService.showWarn(notification.title, notification.message);
// // //         break;
// // //       case 'urgent':
// // //         this.messageService.showError(notification.title, notification.message, 1000);
// // //         break;
// // //       default:
// // //         this.messageService.showInfo(notification.title, notification.message);
// // //         break;
// // //     }
// // //   }

// // //   private showAnnouncementToast(announcement: AnnouncementData) {
// // //     const message = `${announcement.title}: ${announcement.message}`;
// // //     switch (announcement.type) {
// // //       case 'success': this.messageService.showSuccess('Announcement', message, 8000); break;
// // //       case 'warning': this.messageService.showWarn('Announcement', message, 8000); break;
// // //       case 'error': this.messageService.showError('Announcement', message, 8000); break;
// // //       default: this.messageService.showInfo('Announcement', message, 8000); break;
// // //     }
// // //   }

// // //   ngOnDestroy() {
// // //     this.disconnect();
// // //     this.connectionStatus$.complete();
// // //     this.socketId$.complete();
// // //     this.messages$.complete();
// // //     this.messagesBatch$.complete();
// // //     this.channels$.complete();
// // //     this.channelUsers$.complete();
// // //     this.onlineUsers$.complete();
// // //     this.typing$.complete();
// // //     this.messageEdited$.complete();
// // //     this.messageDeleted$.complete();
// // //     this.readReceipt$.complete();
// // //     this.channelCreated$.complete();
// // //     this.channelUpdated$.complete();
// // //     this.channelActivity$.complete();
// // //     this.notificationsSource.complete();
// // //     this.announcement$.complete();
// // //     this.forceLogout$.complete();
// // //     this.systemStats$.complete();
// // //     this.connectionEstablished$.complete();
// // //     this.connectionHealth$.complete();
// // //   }
// // // }

// // // // // socket.service.ts (Improved Version)
// // // // import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
// // // // import { HttpClient } from '@angular/common/http';
// // // // import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
// // // // import { BehaviorSubject, Subject, Observable, timer, Subscription, map, distinctUntilChanged, shareReplay } from 'rxjs';
// // // // import { environment } from '../../../environments/environment';
// // // // import { AppMessageService } from './message.service';
// // // // import { AuthService } from '../../modules/auth/services/auth-service';

// // // // // --- INTERFACES ---

// // // // export interface Attachment { 
// // // //   name: string;
// // // //   url: string;
// // // //   type: string;
// // // //   size?: number;
// // // //   publicId?: string;
// // // // }

// // // // export interface Message {
// // // //   _id?: string;
// // // //   channelId: string;
// // // //   senderId?: any;
// // // //   body?: string;
// // // //   attachments?: Attachment[];
// // // //   createdAt?: string;
// // // //   deleted?: boolean;
// // // //   read?: boolean;
// // // //   readBy?: string[];
// // // //   editedAt?: string;
// // // //   editedBy?: string;
// // // // }

// // // // export type ChatMessage = Message;

// // // // export interface Channel {
// // // //   _id: string;
// // // //   name?: string;
// // // //   type?: 'public' | 'private' | 'dm';
// // // //   members?: string[];
// // // //   isActive?: boolean;
// // // //   organizationId?: string;
// // // //   createdBy?: string;
// // // //   createdAt?: string;
// // // // }

// // // // export interface NotificationData {
// // // //   _id?: string;
// // // //   title: string;
// // // //   message: string;
// // // //   type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
// // // //   isRead?: boolean;
// // // //   createdAt?: string;
// // // //   metadata?: any;
// // // //   recipientId?: string;
// // // //   createdBy?: string;
// // // //   readAt?: string;
// // // //   readBy?: string;
// // // // }

// // // // export interface AnnouncementData {
// // // //   _id?: string;
// // // //   title: string;
// // // //   message: string;
// // // //   type?: 'info' | 'success' | 'warning' | 'error';
// // // //   senderId?: any;
// // // //   organizationId?: string;
// // // //   createdAt?: string;
// // // // }

// // // // export interface OnlineUser {
// // // //   userId: string;
// // // //   organizationId?: string;
// // // //   timestamp?: string;
// // // // }

// // // // export interface SystemStats {
// // // //   connectedUsers: number;
// // // //   orgOnlineUsers: number;
// // // //   channelPresence: number;
// // // //   totalConnections: number;
// // // //   timestamp: string;
// // // // }

// // // // @Injectable({
// // // //   providedIn: 'root'
// // // // })
// // // // export class SocketService implements OnDestroy {
// // // //   private http = inject(HttpClient);
// // // //   private zone = inject(NgZone);
// // // //   private authService = inject(AuthService);

// // // //   private messageService = inject(AppMessageService);

// // // //   private socket: Socket | null = null;
// // // //   private readonly url = environment.socketUrl; 
// // // //   private token: string | null = null;
// // // //   private userId: string | null = null;
// // // //   private orgId: string | null = null;

// // // //   // --- STATE STREAMS (Chat) ---
// // // //   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
// // // //   public socketId$ = new BehaviorSubject<string | null>(null);
  
// // // //   public messages$ = new Subject<Message>();
// // // //   public messagesBatch$ = new BehaviorSubject<Message[]>([]); 
  
// // // //   public channels$ = new BehaviorSubject<Channel[]>([]);
// // // //   public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  
// // // //   public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
// // // //   public onlineUsersList$: Observable<OnlineUser[]> = this.onlineUsers$.pipe(
// // // //     map(users => Array.from(users).map(userId => ({ userId }))),
// // // //     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
// // // //     shareReplay(1)
// // // //   );
  
// // // //   public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean; timestamp?: string }>();
  
// // // //   // Message events
// // // //   public messageEdited$ = new Subject<Message>();
// // // //   public messageDeleted$ = new Subject<{ messageId: string; channelId: string; deletedBy: string; timestamp: string }>();
// // // //   public readReceipt$ = new Subject<{ userId: string; channelId: string; messageIds: string[] | null; timestamp: string }>();

// // // //   // Channel events
// // // //   public channelCreated$ = new Subject<Channel>();
// // // //   public channelUpdated$ = new Subject<Channel>();
// // // //   public channelActivity$ = new Subject<{ channelId: string; lastMessage: any }>();

// // // //   // --- STATE STREAMS (Notifications) ---
// // // //   private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
// // // //   public notifications$ = this.notificationsSource.asObservable();
// // // //   public unreadCount$ = this.notifications$.pipe(
// // // //     map(notifications => notifications.filter(n => !n.isRead).length),
// // // //     distinctUntilChanged()
// // // //   );
// // // //   public messageSent$ = new Subject<any>();
// // // //   // Announcements
// // // //   public announcement$ = new Subject<AnnouncementData>();

// // // //   // System events
// // // //   public forceLogout$ = new Subject<{ reason: string; timestamp: string }>();
// // // //   public systemStats$ = new Subject<SystemStats>();
// // // //   public connectionEstablished$ = new Subject<{ userId: string; socketId: string; timestamp: string }>();

// // // //   // Reconnect Logic
// // // //   private reconnectAttempts = 0;
// // // //   private maxReconnectAttempts = 10;
// // // //   private reconnectSub: Subscription | null = null;
// // // //   private pingInterval: any = null;
// // // // // 1. ADD THESE PROPERTIES
// // // //   private outboundQueue: Array<{ event: string; payload: any }> = [];
// // // //   private maxQueueSize = 100;
// // // //   // Connection health
// // // //   private lastPongTime: number = 0;
// // // //   public connectionHealth$ = new BehaviorSubject<'healthy' | 'degraded' | 'poor'>('healthy');

// // // //   constructor() {}

// // // //   /**
// // // //    * Initialize Socket
// // // //    */
// // // //   connect(token: string, orgId: string, userId: string) {
// // // //     this.token = token;
// // // //     this.orgId = orgId;
// // // //     this.userId = userId;
    
// // // //     if (this.socket?.connected) {
// // // //       console.log('Socket already connected');
// // // //       return;
// // // //     }

// // // //     const opts: Partial<ManagerOptions & SocketOptions> = {
// // // //       transports: ['websocket', 'polling'],
// // // //       auth: { token },
// // // //       reconnection: false,
// // // //       withCredentials: true,
// // // //       timeout: 30000,
// // // //       forceNew: false,
// // // //       autoConnect: true
// // // //     };

// // // //     try {
// // // //       if (this.socket) {
// // // //         this.socket.removeAllListeners();
// // // //         this.socket.disconnect();
// // // //       }

// // // //       this.socket = io(this.url, opts);
      
// // // //       // ✅ FIX 1: Reset the pong timer immediately upon attempting connection
// // // //       this.lastPongTime = Date.now(); 

// // // //       this.setupListeners(orgId);

// // // //       // Start ping interval
// // // //       this.startPingInterval();

// // // //     } catch (err) {
// // // //       console.error('Socket Init Failed:', err);
// // // //       this.handleReconnect(orgId);
// // // //     }
// // // //     // try {
// // // //     //   if (this.socket) {
// // // //     //     this.socket.removeAllListeners();
// // // //     //     this.socket.disconnect();
// // // //     //   }
      
// // // //     //   this.socket = io(this.url, opts);
// // // //     //   this.setupListeners(orgId);
      
// // // //     //   // Start ping interval for connection health
// // // //     //   this.startPingInterval();
      
// // // //     // } catch (err) {
// // // //     //   console.error('Socket Init Failed:', err);
// // // //     //   this.handleReconnect(orgId);
// // // //     // }
// // // //   }
// // // //    // if (!this.socket) return;

// // // //     // this.socket.on('connect', () => {
// // // //     //   console.log('✅ Socket Connected:', this.socket?.id);
// // // //     //   this.zone.run(() => {
// // // //     //     this.connectionStatus$.next('connected');
// // // //     //     this.socketId$.next(this.socket?.id || null);
// // // //     //     this.reconnectAttempts = 0;
        
// // // //     //     // Emit join events
// // // //     //     this.socket?.emit('joinOrg', { organizationId: orgId });
// // // //     //     this.socket?.emit('subscribeNotifications');
        
// // // //     //     // Load initial data
// // // //     //     this.getInitialData();
// // // //     //   });
// // // //     // });

// // // //     // 3. ADD THIS HELPER METHOD


// // // //   private setupListeners(orgId: string) {
 
// // // // if (!this.socket) return; 
// // // //     //  this.socket.on('connect', () => {
// // // //     //   console.log('✅ Chat Socket Connected');
// // // //     //   this.zone.run(() => {
// // // //     //     this.connectionStatus$.next('connected');
// // // //     //     this.reconnectAttempts = 0;
        
// // // //     //     // 2. FLUSH THE QUEUE AS SOON AS WE CONNECT
// // // //     //     this.flushQueue(); 

// // // //     //     this.socket?.emit('joinOrg', { organizationId: orgId });
// // // //     //     this.socket?.emit('subscribeNotifications');
// // // //     //     this.getInitialData();
// // // //     //   });
// // // //     // });
// // // // this.socket.on('connect', () => {
// // // //   console.log('✅ Chat Socket Connected');
// // // //   this.zone.run(() => {
// // // //     this.connectionStatus$.next('connected');
// // // //     this.reconnectAttempts = 0;
    
// // // //     // ✅ FIX 2: Reset pong time on confirmed connection to prevent false alarms
// // // //     this.lastPongTime = Date.now(); 
// // // //     this.connectionHealth$.next('healthy'); // Reset health status

// // // //     // Flush queue
// // // //     this.flushQueue();

// // // //     this.socket?.emit('joinOrg', { organizationId: orgId });
// // // //     this.socket?.emit('subscribeNotifications');
// // // //     this.getInitialData();
// // // //   });
// // // // });

// // // //     this.socket.on('connectionEstablished', (data: { userId: string; socketId: string; timestamp: string }) => {
// // // //       this.zone.run(() => {
// // // //         this.connectionEstablished$.next(data);
// // // //       });
// // // //     });

// // // //     this.socket.on('messageSent', (data: any) => {
// // // //   this.zone.run(() => {
// // // //     this.messageSent$.next(data);
// // // //   });
// // // // });

// // // //   this.socket.on('removedFromChannel', (data: { channelId: string }) => {
// // // //         this.zone.run(() => {
// // // //           const currentChannels = this.channels$.value;
// // // //           const updatedChannels = currentChannels.filter(c => c._id !== data.channelId);
// // // //           this.channels$.next(updatedChannels);
// // // //           const currentMessages = this.messagesBatch$.value;
// // // //           const updatedMessages = currentMessages.filter(m => m.channelId !== data.channelId);
// // // //           this.messagesBatch$.next(updatedMessages);

// // // //           console.log(`🚫 You were removed from channel ${data.channelId}`);
// // // //         });
// // // //       });
      
// // // //     this.socket.on('disconnect', (reason: string) => {
// // // //       console.log('Socket Disconnected:', reason);
// // // //       this.zone.run(() => {
// // // //         this.connectionStatus$.next('disconnected');
// // // //         this.socketId$.next(null);
// // // //         this.handleReconnect(orgId);
// // // //       });
// // // //     });
// // // // // socket.service.ts
// // // // this.socket.on('error', (err: any) => {
// // // //   this.zone.run(() => {
// // // //     this.messageService.showError('Socket Error', err.message || err.code);
// // // //   });
// // // // });

// // // //     // socket.service.ts -> setupListeners()
// // // // this.socket.on('initialData', (data: any) => {
// // // //   this.zone.run(() => {
// // // //     if (data.channels) this.channels$.next(data.channels);
// // // //     // You can also sync unread counts here
// // // //     console.log('📦 Initial Data Synced via Socket');
// // // //   });
// // // // });
    
// // // // // 🟢 UPGRADED: Connect Error Handler with Silent Refresh
// // // //     this.socket.on('connect_error', (error: any) => {
// // // //       console.error('💬 Chat Socket Error:', error.message);

// // // //       if (error.data?.code === 'TOKEN_EXPIRED') {
// // // //         this.zone.run(() => {
// // // //           this.connectionStatus$.next('reconnecting');
          
// // // //           this.authService.refreshToken().subscribe({
// // // //             next: (res: any) => {
// // // //               this.token = res.token;
// // // //               if (this.socket) {
// // // //                 this.socket.auth = { token: res.token };
// // // //                 this.socket.connect();
// // // //               }
// // // //             },
// // // //             error: () => {
// // // //               this.disconnect();
// // // //               this.messageService.showError('Session Expired', 'Please login again.');
// // // //             }
// // // //           });
// // // //         });
// // // //       } else {
// // // //         this.zone.run(() => {
// // // //           this.connectionStatus$.next('disconnected');
// // // //           this.handleReconnect(orgId);
// // // //         });
// // // //       }
// // // //     });

// // // //     this.socket.on('disconnect', (reason: string) => {
// // // //       this.zone.run(() => {
// // // //         this.connectionStatus$.next('disconnected');
// // // //         if (reason !== 'io client disconnect') this.handleReconnect(orgId);
// // // //       });
// // // //     });
    


// // // //     this.socket.on('messageEdited', (msg: Message) => {
// // // //       this.zone.run(() => {
// // // //         this.messageEdited$.next(msg);
        
// // // //         // Update in batch
// // // //         const batch = this.messagesBatch$.value;
// // // //         const updatedBatch = batch.map(m => m._id === msg._id ? msg : m);
// // // //         this.messagesBatch$.next(updatedBatch);
// // // //       });
// // // //     });

// // // //     this.socket.on('newMessage', (msg: Message) => {
// // // //   this.zone.run(() => {
// // // //     // 🛑 CRITICAL: Stream the raw message
// // // //     this.messages$.next(msg);

// // // //     // 🛑 CRITICAL: Update batch only if it doesn't exist
// // // //     const currentBatch = this.messagesBatch$.value;
// // // //     const exists = currentBatch.some(m => m._id === msg._id);
    
// // // //     if (!exists) {
// // // //       this.messagesBatch$.next([...currentBatch, msg]);
// // // //     }
// // // //   });
// // // // });

// // // // // Ensure delete listener updates the batch correctly
// // // // this.socket.on('messageDeleted', (data: any) => {
// // // //   this.zone.run(() => {
// // // //     this.messageDeleted$.next(data);
// // // //     const updated = this.messagesBatch$.value.map(m => 
// // // //       m._id === data.messageId ? { ...m, body: '', attachments: [], deleted: true } : m
// // // //     );
// // // //     this.messagesBatch$.next(updated);
// // // //   });
// // // // });
    
// // // //     this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => {
// // // //       this.zone.run(() => {
// // // //         const current = this.messagesBatch$.value;
// // // //         // Filter out duplicates
// // // //         const existingIds = new Set(current.map(m => m._id));
// // // //         const newMessages = payload.messages.reverse().filter(m => !existingIds.has(m._id));
// // // //         this.messagesBatch$.next([...newMessages, ...current]);
// // // //       });
// // // //     });

// // // //     this.socket.on('userTyping', (data: { userId: string; channelId: string; typing: boolean; timestamp?: string }) => {
// // // //       this.zone.run(() => this.typing$.next(data));
// // // //     });

// // // //     this.socket.on('readReceipt', (data: { userId: string; channelId: string; messageIds: string[] | null; timestamp: string }) => {
// // // //       this.zone.run(() => this.readReceipt$.next(data));
// // // //     });

// // // //     // ==========================================================================
// // // //     // PRESENCE EVENTS
// // // //     // ==========================================================================

// // // //     this.socket.on('channelUsers', (data: { channelId: string; users: string[] }) => {
// // // //       this.zone.run(() => {
// // // //         const current = this.channelUsers$.value;
// // // //         this.channelUsers$.next({ ...current, [data.channelId]: data.users });
// // // //       });
// // // //     });

// // // //     this.socket.on('userJoinedChannel', (data: { channelId: string; userId: string }) => {
// // // //       this.zone.run(() => {
// // // //         const current = this.channelUsers$.value;
// // // //         const users = current[data.channelId] || [];
// // // //         if (!users.includes(data.userId)) {
// // // //           this.channelUsers$.next({ ...current, [data.channelId]: [...users, data.userId] });
// // // //         }
// // // //       });
// // // //     });

// // // //     this.socket.on('userLeftChannel', (data: { channelId: string; userId: string }) => {
// // // //       this.zone.run(() => {
// // // //         const current = this.channelUsers$.value;
// // // //         const users = current[data.channelId] || [];
// // // //         this.channelUsers$.next({ ...current, [data.channelId]: users.filter(u => u !== data.userId) });
// // // //       });
// // // //     });

// // // //     this.socket.on('userOnline', (data: OnlineUser) => {
// // // //       this.zone.run(() => {
// // // //         const set = new Set(this.onlineUsers$.value);
// // // //         set.add(data.userId);
// // // //         this.onlineUsers$.next(set);
// // // //       });
// // // //     });

// // // //     this.socket.on('userOffline', (data: OnlineUser) => {
// // // //       this.zone.run(() => {
// // // //         const set = new Set(this.onlineUsers$.value);
// // // //         set.delete(data.userId);
// // // //         this.onlineUsers$.next(set);
// // // //       });
// // // //     });

// // // //     this.socket.on('orgOnlineUsers', (data: { organizationId: string; users: string[] }) => {
// // // //       this.zone.run(() => {
// // // //         const set = new Set(data.users);
// // // //         this.onlineUsers$.next(set);
// // // //       });
// // // //     });

// // // //     this.socket.on('onlineUsersInChannel', (data: { channelId: string; users: string[] }) => {
// // // //       // You can create a separate stream for channel-specific online users if needed
// // // //       console.log('Online users in channel', data.channelId, data.users);
// // // //     });

// // // //     this.socket.on('onlineUsersInOrg', (data: { users: string[] }) => {
// // // //       this.zone.run(() => {
// // // //         const set = new Set(data.users);
// // // //         this.onlineUsers$.next(set);
// // // //       });
// // // //     });

// // // //     // ==========================================================================
// // // //     // CHANNEL EVENTS
// // // //     // ==========================================================================
// // // // this.socket.on('channelCreated', (channel: Channel) => {
// // // //       this.zone.run(() => {
// // // //         const current = this.channels$.value;
        
// // // //         // ✅ FIX: Check if we already have this channel ID
// // // //         const exists = current.some(c => c._id === channel._id);
        
// // // //         if (!exists) {
// // // //             this.channelCreated$.next(channel);
// // // //             this.channels$.next([channel, ...current]);
// // // //             console.log(`🔔 New channel received: #${channel.name}`);
// // // //         }
// // // //       });
// // // //     });
    
// // // //     this.socket.on('channelUpdated', (channel: Channel) => {
// // // //       this.zone.run(() => {
// // // //         this.channelUpdated$.next(channel);
// // // //         const current = this.channels$.value;
// // // //         const updated = current.map(c => c._id === channel._id ? channel : c);
// // // //         this.channels$.next(updated);
// // // //       });
// // // //     });

// // // //     this.socket.on('channelActivity', (data: { channelId: string; lastMessage: any }) => {
// // // //       this.zone.run(() => {
// // // //         this.channelActivity$.next(data);
// // // //       });
// // // //     });

// // // //     // ==========================================================================
// // // //     // NOTIFICATION EVENTS
// // // //     // ==========================================================================

// // // //     this.socket.on('newNotification', (notification: NotificationData) => {
// // // //       this.zone.run(() => {
// // // //         const current = this.notificationsSource.value;
// // // //         this.notificationsSource.next([notification, ...current]);
// // // //         this.showToast(notification);
// // // //       });
// // // //     });

// // // //     this.socket.on('initialNotifications', (data: { notifications: NotificationData[] }) => {
// // // //       this.zone.run(() => {
// // // //         this.notificationsSource.next(data.notifications);
// // // //       });
// // // //     });

// // // //     this.socket.on('notificationRead', (data: { notificationId: string }) => {
// // // //       this.zone.run(() => {
// // // //         const current = this.notificationsSource.value;
// // // //         const updated = current.map(n => 
// // // //           n._id === data.notificationId ? { ...n, isRead: true } : n
// // // //         );
// // // //         this.notificationsSource.next(updated);
// // // //       });
// // // //     });

// // // //     this.socket.on('notificationSent', (data: { notificationId: string }) => {
// // // //       console.log('Notification sent successfully:', data.notificationId);
// // // //     });

// // // //     // ==========================================================================
// // // //     // ANNOUNCEMENT EVENTS
// // // //     // ==========================================================================

// // // //     this.socket.on('newAnnouncement', (payload: { data: AnnouncementData }) => {
// // // //       this.zone.run(() => {
// // // //         if (payload?.data) {
// // // //           this.announcement$.next(payload.data);
// // // //           this.showAnnouncementToast(payload.data);
// // // //         }
// // // //       });
// // // //     });

// // // //     // ==========================================================================
// // // //     // SYSTEM EVENTS
// // // //     // ==========================================================================

// // // //     this.socket.on('forceLogout', (data: { reason: string; timestamp: string }) => {
// // // //       this.zone.run(() => {
// // // //         this.forceLogout$.next(data);
// // // //         this.disconnect();
// // // //         // Optional: Trigger logout in your auth service
// // // //         console.warn('Force logout received:', data.reason);
// // // //       });
// // // //     });

// // // //     this.socket.on('systemStats', (stats: SystemStats) => {
// // // //       this.zone.run(() => {
// // // //         this.systemStats$.next(stats);
// // // //       });
// // // //     });

// // // //     this.socket.on('channelUpdateSuccess', (data: { channelId: string }) => {
// // // //       console.log('Channel update successful:', data.channelId);
// // // //     });

// // // //     this.socket.on('error', (error: { code: string; message?: string }) => {
// // // //       console.error('Socket error:', error);
// // // //       this.zone.run(() => {
// // // //         this.messageService.showError('Socket Error', error.message || `Code: ${error.code}`);
// // // //       });
// // // //     });

// // // //     this.socket.on('pong', (data: { timestamp: string }) => {
// // // //       this.lastPongTime = Date.now();
// // // //       const latency = Date.now() - new Date(data.timestamp).getTime();
      
// // // //       // Update connection health
// // // //       if (latency < 100) {
// // // //         this.connectionHealth$.next('healthy');
// // // //       } else if (latency < 500) {
// // // //         this.connectionHealth$.next('degraded');
// // // //       } else {
// // // //         this.connectionHealth$.next('poor');
// // // //       }
// // // //     });
// // // //   }

// // // //   private handleReconnect(orgId: string) {
// // // //     if (this.reconnectAttempts >= this.maxReconnectAttempts) {
// // // //       console.error('Max reconnection attempts reached');
// // // //       this.messageService.showError('Connection Lost', 'Unable to reconnect to server');
// // // //       return;
// // // //     }
    
// // // //     this.reconnectAttempts++;
// // // //     const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
// // // //     console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
// // // //     if (this.reconnectSub) this.reconnectSub.unsubscribe();
    
// // // //     this.reconnectSub = timer(delay).subscribe(() => {
// // // //       if (this.token && this.orgId && this.userId) {
// // // //         this.connect(this.token, this.orgId, this.userId);
// // // //       }
// // // //     });
// // // //   }

// // // //   // socket.service.ts

// // // // private startPingInterval() {
// // // //   if (this.pingInterval) clearInterval(this.pingInterval);

// // // //   this.pingInterval = setInterval(() => {
// // // //     if (this.socket?.connected) {
      
// // // //       // 1. Check health BEFORE sending the new ping
// // // //       // This ensures we are checking the result of the PREVIOUS ping cycle
// // // //       const timeSinceLastPong = Date.now() - this.lastPongTime;
      
// // // //       if (this.lastPongTime > 0 && timeSinceLastPong > 30000) {
// // // //         console.warn(`⚠️ Connection unstable: No pong for ${Math.floor(timeSinceLastPong / 1000)}s`);
// // // //         this.zone.run(() => this.connectionHealth$.next('poor'));
// // // //       }

// // // //       // 2. Emit the new ping
// // // //       this.socket.emit('ping');
// // // //     }
// // // //   }, 15000); // Ping every 15 seconds
// // // // }

// // // //   private stopPingInterval() {
// // // //     if (this.pingInterval) {
// // // //       clearInterval(this.pingInterval);
// // // //       this.pingInterval = null;
// // // //     }
// // // //   }

// // // //   // ==========================================================================
// // // //   // 📤 SOCKET ACTIONS
// // // //   // ==========================================================================

// // // //   joinChannel(channelId: string) {
// // // //     this.socket?.emit('joinChannel', { channelId });
// // // //   }

// // // //   private flushQueue() {
// // // //     if (!this.socket?.connected) return;
    
// // // //     while (this.outboundQueue.length > 0) {
// // // //       const item = this.outboundQueue.shift();
// // // //       if (item) {
// // // //         console.log(`📤 Flushing queued event: ${item.event}`);
// // // //         this.socket.emit(item.event, item.payload);
// // // //       }
// // // //     }
// // // //   }

// // // // sendMessage(payload: { channelId: string; body: string; attachments: Attachment[]; tempId: string }) {
// // // //   if (this.socket?.connected) {
// // // //     this.socket.emit('sendMessage', payload);
// // // //   } else {
// // // //     this.emitOrQueue('sendMessage', payload);
// // // //   }
// // // // }
// // // //   // 5. ADD THE EMIT-OR-QUEUE LOGIC
// // // //   private emitOrQueue(event: string, payload: any) {
// // // //     if (this.socket?.connected) {
// // // //       this.socket.emit(event, payload);
// // // //     } else {
// // // //       console.warn(`📡 Socket offline. Queuing ${event} (ID: ${payload.tempId || 'N/A'})`);
// // // //       if (this.outboundQueue.length >= this.maxQueueSize) {
// // // //         this.outboundQueue.shift(); // Remove oldest if full
// // // //       }
// // // //       this.outboundQueue.push({ event, payload });
// // // //     }
// // // //   }

// // // //   editMessage(messageId: string, body: string) {
// // // //     this.socket?.emit('editMessage', { messageId, body });
// // // //   }

// // // //   deleteMessage(messageId: string) {
// // // //     this.socket?.emit('deleteMessage', { messageId });
// // // //   }

// // // //   sendTyping(channelId: string, isTyping: boolean) {
// // // //     this.socket?.emit('typing', { channelId, typing: isTyping });
// // // //   }

// // // //   markRead(channelId: string, messageIds?: string[]) {
// // // //     this.socket?.emit('markRead', { channelId, messageIds });
// // // //   }

// // // //   fetchMessages(channelId: string, before?: string, limit = 50) {
// // // //     this.socket?.emit('fetchMessages', { channelId, before, limit });
// // // //   }

// // // //   createChannel(name: string, type: 'public' | 'private' | 'dm', members: string[] = []) {
// // // //     this.socket?.emit('createChannel', { name, type, members });
// // // //   }
// // // //   updateChannel(channelId: string, updates: { 
// // // //   name?: string; 
// // // //   isActive?: boolean; 
// // // //   type?: string; 
// // // //   members?: string[]; // ✅ ADD THIS: Tells TypeScript members is allowed
// // // // }) {
// // // //   if (!this.socket) return;
// // // //   this.socket.emit('updateChannel', { channelId, ...updates });
// // // // }
// // // //  getOnlineUsers(channelId?: string) {
// // // //     this.socket?.emit('getOnlineUsers', { channelId });
// // // //   }

// // // //   getInitialData() {
// // // //     this.socket?.emit('getInitialData');
// // // //   }

// // // //   markNotificationRead(notificationId: string) {
// // // //     this.socket?.emit('markNotificationRead', { notificationId });
// // // //   }

// // // //   sendNotification(recipientId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', metadata?: any) {
// // // //     this.socket?.emit('sendNotification', { recipientId, title, message, type, metadata });
// // // //   }

// // // //   createAnnouncement(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetOrgId?: string) {
// // // //     const orgId = targetOrgId || this.orgId;
// // // //     if (!orgId) {
// // // //       console.error('No organization ID provided for announcement');
// // // //       return;
// // // //     }
// // // //     this.socket?.emit('createAnnouncement', { title, message, type, targetOrgId: orgId });
// // // //   }

// // // //   getSystemStats() {
// // // //     this.socket?.emit('admin:getStats');
// // // //   }

// // // //   forceDisconnectUser(targetUserId: string) {
// // // //     this.socket?.emit('admin:forceDisconnect', { targetUserId });
// // // //   }

  
// // // //   // ==========================================================================
// // // //   // 🌍 HTTP ACTIONS (Fallback/Complementary)
// // // //   // ==========================================================================
// // // // // 'public' | 'private' | 'dm'
// // // //   createChannelHttp(name: string, type: any, members: string[] = []) {
// // // //     return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, { name, type, members });
// // // //   }

// // // //     /**
// // // //    * Leave a channel (Self)
// // // //    */
// // // // leaveChannel(channelId: string) {
// // // //     return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/leave`, {});
// // // //   }

// // // //   /**
// // // //    * Add a member to a channel
// // // //    */
// // // //   addMember(channelId: string, userId: string) {
// // // //     return this.http.post(`${environment.apiUrl}/v1/chat/channels/${channelId}/members`, { userId });
// // // //   }

// // // //   /**
// // // //    * Remove a member from a channel (Admin)
// // // //    */
// // // //   removeMember(channelId: string, userId: string) {
// // // //     return this.http.delete(`${environment.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`);
// // // //   }


// // // //   uploadAttachment(file: File) {
// // // //     const formData = new FormData();
// // // //     formData.append('file', file);
// // // //     return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
// // // //   }

// // // //   listChannels() {
// // // //     return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
// // // //   }

// // // //   fetchMessagesHttp(channelId: string, before?: string, limit = 50) {
// // // //     const params: any = { limit };
// // // //     if (before) params.before = before;
// // // //     return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
// // // //   }

// // // //   deleteMessageHttp(messageId: string) {
// // // //     return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
// // // //   }

// // // //   editMessageHttp(messageId: string, body: string) {
// // // //     return this.http.patch<Message>(`${environment.apiUrl}/v1/chat/messages/${messageId}`, { body });
// // // //   }

// // // //   markReadHttp(notificationId: string) {
// // // //     return this.http.patch(`${environment.apiUrl}/v1/notifications/${notificationId}/read`, {});
// // // //   }

// // // //   getNotificationsHttp() {
// // // //     return this.http.get<NotificationData[]>(`${environment.apiUrl}/v1/notifications`);
// // // //   }

// // // //   // ==========================================================================
// // // //   // UTILITY METHODS
// // // //   // ==========================================================================

// // // //   setInitialNotifications(data: NotificationData[]) {
// // // //     this.notificationsSource.next(data);
// // // //   }

// // // //   addNotification(notification: NotificationData) {
// // // //     const current = this.notificationsSource.value;
// // // //     this.notificationsSource.next([notification, ...current]);
// // // //   }

// // // //   clearNotifications() {
// // // //     this.notificationsSource.next([]);
// // // //   }

// // // //   setChannels(channels: Channel[]) {
// // // //     this.channels$.next(channels);
// // // //   }

// // // //   addChannel(channel: Channel) {
// // // //     const current = this.channels$.value;
// // // //     this.channels$.next([channel, ...current]);
// // // //   }

// // // //   updateChannelLocal(channelId: string, updates: Partial<Channel>) {
// // // //     const current = this.channels$.value;
// // // //     const updated = current.map(c => 
// // // //       c._id === channelId ? { ...c, ...updates } : c
// // // //     );
// // // //     this.channels$.next(updated);
// // // //   }

// // // //   disconnect() {
// // // //     this.stopPingInterval();
    
// // // //     if (this.socket) {
// // // //       this.socket.removeAllListeners();
// // // //       this.socket.disconnect();
// // // //       this.socket = null;
// // // //     }
    
// // // //     this.connectionStatus$.next('disconnected');
// // // //     this.socketId$.next(null);
    
// // // //     if (this.reconnectSub) {
// // // //       this.reconnectSub.unsubscribe();
// // // //       this.reconnectSub = null;
// // // //     }
// // // //   }

// // // //   isConnected(): boolean {
// // // //     return this.socket?.connected || false;
// // // //   }

// // // //   getSocketId(): string | null {
// // // //     return this.socket?.id || null;
// // // //   }

// // // //   // ==========================================================================
// // // //   // NOTIFICATION TOASTS
// // // //   // ==========================================================================

// // // //   private showToast(notification: NotificationData) {
// // // //     switch (notification.type) {
// // // //       case 'success':
// // // //         this.messageService.showSuccess(notification.title, notification.message);
// // // //         break;
// // // //       case 'error':
// // // //         this.messageService.showError(notification.title, notification.message);
// // // //         break;
// // // //       case 'warning':
// // // //         this.messageService.showWarn(notification.title, notification.message);
// // // //         break;
// // // //       case 'urgent':
// // // //         this.messageService.showError(notification.title, notification.message, 1000);
// // // //         break;
// // // //       default:
// // // //         this.messageService.showInfo(notification.title, notification.message);
// // // //         break;
// // // //     }
// // // //   }

// // // //   private showAnnouncementToast(announcement: AnnouncementData) {
// // // //     const message = `${announcement.title}: ${announcement.message}`;
// // // //     switch (announcement.type) {
// // // //       case 'success':
// // // //         this.messageService.showSuccess('Announcement', message, 8000);
// // // //         break;
// // // //       case 'warning':
// // // //         this.messageService.showWarn('Announcement', message, 8000);
// // // //         break;
// // // //       case 'error':
// // // //         this.messageService.showError('Announcement', message, 8000);
// // // //         break;
// // // //       default:
// // // //         this.messageService.showInfo('Announcement', message, 8000);
// // // //         break;
// // // //     }
// // // //   }

// // // //   ngOnDestroy() {
// // // //     this.disconnect();
// // // //     this.connectionStatus$.complete();
// // // //     this.socketId$.complete();
// // // //     this.messages$.complete();
// // // //     this.messagesBatch$.complete();
// // // //     this.channels$.complete();
// // // //     this.channelUsers$.complete();
// // // //     this.onlineUsers$.complete();
// // // //     this.typing$.complete();
// // // //     this.messageEdited$.complete();
// // // //     this.messageDeleted$.complete();
// // // //     this.readReceipt$.complete();
// // // //     this.channelCreated$.complete();
// // // //     this.channelUpdated$.complete();
// // // //     this.channelActivity$.complete();
// // // //     this.notificationsSource.complete();
// // // //     this.announcement$.complete();
// // // //     this.forceLogout$.complete();
// // // //     this.systemStats$.complete();
// // // //     this.connectionEstablished$.complete();
// // // //     this.connectionHealth$.complete();
// // // //   }
// // // // }
