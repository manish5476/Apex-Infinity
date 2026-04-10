import { Component, Input } from '@angular/core';

import { CustomDepartmentTreeComponent } from './custom-dept-tree.component';

@Component({
  selector: 'app-directory-explorer',
  standalone: true,
  imports: [CustomDepartmentTreeComponent],
  template: `
    <div class="premium-card directory-card">
      <div class="card-header">
        <span>Directory Explorer</span>
        <span class="badge-mono">{{ data.length }} Items</span>
      </div>
      
      <div class="card-body">
        @if (data.length) {
          <app-custom-dept-tree [nodes]="data"></app-custom-dept-tree>
        } @else {
          <div class="empty-state">
            <i class="pi pi-folder-open"></i>
            <p>No directory data available</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .directory-card { height: 100%; }
    .badge-mono {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      background: var(--bg-primary);
      padding: 4px 10px;
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid var(--border-primary);
      color: var(--text-secondary);
    }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: var(--spacing-3xl); color: var(--text-tertiary);
      i { font-size: 3rem; margin-bottom: var(--spacing-md); }
      p { margin: 0; font-size: var(--font-size-md); }
    }
  `]
})
export class DirectoryExplorerComponent {
  @Input() data: any[] = [];
}