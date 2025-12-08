
import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // ✅ Import HttpClient
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
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly serverUrl = environment.socketUrl; 
  
  private notifications = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notifications.asObservable();

  private messageService = inject(AppMessageService);
  private http = inject(HttpClient); // ✅ Inject HttpClient

  // ✅ UPDATED: Added 'organizationId' as the 3rd argument
  connect(userId: string, token: string, organizationId?: string): void {
    if (this.socket?.connected) {
      console.log('⚠️ Socket already connected.');
      return;
    }

    if (!userId || !token) {
        console.warn('⚠️ Cannot connect socket: Missing userId or token');
        return;
    }

    console.log('🔌 Connecting socket...');

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      withCredentials: true,
      auth: {
        token: token 
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      
      this.socket?.emit('registerUser', userId);

      if (organizationId) {
        console.log('🏢 Joining Org Room:', organizationId);
        this.socket?.emit('joinOrg', { organizationId });
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    this.socket.on('newNotification', (notification: NotificationData) => {
      console.log('🔔 New notification:', notification);
      
      const updatedList = [notification, ...this.notifications.value];
      this.notifications.next(updatedList);

      switch (notification.type) {
        case 'success':
          this.messageService.showSuccess(notification.title, notification.message);
          break;
        case 'error':
          this.messageService.showError(notification.title, notification.message);
          break;
        case 'warn':
          this.messageService.showWarn(notification.title, notification.message);
          break;
        case 'info':
        default:
          this.messageService.showInfo(notification.title, notification.message);
          break;
      }
    });

    this.socket.on('forceLogout', () => {
      window.location.reload(); 
    });
  }

  markAsRead(notificationId: string): void {
    // 1. Optimistic Update: Update UI immediately so it disappears from "New" tab
    const updated = this.notifications.value.map(n =>
      n._id === notificationId ? { ...n, isRead: true } : n
    );
    this.notifications.next(updated);

    // 2. Persist to Backend: Tell the server to mark it as read permanently
    // We assume an endpoint like PATCH /notifications/:id/read exists
    this.http.patch(`${this.serverUrl}/v1/notifications/${notificationId}/read`, {})
      .subscribe({
        error: (err) => console.error('Failed to mark notification as read:', err)
      });
  }

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
// import { Injectable, OnDestroy, inject } from '@angular/core';
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
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class NotificationService implements OnDestroy {
//   private socket: Socket | null = null;
//   private readonly serverUrl = environment.socketUrl; 
  
//   private notifications = new BehaviorSubject<NotificationData[]>([]);
//   public notifications$ = this.notifications.asObservable();

//   private messageService = inject(AppMessageService);

//   // ✅ UPDATED: Added 'organizationId' as the 3rd argument
//   connect(userId: string, token: string, organizationId?: string): void {
//     if (this.socket?.connected) {
//       console.log('⚠️ Socket already connected.');
//       // If connected but orgId was missing previously, we might want to emit joinOrg here too
//       // But for simplicity, we assume fresh connection logic for now.
//       return;
//     }

//     if (!userId || !token) {
//         console.warn('⚠️ Cannot connect socket: Missing userId or token');
//         return;
//     }

//     console.log('🔌 Connecting socket...');

//     this.socket = io(this.serverUrl, {
//       transports: ['websocket', 'polling'],
//       reconnectionAttempts: 5,
//       reconnectionDelay: 2000,
//       withCredentials: true,
//       auth: {
//         token: token 
//       }
//     });

//     this.socket.on('connect', () => {
//       console.log('✅ Socket connected:', this.socket?.id);
      
//       // 1. Register User (For direct alerts like Signup)
//       this.socket?.emit('registerUser', userId);

//       // 2. ✅ CRITICAL FIX: Join Organization Room (For Invoice Broadcasts)
//       if (organizationId) {
//         console.log('🏢 Joining Org Room:', organizationId);
//         this.socket?.emit('joinOrg', { organizationId });
//       }
//     });

//     this.socket.on('connect_error', (err) => {
//       console.error('❌ Socket connection error:', err.message);
//     });

//     this.socket.on('newNotification', (notification: NotificationData) => {
//       console.log('🔔 New notification:', notification);
      
//       const updatedList = [notification, ...this.notifications.value];
//       this.notifications.next(updatedList);

//       // Show Toast based on type
//       switch (notification.type) {
//         case 'success':
//           this.messageService.showSuccess(notification.title, notification.message);
//           break;
//         case 'error':
//           this.messageService.showError(notification.title, notification.message);
//           break;
//         case 'warn':
//           this.messageService.showWarn(notification.title, notification.message);
//           break;
//         case 'info':
//         default:
//           this.messageService.showInfo(notification.title, notification.message);
//           break;
//       }
//     });

//     this.socket.on('forceLogout', () => {
//       window.location.reload(); 
//     });
//   }

//   markAsRead(notificationId: string): void {
//     const updated = this.notifications.value.map(n =>
//       n._id === notificationId ? { ...n, isRead: true } : n
//     );
//     this.notifications.next(updated);
//   }

//   disconnect(): void {
//     if (this.socket) {
//       this.socket.disconnect();
//       console.log('🛑 Socket disconnected manually');
//       this.socket = null;
//     }
//   }

//   ngOnDestroy(): void {
//     this.disconnect();
//   }
// }

// // import { Injectable, OnDestroy, inject } from '@angular/core';
// // import { io, Socket } from 'socket.io-client';
// // import { BehaviorSubject } from 'rxjs';
// // import { environment } from '../../../environments/environment';
// // import { AppMessageService } from './message.service';

// // export interface NotificationData {
// //   _id?: string;
// //   title: string;
// //   message: string;
// //   type?: string;
// //   isRead?: boolean;
// //   createdAt?: string;
// // }

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class NotificationService implements OnDestroy {
// //   private socket: Socket | null = null;
// //   private readonly serverUrl = environment.socketUrl; 
  
// //   private notifications = new BehaviorSubject<NotificationData[]>([]);
// //   public notifications$ = this.notifications.asObservable();

// //   private messageService = inject(AppMessageService);

// //   connect(userId: string, token: string): void {
// //     if (this.socket?.connected) {
// //       console.log('⚠️ Socket already connected.');
// //       return;
// //     }

// //     if (!userId || !token) {
// //         console.warn('⚠️ Cannot connect socket: Missing userId or token');
// //         return;
// //     }

// //     console.log('🔌 Connecting socket...');

// //     this.socket = io(this.serverUrl, {
// //       transports: ['websocket', 'polling'],
// //       reconnectionAttempts: 5,
// //       reconnectionDelay: 2000,
// //       withCredentials: true,
// //       auth: {
// //         token: token 
// //       }
// //     });

// //     this.socket.on('connect', () => {
// //       console.log('✅ Socket connected:', this.socket?.id);
// //       this.socket?.emit('registerUser', userId);
// //     });

// //     this.socket.on('connect_error', (err) => {
// //       console.error('❌ Socket connection error:', err.message);
// //     });

// //     // ✅ UPDATED SECTION: Dynamic Toast Handling
// //     this.socket.on('newNotification', (notification: NotificationData) => {
// //       console.log('🔔 New notification:', notification);
      
// //       // 1. Update the observable list (for the bell icon)
// //       const updatedList = [notification, ...this.notifications.value];
// //       this.notifications.next(updatedList);

// //       // 2. Show the Growl/Toast based on the 'type' sent from backend
// //       switch (notification.type) {
// //         case 'success':
// //           this.messageService.showSuccess(notification.title, notification.message);
// //           break;
// //         case 'error':
// //           this.messageService.showError(notification.title, notification.message);
// //           break;
// //         case 'warn':
// //           this.messageService.showWarn(notification.title, notification.message);
// //           break;
// //         case 'info':
// //         default:
// //           this.messageService.showInfo(notification.title, notification.message);
// //           break;
// //       }
// //     });

// //     this.socket.on('forceLogout', () => {
// //       window.location.reload(); 
// //     });
// //   }

// //   markAsRead(notificationId: string): void {
// //     const updated = this.notifications.value.map(n =>
// //       n._id === notificationId ? { ...n, isRead: true } : n
// //     );
// //     this.notifications.next(updated);
// //   }

// //   disconnect(): void {
// //     if (this.socket) {
// //       this.socket.disconnect();
// //       console.log('🛑 Socket disconnected manually');
// //       this.socket = null;
// //     }
// //   }

// //   ngOnDestroy(): void {
// //     this.disconnect();
// //   }
// // }

// // // import { Injectable, OnDestroy, inject } from '@angular/core';
// // // import { io, Socket } from 'socket.io-client';
// // // import { BehaviorSubject } from 'rxjs';
// // // import { environment } from '../../../environments/environment';
// // // import { AppMessageService } from './message.service';

// // // export interface NotificationData {
// // //   _id?: string;
// // //   title: string;
// // //   message: string;
// // //   type?: string;
// // //   isRead?: boolean;
// // //   createdAt?: string;
// // // }

// // // @Injectable({
// // //   providedIn: 'root'
// // // })
// // // export class NotificationService implements OnDestroy {
// // //   private socket: Socket | null = null;
// // //   private readonly serverUrl = environment.socketUrl; 
  
// // //   private notifications = new BehaviorSubject<NotificationData[]>([]);
// // //   public notifications$ = this.notifications.asObservable();

// // //   private messageService = inject(AppMessageService);

// // //   connect(userId: string, token: string): void {
// // //     if (this.socket?.connected) {
// // //       console.log('⚠️ Socket already connected.');
// // //       return;
// // //     }

// // //     if (!userId || !token) {
// // //         console.warn('⚠️ Cannot connect socket: Missing userId or token');
// // //         return;
// // //     }

// // //     console.log('🔌 Connecting socket...');

// // //     this.socket = io(this.serverUrl, {
// // //       transports: ['websocket', 'polling'],
// // //       reconnectionAttempts: 5,
// // //       reconnectionDelay: 2000,
// // //       withCredentials: true,
// // //       auth: {
// // //         token: token 
// // //       }
// // //     });

// // //     this.socket.on('connect', () => {
// // //       console.log('✅ Socket connected:', this.socket?.id);
// // //       this.socket?.emit('registerUser', userId);
// // //     });

// // //     this.socket.on('connect_error', (err) => {
// // //       console.error('❌ Socket connection error:', err.message);
// // //     });

// // //     this.socket.on('newNotification', (notification: NotificationData) => {
// // //       console.log('🔔 New notification:', notification);
// // //       const updatedList = [notification, ...this.notifications.value];
// // //       this.notifications.next(updatedList);
// // //       this.messageService.showInfo(notification.title, notification.message);
// // //     });

// // //     this.socket.on('forceLogout', () => {
// // //       // Reload page to trigger AuthService init -> Token Check -> Logout
// // //       window.location.reload(); 
// // //     });
// // //   }

// // //   markAsRead(notificationId: string): void {
// // //     const updated = this.notifications.value.map(n =>
// // //       n._id === notificationId ? { ...n, isRead: true } : n
// // //     );
// // //     this.notifications.next(updated);
// // //   }

// // //   disconnect(): void {
// // //     if (this.socket) {
// // //       this.socket.disconnect();
// // //       console.log('🛑 Socket disconnected manually');
// // //       this.socket = null;
// // //     }
// // //   }

// // //   ngOnDestroy(): void {
// // //     this.disconnect();
// // //   }
// // // }