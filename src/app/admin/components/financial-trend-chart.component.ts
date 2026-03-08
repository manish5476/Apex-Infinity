import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// Filter Imports

@Component({
  selector: 'app-financial-trend-chart',
  standalone: true,
  imports: [
    CommonModule, 
    ChartModule, 
    ButtonModule, 
    TooltipModule,
    UniversalFilterComponent // <--- Imported
  ],
  template: `
    <div class="trend-container">

      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="filter-section">
         <app-universal-filter
           [entityType]="'financial-trend'"
           [config]="filterConfig"
           (filterChange)="onFilterUpdate($event)">
         </app-universal-filter>
      </div>

      <div class="chart-card">
        
        <div class="card-header">
          <div class="header-content">
            <div class="title-row">
              <div class="icon-box">
                <i class="pi pi-chart-line"></i>
              </div>
              <h2 class="card-title">Financial Performance</h2>
            </div>
            <p class="card-subtitle">
              Revenue (Bars) vs Net Profit (Line)
            </p>
          </div>
          
          <div class="header-actions">
            <p-button 
              icon="pi pi-refresh" 
              [rounded]="true" 
              [text]="true" 
              [loading]="loading()" 
              severity="secondary" 
              pTooltip="Refresh Data"
              tooltipPosition="left"
              (onClick)="refreshData()">
            </p-button>
          </div>
        </div>

        <div class="chart-wrapper">
          <div *ngIf="loading()" class="chart-loader">
            <i class="pi pi-spin pi-spinner loader-icon"></i>
            <span class="loader-text">Loading Financials...</span>
          </div>
          <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
        </div>

        <div class="legend-container">
           <div class="legend-item">
             <div class="legend-marker line-marker"></div>
             <span class="legend-label">Net Profit</span>
           </div>
           <div class="legend-item">
             <div class="legend-marker bar-marker-1"></div>
             <span class="legend-label">Revenue</span>
           </div>
           <div class="legend-item">
             <div class="legend-marker bar-marker-2"></div>
             <span class="legend-label">Expenses</span>
           </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .trend-container {
      position: relative;
      width: 100%;
      padding: var(--spacing-sm);
      overflow: hidden;
      border-radius: var(--ui-border-radius-xl);
    }

    .filter-section {
      margin-bottom: var(--spacing-md);
      position: relative;
      z-index: 2; /* Ensure filters are clickable over blobs */
    }

    /* Modern Blue/Purple Blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      z-index: 0;
      opacity: 0.12; 
      pointer-events: none;
    }
    .blob-1 {
      top: -30%; left: -10%; width: 500px; height: 500px;
      background: #3B82F6; /* Blue */
      animation: float 10s infinite ease-in-out;
    }
    .blob-2 {
      bottom: -30%; right: -10%; width: 400px; height: 400px;
      background: #8B5CF6; /* Purple */
      animation: float 12s infinite ease-in-out reverse;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(20px, 40px); }
    }

    .chart-card {
      position: relative;
      z-index: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-sm);
      backdrop-filter: blur(12px); 
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
    }

    .title-row { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 4px; }

    .icon-box {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: rgba(59, 130, 246, 0.1);
      color: #3B82F6;
      display: flex; align-items: center; justify-content: center;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .card-subtitle {
      font-size: 0.8rem;
      color: var(--text-tertiary);
      margin: 0;
      padding-left: calc(32px + var(--spacing-sm));
    }

    .chart-wrapper {
      position: relative;
      height: 350px;
      width: 100%;
    }

    .chart-loader {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.2);
      backdrop-filter: blur(4px);
      border-radius: var(--ui-border-radius);
    }
    .loader-icon { font-size: 2rem; color: #3B82F6; margin-bottom: 8px; }
    .loader-text { font-size: 0.8rem; font-weight: 600; color: #fff; }

    /* Legend */
    .legend-container {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--border-primary);
    }

    .legend-item { display: flex; align-items: center; gap: 8px; }
    
    .legend-marker { width: 12px; height: 12px; border-radius: 3px; }
    
    .line-marker { height: 4px; width: 16px; background: #10B981; border-radius: 2px; } /* Green Line */
    .bar-marker-1 { background: #3B82F6; } /* Blue Bar */
    .bar-marker-2 { background: #64748B; } /* Slate Bar */

    .legend-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
  `]
})
export class FinancialTrendChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(false); // Start false, filters will trigger
  chartOptions: any;

  // Stored Filters
  private currentFilters: any = {};

  // 1. FILTER CONFIG
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
    {
      key: 'date',
      label: 'Trend Period',
      type: 'date-range'
    }
  ];

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.initOptions(); 
    // refreshData triggered by filter component init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    
    const params = {
        startDate: this.currentFilters.startDate,
        endDate: this.currentFilters.endDate,
        branchId: this.currentFilters.branchId
    };

    setTimeout(() => {
      this.analyticsService.getFinancialTrend(
        params.startDate,
        params.endDate,
        params.branchId
      ).subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.processData(res.data);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }, 600);
  }

  private processData(rawData: any) {
    
    // --- GRADIENT GENERATOR ---
    const createGradient = (ctx: any, c1: string, c2: string) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, c1);
      gradient.addColorStop(1, c2);
      return gradient;
    };

    // 1. REVENUE (Bar)
    const dsRevenue = {
      type: 'bar',
      label: 'Gross Revenue',
      data: rawData.datasets[0].data, 
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        return createGradient(ctx, '#3B82F6', 'rgba(59, 130, 246, 0.2)');
      },
      hoverBackgroundColor: '#2563EB',
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
      order: 2,
      yAxisID: 'y'
    };

    // 2. EXPENSES (Bar)
    const dsExpense = {
      type: 'bar',
      label: 'Expenses',
      data: rawData.datasets[1].data, 
      backgroundColor: (context: any) => {
         const ctx = context.chart.ctx;
         return createGradient(ctx, '#64748B', 'rgba(100, 116, 139, 0.1)');
      },
      hoverBackgroundColor: '#475569',
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
      order: 3,
      yAxisID: 'y'
    };

    // 3. NET PROFIT (Line)
    const dsProfit = {
      type: 'line',
      label: 'Net Profit',
      data: rawData.datasets[2].data, 
      borderColor: '#10B981', 
      borderWidth: 3,
      backgroundColor: 'rgba(16, 185, 129, 0.1)', 
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

    this.chartData.set({
      labels: rawData.labels,
      datasets: [dsProfit, dsRevenue, dsExpense]
    });
  }

  private initOptions() {
    const textColor = '#94a3b8'; 
    const gridColor = 'rgba(255, 255, 255, 0.04)'; 

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false }, 
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
          titleColor: '#F1F5F9',
          bodyColor: '#CBD5E1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 11 } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: textColor,
            font: { size: 10 },
            callback: (value: number) => {
               if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
               return value;
            }
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

