import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { BehaviorSubject, Observable, map, distinctUntilChanged, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppMessageService } from './message.service';

export interface NotificationData {
  _id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  isRead?: boolean;
  createdAt?: string;
  recipientId?: string;
  metadata?: any;
  createdBy?: string;
  readAt?: string;
  readBy?: string;
  organizationId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly serverUrl = environment.socketUrl;
  private readonly apiUrl = environment.apiUrl;
  private token: string | null = null;
  private userId: string | null = null;

  // Stores ALL notifications (History + New)
  private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSource.asObservable();

  // Unread count observable
  public unreadCount$: Observable<number> = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.isRead).length),
    distinctUntilChanged(),
    shareReplay(1)
  );

  // Unread notifications only
  public unreadNotifications$: Observable<NotificationData[]> = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.isRead)),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  // Read notifications only
  public readNotifications$: Observable<NotificationData[]> = this.notifications$.pipe(
    map(notifications => notifications.filter(n => n.isRead)),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  // Connection status
  public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected'>('disconnected');

  private messageService = inject(AppMessageService);
  private http = inject(HttpClient);

  /**
   * Load initial notifications from HTTP API
   */
  loadInitialNotifications(): Observable<NotificationData[]> {
    return this.http.get<NotificationData[]>(`${this.apiUrl}/v1/notifications`).pipe(
      map(notifications => {
        this.setInitialNotifications(notifications);
        return notifications;
      })
    );
  }

  /**
   * Load more notifications (pagination)
   */
  loadMoreNotifications(limit: number = 20, skip: number = 0): Observable<NotificationData[]> {
    return this.http.get<NotificationData[]>(`${this.apiUrl}/v1/notifications`, {
      params: { limit, skip }
    }).pipe(
      map(newNotifications => {
        const current = this.notificationsSource.value;
        this.notificationsSource.next([...current, ...newNotifications]);
        return newNotifications;
      })
    );
  }

  /**
   * Set initial notifications (from HTTP or socket)
   */
  setInitialNotifications(data: NotificationData[]): void {
    // Sort by createdAt descending (newest first)
    const sorted = [...data].sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    this.notificationsSource.next(sorted);
  }

  /**
   * Connect to notification socket
   */
  connect(userId: string, token: string, organizationId?: string): void {
    if (this.socket?.connected) {
      console.log('Notification socket already connected');
      return;
    }

    if (!userId || !token) {
      console.warn('⚠️ Cannot connect notification socket: Missing userId or token');
      return;
    }

    this.userId = userId;
    this.token = token;

    const opts: Partial<ManagerOptions & SocketOptions> = {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
      autoConnect: true
    };

    this.socket = io(this.serverUrl, opts);

    this.setupSocketListeners(organizationId);
  }

  private setupSocketListeners(organizationId?: string): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔔 Notification socket connected');
      this.connectionStatus$.next('connected');

      // Subscribe to notifications
      this.socket?.emit('subscribeNotifications');

      // Join organization room for announcements
      if (organizationId) {
        this.socket?.emit('joinOrg', { organizationId });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Notification socket disconnected');
      this.connectionStatus$.next('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Notification socket connection error:', error);
      this.connectionStatus$.next('disconnected');
    });

    // Handle initial notifications from socket
    this.socket.on('initialNotifications', (data: { notifications: NotificationData[] }) => {
      console.log('Received initial notifications:', data.notifications.length);
      this.setInitialNotifications(data.notifications);
    });

    // Handle new notification
    this.socket.on('newNotification', (notification: NotificationData) => {
      console.log('New notification received:', notification.title);

      // Add new notification to the TOP of the list
      const current = this.notificationsSource.value;
      const updatedList = [notification, ...current];
      this.notificationsSource.next(updatedList);

      // Show toast if not read
      if (!notification.isRead) {
        this.showToast(notification);
      }
    });

    // Handle notification read acknowledgment
    this.socket.on('notificationRead', (data: { notificationId: string }) => {
      console.log('Notification marked as read:', data.notificationId);
      this.markAsReadLocal(data.notificationId);
    });

    // Handle announcements
    this.socket.on('newAnnouncement', (payload: any) => {
      if (payload?.data) {
        const announcement = payload.data;
        this.showAnnouncementToast(announcement);

        // Optionally add announcements to notifications list
        const notification: NotificationData = {
          title: announcement.title,
          message: announcement.message,
          type: announcement.type || 'info',
          createdAt: announcement.createdAt || new Date().toISOString(),
          metadata: { isAnnouncement: true, ...announcement }
        };

        const current = this.notificationsSource.value;
        this.notificationsSource.next([notification, ...current]);
      }
    });

    // Handle errors
    this.socket.on('error', (error: { code: string; message?: string }) => {
      console.error('Notification socket error:', error);
      this.messageService.showError('Notification Error', error.message || `Code: ${error.code}`);
    });
  }

  /**
   * Mark notification as read (using socket)
   */
  markAsRead(notificationId: string): Observable<any> {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    // Update local state immediately for UI responsiveness
    this.markAsReadLocal(notificationId);

    // Send via socket if connected
    if (this.socket?.connected) {
      this.socket.emit('markNotificationRead', { notificationId });
      return new Observable(observer => {
        // Simulate success response since socket doesn't send acknowledgment
        observer.next({ success: true });
        observer.complete();
      });
    } else {
      // Fallback to HTTP
      return this.http.patch(`${this.apiUrl}/v1/notifications/${notificationId}/read`, {});
    }
  }

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead(notificationIds: string[]): Observable<any> {
    if (!notificationIds.length) {
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    }

    // Update local state
    notificationIds.forEach(id => this.markAsReadLocal(id));

    // Send via HTTP batch update
    return this.http.patch(`${this.apiUrl}/v1/notifications/mark-read`, { notificationIds });
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    const unreadIds = this.notificationsSource.value
      .filter(n => !n.isRead)
      .map(n => n._id)
      .filter((id): id is string => !!id);

    if (!unreadIds.length) {
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    }

    // Update local state
    this.notificationsSource.value.forEach(notification => {
      if (!notification.isRead && notification._id) {
        notification.isRead = true;
      }
    });
    this.notificationsSource.next([...this.notificationsSource.value]);

    // Send via HTTP
    return this.http.patch(`${this.apiUrl}/v1/notifications/mark-all-read`, {});
  }

  /**
   * Send a notification (admin only)
   */
  sendNotification(recipientId: string, title: string, message: string, type: NotificationData['type'] = 'info', metadata?: any): Observable<any> {
    if (!this.socket?.connected) {
      // Fallback to HTTP
      return this.http.post(`${this.apiUrl}/v1/notifications`, {
        recipientId,
        title,
        message,
        type,
        metadata
      });
    }

    // Send via socket
    return new Observable(observer => {
      if (!this.socket) {
        observer.error(new Error('Socket not initialized'));
        return;
      }

      this.socket.emit('sendNotification', { recipientId, title, message, type, metadata });

      // Listen for acknowledgment
      const ackHandler = (data: { notificationId: string }) => {
        observer.next({ success: true, notificationId: data.notificationId });
        observer.complete();
        this.socket?.off('notificationSent', ackHandler);
      };

      this.socket.on('notificationSent', ackHandler);

      // Timeout fallback
      setTimeout(() => {
        observer.next({ success: true, warning: 'No acknowledgment received' });
        observer.complete();
        this.socket?.off('notificationSent', ackHandler);
      }, 5000);
    });
  }

  /**
   * Create an announcement (admin only)
   */
  createAnnouncement(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetOrgId?: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot create announcement: socket not connected');
      return;
    }

    const orgId = targetOrgId || this.getUserOrganizationId(); // You need to implement this
    if (!orgId) {
      console.error('No organization ID available for announcement');
      return;
    }

    this.socket.emit('createAnnouncement', { title, message, type, targetOrgId: orgId });
  }

  /**
   * Get notification statistics
   */
  getStats(): Observable<{ total: number; unread: number; byType: Record<string, number> }> {
    return this.http.get<{ total: number; unread: number; byType: Record<string, number> }>(
      `${this.apiUrl}/v1/notifications/stats`
    );
  }

  /**
   * Clear all notifications (local only)
   */
  clearAll(): void {
    this.notificationsSource.next([]);
  }

  /**
   * Remove a notification (local only)
   */
  removeNotification(notificationId: string): void {
    const current = this.notificationsSource.value;
    const updated = current.filter(n => n._id !== notificationId);
    this.notificationsSource.next(updated);
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus$.next('disconnected');
      console.log('Notification socket disconnected');
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  private markAsReadLocal(notificationId: string): void {
    const current = this.notificationsSource.value;
    const updated = current.map(notification => {
      if (notification._id === notificationId) {
        return {
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
          readBy: this.userId || undefined
        };
      }
      return notification;
    });
    this.notificationsSource.next(updated);
  }

  private showToast(notification: NotificationData): void {
    // Don't show toast for already read notifications
    if (notification.isRead) return;
    let options
    if (notification.type === 'urgent') {
      options = 10000
    } else {
      options = 5000

    }
    // const options = {
    //   10000: 5000
    // };

    switch (notification.type) {
      case 'success':
        this.messageService.showSuccess(notification.title, notification.message, options);
        break;
      case 'error':
        this.messageService.showError(notification.title, notification.message, options);
        break;
      case 'warning':
        this.messageService.showWarn(notification.title, notification.message, options);
        break;
      case 'urgent':
        this.messageService.showError(notification.title, `URGENT: ${notification.message}`, 10000);
        break;
      default:
        this.messageService.showInfo(notification.title, notification.message, options);
        break;
    }
  }

  private showAnnouncementToast(announcement: any): void {
    const message = `${announcement.title}: ${announcement.message}`;
    const options = 8000;

    switch (announcement.type) {
      case 'success':
        this.messageService.showSuccess('Announcement', message, options);
        break;
      case 'warning':
        this.messageService.showWarn('Announcement', message, options);
        break;
      case 'error':
        this.messageService.showError('Announcement', message, options);
        break;
      default:
        this.messageService.showInfo('Announcement', message, options);
        break;
    }
  }

  private getUserOrganizationId(): string | null {
    // Implement this based on your auth system
    // Example: return this.authService.getCurrentUser()?.organizationId;
    return null;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.notificationsSource.complete();
    this.connectionStatus$.complete();
  }
}

