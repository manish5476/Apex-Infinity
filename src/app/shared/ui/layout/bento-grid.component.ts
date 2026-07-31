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
    colSpan = input<1 | 2 | 3 | 4>(1);
    rowSpan = input<1 | 2>(1);
    featured = input<boolean>(false);

    protected hostClasses = computed(() => {
        const colClasses = {
            1: 'col-span-1',
            2: 'col-span-1 md:col-span-2',
            3: 'col-span-1 md:col-span-3',
            4: 'col-span-1 md:col-span-2 lg:col-span-4'
        };

        const rowClasses = {
            1: 'row-span-1',
            2: 'row-span-1 md:row-span-2'
        };

        const base = 'block h-full w-full rounded-[var(--ui-border-radius-lg)] transition-[var(--transition-base)]';
        const highlight = this.featured() ? 'ring-2 ring-[var(--accent-primary)] shadow-[var(--elevation-2)]' : '';

        return `${base} ${colClasses[this.colSpan()]} ${rowClasses[this.rowSpan()]} ${highlight}`;
    });
}

/**
 * Component: app-bento-grid
 * Purpose: Auto-responsive 4-column Bento Grid container.
 */
@Component({
    selector: 'app-bento-grid',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'gridClasses()'
    },
    template: `<ng-content></ng-content>`
})
export class BentoGridComponent {
    gap = input<'sm' | 'md' | 'lg'>('lg');

    protected gridClasses = computed(() => {
        const gapClass = {
            sm: 'gap-[var(--spacing-md)]',
            md: 'gap-[var(--spacing-lg)]',
            lg: 'gap-[var(--spacing-xl)]'
        }[this.gap()];

        return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full ${gapClass}`;
    });
}