import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';


@Component({
  selector: 'app-cash-flow-analysis',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TooltipModule, 
    ProgressSpinnerModule,
    UniversalFilterComponent // <--- Imported
  ],
  template: `
    <div class="cashflow-container">
      
      <div class="filter-section">
        <app-universal-filter
          [entityType]="'cash-flow'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <div class="dashboard-content" [class.opacity-50]="loading()">
        
        <div *ngIf="loading()" class="loading-overlay">
           <p-progressSpinner styleClass="w-4rem h-4rem" strokeWidth="4"></p-progressSpinner>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <p class="kpi-label">Available Liquidity</p>
            <h2 class="kpi-value success">
              {{ commonService.formatCurrency(cashData()?.summary?.profit?.value) }}
            </h2>
            <p class="kpi-subtext">Net Cash Position</p>
          </div>

          <div class="kpi-card">
            <p class="kpi-label">Receivables (0-30d)</p>
            <h2 class="kpi-value warning">
               {{ commonService.formatCurrency(cashData()?.receivables?.aging?.[0]?.amount) }}
            </h2>
            <p class="kpi-subtext">Inbound flow pending</p>
          </div>

          <div class="kpi-card ratio-card">
            <p class="kpi-label">Cash-to-Debt Ratio</p>
            <h2 class="kpi-value">1:2.4</h2>
            <div class="progress-track">
               <div class="progress-fill" [style.width]="'40%'"></div>
            </div>
          </div>
        </div>

        <div class="analysis-grid">
          
          <div class="analysis-column main">
            <div class="content-card">
              <div class="card-header">
                <h3 class="card-title">Inbound Aging Report</h3>
                <p-button icon="pi pi-print" [text]="true" size="small" severity="secondary"></p-button>
              </div>

              <div class="aging-list">
                @for (aging of cashData()?.receivables?.aging; track aging.range) {
                  <div class="aging-item">
                    <div class="aging-info">
                      <div class="aging-icon-box">
                         <i class="pi pi-history"></i>
                      </div>
                      <div>
                        <p class="item-title">{{ aging.range }}</p>
                        <p class="item-subtitle">{{ aging.count }} Pending Invoices</p>
                      </div>
                    </div>
                    <div class="aging-value-box">
                      <p class="item-amount">{{ commonService.formatCurrency(aging.amount) }}</p>
                      <span class="status-badge high-priority">High Priority</span>
                    </div>
                  </div>
                }
                @if (!cashData()?.receivables?.aging?.length) {
                   <div class="empty-state">
                      <i class="pi pi-check-circle empty-icon"></i>
                      <p class="empty-title">All Clear</p>
                      <p class="empty-text">No overdue receivables at this time.</p>
                   </div>
                }
              </div>

              <div class="advisory-box">
                <div class="advisory-content">
                  <i class="pi pi-lightbulb advisory-icon"></i>
                  <div>
                    <p class="advisory-title">Cash Flow Advisory</p>
                    <p class="advisory-text">
                      <ng-container *ngIf="cashData()?.recommendations?.recommendations?.length > 0; else noRecs">
                        {{ cashData()?.recommendations?.recommendations[0]?.reason }}. Target action: <strong>{{ cashData()?.recommendations?.recommendations[0]?.action }}</strong>.
                      </ng-container>
                      <ng-template #noRecs>
                        Liquidity is healthy. No immediate actions required.
                      </ng-template>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="analysis-column side">
            
            <div class="content-card">
               <h3 class="card-title mb-lg">Tax Liability</h3>
               <div class="liability-list">
                 <div class="liability-row">
                   <span class="row-label">Input GST</span>
                   <span class="row-value">{{ commonService.formatCurrency(cashData()?.tax?.inputTax) }}</span>
                 </div>
                 <div class="liability-row">
                   <span class="row-label">Output GST</span>
                   <span class="row-value">{{ commonService.formatCurrency(cashData()?.tax?.outputTax) }}</span>
                 </div>
                 <div class="liability-row border-top">
                   <span class="row-label strong">Net Payable</span>
                   <span class="row-value error">{{ commonService.formatCurrency(cashData()?.tax?.netPayable) }}</span>
                 </div>
               </div>
            </div>

            <div class="content-card mt-lg">
              <h3 class="card-title mb-lg">Active Credit Exposure</h3>

              @for (emi of cashData()?.credit?.emiAnalytics; track emi._id) {
                <div class="credit-group">
                  <div class="credit-header">
                    <div>
                      <p class="mini-label">Total Outstanding</p>
                      <p class="large-value">{{ commonService.formatCurrency(emi.totalAmount) }}</p>
                    </div>
                    <div class="text-right">
                      <p class="mini-label">Active EMIs</p>
                      <p class="highlight-value">{{ emi.activeEMIs }} Plans</p>
                    </div>
                  </div>

                  <div class="repayment-box">
                    <div class="repayment-header">
                      <span class="mini-label">Repayment Health</span>
                      <span class="percent-value">{{ emi.completionRate | number:'1.0-0' }}%</span>
                    </div>
                    <div class="progress-track">
                      <div class="progress-fill success" [style.width]="emi.completionRate + '%'"></div>
                    </div>
                    <div class="repayment-footer">
                      <span>Paid: {{ emi.paidInstallments }}</span>
                      <span>Total: {{ emi.totalInstallments }}</span>
                    </div>
                  </div>

                  <div class="mini-stats-grid">
                    <div class="mini-stat">
                      <p class="mini-label">DEFAULTS</p>
                      <p class="stat-value" [class.error]="emi.defaultedEMIs > 0">{{ emi.defaultedEMIs }}</p>
                    </div>
                    <div class="mini-stat">
                      <p class="mini-label">INTEREST</p>
                      <p class="stat-value success">{{ commonService.formatCurrency(emi.totalInterestEarned) }}</p>
                    </div>
                  </div>
                </div>
              }
              
              @if (!cashData()?.credit?.emiAnalytics?.length) {
                 <div class="empty-state">
                    <i class="pi pi-wallet empty-icon"></i>
                    <p class="empty-text">No Active Credit Lines</p>
                 </div>
              }
            </div>
          </div>
        </div>

      </div> </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .cashflow-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100%; position: relative; }
    
    .filter-section { margin-bottom: var(--spacing-md); }
    .mt-lg { margin-top: var(--spacing-lg); }

    /* Loading States */
    .dashboard-content { position: relative; min-height: 400px; }
    .opacity-50 { opacity: 0.5; pointer-events: none; transition: opacity 0.2s; }
    .loading-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; }

    /* Existing Styles preserved below... */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl); }
    .kpi-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); transition: var(--transition-base); }
    .kpi-card.ratio-card { background: var(--bg-ternary); border-color: var(--border-secondary); }
    .kpi-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 4px; }
    .kpi-value { font-size: 1.75rem; font-weight: bold; color: var(--text-primary); margin: 0; }
    .kpi-value.success { color: var(--theme-success); }
    .kpi-value.warning { color: var(--theme-warning); }
    .kpi-subtext { margin-top: 4px; color: var(--text-tertiary); font-size: 11px; }
    .progress-track { width: 100%; height: 6px; background: var(--bg-ternary); border-radius: 99px; margin-top: 12px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--accent-primary); border-radius: 99px; }
    .progress-fill.success { background: var(--theme-success); }
    .analysis-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
    @media (min-width: 1024px) { .analysis-grid { grid-template-columns: 7fr 5fr; } }
    .content-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); height: 100%; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
    .card-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .card-title.mb-lg { margin-bottom: var(--spacing-lg); }
    .aging-list { display: flex; flex-direction: column; gap: 8px; }
    .aging-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); }
    .aging-info { display: flex; align-items: center; gap: 12px; }
    .aging-icon-box { width: 2.5rem; height: 2.5rem; border-radius: var(--ui-border-radius); display: flex; align-items: center; justify-content: center; background: var(--color-error-bg); color: var(--color-error); }
    .item-title { font-weight: bold; font-size: 13px; color: var(--text-primary); margin: 0; }
    .item-subtitle { font-size: 11px; color: var(--text-tertiary); margin: 0; }
    .aging-value-box { text-align: right; }
    .item-amount { font-size: 16px; font-weight: bold; color: var(--color-error); margin: 0 0 2px 0; }
    .status-badge { display: inline-block; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: var(--color-error-bg); color: var(--color-error); }
    .advisory-box { margin-top: var(--spacing-lg); padding: var(--spacing-md); border: 1px dashed var(--accent-primary); background: var(--color-primary-bg); border-radius: var(--ui-border-radius); }
    .advisory-content { display: flex; gap: 12px; }
    .advisory-icon { color: var(--accent-primary); margin-top: 2px; }
    .advisory-title { font-weight: bold; font-size: 13px; color: var(--accent-primary); margin: 0 0 4px 0; }
    .advisory-text { font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.5; }
    .liability-list { display: flex; flex-direction: column; gap: 8px; }
    .liability-row { display: flex; justify-content: space-between; align-items: center; }
    .liability-row.border-top { border-top: 1px solid var(--border-primary); padding-top: 8px; margin-top: 8px; }
    .row-label { font-size: 12px; color: var(--text-tertiary); }
    .row-label.strong { font-weight: bold; color: var(--text-secondary); }
    .row-value { font-weight: bold; color: var(--text-primary); font-size: 14px; }
    .row-value.error { color: var(--color-error); }
    .credit-group { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    .credit-header { display: flex; justify-content: space-between; align-items: flex-end; }
    .mini-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); margin: 0 0 2px 0; }
    .large-value { font-size: 1.5rem; font-weight: bold; color: var(--text-primary); margin: 0; }
    .highlight-value { font-weight: bold; color: var(--theme-info); margin: 0; }
    .repayment-box { padding: 12px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); }
    .repayment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .percent-value { font-weight: bold; font-size: 12px; color: var(--theme-success); }
    .repayment-footer { display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); }
    .mini-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mini-stat { padding: 8px; border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius); text-align: center; }
    .stat-value { font-weight: bold; color: var(--text-tertiary); margin: 0; }
    .stat-value.error { color: var(--color-error); }
    .stat-value.success { color: var(--theme-success); }
    .empty-state { padding: var(--spacing-xl); border: 1px dashed var(--border-secondary); border-radius: var(--ui-border-radius); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.7; }
    .empty-icon { font-size: 2rem; margin-bottom: var(--spacing-sm); color: var(--theme-success); }
    .empty-text, .empty-title { font-size: 13px; color: var(--text-secondary); margin: 0; }
    .empty-title { font-weight: bold; }
  `]
})
export class CashFlowAnalysisComponent implements OnInit {
  cashData = signal<any>(null);
  loading = signal<boolean>(false); // Start false, filters will trigger load

