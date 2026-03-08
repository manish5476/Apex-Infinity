import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';


@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    TooltipModule, 
    ProgressSpinnerModule, 
    AgShareGrid, 
    TagModule,
    UniversalFilterComponent // <--- Imported here
  ],
  template: `
    <div class="financial-container">
      
      <div class="header-section">
        <div class="header-content">
           <h2 class="page-title">Financial Health Center</h2>
           <p class="page-subtitle">Real-time P&L, Cash Flow, and Credit Risk Analysis</p>
        </div>
        <div class="header-actions">
           <p-button icon="pi pi-file-pdf" label="Download Report" severity="secondary" [outlined]="true" size="small"></p-button>
        </div>
      </div>

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'financial-dashboard'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="metrics-grid">
          
          <div class="metric-card profitability-card">
            <div class="card-header">
              <h3 class="card-title">Profitability Engine</h3>
              <span class="status-badge" [class.success]="(financialData()?.profitability?.marginPercent || 0) > 0">
                {{ financialData()?.profitability?.marginPercent || '0' | number:'1.1-1' }}% Margin
              </span>
            </div>
            
            <div class="stats-row">
              <div class="stat-item">
                <p class="stat-label">Total Revenue</p>
                <p class="stat-value">
                  {{ commonService.formatCurrency(financialData()?.profitability?.revenue) }}
                </p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Cost of Goods (COGS)</p>
                <p class="stat-value error">
                  {{ commonService.formatCurrency(financialData()?.profitability?.costOfGoodsSold) }}
                </p>
              </div>
              <div class="stat-item highlight">
                <p class="stat-label">Gross Profit</p>
                <p class="stat-value success">
                  {{ commonService.formatCurrency(financialData()?.profitability?.grossProfit) }}
                </p>
              </div>
            </div>

            @if (financialData()?.recommendations?.recommendations?.length > 0) {
               <div class="alert-box warning">
                 <i class="pi pi-exclamation-circle alert-icon"></i>
                 <div class="alert-content">
                   <p class="alert-title">Strategy: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
                   <p class="alert-subtitle">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
                 </div>
               </div>
            } @else {
              <div class="alert-box positive">
                <i class="pi pi-check-circle alert-icon"></i>
                <p class="alert-title">Financial health appears stable for this period.</p>
              </div>
            }
          </div>

          <div class="metric-card cashflow-card">
            <div class="card-section">
              <h3 class="card-title">Liquidity Sources</h3>
              <div class="flow-list">
                @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
                  <div class="flow-item">
                    <div class="flow-header">
                      <span class="flow-name">{{ mode.name || 'Unknown' }}</span>
                      <span class="flow-amount">{{ commonService.formatCurrency(mode.value) }}</span>
                    </div>
                    <div class="progress-track">
                       <div class="progress-fill success" 
                            [style.width]="((mode.value / (financialData()?.profitability?.revenue || 1)) * 100) + '%'"></div>
                    </div>
                  </div>
                } @empty {
                  <p class="empty-placeholder">No cash transactions found for selected criteria</p>
                }
              </div>
            </div>
            
            <div class="card-footer">
               <div class="tax-info">
                  <p class="footer-label">Estimated Tax Payable (GST)</p>
                  <p class="footer-value error">
                    {{ commonService.formatCurrency(financialData()?.tax?.netPayable) }}
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div class="details-grid">
          
          <div class="detail-card credit-card">
            <div class="card-header">
              <div class="header-icon-box"><i class="pi pi-credit-card"></i></div>
              <h3 class="card-title">Credit Portfolio Risk</h3>
            </div>

            @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
              <div class="emi-layout">
                <div class="emi-stat-box">
                  <p class="big-number">{{ commonService.formatCurrency(emi.totalPortfolio) }}</p>
                  <p class="mini-label">Total Exposure</p>
                </div>
                
                <div class="emi-details">
                  <div class="details-row">
                    <div>
                      <p class="detail-label">Portfolio Status</p>
                      <p class="detail-value capitalize">{{ emi.status }}</p>
                    </div>
                    <div class="text-right">
                      <p class="detail-label">Collection Efficiency</p>
                      <p class="detail-value success">{{ emi.collectionEfficiency }}%</p>
                    </div>
                  </div>

                  <div class="progress-section">
                    <div class="progress-header">
                      <span class="mini-label">Default Risk Rate</span>
                      <span class="progress-text">{{ (emi.defaultRate * 100) | number:'1.1-1' }}%</span>
                    </div>
                    <div class="progress-track border">
                      <div class="progress-fill gradient" [style.width]="(emi.defaultRate * 100) + '%'"></div>
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
                <div class="empty-state">
                    <i class="pi pi-verified empty-icon"></i>
                    <p class="empty-title">Clean Credit Sheet</p>
                    <p class="empty-subtitle">No active EMIs or high-risk debts found.</p>
                </div>
            }
          </div>

          <div class="side-column">
            <div class="detail-card grid-card">
               <div class="card-header small">
                  <h4 class="card-subtitle">Receivables Aging Report</h4>
               </div>
               <div class="grid-container">
                  <app-ag-share-grid [columns]="agingColumns" [data]="financialData()?.receivables?.aging || []" [showActions]="false" class="full-size-grid"></app-ag-share-grid>
               </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4"></p-progressSpinner>
          <p class="loader-text">Compiling Financial Data...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .financial-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100vh; }

    /* HEADER */
    .header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-lg); }
    .page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; }
    .page-subtitle { color: var(--text-tertiary); font-size: var(--font-size-sm); margin: 0; }

    .filter-section { margin-bottom: var(--spacing-md); }

    /* METRICS GRID (Top Row) */
    .metrics-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
    @media(min-width: 1024px) { .metrics-grid { grid-template-columns: 1.8fr 1.2fr; } }

    .metric-card, .detail-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); display: flex; flex-direction: column; }

    /* PROFITABILITY CARD */
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
    .card-title { font-size: var(--font-size-sm); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; }
    
    .status-badge { padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--bg-ternary); color: var(--text-secondary); border: 1px solid var(--border-secondary); }
    .status-badge.success { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success-border); }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
    .stat-item { padding: var(--spacing-md); border-radius: var(--ui-border-radius); border: 1px solid transparent; }
    .stat-item.highlight { background: var(--bg-ternary); border-color: var(--border-secondary); }
    
    .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; }
    .stat-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary); margin: 0; font-family: var(--font-mono); }
    .stat-value.success { color: var(--color-success); }
    .stat-value.error { color: var(--color-error); }

    /* ALERTS */
    .alert-box { padding: var(--spacing-md); border-radius: var(--ui-border-radius); display: flex; gap: var(--spacing-md); align-items: flex-start; border: 1px dashed; margin-top: auto; }
    .alert-box.warning { border-color: var(--color-warning); background: var(--color-warning-bg); .alert-icon { color: var(--color-warning); } }
    .alert-box.positive { border-color: var(--color-success); background: var(--color-success-bg); .alert-icon { color: var(--color-success); } }
    .alert-title { font-weight: bold; margin: 0 0 2px 0; font-size: 12px; }
    .alert-subtitle { font-size: 11px; margin: 0; opacity: 0.8; }

    /* CASHFLOW */
    .flow-list { display: flex; flex-direction: column; gap: var(--spacing-md); margin-top: var(--spacing-md); }
    .flow-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: var(--font-size-sm); font-weight: 600; }
    .progress-track { width: 100%; height: 6px; background: var(--bg-ternary); border-radius: 99px; overflow: hidden; }
    .progress-fill.success { background: var(--color-success); height: 100%; }

    .card-footer { margin-top: auto; padding-top: var(--spacing-lg); border-top: 1px solid var(--border-primary); }
    .footer-label { font-size: 10px; font-weight: 700; color: var(--text-tertiary); margin-bottom: 4px; text-transform: uppercase; }
    .footer-value { font-size: var(--font-size-2xl); font-weight: 800; margin: 0; font-family: var(--font-mono); }

    /* DETAILS GRID (Bottom Row) */
    .details-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
    @media(min-width: 1024px) { .details-grid { grid-template-columns: 2fr 1fr; } }

    /* CREDIT CARD */
    .emi-layout { display: grid; grid-template-columns: 1fr 2fr; gap: var(--spacing-xl); align-items: center; }
    .emi-stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid var(--border-primary); padding-right: var(--spacing-lg); }
    .big-number { font-size: 2.5rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; font-family: var(--font-mono); }
    .mini-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); margin-top: 4px; }

    .details-row { display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg); }
    .detail-value { font-size: var(--font-size-lg); font-weight: 700; margin: 0; }
    .capitalize { text-transform: capitalize; }

    .progress-section { margin-top: var(--spacing-md); }
    .progress-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .progress-text { font-size: 12px; font-weight: 700; }
    .progress-track.border { border: 1px solid var(--border-secondary); background: var(--bg-primary); height: 8px; }
    .progress-fill.gradient { background: linear-gradient(90deg, var(--color-warning), var(--color-error)); height: 100%; }

    /* GRID CARD */
    .grid-card { padding: 0; overflow: hidden; min-height: 300px; }
    .card-header.small { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); background: var(--bg-ternary); margin: 0; }
    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* UTILS */
    .empty-placeholder { font-size: var(--font-size-xs); color: var(--text-tertiary); font-style: italic; text-align: center; margin-top: 20px; }
    .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
    .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .empty-state { text-align: center; padding: 2rem; }
    .empty-icon { font-size: 2rem; color: var(--theme-success); margin-bottom: 0.5rem; }
  `]
})
export class FinancialDashboardComponent implements OnInit {
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  financialData = signal<any>(null);
  loading = signal<boolean>(false);
  agingColumns: any[] = [];
  
