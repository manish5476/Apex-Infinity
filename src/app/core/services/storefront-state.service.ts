import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorefrontStateService {

  // Signals that hold the data for the Header/Footer to read
  readonly layout = signal<any>(null);
  readonly organization = signal<any>(null);
  readonly globalSettings = signal<any>(null);

  /**
   * Called by Page Components (ProductListing, DynamicPage)
   * to push the latest API data into the layout.
   */
  setState(apiResponse: any) {
    if (!apiResponse) return;

    // 1. Update Layout (Header/Footer structure)
    if (apiResponse.layout) {
      this.layout.set(apiResponse.layout);
    }
    
    // 2. Update Organization (Logo, Name, Contact info)
    if (apiResponse.organization) {
      this.organization.set(apiResponse.organization);
    }
    
    // 3. Update Global Settings (Favicon, Social Links)
    if (apiResponse.settings) {
      this.globalSettings.set(apiResponse.settings);
    }
  }
}