  // Active filters storage
  private currentFilters: any = {};

  // 1. CONFIGURE FILTERS
  filterConfig: FilterField[] = [
    {
      key: 'date',
      label: 'Financial Period',
      type: 'date-range'
    },
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      // Dynamic Data: Pulls from MasterListService.branches()
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    }
  ];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService
  ) {}

  ngOnInit() {
    // If Filter Component has defaults, it emits on init.
    // If not, we might want to trigger a default load here:
    // this.loadData(); 
  }

  // 2. HANDLE FILTER CHANGES
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    const params = {
      startDate: this.currentFilters.startDate,
      endDate: this.currentFilters.endDate,
      branchId: this.currentFilters.branchId
    };

    this.analyticsService.getCashFlowAnalysis(
      params.startDate, 
      params.endDate, 
      params.branchId
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.cashData.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }
}

// import { Component, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';

// @Component({
//   selector: 'app-cash-flow-analysis',
//   standalone: true,
//   imports: [CommonModule, ButtonModule, TooltipModule, ProgressSpinnerModule],
//   template: `
//     <div class="cashflow-container">
//       <ng-container *ngIf="!loading(); else loader">
//         <div class="kpi-grid">
//           <div class="kpi-card">
//             <p class="kpi-label">Available Liquidity</p>
//             <h2 class="kpi-value success">₹{{ cashData()?.summary?.profit?.value | number }}</h2>
//             <p class="kpi-subtext">Net Cash Position</p>
//           </div>

