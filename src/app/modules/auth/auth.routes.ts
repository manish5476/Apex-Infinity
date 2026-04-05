import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login'; // Adjust path if needed
import { Signup } from './components/signup/signup'; // Adjust path if needed
import { ResetPasswordComponent } from './components/reset-password/reset-password';
import { UpdatePasswordComponent } from './components/update-password/update-password';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password';
import { CreateOrganizationComponent } from '../organization/components/create-organization/create-organization';

import { FindShopComponent } from './components/find-shop/find-shop';
import { VerifyShopComponent } from './components/verify-shop/verify-shop';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, title: 'Login - Apex CRM' },
  { path: 'signup', component: Signup, title: 'Signup - Apex CRM' },
  { path: 'resetpassword/:token', component: ResetPasswordComponent, title: 'Reset Password - Apex CRM' },
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Forgot Password - Apex CRM' },
  { path: 'find-shop', component: FindShopComponent, title: 'Find Shop ID - Apex CRM' },
  { path: 'verify-shop', component: VerifyShopComponent, title: 'Verify Shop ID - Apex CRM' },
  { path: 'update-password', component: UpdatePasswordComponent, title: 'Update Password - Apex CRM' },
  { path: 'org', component: CreateOrganizationComponent, title: 'Register Organization' }
];