import {
  Component, OnInit, signal, computed,
  ChangeDetectorRef, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';

import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { MasterListService } from '../../core/services/master-list.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-admin-dashboard-ui',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    TagModule, TooltipModule, ProgressSpinnerModule,
    SelectModule, DatePicker,
    AgShareGrid
  ],
  template: `
<div class="dash-root">

  <!-- ═══════════════════════════════════════════════
       HEADER BAR
  ═══════════════════════════════════════════════════ -->
  <header class="dash-header">
    <div class="header-brand">
      <span class="brand-dot"></span>
      <div>
        <h1 class="brand-title">Executive Dashboard</h1>
        <p class="brand-period">
          @if (dashboard()?.period) {
            {{ dashboard()!.period.start | date:'d MMM' }} – {{ dashboard()!.period.end | date:'d MMM yyyy' }}
            <span class="period-chip">{{ dashboard()!.period.days }}d</span>
          } @else {
            &mdash;
          }
        </p>
      </div>
    </div>

    <div class="header-controls">

      <div class="ctrl-group">
        <label class="ctrl-label">Branch</label>
        <p-select
          appendTo="body"
          [options]="masterList.branches()"
          optionLabel="name"
          optionValue="_id"
          [(ngModel)]="selectedBranch"
          (onChange)="onFilterChange()"
          styleClass="dash-select"
          placeholder="All branches">
        </p-select>
      </div>

      <div class="ctrl-divider"></div>

      <div class="ctrl-group">
        <label class="ctrl-label">Period</label>
        <p-datepicker
          [(ngModel)]="dateRange"
          selectionMode="range"
          [showIcon]="true"
          (onSelect)="onFilterChange()"
          placeholder="Start – End"
          styleClass="dash-datepicker">
        </p-datepicker>
      </div>

      <div class="ctrl-divider"></div>

      @if (dashboard()?.financial?.performance?.executionTime) {
        <span class="exec-pill">
          <i class="pi pi-bolt"></i>
          {{ dashboard()!.financial.performance.executionTime }}
        </span>
      }

      <button
        class="icon-btn"
        (click)="loadDashboard()"
        [disabled]="loading()"
        pTooltip="Refresh data"
        tooltipPosition="bottom">
        <i class="pi pi-refresh" [class.spin]="loading()"></i>
      </button>

    </div>
  </header>

  <!-- ═══════════════════════════════════════════════
       LOADING STATE
  ═══════════════════════════════════════════════════ -->
  @if (loading()) {
    <div class="loader-overlay">
      <div class="loader-card">
        <p-progressSpinner styleClass="w-8 h-8" strokeWidth="3"></p-progressSpinner>
        <span class="loader-label">Synchronising data…</span>
      </div>
    </div>
  }

  <!-- ═══════════════════════════════════════════════
       MAIN CONTENT
  ═══════════════════════════════════════════════════ -->
  @if (!loading() && dashboard()) {
    <div class="dash-body">

      <!-- ─── KPI STRIP ─── -->
      <section class="kpi-strip" aria-label="Key performance indicators">

        <!-- Gross Revenue -->
        <article class="kpi-card kpi-card--revenue">
          <div class="kpi-header">
            <span class="kpi-label">Gross Revenue</span>
            @if (dashboard()!.financial.totalRevenue.growth != null) {
              <span class="badge badge--up">
                <i class="pi pi-arrow-up-right"></i>
                {{ dashboard()!.financial.totalRevenue.growth }}%
              </span>
            }
          </div>
          <p class="kpi-amount">₹{{ dashboard()!.financial.totalRevenue.value | number }}</p>
          <p class="kpi-meta">{{ dashboard()!.financial.totalRevenue.count }} transaction(s)</p>
          <div class="kpi-bar">
            <div class="kpi-bar-fill" style="width:100%"></div>
          </div>
        </article>

        <!-- Net Profit -->
        <article class="kpi-card kpi-card--profit">
          <div class="kpi-header">
            <span class="kpi-label">Net Profit</span>
            <span class="badge"
              [class.badge--success]="dashboard()!.financial.netProfit.status === 'profitable'"
              [class.badge--error]="dashboard()!.financial.netProfit.status !== 'profitable'">
              {{ dashboard()!.financial.netProfit.status }}
            </span>
          </div>
          <p class="kpi-amount kpi-amount--success">₹{{ dashboard()!.financial.netProfit.value | number }}</p>
          <p class="kpi-meta">Margin: {{ dashboard()!.financial.netProfit.margin }}%</p>
          <div class="kpi-bar">
            <div class="kpi-bar-fill kpi-bar-fill--success"
              [style.width.%]="dashboard()!.financial.netProfit.margin"></div>
          </div>
        </article>

        <!-- Inventory Value -->
        <article class="kpi-card kpi-card--inventory">
          <div class="kpi-header">
            <span class="kpi-label">Inventory Value</span>
            <i class="pi pi-box kpi-icon"></i>
          </div>
          <p class="kpi-amount">₹{{ dashboard()!.inventory.summary.valuation | number:'1.0-0' }}</p>
          <p class="kpi-meta">
            {{ dashboard()!.inventory.inventoryValuation.totalItems }} items
            · {{ dashboard()!.inventory.inventoryValuation.productCount }} SKUs
          </p>
          <div class="kpi-bar">
            <div class="kpi-bar-fill kpi-bar-fill--info"
              [style.width.%]="dashboard()!.inventory.healthScore"></div>
          </div>
        </article>

        <!-- Outstanding -->
        <article class="kpi-card kpi-card--debt">
          <div class="kpi-header">
            <span class="kpi-label">Outstanding Debt</span>
            <i class="pi pi-exclamation-circle kpi-icon kpi-icon--error"></i>
          </div>
          <p class="kpi-amount kpi-amount--error">₹{{ dashboard()!.financial.outstanding.receivables | number }}</p>
          <p class="kpi-meta">{{ dashboard()!.alerts.highRiskDebtCount }} high-risk account(s)</p>
          <div class="kpi-bar">
            <div class="kpi-bar-fill kpi-bar-fill--error" style="width:100%"></div>
          </div>
        </article>

        <!-- Health Score Card -->
        @if (dashboard()!.inventory.healthScore != null) {
          <article class="kpi-card kpi-card--health">
            <div class="kpi-header">
              <span class="kpi-label">System Health</span>
            </div>
            <div class="health-wrap">
              <svg viewBox="0 0 36 36" class="health-ring" aria-label="Health score ring">
                <path class="ring-track"
                  d="M18 2.0845 a15.9155 15.9155 0 0 1 0 31.831 a15.9155 15.9155 0 0 1 0-31.831"/>
                <path class="ring-arc"
                  [attr.stroke-dasharray]="dashboard()!.inventory.healthScore + ' 100'"
                  [class.ring-arc--good]="dashboard()!.inventory.healthScore >= 70"
                  [class.ring-arc--warn]="dashboard()!.inventory.healthScore >= 40 && dashboard()!.inventory.healthScore < 70"
                  [class.ring-arc--bad]="dashboard()!.inventory.healthScore < 40"
                  d="M18 2.0845 a15.9155 15.9155 0 0 1 0 31.831 a15.9155 15.9155 0 0 1 0-31.831"/>
              </svg>
              <span class="health-value">{{ dashboard()!.inventory.healthScore }}%</span>
            </div>
            <p class="kpi-meta">{{ dashboard()!.inventory.summary.criticalAlerts }} critical alerts</p>
          </article>
        }

      </section>

      <!-- ─── ALERTS RIBBON ─── -->
      @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {
        <div class="alert-ribbon">
          <i class="pi pi-exclamation-triangle"></i>
          <strong>{{ dashboard()!.alerts.lowStockCount }} items</strong> below reorder level —
          action required to prevent stockouts.
          <span class="ribbon-items">
            @for (item of dashboard()!.alerts.itemsToReorder.slice(0, 3); track item) {
              <span class="ribbon-chip">{{ item }}</span>
            }
            @if (dashboard()!.alerts.itemsToReorder.length > 3) {
              <span class="ribbon-chip ribbon-chip--more">
                +{{ dashboard()!.alerts.itemsToReorder.length - 3 }} more
              </span>
            }
          </span>
        </div>
      }

      <!-- ─── BODY GRID ─── -->
      <div class="body-grid">

        <!-- ══ MAIN COLUMN ══ -->
        <div class="col-main">

          <!-- AI Insights -->
          <section class="panel">
            <div class="panel-head">
              <div class="panel-head-left">
                <span class="panel-icon"><i class="pi pi-sparkles"></i></span>
                <h2 class="panel-title">AI Business Insights</h2>
              </div>
              <span class="panel-chip">{{ dashboard()!.insights.count }} insights</span>
            </div>

            <div class="insights-list">
              @for (insight of dashboard()!.insights.insights; track insight.title) {
                <div class="insight-item"
                  [class.insight-item--positive]="insight.type === 'positive'"
                  [class.insight-item--warning]="insight.type === 'warning'"
                  [class.insight-item--info]="insight.type === 'info'">
                  <span class="insight-icon">
                    <i class="pi"
                      [class.pi-check-circle]="insight.type === 'positive'"
                      [class.pi-exclamation-triangle]="insight.type === 'warning'"
                      [class.pi-info-circle]="insight.type === 'info'">
                    </i>
                  </span>
                  <div class="insight-content">
                    <div class="insight-top">
                      <span class="insight-title">{{ insight.title }}</span>
                      <span class="insight-priority"
                        [class.insight-priority--high]="insight.priority === 'high'"
                        [class.insight-priority--medium]="insight.priority === 'medium'">
                        {{ insight.priority }}
                      </span>
                    </div>
                    <p class="insight-msg">{{ insight.message }}</p>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Stock Urgency Monitor -->
          <section class="panel">
            <div class="panel-head">
              <div class="panel-head-left">
                <span class="panel-icon panel-icon--error"><i class="pi pi-warehouse"></i></span>
                <h2 class="panel-title">Stock Urgency Monitor</h2>
              </div>
              <span class="panel-chip panel-chip--error">
                {{ dashboard()!.inventory.lowStockAlerts.length }} Critical
              </span>
            </div>
            <div class="grid-host">
              <app-ag-share-grid
                [columns]="alertColumns"
                [data]="dashboard()!.inventory.lowStockAlerts"
                class="compact-grid">
              </app-ag-share-grid>
            </div>
          </section>

          <!-- Top Categories -->
          @if (dashboard()!.topCategories?.length) {
            <section class="panel">
              <div class="panel-head">
                <div class="panel-head-left">
                  <span class="panel-icon"><i class="pi pi-chart-bar"></i></span>
                  <h2 class="panel-title">Category Performance</h2>
                </div>
              </div>
              <div class="category-list">
                @for (cat of dashboard()!.topCategories; track cat.name) {
                  <div class="category-row">
                    <div class="category-info">
                      <span class="category-name">{{ cat.name }}</span>
                      <span class="category-margin">{{ cat.margin | number:'1.1-1' }}% margin</span>
                    </div>
                    <div class="category-bars">
                      <div class="category-bar-wrap">
                        <span class="bar-label">Revenue</span>
                        <div class="bar-track">
                          <div class="bar-fill bar-fill--accent" style="width:100%"></div>
                        </div>
                        <span class="bar-value">₹{{ cat.revenue | number:'1.0-0' }}</span>
                      </div>
                      <div class="category-bar-wrap">
                        <span class="bar-label">Profit</span>
                        <div class="bar-track">
                          <div class="bar-fill bar-fill--success"
                            [style.width.%]="(cat.profit / cat.revenue) * 100"></div>
                        </div>
                        <span class="bar-value">₹{{ cat.profit | number:'1.0-0' }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

        </div>

        <!-- ══ SIDE COLUMN ══ -->
        <aside class="col-side">

          <!-- Operations -->
          <section class="panel">
            <h3 class="side-panel-title">
              <i class="pi pi-cog"></i> Operations
            </h3>
            <ul class="stat-list" aria-label="Operational efficiency stats">
              <li class="stat-row">
                <span class="stat-label">Avg Order Value</span>
                <span class="stat-value mono">₹{{ dashboard()!.operations.orderEfficiency.averageOrderValue | number:'1.0-0' }}</span>
              </li>
              <li class="stat-row">
                <span class="stat-label">Discount Rate</span>
                <span class="stat-value mono">{{ dashboard()!.operations.discountMetrics.discountRate }}%</span>
              </li>
              <li class="stat-row">
                <span class="stat-label">Cancellation Rate</span>
                <span class="stat-value mono">{{ dashboard()!.operations.orderEfficiency.cancellationRate }}%</span>
              </li>
              <li class="stat-row">
                <span class="stat-label">Active Customers</span>
                <span class="stat-value mono">{{ dashboard()!.financial.customers.active }}</span>
              </li>
              <li class="stat-row">
                <span class="stat-label">New Customers</span>
                <span class="stat-value mono stat-value--success">+{{ dashboard()!.financial.customers.new }}</span>
              </li>
              <li class="stat-row">
                <span class="stat-label">SKUs Sold</span>
                <span class="stat-value mono">{{ dashboard()!.financial.products.unique }}</span>
              </li>
            </ul>
          </section>

          <!-- Top Products -->
          @if (dashboard()!.leaders.topProducts?.length) {
            <section class="panel">
              <h3 class="side-panel-title">
                <i class="pi pi-star"></i> Top Products
              </h3>
              <div class="leaders-list">
                @for (prod of dashboard()!.leaders.topProducts; track prod._id; let i = $index) {
                  <div class="leader-row">
                    <span class="leader-rank">#{{ i + 1 }}</span>
                    <div class="leader-info">
                      <p class="leader-name">{{ prod.name }}</p>
                      <p class="leader-sub">{{ prod.soldQty }} sold · {{ prod.profit | number:'1.0-0' }} profit</p>
                    </div>
                    <span class="leader-revenue">₹{{ prod.revenue | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Top Customers -->
          @if (dashboard()!.leaders.topCustomers?.length) {
            <section class="panel">
              <h3 class="side-panel-title">
                <i class="pi pi-users"></i> Top Customers
              </h3>
              <div class="leaders-list">
                @for (cust of dashboard()!.leaders.topCustomers; track cust._id; let i = $index) {
                  <div class="leader-row">
                    <span class="leader-avatar">{{ cust.name.charAt(0).toUpperCase() }}</span>
                    <div class="leader-info">
                      <p class="leader-name">{{ cust.name }}</p>
                      <p class="leader-sub">{{ cust.transactions }} transaction(s)</p>
                    </div>
                    <span class="leader-revenue">₹{{ cust.totalSpent | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Customer Segments -->
          @if (dashboard()!.customers?.segmentation?.length) {
            <section class="panel">
              <h3 class="side-panel-title">
                <i class="pi pi-chart-pie"></i> Segments
              </h3>
              <div class="seg-list">
                @for (seg of dashboard()!.customers.segmentation; track seg._id) {
                  <div class="seg-row">
                    <div class="seg-left">
                      <span class="seg-dot"></span>
                      <span class="seg-name">{{ seg._id }}</span>
                    </div>
                    <span class="seg-count">{{ seg.count }}</span>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Top Staff -->
          @if (dashboard()!.operations.topStaff?.length) {
            <section class="panel">
              <h3 class="side-panel-title">
                <i class="pi pi-id-card"></i> Top Staff
              </h3>
              <div class="staff-list">
                @for (staff of dashboard()!.operations.topStaff; track staff._id) {
                  <div class="staff-row">
                    <span class="staff-avatar">{{ staff.name.charAt(0).toUpperCase() }}</span>
                    <div class="staff-info">
                      <p class="staff-name">{{ staff.name }}</p>
                      <p class="staff-sub">{{ staff.count }} order(s)</p>
                    </div>
                    <span class="staff-rev">₹{{ staff.revenue | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            </section>
          }

        </aside>
      </div>

    </div>
  }

</div>
  `,
  styles: [`
/* ═══════════════════════════════════════════════════════════════════
   EXECUTIVE DASHBOARD — REFINED EDITORIAL DARK SYSTEM
   100% token-driven. Zero hardcoded color values.
   Responsive: 1400 → 1024 → 768 → 480px breakpoints.
   All color, spacing, typography from canonical token mapping.
   ═══════════════════════════════════════════════════════════════════ */

:host { display: block; width: 100%; }

/* ─── Root ─── */
.dash-root {
  min-height: 100%;
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* ═══════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════ */
.dash-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-2xl);
  background: var(--bg-primary);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  box-shadow: var(--elevation-1);
  flex-wrap: wrap;
}

/* Brand */
.header-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-focus);
  flex-shrink: 0;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1;
}

.brand-period {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: var(--spacing-xs) 0 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.period-chip {
  background: var(--bg-ternary);
  border: var(--ui-border-width) solid var(--border-secondary);
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 1px var(--spacing-sm);
  border-radius: var(--ui-border-radius-pill);
  font-family: var(--font-mono);
}

/* Controls */
.header-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.ctrl-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ctrl-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  line-height: 1;
}

.ctrl-divider {
  width: var(--ui-border-width);
  height: 28px;
  background: var(--border-primary);
  flex-shrink: 0;
}

.exec-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-sm);
  white-space: nowrap;

  i { color: var(--accent-primary); }
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  transition: var(--transition-fast);
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--component-bg-hover);
    color: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

.spin { animation: spin 0.7s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════════════════════════
   LOADING
   ═══════════════════════════════════════════════════════ */
.loader-overlay {
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
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  box-shadow: var(--elevation-2);
}

.loader-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
}

/* ═══════════════════════════════════════════════════════
   BODY LAYOUT
   ═══════════════════════════════════════════════════════ */
.dash-body {
  padding: var(--spacing-xl) var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  flex: 1;

  @media (max-width: 768px) {
    padding: var(--spacing-lg) var(--spacing-lg);
    gap: var(--spacing-lg);
  }
}

/* ═══════════════════════════════════════════════════════
   KPI STRIP
   ═══════════════════════════════════════════════════════ */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-lg);

  @media (max-width: 1400px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 900px)  { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px)  { grid-template-columns: 1fr; }
}

.kpi-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  transition: var(--transition-base);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: var(--ui-border-radius) var(--ui-border-radius) 0 0;
    background: var(--border-secondary);
    transition: var(--transition-base);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--elevation-2);
    border-color: var(--border-secondary);
  }

  &--revenue::before { background: var(--accent-primary); }
  &--profit::before  { background: var(--color-success); }
  &--debt::before    { background: var(--color-error); }
  &--health::before  { background: var(--color-info); }
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-tertiary);
}

.kpi-icon {
  font-size: var(--font-size-base);
  color: var(--text-tertiary);
  opacity: 0.6;

  &--error { color: var(--color-error); opacity: 1; }
}

.kpi-amount {
  font-family: var(--font-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: var(--line-height-tight);
  margin: 0;

  &--success { color: var(--color-success); }
  &--error   { color: var(--color-error); }
}

.kpi-meta {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.kpi-bar {
  height: 3px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
  margin-top: var(--spacing-xs);
}

.kpi-bar-fill {
  height: 100%;
  border-radius: var(--ui-border-radius-pill);
  background: var(--accent-primary);
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);

  &--success { background: var(--color-success); }
  &--error   { background: var(--color-error); }
  &--info    { background: var(--color-info); }
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: capitalize;
  padding: 1px var(--spacing-sm);
  border-radius: var(--ui-border-radius-pill);
  background: var(--bg-ternary);
  color: var(--text-tertiary);
  border: var(--ui-border-width) solid var(--border-secondary);
  white-space: nowrap;

  &--up {
    background: var(--color-success-bg);
    color: var(--color-success);
    border-color: var(--color-success-border);
  }
  &--success {
    background: var(--color-success-bg);
    color: var(--color-success);
    border-color: var(--color-success-border);
  }
  &--error {
    background: var(--color-error-bg);
    color: var(--color-error);
    border-color: var(--color-error-border);
  }
}

/* ─── Health Ring ─── */
.health-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  margin: var(--spacing-sm) 0;
}

.health-ring {
  width: 100%;
  height: 100%;

  .ring-track {
    fill: none;
    stroke: var(--bg-ternary);
    stroke-width: 3;
  }

  .ring-arc {
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: 18px 18px;
    animation: arc-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    &--good { stroke: var(--color-success); }
    &--warn { stroke: var(--color-warning); }
    &--bad  { stroke: var(--color-error); }
  }
}

@keyframes arc-in {
  from { stroke-dasharray: 0 100; }
}

.health-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

/* ═══════════════════════════════════════════════════════
   ALERT RIBBON
   ═══════════════════════════════════════════════════════ */
.alert-ribbon {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-warning-bg);
  border: var(--ui-border-width) solid var(--color-warning-border);
  border-radius: var(--ui-border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-warning);
  flex-wrap: wrap;

  i {
    font-size: var(--font-size-md);
    flex-shrink: 0;
  }

  strong { color: var(--color-warning-dark); }
}

.ribbon-items {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  margin-left: auto;
}

.ribbon-chip {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: 1px var(--spacing-sm);
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-warning-bg);
  border: var(--ui-border-width) solid var(--color-warning-border);
  color: var(--color-warning-dark);
  white-space: nowrap;

  &--more {
    background: var(--bg-ternary);
    border-color: var(--border-secondary);
    color: var(--text-tertiary);
  }
}

/* ═══════════════════════════════════════════════════════
   BODY GRID
   ═══════════════════════════════════════════════════════ */
.body-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: var(--spacing-xl);
  align-items: start;

  @media (max-width: 1100px) { grid-template-columns: 1fr; }
}

.col-main,
.col-side {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ═══════════════════════════════════════════════════════
   PANEL BASE
   ═══════════════════════════════════════════════════════ */
.panel {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
}

.panel-head-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.panel-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--ui-border-radius-sm);
  background: var(--accent-focus);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  flex-shrink: 0;

  &--error {
    background: var(--color-error-bg);
    color: var(--color-error);
  }
}

.panel-title {
  font-family: var(--font-body);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.panel-chip {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 2px var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
  background: var(--bg-ternary);
  color: var(--text-tertiary);
  border: var(--ui-border-width) solid var(--border-secondary);

  &--error {
    background: var(--color-error-bg);
    color: var(--color-error);
    border-color: var(--color-error-border);
  }
}

.side-panel-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  i { color: var(--accent-primary); font-size: var(--font-size-sm); }
}

/* ═══════════════════════════════════════════════════════
   AI INSIGHTS
   ═══════════════════════════════════════════════════════ */
.insights-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.insight-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--ui-border-radius-sm);
  background: var(--bg-secondary);
  border-left: 3px solid var(--border-secondary);
  transition: var(--transition-fast);

  &:hover { background: var(--component-bg-hover); }

  &--positive {
    background: var(--color-success-bg);
    border-left-color: var(--color-success);
    .insight-icon i { color: var(--color-success); }
  }
  &--warning {
    background: var(--color-warning-bg);
    border-left-color: var(--color-warning);
    .insight-icon i { color: var(--color-warning); }
  }
  &--info {
    background: var(--color-info-bg);
    border-left-color: var(--color-info);
    .insight-icon i { color: var(--color-info); }
  }
}

.insight-icon {
  font-size: var(--font-size-md);
  flex-shrink: 0;
  margin-top: 1px;
  i { color: var(--text-tertiary); }
}

.insight-content { flex: 1; min-width: 0; }

.insight-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xs);
}

.insight-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.insight-priority {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  background: var(--bg-ternary);
  border: var(--ui-border-width) solid var(--border-secondary);
  padding: 1px var(--spacing-sm);
  border-radius: var(--ui-border-radius-pill);
  flex-shrink: 0;

  &--high   { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error-border); }
  &--medium { background: var(--color-warning-bg); color: var(--color-warning); border-color: var(--color-warning-border); }
}

.insight-msg {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

/* ═══════════════════════════════════════════════════════
   AG-GRID HOST
   ═══════════════════════════════════════════════════════ */
.grid-host {
  height: 300px;
  border-radius: var(--ui-border-radius-sm);
  overflow: hidden;
  border: var(--ui-border-width) solid var(--border-primary);
}

/* ═══════════════════════════════════════════════════════
   CATEGORY PERFORMANCE
   ═══════════════════════════════════════════════════════ */
.category-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }

.category-row {
  display: flex;
  gap: var(--spacing-xl);
  align-items: flex-start;

  @media (max-width: 600px) { flex-direction: column; gap: var(--spacing-md); }
}

.category-info { width: 160px; flex-shrink: 0; }

.category-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  display: block;
}

.category-margin {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.category-bars { flex: 1; display: flex; flex-direction: column; gap: var(--spacing-sm); }

.category-bar-wrap { display: flex; align-items: center; gap: var(--spacing-md); }

.bar-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  width: 46px;
  flex-shrink: 0;
  text-align: right;
}

.bar-track {
  flex: 1;
  height: 6px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--ui-border-radius-pill);
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);

  &--accent   { background: var(--accent-primary); }
  &--success  { background: var(--color-success); }
}

.bar-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  width: 80px;
  flex-shrink: 0;
  text-align: right;
}

/* ═══════════════════════════════════════════════════════
   STAT LIST
   ═══════════════════════════════════════════════════════ */
.stat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: var(--ui-border-width) solid var(--border-primary);

  &:last-child { border-bottom: none; }
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.stat-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);

  &.mono { font-family: var(--font-mono); }
  &--success { color: var(--color-success); }
  &--error   { color: var(--color-error); }
}

/* ═══════════════════════════════════════════════════════
   LEADERS LIST (products, customers)
   ═══════════════════════════════════════════════════════ */
.leaders-list { display: flex; flex-direction: column; }

.leader-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: var(--ui-border-width) solid var(--border-primary);

  &:last-child { border-bottom: none; }
}

.leader-rank {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  width: 20px;
  flex-shrink: 0;
}

.leader-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-focus);
  color: var(--accent-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.leader-info { flex: 1; min-width: 0; }

.leader-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.leader-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.leader-revenue {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════
   CUSTOMER SEGMENTS
   ═══════════════════════════════════════════════════════ */
.seg-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }

.seg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sm);
  transition: var(--transition-fast);

  &:hover { border-color: var(--border-secondary); background: var(--component-bg-hover); }
}

.seg-left { display: flex; align-items: center; gap: var(--spacing-md); }

.seg-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
  flex-shrink: 0;
}

.seg-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.seg-count {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--accent-primary);
  color: #fff;
  padding: 1px var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
}

/* ═══════════════════════════════════════════════════════
   STAFF LIST
   ═══════════════════════════════════════════════════════ */
.staff-list { display: flex; flex-direction: column; }

.staff-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: var(--ui-border-width) solid var(--border-primary);

  &:last-child { border-bottom: none; }
}

.staff-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent-focus);
  color: var(--accent-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.staff-info { flex: 1; min-width: 0; }

.staff-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.staff-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.staff-rev {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════
   PRIMENG OVERRIDES — token-driven
   ═══════════════════════════════════════════════════════ */
::ng-deep .dash-select {
  .p-select {
    border: var(--ui-border-width) solid var(--border-primary) !important;
    border-radius: var(--ui-border-radius-sm) !important;
    background: var(--bg-secondary) !important;
    box-shadow: none !important;
    min-width: 140px;

    &:hover   { border-color: var(--border-secondary) !important; }
    &.p-focus { border-color: var(--accent-primary) !important; box-shadow: 0 0 0 2px var(--accent-focus) !important; }
  }

  .p-select-label {
    font-size: var(--font-size-sm) !important;
    font-weight: var(--font-weight-medium) !important;
    color: var(--text-primary) !important;
    padding: var(--spacing-sm) var(--spacing-md) !important;
    font-family: var(--font-body) !important;
  }
}

::ng-deep .dash-datepicker {
  .p-datepicker-input {
    border: var(--ui-border-width) solid var(--border-primary) !important;
    border-radius: var(--ui-border-radius-sm) !important;
    background: var(--bg-secondary) !important;
    font-size: var(--font-size-sm) !important;
    font-family: var(--font-body) !important;
    color: var(--text-primary) !important;
    padding: var(--spacing-sm) var(--spacing-md) !important;
    width: 190px;

    &:focus {
      border-color: var(--accent-primary) !important;
      box-shadow: 0 0 0 2px var(--accent-focus) !important;
      outline: none !important;
    }
  }
}

/* ═══════════════════════════════════════════════════════
   SCROLLBAR — themed
   ═══════════════════════════════════════════════════════ */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) var(--scroll-track);
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--scroll-track); }
::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: var(--ui-border-radius-pill);
}
  `]
})
export class AdminDashboardUiComponent implements OnInit {

