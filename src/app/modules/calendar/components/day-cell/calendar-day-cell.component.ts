import { Component, ChangeDetectionStrategy, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../adapters/calendar-event.adapter';
import { EventChipComponent } from '../event-chip/event-chip.component';

@Component({
  selector: 'app-calendar-day-cell',
  standalone: true,
  imports: [CommonModule, EventChipComponent],
  template: `
    <div class="relative flex flex-col h-full bg-white dark:bg-slate-950 p-1.5 transition-colors group focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500"
         role="gridcell"
         tabindex="0"
         [class.bg-slate-50]="!isCurrentMonth"
         [class.dark:bg-slate-900]="!isCurrentMonth"
         [class.bg-blue-50]="isToday"
         [class.dark:bg-blue-900]="isToday"
         (click)="onDayClick()"
         (keydown.enter)="onDayClick()"
         (keydown.space)="onDayClick()">
      
      <!-- Day Header -->
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full"
              [class.text-slate-400]="!isCurrentMonth"
              [class.text-slate-700]="isCurrentMonth && !isToday"
              [class.dark:text-slate-300]="isCurrentMonth && !isToday"
              [class.bg-blue-600]="isToday"
              [class.text-white]="isToday">
          {{ date.getDate() }}
        </span>
      </div>

      <!-- Events Container -->
      <div class="flex-1 overflow-hidden flex flex-col gap-1">
        @for (event of visibleEvents; track event.id) {
          <app-event-chip [event]="event"></app-event-chip>
        }
        
        @if (overflowCount > 0) {
          <button class="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mt-0.5 text-left pl-1"
                  (click)="openMoreDialog($event)">
            +{{ overflowCount }} more
          </button>
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDayCellComponent {
  @Input({ required: true }) date!: Date;
  @Input() isCurrentMonth = true;
  @Input() isToday = false;
  
  @Input() set events(val: CalendarEvent[]) {
    // Sort events: all-day first, then by start time, then by priority
    const sorted = [...(val || [])].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
    this.allEvents = sorted;
    this.visibleEvents = sorted.slice(0, 3);
    this.overflowCount = sorted.length > 3 ? sorted.length - 3 : 0;
  }

  allEvents: CalendarEvent[] = [];
  visibleEvents: CalendarEvent[] = [];
  overflowCount = 0;

  onDayClick() {
    alert(`Day Clicked: ${this.date.toDateString()}\n\nThis will eventually open a day-view or an event creation modal for this specific date.`);
  }

  openMoreDialog(e: Event) {
    e.stopPropagation();
    // Scaffold for "+N more" dialog
  }
}
