import {
  Component, EventEmitter, Input, Output,
  OnInit, OnDestroy, inject, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PopoverModule, Popover } from 'primeng/popover';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { SliderModule } from 'primeng/slider';

// Services & Components
import { ThemeService, ThemeSettings, BACKGROUND_PATTERNS, BackgroundPattern } from '../../core/services/theme.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
import { LayoutService } from '../layout.service';
import { SIDEBAR_MENU } from '../mainscreensidebar/menu-items.constants';
import { CommonMethodService } from '@core/utils/common-method.service';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';

export interface Theme {
  name: string;
  id: string;
  color: string;
  gradient: string;
  category: string;
  description: string;
}

export interface ThemeGroup {
  category: string;
  themes: Theme[];
}

@Component({
  selector: 'app-mainscreen-header',
  standalone: true,
  imports: [
    CommonModule, TieredMenuModule, FormsModule, RouterModule,
    AvatarModule, ButtonModule, TooltipModule, ToggleButtonModule,
    PopoverModule, NotificationBellComponent, HasPermissionDirective,
    SliderModule,
  ],
  templateUrl: './mainscreen-header.html',
  styleUrl: './mainscreen-header.scss',
})
export class MainscreenHeader implements OnInit, OnDestroy {
  readonly PERMISSIONS = PERMISSIONS;

  public commonMethod = inject(CommonMethodService);
  @Input() isMobileMenuOpen: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  @ViewChild('profilePopover') profilePopover!: Popover;
  @ViewChild('notificationPopover') notificationPopover!: Popover;
  profileViewMode: 'popover' | 'dialog' = 'popover';
  profileDialogVisible = false;

  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private layout = inject(LayoutService);
  private destroy$ = new Subject<void>();

  // ── State ──────────────────────────────────────────────────────────────────
  activePopoverTab: 'settings' | 'notifications' = 'settings';
  currentUser: any = null;
  recentNotifications: any[] = [];

  // Theme state
  isDarkMode = false;
  activeThemeId: string = 'theme-light';
  textScale: number = 100;
  themeGroups: ThemeGroup[] = [];
  mobileMenuItems: any;

  // Pattern state
  activePatternId: string = 'none';
  patternOpacityPercent: number = 100; // 0-100 for slider
  activePatternTab: 'css' | 'svg' | 'gradient' = 'css';

  readonly patternGroups = this.themeService.patternGroups;
  readonly allPatterns = BACKGROUND_PATTERNS;

  mockNotifications = [
    { id: 1, title: 'New Member Request', message: 'John Doe wants to join your organization', time: '2 min ago', read: false, type: 'info' },
    { id: 2, title: 'Task Completed', message: 'Project "Dashboard Redesign" has been completed', time: '1 hour ago', read: false, type: 'success' },
    { id: 3, title: 'System Update', message: 'Scheduled maintenance in 30 minutes', time: '3 hours ago', read: true, type: 'warning' },
    { id: 4, title: 'New Message', message: 'You have a new message from Sarah', time: '5 hours ago', read: true, type: 'info' },
  ];

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit() {
    this.organizeThemes();
    this.mobileMenuItems = SIDEBAR_MENU;

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.currentUser = u);

    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((n: any) => {
        const safe = Array.isArray(n) ? n : (n?.data || n?.notifications || []);
        this.recentNotifications = safe.filter((x: any) => !x.isRead);
        if (this.recentNotifications.length === 0) {
          this.recentNotifications = this.mockNotifications.filter(m => !m.read);
        }
      });

