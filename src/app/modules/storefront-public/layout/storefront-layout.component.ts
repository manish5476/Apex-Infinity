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
import { StorefrontStateService } from '@core/services/storefront-state.service';
import { StorefrontPublicService } from '@core/services/storefront-public.service';
import { LayoutSectionRendererComponent } from './layout-section-renderer.component';

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
    LayoutSectionRendererComponent,
    PopoverModule, SliderModule, TooltipModule
  ],
  templateUrl: './storefront-layout.component.html',
  styleUrls: ['./storefront-layout.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StorefrontLayoutComponent implements OnInit, OnDestroy {

  public state = inject(StorefrontStateService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private publicService = inject(StorefrontPublicService);
  private destroy$ = new Subject<void>();

  // ── Theme state signals ───────────────────────────────────────────────────
  isDarkMode = signal(false);
  activeThemeId = signal('auto-theme');
  textScale = signal(100);
  themeGroups = signal<ThemeGroup[]>([]);

  // Internal signal to make router.url reactive
  private _currentUrl = signal(this.router.url);

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

  // ── Computed: CSS variable map for the page shell ─────────────────────────
  activeThemeStyle = computed<Record<string, string>>(() => {
    const selectedId = this.activeThemeId();
    const selectedTheme = this.allThemes.find(t => t.id === selectedId);
    const dark = this.isDarkMode();

    // User selected a named theme — use its colour
    if (selectedTheme && selectedId !== 'auto-theme') {
      return {
        '--primary': selectedTheme.color,
        '--secondary': selectedTheme.color,
        '--bg-page': dark ? 'var(--text-primary)' : '#FDFCF8',
        '--glass-border': dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        
        // Expose standard variables to all child pages (commerce-flow, product-listing, etc)
        '--color-primary': selectedTheme.color,
        '--bg-primary': dark ? 'var(--text-primary)' : 'var(--bg-primary)',
        '--bg-secondary': dark ? 'var(--text-primary)' : 'var(--bg-secondary)',
        '--border-secondary': dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        '--text-primary': dark ? 'var(--bg-secondary)' : 'var(--text-primary)',
        '--text-secondary': dark ? 'var(--text-secondary)' : 'var(--text-secondary)'
      };
    }

    // Fallback to Storefront State (Merchant Config)
    const globalSettings = this.state.globalSettings();
    const pageTheme = this.state.page()?.themeOverride;
    
    // Check if the backend gave us a presetId (e.g., from page override)
    const backendPresetId = pageTheme?.presetId;
    const backendPreset = backendPresetId ? this.allThemes.find(t => t.id === backendPresetId) : null;
    
    // Priority: Page Override Preset > Global Settings Color > Defaults
    let primary = 'var(--accent-primary)';
    let secondary = 'var(--text-secondary)';
    
    if (backendPreset) {
      primary = backendPreset.color;
      secondary = backendPreset.color;
    } else {
      // NOTE: globalSettings currently only stores the raw color from Theme Marketplace
      primary = pageTheme?.customSettings?.primaryColor || globalSettings?.colors?.primary || 'var(--accent-primary)';
      secondary = pageTheme?.customSettings?.secondaryColor || globalSettings?.colors?.secondary || 'var(--text-secondary)';
    }

    return {
      '--primary': primary,
      '--secondary': secondary,
      '--bg-page': dark ? 'var(--text-primary)' : '#FDFCF8',
      '--glass-border': dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',

      // Expose standard variables to all child pages
      '--color-primary': primary,
      '--bg-primary': dark ? 'var(--text-primary)' : 'var(--bg-primary)',
      '--bg-secondary': dark ? 'var(--text-primary)' : 'var(--bg-secondary)',
      '--border-secondary': dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      '--text-primary': dark ? 'var(--bg-secondary)' : 'var(--text-primary)',
      '--text-secondary': dark ? 'var(--text-secondary)' : 'var(--text-secondary)'
    };
  });

  // ── Constructor: effects must be created here, NOT in ngOnInit ────────────
  constructor() {
    // Apply text scale to root font size
    effect(() => {
      document.documentElement.style.fontSize = `${this.textScale()}%`;
    });

    // Scroll to top on navigation
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: any) => {
      this._currentUrl.set(e.urlAfterRedirects);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

  ngOnInit(): void {
    this._buildThemeGroups();

    // If layout is missing (e.g., direct navigation to /cart), fetch the home page to populate the layout
    const slug = this.state.organization()?.slug || this.router.url.split('/')[2];
    if (slug && (!this.state.layout() || !this.state.organization())) {
      this.publicService.getPage(slug, 'home').subscribe({
        next: (res) => {
          if (res?.data) this.state.setState(res.data);
        }
      });
    }

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
    // --- CORE THEMES ---
    { name: 'Auto', id: 'auto-theme', color: 'var(--accent-primary)', gradient: 'linear-gradient(135deg, var(--accent-primary) 0%, #0ea5e9 100%)', category: 'core', description: 'Auto-detects system preference' },
    { name: 'Glass', id: 'theme-glass', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)', category: 'core', description: 'Modern professional glassmorphism' },
    { name: 'Light', id: 'theme-light', color: 'var(--bg-secondary)', gradient: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--border-primary) 100%)', category: 'core', description: 'Clean data-optimized light mode' },
    { name: 'Dark', id: 'theme-dark', color: 'var(--text-primary)', gradient: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-primary) 100%)', category: 'core', description: 'Enhanced high-contrast dark mode' },
    { name: 'Bio Frost', id: 'theme-bio-frost', color: '#34d399', gradient: 'linear-gradient(135deg, #34d399 0%, var(--color-success) 100%)', category: 'core', description: 'Milky white glass with emerald accents' },

    // --- PROFESSIONAL ---
    { name: 'Premium', id: 'theme-premium', color: '#0d9488', gradient: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)', category: 'professional', description: 'Rich Teal & Sky Blue' },
    { name: 'Titanium', id: 'theme-titanium', color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', category: 'professional', description: 'Industrial Cyan & Silver' },
    { name: 'Slate', id: 'theme-slate', color: 'var(--text-primary)', gradient: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)', category: 'professional', description: 'Executive Gunmetal Gray' },
    { name: 'Data Science', id: 'theme-data-science', color: 'var(--accent-primary)', gradient: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary) 100%)', category: 'professional', description: 'Analytics optimized Blue' },
    { name: 'Cobalt Steel', id: 'theme-cobalt-steel', color: '#0284c7', gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', category: 'professional', description: 'Corporate Navy & Sapphire' },
    { name: 'Luminous', id: 'theme-luminous', color: '#4f46e5', gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', category: 'professional', description: 'Clean Executive Indigo' },

    // --- MINIMAL ---
    { name: 'Minimal', id: 'theme-minimal', color: '#171717', gradient: 'linear-gradient(135deg, #171717 0%, #404040 100%)', category: 'minimal', description: 'Stark High-Fashion Monochrome' },
    { name: 'Monochrome', id: 'theme-monochrome', color: '#09090b', gradient: 'linear-gradient(135deg, #09090b 0%, #27272a 100%)', category: 'minimal', description: 'Architectural Pure Black' },

    // --- COLORFUL ---
    { name: 'Rose', id: 'theme-rose', color: 'var(--color-error)', gradient: 'linear-gradient(135deg, #be123c 0%, var(--color-error) 100%)', category: 'colorful', description: 'Executive Crimson & Merlot' },
    { name: 'Sunset', id: 'theme-sunset', color: '#ea580c', gradient: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)', category: 'colorful', description: 'Vibrant Golden Hour Glow' },
    { name: 'Bold', id: 'theme-bold', color: '#d946ef', gradient: 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)', category: 'colorful', description: 'High-Voltage Neon Cyberpunk' },
    { name: 'Nebula', id: 'theme-nebula', color: '#d946ef', gradient: 'linear-gradient(to right, #ec4899, #8b5cf6)', category: 'colorful', description: 'Electric Future Neon' },

    // --- LUXURY ---
    { name: 'Luxury', id: 'theme-luxury', color: '#d4af37', gradient: 'linear-gradient(135deg, #d4af37 0%, var(--color-warning) 100%)', category: 'luxury', description: 'Sharp Onyx & Gold' },
    { name: 'Futuristic', id: 'theme-futuristic', color: 'var(--accent-primary)', gradient: 'linear-gradient(135deg, var(--accent-primary) 0%, #06b6d4 100%)', category: 'luxury', description: 'Sci-Fi HUD Blue' },
    { name: 'Midnight Royal', id: 'theme-midnight-royal', color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', category: 'luxury', description: 'Deep Navy & Electric Violet' },
    { name: 'Emerald Regal', id: 'theme-emerald-regal', color: '#059669', gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', category: 'luxury', description: 'Wealth & Finance Green' },
    { name: 'Solar Flare', id: 'theme-solar-flare', color: '#fb923c', gradient: 'linear-gradient(135deg, #fb923c 0%, #db2777 100%)', category: 'luxury', description: 'Deep molten glass with warm amber glow' },
    { name: 'Crimson Night', id: 'theme-crimson-night', color: '#6f0000', gradient: 'linear-gradient(to right, #6f0000, #200122)', category: 'luxury', description: 'Dark Blood Red to Purple' },

    // --- MODERN ---
    { name: 'Material You', id: 'theme-material-you', color: '#c026d3', gradient: 'linear-gradient(135deg, #c026d3 0%, #a21caf 100%)', category: 'modern', description: 'Deep Orchid Android 14' },
    { name: 'Horizon', id: 'theme-horizon', color: '#F56217', gradient: 'linear-gradient(to right, #F56217, #0B486B)', category: 'colorful', description: 'Vibrant orange to deep ocean blue' },
    { name: 'Midnight City', id: 'theme-midnight-city', color: '#243B55', gradient: 'linear-gradient(to right, #243B55, #141E30)', category: 'professional', description: 'Deep Steel Blue Gradient' },
    { name: 'Synthwave', id: 'theme-synthwave', color: '#ff6a00', gradient: 'linear-gradient(to right, #ff6a00, #ee0979)', category: 'colorful', description: 'Vibrant Orange to Pink' },
    { name: 'Oceanic', id: 'theme-oceanic', color: '#1CB5E0', gradient: 'linear-gradient(to right, #1CB5E0, #000046)', category: 'modern', description: 'Bright Cyan to Deep Blue' },
    { name: 'Neumorphic', id: 'theme-neumorphic', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', category: 'modern', description: 'Soft Tech Slate' },
    { name: 'Deep Space', id: 'theme-deep-space', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4 0%, var(--accent-primary) 100%)', category: 'modern', description: 'Void Black & Cyan' }
  ];
}
