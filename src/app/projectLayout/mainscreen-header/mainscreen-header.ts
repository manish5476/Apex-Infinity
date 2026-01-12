// mainscreen-header.ts
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
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

// Services & Components
import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
import { LayoutService } from '../layout.service';

// Interfaces for Type Safety
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
    CommonModule, 
    FormsModule, 
    RouterModule,
    AvatarModule, 
    ButtonModule, 
    TooltipModule, 
    ToggleButtonModule, 
    PopoverModule,
    NotificationBellComponent
  ],
  templateUrl: './mainscreen-header.html',
  styleUrl: './mainscreen-header.scss',
})
export class MainscreenHeader implements OnInit, OnDestroy {
  // Inputs & Outputs
  @Input() isMobileMenuOpen: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  @ViewChild('profilePopover') profilePopover!: Popover;
  @ViewChild('notificationPopover') notificationPopover!: Popover;

  // Dependency Injection
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private layout = inject(LayoutService);
  private destroy$ = new Subject<void>();

  // State
  activePopoverTab: 'settings' | 'notifications' = 'settings';
  currentUser: any = null;
  recentNotifications: any[] = [];
  
  // Theme State
  isDarkMode = false;
  activeThemeId: string = 'theme-light';
  themeGroups: ThemeGroup[] = [];

