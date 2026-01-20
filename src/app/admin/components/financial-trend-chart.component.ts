import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-financial-trend-chart',
  standalone: true,
  imports: [CommonModule, ChartModule, ButtonModule, TooltipModule],
  template: `
    <div class="relative w-full p-1 md:p-2 overflow-hidden rounded-2xl transition-all duration-500" 
         [style.font-family]="'var(--font-body)'">

      <div class="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-slow pointer-events-none"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-[80px] animate-pulse-slow delay-1000 pointer-events-none"></div>

      <div class="relative z-10 p-6 border rounded-2xl transition-all duration-300"
           style="background: rgba(30, 41, 59, 0.4); 
                  backdrop-filter: blur(12px); 
                  -webkit-backdrop-filter: blur(12px);
                  border: 1px solid rgba(255, 255, 255, 0.05);
                  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);">
        
        <div class="flex justify-between items-start mb-8">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <div class="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/10">
                <i class="pi pi-chart-bar text-xl"></i>
              </div>
              <h2 class="font-bold text-xl tracking-tight text-white">Financial Performance</h2>
            </div>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">
              Revenue Composition & Profitability Trends
            </p>
          </div>
          
          <div class="flex gap-2">
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

        <div class="relative h-[380px] w-full">
          <div *ngIf="loading()" 
               class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg transition-all">
            <i class="pi pi-spin pi-spinner text-3xl text-indigo-500 mb-2"></i>
            <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">Syncing Financials...</span>
          </div>

          <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
        </div>

        <div class="mt-6 flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-white/5">
           <div class="flex items-center gap-3 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors cursor-default">
             <div class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500">
               <i class="pi pi-chart-line text-[10px]"></i>
             </div>
             <div class="flex flex-col">
               <span class="text-[10px] uppercase font-bold text-slate-400 leading-none">Total Income</span>
               <span class="text-xs font-bold text-emerald-400 leading-tight">Trend Line</span>
             </div>
           </div>

           <div class="flex items-center gap-3 px-3 py-1.5 rounded-full bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-colors cursor-default">
             <div class="w-3 h-3 rounded bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
             <span class="text-xs font-bold text-slate-300">Net Profit</span>
           </div>

           <div class="flex items-center gap-3 px-3 py-1.5 rounded-full bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors cursor-default">
             <div class="w-3 h-3 rounded bg-rose-500 opacity-80"></div>
             <span class="text-xs font-bold text-slate-300">Expenses</span>
           </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Subtle pulsing animation for background blobs */
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    /* Ensure tooltips don't get cut off */
    :host ::ng-deep .p-chart {
      overflow: visible; 
    }
  `]
})
export class FinancialTrendChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(true);
  chartOptions: any;

  constructor(private analyticsService: AdminAnalyticsService) {
    this.initOptions();
  }

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    // Simulate a small delay for the "Refresh" feel if API is too fast
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
    // 1. Income (Line) - Glowing Green
    const incomeDataset = {
      ...rawData.datasets[0],
      type: 'line',
      label: 'Total Income',
      borderColor: '#10b981', // Emerald 500
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        return gradient;
      },
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#10b981',
      pointRadius: 4,
      pointHoverRadius: 6,
      order: 0
    };

    // 2. Expense (Bar) - Muted Red base
    const expenseDataset = {
      ...rawData.datasets[1],
      type: 'bar',
      label: 'Expenses',
      backgroundColor: '#f43f5e', // Rose 500
      hoverBackgroundColor: '#fb7185',
      stack: 'combined',
      barPercentage: 0.5,
      borderRadius: { bottomLeft: 4, bottomRight: 4 }, // Rounded bottoms
      order: 2
    };

    // 3. Profit (Bar) - Vibrant Orange top
    const profitDataset = {
      ...rawData.datasets[2],
      type: 'bar',
      label: 'Net Profit',
      backgroundColor: '#f97316', // Orange 500
      hoverBackgroundColor: '#fb923c',
      stack: 'combined',
      barPercentage: 0.5,
      borderRadius: { topLeft: 4, topRight: 4 }, // Rounded tops
      order: 1
    };

    this.chartData.set({
      labels: rawData.labels,
      datasets: [incomeDataset, profitDataset, expenseDataset]
    });
  }

  private initOptions() {
    const textColor = '#94a3b8'; // slate-400
    const gridColor = 'rgba(255, 255, 255, 0.05)';

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.9)', // Dark slate
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4,
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                // Formatting currency
                label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: textColor, font: { size: 11, family: 'var(--font-body)' } },
          grid: { display: false }
        },
        y: {
          stacked: true,
          ticks: {
            color: textColor,
            font: { size: 10 },
            callback: (value: number) => {
              if (value >= 10000000) return (value / 10000000).toFixed(1) + 'Cr';
              if (value >= 100000) return (value / 100000).toFixed(1) + 'L';
              if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
              return value;
            }
          },
          grid: { color: gridColor, drawBorder: false, borderDash: [4, 4] }
        }
      }
    };
  }
}
// import { Component, OnInit, signal, effect, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// @Component({
//   selector: 'app-financial-trend-chart',
//   standalone: true,
//   imports: [CommonModule, ChartModule, ProgressSpinnerModule, ButtonModule],
//   template: `
//     <div class="p-4 md:p-6 transition-colors duration-300" 
//          [style.background]="'var(--theme-bg-primary)'"
//          [style.font-family]="'var(--font-body)'">

