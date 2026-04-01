/**
 * ============================================================================
 * APEX CRM — Dynamic Theme Font Loader  (Enhancement 6)
 * ============================================================================
 * Replaces the static @import in apex-themes.scss that loaded ALL 9 font
 * families on every page load regardless of active theme.
 *
 * This service:
 *   - Maps each theme ID → its required Google Font families
 *   - Injects only the needed <link> tag on theme activation
 *   - Caches already-loaded fonts in a Set to prevent re-injection
 *   - Returns a Promise so callers can await before rendering
 *   - Handles failures gracefully (system font fallback always applies)
 *
 * Usage:
 *   import { ThemeFontLoader } from './apex-font-loader';
 *
 *   // On app init (load default theme fonts):
 *   await ThemeFontLoader.loadFontsForTheme('theme-light');
 *
 *   // On theme switch:
 *   async onThemeChange(themeId: string) {
 *     document.body.className = themeId;
 *     await ThemeFontLoader.loadFontsForTheme(themeId);
 *   }
 * ============================================================================
 */

export interface ThemeFontConfig {
  /** Google Fonts families needed for this theme (heading + body) */
  families: string[];
  /** Precomputed Google Fonts URL for this exact set of families */
  url: string;
}

/**
 * Maps every theme ID to its required font families.
 * Only families listed here will be loaded — no extras.
 */
