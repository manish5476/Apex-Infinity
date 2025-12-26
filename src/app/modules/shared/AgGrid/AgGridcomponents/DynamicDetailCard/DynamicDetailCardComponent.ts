import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DomSanitizer } from '@angular/platform-browser';

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
    TabViewModule
  ],
  // Encapsulation None to easily override PrimeNG tab styles inside the glass container
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="detail-container theme-glass">
      
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
        
        <p-tabView styleClass="glass-tabs">
          
          <p-tabPanel header="Visual View">
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
          </p-tabPanel>

          <p-tabPanel header="Raw JSON">
            <div class="json-viewer custom-scrollbar">
              <pre>{{ rawData | json }}</pre>
            </div>
          </p-tabPanel>

        </p-tabView>
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
        <p-tag [value]="prop.value" [severity]="getStatusSeverity(prop.value)"></p-tag>
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
    /* === CONTAINER === */
    .detail-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    /* === HEADER === */
    .glass-header {
      padding: var(--spacing-xl) var(--spacing-2xl);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary);
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
      width: 48px;
      height: 48px;
      background: var(--bg-ternary);
      border-radius: var(--ui-border-radius-lg);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border-secondary);
      i { font-size: 1.5rem; color: var(--accent-primary); }
    }

    .title-stack h1 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      margin: 0 0 4px 0;
      color: var(--text-primary);
    }

    .meta-badges {
      display: flex; gap: var(--spacing-md);
      
      .id-badge {
        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        background: var(--bg-ternary);
        padding: 2px 8px;
        border-radius: 4px;
        color: var(--text-secondary);
      }
      .count-badge {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
      }
    }

    .header-controls {
      display: flex;
      gap: var(--spacing-lg);
      align-items: center;
    }

    /* Search Input */
    .search-wrapper {
      position: relative;
      width: 300px;
      
      .search-icon {
        position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
        color: var(--text-tertiary);
      }
      
      .glass-input {
        width: 100%;
        padding-left: 36px;
        background: var(--bg-ternary);
        border: 1px solid var(--border-secondary);
        border-radius: 20px;
        font-size: var(--font-size-sm);
        transition: all 0.2s;
        
        &:focus {
          background: var(--bg-primary);
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--accent-focus);
        }
      }
    }

    .close-btn {
      background: transparent; border: none; font-size: 1.25rem;
      color: var(--text-secondary); cursor: pointer;
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
      
      &:hover { background: var(--bg-error-light, #fee2e2); color: var(--color-error); }
    }

    /* === BODY === */
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

    /* === DATA GROUPS === */
    .group-title {
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: var(--font-weight-bold);
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--border-secondary);
      padding-bottom: var(--spacing-sm);
    }

    /* Grid Layout for Primitives */
    .primitive-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--spacing-lg);
    }

    /* Data Card Style */
    .data-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--accent-primary);
        
        .copy-icon { opacity: 1; }
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
        color: var(--text-primary);
        word-break: break-word;
        line-height: 1.5;
        font-weight: var(--font-weight-normal);
      }

      .copy-icon {
        position: absolute; top: 12px; right: 12px;
        font-size: 0.8rem; color: var(--accent-primary);
        opacity: 0; transition: opacity 0.2s;
      }
    }

    /* === RENDERERS === */
    .code-font { font-family: var(--font-mono); font-size: 0.9em; color: var(--text-primary); }
    .is-empty { color: var(--text-tertiary); font-style: italic; }
    .date-val { display: flex; align-items: center; gap: 6px; color: var(--text-primary); }
    
    .image-preview {
      position: relative; width: 100%; height: 120px;
      border-radius: var(--ui-border-radius); overflow: hidden;
      border: 1px solid var(--border-secondary);
      img { width: 100%; height: 100%; object-fit: cover; }
      a {
        position: absolute; bottom: 6px; right: 6px;
        background: rgba(0,0,0,0.6); color: white;
        width: 24px; height: 24px; border-radius: 4px;
        display: flex; align-items: center; justify-content: center;
      }
    }

    .bool-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 2px 10px; border-radius: 12px; font-size: var(--font-size-xs); font-weight: 600;
      &.true { background: var(--bg-success-light, #dcfce7); color: var(--color-success); }
      &.false { background: var(--bg-error-light, #fee2e2); color: var(--color-error); }
    }

    /* === TABLE SECTIONS === */
    .table-wrapper {
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
    }
    
    .table-header-row {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md);
      .row-count { font-size: var(--font-size-xs); background: var(--bg-ternary); padding: 2px 8px; border-radius: 12px; }
    }

    /* PrimeNG Table Overrides within ViewEncapsulation.None */
    .glass-table .p-datatable-thead > tr > th {
      background: var(--bg-ternary) !important;
      color: var(--text-secondary) !important;
      font-size: var(--font-size-xs) !important;
      text-transform: uppercase;
      border-bottom: 1px solid var(--border-secondary) !important;
      padding: var(--spacing-md) var(--spacing-lg) !important;
    }
    .glass-table .p-datatable-tbody > tr > td {
      background: var(--bg-secondary) !important;
      color: var(--text-primary) !important;
      border-bottom: 1px solid var(--border-secondary) !important;
      padding: var(--spacing-md) var(--spacing-lg) !important;
      font-size: var(--font-size-sm) !important;
    }

    /* === JSON VIEWER === */
    .json-viewer {
      padding: var(--spacing-xl);
      background: var(--bg-ternary);
      border-radius: var(--ui-border-radius-lg);
      margin: var(--spacing-xl);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      overflow: auto;
    }

    .empty-filter {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 4rem; color: var(--text-tertiary); gap: 1rem;
      i { font-size: 2rem; }
    }

    /* === TAB OVERRIDES === */
    .glass-tabs .p-tabview-nav {
      background: transparent !important;
      border-bottom: 1px solid var(--border-primary) !important;
      padding-left: var(--spacing-2xl) !important;
    }
    .glass-tabs .p-tabview-nav li .p-tabview-nav-link {
      background: transparent !important;
      border: none !important;
      color: var(--text-secondary) !important;
      font-weight: 600 !important;
      border-bottom: 2px solid transparent !important;
      padding: 1rem 1.5rem !important;
    }
    .glass-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
      color: var(--accent-primary) !important;
      border-bottom-color: var(--accent-primary) !important;
    }
    .glass-tabs .p-tabview-panels {
      background: transparent !important;
      padding: 0 !important;
    }
  `]
})
export class DynamicDetailTableComponent implements OnInit {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private sanitizer = inject(DomSanitizer);

  rawData: any = {};
  title: string = 'Record Details';
  recordId: string = 'N/A';
  totalFields: number = 0;
  
  searchTerm: string = '';
  isFilterEmpty: boolean = false;

  // Processed Data (Original)
  rootProps: any[] = [];
  objectSections: any[] = [];
  arraySections: any[] = [];

  // Filtered Data (Displayed)
  filteredRootProps: any[] = [];
  filteredObjects: any[] = [];
  filteredArrays: any[] = [];

  ngOnInit() {
    this.rawData = this.config.data || {};
    this.parseMetadata();
    this.processData(this.rawData);
    this.filterData(); // Initial display
  }

  close() {
    this.ref.close();
  }

  copyToClipboard(text: string) {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    // Ideally trigger a toast here if ToastService was injected
  }

  // === PARSING LOGIC ===

  private parseMetadata() {
    // Attempt to guess ID and Title
    const keys = Object.keys(this.rawData).map(k => k.toLowerCase());
    
    // Find ID
    const idKey = keys.find(k => k === 'id' || k === '_id' || k.endsWith('id'));
    if (idKey) {
      const realKey = Object.keys(this.rawData).find(k => k.toLowerCase() === idKey);
      this.recordId = this.rawData[realKey || ''];
    }

    // Find Title (Name, Code, Title)
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
          // Array of objects -> Table
          this.arraySections.push({
            key,
            label: this.formatLabel(key),
            cols: Object.keys(val[0]).slice(0, 8), // Limit columns for visual sanity
            data: val
          });
        } else {
          // Simple array -> Join string
          this.rootProps.push(this.createProp(key, val.join(', ')));
        }
      } 
      else if (typeof val === 'object' && val !== null) {
        // Nested Object
        const childProps = Object.keys(val).map(k => this.createProp(k, val[k]));
        if (childProps.length) {
          this.objectSections.push({
            key,
            label: this.formatLabel(key),
            props: childProps
          });
        }
      } 
      else {
        // Primitive
        this.rootProps.push(this.createProp(key, val));
      }
    });
  }

  // === FILTERING LOGIC ===

  filterData() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredRootProps = [...this.rootProps];
      this.filteredObjects = [...this.objectSections];
      this.filteredArrays = [...this.arraySections];
      this.isFilterEmpty = false;
      return;
    }

    // Filter Roots
    this.filteredRootProps = this.rootProps.filter(p => 
      p.label.toLowerCase().includes(term) || 
      String(p.formattedValue).toLowerCase().includes(term)
    );

    // Filter Objects (Keep section if title matches OR nested props match)
    this.filteredObjects = this.objectSections.map(sec => {
      const matchTitle = sec.label.toLowerCase().includes(term);
      const matchingProps = sec.props.filter((p: any) => 
        p.label.toLowerCase().includes(term) || 
        String(p.formattedValue).toLowerCase().includes(term)
      );
      
      if (matchTitle) return sec; // Show full section if title matches
      return matchingProps.length ? { ...sec, props: matchingProps } : null;
    }).filter(s => s !== null);

    // Filter Arrays (Search by Title Only for now to avoid rendering cost)
    this.filteredArrays = this.arraySections.filter(arr => 
      arr.label.toLowerCase().includes(term)
    );

    this.isFilterEmpty = 
      !this.filteredRootProps.length && 
      !this.filteredObjects.length && 
      !this.filteredArrays.length;
  }

  // === HELPERS ===

  private createProp(key: string, val: any) {
    let type = 'text';
    let formatted = val;
    const isCode = /id|code|guid|uuid/i.test(key);
    const isEmpty = val === null || val === undefined || val === '';

    if (isEmpty) {
      formatted = '—';
    } else if (typeof val === 'boolean') {
      type = 'boolean';
    } else if (this.isImageUrl(val)) {
      type = 'image';
    } else if (this.isDate(key, val)) {
      type = 'date';
      formatted = new Date(val).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
      });
    } else if (['status', 'state', 'type'].includes(key.toLowerCase())) {
      type = 'status';
    } else if (this.isCurrency(key) && typeof val === 'number') {
      formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    }

    return {
      key,
      label: this.formatLabel(key),
      value: val,
      formattedValue: formatted,
      type,
      isCode,
      isEmpty
    };
  }

  formatLabel(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  }

  // Status Color Logic
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
    // Simple ISO check
    const isIso = /^\d{4}-\d{2}-\d{2}/.test(val);
    return (isDateKey || isIso) && !isNaN(Date.parse(val));
  }

  private isImageUrl(val: any): boolean {
    return typeof val === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i.test(val);
  }

  private isCurrency(key: string): boolean {
    return /price|cost|amount|total|balance/i.test(key);
  }
}// import { Component, inject, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TableModule } from 'primeng/table';
// import { TagModule } from 'primeng/tag';
// import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// /**
//  * Universal JSON Viewer for Records
//  * Can render any depth of object/array structure cleanly.
//  */
// @Component({
//   standalone: true,
//   selector: 'app-dynamic-detail-table',
//   imports: [CommonModule, TableModule, TagModule],
//   template: `
//     <div class="detail-wrapper theme-glass">

//       <header class="detail-header">
//         <div class="title-group">
//           <h1>Record Details</h1>
//           <p class="subtitle">System Record ID: {{ recordId || 'N/A' }}</p>
//         </div>
//         <button class="close-btn" (click)="close()" title="Close (Esc)">
//           <i class="pi pi-times"></i>
//         </button>
//       </header>

//       <div class="detail-body custom-scrollbar">
        
//         @if (rootProps.length) {
//           <section class="data-section">
//             <h3 class="section-title">General Information</h3>
//             <div class="kv-grid">
//               @for (prop of rootProps; track prop.key) {
//                 <div class="kv-item">
//                   <label>{{ prop.label }}</label>
//                   <div class="value-container">
//                     <ng-container *ngTemplateOutlet="valueRenderer; context: { $implicit: prop }"></ng-container>
//                   </div>
//                 </div>
//               }
//             </div>
//           </section>
//         }

//         @for (section of objectSections; track section.key) {
//           <section class="data-section">
//             <h3 class="section-title">{{ section.label }}</h3>
//             <div class="kv-grid">
//               @for (prop of section.props; track prop.key) {
//                 <div class="kv-item">
//                   <label>{{ prop.label }}</label>
//                   <div class="value-container">
//                     <ng-container *ngTemplateOutlet="valueRenderer; context: { $implicit: prop }"></ng-container>
//                   </div>
//                 </div>
//               }
//             </div>
//           </section>
//         }

//         @for (list of arraySections; track list.key) {
//           <section class="data-section full-width">
//             <div class="section-header">
//               <h3 class="section-title">{{ list.label }}</h3>
//               <span class="badge">{{ list.count }} items</span>
//             </div>

//             @if (list.data.length) {
//               <p-table [value]="list.data" [styleClass]="'p-datatable-sm detail-grid'" responsiveLayout="scroll">
//                 <ng-template pTemplate="header">
//                   <tr>
//                     @for (col of list.cols; track col) {
//                       <th>{{ col }}</th>
//                     }
//                   </tr>
//                 </ng-template>
//                 <ng-template pTemplate="body" let-row>
//                   <tr>
//                     @for (col of list.cols; track col) {
//                       <td>
//                         <ng-container *ngTemplateOutlet="simpleValueRenderer; context: { val: row[col], key: col }"></ng-container>
//                       </td>
//                     }
//                   </tr>
//                 </ng-template>
//               </p-table>
//             } @else {
//               <div class="empty-state">No records found.</div>
//             }
//           </section>
//         }

//       </div>
//     </div>

//     <ng-template #valueRenderer let-prop>
//       @if (prop.type === 'image') {
//         <img [src]="prop.value" class="data-thumb" (click)="previewImage(prop.value)" alt="Preview">
//       } 
//       @else if (prop.type === 'boolean') {
//         <p-tag [value]="prop.value ? 'Yes' : 'No'" [severity]="prop.value ? 'success' : 'danger'" styleClass="mini-tag"></p-tag>
//       }
//       @else if (prop.type === 'color') {
//         <div class="color-swatch" [style.background-color]="prop.value"></div> <span>{{ prop.value }}</span>
//       }
//       @else {
//         <span [class.text-muted]="prop.isEmpty" [class.font-mono]="prop.isCode">{{ prop.formattedValue }}</span>
//       }
//     </ng-template>

//     <ng-template #simpleValueRenderer let-val="val" let-key="key">
//         <span [innerHTML]="formatSimple(val, key)"></span>
//     </ng-template>
//   `,
//   styles: [`
//     /* === LAYOUT === */
//     .detail-wrapper {
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//       background: var(--bg-primary);
//       color: var(--text-primary);
//       border-radius: var(--ui-border-radius-lg);
//       overflow: hidden;
//     }

//     .detail-body {
//       flex: 1;
//       overflow-y: auto;
//       padding: var(--spacing-2xl);
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-3xl);
//     }

