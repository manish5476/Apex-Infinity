// src/app/shared/ui/data/stat-card/stat-card.component.ts

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed
} from '@angular/core';

export type StatTrend = 'up' | 'down' | 'neutral';
export type StatVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'danger';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full'
  },
  template: `
    <div [class]="cardClasses()">

      <!-- Accent Line -->
      @if (accent()) {
        <div class="absolute top-0 left-0 right-0 h-1" [class]="accentBarClass()"></div>
      }

      <!-- Header -->
      <div class="flex items-start justify-between gap-4">

        <div class="flex items-center gap-3 min-w-0">

          <div [class]="iconWrapperClasses()">
            <i [class]="icon()"></i>
          </div>

          <div class="min-w-0">
            <div
              class="uppercase tracking-[0.12em] font-semibold text-[var(--text-tertiary)]"
              [class.text-[11px]]="density() === 'compact'"
              [class.text-xs]="density() !== 'compact'">

              {{ label() }}

            </div>

            @if (description()) {
              <div
                class="text-[var(--text-secondary)] mt-1"
                [class.text-[11px]]="density() === 'compact'"
                [class.text-xs]="density() !== 'compact'">

                {{ description() }}

              </div>
            }

          </div>

        </div>

        @if (change()) {
          <div [class]="trendBadgeClasses()">
            <i [class]="trendIcon()"></i>
            <span>{{ change() }}</span>
          </div>
        }

      </div>

      <!-- Value -->
      <div
        class="font-bold tracking-tight text-[var(--text-primary)] mt-4 leading-none"
        [class.text-2xl]="density() === 'compact'"
        [class.text-4xl]="density() !== 'compact'">

        {{ value() }}

      </div>

      <!-- Bottom Slot -->
      <div class="mt-4">
        <ng-content select="[sparkline]"></ng-content>
      </div>

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

  density = input<'compact' | 'normal'>('compact');

  accent = input<boolean>(true);

  shadow = input<'none' | 'sm' | 'md'>('sm');

  protected cardClasses = computed(() => {

    const padding =
      this.density() === 'compact'
        ? 'p-4'
        : 'p-6';

    const shadow = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md'
    }[this.shadow()];

    return [
      'group',
      'relative',
      'overflow-hidden',
      'rounded-2xl',
      'border',
      'border-[var(--component-border)]',
      'bg-[var(--component-bg)]',
      'transition-all',
      'duration-300',
      'hover:-translate-y-1',
      'hover:shadow-lg',
      'hover:border-[var(--accent-primary)]',
      padding,
      shadow
    ].join(' ');

  });

  protected accentBarClass = computed(() => {

    const map: Record<StatVariant, string> = {
      primary: 'bg-[var(--accent-primary)]',
      success: 'bg-[var(--color-success)]',
      warning: 'bg-[var(--color-warning)]',
      error: 'bg-[var(--color-error)]',
      danger: 'bg-[var(--color-error)]',
      info: 'bg-[var(--color-info)]'
    };

    return map[this.variant()];

  });

  protected iconWrapperClasses = computed(() => {

    const color: Record<StatVariant, string> = {
      primary:
        'bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[var(--accent-primary)]',

      success:
        'bg-[var(--color-success-bg)] text-[var(--color-success)]',

      warning:
        'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',

      error:
        'bg-[var(--color-error-bg)] text-[var(--color-error)]',

      danger:
        'bg-[var(--color-error-bg)] text-[var(--color-error)]',

      info:
        'bg-[var(--color-info-bg)] text-[var(--color-info)]'
    };

    const size =
      this.density() === 'compact'
        ? 'w-11 h-11 text-lg'
        : 'w-14 h-14 text-xl';

    return [
      'rounded-xl',
      'flex',
      'items-center',
      'justify-center',
      'transition-all',
      'duration-300',
      'group-hover:scale-110',
      size,
      color[this.variant()]
    ].join(' ');

  });

  protected trendBadgeClasses = computed(() => {

    const positive = this.trend() === 'up';

    const negative = this.trend() === 'down';

    const style = positive
      ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
      : negative
      ? 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]';

    return [
      'inline-flex',
      'items-center',
      'gap-1',
      'rounded-full',
      'px-2.5',
      'py-1',
      'text-xs',
      'font-semibold',
      style
    ].join(' ');

  });

  protected trendIcon = computed(() => {

    if (this.trend() === 'up') {
      return 'pi pi-arrow-up-right';
    }

    if (this.trend() === 'down') {
      return 'pi pi-arrow-down-right';
    }

    return 'pi pi-minus';

  });

}


// // src/app/shared/ui/data/stat-card.component.ts
// import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

// export type StatTrend = 'up' | 'down' | 'neutral';
// export type StatVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'danger';

// @Component({
//   selector: 'app-stat-card',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: { class: 'block w-full' },
//   template: `
//     <div [class]="cardClasses()">
      
