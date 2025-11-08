import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
// import { DropdownModule } from 'primeng/dropdown';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TooltipModule } from 'primeng/tooltip';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputMaskModule } from 'primeng/inputmask';
import { KeyFilterModule } from 'primeng/keyfilter';
import { KnobModule } from 'primeng/knob';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { GridContext } from '../../AgGridcomponents/ag-grid-reference/ag-grid-reference.component'; // Import the shared interface

// Interface for the cell changed event
export interface CellChangedEvent {
  oldValue: any;
  newValue: any;
  field: string;
  data: any;
  node: any;
  colDef: any;
  event?: any;
}

type ValueChangedCallback = (eventData: CellChangedEvent) => void;

@Component({
  selector: 'app-dynamic-cell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    // DropdownModule,
    ColorPickerModule,
    TooltipModule,
    CascadeSelectModule,
    AutoCompleteModule,
    CheckboxModule,
    DatePickerModule,
    InputMaskModule,
    KeyFilterModule,
    KnobModule,
    MultiSelectModule,
    SelectModule,
  ],
  template: `
    <div [ngSwitch]="type" class="dynamic-cell-container w-full h-full flex items-center p-0 m-0">
      <input
        *ngSwitchCase="'text'"
        pInputText
        [id]="params.colDef?.field + '-' + params.node.rowIndex"
        class="w-full p-inputtext-sm"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="inputConfig?.placeholder ?? ''"
        [disabled]="!isEditing()"
        [readonly]="inputConfig?.readonly ?? false"
        [pTooltip]="inputConfig?.tooltip ?? null"
        [tooltipPosition]="inputConfig?.tooltipPosition ?? 'top'"
      />

      <div *ngSwitchCase="'number'" class="w-full">
        <p-inputNumber
          class="w-full"
          [id]="params.colDef?.field + '-' + params.node.rowIndex"
          [(ngModel)]="value"
          (onInput)="onValueChange($event.value)"
          [mode]="inputConfig?.mode ?? 'decimal'"
          [minFractionDigits]="inputConfig?.minFractionDigits ?? null"
          [maxFractionDigits]="inputConfig?.maxFractionDigits ?? null"
          [useGrouping]="inputConfig?.useGrouping ?? true"
          [placeholder]="inputConfig?.placeholder ?? ''"
          [min]="inputConfig?.min ?? null"
          [max]="inputConfig?.max ?? null"
          [step]="inputConfig?.step ?? 1"
          [prefix]="inputConfig?.prefix ?? ''"
          [suffix]="inputConfig?.suffix ?? ''"
          [disabled]="!isEditing()"
          [readonly]="inputConfig?.readonly ?? false"
          (keypress)="preventE($event)"
          [pTooltip]="inputConfig?.tooltip ?? null"
          [tooltipPosition]="inputConfig?.tooltipPosition ?? 'top'"
        ></p-inputNumber>
      </div>
    </div>
  `,
  styles: [`
    .dynamic-cell-container {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      height: 100%;
    }
  `]
})
export class DynamicCellComponent implements ICellRendererAngularComp {
  @Output() actionTriggered = new EventEmitter<{ action: 'edit' | 'save' | 'cancel' | 'delete', rowData: any }>();
  params!: ICellRendererParams;
  value: any;
  type: string = 'text';
  options: any[] = [];
  inputConfig: any = {};
  label: string | undefined;
  private valueChangedCallback: ValueChangedCallback | undefined;
  private context!: GridContext;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.value = params.value;
    this.context = params.context as GridContext;

    const cellParams = params?.colDef?.cellRendererParams || {};
    this.type = cellParams.type || 'text';
    this.options = cellParams.options || [];
    this.inputConfig = cellParams.inputConfig || {};
    this.label = cellParams.label;
    this.valueChangedCallback = cellParams.valueChangedCallback;
  }

  isEditing(): boolean {
    return this.context?.isRowEditing(this.params.data?._id) ?? false;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.value = params.value;
    const cellParams = params.colDef?.cellRendererParams || {};
    this.type = cellParams.type || 'text';
    this.options = cellParams.options || [];
    this.inputConfig = cellParams.inputConfig || {};
    this.label = cellParams.label;
    this.valueChangedCallback = cellParams.valueChangedCallback;
    return true;
  }

  onValueChange(newValue: any, originalEvent?: any): void {
    const oldValue = this.value;
    if (newValue === oldValue) return;

    this.value = newValue;
    this.params.setValue?.(newValue);

    if (this.valueChangedCallback) {
      const eventData: CellChangedEvent = {
        oldValue,
        newValue,
        field: this.params.colDef?.field!,
        data: this.params.data,
        node: this.params.node,
        colDef: this.params.colDef,
        event: originalEvent || newValue,
      };
      this.valueChangedCallback(eventData);
    }
  }

  preventE(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key) && !this.inputConfig?.allowScientificNotation) {
      event.preventDefault();
    }
  }
}
// import { Component, EventEmitter, Output } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import { FormsModule } from "@angular/forms";

