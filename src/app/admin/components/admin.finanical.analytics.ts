import { Component, OnInit, signal, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule, TooltipModule, ProgressSpinnerModule, TagModule,
    AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="fin-root">

  <div class="unified-control-panel glass-header">
    
    <div class="ucp-header">
      <div class="header-left">
        <div class="header-icon-wrap elevated-1">
          <i class="pi pi-building-columns"></i>
        </div>
        <div>
          <h2 class="page-title">Financial Health Center</h2>
          <p class="page-meta">
            Real-time P&amp;L, Cash Flow, and Credit Risk
            <span class="meta-divider">·</span>
            Status: 
            <span class="mono badge" 
                  [ngClass]="financialData()?.summary?.profit?.status === 'profitable' ? 'badge-success' : 'badge-warning'">
              {{ (financialData()?.summary?.profit?.status | uppercase) || 'CALCULATING...' }}
            </span>
          </p>
        </div>
      </div>
      
      <div class="header-actions">
        <button class="action-btn focus-ring" pTooltip="Download Report" tooltipPosition="bottom">
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
      <div class="loader-card glass-card elevated-2">
        <p-progressSpinner strokeWidth="3" animationDuration=".8s"></p-progressSpinner>
        <span class="loader-text">Compiling Financial Data…</span>
      </div>
    </div>
  }

  @if (!loading() && financialData()) {

    <div class="top-grid">

      <article class="panel glass-card interactive">
        <div class="panel-head">
          <div class="head-title-wrap">
             <span class="head-icon"><i class="pi pi-chart-pie"></i></span>
             <h3 class="panel-label">Profitability Engine</h3>
          </div>
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
            <p class="stat-value text-error">{{ commonService.formatCurrency(financialData()?.profitability?.costOfGoodsSold) }}</p>
          </div>
          <div class="profit-stat profit-stat--highlight">
            <p class="stat-label text-primary">Gross Profit</p>
            <p class="stat-value text-success">{{ commonService.formatCurrency(financialData()?.profitability?.grossProfit) }}</p>
          </div>
        </div>

        @if ((financialData()?.recommendations?.recommendations?.length ?? 0) > 0) {
          <div class="alert-strip alert-strip--warning">
            <div class="alert-icon-box"><i class="pi pi-exclamation-circle text-warning"></i></div>
            <div>
              <p class="alert-title text-primary">Strategy: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
              <p class="alert-sub">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
            </div>
          </div>
        } @else {
          <div class="alert-strip alert-strip--success">
            <div class="alert-icon-box"><i class="pi pi-check-circle text-success"></i></div>
            <p class="alert-title text-primary">Financial health appears stable for this period.</p>
          </div>
        }
      </article>

      <article class="panel glass-card interactive">
        <div class="panel-head">
          <div class="head-title-wrap">
             <span class="head-icon bg-info-soft"><i class="pi pi-wallet text-info"></i></span>
             <h3 class="panel-label">Liquidity Sources</h3>
          </div>
        </div>

        <div class="flow-list">
          @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
            <div class="flow-item hover-target">
              <div class="flow-row">
                <span class="flow-name">{{ mode.name || 'Unknown' }}</span>
                <span class="flow-amount">{{ commonService.formatCurrency(mode.value) }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-primary"
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
          <p class="footer-value text-error">{{ commonService.formatCurrency(financialData()?.tax?.netPayable) }}</p>
        </div>
      </article>

    </div>

    <div class="bottom-grid">

      <article class="panel glass-card interactive">
        <div class="panel-head">
          <div class="head-title-wrap">
             <span class="head-icon bg-warning-soft"><i class="pi pi-credit-card text-warning"></i></span>
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
                  <span class="badge" [ngClass]="emi.status === 'active' ? 'badge-success' : 'badge-gray'">
                    {{ emi.status | uppercase }}
                  </span>
                </div>
                <div class="text-right">
                  <p class="detail-label">Collection Efficiency</p>
                  <p class="detail-value text-success mono">{{ emi.collectionEfficiency | number:'1.0-1' }}%</p>
                </div>
              </div>
              <div class="default-section">
                <div class="default-head">
                  <span class="detail-label">Default Risk Rate</span>
                  <span class="default-pct">{{ (emi.defaultRate * 100) | number:'1.1-1' }}%</span>
                </div>
                <div class="progress-track progress-track--bordered">
                  <div class="progress-fill fill-gradient" [style.width.%]="emi.defaultRate * 100"></div>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-panel">
            <i class="pi pi-verified text-success"></i>
            <p class="empty-title">Clean Credit Sheet</p>
            <p class="empty-sub">No active EMIs or high-risk debts found.</p>
          </div>
        }
      </article>

      <article class="panel glass-card panel--flush">
        <div class="grid-head">
          <div class="head-title-wrap">
             <span class="head-icon bg-error-soft"><i class="pi pi-chart-bar text-error"></i></span>
             <h3 class="panel-label">Receivables Aging Report</h3>
          </div>
        </div>
        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="agingColumns"
            [data]="financialData()?.receivables?.aging || []"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </article>

    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   FINANCIAL DASHBOARD — LUXURY GLASS THEME
   Strictly adheres to Master Theme Canonical Tokens
   ============================================================ */

:host {
  display: block;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.fin-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
  padding: var(--spacing-2xl);
  font-family: var(--font-body);
  color: var(--text-primary);
  height: 100%;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: var(--spacing-lg);
    gap: var(--spacing-lg);
  }
}

