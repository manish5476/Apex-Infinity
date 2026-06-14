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

const placeholderRoute = (path: string, title: string, icon: string): Routes[number] => ({
  path,
  loadComponent: () =>
    import('./pages/storefront-placeholder/storefront-placeholder.component')
      .then(m => m.StorefrontPlaceholderComponent),
  title,
  canActivate: [permissionGuard],
  data: { permissions: [PERMISSIONS.STOREFRONT.READ], title, icon }
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
    path: 'delivery-agents',
    loadComponent: () =>
      import('./pages/storefront-delivery-agents/storefront-delivery-agents.component')
        .then(m => m.StorefrontDeliveryAgentsComponent),
    title: 'Storefront Delivery Agents',
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
  {
    path: 'rules',
    loadComponent: () =>
      import('./pages/smart-rules/smart-rules.component').then(m => m.SmartRulesComponent),
    title: 'Smart Rules',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.READ] }
  },

  // --- Dynamic Placeholders for Missing Modules ---
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/storefront-analytics/storefront-analytics.component').then(m => m.StorefrontAnalyticsComponent),
    title: 'Analytics & Insights',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.STOREFRONT.READ] }
  },

  placeholderRoute('reports/sales', 'Sales Reports', 'pi pi-chart-bar'),
  placeholderRoute('templates', 'Templates Library', 'pi pi-file'),
  placeholderRoute('media', 'Media Manager', 'pi pi-image'),
  placeholderRoute('abandoned-carts', 'Abandoned Carts', 'pi pi-shopping-cart'),
  placeholderRoute('discounts', 'Discount Manager', 'pi pi-percentage'),
  placeholderRoute('segments', 'Customer Segments', 'pi pi-users'),
  placeholderRoute('seo', 'SEO Dashboard', 'pi pi-search'),
  placeholderRoute('settings', 'Storefront Settings', 'pi pi-cog'),
  placeholderRoute('domains', 'Domain Settings', 'pi pi-globe'),
  placeholderRoute('integrations', 'Integrations', 'pi pi-link'),
  placeholderRoute('roles', 'Role Management', 'pi pi-id-card'),
  placeholderRoute('billing', 'Billing & Subscriptions', 'pi pi-credit-card'),
  placeholderRoute('activity', 'System Logs', 'pi pi-history'),
  placeholderRoute('notifications', 'Notification Center', 'pi pi-bell'),
  placeholderRoute('audit-history', 'Audit History', 'pi pi-list'),
  placeholderRoute('publish-history', 'Publish History', 'pi pi-send'),
  placeholderRoute('revisions', 'Page Revisions', 'pi pi-replay'),
  placeholderRoute('onboarding', 'Store Setup', 'pi pi-flag'),
  placeholderRoute('setup', 'Quick Setup', 'pi pi-forward'),
];


