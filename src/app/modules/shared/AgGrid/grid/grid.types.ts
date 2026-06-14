import { ColDef } from 'ag-grid-community';

/* ==========================================================================
   CELL TYPE — Every supported render + edit type.
   Add a new entry here → instantly available in MasterCellComponent.
   ========================================================================== */

export type CellType =
  // ── TEXT & INPUT ──────────────────────────────────────────
  | 'text'        // Plain string — truncatable
  | 'textarea'    // Multiline text (2-line clamp in view)
  | 'email'       // mailto: link in view / text input in edit
  | 'phone'       // tel: link in view / text input in edit (cm.formatPhone)
  | 'url'         // Hyperlink in view / text input in edit

  // ── NUMERIC ───────────────────────────────────────────────
  | 'number'      // Formatted number (cm.formatNumber)
  | 'currency'    // Indian Rupee / any currency (cm.formatCurrency)
  | 'percent'     // Percentage display (cm.formatPercent)

  // ── DATE & TIME ────────────────────────────────────────────
  | 'date'        // Date display + datepicker editor (cm.formatDate)
  | 'datetime'    // Date + time display (cm.formatDateTime)
  | 'timeago'     // Relative time — "3 hours ago" (cm.timeAgoText)

  // ── BOOLEAN ───────────────────────────────────────────────
  | 'boolean'     // Yes/No chip in view / checkbox in edit

  // ── SELECTION ─────────────────────────────────────────────
  | 'select'      // Dropdown editor / label or badge in view
  | 'badge'       // Status badge — view only (never editable)

  // ── VISUAL INDICATORS ─────────────────────────────────────
  | 'progress'    // Progress bar with optional percentage label
  | 'rating'      // Star rating display (max configurable)
  | 'color'       // Color swatch + hex label

  // ── MEDIA & IDENTITY ──────────────────────────────────────
  | 'avatar'      // Image or initials avatar with optional label
  | 'initials'    // Initials-only colored chip (no image fallback)

  // ── COLLECTIONS ───────────────────────────────────────────
  | 'tags'        // Array / comma-string of tags — view only

  | 'filesize'    // Bytes → human readable (cm.formatFileSize)
  | 'duration'    // Minutes → "2h 15m" (cm.formatDuration)
  | 'master-dropdown'; // New: Universal master dropdown integration


/* ==========================================================================
   CELL INTERACTION — Emitted by MasterCellComponent on every user action.
   ========================================================================== */

export type CellInteractionType =
  | 'click'       // Clicked the cell in view mode
  | 'focus'       // Editor received focus
  | 'blur'        // Editor lost focus
  | 'change'      // Draft value changed (every keystroke / selection)
  | 'enter'       // Enter key pressed
  | 'escape'      // Escape key pressed
  | 'linkClick';  // Clicked an email / phone / url anchor

export interface CellInteractionEvent {
  /** What triggered this event */
  interactionType: CellInteractionType;
  /** The cell's CellType */
  cellType: CellType;
  /** Committed value — what the grid row holds */
  value: any;
  /** Live draft value at the time of the event */
  draftValue: any;
  /** Column field name */
  field: string;
  /** Row ID (from getRowId) */
  rowId: string;
  /** Full raw row data object */
  rowData: any;
  /** Native DOM event when available */
  nativeEvent?: Event | null;
}


/* ==========================================================================
   SELECT OPTION — Used by 'select' cells and objectsToOptions() helpers.
   ========================================================================== */

export interface SelectOption {
  label: string;
  value: any;
  /** Optional PrimeNG icon class e.g. 'pi pi-check' */
  icon?: string;
  /** Optional severity for badge-style display */
  severity?: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  /** Disable this option in the dropdown */
  disabled?: boolean;
}


/* ==========================================================================
   CELL CONFIG — Full contract for a column's render + edit behavior.
   Every property is optional except `type`.
   ========================================================================== */

export interface CellConfig {

  /** The type of cell — drives both the editor and the viewer. Required. */
  type: CellType;

  // ══════════════════════════════════════════════════════════
  // EDITOR BEHAVIOUR
  // ══════════════════════════════════════════════════════════

  /**
   * Always show the editor regardless of row edit state.
   * Ideal for inline quick-entry grids / forms.
   * Default: false
   */
  alwaysEditable?: boolean;

  /**
   * Pressing Enter triggers handleRowAction('save') on the parent grid.
   * Default: false — prevents accidental saves on Tab.
   */
  enterToSave?: boolean;

  /**
   * Column is never editable, even when the row is in edit mode.
   * Use for ID fields, computed values, timestamps, etc.
   * Default: false
   */
  readOnly?: boolean;

  /**
   * Placeholder text for text / email / phone / url / textarea editors
   * and for p-select when no value is selected.
   */
  placeholder?: string;

  // ══════════════════════════════════════════════════════════
  // TEXT OPTIONS
  // ══════════════════════════════════════════════════════════

  /**
   * Truncate long text values in view mode at N characters.
   * Default: 50
   */
  truncateAt?: number;

  // ══════════════════════════════════════════════════════════
  // NUMBER / CURRENCY OPTIONS
  // ══════════════════════════════════════════════════════════

  /** Minimum decimal places shown. Default: 0 for number, 2 for currency */
  minFractionDigits?: number;

  /** Maximum decimal places shown. Default: 2 */
  maxFractionDigits?: number;

  /** Minimum allowed value in number / currency editor */
  min?: number;

