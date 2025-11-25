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
  imports: [
    CommonModule,
    FormsModule,
    NotificationBellComponent,
    DialogModule,
    RouterModule,
    PopoverModule,
    AvatarModule,
    ButtonModule,
    ToggleButtonModule,
    TooltipModule
  ],
  templateUrl: './mainscreen-header.html',
  styleUrl: './mainscreen-header.scss',
})
export class MainscreenHeader implements OnInit, OnDestroy {
  @ViewChild('op') op!: Popover;
  @Input() isMobileMenuOpen: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  // Dependencies
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private destroy$ = new Subject<void>();

  // State
  currentUser: any = null;
  showNotificationdialog: boolean = false;
  recentNotifications: any[] = [];
  
  // Theme State
  isDarkMode = false;
  activeThemeId: string = 'theme-light';

  // Full Theme Registry
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
    // Dark Variants
    { name: "Dark (Default)", id: "theme-dark", color: "#0f172a" },
    { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff" },
    { name: "Bold", id: "theme-bold", color: "#ff0080" },
  ];

  ngOnInit() {
    this.loadUser();
    
    // 1. Subscribe to Theme Settings (Fixes Property 'setMode' error by using reactive flow)
    this.themeService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: ThemeSettings) => {
        this.isDarkMode = settings.isDarkMode;
        
        // If dark mode is active, visual ID is 'theme-dark'.
        // Otherwise, it matches the saved custom theme class.
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

  // --- Actions ---

  /**
   * Toggles the global dark mode state.
   * If true, forces 'theme-dark'.
   * If false, restores the previous custom theme.
   */
  toggleDarkMode(isDark: boolean) {
    this.themeService.setDarkMode(isDark);
  }

  /**
   * Selects a specific theme from the grid.
   * If the user selects "Dark", we toggle the dark mode flag.
   * For any other theme (including Futuristic/Bold), we treat them as specific theme classes.
   */
  selectTheme(themeId: string) {
    if (themeId === 'theme-dark') {
      this.themeService.setDarkMode(true);
    } else {
      // This sets the specific class and ensures dark mode is OFF
      // so the specific class (e.g., 'theme-futuristic') takes precedence.
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

// import { Component, EventEmitter, Input, Output, OnInit, ViewChild, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';

// // PrimeNG
// import { AvatarModule } from 'primeng/avatar';
// import { ButtonModule } from 'primeng/button';
// import { Popover, PopoverModule } from 'primeng/popover';
// import { TooltipModule } from 'primeng/tooltip';
// import { DialogModule } from 'primeng/dialog';
// import { ToggleButtonModule } from 'primeng/togglebutton';

// // Services
// import { ThemeService, ThemeMode } from '../../core/services/theme.service';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { NotificationService } from '../../core/services/notification.service';
// import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';

// @Component({
//   selector: 'app-mainscreen-header',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     NotificationBellComponent,
//     DialogModule,
//     RouterModule,
//     PopoverModule,
//     AvatarModule,
//     ButtonModule,
//     ToggleButtonModule,
//     TooltipModule
//   ],
//   templateUrl: './mainscreen-header.html',
//   styleUrl: './mainscreen-header.scss',
// })
// export class MainscreenHeader implements OnInit {
//   @ViewChild('op') op!: Popover;
//   @Input() isMobileMenuOpen: boolean = false;
//   @Output() toggleSidebar = new EventEmitter<void>();

//   // Services
//   private themeService = inject(ThemeService);
//   private authService = inject(AuthService);
//   private notificationService = inject(NotificationService);

//   // State
//   currentUser: any = null;
//   showNotificationdialog: boolean = false;
//   recentNotifications: any[] = [];
  
//   // Theme State
//   isDarkMode = false;
//   activeThemeId: string = 'theme-glass';
//   private lastLightTheme: ThemeMode = 'theme-glass'; // Remember preference

//   // Full Theme Registry (13 Themes)
//   allThemes = [
//     { name: "Glass", id: "theme-glass", color: "#3b82f6", isDark: false },
//     { name: "Light", id: "theme-light", color: "#ffffff", isDark: false },
//     { name: "Premium", id: "theme-premium", color: "#0d9488", isDark: false },
//     { name: "Titanium", id: "theme-titanium", color: "#0e7490", isDark: false },
//     { name: "Slate", id: "theme-slate", color: "#475569", isDark: false },
//     { name: "Minimal", id: "theme-minimal", color: "#e5e5e5", isDark: false },
//     { name: "Rose", id: "theme-rose", color: "#ec6d8a", isDark: false },
//     { name: "Sunset", id: "theme-sunset", color: "#f97316", isDark: false },
//     { name: "Luxury", id: "theme-luxury", color: "#d4af37", isDark: false },
//     { name: "Monochrome", id: "theme-monochrome", color: "#52525b", isDark: false },
//     // Dark Variants
//     { name: "Dark", id: "theme-dark", color: "#0f172a", isDark: true },
//     { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff", isDark: true },
//     { name: "Bold", id: "theme-bold", color: "#ff0080", isDark: true },
//   ];

//   ngOnInit() {
//     this.loadUser();
//     this.setupThemeSync();
//     this.setupNotifications();
//   }

//   private loadUser() {
//     const storedUser = localStorage.getItem('apex_current_user');
//     if (storedUser) {
//       try { this.currentUser = JSON.parse(storedUser); } catch (e) { console.error(e); }
//     }
//   }

//   private setupThemeSync() {
//     // 1. Initial Sync
//     const current = this.themeService.currentMode;
//     this.activeThemeId = current;
//     this.isDarkMode = this.isThemeDark(current);

//     // 2. Determine last light theme (for toggle logic)
//     if (!this.isDarkMode && current !== 'auto') {
//       this.lastLightTheme = current;
//     }
//   }

//   private setupNotifications() {
//     if (this.currentUser?.id) {
//       this.notificationService.connect(this.currentUser.id);
//       // Assuming notifications$ is an observable
//       // In a real app, use async pipe or proper subscription management
//     }
//   }

//   // --- Actions ---

//   toggleDarkMode(isDark: boolean) {
//     if (isDark) {
//       // Switch to default dark
//       this.themeService.setMode('theme-dark');
//       this.activeThemeId = 'theme-dark';
//     } else {
//       // Revert to last known light theme
//       this.themeService.setMode(this.lastLightTheme);
//       this.activeThemeId = this.lastLightTheme;
//     }
//   }

//   selectTheme(themeId: string) {
//     const selected = this.allThemes.find(t => t.id === themeId);
//     if (!selected) return;

//     this.activeThemeId = themeId;
//     this.isDarkMode = selected.isDark;
    
//     // Update memory
//     if (!selected.isDark) {
//       this.lastLightTheme = themeId as ThemeMode;
//     }

//     this.themeService.setMode(themeId as ThemeMode);
//   }

//   logout() {
//     this.authService.logout();
//   }

//   // Helpers
//   getInitials(name: string): string {
//     return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
//   }

//   private isThemeDark(id: string): boolean {
//     return ['theme-dark', 'theme-futuristic', 'theme-bold'].includes(id);
//   }
// }

// // import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { RouterModule } from '@angular/router';
// // import { Subject } from 'rxjs';
// // import { takeUntil } from 'rxjs/operators';

// // // PrimeNG Modules
// // import { AvatarModule } from 'primeng/avatar';
// // import { ButtonModule } from 'primeng/button';
// // import { Popover, PopoverModule } from 'primeng/popover';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { DialogModule } from 'primeng/dialog';
// // import { ToggleButtonModule } from 'primeng/togglebutton';

// // // App Services
// // import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
// // import { AuthService } from '../../modules/auth/services/auth-service';
// // import { NotificationService } from '../../core/services/notification.service';
// // import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';

// // @Component({
// //   selector: 'app-mainscreen-header',
// //   imports: [
// //     CommonModule, 
// //     FormsModule, 
// //     NotificationBellComponent, 
// //     DialogModule, 
// //     RouterModule, 
// //     PopoverModule, 
// //     AvatarModule, 
// //     ButtonModule, 
// //     ToggleButtonModule, 
// //     TooltipModule
// //   ],
// //   templateUrl: './mainscreen-header.html',
// //   styleUrl: './mainscreen-header.scss',
// // })
// // export class MainscreenHeader implements OnInit, OnDestroy {
// //   @ViewChild('op') op!: Popover;
// //   @Input() isMobileMenuOpen: boolean = false;
// //   @Output() toggleSidebar = new EventEmitter<void>();
// //   @Output() mobileMenuToggle = new EventEmitter<void>();

// //   private destroy$ = new Subject<void>();
// //   showNotificationdialog: boolean = false;

// //   // --- User Data ---
// //   currentUser: any = null;

// //   // --- Theme State ---
// //   isDarkMode: boolean = false;
// //   activeLightThemeClass: string = 'theme-light';

// //   // --- Notifications ---
// //   recentNotifications: any[] = [];

// //   // Theme Definitions
// //   lightThemes = [
// //     { name: "Light", class: "theme-light", color: "#2563eb" },
// //     { name: "Premium", class: "theme-premium", color: "#0d9488" },
// //     { name: "Glass", class: "theme-glass", color: "#3b82f6" },
// //     { name: "Minimal", class: "theme-minimal", color: "#000000" },
// //     { name: "Monochrome", class: "theme-monochrome", color: "#262626" },
// //     { name: "Luxury", class: "theme-luxury", color: "#d4af37" },
// //     { name: "Slate", class: "theme-slate", color: "#475569" },
// //     { name: "Titanium", class: "theme-titanium", color: "#0e7490" },
// //     { name: "Rose", class: "theme-rose", color: "#ec6d8a" },
// //     { name: "Sunset", class: "theme-sunset", color: "#f97316" },
// //   ];

// //   constructor(
// //     private notificationService: NotificationService,
// //     private authService: AuthService,
// //     private themeService: ThemeService
// //   ) {}

// //   ngOnInit() {
// //     // 1. Get User Data from Local Storage (Corrected)
// //     this.loadUser();

// //     // 2. Setup Theme
// //     this.themeService.settings$
// //       .pipe(takeUntil(this.destroy$))
// //       .subscribe((settings: ThemeSettings) => {
// //         this.isDarkMode = settings.isDarkMode;
// //         this.activeLightThemeClass = settings.lightThemeClass;
// //       });

// //     // 3. Connect Notifications
// //     if (this.currentUser && this.currentUser.id) {
// //       this.notificationService.connect(this.currentUser.id);
// //       this.notificationService.notifications$
// //         .pipe(takeUntil(this.destroy$))
// //         .subscribe((notifications) => {
// //           this.recentNotifications = notifications.slice(0, 5);
// //         });
// //     }
// //   }

// //   ngOnDestroy() {
// //     this.destroy$.next();
// //     this.destroy$.complete();
// //   }

// //   loadUser() {
// //     const storedUser = localStorage.getItem('apex_current_user');
// //     if (storedUser) {
// //       try {
// //         this.currentUser = JSON.parse(storedUser);
// //       } catch (e) {
// //         console.error('Error parsing user data', e);
// //       }
// //     }
// //   }

// //   onThemeModeChange(isDark: boolean): void {
// //     this.themeService.setDarkMode(isDark);
// //   }

// //   onLightThemeChange(themeClass: string): void {
// //     this.themeService.setLightTheme(themeClass);
// //   }

// //   getInitials(name: string): string {
// //     if (!name) return 'U';
// //     return name.split(' ')
// //       .map(n => n[0])
// //       .slice(0, 2)
// //       .join('')
// //       .toUpperCase();
// //   }

// //   logout(): void {
// //     this.authService.logout();
// //   }
// // }
