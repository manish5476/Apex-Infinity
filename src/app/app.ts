import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { Subject, take, takeUntil } from 'rxjs'; // ✅ Added Subject and takeUntil
import { LoadingComponent } from "./modules/shared/components/loader.component";
import { MasterListService } from './core/services/master-list.service';
import { AnnouncementListenerComponent } from "./modules/shared/components/announcement-banner/announcement-banner.component";
import { AuthService } from './modules/auth/services/auth-service';
import { SocketService } from './core/services/socket.service';
import { NotificationService } from './core/services/notification.service';
import { AppMessageService } from './core/services/message.service';
import { AiAssistantComponent } from "./AIAgent/components/ai-assistant/ai-assistant";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToastModule, RouterOutlet, LoadingComponent, AiAssistantComponent, AnnouncementListenerComponent],
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

  private destroy$ = new Subject<void>(); // ✅ The proper way to clean up RxJS

  constructor() {
    this.setupAuthListener();
  }

  ngOnInit() {
    this.masterList.initFromCache();
  }

  private setupAuthListener(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          const token = this.auth.authTokenData;
          if (user && user._id && user.organizationId && token) {
            this.socketService.connect(token, user.organizationId, user._id);
            this.notificationService.loadInitialNotifications().pipe(take(1)).subscribe();
          } else {
            this.socketService.disconnect();
          }
        },
        error: (err) => this.messageService.handleHttpError(err)
      });

    this.socketService.forceLogout$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.warn('Force logout received:', data.reason);
          this.messageService.showError('Your session has been terminated by an administrator');
          this.auth.logout();
        }
      });

    // ❌ REMOVED: Your manual attemptReconnection() loop. 
    // Socket.io natively handles reconnections automatically. 
    // Manual loops fight the framework and cause infinite loops.
  }

  private loadNotifications(): void {
    this.notificationService.loadInitialNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to load notifications:', err)
      });
  }

  ngOnDestroy(): void {
    // ✅ Safely kills all subscriptions instantly
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }
}