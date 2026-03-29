import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, signal, computed } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';

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

interface NavItem {
  value: string;
  label: string;
  icon: string;
}

interface NavCategory {
  label: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TooltipModule, AvatarModule,
    RealTimeMonitoringComponent, FinancialTrendChartComponent,
    SystemAuditAlertsComponent, BranchComparisonComponent,
    FinancialDashboardComponent, CashFlowAnalysisComponent,
    EmiAnalyticsComponent, CustomerIntelligenceComponent,
    CustomerSegmentationComponent, CustomerLtvAnalysisComponent,
    ProductPerformanceComponent, DeadStockAnalysisComponent,
    OrderFunnelChartComponent, SalesDistributionChartComponent,
    PredictiveAnalyticsComponent, SalesForecastComponent,
    OperationalMetricsComponent, PeakHoursAnalysisComponent,
    StaffPerformanceAnalysisComponent, BranchRadarChartComponent,
    ComplianceDashboardComponent, SystemDataHealthComponent,
    AnalyticsExportHubComponent, TimeAnalyticsComponent, DashboardUI
  ],
  template: `
    <div class="dash-root">

      <!-- ══════════════════════════════════
           LEFT SIDEBAR — Category navigation
      ═══════════════════════════════════ -->
      <aside class="dash-sidebar" [class.collapsed]="sidebarCollapsed()">

        <!-- Sidebar toggle -->
        <button class="sidebar-toggle" (click)="toggleSidebar()" [pTooltip]="sidebarCollapsed() ? 'Expand' : 'Collapse'" tooltipPosition="right">
          <i class="pi" [class.pi-chevron-right]="sidebarCollapsed()" [class.pi-chevron-left]="!sidebarCollapsed()"></i>
        </button>

        <!-- Nav scroll area -->
        <nav class="sidebar-nav" role="navigation">
          @for (cat of navCategories; track cat.label) {
            <div class="nav-category">

              <!-- Category header (hidden when collapsed, shown as tooltip) -->
              @if (!sidebarCollapsed()) {
                <div class="cat-label">{{ cat.label }}</div>
              }

              @for (item of cat.items; track item.value) {
                <button
                  class="nav-btn"
                  [class.active]="active() === item.value"
                  (click)="setActive(item.value)"
                  [pTooltip]="sidebarCollapsed() ? item.label : ''"
                  tooltipPosition="right">
                  <span class="nav-icon"><i class="pi {{ item.icon }}"></i></span>
                  @if (!sidebarCollapsed()) {
                    <span class="nav-text">{{ item.label }}</span>
                  }
                  @if (item.value === 'realtime') {
                    <span class="live-dot"></span>
                  }
                </button>
              }

            </div>
          }
        </nav>

      </aside>

      <!-- ══════════════════════════════════
           MAIN CONTENT AREA
      ═══════════════════════════════════ -->
      <div class="dash-main">

        <!-- Compact topbar — breadcrumb + actions only, no branding -->
        <div class="dash-topbar">
          <div class="topbar-left">
            <span class="topbar-crumb">
              <span class="crumb-cat">{{ activeCategoryLabel() }}</span>
              <i class="pi pi-angle-right crumb-sep"></i>
              <span class="crumb-page">{{ activeItemLabel() }}</span>
            </span>
          </div>
          <div class="topbar-right">
            <button class="topbar-btn" pTooltip="Notifications" tooltipPosition="bottom">
              <i class="pi pi-bell"></i>
              <span class="topbar-badge"></span>
            </button>
            <button class="topbar-btn" pTooltip="Export" tooltipPosition="bottom" (click)="setActive('analytics-export')">
              <i class="pi pi-download"></i>
            </button>
            <div class="topbar-divider"></div>
            <p-avatar label="AD" shape="circle" styleClass="topbar-avatar" pTooltip="Admin" tooltipPosition="bottom"></p-avatar>
          </div>
        </div>

        <!-- Content canvas -->
        <div class="dash-canvas">
          @switch (active()) {
            @case ('dashboard-ui')          { <app-admin-dashboard-Ui class="module-host"></app-admin-dashboard-Ui> }
            @case ('realtime')              { <app-real-time-monitoring class="module-host"></app-real-time-monitoring> }
            @case ('financial-trend')       { <app-financial-trend-chart class="module-host"></app-financial-trend-chart> }
            @case ('system-audit')          { <app-system-audit-alerts class="module-host"></app-system-audit-alerts> }
            @case ('branch-comparison')     { <app-branch-comparison class="module-host"></app-branch-comparison> }
            @case ('financial-dashboard')   { <app-financial-dashboard class="module-host"></app-financial-dashboard> }
            @case ('cash-flow')             { <app-cash-flow-analysis class="module-host"></app-cash-flow-analysis> }
            @case ('emi-analytics')         { <app-emi-analytics class="module-host"></app-emi-analytics> }
            @case ('customer-intelligence') { <app-customer-intelligence class="module-host"></app-customer-intelligence> }
            @case ('customer-segmentation') { <app-customer-segmentation class="module-host"></app-customer-segmentation> }
            @case ('customer-ltv')          { <app-customer-ltv-analysis class="module-host"></app-customer-ltv-analysis> }
            @case ('product-performance')   { <app-product-performance class="module-host"></app-product-performance> }
            @case ('dead-stock')            { <app-dead-stock-analysis class="module-host"></app-dead-stock-analysis> }
            @case ('order-funnel')          { <app-order-funnel-chart class="module-host"></app-order-funnel-chart> }
            @case ('sales-distribution')    { <app-sales-distribution-chart class="module-host"></app-sales-distribution-chart> }
            @case ('predictive-analytics')  { <app-predictive-analytics class="module-host"></app-predictive-analytics> }
            @case ('sales-forecast')        { <app-sales-forecast class="module-host"></app-sales-forecast> }
            @case ('operational-metrics')   { <app-operational-metrics class="module-host"></app-operational-metrics> }
            @case ('peak-hours')            { <app-peak-hours-analysis class="module-host"></app-peak-hours-analysis> }
            @case ('staff-performance')     { <app-staff-performance-analysis class="module-host"></app-staff-performance-analysis> }
            @case ('branch-radar')          { <app-branch-radar-chart class="module-host"></app-branch-radar-chart> }
            @case ('compliance-dashboard')  { <app-compliance-dashboard class="module-host"></app-compliance-dashboard> }
            @case ('system-data-health')    { <app-system-data-health class="module-host"></app-system-data-health> }
            @case ('analytics-export')      { <app-analytics-export-hub class="module-host"></app-analytics-export-hub> }
            @case ('time-analytics')        { <app-time-analytics class="module-host"></app-time-analytics> }
            @default {
              <div class="empty-state">
                <i class="pi pi-th-large"></i>
                <p>Select a module from the sidebar</p>
              </div>
            }
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* =====================================================
       TOKEN-DRIVEN ADMIN DASHBOARD
       Uses the canonical design token system throughout.
       No hardcoded colors — all values reference --var tokens.
    ===================================================== */

    :host {
      display: block;
      height: 100%;
      width: 100%;
      overflow: hidden;
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    /* ── Root grid: sidebar | main ── */
    .dash-root {
      display: flex;
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: var(--bg-secondary);
    }

    /* =====================================================
       SIDEBAR
    ===================================================== */
    .dash-sidebar {
      position: relative;
      width: 220px;
      flex-shrink: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border-right: var(--ui-border-width) solid var(--border-primary);
      transition: width var(--transition-slow);
      overflow: hidden;

      &.collapsed {
        width: 56px;

        .cat-label { display: none; }
        .nav-text   { display: none; }
      }
    }

    /* Collapse toggle button — sits at the top of the sidebar */
    .sidebar-toggle {
      flex-shrink: 0;
      height: 44px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 var(--spacing-md);
      background: transparent;
      border: none;
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: var(--transition-base);
      font-size: var(--font-size-sm);

      &:hover {
        color: var(--accent-primary);
        background: var(--accent-focus);
      }

      .dash-sidebar.collapsed & {
        justify-content: center;
        padding: 0;
      }
    }

    /* Scrollable nav area */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--spacing-md) var(--spacing-md);

      scrollbar-width: thin;
      scrollbar-color: var(--scroll-thumb) var(--scroll-track);

      &::-webkit-scrollbar       { width: 3px; }
      &::-webkit-scrollbar-track { background: var(--scroll-track); }
      &::-webkit-scrollbar-thumb {
        background: var(--scroll-thumb);
        border-radius: var(--ui-border-radius-pill);
      }
    }

    /* Category grouping */
    .nav-category {
      margin-bottom: var(--spacing-lg);

      &:last-child { margin-bottom: 0; }
    }

    .cat-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-tertiary);
      padding: 0 var(--spacing-md) var(--spacing-sm);
      white-space: nowrap;
    }

    /* Nav button */
    .nav-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-md);
      border: none;
      background: transparent;
      border-radius: var(--ui-border-radius);
      cursor: pointer;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      font-family: var(--font-body);
      text-align: left;
      white-space: nowrap;
      transition: var(--transition-colors);
      position: relative;
      margin-bottom: var(--spacing-xs);

      .dash-sidebar.collapsed & {
        justify-content: center;
        padding: var(--spacing-md);
        gap: 0;
      }

      &:hover {
        background: var(--component-bg-hover);
        color: var(--text-primary);
      }

      &.active {
        background: var(--accent-focus);
        color: var(--accent-primary);
        font-weight: var(--font-weight-semibold);

        /* Left rail indicator */
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 2.5px;
          background: var(--accent-primary);
          border-radius: 0 var(--ui-border-radius-sm) var(--ui-border-radius-sm) 0;
        }

        .nav-icon { color: var(--accent-primary); }
      }
    }

    .nav-icon {
      width: 16px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-base);
      color: var(--text-tertiary);
      transition: color var(--transition-fast);

      .nav-btn.active & { color: var(--accent-primary); }
      .nav-btn:hover &  { color: var(--text-primary); }
    }

    .nav-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Realtime live dot */
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: var(--ui-border-radius-pill);
      background: var(--color-success);
      flex-shrink: 0;
      margin-left: auto;
      animation: pulse-dot 2s ease-in-out infinite;

      .dash-sidebar.collapsed & { display: none; }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1;   transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(0.85); }
    }

    /* =====================================================
       MAIN AREA
    ===================================================== */
    .dash-main {
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Compact topbar ── */
    .dash-topbar {
      flex-shrink: 0;
      height: 44px;
      padding: 0 var(--spacing-xl);
      background: var(--bg-primary);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-lg);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .topbar-crumb {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-size: var(--font-size-sm);

      .crumb-cat {
        color: var(--text-tertiary);
        font-weight: var(--font-weight-medium);
        white-space: nowrap;
      }

      .crumb-sep {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        opacity: 0.5;
      }

      .crumb-page {
        color: var(--text-primary);
        font-weight: var(--font-weight-semibold);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-shrink: 0;
    }

    .topbar-btn {
      position: relative;
      width: 30px;
      height: 30px;
      border: var(--ui-border-width) solid var(--border-primary);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border-radius: var(--ui-border-radius);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-base);
      transition: var(--transition-base);

      &:hover {
        background: var(--component-bg-hover);
        color: var(--accent-primary);
        border-color: var(--border-secondary);
      }

      .topbar-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 6px;
        height: 6px;
        background: var(--color-error);
        border-radius: var(--ui-border-radius-pill);
        border: var(--ui-border-width) solid var(--bg-primary);
      }
    }

    .topbar-divider {
      width: var(--ui-border-width);
      height: 20px;
      background: var(--border-primary);
    }

    ::ng-deep .topbar-avatar {
      width: 28px !important;
      height: 28px !important;
      font-size: var(--font-size-xs) !important;
      font-weight: var(--font-weight-bold) !important;
      background: var(--accent-primary) !important;
      color: #fff !important;
      cursor: pointer;
    }

    /* ── Content canvas (scrolls) ── */
    .dash-canvas {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--bg-secondary);

      scrollbar-width: thin;
      scrollbar-color: var(--scroll-thumb) var(--scroll-track);

      &::-webkit-scrollbar       { width: 5px; }
      &::-webkit-scrollbar-track { background: var(--scroll-track); }
      &::-webkit-scrollbar-thumb {
        background: var(--scroll-thumb);
        border-radius: var(--ui-border-radius-pill);
      }
    }

    .module-host {
      display: block;
      animation: module-enter 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    @keyframes module-enter {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Empty state ── */
    .empty-state {
      height: 100%;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-lg);
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);

      i {
        font-size: var(--font-size-5xl);
        opacity: 0.25;
        color: var(--text-secondary);
      }

      p { opacity: 0.6; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {

  sidebarCollapsed = signal(false);
  active = signal('dashboard-ui');

  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }
  setActive(value: string) { this.active.set(value); }

  // Computed: find which category the active item belongs to
  activeCategoryLabel = computed(() => {
    for (const cat of this.navCategories) {
      if (cat.items.some(i => i.value === this.active())) return cat.label;
    }
    return 'Analytics';
  });

  activeItemLabel = computed(() => {
    for (const cat of this.navCategories) {
      const found = cat.items.find(i => i.value === this.active());
      if (found) return found.label;
    }
    return '';
  });

  navCategories: NavCategory[] = [
    {
      label: 'Overview',
      icon: 'pi-th-large',
      items: [
        { value: 'dashboard-ui',  label: 'Executive',    icon: 'pi-objects-column' },
        { value: 'realtime',      label: 'Live Monitor', icon: 'pi-bolt' },
      ]
    },
    {
      label: 'Finance',
      icon: 'pi-wallet',
      items: [
        { value: 'financial-dashboard', label: 'Overview',    icon: 'pi-wallet' },
        { value: 'financial-trend',     label: 'Trends',      icon: 'pi-chart-line' },
        { value: 'cash-flow',           label: 'Cash Flow',   icon: 'pi-money-bill' },
        { value: 'emi-analytics',       label: 'EMI / Credit', icon: 'pi-credit-card' },
      ]
    },
    {
      label: 'Sales',
      icon: 'pi-chart-bar',
      items: [
        { value: 'order-funnel',        label: 'Order Funnel',   icon: 'pi-filter' },
        { value: 'sales-distribution',  label: 'Sales Mix',      icon: 'pi-chart-pie' },
        { value: 'sales-forecast',      label: 'Forecast',       icon: 'pi-chart-bar' },
        { value: 'predictive-analytics',label: 'Predictive',     icon: 'pi-brain' },
      ]
    },
    {
      label: 'Customers',
      icon: 'pi-users',
      items: [
        { value: 'customer-intelligence',  label: 'Customer 360',  icon: 'pi-users' },
        { value: 'customer-segmentation',  label: 'Segments',      icon: 'pi-sitemap' },
        { value: 'customer-ltv',           label: 'LTV Analysis',  icon: 'pi-star' },
      ]
    },
    {
      label: 'Inventory',
      icon: 'pi-box',
      items: [
        { value: 'product-performance', label: 'Products',     icon: 'pi-box' },
        { value: 'dead-stock',          label: 'Dead Stock',   icon: 'pi-exclamation-circle' },
      ]
    },
    {
      label: 'Operations',
      icon: 'pi-cog',
      items: [
        { value: 'operational-metrics',  label: 'Metrics',        icon: 'pi-cog' },
        { value: 'peak-hours',           label: 'Peak Hours',     icon: 'pi-clock' },
        { value: 'staff-performance',    label: 'Staff Stats',    icon: 'pi-user-edit' },
        { value: 'time-analytics',       label: 'Time Analysis',  icon: 'pi-calendar' },
      ]
    },
    {
      label: 'Branches',
      icon: 'pi-building',
      items: [
        { value: 'branch-comparison', label: 'Comparison', icon: 'pi-building' },
        { value: 'branch-radar',      label: 'Radar View', icon: 'pi-compass' },
      ]
    },
    {
      label: 'Governance',
      icon: 'pi-shield',
      items: [
        { value: 'system-audit',       label: 'Audit Logs',    icon: 'pi-list-check' },
        { value: 'compliance-dashboard', label: 'Compliance',  icon: 'pi-shield' },
        { value: 'system-data-health', label: 'Data Health',   icon: 'pi-database' },
        { value: 'analytics-export',   label: 'Export Hub',    icon: 'pi-download' },
      ]
    },
  ];

  ngOnInit() {
    this.active.set('dashboard-ui');
  }
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
//   imports: [CommonModule, FormsModule, SelectModule, MultiSelectModule, ButtonModule, TooltipModule, AvatarModule, ScrollPanelModule, RealTimeMonitoringComponent, FinancialTrendChartComponent, SystemAuditAlertsComponent, BranchComparisonComponent, FinancialDashboardComponent, CashFlowAnalysisComponent, EmiAnalyticsComponent, CustomerIntelligenceComponent, CustomerSegmentationComponent, CustomerLtvAnalysisComponent, ProductPerformanceComponent, DeadStockAnalysisComponent, OrderFunnelChartComponent, SalesDistributionChartComponent, PredictiveAnalyticsComponent, SalesForecastComponent, OperationalMetricsComponent, PeakHoursAnalysisComponent, StaffPerformanceAnalysisComponent, BranchRadarChartComponent, ComplianceDashboardComponent, SystemDataHealthComponent, AnalyticsExportHubComponent, TimeAnalyticsComponent, DashboardUI
//   ],
//   template: `
//     <div class="app-layout">
      
