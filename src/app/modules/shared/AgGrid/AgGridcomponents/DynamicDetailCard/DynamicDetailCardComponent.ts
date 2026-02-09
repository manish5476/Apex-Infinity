import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
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
    TabsModule
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="detail-container surface-glass">
      
      <!-- HEADER -->
      <header class="glass-header">
        <div class="header-content">
          <div class="icon-box">
            <i class="pi pi-file-o"></i>
          </div>
          <div class="title-stack">
            <h1>{{ title }}</h1>
            <div class="meta-badges">
              <span class="id-badge" (click)="copyToClipboard(recordId)" pTooltip="Click to Copy ID">ID: {{ recordId | slice:0:8 }}...</span>
              <span class="count-badge">{{ totalFields }} Data Points</span>
            </div>
          </div>
        </div>

        <div class="header-controls">
          <div class="search-wrapper">
            <i class="pi pi-search search-icon"></i>
            <input 
              type="text" 
              pInputText 
              placeholder="Search details..." 
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

      <!-- BODY -->
      <div class="glass-body custom-scrollbar">
        
        <p-tabs value="visual" styleClass="glass-tabs">
          <p-tablist>
            <p-tab value="visual"><i class="pi pi-eye mr-2"></i>Overview</p-tab>
            <p-tab value="json"><i class="pi pi-code mr-2"></i>Raw Data</p-tab>
          </p-tablist>

          <p-tabpanels>
            
            <!-- VISUAL TAB -->
            <p-tabpanel value="visual">
              <div class="view-content animate-fadeIn">
                
                <!-- 1. ROOT PROPERTIES (Primitive Fields) -->
                @if (filteredRootProps.length) {
                  <section class="data-group">
                    <h3 class="group-title">Primary Information</h3>
                    <div class="primitive-grid">
                      @for (prop of filteredRootProps; track prop.key) {
                        <div class="data-card" [class.full-width]="prop.isLongText" (click)="copyToClipboard(prop.formattedValue)">
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

                <!-- 2. NESTED OBJECTS (e.g., Customer, Invoice) -->
                @for (obj of filteredObjects; track obj.key) {
                  <section class="data-group object-group">
                    <div class="group-header">
                      <h3 class="group-title">{{ obj.label }}</h3>
                      <span class="obj-badge">Object</span>
                    </div>
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

                <!-- 3. ARRAYS / TABLES (e.g., Installments) -->
                @for (arr of filteredArrays; track arr.key) {
                  <section class="data-group full-width array-group">
                    <div class="table-header-row">
                      <h3 class="group-title">{{ arr.label }}</h3>
                      <span class="row-count">{{ arr.data.length }} Items</span>
                    </div>
                    
                    <div class="table-wrapper">
                      <p-table 
                        [value]="arr.data" 
                        [scrollable]="true" 
                        scrollHeight="400px" 
                        styleClass="p-datatable-sm glass-table"
                        [rowHover]="true"
                      >
                        <ng-template pTemplate="header">
                          <tr>
                            <th style="width: 50px">#</th>
                            @for (col of arr.cols; track col) {
                              <th>{{ formatLabel(col) }}</th>
                            }
                          </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
                          <tr>
                            <td class="text-tertiary text-xs">{{ rowIndex + 1 }}</td>
                            @for (col of arr.cols; track col) {
                              <td>
                                <ng-container *ngTemplateOutlet="simpleValue; context: { val: row[col], key: col }"></ng-container>
                              </td>
                            }
                          </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                          <tr>
                            <td [attr.colspan]="arr.cols.length + 1" class="text-center p-4 text-tertiary">
                              No records found in this list.
                            </td>
                          </tr>
                        </ng-template>
                      </p-table>
                    </div>
                  </section>
                }

                @if (isFilterEmpty) {
                  <div class="empty-state">
                    <i class="pi pi-filter-slash"></i>
                    <p>No matches for "{{ searchTerm }}"</p>
                    <button pButton label="Clear Filter" class="p-button-text p-button-sm" (click)="searchTerm=''; filterData()"></button>
                  </div>
                }
              </div>
            </p-tabpanel>

            <!-- JSON TAB -->
            <p-tabpanel value="json">
              <div class="json-container">
                <div class="json-actions">
                  <button pButton icon="pi pi-copy" label="Copy JSON" class="p-button-outlined p-button-sm" (click)="copyToClipboard(jsonString)"></button>
                </div>
                <div class="json-viewer custom-scrollbar">
                  <pre>{{ rawData | json }}</pre>
                </div>
              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </div>
    </div>

    <!-- TEMPLATES -->
    <ng-template #valueRenderer let-prop>
      @if (prop.type === 'image') {
        <div class="image-preview">
          <img [src]="prop.value" alt="Preview" loading="lazy">
          <a [href]="prop.value" target="_blank" (click)="$event.stopPropagation()" pTooltip="Open Original"><i class="pi pi-external-link"></i></a>
        </div>
      }
      @else if (prop.type === 'status') {
        <p-tag [value]="prop.formattedValue" [severity]="getStatusSeverity(prop.value)"></p-tag>
      }
      @else if (prop.type === 'boolean') {
        <span class="bool-pill" [class.true]="prop.value" [class.false]="!prop.value">
          <i class="pi" [class.pi-check-circle]="prop.value" [class.pi-times-circle]="!prop.value"></i>
          {{ prop.value ? 'Yes' : 'No' }}
        </span>
      }
      @else if (prop.type === 'date') {
        <span class="date-val"><i class="pi pi-calendar mr-1 text-tertiary"></i> {{ prop.formattedValue }}</span>
      }
      @else if (prop.type === 'currency') {
        <span class="currency-val">{{ prop.formattedValue }}</span>
      }
      @else if (prop.type === 'email') {
        <a [href]="'mailto:' + prop.value" class="link-val" (click)="$event.stopPropagation()">{{ prop.value }}</a>
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
    :host {
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-ternary: #f1f5f9;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-tertiary: #94a3b8;
      --border-primary: #e2e8f0;
      --border-secondary: #cbd5e1;
      --accent-primary: #3b82f6;
      --accent-light: #eff6ff;
      --color-success: #22c55e;
      --color-warning: #f59e0b;
      --color-error: #ef4444;
      
      --ui-border-radius: 6px;
      --ui-border-radius-lg: 12px;
      --ui-border-width: 1px;
      
      --spacing-xs: 0.25rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 0.75rem;
      --spacing-lg: 1rem;
      --spacing-xl: 1.5rem;
      --spacing-2xl: 2rem;
      
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    }

    .detail-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* HEADER */
    .glass-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: rgba(255, 255, 255, 0.8);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(12px);
      z-index: 10;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .icon-box {
      width: 48px;
      height: 48px;
      background: var(--accent-light);
      border-radius: var(--ui-border-radius-lg);
      display: grid;
      place-items: center;
      color: var(--accent-primary);
      font-size: 1.25rem;
    }

    .title-stack h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .meta-badges {
      display: flex;
      gap: var(--spacing-sm);
      margin-top: 4px;
      
      span {
        font-size: 0.75rem;
        background: var(--bg-ternary);
        padding: 2px 8px;
        border-radius: 99px;
        color: var(--text-secondary);
        border: 1px solid var(--border-primary);
        
        &.id-badge {
          font-family: var(--font-mono);
          cursor: pointer;
          &:hover { background: var(--border-primary); }
        }
      }
    }

    /* CONTROLS */
    .header-controls {
      display: flex;
      gap: var(--spacing-md);
    }

    .search-wrapper {
      position: relative;
      
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-tertiary);
        pointer-events: none;
      }
      
      .glass-input {
        width: 240px;
        padding: 8px 12px 8px 36px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--ui-border-radius);
        font-size: 0.875rem;
        transition: all 0.2s;
        
        &:focus {
          background: #fff;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--accent-light);
          width: 300px;
        }
      }
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      color: var(--text-tertiary);
      transition: all 0.2s;
      
      &:hover {
        background: var(--bg-ternary);
        color: var(--color-error);
        transform: rotate(90deg);
      }
    }

    /* BODY & TABS */
    .glass-body {
      flex: 1;
      overflow-y: auto;
      background: var(--bg-primary);
    }

    .glass-tabs .p-tablist {
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-primary);
      padding: 0 var(--spacing-xl);
    }
    
    .glass-tabs .p-tab {
      padding: 1rem 1.5rem;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      
      &:hover { background: var(--bg-secondary); color: var(--text-primary); }
    }
    
    .glass-tabs .p-tab-active {
      color: var(--accent-primary) !important;
      border-bottom-color: var(--accent-primary) !important;
    }

    .view-content {
      padding: var(--spacing-xl);
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }

    /* CARDS & GRID */
    .group-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      font-weight: 700;
      margin-bottom: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .obj-badge {
      background: var(--accent-light);
      color: var(--accent-primary);
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .primitive-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--spacing-lg);
    }

    .data-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-md) var(--spacing-lg);
      position: relative;
      transition: all 0.2s;
      
      &.full-width { grid-column: 1 / -1; }
      
      &:hover {
        background: #fff;
        border-color: var(--accent-primary);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        transform: translateY(-1px);
        
        .copy-icon { opacity: 1; }
      }

      label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-tertiary);
        margin-bottom: 4px;
        display: block;
        text-transform: uppercase;
      }

      .value-wrapper {
        font-size: 0.9rem;
        color: var(--text-primary);
        word-break: break-word;
        line-height: 1.5;
      }

      .copy-icon {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 0.8rem;
        color: var(--text-tertiary);
        opacity: 0;
        cursor: pointer;
        transition: opacity 0.2s;
        
        &:hover { color: var(--accent-primary); }
      }
    }

    /* SPECIFIC VALUES */
    .currency-val { font-family: var(--font-mono); font-weight: 600; color: var(--text-primary); }
    .code-font { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary); background: var(--bg-ternary); padding: 2px 4px; border-radius: 4px; }
    .is-empty { color: var(--text-tertiary); font-style: italic; font-size: 0.85rem; }
    .link-val { color: var(--accent-primary); text-decoration: none; &:hover { text-decoration: underline; } }
    
    .bool-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      
      &.true { color: var(--color-success); }
      &.false { color: var(--text-tertiary); }
    }

    /* TABLE */
    .table-wrapper {
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      background: #fff;
    }

    .table-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
      
      .row-count {
        font-size: 0.75rem;
        background: var(--bg-ternary);
        padding: 2px 8px;
        border-radius: 12px;
        color: var(--text-secondary);
        font-weight: 600;
      }
    }

    .glass-table th {
      background: var(--bg-secondary) !important;
      color: var(--text-secondary) !important;
      font-size: 0.75rem !important;
      text-transform: uppercase;
      font-weight: 700;
      padding: 0.75rem 1rem !important;
    }
    
    .glass-table td {
      font-size: 0.85rem !important;
      padding: 0.75rem 1rem !important;
      border-bottom: 1px solid var(--bg-secondary) !important;
    }

    /* JSON & EMPTY */
    .empty-state {
      text-align: center;
      padding: 4rem 0;
      color: var(--text-tertiary);
      
      i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
      p { font-size: 1rem; margin-bottom: 1rem; }
    }

    .json-container {
      position: relative;
      margin: var(--spacing-xl);
    }
    
    .json-actions {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 5;
    }

    .json-viewer {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 2rem;
      border-radius: var(--ui-border-radius-lg);
      font-family: var(--font-mono);
      font-size: 0.85rem;
      overflow: auto;
      max-height: 70vh;
    }
  `]
})
export class DynamicDetailTableComponent implements OnInit {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);

  rawData: any = {};
  jsonString: string = '';
  title: string = 'Record Details';
  recordId: string = 'N/A';
  totalFields: number = 0;

  searchTerm: string = '';
  isFilterEmpty: boolean = false;

  // Processed Data Structures
  rootProps: any[] = [];
  objectSections: any[] = []; // Nested objects like 'customerId'
  arraySections: any[] = [];  // Arrays like 'installments'

  // Filtered Versions
  filteredRootProps: any[] = [];
  filteredObjects: any[] = [];
  filteredArrays: any[] = [];

  ngOnInit() {
    this.rawData = this.config.data || {};
    this.jsonString = JSON.stringify(this.rawData, null, 2);
    this.parseMetadata();
    this.processData(this.rawData);
    this.filterData();
  }

  close() { this.ref.close(); }

  copyToClipboard(text: string) {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
  }

  /* === DATA PROCESSING LOGIC === */
  private parseMetadata() {
    // Attempt to find a readable ID and Title
    const keys = Object.keys(this.rawData).map(k => k.toLowerCase());
    
    // Find ID
    const idKey = keys.find(k => k === 'id' || k === '_id' || k.endsWith('id'));
    if (idKey) {
      const realKey = Object.keys(this.rawData).find(k => k.toLowerCase() === idKey);
      this.recordId = this.rawData[realKey || ''] || 'N/A';
    }

    // Find Title (Name, Code, Number)
    const titleKey = keys.find(k => k.includes('name') || k.includes('title') || k.includes('number'));
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
      
      // 1. Handle Arrays (Tables)
      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object') {
          // It's a list of objects -> Table
          // Smart Column Selection: Prefer specific keys over IDs/Timestamps
          const allKeys = Object.keys(val[0]);
          const cols = allKeys.filter(k => 
            !['__v', 'password', 'updatedAt'].includes(k)
          ).slice(0, 8); // Limit columns for readability

          this.arraySections.push({ 
            key, 
            label: this.formatLabel(key), 
            cols: cols, 
            data: val 
          });
        } else {
          // Simple Array (Tags, strings) -> Join
          this.rootProps.push(this.createProp(key, val.join(', ')));
        }
      } 
      // 2. Handle Nested Objects (Sub-sections)
      else if (typeof val === 'object' && val !== null && !this.isDate(key, val)) {
        // Recursively extract props for this object
        const childProps = Object.keys(val)
          .filter(k => !['__v'].includes(k))
          .map(k => this.createProp(k, val[k]));
        
        if (childProps.length > 0) {
          this.objectSections.push({ 
            key, 
            label: this.formatLabel(key), 
            props: childProps 
          });
        }
      } 
      // 3. Handle Primitives (Root Fields)
      else {
        // Exclude system fields from visual view if desired, or keep them
        if (key !== '__v') {
          this.rootProps.push(this.createProp(key, val));
        }
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

    // Filter Root Props
    this.filteredRootProps = this.rootProps.filter(p => 
      p.label.toLowerCase().includes(term) || String(p.formattedValue).toLowerCase().includes(term)
    );

    // Filter Objects (Show object if title matches OR if any prop matches)
    this.filteredObjects = this.objectSections.map(sec => {
      const titleMatch = sec.label.toLowerCase().includes(term);
      const matchingProps = sec.props.filter((p: any) => 
        p.label.toLowerCase().includes(term) || String(p.formattedValue).toLowerCase().includes(term)
      );
      
      if (titleMatch) return sec; // Show whole object
      return matchingProps.length ? { ...sec, props: matchingProps } : null;
    }).filter(s => s !== null);

    // Filter Arrays (Only by title for now)
    this.filteredArrays = this.arraySections.filter(arr => 
      arr.label.toLowerCase().includes(term)
    );

    this.isFilterEmpty = !this.filteredRootProps.length && !this.filteredObjects.length && !this.filteredArrays.length;
  }

  private createProp(key: string, val: any) {
    let type = 'text';
    let formatted = val;
    const isCode = /id|code|guid|uuid|number/i.test(key) && !/phone/i.test(key);
    const isEmpty = val === null || val === undefined || val === '';
    const isLongText = String(val).length > 50;

    if (isEmpty) { formatted = '—'; }
    else if (typeof val === 'boolean') { type = 'boolean'; }
    else if (this.isImageUrl(val)) { type = 'image'; }
    else if (this.isDate(key, val)) { 
      type = 'date'; 
      formatted = new Date(val).toLocaleDateString('en-IN', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      }); 
    }
    else if (/email/i.test(key)) { type = 'email'; }
    else if (['status', 'state', 'type', 'paymentstatus'].includes(key.toLowerCase())) { type = 'status'; }
    else if (this.isCurrency(key) && typeof val === 'number') { 
      type = 'currency';
      formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val); 
    }

    return { 
      key, 
      label: this.formatLabel(key), 
      value: val, 
      formattedValue: formatted, 
      type, 
      isCode, 
      isEmpty,
      isLongText 
    };
  }

  /* === UTILS === */
  formatLabel(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1') // Camel to Space
      .replace(/_/g, ' ')         // Underscore to Space
      .replace(/Id$/i, '')        // Remove trailing 'Id' (e.g., customerId -> customer)
      .replace(/^./, s => s.toUpperCase()) // Title case
      .trim();
  }

  getStatusSeverity(status: any): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    const s = String(status).toLowerCase();
    if (/active|paid|approved|success|completed/.test(s)) return 'success';
    if (/pending|draft|processing|warning|partial/.test(s)) return 'warn';
    if (/rejected|failed|deleted|inactive|cancelled|overdue|defaulted/.test(s)) return 'danger';
    return 'secondary';
  }

  formatSimple(val: any, key: string): string {
    if (val === null || val === undefined) return '<span class="is-empty">—</span>';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (this.isDate(key, val)) return new Date(val).toLocaleDateString();
    if (this.isCurrency(key) && typeof val === 'number') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);
    
    const sVal = String(val);
    if (/status/i.test(key)) {
      // Simple status badge for table cells
      let color = '#64748b';
      let bg = '#f1f5f9';
      if (/paid|active/.test(sVal.toLowerCase())) { color = '#166534'; bg = '#dcfce7'; }
      if (/pending/.test(sVal.toLowerCase())) { color = '#d97706'; bg = '#fef3c7'; }
      if (/default|overdue/.test(sVal.toLowerCase())) { color = '#dc2626'; bg = '#fee2e2'; }
      return `<span style="color:${color}; background:${bg}; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; text-transform:uppercase;">${sVal}</span>`;
    }
    
    return sVal;
  }

  private isDate(key: string, val: any): boolean {
    if (typeof val !== 'string' || !val) return false;
    // Don't treat simple numbers as dates unless key suggests it
    const isDateKey = /date|time|at$/i.test(key);
    // Regex for ISO date string
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

// import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TableModule } from 'primeng/table';
// import { TagModule } from 'primeng/tag';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { InputTextModule } from 'primeng/inputtext';
// // 1. UPDATE IMPORT
// import { TabsModule } from 'primeng/tabs';
// import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// @Component({
//   standalone: true,
//   selector: 'app-dynamic-detail-table',
//   imports: [
//     CommonModule,
//     FormsModule,
//     TableModule,
//     TagModule,
//     ButtonModule,
//     TooltipModule,
//     InputTextModule,
//     TabsModule // 2. Add Module
//   ],
//   // Keep encapsulation None to override PrimeNG internal styles for the glass effect
//   encapsulation: ViewEncapsulation.None,
//   template: `
// <div class="detail-container surface-glass">
      
