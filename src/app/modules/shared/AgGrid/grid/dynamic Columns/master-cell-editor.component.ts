import { Component, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TagModule } from 'primeng/tag';

import { CellConfig, MasterEditorParams } from '../grid.types';

@Component({
  selector: 'app-master-cell-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
    DatePickerModule, CheckboxModule, TextareaModule, ColorPickerModule,
    TagModule
  ],
  styles: [`
    :host { 
      display: block; 
      width: 100%; 
      height: 100%; 
    }

    .editor-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 2px;
    }

    /* --- GLOBAL FULL-WIDTH OVERRIDES --- */
    // ::ng-deep .cell-editor-input {
    //   width: 100% !important; /* Force component to fill cell */
    //   display: flex !important;
    //   align-items: center;

    //   /* 1. INPUT TEXT & NUMBER */
    //   .p-inputtext {
    //     width: 100% !important; /* The actual input element */
    //     height: 28px !important;
    //     padding: 2px 6px !important;
    //     font-size: 13px !important;
    //     border: 1px solid transparent;
    //     background: transparent;
    //     border-radius: 4px;
    //     box-shadow: none !important;

    //     &:hover { background: var(--component-bg-hover); }
    //     &:focus { 
    //       background: var(--theme-bg-primary); 
    //       border-color: var(--theme-accent-primary);
    //     }
    //   }

    //   /* 2. INPUT NUMBER WRAPPER FIX */
    //   &.p-inputnumber {
    //     width: 100% !important;
    //     .p-inputtext { width: 100% !important; }
    //   }

    //   /* 3. SELECT & MULTISELECT (Dropdowns) */
    //   &.p-select, &.p-multiselect {
    //     width: 100% !important;
    //     height: 28px !important;
    //     border: 1px solid transparent;
    //     background: transparent;
        
    //     /* Label fills available space */
    //     .p-select-label, .p-multiselect-label {
    //       flex: 1; 
    //       padding: 2px 6px !important;
    //       font-size: 13px;
    //       line-height: 22px;
    //       white-space: nowrap;
    //       overflow: hidden;
    //       text-overflow: ellipsis;
    //     }

    //     /* Trigger sticks to right */
    //     .p-select-dropdown, .p-multiselect-trigger {
    //       width: 24px;
    //       flex-shrink: 0;
    //     }

    //     &:hover { background: var(--component-bg-hover); }
    //     &.p-focus { border-color: var(--theme-accent-primary); }
    //   }

    //   /* 4. DATEPICKER */
    //   &.p-datepicker {
    //     width: 100% !important;
    //     padding: 0;
    //     input { width: 100% !important; height: 28px !important; }
    //   }
    // }
  `],
  template: `
    <div class="editor-wrapper">
      @switch (config.type) {

        @case ('number') {
          <p-inputNumber [(ngModel)]="value" 
            styleClass="cell-editor-input" 
            [minFractionDigits]="2" mode="decimal" 
            (onInput)="onValueChange($event.value)" />
        }

        @case ('select') {
          <p-select appendTo="body" [(ngModel)]="value" 
            [options]="config.options ?? []"
            [optionLabel]="config.optionLabel || 'label'"
            [optionValue]="config.optionValue || 'value'"
            appendTo="body" styleClass="cell-editor-input"
            (onChange)="onValueChange($event.value)" />
        }

        @case ('multiselect') {
          <p-multiSelect [(ngModel)]="value" 
            [options]="config.options ?? []"
            [optionLabel]="config.optionLabel || 'label'"
            [optionValue]="config.optionValue || 'value'"
            appendTo="body" styleClass="cell-editor-input"
            (onChange)="onValueChange($event.value)" />
        }

        @case ('date') {
          <p-datepicker [(ngModel)]="value" 
            appendTo="body" styleClass="cell-editor-input" 
            dateFormat="dd/mm/yy"
            (onSelect)="onValueChange($event)" />
        }

        @case ('boolean') {
          <div class="flex justify-center w-full h-full items-center">
            <p-checkbox [(ngModel)]="value" binary="true" 
              (onChange)="onValueChange($event.checked)"></p-checkbox>
          </div>
        }

        @default {
          <input pInputText #input [(ngModel)]="value" 
            class="cell-editor-input"
            [placeholder]="config.placeholder || ''"
            (ngModelChange)="onValueChange($event)"
            (keydown.enter)="onEnterKey()" />
        }
      }
    </div>
  `
})
export class MasterCellEditorComponent implements ICellEditorAngularComp, AfterViewInit {
  @Input() set cellParams(params: MasterEditorParams) { this.agInit(params); }
  @ViewChild('input') input?: ElementRef;

