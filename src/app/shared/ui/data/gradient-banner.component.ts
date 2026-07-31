// src/app/shared/ui/data/gradient-banner.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type GradientBannerSize = 'sm' | 'md' | 'lg';

/**
 * Component: app-gradient-banner
 * Purpose: Theme-driven hero/welcome banner for dashboards and module landing pages.
 * Consumes --accent-gradient / --accent-gradient-angle so it re-themes automatically —
 * no hardcoded colors, works correctly across every theme and dark mode.
 * Slots: [banner-visual] (illustration/icon area, right side), [banner-actions] (buttons)
 */
@Component({
    selector: 'app-gradient-banner',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block w-full' },
    template: `
    <div [class]="containerClasses()" [style.background]="gradientStyle()">
      <!-- Ambient glow accents -->
      <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-[var(--spacing-xl)]">
        <div class="flex flex-col gap-[var(--spacing-sm)] max-w-2xl">
          @if (eyebrow()) {
            <span class="text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wider text-[var(--text-on-accent)] opacity-80">
              {{ eyebrow() }}
            </span>
          }
          <h1 [class]="titleClasses()">
            {{ title() }}
          </h1>
          @if (description()) {
            <p class="text-[length:var(--font-size-sm)] text-[var(--text-on-accent)] opacity-85 max-w-xl leading-[var(--line-height-relaxed)]">
              {{ description() }}
            </p>
          }
          @if (hasActions()) {
            <div class="flex items-center flex-wrap gap-[var(--spacing-sm)] mt-[var(--spacing-md)]">
              <ng-content select="[banner-actions]"></ng-content>
            </div>
          }
        </div>

        <div class="shrink-0">
          <ng-content select="[banner-visual]"></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class GradientBannerComponent {
    eyebrow = input<string>();
    title = input.required<string>();
    description = input<string>();
    size = input<GradientBannerSize>('md');

    /** Set true only if projecting into [banner-actions]; controls top margin spacing. */
    hasActions = input<boolean>(true);

    protected gradientStyle = computed(
        () => `linear-gradient(var(--accent-gradient-angle, 135deg), var(--accent-primary), var(--accent-secondary))`
    );

    protected containerClasses = computed(() => {
        const paddingMap: Record<GradientBannerSize, string> = {
            sm: 'p-[var(--spacing-2xl)]',
            md: 'p-[var(--spacing-4xl)]',
            lg: 'p-[var(--spacing-5xl)]',
        };
        return `relative overflow-hidden rounded-[var(--ui-border-radius-xl)] shadow-[var(--elevation-2)] ${paddingMap[this.size()]}`;
    });

    protected titleClasses = computed(() => {
        const sizeMap: Record<GradientBannerSize, string> = {
            sm: 'text-[length:var(--font-size-2xl)]',
            md: 'text-[length:var(--font-size-4xl)]',
            lg: 'text-[length:var(--font-size-5xl)]',
        };
        return `font-[var(--font-heading)] font-[var(--font-weight-bold)] text-[var(--text-on-accent)] m-0 tracking-tight leading-[var(--line-height-tight)] ${sizeMap[this.size()]}`;
    });
}