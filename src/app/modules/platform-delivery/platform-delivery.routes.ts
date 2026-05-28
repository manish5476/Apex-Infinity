import { Routes } from '@angular/router';
import { platformDeliveryGuard } from './guards/platform-delivery.guard';

export const platformDeliveryRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/platform-register/platform-register.component').then(m => m.PlatformRegisterComponent),
    title: 'Become a Partner - Apex Delivery'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/platform-login/platform-login.component').then(m => m.PlatformLoginComponent),
    title: 'Login - Apex Delivery'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/platform-dashboard/platform-dashboard.component').then(m => m.PlatformDashboardComponent),
    canActivate: [platformDeliveryGuard],
    title: 'Dashboard - Apex Delivery'
  }
];
