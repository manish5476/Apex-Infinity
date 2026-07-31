import { trigger, transition, style, animate } from '@angular/animations';

export const wizardStepAnimation = trigger('wizardStep', [
    transition(':increment', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms cubic-bezier(0.2, 0.9, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
    ]),
    transition(':decrement', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms cubic-bezier(0.2, 0.9, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
    ])
]);