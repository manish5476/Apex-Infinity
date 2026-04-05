// ─────────────────────────────────────────────────────────────────────────────
// tab.types.ts  –  Core type contracts for the Apex Tab System
// ─────────────────────────────────────────────────────────────────────────────

export type TabId = string;

export interface TabMeta {
  /** Unique identifier — derived from route + serialised params */
  id: TabId;

  /** Human-readable label shown in the tab strip */
  label: string;

  /** Optional icon (PrimeNG icon class or SVG string) */
  icon?: string;

  /** Full Angular route path, e.g. '/customers/42' */
  path: string;

  /** Route params snapshot  */
  params: Record<string, string>;

  /** Query params snapshot */
  queryParams: Record<string, string>;

  /** Arbitrary payload — survives tab switches without re-fetching */
  data?: Record<string, unknown>;

  /** When the tab was opened */
  openedAt: number;

  /** Whether this tab is currently the active one */
  active: boolean;

  /** Whether the tab is pinned (cannot be closed) */
  pinned?: boolean;

  /** Whether the tab content is currently loading */
  loading?: boolean;
}

export interface TabState {
  tabs: TabMeta[];
  activeTabId: TabId | null;
}

export interface OpenTabOptions {
  /** Force replace an existing tab with the same id */
  replace?: boolean;
  /** Pass arbitrary data that lives on the tab */
  data?: Record<string, unknown>;
  /** Custom label override */
  label?: string;
  /** Custom icon override */
  icon?: string;
  /** Pin tab so it can't be closed */
  pinned?: boolean;
}
