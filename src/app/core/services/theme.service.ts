import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketConnectionService } from './socket/socket-connection.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { ThemeFontLoader } from './apex-font-loader'; // 🟢 Import the new Font Loader

/**
 * Defines the structure for saved theme settings.
 */
export interface ThemeSettings {
  lightThemeClass: string; // e.g. 'theme-light', 'theme-ivory'
  isDarkMode: boolean;     // true or false
  textScale: number;       // Percentage: 100, 110, 125, etc.
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private socketService = inject(SocketConnectionService);
  private authService = inject(AuthService);
  private readonly STORAGE_KEY = 'themeSettings-v3';

  // Default settings (100% scale = 16px browser default)
  private readonly defaultSettings: ThemeSettings = {
    lightThemeClass: 'theme-light',
    isDarkMode: false,
    textScale: 100
  };

  private settingsSubject = new BehaviorSubject<ThemeSettings>(this.loadSettings());
  settings$ = this.settingsSubject.asObservable();
  private socketSub?: Subscription;

  constructor() {
    const initialSettings = this.settingsSubject.value;
    
    // 🟢 Preload the default/fallback themes instantly in the background
    ThemeFontLoader.preloadThemes(['theme-light', 'theme-dark', initialSettings.lightThemeClass]);

    this.applyTheme(initialSettings);
    this.setupSocketListener();
    this.listenToUserChanges();
  }

  private setupSocketListener() {
    this.socketService.themeChanged$.subscribe(({ themeId }) => {
      const current = this.settingsSubject.value;
      let newSettings: ThemeSettings;

      if (themeId === 'theme-dark') {
        newSettings = { ...current, isDarkMode: true };
      } else if (themeId === 'theme-light' || themeId.startsWith('theme-')) {
        newSettings = { ...current, isDarkMode: false, lightThemeClass: themeId };
      } else {
        return; // Ignore unknown IDs
      }

      if (JSON.stringify(newSettings) !== JSON.stringify(current)) {
        this.updateSettings(newSettings, false); // Don't emit back to socket
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

  // ----------------------------------------------------------------
  // ✅ Load & Save Settings
  // ----------------------------------------------------------------
  private loadSettings(): ThemeSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.defaultSettings, ...parsed };
      }
      return this.defaultSettings;
    } catch {
      return this.defaultSettings;
    }
  }

  private saveSettings(settings: ThemeSettings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch {
      console.warn('ThemeService: Unable to save theme settings.');
    }
  }

  // ----------------------------------------------------------------
  // ✅ Apply Theme (Updated for Fonts & :root)
  // ----------------------------------------------------------------
  private async applyTheme(settings: ThemeSettings) {
    // 🟢 Target <html> instead of <body> so `:root:not([class*="theme-"])` works
    const html = document.documentElement; 
    
    // Determine the target theme ID
    const targetThemeId = settings.isDarkMode ? 'theme-dark' : settings.lightThemeClass;

    // 🟢 Load the fonts dynamically BEFORE applying the class
    await ThemeFontLoader.loadFontsForTheme(targetThemeId);

    // 1. Remove all previous theme classes from <html>
    html.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        html.classList.remove(cls);
      }
    });

    // 2. Apply the correct theme class to <html>
    html.classList.add(targetThemeId);

    // 3. Apply Font Scale (Scale root font size)
    html.style.fontSize = `${settings.textScale}%`;
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

  private updateSettings(settings: ThemeSettings, emitSocket: boolean = true) {
    this.settingsSubject.next(settings);
    this.saveSettings(settings);
    this.applyTheme(settings); // 🟢 This is now async, but we let it run in the background

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

// /**
//  * Defines the structure for saved theme settings.
//  */
// export interface ThemeSettings {
//   lightThemeClass: string; // e.g. 'theme-light', 'theme-premium'
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
//     this.applyTheme(this.settingsSubject.value);
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
//   // ✅ Load Settings
//   // ----------------------------------------------------------------
//   private loadSettings(): ThemeSettings {
//     try {
//       const stored = localStorage.getItem(this.STORAGE_KEY);
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         // Merge with defaults to ensure 'textScale' exists if loading old data
//         return { ...this.defaultSettings, ...parsed };
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
//   // ✅ Apply Theme (Updated for Font Scale)
//   // ----------------------------------------------------------------
//   private applyTheme(settings: ThemeSettings) {
//     const body = document.body;
//     const html = document.documentElement; // Target <html> for rem scaling

//     // 1. Remove all previous theme classes
//     body.classList.forEach(cls => {
//       if (cls.startsWith('theme-')) {
//         body.classList.remove(cls);
//       }
//     });

//     // 2. Apply the correct theme class
//     if (settings.isDarkMode) {
//       body.classList.add('theme-dark');
//     } else {
//       body.classList.add(settings.lightThemeClass);
//     }

//     // 3. Apply Font Scale (Scale root font size)
//     // 100% = 16px (standard), 110% = 17.6px, etc.
//     html.style.fontSize = `${settings.textScale}%`;

//     // 4. Cleanup legacy props
//     body.style.removeProperty('--accent-color');
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

//   /**
//    * Updates the text scale percentage.
//    * @param scale Percentage number (e.g., 100, 110, 125)
//    */
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
//     this.applyTheme(settings);

//     if (emitSocket && this.authService.isLoggedIn()) {
//       const themeId = settings.isDarkMode ? 'theme-dark' : settings.lightThemeClass;
//       this.socketService.updateTheme(themeId);

//       // Also update local user object to keep it in sync
//       this.authService.updateUserPreferences({
//         theme: settings.isDarkMode ? 'dark' : 'light'
//       });
//     }
//   }
// }
