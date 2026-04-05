import { Routes } from '@angular/router';
import { TabRouterGuard } from '../Tabbing/index';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

/**
 * Child routes for AdminDashboardComponent (Analytics Hub)
 * Each route is wrapped in TabRouterGuard + permissionGuard.
 */
export const ADMIN_ANALYTICS_ROUTES: Routes = [
  {
    path: 'executive',
    loadComponent: () => import('./components/dashboard.ui').then(m => m.DashboardUI),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Executive', 
      tabIcon: 'pi pi-objects-column', 
      tabPinned: true, 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE]
    }
  },
  {
    path: 'charts-hub',
    loadComponent: () => import('./admin-charts-analysis.component').then(m => m.AdminChartsAnalysisComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Charts Hub', 
      tabIcon: 'pi pi-chart-scatter', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE]
    }
  },
  {
    path: 'live-monitor',
    loadComponent: () => import('./components/real-time-monitoring.component').then(m => m.RealTimeMonitoringComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Live Monitor', 
      tabIcon: 'pi pi-bolt', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_ALERTS]
    }
  },
  {
    path: 'audit-logs',
    loadComponent: () => import('./components/system-audit-alerts.component').then(m => m.SystemAuditAlertsComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Audit Logs', 
      tabIcon: 'pi pi-list-check', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_SECURITY_AUDIT]
    }
  },
  {
    path: 'branch-compare',
    loadComponent: () => import('./components/admin.branch.comparison').then(m => m.BranchComparisonComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Branch Compare', 
      tabIcon: 'pi pi-building', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_BRANCH_COMPARISON]
    }
  },
  {
    path: 'finance-main',
    loadComponent: () => import('./components/admin.finanical.analytics').then(m => m.FinancialDashboardComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Financials', 
      tabIcon: 'pi pi-wallet', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL]
    }
  },
  {
    path: 'cash-flow',
    loadComponent: () => import('./components/admin.cashflow').then(m => m.CashFlowAnalysisComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Cash Flow', 
      tabIcon: 'pi pi-money-bill', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL]
    }
  },
  {
    path: 'emi-analytics',
    loadComponent: () => import('./components/emi-analytics.component').then(m => m.EmiAnalyticsComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'EMI Analytics', 
      tabIcon: 'pi pi-credit-card', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.EMI_READ]
    }
  },
  {
    path: 'customer-360',
    loadComponent: () => import('./components/customer-intelligence.component').then(m => m.CustomerIntelligenceComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Customer 360', 
      tabIcon: 'pi pi-users', 
      reuseTab: true,
      permissions: [PERMISSIONS.CUSTOMER.READ]
    }
  },
  {
    path: 'customer-segmentation',
    loadComponent: () => import('./components/customer-segmentation.component').then(m => m.CustomerSegmentationComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Segments', 
      tabIcon: 'pi pi-sitemap', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_CUSTOMER_SEGMENTATION]
    }
  },
  {
    path: 'customer-ltv-analysis',
    loadComponent: () => import('./components/customer-ltv-analysis.component').then(m => m.CustomerLtvAnalysisComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'LTV Analysis', 
      tabIcon: 'pi pi-star', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_CUSTOMER_LTV]
    }
  },
  {
    path: 'product-stats',
    loadComponent: () => import('./components/product-performance.component').then(m => m.ProductPerformanceComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Product Stats', 
      tabIcon: 'pi pi-box', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_INVENTORY]
    }
  },
  {
    path: 'dead-stock',
    loadComponent: () => import('./components/dead-stock-analysis.component').then(m => m.DeadStockAnalysisComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Dead Stock', 
      tabIcon: 'pi pi-exclamation-circle', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_STOCK_FORECAST]
    }
  },
  {
    path: 'predictive',
    loadComponent: () => import('./components/predictive-analytics.component').then(m => m.PredictiveAnalyticsComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Predictive', 
      tabIcon: 'pi pi-brain', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST]
    }
  },
  {
    path: 'sales-forecast',
    loadComponent: () => import('./components/sales-forecast.component').then(m => m.SalesForecastComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Forecast', 
      tabIcon: 'pi pi-chart-bar', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST]
    }
  },
  {
    path: 'operational',
    loadComponent: () => import('./components/operational-metrics.component').then(m => m.OperationalMetricsComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Operational', 
      tabIcon: 'pi pi-cog', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_OPERATIONAL]
    }
  },
  {
    path: 'peak-hours',
    loadComponent: () => import('./components/peak-hours-analysis.component').then(m => m.PeakHoursAnalysisComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Peak Hours', 
      tabIcon: 'pi pi-clock', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_STAFF_PERFORMANCE]
    }
  },
  {
    path: 'staff-performance',
    loadComponent: () => import('./components/staff-performance-analysis.component').then(m => m.StaffPerformanceAnalysisComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Staff Stats', 
      tabIcon: 'pi pi-user-edit', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_STAFF_PERFORMANCE]
    }
  },
  {
    path: 'compliance',
    loadComponent: () => import('./components/compliance-dashboard.component').then(m => m.ComplianceDashboardComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Compliance', 
      tabIcon: 'pi pi-shield', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_SECURITY_AUDIT]
    }
  },
  {
    path: 'data-health',
    loadComponent: () => import('./components/system-data-health.component').then(m => m.SystemDataHealthComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Data Health', 
      tabIcon: 'pi pi-database', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_SECURITY_AUDIT]
    }
  },
  {
    path: 'export-hub',
    loadComponent: () => import('./components/analytics-export-hub.component').then(m => m.AnalyticsExportHubComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Export Hub', 
      tabIcon: 'pi pi-download', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.EXPORT_DATA]
    }
  },
  {
    path: 'time-analytics',
    loadComponent: () => import('./components/time-analytics.component').then(m => m.TimeAnalyticsComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Time Analysis', 
      tabIcon: 'pi pi-calendar', 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_OPERATIONAL]
    }
  },
  {
    path: 'settings/ownership',
    loadComponent: () => import('../modules/organization/components/AcceptOwnershipComponent').then(m => m.AcceptOwnershipComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Accept Ownership', 
      tabIcon: 'pi pi-key', 
      reuseTab: true,
      permissions: [PERMISSIONS.OWNERSHIP.TRANSFER]
    }
  }
];
