import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { DateFilterComponent } from '../date-filter/date-filter.component';
import { InvoiceService } from '../../services/invoice-service';

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
    <div class="min-h-screen w-full bg-surface-ternary p-4 md:p-6 transition-colors duration-300">

      <div class="glass-surface mb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl">
        <div class="flex flex-col gap-1">
          <div class="font-heading text-xl font-bold text-primary m-0 leading-tight">
            Advanced Profit Report
          </div>
          @if(filterCount() > 0) {
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-info text-info border border-info w-fit uppercase tracking-wider">
              {{ filterCount() }} Active
            </span>
          }
        </div>
        
        <div class="flex flex-wrap items-end gap-2 w-full md:w-auto">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-bold text-secondary">Group By</label>
            <p-select [options]="groupByOptions" [(ngModel)]="filters.groupBy" (onChange)="fetchReport()" 
              optionLabel="label" optionValue="value" styleClass="w-[110px] !bg-secondary !border-primary !text-xs">
            </p-select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-bold text-secondary">Comparison</label>
            <p-select [options]="compareOptions" [(ngModel)]="filters.compareWith" (onChange)="fetchReport()" 
              optionLabel="label" optionValue="value" styleClass="w-[130px] !bg-secondary !border-primary !text-xs">
            </p-select>
          </div>

          <button pButton icon="pi pi-filter" (click)="showFilters.set(true)" 
            class="!bg-transparent !text-secondary !border-secondary hover:!text-primary hover:!border-primary hover:!bg-[var(--accent-focus)] !p-2 !w-9 !h-9 rounded transition-colors"></button>
          
          <button pButton icon="pi pi-refresh" (click)="fetchReport()" 
            class="!text-secondary hover:!text-primary hover:!bg-[var(--accent-focus)] !p-2 !w-9 !h-9 rounded-full transition-colors"></button>
        </div>
      </div>

      <div class="mb-6">
        <app-date-filter (dateChange)="onDateChange($event)"></app-date-filter>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20 text-secondary opacity-70">
          <div class="w-8 h-8 border-2 border-primary border-t-[var(--accent-primary)] rounded-full animate-spin mb-3"></div>
          <p class="text-sm font-medium">Analyzing data...</p>
        </div>
      } 
      @else if (data(); as r) {
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[100px]">
            <div class="absolute top-0 left-0 bottom-0 w-[3px] bg-primary"></div>
            <div class="pl-2">
              <div class="flex justify-between items-start mb-1">
                <span class="text-[11px] font-bold uppercase text-secondary tracking-widest">Revenue</span>
                <div [class]="r.comparison.growth.revenueGrowth > 0 ? 'bg-[var(--color-success-bg)] text-success' : 'bg-[var(--color-error-bg)] text-error'" 
                     class="px-1.5 py-0.5 rounded text-[10px] font-bold border border-current flex items-center gap-1">
                  {{ r.comparison.growth.revenueGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.revenueGrowth | number:'1.0-1' }}%
                </div>
              </div>
              <div class="font-heading text-2xl font-bold text-primary truncate" [title]="r.summary.financials.totalRevenue">
                {{ r.summary.financials.totalRevenue | currency:'INR':'symbol':'1.0-0' }}
              </div>
              <div class="text-[10px] text-tertiary mt-1">vs {{ filters.compareWith === 'previous_period' ? 'prev. period' : 'last year' }}</div>
            </div>
          </div>

          <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[100px]">
            <div class="absolute top-0 left-0 bottom-0 w-[3px] bg-success"></div>
            <div class="pl-2">
              <div class="flex justify-between items-start mb-1">
                <span class="text-[11px] font-bold uppercase text-secondary tracking-widest">Gross Profit</span>
                <div [class]="r.comparison.growth.profitGrowth > 0 ? 'bg-[var(--color-success-bg)] text-success' : 'bg-[var(--color-error-bg)] text-error'" 
                     class="px-1.5 py-0.5 rounded text-[10px] font-bold border border-current flex items-center gap-1">
                  {{ r.comparison.growth.profitGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.profitGrowth | number:'1.0-1' }}%
                </div>
              </div>
              <div class="font-heading text-2xl font-bold text-success truncate" [title]="r.summary.financials.grossProfit">
                {{ r.summary.financials.grossProfit | currency:'INR':'symbol':'1.0-0' }}
              </div>
              <div class="text-[10px] text-tertiary mt-1">Net Income</div>
            </div>
          </div>

          <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[100px] bg-[var(--color-success-bg)] border border-[var(--color-success-border)]">
             <div class="pl-1">
              <div class="text-[11px] font-bold uppercase text-secondary tracking-widest mb-1">Profit Margin</div>
              <div class="font-heading text-2xl font-bold text-[var(--color-success-dark)] mb-1">
                {{ r.summary.financials.profitMargin }}%
              </div>
              <div class="text-[10px] font-semibold text-success bg-surface-secondary px-2 py-0.5 rounded-full w-fit border border-success">
                Markup: {{ r.summary.financials.markup }}%
              </div>
            </div>
          </div>

          <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[100px]">
            <div class="absolute top-0 left-0 bottom-0 w-[3px] bg-[var(--accent-secondary)]"></div>
            <div class="pl-2">
              <div class="text-[11px] font-bold uppercase text-secondary tracking-widest mb-1">Avg. Order Value</div>
              <div class="font-heading text-2xl font-bold text-secondary truncate">
                {{ r.summary.metrics.averageRevenuePerInvoice | currency:'INR':'symbol':'1.0-0' }}
              </div>
              <div class="text-[10px] text-tertiary mt-1">
                {{ r.summary.metrics.totalInvoices }} Total Invoices
              </div>
            </div>
          </div>
        </div>

        <div class="glass-surface p-5 mb-6 rounded-xl relative group/graph">
  
  <div class="flex flex-row justify-between items-center mb-10 relative z-10">
    <div>
      <h3 class="font-heading text-base font-semibold text-primary m-0">Performance Trend</h3>
      <div class="text-[10px] text-tertiary mt-0.5 font-medium">Daily revenue vs net profit analysis</div>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="hidden md:flex gap-3 text-[10px] text-secondary font-medium">
        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-[var(--color-bg-revenue)]"></span> Revenue</div>
        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-success"></span> Profit</div>
      </div>
      
      <div class="text-[11px] text-secondary bg-surface-secondary px-3 py-1 rounded-full border border-primary flex items-center gap-2 shadow-sm">
        <span class="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"></span>
        <span class="font-bold text-primary">{{ r.trends.summary.bestDay.period | date:'dd MMM' }}</span>
        <span class="text-tertiary font-mono">({{ r.trends.summary.bestDay.profit | currency:'INR':'symbol':'1.0-0' }})</span>
      </div>
    </div>
  </div>
  
  <div class="relative h-[260px] w-full">
    
    <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 select-none">
      <div class="border-t border-dashed border-primary w-full h-0"></div>
      <div class="border-t border-dashed border-primary w-full h-0"></div>
      <div class="border-t border-dashed border-primary w-full h-0"></div>
      <div class="border-t border-dashed border-primary w-full h-0"></div>
      <div class="border-t border-primary w-full h-0 opacity-50"></div> </div>

    <div class="absolute inset-0 flex items-end justify-between gap-1 pl-1 pb-6 z-20">
      @for (point of r.trends.data; track point.period) {
        <div class="group/bar flex-1 h-full flex flex-col items-center justify-end relative cursor-pointer">
          
          <div class="absolute bottom-[115%] left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-all duration-200 pointer-events-none z-50 min-w-[180px] transform group-hover/bar:translate-y-0 translate-y-2">
            
            <div class="bg-surface-secondary border border-[var(--accent-primary)] rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] overflow-hidden">
              
              <div class="bg-[var(--component-bg-active)] px-3 py-2 border-b border-[var(--component-divider)] flex justify-between items-center">
                <span class="text-[10px] font-bold text-primary tracking-wide uppercase">{{ point.period | date:'EEE, dd MMM' }}</span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-ternary)] text-secondary border border-[var(--border-primary)]">
                  {{ point.margin }}% Margin
                </span>
              </div>

              <div class="p-3 space-y-2">
                <div class="flex justify-between items-center gap-4">
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]"></span>
                    <span class="text-[10px] text-secondary font-medium">Revenue</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-primary tracking-tight">
                    {{ point.revenue | currency:'INR':'symbol':'1.0-0' }}
                  </span>
                </div>

                <div class="flex justify-between items-center gap-4">
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]"></span>
                    <span class="text-[10px] text-success font-bold">Net Profit</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-success tracking-tight">
                    {{ point.profit | currency:'INR':'symbol':'1.0-0' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="w-3 h-3 bg-surface-secondary border-r border-b border-[var(--accent-primary)] rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
          </div>

          <div class="absolute top-0 bottom-0 w-[1px] bg-[var(--accent-primary)] opacity-0 group-hover/bar:opacity-40 transition-opacity duration-200 pointer-events-none dashed-line"></div>

          <div class="w-full max-w-[32px] relative flex items-end justify-center h-full mx-auto px-0.5 transition-transform duration-200 group-hover/bar:scale-105">
            
            <div class="w-full absolute bottom-0 bg-[var(--component-bg-active)] rounded-t-[4px] border border-transparent group-hover/bar:border-[var(--border-secondary)] transition-all duration-300"
                 [style.height.%]="getBarHeight(point.revenue, r.summary.financials.totalRevenue)">
            </div>

            <div class="w-[60%] absolute bottom-0 rounded-t-[3px] z-10 transition-all duration-500 ease-out shadow-sm"
                 [style.height.%]="getBarHeight(point.profit, r.summary.financials.totalRevenue)"
                 style="background: linear-gradient(180deg, var(--color-success) 0%, var(--color-success-bg) 100%);">
                 <div class="absolute top-0 left-0 right-0 h-[2px] bg-white opacity-40"></div>
            </div>
          </div>
          
          <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max">
            <div class="text-[9px] font-medium text-tertiary -rotate-45 origin-top group-hover/bar:text-primary group-hover/bar:font-bold transition-colors">
              {{ point.period | date:(filters.groupBy === 'month' ? 'MMM' : 'dd MMM') }}
            </div>
          </div>

        </div>
      }
    </div>
  </div>
</div>
        <div class="glass-surface overflow-hidden rounded-xl">
          <p-tabs styleClass="report-tabs">
            <p-tablist>
              <p-tab value="0"><span class="text-xs">Products</span></p-tab>
              <p-tab value="1"><span class="text-xs">Customers</span></p-tab>
              <p-tab value="2"><span class="text-xs">Categories</span></p-tab>
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <p-table [value]="r.analysis.productAnalysis.topPerforming" [rows]="5" styleClass="w-full">
                  <ng-template pTemplate="header">
                    <tr class="border-b border-primary text-xs">
                      <th class="bg-surface-secondary text-secondary font-semibold p-3 text-left">Product</th>
                      <th class="bg-surface-secondary text-secondary font-semibold p-3 text-right">Qty</th>
                      <th class="bg-surface-secondary text-secondary font-semibold p-3 text-right">Revenue</th>
                      <th class="bg-surface-secondary text-secondary font-semibold p-3 text-right">Profit</th>
                      <th class="bg-surface-secondary text-secondary font-semibold p-3 text-right">Margin</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-p>
                    <tr class="border-b border-secondary hover:bg-[var(--component-bg-hover)] transition-colors text-sm">
                      <td class="p-3 bg-secondary">
                        <div class="font-medium text-primary text-xs">{{ p.productName }}</div>
                        <div class="text-[10px] text-tertiary">{{ p.sku }}</div>
                      </td>
                      <td class="p-3 bg-secondary text-right text-primary text-xs">{{ p.totalQuantity }}</td>
                      <td class="p-3 bg-secondary text-right text-primary text-xs">{{ p.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="p-3 bg-secondary text-right font-bold text-success text-xs">{{ p.netProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="p-3 bg-secondary text-right">
                        <span class="text-[10px] font-bold text-success">{{ p.profitMargin }}%</span>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>
              </p-tabpanels>
          </p-tabs>
        </div>
      }
    </div>

    <p-drawer [(visible)]="showFilters" position="right" styleClass="!w-[320px] !bg-secondary !border-l !border-primary" [header]="'Filters'">
       </p-drawer>
  `,
  styles: [`
    :host ::ng-deep {
      /* Specific Tweaks for Compact Design */
      .p-tablist-tab-list {
        background: transparent !important;
        border-bottom: 1px solid var(--border-primary) !important;
        padding: 0 8px !important;
      }
      .p-tab {
        padding: 12px 16px !important;
      }
      .p-tab-active {
        border-bottom-width: 2px !important;
      }
      .p-datatable .p-datatable-tbody > tr > td {
        padding: 0.75rem !important; /* Tighter table cells */
      }
    }
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

    const payload: any = { ...this.filters };

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
    return Math.min((val / max) * 100, 100);
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
// import { ButtonModule } from 'primeng/button';
// import { TableModule } from 'primeng/table';
// import { DrawerModule } from 'primeng/drawer';
// import { AccordionModule } from 'primeng/accordion';
// import { TooltipModule } from 'primeng/tooltip';
// import { TabsModule } from 'primeng/tabs';
// import { DateFilterComponent } from '../date-filter/date-filter.component';
// import { InvoiceService } from '../../services/invoice-service';

// @Component({
//   selector: 'app-advanced-profit-analysis',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     SelectModule,
//     MultiSelectModule,
//     InputNumberModule,
//     ButtonModule,
//     TableModule,
//     TabsModule,
//     DrawerModule,
//     AccordionModule,
//     TooltipModule,
//     DateFilterComponent
//   ],
//   template: `
//   <div class="report-container">

//   <div class="control-bar">
//     <div class="bar-left">
//       <h2 class="report-title">Advanced Profit Report</h2>
//       <div class="active-filters-badges">
//         @if(filterCount() > 0) {
//           <span class="filter-badge">{{ filterCount() }} filters active</span>
//         }
//       </div>
//     </div>
    
//     <div class="bar-right">
//       <div class="control-group">
//         <label>Group By</label>
//         <p-select [options]="groupByOptions" [(ngModel)]="filters.groupBy" (onChange)="fetchReport()" 
//           optionLabel="label" optionValue="value" styleClass="sm-select" [style]="{'width':'120px'}">
//         </p-select>
//       </div>

//       <div class="control-group">
//         <label>Comparison</label>
//         <p-select [options]="compareOptions" [(ngModel)]="filters.compareWith" (onChange)="fetchReport()" 
//           optionLabel="label" optionValue="value" styleClass="sm-select" [style]="{'width':'140px'}">
//         </p-select>
//       </div>

//       <button pButton label="Filters" icon="pi pi-filter" (click)="showFilters.set(true)" 
//         class="filter-btn p-button-outlined p-button-sm"></button>
      
//       <button pButton icon="pi pi-refresh" (click)="fetchReport()" 
//         class="refresh-btn p-button-text p-button-rounded"></button>
//     </div>
//   </div>

//   <div class="date-context-row">
//     <app-date-filter (dateChange)="onDateChange($event)"></app-date-filter>
//   </div>

//   @if (loading()) {
//     <div class="loading-state">
//       <div class="spinner"></div>
//       <p>Generating comprehensive analysis...</p>
//     </div>
//   } 
//   @else if (data(); as r) {
    
//     <div class="kpi-deck">
//       <div class="kpi-card">
//         <div class="kpi-head">
//           <span>Total Revenue</span>
//         </div>
//         <div class="kpi-val">{{ r.summary.financials.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
//         <div class="kpi-foot">
//           <span class="trend" [class.up]="r.comparison.growth.revenueGrowth > 0" [class.down]="r.comparison.growth.revenueGrowth < 0">
//             {{ r.comparison.growth.revenueGrowth | number:'1.0-1' }}%
//           </span>
//           <span class="context">vs {{ filters.compareWith === 'previous_period' ? 'prev. period' : 'last year' }}</span>
//         </div>
//       </div>

//       <div class="kpi-card">
//         <div class="kpi-head"><span>Gross Profit</span></div>
//         <div class="kpi-val profit">{{ r.summary.financials.grossProfit | currency:'INR':'symbol':'1.0-0' }}</div>
//         <div class="kpi-foot">
//           <span class="trend" [class.up]="r.comparison.growth.profitGrowth > 0" [class.down]="r.comparison.growth.profitGrowth < 0">
//             {{ r.comparison.growth.profitGrowth | number:'1.0-1' }}%
//           </span>
//           <span class="context">Growth</span>
//         </div>
//       </div>

//       <div class="kpi-card highlight">
//         <div class="kpi-head"><span>Profit Margin</span></div>
//         <div class="kpi-val profit-dark">{{ r.summary.financials.profitMargin }}%</div>
//         <div class="kpi-foot">
//           <span class="pill">Markup: {{ r.summary.financials.markup }}%</span>
//         </div>
//       </div>

//       <div class="kpi-card">
//         <div class="kpi-head"><span>Avg. Order Value</span></div>
//         <div class="kpi-val text-secondary">{{ r.summary.metrics.averageRevenuePerInvoice | currency:'INR':'symbol':'1.0-0' }}</div>
//         <div class="kpi-foot text-tertiary">
//           {{ r.summary.metrics.totalInvoices }} Invoices
//         </div>
//       </div>
//     </div>

//     <div class="section-card">
//       <div class="section-header">
//         <h3>Revenue & Profit Trend</h3>
//         <div class="trend-summary">
//           Best Day: <span class="summary-highlight">{{ r.trends.summary.bestDay.period | date:'mediumDate' }}</span> 
//           ({{ r.trends.summary.bestDay.profit | currency:'INR':'symbol':'1.0-0' }})
//         </div>
//       </div>
      
//       <div class="trend-chart-wrapper">
//         @for (point of r.trends.data; track point.period) {
//           <div class="trend-col">
//             <div class="col-visual">
//               <div class="bar-rev" [style.height.%]="getBarHeight(point.revenue, r.summary.financials.totalRevenue)"></div>
//               <div class="bar-prof" [style.height.%]="getBarHeight(point.profit, r.summary.financials.totalRevenue)"></div>
//             </div>
//             <div class="col-label">{{ point.period | date:(filters.groupBy === 'month' ? 'MMM yyyy' : 'dd MMM') }}</div>
            
//             <div class="col-tooltip">
//               <div>{{ point.period | date:'fullDate' }}</div>
//               <div class="tt-row"><span>Rev:</span> {{point.revenue | currency:'INR':'symbol':'1.0-0'}}</div>
//               <div class="tt-row profit"><span>Prof:</span> {{point.profit | currency:'INR':'symbol':'1.0-0'}}</div>
//               <div class="tt-row text-tertiary"><span>Mrg:</span> {{point.margin}}%</div>
//             </div>
//           </div>
//         }
//       </div>
//     </div>

//     <div class="section-card no-pad">
      
//       <p-tabs styleClass="report-tabs">
//         <p-tablist>
//           <p-tab value="0">Top Products</p-tab>
//           <p-tab value="1">Top Customers</p-tab>
//           <p-tab value="2">Categories</p-tab>
//         </p-tablist>
//         <p-tabpanels>
//           <p-tabpanel value="0" header="Top Products">
//             <p-table [value]="r.analysis.productAnalysis.topPerforming" [rows]="5" [paginator]="true" styleClass="theme-aware-table">
//               <ng-template pTemplate="header">
//                 <tr>
//                   <th>Product / SKU</th>
//                   <th class="text-right">Qty</th>
//                   <th class="text-right">Revenue</th>
//                   <th class="text-right">Net Profit</th>
//                   <th class="text-right">Margin</th>
//                 </tr>
//               </ng-template>
//               <ng-template pTemplate="body" let-p>
//                 <tr>
//                   <td>
//                     <div class="cell-primary">{{ p.productName }}</div>
//                     <div class="cell-secondary">{{ p.sku }}</div>
//                   </td>
//                   <td class="text-right">{{ p.totalQuantity }}</td>
//                   <td class="text-right">{{ p.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
//                   <td class="text-right profit fw-bold">{{ p.netProfit | currency:'INR':'symbol':'1.0-0' }}</td>
//                   <td class="text-right">
//                     <span class="badge-margin">{{ p.profitMargin }}%</span>
//                   </td>
//                 </tr>
//               </ng-template>
//             </p-table>
//           </p-tabpanel>

//           <p-tabpanel value="1" header="Top Customers">
//             <p-table [value]="r.analysis.customerAnalysis.mostProfitable" [rows]="5" [paginator]="true" styleClass="theme-aware-table">
//               <ng-template pTemplate="header">
//                 <tr>
//                   <th>Customer</th>
//                   <th class="text-right">Inv</th>
//                   <th class="text-right">Avg. Value</th>
//                   <th class="text-right">Profit</th>
//                 </tr>
//               </ng-template>
//               <ng-template pTemplate="body" let-c>
//                 <tr>
//                   <td class="cell-primary">{{ c.customerName }}</td>
//                   <td class="text-right">{{ c.totalInvoices }}</td>
//                   <td class="text-right">{{ c.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</td>
//                   <td class="text-right profit fw-bold">{{ c.totalProfit | currency:'INR':'symbol':'1.0-0' }}</td>
//                 </tr>
//               </ng-template>
//             </p-table>
//           </p-tabpanel>

//           <p-tabpanel value="2" header="Categories">
//             <p-table [value]="r.analysis.productAnalysis.byCategory" styleClass="theme-aware-table">
//               <ng-template pTemplate="header">
//                 <tr>
//                   <th>Category</th>
//                   <th class="text-right">Unique Items</th>
//                   <th class="text-right">Revenue</th>
//                   <th class="text-right">Profit</th>
//                 </tr>
//               </ng-template>
//               <ng-template pTemplate="body" let-cat>
//                 <tr>
//                   <td class="cell-primary">{{ cat.category || 'Uncategorized' }}</td>
//                   <td class="text-right">{{ cat.uniqueProducts }}</td>
//                   <td class="text-right">{{ cat.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
//                   <td class="text-right profit">{{ cat.totalProfit | currency:'INR':'symbol':'1.0-0' }}</td>
//                 </tr>
//               </ng-template>
//             </p-table>
//           </p-tabpanel>
//         </p-tabpanels>
//       </p-tabs>
//     </div>
//   }
// </div>

// <p-drawer [(visible)]="showFilters" position="right" [style]="{width: '350px'}" header="Advanced Filters">
//   <div class="filter-sidebar-content">
    
//     <div class="filter-section">
//       <label>Status</label>
//       <p-multiSelect [options]="statusOptions" [(ngModel)]="filters.status" placeholder="Select Status" 
//         styleClass="w-full theme-aware-select" appendTo="body"></p-multiSelect>
//     </div>

//     <div class="filter-section">
//       <label>Amount Range</label>
//       <div class="flex gap-2">
//         <p-inputNumber [(ngModel)]="filters.minAmount" placeholder="Min" mode="currency" currency="INR" locale="en-IN" 
//           class="w-full theme-aware-input"></p-inputNumber>
//         <p-inputNumber [(ngModel)]="filters.maxAmount" placeholder="Max" mode="currency" currency="INR" locale="en-IN" 
//           class="w-full theme-aware-input"></p-inputNumber>
//       </div>
//     </div>
    
//     <div class="filter-section">
//       <label>Product ID</label>
//       <input type="text" pInputText [(ngModel)]="filters.productId" class="w-full theme-aware-input" placeholder="Enter Product ID">
//     </div>

//     <div class="filter-section">
//       <label>Customer ID</label>
//       <input type="text" pInputText [(ngModel)]="filters.customerId" class="w-full theme-aware-input" placeholder="Enter Customer ID">
//     </div>

//     <div class="filter-section">
//       <label>Category</label>
//       <input type="text" pInputText [(ngModel)]="filters.category" class="w-full theme-aware-input" placeholder="e.g. Electronics">
//     </div>

//     <div class="filter-footer">
//       <button pButton label="Reset" class="reset-btn p-button-outlined w-full"></button>
//       <button pButton label="Apply Filters" class="apply-btn w-full" (click)="fetchReport(); showFilters.set(false)"></button>
//     </div>
//   </div>
// </p-drawer>
//   `,
//   styles: [`/* ==========================================================================
//    ADVANCED PROFIT REPORT - THEME AWARE COMPONENT
//    ========================================================================== */

// .report-container {
//   width: 100%;
//   max-width: none;
//   margin: 0;
//   padding: var(--spacing-xl);
//   box-sizing: border-box;
//   background: var(--bg-tertiary);
//   min-height: 100vh;
// }

// /* 1. Control Bar */
// .control-bar {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-md);
//   margin-bottom: var(--spacing-lg);
//   background: var(--bg-primary);
//   padding: var(--spacing-xl);
//   border-radius: var(--ui-border-radius-lg);
//   border: var(--ui-border-width) solid var(--border-primary);
//   box-shadow: var(--shadow-sm);
//   transition: var(--transition-base);

//   &:hover {
//     box-shadow: var(--shadow-md);
//   }
// }

// @media(min-width: 768px) {
//   .control-bar {
//     flex-direction: row;
//     justify-content: space-between;
//     align-items: center;
//   }
// }

// .report-title {
//   font-family: var(--font-heading);
//   font-size: var(--font-size-2xl);
//   margin: 0;
//   color: var(--text-primary);
//   font-weight: var(--font-weight-semibold);
//   line-height: var(--line-height-tight);
// }

// .filter-badge {
//   background: var(--color-info-bg);
//   color: var(--color-info);
//   font-size: var(--font-size-xs);
//   padding: var(--spacing-xs) var(--spacing-sm);
//   border-radius: var(--ui-border-radius);
//   font-weight: var(--font-weight-semibold);
//   margin-top: var(--spacing-xs);
//   display: inline-block;
//   border: 1px solid var(--color-info-border);
// }

// .bar-right {
//   display: flex;
//   gap: var(--spacing-md);
//   align-items: center;
//   flex-wrap: wrap;
// }

// .control-group {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-xs);
// }

// .control-group label {
//   font-size: var(--font-size-xs);
//   text-transform: uppercase;
//   color: var(--text-secondary);
//   font-weight: var(--font-weight-semibold);
//   letter-spacing: 0.05em;
// }

// /* Theme-aware button styles */
// .filter-btn,
// .refresh-btn,
// .reset-btn,
// .apply-btn {
//   transition: var(--transition-base) !important;
  
//   &:hover {
//     transform: translateY(-2px);
//   }

//   &:active {
//     transform: translateY(0);
//   }
// }

// .filter-btn {
//   border-color: var(--border-secondary) !important;
//   color: var(--text-secondary) !important;
  
//   &:hover {
//     border-color: var(--accent-primary) !important;
//     color: var(--accent-primary) !important;
//     background-color: var(--accent-focus) !important;
//   }
// }

// .refresh-btn {
//   color: var(--text-secondary) !important;
  
//   &:hover {
//     color: var(--accent-primary) !important;
//     background-color: var(--accent-focus) !important;
//   }
// }

// .reset-btn {
//   border-color: var(--border-secondary) !important;
//   color: var(--text-secondary) !important;
  
//   &:hover {
//     border-color: var(--color-error) !important;
//     color: var(--color-error) !important;
//     background-color: var(--color-error-bg) !important;
//   }
// }

// .apply-btn {
//   background-color: var(--accent-primary) !important;
//   border-color: var(--accent-primary) !important;
  
//   &:hover {
//     background-color: var(--accent-hover) !important;
//     border-color: var(--accent-hover) !important;
//   }
// }

// /* 2. Date Context */
// .date-context-row {
//   margin-bottom: var(--spacing-xl);
// }

// /* 3. KPI Deck */
// .kpi-deck {
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
//   gap: var(--spacing-lg);
//   margin-bottom: var(--spacing-xl);
// }

// .kpi-card {
//   background: var(--bg-primary);
//   padding: var(--spacing-xl);
//   border-radius: var(--ui-border-radius-lg);
//   border: var(--ui-border-width) solid var(--border-primary);
//   box-shadow: var(--shadow-sm);
//   display: flex;
//   flex-direction: column;
//   justify-content: space-between;
//   min-height: 140px;
//   transition: var(--transition-base);
//   position: relative;
//   overflow: hidden;

//   &::before {
//     content: '';
//     position: absolute;
//     top: 0;
//     left: 0;
//     right: 0;
//     height: 3px;
//     background: var(--border-primary);
//     transition: var(--transition-base);
//   }

//   &:hover {
//     transform: translateY(-4px);
//     box-shadow: var(--shadow-md);
//     border-color: var(--border-secondary);
    
//     &::before {
//       background: var(--accent-primary);
//     }
//   }
// }

// .kpi-card.highlight {
//   background: var(--color-success-bg);
//   border-color: var(--color-success-border);
  
//   &::before {
//     background: var(--color-success);
//   }
  
//   .pill {
//     background: var(--color-success);
//     color: white;
//   }
// }

// .kpi-head {
//   font-size: var(--font-size-xs);
//   color: var(--text-secondary);
//   font-weight: var(--font-weight-semibold);
//   text-transform: uppercase;
//   letter-spacing: 0.05em;
//   margin-bottom: var(--spacing-sm);
// }

// .kpi-val {
//   font-family: var(--font-heading);
//   font-size: var(--font-size-3xl);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
//   line-height: var(--line-height-tight);
//   margin-bottom: var(--spacing-sm);
// }

// .kpi-foot {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-sm);
//   font-size: var(--font-size-xs);
//   margin-top: auto;
//   flex-wrap: wrap;
// }

// .trend {
//   font-weight: var(--font-weight-bold);
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-xs);
  
//   &::before {
//     content: '▲';
//     font-size: 0.8em;
//     display: inline-block;
//   }
  
//   &.up {
//     color: var(--color-success);
//   }
  
//   &.down {
//     color: var(--color-error);
    
//     &::before {
//       content: '▼';
//     }
//   }
// }

// .context {
//   color: var(--text-tertiary);
// }

// .pill {
//   background: var(--color-success-bg);
//   color: var(--color-success);
//   padding: var(--spacing-xs) var(--spacing-sm);
//   border-radius: var(--ui-border-radius);
//   font-weight: var(--font-weight-semibold);
//   font-size: var(--font-size-xs);
//   border: 1px solid var(--color-success-border);
// }

// /* Color Utility Classes */
// .profit { color: var(--color-success); }
// .profit-dark { color: var(--color-success-dark); }
// .text-secondary { color: var(--text-secondary); }
// .text-tertiary { color: var(--text-tertiary); }

// /* 4. Section Card */
// .section-card {
//   background: var(--bg-primary);
//   border-radius: var(--ui-border-radius-lg);
//   border: var(--ui-border-width) solid var(--border-primary);
//   box-shadow: var(--shadow-sm);
//   margin-bottom: var(--spacing-xl);
//   padding: var(--spacing-xl);
//   width: 100%;
//   transition: var(--transition-base);
  
//   &:hover {
//     box-shadow: var(--shadow-md);
//   }
// }

// .section-card.no-pad {
//   padding: 0;
//   overflow: hidden;
// }

// .section-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: var(--spacing-xl);
//   flex-wrap: wrap;
//   gap: var(--spacing-md);
// }

// .section-header h3 {
//   margin: 0;
//   font-family: var(--font-heading);
//   font-size: var(--font-size-lg);
//   color: var(--text-primary);
//   font-weight: var(--font-weight-semibold);
// }

// .trend-summary {
//   font-size: var(--font-size-sm);
//   color: var(--text-secondary);
// }

// .summary-highlight {
//   font-weight: var(--font-weight-bold);
//   color: var(--color-primary);
// }

// /* Chart */
// .trend-chart-wrapper {
//   height: 280px;
//   display: flex;
//   align-items: flex-end;
//   justify-content: space-between;
//   gap: var(--spacing-sm);
//   padding: 0 var(--spacing-lg);
// }

// .trend-col {
//   flex: 1;
//   height: 100%;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   position: relative;
// }

// .col-visual {
//   flex: 1;
//   width: 100%;
//   position: relative;
//   display: flex;
//   align-items: flex-end;
//   justify-content: center;
// }

// .bar-rev {
//   width: 60%;
//   max-width: 40px;
//   background: var(--color-bg-revenue);
//   border-radius: var(--ui-border-radius-sm);
//   position: absolute;
//   bottom: 0;
//   transition: var(--transition-base);
// }

// .bar-prof {
//   width: 60%;
//   max-width: 40px;
//   background: var(--color-bg-profit);
//   border-radius: var(--ui-border-radius-sm);
//   position: absolute;
//   bottom: 0;
//   z-index: 2;
//   opacity: 0.9;
//   transition: var(--transition-base);
// }

// .col-label {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin-top: var(--spacing-sm);
//   white-space: nowrap;
//   overflow: hidden;
//   text-overflow: ellipsis;
//   max-width: 100%;
//   text-align: center;
// }

// .col-tooltip {
//   position: absolute;
//   top: 0;
//   background: var(--tooltip-bg);
//   color: var(--tooltip-color);
//   padding: var(--spacing-md);
//   border-radius: var(--ui-border-radius);
//   font-size: var(--font-size-xs);
//   z-index: var(--z-tooltip);
//   opacity: 0;
//   pointer-events: none;
//   transition: var(--transition-base);
//   min-width: 140px;
//   box-shadow: var(--shadow-lg);
//   backdrop-filter: blur(10px);
// }

// .trend-col:hover .col-tooltip {
//   opacity: 1;
//   transform: translateY(-10px);
// }

// .trend-col:hover .bar-rev {
//   background: var(--color-bg-revenue-hover);
// }

// .trend-col:hover .bar-prof {
//   background: var(--color-bg-profit-hover);
// }

// .tt-row {
//   display: flex;
//   justify-content: space-between;
//   margin-top: var(--spacing-xs);
// }

// /* Theme-aware Tables */
// ::ng-deep .theme-aware-table {
//   .p-datatable-wrapper {
//     border-radius: var(--ui-border-radius);
//     overflow: hidden;
//   }
  
//   .p-datatable-table {
//     background: var(--bg-secondary) !important;
//     color: var(--text-primary) !important;
//     border-color: var(--border-primary) !important;
    
//     th {
//       background: var(--bg-primary) !important;
//       color: var(--text-primary) !important;
//       border-color: var(--border-primary) !important;
//       font-weight: var(--font-weight-semibold) !important;
//       font-size: var(--font-size-sm) !important;
//       padding: var(--spacing-md) var(--spacing-lg) !important;
//     }
    
//     td {
//       background: var(--bg-secondary) !important;
//       color: var(--text-primary) !important;
//       border-color: var(--border-primary) !important;
//       padding: var(--spacing-md) var(--spacing-lg) !important;
//       font-size: var(--font-size-sm) !important;
//     }
    
//     tr {
//       transition: var(--transition-base);
      
//       &:hover {
//         background: var(--component-bg-hover) !important;
//       }
//     }
//   }
  
//   .p-paginator {
//     background: var(--bg-primary) !important;
//     border-color: var(--border-primary) !important;
//     color: var(--text-primary) !important;
    
//     .p-paginator-page,
//     .p-paginator-first,
//     .p-paginator-prev,
//     .p-paginator-next,
//     .p-paginator-last {
//       color: var(--text-secondary) !important;
      
//       &:hover {
//         background: var(--component-bg-hover) !important;
//         color: var(--text-primary) !important;
//       }
      
//       &.p-highlight {
//         background: var(--accent-primary) !important;
//         color: white !important;
//       }
//     }
//   }
// }

// /* Theme-aware Tabs */
// ::ng-deep .report-tabs {
//   .p-tabview-nav {
//     background: var(--bg-primary) !important;
//     border-bottom: var(--ui-border-width) solid var(--border-primary) !important;
//     padding: 0 var(--spacing-lg) !important;
//   }
  
//   .p-tabview-nav-link {
//     background: transparent !important;
//     border: none !important;
//     color: var(--text-secondary) !important;
//     font-weight: var(--font-weight-medium) !important;
//     font-size: var(--font-size-sm) !important;
//     padding: var(--spacing-md) var(--spacing-lg) !important;
//     transition: var(--transition-colors) !important;
    
//     &:hover {
//       color: var(--text-primary) !important;
//       background: var(--component-bg-hover) !important;
//     }
//   }
  
//   .p-tabview-selected .p-tabview-nav-link {
//     color: var(--accent-primary) !important;
//     border-bottom: var(--ui-border-width-lg) solid var(--accent-primary) !important;
//   }
  
//   .p-tabview-panels {
//     background: var(--bg-primary) !important;
//     border: none !important;
//     color: var(--text-primary) !important;
//   }
  
//   .p-tabpanel {
//     padding: var(--spacing-xl) !important;
//   }
// }

// .cell-primary {
//   font-weight: var(--font-weight-medium);
//   color: var(--text-primary);
// }

// .cell-secondary {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin-top: var(--spacing-xs);
// }

// .badge-margin {
//   background: var(--color-success-bg);
//   color: var(--color-success);
//   padding: var(--spacing-xs) var(--spacing-sm);
//   border-radius: var(--ui-border-radius);
//   font-weight: var(--font-weight-semibold);
//   font-size: var(--font-size-xs);
//   border: 1px solid var(--color-success-border);
//   display: inline-block;
// }

// /* Theme-aware Form Controls */
// ::ng-deep .theme-aware-select,
// ::ng-deep .theme-aware-input {
//   .p-multiselect,
//   .p-inputnumber,
//   .p-inputtext {
//     background: var(--bg-secondary) !important;
//     border-color: var(--border-primary) !important;
//     color: var(--text-primary) !important;
    
//     &:hover {
//       border-color: var(--border-secondary) !important;
//     }
    
//     &:focus {
//       border-color: var(--accent-primary) !important;
//       box-shadow: 0 0 0 2px var(--accent-focus) !important;
//     }
//   }
  
//   .p-multiselect-label {
//     color: var(--text-primary) !important;
//     font-size: var(--font-size-sm) !important;
//   }
  
//   .p-dropdown-panel {
//     background: var(--bg-primary) !important;
//     border-color: var(--border-primary) !important;
    
//     .p-dropdown-item {
//       color: var(--text-primary) !important;
//       font-size: var(--font-size-sm) !important;
      
//       &:hover {
//         background: var(--component-bg-hover) !important;
//       }
      
//       &.p-highlight {
//         background: var(--accent-primary) !important;
//         color: white !important;
//       }
//     }
//   }
// }

// /* Filter Sidebar */
// .filter-sidebar-content {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-lg);
//   height: 100%;
//   padding: var(--spacing-sm);
// }

// .filter-section {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-sm);
// }

// .filter-section label {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
// }

// .filter-footer {
//   margin-top: auto;
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-md);
//   padding-top: var(--spacing-lg);
//   border-top: var(--ui-border-width) solid var(--border-primary);
// }

// /* Loading State */
// .loading-state {
//   padding: var(--spacing-4xl);
//   text-align: center;
//   color: var(--text-secondary);
// }

// .spinner {
//   width: 40px;
//   height: 40px;
//   border: 3px solid var(--border-primary);
//   border-top-color: var(--accent-primary);
//   border-radius: 50%;
//   animation: spin 1s infinite cubic-bezier(0.55, 0.15, 0.45, 0.85);
//   margin: 0 auto var(--spacing-lg);
// }

// @keyframes spin {
//   to { transform: rotate(360deg); }
// }

// /* Utility Classes */
// .fw-bold { font-weight: var(--font-weight-bold); }
// .fw-medium { font-weight: var(--font-weight-medium); }
// .w-full { width: 100%; }
// .text-right { text-align: right; }
// .flex { display: flex; }
// .gap-2 { gap: var(--spacing-sm); }

// /* Responsive Adjustments */
// @media (max-width: 768px) {
//   .report-container {
//     padding: var(--spacing-lg);
//   }

//   .kpi-deck {
//     grid-template-columns: 1fr;
//     gap: var(--spacing-md);
//   }

//   .section-header {
//     flex-direction: column;
//     align-items: flex-start;
//     gap: var(--spacing-sm);
//   }

//   .trend-chart-wrapper {
//     height: 240px;
//     padding: 0 var(--spacing-md);
//     gap: var(--spacing-xs);
//   }

//   .col-label {
//     font-size: 0.6rem;
//   }

//   .bar-rev,
//   .bar-prof {
//     width: 50%;
//   }
// }

// @media (max-width: 480px) {
//   .report-container {
//     padding: var(--spacing-md);
//   }

//   .control-bar {
//     padding: var(--spacing-lg);
//   }

//   .bar-right {
//     gap: var(--spacing-sm);
//   }

//   .kpi-val {
//     font-size: var(--font-size-2xl);
//   }

//   .section-card,
//   .kpi-card {
//     padding: var(--spacing-lg);
//   }
// }

// /* Dark Theme Specific Enhancements */
// .theme-dark,
// .theme-bold,
// .theme-futuristic,
// .theme-midnight-royal,
// .theme-deep-space {
//   .kpi-card {
//     border-color: var(--border-secondary);
    
//     &:hover {
//       border-color: var(--border-tertiary);
//     }
//   }
  
//   .section-card {
//     border-color: var(--border-secondary);
//   }
  
//   .trend-chart-wrapper {
//     .bar-rev {
//       background: color-mix(in srgb, var(--color-bg-revenue) 80%, var(--bg-secondary) 20%);
//     }
    
//     .bar-prof {
//       background: color-mix(in srgb, var(--color-bg-profit) 90%, white 10%);
//     }
//   }
// }`]
// })
// export class AdvancedProfitAnalysisComponent implements OnInit {
//   private invoiceService = inject(InvoiceService);

//   // State
//   data = signal<any>(null);
//   loading = signal(false);
//   showFilters = signal(false);

//   // Filters Model
//   filters = {
//     groupBy: 'day',
//     compareWith: 'previous_period',
//     startDate: '',
//     endDate: '',
//     status: [],
//     minAmount: null,
//     maxAmount: null,
//     productId: '',
//     customerId: '',
//     category: ''
//   };

//   // Options
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

//     const payload: any = { ...this.filters };

//     if (Array.isArray(payload.status) && payload.status.length > 0) {
//       payload.status = payload.status.join(',');
//     } else {
//       delete payload.status;
//     }

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
//             this.data.set(res.data);
//           }
//         },
//         error: (err) => console.error(err)
//       });
//   }

//   resetFilters() {
//     this.filters.status = [];
//     this.filters.minAmount = null;
//     this.filters.maxAmount = null;
//     this.filters.productId = '';
//     this.filters.customerId = '';
//     this.filters.category = '';
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

//   getBarHeight(val: number, max: number): number {
//     if (!max) return 0;
//     return Math.min((val / max) * 100, 100);
//   }
// }