/* Core Semantic Utilities */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-tertiary { color: var(--text-tertiary); }
.text-success { color: var(--color-success); }
.text-error { color: var(--color-error); }
.text-warning { color: var(--color-warning); }
.text-info { color: var(--color-info); }

.bg-info-soft { background-color: var(--color-info-bg); border: 1px solid var(--color-info-border); }
.bg-warning-soft { background-color: var(--color-warning-bg); border: 1px solid var(--color-warning-border); }
.bg-error-soft { background-color: var(--color-error-bg); border: 1px solid var(--color-error-border); }

.mono { font-family: var(--font-mono); }
.text-right { text-align: right; }
.capitalize { text-transform: capitalize; }

/* ══════════════════════════════════════════════════════════
   UNIFIED COMMAND CENTER (GLASS HEADER)
   ══════════════════════════════════════════════════════════ */
.unified-control-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-radius: var(--ui-border-radius-xl);
  overflow: hidden;
}

.glass-header {
  background: var(--glass-bg-c);
  backdrop-filter: blur(var(--glass-blur-c));
  -webkit-backdrop-filter: blur(var(--glass-blur-c));
  border: 1px solid var(--glass-border-c);
  box-shadow: var(--glass-shadow-c);
  transition: var(--transition-base);
}

.ucp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-2xl);
  border-bottom: 1px solid var(--component-divider);
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
}

.header-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--ui-border-radius);
  background: var(--accent-gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
}

.page-meta {
  display: flex;
  align-items: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  margin: 6px 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.meta-divider {
  margin: 0 var(--spacing-sm);
  color: var(--border-secondary);
}

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
  height: 40px;
  padding: 0 var(--spacing-lg);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-base);

  i { font-size: var(--font-size-base); }

  &:hover:not(:disabled) {
    background: var(--accent-primary);
    color: #fff;
    border-color: var(--accent-primary);
    box-shadow: 0 4px 12px var(--accent-focus);
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

/* Filters Container */
.ucp-filters {
  padding: var(--spacing-md) var(--spacing-2xl);
  background: transparent;
}

/* ── Loader ── */
.loader-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-5xl);
}

.loader-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-3xl) var(--spacing-4xl);
}

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
}

/* ══════════════════════════════════════════════════════════
   LAYOUT GRIDS
   ══════════════════════════════════════════════════════════ */
.top-grid, .bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2xl);

  @media (min-width: 1100px) { grid-template-columns: 1.6fr 1.4fr; }
}

.top-grid { flex-shrink: 0; }
.bottom-grid { flex: 1; min-height: 0; }

/* ══════════════════════════════════════════════════════════
   SHARED PANEL
   ══════════════════════════════════════════════════════════ */
.panel {
  padding: var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);

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
  gap: var(--spacing-md);
}

.panel-label {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.head-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--ui-border-radius-sm);
  background: var(--color-primary-bg);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  flex-shrink: 0;
}

/* Badges */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: var(--ui-border-radius-pill);
  font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.badge-gray { background-color: var(--bg-ternary); color: var(--text-secondary); border: 1px solid var(--border-primary); }
.badge-success { background-color: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-border); }
.badge-warning { background-color: var(--color-warning-bg); color: var(--color-warning); border: 1px solid var(--color-warning-border); }

