import { Routes } from '@angular/router';
import { deliveryAgentGuard } from './guards/delivery-agent.guard';

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
    path: 'forgot-password',
    loadComponent: () => import('./pages/delivery-forgot-password/delivery-forgot-password.component').then(m => m.DeliveryForgotPasswordComponent)
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./pages/delivery-reset-password/delivery-reset-password.component').then(m => m.DeliveryResetPasswordComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/delivery-dashboard/delivery-dashboard.component').then(m => m.DeliveryDashboardComponent),
    canActivate: [deliveryAgentGuard]
  }
];
