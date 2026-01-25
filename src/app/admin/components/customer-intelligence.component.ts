
import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { MasterListService } from '../../core/services/master-list.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-customer-intelligence',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TooltipModule, 
    TagModule, SelectModule, DatePickerModule, ProgressSpinnerModule, AgShareGrid
  ],
  template: `
    <div class="intelligence-container">

      <div class="filter-bar">
        <div class="filter-group">
          <div class="filter-box">
            <label>Branch</label>
            <p-select [options]="masterList.branches()" optionLabel="name" optionValue="_id" 
                      [(ngModel)]="selectedBranch" (onChange)="onFilterChange()"
                      placeholder="All Branches" styleClass="dashboard-select"></p-select>
          </div>
          <!-- <div class="filter-box">
            <label>Reporting Period</label>
            <p-datepicker [(ngModel)]="dateRange" selectionMode="range" [showIcon]="true" 
                        (onSelect)="onFilterChange()" placeholder="Select Dates"
                        styleClass="dashboard-datepicker"></p-datepicker>
          </div> -->
        </div>
        <div class="header-actions">
           <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadData()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="stats-grid">
          <div class="stat-card ltv-card">
            <p class="card-label">Total Portfolio LTV</p>
            <h2 class="card-value">₹{{ (intelligenceData()?.valueAnalysis?.totalLTV || 0) | number }}</h2>
            <div class="card-footer">
              <span class="footer-metric success">
                NETWORK AVG: ₹{{ (intelligenceData()?.valueAnalysis?.avgLTV || 0) | number:'1.0-0' }}
              </span>
            </div>
          </div>

          <div class="stat-card segments-card">
            @for (segment of intelligenceData()?.segmentation; track segment._id) {
              <div class="segment-item">
                <p class="segment-value" [class.active]="segment.count > 0">
                  {{ segment.count || '0' }}
                </p>
                <p class="segment-label">{{ segment._id }}</p>
              </div>
            } @empty {
              <p class="segment-label">No acquisition data found for this period.</p>
            }
          </div>
        </div>

        <div class="content-grid">
          <div class="main-column">
            <div class="grid-card">
              <div class="grid-header">
                <h3 class="grid-title">Top Value Performers (LTV)</h3>
                <span class="grid-meta">Top {{ intelligenceData()?.valueAnalysis?.topLTV?.length || 0 }} Customers</span>
              </div>
              
              <div class="grid-container">
                 <app-ag-share-grid 
                   [columns]="ltvColumns" 
                   [data]="intelligenceData()?.valueAnalysis?.topLTV || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="side-column">
            
            <div class="side-card risk-monitor">
              <div class="side-header">
                <h4 class="side-title">Credit Risk Monitor</h4>
                <span class="flag-badge">FLAGGED: {{ intelligenceData()?.riskAnalysis?.creditRisk?.length || 0 }}</span>
              </div>
              
              <div class="risk-list">
                @for (risk of intelligenceData()?.riskAnalysis?.creditRisk; track risk._id) {
                  <div class="risk-item">
                    <div class="risk-header">
                      <p class="risk-name">{{ risk.name }}</p>
                      <i class="pi pi-exclamation-circle risk-icon"></i>
                    </div>
                    <div class="risk-details">
                      <div class="detail-row">
                        <span class="detail-label">Outstanding</span>
                        <span class="detail-value error">₹{{ risk.outstandingBalance | number }}</span>
                      </div>
                    </div>
                    <div class="risk-bar">
                       <div class="bar-fill error" style="width: 100%"></div>
                    </div>
                  </div>
                } @empty {
                   <div class="empty-state">
                      <i class="pi pi-check-circle empty-icon success"></i>
                      <p class="empty-title">All Accounts Healthy</p>
                      <p class="empty-text">No high-risk credit exposure detected.</p>
                   </div>
                }
              </div>
            </div>

            <div class="side-card strategy-card">
              <h4 class="side-title highlight">Loyalty Intelligence</h4>
              <div class="strategy-content">
                @if (intelligenceData()?.recommendations?.highValue?.length > 0) {
                   <div class="strategy-item">
                     <p class="strategy-text">
                       <i class="pi pi-bolt strategy-icon"></i>
                       <b>{{ intelligenceData()?.recommendations?.highValue[0]?.name }}</b> is currently your top contributor. Suggest a VIP membership.
                     </p>
                   </div>
                } @else {
                   <p class="strategy-text empty">Generating strategic recommendations...</p>
                }
              </div>
            </div>

            <div class="side-card">
               <h4 class="side-title mb-md">Payment Reliability</h4>
               <div class="placeholder-box">
                  <i class="pi pi-chart-line placeholder-icon"></i>
                  <p class="placeholder-text">Payment behavior scoring is processing for {{ selectedBranch || 'all branches' }}.</p>
               </div>
            </div>

          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4"></p-progressSpinner>
          <p class="loader-text">Analyzing customer lifecycle patterns...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .intelligence-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100vh; }

    .filter-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--bg-secondary); padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--ui-border-radius-lg); border: 1px solid var(--border-primary);
      margin-bottom: var(--spacing-xl);
      .filter-group { display: flex; gap: var(--spacing-lg); }
      .filter-box { display: flex; flex-direction: column; gap: 4px; label { font-size: 10px; font-weight: bold; color: var(--text-tertiary); text-transform: uppercase; } }
    }

    .stats-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
    @media(min-width: 1024px) { .stats-grid { grid-template-columns: 1fr 3fr; } }

    .stat-card, .side-card, .grid-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl); padding: var(--spacing-lg); }
    .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-label); margin-bottom: 8px; letter-spacing: 0.5px; }
    .card-value { font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin: 0; }
    
    .segments-card { display: flex; justify-content: space-around; align-items: center; }
    .segment-item { text-align: center; .segment-value { font-size: 2.2rem; font-weight: 800; color: var(--text-tertiary); margin: 0; &.active { color: var(--accent-primary); } } .segment-label { font-size: 10px; font-weight: 700; color: var(--text-label); text-transform: uppercase; } }

    .content-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
    @media(min-width: 1024px) { .content-grid { grid-template-columns: 2fr 1fr; } }

    .grid-card { padding: 0; overflow: hidden; height: 100%; min-height: 550px; display: flex; flex-direction: column; }
    .grid-header { padding: var(--spacing-md) var(--spacing-lg); background: var(--bg-ternary); border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; }
    .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; margin: 0; }
    .grid-meta { font-size: 10px; color: var(--text-tertiary); }
    .grid-container { flex: 1; position: relative; }

    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    .side-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
    .side-title { font-size: var(--font-size-sm); font-weight: 800; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .flag-badge { font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: var(--color-error-bg); color: var(--color-error); }

    .risk-item { padding: var(--spacing-md); background: var(--bg-ternary); border-radius: var(--ui-border-radius-lg); margin-bottom: 12px; .risk-header { display: flex; justify-content: space-between; margin-bottom: 8px; .risk-name { font-weight: 600; font-size: 13px; } .risk-icon { color: var(--color-error); font-size: 14px; } } .detail-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; } .risk-bar { height: 4px; background: var(--bg-primary); border-radius: 2px; overflow: hidden; .bar-fill { height: 100%; } } }

    .strategy-card { border: 1px dashed var(--accent-primary); .highlight { color: var(--accent-primary); } .strategy-text { font-size: 12px; line-height: 1.5; margin: 10px 0 0 0; } .strategy-icon { color: var(--accent-primary); margin-right: 6px; } }

    .placeholder-box { text-align: center; padding: 30px 10px; opacity: 0.5; .placeholder-icon { font-size: 1.5rem; color: var(--accent-primary); margin-bottom: 10px; } .placeholder-text { font-size: 11px; font-weight: 500; } }
    .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; .loader-text { font-size: 13px; color: var(--text-tertiary); font-weight: 500; } }
    .success { color: var(--color-success); }
  `]
})
export class CustomerIntelligenceComponent implements OnInit {
  public masterList = inject(MasterListService);
  private analyticsService = inject(AdminAnalyticsService);
  private commonService = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);
  intelligenceData = signal<any>(null);
  loading = signal<boolean>(true);
  // Filter state
  selectedBranch = '';
  dateRange: Date[] | undefined;
  ltvColumns: any[] = [];

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

  setupColumns(): void {
    this.ltvColumns = [
      {
        field: 'name', headerName: 'Customer', flex: 1, minWidth: 200,
        cellRenderer: (params: any) => `
          <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
            <span style="font-weight: 700; color: var(--text-primary);">${params.value}</span>
            <span style="font-size: 10px; color: var(--text-label); font-family: var(--font-mono);">${params.data._id}</span>
          </div>`
      },
      {
        field: 'tier', headerName: 'Tier', width: 110,
        cellRenderer: (params: any) => {
          const color = params.value === 'Platinum' ? '#a78bfa' : (params.value === 'Gold' ? '#fbbf24' : '#94a3b8');
          return `<div style="display: flex; align-items: center; height: 100%;">
                    <span style="padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase; background: ${color}22; color: ${color}; border: 1px solid ${color}44;">
                      ${params.value || 'STANDARD'}
                    </span>
                  </div>`;
        }
      },
      {
        field: 'avgOrder', headerName: 'Avg Ticket', width: 130,
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-weight': '600' }
      },
      {
        field: 'ltv', headerName: 'Lifetime Value', width: 150,
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '800', 'color': 'var(--color-success)', 'text-align': 'right', 'font-size': '14px' }
      }
    ];
  }

  onFilterChange() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    let start: string | undefined;
    let end: string | undefined;

    if (this.dateRange?.[0] && this.dateRange?.[1]) {
      start = this.dateRange[0].toISOString().split('T')[0];
      end = this.dateRange[1].toISOString().split('T')[0];
    }

    this.analyticsService.getCustomerIntelligence(this.selectedBranch).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.intelligenceData.set(res.data);
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => this.loading.set(false)
    });
  }
}