//     /* === HEADER === */
//     .detail-header {
//       padding: var(--spacing-xl) var(--spacing-2xl);
//       background: var(--bg-secondary);
//       border-bottom: var(--ui-border-width) solid var(--border-primary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       flex-shrink: 0;

//       h1 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0; color: var(--text-primary); }
//       .subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; font-family: var(--font-mono); }
      
//       .close-btn {
//         background: transparent; border: none; color: var(--text-secondary);
//         width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
//         display: flex; align-items: center; justify-content: center;
//         transition: var(--transition-fast);
//         &:hover { background: var(--bg-ternary); color: var(--text-primary); }
//       }
//     }

//     /* === SECTIONS === */
//     .section-title {
//       font-size: var(--font-size-xs);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       font-weight: var(--font-weight-bold);
//       color: var(--text-tertiary);
//       margin-bottom: var(--spacing-lg);
//       border-bottom: var(--ui-border-width) solid var(--border-secondary);
//       padding-bottom: var(--spacing-sm);
//       display: flex; align-items: center; justify-content: space-between;
//     }

//     .badge {
//       background: var(--bg-ternary);
//       padding: 2px 8px;
//       border-radius: 12px;
//       font-size: 10px;
//       color: var(--text-secondary);
//     }

//     /* === KEY-VALUE GRID === */
//     .kv-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
//       gap: var(--spacing-xl) var(--spacing-2xl);
//     }

