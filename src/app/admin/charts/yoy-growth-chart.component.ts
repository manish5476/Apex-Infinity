import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ChartService } from '../chart.service';

@Component({
  selector: 'app-yoy-growth-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule, TooltipModule],
  template: `
<div class="yoy-root">

  <!-- Ambient -->
  <div class="ambient" aria-hidden="true">
    <div class="amb-blob amb-1"></div>
    <div class="amb-blob amb-2"></div>
    <div class="amb-grid"></div>
  </div>

  <!-- ── Header ── -->
  <div class="yoy-header">
    <div class="header-left">
      <div class="title-badge">
        <i class="pi pi-arrow-right-arrow-left"></i>
      </div>
      <div>
        <h2 class="yoy-title">Year-over-Year Growth</h2>
        <p class="yoy-subtitle">Current vs Prior Year · Growth %</p>
      </div>
    </div>

    <div class="header-controls">
      <div class="control-group">
        <label class="ctrl-label">Compare Year</label>
        <div class="seg-ctrl">
          @for (y of availableYears; track y) {
            <button class="seg-btn" [class.active]="selectedYear === y"
                    (click)="onYearChange(y)">{{ y }}</button>
          }
        </div>
      </div>

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
          @if (kpi.badge !== undefined) {
            <div class="kpi-badge" [class.positive]="kpi.badge >= 0" [class.negative]="kpi.badge < 0">
              <i class="pi {{ kpi.badge >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-left' }}"></i>
              {{ kpi.badge >= 0 ? '+' : '' }}{{ kpi.badge.toFixed(1) }}%
            </div>
          }
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
        <button class="ds-pill" [class.off]="!ds.visible" (click)="toggleDataset(ds)">
          <span class="ds-swatch"
                [style.background]="ds.dashed ? 'transparent' : ds.color"
                [style.border]="ds.dashed ? ('2px dashed ' + ds.color) : 'none'">
          </span>
          <span class="ds-name">{{ ds.label }}</span>
          @if (ds.isSecondAxis) {
            <span class="ds-axis-tag">right axis</span>
          }
        </button>
      }
    </div>

    <!-- Axis hint -->
    <div class="axis-hint">
      <span class="axis-hint-item">
        <span class="axis-mark" style="background:#42A5F5"></span>
        Left — Revenue (₹)
      </span>
      <span class="axis-hint-item">
        <span class="axis-mark" style="background:#66BB6A"></span>
        Right — Growth %
      </span>
    </div>

    <!-- Chart -->
    <div class="chart-area">
      @if (loading()) {
        <div class="loader-overlay">
          <div class="loader-ring"></div>
          <span class="loader-txt">Calculating year-over-year growth…</span>
        </div>
      }
      @if (!loading() && visibleChartData()) {
        <p-chart
          type="line"
          [data]="visibleChartData()!"
          [options]="chartOptions"
          height="100%"
          width="100%">
        </p-chart>
      }
      @if (!loading() && !chartData()) {
        <div class="empty-state">
          <i class="pi pi-chart-line empty-icon"></i>
          <span>No comparison data available</span>
        </div>
      }
    </div>

    <!-- Growth callout — only shown when growth data exists -->
    @if (growthSummary()) {
      <div class="growth-callout" [class.positive]="growthSummary()!.avg >= 0"
                                  [class.negative]="growthSummary()!.avg < 0">
        <i class="pi {{ growthSummary()!.avg >= 0 ? 'pi-trending-up' : 'pi-trending-down' }}"></i>
        <span>
          Average growth of
          <strong>{{ growthSummary()!.avg >= 0 ? '+' : '' }}{{ growthSummary()!.avg.toFixed(1) }}%</strong>
          over {{ growthSummary()!.months }} active month{{ growthSummary()!.months !== 1 ? 's' : '' }}
        </span>
      </div>
    }

    <!-- Footer -->
    <div class="chart-footer">
      <div class="footer-note">
        <i class="pi pi-info-circle"></i>
        Solid line = {{ selectedYear }} · Dashed = {{ selectedYear - 1 }} · Growth % on right axis
      </div>
      <div class="footer-period">YoY {{ selectedYear - 1 }} → {{ selectedYear }}</div>
    </div>

  </div>
</div>
  `,
  styles: [`
:host { display: block; width: 100%; }

.yoy-root {
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
  position: absolute; border-radius: 50%;
  filter: blur(90px); opacity: 0.07;
}
.amb-1 {
  width: 360px; height: 360px; top: -120px; left: -80px;
  background: #42A5F5;
  animation: float 13s ease-in-out infinite;
}
.amb-2 {
  width: 280px; height: 280px; bottom: -80px; right: -60px;
  background: #66BB6A;
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
.yoy-header {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}
.header-left { display: flex; align-items: center; gap: var(--spacing-md); }
.title-badge {
  width: 40px; height: 40px;
  border-radius: var(--ui-border-radius);
  background: var(--accent-focus); color: var(--accent-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-lg); flex-shrink: 0;
}
.yoy-title {
  font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);
  color: var(--text-primary); margin: 0 0 2px; line-height: var(--line-height-tight);
}
.yoy-subtitle {
  font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0;
  letter-spacing: 0.04em; text-transform: uppercase; font-weight: var(--font-weight-medium);
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
  color: var(--text-secondary); font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium); font-family: var(--font-body);
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

/* ── KPI Strip ── */
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
.kpi-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.kpi-label {
  font-size: var(--font-size-xs); color: var(--text-tertiary);
  font-weight: var(--font-weight-medium); text-transform: uppercase; letter-spacing: 0.05em;
}
.kpi-value {
  font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);
  color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.kpi-badge {
  display: flex; align-items: center; gap: 3px;
  font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
  padding: 3px 8px; border-radius: var(--ui-border-radius-pill); white-space: nowrap;
  &.positive { background: rgba(102,187,106,0.12); color: #66BB6A; }
  &.negative { background: rgba(244,67,54,0.12);  color: #f44336; }
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
  background: var(--bg-secondary); border-radius: var(--ui-border-radius-pill);
  cursor: pointer; transition: var(--transition-fast);
  &:hover { background: var(--component-bg-hover); }
  &.off { opacity: 0.35; }
}
.ds-swatch {
  width: 16px; height: 3px; border-radius: 2px; flex-shrink: 0;
  display: inline-block;
}
.ds-name { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--text-secondary); }
.ds-axis-tag {
  font-size: var(--font-size-xs); color: var(--text-tertiary);
  background: var(--bg-primary); border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-pill); padding: 0 6px; font-style: italic;
}

/* Axis hint */
.axis-hint { display: flex; gap: var(--spacing-xl); margin-bottom: var(--spacing-md); flex-wrap: wrap; }
.axis-hint-item {
  display: flex; align-items: center; gap: var(--spacing-sm);
  font-size: var(--font-size-xs); color: var(--text-tertiary);
}
.axis-mark { display: inline-block; width: 24px; height: 3px; border-radius: 2px; flex-shrink: 0; }

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

/* Growth callout */
.growth-callout {
  display: flex; align-items: center; gap: var(--spacing-md);
  margin-top: var(--spacing-lg); padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--ui-border-radius); font-size: var(--font-size-sm);
  &.positive { background: rgba(102,187,106,0.08); color: #66BB6A; border: 1px solid rgba(102,187,106,0.2); }
  &.negative { background: rgba(244,67,54,0.08);  color: #f44336; border: 1px solid rgba(244,67,54,0.2);  }
  strong { font-weight: var(--font-weight-bold); }
}

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
export class YoyGrowthChartComponent implements OnInit, OnDestroy {

  chartData = signal<any>(null);
  loading = signal(false);
  chartOptions: any;

  availableYears = [2024, 2025, 2026];
  selectedYear = new Date().getFullYear();

  // Toggles — line swatches shown as lines (not dots), dashed for prior year
  datasetToggles = [
    { key: 'current', label: `${this.selectedYear}`, color: '#42A5F5', visible: true, dashed: false, isSecondAxis: false },
    { key: 'prior', label: `${this.selectedYear - 1}`, color: '#BDBDBD', visible: true, dashed: true, isSecondAxis: false },
    { key: 'growth', label: 'Growth %', color: '#66BB6A', visible: true, dashed: false, isSecondAxis: true },
  ];

  kpis = signal<any[]>([]);
  growthSummary = signal<{ avg: number; months: number } | null>(null);

  visibleChartData = computed(() => {
    const raw = this.chartData();
    if (!raw) return null;
    const datasets = raw.datasets.filter((_: any, i: number) => this.datasetToggles[i]?.visible);
    return { labels: raw.labels, datasets };
  });

  private destroy$ = new Subject<void>();

  constructor(private chartService: ChartService) { }

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
    // Update toggle labels to reflect new year selection
    this.datasetToggles[0].label = `${y}`;
    this.datasetToggles[1].label = `${y - 1}`;
    this.loadData();
  }

  toggleDataset(ds: (typeof this.datasetToggles)[0]): void {
    ds.visible = !ds.visible;
    this.chartData.set({ ...this.chartData() });
  }

  loadData(): void {
    this.loading.set(true);
    this.chartService
      .getYoYGrowth({ year: this.selectedYear })
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
      const isGrowth = ds.yAxisID === 'y1';
      const isPrior = ds.borderDash?.length > 0;

      return {
        ...ds,
        type: ds.type ?? 'line',
        borderWidth: isGrowth ? 2 : isPrior ? 1.5 : 2.5,
        borderDash: ds.borderDash ?? [],
        pointRadius: isGrowth ? 3 : isPrior ? 2 : 4,
        pointHoverRadius: isGrowth ? 5 : 7,
        pointBackgroundColor: ds.borderColor,
        pointBorderColor: '#fff',
        pointBorderWidth: isPrior ? 0 : 2,
        backgroundColor: isGrowth
          ? 'rgba(102,187,106,0.08)'
          : isPrior
            ? 'transparent'
            : 'rgba(66,165,245,0.08)',
        fill: isGrowth || (!isPrior && !isGrowth) ? false : false,
        tension: 0.4,
        spanGaps: false, // null gaps remain broken — shows missing data clearly
      };
    });

    this.chartData.set({ labels: data.labels, datasets: enhanced });

    // KPIs
    const currentDs = data.datasets[0];
    const priorDs = data.datasets[1];
    const growthDs = data.datasets[2];

    const sum = (arr: any): number => {
      if (!arr || !Array.isArray(arr)) return 0;
      return arr.reduce((acc: number, val: any) => acc + (val || 0), 0);
    };

    const curRev = sum(currentDs?.data);
    const priRev = sum(priorDs?.data);

    const growthVals: number[] = (growthDs?.data || []).filter((v: any): v is number => v !== null && v !== 0);
    const avgGrowth: number | null = growthVals.length
      ? growthVals.reduce((a, b) => a + b, 0) / growthVals.length
      : null;

    this.kpis.set([
      {
        label: `${this.selectedYear} Revenue`,
        formatted: this.formatINR(curRev),
        icon: 'pi-calendar',
        swatchBg: 'rgba(66,165,245,0.12)', swatchColor: '#42A5F5',
        badge: undefined,
      },
      {
        label: `${this.selectedYear - 1} Revenue`,
        formatted: this.formatINR(priRev),
        icon: 'pi-history',
        swatchBg: 'rgba(189,189,189,0.12)', swatchColor: '#BDBDBD',
        badge: undefined,
      },
      {
        label: 'Avg Growth',
        formatted: avgGrowth !== null ? (avgGrowth >= 0 ? '+' : '') + avgGrowth.toFixed(1) + '%' : '—',
        icon: 'pi-chart-line',
        swatchBg: avgGrowth !== null && avgGrowth >= 0
          ? 'rgba(102,187,106,0.12)' : 'rgba(244,67,54,0.12)',
        swatchColor: avgGrowth !== null && avgGrowth >= 0 ? '#66BB6A' : '#f44336',
        badge: avgGrowth !== null ? avgGrowth : undefined,
      },
    ]);

    this.growthSummary.set(
      growthVals.length
        ? { avg: avgGrowth!, months: growthVals.length }
        : null
    );
  }

  formatINR(val: number): string {
    if (val >= 1_00_00_000) return '₹' + (val / 1_00_00_000).toFixed(2) + ' Cr';
    if (val >= 1_00_000) return '₹' + (val / 1_00_000).toFixed(2) + ' L';
    if (val >= 1_000) return '₹' + (val / 1_000).toFixed(1) + 'k';
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
              if (ctx.parsed.y == null) return null; // skip null growth points
              if (ctx.dataset.yAxisID === 'y1') {
                return ` ${lbl}: ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(1)}%`;
              }
              return ` ${lbl}: ${this.formatINR(ctx.parsed.y)}`;
            },
            // Filter out null tooltip entries cleanly
            afterLabel: () => null,
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tick, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: grid, drawBorder: false },
          border: { display: false, dash: [4, 4] },
          ticks: {
            color: tick, font: { size: 10 },
            callback: (v: number) => this.formatINR(v),
          },
          title: { display: true, text: 'Revenue (₹)', color: tick, font: { size: 10 } },
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#66BB6A', // Growth axis — data colour, fixed
            font: { size: 10 },
            callback: (v: number) => (v >= 0 ? '+' : '') + v + '%',
          },
          title: { display: true, text: 'Growth %', color: '#66BB6A', font: { size: 10 } },
        }
      }
    };
  }
}
