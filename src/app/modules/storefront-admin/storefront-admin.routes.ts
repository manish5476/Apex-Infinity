import { Routes } from '@angular/router';

export const STOREFRONT_ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'pages',
    pathMatch: 'full'
  },
  {
    path: 'pages',
    loadComponent: () => import('./pages/page-list/page-list.component')
      .then(m => m.PageListComponent),
    title: 'Store Pages'
  },
  {
    path: 'pages/:id/builder', // The main Editor
    loadComponent: () => import('./pages/page-builder/page-builder.component')
      .then(m => m.PageBuilderComponent),
    title: 'Page Builder'
  },
];