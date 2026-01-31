import { Component, OnInit, signal, inject, ChangeDetectorRef, computed } from '@angular/core';
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
      
      <div class="header-section">
        <div>
          <h2 class="page-title">Network Performance</h2>
          <p class="page-subtitle">Comparative analysis across {{ comparison()?.total || 0 }} operational branches</p>
        </div>
        <div class="header-actions">
           <p-button icon="pi pi-download" label="Export Report" severity="secondary" [outlined]="true" size="small"></p-button>
        </div>
      </div>

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

      <ng-container *ngIf="!loading()">
        
        <div class="stats-grid">
          
          <div class="stat-card leader-card">
            <div class="card-bg-icon"><i class="pi pi-trophy"></i></div>
            <div class="card-header">
              <span class="card-badge success">Top Performer</span>
              <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
            </div>
            <div class="card-metrics">
              <div class="metric">
                <span class="lbl">Revenue</span>
                <span class="val success">{{ commonService.formatCurrency(comparison()?.topPerformer?.revenue) }}</span>
              </div>
              <div class="metric">
                <span class="lbl">Invoices</span>
                <span class="val">{{ comparison()?.topPerformer?.invoiceCount }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card opportunity-card" *ngIf="comparison()?.lowestPerformer">
            <div class="card-header">
              <span class="card-badge warning">Growth Opportunity</span>
              <h3 class="card-value-text">{{ comparison()?.lowestPerformer?.branchName || '--' }}</h3>
            </div>
            <div class="card-footer">
              <span class="metric-value warning">
                {{ commonService.formatCurrency(comparison()?.lowestPerformer?.revenue) }}
              </span>
              <span class="metric-label">Needs Optimization</span>
            </div>
          </div>

          <div class="stat-card summary-card">
            <div class="summary-header">
              <span class="card-label">Network Reach</span>
              <i class="pi pi-chart-pie action-icon"></i>
            </div>
            <div class="summary-content">
              <div class="summary-row">
                <span class="row-label">Avg. Basket Size</span>
                <span class="row-value">{{ commonService.formatCurrency(comparison()?.topPerformer?.avgBasketValue) }}</span>
              </div>
              <div class="summary-row border-top">
                <span class="row-label">Active Outlets</span>
                <span class="row-value primary-text">{{ comparison()?.total || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
           <h3 class="section-title">Revenue Distribution</h3>
           <div class="bar-chart-container">
              @for (branch of topBranches(); track branch._id) {
                <div class="chart-row">
                   <span class="chart-label">{{ branch.branchName }}</span>
                   <div class="chart-track">
                      <div class="chart-fill" 
                           [style.width.%]="getPercentage(branch.revenue)"
                           [class.top]="branch._id === comparison()?.topPerformer?._id">
                      </div>
                   </div>
                   <span class="chart-value">{{ commonService.formatCurrency(branch.revenue) }}</span>
                </div>
              }
           </div>
        </div>

        <div class="grid-card">
          <div class="grid-header">
            <h3 class="grid-title">Detailed Breakdown</h3>
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

      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .branch-dashboard-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100vh;
      position: relative;
    }

    /* HEADER */
    .header-section {
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-lg);
    }
    .page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; }
    .page-subtitle { color: var(--text-tertiary); font-size: var(--font-size-sm); margin: 0; }

    .filter-section { margin-bottom: var(--spacing-xl); }

    .loading-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.7); z-index: 10;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(2px);
    }

    /* STATS GRID */
    .stats-grid { 
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
      gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);
    }

    .stat-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg);
      position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;
      min-height: 160px;
    }

    /* LEADER CARD */
    .leader-card { background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-ternary) 100%); border-color: var(--theme-success); }
    .leader-card .card-bg-icon { position: absolute; bottom: -10px; right: -10px; opacity: 0.1; pointer-events: none; }
    .leader-card .card-bg-icon i { font-size: 6rem; color: var(--theme-success); }
    
    .card-badge { 
      font-size: 9px; text-transform: uppercase; font-weight: 800; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px; display: inline-block;
      &.success { background: var(--color-success-bg); color: var(--color-success); }
      &.warning { background: var(--color-warning-bg); color: var(--color-warning); }
    }

    .card-value-text { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0 0 12px 0; }

    .card-metrics { display: flex; gap: var(--spacing-xl); }
    .metric { display: flex; flex-direction: column; }
    .metric .lbl { font-size: 10px; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; }
    .metric .val { font-size: 1.1rem; font-weight: 700; font-family: var(--font-mono); }
    .val.success { color: var(--color-success); }

    /* OPPORTUNITY CARD */
    .opportunity-card .metric-value.warning { font-size: 1.5rem; font-weight: 700; color: var(--color-warning); font-family: var(--font-mono); }
    .metric-label { font-size: 11px; color: var(--text-tertiary); }

    /* SUMMARY CARD */
    .summary-card { background: var(--bg-primary); }
    .summary-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: var(--text-secondary); }
    .summary-row.border-top { border-top: 1px solid var(--border-primary); margin-top: 4px; }
    .row-value { font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); }
    .primary-text { color: var(--accent-primary); }

    /* CHART SECTION */
    .chart-card {
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg); padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 var(--spacing-lg) 0; }
    
    .bar-chart-container { display: flex; flex-direction: column; gap: 12px; }
    .chart-row { display: grid; grid-template-columns: 150px 1fr 80px; align-items: center; gap: var(--spacing-md); }
    .chart-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: right; }
    .chart-track { height: 8px; background: var(--bg-ternary); border-radius: 4px; overflow: hidden; }
    .chart-fill { height: 100%; background: var(--accent-primary); border-radius: 4px; transition: width 1s ease-out; }
    .chart-fill.top { background: var(--color-success); }
    .chart-value { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--text-primary); }

    /* DATA GRID */
    .grid-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg); overflow: hidden; display: flex; flex-direction: column; height: 500px;
    }
    .grid-header { padding: var(--spacing-md); border-bottom: 1px solid var(--border-primary); background: var(--bg-ternary); }
    .grid-title { font-size: 13px; font-weight: 800; margin: 0; text-transform: uppercase; }
    .grid-container { flex: 1; background: var(--bg-secondary); position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }
  `]
})
export class BranchComparisonComponent implements OnInit {
  comparison = signal<any>(null);
  loading = signal<boolean>(false);
  branchColumns: any[] = [];
  private currentFilters: any = {};

  // Computed Top 5 for Chart
  topBranches = computed(() => {
    const branches = this.comparison()?.branches || [];
    return [...branches].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  });

  filterConfig: FilterField[] = [
    { key: 'date', label: 'Period', type: 'date-range' },
    { 
      key: 'groupBy', label: 'Sort By', type: 'select', 
      staticOptions: [{ label: 'Revenue', value: 'revenue' }, { label: 'Invoices', value: 'invoiceCount' }], 
      defaultValue: 'revenue' 
    }
  ];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    // Initial load triggered by filter init
  }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const params = {
      startDate: this.currentFilters.startDate,
      endDate: this.currentFilters.endDate,
      groupBy: this.currentFilters.groupBy || 'revenue',
      limit: 50
    };

    this.analyticsService.getBranchComparison(params.startDate, params.endDate, params.groupBy, params.limit).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.comparison.set(res.data.comparison);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getPercentage(value: number): number {
    const top = this.comparison()?.topPerformer?.revenue || 1;
    if (!top) return 0;
    return (value / top) * 100;
  }

  setupColumns(): void {
    this.branchColumns = [
      {
        headerName: '#',
        width: 60,
        pinned: 'left',
        valueGetter: (params: any) => (params.node.rowIndex + 1),
        cellStyle: { 'font-weight': 'bold', 'color': 'var(--text-tertiary)', 'display': 'flex', 'justify-content': 'center' }
      },
      {
        field: 'branchName', 
        headerName: 'Branch', 
        minWidth: 180,
        flex: 1,
        cellRenderer: (params: any) => {
           const isTop = params.node.rowIndex === 0;
           const icon = isTop ? '<i class="pi pi-star-fill" style="color:var(--color-warning); font-size:10px;"></i>' : '';
           return `<div style="display:flex; align-items:center; gap:8px; height:100%; font-weight:600; color:var(--text-primary);">
                     ${icon} ${params.value}
                   </div>`;
        }
      },
      {
        headerName: 'Performance',
        width: 140,
        cellRenderer: (params: any) => {
           const pct = this.getPercentage(params.data.revenue).toFixed(0);
           const color = params.node.rowIndex === 0 ? 'var(--color-success)' : 'var(--accent-primary)';
           return `<div style="display:flex; align-items:center; gap:8px; height:100%;">
                     <div style="flex:1; height:4px; background:var(--bg-ternary); border-radius:2px;">
                        <div style="width:${pct}%; height:100%; background:${color}; border-radius:2px;"></div>
                     </div>
                     <span style="font-size:10px; color:var(--text-secondary); width:24px;">${pct}%</span>
                   </div>`;
        }
      },
      {
        field: 'revenue', 
        headerName: 'Revenue', 
        width: 140, 
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-family': 'var(--font-mono)', 'text-align': 'right' }
      },
      {
        field: 'invoiceCount', 
        headerName: 'Orders', 
        width: 100, 
        type: 'rightAligned',
        cellStyle: { 'color': 'var(--text-secondary)', 'text-align': 'right' }
      },
      {
        field: 'avgBasketValue', 
        headerName: 'Avg. Basket', 
        width: 130, 
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'color': 'var(--accent-primary)', 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-size': '11px' }
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

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';

// // Components
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';

// @Component({
//   selector: 'app-branch-comparison',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TooltipModule, 
//     ProgressBarModule, 
//     ProgressSpinnerModule,
//     AgShareGrid,
//     UniversalFilterComponent 
//   ],
//   template: `
//     <div class="branch-dashboard-container">
      
