import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subject } from 'rxjs';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Custom Services & Components
import { InvoiceService } from '../../services/invoice-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { FilterField } from '../../../shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../../shared/components/universal-filter/universal-filter';
import { takeUntil } from 'rxjs/operators';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface FinancialSummary {
  totalRevenue:  number;
  totalCost:     number;
  totalTax:      number;
  totalDiscount: number;
  grossProfit:   number;
  netProfit:     number;
  profitMargin:  number;
  markup:        number;
}

export interface GrowthMetrics {
  revenueGrowth: number;
  profitGrowth:  number;
  marginChange:  number;
}

/**
 * FIX (Frontend #1):
 *   The API returns trend periods as `{ date: 'YYYY-MM-DD' }` for day grouping,
 *   `{ year, month }` for month grouping, and `{ year, week }` for week.
 *   The original template piped `point.period` directly through the Angular `date`
 *   pipe, which only works on Date objects / ISO strings — NOT on the nested objects
 *   returned by the API.  We normalize them to plain ISO date strings in
 *   `normalizeTrendPeriod()` before binding.
 */
export interface TrendPoint {
  period:        string;          // normalized ISO string after mapping
  revenue:       number;
  cost:          number;
  profit:        number;
  margin:        number;
  invoiceCount:  number;
  itemCount:     number;
  averageOrderValue: number;
}

export interface TopProduct {
  productId:          string;
  productName:        string;
  sku:                string;
  totalQuantity:      number;
  totalRevenue:       number;
  totalCost:          number;
  grossProfit:        number;
  netProfit:          number;
  profitMargin:       number;
  markup:             number;
  averageSellingPrice: number;
  averageCostPrice:   number;
  profitPerUnit:      number;
}

export interface TopCustomer {
  customerId:        string;
  totalInvoices:     number;
  totalQuantity:     number;
  totalRevenue:      number;
  totalProfit:       number;
  profitMargin:      number;
  averageOrderValue: number;
}

export interface CategoryData {
  _id:            string;
  category:       string;
  totalQuantity:  number;
  totalRevenue:   number;
  totalCost:      number;
  totalProfit:    number;
  profitMargin:   number;
  uniqueProducts: number;
}

