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
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="calendar-layout">
      
      <!-- MAIN CALENDAR AREA -->
      <div class="calendar-main">
        
        <!-- Header -->
        <header class="cal-header">
          <div class="cal-title-group">
            <h2 class="month-title">{{ currentDate() | date:'MMMM yyyy' }}</h2>
            <div class="cal-nav">
              <button class="btn-icon" (click)="changeMonth(-1)"><i class="pi pi-chevron-left"></i></button>
              <button class="btn-today" (click)="jumpToToday()">Today</button>
              <button class="btn-icon" (click)="changeMonth(1)"><i class="pi pi-chevron-right"></i></button>
            </div>
          </div>

          <div class="cal-actions">
            <div class="scope-switch">
              <button [class.active]="viewScope() === 'personal'" (click)="toggleScope('personal')">Personal</button>
              <button [class.active]="viewScope() === 'shared'" (click)="toggleScope('shared')">Shared</button>
            </div>
          </div>
        </header>

        <!-- Grid -->
        <div class="cal-grid-container">
          <!-- Weekdays -->
          <div class="weekday-row">
            @for(day of weekDays; track day) {
              <div class="weekday">{{ day }}</div>
            }
          </div>

          <!-- Days -->
          <div class="days-grid custom-scrollbar">
            @if (isLoading()) {
              <div class="loader-overlay"><i class="pi pi-spin pi-spinner"></i></div>
            }

            @for(cell of gridCells(); track cell.dateStr) {
              <div class="day-cell" 
                   [class.inactive]="!cell.isCurrentMonth"
                   [class.today]="cell.isToday"
                   [class.selected]="selectedDateStr() === cell.dateStr"
                   [style.--intensity-color]="getHeatmapColor(cell.intensity)"
                   (click)="selectDate(cell)">
                
                <!-- Heatmap Background (Subtle Glow) -->
                @if(cell.intensity > 0) {
                  <div class="heatmap-glow" [style.opacity]="cell.intensity * 0.5"></div>
                }

                <div class="day-header">
                  <span class="day-num">{{ cell.dayNum }}</span>
                  @if(cell.dayNum === 1) { <span class="month-label">{{ cell.date | date:'MMM' }}</span> }
                  
                  <!-- Activity Dot -->
                  @if(cell.events.length > 0) {
                    <div class="activity-dot"></div>
                  }
                </div>

                <!-- Events Stack -->
                <div class="events-stack">
                  @for(evt of cell.events.slice(0, 3); track evt.id) {
                    <div class="evt-pill" 
                         [style.--evt-color]="evt.color || '#64748b'"
                         [class.is-meeting]="evt.extendedProps.noteType === 'meeting'"
                         [title]="evt.title">
                      <div class="evt-marker"></div>
                      <span class="evt-title">{{ evt.title }}</span>
                    </div>
                  }
                  @if(cell.events.length > 3) {
                    <div class="more-count">+{{ cell.events.length - 3 }}</div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- SIDEBAR SUMMARY (Contextual Details) -->
      <aside class="calendar-sidebar glass-panel">
        <div class="sidebar-header">
          <h3>{{ selectedDate() | date:'EEEE, MMM d' }}</h3>
          <button class="btn-add-mini" (click)="onCreateNote()" title="Add Note">
            <i class="pi pi-plus"></i>
          </button>
        </div>

        <div class="selected-day-events custom-scrollbar">
          @if (selectedDayEvents().length === 0) {
            <div class="empty-day-state">
              <i class="pi pi-calendar-times"></i>
              <p>No events planned</p>
              <button class="btn-text" (click)="onCreateNote()">Add something</button>
            </div>
          }

          @for (evt of selectedDayEvents(); track evt.id) {
            <div class="event-card" 
                 (click)="onEventClick(evt.id)"
                 [style.border-left-color]="evt.color || '#cbd5e1'">
              
              <div class="evt-card-header">
                <span class="badge" 
                      [style.background]="evt.color + '20'" 
                      [style.color]="evt.color">
                  {{ evt.extendedProps.noteType | titlecase }}
                </span>
                @if(evt.extendedProps.priority === 'urgent') {
                  <i class="pi pi-bolt" style="color: #ef4444"></i>
                }
              </div>
              
              <h4 class="evt-card-title">{{ evt.title }}</h4>
              
              <div class="evt-card-meta">
                @if(evt.extendedProps.noteType === 'meeting') {
                  <span class="meta-item"><i class="pi pi-clock"></i> {{ evt.start | date:'shortTime' }}</span>
                }
                <span class="meta-item status" [class.done]="evt.extendedProps.status === 'completed'">
                  {{ evt.extendedProps.status || 'Active' }}
                </span>
              </div>
            </div>
          }
        </div>
        
        <!-- Mini Analytics -->
        <div class="mini-stats">
          <div class="stat-item">
            <span class="lbl">Productivity</span>
            <span class="val">{{ (getSelectedDayIntensity() * 100) | number:'1.0-0' }}%</span>
          </div>
           <div class="stat-item">
            <span class="lbl">Tasks</span>
            <span class="val">{{ getSelectedDayTaskCount() }}</span>
          </div>
        </div>
      </aside>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      --c-bg: var(--bg-primary);
      --c-surface: var(--bg-secondary);
      --c-border: var(--border-secondary);
      --c-text: var(--text-primary);
      --c-muted: var(--text-secondary);
      --c-accent: var(--accent-primary);
    }

    .calendar-layout {
      display: flex;
      height: 100%;
      gap: 1rem;
      background: var(--c-bg);
      overflow: hidden;
    }

    /* === MAIN AREA === */
    .calendar-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      background: var(--c-bg);
      border: 1px solid var(--c-border);
      overflow: hidden;
    }

    /* HEADER */
    .cal-header {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--c-border);
      background: var(--c-bg);

      .cal-title-group {
        display: flex; align-items: center; gap: 1.5rem;
        .month-title { font-size: 1.5rem; font-weight: 800; color: var(--c-text); margin: 0; min-width: 200px; }
        .cal-nav {
          display: flex; align-items: center; gap: 4px;
          .btn-icon {
            width: 32px; height: 32px; border: 1px solid var(--c-border); background: transparent;
            border-radius: 8px; color: var(--c-muted); cursor: pointer; display: flex; align-items: center; justify-content: center;
            &:hover { background: var(--c-surface); color: var(--c-text); }
          }
          .btn-today {
            padding: 0 12px; height: 32px; border: 1px solid var(--c-border); background: transparent;
            border-radius: 8px; font-weight: 600; font-size: 0.85rem; color: var(--c-text); cursor: pointer;
            &:hover { background: var(--c-surface); }
          }
        }
      }

      .scope-switch {
        background: var(--c-surface); padding: 4px; border-radius: 10px; display: flex; gap: 2px;
        button {
          border: none; background: transparent; padding: 6px 16px; font-size: 0.85rem; font-weight: 600;
          color: var(--c-muted); border-radius: 8px; cursor: pointer; transition: all 0.2s;
          &.active { background: var(--c-bg); color: var(--c-text); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        }
      }
    }

    /* GRID */
    .cal-grid-container {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
    }
    .weekday-row {
      display: grid; grid-template-columns: repeat(7, 1fr);
      border-bottom: 1px solid var(--c-border); background: var(--c-surface);
      .weekday { padding: 10px; text-align: center; font-size: 0.75rem; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: 1px; }
    }
    .days-grid {
      flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 1fr;
      overflow-y: auto; position: relative;
    }
    .loader-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.7); backdrop-filter: blur(2px);
      z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--c-accent);
    }

    /* DAY CELL */
    .day-cell {
      border-right: 1px solid var(--c-border); border-bottom: 1px solid var(--c-border);
      padding: 8px; display: flex; flex-direction: column; position: relative;
      background: var(--c-bg); cursor: pointer; transition: background 0.15s;
      min-height: 100px;

      /* States */
      &.inactive { background: repeating-linear-gradient(45deg, var(--c-surface), var(--c-surface) 10px, var(--c-bg) 10px, var(--c-bg) 20px); opacity: 0.6; }
      &.selected { background: var(--c-surface) !important; box-shadow: inset 0 0 0 2px var(--c-accent); }
      &:hover:not(.selected) { background: var(--c-surface); }
      &.today .day-num { background: var(--c-accent); color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }

      /* Heatmap */
      .heatmap-glow {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(circle at center, var(--intensity-color), transparent 70%);
        z-index: 0;
      }

      .day-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; position: relative; z-index: 1;
        .day-num { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 600; font-size: 0.9rem; color: var(--c-text); }
        .month-label { font-size: 0.75rem; font-weight: 700; color: var(--c-text); }
        .activity-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-accent); opacity: 0.5; }
      }

      .events-stack {
        display: flex; flex-direction: column; gap: 3px; position: relative; z-index: 1; flex: 1;
        .evt-pill {
          display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px;
          background: color-mix(in srgb, var(--evt-color) 10%, transparent);
          color: var(--evt-color); font-size: 0.7rem; font-weight: 600; border: 1px solid transparent;
          
          &.is-meeting { border-color: var(--evt-color); background: color-mix(in srgb, var(--evt-color) 15%, white); }
          .evt-marker { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
          .evt-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        }
        .more-count { font-size: 0.7rem; color: var(--c-muted); padding-left: 4px; font-weight: 500; }
      }
    }

    /* === SIDEBAR === */
    .calendar-sidebar {
      width: 320px;
      display: flex; flex-direction: column;
      border-left: 1px solid var(--c-border);
      background: var(--c-bg);
      border-radius: 12px;
      padding: 1.5rem;
      gap: 1.5rem;
    }

    .sidebar-header {
      display: flex; justify-content: space-between; align-items: center;
      h3 { font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--c-text); }
      .btn-add-mini {
        width: 30px; height: 30px; border-radius: 50%; background: var(--c-accent); color: white; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center; transition: transform 0.2s;
        &:hover { transform: rotate(90deg); }
      }
    }

    .selected-day-events {
      flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
      .empty-day-state {
        text-align: center; padding: 2rem 0; color: var(--c-muted);
        i { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5; }
        p { font-size: 0.9rem; margin: 0 0 0.5rem 0; }
        .btn-text { background: none; border: none; color: var(--c-accent); font-weight: 600; cursor: pointer; font-size: 0.85rem; }
      }
    }

    .event-card {
      background: var(--c-surface); border-radius: 8px; padding: 12px;
      border-left: 3px solid transparent; cursor: pointer; transition: transform 0.1s;
      &:hover { transform: translateX(2px); background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

      .evt-card-header {
        display: flex; justify-content: space-between; margin-bottom: 6px;
        .badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
      }
      .evt-card-title { margin: 0 0 6px 0; font-size: 0.9rem; font-weight: 600; color: var(--c-text); }
      .evt-card-meta {
        display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--c-muted);
        .status.done { text-decoration: line-through; opacity: 0.7; }
      }
    }

    .mini-stats {
      display: flex; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--c-border);
      .stat-item {
        flex: 1; display: flex; flex-direction: column;
        .lbl { font-size: 0.7rem; text-transform: uppercase; color: var(--c-muted); font-weight: 600; }
        .val { font-size: 1.1rem; font-weight: 700; color: var(--c-text); }
      }
    }
  `]
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
              raw.forEach(x => { if(x.date) map[x.date] = x; }); // Assuming array has date prop
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
    this.router.navigate(['/notes/create'], { queryParams: { date: this.selectedDateStr() }});
  }

  onEventClick(id: string) {
    const cleanId = id.replace(/^(meeting_|task_)/, ''); 
    this.router.navigate(['/notes', cleanId]);
  }

  private formatDateIso(d: Date): string {
    const pad = (n: number) => n < 10 ? '0'+n : n;
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  private isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }
}

// import { Component, inject, signal, computed, OnInit, ViewEncapsulation } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { Router } from '@angular/router';
// import { forkJoin } from 'rxjs';
// import { finalize } from 'rxjs/operators';
// import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// import { NoteService } from '../../../core/services/notes.service';

// // --- Interfaces based on your JSON Data ---
// interface ExtendedProps {
//   type?: string;
//   noteType?: 'note' | 'task' | 'meeting';
//   priority?: 'low' | 'medium' | 'high' | 'urgent';
//   status?: string;
//   meetingId?: string;
// }

// interface CalendarEvent {
//   id: string;
//   title: string;
//   start: string; // ISO String
//   end: string;   // ISO String
//   allDay: boolean;
//   extendedProps: ExtendedProps;
//   color?: string;
// }

// interface DayCell {
//   date: Date;
//   dateStr: string;
//   dayNum: number;
//   isToday: boolean;
//   isCurrentMonth: boolean;
//   isWeekend: boolean;
//   intensity: number; // 0 (None) to 0.8+ (High)
//   events: CalendarEvent[];
// }

// @Component({
//   selector: 'app-calendar-view',
//   standalone: true,
//   imports: [CommonModule],
//   providers: [DatePipe],
//   encapsulation: ViewEncapsulation.None,
//   template: `
//     <div class="calendar-layout">
      
