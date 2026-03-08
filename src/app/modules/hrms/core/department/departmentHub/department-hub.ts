import { Component, OnInit, ChangeDetectionStrategy, inject, signal, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Services
import { HRMSService } from '../../../hrms.service';
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { TabsModule } from 'primeng/tabs';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TreeNode } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';

// ============================================================================
// 1. CUSTOM RECURSIVE TREE COMPONENT
// ============================================================================
@Component({
  selector: 'app-custom-dept-tree',
  standalone: true,
  imports: [CommonModule, TagModule, TooltipModule],
  template: `
    <div class="tree-container">
      @for (node of nodes; track node._id) {
        <div class="tree-node-wrapper">
          <div class="node-row" [class.has-children]="node.children?.length" (click)="toggleNode(node)">
            
            <div class="node-toggle" [style.visibility]="node.children?.length ? 'visible' : 'hidden'">
              <i class="pi" [ngClass]="node._expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
            </div>

            <div class="node-content glass-card">
              <div class="node-primary">
                <div class="icon-box" [ngClass]="{'is-expanded': node._expanded}">
                  <i class="pi" [ngClass]="node.children?.length ? (node._expanded ? 'pi-folder-open' : 'pi-folder') : 'pi-briefcase'"></i>
                </div>
                <div class="node-titles">
                  <h4 class="node-name">{{ node.name }}</h4>
                  <span class="node-desc">{{ node.description || 'No description' }}</span>
                </div>
              </div>

              <div class="node-secondary">
                <span class="badge-mono">{{ node.code }}</span>
                
                <div class="meta-info" pTooltip="Head of Department" tooltipPosition="top">
                  <i class="pi pi-user text-tertiary"></i>
                  <span class="meta-text">{{ getHodName(node) }}</span>
                </div>

                <div class="meta-info" pTooltip="Total Employees" tooltipPosition="top">
                  <i class="pi pi-users text-tertiary"></i>
                  <span class="meta-text font-bold">{{ node.employeeCount || 0 }}</span>
                </div>
                
                <div class="status-indicator" [class.active]="node.isActive" pTooltip="Status"></div>
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
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
      user-select: none;
      group: hover;
    }

    .node-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-tertiary);
      transition: var(--transition-base);
    }
    .node-row:hover .node-toggle { color: var(--color-primary); background: var(--color-primary-bg); }

    .node-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md) var(--spacing-xl);
      background: var(--component-bg, var(--bg-secondary));
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      transition: var(--transition-base);
      box-shadow: var(--shadow-xs);
    }
    .node-row:hover .node-content {
      border-color: var(--color-primary-border, var(--border-secondary));
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }

    .node-primary { display: flex; align-items: center; gap: var(--spacing-lg); }
    
    .icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--ui-border-radius-lg);
      background: var(--bg-primary);
      color: var(--text-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      transition: var(--transition-base);
      font-size: var(--font-size-xl);
    }
    .icon-box.is-expanded { background: var(--color-primary-bg); color: var(--color-primary); border-color: transparent; }

    .node-titles { display: flex; flex-direction: column; gap: 2px; }
    .node-name { margin: 0; font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); }
    .node-desc { font-size: var(--font-size-xs); color: var(--text-tertiary); }

    .node-secondary { display: flex; align-items: center; gap: var(--spacing-2xl); }
    
    .badge-mono {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      background: var(--bg-primary);
      color: var(--text-secondary);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius);
      border: var(--ui-border-width) solid var(--border-primary);
      letter-spacing: 0.05em;
    }

    .meta-info { display: flex; align-items: center; gap: var(--spacing-sm); min-width: 120px; }
    .meta-text { font-size: var(--font-size-sm); color: var(--text-secondary); }
    .font-bold { font-weight: var(--font-weight-bold); color: var(--text-primary); }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-error);
      box-shadow: 0 0 0 3px var(--color-error-bg);
    }
    .status-indicator.active {
      background: var(--color-success);
      box-shadow: 0 0 0 3px var(--color-success-bg);
    }

    /* Hierarchy Connecting Lines */
    .node-children-wrapper {
      position: relative;
      margin-top: var(--spacing-md);
      margin-left: 36px; /* Align with content edge */
      padding-left: var(--spacing-xl);
    }
    .children-line {
      position: absolute;
      top: 0;
      bottom: var(--spacing-md);
      left: 0;
      width: 2px;
      background: var(--border-primary);
      border-radius: 2px;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.2s cubic-bezier(0.2, 0.9, 0.2, 1); }
  `]
})
export class CustomDepartmentTreeComponent {
  @Input() nodes: any[] = [];