  dashboard = signal<any>(null);
  loading = signal(true);

  masterList = inject(MasterListService);

  selectedBranch = '';
  dateRange: Date[] | null = null;
  alertColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.setupColumns();
    this.loadDashboard();
  }

  setupColumns(): void {
    this.alertColumns = [
      {
        field: 'name',
        headerName: 'Item',
        flex: 2,
        cellStyle: { 'font-weight': 'var(--font-weight-semibold)', 'font-size': 'var(--font-size-sm)' }
      },
      {
        field: 'sku',
        headerName: 'SKU',
        flex: 1,
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-size': 'var(--font-size-xs)', 'color': 'var(--text-tertiary)' }
      },
      {
        field: 'currentStock',
        headerName: 'Stock',
        flex: 1,
        cellStyle: (p: any) => ({
          'color': p.value === 0 ? 'var(--color-error)' : 'var(--color-warning)',
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'font-size': 'var(--font-size-sm)'
        })
      },
      {
        field: 'reorderLevel',
        headerName: 'Reorder',
        flex: 1,
        cellStyle: { 'color': 'var(--text-tertiary)', 'font-size': 'var(--font-size-sm)' }
      },
      {
        field: 'urgency',
        headerName: 'Urgency',
        flex: 1,
        cellRenderer: (p: any) =>
          `<span style="
            display:inline-flex; align-items:center;
            font-size:var(--font-size-xs); font-weight:var(--font-weight-bold);
            text-transform:uppercase; letter-spacing:0.05em;
            padding:1px 6px; border-radius:9999px;
            background:var(--color-error-bg); color:var(--color-error);
            border:1px solid var(--color-error-border);
          ">${p.value}</span>`
      }
    ];
    this.cdr.detectChanges();
  }

  loadDashboard(): void {
    this.loading.set(true);

    let start: string | undefined;
    let end: string | undefined;

    if (this.dateRange?.length === 2) {
      start = this.dateRange[0]?.toISOString();
      end = this.dateRange[1]?.toISOString();
    }

    this.analyticsService.getDashboardOverview(start, end, this.selectedBranch).subscribe({
      next: (res) => { this.dashboard.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(): void { this.loadDashboard(); }
}
// import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { SelectModule } from 'primeng/select';
// import { DatePicker } from 'primeng/datepicker';

// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { MasterListService } from '../../core/services/master-list.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-admin-dashboard-Ui',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule,
//     TagModule, TooltipModule, ProgressSpinnerModule,
//     SelectModule, DatePicker,
//     AgShareGrid
//   ],
//   template: `
// <div class="ui-root">

//   <!-- ══════════════════════════════════════
//        TOOLBAR — filters + actions
//   ═══════════════════════════════════════ -->
//   <div class="toolbar">
//     <div class="toolbar-filters">

//       <div class="filter-field">
//         <span class="filter-label">Branch</span>
//         <p-select
//           appendTo="body"
//           [options]="masterList.branches()"
//           optionLabel="name"
//           optionValue="_id"
//           [(ngModel)]="selectedBranch"
//           (onChange)="onFilterChange()"
//           styleClass="apex-select"
//           placeholder="All branches">
//         </p-select>
//       </div>

//       <div class="filter-sep"></div>

//       <div class="filter-field">
//         <span class="filter-label">Period</span>
//         <p-datepicker
//           [(ngModel)]="dateRange"
//           selectionMode="range"
//           [showIcon]="true"
//           (onSelect)="onFilterChange()"
//           placeholder="Start – End"
//           styleClass="apex-datepicker">
//         </p-datepicker>
//       </div>

//     </div>

//     <div class="toolbar-actions">
//       @if (dashboard()?.financial?.performance?.executionTime) {
//         <span class="exec-time">
//           <i class="pi pi-bolt"></i>
//           {{ dashboard()?.financial?.performance?.executionTime }}
//         </span>
//       }
//       <button class="refresh-btn" (click)="loadDashboard()" [disabled]="loading()" pTooltip="Refresh" tooltipPosition="bottom">
//         <i class="pi pi-refresh" [class.spinning]="loading()"></i>
//       </button>
//     </div>
//   </div>

//   <!-- ══════════════════════════════════════
//        PAGE HEADING
//   ═══════════════════════════════════════ -->
//   <div class="page-head">
//     <div class="page-head-left">
//       <h1 class="page-title">Executive Dashboard</h1>
//       <p class="page-period">
//         <i class="pi pi-calendar-clock"></i>
//         {{ dashboard()?.period?.start | date:'mediumDate' }}
//         &ndash;
//         {{ dashboard()?.period?.end | date:'mediumDate' }}
//         <span class="period-badge">{{ dashboard()?.period?.days }} days</span>
//       </p>
//     </div>

//     @if (dashboard()?.inventory?.healthScore != null) {
//       <div class="health-widget">
//         <span class="health-label">System Health</span>
//         <div class="health-ring-wrap">
//           <svg viewBox="0 0 36 36" class="health-ring" aria-hidden="true">
//             <path class="ring-track"
//               d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
//             <path class="ring-fill"
//               [attr.stroke-dasharray]="dashboard()?.inventory?.healthScore + ', 100'"
//               d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
//           </svg>
//           <span class="ring-value">{{ dashboard()?.inventory?.healthScore }}%</span>
//         </div>
//       </div>
//     }
//   </div>

//   <!-- ══════════════════════════════════════
//        LOADING STATE
//   ═══════════════════════════════════════ -->
//   @if (loading()) {
//     <div class="loader-state">
//       <p-progressSpinner styleClass="w-8 h-8" strokeWidth="3"></p-progressSpinner>
//       <span class="loader-text">Synchronising data…</span>
//     </div>
//   }

//   <!-- ══════════════════════════════════════
//        DASHBOARD CONTENT
//   ═══════════════════════════════════════ -->
//   @if (!loading() && dashboard()) {

//     <!-- KPI row -->
//     <div class="kpi-row">

//       <div class="kpi-card">
//         <div class="kpi-top">
//           <span class="kpi-label">Gross Revenue</span>
//           @if (dashboard()?.financial?.totalRevenue?.growth != null) {
//             <span class="kpi-trend positive">
//               <i class="pi pi-arrow-up-right"></i>
//               {{ dashboard()?.financial?.totalRevenue?.growth }}%
//             </span>
//           }
//         </div>
//         <p class="kpi-value">₹{{ dashboard()?.financial?.totalRevenue?.value | number }}</p>
//         <p class="kpi-sub">{{ dashboard()?.financial?.totalRevenue?.count }} transactions</p>
//       </div>

//       <div class="kpi-card">
//         <div class="kpi-top">
//           <span class="kpi-label">Net Profit</span>
//           <p-tag
//             [severity]="dashboard()?.financial?.netProfit?.status === 'profitable' ? 'success' : 'danger'"
//             [value]="dashboard()?.financial?.netProfit?.status">
//           </p-tag>
//         </div>
//         <p class="kpi-value kpi-value--success">₹{{ dashboard()?.financial?.netProfit?.value | number }}</p>
//         <p class="kpi-sub">Margin: {{ dashboard()?.financial?.netProfit?.margin }}%</p>
//       </div>

//       <div class="kpi-card">
//         <div class="kpi-top">
//           <span class="kpi-label">Inventory Value</span>
//           <i class="pi pi-box kpi-icon-faded"></i>
//         </div>
//         <p class="kpi-value">₹{{ dashboard()?.leaders?.summary?.valuation | number:'1.0-0' }}</p>
//         <p class="kpi-sub">
//           {{ dashboard()?.leaders?.inventoryValuation?.totalItems }} items ·
//           {{ dashboard()?.leaders?.inventoryValuation?.productCount }} SKUs
//         </p>
//       </div>

//       <div class="kpi-card">
//         <div class="kpi-top">
//           <span class="kpi-label">Outstanding Debt</span>
//           <i class="pi pi-exclamation-circle kpi-icon-error"></i>
//         </div>
//         <p class="kpi-value kpi-value--error">₹{{ dashboard()?.financial?.outstanding?.receivables | number }}</p>
//         <p class="kpi-sub">{{ dashboard()?.topCategories?.highRiskDebtCount }} high-risk accounts</p>
//       </div>

//     </div>

//     <!-- Body layout: main + sidebar -->
//     <div class="body-grid">

//       <!-- ── Main column ── -->
//       <div class="main-col">

//         <!-- AI Insights -->
//         <div class="panel">
//           <div class="panel-head">
//             <h3 class="panel-title">
//               <i class="pi pi-sparkles accent-icon"></i>
//               AI Business Insights
//             </h3>
//           </div>
//           <div class="insights-list">
//             @for (insight of dashboard()?.insights?.insights; track insight.title) {
//               <div class="insight" [class.insight--positive]="insight.type === 'positive'">
//                 <span class="insight-icon">
//                   <i class="pi"
//                     [class.pi-check-circle]="insight.type === 'positive'"
//                     [class.pi-info-circle]="insight.type !== 'positive'">
//                   </i>
//                 </span>
//                 <div class="insight-body">
//                   <p class="insight-title">
//                     {{ insight.title }}
//                     <span class="insight-priority">{{ insight.priority }}</span>
//                   </p>
//                   <p class="insight-msg">{{ insight.message }}</p>
//                 </div>
//               </div>
//             }
//           </div>
//         </div>

//         <!-- Stock alerts grid -->
//         <div class="panel">
//           <div class="panel-head">
//             <h3 class="panel-title">Stock Urgency Monitor</h3>
//             <span class="count-badge">
//               {{ dashboard()?.inventory?.lowStockAlerts?.length || 0 }} Critical
//             </span>
//           </div>
//           <div class="grid-wrap">
//             <app-ag-share-grid
//               [columns]="alertColumns"
//               [data]="dashboard()?.inventory?.lowStockAlerts || []"
//               class="compact-grid">
//             </app-ag-share-grid>
//           </div>
//         </div>

//       </div>

//       <!-- ── Side column ── -->
//       <div class="side-col">

//         <!-- Operational efficiency -->
//         <div class="panel">
//           <h4 class="widget-title">Operational Efficiency</h4>
//           <div class="stat-list">
//             <div class="stat-row">
//               <span class="stat-label">Avg. Order Value</span>
//               <span class="stat-value">₹{{ dashboard()?.operations?.orderEfficiency?.averageOrderValue | number:'1.0-0' }}</span>
//             </div>
//             <div class="stat-row">
//               <span class="stat-label">Discount Rate</span>
//               <span class="stat-value">{{ dashboard()?.operations?.discountMetrics?.discountRate }}%</span>
//             </div>
//             <div class="stat-row">
//               <span class="stat-label">New Customers</span>
//               <span class="stat-value stat-value--success">+{{ dashboard()?.financial?.customers?.new }}</span>
//             </div>
//           </div>
//         </div>

//         <!-- Customer segments -->
//         <div class="panel">
//           <h4 class="widget-title">Customer Segments</h4>
//           <div class="seg-list">
//             @for (seg of dashboard()?.customers?.segmentation; track seg._id) {
//               <div class="seg-row">
//                 <span class="seg-name">{{ seg._id }}</span>
//                 <span class="seg-count">{{ seg.count }}</span>
//               </div>
//             }
//           </div>
//         </div>

//         <!-- Top staff -->
//         <div class="panel">
//           <h4 class="widget-title">Top Staff</h4>
//           <div class="staff-list">
//             @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
//               <div class="staff-row">
//                 <span class="staff-avatar">{{ staff.name.charAt(0).toUpperCase() }}</span>
//                 <div class="staff-info">
//                   <p class="staff-name">{{ staff.name }}</p>
//                   <p class="staff-sub">{{ staff.count }} orders</p>
//                 </div>
//                 <span class="staff-revenue">₹{{ staff.revenue }}</span>
//               </div>
//             }
//           </div>
//         </div>

//       </div>

//     </div>

//   }

// </div>
//   `,
//   styles: [`
// /* ============================================================
//    DASHBOARD UI — TOKEN-DRIVEN
//    Zero hardcoded colors. Uses the canonical token system from
//    globals.scss via @mixin apply-canonical-mapping.
//    All spacing, type, color, shadow and radius values come from
//    the --var token system.
//    ============================================================ */

// :host {
//   display: block;
//   width: 100%;
// }

// /* ── Root wrapper ── */
// .ui-root {
//   padding: var(--spacing-xl);
//   background: var(--bg-secondary);
//   font-family: var(--font-body);
//   color: var(--text-primary);
//   min-height: 100%;
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-xl);
// }

// /* ══════════════════════════════════════════════════════════
//    TOOLBAR
//    ══════════════════════════════════════════════════════════ */
// .toolbar {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   gap: var(--spacing-lg);
//   padding: var(--spacing-md) var(--spacing-lg);
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius);
//   box-shadow: var(--shadow-sm);
//   flex-wrap: wrap;
// }

// .toolbar-filters {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-lg);
//   flex-wrap: wrap;
// }

// .filter-field {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-xs);
// }

// .filter-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.06em;
//   color: var(--text-tertiary);
//   line-height: 1;
// }

// .filter-sep {
//   width: var(--ui-border-width);
//   height: 32px;
//   background: var(--border-secondary);
//   flex-shrink: 0;
// }

// .toolbar-actions {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
// }

// .exec-time {
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   background: var(--bg-secondary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   padding: var(--spacing-xs) var(--spacing-md);
//   border-radius: var(--ui-border-radius-sm);
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-xs);

//   i { color: var(--accent-primary); font-size: var(--font-size-xs); }
// }

// .refresh-btn {
//   width: 30px;
//   height: 30px;
//   border: var(--ui-border-width) solid var(--border-primary);
//   background: var(--bg-secondary);
//   color: var(--text-secondary);
//   border-radius: var(--ui-border-radius);
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: var(--font-size-base);
//   transition: var(--transition-base);

//   &:hover:not(:disabled) {
//     background: var(--component-bg-hover);
//     color: var(--accent-primary);
//     border-color: var(--border-secondary);
//   }

//   &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }

//   .spinning { animation: spin 0.8s linear infinite; }
// }

// @keyframes spin { to { transform: rotate(360deg); } }

// /* ══════════════════════════════════════════════════════════
//    PAGE HEADING
//    ══════════════════════════════════════════════════════════ */
// .page-head {
//   display: flex;
//   align-items: flex-end;
//   justify-content: space-between;
//   gap: var(--spacing-lg);
// }

// .page-title {
//   font-family: var(--font-heading);
//   font-size: var(--font-size-3xl);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
//   margin: 0 0 var(--spacing-sm) 0;
//   letter-spacing: -0.02em;
//   line-height: var(--line-height-tight);
// }

// .page-period {
//   font-size: var(--font-size-sm);
//   color: var(--text-secondary);
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   margin: 0;

//   i { color: var(--text-tertiary); font-size: var(--font-size-sm); }
// }

// .period-badge {
//   background: var(--bg-ternary);
//   border: var(--ui-border-width) solid var(--border-secondary);
//   color: var(--text-secondary);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-semibold);
//   padding: var(--spacing-xs) var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);
// }

// /* ── Health ring widget ── */
// .health-widget {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: var(--spacing-sm);
//   flex-shrink: 0;
// }

// .health-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-tertiary);
// }

// .health-ring-wrap {
//   position: relative;
//   width: 52px;
//   height: 52px;
// }

// .health-ring {
//   display: block;
//   width: 100%;
//   height: 100%;

//   .ring-track {
//     fill: none;
//     stroke: var(--bg-ternary);
//     stroke-width: 3.8;
//   }

//   .ring-fill {
//     fill: none;
//     stroke: var(--color-success);
//     stroke-width: 2.8;
//     stroke-linecap: round;
//     animation: ring-draw 1s ease-out forwards;
//   }
// }

// .ring-value {
//   position: absolute;
//   top: 50%;
//   left: 50%;
//   transform: translate(-50%, -50%);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
//   font-family: var(--font-mono);
// }

// @keyframes ring-draw {
//   from { stroke-dasharray: 0, 100; }
// }

// /* ══════════════════════════════════════════════════════════
//    LOADER STATE
//    ══════════════════════════════════════════════════════════ */
// .loader-state {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: var(--spacing-lg);
//   padding: var(--spacing-5xl) var(--spacing-xl);
//   color: var(--text-tertiary);
// }

// .loader-text {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-tertiary);
// }

// /* ══════════════════════════════════════════════════════════
//    KPI ROW
//    ══════════════════════════════════════════════════════════ */
// .kpi-row {
//   display: grid;
//   grid-template-columns: repeat(4, 1fr);
//   gap: var(--spacing-lg);

//   @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
//   @media (max-width: 640px)  { grid-template-columns: 1fr; }
// }

// .kpi-card {
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius);
//   box-shadow: var(--shadow-sm);
//   padding: var(--spacing-lg);
//   transition: var(--transition-base);

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: var(--shadow-md);
//     border-color: var(--accent-focus);
//   }
// }

