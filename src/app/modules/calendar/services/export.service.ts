// calendar/services/export.service.ts
// ─────────────────────────────────────────────────────────────────────────────
//  CalendarExportService — abstraction over multiple export formats.
//
//  Single interface: all formats (ICS, CSV, Excel, PDF, Google, Outlook)
//  share one contract. Add new formats without touching components.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { CalendarEvent } from '../adapters/calendar-event.adapter';

export type ExportFormat = 'ics' | 'csv' | 'excel' | 'pdf';

// ── Provider interface ────────────────────────────────────────────────────────

export interface CalendarExporter {
  export(events: CalendarEvent[], filename: string): void;
}

// ── ICS Exporter (iCal standard) ─────────────────────────────────────────────

class IcsExporter implements CalendarExporter {
  export(events: CalendarEvent[], filename = 'calendar'): void {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Apex Infinity ERP//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const ev of events) {
      const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const start = ev.allDay
        ? `;VALUE=DATE:${ev.start.slice(0, 10).replace(/-/g, '')}`
        : `:${ev.start.replace(/[-:]/g, '').split('.')[0]}Z`;
      const end = ev.allDay
        ? `;VALUE=DATE:${ev.end.slice(0, 10).replace(/-/g, '')}`
        : `:${ev.end.replace(/[-:]/g, '').split('.')[0]}Z`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${ev.id}@apex-infinity`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART${start}`);
      lines.push(`DTEND${end}`);
      lines.push(`SUMMARY:${this.escape(ev.title)}`);
      if (ev.extendedProps.status) lines.push(`STATUS:${ev.extendedProps.status.toUpperCase()}`);
      if (ev.extendedProps.location?.address) {
        lines.push(`LOCATION:${this.escape(ev.extendedProps.location.address)}`);
      }
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    this.download(lines.join('\r\n'), `${filename}.ics`, 'text/calendar;charset=utf-8');
  }

  private escape(s: string): string {
    return s.replace(/[\\,;]/g, c => `\\${c}`).replace(/\n/g, '\\n');
  }

  private download(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}

// ── CSV Exporter ──────────────────────────────────────────────────────────────

class CsvExporter implements CalendarExporter {
  export(events: CalendarEvent[], filename = 'calendar'): void {
    const headers = ['ID', 'Title', 'Start', 'End', 'Type', 'Status', 'Priority', 'Location'];
    const rows = events.map(e => [
      e.sourceId,
      `"${e.title.replace(/"/g, '""')}"`,
      e.start,
      e.end,
      e.sourceType,
      e.extendedProps.status ?? '',
      e.extendedProps.priority ?? '',
      e.extendedProps.location?.address ?? '',
    ].join(','));

    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CalendarExportService {
  private exporters: Record<ExportFormat, CalendarExporter> = {
    ics:   new IcsExporter(),
    csv:   new CsvExporter(),
    excel: new CsvExporter(), // TODO: replace with real Excel exporter
    pdf:   new CsvExporter(), // TODO: replace with PDF exporter
  };

  /**
   * Register a custom exporter for a format (e.g. replace csv stub with xlsx).
   */
  registerExporter(format: ExportFormat, exporter: CalendarExporter): void {
    this.exporters[format] = exporter;
  }

  export(events: CalendarEvent[], format: ExportFormat, filename = 'apex-calendar'): void {
    const exporter = this.exporters[format];
    if (!exporter) {
      console.warn(`[CalendarExportService] No exporter registered for format: ${format}`);
      return;
    }
    exporter.export(events, filename);
  }
}
