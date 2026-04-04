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

// These routes will be lazy-loaded under a '/invoices' path (defined in app.routes.ts)
export const INVOICE_ROUTES: Routes = [
  {
    path: 'PosInvoiceComponent',
    component: PosInvoiceComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.INVOICE.CREATE] }
  },
  {
    path: 'ProfitSummaryComponent',
    component: ProfitSummaryComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.REPORT.PROFIT] }
  },
  {
    path: 'ProfitDashboardComponent',
    component: ProfitDashboardComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.REPORT.PROFIT] }
  },
  {
    path: 'profitDashboardNew',
    component: ProfitDashboardComponentNew,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.REPORT.PROFIT] }
  },
  {
    path: 'AdvancedProfitAnalysisComponent',
    component: AdvancedProfitAnalysisComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.REPORT.PROFIT] }
  },
  {
    path: '',
    component: InvoiceListComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.INVOICE.READ] }
  },

  {
    path: 'create',
    component: InvoiceFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.INVOICE.CREATE] }
  },
  {
    path: ':id',
    component: InvoiceDetailsComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.INVOICE.READ] }
  },
  {
    path: ':id/edit',
    component: InvoiceFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.INVOICE.UPDATE] }
  },

];