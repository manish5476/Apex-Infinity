import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';

import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ChartService, SalesDistributionQuery } from '../chart.service';

interface DistItem {
  label: string;
  value: number;
  color: string;
  pct: number;
  formatted: string;
}

@Component({
  selector: 'app-sales-distribution-chart',
  standalone: true,
  imports: [ChartModule, TooltipModule],
  template: `
<div class="sd-root">
  <div class="ambient" aria-hidden="true">
    <div class="amb-blob amb-1"></div>
    <div class="amb-blob amb-2"></div>
    <div class="amb-grid"></div>
  </div>

  <!-- ── Header ── -->
  <div class="sd-header">
    <div class="header-left">
      <div class="title-badge"><i class="pi pi-chart-pie"></i></div>
      <div>
        <h2 class="sd-title">Sales Distribution</h2>
        <p class="sd-subtitle">Breakdown by {{ groupByLabel() }}</p>
      </div>
    </div>

    <div class="header-controls">

      <!-- GroupBy -->
      <div class="control-group">
        <label class="ctrl-label">Group by</label>
        <div class="seg-ctrl">
          @for (g of groupByOptions; track g.value) {
            <button class="seg-btn" [class.active]="selectedGroupBy === g.value"
                    (click)="onGroupByChange(g.value)">{{ g.label }}</button>
          }
        </div>
      </div>

      <!-- Date range quick-picks -->
      <div class="control-group">
        <label class="ctrl-label">Period</label>
        <div class="seg-ctrl">
          @for (p of periods; track p.label) {
            <button class="seg-btn" [class.active]="selectedPeriod === p.label"
                    (click)="onPeriodChange(p)">{{ p.label }}</button>
          }
        </div>
      </div>

      <!-- Chart type toggle -->
      <div class="control-group">
        <label class="ctrl-label">View</label>
        <div class="seg-ctrl">
          <button class="seg-btn" [class.active]="chartType === 'doughnut'"
                  (click)="chartType = 'doughnut'; rebuildChart()" pTooltip="Doughnut">
            <i class="pi pi-circle"></i>
          </button>
          <button class="seg-btn" [class.active]="chartType === 'pie'"
                  (click)="chartType = 'pie'; rebuildChart()" pTooltip="Pie">
            <i class="pi pi-chart-pie"></i>
          </button>
        </div>
      </div>

      <button class="icon-btn" (click)="loadData()" [disabled]="loading()"
              pTooltip="Refresh" tooltipPosition="left">
        <i class="pi pi-refresh" [class.spin]="loading()"></i>
      </button>
    </div>
  </div>

  <!-- ── Body: chart + legend side-by-side ── -->
  <div class="sd-body">

    <!-- Left: doughnut/pie -->
    <div class="chart-panel">
      <div class="chart-wrap">
        @if (loading()) {
          <div class="loader-overlay">
            <div class="loader-ring"></div>
            <span class="loader-txt">Loading distribution…</span>
          </div>
        }
        @if (!loading() && chartData()) {
          <!-- centre label for doughnut -->
          @if (chartType === 'doughnut') {
            <div class="donut-centre">
              <span class="centre-val">{{ formatINR(totalRevenue()) }}</span>
              <span class="centre-lbl">Total</span>
            </div>
          }
          <p-chart [type]="chartType" [data]="chartData()!"
                   [options]="chartOptions" height="100%" width="100%">
          </p-chart>
        }
        @if (!loading() && !chartData()) {
          <div class="empty-state">
            <i class="pi pi-chart-pie empty-icon"></i>
            <span>No distribution data</span>
          </div>
        }
      </div>
    </div>

    <!-- Right: ranked legend + bars -->
    <div class="legend-panel">

      <!-- Total KPI -->
      <div class="total-kpi">
        <span class="total-label">Total Revenue</span>
        <span class="total-value">{{ formatINR(totalRevenue()) }}</span>
        <span class="total-items">{{ items().length }} segments</span>
      </div>

      <div class="legend-list">
        @for (item of items(); track item.label; let i = $index) {
          <div class="legend-row" [class.active]="hoveredIndex() === i"
               (mouseenter)="onRowHover(i)" (mouseleave)="onRowHover(-1)">

            <div class="rank-badge">{{ i + 1 }}</div>

            <div class="row-body">
              <div class="row-top">
                <div class="row-label-wrap">
                  <span class="color-dot" [style.background]="item.color"></span>
                  <span class="row-label">{{ item.label }}</span>
                </div>
                <div class="row-meta">
                  <span class="row-pct" [style.color]="item.color">{{ item.pct.toFixed(1) }}%</span>
                  <span class="row-val">{{ item.formatted }}</span>
                </div>
              </div>
              <!-- Progress bar -->
              <div class="progress-track">
                <div class="progress-fill"
                     [style.width.%]="item.pct"
                     [style.background]="item.color">
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Concentration insight -->
      @if (concentrationNote()) {
        <div class="insight-chip">
          <i class="pi pi-lightbulb"></i>
          {{ concentrationNote() }}
        </div>
      }
    </div>

  </div>

  <!-- Footer -->
  <div class="sd-footer">
    <div class="footer-note">
      <i class="pi pi-info-circle"></i>
      Grouped by {{ groupByLabel() }} · {{ selectedPeriod }}
    </div>
    <div class="footer-period">{{ selectedPeriod }}</div>
  </div>
</div>
  `,
  styles: [`
:host { display: block; width: 100%; }

.sd-root {
  position: relative; padding: var(--spacing-xl);
  border-radius: var(--ui-border-radius-lg); background: var(--bg-secondary);
  font-family: var(--font-body); overflow: hidden; container-type: inline-size;
}

/* ── Ambient ── */
.ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.amb-blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.07; }
.amb-1 { width: 400px; height: 400px; top: -140px; left: -100px; background: #42A5F5; animation: float 14s ease-in-out infinite; }
.amb-2 { width: 300px; height: 300px; bottom: -80px; right: -60px; background: #AB47BC; animation: float 11s ease-in-out infinite reverse; }
.amb-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(var(--border-primary) 1px, transparent 1px),
                    linear-gradient(90deg, var(--border-primary) 1px, transparent 1px);
  background-size: 40px 40px; opacity: 0.28;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}
@keyframes float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,30px) scale(1.05); } }

/* ── Header ── */
.sd-header {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);
}
.header-left { display: flex; align-items: center; gap: var(--spacing-md); }
.title-badge {
  width: 40px; height: 40px; border-radius: var(--ui-border-radius);
  background: var(--accent-focus); color: var(--accent-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-lg); flex-shrink: 0;
}
.sd-title    { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0 0 2px; line-height: var(--line-height-tight); }
.sd-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; letter-spacing: 0.04em; text-transform: uppercase; font-weight: var(--font-weight-medium); }

.header-controls { display: flex; align-items: center; gap: var(--spacing-md); flex-wrap: wrap; }
.control-group   { display: flex; flex-direction: column; gap: var(--spacing-xs); }
.ctrl-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; padding-left: 2px; }
.seg-ctrl {
  display: flex; gap: 2px; padding: 2px;
  background: var(--bg-primary); border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
}
.seg-btn {
  padding: 4px 10px; border: none; background: transparent; color: var(--text-secondary);
  font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); font-family: var(--font-body);
  border-radius: calc(var(--ui-border-radius) - 2px); cursor: pointer; transition: var(--transition-fast); white-space: nowrap;
  &:hover  { background: var(--component-bg-hover); color: var(--text-primary); }
  &.active { background: var(--accent-primary); color: #fff; }
}
.icon-btn {
  width: 34px; height: 34px; align-self: flex-end;
  border: var(--ui-border-width) solid var(--border-primary); background: var(--bg-primary);
  color: var(--text-secondary); border-radius: var(--ui-border-radius); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: var(--font-size-base); transition: var(--transition-fast);
  &:hover:not(:disabled) { background: var(--component-bg-hover); color: var(--accent-primary); border-color: var(--border-secondary); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}
.spin { animation: spin-anim 0.8s linear infinite; }
@keyframes spin-anim { to { transform: rotate(360deg); } }

/* ── Body ── */
.sd-body {
  position: relative; z-index: 1;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-xl);
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);

  @container (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

/* Chart panel */
.chart-panel { display: flex; align-items: center; justify-content: center; }
.chart-wrap  { position: relative; width: 280px; height: 280px; flex-shrink: 0; }

/* Doughnut centre label */
.donut-centre {
  position: absolute; inset: 0; z-index: 2;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}
.centre-val {
  font-size: var(--font-size-xl); font-weight: var(--font-weight-bold);
  color: var(--text-primary); line-height: 1;
}
.centre-lbl {
  font-size: var(--font-size-xs); color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px;
}

/* Loader / empty */
.loader-overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: var(--spacing-md);
  background: color-mix(in srgb, var(--bg-primary) 85%, transparent 15%);
  backdrop-filter: blur(4px); border-radius: 50%; z-index: 5;
}
.loader-ring { width: 36px; height: 36px; border: 3px solid var(--border-primary); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin-anim 0.8s linear infinite; }
.loader-txt  { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: var(--font-weight-medium); }
.empty-state { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-sm); color: var(--text-tertiary); font-size: var(--font-size-sm); }
.empty-icon  { font-size: 2.5rem; opacity: 0.3; }

/* ── Legend panel ── */
.legend-panel {
  display: flex; flex-direction: column; gap: var(--spacing-md);
  min-width: 0;
}

.total-kpi {
  display: flex; align-items: baseline; gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  flex-wrap: wrap;
}
.total-label { font-size: var(--font-size-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; font-weight: var(--font-weight-semibold); }
.total-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.total-items { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-left: auto; }

/* Legend rows */
.legend-list { display: flex; flex-direction: column; gap: var(--spacing-sm); flex: 1; }

.legend-row {
  display: flex; align-items: center; gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--ui-border-radius);
  cursor: default; transition: var(--transition-fast);
  &:hover, &.active { background: var(--component-bg-hover); }
}

.rank-badge {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--bg-secondary); border: var(--ui-border-width) solid var(--border-primary);
  font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
  color: var(--text-tertiary); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.row-body  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.row-top   { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-sm); }

.row-label-wrap { display: flex; align-items: center; gap: var(--spacing-sm); min-width: 0; }
.color-dot      { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.row-label      { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.row-meta { display: flex; align-items: center; gap: var(--spacing-md); flex-shrink: 0; }
.row-pct  { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); }
.row-val  { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-medium); }

/* Progress bar */
.progress-track {
  height: 4px; background: var(--bg-secondary);
  border-radius: var(--ui-border-radius-pill); overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: var(--ui-border-radius-pill);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Insight chip */
.insight-chip {
  display: flex; align-items: center; gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--accent-focus); color: var(--accent-primary);
  border: var(--ui-border-width) solid color-mix(in srgb, var(--accent-primary) 20%, transparent 80%);
  border-radius: var(--ui-border-radius); font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

/* ── Footer ── */
.sd-footer {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  margin-top: var(--spacing-lg); gap: var(--spacing-md); flex-wrap: wrap;
}
.footer-note { font-size: var(--font-size-xs); color: var(--text-tertiary); display: flex; align-items: center; gap: var(--spacing-xs); }
.footer-period { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--text-secondary); background: var(--bg-primary); border: var(--ui-border-width) solid var(--border-primary); padding: 3px 10px; border-radius: var(--ui-border-radius-pill); }
  `]
})
export class SalesDistributionChartComponent implements OnInit, OnDestroy {

