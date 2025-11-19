import { Routes } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { authGuard } from './core/guards/authguard.guard';
import { MasterList } from './modules/shared/components/master-list/master-list';

export const routes: Routes = [
  // ==========================================================
  //  1. PUBLIC AUTH ROUTES
  // ==========================================================
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ==========================================================
  //  2. PROTECTED APPLICATION ROUTES
  // ==========================================================
  {
    path: '', // The default path for your app
    component: MainScreen,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/components/dashboard/dashboard').then(
            (m) => m.Dashboard,
          ),
      },
      // --- CUSTOMER & SALES ---
      {
        path: 'masterList',
        component: MasterList,
      },
      {
        path: 'customer',
        loadChildren: () =>
          import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
      },
      {
        path: 'invoices',
        loadChildren: () =>
          import('./modules/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
      },
      // --- PRODUCTS & PURCHASES ---
      {
        path: 'product',
        loadChildren: () =>
          import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
      },
      {
        path: 'suppliers', // <-- ADDED
        loadChildren: () =>
          import('./modules/cupplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
      },
      // --- FINANCIALS ---
      {
        path: 'payment',
        loadChildren: () =>
          import('./modules/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
      },
      {
        path: 'emis',
        loadChildren: () =>
          import('./modules/emi/emi.routes').then((m) => m.EMI_ROUTES),
      },
      // --- ADMIN & SETTINGS ---
      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./modules/organization/components/role-management/role-management').then(
            (m) => m.RoleManagementComponent
          ),
      },
      {
        path: 'branches', // <-- ADDED
        loadChildren: () =>
          import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
      },
      // --- EMI (Contextual, not in main routes) ---
      // The EMI routes are correctly excluded, as they are
      // accessed from other components (e.g., from an invoice)
      // and not from the main sidebar.

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ==========================================================
  //  3. FALLBACK REDIRECT
  // ==========================================================
  { path: '**', redirectTo: '' }
];
// import { Routes } from '@angular/router';
// import { MainScreen } from './projectLayout/main-screen/main-screen';
// import { authGuard } from './core/guards/authguard.guard';

// export const routes: Routes = [
//   // ==========================================================
//   //  1. PUBLIC AUTH ROUTES
//   // ==========================================================
//   {
//     path: 'auth',
//     loadChildren: () =>
//       import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
//     // This will lazy-load the routes for Login, Create Org, and Employee Signup
//   },

//   // ==========================================================
//   //  2. PROTECTED APPLICATION ROUTES
//   // ==========================================================

//   {
//     path: '', // The default path for your app
//     component: MainScreen,
//     canActivate: [authGuard],
//     children: [
//       {
//         path: 'dashboard',
//         loadComponent: () =>
//           import('./modules/dashboard/components/dashboard/dashboard').then(
//             (m) => m.Dashboard,
//           ),
//       },
//       {
//         path: 'admin/roles',
//         loadComponent: () =>
//           import('./modules/organization/components/role-management/role-management').then(
//             (m) => m.RoleManagementComponent
//           ),
//       },
//       {
//         path: 'customer',
//         loadChildren: () =>
//           import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
//       },
//       {
//         path: 'product',
//         loadChildren: () =>
//           import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
//       },
//       {
//         path: 'payment',
//         loadChildren: () =>
//           import('./modules/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
//       },
//       {
//         path: 'invoices',
//         loadChildren: () =>
//           import('./modules/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
//       },
//       { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
//     ],
//   },

//   // ==========================================================
//   //  3. FALLBACK REDIRECT
//   // ==========================================================
//   // Redirect any unknown URL to the main app (which will be caught by the guard)
//   { path: '**', redirectTo: '' }
// ];