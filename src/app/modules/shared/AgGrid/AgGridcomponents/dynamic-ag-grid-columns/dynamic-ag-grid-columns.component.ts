import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CheckboxModule } from 'primeng/checkbox';
// Import any other PrimeNG modules you use, like InputTextModule, DropdownModule, etc.
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
export type DynamicAgGridColumn = ICellRendererParams & {
  typeOfCol: 'text' | 'dropdown' | 'checkbox' | 'dialog' | 'icon';
  field?: string;
  isEditable?: boolean | ((rowData: any) => boolean); // Allow function for conditional logic
  options?: any[];
  icon?: string;
  tooltip?: string;
  // This is the key: the handler function passed from the parent.
  handleAction?: (event: any) => void;
  eventName?: string;
  [key: string]: any;
};

@Component({
  selector: 'app-dynamic-ag-grid-columns',
  standalone: true, // Making it a standalone component is easier for imports
  imports: [FormsModule, CommonModule, ButtonModule, SelectModule, CheckboxModule /*, ...other PrimeNG modules */],
  templateUrl: './dynamic-ag-grid-columns.component.html',
  styleUrls: ['./dynamic-ag-grid-columns.component.css']
})
export class DynamicAgGridColumnsComponent implements ICellRendererAngularComp {
  params!: DynamicAgGridColumn;
  cellValue: any;

  agInit(params: DynamicAgGridColumn): void {
    this.params = params;
    this.cellValue = this.getValueFromRow();
  }

  refresh(params: DynamicAgGridColumn): boolean {
    this.params = params;
    this.cellValue = this.getValueFromRow();
    return true;
  }

  private getValueFromRow(): any {
    return this.params.field && this.params.data ? this.params.data[this.params.field] : null;
  }

  onAction(actionType: string, payload?: any): void {
    if (this.params.field && this.params.data && payload !== undefined) {
      this.params.data[this.params.field] = payload;
      this.cellValue = payload;
    }
    if (this.params.handleAction) {
      this.params.handleAction({
        action: actionType,
        eventName: this.params.eventName,
        rowData: this.params.data,
        value: payload ?? this.cellValue
      });
    }
  }

  isEditable(): boolean {
    if (typeof this.params.isEditable === 'function') { return this.params.isEditable(this.params.data); }
    if (this.params.typeOfCol === 'dialog' || this.params.typeOfCol === 'icon') { return true }
    return !!this.params.isEditable;
  }
}
