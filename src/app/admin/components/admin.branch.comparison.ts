import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';

@Component({
  selector: 'app-branch-comparison',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TooltipModule, 
    ProgressBarModule, 
    ProgressSpinnerModule,
    AgShareGrid,
    UniversalFilterComponent 
  ],
  template: `
    <div class="branch-dashboard-container">
      
      <div class="filter-section">
        <app-universal-filter
          [entityType]="'branch-comparison'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <div *ngIf="loading()" class="loading-overlay">
         <p-progressSpinner styleClass="w-4rem h-4rem" strokeWidth="4"></p-progressSpinner>
      </div>

      <div class="stats-grid" [class.opacity-50]="loading()">
        
        <div class="stat-card leader-card">
          <div class="card-bg-icon"><i class="pi pi-trophy"></i></div>
          <div class="card-header">
            <p class="card-label">Market Leader</p>
            <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
          </div>
          <div class="card-footer">
            <span class="metric-value success">
              {{ commonService.formatCurrency(comparison()?.topPerformer?.revenue) }}
            </span>
            <span class="metric-label">Revenue</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <p class="card-label">Highest Basket Value</p>
            <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
          </div>
          <div class="card-footer">
            <span class="metric-value primary">
              {{ commonService.formatCurrency(comparison()?.topPerformer?.avgBasketValue) }}
            </span>
            <span class="metric-label">/ Invoice</span>
          </div>
        </div>

        <div class="stat-card summary-card">
          <div class="summary-header">
            <span class="card-label">Network Reach</span>
            <i class="pi pi-map action-icon"></i>
          </div>
          <div class="summary-content">
            <div class="summary-row">
              <span class="row-label">Total Active Branches</span>
              <span class="row-value">{{ comparison()?.total || 0 }}</span>
            </div>
            <div class="summary-row border-top">
              <span class="row-label">Total Network Revenue</span>
              <span class="row-value success">
                {{ commonService.formatCurrency(comparison()?.topPerformer?.revenue) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-card" [class.opacity-50]="loading()">
        <div class="grid-header">
          <h3 class="grid-title">Branch-wise Performance Breakdown</h3>
          <div class="grid-actions">
            <p-button icon="pi pi-download" label="Export" size="small" [text]="true" severity="secondary"></p-button>
          </div>
        </div>

        <div class="grid-container">
           <app-ag-share-grid 
             [columns]="branchColumns" 
             [data]="comparison()?.branches || []" 
             [showActions]="false" 
             class="full-size-grid">
           </app-ag-share-grid>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .branch-dashboard-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
      position: relative;
    }

    .filter-section {
      margin-bottom: var(--spacing-md);
    }

    .loading-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    .opacity-50 { opacity: 0.5; pointer-events: none; }

    /* ... [KEEP YOUR EXISTING CSS HERE: .stats-grid, .stat-card, etc.] ... */
    
    /* Just ensuring the grid fills space correctly */
    .grid-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 600px;
      margin-top: var(--spacing-lg);
    }
    
    /* (Copy the rest of your styles from the previous prompt here) */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-lg); }
    .stat-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; min-height: 160px; }
    .leader-card .card-bg-icon { position: absolute; top: -10px; right: -10px; opacity: 0.05; pointer-events: none; }
    .leader-card .card-bg-icon i { font-size: 5rem; color: var(--theme-success); }
    .card-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 4px; }
    .card-value-text { font-size: 1.5rem; font-weight: bold; color: var(--text-primary); margin: 0 0 8px 0; }
    .card-footer { display: flex; align-items: baseline; gap: 8px; }
    .metric-value { font-size: 1.75rem; font-weight: bold; }
    .metric-value.success { color: var(--theme-success); }
    .metric-value.primary { color: var(--accent-primary); }
    .metric-label { font-size: 11px; color: var(--text-tertiary); }
    .summary-card { background: var(--bg-ternary); }
    .summary-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .summary-row.border-top { border-top: 1px solid var(--border-primary); margin-top: 6px; }
    .grid-header { padding: 1rem; border-bottom: 1px solid var(--border-primary); background: var(--bg-ternary); display: flex; justify-content: space-between; align-items: center; }
    .grid-title { font-size: 14px; font-weight: bold; margin: 0; }
    .grid-container { flex: 1; background: var(--bg-secondary); }
    .full-size-grid { width: 100%; height: 100%; display: block; }
  `]
})
export class BranchComparisonComponent implements OnInit {
  // Signals
  comparison = signal<any>(null);
  loading = signal<boolean>(false); // Start false until filters init
  