  private currentFilters: any = {};

  filterConfig: FilterField[] = [
    { key: 'branchId', label: 'Select Branch', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'All Branches' },
    { key: 'date', label: 'Reporting Period', type: 'date-range', placeholder: 'Select Dates' }
  ];

  ngOnInit() {
    this.setupAgingColumns();
  }

  setupAgingColumns(): void {
    this.agingColumns = [
      { field: 'range', headerName: 'Aging Period', flex: 1, cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' } },
      { field: 'amount', headerName: 'Balance', width: 120, valueFormatter: (params: any) => this.commonService.formatCurrency(params.value), cellStyle: { 'color': 'var(--color-error)', 'font-weight': 'bold', 'text-align': 'right' } }
    ];
  }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const params = {
      startDate: this.currentFilters.date?.[0]?.toISOString(),
      endDate: this.currentFilters.date?.[1]?.toISOString(),
      branchId: this.currentFilters.branchId
    };

    this.analyticsService.getFinancialDashboard(params.startDate, params.endDate, params.branchId).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.financialData.set(res.data);
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => this.loading.set(false)
    });
  }
}

// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TagModule } from 'primeng/tag';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';

// // Components
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';


// @Component({
//   selector: 'app-financial-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     FormsModule, 
//     ButtonModule, 
//     TooltipModule, 
//     ProgressSpinnerModule, 
//     AgShareGrid, 
//     TagModule,
//     UniversalFilterComponent // <--- Imported here
//   ],
//   template: `
//     <div class="financial-container">
      
//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'financial-dashboard'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="metrics-grid">
          
//           <div class="metric-card profitability-card">
//             <div class="card-header">
//               <h3 class="card-title">Profitability Engine</h3>
//               <span class="status-badge" [class.success]="(financialData()?.profitability?.marginPercent || 0) > 0">
//                 {{ financialData()?.profitability?.marginPercent || '0' | number:'1.1-1' }}% Margin
//               </span>
//             </div>
            
//             <div class="stats-row">
//               <div class="stat-item">
//                 <p class="stat-label">Total Revenue</p>
//                 <p class="stat-value">
//                   {{ commonService.formatCurrency(financialData()?.profitability?.totalRevenue) }}
//                 </p>
//               </div>
//               <div class="stat-item">
//                 <p class="stat-label">Cost of Goods (COGS)</p>
//                 <p class="stat-value error">
//                   {{ commonService.formatCurrency(financialData()?.profitability?.totalCOGS) }}
//                 </p>
//               </div>
//               <div class="stat-item highlight">
//                 <p class="stat-label">Realized Profit</p>
//                 <p class="stat-value success">
//                   {{ commonService.formatCurrency(financialData()?.profitability?.grossProfit) }}
//                 </p>
//               </div>
//             </div>

