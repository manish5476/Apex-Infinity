import { Routes } from '@angular/router';
import { SupplierDetailsComponent } from './components/supplier-detail/supplier-detail';
import { SupplierFormComponent } from './components/supplier-form/supplier-form';
import { SupplierListComponent } from './components/supplier-list/supplier-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

// These routes will be lazy-loaded under a '/suppliers' path
export const SUPPLIER_ROUTES: Routes = [
  {
    path: '',
    component: SupplierListComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.SUPPLIER.READ] }
  },
  {
    path: 'create',
    component: SupplierFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.SUPPLIER.CREATE] }
  },
  {
    path: ':id',
    component: SupplierDetailsComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.SUPPLIER.READ] }
  },
  {
    path: ':id/edit',
    component: SupplierFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.SUPPLIER.UPDATE] }
  },
];