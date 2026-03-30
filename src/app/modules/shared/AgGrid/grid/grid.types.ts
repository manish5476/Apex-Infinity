import { ColDef } from 'ag-grid-community';

/* ==========================================================================
   CELL CONFIG — The single contract for every column's render + edit behavior.
   Add new types here and they are instantly available everywhere.
   ========================================================================== */

export type CellType =
  | 'text'        // Default: plain string
  | 'number'      // Numeric with optional precision
  | 'currency'    // Formatted currency display + number editor
  | 'date'        // Date picker / formatted display
  | 'boolean'     // Checkbox / icon display
  | 'select'      // Dropdown from options list
  | 'badge'       // Status badge (view only, not editable)
  | 'color'       // Color swatch + hex value
  | 'email'       // Email link (view) / text input (edit)
  | 'phone'       // Phone display / text input (edit)
  | 'url'         // Hyperlink (view) / text input (edit)
  | 'textarea'    // Multiline text
  | 'tags'        // Array of string tags (read-only for now)
  | 'avatar'      // Image/initials avatar display (view only)
  | 'progress';   // Progress bar display (view only)

/* ==========================================================================
   CELL INTERACTION EVENT — Emitted by MasterCellComponent on every
   user interaction. Consumed by the parent via (cellInteraction) output.
   ========================================================================== */

export type CellInteractionType =
  | 'click'       // User clicked the cell (view mode)
  | 'focus'       // Editor received focus
  | 'blur'        // Editor lost focus
  | 'change'      // Draft value changed (fires on every keystroke / selection)
  | 'enter'       // Enter key pressed inside editor
  | 'escape'      // Escape key pressed inside editor
  | 'linkClick';  // Clicked an email / phone / url link in view mode

export interface CellInteractionEvent {
  /** What triggered the event */
  interactionType: CellInteractionType;
  /** The cell's CellType (e.g. 'text', 'currency', 'select' …) */
  cellType: CellType;
  /** Current committed value (what the grid row holds) */
  value: any;
  /** Live draft value at the time of the event (may differ from value) */
  draftValue: any;
  /** The column field name */
  field: string;
  /** The row ID (from getRowId) */
  rowId: string;
  /** Full raw row data */
  rowData: any;
  /** The native DOM event when available (KeyboardEvent, MouseEvent, FocusEvent …) */
  nativeEvent?: Event | null;
}

export interface SelectOption {
  label: string;
  value: any;
  /** Optional icon class (e.g. 'pi pi-check') */
  icon?: string;
  /** Optional badge severity for coloring */
  severity?: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
}

export interface CellConfig {
  /** The type of cell — drives both editor and renderer */
  type: CellType;

  /* ── EDITOR BEHAVIOUR ─────────────────────────────────────── */

  /**
   * When true, this column is ALWAYS in edit mode.
   * The row does NOT need to be in edit state.
   * Ideal for inline forms, quick-entry grids.
   */
  alwaysEditable?: boolean;

  /**
   * When true, pressing Enter in this cell triggers save
   * on the parent grid (calls handleRowAction('save')).
   * Default: false — so tabbing doesn't accidentally save.
   */
  enterToSave?: boolean;

  /**
   * When true, this column is read-only even when the row
   * is in edit mode. Use for ID fields, computed values, etc.
   */
  readOnly?: boolean;

  /* ── PLACEHOLDER ──────────────────────────────────────────── */

  /**
   * Placeholder text shown in text / email / phone / url / textarea editors.
   * Also shown in p-select when no value is selected.
   */
  placeholder?: string;

  /* ── TYPE-SPECIFIC OPTIONS ────────────────────────────────── */

  // number / currency
  minFractionDigits?: number;
  maxFractionDigits?: number;
  min?: number;
  max?: number;
  currencyCode?: string;     // default 'INR'
  currencyLocale?: string;   // default 'en-IN'

  // date
  dateFormat?: string;       // Angular pipe format, default 'dd MMM yyyy'
  datePickerFormat?: string; // PrimeNG datepicker format, default 'dd/mm/yy'
  showTime?: boolean;

  // select
  options?: SelectOption[];
  optionLabel?: string;      // default 'label'
  optionValue?: string;      // default 'value'

  // badge — maps values to severity for p-tag coloring
  badgeMap?: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'>;

  // textarea
  rows?: number;             // default 3

  // progress
  showValue?: boolean;       // show percentage text

  // avatar
  labelField?: string;       // fallback field name for initials

  /* ── INTERACTION EVENTS ───────────────────────────────────── */

  /**
   * When true, the cell emits a CellInteractionEvent for every
   * interaction (click, change, focus, blur, enter, escape, linkClick).
   * Default: true — set false on high-frequency cells to cut noise.
   */
  emitEvents?: boolean;
}

/* ==========================================================================
   GRID COL DEF — Extends AG Grid's ColDef with our CellConfig
   ========================================================================== */
export interface GridColDef<T = any> extends ColDef<T> {
  /**
   * When provided, this column uses MasterCellComponent for rendering/editing.
   * When omitted, AG Grid renders the cell natively (string, number, etc.)
   */
  cellConfig?: CellConfig;
}

/* ==========================================================================
   CELL RENDERER PARAMS — Passed into MasterCellComponent by the grid
   ========================================================================== */
export interface MasterCellParams {
  value: any;
  cellConfig: CellConfig;
  /** Node row ID (set by getRowId) */
  nodeId: string;
  /** Raw row data */
  data: any;
  /** Field name this cell belongs to */
  field: string;
  /**
   * Reference to AppSharedGrid passed via gridOptions.context.componentParent
   * so the cell can call updateDraft(), handleRowAction(), etc.
   */
  componentParent: any;
  /** Live signal check: is THIS row currently being edited? */
  isRowEditing: () => boolean;
}


