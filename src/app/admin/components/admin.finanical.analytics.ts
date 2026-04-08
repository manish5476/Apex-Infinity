import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule, TooltipModule, ProgressSpinnerModule, TagModule,
    AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="fin-root">

  <div class="unified-control-panel">
    
    <div class="ucp-header">
      <div class="header-left">
        <div class="header-icon-wrap">
          <i class="pi pi-building-columns"></i>
        </div>
        <div>
          <h2 class="page-title">Financial Health Center</h2>
          <p class="page-meta">
            Real-time P&amp;L, Cash Flow, and Credit Risk
            <span class="meta-divider">·</span>
            Status: 
            <span class="mono" [class.text-success]="financialData()?.summary?.profit?.status === 'profitable'">
              {{ (financialData()?.summary?.profit?.status | titlecase) || 'Calculating...' }}
            </span>
          </p>
        </div>
      </div>
      
      <div class="header-actions">
        <button class="action-btn" pTooltip="Download Report" tooltipPosition="bottom">
          <i class="pi pi-file-pdf"></i>
          <span>Export</span>
        </button>
      </div>
    </div>

    <div class="ucp-filters">
      <app-universal-filter
        entityType="financial-dashboard"
        [config]="filterConfig"
        (filterChange)="onFilterUpdate($event)">
      </app-universal-filter>
    </div>

  </div>

  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3" animationDuration=".8s"></p-progressSpinner>
      <span class="loader-text">Compiling financial data…</span>
    </div>
  }

  @if (!loading() && financialData()) {

    <div class="top-grid">

      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-label">Profitability Engine</h3>
          <span class="margin-badge"
                [class.margin-badge--positive]="(financialData()?.profitability?.marginPercent || 0) >= 0"
                [class.margin-badge--negative]="(financialData()?.profitability?.marginPercent || 0) < 0">
            {{ financialData()?.profitability?.marginPercent || 0 | number:'1.1-1' }}% Margin
          </span>
        </div>

        <div class="profit-stats">
          <div class="profit-stat">
            <p class="stat-label">Total Revenue</p>
            <p class="stat-value">{{ commonService.formatCurrency(financialData()?.profitability?.revenue) }}</p>
          </div>
          <div class="profit-stat">
            <p class="stat-label">COGS</p>
            <p class="stat-value stat-value--error">{{ commonService.formatCurrency(financialData()?.profitability?.costOfGoodsSold) }}</p>
          </div>
          <div class="profit-stat profit-stat--highlight">
            <p class="stat-label">Gross Profit</p>
            <p class="stat-value stat-value--success">{{ commonService.formatCurrency(financialData()?.profitability?.grossProfit) }}</p>
          </div>
        </div>

        @if ((financialData()?.recommendations?.recommendations?.length ?? 0) > 0) {
          <div class="alert-strip alert-strip--warning">
            <div class="alert-icon-box"><i class="pi pi-exclamation-circle"></i></div>
            <div>
              <p class="alert-title">Strategy: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
              <p class="alert-sub">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
            </div>
          </div>
        } @else {
          <div class="alert-strip alert-strip--success">
            <div class="alert-icon-box"><i class="pi pi-check-circle"></i></div>
            <p class="alert-title">Financial health appears stable for this period.</p>
          </div>
        }
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-label">Liquidity Sources</h3>
        </div>

        <div class="flow-list">
          @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
            <div class="flow-item">
              <div class="flow-row">
                <span class="flow-name">{{ mode.name || 'Unknown' }}</span>
                <span class="flow-amount">{{ commonService.formatCurrency(mode.value) }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill progress-fill--success"
                     [style.width.%]="(mode.value / (financialData()?.profitability?.revenue || 1)) * 100">
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <p class="empty-note">No cash transactions for selected criteria</p>
            </div>
          }
        </div>

        <div class="panel-footer">
          <p class="footer-label">Estimated Tax Payable (GST/VAT)</p>
          <p class="footer-value footer-value--error">{{ commonService.formatCurrency(financialData()?.tax?.netPayable) }}</p>
        </div>
      </div>

    </div>

    <div class="bottom-grid">

      <div class="panel">
        <div class="panel-head">
          <div class="head-title-wrap">
             <span class="head-icon"><i class="pi pi-credit-card"></i></span>
             <h3 class="panel-label">Credit Portfolio Risk</h3>
          </div>
        </div>

        @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
          <div class="emi-layout">
            <div class="emi-stat">
              <p class="emi-total">{{ commonService.formatCurrency(emi.totalPortfolio) }}</p>
              <p class="emi-total-label">Total Exposure</p>
            </div>
            <div class="emi-details">
              <div class="emi-row">
                <div>
                  <p class="detail-label">Portfolio Status</p>
                  <p class="detail-value capitalize">{{ emi.status }}</p>
                </div>
                <div class="text-right">
                  <p class="detail-label">Collection Efficiency</p>
                  <p class="detail-value detail-value--success">{{ emi.collectionEfficiency | number:'1.0-1' }}%</p>
                </div>
              </div>
              <div class="default-section">
                <div class="default-head">
                  <span class="detail-label">Default Risk Rate</span>
                  <span class="default-pct">{{ (emi.defaultRate * 100) | number:'1.1-1' }}%</span>
                </div>
                <div class="progress-track progress-track--bordered">
                  <div class="progress-fill progress-fill--gradient" [style.width.%]="emi.defaultRate * 100"></div>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-panel">
            <i class="pi pi-verified"></i>
            <p class="empty-title">Clean Credit Sheet</p>
            <p class="empty-sub">No active EMIs or high-risk debts found.</p>
          </div>
        }
      </div>

      <div class="panel panel--flush">
        <div class="grid-head">
          <h3 class="panel-label">Receivables Aging Report</h3>
        </div>
        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="agingColumns"
            [data]="financialData()?.receivables?.aging || []"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </div>

    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   FINANCIAL DASHBOARD — PREMIUM TOKEN-DRIVEN
   ============================================================ */