//       <!-- Top Row: Icon & Label -->
//       <div class="flex items-center gap-2" [class.mb-1]="density() === 'compact'" [class.mb-[var(--spacing-lg)]]="density() !== 'compact'">
//         @if (density() === 'compact') {
//           <i [class]="icon()" [class]="iconColorClass()" class="text-[length:var(--font-size-sm)]"></i>
//         } @else {
//           <div [class]="iconWrapperClasses()">
//             <i [class]="icon()" class="text-[length:var(--font-size-xl)]"></i>
//           </div>
//         }
//         <span class="font-[var(--font-weight-medium)] text-[var(--text-secondary)] uppercase tracking-wider"
//               [class.text-[length:var(--font-size-xs)]]="density() === 'compact'"
//               [class.text-[length:var(--font-size-sm)]]="density() !== 'compact'">
//           {{ label() }}
//         </span>
//       </div>

//       <!-- Main Metric Value -->
//       <div class="flex items-baseline justify-between gap-[var(--spacing-md)]">
//         <h3 class="font-[var(--font-weight-bold)] text-[var(--text-primary)] m-0 tracking-tight transition-[var(--transition-fast)] group-hover:scale-105 origin-left"
//             [class.text-[length:var(--font-size-2xl)]]="density() === 'compact'"
//             [class.text-[length:var(--font-size-4xl)]]="density() !== 'compact'">
//           {{ value() }}
//         </h3>

//         <!-- Trend Indicator -->
//         @if (change()) {
//           <div [class]="trendBadgeClasses()">
//             <i [class]="trendIcon()"></i>
//             <span>{{ change() }}</span>
//           </div>
//         }
//       </div>

//       <!-- Footer Subtext or Sparkline Slot -->
//       @if (description()) {
//         <p class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] mt-[var(--spacing-sm)] mb-0 leading-tight">
//           {{ description() }}
//         </p>
//       }
//       <ng-content select="[sparkline]"></ng-content>
//     </div>
//   `
// })
// export class StatCardComponent {
//   label = input.required<string>();
//   value = input.required<string | number>();
//   icon = input<string>('pi pi-chart-line');
//   change = input<string>();
//   trend = input<StatTrend>('up');
//   variant = input<StatVariant>('primary');
//   description = input<string>();

//   density = input<'compact' | 'normal'>('normal');
//   accent = input<boolean>(false);
//   shadow = input<'none' | 'sm' | 'md'>('sm');

//   protected cardClasses = computed(() => {
//     const p = this.density() === 'compact' ? 'p-[var(--spacing-md)]' : 'p-[var(--spacing-2xl)]';
//     const s = {
//       none: '',
//       sm: 'shadow-[var(--elevation-1)]',
//       md: 'shadow-[var(--elevation-2)]'
//     }[this.shadow()];

//     let acc = '';
//     if (this.accent()) {
//       const borders: Record<StatVariant, string> = {
//         primary: 'border-t-4 border-t-[var(--accent-primary)]',
//         success: 'border-t-4 border-t-[var(--color-success)]',
//         warning: 'border-t-4 border-t-[var(--color-warning)]',
//         error: 'border-t-4 border-t-[var(--color-error)]',
//         danger: 'border-t-4 border-t-[var(--color-error)]',
//         info: 'border-t-4 border-t-[var(--color-info)]'
//       };
//       acc = borders[this.variant()] || '';
//     }

//     return `group relative overflow-hidden bg-[var(--component-bg)] border border-[var(--component-border)] rounded-[var(--ui-border-radius-lg)] transition-[var(--transition-slow)] hover:-translate-y-1 hover:shadow-[var(--elevation-3)] hover:border-[var(--accent-primary)] ${p} ${s} ${acc}`;
//   });

//   protected iconWrapperClasses = computed(() => {
//     const variants: Record<StatVariant, string> = {
//       primary: 'bg-[var(--accent-focus)] text-[var(--accent-primary)]',
//       success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
//       warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
//       error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
//       danger: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
//       info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
//     };
//     const sizeClass = this.density() === 'compact' ? 'w-7 h-7 rounded' : 'w-10 h-10 rounded-[var(--ui-border-radius)]';
//     return `${sizeClass} flex items-center justify-center transition-[var(--transition-base)] group-hover:scale-110 ${variants[this.variant()]}`;
//   });

//   protected iconColorClass = computed(() => {
//     const variants: Record<StatVariant, string> = {
//       primary: 'text-[var(--accent-primary)]',
//       success: 'text-[var(--color-success)]',
//       warning: 'text-[var(--color-warning)]',
//       error: 'text-[var(--color-error)]',
//       danger: 'text-[var(--color-error)]',
//       info: 'text-[var(--color-info)]'
//     };
//     return variants[this.variant()];
//   });

//   protected trendBadgeClasses = computed(() => {
//     const isPositive = this.trend() === 'up';
//     const isNegative = this.trend() === 'down';

//     const bg = isPositive
//       ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)]'
//       : isNegative
//         ? 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error-border)]'
//         : 'bg-[var(--bg-ternary)] text-[var(--text-secondary)] border-[var(--border-secondary)]';

//     return `inline-flex items-center gap-1 text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] px-2 py-0.5 rounded-[var(--ui-border-radius-pill)] border ${bg}`;
//   });

//   protected trendIcon = computed(() => {
//     if (this.trend() === 'up') return 'pi pi-arrow-up-right';
//     if (this.trend() === 'down') return 'pi pi-arrow-down-right';
//     return 'pi pi-minus';
//   });
// }