  params!: MasterEditorParams;
  config!: CellConfig;
  value: any;

  agInit(params: MasterEditorParams): void {
    this.params = params;
    this.config = params.cellConfig || { type: 'text' };
    this.value = params.value;
  }

  getValue(): any { return this.value; }

  onValueChange(newValue: any) {
    this.value = newValue;
    if (this.params && this.params.node) {
      this.params.node.setDataValue(this.params.colDef.field!, newValue);
    }
  }

  onEnterKey() { this.params.api.stopEditing(); }
  
  isPopup(): boolean { return ['textarea', 'multiselect', 'color'].includes(this.config.type); }

  ngAfterViewInit(): void {
    if (this.config.type !== 'select' && this.config.type !== 'date') {
        setTimeout(() => this.input?.nativeElement?.focus());
    }
  }
}
// import { Component, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
// import { ICellEditorAngularComp } from 'ag-grid-angular';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { DatePickerModule } from 'primeng/datepicker';
// import { CheckboxModule } from 'primeng/checkbox';
// import { TextareaModule } from 'primeng/textarea';
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { TagModule } from 'primeng/tag';

// import { CellConfig, MasterEditorParams } from '../grid.types';

// @Component({
//   selector: 'app-master-cell-editor',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule,
//     InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
//     DatePickerModule, CheckboxModule, TextareaModule, ColorPickerModule,
//     TagModule
//   ],
//   styles: [`
//     :host { display: block; width: 100%; height: 100%; }

//     .editor-wrapper {
//       width: 100%;
//       height: 100%;
//       display: flex;
//       align-items: center;
//       /* Removes padding so input can fill cell cleanly */
//       padding: 0 2px; 
//     }

//     /* --- COMPACT INPUT OVERRIDES (Fits 40px Row) --- */
//     ::ng-deep .cell-editor-input {
//       width: 100%;
      
//       /* 1. TEXT INPUTS & NUMBER INPUTS */
//       .p-inputtext {
//         height: 28px !important;      /* Explicit Height */
//         padding: 2px 6px !important;  /* Tiny Padding */
//         font-size: 13px !important;
//         border: 1px solid transparent; /* Invisible border until focused */
//         background: transparent;
//         box-shadow: none !important;
//         border-radius: 4px;
//         width: 100%;

//         &:hover { background: var(--component-bg-hover); }
//         &:focus { 
//           background: var(--theme-bg-primary); 
//           border-color: var(--theme-accent-primary);
//         }
//       }

//       /* 2. SELECT & MULTISELECT (Dropdowns) */
//       &.p-select, &.p-multiselect {
//         height: 28px !important;
//         display: flex;
//         align-items: center;
//         border: 1px solid transparent;
//         background: transparent;
        
//         .p-select-label, .p-multiselect-label {
//           padding: 2px 6px !important;
//           font-size: 13px;
//           line-height: 22px; /* Vertically center text */
//         }

//         .p-select-dropdown, .p-multiselect-trigger {
//           width: 20px; /* Narrower trigger area */
          
//           svg { width: 10px; height: 10px; } /* Smaller Icon */
//         }

//         &:hover { background: var(--component-bg-hover); }
//         &.p-focus { border-color: var(--theme-accent-primary); }
//       }

//       /* 3. DATEPICKER */
//       &.p-datepicker {
//         padding: 0;
//         input { 
//            height: 28px !important; 
//            padding: 2px 6px !important; 
//         }
//       }
//     }
//   `],
//   template: `
//     <div class="editor-wrapper">
//       @switch (config.type) {

//         @case ('number') {
//           <p-inputNumber [(ngModel)]="value" styleClass="cell-editor-input" 
//             [minFractionDigits]="2" mode="decimal" 
//             (onInput)="onValueChange($event.value)" />
//         }

//         @case ('select') {
//           <p-select appendTo="body" [(ngModel)]="value" 
//             [options]="config.options ?? []"
//             [optionLabel]="config.optionLabel || 'label'"
//             [optionValue]="config.optionValue || 'value'"
//             appendTo="body" styleClass="cell-editor-input"
//             (onChange)="onValueChange($event.value)" />
//         }

