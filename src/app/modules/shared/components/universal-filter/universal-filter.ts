import { Component, Input, OnInit, inject, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports (v18+)
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';

import { MasterListService } from '../../../../core/services/master-list.service';
import { FilterField } from './filter-config.interface';

@Component({
  selector: 'app-universal-filter',
  standalone: true,
  /* ViewEncapsulation.None is crucial here to allow our CSS variables 
     to penetrate PrimeNG's internal structures (popups, overlays) */
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, 
    FormsModule,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    DatePickerModule,
    CheckboxModule,
    RadioButtonModule
  ],
  template: `
    <div class="universal-filter-container">
      
      <div *ngFor="let field of config" class="filter-item" [ngClass]="field.styleClass">
        <label class="filter-label">{{ field.label }}</label>

        <ng-container *ngIf="field.type === 'text'">
          <p-iconField iconPosition="left" class="w-full">
            <p-inputIcon styleClass="pi pi-search theme-icon" />
            <input 
              pInputText 
              [placeholder]="field.placeholder || 'Search...'"
              [(ngModel)]="filters[field.key]"
              (ngModelChange)="onFilterChange()"
              class="w-full theme-control" />
          </p-iconField>
        </ng-container>

        <ng-container *ngIf="field.type === 'select'">
          <p-select 
            [options]="getOptions(field)"
            [optionLabel]="field.optionLabel || 'name'"
            [optionValue]="field.optionValue || '_id'"
            [placeholder]="field.placeholder || 'Select'"
            [(ngModel)]="filters[field.key]"
            (ngModelChange)="onFilterChange()"
            [showClear]="true"
            styleClass="w-full theme-control">
          </p-select>
        </ng-container>

        <ng-container *ngIf="field.type === 'multiselect'">
          <p-multiSelect 
            [options]="getOptions(field)"
            [optionLabel]="field.optionLabel || 'name'"
            [optionValue]="field.optionValue || '_id'"
            [placeholder]="field.placeholder || 'Select Multiple'"
            [(ngModel)]="filters[field.key]"
            (ngModelChange)="onFilterChange()"
            display="chip"
            styleClass="w-full theme-control">
          </p-multiSelect>
        </ng-container>

        <ng-container *ngIf="field.type === 'date'">
          <p-datepicker 
            [(ngModel)]="filters[field.key]" 
            (ngModelChange)="onFilterChange()"
            [placeholder]="field.placeholder || 'Select Date'"
            [showIcon]="true"
            styleClass="w-full theme-control"
            inputStyleClass="w-full theme-input-inner"
            dateFormat="yy-mm-dd">
          </p-datepicker>
        </ng-container>

        <ng-container *ngIf="field.type === 'date-range'">
          <p-datepicker 
            [(ngModel)]="filters[field.key]" 
            selectionMode="range" 
            [readonlyInput]="true"
            (ngModelChange)="onDateRangeChange($event, field.key)"
            [placeholder]="field.placeholder || 'Start - End'"
            [showIcon]="true"
            styleClass="w-full theme-control"
            inputStyleClass="w-full theme-input-inner"
            dateFormat="yy-mm-dd">
          </p-datepicker>
        </ng-container>

        <ng-container *ngIf="field.type === 'checkbox'">
          <div class="flex items-center gap-2 h-full pt-1 checkbox-wrapper">
            <p-checkbox 
              [(ngModel)]="filters[field.key]" 
              [binary]="true" 
              (ngModelChange)="onFilterChange()" 
              styleClass="theme-checkbox">
            </p-checkbox>
            <span class="checkbox-label" (click)="toggleCheckbox(field.key)">
              {{ field.placeholder || 'Enable' }}
            </span>
          </div>
        </ng-container>

        <ng-container *ngIf="field.type === 'radio'">
          <div class="flex gap-4 pt-2 radio-group">
            <div *ngFor="let opt of getOptions(field)" class="flex items-center gap-2">
              <p-radiobutton 
                [name]="field.key" 
                [value]="opt[field.optionValue || 'value']" 
                [(ngModel)]="filters[field.key]" 
                (ngModelChange)="onFilterChange()"
                styleClass="theme-radio">
              </p-radiobutton>
              <label class="radio-label" (click)="filters[field.key] = opt[field.optionValue || 'value']; onFilterChange()">
                {{ opt[field.optionLabel || 'label'] }}
              </label>
            </div>
          </div>
        </ng-container>

      </div>

      <div class="filter-actions" *ngIf="hasActiveFilters">
        <button pButton 
          label="Clear" 
          icon="pi pi-filter-slash" 
          class="p-button-outlined p-button-sm theme-btn-secondary"
          (click)="clearAll()">
        </button>
      </div>
    </div>
  `,
 styles: [`
    /* 1. MAIN CONTAINER LAYOUT */
    .universal-filter-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-lg);
      align-items: flex-end; /* Aligns inputs and buttons at the bottom */
      padding: var(--spacing-lg);
      
      /* Surface Card Styling */
      background-color: var(--bg-secondary); 
      border: var(--ui-border-width) solid var(--border-subtle);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-xl);
      
      /* Smooth transition for theme toggling */
      transition: background-color var(--transition-base), border-color var(--transition-base);
    }

    /* 2. INDIVIDUAL FIELD WRAPPER */
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs); /* Gap between label and input */
      min-width: 200px;
      flex: 1;
    }

    /* 3. LABEL TYPOGRAPHY */
    .filter-label {
      font-family: var(--font-heading);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    /* 4. BUTTON ALIGNMENT */
    .filter-actions {
      /* Visual fix to align button baseline with inputs */
      padding-bottom: 2px; 
    }

    /* 5. CUSTOM WRAPPERS (Helpers added in HTML) */
    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      height: 100%;
      /* Offset to align vertically with text inputs */
      padding-top: 4px; 
    }

    .radio-group {
      display: flex;
      gap: var(--spacing-lg);
      padding-top: var(--spacing-xs);
    }

    .checkbox-label, .radio-label {
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      cursor: pointer;
      user-select: none;
    }
  `]
})
export class UniversalFilterComponent implements OnInit {
  @Input() config: FilterField[] = [];
  @Input() entityType: string = 'generic';
  @Output() filterChange = new EventEmitter<any>();