// .kpi-top {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: var(--spacing-md);
// }

// .kpi-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.06em;
//   color: var(--text-tertiary);
// }

// .kpi-value {
//   font-family: var(--font-heading);
//   font-size: var(--font-size-4xl);
//   font-weight: var(--font-weight-bold);
//   letter-spacing: -0.03em;
//   color: var(--text-primary);
//   margin: 0;
//   line-height: var(--line-height-tight);

//   &--success { color: var(--color-success); }
//   &--error   { color: var(--color-error); }
// }

// .kpi-sub {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: var(--spacing-sm) 0 0 0;
// }

// .kpi-trend {
//   display: inline-flex;
//   align-items: center;
//   gap: var(--spacing-xs);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   padding: var(--spacing-xs) var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);

//   &.positive {
//     background: var(--color-success-bg);
//     color: var(--color-success);
//     border: var(--ui-border-width) solid var(--color-success-border);
//   }

//   &.negative {
//     background: var(--color-error-bg);
//     color: var(--color-error);
//     border: var(--ui-border-width) solid var(--color-error-border);
//   }
// }

// .kpi-icon-faded { color: var(--text-tertiary); font-size: var(--font-size-lg); opacity: 0.6; }
// .kpi-icon-error { color: var(--color-error); font-size: var(--font-size-lg); }

