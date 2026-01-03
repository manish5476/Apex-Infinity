import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { Subscription, take } from 'rxjs';
import { LoadingComponent } from "./modules/shared/components/loader.component";
import { MasterListService } from './core/services/master-list.service';
import { AnnouncementListenerComponent } from "./modules/shared/components/announcement-banner/announcement-banner.component";
import { AuthService } from './modules/auth/services/auth-service';
import { SocketService } from './core/services/socket.service';
import { NotificationService } from './core/services/notification.service';
import { AppMessageService } from './core/services/message.service';
// import { AiAssistantComponent } from "./AIAgent/components/ai-assistant/ai-assistant";

@Component({
  selector: 'app-root',
  imports: [ToastModule, RouterOutlet, LoadingComponent, AnnouncementListenerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('apex');

  private auth = inject(AuthService);
  private socketService = inject(SocketService);
  private notificationService = inject(NotificationService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);

  private authSub: Subscription | null = null;
  private reconnectSub: Subscription | null = null;

  constructor() {
    this.setupAuthListener();
  }

  ngOnInit() {
    this.masterList.initFromCache();

    // Load master data if needed
    // this.masterList.load().pipe(take(1)).subscribe();
  }

  private setupAuthListener(): void {
    this.authSub = this.auth.currentUser$.subscribe({
      next: (user) => {
        if (user && user._id && user.organizationId) {
          const token = this.auth.authTokenData;

          if (token) {
            // Connect Socket Service
            this.socketService.connect(token, user.organizationId, user._id);

            // Connect Notification Service
            this.notificationService.connect(user._id, token, user.organizationId);

            // Load notifications
            this.loadNotifications(user._id);

            console.log('Socket & Notification services connected for user:', user._id);
          } else {
            console.warn('No token available for socket connection');
          }
        } else {
          // User logged out or no user data
          this.socketService.disconnect();
          this.notificationService.disconnect();
          console.log('Socket & Notification services disconnected');
        }
      },
      error: (err) => {
        console.error('Auth subscription error:', err);
        this.messageService.showError('Authentication Error', 'Failed to authenticate user session');
      }
    });

    // Listen for force logout events
    this.socketService.forceLogout$.subscribe({
      next: (data) => {
        console.warn('Force logout received:', data.reason);
        this.messageService.showError('Session Terminated', 'Your session has been terminated by an administrator');
        this.auth.logout(); // Trigger logout
      }
    });

    // Listen for connection status
    this.socketService.connectionStatus$.subscribe({
      next: (status) => {
        if (status === 'disconnected') {
          // Attempt reconnection after delay
          this.attemptReconnection();
        }
      }
    });
  }

  private loadNotifications(userId: string): void {
    this.notificationService.loadInitialNotifications().subscribe({
      error: (err) => {
        console.error('Failed to load notifications:', err);
      }
    });
  }

  private attemptReconnection(): void {
    // Clear any existing reconnection attempt
    if (this.reconnectSub) {
      this.reconnectSub.unsubscribe();
    }

    // Wait 5 seconds before attempting reconnection
    this.reconnectSub = new Subscription(() => {
      setTimeout(() => {
        const user = this.auth.currentUserValue;
        const token = this.auth.authTokenData;

        if (user && token) {
          console.log('Attempting socket reconnection...');
          this.socketService.connect(token, user.organizationId, user._id);
        }
      }, 5000);
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.authSub) {
      this.authSub.unsubscribe();
    }

    if (this.reconnectSub) {
      this.reconnectSub.unsubscribe();
    }

    // Disconnect services
    this.socketService.disconnect();
    this.notificationService.disconnect();

    console.log('App component destroyed, services disconnected');
  }
}


// import { Component, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import { MainScreen } from './projectLayout/main-screen/main-screen';
// import { ToastModule } from 'primeng/toast';
// import { LoadingComponent } from "./modules/shared/components/loader.component";
// import { MasterListService } from './core/services/master-list.service';
// import { AnnouncementListenerComponent } from "./modules/shared/components/announcement-banner/announcement-banner.component";
// import { AuthService } from './modules/auth/services/auth-service';
// import { SocketService } from './core/services/socket.service';
// // import { AiAssistantComponent } from "./AIAgent/components/ai-assistant/ai-assistant";
// @Component({
//   selector: 'app-root',
//   imports: [ToastModule, RouterOutlet, LoadingComponent, AnnouncementListenerComponent],
//   templateUrl: './app.html',
//   styleUrl: './app.scss'
// })
// export class App {
//   protected readonly title = signal('apex');

//   constructor(private auth: AuthService, private socketService: SocketService, private masterList: MasterListService) {
//     this.auth.currentUser$.subscribe(user => {
//       if (user) {
//         this.socketService.connect(this.auth.authTokenData, user.organizationId,user._id);
//       } else {
//         this.socketService.disconnect();
//       }
//     });
//   }

//   ngOnInit() {
//     this.masterList.initFromCache();
//     // this.masterList.load();
//   }

// }