  public masterList = inject(MasterListService);
  filters: any = {};

  get hasActiveFilters(): boolean {
    return Object.values(this.filters).some(x => x !== null && x !== '' && x !== undefined && (Array.isArray(x) ? x.length > 0 : true));
  }

  ngOnInit() {
    // 1. Defaults
    this.config.forEach(field => {
      if (field.defaultValue !== undefined) {
        this.filters[field.key] = field.defaultValue;
      }
    });

    // 2. Load Cache
    const savedFilters = this.masterList.getStoredFilters(this.entityType);
    if (savedFilters && Object.keys(savedFilters).length > 0) {
      this.config.forEach(field => {
        // Date Reconstruction
        if (field.type === 'date' || field.type === 'date-range') {
           const savedVal = savedFilters[field.key];
           if (savedVal) {
             if (Array.isArray(savedVal)) {
               this.filters[field.key] = savedVal.map((d:string) => d ? new Date(d) : null);
             } else {
               this.filters[field.key] = new Date(savedVal);
             }
           }
        } 
        // Logic for Checkboxes/Radio (ensure booleans aren't strings)
        else if (field.type === 'checkbox' && savedFilters[field.key] !== undefined) {
           this.filters[field.key] = savedFilters[field.key]; 
        }
        else {
           if(savedFilters[field.key] !== undefined) {
             this.filters[field.key] = savedFilters[field.key];
           }
        }
      });
    }
  }

  getOptions(field: FilterField): any[] {
    if (field.staticOptions) return field.staticOptions;
    if (field.dataSourceKey) {
      const service: any = this.masterList;
      if (typeof service[field.dataSourceKey] === 'function') {
        return service[field.dataSourceKey]() || [];
      }
    }
    return [];
  }

  onFilterChange() {
    this.emitAndStore();
  }

  onDateRangeChange(event: any, key: string) {
    this.emitAndStore();
  }

  toggleCheckbox(key: string) {
    this.filters[key] = !this.filters[key];
    this.emitAndStore();
  }

  clearAll() {
    this.filters = {};
    this.config.forEach(field => {
       if(field.defaultValue !== undefined) this.filters[field.key] = field.defaultValue;
    });
    this.masterList.clearFilters(this.entityType);
    this.filterChange.emit(this.filters);
  }

  private emitAndStore() {
    const cleanFilters = Object.entries(this.filters).reduce((acc, [k, v]) => {
      if (v !== null && v !== '' && v !== undefined) {
        if (Array.isArray(v) && v.length === 0) return acc;
        acc[k] = v;
      }
      return acc;
    }, {} as any);

    this.masterList.setFilters(this.entityType, cleanFilters);
    this.filterChange.emit(cleanFilters);
  }
}

// import { Component, Input, OnInit, inject, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // PrimeNG Imports
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { InputTextModule } from 'primeng/inputtext';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { ButtonModule } from 'primeng/button';
// import { DatePickerModule } from 'primeng/datepicker';
// import { CheckboxModule } from 'primeng/checkbox';
// import { RadioButtonModule } from 'primeng/radiobutton';

// import { MasterListService } from '../../../../core/services/master-list.service';
// import { FilterField } from './filter-config.interface';

// @Component({
//   selector: 'app-universal-filter',
//   standalone: true,
//   /* ViewEncapsulation.None allows us to override PrimeNG internal styles 
//      (like dropdown panels attached to body) using our theme tokens easily.
//   */
//   encapsulation: ViewEncapsulation.None,
//   imports: [
//     CommonModule, 
//     FormsModule,
//     SelectModule,
//     MultiSelectModule,
//     InputTextModule,
//     IconFieldModule,
//     InputIconModule,
//     ButtonModule,
//     DatePickerModule,
//     CheckboxModule,
//     RadioButtonModule
//   ],
//   template: `
//     <div class="universal-filter-container">
      
//       <div *ngFor="let field of config" class="filter-item" [ngClass]="field.styleClass">
//         <label class="filter-label">{{ field.label }}</label>

//         <ng-container *ngIf="field.type === 'text'">
//           <p-iconField iconPosition="left" class="w-full">
//             <p-inputIcon styleClass="pi pi-search" />
//             <input 
//               pInputText 
//               [placeholder]="field.placeholder || 'Search...'"
//               [(ngModel)]="filters[field.key]"
//               (ngModelChange)="onFilterChange()"
//               class="w-full theme-control" />
//           </p-iconField>
//         </ng-container>

//         <ng-container *ngIf="field.type === 'select'">
//           <p-select 
//             [options]="getOptions(field)"
//             [optionLabel]="field.optionLabel || 'name'"
//             [optionValue]="field.optionValue || '_id'"
//             [placeholder]="field.placeholder || 'Select'"
//             [(ngModel)]="filters[field.key]"
//             (ngModelChange)="onFilterChange()"
//             [showClear]="true"
//             styleClass="w-full theme-control">
//           </p-select>
//         </ng-container>

