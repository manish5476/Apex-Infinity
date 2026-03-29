import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─────────────────────────────────────────────────────────────────────────────
//  Public Types
// ─────────────────────────────────────────────────────────────────────────────

export type ColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'boolean'
  | 'email'
  | 'phone';

export interface ColumnConfig {
  /**
   * Dot-notation key path – resolves nested objects automatically.
   * e.g.  "address.city"  |  "meta.createdBy.name"  |  "total"
   */
  key: string;
  /** Column header shown in Excel */
  label: string;
  /** Hide column without removing it from config (default = true) */
  visible?: boolean;
  /** Hidden unless ExcelExportConfig.showIds = true */
  isId?: boolean;
  /** Column width in characters – omit for smart auto-width */
  width?: number;
  /** Controls number format, alignment and totals eligibility */
  type?: ColumnType;
  /** Currency symbol for type:'currency' (default '₹') */
  currencySymbol?: string;
  /** Include in totals SUM row – true for all numeric types by default */
  showTotal?: boolean;
  /** Per-column header fill hex (no '#') – falls back to tabColor */
  headerColor?: string;
  /**
   * Custom value transformer.
   * Receives raw value + full (flattened) row.
   * Return value is placed directly into the Excel cell.
   */
  formatter?: (value: unknown, row: Record<string, unknown>) => string | number | Date | boolean;
}

/** Config for one nested-array field that becomes its own worksheet. */
export interface NestedSheetConfig {
  /** Key in each root data row that holds the child array, e.g. "orderLines" */
  arrayKey: string;
  /** Worksheet tab name (defaults to arrayKey) */
  sheetName?: string;
  /** Column definitions for the child rows */
  columns: ColumnConfig[];
  /**
   * Column key injected into every child row pointing back to the parent.
   * The value used is the parent row's detected ID field.
   * Default = 'parentId'.
   */
  parentRefKey?: string;
  /** Tab colour hex without '#' – defaults to a contrasting indigo accent */
  tabColor?: string;
}

export interface ExcelExportConfig {
  /** Download file name without extension (default 'export') */
  fileName?: string;
  /** Large title cell shown at the top of the main sheet */
  sheetTitle?: string;
  /** Workbook tab name for the main sheet (default 'Data') */
  sheetName?: string;
  /** Company / org name shown beneath the title */
  company?: string;
  /** Show "Generated on …" timestamp row (default true) */
  showTimestamp?: boolean;
  /** Show SUM totals row at the bottom (default true) */
  showTotals?: boolean;
  /** Keys to force-hide regardless of ColumnConfig.visible */
  hiddenKeys?: string[];
  /** Render columns marked isId:true (default false) */
  showIds?: boolean;
  /** Freeze pane below the header row (default true) */
  freezeHeader?: boolean;
  /** Enable Excel auto-filter on the header (default true) */
  autoFilter?: boolean;
  /** Main sheet tab colour hex without '#' (default '1D7A3B') */
  tabColor?: string;
  /** Alternate row background hex without '#' (default 'EEF9F2') */
  alternateRowColor?: string;
  /** Workbook creator metadata (default 'ExcelExport') */
  creator?: string;
  /**
   * What to do with nested plain-object fields.
   * 'flatten' – dot-key paths resolve automatically (default)
   * 'ignore'  – nested objects are skipped
   */
  nestedObjectStrategy?: 'flatten' | 'ignore';
  /** Configs for nested array fields → separate reference sheets */
  nestedSheets?: NestedSheetConfig[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Internal Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  fileName: 'export',
  sheetTitle: 'Data Export',
  sheetName: 'Data',
  company: '',
  showTimestamp: true,
  showTotals: true,
  hiddenKeys: [] as string[],
  showIds: false,
  freezeHeader: true,
  autoFilter: true,
  tabColor: '1D7A3B',
  alternateRowColor: 'EEF9F2',
  creator: 'ExcelExport',
  nestedObjectStrategy: 'flatten' as const,
  nestedSheets: [] as NestedSheetConfig[],
};

type ResolvedConfig = typeof DEFAULTS & { company: string };

const NUM_FMT: Partial<Record<ColumnType, string>> = {
  number: '#,##0.##',
  percent: '0.00%',
  date: 'DD-MMM-YYYY',
};

const H_ALIGN: Partial<Record<ColumnType, ExcelJS.Alignment['horizontal']>> = {
  number: 'right',
  currency: 'right',
  percent: 'right',
  date: 'center',
  boolean: 'center',
  email: 'left',
  phone: 'left',
  text: 'left',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Pure Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively flatten nested plain objects into dot-notation keys.
 * Arrays are intentionally left as-is for nested-sheet extraction.
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
  out: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      flattenObject(v as Record<string, unknown>, path, out);
    } else {
      out[path] = v;
    }
  }
  return out;
}

