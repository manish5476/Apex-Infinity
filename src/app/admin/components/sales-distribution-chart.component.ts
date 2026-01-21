import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-sales-distribution-chart',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressSpinnerModule, ButtonModule],
  template: `
    <div class="relative w-full p-1 md:p-2 overflow-hidden rounded-2xl transition-all duration-500" 
         [style.font-family]="'var(--font-body)'">

      <div class="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[90px] animate-pulse-slow pointer-events-none"></div>
      <div class="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse-slow delay-700 pointer-events-none"></div>

      <div class="relative z-10 p-6 border rounded-2xl transition-all"
           style="background: rgba(15, 23, 42, 0.6); 
                  backdrop-filter: blur(16px); 
                  -webkit-backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 255, 255, 0.08);
                  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);">

        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="font-bold tracking-tight text-xl text-white flex items-center gap-2">
              <i class="pi pi-chart-pie text-indigo-400"></i>
              Sales Distribution 
            </h2>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
              Revenue Share by Category & Segmentation
            </p>
          </div>
          <div class="flex gap-2">
             <p-button icon="pi pi-filter" [text]="true" [rounded]="true" severity="secondary" size="small"></p-button>
             <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadDistribution()" [loading]="loading()"></p-button>
          </div>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div class="md:col-span-7 relative flex justify-center items-center h-[320px]">
              <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
              
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Volume</span>
                 <span class="text-3xl font-black text-white tracking-tight drop-shadow-lg">₹{{ totalRevenue() | number }}</span>
              </div>
            </div>

            <div class="md:col-span-5 flex flex-col gap-3 h-full justify-center">
               <h4 class="font-bold uppercase text-[10px] text-slate-500 mb-2">Category Breakdown</h4>
               
               <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 @for (label of chartData()?.labels; track label; let i = $index) {
                   <div class="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 transition-all hover:bg-white/10 group">
                      <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
                        <span class="font-bold text-slate-200 text-xs truncate w-28 group-hover:text-white transition-colors">{{ label }}</span>
                      </div>
                      <div class="text-right">
                         <p class="font-bold tabular-nums text-white text-xs">₹{{ chartData()?.datasets[0].data[i] | number }}</p>
                         <p class="text-[9px] font-bold opacity-60 uppercase text-indigo-300">
                           {{ (chartData()?.datasets[0].data[i] / (totalRevenue() || 1) * 100) | number:'1.0-1' }}% Share
                         </p>
                      </div>
                   </div>
                 }
               </div>
            </div>
          </div>
        </ng-container>

        <ng-template #loader>
          <div class="h-[320px] flex flex-col items-center justify-center gap-3">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Slicing Sales Data...</p>
          </div>
        </ng-template>

      </div>

      <div class="mt-4 p-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 flex items-center gap-4 relative z-10">
         <div class="p-2 rounded-full bg-indigo-500/10 text-indigo-400">
           <i class="pi pi-chart-pie"></i>
         </div>
         <p class="text-xs text-slate-300 leading-relaxed">
           The <strong>{{ chartData()?.labels[0] }}</strong> segment represents the majority of your current cycle revenue. 
           Consider enriching customer profiles to move these transactions into identified categories.
         </p>
      </div>

    </div>
  `,
  styles: [`
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.1); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    /* Custom Scrollbar for list */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track {   background: var(--bg-secondary); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    :host ::ng-deep .p-chart canvas {
      max-height: 320px; /* Ensure chart doesn't overflow */
    }
  `]
})
export class SalesDistributionChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(true);
  chartOptions: any;

  // Computed Total Revenue for Center Text
  totalRevenue = computed(() => {
    const data = this.chartData();
    if (!data) return 0;
    return data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0);
  });

  constructor(private analyticsService: AdminAnalyticsService) {
    this.initOptions();
  }

  ngOnInit() {
    this.loadDistribution();
  }

  private initOptions() {
    this.chartOptions = {
      cutout: '75%', // Thinner ring for modern look
      plugins: {
        legend: { display: false }, 
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          bodyFont: { size: 12, weight: 'bold' },
          displayColors: true,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw;
              const total = context.chart._metasets[context.datasetIndex].total;
              const percentage = ((value / total) * 100).toFixed(1) + '%';
              return ` ${label}: ₹${value.toLocaleString()} (${percentage})`;
            }
          }
        }
      },
      maintainAspectRatio: false,
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: 20
      },
      elements: {
        arc: {
          borderWidth: 0, // Remove borders for cleaner look
          hoverOffset: 15 // Pop out effect on hover
        }
      }
    };
  }

  loadDistribution() {
    this.loading.set(true);
    // Simulated delay for UI feel
    setTimeout(() => {
        this.analyticsService.getSalesDistribution().subscribe({
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

  private processData(data: any) {
    // Custom vibrant palette for glassmorphism
    const modernColors = [
        '#6366f1', // Indigo
        '#ec4899', // Pink
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#06b6d4', // Cyan
        '#8b5cf6'  // Violet
    ];

    this.chartData.set({
        labels: data.labels,
        datasets: [{
            data: data.datasets[0].data,
            backgroundColor: modernColors,
            hoverBackgroundColor: modernColors, // Keep same color on hover, let offset handle visual feedback
            borderWidth: 0
        }]
    });
  }
}
// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// @Component({
//   selector: 'app-sales-distribution-chart',
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
//               [style.font-size]="'var(--font-size-xl)'">Sales Distribution</h2>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
//             Revenue share by category and segmentation
//           </p>
//         </div>
//         <div class="flex gap-2">
//            <p-button icon="pi pi-filter" [text]="true" severity="secondary" size="small"></p-button>
//            <p-button icon="pi pi-refresh" [text]="true" severity="info" size="small" (onClick)="loadDistribution()"></p-button>
//         </div>
//       </div>

//       <div class="p-6 border relative transition-all" 
//            [style.background]="'var(--theme-bg-secondary)'" 
//            [style.border-color]="'var(--theme-border-primary)'" 
//            [style.border-radius]="'var(--ui-border-radius-xl)'">
        
//         <ng-container *ngIf="!loading(); else loader">
//           <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
//             <div class="md:col-span-7 relative flex justify-center items-center">
//               <div class="h-[300px] w-full">
//                 <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
//               </div>
              
//               <div class="absolute flex flex-col items-center justify-center text-center mt-[-10px]">
//                  <span [style.color]="'var(--theme-text-label)'" class="text-[10px] font-bold uppercase tracking-tighter">Total Volume</span>
//                  <span class="text-2xl font-black text-white tabular-nums">₹{{ totalRevenue() | number }}</span>
//               </div>
//             </div>

//             <div class="md:col-span-5 space-y-4">
//                <h4 class="font-bold uppercase text-[10px] mb-4" [style.color]="'var(--theme-text-label)'">Distribution Breakdown</h4>
               
//                @for (label of chartData()?.labels; track label; let i = $index) {
//                  <div class="flex items-center justify-between p-3 border transition-colors hover:bg-white/5"
//                       [style.background]="'var(--theme-bg-ternary)'"
//                       [style.border-color]="'var(--theme-border-secondary)'"
//                       [style.border-radius]="'var(--ui-border-radius-lg)'">
//                     <div class="flex items-center gap-3">
//                       <div class="w-3 h-3 rounded-full" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
//                       <span class="font-bold text-white text-xs truncate w-24">{{ label }}</span>
//                     </div>
//                     <div class="text-right">
//                        <p class="font-bold tabular-nums text-white text-xs">₹{{ chartData()?.datasets[0].data[i] | number }}</p>
//                        <p class="text-[9px] font-bold opacity-50 uppercase" [style.color]="'var(--theme-text-label)'">
//                          {{ (chartData()?.datasets[0].data[i] / totalRevenue() * 100) | number:'1.0-1' }}% Share
//                        </p>
//                     </div>
//                  </div>
//                }
//             </div>
//           </div>
//         </ng-container>

//         <ng-template #loader>
//           <div class="h-[300px] flex flex-col items-center justify-center gap-3">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Slicing Sales Data...</p>
//           </div>
//         </ng-template>
//       </div>

//       <div class="mt-6 p-4 border border-dashed rounded-lg flex items-center gap-4"
//            [style.border-color]="'var(--theme-border-secondary)'"
//            [style.background]="'rgba(139, 92, 246, 0.03)'">
//          <i class="pi pi-chart-pie text-indigo-400"></i>
//          <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
//            The <strong>{{ chartData()?.labels[0] }}</strong> segment represents the majority of your current cycle revenue. 
//            Consider enriching customer profiles to move these transactions into identified categories.
//          </p>
//       </div>
//     </div>
//   `,
//   styles: [`
//     :host ::ng-deep .p-chart {
//       display: flex;
//       justify-content: center;
//       align-items: center;
//     }
//   `]
// })
// export class SalesDistributionChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(true);
//   chartOptions: any;

//   // Computed: Sum of all data points in the first dataset
//   totalRevenue = computed(() => {
//     const data = this.chartData();
//     if (!data) return 0;
//     return data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0);
//   });

//   constructor(private analyticsService: AdminAnalyticsService) {
//     this.initOptions();
//   }

//   ngOnInit() {
//     this.loadDistribution();
//   }

//   private initOptions() {
//     this.chartOptions = {
//       cutout: '75%', // Creates the doughnut effect
//       plugins: {
//         legend: { display: false }, // Using custom legend in HTML
//         tooltip: {
//           backgroundColor: '#0f172a',
//           padding: 12,
//           cornerRadius: 8,
//           bodyFont: { size: 12, weight: 'bold' },
//           callbacks: {
//             label: (context: any) => {
//               return ` ₹${context.raw.toLocaleString()}`;
//             }
//           }
//         }
//       },
//       maintainAspectRatio: false
//     };
//   }

//   loadDistribution() {
//     this.loading.set(true);
//     this.analyticsService.getSalesDistribution().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.chartData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }