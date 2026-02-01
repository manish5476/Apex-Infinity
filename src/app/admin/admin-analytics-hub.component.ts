import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ScrollPanelModule } from 'primeng/scrollpanel';

// Component Imports
import { RealTimeMonitoringComponent } from "./components/real-time-monitoring.component";
import { FinancialTrendChartComponent } from "./components/financial-trend-chart.component";
import { SystemAuditAlertsComponent } from "./components/system-audit-alerts.component";
import { BranchComparisonComponent } from "./components/admin.branch.comparison";
import { FinancialDashboardComponent } from "./components/admin.finanical.analytics";
import { CashFlowAnalysisComponent } from "./components/admin.cashflow";
import { EmiAnalyticsComponent } from "./components/emi-analytics.component";
import { CustomerIntelligenceComponent } from "./components/customer-intelligence.component";
import { CustomerSegmentationComponent } from "./components/customer-segmentation.component";
import { CustomerLtvAnalysisComponent } from "./components/customer-ltv-analysis.component";
import { ProductPerformanceComponent } from "./components/product-performance.component";
import { DeadStockAnalysisComponent } from "./components/dead-stock-analysis.component";
import { OrderFunnelChartComponent } from "./components/order-funnel-chart.component";
import { SalesDistributionChartComponent } from "./components/sales-distribution-chart.component";
import { PredictiveAnalyticsComponent } from "./components/predictive-analytics.component";
import { SalesForecastComponent } from "./components/sales-forecast.component";
import { OperationalMetricsComponent } from "./components/operational-metrics.component";
import { PeakHoursAnalysisComponent } from "./components/peak-hours-analysis.component";
import { StaffPerformanceAnalysisComponent } from "./components/staff-performance-analysis.component";
import { BranchRadarChartComponent } from "./components/branch-radar-chart.component";
import { ComplianceDashboardComponent } from "./components/compliance-dashboard.component";
import { SystemDataHealthComponent } from "./components/system-data-health.component";
import { AnalyticsExportHubComponent } from "./components/analytics-export-hub.component";
import { TimeAnalyticsComponent } from "./components/time-analytics.component";
import { DashboardUI } from "./components/dashboard.ui";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule,SelectModule, MultiSelectModule, ButtonModule, TooltipModule,AvatarModule, ScrollPanelModule,RealTimeMonitoringComponent,FinancialTrendChartComponent,SystemAuditAlertsComponent,BranchComparisonComponent,FinancialDashboardComponent,CashFlowAnalysisComponent,EmiAnalyticsComponent,CustomerIntelligenceComponent,CustomerSegmentationComponent,CustomerLtvAnalysisComponent,ProductPerformanceComponent,DeadStockAnalysisComponent,OrderFunnelChartComponent,SalesDistributionChartComponent,PredictiveAnalyticsComponent,SalesForecastComponent,OperationalMetricsComponent,PeakHoursAnalysisComponent,StaffPerformanceAnalysisComponent,BranchRadarChartComponent,ComplianceDashboardComponent,SystemDataHealthComponent,AnalyticsExportHubComponent,TimeAnalyticsComponent, DashboardUI
  ],
   template: `
    <div class="app-layout">
      
      <header class="glass-header">
        <div class="header-content">
          
          <div class="brand-box">
             <div class="logo-circle">
                <i class="pi pi-bolt"></i>
             </div>
             <span class="brand-name">Nexus<span class="brand-highlight">Admin</span></span>
          </div>

          <div class="nav-capsule">
            <div class="nav-scroller custom-scrollbar-hidden">
              @for (comp of componentOptions; track comp.value) {
                <button 
                  class="nav-item"
                  [class.active]="selectedComponent?.value === comp.value"
                  (click)="selectedComponent = comp"
                  pTooltip="{{comp.label}}" tooltipPosition="bottom">
                  <i [class]="'pi ' + comp.icon"></i>
                  <span>{{comp.label}}</span>
                </button>
              }
            </div>
          </div>

          <div class="user-box">
             <button class="icon-btn"><i class="pi pi-bell"></i><span class="dot"></span></button>
             <p-avatar label="AD" shape="circle" styleClass="profile-avatar"></p-avatar>
          </div>

        </div>
      </header>
      
      <main class="stage-viewport">
        <div class="stage-box glass-panel">
          
          <div class="scrollable-inner custom-scrollbar">
            @switch (selectedComponent?.value) {
              
              @case ('dashboard-ui') { <app-admin-dashboard-Ui class="component-host"></app-admin-dashboard-Ui> }
              @case ('realtime') { <app-real-time-monitoring class="component-host"></app-real-time-monitoring> }
              @case ('financial-trend') { <app-financial-trend-chart class="component-host"></app-financial-trend-chart> }
              @case ('system-audit') { <app-system-audit-alerts class="component-host"></app-system-audit-alerts> }
              @case ('branch-comparison') { <app-branch-comparison class="component-host"></app-branch-comparison> }
              @case ('financial-dashboard') { <app-financial-dashboard class="component-host"></app-financial-dashboard> }
              @case ('cash-flow') { <app-cash-flow-analysis class="component-host"></app-cash-flow-analysis> }
              @case ('emi-analytics') { <app-emi-analytics class="component-host"></app-emi-analytics> }
              @case ('customer-intelligence') { <app-customer-intelligence class="component-host"></app-customer-intelligence> }
              @case ('customer-segmentation') { <app-customer-segmentation class="component-host"></app-customer-segmentation> }
              @case ('customer-ltv') { <app-customer-ltv-analysis class="component-host"></app-customer-ltv-analysis> }
              @case ('product-performance') { <app-product-performance class="component-host"></app-product-performance> }
              @case ('dead-stock') { <app-dead-stock-analysis class="component-host"></app-dead-stock-analysis> }
              @case ('order-funnel') { <app-order-funnel-chart class="component-host"></app-order-funnel-chart> }
              @case ('sales-distribution') { <app-sales-distribution-chart class="component-host"></app-sales-distribution-chart> }
              @case ('predictive-analytics') { <app-predictive-analytics class="component-host"></app-predictive-analytics> }
              @case ('sales-forecast') { <app-sales-forecast class="component-host"></app-sales-forecast> }
              @case ('operational-metrics') { <app-operational-metrics class="component-host"></app-operational-metrics> }
              @case ('peak-hours') { <app-peak-hours-analysis class="component-host"></app-peak-hours-analysis> }
              @case ('staff-performance') { <app-staff-performance-analysis class="component-host"></app-staff-performance-analysis> }
              @case ('branch-radar') { <app-branch-radar-chart class="component-host"></app-branch-radar-chart> }
              @case ('compliance-dashboard') { <app-compliance-dashboard class="component-host"></app-compliance-dashboard> }
              @case ('system-data-health') { <app-system-data-health class="component-host"></app-system-data-health> }
              @case ('analytics-export') { <app-analytics-export-hub class="component-host"></app-analytics-export-hub> }
              @case ('time-analytics') { <app-time-analytics class="component-host"></app-time-analytics> }

              @default {
                <div class="empty-state">
                   <div class="empty-content">
                      <i class="pi pi-th-large empty-icon"></i>
                      <h3>Select a Module</h3>
                      <p>Navigate using the top bar to view analytics.</p>
                   </div>
                </div>
              }
            }
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    /* =========================================
       1. GLOBAL LAYOUT (FIXED SCROLL ISSUE)
       ========================================= */
    :host {
      display: block;
      height: 100%;
      width: 100%; /* Changed from 100vw to 100% to fix scrollbar overflow */
      overflow: hidden; /* Prevent native scroll */
      box-sizing: border-box;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
    }

    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      width: 100%;
    }

    /* =========================================
       2. FLOATING GLASS HEADER
       ========================================= */
    .glass-header {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      width: 95%;
      max-width: 1600px;
      height: 64px;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 0 8px 0 24px;
      
      /* The Glass Effect */
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 99px;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
    }

    /* Brand */
    .brand-box { display: flex; align-items: center; gap: 12px; min-width: 180px; }
    .logo-circle {
       width: 32px; height: 32px; border-radius: 50%;
       background: var(--accent-gradient);
       display: flex; align-items: center; justify-content: center;
       color: #fff; font-size: 14px;
    }
    .brand-name { font-family: var(--font-heading); font-weight: 700; font-size: 16px; color: #fff; letter-spacing: -0.02em; }
    .brand-highlight { color: var(--accent-primary); }

    /* Nav Capsule (Scrollable) */
    .nav-capsule {
      flex: 1;
      margin: 0 24px;
      overflow: hidden;
      mask-image: linear-gradient(to right, transparent, black 20px, black 95%, transparent);
    }

    .nav-scroller {
      display: flex;
      align-items: center;
      gap: 4px;
      overflow-x: auto;
      padding: 4px 0;
    }
    .custom-scrollbar-hidden::-webkit-scrollbar { display: none; }

    .nav-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px;
      border-radius: 99px;
      border: 1px solid transparent;
      background: transparent;
      color: rgba(255,255,255,0.6);
      font-size: 12px; font-weight: 600;
      white-space: nowrap; cursor: pointer;
      transition: all 0.2s ease;
    }
    .nav-item:hover { color: #fff; background: rgba(255,255,255,0.05); }
    .nav-item.active {
      background: var(--bg-primary); 
      color: var(--accent-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    /* User Box */
    .user-box { display: flex; align-items: center; gap: 16px; margin-right: 8px; }
    .icon-btn { 
      background: none; border: none; color: rgba(255,255,255,0.6); 
      font-size: 1.1rem; cursor: pointer; position: relative; 
    }
    .icon-btn .dot { 
      position: absolute; top: 0; right: 0; width: 6px; height: 6px; 
      background: var(--color-error); border-radius: 50%; 
    }
    ::ng-deep .profile-avatar { background: var(--accent-primary); color: #fff; font-weight: 700; width: 36px; height: 36px; }

    /* =========================================
       3. STAGE VIEWPORT (PADDED CONTAINER)
       ========================================= */
    .stage-viewport {
      flex: 1;
      display: flex;
      justify-content: center;
      
      /* ADDED SIDE PADDING HERE (40px) to prevent edge touching */
      padding: 104px 0px 0px 0px;
      
      height: 100%;
      overflow: hidden; /* No scroll on outer viewport */
      width: 100%;
      box-sizing: border-box;
    }

    /* =========================================
       4. THE BOX CONTAINER (The "Fixed Stage")
       ========================================= */
    .stage-box {
      width: 100%;
      max-width: 1800px;
      height: 100%;
      
      /* The Box Look */
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      
      /* Content Handling */
      display: flex;
      flex-direction: column;
      overflow: hidden; /* Clips children */
      position: relative;
    }

    /* =========================================
       5. INNER SCROLL AREA (The Content)
       ========================================= */
    .scrollable-inner {
      flex: 1;
      overflow-y: auto; /* SCROLL HAPPENS HERE */
      padding: 0;
      scroll-behavior: smooth;
    }

    .component-host {
      display: block;
      animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Scrollbar Polish */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

    /* Empty State */
    .empty-state { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); text-align: center; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
  `]
})

