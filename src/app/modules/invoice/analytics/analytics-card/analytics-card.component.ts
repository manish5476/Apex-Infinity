// components/analytics-card/analytics-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-card" [class]="color">
      <div class="card-header">
        <div class="icon">
          <i [class]="'icon-' + icon"></i>
        </div>
        <h3 class="title">{{ title }}</h3>
      </div>
      <div class="card-content">
        <div class="value">{{ value }}</div>
        @if (change !== undefined) {
          <div class="change" [class.positive]="change > 0" [class.negative]="change < 0">
            <i [class]="change > 0 ? 'icon-trending-up' : 'icon-trending-down'"></i>
            {{ Math.abs(change) | number:'1.1-1' }}%
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .analytics-card {
      background: white;
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-md);
      border: 1px solid transparent;
      transition: var(--transition-base);
    }

    .analytics-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .analytics-card.primary {
      border-left: 4px solid #3b82f6;
    }

    .analytics-card.success {
      border-left: 4px solid #10b981;
    }

    .analytics-card.warning {
      border-left: 4px solid #f59e0b;
    }

    .analytics-card.info {
      border-left: 4px solid #0ea5e9;
    }

    .analytics-card.danger {
      border-left: 4px solid #ef4444;
    }

    .analytics-card.purple {
      border-left: 4px solid #8b5cf6;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }

    .icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-lg);
    }

    .primary .icon { background: #dbeafe; color: #3b82f6; }
    .success .icon { background: #dcfce7; color: #10b981; }
    .warning .icon { background: #fef3c7; color: #f59e0b; }
    .info .icon { background: #e0f2fe; color: #0ea5e9; }
    .danger .icon { background: #fee2e2; color: #ef4444; }
    .purple .icon { background: #f3e8ff; color: #8b5cf6; }

    .title {
      font-size: var(--font-size-sm);
      color: #64748b;
      margin: 0;
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: #1e293b;
      line-height: 1.1;
    }

    .change {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .change.positive {
      color: #10b981;
    }

    .change.negative {
      color: #ef4444;
    }
  `]
})
export class AnalyticsCardComponent {
  @Input() title!: string;
  @Input() value!: any;
  @Input() change?: any;
  @Input() icon!: string;
  @Input() color: string = 'primary';

  Math = Math;
}