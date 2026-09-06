// src/app/tab-workspace/tab-workspace-persistence.service.ts

import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { AuthService } from '../modules/auth/services/auth-service';
import {
  AppTab,
  PersistedTabV3,
  PersistedWorkspaceV3,
  TabWorkspaceState
} from './tab-workspace.types';

const STORAGE_PREFIX = 'apex_ws_v3';
const DEBOUNCE_MS = 300;
const STATE_VERSION = 3;

@Injectable({ providedIn: 'root' })
export class TabWorkspacePersistenceService {
  private readonly platformId = inject(PLATFORM_ID);

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSavedKey: string | null = null;

  /**
   * Generates a tenant-scoped storage key.
   * Format: apex_ws_v3_{userId}_{organizationId}
   */
  getStorageKey(): string {
    if (!isPlatformBrowser(this.platformId)) return `${STORAGE_PREFIX}_ssr`;

    try {
      const rawUser = localStorage.getItem('apex_current_user');
      const user = rawUser ? JSON.parse(rawUser) : null;
      const userId = user?._id || user?.id || 'anonymous';
      const orgId = user?.organizationId || user?.currentOrganization?._id || localStorage.getItem('orgSlug') || 'default_org';
      return `${STORAGE_PREFIX}_${userId}_${orgId}`;
    } catch {
      return `${STORAGE_PREFIX}_anonymous_default_org`;
    }
  }

  /**
   * Loads persisted workspace state for the currently active tenant
   */
  loadWorkspace(): PersistedWorkspaceV3 | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const key = this.getStorageKey();
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as PersistedWorkspaceV3;
      if (!parsed || parsed.version !== STATE_VERSION || !Array.isArray(parsed.tabs)) {
        return null;
      }

      // Filter out corrupted or unroutable items
      const validTabs = parsed.tabs.filter(t => t && typeof t.url === 'string' && t.url.startsWith('/'));
      const validRecentlyClosed = Array.isArray(parsed.recentlyClosed)
        ? parsed.recentlyClosed.filter(t => t && typeof t.url === 'string' && t.url.startsWith('/'))
        : [];

      return {
        ...parsed,
        tabs: validTabs,
        recentlyClosed: validRecentlyClosed
      };
    } catch {
      return null;
    }
  }

  /**
   * Schedules a debounced save of the workspace state
   */
  scheduleSave(state: TabWorkspaceState): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.executeSave(state);
      this.saveTimer = null;
    }, DEBOUNCE_MS);
  }

  /**
   * Immediately writes workspace state to storage
   */
  executeSave(state: TabWorkspaceState): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const key = this.getStorageKey();
      this.lastSavedKey = key;

      const persistedTabs: PersistedTabV3[] = state.tabs.map(t => this.serializeTab(t));
      const persistedClosed: PersistedTabV3[] = state.recentlyClosed.map(t => this.serializeTab(t));

      const payload: PersistedWorkspaceV3 = {
        version: STATE_VERSION,
        activeTabId: state.activeTabId,
        tabs: persistedTabs,
        recentlyClosed: persistedClosed,
        savedAt: Date.now()
      };

      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Storage quota or privacy sandbox errors ignored gracefully
    }
  }

  /**
   * Clears persisted workspace for the current active tenant
   */
  clearActiveTenant(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const key = this.getStorageKey();
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
      // Also clean legacy keys
      sessionStorage.removeItem('apex__tab_state_v2');
      sessionStorage.removeItem('apex__tab_state');
    } catch {
      // Ignore
    }
  }

  /**
   * Clears all legacy and tenant workspace storage
   */
  clearAllWorkspaces(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith(STORAGE_PREFIX) || k.startsWith('apex__tab_state'))) {
          sessionStorage.removeItem(k);
        }
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(STORAGE_PREFIX) || k.startsWith('apex__tab_state'))) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
  }

  private serializeTab(tab: AppTab): PersistedTabV3 {
    return {
      id: tab.id,
      url: tab.url,
      routeUrl: tab.routeUrl,
      routePattern: tab.routePattern,
      title: tab.title,
      icon: tab.icon,
      pinned: !!tab.pinned,
      closable: tab.closable !== false,
      order: tab.order,
      createdAt: tab.createdAt,
      lastActivatedAt: tab.lastActivatedAt
    };
  }
}
