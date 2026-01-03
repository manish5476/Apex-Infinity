// socket.service.ts (Improved Version)
import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { BehaviorSubject, Subject, Observable, timer, Subscription, map, distinctUntilChanged, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppMessageService } from './message.service';

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
  senderId?: any;
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

  // Connection health
  private lastPongTime: number = 0;
  public connectionHealth$ = new BehaviorSubject<'healthy' | 'degraded' | 'poor'>('healthy');

  constructor() {}

  /**
   * Initialize Socket
   */
  connect(token: string, orgId: string, userId: string) {
    this.token = token;
    this.orgId = orgId;
    this.userId = userId;
    
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const opts: Partial<ManagerOptions & SocketOptions> = {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: false,
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
      this.setupListeners(orgId);
      
      // Start ping interval for connection health
      this.startPingInterval();
      
    } catch (err) {
      console.error('Socket Init Failed:', err);
      this.handleReconnect(orgId);
    }
  }

  private setupListeners(orgId: string) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket Connected:', this.socket?.id);
      this.zone.run(() => {
        this.connectionStatus$.next('connected');
        this.socketId$.next(this.socket?.id || null);
        this.reconnectAttempts = 0;
        
        // Emit join events
        this.socket?.emit('joinOrg', { organizationId: orgId });
        this.socket?.emit('subscribeNotifications');
        
        // Load initial data
        this.getInitialData();
      });
    });

    this.socket.on('connectionEstablished', (data: { userId: string; socketId: string; timestamp: string }) => {
      this.zone.run(() => {
        this.connectionEstablished$.next(data);
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket Disconnected:', reason);
      this.zone.run(() => {
        this.connectionStatus$.next('disconnected');
        this.socketId$.next(null);
        this.handleReconnect(orgId);
      });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket Connection Error:', error);
      this.zone.run(() => {
        this.connectionStatus$.next('disconnected');
        this.handleReconnect(orgId);
      });
    });

    // ==========================================================================
    // CHAT EVENTS
    // ==========================================================================

    this.socket.on('newMessage', (msg: Message) => {
      this.zone.run(() => {
        this.messages$.next(msg);
        const batch = this.messagesBatch$.value;
        this.messagesBatch$.next([...batch, msg]);
      });
    });

    this.socket.on('messageEdited', (msg: Message) => {
      this.zone.run(() => {
        this.messageEdited$.next(msg);
        
        // Update in batch
        const batch = this.messagesBatch$.value;
        const updatedBatch = batch.map(m => m._id === msg._id ? msg : m);
        this.messagesBatch$.next(updatedBatch);
      });
    });

    this.socket.on('messageDeleted', (data: { messageId: string; channelId: string; deletedBy: string; timestamp: string }) => {
      this.zone.run(() => {
        this.messageDeleted$.next(data);
        
        // Update in batch (soft delete)
        const batch = this.messagesBatch$.value;
        const updatedBatch = batch.map(m => {
          if (m._id === data.messageId) {
            return { ...m, body: '', attachments: [], deleted: true };
          }
          return m;
        });
        this.messagesBatch$.next(updatedBatch);
      });
    });

    this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => {
      this.zone.run(() => {
        const current = this.messagesBatch$.value;
        // Filter out duplicates
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

    // ==========================================================================
    // PRESENCE EVENTS
    // ==========================================================================

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

    this.socket.on('onlineUsersInChannel', (data: { channelId: string; users: string[] }) => {
      // You can create a separate stream for channel-specific online users if needed
      console.log('Online users in channel', data.channelId, data.users);
    });

    this.socket.on('onlineUsersInOrg', (data: { users: string[] }) => {
      this.zone.run(() => {
        const set = new Set(data.users);
        this.onlineUsers$.next(set);
      });
    });

    // ==========================================================================
    // CHANNEL EVENTS
    // ==========================================================================

    this.socket.on('channelCreated', (channel: Channel) => {
      this.zone.run(() => {
        this.channelCreated$.next(channel);
        const current = this.channels$.value;
        this.channels$.next([channel, ...current]);
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

    this.socket.on('channelActivity', (data: { channelId: string; lastMessage: any }) => {
      this.zone.run(() => {
        this.channelActivity$.next(data);
      });
    });

    // ==========================================================================
    // NOTIFICATION EVENTS
    // ==========================================================================

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

    this.socket.on('notificationSent', (data: { notificationId: string }) => {
      console.log('Notification sent successfully:', data.notificationId);
    });

    // ==========================================================================
    // ANNOUNCEMENT EVENTS
    // ==========================================================================

    this.socket.on('newAnnouncement', (payload: { data: AnnouncementData }) => {
      this.zone.run(() => {
        if (payload?.data) {
          this.announcement$.next(payload.data);
          this.showAnnouncementToast(payload.data);
        }
      });
    });

    // ==========================================================================
    // SYSTEM EVENTS
    // ==========================================================================

    this.socket.on('forceLogout', (data: { reason: string; timestamp: string }) => {
      this.zone.run(() => {
        this.forceLogout$.next(data);
        this.disconnect();
        // Optional: Trigger logout in your auth service
        console.warn('Force logout received:', data.reason);
      });
    });

    this.socket.on('systemStats', (stats: SystemStats) => {
      this.zone.run(() => {
        this.systemStats$.next(stats);
      });
    });

    this.socket.on('channelUpdateSuccess', (data: { channelId: string }) => {
      console.log('Channel update successful:', data.channelId);
    });

    this.socket.on('error', (error: { code: string; message?: string }) => {
      console.error('Socket error:', error);
      this.zone.run(() => {
        this.messageService.showError('Socket Error', error.message || `Code: ${error.code}`);
      });
    });

    this.socket.on('pong', (data: { timestamp: string }) => {
      this.lastPongTime = Date.now();
      const latency = Date.now() - new Date(data.timestamp).getTime();
      
      // Update connection health
      if (latency < 100) {
        this.connectionHealth$.next('healthy');
      } else if (latency < 500) {
        this.connectionHealth$.next('degraded');
      } else {
        this.connectionHealth$.next('poor');
      }
    });
  }

  private handleReconnect(orgId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.messageService.showError('Connection Lost', 'Unable to reconnect to server');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
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
        this.socket.emit('ping');
        
        // Check if we haven't received a pong in a while
        if (this.lastPongTime && Date.now() - this.lastPongTime > 30000) {
          console.warn('No pong received for 30 seconds, connection may be unstable');
          this.connectionHealth$.next('poor');
        }
      }
    }, 15000); // Ping every 15 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // ==========================================================================
  // 📤 SOCKET ACTIONS
  // ==========================================================================

  joinChannel(channelId: string) {
    this.socket?.emit('joinChannel', { channelId });
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('leaveChannel', { channelId });
  }

  sendMessage(payload: { channelId: string; body: string; attachments: Attachment[] }) {
    this.socket?.emit('sendMessage', payload);
  }

  editMessage(messageId: string, body: string) {
    this.socket?.emit('editMessage', { messageId, body });
  }

  deleteMessage(messageId: string) {
    this.socket?.emit('deleteMessage', { messageId });
  }

  sendTyping(channelId: string, isTyping: boolean) {
    this.socket?.emit('typing', { channelId, typing: isTyping });
  }

  markRead(channelId: string, messageIds?: string[]) {
    this.socket?.emit('markRead', { channelId, messageIds });
  }

  fetchMessages(channelId: string, before?: string, limit = 50) {
    this.socket?.emit('fetchMessages', { channelId, before, limit });
  }

  createChannel(name: string, type: 'public' | 'private' | 'dm', members: string[] = []) {
    this.socket?.emit('createChannel', { name, type, members });
  }

  updateChannel(channelId: string, updates: { name?: string; isActive?: boolean; type?: string }) {
    this.socket?.emit('updateChannel', { channelId, ...updates });
  }

  getOnlineUsers(channelId?: string) {
    this.socket?.emit('getOnlineUsers', { channelId });
  }

  getInitialData() {
    this.socket?.emit('getInitialData');
  }

  markNotificationRead(notificationId: string) {
    this.socket?.emit('markNotificationRead', { notificationId });
  }

  sendNotification(recipientId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', metadata?: any) {
    this.socket?.emit('sendNotification', { recipientId, title, message, type, metadata });
  }

  createAnnouncement(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetOrgId?: string) {
    const orgId = targetOrgId || this.orgId;
    if (!orgId) {
      console.error('No organization ID provided for announcement');
      return;
    }
    this.socket?.emit('createAnnouncement', { title, message, type, targetOrgId: orgId });
  }

  getSystemStats() {
    this.socket?.emit('admin:getStats');
  }

  forceDisconnectUser(targetUserId: string) {
    this.socket?.emit('admin:forceDisconnect', { targetUserId });
  }

  // ==========================================================================
  // 🌍 HTTP ACTIONS (Fallback/Complementary)
  // ==========================================================================

  createChannelHttp(name: string, type: 'public' | 'private' | 'dm', members: string[] = []) {
    return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, { name, type, members });
  }

  uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
  }

  listChannels() {
    return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
  }

  fetchMessagesHttp(channelId: string, before?: string, limit = 50) {
    const params: any = { limit };
    if (before) params.before = before;
    return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
  }

  deleteMessageHttp(messageId: string) {
    return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
  }

  editMessageHttp(messageId: string, body: string) {
    return this.http.patch<Message>(`${environment.apiUrl}/v1/chat/messages/${messageId}`, { body });
  }

  markReadHttp(notificationId: string) {
    return this.http.patch(`${environment.apiUrl}/v1/notifications/${notificationId}/read`, {});
  }

  getNotificationsHttp() {
    return this.http.get<NotificationData[]>(`${environment.apiUrl}/v1/notifications`);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  setInitialNotifications(data: NotificationData[]) {
    this.notificationsSource.next(data);
  }

  addNotification(notification: NotificationData) {
    const current = this.notificationsSource.value;
    this.notificationsSource.next([notification, ...current]);
  }

  clearNotifications() {
    this.notificationsSource.next([]);
  }

  setChannels(channels: Channel[]) {
    this.channels$.next(channels);
  }

  addChannel(channel: Channel) {
    const current = this.channels$.value;
    this.channels$.next([channel, ...current]);
  }

  updateChannelLocal(channelId: string, updates: Partial<Channel>) {
    const current = this.channels$.value;
    const updated = current.map(c => 
      c._id === channelId ? { ...c, ...updates } : c
    );
    this.channels$.next(updated);
  }

  disconnect() {
    this.stopPingInterval();
    
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

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  // ==========================================================================
  // NOTIFICATION TOASTS
  // ==========================================================================

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
      case 'success':
        this.messageService.showSuccess('Announcement', message, 8000);
        break;
      case 'warning':
        this.messageService.showWarn('Announcement', message, 8000);
        break;
      case 'error':
        this.messageService.showError('Announcement', message, 8000);
        break;
      default:
        this.messageService.showInfo('Announcement', message, 8000);
        break;
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
// import { BehaviorSubject, Subject, Observable, timer, Subscription } from 'rxjs';
// import { environment } from '../../../environments/environment';
// import { AppMessageService } from './message.service';

// // --- INTERFACES ---

// export interface Attachment {
//   name: string;
//   url: string;
//   type: string;
//   size?: number;
// }

// export interface Message {
//   _id?: string;
//   channelId: string;
//   senderId?: any; // kept flexible for string IDs or populated User objects
//   body?: string;
//   attachments?: Attachment[];
//   createdAt?: string;
//   deleted?: boolean;
//   read:boolean
// }

// // Alias for components requesting "ChatMessage"
// export type ChatMessage = Message;

// export interface Channel {
//   _id: string;
//   name?: string;
//   type?: string;
//   members?: string[];
//   isActive?: boolean;
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
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class SocketService implements OnDestroy {
//   private http = inject(HttpClient);
//   private zone = inject(NgZone);
//   private messageService = inject(AppMessageService);

//   private socket: Socket | null = null;
//   private readonly url = environment.socketUrl; 
//   private token: string | null = null;

//   // --- STATE STREAMS (Chat) ---
//   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
//   public messages$ = new Subject<Message>();
//   public messagesBatch$ = new BehaviorSubject<Message[]>([]); 
  
//   public channels$ = new BehaviorSubject<Channel[]>([]);
  
//   // ✅ FIXED: Added missing channelUsers$
//   public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  
//   public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
//   public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean }>();

//   // --- STATE STREAMS (Notifications) ---
//   private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
//   public notifications$ = this.notificationsSource.asObservable();
//   public announcement$ = new Subject<any>();

//   // Reconnect Logic
//   private reconnectAttempts = 0;
//   private maxReconnectAttempts = 10;
//   private reconnectSub: Subscription | null = null;

//   constructor() {}

//   /**
//    * ✅ Initialize Socket
//    */
//   connect(token: string, orgId: string) {
//     this.token = token;
    
//     if (this.socket && this.socket.connected) return;

//     const opts: Partial<ManagerOptions & SocketOptions> = {
//       transports: ['websocket'], 
//       auth: { token },
//       reconnection: false,
//       withCredentials: true
//     };

//     try {
//         this.socket = io(this.url, opts);
//         this.setupListeners(orgId);
//     } catch (err) {
//         console.error('Socket Init Failed:', err);
//     }
//   }

//   private setupListeners(orgId: string) {
//     if (!this.socket) return;

//     this.socket.on('connect', () => {
//       console.log('✅ Socket Connected');
//       this.connectionStatus$.next('connected');
//       this.reconnectAttempts = 0;
//       this.socket?.emit('joinOrg', { organizationId: orgId });
//     });

//     this.socket.on('disconnect', () => {
//       this.connectionStatus$.next('disconnected');
//       this.handleReconnect(orgId);
//     });

//     this.socket.on('connect_error', () => {
//       this.connectionStatus$.next('disconnected');
//       this.handleReconnect(orgId);
//     });

//     // --- CHAT EVENTS ---
//     this.socket.on('newMessage', (msg: Message) => {
//       this.zone.run(() => {
//           this.messages$.next(msg);
//           const batch = this.messagesBatch$.value;
//           this.messagesBatch$.next([...batch, msg]);
//       });
//     });

//     this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => {
//         this.zone.run(() => {
//             const current = this.messagesBatch$.value;
//             this.messagesBatch$.next([...payload.messages.reverse(), ...current]);
//         });
//     });

//     this.socket.on('userTyping', (data) => {
//       this.zone.run(() => this.typing$.next(data));
//     });

//     // ✅ Presence Updates
//     this.socket.on('channelUsers', (data: { channelId: string; users: string[] }) => {
//         this.zone.run(() => {
//             const current = this.channelUsers$.value;
//             this.channelUsers$.next({ ...current, [data.channelId]: data.users });
//         });
//     });

//     this.socket.on('userJoinedChannel', (data: { channelId: string; userId: string }) => {
//         this.zone.run(() => {
//             const current = this.channelUsers$.value;
//             const users = current[data.channelId] || [];
//             if (!users.includes(data.userId)) {
//                 this.channelUsers$.next({ ...current, [data.channelId]: [...users, data.userId] });
//             }
//         });
//     });

//     this.socket.on('userLeftChannel', (data: { channelId: string; userId: string }) => {
//         this.zone.run(() => {
//             const current = this.channelUsers$.value;
//             const users = current[data.channelId] || [];
//             this.channelUsers$.next({ ...current, [data.channelId]: users.filter(u => u !== data.userId) });
//         });
//     });

//     // --- NOTIFICATION EVENTS ---
//     this.socket.on('newNotification', (data: NotificationData) => {
//       this.zone.run(() => {
//         const current = this.notificationsSource.value;
//         this.notificationsSource.next([data, ...current]);
//         this.showToast(data);
//       });
//     });

//     this.socket.on('newAnnouncement', (payload: any) => {
//         this.zone.run(() => {
//             if (payload?.data) this.announcement$.next(payload.data);
//         });
//     });
//   }

//   private handleReconnect(orgId: string) {
//       if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
//       this.reconnectAttempts++;
//       const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); 
      
//       if (this.reconnectSub) this.reconnectSub.unsubscribe();
//       this.reconnectSub = timer(delay).subscribe(() => {
//           if (this.token) this.connect(this.token, orgId);
//       });
//   }

//   // ==========================================================================
//   // 📤 SOCKET ACTIONS
//   // ==========================================================================

//   joinChannel(channelId: string) {
//     this.socket?.emit('joinChannel', { channelId });
//   }

//   leaveChannel(channelId: string) {
//     this.socket?.emit('leaveChannel', { channelId });
//   }

//   // ✅ FIXED: Now accepts optional senderId to satisfy component strict check
//   sendMessage(payload: { channelId: string; body: string; attachments: Attachment[]; senderId?: any }) {
//     this.socket?.emit('sendMessage', payload);
//   }

//   sendTyping(channelId: string, isTyping: boolean) {
//     this.socket?.emit('typing', { channelId, typing: isTyping });
//   }

//   // ==========================================================================
//   // 🌍 HTTP ACTIONS (Restored)
//   // ==========================================================================

//   // ✅ FIXED: Added createChannel method
//   createChannel(name: string, type: 'public' | 'private', members: string[]) {
//     return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, { name, type, members });
//   }

//   uploadAttachment(file: File) {
//     const formData = new FormData();
//     formData.append('file', file);
//     return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
//   }

//   listChannels() {
//     return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
//   }

//   fetchMessages(channelId: string, before?: string, limit = 50) {
//     const params: any = { limit };
//     if (before) params.before = before;
//     return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
//   }

//   deleteMessage(messageId: string) {
//     return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
//   }

//   markRead(notificationId: string) {
//       const current = this.notificationsSource.value;
//       const updated = current.map(n => n._id === notificationId ? { ...n, isRead: true } : n);
//       this.notificationsSource.next(updated);
//       this.http.patch(`${environment.apiUrl}/v1/notifications/${notificationId}/read`, {}).subscribe();
//   }

//   setInitialNotifications(data: NotificationData[]) {
//       this.notificationsSource.next(data);
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.removeAllListeners();
//       this.socket.disconnect();
//       this.socket = null;
//     }
//   }

//   ngOnDestroy() {
//     this.disconnect();
//     if (this.reconnectSub) this.reconnectSub.unsubscribe();
//   }

//   private showToast(n: NotificationData) {
//     switch (n.type) {
//       case 'success': this.messageService.showSuccess(n.title, n.message); break;
//       case 'error': this.messageService.showError(n.title, n.message); break;
//       case 'warning': this.messageService.showWarn(n.title, n.message); break;
//       default: this.messageService.showInfo(n.title, n.message); break;
//     }
//   }
// }
