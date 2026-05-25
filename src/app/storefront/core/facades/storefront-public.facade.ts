// src/app/storefront/core/facades/storefront-public.facade.ts
//
// High-level facade for all public (unauthenticated) storefront data:
//   • Organisation info / store metadata
//   • Catalogue filters (categories, brands, tags, price range)
//   • Product listing + product detail
//   • Search
//   • Full page render (layout + sections + SEO)
//
// Components should inject this service rather than StorefrontPublicApi directly.

import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import {
  ProductListParams,
  PublicProduct,
  PublicProductList,
  StorefrontApiError,
  StorefrontBrand,
  StorefrontCategory,
  StorefrontFilters,
  StorefrontMeta,
  StorefrontOrganizationInfo,
  StorefrontPageRender,
  StorefrontSitemap,
  StorefrontTag
} from '@apx/storefront-contracts';
import { StorefrontPublicApi } from '../api/storefront-public.api';
import { StorefrontCacheService } from '../state/storefront-cache.service';

/** Default cache TTL (ms) for public catalogue data. */
const CATALOGUE_CACHE_TTL = 5 * 60_000;  // 5 min
const PAGE_CACHE_TTL      = 2 * 60_000;  // 2 min

@Injectable({ providedIn: 'root' })
export class StorefrontPublicFacade {
  private readonly api   = inject(StorefrontPublicApi);
  private readonly cache = inject(StorefrontCacheService);

  // ── Reactive state ──────────────────────────────────────────────────────────

  readonly organization = signal<StorefrontOrganizationInfo | null>(null);
  readonly currentPage  = signal<StorefrontPageRender | null>(null);
  readonly meta         = signal<StorefrontMeta | null>(null);
  readonly filters      = signal<StorefrontFilters | null>(null);
  readonly categories   = signal<readonly StorefrontCategory[]>([]);
  readonly brands       = signal<readonly StorefrontBrand[]>([]);
  readonly tags         = signal<readonly StorefrontTag[]>([]);
  readonly products     = signal<PublicProductList | null>(null);
  readonly currentProduct = signal<PublicProduct | null>(null);

  readonly loading = signal(false);
  readonly error   = signal<StorefrontApiError | null>(null);

