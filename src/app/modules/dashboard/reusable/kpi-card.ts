import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-wrapper">
      <!-- Icon Container -->
      <div class="icon-box" [ngClass]="trend">
        <i [class]="'pi ' + icon"></i>
      </div>

      <!-- Content -->
      <div class="content">
        <p class="label">{{ label }}</p>
        <h2 class="value">
          {{ value | currency:'INR':'symbol':'1.0-0' }}
        </h2>
        
        <!-- Helper / Growth -->
        <div class="meta" *ngIf="growth !== undefined">
          <span class="badge" [ngClass]="growth >= 0 ? 'positive' : 'negative'">
            <i [class]="growth >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
            {{ growth }}%
          </span>
          <span class="period">vs last month</span>
        </div>
        <div class="meta" *ngIf="helperText">
          <span class="period">{{ helperText }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-wrapper {
      background: var(--glass-bg-c);
      backdrop-filter: blur(var(--glass-blur-c));
      border: 1px solid var(--glass-border-c);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl);
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-lg);
      transition: var(--transition-base);
      height: 100%;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--glass-shadow-c);
      }
    }

    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      
      &.up { background: rgba(16, 185, 129, 0.1); color: var(--color-success); }
      &.down { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }
      &.neutral { background: rgba(59, 130, 246, 0.1); color: var(--accent-primary); }
    }

    .content {
      flex: 1;
      .label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
        font-weight: var(--font-weight-medium);
      }
      .value {
        font-family: var(--font-heading);
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin-bottom: var(--spacing-sm);
      }
    }

    .meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-xs);

      .badge {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;

        &.positive { background: rgba(16, 185, 129, 0.1); color: var(--color-success); }
        &.negative { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }
      }

      .period {
        color: var(--text-tertiary);
      }
    }
  `]
})
export class KpiCardComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() value: number | null = 0;
  @Input() growth?: number;
  @Input() trend: 'up' | 'down' | 'neutral' = 'neutral';
  @Input() helperText?: string;
}

// import { Component, Input, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   standalone: true,
//   selector: 'kpi-card',
//   imports: [CommonModule],
//   template: `
//     <div class="kpi-card" [class.loading]="value === null">
//       <div class="top">
//         <div class="icon-box"><i class="pi" [ngClass]="icon"></i></div>
//         @if(growth !== null) {
//           <div class="trend" [ngClass]="isPositive() ? 'pos' : 'neg'">
//             <i class="pi" [ngClass]="isPositive() ? 'pi-arrow-up' : 'pi-arrow-down'"></i>
//             {{ growth }}%
//           </div>
//         }
//       </div>
//       <div class="bottom">
//         <span class="label">{{ label }}</span>
//         <span class="value">{{ formattedValue() }}</span>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .kpi-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: 20px;
//       height: 140px;
//       display: flex; flex-direction: column; justify-content: space-between;
//       position: relative; overflow: hidden;
//       transition: transform 0.2s;
      
//       &:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
//       &::before {
//         content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px;
//         background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
//         opacity: 0.8;
//       }

//       .top {
//         display: flex; justify-content: space-between; align-items: start;
//         .icon-box {
//           width: 38px; height: 38px; background: var(--bg-ternary);
//           border-radius: 10px; display: flex; align-items: center; justify-content: center;
//           color: var(--text-secondary);
//         }
//         .trend {
//           font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;
//           &.pos { background: rgba(16, 185, 129, 0.1); color: var(--color-success); }
//           &.neg { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }
//           i { font-size: 9px; }
//         }
//       }

//       .bottom {
//         display: flex; flex-direction: column; gap: 4px;
//         .label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
//         .value { font-size: 24px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
//       }
//     }
//   `]
// })
// export class KpiCardComponent {
//   @Input() label = '';
//   @Input() value: number | null = null;
//   @Input() growth: number | null = null;
//   @Input() icon = 'pi-box';
//   @Input() isCurrency = true;

//   isPositive = computed(() => (this.growth ?? 0) >= 0);
//   formattedValue = computed(() => {
//     if (this.value === null) return '--';
//     return this.isCurrency 
//       ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(this.value)
//       : this.value.toLocaleString();
//   });
// }