//           <div class="kpi-card">
//             <p class="kpi-label">Receivables (0-30d)</p>
//             <h2 class="kpi-value warning">₹{{ cashData()?.receivables?.aging[0]?.amount | number }}</h2>
//             <p class="kpi-subtext">Inbound flow pending</p>
//           </div>

//           <div class="kpi-card ratio-card">
//             <p class="kpi-label">Cash-to-Debt Ratio</p>
//             <h2 class="kpi-value">1:2.4</h2>
//             <div class="progress-track">
//                <div class="progress-fill" [style.width]="'40%'"></div>
//             </div>
//           </div>
//         </div>

//         <div class="analysis-grid">
          
//           <div class="analysis-column main">
//             <div class="content-card">
//               <div class="card-header">
//                 <h3 class="card-title">Inbound Aging Report</h3>
//                 <p-button icon="pi pi-print" [text]="true" size="small" severity="secondary"></p-button>
//               </div>

//               <div class="aging-list">
//                 @for (aging of cashData()?.receivables?.aging; track aging.range) {
//                   <div class="aging-item">
//                     <div class="aging-info">
//                       <div class="aging-icon-box">
//                          <i class="pi pi-history"></i>
//                       </div>
//                       <div>
//                         <p class="item-title">{{ aging.range }}</p>
//                         <p class="item-subtitle">{{ aging.count }} Pending Invoices</p>
//                       </div>
//                     </div>
//                     <div class="aging-value-box">
//                       <p class="item-amount">₹{{ aging.amount | number }}</p>
//                       <span class="status-badge high-priority">High Priority</span>
//                     </div>
//                   </div>
//                 }
//                 @if (!cashData()?.receivables?.aging?.length) {
//                    <div class="empty-state">
//                       <i class="pi pi-check-circle empty-icon"></i>
//                       <p class="empty-title">All Clear</p>
//                       <p class="empty-text">No overdue receivables at this time.</p>
//                    </div>
//                 }
//               </div>

