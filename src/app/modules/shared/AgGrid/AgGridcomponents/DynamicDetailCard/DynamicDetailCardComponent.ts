import {
  Component,
  inject,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ExcelExportDialogComponent, ColumnConfig, ExcelExportConfig } from '../../../components/excel-export/excel-export';

/* --------------------------------------------------
   PROP TYPES
--------------------------------------------------- */
type PropType = 'text' | 'boolean' | 'date' | 'currency' | 'email' | 'image' | 'status' | 'id';

interface DataProp {
  key: string;
  label: string;
  value: any;
  formattedValue: string;
  type: PropType;
  isCode: boolean;
  isEmpty: boolean;
  isLongText: boolean;
}

interface ObjectSection {
  key: string;
  label: string;
  props: DataProp[];
}

interface ArraySection {
  key: string;
  label: string;
  cols: string[];
  data: any[];
}

/* --------------------------------------------------
   COMPONENT
--------------------------------------------------- */
@Component({
  standalone: true,
  selector: 'app-dynamic-detail-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    TabsModule,
    ExcelExportDialogComponent,
  ],
  encapsulation: ViewEncapsulation.None, // Required for PrimeNG inner styling without ::ng-deep
  template: `
    <div class="ddt-root">

      <!-- ══ HEADER ══════════════════════════════════════ -->
      <header class="ddt-header">
        <div class="ddt-header-left">
          <div class="ddt-icon-box">
            <i class="pi pi-file-o"></i>
          </div>
          <div class="ddt-title-block">
            <h2 class="ddt-title">{{ title }}</h2>
            <div class="ddt-meta">
              <span
                class="ddt-badge id-badge"
                (click)="copyText(recordId)"
                pTooltip="Click to copy ID"
                tooltipPosition="bottom"
              >
                <i class="pi pi-hash"></i>{{ recordId | slice:0:10 }}…
              </span>
              <span class="ddt-badge count-badge">
                <i class="pi pi-database"></i>{{ totalFields }} fields
              </span>
            </div>
          </div>
        </div>

        <div class="ddt-header-right">
          <!-- Search -->
          <div class="ddt-search">
            <i class="pi pi-search ddt-search-icon"></i>
            <input
              type="text"
              placeholder="Search fields…"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="ddt-search-input"
              autocomplete="off"
            />
            @if (searchTerm()) {
              <button class="ddt-search-clear" (click)="searchTerm.set('')">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>

          <!-- Export Excel -->
          <app-excel-export-dialog
            [data]="excelData()"
            [columns]="excelColumns()"
            [config]="excelConfig()"
          ></app-excel-export-dialog>

          <!-- Copy JSON -->
          <button
            class="ddt-icon-btn"
            (click)="copyText(jsonString)"
            pTooltip="Copy JSON"
            tooltipPosition="bottom"
          >
            <i class="pi pi-copy"></i>
          </button>

          <!-- Close -->
          <button class="ddt-icon-btn close" (click)="close()" aria-label="Close dialog">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </header>

      <!-- ══ TABS ═════════════════════════════════════════ -->
      <p-tabs [(value)]="activeTab" styleClass="ddt-tabs">
        <p-tablist>
          <p-tab value="visual">
            <div class="ddt-tab-header">
              <i class="pi pi-eye"></i>
              <span>Overview</span>
            </div>
          </p-tab>
          <p-tab value="json">
             <div class="ddt-tab-header">
              <i class="pi pi-code"></i>
              <span>Raw JSON</span>
            </div>
          </p-tab>
        </p-tablist>

        <p-tabpanels>

          <!-- ── VISUAL TAB ─────────────────────────────── -->
          <p-tabpanel value="visual">
            <div class="ddt-visual-body custom-scrollbar">

              <!-- ROOT PROPS -->
              @if (filteredRootProps().length) {
                <section class="ddt-section">
                  <h3 class="ddt-section-title">
                    <span class="section-dot primary"></span>
                    Primary Information
                  </h3>
                  <div class="ddt-prop-grid">
                    @for (prop of filteredRootProps(); track prop.key) {
                      <div
                        class="ddt-card"
                        [class.full-col]="prop.isLongText"
                        (click)="copyText(prop.formattedValue)"
                        pTooltip="Click to copy"
                        tooltipPosition="top"
                        [showDelay]="600"
                      >
                        <label class="ddt-card-label">{{ prop.label }}</label>
                        <div class="ddt-card-value">
                          <ng-container [ngTemplateOutlet]="valueRenderer"
                            [ngTemplateOutletContext]="{ $implicit: prop }">
                          </ng-container>
                        </div>
                        <i class="pi pi-copy ddt-copy-hint"></i>
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- OBJECT SECTIONS -->
              @for (obj of filteredObjects(); track obj.key) {
                <section class="ddt-section">
                  <h3 class="ddt-section-title">
                    <span class="section-dot accent"></span>
                    {{ obj.label }}
                    <span class="ddt-type-pill">Object</span>
                  </h3>
                  <div class="ddt-prop-grid">
                    @for (prop of obj.props; track prop.key) {
                      <div
                        class="ddt-card"
                        (click)="copyText(prop.formattedValue)"
                        pTooltip="Click to copy"
                        tooltipPosition="top"
                        [showDelay]="600"
                      >
                        <label class="ddt-card-label">{{ prop.label }}</label>
                        <div class="ddt-card-value">
                          <ng-container [ngTemplateOutlet]="valueRenderer"
                            [ngTemplateOutletContext]="{ $implicit: prop }">
                          </ng-container>
                        </div>
                        <i class="pi pi-copy ddt-copy-hint"></i>
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- ARRAY SECTIONS -->
              @for (arr of filteredArrays(); track arr.key) {
                <section class="ddt-section full-width">
                  <div class="ddt-section-header-row">
                    <h3 class="ddt-section-title">
                      <span class="section-dot warn"></span>
                      {{ arr.label }}
                    </h3>
                    <span class="ddt-badge count-badge">{{ arr.data.length }} items</span>
                  </div>

                  <div class="ddt-table-wrap">
                    <p-table
                      [value]="arr.data"
                      [scrollable]="true"
                      scrollHeight="360px"
                      styleClass="ddt-table"
                      [rowHover]="true"
                    >
                      <ng-template pTemplate="header">
                        <tr>
                          <th class="idx-col">#</th>
                          @for (col of arr.cols; track col) {
                            <th>{{ formatLabel(col) }}</th>
                          }
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="body" let-row let-ri="rowIndex">
                        <tr>
                          <td class="idx-col text-tertiary">{{ ri + 1 }}</td>
                          @for (col of arr.cols; track col) {
                            <td [innerHTML]="formatCell(row[col], col)"></td>
                          }
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="emptymessage">
                        <tr>
                          <td [attr.colspan]="arr.cols.length + 1" class="empty-row">
                            No records in this list.
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </section>
              }

              <!-- EMPTY SEARCH STATE -->
              @if (isFilterEmpty()) {
                <div class="ddt-empty">
                  <i class="pi pi-filter-slash"></i>
                  <p>No matches for <strong>"{{ searchTerm() }}"</strong></p>
                  <button class="ddt-text-btn" (click)="searchTerm.set('')">Clear filter</button>
                </div>
              }

            </div>
          </p-tabpanel>

          <!-- ── JSON TAB ───────────────────────────────── -->
          <p-tabpanel value="json">
            <div class="ddt-json-body">
              <div class="ddt-json-toolbar">
                <div class="ddt-json-meta">
                  <span class="ddt-badge">JSON</span>
                  <span class="text-tertiary" style="font-size:0.75rem">
                    {{ jsonLineCount }} lines
                  </span>
                </div>
                <button class="ddt-outline-btn" (click)="copyText(jsonString)">
                  <i class="pi pi-copy"></i> Copy
                </button>
              </div>

              <div class="ddt-json-viewer custom-scrollbar">
                <pre class="ddt-json-pre" [innerHTML]="jsonFormatted"></pre>
              </div>
            </div>
          </p-tabpanel>

        </p-tabpanels>
      </p-tabs>

    </div>

    <!-- ── VALUE RENDERER TEMPLATE ──────────────────── -->
    <ng-template #valueRenderer let-prop>
      @if (prop.type === 'image') {
        <div class="val-image">
          <img [src]="prop.value" alt="Preview" loading="lazy" />
          <a [href]="prop.value" target="_blank" (click)="$event.stopPropagation()"
             class="val-image-link" pTooltip="Open original">
            <i class="pi pi-external-link"></i>
          </a>
        </div>
      }
      @else if (prop.type === 'status') {
        <span class="val-status" [attr.data-status]="prop.value?.toString().toLowerCase()">
          {{ prop.formattedValue }}
        </span>
      }
      @else if (prop.type === 'boolean') {
        <span class="val-bool" [class.is-true]="prop.value" [class.is-false]="!prop.value">
          <i class="pi" [class.pi-check-circle]="prop.value" [class.pi-times-circle]="!prop.value"></i>
          {{ prop.value ? 'Yes' : 'No' }}
        </span>
      }
      @else if (prop.type === 'date') {
        <span class="val-date">
          <i class="pi pi-calendar"></i>{{ prop.formattedValue }}
        </span>
      }
      @else if (prop.type === 'currency') {
        <span class="val-currency">{{ prop.formattedValue }}</span>
      }
      @else if (prop.type === 'email') {
        <a [href]="'mailto:' + prop.value" class="val-link" (click)="$event.stopPropagation()">
          {{ prop.value }}
        </a>
      }
      @else if (prop.type === 'id') {
        <span class="val-id">{{ prop.formattedValue }}</span>
      }
      @else if (prop.isEmpty) {
        <span class="val-empty">—</span>
      }
      @else {
        <span [class.val-long]="prop.isLongText">{{ prop.formattedValue }}</span>
      }
    </ng-template>
  `,
  styles: [`
    /* ════════════════════════════════════════════════════
       FLEXBOX ARCHITECTURE FIXES
    ════════════════════════════════════════════════════ */
    
    /* 1. Host MUST take 100% height and form a column */
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    /* 2. Root element passes flex down */
    .ddt-root {
      flex: 1;
      min-height: 0; /* Critical for nested flex scrolling */
      display: flex;
      flex-direction: column;
      background: var(--theme-bg-primary, #ffffff);
      color: var(--theme-text-primary, #333333);
      font-family: var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      overflow: hidden;
    }

    /* ── HEADER ──────────────────────────────────────── */
    .ddt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1.25rem;
      background: var(--theme-bg-secondary, #f8f9fa);
      border-bottom: 1px solid var(--theme-border-primary, #e2e8f0);
      flex-shrink: 0; /* Prevents header from shrinking */
      z-index: 10;
    }

    .ddt-header-left {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      min-width: 0;
    }

    .ddt-icon-box {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.1);
      border: 1px solid rgba(var(--accent-primary-rgb, 59, 130, 246), 0.2);
      border-radius: var(--ui-border-radius-lg, 10px);
      display: grid;
      place-items: center;
      color: var(--theme-accent-primary, #3b82f6);
      font-size: 1rem;
    }

    .ddt-title-block { min-width: 0; }

    .ddt-title {
      margin: 0;
      font-size: 0.975rem;
      font-weight: 700;
      color: var(--theme-text-primary, #1e293b);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.01em;
    }

    .ddt-meta {
      display: flex;
      gap: 6px;
      margin-top: 3px;
      flex-wrap: wrap;
    }

    /* ── BADGES ──────────────────────────────────────── */
    .ddt-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      border: 1px solid var(--theme-border-primary, #e2e8f0);
      background: var(--theme-bg-ternary, #f1f5f9);
      color: var(--theme-text-secondary, #64748b);
      white-space: nowrap;
      line-height: 1.6;
    }
    .ddt-badge i { font-size: 0.65rem; }

    .ddt-badge.id-badge {
      font-family: var(--font-mono, monospace);
      cursor: pointer;
      transition: background 0.15s;
    }
    .ddt-badge.id-badge:hover { background: var(--theme-border-primary, #cbd5e1); }

    /* ── HEADER RIGHT ────────────────────────────────── */
    .ddt-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    /* ── SEARCH ──────────────────────────────────────── */
    .ddt-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .ddt-search-icon {
      position: absolute;
      left: 10px;
      color: var(--theme-text-tertiary, #94a3b8);
      font-size: 0.75rem;
      pointer-events: none;
    }

    .ddt-search-input {
      width: 200px;
      height: 32px;
      padding: 0 28px 0 30px;
      background: var(--theme-bg-primary, #ffffff);
      border: 1px solid var(--theme-border-primary, #cbd5e1);
      border-radius: var(--ui-border-radius, 6px);
      font-size: 0.8rem;
      color: var(--theme-text-primary, #1e293b);
      transition: width 0.2s ease, border-color 0.15s;
      outline: none;
    }

    .ddt-search-input::placeholder { color: var(--theme-text-tertiary, #94a3b8); }
    .ddt-search-input:focus {
      width: 260px;
      border-color: var(--theme-accent-primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.15);
    }

    .ddt-search-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--theme-text-tertiary, #94a3b8);
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      padding: 0;
    }
    .ddt-search-clear:hover { color: var(--theme-text-primary, #1e293b); }

    /* ── ICON BUTTONS ────────────────────────────────── */
    .ddt-icon-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--theme-border-primary, #cbd5e1);
      border-radius: var(--ui-border-radius, 6px);
      background: var(--theme-bg-primary, #ffffff);
      color: var(--theme-text-secondary, #475569);
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.15s;
      font-size: 0.8rem;
    }
    .ddt-icon-btn:hover {
      background: var(--component-bg-hover, #f8fafc);
      color: var(--theme-text-primary, #1e293b);
    }
    .ddt-icon-btn.close:hover {
      background: rgba(239, 68, 68, 0.08);
      color: var(--color-error, #ef4444);
      border-color: rgba(239, 68, 68, 0.25);
    }

    /* ── TABS LAYOUT (FLEX CHAIN CONTINUED) ──────────── */
    
    p-tabs.ddt-tabs, 
    p-tabs.ddt-tabs > div { 
      flex: 1; 
      min-height: 0;
      display: flex; 
      flex-direction: column; 
      overflow: hidden; 
      height: 100%;
    }

    p-tablist {
      background: var(--theme-bg-secondary, #f8f9fa);
      border-bottom: 1px solid var(--theme-border-primary, #e2e8f0);
      padding: 0 1.25rem;
      flex-shrink: 0;
      display: block;
    }

    p-tabpanels {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0 !important;
    }

    p-tabpanel {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    /* PrimeNG Inner Tab panel container fixing */
    .p-tabpanels > .p-tabpanel { padding: 0 !important; height: 100%; display: flex; flex-direction: column; flex: 1; overflow:hidden;}

    /* Styling the Tab Header items */
    .ddt-tab-header {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .p-tablist-tab-list .p-tab {
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--theme-text-secondary, #64748b);
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      cursor: pointer;
      background: transparent;
    }
    .p-tablist-tab-list .p-tab:hover {
      color: var(--theme-text-primary, #1e293b);
      background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.04);
    }
    .p-tablist-tab-list .p-tab-active {
      color: var(--theme-accent-primary, #3b82f6) !important;
      border-bottom-color: var(--theme-accent-primary, #3b82f6) !important;
    }

    /* ── VISUAL BODY ─────────────────────────────────── */
    .ddt-visual-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── SECTIONS ────────────────────────────────────── */
    .ddt-section { display: flex; flex-direction: column; gap: 0.75rem; }
    .ddt-section.full-width { grid-column: 1 / -1; }

    .ddt-section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--theme-text-tertiary, #94a3b8);
      margin: 0;
    }

    .ddt-section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .section-dot.primary { background: var(--theme-accent-primary, #3b82f6); }
    .section-dot.accent { background: var(--color-warning, #f59e0b); }
    .section-dot.warn { background: var(--color-success, #22c55e); }

    .ddt-type-pill {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.1);
      color: var(--theme-accent-primary, #3b82f6);
      border: 1px solid rgba(var(--accent-primary-rgb, 59, 130, 246), 0.2);
    }

    /* ── PROP GRID ───────────────────────────────────── */
    .ddt-prop-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
    }

    .ddt-card {
      position: relative;
      background: var(--theme-bg-secondary, #f8fafc);
      border: 1px solid var(--theme-border-primary, #e2e8f0);
      border-radius: var(--ui-border-radius, 6px);
      padding: 0.625rem 0.875rem;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.12s;
    }
    .ddt-card.full-col { grid-column: 1 / -1; }
    .ddt-card:hover {
      background: var(--theme-bg-primary, #ffffff);
      border-color: var(--theme-accent-primary, #3b82f6);
      box-shadow: 0 4px 12px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.08);
      transform: translateY(-1px);
    }
    .ddt-card:hover .ddt-copy-hint { opacity: 1; }

    .ddt-card-label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--theme-text-tertiary, #94a3b8);
      margin-bottom: 3px;
    }

    .ddt-card-value {
      font-size: 0.85rem;
      color: var(--theme-text-primary, #1e293b);
      line-height: 1.5;
      word-break: break-word;
    }

    .ddt-copy-hint {
      position: absolute;
      top: 7px;
      right: 7px;
      font-size: 0.65rem;
      color: var(--theme-text-tertiary, #94a3b8);
      opacity: 0;
      transition: opacity 0.15s;
    }

    /* ── VALUE TYPES ─────────────────────────────────── */
    .val-status {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid transparent;
    }
    .val-status[data-status*="active"], .val-status[data-status*="paid"], .val-status[data-status*="approved"], .val-status[data-status*="completed"], .val-status[data-status*="success"] {
      background: rgba(34, 197, 94, 0.1);
      color: var(--color-success, #22c55e);
      border-color: rgba(34, 197, 94, 0.2);
    }
    .val-status[data-status*="pending"], .val-status[data-status*="draft"], .val-status[data-status*="processing"], .val-status[data-status*="partial"] {
      background: rgba(245, 158, 11, 0.1);
      color: var(--color-warning, #f59e0b);
      border-color: rgba(245, 158, 11, 0.2);
    }
    .val-status[data-status*="failed"], .val-status[data-status*="rejected"], .val-status[data-status*="cancelled"], .val-status[data-status*="overdue"], .val-status[data-status*="inactive"] {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error, #ef4444);
      border-color: rgba(239, 68, 68, 0.2);
    }

    .val-bool {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .val-bool.is-true { color: var(--color-success, #22c55e); }
    .val-bool.is-false { color: var(--theme-text-tertiary, #94a3b8); }
    .val-bool i { font-size: 0.85rem; }

    .val-date {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--theme-text-secondary, #475569);
      font-size: 0.82rem;
    }
    .val-date i { color: var(--theme-text-tertiary, #94a3b8); font-size: 0.75rem; }

    .val-currency {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--theme-text-primary, #1e293b);
    }

    .val-link {
      color: var(--theme-accent-primary, #3b82f6);
      text-decoration: none;
      font-size: 0.82rem;
    }
    .val-link:hover { text-decoration: underline; }

    .val-id {
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
      color: var(--theme-text-secondary, #475569);
      background: var(--theme-bg-ternary, #f1f5f9);
      padding: 1px 5px;
      border-radius: 3px;
    }

    .val-empty {
      color: var(--theme-text-tertiary, #94a3b8);
      font-style: italic;
      font-size: 0.82rem;
    }

    .val-long {
      font-size: 0.82rem;
      color: var(--theme-text-secondary, #475569);
      line-height: 1.6;
    }

    .val-image {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .val-image img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: var(--ui-border-radius, 6px);
      border: 1px solid var(--theme-border-primary, #e2e8f0);
    }
    .val-image .val-image-link {
      color: var(--theme-text-tertiary, #94a3b8);
      font-size: 0.75rem;
    }
    .val-image .val-image-link:hover { color: var(--theme-accent-primary, #3b82f6); }

    /* ── TABLE ───────────────────────────────────────── */
    .ddt-table-wrap {
      border: 1px solid var(--theme-border-primary, #e2e8f0);
      border-radius: var(--ui-border-radius-lg, 10px);
      overflow: hidden;
    }

    .ddt-table .p-datatable-thead > tr > th {
      background: var(--theme-bg-secondary, #f8f9fa) !important;
      color: var(--theme-text-tertiary, #64748b) !important;
      font-size: 0.7rem !important;
      font-weight: 700 !important;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.625rem 0.875rem !important;
      border-color: var(--theme-border-primary, #e2e8f0) !important;
    }
    .ddt-table .p-datatable-tbody > tr > td {
      font-size: 0.82rem !important;
      padding: 0.625rem 0.875rem !important;
      border-color: var(--theme-border-primary, #e2e8f0) !important;
      color: var(--theme-text-primary, #1e293b) !important;
    }
    .ddt-table .p-datatable-tbody > tr:hover > td {
      background: var(--component-bg-hover, #f1f5f9) !important;
    }

    .idx-col {
      width: 40px;
      color: var(--theme-text-tertiary, #94a3b8) !important;
      font-size: 0.7rem !important;
    }

    .empty-row {
      text-align: center;
      padding: 2rem !important;
      color: var(--theme-text-tertiary, #94a3b8) !important;
      font-style: italic;
      font-size: 0.82rem !important;
    }

    /* ── EMPTY STATE ─────────────────────────────────── */
    .ddt-empty {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--theme-text-tertiary, #94a3b8);
    }
    .ddt-empty i { font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.4; display: block; }
    .ddt-empty p { font-size: 0.9rem; margin-bottom: 0.75rem; }
    .ddt-empty strong { color: var(--theme-text-primary, #1e293b); }

    .ddt-text-btn {
      background: none;
      border: none;
      color: var(--theme-accent-primary, #3b82f6);
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: var(--ui-border-radius, 6px);
      transition: background 0.15s;
    }
    .ddt-text-btn:hover { background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.08); }

    /* ── JSON TAB ────────────────────────────────────── */
    .ddt-json-body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 1rem 1.25rem 1.25rem;
      gap: 0.75rem;
    }

    .ddt-json-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .ddt-json-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ddt-outline-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border: 1px solid var(--theme-border-secondary, #cbd5e1);
      border-radius: var(--ui-border-radius, 6px);
      background: var(--theme-bg-secondary, #ffffff);
      color: var(--theme-text-secondary, #475569);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .ddt-outline-btn i { font-size: 0.75rem; }
    .ddt-outline-btn:hover {
      border-color: var(--theme-accent-primary, #3b82f6);
      color: var(--theme-accent-primary, #3b82f6);
      background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.05);
    }

    .ddt-json-viewer {
      flex: 1;
      min-height: 0;
      overflow: auto;
      border-radius: var(--ui-border-radius-lg, 10px);
      border: 1px solid var(--theme-border-primary, #e2e8f0);
      background: var(--theme-bg-ternary, #f8fafc);
    }

    .ddt-json-pre {
      margin: 0;
      padding: 1.25rem;
      font-family: var(--font-mono, monospace);
      font-size: 0.78rem;
      line-height: 1.7;
      color: var(--theme-text-primary, #1e293b);
      white-space: pre;
      tab-size: 2;
    }

    /* ── SCROLLBAR ───────────────────────────────────── */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: var(--theme-border-secondary, #cbd5e1) transparent;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: var(--theme-border-secondary, #cbd5e1);
      border-radius: 99px;
    }

    .text-tertiary { color: var(--theme-text-tertiary, #94a3b8); }
  `]
})
export class DynamicDetailTableComponent implements OnInit {
  private readonly config = inject(DynamicDialogConfig);
  private readonly ref = inject(DynamicDialogRef);