  // Grid
  branchColumns: any[] = [];
  
  // Current active params
  private currentFilters: any = {};

  // 1. FILTER CONFIGURATION
  filterConfig: FilterField[] = [
    {
      key: 'date',
      label: 'Performance Period',
      type: 'date-range',
    },
    {
      key: 'groupBy',
      label: 'Sort By',
      type: 'select',
      staticOptions: [
        { label: 'Revenue', value: 'revenue' },
        { label: 'Invoice Count', value: 'invoiceCount' },
        { label: 'Avg Basket Value', value: 'avgBasketValue' }
      ],
      defaultValue: 'revenue',
      optionLabel: 'label',
      optionValue: 'value'
    },
    {
      key: 'limit',
      label: 'Show Top',
      type: 'select',
      staticOptions: [
        { label: 'Top 10', value: 10 },
        { label: 'Top 50', value: 50 },
        { label: 'Top 100', value: 100 },
        { label: 'All', value: 0 } // Handle 0 as all in backend if needed
      ],
      defaultValue: 50,
      optionLabel: 'label',
      optionValue: 'value'
    }
  ];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    // loadData is now triggered by the filter component on init
    // or you can call it manually if filter component doesn't emit on init
    this.loadData(); 
  }

  // 2. HANDLE FILTER UPDATES
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // Map the filters to API params
    const params = {
      startDate: this.currentFilters.startDate,
      endDate: this.currentFilters.endDate,
      groupBy: this.currentFilters.groupBy || 'revenue',
      limit: this.currentFilters.limit || 50
    };

    this.analyticsService.getBranchComparison(
      params.startDate, 
      params.endDate, 
      params.groupBy, 
      params.limit
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.comparison.set(res.data.comparison);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  setupColumns(): void {
    this.branchColumns = [
      {
        headerName: 'Rank',
        width: 80,
        sortable: false,
        pinned: 'left',
        cellRenderer: (params: any) => {
          const rank = (params.node.rowIndex || 0) + 1;
          const colorVar = rank === 1 ? 'var(--theme-warning)' : 'var(--text-tertiary)';
          return `<div style="display:flex; justify-content:center; align-items:center; height:100%; font-weight:700; color:${colorVar}">#${rank}</div>`;
        }
      },
      {
        field: 'branchName', 
        headerName: 'Branch Name', 
        sortable: true, 
        minWidth: 200,
        flex: 1,
        cellRenderer: (params: any) => {
          const rank = params.node.rowIndex;
          const dotColor = rank === 0 ? 'var(--theme-success)' : 'var(--theme-info)';
          const name = params.value || 'Unknown Branch';
          return `<div style="display:flex; align-items:center; gap:8px; height:100%;">
                    <div style="width:8px; height:8px; border-radius:50%; background:${dotColor};"></div>
                    <span style="font-weight:600; color:var(--text-primary);">${name}</span>
                  </div>`;
        }
      },
      {
        headerName: 'Performance', 
        width: 180,
        sortable: false,
        cellRenderer: (params: any) => {
           // Calculate relative to the top performer (row index 0) usually
           // For now, using random/placeholder logic or data if available
           const topRev = this.comparison()?.topPerformer?.revenue || 1;
           const currentRev = params.data.revenue || 0;
           const percentage = topRev > 0 ? Math.round((currentRev / topRev) * 100) : 0;
           
           return `<div style="display:flex; align-items:center; gap:12px; height:100%;">
                    <div style="flex:1; height:6px; border-radius:4px; background:var(--bg-ternary); overflow:hidden;">
                      <div style="height:100%; background:var(--accent-primary); width:${percentage}%;"></div>
                    </div>
                    <span style="font-size:11px; font-weight:700; color:var(--text-secondary); width:32px;">${percentage}%</span>
                   </div>`;
        }
      },
      {
        field: 'invoiceCount', 
        headerName: 'Invoices', 
        sortable: true, 
        width: 110,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-weight': '600', 'color': 'var(--text-secondary)' }
      },
      {
        field: 'avgBasketValue', 
        headerName: 'Avg Basket', 
        sortable: true, 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '600', 'color': 'var(--accent-primary)', 'text-align': 'right' } 
      },
      {
        field: 'revenue', 
        headerName: 'Net Revenue', 
        sortable: true, 
        width: 150,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'text-align': 'right' }
      }
    ];
    this.cdr.detectChanges();
  }
}

// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-branch-comparison',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TooltipModule, 
//     ProgressBarModule, 
//     ProgressSpinnerModule,
//     AgShareGrid
//   ],
//   template: `
//     <div class="branch-dashboard-container">
//       <div class="stats-grid">
//         <div class="stat-card leader-card">
//           <div class="card-bg-icon">
//             <i class="pi pi-trophy"></i>
//           </div>
//           <div class="card-header">
//             <p class="card-label">Market Leader</p>
//             <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
//           </div>
//           <div class="card-footer">
//             <span class="metric-value success">₹{{ comparison()?.topPerformer?.revenue | number }}</span>
//             <span class="metric-label">Revenue</span>
//           </div>
//         </div>

//         <div class="stat-card">
//           <div class="card-header">
//             <p class="card-label">Highest Basket Value</p>
//             <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
//           </div>
//           <div class="card-footer">
//             <span class="metric-value primary">₹{{ comparison()?.topPerformer?.avgBasketValue | number }}</span>
//             <span class="metric-label">/ Invoice</span>
//           </div>
//         </div>

//         <div class="stat-card summary-card">
//           <div class="summary-header">
//             <span class="card-label">Network Reach</span>
//             <i class="pi pi-map action-icon"></i>
//           </div>
//           <div class="summary-content">
//             <div class="summary-row">
//               <span class="row-label">Total Active Branches</span>
//               <span class="row-value">{{ comparison()?.total || 0 }}</span>
//             </div>
//             <div class="summary-row border-top">
//               <span class="row-label">Total Network Revenue</span>
//               <span class="row-value success">₹{{ comparison()?.topPerformer?.revenue | number }}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div class="grid-card">
//         <div class="grid-header">
//           <h3 class="grid-title">Branch-wise Performance Breakdown</h3>
//           <div class="grid-actions">
//             <p-button icon="pi pi-download" label="Export" size="small" [text]="true" severity="secondary"></p-button>
//           </div>
//         </div>

//         <div class="grid-container">
//            <app-ag-share-grid 
//              [columns]="branchColumns" 
//              [data]="comparison()?.branches || []" 
//              [showActions]="false" 
//              class="full-size-grid">
//            </app-ag-share-grid>
//         </div>
//       </div>

//     </div>
//   `,
//   styles: [`
//     /* HOST LAYOUT */
//     :host {
//       display: block;
//       width: 100%;
//     }

//     .branch-dashboard-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* STATS GRID LAYOUT */
//     .stats-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-xl);
//     }

//     /* SHARED CARD STYLES */
//     .stat-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       position: relative;
//       overflow: hidden;
//       display: flex;
//       flex-direction: column;
//       justify-content: space-between;
//       transition: var(--transition-base);
//     }

//     .stat-card:hover {
//       border-color: var(--border-secondary);
//       box-shadow: var(--shadow-sm);
//     }

//     /* TYPOGRAPHY */
//     .card-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//       margin-bottom: var(--spacing-xs);
//     }

//     .card-value-text {
//       font-size: var(--font-size-lg);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-sm) 0;
//     }

//     .card-footer {
//       display: flex;
//       align-items: baseline;
//       gap: var(--spacing-sm);
//     }

//     .metric-value {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       font-family: var(--font-heading); /* often nicer for numbers */
//       letter-spacing: -0.02em;
//     }

//     .metric-value.success { color: var(--theme-success); }
//     .metric-value.primary { color: var(--accent-primary); }

//     .metric-label {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//     }

//     /* LEADER CARD SPECIFIC */
//     .leader-card .card-bg-icon {
//       position: absolute;
//       top: -10px;
//       right: -10px;
//       opacity: 0.05;
//       pointer-events: none;
//     }

//     .leader-card .card-bg-icon i {
//       font-size: 5rem;
//       color: var(--theme-success);
//     }

