import { Component, Input, OnInit, inject, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { FilterStorageService } from '../../../../core/services/filter-storage.service';
import { MasterDropdownComponent } from '../masterFilterDropdown/master-dropdown.component';
import { FilterField } from './filter-config.interface';

@Component({
  selector: 'app-universal-filter',
  standalone: true,
  // ViewEncapsulation.None is REQUIRED to override PrimeNG internal styles
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule, SelectModule, MultiSelectModule,
    InputTextModule, IconFieldModule, InputIconModule, ButtonModule,
    DatePickerModule, CheckboxModule, RadioButtonModule, TooltipModule,
    MasterDropdownComponent
  ],
  template: `
    <div class="filter-deck">
      
      @for (field of config; track field.key) {
        <div class="deck-control-group" [ngClass]="field.styleClass">
          
          <label class="deck-label">{{ field.label }}</label>

          @if (field.type === 'text') {
            <p-iconField iconPosition="left" class="deck-field-wrapper">
              <p-inputIcon styleClass="pi pi-search text-xs" />
              <input 
                pInputText 
                [placeholder]="field.placeholder || 'Type to search...'"
                [(ngModel)]="filters[field.key]"
                (ngModelChange)="onFilterChange()"
                class="deck-input" />
            </p-iconField>
          }

          @if (field.type === 'select') {
            @if (field.dataSourceKey) {
              <app-master-dropdown 
                [endpoint]="field.dataSourceKey" 
                [(ngModel)]="filters[field.key]" 
                (onChangeEvent)="onFilterChange()"
                [placeholder]="field.placeholder || 'Select'">
              </app-master-dropdown>
            } @else {
              <p-select appendTo="body" 
                [options]="getOptions(field)"
                [optionLabel]="field.optionLabel || 'name'"
                [optionValue]="field.optionValue || '_id'"
                [placeholder]="field.placeholder || 'Select'"
                [(ngModel)]="filters[field.key]"
                (ngModelChange)="onFilterChange()"
                [showClear]="true"
                styleClass="deck-select"
                [filter]="true"
                [filterBy]="field.optionLabel || 'name'">
              </p-select>
            }
          }

          @if (field.type === 'multiselect') {
            @if (field.dataSourceKey) {
              <app-master-dropdown 
                [endpoint]="field.dataSourceKey" 
                [isMulti]="true"
                [(ngModel)]="filters[field.key]" 
                (onChangeEvent)="onFilterChange()"
                [placeholder]="field.placeholder || 'Select Multiple'">
              </app-master-dropdown>
            } @else {
              <p-multiSelect appendTo="body"
                [options]="getOptions(field)"
                [optionLabel]="field.optionLabel || 'name'"
                [optionValue]="field.optionValue || '_id'"
                [placeholder]="field.placeholder || 'Select Multiple'"
                [(ngModel)]="filters[field.key]"
                (ngModelChange)="onFilterChange()"
                display="chip"
                [showClear]="true"
                styleClass="deck-multiselect"
                [filter]="true"
                [filterBy]="field.optionLabel || 'name'">
              </p-multiSelect>
            }
          }

          @if (field.type === 'date') {
            <p-datepicker appendTo="body"
              [(ngModel)]="filters[field.key]" 
              (ngModelChange)="onFilterChange()"
              [placeholder]="field.placeholder || 'Date'"
              [showIcon]="true"
              styleClass="deck-date"
              dateFormat="yy-mm-dd">
            </p-datepicker>
          }

          @if (field.type === 'date-range') {
            <p-datepicker appendTo="body"
              [(ngModel)]="filters[field.key]" 
              selectionMode="range" 
              [readonlyInput]="true"
              (ngModelChange)="onDateRangeChange($event, field.key)"
              [placeholder]="field.placeholder || 'Start - End'"
              [showIcon]="true"
              styleClass="deck-date-range"
              dateFormat="yy-mm-dd">
            </p-datepicker>
          }

          @if (field.type === 'checkbox') {
            <div class="deck-checkbox-wrapper" (click)="toggleCheckbox(field.key)">
              <p-checkbox 
                [(ngModel)]="filters[field.key]" 
                [binary]="true" 
                (ngModelChange)="onFilterChange()" 
                styleClass="deck-checkbox">
              </p-checkbox>
              <span class="deck-checkbox-label">{{ field.placeholder || 'Enable' }}</span>
            </div>
          }

          @if (field.type === 'radio') {
            <div class="deck-radio-group">
              @for (opt of getOptions(field); track $index) {
                <div class="radio-item">
                  <p-radiobutton 
                    [name]="field.key" 
                    [value]="opt[field.optionValue || 'value']" 
                    [(ngModel)]="filters[field.key]" 
                    (ngModelChange)="onFilterChange()">
                  </p-radiobutton>
                  <label (click)="filters[field.key] = opt[field.optionValue || 'value']; onFilterChange()">
                    {{ opt[field.optionLabel || 'label'] }}
                  </label>
                </div>
              }
            </div>
          }

        </div>
      }

      @if (hasActiveFilters) {
        <div class="deck-actions">
          <div class="separator-vertical"></div>
          <button pButton 
            icon="pi pi-filter-slash" 
            pTooltip="Clear All"
            tooltipPosition="top"
            class="p-button-rounded p-button-text p-button-secondary clear-btn"
            (click)="clearAll()">
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    /* ==============================================
       THEME OVERRIDES FOR PRIMENG (COMMAND DECK)
       ============================================== */
    
    .filter-deck {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-xl);
      padding: 0; /* Container padding usually handled by parent glass-panel */
    }

    .deck-control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 160px;
    }

    .deck-label {
      font-size: 9px;
      font-weight: 800;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-left: 2px;
    }

    /* --- INPUT TEXT --- */
    .deck-input.p-inputtext {
      font-family: var(--font-body);
      font-size: 12px;
      padding: 8px 8px 8px 34px; /* Space for icon */
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      width: 100%;
      transition: all 0.2s;
    }
    .deck-input.p-inputtext:hover { border-color: var(--border-secondary); }
    .deck-input.p-inputtext:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-focus); }
    
    /* Icon alignment fix */
    .deck-field-wrapper .p-inputicon { top: 50%; margin-top: -6px; color: var(--text-tertiary); }

    /* --- SELECT & MULTISELECT --- */
    .deck-select, .deck-multiselect {
      width: 100%;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
    }

    /* Deep PrimeNG overrides for compact size */
    .deck-select .p-select-label, 
    .deck-multiselect .p-multiselect-label {
      padding: 8px 10px;
      font-size: 12px;
      color: var(--text-primary);
    }
    
    .deck-select .p-select-dropdown,
    .deck-multiselect .p-multiselect-trigger {
      width: 2rem;
      color: var(--text-tertiary);
    }

    .p-select:not(.p-disabled).p-focus,
    .p-multiselect:not(.p-disabled).p-focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-focus);
    }

    /* Dropdown Panel Styling */
    .p-select-panel, .p-multiselect-panel {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      box-shadow: var(--shadow-lg);
    }
    .p-select-list-container li, .p-multiselect-items li {
      font-size: 12px;
      padding: 8px 10px;
      color: var(--text-secondary);
    }
    .p-select-list-container li:hover, .p-multiselect-items li:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    .p-select-list-container li.p-highlight, .p-multiselect-items li.p-highlight {
      background: var(--accent-focus);
      color: var(--accent-primary);
    }

    /* Multiselect Chips */
    .p-multiselect-token {
      padding: 1px 6px;
      margin-right: 4px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-secondary);
      color: var(--text-primary);
      border-radius: 4px;
      font-size: 10px;
    }

    /* --- DATE PICKERS --- */
    .deck-date .p-inputtext, .deck-date-range .p-inputtext {
      padding: 8px 10px;
      font-size: 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      width: 100%;
    }
    /* Hide default PrimeNG trigger button if iconField is used inside, or style it */
    .p-datepicker-trigger {
        background: transparent;
        border: 1px solid var(--border-primary);
        border-left: none;
        color: var(--text-tertiary);
        width: 2.5rem;
    }

    /* --- CHECKBOX --- */
    .deck-checkbox-wrapper {
      display: flex; align-items: center; gap: 8px; cursor: pointer; padding-top: 8px;
    }
    .deck-checkbox-label { font-size: 12px; color: var(--text-primary); font-weight: 500; }
    
    .p-checkbox .p-checkbox-box {
      width: 16px; height: 16px;
      border-color: var(--border-secondary);
      background: var(--bg-primary);
    }
    .p-checkbox .p-checkbox-box.p-highlight {
      border-color: var(--accent-primary);
      background: var(--accent-primary);
    }

    /* --- ACTIONS --- */
    .deck-actions {
      display: flex; align-items: center; gap: var(--spacing-md);
      margin-top: 18px; /* Align with inputs */
    }
    .separator-vertical {
      width: 1px; height: 24px; background: var(--border-secondary);
    }
    .clear-btn { width: 32px; height: 32px; color: var(--text-secondary) !important; }
    .clear-btn:hover { background: var(--bg-ternary) !important; color: var(--color-error) !important; }

  `]
})
export class UniversalFilterComponent implements OnInit {
  @Input() config: FilterField[] = [];
  @Input() entityType: string = 'generic';
  @Output() filterChange = new EventEmitter<any>();

