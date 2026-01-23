import { Routes } from '@angular/router';

export const NOTE_ROUTES: Routes = [
  {
    // Make this the default view for '/notes'
    path: '', 
    loadComponent: () => 
      import('./note-list/note-list.component').then(m => m.NoteListComponent),
    title: 'My Workspace'
  },
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
    path: ':id',
    loadComponent: () => 
      import('./note-detail/note-detail.component').then(m => m.NoteDetailComponent),
    title: 'Note Details'
  },
];