// // Ag-Grid Imports
// import { ICellRendererAngularComp } from "ag-grid-angular";
// import { ICellRendererParams, IRowNode } from "ag-grid-community";

// // PrimeNG Modules
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { DropdownModule } from 'primeng/dropdown'; // Correct module for p-select
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { TooltipModule } from 'primeng/tooltip';
// import { CascadeSelectModule } from 'primeng/cascadeselect';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { CheckboxModule } from 'primeng/checkbox';
// import { DatePickerModule } from 'primeng/datepicker';
// import { InputMaskModule } from 'primeng/inputmask';
// import { KeyFilterModule } from 'primeng/keyfilter';
// import { KnobModule } from 'primeng/knob';
// import { MultiSelectModule } from 'primeng/multiselect';

// import { SelectModule } from 'primeng/select';
// /**
//  * Interface for the structured data passed to the callback on value change.
//  */
// export interface CellChangedEvent {
//     oldValue: any;
//     newValue: any;
//     field: string; // The column field name being changed
//     data: any;     // The complete row data
//     node: any;     // The Ag-Grid row node
//     colDef: any;   // The column definition
//     event?: any;   // The original browser event, if applicable
// }

// /**
//  * Type definition for the callback function expected in cellRendererParams.
//  * This function will be called by the cell component when its value changes.
//  */
// type ValueChangedCallback = (eventData: CellChangedEvent) => void;

// @Component({
//     selector: 'app-dynamic-cell',
//     standalone: true, // Recommended for modern Angular
//     imports: [
//         // Angular Modules
//         CommonModule,
//         FormsModule,

//         // PrimeNG Modules
//         DatePickerModule, KeyFilterModule,
//         InputTextModule, MultiSelectModule, SelectModule,
//         InputNumberModule, CheckboxModule,
//         InputMaskModule, KnobModule,
//         DropdownModule,
//         ColorPickerModule,
//         TooltipModule, CascadeSelectModule, AutoCompleteModule,
//     ],
//     templateUrl: './dynamic-cell.component.html',
//     styleUrls: ['./dynamic-cell.component.css'] // Use styleUrls (plural)
// })
// export class DynamicCellComponent implements ICellRendererAngularComp {
//     params!: ICellRendererParams;
//     value: any;
//     type: string = 'text';
//     options: any[] = [];
//     inputConfig: any = {};
//     label: string | undefined;
//     private valueChangedCallback: ValueChangedCallback | undefined;
//     private context!: GridContext; // Reuse the same GridContext interface
  
//     agInit(params: ICellRendererParams): void {
//       this.params = params;
//       this.value = params.value;
//       this.context = params.context as GridContext;
  
//       const cellParams = params?.colDef?.cellRendererParams || {};
//       this.type = cellParams.type || 'text';
//       this.options = cellParams.options || [];
//       this.inputConfig = cellParams.inputConfig || {};
//       this.label = cellParams.label;
//       this.valueChangedCallback = cellParams.valueChangedCallback;
//     }
  
//     isEditing(): boolean {
//       return this.context?.isRowEditing(this.params.data?._id) ?? false;
//     }
  
//     refresh(params: ICellRendererParams): boolean {
//       this.params = params;
//       this.value = params.value;
//       const cellParams = params.colDef?.cellRendererParams || {};
//       this.type = cellParams.type || 'text';
//       this.options = cellParams.options || [];
//       this.inputConfig = cellParams.inputConfig || {};
//       this.label = cellParams.label;
//       this.valueChangedCallback = cellParams.valueChangedCallback;
//       return true; // Handle refresh internally
//     }
  
//     onValueChange(newValue: any, originalEvent?: any): void {
//       const oldValue = this.value;
//       if (newValue === oldValue) return;
  