//       <header class="glass-header">
//         <div class="header-content">
//           <div class="icon-box">
//             <i class="pi pi-database"></i>
//           </div>
//           <div class="title-stack">
//             <h1>{{ title }}</h1>
//             <div class="meta-badges">
//               <span class="id-badge">ID: {{ recordId }}</span>
//               <span class="count-badge">{{ totalFields }} Fields</span>
//             </div>
//           </div>
//         </div>

//         <div class="header-controls">
//           <div class="search-wrapper">
//             <i class="pi pi-search search-icon"></i>
//             <input 
//               type="text" 
//               pInputText 
//               placeholder="Filter fields..." 
//               [(ngModel)]="searchTerm" 
//               (ngModelChange)="filterData()"
//               class="glass-input"
//             />
//           </div>
          
//           <button class="close-btn" (click)="close()">
//             <i class="pi pi-times"></i>
//           </button>
//         </div>
//       </header>

//       <div class="glass-body custom-scrollbar">
        
//         <p-tabs value="visual" styleClass="glass-tabs">
          
//           <p-tablist>
//             <p-tab value="visual">Visual View</p-tab>
//             <p-tab value="json">Raw JSON</p-tab>
//           </p-tablist>

//           <p-tabpanels>
            
//             <p-tabpanel value="visual">
//               <div class="view-content animate-fadeIn">
                
