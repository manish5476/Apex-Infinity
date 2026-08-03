// src/app/shared/ui/data/stat-card.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type StatTrend = 'up' | 'down' | 'neutral';
export type StatVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'danger';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div [class]="cardClasses()">
      
      <!-- Top Row: Icon & Label -->
      <div class="flex items-center gap-2" [class.mb-1]="density() === 'compact'" [class.mb-[var(--spacing-lg)]]="density() !== 'compact'">
        @if (density() === 'compact') {
          <i class="{{ icon() }} {{ iconColorClass() }} text-[length:var(--font-size-sm)]"></i>
        } @else {
          <div [class]="iconWrapperClasses()">
            <i [class]="icon()" class="text-[length:var(--font-size-xl)]"></i>
          </div>
        }
        <span class="font-[var(--font-weight-medium)] text-[var(--text-secondary)] uppercase tracking-wider"
              [class.text-[length:var(--font-size-xs)]]="density() === 'compact'"
              [class.text-[length:var(--font-size-sm)]]="density() !== 'compact'">
          {{ label() }}
        </span>
      </div>

      <!-- Main Metric Value -->
      <div class="flex items-baseline justify-between gap-[var(--spacing-md)]">
        <h3 class="font-[var(--font-weight-bold)] text-[var(--text-primary)] m-0 tracking-tight transition-[var(--transition-fast)] group-hover:scale-105 origin-left"
            [class.text-[length:var(--font-size-2xl)]]="density() === 'compact'"
            [class.text-[length:var(--font-size-4xl)]]="density() !== 'compact'">
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
        <p class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] mt-[var(--spacing-sm)] mb-0 leading-tight">
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

  density = input<'compact' | 'normal'>('normal');
  accent = input<boolean>(false);
  shadow = input<'none' | 'sm' | 'md'>('sm');

  protected cardClasses = computed(() => {
    const p = this.density() === 'compact' ? 'p-[var(--spacing-md)]' : 'p-[var(--spacing-2xl)]';
    const s = {
      none: '',
      sm: 'shadow-[var(--elevation-1)]',
      md: 'shadow-[var(--elevation-2)]'
    }[this.shadow()];

    let acc = '';
    if (this.accent()) {
      const borders: Record<StatVariant, string> = {
        primary: 'border-t-4 border-t-[var(--accent-primary)]',
        success: 'border-t-4 border-t-[var(--color-success)]',
        warning: 'border-t-4 border-t-[var(--color-warning)]',
        error: 'border-t-4 border-t-[var(--color-error)]',
        danger: 'border-t-4 border-t-[var(--color-error)]',
        info: 'border-t-4 border-t-[var(--color-info)]'
      };
      acc = borders[this.variant()] || '';
    }

    return `group relative overflow-hidden bg-[var(--component-bg)] border border-[var(--component-border)] rounded-[var(--ui-border-radius-lg)] transition-[var(--transition-slow)] hover:-translate-y-1 hover:shadow-[var(--elevation-3)] hover:border-[var(--accent-primary)] ${p} ${s} ${acc}`;
  });

  protected iconWrapperClasses = computed(() => {
    const variants: Record<StatVariant, string> = {
      primary: 'bg-[var(--accent-focus)] text-[var(--accent-primary)]',
      success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
      warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
      error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
      danger: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
      info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
    };
    const sizeClass = this.density() === 'compact' ? 'w-7 h-7 rounded' : 'w-10 h-10 rounded-[var(--ui-border-radius)]';
    return `${sizeClass} flex items-center justify-center transition-[var(--transition-base)] group-hover:scale-110 ${variants[this.variant()]}`;
  });

  iconColorClass = computed(() => {
    const variants: Record<StatVariant, string> = {
      primary: 'text-[var(--accent-primary)]',
      success: 'text-[var(--color-success)]',
      warning: 'text-[var(--color-warning)]',
      error: 'text-[var(--color-error)]',
      danger: 'text-[var(--color-error)]',
      info: 'text-[var(--color-info)]'
    };
    return variants[this.variant()];
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