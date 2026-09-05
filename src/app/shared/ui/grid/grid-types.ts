import { Type, TemplateRef } from '@angular/core';
import { ValidatorFn, AsyncValidatorFn } from '@angular/forms';

// ─── Operation Mode ───────────────────────────────────────────────────────────
/** Whether an operation (sort/filter/page/search) is handled client-side or server-side. */
export type GridOperationMode = 'client' | 'server';

// ─── Selection Mode ───────────────────────────────────────────────────────────
export type GridSelectionMode = 'single' | 'multiple' | 'none';

// ─── Column Type ─────────────────────────────────────────────────────────────
export type GridColumnType =
  // Text & Numeric
  | 'text' | 'textarea' | 'number' | 'currency' | 'percentage' | 'mask' | 'otp'
  // Date & Boolean
  | 'date' | 'datetime' | 'timeago' | 'boolean' | 'toggleswitch' | 'togglebutton'
  // Selections
  | 'select' | 'selectbutton' | 'autocomplete' | 'tags'
  // Visuals
  | 'badge' | 'status' | 'user' | 'avatar' | 'initials' | 'color' | 'image' | 'chip' | 'progress'
  // Interactive
  | 'rating' | 'slider' | 'knob'
  // Links & Actions
  | 'email' | 'phone' | 'url' | 'action'
  // Advanced & Aliases
  | 'formula' | 'custom' | 'rightAligned' | 'numeric' | 'html'
  | (string & {});

// ─── Select Option ────────────────────────────────────────────────────────────
export interface SelectOption {
  label: string;
  value: any;
  icon?: string;
  color?: string;
  disabled?: boolean;
}

// ─── Cell Renderer Parameters ────────────────────────────────────────────────
export interface CellRendererParams<T = any> {
  value: any;
  data: T;
  row: T;
  colDef: GridColumn<T>;
  column: GridColumn<T>;
  index?: number;
}

// ─── Grid Column Definition ───────────────────────────────────────────────────
export interface GridColumn<T = any> {
  // Identity
  field: string;
  header?: string;
  type?: GridColumnType;

  // Legacy ag-grid compat
  headerName?: string;
  cellRenderer?: ((params: CellRendererParams<T>) => string) | TemplateRef<any> | Type<any> | any;
  cellRendererSelector?: (params: CellRendererParams<T>) => { component?: any; template?: any } | undefined;
  valueFormatter?: ((params: { value: any; data: T; row: T }) => string) | ((val: any) => string) | any;
  valueGetter?: ((params: { data: T; row: T; colDef: GridColumn<T> }) => any) | string | any;
  cellStyle?: any;

  // Layout
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  flex?: number | string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right' | false;
  pinned?: 'left' | 'right' | boolean | null;
  stickyOffset?: string;

  // Visibility & Search
  visible?: boolean;
  defaultVisible?: boolean;     // initial visibility (used by column manager reset)
  hideable?: boolean;
  searchable?: boolean;
  searchWeight?: number;        // relative search priority (higher = ranked first)
  highlightSearch?: boolean;    // highlight matched text in cell

  // Behavior
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  readOnly?: boolean;
  resizable?: boolean;
  required?: boolean;
  pinable?: boolean;            // can be pinned/frozen (default: true)
  draggable?: boolean;          // can be reordered via column manager (default: true)
  persist?: boolean;            // opt-out of per-column state persistence

  // Server-side mapping
  /** Dot-notation path sent to the backend. e.g. 'employee.department.name'.
   *  Falls back to `field` when not specified. Used by GridQueryBuilder. */
  queryPath?: string;
  serverSortable?: boolean;     // this column supports server-side sorting
  serverFilterable?: boolean;   // this column supports server-side filtering

  // Default state
  defaultSort?: 'asc' | 'desc';
  defaultFilter?: unknown;

  // UX metadata
  tooltip?: boolean;            // show full value in title tooltip
  copyable?: boolean;           // show copy-to-clipboard action
  clickable?: boolean;          // emit rowClick on cell click (not just row click)

  // Permissions
  permission?: string;
  roleVisible?: string[];
  roleEditable?: string[];

  // Custom Renderers (TemplateRef or Component class)
  cellEditor?: Type<any> | TemplateRef<any>;
  headerRenderer?: Type<any> | TemplateRef<any>;

