// src/app/tab-workspace/tab-workspace.types.ts

import { Observable } from 'rxjs';

export type AppTabId = string;

export type TabReuseMode =
  | 'collection'  // Single tab for the route collection (e.g. /customers)
  | 'resource'    // Separate tab per resource identifier (e.g. /customers/:id)
  | 'exactUrl'    // Tab identified by exact URL + sorted query parameters
  | 'alwaysNew';  // Always opens a fresh tab with unique ID

export type TabQueryPolicy =
  | 'ignore'      // Query parameters don't affect tab identity
  | 'merge'       // Update existing tab's query params and URL
  | 'discriminate'; // Different queries produce distinct tabs

export interface RouteTabConfig {
  /** Whether this route creates/activates an application workspace tab */
  enabled?: boolean;
  /** Label/Title displayed in the tab strip */
  title?: string;
  /** PrimeNG icon class (e.g. 'pi pi-users') */
  icon?: string;
  /** Whether the tab can be closed by the user (default true) */
  closable?: boolean;
  /** Whether the tab is pinned at the start (default false) */
  pinned?: boolean;
  /** How tab identity is determined */
  reuseMode?: TabReuseMode;
  /** Parameter name identifying the resource (default: 'id') */
  resourceParam?: string;
  /** How query parameter changes are treated */
  queryPolicy?: TabQueryPolicy;
  /** Whether route component should be cached via RouteReuseStrategy (default false) */
  cache?: boolean;
  /** Maximum age for cached instances in ms */
  maxAgeMs?: number;
}

export interface AppTab {
  /** Unique canonical tab identifier */
  id: AppTabId;
  /** Full normalized URL with sorted query string */
  url: string;
  /** Clean base path without query string or fragment */
  routeUrl: string;
  /** Compatibility alias for base path */
  path?: string;
  /** Route configuration pattern (e.g. /customers/:id) */
  routePattern: string;
  /** Human-readable tab title */
  title: string;
  /** Compatibility alias for title */
  label?: string;
  /** PrimeNG icon class or SVG token */
  icon?: string;
  /** Whether tab is currently active */
  active?: boolean;
  /** Whether tab is pinned to the left */
  pinned: boolean;
  /** Whether tab has a close button */
  closable: boolean;
  /** Whether tab has unsaved changes */
  dirty: boolean;
  /** Whether tab is currently loading */
  loading: boolean;
  /** Display order in the tab list */
  order: number;
  /** Timestamp when tab was first opened */
  createdAt: number;
  /** Timestamp when tab was last activated */
  lastActivatedAt: number;
  /** Route parameters */
  params: Record<string, string>;
  /** Query parameters (stringified) */
  queryParams: Record<string, string>;
  /** URL fragment if any */
  fragment?: string | null;
  /** Custom route data */
  data?: Record<string, unknown>;
  /** Scroll position preservation */
  scrollPosition?: { x: number; y: number };
  /** Badge counter or indicator */
  badge?: number | string;
  /** Arbitrary metadata */
  metadata?: unknown;
}

export interface TabWorkspaceState {
  tabs: AppTab[];
  activeTabId: AppTabId | null;
  recentlyClosed: AppTab[];
  version: number;
}

export interface PersistedTabV3 {
  id: string;
  url: string;
  routeUrl: string;
  routePattern: string;
  title: string;
  icon?: string;
  pinned: boolean;
  closable: boolean;
  order: number;
  createdAt: number;
  lastActivatedAt: number;
}

export interface PersistedWorkspaceV3 {
  version: number;
  activeTabId: string | null;
  tabs: PersistedTabV3[];
  recentlyClosed: PersistedTabV3[];
  savedAt: number;
}

export interface TabWorkspaceConfig {
  maxTabs: number;
  maxClosedHistory: number;
  enablePersistence: boolean;
  enableKeyboardShortcuts: boolean;
  defaultReuseMode: TabReuseMode;
  storagePrefix: string;
  cacheMaxRoutes: number;
}

export interface TabDirtyStateProvider {
  isTabDirty(): boolean;
  getDirtyMessage?(): string;
  onTabSave?(): Promise<boolean> | Observable<boolean> | boolean;
  onTabDiscard?(): void;
}

export type TabWorkspaceEventType =
  | 'tabOpened'
  | 'tabClosed'
  | 'tabActivated'
  | 'tabMoved'
  | 'tabPinned'
  | 'tabUnpinned'
  | 'tabUpdated'
  | 'tabDirtyChanged'
  | 'workspaceRestored'
  | 'workspaceCleared';

export interface TabWorkspaceEvent {
  type: TabWorkspaceEventType;
  tab?: AppTab;
  tabId?: AppTabId;
  previousTabId?: AppTabId | null;
  timestamp: number;
}
