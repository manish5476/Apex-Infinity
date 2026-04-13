import { signal, Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-aov-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </span>
          <div>
            <h3 class="card-title">Avg Order Value</h3>
            <p class="card-subtitle">Monthly AOV vs order count</p>
          </div>
        </div>
        <!-- KPI chips -->
        @if (!isLoading() && !hasError()) {
          <div class="kpi-chips">
            <div class="kpi-chip">
              <span class="kpi-label">Peak AOV</span>
              <span class="kpi-value">₹{{ peakAov() | number }}</span>
            </div>
            <div class="kpi-chip">
              <span class="kpi-label">Total Orders</span>
              <span class="kpi-value">{{ totalOrders() }}</span>
            </div>
          </div>
        }
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
    
      @if (!isLoading() && !hasError()) {
        <div class="chart-area">
          <canvas #aovCanvas></canvas>
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
      gap: var(--spacing-md); margin-bottom: var(--spacing-xl); flex-wrap: wrap;
    }
    .card-title-group { display: flex; align-items: center; gap: var(--spacing-md); }
    .card-icon {
      width: 36px; height: 36px; border-radius: var(--ui-border-radius);
      background: color-mix(in srgb, #AB47BC 12%, transparent 88%);
      color: #AB47BC; display: flex; align-items: center; justify-content: center;
    }
    .card-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
    .card-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }
    .kpi-chips { display: flex; gap: var(--spacing-sm); }
    .kpi-chip {
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius); padding: var(--spacing-xs) var(--spacing-md);
      display: flex; flex-direction: column; gap: 1px; min-width: 90px;
    }
    .kpi-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }
    .kpi-value { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .chart-area {
      height: 260px;
      canvas { width: 100% !important; height: 100% !important; }
    }
    .state-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--spacing-sm);
      min-height: 260px; color: var(--text-tertiary); font-size: var(--font-size-sm);
      &.error { color: var(--color-error); }
    }
    .spinner {
      width: 28px; height: 28px; border: 2px solid var(--border-primary);
      border-top-color: #AB47BC; border-radius: 50%;
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
export class AovTrendChartComponent implements OnInit, OnDestroy {
  @ViewChild('aovCanvas') aovCanvas!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private chart?: Chart;

  isLoading = signal(true);
  hasError = signal(false);
  peakAov = signal(0);
  totalOrders = signal(0);

  constructor(private chartService: ChartService) { }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    this.chartService.getAOVTrend()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.data;
          const aovDs = data.datasets.find((d: any) => d.type === 'line');
          const cntDs = data.datasets.find((d: any) => d.type === 'bar');
          this.peakAov.set(aovDs ? Math.max(...aovDs.data) : 0);
          this.totalOrders.set(cntDs ? cntDs.data.reduce((a: number, b: number) => a + b, 0) : 0);
          this.isLoading.set(false);
          
          setTimeout(() => this.renderChart(data), 50);
        },
        error: () => { 
          this.isLoading.set(false); 
          this.hasError.set(true); 
          
        }
      });
  }

  renderChart(data: any): void {
    if (!this.aovCanvas) return;
    this.chart?.destroy();
    const ctx = this.aovCanvas.nativeElement.getContext('2d')!;
    this.chart = new Chart(ctx, {
      data: {
        labels: data.labels,
        datasets: data.datasets.map((ds: any) => ({
          ...ds,
          ...(ds.type === 'bar' ? { borderRadius: 4, borderSkipped: false } : {}),
          ...(ds.type === 'line' ? { pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: ds.borderColor } : {})
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { display: false }, ticks: { color: 'var(--text-tertiary)', font: { size: 11 } } },
          y: {
            position: 'left',
            grid: { color: 'var(--border-secondary, rgba(0,0,0,0.06))' },
            ticks: {
              color: 'var(--text-tertiary)', font: { size: 10 },
              callback: (v: any) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`
            }
          },
          y1: {
            position: 'right', grid: { display: false },
            ticks: { color: 'var(--text-tertiary)', font: { size: 10 }, stepSize: 1 }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'var(--text-secondary)', padding: 16, font: { size: 11, weight: 500 }, usePointStyle: true, pointStyleWidth: 8 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const y = ctx.parsed.y ?? 0;
                return ctx.dataset.type === 'line'
                  ? ` AOV: ₹${y.toLocaleString('en-IN')}`
                  : ` Orders: ${y}`;
              }
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); this.chart?.destroy(); }
}
