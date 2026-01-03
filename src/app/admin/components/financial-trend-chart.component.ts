import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-financial-trend-chart',
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
              [style.font-size]="'var(--font-size-xl)'">Financial Performance Trend</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
            Annual Income vs Expense vs Profitability
          </p>
        </div>
        <p-button icon="pi pi-expand" [text]="true" severity="secondary" size="small"></p-button>
      </div>

      <div class="p-6 border relative transition-all" 
           [style.background]="'var(--theme-bg-secondary)'" 
           [style.border-color]="'var(--theme-border-primary)'" 
           [style.border-radius]="'var(--ui-border-radius-xl)'">
        
        <ng-container *ngIf="!loading(); else loader">
          <div class="h-[400px]">
            <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
          </div>
          
          <div class="mt-6 grid grid-cols-3 gap-4 border-t pt-6" [style.border-color]="'var(--theme-border-primary)'">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm bg-[#4caf50]"></div>
              <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Income</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm bg-[#f44336]"></div>
              <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Expense</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm bg-[#2196f3]"></div>
              <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Net Profit</span>
            </div>
          </div>
        </ng-container>

        <ng-template #loader>
          <div class="h-[400px] flex flex-col items-center justify-center gap-3">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Rendering Fiscal Trends...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class FinancialTrendChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(true);
  chartOptions: any;

  constructor(private analyticsService: AdminAnalyticsService) {
    this.initOptions();
  }

  ngOnInit() {
    this.loadTrend();
  }

  private initOptions() {
    // Accessing CSS Variables for Dynamic Chart Colors
    const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-tertiary') || '#94a3b8';
    const borderSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-border-primary') || '#1e293b';

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: { display: false }, // Using custom legend in HTML for better control
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true
        }
      },
      scales: {
        x: {
          ticks: { color: textSecondary, font: { size: 10, weight: '600' } },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: textSecondary,
            font: { size: 10 },
            callback: (value: number) => '₹' + value.toLocaleString()
          },
          grid: { color: borderSecondary, drawBorder: false }
        }
      }
    };
  }

  loadTrend() {
    this.loading.set(true);
    this.analyticsService.getFinancialTrend().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          // Enhancing raw data with theme-specific transparency and styling
          const data = res.data;
          data.datasets[0].backgroundColor = 'rgba(76, 175, 80, 0.1)'; // Soft Green
          data.datasets[1].backgroundColor = 'rgba(244, 67, 54, 0.1)'; // Soft Red

          this.chartData.set(data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}