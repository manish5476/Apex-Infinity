import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile.component/user-profile.component';

// These routes will be lazy-loaded under a '/products' path (defined in app.routes.ts)
export const USER_ROUTES: Routes = [
  {
    path: 'profile',
    component: UserProfileComponent,
  },
];