//     .kv-item {
//       display: flex;
//       flex-direction: column;
//       gap: 4px;

//       label { font-size: var(--font-size-xs); color: var(--text-secondary); font-weight: var(--font-weight-medium); }
//       .value-container { font-size: var(--font-size-sm); color: var(--text-primary); word-break: break-word; line-height: 1.5; min-height: 20px; }
//     }

//     /* === HELPERS === */
//     .text-muted { color: var(--text-tertiary); font-style: italic; }
//     .font-mono { font-family: var(--font-mono); font-size: 0.9em; color: var(--accent-primary); }
    
//     .data-thumb {
//       height: 40px; width: auto; border-radius: 4px; border: 1px solid var(--border-secondary); cursor: zoom-in;
//       &:hover { border-color: var(--accent-primary); }
//     }

//     .color-swatch {
//       display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); margin-right: 6px; vertical-align: middle;
//     }

//     /* === PRIME TABLE OVERRIDES === */
//     :host ::ng-deep .detail-grid .p-datatable-header { display: none; }
//     :host ::ng-deep .detail-grid .p-datatable-thead > tr > th {
//       background: var(--bg-ternary);
//       color: var(--text-secondary);
//       font-size: var(--font-size-xs);
//       padding: var(--spacing-md);
//       font-weight: 600;
//       border-bottom: 1px solid var(--border-secondary);
//     }
//     :host ::ng-deep .detail-grid .p-datatable-tbody > tr > td {
//       padding: var(--spacing-md);
//       font-size: var(--font-size-sm);
//       border-bottom: 1px solid var(--border-secondary);
//       color: var(--text-primary);
//     }
//     .empty-state {
//       padding: var(--spacing-xl); text-align: center; color: var(--text-tertiary); font-size: var(--font-size-sm); background: var(--bg-ternary); border-radius: var(--ui-border-radius);
//     }
//   `]
// })
// export class DynamicDetailTableComponent implements OnInit {
//   private ref = inject(DynamicDialogRef);
//   private cfg = inject(DynamicDialogConfig);

