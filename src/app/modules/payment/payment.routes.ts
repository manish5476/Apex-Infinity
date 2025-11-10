import { Routes } from '@angular/router';
import { PaymentDetailsComponent } from './components/payment-details/payment-details';
import { PaymentFormComponent } from './components/payment-form/payment-form';
import { PaymentListComponent } from './components/payment-list/payment-list';

// These routes will be lazy-loaded under a '/payments' path
export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    component: PaymentListComponent,
  },
  {
    path: 'create',
    component: PaymentFormComponent,
  },
  {
    path: ':id',
    component: PaymentDetailsComponent,
  },
  {
    path: ':id/edit',
    component: PaymentFormComponent,
  },
];