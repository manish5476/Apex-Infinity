import { Routes } from '@angular/router';
import { InvoiceDetailsComponent } from './components/invoice-details/invoice-details';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form';
import { InvoiceListComponent } from './components/invoice-list/invoice-list';
// These routes will be lazy-loaded under a '/invoices' path (defined in app.routes.ts)
export const INVOICE_ROUTES: Routes = [
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