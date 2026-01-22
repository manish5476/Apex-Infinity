import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
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

@Component({
  selector: 'app-admin-dashboard-Ui',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    TagModule, 
    TooltipModule, 
    ProgressSpinnerModule, 
    ToastModule,
    AgShareGrid
  ],
  template: `
    <div class="dashboard-container">
          
      <div class="header-section">
        <div>
          <h1 class="page-title">Executive Overview</h1>
          <p class="page-subtitle">
            Analyzing {{ dashboard()?.period?.days }} days of performance for Shivam Electronics
          </p>
        </div>
        <div class="header-actions">
          <div class="health-badge">
            <span class="health-label">HEALTH SCORE</span>
            <span class="health-value">{{ dashboard()?.inventory?.healthScore }}%</span>
          </div>
          <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="kpi-grid">
          <div class="kpi-card revenue">
            <div class="kpi-header">
              <span class="kpi-label">Total Revenue</span>
              <i class="pi pi-wallet kpi-icon"></i>
            </div>
            <div class="kpi-body">
              <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalRevenue?.value | number:'1.0-0' }}</h2>
              <span class="trend-badge success">
                <i class="pi pi-arrow-up-right"></i> {{ dashboard()?.financial?.totalRevenue?.growth }}%
              </span>
            </div>
            <p class="kpi-footer">Avg Ticket: ₹{{ dashboard()?.financial?.totalRevenue?.avgTicket | number:'1.0-0' }}</p>
          </div>

          <div class="kpi-card profit">
            <div class="kpi-header">
              <span class="kpi-label">Net Profit</span>
              <i class="pi pi-chart-line kpi-icon success"></i>
            </div>
            <h2 class="kpi-value success">₹{{ dashboard()?.financial?.netProfit?.value | number:'1.0-0' }}</h2>
            <div class="kpi-meta">
              <span class="pill-badge success">Margin {{ dashboard()?.financial?.netProfit?.margin }}%</span>
            </div>
          </div>

          <div class="kpi-card expenses">
            <div class="kpi-header">
              <span class="kpi-label">Total Expenses</span>
              <i class="pi pi-minus-circle kpi-icon error"></i>
            </div>
            <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalExpense?.value | number }}</h2>
            <p class="kpi-footer">{{ dashboard()?.financial?.totalExpense?.count }} Transactions recorded</p>
          </div>

          <div class="kpi-card inventory">
            <div class="kpi-header">
              <span class="kpi-label">Inventory Value</span>
              <i class="pi pi-box kpi-icon info"></i>
            </div>
            <h2 class="kpi-value">₹{{ (dashboard()?.inventory?.summary?.valuation / 10000000) | number:'1.2-2' }} Cr</h2>
            <p class="kpi-footer">{{ dashboard()?.inventory?.inventoryValuation?.totalItems }} Units in Stock</p>
          </div>
        </div>

        <div class="layout-grid">
          
          <div class="main-column">
            
            <div class="content-card">
              <div class="card-header mb-md">
                <i class="pi pi-sparkles header-icon"></i>
                <h3 class="card-title">Operational Insights</h3>
              </div>
              <div class="insights-grid">
                @for (insight of dashboard()?.insights?.insights; track insight.title) {
                  <div class="insight-item" [class.positive]="insight.type === 'positive'" [class.neutral]="insight.type !== 'positive'">
                    <p class="insight-title">{{ insight.title }}</p>
                    <p class="insight-message">{{ insight.message }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="grid-card fixed-height-grid">
              <div class="grid-header">
                <h3 class="grid-title">Critical Inventory Alerts</h3>
                <span class="action-badge error">{{ dashboard()?.alerts?.lowStockCount }} ACTIONS REQUIRED</span>
              </div>
              
              <div class="grid-wrapper">
                 <app-ag-share-grid 
                   [columns]="alertColumns" 
                   [data]="dashboard()?.inventory?.lowStockAlerts || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>

            <div class="grid-card fixed-height-grid">
              <div class="grid-header">
                <h3 class="grid-title">Top Customers</h3>
                <span class="header-meta">By Revenue</span>
              </div>
              
              <div class="grid-wrapper">
                 <app-ag-share-grid 
                   [columns]="customerColumns" 
                   [data]="dashboard()?.leaders?.topCustomers || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>

          </div>

          <div class="side-column">
            
            <div class="content-card">
              <h4 class="card-subtitle mb-md">Top Sellers</h4>
              <div class="list-container">
                @for (prod of dashboard()?.leaders?.topProducts; track prod._id) {
                  <div class="list-item">
                    <div class="item-left">
                      <div class="rank-box">#{{ $index + 1 }}</div>
                      <div class="item-info">
                        <p class="item-name" title="{{ prod.name }}">{{ prod.name }}</p>
                        <p class="item-sub">Qty: {{ prod.soldQty }}</p>
                      </div>
                    </div>
                    <span class="item-value">₹{{ prod.revenue | number }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="content-card">
              <h4 class="card-subtitle mb-md">Sales Leaderboard</h4>
              <div class="list-container">
                @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
                  <div class="list-item staff-item">
                    <div class="item-left">
                      <div class="avatar-circle">
                        {{ staff.name.charAt(0) }}
                      </div>
                      <div class="item-info">
                        <p class="item-name">{{ staff.name }}</p>
                        <p class="item-sub">{{ staff.count }} deals closed</p>
                      </div>
                    </div>
                    <span class="item-value success">₹{{ staff.revenue | number }}</span>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" fill="transparent" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Compiling executive data...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .dashboard-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* HEADER */
    .header-section {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .page-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-family: var(--font-heading);
      letter-spacing: -0.02em;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

    .health-badge {
      padding: var(--spacing-xs) var(--spacing-md);
      border: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    .health-label { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-label); }
    .health-value { font-size: var(--font-size-md); font-weight: bold; color: var(--color-success); }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    /* KPI CARDS */
    .kpi-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
      transition: var(--transition-base);
      display: flex;
      flex-direction: column;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: var(--border-secondary); }

    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
    .kpi-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-label); }
    .kpi-icon { color: var(--accent-primary); font-size: 1rem; }
    .kpi-icon.success { color: var(--color-success); }
    .kpi-icon.error { color: var(--color-error); }
    .kpi-icon.info { color: var(--color-info); }

    .kpi-body { display: flex; items-align: flex-end; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); }
    
    .kpi-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-family: var(--font-heading);
      margin: 0;
      line-height: 1;
    }
    .kpi-value.success { color: var(--color-success); }

    .trend-badge { font-size: var(--font-size-xs); font-weight: bold; display: flex; align-items: center; gap: 2px; }
    .trend-badge.success { color: var(--color-success); }

    .kpi-footer { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: auto; }

    .kpi-meta { margin-top: var(--spacing-sm); }
    .pill-badge { font-size: var(--font-size-xs); font-weight: bold; padding: 2px 8px; border-radius: 4px; }
    .pill-badge.success { background: var(--color-success-bg); color: var(--color-success); }

    /* LAYOUT GRID */
    .layout-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media(min-width: 1024px) {
      .layout-grid { grid-template-columns: 2fr 1fr; }
    }

    .main-column, .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

    /* SHARED CARD STYLES */
    .content-card, .grid-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
    }

    .card-header { display: flex; items-align: center; gap: var(--spacing-sm); }
    .header-icon { color: var(--accent-primary); }
    .mb-md { margin-bottom: var(--spacing-md); }

    .card-title { font-size: var(--font-size-md); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; letter-spacing: -0.01em; }
    .card-subtitle { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; letter-spacing: 0.05em; }

    /* INSIGHTS GRID */
    .insights-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
    @media(min-width: 768px) {
      .insights-grid { grid-template-columns: 1fr 1fr; }
    }

    .insight-item {
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius-lg);
      background: var(--bg-ternary);
      border: 1px solid var(--border-secondary);
      border-left-width: 4px;
    }
    .insight-item.positive { border-left-color: var(--color-success); }
    .insight-item.neutral { border-left-color: var(--color-info); }

    .insight-title { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0 0 4px 0; }
    .insight-message { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; line-height: 1.4; }

    /* GRID CARD (AgGrid Wrapper) */
    /* FIXED HEIGHT FOR SCROLLING: This forces the scrollbar to appear */
    .fixed-height-grid { 
        height: 400px; 
        padding: 0; 
        overflow: hidden; 
        display: flex; 
        flex-direction: column; 
    }
    
    .grid-header {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0; /* Ensures header doesn't shrink when scrolling happens */
    }

    .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .header-meta { font-size: 10px; color: var(--text-tertiary); }
    
    .action-badge { 
      font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 99px; 
    }
    .action-badge.error { background: var(--color-error-bg); color: var(--color-error); }

    .grid-wrapper { 
        flex: 1; 
        width: 100%;
        overflow: hidden; /* Needed for Grid Internal Scroll */
        position: relative; 
    }
    
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* LIST CONTAINERS (Top Sellers / Leaderboard) */
    .list-container { display: flex; flex-direction: column; gap: var(--spacing-md); }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--border-secondary);
    }
    .list-item:last-child { border-bottom: none; padding-bottom: 0; }
    .staff-item { padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--border-primary); }

    .item-left { display: flex; align-items: center; gap: var(--spacing-md); }

    .rank-box {
      width: 2rem; height: 2rem;
      background: var(--bg-ternary);
      border-radius: var(--ui-border-radius);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xs); font-weight: bold; color: var(--accent-primary);
    }

    .avatar-circle {
      width: 2rem; height: 2rem;
      border-radius: 50%;
      background: var(--accent-gradient);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: bold; color: #fff;
    }

    .item-info { display: flex; flex-direction: column; }
    .item-name { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .item-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }

    .item-value { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); }
    .item-value.success { color: var(--color-success); }

    /* LOADER */
    .loader-container {
      height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
    }
  `]
})
export class DashboardUI implements OnInit {
  dashboard = signal<any>(null);
  loading = signal<boolean>(true);
  alertColumns: any[] = [];
  customerColumns: any[] = [];

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
    // 1. Alert Columns
    this.alertColumns = [
      {
        field: 'name', 
        headerName: 'Product', 
        sortable: true, 
        flex: 1,
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-size': 'var(--font-size-sm)', 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'currentStock', 
        headerName: 'Stock', 
        sortable: true, 
        width: 100,
        cellStyle: { 'color': 'var(--color-error)', 'font-family': 'var(--font-mono)', 'font-weight': 'bold', 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'reorderLevel', 
        headerName: 'Level', 
        sortable: true, 
        width: 100,
        cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)', 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'urgency', 
        headerName: 'Urgency', 
        sortable: true, 
        width: 100,
        cellRenderer: (params: any) => {
          // Centered vertically
          return `<div style="display: flex; align-items: center; height: 100%;">
                    <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; background: var(--color-error); color: #fff;">
                      ${params.value || 'HIGH'}
                    </span>
                  </div>`;
        }
      }
    ];