/** Read a dot-notation path from any object depth. */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, key) => {
    if (cur != null && typeof cur === 'object' && !Array.isArray(cur)) {
      return (cur as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/** 1-based column index → Excel column letter(s). */
function colLetter(n: number): string {
  let r = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    r = String.fromCharCode(65 + rem) + r;
    n = Math.floor((n - 1) / 26);
  }
  return r;
}

/** Detect the most likely unique-ID field in a data row. */
function detectIdKey(row: Record<string, unknown>): string {
  const CANDIDATES = ['id', '_id', 'uuid', 'Id', 'ID', 'code', 'no'];
  return CANDIDATES.find((k) => k in row) ?? 'id';
}

// ── Border factories ──────────────────────────────────────────────────────────

function thinBorder(color = 'FFD8D8D8'): Partial<ExcelJS.Borders> {
  const s: ExcelJS.BorderStyle = 'thin';
  const c: Partial<ExcelJS.Color> = { argb: color };
  return {
    top: { style: s, color: c },
    bottom: { style: s, color: c },
    left: { style: s, color: c },
    right: { style: s, color: c },
  };
}

function accentTopBorder(argb: string): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'medium', color: { argb } },
    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  };
}

// ── Auto column-width heuristic ───────────────────────────────────────────────

function autoWidth(col: ColumnConfig): number {
  const b = col.label.length;
  switch (col.type) {
    case 'currency':
    case 'number': return Math.max(b + 2, 16);
    case 'date': return Math.max(b + 2, 14);
    case 'email': return Math.max(b + 4, 26);
    case 'phone': return Math.max(b + 2, 14);
    case 'boolean': return Math.max(b + 2, 10);
    default: return Math.max(b + 4, 18);
  }
}

// ── Cell value resolver ───────────────────────────────────────────────────────

function resolveCellValue(
  col: ColumnConfig,
  raw: unknown,
  row: Record<string, unknown>
): unknown {
  if (col.formatter) return col.formatter(raw, row);
  if (raw === null || raw === undefined) return '';
  switch (col.type) {
    case 'boolean': return (raw as boolean) ? 'Yes' : 'No';
    case 'date': {
      if (raw instanceof Date) return raw;
      const d = new Date(raw as string | number);
      return isNaN(d.getTime()) ? String(raw) : d;
    }
    default: return raw;
  }
}

// ── Column visibility filter ──────────────────────────────────────────────────