//               <div class="advisory-box">
//                 <div class="advisory-content">
//                   <i class="pi pi-lightbulb advisory-icon"></i>
//                   <div>
//                     <p class="advisory-title">Cash Flow Advisory</p>
//                     <p class="advisory-text">
//                       <ng-container *ngIf="cashData()?.recommendations?.recommendations?.length > 0; else noRecs">
//                         {{ cashData()?.recommendations?.recommendations[0]?.reason }}. Target action: <strong>{{ cashData()?.recommendations?.recommendations[0]?.action }}</strong>.
//                       </ng-container>
//                       <ng-template #noRecs>
//                         Liquidity is healthy. No immediate actions required.
//                       </ng-template>
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="analysis-column side">
            
//             <div class="content-card">
//                <h3 class="card-title mb-lg">Tax Liability</h3>
//                <div class="liability-list">
//                  <div class="liability-row">
//                    <span class="row-label">Input GST</span>
//                    <span class="row-value">₹{{ cashData()?.tax?.inputTax | number }}</span>
//                  </div>
//                  <div class="liability-row">
//                    <span class="row-label">Output GST</span>
//                    <span class="row-value">₹{{ cashData()?.tax?.outputTax | number }}</span>
//                  </div>
//                  <div class="liability-row border-top">
//                    <span class="row-label strong">Net Payable</span>
//                    <span class="row-value error">₹{{ cashData()?.tax?.netPayable | number }}</span>
//                  </div>
//                </div>
//             </div>

//             <div class="content-card">
//               <h3 class="card-title mb-lg">Active Credit Exposure</h3>

//               @for (emi of cashData()?.credit?.emiAnalytics; track emi._id) {
//                 <div class="credit-group">
//                   <div class="credit-header">
//                     <div>
//                       <p class="mini-label">Total Outstanding</p>
//                       <p class="large-value">₹{{ emi.totalAmount | number }}</p>
//                     </div>
//                     <div class="text-right">
//                       <p class="mini-label">Active EMIs</p>
//                       <p class="highlight-value">{{ emi.activeEMIs }} Plans</p>
//                     </div>
//                   </div>

