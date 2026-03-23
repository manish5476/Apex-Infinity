import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

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

// --- Interfaces (Same as provided) ---
export interface FinancialSummary {
  totalRevenue: number;
  grossProfit: number;
  profitMargin: number;
  markup: number;
}

export interface GrowthMetrics {
  revenueGrowth: number;
  profitGrowth: number;
}

export interface TrendPoint {
  period: string;
  revenue: number;
  profit: number;
  margin: number;
}

export interface TopProduct {
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
}

export interface ProfitAnalysisReport {
  summary: {
    financials: FinancialSummary;
    metrics: {
      averageRevenuePerInvoice: number;
      totalInvoices: number;
    };
  };
  comparison: {
    growth: GrowthMetrics;
  };
  trends: {
    data: TrendPoint[];
    summary: {
      bestDay: { period: string; profit: number };
    };
  };
  analysis: {
    productAnalysis: {
      topPerforming: TopProduct[];
    };
  };
}

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
    UniversalFilterComponent // <--- Replaced DateFilter & Drawer
  ],
  template: `
    <div class="report-container">

      <div class="report-header">
        <div>
          <h1 class="page-title">Advanced Profit Report</h1>
          <p class="page-subtitle">Real-time financial breakdown & trend analysis</p>
        </div>
        <div class="header-actions">
           <button pButton icon="pi pi-refresh" class="p-button-rounded p-button-text p-button-secondary" 
                   (click)="fetchReport()" [loading]="loading()"></button>
        </div>
      </div>

      <div class="filter-wrapper">
        <app-universal-filter
          [entityType]="'profit-analysis'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      @if (loading()) {
        <div class="loader-state">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p>Crunching the numbers...</p>
        </div>
      } 
      
      @else if (data(); as r) {
        
        <div class="metrics-grid">
          
          <div class="metric-card revenue-card">
            <div class="card-line primary"></div>
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Total Revenue</span>
                <span class="trend-badge" [ngClass]="getGrowthClass(r.comparison.growth.revenueGrowth)">
                  {{ r.comparison.growth.revenueGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.revenueGrowth | number:'1.0-1' }}%
                </span>
              </div>
              <div class="metric-value">{{ commonService.formatCurrency(r.summary.financials.totalRevenue) }}</div>
              <div class="metric-sub">vs {{ getCompareLabel() }}</div>
            </div>
          </div>

          <div class="metric-card profit-card">
            <div class="card-line success"></div>
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Gross Profit</span>
                <span class="trend-badge" [ngClass]="getGrowthClass(r.comparison.growth.profitGrowth)">
                  {{ r.comparison.growth.profitGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.profitGrowth | number:'1.0-1' }}%
                </span>
              </div>
              <div class="metric-value text-success">{{ commonService.formatCurrency(r.summary.financials.grossProfit) }}</div>
              <div class="metric-sub">Net Income after COGS</div>
            </div>
          </div>

          <div class="metric-card margin-card">
             <div class="card-content">
               <div class="card-top">
                 <span class="card-label">Profit Margin</span>
               </div>
               <div class="metric-value text-success">{{ r.summary.financials.profitMargin }}%</div>
               <div class="markup-pill">Markup: {{ r.summary.financials.markup }}%</div>
             </div>
          </div>

          <div class="metric-card aov-card">
            <div class="card-line warning"></div>
            <div class="card-content">
              <div class="card-top">
                <span class="card-label">Avg. Order Value</span>
              </div>
              <div class="metric-value">{{ commonService.formatCurrency(r.summary.metrics.averageRevenuePerInvoice) }}</div>
              <div class="metric-sub">Across {{ r.summary.metrics.totalInvoices }} Invoices</div>
            </div>
          </div>
        </div>

        <div class="trend-section">
          
          <div class="trend-header">
            <div>
              <h3 class="section-title">Performance Trend</h3>
              <p class="section-sub">Daily revenue vs net profit analysis</p>
            </div>
            
            <div class="trend-legend">
              <div class="legend-items">
                <div class="legend-item"><span class="dot revenue"></span> Revenue</div>
                <div class="legend-item"><span class="dot profit"></span> Profit</div>
              </div>
              
              @if(r.trends.summary.bestDay) {
                <div class="best-day-pill">
                  <span class="pulse-dot"></span>
                  <span class="label">Best:</span>
                  <span class="date">{{ r.trends.summary.bestDay.period | date:'dd MMM' }}</span>
                  <span class="amount">({{ commonService.formatCurrency(r.trends.summary.bestDay.profit) }})</span>
                </div>
              }
            </div>
          </div>
          
          <div class="chart-container">
            <div class="grid-lines">
              <div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div><div class="line base"></div>
            </div>

            <div class="bars-wrapper">
              @for (point of r.trends.data; track point.period) {
                <div class="bar-group group" [pTooltip]="tooltipContent" tooltipPosition="top">
                  
                  <ng-template #tooltipContent>
                     <div class="custom-tooltip">
                        <div class="tooltip-header">
                           <span>{{ point.period | date:'EEE, dd MMM' }}</span>
                           <span class="margin-tag">{{ point.margin }}% Margin</span>
                        </div>
                        <div class="tooltip-row">
                           <span>Rev</span>
                           <span class="val">{{ commonService.formatCurrency(point.revenue) }}</span>
                        </div>
                        <div class="tooltip-row">
                           <span class="text-success">Net</span>
                           <span class="val text-success">{{ commonService.formatCurrency(point.profit) }}</span>
                        </div>
                     </div>
                  </ng-template>

                  <div class="hover-line"></div>

                  <div class="bars-stack">
                    <div class="bar revenue-bar" 
                         [style.height.%]="getBarHeight(point.revenue, r.summary.financials.totalRevenue)">
                    </div>
                    <div class="bar profit-bar"
                         [style.height.%]="getBarHeight(point.profit, r.summary.financials.totalRevenue)">
                       <div class="bar-shine"></div>
                    </div>
                  </div>
                  
                  <div class="x-label">
                    {{ point.period | date:(currentFilters.groupBy === 'month' ? 'MMM' : 'dd MMM') }}
                  </div>

                </div>
              }
            </div>
          </div>
        </div>

        <div class="analysis-tabs-card">
          <p-tabs [value]="'0'">
            <p-tablist styleClass="custom-tabs">
              <p-tab value="0"><span class="tab-txt">Top Products</span></p-tab>
              <p-tab value="1"><span class="tab-txt">Top Customers</span></p-tab>
              <p-tab value="2"><span class="tab-txt">Category Analysis</span></p-tab>
            </p-tablist>
            
            <p-tabpanels styleClass="custom-panels">
              <p-tabpanel value="0">
                <p-table [value]="r.analysis.productAnalysis.topPerforming" [rows]="10" [paginator]="true" 
                         styleClass="p-datatable-sm theme-table" responsiveLayout="scroll">
                  <ng-template pTemplate="header">
                    <tr>
                      <th class="pl-4">Product</th>
                      <th class="text-right">Qty</th>
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
                      <td class="text-right font-mono font-semibold">{{ commonService.formatCurrency(p.totalRevenue) }}</td>
                      <td class="text-right font-mono font-bold text-success">{{ commonService.formatCurrency(p.netProfit) }}</td>
                      <td class="text-right pr-4">
                        <span class="margin-badge">{{ p.profitMargin }}%</span>
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="emptymessage">
                    <tr><td colspan="5" class="empty-msg">No product data available for this period.</td></tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>
              
              <p-tabpanel value="1">
                 <div class="empty-msg p-8">Customer analysis visualization coming soon...</div>
              </p-tabpanel>
              <p-tabpanel value="2">
                 <div class="empty-msg p-8">Category breakdown visualization coming soon...</div>
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

    /* HEADER */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }
    .page-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
    
    .filter-wrapper { margin-bottom: var(--spacing-xl); }

    /* METRICS GRID */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
      &.success { background: var(--color-success); }
      &.warning { background: var(--color-warning); }
    }

    .card-content { padding-left: var(--spacing-sm); }

    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
    
    .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }

    .trend-badge {
      font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
      &.bg-success { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success); }
      &.bg-error { background: var(--color-danger-bg); color: var(--color-danger-text); border: 1px solid var(--color-danger-text); }
    }

    .metric-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); font-family: var(--font-heading); }
    .text-success { color: var(--color-success); }

    .metric-sub { font-size: 10px; color: var(--text-tertiary); margin-top: 4px; }

    .margin-card { background: var(--color-success-bg); border-color: var(--color-success); }
    .markup-pill { font-size: 10px; background: var(--bg-surface); padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 6px; font-weight: 600; color: var(--color-success); }

    /* TREND CHART SECTION */
    .trend-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    .trend-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-2xl); }
    .section-title { font-size: var(--font-size-md); font-weight: 700; color: var(--text-primary); margin: 0; }
    .section-sub { font-size: 10px; color: var(--text-tertiary); margin: 0; }

    .trend-legend { display: flex; gap: var(--spacing-lg); align-items: center; }
    .legend-items { display: flex; gap: var(--spacing-md); }
    .legend-item { font-size: 10px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
    .dot { width: 8px; height: 8px; border-radius: 2px; }
    .dot.revenue { background: var(--border-secondary); }
    .dot.profit { background: linear-gradient(180deg, var(--color-success), var(--color-success-bg)); }

    .best-day-pill {
      display: flex; align-items: center; gap: 6px; padding: 4px 10px;
      background: var(--bg-ternary); border: 1px solid var(--border-primary); border-radius: 99px;
      font-size: 10px;
    }
    .pulse-dot { width: 6px; height: 6px; background: var(--color-success); border-radius: 50%; animation: pulse 1.5s infinite; }
    .label { color: var(--text-tertiary); }
    .date { font-weight: 700; color: var(--text-primary); }
    .amount { font-weight: 700; font-family: var(--font-mono); color: var(--color-success); }

    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

    /* CHART BARS */
    .chart-container { position: relative; height: 260px; width: 100%; }
    .grid-lines { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
    .line { border-top: 1px dashed var(--border-secondary); width: 100%; height: 0; opacity: 0.5; }
    .line.base { border-top-style: solid; opacity: 1; border-color: var(--border-primary); }

    .bars-wrapper { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: space-between; padding-left: 4px; padding-bottom: 24px; gap: 2px; }
    
    .bar-group { 
      flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; cursor: pointer; 
      &:hover .x-label { color: var(--text-primary); font-weight: 700; }
      &:hover .hover-line { opacity: 1; }
    }

    .hover-line { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--color-primary); opacity: 0; transition: opacity 0.2s; pointer-events: none; border-left: 1px dashed var(--color-primary); }

    .bars-stack {
      width: 100%; max-width: 32px; position: relative; display: flex; align-items: flex-end; justify-content: center; height: 100%;
      transition: transform 0.2s;
      .bar-group:hover & { transform: scale(1.05); }
    }

    .bar { width: 100%; position: absolute; bottom: 0; border-radius: 4px 4px 0 0; transition: height 0.5s ease-out; }
    .revenue-bar { background: var(--bg-ternary); border: 1px solid transparent; .bar-group:hover & { border-color: var(--border-secondary); } }
    
    .profit-bar { 
      width: 60%; background: linear-gradient(180deg, var(--color-success) 0%, var(--color-success-bg) 100%); 
      box-shadow: var(--shadow-sm); z-index: 2; 
    }
    .bar-shine { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.4); }

    .x-label { position: absolute; bottom: -30px; font-size: 9px; color: var(--text-tertiary); transform: rotate(-45deg); white-space: nowrap; transition: color 0.2s; }

    /* TABLE SECTION */
    .analysis-tabs-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); overflow: hidden;
    }

    /* Custom Table Styles matching Theme */
    .theme-table ::ng-deep th { background: var(--bg-ternary) !important; color: var(--text-secondary) !important; font-size: 11px; text-transform: uppercase; font-weight: 700; padding: 12px; border-bottom: 1px solid var(--border-primary); }
    .theme-table ::ng-deep td { border-bottom: 1px solid var(--border-secondary); padding: 12px; color: var(--text-primary); vertical-align: middle; }
    .table-row:hover ::ng-deep td { background: var(--bg-ternary); }

    .prod-name { font-weight: 700; font-size: 12px; color: var(--text-primary); }
    .prod-sku { font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); }
    .margin-badge { font-size: 10px; font-weight: 700; background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-border); padding: 2px 6px; border-radius: 4px; }
    .empty-msg { text-align: center; color: var(--text-tertiary); font-size: 12px; padding: 20px; }

    // /* Tab overrides for strict theming */
    // :host ::ng-deep .custom-tabs { background: var(--bg-primary) !important; border-bottom: 1px solid var(--border-primary); }
    // :host ::ng-deep .p-tab { color: var(--text-secondary) !important; padding: 1rem !important; }
    // :host ::ng-deep .p-tab-active { color: var(--color-primary) !important; border-color: var(--color-primary) !important; font-weight: 700; }
    // :host ::ng-deep .custom-panels { padding: 0 !important; background: var(--bg-secondary); }

    .tab-txt { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Tooltip */
    .custom-tooltip { min-width: 140px; }
    .tooltip-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #fff; }
    .tooltip-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; color: #ccc; }
    .tooltip-row .val { font-family: var(--font-mono); color: #fff; font-weight: 700; }
    .text-success { color: var(--color-success) !important; }

    /* Loader */
    .loader-state { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; gap: 16px; }
  `]
})
export class AdvancedProfitAnalysisComponent implements OnInit {
  public commonService = inject(CommonMethodService);
  private invoiceService = inject(InvoiceService);

