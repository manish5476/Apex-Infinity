// src/app/core/services/storefront-state.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

// ---------------------------------------------------------------------------
// StorefrontStateService
//
// Client-only signal store — no HTTP calls.
// Holds the last API response from getPage() / getProducts() and exposes
// computed derivations (active theme, SEO fields, etc.).
//
// Usage:
//   1. Component calls StorefrontPublicService.getPage(slug).subscribe(res => state.setState(res.data))
//   2. Templates read state.organization(), state.layout(), state.page(), etc.
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class StorefrontStateService {

  private titleService = inject(Title);
  private metaService = inject(Meta);

  // ── Core state signals ────────────────────────────────────────────────────

  readonly organization = signal<any>(null);
  readonly layout = signal<any>(null);
  readonly globalSettings = signal<any>(null);
  readonly page = signal<any>(null);

  // ── Computed ──────────────────────────────────────────────────────────────

  /**
   * Active theme: page-level overrides merged over global settings.
   * Page theme fields take precedence; falls back to global, then hardcoded defaults.
   */
  readonly activeTheme = computed(() => {
    const g = this.globalSettings()?.colors ?? {};
    const p = this.page()?.themeOverride?.customSettings ?? {};
    return {
      primaryColor: p.primaryColor ?? g.primary ?? '#2563eb',
      secondaryColor: p.secondaryColor ?? g.secondary ?? '#475569',
      backgroundColor: p.backgroundColor ?? '#ffffff',
      fontFamily: p.fontFamily ?? this.globalSettings()?.typography?.bodyFont ?? 'Inter, sans-serif',
    };
  });

  /** Header sections from layout (already hydrated by the backend). */
  readonly header = computed(() => this.layout()?.header ?? []);

  /** Footer sections from layout. */
  readonly footer = computed(() => this.layout()?.footer ?? []);

  /** Page body sections (hydrated by backend). */
  readonly sections = computed(() => this.page()?.sections ?? []);

  /** Commerce settings (currency, tax mode, guest checkout flag, etc.) */
  readonly commerce = computed(() => this.globalSettings()?.commerce ?? {});

  /** Currency symbol from org settings. Defaults to ₹. */
  readonly currencySymbol = computed(
    () => this.commerce()?.currencySymbol ?? '₹'
  );

  // ── State mutation ────────────────────────────────────────────────────────

  /**
   * Hydrate state from a full page API response.
   * Accepts the `data` field from StorefrontPublicService.getPage().
   */
  setState(apiResponse: any): void {
    if (!apiResponse) return;

    if (apiResponse.organization) this.organization.set(apiResponse.organization);
    if (apiResponse.layout) this.layout.set(apiResponse.layout);
    if (apiResponse.settings) this.globalSettings.set(apiResponse.settings);

    if (apiResponse.page) {
      this.page.set(apiResponse.page);
      this._updateSeo(apiResponse.page, apiResponse.organization);
    }
  }

  /**
   * Partial update — use when only layout or settings change
   * (e.g. after updateLayout() in the admin builder).
   */
  patchLayout(layout: any): void {
    this.layout.set(layout);
  }

  patchSettings(settings: any): void {
    this.globalSettings.set(settings);
  }

  /** Reset all state (e.g. when navigating to a different store). */
  reset(): void {
    this.organization.set(null);
    this.layout.set(null);
    this.globalSettings.set(null);
    this.page.set(null);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _updateSeo(page: any, org: any): void {
    const siteName = org?.name ?? 'Store';

    // Page title: use SEO title if set, else "Page Name – Site Name"
    const title = page.seo?.title ?? `${page.name} – ${siteName}`;
    this.titleService.setTitle(title);

    if (page.seo?.description) {
      this.metaService.updateTag({ name: 'description', content: page.seo.description });
      this.metaService.updateTag({ property: 'og:description', content: page.seo.description });
    }

    const ogImage = page.seo?.ogImage ?? page.seo?.image;
    if (ogImage) {
      this.metaService.updateTag({ property: 'og:image', content: ogImage });
    }

    if (page.seo?.noIndex) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    }
  }
}

// import { Injectable, signal, computed, inject } from '@angular/core';
// import { Title, Meta } from '@angular/platform-browser';

// @Injectable({
//   providedIn: 'root'
// })
// export class StorefrontStateService {

//   private titleService = inject(Title);
//   private metaService = inject(Meta);

//   // --- 1. CORE STATE SIGNALS ---
//   readonly layout = signal<any>(null);
//   readonly organization = signal<any>(null);
//   readonly globalSettings = signal<any>(null);

//   // ✅ NEW: Added Page Signal (Required for Page-Specific Theming)
//   readonly page = signal<any>(null);

//   // --- 2. COMPUTED STATE (The "Smart" Layer) ---

//   // automatically merges Global Theme with Page-Specific Theme Overrides
//   readonly activeTheme = computed(() => {
//     const pageTheme = this.page()?.theme || {};
//     const globalTheme = this.globalSettings()?.theme || {};

//     return {
//       primaryColor: pageTheme.primaryColor || globalTheme.primaryColor || '#000000',
//       secondaryColor: pageTheme.secondaryColor || globalTheme.secondaryColor || '#666666',
//       backgroundColor: pageTheme.backgroundColor || globalTheme.backgroundColor || '#FDFCF8',
//       fontFamily: pageTheme.fontFamily || globalTheme.fontFamily || 'Inter, sans-serif',
//       borderRadius: pageTheme.borderRadius || globalTheme.borderRadius || 'md'
//     };
//   });

//   /**
//    * Called by DynamicPage or ProductListing to hydrate the UI
//    */
//   setState(apiResponse: any) {
//     if (!apiResponse) return;

//     // 1. Update Layout
//     if (apiResponse.layout) {
//       this.layout.set(apiResponse.layout);
//     }

//     // 2. Update Organization
//     if (apiResponse.organization) {
//       this.organization.set(apiResponse.organization);
//     }

//     // 3. Update Settings
//     if (apiResponse.settings) {
//       this.globalSettings.set(apiResponse.settings);
//     }

//     // 4. ✅ Update Page (Crucial!)
//     if (apiResponse.page) {
//       this.page.set(apiResponse.page);
//       this.updateSeo(apiResponse.page, apiResponse.organization);
//     }
//   }

//   /**
//    * ✅ BONUS: Auto-update Browser Tab Title & Meta Description
//    */
//   private updateSeo(page: any, org: any) {
//     const siteName = org?.name || 'Store';

//     // Set Title: "Page Name - Store Name"
//     const title = page.seo?.title || `${page.name} - ${siteName}`;
//     this.titleService.setTitle(title);

//     // Set Description
//     if (page.seo?.description) {
//       this.metaService.updateTag({ name: 'description', content: page.seo.description });
//       this.metaService.updateTag({ property: 'og:description', content: page.seo.description });
//     }

//     // Set OG Image (for sharing)
//     if (page.seo?.ogImage || page.seo?.image) {
//       this.metaService.updateTag({ property: 'og:image', content: page.seo.ogImage || page.seo.image });
//     }
//   }
// }