//       <header class="glass-header">
//         <div class="header-content">
          
//           <div class="brand-box">
//              <div class="logo-circle">
//                 <i class="pi pi-bolt"></i>
//              </div>
//              <span class="brand-name">Nexus<span class="brand-highlight">Admin</span></span>
//           </div>

//           <div class="nav-capsule">
//             <div class="nav-scroller custom-scrollbar-hidden">
//               @for (comp of componentOptions; track comp.value) {
//                 <button 
//                   class="nav-item"
//                   [class.active]="selectedComponent?.value === comp.value"
//                   (click)="selectedComponent = comp"
//                   pTooltip="{{comp.label}}" tooltipPosition="bottom">
//                   <i [class]="'pi ' + comp.icon"></i>
//                   <span>{{comp.label}}</span>
//                 </button>
//               }
//             </div>
//           </div>

//           <div class="user-box">
//              <button class="icon-btn"><i class="pi pi-bell"></i><span class="dot"></span></button>
//              <p-avatar label="AD" shape="circle" styleClass="profile-avatar"></p-avatar>
//           </div>

//         </div>
//       </header>
      
//       <main class="stage-viewport">
//         <div class="stage-box glass-panel">
          
//           <div class="scrollable-inner custom-scrollbar">
//             @switch (selectedComponent?.value) {
              
