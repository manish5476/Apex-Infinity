import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * Component: app-grid-empty-state
 * Rendered when the grid has no data or a filter produces zero results.
 */
@Component({
  selector: 'app-grid-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-8 text-center select-none">

      <!-- Outer glow ring -->
      <div class="relative mb-6">
        <div class="w-16 h-16 rounded-full flex items-center justify-center
                    bg-[var(--bg-secondary)] border border-[var(--border-secondary)]
                    shadow-[0_0_0_8px_color-mix(in_srgb,var(--accent-primary)_6%,transparent)]">
          <i [class]="icon() + ' text-2xl text-[var(--text-tertiary)]'"></i>
        </div>
      </div>

      <!-- Title -->
      <h3 class="text-[length:var(--font-size-base)] font-[var(--font-weight-semibold)]
                 text-[var(--text-primary)] mb-1">
        {{ title() }}
      </h3>

      <!-- Subtitle -->
      <p class="text-[length:var(--font-size-sm)] text-[var(--text-tertiary)] max-w-xs leading-relaxed mb-5">
        {{ subtitle() }}
      </p>

      <!-- Optional CTA -->
      @if (actionLabel()) {
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 text-[length:var(--font-size-sm)]
                 font-[var(--font-weight-medium)] text-[var(--text-on-accent)]
                 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]
                 rounded-[var(--ui-border-radius)] transition-[var(--transition-fast)]
                 shadow-[var(--shadow-sm)] focus:outline-none
                 focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2"
          (click)="action.emit()">
          @if (actionIcon()) {
            <i [class]="actionIcon() + ' text-xs'"></i>
          }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class GridEmptyStateComponent {
  icon        = input<string>('pi pi-inbox');
  title       = input<string>('No records found');
  subtitle    = input<string>('Try adjusting your search or filter criteria.');
  actionLabel = input<string>('');
  actionIcon  = input<string>('pi pi-plus');

  action = output<void>();
}
