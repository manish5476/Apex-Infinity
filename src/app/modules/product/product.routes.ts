import { Routes } from '@angular/router';
import { ProductDetailsComponent } from './components/product-details/product-details';
import { ProductFormComponent } from './components/product-form/product-form';
import { ProductListComponent } from './components/product-list/product-list';

// These routes will be lazy-loaded under a '/products' path (defined in app.routes.ts)
export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    component: ProductListComponent,
  },
  {
    path: 'create',
    component: ProductFormComponent,
  },
  {
    path: ':id',
    component: ProductDetailsComponent,
  },
  {
    path: ':id/edit',
    component: ProductFormComponent,
  },
];