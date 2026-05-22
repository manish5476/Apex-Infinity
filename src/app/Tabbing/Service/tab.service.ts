import { Injectable, computed, effect, inject, signal, OnDestroy } from '@angular/core';
import { Router, NavigationExtras, NavigationEnd } from '@angular/router'; // 👈 Added NavigationEnd
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators'; // 👈 Added filter
import { TabId, TabMeta, TabState, OpenTabOptions } from '../tab.types';

const STORAGE_KEY = 'apex__tab_state';
const MAX_TABS = 20;

@Injectable({ providedIn: 'root' })
export class TabService implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly _state = signal<TabState>(this._loadPersistedState());

  // ── Selectors ────────────────────────────────────────────────────────────────
  readonly state = this._state.asReadonly();
  readonly tabs = computed(() => this._state().tabs);
  readonly activeTab = computed(() =>
    this._state().tabs.find(t => t.id === this._state().activeTabId) ?? null
  );
  readonly tabCount = computed(() => this._state().tabs.length);

  // ── RxJS mirrors ─────────────────────────────────────────────────────────────
  readonly tabs$: Observable<TabMeta[]> = toObservable(this.tabs);
  readonly activeTab$: Observable<TabMeta | null> = toObservable(this.activeTab);
  readonly activeTabId$: Observable<TabId | null> =
    toObservable(computed(() => this._state().activeTabId));

  constructor() {
    effect(() => {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this._state())); }
      catch { /* storage full / private mode */ }
    });

    // Clean, standard RxJS implementation
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntil(this.destroy$)
    ).subscribe((e: NavigationEnd) => {
      this.handleNavigationEnd(e);
    });
  }

  private handleNavigationEnd(e: NavigationEnd): void {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.snapshot.data || {};
    const routeConfig = route.snapshot.routeConfig;

    const hasTarget = !!route.component ||
      !!routeConfig?.loadComponent ||
      !!routeConfig?.loadChildren ||
      !!data['tabLabel'];

    const fullUrl = e.urlAfterRedirects.split('?')[0];

    // Get exact queryParams from the snapshot
    const rawQueryParams = route.snapshot.queryParams;
    const qp: Record<string, string> = {};
    for (const key of Object.keys(rawQueryParams)) {
      qp[key] = String(rawQueryParams[key]);
    }

    const lowUrl = fullUrl.toLowerCase();
    const componentName = (routeConfig?.component as any)?.name || '';
    
    const isAuth = lowUrl.includes('login') || lowUrl.includes('signup') || lowUrl.includes('auth') || lowUrl.includes('password') || lowUrl.includes('verification') || componentName.includes('Login');
    const isError = lowUrl.includes('error') || lowUrl.includes('unauthorized') || lowUrl.includes('notfound') || routeConfig?.path === '**' || componentName.includes('NotFound') || componentName.includes('Unauthorized');

    if (!hasTarget || isAuth || isError || fullUrl === '/' || data['disableTab'] === true) {
      this.syncFromRouter(fullUrl, qp);
      return;
    }

    let label = (data['tabLabel'] as string | undefined);
    if (!label) {
      const segments = fullUrl.split('/').filter(Boolean);
      let lastSegment = segments.pop() || 'Home';
      // Strip matrix parameters (;) or encoded matrix parameters (%3b)
      lastSegment = lastSegment.split(';')[0].split('%3b')[0];
      
      label = lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    const options: Pick<OpenTabOptions, 'icon' | 'pinned' | 'data'> = {
      icon: (data['tabIcon'] as string) || 'pi pi-file',
      pinned: !!data['tabPinned'],
      data: data
    };

    this.registerTab(fullUrl, label, qp, options);
  }

  /**
   * Open or activate a tab, then navigate.
   * If a tab with the same id exists → activates it (no duplicate).
   */
  openTab(
    path: string,
    label: string,
    options: OpenTabOptions = {},
    navigationExtras: NavigationExtras = {}
  ): void {
    const params = (navigationExtras.queryParams as Record<string, string>) ?? {};
    const id = this.buildTabId(path, params);
    const existing = this._findById(id);

    if (existing && !options.replace) {
      if (options.data) this._patchTab(id, { data: { ...existing.data, ...options.data } });
      this._activate(id);
      this.router.navigate([path], navigationExtras);
      return;
    }

    this._evictOldestIfFull();

    const tab: TabMeta = {
      id,
      label: options.label ?? label,
      icon: options.icon,
      path,
      params: {},
      queryParams: params,
      data: options.data ?? {},
      openedAt: Date.now(),
      active: false,
      pinned: options.pinned ?? false,
      loading: true,
      count: undefined
    };

    this._state.update(s => ({
      tabs: [...s.tabs.map(t => ({ ...t, active: false })), tab],
      activeTabId: id,
    }));

    this.router.navigate([path], navigationExtras).then(() => {
      this._patchTab(id, { active: true, loading: false });
    });
  }

  openNewTab?: () => void;

  registerTab(path: string, label: string, queryParams: Record<string, string>, options: Pick<OpenTabOptions, 'icon' | 'pinned' | 'data'> = {}
  ): void {
    const id = this.buildTabId(path, queryParams);
    const existing = this._findById(id);

    if (existing) {
      const patch: Partial<TabMeta> = {};
      if (label && label !== existing.label && !label.toLowerCase().includes('notes')) {
        patch.label = label;
      }
      if (options.icon && options.icon !== existing.icon) patch.icon = options.icon;
      if (options.data) patch.data = { ...existing.data, ...options.data };

      if (Object.keys(patch).length > 0) this._patchTab(id, patch);

      this._activate(id);
      return;
    }

    this._evictOldestIfFull();

    const tab: TabMeta = {
      id,
      label,
      icon: options.icon,
      path,
      params: {},
      queryParams,
      data: options.data ?? {},
      openedAt: Date.now(),
      active: true,
      pinned: options.pinned ?? false,
      loading: false,
      count: undefined
    };

    this._state.update(s => ({
      tabs: [...s.tabs.map(t => ({ ...t, active: false })), tab],
      activeTabId: id,
    }));
  }

  /** Activate an existing tab by id and navigate to its route */
  activateTab(id: TabId): void {
    const tab = this._findById(id);
    if (!tab) return;
    this._activate(id);
    this.router.navigate([tab.path], { queryParams: tab.queryParams });
  }

  /** FIX #2 — Keyboard: cycle to next tab (wraps) */
  activateNext(): void {
    const { tabs, activeTabId } = this._state();
    if (tabs.length < 2) return;
    const idx = tabs.findIndex(t => t.id === activeTabId);
    const next = tabs[(idx + 1) % tabs.length];
    this.activateTab(next.id);
  }

  /** FIX #2 — Keyboard: cycle to previous tab (wraps) */
  activatePrev(): void {
    const { tabs, activeTabId } = this._state();
    if (tabs.length < 2) return;
    const idx = tabs.findIndex(t => t.id === activeTabId);
    const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
    this.activateTab(prev.id);
  }

  /** Close a tab; activates nearest neighbour if it was active */
  closeTab(id: TabId): void {
    const tab = this._findById(id);
    if (!tab || tab.pinned) return;

    const s = this._state();
    const idx = s.tabs.findIndex(t => t.id === id);
    const wasActive = s.activeTabId === id;
    const remaining = s.tabs.filter(t => t.id !== id);

    let nextId: TabId | null = s.activeTabId;

    if (wasActive && remaining.length > 0) {
      const candidate = remaining[Math.min(idx, remaining.length - 1)];
      nextId = candidate.id;
      this.router.navigate([candidate.path], { queryParams: candidate.queryParams });
    } else if (remaining.length === 0) {
      nextId = null;
      this.router.navigate(['/']);
    }

    this._state.set({
      tabs: remaining.map(t => ({ ...t, active: t.id === nextId })),
      activeTabId: nextId,
    });
  }

  /** FIX #2 — Keyboard Ctrl+W: close the currently active tab */
  closeActiveTab(): void {
    const id = this._state().activeTabId;
    if (id) this.closeTab(id);
  }

  closeOtherTabs(exceptId?: TabId): void {
    const id = exceptId ?? this._state().activeTabId;
    this._state.update(s => ({
      tabs: s.tabs.filter(t => t.pinned || t.id === id).map(t => ({ ...t, active: t.id === id })),
      activeTabId: id,
    }));
  }

  closeTabsToRight(fromId: TabId): void {
    const s = this._state();
    const idx = s.tabs.findIndex(t => t.id === fromId);
    if (idx === -1) return;
    const keep = s.tabs.filter((_, i) => i <= idx || s.tabs[i].pinned);
    const activeStillHere = keep.some(t => t.id === s.activeTabId);
    const newActiveId = activeStillHere ? s.activeTabId : (keep[keep.length - 1]?.id ?? null);
    this._state.set({
      tabs: keep.map(t => ({ ...t, active: t.id === newActiveId })),
      activeTabId: newActiveId,
    });
  }

  closeAllTabs(): void {
    const pinned = this._state().tabs.filter(t => t.pinned);
    const newActive = pinned[pinned.length - 1]?.id ?? null;
    this._state.set({
      tabs: pinned.map(t => ({ ...t, active: t.id === newActive })),
      activeTabId: newActive,
    });
    const tab = pinned.find(t => t.id === newActive);
    this.router.navigate(tab ? [tab.path] : ['/']);
  }

  /**
   * Update the currently active tab's metadata
   */
  updateActiveTab(options: Partial<Omit<TabMeta, 'id' | 'path'>>): void {
    const activeId = this._state().activeTabId;
    if (activeId) {
      this.updateTab(activeId, options);
    }
  }

  /**
   * Update a specific tab's metadata
   */
  updateTab(id: TabId, options: Partial<Omit<TabMeta, 'id' | 'path'>>): void {
    this._patchTab(id, options);
  }

  togglePin(id: TabId): void {
    this._patchTab(id, { pinned: !this._findById(id)?.pinned });
  }

  moveTab(fromIndex: number, toIndex: number): void {
    const tabs = [...this._state().tabs];
    const [moved] = tabs.splice(fromIndex, 1);
    tabs.splice(toIndex, 0, moved);
    this._state.update(s => ({ ...s, tabs }));
  }

  isActive(id: TabId): boolean {
    return this._state().activeTabId === id;
  }

  syncFromRouter(path: string, queryParams: Record<string, string> = {}): void {
    const id = this.buildTabId(path, queryParams);
    if (!this._findById(id)) return;
    this._activate(id);
  }

  /**
   * Reset all tabs (useful for logout)
   */
  reset(): void {
    this._state.set({ tabs: [], activeTabId: null });
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  /**
   * Build a deterministic tab id from path + sorted query params.
   * Exposed so TabRouterGuard can compute the same key without internal access.
   */
  buildTabId(path: string, params: Record<string, string>): TabId {
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
    const suffix = sorted.length ? '?' + sorted.map(([k, v]) => `${k}=${v}`).join('&') : '';
    return `${path}${suffix}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private _findById(id: TabId): TabMeta | undefined {
    return this._state().tabs.find(t => t.id === id);
  }

  private _activate(id: TabId): void {
    this._state.update(s => ({
      tabs: s.tabs.map(t => ({ ...t, active: t.id === id })),
      activeTabId: id,
    }));
  }

  private _patchTab(id: TabId, patch: Partial<TabMeta>): void {
    this._state.update(s => ({
      ...s,
      tabs: s.tabs.map(t => t.id === id ? { ...t, ...patch } : t),
    }));
  }

  private _evictOldestIfFull(): void {
    if (this.tabs().length < MAX_TABS) return;
    const oldest = [...this.tabs()]
      .filter(t => !t.pinned && !t.active)
      .sort((a, b) => a.openedAt - b.openedAt)[0];
    if (oldest) this._state.update(s => ({ ...s, tabs: s.tabs.filter(t => t.id !== oldest.id) }));
  }

  private _loadPersistedState(): TabState {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TabState;
        return { ...parsed, tabs: parsed.tabs.map(t => ({ ...t, active: false, loading: false })) };
      }
    } catch { /* corrupted */ }
    return { tabs: [], activeTabId: null };
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}