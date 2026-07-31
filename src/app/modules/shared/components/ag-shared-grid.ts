import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
  computed,
  signal,
} from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';

import { ColDef, GridApi, GridReadyEvent, GridOptions, ColumnResizedEvent, RowSelectionOptions, CellClickedEvent, BodyScrollEndEvent, AllCommunityModule, ModuleRegistry, themeQuartz, Theme, } from 'ag-grid-community';

import type { Permission } from '@core/auth/permissions.constants';
import {
  UnifiedActionRenderer,
  GridActionConfig,
  GridAction,
} from './unified-action-renderer.component';
import { ExcelExportDialogComponent } from './excel-export/excel-export-dialog.component ';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';

ModuleRegistry.registerModules([AllCommunityModule]);

/* --------------------------------------------------
   GRID EVENT CONTRACT
--------------------------------------------------- */
export type SharedGridEvent<T> =
  | { type: 'init'; api: GridApi<T> }
  | { type: 'cellClicked'; row: T; field: string; value: any }
  | { type: 'selectionChanged'; rows: T[] }
  | { type: 'cellEdited'; row: T; field: string; value: any }
  | { type: 'editStart'; row: T }
  | { type: 'save'; row: T }
  | { type: 'cancel'; row: T }
  | { type: 'delete'; row: T }
  | { type: 'return'; row: T }
  | { type: 'bulkSave'; rows: T[] }
  | { type: 'bulkDelete'; rows: T[] }
  | { type: 'reachedBottom' };


/* --------------------------------------------------
   ACTION COLUMN INPUT — fully drives which buttons appear
   Pass this from the consuming component.
   Omitting it entirely = no action column rendered.
--------------------------------------------------- */
export interface ActionColumnConfig {
  /** Which actions to display */
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showReturn?: boolean;

  /** RBAC guards (optional) */
  viewPermission?: Permission;
  editPermission?: Permission;
  deletePermission?: Permission;
  returnPermission?: Permission;


  /** Column width — defaults to auto based on visible actions */
  width?: number;

  /** Pin position — defaults to 'right' */
  pinned?: 'left' | 'right';
}

