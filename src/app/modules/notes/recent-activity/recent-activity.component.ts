import { Component,Input, inject, signal, computed, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoteService } from '../../../core/services/notes.service'; // Adjust path if needed
import { AppMessageService } from '../../../core/services/message.service';

import { 
  Note, NoteActivity 
} from '../../../core/models/note.types';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// Interfaces based on your flattened UI needs
interface FlattenedActivity {
  id: string;
  action: string;
  timestamp: Date;
  actor: string | { name: string };
  note: {
    id: string;
    title: string;
    type: string;
    priority: string;
  };
}

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  templateUrl:'./recent-activity.component.html',
  styleUrl:'./recent-activity.component.scss'
})
export class RecentActivityComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  @Input() notesData:any
  private noteService = inject(NoteService);
  private messageService = inject(AppMessageService);

  rawNotes = signal<Note[]>([]);
  isLoading = signal(true);
  timeline = computed(() => {
    const allActivities: FlattenedActivity[] = [];
    this.rawNotes().forEach(note => {
      // Transitioning from 'activityLog' to 'history' as per new schema
      const history = (note as any).history || (note as any).activityLog || [];
      if (history.length > 0) {
        history.forEach((log: any) => {
          allActivities.push({
            id: log._id,
            action: log.action,
            timestamp: new Date(log.createdAt || log.timestamp),
            actor: log.actor || log.user,
            note: {
              id: note._id,
              title: note.title,
              type: note.itemType || (note as any).noteType,
              priority: note.priority
            }
          });
        });
      }
    });
    return allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  // ngOnInit() {
  //   this.fetchActivity();
  // }

  // fetchActivity() {
  //   this.isLoading.set(true);
  //    this.noteService.getRecentActivity(20).subscribe({
  //     next: (res) => {
  //       this.rawNotes.set(res.data.notes as unknown as NoteActivity[]);
  //       this.isLoading.set(false);
  //     },
  //     error: (err) => {
  //       console.error('Failed to fetch activity', err);
  //       this.isLoading.set(false);
  //     }
  //   });
  // }

  // --- Helpers ---
  getTypeIcon(type: string): string {
    switch(type) {
      case 'task': return 'pi pi-check-square';
      case 'meeting': return 'pi pi-video';
      case 'project': return 'pi pi-briefcase';
      default: return 'pi pi-file'; // note
    }
  }

  formatAction(action: string): string {
    switch(action) {
      case 'viewed': return 'viewed';
      case 'edited': return 'updated';
      case 'created': return 'created';
      default: return action;
    }
  }

  ngOnInit() {
    this.fetchActivity();
  }

  fetchActivity() {
    this.isLoading.set(true);
    
    // Using your common pattern of single-string messages and global error handling
    this.noteService.getRecentActivity(20).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const notes = res?.data?.notes || [];
        this.rawNotes.set(notes as Note[]);
        this.isLoading.set(false);
        
        // Optional: show a small info toast if there is zero activity
        if (notes.length === 0) {
          this.messageService.showInfo('No recent activity found.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        // Replaced console.error with the global HTTP error handler
        this.messageService.handleHttpError(err);
      }
    });
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}