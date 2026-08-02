import { Component, OnInit, signal, computed, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { DataGridComponent, GridColumn } from '../../shared/ui/grid';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-branch-comparison',
  standalone: true,
  imports: [
    TooltipModule,
    ProgressSpinnerModule,
    DataGridComponent,
    UniversalFilterComponent
  ],
  template: `
<div class="branch-root">

  <!-- ══════════════════════════════════════
       HEADER
  ═══════════════════════════════════════ -->
  <div class="page-header">
    <div>
      <h2 class="page-title">Network Performance</h2>
      <p class="page-sub">
        Comparative analysis across {{ comparison()?.total || 0 }} operational branches
      </p>
    </div>
    <button class="export-btn" pTooltip="Export Report" tooltipPosition="bottom">
      <i class="pi pi-download"></i>
      <span>Export Report</span>
    </button>
  </div>

  <!-- ══════════════════════════════════════
       FILTER BAR
  ═══════════════════════════════════════ -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="branch-comparison"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- ══════════════════════════════════════
       LOADING OVERLAY
  ═══════════════════════════════════════ -->
  @if (loading()) {
    <div class="load-overlay">
      <p-progressSpinner styleClass="w-14 h-14" strokeWidth="3"></p-progressSpinner>
    </div>
  }

  <!-- ══════════════════════════════════════
       CONTENT
  ═══════════════════════════════════════ -->
  @if (!loading() && comparison()) {

    <!-- KPI cards -->
    <div class="kpi-strip">

      <!-- Top performer -->
      <div class="kpi-card kpi-card--leader">
        <div class="bg-trophy" aria-hidden="true"><i class="pi pi-trophy"></i></div>
        <span class="card-badge card-badge--success">Top Performer</span>
        <h3 class="card-name">{{ comparison()?.topPerformer?.branchName || '—' }}</h3>
        <div class="card-metrics">
          <div class="metric">
            <span class="metric-label">Revenue</span>
            <span class="metric-value metric-value--success">
              {{ commonService.formatCurrency(comparison()?.topPerformer?.revenue) }}
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">Invoices</span>
            <span class="metric-value">{{ comparison()?.topPerformer?.invoiceCount }}</span>
          </div>
        </div>
      </div>

      <!-- Lowest performer (only shown when data present) -->
      @if (comparison()?.lowestPerformer) {
        <div class="kpi-card kpi-card--opportunity">
          <span class="card-badge card-badge--warning">Growth Opportunity</span>
          <h3 class="card-name">{{ comparison()?.lowestPerformer?.branchName || '—' }}</h3>
          <div class="card-footer-row">
            <span class="card-rev-warning">
              {{ commonService.formatCurrency(comparison()?.lowestPerformer?.revenue) }}
            </span>
            <span class="card-footer-label">Needs optimisation</span>
          </div>
        </div>
      }

      <!-- Network summary -->
      <div class="kpi-card kpi-card--summary">
        <div class="summary-head">
          <span class="widget-label">Network Reach</span>
          <i class="pi pi-chart-pie summary-icon"></i>
        </div>
        <div class="summary-rows">
          <div class="summary-row">
            <span class="sr-label">Avg. Basket Size</span>
            <span class="sr-value">
              {{ commonService.formatCurrency(comparison()?.topPerformer?.avgBasketValue) }}
            </span>
          </div>
          <div class="summary-row summary-row--border">
            <span class="sr-label">Active Outlets</span>
            <span class="sr-value sr-value--accent">{{ comparison()?.total || 0 }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Revenue distribution bar chart -->
    <div class="dist-card">
      <h3 class="section-title">Revenue Distribution</h3>
      <div class="dist-rows">
        @for (branch of topBranches(); track branch._id) {
          <div class="dist-row">
            <span class="dist-label">{{ branch.branchName }}</span>
            <div class="dist-track">
              <div class="dist-fill"
                   [style.width.%]="getPercentage(branch.revenue)"
                   [class.dist-fill--top]="branch._id === comparison()?.topPerformer?._id">
              </div>
            </div>
            <span class="dist-value">{{ commonService.formatCurrency(branch.revenue) }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Detailed grid -->
    <div class="grid-panel">
      <div class="grid-head">
        <h3 class="grid-title">Detailed Breakdown</h3>
      </div>
      <div class="grid-body">
        <app-data-grid [viewOnly]="true" [pagination]="true" [enableExport]="true"
          [columns]="branchColumns"
          [data]="comparison()?.branches || []"
          class="fill-grid">
        </app-data-grid>
      </div>
    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   BRANCH COMPARISON — TOKEN-DRIVEN
   Note on loading overlay background: rgba(255,255,255,0.7) is
   intentionally a fixed light overlay — it sits on top of the
   rendered content to block interaction and must be opaque
   enough to obscure content. In dark mode the component's
   background is already --bg-primary which will show through
   appropriately. Alternatively wire to a theme-aware rgba if
   your token system exposes one.
   ============================================================ */

:host { display: block; width: 100%; }

.branch-root {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ══════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-tight);
}

.page-sub {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
  height: 32px;
  padding: 0 var(--spacing-lg);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-body);
  transition: var(--transition-base);
  flex-shrink: 0;

  &:hover {
    background: var(--component-bg-hover);
    color: var(--accent-primary);
    border-color: var(--border-secondary);
  }
}

/* ══════════════════════════════════════════════════════════
   FILTER BAR
   ══════════════════════════════════════════════════════════ */
.filter-bar { flex-shrink: 0; }

/* ══════════════════════════════════════════════════════════
   LOADING OVERLAY
   ══════════════════════════════════════════════════════════ */
.load-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(3px);
  border-radius: var(--radius-2xl);
}

/* ══════════════════════════════════════════════════════════
   KPI STRIP
   ══════════════════════════════════════════════════════════ */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

/* Shared card base */
.kpi-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-md);
  min-height: 150px;
  position: relative;
  overflow: hidden;

  /* Leader gets a subtle tinted background */
  &--leader {
    background: var(--bg-secondary);
    border-color: var(--color-success-border);
  }

  &--opportunity {
    background: var(--bg-secondary);
  }

  &--summary {
    background: var(--bg-primary);
  }
}

/* Trophy watermark */
.bg-trophy {
  position: absolute;
  bottom: -12px;
  right: -12px;
  opacity: 0.07;
  pointer-events: none;

  i { font-size: 5rem; color: var(--color-success); }
}

/* Badges */
.card-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);

  &--success {
    background: var(--color-success-bg);
    color: var(--color-success);
    border: var(--ui-border-width) solid var(--color-success-border);
  }

  &--warning {
    background: var(--color-warning-bg);
    color: var(--color-warning);
    border: var(--ui-border-width) solid var(--color-warning-border);
  }
}

.card-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-normal);
}

/* Card metrics row */
.card-metrics {
  display: flex;
  gap: var(--spacing-xl);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.metric-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}

.metric-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);

  &--success { color: var(--color-success); }
}

/* Opportunity card footer */
.card-footer-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.card-rev-warning {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-warning);
}

.card-footer-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Summary card */
.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

.summary-icon {
  font-size: var(--font-size-base);
  color: var(--text-tertiary);
}

.summary-rows { display: flex; flex-direction: column; }

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  &--border {
    border-top: var(--ui-border-width) solid var(--border-primary);
    margin-top: var(--spacing-xs);
  }
}

.sr-label { color: var(--text-secondary); }

.sr-value {
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--text-primary);

  &--accent { color: var(--accent-primary); }
}

/* ══════════════════════════════════════════════════════════
   DISTRIBUTION BAR CHART
   ══════════════════════════════════════════════════════════ */
.dist-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-lg) 0;
}

.dist-rows { display: flex; flex-direction: column; gap: var(--spacing-md); }

.dist-row {
  display: grid;
  grid-template-columns: 150px 1fr 90px;
  align-items: center;
  gap: var(--spacing-md);
}

.dist-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dist-track {
  height: 6px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: var(--ui-border-radius-pill);
  transition: width 1s var(--transition-slow);

  &--top { background: var(--color-success); }
}

.dist-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-align: right;
}

/* ══════════════════════════════════════════════════════════
   GRID PANEL
   ══════════════════════════════════════════════════════════ */
.grid-panel {
  display: flex;
  flex-direction: column;
  height: 480px;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.grid-head {
  flex-shrink: 0;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
}

.grid-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;
}

/* AgGrid needs a positioned parent */
.grid-body {
  flex: 1;
  position: relative;
  min-height: 0;
}

.fill-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
  `]
})
export class BranchComparisonComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  comparison = signal<any>(null);
  loading = signal(false);
  branchColumns: GridColumn[] = [];

  private currentFilters: Record<string, any> = {};

  topBranches = computed(() => {
    const branches: any[] = this.comparison()?.branches ?? [];
    return [...branches].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  });

  filterConfig: FilterField[] = [
    { key: 'date', label: 'Period', type: 'date-range' },
    {
      key: 'groupBy',
      label: 'Sort By',
      type: 'select',
      staticOptions: [
        { label: 'Revenue', value: 'revenue' },
        { label: 'Invoices', value: 'invoiceCount' }
      ],
      defaultValue: 'revenue'
    }
  ];

  private analyticsService = inject(AdminAnalyticsService);
  public commonService = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.setupColumns();
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const [startDate, endDate] = this.resolveDateRange();

    this.analyticsService.getBranchComparison(
      startDate,
      endDate,
      this.currentFilters['groupBy'] ?? 'revenue',
      50
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') this.comparison.set(res.data.comparison);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private resolveDateRange(): [string | undefined, string | undefined] {
    const start = this.currentFilters['startDate'] ?? this.currentFilters['date']?.[0];
    const end = this.currentFilters['endDate'] ?? this.currentFilters['date']?.[1];
    return [this.toIsoDate(start), this.toIsoDate(end)];
  }

  private toIsoDate(value: any): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  getPercentage(value: number): number {
    const top = this.comparison()?.topPerformer?.revenue || 1;
    return (value / top) * 100;
  }

  setupColumns(): void {
    this.branchColumns = [
      {
        field: 'branchName',
        header: 'Branch',
        minWidth: '180px',
        flex: 1,
        formatter: (val: any, row: any) => {
          const isTop = this.comparison()?.topPerformer?._id === row._id;
          const star = isTop
            ? `<i class="pi pi-star-fill" style="color:var(--color-warning);font-size:var(--font-size-xs);"></i>`
            : '';
          return `<div style="display:flex;align-items:center;gap:8px;height:100%;font-weight:var(--font-weight-semibold);color:var(--text-primary);">
                    ${star}${val}
                  </div>`;
        }
      },
      {
        header: 'Performance',
        field: 'revenue',
        width: '140px',
        formatter: (val: any, row: any) => {
          const pct = this.getPercentage(val).toFixed(0);
          const isTop = this.comparison()?.topPerformer?._id === row._id;
          const color = isTop ? 'var(--color-success)' : 'var(--accent-primary)';
          return `<div style="display:flex;align-items:center;gap:8px;height:100%;">
                    <div style="flex:1;height:4px;background:var(--bg-ternary);border-radius:var(--ui-border-radius-pill);">
                      <div style="width:${pct}%;height:100%;background:${color};border-radius:var(--ui-border-radius-pill);"></div>
                    </div>
                    <span style="font-size:var(--font-size-xs);color:var(--text-secondary);width:28px;text-align:right;">${pct}%</span>
                  </div>`;
        }
      },
      {
        field: 'revenue',
        header: 'Revenue',
        width: '140px',
        align: 'right',
        formatter: (val: any) => `<div style="font-weight:var(--font-weight-semibold);font-family:var(--font-mono);text-align:right;color:var(--text-primary);width:100%;">${this.commonService.formatCurrency(val)}</div>`
      },
      {
        field: 'invoiceCount',
        header: 'Orders',
        width: '100px',
        align: 'right',
        formatter: (val: any) => `<div style="color:var(--text-secondary);text-align:right;width:100%;">${val || 0}</div>`
      },
      {
        field: 'avgBasketValue',
        header: 'Avg. Basket',
        width: '130px',
        align: 'right',
        formatter: (val: any) => `<div style="color:var(--accent-primary);font-family:var(--font-mono);text-align:right;font-size:var(--font-size-xs);width:100%;">${this.commonService.formatCurrency(val)}</div>`
      }
    ];
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
