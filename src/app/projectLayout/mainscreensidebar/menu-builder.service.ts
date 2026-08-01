import { Injectable, computed, inject } from '@angular/core';
  import { PermissionService } from '@core/auth/services/permission.service';
  import { NavGroup, NavItem, NAVIGATION_GROUPS } from './navigation-model';

  // ─────────────────────────────────────────────────────────────────────────────
  // Types
  // ─────────────────────────────────────────────────────────────────────────────

  /** A fully resolved, searchable navigation result (flat, with breadcrumb). */
  export interface NavSearchResult {
    readonly label: string;
    readonly routerLink: readonly string[];
    readonly icon: string;
    readonly breadcrumb: string;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MenuBuilderService
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * MenuBuilderService — Compiles the permission-filtered navigation tree.
   *
   * Responsibilities:
   *   1. Filter NAVIGATION_GROUPS by the current user's permissions.
   *   2. Produce a flat search index for the spotlight search.
   *
   * The sidebar component is a RENDERER; this service is the BUILDER.
   * Zero permission logic should exist in any template or sidebar component.
   *
   * Both signals recompute automatically when permissions change.
   */
  @Injectable({ providedIn: 'root' })
  export class MenuBuilderService {
    private readonly permService = inject(PermissionService);

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Permission-filtered navigation groups, reactive to user permission changes.
     * Empty groups (all items filtered out) are removed.
     */
    readonly navigationGroups = computed((): readonly NavGroup[] => {
      this.permService.permissions(); // register signal dependency — recomputes on change
      return NAVIGATION_GROUPS
        .map(group => ({ ...group, items: this.filterItems(group.items) }))
        .filter(group => group.items.length > 0);
    });

    /**
     * Flat, searchable index of all navigable leaf items with breadcrumb context.
     * Derived from `navigationGroups` — always stays in sync with permissions.
     */
    readonly searchIndex = computed((): readonly NavSearchResult[] => {
      const results: NavSearchResult[] = [];
      const traverse = (items: readonly NavItem[], ancestorLabel: string): void => {
        for (const item of items) {
          const breadcrumb = ancestorLabel ? `${ancestorLabel} › ${item.label}` : item.label;
          if (item.routerLink) {
            results.push({
              label: item.label,
              routerLink: item.routerLink,
              icon: item.icon,
              breadcrumb: ancestorLabel,
            });
          }
          if (item.items?.length) {
            traverse(item.items, breadcrumb);
          }
        }
      };
      this.navigationGroups().forEach(group => traverse(group.items, ''));
      return results;
    });

    // ── Private helpers ───────────────────────────────────────────────────────

    private filterItems(items: readonly NavItem[]): NavItem[] {
      return items.reduce<NavItem[]>((acc, item) => {
        // Permission gate — any permission in the array grants access
        if (item.permissions?.length && !this.permService.check(item.permissions as string[])) {
          return acc;
        }

        if (item.items?.length) {
          const filtered = this.filterItems(item.items);
          // Keep parent accordion only if it has visible children (or has its own route)
          if (filtered.length === 0 && !item.routerLink) return acc;
          acc.push({ ...item, items: filtered });
        } else {
          acc.push(item);
        }

        return acc;
      }, []);
    }
  }