  /* --------------------------------------------------
     STATE
  --------------------------------------------------- */
  rawData: any = {};
  jsonString = '';
  jsonFormatted = '';
  jsonLineCount = 0;
  title = 'Record Details';
  recordId = 'N/A';
  totalFields = 0;
  activeTab = 'visual';

  readonly searchTerm = signal('');

  readonly excelData = signal<any[]>([]);
  readonly excelColumns = signal<ColumnConfig[]>([]);
  readonly excelConfig = signal<ExcelExportConfig>({
    fileName: 'Record_Export',
    sheetTitle: 'Record Details',
    showTimestamp: true,
    showTotals: false,
    showIds: true
  });
  
  /* Parsed sections */
  private readonly rootProps = signal<DataProp[]>([]);
  private readonly objectSections = signal<ObjectSection[]>([]);
  private readonly arraySections = signal<ArraySection[]>([]);

  /* Computed filtered views */
  readonly filteredRootProps = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.rootProps();
    return this.rootProps().filter(p =>
      p.label.toLowerCase().includes(term) ||
      String(p.formattedValue).toLowerCase().includes(term)
    );
  });

  readonly filteredObjects = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.objectSections();
    return this.objectSections()
      .map(sec => {
        if (sec.label.toLowerCase().includes(term)) return sec;
        const matchingProps = sec.props.filter(p =>
          p.label.toLowerCase().includes(term) ||
          String(p.formattedValue).toLowerCase().includes(term)
        );
        return matchingProps.length ? { ...sec, props: matchingProps } : null;
      })
      .filter((s): s is ObjectSection => s !== null);
  });

  readonly filteredArrays = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.arraySections();
    return this.arraySections().filter(a =>
      a.label.toLowerCase().includes(term)
    );
  });

  readonly isFilterEmpty = computed(() =>
    !!this.searchTerm() &&
    !this.filteredRootProps().length &&
    !this.filteredObjects().length &&
    !this.filteredArrays().length
  );

  /* --------------------------------------------------
     INIT
  --------------------------------------------------- */
  ngOnInit(): void {
    this.rawData = this.config.data ?? {};
    this.jsonString = JSON.stringify(this.rawData, null, 2);
    this.jsonFormatted = this.syntaxHighlight(this.rawData);
    this.jsonLineCount = this.jsonString.split('\n').length;
    this.parseMetadata();

    this.excelConfig.set({
      fileName: `${this.title}_Export`.replace(/\s+/g, '_'),
      sheetTitle: this.title,
      showTimestamp: true,
      showTotals: false,
      showIds: true
    });

    this.processData(this.rawData);
  }

  close(): void {
    this.ref.close();
  }

  copyText(text: string): void {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text).catch(() => { });
  }

  /* --------------------------------------------------
     METADATA EXTRACTION
  --------------------------------------------------- */
  private parseMetadata(): void {
    const keys = Object.keys(this.rawData);
    const lowerKeys = keys.map(k => k.toLowerCase());

    const idKey = lowerKeys.find(k => k === 'id' || k === '_id' || k.endsWith('id'));
    if (idKey) {
      const real = keys.find(k => k.toLowerCase() === idKey);
      this.recordId = this.rawData[real ?? ''] ?? 'N/A';
    }

    const titleKey = lowerKeys.find(k =>
      k.includes('name') || k.includes('title') || k.includes('number')
    );
    if (titleKey) {
      const real = keys.find(k => k.toLowerCase() === titleKey);
      this.title = this.rawData[real ?? ''] ?? 'Record Details';
    }
  }

  /* --------------------------------------------------
     DATA PROCESSING
  --------------------------------------------------- */
  private processData(obj: any): void {
    if (!obj) return;
    this.totalFields = Object.keys(obj).length;

    this.excelData.set([obj]);

    const roots: DataProp[] = [];
    const objects: ObjectSection[] = [];
    const arrays: ArraySection[] = [];

    for (const key of Object.keys(obj)) {
      if (key === '__v') continue;
      const val = obj[key];

      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          const allKeys = Object.keys(val[0]);
          const cols = allKeys
            .filter(k => !['__v', 'password', 'updatedAt'].includes(k))
            .slice(0, 9);
          arrays.push({ key, label: this.formatLabel(key), cols, data: val });
        } else {
          roots.push(this.createProp(key, val.join(', ')));
        }
      } else if (typeof val === 'object' && val !== null && !this.isDateLike(key, val)) {
        const childProps = Object.keys(val)
          .filter(k => k !== '__v')
          .map(k => this.createProp(k, val[k]));
        if (childProps.length) {
          objects.push({ key, label: this.formatLabel(key), props: childProps });
        }
      } else {
        roots.push(this.createProp(key, val));
      }
    }

    this.rootProps.set(roots);
    this.objectSections.set(objects);
    this.arraySections.set(arrays);

    this.excelColumns.set(this.buildExcelCols(obj));
  }

  private buildExcelCols(obj: any): ColumnConfig[] {
    const cols: ColumnConfig[] = [];
    for (const key of Object.keys(obj)) {
      if (key === '__v') continue;
      const val = obj[key];
      const isCode = /id|code|guid|uuid/i.test(key) && !/phone/i.test(key);

      let colType: ColumnConfig['type'] = 'text';
      let formatter: ((v: any) => string) | undefined;

      if (val === null || val === undefined) {
         // text
      } else if (Array.isArray(val)) {
         colType = 'text';
         formatter = (v: any) => Array.isArray(v) ? v.map(i => typeof i === 'object' && i !== null ? JSON.stringify(i) : i).join(', ') : String(v || '');
      } else if (typeof val === 'boolean') {
         colType = 'boolean';
      } else if (typeof val === 'object' && !this.isDateLike(key, val)) {
         colType = 'text';
         formatter = (v: any) => v && typeof v === 'object' ? JSON.stringify(v) : String(v || '');
      } else if (this.isDateLike(key, val)) {
         colType = 'date';
      } else if (this.isCurrency(key) && typeof val === 'number') {
         colType = 'currency';
      } else if (typeof val === 'number') {
         colType = 'number';
      }

      cols.push({
        key,
        label: this.formatLabel(key),
        type: colType,
        isId: isCode && typeof val !== 'object',
        formatter
      });
    }
    return cols;
  }

  private createProp(key: string, val: any): DataProp {
    let type: PropType = 'text';
    let formatted: string = String(val ?? '');
    const isEmpty = val === null || val === undefined || val === '';
    const isCode = /id|code|guid|uuid/i.test(key) && !/phone/i.test(key);
    const isLongText = formatted.length > 60;

    if (isEmpty) {
      formatted = '—';
    } else if (typeof val === 'boolean') {
      type = 'boolean';
      formatted = val ? 'Yes' : 'No';
    } else if (this.isImageUrl(val)) {
      type = 'image';
    } else if (this.isDateLike(key, val)) {
      type = 'date';
      formatted = new Date(val).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } else if (/email/i.test(key)) {
      type = 'email';
    } else if (['status', 'state', 'type', 'paymentstatus'].includes(key.toLowerCase())) {
      type = 'status';
    } else if (this.isCurrency(key) && typeof val === 'number') {
      type = 'currency';
      formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR',
      }).format(val);
    } else if (isCode) {
      type = 'id';
    }

    return { key, label: this.formatLabel(key), value: val, formattedValue: formatted, type, isCode, isEmpty, isLongText };
  }

  /* --------------------------------------------------
     TABLE CELL FORMATTER
  --------------------------------------------------- */
  formatCell(val: any, key: string): string {
    if (val === null || val === undefined) return '<span style="color:var(--theme-text-tertiary);font-style:italic">—</span>';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (this.isDateLike(key, val)) return new Date(val).toLocaleDateString('en-IN');
    if (this.isCurrency(key) && typeof val === 'number') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);
    }
    const s = String(val);
    if (/status/i.test(key)) {
      return `<span class="val-status" data-status="${s.toLowerCase()}">${s}</span>`;
    }
    return s;
  }

  /* --------------------------------------------------
     JSON SYNTAX HIGHLIGHT
  --------------------------------------------------- */
  private syntaxHighlight(obj: any): string {
    const json = JSON.stringify(obj, null, 2);
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              return `<span style="color:var(--theme-accent-primary, #3b82f6);font-weight:600">${match}</span>`;
            }
            return `<span style="color:var(--color-success, #22c55e)">${match}</span>`;
          }
          if (/true|false/.test(match)) {
            return `<span style="color:var(--color-warning, #f59e0b)">${match}</span>`;
          }
          if (/null/.test(match)) {
            return `<span style="color:var(--theme-text-tertiary, #94a3b8)">${match}</span>`;
          }
          return `<span style="color:var(--theme-accent-secondary, #a78bfa)">${match}</span>`;
        }
      );
  }

  /* --------------------------------------------------
     UTILS
  --------------------------------------------------- */
  formatLabel(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/Id$/i, '')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }

  private isDateLike(key: string, val: any): boolean {
    if (typeof val !== 'string' || !val) return false;
    const isDateKey = /date|time|at$/i.test(key);
    const isIso = /^\d{4}-\d{2}-\d{2}T/.test(val);
    return (isDateKey || isIso) && !isNaN(Date.parse(val));
  }

  private isImageUrl(val: any): boolean {
    return typeof val === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i.test(val);
  }

  private isCurrency(key: string): boolean {
    return /price|cost|amount|total|balance|limit/i.test(key);
  }
}
// import {
//   Component,
//   inject,
//   OnInit,
//   ViewEncapsulation,
//   ChangeDetectionStrategy,
//   signal,
//   computed,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TableModule } from 'primeng/table';
// import { TagModule } from 'primeng/tag';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { InputTextModule } from 'primeng/inputtext';
// import { TabsModule } from 'primeng/tabs';
// import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
// import { ExcelExportComponent, ColumnConfig, ExcelExportConfig } from '../../../components/excel-export/excel-export';