// import { Injectable, OnDestroy, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { io, Socket } from 'socket.io-client';
// import { BehaviorSubject } from 'rxjs';
// import { environment } from '../../../environments/environment';
// import { AppMessageService } from './message.service';

// export interface NotificationData {
//   _id?: string;
//   title: string;
//   message: string;
//   type?: string;
//   isRead?: boolean;
//   createdAt?: string;
//   recipientId?: string; // Added for type safety
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class NotificationService implements OnDestroy {
//   private socket: Socket | null = null;
//   private readonly serverUrl = environment.socketUrl;

//   // Stores ALL notifications (History + New)
//   public  notifications = new BehaviorSubject<NotificationData[]>([]);
//   public notifications$ = this.notifications.asObservable();

//   private messageService = inject(AppMessageService);
//   private http = inject(HttpClient);

//   // 1. New Helper: Load initial history into the stream
//   setInitialNotifications(data: NotificationData[]) {
//     this.notifications.next(data);
//   }

//   connect(userId: string, token: string, organizationId?: string): void {
//     if (this.socket?.connected) return;

//     if (!userId || !token) {
//       console.warn('⚠️ Cannot connect socket: Missing userId or token');
//       return;
//     }

//     this.socket = io(this.serverUrl, {
//       transports: ['websocket', 'polling'],
//       reconnectionAttempts: 5,
//       withCredentials: true,
//       auth: { token: token }
//     });

//     this.socket.on('connect', () => {
//       this.socket?.emit('registerUser', userId);
//       if (organizationId) {
//         this.socket?.emit('joinOrg', { organizationId });
//       }
//     });

//     this.socket.on('newNotification', (notification: NotificationData) => {
//       // Add new notification to the TOP of the list
//       const current = this.notifications.value;
//       const updatedList = [notification, ...current];
//       this.notifications.next(updatedList);

//       this.showToast(notification);
//     });
//   }

//   // 2. Updated: Mark as read updates status, DOES NOT DELETE
//   markAsRead(notificationId: string): void {
//     if (!notificationId) return;

//     const currentList = this.notifications.value;
//     // Update local state immediately for UI responsiveness
//     const updatedList = currentList.map(n =>
//       n._id === notificationId ? { ...n, isRead: true } : n
//     );
//     this.notifications.next(updatedList);

//     // Persist to server
//     this.http.patch(`${this.serverUrl}/api/v1/notifications/${notificationId}/read`, {})
//       .subscribe({
//         error: (err) => console.error('Failed to mark notification as read on server:', err)
//       });
//   }

//   // ... showToast, disconnect, ngOnDestroy remain the same ...
//   private showToast(n: NotificationData) {
//     switch (n.type) {
//       case 'success': this.messageService.showSuccess(n.title, n.message); break;
//       case 'error': this.messageService.showError(n.title, n.message); break;
//       case 'warn': this.messageService.showWarn(n.title, n.message); break;
//       default: this.messageService.showInfo(n.title, n.message); break;
//     }
//   }

//   disconnect(): void {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = null;
//     }
//   }

//   ngOnDestroy(): void {
//     this.disconnect();
//   }
// }