//         @case ('multiselect') {
//           <p-multiSelect [(ngModel)]="value" 
//             [options]="config.options ?? []"
//             [optionLabel]="config.optionLabel || 'label'"
//             [optionValue]="config.optionValue || 'value'"
//             appendTo="body" styleClass="cell-editor-input"
//             (onChange)="onValueChange($event.value)" />
//         }

//         @case ('date') {
//           <p-datepicker [(ngModel)]="value" 
//             appendTo="body" styleClass="cell-editor-input" 
//             dateFormat="dd/mm/yy"
//             (onSelect)="onValueChange($event)" />
//         }

//         @case ('boolean') {
//           <div class="flex justify-center w-full h-full items-center">
//             <p-checkbox [(ngModel)]="value" binary="true" 
//               (onChange)="onValueChange($event.checked)"></p-checkbox>
//           </div>
//         }

//         @default {
//           <input pInputText #input [(ngModel)]="value" 
//             class="cell-editor-input"
//             [placeholder]="config.placeholder || ''"
//             (ngModelChange)="onValueChange($event)"
//             (keydown.enter)="onEnterKey()" />
//         }
//       }
//     </div>
//   `
// })
// export class MasterCellEditorComponent implements ICellEditorAngularComp, AfterViewInit {
//   @Input() set cellParams(params: MasterEditorParams) { this.agInit(params); }
//   @ViewChild('input') input?: ElementRef;

//   params!: MasterEditorParams;
//   config!: CellConfig;
//   value: any;

//   agInit(params: MasterEditorParams): void {
//     this.params = params;
//     this.config = params.cellConfig || { type: 'text' };
//     this.value = params.value;
//   }

//   getValue(): any { return this.value; }

//   onValueChange(newValue: any) {
//     this.value = newValue;
//     if (this.params && this.params.node) {
//       this.params.node.setDataValue(this.params.colDef.field!, newValue);
//     }
//   }

//   onEnterKey() { this.params.api.stopEditing(); }
  
//   isPopup(): boolean { return ['textarea', 'multiselect', 'color'].includes(this.config.type); }

//   ngAfterViewInit(): void {
//     if (this.config.type !== 'select' && this.config.type !== 'date') {
//         setTimeout(() => this.input?.nativeElement?.focus());
//     }
//   }
// }

// // import { Component, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
// // import { ICellEditorAngularComp } from 'ag-grid-angular';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';

// // // PrimeNG Imports
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { SelectModule } from 'primeng/select';
// // import { MultiSelectModule } from 'primeng/multiselect';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { TextareaModule } from 'primeng/textarea';
// // import { ColorPickerModule } from 'primeng/colorpicker';
// // import { TagModule } from 'primeng/tag';

// // import { CellConfig, MasterEditorParams } from '../grid.types';

// // @Component({
// //   selector: 'app-master-cell-editor',
// //   standalone: true,
// //   imports: [
// //     CommonModule, FormsModule,
// //     InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
// //     DatePickerModule, CheckboxModule, TextareaModule, ColorPickerModule,
// //     TagModule
// //   ],
// //   styles: [`
// //     :host { display: block; width: 100%; height: 100%; }
    
// //     /* Center content vertically in the cell */
// //     .editor-wrapper {
// //       width: 100%;
// //       height: 100%;
// //       display: flex;
// //       align-items: center;
// //       padding: 0 4px; /* Tiny padding from cell edge */
// //     }

// //     /* --- GLOBAL INPUT STYLING FOR GRID --- */
// //     ::ng-deep .cell-editor-input {
// //       width: 100%;
      
// //       /* Make inputs invisible until focused/hovered to blend with grid */
// //       .p-inputtext, .p-select, .p-multiselect {
// //         border: none; 
// //         background: transparent;
// //         font-family: var(--font-body);
// //         font-size: 13px; 
// //         color: var(--theme-text-primary);
// //         padding: 4px 8px; /* Compact padding */
// //         height: 32px; /* Fit inside 40px row */
// //         box-shadow: none !important; /* Remove default shadow */
// //         border-radius: var(--ui-border-radius-sm);

// //         &:hover {
// //           background: var(--component-bg-hover);
// //         }
// //         &:focus, &.p-focus {
// //           background: var(--theme-bg-primary);
// //           box-shadow: 0 0 0 2px var(--theme-accent-primary) !important; 
// //         }
// //       }
      
// //       /* Fix Dropdown Arrows */
// //       .p-select-dropdown, .p-multiselect-trigger {
// //         width: 24px;
// //         color: var(--theme-text-tertiary);
// //       }
// //     }
// //   `],
// //   template: `
// //     <div class="editor-wrapper">
// //       @switch (config.type) {

