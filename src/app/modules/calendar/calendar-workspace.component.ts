import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarFacade } from './facade/calendar.facade';
import { CalendarStore } from './store/calendar.store';
import { CalendarToolbarComponent } from './components/toolbar/calendar-toolbar.component';
import { CalendarLeftPanelComponent } from './components/left-panel/calendar-left-panel.component';
import { CalendarRightPanelComponent } from './components/right-panel/calendar-right-panel.component';
import { MonthGridComponent } from './views/month/month-grid.component';

@Component({
  selector: 'app-calendar-workspace',
  standalone: true,
  imports: [CommonModule, CalendarToolbarComponent, CalendarLeftPanelComponent, CalendarRightPanelComponent, MonthGridComponent],
  template: `
    <div class="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">
      <app-calendar-toolbar></app-calendar-toolbar>

      <!-- Main Layout -->
      <div class="flex-1 flex min-h-0 overflow-hidden relative">
        <app-calendar-left-panel></app-calendar-left-panel>
        <app-month-grid class="flex-1 min-w-0"></app-month-grid>
        <app-calendar-right-panel></app-calendar-right-panel>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarWorkspaceComponent implements OnInit, OnDestroy {
  private facade = inject(CalendarFacade);
  public store = inject(CalendarStore);

  ngOnInit() {
    this.facade.startNotifications();
    // Load initial date range (current month)
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.facade.loadAll(start, end);
  }

  ngOnDestroy() {
    this.facade.stopNotifications();
  }
}
