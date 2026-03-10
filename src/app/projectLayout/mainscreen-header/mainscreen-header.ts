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
  // ngOnInit() {
  //   this.organizeThemes();
  //   this.mobileMenuItems = SIDEBAR_MENU;
  //   this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);
  //   this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
  //     this.recentNotifications = n.filter(x => !x.isRead);
  //     if (this.recentNotifications.length === 0) {
  //       this.recentNotifications = this.mockNotifications.filter(n => !n.read);
  //     }
  //   });

  //   // Subscribe to Theme Settings
  //   this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
  //     this.isDarkMode = s.isDarkMode;
  //     this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
  //     if (s.textScale) {
  //       this.textScale = s.textScale;
  //     }
  //   });
  // }
ngOnInit() {
    this.organizeThemes();
    this.mobileMenuItems = SIDEBAR_MENU;
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);
    
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe((n:any) => {
      // 1. Safely extract the array just in case the service sends a raw object
      const safeNotifications = Array.isArray(n) ? n : (n?.data || n?.notifications || []);

      // 2. Filter the safe array
      this.recentNotifications = safeNotifications.filter((x: any) => !x.isRead);
      
      if (this.recentNotifications.length === 0) {
        this.recentNotifications = this.mockNotifications.filter(mock => !mock.read);
      }
    });

    // Subscribe to Theme Settings
    this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
      this.isDarkMode = s.isDarkMode;
      this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
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
    {
    name: "Midnight Bronze",
    id: "theme-midnight-bronze",
    color: "#b88645",
    gradient: "linear-gradient(135deg, #b88645 0%, #d4a363 100%)",
    category: "premium dark",
    description: "Dark premium glass with deep blue base and rich bronze accents."
  },  {
    name: "Rose Glass",
    id: "theme-rose-glass",
    color: "#f43f5e",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)",
    category: "glass light",
    description: "Vibrant red-pink accents on a pristine white glass background."
  },
  {
    name: "Fuchsia Glow",
    id: "theme-fuchsia-glow",
    color: "#d946ef",
    gradient: "linear-gradient(135deg, #d946ef 0%, #e879f9 100%)",
    category: "glass light",
    description: "Bright pink-purple gradients illuminating a soft off-white canvas."
  },
  {
    name: "Amethyst Pearl",
    id: "theme-amethyst-pearl",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)",
    category: "premium light",
    description: "Rich purple jewel tones paired with elegant dark blue typography."
  },
  {
    name: "Violet Whisper",
    id: "theme-violet-whisper",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
    category: "glass light",
    description: "Deep violet accents floating over highly transparent white glass."
  },
  {
    name: "Indigo Breeze",
    id: "theme-indigo-breeze",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
    category: "glass light",
    description: "Sophisticated indigo-blue accents providing a calm, professional interface."
  },
  {
    name: "Royal Sky",
    id: "theme-royal-sky",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
    category: "glass light",
    description: "Classic royal blue highlights bringing clarity and trust to light mode."
  },
  {
    name: "Cerulean Day",
    id: "theme-cerulean-day",
    color: "#0ea5e9",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    category: "glass light",
    description: "Bright cerulean light-blue elements over clear structural lines."
  },
  {
    name: "Cyan Crystal",
    id: "theme-cyan-crystal",
    color: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)",
    category: "glass light",
    description: "Vibrant and energetic cyan tones glowing through frosted panels."
  },
  {
    name: "Teal Mist",
    id: "theme-teal-mist",
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)",
    category: "premium light",
    description: "Sophisticated teal-green gradients offering a mature, high-end feel."
  },
  {
    name: "Emerald Dawn",
    id: "theme-emerald-dawn",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
    category: "glass light",
    description: "Fresh, bright emerald mint greens contrasting sharply with dark text."
  },
  {
    name: "Fresh Green",
    id: "theme-fresh-green",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #22c55e 0%, #4ade80 100%)",
    category: "glass light",
    description: "Pure, vibrant green accents evoking growth and natural light."
  },
  {
    name: "Lime Light",
    id: "theme-lime-light",
    color: "#84cc16",
    gradient: "linear-gradient(135deg, #84cc16 0%, #a3e635 100%)",
    category: "glass light",
    description: "Electric yellow-green bringing high energy to a clean white background."
  },
  {
    name: "Olive Sun",
    id: "theme-olive-sun",
    color: "#65a30d",
    gradient: "linear-gradient(135deg, #65a30d 0%, #84cc16 100%)",
    category: "premium light",
    description: "Earthy dark yellow-green paired with elegant serif typography."
  },
  {
    name: "Lemon Yellow",
    id: "theme-lemon-yellow",
    color: "#eab308",
    gradient: "linear-gradient(135deg, #eab308 0%, #facc15 100%)",
    category: "glass light",
    description: "Sunny, pure yellow highlights contrasting deeply with navy blue text."
  },
  {
    name: "Mustard Clear",
    id: "theme-mustard-clear",
    color: "#ca8a04",
    gradient: "linear-gradient(135deg, #ca8a04 0%, #eab308 100%)",
    category: "glass light",
    description: "Deep mustard yellow providing a grounded, professional highlight color."
  },
  {
    name: "Amber Light",
    id: "theme-amber-light",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    category: "glass light",
    description: "Warm amber-orange gradients softening a highly structured layout."
  },
  {
    name: "Rust Ivory",
    id: "theme-rust-ivory",
    color: "#b45309",
    gradient: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
    category: "premium light",
    description: "Classic rust orange details bringing a tactile warmth to the UI."
  },
  {
    name: "Sunset Glass",
    id: "theme-sunset-glass",
    color: "#ea580c",
    gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    category: "glass light",
    description: "Intense orange-red accents cutting perfectly through clear glass."
  },
  {
    name: "Crimson Frost",
    id: "theme-crimson-frost",
    color: "#dc2626",
    gradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    category: "glass light",
    description: "A commanding pure red accent color over frosted light panels."
  },
  {
    name: "Ruby Pearl",
    id: "theme-ruby-pearl",
    color: "#be123c",
    gradient: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)",
    category: "premium light",
    description: "Luxurious deep ruby red creating an executive, high-impact aesthetic."
  },
  {
    name: "Magenta Cloud",
    id: "theme-magenta-cloud",
    color: "#c026d3",
    gradient: "linear-gradient(135deg, #c026d3 0%, #d946ef 100%)",
    category: "glass light",
    description: "Deep red-purple magenta highlights bursting from an airy white interface."
  },
  {
    name: "Lavender Light",
    id: "theme-lavender-light",
    color: "#a78bfa",
    gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)",
    category: "glass light",
    description: "Very soft, calming purple hues wrapping around solid dark blue content."
  },
  {
    name: "Sky Breeze",
    id: "theme-sky-breeze",
    color: "#38bdf8",
    gradient: "linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%)",
    category: "glass light",
    description: "Cloudless sky-blue interactive elements providing ultimate clarity."
  },
  {
    name: "Seafoam Ice",
    id: "theme-seafoam-ice",
    color: "#2dd4bf",
    gradient: "linear-gradient(135deg, #2dd4bf 0%, #5eead4 100%)",
    category: "glass light",
    description: "Gentle seafoam teal adding a refreshing, icy touch to buttons and borders."
  },
  {
    name: "Mint Glacier",
    id: "theme-mint-glacier",
    color: "#34d399",
    gradient: "linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)",
    category: "glass light",
    description: "Soft, icy mint green providing a subtle but effective pop of color."
  },
  {
    name: "Lemon Drop",
    id: "theme-lemon-drop",
    color: "#facc15",
    gradient: "linear-gradient(135deg, #facc15 0%, #fde047 100%)",
    category: "glass light",
    description: "Sweet, bright yellow tones layered beautifully over white glass."
  },
  {
    name: "Peach Air",
    id: "theme-peach-air",
    color: "#fb923c",
    gradient: "linear-gradient(135deg, #fb923c 0%, #fdba74 100%)",
    category: "glass light",
    description: "Airy, soft orange accents creating an inviting and warm experience."
  },
  {
    name: "Salmon Pink",
    id: "theme-salmon-pink",
    color: "#fb7185",
    gradient: "linear-gradient(135deg, #fb7185 0%, #fda4af 100%)",
    category: "glass light",
    description: "A gentle blend of pink and red bringing life to a pristine layout."
  },
  {
    name: "Berry Juice",
    id: "theme-berry-juice",
    color: "#9f1239",
    gradient: "linear-gradient(135deg, #9f1239 0%, #be123c 100%)",
    category: "premium light",
    description: "Intense, dark berry-pink providing profound contrast against off-white."
  },
  {
    name: "Neon Pink",
    id: "theme-neon-pink",
    color: "#ff1493",
    gradient: "linear-gradient(135deg, #ff1493 0%, #ff69b4 100%)",
    category: "glass light",
    description: "Unapologetically vibrant true neon pink for maximum visual flair."
  }, {
    name: "Daylight Orange",
    id: "theme-daylight-orange",
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    category: "glass light",
    description: "Bright pure light glass with crisp dark blue text and vibrant orange accents."
  },
  {
    name: "Morning Tangerine",
    id: "theme-morning-tangerine",
    color: "#ff8800",
    gradient: "linear-gradient(135deg, #ff8800 0%, #ff9d33 100%)",
    category: "glass light",
    description: "Soft off-white glass paired with deep navy structure and bright tangerine buttons."
  },
  {
    name: "Crisp Apricot",
    id: "theme-crisp-apricot",
    color: "#fb923c",
    gradient: "linear-gradient(135deg, #fb923c 0%, #fdba74 100%)",
    category: "glass light",
    description: "Very light, airy interface with gentle apricot orange highlights and dark blue borders."
  },
  {
    name: "Naval Dawn",
    id: "theme-naval-dawn",
    color: "#ffbf00",
    gradient: "linear-gradient(135deg, #ffbf00 0%, #ffcf40 100%)",
    category: "premium light",
    description: "Professional white glass theme with bold navy headings and golden amber accents."
  },
  {
    name: "Azure Sun",
    id: "theme-azure-sun",
    color: "#ea580c",
    gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    category: "glass light",
    description: "High-contrast light mode with rich sapphire text and aggressive sun-orange elements."
  },
  {
    name: "Frosty Mango",
    id: "theme-frosty-mango",
    color: "#ff8c00",
    gradient: "linear-gradient(135deg, #ff8c00 0%, #ffa633 100%)",
    category: "glass light",
    description: "Frosted white glass layered over pale blue with sweet mango orange interactive states."
  },
  {
    name: "Cloud Amber",
    id: "theme-cloud-amber",
    color: "#d97706",
    gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    category: "premium light",
    description: "Soft ivory background framing solid dark blue content and mature amber orange accents."
  },
  {
    name: "Glazed Rust",
    id: "theme-glazed-rust",
    color: "#be4d25",
    gradient: "linear-gradient(135deg, #be4d25 0%, #d6592f 100%)",
    category: "premium light",
    description: "Sophisticated light interface utilizing slate-navy text and refined rustic orange buttons."
  },
  {
    name: "Luminous Coral",
    id: "theme-luminous-coral",
    color: "#ff7f50",
    gradient: "linear-gradient(135deg, #ff7f50 0%, #ff9e7a 100%)",
    category: "glass light",
    description: "Radiant light blue-grey background with deep ocean text and vibrant coral highlights."
  },
  {
    name: "Clear Tiger",
    id: "theme-clear-tiger",
    color: "#fd7e14",
    gradient: "linear-gradient(135deg, #fd7e14 0%, #ff922b 100%)",
    category: "glass light",
    description: "Ultra-clear pure white glass with stealthy dark blue UI lines and fierce tiger orange."
  },
  {
    name: "Airy Marigold",
    id: "theme-airy-marigold",
    color: "#faa307",
    gradient: "linear-gradient(135deg, #faa307 0%, #ffba08 100%)",
    category: "glass light",
    description: "Breezy light theme warmed by marigold yellow-orange and grounded by midnight text."
  },
  {
    name: "Soft Flame",
    id: "theme-soft-flame",
    color: "#ff4500",
    gradient: "linear-gradient(135deg, #ff4500 0%, #ff632b 100%)",
    category: "glass light",
    description: "Clean, minimal light background pierced by striking solar flare red-orange accents."
  },
  {
    name: "Lucid Copper",
    id: "theme-lucid-copper",
    color: "#b87333",
    gradient: "linear-gradient(135deg, #b87333 0%, #c88951 100%)",
    category: "premium light",
    description: "Executive light theme featuring marine blue typography and metallic copper gradients."
  },
  {
    name: "Mist Pumpkin",
    id: "theme-mist-pumpkin",
    color: "#ff7518",
    gradient: "linear-gradient(135deg, #ff7518 0%, #ff8c3a 100%)",
    category: "glass light",
    description: "Foggy light-grey glass panels over pure white, featuring rich pumpkin orange calls-to-action."
  },
  {
    name: "Breeze Supernova",
    id: "theme-breeze-supernova",
    color: "#ff5e00",
    gradient: "linear-gradient(135deg, #ff5e00 0%, #ff7d2e 100%)",
    category: "glass light",
    description: "Refreshing light theme disrupted by an intense, energetic supernova orange."
  },
  {
    name: "Crystal Neon",
    id: "theme-crystal-neon",
    color: "#ff6600",
    gradient: "linear-gradient(135deg, #ff6600 0%, #ff8533 100%)",
    category: "glass light",
    description: "Crystalline white glass with high-tech navy text and highly saturated neon orange."
  },
  {
    name: "Sky Electric",
    id: "theme-sky-electric",
    color: "#ff5500",
    gradient: "linear-gradient(135deg, #ff5500 0%, #ff7733 100%)",
    category: "glass light",
    description: "Lightweight, cloud-like backgrounds heavily contrasted with electric orange focal points."
  },
  {
    name: "Pearl Sapphire",
    id: "theme-pearl-sapphire",
    color: "#ff632b",
    gradient: "linear-gradient(135deg, #ff632b 0%, #ff8c61 100%)",
    category: "premium light",
    description: "Luxurious pearlescent backgrounds framed by sapphire lines and bright orange buttons."
  },
  {
    name: "Ivory Cobalt",
    id: "theme-ivory-cobalt",
    color: "#ffa633",
    gradient: "linear-gradient(135deg, #ffa633 0%, #ffbf66 100%)",
    category: "glass light",
    description: "Warm ivory glass interfaces paired with cool cobalt text and soft orange glows."
  },
  {
    name: "White Eclipse",
    id: "theme-white-eclipse",
    color: "#ff9d33",
    gradient: "linear-gradient(135deg, #ff9d33 0%, #ffb166 100%)",
    category: "glass light",
    description: "A stark white theme utilizing deep space navy for readability and pure tangerine accents."
  },
  {
    name: "Frosted Pearl",
    id: "theme-frosted-pearl",
    color: "#000B58",
    gradient: "linear-gradient(135deg, #000B58 0%, #1a2780 100%)",
    category: "premium light",
    description: "Hyper-clean pure light glass with crisp off-white and deep blue."
  },
  {
    name: "Royal Sapphire",
    id: "theme-royal-sapphire",
    color: "#c99d66",
    gradient: "linear-gradient(135deg, #8c6a46 0%, #c99d66 100%)",
    category: "premium dark",
    description: "Classic high-contrast luxury combining sapphire depth with warm gold."
  }, {
    name: "Neon Eclipse",
    id: "theme-neon-eclipse",
    color: "#ff6600",
    gradient: "linear-gradient(135deg, #ff6600 0%, #ff8533 100%)",
    category: "glass dark",
    description: "Deep space navy infused with vibrant neon orange glassmorphism."
  },
  {
    name: "Naval Amber",
    id: "theme-naval-amber",
    color: "#ffbf00",
    gradient: "linear-gradient(135deg, #ffbf00 0%, #ffcf40 100%)",
    category: "glass dark",
    description: "Rich traditional navy blue paired with golden amber accents."
  },
  {
    name: "Abyssal Coral",
    id: "theme-abyssal-coral",
    color: "#ff7f50",
    gradient: "linear-gradient(135deg, #ff7f50 0%, #ff9e7a 100%)",
    category: "glass dark",
    description: "Deepest ocean dark blue with bright, vibrant coral orange borders."
  },
  {
    name: "Slate Rust",
    id: "theme-slate-rust",
    color: "#d97706",
    gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    category: "glass dark",
    description: "Muted slate navy complemented by mature, rusty metallic orange."
  },
  {
    name: "Indigo Tangerine",
    id: "theme-indigo-tangerine",
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    category: "glass dark",
    description: "A strong indigo foundation with popping tangerine orange glass."
  },
  {
    name: "Solar Space",
    id: "theme-solar-space",
    color: "#ff4500",
    gradient: "linear-gradient(135deg, #ff4500 0%, #ff632b 100%)",
    category: "neon glass",
    description: "Pitch black-blue void pierced by solar flare red-orange elements."
  },
  {
    name: "Cobalt Mango",
    id: "theme-cobalt-mango",
    color: "#ff8c00",
    gradient: "linear-gradient(135deg, #ff8c00 0%, #ffa633 100%)",
    category: "glass dark",
    description: "Slightly lighter cobalt dark blue with sweet mango orange touches."
  },
  {
    name: "Sapphire Flame",
    id: "theme-sapphire-flame",
    color: "#ea580c",
    gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    category: "premium dark",
    description: "Luxurious sapphire blue heavily contrasted with aggressive flame orange."
  },
  {
    name: "Oceanic Peach",
    id: "theme-oceanic-peach",
    color: "#ffb085",
    gradient: "linear-gradient(135deg, #ffb085 0%, #ffc2a3 100%)",
    category: "glass dark",
    description: "A dark teal-tinted blue base paired with soft, glowing peach orange."
  },
  {
    name: "Lapis Tiger",
    id: "theme-lapis-tiger",
    color: "#fd7e14",
    gradient: "linear-gradient(135deg, #fd7e14 0%, #ff922b 100%)",
    category: "neon glass",
    description: "Lapis Lazuli structural blue featuring fierce tiger-orange glowing borders."
  },
  {
    name: "Midnight Marigold",
    id: "theme-midnight-marigold",
    color: "#faa307",
    gradient: "linear-gradient(135deg, #faa307 0%, #ffba08 100%)",
    category: "glass dark",
    description: "Pure midnight aesthetic warmed by bright marigold yellow-orange."
  },
  {
    name: "Twilight Burnt",
    id: "theme-twilight-burnt",
    color: "#be4d25",
    gradient: "linear-gradient(135deg, #be4d25 0%, #d6592f 100%)",
    category: "premium dark",
    description: "Elegant twilight dark blue paired with a grounded burnt orange tone."
  },
  {
    name: "Void Electric",
    id: "theme-void-electric",
    color: "#ff5500",
    gradient: "linear-gradient(135deg, #ff5500 0%, #ff7733 100%)",
    category: "neon glass",
    description: "Maximum contrast pure dark mode with electric neon orange UI elements."
  },
  {
    name: "Storm Apricot",
    id: "theme-storm-apricot",
    color: "#fb923c",
    gradient: "linear-gradient(135deg, #fb923c 0%, #fdba74 100%)",
    category: "glass dark",
    description: "Desaturated stormy dark blue lightened by gentle apricot orange glass."
  },
  {
    name: "Marine Copper",
    id: "theme-marine-copper",
    color: "#b87333",
    gradient: "linear-gradient(135deg, #b87333 0%, #c88951 100%)",
    category: "premium dark",
    description: "Professional marine blue base featuring high-end metallic copper borders."
  },
  {
    name: "Royal Pumpkin",
    id: "theme-royal-pumpkin",
    color: "#ff7518",
    gradient: "linear-gradient(135deg, #ff7518 0%, #ff8c3a 100%)",
    category: "glass dark",
    description: "Regal dark blue with a rich, autumnal pumpkin orange highlight."
  },
  {
    name: "Eclipse Tangerine",
    id: "theme-eclipse-tangerine",
    color: "#ff8800",
    gradient: "linear-gradient(135deg, #ff8800 0%, #ff9d33 100%)",
    category: "glass dark",
    description: "Near-black eclipse background driven by a pure, bright tangerine orange."
  },
  {
    name: "Cyber Navy",
    id: "theme-cyber-navy",
    color: "#ff3c00",
    gradient: "linear-gradient(135deg, #ff3c00 0%, #ff5f2e 100%)",
    category: "neon glass",
    description: "Sci-fi inspired dark navy with aggressive laser-orange glass borders."
  },
  {
    name: "Midnight Gold",
    id: "theme-midnight-gold",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    category: "premium dark",
    description: "Deepest indigo luxury theme detailed with gold-leaning orange accents."
  },
  {
    name: "Deep Supernova",
    id: "theme-deep-supernova",
    color: "#ff5e00",
    gradient: "linear-gradient(135deg, #ff5e00 0%, #ff7d2e 100%)",
    category: "glass dark",
    description: "Infinite deep space blue disrupted by an intense supernova orange."
  },
  {
    name: "Ocean Mist",
    id: "theme-ocean-mist",
    color: "#8a6a52",
    gradient: "linear-gradient(135deg, #8a6a52 0%, #a3856d 100%)",
    category: "premium light",
    description: "Soft, airy, and calming light blue-grey interface with muted brown touches."
  },
  {
    name: "Executive Velvet",
    id: "theme-executive-velvet",
    color: "#000B58",
    gradient: "linear-gradient(135deg, #000B58 0%, #273385 100%)",
    category: "premium light",
    description: "Warm corporate off-white with sophisticated deep blue typography and accents."
  },{
    name: "Crisp Structure",
    id: "theme-crisp-structure",
    color: "#000B58",
    gradient: "linear-gradient(135deg, #000B58 0%, #1a2780 100%)",
    category: "light",
    description: "Pure light SaaS interface with strong borders and solid deep blue accents."
  },
  {
    name: "Blueprint Light",
    id: "theme-blueprint-light",
    color: "#000B58",
    gradient: "linear-gradient(135deg, #000B58 0%, #202b75 100%)",
    category: "light",
    description: "High-contrast structural theme relying heavily on borders instead of shadows."
  },
  {
    name: "Cloud Ivory",
    id: "theme-cloud-ivory",
    color: "#ADC4CE",
    gradient: "linear-gradient(135deg, #000B58 0%, #151e5e 100%)",
    category: "light",
    description: "Soft off-white framing with pure white content areas and deep blue text."
  },
  {
    name: "Obsidian Blue",
    id: "theme-obsidian-blue",
    color: "#ADC4CE",
    gradient: "linear-gradient(135deg, #ADC4CE 0%, #ffffff 100%)",
    category: "premium dark",
    description: "Ultra-modern deep tech dark mode with stealth glass and light blue-grey highlights."
  },
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