import { Routes } from '@angular/router';
import { PaymentDetailsComponent } from './components/payment-details/payment-details';
import { PaymentFormComponent } from './components/payment-form/payment-form';
import { PaymentListComponent } from './components/payment-list/payment-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

// These routes will be lazy-loaded under a '/payments' path
export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    component: PaymentListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Payment Records', tabIcon: 'pi pi-money-bill', permissions: [PERMISSIONS.PAYMENT.READ] }
  },
  {
    path: 'create',
    component: PaymentFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Issue Payment', tabIcon: 'pi pi-plus', permissions: [PERMISSIONS.PAYMENT.CREATE] }
  },
  {
    path: ':id',
    component: PaymentDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Payment Details', tabIcon: 'pi pi-file', permissions: [PERMISSIONS.PAYMENT.READ] }
  },
  {
    path: ':id/edit',
    component: PaymentFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Edit Payment', tabIcon: 'pi pi-pencil', permissions: [PERMISSIONS.PAYMENT.UPDATE] }
  },
];