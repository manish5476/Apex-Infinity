import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-page-toolbar
 * Purpose: A secondary toolbar below the header for filters, tabs, or bulk actions.
 * Inputs: padded (boolean)
 * Content Projection: Left content, Right content
 * Used By: Global
 */
@Component({
  selector: 'app-page-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full'
  },
  template: `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 bg-white" [class.px-6]="padded()" [class.py-3]="padded()">
      <div class="flex items-center gap-3 flex-1">
        <ng-content select="[toolbar-left]"></ng-content>
      </div>
      <div class="flex items-center gap-3">
        <ng-content select="[toolbar-right]"></ng-content>
      </div>
    </div>
  `
})
export class PageToolbarComponent {
  padded = input<boolean>(true);
}
