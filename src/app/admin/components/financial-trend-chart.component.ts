import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-financial-trend-chart',
  standalone: true,
  imports: [CommonModule, ChartModule, TooltipModule, UniversalFilterComponent],
  template: `
<div class="trend-root">

  <!-- Ambient blobs — decorative depth only -->
  <div class="blob blob-1" aria-hidden="true"></div>
  <div class="blob blob-2" aria-hidden="true"></div>

  <!-- Filter bar -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="financial-trend"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- Chart card -->
  <div class="chart-card">

    <div class="card-head">
      <div class="head-left">
        <div class="head-icon">
          <i class="pi pi-chart-line"></i>
        </div>
        <div>
          <h2 class="card-title">Financial Performance</h2>
          <p class="card-sub">Revenue (bars) vs Net Profit (line)</p>
        </div>
      </div>
      <button class="refresh-btn"
              (click)="refreshData()"
              [disabled]="loading()"
              pTooltip="Refresh data"
              tooltipPosition="left">
        <i class="pi pi-refresh" [class.spinning]="loading()"></i>
      </button>
    </div>

    <!-- Chart area -->
    <div class="chart-wrap">
      @if (loading()) {
        <div class="chart-loader">
          <i class="pi pi-spin pi-spinner loader-icon"></i>
          <span class="loader-text">Loading financials…</span>
        </div>
      }
      @if (chartData()) {
        <p-chart
          type="bar"
          [data]="chartData()"
          [options]="chartOptions"
          height="100%"
          width="100%">
        </p-chart>
      }
    </div>

    <!-- Legend -->
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-mark legend-mark--line"></span>
        <span class="legend-label">Net Profit</span>
      </div>
      <div class="legend-item">
        <span class="legend-mark legend-mark--revenue"></span>
        <span class="legend-label">Revenue</span>
      </div>
      <div class="legend-item">
        <span class="legend-mark legend-mark--expense"></span>
        <span class="legend-label">Expenses</span>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
/* ============================================================
   FINANCIAL TREND CHART — TOKEN-DRIVEN
   Blob colors (#3B82F6, #8B5CF6) and chart dataset colors
   (blue, slate, emerald) are intentionally kept as fixed hex
   values because they are data-encoding colors that must remain
   consistent across all themes — they are not UI surface colors.
   Every other visual property uses the canonical token system.
   ============================================================ */

:host { display: block; width: 100%; }

.trend-root {
  position: relative;
  padding: var(--spacing-xl);
  overflow: hidden;
  border-radius: var(--radius-2xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
}

/* ── Ambient blobs (decorative, not interactive) ── */
.blob {
  position: absolute;
  border-radius: var(--ui-border-radius-pill);
  filter: blur(90px);
  z-index: 0;
  opacity: 0.1;
  pointer-events: none;
}
.blob-1 {
  top: -30%; left: -10%;
  width: 500px; height: 500px;
  /* Blue: data-encoding accent, intentionally fixed */
  background: #3B82F6;
  animation: blob-float 10s ease-in-out infinite;
}
.blob-2 {
  bottom: -30%; right: -10%;
  width: 400px; height: 400px;
  /* Violet: data-encoding accent, intentionally fixed */
  background: #8B5CF6;
  animation: blob-float 12s ease-in-out infinite reverse;
}
@keyframes blob-float {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(20px, 40px); }
}

/* ── Filter bar ── */
.filter-bar {
  position: relative;
  z-index: 2;
  margin-bottom: var(--spacing-lg);
}

/* ── Chart card ── */
.chart-card {
  position: relative;
  z-index: 1;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

/* Card header */
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.head-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.head-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--ui-border-radius-sm);
  /* Uses accent-focus token so it adapts to any theme */
  background: var(--accent-focus);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-tight);
}

.card-sub {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
}

/* Refresh button */
.refresh-btn {
  width: 32px;
  height: 32px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
  transition: var(--transition-base);

  &:hover:not(:disabled) {
    background: var(--component-bg-hover);
    color: var(--accent-primary);
    border-color: var(--border-secondary);
  }

  &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }
}

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Chart wrapper */
.chart-wrap {
  position: relative;
  height: 350px;
  width: 100%;
}

/* Loading overlay */
.chart-loader {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  border-radius: var(--ui-border-radius);
}

.loader-icon {
  /* Blue: data-encoding color for loading state, consistent with chart primary */
  color: #3B82F6;
  font-size: var(--font-size-3xl);
}

.loader-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  /* White text on dark overlay — intentionally fixed for legibility */
  color: #fff;
}

/* Legend */
.chart-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-2xl);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: var(--ui-border-width) solid var(--border-primary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.legend-mark {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: var(--ui-border-radius-sm);
  flex-shrink: 0;
}

/* Data-encoding colors — must remain fixed across themes */
.legend-mark--line    { height: 3px; width: 16px; border-radius: var(--ui-border-radius-pill); background: #10B981; }
.legend-mark--revenue { background: #3B82F6; }
.legend-mark--expense { background: #64748B; }

.legend-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}
  `]
})
export class FinancialTrendChartComponent implements OnInit {
  chartData    = signal<any>(null);
  loading      = signal(false);
  chartOptions: any;

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Overview'
    },
    { key: 'date', label: 'Trend Period', type: 'date-range' }
  ];

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.initOptions();
    // Initial data load is triggered by the UniversalFilterComponent emitting
    // its default values on init, which calls onFilterUpdate → refreshData.
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.refreshData();
  }

  refreshData(): void {
    this.loading.set(true);
    this.analyticsService.getFinancialTrend(
      this.currentFilters['startDate'],
      this.currentFilters['endDate'],
      this.currentFilters['branchId']
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') this.processData(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private processData(raw: any): void {
    const createGradient = (ctx: any, top: string, bottom: string) => {
      const g = ctx.createLinearGradient(0, 0, 0, 400);
      g.addColorStop(0, top);
      g.addColorStop(1, bottom);
      return g;
    };

    // Revenue bar — blue gradient (data-encoding, fixed)
    const dsRevenue = {
      type: 'bar',
      label: 'Gross Revenue',
      data: raw.datasets[0].data,
      backgroundColor: (ctx: any) => createGradient(ctx.chart.ctx, '#3B82F6', 'rgba(59,130,246,0.2)'),
      hoverBackgroundColor: '#2563EB',
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
      order: 2,
      yAxisID: 'y'
    };

    // Expenses bar — slate gradient (data-encoding, fixed)
    const dsExpense = {
      type: 'bar',
      label: 'Expenses',
      data: raw.datasets[1].data,
      backgroundColor: (ctx: any) => createGradient(ctx.chart.ctx, '#64748B', 'rgba(100,116,139,0.1)'),
      hoverBackgroundColor: '#475569',
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
      order: 3,
      yAxisID: 'y'
    };

    // Profit line — emerald (data-encoding, fixed)
    const dsProfit = {
      type: 'line',
      label: 'Net Profit',
      data: raw.datasets[2].data,
      borderColor: '#10B981',
      borderWidth: 2.5,
      backgroundColor: 'rgba(16,185,129,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#064E3B',
      pointBorderColor: '#10B981',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      order: 1,
      yAxisID: 'y1'
    };

    this.chartData.set({ labels: raw.labels, datasets: [dsProfit, dsRevenue, dsExpense] });
  }

  private initOptions(): void {
    // Chart.js requires concrete color strings, not CSS variables.
    // Using neutral slate values that work on both light and dark backgrounds.
    const tickColor  = '#94a3b8';
    const gridColor  = 'rgba(148,163,184,0.08)';

    this.chartOptions = {
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          // Dark glass tooltip — intentionally fixed, theme-agnostic
          backgroundColor: 'rgba(15,23,42,0.92)',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          usePointStyle: true,
          boxPadding: 6,
          callbacks: {
            label: (ctx: any) => {
              const label = ctx.dataset.label ? ctx.dataset.label + ': ' : '';
              if (ctx.parsed.y == null) return label;
              return label + new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumSignificantDigits: 3
              }).format(ctx.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tickColor, font: { size: 11 } }
        },
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: tickColor,
            font: { size: 10 },
            callback: (v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v
          }
        },
        y1: {
          type: 'linear',
          display: false,
          position: 'right',
          grid: { display: false }
        }
      }
    };
  }
}
// import { Component, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// // Filter Imports

