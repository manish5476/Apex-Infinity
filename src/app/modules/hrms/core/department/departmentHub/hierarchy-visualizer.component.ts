import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TreeNode } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-hierarchy-visualizer',
  standalone: true,
  imports: [CommonModule, OrganizationChartModule, AvatarModule],
  template: `
    <div class="premium-card hierarchy-card">
      <div class="card-header">
        <span>Organizational Hierarchy</span>
        <span class="badge-mono">{{ nodes.length }} Departments</span>
      </div>
      
      <div class="card-body p-0">
        @if (nodes.length) {
          <div class="org-scroll-wrapper">
            <p-organizationChart [value]="nodes" styleClass="premium-org-chart">
              <ng-template let-node pTemplate="default">
                <div class="premium-node">
                  <div class="p-node-header">
                    <span class="p-node-title">{{ node.data.name }}</span>
                    <span class="p-node-badge">{{ node.data.code }}</span>
                  </div>
                  <div class="p-node-body">
                    <div class="p-info">
                      <p-avatar 
                        [label]="getInitials(node.data.hod)" 
                        shape="circle" 
                        size="normal" 
                        [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)'}">
                      </p-avatar>
                      <span class="p-text">{{ node.data.hod || 'Unassigned' }}</span>
                    </div>
                    <div class="p-info divider">
                      <div class="icon-circle"><i class="pi pi-users"></i></div>
                      <span class="p-text"><strong>{{ node.data.employeeCount }}</strong> Members</span>
                    </div>
                  </div>
                </div>
              </ng-template>
            </p-organizationChart>
          </div>
        } @else {
          <div class="empty-state">
            <i class="pi pi-folder-open"></i>
            <p>No hierarchy structure found</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .hierarchy-card { height: 100%; }
    .card-body.p-0 { padding: 0; }
    .badge-mono {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      background: var(--bg-primary);
      padding: 4px 10px;
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid var(--border-primary);
      color: var(--text-secondary);
    }
    .org-scroll-wrapper {
      width: 100%;
      min-height: 100%;
      overflow: auto;
      padding: var(--spacing-xl);
    }
    ::ng-deep .premium-org-chart .p-organizationchart-table { margin: 0 auto; }
    ::ng-deep .premium-org-chart .p-organizationchart-line-down,
    ::ng-deep .premium-org-chart .p-organizationchart-line-left,
    ::ng-deep .premium-org-chart .p-organizationchart-line-right,
    ::ng-deep .premium-org-chart .p-organizationchart-line-top {
      border-color: var(--border-secondary) !important;
    }
    ::ng-deep .premium-org-chart .p-organizationchart-node-content {
      background: var(--bg-primary) !important;
      border: var(--ui-border-width) solid var(--border-secondary) !important;
      border-radius: var(--ui-border-radius-lg) !important;
      padding: 0 !important;
      box-shadow: var(--shadow-sm);
      transition: var(--transition-base);
      min-width: 260px;
    }
    ::ng-deep .premium-org-chart .p-organizationchart-node-content:hover {
      border-color: var(--color-primary) !important;
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
    .premium-node { display: flex; flex-direction: column; text-align: left; }
    .p-node-header {
      padding: var(--spacing-md) var(--spacing-lg);
      background: var(--bg-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
    }
    .p-node-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-md); color: var(--text-primary); }
    .p-node-badge {
      font-family: var(--font-mono); font-size: var(--font-size-xs);
      background: var(--bg-primary); padding: 4px 8px;
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--border-primary);
    }
    .p-node-body { padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md); }
    .p-info { display: flex; align-items: center; gap: var(--spacing-sm); }
    .p-info.divider { margin-top: var(--spacing-xs); padding-top: var(--spacing-xs); border-top: 1px dashed var(--border-secondary); }
    .p-text { font-size: var(--font-size-sm); color: var(--text-secondary); }
    .icon-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--bg-secondary); display: flex; align-items: center; justify-content: center;
      border: var(--ui-border-width) solid var(--border-primary);
    }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: var(--spacing-3xl); color: var(--text-tertiary);
      i { font-size: 3rem; margin-bottom: var(--spacing-md); }
      p { margin: 0; font-size: var(--font-size-md); }
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