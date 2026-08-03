import { Component, ChangeDetectionStrategy, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../adapters/calendar-event.adapter';
import { CalendarDayCellComponent } from '../day-cell/calendar-day-cell.component';

@Component({
  selector: 'app-calendar-week',
  standalone: true,
  imports: [CommonModule, CalendarDayCellComponent],
  template: `
    <div class="flex-1 grid grid-cols-7 gap-[1px]">
      @for (day of days; track day.date.toISOString()) {
        <app-calendar-day-cell 
          [date]="day.date"
          [isCurrentMonth]="day.isCurrentMonth"
          [isToday]="day.isToday"
          [events]="day.events">
        </app-calendar-day-cell>
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarWeekComponent {
  @Input({ required: true }) startDate!: Date;
  @Input({ required: true }) currentMonth!: number;
  @Input({ required: true }) events!: CalendarEvent[];

  get days() {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const weekDays = [];
    let current = new Date(this.startDate);
    
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(current);
      
      // Filter events that fall on this day
      // Basic check: start date falls on this day
      const dayEvents = this.events.filter(e => {
        const evStart = new Date(e.start);
        return evStart.getDate() === cellDate.getDate() && 
               evStart.getMonth() === cellDate.getMonth() && 
               evStart.getFullYear() === cellDate.getFullYear();
      });

      weekDays.push({
        date: cellDate,
        isCurrentMonth: cellDate.getMonth() === this.currentMonth,
        isToday: cellDate.getTime() === today.getTime(),
        events: dayEvents
      });
      
      current.setDate(current.getDate() + 1);
    }
    return weekDays;
  }
}
