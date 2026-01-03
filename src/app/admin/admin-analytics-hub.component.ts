import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DividerModule } from 'primeng/divider';

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
  imports: [
    CommonModule, FormsModule,
    SelectModule, DatePickerModule, ButtonModule, TooltipModule,
    BadgeModule, AvatarModule, ScrollPanelModule, DividerModule,
    
    // All components
    RealTimeMonitoringComponent,
    FinancialTrendChartComponent,
    SystemAuditAlertsComponent,
    BranchComparisonComponent,
    FinancialDashboardComponent,
    CashFlowAnalysisComponent,
    EmiAnalyticsComponent,
    CustomerIntelligenceComponent,
    CustomerSegmentationComponent,
    CustomerLtvAnalysisComponent,
    ProductPerformanceComponent,
    DeadStockAnalysisComponent,
    OrderFunnelChartComponent,
    SalesDistributionChartComponent,
    PredictiveAnalyticsComponent,
    SalesForecastComponent,
    OperationalMetricsComponent,
    PeakHoursAnalysisComponent,
    StaffPerformanceAnalysisComponent,
    BranchRadarChartComponent,
    ComplianceDashboardComponent,
    SystemDataHealthComponent,
    AnalyticsExportHubComponent,
    TimeAnalyticsComponent,
    DashboardUI
  ],
  template: `
    <div class="min-h-screen flex flex-col transition-colors duration-500" 
         [style.background]="'var(--theme-bg-primary)'">
      
      <!-- Top Navigation -->
      <div class="z-50 border-b px-6 py-4 flex items-center justify-between sticky top-0 backdrop-blur-xl"
           [style.background]="'rgba(15, 23, 42, 0.95)'"
           [style.border-color]="'var(--theme-border-primary)'">
        
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 hover:rotate-0 transition-all duration-500 group"
               [style.background]="'var(--theme-accent-gradient)'">
            <i class="pi pi-bolt text-lg group-hover:scale-110 transition-transform"></i>
          </div>
          <div class="flex flex-col">
            <h1 class="font-black tracking-[0.2em] text-white text-[15px] uppercase leading-none">APEX INFINITY</h1>
            <span class="text-[10px] font-bold text-indigo-400/90 uppercase tracking-[0.3em] mt-1">EXECUTIVE COMMAND CENTER</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="hidden lg:flex items-center gap-4">
          <div class="flex items-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors rounded-2xl border border-white/10 p-2 shadow-2xl">
            <p-select [options]="branches" [(ngModel)]="selectedBranch" 
                      optionLabel="name" placeholder="Select Branch"
                      [style]="{
                        'background': 'transparent', 
                        'border': 'none', 
                        'font-size': '13px',
                        'height': '36px',
                        'width': '200px'
                      }">
            </p-select>
            <div class="w-[1px] h-5 bg-white/10 mx-3"></div>
            <p-datePicker [(ngModel)]="dateRange" selectionMode="range" [showIcon]="true"
                          placeholder="Date Range" [readonlyInput]="true"
                          [style]="{
                            'background': 'transparent', 
                            'border': 'none', 
                            'font-size': '13px',
                            'height': '36px',
                            'width': '220px'
                          }">
            </p-datePicker>
            <button class="action-btn-icon ml-2">
              <i class="pi pi-search text-sm"></i>
            </button>
          </div>
        </div>

        <!-- User Actions -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <button pTooltip="Live Alerts" tooltipPosition="bottom" 
                    class="action-btn-icon relative">
              <i class="pi pi-bell text-sm"></i>
              <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border border-rose-600"></span>
            </button>
            <button pTooltip="Refresh Data" tooltipPosition="bottom"
                    class="action-btn-icon hover:rotate-180 transition-transform duration-500">
              <i class="pi pi-sync text-sm"></i>
            </button>
            <button pTooltip="Export Reports" tooltipPosition="bottom"
                    class="action-btn-icon">
              <i class="pi pi-file-export text-sm"></i>
            </button>
          </div>
          
          <div class="flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer group ml-2">
            <p-avatar label="AD" shape="circle" size="large"
                     styleClass="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 font-bold text-sm ring-2 ring-indigo-500/20 group-hover:ring-indigo-500/50 transition-all">
            </p-avatar>
            <div class="hidden xl:flex flex-col">
              <span class="text-sm font-bold text-white">Global Administrator</span>
              <span class="text-[11px] text-slate-400/80 font-medium">Root Access • Level 10</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="z-40 border-b sticky top-[80px] backdrop-blur-xl"
           [style.background]="'var(--theme-bg-secondary)'"
           [style.border-color]="'var(--theme-border-primary)'">
        <div class="px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button class="fullwidth-tab" [class.active]="activeTab === 'overview'" (click)="activeTab = 'overview'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <i class="pi pi-layout-grid text-blue-400 text-sm"></i>
              </div>
              <div class="text-left">
                <div class="text-sm font-bold text-white">Overview</div>
                <div class="text-[10px] text-slate-400">Real-time dashboard & alerts</div>
              </div>
            </div>
            <div class="fullwidth-indicator"></div>
          </button>
          
          <button class="fullwidth-tab" [class.active]="activeTab === 'financial'" (click)="activeTab = 'financial'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <i class="pi pi-chart-line text-emerald-400 text-sm"></i>
              </div>
              <div class="text-left">
                <div class="text-sm font-bold text-white">Financial</div>
                <div class="text-[10px] text-slate-400">Revenue, cash flow & analytics</div>
              </div>
            </div>
            <div class="fullwidth-indicator"></div>
          </button>
          
          <button class="fullwidth-tab" [class.active]="activeTab === 'customers'" (click)="activeTab = 'customers'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <i class="pi pi-users text-purple-400 text-sm"></i>
              </div>
              <div class="text-left">
                <div class="text-sm font-bold text-white">Customers</div>
                <div class="text-[10px] text-slate-400">CRM & intelligence center</div>
              </div>
            </div>
            <div class="fullwidth-indicator"></div>
          </button>
          
          <button class="fullwidth-tab" [class.active]="activeTab === 'inventory'" (click)="activeTab = 'inventory'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <i class="pi pi-box text-amber-400 text-sm"></i>
              </div>
              <div class="text-left">
                <div class="text-sm font-bold text-white">Inventory</div>
                <div class="text-[10px] text-slate-400">Stock & product performance</div>
              </div>
            </div>
            <div class="fullwidth-indicator"></div>
          </button>
          
          <button class="fullwidth-tab" [class.active]="activeTab === 'analytics'" (click)="activeTab = 'analytics'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <i class="pi pi-bolt text-rose-400 text-sm"></i>
              </div>
              <div class="text-left">
                <div class="text-sm font-bold text-white">AI Analytics</div>
                <div class="text-[10px] text-slate-400">Predictive insights & forecasts</div>
              </div>
            </div>
            <div class="fullwidth-indicator"></div>
          </button>
          
          <button class="fullwidth-tab" [class.active]="activeTab === 'compliance'" (click)="activeTab = 'compliance'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <i class="pi pi-shield text-cyan-400 text-sm"></i>
              </div>
              <div class="text-left">
                <div class="text-sm font-bold text-white">Compliance</div>
                <div class="text-[10px] text-slate-400">Audit, integrity & reports</div>
              </div>
            </div>
            <div class="fullwidth-indicator"></div>
          </button>
        </div>
      </div>

      <!-- Main Content Area - Full Width Components -->
      <main class="flex-1 overflow-y-auto">
        <p-scrollPanel [style]="{ width: '100%', height: 'calc(100vh - 160px)' }" class="custom-scroll">
          <div class="p-6">
            
            <!-- OVERVIEW TAB -->
            <div *ngIf="activeTab === 'overview'" class="space-y-8">
              <!-- Header -->
              <div class="mb-8">
                <h1 class="text-3xl font-black text-white mb-3">Executive Command Center</h1>
                <p class="text-slate-400 text-sm max-w-3xl">Real-time operational intelligence across all business functions. Monitor KPIs, track performance, and make data-driven decisions.</p>
              </div>
              
              <!-- COMPONENT 1: Real-Time Monitoring -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <i class="pi pi-eye text-blue-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Live Operations Monitor</h2>
                      <p class="text-slate-400 text-sm mt-1">Real-time tracking of business activities, transactions, and system performance</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-emerald-500/10 text-emerald-400">
                      <i class="pi pi-circle-fill text-[8px] animate-pulse mr-2"></i>
                      LIVE
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-cog mr-2"></i>
                      Configure
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-admin-dashboard-Ui></app-admin-dashboard-Ui>
                  <app-real-time-monitoring></app-real-time-monitoring>
                </div>
              </div>
              
              <!-- COMPONENT 2: Financial Trend Chart -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <i class="pi pi-chart-line text-emerald-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Financial Performance Trends</h2>
                      <p class="text-slate-400 text-sm mt-1">Revenue, expenses, profitability, and growth metrics over time</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-download mr-2"></i>
                      Export Data
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-filter mr-2"></i>
                      Filter Views
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-financial-trend-chart></app-financial-trend-chart>
                </div>
              </div>
              
              <!-- COMPONENT 3: System Audit Alerts -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <i class="pi pi-exclamation-triangle text-amber-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">System Integrity & Security Alerts</h2>
                      <p class="text-slate-400 text-sm mt-1">Critical system events, security alerts, and audit trail monitoring</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-rose-500/10 text-rose-400">
                      <i class="pi pi-shield mr-2"></i>
                      High Priority
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-eye mr-2"></i>
                      View All
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-system-audit-alerts></app-system-audit-alerts>
                </div>
              </div>
              
              <!-- COMPONENT 4: Branch Comparison -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <i class="pi pi-building text-purple-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Multi-Branch Performance Comparison</h2>
                      <p class="text-slate-400 text-sm mt-1">Cross-location analysis, performance benchmarking, and regional insights</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-plus mr-2"></i>
                      Add Branch
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-chart-bar mr-2"></i>
                      Detailed Report
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-branch-comparison></app-branch-comparison>
                </div>
              </div>
            </div>

            <!-- FINANCIAL TAB -->
            <div *ngIf="activeTab === 'financial'" class="space-y-8">
              <div class="mb-8">
                <h1 class="text-3xl font-black text-white mb-3">Financial Intelligence Hub</h1>
                <p class="text-slate-400 text-sm max-w-3xl">Comprehensive financial analysis, cash flow management, and strategic planning tools</p>
              </div>
              
              <!-- COMPONENT 1: Financial Dashboard -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                      <i class="pi pi-wallet text-emerald-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Comprehensive Financial Dashboard</h2>
                      <p class="text-slate-400 text-sm mt-1">Key financial metrics, KPIs, and performance indicators</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-emerald-500/10 text-emerald-400">
                      <i class="pi pi-check-circle mr-2"></i>
                      Updated Today
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-refresh mr-2"></i>
                      Refresh Data
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-financial-dashboard></app-financial-dashboard>
                </div>
              </div>
              
              <!-- COMPONENT 2: Cash Flow Analysis -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                      <i class="pi pi-money-bill text-blue-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Cash Flow Analysis & Liquidity Management</h2>
                      <p class="text-slate-400 text-sm mt-1">Inflow/outflow tracking, liquidity forecasting, and working capital optimization</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-calendar mr-2"></i>
                      Forecast
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-chart-pie mr-2"></i>
                      Analyze
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-cash-flow-analysis></app-cash-flow-analysis>
                </div>
              </div>
              
              <!-- COMPONENT 3: EMI Analytics -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                      <i class="pi pi-credit-card text-amber-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">EMI & Credit Portfolio Analytics</h2>
                      <p class="text-slate-400 text-sm mt-1">Loan performance, repayment patterns, and credit risk assessment</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-amber-500/10 text-amber-400">
                      <i class="pi pi-clock mr-2"></i>
                      Active Monitoring
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-file-pdf mr-2"></i>
                      Generate Report
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-emi-analytics></app-emi-analytics>
                </div>
              </div>
            </div>

            <!-- CUSTOMERS TAB -->
            <div *ngIf="activeTab === 'customers'" class="space-y-8">
              <div class="mb-8">
                <h1 class="text-3xl font-black text-white mb-3">Customer Intelligence Center</h1>
                <p class="text-slate-400 text-sm max-w-3xl">Deep customer insights, segmentation, and lifetime value optimization</p>
              </div>
              
              <!-- COMPONENT 1: Customer Intelligence -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <i class="pi pi-user text-purple-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Customer Intelligence Dashboard</h2>
                      <p class="text-slate-400 text-sm mt-1">Comprehensive customer analytics, behavior tracking, and engagement metrics</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-users mr-2"></i>
                      Manage Segments
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-bell mr-2"></i>
                      Set Alerts
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-customer-intelligence></app-customer-intelligence>
                </div>
              </div>
              
              <!-- COMPONENT 2: Customer Segmentation -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center">
                      <i class="pi pi-sitemap text-indigo-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Advanced Customer Segmentation</h2>
                      <p class="text-slate-400 text-sm mt-1">Demographic, behavioral, and value-based customer grouping</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-indigo-500/10 text-indigo-400">
                      <i class="pi pi-tags mr-2"></i>
                      8 Segments Active
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-plus mr-2"></i>
                      Create Segment
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-customer-segmentation></app-customer-segmentation>
                </div>
              </div>
              
              <!-- COMPONENT 3: Customer LTV Analysis -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <i class="pi pi-star text-emerald-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Customer Lifetime Value Analysis</h2>
                      <p class="text-slate-400 text-sm mt-1">Predictive modeling of customer value, retention strategies, and ROI optimization</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-chart-line mr-2"></i>
                      View Projections
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-calculator mr-2"></i>
                      Calculate ROI
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-customer-ltv-analysis></app-customer-ltv-analysis>
                </div>
              </div>
            </div>

            <!-- INVENTORY TAB -->
            <div *ngIf="activeTab === 'inventory'" class="space-y-8">
              <div class="mb-8">
                <h1 class="text-3xl font-black text-white mb-3">Inventory Command Center</h1>
                <p class="text-slate-400 text-sm max-w-3xl">End-to-end inventory management, stock optimization, and product analytics</p>
              </div>
              
              <!-- COMPONENT 1: Product Performance -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <i class="pi pi-shopping-bag text-amber-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Product Performance Analytics</h2>
                      <p class="text-slate-400 text-sm mt-1">Sales performance, profitability, and product lifecycle management</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-emerald-500/10 text-emerald-400">
                      <i class="pi pi-chart-bar mr-2"></i>
                      Top Performers
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-box mr-2"></i>
                      View Catalog
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-product-performance></app-product-performance>
                </div>
              </div>
              
              <!-- COMPONENT 2: Dead Stock Analysis -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center">
                      <i class="pi pi-exclamation-circle text-rose-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Dead Stock & Inventory Health Analysis</h2>
                      <p class="text-slate-400 text-sm mt-1">Identify slow-moving items, optimize stock levels, and reduce carrying costs</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-rose-500/10 text-rose-400">
                      <i class="pi pi-exclamation-triangle mr-2"></i>
                      Action Required
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-trash mr-2"></i>
                      Clear Dead Stock
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-dead-stock-analysis></app-dead-stock-analysis>
                </div>
              </div>
              
              <!-- COMPONENT 3: Order Funnel Chart -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <i class="pi pi-filter text-blue-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Order Conversion Funnel Analysis</h2>
                      <p class="text-slate-400 text-sm mt-1">Track order stages, identify drop-offs, and optimize conversion rates</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-chart-line mr-2"></i>
                      Analyze Funnel
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-cog mr-2"></i>
                      Optimize Steps
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-order-funnel-chart></app-order-funnel-chart>
                </div>
              </div>
              
              <!-- COMPONENT 4: Sales Distribution Chart -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <i class="pi pi-chart-pie text-purple-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Sales Distribution & Channel Analysis</h2>
                      <p class="text-slate-400 text-sm mt-1">Channel performance, regional distribution, and category analysis</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-map mr-2"></i>
                      Regional View
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-share-alt mr-2"></i>
                      Channel Mix
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-sales-distribution-chart></app-sales-distribution-chart>
                </div>
              </div>
            </div>

            <!-- AI ANALYTICS TAB -->
            <div *ngIf="activeTab === 'analytics'" class="space-y-8">
              <div class="mb-8">
                <h1 class="text-3xl font-black text-white mb-3">AI-Powered Analytics Suite</h1>
                <p class="text-slate-400 text-sm max-w-3xl">Predictive insights, machine learning models, and intelligent forecasting</p>
              </div>
              
              <!-- COMPONENT 1: Predictive Analytics -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                      <i class="pi pi-brain text-purple-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Predictive Analytics Engine</h2>
                      <p class="text-slate-400 text-sm mt-1">AI-driven predictions, trend analysis, and pattern recognition</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-purple-500/10 text-purple-400">
                      <i class="pi pi-bolt mr-2"></i>
                      AI Active
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-magic mr-2"></i>
                      Run Analysis
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-predictive-analytics></app-predictive-analytics>
                </div>
              </div>
              
              <!-- COMPONENT 2: Sales Forecast -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                      <i class="pi pi-chart-bar text-blue-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Intelligent Sales Forecasting</h2>
                      <p class="text-slate-400 text-sm mt-1">Revenue projections, demand prediction, and market trend analysis</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-calendar-plus mr-2"></i>
                      Extend Forecast
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-download mr-2"></i>
                      Export Projections
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-sales-forecast></app-sales-forecast>
                </div>
              </div>
              
              <!-- COMPONENT 3: Operational Metrics -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <i class="pi pi-cog text-emerald-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Operational Excellence Metrics</h2>
                      <p class="text-slate-400 text-sm mt-1">Process efficiency, productivity tracking, and performance optimization</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-emerald-500/10 text-emerald-400">
                      <i class="pi pi-check-circle mr-2"></i>
                      Optimized
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-chart-line mr-2"></i>
                      View Trends
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-operational-metrics></app-operational-metrics>
                </div>
              </div>
              
              <!-- COMPONENT 4: Peak Hours Analysis -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <i class="pi pi-clock text-amber-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Peak Hours & Time-Based Analysis</h2>
                      <p class="text-slate-400 text-sm mt-1">Business hour optimization, demand patterns, and resource allocation</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-chart-line mr-2"></i>
                      Time Analysis
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-users mr-2"></i>
                      Staff Planning
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-peak-hours-analysis></app-peak-hours-analysis>
                </div>
              </div>
              
              <!-- COMPONENT 5: Staff Performance Analysis -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center">
                      <i class="pi pi-user-edit text-indigo-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Staff Performance & Productivity Analysis</h2>
                      <p class="text-slate-400 text-sm mt-1">Team efficiency, individual performance tracking, and skill gap analysis</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-id-card mr-2"></i>
                      View Profiles
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-chart-pie mr-2"></i>
                      Performance Report
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-staff-performance-analysis></app-staff-performance-analysis>
                </div>
              </div>
              
              <!-- COMPONENT 6: Branch Radar Chart -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                      <i class="pi pi-radar-chart text-rose-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Multi-Dimensional Branch Comparison</h2>
                      <p class="text-slate-400 text-sm mt-1">Radar analysis of branch performance across multiple KPIs and metrics</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-compass mr-2"></i>
                      Compare Metrics
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-download mr-2"></i>
                      Export Comparison
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-branch-radar-chart></app-branch-radar-chart>
                </div>
              </div>
              
              <!-- COMPONENT 7: Time Analytics -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                      <i class="pi pi-history text-cyan-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Advanced Time Series Analytics</h2>
                      <p class="text-slate-400 text-sm mt-1">Temporal pattern analysis, seasonality detection, and time-based forecasting</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-cyan-500/10 text-cyan-400">
                      <i class="pi pi-clock mr-2"></i>
                      Real-time
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-chart-line mr-2"></i>
                      View Patterns
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-time-analytics></app-time-analytics>
                </div>
              </div>
            </div>

            <!-- COMPLIANCE TAB -->
            <div *ngIf="activeTab === 'compliance'" class="space-y-8">
              <div class="mb-8">
                <h1 class="text-3xl font-black text-white mb-3">Compliance & Integrity Hub</h1>
                <p class="text-slate-400 text-sm max-w-3xl">Audit trails, regulatory compliance, data governance, and reporting</p>
              </div>
              
              <!-- COMPONENT 1: Compliance Dashboard -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <i class="pi pi-shield text-cyan-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Regulatory Compliance Dashboard</h2>
                      <p class="text-slate-400 text-sm mt-1">Compliance status, audit tracking, and regulatory requirement monitoring</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="status-badge bg-cyan-500/10 text-cyan-400">
                      <i class="pi pi-check-circle mr-2"></i>
                      Compliant
                    </span>
                    <button class="action-btn">
                      <i class="pi pi-file-check mr-2"></i>
                      Run Audit
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-compliance-dashboard></app-compliance-dashboard>
                </div>
              </div>
              
              <!-- COMPONENT 2: System Data Health -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                      <i class="pi pi-database text-emerald-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">System Data Health & Integrity</h2>
                      <p class="text-slate-400 text-sm mt-1">Data quality monitoring, system integrity checks, and health status</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-heart mr-2"></i>
                      Health Check
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-wrench mr-2"></i>
                      Run Diagnostics
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-system-data-health></app-system-data-health>
                </div>
              </div>
              
              <!-- COMPONENT 3: Analytics Export Hub -->
              <div class="fullwidth-card">
                <div class="card-header">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <i class="pi pi-file-export text-amber-400 text-lg"></i>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-white">Analytics Export & Reporting Hub</h2>
                      <p class="text-slate-400 text-sm mt-1">Data export, report generation, and automated document creation</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <button class="action-btn">
                      <i class="pi pi-file-pdf mr-2"></i>
                      PDF Report
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-file-excel mr-2"></i>
                      Excel Export
                    </button>
                    <button class="action-btn">
                      <i class="pi pi-print mr-2"></i>
                      Print All
                    </button>
                  </div>
                </div>
                <div class="card-content">
                  <app-analytics-export-hub></app-analytics-export-hub>
                </div>
              </div>
            </div>

          </div>
        </p-scrollPanel>
      </main>
    </div>
  `,
  styles: [`
    /* Full Width Card Layout */
    .fullwidth-card {
      background: var(--theme-bg-secondary);
      border: 1px solid var(--theme-border-primary);
      border-radius: 20px;
      margin-bottom: 2rem;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 32px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.5s ease-out;
    }
    
    .fullwidth-card:hover {
      border-color: var(--theme-border-secondary);
      box-shadow: 0 8px 48px rgba(0, 0, 0, 0.25);
      transform: translateY(-4px);
    }
    
    .card-header {
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--theme-border-primary);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .card-content {
      padding: 2rem;
    }
    
    /* Full Width Tabs */
    .fullwidth-tab {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-radius: 16px;
      color: var(--theme-text-tertiary);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      min-width: 220px;
      position: relative;
      flex: 1;
    }
    
    .fullwidth-tab:hover {
      background: rgba(255, 255, 255, 0.03);
      color: var(--theme-text-primary);
      border-color: var(--theme-border-primary);
    }
    
    .fullwidth-tab.active {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--theme-border-secondary);
      color: var(--theme-text-primary);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    .fullwidth-tab.active .fullwidth-indicator {
      position: absolute;
      bottom: -3px;
      left: 1.5rem;
      right: 1.5rem;
      height: 3px;
      background: var(--theme-accent-gradient);
      border-radius: 2px;
      animation: slideIn 0.3s ease;
    }
    
    /* Action Buttons */
    .action-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.625rem 1.25rem;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      color: var(--theme-accent-primary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .action-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
    }
    
    .action-btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--theme-border-primary);
      border-radius: 12px;
      color: var(--theme-text-tertiary);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .action-btn-icon:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--theme-text-primary);
      border-color: var(--theme-border-secondary);
      transform: scale(1.05);
    }
    
    /* Status Badges */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 0.875rem;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    
    /* Scrollbar Styling */
    .custom-scroll ::ng-deep .p-scrollpanel-bar {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .custom-scroll ::ng-deep .p-scrollpanel-bar:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    /* Animations */
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideIn {
      from {
        width: 0;
        opacity: 0;
      }
      to {
        width: calc(100% - 3rem);
        opacity: 1;
      }
    }
    
    /* Responsive Design */
    @media (max-width: 1024px) {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .fullwidth-tab {
        min-width: 180px;
      }
      
      .card-content {
        padding: 1.5rem;
      }
    }
    
    @media (max-width: 768px) {
      .fullwidth-tab {
        min-width: auto;
        padding: 0.75rem;
      }
      
      .fullwidth-tab .text-left div:first-child {
        font-size: 12px;
      }
      
      .fullwidth-tab .text-left div:last-child {
        display: none;
      }
      
      .card-header {
        padding: 1rem;
      }
      
      .card-content {
        padding: 1rem;
      }
      
      .action-btn {
        padding: 0.5rem 1rem;
        font-size: 12px;
      }
    }
    
    /* Ensure each component takes full width */
    app-real-time-monitoring,
    app-financial-trend-chart,
    app-system-audit-alerts,
    app-branch-comparison,
    app-financial-dashboard,
    app-cash-flow-analysis,
    app-emi-analytics,
    app-customer-intelligence,
    app-customer-segmentation,
    app-customer-ltv-analysis,
    app-product-performance,
    app-dead-stock-analysis,
    app-order-funnel-chart,
    app-sales-distribution-chart,
    app-predictive-analytics,
    app-sales-forecast,
    app-operational-metrics,
    app-peak-hours-analysis,
    app-staff-performance-analysis,
    app-branch-radar-chart,
    app-time-analytics,
    app-compliance-dashboard,
    app-system-data-health,
    app-analytics-export-hub {
      display: block;
      width: 100%;
    }
  `]
})
export class AdminMasterHubComponent implements OnInit {
  activeTab: string = 'overview';
  branches = [
    { name: 'Head Office (Surat)', id: 'HO-01' },
    { name: 'Varachha Branch', id: 'BR-01' },
    { name: 'Adajan Showroom', id: 'BR-02' },
    { name: 'Katargam Warehouse', id: 'BR-03' },
    { name: 'Mumbai Branch', id: 'BR-04' },
    { name: 'Delhi Branch', id: 'BR-05' }
  ];
  selectedBranch: any;
  dateRange: Date[] | undefined;