:host {
  display: block;
  height: 100%;
  width: 100%;
  overflow: hidden;

  /* Component specific fallback tokens */
  --elevation-1: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
  --elevation-2: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
  --ui-border-radius-sharp: 6px; 
}

.fin-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  height: 100%;
  overflow: hidden;
}

/* ══════════════════════════════════════════════════════════
   UNIFIED COMMAND CENTER (Header + Filters)
   ══════════════════════════════════════════════════════════ */
.unified-control-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sharp);
  box-shadow: var(--elevation-1);
}

.ucp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.header-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--ui-border-radius-sm);
  background: color-mix(in srgb, var(--color-info) 12%, transparent);
  color: var(--color-info);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
  margin-top: 2px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
  letter-spacing: -0.01em;
}

.page-meta {
  display: flex;
  align-items: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  margin: 4px 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meta-divider {
  margin: 0 8px;
  color: var(--border-secondary);
}

.mono { font-family: var(--font-mono); letter-spacing: 0; text-transform: none; }
.text-success { color: var(--color-success); font-weight: var(--font-weight-bold); }

/* Header action buttons */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  height: 36px;
  padding: 0 var(--spacing-md);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-base);

  i { font-size: var(--font-size-base); }

  &:hover:not(:disabled) {
    background: var(--component-bg-hover);
    color: var(--text-primary);
    border-color: var(--border-secondary);
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

/* Bottom Filter Container inside UCP */
.ucp-filters {
  padding: 10px var(--spacing-xl);
  background: var(--bg-secondary);
  border-bottom-left-radius: var(--ui-border-radius-sharp);
  border-bottom-right-radius: var(--ui-border-radius-sharp);
}

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
   LAYOUT GRIDS
   ══════════════════════════════════════════════════════════ */
.top-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex-shrink: 0;

  @media (min-width: 1024px) { grid-template-columns: 1.6fr 1.4fr; }
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;

  @media (min-width: 1024px) { grid-template-columns: 1.6fr 1.4fr; }
}

