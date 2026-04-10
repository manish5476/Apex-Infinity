import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-emi-portfolio-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
    
      <!-- Header -->
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </span>
          <div>
            <h3 class="card-title">EMI Portfolio</h3>
            <p class="card-subtitle">Instalment status snapshot</p>
          </div>
        </div>
      </div>
    
      <!-- Loading -->
      @if (isLoading) {
        <div class="state-overlay">
          <div class="spinner"></div><span>Loading...</span>
        </div>
      }
    
      <!-- Error -->
      @if (hasError && !isLoading) {
        <div class="state-overlay error">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Failed to load</span>
          <button class="retry-btn" (click)="loadData()">Retry</button>
        </div>
      }
    
      @if (!isLoading && !hasError && data) {
        <!-- KPI Row -->
        <div class="kpi-row">
          <div class="kpi-card primary">
            <div class="kpi-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Portfolio Value</span>
              <span class="kpi-value">₹{{ data.summary.totalPortfolioValue | number }}</span>
            </div>
          </div>
          <div class="kpi-card" [class.danger]="data.summary.overdueInstallments > 0">
            <div class="kpi-icon overdue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Overdue Instalments</span>
              <span class="kpi-value overdue-val">{{ data.summary.overdueInstallments }}</span>
            </div>
          </div>
          <div class="kpi-card" [class.danger]="data.summary.overdueAmount > 0">
            <div class="kpi-icon overdue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Overdue Amount</span>
              <span class="kpi-value overdue-val">₹{{ data.summary.overdueAmount | number }}</span>
            </div>
          </div>
        </div>
        <!-- Chart + Legend row -->
        <div class="chart-row">
          <!-- Doughnut -->
          <div class="doughnut-wrap">
            <canvas #emiCanvas></canvas>
            <!-- Centre label -->
            <div class="doughnut-centre">
              <span class="centre-count">{{ totalCount }}</span>
              <span class="centre-label">Contracts</span>
            </div>
          </div>
          <!-- Status breakdown list -->
          <div class="breakdown-list">
            @for (item of metaList; track item) {
              <div class="breakdown-item">
                <div class="bi-dot" [style.background]="item.color"></div>
                <div class="bi-info">
                  <span class="bi-label">{{ item.label | titlecase }}</span>
                  <span class="bi-count">{{ item.count }} contracts</span>
                </div>
                <div class="bi-amount">₹{{ item.totalAmount | number }}</div>
              </div>
            }
          </div>
        </div>
        <!-- Health Banner -->
        <div class="health-banner" [class.good]="data.summary.overdueInstallments === 0" [class.warn]="data.summary.overdueInstallments > 0">
          @if (data.summary.overdueInstallments === 0) {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
          @if (data.summary.overdueInstallments > 0) {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
          @if (data.summary.overdueInstallments === 0) {
            <span>Portfolio is healthy — no overdue instalments</span>
          }
          @if (data.summary.overdueInstallments > 0) {
            <span>
              {{ data.summary.overdueInstallments }} overdue instalment(s) totalling ₹{{ data.summary.overdueAmount | number }}
            </span>
          }
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
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent 88%);
      color: var(--accent-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .card-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
    .card-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }

    /* KPI Row */
    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
    .kpi-card {
      display: flex; align-items: center; gap: var(--spacing-md);
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius); padding: var(--spacing-md);
      &.primary { border-color: color-mix(in srgb, var(--accent-primary) 30%, transparent 70%); background: color-mix(in srgb, var(--accent-primary) 6%, var(--bg-primary) 94%); }
      &.danger { border-color: color-mix(in srgb, #EF5350 30%, transparent 70%); background: color-mix(in srgb, #EF5350 6%, var(--bg-primary) 94%); }
    }
    .kpi-icon {
      width: 32px; height: 32px; border-radius: var(--ui-border-radius-sm);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent 88%);
      color: var(--accent-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      &.overdue { background: color-mix(in srgb, #EF5350 12%, transparent 88%); color: #EF5350; }
    }
    .kpi-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .kpi-label { font-size: var(--font-size-xs); color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-value { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .overdue-val { color: #EF5350; }

    /* Chart row */
    .chart-row { display: flex; gap: var(--spacing-xl); align-items: center; margin-bottom: var(--spacing-lg); }
    .doughnut-wrap { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
    .doughnut-wrap canvas { width: 100% !important; height: 100% !important; }
    .doughnut-centre {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center; pointer-events: none;
    }
    .centre-count { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--text-primary); line-height: 1; }
    .centre-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }

    /* Breakdown */
    .breakdown-list { flex: 1; display: flex; flex-direction: column; gap: var(--spacing-sm); }
    .breakdown-item {
      display: flex; align-items: center; gap: var(--spacing-md);
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius); padding: var(--spacing-sm) var(--spacing-md);
      transition: var(--transition-fast);
      &:hover { box-shadow: var(--elevation-1); }
    }
    .bi-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .bi-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
    .bi-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
    .bi-count { font-size: var(--font-size-xs); color: var(--text-tertiary); }
    .bi-amount { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); white-space: nowrap; }

    /* Health banner */
    .health-banner {
      display: flex; align-items: center; gap: var(--spacing-sm);
      border-radius: var(--ui-border-radius); padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
      &.good { background: color-mix(in srgb, #66BB6A 10%, transparent 90%); color: #388E3C; border: 1px solid color-mix(in srgb, #66BB6A 25%, transparent 75%); }
      &.warn { background: color-mix(in srgb, #EF5350 10%, transparent 90%); color: #C62828; border: 1px solid color-mix(in srgb, #EF5350 25%, transparent 75%); }
    }

    /* States */
    .state-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--spacing-sm); min-height: 220px;
      color: var(--text-tertiary); font-size: var(--font-size-sm);
      &.error { color: var(--color-error); }
    }
    .spinner {
      width: 28px; height: 28px; border: 2px solid var(--border-primary);
      border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .retry-btn {
      padding: var(--spacing-xs) var(--spacing-lg); border: 1px solid var(--color-error);
      border-radius: var(--ui-border-radius-pill); background: transparent;
      color: var(--color-error); font-size: var(--font-size-xs); cursor: pointer;
    }
  `]
})
export class EmiPortfolioChartComponent implements OnInit, OnDestroy {
  @ViewChild('emiCanvas') emiCanvas!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private chart?: Chart;

  isLoading = true;
  hasError = false;
  data: any = null;
  metaList: { label: string; count: number; totalAmount: number; color: string }[] = [];
  totalCount = 0;

  constructor(private chartService: ChartService) { }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.chartService.getEmiPortfolioStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.data = res.data;
          const sb = res.data.statusBreakdown;
          const colors = sb.datasets[0]?.backgroundColor ?? [];
          this.metaList = (sb._meta || []).map((m: any, i: number) => ({
            label: m._id,
            count: m.count,
            totalAmount: m.totalAmount,
            color: colors[i] ?? '#42A5F5'
          }));
          this.totalCount = this.metaList.reduce((s, m) => s + m.count, 0);
          this.isLoading = false;
          setTimeout(() => this.renderChart(sb), 50);
        },
        error: () => { this.isLoading = false; this.hasError = true; }
      });
  }

  renderChart(sb: any): void {
    if (!this.emiCanvas) return;
    this.chart?.destroy();
    const ctx = this.emiCanvas.nativeElement.getContext('2d')!;
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sb.labels,
        datasets: sb.datasets.map((ds: any) => ({
          ...ds,
          borderWidth: 2,
          borderColor: 'var(--bg-primary, #fff)',
          hoverOffset: 8
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const meta = this.metaList[ctx.dataIndex];
                return meta ? [`  ${meta.count} contracts`, `  ₹${meta.totalAmount.toLocaleString('en-IN')}`] : '';
              }
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); this.chart?.destroy(); }
}
