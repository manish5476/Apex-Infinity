import { Routes } from '@angular/router';
import { CustomerList } from './components/customer-list/customer-list';
import { CustomerForm } from './components/customer-form/customer-form';
import { CustomerDetails } from './components/customer-details/customer-details';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'create',
    component: CustomerForm,
  },
  {
    path: '', // <-- CHANGED: Was 'list'. This is now the default.
    component: CustomerList,
  },
  {
    path: ':id', // <-- CHANGED: Was 'customer/:id'.
    component: CustomerDetails,
  },
];