// //         @case ('number') {
// //           <p-inputNumber [(ngModel)]="value" class="cell-editor-input" 
// //             [minFractionDigits]="2" mode="decimal" 
// //             (onInput)="onValueChange($event.value)" />
// //         }

// //         @case ('textarea') {
// //           <textarea pTextarea [(ngModel)]="value" rows="3" 
// //             class="w-full h-full p-2 bg-primary border-primary text-sm rounded-md focus:border-accent"></textarea>
// //         }

// //         @case ('select') {
// //           <p-select appendTo="body" [(ngModel)]="value" 
// //             [options]="config.options ?? []"
// //             [optionLabel]="config.optionLabel || 'label'"
// //             [optionValue]="config.optionValue || 'value'"
// //             appendTo="body" class="cell-editor-input"
// //             (onChange)="onValueChange($event.value)" />
// //         }

// //         @case ('multiselect') {
// //           <p-multiSelect [(ngModel)]="value" 
// //             [options]="config.options ?? []"
// //             [optionLabel]="config.optionLabel || 'label'"
// //             [optionValue]="config.optionValue || 'value'"
// //             appendTo="body" class="cell-editor-input"
// //             (onChange)="onValueChange($event.value)" />
// //         }

// //         @case ('date') {
// //           <p-datepicker [(ngModel)]="value" 
// //             appendTo="body" class="cell-editor-input" 
// //             dateFormat="dd/mm/yy"
// //             (onSelect)="onValueChange($event)" />
// //         }

// //         @case ('boolean') {
// //           <div class="flex justify-center w-full">
// //             <p-checkbox [(ngModel)]="value" binary="true" 
// //               (onChange)="onValueChange($event.checked)"></p-checkbox>
// //           </div>
// //         }

// //         @case ('color') {
// //           <p-colorPicker [(ngModel)]="value" appendTo="body" (onChange)="onValueChange($event.value)"></p-colorPicker>
// //         }

// //         @default {
// //           <input pInputText #input [(ngModel)]="value" 
// //             class="cell-editor-input p-inputtext-sm"
// //             [placeholder]="config.placeholder || ''"
// //             (ngModelChange)="onValueChange($event)"
// //             (keydown.enter)="onEnterKey()" />
// //         }
// //       }
// //     </div>
// //   `
// // })
// // export class MasterCellEditorComponent implements ICellEditorAngularComp, AfterViewInit {
// //   @Input() set cellParams(params: MasterEditorParams) {
// //     this.agInit(params);
// //   }
// //   @ViewChild('input') input?: ElementRef;

// //   params!: MasterEditorParams;
// //   config!: CellConfig;
// //   value: any;

// //   agInit(params: MasterEditorParams): void {
// //     this.params = params;
// //     this.config = params.cellConfig || { type: 'text' };
// //     this.value = params.value;
// //   }

// //   getValue(): any {
// //     return this.value;
// //   }

// //   onValueChange(newValue: any) {
// //     this.value = newValue;
// //     // Immediate Update for "Save All" logic
// //     if (this.params && this.params.node) {
// //       this.params.node.setDataValue(this.params.colDef.field!, newValue);
// //     }
// //   }

// //   onEnterKey() {
// //     this.params.api.stopEditing(); // Commit edit
// //     // Optional: Trigger save action
// //     // this.params.context.onAction('save', this.params.data);
// //   }

// //   isPopup(): boolean {
// //     return ['textarea', 'multiselect', 'color'].includes(this.config.type);
// //   }

// //   ngAfterViewInit(): void {
// //     // Auto-focus standard inputs
// //     if (this.config.type !== 'select' && this.config.type !== 'date') {
// //         setTimeout(() => this.input?.nativeElement?.focus());
// //     }
// //   }
// // }

// // // import {
// // //   Component, ViewChild, ElementRef, AfterViewInit, Input
// // // } from '@angular/core';
// // // import { ICellEditorAngularComp } from 'ag-grid-angular';
// // // import { CommonModule } from '@angular/common';
// // // import { FormsModule } from '@angular/forms';

// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { InputNumberModule } from 'primeng/inputnumber';
// // // import { SelectModule } from 'primeng/select';
// // // import { MultiSelectModule } from 'primeng/multiselect';
// // // import { DatePickerModule } from 'primeng/datepicker';
// // // import { CheckboxModule } from 'primeng/checkbox';
// // // import { PasswordModule } from 'primeng/password';
// // // import { TextareaModule } from 'primeng/textarea';
// // // import { ColorPickerModule } from 'primeng/colorpicker';
// // // // import { InputSwitchModule } from 'primeng/inputswitch';
// // // // import { ChipsModule } from 'primeng/chips';