export class AdminDashboardComponent implements OnInit, OnDestroy {
  selectedComponent: any = null;
  
  componentOptions = [
    { value: 'dashboard-ui', label: 'Executive', icon: 'pi-objects-column' },
    { value: 'realtime', label: 'Live Monitor', icon: 'pi-bolt' },
    { value: 'financial-trend', label: 'Trends', icon: 'pi-chart-line' },
    { value: 'financial-dashboard', label: 'Financials', icon: 'pi-wallet' },
    { value: 'cash-flow', label: 'Cash Flow', icon: 'pi-money-bill' },
    { value: 'order-funnel', label: 'Funnel', icon: 'pi-filter' },
    { value: 'product-performance', label: 'Products', icon: 'pi-box' },
    { value: 'dead-stock', label: 'Inventory Health', icon: 'pi-exclamation-circle' },
    { value: 'customer-intelligence', label: 'Customer 360', icon: 'pi-users' },
    { value: 'customer-segmentation', label: 'Segments', icon: 'pi-sitemap' },
    { value: 'customer-ltv', label: 'LTV Analysis', icon: 'pi-star' },
    { value: 'predictive-analytics', label: 'Predictive', icon: 'pi-brain' },
    { value: 'sales-forecast', label: 'Forecast', icon: 'pi-chart-bar' },
    { value: 'sales-distribution', label: 'Sales Mix', icon: 'pi-chart-pie' },
    { value: 'operational-metrics', label: 'Operations', icon: 'pi-cog' },
    { value: 'peak-hours', label: 'Peak Hours', icon: 'pi-clock' },
    { value: 'staff-performance', label: 'Staff Stats', icon: 'pi-user-edit' },
    { value: 'branch-radar', label: 'Radar View', icon: 'pi-compass' },
    { value: 'system-audit', label: 'Audit Logs', icon: 'pi-list-check' },
    { value: 'compliance-dashboard', label: 'Compliance', icon: 'pi-shield' },
    { value: 'system-data-health', label: 'Data Health', icon: 'pi-database' },
    { value: 'analytics-export', label: 'Export Hub', icon: 'pi-download' },
    { value: 'time-analytics', label: 'Time Analysis', icon: 'pi-calendar' },
    { value: 'branch-comparison', label: 'Branch Comp.', icon: 'pi-building' }
  ];

