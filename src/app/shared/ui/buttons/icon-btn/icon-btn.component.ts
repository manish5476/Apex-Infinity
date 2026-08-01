import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

/**
 * AppIconBtnComponent — Shared icon-only action button.
 *
 * A thin, strictly-typed wrapper around PrimeNG `p-button` configured
 * for the icon-action pattern. Replaces every ad-hoc `.head-btn`,
 * `.icon-action`, `.tool-btn`, etc. class scattered across the app.
 *
 * Usage:
 *   <app-icon-btn icon="pi pi-search" tooltip="Search (Ctrl+K)" (clicked)="..." />
 *
 * Used in: sidebar, header, toolbar, dialogs, tables, cards.
 */
@Component({
  selector: 'app-icon-btn',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-button
      [icon]="icon()"
      [rounded]="true"
      [text]="!active()"
      [outlined]="active()"
      [severity]="active() ? 'primary' : severity()"
      [size]="size()"
      [disabled]="disabled()"
      [pTooltip]="tooltip()"
      [tooltipPosition]="tooltipPosition()"
      [attr.aria-label]="ariaLabel() || tooltip()"
      [attr.aria-pressed]="active() ? true : null"
      (onClick)="clicked.emit($event)"
    />
  `,
})
export class IconBtnComponent {
  /** PrimeIcons class string, e.g. 'pi pi-search'. */
  icon = input.required<string>();

  /** Tooltip text. Also serves as aria-label fallback. */
  tooltip = input<string>('');

  /** Override aria-label when semantically different from tooltip. */
  ariaLabel = input<string>('');

  /** PrimeNG severity — applies colour scheme. */
  severity = input<
    'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast'
  >('secondary');

  /** PrimeNG size. */
  size = input<'small' | 'large'>('small');

  /** Disabled state. */
  disabled = input<boolean>(false);

  /**
   * Active/toggled state — renders as `outlined` with primary severity
   * to give a pressed/on appearance (e.g. pin button when pinned).
   */
  active = input<boolean>(false);

  /** Tooltip display position. */
  tooltipPosition = input<'top' | 'right' | 'bottom' | 'left'>('bottom');

  /** Emits the native MouseEvent on click. */
  clicked = output<MouseEvent>();
}
