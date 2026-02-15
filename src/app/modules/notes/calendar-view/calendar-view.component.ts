import { Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CalendarEvent, DailyNoteCount } from '../../../core/models/note.types';
import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
import { NoteService } from '../../../core/services/notes.service';

interface CalendarGridCell {
  date: Date;
  dateStr: string;
  dayNum: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  intensity: number; // 0-4 scale for heatmap
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-container">

      <!-- ==================== HEADER ==================== -->
      <header class="calendar-header glass-panel">
        <div class="header-left">
          <div class="title-group">
            <h2 class="month-label">{{ currentDate() | date: 'MMMM yyyy' }}</h2>
            <div class="loading-indicator" *ngIf="isLoading()">
              <div class="spinner-dot"></div>
            </div>
          </div>
          
          <div class="nav-controls">
            <button class="btn-icon" (click)="changeMonth(-1)" title="Previous Month">
              <i class="pi pi-chevron-left"></i>
            </button>
            <button class="btn-text" (click)="jumpToToday()">Today</button>
            <button class="btn-icon" (click)="changeMonth(1)" title="Next Month">
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>
        </div>

        <div class="header-right">
          <!-- View Toggles -->
          <div class="toggle-group">
            <button class="btn-toggle" [class.active]="viewScope() === 'personal'" (click)="toggleScope('personal')">My Notes</button>
            <button class="btn-toggle" [class.active]="viewScope() === 'shared'" (click)="toggleScope('shared')">Shared</button>
          </div>

          <div class="divider-v"></div>

          <!-- Analytics Trigger -->
          <button class="btn-icon-lg" (click)="openAnalytics()" title="View Analytics">
            <i class="pi pi-chart-bar"></i>
          </button>
        </div>
      </header>

      <!-- ==================== CALENDAR GRID ==================== -->
      <div class="calendar-wrapper glass-panel">
        
        <!-- Weekday Headers -->
        <div class="weekday-row">
          @for (day of weekDays; track day) {
            <div class="weekday">{{ day }}</div>
          }
        </div>

        <!-- Days -->
        <div class="days-grid">
          @for (cell of calendarGrid(); track cell.dateStr) {
            <div 
              class="day-cell"
              [class.other-month]="!cell.isCurrentMonth"
              [class.is-today]="cell.isToday"
              [attr.data-intensity]="cell.intensity"
              (click)="onDateClick(cell.date)"
            >
              <!-- Date Number & Add Button -->
              <div class="cell-top">
                <span class="day-number">{{ cell.dayNum }}</span>
                <button class="btn-add-mini" title="Add Note">+</button>
              </div>

              <!-- Events List -->
              <div class="events-stack">
                @for (event of cell.events | slice:0:4; track event.id) {
                  <div 
                class="event-chip"
[class.type-meeting]="event.extendedProps.isMeeting || event.extendedProps.noteType === 'meeting'"
[class.type-task]="event.extendedProps.noteType === 'task'"
[class.type-note]="event.extendedProps.noteType === 'note'"
[class.status-done]="event.extendedProps.status === 'completed'"
[class.priority-urgent]="event.extendedProps.priority === 'urgent'"
(click)="onEventClick(event.id, $event)"
[title]="event.title"

                  >
                    <span class="chip-dot"></span>
                    <span class="chip-title">{{ event.title }}</span>
                  </div>
                }
                
                @if (cell.events.length > 4) {
                  <div class="more-indicator">+{{ cell.events.length - 4 }} more</div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      /* CSS Tokens - Inherit from global theme */
      --bg-surface: var(--bg-primary);
      --bg-panel: var(--bg-secondary);
      --bg-item: var(--bg-ternary);
      --text-main: var(--text-primary);
      --text-muted: var(--text-secondary);
      --accent: var(--accent-primary);
      --border: var(--border-secondary);
      
      /* Event Color Map (Hardcoded semantic colors often used in dark/light regardless) */
      --c-meeting: #3b82f6;
      --c-meeting-bg: color-mix(in srgb, var(--c-meeting) 15%, transparent);
      --c-task: #10b981;
      --c-task-bg: color-mix(in srgb, var(--c-task) 15%, transparent);
      --c-note: #8b5cf6;
      --c-note-bg: color-mix(in srgb, var(--c-note) 15%, transparent);
      --c-urgent: #ef4444;
    }

    .calendar-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* --- Header --- */
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-radius: var(--ui-border-radius-lg);
      background: var(--glass-bg-c);
      border: 1px solid var(--border);
      backdrop-filter: blur(var(--glass-blur-c));
      box-shadow: var(--shadow-md);

      .header-left, .header-right {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .title-group {
        display: flex; align-items: center; gap: 1rem;
        .month-label { font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin: 0; min-width: 200px; }
      }

      .nav-controls {
        display: flex; align-items: center; gap: 0.5rem;
        
        .btn-icon {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent;
          background: var(--bg-item); cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; color: var(--text-main);
          &:hover { background: var(--accent); color: white; }
        }
        
        .btn-text {
          padding: 6px 16px; border-radius: 8px; border: 1px solid var(--border);
          background: var(--bg-panel); font-weight: 600; cursor: pointer; font-size: 0.9rem; color: var(--text-main);
          &:hover { border-color: var(--accent); color: var(--accent); }
        }
      }

      /* Toggle Scope */
      .toggle-group {
        display: flex; background: var(--bg-item); padding: 4px; border-radius: 8px;
        .btn-toggle {
          border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
          &.active { background: var(--bg-surface); color: var(--text-main); box-shadow: var(--shadow-sm); }
        }
      }

      .divider-v { width: 1px; height: 24px; background: var(--border); }

      .btn-icon-lg {
        width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-panel); color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        &:hover { color: var(--accent); border-color: var(--accent); }
      }
    }