// /* --------------------------------------------------
//    PROP TYPES
// --------------------------------------------------- */
// type PropType = 'text' | 'boolean' | 'date' | 'currency' | 'email' | 'image' | 'status' | 'id';

// interface DataProp {
//   key: string;
//   label: string;
//   value: any;
//   formattedValue: string;
//   type: PropType;
//   isCode: boolean;
//   isEmpty: boolean;
//   isLongText: boolean;
// }

// interface ObjectSection {
//   key: string;
//   label: string;
//   props: DataProp[];
// }

// interface ArraySection {
//   key: string;
//   label: string;
//   cols: string[];
//   data: any[];
// }

// /* --------------------------------------------------
//    COMPONENT
// --------------------------------------------------- */
// @Component({
//   standalone: true,
//   selector: 'app-dynamic-detail-table',
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     CommonModule,
//     FormsModule,
//     TableModule,
//     TagModule,
//     ButtonModule,
//     TooltipModule,
//     InputTextModule,
//     TabsModule,
//     ExcelExportComponent,
//   ],
//   encapsulation: ViewEncapsulation.None,
//   template: `
//     <div class="ddt-root">

//       <!-- ══ HEADER ══════════════════════════════════════ -->
//       <header class="ddt-header">
//         <div class="ddt-header-left">
//           <div class="ddt-icon-box">
//             <i class="pi pi-file-o"></i>
//           </div>
//           <div class="ddt-title-block">
//             <h2 class="ddt-title">{{ title }}</h2>
//             <div class="ddt-meta">
//               <span
//                 class="ddt-badge id-badge"
//                 (click)="copyText(recordId)"
//                 pTooltip="Click to copy ID"
//                 tooltipPosition="bottom"
//               >
//                 <i class="pi pi-hash"></i>{{ recordId | slice:0:10 }}…
//               </span>
//               <span class="ddt-badge count-badge">
//                 <i class="pi pi-database"></i>{{ totalFields }} fields
//               </span>
//             </div>
//           </div>
//         </div>

