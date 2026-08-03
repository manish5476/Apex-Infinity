import { Component, ChangeDetectionStrategy, inject, Type, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStore } from '../../store/calendar.store';
import { CalendarEvent } from '../../adapters/calendar-event.adapter';
import { CalendarFacade } from '../../facade/calendar.facade';

// --- Dynamic Detail Components ---

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <i class="pi pi-video text-xl"></i>
        </div>
        <div>
          <h3 class="font-bold text-slate-800 dark:text-slate-100">{{ event.title }}</h3>
          <p class="text-xs text-slate-500">Meeting</p>
        </div>
      </div>
      <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300">
        <p><i class="pi pi-clock mr-2"></i> {{ event.start | date:'shortTime' }} - {{ event.end | date:'shortTime' }}</p>
      </div>
      <button class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
        Join Meeting
      </button>
    </div>
  `
})
export class MeetingDetailComponent { @Input() event!: CalendarEvent; }

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <i class="pi pi-wrench text-xl"></i>
        </div>
        <div>
          <h3 class="font-bold text-slate-800 dark:text-slate-100">{{ event.title }}</h3>
          <p class="text-xs text-slate-500">Work Assignment</p>
        </div>
      </div>
      <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300" *ngIf="event.extendedProps.sla?.breached">
        <p class="font-semibold"><i class="pi pi-exclamation-triangle mr-1"></i> SLA Breached</p>
        <p class="text-xs mt-1">Completion deadline was {{ event.extendedProps.sla?.completionDeadline | date:'short' }}</p>
      </div>
      <div class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <p><i class="pi pi-map-marker mr-2 w-4 text-center"></i> {{ event.extendedProps.location?.address || 'Remote' }}</p>
        <p><i class="pi pi-users mr-2 w-4 text-center"></i> {{ event.extendedProps.assignees?.length || 0 }} Assignees</p>
      </div>
    </div>
  `
})
export class WorkAssignmentDetailComponent { @Input() event!: CalendarEvent; }

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
          <i class="pi pi-calendar-plus text-xl"></i>
        </div>
        <div>
          <h3 class="font-bold text-slate-800 dark:text-slate-100">{{ event.title }}</h3>
          <p class="text-xs text-slate-500">Holiday</p>
        </div>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-400">Office is closed.</p>
    </div>
  `
})
export class HolidayDetailComponent { @Input() event!: CalendarEvent; }

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <i class="pi pi-file text-xl"></i>
        </div>
        <div>
          <h3 class="font-bold text-slate-800 dark:text-slate-100">{{ event.title }}</h3>
          <p class="text-xs text-slate-500">Note / Task</p>
        </div>
      </div>
    </div>
  `
})
export class NoteDetailComponent { @Input() event!: CalendarEvent; }

// --- Main Panel Component ---

@Component({
  selector: 'app-calendar-right-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 hidden lg:flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-none z-10 transition-transform duration-200">
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-800 dark:text-slate-100">Event Details</h2>
        <button class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors" (click)="closePanel()">
          <i class="pi pi-times"></i>
        </button>
      </div>
      
      <div class="p-4 flex-1 overflow-y-auto">
        @if (store.selectedEvent(); as event) {
          <ng-container *ngComponentOutlet="getComponentType(event); inputs: { event: event }"></ng-container>
        } @else {
          <div class="h-full flex flex-col items-center justify-center text-slate-400 text-sm text-center">
            <i class="pi pi-calendar text-4xl mb-4 opacity-50"></i>
            <p>Select an event in the calendar<br>to view details here</p>
          </div>
        }
      </div>
    </aside>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarRightPanelComponent {
  store = inject(CalendarStore);
  private facade = inject(CalendarFacade);

  closePanel() {
    this.facade.selectEvent(null);
  }

  getComponentType(event: CalendarEvent): Type<any> {
    switch (event.sourceType) {
      case 'meeting': return MeetingDetailComponent;
      case 'work_assignment': return WorkAssignmentDetailComponent;
      case 'holiday': return HolidayDetailComponent;
      case 'note':
      case 'task':
      default: return NoteDetailComponent;
    }
  }
}
