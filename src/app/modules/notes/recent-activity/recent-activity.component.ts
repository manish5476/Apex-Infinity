import { Component, inject, signal, computed, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoteService } from '../../../core/services/notes.service'; // Adjust path if needed

// Interfaces based on your JSON
interface ActivityLog {
  _id: string;
  action: string;
  user: string; // ID only in your sample
  timestamp: string;
}

interface NoteActivity {
  _id: string;
  title: string;
  noteType: string;
  status: string;
  priority: string;
  activityLog: ActivityLog[];
  updatedAt: string;
}

interface FlattenedActivity {
  id: string;
  action: string;
  timestamp: Date;
  userId: string;
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
  template: `
    <div class="activity-widget glass-panel">
      <div class="widget-header">
        <h3>Recent Activity</h3>
        <span class="badge">{{ timeline().length }} Events</span>
      </div>

      <div class="timeline-container custom-scrollbar">
        @if (isLoading()) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading...</span>
          </div>
        } @else {
          @for (item of timeline(); track item.id) {
            <div class="timeline-item">
              
              <!-- Icon Column -->
              <div class="timeline-left">
                <div class="icon-circle" [ngClass]="item.note.type">
                  <i [class]="getTypeIcon(item.note.type)"></i>
                </div>
                <div class="line"></div>
              </div>

              <!-- Content Column -->
              <div class="timeline-content" [routerLink]="['/notes', item.note.id]">
                <div class="activity-header">
                  <span class="user-name">User</span>
                  <span class="action">{{ formatAction(item.action) }}</span>
                  <span class="target-title">{{ item.note.title }}</span>
                </div>
                
                <div class="activity-meta">
                  <span class="priority-dot" [ngClass]="item.note.priority"></span>
                  <span class="timestamp">{{ item.timestamp | date:'shortTime' }}</span>
                  <span class="date-sep">&bull;</span>
                  <span class="date">{{ item.timestamp | date:'MMM d' }}</span>
                </div>
              </div>

            </div>
          }

          @if (timeline().length === 0) {
            <div class="empty-state">
              <i class="pi pi-clock"></i>
              <p>No recent activity found</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .activity-widget {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-xl);
      border: 1px solid var(--border-secondary);
      overflow: hidden;
      min-height: 400px;
    }

    .widget-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--border-secondary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-primary);

      h3 {
        margin: 0;
        font-family: var(--font-heading);
        font-size: var(--font-size-md);
        font-weight: 700;
        color: var(--text-primary);
      }

      .badge {
        font-size: 10px;
        padding: 2px 8px;
        background: var(--bg-ternary);
        border-radius: 10px;
        color: var(--text-secondary);
        font-weight: 600;
      }
    }

    .timeline-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-lg);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-tertiary);
      gap: 8px;
      font-size: var(--font-size-sm);
    }

    .timeline-item {
      display: flex;
      gap: var(--spacing-md);
      position: relative;
      padding-bottom: var(--spacing-lg);
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        .timeline-content {
          background: var(--bg-hover);
          border-color: var(--accent-primary);
        }
      }

      &:last-child {
        padding-bottom: 0;
        .timeline-left .line { display: none; }
      }
    }

    /* Left Visuals */
    .timeline-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 32px;

      .icon-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        z-index: 2;
        border: 2px solid var(--bg-secondary); /* Cutout effect */
        
        /* Type Colors */
        &.task { background: #dbeafe; color: #2563eb; }
        &.meeting { background: #fae8ff; color: #c026d3; }
        &.note { background: #f3f4f6; color: #4b5563; }
        &.project { background: #dcfce7; color: #16a34a; }
      }

      .line {
        width: 2px;
        flex: 1;
        background: var(--border-secondary);
        margin-top: 4px;
        min-height: 20px;
      }
    }

    /* Content Card */
    .timeline-content {
      flex: 1;
      background: var(--bg-ternary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-md);
      transition: all 0.2s;

      .activity-header {
        font-size: var(--font-size-sm);
        margin-bottom: 4px;
        line-height: 1.4;
        
        .user-name { font-weight: 700; color: var(--text-primary); margin-right: 4px; }
        .action { color: var(--text-secondary); margin-right: 4px; }
        .target-title { font-weight: 600; color: var(--accent-primary); }
      }

      .activity-meta {
        display: flex;
        align-items: center;
        font-size: 11px;
        color: var(--text-tertiary);
        gap: 6px;

        .priority-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          &.low { background: #10b981; }
          &.medium { background: #3b82f6; }
          &.high { background: #f59e0b; }
          &.urgent { background: #ef4444; }
        }
        
        .date-sep { opacity: 0.5; }
      }
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-3xl);
      color: var(--text-tertiary);
      i { font-size: 2rem; margin-bottom: var(--spacing-md); opacity: 0.5; }
      p { font-size: var(--font-size-sm); margin: 0; }
    }
  `]
})
export class RecentActivityComponent implements OnInit {
  private noteService = inject(NoteService);
  
  rawNotes = signal<NoteActivity[]>([]);
  isLoading = signal(true);

  // Computed: Flattens notes -> activity logs into a single sorted timeline
  timeline = computed(() => {
    const allActivities: FlattenedActivity[] = [];
    
    this.rawNotes().forEach(note => {
      if (note.activityLog && note.activityLog.length > 0) {
        note.activityLog.forEach(log => {
          allActivities.push({
            id: log._id,
            action: log.action,
            timestamp: new Date(log.timestamp),
            userId: log.user,
            note: {
              id: note._id,
              title: note.title,
              type: note.noteType,
              priority: note.priority
            }
          });
        });
      }
    });

    // Sort descending (newest first)
    return allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  ngOnInit() {
    this.fetchActivity();
  }

  fetchActivity() {
    this.isLoading.set(true);
    // Assuming getRecentActivity returns Observable<{ data: { notes: Note[] } }>
    // We cast to any or define proper interface matching NoteActivity if Note[] isn't exact
    this.noteService.getRecentActivity(20).subscribe({
      next: (res) => {
        // Safe cast or map if necessary, assuming structure matches NoteActivity
        this.rawNotes.set(res.data.notes as unknown as NoteActivity[]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch activity', err);
        this.isLoading.set(false);
      }
    });
  }

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
}