  constructor() { }
  
  ngOnInit() {
    this.selectedComponent = this.componentOptions[0];
  }
  
  ngOnDestroy() {}
}
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Component, OnInit, OnDestroy } from '@angular/core';

// // PrimeNG Imports
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { AvatarModule } from 'primeng/avatar';
// import { ScrollPanelModule } from 'primeng/scrollpanel';

// // Component Imports
// import { RealTimeMonitoringComponent } from "./components/real-time-monitoring.component";
// import { FinancialTrendChartComponent } from "./components/financial-trend-chart.component";
// import { SystemAuditAlertsComponent } from "./components/system-audit-alerts.component";
// import { BranchComparisonComponent } from "./components/admin.branch.comparison";
// import { FinancialDashboardComponent } from "./components/admin.finanical.analytics";
// import { CashFlowAnalysisComponent } from "./components/admin.cashflow";
// import { EmiAnalyticsComponent } from "./components/emi-analytics.component";
// import { CustomerIntelligenceComponent } from "./components/customer-intelligence.component";
// import { CustomerSegmentationComponent } from "./components/customer-segmentation.component";
// import { CustomerLtvAnalysisComponent } from "./components/customer-ltv-analysis.component";
// import { ProductPerformanceComponent } from "./components/product-performance.component";
// import { DeadStockAnalysisComponent } from "./components/dead-stock-analysis.component";
// import { OrderFunnelChartComponent } from "./components/order-funnel-chart.component";
// import { SalesDistributionChartComponent } from "./components/sales-distribution-chart.component";
// import { PredictiveAnalyticsComponent } from "./components/predictive-analytics.component";
// import { SalesForecastComponent } from "./components/sales-forecast.component";
// import { OperationalMetricsComponent } from "./components/operational-metrics.component";
// import { PeakHoursAnalysisComponent } from "./components/peak-hours-analysis.component";
// import { StaffPerformanceAnalysisComponent } from "./components/staff-performance-analysis.component";
// import { BranchRadarChartComponent } from "./components/branch-radar-chart.component";
// import { ComplianceDashboardComponent } from "./components/compliance-dashboard.component";
// import { SystemDataHealthComponent } from "./components/system-data-health.component";
// import { AnalyticsExportHubComponent } from "./components/analytics-export-hub.component";
// import { TimeAnalyticsComponent } from "./components/time-analytics.component";
// import { DashboardUI } from "./components/dashboard.ui";

