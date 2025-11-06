import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ThemeSettings {
  accentColor: string; // The hex value, e.g., '#6366f1'
  isDarkMode: boolean;
  themeClass: string;  // The CSS class, e.g., 'theme-indigo'
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private renderer: Renderer2;
  private readonly THEME_KEY = 'app-theme-settings';

  // Tracks the last applied theme class to safely remove it on change.
  private lastThemeClass: string | null = null;

  // --- Reactive State Management ---
  private settingsSubject: BehaviorSubject<ThemeSettings>;
  public settings$: Observable<ThemeSettings>;
  public isDarkMode$: Observable<boolean>;
  public accentColor$: Observable<string>;

  private colorSchemeSub: Subscription;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    const initialSettings = this.loadSettings() || this.getSystemDefault();
    this.settingsSubject = new BehaviorSubject<ThemeSettings>(initialSettings);
    this.lastThemeClass = initialSettings.themeClass;
    
    this.settings$ = this.settingsSubject.asObservable();
    this.isDarkMode$ = this.settings$.pipe(map(s => s.isDarkMode));
    this.accentColor$ = this.settings$.pipe(map(s => s.accentColor));

    // Listen for OS-level theme changes
    this.colorSchemeSub = fromEvent<MediaQueryList>(window.matchMedia('(prefers-color-scheme: dark)'), 'change')
      .subscribe(e => {
        // Only apply system theme if the user hasn't made a choice yet
        const currentSettings = this.loadSettings();
        if (!currentSettings) { 
          this.setDarkMode(e.matches);
        }
      });
  }

  /**
   * Initializes the theme on application startup.
   * **Crucial Step:** This MUST be called once in the constructor of your root AppComponent.
   */
  public initTheme(): void {
    this.applyTheme(this.settingsSubject.value);
  }

  // --- Public API Methods ---

  /**
   * Sets the entire theme, including the theme class and accent color.
   * @param themeClass The CSS class for the theme (e.g., 'theme-neobrutalist').
   * @param accentColor The corresponding hex color for the theme.
   */
  public setTheme(themeClass: string, accentColor: string): void {
    const newSettings = { 
      ...this.settingsSubject.value, 
      themeClass,
      accentColor 
    };
    this.applyTheme(newSettings);
  }
  
  /**
   * Toggles or sets the dark mode to a specific state.
   */
  public setDarkMode(isDark: boolean): void {
    const newSettings = { ...this.settingsSubject.value, isDarkMode: isDark };
    this.applyTheme(newSettings);
  }

  /**
   * Sets a new accent color, automatically finding the corresponding theme class.
   */
  public setAccentColor(accentColor: string): void {
      const themeClass = this.getThemeClassFromHex(accentColor) || this.settingsSubject.value.themeClass;
      this.setTheme(themeClass, accentColor);
  }

  public loadSettings(): ThemeSettings | null {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.THEME_KEY);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  }

  // --- Core Logic ---

  /**
   * Applies all theme properties to the document.
   */
  private applyTheme(settings: ThemeSettings): void {
    // Apply dynamic CSS variables if needed
    if (!settings.themeClass.includes('neobrutalist') && !settings.themeClass.includes('retro')) {
        const palette = this.generatePalette(settings.accentColor, settings.isDarkMode);
        Object.keys(palette).forEach(key => {
          const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          this.renderer.setStyle(this.document.documentElement, cssVar, palette[key as keyof typeof palette]);
        });
    }

    // Safely remove the previous theme class from the body
    if (this.lastThemeClass) {
        this.renderer.removeClass(this.document.body, this.lastThemeClass);
    }
    
    // Add the new theme class and update the tracker
    this.renderer.addClass(this.document.body, settings.themeClass);
    this.lastThemeClass = settings.themeClass;

    // Manage the dark-mode class
    if (settings.isDarkMode) {
      this.renderer.addClass(this.document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(this.document.body, 'dark-mode');
    }

    // Persist and broadcast the new settings
    this.saveSettings(settings);
    this.settingsSubject.next(settings);
  }

  private saveSettings(settings: ThemeSettings): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.THEME_KEY, JSON.stringify(settings));
    }
  }
  
  private getSystemDefault(): ThemeSettings {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Default to a sensible, neutral theme
      return { accentColor: '#3B82F6', isDarkMode: prefersDark, themeClass: 'theme-blue' };
  }

  private getThemeClassFromHex(hex: string): string | undefined {
      // This list should match the one in your theme-picking UI
      const themes = [
          { name: 'Neo Brutalist', color: '#f8ff00', class: 'theme-neobrutalist' },
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
          { name: 'Retro Burgundy', color: '#8b2635', class: 'theme-retro-burgundy' },
      ];
      const foundTheme = themes.find(t => t.color === hex);
      return foundTheme?.class;
  }

  private generatePalette(accentHex: string, isDark: boolean): Record<string, string> {
    const { h, s } = this.hexToHsl(accentHex);
    if (isDark) {
      return {
        themeBgPrimary: `hsl(${h}, 15%, 10%)`, themeBgSecondary: `hsl(${h}, 12%, 15%)`, themeBgTertiary: `hsl(${h}, 10%, 20%)`, themeTextPrimary: `hsl(${h}, 15%, 95%)`, themeTextSecondary: `hsl(${h}, 10%, 65%)`, themeBorderPrimary: `hsl(${h}, 10%, 25%)`, themeAccentPrimary: `hsl(${h}, ${s}%, 60%)`, themeAccentPrimaryLight: `hsla(${h}, ${s}%, 60%, 0.1)`, themeAccentTextColor: `hsl(${h}, 20%, 10%)`, themeAccentSecondary: `hsl(${(h + 150) % 360}, ${s}%, 70%)`,
      };
    } else {
      return {
        themeBgPrimary: `hsl(${h}, 20%, 98%)`, themeBgSecondary: `hsl(${h}, 25%, 94%)`, themeBgTertiary: `hsl(${h}, 20%, 88%)`, themeTextPrimary: `hsl(${h}, 15%, 15%)`, themeTextSecondary: `hsl(${h}, 10%, 40%)`, themeBorderPrimary: `hsl(${h}, 20%, 85%)`, themeAccentPrimary: accentHex, themeAccentPrimaryLight: `hsla(${h}, ${s}%, 50%, 0.1)`, themeAccentTextColor: `hsl(0, 0%, 100%)`, themeAccentSecondary: `hsl(${(h + 150) % 360}, ${s - 5}%, 45%)`,
      };
    }
  }

  private hexToHsl(hex: string): { h: number, s: number, l: number } {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); } else if (hex.length === 7) { r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16); }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  
  ngOnDestroy(): void {
    this.colorSchemeSub.unsubscribe();
  }
}
// // File: src/app/core/services/theme.service.ts
// // Description: Updated to correctly handle both dynamic color palettes and static CSS theme classes.

