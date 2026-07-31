import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-data-list-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'group flex justify-between items-center gap-[var(--spacing-md)] px-[var(--spacing-xl)] py-[var(--spacing-lg)] min-h-[52px] bg-transparent transition-colors duration-200 hover:bg-[var(--bg-hover)]'
  },
  template: `
    <div class="flex items-center gap-3 flex-1 min-w-0">
      <!-- Optional Leading Slot (Avatars/Icons) -->
      <div class="empty:hidden shrink-0">
        <ng-content select="[leading]"></ng-content>
      </div>
      
      <!-- Label -->
      <div class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] font-[var(--font-weight-medium)] group-hover:text-[var(--text-primary)] transition-colors truncate flex-1 tracking-wide">
        {{ label() }}
      </div>
    </div>

    <!-- Value Area -->
    <div class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] text-right shrink-0">
      <ng-content></ng-content>
    </div>
  `
})
export class DataListRowComponent {
  label = input.required<string>();
}