/* ══════════════════════════════════════════════════════════
   SHARED PANEL
   ══════════════════════════════════════════════════════════ */
.panel {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sharp);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  box-shadow: var(--elevation-1);
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover { box-shadow: var(--elevation-2); }

  /* Flush panel: header has no padding, content is flush to edges */
  &--flush {
    padding: 0;
    overflow: hidden;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.head-title-wrap {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.panel-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-primary);
  margin: 0;
}

.head-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--ui-border-radius-sm);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

/* ── Margin badge ── */
.margin-badge {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  padding: 4px 12px;
  border-radius: var(--ui-border-radius-pill);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-secondary);
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  font-family: var(--font-mono);

  &--positive {
    background: color-mix(in srgb, var(--color-success) 10%, transparent);
    border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
    color: var(--color-success);
  }
  &--negative {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
    border-color: color-mix(in srgb, var(--color-error) 30%, transparent);
    color: var(--color-error);
  }
}

/* ── Profitability stats ── */
.profit-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.profit-stat {
  padding: var(--spacing-md);
  border-radius: var(--ui-border-radius-sm);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);

  &--highlight {
    background: color-mix(in srgb, var(--accent-primary) 4%, var(--bg-primary));
    border-color: color-mix(in srgb, var(--accent-primary) 20%, transparent);
  }
}

.stat-label {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-sm) 0;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;

  &--success { color: var(--color-success); }
  &--error   { color: var(--color-error); }
}

/* ── Alert strip ── */
.alert-strip {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--ui-border-radius-sm);
  border: var(--ui-border-width) solid transparent;
  margin-top: auto;
  background: var(--bg-secondary);

  .alert-icon-box {
    margin-top: 2px;
    font-size: var(--font-size-base);
  }

  &--warning {
    background: color-mix(in srgb, var(--color-warning) 10%, transparent);
    border-color: color-mix(in srgb, var(--color-warning) 30%, transparent);
    color: var(--color-warning);
  }

  &--success {
    background: color-mix(in srgb, var(--color-success) 10%, transparent);
    border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
    color: var(--color-success);
  }
}

.alert-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 2px 0;
  color: var(--text-primary);
}

.alert-sub {
  font-size: 11px;
  margin: 0;
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

/* ── Cash flow list ── */
.flow-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  flex: 1;
  overflow-y: auto;
}

.flow-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.flow-name  { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
.flow-amount { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); font-family: var(--font-mono); }

/* ── Shared progress track ── */
.progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;

  &--bordered {
    background: var(--bg-secondary);
    border: var(--ui-border-width) solid var(--border-primary);
    height: 8px;
  }
}

.progress-fill {
  height: 100%;
  border-radius: var(--ui-border-radius-pill);
  transition: width 0.6s ease;

  &--success  { background: var(--color-success); }
  &--warning  { background: var(--color-warning); }
  &--gradient { background: linear-gradient(90deg, var(--color-warning), var(--color-error)); }
}

/* ── Panel footer (tax) ── */
.panel-footer {
  margin-top: auto;
  padding-top: var(--spacing-lg);
  border-top: var(--ui-border-width) solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0;
}

.footer-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  margin: 0;
  color: var(--text-primary);

  &--error { color: var(--color-error); }
}

/* ── EMI layout ── */
.emi-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-xl);
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sm);
}

.emi-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  border-right: var(--ui-border-width) solid var(--border-primary);
  padding-right: var(--spacing-lg);
}

.emi-total {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
}

.emi-total-label {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: var(--spacing-xs) 0 0 0;
}

.emi-details { display: flex; flex-direction: column; gap: var(--spacing-md); }

.emi-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.text-right { text-align: right; }

.detail-label {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 4px 0;
}

