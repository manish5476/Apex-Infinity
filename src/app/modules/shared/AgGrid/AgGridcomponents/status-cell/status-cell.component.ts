import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

// FIX: Define a type that exactly matches the accepted values for PrimeNG's p-tag severity.
export type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/**
 * Defines the parameters needed for the StatusCellComponent's logic.
 * This is passed inside the ColDef's `cellRendererParams`.
 */
export interface StatusCellParams {
  // FIX: Use the corrected Severity type for the function's return value.
  severityMap: (value: any) => Severity;
}

/**
 * These are the full parameters that AgGrid provides to the cell renderer component.
 * It includes the standard params and our custom `config`.
 */
interface FullStatusCellParams extends ICellRendererParams {
  config: StatusCellParams;
}

@Component({
  selector: 'app-status-cell',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <p-tag *ngIf="displayValue" [value]="displayValue" [severity]="severity"></p-tag>
  `,
})
export class StatusCellComponent implements ICellRendererAngularComp {
  public params!: FullStatusCellParams;
  // FIX: Use the corrected Severity type for the component's property.
  public severity: Severity = 'info';
  public displayValue: string = '';

  agInit(params: FullStatusCellParams): void {
    this.params = params;
    // Use the formatted value if available, otherwise use the raw value.
    this.displayValue = this.params.valueFormatted ?? this.params.value;
    this.updateSeverity();
  }

  refresh(params: FullStatusCellParams): boolean {
    this.params = params;
    this.displayValue = this.params.valueFormatted ?? this.params.value;
    this.updateSeverity();
    return true;
  }

  private updateSeverity(): void {
    if (this.params.value !== null && this.params.value !== undefined && this.params.config?.severityMap) {
      this.severity = this.params.config.severityMap(this.params.value);
    } else {
      // Use a neutral default for empty or null values
      this.severity = 'secondary';
    }
  }
}


// import { Component } from '@angular/core';
// import { ICellRendererAngularComp } from 'ag-grid-angular';
// import { ICellRendererParams } from 'ag-grid-community';
// import { CommonModule } from '@angular/common';
// import { TagModule } from 'primeng/tag';

// export interface StatusColumnConfig extends ICellRendererParams {
//   field: string | undefined;
//   severityMap: (value: any) => 'success' | 'warning' | 'danger' | 'info' | 'secondary';
// }

// @Component({
//   selector: 'app-status-cell',
//   standalone: true,
//   imports: [CommonModule, TagModule],
//   template: `
//     <p-tag *ngIf="params.value" [value]="params.value" ></p-tag>
//   `,
// })
// export class StatusCellComponent implements ICellRendererAngularComp {
//   public params!: any;
//   public severity: 'success' | 'warning' | 'danger' | 'info' | 'secondary' = 'info';

//   agInit(params: any): void {
//     this.params = params;
//     if (this.params.value) {
//       this.severity = this.params.severityMap(this.params.value);
//     }
//     this.severity='info'
//   }

//   refresh(params: any): boolean {
//     this.params = params;
//     if (this.params.value) {
//       this.severity = this.params.severityMap(this.params.value);
//     }
//     return true;
//   }
// }
