// calendar/services/conflict.service.ts
// ─────────────────────────────────────────────────────────────────────────────
//  CalendarConflictEngine — detects resource overlaps between calendar events.
//
//  Currently supports:
//    - Employee (assignee) overlap
//  Designed to extend to: room, vehicle, equipment, SLA overlap.
//
//  This is NOT inside CalendarFacade — it is an independent concern with
//  its own interface so it can be swapped (e.g. server-side conflict check).
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { CalendarEvent } from '../adapters/calendar-event.adapter';
import { ConflictGroup, ConflictType } from '../store/calendar.store';

export interface ConflictCheckOptions {
  checkEmployees?: boolean;  // default true
  checkRooms?:     boolean;  // future
  checkVehicles?:  boolean;  // future
  checkEquipment?: boolean;  // future
}

@Injectable({ providedIn: 'root' })
export class CalendarConflictEngine {

  /**
   * Main entry point. Pass the full event array; receive grouped conflicts.
   */
  detect(events: CalendarEvent[], options: ConflictCheckOptions = {}): ConflictGroup[] {
    const opts = { checkEmployees: true, ...options };
    const groups: ConflictGroup[] = [];

    if (opts.checkEmployees) {
      groups.push(...this.detectEmployeeOverlaps(events));
    }

    return groups;
  }

  // ── Employee overlap ──────────────────────────────────────────────────────

  private detectEmployeeOverlaps(events: CalendarEvent[]): ConflictGroup[] {
    // Build a map: employeeId → events they're assigned to
    const employeeEvents = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const assignees = event.extendedProps?.assignees ?? [];
      for (const assigneeId of assignees) {
        if (!employeeEvents.has(assigneeId)) {
          employeeEvents.set(assigneeId, []);
        }
        employeeEvents.get(assigneeId)!.push(event);
      }
    }

    const groups: ConflictGroup[] = [];

    for (const [employeeId, empEvents] of employeeEvents) {
      if (empEvents.length < 2) continue;

      // Find overlapping pairs
      const overlapping = this.findOverlapping(empEvents);
      if (overlapping.length >= 2) {
        // Determine severity: any urgent = error, else warning
        const hasUrgent = overlapping.some(e => e.extendedProps.priority === 'urgent');
        groups.push({
          type:       'employee',
          resourceId: employeeId,
          events:     overlapping,
          severity:   hasUrgent ? 'error' : 'warning',
        });
      }
    }

    return groups;
  }

  // ── Overlap helpers ───────────────────────────────────────────────────────

  private findOverlapping(events: CalendarEvent[]): CalendarEvent[] {
    const result: CalendarEvent[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (this.eventsOverlap(events[i], events[j])) {
          if (!result.includes(events[i])) result.push(events[i]);
          if (!result.includes(events[j])) result.push(events[j]);
        }
      }
    }

    return result;
  }

  private eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
    if (a.allDay || b.allDay) return false; // all-day events don't cause time conflicts
    const aStart = new Date(a.start).getTime();
    const aEnd   = new Date(a.end).getTime();
    const bStart = new Date(b.start).getTime();
    const bEnd   = new Date(b.end).getTime();
    // Two intervals overlap when: aStart < bEnd AND bStart < aEnd
    return aStart < bEnd && bStart < aEnd;
  }

  /**
   * Check if a candidate event would conflict with any existing event for a
   * given employee. Used for drag validation before drop is committed.
   */
  wouldConflict(
    candidate: { start: string; end: string; assignees: string[] },
    existingEvents: CalendarEvent[],
    excludeId?: string
  ): boolean {
    const cStart = new Date(candidate.start).getTime();
    const cEnd   = new Date(candidate.end).getTime();

    return existingEvents.some(e => {
      if (e.id === excludeId) return false;
      if (e.allDay)           return false;
      const sharedAssignee = (e.extendedProps.assignees ?? [])
        .some(a => candidate.assignees.includes(a));
      if (!sharedAssignee) return false;

      const eStart = new Date(e.start).getTime();
      const eEnd   = new Date(e.end).getTime();
      return cStart < eEnd && eStart < cEnd;
    });
  }
}
