// src/app/modules/storefront-public/layout/storefront-layout.component.ts
import {
  Component,
  inject,
  computed,
  effect,
  signal,
  OnInit,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, filter, takeUntil } from 'rxjs';

import { PopoverModule } from 'primeng/popover';
import { SliderModule } from 'primeng/slider';
import { TooltipModule } from 'primeng/tooltip';

import { ThemeService, ThemeSettings } from '../../../core/services/theme.service';
import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';
import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
import { StorefrontStateService } from '@core/services/storefront-state.service';
import { ThemeEngineService } from '@apx/theme-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    NavbarSimpleComponent, FooterSimpleComponent,
    PopoverModule, SliderModule, TooltipModule
  ],
  templateUrl: './storefront-layout.component.html',
  styleUrls: ['./storefront-layout.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StorefrontLayoutComponent implements OnInit, OnDestroy {

  public state = inject(StorefrontStateService);
  private themeService = inject(ThemeService);
  private themeEngine = inject(ThemeEngineService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // ── Theme state signals ───────────────────────────────────────────────────
  isDarkMode = signal(false);
  activeThemeId = signal('auto-theme');
  textScale = signal(100);
  themeGroups = signal<ThemeGroup[]>([]);

  // ── Computed: is this the homepage? ──────────────────────────────────────
  // Computed signal avoids triggering change detection on every render cycle.
  isHomePage = computed(() => {
    // Access router.url via a signal wrapper populated in constructor
    const url = this._currentUrl();
    const slug = this.state.organization()?.slug;
    if (!slug) return false;
    return url.endsWith(`/store/${slug}`) ||
      url.endsWith(`/store/${slug}/`) ||
      url.endsWith('/home');
  });

  // Internal signal to make router.url reactive
  private _currentUrl = signal(this.router.url);

  // ── Computed: CSS variable map for the page shell ─────────────────────────
  activeThemeStyle = computed<Record<string, string>>(() => {
    const selectedId = this.activeThemeId();
    const selectedTheme = this.allThemes.find(t => t.id === selectedId);
    const dark = this.isDarkMode();

    // User selected a named theme — use its colour
    if (selectedTheme && selectedId !== 'auto-theme') {
      return {
        ...this.themeEngine.styleMap(),
        '--primary': selectedTheme.color,
        '--secondary': selectedTheme.color,
        '--bg-page': dark ? '#0f172a' : '#FDFCF8',
        '--glass-border': dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
      };
    }

    return this.themeEngine.styleMap();
  });

  // ── Constructor: effects must be created here, NOT in ngOnInit ────────────
  constructor() {
    // Apply text scale to root font size
    effect(() => {
      document.documentElement.style.fontSize = `${this.textScale()}%`;
    });

    effect(() => {
      this.themeEngine.apply({
        settings: this.state.globalSettings(),
        override: this.state.page()?.themeOverride,
        dark: this.isDarkMode()
      });
    });

    // Scroll to top on navigation
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: NavigationEnd) => {
      this._currentUrl.set(e.urlAfterRedirects);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this._buildThemeGroups();

    this.themeService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s: ThemeSettings) => {
        this.isDarkMode.set(s.isDarkMode);
        this.activeThemeId.set(
          s.isDarkMode ? 'theme-dark' : (s.lightThemeClass ?? 'theme-light')
        );
        if (s.textScale) this.textScale.set(s.textScale);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Theme actions ─────────────────────────────────────────────────────────

  selectTheme(id: string): void {
    if (id === 'theme-dark') {
      this.themeService.setDarkMode(true);
      this.activeThemeId.set('theme-dark');
    } else if (id === 'auto-theme') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeService.setDarkMode(prefersDark);
      this.activeThemeId.set(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      this.themeService.setLightTheme(id);
      this.themeService.setDarkMode(false);
      this.activeThemeId.set(id);
    }
  }

  toggleDarkMode(): void {
    this.themeService.setDarkMode(!this.isDarkMode());
  }

  updateTextScale(event: any): void {
    // PrimeNG Slider emits { originalEvent, value }
    const val = typeof event === 'number' ? event : (event?.value ?? 100);
    this.themeService.setTextScale(val);
    this.textScale.set(val);
  }

  resetToDefault(): void {
    this.selectTheme('auto-theme');
    this.textScale.set(100);
    document.documentElement.style.fontSize = '100%';
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _buildThemeGroups(): void {
    const labelMap: Record<string, string> = {
      core: 'Essentials',
      professional: 'Professional',
      minimal: 'Minimalist',
      colorful: 'Vibrant',
      luxury: 'Luxury',
      modern: 'Modern'
    };

    const cats = [...new Set(this.allThemes.map(t => t.category))];
    this.themeGroups.set(
      cats.map(cat => ({
        category: labelMap[cat] ?? (cat.charAt(0).toUpperCase() + cat.slice(1)),
        themes: this.allThemes.filter(t => t.category === cat)
      }))
    );
  }

  // ── Theme catalogue ───────────────────────────────────────────────────────

  readonly allThemes: Theme[] = [
    // Core
    { name: 'Auto', id: 'auto-theme', color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)', category: 'core', description: 'System preference' },
    { name: 'Light', id: 'theme-light', color: '#64748b', gradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', category: 'core', description: 'Clean light' },
    { name: 'Dark', id: 'theme-dark', color: '#0f172a', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', category: 'core', description: 'High-contrast dark' },
    // Professional
    { name: 'Titanium', id: 'theme-titanium', color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', category: 'professional', description: 'Industrial Cyan' },
    { name: 'Cobalt', id: 'theme-cobalt-steel', color: '#0284c7', gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', category: 'professional', description: 'Corporate Navy' },
    // Colorful
    { name: 'Rose', id: 'theme-rose', color: '#e11d48', gradient: 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)', category: 'colorful', description: 'Executive Crimson' },
    { name: 'Sunset', id: 'theme-sunset', color: '#ea580c', gradient: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)', category: 'colorful', description: 'Golden Hour' },
    { name: 'Nebula', id: 'theme-nebula', color: '#d946ef', gradient: 'linear-gradient(to right, #ec4899, #8b5cf6)', category: 'colorful', description: 'Electric Neon' },
    // Luxury
    { name: 'Luxury', id: 'theme-luxury', color: '#d4af37', gradient: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)', category: 'luxury', description: 'Onyx & Gold' },
    { name: 'Emerald', id: 'theme-emerald-regal', color: '#059669', gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', category: 'luxury', description: 'Wealth Green' },
    // Modern
    { name: 'Material', id: 'theme-material-you', color: '#c026d3', gradient: 'linear-gradient(135deg, #c026d3 0%, #a21caf 100%)', category: 'modern', description: 'Orchid' },
    { name: 'Oceanic', id: 'theme-oceanic', color: '#1CB5E0', gradient: 'linear-gradient(to right, #1CB5E0, #000046)', category: 'modern', description: 'Cyan to Deep Blue' }
  ];
}


// import {
//   Component,
//   inject,
//   computed,
//   effect,
//   viewChild,
//   signal,
//   OnInit,
//   OnDestroy,
//   ElementRef,
//   ViewEncapsulation
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router, NavigationEnd } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { Subject, filter, takeUntil } from 'rxjs';

// // ✅ PrimeNG Imports
// import { PopoverModule } from 'primeng/popover';
// import { Popover } from 'primeng/popover';
// import { SliderModule } from 'primeng/slider';
// import { TooltipModule } from 'primeng/tooltip';
// import { BadgeModule } from 'primeng/badge';

// // ✅ Services (Assumed paths based on context)
// import { StorefrontStateService } from '../../../core/services/storefront-state.service';
// import { ThemeService, ThemeSettings } from '../../../core/services/theme.service';
// import { NotificationService } from '../../../core/services/notification.service';

// // ✅ Components
// import { NavbarSimpleComponent } from '../components/navbar-simple/navbar-simple.component';
// import { FooterSimpleComponent } from '../components/footer-simple/footer-simple.component';
// import { LayoutService } from '../../../projectLayout/layout.service';
// import { AuthService } from '../../auth/services/auth-service';

// // ✅ Interfaces
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
//   selector: 'app-storefront-layout',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     FormsModule,
//     NavbarSimpleComponent,
//     FooterSimpleComponent,
//     PopoverModule,
//     SliderModule,
//     TooltipModule,
//     BadgeModule
//   ],
//   templateUrl: './storefront-layout.component.html',
//   styleUrls: ['./storefront-layout.component.scss'],
//   encapsulation: ViewEncapsulation.None
// })
// export class StorefrontLayoutComponent implements OnInit, OnDestroy {
//   // Dependency Injection
//   public state = inject(StorefrontStateService);
//   private themeService = inject(ThemeService);
//   private authService = inject(AuthService);
//   private notificationService = inject(NotificationService);
//   private layout = inject(LayoutService);
//   private router = inject(Router);

//   private destroy$ = new Subject<void>();

//   // ✅ ViewChildren using Signal queries (Angular 18+)
//   settingsPopover = viewChild<Popover>('settingsPopover');

//   // ✅ State Signals
//   activeTab = signal<'themes' | 'settings'>('themes');
//   currentUser = signal<any>(null);
//   recentNotifications = signal<any[]>([]);

//   // ✅ Theme State
//   isDarkMode = signal(false);
//   activeThemeId = signal('auto-theme');
//   textScale = signal(100);
//   themeGroups = signal<ThemeGroup[]>([]);

//   // ✅ Active Theme Computed (Merges Store Default + User Selection)
//   activeThemeStyle = computed(() => {
//     // 1. If user selected a specific theme from the list, use that
//     const selectedId = this.activeThemeId();
//     const selectedTheme = this.allThemes.find(t => t.id === selectedId);

//     if (selectedTheme && selectedId !== 'auto-theme') {
//       return {
//         '--primary': selectedTheme.color,
//         '--bg-page': this.isDarkMode() ? '#0f172a' : '#FDFCF8',
//         '--glass-border': this.isDarkMode() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
//       };
//     }

//     // 2. Fallback to Storefront State (Merchant Config)
//     const storeTheme = this.state.page()?.theme;
//     return {
//       '--primary': storeTheme?.primaryColor || '#000000',
//       '--secondary': storeTheme?.secondaryColor || '#666666',
//       '--bg-page': storeTheme?.backgroundColor || (this.isDarkMode() ? '#0f172a' : '#FDFCF8'),
//       '--glass-border': 'rgba(255,255,255,0.2)'
//     };
//   });

//   constructor() {
//     // Scroll to top on nav
//     this.router.events.pipe(
//       filter(e => e instanceof NavigationEnd),
//       takeUntil(this.destroy$)
//     ).subscribe(() => {
//       window.scrollTo({ top: 0, behavior: 'instant' });
//     });

//     // Effect to apply Text Scale to Root
//     effect(() => {
//       document.documentElement.style.fontSize = `${this.textScale()}%`;
//     });
//   }

//   ngOnInit() {
//     this.organizeThemes();
//     // Theme Settings Subscription
//     this.themeService.settings$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((s: ThemeSettings) => {
//         this.isDarkMode.set(s.isDarkMode);
//         this.activeThemeId.set(s.isDarkMode ? 'theme-dark' : (s.lightThemeClass || 'theme-light'));
//         if (s.textScale) this.textScale.set(s.textScale);
//       });
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // Helper: Is Home Page?
//   isHomePage(): boolean {
//     const slug = this.state.organization()?.slug;
//     return this.router.url.endsWith(`/${slug}`) || this.router.url.endsWith('/home');
//   }

//   // --- THEME LOGIC ---

//   organizeThemes() {
//     const categoryMapping: Record<string, string> = {
//       'core': 'Essentials',
//       'professional': 'Professional',
//       'minimal': 'Minimalist',
//       'colorful': 'Vibrant',
//       'luxury': 'Luxury',
//       'modern': 'Modern',
//     };

//     const categories = [...new Set(this.allThemes.map(t => t.category))];

//     const groups = categories.map(cat => ({
//       category: categoryMapping[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
//       themes: this.allThemes.filter(t => t.category === cat)
//     }));

//     this.themeGroups.set(groups);
//   }

//   selectTheme(id: string) {
//     if (id === 'theme-dark') {
//       this.themeService.setDarkMode(true);
//     } else if (id === 'auto-theme') {
//       const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       this.themeService.setDarkMode(prefersDark);
//       this.activeThemeId.set(prefersDark ? 'theme-dark' : 'theme-light');
//     } else {
//       this.themeService.setLightTheme(id);
//       this.themeService.setDarkMode(false);
//       this.activeThemeId.set(id);
//     }
//   }

//   toggleDarkModeSwitch() {
//     this.themeService.setDarkMode(!this.isDarkMode());
//   }

//   updateTextScale(event: any) {
//     // PrimeNG Slider emits { originalEvent, value }
//     const val = event.value || event;
//     this.themeService.setTextScale(val);
//   }

//   resetToDefault() {
//     this.selectTheme('auto-theme');
//     this.textScale.set(100);
//   }

//   // --- DATA ---
//   allThemes: Theme[] = [
//     // --- CORE THEMES ---
//     { name: "Auto", id: "auto-theme", color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", category: "core", description: "System preference" },
//     { name: "Light", id: "theme-light", color: "#64748b", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean data-optimized" },
//     { name: "Dark", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "High-contrast dark" },

//     // --- PROFESSIONAL ---
//     { name: "Titanium", id: "theme-titanium", color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)", category: "professional", description: "Industrial Cyan" },
//     { name: "Cobalt", id: "theme-cobalt-steel", color: "#0284c7", gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", category: "professional", description: "Corporate Navy" },

//     // --- COLORFUL ---
//     { name: "Rose", id: "theme-rose", color: "#e11d48", gradient: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)", category: "colorful", description: "Executive Crimson" },
//     { name: "Sunset", id: "theme-sunset", color: "#ea580c", gradient: "linear-gradient(135deg, #ea580c 0%, #db2777 100%)", category: "colorful", description: "Golden Hour Glow" },
//     { name: "Nebula", id: "theme-nebula", color: "#d946ef", gradient: "linear-gradient(to right, #ec4899, #8b5cf6)", category: "colorful", description: "Electric Neon" },

//     // --- LUXURY ---
//     { name: "Luxury", id: "theme-luxury", color: "#d4af37", gradient: "linear-gradient(135deg, #d4af37 0%, #b45309 100%)", category: "luxury", description: "Sharp Onyx & Gold" },
//     { name: "Emerald", id: "theme-emerald-regal", color: "#059669", gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)", category: "luxury", description: "Wealth Green" },

//     // --- MODERN ---
//     { name: "Material", id: "theme-material-you", color: "#c026d3", gradient: "linear-gradient(135deg, #c026d3 0%, #a21caf 100%)", category: "modern", description: "Android Orchid" },
//     { name: "Oceanic", id: "theme-oceanic", color: "#1CB5E0", gradient: "linear-gradient(to right, #1CB5E0, #000046)", category: "modern", description: "Cyan to Deep Blue" }
//   ];
// }
