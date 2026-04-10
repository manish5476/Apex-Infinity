import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ChartService } from '../chart.service';

@Component({
  selector: 'app-gross-profit-trend-chart',
  standalone: true,
  imports: [FormsModule, ChartModule, TooltipModule],
  template: `
<div class="gp-root">

  <!-- Ambient decoration -->
  <div class="ambient" aria-hidden="true">
    <div class="amb-blob amb-1"></div>
    <div class="amb-blob amb-2"></div>
    <div class="amb-grid"></div>
  </div>

  <!-- ── Header ── -->
  <div class="gp-header">
    <div class="header-left">
      <div class="title-badge">
        <i class="pi pi-percentage"></i>
      </div>
      <div>
        <h2 class="gp-title">Gross Profit Trend</h2>
        <p class="gp-subtitle">Revenue · Gross Profit · Margin %</p>
      </div>
    </div>

    <div class="header-controls">
      <!-- Year picker -->
      <div class="control-group">
        <label class="ctrl-label">Year</label>
        <div class="seg-ctrl">
          @for (y of availableYears; track y) {
            <button class="seg-btn" [class.active]="selectedYear === y"
                    (click)="onYearChange(y)">{{ y }}</button>
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
          <div class="kpi-swatch" [style.background]="kpi.swatchBg" [style.color]="kpi.swatchColor">
            <i class="pi {{ kpi.icon }}"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">{{ kpi.label }}</span>
            <span class="kpi-value">{{ kpi.formatted }}</span>
          </div>
          <div class="kpi-bar" [style.background]="kpi.swatchColor"></div>
        </div>
      }
    </div>
  }

  <!-- ── Chart card ── -->
  <div class="chart-card">

    <!-- Dataset toggles -->
    <div class="ds-toggles">
      @for (ds of datasetToggles; track ds.key) {
        <button class="ds-pill" [class.off]="!ds.visible"
                (click)="toggleDataset(ds)">
          <span class="ds-dot" [style.background]="ds.color"></span>
          <span class="ds-name">{{ ds.label }}</span>
          @if (ds.isLine) {
            <span class="ds-axis-tag">right axis</span>
          }
        </button>
      }
    </div>

    <!-- Axis legend -->
    <div class="axis-hint">
      <span class="axis-hint-item">
        <span class="axis-mark axis-left"></span> Left — Revenue &amp; Gross Profit (₹)
      </span>
      <span class="axis-hint-item">
        <span class="axis-mark axis-right"></span> Right — Margin %
      </span>
    </div>

    <!-- Chart area -->
    <div class="chart-area">
      @if (loading()) {
        <div class="loader-overlay">
          <div class="loader-ring"></div>
          <span class="loader-txt">Loading gross profit data…</span>
        </div>
      }
      @if (!loading() && visibleChartData()) {
        <p-chart
          type="bar"
          [data]="visibleChartData()!"
          [options]="chartOptions"
          height="100%"
          width="100%">
        </p-chart>
      }
      @if (!loading() && !chartData()) {
        <div class="empty-state">
          <i class="pi pi-chart-bar empty-icon"></i>
          <span>No data for selected period</span>
        </div>
      }
    </div>

    <!-- Footer -->
    <div class="chart-footer">
      <div class="footer-note">
        <i class="pi pi-info-circle"></i>
        Amounts in INR · Margin % calculated as Gross Profit ÷ Revenue
      </div>
      <div class="footer-period">{{ selectedYear }}</div>
    </div>

  </div>
</div>
  `,
  styles: [`
:host { display: block; width: 100%; }

.gp-root {
  position: relative;
  padding: var(--spacing-xl);
  border-radius: var(--ui-border-radius-lg);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  overflow: hidden;
  container-type: inline-size;
}

/* ── Ambient ── */
.ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.amb-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.07;
}
.amb-1 {
  width: 360px; height: 360px;
  top: -120px; left: -80px;
  background: #42A5F5; /* Revenue blue — data colour, fixed */
  animation: float 13s ease-in-out infinite;
}
.amb-2 {
  width: 280px; height: 280px;
  bottom: -80px; right: -60px;
  background: #66BB6A; /* Gross profit green — data colour, fixed */
  animation: float 10s ease-in-out infinite reverse;
}
.amb-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(var(--border-primary) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-primary) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.3;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}
@keyframes float {
  0%, 100% { transform: translate(0,0) scale(1); }
  50%       { transform: translate(20px, 30px) scale(1.04); }
}

/* ── Header ── */
.gp-header {
  position: relative; z-index: 2;
  display: flex; align-items: center;
  justify-content: space-between;
  flex-wrap: wrap; gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}
.header-left { display: flex; align-items: center; gap: var(--spacing-md); }
.title-badge {
  width: 40px; height: 40px;
  border-radius: var(--ui-border-radius);
  background: var(--accent-focus);
  color: var(--accent-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-lg); flex-shrink: 0;
}
.gp-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 2px; line-height: var(--line-height-tight);
}
.gp-subtitle {
  font-size: var(--font-size-xs); color: var(--text-tertiary);
  margin: 0; letter-spacing: 0.04em; text-transform: uppercase;
  font-weight: var(--font-weight-medium);
}

/* Controls */
.header-controls { display: flex; align-items: center; gap: var(--spacing-lg); flex-wrap: wrap; }
.control-group   { display: flex; flex-direction: column; gap: var(--spacing-xs); }
.ctrl-label {
  font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold);
  color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; padding-left: 2px;
}
.seg-ctrl {
  display: flex; gap: 2px; padding: 2px;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
}
.seg-btn {
  padding: 4px 10px; border: none; background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-xs); font-weight: var(--font-weight-medium);
  font-family: var(--font-body);
  border-radius: calc(var(--ui-border-radius) - 2px);
  cursor: pointer; transition: var(--transition-fast); white-space: nowrap;
  &:hover  { background: var(--component-bg-hover); color: var(--text-primary); }
  &.active { background: var(--accent-primary); color: #fff; }
}
.icon-btn {
  width: 34px; height: 34px; align-self: flex-end;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary); color: var(--text-secondary);
  border-radius: var(--ui-border-radius); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-base); transition: var(--transition-fast);
  &:hover:not(:disabled) { background: var(--component-bg-hover); color: var(--accent-primary); border-color: var(--border-secondary); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── KPI strip ── */
.kpi-strip {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md); margin-bottom: var(--spacing-lg);
  @container (max-width: 560px) { grid-template-columns: 1fr; }
}
.kpi-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex; align-items: center; gap: var(--spacing-md);
  position: relative; overflow: hidden;
  transition: var(--transition-base);
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
}
.kpi-swatch {
  width: 36px; height: 36px; border-radius: var(--ui-border-radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-base); flex-shrink: 0;
}
.kpi-info  { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.kpi-label {
  font-size: var(--font-size-xs); color: var(--text-tertiary);
  font-weight: var(--font-weight-medium); text-transform: uppercase; letter-spacing: 0.05em;
}
.kpi-value {
  font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);
  color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.kpi-bar {
  position: absolute; right: 0; top: 0; bottom: 0; width: 3px;
  border-radius: 0 var(--ui-border-radius) var(--ui-border-radius) 0;
}

/* ── Chart card ── */
.chart-card {
  position: relative; z-index: 1;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl); box-shadow: var(--shadow-sm);
}

/* Dataset toggles */
.ds-toggles { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); flex-wrap: wrap; }
.ds-pill {
  display: flex; align-items: center; gap: var(--spacing-sm);
  padding: 4px 12px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  border-radius: var(--ui-border-radius-pill);
  cursor: pointer; transition: var(--transition-fast);
  &:hover { background: var(--component-bg-hover); }
  &.off { opacity: 0.35; }
}
.ds-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ds-name { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--text-secondary); }
.ds-axis-tag {
  font-size: var(--font-size-xs); color: var(--text-tertiary);
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-pill);
  padding: 0 6px; font-style: italic;
}

/* Axis hint */
.axis-hint {
  display: flex; gap: var(--spacing-xl); margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}
.axis-hint-item {
  display: flex; align-items: center; gap: var(--spacing-sm);
  font-size: var(--font-size-xs); color: var(--text-tertiary);
}
.axis-mark {
  display: inline-block; width: 24px; height: 3px; border-radius: 2px; flex-shrink: 0;
}
.axis-left  { background: #42A5F5; } /* Revenue — data colour, fixed */
.axis-right { background: #FFA726; } /* Margin  — data colour, fixed */

/* Chart area */
.chart-area { position: relative; height: 340px; width: 100%; }
.loader-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--spacing-md);
  background: color-mix(in srgb, var(--bg-primary) 85%, transparent 15%);
  backdrop-filter: blur(4px); border-radius: var(--ui-border-radius); z-index: 5;
}
.loader-ring {
  width: 36px; height: 36px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loader-txt { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: var(--font-weight-medium); }
.empty-state {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--spacing-md); color: var(--text-tertiary); font-size: var(--font-size-sm);
}
.empty-icon { font-size: 2.5rem; opacity: 0.3; }

/* Footer */
.chart-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: var(--spacing-lg); padding-top: var(--spacing-md);
  border-top: var(--ui-border-width) solid var(--border-primary);
  gap: var(--spacing-md); flex-wrap: wrap;
}
.footer-note {
  font-size: var(--font-size-xs); color: var(--text-tertiary);
  display: flex; align-items: center; gap: var(--spacing-xs);
}
.footer-period {
  font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold);
  color: var(--text-secondary); background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  padding: 3px 10px; border-radius: var(--ui-border-radius-pill);
}
  `]
})
export class GrossProfitTrendChartComponent implements OnInit, OnDestroy {

