import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketConnectionService } from './socket/socket-connection.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { ThemeFontLoader } from './apex-font-loader';

// ─────────────────────────────────────────────────────────────────────────────
// Theme Settings
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeSettings {
  lightThemeClass: string;
  isDarkMode: boolean;
  textScale: number;
  patternId: string;
  patternOpacity: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Registry
// ─────────────────────────────────────────────────────────────────────────────

export type PatternType = 'none' | 'css' | 'svg' | 'gradient';

export interface BackgroundPattern {
  id: string;
  name: string;
  type: PatternType;
  description: string;
  icon: string; // pi icon class
}

export const BACKGROUND_PATTERNS: BackgroundPattern[] = [
  { id: 'none', name: 'None', type: 'none', description: 'Solid theme surface', icon: 'pi-ban' },

  // CSS Geometric
  { id: 'dots', name: 'Dots', type: 'css', description: 'Radial dot grid', icon: 'pi-th-large' },
  { id: 'grid', name: 'Grid', type: 'css', description: 'Fine line grid', icon: 'pi-table' },
  { id: 'lines-h', name: 'Lines', type: 'css', description: 'Horizontal stripes', icon: 'pi-minus' },
  { id: 'lines-d', name: 'Diagonal', type: 'css', description: 'Diagonal stripes', icon: 'pi-sort-alt' },
  { id: 'crosshatch', name: 'Crosshatch', type: 'css', description: 'Cross-hatched lines', icon: 'pi-hashtag' },

  // SVG
  { id: 'hexagons', name: 'Hexagons', type: 'svg', description: 'Honeycomb hexagon grid', icon: 'pi-stop' },
  { id: 'triangles', name: 'Triangles', type: 'svg', description: 'Triangle mesh', icon: 'pi-play' },
  { id: 'circuits', name: 'Circuits', type: 'svg', description: 'Circuit board paths', icon: 'pi-share-alt' },
  { id: 'waves', name: 'Waves', type: 'svg', description: 'Repeating wave lines', icon: 'pi-wave-pulse' },

  // Gradient / Aurora
  { id: 'aurora', name: 'Aurora', type: 'gradient', description: 'Soft dual aurora glow', icon: 'pi-sun' },
  { id: 'gradient-mesh', name: 'Mesh', type: 'gradient', description: 'Four-corner gradient mesh', icon: 'pi-chart-pie' },
  { id: 'sunset', name: 'Sunset', type: 'gradient', description: 'Diagonal accent glow', icon: 'pi-circle' },
  { id: 'vignette', name: 'Vignette', type: 'gradient', description: 'Subtle edge tint', icon: 'pi-camera' },
];

// SVG pattern templates — accent color injected at runtime
const SVG_TEMPLATES: Record<string, (color: string) => { svg: string; size: string }> = {
  hexagons: (c) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='100'><polygon points='28,2 54,16 54,44 28,58 2,44 2,16' fill='none' stroke='${c}' stroke-width='1'/><polygon points='28,52 54,66 54,94 28,108 2,94 2,66' fill='none' stroke='${c}' stroke-width='1'/></svg>`,
    size: '56px 100px'
  }),
  triangles: (c) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><polygon points='20,2 38,36 2,36' fill='none' stroke='${c}' stroke-width='0.8'/></svg>`,
    size: '40px 40px'
  }),
  circuits: (c) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M10 10 L30 10 L30 30 M50 10 L30 10 M10 50 L10 30 L30 30 L30 50 M50 50 L50 30 L30 30' fill='none' stroke='${c}' stroke-width='1' stroke-linecap='round'/><circle cx='10' cy='10' r='2' fill='${c}'/><circle cx='30' cy='30' r='2' fill='${c}'/><circle cx='50' cy='50' r='2' fill='${c}'/></svg>`,
    size: '60px 60px'
  }),
  waves: (c) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='20'><path d='M0 10 Q20 0 40 10 Q60 20 80 10' fill='none' stroke='${c}' stroke-width='1'/></svg>`,
    size: '80px 20px'
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ThemeService
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private socketService = inject(SocketConnectionService);
  private authService = inject(AuthService);
  private readonly STORAGE_KEY = 'themeSettings-v4'; // bumped version — merges pattern

  private readonly defaultSettings: ThemeSettings = {
    lightThemeClass: 'theme-light',
    isDarkMode: false,
    textScale: 100,
    patternId: 'none',
    patternOpacity: 1.0,
  };

  // Layout wrapper selector for pattern application
  private readonly LAYOUT_SELECTOR = '.apex-layout';

  private settingsSubject = new BehaviorSubject<ThemeSettings>(this.loadSettings());
  settings$ = this.settingsSubject.asObservable();

  /** Expose flat pattern list for use in components */
  readonly allPatterns = BACKGROUND_PATTERNS;

  /** Pattern groups by type — ready for template iteration */
  readonly patternGroups: { label: string; type: PatternType; patterns: BackgroundPattern[] }[] = [
    { label: 'CSS Geometric', type: 'css', patterns: BACKGROUND_PATTERNS.filter(p => p.type === 'css') },
    { label: 'SVG', type: 'svg', patterns: BACKGROUND_PATTERNS.filter(p => p.type === 'svg') },
    { label: 'Gradient', type: 'gradient', patterns: BACKGROUND_PATTERNS.filter(p => p.type === 'gradient') },
  ];

  private socketSub?: Subscription;

  constructor() {
    const initialSettings = this.settingsSubject.value;
    ThemeFontLoader.preloadThemes(['theme-light', 'theme-dark', initialSettings.lightThemeClass]);
    this.applyTheme(initialSettings);
    this.setupSocketListener();
    this.listenToUserChanges();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Socket & Auth Listeners (unchanged from original)
  // ─────────────────────────────────────────────────────────────────────────

  private setupSocketListener() {
    this.socketService.themeChanged$.subscribe(({ themeId }) => {
      const current = this.settingsSubject.value;
      let newSettings: ThemeSettings;

      if (themeId === 'theme-dark') {
        newSettings = { ...current, isDarkMode: true };
      } else if (themeId === 'theme-light' || themeId.startsWith('theme-')) {
        newSettings = { ...current, isDarkMode: false, lightThemeClass: themeId };
      } else {
        return;
      }

      if (JSON.stringify(newSettings) !== JSON.stringify(current)) {
        this.updateSettings(newSettings, false);
      }
    });
  }

  private listenToUserChanges() {
    this.authService.currentUser$.subscribe(user => {
      if (user?.preferences?.theme) {
        const isDark = user.preferences.theme === 'dark';
        const current = this.settingsSubject.value;
        if (current.isDarkMode !== isDark) {
          this.updateSettings({ ...current, isDarkMode: isDark }, false);
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Load & Save
  // ─────────────────────────────────────────────────────────────────────────

  private loadSettings(): ThemeSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure 'textScale' exists if loading old data
        return { ...this.defaultSettings, ...parsed };
      }
      return this.defaultSettings;
    } catch {
      return this.defaultSettings;
    }
  }

  private saveSettings(settings: ThemeSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch {
      console.warn('ThemeService: Unable to save theme settings.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Apply Theme (theme class + fonts + pattern)
  // ─────────────────────────────────────────────────────────────────────────

  private async applyTheme(settings: ThemeSettings): Promise<void> {
    const html = document.documentElement;
    const targetThemeId = settings.isDarkMode ? 'theme-dark' : settings.lightThemeClass;

    // 1. Load fonts before applying class
    await ThemeFontLoader.loadFontsForTheme(targetThemeId);

    // 2. Swap theme class on <html>
    html.classList.forEach(cls => {
      if (cls.startsWith('theme-')) html.classList.remove(cls);
    });
    html.classList.add(targetThemeId);

    // 3. Font scale
    html.style.fontSize = `${settings.textScale}%`;

    // 4. Apply background pattern
    //    Small delay ensures new theme CSS vars are resolved before SVG color reads
    setTimeout(() => this.applyPattern(settings), 60);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pattern Application
  // ─────────────────────────────────────────────────────────────────────────

  private applyPattern(settings: ThemeSettings): void {
    const html = document.documentElement;
    const layout = document.querySelector<HTMLElement>(this.LAYOUT_SELECTOR);

    // Clear any previously injected inline SVG backgroundImage first
    html.style.removeProperty('background-image');
    html.style.removeProperty('background-size');
    if (layout) {
      layout.style.removeProperty('background-image');
      layout.style.removeProperty('background-size');
    }

    // Set the data attribute — triggers all CSS/gradient rules in the SCSS
    html.setAttribute('data-bg-pattern', settings.patternId);
    if (layout) layout.setAttribute('data-bg-pattern', settings.patternId);

    // Expose opacity as CSS var for SCSS consumption
    html.style.setProperty('--pattern-opacity', String(settings.patternOpacity));

    // SVG patterns need runtime color injection since data URIs can't use CSS vars
    if (this.isSvgPattern(settings.patternId)) {
      this.applySvgPattern(settings.patternId, settings.patternOpacity);
    }
  }

  private applySvgPattern(patternId: string, opacity: number): void {
    const template = SVG_TEMPLATES[patternId];
    if (!template) return;

    const accentHex = this.resolveAccentColor();
    const accentRgba = this.hexToRgba(accentHex, opacity * 0.2);
    const { svg, size } = template(accentRgba);
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

  /** Reads --accent-primary computed value from <html> and normalises to hex */
  private resolveAccentColor(): string {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-primary')
      .trim();

    if (raw.startsWith('#')) return raw;

    const match = raw.match(/\d+/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(Number);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return '#6366f1'; // safe fallback
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

  // ─────────────────────────────────────────────────────────────────────────
  // Public API — Theme
  // ─────────────────────────────────────────────────────────────────────────

  setLightTheme(themeClass: string): void {
    this.updateSettings({
      ...this.settingsSubject.value,
      lightThemeClass: themeClass,
      isDarkMode: false,
    });
  }

  setDarkMode(isDarkMode: boolean): void {
    this.updateSettings({ ...this.settingsSubject.value, isDarkMode });
  }

  setTextScale(scale: number): void {
    this.updateSettings({ ...this.settingsSubject.value, textScale: scale });
  }

  resetTheme(): void {
    this.updateSettings(this.defaultSettings);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API — Pattern
  // ─────────────────────────────────────────────────────────────────────────

  setPattern(patternId: string): void {
    this.updateSettings({ ...this.settingsSubject.value, patternId });
  }

  setPatternOpacity(opacity: number): void {
    const clamped = Math.min(1, Math.max(0.1, opacity));
    this.updateSettings({ ...this.settingsSubject.value, patternOpacity: clamped });
  }

  resetPattern(): void {
    this.updateSettings({
      ...this.settingsSubject.value,
      patternId: this.defaultSettings.patternId,
      patternOpacity: this.defaultSettings.patternOpacity,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal
  // ─────────────────────────────────────────────────────────────────────────

  private updateSettings(settings: ThemeSettings, emitSocket: boolean = true): void {
    this.settingsSubject.next(settings);
    this.saveSettings(settings);
    this.applyTheme(settings);

    if (emitSocket && this.authService.isLoggedIn()) {
      const themeId = settings.isDarkMode ? 'theme-dark' : settings.lightThemeClass;
      this.socketService.updateTheme(themeId);
      this.authService.updateUserPreferences({
        theme: settings.isDarkMode ? 'dark' : 'light'
      });
    }
  }
}
// import { Injectable, inject } from '@angular/core';
// import { BehaviorSubject, Subscription } from 'rxjs';
// import { SocketConnectionService } from './socket/socket-connection.service';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { ThemeFontLoader } from './apex-font-loader'; // 🟢 Import the new Font Loader

// /**
//  * Defines the structure for saved theme settings.
//  */
// export interface ThemeSettings {
//   lightThemeClass: string; // e.g. 'theme-light', 'theme-ivory'
//   isDarkMode: boolean;     // true or false
//   textScale: number;       // Percentage: 100, 110, 125, etc.
// }

// @Injectable({ providedIn: 'root' })
// export class ThemeService {
//   private socketService = inject(SocketConnectionService);
//   private authService = inject(AuthService);
//   private readonly STORAGE_KEY = 'themeSettings-v3';

//   // Default settings (100% scale = 16px browser default)
//   private readonly defaultSettings: ThemeSettings = {
//     lightThemeClass: 'theme-light',
//     isDarkMode: false,
//     textScale: 100
//   };

//   private settingsSubject = new BehaviorSubject<ThemeSettings>(this.loadSettings());
//   settings$ = this.settingsSubject.asObservable();
//   private socketSub?: Subscription;

//   constructor() {
//     const initialSettings = this.settingsSubject.value;

//     // 🟢 Preload the default/fallback themes instantly in the background
//     ThemeFontLoader.preloadThemes(['theme-light', 'theme-dark', initialSettings.lightThemeClass]);

//     this.applyTheme(initialSettings);
//     this.setupSocketListener();
//     this.listenToUserChanges();
//   }

//   private setupSocketListener() {
//     this.socketService.themeChanged$.subscribe(({ themeId }) => {
//       const current = this.settingsSubject.value;
//       let newSettings: ThemeSettings;

//       if (themeId === 'theme-dark') {
//         newSettings = { ...current, isDarkMode: true };
//       } else if (themeId === 'theme-light' || themeId.startsWith('theme-')) {
//         newSettings = { ...current, isDarkMode: false, lightThemeClass: themeId };
//       } else {
//         return; // Ignore unknown IDs
//       }

//       if (JSON.stringify(newSettings) !== JSON.stringify(current)) {
//         this.updateSettings(newSettings, false); // Don't emit back to socket
//       }
//     });
//   }

//   private listenToUserChanges() {
//     this.authService.currentUser$.subscribe(user => {
//       if (user?.preferences?.theme) {
//         const isDark = user.preferences.theme === 'dark';
//         const current = this.settingsSubject.value;
//         if (current.isDarkMode !== isDark) {
//           this.updateSettings({ ...current, isDarkMode: isDark }, false);
//         }
//       }
//     });
//   }

//   // ----------------------------------------------------------------
//   // ✅ Load & Save Settings
//   // ----------------------------------------------------------------
//   private loadSettings(): ThemeSettings {
//     try {
//       const stored = localStorage.getItem(this.STORAGE_KEY);
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         return { ...this.defaultSettings, ...parsed };
//       }
//       return this.defaultSettings;
//     } catch {
//       return this.defaultSettings;
//     }
//   }

//   private saveSettings(settings: ThemeSettings) {
//     try {
//       localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
//     } catch {
//       console.warn('ThemeService: Unable to save theme settings.');
//     }
//   }

//   // ----------------------------------------------------------------
//   // ✅ Apply Theme (Updated for Fonts & :root)
//   // ----------------------------------------------------------------
//   private async applyTheme(settings: ThemeSettings) {
//     // 🟢 Target <html> instead of <body> so `:root:not([class*="theme-"])` works
//     const html = document.documentElement;

//     // Determine the target theme ID
//     const targetThemeId = settings.isDarkMode ? 'theme-dark' : settings.lightThemeClass;

//     // 🟢 Load the fonts dynamically BEFORE applying the class
//     await ThemeFontLoader.loadFontsForTheme(targetThemeId);

//     // 1. Remove all previous theme classes from <html>
//     html.classList.forEach(cls => {
//       if (cls.startsWith('theme-')) {
//         html.classList.remove(cls);
//       }
//     });

//     // 2. Apply the correct theme class to <html>
//     html.classList.add(targetThemeId);

//     // 3. Apply Font Scale (Scale root font size)
//     html.style.fontSize = `${settings.textScale}%`;
//   }

//   // ----------------------------------------------------------------
//   // ✅ Public Methods
//   // ----------------------------------------------------------------

//   setLightTheme(themeClass: string) {
//     const newSettings: ThemeSettings = {
//       ...this.settingsSubject.value,
//       lightThemeClass: themeClass,
//       isDarkMode: false,
//     };
//     this.updateSettings(newSettings);
//   }

//   setDarkMode(isDarkMode: boolean) {
//     const newSettings: ThemeSettings = {
//       ...this.settingsSubject.value,
//       isDarkMode,
//     };
//     this.updateSettings(newSettings);
//   }

//   setTextScale(scale: number) {
//     const newSettings: ThemeSettings = {
//       ...this.settingsSubject.value,
//       textScale: scale,
//     };
//     this.updateSettings(newSettings);
//   }

//   resetTheme() {
//     this.updateSettings(this.defaultSettings);
//   }

//   private updateSettings(settings: ThemeSettings, emitSocket: boolean = true) {
//     this.settingsSubject.next(settings);
//     this.saveSettings(settings);
//     this.applyTheme(settings); // 🟢 This is now async, but we let it run in the background

//     if (emitSocket && this.authService.isLoggedIn()) {
//       const themeId = settings.isDarkMode ? 'theme-dark' : settings.lightThemeClass;
//       this.socketService.updateTheme(themeId);

//       this.authService.updateUserPreferences({
//         theme: settings.isDarkMode ? 'dark' : 'light'
//       });
//     }
//   }
// }


// // import { Injectable, inject } from '@angular/core';
// // import { BehaviorSubject, Subscription } from 'rxjs';
// // import { SocketConnectionService } from './socket/socket-connection.service';
// // import { AuthService } from '../../modules/auth/services/auth-service';

// // /**
// //  * Defines the structure for saved theme settings.
// //  */
// // export interface ThemeSettings {
// //   lightThemeClass: string; // e.g. 'theme-light', 'theme-premium'
// //   isDarkMode: boolean;     // true or false
// //   textScale: number;       // Percentage: 100, 110, 125, etc.
// // }

// // @Injectable({ providedIn: 'root' })
// // export class ThemeService {
// //   private socketService = inject(SocketConnectionService);
// //   private authService = inject(AuthService);
// //   private readonly STORAGE_KEY = 'themeSettings-v3';

// //   // Default settings (100% scale = 16px browser default)
// //   private readonly defaultSettings: ThemeSettings = {
// //     lightThemeClass: 'theme-light',
// //     isDarkMode: false,
// //     textScale: 100
// //   };

// //   private settingsSubject = new BehaviorSubject<ThemeSettings>(this.loadSettings());
// //   settings$ = this.settingsSubject.asObservable();
// //   private socketSub?: Subscription;

// //   constructor() {
// //     this.applyTheme(this.settingsSubject.value);
// //     this.setupSocketListener();
// //     this.listenToUserChanges();
// //   }

// //   private setupSocketListener() {
// //     this.socketService.themeChanged$.subscribe(({ themeId }) => {
// //       const current = this.settingsSubject.value;
// //       let newSettings: ThemeSettings;

// //       if (themeId === 'theme-dark') {
// //         newSettings = { ...current, isDarkMode: true };
// //       } else if (themeId === 'theme-light' || themeId.startsWith('theme-')) {
// //         newSettings = { ...current, isDarkMode: false, lightThemeClass: themeId };
// //       } else {
// //         return; // Ignore unknown IDs
// //       }

// //       if (JSON.stringify(newSettings) !== JSON.stringify(current)) {
// //         this.updateSettings(newSettings, false); // Don't emit back to socket
// //       }
// //     });
// //   }

// //   private listenToUserChanges() {
// //     this.authService.currentUser$.subscribe(user => {
// //       if (user?.preferences?.theme) {
// //         const isDark = user.preferences.theme === 'dark';
// //         const current = this.settingsSubject.value;
// //         if (current.isDarkMode !== isDark) {
// //           this.updateSettings({ ...current, isDarkMode: isDark }, false);
// //         }
// //       }
// //     });
// //   }

// //   // ----------------------------------------------------------------
// //   // ✅ Load Settings
// //   // ----------------------------------------------------------------
// //   private loadSettings(): ThemeSettings {
// //     try {
// //       const stored = localStorage.getItem(this.STORAGE_KEY);
// //       if (stored) {
// //         const parsed = JSON.parse(stored);
// //         // Merge with defaults to ensure 'textScale' exists if loading old data
// //         return { ...this.defaultSettings, ...parsed };
// //       }
// //       return this.defaultSettings;
// //     } catch {
// //       return this.defaultSettings;
// //     }
// //   }

// //   // ----------------------------------------------------------------
// //   // ✅ Save Settings
// //   // ----------------------------------------------------------------
// //   private saveSettings(settings: ThemeSettings) {
// //     try {
// //       localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
// //     } catch {
// //       console.warn('ThemeService: Unable to save theme settings.');
// //     }
// //   }

// //   // ----------------------------------------------------------------
// //   // ✅ Apply Theme (Updated for Font Scale)
// //   // ----------------------------------------------------------------
// //   private applyTheme(settings: ThemeSettings) {
// //     const body = document.body;
// //     const html = document.documentElement; // Target <html> for rem scaling

// //     // 1. Remove all previous theme classes
// //     body.classList.forEach(cls => {
// //       if (cls.startsWith('theme-')) {
// //         body.classList.remove(cls);
// //       }
// //     });

// //     // 2. Apply the correct theme class
// //     if (settings.isDarkMode) {
// //       body.classList.add('theme-dark');
// //     } else {
// //       body.classList.add(settings.lightThemeClass);
// //     }

// //     // 3. Apply Font Scale (Scale root font size)
// //     // 100% = 16px (standard), 110% = 17.6px, etc.
// //     html.style.fontSize = `${settings.textScale}%`;

// //     // 4. Cleanup legacy props
// //     body.style.removeProperty('--accent-color');
// //   }

// //   // ----------------------------------------------------------------
// //   // ✅ Public Methods
// //   // ----------------------------------------------------------------

// //   setLightTheme(themeClass: string) {
// //     const newSettings: ThemeSettings = {
// //       ...this.settingsSubject.value,
// //       lightThemeClass: themeClass,
// //       isDarkMode: false,
// //     };
// //     this.updateSettings(newSettings);
// //   }

// //   setDarkMode(isDarkMode: boolean) {
// //     const newSettings: ThemeSettings = {
// //       ...this.settingsSubject.value,
// //       isDarkMode,
// //     };
// //     this.updateSettings(newSettings);
// //   }

// //   /**
// //    * Updates the text scale percentage.
// //    * @param scale Percentage number (e.g., 100, 110, 125)
// //    */
// //   setTextScale(scale: number) {
// //     const newSettings: ThemeSettings = {
// //       ...this.settingsSubject.value,
// //       textScale: scale,
// //     };
// //     this.updateSettings(newSettings);
// //   }

// //   resetTheme() {
// //     this.updateSettings(this.defaultSettings);
// //   }

// //   private updateSettings(settings: ThemeSettings, emitSocket: boolean = true) {
// //     this.settingsSubject.next(settings);
// //     this.saveSettings(settings);
// //     this.applyTheme(settings);

// //     if (emitSocket && this.authService.isLoggedIn()) {
// //       const themeId = settings.isDarkMode ? 'theme-dark' : settings.lightThemeClass;
// //       this.socketService.updateTheme(themeId);

// //       // Also update local user object to keep it in sync
// //       this.authService.updateUserPreferences({
// //         theme: settings.isDarkMode ? 'dark' : 'light'
// //       });
// //     }
// //   }
// // }