  // Validation
  validators?: ValidatorFn[];
  asyncValidators?: AsyncValidatorFn[];
  crossFieldValidator?: (row: T) => string | null;

  // Formatting
  formatter?: (value: any, row: T, isPinned?: boolean) => any;

  // Standard configs
  placeholder?: string;
  options?: SelectOption[];

  // Number / Currency
  currencyCode?: string;
  min?: number;
  max?: number;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  step?: number;

  // Date
  dateFormat?: string;
  timeOnly?: boolean;
  showTime?: boolean;
  selectionMode?: 'single' | 'multiple' | 'range';

  // Input mask
  maskPattern?: string;
  slotChar?: string;

  // Tags
  maxTags?: number;

  // Toggle
  onLabel?: string;
  offLabel?: string;

  // Color
  colorFormat?: 'hex' | 'rgb' | 'hsb';

  // Formula (Phase 2)
  formula?: (row: T) => any;

  // Styling
  headerClass?: string;
  cellClass?: string | ((row: T) => string);

  // Column ordering (for column manager)
  sortOrder?: number;
  group?: string;

  // Row action severity (kept here for completeness — used by GridRowAction too)
  severity?: string;
}

// ─── Row States ───────────────────────────────────────────────────────────────
export type GridRowState =
  | 'normal' | 'hover' | 'focused' | 'selected'
  | 'editing' | 'new' | 'modified' | 'deleted'
  | 'saving' | 'error' | 'locked' | 'readonly' | 'pending';

// ─── Row Action ───────────────────────────────────────────────────────────────
export interface GridRowAction<T = any> {
  id: string;
  icon: string;
  label?: string;
  tooltip?: string;
  permission?: string;
  showWhen?: 'always' | 'hover' | 'editing' | 'selected';
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  callback: (row: T, context: GridContext<T>) => void;
}

// ─── Bulk Action ──────────────────────────────────────────────────────────────
export interface GridBulkAction<T = any> {
  id: string;
  icon: string;
  label: string;
  permission?: string;
  variant?: 'primary' | 'danger' | 'ghost';
  callback: (rows: T[], context: GridContext<T>) => void;
}

// ─── Events ──────────────────────────────────────────────────────────────────
export interface GridRowSaveEvent<T = any> {
  row: T;
  originalRow: T;
  isNew: boolean;
  dirtyFields: string[];
}

export interface GridBulkActionEvent<T = any> {
  actionId: string;
  rows: T[];
}

export interface GridCellChangeEvent {
  field: string;
  previousValue: any;
  newValue: any;
}

// ─── Shared Grid Event Bus (Backward-Compatibility) ──────────────────────────
export type SharedGridEvent<T = any> =
  | { type: 'init'; api: any }
  | { type: 'cellClicked'; row: T; field?: string; colId?: string; value?: any; event?: MouseEvent }
  | { type: 'rowClicked'; row: T; event?: MouseEvent }
  | { type: 'rowDoubleClicked'; row: T }
  | { type: 'reachedBottom'; [key: string]: any }
  | { type: 'edit'; row: T }
  | { type: 'save'; row: T; data?: T }
  | { type: 'bulkSave'; rows: T[] }
  | { type: 'cancel'; row: T }
  | { type: 'delete'; row: T }
  | { type: 'bulkDelete'; rows: T[] }
  | { type: 'selectionChanged'; rows: T[] }
  | { type: 'notes'; row: T };

// ─── State Types ──────────────────────────────────────────────────────────────
export interface GridSortState {
  field: string;
  direction: 'asc' | 'desc';
  order: number;
}

export interface GridFilterState {
  field: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between' | 'in';
  value: any;
}

export interface GridPageState {
  page: number;         // 0-indexed page index (UI convention)
  pageSize: number;     // number of rows per page
  total: number;        // total records count
  pageNumber?: number;  // 1-indexed convenience property (page + 1)
}

// ─── Query Payload ────────────────────────────────────────────────────────────
/**
 * Backend-agnostic query payload emitted by queryChange output.
 * Convert to HttpParams, GraphQL variables, Supabase query, etc. in your service layer.
 */
