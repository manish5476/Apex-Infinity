import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─────────────────────────────────────────────────────────────────────────────
//  Public Types
// ─────────────────────────────────────────────────────────────────────────────

export type ColumnType = 'text' | 'number' | 'currency' | 'percent' | 'date' | 'boolean' | 'email' | 'phone';

export interface ColumnConfig {
  key: string;
  label: string;
  visible?: boolean;
  isId?: boolean;
  width?: number;
  type?: ColumnType;
  currencySymbol?: string;
  showTotal?: boolean;
  headerColor?: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => string | number | Date | boolean;
}

export interface NestedSheetConfig {
  arrayKey: string;
  sheetName?: string;
  columns: ColumnConfig[];
  parentRefKey?: string;
  tabColor?: string;
}

export interface ExcelExportConfig {
  fileName?: string;
  sheetTitle?: string;
  sheetName?: string;
  company?: string;
  showTimestamp?: boolean;
  showTotals?: boolean;
  hiddenKeys?: string[];
  showIds?: boolean;
  freezeHeader?: boolean;
  autoFilter?: boolean;
  tabColor?: string;
  alternateRowColor?: string;
  creator?: string;
  nestedObjectStrategy?: 'flatten' | 'ignore';
  nestedSheets?: NestedSheetConfig[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Internal Constants & Defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  fileName: 'Data_Export',
  sheetTitle: 'Data Export',
  sheetName: 'Data',
  company: '',
  showTimestamp: true,
  showTotals: true,
  hiddenKeys: [] as string[],
  showIds: false,
  freezeHeader: true,
  autoFilter: true,
  tabColor: '6366f1', // Updated to modern indigo accent
  alternateRowColor: 'f8fafc', // Modern slate-50
  creator: 'System Export',
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
  number: 'right', currency: 'right', percent: 'right',
  date: 'center', boolean: 'center',
  email: 'left', phone: 'left', text: 'left',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Pure Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

function flattenObject(obj: Record<string, unknown>, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
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

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, key) => {
    if (cur != null && typeof cur === 'object' && !Array.isArray(cur)) {
      return (cur as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function colLetter(n: number): string {
  let r = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    r = String.fromCharCode(65 + rem) + r;
    n = Math.floor((n - 1) / 26);
  }
  return r;
}

function detectIdKey(row: Record<string, unknown>): string {
  return ['id', '_id', 'uuid', 'Id', 'ID', 'code', 'no'].find((k) => k in row) ?? 'id';
}

function thinBorder(color = 'FFcbd5e1'): Partial<ExcelJS.Borders> { // Slate-300
  const s: ExcelJS.BorderStyle = 'thin';
  const c: Partial<ExcelJS.Color> = { argb: color };
  return { top: { style: s, color: c }, bottom: { style: s, color: c }, left: { style: s, color: c }, right: { style: s, color: c } };
}

function accentTopBorder(argb: string): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'medium', color: { argb } },
    bottom: { style: 'thin', color: { argb: 'FFcbd5e1' } },
    left: { style: 'thin', color: { argb: 'FFcbd5e1' } },
    right: { style: 'thin', color: { argb: 'FFcbd5e1' } },
  };
}

function autoWidth(col: ColumnConfig): number {
  const b = col.label.length;
  switch (col.type) {
    case 'currency': case 'number': return Math.max(b + 2, 16);
    case 'date': return Math.max(b + 2, 14);
    case 'email': return Math.max(b + 4, 26);
    case 'phone': return Math.max(b + 2, 14);
    case 'boolean': return Math.max(b + 2, 10);
    default: return Math.max(b + 4, 18);
  }
}

function resolveCellValue(col: ColumnConfig, raw: unknown, row: Record<string, unknown>): unknown {
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

function resolveVisible(cols: ColumnConfig[], hiddenKeys: string[], showIds: boolean): ColumnConfig[] {
  return cols.filter((c) => {
    if (hiddenKeys.includes(c.key)) return false;
    if (c.isId && !showIds) return false;
    return c.visible !== false;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  SheetBuilder & Extractor
// ─────────────────────────────────────────────────────────────────────────────

interface NestedLinkTarget { sheetName: string; firstChildRow: number; label: string; }

interface BuildOptions {
  workbook: ExcelJS.Workbook;
  data: Record<string, unknown>[];
  columns: ColumnConfig[];
  sheetName: string;
  title: string;
  cfg: ResolvedConfig;
  tabColor?: string;
  nestedLinks?: Map<number, NestedLinkTarget[]>;
  nestedLinkLabel?: string;
}

class SheetBuilder {
  private sheet!: ExcelJS.Worksheet;
  private row = 1;
  private colWidths: number[] = [];
  private readonly tc: string;
  private readonly tabHex: string;

  constructor(private o: BuildOptions) {
    this.tabHex = (o.tabColor ?? o.cfg.tabColor).replace('#', '');
    this.tc = 'FF' + this.tabHex;
  }

  build(): ExcelJS.Worksheet {
    const { workbook, data, columns, sheetName, title, cfg } = this.o;
    const hasLinks = (this.o.nestedLinks?.size ?? 0) > 0;

    const linkCol: ColumnConfig = { key: '__nestedLink', label: this.o.nestedLinkLabel ?? 'Details ↗', width: 22, type: 'text', headerColor: this.tabHex };
    const allCols = hasLinks ? [...columns, linkCol] : columns;

    this.colWidths = allCols.map(c => c.width ?? autoWidth(c));

    this.sheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: this.tc } },
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: cfg.freezeHeader ? [{ state: 'frozen', ySplit: this.freezeRow() }] : [],
    });

    this.sheet.columns = allCols.map((c, i) => ({ key: c.key, width: this.colWidths[i] }));

    this.writeTitle(title, allCols.length);
    if (cfg.showTimestamp) this.writeTimestamp(allCols.length);
    if (cfg.company) this.writeCompany(allCols.length);
    this.writeBlank();

    const headerRowNum = this.row;
    this.writeHeader(allCols);

    const dataStart = this.row;
    this.writeData(data, columns, allCols, cfg);
    const dataEnd = this.row - 1;

    if (cfg.showTotals && data.length) this.writeTotals(allCols, dataStart, dataEnd);
    if (cfg.autoFilter && data.length) {
      this.sheet.autoFilter = { from: { row: headerRowNum, column: 1 }, to: { row: headerRowNum, column: allCols.length } };
    }

    allCols.forEach((_, i) => { this.sheet.getColumn(i + 1).width = this.colWidths[i]; });
    return this.sheet;
  }

  private writeTitle(title: string, span: number): void {
    const r = this.sheet.addRow([title]);
    this.sheet.mergeCells(this.row, 1, this.row, span);
    const c = r.getCell(1);
    c.value = title;
    c.font = { name: 'Calibri', bold: true, size: 18, color: { argb: 'FF0f172a' } }; // Slate-900
    c.alignment = { horizontal: 'left', vertical: 'middle' };
    r.height = 36;
    this.row++;
  }

  private writeTimestamp(span: number): void {
    const ts = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
    const r = this.sheet.addRow([`Generated: ${ts}`]);
    this.sheet.mergeCells(this.row, 1, this.row, span);
    const c = r.getCell(1);
    c.font = { name: 'Calibri', italic: true, size: 10, color: { argb: 'FF64748b' } }; // Slate-500
    c.alignment = { horizontal: 'right' };
    r.height = 16;
    this.row++;
  }

  private writeCompany(span: number): void {
    const r = this.sheet.addRow([this.o.cfg.company]);
    this.sheet.mergeCells(this.row, 1, this.row, span);
    const c = r.getCell(1);
    c.font = { name: 'Calibri', bold: true, size: 11, color: { argb: this.tc } };
    c.alignment = { horizontal: 'right' };
    r.height = 18;
    this.row++;
  }

  private writeBlank(): void { this.sheet.addRow([]); this.row++; }

  private writeHeader(cols: ColumnConfig[]): void {
    const r = this.sheet.addRow(cols.map((c) => c.label.toUpperCase()));
    cols.forEach((col, i) => {
      const cell = r.getCell(i + 1);
      const hex = (col.headerColor ?? this.tabHex).replace('#', '');
      cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder('FFFFFFFF');
    });
    r.height = 28;
    this.row++;
  }

  private writeData(data: Record<string, unknown>[], dataCols: ColumnConfig[], allCols: ColumnConfig[], cfg: ResolvedConfig): void {
    const hasLinks = (this.o.nestedLinks?.size ?? 0) > 0;
    const linkColIdx = allCols.length;

    data.forEach((item, idx) => {
      const flat = cfg.nestedObjectStrategy === 'flatten' ? flattenObject(item) : { ...item };
      const values = dataCols.map((col) => resolveCellValue(col, getByPath(flat, col.key), flat));
      if (hasLinks) values.push('');

      values.forEach((v, i) => {
        if (!allCols[i].width) {
          let strLen = 0;
          if (v instanceof Date) strLen = 14;
          else if (v !== null && v !== undefined) strLen = String(v).length;
          if (strLen + 3 > this.colWidths[i]) this.colWidths[i] = Math.min(strLen + 3, 75);
        }
      });

      const r = this.sheet.addRow(values);
      this.styleDataRow(r, allCols, idx, cfg);

      if (hasLinks) {
        const links = this.o.nestedLinks!.get(idx);
        const cell = r.getCell(linkColIdx);
        if (links?.length === 1) {
          cell.value = { text: `↗ ${links[0].label}`, hyperlink: `#'${links[0].sheetName}'!A${links[0].firstChildRow}` };
          cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF6366f1' }, underline: true };
        } else if (links?.length && links.length > 1) {
          cell.value = links.map((l) => `↗ ${l.label}`).join('  |  ');
          cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF6366f1' } };
        } else {
          cell.value = '—';
          cell.font = { name: 'Calibri', size: 11, color: { argb: 'FFcbd5e1' } };
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      this.row++;
    });
  }

  private styleDataRow(r: ExcelJS.Row, cols: ColumnConfig[], idx: number, cfg: ResolvedConfig): void {
    const isAlt = idx % 2 !== 0;
    const altFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + cfg.alternateRowColor } };
    const whiteFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    cols.forEach((col, i) => {
      const cell = r.getCell(i + 1);
      const type = col.type ?? 'text';
      if (col.key !== '__nestedLink') {
        if (type === 'currency') cell.numFmt = `"${col.currencySymbol ?? '₹'}"#,##0.00`;
        else if (NUM_FMT[type]) cell.numFmt = NUM_FMT[type]!;
        cell.alignment = { horizontal: H_ALIGN[type] ?? 'left', vertical: 'middle', wrapText: false };
        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF334155' } }; // Slate-700
      }
      cell.fill = isAlt ? altFill : whiteFill;
      cell.border = thinBorder('FFe2e8f0'); // Slate-200
    });
    r.height = 22;
  }

  private writeTotals(cols: ColumnConfig[], dataStart: number, dataEnd: number): void {
    const values = cols.map((col, i) => {
      if (i === 0) return 'TOTAL';
      if (col.key === '__nestedLink') return null;
      const type = col.type ?? 'text';
      if (['number', 'currency', 'percent'].includes(type) && col.showTotal !== false) {
        return { formula: `SUM(${colLetter(i + 1)}${dataStart}:${colLetter(i + 1)}${dataEnd})` };
      }
      return null;
    });

    const r = this.sheet.addRow(values);
    cols.forEach((col, i) => {
      const cell = r.getCell(i + 1);
      const type = col.type ?? 'text';
      cell.font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF0f172a' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf8fafc' } };
      cell.border = accentTopBorder(this.tc);
      if (type === 'currency') cell.numFmt = `"${col.currencySymbol ?? '₹'}"#,##0.00`;
      else if (NUM_FMT[type]) cell.numFmt = NUM_FMT[type]!;
      cell.alignment = { horizontal: H_ALIGN[type] ?? 'left', vertical: 'middle' };
    });
    r.height = 26;
    this.row++;
  }

  private freezeRow(): number {
    const { cfg } = this.o;
    return 1 + (cfg.showTimestamp ? 1 : 0) + (cfg.company ? 1 : 0) + 1 + 1;
  }
}