//         <ng-container *ngIf="field.type === 'multiselect'">
//           <p-multiSelect 
//             [options]="getOptions(field)"
//             [optionLabel]="field.optionLabel || 'name'"
//             [optionValue]="field.optionValue || '_id'"
//             [placeholder]="field.placeholder || 'Select Multiple'"
//             [(ngModel)]="filters[field.key]"
//             (ngModelChange)="onFilterChange()"
//             display="chip"
//             styleClass="w-full theme-control">
//           </p-multiSelect>
//         </ng-container>

//         <ng-container *ngIf="field.type === 'date'">
//           <p-datepicker 
//             [(ngModel)]="filters[field.key]" 
//             (ngModelChange)="onFilterChange()"
//             [placeholder]="field.placeholder || 'Select Date'"
//             [showIcon]="true"
//             styleClass="w-full theme-control"
//             inputStyleClass="w-full theme-input-inner"
//             dateFormat="yy-mm-dd">
//           </p-datepicker>
//         </ng-container>

//         <ng-container *ngIf="field.type === 'date-range'">
//           <p-datepicker 
//             [(ngModel)]="filters[field.key]" 
//             selectionMode="range" 
//             [readonlyInput]="true"
//             (ngModelChange)="onDateRangeChange($event, field.key)"
//             [placeholder]="field.placeholder || 'Start - End'"
//             [showIcon]="true"
//             styleClass="w-full theme-control"
//             inputStyleClass="w-full theme-input-inner"
//             dateFormat="yy-mm-dd">
//           </p-datepicker>
//         </ng-container>

//         <ng-container *ngIf="field.type === 'checkbox'">
//           <div class="flex items-center gap-2 h-full pt-1 checkbox-wrapper">
//             <p-checkbox 
//               [(ngModel)]="filters[field.key]" 
//               [binary]="true" 
//               (ngModelChange)="onFilterChange()" 
//               styleClass="theme-checkbox">
//             </p-checkbox>
//             <span class="checkbox-label" (click)="toggleCheckbox(field.key)">
//               {{ field.placeholder || 'Enable' }}
//             </span>
//           </div>
//         </ng-container>

//         <ng-container *ngIf="field.type === 'radio'">
//           <div class="flex gap-4 pt-2 radio-group">
//             <div *ngFor="let opt of getOptions(field)" class="flex items-center gap-2">
//               <p-radiobutton 
//                 [name]="field.key" 
//                 [value]="opt[field.optionValue || 'value']" 
//                 [(ngModel)]="filters[field.key]" 
//                 (ngModelChange)="onFilterChange()"
//                 styleClass="theme-radio">
//               </p-radiobutton>
//               <label class="radio-label" (click)="filters[field.key] = opt[field.optionValue || 'value']; onFilterChange()">
//                 {{ opt[field.optionLabel || 'label'] }}
//               </label>
//             </div>
//           </div>
//         </ng-container>

//       </div>

//       <div class="filter-actions" *ngIf="hasActiveFilters">
//         <button pButton 
//           label="Clear" 
//           icon="pi pi-filter-slash" 
//           class="p-button-outlined p-button-sm theme-btn-secondary"
//           (click)="clearAll()">
//         </button>
//       </div>
//     </div>
//   `,
//   styles: [`
//     /* 1. CONTAINER STYLING 
//       Uses --bg-surface (white in light, dark gray in dark) 
//       and --border-subtle for strict theme compliance.
//     */
//     .universal-filter-container {
//       display: flex;
//       flex-wrap: wrap;
//       gap: var(--spacing-lg);
//       align-items: flex-end;
//       padding: var(--spacing-lg);
//       background-color: var(--bg-surface); 
//       border: var(--ui-border-width) solid var(--border-subtle);
//       border-radius: var(--ui-border-radius-lg);
//       box-shadow: var(--shadow-sm);
//       margin-bottom: var(--spacing-xl);
//       transition: background-color var(--transition-base), border-color var(--transition-base);
//     }

//     .filter-item {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//       min-width: 200px;
//       flex: 1;
//     }

//     .filter-label {
//       font-family: var(--font-body);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-secondary); /* Adapts to light/dark text */
//     }

//     .filter-actions {
//       padding-bottom: 2px;
//     }

//     /* 2. PRIME-NG COMPONENT OVERRIDES 
//       We attach these to specific classes like .theme-control to ensure specificity.
//     */

//     /* INPUTS, SELECTS, MULTISELECTS, DATEPICKERS */
//     .p-inputtext, 
//     .p-select, 
//     .p-multiselect, 
//     .p-datepicker,
//     .theme-control {
//       background: var(--bg-app) !important; /* Slightly distinct from surface */
//       border: var(--ui-border-width) solid var(--border-subtle) !important;
//       color: var(--text-primary) !important;
//       border-radius: var(--ui-border-radius) !important;
//       font-family: var(--font-body) !important;
//       font-size: var(--font-size-sm) !important;
//       transition: border-color var(--transition-fast) !important;
//     }

//     /* Hover State */
//     .p-inputtext:hover, 
//     .p-select:hover, 
//     .p-multiselect:hover {
//       border-color: var(--color-primary-border) !important;
//     }

//     /* Focus State */
//     .p-inputtext:focus, 
//     .p-select.p-focus, 
//     .p-multiselect.p-focus,
//     .p-focus {
//       border-color: var(--color-primary) !important;
//       box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color) !important;
//     }

//     /* Placeholder Text */
//     ::placeholder, 
//     .p-placeholder {
//       color: var(--text-placeholder) !important;
//       opacity: 1; /* Fix for Firefox */
//     }

