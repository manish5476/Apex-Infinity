import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ChartService } from '../chart.service';

interface SummaryKpi {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
  prefix: string;
}

@Component({
  selector: 'app-financial-trend-chart',
  standalone: true,
  imports: [FormsModule, ChartModule, TooltipModule],
  template: `
<div class="ft-root">

  <!-- Decorative ambient layer -->
  <div class="ambient" aria-hidden="true">
    <div class="amb-circle amb-1"></div>
    <div class="amb-circle amb-2"></div>
    <div class="amb-grid"></div>
  </div>

  <!-- ── Header ── -->
  <div class="ft-header">
    <div class="header-left">
      <div class="title-badge">
        <i class="pi pi-wave-pulse"></i>
      </div>
      <div>
        <h2 class="ft-title">Financial Trend</h2>
        <p class="ft-subtitle">Income · Expense · Net Profit</p>
      </div>
    </div>

    <!-- Controls -->
    <div class="header-controls">

      <!-- Year selector -->
      <div class="control-group">
        <label class="control-label">Year</label>
        <div class="seg-control">
          @for (y of availableYears; track y) {
            <button class="seg-btn" [class.active]="selectedYear === y"
                    (click)="onYearChange(y)">{{ y }}</button>
          }
        </div>
      </div>

      <!-- Interval selector -->
      <div class="control-group">
        <label class="control-label">View</label>
        <div class="seg-control">
          @for (iv of intervals; track iv.value) {
            <button class="seg-btn" [class.active]="selectedInterval === iv.value"
                    (click)="onIntervalChange(iv.value)">{{ iv.label }}</button>
          }
        </div>
      </div>

      <!-- Refresh -->
      <button class="icon-btn" (click)="loadData()"
              [disabled]="loading()"
              pTooltip="Refresh" tooltipPosition="left">
        <i class="pi pi-refresh" [class.spin]="loading()"></i>
      </button>

    </div>
  </div>

  <!-- ── KPI Strip ── -->
  @if (kpis().length) {
    <div class="kpi-strip">
      @for (kpi of kpis(); track kpi.label) {
        <div class="kpi-card">
          <div class="kpi-icon-wrap {{ kpi.colorClass }}">
            <i class="pi {{ kpi.icon }}"></i>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">{{ kpi.label }}</span>
            <span class="kpi-value">{{ formatCurrency(kpi.value) }}</span>
          </div>
          <div class="kpi-trend {{ kpi.colorClass }}"></div>
        </div>
      }
    </div>
  }

  <!-- ── Chart card ── -->
  <div class="chart-card">

    <!-- Dataset toggles -->
    <div class="dataset-toggles">
      @for (ds of datasetToggles; track ds.key) {
        <button class="ds-toggle" [class.muted]="!ds.visible"
                (click)="toggleDataset(ds)">
          <span class="ds-dot" [style.background]="ds.color"></span>
          <span class="ds-label">{{ ds.label }}</span>
        </button>
      }
    </div>

    <!-- Chart -->
    <div class="chart-area">
      @if (loading()) {
        <div class="loader-overlay">
          <div class="loader-ring"></div>
          <span class="loader-txt">Fetching financials…</span>
        </div>
      }
      @if (!loading() && chartData()) {
        <p-chart
          type="bar"
          [data]="visibleChartData()"
          [options]="chartOptions"
          height="100%"
          width="100%">
        </p-chart>
      }
      @if (!loading() && !chartData()) {
        <div class="empty-state">
          <i class="pi pi-chart-bar empty-icon"></i>
          <span>No data available for the selected period</span>
        </div>
      }
    </div>

    <!-- Footer legend -->
    <div class="chart-footer">
      <div class="footer-note">
        <i class="pi pi-info-circle"></i>
        Amounts in INR · Bars represent Net Profit · Lines show Income &amp; Expense trends
      </div>
      <div class="footer-period">{{ periodLabel() }}</div>
    </div>

  </div>
</div>
  `,
  styles: [`
/* ================================================================
   FINANCIAL TREND CHART — token-driven, data-colors fixed
   ================================================================ */

:host { display: block; width: 100%; }

/* ── Root ── */
.ft-root {
  position: relative;
  padding: var(--spacing-xl);
  border-radius: var(--ui-border-radius-lg);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  overflow: hidden;
  container-type: inline-size;
}

/* ── Ambient decoration ── */
.ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.amb-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.07;
}
.amb-1 {
  width: 380px; height: 380px;
  top: -120px; left: -80px;
  background: #4caf50;
  animation: float 14s ease-in-out infinite;
}
.amb-2 {
  width: 300px; height: 300px;
  bottom: -100px; right: -60px;
  background: #2196f3;
  animation: float 11s ease-in-out infinite reverse;
}
.amb-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--border-primary) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-primary) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.35;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(24px, 32px) scale(1.05); }
}

/* ── Header ── */
.ft-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.title-badge {
  width: 40px; height: 40px;
  border-radius: var(--ui-border-radius);
  background: var(--accent-focus);
  color: var(--accent-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.ft-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 2px 0;
  line-height: var(--line-height-tight);
}
.ft-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: var(--font-weight-medium);
}

/* ── Controls ── */
.header-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.control-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-left: 2px;
}

.seg-control {
  display: flex;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  padding: 2px;
  gap: 2px;
}
.seg-btn {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-body);
  border-radius: calc(var(--ui-border-radius) - 2px);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
  &:hover { background: var(--component-bg-hover); color: var(--text-primary); }
  &.active {
    background: var(--accent-primary);
    color: #fff;
  }
}

.icon-btn {
  width: 34px; height: 34px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-base);
  align-self: flex-end;
  transition: var(--transition-fast);
  &:hover:not(:disabled) {
    background: var(--component-bg-hover);
    color: var(--accent-primary);
    border-color: var(--border-secondary);
  }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── KPI Strip ── */
.kpi-strip {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);

  @container (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  position: relative;
  overflow: hidden;
  transition: var(--transition-base);
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
}

.kpi-icon-wrap {
  width: 36px; height: 36px;
  border-radius: var(--ui-border-radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;

  &.income  { background: rgba(76,175,80,0.12); color: #4caf50; }
  &.expense { background: rgba(244,67,54,0.12); color: #f44336; }
  &.profit  { background: rgba(33,150,243,0.12); color: #2196f3; }
}

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.kpi-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.kpi-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-trend {
  position: absolute;
  right: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 0 var(--ui-border-radius) var(--ui-border-radius) 0;
  &.income  { background: #4caf50; }
  &.expense { background: #f44336; }
  &.profit  { background: #2196f3; }
}

/* ── Chart card ── */
.chart-card {
  position: relative;
  z-index: 1;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

/* Dataset toggles */
.dataset-toggles {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}
.ds-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 5px 12px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  border-radius: var(--ui-border-radius-pill);
  cursor: pointer;
  transition: var(--transition-fast);
  &:hover { background: var(--component-bg-hover); }
  &.muted { opacity: 0.38; }
}
.ds-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ds-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Chart area */
.chart-area {
  position: relative;
  height: 340px;
  width: 100%;
}

.loader-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: var(--spacing-md);
  background: color-mix(in srgb, var(--bg-primary) 85%, transparent 15%);
  backdrop-filter: blur(4px);
  border-radius: var(--ui-border-radius);
  z-index: 5;
}
.loader-ring {
  width: 36px; height: 36px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loader-txt {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.empty-state {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: var(--spacing-md);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}
.empty-icon { font-size: 2.5rem; opacity: 0.3; }

/* Footer */
.chart-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: var(--ui-border-width) solid var(--border-primary);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}
.footer-note {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
.footer-period {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  padding: 3px 10px;
  border-radius: var(--ui-border-radius-pill);
}
  `]
})
export class FinancialTrendChartComponent implements OnInit, OnDestroy {

