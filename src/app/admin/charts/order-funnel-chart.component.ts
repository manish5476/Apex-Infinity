import { signal, Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-order-funnel-chart',
  standalone: true,
  imports: [],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </span>
          <div>
            <h3 class="card-title">Order Funnel</h3>
            <p class="card-subtitle">Pipeline conversion stages</p>
          </div>
        </div>
      </div>
    
      @if (isLoading()) {
        <div class="state-overlay">
          <div class="spinner"></div><span>Loading...</span>
        </div>
      }
      @if (hasError() && !isLoading()) {
        <div class="state-overlay error">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Failed to load</span>
          <button class="retry-btn" (click)="loadData()">Retry</button>
        </div>
      }
    
      @if (!isLoading() && !hasError() && chartData()) {
        <!-- Funnel Bars -->
        <div class="funnel-list">
          @for (step of funnelSteps(); track step; let i = $index) {
            <div class="funnel-step">
              <div class="step-meta">
                <div class="step-dot" [style.background]="step.color"></div>
                <span class="step-label">{{ step.label }}</span>
                <span class="step-value">{{ step.value }}</span>
                <span class="step-pct">{{ step.pct }}%</span>
              </div>
              <div class="step-bar-track">
                <div class="step-bar-fill"
                  [style.width]="step.pct + '%'"
                  [style.background]="step.color">
                </div>
              </div>
              @if (i < funnelSteps().length - 1) {
                <div class="step-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                  </svg>
                </div>
              }
            </div>
          }
        </div>
        <!-- Doughnut -->
        <div class="chart-area">
          <canvas #funnelCanvas></canvas>
        </div>
      }
    </div>
    `,
  styles: [`
    .chart-card {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--elevation-1);
      transition: var(--transition-base);
      &:hover { box-shadow: var(--elevation-2); }
    }
    .card-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--spacing-md); margin-bottom: var(--spacing-xl);
    }
    .card-title-group { display: flex; align-items: center; gap: var(--spacing-md); }
    .card-icon {
      width: 36px; height: 36px; border-radius: var(--ui-border-radius);
      background: color-mix(in srgb, var(--color-warning) 12%, transparent 88%);
      color: var(--color-warning); display: flex; align-items: center; justify-content: center;
    }
    .card-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
    .card-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }

    .funnel-list { display: flex; flex-direction: column; gap: var(--spacing-sm); margin-bottom: var(--spacing-lg); }
    .funnel-step { position: relative; }
    .step-meta {
      display: flex; align-items: center; gap: var(--spacing-sm);
      margin-bottom: 6px;
    }
    .step-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .step-label { flex: 1; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
    .step-value { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .step-pct { font-size: var(--font-size-xs); color: var(--text-tertiary); min-width: 36px; text-align: right; }
    .step-bar-track {
      height: 8px; background: var(--bg-primary); border-radius: var(--ui-border-radius-pill);
      overflow: hidden; border: 1px solid var(--border-primary);
    }
    .step-bar-fill {
      height: 100%; border-radius: var(--ui-border-radius-pill);
      transition: width 0.6s cubic-bezier(0.2, 0.9, 0.2, 1);
      opacity: 0.85;
    }
    .step-arrow {
      display: flex; justify-content: center; margin-top: 4px;
      color: var(--text-tertiary); opacity: 0.5;
    }

    .chart-area {
      height: 200px;
      canvas { width: 100% !important; height: 100% !important; }
    }

    .state-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--spacing-sm);
      min-height: 200px; color: var(--text-tertiary); font-size: var(--font-size-sm);
      &.error { color: var(--color-error); }
    }
    .spinner {
      width: 28px; height: 28px; border: 2px solid var(--border-primary);
      border-top-color: var(--accent-primary); border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .retry-btn {
      padding: var(--spacing-xs) var(--spacing-lg);
      border: 1px solid var(--color-error); border-radius: var(--ui-border-radius-pill);
      background: transparent; color: var(--color-error);
      font-size: var(--font-size-xs); cursor: pointer;
    }
  `]
})
export class OrderFunnelChartComponent implements OnInit, OnDestroy {
  @ViewChild('funnelCanvas') funnelCanvas!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private chart?: Chart;

  isLoading = signal(true);
  hasError = signal(false);
  chartData = signal<any>(null);
  funnelSteps = signal<{ label: string; value: number; color: string; pct: number }[]>([]);

  constructor(private chartService: ChartService) { }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.chartService.getOrderFunnel()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.chartData.set(res.data);
          const ds = res.data.datasets[0];
          const maxVal = Math.max(...ds.data) || 1;
          this.funnelSteps.set(res.data.labels.map((label: string, i: number) => ({
            label,
            value: ds.data[i],
            color: ds.backgroundColor[i],
            pct: Math.round((ds.data[i] / maxVal) * 100)
          })));
          this.isLoading.set(false);
          setTimeout(() => this.renderChart(), 50);
        },
        error: () => { this.isLoading.set(false); this.hasError.set(true); }
      });
  }

  renderChart(): void {
    if (!this.funnelCanvas || !this.chartData()) return;
    this.chart?.destroy();
    const ctx = this.funnelCanvas.nativeElement.getContext('2d')!;
    const ds = this.chartData().datasets[0];
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartData().labels,
        datasets: [{
          ...ds,
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: 'var(--text-tertiary)', font: { size: 10 } } },
          y: {
            grid: { color: 'var(--border-secondary, rgba(0,0,0,0.06))' },
            ticks: { color: 'var(--text-tertiary)', font: { size: 10 }, stepSize: 1 }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); this.chart?.destroy(); }
}