//   data: any = {};
//   recordId: string = '';

//   // Processed Data
//   rootProps: any[] = [];
//   objectSections: any[] = [];
//   arraySections: any[] = [];

//   ngOnInit() {
//     this.data = this.cfg.data || {};
//     // Try to find a display ID (common patterns: id, _id, code, number)
//     this.recordId = this.data.id || this.data._id || this.data.code || this.data.invoiceNumber || '';
    
//     this.parseData(this.data);
//   }

//   close() {
//     this.ref.close();
//   }

//   previewImage(url: string) {
//     window.open(url, '_blank');
//   }

//   // --- CORE PARSER ---
//   private parseData(obj: any) {
//     if (!obj) return;

//     Object.keys(obj).forEach(key => {
//       const val = obj[key];
      
//       // 1. Array handling (Table)
//       if (Array.isArray(val)) {
//         if (val.length > 0 && typeof val[0] === 'object') {
//           // Array of Objects -> Table
//           this.arraySections.push({
//             key,
//             label: this.toLabel(key),
//             count: val.length,
//             cols: Object.keys(val[0]), // Get columns from first item
//             data: val
//           });
//         } else {
//           // Array of Primitives -> Comma separated string
//           this.rootProps.push(this.createProp(key, val.join(', ')));
//         }
//       }
//       // 2. Object handling (Recursive Section)
//       else if (typeof val === 'object' && val !== null) {
//         // Flatten simple nested objects (like {id:1, name:'John'}) into main grid if small?
//         // For now, let's keep them as sections for clarity.
//         const childProps = Object.keys(val).map(k => this.createProp(k, val[k]));
        
