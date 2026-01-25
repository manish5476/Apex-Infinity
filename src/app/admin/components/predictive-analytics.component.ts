import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-predictive-analytics',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    ProgressSpinnerModule, 
    TooltipModule,
    AgShareGrid,
    UniversalFilterComponent // <--- Imported
  ],
  template: `
    <div class="predictive-container">

      <div class="main-card">

        <div class="header-row">
          <div>
            <h2 class="page-title">
              <i class="pi pi-chart-line header-icon"></i>
              Predictive Intelligence 
            </h2>
            <p class="page-subtitle">
              Future-state modeling for Sales, Inventory, and Liquidity
            </p>
          </div>
          <div class="header-actions">
             <div class="confidence-badge">
               <i class="pi pi-verified"></i>
               <span>{{ (currentFilters.confidence || 0.95) * 100 }}% Confidence Level</span>
             </div>
             <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="info" (onClick)="loadData()" [loading]="loading()"></p-button>
          </div>
        </div>

        <div class="filter-section">
          <app-universal-filter
            [entityType]="'predictive-analytics'"
            [config]="filterConfig"
            (filterChange)="onFilterUpdate($event)">
          </app-universal-filter>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          
          <div class="kpi-grid">
            
            <div class="kpi-card forecast-card">
              <p class="kpi-label">Revenue Forecast</p>
              <h2 class="kpi-value">{{ commonService.formatCurrency(predictData()?.sales?.forecast[0]?.predictedRevenue) }}</h2>
              <div class="trend-badge" 
                   [ngClass]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'positive' : 'negative'">
                <i class="pi" [ngClass]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'"></i>
                <span>{{ predictData()?.sales?.forecast[0]?.growth }}% Growth</span>
              </div>
            </div>

            <div class="kpi-card cash-card">
              <p class="kpi-label">Projected Cash On Hand</p>
              <h2 class="kpi-value highlight">{{ commonService.formatCurrency(predictData()?.cashFlow?.projectedCash) }}</h2>
              <p class="kpi-sub">End-Of-Month Estimate</p>
            </div>

            <div class="kpi-card model-card">
                <p class="model-label">Model Reliability</p>
                <h3 class="model-value">{{ predictData()?.sales?.accuracy }}</h3>
                <div class="progress-track">
                   <div class="progress-fill" style="width: 85%"></div>
                </div>
            </div>
          </div>

          <div class="content-grid">
            
            <div class="projection-section">
              <div class="section-header">
                <h3 class="section-title">30-Day Liquidity Projection</h3>
                <div class="legend-row">
                  <div class="legend-item"><div class="dot positive"></div><span>INFLOW</span></div>
                  <div class="legend-item"><div class="dot negative"></div><span>OUTFLOW</span></div>
                </div>
              </div>

              <div class="grid-container">
                 <app-ag-share-grid 
                   [columns]="projectionColumns" 
                   [data]="predictData()?.cashFlow?.dailyProjections || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>

            <div class="risk-section">
              <div class="risk-card">
                <h4 class="risk-title">Stock-out Risk Engine</h4>
                
                <div class="risk-content">
                  @if (predictData()?.inventory?.predictions?.length) {
                    <div class="risk-list">
                       @for (pred of predictData()?.inventory?.predictions; track pred._id) {
                         <div class="risk-item">
                            <span class="risk-prod">{{pred.name}}</span>
                            <span class="risk-prob">High Probability</span>
                         </div>
                       }
                    </div>
                  } @else {
                    <div class="empty-state">
                       <i class="pi pi-box empty-icon"></i>
                       <p class="empty-text">No critical stock-out risks detected for the projected period.</p>
                    </div>
                  }
                </div>

                <div class="ai-box">
                    <div class="ai-icon-box"><i class="pi pi-info-circle ai-icon"></i></div>
                    <div>
                      <p class="ai-title">AI Observation</p>
                      <p class="ai-text">
                        Consistent daily net flow detected. Total projected liquidity is sufficient for planned overheads for the next {{ currentFilters.periods || 3 }} periods.
                      </p>
                    </div>
                </div>
              </div>
            </div>
          </div>

        </ng-container>

        <ng-template #loader>
          <div class="loader-container">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
            <p class="loader-text">Training Neural Networks...</p>
          </div>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .predictive-container { padding: var(--spacing-sm); font-family: var(--font-body); }
    .main-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl); padding: var(--spacing-xl); backdrop-filter: blur(10px); box-shadow: var(--shadow-lg); }

    .header-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
    .filter-section { margin-bottom: var(--spacing-xl); }

    .page-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--text-primary); display: flex; align-items: center; gap: var(--spacing-sm); margin: 0 0 4px 0; letter-spacing: -0.01em; }
    .header-icon { color: var(--accent-primary); }
    .page-subtitle { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin: 0; }
    .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

    .confidence-badge { display: flex; align-items: center; gap: var(--spacing-xs); padding: 4px 12px; border-radius: 99px; border: 1px dashed var(--accent-secondary); background: var(--accent-focus); color: var(--accent-primary); font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }

    /* KPI GRID */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
    .kpi-card { background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); transition: var(--transition-base); }
    .kpi-card:hover { border-color: var(--border-primary); transform: translateY(-2px); }
    .kpi-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin: 0 0 8px 0; }
    .kpi-value { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); color: var(--text-primary); margin: 0; line-height: 1; }
    .kpi-value.highlight { color: var(--color-success); }
    .kpi-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: var(--spacing-sm); }
    
    .trend-badge { display: inline-flex; align-items: center; gap: 4px; margin-top: var(--spacing-sm); font-weight: bold; font-size: var(--font-size-xs); }
    .trend-badge.positive { color: var(--color-success); }
    .trend-badge.negative { color: var(--color-error); }

    /* MODEL CARD */
    .model-card { background: var(--accent-gradient); border: none; color: #ffffff; display: flex; flex-direction: column; justify-content: center; }
    .model-label { font-size: var(--font-size-xs); font-weight: 900; text-transform: uppercase; opacity: 0.8; margin: 0 0 4px 0; }
    .model-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); text-transform: uppercase; font-style: italic; letter-spacing: 0.05em; margin: 0; }
    .progress-track { width: 100%; height: 4px; background: rgba(255,255,255,0.2); border-radius: 99px; margin-top: var(--spacing-md); overflow: hidden; }
    .progress-fill { height: 100%; background: #ffffff; box-shadow: 0 0 10px rgba(255,255,255,0.5); }

    /* CONTENT GRID */
    .content-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
    @media(min-width: 1024px) { .content-grid { grid-template-columns: 2fr 1fr; } }

    /* PROJECTION SECTION */
    .projection-section { border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); background: var(--bg-ternary); overflow: hidden; display: flex; flex-direction: column; height: 100%; min-height: 400px; }
    .section-header { padding: var(--spacing-md); border-bottom: 1px solid var(--border-secondary); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; }
    .section-title { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .legend-row { display: flex; gap: var(--spacing-lg); }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.positive { background: var(--color-success); }
    .dot.negative { background: var(--color-error); }
    .legend-item span { font-size: 10px; font-weight: bold; color: var(--text-tertiary); }
    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* RISK SECTION */
    .risk-section { height: 100%; }
    .risk-card { background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); height: 100%; display: flex; flex-direction: column; }
    .risk-title { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-tertiary); margin: 0 0 var(--spacing-lg) 0; }
    .risk-content { flex: 1; display: flex; flex-direction: column; }
    .risk-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: 250px; }
    .risk-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-secondary); border-radius: var(--ui-border-radius); border-left: 3px solid var(--color-error); }
    .risk-prod { font-weight: 600; font-size: 13px; color: var(--text-primary); }
    .risk-prob { font-size: 10px; color: var(--color-error); font-weight: bold; text-transform: uppercase; }

    .empty-state { text-align: center; opacity: 0.6; padding: var(--spacing-xl); }
    .empty-icon { font-size: 3rem; color: var(--text-tertiary); margin-bottom: var(--spacing-md); }
    .empty-text { font-size: var(--font-size-sm); color: var(--text-tertiary); }

    /* AI BOX */
    .ai-box { margin-top: auto; padding: var(--spacing-md); border: 1px dashed var(--accent-secondary); background: var(--accent-focus); border-radius: var(--ui-border-radius); display: flex; gap: var(--spacing-md); }
    .ai-icon-box { margin-top: 2px; }
    .ai-icon { color: var(--accent-primary); }
    .ai-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-xs); color: var(--accent-primary); margin: 0 0 4px 0; }
    .ai-text { font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.4; margin: 0; }

    /* LOADER */
    .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
    .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
  `]
})
export class PredictiveAnalyticsComponent implements OnInit {
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  predictData = signal<any>(null);
  loading = signal<boolean>(false);
  projectionColumns: any[] = [];
  