    // 2. Customer Columns (UPDATED FOR SINGLE ROW LOOK)
    this.customerColumns = [
      {
        field: 'name',
        headerName: 'Customer',
        sortable: true,
        flex: 1,
        cellRenderer: (params: any) => {
            // Using flex-row with a pipe separator to keep it on one line (Single Row)
             return `<div style="display: flex; align-items: center; height: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <span style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-sm); margin-right: 6px;">${params.value}</span>
                        <span style="font-size: 10px; color: var(--text-tertiary);">| ${params.data.phone || ''}</span>
                     </div>`
        }
      },
      {
        field: 'totalSpent',
        headerName: 'Spent',
        sortable: true,
        width: 120,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'justify-content': 'flex-end', 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'transactions',
        headerName: 'Txns',
        sortable: true,
        width: 70,
        cellStyle: { 'text-align': 'center', 'color': 'var(--text-secondary)', 'justify-content': 'center', 'display': 'flex', 'align-items': 'center' }
      }
    ];

    this.cdr.detectChanges();
  }

  loadDashboard() {
    this.loading.set(true);
    this.analyticsService.getDashboardOverview().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.dashboard.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard Error', err);
        this.loading.set(false);
      }
    });
  }
}

// import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
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

// @Component({
//   selector: 'app-admin-dashboard-Ui',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     FormsModule, 
//     ButtonModule, 
//     TagModule, 
//     TooltipModule, 
//     ProgressSpinnerModule, 
//     ToastModule,
//     AgShareGrid
//   ],
//   template: `
//     <div class="dashboard-container">
         
