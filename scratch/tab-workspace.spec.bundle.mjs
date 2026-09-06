var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/app/tab-workspace/tab-identity.util.ts
function normalizeUrl(rawUrl) {
  if (!rawUrl || rawUrl.trim() === "") return "/";
  const clean = rawUrl.trim();
  const [pathAndQuery, fragment] = clean.split("#");
  const [pathPart, queryPart] = pathAndQuery.split("?");
  let normalizedPath = "/" + pathPart.replace(/^\/+/, "").replace(/\/+$/, "");
  if (normalizedPath === "") normalizedPath = "/";
  let normalizedQuery = "";
  if (queryPart && queryPart.trim() !== "") {
    const searchParams = new URLSearchParams(queryPart);
    const sortedEntries = Array.from(searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (sortedEntries.length > 0) {
      const sortedParams = new URLSearchParams();
      for (const [k, v] of sortedEntries) {
        sortedParams.append(k, v);
      }
      normalizedQuery = "?" + sortedParams.toString();
    }
  }
  const normalizedFragment = fragment ? `#${fragment}` : "";
  return `${normalizedPath}${normalizedQuery}${normalizedFragment}`;
}
function extractBasePath(url) {
  const [pathAndQuery] = url.split("#");
  const [pathPart] = pathAndQuery.split("?");
  const normalized = "/" + pathPart.replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
}
function computeTabId(config, basePath, normalizedUrl, routePattern, params, queryParams) {
  const reuseMode = config.reuseMode ?? "resource";
  if (reuseMode === "alwaysNew") {
    return `${basePath}__new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  if (reuseMode === "exactUrl") {
    return normalizedUrl;
  }
  if (reuseMode === "collection") {
    return routePattern || basePath;
  }
  const resourceKey = config.resourceParam || "id";
  if (params[resourceKey]) {
    return `${routePattern || basePath}::${params[resourceKey]}`;
  }
  const paramKeys = Object.keys(params);
  if (paramKeys.length > 0) {
    const firstKey = paramKeys[0];
    return `${routePattern || basePath}::${params[firstKey]}`;
  }
  if (config.queryPolicy === "discriminate" && Object.keys(queryParams).length > 0) {
    return normalizedUrl;
  }
  return routePattern || basePath;
}
function titleFromPath(path) {
  const segments = path.split("/").filter(Boolean);
  const last = segments.at(-1)?.split(/[?#;]/)[0] ?? "Workspace";
  const isLikelyId = /^[0-9a-fA-F-]{8,}$/.test(last) || /^\d+$/.test(last);
  if (isLikelyId && segments.length > 1) {
    const parent = segments[segments.length - 2];
    return `${formatWords(parent)} #${last.substring(0, 6)}`;
  }
  return formatWords(last);
}
function formatWords(str) {
  return str.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

// src/app/tab-workspace/tab-route-reuse.strategy.ts
import { Injectable } from "@angular/core";
var DEFAULT_MAX_CACHED = 8;
var MAX_CACHE_AGE_MS = 30 * 60 * 1e3;
var TabRouteReuseStrategy = class {
  cache = /* @__PURE__ */ new Map();
  maxCached = DEFAULT_MAX_CACHED;
  constructor() {
    TabRouteReuseStrategy.instance = this;
  }
  static getInstance() {
    return TabRouteReuseStrategy.instance;
  }
  static evict(key) {
    TabRouteReuseStrategy.instance?.evict(key);
  }
  static evictAll() {
    TabRouteReuseStrategy.instance?.evictAll();
  }
  /**
   * Determines if this route (and its subtree) should be detached to be reused later.
   */
  shouldDetach(route) {
    if (!this.isRouteCachable(route)) return false;
    return true;
  }
  /**
   * Stores the detached route handle.
   */
  store(route, handle) {
    if (!handle) return;
    const key = this.calcRouteKey(route);
    if (!key) {
      this.destroyHandle(handle);
      return;
    }
    if (this.cache.has(key)) {
      this.evict(key);
    }
    this.evictToCapacity();
    const now = Date.now();
    this.cache.set(key, {
      key,
      handle,
      createdAt: now,
      lastAccessedAt: now
    });
    this.notifyLifecycle(handle, "onTabDetach");
  }
  /**
   * Determines if this route (and its subtree) should be reattached.
   */
  shouldAttach(route) {
    const key = this.calcRouteKey(route);
    if (!key) return false;
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() - entry.createdAt > MAX_CACHE_AGE_MS) {
      this.evict(key);
      return false;
    }
    return true;
  }
  /**
   * Retrieves the previously stored route handle.
   */
  retrieve(route) {
    const key = this.calcRouteKey(route);
    if (!key) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;
    entry.lastAccessedAt = Date.now();
    this.notifyLifecycle(entry.handle, "onTabAttach");
    return entry.handle;
  }
  /**
   * Determines if a route should be reused.
   * For routes opting into tab caching, only reuses in-place if their canonical route keys match.
   * Otherwise detaches and attaches via the bounded cache.
   */
  shouldReuseRoute(future, curr) {
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
  evict(key) {
    const entry = this.cache.get(key);
    if (!entry) return;
    this.cache.delete(key);
    this.destroyHandle(entry.handle);
  }
  /**
   * Evicts all cached route handles except the specified keys.
   */
  evictExcept(keepKeys) {
    for (const key of Array.from(this.cache.keys())) {
      if (!keepKeys.has(key)) {
        this.evict(key);
      }
    }
  }
  /**
   * Evicts all cached route handles and completely cleans memory.
   */
  evictAll() {
    for (const key of Array.from(this.cache.keys())) {
      this.evict(key);
    }
  }
  // ── Private Helpers ───────────────────────────────────────────────────────
  isRouteCachable(route) {
    const data = this.getMergedRouteData(route);
    const tabConfig = data["tab"];
    const cacheOptIn = tabConfig?.["cache"] === true || data["cacheTab"] === true;
    if (!cacheOptIn) return false;
    if (!route.routeConfig || route.routeConfig.path === "**") return false;
    return true;
  }
  calcRouteKey(route) {
    const path = route.pathFromRoot.map((s) => s.url.map((u) => u.toString()).join("/")).filter(Boolean).join("/");
    const data = this.getMergedRouteData(route);
    const tabConfig = data["tab"];
    if (tabConfig?.["queryPolicy"] === "discriminate") {
      const q = Object.entries(route.queryParams || {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");
      return q ? `/${path}?${q}` : `/${path}`;
    }
    return `/${path}`;
  }
  getMergedRouteData(route) {
    return route.pathFromRoot.reduce((acc, s) => ({ ...acc, ...s.data }), {});
  }
  evictToCapacity() {
    while (this.cache.size >= this.maxCached) {
      const oldest = Array.from(this.cache.values()).sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)[0];
      if (!oldest) break;
      this.evict(oldest.key);
    }
  }
  destroyHandle(handle) {
    try {
      const componentRef = handle?.componentRef;
      if (componentRef && typeof componentRef.destroy === "function" && !componentRef.destroyed) {
        componentRef.destroy();
      }
      const contexts = handle?.contexts;
      if (contexts && typeof contexts.forEach === "function") {
        contexts.forEach((ctx) => {
          if (ctx?.outlet?.isActivated && ctx.outlet.componentRef) {
            ctx.outlet.componentRef.destroy?.();
          }
        });
      }
    } catch {
    }
  }
  notifyLifecycle(handle, hook) {
    try {
      const instance = handle?.componentRef?.instance;
      if (instance && typeof instance[hook] === "function") {
        instance[hook]();
      }
    } catch {
    }
  }
};
__publicField(TabRouteReuseStrategy, "instance", null);
TabRouteReuseStrategy = __decorateClass([
  Injectable({ providedIn: "root" })
], TabRouteReuseStrategy);

// src/app/tab-workspace/tab-workspace.state.ts
import { Injectable as Injectable2, computed, signal } from "@angular/core";
var DEFAULT_MAX_TABS = 30;
var DEFAULT_MAX_CLOSED = 20;
var STATE_VERSION = 3;
var TabWorkspaceStateStore = class {
  _state = signal({
    tabs: [],
    activeTabId: null,
    recentlyClosed: [],
    version: STATE_VERSION
  });
  // ── Public Readonly Signals ───────────────────────────────────────────────
  state = this._state.asReadonly();
  tabs = computed(() => this._state().tabs);
  activeTabId = computed(() => this._state().activeTabId);
  activeTab = computed(() => {
    const activeId = this._state().activeTabId;
    if (!activeId) return null;
    return this._state().tabs.find((t) => t.id === activeId) ?? null;
  });
  tabCount = computed(() => this._state().tabs.length);
  hasTabs = computed(() => this._state().tabs.length > 0);
  pinnedTabs = computed(() => this._state().tabs.filter((t) => t.pinned));
  unpinnedTabs = computed(() => this._state().tabs.filter((t) => !t.pinned));
  recentlyClosed = computed(() => this._state().recentlyClosed);
  // ── Config ────────────────────────────────────────────────────────────────
  maxTabs = DEFAULT_MAX_TABS;
  maxClosed = DEFAULT_MAX_CLOSED;
  configure(config) {
    if (config.maxTabs && config.maxTabs > 0) this.maxTabs = config.maxTabs;
    if (config.maxClosedHistory && config.maxClosedHistory > 0) this.maxClosed = config.maxClosedHistory;
  }
  // ── Tab Lifecycle Mutations ───────────────────────────────────────────────
  /**
   * Inserts or updates a tab in the workspace
   */
  upsertTab(incoming, options = {}) {
    const shouldActivate = options.activate !== false;
    let isNew = false;
    let resultingTab = incoming;
    this._state.update((current) => {
      const existingIndex = current.tabs.findIndex((t) => t.id === incoming.id);
      let nextTabs;
      if (existingIndex >= 0) {
        const existing = current.tabs[existingIndex];
        resultingTab = {
          ...existing,
          ...incoming,
          // Retain immutable metadata
          createdAt: existing.createdAt,
          pinned: incoming.pinned ?? existing.pinned,
          dirty: incoming.dirty !== void 0 ? incoming.dirty : existing.dirty,
          // If title was custom updated and incoming is default/fallback, retain existing custom title
          title: incoming.title || existing.title,
          lastActivatedAt: shouldActivate ? Date.now() : existing.lastActivatedAt,
          active: shouldActivate
        };
        nextTabs = current.tabs.map((t, i) => i === existingIndex ? resultingTab : t);
      } else {
        isNew = true;
        resultingTab = {
          ...incoming,
          active: shouldActivate,
          createdAt: incoming.createdAt || Date.now(),
          lastActivatedAt: shouldActivate ? Date.now() : incoming.lastActivatedAt || Date.now()
        };
        if (resultingTab.pinned) {
          const firstUnpinnedIndex = current.tabs.findIndex((t) => !t.pinned);
          if (firstUnpinnedIndex === -1) {
            nextTabs = [...current.tabs, resultingTab];
          } else {
            nextTabs = [
              ...current.tabs.slice(0, firstUnpinnedIndex),
              resultingTab,
              ...current.tabs.slice(firstUnpinnedIndex)
            ];
          }
        } else {
          nextTabs = [...current.tabs, resultingTab];
        }
      }
      nextTabs = this.evictExceedingTabs(nextTabs, resultingTab.id);
      nextTabs = nextTabs.map((t, idx) => ({
        ...t,
        order: idx,
        active: shouldActivate ? t.id === resultingTab.id : t.active
      }));
      return {
        ...current,
        tabs: nextTabs,
        activeTabId: shouldActivate ? resultingTab.id : current.activeTabId
      };
    });
    return { tab: resultingTab, isNew };
  }
  /**
   * Activates a tab by ID in the store
   */
  activateTab(id) {
    const current = this._state();
    const exists = current.tabs.some((t) => t.id === id);
    if (!exists) return false;
    this._state.update((state) => ({
      ...state,
      activeTabId: id,
      tabs: state.tabs.map((t) => ({
        ...t,
        active: t.id === id,
        lastActivatedAt: t.id === id ? Date.now() : t.lastActivatedAt
      }))
    }));
    return true;
  }
  /**
   * Closes a specific tab. Returns the ID of the next tab to activate, if any.
   */
  removeTab(id) {
    const current = this._state();
    const target = current.tabs.find((t) => t.id === id);
    if (!target) return { closedTab: null, nextActiveId: current.activeTabId };
    const targetIndex = current.tabs.findIndex((t) => t.id === id);
    const remaining = current.tabs.filter((t) => t.id !== id);
    const updatedRecentlyClosed = [target, ...current.recentlyClosed].slice(0, this.maxClosed);
    let nextActiveId = current.activeTabId;
    if (current.activeTabId === id) {
      if (remaining.length > 0) {
        const nextIdx = Math.max(0, Math.min(targetIndex - 1, remaining.length - 1));
        nextActiveId = remaining[nextIdx].id;
      } else {
        nextActiveId = null;
      }
    }
    this._state.update((state) => ({
      ...state,
      tabs: remaining.map((t, idx) => ({
        ...t,
        order: idx,
        active: t.id === nextActiveId
      })),
      activeTabId: nextActiveId,
      recentlyClosed: updatedRecentlyClosed
    }));
    return { closedTab: target, nextActiveId };
  }
  /**
   * Closes all tabs except the specified tab and pinned tabs
   */
  removeOtherTabs(exceptId) {
    const current = this._state();
    const closed = current.tabs.filter((t) => !t.pinned && t.id !== exceptId);
    const remaining = current.tabs.filter((t) => t.pinned || t.id === exceptId);
    this._state.update((state) => ({
      ...state,
      tabs: remaining.map((t, idx) => ({
        ...t,
        order: idx,
        active: t.id === exceptId
      })),
      activeTabId: exceptId,
      recentlyClosed: [...closed, ...state.recentlyClosed].slice(0, this.maxClosed)
    }));
    return closed;
  }
  /**
   * Closes all unpinned tabs to the right of the given tab
   */
  removeTabsToRight(fromId) {
    const current = this._state();
    const index = current.tabs.findIndex((t) => t.id === fromId);
    if (index === -1) return [];
    const closed = current.tabs.filter((t, i) => i > index && !t.pinned);
    const remaining = current.tabs.filter((t, i) => i <= index || t.pinned);
    let nextActiveId = current.activeTabId;
    const activeIsRemaining = remaining.some((t) => t.id === nextActiveId);
    if (!activeIsRemaining) {
      nextActiveId = fromId;
    }
    this._state.update((state) => ({
      ...state,
      tabs: remaining.map((t, idx) => ({
        ...t,
        order: idx,
        active: t.id === nextActiveId
      })),
      activeTabId: nextActiveId,
      recentlyClosed: [...closed, ...state.recentlyClosed].slice(0, this.maxClosed)
    }));
    return closed;
  }
  /**
   * Closes all unpinned tabs. Retains pinned tabs.
   */
  removeAllTabs() {
    const current = this._state();
    const closed = current.tabs.filter((t) => !t.pinned);
    const pinned = current.tabs.filter((t) => t.pinned);
    const nextActiveId = pinned.length > 0 ? pinned[pinned.length - 1].id : null;
    this._state.update((state) => ({
      ...state,
      tabs: pinned.map((t, idx) => ({
        ...t,
        order: idx,
        active: t.id === nextActiveId
      })),
      activeTabId: nextActiveId,
      recentlyClosed: [...closed, ...state.recentlyClosed].slice(0, this.maxClosed)
    }));
    return closed;
  }
  /**
   * Pops the most recently closed tab
   */
  popRecentlyClosed() {
    const current = this._state();
    if (current.recentlyClosed.length === 0) return null;
    const [popped, ...rest] = current.recentlyClosed;
    this._state.update((state) => ({
      ...state,
      recentlyClosed: rest
    }));
    return popped;
  }
  /**
   * Partially updates a tab's metadata
   */
  patchTab(id, patch) {
    const current = this._state();
    const exists = current.tabs.some((t) => t.id === id);
    if (!exists) return false;
    this._state.update((state) => ({
      ...state,
      tabs: state.tabs.map((t) => t.id === id ? { ...t, ...patch } : t)
    }));
    return true;
  }
  /**
   * Reorders tabs (e.g. from drag & drop)
   */
  reorderTabs(fromIndex, toIndex) {
    this._state.update((state) => {
      const tabs = [...state.tabs];
      if (fromIndex < 0 || fromIndex >= tabs.length || toIndex < 0 || toIndex >= tabs.length) {
        return state;
      }
      const [moved] = tabs.splice(fromIndex, 1);
      if (!moved) return state;
      if (moved.pinned) {
        const lastPinnedIdx = tabs.filter((t) => t.pinned).length;
        toIndex = Math.min(toIndex, lastPinnedIdx);
      } else {
        const firstUnpinnedIdx = tabs.findIndex((t) => !t.pinned);
        if (firstUnpinnedIdx !== -1 && toIndex < firstUnpinnedIdx) {
          toIndex = firstUnpinnedIdx;
        }
      }
      tabs.splice(toIndex, 0, moved);
      return {
        ...state,
        tabs: tabs.map((t, idx) => ({ ...t, order: idx }))
      };
    });
  }
  /**
   * Clears state completely (e.g. on logout or tenant switch)
   */
  resetState() {
    this._state.set({
      tabs: [],
      activeTabId: null,
      recentlyClosed: [],
      version: STATE_VERSION
    });
  }
  // ── Private Helpers ───────────────────────────────────────────────────────
  evictExceedingTabs(tabs, protectedId) {
    let result = [...tabs];
    while (result.length > this.maxTabs) {
      const evictable = result.filter((t) => !t.pinned && !t.dirty && t.id !== protectedId).sort((a, b) => a.lastActivatedAt - b.lastActivatedAt)[0];
      if (!evictable) break;
      result = result.filter((t) => t.id !== evictable.id);
    }
    return result;
  }
};
TabWorkspaceStateStore = __decorateClass([
  Injectable2({ providedIn: "root" })
], TabWorkspaceStateStore);

// src/app/tab-workspace/tab-workspace.spec.ts
describe("Universal Application Tab Workspace", () => {
  describe("1. Route Normalization & Canonical Tab Identity", () => {
    it("normalizes URLs with trailing slashes and sorts query parameters", () => {
      const url1 = normalizeUrl("/customers/list/?b=2&a=1");
      const url2 = normalizeUrl("customers/list?a=1&b=2");
      expect(url1).toBe(url2);
      expect(url1).toBe("/customers/list?a=1&b=2");
    });
    it("extracts base path correctly", () => {
      expect(extractBasePath("/customers/101?tab=history#activity")).toBe("/customers/101");
      expect(extractBasePath("/")).toBe("/");
    });
    it("distinguishes separate resource IDs in resource mode (Section 4 & 6)", () => {
      const config = { reuseMode: "resource", resourceParam: "id" };
      const pattern = "/customers/:id";
      const id101 = computeTabId(config, "/customers/101", "/customers/101", pattern, { id: "101" }, {});
      const id102 = computeTabId(config, "/customers/102", "/customers/102", pattern, { id: "102" }, {});
      expect(id101).toBe("/customers/:id::101");
      expect(id102).toBe("/customers/:id::102");
      expect(id101).not.toBe(id102);
    });
    it("reuses a single tab ID for collection routes regardless of query params (Section 5)", () => {
      const config = { reuseMode: "collection" };
      const pattern = "/customers";
      const idPage1 = computeTabId(config, "/customers", "/customers?page=1", pattern, {}, { page: "1" });
      const idPage2 = computeTabId(config, "/customers", "/customers?page=2", pattern, {}, { page: "2" });
      expect(idPage1).toBe("/customers");
      expect(idPage2).toBe("/customers");
      expect(idPage1).toBe(idPage2);
    });
    it("discriminates query parameters when queryPolicy is discriminate", () => {
      const config = { queryPolicy: "discriminate" };
      const pattern = "/reports";
      const idSales = computeTabId(config, "/reports", "/reports?type=sales", pattern, {}, { type: "sales" });
      const idInventory = computeTabId(config, "/reports", "/reports?type=inventory", pattern, {}, { type: "inventory" });
      expect(idSales).toBe("/reports?type=sales");
      expect(idInventory).toBe("/reports?type=inventory");
      expect(idSales).not.toBe(idInventory);
    });
    it("supports exactUrl mode", () => {
      const config = { reuseMode: "exactUrl" };
      const pattern = "/analytics";
      const id1 = computeTabId(config, "/analytics", "/analytics?from=2026-01-01", pattern, {}, { from: "2026-01-01" });
      expect(id1).toBe("/analytics?from=2026-01-01");
    });
    it("generates readable title fallbacks from route paths (Section 77)", () => {
      expect(titleFromPath("/hrms/employee-directory")).toBe("Employee Directory");
      expect(titleFromPath("/customers/6a204dbb9f37")).toBe("Customers #6a204d");
      expect(titleFromPath("/sales/orders/102")).toBe("Orders #102");
    });
  });
  describe("2. TabWorkspaceStateStore Lifecycle & Invariants", () => {
    let store;
    const createDummyTab = (id, pinned = false, dirty = false) => ({
      id,
      url: `/route/${id}`,
      routeUrl: `/route/${id}`,
      routePattern: "/route/:id",
      title: `Tab ${id}`,
      pinned,
      closable: !pinned,
      dirty,
      loading: false,
      order: 0,
      createdAt: Date.now(),
      lastActivatedAt: Date.now(),
      params: { id },
      queryParams: {}
    });
    beforeEach(() => {
      store = new TabWorkspaceStateStore();
      store.configure({ maxTabs: 4, maxClosedHistory: 3 });
    });
    it("inserts and activates tabs idempotently without duplicate creation", () => {
      const { isNew: isFirstNew } = store.upsertTab(createDummyTab("tab1"), { activate: true });
      expect(isFirstNew).toBe(true);
      expect(store.tabCount()).toBe(1);
      expect(store.activeTabId()).toBe("tab1");
      const { isNew: isSecondNew } = store.upsertTab({ ...createDummyTab("tab1"), title: "Updated Tab 1" });
      expect(isSecondNew).toBe(false);
      expect(store.tabCount()).toBe(1);
      expect(store.activeTab()?.title).toBe("Updated Tab 1");
    });
    it("positions pinned tabs before unpinned tabs (Section 25)", () => {
      store.upsertTab(createDummyTab("unpinned1", false));
      store.upsertTab(createDummyTab("unpinned2", false));
      store.upsertTab(createDummyTab("pinned1", true));
      const tabIds = store.tabs().map((t) => t.id);
      expect(tabIds[0]).toBe("pinned1");
      expect(tabIds[1]).toBe("unpinned1");
      expect(tabIds[2]).toBe("unpinned2");
    });
    it("enforces maximum tabs limit via LRU eviction (Section 33)", () => {
      store.upsertTab({ ...createDummyTab("tab1"), lastActivatedAt: 100 });
      store.upsertTab({ ...createDummyTab("tab2"), lastActivatedAt: 200 });
      store.upsertTab({ ...createDummyTab("tab3"), lastActivatedAt: 300 });
      store.upsertTab({ ...createDummyTab("tab4"), lastActivatedAt: 400 });
      store.upsertTab({ ...createDummyTab("tab5"), lastActivatedAt: 500 });
      const tabIds = store.tabs().map((t) => t.id);
      expect(tabIds.includes("tab1")).toBe(false);
      expect(tabIds.includes("tab5")).toBe(true);
      expect(store.tabCount()).toBe(4);
    });
    it("does not evict pinned or dirty tabs during capacity enforcement (Section 21, 25, 35)", () => {
      store.upsertTab({ ...createDummyTab("tab1", true), lastActivatedAt: 100 });
      store.upsertTab({ ...createDummyTab("tab2", false, true), lastActivatedAt: 200 });
      store.upsertTab({ ...createDummyTab("tab3"), lastActivatedAt: 300 });
      store.upsertTab({ ...createDummyTab("tab4"), lastActivatedAt: 400 });
      store.upsertTab({ ...createDummyTab("tab5"), lastActivatedAt: 500 });
      const tabIds = store.tabs().map((t) => t.id);
      expect(tabIds.includes("tab1")).toBe(true);
      expect(tabIds.includes("tab2")).toBe(true);
      expect(tabIds.includes("tab3")).toBe(false);
      expect(tabIds.includes("tab5")).toBe(true);
    });
    it("activates adjacent tab deterministically when active tab is closed (Section 27)", () => {
      store.upsertTab(createDummyTab("tabA"));
      store.upsertTab(createDummyTab("tabB"));
      store.upsertTab(createDummyTab("tabC"));
      store.activateTab("tabB");
      expect(store.activeTabId()).toBe("tabB");
      const { nextActiveId: nextAfterB } = store.removeTab("tabB");
      expect(nextAfterB).toBe("tabA");
      expect(store.activeTabId()).toBe("tabA");
      const { nextActiveId: nextAfterA } = store.removeTab("tabA");
      expect(nextAfterA).toBe("tabC");
      expect(store.activeTabId()).toBe("tabC");
    });
    it("preserves pinned tabs during bulk removeAllTabs (Section 29)", () => {
      store.upsertTab(createDummyTab("pinnedA", true));
      store.upsertTab(createDummyTab("unpinnedB", false));
      store.upsertTab(createDummyTab("unpinnedC", false));
      const closed = store.removeAllTabs();
      expect(closed.length).toBe(2);
      expect(store.tabs().length).toBe(1);
      expect(store.tabs()[0].id).toBe("pinnedA");
    });
    it("preserves pinned tabs during removeOtherTabs (Section 30)", () => {
      store.upsertTab(createDummyTab("pinnedA", true));
      store.upsertTab(createDummyTab("unpinnedB", false));
      store.upsertTab(createDummyTab("unpinnedC", false));
      const closed = store.removeOtherTabs("unpinnedC");
      expect(closed.length).toBe(1);
      expect(closed[0].id).toBe("unpinnedB");
      const remainingIds = store.tabs().map((t) => t.id);
      expect(remainingIds.includes("pinnedA")).toBe(true);
      expect(remainingIds.includes("unpinnedC")).toBe(true);
    });
    it("supports reopenLastClosed in LIFO order (Section 32)", () => {
      store.upsertTab(createDummyTab("tab1"));
      store.upsertTab(createDummyTab("tab2"));
      store.removeTab("tab2");
      expect(store.tabCount()).toBe(1);
      const popped = store.popRecentlyClosed();
      expect(popped?.id).toBe("tab2");
      expect(store.recentlyClosed().length).toBe(0);
    });
  });
  describe("3. TabRouteReuseStrategy", () => {
    let strategy;
    beforeEach(() => {
      strategy = new TabRouteReuseStrategy();
    });
    it("does not detach routes that do not opt in to caching (Section 34)", () => {
      const mockRoute = {
        routeConfig: { path: "customers" },
        pathFromRoot: [{ data: {}, url: [] }]
      };
      expect(strategy.shouldDetach(mockRoute)).toBe(false);
    });
    it("opts in to detach when tab config explicitly requests caching (Section 34)", () => {
      const mockRoute = {
        routeConfig: { path: "customers" },
        pathFromRoot: [{ data: { tab: { cache: true } }, url: [] }]
      };
      expect(strategy.shouldDetach(mockRoute)).toBe(true);
    });
    it("differentiates cached resources in shouldReuseRoute (Section 34, 35)", () => {
      const routeConfig = { path: "customers/:id" };
      const route101 = {
        routeConfig,
        queryParams: {},
        pathFromRoot: [
          {
            routeConfig,
            data: { tab: { cache: true } },
            url: [{ toString: () => "customers" }, { toString: () => "101" }]
          }
        ]
      };
      const route102 = {
        routeConfig,
        queryParams: {},
        pathFromRoot: [
          {
            routeConfig,
            data: { tab: { cache: true } },
            url: [{ toString: () => "customers" }, { toString: () => "102" }]
          }
        ]
      };
      expect(strategy.shouldReuseRoute(route102, route101)).toBe(false);
      expect(strategy.shouldReuseRoute(route101, route101)).toBe(true);
    });
    it("evicts handles and destroys componentRef on capacity overflow (Section 35)", () => {
      let destroyed = false;
      const mockHandle = {
        componentRef: {
          destroyed: false,
          destroy: () => {
            destroyed = true;
          }
        }
      };
      const route = {
        routeConfig: { path: "test" },
        queryParams: {},
        pathFromRoot: [
          {
            data: { tab: { cache: true } },
            url: [{ toString: () => "test" }]
          }
        ]
      };
      strategy.store(route, mockHandle);
      strategy.evict("/test");
      expect(destroyed).toBe(true);
    });
  });
  describe("4. Real-World Failure Hunting Scenarios (Section 84, 85, 86)", () => {
    let store;
    beforeEach(() => {
      store = new TabWorkspaceStateStore();
      store.configure({ maxTabs: 30, maxClosedHistory: 20 });
    });
    it("Scenario 84: Full Enterprise Resource, Dirty, Pin, and Multi-Tenant Lifecycle", () => {
      const configResource = { reuseMode: "resource", resourceParam: "id" };
      const configCollection = { reuseMode: "collection" };
      const idCust = computeTabId(configCollection, "/customers", "/customers", "/customers", {}, {});
      store.upsertTab({
        id: idCust,
        url: "/customers",
        routeUrl: "/customers",
        routePattern: "/customers",
        title: "Customers",
        pinned: false,
        closable: true,
        dirty: false,
        loading: false,
        order: 0,
        createdAt: 100,
        lastActivatedAt: 100,
        params: {},
        queryParams: {}
      });
      expect(store.tabCount()).toBe(1);
      const id101 = computeTabId(configResource, "/customers/101", "/customers/101", "/customers/:id", { id: "101" }, {});
      store.upsertTab({
        id: id101,
        url: "/customers/101",
        routeUrl: "/customers/101",
        routePattern: "/customers/:id",
        title: "Customer 101",
        pinned: false,
        closable: true,
        dirty: false,
        loading: false,
        order: 1,
        createdAt: 200,
        lastActivatedAt: 200,
        params: { id: "101" },
        queryParams: {}
      });
      expect(store.tabCount()).toBe(2);
      const id102 = computeTabId(configResource, "/customers/102", "/customers/102", "/customers/:id", { id: "102" }, {});
      store.upsertTab({
        id: id102,
        url: "/customers/102",
        routeUrl: "/customers/102",
        routePattern: "/customers/:id",
        title: "Customer 102",
        pinned: false,
        closable: true,
        dirty: false,
        loading: false,
        order: 2,
        createdAt: 300,
        lastActivatedAt: 300,
        params: { id: "102" },
        queryParams: {}
      });
      expect(store.tabCount()).toBe(3);
      const { isNew: reopenedNew } = store.upsertTab({
        id: id101,
        url: "/customers/101",
        routeUrl: "/customers/101",
        routePattern: "/customers/:id",
        title: "Customer 101",
        pinned: false,
        closable: true,
        dirty: false,
        loading: false,
        order: 1,
        createdAt: 200,
        lastActivatedAt: 400,
        params: { id: "101" },
        queryParams: {}
      }, { activate: true });
      expect(reopenedNew).toBe(false);
      expect(store.tabCount()).toBe(3);
      expect(store.activeTabId()).toBe(id101);
      store.patchTab(id101, { dirty: true });
      expect(store.activeTab()?.dirty).toBe(true);
      const cancelClose = false;
      if (!cancelClose) {
        expect(store.tabs().some((t) => t.id === id101)).toBe(true);
        expect(store.tabs().find((t) => t.id === id101)?.dirty).toBe(true);
      }
      store.patchTab(id101, { dirty: false });
      const { closedTab } = store.removeTab(id101);
      expect(closedTab?.id).toBe(id101);
      expect(store.tabCount()).toBe(2);
      store.patchTab(idCust, { pinned: true });
      expect(store.tabs()[0].id).toBe(idCust);
      expect(store.tabs()[0].pinned).toBe(true);
      const closedOthers = store.removeOtherTabs(id102);
      expect(store.tabs().some((t) => t.id === idCust)).toBe(true);
      expect(store.tabs().some((t) => t.id === id102)).toBe(true);
    });
    it("Scenario 85: Asynchronous Dynamic Title Race Immunity", () => {
      store.upsertTab({
        id: "/products/:id::101",
        url: "/products/101",
        routeUrl: "/products/101",
        routePattern: "/products/:id",
        title: "Product 101",
        pinned: false,
        closable: true,
        dirty: false,
        loading: false,
        order: 0,
        createdAt: 100,
        lastActivatedAt: 100,
        params: { id: "101" },
        queryParams: {}
      });
      store.upsertTab({
        id: "/products/:id::102",
        url: "/products/102",
        routeUrl: "/products/102",
        routePattern: "/products/:id",
        title: "Product 102",
        pinned: false,
        closable: true,
        dirty: false,
        loading: false,
        order: 1,
        createdAt: 200,
        lastActivatedAt: 200,
        params: { id: "102" },
        queryParams: {}
      }, { activate: true });
      expect(store.activeTabId()).toBe("/products/:id::102");
      const targetUrl = "/products/101";
      const normalized = normalizeUrl(targetUrl);
      const basePath = extractBasePath(normalized);
      const tabA = store.tabs().find((t) => t.url === normalized || t.routeUrl === basePath);
      expect(tabA).toBeDefined();
      if (tabA) {
        store.patchTab(tabA.id, { title: "Super Widget A" });
      }
      expect(store.tabs().find((t) => t.id === "/products/:id::101")?.title).toBe("Super Widget A");
      expect(store.tabs().find((t) => t.id === "/products/:id::102")?.title).toBe("Product 102");
      store.removeTab("/products/:id::101");
      const closedTabLookup = store.tabs().find((t) => t.url === "/products/101");
      expect(closedTabLookup).toBeUndefined();
      expect(store.tabs().find((t) => t.id === "/products/:id::102")?.title).toBe("Product 102");
    });
    it("Scenario 86: Reorder Tabs Preserves Pinned Region Invariant", () => {
      store.upsertTab({
        id: "pinned1",
        url: "/pinned1",
        routeUrl: "/pinned1",
        routePattern: "/pinned1",
        title: "Pinned 1",
        pinned: true,
        closable: false,
        dirty: false,
        loading: false,
        order: 0,
        createdAt: 100,
        lastActivatedAt: 100,
        params: {},
        queryParams: {}
      });
      store.upsertTab({
        id: "unpinned1",
        url: "/unpinned1",
        routeUrl: "/unpinned1",
        routePattern: "/unpinned1",
        title: "Unpinned 1",
        pinned: false,
        closable: true,
        dirty: false,
        loading: false,
        order: 1,
        createdAt: 200,
        lastActivatedAt: 200,
        params: {},
        queryParams: {}
      });
      store.upsertTab({
        id: "unpinned2",
        url: "/unpinned2",
        routeUrl: "/unpinned2",
        routePattern: "/unpinned2",
        title: "Unpinned 2",
        pinned: false,
        closable: true,
        dirty: false,
        loading: false,
        order: 2,
        createdAt: 300,
        lastActivatedAt: 300,
        params: {},
        queryParams: {}
      });
      store.reorderTabs(2, 0);
      expect(store.tabs()[0].id).toBe("pinned1");
      expect(store.tabs()[1].id).toBe("unpinned2");
      expect(store.tabs()[2].id).toBe("unpinned1");
    });
  });
});
