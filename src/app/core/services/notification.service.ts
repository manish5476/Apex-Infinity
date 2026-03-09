// src/app/core/services/notification.service.ts
import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = environment.apiUrl;
  private messageService = inject(AppMessageService);
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);

  // State
  private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSource.asObservable();

  public unreadCount$: Observable<number> = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.isRead).length),
    distinctUntilChanged(),
    shareReplay(1)
  );

  // ==========================================================================
  // HTTP FETCHERS
  // ==========================================================================

  loadInitialNotifications(): Observable<NotificationData[]> {
    return this.http.get<NotificationData[]>(`${this.apiUrl}/v1/notifications`).pipe(
      map(notifications => {
        this.notificationsSource.next(notifications);
        return notifications;
      })
    );
  }

  // ==========================================================================
  // ACTIONS (Called by UI)
  // ==========================================================================

  markAsRead(notificationId: string): Observable<any> {
    this.markAsReadLocal(notificationId);
    return this.http.patch(`${this.apiUrl}/v1/notifications/${notificationId}/read`, {});
  }

  markMultipleAsRead(notificationIds: string[]): Observable<any> {
    notificationIds.forEach(id => this.markAsReadLocal(id));
    return this.http.patch(`${this.apiUrl}/v1/notifications/mark-read`, { notificationIds });
  }

  markAllAsRead(): Observable<any> {
    this.ngZone.run(() => {
      const updated = this.notificationsSource.value.map(n => 
        ({ ...n, isRead: true, readAt: new Date().toISOString() })
      );
      this.notificationsSource.next(updated);
    });
    return this.http.patch(`${this.apiUrl}/v1/notifications/mark-all-read`, {});
  }

  removeNotification(notificationId: string): void {
    const updated = this.notificationsSource.value.filter(n => n._id !== notificationId);
    this.notificationsSource.next(updated);
  }
   
  public handleLiveNotification(notification: NotificationData): void {
    this.ngZone.run(() => {
      const current = this.notificationsSource.value;
      this.notificationsSource.next([notification, ...current]);
      if (!notification.isRead) this.showToast(notification);
    });
  }

  public markAsReadLocal(notificationId: string): void {
    this.ngZone.run(() => {
      const updated = this.notificationsSource.value.map(n => 
        n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      );
      this.notificationsSource.next(updated);
    });
  }

  private showToast(notification: NotificationData): void {
    if (notification.isRead) return;
    const msg = `${notification.title}: ${notification.message}`;

    switch (notification.type) {
      case 'success': this.messageService.showSuccess(msg); break;
      case 'error': this.messageService.showError(msg); break;
      case 'warning': this.messageService.showWarn(msg); break;
      case 'urgent': this.messageService.showError(`[URGENT] ${msg}`); break;
      default: this.messageService.showInfo(msg); break;
    }
  }
}




  // markAsRead(notificationId: string): Observable<any> {
  //   this.markAsReadLocal(notificationId);
  //   // Let the backend know via HTTP (SocketService handles the live socket routing now)
  //   return this.http.patch(`${this.apiUrl}/v1/notifications/${notificationId}/read`, {});
  // }

  // markMultipleAsRead(notificationIds: string[]): Observable<any> {
  //   notificationIds.forEach(id => this.markAsReadLocal(id));
  //   return this.http.patch(`${this.apiUrl}/v1/notifications/mark-read`, { notificationIds });
  // }

  // removeNotification(notificationId: string): void {
  //   const updated = this.notificationsSource.value.filter(n => n._id !== notificationId);
  //   this.notificationsSource.next(updated);
  // }

  // ==========================================================================
  // LIVE EVENT HANDLERS (Called by SocketService)
  // ==========================================================================


// // src/app/core/services/notification.service.ts
// import { Injectable, OnDestroy, inject, NgZone } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
// import { BehaviorSubject, Observable, map, distinctUntilChanged, shareReplay } from 'rxjs';
// import { environment } from '../../../environments/environment';
// import { AppMessageService } from './message.service';
// import { AuthService } from '../../modules/auth/services/auth-service';