//       <!-- MAIN CALENDAR AREA -->
//       <div class="calendar-main">
        
//         <!-- Header -->
//         <header class="cal-header">
//           <div class="cal-title-group">
//             <h2 class="month-title">{{ currentDate() | date:'MMMM yyyy' }}</h2>
//             <div class="cal-nav">
//               <button class="btn-icon" (click)="changeMonth(-1)"><i class="pi pi-chevron-left"></i></button>
//               <button class="btn-today" (click)="jumpToToday()">Today</button>
//               <button class="btn-icon" (click)="changeMonth(1)"><i class="pi pi-chevron-right"></i></button>
//             </div>
//           </div>

//           <div class="cal-actions">
//             <div class="scope-switch">
//               <button [class.active]="viewScope() === 'personal'" (click)="toggleScope('personal')">Personal</button>
//               <button [class.active]="viewScope() === 'shared'" (click)="toggleScope('shared')">Shared</button>
//             </div>
//           </div>
//         </header>

//         <!-- Grid -->
//         <div class="cal-grid-container">
//           <!-- Weekdays -->
//           <div class="weekday-row">
//             @for(day of weekDays; track day) {
//               <div class="weekday">{{ day }}</div>
//             }
//           </div>

//           <!-- Days -->
//           <div class="days-grid custom-scrollbar">
//             @if (isLoading()) {
//               <div class="loader-overlay"><i class="pi pi-spin pi-spinner"></i></div>
//             }

//             @for(cell of gridCells(); track cell.dateStr) {
//               <div class="day-cell" 
//                    [class.inactive]="!cell.isCurrentMonth"
//                    [class.today]="cell.isToday"
//                    [class.selected]="selectedDateStr() === cell.dateStr"
//                    [style.--intensity-color]="getHeatmapColor(cell.intensity)"
//                    (click)="selectDate(cell)">
                
//                 <!-- Heatmap Background (Subtle Glow) -->
//                 @if(cell.intensity > 0) {
//                   <div class="heatmap-glow" [style.opacity]="cell.intensity * 0.5"></div>
//                 }

//                 <div class="day-header">
//                   <span class="day-num">{{ cell.dayNum }}</span>
//                   @if(cell.dayNum === 1) { <span class="month-label">{{ cell.date | date:'MMM' }}</span> }
                  
//                   <!-- Activity Dot -->
//                   @if(cell.events.length > 0) {
//                     <div class="activity-dot"></div>
//                   }
//                 </div>

//                 <!-- Events Stack -->
//                 <div class="events-stack">
//                   @for(evt of cell.events.slice(0, 3); track evt.id) {
//                     <div class="evt-pill" 
//                          [style.--evt-color]="evt.color || '#64748b'"
//                          [class.is-meeting]="evt.extendedProps.noteType === 'meeting'"
//                          [title]="evt.title">
//                       <div class="evt-marker"></div>
//                       <span class="evt-title">{{ evt.title }}</span>
//                     </div>
//                   }
//                   @if(cell.events.length > 3) {
//                     <div class="more-count">+{{ cell.events.length - 3 }}</div>
//                   }
//                 </div>
//               </div>
//             }
//           </div>
//         </div>
//       </div>

//       <!-- SIDEBAR SUMMARY (Contextual Details) -->
//       <aside class="calendar-sidebar glass-panel">
//         <div class="sidebar-header">
//           <h3>{{ selectedDate() | date:'EEEE, MMM d' }}</h3>
//           <button class="btn-add-mini" (click)="onCreateNote()" title="Add Note">
//             <i class="pi pi-plus"></i>
//           </button>
//         </div>

//         <div class="selected-day-events custom-scrollbar">
//           @if (selectedDayEvents().length === 0) {
//             <div class="empty-day-state">
//               <i class="pi pi-calendar-times"></i>
//               <p>No events planned</p>
//               <button class="btn-text" (click)="onCreateNote()">Add something</button>
//             </div>
//           }

//           @for (evt of selectedDayEvents(); track evt.id) {
//             <div class="event-card" 
//                  (click)="onEventClick(evt.id)"
//                  [style.border-left-color]="evt.color || '#cbd5e1'">
              
//               <div class="evt-card-header">
//                 <span class="badge" 
//                       [style.background]="evt.color + '20'" 
//                       [style.color]="evt.color">
//                   {{ evt.extendedProps.noteType | titlecase }}
//                 </span>
//                 @if(evt.extendedProps.priority === 'urgent') {
//                   <i class="pi pi-bolt" style="color: #ef4444"></i>
//                 }
//               </div>
              
//               <h4 class="evt-card-title">{{ evt.title }}</h4>
              
//               <div class="evt-card-meta">
//                 @if(evt.extendedProps.noteType === 'meeting') {
//                   <span class="meta-item"><i class="pi pi-clock"></i> {{ evt.start | date:'shortTime' }}</span>
//                 }
//                 <span class="meta-item status" [class.done]="evt.extendedProps.status === 'completed'">
//                   {{ evt.extendedProps.status || 'Active' }}
//                 </span>
//               </div>
//             </div>
//           }
//         </div>
        
//         <!-- Mini Analytics -->
//         <div class="mini-stats">
//           <div class="stat-item">
//             <span class="lbl">Productivity</span>
//             <span class="val">{{ (getSelectedDayIntensity() * 100) | number:'1.0-0' }}%</span>
//           </div>
//            <div class="stat-item">
//             <span class="lbl">Tasks</span>
//             <span class="val">{{ getSelectedDayTaskCount() }}</span>
//           </div>
//         </div>
//       </aside>

//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       height: 100%;
//       --c-bg: var(--bg-primary);
//       --c-surface: var(--bg-secondary);
//       --c-border: var(--border-secondary);
//       --c-text: var(--text-primary);
//       --c-muted: var(--text-secondary);
//       --c-accent: var(--accent-primary);
//     }

//     .calendar-layout {
//       display: flex;
//       height: 100%;
//       gap: 1rem;
//       background: var(--c-bg);
//       overflow: hidden;
//     }

//     /* === MAIN AREA === */
//     .calendar-main {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       border-radius: 12px;
//       background: var(--c-bg);
//       border: 1px solid var(--c-border);
//       overflow: hidden;
//     }

//     /* HEADER */
//     .cal-header {
//       padding: 1rem 1.5rem;
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       border-bottom: 1px solid var(--c-border);
//       background: var(--c-bg);

//       .cal-title-group {
//         display: flex; align-items: center; gap: 1.5rem;
//         .month-title { font-size: 1.5rem; font-weight: 800; color: var(--c-text); margin: 0; min-width: 200px; }
//         .cal-nav {
//           display: flex; align-items: center; gap: 4px;
//           .btn-icon {
//             width: 32px; height: 32px; border: 1px solid var(--c-border); background: transparent;
//             border-radius: 8px; color: var(--c-muted); cursor: pointer; display: flex; align-items: center; justify-content: center;
//             &:hover { background: var(--c-surface); color: var(--c-text); }
//           }
//           .btn-today {
//             padding: 0 12px; height: 32px; border: 1px solid var(--c-border); background: transparent;
//             border-radius: 8px; font-weight: 600; font-size: 0.85rem; color: var(--c-text); cursor: pointer;
//             &:hover { background: var(--c-surface); }
//           }
//         }
//       }

//       .scope-switch {
//         background: var(--c-surface); padding: 4px; border-radius: 10px; display: flex; gap: 2px;
//         button {
//           border: none; background: transparent; padding: 6px 16px; font-size: 0.85rem; font-weight: 600;
//           color: var(--c-muted); border-radius: 8px; cursor: pointer; transition: all 0.2s;
//           &.active { background: var(--c-bg); color: var(--c-text); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
//         }
//       }
//     }

//     /* GRID */
//     .cal-grid-container {
//       flex: 1; display: flex; flex-direction: column; overflow: hidden;
//     }
//     .weekday-row {
//       display: grid; grid-template-columns: repeat(7, 1fr);
//       border-bottom: 1px solid var(--c-border); background: var(--c-surface);
//       .weekday { padding: 10px; text-align: center; font-size: 0.75rem; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: 1px; }
//     }
//     .days-grid {
//       flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 1fr;
//       overflow-y: auto; position: relative;
//     }
//     .loader-overlay {
//       position: absolute; inset: 0; background: rgba(255,255,255,0.7); backdrop-filter: blur(2px);
//       z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--c-accent);
//     }

//     /* DAY CELL */
//     .day-cell {
//       border-right: 1px solid var(--c-border); border-bottom: 1px solid var(--c-border);
//       padding: 8px; display: flex; flex-direction: column; position: relative;
//       background: var(--c-bg); cursor: pointer; transition: background 0.15s;
//       min-height: 100px;

//       /* States */
//       &.inactive { background: repeating-linear-gradient(45deg, var(--c-surface), var(--c-surface) 10px, var(--c-bg) 10px, var(--c-bg) 20px); opacity: 0.6; }
//       &.selected { background: var(--c-surface) !important; box-shadow: inset 0 0 0 2px var(--c-accent); }
//       &:hover:not(.selected) { background: var(--c-surface); }
//       &.today .day-num { background: var(--c-accent); color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }

//       /* Heatmap */
//       .heatmap-glow {
//         position: absolute; inset: 0; pointer-events: none;
//         background: radial-gradient(circle at center, var(--intensity-color), transparent 70%);
//         z-index: 0;
//       }

//       .day-header {
//         display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; position: relative; z-index: 1;
//         .day-num { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 600; font-size: 0.9rem; color: var(--c-text); }
//         .month-label { font-size: 0.75rem; font-weight: 700; color: var(--c-text); }
//         .activity-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-accent); opacity: 0.5; }
//       }

//       .events-stack {
//         display: flex; flex-direction: column; gap: 3px; position: relative; z-index: 1; flex: 1;
//         .evt-pill {
//           display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px;
//           background: color-mix(in srgb, var(--evt-color) 10%, transparent);
//           color: var(--evt-color); font-size: 0.7rem; font-weight: 600; border: 1px solid transparent;
          
//           &.is-meeting { border-color: var(--evt-color); background: color-mix(in srgb, var(--evt-color) 15%, white); }
//           .evt-marker { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
//           .evt-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//         }
//         .more-count { font-size: 0.7rem; color: var(--c-muted); padding-left: 4px; font-weight: 500; }
//       }
//     }