  constructor() { }
  
  ngOnInit() { 
    this.selectedBranch = this.branches[0];
  }
}


// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // PrimeNG & UI Imports
// import { SelectModule } from 'primeng/select';
// import { DatePickerModule } from 'primeng/datepicker';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { TabsModule } from 'primeng/tabs';
// import { BadgeModule } from 'primeng/badge';
// import { Component, OnInit } from '@angular/core';
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
// import { Avatar } from "primeng/avatar";
// import { TimeAnalyticsComponent } from "./components/time-analytics.component";
// import { DashboardUI } from "./components/dashboard.ui";

// // Component Imports (Assume all 24 components are imported here as in your previous snippet)

// @Component({
//   selector: 'app-admin-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, SelectModule, DatePickerModule,
//     ButtonModule, TooltipModule, TabsModule, BadgeModule,
//     RealTimeMonitoringComponent,
//     FinancialTrendChartComponent,
//     SystemAuditAlertsComponent,
//     BranchComparisonComponent,
//     FinancialDashboardComponent,
//     CashFlowAnalysisComponent,
//     EmiAnalyticsComponent,
//     CustomerIntelligenceComponent,
//     CustomerSegmentationComponent,
//     CustomerLtvAnalysisComponent,
//     ProductPerformanceComponent,
//     DeadStockAnalysisComponent,
//     OrderFunnelChartComponent,
//     SalesDistributionChartComponent,
//     PredictiveAnalyticsComponent,
//     SalesForecastComponent,
//     OperationalMetricsComponent,
//     PeakHoursAnalysisComponent,
//     StaffPerformanceAnalysisComponent,
//     BranchRadarChartComponent,
//     ComplianceDashboardComponent,
//     SystemDataHealthComponent,
//     AnalyticsExportHubComponent,
//     Avatar,
//     TimeAnalyticsComponent,
//     DashboardUI
//   ],
//   template: `
//     <div class="min-h-screen flex flex-col transition-colors duration-500" 
//          [style.background]="'var(--theme-bg-primary)'">
// <div class="z-[70] border-b px-6 py-2.5 flex items-center justify-between sticky top-0 backdrop-blur-xl"
//            [style.background]="'rgba(15, 23, 42, 0.8)'"
//            [style.border-color]="'var(--theme-border-primary)'">
        