//         <div class="ddt-header-right">
//           <!-- Search -->
//           <div class="ddt-search">
//             <i class="pi pi-search ddt-search-icon"></i>
//             <input
//               type="text"
//               placeholder="Search fields…"
//               [ngModel]="searchTerm()"
//               (ngModelChange)="searchTerm.set($event)"
//               class="ddt-search-input"
//               autocomplete="off"
//             />
//             @if (searchTerm()) {
//               <button class="ddt-search-clear" (click)="searchTerm.set('')">
//                 <i class="pi pi-times"></i>
//               </button>
//             }
//           </div>

//           <!-- Export Excel -->
//           <app-excel-export
//             [data]="excelData()"
//             [columns]="excelColumns()"
//             [config]="excelConfig()"
//           ></app-excel-export>

//           <!-- Copy JSON -->
//           <button
//             class="ddt-icon-btn"
//             (click)="copyText(jsonString)"
//             pTooltip="Copy JSON"
//             tooltipPosition="bottom"
//           >
//             <i class="pi pi-copy"></i>
//           </button>

//           <!-- Close -->
//           <button class="ddt-icon-btn close" (click)="close()" aria-label="Close dialog">
//             <i class="pi pi-times"></i>
//           </button>
//         </div>
//       </header>

//       <!-- ══ TABS ═════════════════════════════════════════ -->
//       <p-tabs [(value)]="activeTab" styleClass="ddt-tabs">
//         <p-tablist>
//           <p-tab value="visual">
//             <i class="pi pi-eye"></i>
//             <span>Overview</span>
//           </p-tab>
//           <p-tab value="json">
//             <i class="pi pi-code"></i>
//             <span>Raw JSON</span>
//           </p-tab>
//         </p-tablist>

