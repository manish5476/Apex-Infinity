// src/app/tab-workspace/tab-workspace.service.ts

import { Injectable, inject } from '@angular/core';
import { TabWorkspaceManager } from './tab-workspace.manager';
import {
  AppTab,
  AppTabId,
  TabDirtyStateProvider,
  TabWorkspaceEvent
} from './tab-workspace.types';
import { Observable } from 'rxjs';

/**
 * TabWorkspaceService
 *
 * Developer-facing facade for opening, managing, and observing application workspace tabs.
 * Decoupled from individual feature domains.
 */
@Injectable({ providedIn: 'root' })
export class TabWorkspaceService {
  private readonly manager = inject(TabWorkspaceManager);

  // ── Reactive State Signals ────────────────────────────────────────────────
  readonly tabs = this.manager.tabs;
  readonly activeTab = this.manager.activeTab;
  readonly activeTabId = this.manager.activeTabId;
  readonly tabCount = this.manager.tabCount;
  readonly hasTabs = this.manager.hasTabs;
  readonly pinnedTabs = this.manager.pinnedTabs;
  readonly unpinnedTabs = this.manager.unpinnedTabs;
  readonly recentlyClosed = this.manager.recentlyClosed;
  readonly events$: Observable<TabWorkspaceEvent> = this.manager.workspaceEvents$;

  // ── Navigation & Activation ───────────────────────────────────────────────

  /**
   * Opens an application route in a workspace tab.
   * If the tab already exists according to route reuse policy, it will be activated.
   */
  open(url: string | string[], options?: { title?: string; icon?: string; pinned?: boolean }): Promise<boolean> {
    return this.manager.openRoute(url, options);
  }

  /**
   * Activates a tab by its unique ID
   */
  activate(id: AppTabId): Promise<boolean> {
    return this.manager.navigateToTab(id);
  }

  /**
   * Activates the next sequential tab in the list (cycling to start if at end)
   */
  activateNext(): void {
    const tabs = this.tabs();
    if (tabs.length < 2) return;
    const currentId = this.activeTabId();
    const currentIndex = tabs.findIndex(t => t.id === currentId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    void this.activate(tabs[nextIndex].id);
  }

  /**
   * Activates the previous sequential tab in the list
   */
  activatePrev(): void {
    const tabs = this.tabs();
    if (tabs.length < 2) return;
    const currentId = this.activeTabId();
    const currentIndex = tabs.findIndex(t => t.id === currentId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    void this.activate(tabs[prevIndex].id);
  }

  // ── Tab Closure ───────────────────────────────────────────────────────────

  /**
   * Closes a tab by ID with unsaved-change protection
   */
  close(id: AppTabId): Promise<boolean> {
    return this.manager.closeTab(id);
  }

  /**
   * Closes the currently active tab
   */
  closeCurrent(): Promise<boolean> {
    return this.manager.closeActiveTab();
  }

  /**
   * Closes all other tabs, keeping pinned tabs and the specified tab
   */
  closeOthers(exceptId?: AppTabId): Promise<boolean> {
    return this.manager.closeOtherTabs(exceptId);
  }

  /**
   * Closes all unpinned tabs to the right of the given tab
   */
  closeToRight(fromId: AppTabId): Promise<boolean> {
    return this.manager.closeTabsToRight(fromId);
  }

  /**
   * Closes all unpinned tabs
   */
  closeAll(): Promise<boolean> {
    return this.manager.closeAllTabs();
  }

  /**
   * Reopens the most recently closed tab
   */
  reopenClosed(): Promise<boolean> {
    return this.manager.reopenClosedTab();
  }

  // ── Tab State & Customization ─────────────────────────────────────────────

  /**
   * Pins or unpins a tab
   */
  togglePin(id: AppTabId): void {
    this.manager.togglePin(id);
  }

  /**
   * Reorders tabs by index (e.g. drag & drop)
   */
  move(fromIndex: number, toIndex: number): void {
    this.manager.moveTab(fromIndex, toIndex);
  }

  /**
   * Updates title for a specific tab ID
   */
  updateTitle(id: AppTabId, title: string): void {
    this.manager.updateTitle(id, title);
  }

  /**
   * Safely updates title for whatever tab matches the specified route URL.
   * Safe against asynchronous HTTP race conditions.
   */
  updateTitleForUrl(url: string, title: string): void {
    this.manager.updateTitleForUrl(url, title);
  }

  /**
   * Flags a tab as dirty (has unsaved changes)
   */
  setDirty(id: AppTabId, dirty = true): void {
    this.manager.setDirty(id, dirty);
  }

  /**
   * Registers a dirty state provider for the active component
   */
  registerDirtyProvider(provider: TabDirtyStateProvider): () => void {
    return this.manager.registerDirtyProvider(provider);
  }

  /**
   * Clears the entire workspace (used on logout or tenant switch)
   */
  clear(): void {
    this.manager.clearWorkspace();
  }
}
