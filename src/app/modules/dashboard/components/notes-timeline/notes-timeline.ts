import { ChangeDetectionStrategy, Component, computed, signal, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { DailyNoteCount, NoteService } from '../../../../core/services/notes.service';

@Component({
  selector: 'app-notes-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notes-timeline-wrapper">
        <div class="timeline-header">
            <i class="pi pi-bars mr-2"></i>
            <span class="timeline-title">Monthly Notes Timeline</span>
            <div class="timeline-controls">
                <i class="pi pi-spin pi-spinner" [class.hidden]="!isLoading()"></i>
            </div>
        </div>
        <div class="timeline-month-view">
            @for (day of monthDays(); track day.date) {
                <div 
                    class="timeline-day" 
                    [class.has-notes]="day.noteCount > 0"
                    [class.today]="day.isToday"
                    (click)="openNotesDialog(day.date)"
                    [style.height.px]="40 + day.noteCount * 4"
                    [style.transform]="day.noteCount > 0 ? 'scaleY(1.05)' : 'scaleY(1)'"
                >
                    <div class="day-label">{{ day.dayOfMonth }}</div>
                    @if (day.noteCount > 0) {
                        <div class="note-badge">{{ day.noteCount }}</div>
                    }
                </div>
            }
        </div>
    </div>
  `,
  styleUrls: ['./notes-timeline.scss'], // Create this file
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesTimelineComponent implements OnInit {
    private noteService = inject(NoteService);

    @Input() monthDate: Date = new Date();
    @Output() daySelected = new EventEmitter<Date>();

    isLoading = signal(false);
    dailyCounts = signal<DailyNoteCount[]>([]);

    // Computed property to generate the array of days for the visualization
    monthDays = computed(() => {
        const date = this.monthDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const counts = this.dailyCounts();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 1; i <= lastDayOfMonth; i++) {
            const currentDate = new Date(year, month, i);
            const countData = counts.find(d => d.day === i);
            days.push({
                date: currentDate,
                dayOfMonth: i,
                noteCount: countData?.count || 0,
                isToday: currentDate.getTime() === today.getTime()
            });
        }
        return days;
    });

    ngOnInit(): void {
        this.fetchDailyNoteCounts();
    }

    // Since the input monthDate changes, we need to react to it.
    // We can observe changes to the input by making the input a signal in Angular 17+ 
    // or manually trigger the fetch here if the component is reused with different dates.
    // For simplicity, we'll assume the parent re-renders or updates the input.
    ngOnChanges() {
        this.fetchDailyNoteCounts();
    }

    fetchDailyNoteCounts(): void {
        this.isLoading.set(true);
        const year = this.monthDate.getFullYear();
        const month = this.monthDate.getMonth() + 1;

        this.noteService.getDailyNoteCounts(year, month).pipe(
            finalize(() => this.isLoading.set(false))
        ).subscribe({
            next: (res: any) => this.dailyCounts.set(res.data || []),
            error: () => this.dailyCounts.set([])
        });
    }

    openNotesDialog(date: Date): void {
        this.daySelected.emit(date);
    }
}

// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-notes-timeline',
//   imports: [],
//   templateUrl: './notes-timeline.html',
//   styleUrl: './notes-timeline.scss',
// })
// export class NotesTimeline {

// }