// /* ══════════════════════════════════════════════════════════
//    BODY GRID
//    ══════════════════════════════════════════════════════════ */
// .body-grid {
//   display: grid;
//   grid-template-columns: 1fr 300px;
//   gap: var(--spacing-lg);
//   align-items: start;

//   @media (max-width: 1024px) { grid-template-columns: 1fr; }
// }

// .main-col,
// .side-col {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-lg);
// }

// /* ══════════════════════════════════════════════════════════
//    SHARED PANEL
//    ══════════════════════════════════════════════════════════ */
// .panel {
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius);
//   box-shadow: var(--shadow-sm);
//   padding: var(--spacing-lg);
// }

// .panel-head {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: var(--spacing-lg);
//   padding-bottom: var(--spacing-md);
//   border-bottom: var(--ui-border-width) solid var(--border-primary);
// }

// .panel-title {
//   font-size: var(--font-size-md);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0;
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   font-family: var(--font-body);
// }

// .accent-icon { color: var(--accent-primary); font-size: var(--font-size-md); }

// .count-badge {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   background: var(--color-error-bg);
//   color: var(--color-error);
//   border: var(--ui-border-width) solid var(--color-error-border);
//   padding: var(--spacing-xs) var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);
// }

// .widget-title {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-tertiary);
//   margin: 0 0 var(--spacing-lg) 0;
//   padding-bottom: var(--spacing-md);a
//   border-bottom: var(--ui-border-width) solid var(--border-primary);
// }

