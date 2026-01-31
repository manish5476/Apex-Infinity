import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MasterListService } from '../../core/services/master-list.service';

@Component({
  selector: 'app-admin-dashboard-Ui',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TagModule, TooltipModule, 
    SelectModule, DatePicker, ProgressSpinnerModule, ToastModule, AgShareGrid
  ],
  template: `
<div class="dashboard-container">
  <div class="filter-wrapper glass-panel">
    <div class="filter-group">
      <div class="filter-box">
        <label>Operational Branch</label>
        <p-select [options]="masterList.branches()" optionLabel="name" optionValue="_id" 
                  [(ngModel)]="selectedBranch" (onChange)="onFilterChange()"
                  styleClass="dashboard-select" placeholder="Select Branch"></p-select>
      </div>
      <div class="filter-box">
        <label>Analysis Period</label>
        <p-datepicker [(ngModel)]="dateRange" selectionMode="range" [showIcon]="true" 
                    (onSelect)="onFilterChange()" placeholder="Start - End Dates"
                    styleClass="dashboard-datepicker"></p-datepicker>
      </div>
    </div>
    <div class="header-actions">
      <div class="execution-time">Engine: {{ dashboard()?.financial?.performance?.executionTime }}</div>
      <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
    </div>
  </div>

  <div class="header-section">
    <div class="title-group">
      <h1 class="page-title">Executive Dashboard</h1>
      <p class="page-subtitle">Period: {{ dashboard()?.period?.start | date }} - {{ dashboard()?.period?.end | date }} ({{ dashboard()?.period?.days }} Days)</p>
    </div>
    <div class="health-summary">
      <div class="health-stat">
        <span class="label">Inventory Health</span>
        <span class="value success">{{ dashboard()?.inventory?.healthScore }}%</span>
      </div>
    </div>
  </div>

  <ng-container *ngIf="!loading(); else loader">
    
    <div class="kpi-grid">
      <div class="kpi-card revenue glass-panel">
        <div class="kpi-header">
          <span class="kpi-label">Gross Revenue</span>
          <span class="trend-pill positive">+{{ dashboard()?.financial?.totalRevenue?.growth }}%</span>
        </div>
        <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalRevenue?.value | number }}</h2>
        <p class="kpi-subtext">{{ dashboard()?.financial?.totalRevenue?.count }} Transactions</p>
      </div>

      <div class="kpi-card profit glass-panel">
        <div class="kpi-header">
          <span class="kpi-label">Net Profit</span>
          <p-tag severity="success" [value]="dashboard()?.financial?.netProfit?.status"></p-tag>
        </div>
        <h2 class="kpi-value success">₹{{ dashboard()?.financial?.netProfit?.value | number }}</h2>
        <p class="kpi-subtext">Margin: {{ dashboard()?.financial?.netProfit?.margin }}%</p>
      </div>

      <div class="kpi-card valuation glass-panel">
        <div class="kpi-header">
          <span class="kpi-label">Inventory Valuation</span>
          <i class="pi pi-box"></i>
        </div>
        <h2 class="kpi-value">₹{{ dashboard()?.leaders?.summary?.valuation | number }}</h2>
        <p class="kpi-subtext">{{ dashboard()?.leaders?.inventoryValuation?.totalItems }} Items across {{ dashboard()?.leaders?.inventoryValuation?.productCount }} SKUs</p>
      </div>

      <div class="kpi-card risk glass-panel">
        <div class="kpi-header">
          <span class="kpi-label">Outstanding Debt</span>
          <i class="pi pi-exclamation-triangle error-text"></i>
        </div>
        <h2 class="kpi-value error">₹{{ dashboard()?.financial?.outstanding?.receivables | number }}</h2>
        <p class="kpi-subtext">{{ dashboard()?.topCategories?.highRiskDebtCount }} High-Risk Accounts</p>
      </div>
    </div>

    <div class="layout-grid">
      <div class="main-column">
        <div class="content-card glass-panel">
          <h3 class="card-title mb-md"><i class="pi pi-bolt"></i> Intelligent Business Insights</h3>
          <div class="insights-container">
            @for (insight of dashboard()?.insights?.insights; track insight.title) {
              <div class="insight-row" [class.positive]="insight.type === 'positive'">
                <div class="insight-icon"><i class="pi pi-check-circle"></i></div>
                <div class="insight-content">
                  <p class="i-title">{{ insight.title }} <span class="priority-tag">{{ insight.priority }}</span></p>
                  <p class="i-msg">{{ insight.message }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="grid-card glass-panel">
          <div class="card-header-flex">
            <h3 class="card-title">Stock Urgency Monitor</h3>
            <span class="count-pill">{{ dashboard()?.inventory?.lowStockAlerts?.length || 0 }} Alerts</span>
          </div>
          <div class="grid-wrapper">
             <app-ag-share-grid [columns]="alertColumns" [data]="dashboard()?.inventory?.lowStockAlerts || []" 
                               [showActions]="false" class="compact-grid"></app-ag-share-grid>
          </div>
        </div>
      </div>

      <div class="side-column">
        <div class="content-card glass-panel">
          <h4 class="sidebar-title">Operational Efficiency</h4>
          <div class="stat-list">
            <div class="stat-row">
              <span>Avg. Order Value</span>
              <b>₹{{ dashboard()?.operations?.orderEfficiency?.averageOrderValue | number:'1.0-0' }}</b>
            </div>
            <div class="stat-row">
              <span>Discount Rate</span>
              <b>{{ dashboard()?.operations?.discountMetrics?.discountRate }}%</b>
            </div>
            <div class="stat-row">
              <span>New Customers</span>
              <span class="text-success">+{{ dashboard()?.financial?.customers?.new }}</span>
            </div>
          </div>
        </div>

        <div class="content-card glass-panel">
          <h4 class="sidebar-title">Customer Segmentation</h4>
          <div class="segment-pill-container">
            @for (seg of dashboard()?.customers?.segmentation; track seg._id) {
              <div class="seg-pill">
                <span class="seg-name">{{ seg._id }}</span>
                <span class="seg-count">{{ seg.count }}</span>
              </div>
            }
          </div>
        </div>

        <div class="content-card glass-panel">
          <h4 class="sidebar-title">Top Staff Performance</h4>
          @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
            <div class="staff-card">
              <div class="staff-info">
                <p class="s-name">{{ staff.name }}</p>
                <p class="s-sub">{{ staff.count }} Sales handled</p>
              </div>
              <div class="staff-value">₹{{ staff.revenue | number }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  </ng-container>

  <ng-template #loader>
    <div class="full-loader">
      <p-progressSpinner strokeWidth="3"></p-progressSpinner>
      <span>Syncing Financial Data...</span>
    </div>
  </ng-template>
</div>
`,
  styles: [`
  .dashboard-container {
    padding: var(--spacing-xl); background: var(--bg-primary); min-height: 100vh; color: var(--text-primary);
    
    .glass-panel {
      background: color-mix(in srgb, var(--bg-secondary), transparent 10%);
      backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm);
    }

    .filter-wrapper {
      display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md) var(--spacing-lg); margin-bottom: var(--spacing-xl);
      .filter-group { display: flex; gap: var(--spacing-xl); }
      .filter-box { display: flex; flex-direction: column; gap: 4px; label { font-size: 10px; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; } }
      .execution-time { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); margin-right: var(--spacing-md); }
    }

    .header-section {
      display: flex; justify-content: space-between; margin-bottom: var(--spacing-xl);
      .page-title { font-family: var(--font-heading); font-size: var(--font-size-3xl); font-weight: 700; margin: 0; }
      .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }
      .health-stat { text-align: right; .label { display: block; font-size: 10px; font-weight: 800; color: var(--text-tertiary); } .value { font-size: var(--font-size-2xl); font-weight: 900; } }
    }

    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);
      @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
    }

    .kpi-card {
      padding: var(--spacing-lg);
      .kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
      .kpi-label { font-size: 11px; font-weight: 700; color: var(--text-label); text-transform: uppercase; }
      .kpi-value { font-size: var(--font-size-3xl); font-weight: 800; margin: 0; letter-spacing: -1px; }
      .kpi-subtext { font-size: 10px; color: var(--text-tertiary); margin-top: 4px; }
      .trend-pill { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 800; &.positive { background: var(--color-success-bg); color: var(--color-success); } }
    }

    .layout-grid { display: grid; grid-template-columns: 2.5fr 1fr; gap: var(--spacing-lg); }
    .main-column, .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    
    .content-card, .grid-card { padding: var(--spacing-lg); }
    .card-title { font-size: var(--font-size-md); font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px; }

    .insight-row {
      display: flex; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--bg-primary); border-radius: 8px; margin-bottom: var(--spacing-sm);
      border-left: 4px solid var(--color-info);
      &.positive { border-left-color: var(--color-success); background: var(--color-success-bg); }
      .i-title { font-weight: 800; font-size: var(--font-size-sm); margin: 0; display: flex; justify-content: space-between; }
      .i-msg { font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 2px; }
      .priority-tag { font-size: 8px; text-transform: uppercase; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px; }
    }

    .sidebar-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--text-label); margin-bottom: var(--spacing-lg); border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; }
    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-primary); font-size: var(--font-size-sm); }
    
    .seg-pill {
      display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm) var(--spacing-md); background: var(--bg-primary); border-radius: var(--ui-border-radius); margin-bottom: 4px;
      .seg-name { font-size: 11px; font-weight: 600; }
      .seg-count { background: var(--accent-primary); color: #fff; font-size: 10px; padding: 0 6px; border-radius: 10px; }
    }

    .staff-card {
      display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-ternary); border-radius: 8px; margin-bottom: 6px;
      .s-name { font-weight: 700; font-size: var(--font-size-sm); margin: 0; }
      .s-sub { font-size: 9px; color: var(--text-muted); }
      .staff-value { font-weight: 800; color: var(--color-success); font-size: var(--font-size-sm); }
    }

    .full-loader { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; font-size: 10px; }
  }
  `]
})
export class DashboardUI implements OnInit {
  dashboard = signal<any>(null);
  loading = signal<boolean>(true);
  public masterList = inject(MasterListService);
  
