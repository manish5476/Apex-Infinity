// ─────────────────────────────────────────────────────────────────────────────
// app.routes.ts  –  Route definitions with tab metadata
// ─────────────────────────────────────────────────────────────────────────────
//
// Route `data` keys consumed by the system:
//   tabLabel  – string   – Display label in the tab strip
//   tabIcon   – string   – PrimeNG icon class  (e.g. 'pi pi-user')
//   tabPinned – boolean  – Pin on open (cannot close)
//   reuseTab  – boolean  – Cache component tree (default true)
//
// ─────────────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';
import { TabRouterGuard } from './tabs/tab-router.guard';

export const routes: Routes = [
  // ── Shell / layout ──────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./shell/shell.component').then(m => m.ShellComponent),
    children: [

      // Dashboard (pinned – always open, cannot be closed)
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [TabRouterGuard],
        data: {
          tabLabel:  'Dashboard',
          tabIcon:   'pi pi-home',
          tabPinned: true,
          reuseTab:  true,
        },
      },

      // Customer list
      {
        path: 'customers',
        loadComponent: () => import('./pages/customers/customer-list.component').then(m => m.CustomerListComponent),
        canActivate: [TabRouterGuard],
        data: {
          tabLabel: 'Customers',
          tabIcon:  'pi pi-users',
          reuseTab: true,
        },
      },

      // Customer detail (unique tab per :id)
      {
        path: 'customers/:id',
        loadComponent: () => import('./pages/customers/customer-detail.component').then(m => m.CustomerDetailComponent),
        canActivate: [TabRouterGuard],
        data: {
          tabLabel: 'Customer',
          tabIcon:  'pi pi-user',
          reuseTab: true,
        },
      },

      // Invoice detail
      {
        path: 'invoices/:id',
        loadComponent: () => import('./pages/invoices/invoice-detail.component').then(m => m.InvoiceDetailComponent),
        canActivate: [TabRouterGuard],
        data: {
          tabLabel: 'Invoice',
          tabIcon:  'pi pi-file',
          reuseTab: true,
        },
      },

      // Settings (no caching needed)
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [TabRouterGuard],
        data: {
          tabLabel: 'Settings',
          tabIcon:  'pi pi-cog',
          reuseTab: false,
        },
      },

      // Default redirect
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
