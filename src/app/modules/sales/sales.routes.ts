import { Routes } from '@angular/router';
import { SalesListComponent } from './sales-list/sales-list';
import { SalesReturnListComponent } from './components/sales-return-list/sales-return-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    component: SalesListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Sales Transactions', 
      tabIcon: 'pi pi-chart-bar', 
      permissions: [PERMISSIONS.SALES.VIEW] 
    }
  },
  {
    path: 'returns',
    component: SalesReturnListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { 
      tabLabel: 'Sales Returns', 
      tabIcon: 'pi pi-replay', 
      permissions: [PERMISSIONS.SALES_RETURN.READ] 
    }
  }
];