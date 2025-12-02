// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-schedule-planner',
//   imports: [],
  // templateUrl: './schedule-planner.html',
  // styleUrl: './schedule-planner.scss',
// })
// export class SchedulePlanner {

// }
import { Component, ChangeDetectionStrategy, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
// import { OverlayPanelModule } from 'primeng/overlaypanel'; // For the hover popups
import { ScrollPanelModule } from 'primeng/scrollpanel'; // For the main scrollable area
import { DialogModule } from 'primeng/dialog';
import { finalize } from 'rxjs';
import { NoteService } from '../../../../core/services/notes.service';
import { PopoverModule } from 'primeng/popover';
// --- Interfaces for Note/Event Blocks ---
export interface TimelineNote {
    _id: string;
    title: string;
    content: string;
    startHour: number; // 0-23
    startMinute: number;
    durationMinutes: number; // For rendering height
    date: Date; // Full date for the note
    isPinned: boolean;
}

@Component({
  selector: 'app-schedule-planner',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe, 
    ButtonModule, 
    PopoverModule, 
    ScrollPanelModule, 
    DialogModule
  ],
  templateUrl: './schedule-planner.html',
  styleUrl: './schedule-planner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePlannerComponent implements OnInit {
    private noteService = inject(NoteService);
    
    // The current date defining the week to display (usually a Monday)
    currentWeekStart = signal(this.getStartOfWeek(new Date())); 
    
    // Dictionary to hold notes, keyed by day index (0=Sun, 6=Sat)
    notesByDay = signal<Record<number, TimelineNote[]>>({});
    isLoading = signal(false);

    // Dialog state for viewing/editing a note
    showNoteDialog = signal(false);
    selectedNote = signal<TimelineNote | null>(null);

    // Computed array of the 7 dates in the current week
    displayedDates = computed(() => {
        const start = this.currentWeekStart();
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date);
        }
        return dates;
    });

    // Helper to generate the 24 hourly labels (7 am, 8 am, ..., 1 pm, ...)
    hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
todayDate: string|number|Date=new Date();

    ngOnInit(): void {
        this.fetchWeekNotes();
    }

    // Effect/Method to re-fetch when the week changes
    ngOnChanges() {
        this.fetchWeekNotes();
    }

    private getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay(); // 0 is Sunday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    
    // --- Data Fetching ---

    fetchWeekNotes(): void {
         // this.isLoading.set(true);
        const dates = this.displayedDates();
        
        // Use the first day (Monday) and last day (Sunday) for API filtering
        const startDate = dates[0].toISOString().split('T')[0];
        const endDate = dates[6].toISOString().split('T')[0];
        
        // This is a placeholder call; actual API structure needed for range filtering
        // Assuming your getNotes can take a date range or week filter
        this.noteService.getNotes({ date: startDate, week: endDate } as any) 
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (res: any) => {
                    const processedNotes = this.processNotesToTimeline(res.data || []);
                    this.notesByDay.set(processedNotes);
                }
            });
    }
    
    // --- Data Processing ---
    
    processNotesToTimeline(rawNotes: any[]): Record<number, TimelineNote[]> {
        const processed: Record<number, TimelineNote[]> = {};
        const dates = this.displayedDates();

        rawNotes.forEach(note => {
            const noteDate = new Date(note.createdAt);
            const dayIndex = noteDate.getDay(); // 0=Sun, 1=Mon...
            
            // Map the day index to the displayed dates array index (0=Mon, 6=Sun)
            let displayIndex = dayIndex - 1;
            if (displayIndex < 0) displayIndex = 6; // Sunday maps to index 6
            
            // Map the Mongoose schema to the TimelineNote view model
            const startHour = noteDate.getHours();
            const startMinute = noteDate.getMinutes();
            
            // Assuming notes are simple blocks, let's give them a default render duration of 60 minutes
            const durationMinutes = 60; 

            const timelineNote: TimelineNote = {
                _id: note._id,
                title: note.title || 'Untitled Note',
                content: note.content,
                startHour,
                startMinute,
                durationMinutes,
                date: noteDate,
                isPinned: note.isPinned || false,
            };

            if (!processed[displayIndex]) {
                processed[displayIndex] = [];
            }
            processed[displayIndex].push(timelineNote);
        });

        return processed;
    }
    
    // --- UI/Event Handlers ---
    
    changeWeek(offset: number): void {
        const newStart = new Date(this.currentWeekStart());
        newStart.setDate(newStart.getDate() + offset * 7);
        this.currentWeekStart.set(newStart);
        this.fetchWeekNotes();
    }
    
    goToToday(): void {
        this.currentWeekStart.set(this.getStartOfWeek(new Date()));
        this.fetchWeekNotes();
    }
    
    editNote(note: TimelineNote): void {
        this.selectedNote.set(note);
        this.showNoteDialog.set(true);
    }

    // Calculates the CSS 'top' position (in percentage) for the event block
    getNoteTop(note: TimelineNote): string {
        // Total minutes from start of display (e.g., 6:00 AM)
        const totalMinutes = (note.startHour * 60 + note.startMinute) - (6 * 60); 
        
        // Total duration of the timeline (6 AM to 12 AM) = 18 hours * 60 minutes = 1080 minutes
        // We use an arbitrary 18-hour visible block for calculation
        const timelineMinutes = 18 * 60; 
        
        return `${(totalMinutes / timelineMinutes) * 100}%`;
    }

    // Calculates the CSS 'height' for the event block
    getNoteHeight(note: TimelineNote): string {
        // Height is proportional to duration
        const timelineMinutes = 18 * 60; 
        return `${(note.durationMinutes / timelineMinutes) * 100}%`;
    }

    // Gets the header text for the dialog
    getNoteDialogHeader(note: TimelineNote): string {
        return note.date.toLocaleString('default', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
}