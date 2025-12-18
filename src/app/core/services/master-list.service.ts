// ... existing imports ...
import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, of } from 'rxjs';
import { ApiService } from './api';


export interface MasterItem {
  _id: string;
  name: string; // <--- Removed the '?' to make it required
  title?: string;
  customLabel?: string;
  [key: string]: any;
}

export interface MasterList {
  branches: MasterItem[];
  roles: MasterItem[];
  products: MasterItem[];
  customers: MasterItem[];
  suppliers: MasterItem[];
  users: MasterItem[];
  accounts: MasterItem[]; // Added
  emis: MasterItem[];     // Added
  // Flattened from 'masters' object:
  category?: MasterItem[];
  brand?: MasterItem[];
  units?: MasterItem[];
  taxes?: MasterItem[];
}

@Injectable({ providedIn: 'root' })
export class MasterListService {
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  // The main state signal
  private readonly _data = signal<MasterList | null>(null);

  // --- Computed Signals (Read-only accessors) ---
  readonly data = computed(() => this._data());
  
  // Core Entities
  readonly branches = computed(() => this._data()?.branches ?? []);
  readonly roles = computed(() => this._data()?.roles ?? []);
  readonly users = computed(() => this._data()?.users ?? []);
  readonly customers = computed(() => this._data()?.customers ?? []);
  readonly suppliers = computed(() => this._data()?.suppliers ?? []);
  readonly products = computed(() => this._data()?.products ?? []);
  readonly accounts = computed(() => this._data()?.accounts ?? []);
  readonly emis = computed(() => this._data()?.emis ?? []);

  // Dynamic Masters (Flattened)
  readonly categories = computed(() => this._data()?.category ?? []);
  readonly brands = computed(() => this._data()?.brand ?? []);
  readonly units = computed(() => this._data()?.units ?? []);
  readonly taxes = computed(() => this._data()?.taxes ?? []);

  constructor() {
    this.initFromCache();
  }

  /**
   * 1. HEAVY LOAD
   * Fetches everything at once. Best for App Initialization.
   */
  load(): void {
    this.api.getMasterList().pipe(
      catchError(err => {
        console.error('Failed to load master list', err);
        return of({ data: null });
      })
    ).subscribe((res: any) => {
      if (res?.data) {
        // Flatten logic: Merge 'masters' (generic types) into the root object
        // Backend sends: { branches: [], masters: { category: [], brand: [] } }
        const genericMasters = res.data.masters || {}; 
        const finalData: MasterList = {
          ...res.data,
          ...genericMasters // Spreads category, brand, units, etc. to top level
        };
        this.updateState(finalData);
      }
    });
  }

  /**
   * 2. LIGHTWEIGHT REFRESH
   * Refreshes ONLY one list. Best used after creating/editing an item.
   * Usage: masterList.refreshSpecific('customer');
   */
  refreshSpecific(type: string): void {
    // Map 'singular' API type to 'plural' State key
    const keyMap: { [key: string]: keyof MasterList } = {
      'branch': 'branches',
      'role': 'roles',
      'customer': 'customers',
      'supplier': 'suppliers',
      'product': 'products',
      'user': 'users',
      'account': 'accounts',
      'emi': 'emis'
    };

    const stateKey = keyMap[type.toLowerCase()];
    if (!stateKey) {
      // If it's not a core entity, it might be a generic master (category, brand)
      // For now, we only support optimized refresh for core entities. 
      // Fallback to full load if needed or extend logic.
      return; 
    }

    this.api.getSpecificList(type).subscribe({
      next: (res:any) => {
        if (res?.data) {
          const currentData = this._data() || {} as MasterList;
          // Patch the specific array in the signal
          const updatedData = { ...currentData, [stateKey]: res.data };
          this.updateState(updatedData);
        }
      },
      error: (err:any) => console.error(`Failed to refresh ${type}`, err)
    });
  }

  private updateState(data: MasterList): void {
    this._data.set(data);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('masterList', JSON.stringify(data));
      } catch {}
    }
  }

  initFromCache(): void {
    if (isPlatformBrowser(this.platformId)) {
      const cache = localStorage.getItem('masterList');
      if (cache) {
        try {
          this._data.set(JSON.parse(cache));
        } catch (e) {
          console.error('Failed to parse master list cache', e);
          localStorage.removeItem('masterList');
        }
      }
    }
  }

  clear(): void {
    this._data.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('masterList');
    }
  }

  refresh(): void { 
    this.load(); 
  }
}