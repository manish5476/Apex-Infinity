import { Routes } from '@angular/router';
import { AccountTreeComponent } from './components/accounts-tree/accounts-tree';
import { AccountListComponent } from './components/account-list/account-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

export const ACCOUNT_ROUTES: Routes = [
  { 
    path: '', 
    component: AccountListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Chart of Accounts', tabIcon: 'pi pi-list', permissions: [PERMISSIONS.ACCOUNT.READ] }
  },
  { 
    path: 'tree', 
    component: AccountTreeComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Account Tree', tabIcon: 'pi pi-sitemap', permissions: [PERMISSIONS.ACCOUNT.READ] }
  }
];
