import { Routes } from '@angular/router';
import { Login } from './components/login/login'; // Adjust path if needed
import { Signup } from './components/signup/signup'; // Adjust path if needed
import { CreateOrganization } from '../organization/components/create-organization/create-organization';
import { ResetPasswordComponent } from './components/reset-password/reset-password';
import { UpdatePasswordComponent } from './components/update-password/update-password';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // URL: /auth/login
  { path: 'login', component: Login, title: 'Login - Apex CRM' },
  // URL: /auth/signup (Employee Signup)
  { path: 'signup', component: Signup, title: 'Join Organization' },

  { path: 'resetpassword', component: ResetPasswordComponent, title: 'Login - Apex CRM' },
  // URL: /auth/signup (Employee Signup)
  { path: 'update-password', component: UpdatePasswordComponent, title: 'Join Organization' },
  
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Join Organization' },

  // URL: /auth/org (New Organization Registration)
  { path: 'org', component: CreateOrganization, title: 'Register Organization' }
];