// ─────────────────────────────────────────────────────────────────────────────
// tab-reuse.strategy.ts  –  Cache component trees keyed by route + params
// ─────────────────────────────────────────────────────────────────────────────
//
// Drop-in RouteReuseStrategy that stores a detached component tree for every
// unique tab (path + query params).  Attach/detach happens in O(1) via a Map.
//
// Registration (app.config.ts):
//   { provide: RouteReuseStrategy, useClass: TabReuseStrategy }
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
} from '@angular/router';

export class TabReuseStrategy implements RouteReuseStrategy {

  /** Map of route-key → detached handle */
  private readonly cache = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Do not cache parent routes or routes without components
    if (!route.routeConfig || !route.routeConfig.component) return false;
    if (route.firstChild) return false;

    // Only cache leaf routes that belong to tabs (opt-out available via route data)
    return route.data?.['reuseTab'] !== false;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const key = this._key(route);
    if (handle) {
      this.cache.set(key, handle);
    } else {
      this.cache.delete(key);
    }
  }

  // ── Decide whether to reattach a stored route ───────────────────────────────
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (!route.routeConfig || !route.routeConfig.component) return false;
    if (route.firstChild) return false;

    return this.cache.has(this._key(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.cache.get(this._key(route)) ?? null;
  }

  // ── Decide whether to reuse the same component instance ────────────────────
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    // Reuse when navigating within the same route config node
    return future.routeConfig === curr.routeConfig;
  }

  // ── Public helpers (called by TabService when closing tabs) ─────────────────

  /** Evict a cached handle by route key so it can be GC'd */
  evict(key: string): void {
    this.cache.delete(key);
  }

  evictAll(): void {
    this.cache.clear();
  }

  /** Build the same key TabService uses so callers can cross-reference */
  static buildKey(path: string, params: Record<string, string>): string {
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
    const suffix = sorted.length ? '?' + sorted.map(([k, v]) => `${k}=${v}`).join('&') : '';
    return `${path}${suffix}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  private _key(route: ActivatedRouteSnapshot): string {
    const segments = route.pathFromRoot
      .flatMap(r => r.url)
      .map(s => s.toString())
      .filter(Boolean);

    const path = '/' + segments.join('/');
    const qp = route.queryParams as Record<string, string>;

    return TabReuseStrategy.buildKey(path, qp);
  }
}