//     /* SUMMARY CARD SPECIFIC */
//     .stat-card.summary-card {
//       background: var(--bg-ternary); /* Slightly distinct bg */
//       border-color: var(--border-secondary);
//     }

//     .summary-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-md);
//     }
    
//     .action-icon {
//       color: var(--text-secondary);
//     }

//     .summary-content {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//     }

//     .summary-row {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       font-size: var(--font-size-sm);
//     }

//     .summary-row.border-top {
//       border-top: 1px solid var(--border-primary);
//       padding-top: var(--spacing-sm);
//     }

//     .row-label { color: var(--text-secondary); }
//     .row-value { font-weight: var(--font-weight-bold); color: var(--text-primary); }
//     .row-value.success { color: var(--theme-success); }

//     /* DATA GRID CONTAINER */
//     .grid-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       overflow: hidden;
//       display: flex;
//       flex-direction: column;
//       height: 600px; /* Fixed height for table scrolling */
//     }

//     .grid-header {
//       padding: var(--spacing-md) var(--spacing-lg);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-ternary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       flex-shrink: 0;
//     }

//     .grid-title {
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .grid-container {
//       flex: 1;
//       position: relative;
//       background: var(--bg-secondary);
//     }

//     .full-size-grid {
//       width: 100%;
//       height: 100%;
//       display: block;
//     }
//   `]
// })
// export class BranchComparisonComponent implements OnInit {
//   comparison = signal<any>(null);
//   loading = signal<boolean>(true);
//   branchColumns: any[] = [];

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
//     // We used CSS variables inside the HTML strings to ensure 
//     // the grid responds to Theme changes automatically.
//     this.branchColumns = [
//       {
//         headerName: 'Rank',
//         width: 80,
//         sortable: false,
//         cellRenderer: (params: any) => {
//           const rank = (params.node.rowIndex || 0) + 1;
//           // Use CSS Var for color
//           const colorVar = rank === 1 ? 'var(--theme-warning)' : 'var(--text-tertiary)';
//           return `<div style="text-align: center; font-weight: 700; color: ${colorVar}; display: flex; align-items: center; justify-content: center; height: 100%;">#${rank}</div>`;
//         }
//       },
//       {
//         field: 'branchName', 
//         headerName: 'Branch Name', 
//         sortable: true, 
//         flex: 1,
//         cellRenderer: (params: any) => {
//           const rank = params.node.rowIndex;
//           // Use CSS Var for status dot
//           const dotColor = rank === 0 ? 'var(--theme-success)' : 'var(--theme-info)';
//           const name = params.value || 'Unknown Branch';
//           return `<div style="display: flex; align-items: center; gap: 8px; height: 100%;">
//                     <div style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor};"></div>
//                     <span style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-base);">${name}</span>
//                   </div>`;
//         }
//       },
//       {
//         headerName: 'Revenue Share', 
//         width: 160,
//         sortable: false,
//         cellRenderer: (params: any) => {
//            // Logic placeholder
//            const percentage = 100; 
//            // Use CSS Vars for bars
//            return `<div style="display: flex; align-items: center; gap: 12px; height: 100%;">
//                     <div style="flex: 1; height: 6px; border-radius: 4px; background: var(--bg-ternary); overflow: hidden;">
//                       <div style="height: 100%; background: var(--accent-primary); width: ${percentage}%;"></div>
//                     </div>
//                     <span style="font-size: var(--font-size-xs); font-weight: 700; color: var(--text-secondary); width: 32px;">${percentage}%</span>
//                    </div>`;
//         }
//       },
//       {
//         field: 'invoiceCount', 
//         headerName: 'Invoices', 
//         sortable: true, 
//         width: 110,
//         type: 'rightAligned',
//         cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-weight': '600', 'color': 'var(--text-secondary)' }
//       },
//       {
//         field: 'avgBasketValue', 
//         headerName: 'Avg Basket', 
//         sortable: true, 
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '600', 'color': 'var(--accent-primary)', 'text-align': 'right' } 
//       },
//       {
//         field: 'revenue', 
//         headerName: 'Net Revenue', 
//         sortable: true, 
//         width: 150,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'text-align': 'right' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getBranchComparison().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.comparison.set(res.data.comparison);
//         }
//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.loading.set(false);
//       }
//     });
//   }
// }
