import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  /**
   * Connects the user to the Socket.IO server.
   */
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


// import { Injectable, OnDestroy } from '@angular/core';
// import { io, Socket } from 'socket.io-client';
// import { BehaviorSubject } from 'rxjs';
// import { environment } from '../../../environments/environment';

// export interface NotificationData {
//   _id?: string;
//   title: string;
//   message: string;
//   type?: string;
//   isRead?: boolean;
//   createdAt?: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class NotificationService implements OnDestroy {
//   private socket!: Socket;
//   private readonly serverUrl = environment.socketUrl; // 🔧 update if hosted
//   private notifications = new BehaviorSubject<NotificationData[]>([]);
//   notifications$ = this.notifications.asObservable();

//   connect(userId: string) {
//     if (this.socket) return; // already connected

//     this.socket = io(this.serverUrl, {
//       transports: ['websocket'],
//       reconnectionAttempts: 5,
//       reconnectionDelay: 2000,
//     });

//     this.socket.on('connect', () => {
//       console.log('✅ Socket connected:', this.socket.id);
//       this.socket.emit('registerUser', userId);
//     });

//     // Listen for new notifications from server
//     this.socket.on('newNotification', (notification: NotificationData) => {
//       console.log('🔔 New notification:', notification);
//       const updatedList = [notification, ...this.notifications.value];
//       this.notifications.next(updatedList);
//     });

//     this.socket.on('disconnect', () => {
//       console.warn('⚠️ Socket disconnected');
//     });
//   }

//   markAsRead(notificationId: string) {
//     // If you have an API route for marking read:
//     // return this.http.patch(`/api/v1/notifications/${notificationId}/read`, {});
//     const updated = this.notifications.value.map(n =>
//       n._id === notificationId ? { ...n, isRead: true } : n
//     );
//     this.notifications.next(updated);
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = undefined!;
//       console.log('🛑 Socket disconnected manually');
//     }
//   }

//   ngOnDestroy() {
//     this.disconnect();
//   }
// }