//       <div class="header-section">
//         <div>
//           <h1 class="page-title">Executive Overview</h1>
//           <p class="page-subtitle">
//             Analyzing {{ dashboard()?.period?.days }} days of performance for Shivam Electronics
//           </p>
//         </div>
//         <div class="header-actions">
//           <div class="health-badge">
//             <span class="health-label">HEALTH SCORE</span>
//             <span class="health-value">{{ dashboard()?.inventory?.healthScore }}%</span>
//           </div>
//           <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="kpi-grid">
          
//           <div class="kpi-card revenue">
//             <div class="kpi-header">
//               <span class="kpi-label">Total Revenue</span>
//               <i class="pi pi-wallet kpi-icon"></i>
//             </div>
//             <div class="kpi-body">
//               <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalRevenue?.value | number:'1.0-0' }}</h2>
//               <span class="trend-badge success">
//                 <i class="pi pi-arrow-up-right"></i> {{ dashboard()?.financial?.totalRevenue?.growth }}%
//               </span>
//             </div>
//             <p class="kpi-footer">Avg Ticket: ₹{{ dashboard()?.financial?.totalRevenue?.avgTicket | number:'1.0-0' }}</p>
//           </div>

//           <div class="kpi-card profit">
//             <div class="kpi-header">
//               <span class="kpi-label">Net Profit</span>
//               <i class="pi pi-chart-line kpi-icon success"></i>
//             </div>
//             <h2 class="kpi-value success">₹{{ dashboard()?.financial?.netProfit?.value | number:'1.0-0' }}</h2>
//             <div class="kpi-meta">
//               <span class="pill-badge success">Margin {{ dashboard()?.financial?.netProfit?.margin }}%</span>
//             </div>
//           </div>

