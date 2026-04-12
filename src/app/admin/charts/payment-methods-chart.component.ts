import { signal, Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-payment-methods-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="chart-card payment-methods-card">

  <!-- Header -->
  <div class="card-header">
    <div class="card-title-group">
      <span class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      </span>
      <div>
        <h3 class="card-title">Payment Methods</h3>
        <p class="card-subtitle">Revenue by collection mode</p>
      </div>
    </div>

    <!-- Tab Toggle -->
    <div class="tab-toggle">
      <button class="tab-btn" [class.active]="activeTab() === 'pie'" (click)="setTab('pie')">Split</button>
      <button class="tab-btn" [class.active]="activeTab() === 'trend'" (click)="setTab('trend')">Trend</button>
    </div>
  </div>

  <!-- Loading -->
  @if (isLoading()) {
    <div class="state-overlay">
      <div class="spinner"></div>
      <span>Loading...</span>
    </div>
  }

  <!-- Error -->
  @if (hasError() && !isLoading()) {
    <div class="state-overlay error">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Failed to load data</span>
      <button class="retry-btn" (click)="loadData()">Retry</button>
    </div>
  }

  <!-- Content -->
  @if (!isLoading() && !hasError()) {
    <!-- Total Badge -->
    <div class="total-badge">
      <span class="total-label">Total Revenue</span>
      <span class="total-value">₹{{ totalRevenue() | number }}</span>
    </div>
    <!-- Charts -->
    <div class="chart-area" [class.hidden]="activeTab() !== 'pie'">
      <canvas #pieCanvas></canvas>
    </div>
    <div class="chart-area" [class.hidden]="activeTab() !== 'trend'">
      <canvas #trendCanvas></canvas>
    </div>
    <!-- Meta Table -->
    @if (activeTab() === 'pie' && metaList().length) {
      <div class="meta-list">
        @for (item of metaList(); track item) {
          <div class="meta-row">
            <span class="meta-label">{{ item.label | titlecase }}</span>
            <span class="meta-count">{{ item.count }} txns</span>
            <span class="meta-value">₹{{ item.value | number }}</span>
          </div>
        }
      </div>
    }
  }
</div>
`,
  styles: `@use 'sass:color';

.chart-card {
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  box-shadow: var(--elevation-1);
  transition: var(--transition-base);

  &:hover {
    box-shadow: var(--elevation-2);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--ui-border-radius);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent 88%);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.card-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 2px 0 0;
}

/* Tab Toggle */
.tab-toggle {
  display: flex;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-pill);
  padding: 2px;
  gap: 2px;
}

.tab-btn {
  padding: 4px 14px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--ui-border-radius-pill);
  cursor: pointer;
  color: var(--text-tertiary);
  background: transparent;
  transition: var(--transition-fast);

  &.active {
    background: var(--accent-primary);
    color: #fff;
  }

  &:hover:not(.active) {
    color: var(--text-primary);
    background: var(--bg-hover);
  }
}

/* Total Badge */
.total-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: color-mix(in srgb, var(--accent-primary) 8%, transparent 92%);
  border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent 80%);
  border-radius: var(--ui-border-radius);
  padding: var(--spacing-sm) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.total-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
}

.total-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
}

/* Chart Area */
.chart-area {
  height: 240px;
  position: relative;
  transition: opacity 0.2s ease;

  &.hidden {
    display: none;
  }

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

/* Meta List */
.meta-list {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--ui-border-radius-sm);
  transition: var(--transition-fast);

  &:hover {
    background: var(--bg-hover);
  }
}

.meta-label {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.meta-count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.meta-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  min-width: 90px;
  text-align: right;
}

/* States */
.state-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  min-height: 220px;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);

  &.error {
    color: var(--color-error);
  }
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-lg);
  border: 1px solid var(--color-error);
  border-radius: var(--ui-border-radius-pill);
  background: transparent;
  color: var(--color-error);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: var(--color-error-bg);
  }
}`
})
export class PaymentMethodsChartComponent implements OnInit, OnDestroy {
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private pieChart?: Chart;
  private trendChart?: Chart;

  isLoading = signal(true);
  hasError = signal(false);
  activeTab = signal<'pie' | 'trend'>('pie');

  pieData = signal<any>(null);
  trendData = signal<any>(null);
  metaList = signal<any[]>([]);
  totalRevenue = signal(0);

  constructor(private chartService: ChartService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.chartService.getPaymentMethodBreakdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.pieData.set(res.data.pie);
          this.trendData.set(res.data.trend);
          this.metaList.set(res.data.pie._meta || []);
          this.totalRevenue.set(this.metaList().reduce((sum: number, m: any) => sum + m.value, 0));
          this.isLoading.set(false);
          setTimeout(() => this.renderCharts(), 50);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        }
      });
  }

  renderCharts(): void {
    this.renderPie();
    this.renderTrend();
  }

  renderPie(): void {
    if (!this.pieCanvas || !this.pieData()) return;
    this.pieChart?.destroy();
    const ctx = this.pieCanvas.nativeElement.getContext('2d')!;
    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.pieData().labels,
        datasets: this.pieData().datasets.map((ds: any) => ({
          ...ds,
          borderWidth: 2,
          borderColor: 'var(--bg-primary, #fff)',
          hoverOffset: 8
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'var(--text-secondary, #6b7280)',
              padding: 16,
              font: { size: 12, weight: 500 },
              usePointStyle: true,
              pointStyleWidth: 8
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                if (val === null || val === undefined) return '';
                return ` ₹${val.toLocaleString('en-IN')}`;
              }
            }
          }
        }
      }
    });
  }

  renderTrend(): void {
    if (!this.trendCanvas || !this.trendData()) return;
    this.trendChart?.destroy();
    const ctx = this.trendCanvas.nativeElement.getContext('2d')!;
    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.trendData().labels,
        datasets: this.trendData().datasets.map((ds: any) => ({
          ...ds,
          borderRadius: 4,
          borderSkipped: false
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: 'var(--text-tertiary, #9ca3af)', font: { size: 11 } }
          },
          y: {
            stacked: true,
            grid: { color: 'var(--border-secondary, rgba(0,0,0,0.06))' },
            ticks: {
              color: 'var(--text-tertiary, #9ca3af)',
              font: { size: 11 },
              callback: (v: any) => `₹${(v / 1000).toFixed(0)}K`
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'var(--text-secondary, #6b7280)',
              padding: 16,
              font: { size: 12, weight: 500 },
              usePointStyle: true,
              pointStyleWidth: 8
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y;
                if (val === null || val === undefined) return '';
                return ` ₹${val.toLocaleString('en-IN')}`;
              }
            }
          }
        }
      }
    });
  }

  setTab(tab: 'pie' | 'trend'): void {
    this.activeTab.set(tab);
    setTimeout(() => {
      if (tab === 'pie') this.renderPie();
      else this.renderTrend();
    }, 50);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pieChart?.destroy();
    this.trendChart?.destroy();
  }
}