.detail-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;

  &--success { color: var(--color-success); font-family: var(--font-mono); font-weight: var(--font-weight-bold); }
}

.capitalize { text-transform: capitalize; }

.default-section { display: flex; flex-direction: column; gap: 6px; }

.default-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.default-pct {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-error);
}

/* ── Empty panel state ── */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  font-style: italic;
}

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-md);
  text-align: center;
  opacity: 0.7;
  flex: 1;

  i { font-size: 28px; color: var(--color-success); }
}

.empty-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-sub, .empty-note {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

/* ── Aging grid ── */
.grid-head {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

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
  `]
})
export class FinancialDashboardComponent implements OnInit {
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  financialData = signal<any>(null);
  loading = signal(false);
  agingColumns: any[] = [];

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Select Branch',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    },
    { key: 'date', label: 'Reporting Period', type: 'date-range' }
  ];

  ngOnInit(): void {
    this.setupAgingColumns();
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService.getFinancialDashboard(
      this.currentFilters['date']?.[0]?.toISOString(),
      this.currentFilters['date']?.[1]?.toISOString(),
      this.currentFilters['branchId']
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') this.financialData.set(res.data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => this.loading.set(false)
    });
  }

  setupAgingColumns(): void {
    this.agingColumns = [
      {
        field: 'range',
        headerName: 'Aging Period',
        flex: 1,
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)'
        }
      },
      {
        field: 'amount',
        headerName: 'Balance',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
        cellStyle: {
          'color': 'var(--color-error)',
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'text-align': 'right'
        }
      }
    ];
  }
}
// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TagModule } from 'primeng/tag';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// @Component({
//   selector: 'app-financial-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule, TooltipModule, ProgressSpinnerModule, TagModule,
//     AgShareGrid, UniversalFilterComponent
//   ],
//   template: `
// <div class="fin-root">

//   <!-- ══════════════════════════════════════
//        HEADER
//   ═══════════════════════════════════════ -->
//   <div class="page-header">
//     <div>
//       <h2 class="page-title">Financial Health Center</h2>
//       <p class="page-sub">Real-time P&amp;L, Cash Flow, and Credit Risk Analysis</p>
//     </div>
//     <button class="export-btn" pTooltip="Download Report" tooltipPosition="bottom">
//       <i class="pi pi-file-pdf"></i>
//       <span>Download Report</span>
//     </button>
//   </div>

//   <!-- Filter bar -->
//   <div class="filter-bar">
//     <app-universal-filter
//       entityType="financial-dashboard"
//       [config]="filterConfig"
//       (filterChange)="onFilterUpdate($event)">
//     </app-universal-filter>
//   </div>

//   <!-- ══════════════════════════════════════
//        LOADING
//   ═══════════════════════════════════════ -->
//   @if (loading()) {
//     <div class="loader-state">
//       <p-progressSpinner strokeWidth="3"></p-progressSpinner>
//       <span class="loader-text">Compiling financial data…</span>
//     </div>
//   }

//   <!-- ══════════════════════════════════════
//        CONTENT
//   ═══════════════════════════════════════ -->
//   @if (!loading() && financialData()) {

//     <!-- Top row: Profitability + Cash Flow -->
//     <div class="top-grid">

//       <!-- Profitability card -->
//       <div class="panel">
//         <div class="panel-head">
//           <h3 class="panel-label">Profitability Engine</h3>
//           <span class="margin-badge"
//                 [class.margin-badge--positive]="(financialData()?.profitability?.marginPercent || 0) > 0">
//             {{ financialData()?.profitability?.marginPercent || 0 | number:'1.1-1' }}% Margin
//           </span>
//         </div>

//         <div class="profit-stats">
//           <div class="profit-stat">
//             <p class="stat-label">Total Revenue</p>
//             <p class="stat-value">{{ commonService.formatCurrency(financialData()?.profitability?.revenue) }}</p>
//           </div>
//           <div class="profit-stat">
//             <p class="stat-label">COGS</p>
//             <p class="stat-value stat-value--error">{{ commonService.formatCurrency(financialData()?.profitability?.costOfGoodsSold) }}</p>
//           </div>
//           <div class="profit-stat profit-stat--highlight">
//             <p class="stat-label">Gross Profit</p>
//             <p class="stat-value stat-value--success">{{ commonService.formatCurrency(financialData()?.profitability?.grossProfit) }}</p>
//           </div>
//         </div>

//         @if ((financialData()?.recommendations?.recommendations?.length ?? 0) > 0) {
//           <div class="alert-strip alert-strip--warning">
//             <i class="pi pi-exclamation-circle"></i>
//             <div>
//               <p class="alert-title">Strategy: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
//               <p class="alert-sub">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
//             </div>
//           </div>
//         } @else {
//           <div class="alert-strip alert-strip--success">
//             <i class="pi pi-check-circle"></i>
//             <p class="alert-title">Financial health appears stable for this period.</p>
//           </div>
//         }
//       </div>

//       <!-- Cash flow card -->
//       <div class="panel">
//         <h3 class="panel-label">Liquidity Sources</h3>

//         <div class="flow-list">
//           @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
//             <div class="flow-item">
//               <div class="flow-row">
//                 <span class="flow-name">{{ mode.name || 'Unknown' }}</span>
//                 <span class="flow-amount">{{ commonService.formatCurrency(mode.value) }}</span>
//               </div>
//               <div class="progress-track">
//                 <div class="progress-fill progress-fill--success"
//                      [style.width.%]="(mode.value / (financialData()?.profitability?.revenue || 1)) * 100">
//                 </div>
//               </div>
//             </div>
//           } @empty {
//             <p class="empty-note">No cash transactions for selected criteria</p>
//           }
//         </div>

//         <div class="panel-footer">
//           <p class="footer-label">Estimated Tax Payable (GST)</p>
//           <p class="footer-value footer-value--error">{{ commonService.formatCurrency(financialData()?.tax?.netPayable) }}</p>
//         </div>
//       </div>

//     </div>

//     <!-- Bottom row: Credit Risk + Aging Grid -->
//     <div class="bottom-grid">

//       <!-- Credit portfolio -->
//       <div class="panel">
//         <div class="panel-head">
//           <span class="head-icon"><i class="pi pi-credit-card"></i></span>
//           <h3 class="panel-label">Credit Portfolio Risk</h3>
//         </div>

//         @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
//           <div class="emi-layout">
//             <div class="emi-stat">
//               <p class="emi-total">{{ commonService.formatCurrency(emi.totalPortfolio) }}</p>
//               <p class="emi-total-label">Total Exposure</p>
//             </div>
//             <div class="emi-details">
//               <div class="emi-row">
//                 <div>
//                   <p class="detail-label">Portfolio Status</p>
//                   <p class="detail-value capitalize">{{ emi.status }}</p>
//                 </div>
//                 <div class="text-right">
//                   <p class="detail-label">Collection Efficiency</p>
//                   <p class="detail-value detail-value--success">{{ emi.collectionEfficiency }}%</p>
//                 </div>
//               </div>
//               <div class="default-section">
//                 <div class="default-head">
//                   <span class="detail-label">Default Risk Rate</span>
//                   <span class="default-pct">{{ (emi.defaultRate * 100) | number:'1.1-1' }}%</span>
//                 </div>
//                 <div class="progress-track progress-track--bordered">
//                   <div class="progress-fill progress-fill--gradient" [style.width.%]="emi.defaultRate * 100"></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         } @empty {
//           <div class="empty-panel">
//             <i class="pi pi-verified"></i>
//             <p class="empty-title">Clean Credit Sheet</p>
//             <p class="empty-sub">No active EMIs or high-risk debts found.</p>
//           </div>
//         }
//       </div>

//       <!-- Receivables aging grid -->
//       <div class="panel panel--flush">
//         <div class="grid-head">
//           <h4 class="panel-label">Receivables Aging Report</h4>
//         </div>
//         <div class="grid-wrap">
//           <app-ag-share-grid
//             [columns]="agingColumns"
//             [data]="financialData()?.receivables?.aging || []"
//             class="fill-grid">
//           </app-ag-share-grid>
//         </div>
//       </div>

//     </div>

//   }

// </div>
//   `,
//   styles: [`
// /* ============================================================
//    FINANCIAL DASHBOARD — TOKEN-DRIVEN
//    The gradient on .progress-fill--gradient uses two token
//    values (--color-warning, --color-error) which is valid SCSS
//    interpolation — these ARE token references, not hardcoded hex.
//    ============================================================ */

// :host { display: block; width: 100%; }

// .fin-root {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-xl);
//   padding: var(--spacing-xl);
//   background: var(--bg-secondary);
//   font-family: var(--font-body);
//   color: var(--text-primary);
//   min-height: 100%;
// }

// /* ── Page header ── */
// .page-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-end;
//   gap: var(--spacing-lg);
//   flex-shrink: 0;
// }

// .page-title {
//   font-family: var(--font-heading);
//   font-size: var(--font-size-2xl);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
//   margin: 0 0 var(--spacing-xs) 0;
//   line-height: var(--line-height-tight);
// }

// .page-sub {
//   font-size: var(--font-size-sm);
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .export-btn {
//   display: inline-flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   height: 32px;
//   padding: 0 var(--spacing-lg);
//   border: var(--ui-border-width) solid var(--border-primary);
//   background: var(--bg-primary);
//   color: var(--text-secondary);
//   border-radius: var(--ui-border-radius);
//   cursor: pointer;
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-medium);
//   font-family: var(--font-body);
//   transition: var(--transition-base);
//   flex-shrink: 0;

//   &:hover {
//     background: var(--component-bg-hover);
//     color: var(--accent-primary);
//     border-color: var(--border-secondary);
//   }
// }

// /* ── Filter bar ── */
// .filter-bar { flex-shrink: 0; }

// /* ── Loader ── */
// .loader-state {
//   flex: 1;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: var(--spacing-lg);
//   padding: var(--spacing-5xl);
// }

// .loader-text {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-tertiary);
// }

// /* ══════════════════════════════════════════════════════════
//    LAYOUT GRIDS
//    ══════════════════════════════════════════════════════════ */
// .top-grid {
//   display: grid;
//   grid-template-columns: 1fr;
//   gap: var(--spacing-lg);

//   @media (min-width: 1024px) { grid-template-columns: 1.8fr 1.2fr; }
// }

// .bottom-grid {
//   display: grid;
//   grid-template-columns: 1fr;
//   gap: var(--spacing-lg);

//   @media (min-width: 1024px) { grid-template-columns: 2fr 1fr; }
// }

// /* ══════════════════════════════════════════════════════════
//    SHARED PANEL
//    ══════════════════════════════════════════════════════════ */
// .panel {
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius-lg);
//   padding: var(--spacing-lg);
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-lg);

