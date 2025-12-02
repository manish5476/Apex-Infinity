// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-notification-calendar',
//   imports: [],
//   templateUrl: './notification-calendar.html',
//   styleUrl: './notification-calendar.scss',
// })
// export class NotificationCalendar {

// }

import { ChangeDetectionStrategy, Component, computed, signal, OnInit, inject, effect, EventEmitter, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common'; // Added DatePipe for consistency
import { finalize, Observable, of } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BadgeModule } from 'primeng/badge';
import { NoteService } from '../../../../core/services/notes.service';
import { NotificationService } from '../../../../core/services/notification.service';
// import { NotesTimelineComponent } from '../notes-timeline/notes-timeline';
import { TabsModule } from 'primeng/tabs';

// ... existing interfaces ... (HeatmapDay, DailySummary, CalendarDay)
interface HeatmapDay {
  day: number; totalRevenue: number; salesCount: number; level: number;
}
interface DailySummary {
  date: string;
  revenue: number; salesCount: number; newCustomers: { _id: string; profileImg: string; fullname: string; mobileNumber: string; }[]; newProducts: { _id: string; title: string; thumbnail: string; stock: number; }[];
}



interface CalendarDay {
  date: Date; dayOfMonth: number; isCurrentMonth: boolean; isToday: boolean; heatmapData?: HeatmapDay;
}
@Component({
  selector: 'app-notification-calendar',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe, // Ensure DatePipe is available
    // NotesManagerComponent,
    // // NotesTimelineComponent, // 🆕 Add NotesTimelineComponent
    ProgressSpinnerModule,
    TabsModule,
    BadgeModule,
    DialogModule
  ],
  templateUrl: './notification-calendar.html',
  styleUrls: ['./notification-calendar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NotificationService, NoteService] // Ensure both services are available
})
export class NotificationCalendarComponent implements OnInit {
  // Injecting the services
  private notificationService = inject(NotificationService);
  private noteService = inject(NoteService); // 🆕 Inject NoteService
@Output() dateSelected = new EventEmitter<Date>();
  // --- STATE MANAGEMENT WITH SIGNALS ---
  currentDate = signal(new Date());
  heatmapData = signal<any[]>([]); // Using 'any' for existing notification heatmap
  selectedDay = signal<any | null>(null);
  selectedDaySummary = signal<any | null>(null);

 selectedNoteDate = signal<CalendarDay | null>(null); 
showNotesDialog = signal(false);

  isLoadingHeatmap = signal(false);
  isLoadingSummary = signal(false);
  showSummaryDialog = signal(false);

  // --- COMPUTED SIGNALS ---
  displayedMonth = computed(() => {
    return this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' });
  });


  // ... rest of calendarGrid computed remains the same ...
  // (Paste the existing calendarGrid computed property here)
  calendarGrid = computed<any>(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const heatmap = this.heatmapData();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days: any[] = []; // Changed to any[] for brevity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();

    for (let i = startDayOfWeek; i > 0; i--) {
      const prevMonthDate = new Date(year, month, 1 - i);
      days.push({ date: prevMonthDate, dayOfMonth: prevMonthDate.getDate(), isCurrentMonth: false, isToday: false });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate,
        dayOfMonth: i,
        isCurrentMonth: true,
        isToday: currentDate.getTime() === today.getTime(),
        heatmapData: heatmap.find((d: any) => d.day === i)
      });
    }

    const endDayOfWeek = lastDayOfMonth.getDay();
    if (endDayOfWeek < 6) {
      for (let i = 1; i < 7 - endDayOfWeek; i++) {
        const nextMonthDate = new Date(year, month + 1, i);
        days.push({ date: nextMonthDate, dayOfMonth: nextMonthDate.getDate(), isCurrentMonth: false, isToday: false });
      }
    }
    return days;
  });


  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // calanderDay is now replaced by selectedNoteDate (for note management) and selectedDay (for summary)

  ngOnInit() {
    this.fetchHeatmapData();
  }

  handleMiniCalendarClick(date: Date): void {
    // 1. Emit the selected date to the parent component
    this.dateSelected.emit(date);
    
    // 2. (Optional, for visual feedback) Highlight the selected day in the mini-calendar
    // To do this properly, you'd need a signal to track the externally selected date, 
    // but for now, just emitting is sufficient.
    console.log('Mini-calendar day clicked:', date);
  }
  
  // --- DATA FETCHING METHODS (Unchanged) ---
  fetchHeatmapData(): void { /* ... existing logic ... */ }
  fetchDailySummary(date: Date): void { /* ... existing logic ... */ }

  // --- EVENT HANDLERS ---
  changeMonth(monthOffset: number): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + monthOffset);
    this.currentDate.set(newDate);
    this.selectedDay.set(null);
    this.selectedDaySummary.set(null);
    this.fetchHeatmapData();
  }

  goToToday(): void { /* ... existing logic ... */ }

  selectDay(day: any): void {
    if (!day.isCurrentMonth || !day.heatmapData) return;
    // this.showSummaryDialog.set(true);
    this.selectedDay.set(day);
    this.fetchDailySummary(day.date);
  }

  // --- 🆕 NOTE HANDLERS ---

  addNoteForDay(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    // ✅ Pass the full day object
    this.selectedNoteDate.set(day);
    // this.showNotesDialog.set(true);
  }

  handleTimelineDaySelect(date: Date): void {
    // Find the CalendarDay object matching the date in the current calendar grid view
    const targetDay = this.calendarGrid().find((d: CalendarDay) => d.date.getTime() === date.getTime());

    if (targetDay) {
      this.selectedNoteDate.set(targetDay);
      // this.showNotesDialog.set(true);
    }
  }
  // --- UTILITY METHODS (Unchanged) ---
  isDaySelected(day: any): boolean { /* ... existing logic ... */ return false; }
}