function resolveVisible(
  cols: ColumnConfig[],
  hiddenKeys: string[],
  showIds: boolean
): ColumnConfig[] {
  return cols.filter((c) => {
    if (hiddenKeys.includes(c.key)) return false;
    if (c.isId && !showIds) return false;
    return c.visible !== false;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Nested Link Types
// ─────────────────────────────────────────────────────────────────────────────

interface NestedLinkTarget {
  sheetName: string;
  firstChildRow: number; // 1-based Excel row in the target sheet
  label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SheetBuilder — writes a single worksheet into an ExcelJS workbook
// ─────────────────────────────────────────────────────────────────────────────

interface BuildOptions {
  workbook: ExcelJS.Workbook;
  data: Record<string, unknown>[];
  columns: ColumnConfig[];
  sheetName: string;
  title: string;
  cfg: ResolvedConfig;
  tabColor?: string;
  /** Map of 0-based parent row index → hyperlink targets in nested sheets */
  nestedLinks?: Map<number, NestedLinkTarget[]>;
  /** Header label for the auto-appended link column */
  nestedLinkLabel?: string;
}

class SheetBuilder {
  private sheet!: ExcelJS.Worksheet;
  private row = 1;
  private colWidths: number[] = [];
  /** Effective tab colour with FF alpha prefix */
  private readonly tc: string;
  /** Effective tab colour hex without prefix (for fills etc.) */
  private readonly tabHex: string;

  constructor(private o: BuildOptions) {
    this.tabHex = (o.tabColor ?? o.cfg.tabColor).replace('#', '');
    this.tc = 'FF' + this.tabHex;
  }

  build(): ExcelJS.Worksheet {
    const { workbook, data, columns, sheetName, title, cfg } = this.o;
    const hasLinks = (this.o.nestedLinks?.size ?? 0) > 0;

    // Append a virtual link column when nested sheets exist
    const linkCol: ColumnConfig = {
      key: '__nestedLink',
      label: this.o.nestedLinkLabel ?? 'Details ↗',
      width: 22,
      type: 'text',
      headerColor: this.tabHex,
    };
    const allCols = hasLinks ? [...columns, linkCol] : columns;

    this.colWidths = allCols.map(c => c.width ?? autoWidth(c));

    this.sheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: this.tc } },
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: cfg.freezeHeader ? [{ state: 'frozen', ySplit: this.freezeRow() }] : [],
    });

    this.sheet.columns = allCols.map((c, i) => ({
      key: c.key,
      width: this.colWidths[i],
    }));

    this.writeTitle(title, allCols.length);
    if (cfg.showTimestamp) this.writeTimestamp(allCols.length);
    if (cfg.company) this.writeCompany(allCols.length);
    this.writeBlank();

    const headerRowNum = this.row;
    this.writeHeader(allCols);

    const dataStart = this.row;
    this.writeData(data, columns, allCols, cfg);
    const dataEnd = this.row - 1;

    if (cfg.showTotals && data.length) {
      this.writeTotals(allCols, dataStart, dataEnd);
    }

    if (cfg.autoFilter && data.length) {
      this.sheet.autoFilter = {
        from: { row: headerRowNum, column: 1 },
        to: { row: headerRowNum, column: allCols.length },
      };
    }

    allCols.forEach((_, i) => {
      this.sheet.getColumn(i + 1).width = this.colWidths[i];
    });

    return this.sheet;
  }

  // ── Section writers ──────────────────────────────────────────────────────────

  private writeTitle(title: string, span: number): void {
    const r = this.sheet.addRow([title]);
    this.sheet.mergeCells(this.row, 1, this.row, span);
    const c = r.getCell(1);
    c.value = title;
    c.font = { name: 'Calibri', bold: true, size: 16, color: { argb: 'FF1F3864' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
    r.height = 32;
    this.row++;
  }

  private writeTimestamp(span: number): void {
    const ts = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
    const r = this.sheet.addRow([`Generated: ${ts}`]);
    this.sheet.mergeCells(this.row, 1, this.row, span);
    const c = r.getCell(1);
    c.font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF888888' } };
    c.alignment = { horizontal: 'right' };
    r.height = 14;
    this.row++;
  }

  private writeCompany(span: number): void {
    const r = this.sheet.addRow([this.o.cfg.company]);
    this.sheet.mergeCells(this.row, 1, this.row, span);
    const c = r.getCell(1);
    c.font = { name: 'Calibri', bold: true, size: 10, color: { argb: this.tc } };
    c.alignment = { horizontal: 'right' };
    r.height = 14;
    this.row++;
  }

  private writeBlank(): void {
    this.sheet.addRow([]);
    this.row++;
  }

  private writeHeader(cols: ColumnConfig[]): void {
    const r = this.sheet.addRow(cols.map((c) => c.label));
    cols.forEach((col, i) => {
      const cell = r.getCell(i + 1);
      const hex = (col.headerColor ?? this.tabHex).replace('#', '');
      cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder();
    });
    r.height = 24;
    this.row++;
  }

  private writeData(
    data: Record<string, unknown>[],
    dataCols: ColumnConfig[],
    allCols: ColumnConfig[],
    cfg: ResolvedConfig
  ): void {
    const hasLinks = (this.o.nestedLinks?.size ?? 0) > 0;
    const linkColIdx = allCols.length; // 1-based position of the link column

    data.forEach((item, idx) => {
      const flat = cfg.nestedObjectStrategy === 'flatten'
        ? flattenObject(item)
        : { ...item };

      // Resolve data column values; append empty string for link col placeholder
      const values = dataCols.map((col) => resolveCellValue(col, getByPath(flat, col.key), flat));
      if (hasLinks) values.push('');

      values.forEach((v, i) => {
        if (!allCols[i].width) {
          let strLen = 0;
          if (v instanceof Date) strLen = 14;
          else if (v !== null && v !== undefined) strLen = String(v).length;
          if (strLen + 3 > this.colWidths[i]) {
            this.colWidths[i] = Math.min(strLen + 3, 75);
          }
        }
      });

      const r = this.sheet.addRow(values);
      this.styleDataRow(r, allCols, idx, cfg);

      // Inject hyperlink into link column for rows that have nested children
      if (hasLinks) {
        const links = this.o.nestedLinks!.get(idx);
        const cell = r.getCell(linkColIdx);

        if (links?.length === 1) {
          // Single nested sheet → clickable hyperlink directly to first child row
          cell.value = {
            text: `↗ ${links[0].label}`,
            hyperlink: `#'${links[0].sheetName}'!A${links[0].firstChildRow}`,
          };
          cell.font = {
            name: 'Calibri', size: 10,
            color: { argb: 'FF0563C1' },
            underline: true,
          };
        } else if (links?.length && links.length > 1) {
          // Multiple nested sheets → list all labels (Excel supports only 1 hyperlink per cell)
          cell.value = links.map((l) => `↗ ${l.label}`).join('  |  ');
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0563C1' } };
        } else {
          // No children for this row
          cell.value = '—';
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFBBBBBB' } };
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      this.row++;
    });
  }

  private styleDataRow(
    r: ExcelJS.Row,
    cols: ColumnConfig[],
    idx: number,
    cfg: ResolvedConfig
  ): void {
    const isAlt = idx % 2 !== 0;
    const altFill: ExcelJS.Fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FF' + cfg.alternateRowColor },
    };
    const whiteFill: ExcelJS.Fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' },
    };

    cols.forEach((col, i) => {
      const cell = r.getCell(i + 1);
      const type = col.type ?? 'text';

      if (col.key !== '__nestedLink') {
        if (type === 'currency') {
          cell.numFmt = `"${col.currencySymbol ?? '₹'}"#,##0.00`;
        } else if (NUM_FMT[type]) {
          cell.numFmt = NUM_FMT[type]!;
        }
        cell.alignment = {
          horizontal: H_ALIGN[type] ?? 'left',
          vertical: 'middle',
          wrapText: false,
        };
        cell.font = { name: 'Calibri', size: 10 };
      }

      cell.fill = isAlt ? altFill : whiteFill;
      cell.border = thinBorder('FFE8E8E8');
    });

    r.height = 18;
  }

  private writeTotals(cols: ColumnConfig[], dataStart: number, dataEnd: number): void {
    const values = cols.map((col, i) => {
      if (i === 0) return 'TOTAL';
      if (col.key === '__nestedLink') return null;
      const type = col.type ?? 'text';
      const numeric = ['number', 'currency', 'percent'].includes(type);
      if (numeric && col.showTotal !== false) {
        return { formula: `SUM(${colLetter(i + 1)}${dataStart}:${colLetter(i + 1)}${dataEnd})` };
      }
      return null;
    });

    const r = this.sheet.addRow(values);
    cols.forEach((col, i) => {
      const cell = r.getCell(i + 1);
      const type = col.type ?? 'text';
      cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF1F3864' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
      cell.border = accentTopBorder(this.tc);
      if (type === 'currency') {
        cell.numFmt = `"${col.currencySymbol ?? '₹'}"#,##0.00`;
      } else if (NUM_FMT[type]) {
        cell.numFmt = NUM_FMT[type]!;
      }
      cell.alignment = { horizontal: H_ALIGN[type] ?? 'left', vertical: 'middle' };
    });
    r.height = 22;
    this.row++;
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  /** Row to freeze pane below (1-based Excel row of the header). */
  private freezeRow(): number {
    const { cfg } = this.o;
    return (
      1                              // title row
      + (cfg.showTimestamp ? 1 : 0)
      + (cfg.company ? 1 : 0)
      + 1                            // blank spacer
      + 1                            // header row itself
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Nested Sheet Extraction
// ─────────────────────────────────────────────────────────────────────────────

interface NestedExtractResult {
  sheetCfg: NestedSheetConfig;
  rows: Record<string, unknown>[];
  /**
   * Maps 0-based parent row index → the 1-based Excel row in the child sheet
   * where that parent's children begin (used for hyperlinks).
   */
  parentToFirstRow: Map<number, number>;
}

/**
 * Walk every parent row, pull out child arrays, inject a parent-ref column,
 * and record which Excel row each group starts on in the child sheet.
 *
 * @param headerOffset  Number of non-data rows that precede data in child sheets
 *                      (title + timestamp? + company? + blank + header = counted externally)
 */
function extractNestedData(
  data: Record<string, unknown>[],
  configs: NestedSheetConfig[],
  idKey: string,
  headerOffset: number
): NestedExtractResult[] {
  return configs.map((sheetCfg) => {
    const rows: Record<string, unknown>[] = [];
    const parentToFirstRow = new Map<number, number>();

    data.forEach((parentRow, parentIdx) => {
      const children = getByPath(parentRow, sheetCfg.arrayKey);
      if (!Array.isArray(children) || !children.length) return;

      // Excel row = headerOffset rows + 1-based position in the rows array
      // +1 because rows.length is currently the index of the NEXT row we'll push
      const firstExcelRow = headerOffset + rows.length + 1;
      parentToFirstRow.set(parentIdx, firstExcelRow);

      const parentRefVal = parentRow[idKey] ?? parentIdx + 1;

      children.forEach((child) => {
        const childRow: Record<string, unknown> =
          typeof child === 'object' && child !== null
            ? { ...(child as Record<string, unknown>) }
            : { value: child };
        childRow[sheetCfg.parentRefKey ?? 'parentId'] = parentRefVal;
        rows.push(childRow);
      });
    });

    return { sheetCfg, rows, parentToFirstRow };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-excel-export',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './excel-export.html',
  styleUrls: ['./excel-export.scss'],
})
export class ExcelExportComponent implements OnChanges {
  // ── Inputs ────────────────────────────────────────────────────────────────────
  @Input() data: Record<string, unknown>[] = [];
  @Input() columns: ColumnConfig[] = [];
  @Input() config: ExcelExportConfig = {};

  // ── Signals ───────────────────────────────────────────────────────────────────

  readonly exporting = signal(false);
  readonly exportDone = signal(false);
  readonly rowCount = signal(0);
  readonly visibleColumnCount = signal(0);
  readonly nestedSheetCount = signal(0);

  readonly tooltipText = computed(() => {
    if (!this.data?.length) return 'No data to export';
    const ns = this.nestedSheetCount();
    const extra = ns ? ` + ${ns} reference sheet${ns > 1 ? 's' : ''}` : '';
    return `Export ${this.rowCount().toLocaleString('en-IN')} rows × ${this.visibleColumnCount()} columns${extra}`;
  });

  // ── Private ───────────────────────────────────────────────────────────────────

  private get cfg(): ResolvedConfig {
    return { ...DEFAULTS, ...this.config } as ResolvedConfig;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnChanges(c: SimpleChanges): void {
    if (c['data'] || c['columns'] || c['config']) {
      const cfg = this.cfg;
      this.rowCount.set(this.data?.length ?? 0);
      this.visibleColumnCount.set(resolveVisible(this.columns, cfg.hiddenKeys, cfg.showIds).length);
      this.nestedSheetCount.set(cfg.nestedSheets.length);
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────────

  async exportToExcel(): Promise<void> {
    if (this.exporting() || !this.data?.length) return;

    this.exporting.set(true);
    this.exportDone.set(false);

    try {
      const cfg = this.cfg;
      const visibleCols = resolveVisible(this.columns, cfg.hiddenKeys, cfg.showIds);
      const idKey = detectIdKey(this.data[0] ?? {});

      const wb = new ExcelJS.Workbook();
      wb.creator = cfg.creator;
      wb.company = cfg.company;
      wb.created = new Date();
      wb.modified = new Date();

      // ── Step 1: Pre-calculate child-sheet row positions ─────────────────────
      // We need these BEFORE writing the parent sheet so we can embed accurate
      // hyperlinks. The header offset in each child sheet is:
      //   title(1) + timestamp?(1) + company?(1) + blank(1) + header(1)
      const childHeaderOffset =
        1
        + (cfg.showTimestamp ? 1 : 0)
        + (cfg.company ? 1 : 0)
        + 1  // blank spacer
        + 1; // header row

      const extracted = extractNestedData(
        this.data,
        cfg.nestedSheets,
        idKey,
        childHeaderOffset
      );

      // ── Step 2: Build nestedLinks map for the parent sheet ──────────────────
      let nestedLinks: Map<number, NestedLinkTarget[]> | undefined;
      let nestedLinkLabel: string | undefined;

      if (extracted.length) {
        nestedLinks = new Map();
        nestedLinkLabel = extracted.length === 1
          ? `${extracted[0].sheetCfg.sheetName ?? extracted[0].sheetCfg.arrayKey} ↗`
          : 'Details ↗';

        this.data.forEach((_row, idx) => {
          const targets: NestedLinkTarget[] = [];

          extracted.forEach(({ sheetCfg, parentToFirstRow }) => {
            const firstRow = parentToFirstRow.get(idx);
            if (firstRow !== undefined) {
              targets.push({
                sheetName: sheetCfg.sheetName ?? sheetCfg.arrayKey,
                firstChildRow: firstRow,
                label: sheetCfg.sheetName ?? sheetCfg.arrayKey,
              });
            }
          });

          if (targets.length) nestedLinks!.set(idx, targets);
        });
      }

      // ── Step 3: Write primary sheet ─────────────────────────────────────────
      new SheetBuilder({
        workbook: wb,
        data: this.data,
        columns: visibleCols,
        sheetName: cfg.sheetName,
        title: cfg.sheetTitle,
        cfg,
        nestedLinks,
        nestedLinkLabel,
      }).build();

      // ── Step 4: Write nested reference sheets ───────────────────────────────
      extracted.forEach(({ sheetCfg, rows }) => {
        if (!rows.length) return;

        const refKey = sheetCfg.parentRefKey ?? 'parentId';
        const refCol: ColumnConfig = {
          key: refKey,
          label: 'Ref #',
          type: 'text',
          width: 14,
          headerColor: sheetCfg.tabColor ?? '5B6EB5',
        };

        // Prepend ref column only if not already declared
        const hasRef = sheetCfg.columns.some((c) => c.key === refKey);
        const childCols = hasRef ? sheetCfg.columns : [refCol, ...sheetCfg.columns];
        const visibleChildCols = resolveVisible(childCols, cfg.hiddenKeys, cfg.showIds);

        new SheetBuilder({
          workbook: wb,
          data: rows,
          columns: visibleChildCols,
          sheetName: sheetCfg.sheetName ?? sheetCfg.arrayKey,
          title: sheetCfg.sheetName ?? sheetCfg.arrayKey,
          cfg,
          tabColor: sheetCfg.tabColor ?? '5B6EB5',
        }).build();
      });

      // ── Step 5: Download ────────────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `${cfg.fileName}.xlsx`
      );

      this.exportDone.set(true);
      setTimeout(() => this.exportDone.set(false), 3000);
    } finally {
      this.exporting.set(false);
    }
  }
}


// import {
//   Component,
//   Input,
//   OnChanges,
//   SimpleChanges,
//   inject,
//   signal,
//   computed,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { BadgeModule } from 'primeng/badge';
// import * as ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';

// // ─────────────────────────────────────────────
// //  Types & Interfaces
// // ─────────────────────────────────────────────

// export interface ColumnConfig {
//   /** The key from your data object */
//   key: string;
//   /** Human-readable header label */
//   label: string;
//   /** Show this column? default = true */
//   visible?: boolean;
//   /** If the column is an ID column, show it only when showIds = true */
//   isId?: boolean;
//   /** Column width in characters (default = auto) */
//   width?: number;
//   /** Cell format: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'boolean' */
//   type?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'boolean';
//   /** Currency symbol for 'currency' type (default = '₹') */
//   currencySymbol?: string;
//   /** Show column total (only for numeric types) */
//   showTotal?: boolean;
//   /** Custom cell formatter – receives the raw value and returns a display string */
//   formatter?: (value: unknown) => string;
//   /** Hex fill for this column header (e.g. '4472C4') */
//   headerColor?: string;
// }

// export interface ExcelExportConfig {
//   /** Sheet / file name (no extension) */
//   fileName?: string;
//   /** Worksheet title shown in row 1 */
//   sheetTitle?: string;
//   /** Show the "Generated on …" row */
//   showTimestamp?: boolean;
//   /** Show a totals row at the bottom */
//   showTotals?: boolean;
//   /** Pass the keys you want to HIDE (overrides ColumnConfig.visible) */
//   hiddenKeys?: string[];
//   /** Whether ID columns should be rendered (default = false) */
//   showIds?: boolean;
//   /** Freeze the header row */
//   freezeHeader?: boolean;
//   /** Enable auto-filter on columns */
//   autoFilter?: boolean;
//   /** Sheet tab colour (hex, e.g. '70AD47') */
//   tabColor?: string;
//   /** Alternate row fill (hex, default = 'F2F7FF') */
//   alternateRowColor?: string;
//   /** Creator metadata */
//   creator?: string;
// }

// // ─────────────────────────────────────────────
// //  Defaults
// // ─────────────────────────────────────────────

// const DEFAULT_CONFIG: Required<ExcelExportConfig> = {
//   fileName: 'export',
//   sheetTitle: 'Data Export',
//   showTimestamp: true,
//   showTotals: true,
//   hiddenKeys: [],
//   showIds: false,
//   freezeHeader: true,
//   autoFilter: true,
//   tabColor: '2E75B6',
//   alternateRowColor: 'EEF4FB',
//   creator: 'ExcelExport Component',
// };

// const TYPE_FORMATS: Record<string, string> = {
//   number: '#,##0.00',
//   currency: '₹#,##0.00',
//   percent: '0.00%',
//   date: 'DD-MM-YYYY',
//   text: '@',
//   boolean: '@',
// };

// // ─────────────────────────────────────────────
// //  Component
// // ─────────────────────────────────────────────

// @Component({
//   selector: 'app-excel-export',
//   standalone: true,
//   imports: [CommonModule, ButtonModule, TooltipModule, BadgeModule],
//   templateUrl: './excel-export.html',
//   styleUrls: ['./excel-export.scss'],
// })
// export class ExcelExportComponent implements OnChanges {
//   // ── Inputs ──────────────────────────────────

//   /** The raw data array to export */
//   @Input() data: Record<string, unknown>[] = [];

//   /** Column definitions */
//   @Input() columns: ColumnConfig[] = [];

//   /** Fine-grained export configuration */
//   @Input() config: ExcelExportConfig = {};

//   // ── Signals ─────────────────────────────────

//   exporting = signal(false);
//   exportDone = signal(false);
//   rowCount = signal(0);
//   visibleColumnCount = signal(0);

//   // ── Computed merged config ───────────────────
//   private mergedConfig = computed<Required<ExcelExportConfig>>(() => ({
//     ...DEFAULT_CONFIG,
//     ...this.config,
//   }));

//   // ── Lifecycle ────────────────────────────────

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['data'] || changes['columns'] || changes['config']) {
//       this.rowCount.set(this.data?.length ?? 0);
//       this.visibleColumnCount.set(this.resolveVisibleColumns().length);
//     }
//   }

//   // ── Public export trigger ────────────────────

//   async exportToExcel(): Promise<void> {
//     if (this.exporting() || !this.data?.length) return;

//     this.exporting.set(true);
//     this.exportDone.set(false);

//     try {
//       const cfg = this.mergedConfig();
//       const visibleCols = this.resolveVisibleColumns();

//       const workbook = new ExcelJS.Workbook();
//       workbook.creator = cfg.creator;
//       workbook.created = new Date();

//       const sheet = workbook.addWorksheet(cfg.sheetTitle, {
//         properties: { tabColor: { argb: 'FF' + cfg.tabColor } },
//         pageSetup: {
//           orientation: 'landscape',
//           fitToPage: true,
//           fitToWidth: 1,
//         },
//         views: cfg.freezeHeader ? [{ state: 'frozen', ySplit: this.headerRowIndex(cfg) }] : [],
//       });

//       let currentRow = 1;

//       // ── Title row ──────────────────────────
//       currentRow = this.writeTitle(sheet, cfg, visibleCols.length, currentRow);

//       // ── Timestamp row ──────────────────────
//       if (cfg.showTimestamp) {
//         currentRow = this.writeTimestamp(sheet, visibleCols.length, currentRow);
//       }

//       // ── Spacer ─────────────────────────────
//       sheet.addRow([]);
//       currentRow++;

//       // ── Column widths ──────────────────────
//       sheet.columns = visibleCols.map((col) => ({
//         key: col.key,
//         width: col.width ?? this.autoWidth(col),
//       }));

//       // ── Header row ─────────────────────────
//       const headerRow = sheet.addRow(visibleCols.map((c) => c.label));
//       this.styleHeaderRow(headerRow, visibleCols, cfg);
//       currentRow++;

//       // ── Data rows ─────────────────────────
//       const dataStartRow = currentRow;
//       this.data.forEach((item, idx) => {
//         const rowValues = visibleCols.map((col) => this.getCellValue(col, item[col.key]));
//         const row = sheet.addRow(rowValues);
//         this.styleDataRow(row, visibleCols, idx, cfg);
//         currentRow++;
//       });

//       // ── Totals row ─────────────────────────
//       if (cfg.showTotals) {
//         const totalsRow = this.writeTotals(sheet, visibleCols, dataStartRow, currentRow, cfg);
//         currentRow++;
//       }

//       // ── Auto filter ────────────────────────
//       if (cfg.autoFilter) {
//         const headerRowNum = dataStartRow - 1;
//         sheet.autoFilter = {
//           from: { row: headerRowNum, column: 1 },
//           to: { row: headerRowNum, column: visibleCols.length },
//         };
//       }

//       // ── Export ─────────────────────────────
//       const buffer = await workbook.xlsx.writeBuffer();
//       saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${cfg.fileName}.xlsx`);

//       this.exportDone.set(true);
//       setTimeout(() => this.exportDone.set(false), 3000);
//     } finally {
//       this.exporting.set(false);
//     }
//   }

//   // ── Helpers ──────────────────────────────────

//   /** Resolve which columns are visible after applying all rules */
//   private resolveVisibleColumns(): ColumnConfig[] {
//     const cfg = this.mergedConfig();
//     return this.columns.filter((col) => {
//       // Explicit hidden-keys list wins first
//       if (cfg.hiddenKeys.includes(col.key)) return false;
//       // ID column gate
//       if (col.isId && !cfg.showIds) return false;
//       // Column-level visible flag (default true)
//       return col.visible !== false;
//     });
//   }

//   private headerRowIndex(cfg: Required<ExcelExportConfig>): number {
//     // title(1) + timestamp(1 if on) + spacer(1) + header(1)
//     return 1 + (cfg.showTimestamp ? 1 : 0) + 1 + 1;
//   }

//   private writeTitle(
//     sheet: ExcelJS.Worksheet,
//     cfg: Required<ExcelExportConfig>,
//     colCount: number,
//     row: number
//   ): number {
//     const titleRow = sheet.addRow([cfg.sheetTitle]);
//     sheet.mergeCells(row, 1, row, colCount);
//     const cell = titleRow.getCell(1);
//     cell.value = cfg.sheetTitle;
//     cell.font = { name: 'Calibri', bold: true, size: 16, color: { argb: 'FF1F3864' } };
//     cell.alignment = { horizontal: 'center', vertical: 'middle' };
//     cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
//     titleRow.height = 30;
//     return row + 1;
//   }

//   private writeTimestamp(sheet: ExcelJS.Worksheet, colCount: number, row: number): number {
//     const now = new Date().toLocaleString('en-IN', {
//       dateStyle: 'long',
//       timeStyle: 'short',
//     });
//     const tsRow = sheet.addRow([`Generated on: ${now}`]);
//     sheet.mergeCells(row, 1, row, colCount);
//     const cell = tsRow.getCell(1);
//     cell.font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF7F7F7F' } };
//     cell.alignment = { horizontal: 'right' };
//     tsRow.height = 14;
//     return row + 1;
//   }

//   private styleHeaderRow(
//     headerRow: ExcelJS.Row,
//     cols: ColumnConfig[],
//     cfg: Required<ExcelExportConfig>
//   ): void {
//     cols.forEach((col, i) => {
//       const cell = headerRow.getCell(i + 1);
//       cell.value = col.label;
//       cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
//       cell.fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FF' + (col.headerColor ?? cfg.tabColor) },
//       };
//       cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
//       cell.border = this.thinBorder();
//     });
//     headerRow.height = 22;
//   }

//   private styleDataRow(
//     row: ExcelJS.Row,
//     cols: ColumnConfig[],
//     idx: number,
//     cfg: Required<ExcelExportConfig>
//   ): void {
//     const isAlt = idx % 2 !== 0;
//     cols.forEach((col, i) => {
//       const cell = row.getCell(i + 1);
//       const type = col.type ?? 'text';

//       // Number format
//       if (['number', 'currency', 'percent'].includes(type)) {
//         const fmt =
//           type === 'currency'
//             ? `"${col.currencySymbol ?? '₹'}"#,##0.00`
//             : TYPE_FORMATS[type];
//         cell.numFmt = fmt;
//         cell.alignment = { horizontal: 'right', vertical: 'middle' };
//       } else if (type === 'date') {
//         cell.numFmt = TYPE_FORMATS['date'];
//         cell.alignment = { horizontal: 'center', vertical: 'middle' };
//       } else {
//         cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
//       }

//       // Alternate row fill
//       if (isAlt) {
//         cell.fill = {
//           type: 'pattern',
//           pattern: 'solid',
//           fgColor: { argb: 'FF' + cfg.alternateRowColor },
//         };
//       }

//       cell.border = this.thinBorder('FFDDDDDD');
//       cell.font = { name: 'Calibri', size: 10 };
//     });
//     row.height = 18;
//   }

//   private writeTotals(
//     sheet: ExcelJS.Worksheet,
//     cols: ColumnConfig[],
//     dataStartRow: number,
//     currentRow: number,
//     cfg: Required<ExcelExportConfig>
//   ): ExcelJS.Row {
//     const dataEndRow = currentRow - 1;
//     const totalsValues = cols.map((col, i) => {
//       const type = col.type ?? 'text';
//       const canTotal = ['number', 'currency', 'percent'].includes(type) && col.showTotal !== false;
//       if (i === 0) return 'TOTAL';
//       if (canTotal) {
//         const colLetter = this.colLetter(i + 1);
//         return { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
//       }
//       return '';
//     });

//     const totalsRow = sheet.addRow(totalsValues);

//     cols.forEach((col, i) => {
//       const cell = totalsRow.getCell(i + 1);
//       const type = col.type ?? 'text';

//       cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF1F3864' } };
//       cell.fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FFDCE6F1' },
//       };
//       cell.border = this.thickTopBorder();

//       if (['number', 'currency'].includes(type)) {
//         const fmt =
//           type === 'currency'
//             ? `"${col.currencySymbol ?? '₹'}"#,##0.00`
//             : TYPE_FORMATS[type];
//         cell.numFmt = fmt;
//         cell.alignment = { horizontal: 'right', vertical: 'middle' };
//       }
//     });

//     totalsRow.height = 22;
//     return totalsRow;
//   }

//   private getCellValue(col: ColumnConfig, raw: unknown): unknown {
//     if (col.formatter) return col.formatter(raw);
//     if (raw === null || raw === undefined) return '';
//     const type = col.type ?? 'text';
//     if (type === 'boolean') return raw ? 'Yes' : 'No';
//     if (type === 'date' && raw instanceof Date) return raw;
//     if (type === 'date' && typeof raw === 'string') return new Date(raw);
//     return raw;
//   }

//   private autoWidth(col: ColumnConfig): number {
//     const labelLen = col.label.length;
//     const type = col.type ?? 'text';
//     if (['currency', 'number'].includes(type)) return Math.max(labelLen + 2, 14);
//     if (type === 'date') return Math.max(labelLen + 2, 14);
//     return Math.max(labelLen + 4, 18);
//   }

//   private thinBorder(color = 'FFBBBBBB'): Partial<ExcelJS.Borders> {
//     const s: ExcelJS.BorderStyle = 'thin';
//     const c: Partial<ExcelJS.Color> = { argb: color };
//     return { top: { style: s, color: c }, bottom: { style: s, color: c }, left: { style: s, color: c }, right: { style: s, color: c } };
//   }

//   private thickTopBorder(): Partial<ExcelJS.Borders> {
//     return {
//       top: { style: 'medium', color: { argb: 'FF2E75B6' } },
//       bottom: { style: 'thin', color: { argb: 'FFBBBBBB' } },
//       left: { style: 'thin', color: { argb: 'FFBBBBBB' } },
//       right: { style: 'thin', color: { argb: 'FFBBBBBB' } },
//     };
//   }

//   /** Convert column index (1-based) to Excel letter (A, B, … Z, AA …) */
//   private colLetter(n: number): string {
//     let result = '';
//     while (n > 0) {
//       const rem = (n - 1) % 26;
//       result = String.fromCharCode(65 + rem) + result;
//       n = Math.floor((n - 1) / 26);
//     }
//     return result;
//   }
// }
// // 