// /* ── Grid wrapper for AgGrid ── */
// .grid-wrap {
//   height: 280px;
// }

// /* ══════════════════════════════════════════════════════════
//    AI INSIGHTS
//    ══════════════════════════════════════════════════════════ */
// .insights-list {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-md);
// }

// .insight {
//   display: flex;
//   gap: var(--spacing-md);
//   padding: var(--spacing-md) var(--spacing-lg);
//   background: var(--bg-secondary);
//   border-radius: var(--ui-border-radius-sm);
//   border-left: 2px solid var(--color-info);

//   &--positive {
//     border-left-color: var(--color-success);
//     background: var(--color-success-bg);
//   }
// }

// .insight-icon {
//   font-size: var(--font-size-base);
//   color: var(--text-tertiary);
//   margin-top: 1px;
//   flex-shrink: 0;

//   .insight--positive & { color: var(--color-success); }
// }

// .insight-title {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0 0 var(--spacing-xs) 0;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   gap: var(--spacing-md);
// }

// .insight-priority {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.04em;
//   color: var(--text-tertiary);
//   background: var(--bg-ternary);
//   border: var(--ui-border-width) solid var(--border-secondary);
//   padding: 1px var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);
//   white-space: nowrap;
// }

// .insight-msg {
//   font-size: var(--font-size-sm);
//   color: var(--text-secondary);
//   margin: 0;
//   line-height: var(--line-height-relaxed);
// }