// import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { TagModule } from 'primeng/tag';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-customer-intelligence',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TooltipModule, 
//     TagModule, 
//     ProgressSpinnerModule,
//     AgShareGrid
//   ],
//   template: `
//     <div class="intelligence-container">

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="stats-grid">
          
//           <div class="stat-card ltv-card">
//             <p class="card-label">Total Network LTV</p>
//             <h2 class="card-value">₹{{ intelligenceData()?.valueAnalysis?.totalLTV | number }}</h2>
//             <div class="card-footer">
//               <span class="footer-metric success">AVG: ₹{{ intelligenceData()?.valueAnalysis?.avgLTV | number:'1.0-0' }}</span>
//             </div>
//           </div>

//           <div class="stat-card segments-card">
//             @for (segment of intelligenceData()?.segmentation | keyvalue; track segment.key) {
//               <div class="segment-item">
//                 <p class="segment-value" 
//                    [class.active]="$any(segment.value) > 0">
//                   {{ segment.value }}
//                 </p>
//                 <p class="segment-label">{{ segment.key }}</p>
//               </div>
//             }
//           </div>
//         </div>

//         <div class="content-grid">
          
//           <div class="main-column">
//             <div class="grid-card">
//               <div class="grid-header">
//                 <h3 class="grid-title">Top Value Performers (LTV)</h3>
//                 <p-button icon="pi pi-star" [text]="true" severity="warn" size="small"></p-button>
//               </div>
              