  data = signal<ProfitAnalysisReport | null>(null);
  loading = signal(false);

  // Stored Filters
  public currentFilters: any = {
    groupBy: 'day',
    compareWith: 'previous_period'
  };

  // 1. FILTER CONFIGURATION
  filterConfig: FilterField[] = [
    {
      key: 'date',
      label: 'Analysis Period',
      type: 'date-range'
    },
    {
      key: 'groupBy',
      label: 'Group By',
      type: 'select',
      staticOptions: [
        { label: 'Daily', value: 'day' },
        { label: 'Weekly', value: 'week' },
        { label: 'Monthly', value: 'month' }
      ],
      defaultValue: 'day'
    },
    {
      key: 'compareWith',
      label: 'Compare',
      type: 'select',
      staticOptions: [
        { label: 'Previous Period', value: 'previous_period' },
        { label: 'Last Year', value: 'same_period_last_year' },
        { label: 'None', value: 'none' }
      ],
      defaultValue: 'previous_period'
    },
    {
      key: 'status',
      label: 'Invoice Status',
      type: 'multiselect', // Supports multiple statuses
      staticOptions: [
        { label: 'Paid', value: 'paid' },
        { label: 'Issued', value: 'issued' },
        { label: 'Overdue', value: 'overdue' }
      ],
      placeholder: 'All Statuses'
    }
  ];

