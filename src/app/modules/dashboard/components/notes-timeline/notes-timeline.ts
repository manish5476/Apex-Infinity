import { 
  Component, 
  OnInit, 
  Output, 
  EventEmitter, 
  inject, 
  ChangeDetectionStrategy, 
  ViewChild,
  ElementRef,
  signal,
  computed,
  effect,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { NoteService } from '../../../../core/services/notes.service'; 

interface TimelineDay {
  date: Date;
  dayNum: number;
  dayName: string;
  count: number;
  intensity: number; // 0: None, 1: Low, 2: Medium, 3: High
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

  @Output() dateSelected = new EventEmitter<Date>();
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  // --- Signals for State Management ---
  currentDate = signal(new Date());
  selectedDate = signal(new Date());
  timelineDays = signal<TimelineDay[]>([]);
  isLoading = signal(true);

  // Computed Values
  currentMonthName = computed(() => 
    this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' })
  );

  isCurrentMonth = computed(() => {
    const today = new Date();
    const current = this.currentDate();
    return current.getMonth() === today.getMonth() && 
           current.getFullYear() === today.getFullYear();
  });

  constructor() {
    // Effect: Scroll to active date whenever the timeline data is refreshed
    effect(() => {
      if (!this.isLoading() && this.timelineDays().length > 0) {
        // Small timeout to allow DOM to render
        setTimeout(() => this.scrollToSelected(), 100);
      }
    });
  }

  ngOnInit(): void {
    this.loadMonthData();
  }

  // --- Data Loading ---
  loadMonthData(): void {
    this.isLoading.set(true);
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth() + 1;

    const daysInMonth = new Date(year, month, 0).getDate();
    const tempDays: TimelineDay[] = [];

    // 1. Generate skeleton days
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

    // 2. Fetch Data
    this.noteService.getDailyNoteCounts(year, month).subscribe({
      next: (res: any) => {
        const apiCounts = res.data || [];
        
        const mappedDays = tempDays.map(day => {
          const match = apiCounts.find((c: any) => c.day === day.dayNum);
          const count = match ? (match.count !== undefined ? match.count : 1) : 0;
          
          return {
            ...day,
            count: count,
            intensity: this.calculateIntensity(count)
          };
        });

        this.timelineDays.set(mappedDays);
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback to empty days on error
        this.timelineDays.set(tempDays);
        this.isLoading.set(false);
      }
    });
  }

  // --- Interactions ---

  selectDate(date: Date): void {
    this.selectedDate.set(date);
    this.dateSelected.emit(date);
    this.scrollToSelected();
  }

  changeMonth(delta: number): void {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    newDate.setDate(1); // Reset to 1st to avoid overflow issues
    this.currentDate.set(newDate);
    this.loadMonthData();
  }

  jumpToToday(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.selectDate(today);
    this.loadMonthData();
  }

  // --- Keyboard Navigation ---
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Only navigate if we have days loaded
    if (this.isLoading() || this.timelineDays().length === 0) return;

    const currentSel = this.selectedDate();
    const days = this.timelineDays();
    const currentIndex = days.findIndex(d => d.date.toDateString() === currentSel.toDateString());

    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      this.selectDate(days[currentIndex - 1].date);
    } else if (event.key === 'ArrowRight' && currentIndex < days.length - 1) {
      this.selectDate(days[currentIndex + 1].date);
    }
  }

  // --- Helpers ---

  calculateIntensity(count: number): number {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    return 3;
  }

  isSameDate(d1: Date, d2: Date): boolean {
    return d1.toDateString() === d2.toDateString();
  }

  isToday(date: Date): boolean {
    return this.isSameDate(date, new Date());
  }

  getTooltipText(day: TimelineDay): string {
    if (day.count === 0) return 'No notes';
    return `${day.count} Note${day.count > 1 ? 's' : ''} • ${day.dayName}, ${this.currentMonthName()}`;
  }

  getDotArray(count: number): number[] {
    return Array(Math.min(count, 3)).fill(0);
  }

  scrollToSelected() {
    if (!this.scrollContainer) return;
    
    // Find the active element in the list
    // We use a timeout to ensure view is updated
    setTimeout(() => {
      const container = this.scrollContainer.nativeElement;
      const activeEl = container.querySelector('.day-card.active') as HTMLElement;
      
      if (activeEl) {
        const containerWidth = container.offsetWidth;
        const elLeft = activeEl.offsetLeft;
        const elWidth = activeEl.offsetWidth;
        
        // Center calculation
        const scrollPos = elLeft - (containerWidth / 2) + (elWidth / 2);
        
        container.scrollTo({
          left: scrollPos,
          behavior: 'smooth'
        });
      }
    }, 50);
  }
}

