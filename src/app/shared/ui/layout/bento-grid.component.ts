// src/app/shared/ui/layout/bento-grid.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

/**
 * Component: app-bento-item
 * Purpose: Individual tile within a Bento Grid with configurable column/row spanning.
 */
@Component({
    selector: 'app-bento-item',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'hostClasses()'
    },
    template: `
    <div class="h-full w-full flex flex-col justify-between">
      <ng-content></ng-content>
    </div>
  `
})
export class BentoItemComponent {
    size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'>('md');
    priority = input<'high' | 'normal' | 'low'>('normal');
    sticky = input<boolean>(false);
    featured = input<boolean>(false);

    protected hostClasses = computed(() => {
        const sizeClasses = {
            xs: 'col-span-1 row-span-1',
            sm: 'col-span-1 row-span-1',
            md: 'col-span-1 md:col-span-2 row-span-1',
            lg: 'col-span-1 md:col-span-2 row-span-2',
            xl: 'col-span-1 md:col-span-2 lg:col-span-3 row-span-2',
            hero: 'col-span-1 md:col-span-2 lg:col-span-4 row-span-2'
        };

        const priorityClasses = {
            high: 'order-first',
            normal: '',
            low: 'order-last'
        };

        const stickyClass = this.sticky() ? 'sticky top-6 z-10' : '';

        const base = 'block h-full w-full transition-[var(--transition-base)]';
        const highlight = this.featured() ? 'ring-2 ring-[var(--accent-primary)] shadow-[var(--elevation-2)] rounded-[var(--radius-xl)]' : '';

        return `${base} ${sizeClasses[this.size()]} ${priorityClasses[this.priority()]} ${stickyClass} ${highlight}`;
    });
}

/**
 * Component: app-bento-grid
 * Purpose: Intelligent, dense-packing Enterprise Layout Engine.
 */
@Component({
    selector: 'app-bento-grid',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'gridClasses()',
        '[style.grid-auto-flow]': '"row dense"',
        '[style.grid-auto-rows]': 'autoRows()'
    },
    template: `<ng-content></ng-content>`
})
export class BentoGridComponent {
    layout = input<'dashboard' | 'forms' | 'analytics' | 'adaptive' | 'asymmetric'>('adaptive');
    density = input<'compact' | 'comfortable' | 'relaxed' | 'airy'>('comfortable');

    protected gridClasses = computed(() => {
        const gapClass = {
            compact: 'gap-[var(--spacing-md)]',
            comfortable: 'gap-[var(--spacing-lg)]',
            relaxed: 'gap-[var(--spacing-xl)]',
            airy: 'gap-[var(--spacing-2xl)]'
        }[this.density()];

        const layoutClass = {
            dashboard: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
            forms: 'grid-cols-1 lg:grid-cols-3 items-start',
            analytics: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
            adaptive: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            asymmetric: 'grid-cols-1 lg:grid-cols-3 items-start'
        }[this.layout()];

        return `grid w-full ${layoutClass} ${gapClass}`;
    });

    protected autoRows = computed(() => {
        return {
            compact: 'minmax(120px, auto)',
            comfortable: 'minmax(140px, auto)',
            relaxed: 'minmax(160px, auto)',
            airy: 'minmax(200px, auto)'
        }[this.density()];
    });
}