    /* --- Loading Spinner --- */
    .loading-indicator {
      .spinner-dot {
        width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
        animation: pulse 1s infinite;
      }
    }
    @keyframes pulse { 0% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.3; transform: scale(0.8); } }

    /* --- Calendar Grid --- */
    .calendar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-panel);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
    }

    .weekday-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 1px solid var(--border);
      background: var(--bg-item);
      
      .weekday {
        padding: 10px;
        text-align: center;
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-auto-rows: minmax(120px, 1fr);
      flex: 1;
    }

    .day-cell {
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
      background: var(--bg-panel);
      transition: background 0.2s;
      cursor: pointer;

      /* Heatmap Intensities - Fixed for Dark Mode (Dynamic Transparency) */
      &[data-intensity="1"] { background: color-mix(in srgb, var(--accent) 4%, transparent); }
      &[data-intensity="2"] { background: color-mix(in srgb, var(--accent) 12%, transparent); }
      &[data-intensity="3"] { background: color-mix(in srgb, var(--accent) 20%, transparent); }
      &[data-intensity="4"] { background: color-mix(in srgb, var(--accent) 30%, transparent); }

      /* Modifiers */
      &.other-month { 
        background: var(--bg-item) !important; 
        opacity: 0.4;
        .day-number { color: var(--text-tertiary); }
      }
      
      &.is-today {
        .day-number { 
          background: var(--accent); color: white; 
          width: 24px; height: 24px; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 4px color-mix(in srgb, var(--accent) 30%, transparent);
        }
      }

      &:hover {
        background: var(--bg-item);
        .btn-add-mini { opacity: 1; }
      }

      /* Cell Top */
      .cell-top {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0 4px;
        
        .day-number { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
        
        .btn-add-mini {
          opacity: 0; background: none; border: none; font-size: 1.2rem; line-height: 1;
          color: var(--text-muted); cursor: pointer; border-radius: 4px;
          &:hover { color: var(--accent); background: var(--bg-panel); }
        }
      }

      /* Events Stack */
      .events-stack {
        display: flex; flex-direction: column; gap: 2px; flex: 1;
      }

      .event-chip {
        display: flex; align-items: center; gap: 4px;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: transform 0.1s;
        border-left: 2px solid transparent;
        color: var(--text-primary);

        &:hover { transform: scale(1.02); z-index: 2; cursor: pointer; }

        .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .chip-title { overflow: hidden; text-overflow: ellipsis; }

        /* Type Variants */
        &.type-meeting { background: var(--c-meeting-bg); border-left-color: var(--c-meeting); .chip-dot { background: var(--c-meeting); } }
        &.type-task { background: var(--c-task-bg); border-left-color: var(--c-task); .chip-dot { background: var(--c-task); } }
        &.type-note { background: var(--c-note-bg); border-left-color: var(--c-note); .chip-dot { background: var(--c-note); } }
        
        &.status-done { opacity: 0.4; text-decoration: line-through; }
        &.priority-urgent { border-left-color: var(--c-urgent); background: color-mix(in srgb, var(--c-urgent) 15%, transparent); }
      }

      .more-indicator {
        font-size: 0.7rem; color: var(--text-muted); padding-left: 6px; font-weight: 500;
      }
    }
  `]
})
export class CalendarViewComponent implements OnInit {
  private noteService = inject(NoteService);
  private dialogServices = inject(DynamicDialogServices);
  private router = inject(Router);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Signals
  currentDate = signal(new Date());
  events = signal<CalendarEvent[]>([]);
  heatmapData = signal<Record<string, { count: number, intensity: number }>>({});
  isLoading = signal(false);
  viewScope = signal<'personal' | 'shared'>('personal');

  // --- Computed Full Grid ---
  calendarGrid = computed<CalendarGridCell[]>(() => {
    const curr = this.currentDate();
    const year = curr.getFullYear();
    const month = curr.getMonth();

    // 1. Determine Grid Start (Sunday before 1st of month)
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    // 2. Generate 42 days (6 weeks) to ensure consistent height
    const cells: CalendarGridCell[] = [];
    const heatmap = this.heatmapData();
    const allEvents = this.events();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = this.getLocalISODate(date);

      // Heatmap logic (intensity 0-4)
      const dayData = this.viewScope() === 'personal' ? heatmap[dateStr] : null;
      const intensity = dayData ? Math.ceil(dayData.intensity * 4) : 0; 

      // Event filtering using Local Date Matching
      const dayEvents = allEvents.filter(e => {
        const evtDate = e.start instanceof Date ? e.start : new Date(e.start);
        const evtDateStr = this.getLocalISODate(evtDate);
        return evtDateStr === dateStr;
      });

      cells.push({
        date: date,
        dateStr: dateStr,
        dayNum: date.getDate(),
        isToday: this.isToday(date),
        isCurrentMonth: date.getMonth() === month,
        intensity: intensity,
        events: dayEvents
      });
    }

    return cells;
  });

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);
    const y = this.currentDate().getFullYear();
    const m = this.currentDate().getMonth();

    // Calculate grid boundaries
    const firstDayOfMonth = new Date(y, m, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    const gridStart = new Date(firstDayOfMonth);
    gridStart.setDate(gridStart.getDate() - startDayOfWeek);
    
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridEnd.getDate() + 42);

    const startStr = gridStart.toISOString();
    const endStr = gridEnd.toISOString();

    const requests: any = {
      eventsRes: this.noteService.getCalendarView(startStr, endStr, 'month'),
    };

    if (this.viewScope() === 'personal') {
      requests.heatmapRes = this.noteService.getHeatMapData(startStr, endStr);
    }

    forkJoin(requests).subscribe({
      next: (results: any) => {
        let fetchedEvents = results.eventsRes.data.events;
        this.events.set(fetchedEvents);
        
        if (results.heatmapRes) {
          this.heatmapData.set(results.heatmapRes.data.heatMap as any);
        } else {
          this.heatmapData.set({});
        }
        
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Calendar Fetch Error', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- Helper for Local Date String (YYYY-MM-DD) ---
  private getLocalISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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

  toggleScope(scope: 'personal' | 'shared') {
    this.viewScope.set(scope);
    this.fetchData(); 
  }

  openAnalytics() {
    this.dialogServices.openAnalyticsDialog();
  }

  onEventClick(id: string, event: Event) {
    event.stopPropagation();
    
    if (id.startsWith('meeting_')) {
      const realId = id.replace('meeting_', '');
      this.router.navigate(['/notes', realId]); 
    } else {
      this.router.navigate(['/notes', id]);
    }
  }

  onDateClick(date: Date) {
    const dateStr = this.getLocalISODate(date);
    this.router.navigate(['/notes/create'], { queryParams: { date: dateStr } });
  }

  isToday(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
}
// import { Component, computed, inject, signal, OnInit, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { forkJoin } from 'rxjs';
// import { CalendarEvent } from '../../../core/models/note.types';
// import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// import { NoteService } from '../../../core/services/notes.service';
// interface CalendarGridCell {
//   date: Date;
//   dateStr: string;
//   dayNum: number;
//   isToday: boolean;
//   isCurrentMonth: boolean;
//   intensity: number; // 0-4 scale for heatmap
//   events: CalendarEvent[];
// }

// @Component({
//   selector: 'app-calendar-view',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="calendar-container">

//       <!-- ==================== HEADER ==================== -->
//       <header class="calendar-header glass-panel">
//         <div class="header-left">
//           <div class="title-group">
//             <h2 class="month-label">{{ currentDate() | date: 'MMMM yyyy' }}</h2>
//             <div class="loading-indicator" *ngIf="isLoading()">
//               <div class="spinner-dot"></div>
//             </div>
//           </div>
          
//           <div class="nav-controls">
//             <button class="btn-icon" (click)="changeMonth(-1)" title="Previous Month">
//               <i class="pi pi-chevron-left"></i>
//             </button>
//             <button class="btn-text" (click)="jumpToToday()">Today</button>
//             <button class="btn-icon" (click)="changeMonth(1)" title="Next Month">
//               <i class="pi pi-chevron-right"></i>
//             </button>
//           </div>
//         </div>

//         <div class="header-right">
//           <!-- View Toggles -->
//           <div class="toggle-group">
//             <button class="btn-toggle" [class.active]="viewScope() === 'personal'" (click)="toggleScope('personal')">My Notes</button>
//             <button class="btn-toggle" [class.active]="viewScope() === 'shared'" (click)="toggleScope('shared')">Shared</button>
//           </div>

//           <div class="divider-v"></div>

//           <!-- Analytics Trigger -->
//           <button class="btn-icon-lg" (click)="openAnalytics()" title="View Analytics">
//             <i class="pi pi-chart-bar"></i>
//           </button>
//         </div>
//       </header>

//       <!-- ==================== CALENDAR GRID ==================== -->
//       <div class="calendar-wrapper glass-panel">
        
//         <!-- Weekday Headers -->
//         <div class="weekday-row">
//           @for (day of weekDays; track day) {
//             <div class="weekday">{{ day }}</div>
//           }
//         </div>

//         <!-- Days -->
//         <div class="days-grid">
//           @for (cell of calendarGrid(); track cell.dateStr) {
//             <div 
//               class="day-cell"
//               [class.other-month]="!cell.isCurrentMonth"
//               [class.is-today]="cell.isToday"
//               [attr.data-intensity]="cell.intensity"
//               (click)="onDateClick(cell.date)"
//             >
//               <!-- Date Number & Add Button -->
//               <div class="cell-top">
//                 <span class="day-number">{{ cell.dayNum }}</span>
//                 <button class="btn-add-mini" title="Add Note">+</button>
//               </div>

//               <!-- Events List -->
//               <div class="events-stack">
//                 @for (event of cell.events | slice:0:4; track event.id) {
//                   <div 
//                     class="event-chip"
//                     [class.type-meeting]="event.extendedProps?.isMeeting || event.extendedProps?.noteType === 'meeting'"
//                     [class.type-task]="event.extendedProps?.noteType === 'task'"
//                     [class.type-note]="event.extendedProps?.noteType === 'note'"
//                     [class.status-done]="event.extendedProps?.status === 'completed'"
//                     [class.priority-urgent]="event.extendedProps?.priority === 'urgent'"
//                     (click)="onEventClick(event.id, $event)"
//                     [title]="event.title"
//                   >
//                     <span class="chip-dot"></span>
//                     <span class="chip-title">{{ event.title }}</span>
//                   </div>
//                 }
                
//                 @if (cell.events.length > 4) {
//                   <div class="more-indicator">+{{ cell.events.length - 4 }} more</div>
//                 }
//               </div>
//             </div>
//           }
//         </div>
//       </div>
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       height: 100%;
//       /* CSS Tokens */
//       --bg-glass: var(--glass-bg-c, rgba(255, 255, 255, 0.7));
//       --border-glass: var(--glass-border-c, rgba(255, 255, 255, 0.5));
//       --text-main: var(--text-primary, #1f2937);
//       --text-muted: var(--text-secondary, #6b7280);
//       --accent: var(--accent-primary, #3b82f6);
      
//       /* Event Colors */
//       --c-meeting: #3b82f6;
//       --c-meeting-bg: #eff6ff;
//       --c-task: #10b981;
//       --c-task-bg: #ecfdf5;
//       --c-note: #8b5cf6;
//       --c-note-bg: #f5f3ff;
//       --c-urgent: #ef4444;
//     }

//     .calendar-container {
//       display: flex;
//       flex-direction: column;
//       gap: 1rem;
//       height: 100%;
//       padding: 1.5rem;
//       max-width: 1400px;
//       margin: 0 auto;
//     }

//     /* --- Header --- */
//     .calendar-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: 1rem 1.5rem;
//       border-radius: 12px;
//       background: var(--bg-glass);
//       border: 1px solid var(--border-glass);
//       backdrop-filter: blur(10px);
//       box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

//       .header-left, .header-right {
//         display: flex;
//         align-items: center;
//         gap: 2rem;
//       }

//       .title-group {
//         display: flex; align-items: center; gap: 1rem;
//         .month-label { font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin: 0; min-width: 200px; }
//       }

//       .nav-controls {
//         display: flex; align-items: center; gap: 0.5rem;
        
//         .btn-icon {
//           width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent;
//           background: rgba(0,0,0,0.05); cursor: pointer; display: flex; align-items: center; justify-content: center;
//           transition: all 0.2s; color: var(--text-main);
//           &:hover { background: var(--accent); color: white; }
//         }
        
//         .btn-text {
//           padding: 6px 16px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);
//           background: white; font-weight: 600; cursor: pointer; font-size: 0.9rem;
//           &:hover { border-color: var(--accent); color: var(--accent); }
//         }
//       }

//       /* Toggle Scope */
//       .toggle-group {
//         display: flex; background: rgba(0,0,0,0.05); padding: 4px; border-radius: 8px;
//         .btn-toggle {
//           border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
//           &.active { background: white; color: var(--text-main); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
//         }
//       }

//       .divider-v { width: 1px; height: 24px; background: rgba(0,0,0,0.1); }

//       .btn-icon-lg {
//         width: 40px; height: 40px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: white; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
//         &:hover { color: var(--accent); border-color: var(--accent); }
//       }
//     }

//     /* --- Loading Spinner --- */
//     .loading-indicator {
//       .spinner-dot {
//         width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
//         animation: pulse 1s infinite;
//       }
//     }
//     @keyframes pulse { 0% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.3; transform: scale(0.8); } }

//     /* --- Calendar Grid --- */
//     .calendar-wrapper {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       background: white;
//       border-radius: 12px;
//       overflow: hidden;
//       border: 1px solid rgba(0,0,0,0.08);
//       box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
//     }

//     .weekday-row {
//       display: grid;
//       grid-template-columns: repeat(7, 1fr);
//       border-bottom: 1px solid rgba(0,0,0,0.08);
//       background: rgba(249, 250, 251, 0.8);
      
//       .weekday {
//         padding: 10px;
//         text-align: center;
//         font-weight: 600;
//         font-size: 0.85rem;
//         color: var(--text-muted);
//         text-transform: uppercase;
//         letter-spacing: 0.5px;
//       }
//     }

//     .days-grid {
//       display: grid;
//       grid-template-columns: repeat(7, 1fr);
//       grid-auto-rows: minmax(120px, 1fr); /* Responsive height */
//       flex: 1;
//     }

//     .day-cell {
//       border-right: 1px solid rgba(0,0,0,0.05);
//       border-bottom: 1px solid rgba(0,0,0,0.05);
//       padding: 6px;
//       display: flex;
//       flex-direction: column;
//       gap: 4px;
//       position: relative;
//       background: white;
//       transition: background 0.2s;
//       cursor: pointer;

//       /* Heatmap Intensities (Subtle Backgrounds) */
//       /* Using accent color with varying opacity for heatmap */
//       &[data-intensity="1"] { background: rgba(59, 130, 246, 0.04); }
//       &[data-intensity="2"] { background: rgba(59, 130, 246, 0.12); }
//       &[data-intensity="3"] { background: rgba(59, 130, 246, 0.20); }
//       &[data-intensity="4"] { background: rgba(59, 130, 246, 0.30); }

//       /* Modifiers */
//       &.other-month { 
//         background: #fdfdfd !important; 
//         .day-number { color: #e5e7eb; }
//         &:hover { background: #f9fafb !important; }
//       }
      
//       &.is-today {
//         background: #fff;
//         .day-number { 
//           background: var(--accent); color: white; 
//           width: 24px; height: 24px; border-radius: 50%; 
//           display: flex; align-items: center; justify-content: center;
//           box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
//         }
//       }

//       &:hover {
//         background: #f8fafc;
//         .btn-add-mini { opacity: 1; }
//       }

//       /* Cell Top */
//       .cell-top {
//         display: flex; justify-content: space-between; align-items: center;
//         padding: 0 4px;
        
//         .day-number { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
        
//         .btn-add-mini {
//           opacity: 0; background: none; border: none; font-size: 1.2rem; line-height: 1;
//           color: var(--text-muted); cursor: pointer; border-radius: 4px;
//           &:hover { color: var(--accent); background: rgba(0,0,0,0.05); }
//         }
//       }

//       /* Events Stack */
//       .events-stack {
//         display: flex; flex-direction: column; gap: 2px; flex: 1;
//       }

//       .event-chip {
//         display: flex; align-items: center; gap: 4px;
//         padding: 2px 6px;
//         border-radius: 4px;
//         font-size: 0.75rem;
//         font-weight: 500;
//         white-space: nowrap;
//         overflow: hidden;
//         text-overflow: ellipsis;
//         transition: transform 0.1s;
//         border-left: 2px solid transparent;

//         &:hover { transform: scale(1.02); z-index: 2; cursor: pointer; }

//         .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
//         .chip-title { overflow: hidden; text-overflow: ellipsis; }

//         /* Type Variants */
//         &.type-meeting { background: var(--c-meeting-bg); color: #1e3a8a; border-left-color: var(--c-meeting); .chip-dot { background: var(--c-meeting); } }
//         &.type-task { background: var(--c-task-bg); color: #064e3b; border-left-color: var(--c-task); .chip-dot { background: var(--c-task); } }
//         &.type-note { background: var(--c-note-bg); color: #4c1d95; border-left-color: var(--c-note); .chip-dot { background: var(--c-note); } }
        
//         &.status-done { opacity: 0.6; text-decoration: line-through; }
//         &.priority-urgent { border-left-color: var(--c-urgent); background: #fef2f2; color: #991b1b; }
//       }

//       .more-indicator {
//         font-size: 0.7rem; color: var(--text-muted); padding-left: 6px; font-weight: 500;
//       }
//     }
//   `]
// })
// export class CalendarViewComponent implements OnInit {
//   private noteService = inject(NoteService);
//   private dialogServices = inject(DynamicDialogServices);
//   private router = inject(Router);

