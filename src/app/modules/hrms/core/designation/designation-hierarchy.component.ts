import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AppMessageService } from '../../../../../core/services/message.service';
import { HRMSService } from '../../../hrms.service';

@Component({
  selector: 'app-designation-hierarchy',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="page-title">Designation Hierarchy</h1>
            <p class="page-subtitle">Organizational reporting structure and levels.</p>
          </div>
        </div>
        
        <div class="header-right">
          <button class="icon-btn" (click)="loadHierarchy()" title="Refresh Hierarchy" [class.spinning]="isLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="grid-card tree-card card-anim-1">
          
          @if (isLoading()) {
            <div class="loading-state-full">
              <div class="spinner"></div>
              <p>Loading Organization Chart...</p>
            </div>
          } @else if (hierarchyTree().length === 0) {
            <div class="empty-state">
              <p class="empty-text">No hierarchy data available.</p>
            </div>
          } @else {
            <div class="tree-container">
              <ng-container *ngTemplateOutlet="recursiveTree; context:{ $implicit: hierarchyTree() }"></ng-container>
            </div>
          }

        </div>
      </main>
    </div>

    <ng-template #recursiveTree let-nodes>
      <div class="tree-node-list">
        @for (node of nodes; track node._id) {
          <div class="tree-node">
            
            <div class="node-content">
              <div class="node-header">
                <div class="node-title-group">
                  <h3 class="node-title">{{ node.title }}</h3>
                  <span class="node-code">{{ node.code }}</span>
                </div>
                <div class="node-badges">
                  <span class="badge badge-outline">Lvl {{ node.level }}</span>
                  <span class="badge badge-neutral">Grade {{ node.grade }}</span>
                </div>
              </div>
              <div class="node-footer">
                <span class="node-family">{{ node.jobFamily || 'General' }}</span>
                <span class="node-children-count" *ngIf="node.children?.length">
                  {{ node.children.length }} Direct Report(s)
                </span>
              </div>
            </div>

            @if (node.children && node.children.length > 0) {
              <div class="tree-children">
                <ng-container *ngTemplateOutlet="recursiveTree; context:{ $implicit: node.children }"></ng-container>
              </div>
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    /* Standard Layout */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn.spinning svg { animation: spin 1s linear infinite; }
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
    
    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); }
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-xl); max-width: 1200px; margin: 0 auto; position: relative; min-height: 400px; }
    
    /* Tree Styles */
    .tree-container { padding: 10px 0; }
    .tree-node-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
    
    .tree-node { position: relative; }
    
    .node-content { 
      background: var(--component-surface-raised); 
      border: 1px solid var(--border-secondary); 
      border-radius: var(--ui-border-radius-lg); 
      padding: var(--spacing-md) var(--spacing-lg); 
      transition: all 0.2s ease;
      position: relative;
      z-index: 2;
    }
    .node-content:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
    
    .node-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
    .node-title-group { display: flex; align-items: center; gap: 8px; }
    .node-title { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); margin: 0; color: var(--text-primary); }
    .node-code { font-family: var(--font-mono, monospace); font-size: 0.6875rem; background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }
    
    .node-badges { display: flex; gap: 6px; }
    .badge { padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-medium); }
    .badge-outline { border: 1px solid var(--border-primary); color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 5%, transparent); }
    .badge-neutral { background: var(--border-secondary); color: var(--text-primary); }

    .node-footer { display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--text-tertiary); }
    .node-family { text-transform: capitalize; }
    .node-children-count { font-weight: var(--font-weight-semibold); color: var(--text-secondary); }

    /* Children Indentation & Connecting Lines */
    .tree-children { 
      margin-left: 24px; 
      padding-left: 24px; 
      border-left: 2px solid var(--border-secondary); 
      margin-top: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      position: relative;
    }
    
    .tree-children::before {
      /* Connecting horizontal line to children block */
      content: '';
      position: absolute;
      top: -16px; left: -2px;
      width: 24px; height: 2px;
      background: var(--border-secondary);
      display: none; /* Can be toggled for advanced tree UI */
    }

    .loading-state-full { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: color-mix(in srgb, var(--bg-primary) 80%, transparent); gap: 12px; color: var(--text-secondary); z-index: 10; font-size: var(--font-size-sm); }
    .empty-state { display: flex; justify-content: center; align-items: center; height: 200px; color: var(--text-tertiary); }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.4s ease-out both; }
  `]
})
export class DesignationHierarchyComponent implements OnInit {
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);
  hierarchyTree = signal<any[]>([]);

  ngOnInit() {
    this.loadHierarchy();
  }

  loadHierarchy() {
    this.isLoading.set(true);
    
    this.hrmsService.getDesignationHierarchy().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: any) => {
        // Based on JSON: res.data.reportingHierarchy
        // Safely fallback depending on exact API wrapper
        const data = res?.data?.data || res?.data;
        const tree = data?.reportingHierarchy || [];
        this.hierarchyTree.set(tree);
      },
      error: () => {
        this.messageService.showError('Error', 'Failed to load designation hierarchy.');
      }
    });
  }

  goBack() {
    this.router.navigate(['/hrms/designation/list']);
  }
}
