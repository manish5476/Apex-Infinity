import { Routes } from '@angular/router';
import { authGuard } from './core/guards/authguard.guard';

// Standalone Components
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { LandingComponent } from './landingPage/landing.component';
import { NotFoundComponent } from './modules/shared/components/notfound/notfound.component';
import { ChatComponent } from './chat/chat.component/chat.component';
import { MasterList } from './modules/shared/components/master-list/master-list';
import { AcceptOwnershipComponent } from './modules/organization/components/AcceptOwnershipComponent';
import { Sessions } from './modules/auth/sessions/sessions/sessions';
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
  // ==========================================================
  {
    path: 'store/:orgSlug',
    loadComponent: () => import('./modules/storefront-public/layout/storefront-layout.component').then(m => m.StorefrontLayoutComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'products', loadComponent: () => import('./modules/storefront-public/pages/product-listing/product-listing.component').then(m => m.ProductListingComponent), title: 'Shop All Products' },
      { path: 'products/:productSlug', loadComponent: () => import('./modules/storefront-public/pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent), title: 'Product Details' },
      { path: ':pageSlug', loadComponent: () => import('./modules/storefront-public/dynamic-page/dynamic-page.component').then(m => m.DynamicPageComponent), title: 'Storefront' }
    ]
  },

  // ==========================================================
  //  4. SECURE APP (Main ERP)
  // ==========================================================
  {
    path: '',
    component: MainScreen,
    canActivate: [authGuard],
    children: [
      // --- Dashboard & Comm ---
      { path: 'dashboard', loadComponent: () => import('./admin/admin-analytics-hub.component').then((m) => m.AdminDashboardComponent), title: 'Dashboard' },
      { path: 'chat', component: ChatComponent, title: 'Team Chat' },

      // --- Finance Core ---
      { path: 'financials', component: LedgerComponent, title: 'Financial Ledger' },
      { path: 'transactions', component: Transactions, title: 'Transaction History' },
      { path: 'sales', component: SalesListComponent, title: 'Sales Reports' },
      
      // --- Modular Feature Routing (Lazy Loaded) ---
      { path: 'accounts', loadChildren: () => import('./modules/accounts/accounts.routes').then(m => m.ACCOUNT_ROUTES) },
      { path: 'payments', loadChildren: () => import('./modules/payment/payment.routes').then(m => m.PAYMENT_ROUTES) },
      { path: 'notes', loadChildren: () => import('./modules/notes/note.routes').then(m => m.NOTE_ROUTES) },
      { path: 'invoices', loadChildren: () => import('./modules/invoice/invoice.routes').then(m => m.INVOICE_ROUTES) },
      { path: 'emis', loadChildren: () => import('./modules/emi/emi.routes').then(m => m.EMI_ROUTES) },
      { path: 'product', loadChildren: () => import('./modules/product/product.routes').then(m => m.PRODUCT_ROUTES) },
      { path: 'purchase', loadChildren: () => import('./modules/purchase/purchase.routes').then(m => m.PURCHASE_ROUTES) },
      { path: 'suppliers', loadChildren: () => import('./modules/cupplier/supplier.routes').then(m => m.SUPPLIER_ROUTES) },
      { path: 'customer', loadChildren: () => import('./modules/customer/customer.routes').then(m => m.CUSTOMER_ROUTES) },
      { path: 'user', loadChildren: () => import('./modules/user/user.routes').then(m => m.USER_ROUTES) },
      { path: 'branches', loadChildren: () => import('./modules/branch/branch.routes').then(m => m.BRANCH_ROUTES) },
      
      // -> Our Massive HRMS Module
      { path: 'hrms', loadChildren: () => import('./modules/hrms/hrms.routes').then(m => m.HRMS_ROUTES) },

      // --- Administration & System ---
      { path: 'admin/organization', loadComponent: () => import('./modules/organization/components/org-settings/org-settings').then((m) => m.OrgSettingsComponent), title: 'Organization Settings' },
      { path: 'admin/roles', loadComponent: () => import('./modules/organization/components/role-management/role-management').then((m) => m.RoleManagementComponent), title: 'Role Management' },
      { path: 'storefront', loadChildren: () => import('./modules/storefront-admin/storefront-admin.routes').then(m => m.STOREFRONT_ADMIN_ROUTES) },

      // --- Utilities ---
      { path: 'masterList', component: MasterList, title: 'System Masters' },
      { path: 'sessions', component: Sessions, title: 'Active Sessions' },
      { path: 'logs', component: LogsComponent, title: 'System Logs' },
      { path: 'dashboard/settings/ownership', component: AcceptOwnershipComponent, title: 'Accept Ownership' }
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
//   //  1. PUBLIC LANDING PAGE (Root Path)
//   // ==========================================================
//   {
//     path: '',
//     component: LandingComponent,
//     pathMatch: 'full',
//     title: 'Apex Infinity - ERP'
//   },

//   // ==========================================================
//   //  2. AUTHENTICATION (Login, Register, etc.)
//   // ==========================================================
//   {
//     path: 'auth',
//     loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
//   },

//   // ==========================================================
//   //  3. PUBLIC STOREFRONT (Customer View)
//   //  ⚠️ Implements Master Layout Pattern
//   //  Accessed via: /store/:orgSlug (e.g., /store/nike)
//   // ==========================================================
//   {
//     path: 'store/:orgSlug',
//     loadComponent: () => import('./modules/storefront-public/layout/storefront-layout.component')
//       .then(m => m.StorefrontLayoutComponent),
//     children: [
//       // A. Default Redirect (store/shivam -> store/shivam/home)
//       {
//         path: '',
//         redirectTo: 'home',
//         pathMatch: 'full'
//       },

//       // B. Product Listing Page
//       {
//         path: 'products',
//         loadComponent: () => import('./modules/storefront-public/pages/product-listing/product-listing.component')
//           .then(m => m.ProductListingComponent),
//         title: 'Shop All Products'
//       },

//       // C. Product Detail Page
//       {
//         path: 'products/:productSlug',
//         loadComponent: () => import('./modules/storefront-public/pages/product-detail/product-detail.component')
//           .then(m => m.ProductDetailComponent),
//         title: 'Product Details'
//       },

//       // D. Dynamic Page (Home, About, Contact) 
//       // ⚠️ MUST be last to act as a wildcard for this group
//       {
//         path: ':pageSlug',
//         loadComponent: () => import('./modules/storefront-public/dynamic-page/dynamic-page.component')
//           .then(m => m.DynamicPageComponent),
//         title: 'Storefront'
//       }
//     ]
//   },

//   // ==========================================================
//   //  4. SECURE APP (Main ERP)
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
//         path: 'notes',
//         loadChildren: () => import('./modules/notes/note.routes').then((m) => m.NOTE_ROUTES),
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
//       // {
//       //   path: 'attendence',
//       //   loadChildren: () => import('./modules/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
//       // },

//       // --- Administration & System ---
//       {
//         path: 'branches',
//         loadChildren: () => import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
//       },
//       {
//         path: 'hrms',
//         loadChildren: () => import('./modules/hrms/hrms.routes').then((m) => m.HRMS_ROUTES),
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

//       // Storefront Builder (Admin View)
//       {
//         path: 'storefront',
//         loadChildren: () => import('./modules/storefront-admin/storefront-admin.routes')
//           .then(m => m.STOREFRONT_ADMIN_ROUTES)
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
//   //  5. FALLBACK (404)
//   // ==========================================================
//   { path: '**', component: NotFoundComponent }
// ];