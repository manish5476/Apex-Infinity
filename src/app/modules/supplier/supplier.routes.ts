import { Routes } from '@angular/router';
import { SupplierDetailsComponent } from './components/supplier-detail/supplier-detail';
import { SupplierFormComponent } from './components/supplier-form/supplier-form';
import { SupplierListComponent } from './components/supplier-list/supplier-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

// These routes will be lazy-loaded under a '/suppliers' path
export const SUPPLIER_ROUTES: Routes = [
  {
    path: '',
    component: SupplierListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Supplier Directory', tabIcon: 'pi pi-truck', permissions: [PERMISSIONS.SUPPLIER.READ] }
  },
  {
    path: 'create',
    component: SupplierFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'New Supplier', tabIcon: 'pi pi-plus', permissions: [PERMISSIONS.SUPPLIER.CREATE] }
  },
  {
    path: ':id',
    component: SupplierDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Supplier Profile', tabIcon: 'pi pi-building', permissions: [PERMISSIONS.SUPPLIER.READ] }
  },
  {
    path: ':id/edit',
    component: SupplierFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Update Supplier', tabIcon: 'pi pi-pencil', permissions: [PERMISSIONS.SUPPLIER.UPDATE] }
  },
];