// @Component({
//   selector: 'app-admin-dashboard',
//   standalone: true,
//   imports: [CommonModule, FormsModule,SelectModule, MultiSelectModule, ButtonModule, TooltipModule,AvatarModule, ScrollPanelModule,RealTimeMonitoringComponent,FinancialTrendChartComponent,SystemAuditAlertsComponent,BranchComparisonComponent,FinancialDashboardComponent,CashFlowAnalysisComponent,EmiAnalyticsComponent,CustomerIntelligenceComponent,CustomerSegmentationComponent,CustomerLtvAnalysisComponent,ProductPerformanceComponent,DeadStockAnalysisComponent,OrderFunnelChartComponent,SalesDistributionChartComponent,PredictiveAnalyticsComponent,SalesForecastComponent,OperationalMetricsComponent,PeakHoursAnalysisComponent,StaffPerformanceAnalysisComponent,BranchRadarChartComponent,ComplianceDashboardComponent,SystemDataHealthComponent,AnalyticsExportHubComponent,TimeAnalyticsComponent,     DashboardUI
//   ],
//    template: `
//     <div class="admin-layout">
      
//       <header class="dashboard-header">
//         <div class="header-inner">
          
//           <div class="tabs-wrapper">
//             <div class="tabs-scroll-area custom-scrollbar">
//               <div class="tabs-track">
//                 @for (comp of componentOptions; track comp.value) {
//                   <button 
//                     class="tab-pill"
//                     [class.active]="selectedComponent?.value === comp.value"
//                     (click)="selectedComponent = comp">
//                     <i [class]="'pi ' + comp.icon"></i>
//                     <span>{{comp.label}}</span>
//                     @if (selectedComponent?.value === comp.value) {
//                       <span class="active-indicator" ></span>
//                     }
//                   </button>
//                 }
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>
      
