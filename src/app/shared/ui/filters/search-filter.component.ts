import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule],
  template: `
    <p-iconField iconPosition="left" class="w-full sm:w-auto">
      <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
      <input type="text" pInputText [placeholder]="placeholder()" [ngModel]="value()" 
             (ngModelChange)="valueChange.emit($event)" 
             class="w-full sm:w-64 h-9 text-sm" />
    </p-iconField>
  `,
})
export class SearchFilterComponent {
  placeholder = input<string>('Search...');
  value = input<string | null | undefined>('');
  valueChange = output<string>();
}
