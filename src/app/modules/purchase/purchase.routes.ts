import { Routes } from '@angular/router';

// Return Components
import { PurchaseReturnListComponent } from './purchase-return-list/purchase-return-list.component'; // The History List
import { PurchaseReturnDetailsComponent } from './purchase-return-details/purchase-return-details.component'; // The Read-Only View
import { PurchaseDetailsComponent } from './purchase-details/purchase-details';
import { PurchaseReturnComponent } from './purchase-return/purchase-return';
import { PurchaseFormComponent } from './purchase-form/purchase-form';
import { PurchaseListComponent } from './purchase-list/purchase-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

export const PURCHASE_ROUTES: Routes = [
  {
    path: '',
    component: PurchaseListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Purchase Orders', tabIcon: 'pi pi-shopping-bag', permissions: [PERMISSIONS.PURCHASE.READ] }
  },
  {
    path: 'create',
    component: PurchaseFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'New Purchase', tabIcon: 'pi pi-plus', permissions: [PERMISSIONS.PURCHASE.CREATE] }
  },
  {
    path: 'returns',
    component: PurchaseReturnListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Debit Notes', tabIcon: 'pi pi-replay', permissions: [PERMISSIONS.PURCHASE.RETURN] }
  },
  {
    path: 'returns/:id',
    component: PurchaseReturnDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Debit Note Details', tabIcon: 'pi pi-file', permissions: [PERMISSIONS.PURCHASE.RETURN] }
  },
  {
    path: 'return/:id',
    component: PurchaseReturnComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Create Return', tabIcon: 'pi pi-backward', permissions: [PERMISSIONS.PURCHASE.RETURN] }
  },
  {
    path: ':id',
    component: PurchaseDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Purchase Details', tabIcon: 'pi pi-tag', permissions: [PERMISSIONS.PURCHASE.READ] }
  },
  {
    path: ':id/edit',
    component: PurchaseFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Edit Purchase', tabIcon: 'pi pi-pencil', permissions: [PERMISSIONS.PURCHASE.UPDATE] }
  }
];
