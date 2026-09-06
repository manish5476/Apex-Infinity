// src/app/Tabbing/Service/tab.service.ts
// Backward-compatibility bridge delegating to the universal TabWorkspaceService

import { Injectable, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { TabWorkspaceService } from '../../tab-workspace/tab-workspace.service';
import { AppTab, AppTabId, TabWorkspaceState } from '../../tab-workspace/tab-workspace.types';
import { OpenTabOptions, TabId, TabMeta, TabState } from '../tab.types';

@Injectable({ providedIn: 'root' })
export class TabService {
  private readonly workspace = inject(TabWorkspaceService);

  readonly tabs = this.workspace.tabs;
  readonly activeTab = this.workspace.activeTab;
  readonly activeTabId = this.workspace.activeTabId;
  readonly tabCount = this.workspace.tabCount;
  readonly recentlyClosed = this.workspace.recentlyClosed;

  readonly state = computed<TabState>(() => ({
    tabs: this.tabs() as unknown as TabMeta[],
    activeTabId: this.activeTabId(),
    recentlyClosed: this.recentlyClosed() as unknown as TabMeta[],
    version: 3
  }));

  readonly tabs$: Observable<any> = toObservable(this.tabs);
  readonly activeTab$: Observable<any> = toObservable(this.activeTab);
  readonly activeTabId$: Observable<TabId | null> = toObservable(this.activeTabId);

  openTab(
    path: string,
    label: string,
    options: OpenTabOptions = {},
    navigationExtras?: any
  ): void {
    void this.workspace.open(path, {
      title: options.label ?? label,
      icon: options.icon,
      pinned: options.pinned
    });
  }

  registerTab(
    path: string,
    label: string,
    _queryParams: Record<string, string> = {},
    options: Pick<OpenTabOptions, 'icon' | 'pinned' | 'data' | 'cache'> = {}
  ): void {
    void this.workspace.open(path, {
      title: label,
      icon: options.icon,
      pinned: options.pinned
    });
  }

  activateTab(id: TabId): void {
    void this.workspace.activate(id);
  }

  activateNext(): void {
    this.workspace.activateNext();
  }

  activatePrev(): void {
    this.workspace.activatePrev();
  }

  closeTab(id: TabId): void {
    void this.workspace.close(id);
  }

  closeActiveTab(): void {
    void this.workspace.closeCurrent();
  }

  closeOtherTabs(exceptId?: TabId): void {
    void this.workspace.closeOthers(exceptId);
  }

  closeTabsToRight(fromId: TabId): void {
    void this.workspace.closeToRight(fromId);
  }

  closeAllTabs(): void {
    void this.workspace.closeAll();
  }

  reopenClosedTab(): void {
    void this.workspace.reopenClosed();
  }

  updateActiveTab(options: Partial<Omit<TabMeta, 'id' | 'path'>>): void {
    const activeId = this.activeTabId();
    if (activeId && options.label) {
      this.workspace.updateTitle(activeId, options.label);
    }
  }

  updateTab(id: TabId, options: Partial<Omit<TabMeta, 'id' | 'path'>>): void {
    if (options.label) {
      this.workspace.updateTitle(id, options.label);
    }
  }

  setDirty(id: TabId, dirty = true): void {
    this.workspace.setDirty(id, dirty);
  }

  togglePin(id: TabId): void {
    this.workspace.togglePin(id);
  }

  moveTab(fromIndex: number, toIndex: number): void {
    this.workspace.move(fromIndex, toIndex);
  }

  isActive(id: TabId): boolean {
    return this.activeTabId() === id;
  }

  syncFromRouter(_path: string, _queryParams: Record<string, string> = {}): void {
    // Router events are handled automatically by TabWorkspaceManager
  }

  reset(): void {
    this.workspace.clear();
  }

  buildTabId(path: string, _params: Record<string, string>): TabId {
    return path;
  }
}
