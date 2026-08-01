// src/app/shared/ui/badge/status-badge.component.ts

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import {
  BadgeSize,
  BadgeVariant,
  StatusSeverity,
  getSeverityColorClasses,
  getSeverityDotClass,
  resolveSeverityFromStatus,
} from './severity-tokens';

export type { BadgeSize, BadgeVariant, StatusSeverity };

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    role: 'status',
  },
  template: `
    @if (showDot()) {
      <span
        class="relative flex items-center justify-center shrink-0"
        [class]="dotSizeClass()">

        @if (pulse()) {
          <span
            class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75"
            [class]="dotClass()">
          </span>
        }

        <span
          class="relative inline-flex rounded-full h-full w-full"
          [class]="dotClass()">
        </span>
      </span>
    }

    @if (icon()) {
      <i [class]="icon() + ' ' + iconSizeClass()"></i>
    }

    <span
      class="truncate font-[var(--font-weight-medium)] leading-none">
      {{ displayLabel() }}
    </span>
  `,
})
export class StatusBadgeComponent {

  /**
   * Accept ANY backend value.
   */
  status = input<any>();

  /**
   * Optional custom label.
   */
  label = input<string>('');

  variant = input<BadgeVariant>('subtle');

  size = input<BadgeSize>('md');

  showDot = input(true);

  pulse = input(false);

  icon = input<string>('');

  /**
   * Normalize backend value.
   */
  protected normalizedStatus = computed(() => {

    const value = this.status();

    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {

      if ('status' in value) {
        return String(value.status);
      }

      if ('name' in value) {
        return String(value.name);
      }

      if ('label' in value) {
        return String(value.label);
      }

      return '';
    }

    return String(value);

  });

  protected severity = computed<StatusSeverity>(() =>
    resolveSeverityFromStatus(this.normalizedStatus())
  );

  protected displayLabel = computed(() => {

    if (this.label()) {
      return this.label();
    }

    const value = this.normalizedStatus();

    if (!value) {
      return '—';
    }

    return value
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

  });

  protected hostClasses = computed(() => {

    const sizeClasses: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-[10px] gap-1',
      md: 'px-2.5 py-1 text-[length:var(--font-size-xs)] gap-1.5',
      lg: 'px-3 py-1.5 text-[length:var(--font-size-sm)] gap-2',
    };

    return `
      inline-flex
      items-center
      rounded-[var(--ui-border-radius-pill)]
      border
      whitespace-nowrap
      select-none
      transition-[var(--transition-fast)]
      ${sizeClasses[this.size()]}
      ${getSeverityColorClasses(this.severity(), this.variant())}
    `;

  });

  protected dotSizeClass = computed(() => {

    switch (this.size()) {

      case 'sm':
        return 'h-1.5 w-1.5';

      case 'lg':
        return 'h-2.5 w-2.5';

      default:
        return 'h-2 w-2';

    }

  });

  protected iconSizeClass = computed(() => {

    switch (this.size()) {

      case 'sm':
        return 'text-[10px]';

      case 'lg':
        return 'text-[13px]';

      default:
        return 'text-[11px]';

    }

  });

  protected dotClass = computed(() =>
    getSeverityDotClass(this.severity(), this.variant())
  );

}


// // src/app/shared/ui/badge/status-badge.component.ts
// import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
// import {
//     StatusSeverity,
//     BadgeVariant,
//     BadgeSize,
//     getSeverityColorClasses,
//     getSeverityDotClass,
//     resolveSeverityFromStatus,
// } from './severity-tokens';

// export type { StatusSeverity, BadgeVariant, BadgeSize };

// /**
//  * Component: app-status-badge
//  * Purpose: Compact semantic indicator for entity states in data grids, header bars, detail cards.
//  * Auto-resolves severity from raw backend status strings (e.g. "in_progress" -> warning).
//  */
// @Component({
//     selector: 'app-status-badge',
//     standalone: true,
//     changeDetection: ChangeDetectionStrategy.OnPush,
//     host: {
//         '[class]': 'hostClasses()',
//         role: 'status',
//     },
//     template: `
//     @if (showDot()) {
//       <span class="relative flex items-center justify-center shrink-0" [class]="dotSizeClass()">
//         @if (pulse()) {
//           <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" [class]="dotClass()"></span>
//         }
//         <span class="relative inline-flex rounded-full h-full w-full" [class]="dotClass()"></span>
//       </span>
//     }
//     @if (icon()) {
//       <i [class]="icon() + ' ' + iconSizeClass()"></i>
//     }
//     <span class="truncate font-[var(--font-weight-medium)] leading-none">
//       {{ displayLabel() }}
//     </span>
//   `,
// })
// export class StatusBadgeComponent {
//     status = input.required<string>();
//     label = input<string>('');
//     variant = input<BadgeVariant>('subtle');
//     size = input<BadgeSize>('md');
//     showDot = input<boolean>(true);
//     pulse = input<boolean>(false);
//     icon = input<string>('');

//     protected severity = computed<StatusSeverity>(() => resolveSeverityFromStatus(this.status()));

//     protected displayLabel = computed(() => {
//         if (this.label()) return this.label();
//         return String(this.status() || '')
//             .replace(/_/g, ' ')
//             .replace(/-/g, ' ')
//             .toLowerCase()
//             .replace(/\b\w/g, (c) => c.toUpperCase());
//     });

//     protected hostClasses = computed(() => {
//         const sizeClasses: Record<BadgeSize, string> = {
//             sm: 'px-2 py-0.5 text-[10px] gap-1',
//             md: 'px-2.5 py-1 text-[length:var(--font-size-xs)] gap-1.5',
//             lg: 'px-3 py-1.5 text-[length:var(--font-size-sm)] gap-2',
//         };
//         const base = 'inline-flex items-center rounded-[var(--ui-border-radius-pill)] border transition-[var(--transition-fast)] whitespace-nowrap select-none';
//         return `${base} ${sizeClasses[this.size()]} ${getSeverityColorClasses(this.severity(), this.variant())}`;
//     });

//     protected dotSizeClass = computed(() =>
//         this.size() === 'sm' ? 'h-1.5 w-1.5' : this.size() === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2'
//     );
//     protected iconSizeClass = computed(() =>
//         this.size() === 'sm' ? 'text-[10px]' : this.size() === 'lg' ? 'text-[13px]' : 'text-[11px]'
//     );
//     protected dotClass = computed(() => getSeverityDotClass(this.severity(), this.variant()));
// }