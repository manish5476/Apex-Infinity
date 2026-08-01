import { ScrollingModule, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { Component, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, inject, input, output, signal, computed, effect, untracked, HostListener } from "@angular/core";
import { MessageService } from "primeng/api";
import { GridActionsComponent } from "../components/grid-actions.component";
import { GridColumnManagerComponent } from "../components/grid-column-manager.component";
import { GridContextMenuComponent, ContextMenuActionEvent } from "../components/grid-context-menu.component";
import { GridEmptyStateComponent } from "../components/grid-empty-state.component";
import { GridFilterBarComponent } from "../components/grid-filter-bar.component";
import { GridLoadingComponent } from "../components/grid-loading.component";
import { GridPaginationComponent } from "../components/grid-pagination.component";
import { GridSavedViewsComponent } from "../components/grid-saved-views.component";
import { GridToolbarComponent } from "../components/grid-toolbar.component";
import { GridCellComponent } from "../components/gridCell/grid-cell.component";
import { GridStateService } from "../grid-state.service";
import { GridColumn, GridDensity, GridRowAction, GridBulkAction, GridPlugin, GridRowSaveEvent, GridBulkActionEvent, GridPageState, GridSortState, GridFilterState, GridSavedView, GridCellChangeEvent, GridContext, GridPersistedState } from "../grid-types";
import { GridService } from "../grid.service";

@Component({
  selector: 'app-data-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GridService],
  imports: [
    CommonModule, ScrollingModule, GridToolbarComponent, GridCellComponent,
    GridActionsComponent, GridPaginationComponent, GridEmptyStateComponent,
    GridLoadingComponent, GridFilterBarComponent, GridColumnManagerComponent,
    GridSavedViewsComponent, GridContextMenuComponent,
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
        this.stateService.setColumnWidths(this.gridId(), widths);
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
    template += ' 80px'; 
  }
  return template;
});

  filteredData = computed<any[]>(() => {
    if (this.lazy()) return this.data();
    
    let result = this.data();
    const query = this.searchQuery().trim().toLowerCase();
    const filters = this.filterState();
    const sort = this.sortState();

    if (query) {
      const searchCols = this.columnsWithOverrides().filter(c => c.searchable !== false && c.type !== 'action');
      result = result.filter(row => searchCols.some(col => String(row[col.field] ?? '').toLowerCase().includes(query)));
    }
    if (filters.length > 0) result = result.filter(row => filters.every(f => this.applyFilter(row, f)));
    if (sort.length > 0) result = [...result].sort((a, b) => this.applySort(a, b, sort));

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
    if (this.persistState()) this.stateService.setSortState(this.gridId(), this.sortState());
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
    this.filterChange.emit(filters);
  }

  onPageChange(state: GridPageState): void {
    this.currentPage.set(state.page);
    this.pageSizeSignal.set(state.pageSize);
    this.pageChange.emit(state);
    if (this.persistState()) this.stateService.saveState(this.gridId(), { density: this.densitySignal() });
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
    if (this.persistState()) this.stateService.setDensity(this.gridId(), d);
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
    if (this.persistState()) this.stateService.setVisibleColumns(this.gridId(), visible);
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
    this.stateService.saveView(this.gridId(), view);
    this.savedViews.update(views => [...views, view]);
    this.activeViewId.set(view.id);
  }

  onDeleteView(viewId: string): void {
    this.stateService.deleteView(this.gridId(), viewId);
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

    switch(direction) {
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
    const state = this.stateService.loadState(this.gridId());
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
        columnWidths: this.columnsWithOverrides().reduce((acc, c) => ({...acc, [c.field]: c.width ?? ''}), {}),
        sortState: this.sortState(),
        density: this.densitySignal(),
        savedViews: this.savedViews(),
        activeViewId: this.activeViewId() ?? undefined,
      }),
    };
  }
}



// import { ScrollingModule, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
// import { CommonModule } from "@angular/common";
// import { Component, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, inject, input, output, signal, computed, effect, untracked, HostListener } from "@angular/core";
// import { MessageService } from "primeng/api";
// import { GridActionsComponent } from "../components/grid-actions.component";
// import { GridColumnManagerComponent } from "../components/grid-column-manager.component";
// import { GridContextMenuComponent, ContextMenuActionEvent } from "../components/grid-context-menu.component";
// import { GridEmptyStateComponent } from "../components/grid-empty-state.component";
// import { GridFilterBarComponent } from "../components/grid-filter-bar.component";
// import { GridLoadingComponent } from "../components/grid-loading.component";
// import { GridPaginationComponent } from "../components/grid-pagination.component";
// import { GridSavedViewsComponent } from "../components/grid-saved-views.component";
// import { GridToolbarComponent } from "../components/grid-toolbar.component";
// import { GridCellComponent } from "../components/gridCell/grid-cell.component";
// import { GridStateService } from "../grid-state.service";
// import { GridColumn, GridDensity, GridRowAction, GridBulkAction, GridPlugin, GridRowSaveEvent, GridBulkActionEvent, GridPageState, GridSortState, GridFilterState, GridSavedView, GridCellChangeEvent, GridContext, GridPersistedState } from "../grid-types";
// import { GridService } from "../grid.service";

// @Component({
//   selector: 'app-data-grid',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   providers: [GridService],
//   imports: [
//     CommonModule, ScrollingModule, GridToolbarComponent, GridCellComponent,
//     GridActionsComponent, GridPaginationComponent, GridEmptyStateComponent,
//     GridLoadingComponent, GridFilterBarComponent, GridColumnManagerComponent,
//     GridSavedViewsComponent, GridContextMenuComponent,
//   ],
//   templateUrl: './data-grid.component.html',
//   styleUrls: ['./data-grid.component.scss'],
//   host: { 
//     class: 'apex-grid-host flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden',
//     'role': 'grid',
//     '[attr.aria-rowcount]': 'lazy() ? totalRecords() : filteredData().length'
//   }
// })
// export class DataGridComponent implements OnDestroy {
//   @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
//   @ViewChild('gridBody') gridBody!: ElementRef<HTMLElement>;

//   readonly gridService = inject(GridService);
//   private stateService = inject(GridStateService);
//   private messageService = inject(MessageService, { optional: true });

//   data = input.required<any[]>();
//   columns = input.required<GridColumn[]>();

//   gridId = input<string>('default');
//   dataKey = input<string>('id');
//   lazy = input<boolean>(false);
//   totalRecords = input<number>(0);
//   toolbar = input<boolean>(true);
//   rowSelection = input<boolean>(true);
//   multipleSelection = input<boolean>(true);
//   pagination = input<boolean>(true);
//   pageSize = input<number>(50); 
//   loading = input<boolean>(false);
//   density = input<GridDensity>('compact');
//   emptyMessage = input<string>('No records found');
//   rowActions = input<GridRowAction[]>([]);
//   bulkActions = input<GridBulkAction[]>([]);
//   persistState = input<boolean>(true);
//   plugins = input<GridPlugin[]>([]);
//   enableUndo = input<boolean>(true);
//   enableClipboard = input<boolean>(true);
//   enableExport = input<boolean>(true);
//   enableSavedViews = input<boolean>(true);
//   enableContextMenu = input<boolean>(true);
//   enableAdd = input<boolean>(true);
//   stripedRows = input<boolean>(true);

//   rowSave = output<GridRowSaveEvent>();
//   bulkSave = output<GridRowSaveEvent[]>(); // New Output for Bulk Save
//   rowDelete = output<any>();
//   rowDuplicate = output<any>();
//   bulkAction = output<GridBulkActionEvent>();
//   pageChange = output<GridPageState>();
//   pageSizeChange = output<number>();
//   sortChange = output<GridSortState[]>();
//   filterChange = output<GridFilterState[]>();
//   searchChange = output<string>();
//   selectionChange = output<any[]>();
//   rowClick = output<any>();
//   rowDoubleClick = output<any>();
//   refresh = output<void>();
//   addNew = output<void>();

//   // ─── Bulk Edit State Engine ───────────────────────────────────────────────
//   editingRowIds = signal<Set<string>>(new Set());
//   editDrafts = signal<Map<string, any>>(new Map());
//   originalSnapshots = signal<Map<string, any>>(new Map());

//   selectedRowIds = signal<Set<string>>(new Set());
//   modifiedRowIds = signal<Set<string>>(new Set());
  
//   searchQuery = signal<string>('');
//   sortState = signal<GridSortState[]>([]);
//   filterState = signal<GridFilterState[]>([]);
  
//   currentPage = signal<number>(0);
//   pageSizeSignal = signal<number>(50);
//   densitySignal = signal<GridDensity>('compact');
  
//   visibleColumnsSignal = signal<string[]>([]);
//   savedViews = signal<GridSavedView[]>([]);
//   activeViewId = signal<string | null>(null);
//   paginationMode = signal<'pages' | 'infinite'>('pages');
  
//   columnOverrides = signal<Record<string, Partial<GridColumn>>>({});
//   accumulatedData = signal<any[]>([]);

//   showFilterBar = signal(false);
//   showColumnManager = signal(false);
//   showSavedViews = signal(false);
//   showContextMenu = signal(false);
//   contextMenuPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
//   contextMenuRow = signal<any>(null);

//   private searchTimeout: any;
//   private lastClickedId: string | null = null;

//   // ─── Computed Properties ──────────────────────────────────────────────────
//   columnsWithOverrides = computed<GridColumn[]>(() => {
//     const cols = this.columns();
//     const overrides = this.columnOverrides();
//     return cols.map(c => overrides[c.field] ? { ...c, ...overrides[c.field] } : c);
//   });

//   visibleColumnList = computed<GridColumn[]>(() => {
//     const all = this.columnsWithOverrides();
//     const vis = this.visibleColumnsSignal();
//     if (!vis.length) return all.filter(c => c.visible !== false);
//     return vis.map(v => all.find(c => c.field === v)).filter(Boolean) as GridColumn[];
//   });

//   gridTemplateColumns = computed(() => {
//     const cols = this.visibleColumnList();
//     let template = this.rowSelection() ? '48px ' : '';
//     template += '60px '; 
//     template += cols.map(c => `minmax(${c.minWidth ?? '120px'}, ${c.width ?? '1fr'})`).join(' ');
//     template += ' 80px'; 
//     return template;
//   });

//   filteredData = computed<any[]>(() => {
//     if (this.lazy()) return this.data();
    
//     let result = this.data();
//     const query = this.searchQuery().trim().toLowerCase();
//     const filters = this.filterState();
//     const sort = this.sortState();

//     if (query) {
//       const searchCols = this.columnsWithOverrides().filter(c => c.searchable !== false && c.type !== 'action');
//       result = result.filter(row => searchCols.some(col => String(row[col.field] ?? '').toLowerCase().includes(query)));
//     }
//     if (filters.length > 0) result = result.filter(row => filters.every(f => this.applyFilter(row, f)));
//     if (sort.length > 0) result = [...result].sort((a, b) => this.applySort(a, b, sort));

//     // HOISTING LOGIC: Pin all editing rows to the absolute top of the grid
//     const editingIds = this.editingRowIds();
//     if (editingIds.size > 0) {
//       const editingRows: any[] = [];
//       const normalRows: any[] = [];
//       for (const row of result) {
//         if (editingIds.has(this.getRowId(row))) editingRows.push(row);
//         else normalRows.push(row);
//       }
//       return [...editingRows, ...normalRows];
//     }

//     return result;
//   });

//   displayData = computed<any[]>(() => {
//     if (this.lazy() && this.paginationMode() === 'infinite') return this.accumulatedData();
//     if (this.lazy() || !this.pagination() || this.paginationMode() === 'infinite') return this.filteredData();
//     const start = this.currentPage() * this.pageSizeSignal();
//     return this.filteredData().slice(start, start + this.pageSizeSignal());
//   });

//   allSelected = computed(() => {
//     const ids = this.selectedRowIds();
//     const disp = this.displayData();
//     return disp.length > 0 && disp.every(r => ids.has(this.getRowId(r)));
//   });

//   indeterminate = computed(() => {
//     const ids = this.selectedRowIds();
//     return ids.size > 0 && !this.allSelected() && this.displayData().some(r => ids.has(this.getRowId(r)));
//   });

//   rowHeight = computed(() => {
//     switch (this.densitySignal()) {
//       case 'comfortable': return 56;
//       case 'normal': return 44;
//       case 'compact': default: return 36;
//     }
//   });

//   constructor() {
//     effect(() => { this.pageSizeSignal.set(this.pageSize()); }, { allowSignalWrites: true });
//     effect(() => { this.densitySignal.set(this.density()); }, { allowSignalWrites: true });

//     effect(() => { if (this.columnsWithOverrides().length) this.loadPersistedState(); });

//     effect(() => {
//       const query = this.searchQuery();
//       untracked(() => {
//         clearTimeout(this.searchTimeout);
//         this.searchTimeout = setTimeout(() => this.searchChange.emit(query), 250);
//       });
//     });

//     effect(() => {
//       const data = this.data();
//       const editingIds = this.editingRowIds();
//       const uneditedNewRow = data.find(r => this.isNewRow(r) && !editingIds.has(this.getRowId(r)));
//       if (uneditedNewRow) untracked(() => this.startEditRow(uneditedNewRow));
//     });

//     effect(() => {
//       const data = this.data();
//       const mode = this.paginationMode();
//       const isLazy = this.lazy();
//       const currentPage = this.currentPage();

//       untracked(() => {
//         if (mode === 'infinite' && isLazy) {
//           if (currentPage === 0) {
//             this.accumulatedData.set([...data]);
//           } else {
//             const current = this.accumulatedData();
//             const currentIds = new Set(current.map(c => this.getRowId(c)));
//             const newItems = data.filter(d => !currentIds.has(this.getRowId(d)));
//             if (newItems.length > 0) this.accumulatedData.set([...current, ...newItems]);
//           }
//         }
//       });
//     });
//   }

