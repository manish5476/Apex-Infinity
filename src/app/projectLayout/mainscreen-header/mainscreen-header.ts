// File: src/app/layouts/header/header.component.ts
// Description: Corrected component logic to work with the reactive ThemeService.

import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Select } from 'primeng/select';
// PrimeNG Modules
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
// App Services & Interfaces
import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { AuthService } from '../../modules/auth/services/auth-service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
@Component({
  selector: 'app-mainscreen-header',
  imports: [CommonModule, FormsModule,NotificationBellComponent, DialogModule, RouterModule, PopoverModule, AvatarModule, ButtonModule, SelectButtonModule, ToggleButtonModule, TooltipModule],
  templateUrl: './mainscreen-header.html',
  styleUrl: './mainscreen-header.scss',
})
export class MainscreenHeader {
  @ViewChild('op') op!: Popover;
  @Input() isMobileMenuOpen: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() mobileMenuToggle = new EventEmitter<void>();

  // currentUser$: Observable<User | null>;
  private destroy$ = new Subject<void>();
  showNotificationdialog: boolean = false
  // --- Theme State Management ---
  isDarkMode: boolean = false;
  accentColor: string = '#3B82F6';

  activeThemeClass: string = 'theme-blue';
  themeOptions: any[];
  // --- Notifications ---
  recentNotifications: any[] = [];
  showNotificationDialog = false;


  colorThemes = [
    // Tailwind palette inspired
    { name: 'Indigo', color: '#6366f1', class: 'theme-indigo' },
    { name: 'Slate', color: '#64748b', class: 'theme-slate' },
    { name: 'Red', color: '#ef4444', class: 'theme-red' },
    { name: 'Orange', color: '#f97316', class: 'theme-orange' },
    { name: 'Amber', color: '#f59e0b', class: 'theme-amber' },
    { name: 'Yellow', color: '#eab308', class: 'theme-yellow' },
    { name: 'Lime', color: '#84cc16', class: 'theme-lime' },
    { name: 'Green', color: '#22c55e', class: 'theme-green' },
    { name: 'Emerald', color: '#10b981', class: 'theme-emerald' },
    { name: 'Teal', color: '#14b8a6', class: 'theme-teal' },
    { name: 'Cyan', color: '#06b6d4', class: 'theme-cyan' },
    { name: 'Sky', color: '#0ea5e9', class: 'theme-sky' },
    { name: 'Blue', color: '#3b82f6', class: 'theme-blue' },
    { name: 'Violet', color: '#8b5cf6', class: 'theme-violet' },
    { name: 'Purple', color: '#a855f7', class: 'theme-purple' },
    { name: 'Fuchsia', color: '#d946ef', class: 'theme-fuchsia' },
    { name: 'Pink', color: '#ec4899', class: 'theme-pink' },
    { name: 'Rose', color: '#f43f5e', class: 'theme-rose' },

    // Retro set
    { name: 'Retro Burgundy', color: '#8b2635', class: 'theme-retro-burgundy' },
    { name: 'Retro Forest', color: '#2d5016', class: 'theme-retro-forest' },
    { name: 'Retro Navy', color: '#1e3a5f', class: 'theme-retro-navy' },
    { name: 'Retro Copper', color: '#b87333', class: 'theme-retro-copper' },
    { name: 'Retro Plum', color: '#6b4c57', class: 'theme-retro-plum' },
    { name: 'Retro Sage', color: '#87a96b', class: 'theme-retro-sage' },

    // Old / Modern / Premium additions
    { name: 'Old School', color: '#a05f2c', class: 'theme-oldschool' },
    { name: 'Retro Pop', color: '#ff8800', class: 'theme-retro-pop' },
    { name: 'Modern Minimal', color: '#2563eb', class: 'theme-modern' },
    { name: 'Classic Elegant', color: '#8b6f47', class: 'theme-classic' },
    { name: 'Premium Luxe', color: '#ffd700', class: 'theme-premium' },

    // The new "best of best"
    { name: 'Retro Pop+', color: '#ff8800', class: 'theme-retro-pop' },
    { name: 'Modern Glass', color: '#0099ff', class: 'theme-modern-glass' },
    { name: 'Classic Royal', color: '#a67c00', class: 'theme-classic-royal' },
    { name: 'Elegant Noir', color: '#ff4081', class: 'theme-elegant-noir' },
    { name: 'Festive India', color: '#ff6600', class: 'theme-festive-india' },

    { name: 'Neo Brutalist', color: '#f8ff00', class: 'theme-neobrutalist' },
    { name: 'Classic', color: '#005A9C', class: 'theme-classic' },
    { name: 'Vaporwave', color: '#FF71CE', class: 'theme-vaporwave' },
    { name: 'Forest', color: '#2F4F4F', class: 'theme-forest' },
    { name: 'Monochrome', color: '#333333', class: 'theme-monochrome' },
    { name: 'Solarized', color: '#268BD2', class: 'theme-solarized' },

  ];

