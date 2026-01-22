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
import { SIDEBAR_MENU } from '../mainscreensidebar/menu-items.constants';
import { TieredMenuModule } from 'primeng/tieredmenu';
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
    CommonModule,TieredMenuModule,
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
textScale: number = 100;
  // State
  activePopoverTab: 'settings' | 'notifications' = 'settings';
  currentUser: any = null;
  recentNotifications: any[] = [];

  // Theme State
  isDarkMode = false;
  activeThemeId: string = 'theme-light';
  themeGroups: ThemeGroup[] = [];
  mockNotifications = [
    { id: 1, title: 'New Member Request', message: 'John Doe wants to join your organization', time: '2 min ago', read: false, type: 'info' },
    { id: 2, title: 'Task Completed', message: 'Project "Dashboard Redesign" has been completed', time: '1 hour ago', read: false, type: 'success' },
    { id: 3, title: 'System Update', message: 'Scheduled maintenance in 30 minutes', time: '3 hours ago', read: true, type: 'warning' },
    { id: 4, title: 'New Message', message: 'You have a new message from Sarah', time: '5 hours ago', read: true, type: 'info' },
  ];
  mobileMenuItems: any
  ngOnInit() {
    this.organizeThemes();
    this.mobileMenuItems = SIDEBAR_MENU;
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
      // ✅ Sync local state with service state
      if (s.textScale) {
        this.textScale = s.textScale;
      }
    });
  }

  updateTextScale(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    this.themeService.setTextScale(value);
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
    switch (type) {
      case 'success': return 'pi pi-check-circle';
      case 'warning': return 'pi pi-exclamation-triangle';
      case 'error': return 'pi pi-times-circle';
      default: return 'pi pi-info-circle';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
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
  allThemes: Theme[] = [
    // --- CORE THEMES ---
    {
      name: "Auto",
      id: "auto-theme",
      color: "#2563eb",
      gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
      category: "core",
      description: "Auto-detects system preference"
    },
    {
      name: "Glass",
      id: "theme-glass",
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
      category: "core",
      description: "Modern professional glassmorphism"
    },
    {
      name: "Light",
      id: "theme-light",
      color: "#f1f5f9",
      gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
      category: "core",
      description: "Clean data-optimized light mode"
    },
    {
      name: "Dark",
      id: "theme-dark",
      color: "#0f172a",
      gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      category: "core",
      description: "Enhanced high-contrast dark mode"
    },
    {
      name: "Bio Frost",
      id: "theme-bio-frost",
      color: "#34d399",
      gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
      category: "core",
      description: "Milky white glass with emerald accents"
    },

    // --- PROFESSIONAL ---
    {
      name: "Premium",
      id: "theme-premium",
      color: "#0d9488",
      gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
      category: "professional",
      description: "Rich Teal & Sky Blue"
    },
    {
      name: "Titanium",
      id: "theme-titanium",
      color: "#0891b2",
      gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
      category: "professional",
      description: "Industrial Cyan & Silver"
    },
    {
      name: "Slate",
      id: "theme-slate",
      color: "#334155",
      gradient: "linear-gradient(135deg, #334155 0%, #475569 100%)",
      category: "professional",
      description: "Executive Gunmetal Gray"
    },
    {
      name: "Data Science",
      id: "theme-data-science",
      color: "#2563eb",
      gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      category: "professional",
      description: "Analytics optimized Blue"
    },
    {
      name: "Cobalt Steel",
      id: "theme-cobalt-steel",
      color: "#0284c7",
      gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      category: "professional",
      description: "Corporate Navy & Sapphire"
    },
    {
      name: "Luminous",
      id: "theme-luminous",
      color: "#4f46e5",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
      category: "professional",
      description: "Clean Executive Indigo"
    },

    // --- MINIMAL ---
    {
      name: "Minimal",
      id: "theme-minimal",
      color: "#171717",
      gradient: "linear-gradient(135deg, #171717 0%, #404040 100%)",
      category: "minimal",
      description: "Stark High-Fashion Monochrome"
    },
    {
      name: "Monochrome",
      id: "theme-monochrome",
      color: "#09090b",
      gradient: "linear-gradient(135deg, #09090b 0%, #27272a 100%)",
      category: "minimal",
      description: "Architectural Pure Black"
    },

    // --- COLORFUL ---
    {
      name: "Rose",
      id: "theme-rose",
      color: "#e11d48",
      gradient: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)",
      category: "colorful",
      description: "Executive Crimson & Merlot"
    },
    {
      name: "Sunset",
      id: "theme-sunset",
      color: "#ea580c",
      gradient: "linear-gradient(135deg, #ea580c 0%, #db2777 100%)",
      category: "colorful",
      description: "Vibrant Golden Hour Glow"
    },
    {
      name: "Bold",
      id: "theme-bold",
      color: "#d946ef",
      gradient: "linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)",
      category: "colorful",
      description: "High-Voltage Neon Cyberpunk"
    },
    {
      name: "Nebula",
      id: "theme-nebula",
      color: "#d946ef",
      gradient: "linear-gradient(to right, #ec4899, #8b5cf6)",
      category: "colorful",
      description: "Electric Future Neon"
    },

    // --- LUXURY ---
    {
      name: "Luxury",
      id: "theme-luxury",
      color: "#d4af37",
      gradient: "linear-gradient(135deg, #d4af37 0%, #b45309 100%)",
      category: "luxury",
      description: "Sharp Onyx & Gold"
    },
    {
      name: "Futuristic",
      id: "theme-futuristic",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
      category: "luxury",
      description: "Sci-Fi HUD Blue"
    },
    {
      name: "Midnight Royal",
      id: "theme-midnight-royal",
      color: "#7c3aed",
      gradient: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
      category: "luxury",
      description: "Deep Navy & Electric Violet"
    },
    {
      name: "Emerald Regal",
      id: "theme-emerald-regal",
      color: "#059669",
      gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      category: "luxury",
      description: "Wealth & Finance Green"
    },

    // --- MODERN ---
    {
      name: "Material You",
      id: "theme-material-you",
      color: "#c026d3",
      gradient: "linear-gradient(135deg, #c026d3 0%, #a21caf 100%)",
      category: "modern",
      description: "Deep Orchid Android 14"
    },
    {
      name: "Solar Flare",
      id: "theme-solar-flare",
      color: "#fb923c",
      gradient: "linear-gradient(135deg, #fb923c 0%, #db2777 100%)",
      category: "luxury",
      description: "Deep molten glass with warm amber glow"
    },
    {
      name: "Horizon",
      id: "theme-horizon",
      color: "#F56217",
      gradient: "linear-gradient(to right, #F56217, #0B486B)",
      category: "colorful",
      description: "Vibrant orange to deep ocean blue"
    },
    {
      name: "Midnight City",
      id: "theme-midnight-city",
      color: "#243B55",
      gradient: "linear-gradient(to right, #243B55, #141E30)",
      category: "professional",
      description: "Deep Steel Blue Gradient"
    },
    {
      name: "Synthwave",
      id: "theme-synthwave",
      color: "#ff6a00",
      gradient: "linear-gradient(to right, #ff6a00, #ee0979)",
      category: "colorful",
      description: "Vibrant Orange to Pink"
    },
    {
      name: "Crimson Night",
      id: "theme-crimson-night",
      color: "#6f0000",
      gradient: "linear-gradient(to right, #6f0000, #200122)",
      category: "luxury",
      description: "Dark Blood Red to Purple"
    },
    {
      name: "Oceanic",
      id: "theme-oceanic",
      color: "#1CB5E0",
      gradient: "linear-gradient(to right, #1CB5E0, #000046)",
      category: "modern",
      description: "Bright Cyan to Deep Blue"
    },
    {
      name: "Neumorphic",
      id: "theme-neumorphic",
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      category: "modern",
      description: "Soft Tech Slate"
    },
    {
      name: "Deep Space",
      id: "theme-deep-space",
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      category: "modern",
      description: "Void Black & Cyan"
    }
  ];
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
  // Complete Theme Data Source (ALL themes from your tokens)
  //   allThemes: Theme[] = [
  //     // Core Themes
  //     { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "core", description: "Modern glassmorphism design" },
  //     { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean light mode" },
  //     { name: "Dark", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Professional dark mode" },
  //     { name: "Auto", id: "auto-theme", color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", category: "core", description: "Auto-detects system preference" },
  // { 
  //   name: "Bio Frost", 
  //   id: "theme-bio-frost", 
  //   color: "#34d399", 
  //   gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)", 
  //   category: "core", 
  //   description: "Milky white glass with emerald organic accents" 
  // },
  //     // Professional Themes
  //     { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Premium teal theme" },
  //     { name: "Titanium", id: "theme-titanium", color: "#0e7490", gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)", category: "professional", description: "Metallic blue theme" },
  //     { name: "Slate", id: "theme-slate", color: "#475569", gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)", category: "professional", description: "Cool gray theme" },
  //     { name: "Data Science", id: "theme-data-science", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", category: "professional", description: "Analytics optimized" },
  //     { name: "Cobalt Steel", id: "theme-cobalt-steel", color: "#0ea5e9", gradient: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)", category: "professional", description: "Professional blue theme" },

  //     // Minimal Themes
  //     { name: "Minimal", id: "theme-minimal", color: "#e5e5e5", gradient: "linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 100%)", category: "minimal", description: "Clean monochrome" },
  //     { name: "Monochrome", id: "theme-monochrome", color: "#52525b", gradient: "linear-gradient(135deg, #52525b 0%, #71717a 100%)", category: "minimal", description: "True black & white" },

  //     // Colorful Themes
  //     { name: "Rose", id: "theme-rose", color: "#ec6d8a", gradient: "linear-gradient(135deg, #ec6d8a 0%, #f472b6 100%)", category: "colorful", description: "Soft pink theme" },
  //     { name: "Sunset", id: "theme-sunset", color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", category: "colorful", description: "Warm orange theme" },
  //     { name: "Bold", id: "theme-bold", color: "#ff00ff", gradient: "linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)", category: "colorful", description: "High contrast neon theme" },

  //     // Luxury Themes
  //     { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #fbbf24 100%)", category: "luxury", description: "Gold luxury theme" },
  //     { name: "Futuristic", id: "theme-futuristic", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)", category: "luxury", description: "Cyberpunk theme" },
  //     { name: "Midnight Royal", id: "theme-midnight-royal", color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #8b5cf6 100%)", category: "luxury", description: "Purple luxury dark theme" },
  //     { name: "Emerald Regal", id: "theme-emerald-regal", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", category: "luxury", description: "Green luxury theme" },

  //     // Modern Themes
  //     { name: "Material You", id: "theme-material-you", color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #e879f9 100%)", category: "modern", description: "Android 12 design" },
  //     { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft UI design" },
  //     { name: "Deep Space", id: "theme-deep-space", color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #22d3ee 100%)", category: "modern", description: "Astronomy inspired dark theme" }
  //   ];

  // Mock Data
