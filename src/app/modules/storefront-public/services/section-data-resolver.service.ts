import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SectionDataResolverService {
  resolveArrayData<T = any>(section: any): T[] {
    if (!section) return [];
    if (Array.isArray(section.data)) return section.data;
    if (Array.isArray(section.manualData)) return section.manualData;
    if (Array.isArray(section.hydratedData)) return section.hydratedData;
    if (Array.isArray(section.config?.data)) return section.config.data;
    if (Array.isArray(section.config?.items)) return section.config.items;

    return [];
  }

  resolveData<T = any>(section: any, fallback: T | null = null): T | null {
    if (!section) return fallback;
    return section.data
      ?? section.manualData
      ?? section.hydratedData
      ?? section.config?.data
      ?? fallback;
  }

  /**
   * Specialized resolver for map locations.
   */
  resolveLocations(section: any): any[] {
    if (!section) return [];

    const locations =
      this.firstArray(section.data)
      ?? this.firstArray(section.manualData)
      ?? this.firstArray(section.hydratedData)
      ?? this.firstArray(section.config?.data)
      ?? this.firstArray(section.config?.locations)
      ?? [];

    return locations
      .map(location => this.normalizeLocation(location))
      .filter(location => location && Number.isFinite(Number(location.location?.lat)) && Number.isFinite(Number(location.location?.lng)));
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

  private firstArray(value: any): any[] | null {
    return Array.isArray(value) ? value : null;
  }

  private normalizeLocation(location: any): any | null {
    if (!location) return null;

    const coordinates = location.location?.coordinates;
    const lat = location.location?.lat ?? location.lat ?? (Array.isArray(coordinates) ? coordinates[1] : undefined);
    const lng = location.location?.lng ?? location.lng ?? (Array.isArray(coordinates) ? coordinates[0] : undefined);

    return {
      ...location,
      _id: location._id ?? location.id ?? `${lat}-${lng}-${location.name ?? 'location'}`,
      address: location.address ?? {},
      location: {
        ...location.location,
        lat: Number(lat),
        lng: Number(lng)
      }
    };
  }
}