//   ngOnDestroy(): void {
//     this.plugins().forEach(p => p.onDestroy?.());
//     clearTimeout(this.searchTimeout);
//   }

//   getRowId = (row: any): string => {
//     if (!row) return '';
//     return String(row?.[this.dataKey()] ?? '');
//   };

//   isNewRow(row: any): boolean {
//     if (!row) return false;
//     return String(row?.[this.dataKey()] ?? '').startsWith('new_');
//   }

//   trackByRowId = (index: number, row: any): string => {
//     if (!row) return String(index);
//     return String(row?.[this.dataKey()] ?? index);
//   };

//   // ─── Bulk Editing Engine ──────────────────────────────────────────────────
//   startEditRow(row: any): void {
//     if (this.editingRowIds().size > 0) this.cancelAllEdits();
    
//     const id = this.getRowId(row);
//     this.editingRowIds.set(new Set([id]));
//     this.editDrafts.set(new Map([[id, structuredClone(row)]]));
//     this.originalSnapshots.set(new Map([[id, structuredClone(row)]]));
//     this.gridService.clearHistory();
//   }

//   startBulkEdit(): void {
//     const ids = this.selectedRowIds();
//     if (ids.size === 0) return;

//     const drafts = new Map<string, any>();
//     const snaps = new Map<string, any>();
    
//     this.data().forEach(row => {
//       const id = this.getRowId(row);
//       if (ids.has(id)) {
//         drafts.set(id, structuredClone(row));
//         snaps.set(id, structuredClone(row));
//       }
//     });

//     this.editingRowIds.set(new Set(ids));
//     this.editDrafts.set(drafts);
//     this.originalSnapshots.set(snaps);
//     this.gridService.clearHistory();
//     this.selectedRowIds.set(new Set()); // Drop selection state so user focuses on Edit state

//     // Instantly scroll to top to see hoisted editable rows
//     setTimeout(() => this.viewport.scrollToIndex(0, 'smooth'), 50);
//   }

//   saveAllEdits(): void {
//     const drafts = this.editDrafts();
//     const snaps = this.originalSnapshots();
//     const ids = this.editingRowIds();
    
//     const savedEvents: GridRowSaveEvent[] = [];
    
//     ids.forEach(id => {
//       const draft = drafts.get(id);
//       const original = snaps.get(id);
//       if (draft && original) {
//         const dirtyFields = Object.keys(draft).filter(k => JSON.stringify(draft[k]) !== JSON.stringify(original[k]));
//         savedEvents.push({ row: draft, originalRow: original, isNew: id.startsWith('new_'), dirtyFields });
//         this.modifiedRowIds.update(s => new Set(s).add(id));
//       }
//     });

//     if (savedEvents.length === 1) {
//       this.rowSave.emit(savedEvents[0]);
//     } else if (savedEvents.length > 1) {
//       this.bulkSave.emit(savedEvents);
//     }
    
//     this.editingRowIds.set(new Set());
//     this.editDrafts.set(new Map());
//     this.originalSnapshots.set(new Map());
//     this.gridService.clearHistory();
//   }

//   cancelAllEdits(): void {
//     const newRows = Array.from(this.editingRowIds()).filter(id => id.startsWith('new_'));
//     if (newRows.length > 0) this.refresh.emit(); 
    
//     this.editingRowIds.set(new Set());
//     this.editDrafts.set(new Map());
//     this.originalSnapshots.set(new Map());
//     this.gridService.clearHistory();
//   }

//   onCellChange(event: GridCellChangeEvent, rowId: string): void {
//     if (this.editingRowIds().has(rowId)) {
//       const drafts = new Map(this.editDrafts());
//       const draft = drafts.get(rowId);
//       if (draft) {
//         draft[event.field] = event.newValue;
//         drafts.set(rowId, draft);
//         this.editDrafts.set(drafts); // Trigger signal update
//       }
//     }

//     if (!this.enableUndo()) return;
//     this.gridService.push({
//       type: 'cell', rowId, field: event.field,
//       previousValue: event.previousValue, nextValue: event.newValue,
//     });
//   }

//   // ─── Selection Logic ──────────────────────────────────────────────────────
//   onRowClick(row: any, event: MouseEvent): void {
//     if (!this.rowSelection()) {
//       this.rowClick.emit(row);
//       return;
//     }
//     if (this.editingRowIds().has(this.getRowId(row))) return;

//     if (this.multipleSelection() && event.shiftKey && this.lastClickedId) this.rangeSelect(row);
//     else if (this.multipleSelection() && (event.ctrlKey || event.metaKey)) this.toggleSelectRow(row);
//     else this.rowClick.emit(row);
//   }

//   onRowDoubleClick(row: any): void {
//     this.startEditRow(row);
//     this.rowDoubleClick.emit(row);
//   }

//   onCheckboxClick(row: any, event: MouseEvent): void {
//     event.stopPropagation();
//     if (event.shiftKey && this.lastClickedId && this.multipleSelection()) this.rangeSelect(row);
//     else this.toggleSelectRow(row);
//   }

//   onSelectAll(checked: boolean): void {
//     if (checked) {
//       const ids = new Set(this.displayData().map(r => this.getRowId(r)));
//       this.selectedRowIds.set(ids);
//     } else {
//       this.selectedRowIds.set(new Set());
//     }
//     this.emitSelection();
//   }

//   clearSelection(): void {
//     this.selectedRowIds.set(new Set());
//     this.emitSelection();
//   }

//   private toggleSelectRow(row: any): void {
//     const id = this.getRowId(row);
//     this.selectedRowIds.update(ids => {
//       const n = new Set(ids);
//       n.has(id) ? n.delete(id) : n.add(id);
//       return n;
//     });
//     this.lastClickedId = id;
//     this.emitSelection();
//   }

//   private rangeSelect(toRow: any): void {
//     const data = this.displayData();
//     const fromIdx = data.findIndex(r => this.getRowId(r) === this.lastClickedId);
//     const toIdx = data.findIndex(r => this.getRowId(r) === this.getRowId(toRow));
//     if (fromIdx < 0 || toIdx < 0) return;
    
//     const lo = Math.min(fromIdx, toIdx);
//     const hi = Math.max(fromIdx, toIdx);
//     const ids = new Set(this.selectedRowIds());
//     for (let i = lo; i <= hi; i++) ids.add(this.getRowId(data[i]));
    
//     this.selectedRowIds.set(ids);
//     this.emitSelection();
//   }

//   private emitSelection(): void {
//     const ids = this.selectedRowIds();
//     const rows = this.data().filter(r => ids.has(this.getRowId(r)));
//     this.selectionChange.emit(rows);
//     this.plugins().forEach(p => p.onSelectionChange?.(rows, this.buildContext()));
//   }

//   // ─── Sort, Filter, Scroll, Overlays ───────────────────────────────────────
//   onSort(field: string): void {
//     this.sortState.update(state => {
//       const existing = state.find(s => s.field === field);
//       if (!existing) return [...state, { field, direction: 'asc', order: state.length }];
//       if (existing.direction === 'asc') return state.map(s => s.field === field ? { ...s, direction: 'desc' as const } : s);
//       return state.filter(s => s.field !== field).map((s, i) => ({ ...s, order: i }));
//     });
//     this.currentPage.set(0);
//     this.sortChange.emit(this.sortState());
//     if (this.persistState()) this.stateService.setSortState(this.gridId(), this.sortState());
//   }

//   private applyFilter(row: any, f: GridFilterState): boolean {
//     const val = String(row[f.field] ?? '').toLowerCase();
//     const target = String(f.value ?? '').toLowerCase();
//     switch (f.operator) {
//       case 'equals': return val === target;
//       case 'startsWith': return val.startsWith(target);
//       case 'endsWith': return val.endsWith(target);
//       case 'gt': return Number(row[f.field]) > Number(f.value);
//       case 'lt': return Number(row[f.field]) < Number(f.value);
//       case 'contains': default: return val.includes(target);
//     }
//   }

//   private applySort(a: any, b: any, sort: GridSortState[]): number {
//     for (const s of sort) {
//       const av = a[s.field]; const bv = b[s.field];
//       const cmp = av < bv ? -1 : av > bv ? 1 : 0;
//       if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
//     }
//     return 0;
//   }

//   onFilterChange(filters: GridFilterState[]): void {
//     this.filterState.set(filters);
//     this.currentPage.set(0);
//     this.filterChange.emit(filters);
//   }

//   onPageChange(state: GridPageState): void {
//     this.currentPage.set(state.page);
//     this.pageSizeSignal.set(state.pageSize);
//     this.pageChange.emit(state);
//     if (this.persistState()) this.stateService.saveState(this.gridId(), { density: this.densitySignal() });
//   }

//   onPageSizeChange(size: number): void {
//     this.pageSizeSignal.set(size);
//     this.currentPage.set(0);
//     this.pageSizeChange.emit(size);
//   }

//   onPaginationModeChange(mode: 'pages' | 'infinite'): void {
//     this.paginationMode.set(mode);
//     this.currentPage.set(0);
//     this.accumulatedData.set([...this.data()]);
//     this.pageChange.emit({ page: 0, pageSize: this.pageSizeSignal(), total: this.totalRecords() });
//   }

//   onGridScroll(event: any): void {
//     if (this.paginationMode() !== 'infinite' || !this.lazy() || this.loading()) return;
//     const target = event.target as HTMLElement;
//     if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
//       if (this.accumulatedData().length < this.totalRecords()) {
//         const nextPage = this.currentPage() + 1;
//         this.currentPage.set(nextPage);
//         this.pageChange.emit({ page: nextPage, pageSize: this.pageSizeSignal(), total: this.totalRecords() });
//       }
//     }
//   }

//   onDensityChange(d: GridDensity): void {
//     this.densitySignal.set(d);
//     if (this.persistState()) this.stateService.setDensity(this.gridId(), d);
//   }

//   onPinChange(event: { field: string; sticky: 'left' | 'right' | false }): void {
//     this.columnOverrides.update(o => ({ ...o, [event.field]: { ...o[event.field], sticky: event.sticky } }));
//   }

//   onExport(format: 'csv' | 'json' | 'xlsx'): void {
//     const data = this.filteredData();
//     const cols = this.visibleColumnList();
//     switch (format) {
//       case 'csv': this.gridService.exportAsCSV(data, cols); break;
//       case 'json': this.gridService.exportAsJSON(data, cols); break;
//       case 'xlsx': this.gridService.exportAsXLSX(data, cols); break;
//     }
//   }

//   onAddRow(): void {
//     if (this.editingRowIds().size > 0 && this.data().some(r => this.isNewRow(r))) {
//       this.messageService?.add({ severity: 'warn', summary: 'Blocked', detail: 'Finish editing the current record first.' });
//       return;
//     }
//     this.addNew.emit();
//   }

//   onDeleteRow(row: any): void { this.rowDelete.emit(row); }
//   onDuplicateRow(row: any): void { this.rowDuplicate.emit(row); }
//   onCustomRowAction(action: GridRowAction, row: any): void { action.callback(row, this.buildContext()); }

//   onBulkActionById(actionId: string): void {
//     const action = this.bulkActions().find(a => a.id === actionId);
//     const ids = this.selectedRowIds();
//     const rows = this.data().filter(r => ids.has(this.getRowId(r)));
//     if (action) action.callback(rows, this.buildContext());
//     this.bulkAction.emit({ actionId, rows });
//   }

//   onContextMenu(event: MouseEvent, row: any): void {
//     if (!this.enableContextMenu()) return;
//     event.preventDefault();
//     this.contextMenuPos.set({ x: event.clientX, y: event.clientY });
//     this.contextMenuRow.set(row);
//     this.showContextMenu.set(true);
//   }

//   onContextMenuAction(evt: ContextMenuActionEvent): void {
//     const row = evt.row;
//     switch (evt.id) {
//       case 'edit': this.startEditRow(row); break;
//       case 'save': this.saveAllEdits(); break;
//       case 'cancel': this.cancelAllEdits(); break;
//       case 'delete': this.onDeleteRow(row); break;
//       case 'duplicate': this.onDuplicateRow(row); break;
//       case 'copy': this.gridService.copyRows([row]); break;
//       case 'paste': {
//         const pasted = this.gridService.pasteRows();
//         pasted.forEach(r => this.rowDuplicate.emit(r));
//         break;
//       }
//       case 'undo': this.performUndo(); break;
//       case 'redo': this.performRedo(); break;
//       default: {
//         const action = this.rowActions().find(a => a.id === evt.id);
//         if (action) action.callback(row, this.buildContext());
//       }
//     }
//   }

//   onVisibilityChange(visible: string[]): void {
//     this.visibleColumnsSignal.set(visible);
//     if (this.persistState()) this.stateService.setVisibleColumns(this.gridId(), visible);
//   }

//   onApplyView(view: GridSavedView): void {
//     this.visibleColumnsSignal.set(view.columns);
//     if (view.sortState) this.sortState.set(view.sortState);
//     if (view.filterState) this.filterState.set(view.filterState);
//     if (view.density) this.densitySignal.set(view.density);
//     this.activeViewId.set(view.id);
//     this.currentPage.set(0);
//   }

//   onSaveCurrentView(name: string): void {
//     const view: GridSavedView = {
//       id: `view_${Date.now()}`, name,
//       columns: this.visibleColumnsSignal().length ? this.visibleColumnsSignal() : this.columns().map(c => c.field),
//       sortState: this.sortState(), filterState: this.filterState(), density: this.densitySignal(),
//     };
//     this.stateService.saveView(this.gridId(), view);
//     this.savedViews.update(views => [...views, view]);
//     this.activeViewId.set(view.id);
//   }