  ngOnInit() {
    // Expand top level by default
    this.nodes.forEach(n => n._expanded = true);
  }

  toggleNode(node: any) {
    if (node.children && node.children.length) {
      node._expanded = !node._expanded;
    }
  }

  getHodName(node: any): string {
    if (!node) return 'Unassigned';
    if (typeof node.headOfDepartment === 'object' && node.headOfDepartment?.name) return node.headOfDepartment.name;
    if (typeof node.headOfDepartment === 'string') return 'ID: ' + node.headOfDepartment.substring(0, 5) + '...'; // Fallback if just ID is sent
    return 'Unassigned';
  }
}

// ============================================================================
// 2. MAIN HUB COMPONENT
// ============================================================================
@Component({
  selector: 'app-department-hub',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, TabsModule, OrganizationChartModule,
    TableModule, CardModule, SkeletonModule, TagModule, TooltipModule, 
    AvatarModule, CustomDepartmentTreeComponent
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fullscreen-layout fade-in">
      
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

      <main class="hub-workspace">
        @if (isLoading()) {
          <div class="loading-state">
            <p-skeleton width="100%" height="60px" styleClass="mb-4" borderRadius="12px"></p-skeleton>
            <div style="display: flex; gap: 2rem;">
              <p-skeleton width="30%" height="400px" borderRadius="12px"></p-skeleton>
              <p-skeleton width="70%" height="400px" borderRadius="12px"></p-skeleton>
            </div>
          </div>
        } @else {
          <div class="workspace-card shadow-lg">
            <p-tabs value="0" styleClass="full-height-tabs">
              
              <p-tablist styleClass="hub-tablist">
                <p-tab value="0">
                  <div class="tab-label"><i class="pi pi-sitemap"></i> Hierarchy Visualizer</div>
                </p-tab>
                <p-tab value="1">
                  <div class="tab-label"><i class="pi pi-list"></i> Directory Explorer</div>
                </p-tab>
                <p-tab value="2">
                  <div class="tab-label"><i class="pi pi-chart-pie"></i> Workforce Stats</div>
                </p-tab>
              </p-tablist>

              <p-tabpanels styleClass="hub-tabpanels scroll-container">
                
                <p-tabpanel value="0">
                  <div class="panel-inner">
                    @if (hierarchyNodes().length) {
                      <div class="org-scroll-wrapper">
                        <p-organizationChart [value]="hierarchyNodes()" styleClass="premium-org-chart">
                          <ng-template let-node pTemplate="default">
                            <div class="premium-node">
                              <div class="p-node-header">
                                <span class="p-node-title">{{ node.data.name }}</span>
                                <span class="p-node-badge">{{ node.data.code }}</span>
                              </div>
                              <div class="p-node-body">
                                <div class="p-info">
                                  <p-avatar [label]="getInitials(node.data.hod)" shape="circle" size="normal" [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)', 'font-size': '10px'}"></p-avatar>
                                  <span class="p-text">{{ node.data.hod || 'Unassigned' }}</span>
                                </div>
                                <div class="p-info">
                                  <div class="icon-circle"><i class="pi pi-users text-tertiary"></i></div>
                                  <span class="p-text"><strong>{{ node.data.employeeCount }}</strong> Members</span>
                                </div>
                              </div>
                            </div>
                          </ng-template>
                        </p-organizationChart>
                      </div>
                    } @else {
                      <div class="empty-glass-state"><i class="pi pi-folder-open text-4xl mb-3"></i><p>No hierarchy structure found.</p></div>
                    }
                  </div>
                </p-tabpanel>

                <p-tabpanel value="1">
                  <div class="panel-inner max-w-5xl">
                    @if (rawTreeData().length) {
                      <app-custom-dept-tree [nodes]="rawTreeData()"></app-custom-dept-tree>
                    } @else {
                      <div class="empty-glass-state"><i class="pi pi-folder-open text-4xl mb-3"></i><p>No directory data available.</p></div>
                    }
                  </div>
                </p-tabpanel>

                <p-tabpanel value="2">
                  <div class="panel-inner">
                    @if (stats(); as statData) {
                      
                      <div class="premium-stats-grid mb-5">
                        <div class="premium-stat-card border-top-primary">
                          <div class="s-icon bg-primary-light"><i class="pi pi-building text-primary"></i></div>
                          <div class="s-data">
                            <span class="s-label">Total Departments</span>
                            <span class="s-value">{{ statData.totalDepartments | number }}</span>
                          </div>
                        </div>
                        
                        <div class="premium-stat-card border-top-success">
                          <div class="s-icon bg-success-light"><i class="pi pi-users text-success"></i></div>
                          <div class="s-data">
                            <span class="s-label">Total Workforce</span>
                            <span class="s-value">{{ statData.totalEmployees | number }}</span>
                          </div>
                        </div>

                        <div class="premium-stat-card border-top-info">
                          <div class="s-icon bg-info-light"><i class="pi pi-chart-line text-info"></i></div>
                          <div class="s-data">
                            <span class="s-label">Avg. Headcount</span>
                            <span class="s-value">{{ statData.avgEmployeesPerDept | number:'1.0-1' }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="table-card glass-card">
                        <div class="table-header-custom">
                          <h3>Department Breakdown</h3>
                          <p-tag severity="info" value="Live Data"></p-tag>
                        </div>
                        <p-table 
                          [value]="statData.departments" 
                          [paginator]="true" 
                          [rows]="10" 
                          responsiveLayout="scroll"
                          styleClass="premium-table">
                          <ng-template pTemplate="header">
                            <tr>
                              <th>Department Name</th>
                              <th>Department Code</th>
                              <th>Head of Department</th>
                              <th class="text-right">Total Assigned</th>
                              <th class="text-right">Active Status</th>
                            </tr>
                          </ng-template>
                          <ng-template pTemplate="body" let-dept>
                            <tr>
                              <td class="font-semibold text-primary-color">{{ dept.name }}</td>
                              <td><span class="badge-mono-sm">{{ dept.code }}</span></td>
                              <td>
                                <div class="flex-align gap-2">
                                  <p-avatar [label]="getInitials(dept.hodName)" shape="circle" [style]="{'background-color': 'var(--bg-secondary)', 'color': 'var(--text-secondary)'}"></p-avatar>
                                  <span>{{ dept.hodName || 'Unassigned' }}</span>
                                </div>
                              </td>
                              <td class="text-right font-bold">{{ dept.employeeCount }}</td>
                              <td class="text-right">
                                <p-tag 
                                  [severity]="dept.activeEmployees > 0 ? 'success' : 'warn'" 
                                  [value]="dept.activeEmployees > 0 ? 'Active Workforce' : 'No Active'">
                                </p-tag>
                              </td>
                            </tr>
                          </ng-template>
                        </p-table>
                      </div>

                    } @else {
                      <div class="empty-glass-state"><i class="pi pi-database text-4xl mb-3"></i><p>No statistics compiled yet.</p></div>
                    }
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
    /* --------------------------------------------------------------------------
       GLOBAL LAYOUT & VARIABLES
       -------------------------------------------------------------------------- */
    :host {
      display: block;
      width: 100%;
      height: 100vh; /* Strict Full Screen */
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
      overflow: hidden; /* Prevent body scroll, handle internally */
    }

    .fullscreen-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }

    /* Helper Utilities */
    .flex-align { display: flex; align-items: center; }
    .gap-2 { gap: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-lg); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .text-right { text-align: right; }
    .text-tertiary { color: var(--text-tertiary); }
    .font-semibold { font-weight: var(--font-weight-semibold); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .max-w-5xl { max-width: 1200px; margin: 0 auto; }

    /* Custom Scrollbar for inner content */
    .scroll-container {
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
    }
    .scroll-container::-webkit-scrollbar { width: 8px; height: 8px; }
    .scroll-container::-webkit-scrollbar-track { background: transparent; }
    .scroll-container::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 4px; }
    .scroll-container::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

    /* --------------------------------------------------------------------------
       HEADER (Modern Dashboard Style)
       -------------------------------------------------------------------------- */
    .hub-header {
      flex-shrink: 0;
      background: var(--component-bg, var(--bg-secondary));
      padding: var(--spacing-xl) var(--spacing-3xl);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      z-index: var(--z-sticky, 10);
    }
    .header-content { display: flex; justify-content: space-between; align-items: center; }
    
    .title-group { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--color-primary-bg, rgba(59, 130, 246, 0.1));
      color: var(--color-primary);
      border-radius: var(--ui-border-radius-lg);
      font-size: var(--font-size-2xl);
    }
    
    .page-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-heading);
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    /* --------------------------------------------------------------------------
       MAIN WORKSPACE & TABS
       -------------------------------------------------------------------------- */
    .hub-workspace {
      flex: 1;
      padding: var(--spacing-2xl) var(--spacing-3xl);
      overflow: hidden; /* Contains the tabs card */
      display: flex;
      flex-direction: column;
    }

    .loading-state { height: 100%; display: flex; flex-direction: column; }

    .workspace-card {
      flex: 1;
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-xl);
      border: var(--ui-border-width) solid var(--border-primary);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }

    /* PrimeNG Tabs Deep Overrides to fill space */
    ::ng-deep .full-height-tabs {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    ::ng-deep .hub-tablist .p-tablist-nav {
      background: var(--component-bg, var(--bg-secondary)) !important;
      border-bottom: var(--ui-border-width) solid var(--border-primary) !important;
      padding: 0 var(--spacing-2xl) !important;
    }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab {
      padding: var(--spacing-lg) var(--spacing-xl) !important;
      border: none !important;
      border-bottom: 2px solid transparent !important;
      color: var(--text-secondary) !important;
      font-weight: var(--font-weight-medium) !important;
      transition: var(--transition-base);
    }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight {
      border-bottom-color: var(--color-primary) !important;
      color: var(--color-primary) !important;
    }
    
    .tab-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-md); }

    ::ng-deep .hub-tabpanels {
      flex: 1;
      padding: 0 !important;
      background: transparent !important;
      overflow: hidden !important; /* Managed by .panel-inner */
    }
    ::ng-deep .p-tabpanel { height: 100%; }
    
    .panel-inner {
      padding: var(--spacing-3xl);
      height: 100%;
      overflow-y: auto; /* Internal scrolling for content */
    }

    /* --------------------------------------------------------------------------
       TAB 0: PREMIUM ORG CHART
       -------------------------------------------------------------------------- */
    .org-scroll-wrapper {
      width: 100%;
      min-height: 100%;
      overflow: auto;
      padding-bottom: var(--spacing-4xl);
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
      border: 1px solid var(--border-primary) !important;
      border-radius: var(--ui-border-radius-lg) !important;
      padding: 0 !important;
      box-shadow: var(--shadow-sm);
      transition: var(--transition-base);
      min-width: 240px;
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
      border-bottom: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
    }
    .p-node-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-md); color: var(--text-primary); }
    .p-node-badge {
      font-family: var(--font-mono); font-size: 10px;
      background: var(--bg-primary); padding: 2px 6px;
      border-radius: 4px; border: 1px solid var(--border-primary);
    }
    .p-node-body { padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md); }
    .p-info { display: flex; align-items: center; gap: var(--spacing-sm); }
    .p-text { font-size: var(--font-size-sm); color: var(--text-secondary); }
    .icon-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--bg-secondary); display: flex; align-items: center; justify-content: center;
    }

    /* --------------------------------------------------------------------------
       TAB 2: STATS & TABLE
       -------------------------------------------------------------------------- */
    .premium-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-2xl);
    }
    
    .premium-stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-2xl);
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      box-shadow: var(--shadow-sm);
      transition: var(--transition-base);
    }
    .premium-stat-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
    
    .border-top-primary { border-top: 4px solid var(--color-primary); }
    .border-top-success { border-top: 4px solid var(--color-success); }
    .border-top-info { border-top: 4px solid var(--color-info); }
    
    .s-icon {
      width: 56px; height: 56px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .bg-success-light { background: var(--color-success-bg, #ecfdf5); }
    .bg-info-light { background: var(--color-info-bg, #f0f9ff); }
    
    .s-data { display: flex; flex-direction: column; gap: 4px; }
    .s-label { font-size: var(--font-size-sm); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: var(--font-weight-semibold); }
    .s-value { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--text-primary); line-height: 1; }

    /* Table Glass Card */
    .glass-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .table-header-custom {
      padding: var(--spacing-xl) var(--spacing-2xl);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-header-custom h3 { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); }
    
    ::ng-deep .premium-table .p-datatable-header { display: none; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th {
      background: var(--bg-primary) !important;
      border-bottom: 2px solid var(--border-primary) !important;
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      padding: var(--spacing-lg) var(--spacing-xl);
    }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td {
      border-bottom: 1px solid var(--border-primary);
      padding: var(--spacing-lg) var(--spacing-xl);
      color: var(--text-secondary);
    }
    ::ng-deep .premium-table .p-datatable-tbody > tr:hover { background: var(--bg-secondary) !important; }
    .text-primary-color { color: var(--text-primary); }
    
    .badge-mono-sm {
      font-family: var(--font-mono); font-size: 11px;
      background: var(--bg-secondary); padding: 4px 8px;
      border-radius: 4px; border: 1px solid var(--border-primary);
    }

    /* Empty States */
    .empty-glass-state {
      height: 100%; min-height: 400px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: transparent; border: 2px dashed var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      color: var(--text-tertiary);
    }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); }
  `]
})
export class DepartmentHubComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);

  // Signals for state
  isLoading = signal(true);
  hierarchyNodes = signal<TreeNode[]>([]);
  rawTreeData = signal<any[]>([]); // Used by Custom Tree
  stats = signal<any>(null);

  ngOnInit() {
    this.loadAllData();
  }

  private loadAllData() {
    this.isLoading.set(true);

    forkJoin({
      hierarchy: this.hrmsService.getDepartmentHierarchy().pipe(
        map(res => res?.data?.hierarchy || []),
        catchError(() => {
          this.showError('Failed to load hierarchy data');
          return of([]);
        })
      ),
      tree: this.hrmsService.getDepartmentTree().pipe(
        map(res => res?.data?.departments || []),
        catchError(() => {
          this.showError('Failed to load tree data');
          return of([]);
        })
      ),
      stats: this.hrmsService.getDepartmentStats().pipe(
        map(res => res?.data?.stats || null),
        catchError(() => {
          this.showError('Failed to load statistics');
          return of(null);
        })
      )
    }).subscribe(({ hierarchy, tree, stats }) => {
      this.hierarchyNodes.set(this.transformToHierarchyNodes(hierarchy));
      this.rawTreeData.set(tree); // Pass raw data to Custom Component
      this.stats.set(stats);
      this.isLoading.set(false);
    });
  }

  /**
   * Transforms API hierarchy payload into PrimeNG OrganizationChart nodes
   */
  private transformToHierarchyNodes(data: any[]): TreeNode[] {
    if (!data || !Array.isArray(data)) return [];

    return data.map(node => ({
      expanded: true,
      type: 'default',
      data: {
        name: node.name,
        code: node.code,
        hod: this.extractHodName(node),
        employeeCount: node.employeeCount || 0
      },
      children: this.transformToHierarchyNodes(node.children)
    }));
  }

  /**
   * Utility to safely extract HOD name from dynamic API payload
   */
  private extractHodName(node: any): string {
    if (typeof node.headOfDepartment === 'object' && node.headOfDepartment?.name) {
      return node.headOfDepartment.name;
    }
    return ''; // Returns empty string so 'Unassigned' fallback kicks in on UI
  }

  /**
   * Generates Avatar initials safely
   */
  getInitials(name: string | null | undefined): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  private showError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'System Error', detail });
  }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule, DecimalPipe } from '@angular/common';
// import { forkJoin } from 'rxjs';
// import { catchError, map } from 'rxjs/operators';

// // Services
// import { HRMSService } from '../../../hrms.service';
// import { MessageService } from 'primeng/api';

// // PrimeNG Modules
// import { TabsModule } from 'primeng/tabs';
// import { OrganizationChartModule } from 'primeng/organizationchart';
// import { TreeModule } from 'primeng/tree';
// import { TableModule } from 'primeng/table';
// import { CardModule } from 'primeng/card';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TagModule } from 'primeng/tag';
// import { TreeNode } from 'primeng/api';
// import { TooltipModule } from 'primeng/tooltip';

// @Component({
//   selector: 'app-department-hub',
//   standalone: true,
//   imports: [
//     CommonModule,
//     DecimalPipe,
//     TabsModule,
//     OrganizationChartModule,
//     TreeModule,
//     TableModule,
//     CardModule,
//     SkeletonModule,
//     TagModule,
//     TooltipModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="page-wrapper fade-in">
//       <header class="dashboard-header slide-down mb-4">
//         <h1 class="page-title">Department Hub</h1>
//         <p class="page-subtitle">View hierarchy, structures, and workforce statistics</p>
//       </header>

//       @if (isLoading()) {
//         <div class="card p-4">
//           <p-skeleton width="100%" height="3rem" styleClass="mb-4"></p-skeleton>
//           <p-skeleton width="100%" height="20rem"></p-skeleton>
//         </div>
//       } @else {
//         <div class="card tabs-container">
//           <p-tabs value="0">
//             <p-tablist>
//               <p-tab value="0"><i class="pi pi-sitemap mr-2"></i> Hierarchy View</p-tab>
//               <p-tab value="1"><i class="pi pi-folder mr-2"></i> Tree Explorer</p-tab>
//               <p-tab value="2"><i class="pi pi-chart-bar mr-2"></i> Statistics</p-tab>
//             </p-tablist>

//             <p-tabpanels>
              
//               <p-tabpanel value="0">
//                 <div class="panel-content">
//                   @if (hierarchyNodes().length) {
//                     <p-organizationChart [value]="hierarchyNodes()" styleClass="custom-org-chart">
//                       <ng-template let-node pTemplate="default">
//                         <div class="org-node-card">
//                           <div class="node-header">
//                             <span class="node-title">{{ node.data.name }}</span>
//                             <p-tag [value]="node.data.code" severity="info"></p-tag>
//                           </div>
//                           <div class="node-body">
//                             <div class="info-row">
//                               <i class="pi pi-user text-tertiary text-sm"></i>
//                               <span class="text-sm">{{ node.data.hod || 'Unassigned' }}</span>
//                             </div>
//                             <div class="info-row">
//                               <i class="pi pi-users text-tertiary text-sm"></i>
//                               <span class="text-sm">{{ node.data.employeeCount }} Employees</span>
//                             </div>
//                           </div>
//                         </div>
//                       </ng-template>
//                     </p-organizationChart>
//                   } @else {
//                     <div class="empty-state text-secondary">No hierarchy data available.</div>
//                   }
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="1">
//                 <div class="panel-content">
//                   @if (treeNodes().length) {
//                     <p-tree 
//                       [value]="treeNodes()" 
//                       class="w-full md:w-30rem custom-tree" 
//                       [filter]="true" 
//                       filterMode="strict" 
//                       filterPlaceholder="Search departments...">
//                     </p-tree>
//                   } @else {
//                     <div class="empty-state text-secondary">No tree data available.</div>
//                   }
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="2">
//                 <div class="panel-content">
//                   @if (stats(); as statData) {
//                     <div class="stats-grid mb-4">
//                       <p-card styleClass="stat-card border-left-primary">
//                         <div class="stat-content">
//                           <span class="stat-label">Total Departments</span>
//                           <span class="stat-value">{{ statData.totalDepartments | number }}</span>
//                         </div>
//                         <i class="pi pi-building stat-icon text-primary"></i>
//                       </p-card>
                      
//                       <p-card styleClass="stat-card border-left-success">
//                         <div class="stat-content">
//                           <span class="stat-label">Total Employees</span>
//                           <span class="stat-value">{{ statData.totalEmployees | number }}</span>
//                         </div>
//                         <i class="pi pi-users stat-icon text-success"></i>
//                       </p-card>

//                       <p-card styleClass="stat-card border-left-info">
//                         <div class="stat-content">
//                           <span class="stat-label">Avg. Per Department</span>
//                           <span class="stat-value">{{ statData.avgEmployeesPerDept | number:'1.0-1' }}</span>
//                         </div>
//                         <i class="pi pi-chart-pie stat-icon text-info"></i>
//                       </p-card>
//                     </div>

//                     <p-table 
//                       [value]="statData.departments" 
//                       [paginator]="true" 
//                       [rows]="10" 
//                       responsiveLayout="scroll"
//                       styleClass="p-datatable-sm custom-table">
//                       <ng-template pTemplate="header">
//                         <tr>
//                           <th>Department</th>
//                           <th>Code</th>
//                           <th>HOD</th>
//                           <th class="text-right">Total Emps</th>
//                           <th class="text-right">Active Emps</th>
//                         </tr>
//                       </ng-template>
//                       <ng-template pTemplate="body" let-dept>
//                         <tr>
//                           <td class="font-medium">{{ dept.name }}</td>
//                           <td><span class="badge-mono">{{ dept.code }}</span></td>
//                           <td>{{ dept.hodName || 'Unassigned' }}</td>
//                           <td class="text-right">{{ dept.employeeCount }}</td>
//                           <td class="text-right">
//                             <p-tag 
//                               [severity]="dept.activeEmployees > 0 ? 'success' : 'warn'" 
//                               [value]="dept.activeEmployees.toString()">
//                             </p-tag>
//                           </td>
//                         </tr>
//                       </ng-template>
//                     </p-table>
//                   } @else {
//                     <div class="empty-state text-secondary">No statistics available.</div>
//                   }
//                 </div>
//               </p-tabpanel>

//             </p-tabpanels>
//           </p-tabs>
//         </div>
//       }
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       width: 100%;
//       min-height: 100vh;
//       background-color: var(--bg-primary);
//       color: var(--text-primary);
//       font-family: var(--font-body);
//     }

//     .page-wrapper {
//       padding: var(--spacing-2xl) var(--spacing-3xl);
//       max-width: 1600px;
//       margin: 0 auto;
//     }

//     /* Header */
//     .dashboard-header {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }
//     .page-title {
//       font-size: var(--font-size-4xl);
//       font-weight: var(--font-weight-bold);
//       font-family: var(--font-heading);
//       margin: 0;
//       color: var(--text-primary);
//     }
//     .page-subtitle {
//       font-size: var(--font-size-md);
//       color: var(--text-secondary);
//       margin: 0;
//     }

//     /* Card & Tabs Container */
//     .tabs-container {
//       background: var(--component-bg, var(--bg-secondary));
//       border-radius: var(--ui-border-radius-lg);
//       border: var(--ui-border-width) solid var(--border-primary);
//       box-shadow: var(--shadow-sm);
//       overflow: hidden;
//     }
//     .panel-content {
//       padding: var(--spacing-2xl) 0;
//     }

//     /* Org Chart Overrides */
//     ::ng-deep .custom-org-chart .p-organizationchart-node-content {
//       background: var(--bg-primary) !important;
//       border: var(--ui-border-width) solid var(--border-primary) !important;
//       border-radius: var(--ui-border-radius) !important;
//       padding: 0 !important;
//       box-shadow: var(--shadow-xs);
//       transition: var(--transition-base);
//     }
//     ::ng-deep .custom-org-chart .p-organizationchart-node-content:hover {
//       border-color: var(--component-border-focus, var(--color-primary)) !important;
//       box-shadow: var(--shadow-md);
//     }
    
//     .org-node-card {
//       min-width: 200px;
//       padding: var(--spacing-lg);
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//       text-align: left;
//     }
//     .node-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       gap: var(--spacing-md);
//       border-bottom: var(--ui-border-width) solid var(--component-divider);
//       padding-bottom: var(--spacing-sm);
//     }
//     .node-title {
//       font-weight: var(--font-weight-semibold);
//       font-size: var(--font-size-md);
//       color: var(--text-primary);
//     }
//     .node-body {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }
//     .info-row {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       color: var(--text-secondary);
//     }

//     /* Tree Overrides */
//     ::ng-deep .custom-tree {
//       background: transparent;
//       border: none;
//       padding: 0;
//     }

//     /* Stats Grid */
//     .stats-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//       gap: var(--spacing-xl);
//     }
//     ::ng-deep .stat-card .p-card-body {
//       padding: var(--spacing-xl);
//     }
//     ::ng-deep .stat-card .p-card-content {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: 0;
//     }
//     .stat-content {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }
//     .stat-label {
//       font-size: var(--font-size-sm);
//       color: var(--text-secondary);
//       font-weight: var(--font-weight-medium);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
//     .stat-value {
//       font-size: var(--font-size-4xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//     }
//     .stat-icon {
//       font-size: 2.5rem;
//       opacity: 0.8;
//     }
//     .border-left-primary { border-left: 4px solid var(--color-primary, #3b82f6) !important; }
//     .border-left-success { border-left: 4px solid var(--color-success, #10b981) !important; }
//     .border-left-info { border-left: 4px solid var(--color-info, #0ea5e9) !important; }

//     /* Table Overrides */
//     ::ng-deep .custom-table .p-datatable-header,
//     ::ng-deep .custom-table .p-datatable-thead > tr > th {
//       background: var(--bg-primary);
//       border-bottom: var(--ui-border-width) solid var(--component-divider);
//       color: var(--text-secondary);
//       font-weight: var(--font-weight-semibold);
//       font-size: var(--font-size-sm);
//       text-transform: uppercase;
//     }
//     ::ng-deep .custom-table .p-datatable-tbody > tr > td {
//       border-bottom: var(--ui-border-width) solid var(--component-divider);
//       color: var(--text-primary);
//       padding: var(--spacing-md) var(--spacing-lg);
//     }

//     /* Utilities */
//     .mb-4 { margin-bottom: var(--spacing-2xl); }
//     .mr-2 { margin-right: var(--spacing-md); }
//     .text-right { text-align: right; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .w-full { width: 100%; }
    
//     .badge-mono {
//       font-family: var(--font-mono);
//       font-size: var(--font-size-sm);
//       background: var(--bg-primary);
//       padding: var(--spacing-xs) var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//       border: var(--ui-border-width) solid var(--border-primary);
//     }

//     .empty-state {
//       text-align: center;
//       padding: var(--spacing-5xl);
//       background: var(--bg-primary);
//       border-radius: var(--ui-border-radius-lg);
//       border: 1px dashed var(--border-secondary);
//     }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
//   `]
// })
// export class DepartmentHubComponent implements OnInit {
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(MessageService);

//   // Signals for state
//   isLoading = signal(true);
//   hierarchyNodes = signal<TreeNode[]>([]);
//   treeNodes = signal<TreeNode[]>([]);
//   stats = signal<any>(null);

//   ngOnInit() {
//     this.loadAllData();
//   }

//   private loadAllData() {
//     this.isLoading.set(true);

//     forkJoin({
//       hierarchy: this.hrmsService.getDepartmentHierarchy().pipe(
//         map(res => res?.data?.hierarchy || []),
//         catchError(() => {
//           this.showError('Failed to load hierarchy data');
//           return [];
//         })
//       ),
//       tree: this.hrmsService.getDepartmentTree().pipe(
//         map(res => res?.data?.departments || []),
//         catchError(() => {
//           this.showError('Failed to load tree data');
//           return [];
//         })
//       ),
//       stats: this.hrmsService.getDepartmentStats().pipe(
//         map(res => res?.data?.stats || null),
//         // catchError((error:any) => {
//         //   this.showError('Failed to load statistics');
//         //   return ;
//         // })
//       )
//     }).subscribe(({ hierarchy, tree, stats }) => {
//       this.hierarchyNodes.set(this.transformToHierarchyNodes(hierarchy));
//       this.treeNodes.set(this.transformToTreeNodes(tree));
//       this.stats.set(stats);
//       this.isLoading.set(false);
//     });
//   }

//   /**
//    * Transforms API hierarchy payload into PrimeNG OrganizationChart nodes
//    */
//   private transformToHierarchyNodes(data: any[]): TreeNode[] {
//     if (!data || !Array.isArray(data)) return [];

//     return data.map(node => ({
//       expanded: true,
//       type: 'default',
//       data: {
//         name: node.name,
//         code: node.code,
//         hod: node.headOfDepartment?.name || '',
//         employeeCount: node.employeeCount || 0
//       },
//       children: this.transformToHierarchyNodes(node.children)
//     }));
//   }

//   /**
//    * Transforms API tree payload into PrimeNG basic Tree nodes
//    */
//   private transformToTreeNodes(data: any[]): TreeNode[] {
//     if (!data || !Array.isArray(data)) return [];

//     return data.map(node => ({
//       label: node.name,
//       key: node._id,
//       expanded: true,
//       data: node,
//       icon: node.children && node.children.length > 0 ? 'pi pi-folder' : 'pi pi-file',
//       children: this.transformToTreeNodes(node.children)
//     }));
//   }

//   private showError(detail: string) {
//     this.messageService.add({ severity: 'error', summary: 'Error', detail });
//   }
// }