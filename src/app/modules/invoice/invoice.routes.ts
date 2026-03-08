import { Routes } from '@angular/router';
import { InvoiceDetailsComponent } from './components/invoice-details/invoice-details';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form';
import { InvoiceListComponent } from './components/invoice-list/invoice-list';
import { ProductProfitPopupComponent } from './analytics/product-profit-popup/product-profit-popup.component';
import { ProfitSummaryComponent } from './analytics/invoice-analytics/invoice-profitsummary';
import { ProfitDashboardComponent } from './analytics/invoice-analytics/invoice-analyticsDashboard';
import { AdvancedProfitAnalysisComponent } from './analytics/invoice-analytics/advanceInvoiceDetails';
import { PosInvoiceComponent } from './components/pos-invoice/pos-invoice.component';
// These routes will be lazy-loaded under a '/invoices' path (defined in app.routes.ts)
export const INVOICE_ROUTES: Routes = [
  {
    path: 'PosInvoiceComponent',
    component: PosInvoiceComponent,
  },
  {
    path: 'ProfitSummaryComponent',
    component: ProfitSummaryComponent,
  },
  {
    path: 'ProfitDashboardComponent',
    component: ProfitDashboardComponent,
  },
  {
    path: 'AdvancedProfitAnalysisComponent',
    component: AdvancedProfitAnalysisComponent,
  },
  {
    path: '',
    component: InvoiceListComponent,
  },

  {
    path: 'create',
    component: InvoiceFormComponent,
  },
  {
    path: ':id',
    component: InvoiceDetailsComponent,
  },
  {
    path: ':id/edit',
    component: InvoiceFormComponent,
  },

];