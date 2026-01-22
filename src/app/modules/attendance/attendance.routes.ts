import { AttendancePunchingComponent } from './attendance-punching.component/attendance-punching.component';
// attendance.routes.ts
import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // =======================
  // DASHBOARD
  // =======================
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./attendence-system/attendance-dashboard.component')
        .then(m => m.AttendanceDashboardComponent),
    title: 'Attendance Dashboard'
  },

  // =======================
  // MANAGER
  // =======================
  {
    path: 'manager',
    loadComponent: () =>
      import('./attendance-manager.component/attendance-manager.component')
        .then(m => m.AttendanceManagerComponent),
    title: 'Attendance Management'
  },

  // =======================
  // REPORTS
  // =======================
  {
    path: 'reports',
    loadComponent: () =>
      import('./attendance-reports.component/attendance-reports.component')
        .then(m => m.AttendanceReportsComponent),
    title: 'Attendance Reports'
  },

  // =======================
  // SHIFTS
  // =======================
  {
    path: 'shifts',
    loadComponent: () =>
      import('./shift-manager.component/shift-manager.component')
        .then(m => m.ShiftManagerComponent),
    title: 'Shift Management'
  },

  // =======================
  // HOLIDAYS
  // =======================
  {
    path: 'holidays',
    loadComponent: () =>
      import('./holiday-manager.component/holiday-manager.component')
        .then(m => m.HolidayManagerComponent),
    title: 'Holiday Management'
  },
  {
    path: 'punching',
    loadComponent: () =>
      import('./attendance-punching.component/attendance-punching.component')
        .then(m => m.AttendancePunchingComponent),
    title: 'Holiday Management'
  },

  // =======================
  // MY REQUESTS
  // =======================
  {
    path: 'my-requests',
    loadComponent: () =>
      import('./my-requests.component/my-requests.component')
        .then(m => m.MyRequestsComponent),
    title: 'My Requests'
  }
];
