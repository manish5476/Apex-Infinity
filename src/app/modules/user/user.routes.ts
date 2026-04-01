// user.routes.ts
import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile.component/user-profile.component';
import { UserDetailsComponent } from './user-details/user-details';
import { UserListComponent } from './user-list/user-list';
import { UserFormComponent } from './user-form/user-form';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { OrgHierarchyComponent } from './organization-heirachy-component/organization-heirachy-component';

export const USER_ROUTES: Routes = [
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.USER.READ] }
  },
  {
    path: 'list',
    component: UserListComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.USER.READ] }
  },
  {
    path: 'details/:id',
    component: UserDetailsComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.USER.READ] }
  },
  {
    path: 'create',
    component: UserFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.USER.MANAGE] }
  },
  // 👇 Add this line for Editing
  {
    path: 'edit/:id',
    component: UserFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.USER.MANAGE] }
  },
  {
    path: 'hierarchy',
    component: OrgHierarchyComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.USER.READ] }
  },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];