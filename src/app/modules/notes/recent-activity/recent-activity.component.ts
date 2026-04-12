import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoteService } from '../../../core/services/notes.service';
import { AppMessageService } from '../../../core/services/message.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ActivityItem {
  id: string;
  action: string;
  timestamp: Date;
  actor: { _id: string; name: string; email?: string } | null;
  note: { id: string; title: string; type: string; priority: string };
}

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss'
})
export class RecentActivityComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private noteService = inject(NoteService);
  private messageService = inject(AppMessageService);

  // Raw flat activities list from API — shape: { _id, action, actor, noteId, createdAt }
  private rawActivities = signal<any[]>([]);
  isLoading = signal(true);

  /** Maps the flat API activities into display-ready items */
  timeline = computed<ActivityItem[]>(() =>
    this.rawActivities().map(a => ({
      id: a._id,
      action: a.action,
      timestamp: new Date(a.createdAt),
      actor: a.actor ?? null,
      note: {
        id: a.noteId?._id ?? a.noteId ?? '',
        title: a.noteId?.title ?? 'Untitled',
        type: a.noteId?.itemType ?? 'note',
        priority: a.noteId?.priority ?? '',
      }
    }))
  );

  ngOnInit(): void {
    this.fetchActivity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchActivity(): void {
    this.isLoading.set(true);
    this.noteService.getRecentActivity(20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          // API returns { data: { activities: [...] } }
          const activities = res?.data?.activities ?? [];
          this.rawActivities.set(activities);
          this.isLoading.set(false);
        },
        error: err => {
          this.isLoading.set(false);
          this.messageService.handleHttpError(err);
        }
      });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'task': return 'pi pi-check-square';
      case 'meeting': return 'pi pi-video';
      case 'project': return 'pi pi-briefcase';
      case 'idea': return 'pi pi-lightbulb';
      default: return 'pi pi-file';
    }
  }

  formatAction(action: string): string {
    const map: Record<string, string> = {
      viewed: 'viewed',
      created: 'created',
      updated: 'updated',
      edited: 'updated',
      deleted: 'deleted',
      archived: 'archived',
      restored: 'restored',
      converted_to_task: 'converted to task',
      status_changed: 'changed status of',
      priority_changed: 'changed priority of',
    };
    return map[action] ?? action.replace(/_/g, ' ');
  }
}