//   /* Flush panel: header has no padding, content is flush to edges */
//   &--flush {
//     padding: 0;
//     overflow: hidden;
//     min-height: 280px;
//   }
// }

// .panel-head {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   gap: var(--spacing-md);
// }

// .panel-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .head-icon {
//   width: 30px;
//   height: 30px;
//   border-radius: var(--ui-border-radius-sm);
//   background: var(--accent-focus);
//   color: var(--accent-primary);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: var(--font-size-base);
//   flex-shrink: 0;
// }

// /* ── Margin badge ── */
// .margin-badge {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   padding: var(--spacing-xs) var(--spacing-lg);
//   border-radius: var(--ui-border-radius-pill);
//   background: var(--bg-secondary);
//   border: var(--ui-border-width) solid var(--border-secondary);
//   color: var(--text-secondary);

//   &--positive {
//     background: var(--color-success-bg);
//     border-color: var(--color-success-border);
//     color: var(--color-success);
//   }
// }

// /* ── Profitability stats ── */
// .profit-stats {
//   display: grid;
//   grid-template-columns: repeat(3, 1fr);
//   gap: var(--spacing-lg);
// }

// .profit-stat {
//   padding: var(--spacing-md);
//   border-radius: var(--ui-border-radius);
//   border: var(--ui-border-width) solid transparent;