//               <div class="grid-container">
//                  <app-ag-share-grid 
//                    [columns]="ltvColumns" 
//                    [data]="intelligenceData()?.valueAnalysis?.topLTV || []" 
//                    [showActions]="false" 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>
//           </div>

//           <div class="side-column">
            
//             <div class="side-card">
//               <div class="side-header">
//                 <h4 class="side-title">Credit Risk Monitor</h4>
//                 <span class="flag-badge">FLAGGED: {{ intelligenceData()?.riskAnalysis?.creditRisk?.length || 0 }}</span>
//               </div>
              
//               <div class="risk-list">
//                 @for (risk of intelligenceData()?.riskAnalysis?.creditRisk; track risk._id) {
//                   <div class="risk-item">
//                     <div class="risk-header">
//                       <p class="risk-name">{{ risk.name }}</p>
//                       <i class="pi pi-exclamation-triangle risk-icon"></i>
//                     </div>
                    
//                     <div class="risk-details">
//                       <div class="detail-row">
//                         <span class="detail-label">Outstanding Balance</span>
//                         <span class="detail-value error">₹{{ risk.outstandingBalance | number }}</span>
//                       </div>
//                       <div class="detail-row">
//                         <span class="detail-label">Limit Restricted To</span>
//                         <span class="detail-value primary">₹{{ risk.creditLimit | number }}</span>
//                       </div>
//                     </div>

//                     <div class="risk-bar">
//                        <div class="bar-fill error" style="width: 100%"></div>
//                     </div>
//                   </div>
//                 }
                
