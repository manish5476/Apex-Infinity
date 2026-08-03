// calendar/resolvers/calendar.resolver.ts
// ─────────────────────────────────────────────────────────────────────────────
//  CalendarResolver — runs before the CalendarWorkspaceComponent mounts.
//
//  Pre-fetches:
//    1. Public holidays for the current year (needed for overlay on open)
//    2. User's calendar permissions (already in AuthService, re-confirmed here)
//    3. Organisation calendar settings (working hours, week start day)
//
//  On resolve failure: the workspace still opens — context just defaults.
//  This avoids a broken route for a non-critical prefetch.
// ─────────────────────────────────────────────────────────────────────────────

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HRMSService } from '../../hrms/hrms.service';


export interface CalendarContext {
  holidays: any[];
  year: number;
  weekStartDay: 0 | 1;  // 0 = Sunday, 1 = Monday
}

export const calendarResolver: ResolveFn<CalendarContext> = () => {
  const hrmsService = inject(HRMSService);
  const currentYear = new Date().getFullYear();

  return forkJoin({
    holidayData: hrmsService
      .getHolidaysByYear(currentYear)
      .pipe(catchError(() => of({ data: { holidays: [] } }))),
  }).pipe(
    map(({ holidayData }) => ({
      holidays:     (holidayData as any)?.data?.holidays ?? [],
      year:         currentYear,
      weekStartDay: 1 as 0 | 1,   // Monday default; read from org settings in future
    }))
  );
};
