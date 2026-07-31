import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-data-list-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'group flex justify-between items-center gap-[var(--spacing-md)] p-[var(--spacing-lg)] bg-[var(--component-bg)] border border-[var(--component-border)] rounded-[var(--ui-border-radius-lg)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--accent-primary)]/40 cursor-pointer'
  },
  template: `
    <div class="flex items-center gap-4 flex-1 min-w-0">
      <!-- Leading Element (Avatar/Rank Number) -->
      <div class="empty:hidden shrink-0 transition-transform duration-300 group-hover:scale-105">
        <ng-content select="[leading]"></ng-content>
      </div>
      
      <!-- Title & Subtitle -->
      <div class="flex flex-col truncate">
        <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-bold)] text-[var(--text-primary)] truncate tracking-tight">
          {{ title() }}
        </span>
        @if (subtitle()) {
          <span class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] font-[var(--font-weight-medium)] mt-0.5 truncate">
            {{ subtitle() }}
          </span>
        }
      </div>
    </div>

    <!-- Trailing Value (Revenue/Profit) -->
    <div class="shrink-0 flex items-center gap-3 text-[length:var(--font-size-sm)]">
       <ng-content select="[trailing]"></ng-content>
       <ng-content></ng-content>
    </div>
  `
})
export class DataListCardComponent {
  title = input.required<string>();
  subtitle = input<string>();
}