//               @case ('dashboard-ui') { <app-admin-dashboard-Ui class="component-host"></app-admin-dashboard-Ui> }
//               @case ('realtime') { <app-real-time-monitoring class="component-host"></app-real-time-monitoring> }
//               @case ('financial-trend') { <app-financial-trend-chart class="component-host"></app-financial-trend-chart> }
//               @case ('system-audit') { <app-system-audit-alerts class="component-host"></app-system-audit-alerts> }
//               @case ('branch-comparison') { <app-branch-comparison class="component-host"></app-branch-comparison> }
//               @case ('financial-dashboard') { <app-financial-dashboard class="component-host"></app-financial-dashboard> }
//               @case ('cash-flow') { <app-cash-flow-analysis class="component-host"></app-cash-flow-analysis> }
//               @case ('emi-analytics') { <app-emi-analytics class="component-host"></app-emi-analytics> }
//               @case ('customer-intelligence') { <app-customer-intelligence class="component-host"></app-customer-intelligence> }
//               @case ('customer-segmentation') { <app-customer-segmentation class="component-host"></app-customer-segmentation> }
//               @case ('customer-ltv') { <app-customer-ltv-analysis class="component-host"></app-customer-ltv-analysis> }
//               @case ('product-performance') { <app-product-performance class="component-host"></app-product-performance> }
//               @case ('dead-stock') { <app-dead-stock-analysis class="component-host"></app-dead-stock-analysis> }
//               @case ('order-funnel') { <app-order-funnel-chart class="component-host"></app-order-funnel-chart> }
//               @case ('sales-distribution') { <app-sales-distribution-chart class="component-host"></app-sales-distribution-chart> }
//               @case ('predictive-analytics') { <app-predictive-analytics class="component-host"></app-predictive-analytics> }
//               @case ('sales-forecast') { <app-sales-forecast class="component-host"></app-sales-forecast> }
//               @case ('operational-metrics') { <app-operational-metrics class="component-host"></app-operational-metrics> }
//               @case ('peak-hours') { <app-peak-hours-analysis class="component-host"></app-peak-hours-analysis> }
//               @case ('staff-performance') { <app-staff-performance-analysis class="component-host"></app-staff-performance-analysis> }
//               @case ('branch-radar') { <app-branch-radar-chart class="component-host"></app-branch-radar-chart> }
//               @case ('compliance-dashboard') { <app-compliance-dashboard class="component-host"></app-compliance-dashboard> }
//               @case ('system-data-health') { <app-system-data-health class="component-host"></app-system-data-health> }
//               @case ('analytics-export') { <app-analytics-export-hub class="component-host"></app-analytics-export-hub> }
//               @case ('time-analytics') { <app-time-analytics class="component-host"></app-time-analytics> }