// export interface NotificationData {
//   _id?: string;
//   title: string;
//   message: string;
//   type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
//   isRead?: boolean;
//   createdAt?: string;
//   recipientId?: string;
//   metadata?: any;
//   createdBy?: string;
//   readAt?: string;
//   readBy?: string;
//   organizationId?: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class NotificationService implements OnDestroy {
//   private socket: Socket | null = null;
//   private readonly serverUrl = environment.socketUrl;
//   private readonly apiUrl = environment.apiUrl;
//   private token: string | null = null;
//   private userId: string | null = null;
  
//   // Injections
//   private authService = inject(AuthService);
//   private messageService = inject(AppMessageService);
//   private http = inject(HttpClient);
//   private ngZone = inject(NgZone); // ✅ REQUIRED for Socket.IO in Angular

//   // State
//   private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
//   public notifications$ = this.notificationsSource.asObservable();

//   public unreadCount$: Observable<number> = this.notifications$.pipe(
//     map(notifications => notifications.filter(n => !n.isRead).length),
//     distinctUntilChanged(),
//     shareReplay(1)
//   );

//   public unreadNotifications$: Observable<NotificationData[]> = this.notifications$.pipe(
//     map(notifications => notifications.filter(n => !n.isRead)),
//     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
//   );

//   public readNotifications$: Observable<NotificationData[]> = this.notifications$.pipe(
//     map(notifications => notifications.filter(n => n.isRead)),
//     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
//   );

//   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected'>('disconnected');

//   // ==========================================================================
//   // HTTP FETCHERS
//   // ==========================================================================

//   loadInitialNotifications(): Observable<NotificationData[]> {
//     return this.http.get<NotificationData[]>(`${this.apiUrl}/v1/notifications`).pipe(
//       map(notifications => {
//         this.notificationsSource.next(notifications);
//         return notifications;
//       })
//     );
//   }

//   loadMoreNotifications(limit: number = 20, skip: number = 0): Observable<NotificationData[]> {
//     return this.http.get<NotificationData[]>(`${this.apiUrl}/v1/notifications`, {
//       params: { limit, skip }
//     }).pipe(
//       map(newNotifications => {
//         const current = this.notificationsSource.value;
//         this.notificationsSource.next([...current, ...newNotifications]);
//         return newNotifications;
//       })
//     );
//   }

//   // ==========================================================================
//   // SOCKET CONNECTION
//   // ==========================================================================

//   connect(userId: string, token: string, organizationId?: string): void {
//     if (this.socket?.connected) return;

//     if (!userId || !token) {
//       console.warn('⚠️ Cannot connect notification socket: Missing userId or token');
//       return;
//     }

//     this.userId = userId;
//     this.token = token;

//     const opts: Partial<ManagerOptions & SocketOptions> = {
//       transports: ['websocket', 'polling'],
//       auth: { token },
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       reconnectionDelayMax: 5000,
//       timeout: 20000,
//       withCredentials: true,
//       autoConnect: true
//     };

//     this.socket = io(this.serverUrl, opts);
//     this.setupSocketListeners(organizationId);
//   }

//   private setupSocketListeners(organizationId?: string): void {
//     if (!this.socket) return;

//     // ✅ Zone.js Integration: Ensure all socket events trigger UI updates
//     this.socket.on('connect', () => {
//       this.ngZone.run(() => {
//         console.log('🔔 Notification socket connected');
//         this.connectionStatus$.next('connected');
//         this.socket?.emit('subscribeNotifications');
//         if (organizationId) this.socket?.emit('joinOrg', { organizationId });
//       });
//     });

//     this.socket.on('disconnect', () => {
//       this.ngZone.run(() => this.connectionStatus$.next('disconnected'));
//     });

//     this.socket.on('connect_error', (error: any) => {
//       this.ngZone.run(() => {
//         if (error.data?.code === 'TOKEN_EXPIRED') {
//           console.warn('🔔 Token expired, attempting silent refresh...');
//           this.authService.refreshToken().subscribe({
//             next: (res: any) => {
//               this.token = res.token;
//               if (this.socket) {
//                 this.socket.auth = { token: res.token };
//                 this.socket.connect();
//               }
//             },
//             error: () => this.disconnect()
//           });
//         } else {
//           this.connectionStatus$.next('disconnected');
//         }
//       });
//     });

