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
// Resolved URL : {environment.apiUrl}/v1/store/...
//                e.g. http://localhost:5000/api/v1/store/:orgSlug/products
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class StorefrontPublicService extends BaseApiService {

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