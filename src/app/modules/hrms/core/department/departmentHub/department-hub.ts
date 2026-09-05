import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

// Services
import { HRMSService } from '../../../hrms.service';
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';

// Child Components
import { DirectoryExplorerComponent } from './directory-explorer.component';
import { HierarchyVisualizerComponent } from './hierarchy-visualizer.component';
import { WorkforceStatsComponent } from './workforce-stats.component';
import { AppMessageService } from '@core/services/message.service';
import { GridColumn } from '@shared/ui/grid';


@Component({
  selector: 'app-department-hub',
  standalone: true,
  imports: [
    SkeletonModule,
    TooltipModule,
    HierarchyVisualizerComponent,
    DirectoryExplorerComponent,
    WorkforceStatsComponent
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apex-page fade-in flex-col h-screen">
      
      <!-- Header -->
      <header class="apex-header apex-header--elevated flex-shrink-0">
        <div class="flex-align gap-4">
          <div class="apex-card__icon" style="width: 48px; height: 48px; font-size: 20px;"><i class="pi pi-building"></i></div>
          <div class="flex-col">
            <h1 class="apex-page-header__title m-0" style="font-size: var(--font-size-2xl);">Department Hub</h1>
            <p class="apex-page-header__subtitle m-0 text-sm text-tertiary">Manage hierarchies, workforce statistics, and organizational structures.</p>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="apex-content flex-1 overflow-hidden flex-col p-4 sm:p-5">
        @if (isLoading()) {
          <div class="flex-col gap-4 h-full">
            <p-skeleton width="100%" height="70px" borderRadius="var(--ui-border-radius-lg)" />
            <div class="apex-grid apex-grid--2 h-full">
              <p-skeleton width="100%" height="100%" borderRadius="var(--ui-border-radius-lg)" />
              <p-skeleton width="100%" height="100%" borderRadius="var(--ui-border-radius-lg)" />
            </div>
          </div>
        } @else {
          <div class="apex-card apex-card--surface h-full flex-col p-0 border-0 shadow-none overflow-hidden">
            
            <div class="custom-tabs-wrapper flex-col h-full w-full">
              <!-- Pure HTML Tab List -->
              <div class="custom-tablist flex-align border-bottom px-4 overflow-x-auto">
                @for (tab of tabs; track tab.value) {
                  <button 
                    class="custom-tab-btn flex-align gap-2 py-4 px-2" 
                    [class.active]="activeTab() === tab.value"
                    (click)="activeTab.set(tab.value)">
                    <i [class]="tab.icon"></i>
                    <span>{{ tab.label }}</span>
                  </button>
                }
              </div>

              <!-- Pure HTML Tab Panels -->
              <div class="custom-tabpanels flex-1 relative overflow-hidden bg-surface">
                
                @if (activeTab() === '0') {
                  <div class="panel-inner p-4 sm:p-6 h-full scroll-container fade-in-fast">
                    <app-hierarchy-visualizer [nodes]="hierarchyNodes()" />
                  </div>
                }

                @if (activeTab() === '1') {
                  <div class="panel-inner p-4 sm:p-6 h-full scroll-container fade-in-fast">
                    <app-directory-explorer [data]="rawTreeData()" />
                  </div>
                }

                @if (activeTab() === '2') {
                  <div class="panel-inner p-4 sm:p-6 h-full scroll-container fade-in-fast">
                    <app-workforce-stats 
                      [stats]="stats()" 
                      [columns]="gridColumns" />
                  </div>
                }

              </div>
            </div>
            
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block; 
      width: 100%; 
      height: 100vh;
      overflow: hidden;
    }

    /* Local overrides for utility alignment */
    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-1 { flex: 1; }
    .h-screen { height: 100vh; }
    .h-full { height: 100%; }
    .w-full { width: 100%; }
    .m-0 { margin: 0; }
    .p-0 { padding: 0 !important; }
    .p-4 { padding: var(--spacing-xl); }
    .px-4 { padding-inline: var(--spacing-xl); }
    .py-4 { padding-block: var(--spacing-xl); }
    .px-2 { padding-inline: var(--spacing-md); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-4 { gap: var(--spacing-lg); }
    .overflow-hidden { overflow: hidden; }
    .overflow-x-auto { overflow-x: auto; scrollbar-width: none; }
    .relative { position: relative; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-tertiary { color: var(--text-tertiary); }
    
    .border-0 { border: none !important; }
    .shadow-none { box-shadow: none !important; }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .bg-surface { background: var(--bg-secondary); }

    /* ── PURE HTML TABS ───────────── */
    .custom-tab-btn {
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      color: var(--text-secondary);
      font-family: var(--font-heading);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: var(--transition-base);
      white-space: nowrap;
      outline: none;
    }
    
    .custom-tab-btn i { 
      font-size: 14px; 
      opacity: 0.8; 
      transition: var(--transition-base);
    }

    .custom-tab-btn:hover {
      color: var(--text-primary);
    }

    .custom-tab-btn.active {
      color: var(--accent-primary);
      border-bottom-color: var(--accent-primary);
    }
    .custom-tab-btn.active i { opacity: 1; }

    /* ── SCROLLBAR ─────────────────────────────────────── */
    .scroll-container { overflow-y: auto; overflow-x: hidden; height: 100%; }
    .scroll-container::-webkit-scrollbar { width: 6px; height: 6px; }
    .scroll-container::-webkit-scrollbar-track { background: transparent; }
    .scroll-container::-webkit-scrollbar-thumb { 
      background: var(--border-secondary); 
      border-radius: var(--ui-border-radius-pill); 
    }
    .scroll-container::-webkit-scrollbar-thumb:hover { 
      background: var(--text-tertiary); 
    }

    /* ── ANIMATIONS ────────────────────────────────────── */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInFast { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .fade-in-fast { animation: fadeInFast 0.3s cubic-bezier(0.2, 0.9, 0.2, 1); }

    /* ── RESPONSIVE ────────────────────────────────────── */
    @media (min-width: 640px) {
      .sm\\:p-5 { padding: var(--spacing-2xl); }
      .sm\\:p-6 { padding: var(--spacing-3xl); }
    }
  `]
})
export class DepartmentHubComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // Custom HTML Tab State
  activeTab = signal<string>('0');

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
  gridColumns: GridColumn[] = [
    {
      field: 'name',
      header: 'DEPARTMENT',
      flex: 1.5,
      minWidth: '220px',
      formatter: (val: any) => `
        <div style="height: 100%; display: flex; align-items: center; gap: 8px;">
          <div style="width: 4px; height: 16px; border-radius: 2px; background: var(--accent-primary);"></div>
          <span style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${val}</span>
        </div>
      `
    },
    {
      field: 'code',
      header: 'CODE',
      width: '120px',
      formatter: (val: any) => `
        <div style="height: 100%; display: flex; align-items: center;">
          <span style="font-family: var(--font-mono); font-size: 10px; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-secondary); color: var(--text-secondary);">
            ${val || 'N/A'}
          </span>
        </div>
      `
    },
    {
      field: 'hodName',
      header: 'HEAD OF DEPT',
      flex: 1.5,
      minWidth: '220px',
      formatter: (val: any) => {
        const name = val;
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
      header: 'WORKFORCE',
      width: '130px',
      formatter: (val: any) => `
        <div style="height: 100%; display: flex; align-items: center; gap: 6px;">
          <i class="pi pi-users" style="font-size: 12px; color: var(--text-tertiary);"></i>
          <span style="font-weight: 700; color: var(--text-primary);">${val || 0}</span>
        </div>
      `
    },
    {
      field: 'activeEmployees',
      header: 'STATUS',
      width: '140px',
      pinned: 'right',
      formatter: (val: any) => {
        const isActive = val > 0;
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
    }).pipe(takeUntil(this.destroy$)).subscribe(({ hierarchy, tree, stats }) => {
      this.hierarchyNodes.set(this.transformHierarchy(hierarchy));
      this.rawTreeData.set(tree);
      this.stats.set(stats);
      this.isLoading.set(false);
    });
  }

  private transformHierarchy(data: any[], isRoot = true): any[] {
    if (!data || data.length === 0) return [];

    const mappedNodes = data.map(node => ({
      expanded: true,
      data: {
        name: node.name,
        code: node.code,
        hod: node.headOfDepartment?.name || '',
        employeeCount: node.employeeCount || 0
      },
      children: this.transformHierarchy(node.children || [], false)
    }));

    if (isRoot && data.length > 1) {
      const totalWorkforce = data.reduce((sum, d) => sum + (d.employeeCount || 0), 0);
      return [{
        expanded: true,
        data: {
          name: 'Apex Infinity HQ',
          code: 'CORP',
          hod: 'Executive Leadership',
          employeeCount: totalWorkforce
        },
        children: mappedNodes
      }];
    }

    return mappedNodes;
  }

  private showError(detail: string) {
    this.messageService.showError(detail)
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
