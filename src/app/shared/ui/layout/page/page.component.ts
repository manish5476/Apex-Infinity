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
    class: 'block w-full min-h-screen flex flex-col bg-[var(--bg-secondary)] text-[var(--text-primary)]'
  },
  template: `
    <div class="flex-1 flex flex-col w-full h-full">
      <ng-content></ng-content>
    </div>
  `
})
export class PageComponent { }