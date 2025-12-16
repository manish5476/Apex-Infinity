// user.routes.ts
import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile.component/user-profile.component';
import { UserDetailsComponent } from './user-details/user-details';
import { UserListComponent } from './user-list/user-list';
import { UserFormComponent } from './user-form/user-form';

export const USER_ROUTES: Routes = [
  { path: 'profile', component: UserProfileComponent },
  { path: 'list', component: UserListComponent },
  { path: 'details/:id', component: UserDetailsComponent },
  { path: 'create', component: UserFormComponent }, 
  // 👇 Add this line for Editing
  { path: 'edit/:id', component: UserFormComponent }, 
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];