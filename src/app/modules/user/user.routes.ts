// user.routes.ts
import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile.component/user-profile.component';
import { UserDetailsComponent } from './user-details/user-details';
import { UserListComponent } from './user-list/user-list';
import { UserFormComponent } from './user-form/user-form';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { OrgHierarchyComponent } from './organization-heirachy-component/organization-heirachy-component';
import { TabRouterGuard } from '../../Tabbing';

export const USER_ROUTES: Routes = [
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'My Profile', tabIcon: 'pi pi-user', permissions: [PERMISSIONS.USER.READ] }
  },
  {
    path: 'list',
    component: UserListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Staff Directory', tabIcon: 'pi pi-users', permissions: [PERMISSIONS.USER.READ] }
  },
  {
    path: 'details/:id',
    component: UserDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Employee Details', tabIcon: 'pi pi-id-card', permissions: [PERMISSIONS.USER.READ] }
  },
  {
    path: 'create',
    component: UserFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Onboard Staff', tabIcon: 'pi pi-user-plus', permissions: [PERMISSIONS.USER.MANAGE] }
  },
  {
    path: 'edit/:id',
    component: UserFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Update Staff', tabIcon: 'pi pi-user-edit', permissions: [PERMISSIONS.USER.MANAGE] }
  },
  {
    path: 'hierarchy',
    component: OrgHierarchyComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Org Hierarchy', tabIcon: 'pi pi-sitemap', permissions: [PERMISSIONS.USER.READ] }
  }
];