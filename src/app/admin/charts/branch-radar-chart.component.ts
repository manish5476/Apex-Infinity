

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-branch-radar-chart',
  standalone: true,
  imports: [CommonModule],
template: `<div class="chart-card branch-radar-card">

  <!-- Header -->
  <div class="card-header">
    <div class="card-title-group">
      <span class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
          <path d="M2 8.5L22 8.5"/><path d="M2 15.5L22 15.5"/>
        </svg>
      </span>
      <div>
        <h3 class="card-title">Branch Performance</h3>
        <p class="card-subtitle">Multi-axis radar overview</p>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div class="state-overlay" *ngIf="isLoading">
    <div class="spinner"></div>
    <span>Loading...</span>
  </div>

  <!-- Error -->
  <div class="state-overlay error" *ngIf="hasError && !isLoading">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>Failed to load data</span>
    <button class="retry-btn" (click)="loadData()">Retry</button>
  </div>

  <!-- Content -->
  <ng-container *ngIf="!isLoading && !hasError">

    <!-- Branch Legends -->
    <div class="branch-legends" *ngIf="branchSummaries.length">
      <div class="legend-chip" *ngFor="let b of branchSummaries">
        <span class="legend-dot" [style.background]="b.color"></span>
        <span class="legend-name">{{ b.label }}</span>
        <span class="legend-score">{{ b.avg }}<small>avg</small></span>
      </div>
    </div>

    <!-- Radar Chart -->
    <div class="chart-area">
      <canvas #radarCanvas></canvas>
    </div>

    <!-- Axis Descriptions -->
    <div class="axis-pills" *ngIf="chartData">
      <span class="axis-pill" *ngFor="let label of chartData.labels">{{ label }}</span>
    </div>

  </ng-container>
</div>`,
styles:`.chart-card {
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  box-shadow: var(--elevation-1);
  transition: var(--transition-base);

  &:hover { box-shadow: var(--elevation-2); }
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--ui-border-radius);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent 88%);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.card-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 2px 0 0;
}

/* Branch Legends */
.branch-legends {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.legend-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--ui-border-radius-pill);
  padding: 4px 12px 4px 8px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.legend-score {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin-left: 2px;

  small {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-normal);
    color: var(--text-tertiary);
    margin-left: 1px;
  }
}

/* Chart */
.chart-area {
  height: 280px;
  position: relative;

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

/* Axis pills */
.axis-pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
  justify-content: center;
}

.axis-pill {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--ui-border-radius-pill);
  padding: 2px 10px;
}

/* States */
.state-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  min-height: 280px;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);

  &.error { color: var(--color-error); }
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.retry-btn {
  padding: var(--spacing-xs) var(--spacing-lg);
  border: 1px solid var(--color-error);
  border-radius: var(--ui-border-radius-pill);
  background: transparent;
  color: var(--color-error);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover { background: var(--color-error-bg); }
}`
})
export class BranchRadarChartComponent implements OnInit, OnDestroy {
  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private radarChart?: Chart;

  isLoading = true;
  hasError = false;

  chartData: any = null;
  branchSummaries: { label: string; avg: number; color: string }[] = [];