//         <div class="flex items-center gap-3 shrink-0">
//           <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300"
//                [style.background]="'var(--theme-accent-gradient)'">
//             <i class="pi pi-bolt text-xs"></i>
//           </div>
//           <div class="flex flex-col">
//             <h2 class="font-black tracking-[0.15em] text-white text-[11px] uppercase leading-none">Apex Infinity</h2>
//             <span class="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Data Engine</span>
//           </div>
//         </div>

//         <div class="hidden md:flex items-center bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-full border border-white/10 p-1.5 w-full max-w-md shadow-2xl">
//           <p-select [options]="branches" [(ngModel)]="selectedBranch" 
//                     optionLabel="name" placeholder="Branch"
//                     [style]="{'background': 'transparent', 'border': 'none', 'font-size': '11px', 'height': '28px', 'flex': '1'}">
//           </p-select>
//           <div class="w-[1px] h-3 bg-white/10 mx-2"></div>
//           <p-datePicker [(ngModel)]="dateRange" selectionMode="range" [showIcon]="false"
//                         placeholder="Timeline Range" [readonlyInput]="true"
//                         [style]="{'background': 'transparent', 'border': 'none', 'font-size': '11px', 'height': '28px', 'flex': '1.5'}">
//           </p-datePicker>
//           <button class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all ml-1">
//              <i class="pi pi-search text-[10px]"></i>
//           </button>
//         </div>