//   &--highlight {
//     background: var(--bg-secondary);
//     border-color: var(--border-secondary);
//   }
// }

// .stat-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.06em;
//   color: var(--text-tertiary);
//   margin: 0 0 var(--spacing-xs) 0;
// }

// .stat-value {
//   font-size: var(--font-size-xl);
//   font-weight: var(--font-weight-bold);
//   font-family: var(--font-mono);
//   color: var(--text-primary);
//   margin: 0;

//   &--success { color: var(--color-success); }
//   &--error   { color: var(--color-error); }
// }

// /* ── Alert strip ── */
// .alert-strip {
//   display: flex;
//   align-items: flex-start;
//   gap: var(--spacing-md);
//   padding: var(--spacing-md) var(--spacing-lg);
//   border-radius: var(--ui-border-radius);
//   border: var(--ui-border-width) dashed;
//   margin-top: auto;

//   i { flex-shrink: 0; margin-top: 1px; font-size: var(--font-size-base); }

//   &--warning {
//     background: var(--color-warning-bg);
//     border-color: var(--color-warning-border);
//     color: var(--color-warning);
//   }

//   &--success {
//     background: var(--color-success-bg);
//     border-color: var(--color-success-border);
//     color: var(--color-success);
//   }
// }

// .alert-title {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   margin: 0 0 2px 0;
//   color: inherit;
// }

