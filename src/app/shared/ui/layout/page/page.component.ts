// src/app/shared/ui/layout/page.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Component: app-page
 * Purpose: Base layout context. Applies theme background and full-screen flex.
 */
@Component({
  selector: 'app-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-page-host',
  },
  template: `
    <div class="app-page">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host.app-page-host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 100%;
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .app-page {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 100%;
    }
  `],
})
export class PageComponent {}
// // src/app/shared/ui/layout/page.component.ts
// import { Component, ChangeDetectionStrategy } from '@angular/core';

// /**
//  * Component: app-page
//  * Purpose: Base layout context. Applies theme background and full-screen flex.
//  */
// @Component({
//   selector: 'app-page',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: {
//     class: 'flex flex-col flex-1 min-h-[100%] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
//   },
//   template: `
//     <div class="flex-1 flex flex-col w-full min-h-[100%]">
//       <ng-content></ng-content>
//     </div>
//   `
// })
// export class PageComponent { }
