// analytics/invoice-analytics.component.ts
import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnalyticsCardComponent } from './analytics-card/analytics-card.component';
import { DateFilterComponent } from './date-filter/date-filter.component';
import { InvoiceService } from '../services/invoice-service';
import { AnalyticsChartComponent } from './analytics-chart/analytics-chart.component';


@Component({
  selector: 'app-invoice-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CurrencyPipe,
    DateFilterComponent,
    AnalyticsCardComponent,
    AnalyticsChartComponent
  ],
  template: `
    <div class="analytics-container">
      <!-- Header -->
      <header class="analytics-header">
        <div class="header-content">
          <h1 class="header-title">Invoice Analytics</h1>
          <p class="header-subtitle">Comprehensive insights into your sales performance and profitability</p>
        </div>
        
        <!-- Quick Actions -->
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportData()">
            <i class="icon-download"></i> Export Report
          </button>
          <div class="period-selector">
            <select [(ngModel)]="selectedPeriod" (change)="onPeriodChange()" class="period-select">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </header>

      <!-- Date Filter (for custom range) -->
      <!-- @if (showCustomDateFilter) { -->
        <app-date-filter
          [startDate]="filters().startDate"
          [endDate]="filters().endDate"
          (dateChange)="onDateFilterChange($event)">
        </app-date-filter>
      <!-- } -->

      <!-- Summary Metrics -->
      <section class="metrics-grid">
        @if (loading()) {
          <div class="metrics-loading">
            <div class="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        } @else {
          <!-- Revenue Metrics -->
          <app-analytics-card
            title="Total Revenue"
            [value]="summary()?.financials?.totalRevenue | currency:'INR':'symbol':'1.0-0'"
            [change]="comparison()?.growth?.revenueGrowth"
            icon="trending-up"
            color="primary">
          </app-analytics-card>

          <app-analytics-card
            title="Total Profit"
            [value]="summary()?.financials?.totalProfit | currency:'INR':'symbol':'1.0-0'"
            [change]="comparison()?.growth?.profitGrowth"
            icon="profit"
            color="success">
          </app-analytics-card>

          <app-analytics-card
            title="Profit Margin"
            [value]="summary()?.financials?.profitMargin + '%'"
            [change]="comparison()?.growth?.marginChange"
            icon="percentage"
            color="warning">
          </app-analytics-card>

          <app-analytics-card
            title="Total Invoices"
            [value]="summary()?.metrics?.totalInvoices"
            icon="file-text"
            color="info">
          </app-analytics-card>

          <!-- Cost Metrics -->
          <app-analytics-card
            title="Total Cost"
            [value]="summary()?.financials?.totalCost | currency:'INR':'symbol':'1.0-0'"
            icon="dollar-sign"
            color="danger">
          </app-analytics-card>

          <app-analytics-card
            title="Avg. Order Value"
            [value]="summary()?.metrics?.averageRevenuePerInvoice | currency:'INR':'symbol':'1.0-0'"
            icon="shopping-cart"
            color="purple">
          </app-analytics-card>
        }
      </section>

      <!-- Charts Section -->
      <section class="charts-section">
        <div class="chart-container">
          <h3 class="chart-title">Profit Trends</h3>
          <app-analytics-chart
            [data]="trends()"
            [chartType]="'line'"
            [metric]="'profit'">
          </app-analytics-chart>
        </div>

        <div class="chart-container">
          <h3 class="chart-title">Product Performance</h3>
          <app-analytics-chart
            [data]="productPerformance()"
            [chartType]="'bar'"
            [metric]="'profit'">
          </app-analytics-chart>
        </div>
      </section>

      <!-- Tabs for Detailed Analysis -->
      <section class="analysis-tabs">
        <nav class="tab-nav">
          <button 
            class="tab-button" 
            [class.active]="activeTab() === 'products'"
            (click)="setActiveTab('products')">
            Top Products
          </button>
          <button 
            class="tab-button" 
            [class.active]="activeTab() === 'customers'"
            (click)="setActiveTab('customers')">
            Top Customers
          </button>
          <button 
            class="tab-button" 
            [class.active]="activeTab() === 'categories'"
            (click)="setActiveTab('categories')">
            Categories
          </button>
          <button 
            class="tab-button" 
            [class.active]="activeTab() === 'details'"
            (click)="setActiveTab('details')">
            Detailed Report
          </button>
        </nav>

        <div class="tab-content">
          @switch (activeTab()) {
            @case ('products') {
              <div class="products-table">
                <h3>Top Performing Products</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Revenue</th>
                      <th>Cost</th>
                      <th>Profit</th>
                      <th>Margin</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (product of analysis()?.productAnalysis?.topPerforming; track product.productId) {
                      <tr>
                        <td>{{ product.productName }}</td>
                        <td>{{ product.sku }}</td>
                        <td>{{ product.totalQuantity }}</td>
                        <td>{{ product.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td>{{ product.totalCost | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td>{{ product.grossProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td>
                          <span class="margin-badge" [class.high]="product.profitMargin > 30" [class.medium]="product.profitMargin <= 30 && product.profitMargin > 15" [class.low]="product.profitMargin <= 15">
                            {{ product.profitMargin }}%
                          </span>
                        </td>
                        <td>
                          <button class="btn-icon" (click)="openProductPopup(product.productId)">
                            <i class="icon-eye"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            
            @case ('customers') {
              <div class="customers-table">
                <h3>Most Profitable Customers</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Invoices</th>
                      <th>Revenue</th>
                      <th>Profit</th>
                      <th>Margin</th>
                      <th>Avg. Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (customer of analysis()?.customerAnalysis?.mostProfitable; track customer._id) {
                      <tr>
                        <td>{{ customer.customerName }}</td>
                        <td>{{ customer.totalInvoices }}</td>
                        <td>{{ customer.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td>{{ customer.totalProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td>{{ customer.profitMargin }}%</td>
                        <td>{{ customer.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            
            @case ('categories') {
              <div class="categories-grid">
                @for (category of analysis()?.productAnalysis?.byCategory; track category._id) {
                  <div class="category-card">
                    <div class="category-header">
                      <h4>{{ category.category || 'Uncategorized' }}</h4>
                      <span class="category-margin">{{ category.profitMargin }}%</span>
                    </div>
                    <div class="category-stats">
                      <div class="stat">
                        <span class="stat-label">Revenue</span>
                        <span class="stat-value">{{ category.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">Profit</span>
                        <span class="stat-value">{{ category.totalProfit | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">Products</span>
                        <span class="stat-value">{{ category.uniqueProducts }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
            
            @case ('details') {
              <div class="detailed-report">
                <div class="report-section">
                  <h3>Financial Summary</h3>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <span class="summary-label">Total Revenue:</span>
                      <span class="summary-value">{{ summary()?.financials?.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Total Cost:</span>
                      <span class="summary-value">{{ summary()?.financials?.totalCost | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Gross Profit:</span>
                      <span class="summary-value">{{ summary()?.financials?.grossProfit | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Profit Margin:</span>
                      <span class="summary-value">{{ summary()?.financials?.profitMargin }}%</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Markup:</span>
                      <span class="summary-value">{{ summary()?.financials?.markup }}%</span>
                    </div>
                  </div>
                </div>
                
                <div class="report-section">
                  <h3>Performance Metrics</h3>
                  <div class="metrics-grid">
                    @for (metric of performanceMetrics(); track metric.label) {
                      <div class="metric-card">
                        <div class="metric-icon">
                          <i [class]="metric.icon"></i>
                        </div>
                        <div class="metric-content">
                          <span class="metric-label">{{ metric.label }}</span>
                          <span class="metric-value">{{ metric.value }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </section>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-overlay">
          <div class="loading-content">
            <div class="spinner-large"></div>
            <p>Loading advanced analytics...</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--spacing-xl);
      background: #f8fafc;
      min-height: 100vh;
    }

    .analytics-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header Styles */
    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-2xl);
      padding-bottom: var(--spacing-xl);
      border-bottom: 1px solid #e2e8f0;
    }

    .header-content {
      flex: 1;
    }

    .header-title {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      color: #1e293b;
      margin-bottom: var(--spacing-sm);
    }

    .header-subtitle {
      font-size: var(--font-size-base);
      color: #64748b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-lg);
      align-items: center;
    }

    .period-selector {
      position: relative;
    }

    .period-select {
      padding: var(--spacing-md) var(--spacing-xl);
      border: 1px solid #cbd5e1;
      border-radius: var(--ui-border-radius);
      background: white;
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: var(--transition-base);
    }

    .period-select:hover {
      border-color: #94a3b8;
      box-shadow: var(--shadow-sm);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-3xl);
    }

    .metrics-loading {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--spacing-3xl);
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--spacing-lg);
    }

    /* Charts Section */
    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-3xl);
    }

    .chart-container {
      background: white;
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-md);
    }

    .chart-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: #1e293b;
      margin-bottom: var(--spacing-xl);
    }

    /* Tabs */
    .analysis-tabs {
      background: white;
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }

    .tab-nav {
      display: flex;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
    }

    .tab-button {
      padding: var(--spacing-lg) var(--spacing-2xl);
      background: none;
      border: none;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      color: #64748b;
      cursor: pointer;
      transition: var(--transition-base);
      position: relative;
    }

    .tab-button:hover {
      color: #334155;
      background: rgba(255, 255, 255, 0.5);
    }

    .tab-button.active {
      color: #3b82f6;
      background: white;
    }

    .tab-button.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #3b82f6;
    }

    .tab-content {
      padding: var(--spacing-2xl);
    }

    /* Tables */
    .products-table,
    .customers-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    thead {
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }

    th {
      padding: var(--spacing-lg) var(--spacing-md);
      text-align: left;
      font-weight: var(--font-weight-semibold);
      color: #475569;
      white-space: nowrap;
    }

    td {
      padding: var(--spacing-lg) var(--spacing-md);
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    tr:hover {
      background: #f8fafc;
    }

    /* Margin Badges */
    .margin-badge {
      display: inline-block;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 20px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .margin-badge.high {
      background: #dcfce7;
      color: #166534;
    }

    .margin-badge.medium {
      background: #fef3c7;
      color: #92400e;
    }

    .margin-badge.low {
      background: #fee2e2;
      color: #991b1b;
    }

    /* Category Cards */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-lg);
    }

    .category-card {
      background: #f8fafc;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-xl);
      border: 1px solid #e2e8f0;
      transition: var(--transition-base);
    }

    .category-card:hover {
      border-color: #cbd5e1;
      box-shadow: var(--shadow-sm);
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .category-header h4 {
      margin: 0;
      font-size: var(--font-size-md);
      color: #1e293b;
    }

    .category-margin {
      padding: var(--spacing-xs) var(--spacing-sm);
      background: #dbeafe;
      color: #1e40af;
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .category-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-md);
    }

    .stat {
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: var(--font-size-xs);
      color: #64748b;
      margin-bottom: var(--spacing-xs);
    }

    .stat-value {
      display: block;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: #334155;
    }

    /* Detailed Report */
    .detailed-report {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }

    .report-section {
      background: #f8fafc;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-xl);
    }

    .report-section h3 {
      font-size: var(--font-size-lg);
      color: #1e293b;
      margin-bottom: var(--spacing-xl);
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: var(--spacing-md);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-lg);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
    }

    .summary-label {
      font-size: var(--font-size-sm);
      color: #64748b;
      margin-bottom: var(--spacing-xs);
    }

    .summary-value {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: #334155;
    }

    /* Metrics Cards */
    .metric-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      background: white;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-xl);
      border: 1px solid #e2e8f0;
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      background: #dbeafe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3b82f6;
    }

    .metric-content {
      flex: 1;
    }

    .metric-label {
      display: block;
      font-size: var(--font-size-sm);
      color: #64748b;
      margin-bottom: var(--spacing-xs);
    }

    .metric-value {
      display: block;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: #334155;
    }

    /* Buttons */
    .btn {
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-base);
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .btn-secondary {
      background: white;
      border-color: #cbd5e1;
      color: #334155;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      box-shadow: var(--shadow-sm);
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #cbd5e1;
      background: white;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-base);
    }

    .btn-icon:hover {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal);
    }

    .loading-content {
      text-align: center;
    }

    .spinner-large {
      width: 60px;
      height: 60px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--spacing-lg);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .analytics-header {
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .categories-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InvoiceAnalyticsComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private currency = inject(CurrencyPipe);

  // Signals
  loading = signal(false);
  selectedPeriod = signal('this_month');
  showCustomDateFilter = signal(false);
  activeTab = signal('products');

  filters = signal<any>({});
  summary = signal<any>(null);
  trends = signal<any[]>([]);
  analysis = signal<any>(null);
  comparison = signal<any>(null);
  performanceMetrics = signal<any[]>([]);

  // Computed values
  productPerformance = computed(() => {
    const products = this.analysis()?.productAnalysis?.topPerforming || [];
    return products.map((p: any) => ({
      name: p.productName,
      value: p.grossProfit
    }));
  });

  constructor() { }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    const filters = {
      // period: this.selectedPeriod(),
      // ...this.filters()
    };
    console.log("this----------------------------------------------");
    this.loading.set(true);
    this.invoiceService.getAdvancedProfitAnalysis(filters).subscribe({
      next: (response) => {
        console.log("this");
        if (response.status === 'success') {
          this.summary.set(response.data.summary);
          this.trends.set(response.data.trends?.data || []);
          this.analysis.set(response.data.analysis);
          this.comparison.set(response.data.comparison);
          this.updatePerformanceMetrics(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.loading.set(false);
      }
    });
  }

  updatePerformanceMetrics(data: any): void {
    const metrics = [
      {
        label: 'Conversion Rate',
        value: data.kpis?.conversionRate || 'N/A',
        icon: 'icon-target'
      },
      {
        label: 'Avg Customer Value',
        value: data.kpis?.averageCustomerValue ?
          this.currency.transform(data.kpis.averageCustomerValue, 'INR', 'symbol', '1.0-0') : 'N/A',
        icon: 'icon-users'
      },
      {
        label: 'Daily Revenue',
        value: data.kpis?.dailyRevenue ?
          this.currency.transform(data.kpis.dailyRevenue, 'INR', 'symbol', '1.0-0') : 'N/A',
        icon: 'icon-calendar'
      },
      {
        label: 'Items per Invoice',
        value: data.kpis?.itemsPerInvoice || '0',
        icon: 'icon-package'
      }
    ];
    this.performanceMetrics.set(metrics);
  }

  onPeriodChange(): void {
    if (this.selectedPeriod() === 'custom') {
      this.showCustomDateFilter.set(true);
    } else {
      this.showCustomDateFilter.set(false);
      this.filters.set({});
      this.loadAnalytics();
    }
  }

  onDateFilterChange(dateRange: any): void {
    this.filters.set({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    this.loadAnalytics();
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  exportData(): void {
    this.invoiceService.exportProfitData(this.filters(), 'csv').subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profit-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  openProductPopup(productId: string): void {
    // This would open a modal/dialog with product-specific analytics
    console.log('Open product popup for:', productId);
    // You would implement a modal service here
  }
}