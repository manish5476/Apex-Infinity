import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

export interface SelectFilterOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-select-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  template: `
    <p-select [options]="options()" 
                [ngModel]="value()" 
                (ngModelChange)="valueChange.emit($event)"
                [showClear]="true" 
                [filter]="filter()"
                [placeholder]="placeholder()"
                styleClass="w-full sm:w-48 h-9 text-sm">
    </p-select>
  `,
})
export class SelectFilterComponent {
  options = input<SelectFilterOption[]>([]);
  placeholder = input<string>('Select...');
  filter = input<boolean>(true);
  value = input<any>(null);
  valueChange = output<any>();
}
