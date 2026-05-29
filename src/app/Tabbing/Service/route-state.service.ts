import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { RouteTabConfig, TabId, TabIdMode, TabMeta } from '../tab.types';

@Injectable({ providedIn: 'root' })
export class RouteStateService {
  private readonly router = inject(Router);

  createTabFromNavigation(event: NavigationEnd): TabMeta | null {
    const leaf = this.leafSnapshot(this.router.routerState.snapshot.root);
    const config = this.resolveTabConfig(leaf, event.urlAfterRedirects);
    if (!config.enabled) return null;

    const url = this.canonicalizeUrl(event.urlAfterRedirects);
    const path = this.pathFromUrl(url);
    const params = this.collectParams(leaf);
    const queryParams = this.stringifyRecord(leaf.queryParams);
    const routePattern = this.routePattern(leaf);
    const id = this.buildTabId(config.idMode, path, url, routePattern, queryParams, leaf.fragment);

    return {
      id,
      label: config.label,
      icon: config.icon,
      path,
      url,
      routePattern,
      params,
      queryParams,
      fragment: leaf.fragment,
      data: { ...leaf.data },
      openedAt: Date.now(),
      active: true,
      pinned: config.pinned,
      loading: false,
      dirty: false,
      cache: config.cache,
      lastAccessedAt: Date.now()
    };
  }

  buildTabId(
    idMode: TabIdMode,
    path: string,
    url: string,
    routePattern = path,
    queryParams: Record<string, string> = {},
    fragment?: string | null
  ): TabId {
    if (idMode === 'routePattern') return routePattern;
    if (idMode === 'path') return this.composeUrl(path, queryParams, fragment);
    return this.canonicalizeUrl(url);
  }

  canonicalizeUrl(url: string): string {
    return this.router.serializeUrl(this.router.parseUrl(url));
  }

  shouldCache(route: ActivatedRouteSnapshot): boolean {
    const data = this.mergedData(route);
    if (data['disableTab'] === true || data['cacheTab'] === false || data['reuseTab'] === false) return false;
    return this.isRoutableLeaf(route);
  }

  reuseKey(route: ActivatedRouteSnapshot): string {
    const path = this.snapshotPath(route);
    const data = this.mergedData(route);
    const idMode = (data['tabIdMode'] as TabIdMode | undefined) ?? (data['reuseTab'] === true ? 'routePattern' : 'fullUrl');
    const routePattern = this.routePattern(route);
    const queryParams = this.stringifyRecord(route.queryParams);
    return this.buildTabId(idMode, path, this.composeUrl(path, queryParams, route.fragment), routePattern, queryParams, route.fragment);
  }

  private resolveTabConfig(leaf: ActivatedRouteSnapshot, url: string): RouteTabConfig {
    const data = this.mergedData(leaf);
    const path = this.pathFromUrl(url);
    const label = data['tabLabel'] as string | undefined;
    const isExcluded =
      data['disableTab'] === true ||
      path === '/' ||
      path.startsWith('/auth') ||
      path.startsWith('/store/') ||
      path.startsWith('/apex-delivery') ||
      path.includes('/login') ||
      leaf.routeConfig?.path === '**';

    const enabled = !isExcluded && (this.isRoutableLeaf(leaf) || !!label);
    const idMode = (data['tabIdMode'] as TabIdMode | undefined) ?? (data['reuseTab'] === true ? 'routePattern' : 'fullUrl');

    return {
      enabled,
      idMode,
      label: label ?? this.titleFromPath(path),
      icon: (data['tabIcon'] as string | undefined) ?? 'pi pi-file',
      pinned: !!data['tabPinned'],
      cache: data['cacheTab'] !== false && data['reuseTab'] !== false,
      maxAgeMs: Number(data['tabMaxAgeMs'] ?? 0) || undefined
    };
  }

  private leafSnapshot(root: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let cursor = root;
    while (cursor.firstChild) cursor = cursor.firstChild;
    return cursor;
  }

  private mergedData(route: ActivatedRouteSnapshot): Record<string, unknown> {
    return route.pathFromRoot.reduce((acc, snapshot) => ({ ...acc, ...snapshot.data }), {});
  }

  private collectParams(route: ActivatedRouteSnapshot): Record<string, string> {
    return route.pathFromRoot.reduce((acc, snapshot) => ({ ...acc, ...this.stringifyRecord(snapshot.params) }), {});
  }

  private stringifyRecord(record: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(Object.entries(record ?? {}).map(([key, value]) => [key, String(value)]));
  }

  private isRoutableLeaf(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig && !route.firstChild && (!!route.component || !!route.routeConfig.loadComponent);
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

  private pathFromUrl(url: string): string {
    const tree = this.router.parseUrl(url);
    const segments = tree.root.children['primary']?.segments.map(segment => segment.toString()).join('/') ?? '';
    return `/${segments}`;
  }

  private composeUrl(path: string, queryParams: Record<string, string>, fragment?: string | null): string {
    const query = Object.entries(queryParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `${path}${query ? `?${query}` : ''}${fragment ? `#${fragment}` : ''}`;
  }

  private titleFromPath(path: string): string {
    const last = path.split('/').filter(Boolean).at(-1)?.split(';')[0] ?? 'Workspace';
    return last
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
