// src/app/shared/ui/layout/page-content.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type PageContentDensity = 'compact' | 'normal' | 'comfortable';

/**
 * Component: app-page-content
 * Purpose: Main content region beneath app-page-header, with token-driven
 * padding density and an optional max-width constraint for readability
 * on ultra-wide monitors.
 */
@Component({
  selector: 'app-page-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-page-content-host',
  },
  template: `
    <main
      class="app-page-content"
      [class.app-page-content--constrained]="!fullWidth()"
      [class.app-page-content--compact]="padded() && density() === 'compact'"
      [class.app-page-content--normal]="padded() && density() === 'normal'"
      [class.app-page-content--comfortable]="padded() && density() === 'comfortable'">
      <ng-content></ng-content>
    </main>
  `,
  styles: [`
    :host.app-page-content-host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
    }

    .app-page-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      margin-inline: auto;
    }

    /* No --content-max-width token exists yet in the theme file;
       recommend adding one. Kept as a single named value here rather
       than an inline magic number. */
    .app-page-content--constrained {
      max-width: 100rem; /* 1600px */
    }

    .app-page-content--compact {
      padding: var(--spacing-2xl);
    }

    .app-page-content--normal {
      padding: var(--spacing-3xl);
    }

    .app-page-content--comfortable {
      padding: var(--spacing-4xl);
    }
  `],
})
export class PageContentComponent {
  padded = input<boolean>(true);
  fullWidth = input<boolean>(false);
  density = input<PageContentDensity>('normal');
}
// // src/app/shared/ui/layout/page-content.component.ts
// import { Component, ChangeDetectionStrategy, input } from '@angular/core';

// @Component({
//   selector: 'app-page-content',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: {
//     class: 'flex flex-col flex-1 w-full'
//   },
//   template: `
//     <main 
//       class="flex flex-col flex-1 w-full mx-auto" 
//       [class.max-w-[1600px]]="!fullWidth()"
//       [class.p-4]="padded() && density() === 'compact'"
//       [class.p-6]="padded() && density() === 'normal'"
//       [class.p-8]="padded() && density() === 'comfortable'">
//       <ng-content></ng-content>
//     </main>
//   `
// })
// export class PageContentComponent {
//   padded = input<boolean>(true);
//   fullWidth = input<boolean>(false);
//   density = input<'compact' | 'normal' | 'comfortable'>('normal');
// }
