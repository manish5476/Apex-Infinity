import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-date-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  template: `
    <p-datepicker [ngModel]="value()" 
                  (ngModelChange)="valueChange.emit($event)"
                  [selectionMode]="selectionMode()" 
                  [placeholder]="placeholder()"
                  [showClear]="true"
                  styleClass="w-full sm:w-56 h-9 text-sm">
    </p-datepicker>
  `,
})
export class DateFilterComponent {
  selectionMode = input<'single' | 'multiple' | 'range'>('range');
  placeholder = input<string>('Select Date');
  value = input<Date | Date[] | null>(null);
  valueChange = output<Date | Date[] | null>();
}