//                 @if (filteredRootProps.length) {
//                   <section class="data-group">
//                     <h3 class="group-title">General Information</h3>
//                     <div class="primitive-grid">
//                       @for (prop of filteredRootProps; track prop.key) {
//                         <div class="data-card" (click)="copyToClipboard(prop.formattedValue)">
//                           <label>{{ prop.label }}</label>
//                           <div class="value-wrapper">
//                             <ng-container *ngTemplateOutlet="valueRenderer; context: { $implicit: prop }"></ng-container>
//                           </div>
//                           <i class="pi pi-copy copy-icon"></i>
//                         </div>
//                       }
//                     </div>
//                   </section>
//                 }

//                 @for (obj of filteredObjects; track obj.key) {
//                   <section class="data-group">
//                     <h3 class="group-title">{{ obj.label }}</h3>
//                     <div class="primitive-grid">
//                       @for (prop of obj.props; track prop.key) {
//                         <div class="data-card" (click)="copyToClipboard(prop.formattedValue)">
//                           <label>{{ prop.label }}</label>
//                           <div class="value-wrapper">
//                             <ng-container *ngTemplateOutlet="valueRenderer; context: { $implicit: prop }"></ng-container>
//                           </div>
//                           <i class="pi pi-copy copy-icon"></i>
//                         </div>
//                       }
//                     </div>
//                   </section>
//                 }

