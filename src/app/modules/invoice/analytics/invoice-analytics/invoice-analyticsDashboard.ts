import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { SelectModule } from 'primeng/select'; // v18+ <p-select appendTo="body">
// If using older PrimeNG, use DropdownModule and <p-select>
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// App Imports
import { DateFilterComponent } from '../date-filter/date-filter.component';
import { InvoiceService } from '../../services/invoice-service';
import { ProgressSpinner } from "primeng/progressspinner";

// --- Interfaces (Same as before) ---
interface DashboardData {
  period: { name: string; start: string; end: string; days: number };
  overview: {
    period: { revenue: number; cost: number; profit: number; margin: number; averageDailyProfit: number };
  };
  trends: {
    daily: Array<{ period: string; revenue: number; profit: number; margin: number }>;
    summary: { trend: string };
  };
  topPerformers: {
    products: Array<{ customerName: string; totalRevenue: number; profitMargin: number; totalProfit: number }>;
    customers: Array<{ customerName: string; totalRevenue: number; totalInvoices: number }>;
  };
  metrics: {
    efficiency: { revenuePerInvoice: number; profitPerInvoice: number };
    profitability: { markup: number; netMargin: number };
  };
  comparison: {
    growth: { revenue: number; profit: number; margin: number };
  };
}