//   onDeleteView(viewId: string): void {
//     this.stateService.deleteView(this.gridId(), viewId);
//     this.savedViews.update(views => views.filter(v => v.id !== viewId));
//     if (this.activeViewId() === viewId) this.activeViewId.set(null);
//   }

//   @HostListener('keydown', ['$event'])
//   onKeydown(event: KeyboardEvent): void {
//     if (event.key === 'Escape' && this.editingRowIds().size > 0) {
//       event.preventDefault();
//       this.cancelAllEdits();
//       return;
//     }
//     if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
//       event.preventDefault();
//       event.shiftKey ? this.performRedo() : this.performUndo();
//       return;
//     }
//     const active = document.activeElement as HTMLElement;
//     if (!active || !active.closest('.apex-dg-cell')) return;

//     if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
//       if (this.editingRowIds().size > 0) return; // Disable grid matrix navigation while editing
//       event.preventDefault();
//       this.navigateGrid(event.key, active);
//     }
//   }

//   private navigateGrid(direction: string, currentCell: HTMLElement): void {
//     const row = currentCell.closest('.apex-dg-row') as HTMLElement;
//     const allRows = Array.from(this.gridBody.nativeElement.querySelectorAll('.apex-dg-row'));
//     const allCells = Array.from(row.querySelectorAll('.apex-dg-cell'));
    
//     let rowIdx = allRows.indexOf(row);
//     let colIdx = allCells.indexOf(currentCell);

//     switch(direction) {
//       case 'ArrowUp': rowIdx = Math.max(0, rowIdx - 1); break;
//       case 'ArrowDown': rowIdx = Math.min(allRows.length - 1, rowIdx + 1); break;
//       case 'ArrowLeft': colIdx = Math.max(0, colIdx - 1); break;
//       case 'ArrowRight': colIdx = Math.min(allCells.length - 1, colIdx + 1); break;
//     }

//     const targetRow = allRows[rowIdx];
//     const targetCell = targetRow?.querySelectorAll('.apex-dg-cell')[colIdx] as HTMLElement;
//     if (targetCell) {
//       targetCell.focus();
//       if (direction === 'ArrowUp' || direction === 'ArrowDown') targetCell.scrollIntoView({ block: 'nearest' });
//     }
//   }

//   private performUndo(): void {
//     if (!this.enableUndo()) return;
//     const entry = this.gridService.undo();
//     if (!entry || !entry.field) return;
//     const drafts = new Map(this.editDrafts());
//     const draft = drafts.get(entry.rowId);
//     if (draft) {
//       draft[entry.field] = entry.previousValue;
//       drafts.set(entry.rowId, draft);
//       this.editDrafts.set(drafts);
//     }
//   }

//   private performRedo(): void {
//     if (!this.enableUndo()) return;
//     const entry = this.gridService.redo();
//     if (!entry || !entry.field) return;
//     const drafts = new Map(this.editDrafts());
//     const draft = drafts.get(entry.rowId);
//     if (draft) {
//       draft[entry.field] = entry.nextValue;
//       drafts.set(entry.rowId, draft);
//       this.editDrafts.set(drafts);
//     }
//   }

//   private loadPersistedState(): void {
//     if (!this.persistState()) return;
//     const state = this.stateService.loadState(this.gridId());
//     if (!state) return;
//     if (state.visibleColumns?.length) this.visibleColumnsSignal.set(state.visibleColumns);
//     if (state.density) this.densitySignal.set(state.density);
//     if (state.sortState?.length) this.sortState.set(state.sortState);
//     if (state.savedViews?.length) this.savedViews.set(state.savedViews);
//   }

//   private buildContext(): GridContext {
//     return {
//       getData: () => this.data(),
//       getColumns: () => this.columns(),
//       getSelectedRows: () => {
//         const ids = this.selectedRowIds();
//         return this.data().filter(r => ids.has(this.getRowId(r)));
//       },
//       getEditingRowId: () => null, // Deprecated for single edit
//       startEditRow: (row) => this.startEditRow(row),
//       saveEditRow: () => this.saveAllEdits(),
//       cancelEditRow: () => this.cancelAllEdits(),
//       addRow: () => this.onAddRow(),
//       deleteRow: (row) => this.onDeleteRow(row),
//       duplicateRow: (row) => this.onDuplicateRow(row),
//       undo: () => this.performUndo(),
//       redo: () => this.performRedo(),
//       refresh: () => this.refresh.emit(),
//       exportAs: (format) => this.onExport(format),
//       setFilter: (field, state) => {
//         const current = this.filterState().filter(f => f.field !== field);
//         this.filterState.set([...current, { field, operator: 'contains', value: '', ...state }]);
//       },
//       clearFilters: () => this.filterState.set([]),
//       setSort: (field, direction) => this.sortState.set([{ field, direction, order: 0 }]),
//       getGridState: (): GridPersistedState => ({
//         visibleColumns: this.visibleColumnsSignal(),
//         columnOrder: this.columns().map(c => c.field),
//         columnWidths: {},
//         sortState: this.sortState(),
//         density: this.densitySignal(),
//         savedViews: this.savedViews(),
//         activeViewId: this.activeViewId() ?? undefined,
//       }),
//     };
//   }
// }


// // import { ScrollingModule, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
// // import { CommonModule } from "@angular/common";
// // import { Component, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, inject, input, output, signal, linkedSignal, computed, effect, untracked, HostListener } from "@angular/core";
// // import { MessageService } from "primeng/api";
// // import { GridActionsComponent } from "../components/grid-actions.component";
// // import { GridCellComponent } from "../components/gridCell/grid-cell.component";
// // import { GridColumnManagerComponent } from "../components/grid-column-manager.component";
// // import { GridContextMenuComponent, ContextMenuActionEvent } from "../components/grid-context-menu.component";
// // import { GridEmptyStateComponent } from "../components/grid-empty-state.component";
// // import { GridFilterBarComponent } from "../components/grid-filter-bar.component";
// // import { GridLoadingComponent } from "../components/grid-loading.component";
// // import { GridPaginationComponent } from "../components/grid-pagination.component";
// // import { GridSavedViewsComponent } from "../components/grid-saved-views.component";
// // import { GridToolbarComponent } from "../components/grid-toolbar.component";
// // import { GridStateService } from "../grid-state.service";
// // import { GridColumn, GridDensity, GridRowAction, GridBulkAction, GridPlugin, GridRowSaveEvent, GridBulkActionEvent, GridPageState, GridSortState, GridFilterState, GridSavedView, GridCellChangeEvent, GridContext, GridPersistedState } from "../grid-types";
// // import { GridService } from "../grid.service";

// // @Component({
// //   selector: 'app-data-grid',
// //   standalone: true,
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   providers: [GridService],
// //   imports: [
// //     CommonModule,
// //     ScrollingModule,
// //     GridToolbarComponent,
// //     GridCellComponent,
// //     GridActionsComponent,
// //     GridPaginationComponent,
// //     GridEmptyStateComponent,
// //     GridLoadingComponent,
// //     GridFilterBarComponent,
// //     GridColumnManagerComponent,
// //     GridSavedViewsComponent,
// //     GridContextMenuComponent,
// //   ],
// //   templateUrl: './data-grid.component.html',
// //   styleUrls: ['./data-grid.component.scss'],
// //   host: { 
// //     class: 'apex-grid-host flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden',
// //     'role': 'grid',
// //     '[attr.aria-rowcount]': 'lazy() ? totalRecords() : filteredData().length'
// //   }
// // })
// // export class DataGridComponent implements OnDestroy {
// //   @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
// //   @ViewChild('gridBody') gridBody!: ElementRef<HTMLElement>;

// //   // ─── Services ─────────────────────────────────────────────────────────────
// //   readonly gridService = inject(GridService);
// //   private stateService = inject(GridStateService);
// //   private messageService = inject(MessageService, { optional: true });

// //   // ─── Required Inputs ──────────────────────────────────────────────────────
// //   data = input.required<any[]>();
// //   columns = input.required<GridColumn[]>();

// //   // ─── Configuration Inputs ─────────────────────────────────────────────────
// //   gridId = input<string>('default');
// //   dataKey = input<string>('id');
// //   lazy = input<boolean>(false);
// //   totalRecords = input<number>(0);
// //   toolbar = input<boolean>(true);
// //   rowSelection = input<boolean>(true);
// //   multipleSelection = input<boolean>(true);
// //   pagination = input<boolean>(true);
// //   pageSize = input<number>(50); 
// //   loading = input<boolean>(false);
// //   density = input<GridDensity>('compact');
// //   emptyMessage = input<string>('No records found');
// //   rowActions = input<GridRowAction[]>([]);
// //   bulkActions = input<GridBulkAction[]>([]);
// //   persistState = input<boolean>(true);
// //   plugins = input<GridPlugin[]>([]);
// //   enableUndo = input<boolean>(true);
// //   enableClipboard = input<boolean>(true);
// //   enableExport = input<boolean>(true);
// //   enableSavedViews = input<boolean>(true);
// //   enableContextMenu = input<boolean>(true);
// //   enableAdd = input<boolean>(true);
// //   stripedRows = input<boolean>(true);

// //   // ─── Outputs ──────────────────────────────────────────────────────────────
// //   rowSave = output<GridRowSaveEvent>();
// //   rowDelete = output<any>();
// //   rowDuplicate = output<any>();
// //   bulkAction = output<GridBulkActionEvent>();
// //   pageChange = output<GridPageState>();
// //   pageSizeChange = output<number>();
// //   sortChange = output<GridSortState[]>();
// //   filterChange = output<GridFilterState[]>();
// //   searchChange = output<string>();
// //   selectionChange = output<any[]>();
// //   rowClick = output<any>();
// //   rowDoubleClick = output<any>();
// //   refresh = output<void>();
// //   addNew = output<void>();

// //   // ─── State Management (Signals) ───────────────────────────────────────────
// //   editingRowId = signal<string | null>(null);
  
// //   editDraft = linkedSignal<string | null, any>({
// //     source: this.editingRowId,
// //     computation: (id) => {
// //       if (!id) return null;
// //       const row = this.data().find(r => this.getRowId(r) === id);
// //       return row ? structuredClone(row) : null;
// //     }
// //   });

// //   private editSnapshot: any = null;
// //   selectedRowIds = signal<Set<string>>(new Set());
// //   modifiedRowIds = signal<Set<string>>(new Set());
  
// //   searchQuery = signal<string>('');
// //   sortState = signal<GridSortState[]>([]);
// //   filterState = signal<GridFilterState[]>([]);
  
// //   currentPage = signal<number>(0);
// //   pageSizeSignal = linkedSignal({ source: this.pageSize, computation: s => s });
// //   densitySignal = linkedSignal({ source: this.density, computation: s => s });
  
// //   visibleColumnsSignal = signal<string[]>([]);
// //   savedViews = signal<GridSavedView[]>([]);
// //   activeViewId = signal<string | null>(null);
// //   paginationMode = signal<'pages' | 'infinite'>('pages');
  
// //   columnOverrides = signal<Record<string, Partial<GridColumn>>>({});
// //   accumulatedData = signal<any[]>([]);

// //   // ─── UI Overlay States ────────────────────────────────────────────────────
// //   showFilterBar = signal(false);
// //   showColumnManager = signal(false);
// //   showSavedViews = signal(false);
// //   showContextMenu = signal(false);
// //   contextMenuPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
// //   contextMenuRow = signal<any>(null);

// //   private searchTimeout: any;
// //   private lastClickedId: string | null = null;

// //   // ─── Computed Properties ──────────────────────────────────────────────────
// //   columnsWithOverrides = computed<GridColumn[]>(() => {
// //     const cols = this.columns();
// //     const overrides = this.columnOverrides();
// //     return cols.map(c => overrides[c.field] ? { ...c, ...overrides[c.field] } : c);
// //   });

// //   visibleColumnList = computed<GridColumn[]>(() => {
// //     const all = this.columnsWithOverrides();
// //     const vis = this.visibleColumnsSignal();
// //     if (!vis.length) return all.filter(c => c.visible !== false);
// //     return vis.map(v => all.find(c => c.field === v)).filter(Boolean) as GridColumn[];
// //   });

// //   gridTemplateColumns = computed(() => {
// //     const cols = this.visibleColumnList();
// //     let template = this.rowSelection() ? '48px ' : '';
// //     template += '60px '; // Sr No
// //     template += cols.map(c => `minmax(${c.minWidth ?? '120px'}, ${c.width ?? '1fr'})`).join(' ');
// //     template += ' 80px'; // Actions
// //     return template;
// //   });

// //   filteredData = computed<any[]>(() => {
// //     if (this.lazy()) return this.data();
    
// //     let result = this.data();
// //     const query = this.searchQuery().trim().toLowerCase();
// //     const filters = this.filterState();
// //     const sort = this.sortState();

// //     if (query) {
// //       const searchCols = this.columnsWithOverrides().filter(c => c.searchable !== false && c.type !== 'action');
// //       result = result.filter(row => searchCols.some(col => String(row[col.field] ?? '').toLowerCase().includes(query)));
// //     }

// //     if (filters.length > 0) {
// //       result = result.filter(row => filters.every(f => this.applyFilter(row, f)));
// //     }

// //     if (sort.length > 0) {
// //       result = [...result].sort((a, b) => this.applySort(a, b, sort));
// //     }

// //     return result;
// //   });

// //   displayData = computed<any[]>(() => {
// //     if (this.lazy() && this.paginationMode() === 'infinite') return this.accumulatedData();
// //     if (this.lazy() || !this.pagination() || this.paginationMode() === 'infinite') return this.filteredData();
    
// //     const start = this.currentPage() * this.pageSizeSignal();
// //     return this.filteredData().slice(start, start + this.pageSizeSignal());
// //   });