//           <div class="kpi-card expenses">
//             <div class="kpi-header">
//               <span class="kpi-label">Total Expenses</span>
//               <i class="pi pi-minus-circle kpi-icon error"></i>
//             </div>
//             <h2 class="kpi-value">₹{{ dashboard()?.financial?.totalExpense?.value | number }}</h2>
//             <p class="kpi-footer">{{ dashboard()?.financial?.totalExpense?.count }} Transactions recorded</p>
//           </div>

//           <div class="kpi-card inventory">
//             <div class="kpi-header">
//               <span class="kpi-label">Inventory Value</span>
//               <i class="pi pi-box kpi-icon info"></i>
//             </div>
//             <h2 class="kpi-value">₹{{ (dashboard()?.inventory?.summary?.valuation / 10000000) | number:'1.2-2' }} Cr</h2>
//             <p class="kpi-footer">{{ dashboard()?.inventory?.inventoryValuation?.totalItems }} Units in Stock</p>
//           </div>
//         </div>

//         <div class="layout-grid">
          
//           <div class="main-column">
            
//             <div class="content-card">
//               <div class="card-header mb-md">
//                 <i class="pi pi-sparkles header-icon"></i>
//                 <h3 class="card-title">Operational Insights</h3>
//               </div>
//               <div class="insights-grid">
//                 @for (insight of dashboard()?.insights?.insights; track insight.title) {
//                   <div class="insight-item" [class.positive]="insight.type === 'positive'" [class.neutral]="insight.type !== 'positive'">
//                     <p class="insight-title">{{ insight.title }}</p>
//                     <p class="insight-message">{{ insight.message }}</p>
//                   </div>
//                 }
//               </div>
//             </div>

//             <div class="grid-card">
//               <div class="grid-header">
//                 <h3 class="grid-title">Critical Inventory Alerts</h3>
//                 <span class="action-badge error">{{ dashboard()?.alerts?.lowStockCount }} ACTIONS REQUIRED</span>
//               </div>
              
//               <div class="grid-wrapper">
//                  <app-ag-share-grid 
//                    [columns]="alertColumns" 
//                    [data]="dashboard()?.inventory?.lowStockAlerts || []" 
//                    [showActions]="false" 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>
//           </div>

//           <div class="side-column">
            
//             <div class="content-card">
//               <h4 class="card-subtitle mb-md">Top Sellers</h4>
//               <div class="list-container">
//                 @for (prod of dashboard()?.leaders?.topProducts; track prod._id) {
//                   <div class="list-item">
//                     <div class="item-left">
//                       <div class="rank-box">#{{ $index + 1 }}</div>
//                       <div class="item-info">
//                         <p class="item-name" title="{{ prod.name }}">{{ prod.name }}</p>
//                         <p class="item-sub">Qty: {{ prod.soldQty }}</p>
//                       </div>
//                     </div>
//                     <span class="item-value">₹{{ prod.revenue | number }}</span>
//                   </div>
//                 }
//               </div>
//             </div>