//       <div class="mb-6 flex justify-between items-center">
//         <div>
//           <h2 class="font-bold tracking-tight mb-1" 
//               [style.color]="'var(--theme-text-primary)'"
//               [style.font-family]="'var(--font-heading)'"
//               [style.font-size]="'var(--font-size-xl)'">Financial Performance Trend </h2>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
//             Composition: Expense + Profit = Total Income
//           </p>
//         </div>
//         <p-button icon="pi pi-expand" [text]="true" severity="secondary" size="small"></p-button>
//       </div>

//       <div class="p-6 border relative transition-all" 
//            [style.background]="'var(--theme-bg-secondary)'" 
//            [style.border-color]="'var(--theme-border-primary)'" 
//            [style.border-radius]="'var(--ui-border-radius-xl)'">
        
//         <ng-container *ngIf="!loading(); else loader">
//           <div class="h-[400px]">
//             <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
//           </div>
          
//           <div class="mt-6 grid grid-cols-3 gap-4 border-t pt-6" [style.border-color]="'var(--theme-border-primary)'">
//             <div class="flex items-center gap-2">
//               <div class="w-8 h-1 rounded-full bg-[#22c55e]"></div>
//               <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Total Income (Trend)</span>
//             </div>
//             <div class="flex items-center gap-2">
//               <div class="w-3 h-3 rounded-sm bg-[#f97316]"></div> <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Net Profit</span>
//             </div>
//             <div class="flex items-center gap-2">
//               <div class="w-3 h-3 rounded-sm bg-[#ef4444]"></div>
//               <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Expenses</span>
//             </div>
//           </div>
//         </ng-container>

//         <ng-template #loader>
//           <div class="h-[400px] flex flex-col items-center justify-center gap-3">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Rendering Fiscal Trends...</p>
//           </div>
//         </ng-template>
//       </div>
//     </div>
//   `
// })
// export class FinancialTrendChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(true);
//   chartOptions: any;

//   constructor(private analyticsService: AdminAnalyticsService) {
//     this.initOptions();
//   }

//   ngOnInit() {
//     this.loadTrend();
//   }

//   private initOptions() {
//     const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-tertiary') || '#94a3b8';
//     const borderSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-border-primary') || '#1e293b';