@Component({
  selector: 'app-profit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    TooltipModule,
    DateFilterComponent,
    ProgressSpinner
  ],
  template: `
   <div class="dashboard-container">
  
  <div class="dashboard-header">
    <div class="header-content">
      <h1 class="page-title">Executive Profit Dashboard</h1>
      <p class="page-subtitle">
        <span class="status-dot" 
          [class.stable]="data()?.trends?.summary?.trend === 'stable'"
          [class.up]="data()?.trends?.summary?.trend === 'up'"
          [class.down]="data()?.trends?.summary?.trend === 'down'">
        </span>
        <span class="text-label">Market Trend: </span>
        <span class="trend-text">
          {{ (data()?.trends?.summary?.trend | titlecase) || 'Analyzing...' }}
        </span>
      </p>
    </div>

    <div class="controls-wrapper">
      
      <div class="control-group">
        <label class="control-label">Time Period</label>
        <p-select appendTo="body" 
          [options]="periodOptions" 
          [(ngModel)]="selectedPeriod" 
          optionLabel="label" 
          optionValue="value" 
          (onChange)="onPeriodChange()"
          styleClass="theme-select"
          appendTo="body">
        </p-select>
      </div>

      <div class="control-group">
        <label class="control-label">Compare With</label>
         <p-select appendTo="body" 
          [options]="compareOptions" 
          [(ngModel)]="selectedCompare" 
          optionLabel="label" 
          optionValue="value" 
          (onChange)="fetchDashboard()"
          styleClass="theme-select"
          [disabled]="selectedPeriod === 'custom'"
          appendTo="body">
        </p-select>
      </div>

      <button pButton icon="pi pi-refresh" class="refresh-btn" 
        (click)="fetchDashboard()" [disabled]="loading()" pTooltip="Refresh Data" tooltipPosition="bottom"></button>
    </div>
  </div>

  @if (selectedPeriod === 'custom') {
    <div class="custom-filter-panel">
      <app-date-filter 
        [startDate]="customDates.startDate"
        [endDate]="customDates.endDate"
        (dateChange)="onCustomDateChange($event)">
      </app-date-filter>
    </div>
  }

  @if (loading()) {
    <div class="loading-state">
      <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
      <p class="loading-text">Crunching financial data...</p>
    </div>
  } 
  
  @else if (data(); as dash) {
    
    <div class="hero-grid">
      
      <div class="stat-card">
        <div class="stat-head">
          <span class="stat-label">Total Revenue</span>
          <span class="trend-badge" 
            [class.positive]="dash.comparison.growth.revenue >= 0" 
            [class.negative]="dash.comparison.growth.revenue < 0">
            <i class="pi" [class.pi-arrow-up]="dash.comparison.growth.revenue >= 0" [class.pi-arrow-down]="dash.comparison.growth.revenue < 0"></i>
            {{ dash.comparison.growth.revenue | number:'1.0-1' }}%
          </span>
        </div>
        <div class="stat-value text-primary">
          {{ dash.overview.period.revenue | currency:'INR':'symbol':'1.0-0' }}
        </div>
        <div class="stat-footer">vs previous period</div>
      </div>

      <div class="stat-card">
         <div class="stat-head">
          <span class="stat-label">Total Cost</span>
        </div>
        <div class="stat-value text-tertiary">
          {{ dash.overview.period.cost | currency:'INR':'symbol':'1.0-0' }}
        </div>
         <div class="stat-footer">Expenses</div>
      </div>

      <div class="stat-card">
        <div class="stat-head">
          <span class="stat-label">Net Profit</span>
          <span class="trend-badge" 
            [class.positive]="dash.comparison.growth.profit >= 0" 
            [class.negative]="dash.comparison.growth.profit < 0">
            <i class="pi" [class.pi-arrow-up]="dash.comparison.growth.profit >= 0" [class.pi-arrow-down]="dash.comparison.growth.profit < 0"></i>
            {{ dash.comparison.growth.profit | number:'1.0-1' }}%
          </span>
        </div>
        <div class="stat-value text-success">
          {{ dash.overview.period.profit | currency:'INR':'symbol':'1.0-0' }}
        </div>
        <div class="stat-footer">Daily Avg: {{ dash.overview.period.averageDailyProfit | currency:'INR':'symbol':'1.0-0' }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-head">
          <span class="stat-label">Net Margin</span>
           <span class="trend-badge neutral">
            {{ dash.comparison.growth.margin > 0 ? '+' : ''}}{{ dash.comparison.growth.margin | number:'1.0-1' }}%
          </span>
        </div>
        <div class="stat-value text-accent">
          {{ dash.overview.period.margin }}%
        </div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="dash.overview.period.margin"></div>
        </div>
      </div>
    </div>

    <div class="mid-section-grid">
      
      <div class="content-card">
        <h3 class="section-title">Operational Efficiency</h3>
        <div class="metrics-list">
          <div class="metric-row">
            <span class="m-label">Revenue / Invoice</span>
            <span class="m-value">{{ dash.metrics.efficiency.revenuePerInvoice | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="metric-row">
            <span class="m-label">Profit / Invoice</span>
            <span class="m-value text-success fw-bold">{{ dash.metrics.efficiency.profitPerInvoice | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="metric-row">
            <span class="m-label">Avg Markup</span>
            <span class="m-value">{{ dash.metrics.profitability.markup }}%</span>
          </div>
        </div>
      </div>

      <div class="content-card chart-card">
        <h3 class="section-title">Daily Profit Trend</h3>
        <div class="simple-chart">
          @for (day of dash.trends.daily.slice(0, 10); track day.period) {
            <div class="chart-bar-group">
              <div class="bar-visual">
                <div class="bar-fill" [style.height.%]="getBarHeight(day.profit, dash.overview.period.profit)"></div>
              </div>
              <span class="bar-label">{{ day.period | date:'dd MMM' }}</span>
              
              <div class="bar-tooltip">
                <div class="tooltip-row"><span>Rev:</span> {{day.revenue | currency:'INR':'symbol':'1.0-0'}}</div>
                <div class="tooltip-row text-success"><span>Prof:</span> {{day.profit | currency:'INR':'symbol':'1.0-0'}}</div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <div class="tables-grid">
      
      <div class="content-card">
        <h3 class="section-title">Top Products by Profit</h3>
        <div class="table-container">
          <table class="theme-table">
            <thead>
              <tr>
                <th>Product</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              @for (prod of dash.topPerformers.products; track $index) {
                <tr>
                  <td>
                    <div class="table-main-text">{{ prod.customerName || 'N/A' }}</div>
                    <div class="table-sub-text">{{ prod.profitMargin }}% Margin</div>
                  </td>
                  <td class="text-right table-val">{{ prod.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                  <td class="text-right table-val text-success">{{ prod.totalProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                </tr>
              }
              @if (dash.topPerformers.products.length === 0) {
                <tr><td colspan="3" class="text-center empty-cell">No data available</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="content-card">
        <h3 class="section-title">Top Customers by Revenue</h3>
        <div class="table-container">
          <table class="theme-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th class="text-right">Inv</th>
                <th class="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              @for (cust of dash.topPerformers.customers; track $index) {
                <tr>
                  <td>
                    <div class="table-main-text">{{ cust.customerName }}</div>
                  </td>
                  <td class="text-right table-val">{{ cust.totalInvoices }}</td>
                  <td class="text-right table-val">{{ cust.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                </tr>
              }
              @if (dash.topPerformers.customers.length === 0) {
                <tr><td colspan="3" class="text-center empty-cell">No data available</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  }
</div>
  `,
  styles: [
    `:host {
  display: block;
  width: 100%;
}

.dashboard-container {
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--theme-bg-primary);
  font-family: var(--font-body);
  min-height: 100%;
}

/* --- Header --- */
.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--theme-border-primary);
}

@media(min-width: 1024px) {
  .dashboard-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  color: var(--theme-text-primary);
  font-weight: var(--font-weight-bold);
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--theme-text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
}

/* Status Dots */
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--theme-text-tertiary);
}
.status-dot.stable { background: var(--theme-info); box-shadow: 0 0 6px var(--theme-info); }
.status-dot.up { background: var(--theme-success); box-shadow: 0 0 6px var(--theme-success); }
.status-dot.down { background: var(--theme-error); box-shadow: 0 0 6px var(--theme-error); }

.text-label { font-weight: bold; color: var(--theme-text-secondary); }
.trend-text { font-weight: 500; color: var(--theme-text-primary); }

/* Controls */
.controls-wrapper {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-label {
  font-size: 10px;
  font-weight: bold;
  color: var(--theme-text-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Refresh Button - Circular */
.refresh-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-bg-secondary);
  border: 1px solid var(--theme-border-primary);
  color: var(--theme-text-secondary);
  transition: all 0.2s;
  
  &:hover {
    background: var(--theme-bg-ternary);
    color: var(--theme-text-primary);
    border-color: var(--theme-border-secondary);
  }
}

/* Custom Filter Panel */
.custom-filter-panel {
  background: var(--theme-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--radius-2xl);
  margin-bottom: var(--spacing-xl);
  border: 1px dashed var(--theme-border-secondary);
}

/* --- Hero Grid --- */
.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: var(--theme-bg-secondary);
  border: 1px solid var(--theme-border-primary);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--theme-border-secondary);
  }
}

.stat-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm); }

.stat-label { 
  font-size: var(--font-size-xs);
  font-weight: bold;
  text-transform: uppercase;
  color: var(--theme-text-label);
  letter-spacing: 0.05em;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-3xl);
  font-weight: bold;
  line-height: 1.1;
}
.text-primary { color: var(--theme-text-primary); }
.text-tertiary { color: var(--theme-text-tertiary); }
.text-success { color: var(--theme-success); }
.text-accent { color: var(--theme-accent-primary); }

.stat-footer {
  font-size: 11px;
  color: var(--theme-text-tertiary);
  margin-top: auto;
  padding-top: var(--spacing-sm);
  font-weight: 500;
}

/* Trend Badges */
.trend-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 99px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}
.trend-badge.positive { background: var(--color-success-bg); color: var(--theme-success); }
.trend-badge.negative { background: var(--color-error-bg); color: var(--theme-error); }
.trend-badge.neutral { background: var(--theme-bg-ternary); color: var(--theme-text-tertiary); }

/* Progress Bar */
.progress-track {
  height: 4px;
  background: var(--theme-bg-ternary);
  border-radius: 2px;
  margin-top: 12px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--theme-accent-primary);
  border-radius: 2px;
}

/* --- Mid Section --- */
.mid-section-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}
@media(min-width: 900px) { .mid-section-grid { grid-template-columns: 1fr 2fr; } }

.content-card {
  background: var(--theme-bg-secondary);
  border: 1px solid var(--theme-border-primary);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-lg);
  height: 100%;
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: bold;
  text-transform: uppercase;
  color: var(--theme-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--theme-border-primary);
}

/* Metrics List */
.metrics-list { display: flex; flex-direction: column; gap: 12px; }
.metric-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-sm); }
.m-label { color: var(--theme-text-secondary); }
.m-value { font-family: var(--font-mono); font-weight: bold; color: var(--theme-text-primary); }

/* Chart (CSS Only) */
.simple-chart { 
  display: flex; 
  align-items: flex-end; 
  justify-content: space-between; 
  height: 180px; 
  padding-top: 20px; 
  gap: 8px;
}
.chart-bar-group { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  height: 100%; 
  position: relative; 
  cursor: default; 
}
.bar-visual { 
  flex: 1; 
  width: 100%; 
  display: flex; 
  align-items: flex-end; 
  justify-content: center; 
  border-bottom: 1px solid var(--theme-border-primary); 
  padding-bottom: 2px;
}
.bar-fill { 
  width: 12px; 
  background: var(--theme-success); 
  border-radius: 2px 2px 0 0; 
  transition: height 0.4s ease; 
  min-height: 4px; 
  opacity: 0.7; 
}
.chart-bar-group:hover .bar-fill { opacity: 1; width: 14px; }
.bar-label { 
  font-size: 10px; 
  color: var(--theme-text-tertiary); 
  margin-top: 8px; 
  font-family: var(--font-mono);
}

/* Tooltip */
.bar-tooltip {
  position: absolute; 
  top: -50px; 
  left: 50%;
  transform: translateX(-50%) translateY(5px); 
  background: var(--theme-bg-ternary);
  border: 1px solid var(--theme-border-secondary);
  color: var(--theme-text-primary); 
  padding: 8px 12px; 
  border-radius: var(--ui-border-radius);
  font-size: 10px; 
  pointer-events: none; 
  opacity: 0; 
  transition: all 0.2s ease;
  z-index: 10; 
  box-shadow: var(--shadow-sm); 
  white-space: nowrap;
}
.chart-bar-group:hover .bar-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }
.tooltip-row { display: flex; justify-content: space-between; gap: 8px; }

/* --- Tables --- */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}
.table-container { overflow-x: auto; }

.theme-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.theme-table th { 
  text-align: left; 
  color: var(--theme-text-secondary); 
  font-weight: bold; 
  padding: 12px; 
  border-bottom: 1px solid var(--theme-border-primary); 
  background: var(--theme-bg-ternary); 
  font-size: 11px;
  text-transform: uppercase;
}
.theme-table td { 
  padding: 12px; 
  border-bottom: 1px solid var(--theme-border-primary); 
  color: var(--theme-text-primary); 
}
.theme-table tr:last-child td { border-bottom: none; }
.theme-table tr:hover td { background: var(--theme-bg-ternary); }

.table-main-text { font-weight: bold; }
.table-sub-text { font-size: 10px; color: var(--theme-text-tertiary); margin-top: 2px; }
.table-val { font-family: var(--font-mono); font-weight: 500; }
.empty-cell { color: var(--theme-text-tertiary); font-style: italic; padding: 24px; }

/* --- Loading --- */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: var(--theme-text-tertiary);
}
.loading-text { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 16px; letter-spacing: 1px; }
`
  ]
})
export class ProfitDashboardComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  // --- STATE ---
  data = signal<DashboardData | null>(null);
  loading = signal(false);

  // --- CONTROLS ---
  selectedPeriod: string = 'today';
  selectedCompare: string = 'previous_period';

  // Custom Date Range State
  customDates = { startDate: '', endDate: '' };

  // --- OPTIONS ---
  periodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'this_week' },
    { label: 'Last Week', value: 'last_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'This Quarter', value: 'this_quarter' },
    { label: 'Last Quarter', value: 'last_quarter' },
    { label: 'This Year', value: 'this_year' },
    { label: 'Last Year', value: 'last_year' },
    { label: 'Custom Range', value: 'custom' }
  ];

  compareOptions = [
    { label: 'Previous Period', value: 'previous_period' },
    { label: 'Previous Year', value: 'previous_year' }
  ];

  ngOnInit() {
    this.fetchDashboard();
  }

  onPeriodChange() {
    // If custom, don't fetch yet; wait for date selection
    if (this.selectedPeriod === 'custom') {
      this.data.set(null); // Clear data to prompt user interaction
      return;
    }
    this.fetchDashboard();
  }

  onCustomDateChange(event: { startDate: string, endDate: string }) {
    this.customDates = event;
    if (event.startDate && event.endDate) {
      this.fetchDashboard();
    }
  }

  fetchDashboard() {
    this.loading.set(true);

    const filters: any = {
      compareWith: this.selectedCompare
    };

    if (this.selectedPeriod === 'custom') {
      filters.startDate = this.customDates.startDate;
      filters.endDate = this.customDates.endDate;
      // We don't send 'period=custom' usually if start/end are present, 
      // but if your API expects period='custom', include it:
      filters.period = 'custom';
    } else {
      // standard period
    }

    // Call service with (period, filters)
    // If custom, first arg is 'custom' or undefined depending on API, assuming 'custom'
    const periodArg = this.selectedPeriod;

    this.invoiceService.getProfitDashboard(periodArg, filters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.data.set(res.data);
          }
        },
        error: (err) => console.error(err)
      });
  }

  // Visual helper for chart bars
  getBarHeight(value: number, reference: number): number {
    if (!reference) return 0;
    // Normalize against the total reference (or max value if you had it)
    // Using reference (total profit) might make daily bars small, 
    // ideally normalize against the MAX daily profit, but using total/10 is a safe heuristic for now
    const safeMax = reference / 2;
    const pct = (value / safeMax) * 100;
    return Math.max(5, Math.min(pct, 100));
  }
}