function extractNestedData(data: Record<string, unknown>[], configs: NestedSheetConfig[], idKey: string, headerOffset: number): any[] {
  return configs.map((sheetCfg) => {
    const rows: Record<string, unknown>[] = [];
    const parentToFirstRow = new Map<number, number>();

    data.forEach((parentRow, parentIdx) => {
      const children = getByPath(parentRow, sheetCfg.arrayKey);
      if (!Array.isArray(children) || !children.length) return;
      parentToFirstRow.set(parentIdx, headerOffset + rows.length + 1);
      const parentRefVal = parentRow[idKey] ?? parentIdx + 1;

      children.forEach((child) => {
        const childRow: Record<string, unknown> = typeof child === 'object' && child !== null ? { ...(child as Record<string, unknown>) } : { value: child };
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
  selector: 'app-excel-export-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button 
      class="btn-export" 
      [class.exporting]="exporting()" 
      [class.success]="exportDone()"
      [disabled]="exporting() || !data().length"
      (click)="exportToExcel()"
      [title]="tooltipText()">
      
      @if (exporting()) {
        <i class="pi pi-spin pi-spinner"></i>
        <span>Generating...</span>
      } @else if (exportDone()) {
        <i class="pi pi-check"></i>
        <span>Downloaded!</span>
      } @else {
        <i class="pi pi-file-excel"></i>
        <span>Export Excel</span>
      }
    </button>
  `,
  styles: [`
    .btn-export {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--ui-border-radius-lg, 12px);
      background: var(--bg-surface, #ffffff);
      border: var(--ui-border-width, 1px) solid var(--border-soft, #e2e8f0);
      color: var(--text-main, #0f172a);
      font-family: var(--font-body, 'Inter', sans-serif);
      font-weight: 600;
      font-size: 0.85rem;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      transition: all 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
      cursor: pointer;
      white-space: nowrap;
    }
    
    .btn-export:hover:not(:disabled) {
      border-color: var(--primary, #6366f1);
      color: var(--primary, #6366f1);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
      transform: translateY(-1px);
    }
    
    .btn-export:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-export.exporting {
      background: var(--bg-secondary, #f8fafc);
      color: var(--text-muted, #64748b);
      border-color: var(--border-soft, #e2e8f0);
    }

    .btn-export.success {
      background: var(--success-bg, #dcfce7);
      border-color: var(--success-border, #bbf7d0);
      color: var(--success, #10b981);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
    }

    i { font-size: 1rem; }
  `]
})
export class ExcelExportDialogComponent {
  // ── Signal Inputs ─────────────────────────────────────────────────────────────
  readonly data = input<Record<string, unknown>[]>([]);
  readonly columns = input<ColumnConfig[]>([]);
  readonly config = input<ExcelExportConfig>({});

  // ── Internal State Signals ────────────────────────────────────────────────────
  readonly exporting = signal(false);
  readonly exportDone = signal(false);

  // ── Computed Properties ───────────────────────────────────────────────────────
  readonly resolvedConfig = computed<ResolvedConfig>(() => ({ ...DEFAULTS, ...this.config() } as ResolvedConfig));

  readonly visibleColumns = computed(() => {
    const cfg = this.resolvedConfig();
    return resolveVisible(this.columns(), cfg.hiddenKeys, cfg.showIds);
  });

  readonly tooltipText = computed(() => {
    const rows = this.data();
    if (!rows || !rows.length) return 'No data to export';

    const ns = this.resolvedConfig().nestedSheets.length;
    const extra = ns ? ` + ${ns} reference sheet${ns > 1 ? 's' : ''}` : '';
    return `Export ${rows.length.toLocaleString('en-IN')} rows × ${this.visibleColumns().length} columns${extra}`;
  });

  // ── Export Logic ──────────────────────────────────────────────────────────────
  async exportToExcel(): Promise<void> {
    const rawData = this.data();
    if (this.exporting() || !rawData?.length) return;

    this.exporting.set(true);
    this.exportDone.set(false);

    try {
      const cfg = this.resolvedConfig();
      const visibleCols = this.visibleColumns();
      const idKey = detectIdKey(rawData[0] ?? {});

      const wb = new ExcelJS.Workbook();
      wb.creator = cfg.creator;
      wb.company = cfg.company;
      wb.created = new Date();
      wb.modified = new Date();

      const childHeaderOffset = 1 + (cfg.showTimestamp ? 1 : 0) + (cfg.company ? 1 : 0) + 2;
      const extracted = extractNestedData(rawData, cfg.nestedSheets, idKey, childHeaderOffset);

      let nestedLinks: Map<number, NestedLinkTarget[]> | undefined;
      let nestedLinkLabel: string | undefined;

      if (extracted.length) {
        nestedLinks = new Map();
        nestedLinkLabel = extracted.length === 1
          ? `${extracted[0].sheetCfg.sheetName ?? extracted[0].sheetCfg.arrayKey} ↗`
          : 'Details ↗';

        rawData.forEach((_row, idx) => {
          const targets: NestedLinkTarget[] = [];
          extracted.forEach(({ sheetCfg, parentToFirstRow }) => {
            const firstRow = parentToFirstRow.get(idx);
            if (firstRow !== undefined) {
              targets.push({ sheetName: sheetCfg.sheetName ?? sheetCfg.arrayKey, firstChildRow: firstRow, label: sheetCfg.sheetName ?? sheetCfg.arrayKey });
            }
          });
          if (targets.length) nestedLinks!.set(idx, targets);
        });
      }

      new SheetBuilder({
        workbook: wb, data: rawData, columns: visibleCols,
        sheetName: cfg.sheetName, title: cfg.sheetTitle, cfg,
        nestedLinks, nestedLinkLabel,
      }).build();

      extracted.forEach(({ sheetCfg, rows }) => {
        if (!rows.length) return;
        const refKey = sheetCfg.parentRefKey ?? 'parentId';
        const refCol: ColumnConfig = { key: refKey, label: 'Ref #', type: 'text', width: 14, headerColor: sheetCfg.tabColor ?? 'a855f7' };

        const hasRef = sheetCfg.columns.some((c: any) => c.key === refKey);
        const childCols = hasRef ? sheetCfg.columns : [refCol, ...sheetCfg.columns];
        const visibleChildCols = resolveVisible(childCols, cfg.hiddenKeys, cfg.showIds);

        new SheetBuilder({
          workbook: wb, data: rows, columns: visibleChildCols,
          sheetName: sheetCfg.sheetName ?? sheetCfg.arrayKey, title: sheetCfg.sheetName ?? sheetCfg.arrayKey, cfg,
          tabColor: sheetCfg.tabColor ?? 'a855f7',
        }).build();
      });

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `${cfg.fileName}.xlsx`
      );

      this.exportDone.set(true);
      setTimeout(() => this.exportDone.set(false), 3000);
    } finally {
      this.exporting.set(false);
    }
  }
}