//       this.value = newValue;
//       this.params.setValue?.(newValue);
  
//       if (this.valueChangedCallback) {
//         const eventData: CellChangedEvent = {
//           oldValue,
//           newValue,
//           field: this.params.colDef?.field!,
//           data: this.params.data,
//           node: this.params.node,
//           colDef: this.params.colDef,
//           event: originalEvent || newValue,
//         };
//         this.valueChangedCallback(eventData);
//       }
//     }
//   }
// // export class DynamicCellComponent implements ICellRendererAngularComp {
// //     @Output() actionTriggered = new EventEmitter<{ action: 'edit' | 'save' | 'cancel' | 'delete', rowData: any }>();

// //     // Properties managed by Ag-Grid
// //     params!: ICellRendererParams; // Definite assignment assertion

// //     // Component State
// //     value: any; // The current value of the input

// //     // Configuration from cellRendererParams
// //     type: string = 'text';       // Type of PrimeNG component to render
// //     options: any[] = [];         // Options for dropdown
// //     inputConfig: any = {};       // Generic config object for PrimeNG props
// //     label: string | undefined;   // Optional label (e.g., for color picker)

// //     // Callback function provided by the parent grid component
// //     private valueChangedCallback: ValueChangedCallback | undefined;
// //     context: any;

// //     /**
// //      * Ag-Grid initialization method. Called once when the component is created.
// //      */
// //     agInit(params: ICellRendererParams): void {
// //         this.params = params;
// //         this.value = params.value; // Set initial value from grid data

// //         // Safely extract configuration from cellRendererParams
// //         const cellParams = params?.colDef?.cellRendererParams || {};
// //         this.type = cellParams.type || 'text';
// //         this.options = cellParams.options || [];
// //         this.inputConfig = cellParams.inputConfig || {};
// //         this.label = cellParams.label; // Optional label

// //         // Store the callback function if provided
// //         this.valueChangedCallback = cellParams.valueChangedCallback;

// //         //
// //     }

// //     /**
// //      * Ag-Grid refresh method. Called when grid data changes.
// //      * Return true to handle the refresh internally, false to recreate the component.
// //      */
// //     isEditing(): boolean {
// //         // Access the row node from params
// //         const rowNode = this.params.node as IRowNode | null | undefined;
// //         // Get the row's unique ID (string) from the node
// //         const rowId = rowNode?.id;

// //         // Use the context function provided by SharedGridComponent
// //         // The context function will compare this ID to the SharedGridComponent's editingRowId state.
// //         return this.context?this.context:false
// //         // return this.context?.isRowEditing ? this.context.isRowEditing(rowId) : false;
// //     }

// //     // --- Button Click Handlers (for the 'action' type) ---
// //     // These methods emit events to the parent (SharedGridComponent)

// //     onEditClick(): void {
// //        
// //         // Emit the edit action event with the current row data
// //         if (this.params.data) {
// //             this.actionTriggered.emit({ action: 'edit', rowData: this.params.data });
// //             this.context=true
// //         } else {
// //             console.warn("Edit clicked but params.data is missing.");
// //         }
// //     }

// //     onSaveClick(): void {
// //         
// //         // Emit the save action event with the current row data from the grid's editor
// //         // When save is clicked in edit mode, params.data contains the latest values from the editors.
// //         if (this.params.data) {
// //             this.actionTriggered.emit({ action: 'save', rowData: this.params.data });
// //             this.context=false

// //         } else {
// //             console.warn("Save clicked but params.data is missing.");
// //         }
// //     }

// //     onCancelClick(): void {
// //        
// //         // Emit the cancel action event with the current row data
// //         if (this.params.data) {
// //             this.actionTriggered.emit({ action: 'cancel', rowData: this.params.data });
// //             this.context=false

// //         } else {
// //             console.warn("Cancel clicked but params.data is missing.");
// //         }
// //     }

// //     onDeleteClick(): void {
// //        
// //         // Emit the delete action event with the row data
// //         if (this.params.data) {
// //             this.actionTriggered.emit({ action: 'delete', rowData: this.params.data });
// //             this.context=true
// //         } else {
// //             console.warn("Delete clicked but params.data is missing.");
// //         }
// //     }

    
// //     refresh(params: ICellRendererParams): boolean {
// //         // Update params and value
// //         this.params = params;
// //         this.value = params.value;

