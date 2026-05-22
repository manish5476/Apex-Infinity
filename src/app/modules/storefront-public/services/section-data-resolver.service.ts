import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SectionDataResolverService {
  
  /**
   * Universal data resolution pipeline for generic arrays.
   * Resolves in order:
   * 1. section.data (hydrated by backend)
   * 2. section.manualData (if it's an array)
   * 3. section.hydratedData
   * 4. section.config?.data
   * 5. fallback to empty array
   */
  resolveArrayData<T = any>(section: any): T[] {
    if (!section) return [];
    
    if (Array.isArray(section.data)) return section.data;
    
    // Sometimes manualData is an array directly (e.g. locations)
    if (Array.isArray(section.manualData)) return section.manualData;
    
    if (Array.isArray(section.hydratedData)) return section.hydratedData;
    if (Array.isArray(section.config?.data)) return section.config.data;
    if (Array.isArray(section.config?.items)) return section.config.items;

    return [];
  }

  /**
   * Specialized resolver for map locations.
   */
  resolveLocations(section: any): any[] {
    if (!section) return [];
    
    let locations: any[] = [];
    
    if (Array.isArray(section.data) && section.data.length > 0) {
      locations = section.data;
    } else if (Array.isArray(section.manualData) && section.manualData.length > 0) {
      locations = section.manualData;
    } else if (section.config?.locations && Array.isArray(section.config.locations)) {
      locations = section.config.locations;
    }

    return locations;
  }

  /**
   * Resolves products data
   */
  resolveProducts(section: any): any[] {
    return this.resolveArrayData(section);
  }

  /**
   * Resolves categories data
   */
  resolveCategories(section: any): any[] {
    return this.resolveArrayData(section);
  }

  /**
   * Resolves blog posts
   */
  resolvePosts(section: any): any[] {
    return this.resolveArrayData(section);
  }
}