//     this.socket.on('initialNotifications', (data: { notifications: NotificationData[] }) => {
//       this.ngZone.run(() => this.notificationsSource.next(data.notifications));
//     });

//     this.socket.on('newNotification', (notification: NotificationData) => {
//       this.ngZone.run(() => {
//         const current = this.notificationsSource.value;
//         this.notificationsSource.next([notification, ...current]);
//         if (!notification.isRead) this.showToast(notification);
//       });
//     });

//     this.socket.on('notificationRead', (data: { notificationId: string }) => {
//       this.ngZone.run(() => this.markAsReadLocal(data.notificationId));
//     });
//   }

//   // ==========================================================================
//   // ACTIONS
//   // ==========================================================================

//   markAsRead(notificationId: string): Observable<any> {
//     if (!notificationId) throw new Error('Notification ID is required');
//     this.markAsReadLocal(notificationId);

//     if (this.socket?.connected) {
//       this.socket.emit('markNotificationRead', { notificationId });
//       return new Observable(obs => { obs.next({ success: true }); obs.complete(); });
//     }
//     return this.http.patch(`${this.apiUrl}/v1/notifications/${notificationId}/read`, {});
//   }

//   markMultipleAsRead(notificationIds: string[]): Observable<any> {
//     if (!notificationIds.length) return new Observable(o => { o.next({ success: true }); o.complete(); });
//     notificationIds.forEach(id => this.markAsReadLocal(id));
//     return this.http.patch(`${this.apiUrl}/v1/notifications/mark-read`, { notificationIds });
//   }

//   markAllAsRead(): Observable<any> {
//     const unreadIds = this.notificationsSource.value.filter(n => !n.isRead);
//     if (!unreadIds.length) return new Observable(o => { o.next({ success: true }); o.complete(); });

//     const updated = this.notificationsSource.value.map(n => ({ ...n, isRead: true }));
//     this.notificationsSource.next(updated);

//     return this.http.patch(`${this.apiUrl}/v1/notifications/mark-all-read`, {});
//   }

//   // ==========================================================================
//   // HELPERS
//   // ==========================================================================

//   private markAsReadLocal(notificationId: string): void {
//     const updated = this.notificationsSource.value.map(notification => 
//       notification._id === notificationId 
//         ? { ...notification, isRead: true, readAt: new Date().toISOString(), readBy: this.userId || undefined }
//         : notification
//     );
//     this.notificationsSource.next(updated);
//   }

//   private showToast(notification: NotificationData): void {
//     if (notification.isRead) return;
    
//     // ✅ FIX: Actually use the options variables
//     const duration = notification.type === 'urgent' ? 10000 : 5000;
//     const msg = `${notification.title}: ${notification.message}`;

//     // Note: ensure your messageService methods accept a duration param!
//     switch (notification.type) {
//       case 'success': this.messageService.showSuccess(msg); break;
//       case 'error': this.messageService.showError(msg); break;
//       case 'warning': this.messageService.showWarn(msg); break;
//       case 'urgent': this.messageService.showError(`[URGENT] ${msg}`); break;
//       default: this.messageService.showInfo(msg); break;
//     }
//   }

//   disconnect(): void {
//     if (this.socket) {
//       this.socket.removeAllListeners();
//       this.socket.disconnect();
//       this.socket = null;
//       this.connectionStatus$.next('disconnected');
//     }
//   }

//   ngOnDestroy(): void {
//     this.disconnect();
//     this.notificationsSource.complete();
//     this.connectionStatus$.complete();
//   }
// }















// import { Injectable, OnDestroy, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
// import { BehaviorSubject, Observable, map, distinctUntilChanged, shareReplay } from 'rxjs';
// import { environment } from '../../../environments/environment';
// import { AppMessageService } from './message.service';
// import { AuthService } from '../../modules/auth/services/auth-service';