//   weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//   // Signals
//   currentDate = signal(new Date());
//   events = signal<CalendarEvent[]>([]);
//   heatmapData = signal<Record<string, { count: number, intensity: number }>>({});
//   isLoading = signal(false);
//   viewScope = signal<'personal' | 'shared'>('personal');

//   // --- Computed Full Grid (Previous + Current + Next Month) ---
//   calendarGrid = computed<CalendarGridCell[]>(() => {
//     const curr = this.currentDate();
//     const year = curr.getFullYear();
//     const month = curr.getMonth();

//     // 1. Determine Grid Start (Sunday before 1st of month)
//     const firstDayOfMonth = new Date(year, month, 1);
//     const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    
//     const startDate = new Date(firstDayOfMonth);
//     startDate.setDate(startDate.getDate() - startDayOfWeek);

//     // 2. Generate 42 days (6 weeks) to ensure consistent height
//     const cells: CalendarGridCell[] = [];
//     const heatmap = this.heatmapData();
//     const allEvents = this.events();

//     for (let i = 0; i < 42; i++) {
//       const date = new Date(startDate);
//       date.setDate(startDate.getDate() + i);
      
//       // FIX: Calculate Local YYYY-MM-DD string to align visual date with local timezone events
//       const dateStr = this.getLocalISODate(date);