//     /* Icons inside inputs */
//     .p-icon, .pi {
//       color: var(--text-secondary) !important;
//       font-size: var(--font-size-sm) !important;
//     }

//     /* DROPDOWN PANELS / DATEPICKER PANELS (The Popups) */
//     .p-select-overlay, 
//     .p-multiselect-overlay, 
//     .p-datepicker-panel {
//       background: var(--bg-surface) !important;
//       border: var(--ui-border-width) solid var(--border-subtle) !important;
//       box-shadow: var(--shadow-xl) !important;
//       border-radius: var(--ui-border-radius-lg) !important;
//     }

//     /* Dropdown Items */
//     .p-select-item, .p-multiselect-item {
//       color: var(--text-primary) !important;
//       padding: var(--spacing-sm) var(--spacing-md) !important;
//       font-size: var(--font-size-sm) !important;
//     }
//     .p-select-item:hover, .p-multiselect-item:hover {
//       background: var(--color-gray-100) !important; /* Neutral hover */
//       color: var(--text-primary) !important;
//     }
//     .p-select-item.p-highlight, .p-multiselect-item.p-highlight {
//       background: var(--color-primary-subtle) !important;
//       color: var(--color-primary) !important;
//     }

//     /* 3. CHECKBOX & RADIO 
//     */
//     .p-checkbox .p-checkbox-box, 
//     .p-radiobutton .p-radiobutton-box {
//       width: 1.125rem !important;
//       height: 1.125rem !important;
//       border: var(--ui-border-width) solid var(--border-subtle) !important;
//       background: var(--bg-app) !important;
//       color: var(--text-primary) !important;
//       border-radius: var(--ui-border-radius-sm) !important;
//     }
//     .p-radiobutton .p-radiobutton-box {
//       border-radius: 50% !important;
//     }

//     /* Checked State */
//     .p-checkbox-checked .p-checkbox-box, 
//     .p-radiobutton-checked .p-radiobutton-box {
//       border-color: var(--color-primary) !important;
//       background: var(--color-primary) !important;
//       color: var(--color-on-primary) !important;
//     }

//     /* Labels for Check/Radio */
//     .checkbox-label, .radio-label {
//       font-size: var(--font-size-sm);
//       color: var(--text-primary);
//       cursor: pointer;
//       user-select: none;
//     }

//     /* 4. DATEPICKER SPECIFICS 
//     */
//     .p-datepicker-header {
//       background: var(--bg-surface) !important;
//       border-bottom: 1px solid var(--border-subtle) !important;
//       color: var(--text-primary) !important;
//     }
//     .p-datepicker table td > span {
//       color: var(--text-primary) !important;
//       font-size: var(--font-size-sm) !important;
//     }
//     .p-datepicker table td > span.p-highlight {
//       background: var(--color-primary) !important;
//       color: var(--color-on-primary) !important;
//     }

//     /* 5. CHIPS (MultiSelect tags)
//     */
//     .p-chip {
//       background: var(--color-gray-200) !important;
//       color: var(--text-primary) !important;
//       border-radius: var(--ui-border-radius-sm) !important;
//       font-size: var(--font-size-xs) !important;
//     }

//     /* 6. CLEAR BUTTON 
//     */
//     .theme-btn-secondary {
//       color: var(--text-secondary) !important;
//       border-color: var(--border-subtle) !important;
//       background: transparent !important;
//     }
//     .theme-btn-secondary:hover {
//       background: var(--color-gray-100) !important;
//       color: var(--text-primary) !important;
//       border-color: var(--text-secondary) !important;
//     }
//   `]
// })
// export class UniversalFilterComponent implements OnInit {
//   @Input() config: FilterField[] = [];
//   @Input() entityType: string = 'generic';
//   @Output() filterChange = new EventEmitter<any>();

//   public masterList = inject(MasterListService);
//   filters: any = {};

//   get hasActiveFilters(): boolean {
//     return Object.values(this.filters).some(x => x !== null && x !== '' && x !== undefined && (Array.isArray(x) ? x.length > 0 : true));
//   }

//   ngOnInit() {
//     // 1. Defaults
//     this.config.forEach(field => {
//       if (field.defaultValue !== undefined) {
//         this.filters[field.key] = field.defaultValue;
//       }
//     });

//     // 2. Load Cache
//     const savedFilters = this.masterList.getStoredFilters(this.entityType);
//     if (savedFilters && Object.keys(savedFilters).length > 0) {
//       this.config.forEach(field => {
//         // Date Reconstruction
//         if (field.type === 'date' || field.type === 'date-range') {
//            const savedVal = savedFilters[field.key];
//            if (savedVal) {
//              if (Array.isArray(savedVal)) {
//                this.filters[field.key] = savedVal.map((d:string) => d ? new Date(d) : null);
//              } else {
//                this.filters[field.key] = new Date(savedVal);
//              }
//            }
//         } 
//         // Logic for Checkboxes/Radio (ensure booleans aren't strings)
//         else if (field.type === 'checkbox' && savedFilters[field.key] !== undefined) {
//            this.filters[field.key] = savedFilters[field.key]; 
//         }
//         else {
//            if(savedFilters[field.key] !== undefined) {
//              this.filters[field.key] = savedFilters[field.key];
//            }
//         }
//       });
//     }
//   }

//   getOptions(field: FilterField): any[] {
//     if (field.staticOptions) return field.staticOptions;
//     if (field.dataSourceKey) {
//       const service: any = this.masterList;
//       if (typeof service[field.dataSourceKey] === 'function') {
//         return service[field.dataSourceKey]() || [];
//       }
//     }
//     return [];
//   }