// //   allSelected = computed(() => {
// //     const ids = this.selectedRowIds();
// //     const disp = this.displayData();
// //     return disp.length > 0 && disp.every(r => ids.has(this.getRowId(r)));
// //   });

// //   indeterminate = computed(() => {
// //     const ids = this.selectedRowIds();
// //     return ids.size > 0 && !this.allSelected() && this.displayData().some(r => ids.has(this.getRowId(r)));
// //   });

// //   rowHeight = computed(() => {
// //     switch (this.densitySignal()) {
// //       case 'comfortable': return 56;
// //       case 'normal': return 44;
// //       case 'compact': default: return 36;
// //     }
// //   });

// //   // ─── Initialization ───────────────────────────────────────────────────────
// //   constructor() {
// //     effect(() => {
// //       if (this.columnsWithOverrides().length) this.loadPersistedState();
// //     });

// //     effect(() => {
// //       const query = this.searchQuery();
// //       untracked(() => {
// //         clearTimeout(this.searchTimeout);
// //         this.searchTimeout = setTimeout(() => this.searchChange.emit(query), 250);
// //       });
// //     });

// //     effect(() => {
// //       const ctx = this.buildContext();
// //       untracked(() => this.plugins().forEach(p => p.onInit?.(ctx)));
// //     });

// //     effect(() => {
// //       const data = this.data();
// //       const currentEditId = this.editingRowId();
// //       const uneditedNewRow = data.find(r => this.isNewRow(r) && this.getRowId(r) !== currentEditId);
// //       if (uneditedNewRow) untracked(() => this.startEditRow(uneditedNewRow));
// //     });

// //   effect(() => {
// //       const data = this.data();
// //       const mode = this.paginationMode();
// //       const isLazy = this.lazy();
// //       const currentPage = this.currentPage();

// //       untracked(() => {
// //         if (mode === 'infinite' && isLazy) {
// //           if (currentPage === 0) {
// //             // Reset on page 0
// //             this.accumulatedData.set([...data]);
// //           } else {
// //             const current = this.accumulatedData();
// //             // Use a Set for O(1) duplicate ID checking (Massive performance boost)
// //             const currentIds = new Set(current.map(c => this.getRowId(c)));
            
// //             // Only add items that don't already exist in the accumulated list
// //             const newItems = data.filter(d => !currentIds.has(this.getRowId(d)));
            
// //             if (newItems.length > 0) {
// //               this.accumulatedData.set([...current, ...newItems]);
// //             }
// //           }
// //         }
// //       });
// //     });
  
// //   }

// //   ngOnDestroy(): void {
// //     this.plugins().forEach(p => p.onDestroy?.());
// //     clearTimeout(this.searchTimeout);
// //   }

// // // ─── Core Helpers ─────────────────────────────────────────────────────────


// //   getRowId = (row: any): string => {
// //     if (!row) return '';
// //     return String(row?.[this.dataKey()] ?? '');
// //   };

// //   isNewRow(row: any): boolean {
// //     if (!row) return false;
// //     return String(row?.[this.dataKey()] ?? '').startsWith('new_');
// //   }

// //   // Bound arrow function so CDK Virtual For context never loses 'this'
// //   trackByRowId = (index: number, row: any): string => {
// //     if (!row) return String(index);
// //     return String(row?.[this.dataKey()] ?? index);
// //   };
// //   // ─── Progressive Editing (Immutable) ──────────────────────────────────────
// //   startEditRow(row: any): void {
// //     if (this.editingRowId()) this.cancelEditRow();
    
// //     this.editSnapshot = structuredClone(row);
// //     this.editingRowId.set(this.getRowId(row));
// //     this.gridService.clearHistory();
// //     this.plugins().forEach(p => p.onRowEdit?.(row, this.buildContext()));
// //   }

// //   saveEditRow(): void {
// //     const draft = this.editDraft();
// //     if (!draft || !this.editingRowId()) return;

// //     const rowId = this.editingRowId()!;
// //     const isNew = rowId.startsWith('new_');
// //     const dirtyFields = Object.keys(draft).filter(k => JSON.stringify(draft[k]) !== JSON.stringify(this.editSnapshot?.[k]));

// //     this.modifiedRowIds.update(s => new Set(s).add(rowId));
// //     this.rowSave.emit({ row: draft, originalRow: this.editSnapshot, isNew, dirtyFields });
// //     this.plugins().forEach(p => p.onRowSave?.(draft, this.buildContext()));
    
// //     this.editingRowId.set(null);
// //     this.editSnapshot = null;
// //   }

// //   cancelEditRow(): void {
// //     const rowId = this.editingRowId();
// //     if (!rowId || !this.editSnapshot) {
// //       this.editingRowId.set(null);
// //       return;
// //     }

// //     if (rowId.startsWith('new_')) {
// //       this.refresh.emit(); 
// //     }

// //     this.editingRowId.set(null);
// //     this.editSnapshot = null;
// //     this.gridService.clearHistory();
// //   }

// //   onCellChange(event: GridCellChangeEvent, rowId: string): void {
// //     if (this.editingRowId() === rowId) {
// //       const draft = this.editDraft();
// //       draft[event.field] = event.newValue;
// //       this.editDraft.set({ ...draft });
// //     }

// //     if (!this.enableUndo()) return;
// //     this.gridService.push({
// //       type: 'cell', rowId, field: event.field,
// //       previousValue: event.previousValue, nextValue: event.newValue,
// //     });
// //   }

// //   // ─── Selection Logic ──────────────────────────────────────────────────────
// //   onRowClick(row: any, event: MouseEvent): void {
// //     if (!this.rowSelection()) {
// //       this.rowClick.emit(row);
// //       return;
// //     }
    
// //     if (this.editingRowId() === this.getRowId(row)) return;

// //     if (this.multipleSelection() && event.shiftKey && this.lastClickedId) {
// //       this.rangeSelect(row);
// //     } else if (this.multipleSelection() && (event.ctrlKey || event.metaKey)) {
// //       this.toggleSelectRow(row);
// //     } else {
// //       this.rowClick.emit(row);
// //     }
// //   }

// //   onRowDoubleClick(row: any): void {
// //     this.startEditRow(row);
// //     this.rowDoubleClick.emit(row);
// //   }

// //   onCheckboxClick(row: any, event: MouseEvent): void {
// //     event.stopPropagation();
// //     if (event.shiftKey && this.lastClickedId && this.multipleSelection()) {
// //       this.rangeSelect(row);
// //     } else {
// //       this.toggleSelectRow(row);
// //     }
// //   }

// //   onSelectAll(checked: boolean): void {
// //     if (checked) {
// //       const ids = new Set(this.displayData().map(r => this.getRowId(r)));
// //       this.selectedRowIds.set(ids);
// //     } else {
// //       this.selectedRowIds.set(new Set());
// //     }
// //     this.emitSelection();
// //   }

// //   clearSelection(): void {
// //     this.selectedRowIds.set(new Set());
// //     this.emitSelection();
// //   }

// //   private toggleSelectRow(row: any): void {
// //     const id = this.getRowId(row);
// //     this.selectedRowIds.update(ids => {
// //       const n = new Set(ids);
// //       n.has(id) ? n.delete(id) : n.add(id);
// //       return n;
// //     });
// //     this.lastClickedId = id;
// //     this.emitSelection();
// //   }

// //   private rangeSelect(toRow: any): void {
// //     const data = this.displayData();
// //     const fromIdx = data.findIndex(r => this.getRowId(r) === this.lastClickedId);
// //     const toIdx = data.findIndex(r => this.getRowId(r) === this.getRowId(toRow));
// //     if (fromIdx < 0 || toIdx < 0) return;
    
// //     const lo = Math.min(fromIdx, toIdx);
// //     const hi = Math.max(fromIdx, toIdx);
// //     const ids = new Set(this.selectedRowIds());
// //     for (let i = lo; i <= hi; i++) ids.add(this.getRowId(data[i]));
    
// //     this.selectedRowIds.set(ids);
// //     this.emitSelection();
// //   }

// //   private emitSelection(): void {
// //     const ids = this.selectedRowIds();
// //     const rows = this.data().filter(r => ids.has(this.getRowId(r)));
// //     this.selectionChange.emit(rows);
// //     this.plugins().forEach(p => p.onSelectionChange?.(rows, this.buildContext()));
// //   }

// //   // ─── Sort & Filter ────────────────────────────────────────────────────────
// //   onSort(field: string): void {
// //     this.sortState.update(state => {
// //       const existing = state.find(s => s.field === field);
// //       if (!existing) return [...state, { field, direction: 'asc', order: state.length }];
// //       if (existing.direction === 'asc') return state.map(s => s.field === field ? { ...s, direction: 'desc' as const } : s);
// //       return state.filter(s => s.field !== field).map((s, i) => ({ ...s, order: i }));
// //     });
// //     this.currentPage.set(0);
// //     this.sortChange.emit(this.sortState());
// //     if (this.persistState()) this.stateService.setSortState(this.gridId(), this.sortState());
// //   }

// //   private applyFilter(row: any, f: GridFilterState): boolean {
// //     const val = String(row[f.field] ?? '').toLowerCase();
// //     const target = String(f.value ?? '').toLowerCase();
// //     switch (f.operator) {
// //       case 'equals': return val === target;
// //       case 'startsWith': return val.startsWith(target);
// //       case 'endsWith': return val.endsWith(target);
// //       case 'gt': return Number(row[f.field]) > Number(f.value);
// //       case 'lt': return Number(row[f.field]) < Number(f.value);
// //       case 'contains': default: return val.includes(target);
// //     }
// //   }

// //   private applySort(a: any, b: any, sort: GridSortState[]): number {
// //     for (const s of sort) {
// //       const av = a[s.field]; const bv = b[s.field];
// //       const cmp = av < bv ? -1 : av > bv ? 1 : 0;
// //       if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
// //     }
// //     return 0;
// //   }

// //   onFilterChange(filters: GridFilterState[]): void {
// //     this.filterState.set(filters);
// //     this.currentPage.set(0);
// //     this.filterChange.emit(filters);
// //   }

// //   onSearch(query: string): void {
// //     this.searchQuery.set(query);
// //     this.currentPage.set(0);
// //   }

// //   // ─── Pagination & Scroll ──────────────────────────────────────────────────
// //   onPageChange(state: GridPageState): void {
// //     this.currentPage.set(state.page);
// //     this.pageSizeSignal.set(state.pageSize);
// //     this.pageChange.emit(state);
// //     if (this.persistState()) this.stateService.saveState(this.gridId(), { density: this.densitySignal() });
// //   }

// //   onPageSizeChange(size: number): void {
// //     this.pageSizeSignal.set(size);
// //     this.currentPage.set(0);
// //     this.pageSizeChange.emit(size);
// //   }

// //   onPaginationModeChange(mode: 'pages' | 'infinite'): void {
// //     this.paginationMode.set(mode);
// //     this.currentPage.set(0);
// //     this.accumulatedData.set([...this.data()]);
// //     this.pageChange.emit({ page: 0, pageSize: this.pageSizeSignal(), total: this.totalRecords() });
// //   }

// //   private _lastFetchPage = -1;

// // // OPTIMIZED SCROLL TRIGGER
// //   onGridScroll(event: any): void {
// //     // Do nothing if not infinite, not lazy, or currently waiting for API
// //     if (this.paginationMode() !== 'infinite' || !this.lazy() || this.loading()) return;

// //     const target = event.target as HTMLElement;
    
// //     // Check if user has scrolled within 50px of the bottom
// //     const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
// //     if (distanceToBottom < 50) {
// //       const currentTotal = this.accumulatedData().length;
      
// //       // Only request next page if we haven't reached the total records yet
// //       if (currentTotal < this.totalRecords()) {
// //         const nextPage = this.currentPage() + 1;
// //         this.currentPage.set(nextPage);
// //         this.pageChange.emit({ page: nextPage, pageSize: this.pageSizeSignal(), total: this.totalRecords() });
// //       }
// //     }
// //   }

// //   // ─── Actions & Overlays ───────────────────────────────────────────────────
// //   onDensityChange(d: GridDensity): void {
// //     this.densitySignal.set(d);
// //     if (this.persistState()) this.stateService.setDensity(this.gridId(), d);
// //   }

// //   onPinChange(event: { field: string; sticky: 'left' | 'right' | false }): void {
// //     this.columnOverrides.update(o => ({ ...o, [event.field]: { ...o[event.field], sticky: event.sticky } }));
// //   }

// //   onExport(format: 'csv' | 'json' | 'xlsx'): void {
// //     const data = this.filteredData();
// //     const cols = this.visibleColumnList();
// //     switch (format) {
// //       case 'csv': this.gridService.exportAsCSV(data, cols); break;
// //       case 'json': this.gridService.exportAsJSON(data, cols); break;
// //       case 'xlsx': this.gridService.exportAsXLSX(data, cols); break;
// //     }
// //   }

// //   onAddRow(): void {
// //     if (this.editingRowId() && this.data().some(r => this.isNewRow(r))) {
// //       this.messageService?.add({ severity: 'warn', summary: 'Blocked', detail: 'Finish editing the current record first.' });
// //       return;
// //     }
// //     this.addNew.emit();
// //   }

// //   onDeleteRow(row: any): void { this.rowDelete.emit(row); }
// //   onDuplicateRow(row: any): void { this.rowDuplicate.emit(row); }
// //   onCustomRowAction(action: GridRowAction, row: any): void { action.callback(row, this.buildContext()); }

// //   onBulkActionById(actionId: string): void {
// //     const action = this.bulkActions().find(a => a.id === actionId);
// //     const ids = this.selectedRowIds();
// //     const rows = this.data().filter(r => ids.has(this.getRowId(r)));
// //     if (action) action.callback(rows, this.buildContext());
// //     this.bulkAction.emit({ actionId, rows });
// //   }

