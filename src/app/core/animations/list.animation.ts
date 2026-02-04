import { 
  trigger, 
  transition, 
  style, 
  animate, 
  query, 
  stagger, 
  AnimationTriggerMetadata 
} from '@angular/animations';

export const listAnimation: AnimationTriggerMetadata = trigger('listAnimation', [
  transition('* => *', [ // on any state change
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(50, [
        animate(
          '0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ], { optional: true })
  ])
]);

export const fadeInAnimation: AnimationTriggerMetadata = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('0.3s ease-out', style({ opacity: 1 }))
  ])
]);