//   onFilterChange() {
//     this.emitAndStore();
//   }

//   onDateRangeChange(event: any, key: string) {
//     this.emitAndStore();
//   }

//   toggleCheckbox(key: string) {
//     this.filters[key] = !this.filters[key];
//     this.emitAndStore();
//   }

//   clearAll() {
//     this.filters = {};
//     this.config.forEach(field => {
//        if(field.defaultValue !== undefined) this.filters[field.key] = field.defaultValue;
//     });
//     this.masterList.clearFilters(this.entityType);
//     this.filterChange.emit(this.filters);
//   }

//   private emitAndStore() {
//     const cleanFilters = Object.entries(this.filters).reduce((acc, [k, v]) => {
//       if (v !== null && v !== '' && v !== undefined) {
//         if (Array.isArray(v) && v.length === 0) return acc;
//         acc[k] = v;
//       }
//       return acc;
//     }, {} as any);

//     this.masterList.setFilters(this.entityType, cleanFilters);
//     this.filterChange.emit(cleanFilters);
//   }
// }

// // import { Component, Input, OnInit, inject, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';

// // // PrimeNG Imports (v18+)
// // import { SelectModule } from 'primeng/select';
// // import { MultiSelectModule } from 'primeng/multiselect';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { IconFieldModule } from 'primeng/iconfield';
// // import { InputIconModule } from 'primeng/inputicon';
// // import { ButtonModule } from 'primeng/button';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { RadioButtonModule } from 'primeng/radiobutton';

// // // Services
// // import { MasterListService } from '../../../../core/services/master-list.service';
// // import { FilterField } from './filter-config.interface';

// // @Component({
// //   selector: 'app-universal-filter',
// //   standalone: true,
// //   encapsulation: ViewEncapsulation.None, // Needed to penetrate PrimeNG styles with vars
// //   imports: [
// //     CommonModule, 
// //     FormsModule,
// //     SelectModule,
// //     MultiSelectModule,
// //     InputTextModule,
// //     IconFieldModule,
// //     InputIconModule,
// //     ButtonModule,
// //     DatePickerModule,
// //     CheckboxModule,
// //     RadioButtonModule
// //   ],
// //   template: `
// //     <div class="universal-filter-container">
      
// //       <div *ngFor="let field of config" class="filter-item" [ngClass]="field.styleClass">
// //         <label class="filter-label">{{ field.label }}</label>

// //         <ng-container *ngIf="field.type === 'text'">
// //           <p-iconField iconPosition="left" class="w-full">
// //             <p-inputIcon styleClass="pi pi-search" />
// //             <input 
// //               pInputText 
// //               [placeholder]="field.placeholder || 'Search...'"
// //               [(ngModel)]="filters[field.key]"
// //               (ngModelChange)="onFilterChange()"
// //               class="w-full theme-input" />
// //           </p-iconField>
// //         </ng-container>

// //         <ng-container *ngIf="field.type === 'select'">
// //           <p-select 
// //             [options]="getOptions(field)"
// //             [optionLabel]="field.optionLabel || 'name'"
// //             [optionValue]="field.optionValue || '_id'"
// //             [placeholder]="field.placeholder || 'Select'"
// //             [(ngModel)]="filters[field.key]"
// //             (ngModelChange)="onFilterChange()"
// //             [showClear]="true"
// //             styleClass="w-full theme-input">
// //           </p-select>
// //         </ng-container>

// //         <ng-container *ngIf="field.type === 'multiselect'">
// //           <p-multiSelect 
// //             [options]="getOptions(field)"
// //             [optionLabel]="field.optionLabel || 'name'"
// //             [optionValue]="field.optionValue || '_id'"
// //             [placeholder]="field.placeholder || 'Select Multiple'"
// //             [(ngModel)]="filters[field.key]"
// //             (ngModelChange)="onFilterChange()"
// //             display="chip"
// //             styleClass="w-full theme-input">
// //           </p-multiSelect>
// //         </ng-container>

// //         <ng-container *ngIf="field.type === 'date'">
// //           <p-datepicker 
// //             [(ngModel)]="filters[field.key]" 
// //             (ngModelChange)="onFilterChange()"
// //             [placeholder]="field.placeholder || 'Select Date'"
// //             [showIcon]="true"
// //             styleClass="w-full theme-input"
// //             inputStyleClass="w-full"
// //             dateFormat="yy-mm-dd">
// //           </p-datepicker>
// //         </ng-container>

// //         <ng-container *ngIf="field.type === 'date-range'">
// //           <p-datepicker 
// //             [(ngModel)]="filters[field.key]" 
// //             selectionMode="range" 
// //             [readonlyInput]="true"
// //             (ngModelChange)="onDateRangeChange($event, field.key)"
// //             [placeholder]="field.placeholder || 'Start - End'"
// //             [showIcon]="true"
// //             styleClass="w-full theme-input"
// //             inputStyleClass="w-full"
// //             dateFormat="yy-mm-dd">
// //           </p-datepicker>
// //         </ng-container>

// //         <ng-container *ngIf="field.type === 'checkbox'">
// //           <div class="flex items-center gap-2 h-full pt-1">
// //             <p-checkbox 
// //               [(ngModel)]="filters[field.key]" 
// //               [binary]="true" 
// //               (ngModelChange)="onFilterChange()" 
// //               styleClass="theme-checkbox">
// //             </p-checkbox>
// //             <span class="text-sm cursor-pointer" (click)="toggleCheckbox(field.key)">
// //               {{ field.placeholder || 'Enable' }}
// //             </span>
// //           </div>
// //         </ng-container>

