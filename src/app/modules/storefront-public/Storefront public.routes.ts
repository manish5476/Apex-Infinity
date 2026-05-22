// src/app/modules/storefront-public/storefront-public.routes.ts
import { Routes } from '@angular/router';

const storefrontExperienceRoute = (path: string, pageKey: string, title: string): Routes[number] => ({
  path,
  loadComponent: () =>
    import('./pages/storefront-experience/storefront-experience.component')
      .then(m => m.StorefrontExperienceComponent),
  data: { pageKey },
  title
});

const commerceFlowRoute = (path: string, mode: string, title: string): Routes[number] => ({
  path,
  loadComponent: () =>
    import('./pages/commerce-flow/commerce-flow.component')
      .then(m => m.CommerceFlowComponent),
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
  commerceFlowRoute('account', 'account', 'Account'),
  commerceFlowRoute('account/orders', 'orders', 'Orders'),
  commerceFlowRoute('account/addresses', 'addresses', 'Saved Addresses'),
  commerceFlowRoute('account/notifications', 'notifications', 'Notifications'),
  commerceFlowRoute('login', 'login', 'Store Login'),
  commerceFlowRoute('register', 'register', 'Create Account'),
  commerceFlowRoute('wishlist', 'wishlist', 'Wishlist'),
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