// //   onContextMenu(event: MouseEvent, row: any): void {
// //     if (!this.enableContextMenu()) return;
// //     event.preventDefault();
// //     this.contextMenuPos.set({ x: event.clientX, y: event.clientY });
// //     this.contextMenuRow.set(row);
// //     this.showContextMenu.set(true);
// //   }

// //   onContextMenuAction(evt: ContextMenuActionEvent): void {
// //     const row = evt.row;
// //     switch (evt.id) {
// //       case 'edit': this.startEditRow(row); break;
// //       case 'save': this.saveEditRow(); break;
// //       case 'cancel': this.cancelEditRow(); break;
// //       case 'delete': this.onDeleteRow(row); break;
// //       case 'duplicate': this.onDuplicateRow(row); break;
// //       case 'copy': this.gridService.copyRows([row]); break;
// //       case 'paste': {
// //         const pasted = this.gridService.pasteRows();
// //         pasted.forEach(r => this.rowDuplicate.emit(r));
// //         break;
// //       }
// //       case 'undo': this.performUndo(); break;
// //       case 'redo': this.performRedo(); break;
// //       default: {
// //         const action = this.rowActions().find(a => a.id === evt.id);
// //         if (action) action.callback(row, this.buildContext());
// //       }
// //     }
// //   }

// //   onVisibilityChange(visible: string[]): void {
// //     this.visibleColumnsSignal.set(visible);
// //     if (this.persistState()) this.stateService.setVisibleColumns(this.gridId(), visible);
// //   }

// //   onApplyView(view: GridSavedView): void {
// //     this.visibleColumnsSignal.set(view.columns);
// //     if (view.sortState) this.sortState.set(view.sortState);
// //     if (view.filterState) this.filterState.set(view.filterState);
// //     if (view.density) this.densitySignal.set(view.density);
// //     this.activeViewId.set(view.id);
// //     this.currentPage.set(0);
// //   }

// //   onSaveCurrentView(name: string): void {
// //     const view: GridSavedView = {
// //       id: `view_${Date.now()}`, name,
// //       columns: this.visibleColumnsSignal().length ? this.visibleColumnsSignal() : this.columns().map(c => c.field),
// //       sortState: this.sortState(), filterState: this.filterState(), density: this.densitySignal(),
// //     };
// //     this.stateService.saveView(this.gridId(), view);
// //     this.savedViews.update(views => [...views, view]);
// //     this.activeViewId.set(view.id);
// //   }

// //   onDeleteView(viewId: string): void {
// //     this.stateService.deleteView(this.gridId(), viewId);
// //     this.savedViews.update(views => views.filter(v => v.id !== viewId));
// //     if (this.activeViewId() === viewId) this.activeViewId.set(null);
// //   }

// //   // ─── Advanced Keyboard Navigation (Accessibility) ─────────────────────────
// //   @HostListener('keydown', ['$event'])
// //   onKeydown(event: KeyboardEvent): void {
// //     if (event.key === 'Escape' && this.editingRowId()) {
// //       event.preventDefault();
// //       this.cancelEditRow();
// //       return;
// //     }
    
// //     if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
// //       event.preventDefault();
// //       event.shiftKey ? this.performRedo() : this.performUndo();
// //       return;
// //     }

// //     const active = document.activeElement as HTMLElement;
// //     if (!active || !active.closest('.apex-dg-cell')) return;

// //     if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
// //       if (this.editingRowId()) return;
// //       event.preventDefault();
// //       this.navigateGrid(event.key, active);
// //     }
// //   }

// //   private navigateGrid(direction: string, currentCell: HTMLElement): void {
// //     const row = currentCell.closest('.apex-dg-row') as HTMLElement;
// //     const allRows = Array.from(this.gridBody.nativeElement.querySelectorAll('.apex-dg-row'));
// //     const allCells = Array.from(row.querySelectorAll('.apex-dg-cell'));
    
// //     let rowIdx = allRows.indexOf(row);
// //     let colIdx = allCells.indexOf(currentCell);

// //     switch(direction) {
// //       case 'ArrowUp': rowIdx = Math.max(0, rowIdx - 1); break;
// //       case 'ArrowDown': rowIdx = Math.min(allRows.length - 1, rowIdx + 1); break;
// //       case 'ArrowLeft': colIdx = Math.max(0, colIdx - 1); break;
// //       case 'ArrowRight': colIdx = Math.min(allCells.length - 1, colIdx + 1); break;
// //     }

// //     const targetRow = allRows[rowIdx];
// //     const targetCell = targetRow?.querySelectorAll('.apex-dg-cell')[colIdx] as HTMLElement;
// //     if (targetCell) {
// //       targetCell.focus();
// //       if (direction === 'ArrowUp' || direction === 'ArrowDown') {
// //         targetCell.scrollIntoView({ block: 'nearest' });
// //       }
// //     }
// //   }

// //   private performUndo(): void {
// //     if (!this.enableUndo()) return;
// //     const entry = this.gridService.undo();
// //     if (!entry || !entry.field) return;
// //     const draft = this.editDraft();
// //     if (draft && entry.rowId === this.editingRowId()) {
// //       draft[entry.field] = entry.previousValue;
// //       this.editDraft.set({ ...draft });
// //     }
// //   }

// //   private performRedo(): void {
// //     if (!this.enableUndo()) return;
// //     const entry = this.gridService.redo();
// //     if (!entry || !entry.field) return;
// //     const draft = this.editDraft();
// //     if (draft && entry.rowId === this.editingRowId()) {
// //       draft[entry.field] = entry.nextValue;
// //       this.editDraft.set({ ...draft });
// //     }
// //   }

// //   private loadPersistedState(): void {
// //     if (!this.persistState()) return;
// //     const state = this.stateService.loadState(this.gridId());
// //     if (!state) return;

// //     if (state.visibleColumns?.length) this.visibleColumnsSignal.set(state.visibleColumns);
// //     if (state.density) this.densitySignal.set(state.density);
// //     if (state.sortState?.length) this.sortState.set(state.sortState);
// //     if (state.savedViews?.length) this.savedViews.set(state.savedViews);
// //   }

// //   private buildContext(): GridContext {
// //     return {
// //       getData: () => this.data(),
// //       getColumns: () => this.columns(),
// //       getSelectedRows: () => {
// //         const ids = this.selectedRowIds();
// //         return this.data().filter(r => ids.has(this.getRowId(r)));
// //       },
// //       getEditingRowId: () => this.editingRowId(),
// //       startEditRow: (row) => this.startEditRow(row),
// //       saveEditRow: () => this.saveEditRow(),
// //       cancelEditRow: () => this.cancelEditRow(),
// //       addRow: () => this.onAddRow(),
// //       deleteRow: (row) => this.onDeleteRow(row),
// //       duplicateRow: (row) => this.onDuplicateRow(row),
// //       undo: () => this.performUndo(),
// //       redo: () => this.performRedo(),
// //       refresh: () => this.refresh.emit(),
// //       exportAs: (format) => this.onExport(format),
// //       setFilter: (field, state) => {
// //         const current = this.filterState().filter(f => f.field !== field);
// //         this.filterState.set([...current, { field, operator: 'contains', value: '', ...state }]);
// //       },
// //       clearFilters: () => this.filterState.set([]),
// //       setSort: (field, direction) => this.sortState.set([{ field, direction, order: 0 }]),
// //       getGridState: (): GridPersistedState => ({
// //         visibleColumns: this.visibleColumnsSignal(),
// //         columnOrder: this.columns().map(c => c.field),
// //         columnWidths: {},
// //         sortState: this.sortState(),
// //         density: this.densitySignal(),
// //         savedViews: this.savedViews(),
// //         activeViewId: this.activeViewId() ?? undefined,
// //       }),
// //     };
// //   }
// // }


// // // import {
// // //   Component, ChangeDetectionStrategy,
// // //   input, output, signal, computed, effect, untracked,
// // //   inject, OnDestroy, HostListener, ElementRef
// // // } from '@angular/core';
// // // import { CommonModule } from '@angular/common';

// // // import {
// // //   GridColumn, GridRowAction, GridBulkAction, GridPlugin,
// // //   GridRowSaveEvent, GridBulkActionEvent, GridSortState,
// // //   GridFilterState, GridPageState, GridDensity, GridSavedView,
// // //   GridPersistedState, GridCellChangeEvent, GridContext, GridUndoEntry
// // // } from '../grid-types';
// // // import { ConfirmationService, MessageService } from 'primeng/api';
// // // import { GridService } from '../grid.service';
// // // import { GridStateService } from '../grid-state.service';

// // // // Sub-components
// // // import { GridToolbarComponent } from '../components/grid-toolbar.component';
// // // import { GridCellComponent } from '../components/grid-cell.component';
// // // import { GridActionsComponent } from '../components/grid-actions.component';
// // // import { GridPaginationComponent } from '../components/grid-pagination.component';
// // // import { GridEmptyStateComponent } from '../components/grid-empty-state.component';
// // // import { GridLoadingComponent } from '../components/grid-loading.component';
// // // import { GridFilterBarComponent } from '../components/grid-filter-bar.component';
// // // import { GridColumnManagerComponent } from '../components/grid-column-manager.component';
// // // import { GridSavedViewsComponent } from '../components/grid-saved-views.component';
// // // import { GridContextMenuComponent, ContextMenuActionEvent } from '../components/grid-context-menu.component';

// // // /**
// // //  * Component: app-data-grid
// // //  * Enterprise-grade DataGrid. The ONLY grid component used across the application.
// // //  *
// // //  * Key architectural decisions:
// // //  *  - Progressive editing: only ONE row edits at a time via editingRowId signal
// // //  *  - Native HTML table (no p-table) for complete visual control
// // //  *  - All state persisted to localStorage via GridStateService
// // //  *  - Plugin architecture via GridPlugin interface
// // //  *  - Undo/Redo via GridService
// // //  *  - Design tokens everywhere — zero hardcoded colours
// // //  */
// // // @Component({
// // //   selector: 'app-data-grid',
// // //   standalone: true,
// // //   changeDetection: ChangeDetectionStrategy.OnPush,
// // //   providers: [GridService],
// // //   imports: [
// // //     CommonModule,
// // //     GridToolbarComponent,
// // //     GridCellComponent,
// // //     GridActionsComponent,
// // //     GridPaginationComponent,
// // //     GridEmptyStateComponent,
// // //     GridLoadingComponent,
// // //     GridFilterBarComponent,
// // //     GridColumnManagerComponent,
// // //     GridSavedViewsComponent,
// // //     GridContextMenuComponent,
// // //   ],
// // //   host: { class: 'flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden' },
// // //   styles: [`
// // //     /* ── Row reveal hover for action buttons ─────────────────────── */
// // //     .apex-dg-row:hover .apex-act-btn--reveal {
// // //       opacity: 1 !important;
// // //       transform: scale(1) !important;
// // //     }
// // //     /* ── Sticky shadow decorators ────────────────────────────────── */
// // //     .apex-dg-td--sticky-left  { box-shadow: 2px 0 6px -2px color-mix(in srgb, var(--text-primary) 10%, transparent); }
// // //     .apex-dg-td--sticky-right { box-shadow: -2px 0 6px -2px color-mix(in srgb, var(--text-primary) 10%, transparent); }
// // //   `],
// // //   template: `
// // //     <div class="apex-dg flex flex-col w-full flex-1 min-h-0 h-full overflow-hidden" [class]="densityCssClass()">
// // //       <div class="relative flex flex-col flex-1 min-h-0 h-full overflow-hidden
// // //                   bg-[var(--bg-primary)] border border-[color-mix(in_srgb,var(--border-secondary)_50%,transparent)]
// // //                   rounded-2xl shadow-[var(--elevation-1)]">

// // //         <!-- ───────────── TOOLBAR ───────────── -->
// // //         @if (toolbar()) {
// // //           <app-grid-toolbar
// // //             [searchQuery]="searchQuery()"
// // //             [selectedCount]="selectedRowIds().size"
// // //             [totalCount]="lazy() ? totalRecords() : data().length"
// // //             [filteredCount]="lazy() ? totalRecords() : filteredData().length"
// // //             [loading]="loading()"
// // //             [filterActive]="filterState().length > 0"
// // //             [activeFilterCount]="filterState().length"
// // //             [density]="densitySignal()"
// // //             [enableAdd]="enableAdd()"
// // //             [enableExport]="enableExport()"
// // //             [bulkActions]="bulkActions()"
// // //             [isEditing]="!!editingRowId()"
// // //             [paginationMode]="paginationMode()"
// // //             (searchChange)="onSearch($event)"
// // //             (filterToggle)="showFilterBar.update(v => !v)"
// // //             (refresh)="refresh.emit()"
// // //             (addRow)="onAddRow()"
// // //             (densityChange)="onDensityChange($event)"
// // //             (paginationModeChange)="onPaginationModeChange($event)"
// // //             (exportAs)="onExport($event)"
// // //             (columnManagerToggle)="showColumnManager.update(v => !v)"
// // //             (savedViewsToggle)="showSavedViews.update(v => !v)"
// // //             (clearSelection)="clearSelection()"
// // //             (bulkAction)="onBulkActionById($event)">

// // //             <!-- Slot for projected custom actions -->
// // //             <ng-content select="[grid-actions]" ngProjectAs="[grid-actions]"></ng-content>
// // //           </app-grid-toolbar>
// // //         }

// // //         <!-- Filter Bar -->
// // //         @if (showFilterBar()) {
// // //           <app-grid-filter-bar
// // //             [columns]="visibleColumnList()"
// // //             [activeFilters]="filterState()"
// // //             (filterChange)="onFilterChange($event)"
// // //             (close)="showFilterBar.set(false)">
// // //           </app-grid-filter-bar>
// // //         }

