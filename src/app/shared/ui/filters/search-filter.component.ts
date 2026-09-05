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
    <p-iconField iconPosition="left" class="w-full sm:w-auto relative flex items-center">
      <p-inputIcon styleClass="pi pi-search text-[var(--text-tertiary)] text-xs"></p-inputIcon>
      <input type="text" pInputText [placeholder]="placeholder()" [ngModel]="value()" 
             (ngModelChange)="valueChange.emit($event)" 
             class="w-full sm:w-64 h-[38px] text-sm pr-7 rounded-[var(--ui-border-radius)] bg-[var(--bg-primary)] border-[var(--border-secondary)] transition-all" />
      @if (value()) {
        <button type="button" 
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-0.5"
                (click)="valueChange.emit('')">
          <i class="pi pi-times text-[10px]"></i>
        </button>
      }
    </p-iconField>
  `,
})
export class SearchFilterComponent {
  placeholder = input<string>('Search...');
  value = input<string | null | undefined>('');
  valueChange = output<string>();
}
