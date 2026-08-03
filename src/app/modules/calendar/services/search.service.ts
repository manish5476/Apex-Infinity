// calendar/services/search.service.ts
// ─────────────────────────────────────────────────────────────────────────────
//  CalendarSearchService — client-side fuzzy search with a provider interface.
//
//  The interface is future-ready: swap CalendarSearchProvider for an
//  AI-powered or semantic search backend without touching any component code.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { CalendarEvent } from '../adapters/calendar-event.adapter';

// ── Provider interface (enables swapping to AI / server-side search later) ────

export interface CalendarSearchProvider {
  search(query: string, events: CalendarEvent[]): CalendarEvent[];
}

// ── Default: client-side fuzzy search ────────────────────────────────────────

class ClientFuzzySearchProvider implements CalendarSearchProvider {
  search(query: string, events: CalendarEvent[]): CalendarEvent[] {
    if (!query?.trim()) return events;

    const q = query.toLowerCase().trim();

    return events.filter(event => {
      // Search title
      if (event.title.toLowerCase().includes(q)) return true;
      // Search status
      if (event.extendedProps.status?.toLowerCase().includes(q)) return true;
      // Search location address
      if (event.extendedProps.location?.address?.toLowerCase().includes(q)) return true;
      // Search priority
      if (event.extendedProps.priority?.toLowerCase().includes(q)) return true;
      return false;
    });
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CalendarSearchService {
  private provider: CalendarSearchProvider = new ClientFuzzySearchProvider();

  /**
   * Swap the search provider at runtime (e.g. after AI feature flag is enabled).
   */
  setProvider(provider: CalendarSearchProvider): void {
    this.provider = provider;
  }

  search(query: string, events: CalendarEvent[]): CalendarEvent[] {
    return this.provider.search(query, events);
  }

  /**
   * Search within a specific date range.
   */
  searchInRange(
    query: string,
    events: CalendarEvent[],
    start: Date,
    end: Date
  ): CalendarEvent[] {
    const inRange = events.filter(e => {
      const t = new Date(e.start).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    return this.provider.search(query, inRange);
  }
}
