import { Component, ViewEncapsulation } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-master-cell-editor',
  standalone: true,
  encapsulation: ViewEncapsulation.None, // Required for clean ::ng-deep style override within Grid
  imports: [
    CommonModule, FormsModule,
    InputTextModule, InputNumberModule, SelectModule,
    DatePickerModule, CheckboxModule
  ],
  template: `
    <div class="master-editor-root">
      @switch (config.type) {
        
        @case ('number') {
          <p-inputNumber 
            [ngModel]="value" 
            (ngModelChange)="onValueChange($event)"
            mode="decimal" 
            [minFractionDigits]="config.minFractionDigits ?? 0"
            [maxFractionDigits]="config.maxFractionDigits ?? 2"
            styleClass="compact-input-number" 
            [inputStyleClass]="'compact-input'" />
        }

        @case ('select') {
          <p-select 
            [options]="config.options || []"
            [ngModel]="value"
            (ngModelChange)="onValueChange($event)"
            [optionLabel]="config.optionLabel || 'label'"
            [optionValue]="config.optionValue || 'value'"
            appendTo="body"
            styleClass="compact-select"
            [panelStyleClass]="'compact-dropdown-panel'" />
        }

        @case ('boolean') {
           <div class="checkbox-wrapper">
             <p-checkbox 
               [ngModel]="value" 
               (ngModelChange)="onValueChange($event)" 
               [binary]="true"
               styleClass="compact-checkbox" />
           </div>
        }

        @case ('date') {
          <p-datepicker 
            [ngModel]="value" 
            (ngModelChange)="onValueChange($event)"
            appendTo="body"
            dateFormat="dd/mm/yy" 
            styleClass="compact-datepicker"
            [inputStyleClass]="'compact-input'"
            [panelStyleClass]="'compact-datepicker-panel'" />
        }

        @default {
          <input pInputText 
            [ngModel]="value" 
            (ngModelChange)="onValueChange($event)"
            class="compact-input"
            (keydown.enter)="onEnter()" />
        }
      }
    </div>
  `,
  styles: [`
    /* ==========================================================================
       COMPONENT ROOT
       ========================================================================== */
    .master-editor-root {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 1px; /* Tiny offset to prevent border clipping */
    }

    /* ==========================================================================
       SHARED INPUT STYLES (Text, Number, Date)
       Tokens: --font-size-base, --bg-primary, --border-primary
       ========================================================================== */
    .compact-input {
      width: 100%;
      height: var(--row-height, 32px); /* Matches Grid Row Height */
      
      /* Typography */
      font-family: var(--font-body);
      font-size: var(--font-size-base); 
      color: var(--text-primary);
      
      /* Visuals */
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: 4px 8px; /* Compact Padding */
      
      /* Transitions */
      transition: var(--transition-colors), var(--transition-shadow);

      /* States */
      &:enabled:hover {
        border-color: var(--border-secondary);
      }

      &:enabled:focus {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
        outline: none;
      }

      &::placeholder {
        color: var(--text-tertiary);
      }
    }

    /* ==========================================================================
       PRIME NG COMPONENT OVERRIDES
       ========================================================================== */
    
    /* 1. NUMBER INPUT WRAPPER */
    .compact-input-number {
      width: 100%;
      height: 100%;
      .p-inputnumber-input {
        @extend .compact-input; /* Reuse shared styles */
        text-align: right; /* Numbers align right usually */
      }
    }

    /* 2. SELECT (DROPDOWN) */
    .compact-select {
      width: 100%;
      height: var(--row-height, 32px);
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      display: flex;
      align-items: center;
      transition: var(--transition-colors);

      /* Label Text */
      .p-select-label {
        font-family: var(--font-body);
        font-size: var(--font-size-base);
        color: var(--text-primary);
        padding: 4px 8px;
        white-space: nowrap;
      }

      /* Trigger Icon */
      .p-select-trigger {
        width: 24px;
        color: var(--text-tertiary);
      }

      /* Focus State */
      &.p-focus {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
      }
    }

    /* 3. DATE PICKER WRAPPER */
    .compact-datepicker {
      width: 100%;
      height: 100%;
      .p-datepicker-trigger {
         display: none; /* Often hidden in grids to save space, remove if needed */
      }
    }

    /* 4. CHECKBOX */
    .checkbox-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .compact-checkbox {
      .p-checkbox-box {
        width: 18px; 
        height: 18px;
        border-radius: var(--ui-border-radius-sm);
        border: 1px solid var(--border-secondary);
        background: var(--bg-primary);
        
        &.p-highlight {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        
        &:hover {
          border-color: var(--accent-hover);
        }
      }
    }

    /* ==========================================================================
       POPUP PANELS (Appended to Body)
       Refined Shadows & Borders
       ========================================================================== */
    .compact-dropdown-panel, 
    .compact-datepicker-panel {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-xl);
      
      .p-select-item, .p-datepicker-header, .p-datepicker-calendar {
         font-family: var(--font-body);
         font-size: var(--font-size-base);
      }
      
      /* Highlight Color */
      .p-select-item.p-highlight {
         color: var(--accent-primary);
         background: var(--accent-focus); 
      }
    }
  `]
})
export class MasterCellEditorComponent implements ICellRendererAngularComp {
  params: any;
  config: any;
  value: any;

  agInit(params: any): void {
    this.params = params;
    this.config = params.cellConfig || {}; // Safety check
    this.value = params.value; 
  }

  refresh(params: any): boolean {
    this.params = params;
    this.value = params.value; 
    return true;
  }

  onValueChange(val: any) {
    this.value = val;
    
    const parent = this.params.context.componentParent;
    const rowId = this.params.node.id;
    const field = this.params.colDef.field;

    if (parent && rowId && field) {
      parent.updateDraft(rowId, field, val);
    }
  }

  onEnter() {
    const parent = this.params.context.componentParent;
    if (parent) {
        parent.handleRowAction('save', this.params.data);
    }
  }
}