import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-leave-admin-hub',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe,
    TabsModule, TableModule, CardModule, ButtonModule, TagModule,
    SkeletonModule, AvatarModule, TooltipModule, SelectModule,
    ChartModule, IconFieldModule, InputIconModule, InputTextModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-shield"></i></div>
          <div class="header-titles">
            <h1 class="page-title">Leave Administration</h1>
            <p class="page-subtitle">Monitor organizational time-off, view team calendars, and analyze absence trends.</p>
          </div>
        </div>
        <div class="header-right flex-align gap-3">
          <p-select [options]="departments" placeholder="Filter by Department" styleClass="premium-dropdown"></p-select>
          <p-button icon="pi pi-download" [outlined]="true" label="Export Report" severity="secondary"></p-button>
        </div>
        <div class="flex-between mb-4">
  <h3 class="font-heading m-0 text-primary-color">Requires Your Attention</h3>
  
  <p-button 
    label="Approve Selected ({{ selectedApprovals().length }})" 
    icon="pi pi-check-circle" 
    severity="success" 
    [disabled]="selectedApprovals().length === 0"
    [loading]="isBulkApproving()"
    (onClick)="bulkApprove()">
  </p-button>
</div>
      </header>

      @if (isLoading()) {
        <div class="flex-col gap-4">
          <p-skeleton height="60px" borderRadius="12px"></p-skeleton>
          <p-skeleton height="500px" borderRadius="12px"></p-skeleton>
        </div>
      } @else {
        
        <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
          <p-tabs value="0">
            
            <p-tablist styleClass="hub-tablist">
              <p-tab value="0"><div class="tab-label"><i class="pi pi-list"></i> All Requests</div></p-tab>
              <p-tab value="1"><div class="tab-label"><i class="pi pi-calendar"></i> Team Calendar</div></p-tab>
              <p-tab value="2"><div class="tab-label"><i class="pi pi-chart-bar"></i> Leave Analytics</div></p-tab>
            </p-tablist>

            <p-tabpanels styleClass="hub-tabpanels p-0">
              
              <p-tabpanel value="0">
                <div class="panel-inner p-4">
                  <p-table 
                    #dt
                    [value]="allRequests()" 
                    [paginator]="true" 
                    [rows]="10" 
                    [globalFilterFields]="['leaveRequestId', 'user.name', 'leaveType', 'status']"
                    responsiveLayout="scroll"
                    styleClass="premium-table border-round-xl overflow-hidden border-1 surface-border">
                    
                    <ng-template pTemplate="caption">
                      <div class="table-toolbar flex-between">
                        <h3 class="m-0 font-heading text-primary-color">Organizational Leaves</h3>
                        <p-iconField iconPosition="left">
                          <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                          <input type="text" pInputText placeholder="Search requests..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="premium-search-input" />
                        </p-iconField>
                      </div>
                    </ng-template>

                    <ng-template pTemplate="header">
                      <tr>
                        <th>Employee</th>
                        <th>Request Details</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-req>
                      <tr class="table-row-hover">
                        <td>
                          <div class="flex-align gap-3">
                            <p-avatar [label]="getInitials(req.user?.name)" shape="circle" size="large" [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)'}"></p-avatar>
                            <div class="flex-col gap-1">
                              <span class="font-bold text-primary-color">{{ req.user?.name || 'Unknown' }}</span>
                              <span class="text-xs text-secondary">{{ req.departmentId?.name || 'Dept N/A' }}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="flex-col gap-1">
                            <span class="font-bold capitalize flex-align gap-2">
                              <div class="type-dot" [ngClass]="req.leaveType"></div>
                              {{ req.leaveType }} Leave
                            </span>
                            <span class="badge-mono-sm w-max">{{ req.leaveRequestId }}</span>
                          </div>
                        </td>
                        <td>
                          <div class="flex-align gap-2 text-sm text-secondary font-medium">
                            <span>{{ req.startDate | date:'dd MMM' }}</span>
                            <i class="pi pi-arrow-right text-xs text-tertiary"></i>
                            <span>{{ req.endDate | date:'dd MMM' }}</span>
                          </div>
                          <div class="text-xs text-primary font-bold mt-1">{{ req.daysCount }} Days</div>
                        </td>
                        <td>
                          <p-tag [severity]="getStatusSeverity(req.status)" [value]="req.status | titlecase"></p-tag>
                        </td>
                        <td class="text-right">
                          <p-button icon="pi pi-eye" [text]="true" [rounded]="true" severity="secondary" pTooltip="View Details"></p-button>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="5" class="text-center py-6 text-secondary">No leave requests found.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-inner p-4 bg-surface h-full">
                  <div class="flex-between mb-4">
                    <h3 class="font-heading m-0 text-primary-color">Team Availability</h3>
                    <div class="flex-align gap-2">
                      <p-button icon="pi pi-chevron-left" [text]="true" [rounded]="true" severity="secondary"></p-button>
                      <span class="font-bold text-lg mx-2">{{ currentMonthText }}</span>
                      <p-button icon="pi pi-chevron-right" [text]="true" [rounded]="true" severity="secondary"></p-button>
                    </div>
                  </div>

                  <div class="timeline-container">
                    @for (item of calendarData(); track $index) {
                      <div class="timeline-row glass-card p-3 mb-3 flex-align gap-4">
                        <div class="date-badge flex-col text-center">
                          <span class="text-sm text-secondary uppercase-text">{{ item.date | date:'EEE' }}</span>
                          <span class="text-2xl font-bold text-primary">{{ item.date | date:'dd' }}</span>
                        </div>
                        <div class="flex-1">
                          @if (item.leaves.length > 0) {
                            <div class="flex-align gap-3 flex-wrap">
                              @for (leave of item.leaves; track leave.id) {
                                <div class="leave-chip flex-align gap-2" [ngClass]="leave.type">
                                  <p-avatar [label]="getInitials(leave.userName)" shape="circle" size="normal" styleClass="mini-avatar"></p-avatar>
                                  <span class="text-sm font-semibold">{{ leave.userName }}</span>
                                  <span class="text-xs opacity-80 border-left pl-2 ml-1">{{ leave.type | titlecase }}</span>
                                </div>
                              }
                            </div>
                          } @else {
                            <span class="text-tertiary text-sm italic">Full team is available today.</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </p-tabpanel>

              <p-tabpanel value="2">
                <div class="panel-inner p-4">
                  
                  @if (analyticsData(); as stats) {
                    <div class="kpi-grid mb-5">
                      <div class="kpi-card border-top-primary">
                        <span class="kpi-label">Total Leaves Taken</span>
                        <div class="kpi-val">{{ stats.totalLeavesTaken || 0 }} <span class="text-sm text-secondary font-normal">days</span></div>
                        <span class="text-xs text-success flex-align gap-1 mt-2"><i class="pi pi-arrow-down"></i> 12% vs last month</span>
                      </div>
                      <div class="kpi-card border-top-warning">
                        <span class="kpi-label">Pending Requests</span>
                        <div class="kpi-val">{{ stats.pendingRequests || 0 }}</div>
                        <span class="text-xs text-tertiary mt-2">Awaiting manager action</span>
                      </div>
                      <div class="kpi-card border-top-info">
                        <span class="kpi-label">Most Used Leave Type</span>
                        <div class="kpi-val text-xl capitalize mt-2">{{ stats.mostUsedType || 'N/A' }}</div>
                      </div>
                    </div>
                  }

                  <div class="grid-2">
                    <div class="chart-container glass-card p-4">
                      <h4 class="font-heading m-0 mb-4 text-primary-color">Monthly Leave Trends</h4>
                      <p-chart type="bar" [data]="trendChartData" [options]="chartOptions" height="250px"></p-chart>
                    </div>

                    <div class="chart-container glass-card p-4">
                      <h4 class="font-heading m-0 mb-4 text-primary-color">High Leave Utilization</h4>
                      <ul class="absentee-list">
                        <li class="flex-between py-2 border-bottom">
                          <div class="flex-align gap-2">
                            <p-avatar label="JD" shape="circle" [style]="{'background-color': '#fef2f2', 'color': '#ef4444'}"></p-avatar>
                            <span class="font-semibold text-secondary">John Doe</span>
                          </div>
                          <span class="font-bold text-error">18 Days</span>
                        </li>
                        <li class="flex-between py-2 border-bottom">
                          <div class="flex-align gap-2">
                            <p-avatar label="SJ" shape="circle" [style]="{'background-color': '#fff7ed', 'color': '#f97316'}"></p-avatar>
                            <span class="font-semibold text-secondary">Sarah Jenkins</span>
                          </div>
                          <span class="font-bold text-warning">14 Days</span>
                        </li>
                        <li class="flex-between py-2">
                          <div class="flex-align gap-2">
                            <p-avatar label="MS" shape="circle" [style]="{'background-color': '#eff6ff', 'color': '#3b82f6'}"></p-avatar>
                            <span class="font-semibold text-secondary">Mukesh Singh</span>
                          </div>
                          <span class="font-bold text-primary">10 Days</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>
  `,
  styles: [`
    /* --------------------------------------------------------------------------
       GLOBAL & VARIABLES
       -------------------------------------------------------------------------- */
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }

    /* Utility */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .flex-1 { flex: 1; }
    .flex-wrap { flex-wrap: wrap; }
    
    .w-full { width: 100%; }
    .w-max { width: max-content; }
    .h-full { height: 100%; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mx-2 { margin-left: var(--spacing-sm); margin-right: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .py-2 { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    .pl-2 { padding-left: var(--spacing-sm); }
    .ml-1 { margin-left: var(--spacing-xs); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary { background: var(--color-primary); color: white; }
    
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-left { border-left: 1px solid rgba(255,255,255,0.3); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-error { color: var(--color-error); }
    .text-warning { color: var(--color-warning); }
    .text-white { color: white; }
    
    .font-normal { font-weight: normal; }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-semibold { font-weight: var(--font-weight-semibold); }
    .font-heading { font-family: var(--font-heading); }
    .capitalize { text-transform: capitalize; }
    .uppercase-text { text-transform: uppercase; letter-spacing: 0.05em; }
    .italic { font-style: italic; }
    .opacity-80 { opacity: 0.8; }

    /* --------------------------------------------------------------------------
       HEADER & TABS
       -------------------------------------------------------------------------- */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
    .header-titles { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

    ::ng-deep .premium-dropdown .p-select { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); }
    
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }

    ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }
    .tab-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-md); }

    /* --------------------------------------------------------------------------
       TABLE
       -------------------------------------------------------------------------- */
    .table-toolbar { padding: 0 0 var(--spacing-lg) 0; }
    ::ng-deep .premium-search-input { background: var(--bg-secondary) !important; border: 1px solid var(--border-primary) !important; border-radius: var(--ui-border-radius-lg) !important; width: 250px; }

    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--color-primary-bg) !important; }

    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }
    
    .type-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--text-tertiary); }
    .type-dot.sick { background: #ef4444; }
    .type-dot.casual { background: #3b82f6; }
    .type-dot.earned { background: #f59e0b; }
    .type-dot.unpaid { background: #64748b; }

    /* --------------------------------------------------------------------------
       CALENDAR TIMELINE
       -------------------------------------------------------------------------- */
    .timeline-container { display: flex; flex-direction: column; max-width: 1000px; }
    .timeline-row { border: 1px solid var(--border-primary); transition: transform 0.2s; }
    .timeline-row:hover { border-color: var(--color-primary-border); transform: translateX(4px); }
    .date-badge { width: 60px; padding-right: var(--spacing-lg); border-right: 1px dashed var(--border-secondary); }
    
    .leave-chip { padding: 4px 12px 4px 4px; border-radius: 20px; color: white; box-shadow: var(--shadow-sm); }
    .leave-chip.casual { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
    .leave-chip.sick { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); }
    .leave-chip.earned { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); }
    ::ng-deep .mini-avatar .p-avatar { width: 24px; height: 24px; font-size: 10px; background: rgba(255,255,255,0.2) !important; color: white !important; }

    /* --------------------------------------------------------------------------
       ANALYTICS
       -------------------------------------------------------------------------- */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-xl); }
    .kpi-card { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-xl); display: flex; flex-direction: column; box-shadow: var(--shadow-sm); }
    .border-top-primary { border-top: 4px solid var(--color-primary); }
    .border-top-warning { border-top: 4px solid var(--color-warning); }
    .border-top-info { border-top: 4px solid var(--color-info); }
    .kpi-label { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-val { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin-top: var(--spacing-sm); line-height: 1; }
    
    .chart-container { border: 1px solid var(--border-primary); }
    .absentee-list { list-style: none; padding: 0; margin: 0; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
      .header-right { flex-direction: column; }
      .grid-2 { grid-template-columns: 1fr; }
      .table-toolbar { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
    }
  `]
})
export class LeaveAdminHubComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // State
  isLoading = signal<boolean>(true);

  // Tab 0 State
  allRequests = signal<any[]>([]);
  departments = [{ label: 'All Departments', value: null }, { label: 'Engineering', value: 'eng' }, { label: 'Sales', value: 'sal' }];

  // Tab 1 State
  currentMonthText = 'October 2026'; // Mock
  calendarData = signal<any[]>([]);

  // Tab 2 State
  analyticsData = signal<any>(null);
  trendChartData: any;
  chartOptions: any;

  ngOnInit() {
    this.initChart();
    this.loadAdminData();
  }

  private loadAdminData() {
    this.isLoading.set(true);

    forkJoin({
      all: this.hrmsService.getLeaveRequests().pipe(
        map(res => res?.data?.leaveRequests || []),
        catchError(() => of([]))
      ),
      calendar: this.hrmsService.getTeamLeaveCalendar(10, 2026).pipe( // Mocking Oct 2026
        map(res => res?.data || this.generateMockCalendar()),
        catchError(() => of(this.generateMockCalendar()))
      ),
      analytics: this.hrmsService.getLeaveAnalytics().pipe(
        map(res => res?.data || { totalLeavesTaken: 142, pendingRequests: 8, mostUsedType: 'casual' }),
        catchError(() => of({ totalLeavesTaken: 142, pendingRequests: 8, mostUsedType: 'casual' }))
      )
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ all, calendar, analytics }) => {
      this.allRequests.set(all);
      this.calendarData.set(calendar);
      this.analyticsData.set(analytics);
    });
  }

  // --- Helpers ---
  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warn';
      case 'rejected':
      case 'cancelled': return 'danger';
      case 'escalated': return 'info';
      default: return 'secondary';
    }
  }


  selectedApprovals = signal<any[]>([]);
  isBulkApproving = signal<boolean>(false);
  bulkApprove() {
    const selected = this.selectedApprovals();
    if (!selected || selected.length === 0) return;

    const requestIds = selected.map(req => req._id);
    this.isBulkApproving.set(true);

    this.hrmsService.bulkApproveLeaves(requestIds, 'Bulk approved by manager').pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => this.isBulkApproving.set(false))
    ).subscribe((res:any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        this.selectedApprovals.set([]); // Clear selection
        // this.loadDashboardData(); // Refresh the lists
      }
    });
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // --- Mocks & Chart Config ---
  private initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-primary') || '#333';
    const textColorSecondary = documentStyle.getPropertyValue('--text-secondary') || '#666';
    const surfaceBorder = documentStyle.getPropertyValue('--border-primary') || '#ddd';

    this.trendChartData = {
      labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      datasets: [
        { label: 'Casual', backgroundColor: '#3b82f6', data: [20, 15, 30, 25, 22, 18] },
        { label: 'Sick', backgroundColor: '#ef4444', data: [12, 10, 8, 14, 18, 9] }
      ]
    };

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } },
        y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } }
      }
    };
  }

  private generateMockCalendar() {
    // Generates a mock timeline for UI demonstration
    return [
      {
        date: new Date('2026-10-12'), leaves: [
          { id: 1, userName: 'Mukesh Singh', type: 'casual' },
          { id: 2, userName: 'Sarah Jenkins', type: 'sick' }
        ]
      },
      {
        date: new Date('2026-10-13'), leaves: [
          { id: 2, userName: 'Sarah Jenkins', type: 'sick' }
        ]
      },
      { date: new Date('2026-10-14'), leaves: [] },
      {
        date: new Date('2026-10-15'), leaves: [
          { id: 3, userName: 'David Chen', type: 'earned' }
        ]
      }
    ];
  }
}