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

const MAX_CACHED_HANDLES = 24;
const MAX_CACHE_AGE_MS = 60 * 60 * 1000;

export class TabReuseStrategy implements RouteReuseStrategy {
  private static readonly instances = new Set<TabReuseStrategy>();

  static evictCached(key: string): void {
    for (const strategy of this.instances) {
      strategy.evict(key);
    }
  }

  static evictExceptCached(keys: Set<string>): void {
    for (const strategy of this.instances) {
      strategy.evictExcept(keys);
    }
  }

  static evictAllCached(): void {
    for (const strategy of this.instances) {
      strategy.evictAll();
    }
  }

  private readonly cache = new Map<string, CacheEntry>();

  constructor() {
    TabReuseStrategy.instances.add(this);
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (handle) this.destroyHandle(handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  evict(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;
    this.destroyHandle(entry.handle);
    this.cache.delete(key);
  }

  evictExcept(keys: Set<string>): void {
    for (const key of [...this.cache.keys()]) {
      if (!keys.has(key)) this.evict(key);
    }
  }

  evictAll(): void {
    for (const key of [...this.cache.keys()]) this.evict(key);
  }

  static buildKey(path: string, params: Record<string, string>): string {
    const query = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `${path}${query ? `?${query}` : ''}`;
  }

  private evictStaleEntries(): void {
    const now = Date.now();
    for (const [key, entry] of [...this.cache.entries()]) {
      if (now - entry.createdAt > MAX_CACHE_AGE_MS) this.evict(key);
    }

    while (this.cache.size > MAX_CACHED_HANDLES) {
      const oldest = [...this.cache.values()]
        .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)[0];
      if (!oldest) break;
      this.evict(oldest.key);
    }
  }

  private notifyReattached(handle: DetachedRouteHandle): void {
    const instance = (handle as any)?.componentRef?.instance;
    if (!instance) return;
    setTimeout(() => {
      if (typeof instance.onTabReattached === 'function') instance.onTabReattached();
      else if (typeof instance.onWorkspaceReattached === 'function') instance.onWorkspaceReattached();
    }, 0);
  }

  private destroyHandle(handle: DetachedRouteHandle): void {
    const componentRef = (handle as any)?.componentRef;
    if (componentRef && typeof componentRef.destroy === 'function' && !componentRef.destroyed) {
      componentRef.destroy();
    }
  }

  private shouldCache(route: ActivatedRouteSnapshot): boolean {
    const data = this.mergedData(route);
    if (data['disableTab'] === true || data['cacheTab'] === false || data['reuseTab'] === false) return false;
    return !!route.routeConfig && !route.firstChild && (!!route.component || !!route.routeConfig.loadComponent);
  }

  private reuseKey(route: ActivatedRouteSnapshot): string {
    const data = this.mergedData(route);
    const idMode = data['tabIdMode'] ?? (data['reuseTab'] === true ? 'routePattern' : 'fullUrl');
    const path = this.snapshotPath(route);
    const queryParams = this.stringifyRecord(route.queryParams);

    if (idMode === 'routePattern') return this.routePattern(route);
    if (idMode === 'path') return this.composeUrl(path, queryParams, route.fragment);
    return this.composeUrl(path, queryParams, route.fragment);
  }

  private mergedData(route: ActivatedRouteSnapshot): Record<string, unknown> {
    return route.pathFromRoot.reduce((acc, snapshot) => ({ ...acc, ...snapshot.data }), {});
  }

  private routePattern(route: ActivatedRouteSnapshot): string {
    const pattern = route.pathFromRoot
      .map(snapshot => snapshot.routeConfig?.path)
      .filter(Boolean)
      .join('/');
    return `/${pattern}`.replace(/\/+/g, '/');
  }

  private snapshotPath(route: ActivatedRouteSnapshot): string {
    const segments = route.pathFromRoot
      .flatMap(snapshot => snapshot.url)
      .map(segment => segment.toString())
      .filter(Boolean)
      .join('/');
    return `/${segments}`;
  }

  private stringifyRecord(record: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(Object.entries(record ?? {}).map(([key, value]) => [key, String(value)]));
  }

  private composeUrl(path: string, queryParams: Record<string, string>, fragment?: string | null): string {
    const query = Object.entries(queryParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `${path}${query ? `?${query}` : ''}${fragment ? `#${fragment}` : ''}`;
  }
}
