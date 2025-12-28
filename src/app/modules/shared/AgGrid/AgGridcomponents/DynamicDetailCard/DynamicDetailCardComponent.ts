import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
// 1. UPDATE IMPORT
import { TabsModule } from 'primeng/tabs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  standalone: true,
  selector: 'app-dynamic-detail-table',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    TabsModule // 2. Add Module
  ],
  // Keep encapsulation None to override PrimeNG internal styles for the glass effect
  encapsulation: ViewEncapsulation.None,
  template: `
<div class="detail-container surface-glass">
      
      <header class="glass-header">
        <div class="header-content">
          <div class="icon-box">
            <i class="pi pi-database"></i>
          </div>
          <div class="title-stack">
            <h1>{{ title }}</h1>
            <div class="meta-badges">
              <span class="id-badge">ID: {{ recordId }}</span>
              <span class="count-badge">{{ totalFields }} Fields</span>
            </div>
          </div>
        </div>

        <div class="header-controls">
          <div class="search-wrapper">
            <i class="pi pi-search search-icon"></i>
            <input 
              type="text" 
              pInputText 
              placeholder="Filter fields..." 
              [(ngModel)]="searchTerm" 
              (ngModelChange)="filterData()"
              class="glass-input"
            />
          </div>
          
          <button class="close-btn" (click)="close()">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </header>

      <div class="glass-body custom-scrollbar">
        
        <p-tabs value="visual" styleClass="glass-tabs">
          
          <p-tablist>
            <p-tab value="visual">Visual View</p-tab>
            <p-tab value="json">Raw JSON</p-tab>
          </p-tablist>

          <p-tabpanels>
            
            <p-tabpanel value="visual">
              <div class="view-content animate-fadeIn">
                
                @if (filteredRootProps.length) {
                  <section class="data-group">
                    <h3 class="group-title">General Information</h3>
                    <div class="primitive-grid">
                      @for (prop of filteredRootProps; track prop.key) {
                        <div class="data-card" (click)="copyToClipboard(prop.formattedValue)">
                          <label>{{ prop.label }}</label>
                          <div class="value-wrapper">
                            <ng-container *ngTemplateOutlet="valueRenderer; context: { $implicit: prop }"></ng-container>
                          </div>
                          <i class="pi pi-copy copy-icon"></i>
                        </div>
                      }
                    </div>
                  </section>
                }

                @for (obj of filteredObjects; track obj.key) {
                  <section class="data-group">
                    <h3 class="group-title">{{ obj.label }}</h3>
                    <div class="primitive-grid">
                      @for (prop of obj.props; track prop.key) {
                        <div class="data-card" (click)="copyToClipboard(prop.formattedValue)">
                          <label>{{ prop.label }}</label>
                          <div class="value-wrapper">
                            <ng-container *ngTemplateOutlet="valueRenderer; context: { $implicit: prop }"></ng-container>
                          </div>
                          <i class="pi pi-copy copy-icon"></i>
                        </div>
                      }
                    </div>
                  </section>
                }

                @for (arr of filteredArrays; track arr.key) {
                  <section class="data-group full-width">
                    <div class="table-header-row">
                      <h3 class="group-title">{{ arr.label }}</h3>
                      <span class="row-count">{{ arr.data.length }} Records</span>
                    </div>
                    
                    <div class="table-wrapper">
                      <p-table 
                        [value]="arr.data" 
                        [scrollable]="true" 
                        scrollHeight="400px" 
                        styleClass="p-datatable-sm glass-table"
                      >
                        <ng-template pTemplate="header">
                          <tr>
                            @for (col of arr.cols; track col) {
                              <th>{{ formatLabel(col) }}</th>
                            }
                          </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-row>
                          <tr>
                            @for (col of arr.cols; track col) {
                              <td>
                                <ng-container *ngTemplateOutlet="simpleValue; context: { val: row[col], key: col }"></ng-container>
                              </td>
                            }
                          </tr>
                        </ng-template>
                      </p-table>
                    </div>
                  </section>
                }

                @if (isFilterEmpty) {
                  <div class="empty-filter">
                    <i class="pi pi-search-minus"></i>
                    <p>No fields match "{{ searchTerm }}"</p>
                  </div>
                }
              </div>
            </p-tabpanel>

            <p-tabpanel value="json">
              <div class="json-viewer custom-scrollbar">
                <pre>{{ rawData | json }}</pre>
              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </div>
    </div>

    <ng-template #valueRenderer let-prop>
      @if (prop.type === 'image') {
        <div class="image-preview">
          <img [src]="prop.value" alt="Preview">
          <a [href]="prop.value" target="_blank" (click)="$event.stopPropagation()"><i class="pi pi-external-link"></i></a>
        </div>
      }
      @else if (prop.type === 'status') {
        <p-tag [value]="prop.value" ></p-tag>
      }
      @else if (prop.type === 'boolean') {
        <span class="bool-pill" [class.true]="prop.value" [class.false]="!prop.value">
          <i class="pi" [class.pi-check]="prop.value" [class.pi-times]="!prop.value"></i>
          {{ prop.value ? 'Active' : 'Inactive' }}
        </span>
      }
      @else if (prop.type === 'date') {
        <span class="date-val"><i class="pi pi-calendar"></i> {{ prop.formattedValue }}</span>
      }
      @else {
        <span [class.code-font]="prop.isCode" [class.is-empty]="prop.isEmpty">
          {{ prop.formattedValue }}
        </span>
      }
    </ng-template>

    <ng-template #simpleValue let-val="val" let-key="key">
      <span [innerHTML]="formatSimple(val, key)"></span>
    </ng-template>
  `,
  styles: [`
    .detail-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
}
/* =========================================================
   GLASS SURFACE (THEME-AGNOSTIC)
   ========================================================= */
.surface-glass .p-tabpanel .p-tabpanel-active {
  background: var(--glass-bg-c);
  backdrop-filter: blur(var(--glass-blur-c));
  -webkit-backdrop-filter: blur(var(--glass-blur-c));
  border: var(--ui-border-width) solid var(--glass-border-c);
  box-shadow: var(--glass-shadow-c);
}

/* ================= HEADER ================= */

.glass-header {
  padding: var(--spacing-lg) var(--spacing-2xl);
  background: var(--bg-secondary);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.icon-box {
  width: 44px;
  height: 44px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--ui-border-width) solid var(--border-secondary);

  i {
    font-size: 1.4rem;
    color: var(--accent-primary);
  }
}

.title-stack h1 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.meta-badges {
  display: flex;
  gap: var(--spacing-md);

  .id-badge {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    background: var(--bg-ternary);
    padding: 2px 8px;
    border-radius: var(--ui-border-radius);
    color: var(--text-secondary);
  }

  .count-badge {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }
}

/* ================= HEADER CONTROLS ================= */

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.search-wrapper {
  position: relative;
  width: 280px;

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
  }

  .glass-input {
    width: 100%;
    padding: 6px 10px 6px 36px;
    background: var(--bg-ternary);
    border: var(--ui-border-width) solid var(--border-secondary);
    border-radius: var(--ui-border-radius-lg);
    font-size: var(--font-size-sm);
    color: var(--text-primary);

    &:focus {
      outline: none;
      background: var(--bg-primary);
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
    }
  }
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--ui-border-radius);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;

  &:hover {
    background: var(--component-bg-hover);
    color: var(--color-error);
  }
}

/* ================= BODY ================= */

.glass-body {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
}

.view-content {
  padding: var(--spacing-2xl);
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3xl);
}

/* ================= GROUPS ================= */

.group-title {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--font-weight-bold);
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-secondary);
  padding-bottom: var(--spacing-sm);
}

/* ================= DATA CARDS ================= */

.primitive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-lg);
}

.data-card {
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  position: relative;
  cursor: pointer;
  transition: border-color var(--transition-fast);

  &:hover {
    border-color: var(--accent-primary);

    .copy-icon {
      opacity: 1;
    }
  }

  label {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-bottom: 4px;
    font-weight: var(--font-weight-medium);
  }

  .value-wrapper {
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    color: var(--text-primary);
    word-break: break-word;
  }

  .copy-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: var(--font-size-xs);
    color: var(--accent-primary);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
}

/* ================= VALUE TYPES ================= */

.code-font {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

.is-empty {
  color: var(--text-tertiary);
  font-style: italic;
}

.date-val {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.bool-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background: var(--bg-ternary);

  &.true {
    color: var(--color-success);
  }

  &.false {
    color: var(--color-error);
  }
}

/* ================= IMAGE ================= */

.image-preview {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: var(--ui-border-radius);
  overflow: hidden;
  border: var(--ui-border-width) solid var(--border-secondary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  a {
    position: absolute;
    bottom: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    border-radius: var(--ui-border-radius-sm);
    background: rgba(0, 0, 0, 0.6);
    color: white;
    display: grid;
    place-items: center;
  }
}

/* ================= TABLE ================= */

.table-wrapper {
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  overflow: hidden;
}

.table-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);

  .row-count {
    font-size: var(--font-size-xs);
    background: var(--bg-ternary);
    padding: 2px 8px;
    border-radius: 999px;
  }
}

.glass-table .p-datatable-thead > tr > th {
  background: var(--bg-ternary) !important;
  color: var(--text-secondary) !important;
  font-size: var(--font-size-xs) !important;
  text-transform: uppercase;
  border-bottom: var(--ui-border-width) solid var(--border-secondary) !important;
}

.glass-table .p-datatable-tbody > tr > td {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  border-bottom: var(--ui-border-width) solid var(--border-secondary) !important;
  font-size: var(--font-size-sm) !important;
}

/* ================= JSON VIEW ================= */

.json-viewer {
  padding: var(--spacing-xl);
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-lg);
  margin: var(--spacing-xl);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  overflow: auto;
}

/* ================= TABS ================= */

.glass-tabs .p-tablist {
  background: transparent !important;
  border-bottom: var(--ui-border-width) solid var(--border-primary) !important;
}

.glass-tabs .p-tab {
  background: transparent !important;
  border: none !important;
  color: var(--text-secondary) !important;
  font-weight: var(--font-weight-semibold);
}

.glass-tabs .p-tab-active {
  color: var(--accent-primary) !important;
  border-bottom: 2px solid var(--accent-primary) !important;
}

  `]
})
export class DynamicDetailTableComponent implements OnInit {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);

  rawData: any = {};
  title: string = 'Record Details';
  recordId: string = 'N/A';
  totalFields: number = 0;

  searchTerm: string = '';
  isFilterEmpty: boolean = false;

  // Processed Data
  rootProps: any[] = [];
  objectSections: any[] = [];
  arraySections: any[] = [];

  // Filtered Data
  filteredRootProps: any[] = [];
  filteredObjects: any[] = [];
  filteredArrays: any[] = [];

  ngOnInit() {
    this.rawData = this.config.data || {};
    this.parseMetadata();
    this.processData(this.rawData);
    this.filterData();
  }

  close() {
    this.ref.close();
  }

  copyToClipboard(text: string) {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
  }

  /* === DATA LOGIC (Same as before) === */
  private parseMetadata() {
    const keys = Object.keys(this.rawData).map(k => k.toLowerCase());
    const idKey = keys.find(k => k === 'id' || k === '_id' || k.endsWith('id'));
    if (idKey) {
      const realKey = Object.keys(this.rawData).find(k => k.toLowerCase() === idKey);
      this.recordId = this.rawData[realKey || ''];
    }
    const titleKey = keys.find(k => k.includes('name') || k.includes('title') || k.includes('code'));
    if (titleKey) {
      const realKey = Object.keys(this.rawData).find(k => k.toLowerCase() === titleKey);
      this.title = this.rawData[realKey || ''] || 'Record Details';
    }
  }

  private processData(obj: any) {
    if (!obj) return;
    this.totalFields = Object.keys(obj).length;

    Object.keys(obj).forEach(key => {
      const val = obj[key];
      if (Array.isArray(val)) {
        if (val.length && typeof val[0] === 'object') {
          this.arraySections.push({ key, label: this.formatLabel(key), cols: Object.keys(val[0]).slice(0, 8), data: val });
        } else {
          this.rootProps.push(this.createProp(key, val.join(', ')));
        }
      } else if (typeof val === 'object' && val !== null) {
        const childProps = Object.keys(val).map(k => this.createProp(k, val[k]));
        if (childProps.length) {
          this.objectSections.push({ key, label: this.formatLabel(key), props: childProps });
        }
      } else {
        this.rootProps.push(this.createProp(key, val));
      }
    });
  }

  filterData() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredRootProps = [...this.rootProps];
      this.filteredObjects = [...this.objectSections];
      this.filteredArrays = [...this.arraySections];
      this.isFilterEmpty = false;
      return;
    }
    this.filteredRootProps = this.rootProps.filter(p => p.label.toLowerCase().includes(term) || String(p.formattedValue).toLowerCase().includes(term));
    this.filteredObjects = this.objectSections.map(sec => {
      const matchTitle = sec.label.toLowerCase().includes(term);
      const matchingProps = sec.props.filter((p: any) => p.label.toLowerCase().includes(term) || String(p.formattedValue).toLowerCase().includes(term));
      if (matchTitle) return sec;
      return matchingProps.length ? { ...sec, props: matchingProps } : null;
    }).filter(s => s !== null);
    this.filteredArrays = this.arraySections.filter(arr => arr.label.toLowerCase().includes(term));
    this.isFilterEmpty = !this.filteredRootProps.length && !this.filteredObjects.length && !this.filteredArrays.length;
  }

  private createProp(key: string, val: any) {
    let type = 'text';
    let formatted = val;
    const isCode = /id|code|guid|uuid/i.test(key);
    const isEmpty = val === null || val === undefined || val === '';

    if (isEmpty) { formatted = '—'; }
    else if (typeof val === 'boolean') { type = 'boolean'; }
    else if (this.isImageUrl(val)) { type = 'image'; }
    else if (this.isDate(key, val)) { type = 'date'; formatted = new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    else if (['status', 'state', 'type'].includes(key.toLowerCase())) { type = 'status'; }
    else if (this.isCurrency(key) && typeof val === 'number') { formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val); }

    return { key, label: this.formatLabel(key), value: val, formattedValue: formatted, type, isCode, isEmpty };
  }

  formatLabel(str: string): string {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/_/g, ' ').trim();
  }

  getStatusSeverity(status: string): string {
    const s = String(status).toLowerCase();
    if (/active|paid|approved|success|completed/.test(s)) return 'success';
    if (/pending|draft|processing|warning/.test(s)) return 'warning';
    if (/rejected|failed|deleted|inactive|cancelled/.test(s)) return 'danger';
    return 'info';
  }

  formatSimple(val: any, key: string): string {
    if (val === null || val === undefined) return '<span class="is-empty">—</span>';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (this.isDate(key, val)) return new Date(val).toLocaleDateString();
    return String(val);
  }

  private isDate(key: string, val: any): boolean {
    if (typeof val !== 'string' || !val) return false;
    const isDateKey = /date|time|at$/i.test(key);
    const isIso = /^\d{4}-\d{2}-\d{2}/.test(val);
    return (isDateKey || isIso) && !isNaN(Date.parse(val));
  }

  private isImageUrl(val: any): boolean {
    return typeof val === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i.test(val);
  }

  private isCurrency(key: string): boolean {
    return /price|cost|amount|total|balance/i.test(key);
  }
}
