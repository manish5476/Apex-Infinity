import { Routes } from '@angular/router';
import { AccountTreeComponent } from './components/accounts-tree/accounts-tree';
import { AccountListComponent } from './components/account-list/account-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

export const ACCOUNT_ROUTES: Routes = [
  { 
    path: '', 
    component: AccountListComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.ACCOUNT.READ] }
  },
  { 
    path: 'tree', 
    component: AccountTreeComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.ACCOUNT.READ] }
  }
];