  selectedBranch = signal<string>('');
  dateRange = signal<Date[] | null>(null);

  alertColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.loadDashboard();
  }

  setupColumns(): void {
    this.alertColumns = [
      { field: 'name', headerName: 'Inventory Item', flex: 2, cellStyle: { 'font-weight': '700' } },
      { field: 'currentStock', headerName: 'Stock', flex: 1, cellStyle: { 'color': 'var(--color-error)', 'font-weight': '900' } },
      { 
        field: 'revenue', 
        headerName: 'Potential Revenue', 
        flex: 1, 
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value) 
      }
    ];
    this.cdr.detectChanges();
  }

  loadDashboard() {
    this.loading.set(true);
    let start, end;
    if (this.dateRange()?.length === 2) {
      start = this.dateRange()![0]?.toISOString();
      end = this.dateRange()![1]?.toISOString();
    }

    this.analyticsService.getDashboardOverview(start, end, this.selectedBranch()).subscribe({
      next: (res) => {
        this.dashboard.set(res.data);
        this.loading.set(false);
      }
    });
  }

  onFilterChange() { this.loadDashboard(); }
}
// import { MasterService } from './../../core/services/master.service';
// import { Component, OnInit, signal, ChangeDetectorRef, Inject, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ToastModule } from 'primeng/toast';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { SelectModule } from 'primeng/select';
// import { DatePicker } from 'primeng/datepicker';
// import { MasterApiService } from '../../core/services/master-api.service';
// import { MasterList } from '../../modules/shared/components/master-list/master-list';
// import { MasterListService } from '../../core/services/master-list.service';

