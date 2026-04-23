import { Routes } from '@angular/router';

// --- Daily Attendance ---
import { AdminDailyAttendanceComponent } from './core/attendence/admin-daily-attendance.component';
import { MyDailyAttendanceComponent } from './core/attendence/my-daily-attendance.component';
import { AttendanceReportsComponent } from './core/attendence/attendance-reports.component';

// --- Raw Attendance (Logs) ---
import { AdminAttendanceComponent } from './core/attendenceLog/admin-attendance.component';
import { EmployeeAttendanceComponent } from './core/attendenceLog/employee-attendance.component';
import { LiveAttendanceFeedComponent } from './core/attendenceLog/live-attendance-feed.component';
import { UserAttendanceDetailsComponent } from './core/attendenceLog/user-attendance-details.component';

// --- Departments ---
import { DepartmentDetailsComponent } from './core/department/department-details/department-details';
import { DepartmentFormComponent } from './core/department/department-form/department-form';
import { DepartmentHeirachy } from './core/department/department-heirachy/department-heirachy';
import { DepartmentListComponent } from './core/department/department-list/department-list';
import { DepartmentHubComponent } from './core/department/departmentHub/department-hub';

// --- Designations ---
import { DesignationCareerPathComponent } from './core/designation/designation-career-path.component';
import { DesignationDetailsComponent } from './core/designation/designation-details.component';
import { DesignationFormComponent } from './core/designation/designation-form.component';
import { DesignationHierarchyComponent } from './core/designation/designation-hierarchy.component';
import { DesignationListComponent } from './core/designation/designation-list.component';
import { DesignationPromotionComponent } from './core/designation/designation-promotion.component';
import { DesignationSalaryBandsComponent } from './core/designation/designation-salary-bands.component';

// --- Geofencing ---
import { GeofenceDetailsComponent } from './core/geoFencing/geofence-details.component';
import { GeofenceFormComponent } from './core/geoFencing/geofence-form.component';
import { GeofenceHubComponent } from './core/geoFencing/geofence-hub.component';

// --- Holidays ---
import { HolidayFormComponent } from './core/holiday/holiday-form.component';
import { HolidayHubComponent } from './core/holiday/holiday-hub.component';

// --- Leave Management ---
import { LeaveAdminHubComponent } from './core/leave/leave-admin-hub.component';
import { LeaveDetailsComponent } from './core/leave/leave-details.component';
import { LeaveFormComponent } from './core/leave/leave-form.component';
import { LeaveHubComponent } from './core/leave/leave-hub.component';

// --- Leave Balances ---
import { LeaveBalanceAdminComponent } from './core/leaveBalance/leave-balance-admin.component';
import { LeaveBalanceDetailComponent } from './core/leaveBalance/leave-balance-detail.component';

// --- Attendance Machines ---
import { MachineAnalyticsComponent } from './core/machine/machine-analytics.component';
import { MachineDetailsComponent } from './core/machine/machine-details.component';
import { MachineFormComponent } from './core/machine/machine-form.component';
import { MachineHubComponent } from './core/machine/machine-hub.component';
import { MachineLogsComponent } from './core/machine/machine-logs.component';

// --- Shifts & Groups ---
import { ShiftAssignmentsComponent } from './core/shift/shift-assignments.component';
import { ShiftCalculatorComponent } from './core/shift/shift-calculator.component';
import { ShiftClonerComponent } from './core/shift/shift-cloner.component';
import { ShiftCoverageComponent } from './core/shift/shift-coverage.component';
import { ShiftDetailsComponent } from './core/shift/shift-details.component';
import { ShiftFormComponent } from './core/shift/shift-form.component';
import { ShiftGroupAssignmentsComponent } from './core/shift/shift-group-assignments.component';
import { ShiftGroupFormComponent } from './core/shift/shift-group-form.component';
import { ShiftGroupListComponent } from './core/shift/shift-group-list.component';
import { ShiftListComponent } from './core/shift/shift-list.component';
import { ShiftValidatorComponent } from './core/shift/shift-validator.component';


import { TabRouterGuard } from '../../Tabbing';

