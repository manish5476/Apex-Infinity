import { Routes } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { authGuard } from './core/guards/authguard.guard';
import { MasterList } from './modules/shared/components/master-list/master-list';
import { Transactions } from './modules/transactions/transactions/transactions';
import { LedgerComponent } from './modules/Ledger/ledger/ledger';
import { NotesPageComponent } from './modules/dashboard/components/notes-page.component';
import { NotFoundComponent } from './modules/shared/components/notfound/notfound.component';
import { LogsComponent } from './modules/transactions/logs/logs';
import { SalesListComponent } from './modules/sales/sales-list/sales-list';
import { Sessions } from './modules/auth/sessions/sessions/sessions';
import { AppLandingPage } from './landingPage/app-landing-page';

export const routes: Routes = [
  // ==========================================================
  //  1. LANDING PAGE (Root Path)
  //  URL: localhost:4200/
  // ==========================================================
  {
    path: '',
    component: AppLandingPage,
    pathMatch: 'full' // Important: ensures this only matches the exact root
  },

  // ==========================================================
  //  2. PUBLIC AUTH ROUTES
  //  URL: /auth/login, /auth/signup
  // ==========================================================
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ==========================================================
  //  3. PROTECTED APPLICATION ROUTES
  //  URL: /app/dashboard, /app/sales, etc.
  // ==========================================================
  {
    // 🔥 CHANGED: Moved MainScreen to 'app' path to avoid conflict with Landing Page
    path: 'app', 
    component: MainScreen,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/components/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      { path: 'notes', component: NotesPageComponent, title: 'My Notes' },
      { path: 'financials', component: LedgerComponent },
      
      // ... (Your existing admin routes) ...
      {
        path: 'admin/organization',
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
      { path: 'masterList', component: MasterList },
      { path: 'transactions', component: Transactions },
      { path: 'sessions', component: Sessions },
      { path: 'logs', component: LogsComponent },
      { path: 'sales', component: SalesListComponent },

      // --- LAZY LOADED MODULES ---
      // These will now be: /app/branches, /app/customer, etc.
      {
        path: 'branches',
        loadChildren: () => import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
      },
      {
        path: 'customer',
        loadChildren: () => import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
      },
      {
        path: 'suppliers',
        loadChildren: () => import('./modules/cupplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
      },
      {
        path: 'product',
        loadChildren: () => import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
      },
      {
        path: 'purchase',
        loadChildren: () => import('./modules/purchase/purchase.routes').then((m) => m.PURCHASE_ROUTES),
      },
      {
        path: 'invoices',
        loadChildren: () => import('./modules/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
      },
      {
        path: 'payment',
        loadChildren: () => import('./modules/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
      },
      {
        path: 'emis',
        loadChildren: () => import('./modules/emi/emi.routes').then((m) => m.EMI_ROUTES),
      },
    ],
  },

  // ==========================================================
  //  4. FALLBACK REDIRECT
  // ==========================================================
  // If route not found, redirect to Landing Page or 404
  { path: '**', component: NotFoundComponent }
];

// import { Routes } from '@angular/router';
// import { MainScreen } from './projectLayout/main-screen/main-screen';
// import { authGuard } from './core/guards/authguard.guard';
// import { MasterList } from './modules/shared/components/master-list/master-list';
// import { Transactions } from './modules/transactions/transactions/transactions';
// import { LedgerComponent } from './modules/Ledger/ledger/ledger';
// import { NotesPageComponent } from './modules/dashboard/components/notes-page.component';
// import { NotFoundComponent } from './modules/shared/components/notfound/notfound.component';
// import { LogsComponent } from './modules/transactions/logs/logs';
// import { SalesListComponent } from './modules/sales/sales-list/sales-list';
// import { Sessions } from './modules/auth/sessions/sessions/sessions';
// import { AppLandingPage } from './landingPage/app-landing-page';

// export const routes: Routes = [
//   // ==========================================================
//   //  1. PUBLIC AUTH ROUTES (Lazy Loaded)
//   //  URL: /auth/login, /auth/signup, /auth/org
//   // ==========================================================
//   {
//     path: 'apex-infinity',
//     component: AppLandingPage,
//   },
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
//     canActivate: [authGuard], // 🔒 Locks everything below this
//     children: [
//       { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
//       {
//         path: 'dashboard',
//         loadComponent: () =>
//           import('./modules/dashboard/components/dashboard/admin-dashboard.component').then(
//             (m) => m.AdminDashboardComponent
//           ),
//       },
//       {
//         path: 'notes',
//         component: NotesPageComponent,
//         title: 'My Notes'
//       },
//       {
//         path: 'financials',
//         component: LedgerComponent,
//       },
//       {
//         path: 'admin/organization', // URL: /admin/organization
//         loadComponent: () =>
//           import('./modules/organization/components/org-settings/org-settings').then(
//             (m) => m.OrgSettingsComponent
//           ),
//         data: { title: 'Organization Settings' }
//       },
//       {
//         path: 'admin/roles',
//         loadComponent: () =>
//           import('./modules/organization/components/role-management/role-management').then(
//             (m) => m.RoleManagementComponent
//           ),
//       },

//       // --- MASTERS & TRANSACTIONS ---
//       {
//         path: 'masterList',
//         component: MasterList,
//       },
//       {
//         path: 'transactions',
//         component: Transactions,
//       },
//       {
//         path: 'sessions',
//         component: Sessions,
//       },
//       {
//         path: 'logs',
//         component: LogsComponent,
//       },
//       {
//         path: 'sales',
//         component: SalesListComponent,
//       },

//       // --- MODULES ---
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
//         path: 'suppliers',
//         loadChildren: () =>
//           import('./modules/cupplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
//       },
//       {
//         path: 'product',
//         loadChildren: () =>
//           import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
//       },
//       {
//         path: 'purchase',
//         loadChildren: () =>
//           import('./modules/purchase/purchase.routes').then((m) => m.PURCHASE_ROUTES),
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
//   { path: '**', component: NotFoundComponent }
// ];
