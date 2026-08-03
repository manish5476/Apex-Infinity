// calendar/store/calendar.store.ts
// ─────────────────────────────────────────────────────────────────────────────
//  CalendarStore — NGRX SignalStore.
//  Single source of truth for all calendar UI state.
//  Components read from this. CalendarFacade writes to this.
// ─────────────────────────────────────────────────────────────────────────────

import { computed, Injectable } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { CalendarEvent } from '../adapters/calendar-event.adapter';

// ── Conflict model ────────────────────────────────────────────────────────────

export type ConflictType = 'employee' | 'room' | 'vehicle' | 'equipment' | 'sla';

export interface ConflictGroup {
  type: ConflictType;
  resourceId: string;
  events: CalendarEvent[];
  severity: 'warning' | 'error';
}

// ── Calendar view types ───────────────────────────────────────────────────────

export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'resourceTimeline';

// ── Filters ───────────────────────────────────────────────────────────────────

export interface CalendarFilters {
  sourceTypes: string[];     // empty = show all
  priorities: string[];
  statuses: string[];
  assigneeIds: string[];
  showHolidays: boolean;
}

// ── Undo/Redo action ──────────────────────────────────────────────────────────

export interface CalendarAction {
  type: 'create' | 'update' | 'delete' | 'status_change';
  sourceType: string;
  sourceId: string;
  previousData: Partial<CalendarEvent>;
  timestamp: number;
}

// ── State shape ───────────────────────────────────────────────────────────────

export interface CalendarState {
  events: CalendarEvent[];
  view: CalendarView;
  rangeStart: Date;
  rangeEnd: Date;
  selectedEventId: string | null;
  filters: CalendarFilters;
  conflicts: ConflictGroup[];
  isLoading: boolean;
  error: string | null;
  // Undo / redo stacks (max 20 actions each)
  undoStack: CalendarAction[];
  redoStack: CalendarAction[];
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialRange = (() => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
})();

const initialState: CalendarState = {
  events: [],
  view: 'month',
  rangeStart: initialRange.start,
  rangeEnd: initialRange.end,
  selectedEventId: null,
  filters: {
    sourceTypes: [],
    priorities: [],
    statuses: [],
    assigneeIds: [],
    showHolidays: true,
  },
  conflicts: [],
  isLoading: false,
  error: null,
  undoStack: [],
  redoStack: [],
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const CalendarStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed((store) => {
    const { events, filters, selectedEventId } = store;
    return {

      /** Events after applying UI filters */
      filteredEvents: computed(() => {
        const f = filters();
        let result = events();

        if (!f.showHolidays) {
          result = result.filter((e: any) => e.sourceType !== 'holiday');
        }
        if (f.sourceTypes.length) {
          result = result.filter((e: any) => f.sourceTypes.includes(e.sourceType));
        }
        if (f.priorities.length) {
          result = result.filter((e: any) =>
            !e.extendedProps.priority || f.priorities.includes(e.extendedProps.priority)
          );
        }
        if (f.statuses.length) {
          result = result.filter((e: any) =>
            !e.extendedProps.status || f.statuses.includes(e.extendedProps.status)
          );
        }
        if (f.assigneeIds.length) {
          result = result.filter((e: any) =>
            e.extendedProps.assignees?.some((a: any) => f.assigneeIds.includes(a))
          );
        }

        return result;
      }),

      /** Events with active SLA breach */
      slaBreachedEvents: computed(() =>
        events().filter((e: any) => e.extendedProps.sla?.breached)
      ),

      /** Currently selected event */
      selectedEvent: computed(() =>
        events().find((e: any) => e.id === selectedEventId())
      ),

      /** Count of unresolved conflicts */
      conflictCount: computed(() =>
        filters().sourceTypes.length   // placeholder: delegate to ConflictEngine
      ),
    };
  }),

  withMethods((store: any) => ({

    // ── Bulk event replacement (after facade.loadAll) ─────────────────────

    setEvents(events: CalendarEvent[]): void {
      patchState(store, { events });
    },

    // ── Patch a single event in-place (from socket updates) ──────────────

    patchEvent(updated: CalendarEvent): void {
      patchState(store, (state: any) => ({
        events: state.events.map((e: any) => e.id === updated.id ? updated : e),
      }));
    },

    // ── Append new events (without full reload) ───────────────────────────

    appendEvents(newEvents: CalendarEvent[]): void {
      patchState(store, (state: any) => {
        const existingIds = new Set(state.events.map((e: any) => e.id));
        const additions = newEvents.filter((e: any) => !existingIds.has(e.id));
        return { events: [...state.events, ...additions] };
      });
    },

    // ── Remove a single event (after delete/cancel) ───────────────────────

    removeEvent(id: string): void {
      patchState(store, (state: any) => ({
        events: state.events.filter((e: any) => e.id !== id),
      }));
    },

    // ── View + range ──────────────────────────────────────────────────────

    setView(view: CalendarView): void {
      patchState(store, { view });
    },

    setRange(start: Date, end: Date): void {
      patchState(store, { rangeStart: start, rangeEnd: end });
    },

    // ── Selection ─────────────────────────────────────────────────────────

    selectEvent(id: string | null): void {
      patchState(store, { selectedEventId: id });
    },

    // ── Filters ───────────────────────────────────────────────────────────

    patchFilters(partial: Partial<CalendarFilters>): void {
      patchState(store, (state: any) => ({
        filters: { ...state.filters, ...partial },
      }));
    },

    resetFilters(): void {
      patchState(store, { filters: initialState.filters });
    },

    // ── Conflicts ─────────────────────────────────────────────────────────

    setConflicts(conflicts: ConflictGroup[]): void {
      patchState(store, { conflicts });
    },

    // ── Loading / Error ───────────────────────────────────────────────────

    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },

    setError(error: string | null): void {
      patchState(store, { error, isLoading: false });
    },

    // ── Undo / Redo ───────────────────────────────────────────────────────

    pushUndoAction(action: CalendarAction): void {
      patchState(store, (state: any) => ({
        undoStack: [...state.undoStack.slice(-19), action],
        redoStack: [],  // clear redo on new action
      }));
    },

    popUndo(): CalendarAction | undefined {
      let action: CalendarAction | undefined;
      patchState(store, (state: any) => {
        const stack = [...state.undoStack];
        action = stack.pop();
        return { undoStack: stack };
      });
      return action;
    },

    pushRedoAction(action: CalendarAction): void {
      patchState(store, (state: any) => ({
        redoStack: [...state.redoStack.slice(-19), action],
      }));
    },

    popRedo(): CalendarAction | undefined {
      let action: CalendarAction | undefined;
      patchState(store, (state: any) => {
        const stack = [...state.redoStack];
        action = stack.pop();
        return { redoStack: stack };
      });
      return action;
    },
  }))
);