// import { 
//   Component, 
//   OnInit, 
//   Output, 
//   EventEmitter, 
//   inject, 
//   ChangeDetectionStrategy, 
//   ChangeDetectorRef,
//   ViewChild,
//   ElementRef
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { SkeletonModule } from 'primeng/skeleton';
// import { NoteService } from '../../../../core/services/notes.service'; // Check path

// interface DailyNoteCount {
//     day: number;
//     count?: number; // API might return count inside, or just exist implies 1
// }

// interface TimelineDay {
//   date: Date;
//   dayNum: number;
//   dayName: string;
//   count: number;
//   intensity: number;
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

//   @Output() dateSelected = new EventEmitter<Date>();
//   @ViewChild('scrollContainer') scrollContainer!: ElementRef;

//   currentDate = new Date();
//   selectedDate: Date = new Date();
//   timelineDays: TimelineDay[] = [];
//   isLoading = true;

//   get currentMonthName(): string {
//     return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
//   }

//   ngOnInit(): void {
//     this.loadMonthData();
//   }

//   loadMonthData(): void {
//     this.isLoading = true;
//     const year = this.currentDate.getFullYear();
//     const month = this.currentDate.getMonth() + 1;

//     // 1. Create framework for all days in month
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

//     // 2. Call API
//     this.noteService.getDailyNoteCounts(year, month).subscribe({
//       next: (res: any) => {
//         // Handle response: {"data": [{"day": 14}]}
//         // If your API returns count property: {"day": 14, "count": 5} use that.
//         // If it returns JUST the day object implies 1 note? 
//         // Assuming your aggregator returns { day: 14, count: X } based on previous code.
//         const apiCounts = res.data || [];

//         this.timelineDays = tempDays.map(day => {
//           const match = apiCounts.find((c: any) => c.day === day.dayNum);
//           // If match has .count use it, otherwise if match exists assume 1, else 0
//           const count = match ? (match.count !== undefined ? match.count : 1) : 0; 
          
//           return {
//             ...day,
//             count: count,
//             intensity: count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : 3
//           };
//         });
        
//         this.isLoading = false;
//         this.cdr.markForCheck();
        
//         // If we are viewing the current month, ensure today is selected/visible
//         if (this.isCurrentMonth()) {
//             setTimeout(() => this.scrollToActive(), 100);
//         }
//       },
//       error: () => {
//         this.isLoading = false;
//         this.timelineDays = tempDays; 
//         this.cdr.markForCheck();
//       }
//     });
//   }

//   selectDate(date: Date): void {
//     this.selectedDate = date;
//     this.dateSelected.emit(date);
//     this.cdr.markForCheck();
//   }

//   changeMonth(delta: number): void {
//     this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + delta, 1);
//     this.loadMonthData();
//   }

//   jumpToToday(): void {
//     this.currentDate = new Date();
//     this.selectedDate = new Date();
//     this.loadMonthData();
//     this.selectDate(this.selectedDate);
//   }

//   // --- Helpers for Template ---

//   isSelected(day: TimelineDay): boolean {
//     return day.date.toDateString() === this.selectedDate.toDateString();
//   }

//   isToday(day: TimelineDay): boolean {
//       const today = new Date();
//       return day.date.toDateString() === today.toDateString();
//   }

//   isCurrentMonth(): boolean {
//       const today = new Date();
//       return this.currentDate.getMonth() === today.getMonth() && 
//              this.currentDate.getFullYear() === today.getFullYear();
//   }

//   getTooltipText(day: TimelineDay): string {
//       if (day.count === 0) return 'No notes';
//       return `${day.count} Note${day.count > 1 ? 's' : ''} on ${day.dayNum} ${this.currentMonthName.split(' ')[0]}`;
//   }

//   getDotArray(count: number): number[] {
//       // Return array of length min(count, 3)
//       return Array(Math.min(count, 3)).fill(0);
//   }

//   scrollToActive() {
//       // Basic logic to scroll container to the active day
//       if (this.scrollContainer) {
//           const activeEl = this.scrollContainer.nativeElement.querySelector('.day-card.active');
//           if (activeEl) {
//               activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
//           }
//       }
//   }
// }