  // public masterList = inject(MasterListService);
  private filterStorage = inject(FilterStorageService);
  filters: any = {};

  get hasActiveFilters(): boolean {
    return Object.values(this.filters).some(x => x !== null && x !== '' && x !== undefined && (Array.isArray(x) ? x.length > 0 : true));
  }

  ngOnInit() {
    // 1. Set Defaults
    this.config.forEach(field => {
      if (field.defaultValue !== undefined) {
        this.filters[field.key] = field.defaultValue;
      }
    });

    // 2. Load from Cache (Optional, based on entityType)
    const savedFilters = this.filterStorage.getStoredFilters(this.entityType);
    if (savedFilters && Object.keys(savedFilters).length > 0) {
      this.config.forEach(field => {
        const savedVal = savedFilters[field.key];
        if (savedVal !== undefined && savedVal !== null) {
          // Rehydrate Dates
          if (field.type === 'date') {
            this.filters[field.key] = new Date(savedVal);
          } else if (field.type === 'date-range' && Array.isArray(savedVal)) {
            this.filters[field.key] = savedVal.map(d => d ? new Date(d) : null);
          } else {
            this.filters[field.key] = savedVal;
          }
        }
      });
    }

    this.emitAndStore();
  }

  getOptions(field: FilterField): any[] {
    if (field.staticOptions) return field.staticOptions;
    // if (field.dataSourceKey) {
    //   const service: any = this.masterList;
    //   if (typeof service[field.dataSourceKey] === 'function') {
    //     return service[field.dataSourceKey]() || [];
    //   }
    // }
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
      if (field.defaultValue !== undefined) this.filters[field.key] = field.defaultValue;
    });
    this.filterStorage.clearFilters(this.entityType);
    this.filterChange.emit(this.filters);
  }

  private emitAndStore() {
    // Clean null/empty values before emitting
    const cleanFilters = Object.entries(this.filters).reduce((acc, [k, v]) => {
      const field = this.config.find(item => item.key === k);

      if (field?.type === 'date-range') {
        const [start, end] = Array.isArray(v) ? v : [];
        const startKey = field.startKey || 'startDate';
        const endKey = field.endKey || 'endDate';

        // Backend list/report handlers normalize startDate/endDate across date fields.
        if (start) acc[startKey] = this.toIsoDate(start);
        if (end) acc[endKey] = this.toIsoDate(end);
        return acc;
      }

      if (field?.type === 'date') {
        if (v) acc[k] = this.toIsoDate(v);
        return acc;
      }

      if (v !== null && v !== '' && v !== undefined) {
        if (Array.isArray(v) && v.length === 0) return acc;
        acc[k] = v;
      }
      return acc;
    }, {} as any);

    this.filterStorage.setFilters(this.entityType, cleanFilters);
    this.filterChange.emit(cleanFilters);
  }

  private toIsoDate(value: any): string {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }
}
