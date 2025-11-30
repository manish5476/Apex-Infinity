import { Routes } from '@angular/router';
import { PurchaseFormComponent } from './purchase-form/purchase-form';
import { PurchaseListComponent } from './purchase-list/purchase-list';
import { PurchaseDetailsComponent } from './purchase-details/purchase-details';

// These routes will be lazy-loaded under a '/purchases' path (defined in app.routes.ts)
export const PURCHASE_ROUTES: Routes = [
  {
    path: '',
    component: PurchaseListComponent,
    title: 'Purchase Orders'
  },
  {
    path: 'create',
    component: PurchaseFormComponent,
    title: 'Create Purchase'
  },
  {
    path: ':id',
    component: PurchaseDetailsComponent,
    title: 'Purchase Details'
  },
  {
    path: ':id/edit',
    component: PurchaseFormComponent,
    title: 'Edit Purchase'
  },
];