//     this.chartOptions = {
//       maintainAspectRatio: false,
//       aspectRatio: 0.8,
//       plugins: {
//         legend: { display: false }, 
//         tooltip: {
//           mode: 'index',      // Show all data points for the hovered month
//           intersect: false,
//           backgroundColor: '#0f172a',
//           titleFont: { size: 12, weight: 'bold' },
//           bodyFont: { size: 11 },
//           padding: 12,
//           cornerRadius: 8,
//           displayColors: true,
//           callbacks: {
//              label: function(context: any) {
//                 let label = context.dataset.label || '';
//                 if (label) {
//                     label += ': ';
//                 }
//                 if (context.parsed.y !== null) {
//                     label += '₹' + context.parsed.y.toLocaleString();
//                 }
//                 return label;
//              }
//           }
//         }
//       },
//       scales: {
//         x: {
//           stacked: true, // Enables the stacking effect
//           ticks: { color: textSecondary, font: { size: 10, weight: '600' } },
//           grid: { display: false }
//         },
//         y: {
//           stacked: true, // Enables the stacking effect
//           ticks: {
//             color: textSecondary,
//             font: { size: 10 },
//             callback: (value: number) => '₹' + (value / 1000) + 'k' // Simplified axis format
//           },
//           grid: { color: borderSecondary, drawBorder: false, borderDash: [4, 4] }
//         }
//       }
//     };
//   }

//   loadTrend() {
//     this.loading.set(true);
//     this.analyticsService.getFinancialTrend().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           const rawData = res.data;
          
//           // --- DATASET 0: INCOME (The Green Line) ---
//           // We treat Income as a Line chart overlaying the bars
//           const incomeDataset = {
//              ...rawData.datasets[0],
//              type: 'line', 
//              label: 'Total Income',
//              borderColor: '#22c55e', // Bright Green
//              backgroundColor: 'rgba(34, 197, 94, 0.1)',
//              borderWidth: 2,
//              fill: false,
//              tension: 0.4,
//              pointRadius: 3,
//              pointHoverRadius: 5,
//              order: 0 // Render on top
//           };

//           // --- DATASET 1: EXPENSE (The Red Bar Base) ---
//           const expenseDataset = {
//              ...rawData.datasets[1],
//              type: 'bar',
//              label: 'Expenses',
//              backgroundColor: '#ef4444', // Red
//              hoverBackgroundColor: '#dc2626',
//              stack: 'combined', // Stack Group ID
//              barPercentage: 0.6,
//              order: 2
//           };

//           // --- DATASET 2: PROFIT (The Orange Bar Top) ---
//           const profitDataset = {
//              ...rawData.datasets[2],
//              type: 'bar',
//              label: 'Net Profit',
//              backgroundColor: '#f97316', // Orange
//              hoverBackgroundColor: '#ea580c',
//              stack: 'combined', // Same Stack Group ID as Expense
//              barPercentage: 0.6,
//              order: 1
//           };

//           this.chartData.set({
//             labels: rawData.labels,
//             datasets: [incomeDataset, profitDataset, expenseDataset] 
//             // Note: Order in array affects tooltip order, 'order' property affects render z-index
//           });
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }

// // import { Component, OnInit, signal, effect, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ChartModule } from 'primeng/chart';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { ButtonModule } from 'primeng/button';
// // import { AdminAnalyticsService } from '../admin-analytics.service';

// // @Component({
// //   selector: 'app-financial-trend-chart',
// //   standalone: true,
// //   imports: [CommonModule, ChartModule, ProgressSpinnerModule, ButtonModule],
// //   template: `
// //     <div class="p-4 md:p-6 transition-colors duration-300" 
// //          [style.background]="'var(--theme-bg-primary)'"
// //          [style.font-family]="'var(--font-body)'">