// import { ColDef } from 'ag-grid-community';

// /* ==========================================================================
//    CELL CONFIG — The single contract for every column's render + edit behavior.
//    Add new types here and they are instantly available everywhere.
//    ========================================================================== */

// export type CellType =
//   | 'text'        // Default: plain string
//   | 'number'      // Numeric with optional precision
//   | 'currency'    // Formatted currency display + number editor
//   | 'date'        // Date picker / formatted display
//   | 'boolean'     // Checkbox / icon display
//   | 'select'      // Dropdown from options list
//   | 'badge'       // Status badge (view only, not editable)
//   | 'color'       // Color swatch + hex value
//   | 'email'       // Email link (view) / text input (edit)
//   | 'phone'       // Phone display / text input (edit)
//   | 'url'         // Hyperlink (view) / text input (edit)
//   | 'textarea'    // Multiline text
//   | 'tags'        // Array of string tags (read-only for now)
//   | 'avatar'      // Image/initials avatar display (view only)
//   | 'progress';   // Progress bar display (view only)

// export interface SelectOption {
//   label: string;
//   value: any;
//   /** Optional icon class (e.g. 'pi pi-check') */
//   icon?: string;
//   /** Optional badge severity for coloring */
//   severity?: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
// }

// export interface CellConfig {
//   /** The type of cell — drives both editor and renderer */
//   type: CellType;

//   /* ── EDITOR BEHAVIOUR ─────────────────────────────────────── */

//   /**
//    * When true, this column is ALWAYS in edit mode.
//    * The row does NOT need to be in edit state.
//    * Ideal for inline forms, quick-entry grids.
//    */
//   alwaysEditable?: boolean;

//   /**
//    * When true, pressing Enter in this cell triggers save
//    * on the parent grid (calls handleRowAction('save')).
//    * Default: false — so tabbing doesn't accidentally save.
//    */
//   enterToSave?: boolean;

//   /**
//    * When true, this column is read-only even when the row
//    * is in edit mode. Use for ID fields, computed values, etc.
//    */
//   readOnly?: boolean;

//   /* ── TYPE-SPECIFIC OPTIONS ────────────────────────────────── */

//   // number / currency
//   minFractionDigits?: number;
//   maxFractionDigits?: number;
//   min?: number;
//   max?: number;
//   currencyCode?: string;     // default 'INR'
//   currencyLocale?: string;   // default 'en-IN'

//   // date
//   dateFormat?: string;       // Angular pipe format, default 'dd MMM yyyy'
//   datePickerFormat?: string; // PrimeNG datepicker format, default 'dd/mm/yy'
//   showTime?: boolean;

//   // select
//   options?: SelectOption[];
//   optionLabel?: string;      // default 'label'
//   optionValue?: string;      // default 'value'

//   // badge — maps values to severity for p-tag coloring
//   badgeMap?: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'>;

//   // textarea
//   rows?: number;             // default 3

//   // progress
//   showValue?: boolean;       // show percentage text

//   // avatar
//   labelField?: string;       // fallback field name for initials
// }

// /* ==========================================================================
//    GRID COL DEF — Extends AG Grid's ColDef with our CellConfig
//    ========================================================================== */
// export interface GridColDef<T = any> extends ColDef<T> {
//   /**
//    * When provided, this column uses MasterCellComponent for rendering/editing.
//    * When omitted, AG Grid renders the cell natively (string, number, etc.)
//    */
//   cellConfig?: CellConfig;
// }

// /* ==========================================================================
//    CELL RENDERER PARAMS — Passed into MasterCellComponent by the grid
//    ========================================================================== */
// export interface MasterCellParams {
//   value: any;
//   cellConfig: CellConfig;
//   /** Node row ID (set by getRowId) */
//   nodeId: string;
//   /** Raw row data */
//   data: any;
//   /** Field name this cell belongs to */
//   field: string;
//   /**
//    * Reference to AppSharedGrid passed via gridOptions.context.componentParent
//    * so the cell can call updateDraft(), handleRowAction(), etc.
//    */
//   componentParent: any;
//   /** Live signal check: is THIS row currently being edited? */
//   isRowEditing: () => boolean;
// }

// // import { ColDef, ICellEditorParams, ICellRendererParams } from 'ag-grid-community';

// // export type CellType =
// //   | 'text' | 'number' | 'currency' | 'date' | 'boolean'
// //   | 'select' | 'multiselect'
// //   | 'textarea' | 'password'
// //   | 'color' | 'switch'
// //   | 'image' | 'badge' | 'tags';

// // export interface CellConfig {
// //   type: CellType;

// //   options?: any[];
// //   optionLabel?: string;
// //   optionValue?: string;

// //   placeholder?: string;
// //   currencyCode?: string;
// //   dateFormat?: string;

// //   min?: number;
// //   max?: number;
// //   disabled?: boolean;
// //   required?: boolean;

// //   imageHeight?: string;

// //   badgeSeverity?: (value: any) =>
// //     'success' | 'info' | 'warn' | 'danger' | null;
// // }

// // export interface MasterEditorParams<T = any>
// //   extends ICellEditorParams<T> {
// //   cellConfig: CellConfig;
// // }

// // export interface MasterRendererParams<T = any>
// //   extends ICellRendererParams<T> {
// //   cellConfig: CellConfig;
// // }

// // export type GridColDef<T = any> = ColDef<T> & {
// //   cellConfig?: CellConfig;
// // };