  /**
   * Maximum allowed value in number / currency editor.
   * Also used as the denominator for progress bars and rating max stars.
   * Default: 100 for progress, 5 for rating
   */
  max?: number;

  /** ISO currency code. Default: 'INR' */
  currencyCode?: string;

  /** Locale string for Intl.NumberFormat. Default: 'en-IN' */
  currencyLocale?: string;

  // ══════════════════════════════════════════════════════════
  // DATE OPTIONS
  // ══════════════════════════════════════════════════════════

  /**
   * Angular DatePipe format string used in view mode.
   * Default: 'dd MMM yyyy'
   * @see https://angular.io/api/common/DatePipe
   */
  dateFormat?: string;

  /**
   * PrimeNG p-datepicker format string used in the editor.
   * Default: 'dd/mm/yy'
   */
  datePickerFormat?: string;

  /** Show time picker in the datepicker. Default: false */
  showTime?: boolean;

  // ══════════════════════════════════════════════════════════
  // SELECT OPTIONS
  // ══════════════════════════════════════════════════════════

  /** Options list for 'select' type cells */
  options?: SelectOption[];

  /** Key on each option to use as the display label. Default: 'label' */
  optionLabel?: string;

  /** Key on each option to use as the bound value. Default: 'value' */
  optionValue?: string;

  /** Endpoint for 'master-dropdown' type cells */
  endpoint?: import('../../../../core/services/master-dropdown.service').DropdownEndpoint;

  /**
   * When true, the select value is rendered as a badge in view mode
   * instead of plain text. Uses getBadgeSeverity() for coloring.
   * Default: false
   */
  selectAsBadge?: boolean;

  // ══════════════════════════════════════════════════════════
  // BADGE OPTIONS
  // ══════════════════════════════════════════════════════════

  /**
   * Manual severity map for badge / select cells.
   * Keys are value strings (lowercased), values are severity strings.
   * @example { active: 'success', inactive: 'danger', pending: 'warning' }
   * Falls back to CommonMethodService.mapStatusToSeverity() if not provided.
   */
  badgeMap?: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'>;

  // ══════════════════════════════════════════════════════════
  // TEXTAREA OPTIONS
  // ══════════════════════════════════════════════════════════

  /** Number of visible rows in the textarea editor. Default: 2 */
  rows?: number;

  // ══════════════════════════════════════════════════════════
  // PROGRESS OPTIONS
  // ══════════════════════════════════════════════════════════

  /**
   * Show the percentage label next to the progress bar.
   * Default: true
   */
  showValue?: boolean;

  // ══════════════════════════════════════════════════════════
  // RATING OPTIONS
  // ══════════════════════════════════════════════════════════
  // max is shared with number/progress — see above (default: 5 for rating)

  // ══════════════════════════════════════════════════════════
  // AVATAR / INITIALS OPTIONS
  // ══════════════════════════════════════════════════════════

  /**
   * Row data field to read the name from for initials / color generation.
   * Falls back to the cell value itself if not specified.
   * @example labelField: 'fullName'
   */
  labelField?: string;

  // ══════════════════════════════════════════════════════════
  // TAGS OPTIONS
  // ══════════════════════════════════════════════════════════

  /**
   * Maximum number of tags to display before showing a "+N more" chip.
   * Default: 3
   */
  maxTags?: number;

  // ══════════════════════════════════════════════════════════
  // FILESIZE OPTIONS
  // ══════════════════════════════════════════════════════════
  // Value is expected in bytes. cm.formatFileSize() handles the conversion.
  // No extra config needed.

  // ══════════════════════════════════════════════════════════
  // DURATION OPTIONS
  // ══════════════════════════════════════════════════════════
  // Value is expected in total minutes. cm.formatDuration() handles display.
  // No extra config needed.

  // ══════════════════════════════════════════════════════════
  // INTERACTION EVENTS
  // ══════════════════════════════════════════════════════════

  /**
   * Emit a CellInteractionEvent for every interaction on this cell.
   * Set to false on high-frequency cells (e.g. always-editable number columns)
   * to reduce event noise.
   * Default: true
   */
  emitEvents?: boolean;
}


/* ==========================================================================
   GRID COL DEF — Extends AG Grid's ColDef with our CellConfig.
   ========================================================================== */

export interface GridColDef<T = any> extends ColDef<T> {
  /**
   * Attach this to use MasterCellComponent for rendering + editing.
   * When omitted, AG Grid renders the cell natively.
   */
  cellConfig?: CellConfig;

  /** Allows nesting for column groups without needing ColGroupDef unions */
  children?: GridColDef<T>[];
  marryChildren?: boolean;
}


/* ==========================================================================
   MASTER CELL PARAMS — Passed into MasterCellComponent by the grid.
   ========================================================================== */

export interface MasterCellParams {
  /** Current cell value */
  value: any;

  /** Full cell config for this column */
  cellConfig: CellConfig;

  /** Row ID string (set by getRowId) */
  nodeId: string;

  /** Full raw row data */
  data: any;

  /** Column field name */
  field: string;

  /**
   * Reference to AppSharedGrid passed via gridOptions.context.componentParent.
   * Gives the cell access to updateDraft(), handleRowAction(), editingIds, etc.
   */
  componentParent: any;

  /** Returns true if this specific row is currently in edit mode */
  isRowEditing: () => boolean;
}


/* ==========================================================================
   SEVERITY UNION — Shared type used by badges, selects, and status helpers.
   ========================================================================== */

export type CellSeverity =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'secondary';