const THEME_FONT_MAP: Record<string, ThemeFontConfig> = {

  // ── Light Themes ──────────────────────────────────────────────────────────
  'theme-light': {
    families: ['Plus Jakarta Sans:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-ivory': {
    families: ['Playfair Display:wght@400;600;700', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-aurora': {
    families: ['Outfit:wght@300;400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-verdant': {
    families: ['Plus Jakarta Sans:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-coastal-command': {
    families: ['Plus Jakarta Sans:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-warm-meridian': {
    families: ['Cormorant Garamond:wght@400;600;700', 'Plus Jakarta Sans:wght@400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap'
  },
  'theme-daylight-orange': {
    families: ['Space Grotesk:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-naval-dawn': {
    families: ['Playfair Display:wght@400;600;700', 'Montserrat:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600&display=swap'
  },
  'theme-sand-dune': {
    families: ['Fraunces:wght@300;400;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-sakura': {
    families: ['Cormorant Garamond:wght@400;600;700', 'Plus Jakarta Sans:wght@400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap'
  },

  // ── Dark Themes ───────────────────────────────────────────────────────────
  'theme-dark': {
    families: ['Plus Jakarta Sans:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-neon-eclipse': {
    families: ['Space Grotesk:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-obsidian-rose': {
    families: ['Cormorant Garamond:wght@400;600;700', 'Plus Jakarta Sans:wght@400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap'
  },
  'theme-deep-emerald': {
    families: ['Plus Jakarta Sans:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-midnight-bronze': {
    families: ['Playfair Display:wght@400;600;700', 'Plus Jakarta Sans:wght@400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap'
  },
  'theme-molten-ember': {
    families: ['Plus Jakarta Sans:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-neon-void': {
    families: ['Space Grotesk:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-obsidian-jade': {
    families: ['Cormorant Garamond:wght@400;600;700', 'Plus Jakarta Sans:wght@400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap'
  },
  'theme-solar-flare': {
    families: ['Space Grotesk:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-nebula': {
    families: ['Space Grotesk:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-luxury': {
    families: ['Cormorant Garamond:wght@400;600;700', 'Montserrat:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600&display=swap'
  },
  'theme-abyssal-coral': {
    families: ['Plus Jakarta Sans:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-crimson-noir': {
    families: ['Fraunces:wght@300;400;600', 'Outfit:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap'
  },
  'theme-void-steel': {
    families: ['Syne:wght@400;500;600;700', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap'
  },

  // ── Glass Themes ──────────────────────────────────────────────────────────
  'theme-aurora-glass': {
    families: ['Space Grotesk:wght@400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-arctic-crystal': {
    families: ['DM Sans:wght@300;400;500;600', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-horizon': {
    families: ['Syne:wght@400;500;600;700', 'Inter:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap'
  },
  'theme-mercury-glass': {
    families: ['Syne:wght@400;500;600;700', 'DM Sans:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap'
  },
  'theme-amethyst-dusk': {
    families: ['Cormorant Garamond:wght@400;600;700', 'Outfit:wght@300;400;500;600'],
    url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap'
  },
};

/** Tracks which font URLs have already been injected into <head> */
const loadedFontUrls = new Set<string>();

/** Tracks in-flight font load Promises to avoid duplicate requests */
const pendingLoads = new Map<string, Promise<void>>();

export class ThemeFontLoader {

  /**
   * Load the fonts required for the given theme.
   * Safe to call on every theme switch — duplicate loads are no-ops.
   *
   * @param themeId  e.g. 'theme-dark', 'theme-luxury'
   * @returns Promise that resolves when fonts are loaded (or after timeout)
   */
  static async loadFontsForTheme(themeId: string): Promise<void> {
    const config = THEME_FONT_MAP[themeId];
    if (!config) {
      console.warn(`[ThemeFontLoader] Unknown theme: "${themeId}". Skipping font load.`);
      return;
    }

    const { url } = config;

    // Already loaded — instant return
    if (loadedFontUrls.has(url)) return;

    // In-flight — return existing promise
    if (pendingLoads.has(url)) return pendingLoads.get(url)!;

    const loadPromise = this._injectAndWait(url);
    pendingLoads.set(url, loadPromise);

    try {
      await loadPromise;
      loadedFontUrls.add(url);
    } finally {
      pendingLoads.delete(url);
    }
  }

  /**
   * Preload fonts for a list of themes (e.g. on app init, load defaults
   * for the 2-3 most likely themes before user switches).
   */
  static async preloadThemes(themeIds: string[]): Promise<void> {
    await Promise.allSettled(themeIds.map(id => this.loadFontsForTheme(id)));
  }

  /**
   * Returns the font families required for a given theme.
   * Useful for CSP reporting or auditing.
   */
  static getFamiliesForTheme(themeId: string): string[] {
    return THEME_FONT_MAP[themeId]?.families ?? [];
  }

  /**
   * Check if fonts for a given theme are already loaded.
   */
  static areFontsLoaded(themeId: string): boolean {
    const config = THEME_FONT_MAP[themeId];
    return config ? loadedFontUrls.has(config.url) : false;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private static _injectAndWait(url: string): Promise<void> {
    return new Promise((resolve) => {
      // Check if link already exists in DOM (e.g. SSR / page reload scenario)
      const existing = document.querySelector<HTMLLinkElement>(`link[href="${url}"]`);
      if (existing) {
        loadedFontUrls.add(url);
        resolve();
        return;
      }

      // Inject preconnect hints first for faster DNS/TLS
      this._ensurePreconnect('https://fonts.googleapis.com');
      this._ensurePreconnect('https://fonts.gstatic.com', true);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.crossOrigin = 'anonymous';

      // Resolve on successful load
      link.onload = () => resolve();

      // On error, resolve anyway — CSS variable fallbacks will catch it
      link.onerror = () => {
        console.warn(`[ThemeFontLoader] Failed to load fonts from: ${url}`);
        resolve();
      };

      // Safety timeout: resolve after 4s even if font hasn't loaded
      // Prevents theme switch from hanging on slow connections
      const timeout = setTimeout(() => resolve(), 4000);
      const originalOnload = link.onload;
      link.onload = (e) => { clearTimeout(timeout); (originalOnload as EventListener)(e); };

      document.head.appendChild(link);
    });
  }

  private static _ensurePreconnect(href: string, crossOrigin = false): void {
    const selector = crossOrigin
      ? `link[rel="preconnect"][href="${href}"][crossorigin]`
      : `link[rel="preconnect"][href="${href}"]:not([crossorigin])`;

    if (document.querySelector(selector)) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    if (crossOrigin) link.crossOrigin = 'anonymous';
    document.head.insertBefore(link, document.head.firstChild);
  }
}


/**
 * ============================================================================
 * ANGULAR INTEGRATION EXAMPLE
 * ============================================================================
 * In your ThemeService (or wherever you apply theme classes):
 *
 * import { ThemeFontLoader } from './apex-font-loader';
 *
 * @Injectable({ providedIn: 'root' })
 * export class ThemeService {
 *   private readonly STORAGE_KEY = 'apex-theme';
 *   private _current = signal<string>('theme-light');
 *
 *   constructor() {
 *     const saved = localStorage.getItem(this.STORAGE_KEY) ?? 'theme-light';
 *     this.applyTheme(saved);
 *     // Preload the 3 most popular themes on startup (non-blocking)
 *     ThemeFontLoader.preloadThemes(['theme-light', 'theme-dark', 'theme-luxury']);
 *   }
 *
 *   async applyTheme(themeId: string): Promise<void> {
 *     // Load fonts before applying class to prevent FOUT
 *     await ThemeFontLoader.loadFontsForTheme(themeId);
 *     document.documentElement.className = themeId;
 *     this._current.set(themeId);
 *     localStorage.setItem(this.STORAGE_KEY, themeId);
 *   }
 *
 *   get current() { return this._current.asReadonly(); }
 * }
 * ============================================================================
 */
