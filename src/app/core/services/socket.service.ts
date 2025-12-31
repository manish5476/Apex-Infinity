import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { BehaviorSubject, Subject, Observable, timer, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppMessageService } from './message.service';

// --- INTERFACES ---

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface Message {
  _id?: string;
  channelId: string;
  senderId?: any; // kept flexible for string IDs or populated User objects
  body?: string;
  attachments?: Attachment[];
  createdAt?: string;
  deleted?: boolean;
  read:boolean
}

// Alias for components requesting "ChatMessage"
export type ChatMessage = Message;

export interface Channel {
  _id: string;
  name?: string;
  type?: string;
  members?: string[];
  isActive?: boolean;
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

  // --- STATE STREAMS (Chat) ---
  public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
  public messages$ = new Subject<Message>();
  public messagesBatch$ = new BehaviorSubject<Message[]>([]); 
  
  public channels$ = new BehaviorSubject<Channel[]>([]);
  
  // ✅ FIXED: Added missing channelUsers$
  public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  
  public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
  public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean }>();

  // --- STATE STREAMS (Notifications) ---
  private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSource.asObservable();
  public announcement$ = new Subject<any>();

  // Reconnect Logic
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectSub: Subscription | null = null;

  constructor() {}

  /**
   * ✅ Initialize Socket
   */
  connect(token: string, orgId: string) {
    this.token = token;
    
    if (this.socket && this.socket.connected) return;

    const opts: Partial<ManagerOptions & SocketOptions> = {
      transports: ['websocket'], 
      auth: { token },
      reconnection: false,
      withCredentials: true
    };

    try {
        this.socket = io(this.url, opts);
        this.setupListeners(orgId);
    } catch (err) {
        console.error('Socket Init Failed:', err);
    }
  }

  private setupListeners(orgId: string) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket Connected');
      this.connectionStatus$.next('connected');
      this.reconnectAttempts = 0;
      this.socket?.emit('joinOrg', { organizationId: orgId });
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus$.next('disconnected');
      this.handleReconnect(orgId);
    });

    this.socket.on('connect_error', () => {
      this.connectionStatus$.next('disconnected');
      this.handleReconnect(orgId);
    });

    // --- CHAT EVENTS ---
    this.socket.on('newMessage', (msg: Message) => {
      this.zone.run(() => {
          this.messages$.next(msg);
          const batch = this.messagesBatch$.value;
          this.messagesBatch$.next([...batch, msg]);
      });
    });

    this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => {
        this.zone.run(() => {
            const current = this.messagesBatch$.value;
            this.messagesBatch$.next([...payload.messages.reverse(), ...current]);
        });
    });

    this.socket.on('userTyping', (data) => {
      this.zone.run(() => this.typing$.next(data));
    });

    // ✅ Presence Updates
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

    // --- NOTIFICATION EVENTS ---
    this.socket.on('newNotification', (data: NotificationData) => {
      this.zone.run(() => {
        const current = this.notificationsSource.value;
        this.notificationsSource.next([data, ...current]);
        this.showToast(data);
      });
    });

    this.socket.on('newAnnouncement', (payload: any) => {
        this.zone.run(() => {
            if (payload?.data) this.announcement$.next(payload.data);
        });
    });
  }

  private handleReconnect(orgId: string) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); 
      
      if (this.reconnectSub) this.reconnectSub.unsubscribe();
      this.reconnectSub = timer(delay).subscribe(() => {
          if (this.token) this.connect(this.token, orgId);
      });
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

  // ✅ FIXED: Now accepts optional senderId to satisfy component strict check
  sendMessage(payload: { channelId: string; body: string; attachments: Attachment[]; senderId?: any }) {
    this.socket?.emit('sendMessage', payload);
  }

  sendTyping(channelId: string, isTyping: boolean) {
    this.socket?.emit('typing', { channelId, typing: isTyping });
  }

  // ==========================================================================
  // 🌍 HTTP ACTIONS (Restored)
  // ==========================================================================

  // ✅ FIXED: Added createChannel method
  createChannel(name: string, type: 'public' | 'private', members: string[]) {
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

  fetchMessages(channelId: string, before?: string, limit = 50) {
    const params: any = { limit };
    if (before) params.before = before;
    return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
  }

  deleteMessage(messageId: string) {
    return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
  }

  markRead(notificationId: string) {
      const current = this.notificationsSource.value;
      const updated = current.map(n => n._id === notificationId ? { ...n, isRead: true } : n);
      this.notificationsSource.next(updated);
      this.http.patch(`${environment.apiUrl}/v1/notifications/${notificationId}/read`, {}).subscribe();
  }

  setInitialNotifications(data: NotificationData[]) {
      this.notificationsSource.next(data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  ngOnDestroy() {
    this.disconnect();
    if (this.reconnectSub) this.reconnectSub.unsubscribe();
  }

  private showToast(n: NotificationData) {
    switch (n.type) {
      case 'success': this.messageService.showSuccess(n.title, n.message); break;
      case 'error': this.messageService.showError(n.title, n.message); break;
      case 'warning': this.messageService.showWarn(n.title, n.message); break;
      default: this.messageService.showInfo(n.title, n.message); break;
    }
  }
}