//                 @for (arr of filteredArrays; track arr.key) {
//                   <section class="data-group full-width">
//                     <div class="table-header-row">
//                       <h3 class="group-title">{{ arr.label }}</h3>
//                       <span class="row-count">{{ arr.data.length }} Records</span>
//                     </div>
                    
//                     <div class="table-wrapper">
//                       <p-table 
//                         [value]="arr.data" 
//                         [scrollable]="true" 
//                         scrollHeight="400px" 
//                         styleClass="p-datatable-sm glass-table"
//                       >
//                         <ng-template pTemplate="header">
//                           <tr>
//                             @for (col of arr.cols; track col) {
//                               <th>{{ formatLabel(col) }}</th>
//                             }
//                           </tr>
//                         </ng-template>
//                         <ng-template pTemplate="body" let-row>
//                           <tr>
//                             @for (col of arr.cols; track col) {
//                               <td>
//                                 <ng-container *ngTemplateOutlet="simpleValue; context: { val: row[col], key: col }"></ng-container>
//                               </td>
//                             }
//                           </tr>
//                         </ng-template>
//                       </p-table>
//                     </div>
//                   </section>
//                 }

//                 @if (isFilterEmpty) {
//                   <div class="empty-filter">
//                     <i class="pi pi-search-minus"></i>
//                     <p>No fields match "{{ searchTerm }}"</p>
//                   </div>
//                 }
//               </div>
//             </p-tabpanel>

