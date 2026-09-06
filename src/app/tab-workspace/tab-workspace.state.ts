// src/app/tab-workspace/tab-workspace.state.ts

import { Injectable, computed, signal } from '@angular/core';
import { AppTab, AppTabId, TabWorkspaceState } from './tab-workspace.types';

const DEFAULT_MAX_TABS = 30;
const DEFAULT_MAX_CLOSED = 20;
const STATE_VERSION = 3;

@Injectable({ providedIn: 'root' })
export class TabWorkspaceStateStore {
  private readonly _state = signal<TabWorkspaceState>({
    tabs: [],
    activeTabId: null,
    recentlyClosed: [],
    version: STATE_VERSION
  });

  // ── Public Readonly Signals ───────────────────────────────────────────────
  readonly state = this._state.asReadonly();
  readonly tabs = computed(() => this._state().tabs);
  readonly activeTabId = computed(() => this._state().activeTabId);
  readonly activeTab = computed(() => {
    const activeId = this._state().activeTabId;
    if (!activeId) return null;
    return this._state().tabs.find(t => t.id === activeId) ?? null;
  });
  readonly tabCount = computed(() => this._state().tabs.length);
  readonly hasTabs = computed(() => this._state().tabs.length > 0);
  readonly pinnedTabs = computed(() => this._state().tabs.filter(t => t.pinned));
  readonly unpinnedTabs = computed(() => this._state().tabs.filter(t => !t.pinned));
  readonly recentlyClosed = computed(() => this._state().recentlyClosed);

  // ── Config ────────────────────────────────────────────────────────────────
  private maxTabs = DEFAULT_MAX_TABS;
  private maxClosed = DEFAULT_MAX_CLOSED;

  configure(config: { maxTabs?: number; maxClosedHistory?: number }): void {
    if (config.maxTabs && config.maxTabs > 0) this.maxTabs = config.maxTabs;
    if (config.maxClosedHistory && config.maxClosedHistory > 0) this.maxClosed = config.maxClosedHistory;
  }

  // ── Tab Lifecycle Mutations ───────────────────────────────────────────────

