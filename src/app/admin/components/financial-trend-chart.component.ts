import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-financial-trend-chart',
  standalone: true,
  imports: [
    CommonModule, 
    ChartModule, 
    ButtonModule, 
    TooltipModule
  ],
  template: `
    <div class="trend-container">

      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

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
  loading = signal<boolean>(true);
  chartOptions: any;

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.initOptions(); 
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    setTimeout(() => {
      this.analyticsService.getFinancialTrend().subscribe({
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

    // 1. REVENUE (Bar) - Main visual
    const dsRevenue = {
      type: 'bar',
      label: 'Gross Revenue',
      data: rawData.datasets[0].data, // Assuming idx 0 is Revenue
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        // Blue Gradient
        return createGradient(ctx, '#3B82F6', 'rgba(59, 130, 246, 0.2)');
      },
      hoverBackgroundColor: '#2563EB',
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
      order: 2,
      yAxisID: 'y'
    };

    // 2. EXPENSES (Bar) - Secondary visual
    const dsExpense = {
      type: 'bar',
      label: 'Expenses',
      data: rawData.datasets[1].data, // Assuming idx 1 is Expenses
      backgroundColor: (context: any) => {
         const ctx = context.chart.ctx;
         // Slate/Grey Gradient (Subtle)
         return createGradient(ctx, '#64748B', 'rgba(100, 116, 139, 0.1)');
      },
      hoverBackgroundColor: '#475569',
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
      order: 3,
      yAxisID: 'y'
    };

    // 3. NET PROFIT (Line) - The "Star" of the chart
    const dsProfit = {
      type: 'line',
      label: 'Net Profit',
      data: rawData.datasets[2].data, // Assuming idx 2 is Profit
      borderColor: '#10B981', // Bright Emerald Green
      borderWidth: 3,
      backgroundColor: 'rgba(16, 185, 129, 0.1)', // Subtle glow under line
      fill: true,
      tension: 0.4, // Smooth curves
      pointBackgroundColor: '#064E3B', // Dark center
      pointBorderColor: '#10B981', // Bright rim
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      order: 1, // On top
      yAxisID: 'y1' // Optional: Separate Axis if scales differ drastically
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
        // Optional Right Axis for Profit if the scale is very different
        y1: {
          type: 'linear',
          display: false, // Set to true if Profit is % and others are ₹
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
//                 <i class="pi pi-chart-bar"></i>
//               </div>
//               <h2 class="card-title">Financial Performance</h2>
//             </div>
//             <p class="card-subtitle">
//               Revenue Composition & Profitability Trends
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
//              <div class="legend-dot income"></div>
//              <div class="legend-text">
//                <span class="legend-label">Gross Revenue</span>
//              </div>
//            </div>

//            <div class="legend-item">
//              <div class="legend-dot profit"></div>
//              <span class="legend-label">Net Profit</span>
//            </div>

//            <div class="legend-item">
//              <div class="legend-dot expense"></div>
//              <span class="legend-label">Op. Expenses</span>
//            </div>
//         </div>

//       </div>
//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .trend-container {
//       position: relative;
//       width: 100%;
//       padding: var(--spacing-sm);
//       overflow: hidden;
//       // border-radius: var(--ui-border-radius-xl);
//     }

//     /* AMBIENT BLOBS - Updated to Warm Orange/Yellow */
//     .blob {
//       position: absolute;
//       // border-radius: 50%;
//       filter: blur(80px);
//       z-index: 0;
//       opacity: 0.2; 
//       pointer-events: none;
//     }
//     .blob-1 {
//       top: -20%; left: -10%; width: 400px; height: 400px;
//       background: #FB923C; /* Orange-400 */
//       animation: pulse-slow 8s infinite;
//     }
//     .blob-2 {
//       bottom: -20%; right: -10%; width: 300px; height: 300px;
//       background: #FDBA74; /* Orange-300 */
//       animation: pulse-slow 8s infinite 1s;
//     }

//     @keyframes pulse-slow {
//       0%, 100% { transform: scale(1); opacity: 0.15; }
//       50% { transform: scale(1.1); opacity: 0.25; }
//     }

//     /* CARD STYLE */
//     .chart-card {
//       position: relative;
//       z-index: 1;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-xl);
//       box-shadow: var(--shadow-sm);
//       backdrop-filter: blur(10px); 
//     }

//     /* HEADER */
//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: var(--spacing-xl);
//     }

//     .title-row { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 4px; }

//     .icon-box {
//       padding: 8px;
//       border-radius: 8px;
//       background: rgba(249, 115, 22, 0.1); /* Orange Tint */
//       color: #F97316; /* Orange Primary */
//       display: flex; align-items: center; justify-content: center;
//     }

//     .card-title {
//       font-size: 1.1rem;
//       font-weight: 700;
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .card-subtitle {
//       font-size: 0.75rem;
//       font-weight: 600;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//       padding-left: calc(2rem + var(--spacing-sm)); 
//       margin: 0;
//     }

//     /* CHART WRAPPER */
//     .chart-wrapper {
//       position: relative;
//       height: 320px; /* Adjusted height to match reference aspect ratio */
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
//       background: rgba(255,255,255,0.05); /* Glass effect */
//       backdrop-filter: blur(4px);
//       border-radius: var(--ui-border-radius);
//     }
//     .loader-icon { font-size: 2rem; color: #F97316; margin-bottom: var(--spacing-sm); }
//     .loader-text { font-size: 0.8rem; font-weight: bold; text-transform: uppercase; color: var(--text-secondary); }

//     /* LEGEND - Top Right Style like Reference */
//     .legend-container {
//       display: flex;
//       justify-content: flex-end; /* Align right like image */
//       gap: 20px;
//       margin-top: 20px;
//     }

//     .legend-item {
//       display: flex;
//       align-items: center;
//       gap: 8px;
//     }

//     .legend-dot {
//       width: 10px; height: 10px;
//       border-radius: 50%;
//     }
    
//     /* Explicit Orange Palette for Legend */
//     .legend-dot.income { background: #FFEDD5; } /* Lightest */
//     .legend-dot.profit { background: #FB923C; } /* Medium */
//     .legend-dot.expense { background: #EA580C; } /* Darkest */

//     .legend-label {
//       font-size: 0.85rem;
//       font-weight: 600;
//       color: var(--text-secondary);
//     }
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
//     // --- COLOR PALETTE (From Reference Image) ---
//     const colTop    = '#FFEDD5'; // Orange 100 (Lightest)
//     const colMid    = '#FB923C'; // Orange 400 (Middle)
//     const colBottom = '#EA580C'; // Orange 600 (Darkest/Vibrant)

//     // Helper to create datasets
//     // We map the incoming data (Income, Expense, Profit) to visual stack layers
    
//     // Layer 1: Bottom (Darkest) - Usually Expenses or Base
//     const dsBottom = {
//       ...rawData.datasets[1], // Assuming idx 1 is Expenses
//       type: 'bar',
//       label: 'Op. Expenses',
//       backgroundColor: colBottom,
//       hoverBackgroundColor: colBottom,
//       barPercentage: 0.5,
//       categoryPercentage: 0.8,
//       stack: 'mainStack', // Important: Same stack ID
//       order: 3,
//       // Round bottom corners only
//       borderRadius: { bottomLeft: 8, bottomRight: 8, topLeft: 0, topRight: 0 },
//       borderSkipped: false
//     };

//     // Layer 2: Middle - Profit
//     const dsMiddle = {
//       ...rawData.datasets[2], // Assuming idx 2 is Profit
//       type: 'bar',
//       label: 'Net Profit',
//       backgroundColor: colMid,
//       hoverBackgroundColor: colMid,
//       barPercentage: 0.5,
//       categoryPercentage: 0.8,
//       stack: 'mainStack',
//       order: 2,
//       borderRadius: 0, // No border radius for middle
//       borderSkipped: false
//     };

//     // Layer 3: Top (Lightest) - Revenue/Income (or leftover)
//     // NOTE: Visually, Income usually equals Expense + Profit. 
//     // If you want to stack them, you shouldn't stack Total Income on top of its parts.
//     // However, to match the visual 3-layer look, I will treat this as "Other Income" or similar.
//     const dsTop = {
//       ...rawData.datasets[0], // Assuming idx 0 is Income
//       type: 'bar',
//       label: 'Gross Revenue',
//       backgroundColor: colTop,
//       hoverBackgroundColor: colTop,
//       barPercentage: 0.5,
//       categoryPercentage: 0.8,
//       stack: 'mainStack',
//       order: 1,
//       // Round top corners only
//       borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
//       borderSkipped: false
//     };

//     this.chartData.set({
//       labels: rawData.labels,
//       datasets: [dsTop, dsMiddle, dsBottom] // Order matters for tooltip
//     });
//   }

//   private initOptions() {
//     // Hardcoded greys to ensure visibility regardless of theme
//     const textColor = '#94a3b8'; // Slate-400
//     const gridColor = 'rgba(255, 255, 255, 0.05)'; 

//     this.chartOptions = {
//       maintainAspectRatio: false,
//       aspectRatio: 0.8,
//       animation: { duration: 800, easing: 'easeOutQuart' },
//       plugins: {
//         legend: { display: false }, // Using custom HTML legend
//         tooltip: {
//           backgroundColor: '#1e293b', // Dark tooltip
//           titleColor: '#fff',
//           bodyColor: '#cbd5e1',
//           padding: 12,
//           cornerRadius: 8,
//           displayColors: true,
//           boxPadding: 4,
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
//           stacked: true,
//           ticks: { color: textColor, font: { size: 11 } },
//           grid: { display: false } // No vertical grid lines
//         },
//         y: {
//           stacked: true,
//           display: true, // Show Y Axis? Reference has labels but no line
//           border: { display: false }, // Hide the Y-axis line itself
//           ticks: {
//             color: textColor,
//             font: { size: 10 },
//             padding: 10,
//             callback: (value: number) => {
//               if (value >= 10000000) return (value / 10000000).toFixed(0) + 'Cr';
//               if (value >= 100000) return (value / 100000).toFixed(0) + 'L';
//               if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
//               return value;
//             }
//           },
//           grid: { 
//             color: gridColor, 
//             drawBorder: false, 
//             drawTicks: false // Clean horizontal lines only
//           } 
//         }
//       }
//     };
//   }
// }

// // import { Component, OnInit, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ChartModule } from 'primeng/chart';
// // import { ButtonModule } from 'primeng/button';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { AdminAnalyticsService } from '../admin-analytics.service';

// // @Component({
// //   selector: 'app-financial-trend-chart',
// //   standalone: true,
// //   imports: [
// //     CommonModule, 
// //     ChartModule, 
// //     ButtonModule, 
// //     TooltipModule
// //   ],
// //   template: `
// //     <div class="trend-container">

