import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Component: app-page
 * Purpose: Standard base layout wrapper for all feature pages.
 * Content Projection: Header, Content, etc.
 * Used By: Global
 */
@Component({
  selector: 'app-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full min-h-screen flex flex-col bg-slate-50'
  },
  template: `
    <div class="flex-1 flex flex-col w-full h-full">
      <ng-content></ng-content>
    </div>
  `
})
export class PageComponent {}
