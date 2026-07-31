// src/app/shared/ui/layout/section.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

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
    <section [class]="sectionClasses()">
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
  spacing = input<'compact' | 'normal' | 'comfortable'>('normal');

  protected sectionClasses = computed(() => {
    const gaps = {
      compact: 'gap-[var(--spacing-md)] mb-[var(--spacing-2xl)]',
      normal: 'gap-[var(--spacing-xl)] mb-[var(--spacing-4xl)]',
      comfortable: 'gap-[var(--spacing-2xl)] mb-[var(--spacing-6xl)]'
    }[this.spacing()];

    return `flex flex-col ${gaps}`;
  });
}