//         <p-tabpanels>

//           <!-- ── VISUAL TAB ─────────────────────────────── -->
//           <p-tabpanel value="visual">
//             <div class="ddt-visual-body custom-scrollbar">

//               <!-- ROOT PROPS -->
//               @if (filteredRootProps().length) {
//                 <section class="ddt-section">
//                   <h3 class="ddt-section-title">
//                     <span class="section-dot primary"></span>
//                     Primary Information
//                   </h3>
//                   <div class="ddt-prop-grid">
//                     @for (prop of filteredRootProps(); track prop.key) {
//                       <div
//                         class="ddt-card"
//                         [class.full-col]="prop.isLongText"
//                         (click)="copyText(prop.formattedValue)"
//                         pTooltip="Click to copy"
//                         tooltipPosition="top"
//                         [showDelay]="600"
//                       >
//                         <label class="ddt-card-label">{{ prop.label }}</label>
//                         <div class="ddt-card-value">
//                           <ng-container [ngTemplateOutlet]="valueRenderer"
//                             [ngTemplateOutletContext]="{ $implicit: prop }">
//                           </ng-container>
//                         </div>
//                         <i class="pi pi-copy ddt-copy-hint"></i>
//                       </div>
//                     }
//                   </div>
//                 </section>
//               }

//               <!-- OBJECT SECTIONS -->
//               @for (obj of filteredObjects(); track obj.key) {
//                 <section class="ddt-section">
//                   <h3 class="ddt-section-title">
//                     <span class="section-dot accent"></span>
//                     {{ obj.label }}
//                     <span class="ddt-type-pill">Object</span>
//                   </h3>
//                   <div class="ddt-prop-grid">
//                     @for (prop of obj.props; track prop.key) {
//                       <div
//                         class="ddt-card"
//                         (click)="copyText(prop.formattedValue)"
//                         pTooltip="Click to copy"
//                         tooltipPosition="top"
//                         [showDelay]="600"
//                       >
//                         <label class="ddt-card-label">{{ prop.label }}</label>
//                         <div class="ddt-card-value">
//                           <ng-container [ngTemplateOutlet]="valueRenderer"
//                             [ngTemplateOutletContext]="{ $implicit: prop }">
//                           </ng-container>
//                         </div>
//                         <i class="pi pi-copy ddt-copy-hint"></i>
//                       </div>
//                     }
//                   </div>
//                 </section>
//               }

//               <!-- ARRAY SECTIONS -->
//               @for (arr of filteredArrays(); track arr.key) {
//                 <section class="ddt-section full-width">
//                   <div class="ddt-section-header-row">
//                     <h3 class="ddt-section-title">
//                       <span class="section-dot warn"></span>
//                       {{ arr.label }}
//                     </h3>
//                     <span class="ddt-badge count-badge">{{ arr.data.length }} items</span>
//                   </div>

//                   <div class="ddt-table-wrap">
//                     <p-table
//                       [value]="arr.data"
//                       [scrollable]="true"
//                       scrollHeight="360px"
//                       styleClass="ddt-table"
//                       [rowHover]="true"
//                     >
//                       <ng-template pTemplate="header">
//                         <tr>
//                           <th class="idx-col">#</th>
//                           @for (col of arr.cols; track col) {
//                             <th>{{ formatLabel(col) }}</th>
//                           }
//                         </tr>
//                       </ng-template>
//                       <ng-template pTemplate="body" let-row let-ri="rowIndex">
//                         <tr>
//                           <td class="idx-col text-tertiary">{{ ri + 1 }}</td>
//                           @for (col of arr.cols; track col) {
//                             <td [innerHTML]="formatCell(row[col], col)"></td>
//                           }
//                         </tr>
//                       </ng-template>
//                       <ng-template pTemplate="emptymessage">
//                         <tr>
//                           <td [attr.colspan]="arr.cols.length + 1" class="empty-row">
//                             No records in this list.
//                           </td>
//                         </tr>
//                       </ng-template>
//                     </p-table>
//                   </div>
//                 </section>
//               }

//               <!-- EMPTY SEARCH STATE -->
//               @if (isFilterEmpty()) {
//                 <div class="ddt-empty">
//                   <i class="pi pi-filter-slash"></i>
//                   <p>No matches for <strong>"{{ searchTerm() }}"</strong></p>
//                   <button class="ddt-text-btn" (click)="searchTerm.set('')">Clear filter</button>
//                 </div>
//               }

//             </div>
//           </p-tabpanel>

//           <!-- ── JSON TAB ───────────────────────────────── -->
//           <p-tabpanel value="json">
//             <div class="ddt-json-body">
//               <div class="ddt-json-toolbar">
//                 <div class="ddt-json-meta">
//                   <span class="ddt-badge">JSON</span>
//                   <span class="text-tertiary" style="font-size:0.75rem">
//                     {{ jsonLineCount }} lines
//                   </span>
//                 </div>
//                 <button class="ddt-outline-btn" (click)="copyText(jsonString)">
//                   <i class="pi pi-copy"></i> Copy
//                 </button>
//               </div>

//               <div class="ddt-json-viewer custom-scrollbar">
//                 <pre class="ddt-json-pre">{{ jsonFormatted }}</pre>
//               </div>
//             </div>
//           </p-tabpanel>

//         </p-tabpanels>
//       </p-tabs>

//     </div>

//     <!-- ── VALUE RENDERER TEMPLATE ──────────────────── -->
//     <ng-template #valueRenderer let-prop>
//       @if (prop.type === 'image') {
//         <div class="val-image">
//           <img [src]="prop.value" alt="Preview" loading="lazy" />
//           <a [href]="prop.value" target="_blank" (click)="$event.stopPropagation()"
//              class="val-image-link" pTooltip="Open original">
//             <i class="pi pi-external-link"></i>
//           </a>
//         </div>
//       }
//       @else if (prop.type === 'status') {
//         <span class="val-status" [attr.data-status]="prop.value?.toString().toLowerCase()">
//           {{ prop.formattedValue }}
//         </span>
//       }
//       @else if (prop.type === 'boolean') {
//         <span class="val-bool" [class.is-true]="prop.value" [class.is-false]="!prop.value">
//           <i class="pi" [class.pi-check-circle]="prop.value" [class.pi-times-circle]="!prop.value"></i>
//           {{ prop.value ? 'Yes' : 'No' }}
//         </span>
//       }
//       @else if (prop.type === 'date') {
//         <span class="val-date">
//           <i class="pi pi-calendar"></i>{{ prop.formattedValue }}
//         </span>
//       }
//       @else if (prop.type === 'currency') {
//         <span class="val-currency">{{ prop.formattedValue }}</span>
//       }
//       @else if (prop.type === 'email') {
//         <a [href]="'mailto:' + prop.value" class="val-link" (click)="$event.stopPropagation()">
//           {{ prop.value }}
//         </a>
//       }
//       @else if (prop.type === 'id') {
//         <span class="val-id">{{ prop.formattedValue }}</span>
//       }
//       @else if (prop.isEmpty) {
//         <span class="val-empty">—</span>
//       }
//       @else {
//         <span [class.val-long]="prop.isLongText">{{ prop.formattedValue }}</span>
//       }
//     </ng-template>
//   `,
//   styles: [`
//     /* ════════════════════════════════════════════════════
//        ALL VARS ARE THEME TOKENS — no hardcoded colours.
//     ════════════════════════════════════════════════════ */

//     .ddt-root {
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//       background: var(--theme-bg-primary);
//       color: var(--theme-text-primary);
//       font-family: var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
//       overflow: hidden;
//     }

//     /* ── HEADER ──────────────────────────────────────── */
//     .ddt-header {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       gap: 1rem;
//       padding: 0.875rem 1.25rem;
//       background: var(--theme-bg-secondary);
//       border-bottom: 1px solid var(--theme-border-primary);
//       flex-shrink: 0;
//       z-index: 10;
//     }

//     .ddt-header-left {
//       display: flex;
//       align-items: center;
//       gap: 0.875rem;
//       min-width: 0;
//     }

//     .ddt-icon-box {
//       width: 40px;
//       height: 40px;
//       flex-shrink: 0;
//       background: rgba(var(--accent-primary-rgb), 0.1);
//       border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
//       border-radius: var(--ui-border-radius-lg, 10px);
//       display: grid;
//       place-items: center;
//       color: var(--theme-accent-primary);
//       font-size: 1rem;
//     }

//     .ddt-title-block { min-width: 0; }

//     .ddt-title {
//       margin: 0;
//       font-size: 0.975rem;
//       font-weight: 700;
//       color: var(--theme-text-primary);
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       letter-spacing: -0.01em;
//     }

//     .ddt-meta {
//       display: flex;
//       gap: 6px;
//       margin-top: 3px;
//       flex-wrap: wrap;
//     }

//     /* ── BADGES ──────────────────────────────────────── */
//     .ddt-badge {
//       display: inline-flex;
//       align-items: center;
//       gap: 4px;
//       font-size: 0.7rem;
//       font-weight: 600;
//       padding: 2px 8px;
//       border-radius: 99px;
//       border: 1px solid var(--theme-border-primary);
//       background: var(--theme-bg-ternary);
//       color: var(--theme-text-secondary);
//       white-space: nowrap;
//       line-height: 1.6;

