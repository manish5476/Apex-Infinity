import { Designation } from './hrms.service';
import { Routes } from '@angular/router';

// --- Departments ---
import { DepartmentFormComponent } from './core/department/department-form/department-form';
import { DepartmentListComponent } from './core/department/department-list/department-list';
import { DepartmentDetailsComponent } from './core/department/department-details/department-details';
import { DepartmentHeirachy } from './core/department/department-heirachy/department-heirachy';
import { DepartmentHubComponent } from './core/department/departmentHub/department-hub';

// --- Designations ---
import { DesignationFormComponent } from './core/designation/designation-form.component';
import { DesignationListComponent } from './core/designation/designation-list.component';
import { DesignationDetailsComponent } from './core/designation/designation-details.component';
import { DesignationHierarchyComponent } from './core/designation/designation-hierarchy.component';
import { DesignationCareerPathComponent } from './core/designation/designation-career-path.component';
import { DesignationSalaryBandsComponent } from './core/designation/designation-salary-bands.component';
import { DesignationPromotionComponent } from './core/designation/designation-promotion.component';

// --- Shifts ---
import { ShiftFormComponent } from './core/shift/shift-form.component';
import { ShiftListComponent } from './core/shift/shift-list.component';
import { ShiftCoverageComponent } from './core/shift/shift-coverage.component';
import { ShiftDetailsComponent } from './core/shift/shift-details.component';
import { ShiftCalculatorComponent } from './core/shift/shift-calculator.component';
import { ShiftValidatorComponent } from './core/shift/shift-validator.component';
import { ShiftAssignmentsComponent } from './core/shift/shift-assignments.component';
import { ShiftClonerComponent } from './core/shift/shift-cloner.component';


// --- Leave Management ---
import { LeaveHubComponent } from './core/leave/leave-hub.component';
import { LeaveAdminHubComponent } from './core/leave/leave-admin-hub.component';
import { LeaveFormComponent } from './core/leave/leave-form.component';
import { LeaveDetailsComponent } from './core/leave/leave-details.component';

import { LeaveBalanceAdminComponent } from './core/leaveBalance/leave-balance-admin.component';
import { LeaveBalanceDetailComponent } from './core/leaveBalance/leave-balance-detail.component';
import { ShiftGroupAssignmentsComponent } from './core/shift/shift-group-assignments.component';
import { ShiftGroupFormComponent } from './core/shift/shift-group-form.component';
import { ShiftGroupListComponent } from './core/shift/shift-group-list.component';
import { AdminAttendanceComponent } from './core/attendenceLog/admin-attendance.component';
import { EmployeeAttendanceComponent } from './core/attendenceLog/employee-attendance.component';
import { LiveAttendanceFeedComponent } from './core/attendenceLog/live-attendance-feed.component';
import { UserAttendanceDetailsComponent } from './core/attendenceLog/user-attendance-details.component';
import { AttendanceReportsComponent } from '../attendance/attendance-reports.component/attendance-reports.component';
import { AdminDailyAttendanceComponent } from './core/attendence/admin-daily-attendance.component';
import { MyDailyAttendanceComponent } from './core/attendence/my-daily-attendance.component';


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
      { path: 'heirachy', component: DesignationHierarchyComponent },
      { path: 'salary', component: DesignationSalaryBandsComponent },
      { path: 'promotion', component: DesignationPromotionComponent },
      { path: 'career', component: DesignationCareerPathComponent },
      { path: 'list', component: DesignationListComponent },
      { path: 'edit/:id', component: DesignationFormComponent },
      { path: 'details/:id', component: DesignationDetailsComponent },
    ]
  },
  {
    path: 'shifts',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'new', component: ShiftFormComponent },
      { path: 'clone', component: ShiftClonerComponent },
      { path: 'coverage', component: ShiftCoverageComponent },
      { path: 'validator', component: ShiftValidatorComponent },
      { path: 'calculator', component: ShiftCalculatorComponent },
      { path: 'list', component: ShiftListComponent },
      { path: 'edit/:id', component: ShiftFormComponent },
      { path: 'details/:id', component: ShiftDetailsComponent },
      { path: ':id/assignments', component: ShiftAssignmentsComponent },
    ]
  },
  {
    path: 'shift-groups',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: ShiftGroupListComponent },
      { path: 'new', component: ShiftGroupFormComponent },
      { path: 'edit/:id', component: ShiftGroupFormComponent },
      { path: ':id/assignments', component: ShiftGroupAssignmentsComponent },
    ]
  },
  {
    path: 'leave',
    children: [
      { path: '', redirectTo: 'hub', pathMatch: 'full' },
      { path: 'hub', component: LeaveHubComponent }, // Employee Self-Service Hub
      { path: 'admin', component: LeaveAdminHubComponent }, // HR/Manager Admin Hub
      { path: 'apply', component: LeaveFormComponent },
      { path: 'edit/:id', component: LeaveFormComponent },
      { path: 'details/:id', component: LeaveDetailsComponent },
    ]
  },
  {
    path: 'leave-balances',
    children: [
      { path: '', redirectTo: 'admin', pathMatch: 'full' },
      { path: 'admin', component: LeaveBalanceAdminComponent }, // Global Balances
      { path: 'details/:id', component: LeaveBalanceDetailComponent }, // Individual Employee Ledger
    ]
  },
  {
    path: 'attendance',
    children: [
      { path: '', redirectTo: 'my-clock', pathMatch: 'full' },
      { path: 'my-clock', component: EmployeeAttendanceComponent }, // Employee Web Clock
      { path: 'admin', component: AdminAttendanceComponent }, // HR Monitor & Correction
      { path: 'live-feed', component: LiveAttendanceFeedComponent }, // Wallboard/TV Display
      { path: 'user/:id', component: UserAttendanceDetailsComponent }, // Specific Employee Ledger
    ]
  },{
    path: 'daily-attendance',
    children: [
      { path: '', redirectTo: 'my-timesheet', pathMatch: 'full' },
      { path: 'my-timesheet', component: MyDailyAttendanceComponent }, // Employee view & regularization
      { path: 'admin', component: AdminDailyAttendanceComponent }, // HR Daily Register
      { path: 'reports', component: AttendanceReportsComponent } // Reports & Bulk Actions
    ]
  },
];