// //         <ng-container *ngIf="field.type === 'radio'">
// //           <div class="flex gap-4 pt-2">
// //             <div *ngFor="let opt of getOptions(field)" class="flex items-center gap-2">
// //               <p-radiobutton 
// //                 [name]="field.key" 
// //                 [value]="opt[field.optionValue || 'value']" 
// //                 [(ngModel)]="filters[field.key]" 
// //                 (ngModelChange)="onFilterChange()">
// //               </p-radiobutton>
// //               <label class="text-sm cursor-pointer" (click)="filters[field.key] = opt[field.optionValue || 'value']; onFilterChange()">
// //                 {{ opt[field.optionLabel || 'label'] }}
// //               </label>
// //             </div>
// //           </div>
// //         </ng-container>

// //       </div>

// //       <div class="filter-actions" *ngIf="hasActiveFilters">
// //         <button pButton 
// //           label="Clear" 
// //           icon="pi pi-filter-slash" 
// //           class="p-button-outlined p-button-sm p-button-secondary theme-btn"
// //           (click)="clearAll()">
// //         </button>
// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     /* THEME OVERRIDES 
// //       Maps component styles directly to your Root CSS Variables 
// //     */
// //     .universal-filter-container {
// //       display: flex;
// //       flex-wrap: wrap;
// //       gap: var(--spacing-lg);
// //       align-items: flex-end;
// //       padding: var(--spacing-lg);
// //       background: var(--bg-surface);
// //       border: var(--ui-border-width) solid var(--border-subtle);
// //       border-radius: var(--ui-border-radius-lg);
// //       box-shadow: var(--shadow-sm);
// //       margin-bottom: var(--spacing-xl);
// //     }

// //     .filter-item {
// //       display: flex;
// //       flex-direction: column;
// //       gap: var(--spacing-xs);
// //       min-width: 200px;
// //       flex: 1;
// //     }

// //     .filter-label {
// //       font-family: var(--font-body);
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //       color: var(--text-secondary);
// //     }

// //     .filter-actions {
// //       padding-bottom: 2px;
// //     }

// //     /* --- PrimeNG Component Token Mapping --- */

// //     /* Inputs (Text, Select, Date, Multi) */
// //     .p-inputtext, 
// //     .p-select, 
// //     .p-multiselect, 
// //     .p-datepicker-input {
// //       font-family: var(--font-body) !important;
// //       font-size: var(--font-size-sm) !important;
// //       color: var(--text-primary) !important;
// //       background: var(--bg-app) !important;
// //       border: var(--ui-border-width) solid var(--border-subtle) !important;
// //       border-radius: var(--ui-border-radius) !important;
// //       padding: var(--spacing-sm) var(--spacing-md) !important;
// //       transition: var(--transition-base) !important;
// //     }

// //     .p-inputtext:hover, 
// //     .p-select:hover, 
// //     .p-multiselect:hover {
// //       border-color: var(--color-primary-border) !important;
// //     }

// //     .p-inputtext:focus, 
// //     .p-select-focus, 
// //     .p-multiselect-focus {
// //       border-color: var(--color-primary) !important;
// //       box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color) !important;
// //     }

// //     /* Placeholder Colors */
// //     .p-inputtext::placeholder { color: var(--text-placeholder) !important; }
// //     .p-select-label.p-placeholder { color: var(--text-placeholder) !important; }

// //     /* Icons */
// //     .p-icon, .pi { font-size: var(--font-size-sm) !important; color: var(--text-secondary) !important; }

// //     /* Checkbox & Radio */
// //     .p-checkbox-box, .p-radiobutton-box {
// //       border: var(--ui-border-width) solid var(--border-subtle) !important;
// //       background: var(--bg-app) !important;
// //       border-radius: var(--ui-border-radius-sm) !important;
// //       width: 1.25rem !important;
// //       height: 1.25rem !important;
// //     }
    
// //     .p-radiobutton-box { border-radius: 50% !important; }

// //     .p-checkbox-checked .p-checkbox-box, 
// //     .p-radiobutton-checked .p-radiobutton-box {
// //       background: var(--color-primary) !important;
// //       border-color: var(--color-primary) !important;
// //       color: var(--color-on-primary) !important;
// //     }

// //     /* DatePicker Overrides */
// //     .p-datepicker {
// //       background: var(--bg-surface) !important;
// //       border: var(--ui-border-width) solid var(--border-subtle) !important;
// //       border-radius: var(--ui-border-radius-lg) !important;
// //       box-shadow: var(--shadow-xl) !important;
// //       font-family: var(--font-body) !important;
// //     }
// //     .p-datepicker-header {
// //       background: var(--bg-surface) !important;
// //       border-bottom: 1px solid var(--border-subtle) !important;
// //     }
    
// //     /* Chips (MultiSelect) */
// //     .p-chip {
// //       background: var(--color-primary-subtle) !important;
// //       color: var(--color-primary) !important;
// //       border-radius: var(--ui-border-radius-sm) !important;
// //       font-size: var(--font-size-xs) !important;
// //       font-weight: var(--font-weight-medium) !important;
// //     }

// //     /* Buttons */
// //     .p-button.p-button-secondary {
// //       color: var(--text-secondary) !important;
// //       border-color: var(--border-subtle) !important;
// //     }
// //     .p-button.p-button-secondary:hover {
// //       background: var(--color-gray-100) !important;
// //       color: var(--text-primary) !important;
// //     }
// //   `]
// // })
// // export class UniversalFilterComponent implements OnInit {
// //   @Input() config: FilterField[] = [];
// //   @Input() entityType: string = 'generic';
// //   @Output() filterChange = new EventEmitter<any>();

