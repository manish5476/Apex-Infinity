import { Meeting } from './../../core/models/note.types';
import { Routes } from '@angular/router';
import { AnalyticsDashboardComponent } from './analytics/analytics-dashboard.component';
import { authGuard } from '../../core/guards/authguard.guard';
import { AdminNoteListComponent } from './admin/admin-note-list.component';

export const NOTE_ROUTES: Routes = [
  {
    // Make this the default view for '/notes'
    path: '',
    loadComponent: () =>
      import('./note-list/note-list.component').then(m => m.NoteListComponent),
    title: 'My Workspace'
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
    canActivate: [authGuard]
  },
  // NEW: Admin Route (You might want to add an AdminGuard here)
  {
    path: 'admin/notes',
    component: AdminNoteListComponent,
    canActivate: [authGuard]
  }
  ,
  {
    path: 'create',
    loadComponent: () =>
      import('./note-create/note-create.component').then(m => m.NoteCreateComponent),
    title: 'New Note'
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./calendar-view/calendar-view.component').then(m => m.CalendarViewComponent),
    title: 'Calendar'
  },
  {
    path: 'Meeting',
    loadComponent: () =>
      import('./meeting-list/meeting-list.component').then(m => m.MeetingListComponent),
    title: 'Calendar'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./note-detail/note-detail.component').then(m => m.NoteDetailComponent),
    title: 'Note Details'
  },
];