// // //         <!-- Loading Skeleton -->
// // //         @if (loading()) {
// // //           <app-grid-loading
// // //             [rowCount]="pageSizeSignal()"
// // //             [density]="densitySignal()"
// // //             [colWidths]="visibleColumnList().map(c => c.width ?? '150px')">
// // //           </app-grid-loading>
// // //         }

// // //         <!-- Scroll Container -->
// // //         <div class="flex-1 overflow-auto apex-dg-scroll relative" (scroll)="onGridScroll($event)">

// // //           <table class="w-full border-collapse table-fixed apex-dg-table"
// // //                  [class.apex-dg-table--striped]="stripedRows()">

// // //             <!-- ─── STICKY HEADER ─── -->
// // //             <thead class="apex-dg-thead sticky top-0 z-20">
// // //               <tr>
// // //                 @if (rowSelection()) {
// // //                   <th class="apex-dg-th apex-dg-th--checkbox w-12 sticky left-0 z-30">
// // //                     <div class="flex items-center justify-center">
// // //                       <input type="checkbox"
// // //                              class="apex-dg-checkbox"
// // //                              [checked]="allSelected()"
// // //                              [indeterminate]="indeterminate()"
// // //                              (change)="onSelectAll($any($event.target).checked)"
// // //                              aria-label="Select all rows">
// // //                     </div>
// // //                   </th>
// // //                 }
                
// // //                 <!-- Sr. No. TH -->
// // //                 <th class="apex-dg-th w-16 text-center select-none text-[var(--text-tertiary)] font-medium text-xs sticky z-30 bg-[var(--bg-secondary)]"
// // //                     [style.left.px]="rowSelection() ? 48 : 0"
// // //                     style="min-width: 60px; max-width: 60px;">
// // //                   Sr. No.
// // //                 </th>

// // //                 <!-- Column TH -->
// // //                 @for (col of visibleColumnList(); track col.field) {
// // //                   <th class="apex-dg-th"
// // //                       [style.width]="col.width"
// // //                       [style.min-width]="col.minWidth"
// // //                       [style.max-width]="col.maxWidth"
// // //                       [style.text-align]="col.align ?? 'left'"
// // //                       [class.cursor-pointer]="col.sortable !== false"
// // //                       [class.select-none]="col.sortable !== false"
// // //                       [class]="col.headerClass ?? ''"
// // //                       (click)="col.sortable !== false && onSort(col.field)">

// // //                     <div class="flex items-center gap-1">
// // //                       <span class="truncate">{{ col.header }}</span>

// // //                       @if (col.sortable !== false) {
// // //                         @let sortEntry = getSortEntry(col.field);
// // //                         <i class="pi shrink-0 text-[10px] transition-[var(--transition-fast)]"
// // //                            [class.pi-sort-alt]="!sortEntry"
// // //                            [class.pi-sort-amount-up-alt]="sortEntry?.direction === 'asc'"
// // //                            [class.pi-sort-amount-down]="sortEntry?.direction === 'desc'"
// // //                            [class.text-[var(--accent-primary)]]="!!sortEntry"
// // //                            [class.opacity-30]="!sortEntry">
// // //                         </i>
// // //                       }

// // //                       @if (col.required) {
// // //                         <span class="text-[var(--color-error)] text-xs shrink-0">*</span>
// // //                       }
// // //                     </div>
// // //                   </th>
// // //                 }

// // //                 <!-- Actions TH -->
// // //                 <th class="apex-dg-th apex-dg-th--actions w-24 sticky right-0 z-30"></th>
// // //               </tr>
// // //             </thead>

// // //             <!-- ─── BODY ─── -->
// // //             <tbody>
// // //               @if (!loading() && displayData().length === 0) {
// // //                 <tr>
// // //                   <td [attr.colspan]="visibleColumnList().length + (rowSelection() ? 2 : 1)">
// // //                     <app-grid-empty-state
// // //                       [title]="emptyMessage()"
// // //                       subtitle="Try adjusting your search or filter criteria."
// // //                       actionLabel="Add Record"
// // //                       (action)="onAddRow()">
// // //                     </app-grid-empty-state>
// // //                   </td>
// // //                 </tr>
// // //               }

// // //               @for (row of displayData(); track getRowId(row)) {
// // //                 @let rowId = getRowId(row);
// // //                 @let rowIsEditing = editingRowId() === rowId;
// // //                 @let rowIsSelected = selectedRowIds().has(rowId);
// // //                 @let rowIsNew = isNewRow(row);
// // //                 @let rowIsModified = modifiedRowIds().has(rowId) && !rowIsEditing;

// // //                 <tr class="apex-dg-row transition-all duration-200 group"
// // //                     [class.apex-dg-row--selected]="rowIsSelected"
// // //                     [class.apex-dg-row--editing]="rowIsEditing"
// // //                     [class.apex-dg-row--new]="rowIsNew"
// // //                     [class.apex-dg-row--modified]="rowIsModified"
// // //                     (click)="onRowClick(row, $event)"
// // //                     (dblclick)="onRowDoubleClick(row)"
// // //                     (contextmenu)="onContextMenu($event, row)">

// // //                   <!-- Checkbox TD -->
// // //                   @if (rowSelection()) {
// // //                     <td class="apex-dg-td apex-dg-td--checkbox sticky left-0"
// // //                          (click)="$event.stopPropagation()">
// // //                       <div class="flex items-center justify-center h-full">
// // //                         <input type="checkbox"
// // //                                class="apex-dg-checkbox"
// // //                                [checked]="rowIsSelected"
// // //                                (click)="onCheckboxClick(row, $event)"
// // //                                [attr.aria-label]="'Select row ' + rowId">
// // //                       </div>
// // //                     </td>
// // //                   }
                  
// // //                   <!-- Sr. No. TD -->
// // //                   <td class="apex-dg-td text-center text-[var(--text-tertiary)] text-xs font-mono sticky bg-[var(--bg-primary)]"
// // //                       [style.left.px]="rowSelection() ? 48 : 0"
// // //                       (click)="$event.stopPropagation()">
// // //                     {{ getSerialNumber($index) }}
// // //                   </td>

// // //                   <!-- Data cells -->
// // //                   @for (col of visibleColumnList(); track col.field) {
// // //                     <td class="apex-dg-td"
// // //                         [style.width]="col.width"
// // //                         [style.text-align]="col.align ?? 'left'"
// // //                         [class.apex-dg-td--sticky-left]="col.sticky === 'left'"
// // //                         [class.apex-dg-td--sticky-right]="col.sticky === 'right'"
// // //                         [class]="getCellClass(col, row)">
// // //                       <app-grid-cell
// // //                         [column]="col"
// // //                         [rowData]="rowIsEditing ? (editDraft() ?? row) : row"
// // //                         [isEditing]="rowIsEditing"
// // //                         (cellChange)="onCellChange($event, rowId)">
// // //                       </app-grid-cell>
// // //                     </td>
// // //                   }

// // //                   <!-- Actions TD -->
// // //                   <td class="apex-dg-td apex-dg-td--actions sticky right-0">
// // //                     <app-grid-actions
// // //                       [row]="row"
// // //                       [rowActions]="rowActions()"
// // //                       [isEditing]="rowIsEditing"
// // //                       [isEditingAnyRow]="!!editingRowId()"
// // //                       (edit)="startEditRow(row)"
// // //                       (save)="saveEditRow()"
// // //                       (cancel)="cancelEditRow()"
// // //                       (delete)="onDeleteRow(row)"
// // //                       (duplicate)="onDuplicateRow(row)"
// // //                       (customAction)="onCustomRowAction($event, row)">
// // //                     </app-grid-actions>
// // //                   </td>
// // //                 </tr>
// // //               }
// // //             </tbody>
// // //           </table>
// // //         </div>

// // //         <!-- ─── PAGINATION ─── -->
// // //         @if (pagination() && !loading() && data().length > 0 && paginationMode() === 'pages') {
// // //           <app-grid-pagination
// // //             [total]="lazy() ? totalRecords() : filteredData().length"
// // //             [pageSize]="pageSizeSignal()"
// // //             [page]="currentPage()"
// // //             (pageSizeChange)="onPageSizeChange($event)"
// // //             (pageChange)="onPageChange($event)">
// // //           </app-grid-pagination>
// // //         }
// // //       </div>

// // //       <!-- ───────────── OVERLAYS ───────────── -->

// // //       <!-- Context Menu -->
// // //       @if (showContextMenu() && enableContextMenu()) {
// // //         <app-grid-context-menu
// // //           [position]="contextMenuPos()"
// // //           [row]="contextMenuRow()"
// // //           [isEditing]="editingRowId() === getRowId(contextMenuRow())"
// // //           [rowActions]="rowActions()"
// // //           [enableExport]="enableExport()"
// // //           [canUndo]="gridService.canUndo()"
// // //           [canRedo]="gridService.canRedo()"
// // //           (action)="onContextMenuAction($event)"
// // //           (close)="showContextMenu.set(false)">
// // //         </app-grid-context-menu>
// // //       }

// // //       <!-- Column Manager -->
// // //       @if (showColumnManager()) {
// // //         <div class="relative">
// // //           <app-grid-column-manager
// // //             [columns]="columnsWithOverrides()"
// // //             [visibleColumns]="visibleColumnsSignal()"
// // //             (visibilityChange)="onVisibilityChange($event)"
// // //             (pinChange)="onPinChange($event)"
// // //             (close)="showColumnManager.set(false)">
// // //           </app-grid-column-manager>
// // //         </div>
// // //       }

// // //       <!-- Saved Views -->
// // //       @if (showSavedViews()) {
// // //         <div class="relative">
// // //           <app-grid-saved-views
// // //             [views]="savedViews()"
// // //             [activeViewId]="activeViewId()"
// // //             (applyView)="onApplyView($event)"
// // //             (saveView)="onSaveCurrentView($event)"
// // //             (deleteView)="onDeleteView($event)"
// // //             (close)="showSavedViews.set(false)">
// // //           </app-grid-saved-views>
// // //         </div>
// // //       }
// // //     </div>
// // //   `,
// // // })
// // // export class DataGridComponent implements OnDestroy {

// // //   // ─── Services ─────────────────────────────────────────────────────────────
// // //   readonly gridService = inject(GridService);
// // //   private stateService = inject(GridStateService);
// // //   private messageService = inject(MessageService, { optional: true });

// // //   // ─── Required Inputs ──────────────────────────────────────────────────────
// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   data = input.required<any[]>();
// // //   columns = input.required<GridColumn[]>();

// // //   // ─── Behaviour Inputs ─────────────────────────────────────────────────────
// // //   gridId = input<string>('default');
// // //   dataKey = input<string>('id');
// // //   lazy = input<boolean>(false);
// // //   totalRecords = input<number>(0);
// // //   toolbar = input<boolean>(true);
// // //   rowSelection = input<boolean>(true);
// // //   multipleSelection = input<boolean>(true);
// // //   pagination = input<boolean>(true);
// // //   pageSize = input<number>(15);
// // //   loading = input<boolean>(false);
// // //   density = input<GridDensity>('compact');
// // //   emptyMessage = input<string>('No records found');
// // //   rowActions = input<GridRowAction[]>([]);
// // //   bulkActions = input<GridBulkAction[]>([]);
// // //   persistState = input<boolean>(true);
// // //   plugins = input<GridPlugin[]>([]);
// // //   enableUndo = input<boolean>(true);
// // //   enableClipboard = input<boolean>(true);
// // //   enableExport = input<boolean>(true);
// // //   enableSavedViews = input<boolean>(true);
// // //   enableContextMenu = input<boolean>(true);
// // //   enableAdd = input<boolean>(true);
// // //   stripedRows = input<boolean>(true);

// // //   // ─── Outputs ──────────────────────────────────────────────────────────────
// // //   rowSave = output<GridRowSaveEvent>();
// // //   rowDelete = output<unknown>();
// // //   rowDuplicate = output<unknown>();
// // //   bulkAction = output<GridBulkActionEvent>();
// // //   pageChange = output<GridPageState>();
// // //   pageSizeChange = output<number>();
// // //   sortChange = output<GridSortState[]>();
// // //   filterChange = output<GridFilterState[]>();
// // //   searchChange = output<string>();
// // //   selectionChange = output<unknown[]>();
// // //   rowClick = output<unknown>();
// // //   rowDoubleClick = output<unknown>();
// // //   refresh = output<void>();
// // //   addNew = output<void>();

// // //   // ─── UI State ─────────────────────────────────────────────────────────────
// // //   editingRowId = signal<string | null>(null);
// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   editDraft = signal<any | null>(null);
// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   private editSnapshot: any = null;

// // //   selectedRowIds = signal<Set<string>>(new Set());
// // //   modifiedRowIds = signal<Set<string>>(new Set());
// // //   searchQuery = signal<string>('');
// // //   sortState = signal<GridSortState[]>([]);
// // //   filterState = signal<GridFilterState[]>([]);
// // //   currentPage = signal<number>(0);
// // //   pageSizeSignal = signal<number>(15);
// // //   densitySignal = signal<GridDensity>('compact');
// // //   visibleColumnsSignal = signal<string[]>([]);
// // //   savedViews = signal<GridSavedView[]>([]);
// // //   activeViewId = signal<string | null>(null);
// // //   paginationMode = signal<'pages' | 'infinite'>('pages');

// // //   // Internal Overrides (for UI modifications like pinning)
// // //   columnOverrides = signal<Record<string, Partial<GridColumn>>>({});

// // //   // Infinite Scroll internal state
// // //   accumulatedData = signal<any[]>([]);

