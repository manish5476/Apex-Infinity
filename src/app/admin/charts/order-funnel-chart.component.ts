import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-order-funnel-chart',
  standalone: true,
  imports: [],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </span>
          <div>
            <h3 class="card-title">Order Funnel</h3>
            <p class="card-subtitle">Pipeline conversion stages</p>
          </div>
        </div>
      </div>
    
      @if (isLoading) {
        <div class="state-overlay">
          <div class="spinner"></div><span>Loading...</span>
        </div>
      }
      @if (hasError && !isLoading) {
        <div class="state-overlay error">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Failed to load</span>
          <button class="retry-btn" (click)="loadData()">Retry</button>
        </div>
      }
    
      @if (!isLoading && !hasError && chartData) {
        <!-- Funnel Bars -->
        <div class="funnel-list">
          @for (step of funnelSteps; track step; let i = $index) {
            <div class="funnel-step">
              <div class="step-meta">
                <div class="step-dot" [style.background]="step.color"></div>
                <span class="step-label">{{ step.label }}</span>
                <span class="step-value">{{ step.value }}</span>
                <span class="step-pct">{{ step.pct }}%</span>
              </div>
              <div class="step-bar-track">
                <div class="step-bar-fill"
                  [style.width]="step.pct + '%'"
                  [style.background]="step.color">
                </div>
              </div>
              @if (i < funnelSteps.length - 1) {
                <div class="step-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                  </svg>
                </div>
              }
            </div>
          }
        </div>
        <!-- Doughnut -->
        <div class="chart-area">
          <canvas #funnelCanvas></canvas>
        </div>
      }
    </div>
    `,
  styles: [`
    .chart-card {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--elevation-1);
      transition: var(--transition-base);
      &:hover { box-shadow: var(--elevation-2); }
    }
    .card-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--spacing-md); margin-bottom: var(--spacing-xl);
    }
    .card-title-group { display: flex; align-items: center; gap: var(--spacing-md); }
    .card-icon {
      width: 36px; height: 36px; border-radius: var(--ui-border-radius);
      background: color-mix(in srgb, var(--color-warning) 12%, transparent 88%);
      color: var(--color-warning); display: flex; align-items: center; justify-content: center;
    }
    .card-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
    .card-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }

    .funnel-list { display: flex; flex-direction: column; gap: var(--spacing-sm); margin-bottom: var(--spacing-lg); }
    .funnel-step { position: relative; }
    .step-meta {
      display: flex; align-items: center; gap: var(--spacing-sm);
      margin-bottom: 6px;
    }
    .step-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .step-label { flex: 1; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
    .step-value { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .step-pct { font-size: var(--font-size-xs); color: var(--text-tertiary); min-width: 36px; text-align: right; }
    .step-bar-track {
      height: 8px; background: var(--bg-primary); border-radius: var(--ui-border-radius-pill);
      overflow: hidden; border: 1px solid var(--border-primary);
    }
    .step-bar-fill {
      height: 100%; border-radius: var(--ui-border-radius-pill);
      transition: width 0.6s cubic-bezier(0.2, 0.9, 0.2, 1);
      opacity: 0.85;
    }
    .step-arrow {
      display: flex; justify-content: center; margin-top: 4px;
      color: var(--text-tertiary); opacity: 0.5;
    }

    .chart-area {
      height: 200px;
      canvas { width: 100% !important; height: 100% !important; }
    }

    .state-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--spacing-sm);
      min-height: 200px; color: var(--text-tertiary); font-size: var(--font-size-sm);
      &.error { color: var(--color-error); }
    }
    .spinner {
      width: 28px; height: 28px; border: 2px solid var(--border-primary);
      border-top-color: var(--accent-primary); border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .retry-btn {
      padding: var(--spacing-xs) var(--spacing-lg);
      border: 1px solid var(--color-error); border-radius: var(--ui-border-radius-pill);
      background: transparent; color: var(--color-error);
      font-size: var(--font-size-xs); cursor: pointer;
    }
  `]
})
export class OrderFunnelChartComponent implements OnInit, OnDestroy {
  @ViewChild('funnelCanvas') funnelCanvas!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private chart?: Chart;

  isLoading = true;
  hasError = false;
  chartData: any = null;
  funnelSteps: { label: string; value: number; color: string; pct: number }[] = [];

  constructor(private chartService: ChartService) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.chartService.getOrderFunnel()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.chartData = res.data;
          const ds = res.data.datasets[0];
          const maxVal = Math.max(...ds.data) || 1;
          this.funnelSteps = res.data.labels.map((label: string, i: number) => ({
            label,
            value: ds.data[i],
            color: ds.backgroundColor[i],
            pct: Math.round((ds.data[i] / maxVal) * 100)
          }));
          this.isLoading = false;
          setTimeout(() => this.renderChart(), 50);
        },
        error: () => { this.isLoading = false; this.hasError = true; }
      });
  }

  renderChart(): void {
    if (!this.funnelCanvas || !this.chartData) return;
    this.chart?.destroy();
    const ctx = this.funnelCanvas.nativeElement.getContext('2d')!;
    const ds = this.chartData.datasets[0];
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartData.labels,
        datasets: [{
          ...ds,
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: 'var(--text-tertiary)', font: { size: 10 } } },
          y: {
            grid: { color: 'var(--border-secondary, rgba(0,0,0,0.06))' },
            ticks: { color: 'var(--text-tertiary)', font: { size: 10 }, stepSize: 1 }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); this.chart?.destroy(); }
}

// import { Component, OnInit, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ChartService } from '../chart.service';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// // Filter Imports

// @Component({
//   selector: 'app-order-funnel-chart',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ChartModule,
//     ProgressSpinnerModule,
//     ButtonModule,
//     TooltipModule,
//     UniversalFilterComponent // <--- Imported
//   ],
//   template: `
//     <div class="funnel-container">
//       <div class="blob blob-1"></div>
//       <div class="blob blob-2"></div>

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'order-funnel'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <div class="chart-card">
//         <div class="card-header">
//           <div>
//             <h2 class="card-title">
//               <i class="pi pi-filter header-icon"></i>
//               Conversion Funnel 
//             </h2>
//             <p class="card-subtitle">Order Lifecycle & Fulfillment Velocity</p>
//           </div>
          
//           <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" size="small" (onClick)="loadFunnel()" [loading]="loading()"></p-button>
//         </div>

//         @if (!loading()) {
//           <div class="content-grid">
//             <div class="chart-wrapper">
//               <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="320px"></p-chart>
//             </div>

//             <div class="insights-panel">
//                <div class="metric-box success">
//                  <p class="metric-label">Conversion Rate</p>
//                  <div class="metric-row">
//                    <span class="metric-value">{{ getConversionRate(3) }}%</span>
//                    <span class="metric-sub">Completed</span>
//                  </div>
//                  <div class="progress-track">
//                    <div class="progress-fill success" [style.width]="getConversionRate(3) + '%'"></div>
//                  </div>
//                </div>

//                <div class="action-box warning">
//                  <div class="action-header">
//                    <i class="pi pi-exclamation-triangle action-icon"></i>
//                    <span class="action-title">Revenue Recovery</span>
//                  </div>
//                  <p class="action-text">
//                    <span class="highlight">{{ getUnpaidCount() }} Orders</span> stalled.
//                    <br>
//                    <span class="sub-text">Potential recovery: <strong>{{ getRecoveryPotential() }}%</strong> vol.</span>
//                  </p>
//                  <button class="action-btn">Send Payment Links</button>
//                </div>
//             </div>
//           </div>
//         } @else {
//           <div class="loader-container">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p class="loader-text">Mapping Data...</p>
//           </div>
//         }
//       </div>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
//     .funnel-container { position: relative; padding: 1rem; }
    
//     .filter-section { 
//       margin-bottom: 1rem; 
//       position: relative; 
//       z-index: 2; /* Sit above blobs */
//     }

//     .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.1; z-index: 0; }
//     .blob-1 { top: -20%; right: -10%; width: 300px; height: 300px; background: #3b82f6; } /* Blue */
//     .blob-2 { bottom: -20%; left: -10%; width: 250px; height: 250px; background: #f59e0b; } /* Orange */

//     .chart-card {
//       position: relative; z-index: 1;
//       background: var(--bg-secondary, #1e293b); /* Fallback dark bg */
//       border: 1px solid var(--border-primary, rgba(255,255,255,0.1));
//       border-radius: 16px; padding: 1.5rem;
//       box-shadow: 0 4px 20px rgba(0,0,0,0.2);
//       backdrop-filter: blur(10px);
//     }

//     .card-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
//     .card-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary, #fff); margin: 0; display: flex; align-items: center; gap: 0.5rem; }
//     .header-icon { color: #3b82f6; }
//     .card-subtitle { font-size: 0.8rem; color: var(--text-secondary, #94a3b8); margin: 4px 0 0 0; font-weight: 500; }

//     .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: center; }
//     @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }

//     .chart-wrapper { height: 320px; width: 100%; }

//     /* Insights styling (compact) */
//     .insights-panel { display: flex; flex-direction: column; gap: 1rem; }
//     .metric-box { padding: 1rem; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.05); }
//     .metric-value { font-size: 2rem; font-weight: 800; color: #10b981; }
//     .metric-sub { font-size: 0.75rem; color: #fff; margin-left: 8px; font-weight: 600; }
//     .progress-track { height: 4px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 8px; overflow: hidden; }
//     .progress-fill.success { background: #10b981; height: 100%; }

//     .action-box { padding: 1rem; border-radius: 12px; border: 1px dashed rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05); }
//     .action-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
//     .action-icon { color: #f59e0b; }
//     .action-title { font-size: 0.75rem; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
//     .action-text { font-size: 0.85rem; color: #94a3b8; line-height: 1.4; margin: 0; }
//     .highlight { color: #fff; font-weight: 700; }
//     .sub-text { font-size: 0.75rem; display: block; margin-top: 4px; opacity: 0.7; }
//     .action-btn { 
//       margin-top: 1rem; width: 100%; padding: 0.5rem; border-radius: 6px; 
//       background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3);
//       color: #f59e0b; font-weight: 700; font-size: 0.75rem; cursor: pointer; text-transform: uppercase;
//       transition: all 0.2s;
//     }
//     .action-btn:hover { background: rgba(245, 158, 11, 0.25); }

//     .loader-container { height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
//     .loader-text { color: #64748b; font-weight: 600; font-size: 0.8rem; letter-spacing: 1px; }
//   `]
// })
// export class OrderFunnelChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(false);
//   chartOptions: any;

//   // Stored Filters
//   private currentFilters: any = {};

//   // 1. FILTER CONFIG
//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       dataSourceKey: 'branches',
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'Global Sales'
//     },
//     {
//       key: 'date',
//       label: 'Fulfillment Period',
//       type: 'date-range'
//     }
//   ];

//   constructor(private ChartService: ChartService) { }

//   ngOnInit() {
//     // loadFunnel is triggered by filter init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadFunnel();
//   }

//   loadFunnel() {
//     this.loading.set(true);

//     const params = {
//       startDate: this.currentFilters.startDate,
//       endDate: this.currentFilters.endDate,
//       branchId: this.currentFilters.branchId
//     };

//     setTimeout(() => {
//       this.ChartService.getOrderFunnel(
//         {
//           startDate: params.startDate,
//           endDate: params.endDate,
//         }
//       ).subscribe({
//         next: (res) => {
//           if (res.status === 'success') {
//             this.initChart(res.data);
//           }
//           this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//       });
//     }, 500);
//   }

//   private initChart(data: any) {
//     const documentStyle = getComputedStyle(document.documentElement);

//     // SAFE FALLBACK COLORS
//     const textColor = documentStyle.getPropertyValue('--text-secondary') || '#94a3b8';
//     const gridColor = 'rgba(255, 255, 255, 0.05)';

//     // Funnel Stage Colors
//     // 0: Total (Blue), 1: Unpaid (Orange), 2: Partial (Yellow), 3: Paid (Green)
//     const colors = ['#3b82f6', '#f97316', '#eab308', '#10b981'];

//     this.chartData.set({
//       labels: data.labels,
//       datasets: [
//         {
//           label: 'Orders',
//           data: data.datasets[0].data,
//           backgroundColor: colors,
//           borderColor: colors,
//           borderWidth: 0,
//           borderRadius: 4,
//           barThickness: 20,
//           barPercentage: 0.6,
//         }
//       ]
//     });

//     this.chartOptions = {
//       indexAxis: 'y', // Horizontal Funnel
//       maintainAspectRatio: false,
//       aspectRatio: 0.8,
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           backgroundColor: '#1e293b',
//           titleColor: '#fff',
//           bodyColor: '#cbd5e1',
//           borderColor: 'rgba(255,255,255,0.1)',
//           borderWidth: 1,
//           padding: 10,
//           displayColors: true,
//           callbacks: {
//             label: (context: any) => {
//               const val = context.parsed.x;
//               return ` ${val} Orders`;
//             }
//           }
//         }
//       },
//       scales: {
//         x: {
//           grid: {
//             color: gridColor,
//             drawBorder: false
//           },
//           ticks: {
//             color: textColor,
//             font: { size: 10 }
//           }
//         },
//         y: {
//           grid: {
//             display: false,
//             drawBorder: false
//           },
//           ticks: {
//             color: '#fff',
//             font: { size: 12, weight: '600' },
//             padding: 10
//           }
//         }
//       },
//       animation: { duration: 800 }
//     };
//   }

//   // --- Helpers ---
//   getConversionRate(index: number): string {
//     const d = this.chartData()?.datasets[0]?.data;
//     if (!d) return '0';
//     return ((d[index] / (d[0] || 1)) * 100).toFixed(0);
//   }

//   getUnpaidCount(): number {
//     const d = this.chartData()?.datasets[0]?.data;
//     if (!d) return 0;
//     return (d[1] || 0) + (d[2] || 0);
//   }

//   getRecoveryPotential(): string {
//     const d = this.chartData()?.datasets[0]?.data;
//     if (!d) return '0';
//     const stuck = (d[1] || 0) + (d[2] || 0);
//     return ((stuck / (d[0] || 1)) * 100).toFixed(1);
//   }
// }