// @Component({
//   selector: 'app-financial-trend-chart',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ChartModule, 
//     ButtonModule, 
//     TooltipModule,
//     UniversalFilterComponent // <--- Imported
//   ],
//   template: `
//     <div class="trend-container">

//       <div class="blob blob-1"></div>
//       <div class="blob blob-2"></div>

//       <div class="filter-section">
//          <app-universal-filter
//            [entityType]="'financial-trend'"
//            [config]="filterConfig"
//            (filterChange)="onFilterUpdate($event)">
//          </app-universal-filter>
//       </div>

//       <div class="chart-card">
        
//         <div class="card-header">
//           <div class="header-content">
//             <div class="title-row">
//               <div class="icon-box">
//                 <i class="pi pi-chart-line"></i>
//               </div>
//               <h2 class="card-title">Financial Performance</h2>
//             </div>
//             <p class="card-subtitle">
//               Revenue (Bars) vs Net Profit (Line)
//             </p>
//           </div>
          
//           <div class="header-actions">
//             <p-button 
//               icon="pi pi-refresh" 
//               [rounded]="true" 
//               [text]="true" 
//               [loading]="loading()" 
//               severity="secondary" 
//               pTooltip="Refresh Data"
//               tooltipPosition="left"
//               (onClick)="refreshData()">
//             </p-button>
//           </div>
//         </div>