//         if (childProps.length > 0) {
//           this.objectSections.push({
//             key,
//             label: this.toLabel(key),
//             props: childProps
//           });
//         }
//       }
//       // 3. Primitive handling (Root Field)
//       else {
//         this.rootProps.push(this.createProp(key, val));
//       }
//     });
//   }

//   private createProp(key: string, val: any) {
//     const isImg = this.isImageUrl(val);
//     const isColor = this.isColor(val);
//     const isBool = typeof val === 'boolean';
    
//     let formatted = val;
//     let type = 'text';

//     if (val === null || val === undefined || val === '') {
//       formatted = '—';
//     } else if (isBool) {
//       type = 'boolean';
//     } else if (isImg) {
//       type = 'image';
//     } else if (isColor) {
//       type = 'color';
//     } else if (this.isDate(key, val)) {
//       formatted = new Date(val).toLocaleDateString('en-IN', {
//         day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
//       });
//     } else if (this.isCurrency(key) && typeof val === 'number') {
//       formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
//     }

//     return {
//       key,
//       label: this.toLabel(key),
//       value: val,
//       formattedValue: formatted,
//       type,
//       isEmpty: val === null || val === undefined || val === '',
//       isCode: key.toLowerCase().includes('id') || key.toLowerCase().includes('code')
//     };
//   }

