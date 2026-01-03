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
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-6 flex justify-between items-center">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-xl)'">Order Conversion Funnel</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
            Tracking sales progression and payment fulfillment stages
          </p>
        </div>
        <p-button icon="pi pi-sync" [text]="true" severity="info" size="small" (onClick)="loadFunnel()"></p-button>
      </div>

      <div class="p-6 border relative transition-all" 
           [style.background]="'var(--theme-bg-secondary)'" 
           [style.border-color]="'var(--theme-border-primary)'" 
           [style.border-radius]="'var(--ui-border-radius-xl)'">
        
        <ng-container *ngIf="!loading(); else loader">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div class="md:col-span-8">
              <div class="h-[300px] w-full">
                <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
              </div>
            </div>

            <div class="md:col-span-4 space-y-3">
               <h4 class="font-bold uppercase text-[10px] mb-4" [style.color]="'var(--theme-text-label)'">Funnel Efficiency</h4>
               
               @for (label of chartData()?.labels; track label; let i = $index) {
                 <div class="p-3 border flex justify-between items-center transition-all"
                      [style.background]="'var(--theme-bg-ternary)'"
                      [style.border-color]="'var(--theme-border-secondary)'"
                      [style.border-radius]="'var(--ui-border-radius-lg)'">
                    <div class="flex items-center gap-3">
                      <div class="w-2 h-6 rounded-full" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
                      <span class="font-bold text-white text-xs">{{ label }}</span>
                    </div>
                    <div class="text-right">
                       <p class="font-black tabular-nums text-white text-md">{{ chartData()?.datasets[0].data[i] }}</p>
                       <p class="text-[9px] font-bold opacity-50 uppercase" [style.color]="'var(--theme-text-label)'">
                         {{ getConversionRate(i) }}% Yield
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
            <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Mapping Order Lifecycle...</p>
          </div>
        </ng-template>
      </div>

      <div class="mt-6 p-4 border border-dashed rounded-lg flex items-start gap-4"
           [style.border-color]="'var(--theme-border-secondary)'"
           [style.background]="'rgba(255, 159, 64, 0.03)'">
         <i class="pi pi-filter-fill text-orange-400 mt-1"></i>
         <div class="space-y-1">
            <p class="font-bold text-orange-400" [style.font-size]="'var(--font-size-sm)'">Fulfillment Bottleneck Detected</p>
            <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
              You have <span class="text-white font-bold">{{ chartData()?.datasets[0].data[1] }} Unpaid</span> orders out of {{ chartData()?.datasets[0].data[0] }} total. 
              Prompting payment reminders for these invoices could improve your "Completed" yield significantly.
            </p>
         </div>
      </div>
    </div>
  `
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

  private initOptions() {
    this.chartOptions = {
      indexAxis: 'y', // Makes the bar chart horizontal
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 12,
          cornerRadius: 8,
          bodyFont: { size: 12, weight: 'bold' }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { display: false }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 10, weight: '600' }
          }
        }
      }
    };
  }

  loadFunnel() {
    this.loading.set(true);
    this.analyticsService.getOrderFunnel().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.chartData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getConversionRate(index: number): string {
    const data = this.chartData()?.datasets[0].data;
    if (!data || data[0] === 0) return '0';
    return ((data[index] / data[0]) * 100).toFixed(0);
  }
}