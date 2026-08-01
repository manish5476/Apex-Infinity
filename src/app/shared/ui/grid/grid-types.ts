import { Type, TemplateRef } from '@angular/core';
import { ValidatorFn, AsyncValidatorFn } from '@angular/forms';

// ─── Column Type ─────────────────────────────────────────────────────────────
export type GridColumnType =
  // Text & Numeric
  | 'text' | 'textarea' | 'number' | 'currency' | 'percentage' | 'mask' | 'otp'
  // Date & Boolean
  | 'date' | 'datetime' | 'timeago' | 'boolean' | 'toggleswitch' | 'togglebutton'
  // Selections
  | 'select' | 'selectbutton' | 'autocomplete' | 'tags'
  // Visuals
  | 'badge' | 'status' | 'user' | 'avatar' | 'initials' | 'color' | 'image'
  // Interactive
  | 'rating' | 'slider' | 'knob'
  // Links & Actions
  | 'email' | 'phone' | 'url' | 'action'
  // Advanced
  | 'formula' | 'custom';

// ─── Select Option ────────────────────────────────────────────────────────────
export interface SelectOption {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  icon?: string;
  color?: string;
  disabled?: boolean;
}

// ─── Grid Column Definition ───────────────────────────────────────────────────
export interface GridColumn {
  // Identity
  field: string;
  header: string;
  type?: GridColumnType;

  // Layout
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right' | false;
  pinned?: 'left' | 'right' | boolean | null;
  stickyOffset?: string;

  // Visibility & Search
  visible?: boolean;
  hideable?: boolean;
  searchable?: boolean;

  // Behavior
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  readOnly?: boolean;
  resizable?: boolean;
  required?: boolean;

  // Permissions
  permission?: string;
  roleVisible?: string[];
  roleEditable?: string[];

  // Custom Renderers (TemplateRef or Component class)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cellRenderer?: Type<any> | TemplateRef<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cellEditor?: Type<any> | TemplateRef<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headerRenderer?: Type<any> | TemplateRef<any>;

  // Validation
  validators?: ValidatorFn[];
  asyncValidators?: AsyncValidatorFn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  crossFieldValidator?: (row: any) => string | null;

  // Formatting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (value: any, row: any) => string;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formula?: (row: any) => any;

  // Styling
  headerClass?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cellClass?: string | ((row: any) => string);

  // Column ordering (for column manager)
  sortOrder?: number;
  group?: string;
}

// ─── Row States ───────────────────────────────────────────────────────────────
export type GridRowState =
  | 'normal' | 'hover' | 'focused' | 'selected'
  | 'editing' | 'new' | 'modified' | 'deleted'
  | 'saving' | 'error' | 'locked' | 'readonly' | 'pending';

// ─── Row Action ───────────────────────────────────────────────────────────────
export interface GridRowAction {
  id: string;
  icon: string;
  label?: string;
  tooltip?: string;
  permission?: string;
  showWhen?: 'always' | 'hover' | 'editing' | 'selected';
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (row: any, context: GridContext) => void;
}

// ─── Bulk Action ──────────────────────────────────────────────────────────────
export interface GridBulkAction {
  id: string;
  icon: string;
  label: string;
  permission?: string;
  variant?: 'primary' | 'danger' | 'ghost';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (rows: any[], context: GridContext) => void;
}

// ─── Events ──────────────────────────────────────────────────────────────────
export interface GridRowSaveEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originalRow: any;
  isNew: boolean;
  dirtyFields: string[];
}

export interface GridBulkActionEvent {
  actionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
}

export interface GridCellChangeEvent {
  field: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newValue: any;
}

// ─── State Types ──────────────────────────────────────────────────────────────
export interface GridSortState {
  field: string;
  direction: 'asc' | 'desc';
  order: number;
}

export interface GridFilterState {
  field: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between' | 'in';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export interface GridPageState {
  page: number;
  pageSize: number;
  total: number;
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
export interface GridUndoEntry {
  type: 'cell' | 'row' | 'bulk';
  rowId: string;
  field?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nextValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowSnapshot?: any;
}

// ─── Context (Plugin API contract) ───────────────────────────────────────────
export interface GridContext {
  // Data access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData(): any[];
  getColumns(): GridColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSelectedRows(): any[];
  getEditingRowId(): string | null;

  // Row operations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startEditRow(row: any): void;
  saveEditRow(): void;
  cancelEditRow(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addRow(row?: Partial<any>): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteRow(row: any): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  duplicateRow(row: any): void;

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
export interface GridPlugin {
  id: string;
  onInit?(context: GridContext): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowEdit?(row: any, context: GridContext): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowSave?(row: any, context: GridContext): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectionChange?(rows: any[], context: GridContext): void;
  onDestroy?(): void;
}
