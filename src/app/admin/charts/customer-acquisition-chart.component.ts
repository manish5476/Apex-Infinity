import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';

Chart.register(...registerables);

@Component({
  selector: 'app-customer-acquisition-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
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
            <h3 class="card-title">Customer Acquisition</h3>
            <p class="card-subtitle">New vs cumulative customers</p>
          </div>
        </div>
        <!-- KPI row -->
        <div class="kpi-chips" *ngIf="!isLoading && !hasError">
          <div class="kpi-chip accent">
            <span class="kpi-label">Total Customers</span>
            <span class="kpi-value">{{ totalCustomers }}</span>
          </div>
          <div class="kpi-chip">
            <span class="kpi-label">Peak Month</span>
            <span class="kpi-value">{{ peakMonth }}</span>
          </div>
        </div>
      </div>

      <div class="state-overlay" *ngIf="isLoading">
        <div class="spinner"></div><span>Loading...</span>
      </div>
      <div class="state-overlay error" *ngIf="hasError && !isLoading">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Failed to load</span>
        <button class="retry-btn" (click)="loadData()">Retry</button>
      </div>

      <div class="chart-area" *ngIf="!isLoading && !hasError">
        <canvas #acqCanvas></canvas>
      </div>

      <!-- Monthly Breakdown mini -->
      <div class="monthly-strip" *ngIf="!isLoading && !hasError && monthlyNew.length">
        <div class="month-cell" *ngFor="let m of monthlyNew; let i = index"
          [class.has-data]="m.value > 0" [title]="m.label + ': ' + m.value">
          <div class="month-bar" [style.height.%]="m.pct" [style.background]="m.value > 0 ? '#FFA726' : 'var(--border-primary)'"></div>
          <span class="month-label">{{ m.label.slice(0,1) }}</span>
        </div>
      </div>
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
      background: color-mix(in srgb, #FFA726 12%, transparent 88%);
      color: #FFA726; display: flex; align-items: center; justify-content: center;
    }
    .card-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
    .card-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }
    .kpi-chips { display: flex; gap: var(--spacing-sm); }
    .kpi-chip {
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius); padding: var(--spacing-xs) var(--spacing-md);
      display: flex; flex-direction: column; gap: 1px; min-width: 90px;
      &.accent { border-color: color-mix(in srgb, #42A5F5 30%, transparent 70%); background: color-mix(in srgb, #42A5F5 8%, var(--bg-primary) 92%); }
    }
    .kpi-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }
    .kpi-value { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .chart-area {
      height: 240px;
      canvas { width: 100% !important; height: 100% !important; }
    }

    /* Monthly mini bars */
    .monthly-strip {
      display: flex; gap: 4px; margin-top: var(--spacing-lg);
      height: 48px; align-items: flex-end; padding: 0 2px;
    }
    .month-cell {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      gap: 3px; height: 100%; justify-content: flex-end;
      cursor: default; position: relative;
      &.has-data .month-label { color: var(--text-primary); font-weight: var(--font-weight-semibold); }
    }
    .month-bar {
      width: 100%; min-height: 2px; border-radius: 2px 2px 0 0;
      transition: height 0.4s ease;
    }
    .month-label { font-size: 9px; color: var(--text-tertiary); line-height: 1; }

    .state-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--spacing-sm);
      min-height: 240px; color: var(--text-tertiary); font-size: var(--font-size-sm);
      &.error { color: var(--color-error); }
    }
    .spinner {
      width: 28px; height: 28px; border: 2px solid var(--border-primary);
      border-top-color: #FFA726; border-radius: 50%;
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
export class CustomerAcquisitionChartComponent implements OnInit, OnDestroy {
  @ViewChild('acqCanvas') acqCanvas!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private chart?: Chart;

  isLoading = true;
  hasError = false;
  totalCustomers = 0;
  peakMonth = '—';
  monthlyNew: { label: string; value: number; pct: number }[] = [];

  constructor(private chartService: ChartService) { }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.chartService.getCustomerAcquisition()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.data;
          const newDs = data.datasets.find((d: any) => d.label?.includes('New'));
          const cumDs = data.datasets.find((d: any) => d.label?.includes('Cumulative'));
          this.totalCustomers = cumDs ? Math.max(...cumDs.data) : 0;
          const newData: number[] = newDs?.data ?? [];
          const maxNew = Math.max(...newData) || 1;
          const peakIdx = newData.indexOf(Math.max(...newData));
          this.peakMonth = newData.some(v => v > 0) ? data.labels[peakIdx] : '—';
          this.monthlyNew = data.labels.map((label: string, i: number) => ({
            label,
            value: newData[i] ?? 0,
            pct: Math.round(((newData[i] ?? 0) / maxNew) * 100)
          }));
          this.isLoading = false;
          setTimeout(() => this.renderChart(data), 50);
        },
        error: () => { this.isLoading = false; this.hasError = true; }
      });
  }

  renderChart(data: any): void {
    if (!this.acqCanvas) return;
    this.chart?.destroy();
    const ctx = this.acqCanvas.nativeElement.getContext('2d')!;
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
            ticks: { color: 'var(--text-tertiary)', font: { size: 10 }, stepSize: 5 }
          },
          y1: {
            position: 'right', grid: { display: false },
            ticks: { color: 'var(--text-tertiary)', font: { size: 10 } }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'var(--text-secondary)', padding: 16, font: { size: 11, weight: 500 }, usePointStyle: true, pointStyleWidth: 8 }
          }
        }
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); this.chart?.destroy(); }
}
