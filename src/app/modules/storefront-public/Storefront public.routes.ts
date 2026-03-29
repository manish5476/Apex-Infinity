// src/app/modules/storefront-public/storefront-public.routes.ts
//
// Mount in app.routes.ts:
//   {
//     path: 'store/:orgSlug',
//     loadComponent: () => import('./modules/storefront-public/layout/storefront-layout.component')
//       .then(m => m.StorefrontLayoutComponent),
//     children: STOREFRONT_PUBLIC_ROUTES
//   }
//
// Route order matters:
//   1. Specific named routes first  (products, cart, etc.)
//   2. Dynamic product detail       (:productSlug under products/)
//   3. Catch-all page slug last     (:pageSlug)

import { Routes } from '@angular/router';

export const STOREFRONT_PUBLIC_ROUTES: Routes = [
  // Default — redirect to home page
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // Product listing
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/product-listing/product-listing.component')
        .then(m => m.ProductListingComponent),
    title: 'Shop'
  },

  // Product detail — must be under products/ so it doesn't clash with page slugs
  {
    path: 'products/:productSlug',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component')
        .then(m => m.ProductDetailComponent),
    title: 'Product'
  },

  // Cart
  // {
  //   path: 'cart',
  //   loadComponent: () =>
  //     import('./pages/cart/cart.component')
  //       .then(m => m.CartComponent),
  //   title: 'Cart'
  // },

  // Dynamic CMS pages — catch-all, MUST stay last
  {
    path: ':pageSlug',
    loadComponent: () =>
      import('./dynamic-page/dynamic-page.component')
        .then(m => m.DynamicPageComponent),
    title: 'Store'
  }
];