//               @default {
//                 <div class="empty-state">
//                    <div class="empty-content">
//                       <i class="pi pi-th-large empty-icon"></i>
//                       <h3>Select a Module</h3>
//                       <p>Navigate using the top bar to view analytics.</p>
//                    </div>
//                 </div>
//               }
//             }
//           </div>

//         </div>
//       </main>
//     </div>
//   `,
//   styles: [`
//     /* =========================================
//        1. GLOBAL LAYOUT (FIXED SCROLL ISSUE)
//        ========================================= */
//     :host {
//       display: block;
//       height: 100%;
//       width: 100%; /* Changed from 100vw to 100% to fix scrollbar overflow */
//       overflow: hidden; /* Prevent native scroll */
//       box-sizing: border-box;
//       background-color: var(--bg-primary);
//       color: var(--text-primary);
//       font-family: var(--font-body);
//     }

//     .app-layout {
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       position: relative;
//       width: 100%;
//     }

//     /* =========================================
//        2. FLOATING GLASS HEADER
//        ========================================= */
//     .glass-header {
//       position: absolute;
//       top: 20px;
//       left: 50%;
//       transform: translateX(-50%);
//       z-index: 100;
//       width: 95%;
//       max-width: 1600px;
//       height: 64px;
//     }

//     .header-content {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       height: 100%;
//       padding: 0 8px 0 24px;
      