//     /* === SIDEBAR === */
//     .calendar-sidebar {
//       width: 320px;
//       display: flex; flex-direction: column;
//       border-left: 1px solid var(--c-border);
//       background: var(--c-bg);
//       border-radius: 12px;
//       padding: 1.5rem;
//       gap: 1.5rem;
//     }

//     .sidebar-header {
//       display: flex; justify-content: space-between; align-items: center;
//       h3 { font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--c-text); }
//       .btn-add-mini {
//         width: 30px; height: 30px; border-radius: 50%; background: var(--c-accent); color: white; border: none; cursor: pointer;
//         display: flex; align-items: center; justify-content: center; transition: transform 0.2s;
//         &:hover { transform: rotate(90deg); }
//       }
//     }

//     .selected-day-events {
//       flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
//       .empty-day-state {
//         text-align: center; padding: 2rem 0; color: var(--c-muted);
//         i { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5; }
//         p { font-size: 0.9rem; margin: 0 0 0.5rem 0; }
//         .btn-text { background: none; border: none; color: var(--c-accent); font-weight: 600; cursor: pointer; font-size: 0.85rem; }
//       }
//     }

//     .event-card {
//       background: var(--c-surface); border-radius: 8px; padding: 12px;
//       border-left: 3px solid transparent; cursor: pointer; transition: transform 0.1s;
//       &:hover { transform: translateX(2px); background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

//       .evt-card-header {
//         display: flex; justify-content: space-between; margin-bottom: 6px;
//         .badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
//       }
//       .evt-card-title { margin: 0 0 6px 0; font-size: 0.9rem; font-weight: 600; color: var(--c-text); }
//       .evt-card-meta {
//         display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--c-muted);
//         .status.done { text-decoration: line-through; opacity: 0.7; }
//       }
//     }

//     .mini-stats {
//       display: flex; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--c-border);
//       .stat-item {
//         flex: 1; display: flex; flex-direction: column;
//         .lbl { font-size: 0.7rem; text-transform: uppercase; color: var(--c-muted); font-weight: 600; }
//         .val { font-size: 1.1rem; font-weight: 700; color: var(--c-text); }
//       }
//     }
//   `]
// })
// export class CalendarViewComponent implements OnInit {
//   private noteService = inject(NoteService);
//   private router = inject(Router);

//   weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//   // Signals
//   currentDate = signal(new Date());
//   selectedDate = signal(new Date()); // For sidebar details
//   events = signal<CalendarEvent[]>([]);
//   heatmapData = signal<Record<string, { count: number, intensity: number }>>({});
//   isLoading = signal(false);
//   viewScope = signal<'personal' | 'shared'>('personal');

//   // Computed: Grid Generation
//   gridCells = computed(() => {
//     const curr = this.currentDate();
//     const year = curr.getFullYear();
//     const month = curr.getMonth();

//     const firstOfMonth = new Date(year, month, 1);
//     const startDay = firstOfMonth.getDay();
//     const startDate = new Date(firstOfMonth);
//     startDate.setDate(1 - startDay);

//     const cells: DayCell[] = [];
//     const heatmap = this.heatmapData();
//     const allEvents = this.events();

//     for (let i = 0; i < 42; i++) {
//       const date = new Date(startDate);
//       date.setDate(startDate.getDate() + i);
//       const dateStr = this.formatDateIso(date);

//       // 1. Get Heatmap Intensity
//       let intensity = 0;
//       const hmEntry = heatmap[dateStr];
//       if (hmEntry) {
//         intensity = hmEntry.intensity || (hmEntry.count ? Math.min(hmEntry.count / 5, 1) : 0);
//       }

//       // 2. Filter & Sort Events
//       const dayEvents = allEvents
//         .filter(e => e.start.startsWith(dateStr) || (e.start < dateStr && e.end >= dateStr)) // Simplified overlap check
//         .sort((a, b) => {
//           // Priority: Urgent > Meeting > Time
//           const pA = this.getPriorityScore(a);
//           const pB = this.getPriorityScore(b);
//           return pB - pA;
//         });

//       cells.push({
//         date,
//         dateStr,
//         dayNum: date.getDate(),
//         isToday: this.isSameDay(date, new Date()),
//         isCurrentMonth: date.getMonth() === month,
//         isWeekend: date.getDay() === 0 || date.getDay() === 6,
//         intensity,
//         events: dayEvents
//       });
//     }
//     return cells;
//   });

//   // Computed: Sidebar Details
//   selectedDateStr = computed(() => this.formatDateIso(this.selectedDate()));
//   selectedDayEvents = computed(() => {
//     const target = this.selectedDateStr();
//     return this.events().filter(e => e.start.startsWith(target));
//   });

//   ngOnInit() {
//     this.fetchData();
//   }

//   fetchData() {
//     this.isLoading.set(true);
//     const curr = this.currentDate();
    
//     // Range: Start of grid to End of grid (approx)
//     const y = curr.getFullYear(), m = curr.getMonth();
//     const start = new Date(y, m, 1); start.setDate(start.getDate() - 7);
//     const end = new Date(y, m + 1, 14);

//     const startStr = start.toISOString();
//     const endStr = end.toISOString();

//     const reqs: any = {
//       events: this.noteService.getCalendarView(startStr, endStr, 'month')
//     };
    
//     if (this.viewScope() === 'personal') {
//       reqs.heatmap = this.noteService.getHeatMapData(startStr, endStr);
//     }

