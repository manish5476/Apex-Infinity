// src/app/shared/ui/buttons/button.component.ts
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'link';
export type AppButtonSize = 'sm' | 'md' | 'lg';

interface VariantConfig {
  severity: 'primary' | 'secondary' | 'danger' | 'success';
  outlined?: boolean;
  text?: boolean;
}

const VARIANT_MAP: Record<AppButtonVariant, VariantConfig> = {
  primary: { severity: 'primary' },
  secondary: { severity: 'secondary', outlined: true },
  danger: { severity: 'danger' },
  success: { severity: 'success' },
  ghost: { severity: 'secondary', text: true },
  link: { severity: 'primary', text: true },
};

/**
 * Component: app-button
 * Purpose: Standardizes the app's button variant vocabulary on top of p-button so every
 * screen uses one consistent set of names instead of ad hoc severity/outlined/text combos.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <p-button
      [label]="label()"
      [icon]="icon()"
      [iconPos]="iconPosition()"
      [severity]="config().severity"
      [outlined]="!!config().outlined"
      [text]="!!config().text"
      [size]="primeSize()"
      [loading]="loading()"
      [disabled]="disabled() || loading()"
      [type]="type()"
      [rounded]="rounded()"
      (onClick)="clicked.emit($event)">
      <ng-content></ng-content>
    </p-button>
  `,
})
export class ButtonComponent {
  label = input<string>('');
  variant = input<AppButtonVariant>('primary');
  size = input<AppButtonSize>('md');
  type = input<'button' | 'submit'>('button');
  icon = input<string>('');
  iconPosition = input<'left' | 'right'>('left');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  rounded = input<boolean>(false);

  clicked = output<Event>();

  protected config = computed(() => VARIANT_MAP[this.variant()]);
  protected primeSize = computed(() =>
    this.size() === 'md' ? undefined : this.size() === 'sm' ? 'small' : 'large'
  );
}