import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CalendarStore } from '../../store/calendar.store';
import { CalendarFacade } from '../../facade/calendar.facade';

@Component({
  selector: 'app-calendar-toolbar',
  standalone: true,
  providers: [DatePipe],
  template: `
    <header class="flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100 w-48">{{ currentMonthText() }}</h1>
        <div class="flex items-center gap-2">
          <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" (click)="prevMonth()">
            <i class="pi pi-chevron-left"></i>
          </button>
          <button class="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors" (click)="goToToday()">
            Today
          </button>
          <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" (click)="nextMonth()">
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <!-- Right Side Actions & Views -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 mr-2">
          <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" title="Search">
            <i class="pi pi-search"></i>
          </button>
          <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" title="Filters">
            <i class="pi pi-filter"></i>
          </button>
          <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" title="Export">
            <i class="pi pi-download"></i>
          </button>
          <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" title="Refresh" (click)="refresh()">
            <i class="pi pi-refresh" [class.pi-spin]="store.isLoading()"></i>
          </button>
        </div>

        <div class="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
          <button class="px-3 py-1.5 text-sm font-medium rounded-md bg-white shadow-sm text-slate-900">Month</button>
          <button class="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 opacity-50 cursor-not-allowed" title="Coming Soon">Week</button>
          <button class="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 opacity-50 cursor-not-allowed" title="Coming Soon">Day</button>
          <button class="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 opacity-50 cursor-not-allowed" title="Coming Soon">Agenda</button>
          <button class="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 opacity-50 cursor-not-allowed" title="Coming Soon">Timeline</button>
        </div>

        <button class="px-4 py-2 ml-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2" (click)="quickAdd()">
          <i class="pi pi-plus"></i> Quick Add
        </button>
      </div>
    </header>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarToolbarComponent {
  store = inject(CalendarStore);
  private facade = inject(CalendarFacade);
  private datePipe = inject(DatePipe);

  currentMonthText = computed(() => {
    const start = this.store.rangeStart();
    return start ? this.datePipe.transform(start, 'MMMM yyyy') : '';
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

  goToToday() {
    const now = new Date();
    const newStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.facade.loadAll(newStart, newEnd);
  }

  refresh() {
    const start = this.store.rangeStart();
    const end = this.store.rangeEnd();
    if (start && end) {
      this.facade.loadAll(start, end);
    }
  }

  quickAdd() {
    alert('Quick Add functionality is coming soon! This will open a modal to create a new event.');
  }
}
