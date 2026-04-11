import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { AgGridAngular } from 'ag-grid-angular';
import { GridApi, GridOptions, ColDef, GridReadyEvent, RowSelectionOptions, ModuleRegistry, AllCommunityModule, Theme, themeQuartz, ICellRendererParams, GetRowIdParams, TabToNextCellParams, CellPosition, } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CellInteractionEvent, GridColDef } from '../grid.types';
import { AppSharedGridActionButton } from '../app-shared-grid-action-button/app-shared-grid-action-button';
import { MasterCellComponent } from '../dynamic Columns/master-cell-editor.component';
import { ExcelExportDialogComponent } from '../../../components/excel-export/excel-export-dialog.component ';
import { HasPermissionDirective } from '../../../../../core/auth/directives/has-permission.directive';
import { NotesPanelComponent } from '../../../../../projectLayout/notes-panel/notes-panel';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ========================================================================== STABLE MARKER — used to identify MasterCell columns without class comparison
 ROOT CAUSE OF TAB BUG: `columnDefs` is a computed signal. Every time editingIds signal changes,
   the computed re-runs and creates NEW ColDef objects. The `cellRenderer`
   property points to `MasterCellComponent` class, but AG Grid's internal
   column model may cache a previous ColDef reference. Comparing
   `col.getColDef().cellRenderer === MasterCellComponent` inside tabToNextCell
   was therefore comparing against a stale object — the comparison returned
   false for columns that ARE MasterCell, so editableCols was empty, and
   tabToNextCell returned false (no navigation).

   FIX: Prefix every MasterCell colId with MCELL_MARKER. tabToNextCell filters
   by this stable string — immune to object identity issues across signal runs.
   ========================================================================== */
const MCELL_MARKER = '__mcell__';

/* ==========================================================================
   EVENT BUS
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
  | { type: 'selectionChanged'; rows: T[] }
  | { type: 'notes'; row: T };

/* ==========================================================================
   COMPONENT
   ========================================================================== */