//             @if (financialData()?.recommendations?.recommendations?.length > 0) {
//                <div class="alert-box warning">
//                  <i class="pi pi-exclamation-circle alert-icon"></i>
//                  <div class="alert-content">
//                    <p class="alert-title">Strategy: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
//                    <p class="alert-subtitle">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
//                  </div>
//                </div>
//             } @else {
//               <div class="alert-box positive">
//                 <i class="pi pi-check-circle alert-icon"></i>
//                 <p class="alert-title">Financial health appears stable for this period.</p>
//               </div>
//             }
//           </div>

//           <div class="metric-card cashflow-card">
//             <div class="card-section">
//               <h3 class="card-title">Liquidity Sources</h3>
//               <div class="flow-list">
//                 @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
//                   <div class="flow-item">
//                     <div class="flow-header">
//                       <span class="flow-name">{{ mode.name || 'Unknown' }}</span>
//                       <span class="flow-amount">{{ commonService.formatCurrency(mode.value) }}</span>
//                     </div>
//                     <div class="progress-track">
//                        <div class="progress-fill success" 
//                             [style.width]="((mode.value / (financialData()?.profitability?.totalRevenue || 1)) * 100) + '%'"></div>
//                     </div>
//                   </div>
//                 } @empty {
//                   <p class="empty-placeholder">No cash transactions found for selected criteria</p>
//                 }
//               </div>
//             </div>
            
//             <div class="card-footer">
//                <div class="tax-info">
//                   <p class="footer-label">Estimated Tax Payable (GST)</p>
//                   <p class="footer-value error">
//                     {{ commonService.formatCurrency(financialData()?.tax?.netPayable) }}
//                   </p>
//                </div>
//                <p-tag severity="info" [value]="'LTV Avg: ' + commonService.formatCurrency(financialData()?.summary?.revenue?.avgTicket)"></p-tag>
//             </div>
//           </div>
//         </div>

//         <div class="details-grid">
          
//           <div class="detail-card credit-card">
//             <div class="card-header">
//               <div class="header-icon-box"><i class="pi pi-credit-card"></i></div>
//               <h3 class="card-title">Credit Portfolio Risk</h3>
//             </div>

//             @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
//               <div class="emi-layout">
//                 <div class="emi-stat-box">
//                   <p class="big-number">{{ emi.activeEMIs || '0' }}</p>
//                   <p class="mini-label">Active Plans</p>
//                 </div>
                
//                 <div class="emi-details">
//                   <div class="details-row">
//                     <div>
//                       <p class="detail-label">Total Outstanding Principal</p>
//                       <p class="detail-value">{{ commonService.formatCurrency(emi.totalAmount) }}</p>
//                     </div>
//                     <div class="text-right">
//                       <p class="detail-label">Forecasted Interest</p>
//                       <p class="detail-value success">+{{ commonService.formatCurrency(emi.totalAmount * 0.1) }}</p>
//                     </div>
//                   </div>

//                   <div class="progress-section">
//                     <div class="progress-header">
//                       <span class="mini-label">Collection Progress</span>
//                       <span class="progress-text">{{ emi.paidInstallments || 0 }} / {{ emi.totalInstallments || 0 }}</span>
//                     </div>
//                     <div class="progress-track border">
//                       <div class="progress-fill gradient" [style.width]="(emi.completionRate || 0) + '%'"></div>
//                     </div>
//                   </div>

//                   <div class="stats-footer">
//                     <div class="mini-stat">
//                       <div class="dot" [class.success]="(emi.defaultRate || 0) < 5" [class.error]="(emi.defaultRate || 0) >= 5"></div>
//                       <span>Risk: {{ emi.defaultRate || '0' | number:'1.1-1' }}%</span>
//                     </div>
//                     <div class="mini-stat">
//                       <div class="dot warning"></div>
//                       <span>Overdue: {{ emi.overdueInstallments || '0' }}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             } @empty {
//                 <div class="empty-state">
//                     <i class="pi pi-verified empty-icon"></i>
//                     <p class="empty-title">Clean Credit Sheet</p>
//                     <p class="empty-subtitle">No active EMIs or high-risk debts found.</p>
//                 </div>
//             }
//           </div>

//           <div class="side-column">
//             <div class="detail-card grid-card">
//                <div class="card-header small">
//                   <h4 class="card-subtitle">Receivables Aging Report</h4>
//                </div>
//                <div class="grid-container">
//                   <app-ag-share-grid [columns]="agingColumns" [data]="financialData()?.receivables?.aging || []" [showActions]="false" class="full-size-grid"></app-ag-share-grid>
//                </div>
//             </div>

//             <div class="detail-card behavioral-card">
//               <h4 class="card-subtitle mb-md">Payment Predictor</h4>
//               <div class="behavior-list">
//                 @for (habit of financialData()?.paymentBehavior; track habit._id) {
//                   <div class="behavior-item">
//                     <span>{{ habit.customer || 'Unnamed' }}</span>
//                     <p-tag [severity]="habit.rating === 'Excellent' ? 'success' : 'warn'" [value]="habit.avgDaysToPay + ' Days'"></p-tag>
//                   </div>
//                 } @empty {
//                   <p class="empty-placeholder">Insufficient payment history for scoring.</p>
//                 }
//               </div>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4"></p-progressSpinner>
//           <p class="loader-text">Compiling Financial Data for Shivam Electronics...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
//     .financial-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100vh; }

//     .filter-section { margin-bottom: var(--spacing-md); }

//     .metrics-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
//     @media(min-width: 1024px) { .metrics-grid { grid-template-columns: 1.8fr 1.2fr; } }

//     .metric-card, .detail-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); }

//     .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
//     .card-title { font-size: var(--font-size-sm); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; }
//     .card-subtitle { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; }
//     .mb-md { margin-bottom: var(--spacing-md); }

//     .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); }
//     .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0 0 4px 0; }
//     .stat-value { font-size: var(--font-size-2xl); font-weight: bold; color: var(--text-primary); margin: 0; }
//     .stat-value.success { color: var(--color-success); }
//     .stat-value.error { color: var(--color-error); }
//     .stat-item.highlight { background: var(--bg-ternary); padding: var(--spacing-md); border-radius: var(--ui-border-radius); }