  // Complete Theme Data Source (ALL themes from your tokens)
  allThemes: Theme[] = [
    // Core Themes
    { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "core", description: "Modern glassmorphism design" },
    { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean light mode" },
    { name: "Dark", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Professional dark mode" },
    { name: "Auto", id: "auto-theme", color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", category: "core", description: "Auto-detects system preference" },
{ 
  name: "Bio Frost", 
  id: "theme-bio-frost", 
  color: "#34d399", 
  gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)", 
  category: "core", 
  description: "Milky white glass with emerald organic accents" 
},
    // Professional Themes
    { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Premium teal theme" },
    { name: "Titanium", id: "theme-titanium", color: "#0e7490", gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)", category: "professional", description: "Metallic blue theme" },
    { name: "Slate", id: "theme-slate", color: "#475569", gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", category: "professional", description: "Cool gray theme" },
    { name: "Data Science", id: "theme-data-science", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", category: "professional", description: "Analytics optimized" },
    { name: "Cobalt Steel", id: "theme-cobalt-steel", color: "#0ea5e9", gradient: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)", category: "professional", description: "Professional blue theme" },

    // Minimal Themes
    { name: "Minimal", id: "theme-minimal", color: "#e5e5e5", gradient: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)", category: "minimal", description: "Clean monochrome" },
    { name: "Monochrome", id: "theme-monochrome", color: "#52525b", gradient: "linear-gradient(135deg, #52525b 0%, #71717a 100%)", category: "minimal", description: "True black & white" },

    // Colorful Themes
    { name: "Rose", id: "theme-rose", color: "#ec6d8a", gradient: "linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)", category: "colorful", description: "Soft pink theme" },
    { name: "Sunset", id: "theme-sunset", color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", category: "colorful", description: "Warm orange theme" },
    { name: "Bold", id: "theme-bold", color: "#ff00ff", gradient: "linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)", category: "colorful", description: "High contrast neon theme" },

    // Luxury Themes
    { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)", category: "luxury", description: "Gold luxury theme" },
    { name: "Futuristic", id: "theme-futuristic", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)", category: "luxury", description: "Cyberpunk theme" },
    { name: "Midnight Royal", id: "theme-midnight-royal", color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #8b5cf6 100%)", category: "luxury", description: "Purple luxury dark theme" },
    { name: "Emerald Regal", id: "theme-emerald-regal", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", category: "luxury", description: "Green luxury theme" },

    // Modern Themes
    { name: "Material You", id: "theme-material-you", color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #e879f9 100%)", category: "modern", description: "Android 12 design" },
    { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft UI design" },
    { name: "Deep Space", id: "theme-deep-space", color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #22d3ee 100%)", category: "modern", description: "Astronomy inspired dark theme" }
  ];

  // Mock Data
  mockNotifications = [
    { id: 1, title: 'New Member Request', message: 'John Doe wants to join your organization', time: '2 min ago', read: false, type: 'info' },
    { id: 2, title: 'Task Completed', message: 'Project "Dashboard Redesign" has been completed', time: '1 hour ago', read: false, type: 'success' },
    { id: 3, title: 'System Update', message: 'Scheduled maintenance in 30 minutes', time: '3 hours ago', read: true, type: 'warning' },
    { id: 4, title: 'New Message', message: 'You have a new message from Sarah', time: '5 hours ago', read: true, type: 'info' },
  ];

  ngOnInit() {
    this.organizeThemes();
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
      this.recentNotifications = n.filter(x => !x.isRead);
      if (this.recentNotifications.length === 0) {
        this.recentNotifications = this.mockNotifications.filter(n => !n.read);
      }
    });

    // Subscribe to Theme Settings
    this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
      this.isDarkMode = s.isDarkMode;
      this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
    });
  }

  // Grouping Logic
  organizeThemes() {
    // Fix: Ensure all categories are properly defined
    const categoryMapping: Record<string, string> = {
      'core': 'Core',
      'professional': 'Professional', 
      'minimal': 'Minimal',
      'colorful': 'Colorful',
      'luxury': 'Luxury',
      'modern': 'Modern',
      'system': 'System',
      'dark': 'Dark'
    };

    // Extract unique categories from actual themes
    const categories = [...new Set(this.allThemes.map(t => t.category))];
    
    // Create the grouped structure with proper category names
    this.themeGroups = categories.map(cat => ({
      category: categoryMapping[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
      themes: this.allThemes.filter(t => t.category === cat)
    }));
  }

  onMenuToggle() {
    if (this.layout.isMobile()) {
      this.layout.toggleMobile();
    } else {
      this.layout.togglePin();
    }
    this.toggleSidebar.emit();
  }

  toggleDarkMode(isDark: boolean) { 
    this.themeService.setDarkMode(isDark); 
  }

  selectTheme(id: string) {
    if (id === 'theme-dark') {
      this.themeService.setDarkMode(true);
    } else if (id === 'auto-theme') {
      // Handle auto theme - detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeService.setDarkMode(prefersDark);
      this.activeThemeId = prefersDark ? 'theme-dark' : 'theme-light';
    } else {
      this.themeService.setLightTheme(id);
      this.themeService.setDarkMode(false);
      this.activeThemeId = id;
    }
  }

  // Randomize from the full list
  randomTheme() {
    const availableThemes = this.allThemes.filter(theme => theme.id !== this.activeThemeId);
    if (availableThemes.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * availableThemes.length);
    const randomTheme = availableThemes[randomIndex];
    this.selectTheme(randomTheme.id);
  }

  resetToDefault() {
    this.selectTheme('theme-light');
    this.themeService.setDarkMode(false);
  }

  logout() { 
    this.authService.logout(); 
    this.closeAllPopovers();
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }

  loadNotifications() {
    // Refresh notifications if needed
    // this.notificationService.refreshNotifications();
  }

  clearAllNotifications() {
    if (this.recentNotifications.length === 0) return;
    this.notificationService.markAllAsRead();
    this.recentNotifications = [];
  }

  markAllAsRead() {
    this.recentNotifications.forEach(notification => {
      notification.read = true;
    });
    this.notificationService.markAllAsRead();
  }

  getNotificationIconClass(type: string): string {
    switch(type) {
      case 'success': return 'pi pi-check-circle';
      case 'warning': return 'pi pi-exclamation-triangle';
      case 'error': return 'pi pi-times-circle';
      default: return 'pi pi-info-circle';
    }
  }

  getNotificationIcon(type: string): string {
    switch(type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  }

  closeAllPopovers() {
    if (this.profilePopover) this.profilePopover.hide();
    if (this.notificationPopover) this.notificationPopover.hide();
  }

  ngOnDestroy() { 
    this.destroy$.next(); 
    this.destroy$.complete(); 
  }
}

// // mainscreen-header.ts
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
// import { PopoverModule, Popover } from 'primeng/popover'; // Added Popover type

// // Services & Components
// import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { NotificationService } from '../../core/services/notification.service';
// import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
// import { LayoutService } from '../layout.service';

// // 1. Interfaces for Type Safety
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
//   imports: [
//     CommonModule, 
//     FormsModule, 
//     RouterModule,
//     AvatarModule, 
//     ButtonModule, 
//     TooltipModule, 
//     ToggleButtonModule, 
//     PopoverModule,
//     NotificationBellComponent
//   ],
//   templateUrl: './mainscreen-header.html',
//   styleUrl: './mainscreen-header.scss',
// })
// export class MainscreenHeader implements OnInit, OnDestroy {
//   // Inputs & Outputs
//   @Input() isMobileMenuOpen: boolean = false;
//   @Output() toggleSidebar = new EventEmitter<void>();

//   @ViewChild('profilePopover') profilePopover!: Popover;
//   @ViewChild('notificationPopover') notificationPopover!: Popover;

//   // Dependency Injection (Modern Style)
//   private themeService = inject(ThemeService);
//   private authService = inject(AuthService);
//   private notificationService = inject(NotificationService);
//   private layout = inject(LayoutService);
//   private destroy$ = new Subject<void>();

//   // State
//   activePopoverTab: 'settings' | 'notifications' = 'settings';
//   currentUser: any = null;
//   recentNotifications: any[] = [];
  
//   // Theme State
//   isDarkMode = false;
//   activeThemeId: string = 'theme-light';
//   themeGroups: ThemeGroup[] = []; // Grouped data for the UI

//   // 2. Full Theme Data Source
//   allThemes: Theme[] = [
//     // Core Themes
//     { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "modern", description: "Modern glassmorphism design" },
//     { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean light mode" },
//     { name: "Dark (Default)", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Professional dark mode" },

//     // Professional Themes
//     { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Premium teal theme" },
//     { name: "Titanium", id: "theme-titanium", color: "#0e7490", gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)", category: "professional", description: "Metallic blue theme" },
//     { name: "Slate", id: "theme-slate", color: "#475569", gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", category: "professional", description: "Cool gray theme" },

//     // Minimal Themes
//     { name: "Minimal", id: "theme-minimal", color: "#e5e5e5", gradient: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)", category: "minimal", description: "Clean monochrome" },
//     { name: "Monochrome", id: "theme-monochrome", color: "#52525b", gradient: "linear-gradient(135deg, #52525b 0%, #71717a 100%)", category: "minimal", description: "True black & white" },

//     // Colorful Themes
//     { name: "Rose", id: "theme-rose", color: "#ec6d8a", gradient: "linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)", category: "colorful", description: "Soft pink theme" },
//     { name: "Sunset", id: "theme-sunset", color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", category: "colorful", description: "Warm orange theme" },
//     { name: "Bold", id: "theme-bold", color: "#ff0080", gradient: "linear-gradient(135deg, #ff0080 0%, #00ffff 100%)", category: "colorful", description: "High contrast theme" },

//     // Luxury Themes
//     { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)", category: "luxury", description: "Gold luxury theme" },
//     { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff", gradient: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)", category: "luxury", description: "Cyberpunk theme" },

//     // New Trending Themes
//     { name: "Midnight Royal", id: "theme-midnight-royal", color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)", category: "luxury", description: "Purple luxury dark" },
//     { name: "Emerald Regal", id: "theme-emerald-regal", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", category: "luxury", description: "Green luxury theme" },
//     { name: "Material You", id: "theme-material-you", color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #e879f9 100%)", category: "modern", description: "Android 12 design" },
//     { name: "Data Science", id: "theme-data-science", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", category: "professional", description: "Analytics optimized" },
//     { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft UI design" }
//   ];

//   // Mock Data
//   mockNotifications = [
//     { id: 1, title: 'New Member Request', message: 'John Doe wants to join your organization', time: '2 min ago', read: false, type: 'info' },
//     { id: 2, title: 'Task Completed', message: 'Project "Dashboard Redesign" has been completed', time: '1 hour ago', read: false, type: 'success' },
//     { id: 3, title: 'System Update', message: 'Scheduled maintenance in 30 minutes', time: '3 hours ago', read: true, type: 'warning' },
//     { id: 4, title: 'New Message', message: 'You have a new message from Sarah', time: '5 hours ago', read: true, type: 'info' },
//   ];

//   ngOnInit() {
//     this.organizeThemes();
//     this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);
//     this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
//       this.recentNotifications = n.filter(x => !x.isRead);
//       if (this.recentNotifications.length === 0) {
//         this.recentNotifications = this.mockNotifications.filter(n => !n.read);
//       }
//     });

//     // Subscribe to Theme Settings
//     this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
//       this.isDarkMode = s.isDarkMode;
//       this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
//     });
//   }

//   // 4. Grouping Logic
//   organizeThemes() {
//     // Extract unique categories
//     const categories = [...new Set(this.allThemes.map(t => t.category))];
    
//     // Create the grouped structure
//     this.themeGroups = categories.map(cat => ({
//       category: cat.charAt(0).toUpperCase() + cat.slice(1), // Capitalize
//       themes: this.allThemes.filter(t => t.category === cat)
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
//     } else {
//       this.themeService.setLightTheme(id);
//       this.themeService.setDarkMode(false);
//     }
//     this.activeThemeId = id;
//   }

//   // Randomize from the full list
//   randomTheme() {
//     const availableThemes = this.allThemes.filter(theme => theme.id !== this.activeThemeId);
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
//     // Hook for refreshing API if needed
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
//     switch(type) {
//       case 'success': return 'pi pi-check-circle';
//       case 'warning': return 'pi pi-exclamation-triangle';
//       case 'error': return 'pi pi-times-circle';
//       default: return 'pi pi-info-circle';
//     }
//   }

//   getNotificationIcon(type: string): string {
//     switch(type) {
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
//     this.destroy$.next(); 
//     this.destroy$.complete(); 
//   }
// }














































// // allThemes: Theme[] = [
// //   // Core Themes
// //   { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "core", description: "Modern glassmorphism design" },
// //   { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean light mode" },
// //   { name: "Dark (Default)", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Professional dark mode" },
// //   { name: "Auto", id: "auto-theme", color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", category: "core", description: "Auto-detects system preference" },

// //   // Professional Themes
// //   { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Premium teal theme" },
// //   { name: "Titanium", id: "theme-titanium", color: "#0e7490", gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)", category: "professional", description: "Metallic blue theme" },
// //   { name: "Slate", id: "theme-slate", color: "#475569", gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", category: "professional", description: "Cool gray theme" },
// //   { name: "Data Science", id: "theme-data-science", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", category: "professional", description: "Analytics optimized" },
// //   { name: "Cobalt Steel", id: "theme-cobalt-steel", color: "#0ea5e9", gradient: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)", category: "professional", description: "Professional blue theme" },

// //   // Minimal Themes
// //   { name: "Minimal", id: "theme-minimal", color: "#e5e5e5", gradient: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)", category: "minimal", description: "Clean monochrome" },
// //   { name: "Monochrome", id: "theme-monochrome", color: "#52525b", gradient: "linear-gradient(135deg, #52525b 0%, #71717a 100%)", category: "minimal", description: "True black & white" },

// //   // Colorful Themes
// //   { name: "Rose", id: "theme-rose", color: "#ec6d8a", gradient: "linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)", category: "colorful", description: "Soft pink theme" },
// //   { name: "Sunset", id: "theme-sunset", color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", category: "colorful", description: "Warm orange theme" },
// //   { name: "Bold", id: "theme-bold", color: "#ff00ff", gradient: "linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)", category: "colorful", description: "High contrast neon theme" },

// //   // Luxury Themes
// //   { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)", category: "luxury", description: "Gold luxury theme" },
// //   { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff", gradient: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)", category: "luxury", description: "Cyberpunk theme" },
// //   { name: "Midnight Royal", id: "theme-midnight-royal", color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #8b5cf6 100%)", category: "luxury", description: "Purple luxury dark" },
// //   { name: "Emerald Regal", id: "theme-emerald-regal", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", category: "luxury", description: "Green luxury theme" },

// //   // Modern & Trending Themes
// //   { name: "Material You", id: "theme-material-you", color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #e879f9 100%)", category: "modern", description: "Android 12 design" },
// //   { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft UI design" },
// //   { name: "Deep Space", id: "theme-deep-space", color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #22d3ee 100%)", category: "modern", description: "Astronomy inspired dark theme" },

// //   // NEWLY ADDED THEMES FROM YOUR TOKENS
// //   { name: "Auto Theme", id: "auto-theme", color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", category: "system", description: "Adapts to system preferences" },
// //   { name: "Neumorphic Light", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Modern soft UI design" },
// //   { name: "Material You Pink", id: "theme-material-you", color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #e879f9 100%)", category: "modern", description: "Android 12+ design language" },
// //   { name: "Midnight Royal", id: "theme-midnight-royal", color: "#a78bfa", gradient: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #8b5cf6 100%)", category: "luxury", description: "Dark purple luxury theme" },
// //   { name: "Data Science Pro", id: "theme-data-science", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", category: "professional", description: "Optimized for data visualization" },
// //   { name: "Deep Space Explorer", id: "theme-deep-space", color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #22d3ee 100%)", category: "dark", description: "Space-themed dark mode" },
// //   { name: "Emerald Royal", id: "theme-emerald-regal", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", category: "luxury", description: "Green luxury theme" },
// //   { name: "Cobalt Professional", id: "theme-cobalt-steel", color: "#0ea5e9", gradient: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)", category: "professional", description: "Professional blue theme" },
  
// //   // Additional Enhanced Themes
// //   { name: "Glass Pro", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(145deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.96) 100%)", category: "modern", description: "Enhanced glassmorphism" },
// //   { name: "Premium Teal", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)", category: "professional", description: "Rich teal gradient" },
// //   { name: "Luxury Gold", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(180deg, #fefce8 0%, #fef3c7 100%)", category: "luxury", description: "Warm gold luxury" },
// //   { name: "Slate Professional", id: "theme-slate", color: "#475569", gradient: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)", category: "professional", description: "Cool blue-gray professional" },
// //   { name: "Titanium Cyan", id: "theme-titanium", color: "#0e7490", gradient: "linear-gradient(180deg, #ecfeff 0%, #cffafe 100%)", category: "professional", description: "Deep cyan metallic" },
// //   { name: "Rose Petal", id: "theme-rose", color: "#db2777", gradient: "linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)", category: "colorful", description: "Soft pink gradient" },
// //   { name: "Sunset Glow", id: "theme-sunset", color: "#ea580c", gradient: "linear-gradient(180deg, #fffbeb 0%, #fed7aa 100%)", category: "colorful", description: "Warm orange sunset" },
// //   { name: "Futuristic Blue", id: "theme-futuristic", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)", category: "modern", description: "Cyberpunk blue theme" },
// //   { name: "Bold Neon", id: "theme-bold", color: "#ff00ff", gradient: "linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)", category: "colorful", description: "High contrast neon" },
// //   { name: "Minimal White", id: "theme-minimal", color: "#fafafa", gradient: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)", category: "minimal", description: "Clean white minimal" },
// //   { name: "Monochrome Gray", id: "theme-monochrome", color: "#404040", gradient: "linear-gradient(135deg, #404040 0%, #525252 100%)", category: "minimal", description: "True monochrome" }
// // ];

// // // Updated theme presets for quick selection
// // themePresets = [
// //   { id: 'theme-light', name: 'Light', gradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
// //   { id: 'theme-dark', name: 'Dark', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
// //   { id: 'theme-premium', name: 'Premium', gradient: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' },
// //   { id: 'theme-glass', name: 'Glass', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' },
// //   { id: 'theme-luxury', name: 'Luxury', gradient: 'linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)' },
// //   { id: 'theme-rose', name: 'Rose', gradient: 'linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)' },
// //   { id: 'auto-theme', name: 'Auto', gradient: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)' },
// //   { id: 'theme-material-you', name: 'Material You', gradient: 'linear-gradient(135deg, #db2777 0%, #e879f9 100%)' },
// //   { id: 'theme-data-science', name: 'Data Science', gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
// //   { id: 'theme-neumorphic', name: 'Neumorphic', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
// //   { id: 'theme-midnight-royal', name: 'Midnight', gradient: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)' },
// //   { id: 'theme-emerald-regal', name: 'Emerald', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
// //   { id: 'theme-deep-space', name: 'Deep Space', gradient: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #22d3ee 100%)' },
// //   { id: 'theme-cobalt-steel', name: 'Cobalt', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)' }
// // ];

// // // Updated accent colors for customization
// // accentColors = [
// //   { name: 'Indigo', value: '#6366f1' },
// //   { name: 'Green', value: '#10b981' },
// //   { name: 'Amber', value: '#f59e0b' },
// //   { name: 'Violet', value: '#8b5cf6' },
// //   { name: 'Rose', value: '#ef4444' },
// //   { name: 'Blue', value: '#3b82f6' },
// //   { name: 'Cyan', value: '#06b6d4' },
// //   { name: 'Teal', value: '#0d9488' },
// //   { name: 'Emerald', value: '#10b981' },
// //   { name: 'Fuchsia', value: '#db2777' },
// //   { name: 'Gold', value: '#d4af37' },
// //   { name: 'Silver', value: '#94a3b8' }
// // ];