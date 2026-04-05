import { Routes } from '@angular/router';
import { BranchDetailsComponent } from './components/branch-details/branch-details';
import { BranchFormComponent } from './components/branch-form/branch-form';
import { BranchListComponent } from './components/branch-list/branch-list';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

// These routes will be lazy-loaded under a '/branches' path
export const BRANCH_ROUTES: Routes = [
  {
    path: '',
    component: BranchListComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Branch Directory', tabIcon: 'pi pi-map-marker', permissions: [PERMISSIONS.BRANCH.READ] }
  },
  {
    path: 'create',
    component: BranchFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'New Branch', tabIcon: 'pi pi-plus', permissions: [PERMISSIONS.BRANCH.MANAGE] }
  },
  {
    path: ':id',
    component: BranchDetailsComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Branch Details', tabIcon: 'pi pi-building', permissions: [PERMISSIONS.BRANCH.READ] }
  },
  {
    path: ':id/edit',
    component: BranchFormComponent,
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Update Branch', tabIcon: 'pi pi-pencil', permissions: [PERMISSIONS.BRANCH.MANAGE] }
  },
];