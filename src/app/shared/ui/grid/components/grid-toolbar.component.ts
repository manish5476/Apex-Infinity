import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-grid-toolbar',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
      
      <!-- Left Filters (Pill shaped dropdowns) -->
      <div class="flex flex-wrap items-center gap-2 bg-[var(--bg-primary)] p-1.5 rounded-full shadow-sm border border-[var(--border-secondary)]">
        <ng-content select="[grid-filters]"></ng-content>
        
        <!-- Divider -->
        <div class="w-[1px] h-6 bg-[var(--border-secondary)] mx-2"></div>
        
        <!-- Search -->
        <div class="flex items-center gap-2 px-3 text-[var(--text-tertiary)] w-48">
          <i class="pi pi-search text-xs"></i>
          <input 
            type="text" 
            placeholder="Search" 
            class="bg-transparent border-none outline-none text-[length:var(--font-size-sm)] text-[var(--text-primary)] w-full placeholder:text-[var(--text-tertiary)]"
            (input)="search.emit($any($event.target).value)"
          />
        </div>
      </div>

      <!-- Right Actions (Add, Filter, Export) -->
      <div class="flex items-center gap-2 bg-[var(--bg-primary)] p-1.5 rounded-full shadow-sm border border-[var(--border-secondary)]">
        <ng-content select="[grid-actions]"></ng-content>
        
        <button class="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors focus:outline-none">
          <i class="pi pi-plus text-xs"></i>
        </button>
        <button class="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors focus:outline-none">
          <i class="pi pi-sliders-h text-xs"></i>
        </button>
        
        <div class="w-[1px] h-6 bg-[var(--border-secondary)] mx-1"></div>
        
        <button class="h-8 px-4 rounded-full flex items-center gap-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors font-medium text-xs focus:outline-none">
          <i class="pi pi-download"></i>
          Export
        </button>
      </div>
    </div>
  `
})
export class GridToolbarComponent {
    search = output<string>();
}