  chartData    = signal<any>(null);
  loading      = signal(false);
  items        = signal<DistItem[]>([]);
  hoveredIndex = signal(-1);
  chartType: 'doughnut' | 'pie' = 'doughnut';
  chartOptions: any;

  groupByOptions = [
    { label: 'Category', value: 'category' },
    { label: 'Brand',    value: 'brand'    },
    { label: 'Branch',   value: 'branch'   },
    { label: 'Rep',      value: 'salesRep' },
  ];
  selectedGroupBy = 'category';

  // Quick period helpers
  periods = this.buildPeriods();
  selectedPeriod = 'This Year';

  private currentQuery: SalesDistributionQuery = {};
  private destroy$ = new Subject<void>();

  constructor(private chartService: ChartService) {}

  ngOnInit()    { this.buildOptions(); this.loadData(); }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  groupByLabel = computed(() =>
    this.groupByOptions.find(g => g.value === this.selectedGroupBy)?.label ?? this.selectedGroupBy
  );

  totalRevenue = computed(() =>
    this.items().reduce((s, i) => s + i.value, 0)
  );

  concentrationNote = computed(() => {
    const its = this.items();
    if (!its.length) return null;
    const top1pct = its[0]?.pct ?? 0;
    const top2pct = (its[0]?.pct ?? 0) + (its[1]?.pct ?? 0);
    if (top1pct >= 60) return `${its[0].label} alone drives ${top1pct.toFixed(0)}% of revenue.`;
    if (top2pct >= 70) return `Top 2 segments account for ${top2pct.toFixed(0)}% of revenue.`;
    if (its.length >= 4 && its[its.length - 1].pct < 5)
      return `Bottom segment contributes only ${its[its.length - 1].pct.toFixed(1)}% — consider consolidation.`;
    return null;
  });