// export interface NotificationData {
//   _id?: string;
//   title: string;
//   message: string;
//   type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
//   isRead?: boolean;
//   createdAt?: string;
//   recipientId?: string;
//   metadata?: any;
//   createdBy?: string;
//   readAt?: string;
//   readBy?: string;
//   organizationId?: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class NotificationService implements OnDestroy {
//   private socket: Socket | null = null;
//   private readonly serverUrl = environment.socketUrl;
//   private readonly apiUrl = environment.apiUrl;
//   private token: string | null = null;
//   private userId: string | null = null;
//   private authService = inject(AuthService); // Ensure AuthService is available

//   // Stores ALL notifications (History + New)
//   private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
//   public notifications$ = this.notificationsSource.asObservable();

//   // Unread count observable
//   public unreadCount$: Observable<number> = this.notifications$.pipe(
//     map(notifications => notifications.filter(n => !n.isRead).length),
//     distinctUntilChanged(),
//     shareReplay(1)
//   );

//   // Unread notifications only
//   public unreadNotifications$: Observable<NotificationData[]> = this.notifications$.pipe(
//     map(notifications => notifications.filter(n => !n.isRead)),
//     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
//   );

//   // Read notifications only
//   public readNotifications$: Observable<NotificationData[]> = this.notifications$.pipe(
//     map(notifications => notifications.filter(n => n.isRead)),
//     distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
//   );

//   // Connection status
//   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected'>('disconnected');

//   private messageService = inject(AppMessageService);
//   private http = inject(HttpClient);

//   /**
//    * Load initial notifications from HTTP API
//    */
//   loadInitialNotifications(): Observable<NotificationData[]> {
//     return this.http.get<NotificationData[]>(`${this.apiUrl}/v1/notifications`).pipe(
//       map(notifications => {
//         this.setInitialNotifications(notifications);
//         return notifications;
//       })
//     );
//   }

//   /**
//    * Load more notifications (pagination)
//    */
//   loadMoreNotifications(limit: number = 20, skip: number = 0): Observable<NotificationData[]> {
//     return this.http.get<NotificationData[]>(`${this.apiUrl}/v1/notifications`, {
//       params: { limit, skip }
//     }).pipe(
//       map(newNotifications => {
//         const current = this.notificationsSource.value;
//         this.notificationsSource.next([...current, ...newNotifications]);
//         return newNotifications;
//       })
//     );
//   }

//   /**
//    * Set initial notifications (from HTTP or socket)
//    */
//   setInitialNotifications(data: NotificationData[]): void {
//     // Sort by createdAt descending (newest first)
//     // const sorted = [...data].sort((a, b) =>
//     //   new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
//     // );
//     // this.notificationsSource.next(sorted);
//   }

//   /**
//    * Connect to notification socket
//    */
//   connect(userId: string, token: string, organizationId?: string): void {
//     if (this.socket?.connected) {
//       console.log('Notification socket already connected');
//       return;
//     }

//     if (!userId || !token) {
//       console.warn('⚠️ Cannot connect notification socket: Missing userId or token');
//       return;
//     }

//     this.userId = userId;
//     this.token = token;

//     const opts: Partial<ManagerOptions & SocketOptions> = {
//       transports: ['websocket', 'polling'],
//       auth: { token },
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       reconnectionDelayMax: 5000,
//       timeout: 20000,
//       withCredentials: true,
//       autoConnect: true
//     };

//     this.socket = io(this.serverUrl, opts);

//     this.setupSocketListeners(organizationId);
//   }

//   private setupSocketListeners(organizationId?: string): void {
//     if (!this.socket) return;

//     this.socket.on('connect', () => {
//       console.log('🔔 Notification socket connected');
//       this.connectionStatus$.next('connected');
//       this.socket?.emit('subscribeNotifications');
//       if (organizationId) {
//         this.socket?.emit('joinOrg', { organizationId });
//       }
//     });

//     this.socket.on('disconnect', () => {
//       console.log('Notification socket disconnected');
//       this.connectionStatus$.next('disconnected');
//     });

//     // 🟢 UPGRADED: Connect Error Handler with Silent Refresh
//     this.socket.on('connect_error', (error: any) => {
//       console.error('Notification socket error:', error.message);

//       if (error.data?.code === 'TOKEN_EXPIRED') {
//         console.warn('🔔 Token expired, attempting silent refresh...');