//     .alert-box { margin-top: var(--spacing-lg); padding: var(--spacing-md); border-radius: var(--ui-border-radius); display: flex; gap: var(--spacing-md); align-items: center; border: 1px dashed; }
//     .alert-box.warning { border-color: var(--color-warning); background: var(--color-warning-bg); .alert-icon { color: var(--color-warning); } }
//     .alert-box.positive { border-color: var(--color-success); background: var(--color-success-bg); .alert-icon { color: var(--color-success); } }
//     .alert-title { font-weight: bold; margin: 0 0 2px 0; font-size: 13px; }
//     .alert-subtitle { font-size: 12px; margin: 0; }

//     .flow-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
//     .flow-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: var(--font-size-sm); font-weight: 600; }
//     .progress-track { width: 100%; height: 6px; background: var(--bg-ternary); border-radius: 99px; overflow: hidden; }
//     .progress-fill.success { background: var(--color-success); }
//     .progress-fill.gradient { background: var(--accent-gradient); transition: width 1.2s cubic-bezier(0.17, 0.67, 0.83, 0.67); }

//     .card-footer { margin-top: var(--spacing-lg); padding-top: var(--spacing-md); border-top: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: flex-end; }
//     .footer-value { font-size: var(--font-size-xl); font-weight: bold; margin: 0; }
//     .footer-label { font-size: 10px; font-weight: bold; color: var(--text-tertiary); margin-bottom: 4px; }

//     .details-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
//     @media(min-width: 1024px) { .details-grid { grid-template-columns: 2fr 1fr; } }

//     .emi-layout { display: grid; grid-template-columns: 1fr 3.5fr; gap: var(--spacing-lg); }
//     .emi-stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid var(--border-primary); }
//     .big-number { font-size: 3.5rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; }
//     .mini-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); }

//     .details-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-md); }
//     .detail-value { font-size: var(--font-size-xl); font-weight: 700; margin: 0; }
//     .detail-label { font-size: 11px; color: var(--text-tertiary); margin-bottom: 2px; }

//     .stats-footer { display: flex; gap: var(--spacing-lg); margin-top: var(--spacing-sm); }
//     .mini-stat { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-secondary); }
//     .dot { width: 8px; height: 8px; border-radius: 50%; }
//     .dot.warning { background: var(--color-warning); }
//     .dot.success { background: var(--color-success); }
//     .dot.error { background: var(--color-error); }

//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
//     .grid-card { height: 320px; display: flex; flex-direction: column; padding: 0; overflow: hidden; .grid-container { flex: 1; position: relative; } }
//     .grid-card .card-header { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); margin: 0; background: var(--bg-ternary); }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     .behavior-list { display: flex; flex-direction: column; gap: 10px; }
//     .behavior-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-primary); font-size: var(--font-size-sm); }

//     .empty-placeholder { font-size: var(--font-size-xs); color: var(--text-tertiary); font-style: italic; text-align: center; }
//     .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
//     .empty-state { text-align: center; padding: 2rem; }
//     .empty-icon { font-size: 2rem; color: var(--theme-success); margin-bottom: 0.5rem; }
//   `]
// })
// export class FinancialDashboardComponent implements OnInit {
//   public commonService = inject(CommonMethodService);
//   private analyticsService = inject(AdminAnalyticsService);
//   private cdr = inject(ChangeDetectorRef);

//   financialData = signal<any>(null);
//   loading = signal<boolean>(false);
//   agingColumns: any[] = [];
  
//   // Stored active filters
//   private currentFilters: any = {};

//   // 1. FILTER CONFIGURATION
//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Select Branch',
//       type: 'select',
//       dataSourceKey: 'branches', // Connects to MasterListService.branches()
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'All Branches'
//     },
//     {
//       key: 'date',
//       label: 'Reporting Period',
//       type: 'date-range',
//       placeholder: 'Select Dates'
//     }
//   ];

//   ngOnInit() {
//     this.setupAgingColumns();
//     // loadData is triggered via the filter component's init or manual call
//     // this.loadData(); 
//   }

//   setupAgingColumns(): void {
//     this.agingColumns = [
//       { 
//         field: 'range', 
//         headerName: 'Period', 
//         flex: 1, 
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' } 
//       },
//       { 
//         field: 'amount', 
//         headerName: 'Balance', 
//         width: 130, 
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value), 
//         cellStyle: { 'color': 'var(--color-error)', 'font-weight': 'bold', 'text-align': 'right' } 
//       }
//     ];
//   }

//   // 2. UNIVERSAL FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);

//     const params = {
//       startDate: this.currentFilters.startDate,
//       endDate: this.currentFilters.endDate,
//       branchId: this.currentFilters.branchId
//     };

//     this.analyticsService.getFinancialDashboard(
//       params.startDate, 
//       params.endDate, 
//       params.branchId
//     ).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.financialData.set(res.data);
//         }
//         this.loading.set(false);
//         this.cdr.detectChanges();
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }

// import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { SelectModule } from 'primeng/select'; // PrimeNG v18+ uses Select
// import { DatePickerModule } from 'primeng/datepicker'; // PrimeNG v18+ uses DatePicker
// import { TagModule } from 'primeng/tag';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { MasterListService } from '../../core/services/master-list.service';

// @Component({
//   selector: 'app-financial-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, ButtonModule, TooltipModule, 
//     ProgressSpinnerModule, AgShareGrid, SelectModule, DatePickerModule, TagModule
//   ],
//   template: `
//     <div class="financial-container">
      
//       <div class="filter-bar">
//         <div class="filter-group">
//           <div class="filter-box">
//             <label>Select Branch</label>
//             <p-select appendTo="body" [options]="masterList.branches()" optionLabel="name" optionValue="_id" 
//                       [(ngModel)]="selectedBranch" (onChange)="onFilterChange()"
//                       placeholder="All Branches" styleClass="dashboard-select"></p-select>
//           </div>
//           <div class="filter-box">
//             <label>Reporting Period</label>
//             <p-datepicker [(ngModel)]="dateRange" selectionMode="range" [showIcon]="true" 
//                         (onSelect)="onFilterChange()" placeholder="Select Dates"
//                         styleClass="dashboard-datepicker"></p-datepicker>
//           </div>
//         </div>
//         <div class="header-actions">
//            <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadData()"></p-button>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="metrics-grid">
//           <div class="metric-card profitability-card">
//             <div class="card-header">
//               <h3 class="card-title">Profitability Engine</h3>
//               <span class="status-badge" [class.success]="(financialData()?.profitability?.marginPercent || 0) > 0">
//                 {{ financialData()?.profitability?.marginPercent || '0' | number:'1.1-1' }}% Margin
//               </span>
//             </div>
            
