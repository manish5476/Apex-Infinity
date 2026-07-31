// src/app/shared/ui/data/stat-card.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type StatTrend = 'up' | 'down' | 'neutral';
export type StatVariant = 'primary' | 'success' | 'warning' | 'error';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block w-full' },
    template: `
    <div class="group relative overflow-hidden bg-[var(--component-bg)] border border-[var(--component-border)] rounded-[var(--ui-border-radius-lg)] p-[var(--spacing-2xl)] shadow-[var(--elevation-1)] transition-[var(--transition-slow)] hover:-translate-y-1 hover:shadow-[var(--elevation-3)] hover:border-[var(--accent-primary)]">
      
      <!-- Top Row: Label & Icon -->
      <div class="flex justify-between items-start mb-[var(--spacing-lg)]">
        <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] uppercase tracking-wider">
          {{ label() }}
        </span>
        <div [class]="iconWrapperClasses()">
          <i [class]="icon() + ' text-[length:var(--font-size-xl)]'"></i>
        </div>
      </div>

      <!-- Main Metric Value -->
      <div class="flex items-baseline justify-between gap-[var(--spacing-md)]">
        <h3 class="text-[length:var(--font-size-4xl)] font-[var(--font-weight-bold)] text-[var(--text-primary)] m-0 tracking-tight transition-[var(--transition-fast)] group-hover:scale-105 origin-left">
          {{ value() }}
        </h3>

        <!-- Trend Indicator -->
        @if (change()) {
          <div [class]="trendBadgeClasses()">
            <i [class]="trendIcon()"></i>
            <span>{{ change() }}</span>
          </div>
        }
      </div>

      <!-- Footer Subtext or Sparkline Slot -->
      @if (description()) {
        <p class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] mt-[var(--spacing-md)] mb-0">
          {{ description() }}
        </p>
      }
      <ng-content select="[sparkline]"></ng-content>
    </div>
  `
})
export class StatCardComponent {
    label = input.required<string>();
    value = input.required<string | number>();
    icon = input<string>('pi pi-chart-line');
    change = input<string>();
    trend = input<StatTrend>('up');
    variant = input<StatVariant>('primary');
    description = input<string>();

    protected iconWrapperClasses = computed(() => {
        const variants: Record<StatVariant, string> = {
            primary: 'bg-[var(--accent-focus)] text-[var(--accent-primary)]',
            success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
            warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
            error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
        };
        return `w-10 h-10 rounded-[var(--ui-border-radius)] flex items-center justify-center transition-[var(--transition-base)] group-hover:rotate-6 ${variants[this.variant()]}`;
    });

    protected trendBadgeClasses = computed(() => {
        const isPositive = this.trend() === 'up';
        const isNegative = this.trend() === 'down';

        const bg = isPositive
            ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)]'
            : isNegative
                ? 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error-border)]'
                : 'bg-[var(--bg-ternary)] text-[var(--text-secondary)] border-[var(--border-secondary)]';

        return `inline-flex items-center gap-1 text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] px-2 py-0.5 rounded-[var(--ui-border-radius-pill)] border ${bg}`;
    });

    protected trendIcon = computed(() => {
        if (this.trend() === 'up') return 'pi pi-arrow-up-right';
        if (this.trend() === 'down') return 'pi pi-arrow-down-right';
        return 'pi pi-minus';
    });
}