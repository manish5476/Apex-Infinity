import { Routes } from '@angular/router';
import { Login } from './components/login/login'; // Adjust path if needed
import { Signup } from './components/signup/signup'; // Adjust path if needed
import { CreateOrganization } from '../organization/components/create-organization/create-organization';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // URL: /auth/login
  { path: 'login', component: Login, title: 'Login - Apex CRM' },
  
  // URL: /auth/signup (Employee Signup)
  { path: 'signup', component: Signup, title: 'Join Organization' },
  
  // URL: /auth/org (New Organization Registration)
  { path: 'org', component: CreateOrganization, title: 'Register Organization' }
];