  ngOnInit() {
    // Initial fetch triggered by filter component init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.fetchReport();
  }

  fetchReport() {
    this.loading.set(true);

    const payload: any = { ...this.currentFilters };

    // Handle Date Range Array -> Start/End fields
    if (payload.date && Array.isArray(payload.date)) {
        if (payload.date[0]) payload.startDate = new Date(payload.date[0]).toISOString();
        if (payload.date[1]) payload.endDate = new Date(payload.date[1]).toISOString();
        delete payload.date;
    }

    // Handle MultiSelect Array -> Comma Separated String
    if (Array.isArray(payload.status) && payload.status.length > 0) {
      payload.status = payload.status.join(',');
    } else {
      delete payload.status;
    }

    this.invoiceService.getAdvancedProfitAnalysis(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.data.set(res.data as ProfitAnalysisReport);
          }
        },
        error: (err) => console.error('Profit Report Error:', err)
      });
  }

  // --- Helper Methods ---

  getBarHeight(val: number, max: number): number {
    if (!max || max === 0) return 0;
    const percentage = (val / max) * 100;
    return Math.max(2, Math.min(percentage, 100));
  }

  getGrowthClass(value: number): string {
    return value > 0 ? 'bg-success' : 'bg-error';
  }

  getCompareLabel(): string {
    if (this.currentFilters.compareWith === 'previous_period') return 'prev. period';
    if (this.currentFilters.compareWith === 'same_period_last_year') return 'last year';
    return 'baseline';
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { finalize } from 'rxjs';

// // PrimeNG Imports
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { TableModule } from 'primeng/table';
// import { DrawerModule } from 'primeng/drawer';
// import { AccordionModule } from 'primeng/accordion';
// import { TooltipModule } from 'primeng/tooltip';
// import { TabsModule } from 'primeng/tabs';

// // Custom Services & Components
// import { DateFilterComponent } from '../date-filter/date-filter.component';
// import { InvoiceService } from '../../services/invoice-service';

// // --- Interfaces ---
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
//     SelectModule,
//     MultiSelectModule,
//     InputNumberModule,
//     InputTextModule,
//     ButtonModule,
//     TableModule,
//     TabsModule,
//     DrawerModule,
//     AccordionModule,
//     TooltipModule,
//     DateFilterComponent
//   ],
//   template: `
//     <div class="min-h-screen w-full bg-surface-ternary p-4 md:p-6 transition-colors duration-300 font-sans">

//       <div class="glass-surface mb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl">
//         <div class="flex flex-col gap-1">
//           <h1 class="font-heading text-xl font-bold text-primary m-0 leading-tight">
//             Advanced Profit Report
//           </h1>
//           @if(filterCount() > 0) {
//             <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-info text-info border border-info w-fit uppercase tracking-wider">
//               {{ filterCount() }} Active Filters
//             </span>
//           }
//         </div>
        
//         <div class="flex flex-wrap items-end gap-2 w-full md:w-auto">
//           <div class="flex flex-col gap-1">
//             <label class="text-[10px] uppercase tracking-wider font-bold text-secondary">Group By</label>
//             <p-select appendTo="body" [options]="groupByOptions" [(ngModel)]="filters.groupBy" (onChange)="fetchReport()" 
//               optionLabel="label" optionValue="value" styleClass="w-[110px] !bg-secondary !border-primary !text-xs !h-9 flex items-center">
//             </p-select>
//           </div>

//           <div class="flex flex-col gap-1">
//             <label class="text-[10px] uppercase tracking-wider font-bold text-secondary">Comparison</label>
//             <p-select appendTo="body" [options]="compareOptions" [(ngModel)]="filters.compareWith" (onChange)="fetchReport()" 
//               optionLabel="label" optionValue="value" styleClass="w-[130px] !bg-secondary !border-primary !text-xs !h-9 flex items-center">
//             </p-select>
//           </div>

//           <button pButton icon="pi pi-filter" (click)="showFilters.set(true)" 
//             class="!bg-transparent !text-secondary !border-secondary hover:!text-primary hover:!border-primary hover:!bg-[var(--accent-focus)] !p-2 !w-9 !h-9 rounded transition-colors mb-[1px]" pTooltip="More Filters" tooltipPosition="bottom"></button>
          
//           <button pButton icon="pi pi-refresh" (click)="fetchReport()" [loading]="loading()"
//             class="!text-secondary hover:!text-primary hover:!bg-[var(--accent-focus)] !p-2 !w-9 !h-9 rounded-full transition-colors mb-[1px]"></button>
//         </div>
//       </div>

//       <div class="mb-6">
//         <app-date-filter (dateChange)="onDateChange($event)"></app-date-filter>
//       </div>

//       @if (loading()) {
//         <div class="flex flex-col items-center justify-center py-20 text-secondary opacity-70">
//           <div class="w-10 h-10 border-4 border-primary border-t-[var(--accent-primary)] rounded-full animate-spin mb-4"></div>
//           <p class="text-sm font-medium tracking-wide">Crunching the numbers...</p>
//         </div>
//       } 
//       @else if (data(); as r) {
        
//         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
//           <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[110px] group hover:-translate-y-1 transition-transform duration-300">
//             <div class="absolute top-0 left-0 bottom-0 w-[4px] bg-primary transition-all group-hover:w-[6px]"></div>
//             <div class="pl-3">
//               <div class="flex justify-between items-start mb-2">
//                 <span class="text-[11px] font-bold uppercase text-secondary tracking-widest">Total Revenue</span>
//                 <div [class]="getGrowthClass(r.comparison.growth.revenueGrowth)" 
//                      class="px-2 py-0.5 rounded text-[10px] font-bold border border-current flex items-center gap-1">
//                   {{ r.comparison.growth.revenueGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.revenueGrowth | number:'1.0-1' }}%
//                 </div>
//               </div>
//               <div class="font-heading text-2xl font-bold text-primary truncate" [title]="r.summary.financials.totalRevenue">
//                 {{ r.summary.financials.totalRevenue | currency:'INR':'symbol':'1.0-0' }}
//               </div>
//               <div class="text-[10px] text-tertiary mt-1">vs {{ getCompareLabel() }}</div>
//             </div>
//           </div>

//           <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[110px] group hover:-translate-y-1 transition-transform duration-300">
//             <div class="absolute top-0 left-0 bottom-0 w-[4px] bg-success transition-all group-hover:w-[6px]"></div>
//             <div class="pl-3">
//               <div class="flex justify-between items-start mb-2">
//                 <span class="text-[11px] font-bold uppercase text-secondary tracking-widest">Gross Profit</span>
//                 <div [class]="getGrowthClass(r.comparison.growth.profitGrowth)" 
//                      class="px-2 py-0.5 rounded text-[10px] font-bold border border-current flex items-center gap-1">
//                   {{ r.comparison.growth.profitGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.profitGrowth | number:'1.0-1' }}%
//                 </div>
//               </div>
//               <div class="font-heading text-2xl font-bold text-success truncate">
//                 {{ r.summary.financials.grossProfit | currency:'INR':'symbol':'1.0-0' }}
//               </div>
//               <div class="text-[10px] text-tertiary mt-1">Net Income after COGS</div>
//             </div>
//           </div>

//           <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[110px] bg-[var(--color-success-bg)] border border-[var(--color-success-border)]">
//              <div class="pl-1">
//               <div class="text-[11px] font-bold uppercase text-secondary tracking-widest mb-2">Profit Margin</div>
//               <div class="font-heading text-3xl font-bold text-[var(--color-success-dark)] mb-2">
//                 {{ r.summary.financials.profitMargin }}%
//               </div>
//               <div class="text-[10px] font-semibold text-success bg-surface-secondary px-2 py-0.5 rounded-md w-fit border border-success/30">
//                 Markup: {{ r.summary.financials.markup }}%
//               </div>
//             </div>
//           </div>

//           <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[110px] hover:-translate-y-1 transition-transform duration-300">
//             <div class="absolute top-0 left-0 bottom-0 w-[4px] bg-[var(--accent-secondary)]"></div>
//             <div class="pl-3">
//               <div class="text-[11px] font-bold uppercase text-secondary tracking-widest mb-2">Avg. Order Value</div>
//               <div class="font-heading text-2xl font-bold text-secondary truncate">
//                 {{ r.summary.metrics.averageRevenuePerInvoice | currency:'INR':'symbol':'1.0-0' }}
//               </div>
//               <div class="text-[10px] text-tertiary mt-1 font-medium">
//                 Across {{ r.summary.metrics.totalInvoices }} Invoices
//               </div>
//             </div>
//           </div>
//         </div>

//         <div class="glass-surface p-5 mb-6 rounded-xl relative group/graph border border-primary">
          
//           <div class="flex flex-row justify-between items-center mb-10 relative z-10">
//             <div>
//               <h3 class="font-heading text-base font-semibold text-primary m-0">Performance Trend</h3>
//               <div class="text-[10px] text-tertiary mt-0.5 font-medium">Daily revenue vs net profit analysis</div>
//             </div>
            
//             <div class="flex items-center gap-4">
//               <div class="hidden md:flex gap-3 text-[10px] text-secondary font-medium">
//                 <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-[var(--color-bg-revenue)]"></span> Revenue</div>
//                 <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-gradient-to-b from-success to-[var(--color-success-bg)]"></span> Profit</div>
//               </div>
              
//               @if(r.trends.summary.bestDay) {
//                 <div class="text-[11px] text-secondary bg-surface-secondary px-3 py-1 rounded-full border border-primary flex items-center gap-2 shadow-sm">
//                   <span class="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"></span>
//                   <span class="text-tertiary">Best:</span>
//                   <span class="font-bold text-primary">{{ r.trends.summary.bestDay.period | date:'dd MMM' }}</span>
//                   <span class="text-success font-mono font-bold">({{ r.trends.summary.bestDay.profit | currency:'INR':'symbol':'1.0-0' }})</span>
//                 </div>
//               }
//             </div>
//           </div>
          
//           <div class="relative h-[260px] w-full">
            
//             <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 select-none">
//               <div class="border-t border-dashed border-primary w-full h-0"></div>
//               <div class="border-t border-dashed border-primary w-full h-0"></div>
//               <div class="border-t border-dashed border-primary w-full h-0"></div>
//               <div class="border-t border-dashed border-primary w-full h-0"></div>
//               <div class="border-t border-primary w-full h-0 opacity-50"></div> 
//             </div>

//             <div class="absolute inset-0 flex items-end justify-between gap-1 pl-1 pb-6 z-20">
//               @for (point of r.trends.data; track point.period) {
//                 <div class="group/bar flex-1 h-full flex flex-col items-center justify-end relative cursor-pointer">
                  
//                   <div class="absolute bottom-[115%] left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-all duration-200 pointer-events-none z-50 min-w-[180px] transform group-hover/bar:translate-y-0 translate-y-2">
//                     <div class="bg-surface-secondary border border-[var(--accent-primary)] rounded-lg shadow-xl overflow-hidden backdrop-blur-md">
//                       <div class="bg-[var(--component-bg-active)] px-3 py-2 border-b border-[var(--component-divider)] flex justify-between items-center">
//                         <span class="text-[10px] font-bold text-primary tracking-wide uppercase">{{ point.period | date:'EEE, dd MMM' }}</span>
//                         <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-ternary)] text-secondary border border-[var(--border-primary)]">
//                           {{ point.margin }}% Margin
//                         </span>
//                       </div>
//                       <div class="p-3 space-y-2">
//                         <div class="flex justify-between items-center gap-4">
//                           <span class="text-[10px] text-secondary font-medium">Revenue</span>
//                           <span class="text-xs font-mono font-bold text-primary tracking-tight">{{ point.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
//                         </div>
//                         <div class="flex justify-between items-center gap-4">
//                           <span class="text-[10px] text-success font-bold">Net Profit</span>
//                           <span class="text-xs font-mono font-bold text-success tracking-tight">{{ point.profit | currency:'INR':'symbol':'1.0-0' }}</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div class="w-3 h-3 bg-surface-secondary border-r border-b border-[var(--accent-primary)] rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
//                   </div>

//                   <div class="absolute top-0 bottom-0 w-[1px] bg-[var(--accent-primary)] opacity-0 group-hover/bar:opacity-40 transition-opacity duration-200 pointer-events-none dashed-line"></div>

//                   <div class="w-full max-w-[32px] relative flex items-end justify-center h-full mx-auto px-0.5 transition-transform duration-200 group-hover/bar:scale-105">
                    
//                     <div class="w-full absolute bottom-0 bg-[var(--component-bg-active)] rounded-t-[4px] border-t border-x border-transparent group-hover/bar:border-[var(--border-secondary)] transition-all duration-300"
//                          [style.height.%]="getBarHeight(point.revenue, r.summary.financials.totalRevenue)">
//                     </div>

//                     <div class="w-[60%] absolute bottom-0 rounded-t-[3px] z-10 transition-all duration-500 ease-out shadow-sm"
//                          [style.height.%]="getBarHeight(point.profit, r.summary.financials.totalRevenue)"
//                          style="background: linear-gradient(180deg, var(--color-success) 0%, var(--color-success-bg) 100%);">
//                          <div class="absolute top-0 left-0 right-0 h-[2px] bg-white opacity-40"></div>
//                     </div>
//                   </div>
                  
//                   <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max">
//                     <div class="text-[9px] font-medium text-tertiary -rotate-45 origin-top group-hover/bar:text-primary group-hover/bar:font-bold transition-colors">
//                       {{ point.period | date:(filters.groupBy === 'month' ? 'MMM' : 'dd MMM') }}
//                     </div>
//                   </div>

//                 </div>
//               }
//             </div>
//           </div>
//         </div>

//         <div class="glass-surface overflow-hidden rounded-xl border border-primary">
//           <p-tabs styleClass="report-tabs">
//             <p-tablist>
//               <p-tab value="0"><span class="text-xs font-bold tracking-wide">Top Products</span></p-tab>
//               <p-tab value="1"><span class="text-xs font-bold tracking-wide">Top Customers</span></p-tab>
//               <p-tab value="2"><span class="text-xs font-bold tracking-wide">Category Analysis</span></p-tab>
//             </p-tablist>
            
//             <p-tabpanels>
//               <p-tabpanel value="0">
//                 <p-table [value]="r.analysis.productAnalysis.topPerforming" [rows]="10" [paginator]="true" 
//                          styleClass="p-datatable-sm" responsiveLayout="scroll">
//                   <ng-template pTemplate="header">
//                     <tr class="text-xs uppercase tracking-wider text-secondary">
//                       <th class="bg-surface-secondary font-semibold p-3 text-left pl-4">Product</th>
//                       <th class="bg-surface-secondary font-semibold p-3 text-right">Qty</th>
//                       <th class="bg-surface-secondary font-semibold p-3 text-right">Revenue</th>
//                       <th class="bg-surface-secondary font-semibold p-3 text-right">Net Profit</th>
//                       <th class="bg-surface-secondary font-semibold p-3 text-right pr-4">Margin</th>
//                     </tr>
//                   </ng-template>
//                   <ng-template pTemplate="body" let-p>
//                     <tr class="border-b border-secondary hover:bg-[var(--component-bg-hover)] transition-colors text-sm group">
//                       <td class="p-3 pl-4">
//                         <div class="font-bold text-primary text-xs group-hover:text-[var(--accent-primary)] transition-colors">{{ p.productName }}</div>
//                         <div class="text-[10px] text-tertiary font-mono">{{ p.sku }}</div>
//                       </td>
//                       <td class="p-3 text-right text-secondary text-xs font-mono">{{ p.totalQuantity }}</td>
//                       <td class="p-3 text-right text-primary text-xs font-mono font-semibold">{{ p.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
//                       <td class="p-3 text-right font-bold text-success text-xs font-mono">{{ p.netProfit | currency:'INR':'symbol':'1.0-0' }}</td>
//                       <td class="p-3 text-right pr-4">
//                         <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-success-bg)] text-success border border-[var(--color-success-border)]">
//                           {{ p.profitMargin }}%
//                         </span>
//                       </td>
//                     </tr>
//                   </ng-template>
//                   <ng-template pTemplate="emptymessage">
//                     <tr><td colspan="5" class="text-center p-4 text-sm text-tertiary">No product data available for this period.</td></tr>
//                   </ng-template>
//                 </p-table>
//               </p-tabpanel>
              
//               <p-tabpanel value="1">
//                  <div class="p-8 text-center text-sm text-tertiary">Customer analysis visualization coming soon...</div>
//               </p-tabpanel>
//               <p-tabpanel value="2">
//                  <div class="p-8 text-center text-sm text-tertiary">Category breakdown visualization coming soon...</div>
//               </p-tabpanel>
//             </p-tabpanels>
//           </p-tabs>
//         </div>
//       }
//     </div>

//     <p-drawer [(visible)]="showFilters" position="right" styleClass="!w-[340px] !bg-surface-secondary !border-l !border-primary shadow-2xl" [header]="'Refine Analysis'">
//       <div class="flex flex-col gap-6 p-1 h-full">
        
//         <div class="flex flex-col gap-2">
//           <label class="text-xs font-bold text-secondary uppercase tracking-wider">Invoice Status</label>
//           <p-multiselect [options]="statusOptions" [(ngModel)]="filters.status" 
//             optionLabel="label" optionValue="value" placeholder="Select Status" 
//             styleClass="w-full !text-sm" display="chip" [showClear]="true">
//           </p-multiselect>
//         </div>

//         <div class="flex flex-col gap-2">
//           <label class="text-xs font-bold text-secondary uppercase tracking-wider">Revenue Range</label>
//           <div class="flex gap-2">
//             <p-inputNumber [(ngModel)]="filters.minAmount" placeholder="Min ₹" mode="currency" currency="INR" locale="en-IN" 
//               styleClass="w-full" inputStyleClass="!text-sm"></p-inputNumber>
//             <div class="flex items-center text-tertiary">-</div>
//             <p-inputNumber [(ngModel)]="filters.maxAmount" placeholder="Max ₹" mode="currency" currency="INR" locale="en-IN" 
//               styleClass="w-full" inputStyleClass="!text-sm"></p-inputNumber>
//           </div>
//         </div>

//         <div class="flex flex-col gap-3 pt-4 border-t border-primary">
//            <div class="flex flex-col gap-2">
//              <label class="text-xs font-bold text-secondary">Product ID / SKU</label>
//              <input type="text" pInputText [(ngModel)]="filters.productId" class="p-inputtext-sm w-full bg-surface-ternary border-secondary text-primary rounded-md p-2" placeholder="Search product...">
//            </div>
           
//            <div class="flex flex-col gap-2">
//              <label class="text-xs font-bold text-secondary">Customer ID</label>
//              <input type="text" pInputText [(ngModel)]="filters.customerId" class="p-inputtext-sm w-full bg-surface-ternary border-secondary text-primary rounded-md p-2" placeholder="Search customer...">
//            </div>
//         </div>

//         <div class="mt-auto flex gap-3 pt-4 border-t border-primary">
//           <button pButton label="Reset All" class="p-button-outlined p-button-secondary w-1/2 !text-xs !font-bold" (click)="resetFilters()"></button>
//           <button pButton label="Apply Filters" class="w-1/2 !text-xs !font-bold !bg-[var(--accent-primary)] !border-[var(--accent-primary)]" (click)="fetchReport(); showFilters.set(false)"></button>
//         </div>
//       </div>
//     </p-drawer>
//   `,
//   styles: [`
//     :host ::ng-deep {
//       /* PrimeNG Tab Tweaks for Glass/Compact Look */
//       .p-tablist-tab-list {
//         background: transparent !important;
//         border-bottom: 1px solid var(--border-primary) !important;
//         padding: 0 8px !important;
//       }
//       .p-tab {
//         padding: 14px 20px !important;
//         color: var(--text-secondary) !important;
//         transition: color 0.2s;
//       }
//       .p-tab:hover {
//         color: var(--text-primary) !important;
//       }
//       .p-tab-active {
//         border-bottom-width: 2px !important;
//         border-color: var(--accent-primary) !important;
//         color: var(--accent-primary) !important;
//       }
//       .p-tabpanels {
//         background: transparent !important;
//         padding: 0 !important;
//       }

//       /* Table Tweaks */
//       .p-datatable-tbody > tr > td {
//         padding: 0.75rem 1rem !important;
//         border-color: var(--border-secondary) !important;
//         background: transparent !important;
//       }
//       .p-datatable-thead > tr > th {
//         background: rgba(255,255,255,0.03) !important;
//         color: var(--text-secondary) !important;
//         border-bottom: 1px solid var(--border-primary) !important;
//       }
//       .p-paginator {
//         background: transparent !important;
//         border-top: 1px solid var(--border-secondary) !important;
//         color: var(--text-secondary) !important;
//       }
//       .p-paginator-page.p-highlight {
//         background: var(--accent-focus) !important;
//         color: var(--accent-primary) !important;
//       }

//       /* Drawer Tweaks */
//       .p-drawer-header {
//         background: var(--bg-secondary) !important;
//         border-bottom: 1px solid var(--border-primary) !important;
//         color: var(--text-primary) !important;
//         padding: 1rem !important;
//       }
//       .p-drawer-content {
//         background: var(--bg-secondary) !important;
//         padding: 1rem !important;
//       }
//     }
//   `]
// })
// export class AdvancedProfitAnalysisComponent implements OnInit {
//   private invoiceService = inject(InvoiceService);

//   // State Signals
//   data = signal<ProfitAnalysisReport | null>(null);
//   loading = signal(false);
//   showFilters = signal(false);

//   // Filter Model
//   filters = {
//     groupBy: 'day',
//     compareWith: 'previous_period',
//     startDate: '',
//     endDate: '',
//     status: [] as string[],
//     minAmount: null as number | null,
//     maxAmount: null as number | null,
//     productId: '',
//     customerId: '',
//     category: ''
//   };

//   // Dropdown Options
//   groupByOptions = [
//     { label: 'Daily', value: 'day' },
//     { label: 'Weekly', value: 'week' },
//     { label: 'Monthly', value: 'month' }
//   ];

//   compareOptions = [
//     { label: 'Previous Period', value: 'previous_period' },
//     { label: 'Last Year', value: 'same_period_last_year' },
//     { label: 'None', value: 'none' }
//   ];

//   statusOptions = [
//     { label: 'Paid', value: 'paid' },
//     { label: 'Issued', value: 'issued' },
//     { label: 'Overdue', value: 'overdue' }
//   ];

//   ngOnInit() {
//     this.fetchReport();
//   }

//   onDateChange(event: any) {
//     this.filters.startDate = event.startDate;
//     this.filters.endDate = event.endDate;
//     this.fetchReport();
//   }

//   fetchReport() {
//     this.loading.set(true);

//     // Deep copy and clean payload
//     const payload: any = { ...this.filters };

//     if (Array.isArray(payload.status) && payload.status.length > 0) {
//       payload.status = payload.status.join(',');
//     } else {
//       delete payload.status;
//     }

//     // Remove empty/null filters to keep API request clean
//     if (!payload.minAmount) delete payload.minAmount;
//     if (!payload.maxAmount) delete payload.maxAmount;
//     if (!payload.productId) delete payload.productId;
//     if (!payload.customerId) delete payload.customerId;
//     if (!payload.category) delete payload.category;

//     this.invoiceService.getAdvancedProfitAnalysis(payload)
//       .pipe(finalize(() => this.loading.set(false)))
//       .subscribe({
//         next: (res) => {
//           if (res.status === 'success') {
//             this.data.set(res.data as ProfitAnalysisReport);
//           }
//         },
//         error: (err) => console.error('Profit Report Error:', err)
//       });
//   }

//   resetFilters() {
//     this.filters.status = [];
//     this.filters.minAmount = null;
//     this.filters.maxAmount = null;
//     this.filters.productId = '';
//     this.filters.customerId = '';
//     this.filters.category = '';
//     // Optional: Reset dates if needed, but usually users want to keep the date range
//     this.fetchReport();
//   }

//   filterCount(): number {
//     let count = 0;
//     if (this.filters.status.length) count++;
//     if (this.filters.minAmount || this.filters.maxAmount) count++;
//     if (this.filters.productId) count++;
//     if (this.filters.customerId) count++;
//     if (this.filters.category) count++;
//     return count;
//   }

//   // --- Helper Methods for Template ---

//   getBarHeight(val: number, max: number): number {
//     if (!max || max === 0) return 0;
//     // Calculate percentage, max cap at 100%, min cap at 2% for visibility
//     const percentage = (val / max) * 100;
//     return Math.max(2, Math.min(percentage, 100));
//   }

//   getGrowthClass(value: number): string {
//     return value > 0 
//       ? 'bg-[var(--color-success-bg)] text-success border-success/30' 
//       : 'bg-[var(--color-error-bg)] text-error border-error/30';
//   }

//   getCompareLabel(): string {
//     if (this.filters.compareWith === 'previous_period') return 'prev. period';
//     if (this.filters.compareWith === 'same_period_last_year') return 'last year';
//     return 'baseline';
//   }
// }