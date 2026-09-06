// src/app/tab-workspace/tab-route-reuse.strategy.ts

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy
} from '@angular/router';

interface CacheEntry {
  key: string;
  handle: DetachedRouteHandle;
  createdAt: number;
  lastAccessedAt: number;
}

const DEFAULT_MAX_CACHED = 8;
const MAX_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes

@Injectable({ providedIn: 'root' })
export class TabRouteReuseStrategy implements RouteReuseStrategy {
  private static instance: TabRouteReuseStrategy | null = null;
  private readonly cache = new Map<string, CacheEntry>();
  private maxCached = DEFAULT_MAX_CACHED;

  constructor() {
    TabRouteReuseStrategy.instance = this;
  }

  static getInstance(): TabRouteReuseStrategy | null {
    return TabRouteReuseStrategy.instance;
  }

  static evict(key: string): void {
    TabRouteReuseStrategy.instance?.evict(key);
  }

  static evictAll(): void {
    TabRouteReuseStrategy.instance?.evictAll();
  }

  /**
   * Determines if this route (and its subtree) should be detached to be reused later.
   */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (!this.isRouteCachable(route)) return false;
    return true;
  }

  /**
   * Stores the detached route handle.
   */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (!handle) return;

    const key = this.calcRouteKey(route);
    if (!key) {
      this.destroyHandle(handle);
      return;
    }

    // Evict any existing handle with the same key
    if (this.cache.has(key)) {
      this.evict(key);
    }

    // Evict oldest if exceeding capacity
    this.evictToCapacity();

    const now = Date.now();
    this.cache.set(key, {
      key,
      handle,
      createdAt: now,
      lastAccessedAt: now
    });

    this.notifyLifecycle(handle, 'onTabDetach');
  }

  /**
   * Determines if this route (and its subtree) should be reattached.
   */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = this.calcRouteKey(route);
    if (!key) return false;

    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (Date.now() - entry.createdAt > MAX_CACHE_AGE_MS) {
      this.evict(key);
      return false;
    }

    return true;
  }

  /**
   * Retrieves the previously stored route handle.
   */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const key = this.calcRouteKey(route);
    if (!key) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    entry.lastAccessedAt = Date.now();
    this.notifyLifecycle(entry.handle, 'onTabAttach');
    return entry.handle;
  }

  /**
   * Determines if a route should be reused.
   * For routes opting into tab caching, only reuses in-place if their canonical route keys match.
   * Otherwise detaches and attaches via the bounded cache.
   */
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.routeConfig !== curr.routeConfig) {
      return false;
    }

    if (this.isRouteCachable(curr) || this.isRouteCachable(future)) {
      return this.calcRouteKey(future) === this.calcRouteKey(curr);
    }

    return true;
  }

  /**
   * Evicts a single cached route handle and destroys its component.
   */
  evict(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    this.cache.delete(key);
    this.destroyHandle(entry.handle);
  }

  /**
   * Evicts all cached route handles except the specified keys.
   */
  evictExcept(keepKeys: Set<string>): void {
    for (const key of Array.from(this.cache.keys())) {
      if (!keepKeys.has(key)) {
        this.evict(key);
      }
    }
  }

  /**
   * Evicts all cached route handles and completely cleans memory.
   */
  evictAll(): void {
    for (const key of Array.from(this.cache.keys())) {
      this.evict(key);
    }
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private isRouteCachable(route: ActivatedRouteSnapshot): boolean {
    // Check if route or leaf explicitly opts in to caching
    const data = this.getMergedRouteData(route);
    const tabConfig = data['tab'] as Record<string, unknown> | undefined;

    // Default: false, unless explicitly opted in
    const cacheOptIn = tabConfig?.['cache'] === true || data['cacheTab'] === true;
    if (!cacheOptIn) return false;

    // Do not cache error routes or redirects
    if (!route.routeConfig || route.routeConfig.path === '**') return false;

    return true;
  }

  private calcRouteKey(route: ActivatedRouteSnapshot): string {
    const path = route.pathFromRoot
      .map(s => s.url.map(u => u.toString()).join('/'))
      .filter(Boolean)
      .join('/');

    const data = this.getMergedRouteData(route);
    const tabConfig = data['tab'] as Record<string, unknown> | undefined;
    if (tabConfig?.['queryPolicy'] === 'discriminate') {
      const q = Object.entries(route.queryParams || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      return q ? `/${path}?${q}` : `/${path}`;
    }

    return `/${path}`;
  }

  private getMergedRouteData(route: ActivatedRouteSnapshot): Record<string, unknown> {
    return route.pathFromRoot.reduce((acc, s) => ({ ...acc, ...s.data }), {});
  }

  private evictToCapacity(): void {
    while (this.cache.size >= this.maxCached) {
      const oldest = Array.from(this.cache.values())
        .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)[0];

      if (!oldest) break;
      this.evict(oldest.key);
    }
  }

  private destroyHandle(handle: DetachedRouteHandle): void {
    try {
      const componentRef = (handle as any)?.componentRef;
      if (componentRef && typeof componentRef.destroy === 'function' && !componentRef.destroyed) {
        componentRef.destroy();
      }

      const contexts = (handle as any)?.contexts;
      if (contexts && typeof contexts.forEach === 'function') {
        contexts.forEach((ctx: any) => {
          if (ctx?.outlet?.isActivated && ctx.outlet.componentRef) {
            ctx.outlet.componentRef.destroy?.();
          }
        });
      }
    } catch {
      // Ignore destruction errors
    }
  }

  private notifyLifecycle(handle: DetachedRouteHandle, hook: 'onTabAttach' | 'onTabDetach'): void {
    try {
      const instance = (handle as any)?.componentRef?.instance;
      if (instance && typeof instance[hook] === 'function') {
        instance[hook]();
      }
    } catch {
      // Ignore hook errors
    }
  }
}
