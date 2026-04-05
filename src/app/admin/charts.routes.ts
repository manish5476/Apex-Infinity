import { Routes } from '@angular/router';
import { TabRouterGuard } from '../Tabbing/index';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

/**
 * Child routes for AdminChartsHubComponent
 * Each chart is its own tab-driven route.
 */
export const ADMIN_CHARTS_ROUTES: Routes = [
  {
    path: 'gallery',
    loadComponent: () => import('./admin-charts-analysis.component').then(m => m.AdminChartsAnalysisComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Gallery View', 
      tabIcon: 'pi pi-th-large', 
      tabPinned: true, 
      reuseTab: true,
      permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE]
    }
  },
  {
    path: 'aov',
    loadComponent: () => import('./charts/aov-trend-chart.component').then(m => m.AovTrendChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'AOV Trend', tabIcon: 'pi pi-chart-line', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] }
  },
  {
    path: 'radar',
    loadComponent: () => import('./charts/branch-radar-chart.component').then(m => m.BranchRadarChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Branch Radar', tabIcon: 'pi pi-map-marker', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_BRANCH_COMPARISON] }
  },
  {
    path: 'acquisition',
    loadComponent: () => import('./charts/customer-acquisition-chart.component').then(m => m.CustomerAcquisitionChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Acquisition', tabIcon: 'pi pi-user-plus', reuseTab: true, permissions: [PERMISSIONS.CUSTOMER.READ] }
  },
  {
    path: 'outstanding',
    loadComponent: () => import('./charts/customer-outstanding-chart.component').then(m => m.CustomerOutstandingChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Outstanding', tabIcon: 'pi pi-money-bill', reuseTab: true, permissions: [PERMISSIONS.CUSTOMER.READ] }
  },
  {
    path: 'emi',
    loadComponent: () => import('./charts/emi-portfolio-chart.component').then(m => m.EmiPortfolioChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'EMI Portfolio', tabIcon: 'pi pi-credit-card', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.EMI_READ] }
  },
  {
    path: 'financial',
    loadComponent: () => import('./charts/financial-trend-chart.component').then(m => m.FinancialTrendChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Finance Trend', tabIcon: 'pi pi-wallet', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] }
  },
  {
    path: 'gp',
    loadComponent: () => import('./charts/gross-profit-trend-chart.component').then(m => m.GrossProfitTrendChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Gross Profit', tabIcon: 'pi pi-dollar', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] }
  },
  {
    path: 'heatmap',
    loadComponent: () => import('./charts/heatmap-chart.component').then(m => m.HeatmapChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Heatmap', tabIcon: 'pi pi-th-large', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_OPERATIONAL] }
  },
  {
    path: 'inventory',
    loadComponent: () => import('./charts/inventory-health-chart.component').then(m => m.InventoryHealthChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Inventory Health', tabIcon: 'pi pi-box', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_INVENTORY] }
  },
  {
    path: 'funnel',
    loadComponent: () => import('./charts/order-funnel-chart.component').then(m => m.OrderFunnelChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Sales Funnel', tabIcon: 'pi pi-filter', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] }
  },
  {
    path: 'payment',
    loadComponent: () => import('./charts/payment-methods-chart.component').then(m => m.PaymentMethodsChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Payment Mix', tabIcon: 'pi pi-credit-card', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] }
  },
  {
    path: 'pvs',
    loadComponent: () => import('./charts/purchase-vs-sales-chart.component').then(m => m.PurchaseVsSalesChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Purchase/Sales', tabIcon: 'pi pi-chart-bar', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] }
  },
  {
    path: 'dist',
    loadComponent: () => import('./charts/sales-distribution-chart.component').then(m => m.SalesDistributionChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Sales Dist', tabIcon: 'pi pi-globe', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] }
  },
  {
    path: 'return',
    loadComponent: () => import('./charts/sales-return-rate-chart.component').then(m => m.SalesReturnRateChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Return Rate', tabIcon: 'pi pi-replay', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] }
  },
  {
    path: 'performers',
    loadComponent: () => import('./charts/top-performers-chart.component').then(m => m.TopPerformersChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Performers', tabIcon: 'pi pi-star', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE] }
  },
  {
    path: 'growth',
    loadComponent: () => import('./charts/yoy-growth-chart.component').then(m => m.YoyGrowthChartComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'YoY Growth', tabIcon: 'pi pi-arrow-up-right', reuseTab: true, permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] }
  }
];
