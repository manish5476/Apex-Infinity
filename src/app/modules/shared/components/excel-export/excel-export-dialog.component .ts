// excel-export-dialog.component.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Drop-in replacement for app-excel-export.
//  Usage:  <app-excel-export-dialog [data]="anyJsonArrayOrResponse" />
//  → click button → dialog opens → user configures → downloads xlsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  Component, Input, OnChanges, SimpleChanges,
  signal, computed, ChangeDetectionStrategy,
  ViewChild, ElementRef, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─────────────────────────────────────────────────────────────────────────────
//  Re-export types (keep existing type contracts)
// ─────────────────────────────────────────────────────────────────────────────

export type ColumnType =
  | 'text' | 'number' | 'currency' | 'percent'
  | 'date' | 'boolean' | 'email' | 'phone';

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

export interface DialogColumn {
  key: string;
  label: string;
  type: ColumnType;
  isId: boolean;
  showTotal: boolean;
  selected: boolean;   
  customLabel: string; 
}

export interface DialogNestedSheet {
  arrayKey: string;
  sheetName: string;
  tabColor: string;
  include: boolean;
  columns: DialogColumn[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Schema Inference
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SKIP_KEYS = new Set([
  '__v', '__t',
  'avatar', 'profilePic', 'profileImage', 'photo',
  'password', 'passwordHash', 'passwordChangedAt', 'refreshToken', 'token',
  'updatedBy',
]);
const ID_SUFFIXES = ['Id', '_id', 'ID', 'Uuid', 'uuid'];
const DISPLAY_KEYS = ['name', 'title', 'label', 'code', 'no', 'number'];
const NESTED_COLORS = ['5B6EB5', 'C45B1A', '8B5CF6', 'D97706', '0891B2', 'BE185D'];

const CURRENCY_HINTS = ['amount', 'total', 'price', 'rate', 'salary', 'balance', 'cost', 'fee', 'tax', 'gst', 'cgst', 'sgst', 'igst', 'discount', 'charges', 'revenue', 'profit', 'loss', 'debit', 'credit', 'payment'];
const DATE_HINTS = ['date', 'at', 'on', 'time', 'created', 'updated', 'joined', 'birth', 'expiry', 'expire', 'start', 'end', 'due', 'paid', 'active'];
const BOOL_HINTS = ['is', 'has', 'can', 'allow', 'enable', 'enforce', 'verified', 'blocked', 'active'];
const EMAIL_HINTS = ['email', 'mail'];
const PHONE_HINTS = ['phone', 'mobile', 'contact', 'whatsapp', 'fax'];
const PERCENT_HINTS = ['percent', 'rate', 'ratio', 'gst', 'tax', 'discount'];
const NUMBER_HINTS = ['count', 'qty', 'quantity', 'number', 'num', 'max', 'min', 'limit', 'sessions', 'radius', 'page', 'pages'];

// FIX: Generate clear labels for nested paths (e.g. Employee Profile - Department Id - Name)
function toLabel(path: string): string {
  return path.split('.').map(key => 
    key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_.\-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
  ).join(' - ');
}

function isIdKey(key: string): boolean {
  return ID_SUFFIXES.some(s => key === s || key.endsWith(s) || key === '_id');
}

function inferType(key: string, samples: unknown[]): ColumnType {
  const low = key.toLowerCase();
  if (EMAIL_HINTS.some(h => low.includes(h))) return 'email';
  if (PHONE_HINTS.some(h => low.includes(h))) return 'phone';
  const ne = samples.filter(s => s !== null && s !== undefined && s !== '');
  if (!ne.length) return 'text';
  if (ne.every(s => typeof s === 'boolean')) return 'boolean';
  if (BOOL_HINTS.some(h => low.startsWith(h))) return 'boolean';
  if (ne.every(s => typeof s === 'number' || !isNaN(Number(s)))) {
    if (PERCENT_HINTS.some(h => low.endsWith(h) || low === h)) return 'percent';
    if (CURRENCY_HINTS.some(h => low.includes(h))) return 'currency';
    return 'number';
  }
  if (ne.every(s => typeof s === 'string') && DATE_HINTS.some(h => low.includes(h))) {
    if (/^\d{4}-\d{2}-\d{2}/.test(String(ne[0]))) return 'date';
  }
  return 'text';
}

interface FieldMeta { path: string; label: string; type: ColumnType; isId: boolean; sample: unknown[]; }
interface ArrayMeta { key: string; label: string; childFields: FieldMeta[]; }

function walkRow(
  obj: Record<string, unknown>, prefix: string,
  flat: Map<string, FieldMeta>, arrays: Map<string, ArrayMeta>,
  threshold = 3
): void {
  for (const [key, val] of Object.entries(obj)) {
    if (DEFAULT_SKIP_KEYS.has(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const label = toLabel(path); // FIX: Use the full path for the label

    if (val === null || val === undefined) {
      if (!flat.has(path)) flat.set(path, { path, label, type: 'text', isId: isIdKey(key), sample: [] });
      continue;
    }

    if (typeof val !== 'object') {
      const ex = flat.get(path);
      if (ex) { if (val !== '') { ex.sample.push(val); if (ex.sample.length > 5) ex.sample.shift(); } }
      else flat.set(path, { path, label, type: 'text', isId: isIdKey(key), sample: val !== '' ? [val] : [] });
      continue;
    }

    if (Array.isArray(val)) {
      const hasObject = val.some(v => v !== null && typeof v === 'object');

      if (!hasObject) {
        if (!arrays.has(path)) {
          const joined = val.filter(v => v !== null && v !== undefined).join(', ');
          const ex = flat.get(path);
          if (ex) { if (joined !== '') { ex.sample.push(joined); if (ex.sample.length > 5) ex.sample.shift(); } }
          else flat.set(path, { path, label, type: 'text', isId: false, sample: joined !== '' ? [joined] : [] });
        }
      } else {
        if (flat.has(path)) flat.delete(path);

        const cf = new Map<string, FieldMeta>();
        const da = new Map<string, ArrayMeta>();

        if (arrays.has(path)) {
          arrays.get(path)!.childFields.forEach(f => cf.set(f.path, { ...f, sample: [...f.sample] }));
        }

        val.forEach(item => {
          if (item && typeof item === 'object') {
            walkRow(item as Record<string, unknown>, '', cf, da, threshold);
          }
        });

        const childFields = Array.from(cf.values()).map(f => ({ ...f, type: inferType(f.path.split('.').pop() ?? f.path, f.sample) }));
        arrays.set(path, { key: path, label: toLabel(key), childFields });
      }
      continue;
    }

    walkRow(val as Record<string, unknown>, path, flat, arrays, threshold);
  }
}

export function inferSchema(data: Record<string, unknown>[], sampleSize = 20, threshold = 3): {
  columns: ColumnConfig[];
  nestedSheets: Array<{ key: string; label: string; columns: ColumnConfig[] }>;
} {
  const flat = new Map<string, FieldMeta>();
  const arrays = new Map<string, ArrayMeta>();
  data.slice(0, sampleSize).forEach(row => walkRow(row, '', flat, arrays, threshold));

  const columns: ColumnConfig[] = Array.from(flat.values()).map(f => {
    const type = inferType(f.path.split('.').pop() ?? f.path, f.sample);
    return {
      key: f.path, label: f.label, type, isId: f.isId,
      showTotal: ['currency', 'number'].includes(type)
    };
  });

  const nestedSheets = Array.from(arrays.values()).map(a => ({
    key: a.key, label: a.label,
    columns: a.childFields.map(f => ({
      key: f.path, label: f.label, type: f.type, isId: f.isId,
      showTotal: ['currency', 'number'].includes(f.type)
    })),
  }));

  return { columns, nestedSheets };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Excel writer utilities
// ─────────────────────────────────────────────────────────────────────────────

function flattenObject(obj: Record<string, unknown>, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date))
      flattenObject(v as Record<string, unknown>, path, out);
    else out[path] = v;
  }
  return out;
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, key) => {
    if (cur != null && typeof cur === 'object' && !Array.isArray(cur)) return (cur as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function colLetter(n: number): string {
  let r = ''; while (n > 0) { const rem = (n - 1) % 26; r = String.fromCharCode(65 + rem) + r; n = Math.floor((n - 1) / 26); } return r;
}

function thinBorder(c = 'FFD8D8D8'): Partial<ExcelJS.Borders> {
  const s: ExcelJS.BorderStyle = 'thin'; const col: Partial<ExcelJS.Color> = { argb: c };
  return { top: { style: s, color: col }, bottom: { style: s, color: col }, left: { style: s, color: col }, right: { style: s, color: col } };
}

function accentTopBorder(argb: string): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'medium', color: { argb } }, bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
  };
}

const NUM_FMT: Partial<Record<ColumnType, string>> = { number: '#,##0.##', percent: '0.00%', date: 'DD-MMM-YYYY' };
const H_ALIGN: Partial<Record<ColumnType, ExcelJS.Alignment['horizontal']>> = {
  number: 'right', currency: 'right', percent: 'right', date: 'center', boolean: 'center', email: 'left', phone: 'left', text: 'left'
};

function autoWidth(col: ColumnConfig): number {
  const b = col.label.length;
  switch (col.type) {
    case 'currency': case 'number': return Math.max(b + 2, 16); case 'date': return Math.max(b + 2, 14);
    case 'email': return Math.max(b + 4, 26); case 'phone': return Math.max(b + 2, 14); case 'boolean': return Math.max(b + 2, 10);
    default: return Math.max(b + 4, 18);
  }
}

function resolveCellValue(col: ColumnConfig, raw: unknown, row: Record<string, unknown>): unknown {
  if (col.formatter) return col.formatter(raw, row);
  if (raw === null || raw === undefined || raw === '') return '';
  switch (col.type) {
    case 'boolean': return (raw as boolean) ? 'Yes' : 'No';
    case 'date': { if (raw instanceof Date) return raw; const d = new Date(raw as string | number); return isNaN(d.getTime()) ? String(raw) : d; }
    case 'number': 
    case 'currency': 
    case 'percent': {
      // FIX: Force numbers so Excel's SUM formula works properly
      const num = Number(raw);
      return isNaN(num) ? raw : num;
    }
    default: return Array.isArray(raw) ? raw.join(', ') : raw;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportWorkbookConfig {
  fileName: string;
  sheetName: string;
  sheetTitle: string;
  company: string;
  showTimestamp: boolean;
  showTotals: boolean;
  freezeHeader: boolean;
  autoFilter: boolean;
  showIds: boolean;
  tabColor: string;
  alternateRowColor: string;
  creator: string;
  nestedSheets: NestedSheetConfig[];
}

@Component({
  selector: 'app-excel-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // (Keep the existing HTML template and CSS styles exactly as you provided them)
  template: `<div class="eed-host">
  <button class="eed-trigger" [disabled]="!data.length" [title]="data.length ? 'Configure & export to Excel' : 'No data'" (click)="openDialog()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="11" x2="12" y2="17"/>
      <polyline points="9 14 12 17 15 14"/>
    </svg>
    Export Excel
    @if (data.length) { <span class="eed-badge">{{ data.length | number }}</span> }
  </button>

  <div #portalTarget style="display: contents;">
    @if (dialogOpen()) {
      <div class="eed-overlay" (click)="closeDialog()">
      <div class="eed-panel" (click)="$event.stopPropagation()">

        <div class="eed-panel-header">
          <div class="eed-panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            Configure Excel Export
          </div>
          <button class="eed-close" (click)="closeDialog()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="eed-body">
          <section class="eed-section">
            <div class="eed-section-label">File & Sheet</div>
            <div class="eed-grid-2">
              <div class="eed-field">
                <label>File Name</label>
                <div class="eed-input-wrap">
                  <input type="text" [(ngModel)]="dialogState.fileName" placeholder="export" />
                  <span class="eed-suffix">.xlsx</span>
                </div>
              </div>
              <div class="eed-field">
                <label>Sheet Name</label>
                <input type="text" [(ngModel)]="dialogState.sheetName" placeholder="Data" />
              </div>
              <div class="eed-field">
                <label>Report Title</label>
                <input type="text" [(ngModel)]="dialogState.sheetTitle" placeholder="Data Export" />
              </div>
              <div class="eed-field">
                <label>Company / Sub-title</label>
                <input type="text" [(ngModel)]="dialogState.company" placeholder="Optional" />
              </div>
            </div>
          </section>

          <section class="eed-section">
            <div class="eed-section-label">Options</div>
            <div class="eed-checkbox-row">
              <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.showTimestamp" /><span>Timestamp</span></label>
              <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.showTotals" /><span>Totals row</span></label>
              <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.freezeHeader" /><span>Freeze header</span></label>
              <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.autoFilter" /><span>Auto-filter</span></label>
              <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.showIds" /><span>Show ID cols</span></label>
            </div>
          </section>

          <section class="eed-section">
            <div class="eed-section-label">Tab Colour</div>
            <div class="eed-color-row">
              @for (c of tabColorPalette; track c) {
                <button class="eed-color-swatch"
                  [style.background]="'#'+c"
                  [class.active]="dialogState.tabColor === c"
                  (click)="dialogState.tabColor = c"
                  [title]="'#'+c">
                  @if (dialogState.tabColor === c) {
                    <svg viewBox="0 0 16 16" fill="white"><polyline points="2 8 6 12 14 4" stroke="white" stroke-width="2.5" fill="none"/></svg>
                  }
                </button>
              }
            </div>
          </section>

          <section class="eed-section">
            <div class="eed-section-header">
              <div class="eed-section-label">Columns <span class="eed-count">{{ selectedColCount() }} / {{ dialogState.columns.length }}</span></div>
              <div class="eed-section-actions">
                <button class="eed-link-btn" (click)="selectAllCols(true)">All</button>
                <button class="eed-link-btn" (click)="selectAllCols(false)">None</button>
                <button class="eed-link-btn" (click)="selectNonIdCols()">Hide IDs</button>
              </div>
            </div>

            <div class="eed-col-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" [(ngModel)]="colSearch" placeholder="Search columns…" />
            </div>

            <div class="eed-col-list">
              @for (col of filteredColumns(); track col.key) {
                <div class="eed-col-row" [class.selected]="col.selected" [class.id-col]="col.isId">
                  <label class="eed-col-check">
                    <input type="checkbox" [(ngModel)]="col.selected" />
                  </label>
                  <div class="eed-col-info">
                    <input class="eed-col-label-input" type="text" [(ngModel)]="col.customLabel"
                      [disabled]="!col.selected" placeholder="Label" />
                    <span class="eed-col-key">{{ col.key }}</span>
                  </div>
                  <span class="eed-col-type" [attr.data-type]="col.type">{{ col.type }}</span>
                  @if (col.isId) { <span class="eed-id-pill">ID</span> }
                </div>
              }
              @empty {
                <div class="eed-empty">No columns match "{{ colSearch }}"</div>
              }
            </div>
          </section>

          @if (dialogState.nestedSheets.length) {
            <section class="eed-section">
              <div class="eed-section-label">Reference Sheets</div>
              @for (ns of dialogState.nestedSheets; track ns.arrayKey) {
                <div class="eed-nested-card" [class.disabled]="!ns.include">
                  <div class="eed-nested-header">
                    <label class="eed-check">
                      <input type="checkbox" [(ngModel)]="ns.include" />
                      <span class="eed-nested-title">
                        <span class="eed-nested-dot" [style.background]="'#'+ns.tabColor"></span>
                        {{ ns.sheetName }}
                        <span class="eed-count">{{ ns.columns.length }} cols</span>
                      </span>
                    </label>
                  </div>
                  @if (ns.include) {
                    <div class="eed-nested-cols">
                      @for (nc of ns.columns; track nc.key) {
                        <label class="eed-nested-col-chip" [class.active]="nc.selected">
                          <input type="checkbox" [(ngModel)]="nc.selected" style="display:none" />
                          {{ nc.label }}
                        </label>
                      }
                    </div>
                  }
                </div>
              }
            </section>
          }

        </div>

        <div class="eed-footer">
          <div class="eed-footer-meta">
            {{ data.length | number }} rows &middot; {{ selectedColCount() }} columns
            @if (activeNestedCount() > 0) {
              &middot; {{ activeNestedCount() }} ref sheet{{ activeNestedCount()!==1?'s':'' }}
            }
          </div>
          <div class="eed-footer-actions">
            <button class="eed-btn-cancel" (click)="closeDialog()">Cancel</button>
            <button class="eed-btn-export"
              [disabled]="exporting() || selectedColCount() === 0"
              (click)="doExport()">
              @if (exporting()) {
                <svg class="eed-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                Exporting…
              } @else if (exportDone()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Downloaded!
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download .xlsx
              }
            </button>
          </div>
        </div>

      </div>
      </div>
    }
  </div>
</div>`,
  // (Keep the existing CSS styles exactly as you provided them)
  styles: [`/* Your existing styling stays entirely the same here */`] 
})
export class ExcelExportDialogComponent implements OnChanges, OnInit, OnDestroy {

  // FIX: Smart Input Setter to extract data from complex pagination JSON automatically
  private _data: Record<string, unknown>[] = [];
  
  @Input()
  set data(value: any) {
    if (!value) {
      this._data = [];
    } else if (Array.isArray(value)) {
      this._data = value;
    } else if (value.data && value.data.data && Array.isArray(value.data.data)) {
      this._data = value.data.data; // Handles the { status: 'success', data: { data: [...] } } format
    } else if (value.data && Array.isArray(value.data)) {
      this._data = value.data;      // Handles { data: [...] } format
    } else {
      // Fallback: finding the first array inside the object
      const foundArr = Object.values(value).find(v => Array.isArray(v));
      this._data = foundArr ? (foundArr as any) : [value];
    }
  }
  
  get data(): Record<string, unknown>[] {
    return this._data;
  }

  @ViewChild('portalTarget', { static: true }) portalTarget!: ElementRef<HTMLDivElement>;

  // ── Signals ──────────────────────────────────────────────────────────────
  readonly dialogOpen = signal(false);
  readonly exporting = signal(false);
  readonly exportDone = signal(false);

  readonly selectedColCount = computed(() =>
    this.dialogState.columns.filter(c => c.selected).length
  );
  readonly activeNestedCount = computed(() =>
    this.dialogState.nestedSheets.filter(n => n.include).length
  );

  // ── Dialog state ──────────────────────────────────────────────────────────
  dialogState = {
    fileName: 'export',
    sheetName: 'Data',
    sheetTitle: 'Data Export',
    company: '',
    showTimestamp: true,
    showTotals: true,
    freezeHeader: true,
    autoFilter: true,
    showIds: false,
    tabColor: '1D7A3B',
    columns: [] as DialogColumn[],
    nestedSheets: [] as DialogNestedSheet[],
  };

  colSearch = '';

  readonly tabColorPalette = [
    '1D7A3B', '155c2c', '0d4a22',  
    '1a56db', '1e429f', '1c3d5e',  
    'c45b1a', '9a3412', '7c2d12',  
    '8b5cf6', '6d28d9', '4c1d95',  
    'be185d', '9d174d', '831843',  
    '0891b2', '0e7490', '155e75',  
    '374151', '1f2937', '111827',  
  ];

  readonly filteredColumns = computed(() => {
    const q = this.colSearch.trim().toLowerCase();
    if (!q) return this.dialogState.columns;
    return this.dialogState.columns.filter(c =>
      c.key.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
    );
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (this.portalTarget) {
      document.body.appendChild(this.portalTarget.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.portalTarget) {
      this.portalTarget.nativeElement.remove();
    }
  }

  ngOnChanges(c: SimpleChanges): void {
    if (c['data'] && this.data?.length) this.buildDialogState();
  }

  private buildDialogState(): void {
    const inferred = inferSchema(this.data);

    this.dialogState.columns = inferred.columns.map(col => ({
      key: col.key,
      label: col.label,
      type: col.type ?? 'text',
      isId: col.isId ?? false,
      showTotal: col.showTotal ?? false,
      selected: !(col.isId ?? false),
      customLabel: col.label,
    }));

    this.dialogState.nestedSheets = inferred.nestedSheets.map((ns, i) => ({
      arrayKey: ns.key,
      sheetName: ns.label,
      tabColor: NESTED_COLORS[i % NESTED_COLORS.length],
      include: true,
      columns: ns.columns.map(c => ({
        key: c.key, label: c.label, type: c.type ?? 'text',
        isId: c.isId ?? false, showTotal: c.showTotal ?? false,
        selected: true, customLabel: c.label,
      })),
    }));
  }

  // ── Dialog controls ───────────────────────────────────────────────────────
  openDialog(): void { this.buildDialogState(); this.dialogOpen.set(true); }
  closeDialog(): void { this.dialogOpen.set(false); }

  selectAllCols(sel: boolean): void { this.dialogState.columns.forEach(c => c.selected = sel); }
  selectNonIdCols(): void { this.dialogState.columns.forEach(c => c.selected = !c.isId); }

  // ── Export ────────────────────────────────────────────────────────────────
  async doExport(): Promise<void> {
    if (this.exporting() || !this.data?.length) return;
    this.exporting.set(true);
    this.exportDone.set(false);

    try {
      const ds = this.dialogState;

      const visibleCols: ColumnConfig[] = ds.columns
        .filter(c => c.selected)
        .map(c => ({
          key: c.key, label: c.customLabel, type: c.type,
          isId: c.isId, showTotal: c.showTotal,
        }));

      if (!visibleCols.length) return;

      const idKey = ['id', '_id', 'uuid', 'code'].find(k => k in (this.data[0] ?? {})) ?? 'id';

      const nestedSheetConfigs: NestedSheetConfig[] = ds.nestedSheets
        .filter(ns => ns.include)
        .map(ns => ({
          arrayKey: ns.arrayKey,
          sheetName: ns.sheetName,
          parentRefKey: 'parentRef',
          tabColor: ns.tabColor,
          columns: [
            { key: 'parentRef', label: 'Ref #', type: 'text' as ColumnType, width: 16 },
            ...ns.columns.filter(c => c.selected).map(c => ({
              key: c.key, label: c.customLabel, type: c.type,
              isId: c.isId, showTotal: c.showTotal,
            })),
          ],
        }));

      const cfg = {
        fileName: ds.fileName || 'export',
        sheetName: ds.sheetName || 'Data',
        sheetTitle: ds.sheetTitle || 'Data Export',
        company: ds.company,
        showTimestamp: ds.showTimestamp,
        showTotals: ds.showTotals,
        freezeHeader: ds.freezeHeader,
        autoFilter: ds.autoFilter,
        showIds: ds.showIds,
        tabColor: ds.tabColor,
        alternateRowColor: 'EEF9F2',
        creator: 'ExcelExportDialog',
        nestedSheets: nestedSheetConfigs,
      };

      await this.writeWorkbook(visibleCols, cfg, idKey);

      this.exportDone.set(true);
      this.closeDialog();
      setTimeout(() => this.exportDone.set(false), 3000);
    } finally {
      this.exporting.set(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Workbook builder
  // ─────────────────────────────────────────────────────────────────────────

  private async writeWorkbook(
    visibleCols: ColumnConfig[],
    cfg: ExportWorkbookConfig,
    idKey: string
  ): Promise<void> {
    const wb = new ExcelJS.Workbook();
    wb.creator = cfg.creator; wb.created = new Date(); wb.modified = new Date();

    const childHeaderOffset = 1 + (cfg.showTimestamp ? 1 : 0) + (cfg.company ? 1 : 0) + 1 + 1;

    type NestExtract = { sheetCfg: NestedSheetConfig; rows: Record<string, unknown>[]; parentToFirst: Map<number, number> };
    const extracted: NestExtract[] = cfg.nestedSheets.map(sc => {
      const rows: Record<string, unknown>[] = [];
      const parentToFirst = new Map<number, number>();
      this.data.forEach((pRow, pi) => {
        const children = getByPath(pRow, sc.arrayKey);
        if (!Array.isArray(children) || !children.length) return;
        const first = childHeaderOffset + rows.length + 1;
        parentToFirst.set(pi, first);
        const ref = pRow[idKey] ?? pi + 1;
        children.forEach(child => {
          const cr: Record<string, unknown> = typeof child === 'object' && child !== null ? { ...(child as Record<string, unknown>) } : { value: child };
          cr[sc.parentRefKey ?? 'parentRef'] = ref;
          rows.push(cr);
        });
      });
      return { sheetCfg: sc, rows, parentToFirst };
    });

    let nestedLinks: Map<number, Array<{ sheetName: string; firstChildRow: number; label: string }>> | undefined;
    if (extracted.length) {
      nestedLinks = new Map();
      this.data.forEach((_r, idx) => {
        const targets: Array<{ sheetName: string; firstChildRow: number; label: string }> = [];
        extracted.forEach(({ sheetCfg, parentToFirst }) => {
          const fr = parentToFirst.get(idx);
          if (fr !== undefined) targets.push({ sheetName: sheetCfg.sheetName ?? sheetCfg.arrayKey, firstChildRow: fr, label: sheetCfg.sheetName ?? sheetCfg.arrayKey });
        });
        if (targets.length) nestedLinks!.set(idx, targets);
      });
    }

    const tc = 'FF' + cfg.tabColor.replace('#', '');
    this.buildSheet(wb, this.data, visibleCols, cfg.sheetName, cfg.sheetTitle, cfg, tc, nestedLinks);

    extracted.forEach(({ sheetCfg, rows }) => {
      if (!rows.length) return;
      const refKey = sheetCfg.parentRefKey ?? 'parentRef';
      const childCols = sheetCfg.columns.filter(c => !c.isId || cfg.showIds);
      const childTc = 'FF' + (sheetCfg.tabColor ?? '5B6EB5').replace('#', '');
      this.buildSheet(wb, rows, childCols, sheetCfg.sheetName ?? sheetCfg.arrayKey,
        sheetCfg.sheetName ?? sheetCfg.arrayKey, cfg, childTc);
    });

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${cfg.fileName}.xlsx`
    );
  }

  private buildSheet(
    wb: ExcelJS.Workbook,
    data: Record<string, unknown>[],
    cols: ColumnConfig[],
    sheetName: string,
    title: string,
    cfg: ExportWorkbookConfig,
    tc: string,
    nestedLinks?: Map<number, Array<{ sheetName: string; firstChildRow: number; label: string }>>
  ): void {
    const hasLinks = (nestedLinks?.size ?? 0) > 0;
    const linkCol: ColumnConfig = { key: '__nestedLink', label: 'Details ↗', width: 22, type: 'text' };
    const allCols = hasLinks ? [...cols, linkCol] : cols;

    const colWidths = allCols.map(c => c.width ?? autoWidth(c));

    const sheet = wb.addWorksheet(sheetName, {
      properties: { tabColor: { argb: tc } },
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: cfg.freezeHeader ? [{ state: 'frozen', ySplit: 1 + (cfg.showTimestamp ? 1 : 0) + (cfg.company ? 1 : 0) + 1 + 1 }] : [],
    });
    sheet.columns = allCols.map((c, i) => ({ key: c.key, width: colWidths[i] }));

    let row = 1;

    // Title
    const titleRow = sheet.addRow([title]);
    sheet.mergeCells(row, 1, row, allCols.length);
    const tc1 = titleRow.getCell(1);
    tc1.value = title; tc1.font = { name: 'Calibri', bold: true, size: 16, color: { argb: 'FF1F3864' } };
    tc1.alignment = { horizontal: 'center', vertical: 'middle' }; tc1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
    titleRow.height = 32; row++;

    if (cfg.showTimestamp) {
      const ts = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
      const r = sheet.addRow([`Generated: ${ts}`]);
      sheet.mergeCells(row, 1, row, allCols.length);
      const c = r.getCell(1); c.font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF888888' } }; c.alignment = { horizontal: 'right' };
      r.height = 14; row++;
    }
    if (cfg.company) {
      const r = sheet.addRow([cfg.company]);
      sheet.mergeCells(row, 1, row, allCols.length);
      const c = r.getCell(1); c.font = { name: 'Calibri', bold: true, size: 10, color: { argb: tc } }; c.alignment = { horizontal: 'right' };
      r.height = 14; row++;
    }
    sheet.addRow([]); row++;

    // Header
    const headerRow = sheet.addRow(allCols.map(c => c.label));
    const headerRowNum = row;
    allCols.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      const hex = (col.headerColor ? col.headerColor : tc.replace('FF', '')).replace('#', '');
      cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder();
    });
    headerRow.height = 24; row++;

    const dataStart = row;
    const altFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + cfg.alternateRowColor } };
    const whiteFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    data.forEach((item, idx) => {
      const flat = flattenObject(item);
      const values = cols.map(col => resolveCellValue(col, getByPath(flat, col.key), flat));
      if (hasLinks) values.push('');

      values.forEach((v, i) => {
        if (!allCols[i].width) {
          let strLen = 0;
          if (v instanceof Date) strLen = 14;
          else if (v !== null && v !== undefined) strLen = String(v).length;
          if (strLen + 3 > colWidths[i]) colWidths[i] = Math.min(strLen + 3, 75);
        }
      });

      const dr = sheet.addRow(values);
      cols.forEach((col, i) => {
        const cell = dr.getCell(i + 1); const type = col.type ?? 'text';
        if (type === 'currency') cell.numFmt = `"₹"#,##0.00`;
        else if (NUM_FMT[type]) cell.numFmt = NUM_FMT[type]!;
        cell.alignment = { horizontal: H_ALIGN[type] ?? 'left', vertical: 'middle', wrapText: false };
        cell.font = { name: 'Calibri', size: 10 };
        cell.fill = idx % 2 !== 0 ? altFill : whiteFill; cell.border = thinBorder('FFE8E8E8');
      });

      if (hasLinks) {
        const links = nestedLinks!.get(idx);
        const cell = dr.getCell(allCols.length);
        if (links?.length === 1) {
          cell.value = { text: `↗ ${links[0].label}`, hyperlink: `#'${links[0].sheetName}'!A${links[0].firstChildRow}` };
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0563C1' }, underline: true };
        } else if (links?.length) {
          cell.value = links.map(l => `↗ ${l.label}`).join('  |  ');
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0563C1' } };
        } else { cell.value = '—'; cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFBBBBBB' } }; }
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        const lc = allCols.length; const ac = allCols[lc - 1];
        if (ac) { const lCell = dr.getCell(lc); lCell.fill = idx % 2 !== 0 ? altFill : whiteFill; lCell.border = thinBorder('FFE8E8E8'); }
      }

      dr.height = 18; row++;
    });
    const dataEnd = row - 1;

    // FIX: Pre-calculate the result of the formula so totals appear perfectly in Excel
    if (cfg.showTotals && data.length) {
      const totValues = allCols.map((col, i) => {
        if (i === 0) return 'TOTAL';
        if (col.key === '__nestedLink') return null;
        const type = col.type ?? 'text';
        if (['number', 'currency', 'percent'].includes(type) && col.showTotal !== false) {
          
          let sum = 0;
          data.forEach(item => {
            const flat = flattenObject(item);
            const val = Number(getByPath(flat, col.key));
            if (!isNaN(val)) sum += val;
          });

          return { formula: `SUM(${colLetter(i + 1)}${dataStart}:${colLetter(i + 1)}${dataEnd})`, result: sum };
        }
        return null;
      });
      const tr = sheet.addRow(totValues);
      allCols.forEach((col, i) => {
        const cell = tr.getCell(i + 1); const type = col.type ?? 'text';
        cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF1F3864' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
        cell.border = accentTopBorder(tc);
        if (type === 'currency') cell.numFmt = `"₹"#,##0.00`;
        else if (NUM_FMT[type]) cell.numFmt = NUM_FMT[type]!;
        cell.alignment = { horizontal: H_ALIGN[type] ?? 'left', vertical: 'middle' };
      });
      tr.height = 22;
    }

    if (cfg.autoFilter && data.length) {
      sheet.autoFilter = { from: { row: headerRowNum, column: 1 }, to: { row: headerRowNum, column: allCols.length } };
    }

    allCols.forEach((_, i) => {
      sheet.getColumn(i + 1).width = colWidths[i];
    });
  }
}// // excel-export-dialog.component.ts
// // ─────────────────────────────────────────────────────────────────────────────
// //  Drop-in replacement for app-excel-export.
// //  Usage:  <app-excel-export-dialog [data]="anyJsonArray" />
// //  → click button → dialog opens → user configures → downloads xlsx
// // ─────────────────────────────────────────────────────────────────────────────

// import {
//   Component, Input, OnChanges, SimpleChanges,
//   signal, computed, ChangeDetectionStrategy,
//   ViewChild, ElementRef, OnInit, OnDestroy
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import * as ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// // ─────────────────────────────────────────────────────────────────────────────
// //  Re-export types (keep existing type contracts)
// // ─────────────────────────────────────────────────────────────────────────────

// export type ColumnType =
//   | 'text' | 'number' | 'currency' | 'percent'
//   | 'date' | 'boolean' | 'email' | 'phone';

// export interface ColumnConfig {
//   key: string;
//   label: string;
//   visible?: boolean;
//   isId?: boolean;
//   width?: number;
//   type?: ColumnType;
//   currencySymbol?: string;
//   showTotal?: boolean;
//   headerColor?: string;
//   formatter?: (value: unknown, row: Record<string, unknown>) => string | number | Date | boolean;
// }

// export interface NestedSheetConfig {
//   arrayKey: string;
//   sheetName?: string;
//   columns: ColumnConfig[];
//   parentRefKey?: string;
//   tabColor?: string;
// }

// export interface ExcelExportConfig {
//   fileName?: string;
//   sheetTitle?: string;
//   sheetName?: string;
//   company?: string;
//   showTimestamp?: boolean;
//   showTotals?: boolean;
//   hiddenKeys?: string[];
//   showIds?: boolean;
//   freezeHeader?: boolean;
//   autoFilter?: boolean;
//   tabColor?: string;
//   alternateRowColor?: string;
//   creator?: string;
//   nestedObjectStrategy?: 'flatten' | 'ignore';
//   nestedSheets?: NestedSheetConfig[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  Dialog-specific: column selection state used in the UI
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DialogColumn {
//   key: string;
//   label: string;
//   type: ColumnType;
//   isId: boolean;
//   showTotal: boolean;
//   selected: boolean;   // user ticked this column
//   customLabel: string; // user-editable label
// }

// export interface DialogNestedSheet {
//   arrayKey: string;
//   sheetName: string;
//   tabColor: string;
//   include: boolean;
//   columns: DialogColumn[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  Schema Inference (self-contained copy — no external import needed)
// // ─────────────────────────────────────────────────────────────────────────────

// const DEFAULT_SKIP_KEYS = new Set([
//   '__v', '__t',
//   'avatar', 'profilePic', 'profileImage', 'photo',
//   'password', 'passwordHash', 'passwordChangedAt', 'refreshToken', 'token',
//   'updatedBy',
// ]);
// const ID_SUFFIXES = ['Id', '_id', 'ID', 'Uuid', 'uuid'];
// const DISPLAY_KEYS = ['name', 'title', 'label', 'code', 'no', 'number'];
// const NESTED_COLORS = ['5B6EB5', 'C45B1A', '8B5CF6', 'D97706', '0891B2', 'BE185D'];

// const CURRENCY_HINTS = ['amount', 'total', 'price', 'rate', 'salary', 'balance', 'cost', 'fee', 'tax', 'gst', 'cgst', 'sgst', 'igst', 'discount', 'charges', 'revenue', 'profit', 'loss', 'debit', 'credit', 'payment'];
// const DATE_HINTS = ['date', 'at', 'on', 'time', 'created', 'updated', 'joined', 'birth', 'expiry', 'expire', 'start', 'end', 'due', 'paid', 'active'];
// const BOOL_HINTS = ['is', 'has', 'can', 'allow', 'enable', 'enforce', 'verified', 'blocked', 'active'];
// const EMAIL_HINTS = ['email', 'mail'];
// const PHONE_HINTS = ['phone', 'mobile', 'contact', 'whatsapp', 'fax'];
// const PERCENT_HINTS = ['percent', 'rate', 'ratio', 'gst', 'tax', 'discount'];
// const NUMBER_HINTS = ['count', 'qty', 'quantity', 'number', 'num', 'max', 'min', 'limit', 'sessions', 'radius', 'page', 'pages'];

// function toLabel(key: string): string {
//   return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_.\-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
// }
// function isIdKey(key: string): boolean {
//   return ID_SUFFIXES.some(s => key === s || key.endsWith(s) || key === '_id');
// }
// function inferType(key: string, samples: unknown[]): ColumnType {
//   const low = key.toLowerCase();
//   if (EMAIL_HINTS.some(h => low.includes(h))) return 'email';
//   if (PHONE_HINTS.some(h => low.includes(h))) return 'phone';
//   const ne = samples.filter(s => s !== null && s !== undefined && s !== '');
//   if (!ne.length) return 'text';
//   if (ne.every(s => typeof s === 'boolean')) return 'boolean';
//   if (BOOL_HINTS.some(h => low.startsWith(h))) return 'boolean';
//   if (ne.every(s => typeof s === 'number')) {
//     if (PERCENT_HINTS.some(h => low.endsWith(h) || low === h)) return 'percent';
//     if (CURRENCY_HINTS.some(h => low.includes(h))) return 'currency';
//     return 'number';
//   }
//   if (ne.every(s => typeof s === 'string') && DATE_HINTS.some(h => low.includes(h))) {
//     if (/^\d{4}-\d{2}-\d{2}/.test(String(ne[0]))) return 'date';
//   }
//   return 'text';
// }

// interface FieldMeta { path: string; label: string; type: ColumnType; isId: boolean; sample: unknown[]; }
// interface ArrayMeta { key: string; label: string; childFields: FieldMeta[]; }

// function walkRow(
//   obj: Record<string, unknown>, prefix: string,
//   flat: Map<string, FieldMeta>, arrays: Map<string, ArrayMeta>,
//   threshold = 3
// ): void {
//   for (const [key, val] of Object.entries(obj)) {
//     if (DEFAULT_SKIP_KEYS.has(key)) continue;
//     const path = prefix ? `${prefix}.${key}` : key;
//     const label = toLabel(key);

//     if (val === null || val === undefined) {
//       if (!flat.has(path)) flat.set(path, { path, label, type: 'text', isId: isIdKey(key), sample: [] });
//       continue;
//     }

//     if (typeof val !== 'object') {
//       const ex = flat.get(path);
//       if (ex) { if (val !== '') { ex.sample.push(val); if (ex.sample.length > 5) ex.sample.shift(); } }
//       else flat.set(path, { path, label, type: 'text', isId: isIdKey(key), sample: val !== '' ? [val] : [] });
//       continue;
//     }

//     if (Array.isArray(val)) {
//       const hasObject = val.some(v => v !== null && typeof v === 'object');

//       if (!hasObject) {
//         if (!arrays.has(path)) {
//           const joined = val.filter(v => v !== null && v !== undefined).join(', ');
//           const ex = flat.get(path);
//           if (ex) { if (joined !== '') { ex.sample.push(joined); if (ex.sample.length > 5) ex.sample.shift(); } }
//           else flat.set(path, { path, label, type: 'text', isId: false, sample: joined !== '' ? [joined] : [] });
//         }
//       } else {
//         if (flat.has(path)) flat.delete(path);

//         const cf = new Map<string, FieldMeta>();
//         const da = new Map<string, ArrayMeta>();

//         if (arrays.has(path)) {
//           arrays.get(path)!.childFields.forEach(f => cf.set(f.path, { ...f, sample: [...f.sample] }));
//         }

//         val.forEach(item => {
//           if (item && typeof item === 'object') {
//             walkRow(item as Record<string, unknown>, '', cf, da, threshold);
//           }
//         });

//         const childFields = Array.from(cf.values()).map(f => ({ ...f, type: inferType(f.path.split('.').pop() ?? f.path, f.sample) }));
//         arrays.set(path, { key: path, label, childFields });
//       }
//       continue;
//     }

//     walkRow(val as Record<string, unknown>, path, flat, arrays, threshold);
//   }
// }

// export function inferSchema(data: Record<string, unknown>[], sampleSize = 20, threshold = 3): {
//   columns: ColumnConfig[];
//   nestedSheets: Array<{ key: string; label: string; columns: ColumnConfig[] }>;
// } {
//   const flat = new Map<string, FieldMeta>();
//   const arrays = new Map<string, ArrayMeta>();
//   data.slice(0, sampleSize).forEach(row => walkRow(row, '', flat, arrays, threshold));

//   const columns: ColumnConfig[] = Array.from(flat.values()).map(f => {
//     const type = inferType(f.path.split('.').pop() ?? f.path, f.sample);
//     return {
//       key: f.path, label: f.label, type, isId: f.isId,
//       showTotal: ['currency', 'number'].includes(type)
//     };
//   });

//   const nestedSheets = Array.from(arrays.values()).map(a => ({
//     key: a.key, label: a.label,
//     columns: a.childFields.map(f => ({
//       key: f.path, label: f.label, type: f.type, isId: f.isId,
//       showTotal: ['currency', 'number'].includes(f.type)
//     })),
//   }));

//   return { columns, nestedSheets };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  Excel writer utilities (same as existing component)
// // ─────────────────────────────────────────────────────────────────────────────

// function flattenObject(obj: Record<string, unknown>, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
//   for (const [k, v] of Object.entries(obj)) {
//     const path = prefix ? `${prefix}.${k}` : k;
//     if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date))
//       flattenObject(v as Record<string, unknown>, path, out);
//     else out[path] = v;
//   }
//   return out;
// }
// function getByPath(obj: Record<string, unknown>, path: string): unknown {
//   return path.split('.').reduce<unknown>((cur, key) => {
//     if (cur != null && typeof cur === 'object' && !Array.isArray(cur)) return (cur as Record<string, unknown>)[key];
//     return undefined;
//   }, obj);
// }
// function colLetter(n: number): string {
//   let r = ''; while (n > 0) { const rem = (n - 1) % 26; r = String.fromCharCode(65 + rem) + r; n = Math.floor((n - 1) / 26); } return r;
// }
// function thinBorder(c = 'FFD8D8D8'): Partial<ExcelJS.Borders> {
//   const s: ExcelJS.BorderStyle = 'thin'; const col: Partial<ExcelJS.Color> = { argb: c };
//   return { top: { style: s, color: col }, bottom: { style: s, color: col }, left: { style: s, color: col }, right: { style: s, color: col } };
// }
// function accentTopBorder(argb: string): Partial<ExcelJS.Borders> {
//   return {
//     top: { style: 'medium', color: { argb } }, bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
//     left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
//   };
// }
// const NUM_FMT: Partial<Record<ColumnType, string>> = { number: '#,##0.##', percent: '0.00%', date: 'DD-MMM-YYYY' };
// const H_ALIGN: Partial<Record<ColumnType, ExcelJS.Alignment['horizontal']>> = {
//   number: 'right', currency: 'right', percent: 'right', date: 'center', boolean: 'center', email: 'left', phone: 'left', text: 'left'
// };
// function autoWidth(col: ColumnConfig): number {
//   const b = col.label.length;
//   switch (col.type) {
//     case 'currency': case 'number': return Math.max(b + 2, 16); case 'date': return Math.max(b + 2, 14);
//     case 'email': return Math.max(b + 4, 26); case 'phone': return Math.max(b + 2, 14); case 'boolean': return Math.max(b + 2, 10);
//     default: return Math.max(b + 4, 18);
//   }
// }
// function resolveCellValue(col: ColumnConfig, raw: unknown, row: Record<string, unknown>): unknown {
//   if (col.formatter) return col.formatter(raw, row);
//   if (raw === null || raw === undefined) return '';
//   switch (col.type) {
//     case 'boolean': return (raw as boolean) ? 'Yes' : 'No';
//     case 'date': { if (raw instanceof Date) return raw; const d = new Date(raw as string | number); return isNaN(d.getTime()) ? String(raw) : d; }
//     default: return Array.isArray(raw) ? raw.join(', ') : raw;
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  Component
// // ─────────────────────────────────────────────────────────────────────────────

// export interface ExportWorkbookConfig {
//   fileName: string;
//   sheetName: string;
//   sheetTitle: string;
//   company: string;
//   showTimestamp: boolean;
//   showTotals: boolean;
//   freezeHeader: boolean;
//   autoFilter: boolean;
//   showIds: boolean;
//   tabColor: string;
//   alternateRowColor: string;
//   creator: string;
//   nestedSheets: NestedSheetConfig[];
// }

// @Component({
//   selector: 'app-excel-export-dialog',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
// <div class="eed-host">

//   <!-- ── Trigger Button ─────────────────────────────────────────────── -->
//   <button class="eed-trigger"
//     [disabled]="!data.length"
//     [title]="data.length ? 'Configure & export to Excel' : 'No data'"
//     (click)="openDialog()">
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
//       <polyline points="14 2 14 8 20 8"/>
//       <line x1="12" y1="11" x2="12" y2="17"/>
//       <polyline points="9 14 12 17 15 14"/>
//     </svg>
//     Export Excel
//     @if (data.length) {
//       <span class="eed-badge">{{ data.length | number }}</span>
//     }
//   </button>

//   <!-- ── Dialog Overlay ──────────────────────────────────────────────── -->
//   <div #portalTarget style="display: contents;">
//     @if (dialogOpen()) {
//       <div class="eed-overlay" (click)="closeDialog()">
//       <div class="eed-panel" (click)="$event.stopPropagation()">

//         <!-- Header -->
//         <div class="eed-panel-header">
//           <div class="eed-panel-title">
//             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//               <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
//             </svg>
//             Configure Excel Export
//           </div>
//           <button class="eed-close" (click)="closeDialog()">
//             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
//               <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
//             </svg>
//           </button>
//         </div>

//         <!-- Body -->
//         <div class="eed-body">

//           <!-- ── Section: File Info ───────────────────────────────── -->
//           <section class="eed-section">
//             <div class="eed-section-label">File & Sheet</div>
//             <div class="eed-grid-2">
//               <div class="eed-field">
//                 <label>File Name</label>
//                 <div class="eed-input-wrap">
//                   <input type="text" [(ngModel)]="dialogState.fileName" placeholder="export" />
//                   <span class="eed-suffix">.xlsx</span>
//                 </div>
//               </div>
//               <div class="eed-field">
//                 <label>Sheet Name</label>
//                 <input type="text" [(ngModel)]="dialogState.sheetName" placeholder="Data" />
//               </div>
//               <div class="eed-field">
//                 <label>Report Title</label>
//                 <input type="text" [(ngModel)]="dialogState.sheetTitle" placeholder="Data Export" />
//               </div>
//               <div class="eed-field">
//                 <label>Company / Sub-title</label>
//                 <input type="text" [(ngModel)]="dialogState.company" placeholder="Optional" />
//               </div>
//             </div>
//           </section>

//           <!-- ── Section: Options ────────────────────────────────── -->
//           <section class="eed-section">
//             <div class="eed-section-label">Options</div>
//             <div class="eed-checkbox-row">
//               <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.showTimestamp" /><span>Timestamp</span></label>
//               <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.showTotals" /><span>Totals row</span></label>
//               <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.freezeHeader" /><span>Freeze header</span></label>
//               <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.autoFilter" /><span>Auto-filter</span></label>
//               <label class="eed-check"><input type="checkbox" [(ngModel)]="dialogState.showIds" /><span>Show ID cols</span></label>
//             </div>
//           </section>

//           <!-- ── Section: Tab Colour ─────────────────────────────── -->
//           <section class="eed-section">
//             <div class="eed-section-label">Tab Colour</div>
//             <div class="eed-color-row">
//               @for (c of tabColorPalette; track c) {
//                 <button class="eed-color-swatch"
//                   [style.background]="'#'+c"
//                   [class.active]="dialogState.tabColor === c"
//                   (click)="dialogState.tabColor = c"
//                   [title]="'#'+c">
//                   @if (dialogState.tabColor === c) {
//                     <svg viewBox="0 0 16 16" fill="white"><polyline points="2 8 6 12 14 4" stroke="white" stroke-width="2.5" fill="none"/></svg>
//                   }
//                 </button>
//               }
//             </div>
//           </section>

//           <!-- ── Section: Columns ────────────────────────────────── -->
//           <section class="eed-section">
//             <div class="eed-section-header">
//               <div class="eed-section-label">Columns <span class="eed-count">{{ selectedColCount() }} / {{ dialogState.columns.length }}</span></div>
//               <div class="eed-section-actions">
//                 <button class="eed-link-btn" (click)="selectAllCols(true)">All</button>
//                 <button class="eed-link-btn" (click)="selectAllCols(false)">None</button>
//                 <button class="eed-link-btn" (click)="selectNonIdCols()">Hide IDs</button>
//               </div>
//             </div>

//             <div class="eed-col-search">
//               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                 <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
//               </svg>
//               <input type="text" [(ngModel)]="colSearch" placeholder="Search columns…" />
//             </div>

//             <div class="eed-col-list">
//               @for (col of filteredColumns(); track col.key) {
//                 <div class="eed-col-row" [class.selected]="col.selected" [class.id-col]="col.isId">
//                   <label class="eed-col-check">
//                     <input type="checkbox" [(ngModel)]="col.selected" />
//                   </label>
//                   <div class="eed-col-info">
//                     <input class="eed-col-label-input" type="text" [(ngModel)]="col.customLabel"
//                       [disabled]="!col.selected" placeholder="Label" />
//                     <span class="eed-col-key">{{ col.key }}</span>
//                   </div>
//                   <span class="eed-col-type" [attr.data-type]="col.type">{{ col.type }}</span>
//                   @if (col.isId) { <span class="eed-id-pill">ID</span> }
//                 </div>
//               }
//               @empty {
//                 <div class="eed-empty">No columns match "{{ colSearch }}"</div>
//               }
//             </div>
//           </section>

//           <!-- ── Section: Nested Sheets ──────────────────────────── -->
//           @if (dialogState.nestedSheets.length) {
//             <section class="eed-section">
//               <div class="eed-section-label">Reference Sheets</div>
//               @for (ns of dialogState.nestedSheets; track ns.arrayKey) {
//                 <div class="eed-nested-card" [class.disabled]="!ns.include">
//                   <div class="eed-nested-header">
//                     <label class="eed-check">
//                       <input type="checkbox" [(ngModel)]="ns.include" />
//                       <span class="eed-nested-title">
//                         <span class="eed-nested-dot" [style.background]="'#'+ns.tabColor"></span>
//                         {{ ns.sheetName }}
//                         <span class="eed-count">{{ ns.columns.length }} cols</span>
//                       </span>
//                     </label>
//                   </div>
//                   @if (ns.include) {
//                     <div class="eed-nested-cols">
//                       @for (nc of ns.columns; track nc.key) {
//                         <label class="eed-nested-col-chip" [class.active]="nc.selected">
//                           <input type="checkbox" [(ngModel)]="nc.selected" style="display:none" />
//                           {{ nc.label }}
//                         </label>
//                       }
//                     </div>
//                   }
//                 </div>
//               }
//             </section>
//           }

//         </div><!-- /body -->

//         <!-- Footer -->
//         <div class="eed-footer">
//           <div class="eed-footer-meta">
//             {{ data.length | number }} rows &middot; {{ selectedColCount() }} columns
//             @if (activeNestedCount() > 0) {
//               &middot; {{ activeNestedCount() }} ref sheet{{ activeNestedCount()!==1?'s':'' }}
//             }
//           </div>
//           <div class="eed-footer-actions">
//             <button class="eed-btn-cancel" (click)="closeDialog()">Cancel</button>
//             <button class="eed-btn-export"
//               [disabled]="exporting() || selectedColCount() === 0"
//               (click)="doExport()">
//               @if (exporting()) {
//                 <svg class="eed-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                   <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
//                   <path d="M12 2a10 10 0 0 1 10 10"/>
//                 </svg>
//                 Exporting…
//               } @else if (exportDone()) {
//                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
//                   <polyline points="20 6 9 17 4 12"/>
//                 </svg>
//                 Downloaded!
//               } @else {
//                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                   <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
//                   <polyline points="7 10 12 15 17 10"/>
//                   <line x1="12" y1="15" x2="12" y2="3"/>
//                 </svg>
//                 Download .xlsx
//               }
//             </button>
//           </div>
//         </div>

//       </div><!-- /panel -->
//       </div><!-- /overlay -->
//     }
//   </div>

// </div>
//   `,
//   styles: [`
// :host { display: inline-block; }

// /* ── Trigger ──────────────────────────────────────────────────────────── */
// .eed-trigger {
//   all: unset; cursor: pointer; box-sizing: border-box;
//   display: inline-flex; align-items: center; gap: 8px;
//   padding: 8px 16px 8px 12px; border-radius: 8px;
//   border: 1.5px solid var(--color-success-dark, #155c2c); background: var(--color-success, #1d7a3b); color: #fff;
//   font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13.5px;
//   font-weight: 600; white-space: nowrap; user-select: none;
//   box-shadow: 0 2px 6px rgba(21,92,44,.25);
//   transition: background 180ms, transform 180ms, box-shadow 180ms;
//   svg { width:18px; height:18px; display:block; flex-shrink:0; }
//   &:hover:not(:disabled) { background:var(--color-success-dark, #155c2c); transform:translateY(-1px); box-shadow:0 4px 12px rgba(21,92,44,.35); }
//   &:disabled { opacity:.5; cursor:not-allowed; }
// }
// .eed-badge {
//   display:inline-flex; align-items:center; justify-content:center;
//   min-width:22px; height:18px; padding:0 5px; border-radius:9px;
//   background:rgba(255,255,255,.22); border:1px solid rgba(255,255,255,.30);
//   font-size:11px; font-weight:700;
// }

// /* ── Overlay ──────────────────────────────────────────────────────────── */
// .eed-overlay {
//   position: fixed; inset: 0; z-index: 9999;
//   background: var(--glass-bg-c, rgba(10,14,20,.55)); backdrop-filter: var(--glass-blur-c, blur(3px));
//   display: flex; align-items: center; justify-content: center;
//   padding: 16px;
//   animation: fadeIn .15s ease;
// }
// @keyframes fadeIn { from{opacity:0} to{opacity:1} }

// /* ── Panel ────────────────────────────────────────────────────────────── */
// .eed-panel {
//   width: 100%; max-width: 680px; max-height: calc(100vh - 32px);
//   background: var(--component-surface-raised, #fff); border-radius: 14px; overflow: hidden;
//   display: flex; flex-direction: column;
//   box-shadow: var(--glass-shadow-c, 0 24px 64px rgba(0,0,0,.25)); border: 1px solid var(--glass-border-c, transparent);
//   animation: slideUp .2s cubic-bezier(.4,0,.2,1);
// }
// @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:none;opacity:1} }

// .eed-panel-header {
//   display: flex; align-items: center; justify-content: space-between;
//   padding: 16px 20px; border-bottom: 1px solid var(--border-secondary, #e8ecef);
//   background: var(--bg-secondary, linear-gradient(135deg, #f0f9f4 0%, #e8f5ee 100%));
//   flex-shrink: 0;
// }
// .eed-panel-title {
//   display: flex; align-items: center; gap: 9px;
//   font-family: 'Segoe UI', system-ui, sans-serif; font-size: 15px; font-weight: 700;
//   color: var(--text-primary, #1a2e22);
//   svg { width:20px; height:20px; stroke:var(--color-success, #1d7a3b); }
// }
// .eed-close {
//   all: unset; cursor: pointer; display: flex; align-items: center; justify-content: center;
//   width: 30px; height: 30px; border-radius: 8px; color: var(--text-secondary, #6c757d);
//   transition: background .15s, color .15s;
//   svg { width:16px; height:16px; }
//   &:hover { background: var(--color-error-bg, #fee2e2); color: var(--color-error, #dc2626); }
// }

// /* ── Body ─────────────────────────────────────────────────────────────── */
// .eed-body { overflow-y: auto; flex: 1; padding: 0 20px 8px; }

// /* ── Sections ─────────────────────────────────────────────────────────── */
// .eed-section { padding: 16px 0; border-bottom: 1px solid var(--border-secondary, #f0f0f0); }
// .eed-section:last-child { border-bottom: none; }

// .eed-section-label {
//   font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11px; font-weight: 700;
//   text-transform: uppercase; letter-spacing: .07em; color: var(--color-success, #1d7a3b);
//   margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
// }
// .eed-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
// .eed-section-actions { display: flex; gap: 6px; }

// .eed-count { font-size: 11px; font-weight: 600; color: var(--text-tertiary, #888); background: var(--bg-ternary, #f0f0f0); padding: 1px 6px; border-radius: 10px; }

// /* ── Grid / Fields ────────────────────────────────────────────────────── */
// .eed-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
// .eed-field { display: flex; flex-direction: column; gap: 4px;
//   label { font-family:'Segoe UI',sans-serif; font-size:11.5px; font-weight:600; color:var(--text-secondary, #555); }
// }
// .eed-input-wrap { display: flex; align-items: stretch; }
// .eed-suffix {
//   display: flex; align-items: center; padding: 0 10px;
//   background: var(--bg-secondary, #f4f4f4); border: 1px solid var(--border-primary, #d0d5dd); border-left: none;
//   border-radius: 0 6px 6px 0; font-size: 12px; color: var(--text-secondary, #777);
// }
// .eed-input-wrap input { border-radius: 6px 0 0 6px !important; }

// input[type=text] {
//   font-family: 'Segoe UI', sans-serif; font-size: 13px; color: var(--text-primary, #222);
//   padding: 7px 10px; border: 1px solid var(--border-primary, #d0d5dd); border-radius: 6px;
//   background: var(--bg-primary, transparent); outline: none; width: 100%; box-sizing: border-box; transition: border .15s, box-shadow .15s;
//   &:focus { border-color: var(--color-success, #1d7a3b); box-shadow: 0 0 0 3px var(--color-success-bg, rgba(29,122,59,.12)); }
//   &:disabled { background: var(--bg-ternary, #f8f8f8); color: var(--text-tertiary, #aaa); cursor: default; }
// }

// /* ── Checkboxes ──────────────────────────────────────────────────────── */
// .eed-checkbox-row { display: flex; flex-wrap: wrap; gap: 8px; }
// .eed-check {
//   display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
//   font-family: 'Segoe UI', sans-serif; font-size: 13px; color: var(--text-primary, #333);
//   padding: 5px 10px; border-radius: 6px; border: 1px solid var(--border-secondary, #e0e0e0);
//   background: var(--bg-secondary, #fafafa); transition: border .15s, background .15s;
//   user-select: none;
//   input[type=checkbox] { accent-color: var(--color-success, #1d7a3b); width:14px; height:14px; cursor:pointer; }
//   &:has(input:checked) { background: var(--color-success-bg, #f0f9f4); border-color: var(--color-success, #1d7a3b); color: var(--color-success-dark, #155c2c); }
// }

// /* ── Color swatches ──────────────────────────────────────────────────── */
// .eed-color-row { display: flex; flex-wrap: wrap; gap: 8px; }
// .eed-color-swatch {
//   all: unset; cursor: pointer; width: 30px; height: 30px; border-radius: 8px;
//   display: flex; align-items: center; justify-content: center;
//   box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,.2)); transition: transform .15s, box-shadow .15s;
//   svg { width:16px; height:16px; }
//   &:hover { transform: scale(1.12); box-shadow: 0 3px 8px var(--shadow-color-lg, rgba(0,0,0,.3)); }
//   &.active { outline: 2.5px solid var(--text-primary, #333); outline-offset: 2px; }
// }

// /* ── Column search ───────────────────────────────────────────────────── */
// .eed-col-search {
//   display: flex; align-items: center; gap: 8px;
//   padding: 7px 10px; border: 1px solid var(--border-primary, #d0d5dd); border-radius: 7px;
//   margin-bottom: 8px; background: var(--bg-primary, #fff);
//   svg { width:15px; height:15px; flex-shrink:0; stroke:var(--text-tertiary, #999); }
//   input { all: unset; flex:1; font-family:'Segoe UI',sans-serif; font-size:13px; color:var(--text-primary, #333);
//     &::placeholder { color:var(--text-tertiary, #bbb); } }
// }

// /* ── Column list ─────────────────────────────────────────────────────── */
// .eed-col-list {
//   max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;
//   border: 1px solid var(--border-secondary, #eee); border-radius: 8px; padding: 4px;
//   &::-webkit-scrollbar { width: 5px; }
//   &::-webkit-scrollbar-track { background: var(--scroll-track, #f5f5f5); }
//   &::-webkit-scrollbar-thumb { background: var(--scroll-thumb, #ccc); border-radius: 4px; }
// }
// .eed-col-row {
//   display: flex; align-items: center; gap: 8px;
//   padding: 6px 8px; border-radius: 6px; transition: background .12s;
//   &:hover { background: var(--component-bg-hover, #f8f8f8); }
//   &.selected { background: var(--color-success-bg, #f0f9f4); }
//   &.id-col { opacity: .75; }
// }
// .eed-col-check input { accent-color: var(--color-success, #1d7a3b); width:15px; height:15px; cursor:pointer; flex-shrink:0; }
// .eed-col-info { flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
// .eed-col-label-input {
//   font-family:'Segoe UI',sans-serif; font-size:13px; font-weight:600; color:var(--text-primary, #222);
//   border:none; outline:none; padding:2px 4px; border-radius:4px; width:100%; box-sizing:border-box;
//   background:transparent; transition:background .12s;
//   &:focus { background:var(--bg-primary, #fff); box-shadow:0 0 0 2px var(--color-success-bg, rgba(29,122,59,.2)); }
//   &:disabled { color:var(--text-tertiary, #aaa); }
// }
// .eed-col-key { font-family:'Consolas','Courier New',monospace; font-size:10.5px; color:var(--text-tertiary, #999); padding:0 4px; }
// .eed-col-type {
//   font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em;
//   padding:2px 7px; border-radius:4px; flex-shrink:0;
//   &[data-type=text]     { background:var(--bg-ternary, #f0f0f0); color:var(--text-secondary, #666); }
//   &[data-type=number]   { background:var(--color-info-bg, #e0f0ff); color:var(--color-info, #1a5faa); }
//   &[data-type=currency] { background:color-mix(in srgb, var(--color-warning) 10%, transparent); color:var(--color-warning, #a36b00); }
//   &[data-type=percent]  { background:var(--color-error-bg, #fce7f3); color:var(--color-error, #9d174d); }
//   &[data-type=date]     { background:var(--color-success-bg, #ecfdf5); color:var(--color-success, #065f46); }
//   &[data-type=boolean]  { background:#f3e8ff; color:#6b21a8; }
//   &[data-type=email]    { background:#fff7ed; color:#c2410c; }
//   &[data-type=phone]    { background:var(--color-success-bg, #f0fdf4); color:var(--color-success, #166534); }
// }
// .eed-id-pill {
//   font-size:9.5px; font-weight:700; text-transform:uppercase; padding:1px 5px;
//   border-radius:3px; background:var(--color-warning-bg, #fff3cd); color:var(--color-warning-dark, #856404); border:1px solid var(--color-warning-border, #ffc107); flex-shrink:0;
// }
// .eed-empty { text-align:center; color:var(--text-tertiary, #aaa); font-size:13px; padding:20px; }

// /* ── Nested sheets ───────────────────────────────────────────────────── */
// .eed-nested-card {
//   border: 1px solid var(--border-secondary, #e5e7eb); border-radius: 8px; margin-bottom: 8px;
//   overflow: hidden; transition: opacity .15s;
//   &.disabled { opacity: .6; }
// }
// .eed-nested-header { padding: 10px 12px; background: var(--bg-secondary, #fafafa); }
// .eed-nested-title {
//   display: flex; align-items: center; gap: 7px;
//   font-family:'Segoe UI',sans-serif; font-size:13px; font-weight:600; color:var(--text-primary, #222);
// }
// .eed-nested-dot { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
// .eed-nested-cols {
//   padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 5px;
//   border-top: 1px solid var(--border-secondary, #eee);
// }
// .eed-nested-col-chip {
//   cursor: pointer; font-family:'Segoe UI',sans-serif; font-size:11.5px;
//   padding: 3px 9px; border-radius: 12px; border: 1px solid var(--border-secondary, #e0e0e0);
//   background: var(--bg-ternary, #f5f5f5); color: var(--text-secondary, #666); transition: all .12s; user-select: none;
//   &.active { background: var(--color-success, #1d7a3b); border-color: var(--color-success, #1d7a3b); color: #fff; }
// }

// /* ── Link btn ────────────────────────────────────────────────────────── */
// .eed-link-btn {
//   all: unset; cursor: pointer; font-family:'Segoe UI',sans-serif; font-size:12px;
//   color:var(--color-success, #1d7a3b); font-weight:600; padding:3px 7px; border-radius:5px;
//   transition: background .12s;
//   &:hover { background: var(--color-success-bg, #f0f9f4); }
// }

// /* ── Footer ──────────────────────────────────────────────────────────── */
// .eed-footer {
//   display: flex; align-items: center; justify-content: space-between;
//   padding: 14px 20px; border-top: 1px solid var(--border-secondary, #e8ecef);
//   background: var(--bg-secondary, #fafafa); flex-shrink: 0;
// }
// .eed-footer-meta { font-family:'Segoe UI',sans-serif; font-size:12px; color:var(--text-tertiary, #888); }
// .eed-footer-actions { display: flex; gap: 8px; }

// .eed-btn-cancel {
//   all: unset; cursor: pointer; font-family:'Segoe UI',sans-serif; font-size:13px;
//   font-weight:600; padding:8px 16px; border-radius:8px; color:var(--text-secondary, #555);
//   border: 1.5px solid var(--border-primary, #d0d5dd); background:var(--component-surface-raised, #fff); transition:all .15s;
//   &:hover { background: var(--component-bg-hover, #f5f5f5); border-color: var(--border-secondary, #bbb); }
// }
// .eed-btn-export {
//   all: unset; cursor: pointer; box-sizing: border-box;
//   display: inline-flex; align-items: center; gap: 7px;
//   font-family:'Segoe UI',sans-serif; font-size:13.5px; font-weight:700;
//   padding: 9px 20px; border-radius: 8px;
//   background: var(--color-success, #1d7a3b); color: #fff; border: 1.5px solid var(--color-success-dark, #155c2c);
//   box-shadow: 0 2px 6px rgba(21,92,44,.25); transition: all .15s;
//   svg { width:17px; height:17px; flex-shrink:0; }
//   .eed-spin { animation: eedSpin .75s linear infinite; }
//   &:hover:not(:disabled) { background:var(--color-success-dark, #155c2c); box-shadow:0 4px 12px rgba(21,92,44,.35); transform:translateY(-1px); }
//   &:disabled { opacity:.55; cursor:not-allowed; transform:none; }
// }
// @keyframes eedSpin { to { transform: rotate(360deg); } }

// /* ── Responsive ───────────────────────────────────────────────────────── */
// @media (max-width: 520px) {
//   .eed-grid-2 { grid-template-columns: 1fr; }
//   .eed-panel { max-height: 95vh; }
// }
//   `],
// })
// export class ExcelExportDialogComponent implements OnChanges, OnInit, OnDestroy {

//   @Input() data: Record<string, unknown>[] = [];

//   @ViewChild('portalTarget', { static: true }) portalTarget!: ElementRef<HTMLDivElement>;

//   // ── Signals ──────────────────────────────────────────────────────────────
//   readonly dialogOpen = signal(false);
//   readonly exporting = signal(false);
//   readonly exportDone = signal(false);

//   readonly selectedColCount = computed(() =>
//     this.dialogState.columns.filter(c => c.selected).length
//   );
//   readonly activeNestedCount = computed(() =>
//     this.dialogState.nestedSheets.filter(n => n.include).length
//   );

//   // ── Dialog state ──────────────────────────────────────────────────────────
//   dialogState = {
//     fileName: 'export',
//     sheetName: 'Data',
//     sheetTitle: 'Data Export',
//     company: '',
//     showTimestamp: true,
//     showTotals: true,
//     freezeHeader: true,
//     autoFilter: true,
//     showIds: false,
//     tabColor: '1D7A3B',
//     columns: [] as DialogColumn[],
//     nestedSheets: [] as DialogNestedSheet[],
//   };

//   colSearch = '';

//   readonly tabColorPalette = [
//     '1D7A3B', '155c2c', '0d4a22',  // greens
//     '1a56db', '1e429f', '1c3d5e',  // blues
//     'c45b1a', '9a3412', '7c2d12',  // oranges
//     '8b5cf6', '6d28d9', '4c1d95',  // purples
//     'be185d', '9d174d', '831843',  // pinks
//     '0891b2', '0e7490', '155e75',  // cyans
//     '374151', '1f2937', '111827',  // grays
//   ];

//   readonly filteredColumns = computed(() => {
//     const q = this.colSearch.trim().toLowerCase();
//     if (!q) return this.dialogState.columns;
//     return this.dialogState.columns.filter(c =>
//       c.key.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
//     );
//   });

//   // ── Lifecycle ────────────────────────────────────────────────────────────
//   ngOnInit(): void {
//     if (this.portalTarget) {
//       document.body.appendChild(this.portalTarget.nativeElement);
//     }
//   }

//   ngOnDestroy(): void {
//     if (this.portalTarget) {
//       this.portalTarget.nativeElement.remove();
//     }
//   }

//   ngOnChanges(c: SimpleChanges): void {
//     if (c['data'] && this.data?.length) this.buildDialogState();
//   }

//   private buildDialogState(): void {
//     const inferred = inferSchema(this.data);

//     this.dialogState.columns = inferred.columns.map(col => ({
//       key: col.key,
//       label: col.label,
//       type: col.type ?? 'text',
//       isId: col.isId ?? false,
//       showTotal: col.showTotal ?? false,
//       selected: !(col.isId ?? false),
//       customLabel: col.label,
//     }));

//     this.dialogState.nestedSheets = inferred.nestedSheets.map((ns, i) => ({
//       arrayKey: ns.key,
//       sheetName: ns.label,
//       tabColor: NESTED_COLORS[i % NESTED_COLORS.length],
//       include: true,
//       columns: ns.columns.map(c => ({
//         key: c.key, label: c.label, type: c.type ?? 'text',
//         isId: c.isId ?? false, showTotal: c.showTotal ?? false,
//         selected: true, customLabel: c.label,
//       })),
//     }));
//   }

//   // ── Dialog controls ───────────────────────────────────────────────────────
//   openDialog(): void { this.buildDialogState(); this.dialogOpen.set(true); }
//   closeDialog(): void { this.dialogOpen.set(false); }

//   selectAllCols(sel: boolean): void { this.dialogState.columns.forEach(c => c.selected = sel); }
//   selectNonIdCols(): void { this.dialogState.columns.forEach(c => c.selected = !c.isId); }

//   // ── Export ────────────────────────────────────────────────────────────────
//   async doExport(): Promise<void> {
//     if (this.exporting() || !this.data?.length) return;
//     this.exporting.set(true);
//     this.exportDone.set(false);

//     try {
//       const ds = this.dialogState;

//       // Build ColumnConfig from dialog selections
//       const visibleCols: ColumnConfig[] = ds.columns
//         .filter(c => c.selected)
//         .map(c => ({
//           key: c.key, label: c.customLabel, type: c.type,
//           isId: c.isId, showTotal: c.showTotal,
//         }));

//       if (!visibleCols.length) return;

//       const idKey = ['id', '_id', 'uuid', 'code'].find(k => k in (this.data[0] ?? {})) ?? 'id';

//       const nestedSheetConfigs: NestedSheetConfig[] = ds.nestedSheets
//         .filter(ns => ns.include)
//         .map(ns => ({
//           arrayKey: ns.arrayKey,
//           sheetName: ns.sheetName,
//           parentRefKey: 'parentRef',
//           tabColor: ns.tabColor,
//           columns: [
//             { key: 'parentRef', label: 'Ref #', type: 'text' as ColumnType, width: 16 },
//             ...ns.columns.filter(c => c.selected).map(c => ({
//               key: c.key, label: c.customLabel, type: c.type,
//               isId: c.isId, showTotal: c.showTotal,
//             })),
//           ],
//         }));

//       const cfg = {
//         fileName: ds.fileName || 'export',
//         sheetName: ds.sheetName || 'Data',
//         sheetTitle: ds.sheetTitle || 'Data Export',
//         company: ds.company,
//         showTimestamp: ds.showTimestamp,
//         showTotals: ds.showTotals,
//         freezeHeader: ds.freezeHeader,
//         autoFilter: ds.autoFilter,
//         showIds: ds.showIds,
//         tabColor: ds.tabColor,
//         alternateRowColor: 'EEF9F2',
//         creator: 'ExcelExportDialog',
//         nestedSheets: nestedSheetConfigs,
//       };

//       await this.writeWorkbook(visibleCols, cfg, idKey);

//       this.exportDone.set(true);
//       this.closeDialog();
//       setTimeout(() => this.exportDone.set(false), 3000);
//     } finally {
//       this.exporting.set(false);
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   //  Workbook builder (same logic as original SheetBuilder)
//   // ─────────────────────────────────────────────────────────────────────────


//   private async writeWorkbook(
//     visibleCols: ColumnConfig[],
//     cfg: ExportWorkbookConfig,
//     idKey: string
//   ): Promise<void> {
//     const wb = new ExcelJS.Workbook();
//     wb.creator = cfg.creator; wb.created = new Date(); wb.modified = new Date();

//     const childHeaderOffset = 1 + (cfg.showTimestamp ? 1 : 0) + (cfg.company ? 1 : 0) + 1 + 1;

//     // Pre-calc nested positions
//     type NestExtract = { sheetCfg: NestedSheetConfig; rows: Record<string, unknown>[]; parentToFirst: Map<number, number> };
//     const extracted: NestExtract[] = cfg.nestedSheets.map(sc => {
//       const rows: Record<string, unknown>[] = [];
//       const parentToFirst = new Map<number, number>();
//       this.data.forEach((pRow, pi) => {
//         const children = getByPath(pRow, sc.arrayKey);
//         if (!Array.isArray(children) || !children.length) return;
//         const first = childHeaderOffset + rows.length + 1;
//         parentToFirst.set(pi, first);
//         const ref = pRow[idKey] ?? pi + 1;
//         children.forEach(child => {
//           const cr: Record<string, unknown> = typeof child === 'object' && child !== null ? { ...(child as Record<string, unknown>) } : { value: child };
//           cr[sc.parentRefKey ?? 'parentRef'] = ref;
//           rows.push(cr);
//         });
//       });
//       return { sheetCfg: sc, rows, parentToFirst };
//     });

//     // Nested links map
//     let nestedLinks: Map<number, Array<{ sheetName: string; firstChildRow: number; label: string }>> | undefined;
//     if (extracted.length) {
//       nestedLinks = new Map();
//       this.data.forEach((_r, idx) => {
//         const targets: Array<{ sheetName: string; firstChildRow: number; label: string }> = [];
//         extracted.forEach(({ sheetCfg, parentToFirst }) => {
//           const fr = parentToFirst.get(idx);
//           if (fr !== undefined) targets.push({ sheetName: sheetCfg.sheetName ?? sheetCfg.arrayKey, firstChildRow: fr, label: sheetCfg.sheetName ?? sheetCfg.arrayKey });
//         });
//         if (targets.length) nestedLinks!.set(idx, targets);
//       });
//     }

//     const tc = 'FF' + cfg.tabColor.replace('#', '');
//     this.buildSheet(wb, this.data, visibleCols, cfg.sheetName, cfg.sheetTitle, cfg, tc, nestedLinks);

//     extracted.forEach(({ sheetCfg, rows }) => {
//       if (!rows.length) return;
//       const refKey = sheetCfg.parentRefKey ?? 'parentRef';
//       const childCols = sheetCfg.columns.filter(c => !c.isId || cfg.showIds);
//       const childTc = 'FF' + (sheetCfg.tabColor ?? '5B6EB5').replace('#', '');
//       this.buildSheet(wb, rows, childCols, sheetCfg.sheetName ?? sheetCfg.arrayKey,
//         sheetCfg.sheetName ?? sheetCfg.arrayKey, cfg, childTc);
//     });

//     const buffer = await wb.xlsx.writeBuffer();
//     saveAs(
//       new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
//       `${cfg.fileName}.xlsx`
//     );
//   }

//   private buildSheet(
//     wb: ExcelJS.Workbook,
//     data: Record<string, unknown>[],
//     cols: ColumnConfig[],
//     sheetName: string,
//     title: string,
//     cfg: ExportWorkbookConfig,
//     tc: string,
//     nestedLinks?: Map<number, Array<{ sheetName: string; firstChildRow: number; label: string }>>
//   ): void {
//     const hasLinks = (nestedLinks?.size ?? 0) > 0;
//     const linkCol: ColumnConfig = { key: '__nestedLink', label: 'Details ↗', width: 22, type: 'text' };
//     const allCols = hasLinks ? [...cols, linkCol] : cols;

//     const colWidths = allCols.map(c => c.width ?? autoWidth(c));

//     const sheet = wb.addWorksheet(sheetName, {
//       properties: { tabColor: { argb: tc } },
//       pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
//       views: cfg.freezeHeader ? [{ state: 'frozen', ySplit: 1 + (cfg.showTimestamp ? 1 : 0) + (cfg.company ? 1 : 0) + 1 + 1 }] : [],
//     });
//     sheet.columns = allCols.map((c, i) => ({ key: c.key, width: colWidths[i] }));

//     let row = 1;

//     // Title
//     const titleRow = sheet.addRow([title]);
//     sheet.mergeCells(row, 1, row, allCols.length);
//     const tc1 = titleRow.getCell(1);
//     tc1.value = title; tc1.font = { name: 'Calibri', bold: true, size: 16, color: { argb: 'FF1F3864' } };
//     tc1.alignment = { horizontal: 'center', vertical: 'middle' }; tc1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
//     titleRow.height = 32; row++;

//     if (cfg.showTimestamp) {
//       const ts = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
//       const r = sheet.addRow([`Generated: ${ts}`]);
//       sheet.mergeCells(row, 1, row, allCols.length);
//       const c = r.getCell(1); c.font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF888888' } }; c.alignment = { horizontal: 'right' };
//       r.height = 14; row++;
//     }
//     if (cfg.company) {
//       const r = sheet.addRow([cfg.company]);
//       sheet.mergeCells(row, 1, row, allCols.length);
//       const c = r.getCell(1); c.font = { name: 'Calibri', bold: true, size: 10, color: { argb: tc } }; c.alignment = { horizontal: 'right' };
//       r.height = 14; row++;
//     }
//     sheet.addRow([]); row++;

//     // Header
//     const headerRow = sheet.addRow(allCols.map(c => c.label));
//     const headerRowNum = row;
//     allCols.forEach((col, i) => {
//       const cell = headerRow.getCell(i + 1);
//       const hex = (col.headerColor ? col.headerColor : tc.replace('FF', '')).replace('#', '');
//       cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
//       cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
//       cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
//       cell.border = thinBorder();
//     });
//     headerRow.height = 24; row++;

//     const dataStart = row;
//     const altFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + cfg.alternateRowColor } };
//     const whiteFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

//     data.forEach((item, idx) => {
//       const flat = flattenObject(item);
//       const values = cols.map(col => resolveCellValue(col, getByPath(flat, col.key), flat));
//       if (hasLinks) values.push('');

//       values.forEach((v, i) => {
//         if (!allCols[i].width) {
//           let strLen = 0;
//           if (v instanceof Date) strLen = 14;
//           else if (v !== null && v !== undefined) strLen = String(v).length;
//           if (strLen + 3 > colWidths[i]) colWidths[i] = Math.min(strLen + 3, 75);
//         }
//       });

//       const dr = sheet.addRow(values);
//       cols.forEach((col, i) => {
//         const cell = dr.getCell(i + 1); const type = col.type ?? 'text';
//         if (type === 'currency') cell.numFmt = `"₹"#,##0.00`;
//         else if (NUM_FMT[type]) cell.numFmt = NUM_FMT[type]!;
//         cell.alignment = { horizontal: H_ALIGN[type] ?? 'left', vertical: 'middle', wrapText: false };
//         cell.font = { name: 'Calibri', size: 10 };
//         cell.fill = idx % 2 !== 0 ? altFill : whiteFill; cell.border = thinBorder('FFE8E8E8');
//       });

//       if (hasLinks) {
//         const links = nestedLinks!.get(idx);
//         const cell = dr.getCell(allCols.length);
//         if (links?.length === 1) {
//           cell.value = { text: `↗ ${links[0].label}`, hyperlink: `#'${links[0].sheetName}'!A${links[0].firstChildRow}` };
//           cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0563C1' }, underline: true };
//         } else if (links?.length) {
//           cell.value = links.map(l => `↗ ${l.label}`).join('  |  ');
//           cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0563C1' } };
//         } else { cell.value = '—'; cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFBBBBBB' } }; }
//         cell.alignment = { horizontal: 'center', vertical: 'middle' };
//         const lc = allCols.length; const ac = allCols[lc - 1];
//         if (ac) { const lCell = dr.getCell(lc); lCell.fill = idx % 2 !== 0 ? altFill : whiteFill; lCell.border = thinBorder('FFE8E8E8'); }
//       }

//       dr.height = 18; row++;
//     });
//     const dataEnd = row - 1;

//     if (cfg.showTotals && data.length) {
//       const totValues = allCols.map((col, i) => {
//         if (i === 0) return 'TOTAL';
//         if (col.key === '__nestedLink') return null;
//         const type = col.type ?? 'text';
//         if (['number', 'currency', 'percent'].includes(type) && col.showTotal !== false)
//           return { formula: `SUM(${colLetter(i + 1)}${dataStart}:${colLetter(i + 1)}${dataEnd})` };
//         return null;
//       });
//       const tr = sheet.addRow(totValues);
//       allCols.forEach((col, i) => {
//         const cell = tr.getCell(i + 1); const type = col.type ?? 'text';
//         cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF1F3864' } };
//         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
//         cell.border = accentTopBorder(tc);
//         if (type === 'currency') cell.numFmt = `"₹"#,##0.00`;
//         else if (NUM_FMT[type]) cell.numFmt = NUM_FMT[type]!;
//         cell.alignment = { horizontal: H_ALIGN[type] ?? 'left', vertical: 'middle' };
//       });
//       tr.height = 22;
//     }

//     if (cfg.autoFilter && data.length) {
//       sheet.autoFilter = { from: { row: headerRowNum, column: 1 }, to: { row: headerRowNum, column: allCols.length } };
//     }

//     allCols.forEach((_, i) => {
//       sheet.getColumn(i + 1).width = colWidths[i];
//     });
//   }
// }
