import { Designation } from './hrms.service';
import { Routes } from '@angular/router';
import { DepartmentFormComponent } from './core/department/department-form/department-form';
import { DepartmentListComponent } from './core/department/department-list/department-list';
import { DepartmentDetailsComponent } from './core/department/department-details/department-details';
import { DepartmentHeirachy } from './core/department/department-heirachy/department-heirachy';
import { DepartmentHubComponent } from './core/department/departmentHub/department-hub';
import { DesignationFormComponent } from './core/designation/designation-form.component';
import { DesignationListComponent } from './core/designation/designation-list.component';
import { DesignationDetailsComponent } from './core/designation/designation-details.component';

export const HRMS_ROUTES: Routes = [
  {
    path: 'department',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'hub', component: DepartmentHubComponent },
      { path: 'list', component: DepartmentListComponent },
      { path: 'new', component: DepartmentFormComponent },
      { path: 'edit/:id', component: DepartmentFormComponent },
      { path: 'details/:id', component: DepartmentDetailsComponent },
    ]
  },
  {
    path: 'designation',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'new', component: DesignationFormComponent },
      { path: 'hub', component: DepartmentHubComponent },
      { path: 'list', component: DesignationListComponent },
      { path: 'edit/:id', component: DesignationFormComponent },
      { path: 'details/:id', component: DesignationDetailsComponent },
    ]
  },
];
