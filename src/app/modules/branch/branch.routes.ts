import { Routes } from '@angular/router';
import { BranchDetailsComponent } from './components/branch-details/branch-details';
import { BranchFormComponent } from './components/branch-form/branch-form';
import { BranchListComponent } from './components/branch-list/branch-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

// These routes will be lazy-loaded under a '/branches' path
export const BRANCH_ROUTES: Routes = [
  {
    path: '',
    component: BranchListComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.BRANCH.READ] }
  },
  {
    path: 'create',
    component: BranchFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.BRANCH.MANAGE] }
  },
  {
    path: ':id',
    component: BranchDetailsComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.BRANCH.READ] }
  },
  {
    path: ':id/edit',
    component: BranchFormComponent,
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.BRANCH.MANAGE] }
  },
];