// //         // Re-read configuration in case it changed (less common, but possible)
// //         const cellParams = params.colDef?.cellRendererParams || {};
// //         this.type = cellParams.type || 'text';
// //         this.options = cellParams.options || [];
// //         this.inputConfig = cellParams.inputConfig || {};
// //         this.label = cellParams.label;
// //         this.valueChangedCallback = cellParams.valueChangedCallback; // Update callback reference

// //         // Returning true tells Ag-Grid we've handled the refresh
// //         return true;
// //     }

// //     /**
// //      * Central handler for value changes from any PrimeNG input.
// //      * Updates the grid data and triggers the callback.
// //      */
// //     onValueChange(newValue: any, originalEvent?: any, cell?: any): void {
// //         const oldValue = this.value;

// //         // Prevent unnecessary updates if the value hasn't actually changed
// //         if (newValue === oldValue) {
// //             return;
// //         }

// //         this.value = newValue; // Update local component state

// //         // --- Safely update Ag-Grid's data model ---
// //         // Use optional chaining (?.) because setValue might not exist if not editable
// //         this.params.setValue?.(newValue);
// //         // ---------------------------------------------

// //         // If a callback function was provided via params, call it
// //         if (this.valueChangedCallback) {
// //             const eventData: CellChangedEvent = {
// //                 oldValue: oldValue,
// //                 newValue: newValue,
// //                 field: this.params.colDef?.field!, // Use non-null assertion if field is guaranteed
// //                 data: this.params.data,
// //                 node: this.params.node,
// //                 colDef: this.params.colDef,
// //                 event: originalEvent ? originalEvent : newValue,// Include original event for context
// //             };
// //             this.valueChangedCallback(eventData);
// //         }
// //     }

// //     // --- Specific handlers to correctly extract values from PrimeNG component events ---

// //     /**
// //      * Example utility: Prevents non-numeric keys in number inputs.
// //      * (Based on your original code snippet)
// //      */
// //     preventE(event: KeyboardEvent): void {
// //         // Prevent 'e', 'E', '+', '-' which are sometimes allowed in type="number"
// //         // Adjust the keys based on your specific requirements
// //         if (['e', 'E', '+', '-'].includes(event.key) && !this.inputConfig?.allowScientificNotation) {
// //             event.preventDefault();
// //         }
// //     }

// //     // Optional: If you need specific keyup logic beyond just value change
// //     // textBoxKeyUpEvent(field: string, event: KeyboardEvent) {
// //     //  
// //     //   // Potentially emit a different event or call another callback
// //     // }
// // }





// // old version-------------------------------------------------------
// //
// // // // import { Component } from '@angular/core';

// // // @Component({
// // //   selector: 'app-dynamic-cell',
// // //   imports: [],
// // //   templateUrl: './dynamic-cell.component.html',
// // //   styleUrl: './dynamic-cell.component.css'
// // // })
// // // export class DynamicCellComponent {

// // // }




// // import { Component, Input } from "@angular/core";
// // import { ICellRendererAngularComp } from "ag-grid-angular";
// // import { ICellRendererParams } from "ag-grid-community";
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { SelectModule } from 'primeng/select';
// // import { FormsModule } from "@angular/forms";
// // import { CommonModule } from "@angular/common";
// // @Component({
// //   selector: 'app-dynamic-cell',
// //   imports: [InputNumberModule, CommonModule, FormsModule, SelectModule, InputTextModule],
// //   templateUrl: './dynamic-cell.component.html',
// //   styleUrl: './dynamic-cell.component.css'
// // })
// // export class DynamicCellComponent implements ICellRendererAngularComp {
// //   refresh(params: ICellRendererParams<any, any, any>): boolean {
// //     throw new Error("Method not implemented.");
// //   }
// //   @Input() params: any;
// //   @Input() type: string | undefined;  // The column type (text, number, date)
// //   @Input() data: any;     // The row data
// //   @Input() key: string | undefined;
// //   value: any;

// //   agInit(params: any): void {
// //     this.params = params;
// //     this.value = params.value;
// //     this.type = params.colDef.cellRendererParams?.type || 'text';
// //    
// //   }

// //   isEditing(): boolean {
// //     return this.params.context?.componentParent?.isRowEditing(this.params.node);
// //   }

// //   onValueChange(newValue: any) {
// //     this.value = newValue;
// //     this.params.data[this.params.colDef.field] = newValue;
// //   }
// // }