// // //   showFilterBar = signal(false);
// // //   showColumnManager = signal(false);
// // //   showSavedViews = signal(false);
// // //   showContextMenu = signal(false);
// // //   contextMenuPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   contextMenuRow = signal<any>(null);
// // //   private searchTimeout: any;

// // //   // Track last shift-click row for range selection
// // //   private lastClickedId: string | null = null;

// // //   // ─── Derived / Computed ───────────────────────────────────────────────────

// // //   columnsWithOverrides = computed<GridColumn[]>(() => {
// // //     const cols = this.columns();
// // //     const overrides = this.columnOverrides();
// // //     return cols.map(c => overrides[c.field] ? { ...c, ...overrides[c.field] } : c);
// // //   });

// // //   visibleColumnList = computed<GridColumn[]>(() => {
// // //     const all = this.columnsWithOverrides();
// // //     const vis = this.visibleColumnsSignal();
// // //     if (!vis.length) return all.filter(c => c.visible !== false);

// // //     // Respect the order of vis array for reordering support
// // //     const ordered = vis.map(v => all.find(c => c.field === v)).filter(Boolean) as GridColumn[];
// // //     return ordered;
// // //   });

// // //   densityCssClass = computed(() => {
// // //     const map: Record<GridDensity, string> = {
// // //       compact: 'apex-dg--compact',
// // //       normal: 'apex-dg--normal',
// // //       comfortable: 'apex-dg--comfortable',
// // //     };
// // //     return map[this.densitySignal()];
// // //   });

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   filteredData = computed<any[]>(() => {
// // //     if (this.lazy()) return this.data();

// // //     let data = this.data();
// // //     const q = this.searchQuery().trim().toLowerCase();
// // //     const filters = this.filterState();
// // //     const sort = this.sortState();

// // //     // Global search across all searchable columns
// // //     if (q) {
// // //       const searchCols = this.columnsWithOverrides().filter(c => c.searchable !== false && c.type !== 'action');
// // //       data = data.filter(row =>
// // //         searchCols.some(col => {
// // //           // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //           const val: any = row[col.field];
// // //           return val != null && String(val).toLowerCase().includes(q);
// // //         })
// // //       );
// // //     }

// // //     // Column filters
// // //     if (filters.length > 0) {
// // //       data = data.filter(row =>
// // //         filters.every(f => {
// // //           // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //           const val: any = row[f.field];
// // //           if (val == null) return false;
// // //           const strVal = String(val).toLowerCase();
// // //           const strFilter = String(f.value).toLowerCase();
// // //           switch (f.operator) {
// // //             case 'contains': return strVal.includes(strFilter);
// // //             case 'equals': return strVal === strFilter;
// // //             case 'startsWith': return strVal.startsWith(strFilter);
// // //             case 'endsWith': return strVal.endsWith(strFilter);
// // //             case 'gt': return Number(val) > Number(f.value);
// // //             case 'lt': return Number(val) < Number(f.value);
// // //             default: return true;
// // //           }
// // //         })
// // //       );
// // //     }

// // //     // Sort
// // //     if (sort.length > 0) {
// // //       data = [...data].sort((a, b) => {
// // //         for (const s of sort) {
// // //           // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //           const av: any = a[s.field];
// // //           // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //           const bv: any = b[s.field];
// // //           const cmp = av < bv ? -1 : av > bv ? 1 : 0;
// // //           if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
// // //         }
// // //         return 0;
// // //       });
// // //     }

// // //     return data;
// // //   });

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   displayData = computed<any[]>(() => {
// // //     if (this.lazy() && this.paginationMode() === 'infinite') {
// // //       return this.accumulatedData();
// // //     }
// // //     if (this.lazy() || !this.pagination() || this.paginationMode() === 'infinite') {
// // //       return this.filteredData();
// // //     }
// // //     const start = this.currentPage() * this.pageSizeSignal();
// // //     return this.filteredData().slice(start, start + this.pageSizeSignal());
// // //   });

// // //   allSelected = computed(() => {
// // //     const ids = this.selectedRowIds();
// // //     if (ids.size === 0 || this.displayData().length === 0) return false;
// // //     return this.displayData().every(r => ids.has(this.getRowId(r)));
// // //   });

// // //   indeterminate = computed(() => {
// // //     const ids = this.selectedRowIds();
// // //     if (ids.size === 0) return false;
// // //     const allSel = this.allSelected();
// // //     return !allSel && this.displayData().some(r => ids.has(this.getRowId(r)));
// // //   });

// // //   // ─── Constructor + Init ───────────────────────────────────────────────────

// // //   constructor() {
// // //     // Sync pageSize input → signal
// // //     effect(() => { this.pageSizeSignal.set(this.pageSize()); });
// // //     effect(() => { this.densitySignal.set(this.density()); });

// // //     // Load persisted state after columns are known
// // //     effect(() => {
// // //       const cols = this.columnsWithOverrides();
// // //       if (!cols.length) return;
// // //       this.loadPersistedState();
// // //     });

// // //     // Handle lazy debounced search emission
// // //     effect(() => {
// // //       const query = this.searchQuery();
// // //       untracked(() => {
// // //         // Simple debounce using setTimeout for search emission
// // //         if (this.searchTimeout) clearTimeout(this.searchTimeout);
// // //         this.searchTimeout = setTimeout(() => {
// // //           this.searchChange.emit(query);
// // //         }, 300);
// // //       });
// // //     });

// // //     // Init plugins
// // //     effect(() => {
// // //       const ctx = this.buildContext();
// // //       this.plugins().forEach(p => p.onInit?.(ctx));
// // //     });

// // //     // Auto-edit workflow: automatically edit new rows when they appear in data
// // //     effect(() => {
// // //       const data = this.data();
// // //       const currentEditId = this.editingRowId();
// // //       // Find a row that is new and not currently being edited
// // //       const uneditedNewRow = data.find(r => this.isNewRow(r) && this.getRowId(r) !== currentEditId);

// // //       if (uneditedNewRow) {
// // //         // Run untracked to avoid triggering recursive effect updates
// // //         untracked(() => {
// // //           this.startEditRow(uneditedNewRow);
// // //         });
// // //       }
// // //     });

// // //     // Handle Infinite Scroll Data Accumulation
// // //     effect(() => {
// // //       const data = this.data();
// // //       const mode = this.paginationMode();
// // //       const isLazy = this.lazy();
// // //       const currentPage = this.currentPage();

// // //       untracked(() => {
// // //         if (mode === 'infinite' && isLazy) {
// // //           if (currentPage === 0) {
// // //             this.accumulatedData.set([...data]);
// // //           } else {
// // //             // Append data, ensuring no duplicates by key
// // //             const current = this.accumulatedData();
// // //             const newItems = data.filter(d => !current.find(c => this.getRowId(c) === this.getRowId(d)));
// // //             if (newItems.length > 0) {
// // //               this.accumulatedData.set([...current, ...newItems]);
// // //             }
// // //           }
// // //         }
// // //       });
// // //     });
// // //   }

// // //   ngOnDestroy(): void {
// // //     this.plugins().forEach(p => p.onDestroy?.());
// // //   }

// // //   // ─── Row ID Helper ────────────────────────────────────────────────────────

// // //   getRowId(row: any): string {
// // //     return String(row?.[this.dataKey()] ?? '');
// // //   }
// // //   isNewRow(row: any): boolean {
// // //     return String(row?.[this.dataKey()] ?? '').startsWith('new_');
// // //   }

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   getCellClass(col: GridColumn, row: any): string {
// // //     if (!col.cellClass) return '';
// // //     return typeof col.cellClass === 'function' ? col.cellClass(row) : col.cellClass;
// // //   }

// // //   getSortEntry(field: string): GridSortState | undefined {
// // //     return this.sortState().find(s => s.field === field);
// // //   }

// // //   // ─── Progressive Editing ─────────────────────────────────────────────────


// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   startEditRow(row: any): void {
// // //     // Cancel any current edit first
// // //     if (this.editingRowId()) this.cancelEditRow();

// // //     this.editSnapshot = JSON.parse(JSON.stringify(row));
// // //     this.editDraft.set({ ...row });
// // //     this.editingRowId.set(this.getRowId(row));
// // //     this.gridService.clearHistory();

// // //     this.plugins().forEach(p => p.onRowEdit?.(row, this.buildContext()));

// // //     // Auto-focus first editable cell
// // //     setTimeout(() => {
// // //       const firstInput = document.querySelector('.apex-dg-row--editing .apex-ie') as HTMLElement;
// // //       if (firstInput) firstInput.focus();
// // //     }, 50);
// // //   }

// // //   saveEditRow(): void {
// // //     const draft = this.editDraft();
// // //     const snapshot = this.editSnapshot;
// // //     if (!draft || !this.editingRowId()) return;

// // //     const rowId = this.editingRowId()!;
// // //     const isNew = rowId.startsWith('new_');

// // //     // Calculate dirty fields
// // //     const dirtyFields = Object.keys(draft).filter(
// // //       k => JSON.stringify(draft[k]) !== JSON.stringify(snapshot?.[k])
// // //     );

// // //     // Copy draft values back into the source row (mutate in place)
// // //     const sourceRow = this.data().find(r => this.getRowId(r) === rowId);
// // //     if (sourceRow) Object.assign(sourceRow, draft);

// // //     // Mark as modified
// // //     this.modifiedRowIds.update(s => { const n = new Set(s); n.add(rowId); return n; });

// // //     // Emit
// // //     this.rowSave.emit({ row: draft, originalRow: snapshot, isNew, dirtyFields });
// // //     this.plugins().forEach(p => p.onRowSave?.(draft, this.buildContext()));

// // //     // Reset edit state
// // //     this.editingRowId.set(null);
// // //     this.editDraft.set(null);
// // //     this.editSnapshot = null;
// // //   }

// // //   cancelEditRow(): void {
// // //     if (!this.editingRowId() || !this.editSnapshot) {
// // //       this.editingRowId.set(null);
// // //       this.editDraft.set(null);
// // //       return;
// // //     }

// // //     // Restore snapshot to the source row
// // //     const rowId = this.editingRowId()!;
// // //     const isNew = rowId.startsWith('new_');
// // //     const sourceRow = this.data().find(r => this.getRowId(r) === rowId);

// // //     if (isNew) {
// // //       // If the row was brand new and we cancelled it, discard it completely
// // //       // by telling the parent to refresh/discard.
// // //       this.refresh.emit();
// // //     } else if (sourceRow) {
// // //       Object.assign(sourceRow, this.editSnapshot);
// // //     }

// // //     this.editingRowId.set(null);
// // //     this.editDraft.set(null);
// // //     this.editSnapshot = null;
// // //     this.gridService.clearHistory();
// // //   }

// // //   // ─── Cell Change → Undo ──────────────────────────────────────────────────

// // //   onCellChange(event: GridCellChangeEvent, rowId: string): void {
// // //     const draft = this.editDraft();
// // //     if (draft && this.editingRowId() === rowId) {
// // //       draft[event.field] = event.newValue;
// // //       this.editDraft.set({ ...draft });
// // //     }

// // //     if (!this.enableUndo()) return;
// // //     this.gridService.push({
// // //       type: 'cell',
// // //       rowId,
// // //       field: event.field,
// // //       previousValue: event.previousValue,
// // //       nextValue: event.newValue,
// // //     });
// // //   }

// // //   // ─── Selection ───────────────────────────────────────────────────────────

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   onRowClick(row: any, event: MouseEvent): void {
// // //     if (!this.rowSelection()) {
// // //       this.rowClick.emit(row);
// // //       return;
// // //     }
// // //     // Don't toggle selection when clicking inside edit mode
// // //     if (this.editingRowId() === this.getRowId(row)) return;

// // //     if (this.multipleSelection() && event.shiftKey && this.lastClickedId) {
// // //       this.rangeSelect(row);
// // //     } else if (this.multipleSelection() && (event.ctrlKey || event.metaKey)) {
// // //       this.toggleSelectRow(row);
// // //     } else {
// // //       this.rowClick.emit(row);
// // //     }
// // //   }

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   onRowDoubleClick(row: any): void {
// // //     this.startEditRow(row);
// // //     this.rowDoubleClick.emit(row);
// // //   }

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   onCheckboxClick(row: any, event: MouseEvent): void {
// // //     event.stopPropagation();
// // //     if (event.shiftKey && this.lastClickedId && this.multipleSelection()) {
// // //       this.rangeSelect(row);
// // //     } else {
// // //       this.toggleSelectRow(row);
// // //     }
// // //   }

// // //   onSelectAll(checked: boolean): void {
// // //     if (checked) {
// // //       const ids = new Set(this.displayData().map(r => this.getRowId(r)));
// // //       this.selectedRowIds.set(ids);
// // //     } else {
// // //       this.selectedRowIds.set(new Set());
// // //     }
// // //     this.emitSelection();
// // //   }

// // //   clearSelection(): void {
// // //     this.selectedRowIds.set(new Set());
// // //     this.emitSelection();
// // //   }

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   private toggleSelectRow(row: any): void {
// // //     const id = this.getRowId(row);
// // //     this.selectedRowIds.update(ids => {
// // //       const n = new Set(ids);
// // //       if (n.has(id)) n.delete(id);
// // //       else n.add(id);
// // //       return n;
// // //     });
// // //     this.lastClickedId = id;
// // //     this.emitSelection();
// // //   }

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   private rangeSelect(toRow: any): void {
// // //     const data = this.displayData();
// // //     const fromId = this.lastClickedId!;
// // //     const toId = this.getRowId(toRow);
// // //     const fromIdx = data.findIndex(r => this.getRowId(r) === fromId);
// // //     const toIdx = data.findIndex(r => this.getRowId(r) === toId);
// // //     if (fromIdx < 0 || toIdx < 0) return;
// // //     const lo = Math.min(fromIdx, toIdx);
// // //     const hi = Math.max(fromIdx, toIdx);
// // //     const ids = new Set(this.selectedRowIds());
// // //     for (let i = lo; i <= hi; i++) ids.add(this.getRowId(data[i]));
// // //     this.selectedRowIds.set(ids);
// // //     this.emitSelection();
// // //   }

// // //   private emitSelection(): void {
// // //     const ids = this.selectedRowIds();
// // //     const rows = this.data().filter(r => ids.has(this.getRowId(r)));
// // //     this.selectionChange.emit(rows);
// // //     this.plugins().forEach(p => p.onSelectionChange?.(rows, this.buildContext()));
// // //   }

// // //   // ─── Sort ────────────────────────────────────────────────────────────────

// // //   onSort(field: string): void {
// // //     this.sortState.update(state => {
// // //       const existing = state.find(s => s.field === field);
// // //       if (!existing) {
// // //         return [...state, { field, direction: 'asc', order: state.length }];
// // //       }
// // //       if (existing.direction === 'asc') {
// // //         return state.map(s => s.field === field ? { ...s, direction: 'desc' as const } : s);
// // //       }
// // //       // Remove the sort on third click
// // //       return state.filter(s => s.field !== field).map((s, i) => ({ ...s, order: i }));
// // //     });
// // //     this.currentPage.set(0);
// // //     this.sortChange.emit(this.sortState());
// // //     if (this.persistState()) {
// // //       this.stateService.setSortState(this.gridId(), this.sortState());
// // //     }
// // //   }

// // //   // ─── Filter ──────────────────────────────────────────────────────────────

// // //   onFilterChange(filters: GridFilterState[]): void {
// // //     this.filterState.set(filters);
// // //     this.currentPage.set(0);
// // //     this.filterChange.emit(filters);
// // //   }

// // //   onSearch(query: string): void {
// // //     this.searchQuery.set(query);
// // //     this.currentPage.set(0);
// // //   }

// // //   // ─── Pagination ──────────────────────────────────────────────────────────

// // //   onPageChange(state: GridPageState): void {
// // //     this.currentPage.set(state.page);
// // //     this.pageSizeSignal.set(state.pageSize);
// // //     this.pageChange.emit(state);
// // //     if (this.persistState()) {
// // //       this.stateService.saveState(this.gridId(), { density: this.densitySignal() });
// // //     }
// // //   }

// // //   onPageSizeChange(size: number): void {
// // //     this.pageSizeSignal.set(size);
// // //     this.currentPage.set(0);
// // //     this.pageSizeChange.emit(size);
// // //   }

// // //   onPaginationModeChange(mode: 'pages' | 'infinite'): void {
// // //     this.paginationMode.set(mode);
// // //     this.currentPage.set(0);
// // //     this.accumulatedData.set([...this.data()]);
// // //     this.pageChange.emit({ page: 0, pageSize: this.pageSizeSignal(), total: this.totalRecords() });
// // //   }

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   onGridScroll(event: any): void {
// // //     if (this.paginationMode() !== 'infinite' || !this.lazy() || this.loading()) return;

// // //     const target = event.target as HTMLElement;
// // //     // Check if scrolled to bottom (within 50px threshold)
// // //     if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
// // //       const currentTotal = this.accumulatedData().length;
// // //       if (currentTotal < this.totalRecords()) {
// // //         const nextPage = this.currentPage() + 1;
// // //         this.currentPage.set(nextPage);
// // //         this.pageChange.emit({ page: nextPage, pageSize: this.pageSizeSignal(), total: this.totalRecords() });
// // //       }
// // //     }
// // //   }

// // //   getSerialNumber(index: number): number {
// // //     if (this.lazy() && this.paginationMode() === 'infinite') {
// // //       return index + 1;
// // //     }
// // //     return (this.currentPage() * this.pageSizeSignal()) + index + 1;
// // //   }

// // //   // ─── Density ─────────────────────────────────────────────────────────────

// // //   onDensityChange(d: GridDensity): void {
// // //     this.densitySignal.set(d);
// // //     if (this.persistState()) this.stateService.setDensity(this.gridId(), d);
// // //   }

// // //   // ─── Columns / Visibility ─────────────────────────────────────────────────



// // //   onPinChange(event: { field: string; sticky: 'left' | 'right' | false }): void {
// // //     this.columnOverrides.update(o => ({
// // //       ...o,
// // //       [event.field]: { ...o[event.field], sticky: event.sticky }
// // //     }));
// // //   }

// // //   // ─── Export ──────────────────────────────────────────────────────────────

// // //   onExport(format: 'csv' | 'json' | 'xlsx'): void {
// // //     const data = this.filteredData();
// // //     const cols = this.visibleColumnList();
// // //     switch (format) {
// // //       case 'csv': this.gridService.exportAsCSV(data, cols); break;
// // //       case 'json': this.gridService.exportAsJSON(data, cols); break;
// // //       case 'xlsx': this.gridService.exportAsXLSX(data, cols); break;
// // //     }
// // //   }

// // //   // ─── Add Row ─────────────────────────────────────────────────────────────

// // //   onAddRow(): void {
// // //     if (this.editingRowId()) {
// // //       const hasNew = this.data().some(r => this.isNewRow(r));
// // //       if (hasNew) {
// // //         this.messageService?.add({
// // //           severity: 'warn',
// // //           summary: 'Action Blocked',
// // //           detail: 'Finish editing the current record before adding another.'
// // //         });
// // //         return;
// // //       }
// // //     }
// // //     this.addNew.emit();
// // //   }

// // //   // ─── Delete / Duplicate ──────────────────────────────────────────────────

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   onDeleteRow(row: any): void {
// // //     this.rowDelete.emit(row);
// // //   }

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   onDuplicateRow(row: any): void {
// // //     this.rowDuplicate.emit(row);
// // //   }

// // //   // ─── Custom Row Actions ──────────────────────────────────────────────────

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   onCustomRowAction(action: GridRowAction, row: any): void {
// // //     action.callback(row, this.buildContext());
// // //   }

// // //   // ─── Bulk Actions ────────────────────────────────────────────────────────

// // //   onBulkActionById(actionId: string): void {
// // //     const action = this.bulkActions().find(a => a.id === actionId);
// // //     const ids = this.selectedRowIds();
// // //     const rows = this.data().filter(r => ids.has(this.getRowId(r)));
// // //     if (action) action.callback(rows, this.buildContext());
// // //     this.bulkAction.emit({ actionId, rows });
// // //   }

// // //   // ─── Context Menu ────────────────────────────────────────────────────────

// // //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // //   onContextMenu(event: MouseEvent, row: any): void {
// // //     if (!this.enableContextMenu()) return;
// // //     event.preventDefault();
// // //     this.contextMenuPos.set({ x: event.clientX, y: event.clientY });
// // //     this.contextMenuRow.set(row);
// // //     this.showContextMenu.set(true);
// // //   }

// // //   onContextMenuAction(evt: ContextMenuActionEvent): void {
// // //     const row = evt.row;
// // //     switch (evt.id) {
// // //       case 'edit': this.startEditRow(row); break;
// // //       case 'save': this.saveEditRow(); break;
// // //       case 'cancel': this.cancelEditRow(); break;
// // //       case 'delete': this.onDeleteRow(row); break;
// // //       case 'duplicate': this.onDuplicateRow(row); break;
// // //       case 'copy':
// // //         this.gridService.copyRows([row]);
// // //         break;
// // //       case 'paste': {
// // //         const pasted = this.gridService.pasteRows();
// // //         pasted.forEach(r => this.rowDuplicate.emit(r));
// // //         break;
// // //       }
// // //       case 'undo': this.performUndo(); break;
// // //       case 'redo': this.performRedo(); break;
// // //       default: {
// // //         const action = this.rowActions().find(a => a.id === evt.id);
// // //         if (action) action.callback(row, this.buildContext());
// // //       }
// // //     }
// // //   }

// // //   // ─── Column Visibility ───────────────────────────────────────────────────

// // //   onVisibilityChange(visible: string[]): void {
// // //     this.visibleColumnsSignal.set(visible);
// // //     if (this.persistState()) this.stateService.setVisibleColumns(this.gridId(), visible);
// // //   }

// // //   // ─── Saved Views ─────────────────────────────────────────────────────────

// // //   onApplyView(view: GridSavedView): void {
// // //     this.visibleColumnsSignal.set(view.columns);
// // //     if (view.sortState) this.sortState.set(view.sortState);
// // //     if (view.filterState) this.filterState.set(view.filterState);
// // //     if (view.density) this.densitySignal.set(view.density);
// // //     this.activeViewId.set(view.id);
// // //     this.currentPage.set(0);
// // //   }

// // //   onSaveCurrentView(name: string): void {
// // //     const view: GridSavedView = {
// // //       id: `view_${Date.now()}`,
// // //       name,
// // //       columns: this.visibleColumnsSignal().length
// // //         ? this.visibleColumnsSignal()
// // //         : this.columns().map(c => c.field),
// // //       sortState: this.sortState(),
// // //       filterState: this.filterState(),
// // //       density: this.densitySignal(),
// // //     };
// // //     this.stateService.saveView(this.gridId(), view);
// // //     this.savedViews.update(views => [...views, view]);
// // //     this.activeViewId.set(view.id);
// // //   }

// // //   onDeleteView(viewId: string): void {
// // //     this.stateService.deleteView(this.gridId(), viewId);
// // //     this.savedViews.update(views => views.filter(v => v.id !== viewId));
// // //     if (this.activeViewId() === viewId) this.activeViewId.set(null);
// // //   }

// // //   // ─── Keyboard Shortcuts ──────────────────────────────────────────────────

// // //   @HostListener('keydown', ['$event'])
// // //   onKeydown(event: KeyboardEvent): void {
// // //     if (event.ctrlKey || event.metaKey) {
// // //       if (event.key === 'z' && !event.shiftKey) { event.preventDefault(); this.performUndo(); }
// // //       if (event.key === 'z' && event.shiftKey) { event.preventDefault(); this.performRedo(); }
// // //       if (event.key === 'y') { event.preventDefault(); this.performRedo(); }
// // //     }
// // //     if (event.key === 'Escape' && this.editingRowId()) {
// // //       event.preventDefault();
// // //       this.cancelEditRow();
// // //     }
// // //     if (event.key === 'Enter' && !this.editingRowId()) {
// // //       // Enter on a focused row starts edit — handled at row level
// // //     }
// // //   }

// // //   private performUndo(): void {
// // //     if (!this.enableUndo()) return;
// // //     const entry = this.gridService.undo();
// // //     if (!entry || !entry.field) return;
// // //     // Restore value in editDraft
// // //     const draft = this.editDraft();
// // //     if (draft && entry.rowId === this.editingRowId()) {
// // //       draft[entry.field] = entry.previousValue;
// // //       this.editDraft.set({ ...draft }); // force signal update
// // //     }
// // //   }

// // //   private performRedo(): void {
// // //     if (!this.enableUndo()) return;
// // //     const entry = this.gridService.redo();
// // //     if (!entry || !entry.field) return;
// // //     const draft = this.editDraft();
// // //     if (draft && entry.rowId === this.editingRowId()) {
// // //       draft[entry.field] = entry.nextValue;
// // //       this.editDraft.set({ ...draft });
// // //     }
// // //   }

// // //   // ─── State Persistence ───────────────────────────────────────────────────

// // //   private loadPersistedState(): void {
// // //     if (!this.persistState()) return;
// // //     const state = this.stateService.loadState(this.gridId());
// // //     if (!state) return;

// // //     if (state.visibleColumns?.length) this.visibleColumnsSignal.set(state.visibleColumns);
// // //     if (state.density) this.densitySignal.set(state.density);
// // //     if (state.sortState?.length) this.sortState.set(state.sortState);
// // //     if (state.savedViews?.length) this.savedViews.set(state.savedViews);
// // //   }

// // //   // ─── Plugin Context ──────────────────────────────────────────────────────

// // //   private buildContext(): GridContext {
// // //     // eslint-disable-next-line @typescript-eslint/no-this-alias
// // //     const self = this;
// // //     return {
// // //       getData: () => self.data(),
// // //       getColumns: () => self.columns(),
// // //       getSelectedRows: () => {
// // //         const ids = self.selectedRowIds();
// // //         return self.data().filter(r => ids.has(self.getRowId(r)));
// // //       },
// // //       getEditingRowId: () => self.editingRowId(),
// // //       startEditRow: (row) => self.startEditRow(row),
// // //       saveEditRow: () => self.saveEditRow(),
// // //       cancelEditRow: () => self.cancelEditRow(),
// // //       addRow: () => self.onAddRow(),
// // //       deleteRow: (row) => self.onDeleteRow(row),
// // //       duplicateRow: (row) => self.onDuplicateRow(row),
// // //       undo: () => self.performUndo(),
// // //       redo: () => self.performRedo(),
// // //       refresh: () => self.refresh.emit(),
// // //       exportAs: (format) => self.onExport(format),
// // //       setFilter: (field, state) => {
// // //         const current = self.filterState().filter(f => f.field !== field);
// // //         self.filterState.set([...current, { field, operator: 'contains', value: '', ...state }]);
// // //       },
// // //       clearFilters: () => self.filterState.set([]),
// // //       setSort: (field, direction) => {
// // //         self.sortState.set([{ field, direction, order: 0 }]);
// // //       },
// // //       getGridState: (): GridPersistedState => ({
// // //         visibleColumns: self.visibleColumnsSignal(),
// // //         columnOrder: self.columns().map(c => c.field),
// // //         columnWidths: {},
// // //         sortState: self.sortState(),
// // //         density: self.densitySignal(),
// // //         savedViews: self.savedViews(),
// // //         activeViewId: self.activeViewId() ?? undefined,
// // //       }),
// // //     };
// // //   }
// // // }
