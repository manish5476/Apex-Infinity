import { 
  Component, 
  OnInit, 
  Output, 
  EventEmitter, 
  inject, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { NoteService } from '../../../../core/services/notes.service'; // Check path

interface DailyNoteCount {
    day: number;
    count?: number; // API might return count inside, or just exist implies 1
}

interface TimelineDay {
  date: Date;
  dayNum: number;
  dayName: string;
  count: number;
  intensity: number;
}

@Component({
  selector: 'app-note-timeline',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, SkeletonModule],
  templateUrl: './notes-timeline.html',
  styleUrls: ['./notes-timeline.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteTimelineComponent implements OnInit {
  private noteService = inject(NoteService);
  private cdr = inject(ChangeDetectorRef);

  @Output() dateSelected = new EventEmitter<Date>();
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  currentDate = new Date();
  selectedDate: Date = new Date();
  timelineDays: TimelineDay[] = [];
  isLoading = true;

  get currentMonthName(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  ngOnInit(): void {
    this.loadMonthData();
  }

  loadMonthData(): void {
    this.isLoading = true;
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;

    // 1. Create framework for all days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const tempDays: TimelineDay[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      tempDays.push({
        date: date,
        dayNum: i,
        dayName: date.toLocaleDateString('default', { weekday: 'short' }),
        count: 0,
        intensity: 0
      });
    }

    // 2. Call API
    this.noteService.getDailyNoteCounts(year, month).subscribe({
      next: (res: any) => {
        // Handle response: {"data": [{"day": 14}]}
        // If your API returns count property: {"day": 14, "count": 5} use that.
        // If it returns JUST the day object implies 1 note? 
        // Assuming your aggregator returns { day: 14, count: X } based on previous code.
        const apiCounts = res.data || [];

        this.timelineDays = tempDays.map(day => {
          const match = apiCounts.find((c: any) => c.day === day.dayNum);
          // If match has .count use it, otherwise if match exists assume 1, else 0
          const count = match ? (match.count !== undefined ? match.count : 1) : 0; 
          
          return {
            ...day,
            count: count,
            intensity: count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : 3
          };
        });
        
        this.isLoading = false;
        this.cdr.markForCheck();
        
        // If we are viewing the current month, ensure today is selected/visible
        if (this.isCurrentMonth()) {
            setTimeout(() => this.scrollToActive(), 100);
        }
      },
      error: () => {
        this.isLoading = false;
        this.timelineDays = tempDays; 
        this.cdr.markForCheck();
      }
    });
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
    this.dateSelected.emit(date);
    this.cdr.markForCheck();
  }

  changeMonth(delta: number): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + delta, 1);
    this.loadMonthData();
  }

  jumpToToday(): void {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.loadMonthData();
    this.selectDate(this.selectedDate);
  }

  // --- Helpers for Template ---

  isSelected(day: TimelineDay): boolean {
    return day.date.toDateString() === this.selectedDate.toDateString();
  }

  isToday(day: TimelineDay): boolean {
      const today = new Date();
      return day.date.toDateString() === today.toDateString();
  }

  isCurrentMonth(): boolean {
      const today = new Date();
      return this.currentDate.getMonth() === today.getMonth() && 
             this.currentDate.getFullYear() === today.getFullYear();
  }

  getTooltipText(day: TimelineDay): string {
      if (day.count === 0) return 'No notes';
      return `${day.count} Note${day.count > 1 ? 's' : ''} on ${day.dayNum} ${this.currentMonthName.split(' ')[0]}`;
  }

  getDotArray(count: number): number[] {
      // Return array of length min(count, 3)
      return Array(Math.min(count, 3)).fill(0);
  }

  scrollToActive() {
      // Basic logic to scroll container to the active day
      if (this.scrollContainer) {
          const activeEl = this.scrollContainer.nativeElement.querySelector('.day-card.active');
          if (activeEl) {
              activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
      }
  }
}

// import { 
//   Component, 
//   OnInit, 
//   Output, 
//   EventEmitter, 
//   inject, 
//   ChangeDetectionStrategy, 
//   ChangeDetectorRef 
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { SkeletonModule } from 'primeng/skeleton';
// import { NoteService } from '../../../../core/services/notes.service';
// import { DailyNoteCount } from '../../../../core/models/note.types';


// interface TimelineDay {
//   date: Date;
//   dayNum: number;    // 1, 2, 3...
//   dayName: string;   // 'Mon', 'Tue'
//   count: number;     // Note count from API
//   intensity: number; // 0-3 (for styling color intensity)
// }

// @Component({
//   selector: 'app-note-timeline',
//   standalone: true,
//   imports: [CommonModule, ButtonModule, TooltipModule, SkeletonModule],
//   templateUrl: './notes-timeline.html',
//   styleUrls: ['./notes-timeline.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class NoteTimelineComponent implements OnInit {
//   private noteService = inject(NoteService);
//   private cdr = inject(ChangeDetectorRef);

//   // Events
//   @Output() dateSelected = new EventEmitter<Date>();

//   // State
//   currentDate = new Date();
//   selectedDate: Date = new Date();
//   timelineDays: TimelineDay[] = [];
//   isLoading = true;

//   // Navigation helpers
//   get currentMonthName(): string {
//     return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
//   }

//   ngOnInit(): void {
//     this.loadMonthData();
//   }

//   /**
//    * 1. Generate standard calendar days
//    * 2. Fetch API counts
//    * 3. Merge them
//    */
//   loadMonthData(): void {
//     this.isLoading = true;
//     const year = this.currentDate.getFullYear();
//     const month = this.currentDate.getMonth() + 1; // JS months are 0-indexed

//     // 1. Generate basic calendar structure
//     const daysInMonth = new Date(year, month, 0).getDate();
//     const tempDays: TimelineDay[] = [];

//     for (let i = 1; i <= daysInMonth; i++) {
//       const date = new Date(year, month - 1, i);
//       tempDays.push({
//         date: date,
//         dayNum: i,
//         dayName: date.toLocaleDateString('default', { weekday: 'short' }),
//         count: 0,
//         intensity: 0
//       });
//     }

//     // 2. Fetch Data
//     this.noteService.getDailyNoteCounts(year, month).subscribe({
//       next: (res) => {
//         const apiCounts = res.data || [];

//         // 3. Merge Logic
//         this.timelineDays = tempDays.map(day => {
//           const match = apiCounts.find((c: DailyNoteCount) => c.day === day.dayNum);
//           const count = match ? match.count : 0;
          
//           return {
//             ...day,
//             count: count,
//             // Simple intensity logic for coloring: 0=none, 1=1-2 notes, 2=3-5 notes, 3=5+
//             intensity: count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : 3
//           };
//         });
        
//         this.isLoading = false;
//         this.cdr.markForCheck();
        
//         // Optional: Auto-select today if in current month
//         this.selectDate(this.selectedDate); 
//       },
//       error: () => {
//         this.isLoading = false;
//         // Fallback to empty calendar
//         this.timelineDays = tempDays; 
//         this.cdr.markForCheck();
//       }
//     });
//   }

//   selectDate(date: Date): void {
//     this.selectedDate = date;
//     this.dateSelected.emit(date);
//   }

//   changeMonth(delta: number): void {
//     this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + delta, 1);
//     this.loadMonthData();
//   }

//   isSelected(day: TimelineDay): boolean {
//     return day.date.toDateString() === this.selectedDate.toDateString();
//   }
// }