// //       <div class="blob blob-1"></div>
// //       <div class="blob blob-2"></div>

// //       <div class="chart-card">
        
// //         <div class="card-header">
// //           <div class="header-content">
// //             <div class="title-row">
// //               <div class="icon-box">
// //                 <i class="pi pi-chart-bar"></i>
// //               </div>
// //               <h2 class="card-title">Financial Performance</h2>
// //             </div>
// //             <p class="card-subtitle">
// //               Revenue Composition & Profitability Trends
// //             </p>
// //           </div>
          
// //           <div class="header-actions">
// //             <p-button 
// //               icon="pi pi-refresh" 
// //               [rounded]="true" 
// //               [text]="true" 
// //               [loading]="loading()" 
// //               severity="secondary" 
// //               pTooltip="Refresh Data"
// //               tooltipPosition="left"
// //               (onClick)="refreshData()">
// //             </p-button>
// //           </div>
// //         </div>

// //         <div class="chart-wrapper">
          
// //           <div *ngIf="loading()" class="chart-loader">
// //             <i class="pi pi-spin pi-spinner loader-icon"></i>
// //             <span class="loader-text">Syncing Financials...</span>
// //           </div>

// //           <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
// //         </div>

// //         <div class="legend-container">
// //            <div class="legend-item primary">
// //              <div class="legend-icon-box">
// //                <i class="pi pi-chart-line"></i>
// //              </div>
// //              <div class="legend-text">
// //                <span class="legend-label">Total Income</span>
// //                <span class="legend-sub">Trend Line</span>
// //              </div>
// //            </div>

