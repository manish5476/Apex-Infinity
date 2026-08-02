import { ScrollingModule, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { Component, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, inject, input, output, signal, computed, effect, untracked, HostListener } from "@angular/core";
import { MessageService } from "primeng/api";
import { GridActionsComponent } from "../components/grid-actions.component";
import { GridColumnManagerComponent } from "../components/grid-column-manager.component";
import { GridContextMenuComponent, ContextMenuActionEvent } from "../components/grid-context-menu.component";
import { GridEmptyStateComponent } from "../components/grid-empty-state.component";
import { GridFilterBarComponent } from "../components/grid-filter-bar.component";
import { GridFilterChipsComponent } from "../components/grid-filter-chips.component";
import { GridLoadingComponent } from "../components/grid-loading.component";
import { GridPaginationComponent } from "../components/grid-pagination.component";
import { GridSavedViewsComponent } from "../components/grid-saved-views.component";
import { GridToolbarComponent } from "../components/grid-toolbar.component";
import { GridCellComponent } from "../components/gridCell/grid-cell.component";
import { GridStateService } from "../grid-state.service";
import { GridColumn, GridDensity, GridRowAction, GridBulkAction, GridPlugin, GridRowSaveEvent, GridBulkActionEvent, GridPageState, GridSortState, GridFilterState, GridSavedView, GridCellChangeEvent, GridContext, GridPersistedState, GridOperationMode, GridQueryPayload, GridColumnHeaderMeta } from "../grid-types";
import { GridService } from "../grid.service";
import { buildGridQuery } from "../utils/grid-query-builder";

@Component({
  selector: 'app-data-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GridService],
  imports: [
    CommonModule, ScrollingModule, GridToolbarComponent, GridCellComponent,
    GridActionsComponent, GridPaginationComponent, GridEmptyStateComponent,
    GridLoadingComponent, GridFilterBarComponent, GridColumnManagerComponent,
    GridSavedViewsComponent, GridContextMenuComponent, GridFilterChipsComponent,
  ],
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss'],
  host: {
    class: 'apex-grid-host flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden',
    'role': 'grid',
    '[attr.aria-rowcount]': 'lazy() ? totalRecords() : filteredData().length'
  }
})
export class DataGridComponent implements OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  @ViewChild('gridBody') gridBody!: ElementRef<HTMLElement>;

  readonly gridService = inject(GridService);
  private stateService = inject(GridStateService);
  private messageService = inject(MessageService, { optional: true });
  private router = inject(Router, { optional: true });

  private getGridStorageId(): string {
    const id = this.gridId();
    if (id === 'default' && this.router) {
      return `default_${this.router.url.split('?')[0].replace(/[\/\#]/g, '_')}`;
    }
    return id;
  }

  data = input.required<any[]>();
  columns = input.required<GridColumn[]>();
  viewOnly = input<boolean>(false);
  gridId = input<string>('default');
  dataKey = input<string>('id');
  lazy = input<boolean>(false);
  totalRecords = input<number>(0);
  toolbar = input<boolean>(true);
  rowSelection = input<boolean>(true);
  multipleSelection = input<boolean>(true);
  pagination = input<boolean>(true);
  pageSize = input<number>(50);
  loading = input<boolean>(false);
  density = input<GridDensity>('compact');
  emptyMessage = input<string>('No records found');
  rowActions = input<GridRowAction[]>([]);
  bulkActions = input<GridBulkAction[]>([]);
  persistState = input<boolean>(true);
  plugins = input<GridPlugin[]>([]);
  enableUndo = input<boolean>(true);
  enableClipboard = input<boolean>(true);
  enableExport = input<boolean>(true);
  enableSavedViews = input<boolean>(true);
  enableContextMenu = input<boolean>(true);
  enableAdd = input<boolean>(true);
  stripedRows = input<boolean>(true);
  // ─── Phase A: Operation Modes ─────────────────────────────────────────────
  /** When 'server': sort is not applied locally; queryChange emits. Default: 'client'. */
  sortingMode = input<GridOperationMode>('client');
  /** When 'server': filter is not applied locally; queryChange emits. Default: 'client'. */
  filteringMode = input<GridOperationMode>('client');
  /** When 'server': pagination does not slice locally; queryChange emits. Default: 'client'. */
  serverPaginationMode = input<GridOperationMode>('client');
  /** When 'server': search is not applied locally; queryChange emits. Default: 'client'. */
  searchMode = input<GridOperationMode>('client');
  // ─── Phase A: Visual Controls ─────────────────────────────────────────────
  /** Show accent background + border on sorted column headers. Default: true. */
  highlightSortedColumns = input<boolean>(true);
  /** Show warning background + border on filtered column headers. Default: true. */
  highlightFilteredColumns = input<boolean>(true);
  /** Show active filter chips in the toolbar. Default: true. */
  showFilterChips = input<boolean>(true);
  /** Show 'Clear all' button in chip row when filters are active. Default: true. */
  showClearFilters = input<boolean>(true);

  rowSave = output<GridRowSaveEvent>();
  bulkSave = output<GridRowSaveEvent[]>();
  rowDelete = output<any>();
  rowDuplicate = output<any>();
  bulkAction = output<GridBulkActionEvent>();
  pageChange = output<GridPageState>();
  pageSizeChange = output<number>();
  sortChange = output<GridSortState[]>();
  filterChange = output<GridFilterState[]>();
  searchChange = output<string>();
  selectionChange = output<any[]>();
  rowClick = output<any>();
  rowDoubleClick = output<any>();
  refresh = output<void>();
  addNew = output<void>();
  // ─── New Phase A Outputs ──────────────────────────────────────────────────
  /** Emits the full unified state snapshot on every meaningful state change. */
  gridStateChange = output<{
    search: string;
    filters: GridFilterState[];
    sorting: GridSortState[];
    pagination: { page: number; pageSize: number; total: number };
    density: GridDensity;
    visibleColumns: string[];
  }>();
  /** Emits ONLY when the relevant operation mode is 'server'. Use this as your single API call trigger. */
  queryChange = output<GridQueryPayload>();

  // ─── Bulk Edit State Engine ───────────────────────────────────────────────
  editingRowIds = signal<Set<string>>(new Set());
  editDrafts = signal<Map<string, any>>(new Map());
  originalSnapshots = signal<Map<string, any>>(new Map());

  selectedRowIds = signal<Set<string>>(new Set());
  modifiedRowIds = signal<Set<string>>(new Set());

  searchQuery = signal<string>('');
  sortState = signal<GridSortState[]>([]);
  filterState = signal<GridFilterState[]>([]);

  currentPage = signal<number>(0);
  pageSizeSignal = signal<number>(50);
  densitySignal = signal<GridDensity>('compact');

  visibleColumnsSignal = signal<string[]>([]);
  savedViews = signal<GridSavedView[]>([]);
  activeViewId = signal<string | null>(null);
  paginationMode = signal<'pages' | 'infinite'>('pages');

  columnOverrides = signal<Record<string, Partial<GridColumn>>>({});
  accumulatedData = signal<any[]>([]);

  showFilterBar = signal(false);
  showColumnManager = signal(false);
  showSavedViews = signal(false);
  showContextMenu = signal(false);
  contextMenuPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  contextMenuRow = signal<any>(null);

  private searchTimeout: any;
  private lastClickedId: string | null = null;


  // ─── Native CSS Grid Column Resizing (Optimized & Crash-Proof) ─────────────
  private resizeState = {
    isResizing: false,
    field: '',
    startX: 0,
    startWidth: 0,
    thElement: null as HTMLElement | null
  };

  onResizeStart(event: MouseEvent, field: string): void {
    event.preventDefault();
    event.stopPropagation();

    // Safely find the parent header cell using .closest()
    const th = (event.target as HTMLElement).closest('.apex-dg-hcell') as HTMLElement;
    if (!th) return;

    this.resizeState = {
      isResizing: true,
      field,
      startX: event.clientX,
      startWidth: th.offsetWidth,
      thElement: th
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.resizeState.isResizing || !this.resizeState.thElement) return;

    const delta = event.clientX - this.resizeState.startX;
    const newWidth = Math.max(60, this.resizeState.startWidth + delta);

    // Update DOM directly during drag for zero lag (No signal spam)
    this.resizeState.thElement.style.width = `${newWidth}px`;
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.resizeState.isResizing) return;

    const finalWidth = this.resizeState.thElement ? this.resizeState.thElement.offsetWidth : 0;
    const field = this.resizeState.field;

    this.resizeState.isResizing = false;
    this.resizeState.thElement = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (finalWidth > 0 && field) {
      // Commit to signal state ONCE when dragging finishes
      this.columnOverrides.update(o => ({
        ...o,
        [field]: { ...o[field], width: `${finalWidth}px` }
      }));

      // Persist to local storage if enabled
      if (this.persistState()) {
        const widths = this.columnsWithOverrides().reduce((acc, c) => ({ ...acc, [c.field]: c.width ?? '' }), {});
        this.stateService.setColumnWidths(this.getGridStorageId(), widths);
      }
    }
  }


  // ─── Computed Properties ──────────────────────────────────────────────────
  columnsWithOverrides = computed<GridColumn[]>(() => {
    const cols = this.columns();
    const overrides = this.columnOverrides();
    return cols.map(c => overrides[c.field] ? { ...c, ...overrides[c.field] } : c);
  });

  visibleColumnList = computed<GridColumn[]>(() => {
    const all = this.columnsWithOverrides();
    const vis = this.visibleColumnsSignal();
    if (!vis.length) return all.filter(c => c.visible !== false);
    return vis.map(v => all.find(c => c.field === v)).filter(Boolean) as GridColumn[];
  });

  // gridTemplateColumns = computed(() => {
  //   const cols = this.visibleColumnList();
  //   let template = this.rowSelection() ? '48px ' : '';
  //   template += '60px '; 
  //   template += cols.map(c => `minmax(${c.minWidth ?? '100px'}, ${c.width ?? '1fr'})`).join(' ');
  //   template += ' 80px'; 
  //   return template;
  // });
  gridTemplateColumns = computed(() => {
    const cols = this.visibleColumnList();
    let template = (this.rowSelection() && !this.viewOnly()) ? '48px ' : '';
    template += '60px '; // Sr. No.
    template += cols.map(c => `minmax(${c.minWidth ?? '100px'}, ${c.width ?? '1fr'})`).join(' ');

    // Omit the actions column width entirely if viewOnly is active
    if (!this.viewOnly()) {
      template += ' max-content';
    }
    return template;
  });

  filteredData = computed<any[]>(() => {
    if (this.lazy()) return this.data();

    let result = this.data();
    const query = this.searchQuery().trim().toLowerCase();
    const filters = this.filterState();
    const sort = this.sortState();

    // Skip client-side processing when the operation is delegated to the server
    if (this.searchMode() === 'client' && query) {
      const searchCols = this.columnsWithOverrides().filter(c => c.searchable !== false && c.type !== 'action');
      result = result.filter(row => searchCols.some(col => String(row[col.field] ?? '').toLowerCase().includes(query)));
    }
    if (this.filteringMode() === 'client' && filters.length > 0) {
      result = result.filter(row => filters.every(f => this.applyFilter(row, f)));
    }
    if (this.sortingMode() === 'client' && sort.length > 0) {
      result = [...result].sort((a, b) => this.applySort(a, b, sort));
    }

    const editingIds = this.editingRowIds();
    if (editingIds.size > 0) {
      const editingRows: any[] = [];
      const normalRows: any[] = [];
      for (const row of result) {
        if (editingIds.has(this.getRowId(row))) editingRows.push(row);
        else normalRows.push(row);
      }
      return [...editingRows, ...normalRows];
    }

    return result;
  });

  displayData = computed<any[]>(() => {
    if (this.lazy() && this.paginationMode() === 'infinite') return this.accumulatedData();
    if (this.lazy() || !this.pagination() || this.paginationMode() === 'infinite') return this.filteredData();
    const start = this.currentPage() * this.pageSizeSignal();
    return this.filteredData().slice(start, start + this.pageSizeSignal());
  });

  allSelected = computed(() => {
    const ids = this.selectedRowIds();
    const disp = this.displayData();
    return disp.length > 0 && disp.every(r => ids.has(this.getRowId(r)));
  });

  indeterminate = computed(() => {
    const ids = this.selectedRowIds();
    return ids.size > 0 && !this.allSelected() && this.displayData().some(r => ids.has(this.getRowId(r)));
  });

  rowHeight = computed(() => {
    switch (this.densitySignal()) {
      case 'comfortable': return 56;
      case 'normal': return 44;
      case 'compact': default: return 36;
    }
  });

  // ─── Phase A: New Computed Properties ─────────────────────────────────────

  /** Read-only unified state snapshot assembled from existing signals. */
  readonly gridStateSnapshot = computed(() => ({
    search: this.searchQuery(),
    filters: this.filterState(),
    sorting: this.sortState(),
    pagination: {
      page: this.currentPage(),
      pageSize: this.pageSizeSignal(),
      total: this.lazy() ? this.totalRecords() : this.filteredData().length,
    },
    density: this.densitySignal(),
    visibleColumns: this.visibleColumnsSignal(),
  }));

  /**
   * Per-column header metadata map — built once per signal change.
   * O(1) lookups in template via columnHeaderMeta().get(col.field).
   */
  readonly columnHeaderMeta = computed<Map<string, GridColumnHeaderMeta>>(() => {
    const sorts = this.sortState();
    const filters = this.filterState();
    const map = new Map<string, GridColumnHeaderMeta>();
    for (const col of this.columnsWithOverrides()) {
      const s = sorts.find(x => x.field === col.field);
      map.set(col.field, {
        field: col.field,
        isSorted: !!s,
        sortDirection: s?.direction,
        sortOrder: s?.order,
        isFiltered: filters.some(f => f.field === col.field),
        isSearchMatched: false,
        isPinned: col.sticky === 'left' || col.sticky === 'right',
        isEdited: this.editingRowIds().size > 0,
        isGrouped: false,
        isFrozen: false,
        isCalculated: false,
        hasFormula: !!col.formula,
        hasErrors: false,
        hasWarnings: false,
        isDirty: false,
      });
    }
    return map;
  });

  /** Active filter chips for display in the toolbar. */
  readonly activeFilterChips = computed<Array<{ label: string; field: string; value: string }>>(() =>
    this.filterState().map(f => {
      const col = this.columnsWithOverrides().find(c => c.field === f.field);
      return {
        label: `${col?.header ?? f.field}: ${f.value}`,
        field: f.field,
        value: String(f.value),
      };
    })
  );

  /** True when any filter or search is active. Controls 'Clear all' visibility. */
  readonly hasActiveFilters = computed<boolean>(() =>
    this.filterState().length > 0 || this.searchQuery().length > 0
  );

  constructor() {
    effect(() => { this.pageSizeSignal.set(this.pageSize()); });
    effect(() => { this.densitySignal.set(this.density()); });

    effect(() => {
      const cols = this.columns();
      if (cols.length > 0) {
        untracked(() => {
          this.loadPersistedState();
        });
      }
    });

    effect(() => {
      const query = this.searchQuery();
      untracked(() => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.searchChange.emit(query), 250);
      });
    });

    effect(() => {
      const data = this.data();
      const editingIds = this.editingRowIds();
      const uneditedNewRow = data.find(r => this.isNewRow(r) && !editingIds.has(this.getRowId(r)));
      if (uneditedNewRow) untracked(() => this.startEditRow(uneditedNewRow));
    });

    effect(() => {
      const data = this.data();
      const mode = this.paginationMode();
      const isLazy = this.lazy();
      const currentPage = this.currentPage();

      untracked(() => {
        if (mode === 'infinite' && isLazy) {
          if (currentPage === 0) {
            this.accumulatedData.set([...data]);
          } else {
            const current = this.accumulatedData();
            const currentIds = new Set(current.map(c => this.getRowId(c)));
            const newItems = data.filter(d => !currentIds.has(this.getRowId(d)));
            if (newItems.length > 0) this.accumulatedData.set([...current, ...newItems]);
          }
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.plugins().forEach(p => p.onDestroy?.());
    clearTimeout(this.searchTimeout);
  }

  getRowId = (row: any): string => {
    if (!row) return '';
    return String(row?.[this.dataKey()] ?? '');
  };

  isNewRow(row: any): boolean {
    if (!row) return false;
    return String(row?.[this.dataKey()] ?? '').startsWith('new_');
  }

  trackByRowId = (index: number, row: any): string => {
    if (!row) return String(index);
    return String(row?.[this.dataKey()] ?? index);
  };


  // ─── Bulk Editing Engine ──────────────────────────────────────────────────
  startEditRow(row: any): void {
    if (this.editingRowIds().size > 0) this.cancelAllEdits();

    const id = this.getRowId(row);
    this.editingRowIds.set(new Set([id]));
    this.editDrafts.set(new Map([[id, structuredClone(row)]]));
    this.originalSnapshots.set(new Map([[id, structuredClone(row)]]));
    this.gridService.clearHistory();
  }

  startBulkEdit(): void {
    const ids = this.selectedRowIds();
    if (ids.size === 0) return;

    const drafts = new Map<string, any>();
    const snaps = new Map<string, any>();

    this.data().forEach(row => {
      const id = this.getRowId(row);
      if (ids.has(id)) {
        drafts.set(id, structuredClone(row));
        snaps.set(id, structuredClone(row));
      }
    });

    this.editingRowIds.set(new Set(ids));
    this.editDrafts.set(drafts);
    this.originalSnapshots.set(snaps);
    this.gridService.clearHistory();
    this.selectedRowIds.set(new Set());

    setTimeout(() => this.viewport.scrollToIndex(0, 'smooth'), 50);
  }

  saveAllEdits(): void {
    const drafts = this.editDrafts();
    const snaps = this.originalSnapshots();
    const ids = this.editingRowIds();

    const savedEvents: GridRowSaveEvent[] = [];

    ids.forEach(id => {
      const draft = drafts.get(id);
      const original = snaps.get(id);
      if (draft && original) {
        const dirtyFields = Object.keys(draft).filter(k => JSON.stringify(draft[k]) !== JSON.stringify(original[k]));
        savedEvents.push({ row: draft, originalRow: original, isNew: id.startsWith('new_'), dirtyFields });
        this.modifiedRowIds.update(s => new Set(s).add(id));
      }
    });

    if (savedEvents.length === 1) this.rowSave.emit(savedEvents[0]);
    else if (savedEvents.length > 1) this.bulkSave.emit(savedEvents);

    this.editingRowIds.set(new Set());
    this.editDrafts.set(new Map());
    this.originalSnapshots.set(new Map());
    this.gridService.clearHistory();
  }

  cancelAllEdits(): void {
    const newRows = Array.from(this.editingRowIds()).filter(id => id.startsWith('new_'));
    if (newRows.length > 0) this.refresh.emit();

    this.editingRowIds.set(new Set());
    this.editDrafts.set(new Map());
    this.originalSnapshots.set(new Map());
    this.gridService.clearHistory();
  }

  onCellChange(event: GridCellChangeEvent, rowId: string): void {
    if (this.editingRowIds().has(rowId)) {
      const drafts = new Map(this.editDrafts());
      const draft = drafts.get(rowId);
      if (draft) {
        draft[event.field] = event.newValue;
        drafts.set(rowId, draft);
        this.editDrafts.set(drafts);
      }
    }

    if (!this.enableUndo()) return;
    this.gridService.push({
      type: 'cell', rowId, field: event.field,
      previousValue: event.previousValue, nextValue: event.newValue,
    });
  }

  // ─── Selection Logic ──────────────────────────────────────────────────────
  onRowClick(row: any, event: MouseEvent): void {
    if (!this.rowSelection()) {
      this.rowClick.emit(row);
      return;
    }
    if (this.editingRowIds().has(this.getRowId(row))) return;

    if (this.multipleSelection() && event.shiftKey && this.lastClickedId) this.rangeSelect(row);
    else if (this.multipleSelection() && (event.ctrlKey || event.metaKey)) this.toggleSelectRow(row);
    else this.rowClick.emit(row);
  }

  onRowDoubleClick(row: any): void {
    if (this.viewOnly()) {
      this.rowDoubleClick.emit(row);
      return; // Block editing entirely in view-only mode
    }
    this.startEditRow(row);
    this.rowDoubleClick.emit(row);
  }

  // onRowDoubleClick(row: any): void {
  //   this.startEditRow(row);
  //   this.rowDoubleClick.emit(row);
  // }

  onCheckboxClick(row: any, event: MouseEvent): void {
    event.stopPropagation();
    if (event.shiftKey && this.lastClickedId && this.multipleSelection()) this.rangeSelect(row);
    else this.toggleSelectRow(row);
  }

  onSelectAll(checked: boolean): void {
    if (checked) {
      const ids = new Set(this.displayData().map(r => this.getRowId(r)));
      this.selectedRowIds.set(ids);
    } else {
      this.selectedRowIds.set(new Set());
    }
    this.emitSelection();
  }

  clearSelection(): void {
    this.selectedRowIds.set(new Set());
    this.emitSelection();
  }

  private toggleSelectRow(row: any): void {
    const id = this.getRowId(row);
    this.selectedRowIds.update(ids => {
      const n = new Set(ids);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    this.lastClickedId = id;
    this.emitSelection();
  }

  private rangeSelect(toRow: any): void {
    const data = this.displayData();
    const fromIdx = data.findIndex(r => this.getRowId(r) === this.lastClickedId);
    const toIdx = data.findIndex(r => this.getRowId(r) === this.getRowId(toRow));
    if (fromIdx < 0 || toIdx < 0) return;

    const lo = Math.min(fromIdx, toIdx);
    const hi = Math.max(fromIdx, toIdx);
    const ids = new Set(this.selectedRowIds());
    for (let i = lo; i <= hi; i++) ids.add(this.getRowId(data[i]));

    this.selectedRowIds.set(ids);
    this.emitSelection();
  }

  private emitSelection(): void {
    const ids = this.selectedRowIds();
    const rows = this.data().filter(r => ids.has(this.getRowId(r)));
    this.selectionChange.emit(rows);
    this.plugins().forEach(p => p.onSelectionChange?.(rows, this.buildContext()));
  }

  // ─── Sort, Filter, Scroll, Overlays ───────────────────────────────────────
  onSort(field: string): void {
    this.sortState.update(state => {
      const existing = state.find(s => s.field === field);
      if (!existing) return [...state, { field, direction: 'asc', order: state.length }];
      if (existing.direction === 'asc') return state.map(s => s.field === field ? { ...s, direction: 'desc' as const } : s);
      return state.filter(s => s.field !== field).map((s, i) => ({ ...s, order: i }));
    });
    this.currentPage.set(0);
    this.sortChange.emit(this.sortState());
    if (this.persistState()) this.stateService.setSortState(this.getGridStorageId(), this.sortState());
  }

  private applyFilter(row: any, f: GridFilterState): boolean {
    const val = String(row[f.field] ?? '').toLowerCase();
    const target = String(f.value ?? '').toLowerCase();
    switch (f.operator) {
      case 'equals': return val === target;
      case 'startsWith': return val.startsWith(target);
      case 'endsWith': return val.endsWith(target);
      case 'gt': return Number(row[f.field]) > Number(f.value);
      case 'lt': return Number(row[f.field]) < Number(f.value);
      case 'contains': default: return val.includes(target);
    }
  }

  private applySort(a: any, b: any, sort: GridSortState[]): number {
    for (const s of sort) {
      const av = a[s.field]; const bv = b[s.field];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
    }
    return 0;
  }

  onFilterChange(filters: GridFilterState[]): void {
    this.filterState.set(filters);
    this.currentPage.set(0);

    // Legacy emit — always fires (backward compat)
    this.filterChange.emit(filters);
    // Unified state — always fires
    this.gridStateChange.emit(this.gridStateSnapshot());
    // Server query — only fires when mode is 'server'
    if (this.filteringMode() === 'server') {
      this.queryChange.emit(buildGridQuery(this.gridStateSnapshot(), this.columns()));
    }

    this.plugins().forEach(p => p.onFilter?.(filters, this.buildContext()));
  }

  /**
   * Clears all active filters AND the search query in one atomic operation.
   * Emits legacy outputs, gridStateChange, and queryChange (if any mode is server).
   */
  clearAllFilters(): void {
    this.filterState.set([]);
    this.searchQuery.set('');
    this.currentPage.set(0);

    this.filterChange.emit([]);
    this.gridStateChange.emit(this.gridStateSnapshot());
    if (this.filteringMode() === 'server' || this.searchMode() === 'server') {
      this.queryChange.emit(buildGridQuery(this.gridStateSnapshot(), this.columns()));
    }
  }

  /**
   * Removes a single filter chip by field name.
   * Delegates to onFilterChange so all emissions and mode logic are applied.
   */
  removeFilterChip(field: string): void {
    this.onFilterChange(this.filterState().filter(f => f.field !== field));
  }

  onPageChange(state: GridPageState): void {
    this.currentPage.set(state.page);
    this.pageSizeSignal.set(state.pageSize);
    this.pageChange.emit(state);
    if (this.persistState()) this.stateService.saveState(this.getGridStorageId(), { density: this.densitySignal() });
  }

  onPageSizeChange(size: number): void {
    this.pageSizeSignal.set(size);
    this.currentPage.set(0);
    this.pageSizeChange.emit(size);
  }

  onPaginationModeChange(mode: 'pages' | 'infinite'): void {
    this.paginationMode.set(mode);
    this.currentPage.set(0);
    this.accumulatedData.set([...this.data()]);
    this.pageChange.emit({ page: 0, pageSize: this.pageSizeSignal(), total: this.totalRecords() });
  }

  onGridScroll(event: any): void {
    if (this.paginationMode() !== 'infinite' || !this.lazy() || this.loading()) return;
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
      if (this.accumulatedData().length < this.totalRecords()) {
        const nextPage = this.currentPage() + 1;
        this.currentPage.set(nextPage);
        this.pageChange.emit({ page: nextPage, pageSize: this.pageSizeSignal(), total: this.totalRecords() });
      }
    }
  }

  onDensityChange(d: GridDensity): void {
    this.densitySignal.set(d);
    if (this.persistState()) this.stateService.setDensity(this.getGridStorageId(), d);
  }

  onPinChange(event: { field: string; sticky: 'left' | 'right' | false }): void {
    this.columnOverrides.update(o => ({ ...o, [event.field]: { ...o[event.field], sticky: event.sticky } }));
  }

  onExport(format: 'csv' | 'json' | 'xlsx'): void {
    const data = this.filteredData();
    const cols = this.visibleColumnList();
    switch (format) {
      case 'csv': this.gridService.exportAsCSV(data, cols); break;
      case 'json': this.gridService.exportAsJSON(data, cols); break;
      case 'xlsx': this.gridService.exportAsXLSX(data, cols); break;
    }
  }

  onAddRow(): void {
    if (this.editingRowIds().size > 0 && this.data().some(r => this.isNewRow(r))) {
      this.messageService?.add({ severity: 'warn', summary: 'Blocked', detail: 'Finish editing the current record first.' });
      return;
    }
    this.addNew.emit();
  }

  onDeleteRow(row: any): void { this.rowDelete.emit(row); }
  onDuplicateRow(row: any): void { this.rowDuplicate.emit(row); }
  onCustomRowAction(action: GridRowAction, row: any): void { action.callback(row, this.buildContext()); }

  onBulkActionById(actionId: string): void {
    const action = this.bulkActions().find(a => a.id === actionId);
    const ids = this.selectedRowIds();
    const rows = this.data().filter(r => ids.has(this.getRowId(r)));
    if (action) action.callback(rows, this.buildContext());
    this.bulkAction.emit({ actionId, rows });
  }

  onContextMenu(event: MouseEvent, row: any): void {
    if (!this.enableContextMenu()) return;
    event.preventDefault();
    this.contextMenuPos.set({ x: event.clientX, y: event.clientY });
    this.contextMenuRow.set(row);
    this.showContextMenu.set(true);
  }

  onContextMenuAction(evt: ContextMenuActionEvent): void {
    const row = evt.row;
    switch (evt.id) {
      case 'edit': this.startEditRow(row); break;
      case 'save': this.saveAllEdits(); break;
      case 'cancel': this.cancelAllEdits(); break;
      case 'delete': this.onDeleteRow(row); break;
      case 'duplicate': this.onDuplicateRow(row); break;
      case 'copy': this.gridService.copyRows([row]); break;
      case 'paste': {
        const pasted = this.gridService.pasteRows();
        pasted.forEach(r => this.rowDuplicate.emit(r));
        break;
      }
      case 'undo': this.performUndo(); break;
      case 'redo': this.performRedo(); break;
      default: {
        const action = this.rowActions().find(a => a.id === evt.id);
        if (action) action.callback(row, this.buildContext());
      }
    }
  }

  onVisibilityChange(visible: string[]): void {
    this.visibleColumnsSignal.set(visible);
    if (this.persistState()) this.stateService.setVisibleColumns(this.getGridStorageId(), visible);
  }

  onApplyView(view: GridSavedView): void {
    this.visibleColumnsSignal.set(view.columns);
    if (view.sortState) this.sortState.set(view.sortState);
    if (view.filterState) this.filterState.set(view.filterState);
    if (view.density) this.densitySignal.set(view.density);
    this.activeViewId.set(view.id);
    this.currentPage.set(0);
  }

  onSaveCurrentView(name: string): void {
    const view: GridSavedView = {
      id: `view_${Date.now()}`, name,
      columns: this.visibleColumnsSignal().length ? this.visibleColumnsSignal() : this.columns().map(c => c.field),
      sortState: this.sortState(), filterState: this.filterState(), density: this.densitySignal(),
    };
    this.stateService.saveView(this.getGridStorageId(), view);
    this.savedViews.update(views => [...views, view]);
    this.activeViewId.set(view.id);
  }

  onDeleteView(viewId: string): void {
    this.stateService.deleteView(this.getGridStorageId(), viewId);
    this.savedViews.update(views => views.filter(v => v.id !== viewId));
    if (this.activeViewId() === viewId) this.activeViewId.set(null);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.editingRowIds().size > 0) {
      event.preventDefault();
      this.cancelAllEdits();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      event.shiftKey ? this.performRedo() : this.performUndo();
      return;
    }
    const active = document.activeElement as HTMLElement;
    if (!active || !active.closest('.apex-dg-cell')) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      if (this.editingRowIds().size > 0) return;
      event.preventDefault();
      this.navigateGrid(event.key, active);
    }
  }

  private navigateGrid(direction: string, currentCell: HTMLElement): void {
    const row = currentCell.closest('.apex-dg-row') as HTMLElement;
    const allRows = Array.from(this.gridBody.nativeElement.querySelectorAll('.apex-dg-row'));
    const allCells = Array.from(row.querySelectorAll('.apex-dg-cell'));

    let rowIdx = allRows.indexOf(row);
    let colIdx = allCells.indexOf(currentCell);

    switch (direction) {
      case 'ArrowUp': rowIdx = Math.max(0, rowIdx - 1); break;
      case 'ArrowDown': rowIdx = Math.min(allRows.length - 1, rowIdx + 1); break;
      case 'ArrowLeft': colIdx = Math.max(0, colIdx - 1); break;
      case 'ArrowRight': colIdx = Math.min(allCells.length - 1, colIdx + 1); break;
    }

    const targetRow = allRows[rowIdx];
    const targetCell = targetRow?.querySelectorAll('.apex-dg-cell')[colIdx] as HTMLElement;
    if (targetCell) {
      targetCell.focus();
      if (direction === 'ArrowUp' || direction === 'ArrowDown') targetCell.scrollIntoView({ block: 'nearest' });
    }
  }

  private performUndo(): void {
    if (!this.enableUndo()) return;
    const entry = this.gridService.undo();
    if (!entry || !entry.field) return;
    const drafts = new Map(this.editDrafts());
    const draft = drafts.get(entry.rowId);
    if (draft) {
      draft[entry.field] = entry.previousValue;
      drafts.set(entry.rowId, draft);
      this.editDrafts.set(drafts);
    }
  }

  private performRedo(): void {
    if (!this.enableUndo()) return;
    const entry = this.gridService.redo();
    if (!entry || !entry.field) return;
    const drafts = new Map(this.editDrafts());
    const draft = drafts.get(entry.rowId);
    if (draft) {
      draft[entry.field] = entry.nextValue;
      drafts.set(entry.rowId, draft);
      this.editDrafts.set(drafts);
    }
  }

  private loadPersistedState(): void {
    if (!this.persistState()) return;
    const state = this.stateService.loadState(this.getGridStorageId());
    if (!state) return;
    if (state.visibleColumns?.length) this.visibleColumnsSignal.set(state.visibleColumns);
    if (state.density) this.densitySignal.set(state.density);
    if (state.sortState?.length) this.sortState.set(state.sortState);
    if (state.savedViews?.length) this.savedViews.set(state.savedViews);
    if (state.columnWidths) {
      const overrides = Object.keys(state.columnWidths).reduce((acc, field) => {
        return { ...acc, [field]: { width: state.columnWidths![field] } };
      }, {});
      this.columnOverrides.set(overrides);
    }
  }

  private buildContext(): GridContext {
    return {
      getData: () => this.data(),
      getColumns: () => this.columns(),
      getSelectedRows: () => {
        const ids = this.selectedRowIds();
        return this.data().filter(r => ids.has(this.getRowId(r)));
      },
      getEditingRowId: () => null,
      startEditRow: (row) => this.startEditRow(row),
      saveEditRow: () => this.saveAllEdits(),
      cancelEditRow: () => this.cancelAllEdits(),
      addRow: () => this.onAddRow(),
      deleteRow: (row) => this.onDeleteRow(row),
      duplicateRow: (row) => this.onDuplicateRow(row),
      undo: () => this.performUndo(),
      redo: () => this.performRedo(),
      refresh: () => this.refresh.emit(),
      exportAs: (format) => this.onExport(format),
      setFilter: (field, state) => {
        const current = this.filterState().filter(f => f.field !== field);
        this.filterState.set([...current, { field, operator: 'contains', value: '', ...state }]);
      },
      clearFilters: () => this.filterState.set([]),
      setSort: (field, direction) => this.sortState.set([{ field, direction, order: 0 }]),
      getGridState: (): GridPersistedState => ({
        visibleColumns: this.visibleColumnsSignal(),
        columnOrder: this.columns().map(c => c.field),
        columnWidths: this.columnsWithOverrides().reduce((acc, c) => ({ ...acc, [c.field]: c.width ?? '' }), {}),
        sortState: this.sortState(),
        density: this.densitySignal(),
        savedViews: this.savedViews(),
        activeViewId: this.activeViewId() ?? undefined,
      }),
    };
  }
}
