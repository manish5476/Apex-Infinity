import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-page-content
 * Purpose: Container for the main content of a page, handles standardized padding and max-width.
 * Inputs: padded (boolean)
 * Content Projection: Main page content
 * Used By: Global
 */
@Component({
  selector: 'app-page-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full flex-1'
  },
  template: `
    <main class="flex-1 w-full mx-auto max-w-[1600px]" [class.p-6]="padded()">
      <ng-content></ng-content>
    </main>
  `
})
export class PageContentComponent {
  padded = input<boolean>(true);
}
