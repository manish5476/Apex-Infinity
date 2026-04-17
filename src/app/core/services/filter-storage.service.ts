import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class FilterStorageService {
  private platformId = inject(PLATFORM_ID);

  setFilters(type: string, filters: any): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(`${type}Filters`, JSON.stringify(filters));
      } catch (e) {
        console.error('Error saving filters to localStorage', e);
      }
    }
  }

  getStoredFilters(type: string): any {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const filters = localStorage.getItem(`${type}Filters`);
        return filters ? JSON.parse(filters) : {};
      } catch (e) {
        console.error('Error reading filters from localStorage', e);
        return {};
      }
    }
    return {};
  }

  clearFilters(type?: string): void {
    if (isPlatformBrowser(this.platformId)) {
      if (type) {
        localStorage.removeItem(`${type}Filters`);
      } else {
        Object.keys(localStorage).forEach(key => {
          if (key.endsWith('Filters')) {
            localStorage.removeItem(key);
          }
        });
      }
    }
  }
}
