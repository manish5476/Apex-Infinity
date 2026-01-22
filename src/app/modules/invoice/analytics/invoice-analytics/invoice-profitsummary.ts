import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateFilterComponent } from '../date-filter/date-filter.component'; // Adjust path as needed
import { finalize } from 'rxjs';
import { InvoiceService } from '../../services/invoice-service';

// Define the interface based on your API Response
interface ProfitSummaryData {
  financials: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: string;
    markup: string;
  };
  metrics: {
    totalInvoices: number;
    uniqueProducts: number;
    averageRevenuePerInvoice: string;
    averageProfitPerInvoice: string;
    averageProductPrice: string;
  };
  period: {
    start: string;
    end: string;
  };
}

@Component({
  selector: 'app-profit-summary',
  standalone: true,
  imports: [CommonModule, DateFilterComponent],
  template: `
    <div class="analytics-container">
      
      <div class="header-section">
        <div>
          <h2 class="page-title">Profit Analytics</h2>
          <p class="page-subtitle">Financial performance overview</p>
        </div>
        
        <app-date-filter 
          (dateChange)="onFilterChange($event)"
          [startDate]="filters.startDate"
          [endDate]="filters.endDate">
        </app-date-filter>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Analyzing financial data...</p>
        </div>
      } 
      
      @else if (data(); as summary) {
        <div class="kpi-grid">
          
          <div class="kpi-card revenue-card">
            <div class="card-header">
              <span class="label">Total Revenue</span>
              <span class="icon-circle">R</span>
            </div>
            <div class="card-value">
              {{ summary.financials.totalRevenue | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="card-footer">
              Gross Income
            </div>
          </div>

          <div class="kpi-card cost-card">
            <div class="card-header">
              <span class="label">Total Cost</span>
              <span class="icon-circle">C</span>
            </div>
            <div class="card-value">
              {{ summary.financials.totalCost | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="card-footer">
              Total Expenses
            </div>
          </div>

          <div class="kpi-card profit-card">
            <div class="card-header">
              <span class="label">Net Profit</span>
              <span class="icon-circle">P</span>
            </div>
            <div class="card-value">
              {{ summary.financials.totalProfit | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="card-footer">
              <span class="badge success">
                {{ summary.financials.profitMargin }}% Margin
              </span>
              <span class="sub-text">Markup: {{ summary.financials.markup }}%</span>
            </div>
          </div>
        </div>

        <h3 class="section-heading">Operational Metrics</h3>
        <div class="metrics-grid">
          
          <div class="metric-item">
            <span class="metric-label">Total Invoices</span>
            <span class="metric-value">{{ summary.metrics.totalInvoices }}</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">Avg. Rev / Invoice</span>
            <span class="metric-value">{{ summary.metrics.averageRevenuePerInvoice | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">Avg. Profit / Invoice</span>
            <span class="metric-value">{{ summary.metrics.averageProfitPerInvoice | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">Products Sold</span>
            <span class="metric-value">{{ summary.metrics.uniqueProducts }}</span>
          </div>
          
           <div class="metric-item">
            <span class="metric-label">Avg. Product Price</span>
            <span class="metric-value">{{ summary.metrics.averageProductPrice | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>

        </div>
      } 
      
      @else {
        <div class="empty-state">
           <p>No financial data found for this period.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      /* Local Palette derived from intent, avoids hardcoded hexes in main logic */
      --color-revenue-bg: #eff6ff;
      --color-revenue-text: #1d4ed8;
      --color-cost-bg: #fef2f2;
      --color-cost-text: #b91c1c;
      --color-profit-bg: #f0fdf4;
      --color-profit-text: #15803d;
      --bg-surface: #ffffff;
    }

    .analytics-container {
      max-width: 100%;
      padding: var(--spacing-md);
    }

    /* --- Header --- */
    .header-section {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
      gap: var(--spacing-lg);
    }

    .page-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: #1e293b; /* Slate-800 */
      margin: 0;
      line-height: var(--line-height-tight);
    }

    .page-subtitle {
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: #64748b; /* Slate-500 */
      margin: var(--spacing-xs) 0 0 0;
    }

    /* --- KPI Grid (Financials) --- */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-3xl);
    }

    .kpi-card {
      background: var(--bg-surface);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-md);
      transition: var(--transition-transform), var(--transition-base);
      border: var(--ui-border-width) solid transparent;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      position: relative;
      overflow: hidden;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-xl);
    }

    /* Revenue Styling */
    .revenue-card {
      border-color: rgba(59, 130, 246, 0.1);
    }
    .revenue-card .icon-circle {
      background: var(--color-revenue-bg);
      color: var(--color-revenue-text);
    }

    /* Cost Styling */
    .cost-card {
      border-color: rgba(239, 68, 68, 0.1);
    }
    .cost-card .icon-circle {
      background: var(--color-cost-bg);
      color: var(--color-cost-text);
    }

    /* Profit Styling (Prominent) */
    .profit-card {
      background: linear-gradient(135deg, #ffffff 0%, var(--color-profit-bg) 100%);
      border-color: rgba(34, 197, 94, 0.2);
      box-shadow: var(--shadow-lg);
    }
    .profit-card .icon-circle {
      background: #ffffff;
      color: var(--color-profit-text);
      box-shadow: var(--shadow-sm);
    }
    .profit-card .card-value {
      color: var(--color-profit-text);
    }

    /* KPI Inner Elements */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-heading);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xs);
    }

    .card-value {
      font-family: var(--font-heading);
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      color: #0f172a;
      line-height: 1;
    }

    .card-footer {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-size: var(--font-size-xs);
      color: #94a3b8;
    }

    .badge {
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius);
      font-weight: var(--font-weight-semibold);
    }
    .badge.success {
      background: #dcfce7;
      color: #166534;
    }

    /* --- Metrics Grid (Secondary) --- */
    .section-heading {
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: #334155;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid #e2e8f0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-lg);
    }

    .metric-item {
      background: var(--bg-surface);
      border: 1px solid #e2e8f0;
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      transition: var(--transition-fast);
    }
    
    .metric-item:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .metric-label {
      font-family: var(--font-body);
      font-size: var(--font-size-xs);
      color: #64748b;
      font-weight: var(--font-weight-medium);
    }

    .metric-value {
      font-family: var(--font-mono);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: #334155;
    }

    /* --- Utilities --- */
    .loading-state, .empty-state {
      text-align: center;
      padding: var(--spacing-5xl);
      color: #94a3b8;
      font-family: var(--font-body);
      background: #f8fafc;
      border-radius: var(--ui-border-radius-xl);
      border: 1px dashed #e2e8f0;
    }
    
    .spinner {
      border: 3px solid rgba(0,0,0,0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #3b82f6;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--spacing-md);
    }

    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        align-items: stretch;
      }
      .card-value {
        font-size: var(--font-size-3xl);
      }
    }
  `]
})
export class ProfitSummaryComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  
  // State Signals
  data = signal<ProfitSummaryData | null>(null);
  loading = signal(false);
  
  // Filters State
  filters = {
    startDate: '',
    endDate: '',
    branchId: '' // Add if you have branch logic
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    
    // Construct Query Params based on existing values
    const queryParams: any = {};
    if (this.filters.startDate) queryParams.startDate = this.filters.startDate;
    if (this.filters.endDate) queryParams.endDate = this.filters.endDate;
    if (this.filters.branchId) queryParams.branchId = this.filters.branchId;

    this.invoiceService.getProfitSummarys(queryParams)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.data.set(res.data);
          }
        },
        error: (err) => {
          console.error('Failed to load profit summary', err);
        }
      });
  }

  onFilterChange(event: { startDate: string, endDate: string }) {
    this.filters.startDate = event.startDate;
    this.filters.endDate = event.endDate;
    this.loadData();
  }
}