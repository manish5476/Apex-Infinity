import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';

import { ColDef, GridApi, GridReadyEvent, GridOptions, RowSelectionOptions, CellClickedEvent, BodyScrollEndEvent, AllCommunityModule, ModuleRegistry, themeQuartz, Theme, } from 'ag-grid-community';

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

  /** RBAC guards (optional) */
  viewPermission?: Permission;
  editPermission?: Permission;
  deletePermission?: Permission;

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
  imports: [CommonModule, AgGridAngular, ExcelExportDialogComponent, HasPermissionDirective],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="shared-grid-root">
      @if (enableExcelExport()) {
        <div class="grid-top-bar">
          <ng-container *ngIf="excelExportPermission(); else noPermExport">
            <ng-container *hasPermission="excelExportPermission()!">
              <app-excel-export-dialog [data]="$any(data() ?? [])"></app-excel-export-dialog>
            </ng-container>
          </ng-container>
          <ng-template #noPermExport>
            <app-excel-export-dialog [data]="$any(data() ?? [])"></app-excel-export-dialog>
          </ng-template>
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
        [columnDefs]="resolvedColumns()"
        [gridOptions]="gridOptions"
        [rowSelection]="selectionOptions"
        (gridReady)="onGridReady($event)"
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
      min-height: 400px;
      box-sizing: border-box;
    }

    .shared-grid-root {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: var(--theme-bg-primary);
      border: 1px solid var(--theme-border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;

      .grid-top-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 6px 12px;
        background: var(--theme-bg-secondary);
        border-bottom: 1px solid var(--theme-border-primary);
        flex-shrink: 0;
      }

      ag-grid-angular {
        flex: 1;
        width: 100%;
        height: 100% !important;
      }
    }

    @media (max-width: 768px) {
      :host { min-height: 300px; height: auto; }
      .shared-grid-root { height: 450px; }
    }
  `]
})
export class AgShareGrid<T = any> {

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

      rowHoverColor: 'var(--component-bg-hover)',
      selectedRowBackgroundColor: 'rgba(var(--accent-primary-rgb), 0.08)',
      rangeSelectionBackgroundColor: 'rgba(var(--accent-primary-rgb), 0.15)',
      rangeSelectionBorderColor: 'var(--theme-accent-primary)',

      inputBackgroundColor: 'var(--theme-bg-primary)',
      inputBorder: '1px solid var(--theme-border-primary)',
      inputPlaceholderTextColor: 'var(--theme-text-tertiary)',

      checkboxCheckedBackgroundColor: 'var(--theme-accent-primary)',
      checkboxCheckedBorderColor: 'var(--theme-accent-primary)',
      checkboxUncheckedBackgroundColor: 'var(--theme-bg-ternary)',
      checkboxUncheckedBorderColor: 'var(--theme-border-secondary)',

      rowHeight: 40,
      headerHeight: 42,
      spacing: 4,
      cellHorizontalPaddingScale: 0.8,
    })
  );

  /* --------------------------------------------------
     GRID OPTIONS
  --------------------------------------------------- */
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
    suppressCellFocus: false,
    animateRows: false,
    rowBuffer: 20,
    suppressAnimationFrame: false,
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

      actionHandler: (action: GridAction, row: T) =>
        this.handleRowAction(action, row),

      // Renderer calls this to know whether to show save/cancel
      isRowEditing: (id: string | number) => this.editingRowId() === id,
    };

    // Auto-calculate width if not specified
    const visibleCount = [ac.showView, ac.showEdit, ac.showDelete].filter(Boolean).length;
    const colWidth = ac.width ?? Math.max(visibleCount * 38 + 20, 80);

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
    node?.setData(this.originalRowSnapshot);
  }

  /* --------------------------------------------------
     PUBLIC API — callable from parent via viewChild
  --------------------------------------------------- */
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
