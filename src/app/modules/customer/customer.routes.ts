import { Routes } from '@angular/router';
import { CustomerList } from './components/customer-list/customer-list';
import { CustomerForm } from './components/customer-form/customer-form';
import { CustomerDetails } from './components/customer-details/customer-details';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { CustomerAnalyticsComponent } from './Analytics/component/customer-analytics/customer-analytics';
import { TabRouterGuard } from '../../Tabbing';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'create',
    component: CustomerForm,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'New Customer', tabIcon: 'pi pi-user-plus', permissions: [PERMISSIONS.CUSTOMER.CREATE] }
  },
  {
    path: 'analytics',
    component: CustomerAnalyticsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Customer Analytics', tabIcon: 'pi pi-chart-line', permissions: [PERMISSIONS.CUSTOMER.READ] }
  },
  {
    path: '',
    component: CustomerList,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Customer List', tabIcon: 'pi pi-users', permissions: [PERMISSIONS.CUSTOMER.READ] }
  },
  {
    path: ':id',
    component: CustomerDetails,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Customer Details', tabIcon: 'pi pi-user', permissions: [PERMISSIONS.CUSTOMER.READ] }
  },
];