// /* ══════════════════════════════════════════════════════════
//    STAT LIST (Operational Efficiency)
//    ══════════════════════════════════════════════════════════ */
// .stat-list { display: flex; flex-direction: column; }

// .stat-row {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: var(--spacing-md) 0;
//   border-bottom: var(--ui-border-width) solid var(--border-primary);

//   &:last-child { border-bottom: none; }
// }

// .stat-label {
//   font-size: var(--font-size-sm);
//   color: var(--text-secondary);
// }

// .stat-value {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   font-family: var(--font-mono);

//   &--success { color: var(--color-success); }
//   &--error   { color: var(--color-error); }
// }

// /* ══════════════════════════════════════════════════════════
//    CUSTOMER SEGMENTS
//    ══════════════════════════════════════════════════════════ */
// .seg-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }

// .seg-row {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: var(--spacing-md) var(--spacing-lg);
//   background: var(--bg-secondary);
//   border-radius: var(--ui-border-radius-sm);
//   border: var(--ui-border-width) solid var(--border-primary);
// }

// .seg-name {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
// }

// .seg-count {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   background: var(--accent-primary);
//   color: #fff;
//   padding: var(--spacing-xs) var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);
//   font-family: var(--font-mono);
// }

// /* ══════════════════════════════════════════════════════════
//    TOP STAFF
//    ══════════════════════════════════════════════════════════ */
// .staff-list { display: flex; flex-direction: column; }

