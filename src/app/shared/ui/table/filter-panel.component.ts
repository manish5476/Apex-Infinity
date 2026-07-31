// src/app/shared/ui/table/filter-panel.component.ts
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Component: app-filter-panel
 * Purpose: Expandable filter container that projects form controls and handles standard Apply/Reset events.
 */
@Component({
    selector: 'app-filter-panel',
    standalone: true,
    imports: [ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block w-full'
    },
    template: `
    @if (open()) {
      <div class="border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-[var(--spacing-2xl)] transition-[var(--transition-base)] animate-fade-in">
        
        <!-- Filter Controls Form Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-xl)] mb-[var(--spacing-2xl)]">
          <ng-content></ng-content>
        </div>

        <!-- Filter Action Toolbar -->
        <div class="flex items-center justify-between border-t border-[var(--border-primary)] pt-[var(--spacing-lg)]">
          <p-button 
            label="Reset All Filters" 
            icon="pi pi-refresh" 
            [link]="true" 
            severity="secondary" 
            size="small"
            (onClick)="reset.emit()">
          </p-button>

          <div class="flex items-center gap-[var(--spacing-sm)]">
            <p-button 
              label="Apply Filters" 
              icon="pi pi-check" 
              severity="primary" 
              size="small"
              (onClick)="apply.emit()">
            </p-button>
          </div>
        </div>
      </div>
    }
  `
})
export class FilterPanelComponent {
    open = input<boolean>(false);

    apply = output<void>();
    reset = output<void>();
}