import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NoteService } from '../../../core/services/notes.service';
import { CalendarEvent, DailyNoteCount } from '../../../core/models/note.types';
import { forkJoin } from 'rxjs';

// --- INTERFACE FOR STRICT TYPING ---
// This fixes the "Object is unknown" error in the HTML
interface CalendarGridCell {
  day: number | null; // Null for padding days
  date: Date | null;
  isToday: boolean;
  intensity: number;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent {
  private notes = inject(NoteService);
  private router = inject(Router);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Signals
  currentDate = signal(new Date());
  events = signal<CalendarEvent[]>([]);
  heatmapData = signal<DailyNoteCount[]>([]);
  isLoading = signal(false);

  // Computed Grid with Strict Typing
  calendarGrid = computed<CalendarGridCell[]>(() => {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Padding (Empty cells before start of month)
    const padding: CalendarGridCell[] = Array(firstDay).fill({
      day: null,
      date: null,
      isToday: false,
      intensity: 0,
      events: []
    });

    const counts = this.heatmapData();
    const allEvents = this.events();

    const days: CalendarGridCell[] = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const date = new Date(year, month, dayNum);
      const dateStr = date.toISOString().split('T')[0];

      // Find heatmap intensity
      const dailyStat = counts.find(c => c.date === dateStr);
      const intensity = dailyStat ? this.calculateIntensity(dailyStat.count) : 0;

      // Filter events
      const dayEvents = allEvents.filter(e => 
        new Date(e.start).toDateString() === date.toDateString()
      );

      return {
        day: dayNum,
        date: date,
        isToday: this.isToday(date),
        intensity: intensity,
        events: dayEvents
      };
    });

    return [...padding, ...days];
  });

  constructor() {
    this.fetchData();
  }

  // --- Data Fetching ---
  fetchData() {
    this.isLoading.set(true);
    const y = this.currentDate().getFullYear();
    const m = this.currentDate().getMonth();

    forkJoin({
      events: this.notes.getCalendarView(
        new Date(y, m, 1).toISOString(),
        new Date(y, m + 1, 0).toISOString(),
        'month'
      ),
      counts: this.notes.getNotesForMonth(y, m + 1)
    }).subscribe({
      next: (res) => {
        this.events.set(res.events.data.events);
        this.heatmapData.set(res.counts.data as any);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- Actions ---
  changeMonth(delta: number) {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + delta);
    this.currentDate.set(date);
    this.fetchData();
  }

  jumpToToday() {
    this.currentDate.set(new Date());
    this.fetchData();
  }

  onEventClick(id: string, event: Event) {
    event.stopPropagation();
    if (id.startsWith('meeting_')) {
      // Handle meeting click
      console.log('Meeting ID:', id);
    } else {
      this.router.navigate(['/notes', id]);
    }
  }

  onDateClick(date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    this.router.navigate(['/notes/create'], { 
      queryParams: { date: dateStr } 
    });
  }

  // --- Utilities ---
  isToday(date: Date) {
    return date.toDateString() === new Date().toDateString();
  }

  calculateIntensity(count: number): number {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    return 3;
  }
}

