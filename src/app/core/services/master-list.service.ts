import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api';
import { catchError, of } from 'rxjs';

export interface MasterList {
  branches: Array<{ _id: string; name: string }>;
  roles: Array<{ _id: string; name: string }>;
  products: Array<{ _id: string; name: string }>;
  customers?: Array<{ _id: string; name: string }>;
  suppliers?: Array<{ _id: string; name: string }>;
}

@Injectable({ providedIn: 'root' })
export class MasterListService {
  private readonly _data = signal<MasterList | null>(null);
  readonly data = computed(() => this._data());
  readonly branches = computed(() => this._data()?.branches ?? []);
  readonly roles = computed(() => this._data()?.roles ?? []);
  readonly products = computed(() => this._data()?.products ?? []);
  readonly customers = computed(() => this._data()?.customers ?? []);
  readonly suppliers = computed(() => this._data()?.suppliers ?? []);

  constructor(private api: ApiService) {}

  /** Fetch once and cache locally */
  load() {
    return this.api.getMasterList().pipe(
      catchError(err => {
        console.error('❌ Failed to load master list', err);
        return of({ data: null });
      })
    ).subscribe((res: any) => {
      if (res?.data) {
        this._data.set(res.data);
        localStorage.setItem('masterList', JSON.stringify(res.data)); // persist
        console.log('✅ Master list loaded');
      }
    });
  }

  /** Load from cache (if any) before making an API call */
  initFromCache() {
    const cache = localStorage.getItem('masterList');
    if (cache) {
      this._data.set(JSON.parse(cache));
      console.log('💾 Master list restored from cache');
    } else {
      this.load();
    }
  }

  /** Optional: refresh on demand */
  refresh() {
    this.load();
  }

  clear() {
    this._data.set(null);
    localStorage.removeItem('masterList');
  }
}
