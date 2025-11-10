import { Routes } from '@angular/router';
import { SupplierDetailsComponent } from './components/supplier-detail/supplier-detail';
import { SupplierFormComponent } from './components/supplier-form/supplier-form';
import { SupplierListComponent } from './components/supplier-list/supplier-list';

// These routes will be lazy-loaded under a '/suppliers' path
export const SUPPLIER_ROUTES: Routes = [
  {
    path: '',
    component: SupplierListComponent,
  },
  {
    path: 'create',
    component: SupplierFormComponent,
  },
  {
    path: ':id',
    component: SupplierDetailsComponent,
  },
  {
    path: ':id/edit',
    component: SupplierFormComponent,
  },
];