  onGroupByChange(val: string) {
    this.selectedGroupBy = val;
    this.currentQuery = { ...this.currentQuery, groupBy: val };
    this.loadData();
  }

  onPeriodChange(p: { label: string; startDate: string; endDate: string }) {
    this.selectedPeriod  = p.label;
    this.currentQuery    = { ...this.currentQuery, startDate: p.startDate, endDate: p.endDate };
    this.loadData();
  }

  onRowHover(idx: number) { this.hoveredIndex.set(idx); }

  rebuildChart() {
    // Trigger re-render by cloning data (type change needs new reference)
    this.chartData.set(this.chartData() ? { ...this.chartData() } : null);
  }

  loadData() {
    this.loading.set(true);
    this.chartService.getSalesDistribution({ groupBy: this.selectedGroupBy, ...this.currentQuery })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { if (res?.status === 'success') this.process(res.data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  private process(data: any) {
    const rawData   = data.datasets[0]?.data     ?? [];
    const colors    = data.datasets[0]?.backgroundColor ?? [];
    const labels    = data.labels ?? [];
    const total     = rawData.reduce((s: number, v: number) => s + v, 0);

    // Sort descending by value
    const sorted: DistItem[] = labels
      .map((label: string, i: number) => ({
        label,
        value:     rawData[i] ?? 0,
        color:     colors[i]  ?? '#94a3b8',
        pct:       total > 0 ? ((rawData[i] ?? 0) / total) * 100 : 0,
        formatted: this.formatINR(rawData[i] ?? 0),
      }))
      .sort((a: DistItem, b: DistItem) => b.value - a.value);

    this.items.set(sorted);

    // Rebuild chart dataset in sorted order
    this.chartData.set({
      labels: sorted.map(i => i.label),
      datasets: [{
        data:                sorted.map(i => i.value),
        backgroundColor:     sorted.map(i => i.color),
        hoverBackgroundColor:sorted.map(i => i.color),
        hoverOffset:         10,
        borderWidth:         2,
        borderColor:         'var(--bg-primary)',
      }]
    });
  }

  formatINR(val: number): string {
    if (val >= 1_00_00_000) return '₹' + (val / 1_00_00_000).toFixed(2) + ' Cr';
    if (val >= 1_00_000)    return '₹' + (val / 1_00_000).toFixed(2) + ' L';
    if (val >= 1_000)       return '₹' + (val / 1_000).toFixed(1) + 'k';
    return '₹' + val.toFixed(0);
  }

  private buildOptions() {
    this.chartOptions = {
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false }, // custom legend on the right
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.93)',
          titleColor: '#f1f5f9', bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
          padding: 14, cornerRadius: 10, usePointStyle: true, boxPadding: 6,
          callbacks: {
            label: (ctx: any) => {
              const val = ctx.parsed ?? 0;
              const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` ${this.formatINR(val)}  (${pct}%)`;
            }
          }
        }
      }
    };
  }

  private buildPeriods() {
    const now   = new Date();
    const y     = now.getFullYear();
    const pad   = (n: number) => String(n).padStart(2, '0');
    const fmt   = (d: Date)   => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

    const startOfYear  = new Date(y, 0, 1);
    const endOfYear    = new Date(y, 11, 31);
    const startOfMonth = new Date(y, now.getMonth(), 1);
    const endOfMonth   = new Date(y, now.getMonth() + 1, 0);
    const startOfQ     = new Date(y, Math.floor(now.getMonth() / 3) * 3, 1);
    const endOfQ       = new Date(y, Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    const last30start  = new Date(now); last30start.setDate(now.getDate() - 30);

    return [
      { label: 'This Year',  startDate: fmt(startOfYear),  endDate: fmt(endOfYear)    },
      { label: 'This Qtr',   startDate: fmt(startOfQ),     endDate: fmt(endOfQ)       },
      { label: 'This Month', startDate: fmt(startOfMonth), endDate: fmt(endOfMonth)   },
      { label: 'Last 30d',   startDate: fmt(last30start),  endDate: fmt(now)          },
    ];
  }
}
// import { Component, OnInit, signal, computed, inject } from '@angular/core';

// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
// import { ChartService } from '../chart.service';

// // Components
// // import { UniversalFilterComponent } from '../../shared/components/universal-filter/universal-filter.component';
// // import { FilterField } from '../../shared/models/filter-config.interface';

// @Component({
//   selector: 'app-sales-distribution-chart',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ChartModule,
//     ProgressSpinnerModule,
//     ButtonModule,
//     UniversalFilterComponent // <--- Imported
//   ],
//   template: `
//     <div class="distribution-container">

//       <div class="blob blob-1"></div>
//       <div class="blob blob-2"></div>

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'sales-distribution'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <div class="chart-card">

//         <div class="card-header">
//           <div>
//             <h2 class="card-title">
//               <i class="pi pi-chart-pie header-icon"></i>
//               Sales Distribution 
//             </h2>
//             <p class="card-subtitle">
//               Revenue Share by Category & Segmentation
//             </p>
//           </div>
//           <div class="header-actions">
//              <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadDistribution()" [loading]="loading()"></p-button>
//           </div>
//         </div>

//         @if (!loading()) {
//           <div class="content-grid">
            
//             <div class="chart-wrapper">
//               <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
              
//               <div class="center-content">
//                  <span class="center-label">Total Volume</span>
//                  <span class="center-value">₹{{ totalRevenue() | number }}</span>
//               </div>
//             </div>

