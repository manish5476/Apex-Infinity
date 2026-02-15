import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { NoteService } from '../../core/services/notes.service';

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

  // --- State ---
  stats = signal<AnalyticsData | null>(null);
  isLoading = signal(true);

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
    // FIX: Removed strict type annotation (res: { status: string... }) 
    // to accept the Service's return type, then used casting for the data.
    this.noteService.getNoteStatistics().subscribe({
      next: (res: any) => { 
        // We cast the incoming data to unknown then to our local AnalyticsData 
        // to handle the mismatch between the imported NoteStatistics and our local interface
        const data = res.data as unknown as AnalyticsData;
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Analytics failed', err);
        this.isLoading.set(false);
      }
    });
  }

  close() {
    this.ref.close();
  }

  // --- UI Helpers ---

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

// import { Component, inject, signal, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { DynamicDialogRef } from 'primeng/dynamicdialog';
// import { NoteStatistics } from '../../core/models/note.types';
// import { NoteService } from '../../core/services/notes.service';


// @Component({
//   selector: 'app-analytics-dialog',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="analytics-container">
      
//       <!-- Header -->
//       <div class="dialog-header">
//         <div class="header-title">
//           <i class="pi pi-chart-bar"></i>
//           <h3>Analytics Dashboard</h3>
//         </div>
//         <button class="btn-close" (click)="close()">×</button>
//       </div>

//       <!-- Body -->
//       <div class="dialog-body custom-scrollbar">
        
//         <!-- Loading State -->
//         <div *ngIf="isLoading()" class="loading-state">
//           <div class="spinner"></div>
//           <p>Gathering insights...</p>
//         </div>

//         @if (!isLoading() && stats(); as data) {
          
//           <!-- Key Metrics Cards -->
//           <div class="metrics-grid">
//             <div class="metric-card total">
//               <span class="label">Total Notes</span>
//               <span class="value">{{ data.totalNotes || 0 }}</span>
//               <div class="indicator neutral">All time</div>
//             </div>
            
//             <div class="metric-card completed">
//               <span class="label">Completed</span>
//               <span class="value">{{ getCompletedCount(data) }}</span>
//               <div class="indicator success">
//                 {{ getCompletionRate(data) }}% Rate
//               </div>
//             </div>
            
//             <div class="metric-card active">
//               <span class="label">Active</span>
//               <span class="value">{{ (data.totalNotes || 0) - getCompletedCount(data) }}</span>
//               <div class="indicator warning">In Progress</div>
//             </div>
//           </div>

//           <div class="charts-row">
            
//             <!-- Breakdown by Type -->
//             <div class="section type-section">
//               <h4>Content Breakdown</h4>
//               <div class="bars-list">
//                 @for (item of data.byType; track item._id) {
//                   <div class="bar-row">
//                     <div class="info">
//                       <div class="cat-label">
//                         <span class="dot" [style.background-color]="getTypeColor(item._id)"></span>
//                         <span class="cat-name">{{ item._id | titlecase }}</span>
//                       </div>
//                       <span class="cat-val">{{ item.count }}</span>
//                     </div>
//                     <div class="track">
//                       <div class="fill" 
//                            [style.width.%]="(item.count / data.totalNotes) * 100"
//                            [style.background-color]="getTypeColor(item._id)">
//                       </div>
//                     </div>
//                   </div>
//                 }
//               </div>
//             </div>

//             <!-- Breakdown by Priority -->
//             <div class="section priority-section">
//               <h4>Priority Distribution</h4>
//               <div class="pills-cloud">
//                 @for (item of data.byPriority; track item._id) {
//                   <div class="priority-pill" [ngClass]="item._id">
//                     <span class="p-name">{{ item._id | titlecase }}</span>
//                     <span class="p-count">{{ item.count }}</span>
//                   </div>
//                 }
//               </div>
              
//               <!-- Simple Visualizer for Priority -->
//               <div class="priority-bar">
//                 @for (item of data.byPriority; track item._id) {
//                   <div class="segment" 
//                        [ngClass]="item._id"
//                        [style.flex-grow]="item.count"
//                        [title]="item._id + ': ' + item.count">
//                   </div>
//                 }
//               </div>
//             </div>

//           </div>
//         }
//       </div>
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       color: var(--text-primary);
//       --bg-panel: var(--bg-primary);
//       --bg-card: var(--bg-secondary);
//     }

//     .analytics-container {
//       background: var(--bg-panel);
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       max-height: 85vh;
//     }

//     /* Header */
//     .dialog-header {
//       padding: 1.5rem;
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       border-bottom: 1px solid var(--border-secondary);
      
//       .header-title {
//         display: flex; align-items: center; gap: 10px;
//         i { font-size: 1.2rem; color: var(--accent-primary); }
//         h3 { margin: 0; font-size: 1.2rem; font-weight: 700; }
//       }
      
//       .btn-close {
//         background: none; border: none; font-size: 1.5rem; line-height: 1;
//         cursor: pointer; color: var(--text-secondary);
//         transition: color 0.2s;
//         &:hover { color: var(--text-primary); }
//       }
//     }

//     .dialog-body {
//       padding: 1.5rem;
//       overflow-y: auto;
//       display: flex;
//       flex-direction: column;
//       gap: 2rem;
//     }