    this.themeService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s: ThemeSettings) => {
        this.isDarkMode = s.isDarkMode;
        this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
        if (s.textScale) this.textScale = s.textScale;
        this.activePatternId = s.patternId;
        this.patternOpacityPercent = Math.round(s.patternOpacity * 100);
      });
  }

  ngOnDestroy() {
    this.destroy$?.next();
    this.destroy$?.complete();
  }

  // ── Theme methods ───────────────────────────────────────────────────────────

  organizeThemes() {
    const categoryMapping: Record<string, string> = {
      core: 'Core', professional: 'Professional', minimal: 'Minimal',
      colorful: 'Colorful', luxury: 'Luxury', modern: 'Modern',
      system: 'System', dark: 'Dark'
    };
    const categories = [...new Set(this.commonMethod.allThemes.map((t: any) => t.category))];
    this.themeGroups = categories.map(cat => ({
      category: categoryMapping[cat as string] || (cat as string).charAt(0).toUpperCase() + (cat as string).slice(1),
      themes: this.commonMethod.allThemes.filter((t: any) => t.category === cat)
    }));
  }

  onMenuToggle() {
    if (this.layout.isMobile()) this.layout.toggleMobile();
    else this.layout.togglePin();
    this.toggleSidebar.emit();
  }

  toggleDarkMode(isDark: boolean) {
    this.themeService.setDarkMode(isDark);
  }

  selectTheme(id: string) {
    if (id === 'theme-dark') {
      this.themeService.setDarkMode(true);
    } else if (id === 'auto-theme') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeService.setDarkMode(prefersDark);
      this.activeThemeId = prefersDark ? 'theme-dark' : 'theme-light';
    } else {
      this.themeService.setLightTheme(id);
      this.themeService.setDarkMode(false);
      this.activeThemeId = id;
    }
  }

  updateTextScale(event: Event) {
    const input = event.target as HTMLInputElement;
    this.themeService.setTextScale(parseInt(input.value, 10));
  }

  randomTheme() {
    const available = this.commonMethod.allThemes.filter((t: any) => t.id !== this.activeThemeId);
    if (!available.length) return;
    const random = available[Math.floor(Math.random() * available.length)];
    this.selectTheme(random.id);
  }

  resetToDefault() {
    this.selectTheme('theme-light');
    this.themeService.setDarkMode(false);
  }

  // ── Pattern methods ─────────────────────────────────────────────────────────

  selectPattern(id: string) {
    this.activePatternId = id;
    this.themeService.setPattern(id);
  }

  onPatternOpacityChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.patternOpacityPercent = value;
    this.themeService.setPatternOpacity(value / 100);
  }

  resetPattern() {
    this.themeService.resetPattern();
  }

  getPatternsForTab(tab: 'css' | 'svg' | 'gradient'): BackgroundPattern[] {
    return this.allPatterns.filter(p => p.type === tab);
  }

  // ── Auth & misc ─────────────────────────────────────────────────────────────

  logout() {
    this.authService.logout();
    this.closeAllPopovers();
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }

  clearAllNotifications() {
    if (!this.recentNotifications.length) return;
    this.notificationService.markAllAsRead();
    this.recentNotifications = [];
  }

  markAllAsRead() {
    this.recentNotifications.forEach(n => n.read = true);
    this.notificationService.markAllAsRead();
  }

  getNotificationIconClass(type: string): string {
    const map: Record<string, string> = {
      success: 'pi pi-check-circle',
      warning: 'pi pi-exclamation-triangle',
      error: 'pi pi-times-circle',
    };
    return map[type] || 'pi pi-info-circle';
  }

  closeAllPopovers() {
    this.profilePopover?.hide();
    this.notificationPopover?.hide();
  }

  closeProfilePanel(): void {
    this.profilePopover?.hide();
    this.profileDialogVisible = false;
  }

  setProfileView(mode: 'popover' | 'dialog'): void {
    this.profileViewMode = mode;
    if (mode === 'dialog') {
      this.profilePopover.hide();
      setTimeout(() => { this.profileDialogVisible = true; }, 80);
    } else {
      this.profileDialogVisible = false;
    }
  }

  onPopoverHide(): void { }

  onProfilePillClick(event: Event, popover: Popover): void {
    if (this.profileViewMode === 'dialog') this.profileDialogVisible = true;
    else popover.toggle(event);
  }
}

// import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// import { Subject, takeUntil } from 'rxjs';

// // PrimeNG
// import { AvatarModule } from 'primeng/avatar';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ToggleButtonModule } from 'primeng/togglebutton';
// import { PopoverModule, Popover } from 'primeng/popover';
// import { TieredMenuModule } from 'primeng/tieredmenu';