// //   public masterList = inject(MasterListService);
// //   filters: any = {};

// //   get hasActiveFilters(): boolean {
// //     return Object.values(this.filters).some(x => x !== null && x !== '' && x !== undefined && (Array.isArray(x) ? x.length > 0 : true));
// //   }

// //   ngOnInit() {
// //     // 1. Set Defaults
// //     this.config.forEach(field => {
// //       if (field.defaultValue !== undefined) {
// //         this.filters[field.key] = field.defaultValue;
// //       }
// //     });

// //     // 2. Load Cached Filters
// //     const savedFilters = this.masterList.getStoredFilters(this.entityType);
// //     if (savedFilters && Object.keys(savedFilters).length > 0) {
// //       // Restore dates correctly (strings back to Date objects)
// //       this.config.forEach(field => {
// //         if (field.type === 'date' || field.type === 'date-range') {
// //            const savedVal = savedFilters[field.key];
// //            if (savedVal) {
// //              if (Array.isArray(savedVal)) {
// //                this.filters[field.key] = savedVal.map((d:string) => d ? new Date(d) : null);
// //              } else {
// //                this.filters[field.key] = new Date(savedVal);
// //              }
// //            }
// //         } else {
// //            if(savedFilters[field.key] !== undefined) {
// //              this.filters[field.key] = savedFilters[field.key];
// //            }
// //         }
// //       });
// //     }
// //   }

// //   /**
// //    * Helper to get options from either MasterList (Dynamic) or Config (Static)
// //    */
// //   getOptions(field: FilterField): any[] {
// //     // 1. Static Options
// //     if (field.staticOptions) {
// //       return field.staticOptions;
// //     }
// //     // 2. Dynamic Options (Signals)
// //     if (field.dataSourceKey) {
// //       const service: any = this.masterList;
// //       if (typeof service[field.dataSourceKey] === 'function') {
// //         return service[field.dataSourceKey]() || [];
// //       }
// //     }
// //     return [];
// //   }

// //   onFilterChange() {
// //     this.emitAndStore();
// //   }

// //   onDateRangeChange(event: any, key: string) {
// //     // PrimeNG returns [Date, Date] or [Date, null]
// //     this.emitAndStore();
// //   }

// //   toggleCheckbox(key: string) {
// //     this.filters[key] = !this.filters[key];
// //     this.emitAndStore();
// //   }

// //   clearAll() {
// //     this.filters = {};
// //     // Reset defaults if needed, otherwise clear
// //     this.config.forEach(field => {
// //        if(field.defaultValue !== undefined) this.filters[field.key] = field.defaultValue;
// //     });
    
// //     this.masterList.clearFilters(this.entityType);
// //     this.filterChange.emit(this.filters);
// //   }

// //   private emitAndStore() {
// //     // 1. Clean Data
// //     const cleanFilters = Object.entries(this.filters).reduce((acc, [k, v]) => {
// //       // Filter out null/undefined/empty string
// //       if (v !== null && v !== '' && v !== undefined) {
// //         // Handle Empty Arrays
// //         if (Array.isArray(v) && v.length === 0) return acc;
// //         acc[k] = v;
// //       }
// //       return acc;
// //     }, {} as any);

// //     // 2. Persist
// //     this.masterList.setFilters(this.entityType, cleanFilters);

// //     // 3. Emit
// //     this.filterChange.emit(cleanFilters);
// //   }
// // }


// // // import { Component, Input, OnInit, inject, signal, computed, Output, EventEmitter } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormsModule } from '@angular/forms';
// // // // PrimeNG Imports (Adjust based on your version)
// // // import { SelectModule } from 'primeng/select'; // or DropdownModule
// // // import { MultiSelectModule } from 'primeng/multiselect';
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { IconFieldModule } from 'primeng/iconfield';
// // // import { InputIconModule } from 'primeng/inputicon';
// // // import { ButtonModule } from 'primeng/button';
// // // import { MasterListService } from '../../../../core/services/master-list.service';
// // // import { DateFilterComponent } from '../../../invoice/analytics/date-filter/date-filter.component';
// // // import { FilterField } from './filter-config.interface';

// // // @Component({
// // //   selector: 'app-universal-filter',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule, 
// // //     FormsModule,
// // //     SelectModule,
// // //     MultiSelectModule,
// // //     InputTextModule,
// // //     IconFieldModule,
// // //     InputIconModule,
// // //     ButtonModule,
// // //     DateFilterComponent
// // //   ],
// // //   template: `
// // //     <div class="universal-filter-container">
      
// // //       <div *ngFor="let field of config" class="filter-item">
// // //         <label class="filter-label">{{ field.label }}</label>

// // //         <ng-container *ngIf="field.type === 'text'">
// // //           <p-iconField iconPosition="left">
// // //             <p-inputIcon styleClass="pi pi-search" />
// // //             <input 
// // //               pInputText 
// // //               [placeholder]="field.placeholder || 'Search...'"
// // //               [(ngModel)]="filters[field.key]"
// // //               (ngModelChange)="onFilterChange()"
// // //               class="w-full" />
// // //           </p-iconField>
// // //         </ng-container>