//     /* Loading */
//     .loading-state {
//       text-align: center;
//       color: var(--text-tertiary);
//       padding: 4rem 0;
//       .spinner {
//         width: 30px; height: 30px; border: 3px solid var(--border-secondary);
//         border-top-color: var(--accent-primary); border-radius: 50%;
//         animation: spin 0.8s linear infinite; margin: 0 auto 1rem;
//       }
//     }
//     @keyframes spin { to { transform: rotate(360deg); } }

//     /* Metrics Cards */
//     .metrics-grid {
//       display: grid;
//       grid-template-columns: repeat(3, 1fr);
//       gap: 1rem;

//       .metric-card {
//         background: var(--bg-card);
//         padding: 1.5rem;
//         border-radius: 16px;
//         border: 1px solid var(--border-secondary);
//         display: flex;
//         flex-direction: column;
//         gap: 8px;
//         position: relative;
//         overflow: hidden;

//         .label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; letter-spacing: 0.5px; }
//         .value { font-size: 2.5rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
        
//         .indicator {
//           font-size: 0.75rem; font-weight: 600; margin-top: auto;
//           &.neutral { color: var(--text-tertiary); }
//           &.success { color: #10b981; }
//           &.warning { color: #f59e0b; }
//         }

//         &.total { border-bottom: 4px solid var(--accent-primary); }
//         &.completed { border-bottom: 4px solid #10b981; }
//         &.active { border-bottom: 4px solid #f59e0b; }
//       }
//     }

//     /* Charts Layout */
//     .charts-row {
//       display: grid;
//       grid-template-columns: 1fr 1fr;
//       gap: 2rem;
//       @media (max-width: 768px) { grid-template-columns: 1fr; }
//     }

//     .section {
//       background: var(--bg-card);
//       padding: 1.5rem;
//       border-radius: 16px;
//       border: 1px solid var(--border-secondary);

//       h4 { 
//         font-size: 0.9rem; text-transform: uppercase; color: var(--text-tertiary); 
//         margin: 0 0 1.5rem 0; letter-spacing: 0.5px; font-weight: 700;
//       }
//     }

//     /* Bars List (Type) */
//     .bars-list {
//       display: flex; flex-direction: column; gap: 16px;
      
//       .bar-row {
//         .info { 
//           display: flex; justify-content: space-between; align-items: center; 
//           margin-bottom: 6px; font-size: 0.9rem; font-weight: 500;
          
//           .cat-label { display: flex; align-items: center; gap: 8px; }
//           .dot { width: 8px; height: 8px; border-radius: 50%; }
//           .cat-val { font-weight: 700; color: var(--text-primary); }
//         }
        
//         .track { 
//           height: 8px; background: var(--bg-ternary); border-radius: 4px; overflow: hidden; 
//           .fill { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
//         }
//       }
//     }

//     /* Priority Pills */
//     .pills-cloud { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 1.5rem; }
    
//     .priority-pill {
//       display: flex; align-items: center; gap: 8px; padding: 6px 12px;
//       border-radius: 20px; font-size: 0.85rem; font-weight: 600;
//       border: 1px solid transparent;
      
//       &.high { background: #fff7ed; color: #c2410c; border-color: #ffedd5; }
//       &.urgent { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
//       &.medium { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
//       &.low { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
      
//       .p-count { 
//         background: rgba(0,0,0,0.08); padding: 2px 8px; 
//         border-radius: 10px; font-size: 0.75rem; 
//       }
//     }

//     .priority-bar {
//       display: flex; height: 12px; width: 100%; border-radius: 6px; overflow: hidden;
//       .segment {
//         transition: flex-grow 0.3s ease;
//         &.urgent { background: #ef4444; }
//         &.high { background: #f97316; }
//         &.medium { background: #3b82f6; }
//         &.low { background: #94a3b8; }
//       }
//     }
//   `]
// })
// export class AnalyticsDialogComponent implements OnInit {
//   ref = inject(DynamicDialogRef);
//   noteService = inject(NoteService);

//   stats = signal<NoteStatistics | null>(null);
//   isLoading = signal(true);

//   ngOnInit() {
//     this.loadData();
//   }

//   loadData() {
//     this.isLoading.set(true);
//     this.noteService.getNoteStatistics().subscribe({
//       next: (res) => {
//         this.stats.set(res.data);
//         this.isLoading.set(false);
//       },
//       error: () => this.isLoading.set(false)
//     });
//   }

//   close() {
//     this.ref.close();
//   }

//   // --- Helpers ---

//   getCompletedCount(data: NoteStatistics): number {
//     if (Array.isArray(data.byStatus)) {
//       const found = data.byStatus.find((s: any) => s._id === 'completed');
//       return found ? found.count : 0;
//     }
//     return 0;
//   }

//   getCompletionRate(data: NoteStatistics): number {
//     if (!data.totalNotes) return 0;
//     const completed = this.getCompletedCount(data);
//     return Math.round((Number(completed) / Number(data.totalNotes)) * 100);
//   }

//   getTypeColor(type: string): string {
//     const map: any = {
//       note: '#8b5cf6',    // Purple
//       task: '#10b981',    // Green
//       meeting: '#3b82f6', // Blue
//       idea: '#f59e0b',    // Orange
//       project: '#ec4899', // Pink
//       journal: '#14b8a6'  // Teal
//     };
//     return map[type] || '#94a3b8'; // Default Slate
//   }
// }