  // Stored Filters with default values matching API defaults
  public currentFilters: any = {
    periods: 3,
    confidence: 0.95
  };

  // 1. FILTER CONFIGURATION
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches', // Binds to MasterListService
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Forecast'
    },
    {
      key: 'periods',
      label: 'Forecast Horizon',
      type: 'select',
      staticOptions: [
        { label: '3 Months', value: 3 },
        { label: '6 Months', value: 6 },
        { label: '12 Months', value: 12 }
      ],
      defaultValue: 3
    },
    {
      key: 'confidence',
      label: 'Model Confidence',
      type: 'select',
      staticOptions: [
        { label: '80% (Aggressive)', value: 0.8 },
        { label: '90% (Moderate)', value: 0.9 },
        { label: '95% (Standard)', value: 0.95 },
        { label: '99% (Conservative)', value: 0.99 }
      ],
      defaultValue: 0.95
    }
  ];

  ngOnInit() {
    this.setupColumns();
    // loadData triggered by filter init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    
    // API Call with Filter Params
    const branchId = this.currentFilters.branchId;
    const periods = this.currentFilters.periods || 3;
    const confidence = this.currentFilters.confidence || 0.95;

    this.analyticsService.getPredictiveAnalytics(branchId, periods, confidence).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.predictData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns(): void {
    this.projectionColumns = [
      {
        field: 'date', 
        headerName: 'Date', 
        sortable: true, 
        width: 120,
        valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM yyyy'),
        cellStyle: { 'color': 'var(--text-primary)', 'font-weight': '700' }
      },
      {
        field: 'projectedInflow', 
        headerName: 'Projected In', 
        sortable: true, 
        flex: 1,
        type: 'rightAligned',
        valueFormatter: (params: any) => `+${this.commonService.formatCurrency(params.value)}`,
        cellStyle: { 'color': 'var(--color-success)', 'font-family': 'var(--font-mono)', 'text-align': 'right' }
      },
      {
        field: 'projectedOutflow', 
        headerName: 'Projected Out', 
        sortable: true, 
        flex: 1,
        type: 'rightAligned',
        valueFormatter: (params: any) => `-${this.commonService.formatCurrency(params.value)}`,
        cellStyle: { 'color': 'var(--color-error)', 'font-family': 'var(--font-mono)', 'text-align': 'right' }
      },
      {
        field: 'netCash', 
        headerName: 'Net Cash', 
        sortable: true, 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: (params: any) => {
           return {
             'font-weight': '900',
             'text-align': 'right',
             'color': params.value >= 0 ? 'var(--text-primary)' : 'var(--color-error)'
           };
        }
      }
    ];
    this.cdr.detectChanges();
  }
}

