import { Routes } from '@angular/router';
import { PurchaseDetailsComponent } from './purchase-details/purchase-details';
import { PurchaseFormComponent } from './purchase-form/purchase-form';
import { PurchaseListComponent } from './purchase-list/purchase-list';
import { PurchaseReturnComponent } from './purchase-return/purchase-return';

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
  // ✅ FIX: Specific static paths must come BEFORE variable paths like :id
  {
    path: 'return/:id',
    component: PurchaseReturnComponent,
    title: 'Create Purchase Return' 
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
  }
];

// import { Routes } from '@angular/router';
// import { PurchaseFormComponent } from './purchase-form/purchase-form';
// import { PurchaseListComponent } from './purchase-list/purchase-list';
// import { PurchaseDetailsComponent } from './purchase-details/purchase-details';
// import { PurchaseReturnComponent } from './purchase-return/purchase-return';

// // These routes will be lazy-loaded under a '/purchases' path (defined in app.routes.ts)
// export const PURCHASE_ROUTES: Routes = [
//   {
//     path: '',
//     component: PurchaseListComponent,
//     title: 'Purchase Orders'
//   },
//   {
//     path: 'create',
//     component: PurchaseFormComponent,
//     title: 'Create Purchase'
//   },
//   {
//     path: ':id',
//     component: PurchaseDetailsComponent,
//     title: 'Purchase Details'
//   },
//   {
//     path: ':id/edit',
//     component: PurchaseFormComponent,
//     title: 'Edit Purchase'
//   },
//   {
//     path: 'return/:id',
//     component: PurchaseReturnComponent,
//     title: 'Edit Purchase'
//   },
// ];