//         <div class="flex items-center gap-4 shrink-0">
//           <div class="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
//             <button class="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
//               <i class="pi pi-bell text-xs"></i>
//             </button>
//             <button class="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
//               <i class="pi pi-sync text-xs"></i>
//             </button>
//           </div>
//           <p-avatar label="MS" shape="circle" styleClass="bg-indigo-500/20 text-indigo-400 font-bold text-xs ring-1 ring-indigo-500/30"></p-avatar>
//         </div>
//       </div>

//       <div class="z-[60] border-b flex items-center justify-center py-2 gap-1.5 overflow-x-auto no-scrollbar"
//            [style.background]="'var(--theme-bg-secondary)'"
//            [style.border-color]="'var(--theme-border-primary)'">
        
//         <button class="nav-minimal-btn" [class.active]="activeTab === '0'" (click)="activeTab = '0'">
//           <i class="pi pi-home"></i> <span>Overview</span>
//         </button>
//         <button class="nav-minimal-btn" [class.active]="activeTab === '1'" (click)="activeTab = '1'">
//           <i class="pi pi-wallet"></i> <span>Financials</span>
//         </button>
//         <button class="nav-minimal-btn" [class.active]="activeTab === '2'" (click)="activeTab = '2'">
//           <i class="pi pi-users"></i> <span>CRM</span>
//         </button>
//         <button class="nav-minimal-btn" [class.active]="activeTab === '3'" (click)="activeTab = '3'">
//           <i class="pi pi-box"></i> <span>Inventory</span>
//         </button>
//         <button class="nav-minimal-btn" [class.active]="activeTab === '4'" (click)="activeTab = '4'">
//           <i class="pi pi-bolt"></i> <span>AI Ops</span>
//         </button>
//         <button class="nav-minimal-btn" [class.active]="activeTab === '5'" (click)="activeTab = '5'">
//           <i class="pi pi-shield"></i> <span>Integrity</span>
//         </button>
//       </div>
//       <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
//         <div class="max-w-[1400px] mx-auto w-full">
          