//     forkJoin(reqs)
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe({
//         next: (res: any) => {
//           this.events.set(res.events.data?.events || []);
          
//           if (res.heatmap?.data?.heatMap) {
//             // Handle Object vs Array response
//             const raw = res.heatmap.data.heatMap;
//             const map: Record<string, any> = {};
//             if (Array.isArray(raw)) {
//               raw.forEach(x => { if(x.date) map[x.date] = x; }); // Assuming array has date prop
//             } else {
//               // Assuming object keys are dates "YYYY-MM-DD" based on your provided JSON
//               Object.assign(map, raw);
//             }
//             this.heatmapData.set(map);
//           } else {
//             this.heatmapData.set({});
//           }
//         }
//       });
//   }

//   // --- Logic Helpers ---

//   getPriorityScore(e: CalendarEvent): number {
//     if (e.extendedProps.priority === 'urgent') return 10;
//     if (e.extendedProps.noteType === 'meeting') return 8;
//     if (e.extendedProps.priority === 'high') return 6;
//     return 1;
//   }

//   getHeatmapColor(intensity: number): string {
//     // Map intensity 0.0 - 1.0 to a color scale
//     if (intensity === 0) return 'transparent';
//     // Green scale based on intensity
//     if (intensity < 0.3) return '#86efac'; // Light green
//     if (intensity < 0.6) return '#22c55e'; // Medium green
//     return '#15803d'; // Strong green
//   }

//   getSelectedDayIntensity() {
//     const d = this.selectedDateStr();
//     const hm = this.heatmapData();
//     return hm[d]?.intensity || 0;
//   }

//   getSelectedDayTaskCount() {
//     return this.selectedDayEvents().filter(e => e.extendedProps.noteType === 'task').length;
//   }

//   // --- Interactions ---

//   changeMonth(delta: number) {
//     const d = new Date(this.currentDate());
//     d.setMonth(d.getMonth() + delta);
//     this.currentDate.set(d);
//     this.fetchData();
//   }

//   jumpToToday() {
//     const now = new Date();
//     this.currentDate.set(now);
//     this.selectedDate.set(now);
//     this.fetchData();
//   }

//   selectDate(cell: DayCell) {
//     this.selectedDate.set(cell.date);
//   }

//   toggleScope(s: 'personal' | 'shared') {
//     this.viewScope.set(s);
//     this.fetchData();
//   }

//   onCreateNote() {
//     this.router.navigate(['/notes/create'], { queryParams: { date: this.selectedDateStr() }});
//   }

//   onEventClick(id: string) {
//     // ID might be "meeting_XYZ", clean it if needed
//     const cleanId = id.replace(/^(meeting_|task_)/, ''); 
//     this.router.navigate(['/notes', cleanId]);
//   }

//   // --- Date Utils ---

//   private formatDateIso(d: Date): string {
//     const pad = (n: number) => n < 10 ? '0'+n : n;
//     return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
//   }

//   private isSameDay(d1: Date, d2: Date) {
//     return d1.getFullYear() === d2.getFullYear() &&
//            d1.getMonth() === d2.getMonth() &&
//            d1.getDate() === d2.getDate();
//   }
// }

// // import { Component, inject, signal, computed, OnInit, ViewEncapsulation } from '@angular/core';
// // import { CommonModule, DatePipe } from '@angular/common';
// // import { Router } from '@angular/router';
// // import { forkJoin } from 'rxjs';
// // import { finalize } from 'rxjs/operators';
// // import { CalendarEvent } from '../../../core/models/note.types';
// // import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// // import { NoteService } from '../../../core/services/notes.service';

// // interface CalendarGridCell {
// //   date: Date;
// //   dateStr: string;
// //   dayNum: number;
// //   isToday: boolean;
// //   isCurrentMonth: boolean;
// //   isWeekend: boolean;
// //   intensity: number; // 0-4
// //   events: CalendarEvent[];
// // }

// // @Component({
// //   selector: 'app-calendar-view',
// //   standalone: true,
// //   imports: [CommonModule],
// //   providers: [DatePipe],
// //   encapsulation: ViewEncapsulation.None,
// //   template: `
// //     <div class="calendar-container">
      
// //       <!-- HEADER -->
// //       <header class="cal-header">
// //         <div class="cal-nav-group">
// //           <button class="btn-today" (click)="jumpToToday()">Today</button>
// //           <div class="nav-arrows">
// //             <button class="btn-icon" (click)="changeMonth(-1)" title="Previous Month">
// //               <i class="pi pi-chevron-left"></i>
// //             </button>
// //             <button class="btn-icon" (click)="changeMonth(1)" title="Next Month">
// //               <i class="pi pi-chevron-right"></i>
// //             </button>
// //           </div>
// //           <h2 class="month-label">{{ currentDate() | date:'MMMM yyyy' }}</h2>
// //         </div>

// //         <div class="cal-actions-group">
// //            <!-- Scope Toggle -->
// //            <div class="scope-toggle">
// //             <button 
// //               [class.active]="viewScope() === 'personal'" 
// //               (click)="toggleScope('personal')">
// //               Personal
// //             </button>
// //             <button 
// //               [class.active]="viewScope() === 'shared'" 
// //               (click)="toggleScope('shared')">
// //               Shared
// //             </button>
// //           </div>

// //           <!-- Legend / Analytics Trigger -->
// //           <button class="btn-icon-secondary" (click)="openAnalytics()" title="View Analytics">
// //              <i class="pi pi-chart-pie"></i>
// //           </button>
// //         </div>
// //       </header>

// //       <!-- GRID -->
// //       <div class="cal-grid">
// //         <!-- Weekday Headers -->
// //         <div class="weekday-header-row">
// //           @for(day of weekDays; track day) {
// //             <div class="weekday-cell">{{ day }}</div>
// //           }
// //         </div>

// //         <!-- Days -->
// //         <div class="days-grid custom-scrollbar">
// //           @if (isLoading()) {
// //             <div class="cal-loading-overlay">
// //               <i class="pi pi-spin pi-spinner"></i>
// //             </div>
// //           }

// //           @for(cell of gridCells(); track cell.dateStr) {
// //             <div class="day-cell" 
// //                  [class.outside-month]="!cell.isCurrentMonth"
// //                  [class.is-today]="cell.isToday"
// //                  [class.is-weekend]="cell.isWeekend"
// //                  [attr.data-intensity]="cell.intensity"
// //                  (click)="onDateClick(cell.date)">
              
// //               <!-- Day Header (Number + Heatmap Indicator) -->
// //               <div class="day-header">
// //                 @if (cell.dayNum === 1) {
// //                   <span class="month-start">{{ cell.date | date:'MMM' }}</span>
// //                 }
// //                 <span class="day-number">{{ cell.dayNum }}</span>
// //               </div>

// //               <!-- Events List -->
// //               <div class="events-stack">
// //                 @for(evt of cell.events.slice(0, 3); track evt.id) {
// //                   <div class="event-pill" 
// //                        [class.type-meeting]="isMeeting(evt)"
// //                        [class.type-task]="isTask(evt)"
// //                        [class.status-completed]="isCompleted(evt)"
// //                        (click)="onEventClick(evt.id, $event)"
// //                        [title]="evt.title">
// //                     <div class="pill-marker"></div>
// //                     <span class="pill-title">{{ evt.title }}</span>
// //                     @if(isMeeting(evt)) {
// //                        <span class="pill-time">{{ evt.start | date:'shortTime' }}</span>
// //                     }
// //                   </div>
// //                 }
                
// //                 <!-- More Indicator -->
// //                 @if(cell.events.length > 3) {
// //                   <div class="more-indicator">
// //                     +{{ cell.events.length - 3 }} more
// //                   </div>
// //                 }
// //               </div>

// //               <!-- Hover Add Action -->
// //               <div class="cell-hover-action">
// //                 <i class="pi pi-plus"></i>
// //               </div>

// //             </div>
// //           }
// //         </div>
// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     :host {
// //       display: block;
// //       height: 100%;
// //       --c-bg: var(--bg-primary);
// //       --c-border: var(--border-secondary);
// //       --c-text: var(--text-primary);
// //       --c-text-muted: var(--text-secondary);
// //       --c-accent: var(--accent-primary);
      
// //       --pill-meeting-bg: #e0f2fe; --pill-meeting-text: #0284c7;
// //       --pill-task-bg: #dcfce7; --pill-task-text: #16a34a;
// //       --pill-note-bg: #f3f4f6; --pill-note-text: #4b5563;
// //     }

// //     .calendar-container {
// //       height: 100%;
// //       display: flex;
// //       flex-direction: column;
// //       background: var(--c-bg);
// //       border-radius: 12px;
// //       overflow: hidden;
// //     }

// //     /* HEADER */
// //     .cal-header {
// //       padding: 1rem 1.5rem;
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       border-bottom: 1px solid var(--c-border);
// //       background: var(--c-bg);
// //       flex-shrink: 0;

// //       .cal-nav-group {
// //         display: flex; align-items: center; gap: 1rem;
        
// //         .month-label {
// //           font-size: 1.25rem; font-weight: 700; color: var(--c-text); margin: 0; min-width: 160px;
// //         }

// //         .nav-arrows {
// //           display: flex; gap: 4px;
// //           .btn-icon {
// //             width: 32px; height: 32px;
// //             border: 1px solid var(--c-border); background: transparent;
// //             border-radius: 6px; color: var(--c-text-muted); cursor: pointer;
// //             display: flex; align-items: center; justify-content: center;
// //             &:hover { background: var(--bg-secondary); color: var(--c-text); }
// //           }
// //         }

// //         .btn-today {
// //           padding: 6px 12px; border: 1px solid var(--c-border); background: transparent;
// //           border-radius: 6px; font-weight: 600; font-size: 0.85rem; color: var(--c-text);
// //           cursor: pointer;
// //           &:hover { background: var(--bg-secondary); }
// //         }
// //       }

// //       .cal-actions-group {
// //         display: flex; align-items: center; gap: 1rem;

// //         .scope-toggle {
// //           background: var(--bg-secondary); padding: 3px; border-radius: 8px; display: flex;
// //           button {
// //             border: none; background: transparent; padding: 6px 12px; font-size: 0.8rem; font-weight: 600;
// //             color: var(--c-text-muted); border-radius: 6px; cursor: pointer; transition: all 0.2s;
// //             &.active { background: var(--c-bg); color: var(--c-text); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
// //           }
// //         }

// //         .btn-icon-secondary {
// //           width: 34px; height: 34px; border: none; background: transparent; 
// //           color: var(--c-text-muted); cursor: pointer; border-radius: 6px;
// //           &:hover { background: var(--bg-secondary); color: var(--c-text); }
// //         }
// //       }
// //     }

// //     /* GRID LAYOUT */
// //     .cal-grid {
// //       flex: 1;
// //       display: flex;
// //       flex-direction: column;
// //       overflow: hidden;
// //     }

// //     .weekday-header-row {
// //       display: grid;
// //       grid-template-columns: repeat(7, 1fr);
// //       border-bottom: 1px solid var(--c-border);
// //       background: var(--bg-secondary);
// //       flex-shrink: 0;
      
// //       .weekday-cell {
// //         padding: 8px; text-align: center; font-size: 0.75rem; font-weight: 700;
// //         text-transform: uppercase; color: var(--c-text-muted); letter-spacing: 0.5px;
// //       }
// //     }

// //     .days-grid {
// //       flex: 1;
// //       display: grid;
// //       grid-template-columns: repeat(7, 1fr);
// //       grid-auto-rows: 1fr; /* Equal height rows */
// //       overflow-y: auto;
// //       position: relative;
// //     }

// //     .cal-loading-overlay {
// //       position: absolute; inset: 0; background: rgba(255,255,255,0.6); backdrop-filter: blur(2px);
// //       z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--c-accent);
// //     }

// //     /* DAY CELL */
// //     .day-cell {
// //       border-right: 1px solid var(--c-border);
// //       border-bottom: 1px solid var(--c-border);
// //       padding: 6px;
// //       display: flex; flex-direction: column;
// //       position: relative;
// //       background: var(--c-bg);
// //       cursor: pointer;
// //       min-height: 100px;
// //       transition: background 0.15s;

// //       /* Heatmap Intensity Backgrounds */
// //       &[data-intensity="1"] { background: color-mix(in srgb, var(--c-accent) 4%, var(--c-bg)); }
// //       &[data-intensity="2"] { background: color-mix(in srgb, var(--c-accent) 10%, var(--c-bg)); }
// //       &[data-intensity="3"] { background: color-mix(in srgb, var(--c-accent) 18%, var(--c-bg)); }
// //       &[data-intensity="4"] { background: color-mix(in srgb, var(--c-accent) 28%, var(--c-bg)); }

// //       &:hover {
// //         background: var(--bg-secondary) !important;
// //         .cell-hover-action { opacity: 1; transform: scale(1); }
// //       }

// //       &.outside-month {
// //         background: repeating-linear-gradient(45deg, var(--bg-secondary), var(--bg-secondary) 10px, var(--c-bg) 10px, var(--c-bg) 20px);
// //         opacity: 0.7;
// //         .day-number { color: var(--c-text-muted); opacity: 0.6; }
// //       }

// //       &.is-today {
// //         .day-number {
// //           background: var(--c-accent); color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
// //         }
// //       }

// //       .day-header {
// //         display: flex; justify-content: flex-end; align-items: baseline; gap: 6px; margin-bottom: 6px;
// //         .month-start { font-size: 0.75rem; font-weight: 700; color: var(--c-text); }
// //         .day-number {
// //           font-size: 0.85rem; font-weight: 600; width: 26px; height: 26px;
// //           display: flex; align-items: center; justify-content: center; border-radius: 50%;
// //           color: var(--c-text); transition: all 0.2s;
// //         }
// //       }

// //       .cell-hover-action {
// //         position: absolute; bottom: 8px; right: 8px;
// //         width: 24px; height: 24px; border-radius: 50%;
// //         background: var(--c-accent); color: white;
// //         display: flex; align-items: center; justify-content: center;
// //         opacity: 0; transform: scale(0.8); transition: all 0.2s;
// //         font-size: 10px; z-index: 5;
// //       }
// //     }

// //     /* EVENT PILLS */
// //     .events-stack {
// //       display: flex; flex-direction: column; gap: 3px; flex: 1;
// //     }

// //     .event-pill {
// //       display: flex; align-items: center; gap: 5px;
// //       padding: 2px 6px; border-radius: 4px;
// //       font-size: 0.7rem; font-weight: 500;
// //       background: var(--pill-note-bg); color: var(--pill-note-text);
// //       border: 1px solid transparent; cursor: pointer;
// //       transition: all 0.1s;
      
// //       &:hover { transform: translateY(-1px); filter: brightness(0.97); z-index: 2; }
      
// //       .pill-marker { width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: 0.7; flex-shrink: 0; }
// //       .pill-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
// //       .pill-time { opacity: 0.8; font-size: 0.65rem; margin-left: auto; }

// //       /* Variants */
// //       &.type-meeting { background: var(--pill-meeting-bg); color: var(--pill-meeting-text); }
// //       &.type-task { 
// //         background: var(--pill-task-bg); color: var(--pill-task-text); 
// //         .pill-marker { border-radius: 1px; } 
// //       }
// //       &.status-completed { opacity: 0.6; text-decoration: line-through; background: transparent; border: 1px dashed var(--c-border); }
// //     }

// //     .more-indicator {
// //       font-size: 0.65rem; color: var(--c-text-muted); font-weight: 600; padding-left: 6px;
// //     }
// //   `]
// // })
// // export class CalendarViewComponent implements OnInit {
// //   private noteService = inject(NoteService);
// //   private dialogServices = inject(DynamicDialogServices);
// //   private router = inject(Router);

// //   // Constants
// //   readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// //   // Signals
// //   currentDate = signal(new Date());
// //   events = signal<CalendarEvent[]>([]);
// //   heatmapData = signal<Record<string, { count: number, intensity: number }>>({});
// //   isLoading = signal(false);
// //   viewScope = signal<'personal' | 'shared'>('personal');

// //   // Computed Grid
// //   gridCells = computed(() => {
// //     const curr = this.currentDate();
// //     const year = curr.getFullYear();
// //     const month = curr.getMonth();

// //     // 1. Determine start date (Sunday before or on the 1st)
// //     const firstOfMonth = new Date(year, month, 1);
// //     const startDay = firstOfMonth.getDay(); // 0=Sun
// //     const startDate = new Date(firstOfMonth);
// //     startDate.setDate(1 - startDay);

// //     const heatmap = this.heatmapData();
// //     const allEvents = this.events();
// //     const cells: CalendarGridCell[] = [];

// //     // 2. Build 42 cells (6 rows * 7 cols)
// //     for (let i = 0; i < 42; i++) {
// //       const date = new Date(startDate);
// //       date.setDate(startDate.getDate() + i);
// //       const dateStr = this.formatDateIso(date);

// //       // Determine Intensity
// //       let intensity = 0;
// //       if (this.viewScope() === 'personal') {
// //          const data = heatmap[dateStr];
// //          if (data) {
// //            intensity = typeof data.intensity === 'number' 
// //              ? Math.ceil(data.intensity * 4) 
// //              : Math.min(Math.ceil(data.count / 2), 4);
// //          }
// //       }

// //       // Filter Events for this day
// //       // Sorting: Meetings first, then by time
// //       const dayEvents = allEvents
// //         .filter(e => this.isSameDay(new Date(e.start), date))
// //         .sort((a, b) => {
// //            if (a.extendedProps?.isMeeting && !b.extendedProps?.isMeeting) return -1;
// //            if (!a.extendedProps?.isMeeting && b.extendedProps?.isMeeting) return 1;
// //            return new Date(a.start).getTime() - new Date(b.start).getTime();
// //         });

// //       cells.push({
// //         date,
// //         dateStr,
// //         dayNum: date.getDate(),
// //         isToday: this.isSameDay(date, new Date()),
// //         isCurrentMonth: date.getMonth() === month,
// //         isWeekend: date.getDay() === 0 || date.getDay() === 6,
// //         intensity,
// //         events: dayEvents
// //       });
// //     }
// //     return cells;
// //   });

// //   ngOnInit() {
// //     this.loadData();
// //   }

// //   loadData() {
// //     this.isLoading.set(true);
// //     const curr = this.currentDate();
// //     const year = curr.getFullYear();
// //     const month = curr.getMonth();

// //     // Fetch range: -7 days to +45 days from 1st of month to cover grid
// //     const start = new Date(year, month, 1);
// //     start.setDate(start.getDate() - 7);
// //     const end = new Date(year, month + 1, 14);

// //     const startStr = start.toISOString();
// //     const endStr = end.toISOString();

// //     const requests: any = {
// //       events: this.noteService.getCalendarView(startStr, endStr, 'month')
// //     };

// //     if (this.viewScope() === 'personal') {
// //       requests.heatmap = this.noteService.getHeatMapData(startStr, endStr);
// //     }

// //     forkJoin(requests)
// //       .pipe(finalize(() => this.isLoading.set(false)))
// //       .subscribe({
// //         next: (res: any) => {
// //           this.events.set(res.events.data?.events || []);
          
// //           if (res.heatmap?.data?.heatMap) {
// //             const raw = res.heatmap.data.heatMap;
// //             // Normalize Array vs Object response
// //             const map: Record<string, any> = {};
// //             if (Array.isArray(raw)) {
// //               raw.forEach(item => { if(item.date) map[item.date] = item; });
// //             } else {
// //               Object.assign(map, raw);
// //             }
// //             this.heatmapData.set(map);
// //           } else {
// //             this.heatmapData.set({});
// //           }
// //         },
// //         error: (err) => console.error('Calendar load failed', err)
// //       });
// //   }

// //   // --- Actions ---

// //   changeMonth(delta: number) {
// //     const d = new Date(this.currentDate());
// //     d.setMonth(d.getMonth() + delta);
// //     this.currentDate.set(d);
// //     this.loadData();
// //   }

// //   jumpToToday() {
// //     this.currentDate.set(new Date());
// //     this.loadData();
// //   }

// //   toggleScope(scope: 'personal' | 'shared') {
// //     this.viewScope.set(scope);
// //     this.loadData();
// //   }

// //   onDateClick(date: Date) {
// //     this.router.navigate(['/notes/create'], { 
// //       queryParams: { date: this.formatDateIso(date) } 
// //     });
// //   }

// //   onEventClick(id: string, event: Event) {
// //     event.stopPropagation();
// //     const noteId = id.replace(/^(meeting_|task_)/, '');
// //     this.router.navigate(['/notes', noteId]);
// //   }

// //   openAnalytics() {
// //     this.dialogServices.openAnalyticsDialog();
// //   }

// //   // --- Helpers ---

// //   private formatDateIso(date: Date): string {
// //     const y = date.getFullYear();
// //     const m = String(date.getMonth() + 1).padStart(2, '0');
// //     const d = String(date.getDate()).padStart(2, '0');
// //     return `${y}-${m}-${d}`;
// //   }

// //   private isSameDay(d1: Date, d2: Date) {
// //     return d1.getFullYear() === d2.getFullYear() &&
// //            d1.getMonth() === d2.getMonth() &&
// //            d1.getDate() === d2.getDate();
// //   }

// //   isMeeting(evt: CalendarEvent) {
// //     return evt.extendedProps?.noteType === 'meeting' || evt.extendedProps?.isMeeting;
// //   }

// //   isTask(evt: CalendarEvent) {
// //     return evt.extendedProps?.noteType === 'task';
// //   }

// //   isCompleted(evt: CalendarEvent) {
// //     return evt.extendedProps?.status === 'completed';
// //   }
// // }

// // // import { Component, computed, inject, signal, OnInit, ViewEncapsulation } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { Router } from '@angular/router';
// // // import { forkJoin } from 'rxjs';
// // // import { CalendarEvent } from '../../../core/models/note.types';
// // // import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// // // import { NoteService } from '../../../core/services/notes.service';

// // // interface CalendarGridCell {
// // //   date: Date;
// // //   dateStr: string;
// // //   dayNum: number;
// // //   isToday: boolean;
// // //   isCurrentMonth: boolean;
// // //   isWeekend: boolean;
// // //   intensity: number; // 0-4 scale for heatmap
// // //   events: CalendarEvent[];
// // // }

// // // @Component({
// // //   selector: 'app-calendar-view',
// // //   standalone: true,
// // //   imports: [CommonModule],
// // //   encapsulation: ViewEncapsulation.None,
// // //   template: `
// // //     <div class="calendar-layout">

// // //       <!-- ==================== HEADER ==================== -->
// // //       <header class="cal-header">
// // //         <div class="cal-controls-left">
// // //           <button class="btn-today" (click)="jumpToToday()">Today</button>
// // //           <div class="nav-arrows">
// // //             <button class="btn-icon" (click)="changeMonth(-1)"><i class="pi pi-chevron-left"></i></button>
// // //             <button class="btn-icon" (click)="changeMonth(1)"><i class="pi pi-chevron-right"></i></button>
// // //           </div>
// // //           <h2 class="month-title">{{ currentDate() | date: 'MMMM yyyy' }}</h2>
// // //         </div>

// // //         <div class="cal-controls-right">
// // //           <div class="view-segmented-control">
// // //             <button [class.selected]="viewScope() === 'personal'" (click)="toggleScope('personal')">My Notes</button>
// // //             <button [class.selected]="viewScope() === 'shared'" (click)="toggleScope('shared')">Shared</button>
// // //           </div>
// // //           <button class="btn-icon primary" (click)="openAnalytics()" title="Analytics">
// // //             <i class="pi pi-chart-bar"></i>
// // //           </button>
// // //         </div>
// // //       </header>

// // //       <!-- ==================== GRID ==================== -->
// // //       <div class="cal-grid-wrapper">
        
// // //         <!-- Days Header -->
// // //         <div class="cal-days-header">
// // //           @for (day of weekDays; track day) {
// // //             <div class="weekday-label">{{ day }}</div>
// // //           }
// // //         </div>

// // //         <!-- Days Body -->
// // //         <div class="cal-grid-body">
// // //           @if (isLoading()) {
// // //             <div class="loading-overlay">
// // //               <div class="spinner"></div>
// // //             </div>
// // //           }

// // //           @for (cell of calendarGrid(); track cell.dateStr) {
// // //             <div class="cal-cell" 
// // //                  [class.other-month]="!cell.isCurrentMonth"
// // //                  [class.is-today]="cell.isToday"
// // //                  [class.is-weekend]="cell.isWeekend"
// // //                  [attr.data-intensity]="cell.intensity"
// // //                  (click)="onDateClick(cell.date)">
              
// // //               <!-- Date Header in Cell -->
// // //               <div class="cell-date-row">
// // //                 <span class="day-num">{{ cell.dayNum }}</span>
// // //                 @if (cell.dayNum === 1) {
// // //                   <span class="month-start-label">{{ cell.date | date:'MMM' }}</span>
// // //                 }
// // //               </div>

// // //               <!-- Events Container -->
// // //               <div class="cell-events">
// // //                 @for (event of cell.events | slice:0:4; track event.id) {
// // //                   <div class="event-pill"
// // //                        [class.meeting]="event.extendedProps.noteType === 'meeting' || event.extendedProps.isMeeting"
// // //                        [class.task]="event.extendedProps.noteType === 'task'"
// // //                        [class.completed]="event.extendedProps.status === 'completed'"
// // //                        [title]="event.title"
// // //                        (click)="onEventClick(event.id, $event)">
// // //                     <span class="pill-dot"></span>
// // //                     <span class="pill-text">{{ event.title }}</span>
// // //                     @if (event.extendedProps.noteType === 'meeting') {
// // //                       <span class="pill-time">{{ event.start | date:'shortTime' }}</span>
// // //                     }
// // //                   </div>
// // //                 }
// // //                 @if (cell.events.length > 4) {
// // //                   <div class="more-events">+{{ cell.events.length - 4 }} more</div>
// // //                 }
// // //               </div>

// // //               <!-- Hover Add Button -->
// // //               <button class="btn-cell-add"><i class="pi pi-plus"></i></button>
// // //             </div>
// // //           }
// // //         </div>
// // //       </div>
// // //     </div>
// // //   `,
// // //   styles: [`
// // //     :host {
// // //       display: block;
// // //       height: 100%;
// // //       --cal-bg: var(--bg-primary);
// // //       --cal-header-bg: var(--bg-primary);
// // //       --cal-border: var(--border-secondary);
// // //       --cal-text: var(--text-primary);
// // //       --cal-text-muted: var(--text-secondary);
// // //       --cal-accent: var(--accent-primary);
// // //       --cal-today-bg: var(--accent-primary);
// // //       --cal-today-text: #ffffff;
// // //       --cal-weekend-bg: color-mix(in srgb, var(--bg-ternary) 50%, transparent);
      
// // //       /* Event Colors */
// // //       --evt-meeting-bg: #e0f2fe; --evt-meeting-text: #0369a1; --evt-meeting-border: #7dd3fc;
// // //       --evt-task-bg: #dcfce7; --evt-task-text: #15803d; --evt-task-border: #86efac;
// // //       --evt-note-bg: #f3f4f6; --evt-note-text: #374151; --evt-note-border: #d1d5db;
// // //     }

// // //     .calendar-layout {
// // //       display: flex;
// // //       flex-direction: column;
// // //       height: 100%;
// // //       background: var(--cal-bg);
// // //       border: 1px solid var(--cal-border);
// // //       border-radius: var(--ui-border-radius-xl);
// // //       overflow: hidden;
// // //     }

// // //     /* --- Header --- */
// // //     .cal-header {
// // //       display: flex;
// // //       justify-content: space-between;
// // //       align-items: center;
// // //       padding: 16px 24px;
// // //       background: var(--cal-header-bg);
// // //       border-bottom: 1px solid var(--cal-border);
// // //       flex-shrink: 0;

// // //       .cal-controls-left {
// // //         display: flex;
// // //         align-items: center;
// // //         gap: 16px;

// // //         .month-title {
// // //           font-family: var(--font-heading);
// // //           font-size: 1.5rem;
// // //           font-weight: 700;
// // //           color: var(--cal-text);
// // //           margin: 0;
// // //           min-width: 180px;
// // //         }

// // //         .btn-today {
// // //           padding: 6px 16px;
// // //           border: 1px solid var(--cal-border);
// // //           background: transparent;
// // //           border-radius: 6px;
// // //           font-weight: 600;
// // //           color: var(--cal-text);
// // //           cursor: pointer;
// // //           transition: 0.2s;
// // //           &:hover { background: var(--bg-ternary); }
// // //         }

// // //         .nav-arrows {
// // //           display: flex;
// // //           gap: 4px;
// // //           .btn-icon {
// // //             width: 32px; height: 32px;
// // //             border: none; background: transparent;
// // //             border-radius: 50%;
// // //             cursor: pointer;
// // //             color: var(--cal-text);
// // //             display: flex; align-items: center; justify-content: center;
// // //             &:hover { background: var(--bg-ternary); }
// // //           }
// // //         }
// // //       }

// // //       .cal-controls-right {
// // //         display: flex;
// // //         align-items: center;
// // //         gap: 16px;

// // //         .view-segmented-control {
// // //           display: flex;
// // //           background: var(--bg-ternary);
// // //           padding: 3px;
// // //           border-radius: 8px;
          
// // //           button {
// // //             border: none; background: transparent;
// // //             padding: 6px 12px;
// // //             font-size: 12px; font-weight: 600;
// // //             color: var(--cal-text-muted);
// // //             border-radius: 6px;
// // //             cursor: pointer;
// // //             transition: 0.2s;
// // //             &.selected { background: var(--cal-bg); color: var(--cal-text); box-shadow: var(--shadow-sm); }
// // //           }
// // //         }

// // //         .btn-icon {
// // //           width: 36px; height: 36px;
// // //           border: 1px solid var(--cal-border);
// // //           border-radius: 8px;
// // //           background: transparent;
// // //           color: var(--cal-text-muted);
// // //           cursor: pointer;
// // //           display: flex; align-items: center; justify-content: center;
// // //           &.primary:hover { border-color: var(--cal-accent); color: var(--cal-accent); }
// // //         }
// // //       }
// // //     }

// // //     /* --- Grid Wrapper --- */
// // //     .cal-grid-wrapper {
// // //       flex: 1;
// // //       display: flex;
// // //       flex-direction: column;
// // //       overflow: hidden; /* Ensure grid scrolls internally if needed */
// // //     }

// // //     /* --- Days Header --- */
// // //     .cal-days-header {
// // //       display: grid;
// // //       grid-template-columns: repeat(7, 1fr);
// // //       border-bottom: 1px solid var(--cal-border);
// // //       background: var(--bg-ternary);
      
// // //       .weekday-label {
// // //         padding: 10px;
// // //         text-align: center;
// // //         font-size: 11px;
// // //         font-weight: 700;
// // //         text-transform: uppercase;
// // //         color: var(--cal-text-muted);
// // //         border-right: 1px solid var(--cal-border);
// // //         &:last-child { border-right: none; }
// // //       }
// // //     }

// // //     /* --- Grid Body --- */
// // //     .cal-grid-body {
// // //       flex: 1;
// // //       display: grid;
// // //       grid-template-columns: repeat(7, 1fr);
// // //       grid-template-rows: repeat(6, 1fr); /* Force 6 rows to fill height equally */
// // //       position: relative;
// // //     }

// // //     .cal-cell {
// // //       /* Stronger borders for better visibility */
// // //       border-right: 1px solid var(--cal-border);
// // //       border-bottom: 1px solid var(--cal-border);
// // //       background: var(--cal-bg);
// // //       padding: 8px;
// // //       display: flex;
// // //       flex-direction: column;
// // //       position: relative;
// // //       cursor: pointer;
// // //       transition: background 0.1s;
// // //       min-height: 0; 

// // //       /* Heatmap Intensities - Using opaque mix to ensure visibility over borders if needed, 
// // //          or relying on distinct background colors */
// // //       &[data-intensity="1"] { background: color-mix(in srgb, var(--cal-accent) 5%, var(--cal-bg)); }
// // //       &[data-intensity="2"] { background: color-mix(in srgb, var(--cal-accent) 15%, var(--cal-bg)); }
// // //       &[data-intensity="3"] { background: color-mix(in srgb, var(--cal-accent) 25%, var(--cal-bg)); }
// // //       &[data-intensity="4"] { background: color-mix(in srgb, var(--cal-accent) 40%, var(--cal-bg)); }

// // //       /* Modifiers */
// // //       &.other-month { 
// // //         background: repeating-linear-gradient(
// // //           45deg,
// // //           var(--bg-ternary),
// // //           var(--bg-ternary) 10px,
// // //           var(--cal-bg) 10px,
// // //           var(--cal-bg) 20px
// // //         );
// // //         .day-num { color: var(--cal-text-muted); opacity: 0.5; }
// // //       }
      
// // //       &.is-weekend:not(.other-month):not([data-intensity]) { background: var(--cal-weekend-bg); }

// // //       &:hover {
// // //         background: var(--bg-hover) !important;
// // //         .btn-cell-add { opacity: 1; transform: scale(1); }
// // //       }

// // //       /* Date Row */
// // //       .cell-date-row {
// // //         display: flex;
// // //         justify-content: flex-end; 
// // //         align-items: baseline;
// // //         gap: 6px;
// // //         margin-bottom: 6px;

// // //         .day-num {
// // //           font-size: 13px;
// // //           font-weight: 600;
// // //           color: var(--cal-text);
// // //           width: 26px; height: 26px;
// // //           display: flex; align-items: center; justify-content: center;
// // //           border-radius: 50%;
// // //         }

// // //         .month-start-label {
// // //           font-size: 12px; font-weight: 700; color: var(--cal-text);
// // //         }
// // //       }

// // //       &.is-today .day-num {
// // //         background: var(--cal-today-bg);
// // //         color: var(--cal-today-text);
// // //       }

// // //       /* Add Button Overlay */
// // //       .btn-cell-add {
// // //         position: absolute;
// // //         bottom: 8px; right: 8px;
// // //         width: 24px; height: 24px;
// // //         border-radius: 50%;
// // //         background: var(--cal-accent);
// // //         color: white;
// // //         border: none;
// // //         display: flex; align-items: center; justify-content: center;
// // //         opacity: 0;
// // //         transform: scale(0.8);
// // //         transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
// // //         cursor: pointer;
// // //         z-index: 5;
// // //         font-size: 10px;
// // //       }

// // //       /* Events Container */
// // //       .cell-events {
// // //         display: flex;
// // //         flex-direction: column;
// // //         gap: 3px;
// // //         flex: 1;
// // //         overflow: hidden;
// // //       }

// // //       /* Event Pill */
// // //       .event-pill {
// // //         display: flex;
// // //         align-items: center;
// // //         gap: 6px;
// // //         padding: 2px 6px;
// // //         border-radius: 4px;
// // //         font-size: 11px;
// // //         border: 1px solid var(--evt-note-border);
// // //         background: var(--evt-note-bg);
// // //         color: var(--evt-note-text);
// // //         cursor: pointer;
// // //         transition: transform 0.1s;
        
// // //         &:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); z-index: 2; }

// // //         .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; opacity: 0.7; }
// // //         .pill-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; flex: 1; }
// // //         .pill-time { font-size: 10px; opacity: 0.8; margin-left: 4px; }

// // //         /* Specific Styles */
// // //         &.meeting { 
// // //           background: var(--evt-meeting-bg); 
// // //           border-color: var(--evt-meeting-border); 
// // //           color: var(--evt-meeting-text); 
// // //         }
// // //         &.task { 
// // //           background: var(--evt-task-bg); 
// // //           border-color: var(--evt-task-border); 
// // //           color: var(--evt-task-text); 
// // //           .pill-dot { border-radius: 2px; } /* Square dot for tasks */
// // //         }
// // //         &.completed { 
// // //           opacity: 0.6; text-decoration: line-through; 
// // //           background: transparent; border-style: dashed;
// // //         }
// // //       }

// // //       .more-events {
// // //         font-size: 10px; font-weight: 600; color: var(--cal-text-muted);
// // //         padding-left: 6px; margin-top: 2px;
// // //       }
// // //     }

// // //     /* Loading */
// // //     .loading-overlay {
// // //       position: absolute; inset: 0;
// // //       background: rgba(255,255,255,0.5);
// // //       backdrop-filter: blur(2px);
// // //       z-index: 10;
// // //       display: flex; align-items: center; justify-content: center;
// // //       .spinner {
// // //         width: 32px; height: 32px;
// // //         border: 3px solid var(--cal-border);
// // //         border-top-color: var(--cal-accent);
// // //         border-radius: 50%;
// // //         animation: spin 0.8s linear infinite;
// // //       }
// // //     }
// // //     @keyframes spin { to { transform: rotate(360deg); } }
// // //   `]
// // // })
// // // export class CalendarViewComponent implements OnInit {
// // //   private noteService = inject(NoteService);
// // //   private dialogServices = inject(DynamicDialogServices);
// // //   private router = inject(Router);

// // //   weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// // //   currentDate = signal(new Date());
// // //   events = signal<CalendarEvent[]>([]);
// // //   heatmapData = signal<Record<string, { count: number, intensity: number }>>({});
// // //   isLoading = signal(false);
// // //   viewScope = signal<'personal' | 'shared'>('personal');

// // //   // --- Grid Computation ---
// // //   calendarGrid = computed<CalendarGridCell[]>(() => {
// // //     const curr = this.currentDate();
// // //     const year = curr.getFullYear();
// // //     const month = curr.getMonth();

// // //     const firstDayOfMonth = new Date(year, month, 1);
// // //     const startDayOfWeek = firstDayOfMonth.getDay(); 
    
// // //     const startDate = new Date(firstDayOfMonth);
// // //     startDate.setDate(startDate.getDate() - startDayOfWeek);

// // //     const cells: CalendarGridCell[] = [];
// // //     const allEvents = this.events();
// // //     const heatmap = this.heatmapData();

// // //     // 6 weeks * 7 days = 42 cells
// // //     for (let i = 0; i < 42; i++) {
// // //       const date = new Date(startDate);
// // //       date.setDate(startDate.getDate() + i);
      
// // //       const dateStr = this.getLocalISODate(date);
// // //       const isCurrentMonth = date.getMonth() === month;
      
// // //       // Heatmap logic (intensity 0-4)
// // //       // Check if heatmap is a map or an array (safety check)
// // //       let dayData: any = null;
// // //       if (this.viewScope() === 'personal') {
// // //         if (Array.isArray(heatmap)) {
// // //            dayData = heatmap.find((h: any) => h.date === dateStr);
// // //         } else {
// // //            dayData = heatmap[dateStr];
// // //         }
// // //       }
      
// // //       // Calculate intensity: If dayData exists, use intensity or map count to intensity
// // //       let intensity = 0;
// // //       if (dayData) {
// // //         if (typeof dayData.intensity === 'number') {
// // //            intensity = Math.ceil(dayData.intensity * 4);
// // //         } else if (dayData.count) {
// // //            // Fallback: Map count to intensity if backend doesn't provide intensity
// // //            intensity = Math.min(Math.ceil(dayData.count / 2), 4);
// // //         }
// // //       }

// // //       // Filter events
// // //       const dayEvents = allEvents.filter(e => {
// // //         const evtDate = e.start instanceof Date ? e.start : new Date(e.start);
// // //         return this.getLocalISODate(evtDate) === dateStr;
// // //       });

// // //       cells.push({
// // //         date: date,
// // //         dateStr: dateStr,
// // //         dayNum: date.getDate(),
// // //         isToday: this.isToday(date),
// // //         isCurrentMonth: isCurrentMonth,
// // //         isWeekend: date.getDay() === 0 || date.getDay() === 6,
// // //         intensity: intensity,
// // //         events: dayEvents
// // //       });
// // //     }
// // //     return cells;
// // //   });

// // //   ngOnInit() {
// // //     this.fetchData();
// // //   }

// // //   fetchData() {
// // //     this.isLoading.set(true);
// // //     const y = this.currentDate().getFullYear();
// // //     const m = this.currentDate().getMonth();

// // //     // Calculate boundary for API
// // //     const start = new Date(y, m, 1);
// // //     start.setDate(start.getDate() - 7); // Buffer
// // //     const end = new Date(y, m + 1, 0);
// // //     end.setDate(end.getDate() + 14); // Buffer

// // //     const startStr = start.toISOString();
// // //     const endStr = end.toISOString();

// // //     const requests: any = {
// // //       eventsRes: this.noteService.getCalendarView(startStr, endStr, 'month'),
// // //     };

// // //     if (this.viewScope() === 'personal') {
// // //       requests.heatmapRes = this.noteService.getHeatMapData(startStr, endStr);
// // //     }

// // //     forkJoin(requests).subscribe({
// // //       next: (results: any) => {
// // //         let fetchedEvents = results.eventsRes.data.events;
// // //         this.events.set(fetchedEvents);
        
// // //         if (results.heatmapRes) {
// // //           // Ensure we handle both array and object responses for robustness
// // //           const rawHeatmap = results.heatmapRes.data.heatMap;
// // //           if (Array.isArray(rawHeatmap)) {
// // //              // Convert array to map for easier lookup if needed, or store as is since we handle array in computed
// // //              const map: Record<string, any> = {};
// // //              rawHeatmap.forEach((item: any) => {
// // //                // Assuming item has date field YYYY-MM-DD
// // //                if(item.date) map[item.date] = item;
// // //              });
// // //              this.heatmapData.set(map as any);
// // //           } else {
// // //              this.heatmapData.set(rawHeatmap as any);
// // //           }
// // //         } else {
// // //           this.heatmapData.set({});
// // //         }
        
// // //         this.isLoading.set(false);
// // //       },
// // //       error: (err) => {
// // //         console.error('Calendar Fetch Error', err);
// // //         this.isLoading.set(false);
// // //       }
// // //     });
// // //   }

// // //   private getLocalISODate(date: Date): string {
// // //     const year = date.getFullYear();
// // //     const month = String(date.getMonth() + 1).padStart(2, '0');
// // //     const day = String(date.getDate()).padStart(2, '0');
// // //     return `${year}-${month}-${day}`;
// // //   }

// // //   changeMonth(delta: number) {
// // //     const date = new Date(this.currentDate());
// // //     date.setMonth(date.getMonth() + delta);
// // //     this.currentDate.set(date);
// // //     this.fetchData();
// // //   }

// // //   jumpToToday() {
// // //     this.currentDate.set(new Date());
// // //     this.fetchData();
// // //   }

// // //   toggleScope(scope: 'personal' | 'shared') {
// // //     this.viewScope.set(scope);
// // //     this.fetchData(); 
// // //   }

// // //   openAnalytics() {
// // //     this.dialogServices.openAnalyticsDialog();
// // //   }

// // //   onEventClick(id: string, event: Event) {
// // //     event.stopPropagation();
// // //     const realId = id.startsWith('meeting_') ? id.replace('meeting_', '') : id;
// // //     this.router.navigate(['/notes', realId]);
// // //   }

// // //   onDateClick(date: Date) {
// // //     const dateStr = this.getLocalISODate(date);
// // //     this.router.navigate(['/notes/create'], { queryParams: { date: dateStr } });
// // //   }

// // //   isToday(date: Date) {
// // //     const today = new Date();
// // //     return date.getDate() === today.getDate() &&
// // //            date.getMonth() === today.getMonth() &&
// // //            date.getFullYear() === today.getFullYear();
// // //   }
// // // }

// // // // import { Component, computed, inject, signal, OnInit, effect } from '@angular/core';
// // // // import { CommonModule } from '@angular/common';
// // // // import { Router } from '@angular/router';
// // // // import { forkJoin } from 'rxjs';
// // // // import { CalendarEvent, DailyNoteCount } from '../../../core/models/note.types';
// // // // import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// // // // import { NoteService } from '../../../core/services/notes.service';

// // // // interface CalendarGridCell {
// // // //   date: Date;
// // // //   dateStr: string;
// // // //   dayNum: number;
// // // //   isToday: boolean;
// // // //   isCurrentMonth: boolean;
// // // //   intensity: number; // 0-4 scale for heatmap
// // // //   events: CalendarEvent[];
// // // // }

// // // // @Component({
// // // //   selector: 'app-calendar-view',
// // // //   standalone: true,
// // // //   imports: [CommonModule],
// // // //   template: `
// // // //     <div class="calendar-container">

// // // //       <!-- ==================== HEADER ==================== -->
// // // //       <header class="calendar-header glass-panel">
// // // //         <div class="header-left">
// // // //           <div class="title-group">
// // // //             <h2 class="month-label">{{ currentDate() | date: 'MMMM yyyy' }}</h2>
// // // //             <div class="loading-indicator" *ngIf="isLoading()">
// // // //               <div class="spinner-dot"></div>
// // // //             </div>
// // // //           </div>
          
// // // //           <div class="nav-controls">
// // // //             <button class="btn-icon" (click)="changeMonth(-1)" title="Previous Month">
// // // //               <i class="pi pi-chevron-left"></i>
// // // //             </button>
// // // //             <button class="btn-text" (click)="jumpToToday()">Today</button>
// // // //             <button class="btn-icon" (click)="changeMonth(1)" title="Next Month">
// // // //               <i class="pi pi-chevron-right"></i>
// // // //             </button>
// // // //           </div>
// // // //         </div>

// // // //         <div class="header-right">
// // // //           <!-- View Toggles -->
// // // //           <div class="toggle-group">
// // // //             <button class="btn-toggle" [class.active]="viewScope() === 'personal'" (click)="toggleScope('personal')">My Notes</button>
// // // //             <button class="btn-toggle" [class.active]="viewScope() === 'shared'" (click)="toggleScope('shared')">Shared</button>
// // // //           </div>

// // // //           <div class="divider-v"></div>

// // // //           <!-- Analytics Trigger -->
// // // //           <button class="btn-icon-lg" (click)="openAnalytics()" title="View Analytics">
// // // //             <i class="pi pi-chart-bar"></i>
// // // //           </button>
// // // //         </div>
// // // //       </header>

// // // //       <!-- ==================== CALENDAR GRID ==================== -->
// // // //       <div class="calendar-wrapper glass-panel">
        
// // // //         <!-- Weekday Headers -->
// // // //         <div class="weekday-row">
// // // //           @for (day of weekDays; track day) {
// // // //             <div class="weekday">{{ day }}</div>
// // // //           }
// // // //         </div>

// // // //         <!-- Days -->
// // // //         <div class="days-grid">
// // // //           @for (cell of calendarGrid(); track cell.dateStr) {
// // // //             <div 
// // // //               class="day-cell"
// // // //               [class.other-month]="!cell.isCurrentMonth"
// // // //               [class.is-today]="cell.isToday"
// // // //               [attr.data-intensity]="cell.intensity"
// // // //               (click)="onDateClick(cell.date)"
// // // //             >
// // // //               <!-- Date Number & Add Button -->
// // // //               <div class="cell-top">
// // // //                 <span class="day-number">{{ cell.dayNum }}</span>
// // // //                 <button class="btn-add-mini" title="Add Note">+</button>
// // // //               </div>

// // // //               <!-- Events List -->
// // // //               <div class="events-stack">
// // // //                 @for (event of cell.events | slice:0:4; track event.id) {
// // // //                   <div 
// // // //                 class="event-chip"
// // // // [class.type-meeting]="event.extendedProps.isMeeting || event.extendedProps.noteType === 'meeting'"
// // // // [class.type-task]="event.extendedProps.noteType === 'task'"
// // // // [class.type-note]="event.extendedProps.noteType === 'note'"
// // // // [class.status-done]="event.extendedProps.status === 'completed'"
// // // // [class.priority-urgent]="event.extendedProps.priority === 'urgent'"
// // // // (click)="onEventClick(event.id, $event)"
// // // // [title]="event.title"

// // // //                   >
// // // //                     <span class="chip-dot"></span>
// // // //                     <span class="chip-title">{{ event.title }}</span>
// // // //                   </div>
// // // //                 }
                
// // // //                 @if (cell.events.length > 4) {
// // // //                   <div class="more-indicator">+{{ cell.events.length - 4 }} more</div>
// // // //                 }
// // // //               </div>
// // // //             </div>
// // // //           }
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   `,
// // // //   styles: [`
// // // //     :host {
// // // //       display: block;
// // // //       height: 100%;
// // // //       /* CSS Tokens - Inherit from global theme */
// // // //       --bg-surface: var(--bg-primary);
// // // //       --bg-panel: var(--bg-secondary);
// // // //       --bg-item: var(--bg-ternary);
// // // //       --text-main: var(--text-primary);
// // // //       --text-muted: var(--text-secondary);
// // // //       --accent: var(--accent-primary);
// // // //       --border: var(--border-secondary);
      
// // // //       /* Event Color Map (Hardcoded semantic colors often used in dark/light regardless) */
// // // //       --c-meeting: #3b82f6;
// // // //       --c-meeting-bg: color-mix(in srgb, var(--c-meeting) 15%, transparent);
// // // //       --c-task: #10b981;
// // // //       --c-task-bg: color-mix(in srgb, var(--c-task) 15%, transparent);
// // // //       --c-note: #8b5cf6;
// // // //       --c-note-bg: color-mix(in srgb, var(--c-note) 15%, transparent);
// // // //       --c-urgent: #ef4444;
// // // //     }

// // // //     .calendar-container {
// // // //       display: flex;
// // // //       flex-direction: column;
// // // //       gap: 1rem;
// // // //       height: 100%;
// // // //       padding: 1.5rem;
// // // //       max-width: 1400px;
// // // //       margin: 0 auto;
// // // //     }

// // // //     /* --- Header --- */
// // // //     .calendar-header {
// // // //       display: flex;
// // // //       justify-content: space-between;
// // // //       align-items: center;
// // // //       padding: 1rem 1.5rem;
// // // //       border-radius: var(--ui-border-radius-lg);
// // // //       background: var(--glass-bg-c);
// // // //       border: 1px solid var(--border);
// // // //       backdrop-filter: blur(var(--glass-blur-c));
// // // //       box-shadow: var(--shadow-md);

// // // //       .header-left, .header-right {
// // // //         display: flex;
// // // //         align-items: center;
// // // //         gap: 2rem;
// // // //       }

// // // //       .title-group {
// // // //         display: flex; align-items: center; gap: 1rem;
// // // //         .month-label { font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin: 0; min-width: 200px; }
// // // //       }

// // // //       .nav-controls {
// // // //         display: flex; align-items: center; gap: 0.5rem;
        
// // // //         .btn-icon {
// // // //           width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent;
// // // //           background: var(--bg-item); cursor: pointer; display: flex; align-items: center; justify-content: center;
// // // //           transition: all 0.2s; color: var(--text-main);
// // // //           &:hover { background: var(--accent); color: white; }
// // // //         }
        
// // // //         .btn-text {
// // // //           padding: 6px 16px; border-radius: 8px; border: 1px solid var(--border);
// // // //           background: var(--bg-panel); font-weight: 600; cursor: pointer; font-size: 0.9rem; color: var(--text-main);
// // // //           &:hover { border-color: var(--accent); color: var(--accent); }
// // // //         }
// // // //       }

// // // //       /* Toggle Scope */
// // // //       .toggle-group {
// // // //         display: flex; background: var(--bg-item); padding: 4px; border-radius: 8px;
// // // //         .btn-toggle {
// // // //           border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
// // // //           &.active { background: var(--bg-surface); color: var(--text-main); box-shadow: var(--shadow-sm); }
// // // //         }
// // // //       }

// // // //       .divider-v { width: 1px; height: 24px; background: var(--border); }

// // // //       .btn-icon-lg {
// // // //         width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-panel); color: var(--text-muted); cursor: pointer; transition: all 0.2s;
// // // //         &:hover { color: var(--accent); border-color: var(--accent); }
// // // //       }
// // // //     }

// // // //     /* --- Loading Spinner --- */
// // // //     .loading-indicator {
// // // //       .spinner-dot {
// // // //         width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
// // // //         animation: pulse 1s infinite;
// // // //       }
// // // //     }
// // // //     @keyframes pulse { 0% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.3; transform: scale(0.8); } }

// // // //     /* --- Calendar Grid --- */
// // // //     .calendar-wrapper {
// // // //       flex: 1;
// // // //       display: flex;
// // // //       flex-direction: column;
// // // //       background: var(--bg-panel);
// // // //       border-radius: var(--ui-border-radius-lg);
// // // //       overflow: hidden;
// // // //       border: 1px solid var(--border);
// // // //       box-shadow: var(--shadow-lg);
// // // //     }

// // // //     .weekday-row {
// // // //       display: grid;
// // // //       grid-template-columns: repeat(7, 1fr);
// // // //       border-bottom: 1px solid var(--border);
// // // //       background: var(--bg-item);
      
// // // //       .weekday {
// // // //         padding: 10px;
// // // //         text-align: center;
// // // //         font-weight: 600;
// // // //         font-size: 0.85rem;
// // // //         color: var(--text-muted);
// // // //         text-transform: uppercase;
// // // //         letter-spacing: 0.5px;
// // // //       }
// // // //     }

// // // //     .days-grid {
// // // //       display: grid;
// // // //       grid-template-columns: repeat(7, 1fr);
// // // //       grid-auto-rows: minmax(120px, 1fr);
// // // //       flex: 1;
// // // //     }

// // // //     .day-cell {
// // // //       border-right: 1px solid var(--border);
// // // //       border-bottom: 1px solid var(--border);
// // // //       padding: 6px;
// // // //       display: flex;
// // // //       flex-direction: column;
// // // //       gap: 4px;
// // // //       position: relative;
// // // //       background: var(--bg-panel);
// // // //       transition: background 0.2s;
// // // //       cursor: pointer;

// // // //       /* Heatmap Intensities - Fixed for Dark Mode (Dynamic Transparency) */
// // // //       &[data-intensity="1"] { background: color-mix(in srgb, var(--accent) 4%, transparent); }
// // // //       &[data-intensity="2"] { background: color-mix(in srgb, var(--accent) 12%, transparent); }
// // // //       &[data-intensity="3"] { background: color-mix(in srgb, var(--accent) 20%, transparent); }
// // // //       &[data-intensity="4"] { background: color-mix(in srgb, var(--accent) 30%, transparent); }

// // // //       /* Modifiers */
// // // //       &.other-month { 
// // // //         background: var(--bg-item) !important; 
// // // //         opacity: 0.4;
// // // //         .day-number { color: var(--text-tertiary); }
// // // //       }
      
// // // //       &.is-today {
// // // //         .day-number { 
// // // //           background: var(--accent); color: white; 
// // // //           width: 24px; height: 24px; border-radius: 50%; 
// // // //           display: flex; align-items: center; justify-content: center;
// // // //           box-shadow: 0 2px 4px color-mix(in srgb, var(--accent) 30%, transparent);
// // // //         }
// // // //       }

// // // //       &:hover {
// // // //         background: var(--bg-item);
// // // //         .btn-add-mini { opacity: 1; }
// // // //       }

// // // //       /* Cell Top */
// // // //       .cell-top {
// // // //         display: flex; justify-content: space-between; align-items: center;
// // // //         padding: 0 4px;
        
// // // //         .day-number { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
        
// // // //         .btn-add-mini {
// // // //           opacity: 0; background: none; border: none; font-size: 1.2rem; line-height: 1;
// // // //           color: var(--text-muted); cursor: pointer; border-radius: 4px;
// // // //           &:hover { color: var(--accent); background: var(--bg-panel); }
// // // //         }
// // // //       }

// // // //       /* Events Stack */
// // // //       .events-stack {
// // // //         display: flex; flex-direction: column; gap: 2px; flex: 1;
// // // //       }

// // // //       .event-chip {
// // // //         display: flex; align-items: center; gap: 4px;
// // // //         padding: 2px 6px;
// // // //         border-radius: 4px;
// // // //         font-size: 0.75rem;
// // // //         font-weight: 500;
// // // //         white-space: nowrap;
// // // //         overflow: hidden;
// // // //         text-overflow: ellipsis;
// // // //         transition: transform 0.1s;
// // // //         border-left: 2px solid transparent;
// // // //         color: var(--text-primary);

// // // //         &:hover { transform: scale(1.02); z-index: 2; cursor: pointer; }

// // // //         .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
// // // //         .chip-title { overflow: hidden; text-overflow: ellipsis; }

// // // //         /* Type Variants */
// // // //         &.type-meeting { background: var(--c-meeting-bg); border-left-color: var(--c-meeting); .chip-dot { background: var(--c-meeting); } }
// // // //         &.type-task { background: var(--c-task-bg); border-left-color: var(--c-task); .chip-dot { background: var(--c-task); } }
// // // //         &.type-note { background: var(--c-note-bg); border-left-color: var(--c-note); .chip-dot { background: var(--c-note); } }
        
// // // //         &.status-done { opacity: 0.4; text-decoration: line-through; }
// // // //         &.priority-urgent { border-left-color: var(--c-urgent); background: color-mix(in srgb, var(--c-urgent) 15%, transparent); }
// // // //       }

// // // //       .more-indicator {
// // // //         font-size: 0.7rem; color: var(--text-muted); padding-left: 6px; font-weight: 500;
// // // //       }
// // // //     }
// // // //   `]
// // // // })
// // // // export class CalendarViewComponent implements OnInit {
// // // //   private noteService = inject(NoteService);
// // // //   private dialogServices = inject(DynamicDialogServices);
// // // //   private router = inject(Router);

// // // //   weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// // // //   // Signals
// // // //   currentDate = signal(new Date());
// // // //   events = signal<CalendarEvent[]>([]);
// // // //   heatmapData = signal<Record<string, { count: number, intensity: number }>>({});
// // // //   isLoading = signal(false);
// // // //   viewScope = signal<'personal' | 'shared'>('personal');

// // // //   // --- Computed Full Grid ---
// // // //   calendarGrid = computed<CalendarGridCell[]>(() => {
// // // //     const curr = this.currentDate();
// // // //     const year = curr.getFullYear();
// // // //     const month = curr.getMonth();

// // // //     // 1. Determine Grid Start (Sunday before 1st of month)
// // // //     const firstDayOfMonth = new Date(year, month, 1);
// // // //     const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    
// // // //     const startDate = new Date(firstDayOfMonth);
// // // //     startDate.setDate(startDate.getDate() - startDayOfWeek);

// // // //     // 2. Generate 42 days (6 weeks) to ensure consistent height
// // // //     const cells: CalendarGridCell[] = [];
// // // //     const heatmap = this.heatmapData();
// // // //     const allEvents = this.events();

// // // //     for (let i = 0; i < 42; i++) {
// // // //       const date = new Date(startDate);
// // // //       date.setDate(startDate.getDate() + i);
      
// // // //       const dateStr = this.getLocalISODate(date);

// // // //       // Heatmap logic (intensity 0-4)
// // // //       const dayData = this.viewScope() === 'personal' ? heatmap[dateStr] : null;
// // // //       const intensity = dayData ? Math.ceil(dayData.intensity * 4) : 0; 

// // // //       // Event filtering using Local Date Matching
// // // //       const dayEvents = allEvents.filter(e => {
// // // //         const evtDate = e.start instanceof Date ? e.start : new Date(e.start);
// // // //         const evtDateStr = this.getLocalISODate(evtDate);
// // // //         return evtDateStr === dateStr;
// // // //       });

// // // //       cells.push({
// // // //         date: date,
// // // //         dateStr: dateStr,
// // // //         dayNum: date.getDate(),
// // // //         isToday: this.isToday(date),
// // // //         isCurrentMonth: date.getMonth() === month,
// // // //         intensity: intensity,
// // // //         events: dayEvents
// // // //       });
// // // //     }

// // // //     return cells;
// // // //   });

// // // //   ngOnInit() {
// // // //     this.fetchData();
// // // //   }

// // // //   fetchData() {
// // // //     this.isLoading.set(true);
// // // //     const y = this.currentDate().getFullYear();
// // // //     const m = this.currentDate().getMonth();

// // // //     // Calculate grid boundaries
// // // //     const firstDayOfMonth = new Date(y, m, 1);
// // // //     const startDayOfWeek = firstDayOfMonth.getDay();
    
// // // //     const gridStart = new Date(firstDayOfMonth);
// // // //     gridStart.setDate(gridStart.getDate() - startDayOfWeek);
    
// // // //     const gridEnd = new Date(gridStart);
// // // //     gridEnd.setDate(gridEnd.getDate() + 42);

// // // //     const startStr = gridStart.toISOString();
// // // //     const endStr = gridEnd.toISOString();

// // // //     const requests: any = {
// // // //       eventsRes: this.noteService.getCalendarView(startStr, endStr, 'month'),
// // // //     };

// // // //     if (this.viewScope() === 'personal') {
// // // //       requests.heatmapRes = this.noteService.getHeatMapData(startStr, endStr);
// // // //     }

// // // //     forkJoin(requests).subscribe({
// // // //       next: (results: any) => {
// // // //         let fetchedEvents = results.eventsRes.data.events;
// // // //         this.events.set(fetchedEvents);
        
// // // //         if (results.heatmapRes) {
// // // //           this.heatmapData.set(results.heatmapRes.data.heatMap as any);
// // // //         } else {
// // // //           this.heatmapData.set({});
// // // //         }
        
// // // //         this.isLoading.set(false);
// // // //       },
// // // //       error: (err) => {
// // // //         console.error('Calendar Fetch Error', err);
// // // //         this.isLoading.set(false);
// // // //       }
// // // //     });
// // // //   }

// // // //   // --- Helper for Local Date String (YYYY-MM-DD) ---
// // // //   private getLocalISODate(date: Date): string {
// // // //     const year = date.getFullYear();
// // // //     const month = String(date.getMonth() + 1).padStart(2, '0');
// // // //     const day = String(date.getDate()).padStart(2, '0');
// // // //     return `${year}-${month}-${day}`;
// // // //   }

// // // //   changeMonth(delta: number) {
// // // //     const date = new Date(this.currentDate());
// // // //     date.setMonth(date.getMonth() + delta);
// // // //     this.currentDate.set(date);
// // // //     this.fetchData();
// // // //   }

// // // //   jumpToToday() {
// // // //     this.currentDate.set(new Date());
// // // //     this.fetchData();
// // // //   }

// // // //   toggleScope(scope: 'personal' | 'shared') {
// // // //     this.viewScope.set(scope);
// // // //     this.fetchData(); 
// // // //   }

// // // //   openAnalytics() {
// // // //     this.dialogServices.openAnalyticsDialog();
// // // //   }

// // // //   onEventClick(id: string, event: Event) {
// // // //     event.stopPropagation();
    
// // // //     if (id.startsWith('meeting_')) {
// // // //       const realId = id.replace('meeting_', '');
// // // //       this.router.navigate(['/notes', realId]); 
// // // //     } else {
// // // //       this.router.navigate(['/notes', id]);
// // // //     }
// // // //   }

// // // //   onDateClick(date: Date) {
// // // //     const dateStr = this.getLocalISODate(date);
// // // //     this.router.navigate(['/notes/create'], { queryParams: { date: dateStr } });
// // // //   }

// // // //   isToday(date: Date) {
// // // //     const today = new Date();
// // // //     return date.getDate() === today.getDate() &&
// // // //            date.getMonth() === today.getMonth() &&
// // // //            date.getFullYear() === today.getFullYear();
// // // //   }
// // // // }