//             <div class="stats-row">
//               <div class="stat-item">
//                 <p class="stat-label">Total Revenue</p>
//                 <p class="stat-value">₹{{ financialData()?.profitability?.totalRevenue || '0' | number }}</p>
//               </div>
//               <div class="stat-item">
//                 <p class="stat-label">Cost of Goods (COGS)</p>
//                 <p class="stat-value error">₹{{ financialData()?.profitability?.totalCOGS || '0' | number }}</p>
//               </div>
//               <div class="stat-item highlight">
//                 <p class="stat-label">Realized Profit</p>
//                 <p class="stat-value success">₹{{ financialData()?.profitability?.grossProfit || '0' | number }}</p>
//               </div>
//             </div>

//             @if (financialData()?.recommendations?.recommendations?.length > 0) {
//                <div class="alert-box warning">
//                  <i class="pi pi-exclamation-circle alert-icon"></i>
//                  <div class="alert-content">
//                    <p class="alert-title">Strategy: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
//                    <p class="alert-subtitle">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
//                  </div>
//                </div>
//             } @else {
//               <div class="alert-box positive">
//                 <i class="pi pi-check-circle alert-icon"></i>
//                 <p class="alert-title">Financial health appears stable for this period.</p>
//               </div>
//             }
//           </div>

//           <div class="metric-card cashflow-card">
//             <div class="card-section">
//               <h3 class="card-title">Liquidity Sources</h3>
//               <div class="flow-list">
//                 @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
//                   <div class="flow-item">
//                     <div class="flow-header">
//                       <span class="flow-name">{{ mode.name || 'Unknown' }}</span>
//                       <span class="flow-amount">₹{{ mode.value || 0 | number }}</span>
//                     </div>
//                     <div class="progress-track">
//                        <div class="progress-fill success" 
//                             [style.width]="((mode.value / (financialData()?.profitability?.totalRevenue || 1)) * 100) + '%'"></div>
//                     </div>
//                   </div>
//                 } @empty {
//                   <p class="empty-placeholder">No cash transactions found for {{ selectedBranch }}</p>
//                 }
//               </div>
//             </div>
            
//             <div class="card-footer">
//                <div class="tax-info">
//                   <p class="footer-label">Estimated Tax Payable (GST)</p>
//                   <p class="footer-value error">₹{{ financialData()?.tax?.netPayable || '0' | number }}</p>
//                </div>
//                <p-tag severity="info" [value]="'LTV Avg: ₹' + (financialData()?.summary?.revenue?.avgTicket || 0 | number)"></p-tag>
//             </div>
//           </div>
//         </div>

//         <div class="details-grid">
//           <div class="detail-card credit-card">
//             <div class="card-header">
//               <div class="header-icon-box"><i class="pi pi-credit-card"></i></div>
//               <h3 class="card-title">Credit Portfolio Risk</h3>
//             </div>

//             @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
//               <div class="emi-layout">
//                 <div class="emi-stat-box">
//                   <p class="big-number">{{ emi.activeEMIs || '0' }}</p>
//                   <p class="mini-label">Active Plans</p>
//                 </div>
                
//                 <div class="emi-details">
//                   <div class="details-row">
//                     <div>
//                       <p class="detail-label">Total Outstanding Principal</p>
//                       <p class="detail-value">₹{{ emi.totalAmount || '0' | number }}</p>
//                     </div>
//                     <div class="text-right">
//                       <p class="detail-label">Forecasted Interest</p>
//                       <p class="detail-value success">+₹{{ (emi.totalAmount * 0.1) | number }}</p>
//                     </div>
//                   </div>

//                   <div class="progress-section">
//                     <div class="progress-header">
//                       <span class="mini-label">Collection Progress</span>
//                       <span class="progress-text">{{ emi.paidInstallments || 0 }} / {{ emi.totalInstallments || 0 }}</span>
//                     </div>
//                     <div class="progress-track border">
//                       <div class="progress-fill gradient" [style.width]="(emi.completionRate || 0) + '%'"></div>
//                     </div>
//                   </div>

//                   <div class="stats-footer">
//                     <div class="mini-stat">
//                       <div class="dot" [class.success]="(emi.defaultRate || 0) < 5" [class.error]="(emi.defaultRate || 0) >= 5"></div>
//                       <span>Risk: {{ emi.defaultRate || '0' | number:'1.1-1' }}%</span>
//                     </div>
//                     <div class="mini-stat">
//                       <div class="dot warning"></div>
//                       <span>Overdue: {{ emi.overdueInstallments || '0' }}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             } @empty {
//                 <div class="empty-state">
//                     <i class="pi pi-verified empty-icon"></i>
//                     <p class="empty-title">Clean Credit Sheet</p>
//                     <p class="empty-subtitle">No active EMIs or high-risk debts found.</p>
//                 </div>
//             }
//           </div>

//           <div class="side-column">
//             <div class="detail-card grid-card">
//                <div class="card-header small">
//                   <h4 class="card-subtitle">Receivables Aging Report</h4>
//                </div>
//                <div class="grid-container">
//                   <app-ag-share-grid [columns]="agingColumns" [data]="financialData()?.receivables?.aging || []" [showActions]="false" class="full-size-grid"></app-ag-share-grid>
//                </div>
//             </div>

//             <div class="detail-card behavioral-card">
//               <h4 class="card-subtitle mb-md">Payment Predictor</h4>
//               <div class="behavior-list">
//                 @for (habit of financialData()?.paymentBehavior; track habit._id) {
//                   <div class="behavior-item">
//                     <span>{{ habit.customer || 'Unnamed' }}</span>
//                     <p-tag [severity]="habit.rating === 'Excellent' ? 'success' : 'warn'" [value]="habit.avgDaysToPay + ' Days'"></p-tag>
//                   </div>
//                 } @empty {
//                   <p class="empty-placeholder">Insufficient payment history for scoring.</p>
//                 }
//               </div>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4"></p-progressSpinner>
//           <p class="loader-text">Compiling Financial Data for Shivam Electronics...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
//     .financial-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100vh; }

