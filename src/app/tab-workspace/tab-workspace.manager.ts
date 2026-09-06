// src/app/tab-workspace/tab-workspace.manager.ts

import { isPlatformBrowser } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router
} from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  computeTabId,
  extractBasePath,
  normalizeUrl,
  stringifyRecord,
  titleFromPath
} from './tab-identity.util';
import { TabRouteReuseStrategy } from './tab-route-reuse.strategy';
import { TabWorkspacePersistenceService } from './tab-workspace-persistence.service';
import { TabWorkspaceStateStore } from './tab-workspace.state';
import {
  AppTab,
  AppTabId,
  RouteTabConfig,
  TabDirtyStateProvider,
  TabWorkspaceEvent,
  TabWorkspaceEventType
} from './tab-workspace.types';

@Injectable({ providedIn: 'root' })
export class TabWorkspaceManager implements OnDestroy {
  private readonly router = inject(Router);
  private readonly store = inject(TabWorkspaceStateStore);
  private readonly persistence = inject(TabWorkspacePersistenceService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly destroy$ = new Subject<void>();
  private readonly events$ = new Subject<TabWorkspaceEvent>();

  private activeDirtyProvider: TabDirtyStateProvider | null = null;
  private pendingTabId: AppTabId | null = null;
  private currentTenantKey: string | null = null;
  private isInitialized = false;

  // ── Delegated Readonly Signals ────────────────────────────────────────────
  readonly tabs = this.store.tabs;
  readonly activeTab = this.store.activeTab;
  readonly activeTabId = this.store.activeTabId;
  readonly tabCount = this.store.tabCount;
  readonly hasTabs = this.store.hasTabs;
  readonly pinnedTabs = this.store.pinnedTabs;
  readonly unpinnedTabs = this.store.unpinnedTabs;
  readonly recentlyClosed = this.store.recentlyClosed;
  readonly workspaceEvents$ = this.events$.asObservable();

  constructor() {
    this.initRouterIntegration();
    this.initTenantWatch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.events$.complete();
  }

  // ── Dirty State Provider Registration ─────────────────────────────────────

  registerDirtyProvider(provider: TabDirtyStateProvider): () => void {
    this.activeDirtyProvider = provider;
    return () => {
      if (this.activeDirtyProvider === provider) {
        this.activeDirtyProvider = null;
      }
    };
  }

  // ── Public Workspace Operations ───────────────────────────────────────────

  /**
   * Navigates to a tab by ID or URL
   */
  async navigateToTab(id: AppTabId): Promise<boolean> {
    const tab = this.store.tabs().find(t => t.id === id);
    if (!tab) return false;

    if (this.store.activeTabId() === id && this.router.url === tab.url) {
      return true;
    }

    this.pendingTabId = id;
    this.store.activateTab(id);

    try {
      const success = await this.router.navigateByUrl(tab.url);
      if (!success) {
        this.pendingTabId = null;
      }
      return success;
    } catch {
      this.pendingTabId = null;
      return false;
    }
  }

  /**
   * Opens an arbitrary route into the tab workspace
   */
  async openRoute(
    url: string | string[],
    options: {
      title?: string;
      icon?: string;
      pinned?: boolean;
      replace?: boolean;
    } = {}
  ): Promise<boolean> {
    const targetUrl = Array.isArray(url) ? url.join('/') : url;
    const normalized = normalizeUrl(targetUrl);

    // Navigate router — NavigationEnd will create/activate the tab
    return this.router.navigateByUrl(normalized);
  }

  /**
   * Closes a tab with dirty state protection and CanDeactivate navigation coordination
   */
  async closeTab(id: AppTabId): Promise<boolean> {
    const tab = this.store.tabs().find(t => t.id === id);
    if (!tab || tab.pinned) return false;

    // Check dirty state
    const isDirty = tab.dirty || (tab.active && this.activeDirtyProvider?.isTabDirty() === true);
    if (isDirty) {
      const decision = await this.promptDirtyDecision(tab);
      if (decision === 'cancel') {
        return false;
      }

      if (decision === 'save') {
        if (this.activeDirtyProvider) {
          const saveSuccess = await this.executeTabSave(this.activeDirtyProvider);
          if (!saveSuccess) {
            // Save failed: tab must remain open and dirty state must stay true
            return false;
          }
        }
        this.store.patchTab(id, { dirty: false });
      } else if (decision === 'discard') {
        if (this.activeDirtyProvider?.onTabDiscard) {
          this.activeDirtyProvider.onTabDiscard();
        }
        this.store.patchTab(id, { dirty: false });
      }
    }

    // If closing the active tab, navigate router to the next adjacent tab first
    if (tab.active) {
      const remaining = this.store.tabs().filter(t => t.id !== id);
      const targetIndex = this.store.tabs().findIndex(t => t.id === id);
      let targetUrl = '/create-dashboard';

      if (remaining.length > 0) {
        const nextIdx = Math.max(0, Math.min(targetIndex - 1, remaining.length - 1));
        targetUrl = remaining[nextIdx].url;
      }

      // Evict route reuse cache handle for the closing tab
      TabRouteReuseStrategy.evict(tab.routeUrl);

      // Attempt router navigation to next tab
      try {
        const navSuccess = await this.router.navigateByUrl(targetUrl);
        if (!navSuccess) {
          // Navigation was cancelled by CanDeactivate guard or router guard!
          // Tab must remain intact in the workspace.
          return false;
        }
      } catch {
        return false;
      }

      // Router successfully transitioned: now remove the tab from state
      const { closedTab } = this.store.removeTab(id);
      if (closedTab) {
        this.emitEvent('tabClosed', closedTab);
        this.persistence.scheduleSave(this.store.state());
        return true;
      }
      return false;
    } else {
      // Closing an inactive/background tab: no router navigation needed
      TabRouteReuseStrategy.evict(tab.routeUrl);
      const { closedTab } = this.store.removeTab(id);
      if (closedTab) {
        this.emitEvent('tabClosed', closedTab);
        this.persistence.scheduleSave(this.store.state());
        return true;
      }
      return false;
    }
  }

  /**
   * Closes currently active tab
   */
  async closeActiveTab(): Promise<boolean> {
    const activeId = this.store.activeTabId();
    if (!activeId) return false;
    return this.closeTab(activeId);
  }

  /**
   * Closes all other tabs (excluding pinned)
   */
  async closeOtherTabs(exceptId?: AppTabId): Promise<boolean> {
    const targetId = exceptId || this.store.activeTabId();
    if (!targetId) return false;

    const closed = this.store.removeOtherTabs(targetId);
    closed.forEach(t => TabRouteReuseStrategy.evict(t.routeUrl));

    this.persistence.scheduleSave(this.store.state());
    await this.navigateToTab(targetId);
    return true;
  }

  /**
   * Closes all unpinned tabs to the right of fromId
   */
  async closeTabsToRight(fromId: AppTabId): Promise<boolean> {
    const closed = this.store.removeTabsToRight(fromId);
    closed.forEach(t => TabRouteReuseStrategy.evict(t.routeUrl));

    this.persistence.scheduleSave(this.store.state());
    const currentActiveId = this.store.activeTabId();
    if (currentActiveId) {
      await this.navigateToTab(currentActiveId);
    }
    return true;
  }

  /**
   * Closes all unpinned tabs
   */
  async closeAllTabs(): Promise<boolean> {
    const closed = this.store.removeAllTabs();
    closed.forEach(t => TabRouteReuseStrategy.evict(t.routeUrl));

    this.persistence.scheduleSave(this.store.state());
    const remainingActiveId = this.store.activeTabId();
    if (remainingActiveId) {
      await this.navigateToTab(remainingActiveId);
    } else {
      await this.router.navigateByUrl('/create-dashboard');
    }
    return true;
  }

  /**
   * Reopens the most recently closed tab
   */
  async reopenClosedTab(): Promise<boolean> {
    const tab = this.store.popRecentlyClosed();
    if (!tab) return false;

    this.store.upsertTab(tab, { activate: true });
    this.emitEvent('tabOpened', tab);
    this.persistence.scheduleSave(this.store.state());
    return this.router.navigateByUrl(tab.url);
  }

  /**
   * Toggles pinned state of a tab
   */
  togglePin(id: AppTabId): void {
    const tab = this.store.tabs().find(t => t.id === id);
    if (!tab) return;

    const newPinned = !tab.pinned;
    this.store.patchTab(id, { pinned: newPinned });
    this.emitEvent(newPinned ? 'tabPinned' : 'tabUnpinned', tab);
    this.persistence.scheduleSave(this.store.state());
  }

  /**
   * Reorders tabs (e.g. drag and drop)
   */
  moveTab(fromIndex: number, toIndex: number): void {
    this.store.reorderTabs(fromIndex, toIndex);
    this.emitEvent('tabMoved');
    this.persistence.scheduleSave(this.store.state());
  }

  /**
   * Sets tab dirty state
   */
  setDirty(id: AppTabId, dirty = true): void {
    this.store.patchTab(id, { dirty });
    this.emitEvent('tabDirtyChanged');
  }

  /**
   * Safely updates the title for a specific tab ID
   */
  updateTitle(id: AppTabId, title: string): void {
    if (!title || title.trim() === '') return;
    this.store.patchTab(id, { title: title.trim() });
    this.emitEvent('tabUpdated');
    this.persistence.scheduleSave(this.store.state());
  }

  /**
   * Safely updates the title for a specific route URL.
   * Eliminates the active-tab race condition during async data fetches!
   * Prioritizes exact normalized URL to prevent query parameter misnaming.
   */
  updateTitleForUrl(url: string, title: string): void {
    if (!title || title.trim() === '') return;
    const normalized = normalizeUrl(url);
    const basePath = extractBasePath(normalized);

    // 1. Exact normalized URL match (highest priority, avoids query collisions)
    let matchingTab = this.store.tabs().find(t => t.url === normalized);

    // 2. Base path fallback
    if (!matchingTab) {
      matchingTab = this.store.tabs().find(t => t.routeUrl === basePath);
    }

    if (matchingTab) {
      this.updateTitle(matchingTab.id, title);
    }
  }

  /**
   * Clears the entire workspace state (e.g. on logout)
   */
  clearWorkspace(): void {
    this.store.resetState();
    TabRouteReuseStrategy.evictAll();
    this.persistence.clearActiveTenant();
    this.emitEvent('workspaceCleared');
  }

  // ── Router Event Synchronization ─────────────────────────────────────────

  private initRouterIntegration(): void {
    this.router.events
      .pipe(
        filter((e): e is RouterEvent =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(event => this.handleRouterEvent(event));
  }

  private handleRouterEvent(event: RouterEvent): void {
    this.checkTenantContext();

    if (event instanceof NavigationStart) {
      this.captureScrollPosition();
      const activeId = this.store.activeTabId();
      if (activeId) {
        this.store.patchTab(activeId, { loading: true });
      }
      return;
    }

    if (event instanceof NavigationCancel || event instanceof NavigationError) {
      const activeId = this.store.activeTabId();
      if (activeId) {
        this.store.patchTab(activeId, { loading: false });
      }
      this.pendingTabId = null;
      return;
    }

    if (event instanceof NavigationEnd) {
      this.processNavigationEnd(event);
    }
  }

  private processNavigationEnd(event: NavigationEnd): void {
    const leaf = this.getLeafSnapshot(this.router.routerState.snapshot.root);
    const tabConfig = this.resolveRouteConfig(leaf, event.urlAfterRedirects);

    if (!tabConfig.enabled) {
      // Excluded route: reset loading and return
      const activeId = this.store.activeTabId();
      if (activeId) {
        this.store.patchTab(activeId, { loading: false });
      }
      this.pendingTabId = null;
      return;
    }

    const normalizedUrl = normalizeUrl(event.urlAfterRedirects);
    const basePath = extractBasePath(normalizedUrl);
    const params = stringifyRecord(this.collectRouteParams(leaf));
    const queryParams = stringifyRecord(leaf.queryParams);
    const routePattern = this.buildRoutePattern(leaf);

    const tabId = computeTabId(tabConfig, basePath, normalizedUrl, routePattern, params, queryParams);
    const title = tabConfig.title || titleFromPath(basePath);

    const newTab: AppTab = {
      id: tabId,
      url: normalizedUrl,
      routeUrl: basePath,
      routePattern,
      title,
      icon: tabConfig.icon || 'pi pi-file',
      pinned: !!tabConfig.pinned,
      closable: tabConfig.closable !== false,
      dirty: false,
      loading: false,
      order: 0,
      createdAt: Date.now(),
      lastActivatedAt: Date.now(),
      params,
      queryParams,
      fragment: leaf.fragment,
      data: { ...leaf.data }
    };

    const { tab, isNew } = this.store.upsertTab(newTab, { activate: true });
    this.pendingTabId = null;

    if (isNew) {
      this.emitEvent('tabOpened', tab);
    } else {
      this.emitEvent('tabActivated', tab);
    }

    this.restoreScrollPosition(tab);
    this.persistence.scheduleSave(this.store.state());
  }

  // ── Tenant Lifecycle Watcher ──────────────────────────────────────────────

  checkTenantContext(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const key = this.persistence.getStorageKey();
    if (this.currentTenantKey === key && this.isInitialized) return;

    // Tenant key changed (e.g. org switch or login as different user)
    if (this.currentTenantKey !== null && this.currentTenantKey !== key) {
      this.store.resetState();
      TabRouteReuseStrategy.evictAll();
    }

    this.currentTenantKey = key;
    this.isInitialized = true;
    this.hydrateWorkspaceForActiveTenant();
  }

  private initTenantWatch(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check on startup and whenever user/org context stabilizes
    setTimeout(() => {
      this.checkTenantContext();
    }, 100);
  }

  private hydrateWorkspaceForActiveTenant(): void {
    const key = this.persistence.getStorageKey();
    this.currentTenantKey = key;
    this.isInitialized = true;

    const saved = this.persistence.loadWorkspace();
    if (!saved || saved.tabs.length === 0) {
      // Nothing persisted for this tenant: ensure current route is captured if valid
      return;
    }

    // Restore tabs into store
    const reconstituted: AppTab[] = saved.tabs.map(p => ({
      id: p.id,
      url: p.url,
      routeUrl: p.routeUrl,
      routePattern: p.routePattern,
      title: p.title,
      icon: p.icon || 'pi pi-file',
      pinned: p.pinned,
      closable: p.closable,
      dirty: false,
      loading: false,
      order: p.order,
      createdAt: p.createdAt,
      lastActivatedAt: p.lastActivatedAt,
      params: {},
      queryParams: {}
    }));

    // Populate state store with validated tabs
    reconstituted.forEach(t => this.store.upsertTab(t, { activate: false }));

    // F5 Refresh / Deep link synchronization:
    // If the user refreshed directly on an existing tab URL, activate that specific tab!
    const currentUrl = normalizeUrl(this.router.url);
    const basePath = extractBasePath(currentUrl);
    const matchingCurrent = reconstituted.find(t => t.url === currentUrl || t.routeUrl === basePath);

    if (matchingCurrent) {
      this.store.activateTab(matchingCurrent.id);
    } else if (saved.activeTabId && reconstituted.some(t => t.id === saved.activeTabId)) {
      this.store.activateTab(saved.activeTabId);
    }

    this.emitEvent('workspaceRestored');
  }

  // ── Route Metadata & Leaf Resolution ─────────────────────────────────────

  private resolveRouteConfig(leaf: ActivatedRouteSnapshot, url: string): RouteTabConfig {
    const data = this.getMergedRouteData(leaf);
    const path = extractBasePath(url);

    // Global exclusions
    const isExcluded =
      data['disableTab'] === true ||
      path === '/' ||
      path.startsWith('/auth') ||
      path.startsWith('/store') ||
      path.startsWith('/apex-delivery') ||
      path.startsWith('/delivery-agent') ||
      path.includes('/login') ||
      path.includes('/unauthorized') ||
      leaf.routeConfig?.path === '**';

    if (isExcluded) {
      return { enabled: false };
    }

    // Modern route data: data: { tab: { ... } }
    const modernConfig = (data['tab'] as RouteTabConfig | undefined) ?? {};

    // Legacy route data fallback: data: { tabLabel, tabIcon, tabPinned, reuseTab }
    const label = modernConfig.title || (data['tabLabel'] as string | undefined);
    const icon = modernConfig.icon || (data['tabIcon'] as string | undefined);
    const pinned = modernConfig.pinned ?? (data['tabPinned'] as boolean | undefined) ?? false;
    const reuseTab = (data['reuseTab'] as boolean | undefined);

    const isRoutable = !!leaf.routeConfig && !leaf.firstChild && (!!leaf.component || !!leaf.routeConfig.loadComponent);
    const enabled = modernConfig.enabled !== false && (isRoutable || !!label);

    let reuseMode = modernConfig.reuseMode;
    if (!reuseMode) {
      reuseMode = reuseTab === true ? 'collection' : 'resource';
    }

    return {
      enabled,
      title: label,
      icon,
      pinned,
      closable: modernConfig.closable ?? !pinned,
      reuseMode,
      resourceParam: modernConfig.resourceParam || 'id',
      queryPolicy: modernConfig.queryPolicy || 'ignore',
      cache: modernConfig.cache ?? (data['cacheTab'] === true)
    };
  }

  private getLeafSnapshot(root: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let cursor = root;
    while (cursor.firstChild) {
      cursor = cursor.firstChild;
    }
    return cursor;
  }

  private getMergedRouteData(route: ActivatedRouteSnapshot): Record<string, unknown> {
    return route.pathFromRoot.reduce((acc, s) => ({ ...acc, ...s.data }), {});
  }

  private collectRouteParams(route: ActivatedRouteSnapshot): Record<string, unknown> {
    return route.pathFromRoot.reduce((acc, s) => ({ ...acc, ...s.params }), {});
  }

  private buildRoutePattern(route: ActivatedRouteSnapshot): string {
    const pattern = route.pathFromRoot
      .map(s => s.routeConfig?.path)
      .filter(Boolean)
      .join('/');

    return `/${pattern}`.replace(/\/+/g, '/');
  }

  // ── Scroll Preservation ──────────────────────────────────────────────────

  private captureScrollPosition(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const activeId = this.store.activeTabId();
    if (!activeId) return;

    this.store.patchTab(activeId, {
      scrollPosition: { x: window.scrollX, y: window.scrollY }
    });
  }

  private restoreScrollPosition(tab: AppTab): void {
    if (!isPlatformBrowser(this.platformId) || !tab.scrollPosition) return;
    const { x, y } = tab.scrollPosition;
    setTimeout(() => {
      window.scrollTo({ left: x, top: y, behavior: 'auto' });
    }, 50);
  }

  // ── Dirty Decision Modal & Execution ──────────────────────────────────────

  private promptDirtyDecision(tab: AppTab): Promise<'save' | 'discard' | 'cancel'> {
    const hasSave = typeof this.activeDirtyProvider?.onTabSave === 'function';

    return new Promise(resolve => {
      if (hasSave) {
        this.confirmationService.confirm({
          message: `"${tab.title}" has unsaved changes. Would you like to save your changes before closing?`,
          header: 'Unsaved Changes',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Save Changes',
          rejectLabel: 'Discard Changes',
          acceptButtonStyleClass: 'p-button-primary',
          rejectButtonStyleClass: 'p-button-danger p-button-outlined',
          accept: () => resolve('save'),
          reject: (type?: any) => {
            // ConfirmEventType: REJECT = 1 (user clicked discard button), CANCEL = 2 (user closed/cancelled modal)
            if (type === 1 || type === undefined) {
              resolve('discard');
            } else {
              resolve('cancel');
            }
          }
        });
      } else {
        this.confirmationService.confirm({
          message: `"${tab.title}" has unsaved changes. Do you want to discard them and close the tab?`,
          header: 'Unsaved Changes',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Discard Changes',
          rejectLabel: 'Cancel',
          acceptButtonStyleClass: 'p-button-danger',
          rejectButtonStyleClass: 'p-button-secondary p-button-text',
          accept: () => resolve('discard'),
          reject: () => resolve('cancel')
        });
      }
    });
  }

  private async executeTabSave(provider: TabDirtyStateProvider): Promise<boolean> {
    if (!provider.onTabSave) return true;
    try {
      const result = provider.onTabSave();
      if (result instanceof Promise) {
        return await result;
      }
      if (result && typeof (result as any).subscribe === 'function') {
        const { firstValueFrom } = await import('rxjs');
        return await firstValueFrom(result as any);
      }
      return !!result;
    } catch (err) {
      console.error('Tab save failed:', err);
      return false;
    }
  }

  private emitEvent(type: TabWorkspaceEventType, tab?: AppTab): void {
    this.events$.next({
      type,
      tab,
      tabId: tab?.id,
      timestamp: Date.now()
    });
  }
}