//       // Heatmap logic (intensity 0-4)
//       const dayData = this.viewScope() === 'personal' ? heatmap[dateStr] : null;
//       const intensity = dayData ? Math.ceil(dayData.intensity * 4) : 0; 

//       // Event filtering using Local Date Matching
//       const dayEvents = allEvents.filter(e => {
//         // Parse event start (ISO string) to Date, then convert to local string
//         // This ensures an event at "Jan 31 18:30 UTC" which is "Feb 1" in IST shows on Feb 1
//         const evtDate = e.start instanceof Date ? e.start : new Date(e.start);
//         const evtDateStr = this.getLocalISODate(evtDate);
//         return evtDateStr === dateStr;
//       });

//       cells.push({
//         date: date,
//         dateStr: dateStr,
//         dayNum: date.getDate(),
//         isToday: this.isToday(date),
//         isCurrentMonth: date.getMonth() === month,
//         intensity: intensity,
//         events: dayEvents
//       });
//     }

//     return cells;
//   });

//   ngOnInit() {
//     this.fetchData();
//   }

//   fetchData() {
//     this.isLoading.set(true);
//     const y = this.currentDate().getFullYear();
//     const m = this.currentDate().getMonth();

//     // Calculate grid boundaries for API query
//     const firstDayOfMonth = new Date(y, m, 1);
//     const startDayOfWeek = firstDayOfMonth.getDay();
    