  chartData   = signal<any>(null);
  loading     = signal(false);
  chartOptions: any;

  availableYears = [2023, 2024, 2025];
  selectedYear   = new Date().getFullYear();

  // Data-encoding colors match API response — intentionally fixed
  datasetToggles = [
    { key: 'revenue',      label: 'Revenue',      color: '#42A5F5', visible: true,  isLine: false },
    { key: 'gross_profit', label: 'Gross Profit',  color: '#66BB6A', visible: true,  isLine: false },
    { key: 'margin',       label: 'Margin %',      color: '#FFA726', visible: true,  isLine: true  },
  ];

  kpis = signal<any[]>([]);

  visibleChartData = computed(() => {
    const raw = this.chartData();
    if (!raw) return null;
    const datasets = raw.datasets.filter((_: any, i: number) => this.datasetToggles[i]?.visible);
    return { labels: raw.labels, datasets };
  });

  private destroy$ = new Subject<void>();

  constructor(private chartService: ChartService) {}

  ngOnInit(): void {
    this.buildChartOptions();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onYearChange(y: number): void {
    this.selectedYear = y;
    this.loadData();
  }

  toggleDataset(ds: (typeof this.datasetToggles)[0]): void {
    ds.visible = !ds.visible;
    this.chartData.set({ ...this.chartData() }); // trigger computed
  }

  loadData(): void {
    this.loading.set(true);
    this.chartService
      .getGrossProfitTrend({ year: this.selectedYear })
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
    const enhanced = data.datasets.map((ds: any) => {
      if (ds.type === 'line') {
        return {
          ...ds,
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: ds.borderColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.45,
          fill: false,
        };
      }
      // Bar datasets
      return {
        ...ds,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.55,
        categoryPercentage: 0.75,
        borderWidth: 0,
      };
    });

    this.chartData.set({ labels: data.labels, datasets: enhanced });

    // KPIs
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => {
      const nonZero = arr.filter(v => v > 0);
      return nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
    };

    const revDs    = data.datasets.find((d: any) => d.label === 'Revenue');
    const gpDs     = data.datasets.find((d: any) => d.label === 'Gross Profit');
    const marginDs = data.datasets.find((d: any) => d.label === 'Margin %');

    const totalRev = sum(revDs?.data ?? []);
    const totalGp  = sum(gpDs?.data  ?? []);
    const avgMargin = avg(marginDs?.data ?? []);

    this.kpis.set([
      {
        label: 'Total Revenue', formatted: this.formatINR(totalRev),
        icon: 'pi-arrow-up-right',
        swatchBg: 'rgba(66,165,245,0.12)', swatchColor: '#42A5F5'
      },
      {
        label: 'Gross Profit', formatted: this.formatINR(totalGp),
        icon: 'pi-indian-rupee',
        swatchBg: 'rgba(102,187,106,0.12)', swatchColor: '#66BB6A'
      },
      {
        label: 'Avg Margin %', formatted: avgMargin.toFixed(1) + '%',
        icon: 'pi-percentage',
        swatchBg: 'rgba(255,167,38,0.12)', swatchColor: '#FFA726'
      },
    ]);
  }

  formatINR(val: number): string {
    if (val >= 1_00_00_000) return '₹' + (val / 1_00_00_000).toFixed(2) + ' Cr';
    if (val >= 1_00_000)    return '₹' + (val / 1_00_000).toFixed(2) + ' L';
    if (val >= 1_000)       return '₹' + (val / 1_000).toFixed(1) + 'k';
    return '₹' + val.toFixed(0);
  }

  private buildChartOptions(): void {
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
          bodyColor:  '#cbd5e1',
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
              // Margin % dataset — show as percentage
              if (ctx.dataset.yAxisID === 'y1') {
                return ` ${lbl}: ${ctx.parsed.y.toFixed(1)}%`;
              }
              return ` ${lbl}: ${this.formatINR(ctx.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tick, font: { size: 11 } },
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
            callback: (v: number) => this.formatINR(v)
          },
          title: {
            display: true,
            text: 'Amount (₹)',
            color: tick,
            font: { size: 10 }
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#FFA726', // Margin axis label — data colour, fixed
            font: { size: 10 },
            callback: (v: number) => v + '%'
          },
          title: {
            display: true,
            text: 'Margin %',
            color: '#FFA726',
            font: { size: 10 }
          },
          min: 0,
          max: 100,
        }
      }
    };
  }
}