  constructor(
    private notificationService: NotificationService,
    private AuthService: AuthService,
    private themeService: ThemeService
  ) {
    // this.currentUser$ = this.authService.currentUser$;
    this.themeOptions = [
      { icon: 'pi pi-sun', value: false },
      { icon: 'pi pi-moon', value: true }
    ];
  }

  ngOnInit() {
    // ✅ 1. Setup Theme Subscriptions
    this.themeService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: ThemeSettings) => {
        this.isDarkMode = settings.isDarkMode;
        this.activeThemeClass = settings.themeClass;
        this.accentColor = settings.accentColor;
      });

    // ✅ 2. Connect to Notifications
    const user = this.AuthService.getCurrentUser();
    if (user && user._id) {
      this.notificationService.connect(user._id);

      // ✅ 3. Subscribe to new notifications reactively
      this.notificationService.notifications$
        .pipe(takeUntil(this.destroy$))
        .subscribe((notifications) => {
          this.recentNotifications = notifications.slice(0, 5);
          console.log(this.recentNotifications);
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- CORRECTED Theme Control Methods ---

  onThemeModeChange(isDark: boolean): void {
    this.themeService.setDarkMode(isDark);
  }

  onAccentColorChange(colorClass: string, colorHex: string): void {
    // Call the main setTheme method with all required info
    this.themeService.setTheme(colorClass, colorHex);
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.AuthService.logout();
  }

  toggle(event: any) {
    this.op.toggle(event);
  }
}


// import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// // PrimeNG Modules
// import { AvatarModule } from 'primeng/avatar';
// import { ButtonModule } from 'primeng/button';
// import { Popover, PopoverModule } from 'primeng/popover';
// import { SelectButtonModule } from 'primeng/selectbutton';
// import { TooltipModule } from 'primeng/tooltip';
// import { DialogModule } from 'primeng/dialog';
// import { ToggleButtonModule } from 'primeng/togglebutton';
// // App Services & Interfaces
// import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';

// @Component({
//   selector: 'app-mainscreen-header',
//   // 3. --- ADD NotificationBellComponent TO IMPORTS ---
//   imports: [
//     CommonModule,
//     FormsModule,
//     DialogModule,
//     RouterModule,
//     PopoverModule,
//     AvatarModule,
//     ButtonModule,
//     SelectButtonModule,
//     ToggleButtonModule,
//     TooltipModule,
//     NotificationBellComponent
//   ],
//   templateUrl: './mainscreen-header.html',
//   styleUrl: './mainscreen-header.scss',
// })
// export class MainscreenHeader implements OnInit, OnDestroy {
//   @ViewChild('op') op!: Popover;
//   @Input() isMobileMenuOpen: boolean = false;
//   @Output() toggleSidebar = new EventEmitter<void>();
//   @Output() mobileMenuToggle = new EventEmitter<void>();

//   private destroy$ = new Subject<void>();

//   // --- Theme State Management (Unchanged) ---
//   isDarkMode: boolean = false;
//   accentColor: string = '#3B82F6';
//   activeThemeClass: string = 'theme-blue';
//   themeOptions: any[];

//   // 4. --- REMOVE OLD NOTIFICATION STATE ---
//   // recentNotifications: any[] = []; // (REMOVED)
//   // showNotificationDialog = false; // (REMOVED)

//   colorThemes = [
//     // ... (your colorThemes array is unchanged) ...
//     { name: 'Indigo', color: '#6366f1', class: 'theme-indigo' },
//     { name: 'Slate', color: '#64748b', class: 'theme-slate' },
//     { name: 'Red', color: '#ef4444', class: 'theme-red' },
//     { name: 'Orange', color: '#f97316', class: 'theme-orange' },
//     { name: 'Amber', color: '#f59e0b', class: 'theme-amber' },
//     { name: 'Yellow', color: '#eab308', class: 'theme-yellow' },
//     { name: 'Lime', color: '#84cc16', class: 'theme-lime' },
//     { name: 'Green', color: '#22c55e', class: 'theme-green' },
//     { name: 'Emerald', color: '#10b981', class: 'theme-emerald' },
//     { name: 'Teal', color: '#14b8a6', class: 'theme-teal' },
//     { name: 'Cyan', color: '#06b6d4', class: 'theme-cyan' },
//     { name: 'Sky', color: '#0ea5e9', class: 'theme-sky' },
//     { name: 'Blue', color: '#3b82f6', class: 'theme-blue' },
//     { name: 'Violet', color: '#8b5cf6', class: 'theme-violet' },
//     { name: 'Purple', color: '#a855f7', class: 'theme-purple' },
//     { name: 'Fuchsia', color: '#d946ef', class: 'theme-fuchsia' },
//     { name: 'Pink', color: '#ec4899', class: 'theme-pink' },
//     { name: 'Rose', color: '#f43f5e', class: 'theme-rose' },
//     { name: 'Retro Burgundy', color: '#8b2635', class: 'theme-retro-burgundy' },
//     { name: 'Retro Forest', color: '#2d5016', class: 'theme-retro-forest' },
//     { name: 'Retro Navy', color: '#1e3a5f', class: 'theme-retro-navy' },
//     { name: 'Retro Copper', color: '#b87333', class: 'theme-retro-copper' },
//     { name: 'Retro Plum', color: '#6b4c57', class: 'theme-retro-plum' },
//     { name: 'Retro Sage', color: '#87a96b', class: 'theme-retro-sage' },
//     { name: 'Old School', color: '#a05f2c', class: 'theme-oldschool' },
//     { name: 'Retro Pop', color: '#ff8800', class: 'theme-retro-pop' },
//     { name: 'Modern Minimal', color: '#2563eb', class: 'theme-modern' },
//     { name: 'Classic Elegant', color: '#8b6f47', class: 'theme-classic' },
//     { name: 'Premium Luxe', color: '#ffd700', class: 'theme-premium' },
//     { name: 'Retro Pop+', color: '#ff8800', class: 'theme-retro-pop' },
//     { name: 'Modern Glass', color: '#0099ff', class: 'theme-modern-glass' },
//     { name: 'Classic Royal', color: '#a67c00', class: 'theme-classic-royal' },
//     { name: 'Elegant Noir', color: '#ff4081', class: 'theme-elegant-noir' },
//     { name: 'Festive India', color: '#ff6600', class: 'theme-festive-india' },
//     { name: 'Neo Brutalist', color: '#f8ff00', class: 'theme-neobrutalist' },
//     { name: 'Classic', color: '#005A9C', class: 'theme-classic' },
//     { name: 'Vaporwave', color: '#FF71CE', class: 'theme-vaporwave' },
//     { name: 'Forest', color: '#2F4F4F', class: 'theme-forest' },
//     { name: 'Monochrome', color: '#333333', class: 'theme-monochrome' },
//     { name: 'Solarized', color: '#268BD2', class: 'theme-solarized' },
//   ];

//   constructor(
//     // 5. --- NotificationService is removed from constructor ---
//     private AuthService: AuthService,
//     private themeService: ThemeService
//   ) {
//     this.themeOptions = [
//       { icon: 'pi pi-sun', value: false },
//       { icon: 'pi pi-moon', value: true }
//     ];
//   }

//   ngOnInit() {
//     // ✅ 1. Setup Theme Subscriptions
//     this.themeService.settings$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((settings: ThemeSettings) => {
//         this.isDarkMode = settings.isDarkMode;
//         this.activeThemeClass = settings.themeClass;
//         this.accentColor = settings.accentColor;
//       });

//     // 6. --- REMOVE ALL NOTIFICATION LOGIC FROM ngOnInit ---
//     // (This is now handled by NotificationBellComponent)
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   onThemeModeChange(isDark: boolean): void {
//     this.themeService.setDarkMode(isDark);
//   }

//   onAccentColorChange(colorClass: string, colorHex: string): void {
//     this.themeService.setTheme(colorClass, colorHex);
//   }

//   getInitials(name: string): string {
//     if (!name) return '';
//     return name.split(' ')
//       .map(n => n[0])
//       .slice(0, 2)
//       .join('')
//       .toUpperCase();
//   }

//   logout(): void {
//     this.AuthService.logout();
//   }

//   toggle(event: any) {
//     this.op.toggle(event);
//   }
// }
