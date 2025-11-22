import { Routes } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { authGuard } from './core/guards/authguard.guard';
import { MasterList } from './modules/shared/components/master-list/master-list';
import { Transactions } from './modules/transactions/transactions/transactions';
import { LedgerComponent } from './modules/Ledger/ledger/ledger';

export const routes: Routes = [
  // ==========================================================
  //  1. PUBLIC AUTH ROUTES (Lazy Loaded)
  //  URL: /auth/login, /auth/signup, /auth/org
  // ==========================================================
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ==========================================================
  //  2. PROTECTED APPLICATION ROUTES
  // ==========================================================
  {
    path: '',
    component: MainScreen,
    canActivate: [authGuard], // 🔒 Locks everything below this
    children: [
      // Default redirect to dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/components/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
{
  path: 'financials',
  component: MainScreen, // Or whichever wrapper component you use
  canActivate: [authGuard],
  children: [
    { path: '', redirectTo: 'statements/pl', pathMatch: 'full' },
    {
      path: 'statements', // Main wrapper route
      component: LedgerComponent, 
    },
    // ... ledgers, etc.
  ]
},
      // --- ORGANIZATION & ADMIN SETTINGS (New) ---
      {
        path: 'admin/organization', // URL: /admin/organization
        loadComponent: () => 
          import('./modules/organization/components/org-settings/org-settings').then(
            (m) => m.OrgSettingsComponent
          ),
        data: { title: 'Organization Settings' }
      },
      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./modules/organization/components/role-management/role-management').then(
            (m) => m.RoleManagementComponent
          ),
      },

      // --- MASTERS & TRANSACTIONS ---
      {
        path: 'masterList',
        component: MasterList,
      },
      {
        path: 'transactions',
        component: Transactions,
      },

      // --- MODULES ---
      {
        path: 'branches',
        loadChildren: () =>
          import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
      },
      {
        path: 'customer',
        loadChildren: () =>
          import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
      },
      {
        path: 'suppliers',
        loadChildren: () =>
          import('./modules/cupplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
      },
      {
        path: 'product',
        loadChildren: () =>
          import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
      },

      // --- FINANCIALS ---
      {
        path: 'invoices',
        loadChildren: () =>
          import('./modules/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
      },
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
    ],
  },

  // ==========================================================
  //  3. FALLBACK REDIRECT
  // ==========================================================
  { path: '**', redirectTo: '' }
];

// import { Routes } from '@angular/router';
// import { MainScreen } from './projectLayout/main-screen/main-screen';
// import { authGuard } from './core/guards/authguard.guard';
// import { MasterList } from './modules/shared/components/master-list/master-list';
// import { Transactions } from './modules/transactions/transactions/transactions';

// export const routes: Routes = [
//   // ==========================================================
//   //  1. PUBLIC AUTH ROUTES (Lazy Loaded)
//   //  URL: /auth/login, /auth/signup, /auth/org
//   // ==========================================================
//   {
//     path: 'auth',
//     loadChildren: () =>
//       import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
//   },

//   // ==========================================================
//   //  2. PROTECTED APPLICATION ROUTES
//   // ==========================================================
//   {
//     path: '', 
//     component: MainScreen,
//     canActivate: [authGuard],
//     children: [
//       { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
//       {
//         path: 'dashboard',
//         loadComponent: () =>
//           import('./modules/dashboard/components/dashboard/admin-dashboard.component').then(
//             (m) => m.AdminDashboardComponent
//           ),
//       },

//       // --- ADMIN & MASTERS ---
//       {
//         path: 'masterList',
//         component: MasterList,
//       },
//       {
//         path: 'transactions',
//         component: Transactions,
//       },
//       {
//         path: 'admin/roles',
//         loadComponent: () =>
//           import('./modules/organization/components/role-management/role-management').then(
//             (m) => m.RoleManagementComponent
//           ),
//       },
//       {
//         path: 'branches',
//         loadChildren: () =>
//           import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
//       },

//       {
//         path: 'customer',
//         loadChildren: () =>
//           import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
//       },
//       {
//         path: 'suppliers', // Corrected typo from 'cupplier'
//         loadChildren: () =>
//           import('./modules/cupplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
//       },
//       {
//         path: 'product',
//         loadChildren: () =>
//           import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
//       },
//       // --- FINANCIALS ---
//       {
//         path: 'invoices',
//         loadChildren: () =>
//           import('./modules/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
//       },
//       {
//         path: 'payment',
//         loadChildren: () =>
//           import('./modules/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
//       },
//       {
//         path: 'emis',
//         loadChildren: () =>
//           import('./modules/emi/emi.routes').then((m) => m.EMI_ROUTES),
//       },
//     ],
//   },

//   // ==========================================================
//   //  3. FALLBACK REDIRECT
//   // ==========================================================
//   { path: '**', redirectTo: '' }
// ];