// import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-predictive-analytics',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     ProgressSpinnerModule, 
//     TooltipModule,
//     AgShareGrid
//   ],
//   template: `
//     <div class="predictive-container">

//       <div class="main-card">

//         <div class="header-row">
//           <div>
//             <h2 class="page-title">
//               <i class="pi pi-chart-line header-icon"></i>
//               Predictive Intelligence 
//             </h2>
//             <p class="page-subtitle">
//               Future-state modeling for Sales, Inventory, and Liquidity
//             </p>
//           </div>
//           <div class="header-actions">
//              <div class="confidence-badge">
//                <i class="pi pi-verified"></i>
//                <span>95% Confidence Level</span>
//              </div>
//              <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="info" (onClick)="loadData()" [loading]="loading()"></p-button>
//           </div>
//         </div>

//         <ng-container *ngIf="!loading(); else loader">
          
//           <div class="kpi-grid">
            
//             <div class="kpi-card forecast-card">
//               <p class="kpi-label">Revenue Forecast</p>
//               <h2 class="kpi-value">₹{{ predictData()?.sales?.forecast[0]?.predictedRevenue | number }}</h2>
//               <div class="trend-badge" 
//                    [ngClass]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'positive' : 'negative'">
//                  <i class="pi" [ngClass]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'"></i>
//                  <span>{{ predictData()?.sales?.forecast[0]?.growth }}% Growth</span>
//               </div>
//             </div>

//             <div class="kpi-card cash-card">
//               <p class="kpi-label">Projected Cash On Hand</p>
//               <h2 class="kpi-value highlight">₹{{ predictData()?.cashFlow?.projectedCash | number }}</h2>
//               <p class="kpi-sub">End-Of-Month Estimate</p>
//             </div>

