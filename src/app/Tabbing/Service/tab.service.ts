import { Injectable, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  Event,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationExtras,
  NavigationStart,
  Router
} from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { OpenTabOptions, TabId, TabMeta, TabState } from '../tab.types';
import { RouteStateService } from './route-state.service';
import { TabPersistenceService } from './tab-persistence.service';
import { TabReuseStrategy } from '../tab-reuse.strategy';

const MAX_TABS = 24;
const MAX_RECENTLY_CLOSED = 10;

@Injectable({ providedIn: 'root' })
export class TabService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly routeState = inject(RouteStateService);
  private readonly persistence = inject(TabPersistenceService);

  private readonly _state = signal<TabState>(this.hydrateInitialState());
  private pendingNavigationUrl: string | null = null;
  private suppressNextRouterSync = false;

  readonly state = this._state.asReadonly();
  readonly tabs = computed(() => this._state().tabs);
  readonly activeTab = computed(() =>
    this._state().tabs.find(tab => tab.id === this._state().activeTabId) ?? null
  );
  readonly tabCount = computed(() => this._state().tabs.length);
  readonly recentlyClosed = computed(() => this._state().recentlyClosed ?? []);

  readonly tabs$: Observable<TabMeta[]> = toObservable(this.tabs);
  readonly activeTab$: Observable<TabMeta | null> = toObservable(this.activeTab);
  readonly activeTabId$: Observable<TabId | null> = toObservable(computed(() => this._state().activeTabId));

  openNewTab?: () => void;

  constructor() {
    effect(() => this.persistence.save(this._state()));

    this.router.events.pipe(
      filter((event): event is NavigationStart | NavigationEnd | NavigationCancel | NavigationError =>
        event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ),
      takeUntil(this.destroy$)
    ).subscribe(event => this.handleRouterEvent(event));
  }

  openTab(
    path: string,
    label: string,
    options: OpenTabOptions = {},
    navigationExtras: NavigationExtras = {}
  ): void {
    const url = options.url ?? this.router.serializeUrl(this.router.createUrlTree([path], navigationExtras));
    const queryParams = this.stringifyRecord((navigationExtras.queryParams ?? {}) as Record<string, unknown>);
    const id = options.id ?? this.routeState.buildTabId('fullUrl', path, url, path, queryParams, navigationExtras.fragment);
    const existing = this.findById(id);

    if (existing && !options.replace) {
      this.activateTab(id);
      return;
    }

    const now = Date.now();
    const tab: TabMeta = {
      id,
      label: options.label ?? label,
      icon: options.icon,
      path,
      url,
      routePattern: path,
      params: {},
      queryParams,
      fragment: navigationExtras.fragment ?? null,
      data: options.data ?? {},
      openedAt: now,
      active: true,
      pinned: options.pinned ?? false,
      loading: true,
      dirty: options.dirty ?? false,
      cache: options.cache !== false,
      lastAccessedAt: now
    };

    this.upsertTab(tab, { replace: options.replace });
    this.navigateByUrl(url);
  }

  registerTab(
    path: string,
    label: string,
    queryParams: Record<string, string>,
    options: Pick<OpenTabOptions, 'icon' | 'pinned' | 'data' | 'cache'> = {}
  ): void {
    const url = this.composeUrl(path, queryParams);
    const now = Date.now();
    this.upsertTab({
      id: this.routeState.buildTabId('fullUrl', path, url, path, queryParams),
      label,
      icon: options.icon,
      path,
      url,
      routePattern: path,
      params: {},
      queryParams,
      fragment: null,
      data: options.data ?? {},
      openedAt: now,
      active: true,
      pinned: options.pinned ?? false,
      loading: false,
      dirty: false,
      cache: options.cache !== false,
      lastAccessedAt: now
    });
  }

  activateTab(id: TabId): void {
    const tab = this.findById(id);
    if (!tab) return;
    this.activateLocal(id);
    this.navigateByUrl(tab.url);
  }

  activateNext(): void {
    const { tabs, activeTabId } = this._state();
    if (tabs.length < 2) return;
    const currentIndex = Math.max(0, tabs.findIndex(tab => tab.id === activeTabId));
    this.activateTab(tabs[(currentIndex + 1) % tabs.length].id);
  }

  activatePrev(): void {
    const { tabs, activeTabId } = this._state();
    if (tabs.length < 2) return;
    const currentIndex = Math.max(0, tabs.findIndex(tab => tab.id === activeTabId));
    this.activateTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length].id);
  }

  closeTab(id: TabId): void {
    const state = this._state();
    const tab = state.tabs.find(item => item.id === id);
    if (!tab || tab.pinned) return;
    if (tab.dirty && !this.confirmClose(tab)) return;

    const index = state.tabs.findIndex(item => item.id === id);
    const remaining = state.tabs.filter(item => item.id !== id);
    const recentlyClosed = [tab, ...(state.recentlyClosed ?? [])].slice(0, MAX_RECENTLY_CLOSED);
    this.evictTab(tab);

    let activeTabId = state.activeTabId;
    if (state.activeTabId === id) {
      activeTabId = remaining[Math.min(index, remaining.length - 1)]?.id ?? null;
    }

    this._state.set({
      ...state,
      tabs: remaining.map(item => ({ ...item, active: item.id === activeTabId })),
      activeTabId,
      recentlyClosed
    });

    const next = remaining.find(item => item.id === activeTabId);
    this.navigateByUrl(next?.url ?? '/create-dashboard');
  }

  closeActiveTab(): void {
    const id = this._state().activeTabId;
    if (id) this.closeTab(id);
  }

  closeOtherTabs(exceptId?: TabId): void {
    const state = this._state();
    const activeId = exceptId ?? state.activeTabId;
    if (!activeId) return;

    const closing = state.tabs.filter(tab => !tab.pinned && tab.id !== activeId);
    if (closing.some(tab => tab.dirty) && !this.confirmCloseMany(closing)) return;
    closing.forEach(tab => this.evictTab(tab));

    const keep = state.tabs.filter(tab => tab.pinned || tab.id === activeId);
    const recentlyClosed = [...closing, ...(state.recentlyClosed ?? [])].slice(0, MAX_RECENTLY_CLOSED);
    this._state.set({
      ...state,
      tabs: keep.map(tab => ({ ...tab, active: tab.id === activeId })),
      activeTabId: activeId,
      recentlyClosed
    });
  }

  closeTabsToRight(fromId: TabId): void {
    const state = this._state();
    const index = state.tabs.findIndex(tab => tab.id === fromId);
    if (index < 0) return;

    const closing = state.tabs.filter((tab, tabIndex) => tabIndex > index && !tab.pinned);
    if (closing.some(tab => tab.dirty) && !this.confirmCloseMany(closing)) return;
    closing.forEach(tab => this.evictTab(tab));

    const keep = state.tabs.filter((tab, tabIndex) => tabIndex <= index || tab.pinned);
    const activeStillOpen = keep.some(tab => tab.id === state.activeTabId);
    const activeTabId = activeStillOpen ? state.activeTabId : keep.at(-1)?.id ?? null;

    this._state.set({
      ...state,
      tabs: keep.map(tab => ({ ...tab, active: tab.id === activeTabId })),
      activeTabId,
      recentlyClosed: [...closing, ...(state.recentlyClosed ?? [])].slice(0, MAX_RECENTLY_CLOSED)
    });

    const next = keep.find(tab => tab.id === activeTabId);
    if (next) this.navigateByUrl(next.url);
  }

  closeAllTabs(): void {
    const state = this._state();
    const closing = state.tabs.filter(tab => !tab.pinned);
    if (closing.some(tab => tab.dirty) && !this.confirmCloseMany(closing)) return;
    closing.forEach(tab => this.evictTab(tab));

    const pinned = state.tabs.filter(tab => tab.pinned);
    const activeTabId = pinned.at(-1)?.id ?? null;
    this._state.set({
      ...state,
      tabs: pinned.map(tab => ({ ...tab, active: tab.id === activeTabId })),
      activeTabId,
      recentlyClosed: [...closing, ...(state.recentlyClosed ?? [])].slice(0, MAX_RECENTLY_CLOSED)
    });

    this.navigateByUrl(pinned.find(tab => tab.id === activeTabId)?.url ?? '/create-dashboard');
  }

  reopenClosedTab(): void {
    const [tab, ...rest] = this._state().recentlyClosed ?? [];
    if (!tab) return;
    this._state.update(state => ({ ...state, recentlyClosed: rest }));
    this.upsertTab({ ...tab, active: true, loading: false, lastAccessedAt: Date.now() }, { replace: true });
    this.navigateByUrl(tab.url);
  }

  updateActiveTab(options: Partial<Omit<TabMeta, 'id' | 'path'>>): void {
    const activeId = this._state().activeTabId;
    if (activeId) this.updateTab(activeId, options);
  }

  updateTab(id: TabId, options: Partial<Omit<TabMeta, 'id' | 'path'>>): void {
    this.patchTab(id, options);
  }

  setDirty(id: TabId, dirty = true): void {
    this.patchTab(id, { dirty });
  }

  togglePin(id: TabId): void {
    const tab = this.findById(id);
    if (tab) this.patchTab(id, { pinned: !tab.pinned });
  }

  moveTab(fromIndex: number, toIndex: number): void {
    this._state.update(state => {
      const tabs = [...state.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      if (!moved) return state;
      tabs.splice(toIndex, 0, moved);
      return { ...state, tabs };
    });
  }

  isActive(id: TabId): boolean {
    return this._state().activeTabId === id;
  }

  syncFromRouter(path: string, queryParams: Record<string, string> = {}): void {
    const url = this.composeUrl(path, queryParams);
    const tab = this._state().tabs.find(item => item.url === url || item.id === url);
    if (tab) this.activateLocal(tab.id);
  }

  reset(): void {
    this._state().tabs.forEach(tab => this.evictTab(tab));
    TabReuseStrategy.evictAllCached();
    this._state.set({ tabs: [], activeTabId: null, recentlyClosed: [], version: 2 });
    this.persistence.clear();
  }

  buildTabId(path: string, params: Record<string, string>): TabId {
    return this.routeState.buildTabId('fullUrl', path, this.composeUrl(path, params), path, params);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleRouterEvent(event: Event): void {
    if (event instanceof NavigationStart) {
      this.pendingNavigationUrl = event.url;
      this.markActiveLoading(true);
      this.captureActiveScrollPosition();
      return;
    }

    if (event instanceof NavigationCancel || event instanceof NavigationError) {
      this.pendingNavigationUrl = null;
      this.markActiveLoading(false);
      return;
    }

    if (event instanceof NavigationEnd) {
      this.pendingNavigationUrl = null;
      this.markActiveLoading(false);
      if (this.suppressNextRouterSync) {
        this.suppressNextRouterSync = false;
      }
      const tab = this.routeState.createTabFromNavigation(event);
      if (tab) this.upsertTab(tab);
      this.restoreActiveScrollPosition();
    }
  }

  private upsertTab(tab: TabMeta, options: { replace?: boolean } = {}): void {
    this._state.update(state => {
      const existing = state.tabs.find(item => item.id === tab.id);
      let tabs = existing && !options.replace
        ? state.tabs.map(item => item.id === tab.id ? this.mergeTab(item, tab) : item)
        : [...state.tabs.filter(item => item.id !== tab.id), tab];

      tabs = this.enforceMaxTabs(tabs, tab.id);
      return {
        ...state,
        tabs: tabs.map(item => ({ ...item, active: item.id === tab.id, loading: item.id === tab.id ? tab.loading : false })),
        activeTabId: tab.id
      };
    });
    this.syncReuseCacheWithTabs();
  }

  private mergeTab(existing: TabMeta, incoming: TabMeta): TabMeta {
    return {
      ...existing,
      ...incoming,
      openedAt: existing.openedAt,
      pinned: existing.pinned || incoming.pinned,
      dirty: existing.dirty,
      data: { ...(existing.data ?? {}), ...(incoming.data ?? {}) },
      lastAccessedAt: Date.now()
    };
  }

  private activateLocal(id: TabId): void {
    this._state.update(state => ({
      ...state,
      tabs: state.tabs.map(tab => ({
        ...tab,
        active: tab.id === id,
        loading: tab.id === id && this.pendingNavigationUrl !== null,
        lastAccessedAt: tab.id === id ? Date.now() : tab.lastAccessedAt
      })),
      activeTabId: id
    }));
  }

  private patchTab(id: TabId, patch: Partial<TabMeta>): void {
    this._state.update(state => ({
      ...state,
      tabs: state.tabs.map(tab => tab.id === id ? { ...tab, ...patch } : tab)
    }));
  }

  private markActiveLoading(loading: boolean): void {
    const activeId = this._state().activeTabId;
    if (!activeId) return;
    this.patchTab(activeId, { loading });
  }

  private navigateByUrl(url: string): void {
    if (this.router.url === url) return;
    this.suppressNextRouterSync = true;
    void this.router.navigateByUrl(url);
  }

  private findById(id: TabId): TabMeta | undefined {
    return this._state().tabs.find(tab => tab.id === id);
  }

  private enforceMaxTabs(tabs: TabMeta[], activeId: TabId): TabMeta[] {
    let next = [...tabs];
    while (next.length > MAX_TABS) {
      const evictable = next
        .filter(tab => !tab.pinned && tab.id !== activeId && !tab.dirty)
        .sort((a, b) => (a.lastAccessedAt ?? a.openedAt) - (b.lastAccessedAt ?? b.openedAt))[0];
      if (!evictable) break;
      this.evictTab(evictable);
      next = next.filter(tab => tab.id !== evictable.id);
    }
    return next;
  }

  private evictTab(tab: TabMeta): void {
    TabReuseStrategy.evictCached(tab.id);
  }

  private syncReuseCacheWithTabs(): void {
    TabReuseStrategy.evictExceptCached(new Set(this._state().tabs.filter(tab => tab.cache !== false).map(tab => tab.id)));
  }

  private captureActiveScrollPosition(): void {
    const activeId = this._state().activeTabId;
    if (!activeId || typeof window === 'undefined') return;
    this.patchTab(activeId, { scrollPosition: { x: window.scrollX, y: window.scrollY } });
  }

  private restoreActiveScrollPosition(): void {
    const tab = this.activeTab();
    if (!tab?.scrollPosition || typeof window === 'undefined') return;
    setTimeout(() => window.scrollTo(tab.scrollPosition?.x ?? 0, tab.scrollPosition?.y ?? 0), 0);
  }

  private confirmClose(tab: TabMeta): boolean {
    if (typeof window === 'undefined') return true;
    return window.confirm(`"${tab.label}" has unsaved changes. Close it anyway?`);
  }

  private confirmCloseMany(tabs: TabMeta[]): boolean {
    if (typeof window === 'undefined') return true;
    return window.confirm(`${tabs.length} tabs have unsaved changes. Close them anyway?`);
  }

  private hydrateInitialState(): TabState {
    const state = this.persistence.load();
    return {
      ...state,
      tabs: state.tabs.map(tab => ({ ...tab, active: tab.id === state.activeTabId, loading: false }))
    };
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
