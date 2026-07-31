// src/app/shared/ui/layout/section.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-section
 * Purpose: Standardized section divider with optional title for splitting page content.
 */
@Component({
  selector: 'app-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <section class="flex flex-col gap-[var(--spacing-xl)] mb-[var(--spacing-4xl)]">
      @if (title() || description()) {
        <div class="flex flex-col gap-[var(--spacing-xs)] px-1">
          @if (title()) {
            <h2 class="text-[length:var(--font-size-2xl)] font-[var(--font-weight-medium)] text-[var(--text-primary)] m-0 tracking-tight">
              {{ title() }}
            </h2>
          }
          @if (description()) {
            <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] m-0">
              {{ description() }}
            </p>
          }
        </div>
      }
      <div class="w-full">
        <ng-content></ng-content>
      </div>
    </section>
  `,
})
export class SectionComponent {
  title = input<string>('');
  description = input<string>('');
}