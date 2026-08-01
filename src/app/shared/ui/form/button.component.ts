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
  [styleClass]="buttonClasses()"
  (onClick)="clicked.emit($event)">
  <ng-content></ng-content>
</p-button>
  `,
  styles: [`
:host ::ng-deep .app-btn{
    border-radius:12px;
    font-weight:600;
    transition:all .18s ease;
    letter-spacing:.1px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:.45rem;
}

:host ::ng-deep .app-btn .p-button-icon{
    font-size:.9rem;
}

:host ::ng-deep .app-btn:hover{
    transform:translateY(-1px);
}

:host ::ng-deep .app-btn:active{
    transform:translateY(0);
}

:host ::ng-deep .app-btn:focus-visible{
    box-shadow:0 0 0 3px var(--accent-focus);
}

:host ::ng-deep .app-btn-sm{
    height:34px;
    padding:0 .85rem;
    font-size:.82rem;
}

:host ::ng-deep .app-btn-md{
    height:40px;
    padding:0 1rem;
    font-size:.9rem;
}

:host ::ng-deep .app-btn-lg{
    height:46px;
    padding:0 1.25rem;
    font-size:1rem;
}

/* Primary */

:host ::ng-deep .app-btn-primary{
    box-shadow:0 2px 8px color-mix(in srgb,var(--accent-primary) 22%, transparent);
}

:host ::ng-deep .app-btn-primary:hover{
    box-shadow:0 6px 18px color-mix(in srgb,var(--accent-primary) 30%, transparent);
}

/* Secondary */

:host ::ng-deep .app-btn-secondary:hover{
    background:var(--component-bg-hover);
}

/* Ghost */

:host ::ng-deep .app-btn-ghost:hover{
    background:var(--component-bg-hover);
}

/* Link */

:host ::ng-deep .app-btn-link:hover{
    text-decoration:underline;
}

/* Success */

:host ::ng-deep .app-btn-success{
    box-shadow:0 2px 8px color-mix(in srgb,var(--color-success) 20%, transparent);
}

/* Danger */

:host ::ng-deep .app-btn-danger{
    box-shadow:0 2px 8px color-mix(in srgb,var(--color-error) 18%, transparent);
}
`]
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
  protected buttonClasses = computed(() => {
    const size = {
      sm: 'app-btn-sm',
      md: 'app-btn-md',
      lg: 'app-btn-lg'
    }[this.size()];

    const variant = {
      primary: 'app-btn-primary',
      secondary: 'app-btn-secondary',
      success: 'app-btn-success',
      danger: 'app-btn-danger',
      ghost: 'app-btn-ghost',
      link: 'app-btn-link'
    }[this.variant()];

    return `app-btn ${size} ${variant}`;
  });
}