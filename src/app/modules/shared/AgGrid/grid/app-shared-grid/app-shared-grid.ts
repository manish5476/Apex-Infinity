import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  GridApi,
  GridOptions,
  ColDef,
  GridReadyEvent,
  RowSelectionOptions,
  ModuleRegistry,
  AllCommunityModule,
  Theme,
  themeQuartz,
  ICellRendererParams,
  GetRowIdParams,
} from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { CellInteractionEvent, GridColDef } from '../grid.types';
import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
import { MasterCellComponent } from '../dynamic Columns/master-cell-editor.component';
import { ExcelExportDialogComponent } from '../../../components/excel-export/excel-export-dialog.component ';
import { HasPermissionDirective } from '../../../../../core/auth/directives/has-permission.directive';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ==========================================================================
   EVENT BUS — Single typed output for all grid interactions
   ========================================================================== */
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

/* ==========================================================================
   COMPONENT
   ========================================================================== */
@Component({
  selector: 'app-shared-grid',
  standalone: true,
  imports: [CommonModule, AgGridAngular, ButtonModule, TooltipModule, ExcelExportDialogComponent, HasPermissionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="shared-grid-container">

      <!-- ══ TOOLBAR ══════════════════════════════════════ -->
      @if (showActions() || selectionMode()) {
        <div class="grid-toolbar">

          <div class="toolbar-left">
            <button
              pButton
              label="Add Row"
              icon="pi pi-plus"
              size="small"
              [rounded]="true"
              styleClass="premium-btn btn-primary"
              (click)="addNewRow()"
              pTooltip="Add a new row"
              tooltipPosition="bottom"
            ></button>

            @if (selectedCount() > 0) {
              <div class="selection-chip">
                <i class="pi pi-check-circle"></i>
                <span>{{ selectedCount() }} selected</span>
              </div>
            }
          </div>

          <div class="toolbar-right">
            @if (enableExcelExport()) {
              <ng-container *ngIf="excelExportPermission(); else noPermExport">
                <ng-container *hasPermission="excelExportPermission()!">
                  <app-excel-export-dialog [data]="data() ?? []"></app-excel-export-dialog>
                  <span class="toolbar-divider"></span>
                </ng-container>
              </ng-container>
              <ng-template #noPermExport>
                <app-excel-export-dialog [data]="data() ?? []"></app-excel-export-dialog>
                <span class="toolbar-divider"></span>
              </ng-template>
            }

            @if (!isBulkEditing()) {

              <button
                pButton
                label="Edit"
                icon="pi pi-pencil"
                [text]="true"
                [rounded]="true"
                size="small"
                styleClass="premium-btn btn-secondary"
                [disabled]="selectedCount() === 0"
                (click)="enableBulkEdit()"
                pTooltip="Edit selected rows"
                tooltipPosition="bottom"
              ></button>

              @if (selectedCount() > 0) {
                <span class="toolbar-divider"></span>

                <button
                  pButton
                  label="Delete"
                  icon="pi pi-trash"
                  [text]="true"
                  [rounded]="true"
                  size="small"
                  styleClass="premium-btn btn-danger"
                  (click)="deleteSelected()"
                  pTooltip="Delete selected rows"
                  tooltipPosition="bottom"
                ></button>
              }

            } @else {

              <span class="editing-label">
                <i class="pi pi-pencil-square"></i>
                Editing {{ editingIds().size }} {{ editingIds().size === 1 ? 'row' : 'rows' }}
              </span>

              <button
                pButton
                label="Cancel"
                icon="pi pi-times"
                [text]="true"
                [rounded]="true"
                size="small"
                styleClass="premium-btn btn-secondary"
                (click)="cancelBulkEdit()"
              ></button>

              <button
                pButton
                label="Save All"
                icon="pi pi-check"
                [rounded]="true"
                size="small"
                styleClass="premium-btn btn-success"
                (click)="saveBulkEdit()"
              ></button>
            }
          </div>

        </div>
      }

      <!-- ══ GRID ═════════════════════════════════════════ -->
      <div class="grid-body">
        <ag-grid-angular
          class="ag-theme-quartz"
          style="width:100%; height:100%;"
          [theme]="agTheme()"
          [rowData]="data() ?? []"
          [columnDefs]="columnDefs()"
          [gridOptions]="gridOptions"
          [rowSelection]="selectionOptions"
          (gridReady)="onGridReady($event)"
          (selectionChanged)="onSelectionChanged()"
        ></ag-grid-angular>
      </div>

    </div>
  `,
  styles: [`
    .shared-grid-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: var(--theme-bg-primary);
      border: 1px solid var(--theme-border-primary);
      border-radius: var(--ui-border-radius-lg, 10px);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .grid-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 48px;
      padding: 6px 12px;
      background: var(--theme-bg-secondary);
      border-bottom: 1px solid var(--theme-border-primary);
      flex-shrink: 0;
      z-index: 10;
    }

    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-divider {
      width: 1px;
      height: 18px;
      background: var(--theme-border-secondary);
    }

    .selection-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 99px;
      background: rgba(var(--accent-primary-rgb), 0.08);
      color: var(--theme-accent-primary);
      border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      animation: chip-in 0.18s ease-out;
      i { font-size: 0.7rem; }
    }

    @keyframes chip-in {
      from { opacity: 0; transform: translateY(3px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .editing-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--theme-text-tertiary);
      font-style: italic;
      margin-right: 4px;
      i { font-size: 0.75rem; }
    }

    :host ::ng-deep {
      .premium-btn.p-button {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.01em;
        height: 30px;
        transition: all 0.15s ease;
        &:focus-visible { outline: 2px solid var(--theme-accent-primary); outline-offset: 2px; }
      }
      .premium-btn.btn-primary.p-button {
        background: var(--theme-accent-primary);
        border-color: var(--theme-accent-primary);
        color: #fff;
        &:hover { filter: brightness(1.08); box-shadow: 0 3px 8px rgba(var(--accent-primary-rgb),0.3); }
      }
      .premium-btn.btn-secondary.p-button {
        color: var(--theme-text-secondary);
        &:hover { background: var(--component-bg-hover); color: var(--theme-text-primary); }
      }
      .premium-btn.btn-danger.p-button {
        color: var(--color-error, #ef4444);
        &:hover { background: rgba(239,68,68,0.08); color: var(--color-error); border-color: rgba(239,68,68,0.2); }
      }
      .premium-btn.btn-success.p-button {
        background: var(--color-success, #22c55e);
        border-color: var(--color-success, #22c55e);
        color: #fff;
        &:hover { filter: brightness(1.06); box-shadow: 0 3px 8px rgba(34,197,94,0.3); }
      }
    }

    .grid-body {
      flex: 1;
      width: 100%;
      overflow: hidden;
    }
  `],
})
export class AppSharedGrid<T extends { _id?: string; id?: string }> {

  /* ── INPUTS ────────────────────────────────────────── */
  readonly columns = input.required<GridColDef<T>[]>();
  readonly data = input<T[] | null>(null);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  readonly showActions = input(false);

  readonly enableExcelExport = input(true);
  readonly excelExportPermission = input<string | undefined>(undefined);
  readonly excelFileName = input<string>('Exported_Data');

  /* ── OUTPUTS ───────────────────────────────────────── */
  /** Row-level CRUD / lifecycle events */
  readonly gridEvent = output<SharedGridEvent<T>>();

  /**
   * Cell-level interaction events — aggregated from ALL MasterCellComponents
   * in the grid via context.componentParent.onCellInteraction().
   *
   * Every click, focus, blur, change, enter, escape, linkClick from any cell
   * surfaces here with full context (field, rowId, value, draftValue, cellType).
   *
   * Usage in parent template:
   *   (cellEvent)="handleCellEvent($event)"
   */
  readonly cellEvent = output<CellInteractionEvent>();

  /* ── INTERNAL STATE ────────────────────────────────── */

  private api!: GridApi<T>;

  readonly editingIds = signal<Set<string>>(new Set());
  readonly selectedCount = signal(0);
  readonly isBulkEditing = signal(false);

  readonly draftMap = new Map<string, Partial<T>>();

  /* ── GRID OPTIONS ──────────────────────────────────── */
  readonly gridOptions: GridOptions<T> = {
    suppressClickEdit: true,
    animateRows: true,
    rowBuffer: 20,
    getRowId: (p: GetRowIdParams<T>) => {
      const d = p.data as any;
      return d._id ?? d.id ?? d._tempId ?? '';
    },
    context: { componentParent: this },
  };

  /* ── COLUMN DEFS ───────────────────────────────────── */
  readonly columnDefs = computed<ColDef<T>[]>(() => {
    const cols: ColDef<T>[] = this.columns().map(col => {
      const { cellConfig, ...agColDef } = col;
      if (!cellConfig) return agColDef as ColDef<T>;

      return {
        ...(agColDef as ColDef<T>),
        editable: false,
        cellRenderer: MasterCellComponent,
        cellRendererParams: (params: ICellRendererParams<T>) => ({
          ...params,
          cellConfig,
          value: this.editingIds().has(params.node.id!)
            ? (this.draftMap.get(params.node.id!)?.[col.field as keyof T] ?? params.value)
            : params.value,
        }),
      };
    });

    if (this.showActions()) {
      cols.push({
        headerName: '',
        colId: '__actions__',
        pinned: 'right',
        width: 100,
        minWidth: 100,
        maxWidth: 120,
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellRenderer: AppSharedGridActionButton,
      });
    }

    return cols;
  });

  /* ── SELECTION ─────────────────────────────────────── */
  get selectionOptions(): RowSelectionOptions | undefined {
    const mode = this.selectionMode();
    if (!mode) return undefined;
    return { mode: mode === 'single' ? 'singleRow' : 'multiRow' };
  }

  /* ── GRID EVENTS ───────────────────────────────────── */
  onGridReady(e: GridReadyEvent<T>): void {
    this.api = e.api;
    this.gridEvent.emit({ type: 'init', api: this.api });
  }

  onSelectionChanged(): void {
    const rows = this.api.getSelectedRows();
    this.selectedCount.set(rows.length);
    this.gridEvent.emit({ type: 'selectionChanged', rows });
  }

  /**
   * Called by MasterCellComponent via context.componentParent.
   * Aggregates ALL cell interactions and re-emits on the grid's cellEvent output.
   * This means one (cellEvent) listener on <app-shared-grid> catches everything.
   */
  onCellInteraction(event: CellInteractionEvent): void {
    this.cellEvent.emit(event);
  }

  /* ── ADD ROW ───────────────────────────────────────── */
  addNewRow(): void {
    const tempId = `new_${Date.now()}`;
    const newRow: any = { _tempId: tempId, _id: tempId, id: tempId };
    this.columns().forEach(c => { if (c.field) newRow[c.field] = null; });
    this.api.applyTransaction({ add: [newRow], addIndex: 0 });
    this.activateEditForIds([tempId]);
    this.draftMap.set(tempId, { ...newRow });
    this.gridEvent.emit({ type: 'rowAdded', row: newRow });
  }

  /* ── BULK EDIT ─────────────────────────────────────── */
  enableBulkEdit(): void {
    const nodes = this.api.getSelectedNodes();
    if (!nodes.length) return;
    const ids: string[] = [];
    nodes.forEach(node => {
      if (node.id && node.data) {
        ids.push(node.id);
        this.draftMap.set(node.id, { ...node.data });
      }
    });
    this.activateEditForIds(ids);
    this.isBulkEditing.set(true);
  }

  saveBulkEdit(): void {
    const updates: T[] = [];
    const idsToStop: string[] = [];
    this.editingIds().forEach(id => {
      const node = this.api.getRowNode(id);
      const changes = this.draftMap.get(id);
      if (node?.data && changes) {
        const final = { ...node.data, ...changes } as T;
        node.setData(final);
        updates.push(final);
      }
      idsToStop.push(id);
    });
    this.draftMap.clear();
    this.deactivateEditForIds(idsToStop);
    this.isBulkEditing.set(false);
    this.gridEvent.emit({ type: 'bulkSave', rows: updates });
  }

  cancelBulkEdit(): void {
    const idsToStop: string[] = [];
    this.editingIds().forEach(id => {
      idsToStop.push(id);
      if (id.startsWith('new_')) {
        const node = this.api.getRowNode(id);
        if (node?.data) this.api.applyTransaction({ remove: [node.data] });
      }
    });
    this.draftMap.clear();
    this.deactivateEditForIds(idsToStop);
    this.isBulkEditing.set(false);
  }

  deleteSelected(): void {
    const rows = this.api.getSelectedRows();
    if (!rows.length) return;
    this.api.applyTransaction({ remove: rows });
    this.gridEvent.emit({ type: 'bulkDelete', rows });
    this.selectedCount.set(0);
  }

  /* ── SINGLE ROW ACTIONS ────────────────────────────── */
  handleRowAction(action: string, row: T): void {
    const id = this.resolveId(row);
    const node = this.api.getRowNode(id);
    if (!id || !node) return;

    switch (action) {
      case 'edit': {
        this.draftMap.set(id, { ...row });
        this.activateEditForIds([id]);
        this.gridEvent.emit({ type: 'editStart', row });
        break;
      }
      case 'save': {
        const changes = this.draftMap.get(id);
        const final = { ...row, ...changes } as T;
        node.setData(final);
        this.draftMap.delete(id);
        this.deactivateEditForIds([id]);
        this.gridEvent.emit({ type: 'save', row: final, data: final });
        break;
      }
      case 'cancel': {
        this.draftMap.delete(id);
        if (id.startsWith('new_')) {
          this.api.applyTransaction({ remove: [row] });
        } else {
          this.deactivateEditForIds([id]);
        }
        this.gridEvent.emit({ type: 'cancel', row });
        break;
      }
      case 'delete': {
        this.api.applyTransaction({ remove: [row] });
        this.gridEvent.emit({ type: 'delete', row });
        break;
      }
    }
  }

  updateDraft(id: string, field: string, value: any): void {
    const current = this.draftMap.get(id) ?? {};
    this.draftMap.set(id, { ...current, [field]: value });
  }

  /* ── PUBLIC API ────────────────────────────────────── */
  applyTransaction(update: T[], add?: T[], remove?: T[]): void {
    this.api?.applyTransaction({ update, add, remove });
  }
  exportToCsv(fileName = 'export.csv'): void {
    this.api?.exportDataAsCsv({ fileName });
  }
  sizeColumnsToFit(): void { this.api?.sizeColumnsToFit(); }
  refreshGrid(): void { this.api?.refreshCells({ force: true }); }
  getSelectedRows(): T[] { return this.api?.getSelectedRows() ?? []; }

  /* ── HELPERS ───────────────────────────────────────── */
  private activateEditForIds(ids: string[]): void {
    const next = new Set(this.editingIds());
    const nodesToRefresh: any[] = [];
    ids.forEach(id => {
      next.add(id);
      const node = this.api.getRowNode(id);
      if (node) nodesToRefresh.push(node);
    });
    this.editingIds.set(next);
    if (nodesToRefresh.length) {
      this.api.refreshCells({ rowNodes: nodesToRefresh, force: true });
    }
  }

  private deactivateEditForIds(ids: string[]): void {
    const next = new Set(this.editingIds());
    const nodesToRefresh: any[] = [];
    ids.forEach(id => {
      next.delete(id);
      const node = this.api.getRowNode(id);
      if (node) nodesToRefresh.push(node);
    });
    this.editingIds.set(next);
    if (nodesToRefresh.length) {
      this.api.refreshCells({ rowNodes: nodesToRefresh, force: true });
    }
  }

  private resolveId(row: any): string {
    return row?._id ?? row?.id ?? row?._tempId ?? '';
  }

  /* ── THEME ─────────────────────────────────────────── */
  readonly agTheme = computed<Theme>(() =>
    themeQuartz.withParams({
      fontFamily: 'var(--font-body)',
      fontSize: '13px',
      backgroundColor: 'var(--theme-bg-primary)',
      headerBackgroundColor: 'var(--theme-bg-secondary)',
      foregroundColor: 'var(--theme-text-primary)',
      headerTextColor: 'var(--theme-text-tertiary)',
      borderColor: 'var(--theme-border-primary)',
      rowHoverColor: 'var(--component-bg-hover)',
      selectedRowBackgroundColor: 'rgba(var(--accent-primary-rgb), 0.07)',
      rowHeight: 42,
      headerHeight: 46,
      spacing: 5,
    })
  );
}