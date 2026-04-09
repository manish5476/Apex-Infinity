import { Component, inject, signal, OnInit, ViewEncapsulation, ElementRef, ViewChild, computed, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteService } from '../../../core/services/notes.service'; // Adjust path if needed
import { AppMessageService } from '../../../core/services/message.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="analytics-container custom-scrollbar">
      
      <header class="analytics-header">
        <h1>Workspace Analytics</h1>
        <p>Insights into your team's productivity and knowledge network.</p>
      </header>

      <section class="stats-grid">
        <div class="stat-card">
          <div class="icon-box blue"><i class="pi pi-file"></i></div>
          <div class="stat-info">
            <span class="label">Total Notes</span>
            <span class="value">{{ getTotalNotes() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon-box green"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            <span class="label">Active</span>
            <span class="value">{{ getStatusCount('active') }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon-box purple"><i class="pi pi-bolt"></i></div>
          <div class="stat-info">
            <span class="label">High Priority</span>
            <span class="value">{{ getPriorityCount('high') + getPriorityCount('urgent') }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon-box orange"><i class="pi pi-calendar"></i></div>
          <div class="stat-info">
            <span class="label">Meetings</span>
            <span class="value">{{ getTypeCount('meeting') }}</span>
          </div>
        </div>
      </section>

      <section class="chart-section glass-panel">
        <div class="section-header">
          <h3>Activity Heatmap</h3>
          <div class="legend">
            <span>Less</span>
            <div class="scale">
              <span class="l-0"></span><span class="l-1"></span><span class="l-2"></span><span class="l-3"></span><span class="l-4"></span>
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div class="heatmap-wrapper custom-scrollbar">
          <div class="heatmap-grid">
            @for (week of heatmapGrid(); track $index) {
              <div class="heatmap-col">
                @for (day of week; track $index) {
                  <div class="heat-cell" 
                       [attr.data-level]="day.level"
                       [title]="day.date + ': ' + day.count + ' activities'">
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <section class="chart-section glass-panel">
        <div class="section-header">
          <h3>Knowledge Graph</h3>
          <button class="btn-icon" (click)="loadGraph()" title="Refresh Graph"><i class="pi pi-refresh"></i></button>
        </div>
        
        <div class="graph-container" #graphContainer>
          @if (isGraphLoading()) {
            <div class="loading-overlay">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
            </div>
          }
          
          <svg class="network-svg" [attr.viewBox]="viewBox()">
    
            <g class="links">
              @for (link of graphData().links; track $index) {
                <line [attr.x1]="link.source.x" [attr.y1]="link.source.y"
                      [attr.x2]="link.target.x" [attr.y2]="link.target.y"
                      stroke="#cbd5e1" stroke-width="1.5" opacity="0.6">
                </line>
              }
            </g>
            
    
            <g class="nodes">
              @for (node of graphData().nodes; track node.id) {
                <g class="node" [attr.transform]="'translate(' + node.x + ',' + node.y + ')'">
                  <circle [attr.r]="getNodeSize(node.type)" 
                          [attr.fill]="getNodeColor(node.type)"
                          stroke="#ffffff" stroke-width="2"
                          class="node-circle">
                  </circle>
                  <text dy="3" dx="12" font-size="10" fill="#64748b" font-weight="500">{{ node.label }}</text>
                </g>
              }
            </g>
          </svg>

          @if (!isGraphLoading() && graphData().nodes.length === 0) {
            <div class="empty-graph">
              <p>No connections found. Link notes to see them here.</p>
            </div>
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
      --bg-panel: #ffffff;
      --border: #e2e8f0;
      --text: #1e293b;
      --text-secondary: #64748b;
    }

    .analytics-container {
      height: 100%;
      overflow-y: auto;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .analytics-header {
      h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem 0; color: var(--text); }
      p { color: var(--text-secondary); margin: 0; font-size: 0.9rem; }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

      .icon-box {
        width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        &.blue { background: #eff6ff; color: #3b82f6; }
        &.green { background: #f0fdf4; color: #16a34a; }
        &.purple { background: #faf5ff; color: #a855f7; }
        &.orange { background: #fff7ed; color: #f97316; }
      }

      .stat-info {
        display: flex; flex-direction: column;
        .label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; letter-spacing: 0.025em; }
        .value { font-size: 1.25rem; font-weight: 700; color: var(--text); line-height: 1.2; }
      }
    }

    /* Chart Sections */
    .chart-section {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

      .section-header {
        display: flex; justify-content: space-between; align-items: center;
        h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text); }
      }
    }

    /* Heatmap */
    .heatmap-wrapper { overflow-x: auto; padding-bottom: 4px; }
    .heatmap-grid { display: flex; gap: 3px; }
    .heatmap-col { display: flex; flex-direction: column; gap: 3px; }
    .heat-cell {
      width: 10px; height: 10px; border-radius: 2px; background: #f1f5f9;
      &[data-level="1"] { background: #dbeafe; }
      &[data-level="2"] { background: #93c5fd; }
      &[data-level="3"] { background: #3b82f6; }
      &[data-level="4"] { background: #1e40af; }
    }
    .legend {
      display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text-secondary);
      .scale { display: flex; gap: 2px; span { width: 8px; height: 8px; border-radius: 1px; background:#f1f5f9; } .l-1{background:#dbeafe} .l-2{background:#93c5fd} .l-3{background:#3b82f6} .l-4{background:#1e40af} }
    }

    /* Knowledge Graph */
    .graph-container {
      height: 400px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }
    .network-svg { width: 100%; height: 100%; }
    
    .node-circle { transition: all 0.3s ease; cursor: pointer; }
    .node:hover .node-circle { stroke: #94a3b8; stroke-width: 3px; }

    .loading-overlay, .empty-graph {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.8);
      color: var(--text-secondary);
    }
    
    .btn-icon { 
      background: transparent; border: 1px solid var(--border); 
      width: 28px; height: 28px; border-radius: 6px; 
      cursor: pointer; color: var(--text-secondary); 
      display:flex; align-items:center; justify-content:center;
      &:hover { background: #f1f5f9; color: var(--text); } 
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  noteService = inject(NoteService);
  messageService = inject(AppMessageService);
  stats = signal<any>(null);
  heatmapData = signal<any[]>([]);
  graphData = signal<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  isGraphLoading = signal(false);
  viewBox = signal('0 0 800 400');
  width = 800;
  height = 400;
  
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadStats();
    this.loadGraph();
    this.loadHeatmap();
  }

  loadStats() {
    this.noteService.getNoteStatistics().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.stats.set(res.data);
      },
      error: (err) => {
        // Handled silently or with a toast depending on how critical these stats are
        this.messageService.handleHttpError(err);
      }
    });
  }

  loadGraph() {
    this.isGraphLoading.set(true);
    this.noteService.getKnowledgeGraph().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const rawNodes = res.data.nodes || [];
        const rawLinks = res.data.links || [];

        const nodes = rawNodes.map((n: any) => ({
          ...n,
          x: Math.random() * (this.width - 100) + 50,
          y: Math.random() * (this.height - 100) + 50
        }));

        const links = rawLinks.map((l: any) => {
          const source = nodes.find((n: any) => n.id === l.source);
          const target = nodes.find((n: any) => n.id === l.target);
          return (source && target) ? { source, target } : null;
        }).filter(Boolean);

        this.graphData.set({ nodes, links });
        this.isGraphLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isGraphLoading.set(false);
        // Uses the global handler to show exactly why the graph failed to load
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
  }

  loadHeatmap() {
    this.noteService.getHeatMapData().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const heatMap = res.data?.heatMap || {};
        const grid = [];

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 365);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        let itrDate = new Date(startDate);

        for (let w = 0; w < 53; w++) {
          const week = [];
          for (let d = 0; d < 7; d++) {
            const dateStr = this.formatDate(itrDate);
            const entry = heatMap[dateStr];

            let level = 0;
            if (entry) {
              if (entry.intensity > 0) level = 1;
              if (entry.intensity >= 0.25) level = 2;
              if (entry.intensity >= 0.5) level = 3;
              if (entry.intensity >= 0.75) level = 4;
            }

            week.push({
              date: dateStr,
              count: entry ? entry.count : 0,
              level: level
            });

            itrDate.setDate(itrDate.getDate() + 1);
          }
          grid.push(week);
        }

        this.heatmapData.set(grid);
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Replaced console.error with global user feedback
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
  }


  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // --- Helpers for Stats Extraction ---

  getTotalNotes() {
    const s = this.stats();
    // API: "totalNotes": [ { "count": 3 } ]
    return s?.totalNotes?.[0]?.count || 0;
  }

  getTypeCount(type: string) {
    const s = this.stats();
    // API: "byType": [ { "_id": "note", "count": 2 }, ... ]
    if (!s?.byType) return 0;
    const item = s.byType.find((x: any) => x._id === type);
    return item ? item.count : 0;
  }

  getStatusCount(status: string) {
    const s = this.stats();
    // API: "byStatus": [ { "_id": "active", "count": 3 } ]
    if (!s?.byStatus) return 0;
    const item = s.byStatus.find((x: any) => x._id === status);
    return item ? item.count : 0;
  }

  getPriorityCount(priority: string) {
    const s = this.stats();
    // API: "byPriority": [ { "_id": "high", "count": 1 } ]
    if (!s?.byPriority) return 0;
    const item = s.byPriority.find((x: any) => x._id === priority);
    return item ? item.count : 0;
  }

  heatmapGrid() {
    return this.heatmapData();
  }

  getNodeColor(type: string) {
    switch (type) {
      case 'meeting': return '#3b82f6'; // Blue
      case 'task': return '#10b981';    // Green
      case 'note': return '#f59e0b';    // Orange
      default: return '#64748b';        // Gray
    }
  }

  getNodeSize(type: string) {
    return type === 'note' ? 8 : 6;
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}