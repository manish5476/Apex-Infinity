import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-card
 * Purpose: Standard enterprise card container.
 * Inputs: title (string), subtitle (string), padded (boolean)
 * Content Projection: Default content, "card-actions", "card-footer"
 * Used By: Global
 */
@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full h-full'
  },
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full transition-shadow duration-200 hover:shadow-md">
      @if (title() || subtitle()) {
        <div class="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div class="flex flex-col gap-1">
            @if (title()) {
              <h3 class="text-base font-semibold text-slate-900 m-0 tracking-tight">{{ title() }}</h3>
            }
            @if (subtitle()) {
              <p class="text-sm text-slate-500 m-0">{{ subtitle() }}</p>
            }
          </div>
          <div>
            <ng-content select="[card-actions]"></ng-content>
          </div>
        </div>
      }
      
      <div class="flex-1" [class.p-6]="padded()">
        <ng-content></ng-content>
      </div>
      
      <!-- Footer projection -->
      <ng-content select="[card-footer]"></ng-content>
    </div>
  `
})
export class CardComponent {
  title = input<string>('');
  subtitle = input<string>('');
  padded = input<boolean>(true);
}