//       /* The Glass Effect */
//       background: rgba(15, 23, 42, 0.8);
//       backdrop-filter: blur(12px);
//       -webkit-backdrop-filter: blur(12px);
//       border: 1px solid rgba(255, 255, 255, 0.1);
//       border-radius: 99px;
//       box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
//     }

//     /* Brand */
//     .brand-box { display: flex; align-items: center; gap: 12px; min-width: 180px; }
//     .logo-circle {
//        width: 32px; height: 32px; border-radius: 50%;
//        background: var(--accent-gradient);
//        display: flex; align-items: center; justify-content: center;
//        color: #fff; font-size: 14px;
//     }
//     .brand-name { font-family: var(--font-heading); font-weight: 700; font-size: 16px; color: #fff; letter-spacing: -0.02em; }
//     .brand-highlight { color: var(--accent-primary); }

//     /* Nav Capsule (Scrollable) */
//     .nav-capsule {
//       flex: 1;
//       margin: 0 24px;
//       overflow: hidden;
//       mask-image: linear-gradient(to right, transparent, black 20px, black 95%, transparent);
//     }

//     .nav-scroller {
//       display: flex;
//       align-items: center;
//       gap: 4px;
//       overflow-x: auto;
//       padding: 4px 0;
//     }
//     .custom-scrollbar-hidden::-webkit-scrollbar { display: none; }

