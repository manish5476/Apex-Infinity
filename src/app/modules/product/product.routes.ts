import { Routes } from '@angular/router';
import { ProductDetailsComponent } from './components/product-details/product-details';
import { ProductFormComponent } from './components/product-form/product-form';
import { ProductListComponent } from './components/product-list/product-list';
import { LowStockReportComponent } from './components/low-stock-report/low-stock-report';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

// These routes will be lazy-loaded under a '/products' path (defined in app.routes.ts)
export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    component: ProductListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Product Inventory', tabIcon: 'pi pi-box', permissions: [PERMISSIONS.PRODUCT.READ] }
  },
  {
    path: 'reports/low-stock',
    component: LowStockReportComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Low Stock Alert', tabIcon: 'pi pi-exclamation-triangle', permissions: [PERMISSIONS.PRODUCT.READ] }
  },
  {
    path: 'create',
    component: ProductFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Add Product', tabIcon: 'pi pi-plus', permissions: [PERMISSIONS.PRODUCT.CREATE] }
  },
  {
    path: ':id',
    component: ProductDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Product Details', tabIcon: 'pi pi-tag', permissions: [PERMISSIONS.PRODUCT.READ] }
  },
  {
    path: ':id/edit',
    component: ProductFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Edit Product', tabIcon: 'pi pi-pencil', permissions: [PERMISSIONS.PRODUCT.UPDATE] }
  },
];