//             <div class="kpi-card model-card">
//                 <p class="model-label">Model Reliability</p>
//                 <h3 class="model-value">{{ predictData()?.sales?.accuracy }}</h3>
//                 <div class="progress-track">
//                    <div class="progress-fill" style="width: 85%"></div>
//                 </div>
//             </div>
//           </div>

//           <div class="content-grid">
            
//             <div class="projection-section">
//               <div class="section-header">
//                 <h3 class="section-title">30-Day Liquidity Projection</h3>
//                 <div class="legend-row">
//                   <div class="legend-item"><div class="dot positive"></div><span>INFLOW</span></div>
//                   <div class="legend-item"><div class="dot negative"></div><span>OUTFLOW</span></div>
//                 </div>
//               </div>

//               <div class="grid-container">
//                  <app-ag-share-grid 
//                    [columns]="projectionColumns" 
//                    [data]="predictData()?.cashFlow?.dailyProjections || []" 
//                    [showActions]="false" 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>

//             <div class="risk-section">
//               <div class="risk-card">
//                 <h4 class="risk-title">Stock-out Risk Engine</h4>
                
//                 <div class="risk-content">
//                   @if (predictData()?.inventory?.predictions?.length) {
//                     <div class="risk-list">
//                        @for (pred of predictData()?.inventory?.predictions; track pred._id) {
//                          <div class="risk-item">Product: {{pred.name}}</div>
//                        }
//                     </div>
//                   } @else {
//                     <div class="empty-state">
//                        <i class="pi pi-box empty-icon"></i>
//                        <p class="empty-text">No critical stock-out risks detected for the projected period.</p>
//                     </div>
//                   }
//                 </div>

//                 <div class="ai-box">
//                     <i class="pi pi-info-circle ai-icon"></i>
//                     <div>
//                       <p class="ai-title">AI Observation</p>
//                       <p class="ai-text">
//                         Consistent daily net flow of <strong>₹2,000</strong> detected. Total projected liquidity is sufficient for planned overheads.
//                       </p>
//                     </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//         </ng-container>

//         <ng-template #loader>
//           <div class="loader-container">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//             <p class="loader-text">Training Neural Networks...</p>
//           </div>
//         </ng-template>

//       </div>
//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .predictive-container {
//       padding: var(--spacing-sm);
//       font-family: var(--font-body);
//     }

//     /* MAIN GLASS CARD */
//     .main-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-xl);
//       backdrop-filter: blur(10px);
//       box-shadow: var(--shadow-lg);
//     }

//     /* HEADER */
//     .header-row {
//       display: flex;
//       flex-wrap: wrap;
//       justify-content: space-between;
//       align-items: flex-end;
//       gap: var(--spacing-md);
//       margin-bottom: var(--spacing-xl);
//     }

//     .page-title {
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       margin: 0 0 4px 0;
//       letter-spacing: -0.01em;
//     }

//     .header-icon { color: var(--accent-primary); }

//     .page-subtitle {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//       margin: 0;
//     }

//     .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

//     .confidence-badge {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       padding: 4px 12px;
//       border-radius: 99px;
//       border: 1px dashed var(--accent-secondary);
//       background: var(--accent-focus);
//       color: var(--accent-primary);
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }

//     /* KPI GRID */
//     .kpi-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-lg);
//     }

//     /* KPI CARDS */
//     .kpi-card {
//       background: var(--bg-ternary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//     }
//     .kpi-card:hover { border-color: var(--border-primary); transform: translateY(-2px); }

//     .kpi-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//       margin: 0 0 8px 0;
//     }

//     .kpi-value {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       font-family: var(--font-heading);
//       color: var(--text-primary);
//       margin: 0;
//       line-height: 1;
//     }
//     .kpi-value.highlight { color: var(--color-success); }

//     .kpi-sub {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//       margin-top: var(--spacing-sm);
//     }

//     .trend-badge {
//       display: inline-flex;
//       align-items: center;
//       gap: 4px;
//       margin-top: var(--spacing-sm);
//       font-weight: bold;
//       font-size: var(--font-size-xs);
//     }
//     .trend-badge.positive { color: var(--color-success); }
//     .trend-badge.negative { color: var(--color-error); }

//     /* MODEL CARD (Gradient) */
//     .model-card {
//       background: var(--accent-gradient);
//       border: none;
//       color: #ffffff;
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//     }
    