// //            <div class="legend-item success">
// //              <div class="legend-dot"></div>
// //              <span class="legend-label">Net Profit</span>
// //            </div>

// //            <div class="legend-item error">
// //              <div class="legend-dot"></div>
// //              <span class="legend-label">Expenses</span>
// //            </div>
// //         </div>

// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     /* HOST & LAYOUT */
// //     :host { display: block; width: 100%; }

// //     .trend-container {
// //       position: relative;
// //       width: 100%;
// //       padding: var(--spacing-sm);
// //       overflow: hidden;
// //       border-radius: var(--ui-border-radius-xl);
// //     }

// //     /* AMBIENT BLOBS */
// //     .blob {
// //       position: absolute;
// //       border-radius: 50%;
// //       filter: blur(80px);
// //       z-index: 0;
// //       opacity: 0.15; /* Subtle in light mode, effective in dark */
// //       pointer-events: none;
// //     }
// //     .blob-1 {
// //       top: -20%; left: -10%; width: 400px; height: 400px;
// //       background: var(--accent-primary);
// //       animation: pulse-slow 8s infinite;
// //     }
// //     .blob-2 {
// //       bottom: -20%; right: -10%; width: 300px; height: 300px;
// //       background: var(--color-success);
// //       animation: pulse-slow 8s infinite 1s;
// //     }