// import { DOCUMENT } from '@angular/common';
// import { Inject, Injectable, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
// import { BehaviorSubject, Observable, Subscription, fromEvent } from 'rxjs';
// import { map } from 'rxjs/operators';

// export interface ThemeSettings {
//   accentColor: string; // The hex value, e.g., '#6366f1'
//   isDarkMode: boolean;
//   themeClass: string; // The CSS class, e.g., 'theme-indigo'
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class ThemeService implements OnDestroy {
//   private renderer: Renderer2;
//   private readonly THEME_KEY = 'app-theme-settings';

//   // --- Reactive State Management ---
//   private settingsSubject: BehaviorSubject<ThemeSettings>;
//   public settings$: Observable<ThemeSettings>;
//   public isDarkMode$: Observable<boolean>;
//   public accentColor$: Observable<string>;

//   private colorSchemeSub: Subscription;

//   constructor(
//     @Inject(DOCUMENT) private document: Document,
//     rendererFactory: RendererFactory2
//   ) {
//     this.renderer = rendererFactory.createRenderer(null, null);

//     const initialSettings = this.loadSettings() || this.getSystemDefault();
//     this.settingsSubject = new BehaviorSubject<ThemeSettings>(initialSettings);
    
//     this.settings$ = this.settingsSubject.asObservable();
//     this.isDarkMode$ = this.settings$.pipe(map(s => s.isDarkMode));
//     this.accentColor$ = this.settings$.pipe(map(s => s.accentColor));

//     this.colorSchemeSub = fromEvent<MediaQueryList>(window.matchMedia('(prefers-color-scheme: dark)'), 'change')
//       .subscribe(e => {
//         const currentSettings = this.loadSettings();
//         if (!currentSettings) { 
//           this.setDarkMode(e.matches);
//         }
//       });
//   }

//   /**
//    * Initializes the theme on application startup. Call this once in your AppComponent.
//    */
//   initTheme(): void {
//     this.applyTheme(this.settingsSubject.value);
//   }

//   // --- Public API Methods ---

//   /**
//    * NEW: Sets the entire theme, including the theme class and accent color.
//    * This is the primary method for changing themes.
//    * @param themeClass The CSS class for the theme (e.g., 'theme-neobrutalist').
//    * @param accentColor The corresponding hex color for the theme.
//    */
//   setTheme(themeClass: string, accentColor: string): void {
//     const newSettings = { 
//       ...this.settingsSubject.value, 
//       themeClass,
//       accentColor 
//     };
//     this.applyTheme(newSettings);
//   }
  
//   /**
//    * Sets the dark mode to a specific state.
//    */
//   setDarkMode(isDark: boolean): void {
//     const newSettings = { ...this.settingsSubject.value, isDarkMode: isDark };
//     this.applyTheme(newSettings);
//   }

//   /**
//    * Sets a new accent color, automatically finding the corresponding theme class.
//    * This is used by other parts of your app that might only know about colors.
//    */
//   setAccentColor(accentColor: string): void {
//       const themeClass = this.getThemeClassFromHex(accentColor) || this.settingsSubject.value.themeClass;
//       this.setTheme(themeClass, accentColor);
//   }

//   public loadSettings(): ThemeSettings | null {
//     if (typeof localStorage !== 'undefined') {
//       const saved = localStorage.getItem(this.THEME_KEY);
//       return saved ? JSON.parse(saved) : null;
//     }
//     return null;
//   }

//   // --- Core Logic ---

//   private applyTheme(settings: ThemeSettings): void {
//     // UPDATED LOGIC: Only generate a dynamic palette for modern themes.
//     // For full themes like Neobrutalist or Retro, we let the CSS file handle all styling.
//     if (!settings.themeClass.includes('neobrutalist') && !settings.themeClass.includes('retro')) {
//         const palette = this.generatePalette(settings.accentColor, settings.isDarkMode);
//         Object.keys(palette).forEach(key => {
//           const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
//           this.renderer.setStyle(this.document.documentElement, cssVar, palette[key as keyof typeof palette]);
//         });
//     }

//     // Always manage the theme classes on the body element.
//     this.document.body.className = this.document.body.className.replace(/theme-\w+/g, '');
//     if (settings.themeClass) {
//         this.renderer.addClass(this.document.body, settings.themeClass);
//     }
//     if (settings.isDarkMode) {
//       this.renderer.addClass(this.document.body, 'dark-mode');
//     } else {
//       this.renderer.removeClass(this.document.body, 'dark-mode');
//     }

//     this.saveSettings(settings);
//     this.settingsSubject.next(settings);
//   }

//   private saveSettings(settings: ThemeSettings): void {
//     if (typeof localStorage !== 'undefined') {
//       localStorage.setItem(this.THEME_KEY, JSON.stringify(settings));
//     }
//   }
  
//   private getSystemDefault(): ThemeSettings {
//       const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
//       return { accentColor: '#3B82F6', isDarkMode: prefersDark, themeClass: 'theme-blue' };
//   }

//   private getThemeClassFromHex(hex: string): string | undefined {
//       // This list should match the one in your header component
//       const themes = [
//           { name: 'Neo Brutalist', color: '#f8ff00', class: 'theme-neobrutalist' },
//           { name: 'Indigo', color: '#6366f1', class: 'theme-indigo' },
//           { name: 'Slate', color: '#64748b', class: 'theme-slate' },
//           { name: 'Red', color: '#ef4444', class: 'theme-red' },
//           { name: 'Orange', color: '#f97316', class: 'theme-orange' },
//           { name: 'Amber', color: '#f59e0b', class: 'theme-amber' },
//           { name: 'Yellow', color: '#eab308', class: 'theme-yellow' },
//           { name: 'Lime', color: '#84cc16', class: 'theme-lime' },
//           { name: 'Green', color: '#22c55e', class: 'theme-green' },
//           { name: 'Emerald', color: '#10b981', class: 'theme-emerald' },
//           { name: 'Teal', color: '#14b8a6', class: 'theme-teal' },
//           { name: 'Cyan', color: '#06b6d4', class: 'theme-cyan' },
//           { name: 'Sky', color: '#0ea5e9', class: 'theme-sky' },
//           { name: 'Blue', color: '#3b82f6', class: 'theme-blue' },
//           { name: 'Violet', color: '#8b5cf6', class: 'theme-violet' },
//           { name: 'Purple', color: '#a855f7', class: 'theme-purple' },
//           { name: 'Fuchsia', color: '#d946ef', class: 'theme-fuchsia' },
//           { name: 'Pink', color: '#ec4899', class: 'theme-pink' },
//           { name: 'Rose', color: '#f43f5e', class: 'theme-rose' },
//           { name: 'Retro Burgundy', color: '#8b2635', class: 'theme-retro-burgundy' },
//       ];
//       const foundTheme = themes.find(t => t.color === hex);
//       return foundTheme?.class;
//   }

//   private generatePalette(accentHex: string, isDark: boolean): Record<string, string> {
//     const { h, s } = this.hexToHsl(accentHex);
//     if (isDark) {
//       return {
//         themeBgPrimary: `hsl(${h}, 15%, 10%)`, themeBgSecondary: `hsl(${h}, 12%, 15%)`, themeBgTertiary: `hsl(${h}, 10%, 20%)`, themeTextPrimary: `hsl(${h}, 15%, 95%)`, themeTextSecondary: `hsl(${h}, 10%, 65%)`, themeBorderPrimary: `hsl(${h}, 10%, 25%)`, themeAccentPrimary: `hsl(${h}, ${s}%, 60%)`, themeAccentPrimaryLight: `hsla(${h}, ${s}%, 60%, 0.1)`, themeAccentTextColor: `hsl(${h}, 20%, 10%)`, themeAccentSecondary: `hsl(${(h + 150) % 360}, ${s}%, 70%)`,
//       };
//     } else {
//       return {
//         themeBgPrimary: `hsl(${h}, 20%, 98%)`, themeBgSecondary: `hsl(${h}, 25%, 94%)`, themeBgTertiary: `hsl(${h}, 20%, 88%)`, themeTextPrimary: `hsl(${h}, 15%, 15%)`, themeTextSecondary: `hsl(${h}, 10%, 40%)`, themeBorderPrimary: `hsl(${h}, 20%, 85%)`, themeAccentPrimary: accentHex, themeAccentPrimaryLight: `hsla(${h}, ${s}%, 50%, 0.1)`, themeAccentTextColor: `hsl(0, 0%, 100%)`, themeAccentSecondary: `hsl(${(h + 150) % 360}, ${s - 5}%, 45%)`,
//       };
//     }
//   }

//   private hexToHsl(hex: string): { h: number, s: number, l: number } {
//     let r = 0, g = 0, b = 0;
//     if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); } else if (hex.length === 7) { r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16); }
//     r /= 255; g /= 255; b /= 255;
//     const max = Math.max(r, g, b), min = Math.min(r, g, b);
//     let h = 0, s = 0, l = (max + min) / 2;
//     if (max !== min) {
//       const d = max - min;
//       s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
//       switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
//       h /= 6;
//     }
//     return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
//   }
  
//   ngOnDestroy(): void {
//     this.colorSchemeSub.unsubscribe();
//   }
// }