// .alert-sub {
//   font-size: var(--font-size-xs);
//   margin: 0;
//   opacity: 0.8;
//   color: inherit;
// }

// /* ── Cash flow list ── */
// .flow-list {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-md);
//   flex: 1;
// }

// .flow-row {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: var(--spacing-xs);
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-medium);
// }

// .flow-name  { color: var(--text-primary); }
// .flow-amount { color: var(--text-secondary); font-family: var(--font-mono); }

// /* ── Shared progress track ── */
// .progress-track {
//   width: 100%;
//   height: 6px;
//   background: var(--bg-ternary);
//   border-radius: var(--ui-border-radius-pill);
//   overflow: hidden;

//   &--bordered {
//     background: var(--bg-secondary);
//     border: var(--ui-border-width) solid var(--border-secondary);
//     height: 8px;
//   }
// }

// .progress-fill {
//   height: 100%;
//   border-radius: var(--ui-border-radius-pill);

//   &--success  { background: var(--color-success); }
//   &--warning  { background: var(--color-warning); }
//   /* gradient uses two tokens — this is valid CSS variable interpolation */
//   &--gradient { background: linear-gradient(90deg, var(--color-warning), var(--color-error)); }
// }

// /* ── Panel footer (tax) ── */
// .panel-footer {
//   margin-top: auto;
//   padding-top: var(--spacing-lg);
//   border-top: var(--ui-border-width) solid var(--border-primary);
// }

// .footer-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.06em;
//   color: var(--text-tertiary);
//   margin: 0 0 var(--spacing-xs) 0;
// }

// .footer-value {
//   font-size: var(--font-size-2xl);
//   font-weight: var(--font-weight-bold);
//   font-family: var(--font-mono);
//   margin: 0;
//   color: var(--text-primary);

//   &--error { color: var(--color-error); }
// }

// /* ── EMI layout ── */
// .emi-layout {
//   display: grid;
//   grid-template-columns: 1fr 2fr;
//   gap: var(--spacing-xl);
//   align-items: center;
// }

