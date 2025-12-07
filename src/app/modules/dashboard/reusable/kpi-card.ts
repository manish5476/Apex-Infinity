import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'kpi-card',
  imports: [CommonModule],
  template: `
    <div class="kpi-card" [class.loading]="value === null">
      <div class="top">
        <div class="icon-box"><i class="pi" [ngClass]="icon"></i></div>
        @if(growth !== null) {
          <div class="trend" [ngClass]="isPositive() ? 'pos' : 'neg'">
            <i class="pi" [ngClass]="isPositive() ? 'pi-arrow-up' : 'pi-arrow-down'"></i>
            {{ growth }}%
          </div>
        }
      </div>
      <div class="bottom">
        <span class="label">{{ label }}</span>
        <span class="value">{{ formattedValue() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: 20px;
      height: 140px;
      display: flex; flex-direction: column; justify-content: space-between;
      position: relative; overflow: hidden;
      transition: transform 0.2s;
      
      &:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
      &::before {
        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
        opacity: 0.8;
      }

      .top {
        display: flex; justify-content: space-between; align-items: start;
        .icon-box {
          width: 38px; height: 38px; background: var(--bg-ternary);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary);
        }
        .trend {
          font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;
          &.pos { background: rgba(16, 185, 129, 0.1); color: var(--color-success); }
          &.neg { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }
          i { font-size: 9px; }
        }
      }

      .bottom {
        display: flex; flex-direction: column; gap: 4px;
        .label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
        .value { font-size: 24px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
      }
    }
  `]
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | null = null;
  @Input() growth: number | null = null;
  @Input() icon = 'pi-box';
  @Input() isCurrency = true;

  isPositive = computed(() => (this.growth ?? 0) >= 0);
  formattedValue = computed(() => {
    if (this.value === null) return '--';
    return this.isCurrency 
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(this.value)
      : this.value.toLocaleString();
  });
}

