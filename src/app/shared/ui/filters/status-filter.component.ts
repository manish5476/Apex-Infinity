import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

export interface StatusOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-status-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  template: `
    <p-select [options]="options()" 
                [ngModel]="value()" 
                (ngModelChange)="valueChange.emit($event)"
                [showClear]="true" 
                [placeholder]="placeholder()"
                styleClass="w-full sm:w-40 h-9 text-sm">
    </p-select>
  `,
})
export class StatusFilterComponent {
  options = input<StatusOption[]>([
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ]);
  placeholder = input<string>('Status');
  value = input<any>(null);
  valueChange = output<any>();
}