//     .filter-bar {
//       display: flex; justify-content: space-between; align-items: center;
//       background: var(--bg-secondary); padding: var(--spacing-md) var(--spacing-lg);
//       border-radius: var(--ui-border-radius-lg); border: 1px solid var(--border-primary);
//       margin-bottom: var(--spacing-xl);
//       .filter-group { display: flex; gap: var(--spacing-lg); }
//       .filter-box { display: flex; flex-direction: column; gap: 4px; label { font-size: 10px; font-weight: bold; color: var(--text-tertiary); text-transform: uppercase; } }
//     }

//     .metrics-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
//     @media(min-width: 1024px) { .metrics-grid { grid-template-columns: 1.8fr 1.2fr; } }

//     .metric-card, .detail-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); }

//     .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
//     .card-title { font-size: var(--font-size-sm); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; }
//     .card-subtitle { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; }

//     .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); }
//     .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0 0 4px 0; }
//     .stat-value { font-size: var(--font-size-2xl); font-weight: bold; color: var(--text-primary); margin: 0; }
//     .stat-value.success { color: var(--color-success); }
//     .stat-value.error { color: var(--color-error); }
//     .stat-item.highlight { background: var(--bg-ternary); padding: var(--spacing-md); border-radius: var(--ui-border-radius); }

//     .alert-box { margin-top: var(--spacing-lg); padding: var(--spacing-md); border-radius: var(--ui-border-radius); display: flex; gap: var(--spacing-md); align-items: center; border: 1px dashed; }
//     .alert-box.warning { border-color: var(--color-warning); background: var(--color-warning-bg); .alert-icon { color: var(--color-warning); } }
//     .alert-box.positive { border-color: var(--color-success); background: var(--color-success-bg); .alert-icon { color: var(--color-success); } }

//     .flow-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
//     .flow-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: var(--font-size-sm); font-weight: 600; }
//     .progress-track { width: 100%; height: 6px; background: var(--bg-ternary); border-radius: 99px; overflow: hidden; }
//     .progress-fill.success { background: var(--color-success); }
//     .progress-fill.gradient { background: var(--accent-gradient); transition: width 1.2s cubic-bezier(0.17, 0.67, 0.83, 0.67); }

//     .card-footer { margin-top: var(--spacing-lg); padding-top: var(--spacing-md); border-top: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: flex-end; }
//     .footer-value { font-size: var(--font-size-xl); font-weight: bold; margin: 0; }

//     .details-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
//     @media(min-width: 1024px) { .details-grid { grid-template-columns: 2fr 1fr; } }

//     .emi-layout { display: grid; grid-template-columns: 1fr 3.5fr; gap: var(--spacing-lg); }
//     .emi-stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid var(--border-primary); }
//     .big-number { font-size: 3.5rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; }

//     .details-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-md); }
//     .detail-value { font-size: var(--font-size-xl); font-weight: 700; margin: 0; }

//     .stats-footer { display: flex; gap: var(--spacing-lg); margin-top: var(--spacing-sm); }
//     .mini-stat { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-secondary); }
//     .dot { width: 8px; height: 8px; border-radius: 50%; }
//     .dot.warning { background: var(--color-warning); }
//     .dot.success { background: var(--color-success); }
//     .dot.error { background: var(--color-error); }

//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
//     .grid-card { height: 320px; display: flex; flex-direction: column; padding: 0; overflow: hidden; .grid-container { flex: 1; position: relative; } }
    
//     .behavior-list { display: flex; flex-direction: column; gap: 10px; }
//     .behavior-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-primary); font-size: var(--font-size-sm); }

//     .empty-placeholder { font-size: var(--font-size-xs); color: var(--text-tertiary); font-style: italic; text-align: center; }
//     .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
//   `]
// })
// export class FinancialDashboardComponent implements OnInit {
//   public masterList = inject(MasterListService);
//   private analyticsService = inject(AdminAnalyticsService);
//   private commonService = inject(CommonMethodService);
//   private cdr = inject(ChangeDetectorRef);

//   financialData = signal<any>(null);
//   loading = signal<boolean>(true);
  
//   // Filter state
//   selectedBranch = '';
//   dateRange: Date[] | undefined;
//   agingColumns: any[] = [];

//   ngOnInit() {
//     this.setupAgingColumns();
//     this.loadData();
//   }

//   setupAgingColumns(): void {
//     this.agingColumns = [
//       { field: 'range', headerName: 'Period', flex: 1, cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' } },
//       { field: 'amount', headerName: 'Balance', width: 130, valueFormatter: (params: any) => this.commonService.formatCurrency(params.value), cellStyle: { 'color': 'var(--color-error)', 'font-weight': 'bold', 'text-align': 'right' } }
//     ];
//   }

//   onFilterChange() {
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     let start: string | undefined;
//     let end: string | undefined;

//     if (this.dateRange?.[0] && this.dateRange?.[1]) {
//       start = this.dateRange[0].toISOString().split('T')[0];
//       end = this.dateRange[1].toISOString().split('T')[0];
//     }

//     this.analyticsService.getFinancialDashboard(start, end, this.selectedBranch).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.financialData.set(res.data);
//         }
//         this.loading.set(false);
//         this.cdr.detectChanges();
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }

// import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-financial-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TooltipModule, 
//     ProgressSpinnerModule,
//     AgShareGrid
//   ],
//   template: `
//     <div class="financial-container">

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="metrics-grid">
          
//           <div class="metric-card profitability-card">
//             <div class="card-header">
//               <h3 class="card-title">Profitability Engine</h3>
//               <span class="status-badge success">
//                 {{ financialData()?.profitability?.marginPercent | number:'1.1-1' }}% Margin
//               </span>
//             </div>
            
//             <div class="stats-row">
//               <div class="stat-item">
//                 <p class="stat-label">Revenue</p>
//                 <p class="stat-value">₹{{ financialData()?.profitability?.totalRevenue | number }}</p>
//               </div>
//               <div class="stat-item">
//                 <p class="stat-label">Cost of Goods (COGS)</p>
//                 <p class="stat-value error">₹{{ financialData()?.profitability?.totalCOGS | number }}</p>
//               </div>
//               <div class="stat-item highlight">
//                 <p class="stat-label">Gross Profit</p>
//                 <p class="stat-value success">₹{{ financialData()?.profitability?.grossProfit | number }}</p>
//               </div>
//             </div>