// @Component({
//   selector: 'app-admin-dashboard-Ui',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, ButtonModule, TagModule, TooltipModule, 
//     SelectModule, DatePicker, ProgressSpinnerModule, ToastModule, AgShareGrid
//   ],
//   template: `<div class="dashboard-container">
  
//   <div class="filter-wrapper">
//     <div class="filter-group">
//       <div class="filter-box">
//         <label>Branch</label>
//         <p-select [options]="this.masterList.branches()" optionLabel="name" optionValue="_id" 
//                     [(ngModel)]="selectedBranch" (onChange)="onFilterChange()"
//                     styleClass="dashboard-select"></p-select>
//       </div>
//       <div class="filter-box">
//         <label>Date Range</label>
//         <p-datepicker [(ngModel)]="dateRange" selectionMode="range" [showIcon]="true" 
//                     (onSelect)="onFilterChange()" placeholder="Select Dates"
//                     styleClass="dashboard-datepicker"></p-datepicker>
//       </div>
//     </div>
//     <div class="header-actions">
//       <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
//     </div>
//   </div>

//   <div class="header-section">
//     <div>
//       <h1 class="page-title">Executive Overview</h1>
//       <p class="page-subtitle">
//         Analyzing {{ dashboard()?.period?.days }} days for Shivam Electronics
//       </p>
//     </div>
//     <div class="health-badge">
//       <span class="health-label">HEALTH SCORE</span>
//       <span class="health-value">{{ dashboard()?.inventory?.healthScore }}%</span>
//     </div>
//   </div>

//   <ng-container *ngIf="!loading(); else loader">
    
//     <div class="kpi-grid">
//       <div class="kpi-card revenue">
//         <div class="kpi-header">
//           <span class="kpi-label">Revenue</span>
//           <i class="pi pi-wallet kpi-icon"></i>
//         </div>
//         <div class="kpi-body">
//           <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalRevenue?.value | number }}</h2>
//           <span class="trend-badge success">
//             <i class="pi pi-arrow-up-right"></i> {{ dashboard()?.financial?.totalRevenue?.growth }}%
//           </span>
//         </div>
//       </div>

//       <div class="kpi-card profit">
//         <div class="kpi-header">
//           <span class="kpi-label">Net Profit</span>
//           <i class="pi pi-chart-line kpi-icon success"></i>
//         </div>
//         <h2 class="kpi-value success">₹{{ dashboard()?.financial?.netProfit?.value | number }}</h2>
//         <div class="kpi-meta">
//           <span class="pill-badge success">Margin {{ dashboard()?.financial?.netProfit?.margin }}%</span>
//         </div>
//       </div>

//       <div class="kpi-card outstanding">
//         <div class="kpi-header">
//           <span class="kpi-label">Outstanding</span>
//           <i class="pi pi-exclamation-circle kpi-icon error"></i>
//         </div>
//         <h2 class="kpi-value error">₹{{ dashboard()?.financial?.outstanding?.receivables | number }}</h2>
//         <p class="kpi-footer">Pending Collections</p>
//       </div>
//     </div>

//     <div class="layout-grid">
//       <div class="main-column">
//         <div class="content-card">
//           <div class="card-header mb-md">
//             <i class="pi pi-sparkles header-icon"></i>
//             <h3 class="card-title">Business Insights</h3>
//           </div>
//           <div class="insights-grid">
//             @for (insight of dashboard()?.insights?.insights; track insight.title) {
//               <div class="insight-item" [class.positive]="insight.type === 'positive'">
//                 <p class="insight-title">{{ insight.title }}</p>
//                 <p class="insight-message">{{ insight.message }}</p>
//               </div>
//             }
//           </div>
//         </div>

//         <div class="grid-card fixed-height-grid">
//           <div class="grid-header">
//             <h3 class="grid-title">Low Stock Alerts</h3>
//             <span class="action-badge error">{{ dashboard()?.alerts?.lowStockCount || 0 }} AT RISK</span>
//           </div>
//           <div class="grid-wrapper">
//              <app-ag-share-grid [columns]="alertColumns" [data]="dashboard()?.inventory?.lowStockAlerts || []" [showActions]="false" class="full-size-grid"></app-ag-share-grid>
//           </div>
//         </div>

