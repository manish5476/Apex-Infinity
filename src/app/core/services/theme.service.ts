import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Defines the structure for saved theme settings.
 */
export interface ThemeSettings {
  lightThemeClass: string; // e.g. 'theme-light', 'theme-premium'
  isDarkMode: boolean;     // true or false
  textScale: number;       // Percentage: 100, 110, 125, etc.
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'themeSettings-v3'; // Bumped version for new schema

  // Default settings (100% scale = 16px browser default)
  private readonly defaultSettings: ThemeSettings = {
    lightThemeClass: 'theme-light', 
    isDarkMode: false,
    textScale: 100 
  };

  private settingsSubject = new BehaviorSubject<ThemeSettings>(this.loadSettings());
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.applyTheme(this.settingsSubject.value);
  }

  // ----------------------------------------------------------------
  // ✅ Load Settings
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // ✅ Save Settings
  // ----------------------------------------------------------------
  private saveSettings(settings: ThemeSettings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch {
      console.warn('ThemeService: Unable to save theme settings.');
    }
  }

  // ----------------------------------------------------------------
  // ✅ Apply Theme (Updated for Font Scale)
  // ----------------------------------------------------------------
  private applyTheme(settings: ThemeSettings) {
    const body = document.body;
    const html = document.documentElement; // Target <html> for rem scaling

    // 1. Remove all previous theme classes
    body.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        body.classList.remove(cls);
      }
    });

    // 2. Apply the correct theme class
    if (settings.isDarkMode) {
      body.classList.add('theme-dark');
    } else {
      body.classList.add(settings.lightThemeClass);
    }

    // 3. Apply Font Scale (Scale root font size)
    // 100% = 16px (standard), 110% = 17.6px, etc.
    html.style.fontSize = `${settings.textScale}%`;

    // 4. Cleanup legacy props
    body.style.removeProperty('--accent-color');
  }

  // ----------------------------------------------------------------
  // ✅ Public Methods
  // ----------------------------------------------------------------

  setLightTheme(themeClass: string) {
    const newSettings: ThemeSettings = {
      ...this.settingsSubject.value,
      lightThemeClass: themeClass,
      isDarkMode: false,
    };
    this.updateSettings(newSettings);
  }

  setDarkMode(isDarkMode: boolean) {
    const newSettings: ThemeSettings = {
      ...this.settingsSubject.value,
      isDarkMode,
    };
    this.updateSettings(newSettings);
  }

  /**
   * Updates the text scale percentage.
   * @param scale Percentage number (e.g., 100, 110, 125)
   */
  setTextScale(scale: number) {
    const newSettings: ThemeSettings = {
      ...this.settingsSubject.value,
      textScale: scale,
    };
    this.updateSettings(newSettings);
  }

  resetTheme() {
    this.updateSettings(this.defaultSettings);
  }

  private updateSettings(settings: ThemeSettings) {
    this.settingsSubject.next(settings);
    this.saveSettings(settings);
    this.applyTheme(settings);
  }
}
// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';

// /**
//  * Defines the structure for saved theme settings.
//  */
// export interface ThemeSettings {
//   lightThemeClass: string; // e.g. 'theme-light', 'theme-premium'
//   isDarkMode: boolean;     // true or false
// }

// @Injectable({ providedIn: 'root' })
// export class ThemeService {
//   private readonly STORAGE_KEY = 'themeSettings-v2';

//   // Default fallback theme
//   private readonly defaultSettings: ThemeSettings = {
//     lightThemeClass: 'theme-light', 
//     isDarkMode: false,
//   };

//   private settingsSubject = new BehaviorSubject<ThemeSettings>(this.loadSettings());
//   settings$ = this.settingsSubject.asObservable();

//   constructor() {
//     this.applyTheme(this.settingsSubject.value);
//   }

//   // ----------------------------------------------------------------
//   // ✅ Load Settings
//   // ----------------------------------------------------------------
//   private loadSettings(): ThemeSettings {
//     try {
//       const stored = localStorage.getItem(this.STORAGE_KEY);
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         if (parsed.lightThemeClass && parsed.isDarkMode !== undefined) {
//           return parsed;
//         }
//       }
//       return this.defaultSettings;
//     } catch {
//       return this.defaultSettings;
//     }
//   }

//   // ----------------------------------------------------------------
//   // ✅ Save Settings
//   // ----------------------------------------------------------------
//   private saveSettings(settings: ThemeSettings) {
//     try {
//       localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
//     } catch {
//       console.warn('ThemeService: Unable to save theme settings.');
//     }
//   }

//   // ----------------------------------------------------------------
//   // ✅ Apply Theme to <body>
//   // ----------------------------------------------------------------
//   private applyTheme(settings: ThemeSettings) {
//     const body = document.body;

//     // 1. Remove all previous theme classes
//     body.classList.forEach(cls => {
//       if (cls.startsWith('theme-')) {
//         body.classList.remove(cls);
//       }
//     });

//     // 2. Apply the correct theme based on settings
//     if (settings.isDarkMode) {
//       body.classList.add('theme-dark');
//     } else {
//       body.classList.add(settings.lightThemeClass);
//     }

//     // 3. Remove old property
//     body.style.removeProperty('--accent-color');
//   }

//   // ----------------------------------------------------------------
//   // ✅ Public Methods
//   // ----------------------------------------------------------------

//   setLightTheme(themeClass: string) {
//     const newSettings: ThemeSettings = {
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

//   resetTheme() {
//     this.updateSettings(this.defaultSettings);
//   }

//   private updateSettings(settings: ThemeSettings) {
//     this.settingsSubject.next(settings);
//     this.saveSettings(settings);
//     this.applyTheme(settings);
//   }
// }