//             <ng-container *ngIf="financialData()?.recommendations?.recommendations?.length > 0">
//                <div class="alert-box warning">
//                  <i class="pi pi-exclamation-circle alert-icon"></i>
//                  <div class="alert-content">
//                    <p class="alert-title">Action Required: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
//                    <p class="alert-subtitle">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
//                  </div>
//                </div>
//             </ng-container>
//           </div>

//           <div class="metric-card cashflow-card">
//             <div class="card-section">
//               <h3 class="card-title">Cash Flow Sources</h3>
              
//               <div class="flow-list">
//                 @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
//                   <div class="flow-item">
//                     <div class="flow-header">
//                       <span class="flow-name">{{ mode.name }}</span>
//                       <span class="flow-amount">₹{{ mode.value | number }}</span>
//                     </div>
//                     <div class="progress-track">
//                        <div class="progress-fill success" 
//                             [style.width]="((mode.value / (financialData()?.profitability?.totalRevenue || 1)) * 100) + '%'"></div>
//                     </div>
//                   </div>
//                 }
//                 @if (!financialData()?.cashFlow?.paymentModes?.length) {
//                   <p class="empty-text">No cash flow data recorded.</p>
//                 }
//               </div>
//             </div>
            
//             <div class="card-footer">
//                <p class="footer-label">Net Payable Tax</p>
//                <p class="footer-value error">₹{{ financialData()?.tax?.netPayable | number }}</p>
//             </div>
//           </div>
//         </div>

//         <div class="details-grid">
          
//           <div class="detail-card credit-card">
//             <div class="card-header">
//               <div class="header-icon-box">
//                 <i class="pi pi-credit-card"></i>
//               </div>
//               <h3 class="card-title">EMI Credit Monitoring</h3>
//             </div>

//             @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
//               <div class="emi-layout">
//                 <div class="emi-stat-box">
//                   <p class="big-number">{{ emi.activeEMIs }}</p>
//                   <p class="mini-label">Active EMIs</p>
//                 </div>
                
//                 <div class="emi-details">
//                   <div class="details-row">
//                     <div>
//                       <p class="detail-label">Total Credit Exposure</p>
//                       <p class="detail-value">₹{{ emi.totalAmount | number }}</p>
//                     </div>
//                     <div class="text-right">
//                       <p class="detail-label">Interest Earned</p>
//                       <p class="detail-value success">+₹{{ emi.totalInterestEarned | number }}</p>
//                     </div>
//                   </div>

//                   <div class="progress-section">
//                     <div class="progress-header">
//                       <span class="mini-label">Repayment Progress</span>
//                       <span class="progress-text">{{ emi.paidInstallments }} / {{ emi.totalInstallments }} Paid</span>
//                     </div>
//                     <div class="progress-track border">
//                       <div class="progress-fill gradient" [style.width]="emi.completionRate + '%'"></div>
//                     </div>
//                   </div>

//                   <div class="stats-footer">
//                     <div class="mini-stat">
//                       <div class="dot success"></div>
//                       <span>Default Rate: {{ emi.defaultRate | number:'1.1-1' }}%</span>
//                     </div>
//                     <div class="mini-stat">
//                       <div class="dot warning"></div>
//                       <span>Overdue: {{ emi.overdueInstallments }}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             }
//             @if (!financialData()?.credit?.emiAnalytics?.length) {
//                 <div class="empty-state">
//                     <i class="pi pi-check-circle empty-icon"></i>
//                     <p class="empty-title">No Active Credit Lines</p>
//                     <p class="empty-subtitle">There are no active EMIs or pending credit installments.</p>
//                 </div>
//             }
//           </div>

//           <div class="side-column">
            
//             <div class="detail-card grid-card">
//                <div class="card-header small">
//                   <h4 class="card-subtitle">Receivables Aging</h4>
//                </div>
               
//                <div class="grid-container">
//                   <app-ag-share-grid 
//                     [columns]="agingColumns" 
//                     [data]="financialData()?.receivables?.aging || []" 
//                     [showActions]="false" 
//                     class="full-size-grid">
//                   </app-ag-share-grid>
//                </div>
//             </div>

//             <div class="detail-card actions-card">
//               <h4 class="card-subtitle mb-md">Priority Actions</h4>
//               <div class="actions-list">
//                 @for (rec of financialData()?.recommendations?.recommendations; track rec.action) {
//                   <div class="action-item">
//                     <div class="action-header">
//                       <span class="action-tag info">{{ rec.timeframe }} Term</span>
//                       <span class="action-tag error">Impact: {{ rec.impact }}</span>
//                     </div>
//                     <p class="action-text">{{ rec.action }}</p>
//                   </div>
//                 }
//                 @if (!financialData()?.recommendations?.recommendations?.length) {
//                     <p class="empty-text center">No urgent actions required.</p>
//                 }
//               </div>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//           <p class="loader-text">Reconciling financial statements...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .financial-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* TOP METRICS GRID */
//     .metrics-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .metrics-grid { grid-template-columns: 2fr 1fr; }
//     }

//     /* SHARED CARD STYLES */
//     .metric-card, .detail-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//     }

//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-lg);
//     }
//     .card-header.small {
//       margin-bottom: 0;
//       padding-bottom: var(--spacing-md);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-ternary);
//       margin: calc(var(--spacing-lg) * -1); /* Full bleed header */
//       margin-bottom: 0;
//       padding: var(--spacing-md) var(--spacing-lg);
//     }

//     .card-title {
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-label);
//       margin: 0;
//     }

//     .card-subtitle {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin: 0;
//     }
//     .mb-md { margin-bottom: var(--spacing-md); }

//     /* PROFITABILITY CARD SPECIFIC */
//     .status-badge {
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-bold);
//       padding: 4px 12px;
//       border-radius: 99px;
//       background: var(--bg-ternary);
//     }
//     .status-badge.success { color: var(--color-success); }

