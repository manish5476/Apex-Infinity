import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-section
 * Purpose: Standardized section divider with optional title for splitting page content.
 * Inputs: title (string), description (string)
 * Content Projection: Section content
 * Used By: Global
 */
@Component({
  selector: 'app-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full'
  },
  template: `
    <section class="flex flex-col gap-4 mb-8">
      @if (title() || description()) {
        <div class="flex flex-col gap-1 px-1">
          @if (title()) {
            <h2 class="text-lg font-medium text-slate-900 m-0 tracking-tight">{{ title() }}</h2>
          }
          @if (description()) {
            <p class="text-sm text-slate-500 m-0">{{ description() }}</p>
          }
        </div>
      }
      <div class="w-full">
        <ng-content></ng-content>
      </div>
    </section>
  `
})
export class SectionComponent {
  title = input<string>('');
  description = input<string>('');
}
