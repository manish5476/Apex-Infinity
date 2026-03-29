import { Meeting } from './../../core/models/note.types';
import { Routes } from '@angular/router';
import { AnalyticsDashboardComponent } from './analytics/analytics-dashboard.component';
import { AdminNoteListComponent } from './admin/admin-note-list.component';
import { authGuard } from '@core/auth/guards/auth.guard';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

export const NOTE_ROUTES: Routes = [
  {
    // Make this the default view for '/notes'
    path: '',
    loadComponent: () =>
      import('./note-list/note-list.component').then(m => m.NoteListComponent),
    title: 'My Workspace',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.NOTE.READ] }
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permissions: [PERMISSIONS.NOTE.VIEW_ANALYTICS] }
  },
  // NEW: Admin Route (You might want to add an AdminGuard here)
  {
    path: 'admin/notes',
    component: AdminNoteListComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permissions: [PERMISSIONS.NOTE.MANAGE_SHARED] }
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./note-create/note-create.component').then(m => m.NoteCreateComponent),
    title: 'New Note',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.NOTE.WRITE] }
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./calendar-view/calendar-view.component').then(m => m.CalendarViewComponent),
    title: 'Calendar',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.NOTE.VIEW_CALENDAR] }
  },
  {
    path: 'Meeting',
    loadComponent: () =>
      import('./meeting-list/meeting-list.component').then(m => m.MeetingListComponent),
    title: 'Calendar',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.MEETING.READ] }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./note-detail/note-detail.component').then(m => m.NoteDetailComponent),
    title: 'Note Details',
    canActivate: [permissionGuard],
    data: { permissions: [PERMISSIONS.NOTE.READ] }
  },
];