//           <p-tabs [(value)]="activeTab">
//             <p-tabpanels styleClass="p-0 " [style.background]="'var(--theme-bg-primary)'">
//               <p-tabpanel value="0">
//                 <div class="flex flex-col gap-6">
//                   <app-admin-dashboard-Ui></app-admin-dashboard-Ui>
//                    <app-real-time-monitoring></app-real-time-monitoring>
//                    <app-financial-trend-chart></app-financial-trend-chart>
//                    <app-system-audit-alerts></app-system-audit-alerts>
//                    <app-branch-comparison></app-branch-comparison>
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="1">
//                 <div class="flex flex-col gap-6">
//                   <app-financial-dashboard></app-financial-dashboard>
//                   <app-cash-flow-analysis></app-cash-flow-analysis>
//                   <app-emi-analytics></app-emi-analytics>
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="2">
//                 <div class="flex flex-col gap-6">
//                   <app-customer-intelligence></app-customer-intelligence>
//                   <app-customer-segmentation></app-customer-segmentation>
//                   <app-customer-ltv-analysis></app-customer-ltv-analysis>
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="3">
//                 <div class="flex flex-col gap-6">
//                    <app-product-performance></app-product-performance>
//                    <app-dead-stock-analysis></app-dead-stock-analysis>
//                    <app-order-funnel-chart></app-order-funnel-chart>
//                    <app-sales-distribution-chart></app-sales-distribution-chart>
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="4">
//                 <div class="flex flex-col gap-6">
//                    <app-predictive-analytics></app-predictive-analytics>
//                    <app-sales-forecast></app-sales-forecast>
//                    <app-operational-metrics></app-operational-metrics>
//                    <app-peak-hours-analysis></app-peak-hours-analysis>
//                    <app-staff-performance-analysis></app-staff-performance-analysis>
//                    <app-branch-radar-chart></app-branch-radar-chart>
//                    <app-time-analytics></app-time-analytics>
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="5">
//                 <div class="flex flex-col gap-6">
//                    <app-compliance-dashboard></app-compliance-dashboard>
//                    <app-system-data-health></app-system-data-health>
//                    <app-analytics-export-hub></app-analytics-export-hub>
//                 </div>
//               </p-tabpanel>

