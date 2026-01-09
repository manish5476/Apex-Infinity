import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect'; // For status
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer'; // or SidebarModule for older versions
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { DateFilterComponent } from '../date-filter/date-filter.component';
import { InvoiceService } from '../../services/invoice-service';
import { TabsModule } from 'primeng/tabs';
@Component({
  selector: 'app-advanced-profit-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    MultiSelectModule,
    InputNumberModule,
    ButtonModule,
    TableModule,
    TabsModule,
    DrawerModule,
    AccordionModule,
    TooltipModule,
    DateFilterComponent
  ],
  template: `
    <div class="report-container">

      <div class="control-bar">
        <div class="bar-left">
          <h2 class="report-title">Advanced Profit Report</h2>
          <div class="active-filters-badges">
             @if(filterCount() > 0) {
               <span class="filter-badge">{{ filterCount() }} filters active</span>
             }
          </div>
        </div>
        
        <div class="bar-right">
          <div class="control-group">
            <label>Group By</label>
            <p-select [options]="groupByOptions" [(ngModel)]="filters.groupBy" (onChange)="fetchReport()" 
              optionLabel="label" optionValue="value" styleClass="sm-select" [style]="{'width':'120px'}">
            </p-select>
          </div>

          <div class="control-group">
             <label>Comparison</label>
             <p-select [options]="compareOptions" [(ngModel)]="filters.compareWith" (onChange)="fetchReport()" 
              optionLabel="label" optionValue="value" styleClass="sm-select" [style]="{'width':'140px'}">
            </p-select>
          </div>

          <button pButton label="Filters" icon="pi pi-filter" (click)="showFilters.set(true)" 
            class="p-button-outlined p-button-secondary p-button-sm"></button>
          
          <button pButton icon="pi pi-refresh" (click)="fetchReport()" 
            class="p-button-text p-button-rounded"></button>
        </div>
      </div>

      <div class="date-context-row">
         <app-date-filter (dateChange)="onDateChange($event)"></app-date-filter>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Generating comprehensive analysis...</p>
        </div>
      } 
      @else if (data(); as r) {
        
        <div class="kpi-deck">
          <div class="kpi-card">
            <div class="kpi-head">
              <span>Total Revenue</span>
            </div>
            <div class="kpi-val">{{ r.summary.financials.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
            <div class="kpi-foot">
              <span class="trend" [class.up]="r.comparison.growth.revenueGrowth > 0" [class.down]="r.comparison.growth.revenueGrowth < 0">
                 {{ r.comparison.growth.revenueGrowth | number:'1.0-1' }}%
              </span>
              <span class="context">vs {{ filters.compareWith === 'previous_period' ? 'prev. period' : 'last year' }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-head"><span>Gross Profit</span></div>
            <div class="kpi-val text-green-700">{{ r.summary.financials.grossProfit | currency:'INR':'symbol':'1.0-0' }}</div>
            <div class="kpi-foot">
              <span class="trend" [class.up]="r.comparison.growth.profitGrowth > 0" [class.down]="r.comparison.growth.profitGrowth < 0">
                 {{ r.comparison.growth.profitGrowth | number:'1.0-1' }}%
              </span>
               <span class="context">Growth</span>
            </div>
          </div>

          <div class="kpi-card highlight">
            <div class="kpi-head"><span>Profit Margin</span></div>
            <div class="kpi-val text-green-800">{{ r.summary.financials.profitMargin }}%</div>
             <div class="kpi-foot">
              <span class="pill">Markup: {{ r.summary.financials.markup }}%</span>
            </div>
          </div>

          <div class="kpi-card">
             <div class="kpi-head"><span>Avg. Order Value</span></div>
             <div class="kpi-val text-slate-700">{{ r.summary.metrics.averageRevenuePerInvoice | currency:'INR':'symbol':'1.0-0' }}</div>
             <div class="kpi-foot text-slate-500">
               {{ r.summary.metrics.totalInvoices }} Invoices
             </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>Revenue & Profit Trend</h3>
            <div class="trend-summary">
              Best Day: <span class="fw-bold">{{ r.trends.summary.bestDay.period | date:'mediumDate' }}</span> 
              ({{ r.trends.summary.bestDay.profit | currency:'INR':'symbol':'1.0-0' }})
            </div>
          </div>
          
          <div class="trend-chart-wrapper">
             @for (point of r.trends.data; track point.period) {
               <div class="trend-col">
                 <div class="col-visual">
                   <div class="bar-rev" [style.height.%]="getBarHeight(point.revenue, r.summary.financials.totalRevenue)"></div>
                   <div class="bar-prof" [style.height.%]="getBarHeight(point.profit, r.summary.financials.totalRevenue)"></div>
                 </div>
                 <div class="col-label">{{ point.period | date:(filters.groupBy === 'month' ? 'MMM yyyy' : 'dd MMM') }}</div>
                 
                 <div class="col-tooltip">
                    <div>{{ point.period | date:'fullDate' }}</div>
                    <div class="tt-row"><span>Rev:</span> {{point.revenue | currency:'INR':'symbol':'1.0-0'}}</div>
                    <div class="tt-row text-green-400"><span>Prof:</span> {{point.profit | currency:'INR':'symbol':'1.0-0'}}</div>
                    <div class="tt-row text-slate-400"><span>Mrg:</span> {{point.margin}}%</div>
                 </div>
               </div>
             }
          </div>
        </div>

        <div class="section-card no-pad">
          
          <p-tabs styleClass="report-tabs">
            <p-tablist>
        <p-tab value="0">Top Products</p-tab>
        <p-tab value="1">Top Customers</p-tab>
        <p-tab value="2">Categories</p-tab>
    </p-tablist>
    <p-tabpanels>
            <p-tabpanel value="0" header="Top Products">
              <p-table [value]="r.analysis.productAnalysis.topPerforming" [rows]="5" [paginator]="true" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Product / SKU</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Revenue</th>
                    <th class="text-right">Net Profit</th>
                    <th class="text-right">Margin</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-p>
                  <tr>
                    <td>
                      <div class="fw-bold text-slate-800">{{ p.productName }}</div>
                      <div class="text-xs text-slate-500">{{ p.sku }}</div>
                    </td>
                    <td class="text-right">{{ p.totalQuantity }}</td>
                    <td class="text-right">{{ p.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="text-right text-green-700 fw-bold">{{ p.netProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="text-right">
                       <span class="badge-margin">{{ p.profitMargin }}%</span>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel >

            <p-tabpanel value="1" header="Top Customers">
               <p-table [value]="r.analysis.customerAnalysis.mostProfitable" [rows]="5" [paginator]="true" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Customer</th>
                    <th class="text-right">Inv</th>
                    <th class="text-right">Avg. Value</th>
                    <th class="text-right">Profit</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-c>
                  <tr>
                    <td class="fw-medium">{{ c.customerName }}</td>
                    <td class="text-right">{{ c.totalInvoices }}</td>
                    <td class="text-right">{{ c.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="text-right text-green-700 fw-bold">{{ c.totalProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel >

            <p-tabpanel value="2" header="Categories">
              <p-table [value]="r.analysis.productAnalysis.byCategory" styleClass="p-datatable-sm">
                 <ng-template pTemplate="header">
                  <tr>
                    <th>Category</th>
                    <th class="text-right">Unique Items</th>
                    <th class="text-right">Revenue</th>
                    <th class="text-right">Profit</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-cat>
                   <tr>
                    <td class="fw-medium">{{ cat.category || 'Uncategorized' }}</td>
                    <td class="text-right">{{ cat.uniqueProducts }}</td>
                    <td class="text-right">{{ cat.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="text-right text-green-700">{{ cat.totalProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel >
            </p-tabpanels >
          </p-tabs>
        </div>
      }
    </div>

    <p-drawer [(visible)]="showFilters" position="right" [style]="{width: '350px'}" header="Advanced Filters">
      <div class="filter-sidebar-content">
        
        <div class="filter-section">
          <label>Status</label>
          <p-multiSelect [options]="statusOptions" [(ngModel)]="filters.status" placeholder="Select Status" 
            styleClass="w-full" appendTo="body"></p-multiSelect>
        </div>

        <div class="filter-section">
          <label>Amount Range</label>
          <div class="flex gap-2">
             <p-inputNumber [(ngModel)]="filters.minAmount" placeholder="Min" mode="currency" currency="INR" locale="en-IN" class="w-full"></p-inputNumber>
             <p-inputNumber [(ngModel)]="filters.maxAmount" placeholder="Max" mode="currency" currency="INR" locale="en-IN" class="w-full"></p-inputNumber>
          </div>
        </div>
        
        <div class="filter-section">
           <label>Product ID</label>
           <input type="text" pInputText [(ngModel)]="filters.productId" class="w-full p-inputtext-sm" placeholder="Enter Product ID">
        </div>

         <div class="filter-section">
           <label>Customer ID</label>
           <input type="text" pInputText [(ngModel)]="filters.customerId" class="w-full p-inputtext-sm" placeholder="Enter Customer ID">
        </div>

         <div class="filter-section">
           <label>Category</label>
           <input type="text" pInputText [(ngModel)]="filters.category" class="w-full p-inputtext-sm" placeholder="e.g. Electronics">
        </div>

        <div class="filter-footer">
           <button pButton label="Reset" class="p-button-outlined p-button-secondary w-full" (click)="resetFilters()"></button>
           <button pButton label="Apply Filters" class="w-full" (click)="fetchReport(); showFilters.set(false)"></button>
        </div>
      </div>
    </p-drawer>
  `,
  styles: [`
    :host {
      --font-family: var(--font-body);
      display: block;
      background: #f8fafc;
      min-height: 100%;
      width: 100%;
    }

    .report-container {
      width: 100%;        /* Changed: Takes full width */
      max-width: none;    /* Changed: Removes the 1200px limit */
      margin: 0;
      padding: var(--spacing-lg);
      box-sizing: border-box;
    }

    /* 1. Control Bar */
    .control-bar {
      display: flex; flex-direction: column; gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg); background: #fff; padding: var(--spacing-lg);
      border-radius: var(--ui-border-radius-lg); border: 1px solid #e2e8f0;
      box-shadow: var(--shadow-sm);
    }
    @media(min-width: 768px) {
      .control-bar { flex-direction: row; justify-content: space-between; align-items: center; }
    }
    .report-title { font-family: var(--font-heading); font-size: 1.25rem; margin: 0; color: #0f172a; }
    .filter-badge { background: #e0f2fe; color: #0284c7; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600; margin-top: 4px; display: inline-block;}
    
    .bar-right { display: flex; gap: var(--spacing-md); align-items: center; flex-wrap: wrap; }
    .control-group { display: flex; flex-direction: column; gap: 2px; }
    .control-group label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; }

    /* 2. Date Context */
    .date-context-row { margin-bottom: var(--spacing-xl); }

    /* 3. KPI Deck (Responsive Grid) */
    .kpi-deck {
      display: grid; 
      /* Auto-fit will create as many columns as fit on the screen */
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }
    .kpi-card {
      background: #fff; padding: var(--spacing-lg); border-radius: var(--ui-border-radius-lg);
      border: 1px solid #e2e8f0; box-shadow: var(--shadow-sm);
      display: flex; flex-direction: column; justify-content: space-between;
      min-height: 140px; /* Ensure consistent height */
    }
    .kpi-card.highlight { background: #f0fdf4; border-color: #bbf7d0; }
    
    .kpi-head { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .kpi-val { font-family: var(--font-heading); font-size: 1.75rem; font-weight: 700; color: #0f172a; line-height: 1.1; margin-bottom: 8px; }
    
    .kpi-foot { display: flex; align-items: center; gap: 8px; font-size: 11px; margin-top: auto; }
    .trend { font-weight: 700; }
    .trend.up { color: #16a34a; }
    .trend.down { color: #dc2626; }
    .trend::before { content: '▲ '; }
    .trend.down::before { content: '▼ '; }
    .context { color: #94a3b8; }
    .pill { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: 600; }

    /* 4. Section Card */
    .section-card {
      background: #fff; border-radius: var(--ui-border-radius-lg); border: 1px solid #e2e8f0;
      box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-xl); padding: var(--spacing-xl);
      width: 100%; /* Ensure card takes full width */
    }
    .section-card.no-pad { padding: 0; overflow: hidden; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl); }
    .section-header h3 { margin: 0; font-family: var(--font-heading); font-size: 1rem; color: #334155; }
    .trend-summary { font-size: 12px; color: #64748b; }

    /* Chart - Adjusted for wide screens */
    .trend-chart-wrapper {
      height: 300px; /* Slightly taller for wide screens */
      display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; /* More gap */
      padding: 0 var(--spacing-md);
    }
    .trend-col { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; position: relative; }
    .col-visual { flex: 1; width: 100%; position: relative; display: flex; align-items: flex-end; justify-content: center; }
    
    .bar-rev { width: 60%; max-width: 40px; background: #e2e8f0; border-radius: 4px; position: absolute; bottom: 0; transition: height 0.3s; }
    .bar-prof { width: 60%; max-width: 40px; background: #22c55e; border-radius: 4px; position: absolute; bottom: 0; z-index: 2; opacity: 0.9; transition: height 0.3s; }
    
    .col-label { font-size: 10px; color: #94a3b8; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center; }

    .col-tooltip {
      position: absolute; top: 0; background: #0f172a; color: #fff; padding: 8px; border-radius: 6px;
      font-size: 11px; z-index: 10; opacity: 0; pointer-events: none; transition: 0.2s; min-width: 120px;
    }
    .trend-col:hover .col-tooltip { opacity: 1; transform: translateY(-10px); }
    .trend-col:hover .bar-rev { background: #cbd5e1; }
    .trend-col:hover .bar-prof { background: #16a34a; }
    .tt-row { display: flex; justify-content: space-between; margin-top: 2px; }

    /* Tables */
    ::ng-deep .p-tabview-nav { border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
    ::ng-deep .p-tabview-nav li .p-tabview-nav-link { background: transparent; border: none; font-weight: 500; color: #64748b; }
    ::ng-deep .p-tabview-nav li.p-highlight .p-tabview-nav-link { color: #0f172a; border-bottom: 2px solid #0f172a; }
    
    /* Ensure tables inside tabs take full width */
    ::ng-deep .p-tabview-panels { padding: 0; }
    
    .badge-margin { background: #f0fdf4; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; }

    /* Filter Sidebar */
    .filter-sidebar-content { display: flex; flex-direction: column; gap: var(--spacing-lg); height: 100%; }
    .filter-section { display: flex; flex-direction: column; gap: 6px; }
    .filter-section label { font-size: 12px; font-weight: 600; color: #334155; }
    .filter-footer { margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 20px; border-top: 1px solid #e2e8f0; }

    /* Utils */
    .fw-bold { font-weight: 700; }
    .fw-medium { font-weight: 500; }
    .text-green-700 { color: #15803d; }
    .text-green-800 { color: #166534; }
    .text-slate-800 { color: #1e293b; }
    .text-xs { font-size: 0.75rem; }
    .w-full { width: 100%; }
    
    .loading-state { padding: 60px; text-align: center; color: #64748b; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s infinite linear; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
`]
})
export class AdvancedProfitAnalysisComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  // State
  data = signal<any>(null);
  loading = signal(false);
  showFilters = signal(false);

  // Filters Model
  filters = {
    groupBy: 'day',
    compareWith: 'previous_period',
    startDate: '',
    endDate: '',
    status: [],
    minAmount: null,
    maxAmount: null,
    productId: '',
    customerId: '',
    category: ''
  };

  // Options
  groupByOptions = [
    { label: 'Daily', value: 'day' },
    { label: 'Weekly', value: 'week' },
    { label: 'Monthly', value: 'month' }
  ];

  compareOptions = [
    { label: 'Previous Period', value: 'previous_period' },
    { label: 'Last Year', value: 'same_period_last_year' },
    { label: 'None', value: 'none' }
  ];

  statusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Issued', value: 'issued' },
    { label: 'Overdue', value: 'overdue' }
  ];

  ngOnInit() {
    this.fetchReport();
  }

  onDateChange(event: any) {
    this.filters.startDate = event.startDate;
    this.filters.endDate = event.endDate;
    this.fetchReport();
  }

  fetchReport() {
    this.loading.set(true);

    // Clean filters (remove null/empty)
    const payload: any = { ...this.filters };

    // Convert array status to comma string if needed by backend, 
    // or keep array if backend supports handling repeated query params.
    // Based on snippet: `status, // comma separated`
    if (Array.isArray(payload.status) && payload.status.length > 0) {
      payload.status = payload.status.join(',');
    } else {
      delete payload.status;
    }

    if (!payload.minAmount) delete payload.minAmount;
    if (!payload.maxAmount) delete payload.maxAmount;
    if (!payload.productId) delete payload.productId;
    if (!payload.customerId) delete payload.customerId;
    if (!payload.category) delete payload.category;

    this.invoiceService.getAdvancedProfitAnalysis(payload)
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

  resetFilters() {
    this.filters.status = [];
    this.filters.minAmount = null;
    this.filters.maxAmount = null;
    this.filters.productId = '';
    this.filters.customerId = '';
    this.filters.category = '';
    this.fetchReport();
  }

  filterCount(): number {
    let count = 0;
    if (this.filters.status.length) count++;
    if (this.filters.minAmount || this.filters.maxAmount) count++;
    if (this.filters.productId) count++;
    if (this.filters.customerId) count++;
    if (this.filters.category) count++;
    return count;
  }

  getBarHeight(val: number, max: number): number {
    if (!max) return 0;
    // Cap at 100%
    return Math.min((val / max) * 100, 100);
  }
}