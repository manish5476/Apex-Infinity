import { Component, Input } from '@angular/core';

import { OrganizationChartModule } from 'primeng/organizationchart';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-hierarchy-visualizer',
  standalone: true,
  imports: [OrganizationChartModule],
  template: `
    <div class="premium-card hierarchy-card">
      <div class="card-header">
        <div class="header-title">
          <div class="header-icon"><i class="pi pi-sitemap"></i></div>
          <span>Organizational Hierarchy</span>
        </div>
        <span class="badge-mono">{{ nodes.length }} Departments</span>
      </div>
      
      <div class="card-body">
        @if (nodes.length) {
          <div class="org-scroll-wrapper">
            <p-organizationChart [value]="nodes" styleClass="premium-org-chart">
              <ng-template let-node pTemplate="default">
                <div class="premium-node">
                  
                  <!-- Node Header -->
                  <div class="node-header">
                    <span class="dept-name">{{ node.data.name }}</span>
                    <span class="dept-code">{{ node.data.code }}</span>
                  </div>
                  
                  <!-- Node Body -->
                  <div class="node-body">
                    
                    <!-- Head of Department -->
                    <div class="hod-row">
                      <div class="hod-avatar">
                        {{ getInitials(node.data.hod) }}
                      </div>
                      <div class="hod-details">
                        <span class="hod-label">Head of Dept</span>
                        <span class="hod-name">{{ node.data.hod || 'Unassigned' }}</span>
                      </div>
                    </div>
                    
                    <!-- Department Stats -->
                    <div class="stats-row">
                      <div class="stat-group">
                        <i class="pi pi-users stat-icon"></i>
                        <span class="stat-val">{{ node.data.employeeCount }}</span>
                        <span class="stat-lbl">Members</span>
                      </div>
                      
                      <!-- Example of a status indicator -->
                      <div class="status-dot" [class.active]="node.data.employeeCount > 0" title="Active Department"></div>
                    </div>

                  </div>
                </div>
              </ng-template>
            </p-organizationChart>
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-glyph"><i class="pi pi-sitemap"></i></div>
            <h3>No Hierarchy Found</h3>
            <p>Add departments to visualize your organizational structure.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════════════════
       HIERARCHY VISUALIZER - PREMIUM UI
    ══════════════════════════════════════════════════════ */
    :host {
      display: block;
      height: 100%;
    }

    .hierarchy-card { 
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    /* ── HEADER ────────────────────────────────────────── */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-2xl);
      background: var(--bg-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      z-index: 2;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .header-icon {
      width: 32px; height: 32px;
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary);
      border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-md);
    }

    .badge-mono {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      background: var(--bg-primary);
      padding: 6px 12px;
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid var(--border-primary);
      color: var(--text-secondary);
      box-shadow: var(--shadow-xs);
    }

    /* ── BODY & SCROLL ─────────────────────────────────── */
    .card-body { 
      flex: 1; 
      padding: 0;
      position: relative;
      background: var(--bg-primary);
      overflow: hidden;
    }

    .org-scroll-wrapper {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      overflow: auto;
      padding: var(--spacing-4xl);
      
      /* Premium Scrollbar */
      &::-webkit-scrollbar { width: 8px; height: 8px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { 
        background: var(--border-secondary); 
        border-radius: var(--ui-border-radius-pill); 
      }
      &::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
    }

    /* ── PRIME NG ORG CHART OVERRIDES ──────────────────── */
    ::ng-deep .premium-org-chart .p-organizationchart-table { margin: 0 auto; }
    
    /* Crisp Connection Lines */
    ::ng-deep .premium-org-chart .p-organizationchart-line-down {
      background: var(--border-primary) !important;
      width: 2px !important;
    }
    ::ng-deep .premium-org-chart .p-organizationchart-line-left {
      border-right: 2px solid var(--border-primary) !important;
    }
    ::ng-deep .premium-org-chart .p-organizationchart-line-top {
      border-top: 2px solid var(--border-primary) !important;
    }

    /* Node Shell */
    ::ng-deep .premium-org-chart .p-organizationchart-node-content {
      background: var(--bg-primary) !important;
      border: var(--ui-border-width) solid var(--border-primary) !important;
      border-radius: var(--ui-border-radius-lg) !important;
      padding: 0 !important;
      box-shadow: var(--shadow-sm);
      transition: var(--transition-base);
      min-width: 280px;
      overflow: hidden;
      cursor: default;
    }
    
    ::ng-deep .premium-org-chart .p-organizationchart-node-content:hover {
      border-color: var(--accent-primary) !important;
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);
    }

    /* ── CUSTOM NODE CONTENT ───────────────────────────── */
    .premium-node { 
      display: flex; 
      flex-direction: column; 
      text-align: left; 
    }

    .node-header {
      padding: var(--spacing-md) var(--spacing-xl);
      background: var(--bg-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
    }

    .dept-name { 
      font-family: var(--font-heading);
      font-weight: var(--font-weight-bold); 
      font-size: var(--font-size-md); 
      color: var(--text-primary); 
    }

    .dept-code {
      font-family: var(--font-mono); 
      font-size: 10px;
      font-weight: var(--font-weight-semibold);
      background: var(--bg-primary); 
      padding: 4px 8px;
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--border-primary);
      color: var(--text-secondary);
    }

    .node-body { 
      padding: var(--spacing-xl); 
      display: flex; 
      flex-direction: column; 
      gap: var(--spacing-lg); 
    }

    /* HOD Section */
    .hod-row { 
      display: flex; 
      align-items: center; 
      gap: var(--spacing-md); 
    }

    .hod-avatar {
      width: 36px; height: 36px; 
      border-radius: 50%;
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent);
    }

    .hod-details { 
      display: flex; 
      flex-direction: column; 
    }

    .hod-label {
      font-size: 10px;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: var(--font-weight-semibold);
      margin-bottom: 2px;
    }

    .hod-name {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }

    /* Stats Section */
    .stats-row {
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      padding-top: var(--spacing-md);
      border-top: 1px dashed var(--border-secondary);
    }

    .stat-group { 
      display: flex; 
      align-items: center; 
      gap: 6px; 
    }

    .stat-icon { 
      color: var(--text-tertiary); 
      font-size: 14px; 
    }

    .stat-val { 
      font-size: var(--font-size-sm); 
      font-weight: var(--font-weight-bold); 
      color: var(--text-primary); 
    }

    .stat-lbl { 
      font-size: var(--font-size-xs); 
      color: var(--text-secondary); 
      font-weight: var(--font-weight-medium);
    }

    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--text-tertiary);
      opacity: 0.5;
    }
    .status-dot.active {
      background: var(--color-success);
      opacity: 1;
      box-shadow: 0 0 6px color-mix(in srgb, var(--color-success) 50%, transparent);
    }

    /* ── EMPTY STATE ───────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%;
      padding: var(--spacing-3xl); 
      text-align: center;
    }
    
    .empty-glyph {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; color: var(--text-tertiary);
      margin-bottom: var(--spacing-lg);
      opacity: 0.7;
    }

    .empty-state h3 { 
      margin: 0 0 8px 0; 
      font-family: var(--font-heading); 
      font-size: var(--font-size-xl); 
      color: var(--text-primary); 
    }
    
    .empty-state p { 
      margin: 0; 
      font-size: var(--font-size-sm); 
      color: var(--text-secondary); 
    }
  `]
})
export class HierarchyVisualizerComponent {
  @Input() nodes: TreeNode[] = [];

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}