// // //         <ng-container *ngIf="field.type === 'select'">
// // //           <p-select 
// // //             [options]="getOptions(field.dataSourceKey)"
// // //             [optionLabel]="field.optionLabel || 'name'"
// // //             [optionValue]="field.optionValue || '_id'"
// // //             [placeholder]="field.placeholder || 'Select'"
// // //             [(ngModel)]="filters[field.key]"
// // //             (ngModelChange)="onFilterChange()"
// // //             [showClear]="true"
// // //             styleClass="w-full theme-select">
// // //           </p-select>
// // //         </ng-container>

// // //         <ng-container *ngIf="field.type === 'multiselect'">
// // //           <p-multiSelect 
// // //             [options]="getOptions(field.dataSourceKey)"
// // //             [optionLabel]="field.optionLabel || 'name'"
// // //             [optionValue]="field.optionValue || '_id'"
// // //             [placeholder]="field.placeholder || 'Select Multiple'"
// // //             [(ngModel)]="filters[field.key]"
// // //             (ngModelChange)="onFilterChange()"
// // //             display="chip"
// // //             styleClass="w-full theme-multiselect">
// // //           </p-multiSelect>
// // //         </ng-container>

// // //         <ng-container *ngIf="field.type === 'date-range'">
// // //           <app-date-filter
// // //             [startDate]="filters['startDate']"
// // //             [endDate]="filters['endDate']"
// // //             (dateChange)="onDateRangeChange($event)">
// // //           </app-date-filter>
// // //         </ng-container>
// // //       </div>

// // //       <div class="filter-actions" *ngIf="hasActiveFilters">
// // //         <button pButton 
// // //           label="Clear" 
// // //           icon="pi pi-filter-slash" 
// // //           class="p-button-outlined p-button-sm p-button-secondary"
// // //           (click)="clearAll()">
// // //         </button>
// // //       </div>
// // //     </div>
// // //   `,
// // //   styles: [`
// // //     :host { display: block; margin-bottom: 1rem; }
    
// // //     .universal-filter-container {
// // //       display: flex;
// // //       flex-wrap: wrap;
// // //       gap: 1rem;
// // //       align-items: flex-end;
// // //       padding: 1rem;
// // //       background: var(--surface-card, #fff);
// // //       border: 1px solid var(--surface-border, #dfe7ef);
// // //       border-radius: 8px;
// // //     }

// // //     .filter-item {
// // //       display: flex;
// // //       flex-direction: column;
// // //       gap: 0.5rem;
// // //       min-width: 200px;
// // //       flex: 1;
// // //     }

// // //     .filter-label {
// // //       font-size: 0.875rem;
// // //       font-weight: 500;
// // //       color: var(--text-color-secondary);
// // //     }

// // //     .filter-actions {
// // //       padding-bottom: 2px; /* Align with inputs */
// // //     }

// // //     /* PrimeNG Overrides for consistency */
// // //     ::ng-deep .theme-select, ::ng-deep .theme-multiselect {
// // //       width: 100%;
// // //     }
// // //   `]
// // // })
// // // export class UniversalFilterComponent implements OnInit {
// // //   // Inputs
// // //   @Input() config: FilterField[] = [];
// // //   @Input() entityType: string = 'generic'; // 'invoice', 'product', etc. used for caching
  
// // //   // Outputs (Optional, if parent needs to know)
// // //   @Output() filterChange = new EventEmitter<any>();

// // //   // Services
// // //   public masterList = inject(MasterListService);

// // //   // State
// // //   filters: any = {};
  
// // //   get hasActiveFilters(): boolean {
// // //     return Object.keys(this.filters).length > 0;
// // //   }

// // //   ngOnInit() {
// // //     // 1. Initialize Default Values
// // //     this.config.forEach(field => {
// // //       if (field.defaultValue) {
// // //         this.filters[field.key] = field.defaultValue;
// // //       }
// // //     });

// // //     // 2. Check LocalStorage/Service for existing filters for this entityType
// // //     const savedFilters = this.masterList.getStoredFilters(this.entityType);
// // //     if (savedFilters && Object.keys(savedFilters).length > 0) {
// // //       this.filters = { ...this.filters, ...savedFilters };
// // //     }
// // //   }

// // //   /**
// // //    * Dynamically retrieves the signal data from MasterListService
// // //    * e.g., if key is 'branches', it returns this.masterList.branches()
// // //    */
// // //   getOptions(dataSourceKey?: string): any[] {
// // //     if (!dataSourceKey) return [];
    
// // //     // Type-safe access to the service signals
// // //     const service: any = this.masterList;
// // //     if (typeof service[dataSourceKey] === 'function') {
// // //       // Execute the signal to get the array
// // //       return service[dataSourceKey]() || [];
// // //     }
// // //     return [];
// // //   }

// // //   onFilterChange() {
// // //     this.emitAndStore();
// // //   }

// // //   onDateRangeChange(event: any) {
// // //     this.filters['startDate'] = event.startDate;
// // //     this.filters['endDate'] = event.endDate;
// // //     this.emitAndStore();
// // //   }

// // //   clearAll() {
// // //     this.filters = {};
// // //     this.masterList.clearFilters(this.entityType);
// // //     this.filterChange.emit({});
// // //   }

// // //   private emitAndStore() {
// // //     // 1. Clean up undefined/null values
// // //     const cleanFilters = Object.entries(this.filters).reduce((acc, [k, v]) => {
// // //       if (v !== null && v !== '' && v !== undefined) acc[k] = v;
// // //       return acc;
// // //     }, {} as any);

// // //     // 2. Update Service State (This saves to localStorage and updates internal signal)
// // //     this.masterList.setFilters(this.entityType, cleanFilters);

// // //     // 3. Emit to parent (to trigger API reload)
// // //     this.filterChange.emit(cleanFilters);
// // //   }
// // // }