//             <p-tabpanel value="json">
//               <div class="json-viewer custom-scrollbar">
//                 <pre>{{ rawData | json }}</pre>
//               </div>
//             </p-tabpanel>

//           </p-tabpanels>
//         </p-tabs>
//       </div>
//     </div>

//     <ng-template #valueRenderer let-prop>
//       @if (prop.type === 'image') {
//         <div class="image-preview">
//           <img [src]="prop.value" alt="Preview">
//           <a [href]="prop.value" target="_blank" (click)="$event.stopPropagation()"><i class="pi pi-external-link"></i></a>
//         </div>
//       }
//       @else if (prop.type === 'status') {
//         <p-tag [value]="prop.value" ></p-tag>
//       }
//       @else if (prop.type === 'boolean') {
//         <span class="bool-pill" [class.true]="prop.value" [class.false]="!prop.value">
//           <i class="pi" [class.pi-check]="prop.value" [class.pi-times]="!prop.value"></i>
//           {{ prop.value ? 'Active' : 'Inactive' }}
//         </span>
//       }
//       @else if (prop.type === 'date') {
//         <span class="date-val"><i class="pi pi-calendar"></i> {{ prop.formattedValue }}</span>
//       }
//       @else {
//         <span [class.code-font]="prop.isCode" [class.is-empty]="prop.isEmpty">
//           {{ prop.formattedValue }}
//         </span>
//       }
//     </ng-template>