/* --------------------------------------------------
   COMPONENT
--------------------------------------------------- */
@Component({
  selector: 'app-ag-share-grid',
  standalone: true,
  imports: [AgGridAngular, ExcelExportDialogComponent, HasPermissionDirective],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
  <div class="shared-grid-root">
    @if (enableExcelExport()) {
      <div class="grid-top-bar">
        @if (excelExportPermission()) {
          <ng-container *hasPermission="excelExportPermission()!">
            <app-excel-export-dialog [data]="$any(data() ?? [])"></app-excel-export-dialog>
          </ng-container>
        } @else {
          <app-excel-export-dialog [data]="$any(data() ?? [])"></app-excel-export-dialog>
        }
      </div>
    }
    <ag-grid-angular
      class="ag-theme-quartz"
      style="width:100%; height:100%;"
      [theme]="agTheme()"
      [tooltipShowDelay]="500"
      [tooltipShowMode]="'whenTruncated'"
      [components]="components"
      [rowData]="data() ?? []"
      [pinnedBottomRowData]="pinnedBottomRowData() ?? []"
      [columnDefs]="resolvedColumns()"
      [gridOptions]="gridOptions"
      [rowSelection]="selectionOptions"
      [pagination]="pagination()"
      [paginationPageSize]="paginationPageSize()"
      [paginationPageSizeSelector]="[10, 20, 50, 100]"
      (gridReady)="onGridReady($event)"
      (columnResized)="onColumnResized($event)"
      (cellClicked)="onCellClicked($event)"
      (cellValueChanged)="onCellValueChanged($event)"
      (selectionChanged)="onSelectionChanged()"
      (bodyScrollEnd)="onBodyScrollEnd($event)">
    </ag-grid-angular>
  </div>
`,

  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 0; // ✅ Allow the parent flex container to shrink/grow it
      box-sizing: border-box;
      position: relative;
    }

    .shared-grid-root {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: var(--component-bg, var(--theme-bg-primary));
      border: 1px solid var(--component-border, var(--theme-border-primary));
      border-radius: var(--ui-border-radius-xl, 12px);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      overflow: hidden;
      transition: box-shadow 0.3s ease, border-color 0.3s ease;

      /* Added padding for pill effect margin */
      padding: 0 var(--spacing-md);

      &:hover {
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
        border-color: var(--border-secondary, var(--theme-border-secondary));
      }

      .grid-top-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 8px 16px;
        background: transparent;
        margin: 0 calc(var(--spacing-md) * -1); /* counter-act root padding */
        border-bottom: 1px dashed var(--component-border, var(--theme-border-primary));
        flex-shrink: 0;
      }

      ag-grid-angular {
        flex: 1;
        width: 100%;
        height: 100% !important;
      }

      ::ng-deep {
        /* Remove outer grid borders */
        .ag-root-wrapper {
          border: none !important;
          background: transparent !important;
        }

        /* Dashed row borders */
        .ag-row {
          border-bottom: 1px dashed var(--border-secondary) !important;
          border-radius: var(--ui-border-radius-pill, 9999px) !important;
          transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        /* Last row shouldn't have border */
        .ag-row:last-child {
          border-bottom: none !important;
        }

        /* Selected row pill styling */
        .ag-row-selected {
          background-color: var(--accent-primary) !important;
          color: var(--text-on-accent, #ffffff) !important;
          border-bottom: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0, 0.08) !important;
          transform: scale(0.995);
        }

        /* Hover effect */
        .ag-row-hover:not(.ag-row-selected) {
          background-color: var(--component-bg-hover) !important;
          border-bottom: 1px dashed transparent !important;
        }
        
        /* Remove default header/cell borders */
        .ag-header {
          border-bottom: 1px dashed var(--border-secondary) !important;
          background-color: transparent !important;
        }
        
        .ag-cell {
          border: none !important;
          display: flex;
          align-items: center; /* Center content vertically */
        }
        
        .ag-header-cell::after {
          display: none !important; /* Remove header column separators */
        }
      }
    }

    @media (max-width: 768px) {
      :host { min-height: 300px; }
      .shared-grid-root { flex: 1; min-height: 300px; }
    }
  `]
})
export class AgShareGrid<T = any> {
  // Add this input alongside the other inputs:
  readonly pinnedBottomRowData = input<any[] | null>(null);
  /* --------------------------------------------------
     INPUTS
  --------------------------------------------------- */
  readonly columns = input.required<ColDef<T>[]>();
  readonly data = input<T[] | null>([]);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);

  /**
   * Drives the entire action column declaratively.
   * Omit this input and no action column is injected.
   */
  readonly actionColumn = input<ActionColumnConfig | null>(null);

  readonly enableExcelExport = input(true);
  readonly excelExportPermission = input<string | undefined>(undefined);
  readonly excelFileName = input<string>('Exported_Data');

  readonly pagination = input(false);
  readonly paginationPageSize = input(20);

  /* --------------------------------------------------
     OUTPUT — single event bus
  --------------------------------------------------- */
  readonly gridEvent = output<SharedGridEvent<T>>();

  /* --------------------------------------------------
     INTERNAL STATE
  --------------------------------------------------- */
  private api!: GridApi<T>;

  /** Tracked as a signal so computed columns react to it */
  private readonly editingRowId = signal<string | number | null>(null);
  private originalRowSnapshot: any = null;



  /* --------------------------------------------------
     COMPONENT REGISTRY
  --------------------------------------------------- */
  readonly components = { UnifiedActionRenderer };

  /* --------------------------------------------------
     THEME
  --------------------------------------------------- */
  readonly agTheme = computed<Theme>(() =>
    themeQuartz.withParams({
      fontFamily: 'var(--font-body)',
      fontSize: '13px',

      backgroundColor: 'var(--theme-bg-primary)',
      headerBackgroundColor: 'var(--theme-bg-secondary)',

      foregroundColor: 'var(--theme-text-primary)',
      headerTextColor: 'var(--theme-text-tertiary)',

      borderColor: 'var(--theme-border-primary)',
      headerColumnResizeHandleColor: 'var(--theme-border-secondary)',

      rowHoverColor: 'transparent', // Handled by CSS
      selectedRowBackgroundColor: 'transparent', // Handled by CSS
      rangeSelectionBackgroundColor: 'rgba(var(--accent-primary-rgb), 0.15)',
      rangeSelectionBorderColor: 'var(--theme-accent-primary)',

      inputBackgroundColor: 'var(--theme-bg-primary)',
      inputBorder: '1px solid var(--theme-border-primary)',
      inputPlaceholderTextColor: 'var(--theme-text-tertiary)',

      checkboxCheckedBackgroundColor: 'var(--theme-accent-primary)',
      checkboxCheckedBorderColor: 'var(--theme-accent-primary)',
      checkboxUncheckedBackgroundColor: 'var(--theme-bg-ternary)',
      checkboxUncheckedBorderColor: 'var(--theme-border-secondary)',

      rowHeight: 52,
      headerHeight: 46,
      spacing: 8,
      cellHorizontalPaddingScale: 1.2,
      wrapperBorderRadius: '0', // Managed by container
    })
  );

  /* --------------------------------------------------
     GRID OPTIONS
  --------------------------------------------------- */
  onColumnResized(e: ColumnResizedEvent<T>): void {
    if (e.source === 'autosizeColumns' && e.finished) {
      const allColumnIds = e.api.getColumns()?.map((col) => col.getColId()) || [];
      e.api.autoSizeColumns(allColumnIds);
    }
  }

  readonly gridOptions: GridOptions<T> = {
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true,
      resizable: true,
      editable: (params) =>
        this.editingRowId() === this.resolveRowId(params.data),
    },
    suppressCellFocus: true, // Premium interaction (no outline on click)
    animateRows: true, // Smooth transitions
    rowBuffer: 20,
    suppressMenuHide: true,
    overlayNoRowsTemplate: '<span class="text-[var(--text-secondary)] font-medium">No data available to display</span>',
    getRowId: (params) => String(this.resolveRowId(params.data)),
  };

  /* --------------------------------------------------
     COLUMN RESOLUTION — reactive via computed + signal
  --------------------------------------------------- */
  readonly resolvedColumns = computed<ColDef<T>[]>(() => {
    const base = this.columns();
    if (!base?.length) return [];

    const ac = this.actionColumn();
    if (!ac) return [...base]; // no action column needed

    // Build the GridActionConfig passed into the renderer
    const actionConfig: GridActionConfig = {
      showView: ac.showView ?? false,
      showEdit: ac.showEdit ?? false,
      showDelete: ac.showDelete ?? false,
      viewPermission: ac.viewPermission,
      editPermission: ac.editPermission,
      deletePermission: ac.deletePermission,
      showReturn: ac.showReturn ?? false,
      returnPermission: ac.returnPermission,

      actionHandler: (action: GridAction, row: T) =>
        this.handleRowAction(action, row),

      // Renderer calls this to know whether to show save/cancel
      isRowEditing: (id: string | number) => this.editingRowId() === id,
    };

    // Auto-calculate width if not specified
    const visibleCount = [ac.showView, ac.showEdit, ac.showDelete, ac.showReturn].filter(Boolean).length;
    const colWidth = ac.width ?? Math.max(visibleCount * 48 + 20, 80);


    const actionColDef: ColDef<T> = {
      headerName: '',
      colId: '__actions__',
      pinned: ac.pinned ?? 'right',
      width: colWidth,
      minWidth: colWidth,
      maxWidth: colWidth + 20,
      editable: false,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
      cellRenderer: 'UnifiedActionRenderer',
      cellRendererParams: { actionConfig },
    };

    return [...base, actionColDef];
  });

  /* --------------------------------------------------
     SELECTION
  --------------------------------------------------- */
  get selectionOptions(): RowSelectionOptions | undefined {
    const mode = this.selectionMode();
    if (!mode) return undefined;
    return { mode: mode === 'single' ? 'singleRow' : 'multiRow' };
  }

  /* --------------------------------------------------
     GRID EVENTS
  --------------------------------------------------- */
  onGridReady(e: GridReadyEvent<T>): void {
    this.api = e.api;
    this.gridEvent.emit({ type: 'init', api: this.api });
  }

  onSelectionChanged(): void {
    this.gridEvent.emit({
      type: 'selectionChanged',
      rows: this.api.getSelectedRows(),
    });
  }

  onCellClicked(e: CellClickedEvent<T>): void {
    if (!e.data) return;
    const rowId = this.resolveRowId(e.data);
    // Suppress click events during inline editing
    if (this.editingRowId() === rowId) return;
    // Suppress action column clicks (handled by renderer)
    if (e.column.getColId() === '__actions__') return;

    this.gridEvent.emit({
      type: 'cellClicked',
      row: e.data,
      field: e.colDef.field ?? '',
      value: e.value,
    });
  }

  onCellValueChanged(e: any): void {
    this.gridEvent.emit({
      type: 'cellEdited',
      row: e.data,
      field: e.colDef.field ?? '',
      value: e.newValue,
    });
  }

  onBodyScrollEnd(_: BodyScrollEndEvent): void {
    const vp = document.querySelector('.ag-body-viewport') as HTMLElement;
    if (!vp) return;
    if (vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 2) {
      this.gridEvent.emit({ type: 'reachedBottom' });
    }
  }

  /* --------------------------------------------------
     CRUD CORE — called by renderer via actionConfig
  --------------------------------------------------- */
  private handleRowAction(action: GridAction, row: T): void {
    const id = this.resolveRowId(row);

    switch (action) {
      case 'edit':
        this.editingRowId.set(id);
        this.originalRowSnapshot = { ...row };
        this.gridEvent.emit({ type: 'editStart', row });
        break;

      case 'save':
        this.editingRowId.set(null);
        this.originalRowSnapshot = null;
        this.gridEvent.emit({ type: 'save', row });
        break;

      case 'cancel':
        this.restoreRow(id);
        this.editingRowId.set(null);
        this.originalRowSnapshot = null;
        this.gridEvent.emit({ type: 'cancel', row });
        break;

      case 'delete':
        this.gridEvent.emit({ type: 'delete', row });
        break;

      case 'return':
        this.gridEvent.emit({ type: 'return', row });
        break;


      case 'view':
        // Handled inside UnifiedActionRenderer (modal); not routed here
        break;
    }

    // Refresh only action column cells — cheaper than refreshing all
    this.api.refreshCells({ columns: ['__actions__'], force: true });
  }

  private restoreRow(rowId: string | number): void {
    if (!this.originalRowSnapshot) return;
    const node = this.api.getRowNode(String(rowId));
    if (node) node.setData(this.originalRowSnapshot);
  }

  /* --------------------------------------------------
     PUBLIC API — callable from parent via viewChild
  --------------------------------------------------- */
  addNewRow(): void {
    // Generate a temporary ID and create a blank row
    const tempId = `new_${Date.now()}`;
    const newRow = { _id: tempId, _tempId: tempId, isNew: true } as unknown as T;

    // Add to top of grid
    this.api?.applyTransaction({ add: [newRow], addIndex: 0 });

    // Set grid state to edit this new row immediately
    this.editingRowId.set(tempId);
    this.originalRowSnapshot = { ...newRow };
    this.api?.refreshCells({ columns: ['__actions__'], force: true });
  }

  applyTransaction(update: T[], add?: T[], remove?: T[]): void {
    this.api?.applyTransaction({ update, add, remove });
  }

  refreshGrid(): void {
    this.api?.refreshCells({ force: true });
  }

  sizeColumnsToFit(): void {
    this.api?.sizeColumnsToFit();
  }

  exportToCsv(fileName?: string): void {
    this.api?.exportDataAsCsv({ fileName: fileName ?? 'export.csv' });
  }

  showLoadingOverlay(): void {
    this.api?.showLoadingOverlay();
  }

  showNoRowsOverlay(): void {
    this.api?.showNoRowsOverlay();
  }

  hideOverlay(): void {
    this.api?.hideOverlay();
  }

  getSelectedRows(): T[] {
    return this.api?.getSelectedRows() ?? [];
  }

  /* --------------------------------------------------
     UTIL
  --------------------------------------------------- */
  private resolveRowId(row: any): string | number {
    return row?._id ?? row?.id ?? '';
  }
}
