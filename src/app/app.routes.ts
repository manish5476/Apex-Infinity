import { Routes } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { authGuard } from './core/guards/authguard.guard';
import { MasterList } from './modules/shared/components/master-list/master-list';

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
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/components/dashboard/dashboard').then(
            (m) => m.Dashboard
          ),
      },

      // --- ADMIN & MASTERS ---
      {
        path: 'masterList',
        component: MasterList,
      },
      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./modules/organization/components/role-management/role-management').then(
            (m) => m.RoleManagementComponent
          ),
      },
      {
        path: 'branches',
        loadChildren: () =>
          import('./modules/branch/branch.routes').then((m) => m.BRANCH_ROUTES),
      },

      // --- CORE MODULES ---
      {
        path: 'customer',
        loadChildren: () =>
          import('./modules/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
      },
      {
        path: 'suppliers', // Corrected typo from 'cupplier'
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