//             <div class="breakdown-panel">
//                <h4 class="panel-title">Category Breakdown</h4>
               
//                <div class="breakdown-list custom-scrollbar">
//                  @for (label of chartData()?.labels; track label; let i = $index) {
//                    <div class="breakdown-item group">
//                       <div class="item-left">
//                         <div class="dot" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
//                         <span class="item-name">{{ label }}</span>
//                       </div>
//                       <div class="item-right">
//                          <p class="item-value">₹{{ chartData()?.datasets[0].data[i] | number }}</p>
//                          <p class="item-share">
//                            {{ (chartData()?.datasets[0].data[i] / (totalRevenue() || 1) * 100) | number:'1.0-1' }}% Share
//                          </p>
//                       </div>
//                    </div>
//                  }
//                </div>
//             </div>
//           </div>
//         } @else {
//           <div class="loader-container">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p class="loader-text">Slicing Sales Data...</p>
//           </div>
//         }

//       </div>

//       <div class="insight-box">
//          <div class="insight-icon-box">
//            <i class="pi pi-chart-pie"></i>
//          </div>
//          <p class="insight-text">
//            The <span class="highlight">{{ chartData()?.labels?.[0] || 'Top' }}</span> segment represents the majority of your current cycle revenue. 
//            Consider enriching customer profiles to move these transactions into identified categories.
//          </p>
//       </div>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }

//     .distribution-container {
//       position: relative;
//       width: 100%;
//       padding: var(--spacing-sm);
//       overflow: hidden;
//       border-radius: var(--radius-2xl);
//     }
    
//     .filter-section {
//       margin-bottom: var(--spacing-md);
//       position: relative; 
//       z-index: 2;
//     }

//     /* AMBIENT BLOBS */
//     .blob {
//       position: absolute;
//       border-radius: 50%;
//       filter: blur(80px);
//       z-index: 0;
//       opacity: 0.1;
//       pointer-events: none;
//     }
//     .blob-1 {
//       top: -50%; right: -10%; width: 400px; height: 400px;
//       background: var(--accent-primary);
//       animation: pulse-slow 8s infinite;
//     }
//     .blob-2 {
//       bottom: -20%; left: -10%; width: 300px; height: 300px;
//       background: var(--color-info); /* Cyan/Blue */
//       animation: pulse-slow 8s infinite 1s;
//     }

//     @keyframes pulse-slow {
//       0%, 100% { transform: scale(1); opacity: 0.1; }
//       50% { transform: scale(1.1); opacity: 0.15; }
//     }

//     /* MAIN CARD */
//     .chart-card {
//       position: relative;
//       z-index: 1;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-xl);
//       box-shadow: var(--shadow-sm);
//       backdrop-filter: blur(10px);
//     }

//     /* HEADER */
//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: var(--spacing-xl);
//     }

//     .card-title {
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       letter-spacing: -0.01em;
//     }

//     .header-icon { color: var(--accent-primary); }

//     .card-subtitle {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//       margin: 4px 0 0 0;
//     }

//     .header-actions { display: flex; gap: var(--spacing-sm); }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-2xl);
//       align-items: center;
//     }
//     @media (min-width: 768px) {
//       .content-grid { grid-template-columns: 7fr 5fr; } /* Chart 7/12, Breakdown 5/12 */
//     }

//     /* CHART WRAPPER */
//     .chart-wrapper {
//       position: relative;
//       height: 320px;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//     }

//     .center-content {
//       position: absolute;
//       inset: 0;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       pointer-events: none;
//     }

//     .center-label {
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//     }

//     .center-value {
//       font-size: var(--font-size-3xl);
//       font-weight: 900;
//       color: var(--text-primary);
//       letter-spacing: -0.02em;
//       line-height: 1;
//     }

//     /* BREAKDOWN PANEL */
//     .breakdown-panel {
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//       height: 100%;
//     }

//     .panel-title {
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin-bottom: var(--spacing-md);
//     }

//     .breakdown-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//       max-height: 300px;
//       overflow-y: auto;
//       padding-right: 4px;
//     }

//     .breakdown-item {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       padding: var(--spacing-sm) var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//       border: 1px solid var(--border-secondary);
//       background: var(--bg-ternary);
//       transition: background 0.2s;
//     }
//     .breakdown-item:hover { background: var(--component-bg-hover); }

//     .item-left { display: flex; align-items: center; gap: var(--spacing-sm); }
    
//     .dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.1); }
    
//     .item-name {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       color: var(--text-secondary);
//       max-width: 100px;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       transition: color 0.2s;
//     }
//     .breakdown-item:hover .item-name { color: var(--text-primary); }

//     .item-right { text-align: right; }
    
//     .item-value {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       color: var(--text-primary);
//       margin: 0;
//       font-variant-numeric: tabular-nums;
//     }

