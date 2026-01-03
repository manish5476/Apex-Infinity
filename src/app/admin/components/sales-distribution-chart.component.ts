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
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-6 flex justify-between items-center">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-xl)'">Sales Distribution</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
            Revenue share by category and segmentation
          </p>
        </div>
        <div class="flex gap-2">
           <p-button icon="pi pi-filter" [text]="true" severity="secondary" size="small"></p-button>
           <p-button icon="pi pi-refresh" [text]="true" severity="info" size="small" (onClick)="loadDistribution()"></p-button>
        </div>
      </div>

      <div class="p-6 border relative transition-all" 
           [style.background]="'var(--theme-bg-secondary)'" 
           [style.border-color]="'var(--theme-border-primary)'" 
           [style.border-radius]="'var(--ui-border-radius-xl)'">
        
        <ng-container *ngIf="!loading(); else loader">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div class="md:col-span-7 relative flex justify-center items-center">
              <div class="h-[300px] w-full">
                <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
              </div>
              
              <div class="absolute flex flex-col items-center justify-center text-center mt-[-10px]">
                 <span [style.color]="'var(--theme-text-label)'" class="text-[10px] font-bold uppercase tracking-tighter">Total Volume</span>
                 <span class="text-2xl font-black text-white tabular-nums">₹{{ totalRevenue() | number }}</span>
              </div>
            </div>

            <div class="md:col-span-5 space-y-4">
               <h4 class="font-bold uppercase text-[10px] mb-4" [style.color]="'var(--theme-text-label)'">Distribution Breakdown</h4>
               
               @for (label of chartData()?.labels; track label; let i = $index) {
                 <div class="flex items-center justify-between p-3 border transition-colors hover:bg-white/5"
                      [style.background]="'var(--theme-bg-ternary)'"
                      [style.border-color]="'var(--theme-border-secondary)'"
                      [style.border-radius]="'var(--ui-border-radius-lg)'">
                    <div class="flex items-center gap-3">
                      <div class="w-3 h-3 rounded-full" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
                      <span class="font-bold text-white text-xs truncate w-24">{{ label }}</span>
                    </div>
                    <div class="text-right">
                       <p class="font-bold tabular-nums text-white text-xs">₹{{ chartData()?.datasets[0].data[i] | number }}</p>
                       <p class="text-[9px] font-bold opacity-50 uppercase" [style.color]="'var(--theme-text-label)'">
                         {{ (chartData()?.datasets[0].data[i] / totalRevenue() * 100) | number:'1.0-1' }}% Share
                       </p>
                    </div>
                 </div>
               }
            </div>
          </div>
        </ng-container>

        <ng-template #loader>
          <div class="h-[300px] flex flex-col items-center justify-center gap-3">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Slicing Sales Data...</p>
          </div>
        </ng-template>
      </div>

      <div class="mt-6 p-4 border border-dashed rounded-lg flex items-center gap-4"
           [style.border-color]="'var(--theme-border-secondary)'"
           [style.background]="'rgba(139, 92, 246, 0.03)'">
         <i class="pi pi-chart-pie text-indigo-400"></i>
         <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
           The <strong>{{ chartData()?.labels[0] }}</strong> segment represents the majority of your current cycle revenue. 
           Consider enriching customer profiles to move these transactions into identified categories.
         </p>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-chart {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `]
})
export class SalesDistributionChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(true);
  chartOptions: any;

  // Computed: Sum of all data points in the first dataset
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
      cutout: '75%', // Creates the doughnut effect
      plugins: {
        legend: { display: false }, // Using custom legend in HTML
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 12,
          cornerRadius: 8,
          bodyFont: { size: 12, weight: 'bold' },
          callbacks: {
            label: (context: any) => {
              return ` ₹${context.raw.toLocaleString()}`;
            }
          }
        }
      },
      maintainAspectRatio: false
    };
  }

  loadDistribution() {
    this.loading.set(true);
    this.analyticsService.getSalesDistribution().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.chartData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}