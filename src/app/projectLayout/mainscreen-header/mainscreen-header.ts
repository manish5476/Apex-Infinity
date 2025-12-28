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
import { ToggleButtonModule } from 'primeng/togglebutton';

import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
import { Dialog } from "primeng/dialog";
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-mainscreen-header',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    AvatarModule, ButtonModule, PopoverModule, TooltipModule, ToggleButtonModule,
    NotificationBellComponent // Import the bell component
    ,
    Dialog
],
  templateUrl: './mainscreen-header.html',
  styleUrl: './mainscreen-header.scss',
})
export class MainscreenHeader implements OnInit, OnDestroy {
  @Input() isMobileMenuOpen: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();
showNotificationdialog:boolean=false
  currentUser: any = null;
  recentNotifications: any[] = [];
  layout = inject(LayoutService);

  onMenuToggle() {
    if (this.layout.isMobile()) {
      this.layout.toggleMobile();
    } else {
      this.layout.togglePin();
    }
  }
  // Popover State
  activeTab: 'settings' | 'notifications' = 'settings';

  // Theme State
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
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);
    
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
      this.recentNotifications = n.filter(x => !x.isRead);
    });

    this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
      this.isDarkMode = s.isDarkMode;
      this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass;
    });
  }

  togglePopover(op: Popover, event: Event) {
    op.toggle(event);
  }

  // Optional: Open directly to notifications tab
  openNotifications(op: Popover, event: Event) {
    this.activeTab = 'notifications';
    op.toggle(event);
  }

  toggleDarkMode(isDark: boolean) { this.themeService.setDarkMode(isDark); }
  
  selectTheme(id: string) {
    if (id === 'theme-dark') this.themeService.setDarkMode(true);
    else this.themeService.setLightTheme(id);
  }

  logout() { this.authService.logout(); }
  
  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}