//     .nav-item {
//       display: flex; align-items: center; gap: 8px;
//       padding: 8px 16px;
//       border-radius: 99px;
//       border: 1px solid transparent;
//       background: transparent;
//       color: rgba(255,255,255,0.6);
//       font-size: 12px; font-weight: 600;
//       white-space: nowrap; cursor: pointer;
//       transition: all 0.2s ease;
//     }
//     .nav-item:hover { color: #fff; background: rgba(255,255,255,0.05); }
//     .nav-item.active {
//       background: var(--bg-primary); 
//       color: var(--accent-primary);
//       box-shadow: 0 2px 8px rgba(0,0,0,0.2);
//     }

//     /* User Box */
//     .user-box { display: flex; align-items: center; gap: 16px; margin-right: 8px; }
//     .icon-btn { 
//       background: none; border: none; color: rgba(255,255,255,0.6); 
//       font-size: 1.1rem; cursor: pointer; position: relative; 
//     }
//     .icon-btn .dot { 
//       position: absolute; top: 0; right: 0; width: 6px; height: 6px; 
//       background: var(--color-error); border-radius: 50%; 
//     }
//     ::ng-deep .profile-avatar { background: var(--accent-primary); color: #fff; font-weight: 700; width: 36px; height: 36px; }

//     /* =========================================
//        3. STAGE VIEWPORT (PADDED CONTAINER)
//        ========================================= */
//     .stage-viewport {
//       flex: 1;
//       display: flex;
//       justify-content: center;
      
