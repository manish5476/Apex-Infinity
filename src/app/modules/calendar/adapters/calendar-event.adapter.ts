// calendar/adapters/calendar-event.adapter.ts
// ─────────────────────────────────────────────────────────────────────────────
//  CalendarEventAdapter — single normalisation layer.
//
//  FullCalendar (and any future calendar renderer) NEVER sees raw backend
//  models. Everything flows through this adapter into a unified CalendarEvent.
//
//  Source types handled:
//    - Meeting         (from NoteService)
//    - Note / Task     (from NoteService)
//    - WorkAssignment  (from WorkAssignmentService / field-service API)
//    - Holiday         (from HrmsService)
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';

// ── Canonical event shape ─────────────────────────────────────────────────────

export type CalendarEventSourceType =
  | 'meeting'
  | 'note'
  | 'task'
  | 'work_assignment'
  | 'holiday';

export interface CalendarEventSla {
  completionDeadline: string;   // ISO
  breached: boolean;
  breachType?: 'response' | 'arrival' | 'completion';
}

export interface CalendarEventAi {
  estimatedDuration?: number;   // minutes
  completionRate?: number;      // 0–100
}

export interface CalendarEventExtended {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  assignees?: string[];         // user IDs
  requiredSkills?: string[];
  isRecurring?: boolean;
  seriesId?: string;
  sla?: CalendarEventSla;
  ai?: CalendarEventAi;
  customerId?: string;
  location?: { address?: string; lat?: number; lng?: number };
}

export interface CalendarEvent {
  /** Namespaced: 'meeting_<id>' | 'note_<id>' | 'work_<id>' | 'holiday_<id>' */
  id: string;
  title: string;
  start: string;   // ISO
  end: string;     // ISO
  allDay: boolean;
  /** Design-system CSS variable token e.g. 'var(--color-info)' */
  color: string;
  sourceType: CalendarEventSourceType;
  /** Original backend _id */
  sourceId: string;
  extendedProps: CalendarEventExtended;
}

// ── Color palette (maps source type → design token) ──────────────────────────

const SOURCE_COLORS: Record<CalendarEventSourceType, string> = {
  meeting:         'var(--color-info)',
  note:            'var(--color-neutral)',
  task:            'var(--color-warning)',
  work_assignment: 'var(--color-primary)',
  holiday:         'var(--color-success)',
};

const PRIORITY_COLORS: Record<'urgent' | 'high' | 'medium' | 'low', string> = {
  urgent: 'var(--color-error)',
  high:   'var(--color-warning)',
  medium: 'var(--color-primary)',
  low:    'var(--color-neutral)',
};

@Injectable({ providedIn: 'root' })
export class CalendarEventAdapter {

  // ── Meeting ───────────────────────────────────────────────────────────────

  fromMeeting(meeting: any): CalendarEvent {
    const start = meeting.startTime ?? meeting.scheduledAt;
    const durationMs = (meeting.durationMinutes ?? 60) * 60_000;
    const end = meeting.endTime ?? new Date(new Date(start).getTime() + durationMs).toISOString();

    return {
      id:          `meeting_${meeting._id}`,
      title:       meeting.title,
      start,
      end,
      allDay:      false,
      color:       SOURCE_COLORS.meeting,
      sourceType:  'meeting',
      sourceId:    meeting._id,
      extendedProps: {
        status:    meeting.status,
        assignees: meeting.participants?.map((p: any) => p.user ?? p.externalEmail),
      },
    };
  }

  // ── Note / Task ───────────────────────────────────────────────────────────

  fromNote(note: any): CalendarEvent {
    const isTask     = note.itemType === 'task';
    const sourceType = isTask ? 'task' : 'note';
    const start      = note.dueDate ?? note.reminderAt ?? note.createdAt;
    const end        = note.dueDate ?? start;

    return {
      id:         `note_${note._id}`,
      title:      note.title,
      start,
      end,
      allDay:     !note.dueDate || note.itemType === 'note',
      color:      SOURCE_COLORS[sourceType],
      sourceType,
      sourceId:   note._id,
      extendedProps: {
        priority: note.priority,
        status:   note.status,
      },
    };
  }

  // ── WorkAssignment ────────────────────────────────────────────────────────

  fromWorkAssignment(wa: any): CalendarEvent {
    const start = wa.scheduledAt;
    const durationMs = (wa.estimatedDurationMins ?? 60) * 60_000;
    const end   = new Date(new Date(start).getTime() + durationMs).toISOString();

    // Urgent assignments use the priority colour override
    const color = wa.priority === 'urgent'
      ? PRIORITY_COLORS.urgent
      : SOURCE_COLORS.work_assignment;

    return {
      id:         `work_${wa._id}`,
      title:      wa.title,
      start,
      end,
      allDay:     false,
      color,
      sourceType: 'work_assignment',
      sourceId:   wa._id,
      extendedProps: {
        priority:       wa.priority,
        status:         wa.status,
        assignees:      wa.assignedTo?.map((u: any) => u._id ?? u),
        requiredSkills: wa.requiredSkills?.map((s: any) => s.name ?? s),
        isRecurring:    !!wa.seriesId,
        seriesId:       wa.seriesId,
        location:       wa.location,
        customerId:     wa.customerId?._id ?? wa.customerId,
        sla: wa.sla?.completionDeadline ? {
          completionDeadline: wa.sla.completionDeadline,
          breached:           wa.sla.breached ?? false,
          breachType:         wa.sla.breachType,
        } : undefined,
        ai: wa.ai ? {
          estimatedDuration: wa.ai.estimatedDuration,
          completionRate:    wa.ai.completionRate,
        } : undefined,
      },
    };
  }

  // ── Holiday ───────────────────────────────────────────────────────────────

  fromHoliday(holiday: any): CalendarEvent {
    return {
      id:         `holiday_${holiday._id}`,
      title:      holiday.name,
      start:      holiday.date,
      end:        holiday.date,
      allDay:     true,
      color:      SOURCE_COLORS.holiday,
      sourceType: 'holiday',
      sourceId:   holiday._id,
      extendedProps: {},
    };
  }

  // ── Batch helpers ─────────────────────────────────────────────────────────

  fromMeetings(meetings: any[]): CalendarEvent[] {
    return meetings.map(m => this.fromMeeting(m));
  }

  fromNotes(notes: any[]): CalendarEvent[] {
    return notes.map(n => this.fromNote(n));
  }

  fromWorkAssignments(was: any[]): CalendarEvent[] {
    return was.map(w => this.fromWorkAssignment(w));
  }

  fromHolidays(holidays: any[]): CalendarEvent[] {
    return holidays.map(h => this.fromHoliday(h));
  }

  /**
   * Merge all event arrays, deduplicate by id, and sort by start date.
   */
  mergeAndSort(...eventArrays: CalendarEvent[][]): CalendarEvent[] {
    const flat = eventArrays.flat();
    const seen = new Set<string>();
    return flat
      .filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }
}