  /**
   * Inserts or updates a tab in the workspace
   */
  upsertTab(incoming: AppTab, options: { activate?: boolean } = {}): { tab: AppTab; isNew: boolean } {
    const shouldActivate = options.activate !== false;
    let isNew = false;
    let resultingTab = incoming;

    this._state.update(current => {
      const existingIndex = current.tabs.findIndex(t => t.id === incoming.id);
      let nextTabs: AppTab[];

      if (existingIndex >= 0) {
        // Tab exists: update it
        const existing = current.tabs[existingIndex];
        resultingTab = {
          ...existing,
          ...incoming,
          // Retain immutable metadata
          createdAt: existing.createdAt,
          pinned: incoming.pinned ?? existing.pinned,
          dirty: incoming.dirty !== undefined ? incoming.dirty : existing.dirty,
          // If title was custom updated and incoming is default/fallback, retain existing custom title
          title: incoming.title || existing.title,
          lastActivatedAt: shouldActivate ? Date.now() : existing.lastActivatedAt,
          active: shouldActivate
        };

        nextTabs = current.tabs.map((t, i) => (i === existingIndex ? resultingTab : t));
      } else {
        // New tab: insert into array
        isNew = true;
        resultingTab = {
          ...incoming,
          active: shouldActivate,
          createdAt: incoming.createdAt || Date.now(),
          lastActivatedAt: shouldActivate ? Date.now() : incoming.lastActivatedAt || Date.now()
        };

        if (resultingTab.pinned) {
          // Pinned tabs are placed after existing pinned tabs, before unpinned tabs
          const firstUnpinnedIndex = current.tabs.findIndex(t => !t.pinned);
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
          // Unpinned tabs append at the end
          nextTabs = [...current.tabs, resultingTab];
        }
      }

      // Enforce tab limit via LRU eviction of unpinned non-dirty tabs
      nextTabs = this.evictExceedingTabs(nextTabs, resultingTab.id);

      // Re-index order
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
  activateTab(id: AppTabId): boolean {
    const current = this._state();
    const exists = current.tabs.some(t => t.id === id);
    if (!exists) return false;

    this._state.update(state => ({
      ...state,
      activeTabId: id,
      tabs: state.tabs.map(t => ({
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
  removeTab(id: AppTabId): { closedTab: AppTab | null; nextActiveId: AppTabId | null } {
    const current = this._state();
    const target = current.tabs.find(t => t.id === id);
    if (!target) return { closedTab: null, nextActiveId: current.activeTabId };

    const targetIndex = current.tabs.findIndex(t => t.id === id);
    const remaining = current.tabs.filter(t => t.id !== id);
    const updatedRecentlyClosed = [target, ...current.recentlyClosed].slice(0, this.maxClosed);

    let nextActiveId = current.activeTabId;
    if (current.activeTabId === id) {
      if (remaining.length > 0) {
        // Activate adjacent tab: prefer left (targetIndex - 1), else right (targetIndex)
        const nextIdx = Math.max(0, Math.min(targetIndex - 1, remaining.length - 1));
        nextActiveId = remaining[nextIdx].id;
      } else {
        nextActiveId = null;
      }
    }

    this._state.update(state => ({
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
  removeOtherTabs(exceptId: AppTabId): AppTab[] {
    const current = this._state();
    const closed = current.tabs.filter(t => !t.pinned && t.id !== exceptId);
    const remaining = current.tabs.filter(t => t.pinned || t.id === exceptId);

    this._state.update(state => ({
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
  removeTabsToRight(fromId: AppTabId): AppTab[] {
    const current = this._state();
    const index = current.tabs.findIndex(t => t.id === fromId);
    if (index === -1) return [];

    const closed = current.tabs.filter((t, i) => i > index && !t.pinned);
    const remaining = current.tabs.filter((t, i) => i <= index || t.pinned);

    let nextActiveId = current.activeTabId;
    const activeIsRemaining = remaining.some(t => t.id === nextActiveId);
    if (!activeIsRemaining) {
      nextActiveId = fromId;
    }

    this._state.update(state => ({
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
  removeAllTabs(): AppTab[] {
    const current = this._state();
    const closed = current.tabs.filter(t => !t.pinned);
    const pinned = current.tabs.filter(t => t.pinned);
    const nextActiveId = pinned.length > 0 ? pinned[pinned.length - 1].id : null;

    this._state.update(state => ({
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
  popRecentlyClosed(): AppTab | null {
    const current = this._state();
    if (current.recentlyClosed.length === 0) return null;

    const [popped, ...rest] = current.recentlyClosed;
    this._state.update(state => ({
      ...state,
      recentlyClosed: rest
    }));

    return popped;
  }

  /**
   * Partially updates a tab's metadata
   */
  patchTab(id: AppTabId, patch: Partial<AppTab>): boolean {
    const current = this._state();
    const exists = current.tabs.some(t => t.id === id);
    if (!exists) return false;

    this._state.update(state => ({
      ...state,
      tabs: state.tabs.map(t => (t.id === id ? { ...t, ...patch } : t))
    }));

    return true;
  }

  /**
   * Reorders tabs (e.g. from drag & drop)
   */
  reorderTabs(fromIndex: number, toIndex: number): void {
    this._state.update(state => {
      const tabs = [...state.tabs];
      if (fromIndex < 0 || fromIndex >= tabs.length || toIndex < 0 || toIndex >= tabs.length) {
        return state;
      }

      const [moved] = tabs.splice(fromIndex, 1);
      if (!moved) return state;

      // Pinned tabs must remain in the pinned region
      if (moved.pinned) {
        const lastPinnedIdx = tabs.filter(t => t.pinned).length;
        toIndex = Math.min(toIndex, lastPinnedIdx);
      } else {
        const firstUnpinnedIdx = tabs.findIndex(t => !t.pinned);
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
  resetState(): void {
    this._state.set({
      tabs: [],
      activeTabId: null,
      recentlyClosed: [],
      version: STATE_VERSION
    });
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private evictExceedingTabs(tabs: AppTab[], protectedId: AppTabId): AppTab[] {
    let result = [...tabs];
    while (result.length > this.maxTabs) {
      // Find least recently activated, unpinned, non-dirty tab that is not currently protected
      const evictable = result
        .filter(t => !t.pinned && !t.dirty && t.id !== protectedId)
        .sort((a, b) => a.lastActivatedAt - b.lastActivatedAt)[0];

      if (!evictable) break; // All remaining tabs are pinned or dirty
      result = result.filter(t => t.id !== evictable.id);
    }
    return result;
  }
}
