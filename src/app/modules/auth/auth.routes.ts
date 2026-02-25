import { Routes } from '@angular/router';
import { Login } from './components/login/login'; // Adjust path if needed
import { Signup } from './components/signup/signup'; // Adjust path if needed
import { ResetPasswordComponent } from './components/reset-password/reset-password';
import { UpdatePasswordComponent } from './components/update-password/update-password';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password';
import { CreateOrganizationComponent } from '../organization/components/create-organization/create-organization';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, title: 'Login - Apex CRM' },
  { path: 'signup', component: Signup, title: 'Signup - Apex CRM' },
  { path: 'resetpassword/:token', component: ResetPasswordComponent, title: 'Reset Password - Apex CRM' },
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Forgot Password - Apex CRM' },
  { path: 'update-password', component: UpdatePasswordComponent, title: 'Update Password - Apex CRM' },
  { path: 'org', component: CreateOrganizationComponent, title: 'Register Organization' }
];