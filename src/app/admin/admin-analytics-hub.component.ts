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
  imports: [CommonModule, FormsModule,SelectModule, MultiSelectModule, ButtonModule, TooltipModule,AvatarModule, ScrollPanelModule,RealTimeMonitoringComponent,FinancialTrendChartComponent,SystemAuditAlertsComponent,BranchComparisonComponent,FinancialDashboardComponent,CashFlowAnalysisComponent,EmiAnalyticsComponent,CustomerIntelligenceComponent,CustomerSegmentationComponent,CustomerLtvAnalysisComponent,ProductPerformanceComponent,DeadStockAnalysisComponent,OrderFunnelChartComponent,SalesDistributionChartComponent,PredictiveAnalyticsComponent,SalesForecastComponent,OperationalMetricsComponent,PeakHoursAnalysisComponent,StaffPerformanceAnalysisComponent,BranchRadarChartComponent,ComplianceDashboardComponent,SystemDataHealthComponent,AnalyticsExportHubComponent,TimeAnalyticsComponent,     DashboardUI
  ],
  template: `
    <div class="admin-dashboard">
      <header class="dashboard-header rounded-lg glass-surface">
        <div class="component-tabs">
          <div class="tabs-scroll-container">
            <div class="tabs-container">
              @for (comp of componentOptions; track comp.value) {
                <button 
                  class="tab-button surface-interactive"
                  [class.active-tab]="selectedComponent?.value === comp.value"
                  (click)="selectedComponent = comp">
                  <i [class]="'pi ' + comp.icon"></i>
                  <span>{{comp.label}}</span>
                </button>
              }
            </div>
          </div>
        </div>
      </header>
      
      <!-- Main Content Area -->
      <main class="dashboard-main">
        <div class="main-content">
          
          
          @if (selectedComponent?.value === 'dashboard-ui') {
            <div class="component-container">
              <app-admin-dashboard-Ui class="component-full"></app-admin-dashboard-Ui>
            </div>
          }
          @if (selectedComponent?.value === 'realtime') {
            <div class="component-container">
              <app-real-time-monitoring class="component-full"></app-real-time-monitoring>
            </div>
          }
          

          @if (selectedComponent?.value === 'financial-trend') {
            <div class="component-container">
              <app-financial-trend-chart class="component-full"></app-financial-trend-chart>
            </div>
          }
          

          @if (selectedComponent?.value === 'system-audit') {
            <div class="component-container">
              <app-system-audit-alerts class="component-full"></app-system-audit-alerts>
            </div>
          }
          

          @if (selectedComponent?.value === 'branch-comparison') {
            <div class="component-container">
              <app-branch-comparison class="component-full"></app-branch-comparison>
            </div>
          }
          

          @if (selectedComponent?.value === 'financial-dashboard') {
            <div class="component-container">
              <app-financial-dashboard class="component-full"></app-financial-dashboard>
            </div>
          }
          

          @if (selectedComponent?.value === 'cash-flow') {
            <div class="component-container">
              <app-cash-flow-analysis class="component-full"></app-cash-flow-analysis>
            </div>
          }
          

          @if (selectedComponent?.value === 'emi-analytics') {
            <div class="component-container">
              <app-emi-analytics class="component-full"></app-emi-analytics>
            </div>
          }
          

          @if (selectedComponent?.value === 'customer-intelligence') {
            <div class="component-container">
              <app-customer-intelligence class="component-full"></app-customer-intelligence>
            </div>
          }
          

          @if (selectedComponent?.value === 'customer-segmentation') {
            <div class="component-container">
              <app-customer-segmentation class="component-full"></app-customer-segmentation>
            </div>
          }
          

          @if (selectedComponent?.value === 'customer-ltv') {
            <div class="component-container">
              <app-customer-ltv-analysis class="component-full"></app-customer-ltv-analysis>
            </div>
          }
          

          @if (selectedComponent?.value === 'product-performance') {
            <div class="component-container">
              <app-product-performance class="component-full"></app-product-performance>
            </div>
          }
          

          @if (selectedComponent?.value === 'dead-stock') {
            <div class="component-container">
              <app-dead-stock-analysis class="component-full"></app-dead-stock-analysis>
            </div>
          }
          

          @if (selectedComponent?.value === 'order-funnel') {
            <div class="component-container">
              <app-order-funnel-chart class="component-full"></app-order-funnel-chart>
            </div>
          }
          

          @if (selectedComponent?.value === 'sales-distribution') {
            <div class="component-container">
              <app-sales-distribution-chart class="component-full"></app-sales-distribution-chart>
            </div>
          }
          

          @if (selectedComponent?.value === 'predictive-analytics') {
            <div class="component-container">
              <app-predictive-analytics class="component-full"></app-predictive-analytics>
            </div>
          }
          

          @if (selectedComponent?.value === 'sales-forecast') {
            <div class="component-container">
              <app-sales-forecast class="component-full"></app-sales-forecast>
            </div>
          }
          

          @if (selectedComponent?.value === 'operational-metrics') {
            <div class="component-container">
              <app-operational-metrics class="component-full"></app-operational-metrics>
            </div>
          }
          

          @if (selectedComponent?.value === 'peak-hours') {
            <div class="component-container">
              <app-peak-hours-analysis class="component-full"></app-peak-hours-analysis>
            </div>
          }
          

          @if (selectedComponent?.value === 'staff-performance') {
            <div class="component-container">
              <app-staff-performance-analysis class="component-full"></app-staff-performance-analysis>
            </div>
          }
          

          @if (selectedComponent?.value === 'branch-radar') {
            <div class="component-container">
              <app-branch-radar-chart class="component-full"></app-branch-radar-chart>
            </div>
          }
          

          @if (selectedComponent?.value === 'compliance-dashboard') {
            <div class="component-container">
              <app-compliance-dashboard class="component-full"></app-compliance-dashboard>
            </div>
          }
          

          @if (selectedComponent?.value === 'system-data-health') {
            <div class="component-container">
              <app-system-data-health class="component-full"></app-system-data-health>
            </div>
          }
          

          @if (selectedComponent?.value === 'analytics-export') {
            <div class="component-container">
              <app-analytics-export-hub class="component-full"></app-analytics-export-hub>
            </div>
          }
          

          @if (selectedComponent?.value === 'time-analytics') {
            <div class="component-container">
              <app-time-analytics class="component-full"></app-time-analytics>
            </div>
          }
          

          @if (!selectedComponent) {
            <div class="empty-state">
              <div class="empty-state-icon surface-elevated">
                <i class="pi pi-chart-line"></i>
              </div>
              <h2 class="empty-state-title">Welcome to Analytics Dashboard</h2>
              <p class="empty-state-description">Select a component from the header to view detailed analytics and monitoring tools.</p>
              <div class="empty-state-grid">
                <div class="empty-state-card surface-interactive">
                  <i class="pi pi-eye"></i>
                  <h3 class="empty-state-card-title">Live Monitoring</h3>
                </div>
                <div class="empty-state-card surface-interactive">
                  <i class="pi pi-chart-line"></i>
                  <h3 class="empty-state-card-title">Financial Analytics</h3>
                </div>
                <div class="empty-state-card surface-interactive">
                  <i class="pi pi-users"></i>
                  <h3 class="empty-state-card-title">Customer Insights</h3>
                </div>
                <div class="empty-state-card surface-interactive">
                  <i class="pi pi-bolt"></i>
                  <h3 class="empty-state-card-title">AI Analytics</h3>
                </div>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* ===== BASE STYLES ===== */
    :host {
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      line-height: var(--line-height-normal);
      color: var(--text-primary);
      display: block;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    .admin-dashboard {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      transition: var(--transition-colors);
    }

    /* ===== HEADER STYLES ===== */
    .dashboard-header {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      transition: var(--transition-colors);
    }

    .header-content {
      padding: var(--spacing-lg) var(--spacing-2xl);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2xl);
      transition: var(--transition-colors);
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      flex-shrink: 0;
    }

    .brand-logo {
      width: calc(var(--spacing-2xl) + var(--spacing-sm));
      height: calc(var(--spacing-2xl) + var(--spacing-sm));
      border-radius: var(--ui-border-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-gradient);
      color: var(--text-primary);
    }

    .brand-logo i {
      font-size: var(--font-size-md);
    }

    .brand-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      line-height: var(--line-height-tight);
      color: var(--text-primary);
      margin: 0;
    }

    .brand-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;
      line-height: var(--line-height-tight);
    }

    .desktop-selector {
      display: none;
    }

    @media (min-width: 768px) {
      .desktop-selector {
        display: block;
        flex: 1;
        max-width: 280px;
      }
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .settings-button {
      padding: var(--spacing-sm);
      border-radius: var(--ui-border-radius);
      color: var(--text-secondary);
      transition: var(--transition-colors);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: var(--ui-border-width) solid transparent;
    }

    .settings-button:hover {
      color: var(--text-primary);
      border-color: var(--border-secondary);
    }

    .settings-button i {
      font-size: var(--font-size-sm);
    }

    .user-avatar {
      background: var(--accent-gradient) !important;
      color: var(--text-primary) !important;
      font-weight: var(--font-weight-bold) !important;
    }

    /* Mobile Selector */
    .mobile-selector {
      padding: 0 var(--spacing-2xl) var(--spacing-lg);
      display: block;
    }

    @media (min-width: 768px) {
      .mobile-selector {
        display: none;
      }
    }

    /* Component Tabs */
    .component-tabs {
      border-top: var(--ui-border-width) solid var(--component-divider);
      display: none;
    }

    @media (min-width: 768px) {
      .component-tabs {
        display: block;
      }
    }

    .tabs-scroll-container {
      padding: 0 var(--spacing-2xl);
      overflow-x: auto;
    }

    .tabs-container {
      display: flex;
      gap: var(--spacing-xs);
      padding: var(--spacing-md) 0;
      min-width: max-content;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--ui-border-radius-lg);
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-base);
      white-space: nowrap;
      font-size: var(--font-size-sm);
      line-height: var(--line-height-tight);
      border: var(--ui-border-width) solid transparent;
    }

    .tab-button:hover {
      background: var(--component-bg-hover);
      border-color: var(--border-primary);
    }

    .tab-button i {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      transition: var(--transition-colors);
    }

    .tab-button:hover i {
      color: var(--accent-primary);
    }

    .tab-button.active-tab {
      background: var(--component-bg-active);
      border-color: var(--accent-primary);
      color: var(--text-primary);
    }

    .tab-button.active-tab i {
      color: var(--accent-primary);
    }

    /* ===== MAIN CONTENT STYLES ===== */
    .dashboard-main {
      flex: 1;
      overflow: auto;
      background: var(--bg-primary);
      transition: var(--transition-colors);
    }

    .main-content {
      height: 100%;
    }

    .component-container {
      height: 100%;
      padding: var(--spacing-2xl);
    }

    @media (max-width: 768px) {
      .component-container {
        padding: var(--spacing-xl);
      }
    }

    .component-full {
      display: block;
      height: 100%;
    }

    /* Empty State */
    .empty-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-3xl);
      text-align: center;
    }

    .empty-state-icon {
      width: calc(var(--spacing-3xl) * 2);
      height: calc(var(--spacing-3xl) * 2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-2xl);
      background: var(--accent-gradient);
    }

    .empty-state-icon i {
      font-size: var(--font-size-3xl);
      color: var(--text-primary);
    }

    .empty-state-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-lg);
      line-height: var(--line-height-tight);
    }

    .empty-state-description {
      font-size: var(--font-size-md);
      color: var(--text-secondary);
      max-width: 32rem;
      margin: 0 auto var(--spacing-3xl);
      line-height: var(--line-height-relaxed);
    }

    .empty-state-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-lg);
      max-width: 32rem;
    }

    @media (min-width: 768px) {
      .empty-state-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .empty-state-card {
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      border: var(--ui-border-width) solid var(--border-secondary);
      transition: var(--transition-colors);
    }

    .empty-state-card:hover {
      border-color: var(--border-primary);
    }

    .empty-state-card i {
      font-size: var(--font-size-lg);
      color: var(--accent-primary);
      margin-bottom: var(--spacing-xs);
    }

    .empty-state-card-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      margin: 0;
      line-height: var(--line-height-tight);
    }

    /* ===== FOOTER STYLES ===== */
    .dashboard-footer {
      padding: var(--spacing-lg);
      border-top: var(--ui-border-width) solid var(--border-primary);
      transition: var(--transition-colors);
    }

    .footer-content {
      max-width: 100%;
    }

    .footer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--spacing-sm);
    }

    .selected-count {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin: 0;
    }

    .view-selected-button {
      font-size: var(--font-size-sm);
      color: var(--accent-primary);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: var(--transition-colors);
      padding: 0;
    }

    .view-selected-button:hover:not(:disabled) {
      color: var(--accent-hover);
    }

    .view-selected-button:disabled {
      color: var(--color-disabled-text);
      cursor: not-allowed;
      opacity: var(--state-disabled-opacity);
    }

    /* ===== PRIME NG CUSTOMIZATION ===== */
    :host ::ng-deep .p-select,
    :host ::ng-deep .p-multiselect {
      background: var(--bg-secondary) !important;
      border-radius: var(--ui-border-radius) !important;
      border: var(--ui-border-width) solid var(--border-primary) !important;
      transition: var(--transition-colors) !important;
      width: 100% !important;
    }

    :host ::ng-deep .p-select:hover,
    :host ::ng-deep .p-multiselect:hover {
      border-color: var(--accent-primary) !important;
    }

    :host ::ng-deep .p-select:focus-within,
    :host ::ng-deep .p-multiselect:focus-within {
      border-color: var(--accent-primary) !important;
      box-shadow: 0 0 0 var(--focus-ring-width) var(--accent-focus) !important;
    }

    :host ::ng-deep .p-select-label,
    :host ::ng-deep .p-multiselect-label {
      font-size: var(--font-size-sm) !important;
      color: var(--text-primary) !important;
      font-family: var(--font-body) !important;
      font-weight: var(--font-weight-normal) !important;
    }

    :host ::ng-deep .p-select-trigger,
    :host ::ng-deep .p-multiselect-trigger {
      color: var(--text-tertiary) !important;
      transition: var(--transition-colors) !important;
    }

    :host ::ng-deep .p-select:hover .p-select-trigger,
    :host ::ng-deep .p-multiselect:hover .p-multiselect-trigger {
      color: var(--accent-primary) !important;
    }

    :host ::ng-deep .p-select-panel,
    :host ::ng-deep .p-multiselect-panel {
      background: var(--bg-secondary) !important;
      border: var(--ui-border-width) solid var(--border-primary) !important;
      border-radius: var(--ui-border-radius) !important;
      box-shadow: var(--shadow-lg) !important;
    }

    :host ::ng-deep .p-select-item,
    :host ::ng-deep .p-multiselect-item {
      font-size: var(--font-size-sm) !important;
      color: var(--text-primary) !important;
      padding: var(--spacing-sm) var(--spacing-lg) !important;
      font-family: var(--font-body) !important;
      transition: var(--transition-colors) !important;
    }

    :host ::ng-deep .p-select-item:hover,
    :host ::ng-deep .p-multiselect-item:hover {
      background: var(--component-bg-hover) !important;
      color: var(--text-primary) !important;
    }

    :host ::ng-deep .p-select-item.p-highlight,
    :host ::ng-deep .p-multiselect-item.p-highlight {
      background: var(--component-bg-active) !important;
      color: var(--text-primary) !important;
    }

    :host ::ng-deep .p-multiselect-header {
      background: var(--bg-secondary) !important;
      border-bottom: var(--ui-border-width) solid var(--border-primary) !important;
      padding: var(--spacing-sm) var(--spacing-lg) !important;
    }

    :host ::ng-deep .p-multiselect-close {
      color: var(--text-tertiary) !important;
    }

    :host ::ng-deep .p-multiselect-close:hover {
      color: var(--accent-primary) !important;
    }

    /* ===== SCROLLBAR STYLING ===== */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--scroll-track-c);
      border-radius: var(--ui-border-radius);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--scroll-thumb-c);
      border-radius: var(--ui-border-radius);
      transition: var(--transition-colors);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--accent-primary);
    }

    /* Hide scrollbar for tabs container */
    .tabs-scroll-container::-webkit-scrollbar {
      display: none;
    }

    .tabs-scroll-container {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* ===== FOCUS STATES ===== */
    button:focus-visible,
    .p-select:focus-within,
    .p-multiselect:focus-within {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }

    /* ===== RESPONSIVE ADJUSTMENTS ===== */
    @media (max-width: 768px) {
      .header-content {
        padding: var(--spacing-lg);
        gap: var(--spacing-lg);
      }
      
      .mobile-selector {
        padding: 0 var(--spacing-lg) var(--spacing-lg);
      }
      
      .empty-state {
        padding: var(--spacing-2xl);
      }
      
      .empty-state-icon {
        width: calc(var(--spacing-2xl) * 2);
        height: calc(var(--spacing-2xl) * 2);
      }
      
      .empty-state-icon i {
        font-size: var(--font-size-2xl);
      }
      
      .empty-state-title {
        font-size: var(--font-size-xl);
      }
      
      .dashboard-footer {
        padding: var(--spacing-lg);
      }
    }

    @media (max-width: 640px) {
      .brand-section {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-xs);
      }
      
      .brand-logo {
        width: var(--spacing-2xl);
        height: var(--spacing-2xl);
      }
      
      .header-content {
        flex-wrap: wrap;
      }
      
      .user-section {
        order: 1;
      }
      
      .empty-state-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(var(--spacing-xs));
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .component-container {
      animation: fadeIn var(--transition-base) ease-out;
    }

    .empty-state {
      animation: fadeIn var(--transition-slow) ease-out;
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Currently selected single component
  selectedComponent: any = null;
  
  // Multiple selected components for footer
  selectedComponents: any[] = [];
  
  // All 25 components with metadata
  componentOptions = [
    { value: 'dashboard-ui', label: 'Dashboard', icon: 'pi-screen' },
    { value: 'realtime', label: 'Real-Time Monitoring', icon: 'pi-eye' },
    { value: 'financial-trend', label: 'Financial Trends', icon: 'pi-chart-line' },
    { value: 'system-audit', label: 'System Audit Alerts', icon: 'pi-shield' },
    { value: 'branch-comparison', label: 'Branch Comparison', icon: 'pi-building' },
    { value: 'financial-dashboard', label: 'Financial Dashboard', icon: 'pi-wallet' },
    { value: 'cash-flow', label: 'Cash Flow Analysis', icon: 'pi-money-bill' },
    { value: 'emi-analytics', label: 'EMI Analytics', icon: 'pi-credit-card' },
    { value: 'customer-intelligence', label: 'Customer Intelligence', icon: 'pi-user' },
    { value: 'customer-segmentation', label: 'Customer Segmentation', icon: 'pi-sitemap' },
    { value: 'customer-ltv', label: 'Customer LTV Analysis', icon: 'pi-star' },
    { value: 'product-performance', label: 'Product Performance', icon: 'pi-shopping-bag' },
    { value: 'dead-stock', label: 'Dead Stock Analysis', icon: 'pi-exclamation-circle' },
    { value: 'order-funnel', label: 'Order Funnel Chart', icon: 'pi-filter' },
    { value: 'sales-distribution', label: 'Sales Distribution', icon: 'pi-chart-pie' },
    { value: 'predictive-analytics', label: 'Predictive Analytics', icon: 'pi-brain' },
    { value: 'sales-forecast', label: 'Sales Forecast', icon: 'pi-chart-bar' },
    { value: 'operational-metrics', label: 'Operational Metrics', icon: 'pi-cog' },
    { value: 'peak-hours', label: 'Peak Hours Analysis', icon: 'pi-clock' },
    { value: 'staff-performance', label: 'Staff Performance', icon: 'pi-user-edit' },
    { value: 'branch-radar', label: 'Branch Radar Chart', icon: 'pi-radar-chart' },
    { value: 'compliance-dashboard', label: 'Compliance Dashboard', icon: 'pi-shield' },
    { value: 'system-data-health', label: 'System Data Health', icon: 'pi-database' },
    { value: 'analytics-export', label: 'Analytics Export Hub', icon: 'pi-file-export' },
    { value: 'time-analytics', label: 'Time Analytics', icon: 'pi-history' }
  ];

  constructor() { }
  
  ngOnInit() {
    // Set default component on load
    this.selectedComponent = this.componentOptions[0];
  }
  
  ngOnDestroy() {
    // Cleanup if needed
  }

  getSelectorStyle(): any {
    return {
      'width': '100%',
      'background': 'var(--bg-secondary)',
      'border': 'var(--ui-border-width) solid var(--border-primary)',
      'color': 'var(--text-primary)',
      'fontFamily': 'var(--font-body)',
      'fontSize': 'var(--font-size-sm)'
    };
  }
  
  /**
   * View the first selected component from footer
   */
  viewFirstSelected(): void {
    if (this.selectedComponents.length > 0) {
      this.selectedComponent = this.selectedComponents[0];
    }
  }
  
  /**
   * Track component changes
   */
  onComponentChange(): void {
    // Add any logic needed when component changes
    console.log('Component changed to:', this.selectedComponent);
  }
}