//         <div class="chart-wrapper">
//           <div *ngIf="loading()" class="chart-loader">
//             <i class="pi pi-spin pi-spinner loader-icon"></i>
//             <span class="loader-text">Loading Financials...</span>
//           </div>
//           <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
//         </div>

//         <div class="legend-container">
//            <div class="legend-item">
//              <div class="legend-marker line-marker"></div>
//              <span class="legend-label">Net Profit</span>
//            </div>
//            <div class="legend-item">
//              <div class="legend-marker bar-marker-1"></div>
//              <span class="legend-label">Revenue</span>
//            </div>
//            <div class="legend-item">
//              <div class="legend-marker bar-marker-2"></div>
//              <span class="legend-label">Expenses</span>
//            </div>
//         </div>

//       </div>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }

//     .trend-container {
//       position: relative;
//       width: 100%;
//       padding: var(--spacing-sm);
//       overflow: hidden;
//       border-radius: var(--radius-2xl);
//     }

//     .filter-section {
//       margin-bottom: var(--spacing-md);
//       position: relative;
//       z-index: 2; /* Ensure filters are clickable over blobs */
//     }

//     /* Modern Blue/Purple Blobs */
//     .blob {
//       position: absolute;
//       border-radius: 50%;
//       filter: blur(90px);
//       z-index: 0;
//       opacity: 0.12; 
//       pointer-events: none;
//     }
//     .blob-1 {
//       top: -30%; left: -10%; width: 500px; height: 500px;
//       background: #3B82F6; /* Blue */
//       animation: float 10s infinite ease-in-out;
//     }
//     .blob-2 {
//       bottom: -30%; right: -10%; width: 400px; height: 400px;
//       background: #8B5CF6; /* Purple */
//       animation: float 12s infinite ease-in-out reverse;
//     }

//     @keyframes float {
//       0%, 100% { transform: translate(0, 0); }
//       50% { transform: translate(20px, 40px); }
//     }

//     .chart-card {
//       position: relative;
//       z-index: 1;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-xl);
//       box-shadow: var(--shadow-sm);
//       backdrop-filter: blur(12px); 
//     }

//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: var(--spacing-xl);
//     }

//     .title-row { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 4px; }

//     .icon-box {
//       width: 32px; height: 32px;
//       border-radius: 8px;
//       background: rgba(59, 130, 246, 0.1);
//       color: #3B82F6;
//       display: flex; align-items: center; justify-content: center;
//     }

