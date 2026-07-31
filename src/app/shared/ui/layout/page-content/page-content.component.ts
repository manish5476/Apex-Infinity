// src/app/shared/ui/layout/page-content.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-page-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full flex-1'
  },
  template: `
    <main 
      class="flex-1 w-full mx-auto max-w-[1600px]" 
      [class.p-[var(--spacing-xl)]]="padded() && density() === 'compact'"
      [class.p-[var(--spacing-3xl)]]="padded() && density() === 'normal'"
      [class.p-[var(--spacing-4xl)]]="padded() && density() === 'comfortable'">
      <ng-content></ng-content>
    </main>
  `
})
export class PageContentComponent {
  padded = input<boolean>(true);
  density = input<'compact' | 'normal' | 'comfortable'>('normal');
}