  // ── State ──
  chartData = signal<any>(null);
  loading = signal(false);
  chartOptions: any;

  availableYears = [2023, 2024, 2025];
  selectedYear = new Date().getFullYear();

  intervals = [
    { label: 'Monthly', value: 'month' },
    { label: 'Quarterly', value: 'quarter' },
  ];
  selectedInterval = 'month';

  // Dataset visibility toggles (data-colors intentionally fixed)
  datasetToggles = [
    { key: 'income', label: 'Income', color: '#4caf50', visible: true },
    { key: 'expense', label: 'Expense', color: '#f44336', visible: true },
    { key: 'profit', label: 'Net Profit', color: '#2196f3', visible: true },
  ];

  // ── Computed ──
  kpis = signal<SummaryKpi[]>([]);

  visibleChartData = computed(() => {
    const raw = this.chartData();
    if (!raw) return null;
    const keys = ['income', 'expense', 'profit'];
    const filtered = raw.datasets.filter((_: any, i: number) =>
      this.datasetToggles[i]?.visible
    );
    return { labels: raw.labels, datasets: filtered };
  });

  periodLabel = computed(() => {
    return `${this.selectedYear} · ${this.intervals.find(i => i.value === this.selectedInterval)?.label
      }`;
  });

  private destroy$ = new Subject<void>();

