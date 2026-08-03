import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CalendarFacade } from '../../facade/calendar.facade';
import { CalendarStore } from '../../store/calendar.store';
import { CalendarEvent } from '../../adapters/calendar-event.adapter';

@Component({
  selector: 'app-event-chip',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
    <div class="px-1.5 py-1 text-xs rounded truncate cursor-pointer shadow-sm border flex items-center gap-1 hover:brightness-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
         role="button"
         tabindex="0"
         [attr.aria-label]="event.title"
         [ngClass]="getStyleClasses()"
         [title]="event.title"
         [class.ring-2]="isSelected()"
         [class.ring-offset-1]="isSelected()"
         [class.ring-blue-500]="isSelected()"
         (click)="onSelect($event)"
         (keydown.enter)="onSelect($event)"
         (keydown.space)="onSelect($event)">
      
      <!-- Icon based on type/status -->
      <i [class]="getIconClass()" class="text-[10px]"></i>

      <!-- Content -->
      <span class="flex-1 truncate font-medium">
        @if (!event.allDay) {
          <span class="opacity-75 mr-1 font-normal">{{ event.start | date:'shortTime' }}</span>
        }
        {{ event.title }}
      </span>

      <!-- Urgent / SLA breach indicator -->
      @if (isUrgentOrBreached()) {
        <i class="pi pi-exclamation-circle text-red-500 shrink-0" title="Urgent or SLA Breached"></i>
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventChipComponent {
  @Input({ required: true }) event!: CalendarEvent;

  private facade = inject(CalendarFacade);
  private store = inject(CalendarStore);

  isSelected(): boolean {
    return this.store.selectedEventId() === this.event.id;
  }

  onSelect(e: Event) {
    e.stopPropagation(); // prevent day cell click
    this.facade.selectEvent(this.event.id);
  }

  getStyleClasses(): string {
    // Using Tailwind classes based on event color token or type
    // Fallbacks if backend doesn't provide explicit valid tailwind classes
    if (this.event.sourceType === 'holiday') return 'bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-900 dark:border-purple-800 dark:text-purple-100';
    if (this.event.sourceType === 'meeting') return 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-100';
    if (this.event.sourceType === 'work_assignment') return 'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-800 dark:text-emerald-100';

    // Default / Note
    return 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900 dark:border-amber-800 dark:text-amber-100';
  }

  getIconClass(): string {
    switch (this.event.sourceType) {
      case 'meeting': return 'pi pi-video';
      case 'holiday': return 'pi pi-calendar-plus';
      case 'work_assignment': return 'pi pi-wrench';
      case 'task': return 'pi pi-check-square';
      default: return 'pi pi-file';
    }
  }

  isUrgentOrBreached(): boolean {
    return this.event.extendedProps?.priority === 'urgent' ||
      this.event.extendedProps?.sla?.breached === true;
  }
}
