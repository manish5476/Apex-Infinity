import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TabMeta, TabState } from '../tab.types';

const STORAGE_KEY = 'apex__tab_state_v2';
const LEGACY_STORAGE_KEY = 'apex__tab_state';
const STATE_VERSION = 2;
const MAX_RECENTLY_CLOSED = 10;

@Injectable({ providedIn: 'root' })
export class TabPersistenceService {
  private readonly platformId = inject(PLATFORM_ID);

  load(): TabState {
    if (!isPlatformBrowser(this.platformId)) return this.empty();

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return this.empty();

      const parsed = JSON.parse(raw) as TabState;
      const tabs = Array.isArray(parsed.tabs) ? parsed.tabs : [];
      const activeTabId = tabs.some(tab => tab.id === parsed.activeTabId)
        ? parsed.activeTabId
        : tabs.at(-1)?.id ?? null;

      return {
        version: STATE_VERSION,
        tabs: tabs.map(tab => this.normalizeTab(tab)),
        activeTabId,
        recentlyClosed: (parsed.recentlyClosed ?? []).slice(0, MAX_RECENTLY_CLOSED).map(tab => this.normalizeTab(tab))
      };
    } catch {
      this.clear();
      return this.empty();
    }
  }

  save(state: TabState): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const persistable: TabState = {
      version: STATE_VERSION,
      activeTabId: state.activeTabId,
      tabs: state.tabs.map(tab => ({ ...tab, active: false, loading: false })),
      recentlyClosed: (state.recentlyClosed ?? []).slice(0, MAX_RECENTLY_CLOSED)
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Private mode or quota pressure should not break navigation.
    }
  }

  clear(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  private empty(): TabState {
    return { version: STATE_VERSION, tabs: [], activeTabId: null, recentlyClosed: [] };
  }

  private normalizeTab(tab: Partial<TabMeta>): TabMeta {
    const path = tab.path || this.pathFromUrl(tab.url || '/');
    const url = tab.url || this.composeUrl(path, tab.queryParams ?? {}, tab.fragment);

    return {
      id: tab.id || url,
      label: tab.label || 'Untitled',
      icon: tab.icon,
      path,
      url,
      routePattern: tab.routePattern,
      params: tab.params ?? {},
      queryParams: tab.queryParams ?? {},
      fragment: tab.fragment ?? null,
      data: tab.data ?? {},
      openedAt: tab.openedAt ?? Date.now(),
      active: false,
      pinned: !!tab.pinned,
      loading: false,
      dirty: !!tab.dirty,
      cache: tab.cache !== false,
      count: tab.count,
      lastAccessedAt: tab.lastAccessedAt ?? tab.openedAt ?? Date.now(),
      scrollPosition: tab.scrollPosition
    };
  }

  private pathFromUrl(url: string): string {
    return '/' + String(url).replace(/^\//, '').split(/[?#]/)[0];
  }

  private composeUrl(path: string, queryParams: Record<string, string>, fragment?: string | null): string {
    const query = Object.entries(queryParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `${path}${query ? `?${query}` : ''}${fragment ? `#${fragment}` : ''}`;
  }
}
