// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/guards/auth.guard';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

// Standalone Components (eagerly loaded — small, always needed)
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
import { AssetList } from './modules/organization/components/AssetList/asset-list';
import { STOREFRONT_PUBLIC_ROUTES } from './modules/storefront-public/Storefront public.routes';
import { UnauthorizedComponent } from './modules/shared/components/unauthorized/unauthorized';
import { ADMIN_ANALYTICS_ROUTES } from './admin/admin.routes';
import { ADMIN_CHARTS_ROUTES } from './admin/charts.routes';
import { TabRouterGuard } from './Tabbing';

// Storefront public child routes (extracted for readability)

export const routes: Routes = [

  // ============================================================
  // 1. PUBLIC LANDING PAGE
  // ============================================================
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
    title: 'Apex Infinity - ERP'
  },

  // ============================================================
  // 2. AUTHENTICATION
  // ============================================================
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ============================================================
  // 3. PUBLIC STOREFRONT  (no auth required)
  //    Layout component wraps all child routes.
  //    Children are defined in storefront-public.routes.ts.
  // ============================================================
  {
    path: 'store/:orgSlug',
    loadComponent: () =>
      import('./modules/storefront-public/layout/storefront-layout.component')
        .then(m => m.StorefrontLayoutComponent),
    children: STOREFRONT_PUBLIC_ROUTES
  },

  // ============================================================
  // 4. SECURE ERP APP  (authGuard required)
  // ============================================================
  {
    path: '',
    component: MainScreen,
    canActivate: [authGuard],
    canActivateChild: [TabRouterGuard],
    children: [
      // 1. Data Analytics (Directly mapped to tabs)
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        data: { permissions: [PERMISSIONS.DASHBOARD.VIEW] },
        children: [
          ...ADMIN_ANALYTICS_ROUTES,
          { path: '', redirectTo: 'executive', pathMatch: 'full' }
        ]
      },

      // 2. Visual  / Charts (Directly mapped to tabs)
      {
        path: 'charts',
        canActivate: [permissionGuard],
        data: { permissions: [PERMISSIONS.DASHBOARD.VIEW] },
        children: [
          ...ADMIN_CHARTS_ROUTES,
          { path: '', redirectTo: 'gallery', pathMatch: 'full' }
        ]
      },

      // 3. Communications & Core
      {
        path: 'chat',
        component: ChatComponent,
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Team Chat', tabIcon: 'pi pi-comments', permissions: [PERMISSIONS.CHAT.READ] }
      },

      // 4. Financials
      {
        path: 'financials',
        component: LedgerComponent,
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Financial Ledger', tabIcon: 'pi pi-book', permissions: [PERMISSIONS.LEDGER.READ] }
      },
      {
        path: 'transactions',
        component: Transactions,
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Transactions', tabIcon: 'pi pi-history', permissions: [PERMISSIONS.TRANSACTION.READ] }
      },
      {
        path: 'sales',
        component: SalesListComponent,
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Sales Reports', tabIcon: 'pi pi-chart-bar', permissions: [PERMISSIONS.SALES.VIEW] }
      },
      {
        path: 'assets',
        component: AssetList,
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Assets', tabIcon: 'pi pi-wifi', permissions: [PERMISSIONS.ASSET.READ] }
      },

      // 5. Business Modules (Lazy-loaded)
      { path: 'accounts', loadChildren: () => import('./modules/accounts/accounts.routes').then(m => m.ACCOUNT_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.ACCOUNT.READ] } },
      { path: 'payments', loadChildren: () => import('./modules/payment/payment.routes').then(m => m.PAYMENT_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.PAYMENT.READ] } },
      { path: 'notes', loadChildren: () => import('./modules/notes/note.routes').then(m => m.NOTE_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.NOTE.READ] } },
      { path: 'invoices', loadChildren: () => import('./modules/invoice/invoice.routes').then(m => m.INVOICE_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.INVOICE.READ] } },
      { path: 'emis', loadChildren: () => import('./modules/emi/emi.routes').then(m => m.EMI_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.EMI.READ] } },
      { path: 'product', loadChildren: () => import('./modules/product/product.routes').then(m => m.PRODUCT_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.PRODUCT.READ] } },
      { path: 'purchase', loadChildren: () => import('./modules/purchase/purchase.routes').then(m => m.PURCHASE_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.PURCHASE.READ] } },
      { path: 'suppliers', loadChildren: () => import('./modules/cupplier/supplier.routes').then(m => m.SUPPLIER_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.SUPPLIER.READ] } },
      { path: 'customer', loadChildren: () => import('./modules/customer/customer.routes').then(m => m.CUSTOMER_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.CUSTOMER.READ] } },
      { path: 'user', loadChildren: () => import('./modules/user/user.routes').then(m => m.USER_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.USER.READ] } },
      { path: 'branches', loadChildren: () => import('./modules/branch/branch.routes').then(m => m.BRANCH_ROUTES), canActivate: [permissionGuard], data: { permissions: [PERMISSIONS.BRANCH.READ] } },

      // HRMS
      { path: 'hrms', loadChildren: () => import('./modules/hrms/hrms.routes').then(m => m.HRMS_ROUTES) },

      // Administration
      {
        path: 'admin/organization',
        loadComponent: () =>
          import('./modules/organization/components/org-settings/org-settings').then(m => m.OrgSettingsComponent),
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Organization', tabIcon: 'pi pi-building', permissions: [PERMISSIONS.ORG.MANAGE] }
      },
      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./modules/organization/components/role-management/role-management').then(m => m.RoleManagementComponent),
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Roles & Permissions', tabIcon: 'pi pi-lock', permissions: [PERMISSIONS.ROLE.MANAGE] }
      },
      {
        path: 'storefront',
        loadChildren: () =>
          import('./modules/storefront-admin/storefront-admin.routes').then(m => m.STOREFRONT_ADMIN_ROUTES)
      },

      // Utilities
      {
        path: 'masterList',
        component: MasterList,
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Master Data', tabIcon: 'pi pi-database', permissions: [PERMISSIONS.MASTER.READ] }
      },
      {
        path: 'sessions',
        component: Sessions,
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Active Sessions', tabIcon: 'pi pi-wifi', permissions: [PERMISSIONS.SESSION.VIEW_ALL] }
      },
      {
        path: 'logs',
        component: LogsComponent,
        canActivate: [TabRouterGuard, permissionGuard],
        data: { tabLabel: 'Audit Logs', tabIcon: 'pi pi-list', permissions: [PERMISSIONS.LOGS.VIEW] }
      },
      {
        path: 'unauthorized',
        component: UnauthorizedComponent,
        title: 'Access Restricted'
      }
    ]
  },

  // ============================================================
  // 5. FALLBACK 404 & UNAUTHORIZED
  // ============================================================
  { path: '**', component: NotFoundComponent }
];
