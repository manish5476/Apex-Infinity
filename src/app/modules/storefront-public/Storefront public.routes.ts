// src/app/modules/storefront-public/storefront-public.routes.ts
import { Routes } from '@angular/router';
import { storefrontCustomerGuard } from '@core/services/storefront-customer.guard';
import { portalCustomerGuard } from '@core/services/portal-customer.guard';
import { storefrontCartResolver } from '../../storefront/core/resolvers/storefront-cart.resolver';
import { storefrontCustomerResolver } from '../../storefront/core/resolvers/storefront-customer.resolver';

const storefrontExperienceRoute = (path: string, pageKey: string, title: string): Routes[number] => ({
  path,
  loadComponent: () =>
    import('./pages/storefront-experience/storefront-experience.component')
      .then(m => m.StorefrontExperienceComponent),
  data: { pageKey },
  title
});

const commerceFlowRoute = (path: string, mode: string, title: string, customerOnly = false): Routes[number] => ({
  path,
  loadComponent: () =>
    import('./pages/commerce-flow/commerce-flow.component')
      .then(m => m.CommerceFlowComponent),
  canActivate: customerOnly ? [storefrontCustomerGuard] : undefined,
  resolve: path === 'cart' || path === 'checkout'
    ? { cart: storefrontCartResolver }
    : customerOnly
      ? { customer: storefrontCustomerResolver }
      : undefined,
  data: { mode },
  title
});

/** Helper for portal routes (all use CustomerPortalComponent) */
const portalRoute = (path: string, mode: string, title: string, guarded = false): Routes[number] => ({
  path,
  loadComponent: () =>
    import('./pages/customer-portal/customer-portal.component')
      .then(m => m.CustomerPortalComponent),
  canActivate: guarded ? [portalCustomerGuard] : undefined,
  data: { mode },
  title
});

export const STOREFRONT_PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dynamic-page/dynamic-page.component')
        .then(m => m.DynamicPageComponent),
    pathMatch: 'full',
    title: 'Store'
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/product-listing/product-listing.component')
        .then(m => m.ProductListingComponent),
    title: 'Shop'
  },
  commerceFlowRoute('cart', 'cart', 'Cart'),
  commerceFlowRoute('checkout', 'checkout', 'Checkout'),
  commerceFlowRoute('account', 'account', 'Account', true),
  commerceFlowRoute('account/orders', 'orders', 'Orders', true),
  commerceFlowRoute('account/addresses', 'addresses', 'Saved Addresses', true),
  commerceFlowRoute('account/notifications', 'notifications', 'Notifications', true),
  commerceFlowRoute('login', 'login', 'Store Login'),
  {
    path: 'delivery',
    loadChildren: () => import('../delivery/delivery.routes').then(m => m.deliveryRoutes)
  },
  commerceFlowRoute('forgot-password', 'forgot', 'Forgot Password'),
  commerceFlowRoute('register', 'register', 'Create Account'),
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component')
        .then(m => m.ResetPasswordComponent),
    title: 'Reset Password'
  },
  commerceFlowRoute('wishlist', 'wishlist', 'Wishlist', true),
  commerceFlowRoute('track-order', 'track-order', 'Track Order'),
  ...([
    ['search', 'search', 'Search'],
    ['compare', 'compare', 'Compare Products'],
    ['recently-viewed', 'recently-viewed', 'Recently Viewed'],
    ['recommendations', 'recommendations', 'Recommendations'],
    ['reviews', 'reviews', 'Customer Reviews'],
    ['rewards', 'rewards', 'Rewards'],
    ['orders/success', 'order-success', 'Order Success'],
    ['orders/failure', 'order-failure', 'Order Failure'],
    ['gift-card', 'gift-card', 'Gift Card']
  ] as [string, string, string][]).map(([path, pageKey, title]) => storefrontExperienceRoute(path, pageKey, title)),

  // ── Customer Self-Service Portal (/portal/*) ─────────────────────────────
  // Auth routes — no guard
  portalRoute('portal/login',          'login',          'Sign In — My Account'),
  portalRoute('portal/register',       'register',       'Create Account — My Account'),
  portalRoute('portal/forgot-password','forgot-password','Forgot Password — My Account'),
  portalRoute('portal/reset-password', 'reset-password', 'Reset Password — My Account'),
  // Protected routes — require portal JWT
  portalRoute('portal/dashboard',       'dashboard',    'Dashboard — My Account',      true),
  portalRoute('portal/orders',          'orders',       'My Orders — My Account',       true),
  portalRoute('portal/orders/:saleId',  'order-detail', 'Order Detail — My Account',    true),
  portalRoute('portal/returns',         'returns',      'My Returns — My Account',      true),
  portalRoute('portal/returns/:returnId','return-detail','Return Detail — My Account',  true),
  portalRoute('portal/return-form',     'return-form',  'Request Return — My Account',  true),
  portalRoute('portal/profile',         'profile',      'My Profile — My Account',      true),

  {
    path: 'products/:productSlug',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component')
        .then(m => m.ProductDetailComponent),
      title: 'Product'
  },
{
  path: ':pageSlug',
    loadComponent: () =>
      import('./dynamic-page/dynamic-page.component')
        .then(m => m.DynamicPageComponent),
      title: 'Store'
},
{
  path: '**',
    loadComponent: () =>
      import('./dynamic-page/dynamic-page.component')
        .then(m => m.DynamicPageComponent),
      data: { notFoundFallback: true },
  title: 'Store'
}
];