// .staff-row {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   padding: var(--spacing-md) 0;
//   border-bottom: var(--ui-border-width) solid var(--border-primary);

//   &:last-child { border-bottom: none; }
// }

// .staff-avatar {
//   width: 32px;
//   height: 32px;
//   border-radius: var(--ui-border-radius-pill);
//   background: var(--accent-focus);
//   color: var(--accent-primary);
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-bold);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   flex-shrink: 0;
// }

// .staff-info {
//   flex: 1;
//   min-width: 0;
// }

// .staff-name {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0;
//   white-space: nowrap;
//   overflow: hidden;
//   text-overflow: ellipsis;
// }

// .staff-sub {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .staff-revenue {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--color-success);
//   font-family: var(--font-mono);
//   flex-shrink: 0;
// }

// /* ══════════════════════════════════════════════════════════
//    PRIMENG SELECT / DATEPICKER OVERRIDES
//    ══════════════════════════════════════════════════════════ */
// ::ng-deep .apex-select {
//   .p-select {
//     border: var(--ui-border-width) solid var(--border-primary) !important;
//     border-radius: var(--ui-border-radius-sm) !important;
//     background: var(--bg-secondary) !important;
//     box-shadow: none !important;

//     &:hover { border-color: var(--border-secondary) !important; }
//     &.p-focus { border-color: var(--accent-primary) !important; box-shadow: 0 0 0 2px var(--accent-focus) !important; }
//   }