// // // import { CellConfig, MasterEditorParams } from '../grid.types';

// // // @Component({
// // //   selector: 'app-master-cell-editor',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     FormsModule,
// // //     InputTextModule,
// // //     InputNumberModule,
// // //     SelectModule,
// // //     MultiSelectModule,
// // //     DatePickerModule,
// // //     CheckboxModule,
// // //     PasswordModule,
// // //     TextareaModule,
// // //     ColorPickerModule,
// // //     // InputSwitchModule,
// // //     // ChipsModule
// // //   ],
// // //   template: `
// // //     <div class="w-full h-full flex items-center px-1">
// // //       @switch (config.type) {

// // //         @case ('number') {
// // //           <p-inputNumber [(ngModel)]="value" class="w-full" />
// // //         }

// // //         @case ('textarea') {
// // //           <textarea pTextarea [(ngModel)]="value" rows="3"
// // //             class="w-full h-full"></textarea>
// // //         }

// // //         @case ('select') {
// // //           <p-select appendTo="body" [(ngModel)]="value"
// // //             [options]="config.options ?? []"
// // //             [optionLabel]="config.optionLabel || 'label'"
// // //             [optionValue]="config.optionValue || 'value'"
// // //             appendTo="body" class="w-full" />
// // //         }

// // //         @case ('multiselect') {
// // //           <p-multiSelect [(ngModel)]="value"
// // //             [options]="config.options ?? []"
// // //             [optionLabel]="config.optionLabel || 'label'"
// // //             [optionValue]="config.optionValue || 'value'"
// // //             appendTo="body" class="w-full" />
// // //         }

// // //         @case ('date') {
// // //           <p-datepicker [(ngModel)]="value"
// // //             appendTo="body" class="w-full" />
// // //         }

// // //         @case ('boolean') {
// // //           <p-checkbox [(ngModel)]="value" binary="true"></p-checkbox>
// // //         }

// // //         @case ('switch') {
// // //           <p-inputSwitch [(ngModel)]="value"></p-inputSwitch>
// // //         }

// // //         @case ('color') {
// // //           <p-colorPicker [(ngModel)]="value"></p-colorPicker>
// // //         }

// // //         @case ('tags') {
// // //           <p-chips [(ngModel)]="value" class="w-full"></p-chips>
// // //         }

// // //         @default {
// // //           <input pInputText [(ngModel)]="value"
// // //           (keydown.enter)="onEnterKey()" 
// // //             class="w-full" (ngModelChange)="onValueChange($event)"
// // //             [placeholder]="config.placeholder || ''" />
// // //         }
// // //       }
// // //     </div>
// // //   `
// // // })
// // // export class MasterCellEditorComponent implements ICellEditorAngularComp, AfterViewInit {
// // //   @Input() set cellParams(params: MasterEditorParams) {
// // //     this.agInit(params);
// // //   }
// // //   @ViewChild('input') input?: ElementRef;
// // //   // --- NEW: Handle Enter Key ---
// // //   onEnterKey() {
// // //     // We use the context action we defined in AppSharedGrid
// // //     // This triggers the EXACT same logic as clicking the Save button
// // //     this.params.context.onAction('save', this.params.data);
// // //   }
// // //   params!: MasterEditorParams;
// // //   config!: CellConfig;
// // //   value: any;

// // //   agInit(params: MasterEditorParams): void {
// // //     this.params = params;
// // //     this.config = params.cellConfig || { type: 'text' };
// // //     this.value = params.value;
// // //   }

// // //   getValue(): any {
// // //     return this.value;
// // //   }

// // //   onValueChange(newValue: any) {
// // //     this.value = newValue;
// // //     // Immediately update the Grid Row Node
// // //     // This ensures "Save All" sees the new data
// // //     if (this.params && this.params.node) {
// // //       this.params.node.setDataValue(this.params.colDef.field!, newValue);
// // //     }
// // //   }

// // //   isPopup(): boolean {
// // //     return ['textarea', 'multiselect', 'tags', 'color']
// // //       .includes(this.config.type);
// // //   }

// // //   ngAfterViewInit(): void {
// // //     setTimeout(() => this.input?.nativeElement?.focus());
// // //   }
// // // }
