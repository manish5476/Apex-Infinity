import { CustomerList } from './components/customer-list/customer-list';
// customer.routes.ts
import { Routes } from '@angular/router';
import { CustomerForm } from './components/customer-form/customer-form';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'create',
    component: CustomerForm, // ✅ should be standalone component
  },
  {
    path: 'list',
    component: CustomerList, // ✅ should be standalone component
  },
];
