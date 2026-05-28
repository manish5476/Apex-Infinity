export type TabId = string;

export type TabIdMode = 'fullUrl' | 'path' | 'routePattern';

export interface TabMeta {
  id: TabId;
  label: string;
  icon?: string;
  path: string;
  url: string;
  routePattern?: string;
  params: Record<string, string>;
  queryParams: Record<string, string>;
  fragment?: string | null;
  data?: Record<string, unknown>;
  openedAt: number;
  active: boolean;
  pinned?: boolean;
  loading?: boolean;
  dirty?: boolean;
  cache?: boolean;
  count?: number | string;
  lastAccessedAt?: number;
  scrollPosition?: { x: number; y: number };
}

export interface TabState {
  tabs: TabMeta[];
  activeTabId: TabId | null;
  recentlyClosed?: TabMeta[];
  version?: number;
}

export interface OpenTabOptions {
  replace?: boolean;
  data?: Record<string, unknown>;
  label?: string;
  icon?: string;
  pinned?: boolean;
  dirty?: boolean;
  id?: TabId;
  url?: string;
  cache?: boolean;
}

export interface RouteTabConfig {
  enabled: boolean;
  idMode: TabIdMode;
  label: string;
  icon?: string;
  pinned: boolean;
  cache: boolean;
  maxAgeMs?: number;
}
