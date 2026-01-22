import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-order-funnel-chart',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressSpinnerModule, ButtonModule, TooltipModule],
  template: `
    <div class="relative w-full p-1 md:p-2 overflow-hidden rounded-2xl transition-all duration-500" 
         [style.font-family]="'var(--font-body)'">

      <div class="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[90px] animate-pulse-slow pointer-events-none"></div>
      <div class="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-fuchsia-500/10 blur-[80px] animate-pulse-slow delay-700 pointer-events-none"></div>

      <div class="relative z-10 p-6 border rounded-2xl transition-all"
           style="background: rgba(15, 23, 42, 0.6); 
                  backdrop-filter: blur(16px); 
                  -webkit-backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 255, 255, 0.08);
                  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);">

        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="font-bold tracking-tight text-xl text-white flex items-center gap-2">
              <i class="pi pi-sort-amount-down-alt text-indigo-400"></i>
              Conversion Funnel 
            </h2>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
              Order Lifecycle & Fulfillment Velocity
            </p>
          </div>
          <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadFunnel()" [loading]="loading()"></p-button>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div class="lg:col-span-8">
              <div class="h-[320px] w-full relative">
                <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
                
                <div class="absolute inset-0 pointer-events-none border-l border-b border-white/5 opacity-50"></div>
              </div>
            </div>

            <div class="lg:col-span-4 flex flex-col gap-4">
               
               <div class="p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md">
                 <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Conversion Rate</p>
                 <div class="flex items-end gap-2">
                   <span class="text-4xl font-black text-emerald-400 tracking-tight leading-none">
                     {{ getConversionRate(3) }}%
                   </span>
                   <span class="text-xs font-bold text-emerald-500/80 mb-1.5">Completed</span>
                 </div>
                 <div class="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                   <div class="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" [style.width]="getConversionRate(3) + '%'"></div>
                 </div>
               </div>

               <div class="flex-1 p-4 rounded-xl border border-dashed border-orange-500/30 bg-orange-500/5 flex flex-col justify-center">
                 <div class="flex items-center gap-2 mb-2">
                   <i class="pi pi-exclamation-circle text-orange-400"></i>
                   <span class="text-xs font-bold uppercase text-orange-400">Revenue Recovery</span>
                 </div>
                 
                 <p class="text-sm text-slate-300 leading-relaxed">
                   <span class="text-white font-bold">{{ getUnpaidCount() }} Orders</span> are stalled in Unpaid or Partial states.
                   <br>
                   <span class="text-xs text-slate-500 mt-2 block">Recovering these could recover approx <strong>{{ getRecoveryPotential() }}%</strong> of potential volume.</span>
                 </p>

                 <button class="mt-4 w-full py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase hover:bg-orange-500/20 transition-all hover:scale-[1.02]">
                   Send Payment Links
                 </button>
               </div>

            </div>
          </div>
        </ng-container>

        <ng-template #loader>
          <div class="h-[320px] flex flex-col items-center justify-center gap-3">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Mapping Order Lifecycle...</p>
          </div>
        </ng-template>

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
  `]
})
export class OrderFunnelChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(true);
  chartOptions: any;

  constructor(private analyticsService: AdminAnalyticsService) {
    this.initOptions();
  }

  ngOnInit() {
    this.loadFunnel();
  }

  // --- Helper Methods ---

  getConversionRate(index: number): string {
    const data = this.chartData()?.datasets[0]?.data;
    if (!data || !data[0]) return '0';
    // Safety: ensure data[index] exists
    const val = data[index] || 0;
    return ((val / data[0]) * 100).toFixed(0);
  }

  getUnpaidCount(): number {
    const data = this.chartData()?.datasets[0]?.data;
    // Indices: 0=Total, 1=Unpaid, 2=Partial, 3=Completed (Based on Labels)
    if (!data) return 0;
    return (data[1] || 0) + (data[2] || 0);
  }

  getRecoveryPotential(): string {
    const data = this.chartData()?.datasets[0]?.data;
    if (!data || !data[0]) return '0';
    const stuckOrders = (data[1] || 0) + (data[2] || 0);
    return ((stuckOrders / data[0]) * 100).toFixed(1);
  }

  // --- Chart Configuration ---

  private initOptions() {
    this.chartOptions = {
      indexAxis: 'y', // Horizontal bars
      maintainAspectRatio: false,
      aspectRatio: 0.8,
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
          displayColors: false,
          callbacks: {
            label: (context: any) => {
               const value = context.parsed.x;
               const total = context.chart.data.datasets[0].data[0]; 
               const percentage = ((value / (total || 1)) * 100).toFixed(1);
               return `${value} Orders (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { display: false } // Hide numbers on axis for clean look
        },
        y: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: '#94a3b8', // Slate-400
            font: { size: 11, weight: '700', family: 'var(--font-body)' },
            padding: 10
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: { left: 0, right: 20, top: 0, bottom: 0 }
      }
    };
  }

  loadFunnel() {
    this.loading.set(true);
    setTimeout(() => {
        this.analyticsService.getOrderFunnel().subscribe({
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
    // Manually assign distinctive colors based on index/label logic
    // 0: Total (Indigo), 1: Unpaid (Orange), 2: Partial (Yellow/Amber), 3: Completed (Emerald)
    const backgroundColors = [
        '#6366f1', // Indigo-500
        '#f97316', // Orange-500
        '#eab308', // Yellow-500
        '#10b981'  // Emerald-500
    ];

    // Add transparency for hover
    const hoverColors = [
        '#818cf8', 
        '#fb923c', 
        '#facc15', 
        '#34d399'  
    ];

    this.chartData.set({
        labels: data.labels,
        datasets: [{
            ...data.datasets[0],
            backgroundColor: backgroundColors,
            hoverBackgroundColor: hoverColors,
            borderRadius: 6,
            barThickness: 25, 
            borderSkipped: false
        }]
    });
  }
}
// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// @Component({
//   selector: 'app-order-funnel-chart',
//   standalone: true,
//   imports: [CommonModule, ChartModule, ProgressSpinnerModule, ButtonModule, TooltipModule],
//   template: `
//     <div class="relative w-full p-1 md:p-2 overflow-hidden rounded-2xl transition-all duration-500" 
//          [style.font-family]="'var(--font-body)'">

//       <div class="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[90px] animate-pulse-slow pointer-events-none"></div>
//       <div class="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-pink-500/10 blur-[80px] animate-pulse-slow delay-700 pointer-events-none"></div>

//       <div class="relative z-10 p-6 border rounded-2xl transition-all"
//            style="background: rgba(30, 41, 59, 0.4); 
//                   backdrop-filter: blur(12px); 
//                   -webkit-backdrop-filter: blur(12px);
//                   border: 1px solid rgba(255, 255, 255, 0.05);
//                   box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);">

//         <div class="flex justify-between items-start mb-6">
//           <div>
//             <h2 class="font-bold tracking-tight text-xl text-white flex items-center gap-2">
//               <i class="pi pi-sort-amount-down-alt text-indigo-400"></i>
//               Conversion Funnel 
//             </h2>
//             <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
//               Order Lifecycle & Fulfillment Velocity
//             </p>
//           </div>
//           <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadFunnel()" [loading]="loading()"></p-button>
//         </div>

//         <ng-container *ngIf="!loading(); else loader">
//           <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
//             <div class="lg:col-span-8">
//               <div class="h-[320px] w-full">
//                 <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
//               </div>
//             </div>

//             <div class="lg:col-span-4 flex flex-col gap-4">
               
//                <div class="p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md">
//                  <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Final Conversion Rate</p>
//                  <div class="flex items-end gap-2">
//                    <span class="text-4xl font-black text-emerald-400 tracking-tight">
//                      {{ getConversionRate(3) }}%
//                    </span>
//                    <span class="text-xs font-bold text-emerald-500/80 mb-1.5">Completed</span>
//                  </div>
//                  <div class="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
//                    <div class="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" [style.width]="getConversionRate(3) + '%'"></div>
//                  </div>
//                </div>

//                <div class="flex-1 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 flex flex-col justify-center">
//                  <div class="flex items-center gap-2 mb-2">
//                    <i class="pi pi-exclamation-circle text-orange-400"></i>
//                    <span class="text-xs font-bold uppercase text-orange-400">Revenue Risk</span>
//                  </div>
                 
//                  <p class="text-sm text-slate-300 leading-relaxed">
//                    <span class="text-white font-bold">{{ getUnpaidCount() }} Orders</span> are currently pending payment or partial. 
//                    <br><br>
//                    <span class="text-xs text-slate-500">Recovering these could boost revenue yield by an estimated <strong>{{ getRecoveryPotential() }}%</strong>.</span>
//                  </p>

//                  <button class="mt-4 w-full py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase hover:bg-orange-500/20 transition-colors">
//                    Trigger Payment Links
//                  </button>
//                </div>

//             </div>
//           </div>
//         </ng-container>

//         <ng-template #loader>
//           <div class="h-[320px] flex flex-col items-center justify-center gap-3">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Mapping Order Lifecycle...</p>
//           </div>
//         </ng-template>

//       </div>
//     </div>
//   `,
//   styles: [`
//     @keyframes pulse-slow {
//       0%, 100% { opacity: 0.4; transform: scale(1); }
//       50% { opacity: 0.7; transform: scale(1.1); }
//     }
//     .animate-pulse-slow {
//       animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
//     }
//   `]
// })
// export class OrderFunnelChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(true);
//   chartOptions: any;

//   constructor(private analyticsService: AdminAnalyticsService) {
//     this.initOptions();
//   }

//   ngOnInit() {
//     this.loadFunnel();
//   }

//   // --- Helper Methods for Template ---

//   getConversionRate(index: number): string {
//     const data = this.chartData()?.datasets[0]?.data;
//     if (!data || !data[0]) return '0';
//     return ((data[index] / data[0]) * 100).toFixed(0);
//   }

//   getUnpaidCount(): number {
//     const data = this.chartData()?.datasets[0]?.data;
//     // Assuming index 1 is 'Unpaid' and 2 is 'Partial' based on labels
//     if (!data) return 0;
//     return (data[1] || 0) + (data[2] || 0);
//   }

//   getRecoveryPotential(): string {
//     const data = this.chartData()?.datasets[0]?.data;
//     if (!data || !data[0]) return '0';
//     const stuckOrders = (data[1] || 0) + (data[2] || 0);
//     return ((stuckOrders / data[0]) * 100).toFixed(1);
//   }

//   // --- Chart Logic ---

//   private initOptions() {
//     const textColor = '#94a3b8';
    
//     this.chartOptions = {
//       indexAxis: 'y', // Horizontal bars
//       maintainAspectRatio: false,
//       aspectRatio: 0.8,
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           backgroundColor: 'rgba(15, 23, 42, 0.9)',
//           titleColor: '#fff',
//           bodyColor: '#cbd5e1',
//           padding: 12,
//           cornerRadius: 8,
//           displayColors: false,
//           callbacks: {
//             label: (context: any) => {
//                const value = context.parsed.x;
//                const total = context.chart.data.datasets[0].data[0]; // Total Orders is index 0
//                const percentage = ((value / total) * 100).toFixed(1);
//                return `${value} Orders (${percentage}%)`;
//             }
//           }
//         }
//       },
//       scales: {
//         x: {
//           grid: { display: false, drawBorder: false },
//           ticks: { display: false } // Hide bottom numbers for cleaner look
//         },
//         y: {
//           grid: { display: false, drawBorder: false },
//           ticks: {
//             color: '#e2e8f0', // lighter text for labels
//             font: { size: 12, weight: '700', family: 'var(--font-body)' },
//             padding: 10
//           }
//         }
//       },
//       animation: {
//         duration: 1200,
//         easing: 'easeOutQuart'
//       }
//     };
//   }

//   loadFunnel() {
//     this.loading.set(true);
//     // Simulate delay for smooth UI transition
//     setTimeout(() => {
//         this.analyticsService.getOrderFunnel().subscribe({
//         next: (res) => {
//             if (res.status === 'success') {
//                 this.processData(res.data);
//             }
//             this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//         });
//     }, 600);
//   }

//   private processData(data: any) {
//     // Apply gradients to the bars
//     const backgroundColors = data.labels.map((label: string, index: number) => {
//         return (context: any) => {
//             const ctx = context.chart.ctx;
//             const gradient = ctx.createLinearGradient(0, 0, 400, 0); // Horizontal gradient
            
//             // Customize colors based on index/label logic
//             if (index === 0) { // Total - Blue/Indigo
//                 gradient.addColorStop(0, '#6366f1'); 
//                 gradient.addColorStop(1, '#818cf8');
//             } else if (index === 3) { // Completed - Emerald
//                 gradient.addColorStop(0, '#10b981'); 
//                 gradient.addColorStop(1, '#34d399');
//             } else { // Issues (Unpaid/Partial) - Orange/Amber
//                 gradient.addColorStop(0, '#f97316'); 
//                 gradient.addColorStop(1, '#fb923c');
//             }
//             return gradient;
//         };
//     });

//     this.chartData.set({
//         labels: data.labels,
//         datasets: [{
//             ...data.datasets[0],
//             backgroundColor: backgroundColors,
//             borderRadius: 6, // Rounded bar ends
//             barThickness: 30, // Thicker bars
//             borderSkipped: false
//         }]
//     });
//   }
// }
// // import { Component, OnInit, signal, computed } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ChartModule } from 'primeng/chart';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { ButtonModule } from 'primeng/button';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { AdminAnalyticsService } from '../admin-analytics.service';

// // @Component({
// //   selector: 'app-order-funnel-chart',
// //   standalone: true,
// //   imports: [CommonModule, ChartModule, ProgressSpinnerModule, ButtonModule, TooltipModule],
// //   template: `
// //     <div class="p-4 md:p-6 transition-colors duration-300" 
// //          [style.background]="'var(--theme-bg-primary)'"
// //          [style.font-family]="'var(--font-body)'">

// //       <div class="mb-6 flex justify-between items-center">
// //         <div>
// //           <h2 class="font-bold tracking-tight mb-1" 
// //               [style.color]="'var(--theme-text-primary)'"
// //               [style.font-family]="'var(--font-heading)'"
// //               [style.font-size]="'var(--font-size-xl)'">Order Conversion Funnel</h2>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
// //             Tracking sales progression and payment fulfillment stages
// //           </p>
// //         </div>
// //         <p-button icon="pi pi-sync" [text]="true" severity="info" size="small" (onClick)="loadFunnel()"></p-button>
// //       </div>

// //       <div class="p-6 border relative transition-all" 
// //            [style.background]="'var(--theme-bg-secondary)'" 
// //            [style.border-color]="'var(--theme-border-primary)'" 
// //            [style.border-radius]="'var(--ui-border-radius-xl)'">
        
// //         <ng-container *ngIf="!loading(); else loader">
// //           <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
// //             <div class="md:col-span-8">
// //               <div class="h-[300px] w-full">
// //                 <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
// //               </div>
// //             </div>

// //             <div class="md:col-span-4 space-y-3">
// //                <h4 class="font-bold uppercase text-[10px] mb-4" [style.color]="'var(--theme-text-label)'">Funnel Efficiency</h4>
               
// //                @for (label of chartData()?.labels; track label; let i = $index) {
// //                  <div class="p-3 border flex justify-between items-center transition-all"
// //                       [style.background]="'var(--theme-bg-ternary)'"
// //                       [style.border-color]="'var(--theme-border-secondary)'"
// //                       [style.border-radius]="'var(--ui-border-radius-lg)'">
// //                     <div class="flex items-center gap-3">
// //                       <div class="w-2 h-6 rounded-full" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
// //                       <span class="font-bold text-white text-xs">{{ label }}</span>
// //                     </div>
// //                     <div class="text-right">
// //                        <p class="font-black tabular-nums text-white text-md">{{ chartData()?.datasets[0].data[i] }}</p>
// //                        <p class="text-[9px] font-bold opacity-50 uppercase" [style.color]="'var(--theme-text-label)'">
// //                          {{ getConversionRate(i) }}% Yield
// //                        </p>
// //                     </div>
// //                  </div>
// //                }
// //             </div>
// //           </div>
// //         </ng-container>

// //         <ng-template #loader>
// //           <div class="h-[300px] flex flex-col items-center justify-center gap-3">
// //             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
// //             <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Mapping Order Lifecycle...</p>
// //           </div>
// //         </ng-template>
// //       </div>

// //       <div class="mt-6 p-4 border border-dashed rounded-lg flex items-start gap-4"
// //            [style.border-color]="'var(--theme-border-secondary)'"
// //            [style.background]="'rgba(255, 159, 64, 0.03)'">
// //          <i class="pi pi-filter-fill text-orange-400 mt-1"></i>
// //          <div class="space-y-1">
// //             <p class="font-bold text-orange-400" [style.font-size]="'var(--font-size-sm)'">Fulfillment Bottleneck Detected</p>
// //             <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
// //               You have <span class="text-white font-bold">{{ chartData()?.datasets[0].data[1] }} Unpaid</span> orders out of {{ chartData()?.datasets[0].data[0] }} total. 
// //               Prompting payment reminders for these invoices could improve your "Completed" yield significantly.
// //             </p>
// //          </div>
// //       </div>
// //     </div>
// //   `
// // })
// // export class OrderFunnelChartComponent implements OnInit {
// //   chartData = signal<any>(null);
// //   loading = signal<boolean>(true);
// //   chartOptions: any;

// //   constructor(private analyticsService: AdminAnalyticsService) {
// //     this.initOptions();
// //   }

// //   ngOnInit() {
// //     this.loadFunnel();
// //   }

// //   private initOptions() {
// //     this.chartOptions = {
// //       indexAxis: 'y', // Makes the bar chart horizontal
// //       maintainAspectRatio: false,
// //       plugins: {
// //         legend: { display: false },
// //         tooltip: {
// //           backgroundColor: '#0f172a',
// //           padding: 12,
// //           cornerRadius: 8,
// //           bodyFont: { size: 12, weight: 'bold' }
// //         }
// //       },
// //       scales: {
// //         x: {
// //           grid: { display: false },
// //           ticks: { display: false }
// //         },
// //         y: {
// //           grid: { display: false },
// //           ticks: {
// //             color: '#94a3b8',
// //             font: { size: 10, weight: '600' }
// //           }
// //         }
// //       }
// //     };
// //   }

// //   loadFunnel() {
// //     this.loading.set(true);
// //     this.analyticsService.getOrderFunnel().subscribe({
// //       next: (res) => {
// //         if (res.status === 'success') {
// //           this.chartData.set(res.data);
// //         }
// //         this.loading.set(false);
// //       },
// //       error: () => this.loading.set(false)
// //     });
// //   }

// //   getConversionRate(index: number): string {
// //     const data = this.chartData()?.datasets[0].data;
// //     if (!data || data[0] === 0) return '0';
// //     return ((data[index] / data[0]) * 100).toFixed(0);
// //   }
// // }