export const HRMS_ROUTES: Routes = [
  {
    path: 'department',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'hub', component: DepartmentHubComponent, data: { tabLabel: 'Dept Hub', tabIcon: 'pi pi-home' } },
      { path: 'list', component: DepartmentListComponent, data: { tabLabel: 'Dept List', tabIcon: 'pi pi-list' } },
      { path: 'new', component: DepartmentFormComponent, data: { tabLabel: 'New Dept', tabIcon: 'pi pi-plus' } },
      { path: 'heirachy', component: DepartmentHeirachy, data: { tabLabel: 'Dept Hierarchy', tabIcon: 'pi pi-sitemap' } },
      { path: 'edit/:id', component: DepartmentFormComponent, data: { tabLabel: 'Edit Dept', tabIcon: 'pi pi-pencil' } },
      { path: 'details/:id', component: DepartmentDetailsComponent, data: { tabLabel: 'Dept Details', tabIcon: 'pi pi-info-circle' } },
    ]
  },
  {
    path: 'designation',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'new', component: DesignationFormComponent, data: { tabLabel: 'New Designation', tabIcon: 'pi pi-plus' } },
      { path: 'heirachy', component: DesignationHierarchyComponent, data: { tabLabel: 'Designation Hierarchy', tabIcon: 'pi pi-sitemap' } },
      { path: 'salary', component: DesignationSalaryBandsComponent, data: { tabLabel: 'Salary Bands', tabIcon: 'pi pi-money-bill' } },
      { path: 'promotion', component: DesignationPromotionComponent, data: { tabLabel: 'Promotions', tabIcon: 'pi pi-angle-double-up' } },
      { path: 'career', component: DesignationCareerPathComponent, data: { tabLabel: 'Career Path', tabIcon: 'pi pi-map' } },
      { path: 'list', component: DesignationListComponent, data: { tabLabel: 'Designation List', tabIcon: 'pi pi-list' } },
      { path: 'edit/:id', component: DesignationFormComponent, data: { tabLabel: 'Edit Designation', tabIcon: 'pi pi-pencil' } },
      { path: 'details/:id', component: DesignationDetailsComponent, data: { tabLabel: 'Designation Details', tabIcon: 'pi pi-info-circle' } },
    ]
  },
  {
    path: 'shifts',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'new', component: ShiftFormComponent, data: { tabLabel: 'New Shift', tabIcon: 'pi pi-plus' } },
      { path: 'clone', component: ShiftClonerComponent, data: { tabLabel: 'Clone Shifts', tabIcon: 'pi pi-copy' } },
      { path: 'coverage', component: ShiftCoverageComponent, data: { tabLabel: 'Shift Coverage', tabIcon: 'pi pi-users' } },
      { path: 'validator', component: ShiftValidatorComponent, data: { tabLabel: 'Shift Validator', tabIcon: 'pi pi-check-circle' } },
      { path: 'calculator', component: ShiftCalculatorComponent, data: { tabLabel: 'Shift Calculator', tabIcon: 'pi pi-percentage' } },
      { path: 'list', component: ShiftListComponent, data: { tabLabel: 'Shift Roster', tabIcon: 'pi pi-calendar' } },
      { path: 'edit/:id', component: ShiftFormComponent, data: { tabLabel: 'Edit Shift', tabIcon: 'pi pi-pencil' } },
      { path: 'details/:id', component: ShiftDetailsComponent, data: { tabLabel: 'Shift Details', tabIcon: 'pi pi-info-circle' } },
      { path: ':id/assignments', component: ShiftAssignmentsComponent, data: { tabLabel: 'Assignments', tabIcon: 'pi pi-user-plus' } },
    ]
  },
  {
    path: 'shift-groups',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: ShiftGroupListComponent, data: { tabLabel: 'Shift Groups', tabIcon: 'pi pi-users' } },
      { path: 'create', component: ShiftGroupFormComponent, data: { tabLabel: 'Manage Groups', tabIcon: 'pi pi-plus' } },
      { path: 'edit/:id', component: ShiftGroupFormComponent, data: { tabLabel: 'Edit Group', tabIcon: 'pi pi-pencil' } },
      { path: ':id/assignments', component: ShiftGroupAssignmentsComponent, data: { tabLabel: 'Group Staff', tabIcon: 'pi pi-user-plus' } },
    ]
  },
  {
    path: 'leave',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'hub', pathMatch: 'full' },
      { path: 'hub', component: LeaveHubComponent, data: { tabLabel: 'Leave Center', tabIcon: 'pi pi-calendar-minus' } },
      { path: 'admin', component: LeaveAdminHubComponent, data: { tabLabel: 'Leave Admin', tabIcon: 'pi pi-shield' } },
      { path: 'apply', component: LeaveFormComponent, data: { tabLabel: 'Apply Leave', tabIcon: 'pi pi-plus' } },
      { path: 'edit/:id', component: LeaveFormComponent, data: { tabLabel: 'Modify Leave', tabIcon: 'pi pi-pencil' } },
      { path: 'details/:id', component: LeaveDetailsComponent, data: { tabLabel: 'Leave Details', tabIcon: 'pi pi-info-circle' } },
    ]
  },
  {
    path: 'leave-balances',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'admin', pathMatch: 'full' },
      { path: 'admin', component: LeaveBalanceAdminComponent, data: { tabLabel: 'Leave Balances', tabIcon: 'pi pi-wallet' } },
      { path: 'details/:id', component: LeaveBalanceDetailComponent, data: { tabLabel: 'Balance Detail', tabIcon: 'pi pi-info-circle' } },
    ]
  },
  {
    path: 'attendance',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'my-clock', pathMatch: 'full' },
      { path: 'my-clock', component: EmployeeAttendanceComponent, data: { tabLabel: 'My Clock', tabIcon: 'pi pi-clock' } },
      { path: 'admin', component: AdminAttendanceComponent, data: { tabLabel: 'Attendance Admin', tabIcon: 'pi pi-shield' } },
      { path: 'live-feed', component: LiveAttendanceFeedComponent, data: { tabLabel: 'Live Feeds', tabIcon: 'pi pi-bolt' } },
      { path: 'user/:id', component: UserAttendanceDetailsComponent, data: { tabLabel: 'Staff Log', tabIcon: 'pi pi-history' } },
    ]
  },
  {
    path: 'daily-attendance',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'my-timesheet', pathMatch: 'full' },
      { path: 'my-timesheet', component: MyDailyAttendanceComponent, data: { tabLabel: 'My Timesheet', tabIcon: 'pi pi-file' } },
      { path: 'admin', component: AdminDailyAttendanceComponent, data: { tabLabel: 'Admin Timesheet', tabIcon: 'pi pi-shield' } },
      { path: 'reports', component: AttendanceReportsComponent, data: { tabLabel: 'HR Reports', tabIcon: 'pi pi-chart-bar' } }
    ]
  },
  {
    path: 'geofence',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'hub', pathMatch: 'full' },
      { path: 'hub', component: GeofenceHubComponent, data: { tabLabel: 'Geofencing', tabIcon: 'pi pi-map-marker' } },
      { path: 'new', component: GeofenceFormComponent, data: { tabLabel: 'New Fence', tabIcon: 'pi pi-plus' } },
      { path: 'edit/:id', component: GeofenceFormComponent, data: { tabLabel: 'Edit Fence', tabIcon: 'pi pi-pencil' } },
      { path: 'details/:id', component: GeofenceDetailsComponent, data: { tabLabel: 'Fence Details', tabIcon: 'pi pi-info-circle' } },
    ]
  },
  {
    path: 'attendance/machines',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'hub', pathMatch: 'full' },
      { path: 'hub', component: MachineHubComponent, data: { tabLabel: 'Biometrics', tabIcon: 'pi pi-id-card' } },
      { path: 'new', component: MachineFormComponent, data: { tabLabel: 'Add Device', tabIcon: 'pi pi-plus' } },
      { path: 'edit/:id', component: MachineFormComponent, data: { tabLabel: 'Edit Device', tabIcon: 'pi pi-pencil' } },
      { path: 'details/:id', component: MachineDetailsComponent, data: { tabLabel: 'Device Details', tabIcon: 'pi pi-info-circle' } },
      { path: ':id/logs', component: MachineLogsComponent, data: { tabLabel: 'Raw Logs', tabIcon: 'pi pi-list' } },
      { path: 'analytics', component: MachineAnalyticsComponent, data: { tabLabel: 'Device Stats', tabIcon: 'pi pi-chart-line' } },
    ]
  },
  {
    path: 'holidays',
    canActivateChild: [TabRouterGuard],
    children: [
      { path: '', redirectTo: 'hub', pathMatch: 'full' },
      { path: 'hub', component: HolidayHubComponent, data: { tabLabel: 'Holiday Calendar', tabIcon: 'pi pi-calendar' } },
      { path: 'new', component: HolidayFormComponent, data: { tabLabel: 'Add Holiday', tabIcon: 'pi pi-plus' } },
      { path: 'edit/:id', component: HolidayFormComponent, data: { tabLabel: 'Edit Holiday', tabIcon: 'pi pi-pencil' } }
    ]
  }
];
