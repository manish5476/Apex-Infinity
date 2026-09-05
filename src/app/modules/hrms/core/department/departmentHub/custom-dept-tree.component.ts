import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-custom-dept-tree',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    <div class="tree-container">
      @for (node of nodes; track node._id || node.id || $index) {
        <div class="tree-node-wrapper">
          <div class="node-row" [class.has-children]="node.children?.length" (click)="toggleNode(node)">
            
            <div class="node-toggle" [style.visibility]="node.children?.length ? 'visible' : 'hidden'">
              <i class="pi" [class.pi-chevron-down]="node._expanded" [class.pi-chevron-right]="!node._expanded"></i>
            </div>

            <div class="node-content">
              <div class="node-primary">
                <div class="icon-box" [class.is-expanded]="node._expanded">
                  <i class="pi" 
                     [class.pi-folder-open]="node.children?.length && node._expanded"
                     [class.pi-folder]="node.children?.length && !node._expanded"
                     [class.pi-briefcase]="!node.children?.length"></i>
                </div>
                <div class="node-titles">
                  <h4 class="node-name">{{ node.name }}</h4>
                  <span class="node-desc">{{ node.description || 'No description provided' }}</span>
                </div>
              </div>

              <div class="node-secondary">
                <span class="badge-mono">{{ node.code || 'DEPT' }}</span>
                
                <div class="meta-info" pTooltip="Head of Department" tooltipPosition="top">
                  <div class="meta-icon-wrapper"><i class="pi pi-user text-tertiary"></i></div>
                  <span class="meta-text">{{ getHodName(node) }}</span>
                </div>

                <div class="meta-info" pTooltip="Total Workforce" tooltipPosition="top">
                  <div class="meta-icon-wrapper"><i class="pi pi-users text-tertiary"></i></div>
                  <span class="meta-text font-bold">{{ node.employeeCount || 0 }}</span>
                </div>
                
                <div class="status-indicator" [class.active]="node.isActive !== false" pTooltip="Status"></div>
              </div>
            </div>
          </div>

          @if (node.children?.length && node._expanded) {
            <div class="node-children-wrapper fade-in">
              <div class="children-line"></div>
              <app-custom-dept-tree [nodes]="node.children"></app-custom-dept-tree>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .tree-container { display: flex; flex-direction: column; gap: var(--spacing-md); width: 100%; }
    .tree-node-wrapper { display: flex; flex-direction: column; width: 100%; }
    
    .node-row { 
      display: flex; align-items: center; gap: var(--spacing-sm); 
      cursor: pointer; user-select: none; transition: transform 0.2s;
    }
    
    .node-toggle { 
      display: flex; align-items: center; justify-content: center; 
      width: 28px; height: 28px; border-radius: var(--ui-border-radius-sm); 
      color: var(--text-tertiary); transition: var(--transition-base); 
    }
    .node-row:hover .node-toggle { color: var(--color-primary); background: var(--color-primary-bg); }
    
    .node-content { 
      flex: 1; display: flex; align-items: center; justify-content: space-between; 
      padding: var(--spacing-md) var(--spacing-xl); 
      background: var(--bg-primary); border: var(--ui-border-width) solid var(--border-secondary); 
      border-radius: var(--ui-border-radius-lg); transition: var(--transition-base); 
      box-shadow: var(--shadow-sm); 
    }
    .node-row:hover .node-content { 
      border-color: var(--color-primary-light, var(--border-primary)); 
      box-shadow: var(--shadow-md); transform: translateY(-1px); 
    }
    
    .node-primary { display: flex; align-items: center; gap: var(--spacing-lg); }
    .icon-box { 
      display: flex; align-items: center; justify-content: center; 
      width: 42px; height: 42px; border-radius: var(--ui-border-radius); 
      background: var(--bg-secondary); color: var(--text-secondary); 
      border: var(--ui-border-width) solid var(--border-secondary); 
      transition: var(--transition-base); font-size: var(--font-size-xl); 
    }
    .icon-box.is-expanded { background: var(--color-primary-bg); color: var(--color-primary); border-color: transparent; }
    
    .node-titles { display: flex; flex-direction: column; gap: 4px; }
    .node-name { margin: 0; font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .node-desc { font-size: var(--font-size-sm); color: var(--text-tertiary); }
    
    .node-secondary { display: flex; align-items: center; gap: var(--spacing-2xl); }
    .badge-mono { 
      font-family: var(--font-mono); font-size: var(--font-size-xs); 
      background: var(--bg-secondary); color: var(--text-secondary); 
      padding: 6px 10px; border-radius: var(--ui-border-radius-sm); 
      border: var(--ui-border-width) solid var(--border-secondary); letter-spacing: 0.05em; 
    }
    
    .meta-info { display: flex; align-items: center; gap: var(--spacing-sm); min-width: 140px; }
    .meta-icon-wrapper { 
      width: 24px; height: 24px; border-radius: 50%; background: var(--bg-secondary); 
      display: flex; align-items: center; justify-content: center; font-size: 10px; 
    }
    .meta-text { font-size: var(--font-size-sm); color: var(--text-secondary); }
    .font-bold { font-weight: var(--font-weight-bold); color: var(--text-primary); }
    
    .status-indicator { 
      width: 12px; height: 12px; border-radius: 50%; background: var(--color-error); 
      box-shadow: 0 0 0 3px var(--color-error-bg); margin-left: var(--spacing-md);
    }
    .status-indicator.active { background: var(--color-success); box-shadow: 0 0 0 3px var(--color-success-bg); }
    
    .node-children-wrapper { 
      position: relative; margin-top: var(--spacing-sm); 
      margin-left: 38px; padding-left: var(--spacing-xl); 
    }
    .children-line { 
      position: absolute; top: 0; bottom: var(--spacing-md); left: 0; 
      width: 2px; background: var(--border-secondary); border-radius: 2px; 
    }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1); }
  `]
})
export class CustomDepartmentTreeComponent implements OnInit {
  @Input() nodes: any[] = [];

  ngOnInit() {
    if (this.nodes && this.nodes.length) {
      this.nodes.forEach((n: any) => n._expanded = true);
    }
  }

  toggleNode(node: any) {
    if (node.children && node.children.length) {
      node._expanded = !node._expanded;
    }
  }

  getHodName(node: any): string {
    if (!node) return 'Unassigned';
    if (typeof node.headOfDepartment === 'object' && node.headOfDepartment?.name) return node.headOfDepartment.name;
    if (typeof node.headOfDepartment === 'string') return 'ID: ' + node.headOfDepartment.substring(0, 5) + '...';
    return 'Unassigned';
  }
}