// // Services & Components
// import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { NotificationService } from '../../core/services/notification.service';
// import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
// import { LayoutService } from '../layout.service';
// import { SIDEBAR_MENU } from '../mainscreensidebar/menu-items.constants';
// import { Dialog } from "primeng/dialog";
// import { CommonMethodService } from '@core/utils/common-method.service';
// import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
// import { PERMISSIONS } from '@core/auth/permissions.constants';

// // Interfaces for Type Safety
// export interface Theme {
//   name: string;
//   id: string;
//   color: string;
//   gradient: string;
//   category: string;
//   description: string;
// }

// export interface ThemeGroup {
//   category: string;
//   themes: Theme[];
// }

// @Component({
//   selector: 'app-mainscreen-header',
//   standalone: true,
//   imports: [CommonModule, TieredMenuModule, FormsModule, RouterModule, AvatarModule, ButtonModule, TooltipModule, ToggleButtonModule, PopoverModule, NotificationBellComponent, HasPermissionDirective],
//   templateUrl: './mainscreen-header.html',
//   styleUrl: './mainscreen-header.scss',
// })
// export class MainscreenHeader implements OnInit, OnDestroy {
//   readonly PERMISSIONS = PERMISSIONS;

//   // Inputs & Outputs
//   public theme = inject(CommonMethodService)
//   @Input() isMobileMenuOpen: boolean = false;
//   @Output() toggleSidebar = new EventEmitter<void>();

//   @ViewChild('profilePopover') profilePopover!: Popover;
//   @ViewChild('notificationPopover') notificationPopover!: Popover;
//   profileViewMode: 'popover' | 'dialog' = 'popover';
//   profileDialogVisible = false;

//   // Dependency Injection
//   private themeService = inject(ThemeService);
//   private authService = inject(AuthService);
//   private notificationService = inject(NotificationService);
//   private layout = inject(LayoutService);
//   private destroy$ = new Subject<void>();

//   textScale: number = 100;

//   // State
//   activePopoverTab: 'settings' | 'notifications' = 'settings';
//   currentUser: any = null;
//   recentNotifications: any[] = [];

//   // Theme State
//   isDarkMode = false;
//   activeThemeId: string = 'theme-light';
//   themeGroups: ThemeGroup[] = [];
//   mobileMenuItems: any;

//   mockNotifications = [
//     { id: 1, title: 'New Member Request', message: 'John Doe wants to join your organization', time: '2 min ago', read: false, type: 'info' },
//     { id: 2, title: 'Task Completed', message: 'Project "Dashboard Redesign" has been completed', time: '1 hour ago', read: false, type: 'success' },
//     { id: 3, title: 'System Update', message: 'Scheduled maintenance in 30 minutes', time: '3 hours ago', read: true, type: 'warning' },
//     { id: 4, title: 'New Message', message: 'You have a new message from Sarah', time: '5 hours ago', read: true, type: 'info' },
//   ];



//   ngOnInit() {
//     this.organizeThemes();
//     this.mobileMenuItems = SIDEBAR_MENU;

//     this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);

//     this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe((n: any) => {
//       const safeNotifications = Array.isArray(n) ? n : (n?.data || n?.notifications || []);
//       this.recentNotifications = safeNotifications.filter((x: any) => !x.isRead);

//       if (this.recentNotifications.length === 0) {
//         this.recentNotifications = this.mockNotifications.filter(mock => !mock.read);
//       }
//     });

//     this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
//       this.isDarkMode = s.isDarkMode;
//       this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
//       if (s.textScale) {
//         this.textScale = s.textScale;
//       }
//     });
//   }

//   updateTextScale(event: Event) {
//     const input = event.target as HTMLInputElement;
//     const value = parseInt(input.value, 10);
//     this.themeService.setTextScale(value);
//   }

//   organizeThemes() {
//     const categoryMapping: Record<string, string> = {
//       'core': 'Core',
//       'professional': 'Professional',
//       'minimal': 'Minimal',
//       'colorful': 'Colorful',
//       'luxury': 'Luxury',
//       'modern': 'Modern',
//       'system': 'System',
//       'dark': 'Dark'
//     };

//     const categories = [...new Set(this.theme.allThemes.map(t => t.category))];

