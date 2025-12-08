import { Routes } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { authGuard } from './core/guards/authguard.guard';
import { MasterList } from './modules/shared/components/master-list/master-list';
import { Transactions } from './modules/transactions/transactions/transactions';
import { LedgerComponent } from './modules/Ledger/ledger/ledger';
import { NotFoundComponent } from './modules/shared/components/notfound/notfound.component';
import { LogsComponent } from './modules/transactions/logs/logs';
import { SalesListComponent } from './modules/sales/sales-list/sales-list';
import { Sessions } from './modules/auth/sessions/sessions/sessions';
import { NotesManagerComponent } from './modules/shared/components/notes-manager/notes-manager.component';
import { ChatLayoutComponent } from './chat/chat.component/chat.component';
// import { LandingComponent } from './landingPage/landing.component'; // Removed for now

export const routes: Routes = [
  // ==========================================================
  //  1. PUBLIC AUTH ROUTES
  //  URL: /auth/login, /auth/signup
  // ==========================================================
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ==========================================================
  //  2. PROTECTED APPLICATION ROUTES (Back at Root)
  //  URL: /dashboard, /financials, etc.
  // ==========================================================
  {
    path: '',
    component: MainScreen,
    canActivate: [authGuard], // 🔒 Locks the root
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/components/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      { path: 'notes', component: NotesManagerComponent, title: 'My Notes' },
      { path: 'financials', component: LedgerComponent },

      // --- Admin & Settings ---
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
      { path: 'chat', component: ChatLayoutComponent },
      // --- MASTERS & TRANSACTIONS ---
      { path: 'masterList', component: MasterList },
      { path: 'transactions', component: Transactions },
      { path: 'sessions', component: Sessions },
      { path: 'logs', component: LogsComponent },
      { path: 'sales', component: SalesListComponent },

      // --- LAZY LOADED MODULES ---
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
        path: 'payments',
        loadChildren: () => import('./modules/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
      },
      {
        path: 'emis',
        loadChildren: () => import('./modules/emi/emi.routes').then((m) => m.EMI_ROUTES),
      },
    ],
  },

  // ==========================================================
  //  3. FALLBACK REDIRECT
  // ==========================================================
  { path: '**', component: NotFoundComponent }
];
