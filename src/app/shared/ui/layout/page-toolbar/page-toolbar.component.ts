// src/app/shared/ui/layout/page-toolbar.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-page-toolbar
 * Purpose: Secondary toolbar below the page header for filters, tabs, or
 * bulk actions. This is the canonical toolbar pattern for the page layout
 * system — prefer this over app-page-header's built-in [toolbar] slot for
 * new usage, since this component owns a dedicated, documented padding
 * scale and left/right split layout.
 */
@Component({
  selector: 'app-page-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-page-toolbar-host',
  },
  template: `
    <div class="app-page-toolbar" [class.app-page-toolbar--padded]="padded()">
      <div class="app-page-toolbar__left">
        <ng-content select="[toolbar-left]"></ng-content>
        <ng-content></ng-content>
      </div>
      <div class="app-page-toolbar__right">
        <ng-content select="[toolbar-right]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host.app-page-toolbar-host {
      display: block;
      width: 100%;
    }

    .app-page-toolbar {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--spacing-md);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      background: var(--bg-primary);
    }

    @media (min-width: 768px) {
      .app-page-toolbar {
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
      }
    }

    .app-page-toolbar--padded {
      padding: var(--spacing-md) var(--spacing-2xl);
    }

    .app-page-toolbar__left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex: 1;
      min-width: 0;
      flex-wrap: wrap;
    }

    .app-page-toolbar__right {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-shrink: 0;
    }
  `],
})
export class PageToolbarComponent {
  padded = input<boolean>(true);
}

// // src/app/shared/ui/layout/page-toolbar.component.ts
// import { Component, ChangeDetectionStrategy, input } from '@angular/core';

// /**
//  * Component: app-page-toolbar
//  * Purpose: Secondary toolbar below the page header for filters, tabs, or bulk actions.
//  */
// @Component({
//   selector: 'app-page-toolbar',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: { class: 'block w-full' },
//   template: `
//     <div
//       class="flex flex-col md:flex-row md:items-center justify-between gap-[var(--spacing-md)] border-b border-[var(--border-secondary)] bg-[var(--bg-primary)]"
//       [class.px-[var(--spacing-3xl)]]="padded()"
//       [class.py-[var(--spacing-lg)]]="padded()">
//       <div class="flex items-center gap-[var(--spacing-md)] flex-1">
//         <ng-content select="[toolbar-left]"></ng-content>
//       </div>
//       <div class="flex items-center gap-[var(--spacing-md)]">
//         <ng-content select="[toolbar-right]"></ng-content>
//       </div>
//     </div>
//   `,
// })
// export class PageToolbarComponent {
//   padded = input<boolean>(true);
// }
