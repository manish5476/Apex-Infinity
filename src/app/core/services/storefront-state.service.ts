import { Injectable, signal, computed, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class StorefrontStateService {
  
  private titleService = inject(Title);
  private metaService = inject(Meta);

  // --- 1. CORE STATE SIGNALS ---
  readonly layout = signal<any>(null);
  readonly organization = signal<any>(null);
  readonly globalSettings = signal<any>(null);
  
  // ✅ NEW: Added Page Signal (Required for Page-Specific Theming)
  readonly page = signal<any>(null);

  // --- 2. COMPUTED STATE (The "Smart" Layer) ---
  
  // automatically merges Global Theme with Page-Specific Theme Overrides
  readonly activeTheme = computed(() => {
    const pageTheme = this.page()?.theme || {};
    const globalTheme = this.globalSettings()?.theme || {};

    return {
      primaryColor: pageTheme.primaryColor || globalTheme.primaryColor || '#000000',
      secondaryColor: pageTheme.secondaryColor || globalTheme.secondaryColor || '#666666',
      backgroundColor: pageTheme.backgroundColor || globalTheme.backgroundColor || '#FDFCF8',
      fontFamily: pageTheme.fontFamily || globalTheme.fontFamily || 'Inter, sans-serif',
      borderRadius: pageTheme.borderRadius || globalTheme.borderRadius || 'md'
    };
  });

  /**
   * Called by DynamicPage or ProductListing to hydrate the UI
   */
  setState(apiResponse: any) {
    if (!apiResponse) return;

    // 1. Update Layout
    if (apiResponse.layout) {
      this.layout.set(apiResponse.layout);
    }
    
    // 2. Update Organization
    if (apiResponse.organization) {
      this.organization.set(apiResponse.organization);
    }
    
    // 3. Update Settings
    if (apiResponse.settings) {
      this.globalSettings.set(apiResponse.settings);
    }

    // 4. ✅ Update Page (Crucial!)
    if (apiResponse.page) {
      this.page.set(apiResponse.page);
      this.updateSeo(apiResponse.page, apiResponse.organization);
    }
  }

  /**
   * ✅ BONUS: Auto-update Browser Tab Title & Meta Description
   */
  private updateSeo(page: any, org: any) {
    const siteName = org?.name || 'Store';
    
    // Set Title: "Page Name - Store Name"
    const title = page.seo?.title || `${page.name} - ${siteName}`;
    this.titleService.setTitle(title);

    // Set Description
    if (page.seo?.description) {
      this.metaService.updateTag({ name: 'description', content: page.seo.description });
      this.metaService.updateTag({ property: 'og:description', content: page.seo.description });
    }

    // Set OG Image (for sharing)
    if (page.seo?.ogImage || page.seo?.image) {
      this.metaService.updateTag({ property: 'og:image', content: page.seo.ogImage || page.seo.image });
    }
  }
}

// import { Injectable, signal } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class StorefrontStateService {

//   // Signals that hold the data for the Header/Footer to read
//   readonly layout = signal<any>(null);
//   readonly organization = signal<any>(null);
//   readonly globalSettings = signal<any>(null);

//   /**
//    * Called by Page Components (ProductListing, DynamicPage)
//    * to push the latest API data into the layout.
//    */
//   setState(apiResponse: any) {
//     if (!apiResponse) return;

//     // 1. Update Layout (Header/Footer structure)
//     if (apiResponse.layout) {
//       this.layout.set(apiResponse.layout);
//     }
    
//     // 2. Update Organization (Logo, Name, Contact info)
//     if (apiResponse.organization) {
//       this.organization.set(apiResponse.organization);
//     }
    
//     // 3. Update Global Settings (Favicon, Social Links)
//     if (apiResponse.settings) {
//       this.globalSettings.set(apiResponse.settings);
//     }
//   }
// }