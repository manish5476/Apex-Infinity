import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { NoteService } from '../../core/services/notes.service';
import { AppMessageService } from '../../core/services/message.service';

// Interface matching your specific JSON structure
export interface AnalyticsData {
  totalNotes: { count: number }[];
  byType: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  byPriority: { _id: string; count: number }[];
  recentActivity: { 
    _id: string; 
    title: string; 
    noteType: string; 
    updatedAt: string 
  }[];
}

@Component({
  selector: 'app-analytics-dialog',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, DatePipe],
  templateUrl: './analytics-dialog.component.html',
  styleUrls: ['./analytics-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDialogComponent implements OnInit {
  private ref = inject(DynamicDialogRef);
  private noteService = inject(NoteService);
  private messageService = inject(AppMessageService);

  // --- State ---
  stats = signal<AnalyticsData | null>(null);
  isLoading = signal(true);
constructor(private cdr:ChangeDetectorRef){}
  // --- Computed Metrics ---
  
  // Extract total from the array structure: [{ count: 2 }]
  totalCount = computed(() => {
    const data = this.stats();
    return data?.totalNotes?.[0]?.count || 0;
  });

  // Find 'completed' count in byStatus array
  completedCount = computed(() => {
    const data = this.stats();
    if (!data?.byStatus) return 0;
    const found = data.byStatus.find((s) => s._id === 'completed');
    return found ? found.count : 0;
  });

  // Calculate remaining (Active + Drafts + etc)
  activeCount = computed(() => {
    return this.totalCount() - this.completedCount();
  });

  completionRate = computed(() => {
    const total = this.totalCount();
    if (!total) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  ngOnInit() {
    this.loadData();
  }

loadData() {
    this.isLoading.set(true);
    
    // Using your common pattern of single-string messages and global error handling
    this.noteService.getNoteStatistics().subscribe({
      next: (res: any) => { 
        // We cast the incoming data to unknown then to our local AnalyticsData 
        // to handle the mismatch between the imported NoteStatistics and our local interface
        const data = res.data as unknown as AnalyticsData;
        this.stats.set(data);
        this.isLoading.set(false);
        
        // Optional: show a small info toast if there is zero data to analyze
        if (!data || (data as any).total === 0) {
          this.messageService.showInfo('No note data available for analytics.');
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        // Replaced console.error with the global HTTP error handler
        this.messageService.handleHttpError(err);
        
        // Ensure UI updates if using ChangeDetectionStrategy.OnPush
        this.cdr.markForCheck();
      }
    });
  }

  close() {
    this.ref.close();
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      note: '#8b5cf6',    // Purple
      task: '#10b981',    // Green
      meeting: '#3b82f6', // Blue
      idea: '#f59e0b',    // Orange
      project: '#ec4899', // Pink
      journal: '#14b8a6'  // Teal
    };
    return map[type] || '#94a3b8'; // Slate
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      note: 'pi pi-file',
      task: 'pi pi-check-square',
      meeting: 'pi pi-calendar',
      idea: 'pi pi-bolt',
      project: 'pi pi-briefcase'
    };
    return map[type] || 'pi pi-file';
  }
}