//             </p-tabpanels>
//           </p-tabs>
//         </div>
//       </main>
//     </div>
//   `,
//   styles: [`
//     .nav-stack-btn {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       padding: 8px 16px;
//       gap: 4px;
//       border-radius: 12px;
//       color: var(--theme-text-tertiary);
//       transition: all 0.2s ease;
//       cursor: pointer;
//       border: none;
//       background: transparent;
//       min-width: 80px;
//     }
//     .nav-stack-btn i { font-size: 1.1rem; }
//     .nav-stack-btn span { font-size: 10px; font-weight: 700; text-transform: uppercase; }
//     .nav-stack-btn.active {
//       color: var(--theme-accent-primary);
//       background: rgba(99, 102, 241, 0.08);
//     }
//     /* Vertical Stack ensures each app-selector is the only thing in the row */
//     main app-real-time-monitoring, main app-financial-trend-chart, 
//     main app-system-audit-alerts, main app-branch-comparison,
//     main app-financial-dashboard, main app-cash-flow-analysis,
//     main app-emi-analytics, main app-customer-intelligence,
//     main app-customer-segmentation, main app-customer-ltv-analysis,
//     main app-product-performance, main app-dead-stock-analysis,
//     main app-order-funnel-chart, main app-sales-distribution-chart,
//     main app-predictive-analytics, main app-sales-forecast,
//     main app-operational-metrics, main app-peak-hours-analysis,
//     main app-staff-performance-analysis, main app-branch-radar-chart,
//     main app-time-analytics, main app-compliance-dashboard,
//     main app-system-data-health, main app-analytics-export-hub {
//       display: block;
//       width: 100%;
//     }
//     .nav-minimal-btn {
//       display: flex;
//       align-items: center;
//       padding: 6px 12px;
//       gap: 8px;
//       border-radius: 8px;
//       color: var(--theme-text-tertiary);
//       transition: all 0.2s ease;
//       cursor: pointer;
//       border: 1px solid transparent;
//       background: transparent;
//     }
//     .nav-minimal-btn i { font-size: 0.85rem; opacity: 0.7; }
//     .nav-minimal-btn span { 
//       font-size: 11px; 
//       font-weight: 600; 
//       letter-spacing: 0.02em;
//     }
//     .nav-minimal-btn:hover {
//       background: rgba(255,255,255,0.04);
//       color: var(--theme-text-primary);
//     }
//     .nav-minimal-btn.active {
//       color: var(--theme-text-primary);
//       background: rgba(255,255,255,0.06);
//       border-color: var(--theme-border-primary);
//       box-shadow: 0 4px 12px rgba(0,0,0,0.1);
//     }
//     .nav-minimal-btn.active i { color: var(--theme-accent-primary); opacity: 1; }