//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'branch-comparison'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <div *ngIf="loading()" class="loading-overlay">
//          <p-progressSpinner styleClass="w-4rem h-4rem" strokeWidth="4"></p-progressSpinner>
//       </div>

//       <div class="stats-grid" [class.opacity-50]="loading()">
        
//         <div class="stat-card leader-card">
//           <div class="card-bg-icon"><i class="pi pi-trophy"></i></div>
//           <div class="card-header">
//             <p class="card-label">Market Leader</p>
//             <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
//           </div>
//           <div class="card-footer">
//             <span class="metric-value success">
//               {{ commonService.formatCurrency(comparison()?.topPerformer?.revenue) }}
//             </span>
//             <span class="metric-label">Revenue</span>
//           </div>
//         </div>

//         <div class="stat-card">
//           <div class="card-header">
//             <p class="card-label">Highest Basket Value</p>
//             <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
//           </div>
//           <div class="card-footer">
//             <span class="metric-value primary">
//               {{ commonService.formatCurrency(comparison()?.topPerformer?.avgBasketValue) }}
//             </span>
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
//               <span class="row-value success">
//                 {{ commonService.formatCurrency(comparison()?.topPerformer?.revenue) }}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div class="grid-card" [class.opacity-50]="loading()">
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
//     :host { display: block; width: 100%; }