//                   <div class="repayment-box">
//                     <div class="repayment-header">
//                       <span class="mini-label">Repayment Health</span>
//                       <span class="percent-value">{{ emi.completionRate | number:'1.0-0' }}%</span>
//                     </div>
//                     <div class="progress-track">
//                       <div class="progress-fill success" [style.width]="emi.completionRate + '%'"></div>
//                     </div>
//                     <div class="repayment-footer">
//                       <span>Paid: {{ emi.paidInstallments }}</span>
//                       <span>Total: {{ emi.totalInstallments }}</span>
//                     </div>
//                   </div>

//                   <div class="mini-stats-grid">
//                     <div class="mini-stat">
//                       <p class="mini-label">DEFAULTS</p>
//                       <p class="stat-value" [class.error]="emi.defaultedEMIs > 0">{{ emi.defaultedEMIs }}</p>
//                     </div>
//                     <div class="mini-stat">
//                       <p class="mini-label">INTEREST</p>
//                       <p class="stat-value success">₹{{ emi.totalInterestEarned | number }}</p>
//                     </div>
//                   </div>
//                 </div>
//               }
              
//               @if (!cashData()?.credit?.emiAnalytics?.length) {
//                  <div class="empty-state">
//                     <i class="pi pi-wallet empty-icon"></i>
//                     <p class="empty-text">No Active Credit Lines</p>
//                  </div>
//               }
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" styleClass="w-10 h-10"></p-progressSpinner>
//           <p class="loader-text">Generating cash flow statement...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host {
//       display: block;
//       width: 100%;
//     }

//     .cashflow-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* KPI GRID */
//     .kpi-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-xl);
//     }

//     /* KPI CARDS */
//     .kpi-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//     }
    
//     .kpi-card.ratio-card {
//       background: var(--bg-ternary);
//       border-color: var(--border-secondary);
//     }

//     .kpi-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary); /* Muted label */
//       margin-bottom: var(--spacing-xs);
//     }

//     .kpi-value {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       font-family: var(--font-heading);
//       color: var(--text-primary);
//       margin: 0;
//       letter-spacing: -0.02em;
//     }

//     .kpi-value.success { color: var(--color-success); }
//     .kpi-value.warning { color: var(--color-warning); }

//     .kpi-subtext {
//       margin-top: var(--spacing-xs);
//       color: var(--text-tertiary);
//       font-size: var(--font-size-xs);
//     }

//     /* PROGRESS BARS */
//     .progress-track {
//       width: 100%;
//       height: 6px;
//       background: var(--bg-ternary);
//       border-radius: 99px;
//       margin-top: var(--spacing-md);
//       overflow: hidden;
//     }
    
//     .progress-fill {
//       height: 100%;
//       background: var(--accent-primary);
//       border-radius: 99px;
//     }
//     .progress-fill.success { background: var(--color-success); }

//     /* ANALYSIS GRID */
//     .analysis-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }

//     @media (min-width: 1024px) {
//       .analysis-grid {
//         grid-template-columns: 7fr 5fr; /* 7/12 and 5/12 ratio */
//       }
//     }

//     /* CONTENT CARDS */
//     .content-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       height: 100%;
//     }

//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-lg);
//     }

//     .card-title {
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0;
//       letter-spacing: -0.01em;
//     }
//     .card-title.mb-lg { margin-bottom: var(--spacing-lg); }

//     /* AGING LIST */
//     .aging-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//     }

//     .aging-item {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       padding: var(--spacing-md);
//       background: var(--bg-ternary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       transition: background-color 0.2s;
//     }

//     .aging-item:hover {
//       background: var(--component-bg-hover);
//     }

//     .aging-info {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//     }

//     .aging-icon-box {
//       width: 2.5rem;
//       height: 2.5rem;
//       border-radius: var(--ui-border-radius);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       background: var(--color-error-bg); /* Use mix token */
//       color: var(--color-error);
//     }

