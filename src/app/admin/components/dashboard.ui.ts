import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';

// Services & Shared
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { MasterListService } from '../../core/services/master-list.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-admin-dashboard-Ui', // KEPT YOUR SELECTOR
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TagModule, TooltipModule, 
    SelectModule, DatePicker, ProgressSpinnerModule, ToastModule, AgShareGrid
  ],
  template: `
<div class="dashboard-container">
  <div class="filter-wrapper glass-panel">
    <div class="filter-group">
      <div class="brand-indicator">
        <span class="dot"></span>
        <span class="brand-text">NexusBoard</span>
      </div>
      <div class="separator"></div>
      <div class="filter-box">
        <label>Operational Branch</label>
        <p-select appendTo="body" [options]="masterList.branches()" optionLabel="name" optionValue="_id" 
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
      <div class="execution-time" *ngIf="dashboard()?.financial?.performance?.executionTime">
        <i class="pi pi-bolt"></i> {{ dashboard()?.financial?.performance?.executionTime }}
      </div>
      <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
    </div>
  </div>

  <div class="header-section">
    <div class="title-group">
      <h1 class="page-title">Executive Dashboard</h1>
      <p class="page-subtitle">
        <i class="pi pi-calendar"></i>
        Period: {{ dashboard()?.period?.start | date:'mediumDate' }} - {{ dashboard()?.period?.end | date:'mediumDate' }} 
        <span class="days-badge">({{ dashboard()?.period?.days }} Days)</span>
      </p>
    </div>
    <div class="health-summary" *ngIf="dashboard()?.inventory">
      <div class="health-stat">
        <span class="label">System Health</span>
        <div class="health-ring">
           <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="circle" [attr.stroke-dasharray]="dashboard()?.inventory?.healthScore + ', 100'" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
           </svg>
           <span class="value">{{ dashboard()?.inventory?.healthScore }}%</span>
        </div>
      </div>
    </div>
  </div>

  <ng-container *ngIf="!loading(); else loader">
    
    <div class="kpi-grid">
      <div class="kpi-card glass-panel">
        <div class="kpi-header">
          <span class="kpi-label">Gross Revenue</span>
          <span class="trend-pill positive"><i class="pi pi-arrow-up-right"></i> {{ dashboard()?.financial?.totalRevenue?.growth }}%</span>
        </div>
        <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalRevenue?.value | number }}</h2>
        <p class="kpi-subtext">{{ dashboard()?.financial?.totalRevenue?.count }} Transactions processed</p>
      </div>

      <div class="kpi-card glass-panel">
        <div class="kpi-header">
          <span class="kpi-label">Net Profit</span>
          <p-tag [severity]="dashboard()?.financial?.netProfit?.status === 'profitable' ? 'success' : 'danger'" 
                 [value]="dashboard()?.financial?.netProfit?.status"></p-tag>
        </div>
        <h2 class="kpi-value success">₹{{ dashboard()?.financial?.netProfit?.value | number }}</h2>
        <p class="kpi-subtext">Net Margin: {{ dashboard()?.financial?.netProfit?.margin }}%</p>
      </div>

      <div class="kpi-card glass-panel">
        <div class="kpi-header">
          <span class="kpi-label">Inventory Value</span>
          <i class="pi pi-box icon-faded"></i>
        </div>
        <h2 class="kpi-value">₹{{ dashboard()?.leaders?.summary?.valuation | number:'1.0-0' }}</h2>
        <p class="kpi-subtext">{{ dashboard()?.leaders?.inventoryValuation?.totalItems }} Items / {{ dashboard()?.leaders?.inventoryValuation?.productCount }} SKUs</p>
      </div>

      <div class="kpi-card glass-panel">
        <div class="kpi-header">
          <span class="kpi-label">Outstanding Debt</span>
          <i class="pi pi-exclamation-circle error-text"></i>
        </div>
        <h2 class="kpi-value error">₹{{ dashboard()?.financial?.outstanding?.receivables | number }}</h2>
        <p class="kpi-subtext">{{ dashboard()?.topCategories?.highRiskDebtCount }} High-Risk Accounts</p>
      </div>
    </div>

    <div class="layout-grid">
      
      <div class="main-column">
        
        <div class="content-card glass-panel">
          <h3 class="card-title mb-md"><i class="pi pi-sparkles text-accent"></i> AI Business Insights</h3>
          <div class="insights-container">
            @for (insight of dashboard()?.insights?.insights; track insight.title) {
              <div class="insight-row" [class.positive]="insight.type === 'positive'">
                <div class="insight-icon"><i class="pi" [class.pi-check-circle]="insight.type==='positive'" [class.pi-info-circle]="insight.type!=='positive'"></i></div>
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
            <span class="count-pill">{{ dashboard()?.inventory?.lowStockAlerts?.length || 0 }} Critical</span>
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
              <span class="text-muted">Avg. Order Value</span>
              <span class="font-bold">₹{{ dashboard()?.operations?.orderEfficiency?.averageOrderValue | number:'1.0-0' }}</span>
            </div>
            <div class="stat-row">
              <span class="text-muted">Discount Rate</span>
              <span class="font-bold">{{ dashboard()?.operations?.discountMetrics?.discountRate }}%</span>
            </div>
            <div class="stat-row">
              <span class="text-muted">New Customers</span>
              <span class="text-success font-bold">+{{ dashboard()?.financial?.customers?.new }}</span>
            </div>
          </div>
        </div>

        <div class="content-card glass-panel">
          <h4 class="sidebar-title">Customer Segments</h4>
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
          <h4 class="sidebar-title">Top Staff</h4>
          @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
            <div class="staff-card">
              <div class="staff-avatar">{{ staff.name.charAt(0) }}</div>
              <div class="staff-info">
                <p class="s-name">{{ staff.name }}</p>
                <p class="s-sub">{{ staff.count }} Orders</p>
              </div>
              <div class="staff-value">₹{{ staff.revenue }}</div>
              <!-- | numberCompact  -->
            </div>
          }
        </div>
      </div>
    </div>
  </ng-container>

  <ng-template #loader>
    <div class="full-loader">
      <p-progressSpinner styleClass="w-3rem h-3rem" strokeWidth="3"></p-progressSpinner>
      <span class="loading-text">Synchronizing Enterprise Data...</span>
    </div>
  </ng-template>
</div>
`,
  styles: [`
  /* STRICT ENTERPRISE THEME IMPLEMENTATION 
     Uses the CSS Variables defined in your Root Token System
  */

  :host {
    display: block; /* CRITICAL FIX: Ensures component has dimensions */
    width: 100%;
    height: 100%;
  }

  .dashboard-container {
    padding: var(--spacing-xl);
    background-color: var(--bg-secondary);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--text-primary);
  }

  /* --- GLASS PANELS --- */
  .glass-panel {
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--ui-border-radius-lg);
    box-shadow: var(--shadow-sm);
    /* Optional real glass effect if supported */
    /* backdrop-filter: blur(10px); */ 
  }

  /* --- HEADER & FILTERS --- */
  .filter-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    
    .filter-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
    }

    .brand-indicator {
      display: flex; align-items: center; gap: 8px;
      .dot { width: 8px; height: 8px; background: var(--accent-primary); border-radius: 50%; box-shadow: 0 0 8px var(--accent-primary); }
      .brand-text { font-weight: 700; font-family: var(--font-heading); font-size: 16px; }
    }

    .separator { height: 24px; width: 1px; background: var(--border-secondary); }

    .filter-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      label {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }

  .header-actions {
    display: flex; align-items: center; gap: var(--spacing-lg);
    .execution-time { 
      font-family: var(--font-mono); 
      font-size: 11px; 
      color: var(--text-tertiary); 
      background: var(--bg-secondary); 
      padding: 4px 8px; 
      border-radius: 4px; 
    }
  }

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--spacing-xl);

    .page-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl);
      font-weight: 700;
      margin: 0 0 4px 0;
      color: var(--text-primary);
    }
    .page-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      display: flex; align-items: center; gap: 6px;
      .days-badge { background: var(--bg-ternary); padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    }
  }

  /* --- HEALTH RING ANIMATION --- */
  .health-stat {
    text-align: center;
    .label { display: block; font-size: 10px; font-weight: 800; color: var(--text-tertiary); margin-bottom: 4px; text-transform: uppercase; }
    .health-ring { position: relative; width: 48px; height: 48px; }
    .circular-chart { display: block; margin: 0 auto; max-width: 100%; max-height: 100%; }
    .circle-bg { fill: none; stroke: var(--bg-ternary); stroke-width: 3.8; }
    .circle { fill: none; stroke-width: 2.8; stroke: var(--color-success); stroke-linecap: round; animation: progress 1s ease-out forwards; }
    .value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; font-weight: 800; color: var(--text-primary); }
  }

  /* --- KPI GRID --- */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
    
    @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 768px) { grid-template-columns: 1fr; }
  }

  .kpi-card {
    padding: var(--spacing-lg);
    transition: transform 0.2s ease;
    
    &:hover { transform: translateY(-2px); border-color: var(--accent-focus); }

    .kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
    .kpi-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-family: var(--font-heading); font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; color: var(--text-primary); }
    .kpi-value.success { color: var(--color-success); }
    .kpi-value.error { color: var(--color-error); }
    .kpi-subtext { font-size: 11px; color: var(--text-tertiary); margin-top: 6px; }
    
    .trend-pill { 
      padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px;
      &.positive { background: var(--color-success-bg); color: var(--color-success); }
    }
  }

  /* --- MAIN LAYOUT --- */
  .layout-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--spacing-lg);
    
    @media (max-width: 1024px) { grid-template-columns: 1fr; }
  }

  .main-column, .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
  .content-card, .grid-card { padding: var(--spacing-lg); }
  
  .card-title { 
    font-size: 14px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px; 
    color: var(--text-primary);
  }
  .mb-md { margin-bottom: var(--spacing-md); }
  .text-accent { color: var(--accent-primary); }

  /* --- INSIGHTS --- */
  .insight-row {
    display: flex; gap: var(--spacing-md); padding: 12px; 
    background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;
    border-left: 3px solid var(--color-info);
    
    &.positive { border-left-color: var(--color-success); background: color-mix(in srgb, var(--color-success-bg), white 50%); }
    
    .insight-icon { margin-top: 2px; color: var(--text-secondary); }
    .i-title { font-weight: 700; font-size: 12px; margin: 0 0 2px 0; display: flex; justify-content: space-between; }
    .i-msg { font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4; }
    .priority-tag { font-size: 9px; text-transform: uppercase; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); }
  }

  /* --- GRID WRAPPER --- */
  .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
  .count-pill { background: var(--color-error); color: white; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
  .grid-wrapper { height: 300px; /* Essential for AgGrid */ }

  /* --- SIDEBAR WIDGETS --- */
  .sidebar-title { 
    font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); 
    margin: 0 0 var(--spacing-lg) 0; border-bottom: 1px solid var(--border-secondary); padding-bottom: 8px; 
  }

  .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-secondary); font-size: 13px; }
  .text-muted { color: var(--text-secondary); }
  .font-bold { font-weight: 600; }
  .text-success { color: var(--color-success); }

  .seg-pill {
    display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; 
    background: var(--bg-secondary); border-radius: 6px; margin-bottom: 6px;
    .seg-name { font-size: 12px; font-weight: 600; }
    .seg-count { background: var(--accent-primary); color: #fff; font-size: 10px; padding: 1px 8px; border-radius: 10px; font-weight: 700; }
  }

  .staff-card {
    display: flex; align-items: center; padding: 8px; gap: 10px; border-bottom: 1px solid var(--bg-secondary);
    .staff-avatar { width: 32px; height: 32px; background: var(--bg-secondary); border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: var(--text-secondary); }
    .staff-info { flex: 1; }
    .s-name { font-weight: 700; font-size: 12px; margin: 0; }
    .s-sub { font-size: 10px; color: var(--text-tertiary); margin: 0; }
    .staff-value { font-weight: 700; color: var(--color-success); font-size: 12px; font-family: var(--font-mono); }
  }

  /* --- LOADER --- */
  .full-loader { 
    height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); 
    .loading-text { color: var(--text-tertiary); font-weight: 600; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
  }

  /* --- PRIMENG OVERRIDES --- */
  ::ng-deep .dashboard-select .p-select-label { padding: 6px 12px; font-size: 12px; font-weight: 500; }
  ::ng-deep .dashboard-datepicker .p-inputtext { padding: 6px 12px; font-size: 12px; width: 200px; }
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
      { field: 'name', headerName: 'Inventory Item', flex: 2, cellStyle: { 'font-weight': '600' } },
      { field: 'currentStock', headerName: 'Stock', flex: 1, cellStyle: { 'color': 'var(--color-error)', 'font-weight': '800' } },
      { 
        field: 'revenue', 
        headerName: 'Potential Revenue', 
        flex: 1, 
        // Using your common service as requested
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
      },
      error: () => this.loading.set(false) // Safety turn off loader
    });
  }

  onFilterChange() { this.loadDashboard(); }
}

// import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
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
// import { MasterListService } from '../../core/services/master-list.service';

// @Component({
//   selector: 'app-admin-dashboard-Ui',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, ButtonModule, TagModule, TooltipModule, 
//     SelectModule, DatePicker, ProgressSpinnerModule, ToastModule, AgShareGrid
//   ],
//   template: `
// <div class="dashboard-container">
//   <div class="filter-wrapper glass-panel">
//     <div class="filter-group">
//       <div class="filter-box">
//         <label>Operational Branch</label>
//         <p-select appendTo="body" [options]="masterList.branches()" optionLabel="name" optionValue="_id" 
//                   [(ngModel)]="selectedBranch" (onChange)="onFilterChange()"
//                   styleClass="dashboard-select" placeholder="Select Branch"></p-select>
//       </div>
//       <div class="filter-box">
//         <label>Analysis Period</label>
//         <p-datepicker [(ngModel)]="dateRange" selectionMode="range" [showIcon]="true" 
//                     (onSelect)="onFilterChange()" placeholder="Start - End Dates"
//                     styleClass="dashboard-datepicker"></p-datepicker>
//       </div>
//     </div>
//     <div class="header-actions">
//       <div class="execution-time">Engine: {{ dashboard()?.financial?.performance?.executionTime }}</div>
//       <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
//     </div>
//   </div>

//   <div class="header-section">
//     <div class="title-group">
//       <h1 class="page-title">Executive Dashboard</h1>
//       <p class="page-subtitle">Period: {{ dashboard()?.period?.start | date }} - {{ dashboard()?.period?.end | date }} ({{ dashboard()?.period?.days }} Days)</p>
//     </div>
//     <div class="health-summary">
//       <div class="health-stat">
//         <span class="label">Inventory Health</span>
//         <span class="value success">{{ dashboard()?.inventory?.healthScore }}%</span>
//       </div>
//     </div>
//   </div>

//   <ng-container *ngIf="!loading(); else loader">
    
//     <div class="kpi-grid">
//       <div class="kpi-card revenue glass-panel">
//         <div class="kpi-header">
//           <span class="kpi-label">Gross Revenue</span>
//           <span class="trend-pill positive">+{{ dashboard()?.financial?.totalRevenue?.growth }}%</span>
//         </div>
//         <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalRevenue?.value | number }}</h2>
//         <p class="kpi-subtext">{{ dashboard()?.financial?.totalRevenue?.count }} Transactions</p>
//       </div>

//       <div class="kpi-card profit glass-panel">
//         <div class="kpi-header">
//           <span class="kpi-label">Net Profit</span>
//           <p-tag severity="success" [value]="dashboard()?.financial?.netProfit?.status"></p-tag>
//         </div>
//         <h2 class="kpi-value success">₹{{ dashboard()?.financial?.netProfit?.value | number }}</h2>
//         <p class="kpi-subtext">Margin: {{ dashboard()?.financial?.netProfit?.margin }}%</p>
//       </div>

//       <div class="kpi-card valuation glass-panel">
//         <div class="kpi-header">
//           <span class="kpi-label">Inventory Valuation</span>
//           <i class="pi pi-box"></i>
//         </div>
//         <h2 class="kpi-value">₹{{ dashboard()?.leaders?.summary?.valuation | number }}</h2>
//         <p class="kpi-subtext">{{ dashboard()?.leaders?.inventoryValuation?.totalItems }} Items across {{ dashboard()?.leaders?.inventoryValuation?.productCount }} SKUs</p>
//       </div>

//       <div class="kpi-card risk glass-panel">
//         <div class="kpi-header">
//           <span class="kpi-label">Outstanding Debt</span>
//           <i class="pi pi-exclamation-triangle error-text"></i>
//         </div>
//         <h2 class="kpi-value error">₹{{ dashboard()?.financial?.outstanding?.receivables | number }}</h2>
//         <p class="kpi-subtext">{{ dashboard()?.topCategories?.highRiskDebtCount }} High-Risk Accounts</p>
//       </div>
//     </div>

//     <div class="layout-grid">
//       <div class="main-column">
//         <div class="content-card glass-panel">
//           <h3 class="card-title mb-md"><i class="pi pi-bolt"></i> Intelligent Business Insights</h3>
//           <div class="insights-container">
//             @for (insight of dashboard()?.insights?.insights; track insight.title) {
//               <div class="insight-row" [class.positive]="insight.type === 'positive'">
//                 <div class="insight-icon"><i class="pi pi-check-circle"></i></div>
//                 <div class="insight-content">
//                   <p class="i-title">{{ insight.title }} <span class="priority-tag">{{ insight.priority }}</span></p>
//                   <p class="i-msg">{{ insight.message }}</p>
//                 </div>
//               </div>
//             }
//           </div>
//         </div>

//         <div class="grid-card glass-panel">
//           <div class="card-header-flex">
//             <h3 class="card-title">Stock Urgency Monitor</h3>
//             <span class="count-pill">{{ dashboard()?.inventory?.lowStockAlerts?.length || 0 }} Alerts</span>
//           </div>
//           <div class="grid-wrapper">
//              <app-ag-share-grid [columns]="alertColumns" [data]="dashboard()?.inventory?.lowStockAlerts || []" 
//                                [showActions]="false" class="compact-grid"></app-ag-share-grid>
//           </div>
//         </div>
//       </div>

//       <div class="side-column">
//         <div class="content-card glass-panel">
//           <h4 class="sidebar-title">Operational Efficiency</h4>
//           <div class="stat-list">
//             <div class="stat-row">
//               <span>Avg. Order Value</span>
//               <b>₹{{ dashboard()?.operations?.orderEfficiency?.averageOrderValue | number:'1.0-0' }}</b>
//             </div>
//             <div class="stat-row">
//               <span>Discount Rate</span>
//               <b>{{ dashboard()?.operations?.discountMetrics?.discountRate }}%</b>
//             </div>
//             <div class="stat-row">
//               <span>New Customers</span>
//               <span class="text-success">+{{ dashboard()?.financial?.customers?.new }}</span>
//             </div>
//           </div>
//         </div>

//         <div class="content-card glass-panel">
//           <h4 class="sidebar-title">Customer Segmentation</h4>
//           <div class="segment-pill-container">
//             @for (seg of dashboard()?.customers?.segmentation; track seg._id) {
//               <div class="seg-pill">
//                 <span class="seg-name">{{ seg._id }}</span>
//                 <span class="seg-count">{{ seg.count }}</span>
//               </div>
//             }
//           </div>
//         </div>

//         <div class="content-card glass-panel">
//           <h4 class="sidebar-title">Top Staff Performance</h4>
//           @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
//             <div class="staff-card">
//               <div class="staff-info">
//                 <p class="s-name">{{ staff.name }}</p>
//                 <p class="s-sub">{{ staff.count }} Sales handled</p>
//               </div>
//               <div class="staff-value">₹{{ staff.revenue | number }}</div>
//             </div>
//           }
//         </div>
//       </div>
//     </div>
//   </ng-container>

//   <ng-template #loader>
//     <div class="full-loader">
//       <p-progressSpinner strokeWidth="3"></p-progressSpinner>
//       <span>Syncing Financial Data...</span>
//     </div>
//   </ng-template>
// </div>
// `,
//   styles: [`
//   .dashboard-container {
//     padding: var(--spacing-xl); background: var(--bg-primary); min-height: 100vh; color: var(--text-primary);
    
//     .glass-panel {
//       background: color-mix(in srgb, var(--bg-secondary), transparent 10%);
//       backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm);
//     }

//     .filter-wrapper {
//       display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md) var(--spacing-lg); margin-bottom: var(--spacing-xl);
//       .filter-group { display: flex; gap: var(--spacing-xl); }
//       .filter-box { display: flex; flex-direction: column; gap: 4px; label { font-size: 10px; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; } }
//       .execution-time { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); margin-right: var(--spacing-md); }
//     }

//     .header-section {
//       display: flex; justify-content: space-between; margin-bottom: var(--spacing-xl);
//       .page-title { font-family: var(--font-heading); font-size: var(--font-size-3xl); font-weight: 700; margin: 0; }
//       .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }
//       .health-stat { text-align: right; .label { display: block; font-size: 10px; font-weight: 800; color: var(--text-tertiary); } .value { font-size: var(--font-size-2xl); font-weight: 900; } }
//     }

//     .kpi-grid {
//       display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);
//       @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
//     }

//     .kpi-card {
//       padding: var(--spacing-lg);
//       .kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
//       .kpi-label { font-size: 11px; font-weight: 700; color: var(--text-label); text-transform: uppercase; }
//       .kpi-value { font-size: var(--font-size-3xl); font-weight: 800; margin: 0; letter-spacing: -1px; }
//       .kpi-subtext { font-size: 10px; color: var(--text-tertiary); margin-top: 4px; }
//       .trend-pill { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 800; &.positive { background: var(--color-success-bg); color: var(--color-success); } }
//     }

//     .layout-grid { display: grid; grid-template-columns: 2.5fr 1fr; gap: var(--spacing-lg); }
//     .main-column, .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    
//     .content-card, .grid-card { padding: var(--spacing-lg); }
//     .card-title { font-size: var(--font-size-md); font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px; }

//     .insight-row {
//       display: flex; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--bg-primary); border-radius: 8px; margin-bottom: var(--spacing-sm);
//       border-left: 4px solid var(--color-info);
//       &.positive { border-left-color: var(--color-success); background: var(--color-success-bg); }
//       .i-title { font-weight: 800; font-size: var(--font-size-sm); margin: 0; display: flex; justify-content: space-between; }
//       .i-msg { font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 2px; }
//       .priority-tag { font-size: 8px; text-transform: uppercase; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px; }
//     }

//     .sidebar-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--text-label); margin-bottom: var(--spacing-lg); border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; }
//     .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-primary); font-size: var(--font-size-sm); }
    
//     .seg-pill {
//       display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm) var(--spacing-md); background: var(--bg-primary); border-radius: var(--ui-border-radius); margin-bottom: 4px;
//       .seg-name { font-size: 11px; font-weight: 600; }
//       .seg-count { background: var(--accent-primary); color: #fff; font-size: 10px; padding: 0 6px; border-radius: 10px; }
//     }

//     .staff-card {
//       display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-ternary); border-radius: 8px; margin-bottom: 6px;
//       .s-name { font-weight: 700; font-size: var(--font-size-sm); margin: 0; }
//       .s-sub { font-size: 9px; color: var(--text-muted); }
//       .staff-value { font-weight: 800; color: var(--color-success); font-size: var(--font-size-sm); }
//     }

//     .full-loader { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; font-size: 10px; }
//   }
//   `]
// })
// export class DashboardUI implements OnInit {
//   dashboard = signal<any>(null);
//   loading = signal<boolean>(true);
//   public masterList = inject(MasterListService);
  
//   selectedBranch = signal<string>('');
//   dateRange = signal<Date[] | null>(null);

//   alertColumns: any[] = [];

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
//       { field: 'name', headerName: 'Inventory Item', flex: 2, cellStyle: { 'font-weight': '700' } },
//       { field: 'currentStock', headerName: 'Stock', flex: 1, cellStyle: { 'color': 'var(--color-error)', 'font-weight': '900' } },
//       { 
//         field: 'revenue', 
//         headerName: 'Potential Revenue', 
//         flex: 1, 
//         valueFormatter: (p: any) => this.commonService.formatCurrency(p.value) 
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadDashboard() {
//     this.loading.set(true);
//     let start, end;
//     if (this.dateRange()?.length === 2) {
//       start = this.dateRange()![0]?.toISOString();
//       end = this.dateRange()![1]?.toISOString();
//     }

//     this.analyticsService.getDashboardOverview(start, end, this.selectedBranch()).subscribe({
//       next: (res) => {
//         this.dashboard.set(res.data);
//         this.loading.set(false);
//       }
//     });
//   }

//   onFilterChange() { this.loadDashboard(); }
// }