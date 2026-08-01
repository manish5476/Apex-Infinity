// ─────────────────────────────────────────────────────────────────────────────
// menu-items.constants.ts — Backward Compatibility Shim
//
// The canonical navigation configuration has moved to navigation-model.ts.
// This file re-exports the types and constants that existing consumers
// (e.g. mainscreen-header.ts) still import, so they continue to work
// without modification.
//
// DO NOT add new navigation items here. Edit navigation-model.ts instead.
// ─────────────────────────────────────────────────────────────────────────────

export type { NavItem as MenuItem, NavGroup } from './navigation-model';
export { NAVIGATION_GROUPS } from './navigation-model';

import { NAVIGATION_GROUPS } from './navigation-model';
import type { NavItem } from './navigation-model';

/** Flat list of top-level menu items (each still carrying their .items children). */
export const SIDEBAR_MENU: NavItem[] = NAVIGATION_GROUPS.flatMap(g => g.items) as NavItem[];
