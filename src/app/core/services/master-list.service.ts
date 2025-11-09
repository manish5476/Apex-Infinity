import { Injectable, signal, computed, inject, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from './api';

export interface MasterList {
  branches: Array<{ _id: string; name: string }>;
  roles: Array<{ _id: string; name: string }>;
  products: Array<{ _id: string; name: string }>;
  customers?: Array<{ _id: string; name: string }>;
  suppliers?: Array<{ _id: string; name: string }>;
}

@Injectable({ providedIn: 'root' })
export class MasterListService {
  // --- Injections ---
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  // --- State Signals ---
  private readonly _data = signal<MasterList | null>(null);
  readonly data = computed(() => this._data());
  readonly branches = computed(() => this._data()?.branches ?? []);
  readonly roles = computed(() => this._data()?.roles ?? []);
  readonly products = computed(() => this._data()?.products ?? []);
  readonly customers = computed(() => this._data()?.customers ?? []);
  readonly suppliers = computed(() => this._data()?.suppliers ?? []);

  constructor() {
    this.initFromCache();
  }

  load(): void {
    this.api.getMasterList().pipe(
      catchError(err => {
        console.error('❌ Failed to load master list', err);
        return of({ data: null });
      })
    ).subscribe((res: any) => {
      if (res?.data) {
        console.log('API Response:', res);
        this._data.set(res.data);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('masterList', JSON.stringify(res.data)); // persist
        }
        console.log('✅ Master list loaded');
      }
    });
  }

  initFromCache(): void {
    if (isPlatformBrowser(this.platformId)) {
      const cache = localStorage.getItem('masterList');
      if (cache) {
        try {
          this._data.set(JSON.parse(cache));
          console.log('💾 Master list restored from cache');
        } catch (e) {
          console.error('Failed to parse master list cache', e);
          localStorage.removeItem('masterList');
          this.load();
        }
      } else {
        this.load();
      }
    } else {
      // SSR mode — skip localStorage entirely
      this.load();
    }
  }

  clear(): void {
    this._data.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('masterList');
    }
  }

  /** Optional: refresh on demand */
  public refresh(): void {
    this.load();
  }
}

// import { Injectable, signal, computed, inject, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { ApiService } from './api';
// import { catchError, of, tap } from 'rxjs';

// export interface MasterList {
//   branches: Array<{ _id: string; name: string }>;
//   roles: Array<{ _id: string; name: string }>;
//   products: Array<{ _id: string; name: string }>;
//   customers?: Array<{ _id: string; name: string }>;
//   suppliers?: Array<{ _id: string; name: string }>;
// }

// @Injectable({ providedIn: 'root' })
// export class MasterListService {
//   private api = inject(ApiService);
//   private platformId = inject(PLATFORM_ID);
//   // --- State Signals ---
//   private readonly _data = signal<MasterList | null>(null);
//   readonly data = computed(() => this._data());
//   readonly branches = computed(() => this._data()?.branches ?? []);
//   readonly roles = computed(() => this._data()?.roles ?? []);
//   readonly products = computed(() => this._data()?.products ?? []);
//   readonly customers = computed(() => this._data()?.customers ?? []);
//   readonly suppliers = computed(() => this._data()?.suppliers ?? []);

//   constructor() {
//     this.initFromCache();
//   }

//    load(): void { 
//     this.api.getMasterList().pipe(
//       catchError(err => {
//         console.error('❌ Failed to load master list', err);
//         return of({ data: null });
//       })
//     ).subscribe((res: any) => {
//       if (res?.data) {
//   console.log(res);
//         this._data.set(res.data);
//         // ✅ FIX 1: Guard localStorage access
//         if (isPlatformBrowser(this.platformId)) {
//           localStorage.setItem('masterList', JSON.stringify(res.data)); // persist
//         }
//         console.log('✅ Master list loaded');
//       }
//     });
//   }

// initFromCache(): void {
//   if (isPlatformBrowser(this.platformId)) {
//     const cache = localStorage.getItem('masterList');
//     if (cache) {
//       try {
//         this._data.set(JSON.parse(cache));
//         console.log('💾 Master list restored from cache');
//       } catch (e) {
//         console.error('Failed to parse master list cache', e);
//         localStorage.removeItem('masterList');
//         this.load();
//       }
//     } else {
//       this.load();
//     }
//   } else {
//     // SSR mode — skip localStorage entirely
//     this.load();
//   }
// }

// clear(): void {
//   this._data.set(null);
//   if (isPlatformBrowser(this.platformId)) {
//     localStorage.removeItem('masterList');
//   }
// }


//   /** Load from cache (if any) before making an API call */
// //    initFromCache(): void {
// //     // ✅ FIX 1: Guard localStorage access
// //     if (isPlatformBrowser(this.platformId)) {
// //       const cache = localStorage.getItem('masterList');
// //       if (cache) {
// //         try {
// //           this._data.set(JSON.parse(cache));
// //           console.log('💾 Master list restored from cache');
// //         } catch (e) {
// //           console.error('Failed to parse master list cache', e);
// //           localStorage.removeItem('masterList');
// //           this.load(); // Cache was bad, load from API
// //         }
// //       } else {
// //         this.load(); // No cache, load from API
// //       }
// //     } else {
// //       // If we are on the server (SSR), just load from API.
// //       // The data will NOT be cached, which is correct server behavior.
// //       this.load();
// //     }
// //   }

//   /** Optional: refresh on demand */
//   public refresh(): void {
//     this.load();
//   }

// //   public clear(): void {
// //     this._data.set(null);
// //     // ✅ FIX 1: Guard localStorage access
// //     if (isPlatformBrowser(this.platformId)) {
// //       localStorage.removeItem('masterList');
// //     }
// //   }
// }