//   // --- UTILS ---
//   private toLabel(str: string): string {
//     return str
//       .replace(/([A-Z])/g, ' $1') // Space before Caps
//       .replace(/^./, s => s.toUpperCase()) // Uppercase first
//       .replace(/_/g, ' ') // Underscore to space
//       .trim();
//   }

//   private isDate(key: string, val: any): boolean {
//     if (typeof val !== 'string') return false;
//     // Check key name for hints OR regex ISO date
//     const isDateKey = /date|time|at$/i.test(key);
//     const isIsoFormat = /^\d{4}-\d{2}-\d{2}/.test(val);
//     return isDateKey && isIsoFormat && !isNaN(Date.parse(val));
//   }

//   private isCurrency(key: string): boolean {
//     return /price|cost|amount|total|balance/i.test(key);
//   }

//   private isImageUrl(val: any): boolean {
//     return typeof val === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(val);
//   }

//   private isColor(val: any): boolean {
//     return typeof val === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(val);
//   }

//   // Simple formatter for table cells
//   formatSimple(val: any, key: string): string {
//     if (val === null || val === undefined) return '<span class="text-muted">—</span>';
//     if (typeof val === 'boolean') return val ? 'Yes' : 'No';
//     if (this.isDate(key, val)) {
//         return new Date(val).toLocaleDateString('en-IN');
//     }
//     return String(val);
//   }
// }
// // import { Component, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { TableModule } from 'primeng/table';
// // import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// // @Component({
// //   standalone: true,
// //   selector: 'app-dynamic-detail-table',
// //   imports: [CommonModule, TableModule],
// //   template: `
// //     <div class="detail-wrapper theme-glass">

// //       <!-- HEADER -->
// //       <header class="detail-header">
// //         <div>
// //           <h1>Record details</h1>
// //           <p>Structured system data</p>
// //         </div>
// //         <button class="close-btn" (click)="close()">×</button>
// //       </header>

// //       <!-- ROOT TABLE -->
// //       <section class="table-section">
// //         <p-table
// //           [value]="rootRows"
// //           [tableStyle]="{ 'min-width': '100%' }"
// //           class="detail-table"
// //         >
// //           <ng-template pTemplate="header">
// //             <tr>
// //               <th>Field</th>
// //               <th>Value</th>
// //             </tr>
// //           </ng-template>

