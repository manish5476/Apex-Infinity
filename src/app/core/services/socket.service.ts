import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from 'src/app/modules/auth/services/auth-service'; // Assuming you have this
import { AppMessageService } from './message.service';

// --- SHARED INTERFACES ---
export interface NotificationData {
  _id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isRead?: boolean;
  createdAt?: string;
  metadata?: any;
}

export interface ChatMessage {
  _id?: string;
  channelId: string;
  body?: string;
  senderId?: any;
  createdAt?: string;
  attachments?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly url = environment.socketUrl; // Ensure this is "https://apex-1ed5.onrender.com" (No /socket.io/)

  // --- STATE STREAMS ---
  public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
  // Chat Streams
  public messages$ = new Subject<ChatMessage>();
  public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean }>();
  public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());

  // Notification Streams
  private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSource.asObservable();

  // Dependencies
  private zone = inject(NgZone);
  private messageService = inject(AppMessageService);

  constructor() {}

  /**
   * Initialize Single Socket Connection
   * Call this from AppComponent or after Login
   */
  connect(token: string, orgId: string) {
    if (this.socket && this.socket.connected) return;

    // 🛑 CRITICAL CONFIG: Matches Backend
    this.socket = io(this.url, {
      transports: ['websocket'], // Force WebSocket (Fixes 400 Error on Render)
      auth: { token },           // Matches backend: socket.handshake.auth.token
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });

    // --- CONNECTION EVENTS ---
    this.socket.on('connect', () => {
      console.log('✅ Socket Connected:', this.socket?.id);
      this.connectionStatus$.next('connected');
      
      // Auto-Join Organization Room
      this.socket?.emit('joinOrg', { organizationId: orgId });
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('❌ Socket Disconnected:', reason);
      this.connectionStatus$.next('disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('⚠️ Socket Connection Error:', err.message);
      this.connectionStatus$.next('disconnected');
    });

    // --- NOTIFICATION EVENTS ---
    this.socket.on('newNotification', (data: NotificationData) => {
      this.zone.run(() => {
        // Add to list
        const current = this.notificationsSource.value;
        this.notificationsSource.next([data, ...current]);
        
        // Show Toast
        this.showToast(data);
      });
    });

    // --- CHAT EVENTS ---
    this.socket.on('newMessage', (msg: ChatMessage) => {
      this.zone.run(() => this.messages$.next(msg));
    });

    this.socket.on('userTyping', (data) => {
      this.zone.run(() => this.typing$.next(data));
    });

    // --- PRESENCE ---
    this.socket.on('userOnline', ({ userId }) => {
        const current = new Set(this.onlineUsers$.value);
        current.add(userId);
        this.onlineUsers$.next(current);
    });

    this.socket.on('userOffline', ({ userId }) => {
        const current = new Set(this.onlineUsers$.value);
        current.delete(userId);
        this.onlineUsers$.next(current);
    });
  }

  // --- ACTIONS ---

  joinChannel(channelId: string) {
    this.socket?.emit('joinChannel', { channelId });
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('leaveChannel', { channelId });
  }

  sendMessage(payload: ChatMessage) {
    this.socket?.emit('sendMessage', payload);
  }

  sendTyping(channelId: string, isTyping: boolean) {
    this.socket?.emit('typing', { channelId, typing: isTyping });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  ngOnDestroy() {
    this.disconnect();
  }

  // --- HELPERS ---
  private showToast(n: NotificationData) {
    switch (n.type) {
      case 'success': this.messageService.showSuccess(n.title, n.message); break;
      case 'error': this.messageService.showError(n.title, n.message); break;
      case 'warning': this.messageService.showWarn(n.title, n.message); break;
      default: this.messageService.showInfo(n.title, n.message); break;
    }
  }
}