  constructor(private chartService: ChartService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.chartService.getBranchPerformanceRadar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.chartData = res.data;
          this.branchSummaries = res.data.datasets.map((ds: any) => ({
            label: ds.label,
            avg: Math.round(ds.data.reduce((a: number, b: number) => a + b, 0) / ds.data.length),
            color: ds.borderColor
          }));
          this.isLoading = false;
          setTimeout(() => this.renderChart(), 50);
        },
        error: () => {
          this.isLoading = false;
          this.hasError = true;
        }
      });
  }

  renderChart(): void {
    if (!this.radarCanvas || !this.chartData) return;
    this.radarChart?.destroy();
    const ctx = this.radarCanvas.nativeElement.getContext('2d')!;

    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: this.chartData.labels,
        datasets: this.chartData.datasets.map((ds: any) => ({
          ...ds,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 25,
              color: 'var(--text-tertiary, #9ca3af)',
              font: { size: 10 },
              backdropColor: 'transparent'
            },
            grid: {
              color: 'var(--border-primary, rgba(0,0,0,0.08))'
            },
            angleLines: {
              color: 'var(--border-primary, rgba(0,0,0,0.08))'
            },
            pointLabels: {
              color: 'var(--text-secondary, #6b7280)',
              font: { size: 11, weight: 500 }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.r}`
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.radarChart?.destroy();
  }
}


// import { Component, OnInit, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { ChartService } from '../chart.service';


// @Component({
//   selector: 'app-branch-radar-chart',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ChartModule,
//     ProgressSpinnerModule,
//     ButtonModule,
//     TooltipModule,
//     UniversalFilterComponent
//   ],
//   template: `
//     <div class="radar-container">

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'branch-radar'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <div class="chart-card">

//         <div class="card-header">
//           <div>
//             <h2 class="card-title">
//               <i class="pi pi-compass header-icon"></i>
//               Operational Radar 
//             </h2>
//             <p class="card-subtitle">
//               {{ currentBranchName || 'Global Network Efficiency' }}
//             </p>
//           </div>
//           <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadRadar()" [loading]="loading()"></p-button>
//         </div>

//         @if (!loading()) {
          
//           <div class="content-grid">
            
//             <div class="chart-wrapper">
//                <p-chart type="radar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
               
//                <div class="center-marker">
//                  <i class="pi pi-crosshairs"></i>
//                </div>
//             </div>

//             <div class="metrics-panel">
//                <div class="metrics-list custom-scrollbar">
//                  <h4 class="section-label">Metric Breakdown</h4>
                 
//                  @for (label of chartData()?.labels; track label; let i = $index) {
//                    <div class="metric-row group">
//                       <span class="metric-name">{{ label }}</span>
//                       <span class="metric-score" 
//                             [ngClass]="getScoreClass(chartData()?.datasets[0].data[i])">
//                         {{ chartData()?.datasets[0].data[i] }}%
//                       </span>
//                    </div>
//                  }
//                </div>

//                <div class="insight-box">
//                  <div class="insight-content">
//                    <i class="pi pi-info-circle insight-icon"></i>
//                    <div>
//                      <p class="insight-title">Efficiency Profile: {{ chartData()?.datasets[0].label }}</p>
//                      <p class="insight-text">
//                        Current profile shows a <span class="highlight">{{ getDominantMetric(chartData()) }}</span> focus.
//                        <br>Optimization suggested for lower scoring quadrants.
//                      </p>
//                    </div>
//                  </div>
//                </div>
//             </div>
//           </div>

//         } @else {
//           <div class="loader-container">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p class="loader-text">Calibrating Performance Matrix...</p>
//           </div>
//         }

//       </div>
//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .radar-container {
//       padding: var(--spacing-sm);
//       font-family: var(--font-body);
//       background: radial-gradient(circle at top right, var(--bg-ternary), transparent 70%);
//       border-radius: var(--radius-2xl);
//     }

//     .filter-section {
//       margin-bottom: var(--spacing-md);
//       /* Make filter blend in slightly */
//       opacity: 0.95;
//     }

//     /* CARD STYLES */
//     .chart-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-xl);
//       position: relative;
//       backdrop-filter: blur(10px);
//       box-shadow: var(--shadow-lg);
//     }

//     /* HEADER */
//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: var(--spacing-xl);
//     }

//     .card-title {
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       letter-spacing: -0.01em;
//     }

//     .header-icon { color: var(--accent-primary); }

//     .card-subtitle {
//       font-size: 10px;
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//       margin-top: 4px;
//     }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-2xl);
//     }
//     @media (min-width: 768px) {
//       .content-grid { grid-template-columns: 2fr 1fr; } /* Chart takes 2/3 */
//     }

//     /* CHART SECTION */
//     .chart-wrapper {
//       height: 400px;
//       position: relative;
//       display: flex;
//       justify-content: center;
//     }

//     .center-marker {
//       position: absolute;
//       top: 50%;
//       left: 50%;
//       transform: translate(-50%, -50%);
//       pointer-events: none;
//       opacity: 0.1;
//       font-size: 4rem;
//       color: var(--text-primary);
//     }

//     /* METRICS PANEL */
//     .metrics-panel {
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//       gap: var(--spacing-lg);
//     }

//     .section-label {
//       font-size: 10px;
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin-bottom: var(--spacing-md);
//     }

//     .metrics-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//       max-height: 250px;
//       overflow-y: auto;
//     }

//     .metric-row {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//       border: 1px solid var(--border-secondary);
//       background: var(--bg-ternary);
//       transition: background 0.2s;
//     }
//     .metric-row:hover {
//       background: var(--component-bg-hover);
//     }

//     .metric-name {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-secondary);
//       transition: color 0.2s;
//     }
//     .metric-row:hover .metric-name { color: var(--text-primary); }

//     .metric-score {
//       font-family: var(--font-mono);
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-sm);
//     }
//     /* Dynamic Score Colors handled by ngClass */
//     .score-high { color: var(--color-success); }
//     .score-mid { color: var(--color-info); }
//     .score-low { color: var(--color-error); }

//     /* INSIGHT BOX */
//     .insight-box {
//       margin-top: var(--spacing-md);
//       padding: var(--spacing-md);
//       border: 1px dashed var(--accent-primary);
//       border-radius: var(--ui-border-radius);
//       background: var(--color-primary-bg); /* Mix token */
//     }

//     .insight-content { display: flex; gap: var(--spacing-sm); }
//     .insight-icon { color: var(--accent-primary); margin-top: 2px; }

//     .insight-title {
//       font-weight: var(--font-weight-bold);
//       color: var(--accent-primary);
//       font-size: var(--font-size-xs);
//       margin: 0 0 4px 0;
//     }

//     .insight-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.5;
//       margin: 0;
//     }
//     .highlight { color: var(--text-primary); font-weight: bold; }

//     /* SCROLLBAR */
//     .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }

//     /* LOADER */
//     .loader-container {
//       height: 400px;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//     }
//   `]
// })
// export class BranchRadarChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(false);
//   chartOptions: any;
//   currentBranchName = '';

//   private currentFilters: any = {};
//   private documentStyle = getComputedStyle(document.documentElement);

//   // 1. FILTER CONFIG
//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       dataSourceKey: 'branches',
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'Global Network Average'
//     }
//   ];

//   constructor(private analyticsService: ChartService) { }

//   ngOnInit() {
//     this.initOptions();
//     // loadRadar triggered by filter init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;

//     // Optional: Extract name for display if needed
//     if (!filters.branchId) {
//       this.currentBranchName = '';
//     } else {
//       this.currentBranchName = 'Branch Specific Analysis';
//     }

//     this.loadRadar();
//   }

//   getScoreClass(score: number): string {
//     if (score >= 80) return 'score-high';
//     if (score >= 50) return 'score-mid';
//     return 'score-low';
//   }

//   // Helper to find strongest metric for dynamic text
//   getDominantMetric(data: any): string {
//     if (!data || !data.datasets || !data.datasets[0]) return 'Balanced';
//     const values = data.datasets[0].data;
//     const maxVal = Math.max(...values);
//     const index = values.indexOf(maxVal);
//     return data.labels[index] || 'Balanced';
//   }

//   private initOptions() {
//     const textColor = this.documentStyle.getPropertyValue('--text-secondary');
//     const gridColor = this.documentStyle.getPropertyValue('--border-secondary');

//     this.chartOptions = {
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           backgroundColor: this.documentStyle.getPropertyValue('--bg-ternary'),
//           titleColor: this.documentStyle.getPropertyValue('--text-primary'),
//           bodyColor: this.documentStyle.getPropertyValue('--text-secondary'),
//           borderColor: this.documentStyle.getPropertyValue('--border-primary'),
//           borderWidth: 1,
//           padding: 10,
//           cornerRadius: 8,
//           displayColors: false,
//           callbacks: {
//             label: (context: any) => ` ${context.label}: ${context.raw}%`
//           }
//         }
//       },
//       scales: {
//         r: {
//           grid: { color: gridColor },
//           angleLines: { color: gridColor },
//           pointLabels: {
//             color: textColor,
//             font: { size: 11, weight: '700', family: 'var(--font-body)' }
//           },
//           ticks: {
//             display: false,
//             stepSize: 20,
//             backdropColor: 'transparent'
//           },
//           suggestedMin: 0,
//           suggestedMax: 100
//         }
//       },
//       maintainAspectRatio: false
//     };
//   }

//   loadRadar() {
//     this.loading.set(true);

//     // Add artificial delay for animation smoothness or remove if production
//     setTimeout(() => {
//       // Pass the Branch ID from filters
//       this.analyticsService.getBranchPerformanceRadar(this.currentFilters.branchId).subscribe({
//         next: (res) => {
//           if (res.status === 'success') {
//             this.processData(res.data);
//           }
//           this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//       });
//     }, 600);
//   }

//   private processData(rawData: any) {
//     const style = getComputedStyle(document.documentElement);
//     const accentColor = style.getPropertyValue('--accent-primary').trim();

//     const gradientFill = (context: any) => {
//       const ctx = context.chart.ctx;
//       const width = context.chart.width;
//       const height = context.chart.height;
//       const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
//       gradient.addColorStop(0, this.hexToRgba(accentColor, 0.5));
//       gradient.addColorStop(1, this.hexToRgba(accentColor, 0.05));
//       return gradient;
//     };

//     const dataset = {
//       ...rawData.datasets[0],
//       backgroundColor: gradientFill,
//       borderColor: accentColor,
//       borderWidth: 2,
//       pointBackgroundColor: accentColor,
//       pointBorderColor: style.getPropertyValue('--bg-secondary'),
//       pointHoverBackgroundColor: style.getPropertyValue('--text-primary'),
//       pointHoverBorderColor: accentColor,
//       pointRadius: 4,
//       pointHoverRadius: 6
//     };

//     this.chartData.set({
//       labels: rawData.labels,
//       datasets: [dataset]
//     });
//   }

//   private hexToRgba(hex: string, alpha: number) {
//     let c: any;
//     if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
//       c = hex.substring(1).split('');
//       if (c.length == 3) {
//         c = [c[0], c[0], c[1], c[1], c[2], c[2]];
//       }
//       c = '0x' + c.join('');
//       return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
//     }
//     return `rgba(56, 189, 248, ${alpha})`;
//   }
// }