// //           <ng-template pTemplate="body" let-row>
// //             <tr>
// //               <td class="cell-label">{{ row.label }}</td>
// //               <td class="cell-value">{{ row.value }}</td>
// //             </tr>
// //           </ng-template>
// //         </p-table>
// //       </section>

// //       <!-- OBJECT SECTIONS -->
// //       @for (section of objectSections; track section.key) {
// //         <section class="table-section">
// //           <h2>{{ section.title }}</h2>

// //           <p-table
// //             [value]="section.rows"
// //             [tableStyle]="{ 'min-width': '100%' }"
// //             class="detail-table"
// //           >
// //             <ng-template pTemplate="header">
// //               <tr>
// //                 <th>Field</th>
// //                 <th>Value</th>
// //               </tr>
// //             </ng-template>

// //             <ng-template pTemplate="body" let-row>
// //               <tr>
// //                 <td class="cell-label">{{ row.label }}</td>
// //                 <td class="cell-value">{{ row.value }}</td>
// //               </tr>
// //             </ng-template>
// //           </p-table>
// //         </section>
// //       }

// //       <!-- ARRAY SECTIONS -->
// //       @for (section of arraySections; track section.key) {
// //         <section class="table-section">
// //           <h2>{{ section.title }}</h2>

// //           @for (table of section.tables; track $index) {
// //             <div class="array-block">
// //               <div class="array-title">Item {{ $index + 1 }}</div>

// //               <p-table
// //                 [value]="table"
// //                 [tableStyle]="{ 'min-width': '100%' }"
// //                 class="detail-table"
// //               >
// //                 <ng-template pTemplate="header">
// //                   <tr>
// //                     <th>Field</th>
// //                     <th>Value</th>
// //                   </tr>
// //                 </ng-template>

// //                 <ng-template pTemplate="body" let-row>
// //                   <tr>
// //                     <td class="cell-label">{{ row.label }}</td>
// //                     <td class="cell-value">{{ row.value }}</td>
// //                   </tr>
// //                 </ng-template>
// //               </p-table>
// //             </div>
// //           }
// //         </section>
// //       }

// //     </div>
// //   `,
// //   styles: [`
// // /* =========================================================
// //    WRAPPER
// // ========================================================= */
// // .detail-wrapper {
// //   height: 100%;
// //   display: flex;
// //   flex-direction: column;
// //   background: var(--bg-primary);
// //   color: var(--text-primary);
// // }

// // /* =========================================================
// //    HEADER
// // ========================================================= */
// // .detail-header {
// //   padding: var(--spacing-2xl) var(--spacing-3xl);
// //   border-bottom: var(--ui-border-width) solid var(--component-divider);
// //   display: flex;
// //   justify-content: space-between;
// //   align-items: center;
// // }

// // .detail-header h1 {
// //   margin: 0;
// //   font-size: var(--font-size-lg);
// //   font-weight: var(--font-weight-semibold);
// // }

// // .detail-header p {
// //   margin: 2px 0 0;
// //   font-size: var(--font-size-xs);
// //   color: var(--text-tertiary);
// // }

// // .close-btn {
// //   width: 28px;
// //   height: 28px;
// //   border: none;
// //   background: transparent;
// //   font-size: var(--font-size-lg);
// //   color: var(--text-secondary);
// //   cursor: pointer;
// //   border-radius: var(--ui-border-radius-sm);
// // }
// // .close-btn:hover {
// //   background: var(--component-bg-hover);
// // }

// // /* =========================================================
// //    SECTIONS
// // ========================================================= */
// // .table-section {
// //   padding: var(--spacing-3xl);
// // }

// // .table-section h2 {
// //   margin-bottom: var(--spacing-lg);
// //   font-size: var(--font-size-md);
// //   font-weight: var(--font-weight-semibold);
// // }

// // /* =========================================================
// //    TABLE (PRIME OVERRIDE)
// // ========================================================= */
// // :host ::ng-deep .detail-table {
// //   border: var(--ui-border-width) solid var(--component-divider);
// //   border-radius: var(--ui-border-radius);
// //   overflow: hidden;
// //   background: var(--bg-secondary);
// // }