//                 @if (!intelligenceData()?.riskAnalysis?.creditRisk?.length) {
//                    <div class="empty-state">
//                       <p class="empty-title">No High-Risk Accounts</p>
//                       <p class="empty-text">Credit portfolio is healthy.</p>
//                    </div>
//                 }
//               </div>

//               <p-button label="Freeze High Risk Accounts" severity="danger" [text]="true" size="small" styleClass="w-full mt-4" 
//                         [disabled]="!intelligenceData()?.riskAnalysis?.creditRisk?.length"></p-button>
//             </div>

//             <div class="side-card strategy-card">
//               <h4 class="side-title highlight">Loyalty Strategy</h4>
              
//               <div class="strategy-content">
//                 @if (intelligenceData()?.valueAnalysis?.topLTV?.length) {
//                    <p class="strategy-text">
//                      <i class="pi pi-info-circle strategy-icon"></i>
//                      {{ intelligenceData()?.valueAnalysis?.topLTV[0]?.name }} has a Value Score of 100. Consider offering an exclusive service plan.
//                    </p>
//                 } @else {
//                    <p class="strategy-text empty">
//                      Not enough transaction data to generate loyalty strategies yet.
//                    </p>
//                 }
//               </div>
//             </div>

//             <div class="side-card">
//                <h4 class="side-title mb-md">Payment Behavior Analysis</h4>
               
//                <div class="placeholder-content">
//                   <i class="pi pi-chart-pie placeholder-icon"></i>
//                   <span class="placeholder-title">Coming Soon</span>
//                   <p class="placeholder-text">Advanced behavioral segmentation based on payment punctuality is currently processing.</p>
//                </div>
//             </div>

//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//           <p class="loader-text">Computing behavioral patterns...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .intelligence-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* TOP STATS GRID */
//     .stats-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .stats-grid { grid-template-columns: 1fr 3fr; }
//     }

//     /* SHARED CARD STYLES */
//     .stat-card, .side-card, .grid-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//     }

//     /* LTV CARD */
//     .ltv-card {
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//     }
//     .card-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-label);
//       margin: 0 0 4px 0;
//     }
//     .card-value {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//     }
//     .card-footer {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       margin-top: var(--spacing-xs);
//     }
//     .footer-metric.success {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       color: var(--color-success);
//     }

//     /* SEGMENTS CARD */
//     .segments-card {
//       display: flex;
//       align-items: center;
//       justify-content: space-around;
//       gap: var(--spacing-md);
//       flex-wrap: wrap;
//     }

//     .segment-item { text-align: center; padding: 0 var(--spacing-md); }

//     .segment-value {
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-xl);
//       color: var(--text-tertiary);
//       margin: 0;
//     }
//     .segment-value.active { color: var(--accent-primary); }

//     .segment-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-label);
//       margin: 2px 0 0 0;
//     }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .content-grid { grid-template-columns: 2fr 1fr; }
//     }

//     /* GRID CARD (TABLE) */
//     .grid-card {
//       padding: 0; /* Reset for grid */
//       overflow: hidden;
//       height: 100%;
//       min-height: 500px;
//       display: flex;
//       flex-direction: column;
//     }

//     .grid-header {
//       padding: var(--spacing-md) var(--spacing-lg);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-ternary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .grid-title {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* SIDE COLUMN */
//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

//     .side-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-lg);
//     }

//     .side-title {
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0;
//       letter-spacing: -0.01em;
//     }
//     .side-title.highlight { color: var(--accent-primary); }
//     .side-title.mb-md { margin-bottom: var(--spacing-md); }

//     .flag-badge {
//       font-size: 10px;
//       font-weight: var(--font-weight-bold);
//       padding: 2px 6px;
//       border-radius: 4px;
//       background: var(--color-error-bg);
//       color: var(--color-error);
//     }

//     /* RISK LIST */
//     .risk-list { display: flex; flex-direction: column; gap: var(--spacing-md); }

//     .risk-item {
//       padding: var(--spacing-md);
//       background: var(--bg-ternary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       transition: background 0.2s;
//     }
//     .risk-item:hover { background: var(--component-bg-hover); }

//     .risk-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
//     .risk-name { font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; }
//     .risk-icon { font-size: var(--font-size-xs); color: var(--color-error); }

//     .risk-details { display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--spacing-md); }
//     .detail-row { display: flex; justify-content: space-between; font-size: 11px; }
//     .detail-label { color: var(--text-tertiary); }
//     .detail-value { font-weight: var(--font-weight-bold); }
//     .detail-value.error { color: var(--color-error); }
//     .detail-value.primary { color: var(--text-secondary); }