//     <ng-template #simpleValue let-val="val" let-key="key">
//       <span [innerHTML]="formatSimple(val, key)"></span>
//     </ng-template>
//   `,
//   styles: [`
//     .detail-container {
//   height: 100%;
//   display: flex;
//   flex-direction: column;
//   background: var(--bg-primary);
//   color: var(--text-primary);
// }
// /* =========================================================
//    GLASS SURFACE (THEME-AGNOSTIC)
//    ========================================================= */
// .surface-glass .p-tabpanel .p-tabpanel-active {
//   background: var(--glass-bg-c);
//   backdrop-filter: blur(var(--glass-blur-c));
//   -webkit-backdrop-filter: blur(var(--glass-blur-c));
//   border: var(--ui-border-width) solid var(--glass-border-c);
//   box-shadow: var(--glass-shadow-c);
// }

// /* ================= HEADER ================= */

// .glass-header {
//   padding: var(--spacing-lg) var(--spacing-2xl);
//   background: var(--bg-secondary);
//   border-bottom: var(--ui-border-width) solid var(--border-primary);
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   flex-shrink: 0;
// }

// .header-content {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-lg);
// }

// .icon-box {
//   width: 44px;
//   height: 44px;
//   background: var(--bg-ternary);
//   border-radius: var(--ui-border-radius-lg);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: var(--ui-border-width) solid var(--border-secondary);

//   i {
//     font-size: 1.4rem;
//     color: var(--accent-primary);
//   }
// }

// .title-stack h1 {
//   margin: 0;
//   font-size: var(--font-size-lg);
//   font-weight: var(--font-weight-semibold);
// }

// .meta-badges {
//   display: flex;
//   gap: var(--spacing-md);

//   .id-badge {
//     font-family: var(--font-mono);
//     font-size: var(--font-size-xs);
//     background: var(--bg-ternary);
//     padding: 2px 8px;
//     border-radius: var(--ui-border-radius);
//     color: var(--text-secondary);
//   }

//   .count-badge {
//     font-size: var(--font-size-xs);
//     color: var(--text-tertiary);
//   }
// }

// /* ================= HEADER CONTROLS ================= */

// .header-controls {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-lg);
// }

// .search-wrapper {
//   position: relative;
//   width: 280px;

//   .search-icon {
//     position: absolute;
//     left: 12px;
//     top: 50%;
//     transform: translateY(-50%);
//     color: var(--text-tertiary);
//   }

//   .glass-input {
//     width: 100%;
//     padding: 6px 10px 6px 36px;
//     background: var(--bg-ternary);
//     border: var(--ui-border-width) solid var(--border-secondary);
//     border-radius: var(--ui-border-radius-lg);
//     font-size: var(--font-size-sm);
//     color: var(--text-primary);

//     &:focus {
//       outline: none;
//       background: var(--bg-primary);
//       border-color: var(--accent-primary);
//       box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
//     }
//   }
// }

// .close-btn {
//   width: 32px;
//   height: 32px;
//   border-radius: var(--ui-border-radius);
//   border: none;
//     background: var(--bg-secondary);
//   color: var(--text-secondary);
//   display: grid;
//   place-items: center;
//   cursor: pointer;

//   &:hover {
//     background: var(--component-bg-hover);
//     color: var(--color-error);
//   }
// }

// /* ================= BODY ================= */

// .glass-body {
//   flex: 1;
//   overflow-y: auto;
//   background: var(--bg-primary);
// }

// .view-content {
//   padding: var(--spacing-2xl);
//   max-width: 1600px;
//   margin: 0 auto;
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-3xl);
// }

// /* ================= GROUPS ================= */

// .group-title {
//   font-size: var(--font-size-xs);
//   text-transform: uppercase;
//   letter-spacing: 0.05em;
//   font-weight: var(--font-weight-bold);
//   color: var(--text-tertiary);
//   margin-bottom: var(--spacing-lg);
//   border-bottom: var(--ui-border-width) solid var(--border-secondary);
//   padding-bottom: var(--spacing-sm);
// }

// /* ================= DATA CARDS ================= */

// .primitive-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
//   gap: var(--spacing-lg);
// }

// .data-card {
//   background: var(--bg-secondary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius-lg);
//   padding: var(--spacing-lg);
//   position: relative;
//   cursor: pointer;
//   transition: border-color var(--transition-fast);

//   &:hover {
//     border-color: var(--accent-primary);

