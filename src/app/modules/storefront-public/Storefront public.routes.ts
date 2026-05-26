// src/app/modules/storefront-public/storefront-public.routes.ts
import { Routes } from '@angular/router';
import { storefrontCustomerGuard } from '@core/services/storefront-customer.guard';
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
    path: 'delivery-agent',
    redirectTo: '/delivery/login',
    pathMatch: 'full'
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
  ...[
    ['search', 'search', 'Search'],
    ['compare', 'compare', 'Compare Products'],
    ['recently-viewed', 'recently-viewed', 'Recently Viewed'],
    ['recommendations', 'recommendations', 'Recommendations'],
    ['reviews', 'reviews', 'Customer Reviews'],
    ['rewards', 'rewards', 'Rewards'],
    ['orders/success', 'order-success', 'Order Success'],
    ['orders/failure', 'order-failure', 'Order Failure'],
    ['gift-card', 'gift-card', 'Gift Card']
  ].map(([path, pageKey, title]) => storefrontExperienceRoute(path, pageKey, title)),
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
