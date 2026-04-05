import { Meeting } from './../../core/models/note.types';
import { Routes } from '@angular/router';
import { AnalyticsDashboardComponent } from './analytics/analytics-dashboard.component';
import { AdminNoteListComponent } from './admin/admin-note-list.component';
import { authGuard } from '@core/auth/guards/auth.guard';
import { permissionGuard } from '@core/auth/guards/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { TabRouterGuard } from '../../Tabbing';

export const NOTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./note-list/note-list.component').then(m => m.NoteListComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'My Workspace', tabIcon: 'pi pi-book', permissions: [PERMISSIONS.NOTE.READ] }
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
    canActivate: [TabRouterGuard, authGuard, permissionGuard],
    data: { tabLabel: 'Note Analytics', tabIcon: 'pi pi-chart-bar', permissions: [PERMISSIONS.NOTE.VIEW_ANALYTICS] }
  },
  {
    path: 'admin/notes',
    component: AdminNoteListComponent,
    canActivate: [TabRouterGuard, authGuard, permissionGuard],
    data: { tabLabel: 'Admin Notes', tabIcon: 'pi pi-shield', permissions: [PERMISSIONS.NOTE.MANAGE_SHARED] }
  },
  {
    path: 'create',
    loadComponent: () => import('./note-create/note-create.component').then(m => m.NoteCreateComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'New Note', tabIcon: 'pi pi-plus', permissions: [PERMISSIONS.NOTE.WRITE] }
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar-view/calendar-view.component').then(m => m.CalendarViewComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Calendar', tabIcon: 'pi pi-calendar', permissions: [PERMISSIONS.NOTE.VIEW_CALENDAR] }
  },
  {
    path: 'Meeting',
    loadComponent: () => import('./meeting-list/meeting-list.component').then(m => m.MeetingListComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Meetings', tabIcon: 'pi pi-video', permissions: [PERMISSIONS.MEETING.READ] }
  },
  {
    path: ':id',
    loadComponent: () => import('./note-detail/note-detail.component').then(m => m.NoteDetailComponent),
    canActivate: [TabRouterGuard, permissionGuard],
    data: { tabLabel: 'Note Details', tabIcon: 'pi pi-file-edit', permissions: [PERMISSIONS.NOTE.READ] }
  },
];