//     .copy-icon {
//       opacity: 1;
//     }
//   }

//   label {
//     display: block;
//     font-size: var(--font-size-xs);
//     color: var(--text-secondary);
//     margin-bottom: 4px;
//     font-weight: var(--font-weight-medium);
//   }

//   .value-wrapper {
//     font-size: var(--font-size-base);
//     line-height: var(--line-height-relaxed);
//     color: var(--text-primary);
//     word-break: break-word;
//   }

//   .copy-icon {
//     position: absolute;
//     top: 10px;
//     right: 10px;
//     font-size: var(--font-size-xs);
//     color: var(--accent-primary);
//     opacity: 0;
//     transition: opacity var(--transition-fast);
//   }
// }

// /* ================= VALUE TYPES ================= */

// .code-font {
//   font-family: var(--font-mono);
//   font-size: 0.9em;
// }

// .is-empty {
//   color: var(--text-tertiary);
//   font-style: italic;
// }

// .date-val {
//   display: inline-flex;
//   align-items: center;
//   gap: 6px;
// }

// .bool-pill {
//   display: inline-flex;
//   align-items: center;
//   gap: 6px;
//   padding: 2px 10px;
//   border-radius: 999px;
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-semibold);
//   background: var(--bg-ternary);

//   &.true {
//     color: var(--color-success);
//   }

//   &.false {
//     color: var(--color-error);
//   }
// }

// /* ================= IMAGE ================= */

// .image-preview {
//   position: relative;
//   width: 100%;
//   height: 120px;
//   border-radius: var(--ui-border-radius);
//   overflow: hidden;
//   border: var(--ui-border-width) solid var(--border-secondary);

//   img {
//     width: 100%;
//     height: 100%;
//     object-fit: cover;
//   }

//   a {
//     position: absolute;
//     bottom: 6px;
//     right: 6px;
//     width: 24px;
//     height: 24px;
//     border-radius: var(--ui-border-radius-sm);
//     background: rgba(0, 0, 0, 0.6);
//     color: white;
//     display: grid;
//     place-items: center;
//   }
// }

// /* ================= TABLE ================= */

// .table-wrapper {
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius-lg);
//   overflow: hidden;
// }

// .table-header-row {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: var(--spacing-md);

//   .row-count {
//     font-size: var(--font-size-xs);
//     background: var(--bg-ternary);
//     padding: 2px 8px;
//     border-radius: 999px;
//   }
// }

// .glass-table .p-datatable-thead > tr > th {
//   background: var(--bg-ternary) !important;
//   color: var(--text-secondary) !important;
//   font-size: var(--font-size-xs) !important;
//   text-transform: uppercase;
//   border-bottom: var(--ui-border-width) solid var(--border-secondary) !important;
// }

// .glass-table .p-datatable-tbody > tr > td {
//   background: var(--bg-secondary) !important;
//   color: var(--text-primary) !important;
//   border-bottom: var(--ui-border-width) solid var(--border-secondary) !important;
//   font-size: var(--font-size-sm) !important;
// }

// /* ================= JSON VIEW ================= */

// .json-viewer {
//   padding: var(--spacing-xl);
//   background: var(--bg-ternary);
//   border-radius: var(--ui-border-radius-lg);
//   margin: var(--spacing-xl);
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   overflow: auto;
// }

// /* ================= TABS ================= */

// .glass-tabs .p-tablist {
//   background: transparent !important;
//   border-bottom: var(--ui-border-width) solid var(--border-primary) !important;
// }

// .glass-tabs .p-tab {
//   background: transparent !important;
//   border: none !important;
//   color: var(--text-secondary) !important;
//   font-weight: var(--font-weight-semibold);
// }

// .glass-tabs .p-tab-active {
//   color: var(--accent-primary) !important;
//   border-bottom: 2px solid var(--accent-primary) !important;
// }

//   `]
// })
// export class DynamicDetailTableComponent implements OnInit {
//   private config = inject(DynamicDialogConfig);
//   private ref = inject(DynamicDialogRef);

//   rawData: any = {};
//   title: string = 'Record Details';
//   recordId: string = 'N/A';
//   totalFields: number = 0;

//   searchTerm: string = '';
//   isFilterEmpty: boolean = false;

//   // Processed Data
//   rootProps: any[] = [];
//   objectSections: any[] = [];
//   arraySections: any[] = [];

//   // Filtered Data
//   filteredRootProps: any[] = [];
//   filteredObjects: any[] = [];
//   filteredArrays: any[] = [];

//   ngOnInit() {
//     this.rawData = this.config.data || {};
//     this.parseMetadata();
//     this.processData(this.rawData);
//     this.filterData();
//   }

//   close() {
//     this.ref.close();
//   }

//   copyToClipboard(text: string) {
//     if (!text || text === '—') return;
//     navigator.clipboard.writeText(text);
//   }