@Component({
  selector: 'app-shared-grid',
  standalone: true,
  imports: [
    AgGridAngular,
    ButtonModule,
    TooltipModule,
    ExcelExportDialogComponent,
    HasPermissionDirective,
    NotesPanelComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="shared-grid-container">

      <!-- ══ TOOLBAR ══════════════════════════════════════ -->
      @if (showActions() || selectionMode()) {
        <div class="grid-toolbar">

          <div class="toolbar-left">
            <button pButton label="Add Row" icon="pi pi-plus" size="small"
              [rounded]="true" styleClass="premium-btn btn-primary"
              (click)="addNewRow()"
              pTooltip="Add a new row" tooltipPosition="bottom">
            </button>

            @if (selectedCount() > 0) {
              <div class="selection-chip">
                <i class="pi pi-check-circle"></i>
                <span>{{ selectedCount() }} selected</span>
              </div>
            }
          </div>

          <div class="toolbar-right">

            @if (enableExcelExport()) {
              @if (excelExportPermission()) {
                <ng-container *hasPermission="excelExportPermission()!">
                  <app-excel-export-dialog [data]="data() ?? []"></app-excel-export-dialog>
                  <span class="toolbar-divider"></span>
                </ng-container>
              } @else {
                <app-excel-export-dialog [data]="data() ?? []"></app-excel-export-dialog>
                <span class="toolbar-divider"></span>
              }
            }

            @if (!isBulkEditing()) {
              <button pButton label="Edit" icon="pi pi-pencil"
                [text]="true" [rounded]="true" size="small"
                styleClass="premium-btn btn-secondary"
                [disabled]="selectedCount() === 0"
                (click)="enableBulkEdit()"
                pTooltip="Edit selected rows" tooltipPosition="bottom">
              </button>

              @if (selectedCount() > 0) {
                <span class="toolbar-divider"></span>
                <button pButton label="Delete" icon="pi pi-trash"
                  [text]="true" [rounded]="true" size="small"
                  styleClass="premium-btn btn-danger"
                  (click)="deleteSelected()"
                  pTooltip="Delete selected rows" tooltipPosition="bottom">
                </button>
              }

            } @else {

              <span class="editing-label">
                <i class="pi pi-pencil"></i>
                Editing {{ editingIds().size }} {{ editingIds().size === 1 ? 'row' : 'rows' }}
              </span>

              <button pButton label="Cancel" icon="pi pi-times"
                [text]="true" [rounded]="true" size="small"
                styleClass="premium-btn btn-secondary"
                (click)="cancelBulkEdit()">
              </button>

              <button pButton label="Save All" icon="pi pi-check"
                [rounded]="true" size="small"
                styleClass="premium-btn btn-success"
                (click)="saveBulkEdit()">
              </button>
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
          (selectionChanged)="onSelectionChanged()">
        </ag-grid-angular>
      </div>

      <app-notes-panel
        [isVisible]="isNotesPanelVisible()"
        (isVisibleChange)="isNotesPanelVisible.set($event)"
        [entityType]="notesEntityType()"
        [entityId]="notesEntityId()">
      </app-notes-panel>
    </div>
  `,
  styles: [`

    /* ══════════════════════════════════════════════════════
       SHARED GRID — APEX CRM Theme Token System
    ══════════════════════════════════════════════════════ */

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

    /* ── TOOLBAR ───────────────────────────────────────── */
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
      flex-shrink: 0;
    }
    .selection-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 99px;
      background: color-mix(in srgb, var(--theme-accent-primary) 8%, transparent 92%);
      color: var(--theme-accent-primary);
      border: 1px solid color-mix(in srgb, var(--theme-accent-primary) 20%, transparent 80%);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      animation: chip-in 0.18s ease-out;
    }
    .selection-chip i { font-size: 0.7rem; }
    @keyframes chip-in {
      from { opacity: 0; transform: translateY(3px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
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
    }
    .editing-label i { font-size: 0.75rem; }

    /* ── TOOLBAR BUTTONS ───────────────────────────────── */
    :host ::ng-deep {
      .premium-btn.p-button {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.01em;
        height: 30px;
        transition: all 0.15s ease;
      }
      .premium-btn.p-button:focus-visible {
        outline: 2px solid var(--theme-accent-primary);
        outline-offset: 2px;
      }
      .premium-btn.btn-primary.p-button {
        background: var(--theme-accent-primary);
        border-color: var(--theme-accent-primary);
        color: #fff;
      }
      .premium-btn.btn-primary.p-button:hover {
        filter: brightness(1.08);
        box-shadow: 0 3px 8px color-mix(in srgb, var(--theme-accent-primary) 30%, transparent 70%);
      }
      .premium-btn.btn-secondary.p-button { color: var(--theme-text-secondary); }
      .premium-btn.btn-secondary.p-button:hover {
        background: var(--component-bg-hover, var(--theme-bg-secondary));
        color: var(--theme-text-primary);
      }
      .premium-btn.btn-danger.p-button { color: var(--theme-error, #ef4444); }
      .premium-btn.btn-danger.p-button:hover {
        background: color-mix(in srgb, var(--theme-error, #ef4444) 8%, transparent 92%);
        border-color: color-mix(in srgb, var(--theme-error, #ef4444) 20%, transparent 80%);
      }
      .premium-btn.btn-success.p-button {
        background: var(--theme-success, #22c55e);
        border-color: var(--theme-success, #22c55e);
        color: #fff;
      }
      .premium-btn.btn-success.p-button:hover {
        filter: brightness(1.06);
        box-shadow: 0 3px 8px color-mix(in srgb, var(--theme-success, #22c55e) 30%, transparent 70%);
      }

      /* ── SUPPRESS AG GRID WRAPPER FOCUS RING ────────────
         MasterCell renders its own ring on the inner input.
         Showing both causes a double-ring flash on Tab press.
      ────────────────────────────────────────────────────── */
      .ag-cell:focus,
      .ag-cell.ag-cell-focus {
        outline: none !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      /* Restore subtle ring for action column (no inner input) */
      .ag-cell[col-id="__actions__"]:focus {
        outline: 2px solid var(--theme-accent-primary) !important;
        outline-offset: -2px !important;
        border-radius: 4px;
      }
    }

    /* ── GRID BODY ─────────────────────────────────────── */
    .grid-body {
      flex: 1;
      width: 100%;
      overflow: hidden;
    }

  `],
})
export class AppSharedGrid<T extends { _id?: string; id?: string }> {

  /* ── INPUTS ──────────────────────────────────────────── */
  readonly columns = input.required<GridColDef<T>[]>();
  readonly data = input<T[] | null>(null);
  readonly selectionMode = input<'single' | 'multiple' | null>(null);
  readonly showActions = input(false);
  readonly enableExcelExport = input(true);
  readonly excelExportPermission = input<string | undefined>(undefined);
  readonly excelFileName = input<string>('Exported_Data');

  /* ── OUTPUTS ─────────────────────────────────────────── */
  readonly gridEvent = output<SharedGridEvent<T>>();
  readonly cellEvent = output<CellInteractionEvent>();

  /* ── INTERNAL STATE ──────────────────────────────────── */
  private api!: GridApi<T>;

  readonly editingIds = signal<Set<string>>(new Set());
  readonly selectedCount = signal(0);
  readonly isBulkEditing = signal(false);
  readonly draftMap = new Map<string, Partial<T>>();

  readonly isNotesPanelVisible = signal(false);
  readonly notesEntityType = signal('');
  readonly notesEntityId = signal<string | number | undefined>(undefined);

  /* ── GRID OPTIONS ────────────────────────────────────── */
  readonly gridOptions: GridOptions<T> = {
    suppressClickEdit: true,
    animateRows: true,
    rowBuffer: 20,

    /*
      suppressCellFocus: true
      Prevents AG Grid from applying its own focus outline to the cell wrapper
      <div> on Tab. Without this, AG Grid paints `ag-cell-focus` styling on the
      div before our microtask fires — producing a visible flash.
      
      NOTE: With suppressCellFocus=true, AG Grid does NOT move focus between
      cells automatically. We must handle ALL Tab navigation ourselves via
      tabToNextCell. This is intentional — we own the focus lifecycle.
    */
    suppressCellFocus: true,
    tabToNextCell: (p) => this.tabToNextCell(p),

    getRowId: (p: GetRowIdParams<T>) => {
      const d = p.data as any;
      return d._id ?? d.id ?? d._tempId ?? '';
    },

    context: { componentParent: this },
  };

  /* ── TAB NAVIGATION ──────────────────────────────────────────────────────

     HOW THE FIX WORKS (step by step):

     1. columnDefs() tags every MasterCell column colId with MCELL_MARKER prefix
        e.g.  field "name"  → colId "__mcell__name"
              field "email" → colId "__mcell__email"

     2. tabToNextCell filters AG Grid's column list by that stable string prefix.
        No class reference comparison → immune to signal re-runs.

     3. We compute next col/row index with wrap-around.

     4. We return the CellPosition to AG Grid so its internal "current cell"
        pointer advances correctly (keyboard selection, scrolling into view).

     5. A microtask (Promise.resolve().then) runs BEFORE the next browser paint.
        We query the actual DOM input inside the target cell and call .focus()
        directly — bypassing the wrapper div entirely.

     Result: the inner <input> gets focus with zero visible flash.
  ──────────────────────────────────────────────────────────────────────── */
  private tabToNextCell(params: TabToNextCellParams): CellPosition | boolean {
    const { backwards, previousCellPosition, api } = params;

    // FIX: filter by stable string marker, not class identity
    const allCols = api.getColumns() ?? [];
    const editableCols = allCols.filter(col =>
      col.getColId().startsWith(MCELL_MARKER)
    );

    if (!editableCols.length) return false;

    const currentColId = previousCellPosition.column.getColId();
    const currentIdx = editableCols.findIndex(c => c.getColId() === currentColId);

    // If Tab is pressed on a non-MasterCell column (e.g. actions), jump to first
    let nextColIdx = currentIdx === -1
      ? (backwards ? editableCols.length - 1 : 0)
      : (backwards ? currentIdx - 1 : currentIdx + 1);

    let nextRowIdx = previousCellPosition.rowIndex;

    // Wrap: fell off left → last col of previous row
    if (nextColIdx < 0) {
      nextColIdx = editableCols.length - 1;
      nextRowIdx--;
    }
    // Wrap: fell off right → first col of next row
    else if (nextColIdx >= editableCols.length) {
      nextColIdx = 0;
      nextRowIdx++;
    }

    // Clamp to grid bounds — stop at edges
    const rowCount = api.getDisplayedRowCount();
    if (nextRowIdx < 0 || nextRowIdx >= rowCount) return false;

    // Only navigate into rows that are being edited
    const nextNode = api.getDisplayedRowAtIndex(nextRowIdx);
    const parentCtx = this.gridOptions.context?.componentParent;
    if (nextNode && parentCtx && !parentCtx.editingIds?.()?.has(nextNode.id)) {
      // Row not in edit mode — skip to next editable row
      // Simple fallback: just don't navigate (return false stops Tab)
      // Advanced: loop to find the next editing row (see comment below)
      return false;
    }

    const nextCell: CellPosition = {
      rowIndex: nextRowIdx,
      column: editableCols[nextColIdx],
      rowPinned: null,
    };

    // Microtask: fires before browser paint → zero flash
    Promise.resolve().then(() => {
      const rowNode = api.getDisplayedRowAtIndex(nextRowIdx);
      if (!rowNode) return;

      const colId = editableCols[nextColIdx].getColId();

      // DOM query targets the actual input inside the cell
      // row-id attr is set by AG Grid on the row wrapper
      const selector =
        `.ag-row[row-id="${rowNode.id}"] .ag-cell[col-id="${colId}"] input:not([type="hidden"]), ` +
        `.ag-row[row-id="${rowNode.id}"] .ag-cell[col-id="${colId}"] textarea`;

      const input = document.querySelector<HTMLElement>(selector);
      if (!input) return;

      input.focus({ preventScroll: false });

      if (input instanceof HTMLInputElement &&
        ['text', 'email', 'tel', 'url', 'number'].includes(input.type)) {
        input.select();
      }
    });

    return nextCell;
  }

  /* ── COLUMN DEFS ─────────────────────────────────────────────────────────
     KEY CHANGE: every MasterCell column gets colId = MCELL_MARKER + field
     This is the stable anchor that tabToNextCell uses to find editable columns.
  ──────────────────────────────────────────────────────────────────────── */
  readonly columnDefs = computed<ColDef<T>[]>(() => {
    const cols: ColDef<T>[] = this.columns().map(col => {
      const { cellConfig, ...agColDef } = col;
      if (!cellConfig) return agColDef as ColDef<T>;

      return {
        ...(agColDef as ColDef<T>),
        // Prefix colId so tabToNextCell can find MasterCell columns reliably
        colId: `${MCELL_MARKER}${col.field ?? col.colId ?? ''}`,
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
        // width: 100,
        minWidth: 100,
        // maxWidth: 120,
        editable: false,
        sortable: false,
        filter: false,
        resizable: true,
        suppressMovable: true,
        cellRenderer: AppSharedGridActionButton,
      });
    }

    return cols;
  });

  /* ── SELECTION ───────────────────────────────────────── */
  get selectionOptions(): RowSelectionOptions | undefined {
    const mode = this.selectionMode();
    if (!mode) return undefined;
    return { mode: mode === 'single' ? 'singleRow' : 'multiRow' };
  }

  /* ── GRID EVENTS ─────────────────────────────────────── */
  onGridReady(e: GridReadyEvent<T>): void {
    this.api = e.api;
    this.gridEvent.emit({ type: 'init', api: this.api });
  }

  onSelectionChanged(): void {
    const rows = this.api.getSelectedRows();
    this.selectedCount.set(rows.length);
    this.gridEvent.emit({ type: 'selectionChanged', rows });
  }

  onCellInteraction(event: CellInteractionEvent): void {
    this.cellEvent.emit(event);
  }

  /* ── ADD ROW ─────────────────────────────────────────── */
  addNewRow(): void {
    const tempId = `new_${Date.now()}`;
    const newRow: any = { _tempId: tempId, _id: tempId, id: tempId };
    this.columns().forEach(c => { if (c.field) newRow[c.field] = null; });
    this.api.applyTransaction({ add: [newRow], addIndex: 0 });
    this.activateEditForIds([tempId]);
    this.draftMap.set(tempId, { ...newRow });
    this.gridEvent.emit({ type: 'rowAdded', row: newRow });
  }

  /* ── BULK EDIT ───────────────────────────────────────── */
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

  /* ── SINGLE ROW ACTIONS ──────────────────────────────── */
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
      case 'notes': {
        this.notesEntityType.set('Generic'); // Or parse from somewhere contextually
        this.notesEntityId.set(id);
        this.isNotesPanelVisible.set(true);
        this.gridEvent.emit({ type: 'notes', row });
        break;
      }
    }
  }

  updateDraft(id: string, field: string, value: any): void {
    const current = this.draftMap.get(id) ?? {};
    this.draftMap.set(id, { ...current, [field]: value });
  }

  /* ── PUBLIC API ──────────────────────────────────────── */
  applyTransaction(update: T[], add?: T[], remove?: T[]): void {
    this.api?.applyTransaction({ update, add, remove });
  }
  exportToCsv(fileName = 'export.csv'): void { this.api?.exportDataAsCsv({ fileName }); }
  sizeColumnsToFit(): void { this.api?.sizeColumnsToFit(); }
  refreshGrid(): void { this.api?.refreshCells({ force: true }); }
  getSelectedRows(): T[] { return this.api?.getSelectedRows() ?? []; }

  /* ── HELPERS ─────────────────────────────────────────── */
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

  /* ── THEME ───────────────────────────────────────────── */
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
      selectedRowBackgroundColor: 'color-mix(in srgb, var(--theme-accent-primary) 7%, transparent 93%)',
      rowHeight: 42,
      headerHeight: 46,
      spacing: 5,
    })
  );
}