//     .stats-row {
//       display: grid;
//       grid-template-columns: repeat(3, 1fr);
//       gap: var(--spacing-lg);
//     }

//     .stat-item {
//       display: flex;
//       flex-direction: column;
//     }
//     .stat-item.highlight {
//       background: var(--bg-ternary);
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//     }

//     .stat-label {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//       margin: 0 0 4px 0;
//     }

//     .stat-value {
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       font-family: var(--font-heading);
//       margin: 0;
//     }
//     .stat-value.error { color: var(--color-error); }
//     .stat-value.success { color: var(--color-success); }

//     /* ALERT BOX */
//     .alert-box {
//       margin-top: var(--spacing-lg);
//       padding: var(--spacing-md);
//       border: 1px dashed var(--color-warning);
//       border-radius: var(--ui-border-radius);
//       background: var(--color-warning-bg);
//       display: flex;
//       gap: var(--spacing-md);
//       align-items: center;
//     }
//     .alert-icon { color: var(--color-warning); font-size: 1.2rem; }
//     .alert-title { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; }
//     .alert-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }

//     /* CASH FLOW CARD */
//     .cashflow-card {
//       display: flex;
//       flex-direction: column;
//       justify-content: space-between;
//     }

//     .flow-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//     }

//     .flow-item {
//       width: 100%;
//     }

//     .flow-header {
//       display: flex;
//       justify-content: space-between;
//       margin-bottom: 4px;
//     }

//     .flow-name { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); text-transform: capitalize; }
//     .flow-amount { font-weight: bold; color: var(--color-success); font-family: var(--font-mono); }

//     .progress-track {
//       width: 100%;
//       height: 6px;
//       background: var(--bg-ternary);
//       border-radius: 99px;
//       overflow: hidden;
//     }
//     .progress-track.border { border: 1px solid var(--border-primary); height: 10px; padding: 1px; }

//     .progress-fill { height: 100%; border-radius: 99px; }
//     .progress-fill.success { background: var(--color-success); }
//     .progress-fill.gradient { background: var(--accent-gradient); transition: width 1s ease; }

//     .card-footer {
//       margin-top: var(--spacing-lg);
//       padding-top: var(--spacing-md);
//       border-top: 1px solid var(--border-primary);
//     }
//     .footer-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0 0 2px 0; }
//     .footer-value { font-size: var(--font-size-xl); font-weight: bold; color: var(--color-error); margin: 0; }

//     /* DETAILS GRID */
//     .details-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .details-grid { grid-template-columns: 2fr 1fr; }
//     }

//     /* CREDIT CARD */
//     .header-icon-box {
//       color: var(--accent-primary);
//       margin-right: var(--spacing-sm);
//     }

//     .emi-layout {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }
//     @media(min-width: 768px) {
//       .emi-layout { grid-template-columns: 1fr 3fr; }
//     }

//     .emi-stat-box {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       border-right: 1px solid var(--border-primary);
//       padding-right: var(--spacing-lg);
//     }
//     .big-number { font-size: var(--font-size-4xl); font-weight: bold; color: var(--text-primary); margin: 0; }
//     .mini-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; }

//     .emi-details { display: flex; flex-direction: column; gap: var(--spacing-md); }

//     .details-row { display: flex; justify-content: space-between; align-items: flex-end; }
//     .detail-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
//     .detail-value { font-size: var(--font-size-xl); font-weight: bold; color: var(--text-primary); margin: 0; }
//     .detail-value.success { color: var(--color-success); font-size: var(--font-size-lg); }

//     .progress-section { margin-top: var(--spacing-xs); }
//     .progress-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; color: var(--text-primary); }

//     .stats-footer { display: flex; gap: var(--spacing-xl); margin-top: var(--spacing-xs); }
//     .mini-stat { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--text-secondary); }
//     .dot { width: 8px; height: 8px; border-radius: 50%; }
//     .dot.success { background: var(--color-success); }
//     .dot.warning { background: var(--color-warning); }

//     /* SIDE COLUMN */
//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

//     .grid-card {
//       padding: 0; /* Override default padding for grid container */
//       overflow: hidden;
//       height: 300px;
//       display: flex;
//       flex-direction: column;
//     }
//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* ACTIONS CARD */
//     .actions-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    
//     .action-item {
//       padding: var(--spacing-sm);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       background: var(--bg-ternary);
//       transition: background 0.2s;
//       cursor: pointer;
//     }
//     .action-item:hover { background: var(--component-bg-hover); }

//     .action-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
//     .action-tag { font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 1px 4px; border-radius: 4px; }
//     .action-tag.info { color: var(--accent-primary); }
//     .action-tag.error { background: var(--color-error-bg); color: var(--color-error); }

//     .action-text { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-primary); margin: 0; }

//     /* EMPTY STATES & LOADER */
//     .empty-state { text-align: center; padding: var(--spacing-xl); opacity: 0.6; }
//     .empty-icon { font-size: 2rem; color: var(--color-success); margin-bottom: var(--spacing-sm); }
//     .empty-title { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; }
//     .empty-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }

//     .empty-text { font-size: var(--font-size-xs); font-style: italic; color: var(--text-tertiary); text-align: center; margin: 0; }
//     .empty-text.center { padding: var(--spacing-md); }

//     .loader-container { height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
//     .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); }
//   `]
// })
// export class FinancialDashboardComponent implements OnInit {
//   financialData = signal<any>(null);
//   loading = signal<boolean>(true);
//   agingColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupAgingColumns();
//     this.loadData();
//   }

//   setupAgingColumns(): void {
//     // Grid columns using CSS Variables for theme adaptability
//     this.agingColumns = [
//         {
//             field: 'range',
//             headerName: 'Age',
//             sortable: true,
//             flex: 1,
//             cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-size': 'var(--font-size-sm)' }
//         },
//         {
//             field: 'count',
//             headerName: 'Count',
//             sortable: true,
//             width: 80,
//             type: 'rightAligned',
//             cellStyle: { 'text-align': 'right', 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)' }
//         },
//         {
//             field: 'amount',
//             headerName: 'Value',
//             sortable: true,
//             width: 110,
//             type: 'rightAligned',
//             valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//             cellStyle: { 'font-weight': '700', 'color': 'var(--color-error)', 'text-align': 'right' }
//         }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getFinancialDashboard().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.financialData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