//     const gridStart = new Date(firstDayOfMonth);
//     gridStart.setDate(gridStart.getDate() - startDayOfWeek);
    
//     const gridEnd = new Date(gridStart);
//     gridEnd.setDate(gridEnd.getDate() + 42);

//     const startStr = gridStart.toISOString();
//     const endStr = gridEnd.toISOString();

//     const requests: any = {
//       eventsRes: this.noteService.getCalendarView(startStr, endStr, 'month'),
//     };

//     // Only fetch heatmap for personal view
//     if (this.viewScope() === 'personal') {
//       requests.heatmapRes = this.noteService.getHeatMapData(startStr, endStr);
//     }

//     forkJoin(requests).subscribe({
//       next: (results: any) => {
//         let fetchedEvents = results.eventsRes.data.events;
//         // In a real app with 'Shared' scope, filter fetchedEvents by owner != currentUser here if API doesn't filtering
//         this.events.set(fetchedEvents);
        
//         if (results.heatmapRes) {
//           this.heatmapData.set(results.heatmapRes.data.heatMap as any);
//         } else {
//           this.heatmapData.set({});
//         }
        
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Calendar Fetch Error', err);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   // --- Helper for Local Date String (YYYY-MM-DD) ---
//   private getLocalISODate(date: Date): string {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   }