// //     @keyframes pulse-slow {
// //       0%, 100% { transform: scale(1); opacity: 0.1; }
// //       50% { transform: scale(1.1); opacity: 0.2; }
// //     }

// //     /* CARD STYLE */
// //     .chart-card {
// //       position: relative;
// //       z-index: 1;
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       padding: var(--spacing-xl);
// //       box-shadow: var(--shadow-sm);
// //       /* Glassmorphism hook */
// //       backdrop-filter: blur(10px); 
// //     }

// //     /* HEADER */
// //     .card-header {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: flex-start;
// //       margin-bottom: var(--spacing-xl);
// //     }

// //     .title-row { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 4px; }

// //     .icon-box {
// //       padding: 6px;
// //       border-radius: var(--ui-border-radius);
// //       background: var(--accent-focus);
// //       color: var(--accent-primary);
// //       border: 1px solid var(--accent-secondary);
// //       display: flex; align-items: center; justify-content: center;
// //     }

// //     .card-title {
// //       font-size: var(--font-size-lg);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--text-primary);
// //       margin: 0;
// //       letter-spacing: -0.01em;
// //     }

// //     .card-subtitle {
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //       color: var(--text-tertiary);
// //       padding-left: calc(2rem + var(--spacing-sm)); /* Align with title text */
// //       margin: 0;
// //     }

// //     /* CHART WRAPPER */
// //     .chart-wrapper {
// //       position: relative;
// //       height: 380px;
// //       width: 100%;
// //     }

// //     .chart-loader {
// //       position: absolute;
// //       inset: 0;
// //       z-index: 10;
// //       display: flex;
// //       flex-direction: column;
// //       align-items: center;
// //       justify-content: center;
// //       background: var(--bg-secondary);
// //       opacity: 0.8;
// //       backdrop-filter: blur(2px);
// //       border-radius: var(--ui-border-radius);
// //     }
// //     .loader-icon { font-size: 2rem; color: var(--accent-primary); margin-bottom: var(--spacing-sm); }
// //     .loader-text { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-secondary); }