//     .no-scrollbar::-webkit-scrollbar { display: none; }
//     .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

//     /* Component vertical stacking */
//     main app-real-time-monitoring, main app-financial-trend-chart, 
//     main app-system-audit-alerts, main app-branch-comparison,
//     main app-financial-dashboard, main app-cash-flow-analysis,
//     main app-emi-analytics, main app-customer-intelligence,
//     main app-customer-segmentation, main app-customer-ltv-analysis,
//     main app-product-performance, main app-dead-stock-analysis,
//     main app-order-funnel-chart, main app-sales-distribution-chart,
//     main app-predictive-analytics, main app-sales-forecast,
//     main app-operational-metrics, main app-peak-hours-analysis,
//     main app-staff-performance-analysis, main app-branch-radar-chart,
//     main app-time-analytics, main app-compliance-dashboard,
//     main app-system-data-health, main app-analytics-export-hub {
//       display: block;
//       width: 100%;
//     }
//   `]
// })
// export class AdminMasterHubComponent implements OnInit {
//   activeTab: string = '0'; // Controller for the Tab Panels
//   branches = [
//     { name: 'Surat Head Office', id: 'HO-01' },
//     { name: 'Varachha Branch', id: 'BR-01' },
//     { name: 'Adajan Showroom', id: 'BR-02' }
//   ];
//   selectedBranch: any;
//   dateRange: Date[] | undefined;

//   constructor() { }
//   ngOnInit() { }
// }