// //       <div class="mb-6 flex justify-between items-center">
// //         <div>
// //           <h2 class="font-bold tracking-tight mb-1" 
// //               [style.color]="'var(--theme-text-primary)'"
// //               [style.font-family]="'var(--font-heading)'"
// //               [style.font-size]="'var(--font-size-xl)'">Financial Performance Trend</h2>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
// //             Annual Income vs Expense vs Profitability
// //           </p>
// //         </div>
// //         <p-button icon="pi pi-expand" [text]="true" severity="secondary" size="small"></p-button>
// //       </div>

// //       <div class="p-6 border relative transition-all" 
// //            [style.background]="'var(--theme-bg-secondary)'" 
// //            [style.border-color]="'var(--theme-border-primary)'" 
// //            [style.border-radius]="'var(--ui-border-radius-xl)'">
        
// //         <ng-container *ngIf="!loading(); else loader">
// //           <div class="h-[400px]">
// //             <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
// //           </div>
          
// //           <div class="mt-6 grid grid-cols-3 gap-4 border-t pt-6" [style.border-color]="'var(--theme-border-primary)'">
// //             <div class="flex items-center gap-2">
// //               <div class="w-3 h-3 rounded-sm bg-[#4caf50]"></div>
// //               <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Income</span>
// //             </div>
// //             <div class="flex items-center gap-2">
// //               <div class="w-3 h-3 rounded-sm bg-[#f44336]"></div>
// //               <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Expense</span>
// //             </div>
// //             <div class="flex items-center gap-2">
// //               <div class="w-3 h-3 rounded-sm bg-[#2196f3]"></div>
// //               <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Net Profit</span>
// //             </div>
// //           </div>
// //         </ng-container>

// //         <ng-template #loader>
// //           <div class="h-[400px] flex flex-col items-center justify-center gap-3">
// //             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
// //             <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Rendering Fiscal Trends...</p>
// //           </div>
// //         </ng-template>
// //       </div>
// //     </div>
// //   `
// // })
// // export class FinancialTrendChartComponent implements OnInit {
// //   chartData = signal<any>(null);
// //   loading = signal<boolean>(true);
// //   chartOptions: any;

// //   constructor(private analyticsService: AdminAnalyticsService) {
// //     this.initOptions();
// //   }

// //   ngOnInit() {
// //     this.loadTrend();
// //   }

// //   private initOptions() {
// //     // Accessing CSS Variables for Dynamic Chart Colors
// //     const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-tertiary') || '#94a3b8';
// //     const borderSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-border-primary') || '#1e293b';

// //     this.chartOptions = {
// //       maintainAspectRatio: false,
// //       aspectRatio: 0.8,
// //       plugins: {
// //         legend: { display: false }, // Using custom legend in HTML for better control
// //         tooltip: {
// //           backgroundColor: '#0f172a',
// //           titleFont: { size: 12, weight: 'bold' },
// //           bodyFont: { size: 11 },
// //           padding: 12,
// //           cornerRadius: 8,
// //           displayColors: true
// //         }
// //       },
// //       scales: {
// //         x: {
// //           ticks: { color: textSecondary, font: { size: 10, weight: '600' } },
// //           grid: { display: false }
// //         },
// //         y: {
// //           ticks: {
// //             color: textSecondary,
// //             font: { size: 10 },
// //             callback: (value: number) => '₹' + value.toLocaleString()
// //           },
// //           grid: { color: borderSecondary, drawBorder: false }
// //         }
// //       }
// //     };
// //   }

// //   loadTrend() {
// //     this.loading.set(true);
// //     this.analyticsService.getFinancialTrend().subscribe({
// //       next: (res) => {
// //         if (res.status === 'success') {
// //           // Enhancing raw data with theme-specific transparency and styling
// //           const data = res.data;
// //           data.datasets[0].backgroundColor = 'rgba(76, 175, 80, 0.1)'; // Soft Green
// //           data.datasets[1].backgroundColor = 'rgba(244, 67, 54, 0.1)'; // Soft Red

// //           this.chartData.set(data);
// //         }
// //         this.loading.set(false);
// //       },
// //       error: () => this.loading.set(false)
// //     });
// //   }
// // }