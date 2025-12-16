import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppMessageService } from './message.service';

export interface NotificationData {
  _id?: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
  recipientId?: string; // Added for type safety
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly serverUrl = environment.socketUrl;

  // Stores ALL notifications (History + New)
  private notifications = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notifications.asObservable();

  private messageService = inject(AppMessageService);
  private http = inject(HttpClient);

  // 1. New Helper: Load initial history into the stream
  setInitialNotifications(data: NotificationData[]) {
    this.notifications.next(data);
  }

  connect(userId: string, token: string, organizationId?: string): void {
    if (this.socket?.connected) return;

    if (!userId || !token) {
      console.warn('⚠️ Cannot connect socket: Missing userId or token');
      return;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      withCredentials: true,
      auth: { token: token }
    });

    this.socket.on('connect', () => {
      this.socket?.emit('registerUser', userId);
      if (organizationId) {
        this.socket?.emit('joinOrg', { organizationId });
      }
    });

    this.socket.on('newNotification', (notification: NotificationData) => {
      // Add new notification to the TOP of the list
      const current = this.notifications.value;
      const updatedList = [notification, ...current];
      this.notifications.next(updatedList);

      this.showToast(notification);
    });
  }

  // 2. Updated: Mark as read updates status, DOES NOT DELETE
  markAsRead(notificationId: string): void {
    if (!notificationId) return;

    const currentList = this.notifications.value;
    // Update local state immediately for UI responsiveness
    const updatedList = currentList.map(n =>
      n._id === notificationId ? { ...n, isRead: true } : n
    );
    this.notifications.next(updatedList);

    // Persist to server
    this.http.patch(`${this.serverUrl}/api/v1/notifications/${notificationId}/read`, {})
      .subscribe({
        error: (err) => console.error('Failed to mark notification as read on server:', err)
      });
  }

  // ... showToast, disconnect, ngOnDestroy remain the same ...
  private showToast(n: NotificationData) {
    switch (n.type) {
      case 'success': this.messageService.showSuccess(n.title, n.message); break;
      case 'error': this.messageService.showError(n.title, n.message); break;
      case 'warn': this.messageService.showWarn(n.title, n.message); break;
      default: this.messageService.showInfo(n.title, n.message); break;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}