//             <div class="grid-card customers-grid">
//               <div class="grid-header">
//                 <h3 class="grid-title">Top Customers</h3>
//                 <span class="header-meta">By Revenue</span>
//               </div>
              
//               <div class="grid-wrapper">
//                  <app-ag-share-grid 
//                    [columns]="customerColumns" 
//                    [data]="dashboard()?.leaders?.topCustomers || []" 
//                    [showActions]="false" 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>

//             <div class="content-card">
//               <h4 class="card-subtitle mb-md">Sales Leaderboard</h4>
//               <div class="list-container">
//                 @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
//                   <div class="list-item staff-item">
//                     <div class="item-left">
//                       <div class="avatar-circle">
//                         {{ staff.name.charAt(0) }}
//                       </div>
//                       <div class="item-info">
//                         <p class="item-name">{{ staff.name }}</p>
//                         <p class="item-sub">{{ staff.count }} deals closed</p>
//                       </div>
//                     </div>
//                     <span class="item-value success">₹{{ staff.revenue | number }}</span>
//                   </div>
//                 }
//               </div>
//             </div>

//           </div>
//         </div>
//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" fill="transparent" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Compiling executive data...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .dashboard-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* HEADER */
//     .header-section {
//       display: flex;
//       flex-wrap: wrap;
//       justify-content: space-between;
//       align-items: flex-end;
//       gap: var(--spacing-md);
//       margin-bottom: var(--spacing-xl);
//     }

//     .page-title {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       font-family: var(--font-heading);
//       letter-spacing: -0.02em;
//       margin: 0 0 4px 0;
//     }

//     .page-subtitle {
//       color: var(--text-tertiary);
//       font-size: var(--font-size-sm);
//       margin: 0;
//     }

//     .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

//     .health-badge {
//       padding: var(--spacing-xs) var(--spacing-md);
//       border: 1px solid var(--border-primary);
//       background: var(--bg-secondary);
//       border-radius: var(--ui-border-radius);
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//     }
//     .health-label { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-label); }
//     .health-value { font-size: var(--font-size-md); font-weight: bold; color: var(--color-success); }

//     /* KPI GRID */
//     .kpi-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-lg);
//     }

//     /* KPI CARDS */
//     .kpi-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//       display: flex;
//       flex-direction: column;
//     }
//     .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: var(--border-secondary); }

//     .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
//     .kpi-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-label); }
//     .kpi-icon { color: var(--accent-primary); font-size: 1rem; }
//     .kpi-icon.success { color: var(--color-success); }
//     .kpi-icon.error { color: var(--color-error); }
//     .kpi-icon.info { color: var(--color-info); }

//     .kpi-body { display: flex; items-align: flex-end; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); }
    
//     .kpi-value {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       font-family: var(--font-heading);
//       margin: 0;
//       line-height: 1;
//     }
//     .kpi-value.success { color: var(--color-success); }

//     .trend-badge { font-size: var(--font-size-xs); font-weight: bold; display: flex; align-items: center; gap: 2px; }
//     .trend-badge.success { color: var(--color-success); }

//     .kpi-footer { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: auto; }

//     .kpi-meta { margin-top: var(--spacing-sm); }
//     .pill-badge { font-size: var(--font-size-xs); font-weight: bold; padding: 2px 8px; border-radius: 4px; }
//     .pill-badge.success { background: var(--color-success-bg); color: var(--color-success); }

//     /* LAYOUT GRID */
//     .layout-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .layout-grid { grid-template-columns: 2fr 1fr; }
//     }

//     .main-column, .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

//     /* SHARED CARD STYLES */
//     .content-card, .grid-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-lg);
//     }

//     .card-header { display: flex; items-align: center; gap: var(--spacing-sm); }
//     .header-icon { color: var(--accent-primary); }
//     .mb-md { margin-bottom: var(--spacing-md); }

//     .card-title { font-size: var(--font-size-md); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; letter-spacing: -0.01em; }
//     .card-subtitle { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; letter-spacing: 0.05em; }

//     /* INSIGHTS GRID */
//     .insights-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-md);
//     }
//     @media(min-width: 768px) {
//       .insights-grid { grid-template-columns: 1fr 1fr; }
//     }

