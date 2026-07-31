// src/app/shared/ui/stepper/step.component.ts
import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

/**
 * Component: app-step
 * Purpose: Content slot for an individual wizard step.
 */
@Component({
    selector: 'app-step',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'w-full',
        '[class.hidden]': '!active()',
        '[class.block]': 'active()',
        '[class.animate-fade-in]': 'active()'
    },
    template: `
    <ng-content></ng-content>
  `
})
export class StepComponent {
    title = input.required<string>();
    subtitle = input<string>('');
    icon = input<string>('');
    valid = input<boolean>(true);
    active = signal<boolean>(false);
}