// // :host ::ng-deep .detail-table th {
// //   background: var(--bg-ternary);
// //   color: var(--text-secondary);
// //   font-size: var(--font-size-xs);
// //   font-weight: var(--font-weight-semibold);
// //   text-transform: uppercase;
// //   padding: var(--spacing-lg);
// //   border-bottom: var(--ui-border-width) solid var(--component-divider);
// // }

// // :host ::ng-deep .detail-table td {
// //   padding: var(--spacing-lg);
// //   font-size: var(--font-size-sm);
// //   border-bottom: var(--ui-border-width) solid var(--component-divider);
// // }

// // :host ::ng-deep .detail-table tr:nth-child(even) td {
// //   background: var(--bg-ternary);
// // }

// // /* =========================================================
// //    CELLS
// // ========================================================= */
// // .cell-label {
// //   font-weight: var(--font-weight-medium);
// //   color: var(--text-primary);
// //   width: 35%;
// // }

// // .cell-value {
// //   color: var(--text-secondary);
// //   line-height: var(--line-height-relaxed);
// //   word-break: break-word;
// // }

// // /* =========================================================
// //    ARRAY
// // ========================================================= */
// // .array-block {
// //   margin-bottom: var(--spacing-3xl);
// // }

// // .array-title {
// //   font-size: var(--font-size-xs);
// //   font-weight: var(--font-weight-medium);
// //   color: var(--text-tertiary);
// //   margin-bottom: var(--spacing-sm);
// // }
// //   `]
// // })
// // export class DynamicDetailTableComponent {

// //   private ref = inject(DynamicDialogRef);
// //   private cfg = inject(DynamicDialogConfig);

// //   private data = this.cfg.data ?? {};

// //   rootRows = this.toRows(this.data, true);
// //   objectSections = this.getObjectSections();
// //   arraySections = this.getArraySections();

// //   close() {
// //     this.ref.close();
// //   }

// //   /* ===============================
// //      DATA TRANSFORM
// //   =============================== */

// //   private toRows(obj: any, root = false) {
// //     return Object.entries(obj)
// //       .filter(([_, v]) => typeof v !== 'object' || v === null)
// //       .map(([k, v]) => ({
// //         label: this.label(k),
// //         value: this.format(k, v)
// //       }));
// //   }

// //   private getObjectSections() {
// //     return Object.entries(this.data)
// //       .filter(([_, v]) => this.isObject(v))
// //       .map(([k, v]: any) => ({
// //         key: k,
// //         title: this.label(k),
// //         rows: this.toRows(v)
// //       }));
// //   }

// //   private getArraySections() {
// //     return Object.entries(this.data)
// //       .filter(([_, v]) => Array.isArray(v))
// //       .map(([k, arr]: any) => ({
// //         key: k,
// //         title: this.label(k),
// //         tables: arr.map((item: any) => this.toRows(item))
// //       }));
// //   }

// //   /* ===============================
// //      HELPERS
// //   =============================== */

// //   private isObject(v: any) {
// //     return typeof v === 'object' && v !== null && !Array.isArray(v);
// //   }

// //   private label(key: string) {
// //     return key
// //       .replace(/^_+/g, '')
// //       .replace(/[-_]/g, ' ')
// //       .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
// //       .replace(/\s+/g, ' ')
// //       .replace(/^./, s => s.toUpperCase());
// //   }

// //   private format(key: string, val: any) {
// //     if (val === null || val === undefined || val === '') return '—';

// //     if (key.toLowerCase().includes('date')) {
// //       const d = new Date(val);
// //       return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-IN');
// //     }

// //     if (/(amount|total|price|balance|tax)/i.test(key) && typeof val === 'number') {
// //       return new Intl.NumberFormat('en-IN', {
// //         style: 'currency',
// //         currency: 'INR'
// //       }).format(val);
// //     }

// //     if (typeof val === 'boolean') return val ? 'Yes' : 'No';

// //     return String(val);
// //   }
// // }