//         <div class="grid-card fixed-height-grid">
//           <div class="grid-header">
//             <h3 class="grid-title">Top Customers</h3>
//           </div>
//           <div class="grid-wrapper">
//              <app-ag-share-grid [columns]="customerColumns" [data]="dashboard()?.alerts?.topCustomers || []" [showActions]="false" class="full-size-grid"></app-ag-share-grid>
//           </div>
//         </div>
//       </div>

//       <div class="side-column">
//         <div class="content-card">
//           <h4 class="card-subtitle mb-md">Top Products</h4>
//           <div class="list-container">
//             @for (prod of dashboard()?.alerts?.topProducts; track prod._id) {
//               <div class="list-item">
//                 <div class="item-left">
//                   <div class="rank-box">#{{ $index + 1 }}</div>
//                   <div class="item-info">
//                     <p class="item-name">{{ prod.name }}</p>
//                     <p class="item-sub">Sold: {{ prod.soldQty }}</p>
//                   </div>
//                 </div>
//                 <span class="item-value">₹{{ prod.revenue | number }}</span>
//               </div>
//             }
//           </div>
//         </div>

//         <div class="content-card">
//           <h4 class="card-subtitle mb-md">Customer Mix</h4>
//           <div class="segment-list">
//              <div class="segment-item">
//                 <span>Standard Customers</span>
//                 <b>{{ dashboard()?.customers?.segmentation?.Standard }}</b>
//              </div>
//              <div class="segment-item">
//                 <span>Active Shoppers</span>
//                 <b>{{ dashboard()?.customers?.active }}</b>
//              </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </ng-container>

//   <ng-template #loader>
//     <div class="loader-container">
//       <p-progressSpinner strokeWidth="4"></p-progressSpinner>
//       <p class="loader-text">Compiling Analytics...</p>
//     </div>
//   </ng-template>

// </div>
//   `,
//   styles: [`
//    .dashboard-container {
//   padding: var(--spacing-lg) var(--spacing-xl);
//   background: var(--bg-primary);
//   min-height: 100vh;

//   .filter-wrapper {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     background: var(--bg-secondary);
//     padding: var(--spacing-md);
//     border-radius: var(--ui-border-radius-lg);
//     border: 1px solid var(--border-primary);
//     margin-bottom: var(--spacing-xl);

//     .filter-group { display: flex; gap: var(--spacing-lg); }
//     .filter-box {
//         display: flex; flex-direction: column; gap: 4px;
//         label { font-size: 10px; font-weight: bold; color: var(--text-tertiary); text-transform: uppercase; }
//     }
//   }

//   .header-section {
//     display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-xl);
//   }

//   .page-title { font-size: var(--font-size-3xl); font-weight: bold; color: var(--text-primary); margin: 0; }
//   .page-subtitle { color: var(--text-tertiary); font-size: var(--font-size-sm); }

//   .health-badge {
//     padding: var(--spacing-xs) var(--spacing-md); background: var(--bg-secondary);
//     border-radius: var(--ui-border-radius); border: 1px solid var(--border-primary);
//     display: flex; gap: var(--spacing-sm); align-items: center;
//     .health-label { font-size: 10px; font-weight: bold; color: var(--text-label); }
//     .health-value { color: var(--color-success); font-weight: bold; }
//   }

//   .kpi-grid {
//     display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//     gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);
//   }

//   .kpi-card {
//     background: var(--bg-secondary); border: 1px solid var(--border-primary);
//     border-radius: var(--ui-border-radius-xl); padding: var(--spacing-lg);
//     .kpi-header { display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm); }
//     .kpi-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: var(--text-label); }
//     .kpi-value { font-size: var(--font-size-3xl); font-weight: 800; margin: 0; color: var(--text-primary); }
//     .success { color: var(--color-success) !important; }
//     .error { color: var(--color-error) !important; }
//   }

//   .layout-grid {
//     display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-lg);
//     @media (max-width: 1024px) { grid-template-columns: 1fr; }
//   }

//   .main-column, .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

//   .content-card, .grid-card {
//     background: var(--bg-secondary); border: 1px solid var(--border-primary);
//     border-radius: var(--ui-border-radius-xl); padding: var(--spacing-lg);
//   }

//   .insight-item {
//     padding: var(--spacing-md); background: var(--bg-primary);
//     border-radius: var(--ui-border-radius-lg); border-left: 4px solid var(--color-info);
//     &.positive { border-left-color: var(--color-success); }
//     .insight-title { font-weight: bold; font-size: var(--font-size-sm); margin: 0; }
//     .insight-message { font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px; }
//   }

//   .fixed-height-grid { height: 350px; display: flex; flex-direction: column; .grid-wrapper { flex: 1; } }

//   .list-item {
//     display: flex; justify-content: space-between; align-items: center;
//     padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--border-primary);
//     .item-left { display: flex; gap: var(--spacing-md); align-items: center; }
//     .rank-box { width: 24px; height: 24px; background: var(--bg-primary); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
//     .item-name { font-weight: 600; font-size: var(--font-size-sm); margin: 0; }
//     .item-sub { font-size: 10px; color: var(--text-tertiary); margin: 0; }
//   }

//   .segment-item {
//     display: flex; justify-content: space-between; padding: 8px 0; font-size: var(--font-size-sm);
//     border-bottom: 1px dashed var(--border-primary);
//   }

