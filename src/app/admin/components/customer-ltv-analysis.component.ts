import { Component, OnInit, signal, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
// import { MasterListService } from`` '../../core/services/master-list.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-customer-ltv-analysis',
  standalone: true,
  imports: [
    ProgressSpinnerModule,
    TooltipModule,
    AgShareGrid,
    UniversalFilterComponent
  ],
  template: `
<div class="ltv-root">

  <!-- Filter bar -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="ltv-analysis"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- Loading -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3" styleClass="w-12 h-12"></p-progressSpinner>
      <span class="loader-text">Reconstructing customer lifecycles…</span>
    </div>
  }

  <!-- Content -->
  @if (!loading()) {

    <!-- KPI strip -->
    <div class="kpi-strip">

      <div class="kpi-card">
        <p class="kpi-label">Total Network LTV</p>
        <p class="kpi-value">{{ commonService.formatCurrency(calculateTotalLTV()) }}</p>
      </div>

      <div class="kpi-card">
        <p class="kpi-label">Avg Customer Value</p>
        <p class="kpi-value kpi-value--accent">{{ commonService.formatCurrency(ltvData()?.summary?.avgLTV) }}</p>
      </div>

      <!-- Gradient performer card -->
      <div class="kpi-card kpi-card--performer">
        <div class="performer-info">
          <p class="performer-label">Top Performer</p>
          <p class="performer-name">{{ getTopCustomerName() }}</p>
        </div>
        <div class="performer-icon-wrap">
          <i class="pi pi-star-fill"></i>
        </div>
      </div>

    </div>

    <!-- Body grid -->
    <div class="body-grid">

      <!-- LTV ranking grid -->
      <div class="panel panel--flush">
        <div class="panel-head">
          <h3 class="panel-title">Lifetime Value Ranking</h3>
          <button class="export-btn" pTooltip="Export" tooltipPosition="bottom">
            <i class="pi pi-download"></i>
          </button>
        </div>
        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="ltvColumns"
            [data]="ltvData()?.customers || []"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </div>

      <!-- Side: Top contributor + retention nudge -->
      <div class="side-col">

        @if (getTopCustomer()) {
          <div class="panel panel--tinted">
            <h4 class="widget-title">Top Contributor Details</h4>

            <div class="profile-center">
              <div class="avatar-circle">{{ getTopCustomer().name.charAt(0).toUpperCase() }}</div>
              <p class="profile-name">{{ getTopCustomer().name }}</p>
              <span class="profile-badge">{{ getTopCustomer().tier || 'VIP' }}</span>
            </div>

            <div class="stats-rows">
              <div class="stats-row">
                <span class="stats-label">Avg Ticket Size</span>
                <span class="stats-val">{{ commonService.formatCurrency(getTopCustomer().avgOrder) }}</span>
              </div>
              <div class="stats-row">
                <span class="stats-label">Total Contribution</span>
                <span class="stats-val">{{ commonService.formatCurrency(getTopCustomer().ltv) }}</span>
              </div>
            </div>
          </div>
        }

        <div class="panel panel--retention">
          <h4 class="widget-title widget-title--success">Retention Trigger</h4>
          <p class="retention-text">
            <i class="pi pi-bolt retention-icon"></i>
            High value detected for
            <strong class="retention-name">{{ getTopCustomerName() }}</strong>.
            Triggering a VIP concierge invite could increase retention.
          </p>
        </div>

      </div>
    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   CUSTOMER LTV ANALYSIS — TOKEN-DRIVEN
   .kpi-card--performer and .avatar-circle use var(--accent-gradient)
   which is a canonical token from apply-canonical-mapping.
   Text on those surfaces uses #fff — intentionally fixed for
   legibility on any accent-gradient background.
   Tier colors in setupColumns() (Platinum/Gold) use semantic
   token variables so they fully adapt to the active theme.
   ============================================================ */

:host { display: block; width: 100%; }

.ltv-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ── Filter bar ── */
.filter-bar { flex-shrink: 0; }

/* ── Loader ── */
.loader-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-5xl);
  min-height: 300px;
}

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

/* ══════════════════════════════════════════════════════════
   KPI STRIP
   ══════════════════════════════════════════════════════════ */
.kpi-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex-shrink: 0;

  @media (min-width: 768px) { grid-template-columns: repeat(3, 1fr); }
}

.kpi-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  transition: var(--transition-base);

  &:hover { box-shadow: var(--shadow-sm); border-color: var(--border-secondary); }

  &--performer {
    background: var(--accent-gradient);
    border: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--shadow-lg);
  }
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-sm) 0;
}

.kpi-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);

  &--accent { color: var(--accent-primary); }
}

/* Performer card internals */
.performer-info { flex: 1; min-width: 0; }

.performer-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  /* White on gradient — intentionally fixed */
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 var(--spacing-xs) 0;
}

.performer-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: #fff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.performer-icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: var(--ui-border-radius-pill);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i { font-size: var(--font-size-xl); color: #fff; }
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
  gap: var(--spacing-lg);

  &--flush {
    padding: 0;
    overflow: hidden;
    min-height: 400px;
  }

  &--tinted {
    background: var(--bg-ternary);
    border-color: var(--border-secondary);
  }

  &--retention {
    border: var(--ui-border-width) dashed var(--color-success-border);
    background: var(--color-success-bg);
  }
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;
}

.widget-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0;

  &--success { color: var(--color-success); }
}

.export-btn {
  width: 28px;
  height: 28px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  transition: var(--transition-fast);

  &:hover { background: var(--component-bg-hover); color: var(--accent-primary); }
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

/* ── Profile block ── */
.profile-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.avatar-circle {
  width: 4rem;
  height: 4rem;
  border-radius: var(--ui-border-radius-pill);
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  /* White on gradient — intentionally fixed */
  color: #fff;
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
}

.profile-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.profile-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent-primary);
  background: var(--accent-focus);
  border: var(--ui-border-width) solid var(--accent-primary);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
}

/* Stats rows */
.stats-rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: var(--ui-border-width) solid var(--border-primary);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
}

.stats-label { color: var(--text-tertiary); }
.stats-val   { font-weight: var(--font-weight-semibold); color: var(--text-primary); font-family: var(--font-mono); }

/* Retention text */
.retention-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.retention-icon { color: var(--color-warning); margin-right: var(--spacing-xs); }

.retention-name {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}
  `]
})
export class CustomerLtvAnalysisComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  // public  masterList       = inject(MasterListService);
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  ltvData = signal<any>(null);
  loading = signal(false);
  ltvColumns: any[] = [];

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Network Average'
    }
  ];

  ngOnInit(): void { this.setupColumns(); }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService.getCustomerLifetimeValue(this.currentFilters['branchId']).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') this.ltvData.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  calculateTotalLTV(): number {
    return (this.ltvData()?.customers ?? []).reduce((s: number, c: any) => s + (c.ltv ?? 0), 0);
  }

  getTopCustomer(): any {
    const customers: any[] = this.ltvData()?.customers ?? [];
    if (!customers.length) return null;
    return [...customers].sort((a, b) => b.ltv - a.ltv)[0];
  }

  getTopCustomerName(): string {
    return this.getTopCustomer()?.name ?? '—';
  }

  setupColumns(): void {
    this.ltvColumns = [
      {
        headerName: 'Rank',
        width: 70,
        sortable: false,
        cellRenderer: (p: any) => {
          const rank = (p.node.rowIndex ?? 0) + 1;
          return `<span style="font-weight:var(--font-weight-semibold);opacity:.5;color:var(--text-tertiary);">#${rank}</span>`;
        },
        cellStyle: { 'text-align': 'center', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      },
      {
        field: 'name',
        headerName: 'Customer',
        flex: 1,
        minWidth: 200,
        cellRenderer: (p: any) => {
          const tier = p.data.tier || 'Standard';
          // Tier styles use semantic tokens — fully theme-adaptive
          const tierStyles: Record<string, string> = {
            Platinum: 'color:var(--accent-primary);background:var(--accent-focus);border:1px solid var(--accent-primary);',
            Gold: 'color:var(--color-warning);background:var(--color-warning-bg);border:1px solid var(--color-warning-border);',
          };
          const tierStyle = tierStyles[tier] ?? 'color:var(--text-secondary);background:var(--bg-ternary);border:1px solid var(--border-secondary);';
          return `<div style="display:flex;flex-direction:column;justify-content:center;height:100%;overflow:hidden;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-weight:var(--font-weight-semibold);color:var(--text-primary);font-size:var(--font-size-base);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.value}">${p.value}</span>
                      <span style="padding:1px 5px;border-radius:4px;font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);text-transform:uppercase;flex-shrink:0;${tierStyle}">${tier}</span>
                    </div>
                    <span style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.data._id}">
                      ID: …${p.data._id.slice(-6)}
                    </span>
                  </div>`;
        }
      },
      {
        field: 'avgOrder',
        headerName: 'Avg Ticket',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p: any) => p.value == null ? '—' : '₹' + Math.round(p.value).toLocaleString(),
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-size': 'var(--font-size-xs)',
          'color': 'var(--text-secondary)',
          'text-align': 'right'
        }
      },
      {
        field: 'ltv',
        headerName: 'Lifetime Value',
        width: 140,
        type: 'rightAligned',
        valueFormatter: (p: any) => p.value == null ? '—' : '₹' + p.value.toLocaleString(),
        cellStyle: {
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'color': 'var(--color-success)',
          'text-align': 'right'
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