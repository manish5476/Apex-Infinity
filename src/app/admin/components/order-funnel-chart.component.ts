import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-order-funnel-chart',
  standalone: true,
  imports: [
    CommonModule, 
    ChartModule, 
    ProgressSpinnerModule, 
    ButtonModule, 
    TooltipModule
  ],
  template: `
    <div class="funnel-container">

      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="chart-card">

        <div class="card-header">
          <div>
            <h2 class="card-title">
              <i class="pi pi-sort-amount-down-alt header-icon"></i>
              Conversion Funnel 
            </h2>
            <p class="card-subtitle">
              Order Lifecycle & Fulfillment Velocity
            </p>
          </div>
          <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadFunnel()" [loading]="loading()"></p-button>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          <div class="content-grid">
            
            <div class="chart-wrapper">
              <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%"></p-chart>
              
              <div class="axis-guide"></div>
            </div>

            <div class="insights-panel">
               
               <div class="metric-box success">
                 <p class="metric-label">Conversion Rate</p>
                 <div class="metric-row">
                   <span class="metric-value">
                     {{ getConversionRate(3) }}%
                   </span>
                   <span class="metric-sub">Completed</span>
                 </div>
                 <div class="progress-track">
                   <div class="progress-fill success" [style.width]="getConversionRate(3) + '%'"></div>
                 </div>
               </div>

               <div class="action-box warning">
                 <div class="action-header">
                   <i class="pi pi-exclamation-circle action-icon"></i>
                   <span class="action-title">Revenue Recovery</span>
                 </div>
                 
                 <p class="action-text">
                   <span class="highlight">{{ getUnpaidCount() }} Orders</span> are stalled in Unpaid or Partial states.
                   <br>
                   <span class="sub-text">Recovering these could recover approx <strong>{{ getRecoveryPotential() }}%</strong> of potential volume.</span>
                 </p>

                 <button class="action-btn">
                   Send Payment Links
                 </button>
               </div>

            </div>
          </div>
        </ng-container>

        <ng-template #loader>
          <div class="loader-container">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p class="loader-text">Mapping Order Lifecycle...</p>
          </div>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .funnel-container {
      position: relative;
      width: 100%;
      padding: var(--spacing-sm);
      overflow: hidden;
      border-radius: var(--ui-border-radius-xl);
    }

    /* AMBIENT BLOBS */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: 0;
      opacity: 0.1;
      pointer-events: none;
    }
    .blob-1 {
      top: -50%; right: -10%; width: 400px; height: 400px;
      background: var(--accent-primary);
      animation: pulse-slow 8s infinite;
    }
    .blob-2 {
      bottom: -20%; left: -10%; width: 300px; height: 300px;
      background: var(--color-warning); /* Orange/Amber */
      animation: pulse-slow 8s infinite 1s;
    }

    @keyframes pulse-slow {
      0%, 100% { transform: scale(1); opacity: 0.1; }
      50% { transform: scale(1.1); opacity: 0.15; }
    }

    /* MAIN CARD */
    .chart-card {
      position: relative;
      z-index: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-sm);
      backdrop-filter: blur(10px);
    }

    /* HEADER */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
    }

    .card-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      letter-spacing: -0.01em;
    }

    .header-icon { color: var(--accent-primary); }

    .card-subtitle {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      margin: 4px 0 0 0;
    }

    /* CONTENT GRID */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-2xl);
      align-items: center;
    }
    @media (min-width: 1024px) {
      .content-grid { grid-template-columns: 2fr 1fr; }
    }

    /* CHART WRAPPER */
    .chart-wrapper {
      position: relative;
      height: 320px;
      width: 100%;
    }

    .axis-guide {
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-left: 1px solid var(--border-secondary);
      border-bottom: 1px solid var(--border-secondary);
      opacity: 0.5;
    }

    /* INSIGHTS PANEL */
    .insights-panel {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    /* METRIC BOX (Success Style) */
    .metric-box {
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius-lg);
      border: 1px solid var(--color-success-border);
      background: var(--color-success-bg);
    }

    .metric-label {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin: 0 0 4px 0;
    }

    .metric-row { display: flex; align-items: flex-end; gap: var(--spacing-sm); }

    .metric-value {
      font-size: var(--font-size-3xl);
      font-weight: 900;
      color: var(--color-success);
      line-height: 1;
      font-family: var(--font-heading);
    }

    .metric-sub {
      font-size: var(--font-size-xs);
      font-weight: bold;
      color: var(--text-primary);
      opacity: 0.8;
      margin-bottom: 4px;
    }

    .progress-track {
      width: 100%;
      height: 6px;
      background: rgba(0,0,0,0.1);
      border-radius: 99px;
      margin-top: var(--spacing-md);
      overflow: hidden;
    }
    .progress-fill.success {
      background: var(--color-success);
      height: 100%;
    }

    /* ACTION BOX (Warning/Recovery Style) */
    .action-box {
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius-lg);
      border: 1px dashed var(--color-warning-border);
      background: var(--color-warning-bg);
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
    }

    .action-header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
    .action-icon { color: var(--color-warning); }
    .action-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--color-warning); }

    .action-text {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }
    .highlight { font-weight: bold; color: var(--text-primary); }
    .sub-text { font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; margin-top: var(--spacing-sm); }

    .action-btn {
      margin-top: var(--spacing-lg);
      width: 100%;
      padding: var(--spacing-sm);
      border-radius: var(--ui-border-radius);
      background: rgba(249, 115, 22, 0.1); /* Orange tint */
      border: 1px solid rgba(249, 115, 22, 0.3);
      color: var(--color-warning);
      font-size: var(--font-size-xs);
      font-weight: bold;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover { background: rgba(249, 115, 22, 0.2); transform: translateY(-1px); }

    /* LOADER */
    .loader-container {
      height: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text {
      font-size: var(--font-size-xs);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
    }
  `]
})
export class OrderFunnelChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(true);
  chartOptions: any;

  // Cache document style for theme variable reading
  private documentStyle = getComputedStyle(document.documentElement);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.initOptions(); // Init options early
    this.loadFunnel();
  }

  // --- Helper Methods ---

  getConversionRate(index: number): string {
    const data = this.chartData()?.datasets[0]?.data;
    if (!data || !data[0]) return '0';
    const val = data[index] || 0;
    return ((val / data[0]) * 100).toFixed(0);
  }

  getUnpaidCount(): number {
    const data = this.chartData()?.datasets[0]?.data;
    if (!data) return 0;
    return (data[1] || 0) + (data[2] || 0); // 1=Unpaid, 2=Partial
  }

  getRecoveryPotential(): string {
    const data = this.chartData()?.datasets[0]?.data;
    if (!data || !data[0]) return '0';
    const stuckOrders = (data[1] || 0) + (data[2] || 0);
    return ((stuckOrders / data[0]) * 100).toFixed(1);
  }

  // --- Chart Configuration ---

  private initOptions() {
    // Read theme colors
    const textColor = this.documentStyle.getPropertyValue('--text-secondary').trim();
    const tooltipBg = this.documentStyle.getPropertyValue('--bg-ternary').trim();
    const tooltipText = this.documentStyle.getPropertyValue('--text-primary').trim();
    const borderColor = this.documentStyle.getPropertyValue('--border-primary').trim();

    this.chartOptions = {
      indexAxis: 'y', // Horizontal bars
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: textColor,
          borderColor: borderColor,
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
          ticks: { display: false }
        },
        y: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: textColor,
            font: { size: 11, weight: '700', family: 'var(--font-body)' },
            padding: 10
          }
        }
      },
      animation: { duration: 1000, easing: 'easeOutQuart' },
      layout: { padding: { left: 0, right: 20, top: 0, bottom: 0 } }
    };
  }

  loadFunnel() {
    this.loading.set(true);
    // Re-fetch theme styles in case of theme switch
    this.documentStyle = getComputedStyle(document.documentElement);
    this.initOptions();

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
    // Dynamic Theme Colors
    const primary = this.documentStyle.getPropertyValue('--accent-primary').trim();
    const warning = this.documentStyle.getPropertyValue('--color-warning').trim();
    const error = this.documentStyle.getPropertyValue('--color-error').trim(); // Or Orange
    const success = this.documentStyle.getPropertyValue('--color-success').trim();

    // 0: Total (Primary), 1: Unpaid (Error/Orange), 2: Partial (Warning), 3: Completed (Success)
    const backgroundColors = [primary, error, warning, success];

    this.chartData.set({
        labels: data.labels,
        datasets: [{
            ...data.datasets[0],
            backgroundColor: backgroundColors,
            hoverBackgroundColor: backgroundColors, // Or add opacity logic
            borderRadius: 6,
            barThickness: 25, 
            borderSkipped: false
        }]
    });
  }
}
