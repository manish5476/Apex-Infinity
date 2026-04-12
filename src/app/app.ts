import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from "primeng/confirmdialog";
import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './modules/auth/services/auth-service';
import { SocketConnectionService } from '@core/services/socket/socket-connection.service';
import { NotificationService } from './core/services/notification.service';
import { MasterListService } from './core/services/master-list.service';
import { AppMessageService } from './core/services/message.service';
import { LoadingComponent } from "./modules/shared/components/loader.component";
import { AnnouncementListenerComponent } from "./modules/shared/components/announcement-banner/announcement-banner.component";
import { TabKeyboardService } from './Tabbing';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ToastModule,
    RouterOutlet,
    ConfirmDialog,
    LoadingComponent,
    AnnouncementListenerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private themeService = inject(ThemeService);
  private auth = inject(AuthService);
  private socketService = inject(SocketConnectionService);
  private notificationService = inject(NotificationService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  private readonly tabKeyboardService = inject(TabKeyboardService);
  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const token = this.auth.authTokenData;
      if (user && user._id && user.organizationId && token) {
        this.socketService.connect(token, user.organizationId, user._id);
        this.loadNotifications();
      } else {
        this.socketService.disconnect();
      }
    });
  }

  ngOnInit() {
    // Set default theme as requested
    this.themeService.setLightTheme('theme-aurora');
    this.tabKeyboardService.init();
    this.masterList.initFromCache();
    this.setupForceLogoutListener();
  }

  private setupForceLogoutListener(): void {
    this.socketService.forceLogout$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.messageService.showError('Your session has been terminated by an administrator');
          this.auth.logout();
        }
      });
  }

  private loadNotifications(): void {
    this.notificationService.loadInitialNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to load notifications:', err)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }
}
