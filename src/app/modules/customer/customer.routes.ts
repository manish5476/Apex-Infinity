import { Routes } from '@angular/router';
import { CustomerList } from './components/customer-list/customer-list';
import { CustomerForm } from './components/customer-form/customer-form';
import { CustomerDetails } from './components/customer-details/customer-details';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { CustomerAnalyticsComponent } from './Analytics/component/customer-analytics/customer-analytics';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'create',
    component: CustomerForm,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CUSTOMER.CREATE] }
  },
  {
    path: 'analytics', // <-- CHANGED: Was 'customer/:id'.
    component: CustomerAnalyticsComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CUSTOMER.READ] }
  },
  {
    path: '', // <-- CHANGED: Was 'list'. This is now the default.
    component: CustomerList,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CUSTOMER.READ] }
  },
  {
    path: ':id',
    component: CustomerDetails,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.CUSTOMER.READ] }
  },

];