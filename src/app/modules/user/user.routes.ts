
import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile.component/user-profile.component';
import { UserDetailsComponent } from './user-details/user-details';
import { UserListComponent } from './user-list/user-list';
import { UserFormComponent } from './user-form/user-form';

export const USER_ROUTES: Routes = [
  { path: 'profile', component: UserProfileComponent }, // Self Profile
  { path: 'list', component: UserListComponent },       // Admin List
  { path: 'details/:id', component: UserDetailsComponent }, // Admin Details
  { path: 'create', component: UserFormComponent }, // Admin Create
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];