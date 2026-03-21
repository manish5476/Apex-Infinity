// src/app/core/services/storefront-public.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface ProductListParams {
  page?: number;
  limit?: number;
  sort?: string;           // shorthand e.g. '-sellingPrice'
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;       // slug or ID
  brand?: string;          // slug or ID
  subCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tags?: string;           // comma-separated
  inStock?: boolean;
}

// ---------------------------------------------------------------------------
// Service
//
// ✅ FIX: Base URL was built with a fragile regex strip.
//         Now uses environment.apiUrl directly — same pattern as all other services.
//
// Backend mount: app.use('/api/v1/store', publicRoutes)
// Resolved URL : {environment.apiUrl}/v1/store/...
//                e.g. http://localhost:5000/api/v1/store/:orgSlug/products
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class StorefrontPublicService extends BaseApiService {

  // ✅ Corrected — was: environment.apiUrl.replace(regex, '') + '/public'
  private readonly base = '/v1/store';

  // ── Store info ────────────────────────────────────────────────────────────

  /** Org name, logo, contact, global settings. Lightweight — good for app shell init. */
  getOrganizationInfo(orgSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}`);
  }

  getSitemap(orgSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/sitemap`);
  }

  /**
   * Full store metadata in one call: categories, brands, tags, price range.
   * Use this on initial storefront load to populate all filter dropdowns.
   */
  getStoreMetadata(orgSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/meta`);
  }

  /**
   * Combined filter facets (categories with counts, brands with counts, price range).
   * Lighter than getStoreMetadata — use for the shop sidebar filters.
   */
  getShopFilters(orgSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/filters`);
  }

  // ── Page rendering ────────────────────────────────────────────────────────

  /**
   * Full page render: layout (header/footer) + hydrated page sections + SEO.
   * Pass 'home' or omit pageSlug to get the homepage.
   */
  getPage(orgSlug: string, pageSlug: string = 'home'): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/${pageSlug}`);
  }

  // ── Products ──────────────────────────────────────────────────────────────

  getProducts(orgSlug: string, params?: ProductListParams): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/products`, params ?? {});
  }

  getProductBySlug(orgSlug: string, productSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/products/${productSlug}`);
  }

  // ── Search ────────────────────────────────────────────────────────────────

  /** Searches product names, SKUs, tags, and matching category/brand names. Min 2 chars. */
  searchProducts(orgSlug: string, query: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/search`, { q: query });
  }

  // ── Catalogue filters ─────────────────────────────────────────────────────

  getCategories(orgSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/categories`);
  }

  getBrands(orgSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/brands`);
  }

  getTags(orgSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/tags`);
  }
}

// import { Injectable, inject } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';

// @Injectable({
//   providedIn: 'root'
// })
// export class StorefrontPublicService {
//   private http = inject(HttpClient);
  
//   // 1. Base URL Logic (Robust Regex Version)
//   // Removes '/api/v1', '/api', or '/api/' from the end of environment.apiUrl to get root
//   // Then appends '/public' which matches backend: app.use('/public', ...)
//   // Result: http://localhost:5000/public
//   private baseUrl = environment.apiUrl.replace(/\/api(?:\/v1)?\/?$/, '') + '/public';

//   constructor() {
//     console.log('Storefront Public URL set to:', this.baseUrl); 
//   }

//   // ================= PAGE & ORG INFO =================

//   getOrganizationInfo(slug: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${slug}`);
//   }

//   getSitemap(slug: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${slug}/sitemap`);
//   }

//   getPage(orgSlug: string, pageSlug: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${orgSlug}/${pageSlug}`);
//   }

//   // ================= 2. PRODUCTS & CATALOG =================

//   getProducts(orgSlug: string, filters: any = {}): Observable<any> {
//     let params = new HttpParams();
//     Object.keys(filters).forEach(key => {
//       // Filter out null/undefined/empty to keep URL clean
//       if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
//         params = params.set(key, filters[key]);
//       }
//     });
//     return this.http.get(`${this.baseUrl}/${orgSlug}/products`, { params });
//   }

//   getProductBySlug(orgSlug: string, productSlug: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${orgSlug}/products/${productSlug}`);
//   }

//   // ================= FILTERS & SEARCH =================

//   getCategories(orgSlug: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${orgSlug}/categories`);
//   }

//   getTags(orgSlug: string): Observable<string[]> {
//     return this.http.get<string[]>(`${this.baseUrl}/${orgSlug}/tags`);
//   }

//   // ✅ NEW: Fetch all Dropdowns, Tags, and Price Ranges in ONE call
//   getStoreMetadata(orgSlug: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${orgSlug}/meta`);
//   }

//   searchProducts(orgSlug: string, query: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${orgSlug}/search`, {
//       params: { q: query }
//     });
//   }
// }