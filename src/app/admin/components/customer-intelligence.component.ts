import { Component, OnInit, signal, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { DataGridComponent, GridColumn } from '../../shared/ui/grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-customer-intelligence',
  standalone: true,
  imports: [
    TooltipModule,
    ProgressSpinnerModule,
    DataGridComponent,
    UniversalFilterComponent
  ],
  template: `
<div class="ci-root">

  <!-- Filter + refresh row -->
  <div class="filter-row">
    <app-universal-filter
      entityType="customer-intelligence"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)"
      class="filter-grow">
    </app-universal-filter>
    <button class="refresh-btn" (click)="loadData()" [disabled]="loading()" pTooltip="Refresh" tooltipPosition="bottom">
      <i class="pi pi-refresh" [class.spinning]="loading()"></i>
    </button>
  </div>

  <!-- ══════════════════════════════════════
       LOADING
  ═══════════════════════════════════════ -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3"></p-progressSpinner>
      <span class="loader-text">Analysing customer lifecycle patterns…</span>
    </div>
  }

  <!-- ══════════════════════════════════════
       CONTENT
  ═══════════════════════════════════════ -->
  @if (!loading()) {

    <!-- Stats strip -->
    <div class="stats-strip">

      <div class="stat-card">
        <p class="stat-label">Total Portfolio LTV</p>
        <p class="stat-value">{{ commonService.formatCurrency(intelligenceData()?.valueAnalysis?.totalLTV) }}</p>
        <p class="stat-footer">
          Network avg: {{ commonService.formatCurrency(intelligenceData()?.valueAnalysis?.avgLTV) }}
        </p>
      </div>

      <div class="segments-card">
        @for (seg of intelligenceData()?.segmentation; track seg._id) {
          <div class="seg-item">
            <p class="seg-count" [class.seg-count--active]="seg.count > 0">{{ seg.count || 0 }}</p>
            <p class="seg-name">{{ seg._id }}</p>
          </div>
        } @empty {
          <p class="seg-empty">No acquisition data for this period.</p>
        }
      </div>

    </div>

    <!-- Body grid -->
    <div class="body-grid">

      <!-- LTV grid -->
      <div class="panel panel--flush">
        <div class="panel-head">
          <h3 class="panel-title">Top Value Performers (LTV)</h3>
          <span class="panel-meta">
            Top {{ intelligenceData()?.valueAnalysis?.topLTV?.length || 0 }} customers
          </span>
        </div>
        <div class="grid-wrap">
          <app-data-grid [viewOnly]="true" [pagination]="true" [enableExport]="true" class="full-size-grid"
            [columns]="ltvColumns"
            [data]="intelligenceData()?.valueAnalysis?.topLTV || []"
            class="fill-grid">
          </app-data-grid>
        </div>
      </div>

      <!-- Side widgets -->
      <div class="side-col">

        <!-- Credit risk monitor -->
        <div class="panel">
          <div class="panel-head">
            <h4 class="panel-title">Credit Risk Monitor</h4>
            <span class="flag-badge">
              Flagged: {{ intelligenceData()?.riskAnalysis?.creditRisk?.length || 0 }}
            </span>
          </div>

          <div class="risk-list">
            @for (risk of intelligenceData()?.riskAnalysis?.creditRisk; track risk._id) {
              <div class="risk-row">
                <div class="risk-top">
                  <span class="risk-name">{{ risk.name }}</span>
                  <i class="pi pi-exclamation-circle risk-icon"></i>
                </div>
                <div class="risk-detail">
                  <span class="detail-label">Outstanding</span>
                  <span class="detail-value detail-value--error">
                    {{ commonService.formatCurrency(risk.outstandingBalance) }}
                  </span>
                </div>
                <div class="risk-bar"><div class="risk-bar-fill"></div></div>
              </div>
            } @empty {
              <div class="empty-state">
                <i class="pi pi-check-circle empty-icon"></i>
                <p class="empty-title">All Accounts Healthy</p>
                <p class="empty-sub">No high-risk credit exposure.</p>
              </div>
            }
          </div>
        </div>

        <!-- Loyalty intelligence -->
        <div class="panel panel--advisory">
          <h4 class="panel-title panel-title--accent">Loyalty Intelligence</h4>
          @if ((intelligenceData()?.recommendations?.highValue?.length ?? 0) > 0) {
            <p class="advisory-text">
              <i class="pi pi-bolt advisory-icon"></i>
              <strong>{{ intelligenceData()?.recommendations?.highValue[0]?.name }}</strong>
              is your top contributor. Suggest a VIP membership.
            </p>
          } @else {
            <p class="advisory-text advisory-text--muted">
              Generating strategic recommendations…
            </p>
          }
        </div>

        <!-- Payment reliability placeholder -->
        <div class="panel">
          <h4 class="panel-title">Payment Reliability</h4>
          <div class="placeholder-block">
            <i class="pi pi-chart-line placeholder-icon"></i>
            <p class="placeholder-text">
              Payment behaviour scoring is processing for
              {{ currentFilters['branchId'] ? 'selected branch' : 'all branches' }}.
            </p>
          </div>
        </div>

      </div>
    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   CUSTOMER INTELLIGENCE — TOKEN-DRIVEN
   The tier badge colors in setupColumns() (Platinum/Gold/Silver)
   use hardcoded hex because they are data-encoding categorical
   colors that must remain consistent across all themes — they
   are not UI surface colors. All other values use tokens.
   ============================================================ */

:host { display: block; width: 100%; }

.ci-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ── Filter row ── */
.filter-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.filter-grow { flex: 1; }

.refresh-btn {
  width: 32px;
  height: 32px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
  margin-top: 28px; // Aligns with filter input height
  transition: var(--transition-base);

  &:hover:not(:disabled) { background: var(--component-bg-hover); color: var(--accent-primary); }
  &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }
}

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Loader ── */
.loader-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-5xl);
}

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

/* ══════════════════════════════════════════════════════════
   STATS STRIP
   ══════════════════════════════════════════════════════════ */
.stats-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex-shrink: 0;

  @media (min-width: 1024px) { grid-template-columns: 1fr 3fr; }
}

.stat-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
}

.stat-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-sm) 0;
}

.stat-value {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.stat-footer {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  margin: var(--spacing-sm) 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Segments card */
.segments-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.seg-item { text-align: center; }

.seg-count {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-tight);

  &--active { color: var(--accent-primary); }
}

.seg-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0;
}

.seg-empty {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-style: italic;
  text-align: center;
}

/* ══════════════════════════════════════════════════════════
   BODY GRID
   ══════════════════════════════════════════════════════════ */
.body-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;

  @media (min-width: 1024px) { grid-template-columns: 2fr 1fr; }
}

/* ── Shared panel ── */
.panel {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  &--flush {
    padding: 0;
    overflow: hidden;
    min-height: 500px;
  }

  &--advisory {
    border: var(--ui-border-width) dashed var(--accent-primary);
    background: var(--accent-focus);
  }
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

// Flush panel: head has its own padding
.panel--flush .panel-head {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
}

.panel-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;

  &--accent { color: var(--accent-primary); }
}

.panel-meta {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Flagged badge */
.flag-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-error-bg);
  color: var(--color-error);
  border: var(--ui-border-width) solid var(--color-error-border);
}

/* Grid wrap */
.grid-wrap {
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

/* Side column */
.side-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ── Risk list ── */
.risk-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.risk-row {
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--ui-border-radius-sm);
  border: var(--ui-border-width) solid var(--border-primary);
}

.risk-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.risk-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.risk-icon { color: var(--color-error); font-size: var(--font-size-base); }

.risk-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.detail-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }

.detail-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--text-primary);

  &--error { color: var(--color-error); }
}

.risk-bar {
  height: 4px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
}

.risk-bar-fill {
  width: 100%;
  height: 100%;
  background: var(--color-error);
  border-radius: var(--ui-border-radius-pill);
}

/* ── Advisory panel ── */
.advisory-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;

  &--muted { color: var(--text-tertiary); font-style: italic; }
}

.advisory-icon { color: var(--accent-primary); margin-right: var(--spacing-md); }

/* ── Placeholder block ── */
.placeholder-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  opacity: 0.5;
  text-align: center;
  gap: var(--spacing-md);
}

.placeholder-icon { font-size: var(--font-size-2xl); color: var(--accent-primary); }

.placeholder-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin: 0;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  opacity: 0.8;
  gap: var(--spacing-sm);
}

.empty-icon { font-size: var(--font-size-2xl); color: var(--color-success); }
.empty-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
.empty-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
  `]
})
export class CustomerIntelligenceComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  intelligenceData = signal<any>(null);
  loading = signal(false);
  ltvColumns: any[] = [];

  public currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    },
    { key: 'date', label: 'Analysis Period', type: 'date-range' }
  ];

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

    this.analyticsService.getCustomerIntelligence(
      startDate,
      endDate,
      this.currentFilters['branchId']
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') this.intelligenceData.set(res.data);
        this.loading.set(false);
        this.cdr.detectChanges();
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

  setupColumns(): void {
    this.ltvColumns = [
      {
        field: 'name',
        headerName: 'Customer Name',
        flex: 1,
        minWidth: 160,
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)',
          'display': 'flex',
          'align-items': 'center'
        }
      },
      {
        field: '_id',
        headerName: 'System ID',
        width: 120,
        valueFormatter: (p: any) => p.value ? '…' + p.value.slice(-8) : '—',
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'color': 'var(--text-tertiary)',
          'font-size': 'var(--font-size-xs)',
          'display': 'flex',
          'align-items': 'center'
        }
      },
      {
        field: 'tier',
        headerName: 'Status',
        width: 110,
        cellRenderer: (p: any) => {
          const tier = p.value || 'Standard';
          // Data-encoding tier colors — intentionally fixed for visual consistency
          const map: Record<string, { color: string; bg: string }> = {
            Platinum: { color: '#8b5cf6', bg: '#f3e8ff' },
            Gold: { color: '#f59e0b', bg: '#fef3c7' },
            Silver: { color: '#64748b', bg: '#e2e8f0' },
          };
          const style = map[tier] ?? { color: '#94a3b8', bg: '#f1f5f9' };
          return `<div style="display:flex;align-items:center;height:100%;">
                    <span style="padding:1px 8px;border-radius:4px;font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);text-transform:uppercase;background:${style.bg};color:${style.color};border:1px solid ${style.color}33;">
                      ${tier}
                    </span>
                  </div>`;
        }
      },
      {
        field: 'avgOrder',
        headerName: 'Avg Ticket',
        width: 130,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-secondary)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end'
        }
      },
      {
        field: 'ltv',
        headerName: 'Lifetime Value',
        width: 150,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
        cellStyle: {
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'color': 'var(--color-success)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end'
        }
      }
    ];
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


