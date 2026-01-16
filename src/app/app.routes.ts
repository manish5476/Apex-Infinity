import { Routes } from '@angular/router';
import { authGuard } from './core/guards/authguard.guard';

// Components
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { LandingComponent } from './landingPage/landing.component';
import { NotFoundComponent } from './modules/shared/components/notfound/notfound.component';
import { ChatComponent } from './chat/chat.component/chat.component';

// Shared / Core Components
import { NotesManagerComponent } from './modules/shared/components/notes-manager/notes-manager.component';
import { MasterList } from './modules/shared/components/master-list/master-list';

// Admin / Org Components
import { AcceptOwnershipComponent } from './modules/organization/components/AcceptOwnershipComponent';
import { Sessions } from './modules/auth/sessions/sessions/sessions';

// Finance / Transaction Components
import { LedgerComponent } from './modules/Ledger/ledger/ledger';
import { Transactions } from './modules/transactions/transactions/transactions';
import { LogsComponent } from './modules/transactions/logs/logs';
import { SalesListComponent } from './modules/sales/sales-list/sales-list';

export const routes: Routes = [
  // ==========================================================
  //  1. PUBLIC LANDING PAGE (Root Path)
  // ==========================================================
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
    title: 'Apex Infinity - ERP'
  },

  // ==========================================================
  //  2. AUTHENTICATION (Login, Register, etc.)
  // ==========================================================
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ==========================================================
  //  3. PUBLIC STOREFRONT (Customer View)
  //  ⚠️ MUST be before protected routes.
  // ==========================================================
  
  // A. Store Root Redirect
  {
    path: 'store/:orgSlug',
    redirectTo: 'store/:orgSlug/home',
    pathMatch: 'full'
  },

  // B. Product Listing Page (Specific)
  {
    path: 'store/:orgSlug/products',
    loadComponent: () => import('./modules/storefront-public/pages/product-listing/product-listing.component')
      .then(m => m.ProductListingComponent),
    title: 'Shop All Products'
  },

  // C. Product Detail Page (Specific)
  {
    path: 'store/:orgSlug/products/:productSlug',
    loadComponent: () => import('./modules/storefront-public/pages/product-detail/product-detail.component')
      .then(m => m.ProductDetailComponent),
    title: 'Product Details'
  },

  // D. Generic Dynamic Page (Wildcard - MUST BE LAST in Storefront group)
  // Catches /home, /about, /contact, etc.
  {
    path: 'store/:orgSlug/:pageSlug',
    loadComponent: () => import('./modules/storefront-public/pages/dynamic-page/dynamic-page.component')
      .then(m => m.DynamicPageComponent),
    title: 'Storefront'
  },

  // ==========================================================
  //  4. PROTECTED APPLICATION (ERP Dashboard)
  // ==========================================================
  {
    path: '',
    component: MainScreen,
    canActivate: [authGuard],
    children: [
      // --- Dashboard ---
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/admin-analytics-hub.component').then((m) => m.AdminDashboardComponent),
        title: 'Dashboard'
      },

      // --- Communication & Tools ---
      { path: 'chat', component: ChatComponent, title: 'Team Chat' },
      { path: 'notes', component: NotesManagerComponent, title: 'My Notes' },

      // --- Finance Core ---
      { path: 'financials', component: LedgerComponent, title: 'Financial Ledger' },
      { path: 'transactions', component: Transactions, title: 'Transaction History' },
      { path: 'sales', component: SalesListComponent, title: 'Sales Reports' },
      {
        path: 'accounts',
        loadChildren: () => import('./modules/accounts/accounts.routes').then((m) => m.ACCOUNT_ROUTES),
      },
      {
        path: 'payments',
        loadChildren: () => import('./modules/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
      },
      {
        path: 'invoices',
        loadChildren: () => import('./modules/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
      },
      {
        path: 'emis',
        loadChildren: () => import('./modules/emi/emi.routes').then((m) => m.EMI_ROUTES),
      },

      // --- Supply Chain & Inventory (SCM) ---
      {
        path: 'product',
        loadChildren: () => import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
      },
      {
        path: 'purchase',
        loadChildren: () => import('./modules/purchase/purchase.routes').then((m) => m.PURCHASE_ROUTES),
      },
      {
        path: 'suppliers',
        loadChildren: () => import('./modules/cupplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
      },

      // --- CRM (Customer Relationship) ---
      {
        path: 'customer',
        loadChildren: () => import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
      },

      // --- HR & Workforce ---
      {
        path: 'user',
        loadChildren: () => import('./modules/user/user.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'attendence',
        loadChildren: () => import('./modules/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
      },

      // --- Administration & System ---
      {
        path: 'branches',
        loadChildren: () => import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
      },
      {
        path: 'admin/organization',
        loadComponent: () => import('./modules/organization/components/org-settings/org-settings').then((m) => m.OrgSettingsComponent),
        title: 'Organization Settings'
      },
      {
        path: 'admin/roles',
        loadComponent: () => import('./modules/organization/components/role-management/role-management').then((m) => m.RoleManagementComponent),
        title: 'Role Management'
      },
      
      // Storefront Builder (Admin View)
      {
        path: 'storefront',
        loadChildren: () => import('./modules/storefront-admin/storefront-admin.routes')
          .then(m => m.STOREFRONT_ADMIN_ROUTES)
      },
      
      { path: 'masterList', component: MasterList, title: 'System Masters' },
      { path: 'sessions', component: Sessions, title: 'Active Sessions' },
      { path: 'logs', component: LogsComponent, title: 'System Logs' },

      // --- Special Routes ---
      {
        path: 'dashboard/settings/ownership',
        component: AcceptOwnershipComponent,
        title: 'Accept Ownership'
      }
    ],
  },

  // ==========================================================
  //  5. FALLBACK (404)
  // ==========================================================
  { path: '**', component: NotFoundComponent }
];
































// import { Routes } from '@angular/router';
// import { authGuard } from './core/guards/authguard.guard';

// // Components
// import { MainScreen } from './projectLayout/main-screen/main-screen';
// import { LandingComponent } from './landingPage/landing.component';
// import { NotFoundComponent } from './modules/shared/components/notfound/notfound.component';
// import { ChatComponent } from './chat/chat.component/chat.component';

// // Shared / Core Components
// import { NotesManagerComponent } from './modules/shared/components/notes-manager/notes-manager.component';
// import { MasterList } from './modules/shared/components/master-list/master-list';

// // Admin / Org Components
// import { AcceptOwnershipComponent } from './modules/organization/components/AcceptOwnershipComponent';
// import { Sessions } from './modules/auth/sessions/sessions/sessions';

// // Finance / Transaction Components
// import { LedgerComponent } from './modules/Ledger/ledger/ledger';
// import { Transactions } from './modules/transactions/transactions/transactions';
// import { LogsComponent } from './modules/transactions/logs/logs';
// import { SalesListComponent } from './modules/sales/sales-list/sales-list';

// export const routes: Routes = [
//   // ==========================================================
//   //  1. PUBLIC LANDING & AUTH (No Sidebar)
//   // ==========================================================
//   {
//     path: '',
//     component: LandingComponent,
//     pathMatch: 'full',
//     title: 'Apex Infinity - ERP'
//   },
//   {
//     path: 'auth',
//     loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
//   },

//   // ==========================================================
//   //  2. PROTECTED APPLICATION (Main Layout)
//   // ==========================================================
//   {
//     path: '',
//     component: MainScreen,
//     canActivate: [authGuard],
//     children: [
//       // --- Dashboard ---
//       {
//         path: 'dashboard',
//         loadComponent: () => import('./admin/admin-analytics-hub.component').then((m) => m.AdminDashboardComponent),
//         title: 'Dashboard'
//       },

//       // --- Communication & Tools ---
//       { path: 'chat', component: ChatComponent, title: 'Team Chat' },
//       { path: 'notes', component: NotesManagerComponent, title: 'My Notes' },

//       // --- Finance Core ---
//       { path: 'financials', component: LedgerComponent, title: 'Financial Ledger' },
//       { path: 'transactions', component: Transactions, title: 'Transaction History' },
//       { path: 'sales', component: SalesListComponent, title: 'Sales Reports' },
//       {
//         path: 'accounts',
//         loadChildren: () => import('./modules/accounts/accounts.routes').then((m) => m.ACCOUNT_ROUTES),
//       },
//       {
//         path: 'payments',
//         loadChildren: () => import('./modules/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
//       },
//       {
//         path: 'invoices',
//         loadChildren: () => import('./modules/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
//       },
//       {
//         path: 'emis',
//         loadChildren: () => import('./modules/emi/emi.routes').then((m) => m.EMI_ROUTES),
//       },

//       // --- Supply Chain & Inventory (SCM) ---
//       {
//         path: 'product',
//         loadChildren: () => import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
//       },
//       {
//         path: 'purchase',
//         loadChildren: () => import('./modules/purchase/purchase.routes').then((m) => m.PURCHASE_ROUTES),
//       },
//       {
//         path: 'suppliers',
//         loadChildren: () => import('./modules/cupplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
//       },

//       // --- CRM (Customer Relationship) ---
//       {
//         path: 'customer',
//         loadChildren: () => import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
//       },

//       // --- HR & Workforce ---
//       {
//         path: 'user',
//         loadChildren: () => import('./modules/user/user.routes').then((m) => m.USER_ROUTES),
//       },
//       {
//         path: 'attendence',
//         loadChildren: () => import('./modules/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
//       },

//       // --- Administration & System ---
//       {
//         path: 'branches',
//         loadChildren: () => import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
//       },
//       {
//         path: 'admin/organization',
//         loadComponent: () => import('./modules/organization/components/org-settings/org-settings').then((m) => m.OrgSettingsComponent),
//         title: 'Organization Settings'
//       },
//       {
//         path: 'admin/roles',
//         loadComponent: () => import('./modules/organization/components/role-management/role-management').then((m) => m.RoleManagementComponent),
//         title: 'Role Management'
//       },
//       { path: 'masterList', component: MasterList, title: 'System Masters' },
//       { path: 'sessions', component: Sessions, title: 'Active Sessions' },
//       { path: 'logs', component: LogsComponent, title: 'System Logs' },

//       // --- Special Routes ---
//       {
//         path: 'dashboard/settings/ownership',
//         component: AcceptOwnershipComponent,
//         title: 'Accept Ownership'
//       }
//     ],
//   },

//   // ==========================================================
//   //  3. FALLBACK
//   // ==========================================================
//   { path: '**', component: NotFoundComponent }
// ];
// // import { User } from './modules/auth/services/auth-service';
// // import { Routes } from '@angular/router';
// // import { MainScreen } from './projectLayout/main-screen/main-screen';
// // import { authGuard } from './core/guards/authguard.guard';
// // import { MasterList } from './modules/shared/components/master-list/master-list';
// // import { Transactions } from './modules/transactions/transactions/transactions';
// // import { LedgerComponent } from './modules/Ledger/ledger/ledger';
// // import { NotFoundComponent } from './modules/shared/components/notfound/notfound.component';
// // import { LogsComponent } from './modules/transactions/logs/logs';
// // import { SalesListComponent } from './modules/sales/sales-list/sales-list';
// // import { Sessions } from './modules/auth/sessions/sessions/sessions';
// // import { NotesManagerComponent } from './modules/shared/components/notes-manager/notes-manager.component';
// // import { ChatComponent } from './chat/chat.component/chat.component';
// // import { LandingComponent } from './landingPage/landing.component';
// // import { AcceptOwnershipComponent } from './modules/organization/components/AcceptOwnershipComponent';
// // export const routes: Routes = [
// //   // ==========================================================
// //   //  1. PUBLIC LANDING PAGE (Root)
// //   //  URL: /
// //   // ==========================================================
// //   {
// //     path: '',
// //     component: LandingComponent,
// //     pathMatch: 'full',
// //     title: 'Apex Infinity - ERP'
// //   },

// //   // ==========================================================
// //   //  2. PUBLIC AUTH ROUTES
// //   //  URL: /auth/login, /auth/signup, /auth/org
// //   // ==========================================================
// //   {
// //     path: 'auth',
// //     loadChildren: () =>
// //       import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
// //   },

// //   // ==========================================================
// //   //  3. PROTECTED APPLICATION ROUTES
// //   //  URL: /dashboard, /transactions, etc.
// //   //  Note: This matches any route not caught above that exists in children
// //   // ==========================================================
// //   {
// //     path: '',
// //     component: MainScreen,
// //     canActivate: [authGuard],
// //     children: [
// //       // Default to dashboard if a logged-in user tries to go to a non-existent root child
// //       // (Optional: You can remove this if you want strict control)
// //       // { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

// //       {
// //         path: 'dashboard',
// //         loadComponent: () =>
// //           import('./admin/admin-analytics-hub.component').then(
// //             (m) => m.AdminDashboardComponent
// //           ),
// //         title: 'Dashboard'
// //       },
// //       { path: 'notes', component: NotesManagerComponent, title: 'My Notes' },
// //       { path: 'financials', component: LedgerComponent, title: 'Financial Ledger' },

// //       // --- Admin & Settings ---
// //       {
// //         path: 'admin/organization',
// //         loadComponent: () =>
// //           import('./modules/organization/components/org-settings/org-settings').then(
// //             (m) => m.OrgSettingsComponent
// //           ),
// //         data: { title: 'Organization Settings' }
// //       },
// //       {
// //         path: 'admin/roles',
// //         loadComponent: () =>
// //           import('./modules/organization/components/role-management/role-management').then(
// //             (m) => m.RoleManagementComponent
// //           ),
// //       },
// //       { path: 'chat', component: ChatComponent },

// //       // --- MASTERS & TRANSACTIONS ---
// //       { path: 'masterList', component: MasterList },
// //       { path: 'transactions', component: Transactions },
// //       { path: 'sessions', component: Sessions },
// //       { path: 'logs', component: LogsComponent },
// //       { path: 'sales', component: SalesListComponent },
// //       // { path: 'attendence', component: AttendanceDashboardComponent },
// //       {
// //         path: 'attendence',
// //         loadChildren: () => import('./modules/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
// //       },
// //       // --- LAZY LOADED MODULES ---
// //       {
// //         path: 'branches',
// //         loadChildren: () => import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
// //       },
// //       {
// //         path: 'accounts',
// //         loadChildren: () => import('./modules/accounts/accounts.routes').then((m) => m.ACCOUNT_ROUTES),
// //       },
// //       {
// //         path: 'user',
// //         loadChildren: () => import('./modules/user/user.routes').then((m) => m.USER_ROUTES),
// //       },
// //       {
// //         path: 'customer',
// //         loadChildren: () => import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
// //       },
// //       {
// //         path: 'suppliers',
// //         loadChildren: () => import('./modules/cupplier/supplier.routes').then((m) => m.SUPPLIER_ROUTES),
// //       },
// //       {
// //         path: 'product',
// //         loadChildren: () => import('./modules/product/product.routes').then((m) => m.PRODUCT_ROUTES),
// //       },
// //       {
// //         path: 'purchase',
// //         loadChildren: () => import('./modules/purchase/purchase.routes').then((m) => m.PURCHASE_ROUTES),
// //       },
// //       {
// //         path: 'invoices',
// //         loadChildren: () => import('./modules/invoice/invoice.routes').then((m) => m.INVOICE_ROUTES),
// //       },
// //       {
// //         path: 'payments',
// //         loadChildren: () => import('./modules/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
// //       },
// //       {
// //         path: 'dashboard/settings/ownership', // Matches the link sent in email
// //         component: AcceptOwnershipComponent,
// //         canActivate: [authGuard] // Ensure they are logged in to accept
// //       }
// //       ,
// //       {
// //         path: 'emis',
// //         loadChildren: () => import('./modules/emi/emi.routes').then((m) => m.EMI_ROUTES),
// //       },
// //     ],
// //   },

// //   // ==========================================================
// //   //  4. FALLBACK REDIRECT
// //   // ==========================================================
// //   { path: '**', component: NotFoundComponent }
// // ];