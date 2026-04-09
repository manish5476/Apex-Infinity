import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ThemeService } from './theme.service';
import { takeUntil } from "rxjs/operators";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PatternType = 'none' | 'css' | 'svg' | 'gradient';

export interface BackgroundPattern {
  id: string;
  name: string;
  type: PatternType;
  description: string;
}

export interface PatternSettings {
  patternId: string;
  opacity: number; // 0.3 – 1.0 (multiplied on pattern layer)
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Registry
// ─────────────────────────────────────────────────────────────────────────────

export const BACKGROUND_PATTERNS: BackgroundPattern[] = [
  { id: 'none', name: 'None', type: 'none', description: 'Solid theme surface' },

  // CSS Geometric
  { id: 'dots', name: 'Dots', type: 'css', description: 'Radial dot grid' },
  { id: 'grid', name: 'Grid', type: 'css', description: 'Fine line grid' },
  { id: 'lines-h', name: 'Lines', type: 'css', description: 'Horizontal lines' },
  { id: 'lines-d', name: 'Diagonal', type: 'css', description: 'Diagonal stripes' },
  { id: 'crosshatch', name: 'Crosshatch', type: 'css', description: 'Cross-hatched lines' },

  // SVG
  { id: 'hexagons', name: 'Hexagons', type: 'svg', description: 'Honeycomb hexagon grid' },
  { id: 'triangles', name: 'Triangles', type: 'svg', description: 'Triangle mesh' },
  { id: 'circuits', name: 'Circuits', type: 'svg', description: 'Circuit board paths' },
  { id: 'waves', name: 'Waves', type: 'svg', description: 'Repeating wave lines' },

  // Gradient / Aurora
  { id: 'aurora', name: 'Aurora', type: 'gradient', description: 'Soft dual aurora glow' },
  { id: 'gradient-mesh', name: 'Mesh', type: 'gradient', description: 'Four-corner gradient mesh' },
  { id: 'sunset', name: 'Sunset', type: 'gradient', description: 'Diagonal accent glow' },
  { id: 'vignette', name: 'Vignette', type: 'gradient', description: 'Subtle edge tint' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SVG Pattern Templates
// Accent color is injected at runtime so patterns use the current theme's accent
// ─────────────────────────────────────────────────────────────────────────────

const SVG_TEMPLATES: Record<string, (color: string) => { svg: string; size: string }> = {
  hexagons: (c) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='100'>
            <polygon points='28,2 54,16 54,44 28,58 2,44 2,16'
              fill='none' stroke='${c}' stroke-width='1'/>
            <polygon points='28,52 54,66 54,94 28,108 2,94 2,66'
              fill='none' stroke='${c}' stroke-width='1'/>
          </svg>`,
    size: '56px 100px'
  }),
  triangles: (c) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
            <polygon points='20,2 38,36 2,36'
              fill='none' stroke='${c}' stroke-width='0.8'/>
          </svg>`,
    size: '40px 40px'
  }),
  circuits: (c) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>
            <path d='M10 10 L30 10 L30 30 M50 10 L30 10 M10 50 L10 30 L30 30 L30 50 M50 50 L50 30 L30 30'
              fill='none' stroke='${c}' stroke-width='1' stroke-linecap='round'/>
            <circle cx='10' cy='10' r='2' fill='${c}'/>
            <circle cx='30' cy='30' r='2' fill='${c}'/>
            <circle cx='50' cy='50' r='2' fill='${c}'/>
          </svg>`,
    size: '60px 60px'
  }),
  waves: (c) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='20'>
            <path d='M0 10 Q20 0 40 10 Q60 20 80 10'
              fill='none' stroke='${c}' stroke-width='1'/>
          </svg>`,
    size: '80px 20px'
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ThemePatternService implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private themeService = inject(ThemeService);
  private readonly STORAGE_KEY = 'bgPatternSettings-v1';
  private readonly LAYOUT_SELECTOR = '.apex-layout'; // your main layout wrapper class

  private readonly defaultSettings: PatternSettings = {
    patternId: 'none',
    opacity: 1.0
  };

  private settingsSubject = new BehaviorSubject<PatternSettings>(this.loadSettings());
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    // Apply pattern on init
    this.applyPattern(this.settingsSubject.value);

    // Re-apply SVG patterns whenever theme changes (accent color may differ)
    this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const current = this.settingsSubject.value;
      if (this.isSvgPattern(current.patternId)) {
        // Small delay to let CSS vars settle after theme class is applied
        setTimeout(() => this.applySvgPattern(current.patternId, current.opacity), 50);
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  setPattern(patternId: string): void {
    this.updateSettings({ ...this.settingsSubject.value, patternId });
  }

  setOpacity(opacity: number): void {
    const clamped = Math.min(1, Math.max(0.1, opacity));
    this.updateSettings({ ...this.settingsSubject.value, opacity: clamped });
  }

  resetPattern(): void {
    this.updateSettings(this.defaultSettings);
  }

  getPatternsByType(type: PatternType): BackgroundPattern[] {
    return BACKGROUND_PATTERNS.filter(p => p.type === type);
  }

  getAll(): BackgroundPattern[] {
    return BACKGROUND_PATTERNS;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private updateSettings(settings: PatternSettings): void {
    this.settingsSubject.next(settings);
    this.saveSettings(settings);
    this.applyPattern(settings);
  }

  private applyPattern(settings: PatternSettings): void {
    const html = document.documentElement;
    const layout = document.querySelector<HTMLElement>(this.LAYOUT_SELECTOR);

    // Set data attribute — triggers all CSS pattern rules in the SCSS
    html.setAttribute('data-bg-pattern', settings.patternId);
    if (layout) layout.setAttribute('data-bg-pattern', settings.patternId);

    // Apply opacity as CSS variable so patterns can consume it
    html.style.setProperty('--pattern-opacity', String(settings.opacity));

    // SVG patterns need runtime color injection
    if (this.isSvgPattern(settings.patternId)) {
      setTimeout(() => this.applySvgPattern(settings.patternId, settings.opacity), 50);
    }
  }

  /**
   * SVG patterns can't use color-mix() in CSS because they're data URIs.
   * We resolve the computed accent color and inject it directly into the SVG.
   */
  private applySvgPattern(patternId: string, opacity: number): void {
    const template = SVG_TEMPLATES[patternId];
    if (!template) return;

    // Resolve the current theme's accent color from computed styles
    const accentHex = this.resolveAccentColor();
    const accentWithAlpha = this.hexToRgba(accentHex, opacity * 0.2);

    const { svg, size } = template(accentWithAlpha);
    const dataUri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

    const html = document.documentElement;
    const layout = document.querySelector<HTMLElement>(this.LAYOUT_SELECTOR);

    html.style.backgroundImage = dataUri;
    html.style.backgroundSize = size;
    if (layout) {
      layout.style.backgroundImage = dataUri;
      layout.style.backgroundSize = size;
    }
  }

  /** Read --accent-primary from computed styles on <html> */
  private resolveAccentColor(): string {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-primary')
      .trim();

    // If it's already a hex value, return directly
    if (raw.startsWith('#')) return raw;

    // If it's rgb/rgba, convert to hex
    const match = raw.match(/\d+/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(Number);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    return '#6366f1'; // fallback
  }

  private hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
  }

  private isSvgPattern(id: string): boolean {
    return id in SVG_TEMPLATES;
  }

  private loadSettings(): PatternSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? { ...this.defaultSettings, ...JSON.parse(stored) } : this.defaultSettings;
    } catch {
      return this.defaultSettings;
    }
  }

  private saveSettings(s: PatternSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(s));
    } catch {
      console.warn('ThemePatternService: Unable to save pattern settings.');
    }
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}