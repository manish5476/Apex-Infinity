
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleButtonModule } from 'primeng/togglebutton';

import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-mainscreen-header',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    AvatarModule, ButtonModule, DialogModule, TooltipModule, ToggleButtonModule,
    NotificationBellComponent
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
  private layout = inject(LayoutService);

  // Dialog states
  showProfileDialog: boolean = false;
  showNotificationDialog: boolean = false;
  
  // Dialog tab state
  activeDialogTab: 'settings' | 'notifications' = 'settings';

  currentUser: any = null;
  recentNotifications: any[] = [];

  // Theme State
  isDarkMode = false;
  activeThemeId: string = 'theme-light';
  
allThemes = [
    // Core Themes
    { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "modern", description: "Modern glassmorphism design" },
    { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean light mode" },
    { name: "Dark (Default)", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Professional dark mode" },

    // Professional Themes
    { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Premium teal theme" },
    { name: "Titanium", id: "theme-titanium", color: "#0e7490", gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)", category: "professional", description: "Metallic blue theme" },
    { name: "Slate", id: "theme-slate", color: "#475569", gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", category: "professional", description: "Cool gray theme" },

    // Minimal Themes
    { name: "Minimal", id: "theme-minimal", color: "#e5e5e5", gradient: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)", category: "minimal", description: "Clean monochrome" },
    { name: "Monochrome", id: "theme-monochrome", color: "#52525b", gradient: "linear-gradient(135deg, #52525b 0%, #71717a 100%)", category: "minimal", description: "True black & white" },

    // Colorful Themes
    { name: "Rose", id: "theme-rose", color: "#ec6d8a", gradient: "linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)", category: "colorful", description: "Soft pink theme" },
    { name: "Sunset", id: "theme-sunset", color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", category: "colorful", description: "Warm orange theme" },
    { name: "Bold", id: "theme-bold", color: "#ff0080", gradient: "linear-gradient(135deg, #ff0080 0%, #00ffff 100%)", category: "colorful", description: "High contrast theme" },

    // Luxury Themes
    { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)", category: "luxury", description: "Gold luxury theme" },
    { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff", gradient: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)", category: "luxury", description: "Cyberpunk theme" },

    // New Trending Themes
    { name: "Midnight Royal", id: "theme-midnight-royal", color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)", category: "luxury", description: "Purple luxury dark" },
    { name: "Emerald Regal", id: "theme-emerald-regal", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", category: "luxury", description: "Green luxury theme" },
    { name: "Material You", id: "theme-material-you", color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #e879f9 100%)", category: "modern", description: "Android 12 design" },
    { name: "Data Science", id: "theme-data-science", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", category: "professional", description: "Analytics optimized" },
    { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft UI design" }
  ];

  // Theme presets for quick selection
  themePresets = [
    { id: 'theme-light', name: 'Light', gradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
    { id: 'theme-dark', name: 'Dark', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
    { id: 'theme-premium', name: 'Premium', gradient: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' },
    { id: 'theme-glass', name: 'Glass', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' },
    { id: 'theme-luxury', name: 'Luxury', gradient: 'linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)' },
    { id: 'theme-rose', name: 'Rose', gradient: 'linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)' },
  ];

  // Accent colors for customization
  accentColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Green', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
  ];

  // Mock notifications for demo
  mockNotifications = [
    { id: 1, title: 'New Member Request', message: 'John Doe wants to join your organization', time: '2 min ago', read: false, type: 'info' },
    { id: 2, title: 'Task Completed', message: 'Project "Dashboard Redesign" has been completed', time: '1 hour ago', read: false, type: 'success' },
    { id: 3, title: 'System Update', message: 'Scheduled maintenance in 30 minutes', time: '3 hours ago', read: true, type: 'warning' },
    { id: 4, title: 'New Message', message: 'You have a new message from Sarah', time: '5 hours ago', read: true, type: 'info' },
  ];

  ngOnInit() {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);

    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
      this.recentNotifications = n.filter(x => !x.isRead);
      // If no real notifications, use mock data for demo
      if (this.recentNotifications.length === 0) {
        this.recentNotifications = this.mockNotifications.filter(n => !n.read);
      }
    });

    this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
      this.isDarkMode = s.isDarkMode;
      this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
    });
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
    } else {
      this.themeService.setLightTheme(id);
      this.themeService.setDarkMode(false);
    }
    this.activeThemeId = id;
  }

  logout() { 
    this.authService.logout(); 
    this.showProfileDialog = false;
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }

  // === ENHANCED METHODS ===

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

  setAccentColor(color: string) {
    console.log(`Setting accent color to: ${color}`);
    document.documentElement.style.setProperty('--accent-primary', color);
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

  // Open profile dialog with specific tab
  openProfileDialog(tab: 'settings' | 'notifications' = 'settings') {
    this.activeDialogTab = tab;
    this.showProfileDialog = true;
  }

  ngOnDestroy() { 
    this.destroy$.next(); 
    this.destroy$.complete(); 
  }
}
// import { Component, EventEmitter, Input, Output, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// import { Subject, takeUntil } from 'rxjs';

// // PrimeNG
// import { AvatarModule } from 'primeng/avatar';
// import { ButtonModule } from 'primeng/button';
// import { Popover, PopoverModule } from 'primeng/popover';
// import { TooltipModule } from 'primeng/tooltip';
// import { ToggleButtonModule } from 'primeng/togglebutton';
// import { Dialog } from "primeng/dialog";

// import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { NotificationService } from '../../core/services/notification.service';
// import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
// import { LayoutService } from '../layout.service';

// @Component({
//   selector: 'app-mainscreen-header',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, RouterModule,
//     AvatarModule, ButtonModule, PopoverModule, TooltipModule, ToggleButtonModule,
//     NotificationBellComponent,
//     Dialog
//   ],
//   templateUrl: './mainscreen-header.html',
//   styleUrl: './mainscreen-header.scss',
// })
// export class MainscreenHeader implements OnInit, OnDestroy {
//   @Input() isMobileMenuOpen: boolean = false;
//   @Output() toggleSidebar = new EventEmitter<void>();

//   private themeService = inject(ThemeService);
//   private authService = inject(AuthService);
//   private notificationService = inject(NotificationService);
//   private destroy$ = new Subject<void>();
//   private layout = inject(LayoutService);

//   showNotificationdialog: boolean = false;
//   currentUser: any = null;
//   recentNotifications: any[] = [];

//   // Popover State
//   activeTab: 'settings' | 'notifications' = 'settings';

//   // Theme State
//   isDarkMode = false;
//   activeThemeId: string = 'theme-light';
  
//   // Enhanced Themes Array with Categories
//   allThemes = [
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

//   // Theme presets for quick selection
//   themePresets = [
//     { id: 'theme-light', name: 'Light', gradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
//     { id: 'theme-dark', name: 'Dark', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
//     { id: 'theme-premium', name: 'Premium', gradient: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' },
//     { id: 'theme-glass', name: 'Glass', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' },
//     { id: 'theme-luxury', name: 'Luxury', gradient: 'linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)' },
//     { id: 'theme-rose', name: 'Rose', gradient: 'linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)' },
//     { id: 'theme-material-you', name: 'Material', gradient: 'linear-gradient(135deg, #db2777 0%, #e879f9 100%)' },
//     { id: 'theme-futuristic', name: 'Futuristic', gradient: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)' },
//   ];

//   // Accent colors for customization
//   accentColors = [
//     { name: 'Indigo', value: '#6366f1' },
//     { name: 'Green', value: '#10b981' },
//     { name: 'Amber', value: '#f59e0b' },
//     { name: 'Violet', value: '#8b5cf6' },
//     { name: 'Rose', value: '#ef4444' },
//     { name: 'Blue', value: '#3b82f6' },
//     { name: 'Teal', value: '#0d9488' },
//     { name: 'Purple', value: '#9333ea' },
//   ];

//   // Mock notifications for demo
//   mockNotifications = [
//     { id: 1, title: 'New Member Request', message: 'John Doe wants to join your organization', time: '2 min ago', read: false, type: 'info' },
//     { id: 2, title: 'Task Completed', message: 'Project "Dashboard Redesign" has been completed', time: '1 hour ago', read: false, type: 'success' },
//     { id: 3, title: 'System Update', message: 'Scheduled maintenance in 30 minutes', time: '3 hours ago', read: true, type: 'warning' },
//     { id: 4, title: 'New Message', message: 'You have a new message from Sarah', time: '5 hours ago', read: true, type: 'info' },
//   ];

//   ngOnInit() {
//     this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);

//     this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
//       this.recentNotifications = n.filter(x => !x.isRead);
//       // If no real notifications, use mock data for demo
//       if (this.recentNotifications.length === 0) {
//         this.recentNotifications = this.mockNotifications.filter(n => !n.read);
//       }
//     });

//     this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
//       this.isDarkMode = s.isDarkMode;
//       this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
      
//       // Update theme preset selection
//       this.updateThemePresetSelection();
//     });

//     // Initialize with current theme
//     this.updateThemePresetSelection();
//   }

//   onMenuToggle() {
//     if (this.layout.isMobile()) {
//       this.layout.toggleMobile();
//     } else {
//       this.layout.togglePin();
//     }
//     this.toggleSidebar.emit();
//   }

//   togglePopover(op: Popover, event: Event) {
//     op.toggle(event);
//   }

//   // Optional: Open directly to notifications tab
//   openNotifications(op: Popover, event: Event) {
//     this.activeTab = 'notifications';
//     op.toggle(event);
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

//   logout() { 
//     this.authService.logout(); 
//   }

//   getInitials(name: string): string {
//     return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
//   }

//   // === ENHANCED THEME METHODS ===

//   /**
//    * Selects a random theme from all available themes
//    */
//   randomTheme() {
//     const availableThemes = this.allThemes.filter(theme => theme.id !== this.activeThemeId);
    
//     if (availableThemes.length === 0) return;
    
//     const randomIndex = Math.floor(Math.random() * availableThemes.length);
//     const randomTheme = availableThemes[randomIndex];
    
//     this.selectTheme(randomTheme.id);
    
//     // Optional: Show toast notification
//     console.log(`🎨 Random theme selected: ${randomTheme.name}`);
//   }

//   /**
//    * Resets theme to system default (Light theme)
//    */
//   resetToDefault() {
//     this.selectTheme('theme-light');
//     this.themeService.setDarkMode(false);
    
//     // Optional: Show toast notification
//     console.log('🔁 Theme reset to default: Light');
//   }

//   /**
//    * Updates theme preset selection based on current theme
//    */
//   updateThemePresetSelection() {
//     // Ensure activeThemeId matches a valid preset
//     const validPreset = this.themePresets.find(preset => preset.id === this.activeThemeId);
//     if (!validPreset && this.activeThemeId !== 'theme-dark') {
//       // If current theme is not in presets, add it to the first position
//       const currentTheme = this.allThemes.find(theme => theme.id === this.activeThemeId);
//       if (currentTheme) {
//         this.themePresets.unshift({
//           id: currentTheme.id,
//           name: currentTheme.name,
//           gradient: currentTheme.gradient
//         });
//       }
//     }
//   }

//   /**
//    * Set accent color for the theme
//    */
//   setAccentColor(color: string) {
//     // This would typically call a theme service method to update accent color
//     console.log(`🎨 Setting accent color to: ${color}`);
//     // this.themeService.setAccentColor(color);
    
//     // For demo purposes, we'll just log it
//     // In a real implementation, you would update CSS custom properties
//     document.documentElement.style.setProperty('--accent-primary', color);
//     document.documentElement.style.setProperty('--accent-secondary', this.adjustColorBrightness(color, 20));
//   }

//   /**
//    * Adjust color brightness
//    */
//   private adjustColorBrightness(color: string, percent: number): string {
//     // Simple color brightness adjustment
//     // This is a simplified version - in production use a proper color library
//     return color;
//   }

//   /**
//    * Clears all notifications
//    */
//   clearAllNotifications() {
//     if (this.recentNotifications.length === 0) return;
    
//     this.notificationService.markAllAsRead();
//     this.recentNotifications = [];
    
//     // Show visual feedback
//     console.log('🗑️ All notifications cleared');
//   }

//   /**
//    * Marks all notifications as read
//    */
//   markAllAsRead() {
//     this.recentNotifications.forEach(notification => {
//       notification.read = true;
//     });
    
//     // In a real app, you would call notificationService.markAllAsRead()
//     console.log('✅ All notifications marked as read');
//   }

//   /**
//    * Get themes organized by category
//    */
//   getThemesByCategory() {
//     const categories = [
//       {
//         name: "Core Themes",
//         themes: this.allThemes.filter(t => t.category === 'core')
//       },
//       {
//         name: "Professional",
//         themes: this.allThemes.filter(t => t.category === 'professional')
//       },
//       {
//         name: "Modern",
//         themes: this.allThemes.filter(t => t.category === 'modern')
//       },
//       {
//         name: "Luxury",
//         themes: this.allThemes.filter(t => t.category === 'luxury')
//       },
//       {
//         name: "Colorful",
//         themes: this.allThemes.filter(t => t.category === 'colorful')
//       },
//       {
//         name: "Minimal",
//         themes: this.allThemes.filter(t => t.category === 'minimal')
//       }
//     ];
    
//     // Filter out empty categories
//     return categories.filter(category => category.themes.length > 0);
//   }

//   /**
//    * Opens the notification dialog
//    */
//   openNotificationDialog() {
//     this.showNotificationdialog = true;
//   }

//   /**
//    * Closes the notification dialog
//    */
//   closeNotificationDialog() {
//     this.showNotificationdialog = false;
//   }

//   /**
//    * Toggles between dark and light mode
//    */
//   toggleDarkLightMode() {
//     this.themeService.setDarkMode(!this.isDarkMode);
//   }

//   /**
//    * Get theme by ID
//    */
//   getThemeById(id: string) {
//     return this.allThemes.find(theme => theme.id === id);
//   }

//   /**
//    * Get current theme name
//    */
//   getCurrentThemeName(): string {
//     const theme = this.getThemeById(this.activeThemeId);
//     return theme ? theme.name : 'Unknown Theme';
//   }

//   /**
//    * Opens profile settings
//    */
//   openProfile() {
//     // Navigate to profile page
//     console.log('👤 Opening profile settings');
//     // this.router.navigate(['/profile']);
//   }

//   /**
//    * Export theme settings
//    */
//   exportSettings() {
//     const settings = {
//       themeId: this.activeThemeId,
//       isDarkMode: this.isDarkMode,
//       timestamp: new Date().toISOString()
//     };
    
//     const dataStr = JSON.stringify(settings, null, 2);
//     const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
//     const exportFileDefaultName = `theme-settings-${new Date().toISOString().split('T')[0]}.json`;
    
//     const linkElement = document.createElement('a');
//     linkElement.setAttribute('href', dataUri);
//     linkElement.setAttribute('download', exportFileDefaultName);
//     linkElement.click();
    
//     console.log('📤 Theme settings exported');
//   }

//   /**
//    * Import theme settings
//    */
//   importSettings() {
//     // Create a file input element
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = '.json';
    
//     input.onchange = (event: any) => {
//       const file = event.target.files[0];
//       if (file) {
//         const reader = new FileReader();
//         reader.onload = (e: any) => {
//           try {
//             const settings = JSON.parse(e.target.result);
            
//             if (settings.themeId) {
//               this.selectTheme(settings.themeId);
//             }
            
//             if (settings.isDarkMode !== undefined) {
//               this.toggleDarkMode(settings.isDarkMode);
//             }
            
//             console.log('📥 Theme settings imported successfully');
//           } catch (error) {
//             console.error('❌ Error importing settings:', error);
//           }
//         };
//         reader.readAsText(file);
//       }
//     };
    
//     input.click();
//   }

//   /**
//    * Get notification icon class
//    */
//   getNotificationIconClass(type: string): string {
//     switch(type) {
//       case 'success': return 'pi pi-check-circle';
//       case 'warning': return 'pi pi-exclamation-triangle';
//       case 'error': return 'pi pi-times-circle';
//       default: return 'pi pi-info-circle';
//     }
//   }

//   /**
//    * Get notification icon color class
//    */
//   getNotificationIcon(type: string): string {
//     switch(type) {
//       case 'success': return 'success';
//       case 'warning': return 'warning';
//       case 'error': return 'error';
//       default: return 'info';
//     }
//   }

//   ngOnDestroy() { 
//     this.destroy$.next(); 
//     this.destroy$.complete(); 
//   }
// }

// // import { Component, EventEmitter, Input, Output, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { RouterModule } from '@angular/router';
// // import { Subject, takeUntil } from 'rxjs';

// // // PrimeNG
// // import { AvatarModule } from 'primeng/avatar';
// // import { ButtonModule } from 'primeng/button';
// // import { Popover, PopoverModule } from 'primeng/popover';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { ToggleButtonModule } from 'primeng/togglebutton';

// // import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
// // import { AuthService } from '../../modules/auth/services/auth-service';
// // import { NotificationService } from '../../core/services/notification.service';
// // import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
// // import { Dialog } from "primeng/dialog";
// // import { LayoutService } from '../layout.service';

// // @Component({
// //   selector: 'app-mainscreen-header',
// //   standalone: true,
// //   imports: [
// //     CommonModule, FormsModule, RouterModule,
// //     AvatarModule, ButtonModule, PopoverModule, TooltipModule, ToggleButtonModule,
// //     NotificationBellComponent // Import the bell component
// //     ,
// //     Dialog
// //   ],
// //   templateUrl: './mainscreen-header.html',
// //   styleUrl: './mainscreen-header.scss',
// // })
// // export class MainscreenHeader implements OnInit, OnDestroy {
// //   @Input() isMobileMenuOpen: boolean = false;
// //   @Output() toggleSidebar = new EventEmitter<void>();

// //   private themeService = inject(ThemeService);
// //   private authService = inject(AuthService);
// //   private notificationService = inject(NotificationService);
// //   private destroy$ = new Subject<void>();
// //   showNotificationdialog: boolean = false
// //   currentUser: any = null;
// //   recentNotifications: any[] = [];
// //   layout = inject(LayoutService);

// //   onMenuToggle() {
// //     if (this.layout.isMobile()) {
// //       this.layout.toggleMobile();
// //     } else {
// //       this.layout.togglePin();
// //     }
// //   }
// //   // Popover State
// //   activeTab: 'settings' | 'notifications' = 'settings';

// //   // Theme State
// //   isDarkMode = false;
// //   activeThemeId: string = 'theme-light';
  
// //   // Enhanced Themes Array with Categories
// //   allThemes = [
// //     // Core Themes
// //     { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "modern", description: "Modern glassmorphism design" },
// //     { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean light mode" },
// //     { name: "Dark (Default)", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Professional dark mode" },

// //     // Professional Themes
// //     { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Premium teal theme" },
// //     { name: "Titanium", id: "theme-titanium", color: "#0e7490", gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)", category: "professional", description: "Metallic blue theme" },
// //     { name: "Slate", id: "theme-slate", color: "#475569", gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", category: "professional", description: "Cool gray theme" },

// //     // Minimal Themes
// //     { name: "Minimal", id: "theme-minimal", color: "#e5e5e5", gradient: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)", category: "minimal", description: "Clean monochrome" },
// //     { name: "Monochrome", id: "theme-monochrome", color: "#52525b", gradient: "linear-gradient(135deg, #52525b 0%, #71717a 100%)", category: "minimal", description: "True black & white" },

// //     // Colorful Themes
// //     { name: "Rose", id: "theme-rose", color: "#ec6d8a", gradient: "linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)", category: "colorful", description: "Soft pink theme" },
// //     { name: "Sunset", id: "theme-sunset", color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", category: "colorful", description: "Warm orange theme" },
// //     { name: "Bold", id: "theme-bold", color: "#ff0080", gradient: "linear-gradient(135deg, #ff0080 0%, #00ffff 100%)", category: "colorful", description: "High contrast theme" },

// //     // Luxury Themes
// //     { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)", category: "luxury", description: "Gold luxury theme" },
// //     { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff", gradient: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)", category: "luxury", description: "Cyberpunk theme" },

// //     // New Trending Themes
// //     { name: "Midnight Royal", id: "theme-midnight-royal", color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)", category: "luxury", description: "Purple luxury dark" },
// //     { name: "Emerald Regal", id: "theme-emerald-regal", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", category: "luxury", description: "Green luxury theme" },
// //     { name: "Material You", id: "theme-material-you", color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #e879f9 100%)", category: "modern", description: "Android 12 design" },
// //     { name: "Data Science", id: "theme-data-science", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", category: "professional", description: "Analytics optimized" },
// //     { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft UI design" }
// //   ];

// //   ngOnInit() {
// //     this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);

// //     this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
// //       this.recentNotifications = n.filter(x => !x.isRead);
// //     });

// //     this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
// //       this.isDarkMode = s.isDarkMode;
// //       this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass;
// //     });
// //   }

// //   togglePopover(op: Popover, event: Event) {
// //     op.toggle(event);
// //   }

// //   // Optional: Open directly to notifications tab
// //   openNotifications(op: Popover, event: Event) {
// //     this.activeTab = 'notifications';
// //     op.toggle(event);
// //   }

// //   toggleDarkMode(isDark: boolean) { 
// //     this.themeService.setDarkMode(isDark); 
// //   }

// //   selectTheme(id: string) {
// //     if (id === 'theme-dark') {
// //       this.themeService.setDarkMode(true);
// //     } else {
// //       this.themeService.setLightTheme(id);
// //     }
// //   }

// //   logout() { 
// //     this.authService.logout(); 
// //   }

// //   getInitials(name: string): string {
// //     return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
// //   }

// //   // === NEW METHODS FOR ENHANCED FUNCTIONALITY ===

// //   /**
// //    * Selects a random theme from all available themes
// //    */
// //   randomTheme() {
// //     const availableThemes = this.allThemes.filter(theme => theme.id !== this.activeThemeId);
    
// //     if (availableThemes.length === 0) return;
    
// //     const randomIndex = Math.floor(Math.random() * availableThemes.length);
// //     const randomTheme = availableThemes[randomIndex];
    
// //     this.selectTheme(randomTheme.id);
    
// //     // Show visual feedback (could be enhanced with a toast notification)
// //     console.log(`Random theme selected: ${randomTheme.name}`);
// //   }

// //   /**
// //    * Resets theme to system default (Light theme)
// //    */
// //   resetToDefault() {
// //     const defaultTheme = this.allThemes.find(theme => theme.name === 'Light');
// //     if (defaultTheme) {
// //       this.selectTheme(defaultTheme.id);
// //       this.themeService.setDarkMode(false);
      
// //       // Show visual feedback
// //       console.log('Theme reset to default: Light');
// //     }
// //   }

// //   /**
// //    * Clears all notifications
// //    */
// //   clearAllNotifications() {
// //     if (this.recentNotifications.length === 0) return;
    
// //     this.notificationService.markAllAsRead();
// //     this.recentNotifications = [];
    
// //     // Show visual feedback
// //     console.log('All notifications cleared');
// //   }

// //   /**
// //    * Get themes organized by category
// //    */
// //   getThemesByCategory() {
// //     const categories = [
// //       {
// //         name: "Core Themes",
// //         themes: this.allThemes.filter(t => t.category === 'core')
// //       },
// //       {
// //         name: "Professional",
// //         themes: this.allThemes.filter(t => t.category === 'professional')
// //       },
// //       {
// //         name: "Modern",
// //         themes: this.allThemes.filter(t => t.category === 'modern')
// //       },
// //       {
// //         name: "Luxury",
// //         themes: this.allThemes.filter(t => t.category === 'luxury')
// //       },
// //       {
// //         name: "Colorful",
// //         themes: this.allThemes.filter(t => t.category === 'colorful')
// //       },
// //       {
// //         name: "Minimal",
// //         themes: this.allThemes.filter(t => t.category === 'minimal')
// //       }
// //     ];
    
// //     // Filter out empty categories
// //     return categories.filter(category => category.themes.length > 0);
// //   }

// //   /**
// //    * Opens the notification dialog
// //    */
// //   openNotificationDialog() {
// //     this.showNotificationdialog = true;
// //   }

// //   /**
// //    * Closes the notification dialog
// //    */
// //   closeNotificationDialog() {
// //     this.showNotificationdialog = false;
// //   }

// //   /**
// //    * Toggles between dark and light mode
// //    */
// //   toggleDarkLightMode() {
// //     this.themeService.setDarkMode(!this.isDarkMode);
// //   }

// //   /**
// //    * Get theme by ID
// //    */
// //   getThemeById(id: string) {
// //     return this.allThemes.find(theme => theme.id === id);
// //   }

// //   /**
// //    * Get current theme name
// //    */
// //   getCurrentThemeName(): string {
// //     const theme = this.getThemeById(this.activeThemeId);
// //     return theme ? theme.name : 'Unknown Theme';
// //   }

// //   ngOnDestroy() { 
// //     this.destroy$.next(); 
// //     this.destroy$.complete(); 
// //   }
// // }





































// // import { Component, EventEmitter, Input, Output, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { RouterModule } from '@angular/router';
// // import { Subject, takeUntil } from 'rxjs';

// // // PrimeNG
// // import { AvatarModule } from 'primeng/avatar';
// // import { ButtonModule } from 'primeng/button';
// // import { Popover, PopoverModule } from 'primeng/popover';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { ToggleButtonModule } from 'primeng/togglebutton';

// // import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
// // import { AuthService } from '../../modules/auth/services/auth-service';
// // import { NotificationService } from '../../core/services/notification.service';
// // import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
// // import { Dialog } from "primeng/dialog";
// // import { LayoutService } from '../layout.service';

// // @Component({
// //   selector: 'app-mainscreen-header',
// //   standalone: true,
// //   imports: [
// //     CommonModule, FormsModule, RouterModule,
// //     AvatarModule, ButtonModule, PopoverModule, TooltipModule, ToggleButtonModule,
// //     NotificationBellComponent // Import the bell component
// //     ,
// //     Dialog
// //   ],
// //   templateUrl: './mainscreen-header.html',
// //   styleUrl: './mainscreen-header.scss',
// // })
// // export class MainscreenHeader implements OnInit, OnDestroy {
// //   @Input() isMobileMenuOpen: boolean = false;
// //   @Output() toggleSidebar = new EventEmitter<void>();

// //   private themeService = inject(ThemeService);
// //   private authService = inject(AuthService);
// //   private notificationService = inject(NotificationService);
// //   private destroy$ = new Subject<void>();
// //   showNotificationdialog: boolean = false
// //   currentUser: any = null;
// //   recentNotifications: any[] = [];
// //   layout = inject(LayoutService);

// //   onMenuToggle() {
// //     if (this.layout.isMobile()) {
// //       this.layout.toggleMobile();
// //     } else {
// //       this.layout.togglePin();
// //     }
// //   }
// //   // Popover State
// //   activeTab: 'settings' | 'notifications' = 'settings';

// //   // Theme State
// //   isDarkMode = false;
// //   activeThemeId: string = 'theme-light';
// //   // allThemes = [
// //   //   { name: "Glass", id: "theme-glass", color: "#3b82f6" },
// //   //   { name: "Light", id: "theme-light", color: "#ffffff" },
// //   //   { name: "Premium", id: "theme-premium", color: "#0d9488" },
// //   //   { name: "Titanium", id: "theme-titanium", color: "#0e7490" },
// //   //   { name: "Slate", id: "theme-slate", color: "#475569" },
// //   //   { name: "Minimal", id: "theme-minimal", color: "#e5e5e5" },
// //   //   { name: "Rose", id: "theme-rose", color: "#ec6d8a" },
// //   //   { name: "Sunset", id: "theme-sunset", color: "#f97316" },
// //   //   { name: "Luxury", id: "theme-luxury", color: "#d4af37" },
// //   //   { name: "Monochrome", id: "theme-monochrome", color: "#52525b" },
// //   //   { name: "Dark (Default)", id: "theme-dark", color: "#0f172a" },
// //   //   { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff" },
// //   //   { name: "Bold", id: "theme-bold", color: "#ff0080" },
// //   // ];
// //   // theme.service.ts or component.ts
// //   allThemes = [
// //     // Core Themes
// //     { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "modern", description: "Modern glassmorphism design" },
// //     { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean light mode" },
// //     { name: "Dark (Default)", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Professional dark mode" },

// //     // Professional Themes
// //     { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Premium teal theme" },
// //     { name: "Titanium", id: "theme-titanium", color: "#0e7490", gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)", category: "professional", description: "Metallic blue theme" },
// //     { name: "Slate", id: "theme-slate", color: "#475569", gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", category: "professional", description: "Cool gray theme" },

// //     // Minimal Themes
// //     { name: "Minimal", id: "theme-minimal", color: "#e5e5e5", gradient: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)", category: "minimal", description: "Clean monochrome" },
// //     { name: "Monochrome", id: "theme-monochrome", color: "#52525b", gradient: "linear-gradient(135deg, #52525b 0%, #71717a 100%)", category: "minimal", description: "True black & white" },

// //     // Colorful Themes
// //     { name: "Rose", id: "theme-rose", color: "#ec6d8a", gradient: "linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)", category: "colorful", description: "Soft pink theme" },
// //     { name: "Sunset", id: "theme-sunset", color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", category: "colorful", description: "Warm orange theme" },
// //     { name: "Bold", id: "theme-bold", color: "#ff0080", gradient: "linear-gradient(135deg, #ff0080 0%, #00ffff 100%)", category: "colorful", description: "High contrast theme" },

// //     // Luxury Themes
// //     { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)", category: "luxury", description: "Gold luxury theme" },
// //     { name: "Futuristic", id: "theme-futuristic", color: "#00d4ff", gradient: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)", category: "luxury", description: "Cyberpunk theme" },

// //     // New Trending Themes
// //     { name: "Midnight Royal", id: "theme-midnight-royal", color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)", category: "luxury", description: "Purple luxury dark" },
// //     { name: "Emerald Regal", id: "theme-emerald-regal", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", category: "luxury", description: "Green luxury theme" },
// //     { name: "Material You", id: "theme-material-you", color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #e879f9 100%)", category: "modern", description: "Android 12 design" },
// //     { name: "Data Science", id: "theme-data-science", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", category: "professional", description: "Analytics optimized" },
// //     { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft UI design" }
// //   ];

// //   // Add this method to organize themes by category
// //   getThemesByCategory() {
// //     return [
// //       {
// //         name: "Core Themes",
// //         themes: this.allThemes.filter(t => t.category === 'core')
// //       },
// //       {
// //         name: "Professional",
// //         themes: this.allThemes.filter(t => t.category === 'professional')
// //       },
// //       {
// //         name: "Modern",
// //         themes: this.allThemes.filter(t => t.category === 'modern')
// //       },
// //       {
// //         name: "Luxury",
// //         themes: this.allThemes.filter(t => t.category === 'luxury')
// //       },
// //       {
// //         name: "Colorful",
// //         themes: this.allThemes.filter(t => t.category === 'colorful')
// //       },
// //       {
// //         name: "Minimal",
// //         themes: this.allThemes.filter(t => t.category === 'minimal')
// //       }
// //     ];
// //   }
// //   ngOnInit() {
// //     this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);

// //     this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
// //       this.recentNotifications = n.filter(x => !x.isRead);
// //     });

// //     this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
// //       this.isDarkMode = s.isDarkMode;
// //       this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass;
// //     });
// //   }

// //   togglePopover(op: Popover, event: Event) {
// //     op.toggle(event);
// //   }

// //   // Optional: Open directly to notifications tab
// //   openNotifications(op: Popover, event: Event) {
// //     this.activeTab = 'notifications';
// //     op.toggle(event);
// //   }

// //   toggleDarkMode(isDark: boolean) { this.themeService.setDarkMode(isDark); }

// //   selectTheme(id: string) {
// //     if (id === 'theme-dark') this.themeService.setDarkMode(true);
// //     else this.themeService.setLightTheme(id);
// //   }

// //   logout() { this.authService.logout(); }

// //   getInitials(name: string): string {
// //     return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
// //   }

// //   ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
// // }