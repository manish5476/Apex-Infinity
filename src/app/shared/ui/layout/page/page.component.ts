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
    class: 'flex flex-col w-full h-full min-h-0 overflow-hidden bg-[var(--bg-secondary)] text-[var(--text-primary)]'
  },
  template: `
    <div class="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
      <ng-content></ng-content>
    </div>
  `
})
export class PageComponent { }