//     .item-title {
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-sm);
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .item-subtitle {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//       margin: 0;
//     }

//     .aging-value-box {
//       text-align: right;
//     }

//     .item-amount {
//       font-size: var(--font-size-lg);
//       font-weight: var(--font-weight-bold);
//       color: var(--color-error);
//       margin: 0 0 2px 0;
//     }

//     .status-badge {
//       display: inline-block;
//       font-size: 10px;
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       padding: 2px 6px;
//       border-radius: var(--ui-border-radius-sm);
//       background: var(--color-error-bg);
//       color: var(--color-error);
//     }

//     /* ADVISORY BOX */
//     .advisory-box {
//       margin-top: var(--spacing-lg);
//       padding: var(--spacing-md);
//       border: 1px dashed var(--accent-primary);
//       background: var(--color-primary-bg); /* Use mix token */
//       border-radius: var(--ui-border-radius);
//     }

//     .advisory-content {
//       display: flex;
//       gap: var(--spacing-sm);
//     }

//     .advisory-icon {
//       color: var(--accent-primary);
//       margin-top: 2px;
//     }

//     .advisory-title {
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-sm);
//       color: var(--accent-primary);
//       margin: 0 0 var(--spacing-xs) 0;
//     }

//     .advisory-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: var(--line-height-relaxed);
//       margin: 0;
//     }

//     /* LIABILITY LIST */
//     .liability-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//     }

//     .liability-row {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .liability-row.border-top {
//       border-top: 1px solid var(--border-primary);
//       padding-top: var(--spacing-sm);
//       margin-top: var(--spacing-sm);
//     }

//     .row-label {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//     }
//     .row-label.strong {
//       font-weight: var(--font-weight-bold);
//       color: var(--text-secondary);
//     }

//     .row-value {
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       font-size: var(--font-size-base);
//     }
//     .row-value.error { color: var(--color-error); }

//     /* CREDIT EXPOSURE */
//     .credit-group {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-lg);
//     }

//     .credit-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-end;
//     }

//     .mini-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin: 0 0 2px 0;
//     }

//     .large-value {
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .highlight-value {
//       font-weight: var(--font-weight-bold);
//       color: var(--color-info);
//       margin: 0;
//     }

//     /* REPAYMENT BOX */
//     .repayment-box {
//       padding: var(--spacing-md);
//       background: var(--bg-ternary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//     }

//     .repayment-header {
//       display: flex;
//       justify-content: space-between;
//       margin-bottom: var(--spacing-xs);
//     }

//     .percent-value {
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-sm);
//       color: var(--color-success);
//     }

//     .repayment-footer {
//       display: flex;
//       justify-content: space-between;
//       margin-top: var(--spacing-xs);
//       font-size: 10px;
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-tertiary);
//     }

//     /* MINI STATS */
//     .mini-stats-grid {
//       display: grid;
//       grid-template-columns: 1fr 1fr;
//       gap: var(--spacing-md);
//     }

//     .mini-stat {
//       padding: var(--spacing-sm);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius);
//       text-align: center;
//     }

//     .stat-value {
//       font-weight: var(--font-weight-bold);
//       color: var(--text-tertiary);
//       margin: 0;
//     }
//     .stat-value.error { color: var(--color-error); }
//     .stat-value.success { color: var(--color-success); }

//     /* EMPTY STATES & LOADERS */
//     .empty-state {
//       padding: var(--spacing-xl);
//       border: 1px dashed var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       opacity: 0.7;
//     }

//     .empty-icon {
//       font-size: 2rem;
//       margin-bottom: var(--spacing-sm);
//       color: var(--color-success);
//     }
    
//     .empty-text, .empty-title {
//       font-size: var(--font-size-sm);
//       color: var(--text-secondary);
//       margin: 0;
//     }
//     .empty-title { font-weight: bold; }

//     .loader-container {
//       height: 50vh;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }

//     .loader-text {
//       font-size: var(--font-size-sm);
//       color: var(--text-tertiary);
//     }
//   `]
// })
// export class CashFlowAnalysisComponent implements OnInit {
//   cashData = signal<any>(null);
//   loading = signal<boolean>(true);

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService
//   ) {}

//   ngOnInit() {
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getCashFlowAnalysis().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.cashData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