//     .card-title {
//       font-size: 1.1rem;
//       font-weight: 700;
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .card-subtitle {
//       font-size: 0.8rem;
//       color: var(--text-tertiary);
//       margin: 0;
//       padding-left: calc(32px + var(--spacing-sm));
//     }

//     .chart-wrapper {
//       position: relative;
//       height: 350px;
//       width: 100%;
//     }

//     .chart-loader {
//       position: absolute;
//       inset: 0;
//       z-index: 10;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       background: rgba(0,0,0,0.2);
//       backdrop-filter: blur(4px);
//       border-radius: var(--ui-border-radius);
//     }
//     .loader-icon { font-size: 2rem; color: #3B82F6; margin-bottom: 8px; }
//     .loader-text { font-size: 0.8rem; font-weight: 600; color: #fff; }

//     /* Legend */
//     .legend-container {
//       display: flex;
//       justify-content: center;
//       gap: 24px;
//       margin-top: 24px;
//       padding-top: 16px;
//       border-top: 1px solid var(--border-primary);
//     }

//     .legend-item { display: flex; align-items: center; gap: 8px; }
    
//     .legend-marker { width: 12px; height: 12px; border-radius: 3px; }
    
//     .line-marker { height: 4px; width: 16px; background: #10B981; border-radius: 2px; } /* Green Line */
//     .bar-marker-1 { background: #3B82F6; } /* Blue Bar */
//     .bar-marker-2 { background: #64748B; } /* Slate Bar */

//     .legend-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
//   `]
// })
// export class FinancialTrendChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(false); // Start false, filters will trigger
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
//       placeholder: 'Global Overview'
//     },
//     {
//       key: 'date',
//       label: 'Trend Period',
//       type: 'date-range'
//     }
//   ];

//   constructor(private analyticsService: AdminAnalyticsService) {}

//   ngOnInit() {
//     this.initOptions(); 
//     // refreshData triggered by filter component init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.refreshData();
//   }

//   refreshData() {
//     this.loading.set(true);
    
//     const params = {
//         startDate: this.currentFilters.startDate,
//         endDate: this.currentFilters.endDate,
//         branchId: this.currentFilters.branchId
//     };

//     setTimeout(() => {
//       this.analyticsService.getFinancialTrend(
//         params.startDate,
//         params.endDate,
//         params.branchId
//       ).subscribe({
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
    
//     // --- GRADIENT GENERATOR ---
//     const createGradient = (ctx: any, c1: string, c2: string) => {
//       const gradient = ctx.createLinearGradient(0, 0, 0, 400);
//       gradient.addColorStop(0, c1);
//       gradient.addColorStop(1, c2);
//       return gradient;
//     };

//     // 1. REVENUE (Bar)
//     const dsRevenue = {
//       type: 'bar',
//       label: 'Gross Revenue',
//       data: rawData.datasets[0].data, 
//       backgroundColor: (context: any) => {
//         const ctx = context.chart.ctx;
//         return createGradient(ctx, '#3B82F6', 'rgba(59, 130, 246, 0.2)');
//       },
//       hoverBackgroundColor: '#2563EB',
//       borderRadius: 4,
//       barPercentage: 0.6,
//       categoryPercentage: 0.7,
//       order: 2,
//       yAxisID: 'y'
//     };

//     // 2. EXPENSES (Bar)
//     const dsExpense = {
//       type: 'bar',
//       label: 'Expenses',
//       data: rawData.datasets[1].data, 
//       backgroundColor: (context: any) => {
//          const ctx = context.chart.ctx;
//          return createGradient(ctx, '#64748B', 'rgba(100, 116, 139, 0.1)');
//       },
//       hoverBackgroundColor: '#475569',
//       borderRadius: 4,
//       barPercentage: 0.6,
//       categoryPercentage: 0.7,
//       order: 3,
//       yAxisID: 'y'
//     };

//     // 3. NET PROFIT (Line)
//     const dsProfit = {
//       type: 'line',
//       label: 'Net Profit',
//       data: rawData.datasets[2].data, 
//       borderColor: '#10B981', 
//       borderWidth: 3,
//       backgroundColor: 'rgba(16, 185, 129, 0.1)', 
//       fill: true,
//       tension: 0.4, 
//       pointBackgroundColor: '#064E3B', 
//       pointBorderColor: '#10B981', 
//       pointBorderWidth: 2,
//       pointRadius: 4,
//       pointHoverRadius: 6,
//       order: 1, 
//       yAxisID: 'y1' 
//     };

//     this.chartData.set({
//       labels: rawData.labels,
//       datasets: [dsProfit, dsRevenue, dsExpense]
//     });
//   }

//   private initOptions() {
//     const textColor = '#94a3b8'; 
//     const gridColor = 'rgba(255, 255, 255, 0.04)'; 

//     this.chartOptions = {
//       maintainAspectRatio: false,
//       aspectRatio: 0.8,
//       animation: { duration: 1000, easing: 'easeOutQuart' },
//       interaction: {
//         mode: 'index',
//         intersect: false,
//       },
//       plugins: {
//         legend: { display: false }, 
//         tooltip: {
//           backgroundColor: 'rgba(15, 23, 42, 0.9)', 
//           titleColor: '#F1F5F9',
//           bodyColor: '#CBD5E1',
//           borderColor: 'rgba(255,255,255,0.1)',
//           borderWidth: 1,
//           padding: 12,
//           cornerRadius: 8,
//           displayColors: true,
//           boxPadding: 6,
//           usePointStyle: true,
//           callbacks: {
//             label: (context: any) => {
//               let label = context.dataset.label || '';
//               if (label) label += ': ';
//               if (context.parsed.y !== null) {
//                 label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(context.parsed.y);
//               }
//               return label;
//             }
//           }
//         }
//       },
//       scales: {
//         x: {
//           grid: { display: false },
//           ticks: { color: textColor, font: { size: 11 } }
//         },
//         y: {
//           type: 'linear',
//           display: true,
//           position: 'left',
//           grid: { color: gridColor, drawBorder: false },
//           ticks: {
//             color: textColor,
//             font: { size: 10 },
//             callback: (value: number) => {
//                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
//                return value;
//             }
//           }
//         },
//         y1: {
//           type: 'linear',
//           display: false, 
//           position: 'right',
//           grid: { display: false }
//         }
//       }
//     };
//   }
// }
