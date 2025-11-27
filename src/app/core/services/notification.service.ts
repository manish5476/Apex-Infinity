import { Inject, Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../modules/auth/services/auth-service';
import { AppMessageService } from './message.service';

export interface NotificationData {
  _id?: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly serverUrl = environment.socketUrl; // e.g., http://localhost:5000
  private notifications = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notifications.asObservable();
private authService=Inject(AuthService)
private messageService=Inject(AppMessageService)


  connect(userId: string): void {
    if (this.socket?.connected) {
      console.log('⚠️ Socket already connected.');
      return;
    }

    console.log('🔌 Attempting to connect socket to:', this.serverUrl);

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected with ID:', this.socket?.id);
      this.socket?.emit('registerUser', userId);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    this.socket.on('newNotification', (notification: NotificationData) => {
      console.log('🔔 New notification:', notification);
      const updatedList = [notification, ...this.notifications.value];
      this.notifications.next(updatedList);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
    });

    this.socket.on('forceLogout', (payload) => {
      // if payload.sessionId matches current session (or always), logout
      this.authService.logout(); // clears token and navigates to login
      this.messageService.showError('Session ended', 'You were logged out from another device or admin revoked your session.');
    });

  }



  /**
   * Marks a notification as read locally (for UI).
   */
  markAsRead(notificationId: string): void {
    const updated = this.notifications.value.map(n =>
      n._id === notificationId ? { ...n, isRead: true } : n
    );
    this.notifications.next(updated);
  }

  /**
   * Disconnects the socket manually.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log('🛑 Socket disconnected manually');
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