//     .item-share {
//       font-size: 9px;
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--accent-primary);
//       opacity: 0.8;
//       margin: 0;
//     }

//     /* INSIGHT BOX */
//     .insight-box {
//       margin-top: var(--spacing-lg);
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius-lg);
//       border: 1px dashed var(--accent-secondary);
//       background: var(--accent-focus); /* Low opacity accent bg */
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       position: relative;
//       z-index: 10;
//     }

//     .insight-icon-box {
//       padding: 8px;
//       border-radius: 50%;
//       background: rgba(255,255,255,0.2);
//       color: var(--accent-primary);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     .insight-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.5;
//       margin: 0;
//     }
//     .highlight { font-weight: bold; color: var(--text-primary); }

//     /* LOADER */
//     .loader-container {
//       height: 320px;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//     }

//     /* SCROLLBAR UTILS */
//     .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
//   `]
// })
// export class SalesDistributionChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(false); // Start false, filters handle loading
//   chartOptions: any;

//   // Stored Filters
//   private currentFilters: any = {};

//   // 1. FILTER CONFIG
//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       dataSourceKey: 'branches', // Connects to MasterListService
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'Global Sales'
//     },
//     {
//       key: 'date',
//       label: 'Analysis Period',
//       type: 'date-range'
//     }
//   ];

//   private documentStyle = getComputedStyle(document.documentElement);

//   totalRevenue = computed(() => {
//     const data = this.chartData();
//     if (!data) return 0;
//     return data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0);
//   });

//   constructor(private analyticsService: ChartService) { }

//   ngOnInit() {
//     this.initOptions();
//     // loadDistribution triggered via filter init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadDistribution();
//   }

//   private initOptions() {
//     // Read theme colors
//     const tooltipBg = this.documentStyle.getPropertyValue('--bg-ternary').trim();
//     const tooltipText = this.documentStyle.getPropertyValue('--text-primary').trim();
//     const borderColor = this.documentStyle.getPropertyValue('--border-primary').trim();

//     this.chartOptions = {
//       cutout: '75%',
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           backgroundColor: tooltipBg,
//           titleColor: tooltipText,
//           bodyColor: this.documentStyle.getPropertyValue('--text-secondary').trim(),
//           borderColor: borderColor,
//           borderWidth: 1,
//           padding: 12,
//           cornerRadius: 8,
//           bodyFont: { size: 12, weight: 'bold' },
//           displayColors: true,
//           callbacks: {
//             label: (context: any) => {
//               const label = context.label || '';
//               const value = context.raw;
//               const total = context.chart._metasets[context.datasetIndex].total;
//               const percentage = ((value / total) * 100).toFixed(1) + '%';
//               return ` ${label}: ₹${value.toLocaleString()} (${percentage})`;
//             }
//           }
//         }
//       },
//       maintainAspectRatio: false,
//       animation: {
//         animateScale: true,
//         animateRotate: true,
//         duration: 1000,
//         easing: 'easeOutQuart'
//       },
//       layout: { padding: 20 },
//       elements: {
//         arc: {
//           borderWidth: 0,
//           hoverOffset: 15
//         }
//       }
//     };
//   }

//   loadDistribution() {
//     this.loading.set(true);
//     this.documentStyle = getComputedStyle(document.documentElement);
//     this.initOptions();

//     const params = {
//       startDate: this.currentFilters.startDate,
//       endDate: this.currentFilters.endDate,
//       branchId: this.currentFilters.branchId
//     };

//     setTimeout(() => {
//       this.analyticsService.getSalesDistribution(
//         {
//           startDate: params.startDate,
//           endDate: params.endDate,
//         }
//       ).subscribe({
//         next: (res) => {
//           if (res.status === 'success') {
//             this.processData(res.data);
//           }
//           this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//       });
//     }, 600);
//   }

//   private processData(data: any) {
//     // The data provided in the response already has `labels` and `datasets` structure required for Chart.js
//     // We just need to map it directly.
//     this.chartData.set(data);
//   }
// }
