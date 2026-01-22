import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

interface ForecastPeriod {
  period: string;
  predictedRevenue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  growth: number;
}

@Component({
  selector: 'app-sales-forecast',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ProgressSpinnerModule, TooltipModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">Predictive Sales Analytics</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            AI-driven revenue forecasting based on historical linear regression
          </p>
        </div>
        <div class="flex gap-2">
          <p-button label="Adjust Model" icon="pi pi-sliders-h" [text]="true" severity="secondary" size="small"></p-button>
          <p-button label="Recalculate" icon="pi pi-refresh" severity="info" size="small" (onClick)="loadForecast()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8 space-y-6">
            <div class="p-8 border relative overflow-hidden" 
                 [style.background]="'var(--theme-bg-secondary)'" 
                 [style.border-color]="'var(--theme-border-primary)'" 
                 [style.border-radius]="'var(--ui-border-radius-xl)'">
              
              <div class="flex justify-between items-start relative z-10">
                <div>
                  <span class="px-2 py-1 rounded font-black text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                    {{ forecastData()?.forecast[0]?.period }} Outlook
                  </span>
                  <h3 class="mt-4 font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-lg)'">Predicted Revenue</h3>
                  <h1 class="text-5xl font-bold tabular-nums my-2" [style.color]="'var(--theme-text-primary)'">
                    ₹{{ forecastData()?.forecast[0]?.predictedRevenue | number }}
                  </h1>
                </div>
                
                <div class="text-right">
                  <div class="flex items-center justify-end gap-2" 
                       [style.color]="forecastData()?.forecast[0]?.growth >= 0 ? 'var(--theme-success)' : 'var(--theme-error)'">
                    <i class="pi" [ngClass]="forecastData()?.forecast[0]?.growth >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'"></i>
                    <span class="text-2xl font-bold tabular-nums">{{ forecastData()?.forecast[0]?.growth }}%</span>
                  </div>
                  <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase mt-1">Growth Forecast</p>
                </div>
              </div>

              <div class="mt-10 relative z-10">
                <div class="flex justify-between text-[11px] font-bold uppercase mb-2" [style.color]="'var(--theme-text-label)'">
                  <span>Lower Bound: ₹{{ forecastData()?.forecast[0]?.lowerBound | number }}</span>
                  <span>Confidence: {{ forecastData()?.forecast[0]?.confidence }}%</span>
                  <span>Upper Bound: ₹{{ forecastData()?.forecast[0]?.upperBound | number }}</span>
                </div>
                <div class="w-full h-4 rounded-full bg-white/5 border overflow-hidden p-1" [style.border-color]="'var(--theme-border-primary)'">
                  <div class="h-full rounded-full transition-all duration-1000 opacity-50" 
                       [style.background]="'var(--theme-accent-gradient)'" [style.width]="'100%'"></div>
                </div>
              </div>

              <i class="pi pi-chart-line absolute right-[-20px] bottom-[-20px] text-[12rem] opacity-5 pointer-events-none" [style.color]="'var(--theme-text-primary)'"></i>
            </div>

            <div class="p-5 border border-dashed flex items-start gap-4"
                 [style.border-color]="'var(--theme-border-secondary)'"
                 [style.background]="'var(--theme-bg-ternary)'"
                 [style.border-radius]="'var(--ui-border-radius-lg)'">
               <div class="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500 shrink-0">
                 <i class="pi pi-exclamation-triangle"></i>
               </div>
               <div>
                 <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Strategy Insight</p>
                 <p class="mt-1 leading-relaxed" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                   The model predicts a <span class="font-bold text-rose-400">{{ forecastData()?.forecast[0]?.growth }}% contraction</span> for the next period. 
                   Review inventory reorder levels for high-cost SKUs to maintain optimal cash flow during this projected slowdown.
                 </p>
               </div>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-6">
            <div class="p-6 border" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-6 uppercase tracking-widest" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Forecast Engine</h4>
              
              <div class="space-y-6">
                <div>
                  <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-2">MODEL ACCURACY</p>
                  <div class="flex items-center gap-3">
                    <span class="text-xl font-bold uppercase" [style.color]="'var(--theme-warning)'">{{ forecastData()?.accuracy }}</span>
                    <div class="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                       <div class="h-full bg-amber-500" [style.width]="'60%'"></div>
                    </div>
                  </div>
                </div>

                <div class="pt-4 border-t" [style.border-color]="'var(--theme-border-primary)'">
                  <div class="flex justify-between mb-4">
                    <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Algorithm</span>
                    <span class="font-mono text-white text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase">
                      {{ forecastData()?.model?.replace('_', ' ') }}
                    </span>
                  </div>
                  <div class="flex justify-between mb-4">
                    <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Data Points Used</span>
                    <span class="font-bold text-white tabular-nums">{{ forecastData()?.historicalDataPoints }} Periods</span>
                  </div>
                  <div class="flex justify-between">
                    <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Last Compute</span>
                    <span class="font-bold text-white tabular-nums">{{ meta()?.timestamp | date:'shortTime' }}</span>
                  </div>
                </div>

                <p-button label="Download Intelligence Report" icon="pi pi-file-pdf" [fluid]="true" severity="secondary" size="small"></p-button>
              </div>
            </div>

            <div class="p-6 border text-center" 
                 [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <i class="pi pi-verified text-emerald-500 text-3xl mb-3"></i>
              <h4 class="font-bold text-white">Reliability Score</h4>
              <p class="text-4xl font-bold text-emerald-500 tabular-nums my-2">{{ forecastData()?.forecast[0]?.confidence }}%</p>
              <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Statistical significance within safe margins.</p>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Training Regression Model...</p>
        </div>
      </ng-template>

    </div>
  `
})
export class SalesForecastComponent implements OnInit {
  forecastData = signal<any>(null);
  meta = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.loadForecast();
  }

  loadForecast() {
    this.loading.set(true);
    // Requesting 3 periods and 0.95 confidence as per your service definition
    this.analyticsService.getSalesForecast(undefined, 3, 0.95).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.forecastData.set(res.data);
          this.meta.set(res.meta);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}