//   .p-select-label {
//     font-size: var(--font-size-sm) !important;
//     font-weight: var(--font-weight-medium) !important;
//     color: var(--text-primary) !important;
//     padding: var(--spacing-md) var(--spacing-lg) !important;
//     font-family: var(--font-body) !important;
//   }
// }

// ::ng-deep .apex-datepicker {
//   .p-datepicker-input {
//     border: var(--ui-border-width) solid var(--border-primary) !important;
//     border-radius: var(--ui-border-radius-sm) !important;
//     background: var(--bg-secondary) !important;
//     font-size: var(--font-size-sm) !important;
//     font-family: var(--font-body) !important;
//     color: var(--text-primary) !important;
//     padding: var(--spacing-md) var(--spacing-lg) !important;
//     width: 200px;

//     &:focus { border-color: var(--accent-primary) !important; box-shadow: 0 0 0 2px var(--accent-focus) !important; outline: none !important; }
//   }
// }
//   `]
// })
// export class DashboardUI implements OnInit {
//   dashboard = signal<any>(null);
//   loading = signal(true);

//   public masterList = inject(MasterListService);

//   selectedBranch = '';
//   dateRange: Date[] | null = null;

//   alertColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) { }

//   ngOnInit() {
//     this.setupColumns();
//     this.loadDashboard();
//   }

//   setupColumns(): void {
//     this.alertColumns = [
//       {
//         field: 'name',
//         headerName: 'Inventory Item',
//         flex: 2,
//         cellStyle: { 'font-weight': 'var(--font-weight-semibold)' }
//       },
//       {
//         field: 'currentStock',
//         headerName: 'Stock',
//         flex: 1,
//         cellStyle: { 'color': 'var(--color-error)', 'font-weight': 'var(--font-weight-bold)' }
//       },
//       {
//         field: 'revenue',
//         headerName: 'Potential Revenue',
//         flex: 1,
//         valueFormatter: (p: any) => this.commonService.formatCurrency(p.value)
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadDashboard(): void {
//     this.loading.set(true);

//     let start: string | undefined;
//     let end: string | undefined;

//     if (this.dateRange?.length === 2) {
//       start = this.dateRange[0]?.toISOString();
//       end = this.dateRange[1]?.toISOString();
//     }

//     this.analyticsService.getDashboardOverview(start, end, this.selectedBranch).subscribe({
//       next: (res) => {
//         this.dashboard.set(res.data);
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   onFilterChange(): void {
//     this.loadDashboard();
//   }
// }