/* ── Margin badge ── */
.margin-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 4px 12px;
  border-radius: var(--ui-border-radius-pill);
  background: var(--bg-ternary);
  border: var(--ui-border-width) solid var(--border-secondary);
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  font-family: var(--font-mono);

  &--positive {
    background: var(--color-success-bg);
    border-color: var(--color-success-border);
    color: var(--color-success);
  }
  &--negative {
    background: var(--color-error-bg);
    border-color: var(--color-error-border);
    color: var(--color-error);
  }
}

/* ── Profitability stats ── */
.profit-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.profit-stat {
  padding: var(--spacing-xl);
  border-radius: var(--ui-border-radius-lg);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  transition: var(--transition-fast);

  &:hover { background: var(--component-bg-hover); border-color: var(--border-secondary); }

  &--highlight {
    background: var(--color-primary-bg);
    border-color: var(--color-primary-border);
  }
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
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-heading);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

/* ── Alert strip ── */
.alert-strip {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--ui-border-radius);
  margin-top: auto;
  
  .alert-icon-box {
    margin-top: 2px;
    font-size: var(--font-size-lg);
  }

  &--warning {
    background: var(--color-warning-bg);
    border: var(--ui-border-width) solid var(--color-warning-border);
  }

  &--success {
    background: var(--color-success-bg);
    border: var(--ui-border-width) solid var(--color-success-border);
  }
}

.alert-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 4px 0;
}

.alert-sub {
  font-size: var(--font-size-xs);
  margin: 0;
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

/* ── Cash flow list ── */
.flow-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.flow-item {
  padding: var(--spacing-md) var(--spacing-sm);
  border-radius: var(--ui-border-radius-sm);
  transition: var(--transition-fast);
}

.hover-target:hover { background: var(--component-bg-hover); }

.flow-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.flow-name   { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--text-primary); }
.flow-amount { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); font-family: var(--font-mono); }

/* ── Shared progress track ── */
.progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-ternary);
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
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);

  &--primary  { background: var(--accent-primary); }
  &--success  { background: var(--color-success); }
  &--warning  { background: var(--color-warning); }
  &--gradient { background: var(--accent-gradient); }
}

.fill-primary { background: var(--accent-primary); }
.fill-gradient { background: var(--accent-gradient); }

/* ── Panel footer (tax) ── */
.panel-footer {
  margin-top: auto;
  padding-top: var(--spacing-lg);
  border-top: var(--ui-border-width) solid var(--component-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0;
}

.footer-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  margin: 0;
}

/* ── EMI layout ── */
.emi-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-2xl);
  align-items: center;
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  transition: var(--transition-base);

  &:hover { border-color: var(--border-secondary); background: var(--component-bg-hover); }
}

.emi-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  border-right: var(--ui-border-width) solid var(--component-divider);
  padding-right: var(--spacing-xl);
}

.emi-total {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-heading);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
}

.emi-total-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: var(--spacing-sm) 0 0 0;
}

.emi-details { display: flex; flex-direction: column; gap: var(--spacing-lg); }

.emi-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 6px 0;
}

.detail-value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.default-section { display: flex; flex-direction: column; gap: 8px; }

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
  padding: var(--spacing-4xl);
  gap: var(--spacing-md);
  text-align: center;
  flex: 1;

  i { font-size: 32px; }
}

.empty-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-sub, .empty-note {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* ── Aging grid ── */
.grid-head {
  padding: var(--spacing-xl);
  border-bottom: var(--ui-border-width) solid var(--component-divider);
  background: transparent;
  flex-shrink: 0;
}

/* This is in the new code and is the magic fix for AG Grid collapsing */
.grid-wrap {
  flex: 1;
  position: relative;
  min-height: 350px; /* <--- This guarantees it will NEVER compress smaller than this */
}

.fill-grid {
  position: absolute;
  inset: 0; /* Pins the grid to all 4 corners of the wrapper */
  width: 100%;
  height: 100%;
  display: block;
}
  `]
})
export class FinancialDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
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
    const [startDate, endDate] = this.resolveDateRange();
    this.analyticsService.getFinancialDashboard(
      startDate,
      endDate,
      this.currentFilters['branchId']
    ).pipe(takeUntil(this.destroy$)).subscribe({
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

  private resolveDateRange(): [string | undefined, string | undefined] {
    const start = this.currentFilters['startDate'] ?? this.currentFilters['date']?.[0];
    const end   = this.currentFilters['endDate']   ?? this.currentFilters['date']?.[1];
    return [this.toIsoDate(start), this.toIsoDate(end)];
  }

  private toIsoDate(value: any): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}