import { Routes } from '@angular/router';
import { InvoiceDetailsComponent } from './components/invoice-details/invoice-details';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form';
import { InvoiceListComponent } from './components/invoice-list/invoice-list';
import { ProductProfitPopupComponent } from './analytics/product-profit-popup/product-profit-popup.component';
import { ProfitSummaryComponent } from './analytics/invoice-analytics/invoice-profitsummary';
import { ProfitDashboardComponent } from './analytics/invoice-analytics/invoice-analyticsDashboard';
import { AdvancedProfitAnalysisComponent } from './analytics/invoice-analytics/advanceInvoiceDetails';
import { PosInvoiceComponent } from './components/pos-invoice/pos-invoice.component';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { ProfitDashboardComponentNew } from './analytics/invoice-analytics/profitDashboard/profit-dashboard.component';
import { TabRouterGuard } from '../../Tabbing';

// These routes will be lazy-loaded under a '/invoices' path (defined in app.routes.ts)
export const INVOICE_ROUTES: Routes = [
  {
    path: 'PosInvoiceComponent',
    component: PosInvoiceComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'POS Terminal', tabIcon: 'pi pi-print', permissions: [PERMISSIONS.INVOICE.CREATE] }
  },
  {
    path: 'ProfitSummaryComponent',
    component: ProfitSummaryComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Profit Summary', tabIcon: 'pi pi-file-excel', permissions: [PERMISSIONS.REPORT.PROFIT] }
  },
  {
    path: 'ProfitDashboardComponent',
    component: ProfitDashboardComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Profit Center', tabIcon: 'pi pi-chart-pie', permissions: [PERMISSIONS.REPORT.PROFIT] }
  },
  {
    path: 'profitDashboardNew',
    component: ProfitDashboardComponentNew,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Advanced BI', tabIcon: 'pi pi-chart-line', permissions: [PERMISSIONS.REPORT.PROFIT] }
  },
  {
    path: 'AdvancedProfitAnalysisComponent',
    component: AdvancedProfitAnalysisComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Analysis Suite', tabIcon: 'pi pi-search-plus', permissions: [PERMISSIONS.REPORT.PROFIT] }
  },
  {
    path: '',
    component: InvoiceListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Invoice Registry', tabIcon: 'pi pi-list', permissions: [PERMISSIONS.INVOICE.READ] }
  },
  {
    path: 'create',
    component: InvoiceFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Create Invoice', tabIcon: 'pi pi-plus', permissions: [PERMISSIONS.INVOICE.CREATE] }
  },
  {
    path: ':id',
    component: InvoiceDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Invoice Details', tabIcon: 'pi pi-file', permissions: [PERMISSIONS.INVOICE.READ] }
  },
  {
    path: ':id/edit',
    component: InvoiceFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Edit Invoice', tabIcon: 'pi pi-pencil', permissions: [PERMISSIONS.INVOICE.UPDATE] }
  },
];