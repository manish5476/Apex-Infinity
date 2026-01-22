import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-branch-radar-chart',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressSpinnerModule, ButtonModule, TooltipModule],
  template: `
    <div class="relative w-full p-1 md:p-2 overflow-hidden rounded-2xl transition-all duration-500" 
         [style.font-family]="'var(--font-body)'">

      <div class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[100px] animate-pulse-slow pointer-events-none"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[90px] animate-pulse-slow delay-1000 pointer-events-none"></div>

      <div class="relative z-10 p-6 border rounded-2xl transition-all"
           style="background: rgba(15, 23, 42, 0.6); 
                  backdrop-filter: blur(16px); 
                  -webkit-backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 255, 255, 0.08);
                  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);">

        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="font-bold tracking-tight text-xl text-white flex items-center gap-2">
              <i class="pi pi-compass text-sky-400"></i>
              Operational Radar 
            </h2>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
              Multidimensional Efficiency Metrics
            </p>
          </div>
          <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadRadar()" [loading]="loading()"></p-button>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div class="md:col-span-8 h-[400px] flex justify-center relative">
               <p-chart type="radar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
               
               <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                 <i class="pi pi-crosshairs text-6xl text-white"></i>
               </div>
            </div>

            <div class="md:col-span-4 flex flex-col justify-center gap-4">
               <div class="space-y-3">
                 <h4 class="font-bold uppercase text-[10px] text-slate-500 mb-2">Metric Breakdown</h4>
                 
                 @for (label of chartData()?.labels; track label; let i = $index) {
                   <div class="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-white/5 transition-all hover:bg-white/10 group">
                      <span class="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{{ label }}</span>
                      <span class="font-black tabular-nums text-sm" 
                            [ngClass]="getScoreColor(chartData()?.datasets[0].data[i])">
                        {{ chartData()?.datasets[0].data[i] }}%
                      </span>
                   </div>
                 }
               </div>

               <div class="mt-4 p-4 border border-dashed rounded-lg border-sky-500/30 bg-sky-500/5">
                 <div class="flex gap-3">
                   <i class="pi pi-info-circle text-sky-400 mt-0.5"></i>
                   <div>
                     <p class="font-bold text-sky-400 text-xs mb-1">Efficiency Profile: {{ chartData()?.datasets[0].label }}</p>
                     <p class="text-xs text-slate-300 leading-relaxed">
                       Revenue & Volume are peaking at <span class="text-white font-bold">100%</span>. 
                       <br>Zero discounts/cancellations indicate extremely strong pricing power.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>

        </ng-container>

        <ng-template #loader>
          <div class="h-[400px] flex flex-col items-center justify-center gap-3">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Calibrating Performance Matrix...</p>
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
export class BranchRadarChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(true);
  chartOptions: any;

  constructor(private analyticsService: AdminAnalyticsService) {
    this.initOptions();
  }

  ngOnInit() {
    this.loadRadar();
  }

  // Helper for text colors based on score
  getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-sky-400';
    return 'text-rose-400';
  }

  private initOptions() {
    const gridColor = 'rgba(255, 255, 255, 0.08)';
    const textColor = '#cbd5e1'; // slate-300

    this.chartOptions = {
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context: any) => ` ${context.label}: ${context.raw}%`
          }
        }
      },
      scales: {
        r: {
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          pointLabels: {
            color: textColor,
            font: { size: 11, weight: '700', family: 'var(--font-body)' }
          },
          ticks: {
            display: false, // Cleaner look without concentric numbers
            stepSize: 20,
            color: 'rgba(255,255,255,0.3)',
            backdropColor: 'transparent'
          },
          suggestedMin: 0,
          suggestedMax: 100
        }
      },
      maintainAspectRatio: false
    };
  }

  loadRadar() {
    this.loading.set(true);
    // Simulate slight delay for smoothness
    setTimeout(() => {
        this.analyticsService.getBranchPerformanceRadar().subscribe({
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
    // Apply Gradient Fill
    const gradientFill = (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createRadialGradient(
            context.chart.width / 2, 
            context.chart.height / 2, 
            0, 
            context.chart.width / 2, 
            context.chart.height / 2, 
            context.chart.width / 2
        );
        // Sky blue to transparent center
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.5)'); // Sky-500
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0.1)');
        return gradient;
    };

    const dataset = {
        ...rawData.datasets[0],
        backgroundColor: gradientFill,
        borderColor: '#38bdf8', // Sky-400
        borderWidth: 2,
        pointBackgroundColor: '#0ea5e9', // Sky-500
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0ea5e9',
        pointRadius: 4,
        pointHoverRadius: 6
    };

    this.chartData.set({
        labels: rawData.labels,
        datasets: [dataset]
    });
  }
}

// import { Component, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// @Component({
//   selector: 'app-branch-radar-chart',
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
//               [style.font-size]="'var(--font-size-xl)'">Operational Radar</h2>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
//             Multidimensional Branch Efficiency Metrics
//           </p>
//         </div>
//         <p-button icon="pi pi-sync" [text]="true" severity="info" size="small" (onClick)="loadRadar()"></p-button>
//       </div>

//       <div class="p-6 border relative transition-all" 
//            [style.background]="'var(--theme-bg-secondary)'" 
//            [style.border-color]="'var(--theme-border-primary)'" 
//            [style.border-radius]="'var(--ui-border-radius-xl)'">
        
//         <ng-container *ngIf="!loading(); else loader">
//           <div class="h-[400px] w-full flex justify-center">
//             <p-chart type="radar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
//           </div>

//           <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
//              @for (label of chartData()?.labels; track label; let i = $index) {
//                <div class="p-3 border rounded-lg" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'">
//                   <p class="uppercase font-bold text-[9px] mb-1" [style.color]="'var(--theme-text-label)'">{{ label }}</p>
//                   <p class="text-lg font-bold tabular-nums text-white">{{ chartData()?.datasets[0].data[i] }}%</p>
//                </div>
//              }
//           </div>
//         </ng-container>

//         <ng-template #loader>
//           <div class="h-[400px] flex flex-col items-center justify-center gap-3">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Calibrating Performance Matrix...</p>
//           </div>
//         </ng-template>
//       </div>

//       <div class="mt-6 p-4 border border-dashed rounded-lg flex items-start gap-4"
//            [style.border-color]="'var(--theme-border-secondary)'"
//            [style.background]="'rgba(66, 165, 245, 0.05)'">
//          <i class="pi pi-compass text-blue-400 mt-1"></i>
//          <div class="space-y-1">
//             <p class="font-bold text-blue-400" [style.font-size]="'var(--font-size-sm)'">Efficiency Profile: {{ chartData()?.datasets[0].label }}</p>
//             <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
//               Revenue and Volume scores are at 100%, indicating peak sales performance. Low discount usage suggests strong pricing power for this branch.
//             </p>
//          </div>
//       </div>
//     </div>
//   `
// })
// export class BranchRadarChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(true);
//   chartOptions: any;

//   constructor(private analyticsService: AdminAnalyticsService) {
//     this.initOptions();
//   }

//   ngOnInit() {
//     this.loadRadar();
//   }

//   private initOptions() {
//     // Styling the radar grid to match Dark Theme
//     const gridColor = 'rgba(255, 255, 255, 0.05)';
//     const labelColor = '#94a3b8';

//     this.chartOptions = {
//       plugins: {
//         legend: { display: false }
//       },
//       scales: {
//         r: {
//           grid: { color: gridColor },
//           angleLines: { color: gridColor },
//           pointLabels: {
//             color: labelColor,
//             font: { size: 10, weight: '600' }
//           },
//           ticks: {
//             display: false, // Cleaner look
//             stepSize: 20
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
//     this.analyticsService.getBranchPerformanceRadar().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           const data = res.data;
//           // Apply theme-specific fill transparency
//           data.datasets[0].backgroundColor = 'rgba(66, 165, 245, 0.2)';
//           this.chartData.set(data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }