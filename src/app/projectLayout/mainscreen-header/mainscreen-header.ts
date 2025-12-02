import { Component, EventEmitter, Input, Output, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToggleButtonModule } from 'primeng/togglebutton';

// Services
import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';

@Component({
  selector: 'app-mainscreen-header',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent, DialogModule, RouterModule, PopoverModule, AvatarModule, ButtonModule, ToggleButtonModule, TooltipModule],
  templateUrl: './mainscreen-header.html',
  styleUrl: './mainscreen-header.scss',
})
export class MainscreenHeader implements OnInit, OnDestroy {
  @ViewChild('op') op!: Popover;
  @Input() isMobileMenuOpen: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();
  currentUser: any = null;
  showNotificationdialog: boolean = false;
  recentNotifications: any[] = [];
  isDarkMode = false;
  activeThemeId: string = 'theme-light';
  allThemes = [
    { name: "Glass", id: "theme-glass", color: "#3b82f6" },
    { name: "Light", id: "theme-light", color: "#ffffff" },
    { name: "Premium", id: "theme-premium", color: "#0d9488" },
    { name: "Titanium", id: "theme-titanium", color: "#0e7490" },
    { name: "Slate", id: "theme-slate", color: "#475569" },
    { name: "Minimal", id: "theme-minimal", color: "#e5e5e5" },
    { name: "Rose", id: "theme-rose", color: "#ec6d8a" },
    { name: "Sunset", id: "theme-sunset", color: "#f97316" },
    { name: "Luxury", id: "theme-luxury", color: "#d4af37" },
    { name: "Monochrome", id: "theme-monochrome", color: "#52525b" },
    { name: "Dark (Default)", id: "theme-dark", color: "#0f172a" },
    { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff" },
    { name: "Bold", id: "theme-bold", color: "#ff0080" },
  ];

  ngOnInit() {
    this.loadUser();
    this.themeService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: ThemeSettings) => {
        this.isDarkMode = settings.isDarkMode;
        this.activeThemeId = settings.isDarkMode ? 'theme-dark' : settings.lightThemeClass;
      });

    this.setupNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUser() {
    const storedUser = localStorage.getItem('apex_current_user');
    if (storedUser) {
      try { this.currentUser = JSON.parse(storedUser); } catch (e) { console.error(e); }
    }
  }

  private setupNotifications() {
    if (this.currentUser?.id) {
      this.notificationService.connect(this.currentUser.id);
    }
  }

  toggleDarkMode(isDark: boolean) {
    this.themeService.setDarkMode(isDark);
  }

  selectTheme(themeId: string) {
    if (themeId === 'theme-dark') {
      this.themeService.setDarkMode(true);
    } else {
      this.themeService.setLightTheme(themeId);
    }
  }

  logout() {
    this.authService.logout();
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }
}