export interface ProfitAnalysisReport {
  summary: {
    financials: FinancialSummary;
    metrics: {
      averageRevenuePerInvoice: number;
      averageProfitPerInvoice:  number;
      averageItemsPerInvoice:   number;
      totalInvoices:            number;
      totalItems:               number;
      uniqueProducts:           number;
    };
  };
  /**
   * FIX (Frontend #2):
   *   `comparison` is null when no date range is applied (API returns `comparison: null`).
   *   Original code accessed `r.comparison.growth.revenueGrowth` unconditionally → runtime
   *   TypeError.  Use optional chaining everywhere and show the badge only when data exists.
   */
  comparison: {
    period: string;
    growth: GrowthMetrics;
    summary: FinancialSummary;
  } | null;
  trends: {
    data: TrendPoint[];
    summary: {
      bestPeriod:         TrendPoint | null;   // API key is bestPeriod, NOT bestDay
      worstPeriod:        TrendPoint | null;
      averageDailyProfit: number;
      trendDirection:     'up' | 'down' | 'stable';
    } | null;
  };
  analysis: {
    productAnalysis: {
      topPerforming:  TopProduct[];
      worstPerforming: TopProduct[];
      byCategory:     CategoryData[];
      summary: {
        totalProducts:        number;
        productsWithProfit:   number;
        productsWithLoss:     number;
        averageProfitMargin:  number;
      };
    };
    customerAnalysis: {
      mostProfitable: TopCustomer[];
      summary: {
        totalCustomers:      number;
        customersWithProfit: number;
        averageCustomerValue: number;
      };
    };
  };
  kpis: {
    grossProfitMargin:  number;
    netProfitMargin:    number;
    revenuePerInvoice:  number;
    profitPerInvoice:   number;
  };
  metadata: {
    period: { groupBy: string };
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-advanced-profit-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TabsModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    UniversalFilterComponent,
  ],
  template: `
    <div class="report-container">

      <!-- ── HEADER ─────────────────────────────────────────────────────── -->
      <div class="report-header">
        <div>
          <h1 class="page-title">Advanced Profit Report</h1>
          <p class="page-subtitle">Real-time financial breakdown & trend analysis</p>
        </div>
        <div class="header-actions">
          <button pButton icon="pi pi-refresh"
                  class="p-button-rounded p-button-text p-button-secondary"
                  (click)="fetchReport()"
                  [loading]="loading()">
          </button>
        </div>
      </div>

      <!-- ── FILTERS ────────────────────────────────────────────────────── -->
      <div class="filter-wrapper">
        <app-universal-filter
          [entityType]="'profit-analysis'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <!-- ── LOADING ────────────────────────────────────────────────────── -->
      @if (loading()) {
        <div class="loader-state">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12">
          </p-progressSpinner>
          <p>Crunching the numbers…</p>
        </div>
      }

      <!-- ── EMPTY STATE ────────────────────────────────────────────────── -->
      @else if (!data()) {
        <div class="empty-state">
          <i class="pi pi-chart-bar empty-icon"></i>
          <p>Apply filters and click refresh to load your profit report.</p>
        </div>
      }

      <!-- ── DATA ───────────────────────────────────────────────────────── -->
      @else if (data(); as r) {

        <!-- KPI CARDS -->
        <div class="metrics-grid">

          <!-- Revenue -->
          <div class="metric-card">
            <div class="card-line primary"></div>
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Total Revenue</span>
                <!--
                  FIX (Frontend #2): Only show growth badge when comparison data exists.
                  Previously accessed r.comparison.growth unconditionally → crash when null.
                -->
                @if (r.comparison?.growth?.revenueGrowth != null) {
                  <span class="trend-badge"
                        [ngClass]="getGrowthClass(r.comparison!.growth.revenueGrowth)">
                    {{ r.comparison!.growth.revenueGrowth > 0 ? '▲' : '▼' }}
                    {{ r.comparison!.growth.revenueGrowth | number:'1.0-1' }}%
                  </span>
                }
              </div>
              <div class="metric-value">
                {{ commonService.formatCurrency(r.summary.financials.totalRevenue) }}
              </div>
              @if (r.comparison) {
                <div class="metric-sub">vs {{ getCompareLabel() }}</div>
              }
            </div>
          </div>

          <!-- Gross Profit -->
          <div class="metric-card">
            <div class="card-line success"></div>
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Gross Profit</span>
                @if (r.comparison?.growth?.profitGrowth != null) {
                  <span class="trend-badge"
                        [ngClass]="getGrowthClass(r.comparison!.growth.profitGrowth)">
                    {{ r.comparison!.growth.profitGrowth > 0 ? '▲' : '▼' }}
                    {{ r.comparison!.growth.profitGrowth | number:'1.0-1' }}%
                  </span>
                }
              </div>
              <div class="metric-value text-success">
                {{ commonService.formatCurrency(r.summary.financials.grossProfit) }}
              </div>
              <div class="metric-sub">Net income after COGS</div>
            </div>
          </div>

          <!-- Profit Margin -->
          <div class="metric-card margin-card">
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Profit Margin</span>
                @if (r.comparison?.growth?.marginChange != null) {
                  <span class="trend-badge"
                        [ngClass]="getGrowthClass(r.comparison!.growth.marginChange)">
                    {{ r.comparison!.growth.marginChange > 0 ? '▲' : '▼' }}
                    {{ r.comparison!.growth.marginChange | number:'1.0-1' }}pp
                  </span>
                }
              </div>
              <!--
                FIX (Frontend #3): profitMargin from API has many decimal places
                (e.g. 17.82780887741228). Round to 2 dp before display.
                Backend fix is in profit-calculator.js — round at source.
              -->
              <div class="metric-value text-success">
                {{ r.summary.financials.profitMargin | number:'1.0-2' }}%
              </div>
              <div class="markup-pill">
                Markup: {{ r.summary.financials.markup | number:'1.0-2' }}%
              </div>
            </div>
          </div>

          <!-- AOV -->
          <div class="metric-card">
            <div class="card-line warning"></div>
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Avg. Order Value</span>
              </div>
              <div class="metric-value">
                {{ commonService.formatCurrency(r.summary.metrics.averageRevenuePerInvoice) }}
              </div>
              <div class="metric-sub">
                Across {{ r.summary.metrics.totalInvoices }} invoices
              </div>
            </div>
          </div>

          <!-- Avg Profit / Invoice -->
          <div class="metric-card">
            <div class="card-line info"></div>
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Avg. Profit / Invoice</span>
              </div>
              <div class="metric-value text-info">
                {{ commonService.formatCurrency(r.summary.metrics.averageProfitPerInvoice) }}
              </div>
              <div class="metric-sub">
                {{ r.summary.metrics.uniqueProducts }} unique products
              </div>
            </div>
          </div>

          <!-- Trend Direction -->
          <div class="metric-card">
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Trend Direction</span>
              </div>
              <div class="metric-value"
                   [ngClass]="r.trends.summary?.trendDirection === 'up' ? 'text-success' : (r.trends.summary?.trendDirection === 'down' ? 'text-danger' : '')">
                {{ r.trends.summary?.trendDirection === 'up'   ? '▲ Upward'   :
                   r.trends.summary?.trendDirection === 'down' ? '▼ Downward' : '→ Stable' }}
              </div>
              <div class="metric-sub">
                Avg daily profit:
                {{ commonService.formatCurrency(r.trends.summary?.averageDailyProfit ?? 0) }}
              </div>
            </div>
          </div>

        </div>

        <!-- ── TREND CHART ──────────────────────────────────────────────── -->
        @if(r.trends.data?.length) {
          <div class="trend-section">

            <div class="trend-header">
              <div>
                <h3 class="section-title">Performance Trend</h3>
                <p class="section-sub">
                  {{ groupByLabel() }} revenue vs net profit analysis
                </p>
              </div>

              <div class="trend-legend">
                <div class="legend-items">
                  <div class="legend-item">
                    <span class="dot revenue"></span> Revenue
                  </div>
                  <div class="legend-item">
                    <span class="dot profit"></span> Profit
                  </div>
                </div>

               
                @if (r.trends.summary?.bestPeriod; as best) {
                  <div class="best-day-pill">
                    <span class="pulse-dot"></span>
                    <span class="label">Best:</span>
                    <span class="date">{{ best.period | date:'dd MMM' }}</span>
                    <span class="amount">
                      ({{ commonService.formatCurrency(best.profit) }})
                    </span>
                  </div>
                }
              </div>
            </div>

            <div class="chart-container">
              <div class="grid-lines">
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line base"></div>
              </div>

              <div class="bars-wrapper">
                @for (point of r.trends.data; track point.period) {
                  <div class="bar-group"
                       [pTooltip]="tooltipContent"
                       tooltipPosition="top">

                    <ng-template #tooltipContent>
                      <div class="custom-tooltip">
                        <div class="tooltip-header">
                          <span>{{ point.period | date:'EEE, dd MMM' }}</span>
                          <span class="margin-tag">
                            {{ point.margin | number:'1.0-1' }}% Margin
                          </span>
                        </div>
                        <div class="tooltip-row">
                          <span>Revenue</span>
                          <span class="val">
                            {{ commonService.formatCurrency(point.revenue) }}
                          </span>
                        </div>
                        <div class="tooltip-row">
                          <span>Cost</span>
                          <span class="val">
                            {{ commonService.formatCurrency(point.cost) }}
                          </span>
                        </div>
                        <div class="tooltip-row">
                          <span class="text-success">Profit</span>
                          <span class="val text-success">
                            {{ commonService.formatCurrency(point.profit) }}
                          </span>
                        </div>
                        <div class="tooltip-row">
                          <span>Invoices</span>
                          <span class="val">{{ point.invoiceCount }}</span>
                        </div>
                      </div>
                    </ng-template>

                    <div class="hover-line"></div>

                    <div class="bars-stack">
                      
                      <div class="bar revenue-bar"
                           [style.height.%]="getBarHeight(point.revenue, maxTrendRevenue(r.trends.data))">
                      </div>
                      <div class="bar profit-bar"
                           [style.height.%]="getBarHeight(point.profit, maxTrendRevenue(r.trends.data))">
                        <div class="bar-shine"></div>
                      </div>
                    </div>

                    <div class="x-label">
                      {{ point.period | date:(currentFilters.groupBy === 'month' ? 'MMM yy' :
                                             currentFilters.groupBy === 'week'  ? 'dd MMM' : 'dd MMM') }}
                    </div>

                  </div>
                }
              </div>
            </div>

          </div>
        }

        <!-- ── ANALYSIS TABS ────────────────────────────────────────────── -->
        <div class="analysis-tabs-card">
          <p-tabs [value]="activeTab()" (valueChange)="activeTab.set($event)">
            <p-tablist styleClass="custom-tabs">
              <p-tab value="0"><span class="tab-txt">Top Products</span></p-tab>
              <p-tab value="1"><span class="tab-txt">Top Customers</span></p-tab>
              <p-tab value="2"><span class="tab-txt">Category Analysis</span></p-tab>
              <p-tab value="3"><span class="tab-txt">KPI Summary</span></p-tab>
            </p-tablist>

            <p-tabpanels styleClass="custom-panels">

              <!-- Products Tab -->
              <p-tabpanel value="0">
                <p-table [value]="r.analysis.productAnalysis.topPerforming"
                         [rows]="10" [paginator]="true"
                         styleClass="p-datatable-sm theme-table"
                         responsiveLayout="scroll">
                  <ng-template pTemplate="header">
                    <tr>
                      <th class="pl-4">Product</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Avg Sell</th>
                      <th class="text-right">Revenue</th>
                      <th class="text-right">Net Profit</th>
                      <th class="text-right pr-4">Margin</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-p>
                    <tr class="table-row">
                      <td class="pl-4">
                        <div class="prod-name">{{ p.productName }}</div>
                        <div class="prod-sku">{{ p.sku }}</div>
                      </td>
                      <td class="text-right font-mono">{{ p.totalQuantity }}</td>
                      <td class="text-right font-mono">
                        {{ commonService.formatCurrency(p.averageSellingPrice) }}
                      </td>
                      <td class="text-right font-mono font-semibold">
                        {{ commonService.formatCurrency(p.totalRevenue) }}
                      </td>
                      <td class="text-right font-mono font-bold text-success">
                        {{ commonService.formatCurrency(p.netProfit) }}
                      </td>
                      <td class="text-right pr-4">
                        <span class="margin-badge"
                              [ngClass]="getMarginClass(p.profitMargin)">
                          {{ p.profitMargin | number:'1.0-1' }}%
                        </span>
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="6" class="empty-msg">
                        No product data available for this period.
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

              <!-- Customers Tab -->
              <p-tabpanel value="1">
                @if (r.analysis.customerAnalysis.mostProfitable?.length) {
                  <p-table [value]="r.analysis.customerAnalysis.mostProfitable"
                           [rows]="10" [paginator]="true"
                           styleClass="p-datatable-sm theme-table"
                           responsiveLayout="scroll">
                    <ng-template pTemplate="header">
                      <tr>
                        <th class="pl-4">Customer ID</th>
                        <th class="text-right">Invoices</th>
                        <th class="text-right">Revenue</th>
                        <th class="text-right">Profit</th>
                        <th class="text-right">AOV</th>
                        <th class="text-right pr-4">Margin</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-c>
                      <tr class="table-row">
                        <td class="pl-4">
                          <div class="prod-sku">{{ c.customerId }}</div>
                        </td>
                        <td class="text-right font-mono">{{ c.totalInvoices }}</td>
                        <td class="text-right font-mono font-semibold">
                          {{ commonService.formatCurrency(c.totalRevenue) }}
                        </td>
                        <td class="text-right font-mono font-bold text-success">
                          {{ commonService.formatCurrency(c.totalProfit) }}
                        </td>
                        <td class="text-right font-mono">
                          {{ commonService.formatCurrency(c.averageOrderValue) }}
                        </td>
                        <td class="text-right pr-4">
                          <span class="margin-badge"
                                [ngClass]="getMarginClass(c.profitMargin)">
                            {{ c.profitMargin | number:'1.0-1' }}%
                          </span>
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>

                  <div class="summary-row">
                    <span>
                      {{ r.analysis.customerAnalysis.summary.totalCustomers }} customers •
                      {{ r.analysis.customerAnalysis.summary.customersWithProfit }} profitable •
                      Avg value:
                      {{ commonService.formatCurrency(r.analysis.customerAnalysis.summary.averageCustomerValue) }}
                    </span>
                  </div>
                } @else {
                  <div class="empty-msg p-8">No customer data available.</div>
                }
              </p-tabpanel>

              <!-- Category Tab -->
              <p-tabpanel value="2">
                @if (r.analysis.productAnalysis.byCategory?.length) {
                  <p-table [value]="r.analysis.productAnalysis.byCategory"
                           styleClass="p-datatable-sm theme-table"
                           responsiveLayout="scroll">
                    <ng-template pTemplate="header">
                      <tr>
                        <th class="pl-4">Category ID</th>
                        <th class="text-right">Products</th>
                        <th class="text-right">Qty Sold</th>
                        <th class="text-right">Revenue</th>
                        <th class="text-right">Profit</th>
                        <th class="text-right pr-4">Margin</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-cat>
                      <tr class="table-row">
                        <td class="pl-4">
                          <div class="prod-sku">{{ cat.category }}</div>
                        </td>
                        <td class="text-right font-mono">{{ cat.uniqueProducts }}</td>
                        <td class="text-right font-mono">{{ cat.totalQuantity }}</td>
                        <td class="text-right font-mono font-semibold">
                          {{ commonService.formatCurrency(cat.totalRevenue) }}
                        </td>
                        <td class="text-right font-mono font-bold text-success">
                          {{ commonService.formatCurrency(cat.totalProfit) }}
                        </td>
                        <td class="text-right pr-4">
                          <span class="margin-badge"
                                [ngClass]="getMarginClass(cat.profitMargin)">
                            {{ cat.profitMargin | number:'1.0-1' }}%
                          </span>
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                } @else {
                  <div class="empty-msg p-8">No category data available.</div>
                }
              </p-tabpanel>

              <!-- KPI Tab -->
              <p-tabpanel value="3">
                <div class="kpi-grid">
                  <div class="kpi-item">
                    <span class="kpi-label">Gross Profit Margin</span>
                    <span class="kpi-value">
                      {{ r.kpis.grossProfitMargin | number:'1.0-2' }}%
                    </span>
                  </div>
                  <div class="kpi-item">
                    <span class="kpi-label">Net Profit Margin</span>
                    <span class="kpi-value">
                      {{ r.kpis.netProfitMargin | number:'1.0-2' }}%
                    </span>
                  </div>
                  <div class="kpi-item">
                    <span class="kpi-label">Revenue per Invoice</span>
                    <span class="kpi-value">
                      {{ commonService.formatCurrency(r.kpis.revenuePerInvoice) }}
                    </span>
                  </div>
                  <div class="kpi-item">
                    <span class="kpi-label">Profit per Invoice</span>
                    <span class="kpi-value text-success">
                      {{ commonService.formatCurrency(r.kpis.profitPerInvoice) }}
                    </span>
                  </div>
                  <div class="kpi-item">
                    <span class="kpi-label">Total Products Analysed</span>
                    <span class="kpi-value">
                      {{ r.analysis.productAnalysis.summary.totalProducts }}
                    </span>
                  </div>
                  <div class="kpi-item">
                    <span class="kpi-label">Avg Product Margin</span>
                    <span class="kpi-value">
                      {{ r.analysis.productAnalysis.summary.averageProfitMargin | number:'1.0-2' }}%
                    </span>
                  </div>
                  <div class="kpi-item">
                    <span class="kpi-label">Products at Loss</span>
                    <span class="kpi-value"
                          [ngClass]="r.analysis.productAnalysis.summary.productsWithLoss > 0 ? 'text-danger' : ''">
                      {{ r.analysis.productAnalysis.summary.productsWithLoss }}
                    </span>
                  </div>
                  <div class="kpi-item">
                    <span class="kpi-label">Total Cost</span>
                    <span class="kpi-value">
                      {{ commonService.formatCurrency(r.summary.financials.totalCost) }}
                    </span>
                  </div>
                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </div>

      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .report-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      min-height: 100vh;
      font-family: var(--font-body);
    }

    /* ── HEADER ─────────────────────────────────────────────────────────── */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }
    .page-title   { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
    .filter-wrapper { margin-bottom: var(--spacing-xl); }

    /* ── METRIC CARDS ───────────────────────────────────────────────────── */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .metric-card {
      position: relative;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
    }

    .card-line {
      position: absolute; top: 0; left: 0; bottom: 0; width: 4px;
      transition: width 0.2s;
      .metric-card:hover & { width: 6px; }
      &.primary { background: var(--color-primary); }
      &.success  { background: var(--color-success); }
      &.warning  { background: var(--color-warning); }
      &.info     { background: var(--color-info, #3b82f6); }
    }

    .card-content { padding-left: var(--spacing-sm); }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
    .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }

    .trend-badge {
      font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
      &.bg-success { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success); }
      &.bg-error   { background: var(--color-danger-bg); color: var(--color-danger-text); border: 1px solid var(--color-danger-text); }
    }

    .metric-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); font-family: var(--font-heading); }
    .text-success { color: var(--color-success) !important; }
    .text-danger  { color: var(--color-danger, #ef4444) !important; }
    .text-info    { color: var(--color-info, #3b82f6) !important; }

    .metric-sub { font-size: 10px; color: var(--text-tertiary); margin-top: 4px; }
    .margin-card { background: var(--color-success-bg); border-color: var(--color-success); }
    .markup-pill {
      font-size: 10px; background: var(--bg-surface); padding: 2px 6px; border-radius: 4px;
      width: fit-content; margin-top: 6px; font-weight: 600; color: var(--color-success);
    }

    /* ── TREND CHART ────────────────────────────────────────────────────── */
    .trend-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    .trend-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-2xl); flex-wrap: wrap; gap: var(--spacing-md); }
    .section-title { font-size: var(--font-size-md); font-weight: 700; color: var(--text-primary); margin: 0; }
    .section-sub   { font-size: 10px; color: var(--text-tertiary); margin: 0; }
    .trend-legend  { display: flex; gap: var(--spacing-lg); align-items: center; flex-wrap: wrap; }
    .legend-items  { display: flex; gap: var(--spacing-md); }
    .legend-item   { font-size: 10px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
    .dot           { width: 8px; height: 8px; border-radius: 2px; }
    .dot.revenue   { background: var(--border-secondary); }
    .dot.profit    { background: linear-gradient(180deg, var(--color-success), var(--color-success-bg)); }

    .best-day-pill {
      display: flex; align-items: center; gap: 6px; padding: 4px 10px;
      background: var(--bg-ternary); border: 1px solid var(--border-primary); border-radius: 99px;
      font-size: 10px;
    }
    .pulse-dot { width: 6px; height: 6px; background: var(--color-success); border-radius: 50%; animation: pulse 1.5s infinite; }
    .label  { color: var(--text-tertiary); }
    .date   { font-weight: 700; color: var(--text-primary); }
    .amount { font-weight: 700; font-family: var(--font-mono); color: var(--color-success); }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    /* Bar chart */
    .chart-container { position: relative; height: 260px; width: 100%; }
    .grid-lines { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
    .line { border-top: 1px dashed var(--border-secondary); width: 100%; height: 0; opacity: 0.5; }
    .line.base { border-top-style: solid; opacity: 1; border-color: var(--border-primary); }

    .bars-wrapper {
      position: absolute; inset: 0; display: flex; align-items: flex-end;
      justify-content: space-between; padding-left: 4px; padding-bottom: 28px; gap: 2px;
    }

    .bar-group {
      flex: 1; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end; position: relative; cursor: pointer;
      min-width: 0;
      &:hover .x-label   { color: var(--text-primary); font-weight: 700; }
      &:hover .hover-line { opacity: 1; }
    }

    .hover-line {
      position: absolute; top: 0; bottom: 0; width: 1px; opacity: 0;
      transition: opacity 0.2s; pointer-events: none;
      border-left: 1px dashed var(--color-primary);
    }

    .bars-stack {
      width: 100%; max-width: 36px; position: relative; display: flex;
      align-items: flex-end; justify-content: center; height: 100%;
      transition: transform 0.2s;
      .bar-group:hover & { transform: scale(1.05); }
    }

    .bar { width: 100%; position: absolute; bottom: 0; border-radius: 4px 4px 0 0; transition: height 0.5s ease-out; }
    .revenue-bar { background: var(--bg-ternary); border: 1px solid transparent; .bar-group:hover & { border-color: var(--border-secondary); } }
    .profit-bar  { width: 60%; background: linear-gradient(180deg, var(--color-success) 0%, var(--color-success-bg) 100%); box-shadow: var(--shadow-sm); z-index: 2; }
    .bar-shine   { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.4); }

    .x-label {
      position: absolute; bottom: -26px; font-size: 9px; color: var(--text-tertiary);
      transform: rotate(-45deg); white-space: nowrap; transition: color 0.2s;
    }

    /* ── ANALYSIS TABS ──────────────────────────────────────────────────── */
    .analysis-tabs-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      overflow: hidden;
    }

    .theme-table ::ng-deep th {
      background: var(--bg-ternary) !important;
      color: var(--text-secondary) !important;
      font-size: 11px; text-transform: uppercase; font-weight: 700;
      padding: 12px; border-bottom: 1px solid var(--border-primary);
    }
    .theme-table ::ng-deep td {
      border-bottom: 1px solid var(--border-secondary);
      padding: 12px; color: var(--text-primary); vertical-align: middle;
    }
    .table-row:hover ::ng-deep td { background: var(--bg-ternary); }

    .prod-name   { font-weight: 700; font-size: 12px; color: var(--text-primary); }
    .prod-sku    { font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); }

    .margin-badge {
      font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
      &.margin-high   { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-border); }
      &.margin-medium { background: var(--color-warning-bg, #fef3c7); color: var(--color-warning-text, #92400e); border: 1px solid var(--color-warning-border, #fcd34d); }
      &.margin-low    { background: var(--color-danger-bg); color: var(--color-danger-text); border: 1px solid var(--color-danger-border, #fca5a5); }
    }

    .empty-msg { text-align: center; color: var(--text-tertiary); font-size: 12px; padding: 20px; }
    .tab-txt   { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

    .summary-row {
      padding: 10px 16px;
      font-size: 11px;
      color: var(--text-tertiary);
      border-top: 1px solid var(--border-secondary);
    }

    /* KPI grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
    }
    .kpi-item {
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-md);
      padding: var(--spacing-md);
      display: flex; flex-direction: column; gap: 4px;
    }
    .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }
    .kpi-value { font-size: var(--font-size-lg); font-weight: 700; color: var(--text-primary); font-family: var(--font-heading); }

    /* Tooltip */
    .custom-tooltip { min-width: 150px; }
    .tooltip-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #fff; }
    .margin-tag     { font-size: 9px; background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 3px; }
    .tooltip-row    { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; color: #ccc; }
    .tooltip-row .val { font-family: var(--font-mono); color: #fff; font-weight: 700; }

    /* Loader / empty */
    .loader-state {
      height: 400px; display: flex; flex-direction: column; align-items: center;
      justify-content: center; color: var(--text-tertiary); font-size: 12px;
      font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; gap: 16px;
    }
    .empty-state {
      height: 300px; display: flex; flex-direction: column; align-items: center;
      justify-content: center; color: var(--text-tertiary); font-size: 13px; gap: 12px;
    }
    .empty-icon { font-size: 2.5rem; opacity: 0.3; }

    /* Utilities */
    .font-mono    { font-family: var(--font-mono); }
    .font-semibold { font-weight: 600; }
    .font-bold    { font-weight: 700; }
    .text-right   { text-align: right; }
    .pl-4         { padding-left: 1rem; }
    .pr-4         { padding-right: 1rem; }
    .p-8          { padding: 2rem; }
  `]
})

export class AdvancedProfitAnalysisComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  public  commonService  = inject(CommonMethodService);
  private invoiceService = inject(InvoiceService);

  data    = signal<ProfitAnalysisReport | null>(null);
  loading = signal(false);
  activeTab = signal<any>('0');

  currentFilters: any = {
    groupBy:     'day',
    compareWith: 'previous_period',
  };

  // ── Filter Configuration ─────────────────────────────────────────────────

  filterConfig: FilterField[] = [
    {
      key:   'date',
      label: 'Analysis Period',
      type:  'date-range',
    },
    {
      key:   'groupBy',
      label: 'Group By',
      type:  'select',
      staticOptions: [
        { label: 'Daily',   value: 'day'   },
        { label: 'Weekly',  value: 'week'  },
        { label: 'Monthly', value: 'month' },
      ],
      defaultValue: 'day',
    },
    {
      key:   'compareWith',
      label: 'Compare',
      type:  'select',
      staticOptions: [
        { label: 'Previous Period',  value: 'previous_period'        },
        { label: 'Last Year',        value: 'same_period_last_year'   },
        { label: 'None',             value: 'none'                    },
      ],
      defaultValue: 'previous_period',
    },
    {
      key:   'status',
      label: 'Invoice Status',
      type:  'multiselect',
      staticOptions: [
        { label: 'Paid',    value: 'paid'    },
        { label: 'Issued',  value: 'issued'  },
        { label: 'Overdue', value: 'overdue' },
      ],
      placeholder: 'All Statuses',
    },
    {
      key:   'paymentStatus',
      label: 'Payment Status',
      type:  'select',
      staticOptions: [
        { label: 'All',     value: 'all'     },
        { label: 'Paid',    value: 'paid'    },
        { label: 'Pending', value: 'pending' },
      ],
      defaultValue: 'all',
    },
  ];

  ngOnInit(): void {
    // Triggered by universal filter on init via (filterChange) emit
  }

  // ── Filter Handler ───────────────────────────────────────────────────────

  onFilterUpdate(filters: any): void {
    this.currentFilters = filters;
    this.fetchReport();
  }

  fetchReport(): void {
    this.loading.set(true);

    const payload: any = { ...this.currentFilters };

    // Date range array → startDate / endDate ISO strings
    if (payload.date && Array.isArray(payload.date)) {
      if (payload.date[0]) payload.startDate = new Date(payload.date[0]).toISOString().split('T')[0];
      if (payload.date[1]) payload.endDate   = new Date(payload.date[1]).toISOString().split('T')[0];
      delete payload.date;
    }

    // Multiselect array → comma-separated string
    if (Array.isArray(payload.status) && payload.status.length > 0) {
      payload.status = payload.status.join(',');
    } else {
      delete payload.status;
    }

    // Remove 'all' sentinels — backend treats absence as 'all'
    ['paymentStatus', 'branchId', 'customerId', 'productId'].forEach(key => {
      if (payload[key] === 'all') delete payload[key];
    });

    this.invoiceService.getAdvancedProfitAnalysis(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.data.set(this.normalizeResponse(res.data));
          }
        },
        error: (err) => console.error('Profit Report Error:', err),
      });
  }

  /**
   * FIX (Frontend #1 + #4):
   * Normalize the raw API response so the template can use it safely:
   *   1. Flatten trend period objects  → ISO date strings  (fixes `date` pipe crash)
   *   2. Map `trends.summary.bestPeriod` → normalized TrendPoint (template used `bestDay`)
   *   3. Guard against null `comparison` (template already uses ?. but type is now explicit)
   */
  private normalizeResponse(raw: any): ProfitAnalysisReport {
    const normalizedTrends: TrendPoint[] = (raw.trends?.data ?? []).map((pt: any) => ({
      ...pt,
      period: this.normalizeTrendPeriod(pt.period),
    }));

    const rawBest  = raw.trends?.summary?.bestPeriod;
    const rawWorst = raw.trends?.summary?.worstPeriod;

    const trendsSummary = raw.trends?.summary
      ? {
          bestPeriod:         rawBest  ? { ...rawBest,  period: this.normalizeTrendPeriod(rawBest.period)  } : null,
          worstPeriod:        rawWorst ? { ...rawWorst, period: this.normalizeTrendPeriod(rawWorst.period) } : null,
          averageDailyProfit: raw.trends.summary.averageDailyProfit ?? 0,
          trendDirection:     raw.trends.summary.trendDirection     ?? 'stable',
        }
      : null;

    return {
      ...raw,
      trends: {
        data:    normalizedTrends,
        summary: trendsSummary,
      },
      comparison: raw.comparison ?? null,
    } as ProfitAnalysisReport;
  }

  /**
   * FIX (Frontend #1):
   * The API returns period as an object:
   *   - day groupBy   → `{ date: '2026-02-14' }`
   *   - week groupBy  → `{ year: 2026, week: 7 }`
   *   - month groupBy → `{ year: 2026, month: 2 }`
   *
   * Angular's `date` pipe needs a Date / ISO string, not a plain object.
   * This method converts all three shapes to a plain ISO date string.
   */
  private normalizeTrendPeriod(period: any): string {
    if (!period) return '';
    if (typeof period === 'string') return period;

    // Day grouping
    if (period.date) return period.date;

    // Month grouping
    if (period.year && period.month) {
      const m = String(period.month).padStart(2, '0');
      return `${period.year}-${m}-01`;
    }

    // Week grouping — approximate: use Monday of ISO week
    if (period.year && period.week != null) {
      return this.isoWeekToDate(period.year, period.week);
    }

    // Quarter
    if (period.year && period.quarter) {
      const m = String((period.quarter - 1) * 3 + 1).padStart(2, '0');
      return `${period.year}-${m}-01`;
    }

    return String(period.year ?? '');
  }

  /** Convert ISO year + week number to the Monday date of that week */
  private isoWeekToDate(year: number, week: number): string {
    const jan4  = new Date(year, 0, 4);                          // 4 Jan is always in W1
    const day   = jan4.getDay() || 7;                            // Mon=1 … Sun=7
    const w1Mon = new Date(jan4.getTime() - (day - 1) * 86400000); // Monday of W1
    const target = new Date(w1Mon.getTime() + (week - 1) * 7 * 86400000);
    return target.toISOString().split('T')[0];
  }

  // ── Computed helpers ─────────────────────────────────────────────────────

  groupByLabel(): string {
    switch (this.currentFilters.groupBy) {
      case 'month': return 'Monthly';
      case 'week':  return 'Weekly';
      default:      return 'Daily';
    }
  }

  /**
   * FIX (Frontend #5):
   * Returns the maximum revenue across all trend data points.
   * Used as the scale ceiling so bars fill the full chart height.
   * Memoised per render via the passed array reference.
   */
  maxTrendRevenue(points: TrendPoint[]): number {
    if (!points?.length) return 1;
    return Math.max(...points.map(p => p.revenue), 1);
  }

  getBarHeight(val: number, max: number): number {
    if (!max || max === 0) return 0;
    return Math.max(2, Math.min((val / max) * 90, 90)); // cap at 90% for aesthetic padding
  }

  getGrowthClass(value: number): string {
    return value >= 0 ? 'bg-success' : 'bg-error';
  }

  getMarginClass(margin: number): string {
    if (margin >= 25) return 'margin-high';
    if (margin >= 15) return 'margin-medium';
    return 'margin-low';
  }

  getCompareLabel(): string {
    switch (this.currentFilters.compareWith) {
      case 'previous_period':      return 'prev. period';
      case 'same_period_last_year': return 'last year';
      default:                     return 'baseline';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


// import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { finalize, Subject } from 'rxjs';

// // PrimeNG Imports
// import { TableModule } from 'primeng/table';
// import { TooltipModule } from 'primeng/tooltip';
// import { TabsModule } from 'primeng/tabs';
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';

// // Custom Services & Components
// import { InvoiceService } from '../../services/invoice-service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { FilterField } from '../../../shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../../shared/components/universal-filter/universal-filter';
// import { takeUntil } from "rxjs/operators";

// // --- Interfaces (Same as provided) ---
// export interface FinancialSummary {
//   totalRevenue: number;
//   grossProfit: number;
//   profitMargin: number;
//   markup: number;
// }

// export interface GrowthMetrics {
//   revenueGrowth: number;
//   profitGrowth: number;
// }

// export interface TrendPoint {
//   period: string;
//   revenue: number;
//   profit: number;
//   margin: number;
// }

// export interface TopProduct {
//   productName: string;
//   sku: string;
//   totalQuantity: number;
//   totalRevenue: number;
//   netProfit: number;
//   profitMargin: number;
// }

// export interface ProfitAnalysisReport {
//   summary: {
//     financials: FinancialSummary;
//     metrics: {
//       averageRevenuePerInvoice: number;
//       totalInvoices: number;
//     };
//   };
//   comparison: {
//     growth: GrowthMetrics;
//   };
//   trends: {
//     data: TrendPoint[];
//     summary: {
//       bestDay: { period: string; profit: number };
//     };
//   };
//   analysis: {
//     productAnalysis: {
//       topPerforming: TopProduct[];
//     };
//   };
// }

// @Component({
//   selector: 'app-advanced-profit-analysis',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     TableModule,
//     TabsModule,
//     ButtonModule,
//     TooltipModule,
//     ProgressSpinnerModule,
//     UniversalFilterComponent // <--- Replaced DateFilter & Drawer
//   ],
//   template: `
//     <div class="report-container">

//       <div class="report-header">
//         <div>
//           <h1 class="page-title">Advanced Profit Report</h1>
//           <p class="page-subtitle">Real-time financial breakdown & trend analysis</p>
//         </div>
//         <div class="header-actions">
//            <button pButton icon="pi pi-refresh" class="p-button-rounded p-button-text p-button-secondary" 
//                    (click)="fetchReport()" [loading]="loading()"></button>
//         </div>
//       </div>

//       <div class="filter-wrapper">
//         <app-universal-filter
//           [entityType]="'profit-analysis'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       @if (loading()) {
//         <div class="loader-state">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p>Crunching the numbers...</p>
//         </div>
//       } 
      
//       @else if (data(); as r) {
        
//         <div class="metrics-grid">
          
//           <div class="metric-card revenue-card">
//             <div class="card-line primary"></div>
//             <div class="card-content">
//               <div class="card-top">
//                 <span class="card-label">Total Revenue</span>
//                 <span class="trend-badge" [ngClass]="getGrowthClass(r.comparison.growth.revenueGrowth)">
//                   {{ r.comparison.growth.revenueGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.revenueGrowth | number:'1.0-1' }}%
//                 </span>
//               </div>
//               <div class="metric-value">{{ commonService.formatCurrency(r.summary.financials.totalRevenue) }}</div>
//               <div class="metric-sub">vs {{ getCompareLabel() }}</div>
//             </div>
//           </div>

//           <div class="metric-card profit-card">
//             <div class="card-line success"></div>
//             <div class="card-content">
//               <div class="card-top">
//                 <span class="card-label">Gross Profit</span>
//                 <span class="trend-badge" [ngClass]="getGrowthClass(r.comparison.growth.profitGrowth)">
//                   {{ r.comparison.growth.profitGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.profitGrowth | number:'1.0-1' }}%
//                 </span>
//               </div>
//               <div class="metric-value text-success">{{ commonService.formatCurrency(r.summary.financials.grossProfit) }}</div>
//               <div class="metric-sub">Net Income after COGS</div>
//             </div>
//           </div>

//           <div class="metric-card margin-card">
//              <div class="card-content">
//                <div class="card-top">
//                  <span class="card-label">Profit Margin</span>
//                </div>
//                <div class="metric-value text-success">{{ r.summary.financials.profitMargin }}%</div>
//                <div class="markup-pill">Markup: {{ r.summary.financials.markup }}%</div>
//              </div>
//           </div>

//           <div class="metric-card aov-card">
//             <div class="card-line warning"></div>
//             <div class="card-content">
//               <div class="card-top">
//                 <span class="card-label">Avg. Order Value</span>
//               </div>
//               <div class="metric-value">{{ commonService.formatCurrency(r.summary.metrics.averageRevenuePerInvoice) }}</div>
//               <div class="metric-sub">Across {{ r.summary.metrics.totalInvoices }} Invoices</div>
//             </div>
//           </div>
//         </div>

//         <div class="trend-section">
          
//           <div class="trend-header">
//             <div>
//               <h3 class="section-title">Performance Trend</h3>
//               <p class="section-sub">Daily revenue vs net profit analysis</p>
//             </div>
            
//             <div class="trend-legend">
//               <div class="legend-items">
//                 <div class="legend-item"><span class="dot revenue"></span> Revenue</div>
//                 <div class="legend-item"><span class="dot profit"></span> Profit</div>
//               </div>
              
//               @if(r.trends.summary.bestDay) {
//                 <div class="best-day-pill">
//                   <span class="pulse-dot"></span>
//                   <span class="label">Best:</span>
//                   <span class="date">{{ r.trends.summary.bestDay.period | date:'dd MMM' }}</span>
//                   <span class="amount">({{ commonService.formatCurrency(r.trends.summary.bestDay.profit) }})</span>
//                 </div>
//               }
//             </div>
//           </div>
          
//           <div class="chart-container">
//             <div class="grid-lines">
//               <div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div><div class="line base"></div>
//             </div>

//             <div class="bars-wrapper">
//               @for (point of r.trends.data; track point.period) {
//                 <div class="bar-group group" [pTooltip]="tooltipContent" tooltipPosition="top">
                  
//                   <ng-template #tooltipContent>
//                      <div class="custom-tooltip">
//                         <div class="tooltip-header">
//                            <span>{{ point.period | date:'EEE, dd MMM' }}</span>
//                            <span class="margin-tag">{{ point.margin }}% Margin</span>
//                         </div>
//                         <div class="tooltip-row">
//                            <span>Rev</span>
//                            <span class="val">{{ commonService.formatCurrency(point.revenue) }}</span>
//                         </div>
//                         <div class="tooltip-row">
//                            <span class="text-success">Net</span>
//                            <span class="val text-success">{{ commonService.formatCurrency(point.profit) }}</span>
//                         </div>
//                      </div>
//                   </ng-template>

//                   <div class="hover-line"></div>

//                   <div class="bars-stack">
//                     <div class="bar revenue-bar" 
//                          [style.height.%]="getBarHeight(point.revenue, r.summary.financials.totalRevenue)">
//                     </div>
//                     <div class="bar profit-bar"
//                          [style.height.%]="getBarHeight(point.profit, r.summary.financials.totalRevenue)">
//                        <div class="bar-shine"></div>
//                     </div>
//                   </div>
                  
//                   <div class="x-label">
//                     {{ point.period | date:(currentFilters.groupBy === 'month' ? 'MMM' : 'dd MMM') }}
//                   </div>

//                 </div>
//               }
//             </div>
//           </div>
//         </div>

//         <div class="analysis-tabs-card">
//           <p-tabs [value]="'0'">
//             <p-tablist styleClass="custom-tabs">
//               <p-tab value="0"><span class="tab-txt">Top Products</span></p-tab>
//               <p-tab value="1"><span class="tab-txt">Top Customers</span></p-tab>
//               <p-tab value="2"><span class="tab-txt">Category Analysis</span></p-tab>
//             </p-tablist>
            
//             <p-tabpanels styleClass="custom-panels">
//               <p-tabpanel value="0">
//                 <p-table [value]="r.analysis.productAnalysis.topPerforming" [rows]="10" [paginator]="true" 
//                          styleClass="p-datatable-sm theme-table" responsiveLayout="scroll">
//                   <ng-template pTemplate="header">
//                     <tr>
//                       <th class="pl-4">Product</th>
//                       <th class="text-right">Qty</th>
//                       <th class="text-right">Revenue</th>
//                       <th class="text-right">Net Profit</th>
//                       <th class="text-right pr-4">Margin</th>
//                     </tr>
//                   </ng-template>
//                   <ng-template pTemplate="body" let-p>
//                     <tr class="table-row">
//                       <td class="pl-4">
//                         <div class="prod-name">{{ p.productName }}</div>
//                         <div class="prod-sku">{{ p.sku }}</div>
//                       </td>
//                       <td class="text-right font-mono">{{ p.totalQuantity }}</td>
//                       <td class="text-right font-mono font-semibold">{{ commonService.formatCurrency(p.totalRevenue) }}</td>
//                       <td class="text-right font-mono font-bold text-success">{{ commonService.formatCurrency(p.netProfit) }}</td>
//                       <td class="text-right pr-4">
//                         <span class="margin-badge">{{ p.profitMargin }}%</span>
//                       </td>
//                     </tr>
//                   </ng-template>
//                   <ng-template pTemplate="emptymessage">
//                     <tr><td colspan="5" class="empty-msg">No product data available for this period.</td></tr>
//                   </ng-template>
//                 </p-table>
//               </p-tabpanel>
              
//               <p-tabpanel value="1">
//                  <div class="empty-msg p-8">Customer analysis visualization coming soon...</div>
//               </p-tabpanel>
//               <p-tabpanel value="2">
//                  <div class="empty-msg p-8">Category breakdown visualization coming soon...</div>
//               </p-tabpanel>
//             </p-tabpanels>
//           </p-tabs>
//         </div>
//       }
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }

//     .report-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       min-height: 100vh;
//       font-family: var(--font-body);
//     }

//     /* HEADER */
//     .report-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-md);
//     }
//     .page-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin: 0; }
//     .page-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
    
//     .filter-wrapper { margin-bottom: var(--spacing-xl); }

//     /* METRICS GRID */
//     .metrics-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
//       gap: var(--spacing-md);
//       margin-bottom: var(--spacing-xl);
//     }

//     .metric-card {
//       position: relative;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       overflow: hidden;
//       transition: transform 0.2s, box-shadow 0.2s;
      
//       &:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
//     }

//     .card-line {
//       position: absolute; top: 0; left: 0; bottom: 0; width: 4px;
//       transition: width 0.2s;
//       .metric-card:hover & { width: 6px; }
      
//       &.primary { background: var(--color-primary); }
//       &.success { background: var(--color-success); }
//       &.warning { background: var(--color-warning); }
//     }

//     .card-content { padding-left: var(--spacing-sm); }

//     .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
    
//     .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }

//     .trend-badge {
//       font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
//       &.bg-success { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success); }
//       &.bg-error { background: var(--color-danger-bg); color: var(--color-danger-text); border: 1px solid var(--color-danger-text); }
//     }

//     .metric-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); font-family: var(--font-heading); }
//     .text-success { color: var(--color-success); }

//     .metric-sub { font-size: 10px; color: var(--text-tertiary); margin-top: 4px; }

//     .margin-card { background: var(--color-success-bg); border-color: var(--color-success); }
//     .markup-pill { font-size: 10px; background: var(--bg-surface); padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 6px; font-weight: 600; color: var(--color-success); }

//     /* TREND CHART SECTION */
//     .trend-section {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-xl);
//       margin-bottom: var(--spacing-xl);
//     }

//     .trend-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-2xl); }
//     .section-title { font-size: var(--font-size-md); font-weight: 700; color: var(--text-primary); margin: 0; }
//     .section-sub { font-size: 10px; color: var(--text-tertiary); margin: 0; }

//     .trend-legend { display: flex; gap: var(--spacing-lg); align-items: center; }
//     .legend-items { display: flex; gap: var(--spacing-md); }
//     .legend-item { font-size: 10px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
//     .dot { width: 8px; height: 8px; border-radius: 2px; }
//     .dot.revenue { background: var(--border-secondary); }
//     .dot.profit { background: linear-gradient(180deg, var(--color-success), var(--color-success-bg)); }

//     .best-day-pill {
//       display: flex; align-items: center; gap: 6px; padding: 4px 10px;
//       background: var(--bg-ternary); border: 1px solid var(--border-primary); border-radius: 99px;
//       font-size: 10px;
//     }
//     .pulse-dot { width: 6px; height: 6px; background: var(--color-success); border-radius: 50%; animation: pulse 1.5s infinite; }
//     .label { color: var(--text-tertiary); }
//     .date { font-weight: 700; color: var(--text-primary); }
//     .amount { font-weight: 700; font-family: var(--font-mono); color: var(--color-success); }

//     @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

//     /* CHART BARS */
//     .chart-container { position: relative; height: 260px; width: 100%; }
//     .grid-lines { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
//     .line { border-top: 1px dashed var(--border-secondary); width: 100%; height: 0; opacity: 0.5; }
//     .line.base { border-top-style: solid; opacity: 1; border-color: var(--border-primary); }

//     .bars-wrapper { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: space-between; padding-left: 4px; padding-bottom: 24px; gap: 2px; }
    
//     .bar-group { 
//       flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; cursor: pointer; 
//       &:hover .x-label { color: var(--text-primary); font-weight: 700; }
//       &:hover .hover-line { opacity: 1; }
//     }

//     .hover-line { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--color-primary); opacity: 0; transition: opacity 0.2s; pointer-events: none; border-left: 1px dashed var(--color-primary); }

//     .bars-stack {
//       width: 100%; max-width: 32px; position: relative; display: flex; align-items: flex-end; justify-content: center; height: 100%;
//       transition: transform 0.2s;
//       .bar-group:hover & { transform: scale(1.05); }
//     }

//     .bar { width: 100%; position: absolute; bottom: 0; border-radius: 4px 4px 0 0; transition: height 0.5s ease-out; }
//     .revenue-bar { background: var(--bg-ternary); border: 1px solid transparent; .bar-group:hover & { border-color: var(--border-secondary); } }
    
//     .profit-bar { 
//       width: 60%; background: linear-gradient(180deg, var(--color-success) 0%, var(--color-success-bg) 100%); 
//       box-shadow: var(--shadow-sm); z-index: 2; 
//     }
//     .bar-shine { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.4); }

//     .x-label { position: absolute; bottom: -30px; font-size: 9px; color: var(--text-tertiary); transform: rotate(-45deg); white-space: nowrap; transition: color 0.2s; }

//     /* TABLE SECTION */
//     .analysis-tabs-card {
//       background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); overflow: hidden;
//     }

//     /* Custom Table Styles matching Theme */
//     .theme-table ::ng-deep th { background: var(--bg-ternary) !important; color: var(--text-secondary) !important; font-size: 11px; text-transform: uppercase; font-weight: 700; padding: 12px; border-bottom: 1px solid var(--border-primary); }
//     .theme-table ::ng-deep td { border-bottom: 1px solid var(--border-secondary); padding: 12px; color: var(--text-primary); vertical-align: middle; }
//     .table-row:hover ::ng-deep td { background: var(--bg-ternary); }

//     .prod-name { font-weight: 700; font-size: 12px; color: var(--text-primary); }
//     .prod-sku { font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); }
//     .margin-badge { font-size: 10px; font-weight: 700; background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-border); padding: 2px 6px; border-radius: 4px; }
//     .empty-msg { text-align: center; color: var(--text-tertiary); font-size: 12px; padding: 20px; }

//     // /* Tab overrides for strict theming */
//     // :host ::ng-deep .custom-tabs { background: var(--bg-primary) !important; border-bottom: 1px solid var(--border-primary); }
//     // :host ::ng-deep .p-tab { color: var(--text-secondary) !important; padding: 1rem !important; }
//     // :host ::ng-deep .p-tab-active { color: var(--color-primary) !important; border-color: var(--color-primary) !important; font-weight: 700; }
//     // :host ::ng-deep .custom-panels { padding: 0 !important; background: var(--bg-secondary); }

//     .tab-txt { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

//     /* Tooltip */
//     .custom-tooltip { min-width: 140px; }
//     .tooltip-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #fff; }
//     .tooltip-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; color: #ccc; }
//     .tooltip-row .val { font-family: var(--font-mono); color: #fff; font-weight: 700; }
//     .text-success { color: var(--color-success) !important; }

//     /* Loader */
//     .loader-state { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; gap: 16px; }
//   `]
// })
// export class AdvancedProfitAnalysisComponent implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
//   public commonService = inject(CommonMethodService);
//   private invoiceService = inject(InvoiceService);

//   data = signal<ProfitAnalysisReport | null>(null);
//   loading = signal(false);

//   // Stored Filters
//   public currentFilters: any = {
//     groupBy: 'day',
//     compareWith: 'previous_period'
//   };

//   // 1. FILTER CONFIGURATION
//   filterConfig: FilterField[] = [
//     {
//       key: 'date',
//       label: 'Analysis Period',
//       type: 'date-range'
//     },
//     {
//       key: 'groupBy',
//       label: 'Group By',
//       type: 'select',
//       staticOptions: [
//         { label: 'Daily', value: 'day' },
//         { label: 'Weekly', value: 'week' },
//         { label: 'Monthly', value: 'month' }
//       ],
//       defaultValue: 'day'
//     },
//     {
//       key: 'compareWith',
//       label: 'Compare',
//       type: 'select',
//       staticOptions: [
//         { label: 'Previous Period', value: 'previous_period' },
//         { label: 'Last Year', value: 'same_period_last_year' },
//         { label: 'None', value: 'none' }
//       ],
//       defaultValue: 'previous_period'
//     },
//     {
//       key: 'status',
//       label: 'Invoice Status',
//       type: 'multiselect', // Supports multiple statuses
//       staticOptions: [
//         { label: 'Paid', value: 'paid' },
//         { label: 'Issued', value: 'issued' },
//         { label: 'Overdue', value: 'overdue' }
//       ],
//       placeholder: 'All Statuses'
//     }
//   ];

//   ngOnInit() {
//     // Initial fetch triggered by filter component init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.fetchReport();
//   }

//   fetchReport() {
//     this.loading.set(true);

//     const payload: any = { ...this.currentFilters };

//     // Handle Date Range Array -> Start/End fields
//     if (payload.date && Array.isArray(payload.date)) {
//       if (payload.date[0]) payload.startDate = new Date(payload.date[0]).toISOString();
//       if (payload.date[1]) payload.endDate = new Date(payload.date[1]).toISOString();
//       delete payload.date;
//     }

//     // Handle MultiSelect Array -> Comma Separated String
//     if (Array.isArray(payload.status) && payload.status.length > 0) {
//       payload.status = payload.status.join(',');
//     } else {
//       delete payload.status;
//     }

//     this.invoiceService.getAdvancedProfitAnalysis(payload)
//       .pipe(finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
//       .subscribe({
//         next: (res) => {
//           if (res.status === 'success') {
//             this.data.set(res.data as ProfitAnalysisReport);
//           }
//         },
//         error: (err) => console.error('Profit Report Error:', err)
//       });
//   }

//   // --- Helper Methods ---

//   getBarHeight(val: number, max: number): number {
//     if (!max || max === 0) return 0;
//     const percentage = (val / max) * 100;
//     return Math.max(2, Math.min(percentage, 100));
//   }

//   getGrowthClass(value: number): string {
//     return value > 0 ? 'bg-success' : 'bg-error';
//   }

//   getCompareLabel(): string {
//     if (this.currentFilters.compareWith === 'previous_period') return 'prev. period';
//     if (this.currentFilters.compareWith === 'same_period_last_year') return 'last year';
//     return 'baseline';
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }
