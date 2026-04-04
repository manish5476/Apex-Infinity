import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService, TopPerformersQuery } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-top-performers-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="chart-card top-performers-card">

  <!-- Header -->
  <div class="card-header">
    <div class="card-title-group">
      <span class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      </span>
      <div>
        <h3 class="card-title">Top {{ typeLabel }}</h3>
        <p class="card-subtitle">By units sold &amp; revenue</p>
      </div>
    </div>

    <!-- Rank badge -->
    <div class="rank-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      Top {{ limit }}
    </div>
  </div>

  <!-- Loading -->
  <div class="state-overlay" *ngIf="isLoading">
    <div class="spinner"></div>
    <span>Loading...</span>
  </div>

  <!-- Error -->
  <div class="state-overlay error" *ngIf="hasError && !isLoading">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>Failed to load data</span>
    <button class="retry-btn" (click)="loadData()">Retry</button>
  </div>

  <!-- Content -->
  <ng-container *ngIf="!isLoading && !hasError">

    <!-- Bar Chart -->
    <div class="chart-area">
      <canvas #barCanvas></canvas>
    </div>

    <!-- Meta Table -->
    <div class="meta-table" *ngIf="metaList.length">
      <div class="meta-header">
        <span class="col-rank">#</span>
        <span class="col-name">Product</span>
        <span class="col-units">Units</span>
        <span class="col-revenue">Revenue</span>
      </div>
      <div class="meta-row" *ngFor="let item of metaList; let i = index">
        <span class="col-rank">
          <span class="rank-num" [class.gold]="i === 0" [class.silver]="i === 1" [class.bronze]="i === 2">
            {{ i + 1 }}
          </span>
        </span>
        <span class="col-name" [title]="item.label">{{ item.label }}</span>
        <span class="col-units">{{ item.value }}</span>
        <span class="col-revenue">₹{{ item.revenue | number }}</span>
      </div>
    </div>

  </ng-container>
</div>`,
  styles: `.chart-card {
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  box-shadow: var(--elevation-1);
  transition: var(--transition-base);

  &:hover { box-shadow: var(--elevation-2); }
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
  background: color-mix(in srgb, var(--color-success) 12%, transparent 88%);
  color: var(--color-success);
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

/* Rank Badge */
.rank-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #f59e0b;
  background: color-mix(in srgb, #f59e0b 10%, transparent 90%);
  border: 1px solid color-mix(in srgb, #f59e0b 25%, transparent 75%);
  border-radius: var(--ui-border-radius-pill);
  padding: 4px 12px 4px 8px;

  svg { color: #f59e0b; }
}

/* Chart Area */
.chart-area {
  height: 260px;
  position: relative;
  margin-bottom: var(--spacing-lg);

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

/* Meta Table */
.meta-table {
  border: 1px solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  overflow: hidden;
}

.meta-header,
.meta-row {
  display: grid;
  grid-template-columns: 32px 1fr 60px 100px;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

.meta-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meta-row {
  border-bottom: 1px solid var(--border-primary);
  transition: var(--transition-fast);

  &:last-child { border-bottom: none; }
  &:hover { background: var(--bg-hover); }
}

.col-rank { display: flex; justify-content: center; }

.rank-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--bg-primary);
  color: var(--text-tertiary);
  border: 1px solid var(--border-primary);

  &.gold   { background: #fef3c7; color: #b45309; border-color: #fcd34d; }
  &.silver { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
  &.bronze { background: #fef2ee; color: #9a3412; border-color: #fdba74; }
}

.col-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-units {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  text-align: right;
}

.col-revenue {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--accent-primary);
  text-align: right;
}

/* States */
.state-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  min-height: 260px;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);

  &.error { color: var(--color-error); }
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.retry-btn {
  padding: var(--spacing-xs) var(--spacing-lg);
  border: 1px solid var(--color-error);
  border-radius: var(--ui-border-radius-pill);
  background: transparent;
  color: var(--color-error);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover { background: var(--color-error-bg); }
}`
})
export class TopPerformersChartComponent implements OnInit, OnDestroy {
  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() type: TopPerformersQuery['type'] = 'products';
  @Input() limit = 5;

  private destroy$ = new Subject<void>();
  private barChart?: Chart;

  isLoading = true;
  hasError = false;

  chartData: any = null;
  metaList: any[] = [];
  activeMetric: 'units' | 'revenue' = 'revenue';

  constructor(private chartService: ChartService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.chartService.getTopPerformers({ type: this.type, limit: this.limit })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.chartData = res.data;
          this.metaList = res.data._meta || [];
          this.isLoading = false;
          setTimeout(() => this.renderChart(), 50);
        },
        error: () => {
          this.isLoading = false;
          this.hasError = true;
        }
      });
  }

  renderChart(): void {
    if (!this.barCanvas || !this.chartData) return;
    this.barChart?.destroy();
    const ctx = this.barCanvas.nativeElement.getContext('2d')!;

    // Truncate long labels for display
    const labels = this.chartData.labels.map((l: string) =>
      l.length > 18 ? l.substring(0, 16) + '…' : l
    );

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: this.chartData.datasets.map((ds: any) => ({
          ...ds,
          borderRadius: 5,
          borderSkipped: false,
          barPercentage: 0.65,
          categoryPercentage: 0.75
        }))
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'var(--border-secondary, rgba(0,0,0,0.06))' },
            ticks: {
              color: 'var(--text-tertiary, #9ca3af)',
              font: { size: 11 },
              callback: (v: any) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `${v}`
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: 'var(--text-secondary, #6b7280)',
              font: { size: 11, weight: 500 }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: 'var(--text-secondary, #6b7280)',
              padding: 16,
              font: { size: 11, weight: 500 },
              usePointStyle: true,
              pointStyleWidth: 8
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.x;
                return ctx.dataset.label === 'Revenue'
                  ? ` Revenue: ₹${val?.toLocaleString('en-IN')}`
                  : ` Units Sold: ${val}`;
              }
            }
          }
        }
      }
    });
  }

  get typeLabel(): string {
    const map: Record<string, string> = {
      products: 'Products',
      customers: 'Customers',
      branches: 'Branches',
      staff: 'Staff Members'
    };
    return map[this.type ?? 'products'] ?? 'Items';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.barChart?.destroy();
  }
}