// //     /* LEGEND */
// //     .legend-container {
// //       margin-top: var(--spacing-xl);
// //       padding-top: var(--spacing-lg);
// //       border-top: 1px solid var(--border-primary);
// //       display: flex;
// //       flex-wrap: wrap;
// //       justify-content: center;
// //       gap: var(--spacing-xl);
// //     }

// //     .legend-item {
// //       display: flex;
// //       align-items: center;
// //       gap: var(--spacing-sm);
// //       padding: var(--spacing-xs) var(--spacing-md);
// //       border-radius: 99px;
// //       border: 1px solid transparent;
// //       background: var(--bg-ternary);
// //       transition: background 0.2s;
// //     }
// //     .legend-item:hover { background: var(--component-bg-hover); }

// //     /* Legend Color Variants */
// //     .legend-item.primary { border-color: var(--accent-secondary); background: var(--accent-focus); }
// //     .legend-item.primary .legend-label { color: var(--accent-primary); }
    
// //     .legend-item.success { border-color: var(--color-success-border); background: var(--color-success-bg); }
// //     .legend-item.success .legend-dot { background: var(--color-success); }
    
// //     .legend-item.error { border-color: var(--color-error-border); background: var(--color-error-bg); }
// //     .legend-item.error .legend-dot { background: var(--color-error); }

// //     .legend-icon-box {
// //       width: 1.25rem; height: 1.25rem;
// //       border-radius: 50%;
// //       background: rgba(255,255,255,0.2);
// //       display: flex; align-items: center; justify-content: center;
// //       color: var(--accent-primary);
// //     }

// //     .legend-text { display: flex; flex-direction: column; }
    
// //     .legend-label {
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--text-secondary);
// //       line-height: 1;
// //     }
    
// //     .legend-sub {
// //       font-size: 9px;
// //       text-transform: uppercase;
// //       font-weight: bold;
// //       color: var(--text-tertiary);
// //     }

// //     .legend-dot {
// //       width: 0.75rem; height: 0.75rem;
// //       border-radius: 2px;
// //     }
// //   `]
// // })
// // export class FinancialTrendChartComponent implements OnInit {
// //   chartData = signal<any>(null);
// //   loading = signal<boolean>(true);
// //   chartOptions: any;

// //   // Cache document style for variable reading
// //   private documentStyle = getComputedStyle(document.documentElement);

// //   constructor(private analyticsService: AdminAnalyticsService) {}

// //   ngOnInit() {
// //     this.initOptions(); // Init options first to get theme colors
// //     this.refreshData();
// //   }

// //   refreshData() {
// //     this.loading.set(true);
// //     // Refresh theme styles in case theme changed
// //     this.documentStyle = getComputedStyle(document.documentElement);
// //     this.initOptions(); 

// //     setTimeout(() => {
// //       this.analyticsService.getFinancialTrend().subscribe({
// //         next: (res) => {
// //           if (res.status === 'success') {
// //             this.processData(res.data);
// //           }
// //           this.loading.set(false);
// //         },
// //         error: () => this.loading.set(false)
// //       });
// //     }, 600);
// //   }

// //   private processData(rawData: any) {
// //     // 1. Get Theme Colors dynamically
// //     const primaryColor = this.getCssVar('--accent-primary');
// //     const successColor = this.getCssVar('--color-success');
// //     const errorColor = this.getCssVar('--color-error');
    
// //     // 2. Create Gradient Helper
// //     const gradientFill = (context: any, colorHex: string) => {
// //       const ctx = context.chart.ctx;
// //       const gradient = ctx.createLinearGradient(0, 0, 0, 300);
// //       gradient.addColorStop(0, this.hexToRgba(colorHex, 0.5));
// //       gradient.addColorStop(1, this.hexToRgba(colorHex, 0.0));
// //       return gradient;
// //     };

// //     // 3. Construct Datasets
    
