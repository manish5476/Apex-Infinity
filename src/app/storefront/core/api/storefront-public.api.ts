// src/app/storefront/core/api/storefront-public.api.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NormalizedStorefrontResponse,
  ProductListParams,
  PublicProduct,
  PublicProductList,
  StorefrontBrand,
  StorefrontCategory,
  StorefrontFilters,
  StorefrontMeta,
  StorefrontOrganizationInfo,
  StorefrontPage,
  StorefrontPageRender,
  StorefrontSitemap,
  StorefrontTag
} from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

@Injectable({ providedIn: 'root' })
export class StorefrontPublicApi {
  private readonly api = inject(StorefrontApiClient);

  // ── Store info ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug
   * Org name, logo, contact info, global settings. Lightweight — ideal for app
   * shell initialisation.
   */
  getOrganizationInfo(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontOrganizationInfo>> {
    return this.api.get<StorefrontOrganizationInfo>(orgSlug);
  }

  /**
   * GET /api/v1/store/:organizationSlug/sitemap
   * Published page slugs for SEO/navigation.
   */
  getSitemap(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontSitemap>> {
    return this.api.get<StorefrontSitemap>(orgSlug, 'sitemap');
  }

  /**
   * GET /api/v1/store/:organizationSlug/meta
   * Full store metadata in one call: categories, brands, tags, price range.
   * Use this on initial storefront load to populate all filter dropdowns.
   */
  getStoreMetadata(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontMeta>> {
    return this.api.get<StorefrontMeta>(orgSlug, 'meta');
  }

  /**
   * GET /api/v1/store/:organizationSlug/filters
   * Combined filter facets (categories with counts, brands with counts, price range).
   * Lighter than getStoreMetadata — use for the shop sidebar filters.
   */
  getShopFilters(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontFilters>> {
    return this.api.get<StorefrontFilters>(orgSlug, 'filters');
  }

  // ── Catalogue filters ───────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug/categories
   */
  getCategories(orgSlug: string): Observable<NormalizedStorefrontResponse<readonly StorefrontCategory[]>> {
    return this.api.get<readonly StorefrontCategory[]>(orgSlug, 'categories');
  }

  /**
   * GET /api/v1/store/:organizationSlug/brands
   */
  getBrands(orgSlug: string): Observable<NormalizedStorefrontResponse<readonly StorefrontBrand[]>> {
    return this.api.get<readonly StorefrontBrand[]>(orgSlug, 'brands');
  }

  /**
   * GET /api/v1/store/:organizationSlug/tags
   */
  getTags(orgSlug: string): Observable<NormalizedStorefrontResponse<readonly StorefrontTag[]>> {
    return this.api.get<readonly StorefrontTag[]>(orgSlug, 'tags');
  }

  // ── Products ────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug/products
   */
  products(orgSlug: string, params?: ProductListParams): Observable<NormalizedStorefrontResponse<PublicProductList>> {
    return this.api.get<PublicProductList>(orgSlug, 'products', params ? { ...params } : undefined);
  }

  /**
   * GET /api/v1/store/:organizationSlug/products/:productSlug
   */
  product(orgSlug: string, productSlug: string): Observable<NormalizedStorefrontResponse<{ readonly product: PublicProduct }>> {
    return this.api.get<{ readonly product: PublicProduct }>(orgSlug, `products/${productSlug}`);
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug/search?q=
   * Searches product names, SKUs, tags, and matching category/brand names. Min 2 chars.
   */
  search(orgSlug: string, query: string): Observable<NormalizedStorefrontResponse<PublicProductList>> {
    return this.api.get<PublicProductList>(orgSlug, 'search', { q: query });
  }

  // ── Page renderer ───────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug/:pageSlug
   * Full page render: layout (header/footer) + hydrated page sections + SEO.
   * Pass 'home' or omit pageSlug to get the homepage.
   * This is the catch-all route — always call AFTER more specific routes fail.
   */
  getPage(orgSlug: string, pageSlug: string = 'home'): Observable<NormalizedStorefrontResponse<StorefrontPageRender>> {
    return this.api.get<StorefrontPageRender>(orgSlug, pageSlug, undefined, { retryCount: 0 });
  }
}
