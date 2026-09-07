```ts
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
  ChangeDetectionStrategy,
  OnDestroy,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { MasterListService } from '../../core/services/master-list.service';

import { DataGridComponent } from '../../shared/ui/grid';
import { MasterDropdownComponent } from '../../modules/shared/components/masterFilterDropdown/master-dropdown.component';

import { PageComponent } from '../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../shared/ui/layout/page-content/page-content.component';

import { StatCardComponent } from '../../shared/ui/data/stat-card.component';
import { CardComponent } from '../../shared/ui/data/card/card.component';
import { StatusBadgeComponent } from '../../shared/ui/badge/status-badge.component';
import { ButtonComponent } from '../../shared/ui/form/button.component';
import { LoadingComponent } from '../../shared/ui/feedback/loading/loading.component';
import { AvatarComponent } from '../../shared/ui/media/avatar.component';

@Component({
  selector: 'app-admin-dashboard-ui',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    CommonModule,
    FormsModule,
    TooltipModule,
    SelectModule,
    DatePicker,

    DataGridComponent,
    MasterDropdownComponent,

    PageComponent,
    PageHeaderComponent,
    PageContentComponent,

    StatCardComponent,
    CardComponent,
    StatusBadgeComponent,
    ButtonComponent,
    LoadingComponent,
    AvatarComponent
  ],

  template: `
    <app-page>

      <!-- ================================================================
           HEADER
      ================================================================ -->

      <app-page-header
        title="Executive Dashboard"
        density="compact">

        <div class="dashboard-toolbar">

          <div class="filter-field">
            <span class="filter-label">Branch</span>

            <app-master-dropdown
              endpoint="branches"
              [(ngModel)]="selectedBranch"
              (onChange)="onFilterChange()"
              placeholder="All branches"
              class="branch-select">
            </app-master-dropdown>
          </div>

          <div class="filter-field period-field">
            <span class="filter-label">Period</span>

            <p-datepicker
              [(ngModel)]="dateRange"
              selectionMode="range"
              [showIcon]="true"
              (onSelect)="onFilterChange()"
              placeholder="Select period"
              styleClass="dashboard-date">
            </p-datepicker>
          </div>

          <app-button
            variant="secondary"
            size="sm"
            [icon]="loading() ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
            (onClick)="loadDashboard()"
            [disabled]="loading()"
            pTooltip="Refresh dashboard"
            tooltipPosition="top">
          </app-button>

        </div>

      </app-page-header>


      <app-page-content density="compact">

        @if (loading()) {

          <div class="dashboard-loading">
            <div class="loading-inner">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Synchronising dashboard...</span>
            </div>
          </div>

        } @else if (dashboard()) {

          <main class="dashboard">

            <!-- ============================================================
                 ALERT
            ============================================================ -->

            @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {

              <section class="stock-alert">

                <div class="alert-icon">
                  <i class="pi pi-exclamation-triangle"></i>
                </div>

                <div class="alert-content">
                  <strong>
                    {{ dashboard()!.alerts.lowStockCount }} inventory items
                    require attention
                  </strong>

                  <span>
                    Stock levels are below their configured reorder threshold.
                  </span>
                </div>

                <span class="alert-action">
                  Review inventory
                  <i class="pi pi-arrow-right"></i>
                </span>

              </section>

            }


            <!-- ============================================================
                 KPI STRIP
            ============================================================ -->

            <section class="kpi-grid">

              <!-- Revenue -->

              <article class="kpi-card kpi-revenue">

                <div class="kpi-top">
                  <div class="kpi-icon">
                    <i class="pi pi-chart-line"></i>
                  </div>

                  @if (dashboard()!.financial.totalRevenue.growth != null) {
                    <span class="kpi-growth positive">
                      <i class="pi pi-arrow-up"></i>
                      {{ dashboard()!.financial.totalRevenue.growth }}%
                    </span>
                  }
                </div>

                <div class="kpi-label">
                  Gross Revenue
                </div>

                <div class="kpi-value">
                  ₹{{ dashboard()!.financial.totalRevenue.value | number }}
                </div>

                <div class="kpi-meta">
                  {{ dashboard()!.financial.totalRevenue.count | number }}
                  transactions
                </div>

              </article>


              <!-- Profit -->

              <article class="kpi-card">

                <div class="kpi-top">
                  <div class="kpi-icon success">
                    <i class="pi pi-wallet"></i>
                  </div>

                  <app-status-badge
                    [status]="dashboard()!.financial.netProfit.status === 'profitable'
                      ? 'success'
                      : 'error'"
                    variant="subtle"
                    size="sm"
                    [label]="dashboard()!.financial.netProfit.status">
                  </app-status-badge>
                </div>

                <div class="kpi-label">
                  Net Profit
                </div>

                <div class="kpi-value">
                  ₹{{ dashboard()!.financial.netProfit.value | number }}
                </div>

                <div class="kpi-footer">

                  <span>
                    {{ dashboard()!.financial.netProfit.margin }}% margin
                  </span>

                  <div class="mini-progress">
                    <div
                      [style.width.%]="
                        Math.min(
                          Math.max(
                            dashboard()!.financial.netProfit.margin,
                            0
                          ),
                          100
                        )
                      ">
                    </div>
                  </div>

                </div>

              </article>


              <!-- Inventory -->

              <article class="kpi-card">

                <div class="kpi-top">

                  <div class="kpi-icon info">
                    <i class="pi pi-box"></i>
                  </div>

                  <span class="kpi-neutral">
                    {{ dashboard()!.inventory.healthScore }}% health
                  </span>

                </div>

                <div class="kpi-label">
                  Inventory Value
                </div>

                <div class="kpi-value">
                  ₹{{ dashboard()!.inventory.summary.valuation | number:'1.0-0' }}
                </div>

                <div class="kpi-meta">
                  {{ dashboard()!.inventory.inventoryValuation.totalItems | number }}
                  items ·
                  {{ dashboard()!.inventory.inventoryValuation.productCount | number }}
                  SKUs
                </div>

              </article>


              <!-- Receivables -->

              <article class="kpi-card">

                <div class="kpi-top">

                  <div class="kpi-icon danger">
                    <i class="pi pi-arrow-down-left"></i>
                  </div>

                  @if (dashboard()!.alerts.highRiskDebtCount > 0) {
                    <span class="kpi-growth danger">
                      {{ dashboard()!.alerts.highRiskDebtCount }} high risk
                    </span>
                  }

                </div>

                <div class="kpi-label">
                  Outstanding Receivables
                </div>

                <div class="kpi-value">
                  ₹{{ dashboard()!.financial.outstanding.receivables | number }}
                </div>

                <div class="kpi-meta">
                  Capital currently tied up
                </div>

              </article>


              <!-- System Health -->

              @if (dashboard()!.inventory.healthScore != null) {

                <article class="kpi-card health-card">

                  <div class="kpi-top">

                    <div class="kpi-icon health">
                      <i class="pi pi-shield"></i>
                    </div>

                    <span class="health-dot"></span>

                  </div>

                  <div class="kpi-label">
                    System Health
                  </div>

                  <div class="kpi-value">
                    {{ dashboard()!.inventory.healthScore }}%
                  </div>

                  <div class="kpi-meta">
                    {{ dashboard()!.inventory.summary.criticalAlerts }}
                    critical alerts
                  </div>

                </article>

              }

            </section>


            <!-- ============================================================
                 INSIGHTS + OPERATIONS
            ============================================================ -->

            <section class="insights-layout">

              <!-- AI INSIGHTS -->

              <article class="panel insights-panel">

                <div class="panel-header">

                  <div class="panel-heading">

                    <div class="panel-icon ai">
                      <i class="pi pi-sparkles"></i>
                    </div>

                    <div>
                      <h2>AI Business Insights</h2>

                      <p>
                        Automated signals from sales, inventory and margins
                      </p>
                    </div>

                  </div>

                  <app-status-badge
                    status="info"
                    variant="subtle"
                    size="sm"
                    [label]="
                      dashboard()!.insights.count +
                      ' insights'
                    ">
                  </app-status-badge>

                </div>


                <div class="insight-list">

                  @for (
                    insight of dashboard()!.insights.insights;
                    track insight.title
                  ) {

                    <div
                      class="insight-item"
                      [class.positive]="insight.type === 'positive'"
                      [class.warning]="insight.type === 'warning'"
                      [class.info]="insight.type === 'info'">

                      <div class="insight-symbol">

                        @if (insight.type === 'positive') {
                          <i class="pi pi-check"></i>
                        }

                        @if (insight.type === 'warning') {
                          <i class="pi pi-exclamation-triangle"></i>
                        }

                        @if (insight.type === 'info') {
                          <i class="pi pi-info"></i>
                        }

                      </div>

                      <div class="insight-body">

                        <div class="insight-title-row">

                          <strong>
                            {{ insight.title }}
                          </strong>

                          <span class="priority">
                            {{ insight.priority }}
                          </span>

                        </div>

                        <p>
                          {{ insight.message }}
                        </p>

                      </div>

                    </div>

                  }

                </div>

              </article>


              <!-- OPERATIONS -->

              <article class="panel operations-panel">

                <div class="panel-header">

                  <div class="panel-heading">

                    <div class="panel-icon">
                      <i class="pi pi-chart-bar"></i>
                    </div>

                    <div>
                      <h2>Operations Margin</h2>
                      <p>Category profitability</p>
                    </div>

                  </div>

                </div>


                <div class="operations-list">

                  @for (
                    cat of dashboard()!.topCategories;
                    track cat.name
                  ) {

                    <div class="operation-item">

                      <div class="operation-heading">

                        <strong>
                          {{ cat.name }}
                        </strong>

                        <span>
                          {{ cat.margin | number:'1.1-1' }}%
                        </span>

                      </div>

                      <div class="operation-bar">

                        <div
                          class="revenue-bar"
                          style="width: 100%">
                        </div>

                        <div
                          class="profit-bar"
                          [style.width.%]="
                            cat.revenue > 0
                              ? Math.min(
                                  Math.max(
                                    (cat.profit / cat.revenue) * 100,
                                    0
                                  ),
                                  100
                                )
                              : 0
                          ">
                        </div>

                      </div>

                      <div class="operation-values">

                        <span>
                          Revenue
                          <strong>
                            ₹{{ cat.revenue | number:'1.0-0' }}
                          </strong>
                        </span>

                        <span>
                          Profit
                          <strong>
                            ₹{{ cat.profit | number:'1.0-0' }}
                          </strong>
                        </span>

                      </div>

                    </div>

                  }

                </div>

              </article>

            </section>


            <!-- ============================================================
                 STOCK MONITOR
            ============================================================ -->

            <section class="panel stock-panel">

              <div class="panel-header">

                <div class="panel-heading">

                  <div class="panel-icon danger">
                    <i class="pi pi-box"></i>
                  </div>

                  <div>
                    <h2>Stock Urgency</h2>
                    <p>
                      Inventory items requiring immediate attention
                    </p>
                  </div>

                </div>


                <div class="panel-actions">

                  <app-status-badge
                    status="error"
                    variant="subtle"
                    size="sm"
                    [label]="
                      dashboard()!.inventory.lowStockAlerts.length +
                      ' critical'
                    ">
                  </app-status-badge>

                  <app-button
                    variant="secondary"
                    size="sm"
                    icon="pi pi-download"
                    label="Export">
                  </app-button>

                </div>

              </div>


              <div class="stock-table">

                <app-data-grid
                  [viewOnly]="true"
                  [pagination]="true"
                  [toolbar]="false"
                  [columns]="alertColumns"
                  [data]="dashboard()!.inventory.lowStockAlerts">
                </app-data-grid>

              </div>

            </section>


            <!-- ============================================================
                 LEADERS
            ============================================================ -->

            <section class="leaders-grid">


              <!-- PRODUCTS -->

              @if (dashboard()!.leaders.topProducts?.length) {

                <article class="panel leader-panel">

                  <div class="panel-header">

                    <div class="panel-heading">

                      <div class="panel-icon warning">
                        <i class="pi pi-star"></i>
                      </div>

                      <div>
                        <h2>Top Products</h2>
                        <p>Highest revenue contributors</p>
                      </div>

                    </div>

                  </div>


                  <div class="leader-list">

                    @for (
                      product of dashboard()!.leaders.topProducts;
                      track product._id;
                      let i = $index
                    ) {

                      <div class="leader-row">

                        <span class="rank">
                          {{ i + 1 }}
                        </span>

                        <div class="leader-main">

                          <strong>
                            {{ product.name }}
                          </strong>

                          <span>
                            {{ product.soldQty | number }} sold
                            ·
                            ₹{{ product.profit | number:'1.0-0' }} profit
                          </span>

                        </div>

                        <strong class="leader-value">
                          ₹{{ product.revenue | number:'1.0-0' }}
                        </strong>

                      </div>

                    }

                  </div>

                </article>

              }


              <!-- CUSTOMERS -->

              @if (dashboard()!.leaders.topCustomers?.length) {

                <article class="panel leader-panel">

                  <div class="panel-header">

                    <div class="panel-heading">

                      <div class="panel-icon info">
                        <i class="pi pi-users"></i>
                      </div>

                      <div>
                        <h2>Top Customers</h2>
                        <p>Highest-value customers</p>
                      </div>

                    </div>

                  </div>


                  <div class="leader-list">

                    @for (
                      customer of dashboard()!.leaders.topCustomers;
                      track customer._id
                    ) {

                      <div class="leader-row">

                        <app-avatar
                          [name]="customer.name"
                          size="sm">
                        </app-avatar>

                        <div class="leader-main">

                          <strong>
                            {{ customer.name }}
                          </strong>

                          <span>
                            {{ customer.transactions | number }}
                            transactions
                          </span>

                        </div>

                        <strong class="leader-value success">
                          ₹{{ customer.totalSpent | number:'1.0-0' }}
                        </strong>

                      </div>

                    }

                  </div>

                </article>

              }


              <!-- STAFF -->

              @if (dashboard()!.operations.topStaff?.length) {

                <article class="panel leader-panel">

                  <div class="panel-header">

                    <div class="panel-heading">

                      <div class="panel-icon success">
                        <i class="pi pi-users"></i>
                      </div>

                      <div>
                        <h2>Top Staff</h2>
                        <p>Highest order contribution</p>
                      </div>

                    </div>

                  </div>


                  <div class="leader-list">

                    @for (
                      staff of dashboard()!.operations.topStaff;
                      track staff._id
                    ) {

                      <div class="leader-row">

                        <app-avatar
                          [name]="staff.name"
                          size="sm">
                        </app-avatar>

                        <div class="leader-main">

                          <strong>
                            {{ staff.name }}
                          </strong>

                          <span>
                            {{ staff.count | number }}
                            orders
                          </span>

                        </div>

                        <strong class="leader-value success">
                          ₹{{ staff.revenue | number:'1.0-0' }}
                        </strong>

                      </div>

                    }

                  </div>

                </article>

              }

            </section>

          </main>

        }

      </app-page-content>

    </app-page>
  `,

  styles: [`

    /* ================================================================
       HOST
    ================================================================ */

    :host {
      display: block;
      width: 100%;
      min-width: 0;

      color: var(--text-primary);
    }


    /* ================================================================
       TOOLBAR
    ================================================================ */

    .dashboard-toolbar {
      display: flex;
      align-items: flex-end;
      gap: 0.625rem;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .filter-label {
      font-size: 0.625rem;
      line-height: 1;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-tertiary);
    }

    .branch-select {
      width: 190px;
    }

    .period-field {
      width: 230px;
    }


    /* ================================================================
       LOADING
    ================================================================ */

    .dashboard-loading {
      min-height: 420px;
      display: grid;
      place-items: center;
    }

    .loading-inner {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
    }


    /* ================================================================
       DASHBOARD ROOT
    ================================================================ */

    .dashboard {
      width: 100%;
      max-width: 1800px;
      margin: 0 auto;

      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      padding: 0.25rem 0 1.5rem;
    }


    /* ================================================================
       ALERT
    ================================================================ */

    .stock-alert {
      min-height: 48px;

      display: flex;
      align-items: center;
      gap: 0.75rem;

      padding: 0.625rem 0.875rem;

      border: 1px solid var(--color-warning-border);
      border-radius: var(--ui-border-radius);

      background:
        linear-gradient(
          90deg,
          var(--color-warning-bg),
          color-mix(
            in srgb,
            var(--bg-secondary) 85%,
            var(--color-warning) 15%
          )
        );

      color: var(--text-primary);
    }

    .alert-icon {
      width: 30px;
      height: 30px;

      display: grid;
      place-items: center;

      flex: 0 0 30px;

      border-radius: 9px;

      background: var(--color-warning);
      color: var(--text-on-warning);

      font-size: 0.75rem;
    }

    .alert-content {
      min-width: 0;

      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .alert-content strong {
      font-size: var(--font-size-sm);
      font-weight: 700;
    }

    .alert-content span {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }

    .alert-action {
      margin-left: auto;

      display: inline-flex;
      align-items: center;
      gap: 0.375rem;

      font-size: var(--font-size-xs);
      font-weight: 700;

      color: var(--color-warning-dark);

      white-space: nowrap;
    }


    /* ================================================================
       KPI GRID
    ================================================================ */

    .kpi-grid {
      display: grid;

      grid-template-columns:
        repeat(5, minmax(0, 1fr));

      gap: 0.625rem;
    }

    .kpi-card {
      min-width: 0;
      min-height: 138px;

      display: flex;
      flex-direction: column;

      padding: 0.875rem 1rem;

      background: var(--bg-secondary);

      border: 1px solid var(--border-primary);

      border-radius: var(--ui-border-radius);

      box-shadow: var(--elevation-1);

      transition: var(--transition-base);
    }

    .kpi-card:hover {
      transform: translateY(-1px);
      border-color: var(--border-secondary);
      box-shadow: var(--elevation-2);
    }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;

      min-height: 28px;
    }

    .kpi-icon {
      width: 28px;
      height: 28px;

      display: grid;
      place-items: center;

      border-radius: 8px;

      background: var(--accent-focus);
      color: var(--accent-primary);

      font-size: 0.75rem;
    }

    .kpi-icon.success {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .kpi-icon.info {
      background: var(--color-info-bg);
      color: var(--color-info);
    }

    .kpi-icon.danger {
      background: var(--color-error-bg);
      color: var(--color-error);
    }

    .kpi-icon.health {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .kpi-label {
      margin-top: 0.625rem;

      font-size: var(--font-size-xs);
      font-weight: 600;

      color: var(--text-tertiary);
    }

    .kpi-value {
      margin-top: 0.125rem;

      font-family: var(--font-heading);

      font-size: clamp(1.05rem, 1.4vw, 1.45rem);

      line-height: 1.15;
      font-weight: 700;

      letter-spacing: -0.035em;

      color: var(--text-primary);

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi-meta {
      margin-top: auto;

      font-size: var(--font-size-2xs);

      color: var(--text-tertiary);
    }

    .kpi-growth,
    .kpi-neutral {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;

      font-size: var(--font-size-2xs);
      font-weight: 700;
    }

    .kpi-growth.positive {
      color: var(--color-success);
    }

    .kpi-growth.danger {
      color: var(--color-error);
    }

    .kpi-neutral {
      color: var(--text-tertiary);
    }

    .kpi-footer {
      margin-top: auto;

      display: flex;
      flex-direction: column;
      gap: 0.3rem;

      font-size: var(--font-size-2xs);
      color: var(--text-tertiary);
    }

    .mini-progress {
      width: 100%;
      height: 3px;

      overflow: hidden;

      border-radius: 99px;

      background: var(--bg-ternary);
    }

    .mini-progress > div {
      height: 100%;

      border-radius: inherit;

      background: var(--color-success);

      transition: width 500ms ease;
    }

    .health-dot {
      width: 7px;
      height: 7px;

      border-radius: 50%;

      background: var(--color-success);

      box-shadow:
        0 0 0 3px var(--color-success-bg);
    }


    /* ================================================================
       COMMON PANELS
    ================================================================ */

    .panel {
      min-width: 0;

      background: var(--bg-secondary);

      border: 1px solid var(--border-primary);

      border-radius: var(--ui-border-radius);

      box-shadow: var(--elevation-1);

      overflow: hidden;
    }

    .panel-header {
      min-height: 58px;

      display: flex;
      align-items: center;
      justify-content: space-between;

      gap: 1rem;

      padding: 0.75rem 1rem;

      border-bottom: 1px solid var(--border-primary);
    }

    .panel-heading {
      min-width: 0;

      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .panel-heading > div:last-child {
      min-width: 0;
    }

    .panel-heading h2 {
      margin: 0;

      font-family: var(--font-heading);

      font-size: var(--font-size-sm);
      line-height: 1.2;

      font-weight: 700;
      letter-spacing: -0.015em;

      color: var(--text-primary);
    }

    .panel-heading p {
      margin: 0.125rem 0 0;

      font-size: var(--font-size-2xs);

      color: var(--text-tertiary);
    }

    .panel-icon {
      width: 30px;
      height: 30px;

      flex: 0 0 30px;

      display: grid;
      place-items: center;

      border-radius: 8px;

      background: var(--accent-focus);
      color: var(--accent-primary);

      font-size: 0.75rem;
    }

    .panel-icon.ai {
      background:
        linear-gradient(
          135deg,
          var(--accent-primary),
          var(--accent-secondary)
        );

      color: var(--text-on-accent);
    }

    .panel-icon.success {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .panel-icon.info {
      background: var(--color-info-bg);
      color: var(--color-info);
    }

    .panel-icon.warning {
      background: var(--color-warning-bg);
      color: var(--color-warning-dark);
    }

    .panel-icon.danger {
      background: var(--color-error-bg);
      color: var(--color-error);
    }


    /* ================================================================
       INSIGHTS / OPERATIONS
    ================================================================ */

    .insights-layout {
      display: grid;

      grid-template-columns:
        minmax(0, 1.7fr)
        minmax(300px, 0.8fr);

      gap: 0.625rem;
    }

    .insight-list {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      padding: 0.625rem;
    }

    .insight-item {
      display: flex;
      align-items: flex-start;

      gap: 0.625rem;

      padding: 0.625rem 0.75rem;

      border: 1px solid var(--border-primary);

      border-radius: 9px;

      background: var(--bg-primary);

      transition: var(--transition-fast);
    }

    .insight-item:hover {
      border-color: var(--border-secondary);
    }

    .insight-symbol {
      width: 25px;
      height: 25px;

      flex: 0 0 25px;

      display: grid;
      place-items: center;

      margin-top: 1px;

      border-radius: 7px;

      font-size: 0.65rem;
    }

    .insight-item.positive .insight-symbol {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .insight-item.warning .insight-symbol {
      background: var(--color-warning-bg);
      color: var(--color-warning-dark);
    }

    .insight-item.info .insight-symbol {
      background: var(--color-info-bg);
      color: var(--color-info);
    }

    .insight-body {
      min-width: 0;
      flex: 1;
    }

    .insight-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .insight-title-row strong {
      min-width: 0;

      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      font-size: var(--font-size-xs);
      font-weight: 700;
    }

    .priority {
      flex: 0 0 auto;

      padding: 2px 5px;

      border-radius: 4px;

      background: var(--bg-ternary);

      color: var(--text-tertiary);

      font-size: 0.5rem;
      font-weight: 700;

      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .insight-body p {
      margin: 0.2rem 0 0;

      font-size: var(--font-size-2xs);
      line-height: 1.45;

      color: var(--text-secondary);
    }


    /* ================================================================
       OPERATIONS
    ================================================================ */

    .operations-list {
      padding: 0.375rem 0.875rem;
    }

    .operation-item {
      padding: 0.625rem 0;

      border-bottom: 1px solid var(--border-primary);
    }

    .operation-item:last-child {
      border-bottom: 0;
    }

    .operation-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;

      gap: 0.5rem;
    }

    .operation-heading strong {
      font-size: var(--font-size-xs);
      font-weight: 700;
    }

    .operation-heading span {
      padding: 2px 6px;

      border-radius: 5px;

      background: var(--color-success-bg);

      color: var(--color-success);

      font-size: var(--font-size-2xs);
      font-weight: 700;
    }

    .operation-bar {
      position: relative;

      width: 100%;
      height: 5px;

      margin-top: 0.5rem;

      overflow: hidden;

      border-radius: 99px;

      background: var(--bg-ternary);
    }

    .revenue-bar {
      position: absolute;
      inset: 0;

      background: var(--accent-tertiary);
    }

    .profit-bar {
      position: absolute;
      inset: 0 auto 0 0;

      border-radius: inherit;

      background: var(--color-success);

      transition: width 500ms ease;
    }

    .operation-values {
      display: flex;
      justify-content: space-between;

      margin-top: 0.3rem;

      font-size: var(--font-size-2xs);

      color: var(--text-tertiary);
    }

    .operation-values span {
      display: flex;
      gap: 0.25rem;
    }

    .operation-values strong {
      color: var(--text-secondary);
    }


    /* ================================================================
       STOCK
    ================================================================ */

    .stock-panel {
      min-height: 0;
    }

    .panel-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stock-table {
      height: 360px;
      min-height: 0;

      overflow: hidden;
    }


    /* ================================================================
       LEADERS
    ================================================================ */

    .leaders-grid {
      display: grid;

      grid-template-columns:
        repeat(3, minmax(0, 1fr));

      gap: 0.625rem;
    }

    .leader-list {
      padding: 0.25rem 0.875rem 0.5rem;
    }

    .leader-row {
      min-height: 52px;

      display: flex;
      align-items: center;

      gap: 0.625rem;

      border-bottom: 1px solid var(--border-primary);
    }

    .leader-row:last-child {
      border-bottom: 0;
    }

    .rank {
      width: 23px;
      height: 23px;

      flex: 0 0 23px;

      display: grid;
      place-items: center;

      border-radius: 6px;

      background: var(--bg-ternary);

      color: var(--text-tertiary);

      font-size: var(--font-size-2xs);
      font-weight: 700;
    }

    .leader-main {
      min-width: 0;
      flex: 1;

      display: flex;
      flex-direction: column;

      gap: 2px;
    }

    .leader-main strong {
      overflow: hidden;

      font-size: var(--font-size-xs);
      font-weight: 700;

      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .leader-main span {
      overflow: hidden;

      font-size: var(--font-size-2xs);

      color: var(--text-tertiary);

      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .leader-value {
      flex: 0 0 auto;

      font-size: var(--font-size-xs);
      font-weight: 700;

      color: var(--text-primary);
    }

    .leader-value.success {
      color: var(--color-success);
    }


    /* ================================================================
       PRIME / CHILD COMPONENT OVERRIDES
    ================================================================ */

    :host ::ng-deep .dashboard-date {
      width: 100%;
    }

    :host ::ng-deep .p-datepicker-input {
      height: 34px;
      padding: 0.375rem 0.625rem;

      border-radius: var(--ui-border-radius-sm);

      font-size: var(--font-size-xs);
    }

    :host ::ng-deep .p-datepicker-trigger {
      width: 34px;
      height: 34px;
    }

    :host ::ng-deep .master-dropdown__control.p-select,
    :host ::ng-deep .master-dropdown__control.p-multiselect {
      min-height: 34px;
      height: 34px;

      border-radius: var(--ui-border-radius-sm);
    }

    :host ::ng-deep .master-dropdown__control .p-select-label {
      padding: 0.375rem 0.625rem;

      font-size: var(--font-size-xs);
    }


    /* ================================================================
       RESPONSIVE
    ================================================================ */

    @media (max-width: 1400px) {

      .kpi-grid {
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
      }

      .insights-layout {
        grid-template-columns:
          minmax(0, 1.4fr)
          minmax(280px, 0.8fr);
      }

    }


    @media (max-width: 1050px) {

      .kpi-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .insights-layout {
        grid-template-columns: 1fr;
      }

      .leaders-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

    }


    @media (max-width: 768px) {

      .dashboard-toolbar {
        width: 100%;

        display: grid;

        grid-template-columns:
          minmax(0, 1fr)
          minmax(0, 1fr);

        align-items: end;
      }

      .branch-select,
      .period-field {
        width: 100%;
      }

      .dashboard-toolbar > app-button {
        width: 34px;
      }

      .dashboard {
        gap: 0.625rem;
      }

      .kpi-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap: 0.5rem;
      }

      .kpi-card {
        min-height: 125px;
        padding: 0.75rem;
      }

      .kpi-value {
        font-size: 1.05rem;
      }

      .leaders-grid {
        grid-template-columns: 1fr;
      }

      .panel-header {
        padding: 0.625rem 0.75rem;
      }

      .panel-actions {
        gap: 0.25rem;
      }

      .stock-table {
        height: 320px;
      }

    }


    @media (max-width: 520px) {

      .dashboard-toolbar {
        grid-template-columns: 1fr;
      }

      .dashboard-toolbar > app-button {
        justify-self: end;
      }

      .kpi-grid {
        grid-template-columns: 1fr 1fr;
      }

      .kpi-card {
        min-height: 118px;
      }

      .stock-alert {
        align-items: flex-start;
      }

      .alert-action {
        display: none;
      }

      .panel-heading p {
        display: none;
      }

      .insight-item {
        padding: 0.5rem;
      }

      .stock-table {
        height: 300px;
      }

    }

  `]
})
export class AdminDashboardUiComponent
  implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

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
  ) {}

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

        cellStyle: {
          'font-weight': '600',
          'font-size': 'var(--font-size-sm)'
        }
      },

      {
        field: 'sku',
        headerName: 'SKU',
        flex: 1,

        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-size': 'var(--font-size-xs)',
          'color': 'var(--text-tertiary)'
        }
      },

      {
        field: 'currentStock',
        headerName: 'Stock',
        flex: 1,

        cellStyle: (p: any) => ({
          color:
            p.value === 0
              ? 'var(--color-error)'
              : 'var(--color-warning-dark)',

          'font-weight': '700',
          'font-family': 'var(--font-mono)',
          'font-size': 'var(--font-size-sm)'
        })
      },

      {
        field: 'reorderLevel',
        headerName: 'Reorder',
        flex: 1,

        cellStyle: {
          color: 'var(--text-tertiary)',
          'font-size': 'var(--font-size-sm)'
        }
      },

      {
        field: 'urgency',
        headerName: 'Urgency',
        flex: 1,

        cellRenderer: (p: any) => {

          const value = String(p.value ?? '').toUpperCase();

          return `
            <span style="
              display:inline-flex;
              align-items:center;
              justify-content:center;

              min-width:62px;

              font-size:0.6rem;
              font-weight:700;

              text-transform:uppercase;
              letter-spacing:0.04em;

              padding:3px 7px;

              border-radius:999px;

              background:var(--color-error-bg);
              color:var(--color-error);

              border:1px solid var(--color-error-border);
            ">
              ${value}
            </span>
          `;
        }
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

    this.analyticsService
      .getDashboardOverview(
        start,
        end,
        this.selectedBranch
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: (res) => {

          this.dashboard.set(res.data);
          this.loading.set(false);

        },

        error: () => {

          this.loading.set(false);

        }

      });

  }

  onFilterChange(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();

  }

}
```


// import {
//   Component, OnInit, signal, computed,
//   ChangeDetectorRef, inject, ChangeDetectionStrategy, OnDestroy
// } from '@angular/core';
// import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TooltipModule } from 'primeng/tooltip';
// import { SelectModule } from 'primeng/select';
// import { DatePicker } from 'primeng/datepicker';

// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { MasterListService } from '../../core/services/master-list.service';
// import { DataGridComponent, GridColumn } from '../../shared/ui/grid';
// import { MasterDropdownComponent } from '../../modules/shared/components/masterFilterDropdown/master-dropdown.component';
// import { Subject } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// // Shared UI Components
// import { PageComponent } from '../../shared/ui/layout/page/page.component';
// import { PageHeaderComponent } from '../../shared/ui/layout/page-header/page-header.component';
// import { PageContentComponent } from '../../shared/ui/layout/page-content/page-content.component';
// import { PageToolbarComponent } from '../../shared/ui/layout/page-toolbar/page-toolbar.component';
// import { SectionComponent } from '../../shared/ui/layout/section/section.component';
// import { BentoGridComponent, BentoItemComponent } from '../../shared/ui/layout/bento-grid.component';
// import { StatCardComponent } from '../../shared/ui/data/stat-card.component';
// import { GlassCardComponent } from '../../shared/ui/data/glass-card.component';
// import { CardComponent } from '../../shared/ui/data/card/card.component';
// import { GradientBannerComponent } from '../../shared/ui/data/gradient-banner.component';
// import { StatusBadgeComponent } from '../../shared/ui/badge/status-badge.component';
// import { ButtonComponent } from '../../shared/ui/form/button.component';
// import { LoadingComponent } from '../../shared/ui/feedback/loading/loading.component';
// import { AvatarComponent } from '../../shared/ui/media/avatar.component';
// import { WidgetRailComponent } from '@shared/ui/layout/widget-rail.component';
// import { DataListComponent } from '../../shared/ui/data/list/data-list.component';
// import { DataListRowComponent } from '../../shared/ui/data/list/data-list-row.component';
// import { DataListCardComponent } from '../../shared/ui/data/list/data-list-card.component';

// @Component({
//   selector: 'app-admin-dashboard-ui',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     CommonModule, FormsModule,
//     TooltipModule, SelectModule, DatePicker,
//     DataGridComponent, MasterDropdownComponent,
//     PageComponent, PageHeaderComponent, PageContentComponent,
//     WidgetRailComponent,
//     StatCardComponent, CardComponent,
//     DataListComponent, DataListCardComponent,
//     StatusBadgeComponent, ButtonComponent, LoadingComponent, AvatarComponent,
//     BentoGridComponent, BentoItemComponent
//   ],
//   template: `
// <app-page>
//   <app-page-header title="Executive Dashboard" density="compact">
//     <div class="flex items-end gap-4 compact-toolbar">
      
//       <!-- Branch Selector -->
//       <div class="flex flex-col gap-1">
//         <label class="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">Branch</label>
//         <app-master-dropdown
//           endpoint="branches"
//           [(ngModel)]="selectedBranch"
//           (onChange)="onFilterChange()"
//           placeholder="All branches"
//           class="w-[220px]">
//         </app-master-dropdown>
//       </div>

//       <!-- Period Selector -->
//       <div class="flex flex-col gap-1">
//         <label class="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">Period</label>
//         <p-datepicker
//           [(ngModel)]="dateRange"
//           selectionMode="range"
//           [showIcon]="true"
//           (onSelect)="onFilterChange()"
//           placeholder="Start – End"
//           styleClass="w-[260px]">
//         </p-datepicker>
//       </div>
      
//       <!-- Refresh Button -->
//       <div class="flex items-center h-[36px]">
//          <app-button 
//             variant="secondary" 
//             size="sm" 
//             [icon]="loading() ? 'pi pi-refresh spin' : 'pi pi-refresh'" 
//             (onClick)="loadDashboard()" 
//             [disabled]="loading()" 
//             pTooltip="Refresh data">
//          </app-button>
//       </div>
//     </div>
//   </app-page-header>

//   <app-page-content density="compact">
//     @if (loading()) {
//       <div class="py-16 flex justify-center">
//         <app-loading text="Synchronising dashboard data..."></app-loading>
//       </div>
//     }

//     @if (!loading() && dashboard()) {
//       <!-- Reduced the massive 3xl gap to a more professional spacing-lg/xl -->
//       <div class="flex flex-col gap-[var(--spacing-xl)] pb-10 mt-2">
        
//         <!-- Alerts Ribbon (Made it full width and sleeker) -->
//         @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {
//           <div class="flex items-center gap-4 p-4 rounded-[var(--ui-border-radius-md)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-[var(--color-warning-dark)] shadow-sm w-full">
//             <i class="pi pi-exclamation-triangle text-xl"></i>
//             <span class="text-[length:var(--font-size-sm)]">
//               <strong class="font-bold">{{ dashboard()!.alerts.lowStockCount }} items</strong> below reorder level — action required to prevent stockouts.
//             </span>
//           </div>
//         }

//         <!-- Top KPIs -->
//         <app-widget-rail gap="var(--spacing-md)" cardWidth="min(280px, 85vw)">
//             <app-stat-card 
//               label="Gross Revenue" 
//               density="compact" [accent]="true" shadow="sm" variant="primary"
//               [value]="'₹' + (dashboard()!.financial.totalRevenue.value | number)"
//               [change]="dashboard()!.financial.totalRevenue.growth != null ? dashboard()!.financial.totalRevenue.growth + '%' : undefined"
//               trend="up"
//               [description]="(dashboard()!.financial.totalRevenue.count | number) + ' transaction(s)'">
//             </app-stat-card>
          
//             <app-stat-card 
//               label="Net Profit" 
//               density="compact" [accent]="true" shadow="sm"
//               [value]="'₹' + (dashboard()!.financial.netProfit.value | number)"
//               [change]="dashboard()!.financial.netProfit.status"
//               [trend]="dashboard()!.financial.netProfit.status === 'profitable' ? 'up' : 'down'"
//               [variant]="dashboard()!.financial.netProfit.status === 'profitable' ? 'success' : 'error'"
//               [description]="'Margin: ' + dashboard()!.financial.netProfit.margin + '%'">
//               <div sparkline class="w-full h-1.5 bg-[var(--border-secondary)] rounded-full mt-3 overflow-hidden">
//                 <div class="h-full bg-[var(--color-success)]" [style.width.%]="dashboard()!.financial.netProfit.margin"></div>
//               </div>
//             </app-stat-card>

//             <app-stat-card 
//               label="Inventory Value" 
//               icon="pi pi-box"
//               density="compact" [accent]="true" shadow="sm" variant="info"
//               [value]="'₹' + (dashboard()!.inventory.summary.valuation | number:'1.0-0')"
//               [description]="(dashboard()!.inventory.inventoryValuation.totalItems | number) + ' items · ' + (dashboard()!.inventory.inventoryValuation.productCount | number) + ' SKUs'">
//                <div sparkline class="w-full h-1.5 bg-[var(--border-secondary)] rounded-full mt-3 overflow-hidden">
//                  <div class="h-full bg-[var(--color-info)]" [style.width.%]="dashboard()!.inventory.healthScore"></div>
//                </div>
//             </app-stat-card>

//              <app-stat-card 
//               label="Outstanding Debt" 
//               icon="pi pi-exclamation-circle"
//               variant="error"
//               density="compact" [accent]="true" shadow="sm"
//               [value]="'₹' + (dashboard()!.financial.outstanding.receivables | number)"
//               [description]="dashboard()!.alerts.highRiskDebtCount + ' high-risk account(s)'">
//             </app-stat-card>

//           @if (dashboard()!.inventory.healthScore != null) {
//                <app-stat-card 
//                 label="System Health" 
//                 icon="pi pi-heart"
//                 density="compact" [accent]="true" shadow="sm" variant="success"
//                 [value]="dashboard()!.inventory.healthScore + '%'"
//                 [description]="dashboard()!.inventory.summary.criticalAlerts + ' critical alerts'">
//                </app-stat-card>
//           }
//         </app-widget-rail>

//         <!-- Bento Grid Dashboard -->
//         <app-bento-grid layout="analytics" density="comfortable">
          
//           <!-- AI Insights (Changed size to lg to take up 2/3 of the row) -->
//           <app-bento-item size="lg" priority="high">
//             <app-card class="h-full flex flex-col block">
//               <div class="flex flex-col lg:flex-row gap-6 h-full p-2">
//                 <!-- Left: Title & Badge -->
//                 <div class="flex flex-col gap-3 lg:w-1/3 shrink-0 lg:border-r lg:border-[var(--border-secondary)] pr-4">
//                   <h3 class="text-[length:var(--font-size-lg)] font-bold text-[var(--text-primary)] m-0 tracking-tight">
//                     AI Business Insights
//                   </h3>
//                   <div>
//                     <app-status-badge status="info" variant="subtle" size="sm" [label]="dashboard()!.insights.count + ' insights generated'"></app-status-badge>
//                   </div>
//                   <p class="text-[length:var(--font-size-sm)] text-[var(--text-tertiary)] mt-2 hidden lg:block">
//                     Automated analysis of your inventory, margins, and sales velocity.
//                   </p>
//                 </div>
                
//                 <!-- Right: Insights Message -->
//                 <div class="flex-1 w-full flex flex-col gap-3 justify-center">
//                   @for (insight of dashboard()!.insights.insights; track insight.title) {
//                     <div class="p-4 rounded-[var(--ui-border-radius-md)] flex items-start gap-4 border border-black/5"
//                       [class.bg-[var(--color-success-bg)]]="insight.type === 'positive'"
//                       [class.bg-[var(--color-warning-bg)]]="insight.type === 'warning'"
//                       [class.bg-[var(--color-info-bg)]]="insight.type === 'info'">
                      
//                       <i class="pi text-xl mt-0.5"
//                          [class.pi-check-circle]="insight.type === 'positive'"
//                          [class.pi-exclamation-triangle]="insight.type === 'warning'"
//                          [class.pi-info-circle]="insight.type === 'info'"
//                          [class.text-[var(--color-success)]]="insight.type === 'positive'"
//                          [class.text-[var(--color-warning)]]="insight.type === 'warning'"
//                          [class.text-[var(--color-info)]]="insight.type === 'info'"></i>
                         
//                       <div class="flex-1 flex flex-col gap-1.5">
//                         <div class="flex items-center justify-between">
//                           <span class="font-bold text-[var(--text-primary)] text-[length:var(--font-size-md)] tracking-tight">{{ insight.title }}</span>
//                           <app-status-badge [status]="insight.priority === 'high' ? 'error' : 'neutral'" size="sm" [label]="insight.priority | uppercase"></app-status-badge>
//                         </div>
//                         <span class="text-[var(--text-secondary)] text-[length:var(--font-size-sm)] leading-relaxed">{{ insight.message }}</span>
//                       </div>
//                     </div>
//                   }
//                 </div>
//               </div>
//             </app-card>
//           </app-bento-item>

//           <!-- Operations (Takes up remaining 1/3 of the row) -->
//           <app-bento-item size="sm">
//             <app-data-list title="Operations Margin" icon="pi pi-cog" maxHeight="100%" class="h-full block">
//                 @for (cat of dashboard()!.topCategories; track cat.name) {
//                   <div class="py-4 first:pt-2 last:pb-2 flex flex-col justify-between gap-4 border-b border-[var(--border-secondary)] last:border-0">
                    
//                     <!-- Category Name & Margin -->
//                     <div class="w-full flex justify-between items-end">
//                       <div class="font-bold text-[length:var(--font-size-md)] text-[var(--text-primary)] tracking-tight">{{ cat.name }}</div>
//                       <div class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] font-semibold bg-[var(--bg-secondary)] px-2 py-0.5 rounded">{{ cat.margin | number:'1.1-1' }}% margin</div>
//                     </div>
                    
//                     <!-- Progress Bars (Stacked cleanly for small widget) -->
//                     <div class="w-full flex flex-col gap-3">
//                        <!-- Revenue Bar -->
//                        <div class="flex-1 flex flex-col gap-1">
//                          <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
//                            <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[10px]">Revenue</span>
//                            <span class="font-bold text-[var(--text-primary)]">₹{{ cat.revenue | number:'1.0-0' }}</span>
//                          </div>
//                          <div class="w-full h-1.5 bg-[var(--bg-ternary)] rounded-full overflow-hidden">
//                             <div class="h-full bg-[var(--accent-primary)] rounded-full" style="width:100%"></div>
//                          </div>
//                        </div>
                       
//                        <!-- Profit Bar -->
//                        <div class="flex-1 flex flex-col gap-1">
//                          <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
//                            <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[10px]">Profit</span>
//                            <span class="font-bold text-[var(--color-success)]">₹{{ cat.profit | number:'1.0-0' }}</span>
//                          </div>
//                          <div class="w-full h-1.5 bg-[var(--bg-ternary)] rounded-full overflow-hidden">
//                             <div class="h-full bg-[var(--color-success)] rounded-full transition-all duration-500" [style.width.%]="(cat.profit / cat.revenue) * 100"></div>
//                          </div>
//                        </div>
//                     </div>
//                   </div>
//                 }
//             </app-data-list>
//           </app-bento-item>

//           <!-- Stock Urgency Grid (Full width xl) -->
//           <app-bento-item size="xl">
//             <app-card title="Stock Urgency Monitor">
//                  <ng-container ngProjectAs="[card-actions]">
//                     <div class="flex items-center gap-3">
//                       <app-status-badge status="error" variant="solid" [label]="dashboard()!.inventory.lowStockAlerts.length + ' Critical'"></app-status-badge>
//                       <app-button variant="secondary" size="sm" icon="pi pi-file-excel" label="Export"></app-button>
//                     </div>
//                  </ng-container>
//                  <div class="rounded-[var(--ui-border-radius-md)] border border-[var(--border-secondary)] overflow-hidden relative h-[380px] flex flex-col mt-2">
//                    <app-data-grid [viewOnly]="true" [pagination]="true" [toolbar]="false" 
//                     [columns]="alertColumns"
//                     [data]="dashboard()!.inventory.lowStockAlerts">
//                    </app-data-grid>
//                  </div>
//             </app-card>
//           </app-bento-item>

//           <!-- Bottom Row: 3 Equal Columns (sm + sm + sm) -->
          
//           <!-- Top Products -->
//           @if (dashboard()!.leaders.topProducts?.length) {
//             <app-bento-item size="sm">
//               <app-data-list title="Top Products" icon="pi pi-star" variant="spaced" maxHeight="100%">
//                   @for (prod of dashboard()!.leaders.topProducts; track prod._id; let i = $index) {
//                     <app-data-list-card [title]="prod.name" [subtitle]="(prod.soldQty | number) + ' sold · ₹' + (prod.profit | number:'1.0-0') + ' profit'">
//                        <div leading class="font-bold text-[var(--text-tertiary)] text-[length:var(--font-size-md)] w-6 text-center">#{{ i + 1 }}</div>
//                        <div trailing class="font-bold text-[var(--text-primary)]">₹{{ prod.revenue | number:'1.0-0' }}</div>
//                     </app-data-list-card>
//                   }
//               </app-data-list>
//             </app-bento-item>
//           }

//           <!-- Top Customers -->
//           @if (dashboard()!.leaders.topCustomers?.length) {
//             <app-bento-item size="sm">
//               <app-data-list title="Top Customers" icon="pi pi-users" variant="spaced" maxHeight="100%">
//                   @for (cust of dashboard()!.leaders.topCustomers; track cust._id; let i = $index) {
//                     <app-data-list-card [title]="cust.name" [subtitle]="(cust.transactions | number) + ' transaction(s)'">
//                        <div leading><app-avatar [name]="cust.name" size="sm"></app-avatar></div>
//                        <div trailing class="font-bold text-[var(--color-success)]">₹{{ cust.totalSpent | number:'1.0-0' }}</div>
//                     </app-data-list-card>
//                   }
//               </app-data-list>
//             </app-bento-item>
//           }
          
//           <!-- Top Staff -->
//           @if (dashboard()!.operations.topStaff?.length) {
//              <app-bento-item size="sm">
//                 <app-data-list title="Top Staff" icon="pi pi-id-card" variant="spaced" maxHeight="100%">
//                     @for (staff of dashboard()!.operations.topStaff; track staff._id) {
//                       <app-data-list-card [title]="staff.name" [subtitle]="(staff.count | number) + ' order(s)'">
//                          <div leading><app-avatar [name]="staff.name" size="sm"></app-avatar></div>
//                          <div trailing class="font-bold text-[var(--color-success)]">₹{{ staff.revenue | number:'1.0-0' }}</div>
//                       </app-data-list-card>
//                     }
//                 </app-data-list>
//              </app-bento-item>
//           }
          
//         </app-bento-grid>
//       </div>
//     }
//   </app-page-content>
// </app-page>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
    
//     .spin { animation: spin 0.7s linear infinite; }
//     @keyframes spin { to { transform: rotate(360deg); } }
    
//     /* Toolbar Alignment & Sizes */
//     .compact-toolbar {
//       ::ng-deep .master-dropdown__control.p-select,
//       ::ng-deep .master-dropdown__control.p-multiselect {
//         min-height: 36px;
//         height: 36px;
//         border-radius: var(--ui-border-radius-md);
//       }
//       ::ng-deep .master-dropdown__control .p-select-label {
//         padding: 0.35rem 0.75rem;
//         font-size: 0.875rem;
//       }
//       ::ng-deep .p-datepicker-input {
//         padding: 0.35rem 0.75rem;
//         font-size: 0.875rem;
//         height: 36px;
//         border-radius: var(--ui-border-radius-md);
//       }
//       ::ng-deep .p-datepicker-trigger {
//         width: 36px;
//         height: 36px;
//         border-top-right-radius: var(--ui-border-radius-md);
//         border-bottom-right-radius: var(--ui-border-radius-md);
//       }
//       ::ng-deep .p-button.p-button-icon-only {
//         width: 36px;
//         height: 36px;
//         padding: 0;
//       }
//     }
//   `]
// })
// export class AdminDashboardUiComponent implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
//   dashboard = signal<any>(null);
//   loading = signal(true);

//   masterList = inject(MasterListService);

//   selectedBranch = '';
//   dateRange: Date[] | null = null;
//   alertColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) { }

//   ngOnInit(): void {
//     this.setupColumns();
//     this.loadDashboard();
//   }

//   setupColumns(): void {
//     this.alertColumns = [
//       {
//         field: 'name',
//         headerName: 'Item',
//         flex: 2,
//         cellStyle: { 'font-weight': '600', 'font-size': 'var(--font-size-sm)' }
//       },
//       {
//         field: 'sku',
//         headerName: 'SKU',
//         flex: 1,
//         cellStyle: { 'font-family': 'var(--font-mono)', 'font-size': 'var(--font-size-xs)', 'color': 'var(--text-tertiary)' }
//       },
//       {
//         field: 'currentStock',
//         headerName: 'Stock',
//         flex: 1,
//         cellStyle: (p: any) => ({
//           'color': p.value === 0 ? 'var(--color-error)' : 'var(--color-warning-dark)',
//           'font-weight': '700',
//           'font-family': 'var(--font-mono)',
//           'font-size': 'var(--font-size-sm)'
//         })
//       },
//       {
//         field: 'reorderLevel',
//         headerName: 'Reorder',
//         flex: 1,
//         cellStyle: { 'color': 'var(--text-tertiary)', 'font-size': 'var(--font-size-sm)' }
//       },
//       {
//         field: 'urgency',
//         headerName: 'Urgency',
//         flex: 1,
//         cellRenderer: (p: any) =>
//           `<span style="
//             display:inline-flex; align-items:center;
//             font-size: 0.65rem; font-weight: 700;
//             text-transform:uppercase; letter-spacing:0.05em;
//             padding:3px 8px; border-radius: 9999px;
//             background:var(--color-error-bg); color:var(--color-error);
//             border:1px solid var(--color-error-border);
//           ">${p.value}</span>`
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

//     this.analyticsService.getDashboardOverview(start, end, this.selectedBranch)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (res) => {
//           this.dashboard.set(res.data);
//           this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//       });
//   }

//   onFilterChange(): void {
//     this.loadDashboard();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }// import {
// //   Component, OnInit, signal, computed,
// //   ChangeDetectorRef, inject, ChangeDetectionStrategy, OnDestroy
// // } from '@angular/core';
// // import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { SelectModule } from 'primeng/select';
// // import { DatePicker } from 'primeng/datepicker';

// // import { AdminAnalyticsService } from '../admin-analytics.service';
// // import { CommonMethodService } from '../../core/utils/common-method.service';
// // import { MasterListService } from '../../core/services/master-list.service';
// // import { DataGridComponent, GridColumn } from '../../shared/ui/grid';
// // import { MasterDropdownComponent } from '../../modules/shared/components/masterFilterDropdown/master-dropdown.component';
// // import { Subject } from "rxjs";
// // import { takeUntil } from "rxjs/operators";

// // // Shared UI Components
// // import { PageComponent } from '../../shared/ui/layout/page/page.component';
// // import { PageHeaderComponent } from '../../shared/ui/layout/page-header/page-header.component';
// // import { PageContentComponent } from '../../shared/ui/layout/page-content/page-content.component';
// // import { PageToolbarComponent } from '../../shared/ui/layout/page-toolbar/page-toolbar.component';
// // import { SectionComponent } from '../../shared/ui/layout/section/section.component';
// // import { BentoGridComponent, BentoItemComponent } from '../../shared/ui/layout/bento-grid.component';
// // import { StatCardComponent } from '../../shared/ui/data/stat-card.component';
// // import { GlassCardComponent } from '../../shared/ui/data/glass-card.component';
// // import { CardComponent } from '../../shared/ui/data/card/card.component';
// // import { GradientBannerComponent } from '../../shared/ui/data/gradient-banner.component';
// // import { StatusBadgeComponent } from '../../shared/ui/badge/status-badge.component';
// // import { ButtonComponent } from '../../shared/ui/form/button.component';
// // import { LoadingComponent } from '../../shared/ui/feedback/loading/loading.component';
// // import { AvatarComponent } from '../../shared/ui/media/avatar.component';
// // import { WidgetRailComponent } from '@shared/ui/layout/widget-rail.component';
// // import { DataListComponent } from '../../shared/ui/data/list/data-list.component';
// // import { DataListRowComponent } from '../../shared/ui/data/list/data-list-row.component';
// // import { DataListCardComponent } from '../../shared/ui/data/list/data-list-card.component';

// // @Component({
// //   selector: 'app-admin-dashboard-ui',
// //   standalone: true,
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   imports: [
// //     CommonModule, FormsModule,
// //     TooltipModule, SelectModule, DatePicker,
// //     DataGridComponent, MasterDropdownComponent,
// //     PageComponent, PageHeaderComponent, PageContentComponent,
// //     WidgetRailComponent,
// //     StatCardComponent, CardComponent,
// //     DataListComponent, DataListRowComponent, DataListCardComponent,
// //     StatusBadgeComponent, ButtonComponent, LoadingComponent, AvatarComponent,
// //     BentoGridComponent, BentoItemComponent
// //   ],
// //   template: `
// // <app-page>
// //   <app-page-header title="Executive Dashboard" density="compact">
// //     <div class="flex items-end gap-4 compact-toolbar">
// //       <!-- Branch Selector -->
// //       <div class="flex flex-col gap-1.5">
// //         <label class="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Branch</label>
// //         <app-master-dropdown
// //           endpoint="branches"
// //           [(ngModel)]="selectedBranch"
// //           (onChange)="onFilterChange()"
// //           placeholder="All branches"
// //           class="w-[200px]">
// //         </app-master-dropdown>
// //       </div>

// //       <!-- Period Selector -->
// //       <div class="flex flex-col gap-1.5">
// //         <label class="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Period</label>
// //         <p-datepicker
// //           [(ngModel)]="dateRange"
// //           selectionMode="range"
// //           [showIcon]="true"
// //           (onSelect)="onFilterChange()"
// //           placeholder="Start – End"
// //           styleClass="w-[240px]">
// //         </p-datepicker>
// //       </div>
      
// //       <!-- Refresh Button -->
// //       <div class="flex items-center h-[36px]">
// //          <app-button 
// //             variant="secondary" 
// //             size="sm" 
// //             [icon]="loading() ? 'pi pi-refresh spin' : 'pi pi-refresh'" 
// //             (onClick)="loadDashboard()" 
// //             [disabled]="loading()" 
// //             pTooltip="Refresh data">
// //          </app-button>
// //       </div>
// //     </div>
// //   </app-page-header>

// //   <app-page-content density="compact">
// //     @if (loading()) {
// //       <div class="py-12">
// //         <app-loading text="Synchronising data..."></app-loading>
// //       </div>
// //     }

// //     @if (!loading() && dashboard()) {
// //       <div class="flex flex-col gap-[var(--spacing-3xl)] pb-8">
        
// //         <!-- Alerts Ribbon -->
// //         @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {
// //           <div class="flex items-center gap-3 p-[var(--spacing-md)] rounded-[var(--ui-border-radius-lg)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-[var(--color-warning)] text-[length:var(--font-size-sm)] shadow-sm">
// //             <i class="pi pi-exclamation-triangle"></i>
// //             <span><strong>{{ dashboard()!.alerts.lowStockCount }} items</strong> below reorder level — action required to prevent stockouts.</span>
// //           </div>
// //         }

// //         <!-- Top KPIs -->
// //         <app-widget-rail gap="var(--spacing-lg)" cardWidth="min(320px, 85vw)">
// //             <app-stat-card 
// //               label="Gross Revenue" 
// //               density="compact" [accent]="true" shadow="md" variant="primary"
// //               [value]="'₹' + (dashboard()!.financial.totalRevenue.value | number)"
// //               [change]="dashboard()!.financial.totalRevenue.growth != null ? dashboard()!.financial.totalRevenue.growth + '%' : undefined"
// //               trend="up"
// //               [description]="(dashboard()!.financial.totalRevenue.count | number) + ' transaction(s)'">
// //             </app-stat-card>
          
// //             <app-stat-card 
// //               label="Net Profit" 
// //               density="compact" [accent]="true" shadow="md"
// //               [value]="'₹' + (dashboard()!.financial.netProfit.value | number)"
// //               [change]="dashboard()!.financial.netProfit.status"
// //               [trend]="dashboard()!.financial.netProfit.status === 'profitable' ? 'up' : 'down'"
// //               [variant]="dashboard()!.financial.netProfit.status === 'profitable' ? 'success' : 'error'"
// //               [description]="'Margin: ' + dashboard()!.financial.netProfit.margin + '%'">
// //               <div sparkline class="w-full h-1 bg-[var(--border-secondary)] rounded-full mt-4 overflow-hidden">
// //                 <div class="h-full bg-[var(--color-success)]" [style.width.%]="dashboard()!.financial.netProfit.margin"></div>
// //               </div>
// //             </app-stat-card>

// //             <app-stat-card 
// //               label="Inventory Value" 
// //               icon="pi pi-box"
// //               density="compact" [accent]="true" shadow="md" variant="info"
// //               [value]="'₹' + (dashboard()!.inventory.summary.valuation | number:'1.0-0')"
// //               [description]="(dashboard()!.inventory.inventoryValuation.totalItems | number) + ' items · ' + (dashboard()!.inventory.inventoryValuation.productCount | number) + ' SKUs'">
// //                <div sparkline class="w-full h-1 bg-[var(--border-secondary)] rounded-full mt-4 overflow-hidden">
// //                  <div class="h-full bg-[var(--color-info)]" [style.width.%]="dashboard()!.inventory.healthScore"></div>
// //                </div>
// //             </app-stat-card>

// //              <app-stat-card 
// //               label="Outstanding Debt" 
// //               icon="pi pi-exclamation-circle"
// //               variant="error"
// //               density="compact" [accent]="true" shadow="md"
// //               [value]="'₹' + (dashboard()!.financial.outstanding.receivables | number)"
// //               [description]="dashboard()!.alerts.highRiskDebtCount + ' high-risk account(s)'">
// //             </app-stat-card>

// //           @if (dashboard()!.inventory.healthScore != null) {
// //                <app-stat-card 
// //                 label="System Health" 
// //                 icon="pi pi-heart"
// //                 density="compact" [accent]="true" shadow="md" variant="success"
// //                 [value]="dashboard()!.inventory.healthScore + '%'"
// //                 [description]="dashboard()!.inventory.summary.criticalAlerts + ' critical alerts'">
// //                </app-stat-card>
// //           }
// //         </app-widget-rail>

// //         <!-- Bento Grid Dashboard -->
// //         <app-bento-grid layout="analytics" density="comfortable">
          
// //           <!-- AI Insights -->
// //           <app-bento-item size="md" priority="high">
// //             <app-card>
// //               <div class="flex flex-col lg:flex-row lg:items-center gap-6 h-full">
// //                 <!-- Left: Title & Badge -->
// //                 <div class="flex flex-col gap-2 lg:w-1/3 shrink-0">
// //                   <h3 class="text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] m-0 tracking-tight">
// //                     AI Business Insights
// //                   </h3>
// //                   <div>
// //                     <app-status-badge status="info" variant="subtle" size="sm" [label]="dashboard()!.insights.count + ' insights'"></app-status-badge>
// //                   </div>
// //                 </div>
                
// //                 <!-- Right: Insights Message -->
// //                 <div class="flex-1 w-full">
// //                   @for (insight of dashboard()!.insights.insights; track insight.title) {
// //                     <div class="p-4 rounded-lg flex items-start gap-3 border border-black/5"
// //                       [class.bg-[var(--color-success-bg)]]="insight.type === 'positive'"
// //                       [class.bg-[var(--color-warning-bg)]]="insight.type === 'warning'"
// //                       [class.bg-[var(--color-info-bg)]]="insight.type === 'info'">
                      
// //                       <i class="pi text-lg mt-0.5"
// //                          [class.pi-check-circle]="insight.type === 'positive'"
// //                          [class.pi-exclamation-triangle]="insight.type === 'warning'"
// //                          [class.pi-info-circle]="insight.type === 'info'"
// //                          [class.text-[var(--color-success)]]="insight.type === 'positive'"
// //                          [class.text-[var(--color-warning)]]="insight.type === 'warning'"
// //                          [class.text-[var(--color-info)]]="insight.type === 'info'"></i>
                         
// //                       <div class="flex-1 flex flex-col gap-1">
// //                         <div class="flex items-center justify-between">
// //                           <span class="font-bold text-[var(--text-primary)] text-sm tracking-tight">{{ insight.title }}</span>
// //                           <app-status-badge [status]="insight.priority === 'high' ? 'error' : 'neutral'" size="sm" [label]="insight.priority | uppercase"></app-status-badge>
// //                         </div>
// //                         <span class="text-[var(--text-secondary)] text-xs">{{ insight.message }}</span>
// //                       </div>
// //                     </div>
// //                   }
// //                 </div>
// //               </div>
// //             </app-card>
// //           </app-bento-item>

// //           <!-- Operations -->
// //           <app-bento-item size="sm">
// //             <app-data-list title="Operations" icon="pi pi-cog" maxHeight="100%">
// //                         @for (cat of dashboard()!.topCategories; track cat.name) {
// //                           <div class="py-[var(--spacing-lg)] first:pt-2 last:pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            
// //                             <!-- Category Name & Margin -->
// //                             <div class="w-full lg:w-1/3">
// //                               <div class="font-bold text-[length:var(--font-size-md)] text-[var(--text-primary)] tracking-tight">{{ cat.name }}</div>
// //                               <div class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] font-medium mt-0.5">{{ cat.margin | number:'1.1-1' }}% margin</div>
// //                             </div>
                            
// //                             <!-- Progress Bars -->
// //                             <div class="w-full lg:w-2/3 flex flex-col sm:flex-row gap-6">
                              
// //                                <!-- Revenue Bar -->
// //                                <div class="flex-1 flex flex-col gap-1.5">
// //                                  <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
// //                                    <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-widest">Revenue</span>
// //                                    <span class="font-bold text-[length:var(--font-size-sm)] text-[var(--text-primary)]">₹{{ cat.revenue | number:'1.0-0' }}</span>
// //                                  </div>
// //                                  <div class="w-full h-2 bg-[var(--bg-ternary)] rounded-full overflow-hidden shadow-inner">
// //                                     <div class="h-full bg-[var(--accent-primary)] rounded-full" style="width:100%"></div>
// //                                  </div>
// //                                </div>
                               
// //                                <!-- Profit Bar -->
// //                                <div class="flex-1 flex flex-col gap-1.5">
// //                                  <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
// //                                    <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-widest">Profit</span>
// //                                    <span class="font-bold text-[length:var(--font-size-sm)] text-[var(--color-success)]">₹{{ cat.profit | number:'1.0-0' }}</span>
// //                                  </div>
// //                                  <div class="w-full h-2 bg-[var(--bg-ternary)] rounded-full overflow-hidden shadow-inner">
// //                                     <div class="h-full bg-[var(--color-success)] rounded-full transition-all duration-500" [style.width.%]="(cat.profit / cat.revenue) * 100"></div>
// //                                  </div>
// //                                </div>
// //                             </div>
// //                           </div>
// //                         }
// //              </app-data-list>
// //           </app-bento-item>

// //           <!-- Category Performance -->
// //           @if (dashboard()!.topCategories?.length) {
// //             <app-bento-item size="lg">
// //                <app-card title="Category Performance">
// //                  <div class="flex flex-col divide-y divide-[var(--border-secondary)]">

// //                  </div>
// //                </app-card>
// //             </app-bento-item>
// //           }

// //           <!-- Top Products -->
// //           @if (dashboard()!.leaders.topProducts?.length) {
// //             <app-bento-item size="md">
// //               <app-data-list title="Top Products" icon="pi pi-star" variant="spaced" maxHeight="100%">
// //                   @for (prod of dashboard()!.leaders.topProducts; track prod._id; let i = $index) {
// //                     <app-data-list-card [title]="prod.name" [subtitle]="(prod.soldQty | number) + ' sold · ₹' + (prod.profit | number:'1.0-0') + ' profit'">
// //                        <div leading class="font-bold text-[var(--text-tertiary)] text-[length:var(--font-size-md)] w-6 text-center">#{{ i + 1 }}</div>
// //                        <div trailing class="font-bold text-[var(--text-primary)]">₹{{ prod.revenue | number:'1.0-0' }}</div>
// //                     </app-data-list-card>
// //                   }
// //               </app-data-list>
// //             </app-bento-item>
// //           }

// //           <!-- Stock Urgency Grid -->
// //           <app-bento-item size="xl">
// //             <app-card title="Stock Urgency Monitor">
// //                  <ng-container ngProjectAs="[card-actions]">
// //                     <div class="flex items-center gap-2">
// //                       <app-status-badge status="error" variant="solid" [label]="dashboard()!.inventory.lowStockAlerts.length + ' Critical'"></app-status-badge>
// //                       <app-button variant="success" size="sm" icon="pi pi-file-excel" [label]="'Export Excel ' + dashboard()!.inventory.lowStockAlerts.length"></app-button>
// //                     </div>
// //                  </ng-container>
// //                  <div class="rounded-[var(--ui-border-radius-lg)] overflow-hidden relative h-[320px] flex flex-col">
// //                    <app-data-grid [viewOnly]="true" [pagination]="true" [toolbar]="false" 
// //                     [columns]="alertColumns"
// //                     [data]="dashboard()!.inventory.lowStockAlerts">
// //                    </app-data-grid>
// //                  </div>
// //             </app-card>
// //           </app-bento-item>

// //           <!-- Top Customers -->
// //           @if (dashboard()!.leaders.topCustomers?.length) {
// //             <app-bento-item size="sm">
// //               <app-data-list title="Top Customers" icon="pi pi-users" variant="spaced" maxHeight="100%">
// //                   @for (cust of dashboard()!.leaders.topCustomers; track cust._id; let i = $index) {
// //                     <app-data-list-card [title]="cust.name" [subtitle]="(cust.transactions | number) + ' transaction(s)'">
// //                        <div leading><app-avatar [name]="cust.name" size="sm"></app-avatar></div>
// //                        <div trailing class="font-bold text-[var(--color-success)]">₹{{ cust.totalSpent | number:'1.0-0' }}</div>
// //                     </app-data-list-card>
// //                   }
// //               </app-data-list>
// //             </app-bento-item>
// //           }
          
// //           <!-- Top Staff -->
// //           @if (dashboard()!.operations.topStaff?.length) {
// //              <app-bento-item size="sm">
// //                 <app-data-list title="Top Staff" icon="pi pi-id-card" variant="spaced" maxHeight="100%">
// //                     @for (staff of dashboard()!.operations.topStaff; track staff._id) {
// //                       <app-data-list-card [title]="staff.name" [subtitle]="(staff.count | number) + ' order(s)'">
// //                          <div leading><app-avatar [name]="staff.name" size="sm"></app-avatar></div>
// //                          <div trailing class="font-bold text-[var(--color-success)]">₹{{ staff.revenue | number:'1.0-0' }}</div>
// //                       </app-data-list-card>
// //                     }
// //                 </app-data-list>
// //              </app-bento-item>
// //           }

// //           <!-- Segments -->
// //           @if (dashboard()!.customers?.segmentation?.length) {
// //             <app-bento-item size="sm">
// //               <app-data-list title="Segments" icon="pi pi-chart-pie" maxHeight="100%">
// //                   @for (seg of dashboard()!.customers.segmentation; track seg._id) {
// //                     <app-data-list-row [label]="seg._id">
// //                       <span class="font-mono text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">{{ seg.count | number }}</span>
// //                     </app-data-list-row>
// //                   }
// //               </app-data-list>
// //             </app-bento-item>
// //           }
          
// //         </app-bento-grid>
// //       </div>
// //     }
// //   </app-page-content>
// // </app-page>
// //   `,
// //   styles: [`
// //     :host { display: block; width: 100%; }
    
// //     .spin { animation: spin 0.7s linear infinite; }
// //     @keyframes spin { to { transform: rotate(360deg); } }
    
// //     /* Toolbar Alignment & Sizes */
// //     .compact-toolbar {
// //       ::ng-deep .master-dropdown__control.p-select,
// //       ::ng-deep .master-dropdown__control.p-multiselect {
// //         min-height: 36px;
// //         height: 36px;
// //         border-radius: var(--ui-border-radius);
// //       }
// //       ::ng-deep .master-dropdown__control .p-select-label {
// //         padding: 0.35rem 0.75rem;
// //         font-size: 0.875rem;
// //       }
// //       ::ng-deep .p-datepicker-input {
// //         padding: 0.35rem 0.75rem;
// //         font-size: 0.875rem;
// //         height: 36px;
// //         border-radius: var(--ui-border-radius);
// //       }
// //       ::ng-deep .p-datepicker-trigger {
// //         width: 36px;
// //         height: 36px;
// //         border-top-right-radius: var(--ui-border-radius);
// //         border-bottom-right-radius: var(--ui-border-radius);
// //       }
// //       ::ng-deep .p-button.p-button-icon-only {
// //         width: 36px;
// //         height: 36px;
// //         padding: 0;
// //       }
// //     }
// //   `]
// // })
// // export class AdminDashboardUiComponent implements OnInit, OnDestroy {
// //   private readonly destroy$ = new Subject<void>();
// //   dashboard = signal<any>(null);
// //   loading = signal(true);

// //   masterList = inject(MasterListService);

// //   selectedBranch = '';
// //   dateRange: Date[] | null = null;
// //   alertColumns: any[] = [];

// //   constructor(
// //     private analyticsService: AdminAnalyticsService,
// //     public commonService: CommonMethodService,
// //     private cdr: ChangeDetectorRef
// //   ) { }

// //   ngOnInit(): void {
// //     this.setupColumns();
// //     this.loadDashboard();
// //   }

// //   setupColumns(): void {
// //     this.alertColumns = [
// //       {
// //         field: 'name',
// //         headerName: 'Item',
// //         flex: 2,
// //         cellStyle: { 'font-weight': 'var(--font-weight-semibold)', 'font-size': 'var(--font-size-sm)' }
// //       },
// //       {
// //         field: 'sku',
// //         headerName: 'SKU',
// //         flex: 1,
// //         cellStyle: { 'font-family': 'var(--font-mono)', 'font-size': 'var(--font-size-xs)', 'color': 'var(--text-tertiary)' }
// //       },
// //       {
// //         field: 'currentStock',
// //         headerName: 'Stock',
// //         flex: 1,
// //         cellStyle: (p: any) => ({
// //           'color': p.value === 0 ? 'var(--color-error)' : 'var(--color-warning)',
// //           'font-weight': 'var(--font-weight-bold)',
// //           'font-family': 'var(--font-mono)',
// //           'font-size': 'var(--font-size-sm)'
// //         })
// //       },
// //       {
// //         field: 'reorderLevel',
// //         headerName: 'Reorder',
// //         flex: 1,
// //         cellStyle: { 'color': 'var(--text-tertiary)', 'font-size': 'var(--font-size-sm)' }
// //       },
// //       {
// //         field: 'urgency',
// //         headerName: 'Urgency',
// //         flex: 1,
// //         cellRenderer: (p: any) =>
// //           `<span style="
// //             display:inline-flex; align-items:center;
// //             font-size:var(--font-size-xs); font-weight:var(--font-weight-bold);
// //             text-transform:uppercase; letter-spacing:0.05em;
// //             padding:2px 8px; border-radius:var(--ui-border-radius-pill);
// //             background:var(--color-error-bg); color:var(--color-error);
// //             border:1px solid var(--color-error-border);
// //           ">${p.value}</span>`
// //       }
// //     ];
// //     this.cdr.detectChanges();
// //   }

// //   loadDashboard(): void {
// //     this.loading.set(true);

// //     let start: string | undefined;
// //     let end: string | undefined;

// //     if (this.dateRange?.length === 2) {
// //       start = this.dateRange[0]?.toISOString();
// //       end = this.dateRange[1]?.toISOString();
// //     }

// //     this.analyticsService.getDashboardOverview(start, end, this.selectedBranch)
// //       .pipe(takeUntil(this.destroy$))
// //       .subscribe({
// //         next: (res) => {
// //           this.dashboard.set(res.data);
// //           this.loading.set(false);
// //         },
// //         error: () => this.loading.set(false)
// //       });
// //   }

// //   onFilterChange(): void {
// //     this.loadDashboard();
// //   }

// //   ngOnDestroy(): void {
// //     this.destroy$.next();
// //     this.destroy$.complete();
// //   }
// // }


