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

// import { CustomerList } from './components/customer-list/customer-list';
// // customer.routes.ts
// import { Routes } from '@angular/router';
// import { CustomerForm } from './components/customer-form/customer-form';
// import { CustomerDetails } from './components/customer-details/customer-details';

// export const CUSTOMER_ROUTES: Routes = [
//   {
//     path: 'create',
//     component: CustomerForm, // ✅ should be standalone component
//   },
//   {
//     path: 'list',
//     component: CustomerList, // ✅ should be standalone component
//   },
//   {
//     path: 'customer/:id',
//     component: CustomerDetails, // ✅ should be standalone component
//   },
// ];
