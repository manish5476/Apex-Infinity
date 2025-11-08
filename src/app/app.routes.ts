import { Routes } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { authGuard } from './core/guards/authguard.guard';

export const routes: Routes = [
  // ==========================================================
  //  1. PUBLIC AUTH ROUTES
  // ==========================================================
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    // This will lazy-load the routes for Login, Create Org, and Employee Signup
  },

  // ==========================================================
  //  2. PROTECTED APPLICATION ROUTES
  // ==========================================================

  {
    path: '', // The default path for your app
    component: MainScreen,
    canActivate: [authGuard],
    children: [
      // --- This is what you asked for ---
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/components/dashboard/dashboard').then(
            (m) => m.Dashboard,
          ),
      },
      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./modules/organization/components/role-management/role-management').then(
            (m) => m.RoleManagementComponent
          ),
      },

      // Default route for a logged-in user
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // --- End of default child section ---

      // ... (add customers, sales, products, etc. here later)

    ],
  },

  // ==========================================================
  //  3. FALLBACK REDIRECT
  // ==========================================================
  // Redirect any unknown URL to the main app (which will be caught by the guard)
  { path: '**', redirectTo: '' }
];