  constructor(private chartService: ChartService) { }

  ngOnInit(): void {
    this.availableYears = this.generateYearsFromStart(2023);
    this.initChartOptions();
    this.loadData();
  }

  /**
   * Generates an array of years from a given start year up to the current year.
   */
  generateYearsFromStart(startYear: number): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }

    // Returns [2023, 2024, 2025, 2026...]
    return years;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onYearChange(y: number): void {
    this.selectedYear = y;
    this.loadData();
  }


  onIntervalChange(iv: string): void {
    this.selectedInterval = iv;
    this.loadData();
  }

  toggleDataset(ds: typeof this.datasetToggles[0]): void {
    ds.visible = !ds.visible;
    // Trigger signal recomputation
    this.chartData.set({ ...this.chartData() });
  }

  loadData(): void {
    this.loading.set(true);
    this.chartService
      .getFinancialTrend({ year: this.selectedYear, interval: this.selectedInterval as any })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.status === 'success') this.processResponse(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private processResponse(data: any): void {
    // Map API datasets → chart datasets with enhanced visuals
    const enhanced = data.datasets.map((ds: any, idx: number) => {
      if (ds.type === 'line') {
        return {
          ...ds,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: ds.borderColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.45,
          fill: true,
        };
      }
      // Bar (Net Profit)
      return {
        ...ds,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.55,
        categoryPercentage: 0.75,
        hoverBackgroundColor: 'rgba(33,150,243,0.9)',
      };
    });

    this.chartData.set({ labels: data.labels, datasets: enhanced });

    // Compute KPIs — sum non-zero values
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const incomeDs = data.datasets.find((d: any) => d.label === 'Income');
    const expenseDs = data.datasets.find((d: any) => d.label === 'Expense');
    const profitDs = data.datasets.find((d: any) => d.label === 'Net Profit');

    this.kpis.set([
      { label: 'Total Income', value: sum(incomeDs?.data ?? []), icon: 'pi-arrow-up-right', colorClass: 'income', prefix: '₹' },
      { label: 'Total Expense', value: sum(expenseDs?.data ?? []), icon: 'pi-arrow-down-left', colorClass: 'expense', prefix: '₹' },
      { label: 'Net Profit', value: sum(profitDs?.data ?? []), icon: 'pi-indian-rupee', colorClass: 'profit', prefix: '₹' },
    ]);
  }

  formatCurrency(val: number): string {
    if (val >= 1_00_00_000) return '₹' + (val / 1_00_00_000).toFixed(2) + 'Cr';
    if (val >= 1_00_000) return '₹' + (val / 1_00_000).toFixed(2) + 'L';
    if (val >= 1_000) return '₹' + (val / 1_000).toFixed(1) + 'k';
    return '₹' + val.toFixed(0);
  }

  private initChartOptions(): void {
    const tick = '#94a3b8';
    const grid = 'rgba(148,163,184,0.08)';

    this.chartOptions = {
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.93)',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 10,
          usePointStyle: true,
          boxPadding: 6,
          callbacks: {
            label: (ctx: any) => {
              const lbl = ctx.dataset.label ?? '';
              if (ctx.parsed.y == null) return lbl;
              return ` ${lbl}: ${this.formatCurrency(ctx.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tick, font: { size: 11, family: 'inherit' } },
          border: { display: false }
        },
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: grid, drawBorder: false },
          border: { display: false, dash: [4, 4] },
          ticks: {
            color: tick,
            font: { size: 10 },
            callback: (v: number) => this.formatCurrency(v)
          }
        }
      }
    };
  }
}

// import { Component, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
// import { ChartService } from '../chart.service';

// @Component({
//   selector: 'app-financial-trend-chart',
//   standalone: true,
//   imports: [CommonModule, ChartModule, TooltipModule, UniversalFilterComponent],
//   template: `
// <div class="trend-root">

//   <!-- Ambient blobs — decorative depth only -->
//   <div class="blob blob-1" aria-hidden="true"></div>
//   <div class="blob blob-2" aria-hidden="true"></div>

//   <!-- Filter bar -->
//   <div class="filter-bar">
//     <app-universal-filter
//       entityType="financial-trend"
//       [config]="filterConfig"
//       (filterChange)="onFilterUpdate($event)">
//     </app-universal-filter>
//   </div>

//   <!-- Chart card -->
//   <div class="chart-card">

//     <div class="card-head">
//       <div class="head-left">
//         <div class="head-icon">
//           <i class="pi pi-chart-line"></i>
//         </div>
//         <div>
//           <h2 class="card-title">Financial Performance</h2>
//           <p class="card-sub">Revenue (bars) vs Net Profit (line)</p>
//         </div>
//       </div>
//       <button class="refresh-btn"
//               (click)="refreshData()"
//               [disabled]="loading()"
//               pTooltip="Refresh data"
//               tooltipPosition="left">
//         <i class="pi pi-refresh" [class.spinning]="loading()"></i>
//       </button>
//     </div>

//     <!-- Chart area -->
//     <div class="chart-wrap">
//       @if (loading()) {
//         <div class="chart-loader">
//           <i class="pi pi-spin pi-spinner loader-icon"></i>
//           <span class="loader-text">Loading financials…</span>
//         </div>
//       }
//       @if (chartData()) {
//         <p-chart
//           type="bar"
//           [data]="chartData()"
//           [options]="chartOptions"
//           height="100%"
//           width="100%">
//         </p-chart>
//       }
//     </div>

//     <!-- Legend -->
//     <div class="chart-legend">
//       <div class="legend-item">
//         <span class="legend-mark legend-mark--line"></span>
//         <span class="legend-label">Net Profit</span>
//       </div>
//       <div class="legend-item">
//         <span class="legend-mark legend-mark--revenue"></span>
//         <span class="legend-label">Revenue</span>
//       </div>
//       <div class="legend-item">
//         <span class="legend-mark legend-mark--expense"></span>
//         <span class="legend-label">Expenses</span>
//       </div>
//     </div>

//   </div>
// </div>
//   `,
//   styles: [`
// /* ============================================================
//    FINANCIAL TREND CHART — TOKEN-DRIVEN
//    Blob colors (#3B82F6, #8B5CF6) and chart dataset colors
//    (blue, slate, emerald) are intentionally kept as fixed hex
//    values because they are data-encoding colors that must remain
//    consistent across all themes — they are not UI surface colors.
//    Every other visual property uses the canonical token system.
//    ============================================================ */

// :host { display: block; width: 100%; }

// .trend-root {
//   position: relative;
//   padding: var(--spacing-xl);
//   overflow: hidden;
//   border-radius: var(--radius-2xl);
//   background: var(--bg-secondary);
//   font-family: var(--font-body);
// }

// /* ── Ambient blobs (decorative, not interactive) ── */
// .blob {
//   position: absolute;
//   border-radius: var(--ui-border-radius-pill);
//   filter: blur(90px);
//   z-index: 0;
//   opacity: 0.1;
//   pointer-events: none;
// }
// .blob-1 {
//   top: -30%; left: -10%;
//   width: 500px; height: 500px;
//   /* Blue: data-encoding accent, intentionally fixed */
//   background: #3B82F6;
//   animation: blob-float 10s ease-in-out infinite;
// }
// .blob-2 {
//   bottom: -30%; right: -10%;
//   width: 400px; height: 400px;
//   /* Violet: data-encoding accent, intentionally fixed */
//   background: #8B5CF6;
//   animation: blob-float 12s ease-in-out infinite reverse;
// }
// @keyframes blob-float {
//   0%, 100% { transform: translate(0, 0); }
//   50%       { transform: translate(20px, 40px); }
// }

// /* ── Filter bar ── */
// .filter-bar {
//   position: relative;
//   z-index: 2;
//   margin-bottom: var(--spacing-lg);
// }

// /* ── Chart card ── */
// .chart-card {
//   position: relative;
//   z-index: 1;
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius-lg);
//   padding: var(--spacing-xl);
//   box-shadow: var(--shadow-sm);
// }

// /* Card header */
// .card-head {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   margin-bottom: var(--spacing-xl);
//   gap: var(--spacing-lg);
// }

// .head-left {
//   display: flex;
//   align-items: flex-start;
//   gap: var(--spacing-md);
// }

// .head-icon {
//   width: 32px;
//   height: 32px;
//   border-radius: var(--ui-border-radius-sm);
//   /* Uses accent-focus token so it adapts to any theme */
//   background: var(--accent-focus);
//   color: var(--accent-primary);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: var(--font-size-base);
//   flex-shrink: 0;
// }

// .card-title {
//   font-size: var(--font-size-xl);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
//   margin: 0 0 var(--spacing-xs) 0;
//   line-height: var(--line-height-tight);
// }

// .card-sub {
//   font-size: var(--font-size-sm);
//   color: var(--text-tertiary);
//   margin: 0;
// }

// /* Refresh button */
// .refresh-btn {
//   width: 32px;
//   height: 32px;
//   border: var(--ui-border-width) solid var(--border-primary);
//   background: var(--bg-secondary);
//   color: var(--text-secondary);
//   border-radius: var(--ui-border-radius);
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: var(--font-size-base);
//   flex-shrink: 0;
//   transition: var(--transition-base);

//   &:hover:not(:disabled) {
//     background: var(--component-bg-hover);
//     color: var(--accent-primary);
//     border-color: var(--border-secondary);
//   }

//   &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }
// }

// .spinning { animation: spin 0.8s linear infinite; }
// @keyframes spin { to { transform: rotate(360deg); } }

// /* Chart wrapper */
// .chart-wrap {
//   position: relative;
//   height: 350px;
//   width: 100%;
// }

// /* Loading overlay */
// .chart-loader {
//   position: absolute;
//   inset: 0;
//   z-index: 10;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: var(--spacing-md);
//   background: rgba(0, 0, 0, 0.25);
//   backdrop-filter: blur(4px);
//   border-radius: var(--ui-border-radius);
// }

// .loader-icon {
//   /* Blue: data-encoding color for loading state, consistent with chart primary */
//   color: #3B82F6;
//   font-size: var(--font-size-3xl);
// }

// .loader-text {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   /* White text on dark overlay — intentionally fixed for legibility */
//   color: #fff;
// }

// /* Legend */
// .chart-legend {
//   display: flex;
//   justify-content: center;
//   gap: var(--spacing-2xl);
//   margin-top: var(--spacing-xl);
//   padding-top: var(--spacing-lg);
//   border-top: var(--ui-border-width) solid var(--border-primary);
// }

// .legend-item {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
// }

// .legend-mark {
//   display: inline-block;
//   width: 12px;
//   height: 12px;
//   border-radius: var(--ui-border-radius-sm);
//   flex-shrink: 0;
// }

// /* Data-encoding colors — must remain fixed across themes */
// .legend-mark--line    { height: 3px; width: 16px; border-radius: var(--ui-border-radius-pill); background: #10B981; }
// .legend-mark--revenue { background: #3B82F6; }
// .legend-mark--expense { background: #64748B; }

// .legend-label {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-secondary);
// }
//   `]
// })
// export class FinancialTrendChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal(false);
//   chartOptions: any;

//   private currentFilters: Record<string, any> = {};

//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       dataSourceKey: 'branches',
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'Global Overview'
//     },
//     { key: 'date', label: 'Trend Period', type: 'date-range' }
//   ];

//   constructor(private analyticsService: ChartService) { }

//   ngOnInit(): void {
//     this.initOptions();
//     // Initial data load is triggered by the UniversalFilterComponent emitting
//     // its default values on init, which calls onFilterUpdate → refreshData.
//   }

//   onFilterUpdate(filters: Record<string, any>): void {
//     this.currentFilters = filters;
//     this.refreshData();
//   }

//   refreshData(): void {
//     this.loading.set(true);
//     this.analyticsService.getFinancialTrend().subscribe({
//       next: (res) => {
//         if (res.status === 'success') this.processData(res.data);
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   private processData(raw: any): void {
//     const createGradient = (ctx: any, top: string, bottom: string) => {
//       const g = ctx.createLinearGradient(0, 0, 0, 400);
//       g.addColorStop(0, top);
//       g.addColorStop(1, bottom);
//       return g;
//     };

//     // Revenue bar — blue gradient (data-encoding, fixed)
//     const dsRevenue = {
//       type: 'bar',
//       label: 'Gross Revenue',
//       data: raw.datasets[0].data,
//       backgroundColor: (ctx: any) => createGradient(ctx.chart.ctx, '#3B82F6', 'rgba(59,130,246,0.2)'),
//       hoverBackgroundColor: '#2563EB',
//       borderRadius: 4,
//       barPercentage: 0.6,
//       categoryPercentage: 0.7,
//       order: 2,
//       yAxisID: 'y'
//     };

//     // Expenses bar — slate gradient (data-encoding, fixed)
//     const dsExpense = {
//       type: 'bar',
//       label: 'Expenses',
//       data: raw.datasets[1].data,
//       backgroundColor: (ctx: any) => createGradient(ctx.chart.ctx, '#64748B', 'rgba(100,116,139,0.1)'),
//       hoverBackgroundColor: '#475569',
//       borderRadius: 4,
//       barPercentage: 0.6,
//       categoryPercentage: 0.7,
//       order: 3,
//       yAxisID: 'y'
//     };

//     // Profit line — emerald (data-encoding, fixed)
//     const dsProfit = {
//       type: 'line',
//       label: 'Net Profit',
//       data: raw.datasets[2].data,
//       borderColor: '#10B981',
//       borderWidth: 2.5,
//       backgroundColor: 'rgba(16,185,129,0.1)',
//       fill: true,
//       tension: 0.4,
//       pointBackgroundColor: '#064E3B',
//       pointBorderColor: '#10B981',
//       pointBorderWidth: 2,
//       pointRadius: 4,
//       pointHoverRadius: 6,
//       order: 1,
//       yAxisID: 'y1'
//     };

//     this.chartData.set({ labels: raw.labels, datasets: [dsProfit, dsRevenue, dsExpense] });
//   }

//   private initOptions(): void {
//     // Chart.js requires concrete color strings, not CSS variables.
//     // Using neutral slate values that work on both light and dark backgrounds.
//     const tickColor = '#94a3b8';
//     const gridColor = 'rgba(148,163,184,0.08)';

//     this.chartOptions = {
//       maintainAspectRatio: false,
//       animation: { duration: 900, easing: 'easeOutQuart' },
//       interaction: { mode: 'index', intersect: false },
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           // Dark glass tooltip — intentionally fixed, theme-agnostic
//           backgroundColor: 'rgba(15,23,42,0.92)',
//           titleColor: '#f1f5f9',
//           bodyColor: '#cbd5e1',
//           borderColor: 'rgba(255,255,255,0.1)',
//           borderWidth: 1,
//           padding: 12,
//           cornerRadius: 8,
//           usePointStyle: true,
//           boxPadding: 6,
//           callbacks: {
//             label: (ctx: any) => {
//               const label = ctx.dataset.label ? ctx.dataset.label + ': ' : '';
//               if (ctx.parsed.y == null) return label;
//               return label + new Intl.NumberFormat('en-IN', {
//                 style: 'currency',
//                 currency: 'INR',
//                 maximumSignificantDigits: 3
//               }).format(ctx.parsed.y);
//             }
//           }
//         }
//       },
//       scales: {
//         x: {
//           grid: { display: false },
//           ticks: { color: tickColor, font: { size: 11 } }
//         },
//         y: {
//           type: 'linear',
//           position: 'left',
//           grid: { color: gridColor, drawBorder: false },
//           ticks: {
//             color: tickColor,
//             font: { size: 10 },
//             callback: (v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v
//           }
//         },
//         y1: {
//           type: 'linear',
//           display: false,
//           position: 'right',
//           grid: { display: false }
//         }
//       }
//     };
//   }
// }