//       <main class="dashboard-content">
//         <div class="content-wrapper">
          
//           @switch (selectedComponent?.value) {
            
//             @case ('dashboard-ui') {
//               <app-admin-dashboard-Ui class="component-host"></app-admin-dashboard-Ui>
//             }
//             @case ('realtime') {
//               <app-real-time-monitoring class="component-host"></app-real-time-monitoring>
//             }
//             @case ('financial-trend') {
//               <app-financial-trend-chart class="component-host"></app-financial-trend-chart>
//             }
//             @case ('system-audit') {
//               <app-system-audit-alerts class="component-host"></app-system-audit-alerts>
//             }
//             @case ('branch-comparison') {
//               <app-branch-comparison class="component-host"></app-branch-comparison>
//             }
//             @case ('financial-dashboard') {
//               <app-financial-dashboard class="component-host"></app-financial-dashboard>
//             }
//             @case ('cash-flow') {
//               <app-cash-flow-analysis class="component-host"></app-cash-flow-analysis>
//             }
//             @case ('emi-analytics') {
//               <app-emi-analytics class="component-host"></app-emi-analytics>
//             }
//             @case ('customer-intelligence') {
//               <app-customer-intelligence class="component-host"></app-customer-intelligence>
//             }
//             @case ('customer-segmentation') {
//               <app-customer-segmentation class="component-host"></app-customer-segmentation>
//             }
//             @case ('customer-ltv') {
//               <app-customer-ltv-analysis class="component-host"></app-customer-ltv-analysis>
//             }
//             @case ('product-performance') {
//               <app-product-performance class="component-host"></app-product-performance>
//             }
//             @case ('dead-stock') {
//               <app-dead-stock-analysis class="component-host"></app-dead-stock-analysis>
//             }
//             @case ('order-funnel') {
//               <app-order-funnel-chart class="component-host"></app-order-funnel-chart>
//             }
//             @case ('sales-distribution') {
//               <app-sales-distribution-chart class="component-host"></app-sales-distribution-chart>
//             }
//             @case ('predictive-analytics') {
//               <app-predictive-analytics class="component-host"></app-predictive-analytics>
//             }
//             @case ('sales-forecast') {
//               <app-sales-forecast class="component-host"></app-sales-forecast>
//             }
//             @case ('operational-metrics') {
//               <app-operational-metrics class="component-host"></app-operational-metrics>
//             }
//             @case ('peak-hours') {
//               <app-peak-hours-analysis class="component-host"></app-peak-hours-analysis>
//             }
//             @case ('staff-performance') {
//               <app-staff-performance-analysis class="component-host"></app-staff-performance-analysis>
//             }
//             @case ('branch-radar') {
//               <app-branch-radar-chart class="component-host"></app-branch-radar-chart>
//             }
//             @case ('compliance-dashboard') {
//               <app-compliance-dashboard class="component-host"></app-compliance-dashboard>
//             }
//             @case ('system-data-health') {
//               <app-system-data-health class="component-host"></app-system-data-health>
//             }
//             @case ('analytics-export') {
//               <app-analytics-export-hub class="component-host"></app-analytics-export-hub>
//             }
//             @case ('time-analytics') {
//               <app-time-analytics class="component-host"></app-time-analytics>
//             }

//             @default {
//               <div class="empty-state-container">
//                 <div class="empty-content">
//                   <div class="empty-icon-circle">
//                     <i class="pi pi-chart-bar"></i>
//                   </div>
//                   <h2 class="empty-title">Analytics HQ</h2>
//                   <p class="empty-desc">Select a module from the navigation bar above to view detailed metrics, reports, and insights.</p>
                  
