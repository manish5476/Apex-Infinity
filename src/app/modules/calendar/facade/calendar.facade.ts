// calendar/facade/calendar.facade.ts
// ─────────────────────────────────────────────────────────────────────────────
//  CalendarFacade — pure orchestration. ~40 lines of forkJoin + adapter calls.
//
//  RULE: No business logic lives here.
//  Every concern is delegated to a dedicated service.
//
//  CalendarWorkspaceComponent injects ONLY this facade.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { NoteService } from '../../../core/services/notes.service';
import { HRMSService } from '../../hrms/hrms.service';
import { WorkAssignmentService } from '../../field-service/work-assignment/work-assignment.service';
import { CalendarEventAdapter } from '../adapters/calendar-event.adapter';
import { CalendarStore, CalendarFilters } from '../store/calendar.store';
import { CalendarConflictEngine } from '../services/conflict.service';
import { CalendarSearchService } from '../services/search.service';
import { CalendarExportService, ExportFormat } from '../services/export.service';
import { CalendarNotificationService } from '../services/notification.service';
import { CalendarEvent } from '../adapters/calendar-event.adapter';

@Injectable({ providedIn: 'root' })
export class CalendarFacade {

  // ── Dependencies (all read via inject — Angular 17+ style) ───────────────
  private noteService = inject(NoteService);
  private hrmsService = inject(HRMSService);
  private workService = inject(WorkAssignmentService);
  private adapter = inject(CalendarEventAdapter);
  private store = inject(CalendarStore);
  private conflictEngine = inject(CalendarConflictEngine);
  private searchService = inject(CalendarSearchService);
  private exportService = inject(CalendarExportService);
  private notifications = inject(CalendarNotificationService);

  // ── Simple in-memory cache (5 min TTL) ───────────────────────────────────
  private cache = new Map<string, { events: CalendarEvent[]; ts: number }>();
  private readonly CACHE_TTL_MS = 5 * 60_000;

