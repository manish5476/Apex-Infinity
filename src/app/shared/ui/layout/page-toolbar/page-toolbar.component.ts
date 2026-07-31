// src/app/shared/ui/layout/page-toolbar.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-page-toolbar
 * Purpose: Secondary toolbar below the page header for filters, tabs, or bulk actions.
 */
@Component({
  selector: 'app-page-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-[var(--spacing-md)] border-b border-[var(--border-secondary)] bg-[var(--bg-primary)]"
      [class.px-[var(--spacing-3xl)]]="padded()"
      [class.py-[var(--spacing-lg)]]="padded()">
      <div class="flex items-center gap-[var(--spacing-md)] flex-1">
        <ng-content select="[toolbar-left]"></ng-content>
      </div>
      <div class="flex items-center gap-[var(--spacing-md)]">
        <ng-content select="[toolbar-right]"></ng-content>
      </div>
    </div>
  `,
})
export class PageToolbarComponent {
  padded = input<boolean>(true);
}