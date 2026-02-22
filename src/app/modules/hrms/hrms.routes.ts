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


export const HRMS_ROUTES: Routes = [
  {
    path: 'department',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'hub', component: DepartmentHubComponent },
      { path: 'list', component: DepartmentListComponent },
      { path: 'new', component: DepartmentFormComponent },
      { path: 'heirachy', component: DepartmentHeirachy },
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
      { path: 'hub', component: LeaveHubComponent },
      { path: 'admin', component: LeaveAdminHubComponent },
      { path: 'apply', component: LeaveFormComponent },
      { path: 'edit/:id', component: LeaveFormComponent },
      { path: 'details/:id', component: LeaveDetailsComponent },
    ]
  },
  {
    path: 'leave-balances',
    children: [
      { path: '', redirectTo: 'admin', pathMatch: 'full' },
      { path: 'admin', component: LeaveBalanceAdminComponent },
      { path: 'details/:id', component: LeaveBalanceDetailComponent },
    ]
  },
  {
    path: 'attendance',
    children: [
      { path: '', redirectTo: 'my-clock', pathMatch: 'full' },
      { path: 'my-clock', component: EmployeeAttendanceComponent },
      { path: 'admin', component: AdminAttendanceComponent },
      { path: 'live-feed', component: LiveAttendanceFeedComponent },
      { path: 'user/:id', component: UserAttendanceDetailsComponent },
    ]
  },
  {
    path: 'daily-attendance',
    children: [
      { path: '', redirectTo: 'my-timesheet', pathMatch: 'full' },
      { path: 'my-timesheet', component: MyDailyAttendanceComponent },
      { path: 'admin', component: AdminDailyAttendanceComponent },
      { path: 'reports', component: AttendanceReportsComponent }
    ]
  },
  {
    path: 'geofence',
    children: [
      { path: '', redirectTo: 'hub', pathMatch: 'full' },
      { path: 'hub', component: GeofenceHubComponent },
      { path: 'new', component: GeofenceFormComponent },
      { path: 'edit/:id', component: GeofenceFormComponent },
      { path: 'details/:id', component: GeofenceDetailsComponent },
    ]
  },
  {
    // 👇 FIXED: This is now 'attendance/machines' to match your URLs
    path: 'attendance/machines',
    children: [
      { path: '', redirectTo: 'hub', pathMatch: 'full' },
      { path: 'hub', component: MachineHubComponent },
      { path: 'new', component: MachineFormComponent },
      { path: 'edit/:id', component: MachineFormComponent },
      { path: 'details/:id', component: MachineDetailsComponent },
      { path: 'logs', component: MachineLogsComponent },
      { path: 'analytics', component: MachineAnalyticsComponent },
    ]
  },
  {
    path: 'holidays',
    children: [
      { path: '', redirectTo: 'hub', pathMatch: 'full' },
      { path: 'hub', component: HolidayHubComponent },
      { path: 'new', component: HolidayFormComponent },
      { path: 'edit/:id', component: HolidayFormComponent }
    ]
  }
];