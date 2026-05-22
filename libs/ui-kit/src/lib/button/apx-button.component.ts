import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ApxButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ApxButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'apx-button',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="apx-button apx-focus-ring"
      [ngClass]="['apx-button--' + variant(), 'apx-button--' + size()]"
      [attr.type]="type()"
      [disabled]="disabled()">
      <ng-content />
    </button>
  `,
  styles: [`
    .apx-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--apx-space-2);
      border: 1px solid transparent;
      border-radius: var(--apx-radius-md);
      font-family: var(--apx-font-sans);
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      transition:
        transform var(--apx-duration-fast) var(--apx-ease-standard),
        background var(--apx-duration-base) var(--apx-ease-standard),
        border-color var(--apx-duration-base) var(--apx-ease-standard),
        box-shadow var(--apx-duration-base) var(--apx-ease-standard);
    }

    .apx-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--apx-shadow-sm);
    }

    .apx-button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .apx-button--sm { min-height: 2rem; padding: 0 var(--apx-space-3); font-size: var(--apx-text-xs); }
    .apx-button--md { min-height: 2.5rem; padding: 0 var(--apx-space-4); font-size: var(--apx-text-sm); }
    .apx-button--lg { min-height: 3rem; padding: 0 var(--apx-space-5); font-size: var(--apx-text-md); }

    .apx-button--primary {
      color: #fff;
      background: var(--apx-gradient-brand);
      border-color: color-mix(in srgb, var(--apx-color-primary) 72%, #000);
    }

    .apx-button--secondary {
      color: var(--apx-color-ink);
      background: var(--apx-color-surface);
      border-color: var(--apx-color-border);
    }

    .apx-button--ghost {
      color: var(--apx-color-muted);
      background: transparent;
      border-color: transparent;
    }

    .apx-button--danger {
      color: #fff;
      background: var(--apx-color-danger);
      border-color: color-mix(in srgb, var(--apx-color-danger) 82%, #000);
    }
  `]
})
export class ApxButtonComponent {
  readonly variant = input<ApxButtonVariant>('primary');
  readonly size = input<ApxButtonSize>('md');
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
}