//   /* === DATA LOGIC (Same as before) === */
//   private parseMetadata() {
//     const keys = Object.keys(this.rawData).map(k => k.toLowerCase());
//     const idKey = keys.find(k => k === 'id' || k === '_id' || k.endsWith('id'));
//     if (idKey) {
//       const realKey = Object.keys(this.rawData).find(k => k.toLowerCase() === idKey);
//       this.recordId = this.rawData[realKey || ''];
//     }
//     const titleKey = keys.find(k => k.includes('name') || k.includes('title') || k.includes('code'));
//     if (titleKey) {
//       const realKey = Object.keys(this.rawData).find(k => k.toLowerCase() === titleKey);
//       this.title = this.rawData[realKey || ''] || 'Record Details';
//     }
//   }

//   private processData(obj: any) {
//     if (!obj) return;
//     this.totalFields = Object.keys(obj).length;

//     Object.keys(obj).forEach(key => {
//       const val = obj[key];
//       if (Array.isArray(val)) {
//         if (val.length && typeof val[0] === 'object') {
//           this.arraySections.push({ key, label: this.formatLabel(key), cols: Object.keys(val[0]).slice(0, 8), data: val });
//         } else {
//           this.rootProps.push(this.createProp(key, val.join(', ')));
//         }
//       } else if (typeof val === 'object' && val !== null) {
//         const childProps = Object.keys(val).map(k => this.createProp(k, val[k]));
//         if (childProps.length) {
//           this.objectSections.push({ key, label: this.formatLabel(key), props: childProps });
//         }
//       } else {
//         this.rootProps.push(this.createProp(key, val));
//       }
//     });
//   }

//   filterData() {
//     const term = this.searchTerm.toLowerCase().trim();
//     if (!term) {
//       this.filteredRootProps = [...this.rootProps];
//       this.filteredObjects = [...this.objectSections];
//       this.filteredArrays = [...this.arraySections];
//       this.isFilterEmpty = false;
//       return;
//     }
//     this.filteredRootProps = this.rootProps.filter(p => p.label.toLowerCase().includes(term) || String(p.formattedValue).toLowerCase().includes(term));
//     this.filteredObjects = this.objectSections.map(sec => {
//       const matchTitle = sec.label.toLowerCase().includes(term);
//       const matchingProps = sec.props.filter((p: any) => p.label.toLowerCase().includes(term) || String(p.formattedValue).toLowerCase().includes(term));
//       if (matchTitle) return sec;
//       return matchingProps.length ? { ...sec, props: matchingProps } : null;
//     }).filter(s => s !== null);
//     this.filteredArrays = this.arraySections.filter(arr => arr.label.toLowerCase().includes(term));
//     this.isFilterEmpty = !this.filteredRootProps.length && !this.filteredObjects.length && !this.filteredArrays.length;
//   }

//   private createProp(key: string, val: any) {
//     let type = 'text';
//     let formatted = val;
//     const isCode = /id|code|guid|uuid/i.test(key);
//     const isEmpty = val === null || val === undefined || val === '';

//     if (isEmpty) { formatted = '—'; }
//     else if (typeof val === 'boolean') { type = 'boolean'; }
//     else if (this.isImageUrl(val)) { type = 'image'; }
//     else if (this.isDate(key, val)) { type = 'date'; formatted = new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
//     else if (['status', 'state', 'type'].includes(key.toLowerCase())) { type = 'status'; }
//     else if (this.isCurrency(key) && typeof val === 'number') { formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val); }

//     return { key, label: this.formatLabel(key), value: val, formattedValue: formatted, type, isCode, isEmpty };
//   }

//   formatLabel(str: string): string {
//     return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/_/g, ' ').trim();
//   }

//   getStatusSeverity(status: string): string {
//     const s = String(status).toLowerCase();
//     if (/active|paid|approved|success|completed/.test(s)) return 'success';
//     if (/pending|draft|processing|warning/.test(s)) return 'warning';
//     if (/rejected|failed|deleted|inactive|cancelled/.test(s)) return 'danger';
//     return 'info';
//   }

//   formatSimple(val: any, key: string): string {
//     if (val === null || val === undefined) return '<span class="is-empty">—</span>';
//     if (typeof val === 'boolean') return val ? 'Yes' : 'No';
//     if (this.isDate(key, val)) return new Date(val).toLocaleDateString();
//     return String(val);
//   }

//   private isDate(key: string, val: any): boolean {
//     if (typeof val !== 'string' || !val) return false;
//     const isDateKey = /date|time|at$/i.test(key);
//     const isIso = /^\d{4}-\d{2}-\d{2}/.test(val);
//     return (isDateKey || isIso) && !isNaN(Date.parse(val));
//   }

//   private isImageUrl(val: any): boolean {
//     return typeof val === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i.test(val);
//   }

//   private isCurrency(key: string): boolean {
//     return /price|cost|amount|total|balance/i.test(key);
//   }
// }