//     .risk-bar {
//       width: 100%; height: 4px;
//       background: var(--bg-primary);
//       border-radius: 99px;
//       overflow: hidden;
//     }
//     .bar-fill.error { background: var(--color-error); height: 100%; }

//     /* EMPTY STATE */
//     .empty-state {
//       padding: var(--spacing-lg);
//       text-align: center;
//       border: 1px dashed var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       opacity: 0.6;
//     }
//     .empty-title { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-primary); margin: 0 0 2px 0; }
//     .empty-text { font-size: 10px; color: var(--text-tertiary); margin: 0; }

//     /* STRATEGY CARD */
//     .strategy-card {
//       border: 1px dashed var(--accent-primary);
//       background: var(--color-primary-bg); /* Mix token */
//     }

//     .strategy-content { margin-top: var(--spacing-md); }
//     .strategy-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.5;
//       margin: 0;
//     }
//     .strategy-text.empty { font-style: italic; color: var(--text-tertiary); }
//     .strategy-icon { margin-right: var(--spacing-sm); color: var(--accent-primary); }

//     /* PLACEHOLDER CARD */
//     .placeholder-content {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       padding: var(--spacing-lg) 0;
//       opacity: 0.6;
//       text-align: center;
//     }
//     .placeholder-icon { font-size: 1.5rem; margin-bottom: var(--spacing-sm); color: var(--accent-primary); }
//     .placeholder-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-primary); }
//     .placeholder-text { font-size: 10px; margin-top: 4px; max-width: 200px; color: var(--text-secondary); }

//     /* LOADER */
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
// export class CustomerIntelligenceComponent implements OnInit {
//   intelligenceData = signal<any>(null);
//   loading = signal<boolean>(true);
//   ltvColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) { }

//   ngOnInit() {
//     this.setupColumns();
//     this.loadData();
//   }

//   setupColumns(): void {
//     // Grid Columns using CSS Variables for Theming
//     this.ltvColumns = [
//       {
//         field: 'name', 
//         headerName: 'Customer', 
//         sortable: true, 
//         flex: 1,
//         minWidth: 180,
//         cellRenderer: (params: any) => {
//           return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
//                     <span style="font-weight: 700; color: var(--text-primary);">${params.value}</span>
//                     <span style="font-size: 10px; color: var(--text-label); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${params.data.email || ''}</span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'tier', 
//         headerName: 'Tier', 
//         sortable: true, 
//         width: 100,
//         cellRenderer: (params: any) => {
//           const tier = params.value || 'Standard';
          
//           // Use CSS vars if possible, or fallbacks that match theme palette
//           // Note: Ideally, these colors should come from data or utility class
//           let styleClass = 'tier-standard';
//           let colorStyle = 'color: var(--text-secondary); background: var(--bg-ternary);';

//           if(tier === 'Platinum') colorStyle = 'color: #a78bfa; background: rgba(167, 139, 250, 0.1);';
//           else if(tier === 'Gold') colorStyle = 'color: #facc15; background: rgba(250, 204, 21, 0.1);';
          
//           return `<span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; ${colorStyle}">
//                     ${tier}
//                   </span>`;
//         }
//       },
//       {
//         field: 'transactionCount', 
//         headerName: 'Orders', 
//         sortable: true, 
//         width: 80,
//         type: 'rightAligned',
//         cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'color': 'var(--text-primary)' }
//       },
//       {
//         field: 'totalSpent', 
//         headerName: 'Total Spent', 
//         sortable: true, 
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'text-align': 'right' }
//       },
//       {
//         field: 'valueScore', 
//         headerName: 'Value Score', 
//         sortable: true, 
//         width: 130,
//         type: 'rightAligned',
//         cellRenderer: (params: any) => {
//            const val = params.value || 0;
//            return `<div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; height: 100%;">
//                     <div style="width: 60px; height: 4px; background: var(--bg-ternary); border-radius: 2px;">
//                        <div style="width: ${val}%; height: 100%; background: var(--color-success); border-radius: 2px;"></div>
//                     </div>
//                     <span style="font-size: 10px; font-family: var(--font-mono); width: 25px; text-align: right; color: var(--text-secondary);">${val.toFixed(0)}</span>
//                    </div>`;
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getCustomerIntelligence().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.intelligenceData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
