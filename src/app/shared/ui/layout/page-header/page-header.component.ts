import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-page-header
 * Purpose: Standard page header for feature pages.
 * Inputs: title (string), subtitle (string)
 * Content Projection: Page actions or search boxes
 * Used By: Global
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full'
  },
  template: `
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 bg-white border-b border-slate-200">
      <div class="flex flex-col gap-1">
        @if (title()) {
          <h1 class="text-2xl font-semibold text-slate-900 m-0 tracking-tight">{{ title() }}</h1>
        }
        @if (subtitle()) {
          <p class="text-sm text-slate-500 m-0">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex items-center gap-3">
        <ng-content></ng-content>
      </div>
    </header>
  `
})
export class PageHeaderComponent {
  title = input<string>('');
  subtitle = input<string>('');
}
