// src/app/shared/ui/page-actions/page-actions.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type PageActionsAlign = 'start' | 'center' | 'end' | 'between';
export type PageActionsDensity = 'compact' | 'default' | 'relaxed';

/**
 * Component: app-page-actions
 * Purpose: Wrapper for primary and secondary actions, typically projected
 * into app-page-header. Token-driven spacing and alignment so action groups
 * stay visually consistent with the rest of the design system across
 * breakpoints and densities.
 *
 * Content Projection:
 *  - default slot: buttons, dropdowns, split-buttons
 *  - [separator]: optional visual divider between grouped actions
 *    e.g. <span separator></span> between a secondary-actions group
 *    and a primary CTA
 *
 * Used By: Global (app-page-header, dialog/drawer footers, toolbars)
 */
@Component({
  selector: 'app-page-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-page-actions-host',
  },
  template: `
    <div
      class="app-page-actions"
      [class.app-page-actions--start]="align() === 'start'"
      [class.app-page-actions--center]="align() === 'center'"
      [class.app-page-actions--end]="align() === 'end'"
      [class.app-page-actions--between]="align() === 'between'"
      [class.app-page-actions--compact]="density() === 'compact'"
      [class.app-page-actions--relaxed]="density() === 'relaxed'">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host.app-page-actions-host {
      display: block;
      min-width: 0;
    }

    .app-page-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-start;
      row-gap: var(--spacing-md);
      column-gap: var(--spacing-lg);
    }

    .app-page-actions--start {
      justify-content: flex-start;
    }

    .app-page-actions--center {
      justify-content: center;
    }

    .app-page-actions--end {
      justify-content: flex-end;
    }

    .app-page-actions--between {
      justify-content: space-between;
    }

    .app-page-actions--compact {
      row-gap: var(--spacing-sm);
      column-gap: var(--spacing-md);
    }

    .app-page-actions--relaxed {
      row-gap: var(--spacing-lg);
      column-gap: var(--spacing-2xl);
    }

    /* Optional projected separator: <span separator></span> */
    ::ng-deep .app-page-actions > [separator] {
      display: inline-block;
      align-self: stretch;
      width: var(--ui-border-width);
      background: var(--border-primary);
      margin: var(--spacing-xs) 0;
      flex-shrink: 0;
    }
  `],
})
export class PageActionsComponent {
  /** Horizontal alignment of the action group within its container. */
  align = input<PageActionsAlign>('start');

  /** Spacing density between actions — compact for dense toolbars, relaxed for spacious headers. */
  density = input<PageActionsDensity>('default');
}
// import { Component, ChangeDetectionStrategy } from '@angular/core';

// /**
//  * Component: app-page-actions
//  * Purpose: Wrapper for primary and secondary actions, typically projected into app-page-header.
//  * Content Projection: Buttons, Dropdowns
//  * Used By: Global
//  */
// @Component({
//   selector: 'app-page-actions',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: {
//     class: 'block'
//   },
//   template: `
//     <div class="flex flex-wrap items-center gap-2">
//       <ng-content></ng-content>
//     </div>
//   `
// })
// export class PageActionsComponent {}
