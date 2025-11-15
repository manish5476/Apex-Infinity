import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Defines the structure for saved theme settings.
 * We store the user's preferred light theme and whether dark mode is active.
 */
export interface ThemeSettings {
  lightThemeClass: string; // e.g. 'theme-light', 'theme-premium'
  isDarkMode: boolean;     // true or false
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'themeSettings-v2'; // Use v2 to avoid conflicts with old structure

  // Default fallback theme
  private readonly defaultSettings: ThemeSettings = {
    lightThemeClass: 'theme-light', // 'theme-light' is the clean default
    isDarkMode: false,
  };

  private settingsSubject = new BehaviorSubject<ThemeSettings>(this.loadSettings());
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    // Apply theme immediately on load
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
        // Basic validation to ensure structure is correct
        if (parsed.lightThemeClass && parsed.isDarkMode !== undefined) {
          return parsed;
        }
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
  // ✅ Apply Theme to <body>
  // ----------------------------------------------------------------
  private applyTheme(settings: ThemeSettings) {
    const body = document.body;

    // 1. Remove all previous theme classes
    body.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        body.classList.remove(cls);
      }
    });

    // 2. Apply the correct theme based on settings
    if (settings.isDarkMode) {
      // We apply 'theme-dark' as the primary dark mode.
      // This could be expanded to 'darkThemeClass' in settings for more options.
      body.classList.add('theme-dark');
    } else {
      body.classList.add(settings.lightThemeClass);
    }

    // 3. Remove old property if it exists (no longer used by new SCSS)
    body.style.removeProperty('--accent-color');
  }

  // ----------------------------------------------------------------
  // ✅ Public Methods
  // ----------------------------------------------------------------

  /**
   * Sets the active LIGHT theme.
   * This will also automatically disable dark mode.
   */
  setLightTheme(themeClass: string) {
    const newSettings: ThemeSettings = {
      lightThemeClass: themeClass,
      isDarkMode: false, // Switching light theme turns off dark mode
    };
    this.updateSettings(newSettings);
  }

  /** Toggle dark/light mode */
  setDarkMode(isDarkMode: boolean) {
    const newSettings: ThemeSettings = {
      ...this.settingsSubject.value,
      isDarkMode,
    };
    this.updateSettings(newSettings);
  }

  /** Reset to default theme */
  resetTheme() {
    this.updateSettings(this.defaultSettings);
  }

  // ----------------------------------------------------------------
  // ✅ Internal State Update Helper
  // ----------------------------------------------------------------
  private updateSettings(settings: ThemeSettings) {
    this.settingsSubject.next(settings);
    this.saveSettings(settings);
    this.applyTheme(settings);
  }
}

// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';

// export interface ThemeSettings {
//   themeClass: string;      // e.g. 'theme-blue'
//   accentColor: string;     // e.g. '#3B82F6'
//   isDarkMode: boolean;     // true or false
// }

// @Injectable({ providedIn: 'root' })
// export class ThemeService {
//   private readonly STORAGE_KEY = 'themeSettings';

//   // Default fallback theme
//   private readonly defaultSettings: ThemeSettings = {
//     themeClass: 'theme-blue',
//     accentColor: '#3B82F6',
//     isDarkMode: false,
//   };

//   private settingsSubject = new BehaviorSubject<ThemeSettings>(this.loadSettings());
//   settings$ = this.settingsSubject.asObservable();

//   constructor() {
//     // Apply theme immediately on load
//     this.applyTheme(this.settingsSubject.value);
//   }

//   // ----------------------------------------------------------------
//   // ✅ Load Settings
//   // ----------------------------------------------------------------
//   private loadSettings(): ThemeSettings {
//     try {
//       const stored = localStorage.getItem(this.STORAGE_KEY);
//       return stored ? JSON.parse(stored) : this.defaultSettings;
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
//   // ✅ Apply Theme Safely (Fixes InvalidCharacterError)
//   // ----------------------------------------------------------------
//   private applyTheme(settings: ThemeSettings) {
//     const body = document.body;

//     // 1. Remove all previous theme classes
//     body.classList.forEach(cls => {
//       if (cls.startsWith('theme-')) {
//         body.classList.remove(cls);
//       }
//     });

//     // 2. Add new theme class safely (one at a time)
//     if (settings.themeClass) {
//       body.classList.add(settings.themeClass);
//     }

//     // 3. Handle dark mode separately (not in same string)
//     if (settings.isDarkMode) {
//       body.classList.add('dark-mode');
//     } else {
//       body.classList.remove('dark-mode');
//     }

//     // 4. Apply accent color via CSS variable
//     body.style.setProperty('--accent-color', settings.accentColor);
//   }

//   // ----------------------------------------------------------------
//   // ✅ Public Methods
//   // ----------------------------------------------------------------

//   /** Set both color and accent theme */
//   setTheme(themeClass: string, accentColor: string) {
//     const newSettings: ThemeSettings = {
//       ...this.settingsSubject.value,
//       themeClass,
//       accentColor,
//     };
//     this.updateSettings(newSettings);
//   }

//   /** Toggle dark/light mode */
//   setDarkMode(isDarkMode: boolean) {
//     const newSettings: ThemeSettings = {
//       ...this.settingsSubject.value,
//       isDarkMode,
//     };
//     this.updateSettings(newSettings);
//   }

//   /** Reset to default theme */
//   resetTheme() {
//     this.updateSettings(this.defaultSettings);
//   }

//   // ----------------------------------------------------------------
//   // ✅ Internal State Update Helper
//   // ----------------------------------------------------------------
//   private updateSettings(settings: ThemeSettings) {
//     this.settingsSubject.next(settings);
//     this.saveSettings(settings);
//     this.applyTheme(settings);
//   }
// }
