// src/app/shared/ui/layout/bento-grid.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type BentoItemSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
export type BentoItemPriority = 'high' | 'normal' | 'low';
export type BentoLayout = 'dashboard' | 'forms' | 'analytics' | 'adaptive' | 'asymmetric';
export type BentoDensity = 'compact' | 'comfortable' | 'relaxed' | 'airy';

/**
 * Component: app-bento-item
 * Purpose: Individual tile within a Bento Grid with configurable
 * column/row spanning. Note: `size` only takes effect at breakpoints
 * where the parent app-bento-grid's `layout` provides enough columns —
 * e.g. size="hero" (4-col span) inside layout="forms" (max 3 cols) will
 * span the available columns and wrap, not force a 4th column.
 */
@Component({
  selector: 'app-bento-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
  template: `
    <div class="app-bento-item__inner">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      transition: var(--transition-base);
    }

    .app-bento-item__inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      width: 100%;
    }

    /* ===== Size → grid span ===== */

    :host.app-bento-item--xs,
    :host.app-bento-item--sm {
      grid-column: span 1;
      grid-row: span 1;
    }

    :host.app-bento-item--md {
      grid-column: span 1;
      grid-row: span 1;
    }
    @media (min-width: 768px) {
      :host.app-bento-item--md { grid-column: span 2; }
    }

    :host.app-bento-item--lg {
      grid-column: span 1;
      grid-row: span 2;
    }
    @media (min-width: 768px) {
      :host.app-bento-item--lg { grid-column: span 2; }
    }

    :host.app-bento-item--xl {
      grid-column: span 1;
      grid-row: span 2;
    }
    @media (min-width: 768px) {
      :host.app-bento-item--xl { grid-column: span 2; }
    }
    @media (min-width: 1024px) {
      :host.app-bento-item--xl { grid-column: span 3; }
    }

    :host.app-bento-item--hero {
      grid-column: span 1;
      grid-row: span 2;
    }
    @media (min-width: 768px) {
      :host.app-bento-item--hero { grid-column: span 2; }
    }
    @media (min-width: 1024px) {
      :host.app-bento-item--hero { grid-column: span 4; }
    }

    /* ===== Priority ===== */

    :host.app-bento-item--priority-high { order: -1; }
    :host.app-bento-item--priority-low  { order: 9999; }

    /* ===== Sticky ===== */

    :host.app-bento-item--sticky {
      position: sticky;
      /* No dedicated token exists yet; falls back to 24px (Tailwind's
         top-6) if the consuming app doesn't define --layout-sticky-offset.
         Same pattern used in app-page-header for consistency. */
      top: var(--layout-sticky-offset, 24px);
      z-index: var(--z-sticky);
    }

    /* ===== Featured ===== */

    :host.app-bento-item--featured {
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--elevation-2), 0 0 0 2px var(--accent-primary);
    }
  `],
})
export class BentoItemComponent {
  size = input<BentoItemSize>('md');
  priority = input<BentoItemPriority>('normal');
  sticky = input<boolean>(false);
  featured = input<boolean>(false);

