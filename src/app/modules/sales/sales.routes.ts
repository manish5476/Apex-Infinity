import { Routes } from '@angular/router';
import { SalesListComponent } from './sales-list/sales-list';

// These routes will be lazy-loaded under a '/products' path (defined in app.routes.ts)
export const SALES_ROUTES: Routes = [
  {
    path: '',
    component: SalesListComponent,
  },
];