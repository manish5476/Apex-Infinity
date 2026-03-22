import { Component, inject, signal, computed, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
import { NoteService } from '../../../core/services/notes.service';

// --- Interfaces based on your JSON Data ---
interface ExtendedProps {
  type?: string;
  noteType?: 'note' | 'task' | 'meeting';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  meetingId?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO String
  end: string;   // ISO String
  allDay: boolean;
  extendedProps: ExtendedProps;
  color?: string;
}

interface DayCell {
  date: Date;
  dateStr: string;
  dayNum: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  intensity: number; // 0 (None) to 0.8+ (High)
  events: CalendarEvent[];
}

@Component({
  selector: 'app-datepicker-view',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss'
})
export class CalendarViewComponent implements OnInit {
  private noteService = inject(NoteService);
  private router = inject(Router);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Signals
  currentDate = signal(new Date());
  selectedDate = signal(new Date()); // For sidebar details
  events = signal<CalendarEvent[]>([]);
  heatmapData = signal<Record<string, { count: number, intensity: number }>>({});
  isLoading = signal(false);
  viewScope = signal<'personal' | 'shared'>('personal');

  // Computed: Grid Generation
  gridCells = computed(() => {
    const curr = this.currentDate();
    const year = curr.getFullYear();
    const month = curr.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay();
    const startDate = new Date(firstOfMonth);
    startDate.setDate(1 - startDay);

    const cells: DayCell[] = [];
    const heatmap = this.heatmapData();
    const allEvents = this.events();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = this.formatDateIso(date);

      // 1. Get Heatmap Intensity
      let intensity = 0;
      const hmEntry = heatmap[dateStr];
      if (hmEntry) {
        intensity = hmEntry.intensity || (hmEntry.count ? Math.min(hmEntry.count / 5, 1) : 0);
      }

      // 2. Filter & Sort Events
      const dayEvents = allEvents
        .filter(e => e.start.startsWith(dateStr) || (e.start < dateStr && e.end >= dateStr)) // Simplified overlap check
        .sort((a, b) => {
          // Priority: Urgent > Meeting > Time
          const pA = this.getPriorityScore(a);
          const pB = this.getPriorityScore(b);
          return pB - pA;
        });

      cells.push({
        date,
        dateStr,
        dayNum: date.getDate(),
        isToday: this.isSameDay(date, new Date()),
        isCurrentMonth: date.getMonth() === month,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        intensity,
        events: dayEvents
      });
    }
    return cells;
  });

  // Computed: Sidebar Details
  selectedDateStr = computed(() => this.formatDateIso(this.selectedDate()));
  selectedDayEvents = computed(() => {
    const target = this.selectedDateStr();
    return this.events().filter(e => e.start.startsWith(target));
  });

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);
    const curr = this.currentDate();

    // Range: Start of grid to End of grid (approx)
    const y = curr.getFullYear(), m = curr.getMonth();
    const start = new Date(y, m, 1); start.setDate(start.getDate() - 7);
    const end = new Date(y, m + 1, 14);

    const startStr = start.toISOString();
    const endStr = end.toISOString();

    const reqs: any = {
      events: this.noteService.getCalendarView(startStr, endStr, 'month')
    };

    if (this.viewScope() === 'personal') {
      reqs.heatmap = this.noteService.getHeatMapData(startStr, endStr);
    }

    forkJoin(reqs)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          this.events.set(res.events.data?.events || []);

          if (res.heatmap?.data?.heatMap) {
            // Handle Object vs Array response
            const raw = res.heatmap.data.heatMap;
            const map: Record<string, any> = {};
            if (Array.isArray(raw)) {
              raw.forEach(x => { if (x.date) map[x.date] = x; }); // Assuming array has date prop
            } else {
              // Assuming object keys are dates "YYYY-MM-DD" based on your provided JSON
              Object.assign(map, raw);
            }
            this.heatmapData.set(map);
          } else {
            this.heatmapData.set({});
          }
        }
      });
  }

  // --- Logic Helpers ---

  getPriorityScore(e: CalendarEvent): number {
    if (e.extendedProps.priority === 'urgent') return 10;
    if (e.extendedProps.noteType === 'meeting') return 8;
    if (e.extendedProps.priority === 'high') return 6;
    return 1;
  }

  getHeatmapColor(intensity: number): string {
    // Map intensity 0.0 - 1.0 to a color scale
    if (intensity === 0) return 'transparent';
    // Green scale based on intensity
    if (intensity < 0.3) return '#86efac'; // Light green
    if (intensity < 0.6) return '#22c55e'; // Medium green
    return '#15803d'; // Strong green
  }

  getSelectedDayIntensity() {
    const d = this.selectedDateStr();
    const hm = this.heatmapData();
    return hm[d]?.intensity || 0;
  }

  getSelectedDayTaskCount() {
    return this.selectedDayEvents().filter(e => e.extendedProps.noteType === 'task').length;
  }

  // --- Interactions ---

  changeMonth(delta: number) {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + delta);
    this.currentDate.set(d);
    this.fetchData();
  }

  jumpToToday() {
    const now = new Date();
    this.currentDate.set(now);
    this.selectedDate.set(now);
    this.fetchData();
  }

  selectDate(cell: DayCell) {
    this.selectedDate.set(cell.date);
  }

  toggleScope(s: 'personal' | 'shared') {
    this.viewScope.set(s);
    this.fetchData();
  }

  onCreateNote() {
    this.router.navigate(['/notes/create'], { queryParams: { date: this.selectedDateStr() } });
  }

  onEventClick(id: string) {
    const cleanId = id.replace(/^(meeting_|task_)/, '');
    this.router.navigate(['/notes', cleanId]);
  }

  private formatDateIso(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }
}