//   .loader-container { height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
// }
//   `]
// })
// export class DashboardUI implements OnInit {
//   dashboard = signal<any>(null);
//   loading = signal<boolean>(true);
//   public  masterList = inject(MasterListService);
  
//   // Filters
//   selectedBranch = signal<string>('');
//   dateRange = signal<Date[] | null>(null);
//   branches = signal<any[]>([{ name: 'All Branches', id: 'all' }]);

//   // Grid Columns
//   alertColumns: any[] = [];
//   customerColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     this.loadDashboard();
//   }

//   setupColumns(): void {
//     this.alertColumns = [
//       {
//         field: 'name', headerName: 'Product', flex: 1,
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'display': 'flex', 'align-items': 'center' }
//       },
//       {
//         field: 'currentStock', headerName: 'Stock', width: 100,
//         cellStyle: { 'color': 'var(--color-error)', 'font-weight': 'bold', 'display': 'flex', 'align-items': 'center' }
//       },
//       {
//         field: 'urgency', headerName: 'Urgency', width: 100,
//         cellRenderer: (params: any) => `
//           <div style="display: flex; align-items: center; height: 100%;">
//             <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; background: var(--color-error); color: #fff;">
//               ${params.value || 'CRITICAL'}
//             </span>
//           </div>`
//       }
//     ];