//   changeMonth(delta: number) {
//     const date = new Date(this.currentDate());
//     date.setMonth(date.getMonth() + delta);
//     this.currentDate.set(date);
//     this.fetchData();
//   }

//   jumpToToday() {
//     this.currentDate.set(new Date());
//     this.fetchData();
//   }

//   toggleScope(scope: 'personal' | 'shared') {
//     this.viewScope.set(scope);
//     this.fetchData(); // Reload data based on new scope
//   }

//   openAnalytics() {
//     this.dialogServices.openAnalyticsDialog();
//   }

//   onEventClick(id: string, event: Event) {
//     event.stopPropagation();
    
//     if (id.startsWith('meeting_')) {
//       const realId = id.replace('meeting_', '');
//       this.router.navigate(['/notes', realId]); 
//     } else {
//       this.router.navigate(['/notes', id]);
//     }
//   }

//   onDateClick(date: Date) {
//     const dateStr = this.getLocalISODate(date);
//     this.router.navigate(['/notes/create'], { queryParams: { date: dateStr } });
//   }

//   isToday(date: Date) {
//     const today = new Date();
//     return date.getDate() === today.getDate() &&
//            date.getMonth() === today.getMonth() &&
//            date.getFullYear() === today.getFullYear();
//   }
// }


// // import { Component, computed, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { Router } from '@angular/router';
// // import { NoteService } from '../../../core/services/notes.service';
// // import { CalendarEvent, DailyNoteCount } from '../../../core/models/note.types';
// // import { forkJoin } from 'rxjs';