//         // This calls your API to get a new token via the refresh-token cookie
//         this.authService.refreshToken().subscribe({
//           next: (res: any) => {
//             this.token = res.token;
//             if (this.socket) {
//               // Update the socket's internal auth credentials
//               this.socket.auth = { token: res.token };
//               // Reconnect manually
//               this.socket.connect();
//             }
//           },
//           error: () => {
//             this.disconnect();
//             console.error('🔔 Silent refresh failed. User session ended.');
//           }
//         });
//       } else {
//         this.connectionStatus$.next('disconnected');
//       }
//     });

//     // Keep all your other existing listeners below (newNotification, initialNotifications, etc.)
//     this.socket.on('initialNotifications', (data: { notifications: NotificationData[] }) => {
//       this.setInitialNotifications(data.notifications);
//     });

//     this.socket.on('newNotification', (notification: NotificationData) => {
//       const current = this.notificationsSource.value;
//       this.notificationsSource.next([notification, ...current]);
//       if (!notification.isRead) this.showToast(notification);
//     });

//     this.socket.on('notificationRead', (data: { notificationId: string }) => {
//       this.markAsReadLocal(data.notificationId);
//     });
//   }

//   /**
//    * Mark notification as read (using socket)
//    */
//   markAsRead(notificationId: string): Observable<any> {
//     if (!notificationId) {
//       throw new Error('Notification ID is required');
//     }

//     // Update local state immediately for UI responsiveness
//     this.markAsReadLocal(notificationId);

//     // Send via socket if connected
//     if (this.socket?.connected) {
//       this.socket.emit('markNotificationRead', { notificationId });
//       return new Observable(observer => {
//         // Simulate success response since socket doesn't send acknowledgment
//         observer.next({ success: true });
//         observer.complete();
//       });
//     } else {
//       // Fallback to HTTP
//       return this.http.patch(`${this.apiUrl}/v1/notifications/${notificationId}/read`, {});
//     }
//   }

//   markMultipleAsRead(notificationIds: string[]): Observable<any> {
//     if (!notificationIds.length) {
//       return new Observable(observer => {
//         observer.next({ success: true });
//         observer.complete();
//       });
//     }
//     notificationIds.forEach(id => this.markAsReadLocal(id));
//     return this.http.patch(`${this.apiUrl}/v1/notifications/mark-read`, { notificationIds });
//   }

//   /**
//    * Mark all notifications as read
//    */
//   markAllAsRead(): Observable<any> {
//     const unreadIds = this.notificationsSource.value
//       .filter(n => !n.isRead)
//       .map(n => n._id)
//       .filter((id): id is string => !!id);

//     if (!unreadIds.length) {
//       return new Observable(observer => {
//         observer.next({ success: true });
//         observer.complete();
//       });
//     }

//     // Update local state
//     this.notificationsSource.value.forEach(notification => {
//       if (!notification.isRead && notification._id) {
//         notification.isRead = true;
//       }
//     });
//     this.notificationsSource.next([...this.notificationsSource.value]);

//     // Send via HTTP
//     return this.http.patch(`${this.apiUrl}/v1/notifications/mark-all-read`, {});
//   }

//   /**
//    * Send a notification (admin only)
//    */
//   sendNotification(recipientId: string, title: string, message: string, type: NotificationData['type'] = 'info', metadata?: any): Observable<any> {
//     if (!this.socket?.connected) {
//       // Fallback to HTTP
//       return this.http.post(`${this.apiUrl}/v1/notifications`, {
//         recipientId,
//         title,
//         message,
//         type,
//         metadata
//       });
//     }

//     // Send via socket
//     return new Observable(observer => {
//       if (!this.socket) {
//         observer.error(new Error('Socket not initialized'));
//         return;
//       }

//       this.socket.emit('sendNotification', { recipientId, title, message, type, metadata });

//       // Listen for acknowledgment
//       const ackHandler = (data: { notificationId: string }) => {
//         observer.next({ success: true, notificationId: data.notificationId });
//         observer.complete();
//         this.socket?.off('notificationSent', ackHandler);
//       };

//       this.socket.on('notificationSent', ackHandler);

//       // Timeout fallback
//       setTimeout(() => {
//         observer.next({ success: true, warning: 'No acknowledgment received' });
//         observer.complete();
//         this.socket?.off('notificationSent', ackHandler);
//       }, 5000);
//     });
//   }