//     .insight-item {
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius-lg);
//       background: var(--bg-ternary);
//       border: 1px solid var(--border-secondary);
//       border-left-width: 4px;
//     }
//     .insight-item.positive { border-left-color: var(--color-success); }
//     .insight-item.neutral { border-left-color: var(--color-info); }

//     .insight-title { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0 0 4px 0; }
//     .insight-message { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; line-height: 1.4; }

//     /* GRID CARD (AgGrid Wrapper) */
//     .grid-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; min-height: 350px; }
    
//     .grid-header {
//       padding: var(--spacing-md) var(--spacing-lg);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-ternary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
//     .header-meta { font-size: 10px; color: var(--text-tertiary); }
    
//     .action-badge { 
//       font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 99px; 
//     }
//     .action-badge.error { background: var(--color-error-bg); color: var(--color-error); }

//     .grid-wrapper { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }
    
//     /* Customers Grid specific height */
//     .customers-grid { min-height: 400px; }

//     /* LIST CONTAINERS (Top Sellers / Leaderboard) */
//     .list-container { display: flex; flex-direction: column; gap: var(--spacing-md); }

//     .list-item {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding-bottom: var(--spacing-sm);
//       border-bottom: 1px solid var(--border-secondary);
//     }
//     .list-item:last-child { border-bottom: none; padding-bottom: 0; }
//     .staff-item { padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--border-primary); }

//     .item-left { display: flex; align-items: center; gap: var(--spacing-md); }

//     .rank-box {
//       width: 2rem; height: 2rem;
//       background: var(--bg-ternary);
//       border-radius: var(--ui-border-radius);
//       display: flex; align-items: center; justify-content: center;
//       font-size: var(--font-size-xs); font-weight: bold; color: var(--accent-primary);
//     }

//     .avatar-circle {
//       width: 2rem; height: 2rem;
//       border-radius: 50%;
//       background: var(--accent-gradient);
//       display: flex; align-items: center; justify-content: center;
//       font-size: 10px; font-weight: bold; color: #fff;
//     }

//     .item-info { display: flex; flex-direction: column; }
//     .item-name { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
//     .item-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }

//     .item-value { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); }
//     .item-value.success { color: var(--color-success); }

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
//     }
//   `]
// })
// export class DashboardUI implements OnInit {
//   dashboard = signal<any>(null);
//   loading = signal<boolean>(true);
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
//     // 1. Alert Columns
//     this.alertColumns = [
//       {
//         field: 'name', 
//         headerName: 'Product', 
//         sortable: true, 
//         flex: 1,
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-size': 'var(--font-size-sm)' }
//       },
//       {
//         field: 'currentStock', 
//         headerName: 'Stock', 
//         sortable: true, 
//         width: 100,
//         cellStyle: { 'color': 'var(--color-error)', 'font-family': 'var(--font-mono)', 'font-weight': 'bold' }
//       },
//       {
//         field: 'reorderLevel', 
//         headerName: 'Threshold', 
//         sortable: true, 
//         width: 110,
//         cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)' }
//       },
//       {
//         field: 'urgency', 
//         headerName: 'Urgency', 
//         sortable: true, 
//         width: 100,
//         cellRenderer: (params: any) => {
//           return `<span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; background: var(--color-error); color: #fff;">
//                     ${params.value || 'HIGH'}
//                   </span>`;
//         }
//       }
//     ];

//     // 2. Customer Columns
//     this.customerColumns = [
//       {
//         field: 'name',
//         headerName: 'Customer',
//         sortable: true,
//         flex: 1,
//         cellRenderer: (params: any) => {
//              return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
//                         <span style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-sm); line-height: 1.2;">${params.value}</span>
//                         <span style="font-size: 10px; color: var(--text-tertiary);">${params.data.phone || ''}</span>
//                      </div>`
//         }
//       },
//       {
//         field: 'totalSpent',
//         headerName: 'Total Spent',
//         sortable: true,
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'text-align': 'right' }
//       },
//       {
//         field: 'transactions',
//         headerName: 'Txns',
//         sortable: true,
//         width: 70,
//         cellStyle: { 'text-align': 'center', 'color': 'var(--text-secondary)' }
//       }
//     ];

//     this.cdr.detectChanges();
//   }

//   loadDashboard() {
//     this.loading.set(true);
//     this.analyticsService.getDashboardOverview().subscribe({
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
// }
