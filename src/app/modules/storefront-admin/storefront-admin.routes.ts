// src/app/features/storefront-admin/storefront-admin.routes.ts
import { Routes } from '@angular/router';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

const adminSurfaceRoute = (path: string, surfaceKey: string, title: string): Routes[number] => ({
  path,
  loadComponent: () =>
    import('./pages/storefront-command-center/storefront-command-center.component')
      .then(m => m.StorefrontCommandCenterComponent),
  title,
  canActivate: [permissionGuard],
  data: { permissions: [PERMISSIONS.STOREFRONT.READ], surfaceKey }
});

export const STOREFRONT_ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  adminSurfaceRoute('overview', 'overview', 'Storefront Overview'),
  {
    path: 'pages',
    loadComponent: () =>
      import('./pages/page-list/page-list.component').then(m => m.PageListComponent),
    title: 'Store Pages',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.READ] }
  },
  {
    path: 'pages/:id/builder',
    loadComponent: () =>
      import('./pages/page-builder/page-builder.component').then(m => m.PageBuilderComponent),
    title: 'Page Builder',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.PAGE_MANAGE] }
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./pages/storefront-customers/storefront-customers.component')
        .then(m => m.StorefrontCustomersComponent),
    title: 'Storefront Customers',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.READ] }
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/storefront-orders/storefront-orders.component')
        .then(m => m.StorefrontOrdersComponent),
    title: 'Storefront Orders',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.READ] }
  },
  {
    path: 'coupons',
    loadComponent: () =>
      import('./pages/storefront-coupons/storefront-coupons.component')
        .then(m => m.StorefrontCouponsComponent),
    title: 'Storefront Coupons',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.READ] }
  },
    {
    path: 'themes',
    loadComponent: () =>
      import('./pages/theme-marketplace/theme-marketplace.component').then(m => m.ThemeMarketplaceComponent),
    title: 'Theme Marketplace',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.THEME_MANAGE] }
  },
  {
    path: 'settings/layout',
    loadComponent: () =>
      import('./pages/storefront-layout/storefront-layout.component').then(m => m.StorefrontLayoutComponent),
    title: 'Storefront Layout',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.LAYOUT_MANAGE] }
  },
  ...[
    ['activity', 'activity-logs', 'Activity Logs'],
    ['notifications', 'notifications-center', 'Notifications Center'],
    ['audit-history', 'audit-history', 'Audit History'],
    ['themes', 'theme-marketplace', 'Theme Marketplace'],
    ['templates', 'templates-library', 'Templates Library'],
    ['seo', 'seo-dashboard', 'SEO Dashboard'],
    ['analytics', 'analytics-overview', 'Analytics Overview'],
    ['reports/sales', 'sales-reports', 'Sales Reports'],
    ['abandoned-carts', 'abandoned-carts', 'Abandoned Carts'],
    ['discounts', 'discount-manager', 'Discount Manager'],
    ['segments', 'customer-segmentation', 'Customer Segmentation'],
    ['roles', 'role-management', 'Role Management'],
    ['integrations', 'integrations', 'Integrations'],
    ['domains', 'domain-settings', 'Domain Settings'],
    ['billing', 'billing-subscription', 'Billing'],
    ['onboarding', 'onboarding-flow', 'Onboarding'],
    ['setup', 'setup-wizard', 'Setup Wizard'],
    ['publish-history', 'publish-history', 'Publish History'],
    ['revisions', 'page-revisions', 'Page Revisions'],
    ['media', 'media-manager', 'Media Manager'],
    ['settings', 'settings', 'Storefront Settings']
  ].map(([path, surfaceKey, title]) => adminSurfaceRoute(path, surfaceKey, title))
];


