import { Routes } from '@angular/router';
import { BranchDetailsComponent } from './components/branch-details/branch-details';
import { BranchFormComponent } from './components/branch-form/branch-form';
import { BranchListComponent } from './components/branch-list/branch-list';

// These routes will be lazy-loaded under a '/branches' path
export const BRANCH_ROUTES: Routes = [
  {
    path: '',
    component: BranchListComponent,
  },
  {
    path: 'create',
    component: BranchFormComponent,
  },
  {
    path: ':id',
    component: BranchDetailsComponent,
  },
  {
    path: ':id/edit',
    component: BranchFormComponent,
  },
];