//                   <div class="shortcut-grid">
//                     <div class="shortcut-card" (click)="selectedComponent = componentOptions[1]">
//                       <i class="pi pi-bolt shortcut-icon"></i>
//                       <span>Live Monitor</span>
//                     </div>
//                     <div class="shortcut-card" (click)="selectedComponent = componentOptions[8]">
//                       <i class="pi pi-users shortcut-icon"></i>
//                       <span>Customers</span>
//                     </div>
//                     <div class="shortcut-card" (click)="selectedComponent = componentOptions[5]">
//                       <i class="pi pi-wallet shortcut-icon"></i>
//                       <span>Financials</span>
//                     </div>
//                     <div class="shortcut-card" (click)="selectedComponent = componentOptions[11]">
//                       <i class="pi pi-box shortcut-icon"></i>
//                       <span>Inventory</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             }

//           }
//         </div>
//       </main>
//     </div>
//   `,
//   styles: [`
//     /* ===== LAYOUT ===== */
//     :host {
//       display: block;
//       height: 100vh;
//       overflow: hidden; /* Prevent body scroll */
//       background: var(--bg-primary);
//       color: var(--text-primary);
//       font-family: var(--font-body);
//     }

//     .admin-layout {
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//     }

//     /* ===== HEADER (SOLID) ===== */
//     .dashboard-header {
//       flex-shrink: 0;
//       /* Solid Background using theme token */
//       background: var(--bg-secondary); 
//       border-bottom: 1px solid var(--border-primary);
//       position: sticky;
//       top: 0;
//       z-index: 50;
//       box-shadow: var(--shadow-sm); /* Slight shadow for separation */
//     }

//     .header-inner {
//       padding: var(--spacing-sm) var(--spacing-lg);
//     }

//     /* ===== TABS ===== */
//     .tabs-wrapper {
//       position: relative;
//     }

//     .tabs-scroll-area {
//       overflow-x: auto;
//       scrollbar-width: none; /* Firefox */
//       -ms-overflow-style: none; /* IE */
//       padding-bottom: 2px;
//     }
//     .tabs-scroll-area::-webkit-scrollbar { display: none; }

//     .tabs-track {
//       display: flex;
//       gap: var(--spacing-sm);
//       padding: var(--spacing-xs) 0;
//       min-width: max-content;
//     }

//     .tab-pill {
//       position: relative;
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       padding: 8px 16px;
//       border-radius: 99px;
//       background: transparent;
//       border: 1px solid transparent;
//       color: var(--text-secondary);
//       font-size: var(--font-size-sm);
//       font-weight: 600;
//       cursor: pointer;
//       transition: all 0.2s ease;
//     }

//     .tab-pill:hover {
//       background: var(--bg-ternary);
//       color: var(--text-primary);
//     }

//     .tab-pill.active {
//       background: var(--accent-focus); /* Low opacity accent */
//       color: var(--accent-primary);
//       border-color: var(--accent-secondary);
//     }

//     .tab-pill i { font-size: 0.9rem; }

//     /* Indicator dots for active state */
//     .active-indicator {
//       position: absolute;
//       bottom: -4px;
//       left: 50%;
//       transform: translateX(-50%);
//       width: 4px;
//       height: 4px;
//       border-radius: 50%;
//       background: var(--accent-primary);
//     }

//     /* ===== MAIN CONTENT ===== */
//     .dashboard-content {
//       flex: 1;
//       overflow-y: auto; /* Scroll internally */
//       background: var(--bg-primary);
//       position: relative;
//     }

//     .content-wrapper {
//       min-height: 100%; 
//     }

//     /* Host helper for child components */
//     .component-host {
//       display: block;
//       min-height: 100%; 
//     }

//     /* ===== EMPTY STATE ===== */
//     .empty-state-container {
//       height: 100%;
//       min-height: 70vh;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       padding: var(--spacing-2xl);
//     }

//     .empty-content {
//       text-align: center;
//       max-width: 480px;
//     }

//     .empty-icon-circle {
//       width: 80px; height: 80px;
//       border-radius: 50%;
//       background: var(--accent-gradient);
//       display: flex; align-items: center; justify-content: center;
//       margin: 0 auto var(--spacing-lg);
//       box-shadow: var(--shadow-lg);
//     }
//     .empty-icon-circle i { font-size: 2.5rem; color: #fff; }

//     .empty-title {
//       font-size: var(--font-size-2xl);
//       font-weight: bold;
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-sm);
//       letter-spacing: -0.01em;
//     }

//     .empty-desc {
//       font-size: var(--font-size-sm);
//       color: var(--text-secondary);
//       line-height: 1.5;
//       margin-bottom: var(--spacing-2xl);
//     }

//     .shortcut-grid {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: var(--spacing-md);
//     }