//     this.customerColumns = [
//       {
//         field: 'name', headerName: 'Customer', flex: 1,
//         cellRenderer: (params: any) => `
//           <div style="display: flex; align-items: center; height: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
//             <span style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-sm); margin-right: 6px;">${params.value}</span>
//             <span style="font-size: 10px; color: var(--text-tertiary);">| ${params.data.phone || ''}</span>
//           </div>`
//       },
//       {
//         field: 'totalSpent', headerName: 'Spent', width: 120,
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'justify-content': 'flex-end', 'display': 'flex', 'align-items': 'center' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadDashboard() {
//     this.loading.set(true);
    
//     let startStr: string | undefined;
//     let endStr: string | undefined;

//     if (this.dateRange() && this.dateRange()![0] && this.dateRange()![1]) {
//       startStr = this.dateRange()![0].toISOString().split('T')[0];
//       endStr = this.dateRange()![1].toISOString().split('T')[0];
//     }

//     const branchId = this.selectedBranch() // === 'all' ? undefined : this.selectedBranch();

//     this.analyticsService.getDashboardOverview(startStr, endStr, branchId).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.dashboard.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error('Dashboard Error', err);
//         this.loading.set(false);
//       }
//     });
//   }

//   onFilterChange() {
//     console.log(this.selectedBranch());
//     this.loadDashboard();
//   }
// }

// // import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { ButtonModule } from 'primeng/button';
// // import { TagModule } from 'primeng/tag';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { ToastModule } from 'primeng/toast';
// // import { AdminAnalyticsService } from '../admin-analytics.service';
// // import { CommonMethodService } from '../../core/utils/common-method.service';
// // import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// // @Component({
// //   selector: 'app-admin-dashboard-Ui',
// //   standalone: true,
// //   imports: [
// //     CommonModule, 
// //     FormsModule, 
// //     ButtonModule, 
// //     TagModule, 
// //     TooltipModule, 
// //     ProgressSpinnerModule, 
// //     ToastModule,
// //     AgShareGrid
// //   ],
// //   template: `
// //     <div class="dashboard-container">
          
// //       <div class="header-section">
// //         <div>
// //           <h1 class="page-title">Executive Overview</h1>
// //           <p class="page-subtitle">
// //             Analyzing {{ dashboard()?.period?.days }} days of performance for Shivam Electronics
// //           </p>
// //         </div>
// //         <div class="header-actions">
// //           <div class="health-badge">
// //             <span class="health-label">HEALTH SCORE</span>
// //             <span class="health-value">{{ dashboard()?.inventory?.healthScore }}%</span>
// //           </div>
// //           <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
// //         </div>
// //       </div>

// //       <ng-container *ngIf="!loading(); else loader">
        
// //         <div class="kpi-grid">
// //           <div class="kpi-card revenue">
// //             <div class="kpi-header">
// //               <span class="kpi-label">Total Revenue</span>
// //               <i class="pi pi-wallet kpi-icon"></i>
// //             </div>
// //             <div class="kpi-body">
// //               <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalRevenue?.value | number:'1.0-0' }}</h2>
// //               <span class="trend-badge success">
// //                 <i class="pi pi-arrow-up-right"></i> {{ dashboard()?.financial?.totalRevenue?.growth }}%
// //               </span>
// //             </div>
// //             <p class="kpi-footer">Avg Ticket: ₹{{ dashboard()?.financial?.totalRevenue?.avgTicket | number:'1.0-0' }}</p>
// //           </div>

// //           <div class="kpi-card profit">
// //             <div class="kpi-header">
// //               <span class="kpi-label">Net Profit</span>
// //               <i class="pi pi-chart-line kpi-icon success"></i>
// //             </div>
// //             <h2 class="kpi-value success">₹{{ dashboard()?.financial?.netProfit?.value | number:'1.0-0' }}</h2>
// //             <div class="kpi-meta">
// //               <span class="pill-badge success">Margin {{ dashboard()?.financial?.netProfit?.margin }}%</span>
// //             </div>
// //           </div>

// //           <div class="kpi-card expenses">
// //             <div class="kpi-header">
// //               <span class="kpi-label">Total Expenses</span>
// //               <i class="pi pi-minus-circle kpi-icon error"></i>
// //             </div>
// //             <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalExpense?.value | number }}</h2>
// //             <p class="kpi-footer">{{ dashboard()?.financial?.totalExpense?.count }} Transactions recorded</p>
// //           </div>

// //           <div class="kpi-card inventory">
// //             <div class="kpi-header">
// //               <span class="kpi-label">Inventory Value</span>
// //               <i class="pi pi-box kpi-icon info"></i>
// //             </div>
// //             <h2 class="kpi-value">₹{{ (dashboard()?.inventory?.summary?.valuation / 10000000) | number:'1.2-2' }} Cr</h2>
// //             <p class="kpi-footer">{{ dashboard()?.inventory?.inventoryValuation?.totalItems }} Units in Stock</p>
// //           </div>
// //         </div>

// //         <div class="layout-grid">
          
// //           <div class="main-column">
            
// //             <div class="content-card">
// //               <div class="card-header mb-md">
// //                 <i class="pi pi-sparkles header-icon"></i>
// //                 <h3 class="card-title">Operational Insights</h3>
// //               </div>
// //               <div class="insights-grid">
// //                 @for (insight of dashboard()?.insights?.insights; track insight.title) {
// //                   <div class="insight-item" [class.positive]="insight.type === 'positive'" [class.neutral]="insight.type !== 'positive'">
// //                     <p class="insight-title">{{ insight.title }}</p>
// //                     <p class="insight-message">{{ insight.message }}</p>
// //                   </div>
// //                 }
// //               </div>
// //             </div>

// //             <div class="grid-card fixed-height-grid">
// //               <div class="grid-header">
// //                 <h3 class="grid-title">Critical Inventory Alerts</h3>
// //                 <span class="action-badge error">{{ dashboard()?.alerts?.lowStockCount }} ACTIONS REQUIRED</span>
// //               </div>
              
// //               <div class="grid-wrapper">
// //                  <app-ag-share-grid 
// //                    [columns]="alertColumns" 
// //                    [data]="dashboard()?.inventory?.lowStockAlerts || []" 
// //                    [showActions]="false" 
// //                    class="full-size-grid">
// //                  </app-ag-share-grid>
// //               </div>
// //             </div>

// //             <div class="grid-card fixed-height-grid">
// //               <div class="grid-header">
// //                 <h3 class="grid-title">Top Customers</h3>
// //                 <span class="header-meta">By Revenue</span>
// //               </div>
              
// //               <div class="grid-wrapper">
// //                  <app-ag-share-grid 
// //                    [columns]="customerColumns" 
// //                    [data]="dashboard()?.leaders?.topCustomers || []" 
// //                    [showActions]="false" 
// //                    class="full-size-grid">
// //                  </app-ag-share-grid>
// //               </div>
// //             </div>

// //           </div>

// //           <div class="side-column">
            
// //             <div class="content-card">
// //               <h4 class="card-subtitle mb-md">Top Sellers</h4>
// //               <div class="list-container">
// //                 @for (prod of dashboard()?.leaders?.topProducts; track prod._id) {
// //                   <div class="list-item">
// //                     <div class="item-left">
// //                       <div class="rank-box">#{{ $index + 1 }}</div>
// //                       <div class="item-info">
// //                         <p class="item-name" title="{{ prod.name }}">{{ prod.name }}</p>
// //                         <p class="item-sub">Qty: {{ prod.soldQty }}</p>
// //                       </div>
// //                     </div>
// //                     <span class="item-value">₹{{ prod.revenue | number }}</span>
// //                   </div>
// //                 }
// //               </div>
// //             </div>

// //             <div class="content-card">
// //               <h4 class="card-subtitle mb-md">Sales Leaderboard</h4>
// //               <div class="list-container">
// //                 @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
// //                   <div class="list-item staff-item">
// //                     <div class="item-left">
// //                       <div class="avatar-circle">
// //                         {{ staff.name.charAt(0) }}
// //                       </div>
// //                       <div class="item-info">
// //                         <p class="item-name">{{ staff.name }}</p>
// //                         <p class="item-sub">{{ staff.count }} deals closed</p>
// //                       </div>
// //                     </div>
// //                     <span class="item-value success">₹{{ staff.revenue | number }}</span>
// //                   </div>
// //                 }
// //               </div>
// //             </div>

// //           </div>
// //         </div>
// //       </ng-container>

// //       <ng-template #loader>
// //         <div class="loader-container">
// //           <p-progressSpinner strokeWidth="4" fill="transparent" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
// //           <p class="loader-text">Compiling executive data...</p>
// //         </div>
// //       </ng-template>

// //     </div>
// //   `,
// //   styles: [`
// //     /* HOST & LAYOUT */
// //     :host { display: block; width: 100%; }

// //     .dashboard-container {
// //       padding: var(--spacing-lg) var(--spacing-xl);
// //       background: var(--bg-primary);
// //       font-family: var(--font-body);
// //       min-height: 100%;
// //     }

// //     /* HEADER */
// //     .header-section {
// //       display: flex;
// //       flex-wrap: wrap;
// //       justify-content: space-between;
// //       align-items: flex-end;
// //       gap: var(--spacing-md);
// //       margin-bottom: var(--spacing-xl);
// //     }

// //     .page-title {
// //       font-size: var(--font-size-3xl);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--text-primary);
// //       font-family: var(--font-heading);
// //       letter-spacing: -0.02em;
// //       margin: 0 0 4px 0;
// //     }

// //     .page-subtitle {
// //       color: var(--text-tertiary);
// //       font-size: var(--font-size-sm);
// //       margin: 0;
// //     }

// //     .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

// //     .health-badge {
// //       padding: var(--spacing-xs) var(--spacing-md);
// //       border: 1px solid var(--border-primary);
// //       background: var(--bg-secondary);
// //       border-radius: var(--ui-border-radius);
// //       display: flex;
// //       align-items: center;
// //       gap: var(--spacing-sm);
// //     }
// //     .health-label { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-label); }
// //     .health-value { font-size: var(--font-size-md); font-weight: bold; color: var(--color-success); }

// //     /* KPI GRID */
// //     .kpi-grid {
// //       display: grid;
// //       grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
// //       gap: var(--spacing-lg);
// //       margin-bottom: var(--spacing-lg);
// //     }

// //     /* KPI CARDS */
// //     .kpi-card {
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       padding: var(--spacing-lg);
// //       transition: var(--transition-base);
// //       display: flex;
// //       flex-direction: column;
// //     }
// //     .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: var(--border-secondary); }

// //     .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
// //     .kpi-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-label); }
// //     .kpi-icon { color: var(--accent-primary); font-size: 1rem; }
// //     .kpi-icon.success { color: var(--color-success); }
// //     .kpi-icon.error { color: var(--color-error); }
// //     .kpi-icon.info { color: var(--color-info); }

// //     .kpi-body { display: flex; items-align: flex-end; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); }
    
// //     .kpi-value {
// //       font-size: var(--font-size-3xl);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--text-primary);
// //       font-family: var(--font-heading);
// //       margin: 0;
// //       line-height: 1;
// //     }
// //     .kpi-value.success { color: var(--color-success); }

// //     .trend-badge { font-size: var(--font-size-xs); font-weight: bold; display: flex; align-items: center; gap: 2px; }
// //     .trend-badge.success { color: var(--color-success); }

// //     .kpi-footer { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: auto; }

// //     .kpi-meta { margin-top: var(--spacing-sm); }
// //     .pill-badge { font-size: var(--font-size-xs); font-weight: bold; padding: 2px 8px; border-radius: 4px; }
// //     .pill-badge.success { background: var(--color-success-bg); color: var(--color-success); }

// //     /* LAYOUT GRID */
// //     .layout-grid {
// //       display: grid;
// //       grid-template-columns: 1fr;
// //       gap: var(--spacing-lg);
// //     }
// //     @media(min-width: 1024px) {
// //       .layout-grid { grid-template-columns: 2fr 1fr; }
// //     }

// //     .main-column, .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

// //     /* SHARED CARD STYLES */
// //     .content-card, .grid-card {
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       padding: var(--spacing-lg);
// //     }

// //     .card-header { display: flex; items-align: center; gap: var(--spacing-sm); }
// //     .header-icon { color: var(--accent-primary); }
// //     .mb-md { margin-bottom: var(--spacing-md); }

// //     .card-title { font-size: var(--font-size-md); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; letter-spacing: -0.01em; }
// //     .card-subtitle { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; letter-spacing: 0.05em; }

// //     /* INSIGHTS GRID */
// //     .insights-grid {
// //       display: grid;
// //       grid-template-columns: 1fr;
// //       gap: var(--spacing-md);
// //     }
// //     @media(min-width: 768px) {
// //       .insights-grid { grid-template-columns: 1fr 1fr; }
// //     }

// //     .insight-item {
// //       padding: var(--spacing-md);
// //       border-radius: var(--ui-border-radius-lg);
// //       background: var(--bg-ternary);
// //       border: 1px solid var(--border-secondary);
// //       border-left-width: 4px;
// //     }
// //     .insight-item.positive { border-left-color: var(--color-success); }
// //     .insight-item.neutral { border-left-color: var(--color-info); }

// //     .insight-title { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0 0 4px 0; }
// //     .insight-message { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; line-height: 1.4; }

// //     /* GRID CARD (AgGrid Wrapper) */
// //     /* FIXED HEIGHT FOR SCROLLING: This forces the scrollbar to appear */
// //     .fixed-height-grid { 
// //         height: 400px; 
// //         padding: 0; 
// //         overflow: hidden; 
// //         display: flex; 
// //         flex-direction: column; 
// //     }
    
// //     .grid-header {
// //       padding: var(--spacing-md) var(--spacing-lg);
// //       border-bottom: 1px solid var(--border-primary);
// //       background: var(--bg-ternary);
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       flex-shrink: 0; /* Ensures header doesn't shrink when scrolling happens */
// //     }

// //     .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
// //     .header-meta { font-size: 10px; color: var(--text-tertiary); }
    
// //     .action-badge { 
// //       font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 99px; 
// //     }
// //     .action-badge.error { background: var(--color-error-bg); color: var(--color-error); }

// //     .grid-wrapper { 
// //         flex: 1; 
// //         width: 100%;
// //         overflow: hidden; /* Needed for Grid Internal Scroll */
// //         position: relative; 
// //     }
    
// //     .full-size-grid { width: 100%; height: 100%; display: block; }

// //     /* LIST CONTAINERS (Top Sellers / Leaderboard) */
// //     .list-container { display: flex; flex-direction: column; gap: var(--spacing-md); }

// //     .list-item {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       padding-bottom: var(--spacing-sm);
// //       border-bottom: 1px solid var(--border-secondary);
// //     }
// //     .list-item:last-child { border-bottom: none; padding-bottom: 0; }
// //     .staff-item { padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--border-primary); }

// //     .item-left { display: flex; align-items: center; gap: var(--spacing-md); }

// //     .rank-box {
// //       width: 2rem; height: 2rem;
// //       background: var(--bg-ternary);
// //       border-radius: var(--ui-border-radius);
// //       display: flex; align-items: center; justify-content: center;
// //       font-size: var(--font-size-xs); font-weight: bold; color: var(--accent-primary);
// //     }

// //     .avatar-circle {
// //       width: 2rem; height: 2rem;
// //       border-radius: 50%;
// //       background: var(--accent-gradient);
// //       display: flex; align-items: center; justify-content: center;
// //       font-size: 10px; font-weight: bold; color: #fff;
// //     }

// //     .item-info { display: flex; flex-direction: column; }
// //     .item-name { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
// //     .item-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }

// //     .item-value { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); }
// //     .item-value.success { color: var(--color-success); }

// //     /* LOADER */
// //     .loader-container {
// //       height: 60vh;
// //       display: flex;
// //       flex-direction: column;
// //       align-items: center;
// //       justify-content: center;
// //       gap: var(--spacing-md);
// //     }
// //     .loader-text {
// //       font-size: var(--font-size-sm);
// //       color: var(--text-tertiary);
// //     }
// //   `]
// // })
// // export class DashboardUI implements OnInit {
// //   dashboard = signal<any>(null);
// //   loading = signal<boolean>(true);
// //   alertColumns: any[] = [];
// //   customerColumns: any[] = [];

// //   constructor(
// //     private analyticsService: AdminAnalyticsService,
// //     public commonService: CommonMethodService,
// //     private cdr: ChangeDetectorRef
// //   ) {}

// //   ngOnInit() {
// //     this.setupColumns();
// //     this.loadDashboard();
// //   }

// //   setupColumns(): void {
// //     // 1. Alert Columns
// //     this.alertColumns = [
// //       {
// //         field: 'name', 
// //         headerName: 'Product', 
// //         sortable: true, 
// //         flex: 1,
// //         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-size': 'var(--font-size-sm)', 'display': 'flex', 'align-items': 'center' }
// //       },
// //       {
// //         field: 'currentStock', 
// //         headerName: 'Stock', 
// //         sortable: true, 
// //         width: 100,
// //         cellStyle: { 'color': 'var(--color-error)', 'font-family': 'var(--font-mono)', 'font-weight': 'bold', 'display': 'flex', 'align-items': 'center' }
// //       },
// //       {
// //         field: 'reorderLevel', 
// //         headerName: 'Level', 
// //         sortable: true, 
// //         width: 100,
// //         cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)', 'display': 'flex', 'align-items': 'center' }
// //       },
// //       {
// //         field: 'urgency', 
// //         headerName: 'Urgency', 
// //         sortable: true, 
// //         width: 100,
// //         cellRenderer: (params: any) => {
// //           // Centered vertically
// //           return `<div style="display: flex; align-items: center; height: 100%;">
// //                     <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; background: var(--color-error); color: #fff;">
// //                       ${params.value || 'HIGH'}
// //                     </span>
// //                   </div>`;
// //         }
// //       }
// //     ];

// //     // 2. Customer Columns (UPDATED FOR SINGLE ROW LOOK)
// //     this.customerColumns = [
// //       {
// //         field: 'name',
// //         headerName: 'Customer',
// //         sortable: true,
// //         flex: 1,
// //         cellRenderer: (params: any) => {
// //             // Using flex-row with a pipe separator to keep it on one line (Single Row)
// //              return `<div style="display: flex; align-items: center; height: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
// //                         <span style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-sm); margin-right: 6px;">${params.value}</span>
// //                         <span style="font-size: 10px; color: var(--text-tertiary);">| ${params.data.phone || ''}</span>
// //                      </div>`
// //         }
// //       },
// //       {
// //         field: 'totalSpent',
// //         headerName: 'Spent',
// //         sortable: true,
// //         width: 120,
// //         type: 'rightAligned',
// //         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
// //         cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'justify-content': 'flex-end', 'display': 'flex', 'align-items': 'center' }
// //       },
// //       {
// //         field: 'transactions',
// //         headerName: 'Txns',
// //         sortable: true,
// //         width: 70,
// //         cellStyle: { 'text-align': 'center', 'color': 'var(--text-secondary)', 'justify-content': 'center', 'display': 'flex', 'align-items': 'center' }
// //       }
// //     ];

// //     this.cdr.detectChanges();
// //   }

// //   loadDashboard() {
// //     this.loading.set(true);
// //     this.analyticsService.getDashboardOverview().subscribe({
// //       next: (res) => {
// //         if (res.status === 'success') {
// //           this.dashboard.set(res.data);
// //         }
// //         this.loading.set(false);
// //       },
// //       error: (err) => {
// //         console.error('Dashboard Error', err);
// //         this.loading.set(false);
// //       }
// //     });
// //   }
// // }
