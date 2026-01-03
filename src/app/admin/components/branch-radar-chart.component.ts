import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-branch-radar-chart',
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
              [style.font-size]="'var(--font-size-xl)'">Operational Radar</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
            Multidimensional Branch Efficiency Metrics
          </p>
        </div>
        <p-button icon="pi pi-sync" [text]="true" severity="info" size="small" (onClick)="loadRadar()"></p-button>
      </div>

      <div class="p-6 border relative transition-all" 
           [style.background]="'var(--theme-bg-secondary)'" 
           [style.border-color]="'var(--theme-border-primary)'" 
           [style.border-radius]="'var(--ui-border-radius-xl)'">
        
        <ng-container *ngIf="!loading(); else loader">
          <div class="h-[400px] w-full flex justify-center">
            <p-chart type="radar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
          </div>

          <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
             @for (label of chartData()?.labels; track label; let i = $index) {
               <div class="p-3 border rounded-lg" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'">
                  <p class="uppercase font-bold text-[9px] mb-1" [style.color]="'var(--theme-text-label)'">{{ label }}</p>
                  <p class="text-lg font-bold tabular-nums text-white">{{ chartData()?.datasets[0].data[i] }}%</p>
               </div>
             }
          </div>
        </ng-container>

        <ng-template #loader>
          <div class="h-[400px] flex flex-col items-center justify-center gap-3">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Calibrating Performance Matrix...</p>
          </div>
        </ng-template>
      </div>

      <div class="mt-6 p-4 border border-dashed rounded-lg flex items-start gap-4"
           [style.border-color]="'var(--theme-border-secondary)'"
           [style.background]="'rgba(66, 165, 245, 0.05)'">
         <i class="pi pi-compass text-blue-400 mt-1"></i>
         <div class="space-y-1">
            <p class="font-bold text-blue-400" [style.font-size]="'var(--font-size-sm)'">Efficiency Profile: {{ chartData()?.datasets[0].label }}</p>
            <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
              Revenue and Volume scores are at 100%, indicating peak sales performance. Low discount usage suggests strong pricing power for this branch.
            </p>
         </div>
      </div>
    </div>
  `
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

  private initOptions() {
    // Styling the radar grid to match Dark Theme
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    const labelColor = '#94a3b8';

    this.chartOptions = {
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          pointLabels: {
            color: labelColor,
            font: { size: 10, weight: '600' }
          },
          ticks: {
            display: false, // Cleaner look
            stepSize: 20
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
    this.analyticsService.getBranchPerformanceRadar().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          const data = res.data;
          // Apply theme-specific fill transparency
          data.datasets[0].backgroundColor = 'rgba(66, 165, 245, 0.2)';
          this.chartData.set(data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}