//     this.themeGroups = categories.map(cat => ({
//       category: categoryMapping[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
//       themes: this.theme.allThemes.filter(t => t.category === cat)
//     }));
//   }

//   onMenuToggle() {
//     if (this.layout.isMobile()) {
//       this.layout.toggleMobile();
//     } else {
//       this.layout.togglePin();
//     }
//     this.toggleSidebar.emit();
//   }

//   toggleDarkMode(isDark: boolean) {
//     this.themeService.setDarkMode(isDark);
//   }

//   selectTheme(id: string) {
//     if (id === 'theme-dark') {
//       this.themeService.setDarkMode(true);
//     } else if (id === 'auto-theme') {
//       const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       this.themeService.setDarkMode(prefersDark);
//       this.activeThemeId = prefersDark ? 'theme-dark' : 'theme-light';
//     } else {
//       this.themeService.setLightTheme(id);
//       this.themeService.setDarkMode(false);
//       this.activeThemeId = id;
//     }
//   }

//   randomTheme() {
//     const availableThemes = this.theme.allThemes.filter(theme => theme.id !== this.activeThemeId);
//     if (availableThemes.length === 0) return;

//     const randomIndex = Math.floor(Math.random() * availableThemes.length);
//     const randomTheme = availableThemes[randomIndex];
//     this.selectTheme(randomTheme.id);
//   }

//   resetToDefault() {
//     this.selectTheme('theme-light');
//     this.themeService.setDarkMode(false);
//   }

//   logout() {
//     this.authService.logout();
//     this.closeAllPopovers();
//   }

//   getInitials(name: string): string {
//     return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
//   }

//   loadNotifications() {
//     // Refresh notifications if needed
//   }

//   clearAllNotifications() {
//     if (this.recentNotifications.length === 0) return;
//     this.notificationService.markAllAsRead();
//     this.recentNotifications = [];
//   }

//   markAllAsRead() {
//     this.recentNotifications.forEach(notification => {
//       notification.read = true;
//     });
//     this.notificationService.markAllAsRead();
//   }

//   getNotificationIconClass(type: string): string {
//     switch (type) {
//       case 'success': return 'pi pi-check-circle';
//       case 'warning': return 'pi pi-exclamation-triangle';
//       case 'error': return 'pi pi-times-circle';
//       default: return 'pi pi-info-circle';
//     }
//   }

//   getNotificationIcon(type: string): string {
//     switch (type) {
//       case 'success': return 'success';
//       case 'warning': return 'warning';
//       case 'error': return 'error';
//       default: return 'info';
//     }
//   }

//   closeAllPopovers() {
//     if (this.profilePopover) this.profilePopover.hide();
//     if (this.notificationPopover) this.notificationPopover.hide();
//   }

//   ngOnDestroy() {
//     this.destroy$?.next();
//     this.destroy$?.complete();
//   }

//   onProfilePillClick(event: Event, popover: Popover): void {
//     if (this.profileViewMode === 'dialog') {
//       this.profileDialogVisible = true;
//     } else {
//       popover.toggle(event);
//     }
//   }

//   /**
//  * Called by the toggle buttons inside the panel header.
//  * Switches between compact (popover) and expanded (dialog) modes.
//  */
//   setProfileView(mode: 'popover' | 'dialog'): void {
//     this.profileViewMode = mode;

//     if (mode === 'dialog') {
//       // Close popover and re-open as dialog
//       this.profilePopover.hide();
//       setTimeout(() => { this.profileDialogVisible = true; }, 80);
//     } else {
//       // Close dialog — next pill click will open popover
//       this.profileDialogVisible = false;
//     }
//   }

//   /**
//    * Unified close — works for both popover and dialog contexts.
//    * Call this wherever you previously called profilePopover.hide().
//    */
//   closeProfilePanel(): void {
//     this.profilePopover?.hide();
//     this.profileDialogVisible = false;
//   }

//   /**
//    * Called when the popover hides via outside-click or ESC.
//    * Use to sync any state if needed.
//    */
//   onPopoverHide(): void {
//     // no-op by default; extend if needed
//   }

// }
