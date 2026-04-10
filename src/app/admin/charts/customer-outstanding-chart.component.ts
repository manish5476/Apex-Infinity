import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-customer-outstanding-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="chart-card customer-outstanding-card">

  <!-- Header -->
  <div class="card-header">
    <div class="card-title-group">
      <span class="card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </span>
      <div>
        <h3 class="card-title">Customer Outstanding</h3>
        <p class="card-subtitle">Top credit exposure by balance</p>
      </div>
    </div>
  </div>

  <!-- Loading -->
  @if (isLoading) {
    <div class="state-overlay">
      <div class="spinner"></div>
      <span>Loading balances...</span>
    </div>
  }

  <!-- Error -->
  @if (hasError && !isLoading) {
    <div class="state-overlay error">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Failed to load data</span>
      <button class="retry-btn" (click)="loadData()">Retry</button>
    </div>
  }

  <!-- Content -->
  @if (!isLoading && !hasError) {
    <!-- Summary Badge -->
    <div class="total-badge">
      <span class="total-label">Total Outstanding</span>
      <span class="total-value">₹{{ totalAmount | number:'1.0-0' }}</span>
    </div>
    <!-- Chart Area -->
    <div class="chart-area">
      <canvas #chartCanvas></canvas>
    </div>
    <!-- Meta List -->
    @if (metaList.length) {
      <div class="meta-list">
        @for (item of metaList; track item) {
          <div class="meta-row">
            <div class="meta-info">
              <span class="meta-label">{{ item.name }}</span>
              <span class="meta-sub">{{ item.phone || 'No phone' }}</span>
            </div>
            <div class="meta-stats">
              <span class="meta-value">₹{{ item.outstandingBalance | number:'1.0-0' }}</span>
              @if (item.creditLimit) {
                <span class="meta-limit">Limit: ₹{{ item.creditLimit | number:'1.0-0' }}</span>
              }
            </div>
          </div>
        }
      </div>
    }
  }
</div>
`,
  styles: [`
.chart-card {
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
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--spacing-md); margin-bottom: var(--spacing-xl);
}

.card-title-group { display: flex; align-items: center; gap: var(--spacing-md); }

.card-icon {
  width: 36px; height: 36px; border-radius: var(--ui-border-radius);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent 88%);
  color: var(--accent-primary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.card-title {
  font-size: var(--font-size-md); font-weight: var(--font-weight-semibold);
  color: var(--text-primary); margin: 0; line-height: var(--line-height-tight);
}

.card-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }

.total-badge {
  display: flex; align-items: center; justify-content: space-between;
  background: color-mix(in srgb, #FFA726 8%, transparent 92%);
  border: 1px solid color-mix(in srgb, #FFA726 20%, transparent 80%);
  border-radius: var(--ui-border-radius);
  padding: var(--spacing-sm) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.total-label { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-medium); }
.total-value { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: #F57C00; }

.chart-area {
  height: 260px; position: relative;
  canvas { width: 100% !important; height: 100% !important; }
}

.meta-list { margin-top: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-xs); }

.meta-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--ui-border-radius-sm);
  transition: var(--transition-fast);
  &:hover { background: var(--bg-hover); }
}

.meta-info { display: flex; flex-direction: column; gap: 1px; }
.meta-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
.meta-sub { font-size: 10px; color: var(--text-tertiary); }

.meta-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.meta-value { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.meta-limit { font-size: 9px; color: var(--text-tertiary); opacity: 0.8; }

.state-overlay {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--spacing-sm); min-height: 240px; color: var(--text-tertiary); font-size: var(--font-size-sm);
  &.error { color: var(--color-error); }
}

.spinner {
  width: 28px; height: 28px; border: 2px solid var(--border-primary);
  border-top-color: var(--accent-primary); border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.retry-btn {
  margin-top: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-lg);
  border: 1px solid var(--color-error); border-radius: var(--ui-border-radius-pill);
  background: transparent; color: var(--color-error); font-size: var(--font-size-xs);
  cursor: pointer; transition: var(--transition-fast);
  &:hover { background: var(--color-error-bg); }
}
  `],
})
export class CustomerOutstandingChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private chart?: Chart;

  isLoading = true;
  hasError = false;
  metaList: any[] = [];
  totalAmount = 0;
  chartData: any = null;

  constructor(private chartService: ChartService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.chartService.getCustomerOutstanding({ limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.chartData = res.data;
          this.metaList = res.data._meta || [];
          this.totalAmount = this.metaList.reduce((sum: number, m: any) => sum + (m.outstandingBalance || 0), 0);
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
    if (!this.chartCanvas || !this.chartData) return;
    this.chart?.destroy();

    const ctx = this.chartCanvas.nativeElement.getContext('2d')!;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartData.labels,
        datasets: this.chartData.datasets.map((ds: any) => ({
          ...ds,
          borderRadius: 4,
          maxBarThickness: 32,
          backgroundColor: ds.backgroundColor || '#FFA726',
          hoverBackgroundColor: '#FB8C00'
        }))
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'var(--border-secondary, rgba(0,0,0,0.06))' },
            ticks: {
              color: 'var(--text-tertiary, #9ca3af)',
              font: { size: 10 },
              callback: (v: any) => `₹${(v / 1000).toFixed(0)}K`
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: 'var(--text-secondary, #6b7280)',
              font: { size: 11, weight: 600 }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'var(--bg-primary, #fff)',
            titleColor: 'var(--text-primary, #111)',
            bodyColor: 'var(--text-secondary, #444)',
            borderColor: 'var(--border-primary, #eee)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.x;
                return ` Outstanding: ₹${val?.toLocaleString('en-IN')}`;
              }
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chart?.destroy();
  }
}
