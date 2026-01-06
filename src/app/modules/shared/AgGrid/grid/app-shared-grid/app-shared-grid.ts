import {
  Component, ChangeDetectionStrategy,
  input, output, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  GridApi, GridOptions, ColDef,
  GridReadyEvent, RowSelectionOptions,
  ModuleRegistry, AllCommunityModule,
  Theme,
  themeQuartz,
  RowEditingStoppedEvent
} from 'ag-grid-community';

import { GridColDef } from '../grid.types';
import { MasterCellEditorComponent } from '../dynamic Columns/master-cell-editor.component';
import { MasterCellRendererComponent } from '../dynamic Columns/master-cell-renderer.component';
import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
ModuleRegistry.registerModules([AllCommunityModule]);

export type SharedGridEvent<T> =
  | { type: 'init'; api: GridApi<T> }
  | { type: 'editStart'; row: T }
  | { type: 'save'; row: T }
  | { type: 'Entersave'; row: T }
  | { type: 'reachedBottom'; row: T }
  | { type: 'cellClicked'; row: T; field: keyof T; oldValue?: any; value?: any } // renamed newValue to value
  | { type: 'cellEdited'; row: T; field: keyof T; oldValue?: any; value?: any } // renamed newValue to value
  | { type: 'cancel'; row: T }
  | { type: 'delete'; row: T }
  | { type: 'selectionChanged'; rows: T[] };

@Component({
  selector: 'app-shared-grid',
  imports: [
    CommonModule,
    AgGridAngular
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shared-grid.html',
  styleUrl: './app-shared-grid.scss',
})
export class AppSharedGrid<T extends { _id?: string; id?: string }> {
  readonly columns = input.required<GridColDef<T>[]>();
  readonly data = input<T[] | null>(null);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  readonly showActions = input(false);
  readonly gridEvent = output<SharedGridEvent<T>>();
  private api!: GridApi<T>;
  private editingRowId: string | null = null;
  private snapshot: T | null = null;

  gridOptions: GridOptions<T> = {
    editType: 'fullRow',
    stopEditingWhenCellsLoseFocus: false,
    getRowId: p => p.data?._id ?? p.data?.id ?? '',
    defaultColDef: {
      flex: 1,
      editable: p => this.getId(p.data) === this.editingRowId
    },
    context: {
      isRowEditing: (row: T) => this.getId(row) === this.editingRowId,
      onAction: (a: string, r: T) => this.onAction(a, r)
    }
  };

  columnDefs = computed<ColDef<T>[]>(() => {
    const baseCols: ColDef<T>[] = this.columns().map(col => {
      if (!col.cellConfig) {
        return col;
      }

      return {
        ...col,
        cellRenderer: MasterCellRendererComponent,
        cellEditor: MasterCellEditorComponent,
        cellRendererParams: { cellConfig: col.cellConfig },
        cellEditorParams: { cellConfig: col.cellConfig }
      };
    });

    if (this.showActions()) {
      const actionCol: ColDef<T> = {
        headerName: 'Actions',
        colId: '__actions__',
        pinned: 'right',
        width: 140,
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: AppSharedGridActionButton
      };
      baseCols.push(actionCol);
    }

    return baseCols;
  });

  onGridReady(e: GridReadyEvent<T>) {
    this.api = e.api;
    this.gridEvent.emit({ type: 'init', api: this.api });
  }

  onSelectionChanged() {
    this.gridEvent.emit({
      type: 'selectionChanged',
      rows: this.api.getSelectedRows()
    });
  }

  // private onAction(action: string, row: T) {

  onRowEditingStopped(event: RowEditingStoppedEvent) {
    this.gridEvent.emit({ type: 'Entersave', row: event.data });
    this.editingRowId = null;
    if (event.node) {
      this.api.refreshCells({ rowNodes: [event.node], force: true });
    }
  }
  private onAction(action: string, row: T) {
    const id = this.getId(row);
    const node = this.api.getRowNode(id);
    if (!node) return;

    switch (action) {
      case 'edit':
        this.editingRowId = id;
        this.api.startEditingCell({
          rowIndex: node.rowIndex!,
          colKey: this.columns()[0].field as string
        });
        this.api.refreshCells({ rowNodes: [node], force: true });
        this.gridEvent.emit({ type: 'editStart', row });
        break;
      case 'save':
        this.api.stopEditing(false);
        break;
      case 'cancel':
        if (this.snapshot) node.setData(this.snapshot);
        this.api.stopEditing(true);
        this.editingRowId = null;
        this.api.refreshCells({ rowNodes: [node], force: true });
        if (node.data) {
          this.gridEvent.emit({ type: 'cancel', row: node.data });
        }
        break;

      case 'delete':
        this.gridEvent.emit({ type: 'delete', row });
        break;
    }
  }

  private getId(row: any): string {
    return row?._id ?? row?.id ?? '';
  }

  get selectionOptions(): RowSelectionOptions | undefined {
    if (!this.selectionMode()) return;
    return {
      mode: this.selectionMode() === 'single'
        ? 'singleRow'
        : 'multiRow'
    };
  }

  readonly agTheme = computed<Theme>(() =>
    themeQuartz.withParams({
      /* Typography */
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--font-size-base)',

      /* Backgrounds */
      backgroundColor: 'var(--bg-primary)',
      headerBackgroundColor: 'var(--bg-secondary)',

      /* Text */
      foregroundColor: 'var(--text-primary)',
      headerTextColor: 'var(--text-label)',

      /* Borders */
      borderColor: 'var(--border-primary)',

      /* Interaction */
      rowHoverColor: 'var(--component-bg-hover)',
      selectedRowBackgroundColor: 'var(--accent-focus)',
      rangeSelectionBackgroundColor: 'var(--accent-focus)',
      rangeSelectionBorderColor: 'var(--accent-primary)',

      /* Inputs */
      inputBackgroundColor: 'var(--bg-ternary)',
      inputBorder: 'var(--component-border-focus)',
      inputPlaceholderTextColor: 'var(--text-tertiary)',

      /* Scrollbars */
      // scrollbarThumbColor: 'var(--scroll-thumb-c)',
      // scrollbarTrackColor: 'var(--scroll-track-c)',

      /* Density */
      rowHeight: 44,
      headerHeight: 44,
      spacing: 6
    })
  );
}
