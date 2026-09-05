import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CalendarStore } from '../../store/calendar.store';
import { CalendarFacade } from '../../facade/calendar.facade';

@Component({
  selector: 'app-calendar-left-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-64 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden xl:flex flex-col">
      <!-- Mini Calendar -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center justify-between mb-2 text-slate-800 dark:text-slate-100">
          <h2 class="text-sm font-semibold">{{ currentMonthText() }}</h2>
          <div class="flex items-center gap-1">
            <button class="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded" (click)="prevMonth()"><i class="pi pi-chevron-up text-xs"></i></button>
            <button class="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded" (click)="nextMonth()"><i class="pi pi-chevron-down text-xs"></i></button>
          </div>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs mb-1 text-slate-500 font-medium">
          <span *ngFor="let d of ['S','M','T','W','T','F','S']">{{d}}</span>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs">
          <!-- Dynamic Days -->
          <div *ngFor="let day of miniCalendarDays()"
               class="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer text-slate-700 dark:text-slate-300"
               [class.bg-blue-600]="day.isToday" [class.text-white]="day.isToday" [class.opacity-40]="!day.isCurrentMonth">
            {{ day.date.getDate() }}
          </div>
        </div>
      </div>

      <!-- Scrollable Filters Area -->
      <div class="p-4 flex-1 overflow-y-auto space-y-6">
        
        <!-- Smart Lists -->
        <div>
          <ul class="space-y-0.5">
            <li class="px-2 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium cursor-pointer flex items-center gap-2">
              <i class="pi pi-user"></i> My Schedule
            </li>
            <li class="px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-sm cursor-pointer text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <i class="pi pi-users"></i> Team Schedule
            </li>
            <li class="px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-sm cursor-pointer text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <i class="pi pi-sun"></i> Today's Jobs
            </li>
            <li class="px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-sm cursor-pointer text-slate-700 dark:text-slate-300 flex items-center gap-2 text-red-600 dark:text-red-400">
              <i class="pi pi-exclamation-circle"></i> Overdue
            </li>
            <li class="px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-sm cursor-pointer text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <i class="pi pi-inbox"></i> Unassigned
            </li>
            <li class="px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-sm cursor-pointer text-slate-700 dark:text-slate-300 flex items-center gap-2" (click)="toggleHolidays()">
              <i class="pi pi-calendar-plus" [class.text-purple-500]="store.filters().showHolidays"></i> 
              <span class="flex-1">Upcoming Holidays</span>
              <i class="pi pi-check text-purple-500" *ngIf="store.filters().showHolidays"></i>
            </li>
          </ul>
        </div>

        <!-- Categories -->
        <div>
          <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between group cursor-pointer">
            Priority <i class="pi pi-chevron-down opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </h2>
          <ul class="space-y-0.5">
            <li class="flex items-center gap-2 px-2 py-1 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" (click)="togglePriority('urgent')">
              <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" [checked]="isPrioritySelected('urgent')"> Urgent
            </li>
            <li class="flex items-center gap-2 px-2 py-1 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" (click)="togglePriority('high')">
              <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" [checked]="isPrioritySelected('high')"> High
            </li>
            <li class="flex items-center gap-2 px-2 py-1 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" (click)="togglePriority('normal')">
              <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" [checked]="isPrioritySelected('normal')"> Normal
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between group cursor-pointer">
            Departments <i class="pi pi-chevron-down opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </h2>
          <ul class="space-y-0.5">
            <li class="flex items-center gap-2 px-2 py-1 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" (click)="toggleSourceType('work')">
              <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" [checked]="isSourceTypeSelected('work')"> Field Service
            </li>
            <li class="flex items-center gap-2 px-2 py-1 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" (click)="toggleSourceType('note')">
              <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" [checked]="isSourceTypeSelected('note')"> Sales (Notes)
            </li>
            <li class="flex items-center gap-2 px-2 py-1 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100">
              <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"> HR
            </li>
          </ul>
        </div>

      </div>
    </aside>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarLeftPanelComponent {
  store = inject(CalendarStore);
  private facade = inject(CalendarFacade);
  private datePipe = inject(DatePipe);

  currentMonthText = computed(() => {
    const start = this.store.rangeStart();
    return start ? this.datePipe.transform(start, 'MMMM yyyy') : '';
  });

  miniCalendarDays = computed(() => {
    const start = this.store.rangeStart();
    if (!start) return [];

    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const startDate = new Date(monthStart);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const current = new Date(startDate);
      days.push({
        date: current,
        isCurrentMonth: current.getMonth() === monthStart.getMonth(),
        isToday: current.getTime() === today.getTime()
      });
      startDate.setDate(startDate.getDate() + 1);
    }
    return days;
  });

  prevMonth() {
    const start = this.store.rangeStart();
    if (!start) return;
    const newStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
    this.facade.loadAll(newStart, newEnd);
  }

  nextMonth() {
    const start = this.store.rangeStart();
    if (!start) return;
    const newStart = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
    this.facade.loadAll(newStart, newEnd);
  }

  toggleHolidays() {
    const current = this.store.filters().showHolidays;
    this.facade.updateFilters({ showHolidays: !current });
  }

  togglePriority(priority: string) {
    const current = new Set(this.store.filters().priorities);
    if (current.has(priority)) {
      current.delete(priority);
    } else {
      current.add(priority);
    }
    this.facade.updateFilters({ priorities: Array.from(current) });
  }

  toggleSourceType(source: string) {
    const current = new Set(this.store.filters().sourceTypes);
    if (current.has(source)) {
      current.delete(source);
    } else {
      current.add(source);
    }
    this.facade.updateFilters({ sourceTypes: Array.from(current) });
  }

  isPrioritySelected(priority: string): boolean {
    return this.store.filters().priorities.includes(priority) || this.store.filters().priorities.length === 0;
  }

  isSourceTypeSelected(source: string): boolean {
    return this.store.filters().sourceTypes.includes(source) || this.store.filters().sourceTypes.length === 0;
  }
}
