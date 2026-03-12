import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Services
import { HRMSService } from '../../../hrms.service';
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DirectoryExplorerComponent } from './directory-explorer.component';
import { HierarchyVisualizerComponent } from './hierarchy-visualizer.component';
import { WorkforceStatsComponent } from './workforce-stats.component';
import { AppMessageService } from '@core/services/message.service';


@Component({
  selector: 'app-department-hub',
  standalone: true,
  imports: [
    CommonModule,  TabsModule, SkeletonModule, TooltipModule,
    HierarchyVisualizerComponent, DirectoryExplorerComponent, WorkforceStatsComponent
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fullscreen-layout fade-in">
      
      <!-- Header -->
      <header class="hub-header slide-down">
        <div class="header-content">
          <div class="title-group">
            <div class="icon-brand"><i class="pi pi-building"></i></div>
            <div>
              <h1 class="page-title">Department Hub</h1>
              <p class="page-subtitle">Manage hierarchies, workforce statistics, and organizational structures.</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="hub-workspace">
        @if (isLoading()) {
          <div class="loading-state">
            <p-skeleton width="100%" height="70px" styleClass="mb-4" borderRadius="16px" />
            <div class="loading-grid">
              <p-skeleton width="100%" height="100%" borderRadius="16px" />
              <p-skeleton width="100%" height="100%" borderRadius="16px" />
            </div>
          </div>
        } @else {
          <div class="workspace-card">
            <p-tabs value="0" styleClass="full-height-tabs">
              
              <!-- Tab List -->
              <p-tablist styleClass="hub-tablist">
                @for (tab of tabs; track tab.value) {
                  <p-tab [value]="tab.value">
                    <div class="tab-label"><i [class]="tab.icon"></i> {{tab.label}}</div>
                  </p-tab>
                }
              </p-tablist>

              <!-- Tab Panels -->
              <p-tabpanels styleClass="hub-tabpanels scroll-container">
                
                <!-- Tab 0: Hierarchy Visualizer -->
                <p-tabpanel value="0">
                  <div class="panel-inner">
                    <app-hierarchy-visualizer [nodes]="hierarchyNodes()" />
                  </div>
                </p-tabpanel>

                <!-- Tab 1: Directory Explorer -->
                <p-tabpanel value="1">
                  <div class="panel-inner">
                    <app-directory-explorer [data]="rawTreeData()" />
                  </div>
                </p-tabpanel>

                <!-- Tab 2: Workforce Stats -->
                <p-tabpanel value="2">
                  <div class="panel-inner">
                    <app-workforce-stats 
                      [stats]="stats()" 
                      [columns]="gridColumns" />
                  </div>
                </p-tabpanel>

              </p-tabpanels>
            </p-tabs>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block; width: 100%; height: 100vh;
      background-color: var(--bg-primary); color: var(--text-primary);
      font-family: var(--font-body); overflow: hidden;
    }

    .fullscreen-layout { display: flex; flex-direction: column; height: 100vh; width: 100%; }
    
    /* Header */
    .hub-header {
      flex-shrink: 0; background: var(--bg-primary);
      padding: var(--spacing-xl) var(--spacing-3xl);
      border-bottom: 1px solid var(--border-secondary);
    }
    .header-content { display: flex; justify-content: space-between; align-items: center; }
    .title-group { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand {
      display: flex; align-items: center; justify-content: center;
      width: 52px; height: 52px; background: var(--color-primary-bg);
      color: var(--color-primary); border-radius: 14px; font-size: 26px;
    }
    .page-title { font-size: 28px; font-weight: 800; font-family: var(--font-heading); margin: 0 0 6px 0; letter-spacing: -0.5px; }
    .page-subtitle { font-size: var(--font-size-md); color: var(--text-secondary); margin: 0; }

    /* Workspace */
    .hub-workspace { 
      flex: 1; padding: var(--spacing-2xl) var(--spacing-3xl); 
      overflow: hidden; display: flex; flex-direction: column; 
    }
    .loading-state { height: 100%; display: flex; flex-direction: column; }
    .loading-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-2xl);
      height: 100%;
    }

    .workspace-card {
      flex: 1; background: var(--bg-primary); border-radius: 20px;
      border: 1px solid var(--border-secondary);
      display: flex; flex-direction: column; overflow: hidden; 
      box-shadow: var(--shadow-2xl);
    }

    /* Tabs */
    ::ng-deep .full-height-tabs { display: flex; flex-direction: column; height: 100%; }
    ::ng-deep .hub-tablist .p-tablist-nav {
      background: var(--bg-secondary) !important;
      border-bottom: 1px solid var(--border-secondary) !important;
      padding: 0 var(--spacing-2xl) !important;
    }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab {
      padding: var(--spacing-xl) var(--spacing-2xl) !important; 
      border: none !important;
      border-bottom: 3px solid transparent !important; 
      color: var(--text-secondary) !important;
      font-weight: 600 !important; 
      transition: all 0.2s ease !important;
    }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab:hover { color: var(--text-primary) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight {
      border-bottom-color: var(--color-primary) !important; 
      color: var(--color-primary) !important;
    }
    .tab-label { display: flex; align-items: center; gap: 10px; font-size: var(--font-size-md); }
    
    ::ng-deep .hub-tabpanels { 
      flex: 1; padding: 0 !important; 
      background: transparent !important; 
      overflow: hidden !important; 
    }
    ::ng-deep .p-tabpanel { height: 100%; }
    .panel-inner { 
      padding: var(--spacing-2xl); 
      height: 100%; 
      overflow-y: auto; 
    }

    /* Scrollbar */
    .scroll-container { overflow-y: auto; overflow-x: hidden; height: 100%; }
    .scroll-container::-webkit-scrollbar { width: 6px; height: 6px; }
    .scroll-container::-webkit-scrollbar-track { background: transparent; }
    .scroll-container::-webkit-scrollbar-thumb { 
      background: var(--border-secondary); 
      border-radius: 10px; 
    }
    .scroll-container::-webkit-scrollbar-thumb:hover { 
      background: var(--text-tertiary); 
    }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); }

    /* Responsive */
    @media (max-width: 768px) {
      .hub-header { padding: var(--spacing-lg); }
      .page-title { font-size: 24px; }
      .hub-workspace { padding: var(--spacing-lg); }
      .panel-inner { padding: var(--spacing-lg); }
    }
  `]
})
export class DepartmentHubComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  tabs = [
    { value: '0', label: 'Hierarchy Visualizer', icon: 'pi pi-sitemap' },
    { value: '1', label: 'Directory Explorer', icon: 'pi pi-list' },
    { value: '2', label: 'Workforce Stats', icon: 'pi pi-chart-pie' }
  ];

  // Signals
  isLoading = signal(true);
  hierarchyNodes = signal<any[]>([]);
  rawTreeData = signal<any[]>([]);
  stats = signal<any>(null);

  // AG Grid Columns
  gridColumns = [
    {
      field: 'name',
      headerName: 'DEPARTMENT',
      flex: 1.5,
      minWidth: 220,
      cellRenderer: (p: any) => `
        <div style="height: 100%; display: flex; align-items: center; gap: 8px;">
          <div style="width: 4px; height: 16px; border-radius: 2px; background: var(--accent-primary);"></div>
          <span style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${p.value}</span>
        </div>
      `
    },
    {
      field: 'code',
      headerName: 'CODE',
      width: 120,
      cellRenderer: (p: any) => `
        <div style="height: 100%; display: flex; align-items: center;">
          <span style="font-family: var(--font-mono); font-size: 10px; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-secondary); color: var(--text-secondary);">
            ${p.value || 'N/A'}
          </span>
        </div>
      `
    },
    {
      field: 'hodName',
      headerName: 'HEAD OF DEPT',
      flex: 1.5,
      minWidth: 220,
      cellRenderer: (p: any) => {
        const name = p.value;
        return name ? `
          <div style="height: 100%; display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
            <i class="pi pi-user" style="font-size: 12px;"></i>
            <span style="font-weight: 500;">${name}</span>
          </div>
        ` : `
          <span style="color: var(--text-disabled);">Unassigned</span>
        `;
      }
    },
    {
      field: 'employeeCount',
      headerName: 'WORKFORCE',
      width: 130,
      cellRenderer: (p: any) => `
        <div style="height: 100%; display: flex; align-items: center; gap: 6px;">
          <i class="pi pi-users" style="font-size: 12px; color: var(--text-tertiary);"></i>
          <span style="font-weight: 700; color: var(--text-primary);">${p.value || 0}</span>
        </div>
      `
    },
    {
      field: 'activeEmployees',
      headerName: 'STATUS',
      width: 140,
      pinned: 'right',
      cellRenderer: (p: any) => {
        const isActive = p.value > 0;
        const color = isActive ? 'var(--color-success)' : 'var(--color-error)';
        const bg = isActive ? 'var(--color-success-bg)' : 'var(--color-error-bg)';
        const text = isActive ? 'ACTIVE' : 'INACTIVE';
        
        return `
          <div style="height: 100%; display: flex; align-items: center;">
            <span style="background: ${bg}; color: ${color}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid ${color};">
              ${text}
            </span>
          </div>
        `;
      }
    }
  ];

  ngOnInit() {
    this.loadAllData();
  }

  private loadAllData() {
    this.isLoading.set(true);

    forkJoin({
      hierarchy: this.hrmsService.getDepartmentHierarchy().pipe(
        map((res: any) => res?.data?.hierarchy || []),
        catchError(() => {
          this.showError('Failed to load hierarchy');
          return of([]);
        })
      ),
      tree: this.hrmsService.getDepartmentTree().pipe(
        map((res: any) => res?.data?.departments || []),
        catchError(() => {
          this.showError('Failed to load directory');
          return of([]);
        })
      ),
      stats: this.hrmsService.getDepartmentStats().pipe(
        map((res: any) => res?.data?.stats || null),
        catchError(() => {
          this.showError('Failed to load stats');
          return of(null);
        })
      )
    }).subscribe(({ hierarchy, tree, stats }) => {
      this.hierarchyNodes.set(this.transformHierarchy(hierarchy));
      this.rawTreeData.set(tree);
      this.stats.set(stats);
      this.isLoading.set(false);
    });
  }

  private transformHierarchy(data: any[]): any[] {
    if (!data) return [];
    return data.map(node => ({
      expanded: true,
      data: {
        name: node.name,
        code: node.code,
        hod: node.headOfDepartment?.name || '',
        employeeCount: node.employeeCount || 0
      },
      children: this.transformHierarchy(node.children)
    }));
  }

  private showError(detail: string) {
    this.messageService.showError(detail)
}
} 