// // interface CalendarGridCell {
// //   date: Date;
// //   dateStr: string; // ISO string for easy matching
// //   dayNum: number;
// //   isToday: boolean;
// //   isCurrentMonth: boolean;
// //   intensity: number;
// //   events: CalendarEvent[];
// // }

// // @Component({
// //   selector: 'app-calendar-view',
// //   standalone: true,
// //   imports: [CommonModule],
// //   templateUrl: './calendar-view.component.html',
// //   styleUrls: ['./calendar-view.component.scss']
// // })
// // export class CalendarViewComponent {
// //   private notes = inject(NoteService);
// //   private router = inject(Router);

// //   weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// //   // Signals
// //   currentDate = signal(new Date());
// //   events = signal<CalendarEvent[]>([]);
// //   heatmapData = signal<DailyNoteCount[]>([]);
// //   isLoading = signal(false);

// //   // --- Computed Full Grid (Previous + Current + Next Month) ---
// //   calendarGrid = computed<CalendarGridCell[]>(() => {
// //     const curr = this.currentDate();
// //     const year = curr.getFullYear();
// //     const month = curr.getMonth();

// //     // 1. Determine Grid Start (Sunday before 1st of month)
// //     const firstDayOfMonth = new Date(year, month, 1);
// //     const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    
// //     // Start date for the grid
// //     const startDate = new Date(firstDayOfMonth);
// //     startDate.setDate(startDate.getDate() - startDayOfWeek);

