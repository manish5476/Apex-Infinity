import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TagModule } from 'primeng/tag';

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Component: app-status-badge
 * Purpose: Semantic status indicator wrapping PrimeNG Tag.
 * Inputs: status (BadgeStatus), label (string), icon (string, optional)
 * Used By: Global
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-tag 
      [value]="label()" 
      [severity]="severity()" 
      [icon]="icon()" 
      [rounded]="rounded()">
    </p-tag>
  `
})
export class StatusBadgeComponent {
  status = input<BadgeStatus>('neutral');
  label = input.required<string>();
  icon = input<string>();
  rounded = input<boolean>(false);

  severity = computed(() => {
    switch (this.status()) {
      case 'success': return 'success';
      case 'warning': return 'warn';
      case 'danger': return 'danger';
      case 'info': return 'info';
      default: return 'secondary';
    }
  });
}