//       i { font-size: 0.65rem; }
//     }

//     .ddt-badge.id-badge {
//       font-family: var(--font-mono, monospace);
//       cursor: pointer;
//       transition: background 0.15s;
//       &:hover { background: var(--theme-border-primary); }
//     }

//     /* ── HEADER RIGHT ────────────────────────────────── */
//     .ddt-header-right {
//       display: flex;
//       align-items: center;
//       gap: 8px;
//       flex-shrink: 0;
//     }

//     /* ── SEARCH ──────────────────────────────────────── */
//     .ddt-search {
//       position: relative;
//       display: flex;
//       align-items: center;
//     }

//     .ddt-search-icon {
//       position: absolute;
//       left: 10px;
//       color: var(--theme-text-tertiary);
//       font-size: 0.75rem;
//       pointer-events: none;
//     }

//     .ddt-search-input {
//       width: 200px;
//       height: 32px;
//       padding: 0 28px 0 30px;
//       background: var(--theme-bg-primary);
//       border: 1px solid var(--theme-border-primary);
//       border-radius: var(--ui-border-radius, 6px);
//       font-size: 0.8rem;
//       color: var(--theme-text-primary);
//       transition: width 0.2s ease, border-color 0.15s;
//       outline: none;

//       &::placeholder { color: var(--theme-text-tertiary); }

//       &:focus {
//         width: 260px;
//         border-color: var(--theme-accent-primary);
//         box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
//       }
//     }

//     .ddt-search-clear {
//       position: absolute;
//       right: 8px;
//       background: none;
//       border: none;
//       cursor: pointer;
//       color: var(--theme-text-tertiary);
//       font-size: 0.7rem;
//       display: flex;
//       align-items: center;
//       padding: 0;
//       &:hover { color: var(--theme-text-primary); }
//     }

//     /* ── ICON BUTTONS ────────────────────────────────── */
//     .ddt-icon-btn {
//       width: 32px;
//       height: 32px;
//       border: 1px solid var(--theme-border-primary);
//       border-radius: var(--ui-border-radius, 6px);
//       background: var(--theme-bg-primary);
//       color: var(--theme-text-secondary);
//       cursor: pointer;
//       display: grid;
//       place-items: center;
//       transition: all 0.15s;
//       font-size: 0.8rem;

//       &:hover {
//         background: var(--component-bg-hover);
//         color: var(--theme-text-primary);
//       }

//       &.close:hover {
//         background: rgba(239, 68, 68, 0.08);
//         color: var(--color-error, #ef4444);
//         border-color: rgba(239, 68, 68, 0.25);
//       }
//     }

//     /* ── TABS ────────────────────────────────────────── */
//     :host ::ng-deep .ddt-tabs {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       overflow: hidden;
//       height: 100%;

//       .p-tabs {
//         height: 100%;
//         display: flex;
//         flex-direction: column;
//       }

//       .p-tablist {
//         background: var(--theme-bg-secondary);
//         border-bottom: 1px solid var(--theme-border-primary);
//         padding: 0 1.25rem;
//         flex-shrink: 0;
//       }

//       .p-tab {
//         display: flex;
//         align-items: center;
//         gap: 7px;
//         padding: 0.75rem 1rem;
//         font-size: 0.8rem;
//         font-weight: 600;
//         color: var(--theme-text-secondary);
//         border-bottom: 2px solid transparent;
//         transition: color 0.15s, border-color 0.15s, background 0.15s;
//         cursor: pointer;
//         background: transparent;
//         border-top: none;
//         border-left: none;
//         border-right: none;

//         i { font-size: 0.75rem; }

//         &:hover {
//           color: var(--theme-text-primary);
//           background: rgba(var(--accent-primary-rgb), 0.04);
//         }
//       }

//       .p-tab-active {
//         color: var(--theme-accent-primary) !important;
//         border-bottom-color: var(--theme-accent-primary) !important;
//       }

//       .p-tabpanels {
//         flex: 1;
//         overflow: hidden;
//         padding: 0;
//       }

//       .p-tabpanel {
//         height: 100%;
//         padding: 0;
//       }
//     }

//     /* ── VISUAL BODY ─────────────────────────────────── */
//     .ddt-visual-body {
//       height: 100%;
//       overflow-y: auto;
//       padding: 1.25rem;
//       display: flex;
//       flex-direction: column;
//       gap: 1.5rem;
//     }

//     /* ── SECTIONS ────────────────────────────────────── */
//     .ddt-section { display: flex; flex-direction: column; gap: 0.75rem; }
//     .ddt-section.full-width { grid-column: 1 / -1; }

//     .ddt-section-title {
//       display: flex;
//       align-items: center;
//       gap: 8px;
//       font-size: 0.7rem;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.06em;
//       color: var(--theme-text-tertiary);
//       margin: 0;
//     }

//     .ddt-section-header-row {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//     }

//     .section-dot {
//       width: 6px;
//       height: 6px;
//       border-radius: 50%;
//       flex-shrink: 0;

//       &.primary { background: var(--theme-accent-primary); }
//       &.accent { background: var(--color-warning, #f59e0b); }
//       &.warn { background: var(--color-success, #22c55e); }
//     }

//     .ddt-type-pill {
//       font-size: 0.6rem;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       padding: 1px 6px;
//       border-radius: 4px;
//       background: rgba(var(--accent-primary-rgb), 0.1);
//       color: var(--theme-accent-primary);
//       border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
//     }

//     /* ── PROP GRID ───────────────────────────────────── */
//     .ddt-prop-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
//       gap: 0.75rem;
//     }

//     .ddt-card {
//       position: relative;
//       background: var(--theme-bg-secondary);
//       border: 1px solid var(--theme-border-primary);
//       border-radius: var(--ui-border-radius, 6px);
//       padding: 0.625rem 0.875rem;
//       cursor: pointer;
//       transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.12s;

//       &.full-col { grid-column: 1 / -1; }

//       &:hover {
//         background: var(--theme-bg-primary);
//         border-color: var(--theme-accent-primary);
//         box-shadow: 0 4px 12px rgba(var(--accent-primary-rgb), 0.08);
//         transform: translateY(-1px);

//         .ddt-copy-hint { opacity: 1; }
//       }
//     }

//     .ddt-card-label {
//       display: block;
//       font-size: 0.68rem;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--theme-text-tertiary);
//       margin-bottom: 3px;
//     }

//     .ddt-card-value {
//       font-size: 0.85rem;
//       color: var(--theme-text-primary);
//       line-height: 1.5;
//       word-break: break-word;
//     }

//     .ddt-copy-hint {
//       position: absolute;
//       top: 7px;
//       right: 7px;
//       font-size: 0.65rem;
//       color: var(--theme-text-tertiary);
//       opacity: 0;
//       transition: opacity 0.15s;
//     }

//     /* ── VALUE TYPES ─────────────────────────────────── */
//     .val-status {
//       display: inline-block;
//       font-size: 0.72rem;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.04em;
//       padding: 2px 8px;
//       border-radius: 4px;
//       border: 1px solid transparent;

//       &[data-status*="active"],
//       &[data-status*="paid"],
//       &[data-status*="approved"],
//       &[data-status*="completed"],
//       &[data-status*="success"] {
//         background: rgba(34, 197, 94, 0.1);
//         color: var(--color-success, #22c55e);
//         border-color: rgba(34, 197, 94, 0.2);
//       }
//       &[data-status*="pending"],
//       &[data-status*="draft"],
//       &[data-status*="processing"],
//       &[data-status*="partial"] {
//         background: rgba(245, 158, 11, 0.1);
//         color: var(--color-warning, #f59e0b);
//         border-color: rgba(245, 158, 11, 0.2);
//       }
//       &[data-status*="failed"],
//       &[data-status*="rejected"],
//       &[data-status*="cancelled"],
//       &[data-status*="overdue"],
//       &[data-status*="inactive"] {
//         background: rgba(239, 68, 68, 0.1);
//         color: var(--color-error, #ef4444);
//         border-color: rgba(239, 68, 68, 0.2);
//       }
//     }

//     .val-bool {
//       display: inline-flex;
//       align-items: center;
//       gap: 5px;
//       font-size: 0.82rem;
//       font-weight: 600;

//       &.is-true { color: var(--color-success, #22c55e); }
//       &.is-false { color: var(--theme-text-tertiary); }

//       i { font-size: 0.85rem; }
//     }

//     .val-date {
//       display: inline-flex;
//       align-items: center;
//       gap: 5px;
//       color: var(--theme-text-secondary);
//       font-size: 0.82rem;

//       i { color: var(--theme-text-tertiary); font-size: 0.75rem; }
//     }

//     .val-currency {
//       font-family: var(--font-mono, monospace);
//       font-weight: 700;
//       font-size: 0.9rem;
//       color: var(--theme-text-primary);
//     }

//     .val-link {
//       color: var(--theme-accent-primary);
//       text-decoration: none;
//       font-size: 0.82rem;
//       &:hover { text-decoration: underline; }
//     }