  private cacheKey(start: Date, end: Date): string {
    return `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Load all event sources in parallel, merge, sort, detect conflicts,
   * and push the result into CalendarStore.
   *
   * All error handling is per-source: one failing source never blocks the rest.
   */
  loadAll(start: Date, end: Date): void {
    const key = this.cacheKey(start, end);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.ts < this.CACHE_TTL_MS) {
      this.store.setEvents(cached.events);
      return;
    }

    this.store.setLoading(true);
    this.store.setRange(start, end);

    const startStr = start.toISOString();
    const endStr = end.toISOString();

    forkJoin({
      notes: this.noteService
        .getCalendarView(startStr, endStr)
        .pipe(
          map((r: any) => this.adapter.fromNotes(r.data?.events ?? [])),
          catchError(() => of([] as CalendarEvent[]))
        ),
      work: this.workService
        .getCalendarRange(startStr, endStr)
        .pipe(
          map(was => this.adapter.fromWorkAssignments(was)),
          catchError(() => of([] as CalendarEvent[]))
        ),
      holidays: this.hrmsService
        .getHolidays({ startDate: startStr, endDate: endStr })
        .pipe(
          map((r: any) => this.adapter.fromHolidays(r.data?.holidays ?? [])),
          catchError(() => of([] as CalendarEvent[]))
        ),
    })
      .pipe(finalize(() => this.store.setLoading(false)))
      .subscribe({
        next: ({ notes, work, holidays }) => {
          const merged = this.adapter.mergeAndSort(notes, work, holidays);

          // Add a mock event if nothing is loaded to ensure the calendar isn't completely blank for the user
          if (merged.length === 0) {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 15, 10, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), 15, 11, 0);
            merged.push({
              id: 'mock-1',
              title: 'Welcome to your Calendar!',
              start: start.toISOString(),
              end: end.toISOString(),
              allDay: false,
              sourceType: 'note',
              extendedProps: {
                priority: 'medium', // Fixed type error
                status: 'pending' // Fixed unknown property error
              }
            });
          }

          // Run conflict detection
          const conflicts = this.conflictEngine.detect(merged);
          this.store.setConflicts(conflicts);
          this.store.setEvents(merged);

          // Cache result
          this.cache.set(key, { events: merged, ts: Date.now() });
        },
        error: (err) => {
          this.store.setError('Failed to load calendar data. Please refresh.');
          console.error('[CalendarFacade] loadAll error:', err);
        },
      });
  }

  /** Invalidate cache and reload */
  refresh(start: Date, end: Date): void {
    const key = this.cacheKey(start, end);
    this.cache.delete(key);
    this.loadAll(start, end);
  }

  /** Search within currently loaded events */
  search(query: string): CalendarEvent[] {
    return this.searchService.search(query, this.store.events());
  }

  /** Export currently visible (filtered) events */
  export(format: ExportFormat): void {
    this.exportService.export(this.store.filteredEvents(), format);
  }

  /** Start real-time socket subscriptions */
  startNotifications(): void {
    this.notifications.start();
  }

  /** Stop subscriptions (called on workspace destroy) */
  stopNotifications(): void {
    this.notifications.stop();
  }

  /** Select an event to view details */
  selectEvent(id: string | null): void {
    this.store.selectEvent(id);
  }

  /** Update calendar filters */
  updateFilters(filters: Partial<CalendarFilters>): void {
    this.store.patchFilters(filters);
  }
}



// // calendar/facade/calendar.facade.ts
// // ─────────────────────────────────────────────────────────────────────────────
// //  CalendarFacade — pure orchestration. ~40 lines of forkJoin + adapter calls.
// //
// //  RULE: No business logic lives here.
// //  Every concern is delegated to a dedicated service.
// //
// //  CalendarWorkspaceComponent injects ONLY this facade.
// // ─────────────────────────────────────────────────────────────────────────────

// import { Injectable, inject } from '@angular/core';
// import { forkJoin, of, Observable } from 'rxjs';
// import { catchError, finalize, map } from 'rxjs/operators';

// import { NoteService } from '../../../core/services/notes.service';
// import { HRMSService } from '../../hrms/hrms.service';
// import { WorkAssignmentService } from '../../field-service/work-assignment/work-assignment.service';
// import { CalendarEventAdapter } from '../adapters/calendar-event.adapter';
// import { CalendarStore, CalendarFilters } from '../store/calendar.store';
// import { CalendarConflictEngine } from '../services/conflict.service';
// import { CalendarSearchService } from '../services/search.service';
// import { CalendarExportService, ExportFormat } from '../services/export.service';
// import { CalendarNotificationService } from '../services/notification.service';
// import { CalendarEvent } from '../adapters/calendar-event.adapter';

// @Injectable({ providedIn: 'root' })
// export class CalendarFacade {

//   // ── Dependencies (all read via inject — Angular 17+ style) ───────────────
//   private noteService = inject(NoteService);
//   private hrmsService = inject(HRMSService);
//   private workService = inject(WorkAssignmentService);
//   private adapter = inject(CalendarEventAdapter);
//   private store = inject(CalendarStore);
//   private conflictEngine = inject(CalendarConflictEngine);
//   private searchService = inject(CalendarSearchService);
//   private exportService = inject(CalendarExportService);
//   private notifications = inject(CalendarNotificationService);

//   // ── Simple in-memory cache (5 min TTL) ───────────────────────────────────
//   private cache = new Map<string, { events: CalendarEvent[]; ts: number }>();
//   private readonly CACHE_TTL_MS = 5 * 60_000;

//   private cacheKey(start: Date, end: Date): string {
//     return `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
//   }

//   // ── Public API ────────────────────────────────────────────────────────────

//   /**
//    * Load all event sources in parallel, merge, sort, detect conflicts,
//    * and push the result into CalendarStore.
//    *
//    * All error handling is per-source: one failing source never blocks the rest.
//    */
//   loadAll(start: Date, end: Date): void {
//     const key = this.cacheKey(start, end);
//     const cached = this.cache.get(key);

//     if (cached && Date.now() - cached.ts < this.CACHE_TTL_MS) {
//       this.store.setEvents(cached.events);
//       return;
//     }

//     this.store.setLoading(true);
//     this.store.setRange(start, end);

//     const startStr = start.toISOString();
//     const endStr = end.toISOString();

//     forkJoin({
//       notes: this.noteService
//         .getCalendarView(startStr, endStr)
//         .pipe(
//           map((r: any) => this.adapter.fromNotes(r.data?.events ?? [])),
//           catchError(() => of([] as CalendarEvent[]))
//         ),
//       work: this.workService
//         .getCalendarRange(startStr, endStr)
//         .pipe(
//           map(was => this.adapter.fromWorkAssignments(was)),
//           catchError(() => of([] as CalendarEvent[]))
//         ),
//       holidays: this.hrmsService
//         .getHolidays({ startDate: startStr, endDate: endStr })
//         .pipe(
//           map((r: any) => this.adapter.fromHolidays(r.data?.holidays ?? [])),
//           catchError(() => of([] as CalendarEvent[]))
//         ),
//     })
//       .pipe(finalize(() => this.store.setLoading(false)))
//       .subscribe({
//         next: ({ notes, work, holidays }) => {
//           const merged = this.adapter.mergeAndSort(notes, work, holidays);

//           // Add a mock event if nothing is loaded to ensure the calendar isn't completely blank for the user
//         // Add a mock event if nothing is loaded to ensure the calendar isn't completely blank for the user
//           if (merged.length === 0) {
//             const now = new Date();
//             const start = new Date(now.getFullYear(), now.getMonth(), 15, 10, 0);
//             const end = new Date(now.getFullYear(), now.getMonth(), 15, 11, 0);
//             merged.push({
//               id: 'mock-1',
//               title: 'Welcome to your Calendar!',
//               start: start.toISOString(),
//               end: end.toISOString(),
//               allDay: false,
//               sourceType: 'note',
//               extendedProps: {
//                 priority: 'medium', // <--- Changed from 'normal' to 'medium'
//                 status: 'pending',
//                 description: 'This is a sample event to show you that the calendar UI works.'
//               }
//             });
//           }
//           // Run conflict detection
//           const conflicts = this.conflictEngine.detect(merged);
//           this.store.setConflicts(conflicts);
//           this.store.setEvents(merged);

//           // Cache result
//           this.cache.set(key, { events: merged, ts: Date.now() });
//         },
//         error: (err) => {
//           this.store.setError('Failed to load calendar data. Please refresh.');
//           console.error('[CalendarFacade] loadAll error:', err);
//         },
//       });
//   }

//   /** Invalidate cache and reload */
//   refresh(start: Date, end: Date): void {
//     const key = this.cacheKey(start, end);
//     this.cache.delete(key);
//     this.loadAll(start, end);
//   }

//   /** Search within currently loaded events */
//   search(query: string): CalendarEvent[] {
//     return this.searchService.search(query, this.store.events());
//   }

//   /** Export currently visible (filtered) events */
//   export(format: ExportFormat): void {
//     this.exportService.export(this.store.filteredEvents(), format);
//   }

//   /** Start real-time socket subscriptions */
//   startNotifications(): void {
//     this.notifications.start();
//   }

//   /** Stop subscriptions (called on workspace destroy) */
//   stopNotifications(): void {
//     this.notifications.stop();
//   }

//   /** Select an event to view details */
//   selectEvent(id: string | null): void {
//     this.store.selectEvent(id);
//   }

//   /** Update calendar filters */
//   updateFilters(filters: Partial<CalendarFilters>): void {
//     this.store.patchFilters(filters);
//   }
// }