  // ── Store info ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug
   * Loads and caches organisation info for the active storefront shell.
   */
  loadOrganizationInfo(orgSlug: string, force = false): Observable<StorefrontOrganizationInfo | null> {
    const key = `org:${orgSlug}`;
    const cached = this.cache.get<StorefrontOrganizationInfo>(key);
    if (cached && !force) {
      this.organization.set(cached);
      return of(cached);
    }
    this.loading.set(true);
    return this.api.getOrganizationInfo(orgSlug).pipe(
      tap(r => {
        this.organization.set(r.data);
        this.cache.set(key, r.data, CATALOGUE_CACHE_TTL);
      }),
      map(r => r.data),
      catchError(e => this.handleError<StorefrontOrganizationInfo>(e)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * GET /api/v1/store/:organizationSlug/sitemap
   */
  getSitemap(orgSlug: string): Observable<StorefrontSitemap | null> {
    const key = `sitemap:${orgSlug}`;
    const cached = this.cache.get<StorefrontSitemap>(key);
    if (cached) return of(cached);

    return this.api.getSitemap(orgSlug).pipe(
      tap(r => this.cache.set(key, r.data, CATALOGUE_CACHE_TTL)),
      map(r => r.data),
      catchError(e => this.handleError<StorefrontSitemap>(e))
    );
  }

  // ── Catalogue metadata ──────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug/meta
   * Full metadata in one call. Sets categories/brands/tags/meta signals.
   */
  loadMeta(orgSlug: string, force = false): Observable<StorefrontMeta | null> {
    const key = `meta:${orgSlug}`;
    const cached = this.cache.get<StorefrontMeta>(key);
    if (cached && !force) {
      this.meta.set(cached);
      return of(cached);
    }
    this.loading.set(true);
    return this.api.getStoreMetadata(orgSlug).pipe(
      tap(r => {
        this.meta.set(r.data);
        this.cache.set(key, r.data, CATALOGUE_CACHE_TTL);
      }),
      map(r => r.data),
      catchError(e => this.handleError<StorefrontMeta>(e)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * GET /api/v1/store/:organizationSlug/filters
   * Lighter version of meta — just categories, brands, and price range.
   */
  loadFilters(orgSlug: string, force = false): Observable<StorefrontFilters | null> {
    const key = `filters:${orgSlug}`;
    const cached = this.cache.get<StorefrontFilters>(key);
    if (cached && !force) {
      this.filters.set(cached);
      return of(cached);
    }
    this.loading.set(true);
    return this.api.getShopFilters(orgSlug).pipe(
      tap(r => {
        this.filters.set(r.data);
        this.cache.set(key, r.data, CATALOGUE_CACHE_TTL);
      }),
      map(r => r.data),
      catchError(e => this.handleError<StorefrontFilters>(e)),
      finalize(() => this.loading.set(false))
    );
  }

  /** GET /api/v1/store/:organizationSlug/categories */
  loadCategories(orgSlug: string): Observable<readonly StorefrontCategory[] | null> {
    const key = `categories:${orgSlug}`;
    const cached = this.cache.get<readonly StorefrontCategory[]>(key);
    if (cached) {
      this.categories.set(cached);
      return of(cached);
    }
    return this.api.getCategories(orgSlug).pipe(
      tap(r => {
        this.categories.set(r.data ?? []);
        this.cache.set(key, r.data, CATALOGUE_CACHE_TTL);
      }),
      map(r => r.data),
      catchError(e => this.handleError<readonly StorefrontCategory[]>(e))
    );
  }

  /** GET /api/v1/store/:organizationSlug/brands */
  loadBrands(orgSlug: string): Observable<readonly StorefrontBrand[] | null> {
    const key = `brands:${orgSlug}`;
    const cached = this.cache.get<readonly StorefrontBrand[]>(key);
    if (cached) {
      this.brands.set(cached);
      return of(cached);
    }
    return this.api.getBrands(orgSlug).pipe(
      tap(r => {
        this.brands.set(r.data ?? []);
        this.cache.set(key, r.data, CATALOGUE_CACHE_TTL);
      }),
      map(r => r.data),
      catchError(e => this.handleError<readonly StorefrontBrand[]>(e))
    );
  }

  /** GET /api/v1/store/:organizationSlug/tags */
  loadTags(orgSlug: string): Observable<readonly StorefrontTag[] | null> {
    const key = `tags:${orgSlug}`;
    const cached = this.cache.get<readonly StorefrontTag[]>(key);
    if (cached) {
      this.tags.set(cached);
      return of(cached);
    }
    return this.api.getTags(orgSlug).pipe(
      tap(r => {
        this.tags.set(r.data ?? []);
        this.cache.set(key, r.data, CATALOGUE_CACHE_TTL);
      }),
      map(r => r.data),
      catchError(e => this.handleError<readonly StorefrontTag[]>(e))
    );
  }

  // ── Products ────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug/products
   * Listing with optional filter/sort/pagination params.
   */
  loadProducts(orgSlug: string, params?: ProductListParams): Observable<PublicProductList | null> {
    this.loading.set(true);
    return this.api.products(orgSlug, params).pipe(
      tap(r => this.products.set(r.data)),
      map(r => r.data),
      catchError(e => this.handleError<PublicProductList>(e)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * GET /api/v1/store/:organizationSlug/products/:productSlug
   */
  loadProduct(orgSlug: string, productSlug: string): Observable<PublicProduct | null> {
    this.loading.set(true);
    return this.api.product(orgSlug, productSlug).pipe(
      tap(r => this.currentProduct.set(r.data?.product ?? null)),
      map(r => r.data?.product ?? null),
      catchError(e => this.handleError<PublicProduct>(e)),
      finalize(() => this.loading.set(false))
    );
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug/search?q=
   */
  search(orgSlug: string, query: string): Observable<PublicProductList | null> {
    if (!query || query.length < 2) return of(null);
    return this.api.search(orgSlug, query).pipe(
      map(r => r.data),
      catchError(e => this.handleError<PublicProductList>(e))
    );
  }

  // ── Page render ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/:organizationSlug/:pageSlug
   * Full page render: layout + hydrated sections + SEO meta.
   * Pass 'home' or omit pageSlug for the homepage.
   */
  loadPage(orgSlug: string, pageSlug = 'home', force = false): Observable<StorefrontPageRender | null> {
    const key = `page:${orgSlug}:${pageSlug}`;
    const cached = this.cache.get<StorefrontPageRender>(key);
    if (cached && !force) {
      this.currentPage.set(cached);
      return of(cached);
    }
    this.loading.set(true);
    return this.api.getPage(orgSlug, pageSlug).pipe(
      tap(r => {
        this.currentPage.set(r.data);
        if (r.data?.organization) this.organization.set(r.data.organization);
        this.cache.set(key, r.data, PAGE_CACHE_TTL);
      }),
      map(r => r.data),
      catchError(e => this.handleError<StorefrontPageRender>(e)),
      finalize(() => this.loading.set(false))
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private handleError<T>(error: unknown): Observable<T | null> {
    this.error.set(error as StorefrontApiError);
    return of(null);
  }
}
