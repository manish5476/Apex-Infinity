import { Routes } from '@angular/router';

export const deliveryRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/delivery-login/delivery-login.component').then(m => m.DeliveryLoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/delivery-dashboard/delivery-dashboard.component').then(m => m.DeliveryDashboardComponent)
  }
];