// //     // 2. Generate 42 days (6 weeks) to ensure consistent height
// //     const cells: CalendarGridCell[] = [];
// //     const counts = this.heatmapData();
// //     const allEvents = this.events();

// //     for (let i = 0; i < 42; i++) {
// //       const date = new Date(startDate);
// //       date.setDate(startDate.getDate() + i);
// //       const dateStr = date.toISOString().split('T')[0];

// //       // Heatmap logic
// //       const dailyStat = counts.find(c => c.date === dateStr);
// //       const intensity = dailyStat ? this.calculateIntensity(dailyStat.count) : 0;

// //     // Event filtering
// //       const dayEvents = allEvents.filter(e => {
// //         // Normalize: If it's a Date object, convert to ISO string. If it's already a string, use it.
// //         const startStr = e.start instanceof Date 
// //             ? e.start.toISOString() 
// //             : e.start;
            
// //         return startStr.startsWith(dateStr);
// //       });

// //       cells.push({
// //         date: date,
// //         dateStr: dateStr,
// //         dayNum: date.getDate(),
// //         isToday: this.isToday(date),
// //         isCurrentMonth: date.getMonth() === month,
// //         intensity: intensity,
// //         events: dayEvents
// //       });
// //     }

// //     return cells;
// //   });

// //   constructor() {
// //     this.fetchData();
// //   }

// //   fetchData() {
// //     this.isLoading.set(true);
// //     const y = this.currentDate().getFullYear();
// //     const m = this.currentDate().getMonth();

// //     // Fetch slightly wider range to cover padding days if needed
// //     // (Simplification: fetching whole current month is usually enough for visual focus)
// //     const startStr = new Date(y, m, 1).toISOString();
// //     const endStr = new Date(y, m + 1, 0).toISOString();

// //     forkJoin({
// //       events: this.notes.getCalendarView(startStr, endStr, 'month'),
// //       counts: this.notes.getNotesForMonth(y, m + 1)
// //     }).subscribe({
// //       next: (res) => {
// //         this.events.set(res.events.data.events);
// //         this.heatmapData.set(res.counts.data as any);
// //         this.isLoading.set(false);
// //       },
// //       error: () => this.isLoading.set(false)
// //     });
// //   }

// //   changeMonth(delta: number) {
// //     const date = new Date(this.currentDate());
// //     date.setMonth(date.getMonth() + delta);
// //     this.currentDate.set(date);
// //     this.fetchData();
// //   }

// //   jumpToToday() {
// //     this.currentDate.set(new Date());
// //     this.fetchData();
// //   }

// //   onEventClick(id: string, event: Event) {
// //     event.stopPropagation();
// //     if (id.startsWith('meeting_')) {
// //       // Handle meeting
// //     } else {
// //       this.router.navigate(['/notes', id]);
// //     }
// //   }

// //   onDateClick(date: Date) {
// //     const dateStr = date.toISOString().split('T')[0];
// //     this.router.navigate(['/notes/create'], { queryParams: { date: dateStr } });
// //   }

// //   isToday(date: Date) {
// //     const today = new Date();
// //     return date.getDate() === today.getDate() &&
// //            date.getMonth() === today.getMonth() &&
// //            date.getFullYear() === today.getFullYear();
// //   }

// //   calculateIntensity(count: number): number {
// //     if (count === 0) return 0;
// //     if (count <= 2) return 1;
// //     if (count <= 5) return 2;
// //     return 3;
// //   }
// // }