// @Component({
//   selector: 'app-financial-trend-chart',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ChartModule, 
//     ButtonModule, 
//     TooltipModule
//   ],
//   template: `
//     <div class="trend-container">

//       <div class="blob blob-1"></div>
//       <div class="blob blob-2"></div>

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
//       border-radius: var(--ui-border-radius-xl);
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
//       border-radius: var(--ui-border-radius-xl);
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
//   loading = signal<boolean>(true);
//   chartOptions: any;

//   constructor(private analyticsService: AdminAnalyticsService) {}

//   ngOnInit() {
//     this.initOptions(); 
//     this.refreshData();
//   }

//   refreshData() {
//     this.loading.set(true);
//     setTimeout(() => {
//       this.analyticsService.getFinancialTrend().subscribe({
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

//     // 1. REVENUE (Bar) - Main visual
//     const dsRevenue = {
//       type: 'bar',
//       label: 'Gross Revenue',
//       data: rawData.datasets[0].data, // Assuming idx 0 is Revenue
//       backgroundColor: (context: any) => {
//         const ctx = context.chart.ctx;
//         // Blue Gradient
//         return createGradient(ctx, '#3B82F6', 'rgba(59, 130, 246, 0.2)');
//       },
//       hoverBackgroundColor: '#2563EB',
//       borderRadius: 4,
//       barPercentage: 0.6,
//       categoryPercentage: 0.7,
//       order: 2,
//       yAxisID: 'y'
//     };

//     // 2. EXPENSES (Bar) - Secondary visual
//     const dsExpense = {
//       type: 'bar',
//       label: 'Expenses',
//       data: rawData.datasets[1].data, // Assuming idx 1 is Expenses
//       backgroundColor: (context: any) => {
//          const ctx = context.chart.ctx;
//          // Slate/Grey Gradient (Subtle)
//          return createGradient(ctx, '#64748B', 'rgba(100, 116, 139, 0.1)');
//       },
//       hoverBackgroundColor: '#475569',
//       borderRadius: 4,
//       barPercentage: 0.6,
//       categoryPercentage: 0.7,
//       order: 3,
//       yAxisID: 'y'
//     };

//     // 3. NET PROFIT (Line) - The "Star" of the chart
//     const dsProfit = {
//       type: 'line',
//       label: 'Net Profit',
//       data: rawData.datasets[2].data, // Assuming idx 2 is Profit
//       borderColor: '#10B981', // Bright Emerald Green
//       borderWidth: 3,
//       backgroundColor: 'rgba(16, 185, 129, 0.1)', // Subtle glow under line
//       fill: true,
//       tension: 0.4, // Smooth curves
//       pointBackgroundColor: '#064E3B', // Dark center
//       pointBorderColor: '#10B981', // Bright rim
//       pointBorderWidth: 2,
//       pointRadius: 4,
//       pointHoverRadius: 6,
//       order: 1, // On top
//       yAxisID: 'y1' // Optional: Separate Axis if scales differ drastically
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
//         // Optional Right Axis for Profit if the scale is very different
//         y1: {
//           type: 'linear',
//           display: false, // Set to true if Profit is % and others are ₹
//           position: 'right',
//           grid: { display: false }
//         }
//       }
//     };
//   }
// }