//     .shortcut-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-lg);
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       gap: var(--spacing-sm);
//       cursor: pointer;
//       transition: var(--transition-base);
//     }
//     .shortcut-card:hover {
//       border-color: var(--accent-primary);
//       transform: translateY(-2px);
//       background: var(--bg-ternary);
//     }

//     .shortcut-icon { font-size: 1.5rem; color: var(--accent-primary); }
//     .shortcut-card span { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-primary); }

//     /* ===== SCROLLBAR UTILITY ===== */
//     .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
//   `]
// })

// export class AdminDashboardComponent implements OnInit, OnDestroy {
//   // Currently selected single component
//   selectedComponent: any = null;
  
//   // Multiple selected components for footer
//   selectedComponents: any[] = [];
  
//   // All 25 components with metadata
//   componentOptions = [
//     { value: 'dashboard-ui', label: 'Dashboard', icon: 'pi-screen' },
//     { value: 'realtime', label: 'Real-Time Monitoring', icon: 'pi-eye' },
//     { value: 'financial-trend', label: 'Financial Trends', icon: 'pi-chart-line' },
//     { value: 'system-audit', label: 'System Audit Alerts', icon: 'pi-shield' },
//     { value: 'branch-comparison', label: 'Branch Comparison', icon: 'pi-building' },
//     { value: 'financial-dashboard', label: 'Financial Dashboard', icon: 'pi-wallet' },
//     { value: 'cash-flow', label: 'Cash Flow Analysis', icon: 'pi-money-bill' },
//     { value: 'emi-analytics', label: 'EMI Analytics', icon: 'pi-credit-card' },
//     { value: 'customer-intelligence', label: 'Customer Intelligence', icon: 'pi-user' },
//     { value: 'customer-segmentation', label: 'Customer Segmentation', icon: 'pi-sitemap' },
//     { value: 'customer-ltv', label: 'Customer LTV Analysis', icon: 'pi-star' },
//     { value: 'product-performance', label: 'Product Performance', icon: 'pi-shopping-bag' },
//     { value: 'dead-stock', label: 'Dead Stock Analysis', icon: 'pi-exclamation-circle' },
//     { value: 'order-funnel', label: 'Order Funnel Chart', icon: 'pi-filter' },
//     { value: 'sales-distribution', label: 'Sales Distribution', icon: 'pi-chart-pie' },
//     { value: 'predictive-analytics', label: 'Predictive Analytics', icon: 'pi-brain' },
//     { value: 'sales-forecast', label: 'Sales Forecast', icon: 'pi-chart-bar' },
//     { value: 'operational-metrics', label: 'Operational Metrics', icon: 'pi-cog' },
//     { value: 'peak-hours', label: 'Peak Hours Analysis', icon: 'pi-clock' },
//     { value: 'staff-performance', label: 'Staff Performance', icon: 'pi-user-edit' },
//     { value: 'branch-radar', label: 'Branch Radar Chart', icon: 'pi-radar-chart' },
//     { value: 'compliance-dashboard', label: 'Compliance Dashboard', icon: 'pi-shield' },
//     { value: 'system-data-health', label: 'System Data Health', icon: 'pi-database' },
//     { value: 'analytics-export', label: 'Analytics Export Hub', icon: 'pi-file-export' },
//     { value: 'time-analytics', label: 'Time Analytics', icon: 'pi-history' }
//   ];

//   constructor() { }
  
//   ngOnInit() {
//     // Set default component on load
//     this.selectedComponent = this.componentOptions[0];
//   }
  
//   ngOnDestroy() {
//     // Cleanup if needed
//   }

//   getSelectorStyle(): any {
//     return {
//       'width': '100%',
//       'background': 'var(--bg-secondary)',
//       'border': 'var(--ui-border-width) solid var(--border-primary)',
//       'color': 'var(--text-primary)',
//       'fontFamily': 'var(--font-body)',
//       'fontSize': 'var(--font-size-sm)'
//     };
//   }
  
//   /**
//    * View the first selected component from footer
//    */
//   viewFirstSelected(): void {
//     if (this.selectedComponents.length > 0) {
//       this.selectedComponent = this.selectedComponents[0];
//     }
//   }
  
//   /**
//    * Track component changes
//    */
//   onComponentChange(): void {
//     // Add any logic needed when component changes
//     console.log('Component changed to:', this.selectedComponent);
//   }
// }