export interface GridQueryPayload {
  search?: string;
  page: number;
  pageSize: number;
  /** Single-sort shorthand — uses column queryPath if defined, else field name */
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  /** Full multi-sort array (use when backend supports multi-column sorting) */
  sorts?: Array<{ path: string; order: 'asc' | 'desc' }>;
  /** Active filters mapped to their queryPath */
  filters?: Array<{ path: string; operator: string; value: unknown }>;
}

// ─── Column Header Metadata ───────────────────────────────────────────────────
/**
 * Per-column computed header state. Used to drive visual highlights, icons, and
 * accessibility attributes without scanning arrays in every template expression.
 */
export interface GridColumnHeaderMeta {
  field: string;
  isSorted: boolean;
  sortDirection?: 'asc' | 'desc';
  sortOrder?: number;
  isFiltered: boolean;
  isSearchMatched: boolean;
  isPinned: boolean;
  isEdited: boolean;
  isGrouped: boolean;
  isFrozen: boolean;
  isCalculated: boolean;
  hasFormula: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  isDirty: boolean;
}

// ─── Saved Views ──────────────────────────────────────────────────────────────
export interface GridSavedView {
  id: string;
  name: string;
  icon?: string;
  columns: string[];
  columnWidths?: Record<string, string>;
  sortState?: GridSortState[];
  filterState?: GridFilterState[];
  density?: GridDensity;
  isDefault?: boolean;
  isBuiltIn?: boolean;
}

export type GridDensity = 'compact' | 'normal' | 'comfortable';

// ─── Persisted State ──────────────────────────────────────────────────────────
export interface GridPersistedState {
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, string>;
  sortState: GridSortState[];
  density: GridDensity;
  savedViews: GridSavedView[];
  activeViewId?: string;
}

// ─── Undo Entry ───────────────────────────────────────────────────────────────
export interface GridUndoEntry<T = any> {
  type: 'cell' | 'row' | 'bulk';
  rowId: string;
  field?: string;
  previousValue: any;
  nextValue: any;
  rowSnapshot?: T;
}

// ─── Context (Plugin API contract) ───────────────────────────────────────────
export interface GridContext<T = any> {
  // Data access
  getData(): T[];
  getColumns(): GridColumn<T>[];
  getSelectedRows(): T[];
  getEditingRowId(): string | null;

  // Row operations
  startEditRow(row: T): void;
  saveEditRow(): void;
  cancelEditRow(): void;
  addRow(row?: Partial<T>): void;
  deleteRow(row: T): void;
  duplicateRow(row: T): void;

  // History
  undo(): void;
  redo(): void;

  // Grid operations
  refresh(): void;
  exportAs(format: 'csv' | 'json' | 'xlsx'): void;
  setFilter(field: string, state: Partial<GridFilterState>): void;
  clearFilters(): void;
  setSort(field: string, direction: 'asc' | 'desc'): void;
  getGridState(): GridPersistedState;
}

// ─── Plugin Interface ─────────────────────────────────────────────────────────
export interface GridPlugin<T = any> {
  id: string;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onInit?(context: GridContext<T>): void;
  onDestroy?(): void;

  // ── Row operations ─────────────────────────────────────────────────────────
  onRowEdit?(row: T, context: GridContext<T>): void;
  onBeforeSave?(row: T, context: GridContext<T>): boolean | void; // return false to cancel
  onAfterSave?(row: T, context: GridContext<T>): void;
  onRowSave?(row: T, context: GridContext<T>): void;
  onSelectionChange?(rows: T[], context: GridContext<T>): void;

  // ── Cell events ────────────────────────────────────────────────────────────
  onCellClick?(field: string, row: T, context: GridContext<T>): void;
  onCellDoubleClick?(field: string, row: T, context: GridContext<T>): void;

  // ── Grid query events ──────────────────────────────────────────────────────
  onSort?(sort: GridSortState[], context: GridContext<T>): void;
  onFilter?(filters: GridFilterState[], context: GridContext<T>): void;
  onSearch?(query: string, context: GridContext<T>): void;

  // ── UI events ──────────────────────────────────────────────────────────────
  onToolbarAction?(actionId: string, context: GridContext<T>): void;
  onRowContextMenu?(row: T, context: GridContext<T>): void;

  // ── State & Export ─────────────────────────────────────────────────────────
  onStateChange?(state: GridPersistedState, context: GridContext<T>): void;
  onExport?(format: 'csv' | 'json' | 'xlsx', context: GridContext<T>): void;
}
