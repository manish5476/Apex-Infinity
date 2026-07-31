/**
 * Public API barrel for the Apex Enterprise DataGrid.
 *
 * Import from here in any consuming module:
 *   import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
 */

// ─── Main Component ───────────────────────────────────────────────────────────
export { DataGridComponent } from './data-grid.component';

// ─── Type System ──────────────────────────────────────────────────────────────
export type {
  GridColumn,
  GridColumnType,
  GridRowAction,
  GridBulkAction,
  GridRowState,
  GridRowSaveEvent,
  GridBulkActionEvent,
  GridCellChangeEvent,
  GridSortState,
  GridFilterState,
  GridPageState,
  GridSavedView,
  GridDensity,
  GridPersistedState,
  GridUndoEntry,
  GridContext,
  GridPlugin,
  SelectOption,
} from './grid-types';

// ─── Plugin System ────────────────────────────────────────────────────────────
export { BaseGridPlugin, GRID_PLUGINS } from './grid-plugin';

// ─── Services ─────────────────────────────────────────────────────────────────
export { GridService } from './grid.service';
export { GridStateService } from './grid-state.service';

// ─── Sub-Components (for advanced usage / extension) ─────────────────────────
export { GridToolbarComponent } from './components/grid-toolbar.component';
export { GridCellComponent } from './components/grid-cell.component';
export { GridActionsComponent } from './components/grid-actions.component';
export { GridPaginationComponent } from './components/grid-pagination.component';
export { GridEmptyStateComponent } from './components/grid-empty-state.component';
export { GridLoadingComponent } from './components/grid-loading.component';
export { GridFilterBarComponent } from './components/grid-filter-bar.component';
export { GridColumnManagerComponent } from './components/grid-column-manager.component';
export { GridSavedViewsComponent } from './components/grid-saved-views.component';
export { GridContextMenuComponent } from './components/grid-context-menu.component';
