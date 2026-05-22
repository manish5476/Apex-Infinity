import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'apx-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="apx-card" [ngClass]="{'apx-card--interactive': interactive()}">
      <ng-content />
    </section>
  `,
  styles: [`
    .apx-card {
      border-radius: var(--apx-radius-lg);
      background: var(--apx-color-surface);
      border: 1px solid var(--apx-color-border);
      box-shadow: var(--apx-shadow-xs);
      color: var(--apx-color-ink);
      transition:
        transform var(--apx-duration-base) var(--apx-ease-standard),
        box-shadow var(--apx-duration-base) var(--apx-ease-standard),
        border-color var(--apx-duration-base) var(--apx-ease-standard);
    }

    .apx-card--interactive:hover {
      transform: translateY(-2px);
      border-color: var(--apx-color-border-strong);
      box-shadow: var(--apx-shadow-md);
    }
  `]
})
export class ApxCardComponent {
  readonly interactive = input(false);
}