  protected hostClasses = computed(() => {
    return [
      `app-bento-item--${this.size()}`,
      `app-bento-item--priority-${this.priority()}`,
      this.sticky() ? 'app-bento-item--sticky' : '',
      this.featured() ? 'app-bento-item--featured' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}

/**
 * Component: app-bento-grid
 * Purpose: Dense-packing dashboard layout engine with five column-count
 * presets and four spacing densities. Column breakpoints are viewport-
 * relative (768/1024/1280px); if this grid is ever embedded in a
 * variable-width container (e.g. inside a drawer), consider migrating
 * to container queries — see suggestion in review notes.
 */
@Component({
  selector: 'app-bento-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'gridClasses()',
    '[style]': 'gridStyle()',
  },
  template: `<ng-content></ng-content>`,
  styles: [`
    :host {
      display: grid;
      width: 100%;
      grid-auto-flow: row dense;
    }

    /* ===== Density → gap + row height ===== */

    :host.app-bento-grid--compact {
      gap: var(--spacing-md);
    }
    :host.app-bento-grid--comfortable {
      gap: var(--spacing-lg);
    }
    :host.app-bento-grid--relaxed {
      gap: var(--spacing-xl);
    }
    :host.app-bento-grid--airy {
      gap: var(--spacing-2xl);
    }

    /* ===== Layout → column count per breakpoint ===== */

    :host.app-bento-grid--dashboard {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    @media (min-width: 768px) {
      :host.app-bento-grid--dashboard { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      :host.app-bento-grid--dashboard { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }

    :host.app-bento-grid--forms {
      grid-template-columns: repeat(1, minmax(0, 1fr));
      align-items: start;
    }
    @media (min-width: 1024px) {
      :host.app-bento-grid--forms { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    :host.app-bento-grid--analytics {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    @media (min-width: 768px) {
      :host.app-bento-grid--analytics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 1280px) {
      :host.app-bento-grid--analytics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }

    :host.app-bento-grid--adaptive {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    @media (min-width: 768px) {
      :host.app-bento-grid--adaptive { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      :host.app-bento-grid--adaptive { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 1280px) {
      :host.app-bento-grid--adaptive { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }

    :host.app-bento-grid--asymmetric {
      grid-template-columns: repeat(1, minmax(0, 1fr));
      align-items: start;
    }
    @media (min-width: 1024px) {
      :host.app-bento-grid--asymmetric { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
  `],
})
export class BentoGridComponent {
  layout = input<BentoLayout>('adaptive');
  density = input<BentoDensity>('comfortable');

  // No dedicated --bento-row-* token scale exists yet; centralized here
  // as named constants rather than inline magic numbers, pending a real
  // token addition (see suggestions below).
  private readonly rowHeightScale: Record<BentoDensity, string> = {
    compact: '7.5rem',      // 120px
    comfortable: '8.75rem', // 140px
    relaxed: '10rem',       // 160px
    airy: '12.5rem',        // 200px
  };

  protected gridClasses = computed(() => {
    return `app-bento-grid--${this.layout()} app-bento-grid--${this.density()}`;
  });

  protected gridStyle = computed(() => {
    return { 'grid-auto-rows': `minmax(${this.rowHeightScale[this.density()]}, auto)` };
  });
}// // src/app/shared/ui/layout/bento-grid.component.ts
// import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

// /**
//  * Component: app-bento-item
//  * Purpose: Individual tile within a Bento Grid with configurable column/row spanning.
//  */
// @Component({
//     selector: 'app-bento-item',
//     standalone: true,
//     changeDetection: ChangeDetectionStrategy.OnPush,
//     host: {
//         '[class]': 'hostClasses()'
//     },
//     template: `
//     <div class="h-full w-full flex flex-col justify-between">
//       <ng-content></ng-content>
//     </div>
//   `
// })
// export class BentoItemComponent {
//     size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'>('md');
//     priority = input<'high' | 'normal' | 'low'>('normal');
//     sticky = input<boolean>(false);
//     featured = input<boolean>(false);

//     protected hostClasses = computed(() => {
//         const sizeClasses = {
//             xs: 'col-span-1 row-span-1',
//             sm: 'col-span-1 row-span-1',
//             md: 'col-span-1 md:col-span-2 row-span-1',
//             lg: 'col-span-1 md:col-span-2 row-span-2',
//             xl: 'col-span-1 md:col-span-2 lg:col-span-3 row-span-2',
//             hero: 'col-span-1 md:col-span-2 lg:col-span-4 row-span-2'
//         };

//         const priorityClasses = {
//             high: 'order-first',
//             normal: '',
//             low: 'order-last'
//         };

//         const stickyClass = this.sticky() ? 'sticky top-6 z-10' : '';

//         const base = 'block h-full w-full transition-[var(--transition-base)]';
//         const highlight = this.featured() ? 'ring-2 ring-[var(--accent-primary)] shadow-[var(--elevation-2)] rounded-[var(--radius-xl)]' : '';

//         return `${base} ${sizeClasses[this.size()]} ${priorityClasses[this.priority()]} ${stickyClass} ${highlight}`;
//     });
// }

// /**
//  * Component: app-bento-grid
//  * Purpose: Intelligent, dense-packing Enterprise Layout Engine.
//  */
// @Component({
//     selector: 'app-bento-grid',
//     standalone: true,
//     changeDetection: ChangeDetectionStrategy.OnPush,
//     host: {
//         '[class]': 'gridClasses()',
//         '[style.grid-auto-flow]': '"row dense"',
//         '[style.grid-auto-rows]': 'autoRows()'
//     },
//     template: `<ng-content></ng-content>`
// })
// export class BentoGridComponent {
//     layout = input<'dashboard' | 'forms' | 'analytics' | 'adaptive' | 'asymmetric'>('adaptive');
//     density = input<'compact' | 'comfortable' | 'relaxed' | 'airy'>('comfortable');

//     protected gridClasses = computed(() => {
//         const gapClass = {
//             compact: 'gap-[var(--spacing-md)]',
//             comfortable: 'gap-[var(--spacing-lg)]',
//             relaxed: 'gap-[var(--spacing-xl)]',
//             airy: 'gap-[var(--spacing-2xl)]'
//         }[this.density()];

//         const layoutClass = {
//             dashboard: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
//             forms: 'grid-cols-1 lg:grid-cols-3 items-start',
//             analytics: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
//             adaptive: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
//             asymmetric: 'grid-cols-1 lg:grid-cols-3 items-start'
//         }[this.layout()];

//         return `grid w-full ${layoutClass} ${gapClass}`;
//     });

//     protected autoRows = computed(() => {
//         return {
//             compact: 'minmax(120px, auto)',
//             comfortable: 'minmax(140px, auto)',
//             relaxed: 'minmax(160px, auto)',
//             airy: 'minmax(200px, auto)'
//         }[this.density()];
//     });
// }