//     .val-id {
//       font-family: var(--font-mono, monospace);
//       font-size: 0.75rem;
//       color: var(--theme-text-secondary);
//       background: var(--theme-bg-ternary);
//       padding: 1px 5px;
//       border-radius: 3px;
//     }

//     .val-empty {
//       color: var(--theme-text-tertiary);
//       font-style: italic;
//       font-size: 0.82rem;
//     }

//     .val-long {
//       font-size: 0.82rem;
//       color: var(--theme-text-secondary);
//       line-height: 1.6;
//     }

//     .val-image {
//       display: flex;
//       align-items: center;
//       gap: 8px;

//       img {
//         width: 48px;
//         height: 48px;
//         object-fit: cover;
//         border-radius: var(--ui-border-radius, 6px);
//         border: 1px solid var(--theme-border-primary);
//       }

//       .val-image-link {
//         color: var(--theme-text-tertiary);
//         font-size: 0.75rem;
//         &:hover { color: var(--theme-accent-primary); }
//       }
//     }

//     /* ── TABLE ───────────────────────────────────────── */
//     .ddt-table-wrap {
//       border: 1px solid var(--theme-border-primary);
//       border-radius: var(--ui-border-radius-lg, 10px);
//       overflow: hidden;
//     }

//     :host ::ng-deep .ddt-table {
//       .p-datatable-thead > tr > th {
//         background: var(--theme-bg-secondary) !important;
//         color: var(--theme-text-tertiary) !important;
//         font-size: 0.7rem !important;
//         font-weight: 700 !important;
//         text-transform: uppercase;
//         letter-spacing: 0.05em;
//         padding: 0.625rem 0.875rem !important;
//         border-color: var(--theme-border-primary) !important;
//       }

//       .p-datatable-tbody > tr > td {
//         font-size: 0.82rem !important;
//         padding: 0.625rem 0.875rem !important;
//         border-color: var(--theme-border-primary) !important;
//         color: var(--theme-text-primary) !important;
//       }

//       .p-datatable-tbody > tr:hover > td {
//         background: var(--component-bg-hover) !important;
//       }
//     }

//     .idx-col {
//       width: 40px;
//       color: var(--theme-text-tertiary) !important;
//       font-size: 0.7rem !important;
//     }

//     .empty-row {
//       text-align: center;
//       padding: 2rem !important;
//       color: var(--theme-text-tertiary) !important;
//       font-style: italic;
//       font-size: 0.82rem !important;
//     }

//     /* ── EMPTY STATE ─────────────────────────────────── */
//     .ddt-empty {
//       text-align: center;
//       padding: 3rem 1rem;
//       color: var(--theme-text-tertiary);

//       i { font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.4; display: block; }
//       p { font-size: 0.9rem; margin-bottom: 0.75rem; }
//       strong { color: var(--theme-text-primary); }
//     }

//     .ddt-text-btn {
//       background: none;
//       border: none;
//       color: var(--theme-accent-primary);
//       cursor: pointer;
//       font-size: 0.82rem;
//       font-weight: 600;
//       padding: 4px 8px;
//       border-radius: var(--ui-border-radius, 6px);
//       transition: background 0.15s;

//       &:hover { background: rgba(var(--accent-primary-rgb), 0.08); }
//     }

//     /* ── JSON TAB ────────────────────────────────────── */
//     .ddt-json-body {
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//       padding: 1rem 1.25rem 1.25rem;
//       gap: 0.75rem;
//     }

//     .ddt-json-toolbar {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//     }

//     .ddt-json-meta {
//       display: flex;
//       align-items: center;
//       gap: 8px;
//     }

//     .ddt-outline-btn {
//       display: inline-flex;
//       align-items: center;
//       gap: 6px;
//       padding: 5px 12px;
//       border: 1px solid var(--theme-border-secondary);
//       border-radius: var(--ui-border-radius, 6px);
//       background: var(--theme-bg-secondary);
//       color: var(--theme-text-secondary);
//       font-size: 0.78rem;
//       font-weight: 600;
//       cursor: pointer;
//       transition: all 0.15s;

//       i { font-size: 0.75rem; }

//       &:hover {
//         border-color: var(--theme-accent-primary);
//         color: var(--theme-accent-primary);
//         background: rgba(var(--accent-primary-rgb), 0.05);
//       }
//     }

//     .ddt-json-viewer {
//       flex: 1;
//       overflow: auto;
//       border-radius: var(--ui-border-radius-lg, 10px);
//       border: 1px solid var(--theme-border-primary);
//       background: var(--theme-bg-ternary);
//     }

//     .ddt-json-pre {
//       margin: 0;
//       padding: 1.25rem;
//       font-family: var(--font-mono, monospace);
//       font-size: 0.78rem;
//       line-height: 1.7;
//       color: var(--theme-text-primary);
//       white-space: pre;
//       tab-size: 2;
//     }

//     /* ── SCROLLBAR ───────────────────────────────────── */
//     .custom-scrollbar {
//       scrollbar-width: thin;
//       scrollbar-color: var(--theme-border-secondary) transparent;

//       &::-webkit-scrollbar { width: 5px; }
//       &::-webkit-scrollbar-track { background: transparent; }
//       &::-webkit-scrollbar-thumb {
//         background: var(--theme-border-secondary);
//         border-radius: 99px;
//       }
//     }

//     .text-tertiary { color: var(--theme-text-tertiary); }
//     /* ── TABS ────────────────────────────────────────── */
//     /* Target the custom elements directly, remove :host ::ng-deep */
//     p-tabs.ddt-tabs {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       overflow: hidden;
//       height: 100%;
//     }

//     p-tablist {
//       background: var(--theme-bg-secondary);
//       border-bottom: 1px solid var(--theme-border-primary);
//       padding: 0 1.25rem;
//       flex-shrink: 0;
//       display: block; /* Ensures the list wrapper acts as a block */
//     }

//     p-tabpanels {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       overflow: hidden;
//       padding: 0 !important; /* Overrides PrimeNG default padding */
//     }

//     p-tabpanel {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       overflow: hidden;
//     }

//     /* Style the actual tab buttons */
//     .p-tab {
//       display: inline-flex; /* Use inline-flex instead of flex for horizontal layout */
//       align-items: center;
//       gap: 7px;
//       padding: 0.75rem 1rem;
//       font-size: 0.8rem;
//       font-weight: 600;
//       color: var(--theme-text-secondary);
//       border-bottom: 2px solid transparent;
//       transition: color 0.15s, border-color 0.15s, background 0.15s;
//       cursor: pointer;
//       background: transparent;
//       border-top: none;
//       border-left: none;
//       border-right: none;
//     }

//     .p-tab:hover {
//       color: var(--theme-text-primary);
//       background: rgba(var(--accent-primary-rgb), 0.04);
//     }

//     .p-tab-active {
//       color: var(--theme-accent-primary) !important;
//       border-bottom-color: var(--theme-accent-primary) !important;
//     }

//     /* ── VISUAL BODY ─────────────────────────────────── */
//     .ddt-visual-body {
//       flex: 1; /* Take up remaining height of p-tabpanel */
//       height: 100%;
//       overflow-y: auto; /* This is where the magic scroll happens */
//       padding: 1.25rem;
//       display: flex;
//       flex-direction: column;
//       gap: 1.5rem;
//     }
    
//   `]
// })
// export class DynamicDetailTableComponent implements OnInit {
//   private readonly config = inject(DynamicDialogConfig);
//   private readonly ref = inject(DynamicDialogRef);

//   /* --------------------------------------------------
//      STATE
//   --------------------------------------------------- */
//   rawData: any = {};
//   jsonString = '';
//   jsonFormatted = '';
//   jsonLineCount = 0;
//   title = 'Record Details';
//   recordId = 'N/A';
//   totalFields = 0;
//   activeTab = 'visual';

//   readonly searchTerm = signal('');

//   readonly excelData = signal<any[]>([]);
//   readonly excelColumns = signal<ColumnConfig[]>([]);
//   readonly excelConfig = signal<ExcelExportConfig>({
//     fileName: 'Record_Export',
//     sheetTitle: 'Record Details',
//     showTimestamp: true,
//     showTotals: false,
//     showIds: true
//   });
//   /* Parsed sections */
//   private readonly rootProps = signal<DataProp[]>([]);
//   private readonly objectSections = signal<ObjectSection[]>([]);
//   private readonly arraySections = signal<ArraySection[]>([]);

//   /* Computed filtered views — react to searchTerm signal */
//   readonly filteredRootProps = computed(() => {
//     const term = this.searchTerm().toLowerCase().trim();
//     if (!term) return this.rootProps();
//     return this.rootProps().filter(p =>
//       p.label.toLowerCase().includes(term) ||
//       String(p.formattedValue).toLowerCase().includes(term)
//     );
//   });

//   readonly filteredObjects = computed(() => {
//     const term = this.searchTerm().toLowerCase().trim();
//     if (!term) return this.objectSections();
//     return this.objectSections()
//       .map(sec => {
//         if (sec.label.toLowerCase().includes(term)) return sec;
//         const matchingProps = sec.props.filter(p =>
//           p.label.toLowerCase().includes(term) ||
//           String(p.formattedValue).toLowerCase().includes(term)
//         );
//         return matchingProps.length ? { ...sec, props: matchingProps } : null;
//       })
//       .filter((s): s is ObjectSection => s !== null);
//   });