//   /**
//    * Create an announcement (admin only)
//    */
//   createAnnouncement(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetOrgId?: string): void {
//     if (!this.socket?.connected) {
//       console.warn('Cannot create announcement: socket not connected');
//       return;
//     }

//     const orgId = targetOrgId || this.getUserOrganizationId(); // You need to implement this
//     if (!orgId) {
//       console.error('No organization ID available for announcement');
//       return;
//     }

//     this.socket.emit('createAnnouncement', { title, message, type, targetOrgId: orgId });
//   }

//   /**
//    * Get notification statistics
//    */
//   getStats(): Observable<{ total: number; unread: number; byType: Record<string, number> }> {
//     return this.http.get<{ total: number; unread: number; byType: Record<string, number> }>(
//       `${this.apiUrl}/v1/notifications/stats`
//     );
//   }

//   /**
//    * Clear all notifications (local only)
//    */
//   clearAll(): void {
//     this.notificationsSource.next([]);
//   }

//   /**
//    * Remove a notification (local only)
//    */
//   removeNotification(notificationId: string): void {
//     const current = this.notificationsSource.value;
//     const updated = current.filter(n => n._id !== notificationId);
//     this.notificationsSource.next(updated);
//   }

//   /**
//    * Check if socket is connected
//    */
//   isConnected(): boolean {
//     return this.socket?.connected || false;
//   }

//   /**
//    * Disconnect socket
//    */
//   disconnect(): void {
//     if (this.socket) {
//       this.socket.removeAllListeners();
//       this.socket.disconnect();
//       this.socket = null;
//       this.connectionStatus$.next('disconnected');
//       console.log('Notification socket disconnected');
//     }
//   }

//   // ==========================================================================
//   // PRIVATE HELPER METHODS
//   // ==========================================================================

//   private markAsReadLocal(notificationId: string): void {
//     const current = this.notificationsSource.value;
//     const updated = current.map(notification => {
//       if (notification._id === notificationId) {
//         return {
//           ...notification,
//           isRead: true,
//           readAt: new Date().toISOString(),
//           readBy: this.userId || undefined
//         };
//       }
//       return notification;
//     });
//     this.notificationsSource.next(updated);
//   }

//   private showToast(notification: NotificationData): void {
//     // Don't show toast for already read notifications
//     if (notification.isRead) return;
//     let options
//     if (notification.type === 'urgent') {
//       options = 10000
//     } else {
//       options = 5000

//     }
//     // const options = {
//     //   10000: 5000
//     // };

//     switch (notification.type) {
//       case 'success':
//         this.messageService.showSuccess(`${notification.title}, ${notification.message}`);
//         break;
//       case 'error':
//         this.messageService.showError(`${notification.title}, ${notification.message}`);
//         break;
//       case 'warning':
//         this.messageService.showWarn(`${notification.title}, ${notification.message}`);
//         break;
//       case 'urgent':
//         this.messageService.showError(`${notification.title}, ${notification.message}`);
//         break;
//       default:
//         this.messageService.showInfo(`${notification.title}, ${notification.message}`);
//         break;
//     }
//   }

//   private showAnnouncementToast(announcement: any): void {
//     const message = `${announcement.title}: ${announcement.message}`;
//     const options = 8000;

//     switch (announcement.type) {
//       case 'success':
//         this.messageService.showSuccess(`${announcement.title}, ${announcement.message}`);
//         break;
//       case 'warning':
//         this.messageService.showWarn(`${announcement.title}, ${announcement.message}`);
//         break;
//       case 'error':
//         this.messageService.showError(`${announcement.title}, ${announcement.message}`);
//         break;
//       default:
//         this.messageService.showInfo(`${announcement.title}, ${announcement.message}`);
//         break;
//     }
//   }

//   private getUserOrganizationId(): string | null {
//     // Implement this based on your auth system
//     // Example: return this.authService.getCurrentUser()?.organizationId;
//     return null;
//   }

//   ngOnDestroy(): void {
//     this.disconnect();
//     this.notificationsSource.complete();
//     this.connectionStatus$.complete();
//   }
// }
