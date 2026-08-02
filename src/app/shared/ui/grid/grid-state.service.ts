import { Injectable } from '@angular/core';
import { GridPersistedState, GridSavedView, GridDensity, GridSortState } from './grid-types';
const STORAGE_PREFIX = 'apex_grid_v2_';
function defaultState(): GridPersistedState {
  return {
    visibleColumns: [],
    columnOrder: [],
    columnWidths: {},
    sortState: [],
    density: 'compact',
    savedViews: [],
  };
}

/**
 * Service: GridStateService
 * Persists grid UI state (column visibility, widths, density, saved views) to localStorage.
 * Each grid instance is identified by its [gridId] input.
 * Provided in root so it can be shared across multiple grid instances.
 */
@Injectable({ providedIn: 'root' })
export class GridStateService {

  saveState(gridId: string, patch: Partial<GridPersistedState>): void {
    try {
      const current = this.loadState(gridId) ?? defaultState();
      const merged: GridPersistedState = { ...current, ...patch };
      localStorage.setItem(`${STORAGE_PREFIX}${gridId}`, JSON.stringify(merged));
    } catch {
      // localStorage may be unavailable (private browsing, storage full, etc.)
    }
  }

  loadState(gridId: string): GridPersistedState | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${gridId}`);
      if (!raw) return null;
      return JSON.parse(raw) as GridPersistedState;
    } catch {
      return null;
    }
  }

  clearState(gridId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${gridId}`);
    } catch { /* ignore */ }
  }

  // ─── Saved Views ─────────────────────────────────────────────────────────

  getSavedViews(gridId: string): GridSavedView[] {
    return this.loadState(gridId)?.savedViews ?? [];
  }

  saveView(gridId: string, view: GridSavedView): void {
    const state = this.loadState(gridId) ?? defaultState();
    const views = [...(state.savedViews ?? [])];
    const idx = views.findIndex(v => v.id === view.id);
    if (idx >= 0) {
      views[idx] = view;
    } else {
      views.push(view);
    }
    this.saveState(gridId, { savedViews: views });
  }

  deleteView(gridId: string, viewId: string): void {
    const state = this.loadState(gridId);
    if (!state) return;
    const views = (state.savedViews ?? []).filter(v => v.id !== viewId);
    this.saveState(gridId, { savedViews: views });
  }

  // ─── Individual Setters ──────────────────────────────────────────────────

  setDensity(gridId: string, density: GridDensity): void {
    this.saveState(gridId, { density });
  }

  setVisibleColumns(gridId: string, columns: string[]): void {
    this.saveState(gridId, { visibleColumns: columns });
  }

  setColumnOrder(gridId: string, order: string[]): void {
    this.saveState(gridId, { columnOrder: order });
  }

  setColumnWidths(gridId: string, widths: Record<string, string>): void {
    this.saveState(gridId, { columnWidths: widths });
  }

  setSortState(gridId: string, sortState: GridSortState[]): void {
    this.saveState(gridId, { sortState });
  }
}