//     .branch-dashboard-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//       position: relative;
//     }

//     .filter-section {
//       margin-bottom: var(--spacing-md);
//     }

//     .loading-overlay {
//       position: absolute;
//       top: 50%;
//       left: 50%;
//       transform: translate(-50%, -50%);
//       z-index: 10;
//     }

//     .opacity-50 { opacity: 0.5; pointer-events: none; }

//     /* ... [KEEP YOUR EXISTING CSS HERE: .stats-grid, .stat-card, etc.] ... */
    
//     /* Just ensuring the grid fills space correctly */
//     .grid-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       overflow: hidden;
//       display: flex;
//       flex-direction: column;
//       height: 600px;
//       margin-top: var(--spacing-lg);
//     }
    
//     /* (Copy the rest of your styles from the previous prompt here) */
//     .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-lg); }
//     .stat-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; min-height: 160px; }
//     .leader-card .card-bg-icon { position: absolute; top: -10px; right: -10px; opacity: 0.05; pointer-events: none; }
//     .leader-card .card-bg-icon i { font-size: 5rem; color: var(--theme-success); }
//     .card-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 4px; }
//     .card-value-text { font-size: 1.5rem; font-weight: bold; color: var(--text-primary); margin: 0 0 8px 0; }
//     .card-footer { display: flex; align-items: baseline; gap: 8px; }
//     .metric-value { font-size: 1.75rem; font-weight: bold; }
//     .metric-value.success { color: var(--theme-success); }
//     .metric-value.primary { color: var(--accent-primary); }
//     .metric-label { font-size: 11px; color: var(--text-tertiary); }
//     .summary-card { background: var(--bg-ternary); }
//     .summary-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
//     .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
//     .summary-row.border-top { border-top: 1px solid var(--border-primary); margin-top: 6px; }
//     .grid-header { padding: 1rem; border-bottom: 1px solid var(--border-primary); background: var(--bg-ternary); display: flex; justify-content: space-between; align-items: center; }
//     .grid-title { font-size: 14px; font-weight: bold; margin: 0; }
//     .grid-container { flex: 1; background: var(--bg-secondary); }
//     .full-size-grid { width: 100%; height: 100%; display: block; }
//   `]
// })
// export class BranchComparisonComponent implements OnInit {
//   // Signals
//   comparison = signal<any>(null);
//   loading = signal<boolean>(false); // Start false until filters init
  