//   readonly filteredArrays = computed(() => {
//     const term = this.searchTerm().toLowerCase().trim();
//     if (!term) return this.arraySections();
//     return this.arraySections().filter(a =>
//       a.label.toLowerCase().includes(term)
//     );
//   });

//   readonly isFilterEmpty = computed(() =>
//     !!this.searchTerm() &&
//     !this.filteredRootProps().length &&
//     !this.filteredObjects().length &&
//     !this.filteredArrays().length
//   );

//   /* --------------------------------------------------
//      INIT
//   --------------------------------------------------- */
//   ngOnInit(): void {
//     this.rawData = this.config.data ?? {};
//     this.jsonString = JSON.stringify(this.rawData, null, 2);
//     this.jsonFormatted = this.syntaxHighlight(this.rawData);
//     this.jsonLineCount = this.jsonString.split('\n').length;
//     this.parseMetadata();

//     this.excelConfig.set({
//       fileName: `${this.title}_Export`.replace(/\s+/g, '_'),
//       sheetTitle: this.title,
//       showTimestamp: true,
//       showTotals: false,
//       showIds: true
//     });

//     this.processData(this.rawData);
//   }

//   close(): void {
//     this.ref.close();
//   }

//   copyText(text: string): void {
//     if (!text || text === '—') return;
//     navigator.clipboard.writeText(text).catch(() => { });
//   }

//   /* --------------------------------------------------
//      METADATA EXTRACTION
//   --------------------------------------------------- */
//   private parseMetadata(): void {
//     const keys = Object.keys(this.rawData);
//     const lowerKeys = keys.map(k => k.toLowerCase());

//     const idKey = lowerKeys.find(k => k === 'id' || k === '_id' || k.endsWith('id'));
//     if (idKey) {
//       const real = keys.find(k => k.toLowerCase() === idKey);
//       this.recordId = this.rawData[real ?? ''] ?? 'N/A';
//     }

//     const titleKey = lowerKeys.find(k =>
//       k.includes('name') || k.includes('title') || k.includes('number')
//     );
//     if (titleKey) {
//       const real = keys.find(k => k.toLowerCase() === titleKey);
//       this.title = this.rawData[real ?? ''] ?? 'Record Details';
//     }
//   }

//   /* --------------------------------------------------
//      DATA PROCESSING
//   --------------------------------------------------- */
//   private processData(obj: any): void {
//     if (!obj) return;
//     this.totalFields = Object.keys(obj).length;

//     this.excelData.set([obj]);

//     const roots: DataProp[] = [];
//     const objects: ObjectSection[] = [];
//     const arrays: ArraySection[] = [];

//     for (const key of Object.keys(obj)) {
//       if (key === '__v') continue;
//       const val = obj[key];

//       if (Array.isArray(val)) {
//         if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
//           const allKeys = Object.keys(val[0]);
//           const cols = allKeys
//             .filter(k => !['__v', 'password', 'updatedAt'].includes(k))
//             .slice(0, 9);
//           arrays.push({ key, label: this.formatLabel(key), cols, data: val });
//         } else {
//           roots.push(this.createProp(key, val.join(', ')));
//         }
//       } else if (typeof val === 'object' && val !== null && !this.isDateLike(key, val)) {
//         const childProps = Object.keys(val)
//           .filter(k => k !== '__v')
//           .map(k => this.createProp(k, val[k]));
//         if (childProps.length) {
//           objects.push({ key, label: this.formatLabel(key), props: childProps });
//         }
//       } else {
//         roots.push(this.createProp(key, val));
//       }
//     }

//     this.rootProps.set(roots);
//     this.objectSections.set(objects);
//     this.arraySections.set(arrays);

//     this.excelColumns.set(this.buildExcelCols(obj));
//   }

//   private buildExcelCols(obj: any): ColumnConfig[] {
//     const cols: ColumnConfig[] = [];
//     for (const key of Object.keys(obj)) {
//       if (key === '__v') continue;
//       const val = obj[key];
//       const isCode = /id|code|guid|uuid/i.test(key) && !/phone/i.test(key);

//       let colType: ColumnConfig['type'] = 'text';
//       let formatter: ((v: any) => string) | undefined;

//       if (val === null || val === undefined) {
//         // text
//       } else if (Array.isArray(val)) {
//         colType = 'text';
//         formatter = (v: any) => Array.isArray(v) ? v.map(i => typeof i === 'object' && i !== null ? JSON.stringify(i) : i).join(', ') : String(v || '');
//       } else if (typeof val === 'boolean') {
//         colType = 'boolean';
//       } else if (typeof val === 'object' && !this.isDateLike(key, val)) {
//         colType = 'text';
//         formatter = (v: any) => v && typeof v === 'object' ? JSON.stringify(v) : String(v || '');
//       } else if (this.isDateLike(key, val)) {
//         colType = 'date';
//       } else if (this.isCurrency(key) && typeof val === 'number') {
//         colType = 'currency';
//       } else if (typeof val === 'number') {
//         colType = 'number';
//       }

//       cols.push({
//         key,
//         label: this.formatLabel(key),
//         type: colType,
//         isId: isCode && typeof val !== 'object',
//         formatter
//       });
//     }
//     return cols;
//   }

//   private createProp(key: string, val: any): DataProp {
//     let type: PropType = 'text';
//     let formatted: string = String(val ?? '');
//     const isEmpty = val === null || val === undefined || val === '';
//     const isCode = /id|code|guid|uuid/i.test(key) && !/phone/i.test(key);
//     const isLongText = formatted.length > 60;

//     if (isEmpty) {
//       formatted = '—';
//     } else if (typeof val === 'boolean') {
//       type = 'boolean';
//       formatted = val ? 'Yes' : 'No';
//     } else if (this.isImageUrl(val)) {
//       type = 'image';
//     } else if (this.isDateLike(key, val)) {
//       type = 'date';
//       formatted = new Date(val).toLocaleString('en-IN', {
//         day: 'numeric', month: 'short', year: 'numeric',
//         hour: '2-digit', minute: '2-digit',
//       });
//     } else if (/email/i.test(key)) {
//       type = 'email';
//     } else if (['status', 'state', 'type', 'paymentstatus'].includes(key.toLowerCase())) {
//       type = 'status';
//     } else if (this.isCurrency(key) && typeof val === 'number') {
//       type = 'currency';
//       formatted = new Intl.NumberFormat('en-IN', {
//         style: 'currency', currency: 'INR',
//       }).format(val);
//     } else if (isCode) {
//       type = 'id';
//     }

//     return { key, label: this.formatLabel(key), value: val, formattedValue: formatted, type, isCode, isEmpty, isLongText };
//   }

//   /* --------------------------------------------------
//      TABLE CELL FORMATTER
//   --------------------------------------------------- */
//   formatCell(val: any, key: string): string {
//     if (val === null || val === undefined) return '<span style="color:var(--theme-text-tertiary);font-style:italic">—</span>';
//     if (typeof val === 'boolean') return val ? 'Yes' : 'No';
//     if (this.isDateLike(key, val)) return new Date(val).toLocaleDateString('en-IN');
//     if (this.isCurrency(key) && typeof val === 'number') {
//       return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);
//     }
//     const s = String(val);
//     if (/status/i.test(key)) {
//       return `<span class="val-status" data-status="${s.toLowerCase()}">${s}</span>`;
//     }
//     return s;
//   }

//   /* --------------------------------------------------
//      JSON SYNTAX HIGHLIGHT (theme-token safe)
//   --------------------------------------------------- */
//   private syntaxHighlight(obj: any): string {
//     const json = JSON.stringify(obj, null, 2);
//     return json
//       .replace(/&/g, '&amp;')
//       .replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;')
//       .replace(
//         /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
//         (match) => {
//           if (/^"/.test(match)) {
//             if (/:$/.test(match)) {
//               // key
//               return `<span style="color:var(--theme-accent-primary);font-weight:600">${match}</span>`;
//             }
//             // string value
//             return `<span style="color:var(--color-success,#22c55e)">${match}</span>`;
//           }
//           if (/true|false/.test(match)) {
//             return `<span style="color:var(--color-warning,#f59e0b)">${match}</span>`;
//           }
//           if (/null/.test(match)) {
//             return `<span style="color:var(--theme-text-tertiary)">${match}</span>`;
//           }
//           // number
//           return `<span style="color:var(--theme-accent-secondary,#a78bfa)">${match}</span>`;
//         }
//       );
//   }

//   /* --------------------------------------------------
//      UTILS
//   --------------------------------------------------- */
//   formatLabel(str: string): string {
//     return str
//       .replace(/([A-Z])/g, ' $1')
//       .replace(/_/g, ' ')
//       .replace(/Id$/i, '')
//       .replace(/^./, s => s.toUpperCase())
//       .trim();
//   }

//   private isDateLike(key: string, val: any): boolean {
//     if (typeof val !== 'string' || !val) return false;
//     const isDateKey = /date|time|at$/i.test(key);
//     const isIso = /^\d{4}-\d{2}-\d{2}T/.test(val);
//     return (isDateKey || isIso) && !isNaN(Date.parse(val));
//   }

//   private isImageUrl(val: any): boolean {
//     return typeof val === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i.test(val);
//   }

//   private isCurrency(key: string): boolean {
//     return /price|cost|amount|total|balance|limit/i.test(key);
//   }
// }