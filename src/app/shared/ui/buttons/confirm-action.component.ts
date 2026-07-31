// src/app/shared/ui/buttons/confirm-action.component.ts
import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

/**
 * Component: app-confirm-action
 * Purpose: Wraps any projected trigger element to require confirmation before
 * emitting. Delegates entirely to PrimeNG ConfirmationService — requires
 * <p-confirmDialog /> mounted once at the app root.
 */
@Component({
    selector: 'app-confirm-action',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'inline-flex',
        '(click)': 'onHostClick($event)',
    },
    template: `<ng-content></ng-content>`,
})
export class ConfirmActionComponent {
    private confirmationService = inject(ConfirmationService);

    message = input<string>('Are you sure you want to proceed?');
    header = input<string>('Confirm Action');
    icon = input<string>('pi pi-exclamation-triangle');
    acceptLabel = input<string>('Yes, continue');
    rejectLabel = input<string>('Cancel');
    severity = input<'danger' | 'primary'>('danger');

    confirmed = output<void>();

    protected onHostClick(event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        this.confirmationService.confirm({
            message: this.message(),
            header: this.header(),
            icon: this.icon(),
            acceptButtonProps: { severity: this.severity(), label: this.acceptLabel() },
            rejectButtonProps: { severity: 'secondary', outlined: true, label: this.rejectLabel() },
            accept: () => this.confirmed.emit(),
        });
    }
}