//   // Grid
//   branchColumns: any[] = [];
  
//   // Current active params
//   private currentFilters: any = {};

//   // 1. FILTER CONFIGURATION
//   filterConfig: FilterField[] = [
//     {
//       key: 'date',
//       label: 'Performance Period',
//       type: 'date-range',
//     },
//     {
//       key: 'groupBy',
//       label: 'Sort By',
//       type: 'select',
//       staticOptions: [
//         { label: 'Revenue', value: 'revenue' },
//         { label: 'Invoice Count', value: 'invoiceCount' },
//         { label: 'Avg Basket Value', value: 'avgBasketValue' }
//       ],
//       defaultValue: 'revenue',
//       optionLabel: 'label',
//       optionValue: 'value'
//     },
//     {
//       key: 'limit',
//       label: 'Show Top',
//       type: 'select',
//       staticOptions: [
//         { label: 'Top 10', value: 10 },
//         { label: 'Top 50', value: 50 },
//         { label: 'Top 100', value: 100 },
//         { label: 'All', value: 0 } // Handle 0 as all in backend if needed
//       ],
//       defaultValue: 50,
//       optionLabel: 'label',
//       optionValue: 'value'
//     }
//   ];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     // loadData is now triggered by the filter component on init
//     // or you can call it manually if filter component doesn't emit on init
//     this.loadData(); 
//   }

//   // 2. HANDLE FILTER UPDATES
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);

//     // Map the filters to API params
//     const params = {
//       startDate: this.currentFilters.startDate,
//       endDate: this.currentFilters.endDate,
//       groupBy: this.currentFilters.groupBy || 'revenue',
//       limit: this.currentFilters.limit || 50
//     };

//     this.analyticsService.getBranchComparison(
//       params.startDate, 
//       params.endDate, 
//       params.groupBy, 
//       params.limit
//     ).subscribe({
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

//   setupColumns(): void {
//     this.branchColumns = [
//       {
//         headerName: 'Rank',
//         width: 80,
//         sortable: false,
//         pinned: 'left',
//         cellRenderer: (params: any) => {
//           const rank = (params.node.rowIndex || 0) + 1;
//           const colorVar = rank === 1 ? 'var(--theme-warning)' : 'var(--text-tertiary)';
//           return `<div style="display:flex; justify-content:center; align-items:center; height:100%; font-weight:700; color:${colorVar}">#${rank}</div>`;
//         }
//       },
//       {
//         field: 'branchName', 
//         headerName: 'Branch Name', 
//         sortable: true, 
//         minWidth: 200,
//         flex: 1,
//         cellRenderer: (params: any) => {
//           const rank = params.node.rowIndex;
//           const dotColor = rank === 0 ? 'var(--theme-success)' : 'var(--theme-info)';
//           const name = params.value || 'Unknown Branch';
//           return `<div style="display:flex; align-items:center; gap:8px; height:100%;">
//                     <div style="width:8px; height:8px; border-radius:50%; background:${dotColor};"></div>
//                     <span style="font-weight:600; color:var(--text-primary);">${name}</span>
//                   </div>`;
//         }
//       },
//       {
//         headerName: 'Performance', 
//         width: 180,
//         sortable: false,
//         cellRenderer: (params: any) => {
//            // Calculate relative to the top performer (row index 0) usually
//            // For now, using random/placeholder logic or data if available
//            const topRev = this.comparison()?.topPerformer?.revenue || 1;
//            const currentRev = params.data.revenue || 0;
//            const percentage = topRev > 0 ? Math.round((currentRev / topRev) * 100) : 0;
           
//            return `<div style="display:flex; align-items:center; gap:12px; height:100%;">
//                     <div style="flex:1; height:6px; border-radius:4px; background:var(--bg-ternary); overflow:hidden;">
//                       <div style="height:100%; background:var(--accent-primary); width:${percentage}%;"></div>
//                     </div>
//                     <span style="font-size:11px; font-weight:700; color:var(--text-secondary); width:32px;">${percentage}%</span>
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
//         width: 130,
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
// }
