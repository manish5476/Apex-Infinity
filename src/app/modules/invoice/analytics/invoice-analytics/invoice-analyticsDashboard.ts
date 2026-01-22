import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { SelectModule } from 'primeng/select'; // v18+ <p-select>
// If using older PrimeNG, use DropdownModule and <p-dropdown>
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// App Imports
import { DateFilterComponent } from '../date-filter/date-filter.component';
import { InvoiceService } from '../../services/invoice-service';

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
    DateFilterComponent
  ],
  template: `
    <div class="dashboard-container">
      
      <div class="dashboard-header">
        
        <div class="header-content">
          <h1 class="page-title">Executive Profit Dashboard</h1>
          <p class="page-subtitle">
            <span class="status-indicator" 
              [class.stable]="data()?.trends?.summary?.trend === 'stable'"
              [class.up]="data()?.trends?.summary?.trend === 'up'"
              [class.down]="data()?.trends?.summary?.trend === 'down'">
            </span>
            <span>Market Trend: </span>
            <span class="fw-medium text-slate-700">
              {{ (data()?.trends?.summary?.trend | titlecase) || 'Analyzing...' }}
            </span>
          </p>
        </div>

        <div class="controls-wrapper">
          
          <div class="control-group">
            <label class="control-label">Time Period</label>
            <p-select 
              [options]="periodOptions" 
              [(ngModel)]="selectedPeriod" 
              optionLabel="label" 
              optionValue="value" 
              (onChange)="onPeriodChange()"
              [style]="{'width': '180px'}" 
              styleClass="compact-select"
              appendTo="body">
            </p-select>
          </div>

          <div class="control-group">
            <label class="control-label">Compare With</label>
             <p-select 
              [options]="compareOptions" 
              [(ngModel)]="selectedCompare" 
              optionLabel="label" 
              optionValue="value" 
              (onChange)="fetchDashboard()"
              [style]="{'width': '160px'}" 
              styleClass="compact-select"
              [disabled]="selectedPeriod === 'custom'"
              appendTo="body">
            </p-select>
          </div>

          <button pButton icon="pi pi-refresh" class="p-button-text p-button-secondary p-button-rounded" 
            (click)="fetchDashboard()" [disabled]="loading()"></button>
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
          <div class="spinner"></div>
          <p>Crunching financial data...</p>
        </div>
      } 
      
      @else if (data(); as dash) {
        
        <div class="hero-grid">
          
          <div class="stat-card revenue">
            <div class="stat-head">
              <span class="stat-label">Total Revenue</span>
              <span class="trend-badge" 
                [class.positive]="dash.comparison.growth.revenue >= 0" 
                [class.negative]="dash.comparison.growth.revenue < 0">
                <i class="pi" [class.pi-arrow-up]="dash.comparison.growth.revenue >= 0" [class.pi-arrow-down]="dash.comparison.growth.revenue < 0"></i>
                {{ dash.comparison.growth.revenue | number:'1.0-1' }}%
              </span>
            </div>
            <div class="stat-value">
              {{ dash.overview.period.revenue | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="stat-footer">
               vs previous period
            </div>
          </div>

          <div class="stat-card cost">
             <div class="stat-head">
              <span class="stat-label">Total Cost</span>
            </div>
            <div class="stat-value text-cost">
              {{ dash.overview.period.cost | currency:'INR':'symbol':'1.0-0' }}
            </div>
             <div class="stat-footer">
               Expenses
            </div>
          </div>

          <div class="stat-card profit">
            <div class="stat-head">
              <span class="stat-label">Net Profit</span>
              <span class="trend-badge" 
                [class.positive]="dash.comparison.growth.profit >= 0" 
                [class.negative]="dash.comparison.growth.profit < 0">
                <i class="pi" [class.pi-arrow-up]="dash.comparison.growth.profit >= 0" [class.pi-arrow-down]="dash.comparison.growth.profit < 0"></i>
                {{ dash.comparison.growth.profit | number:'1.0-1' }}%
              </span>
            </div>
            <div class="stat-value text-profit">
              {{ dash.overview.period.profit | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="stat-footer">
              Daily Avg: {{ dash.overview.period.averageDailyProfit | currency:'INR':'symbol':'1.0-0' }}
            </div>
          </div>

          <div class="stat-card margin">
            <div class="stat-head">
              <span class="stat-label">Net Margin</span>
               <span class="trend-badge neutral">
                {{ dash.comparison.growth.margin > 0 ? '+' : ''}}{{ dash.comparison.growth.margin | number:'1.0-1' }}%
              </span>
            </div>
            <div class="stat-value">
              {{ dash.overview.period.margin }}%
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" [style.width.%]="dash.overview.period.margin"></div>
            </div>
          </div>
        </div>

        <div class="mid-section-grid">
          <div class="content-card metrics-card">
            <h3 class="section-title">Operational Efficiency</h3>
            <div class="metrics-list">
              <div class="metric-row">
                <span class="m-label">Revenue / Invoice</span>
                <span class="m-value">{{ dash.metrics.efficiency.revenuePerInvoice | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="metric-row">
                <span class="m-label">Profit / Invoice</span>
                <span class="m-value text-profit fw-bold">{{ dash.metrics.efficiency.profitPerInvoice | currency:'INR':'symbol':'1.0-0' }}</span>
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
                  <span class="bar-tooltip">
                    <div class="tooltip-row"><span>Rev:</span> {{day.revenue | currency:'INR':'symbol':'1.0-0'}}</div>
                    <div class="tooltip-row text-profit"><span>Prof:</span> {{day.profit | currency:'INR':'symbol':'1.0-0'}}</div>
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="tables-grid">
          <div class="content-card">
            <h3 class="section-title">Top Products by Profit</h3>
            <div class="table-responsive">
              <table class="data-table">
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
                        <div class="fw-medium text-slate-800">{{ prod.customerName || 'N/A' }}</div>
                        <div class="sub-text">{{ prod.profitMargin }}% Margin</div>
                      </td>
                      <td class="text-right">{{ prod.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="text-right text-profit fw-medium">{{ prod.totalProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                  @if (dash.topPerformers.products.length === 0) {
                    <tr><td colspan="3" class="text-center text-sub">No data available</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="content-card">
            <h3 class="section-title">Top Customers by Revenue</h3>
            <div class="table-responsive">
              <table class="data-table">
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
                        <div class="fw-medium text-slate-800">{{ cust.customerName }}</div>
                      </td>
                      <td class="text-right">{{ cust.totalInvoices }}</td>
                      <td class="text-right">{{ cust.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                  @if (dash.topPerformers.customers.length === 0) {
                    <tr><td colspan="3" class="text-center text-sub">No data available</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --c-revenue: #0ea5e9;
      --c-cost: #ef4444;
      --c-profit: #22c55e;
      --c-text-sub: #64748b;
      --c-bg-card: #ffffff;
    }

    .dashboard-container {
      max-width: 100%;
      padding: var(--spacing-md);
    }

    /* --- Header & Controls --- */
    .dashboard-header {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid #e2e8f0;
    }

    @media(min-width: 1024px) {
      .dashboard-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .page-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-2xl);
      color: #0f172a;
      margin: 0;
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.5px;
    }

    .page-subtitle {
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--c-text-sub);
      margin-top: var(--spacing-xs);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .status-indicator {
      width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1;
    }
    .status-indicator.stable { background: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
    .status-indicator.up { background: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); }
    .status-indicator.down { background: #ef4444; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2); }

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
      font-size: 11px;
      font-weight: 600;
      color: var(--c-text-sub);
      text-transform: uppercase;
    }

    /* Custom Filter Panel */
    .custom-filter-panel {
      background: #f8fafc;
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius);
      margin-bottom: var(--spacing-xl);
      border: 1px dashed #cbd5e1;
      animation: fadeIn 0.3s ease;
    }

    /* --- Hero Grid --- */
    .hero-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
    }

    .stat-card {
      background: var(--c-bg-card);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid #e2e8f0;
      transition: transform 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

    .stat-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm); }
    .stat-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--c-text-sub); text-transform: uppercase; }
    
    .stat-value { font-family: var(--font-heading); font-size: var(--font-size-3xl); font-weight: 700; color: #0f172a; }
    .text-profit { color: var(--c-profit); }
    .text-cost { color: #475569; }

    .stat-footer { font-size: 11px; color: var(--c-text-sub); margin-top: var(--spacing-sm); }

    .trend-badge {
      font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;
      background: #f1f5f9; color: #64748b;
    }
    .trend-badge.positive { background: #dcfce7; color: #15803d; }
    .trend-badge.negative { background: #fee2e2; color: #b91c1c; }

    .progress-bar-bg { height: 4px; background: #f1f5f9; border-radius: 2px; margin-top: 12px; }
    .progress-bar-fill { height: 100%; background: #3b82f6; border-radius: 2px; }

    /* --- Mid Section --- */
    .mid-section-grid {
      display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-2xl);
    }
    @media(min-width: 900px) { .mid-section-grid { grid-template-columns: 320px 1fr; } }

    .content-card {
      background: var(--c-bg-card); border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border: 1px solid #e2e8f0;
    }

    .section-title {
      font-size: var(--font-size-base); font-weight: 600; color: #334155; margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-sm); border-bottom: 1px solid #f1f5f9;
    }

    .metrics-list { display: flex; flex-direction: column; gap: 12px; }
    .metric-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-sm); }
    .m-label { color: var(--c-text-sub); }
    .m-value { font-family: var(--font-mono); font-weight: 600; }

    /* Chart */
    .simple-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 160px; padding-top: 20px; }
    .chart-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; position: relative; cursor: default; }
    .bar-visual { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; border-bottom: 1px solid #e2e8f0; }
    .bar-fill { width: 14px; background: var(--c-profit); border-radius: 3px 3px 0 0; transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1); min-height: 4px; opacity: 0.8; }
    .chart-bar-group:hover .bar-fill { opacity: 1; transform: scaleX(1.1); }
    .bar-label { font-size: 10px; color: var(--c-text-sub); margin-top: 8px; }
    
    .bar-tooltip {
      position: absolute; top: -35px; background: #1e293b; color: #fff; padding: 6px 10px; border-radius: 6px;
      font-size: 10px; pointer-events: none; opacity: 0; transition: opacity 0.2s, transform 0.2s;
      transform: translateY(5px); z-index: 10; box-shadow: var(--shadow-lg); white-space: nowrap;
    }
    .chart-bar-group:hover .bar-tooltip { opacity: 1; transform: translateY(0); }
    .tooltip-row { display: flex; justify-content: space-between; gap: 8px; }

    /* --- Tables --- */
    .tables-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--spacing-lg); }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
    .data-table th { text-align: left; color: var(--c-text-sub); font-weight: 600; padding: 10px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
    .data-table td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .fw-medium { font-weight: 500; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .sub-text { font-size: 11px; color: var(--c-text-sub); }

    .loading-state { padding: 60px; text-align: center; color: var(--c-text-sub); }
    .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s infinite linear; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

    /* PrimeNG Overrides for Token Consistency */
    :host ::ng-deep {
      .compact-select .p-select-label { padding: 0.4rem 0.6rem; font-size: var(--font-size-sm); }
      .p-select { border-radius: var(--ui-border-radius); border-color: #cbd5e1; }
      .p-select:not(.p-disabled).p-focus { box-shadow: 0 0 0 2px var(--focus-ring-color); border-color: #3b82f6; }
    }
  `]
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