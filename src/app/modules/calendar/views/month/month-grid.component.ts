import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStore } from '../../store/calendar.store';
import { CalendarWeekComponent } from '../../components/week/calendar-week.component';

@Component({
  selector: 'app-month-grid',
  standalone: true,
  imports: [CommonModule, CalendarWeekComponent],
  template: `
    <div class="flex-1 flex flex-col h-full bg-white dark:bg-slate-950">
      <!-- Days of week header -->
      <div class="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div *ngFor="let day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" class="p-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {{ day }}
        </div>
      </div>
      
      <!-- Grid Body -->
      <div class="flex-1 flex flex-col bg-slate-200 dark:bg-slate-800 gap-[1px] border-b border-slate-200 dark:border-slate-800">
        @for (weekStart of weeks(); track weekStart.toISOString()) {
          <app-calendar-week 
            class="flex-1 flex flex-col"
            [startDate]="weekStart"
            [currentMonth]="currentMonth()"
            [events]="store.filteredEvents()">
          </app-calendar-week>
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthGridComponent {
  store = inject(CalendarStore);

  // Derive the current month from rangeStart
  currentMonth = computed(() => {
    const start = this.store.rangeStart();
    return start ? start.getMonth() : new Date().getMonth();
  });

  // Calculate the start date of each week in the grid (typically 5-6 weeks)
  weeks = computed(() => {
    const start = this.store.rangeStart();
    if (!start) return [];

    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const startDate = new Date(monthStart);
    
    // Fall back to Sunday (0) as start of week
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeks: Date[] = [];
    // Render exactly 6 weeks to ensure all months fit uniformly (or dynamic based on month)
    for (let i = 0; i < 6; i++) {
      weeks.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 7);
    }
    return weeks;
  });
}