//       /* ADDED SIDE PADDING HERE (40px) to prevent edge touching */
//       padding: 104px 0px 0px 0px;
      
//       height: 100%;
//       overflow: hidden; /* No scroll on outer viewport */
//       width: 100%;
//       box-sizing: border-box;
//     }

//     /* =========================================
//        4. THE BOX CONTAINER (The "Fixed Stage")
//        ========================================= */
//     .stage-box {
//       width: 100%;
//       max-width: 1800px;
//       height: 100%;
      
//       /* The Box Look */
//       background: var(--bg-primary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      
//       /* Content Handling */
//       display: flex;
//       flex-direction: column;
//       overflow: hidden; /* Clips children */
//       position: relative;
//     }

//     /* =========================================
//        5. INNER SCROLL AREA (The Content)
//        ========================================= */
//     .scrollable-inner {
//       flex: 1;
//       overflow-y: auto; /* SCROLL HAPPENS HERE */
//       padding: 0;
//       scroll-behavior: smooth;
//     }

//     .component-host {
//       display: block;
//       animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
//     }

//     @keyframes slideUp {
//       from { opacity: 0; transform: translateY(10px); }
//       to { opacity: 1; transform: translateY(0); }
//     }

//     /* Scrollbar Polish */
//     .custom-scrollbar::-webkit-scrollbar { width: 6px; }
//     .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 10px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

//     /* Empty State */
//     .empty-state { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); text-align: center; }
//     .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
//   `]
// })

// export class AdminDashboardComponent implements OnInit, OnDestroy {
//   selectedComponent: any = null;

//   componentOptions = [
//     { value: 'dashboard-ui', label: 'Executive', icon: 'pi-objects-column' },
//     { value: 'realtime', label: 'Live Monitor', icon: 'pi-bolt' },
//     { value: 'financial-trend', label: 'Trends', icon: 'pi-chart-line' },
//     { value: 'financial-dashboard', label: 'Financials', icon: 'pi-wallet' },
//     { value: 'cash-flow', label: 'Cash Flow', icon: 'pi-money-bill' },
//     { value: 'order-funnel', label: 'Funnel', icon: 'pi-filter' },
//     { value: 'product-performance', label: 'Products', icon: 'pi-box' },
//     { value: 'dead-stock', label: 'Inventory Health', icon: 'pi-exclamation-circle' },
//     { value: 'customer-intelligence', label: 'Customer 360', icon: 'pi-users' },
//     { value: 'customer-segmentation', label: 'Segments', icon: 'pi-sitemap' },
//     { value: 'customer-ltv', label: 'LTV Analysis', icon: 'pi-star' },
//     { value: 'predictive-analytics', label: 'Predictive', icon: 'pi-brain' },
//     { value: 'sales-forecast', label: 'Forecast', icon: 'pi-chart-bar' },
//     { value: 'sales-distribution', label: 'Sales Mix', icon: 'pi-chart-pie' },
//     { value: 'operational-metrics', label: 'Operations', icon: 'pi-cog' },
//     { value: 'peak-hours', label: 'Peak Hours', icon: 'pi-clock' },
//     { value: 'staff-performance', label: 'Staff Stats', icon: 'pi-user-edit' },
//     { value: 'branch-radar', label: 'Radar View', icon: 'pi-compass' },
//     { value: 'system-audit', label: 'Audit Logs', icon: 'pi-list-check' },
//     { value: 'compliance-dashboard', label: 'Compliance', icon: 'pi-shield' },
//     { value: 'system-data-health', label: 'Data Health', icon: 'pi-database' },
//     { value: 'analytics-export', label: 'Export Hub', icon: 'pi-download' },
//     { value: 'time-analytics', label: 'Time Analysis', icon: 'pi-calendar' },
//     { value: 'branch-comparison', label: 'Branch Comp.', icon: 'pi-building' }
//   ];

//   constructor() { }

//   ngOnInit() {
//     this.selectedComponent = this.componentOptions[0];
//   }

//   ngOnDestroy() { }
// }