//     .model-label {
//       font-size: var(--font-size-xs);
//       font-weight: 900;
//       text-transform: uppercase;
//       opacity: 0.8;
//       margin: 0 0 4px 0;
//     }

//     .model-value {
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       font-style: italic;
//       letter-spacing: 0.05em;
//       margin: 0;
//     }

//     .progress-track {
//       width: 100%;
//       height: 4px;
//       background: rgba(255,255,255,0.2);
//       border-radius: 99px;
//       margin-top: var(--spacing-md);
//       overflow: hidden;
//     }
//     .progress-fill { height: 100%; background: #ffffff; box-shadow: 0 0 10px rgba(255,255,255,0.5); }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .content-grid { grid-template-columns: 2fr 1fr; }
//     }

//     /* PROJECTION SECTION */
//     .projection-section {
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       background: var(--bg-ternary);
//       overflow: hidden;
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       min-height: 400px;
//     }

//     .section-header {
//       padding: var(--spacing-md);
//       border-bottom: 1px solid var(--border-secondary);
//       background: var(--bg-secondary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .section-title {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .legend-row { display: flex; gap: var(--spacing-lg); }
//     .legend-item { display: flex; align-items: center; gap: 6px; }
    
//     .dot { width: 8px; height: 8px; border-radius: 50%; }
//     .dot.positive { background: var(--color-success); }
//     .dot.negative { background: var(--color-error); }
    
//     .legend-item span { font-size: 10px; font-weight: bold; color: var(--text-tertiary); }

//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* RISK SECTION */
//     .risk-section { height: 100%; }

//     .risk-card {
//       background: var(--bg-ternary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//     }

//     .risk-title {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-tertiary);
//       margin: 0 0 var(--spacing-lg) 0;
//     }

//     .risk-content { flex: 1; display: flex; flex-direction: column; justify-content: center; }

//     .empty-state { text-align: center; opacity: 0.6; padding: var(--spacing-xl); }
//     .empty-icon { font-size: 3rem; color: var(--text-tertiary); margin-bottom: var(--spacing-md); }
//     .empty-text { font-size: var(--font-size-sm); color: var(--text-tertiary); }

//     /* AI BOX */
//     .ai-box {
//       margin-top: auto;
//       padding: var(--spacing-md);
//       border: 1px dashed var(--accent-secondary);
//       background: var(--accent-focus);
//       border-radius: var(--ui-border-radius);
//       display: flex;
//       gap: var(--spacing-md);
//     }

//     .ai-icon { color: var(--accent-primary); margin-top: 2px; }

//     .ai-title {
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-xs);
//       color: var(--accent-primary);
//       margin: 0 0 4px 0;
//     }

//     .ai-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.4;
//       margin: 0;
//     }

//     /* LOADER */
//     .loader-container {
//       height: 60vh;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-sm);
//       color: var(--text-tertiary);
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
//   `]
// })
// export class PredictiveAnalyticsComponent implements OnInit {
//   predictData = signal<any>(null);
//   loading = signal<boolean>(true);
//   projectionColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     this.loadData();
//   }

//   setupColumns(): void {
//     this.projectionColumns = [
//       {
//         field: 'date', 
//         headerName: 'Date', 
//         sortable: true, 
//         width: 120,
//         valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM yyyy'),
//         cellStyle: { 'color': 'var(--text-primary)', 'font-weight': '700' }
//       },
//       {
//         field: 'projectedInflow', 
//         headerName: 'Projected In', 
//         sortable: true, 
//         flex: 1,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => `+${this.commonService.formatCurrency(params.value)}`,
//         cellStyle: { 'color': 'var(--color-success)', 'font-family': 'var(--font-mono)', 'text-align': 'right' }
//       },
//       {
//         field: 'projectedOutflow', 
//         headerName: 'Projected Out', 
//         sortable: true, 
//         flex: 1,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => `-${this.commonService.formatCurrency(params.value)}`,
//         cellStyle: { 'color': 'var(--color-error)', 'font-family': 'var(--font-mono)', 'text-align': 'right' }
//       },
//       {
//         field: 'netCash', 
//         headerName: 'Net Cash', 
//         sortable: true, 
//         width: 130,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: (params: any) => {
//            return {
//              'font-weight': '900',
//              'text-align': 'right',
//              'color': params.value >= 0 ? 'var(--text-primary)' : 'var(--color-error)'
//            };
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getPredictiveAnalytics(undefined, 3, 0.95).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.predictData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