// .emi-stat {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   border-right: var(--ui-border-width) solid var(--border-primary);
//   padding-right: var(--spacing-lg);
// }

// .emi-total {
//   font-size: var(--font-size-4xl);
//   font-weight: var(--font-weight-bold);
//   font-family: var(--font-mono);
//   color: var(--text-primary);
//   margin: 0;
//   line-height: var(--line-height-tight);
// }

// .emi-total-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.06em;
//   color: var(--text-tertiary);
//   margin: var(--spacing-xs) 0 0 0;
// }

// .emi-details { display: flex; flex-direction: column; gap: var(--spacing-md); }

// .emi-row {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
// }

// .text-right { text-align: right; }

// .detail-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.06em;
//   color: var(--text-tertiary);
//   margin: 0 0 var(--spacing-xs) 0;
// }

// .detail-value {
//   font-size: var(--font-size-lg);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0;

//   &--success { color: var(--color-success); }
// }

// .capitalize { text-transform: capitalize; }

// .default-section { display: flex; flex-direction: column; gap: var(--spacing-xs); }

// .default-head {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// }

// .default-pct {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-bold);
//   font-family: var(--font-mono);
//   color: var(--color-error);
// }

// /* ── Empty panel state ── */
// .empty-panel {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   padding: var(--spacing-3xl);
//   gap: var(--spacing-md);
//   text-align: center;
//   opacity: 0.7;

//   i { font-size: var(--font-size-3xl); color: var(--color-success); }
// }

// .empty-title {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0;
// }

// .empty-sub, .empty-note {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: 0;
//   font-style: italic;
// }

// /* ── Aging grid ── */
// .grid-head {
//   padding: var(--spacing-md) var(--spacing-lg);
//   border-bottom: var(--ui-border-width) solid var(--border-primary);
//   background: var(--bg-secondary);
//   flex-shrink: 0;
// }

// .grid-wrap {
//   flex: 1;
//   position: relative;
//   min-height: 240px;
// }

// .fill-grid {
//   position: absolute;
//   inset: 0;
//   width: 100%;
//   height: 100%;
//   display: block;
// }
//   `]
// })
// export class FinancialDashboardComponent implements OnInit {
//   public  commonService    = inject(CommonMethodService);
//   private analyticsService = inject(AdminAnalyticsService);
//   private cdr              = inject(ChangeDetectorRef);

//   financialData = signal<any>(null);
//   loading       = signal(false);
//   agingColumns: any[] = [];

//   private currentFilters: Record<string, any> = {};

//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Select Branch',
//       type: 'select',
//       dataSourceKey: 'branches',
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'All Branches'
//     },
//     { key: 'date', label: 'Reporting Period', type: 'date-range' }
//   ];

//   ngOnInit(): void {
//     this.setupAgingColumns();
//   }

//   onFilterUpdate(filters: Record<string, any>): void {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData(): void {
//     this.loading.set(true);
//     this.analyticsService.getFinancialDashboard(
//       this.currentFilters['date']?.[0]?.toISOString(),
//       this.currentFilters['date']?.[1]?.toISOString(),
//       this.currentFilters['branchId']
//     ).subscribe({
//       next: (res) => {
//         if (res.status === 'success') this.financialData.set(res.data);
//         this.loading.set(false);
//         this.cdr.detectChanges();
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   setupAgingColumns(): void {
//     this.agingColumns = [
//       {
//         field: 'range',
//         headerName: 'Aging Period',
//         flex: 1,
//         cellStyle: {
//           'font-weight': 'var(--font-weight-semibold)',
//           'color': 'var(--text-primary)'
//         }
//       },
//       {
//         field: 'amount',
//         headerName: 'Balance',
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
//         cellStyle: {
//           'color': 'var(--color-error)',
//           'font-weight': 'var(--font-weight-bold)',
//           'font-family': 'var(--font-mono)',
//           'text-align': 'right'
//         }
//       }
//     ];
//   }
// }