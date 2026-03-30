import { Routes } from '@angular/router';
import { PaymentDetailsComponent } from './components/payment-details/payment-details';
import { PaymentFormComponent } from './components/payment-form/payment-form';
import { PaymentListComponent } from './components/payment-list/payment-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

// These routes will be lazy-loaded under a '/payments' path
export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    component: PaymentListComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PAYMENT.READ] }
  },
  {
    path: 'create',
    component: PaymentFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PAYMENT.CREATE] }
  },
  {
    path: ':id',
    component: PaymentDetailsComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PAYMENT.READ] }
  },
  {
    path: ':id/edit',
    component: PaymentFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.PAYMENT.UPDATE] }
  },
];