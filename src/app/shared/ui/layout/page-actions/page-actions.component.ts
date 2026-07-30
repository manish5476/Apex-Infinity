import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Component: app-page-actions
 * Purpose: Wrapper for primary and secondary actions, typically projected into app-page-header.
 * Content Projection: Buttons, Dropdowns
 * Used By: Global
 */
@Component({
  selector: 'app-page-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  },
  template: `
    <div class="flex flex-wrap items-center gap-2">
      <ng-content></ng-content>
    </div>
  `
})
export class PageActionsComponent {}
