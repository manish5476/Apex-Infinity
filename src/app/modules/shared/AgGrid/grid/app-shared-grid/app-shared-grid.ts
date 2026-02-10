import {
  Component, ChangeDetectionStrategy,
  input, output, computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  GridApi, GridOptions, ColDef,
  GridReadyEvent, RowSelectionOptions,
  ModuleRegistry, AllCommunityModule,
  Theme, themeQuartz,
  ICellRendererParams,
  GetRowIdParams
} from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';

import { GridColDef } from '../grid.types';

// Child Components
import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
import { MasterCellEditorComponent } from '../dynamic Columns/master-cell-editor.component';
import { MasterCellRendererComponent } from '../dynamic Columns/master-cell-renderer.component';

ModuleRegistry.registerModules([AllCommunityModule]);

export type SharedGridEvent<T> =
  | { type: 'init'; api: GridApi<T> }
  | { type: 'rowAdded'; row: T }
  | { type: 'editStart'; row: T }
  | { type: 'save'; row: T; data: T }
  | { type: 'bulkSave'; rows: T[] }
  | { type: 'cancel'; row: T }
  | { type: 'delete'; row: T }
  | { type: 'bulkDelete'; rows: T[] }
  | { type: 'selectionChanged'; rows: T[] };

@Component({
  selector: 'app-shared-grid',
  standalone: true,
  imports: [CommonModule, AgGridAngular, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shared-grid.html',
  styleUrl: './app-shared-grid.scss',
})
export class AppSharedGrid<T extends { _id?: string; id?: string }> {

  // --- INPUTS ---
  readonly columns = input.required<GridColDef<T>[]>();
  readonly data = input<T[] | null>(null);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  readonly showActions = input(false);

  // --- OUTPUTS ---
  readonly gridEvent = output<SharedGridEvent<T>>();

  // --- INTERNAL STATE ---
  private api!: GridApi<T>;

  // 1. DRAFT STATE: Stores "in-progress" edits before saving
  // Key = Row ID, Value = Partial<T> (Modified fields)
  draftMap = new Map<string, Partial<T>>();

  // 2. SIGNALS for UI
  editingIds = signal<Set<string>>(new Set());
  selectedCount = signal(0);
  isBulkEditing = signal(false);

  // --- GRID CONFIGURATION ---
  gridOptions: GridOptions<T> = {
    suppressClickEdit: true,
    animateRows: true,

    // Robust ID generation (Supports MongoDB _id, generic id, or temp _tempId)
    getRowId: (p: GetRowIdParams<T>) => {
      const data = p.data;
      return data._id || data.id || (data as any)._tempId;
    },

    // Pass THIS component instance to context so cells can call methods
    context: {
      componentParent: this
    }
  };

  // --- COLUMN DEFINITIONS (Using Optimized Selector) ---
  columnDefs = computed<ColDef<T>[]>(() => {
    const baseCols: ColDef<T>[] = this.columns().map(col => {
      // If no config, just render normal text
      // if (!col.cellConfig) return col;

      if (!col.cellConfig) return { ...col, editable: false };
      return {
        ...col,
        editable: false,
        cellRendererSelector: (params: ICellRendererParams<T>) => {
          const id = params.node.id!;
          const isEditing = this.editingIds().has(id);
          return {
            component: isEditing ? MasterCellEditorComponent : MasterCellRendererComponent,
            params: {
              value: isEditing ? (this.draftMap.get(id)?.[col.field as keyof T] ?? params.value) : params.value,
              cellConfig: col.cellConfig
            }
          };
        }
      };
    });

    // Append Action Column if enabled
    if (this.showActions()) {
      baseCols.push({
        headerName: 'Actions',
        colId: '__actions__',
        pinned: 'right',
        width: 140,
        cellRenderer: AppSharedGridActionButton
      });
    }
    return baseCols;
  });

  get selectionOptions(): RowSelectionOptions | undefined {
    if (!this.selectionMode()) return undefined;
    return {
      mode: this.selectionMode() === 'single' ? 'singleRow' : 'multiRow'
    };
  }

  // --- LIFECYCLE ---

  onGridReady(e: GridReadyEvent<T>) {
    this.api = e.api;
    this.gridEvent.emit({ type: 'init', api: this.api });
  }

  onSelectionChanged() {
    const selected = this.api.getSelectedRows();
    this.selectedCount.set(selected.length);
    this.gridEvent.emit({ type: 'selectionChanged', rows: selected });
  }

  // --- FEATURE: ADD NEW ROW (Master Feature) ---

  addNewRow() {
    const tempId = `new_${Date.now()}`;
    const newRow: any = { _tempId: tempId };

    // Initialize fields with null or defaults
    this.columns().forEach(c => {
      if (c.field) newRow[c.field] = null;
    });

    // 1. Transaction: Add to Grid immediately
    this.api.applyTransaction({
      add: [newRow],
      addIndex: 0 // Add to top
    });

    // 2. Auto-Start Edit & Init Draft
    this.updateEditingState([tempId], true);
    this.draftMap.set(tempId, { ...newRow });

    this.gridEvent.emit({ type: 'rowAdded', row: newRow });
  }

  // --- FEATURE: BULK EDITING ---

  enableBulkEdit() {
    const selected = this.api.getSelectedNodes();
    if (selected.length === 0) return;

    const idsToEdit: string[] = [];

    selected.forEach(node => {
      if (node.id && node.data) {
        idsToEdit.push(node.id);
        // Initialize draft with current data
        this.draftMap.set(node.id, { ...node.data });
      }
    });

    this.updateEditingState(idsToEdit, true);
    this.isBulkEditing.set(true);
  }

  saveBulkEdit() {
    const updates: T[] = [];
    const nodesToRefresh: any[] = [];
    const idsToStop: string[] = [];

    // Process all currently editing IDs
    this.editingIds().forEach(id => {
      const node = this.api.getRowNode(id);
      const changes = this.draftMap.get(id);

      // We ensure node.data exists before proceeding
      if (node && node.data && changes) {

        // 1. Force cast the merged result to T.
        const finalData = { ...node.data, ...changes } as T;

        // 2. Safely remove the temp ID property
        delete (finalData as any)._tempId;

        // Update Grid Data
        node.setData(finalData);
        updates.push(finalData);
        nodesToRefresh.push(node);
      }
      idsToStop.push(id);
    });

    // Cleanup
    this.draftMap.clear();
    this.updateEditingState(idsToStop, false);
    this.isBulkEditing.set(false);

    this.gridEvent.emit({ type: 'bulkSave', rows: updates });
  }

  cancelBulkEdit() {
    const idsToStop: string[] = [];

    this.editingIds().forEach(id => {
      idsToStop.push(id);

      // Check for new rows that were never saved -> Remove them
      if (id.startsWith('new_')) {
        const node = this.api.getRowNode(id);
        if (node && node.data) {
          this.api.applyTransaction({ remove: [node.data] });
        }
      }
    });

    this.draftMap.clear();
    this.updateEditingState(idsToStop, false);
    this.isBulkEditing.set(false);
  }

  deleteSelected() {
    const selected = this.api.getSelectedRows();
    if (selected.length === 0) return;

    this.api.applyTransaction({ remove: selected });
    this.gridEvent.emit({ type: 'bulkDelete', rows: selected });
    this.selectedCount.set(0);
  }

  // --- FEATURE: SINGLE ROW ACTIONS ---

  handleRowAction(action: string, row: T) {
    const id = this.getId(row);
    const node = this.api.getRowNode(id);
    if (!id || !node) return;

    switch (action) {
      case 'edit':
        this.draftMap.set(id, { ...row });
        this.updateEditingState([id], true);
        this.gridEvent.emit({ type: 'editStart', row });
        break;

      case 'save':
        const changes = this.draftMap.get(id);
        // Merge & Cast
        const finalData = { ...row, ...changes } as T;
        delete (finalData as any)._tempId;

        // Commit to Grid
        node.setData(finalData);

        this.draftMap.delete(id);
        this.updateEditingState([id], false);
        this.gridEvent.emit({ type: 'save', row: finalData, data: finalData });
        break;

      case 'cancel':
        this.draftMap.delete(id);
        // If new row, remove entirely
        if (id.startsWith('new_')) {
          this.api.applyTransaction({ remove: [row] });
        } else {
          this.updateEditingState([id], false);
        }
        this.gridEvent.emit({ type: 'cancel', row });
        break;

      case 'delete':
        this.api.applyTransaction({ remove: [row] });
        this.gridEvent.emit({ type: 'delete', row });
        break;
    }
  }

  /**
   * Called by MasterCellEditorComponent to update Draft State
   */
  updateDraft(id: string, field: string, value: any) {
    const current = this.draftMap.get(id) || {};
    this.draftMap.set(id, { ...current, [field]: value });
  }

  // --- HELPERS ---

  private updateEditingState(ids: string[], isEditing: boolean) {
    const currentSet = new Set(this.editingIds());
    const nodesToRefresh: any[] = [];

    ids.forEach(id => {
      if (isEditing) currentSet.add(id);
      else currentSet.delete(id);

      const node = this.api.getRowNode(id);
      if (node) nodesToRefresh.push(node);
    });

    // Update Signal
    this.editingIds.set(currentSet);

    // Efficient Refresh (Only refreshes changed rows, not whole grid)
    if (nodesToRefresh.length > 0) {
      this.api.refreshCells({ rowNodes: nodesToRefresh, force: true });
    }
  }

  private getId(row: any): string {
    return row._id ?? row.id ?? row._tempId ?? '';
  }

  // Computed Theme for Styling
  readonly agTheme = computed<Theme>(() =>
    themeQuartz.withParams({
      fontFamily: 'var(--font-body)',
      fontSize: '13px',
      backgroundColor: 'var(--theme-bg-primary)',
      headerBackgroundColor: 'var(--theme-bg-secondary)',
      foregroundColor: 'var(--theme-text-primary)',
      borderColor: 'var(--theme-border-primary)',
      rowHoverColor: 'var(--component-bg-hover)',
      rowHeight: 42,
      headerHeight: 46,
      spacing: 5,
    })
  );
}