// //     // Total Income (Line)
// //     const incomeDataset = {
// //       ...rawData.datasets[0],
// //       type: 'line',
// //       label: 'Total Income',
// //       borderColor: primaryColor,
// //       backgroundColor: (context: any) => gradientFill(context, primaryColor),
// //       borderWidth: 3,
// //       fill: true,
// //       tension: 0.4,
// //       pointBackgroundColor: primaryColor,
// //       pointBorderColor: '#fff',
// //       pointRadius: 4,
// //       pointHoverRadius: 6,
// //       order: 0
// //     };

// //     // Expenses (Bar)
// //     const expenseDataset = {
// //       ...rawData.datasets[1],
// //       type: 'bar',
// //       label: 'Expenses',
// //       backgroundColor: errorColor,
// //       hoverBackgroundColor: this.hexToRgba(errorColor, 0.8),
// //       stack: 'combined',
// //       barPercentage: 0.5,
// //       borderRadius: { bottomLeft: 4, bottomRight: 4 },
// //       order: 2
// //     };

// //     // Net Profit (Bar)
// //     const profitDataset = {
// //       ...rawData.datasets[2],
// //       type: 'bar',
// //       label: 'Net Profit',
// //       backgroundColor: successColor,
// //       hoverBackgroundColor: this.hexToRgba(successColor, 0.8),
// //       stack: 'combined',
// //       barPercentage: 0.5,
// //       borderRadius: { topLeft: 4, topRight: 4 },
// //       order: 1
// //     };

// //     this.chartData.set({
// //       labels: rawData.labels,
// //       datasets: [incomeDataset, profitDataset, expenseDataset]
// //     });
// //   }

// //   private initOptions() {
// //     const textColor = this.getCssVar('--text-secondary');
// //     const gridColor = this.getCssVar('--border-primary');
// //     const toolTipBg = this.getCssVar('--bg-ternary');
// //     const toolTipText = this.getCssVar('--text-primary');

// //     this.chartOptions = {
// //       maintainAspectRatio: false,
// //       aspectRatio: 0.8,
// //       animation: { duration: 1000, easing: 'easeOutQuart' },
// //       plugins: {
// //         legend: { display: false },
// //         tooltip: {
// //           mode: 'index',
// //           intersect: false,
// //           backgroundColor: toolTipBg,
// //           titleColor: toolTipText,
// //           bodyColor: textColor,
// //           borderColor: gridColor,
// //           borderWidth: 1,
// //           padding: 12,
// //           cornerRadius: 8,
// //           displayColors: true,
// //           boxPadding: 4,
// //           callbacks: {
// //             label: function(context: any) {
// //               let label = context.dataset.label || '';
// //               if (label) label += ': ';
// //               if (context.parsed.y !== null) {
// //                 label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(context.parsed.y);
// //               }
// //               return label;
// //             }
// //           }
// //         }
// //       },
// //       scales: {
// //         x: {
// //           stacked: true,
// //           ticks: { color: textColor, font: { size: 11, family: 'var(--font-body)' } },
// //           grid: { display: false }
// //         },
// //         y: {
// //           stacked: true,
// //           ticks: {
// //             color: textColor,
// //             font: { size: 10 },
// //             callback: (value: number) => {
// //               if (value >= 10000000) return (value / 10000000).toFixed(1) + 'Cr';
// //               if (value >= 100000) return (value / 100000).toFixed(1) + 'L';
// //               if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
// //               return value;
// //             }
// //           },
// //           grid: { color: gridColor, drawBorder: false, borderDash: [4, 4] }
// //         }
// //       }
// //     };
// //   }

// //   // --- Utilities ---

// //   private getCssVar(name: string): string {
// //     return this.documentStyle.getPropertyValue(name).trim() || '#000'; // Fallback to black
// //   }

// //   private hexToRgba(hex: string, alpha: number) {
// //     // Basic hex to rgba converter
// //     let c: any;
// //     if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
// //         c= hex.substring(1).split('');
// //         if(c.length== 3){
// //             c= [c[0], c[0], c[1], c[1], c[2], c[2]];
// //         }
// //         c= '0x'+c.join('');
// //         return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
// //     }
// //     return hex; // Return original if not hex
// //   }
// // }
