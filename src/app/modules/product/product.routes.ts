import { Routes } from '@angular/router';
import { ProductDetailsComponent } from './components/product-details/product-details';
import { ProductFormComponent } from './components/product-form/product-form';
import { ProductListComponent } from './components/product-list/product-list';
import { LowStockReportComponent } from './components/low-stock-report/low-stock-report';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

// These routes will be lazy-loaded under a '/products' path (defined in app.routes.ts)
export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    component: ProductListComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PRODUCT.READ] }
  },
  {
    path: 'reports/low-stock',
    component: LowStockReportComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PRODUCT.READ] }
  },
  {
    path: 'create',
    component: ProductFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PRODUCT.CREATE] }
  },
  {
    path: ':id',
    component: ProductDetailsComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PRODUCT.READ] }
  },
  {
    path: ':id/edit',
    component: ProductFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PRODUCT.UPDATE] }
  },
];