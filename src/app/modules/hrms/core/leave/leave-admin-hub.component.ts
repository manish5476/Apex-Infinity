import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, map, takeUntil } from 'rxjs/operators';

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
import { MasterDropdownService } from '@core/services/master-dropdown.service';

@Component({
  selector: 'app-leave-admin-hub',
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe,
    TabsModule, TableModule, CardModule, ButtonModule, TagModule,
    SkeletonModule, AvatarModule, TooltipModule, SelectModule,
    ChartModule, IconFieldModule, InputIconModule, InputTextModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apex-page fade-in flex-col h-screen">
      
      <header class="apex-header apex-header--elevated flex-shrink-0">
        <div class="flex-align gap-4">
          <div class="apex-card__icon" style="width: 48px; height: 48px; font-size: 20px;"><i class="pi pi-shield"></i></div>
          <div class="flex-col">
            <h1 class="apex-page-header__title m-0" style="font-size: var(--font-size-2xl);">Leave Administration</h1>
            <p class="apex-page-header__subtitle m-0 text-sm text-tertiary">Monitor organizational time-off, view team calendars, and analyze absence trends.</p>
          </div>
        </div>
        <div class="header-right flex-align gap-3 ml-auto">
          <p-select [options]="departments()" optionLabel="label" optionValue="value" [filter]="true" filterBy="label" placeholder="Filter by Department" styleClass="premium-dropdown"></p-select>
          <p-button icon="pi pi-download" [outlined]="true" label="Export Report" styleClass="apex-btn apex-btn--secondary"></p-button>
        </div>
      </header>

      <main class="apex-content flex-1 overflow-auto flex-col p-4 sm:p-5">
        <div class="flex-between mb-4">
          <h3 class="font-heading m-0 text-primary-color">Requires Your Attention</h3>
          
          <p-button 
            label="Approve Selected ({{ selectedApprovals().length }})" 
            icon="pi pi-check-circle" 
            styleClass="apex-btn apex-btn--primary bg-success border-success" 
            [disabled]="selectedApprovals().length === 0"
            [loading]="isBulkApproving()"
            (onClick)="bulkApprove()">
          </p-button>
        </div>

        @if (isLoading()) {
          <div class="flex-col gap-4">
            <p-skeleton height="60px" borderRadius="var(--ui-border-radius-lg)"></p-skeleton>
            <p-skeleton height="500px" borderRadius="var(--ui-border-radius-lg)"></p-skeleton>
          </div>
        } @else {
          
          <div class="apex-card apex-card--surface p-0 slide-down border-0" style="animation-delay: 0.1s">
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
                      styleClass="premium-table border-round-lg overflow-hidden border border-primary surface-border">
                      
                      <ng-template pTemplate="caption">
                        <div class="table-toolbar flex-between pb-3">
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
                              <p-avatar [label]="getInitials(req.employee?.displayName || req.user?.name || 'EM')" shape="circle" size="large" [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)'}"></p-avatar>
                              <div class="flex-col gap-1">
                                <span class="font-bold text-primary-color">{{ req.employee?.displayName || (req.employee?.firstName ? (req.employee?.firstName + ' ' + (req.employee?.lastName || '')) : null) || req.user?.name || 'Employee' }}</span>
                                <span class="text-xs text-secondary">{{ req.departmentId?.name || req.employee?.departmentId?.name || '—' }}</span>
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
                      <p-button icon="pi pi-chevron-left" [text]="true" [rounded]="true" severity="secondary" (onClick)="prevMonth()"></p-button>
                        <span class="font-bold text-lg mx-2">{{ currentMonthText }}</span>
                        <p-button icon="pi pi-chevron-right" [text]="true" [rounded]="true" severity="secondary" (onClick)="nextMonth()"></p-button>
                      </div>
                    </div>

                    <div class="timeline-container">
                      @for (item of calendarData(); track $index) {
                        <div class="timeline-row apex-card p-3 mb-3 flex-align gap-4">
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
                      <div class="apex-grid apex-grid--3 mb-5">
                        <div class="apex-card p-4 border-top-primary">
                          <span class="kpi-label">Total Leaves Taken</span>
                          <div class="kpi-val">{{ stats.totalLeavesTaken || 0 }} <span class="text-sm text-secondary font-normal">days</span></div>
                          <span class="text-xs text-tertiary mt-2">{{ stats.totalRequests || 0 }} approved requests</span>
                        </div>
                        <div class="apex-card p-4 border-top-warning">
                          <span class="kpi-label">Pending Requests</span>
                          <div class="kpi-val">{{ stats.pendingRequests || 0 }}</div>
                          <span class="text-xs text-tertiary mt-2">Awaiting manager action</span>
                        </div>
                        <div class="apex-card p-4 border-top-info">
                          <span class="kpi-label">Most Used Leave Type</span>
                          <div class="kpi-val text-xl capitalize mt-2">{{ stats.mostUsedType || 'N/A' }}</div>
                        </div>
                      </div>
                    }

                    <div class="apex-grid apex-grid--2">
                      <div class="apex-card p-4">
                        <h4 class="font-heading m-0 mb-4 text-primary-color">Monthly Leave Trends</h4>
                        <p-chart type="bar" [data]="trendChartData" [options]="chartOptions" height="250px"></p-chart>
                      </div>

                      <div class="apex-card p-4">
                        <h4 class="font-heading m-0 mb-4 text-primary-color">Leave by Type</h4>
                        @if (analyticsData(); as stats) {
                          @if (stats.byLeaveType?.length > 0) {
                            <ul class="absentee-list">
                              @for (lt of stats.byLeaveType; track lt._id; let last = $last) {
                                <li class="flex-between py-2" [class.border-bottom]="!last">
                                  <div class="flex-align gap-2">
                                    <span class="font-semibold text-secondary capitalize">{{ lt._id }} Leave</span>
                                    <span class="text-xs text-tertiary">({{ lt.count }} requests)</span>
                                  </div>
                                  <span class="font-bold text-primary">{{ lt.totalDays | number:'1.0-1' }} Days</span>
                                </li>
                              }
                            </ul>
                          } @else {
                            <div class="text-center py-6 text-secondary text-sm">No approved leave data for the selected period.</div>
                          }
                        }
                      </div>
                    </div>

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
      display: block; 
      width: 100%; 
      height: 100vh;
      overflow: hidden;
    }

    /* Utility Helpers */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-1 { flex: 1; }
    .flex-wrap { flex-wrap: wrap; }
    .ml-auto { margin-left: auto; }
    
    .w-full { width: 100%; }
    .w-max { width: max-content; }
    .h-screen { height: 100vh; }
    .h-full { height: 100%; }
    
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
    .pb-3 { padding-bottom: var(--spacing-lg); }
    .py-2 { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    .pl-2 { padding-left: var(--spacing-sm); }
    .ml-1 { margin-left: var(--spacing-xs); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary { background: var(--color-primary); color: white; }
    
    .border { border: 1px solid var(--border-primary); }
    .border-0 { border: none !important; }
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-left { border-left: 1px solid rgba(255,255,255,0.3); }
    .surface-border { border-color: var(--border-primary); }
    
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
    .overflow-hidden { overflow: hidden; }
    .overflow-auto { overflow-y: auto; overflow-x: hidden; }

    .apex-grid { display: grid; gap: 1.25rem; }
    .apex-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .apex-grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .apex-grid--auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
    @media (max-width: 1024px) {
      .apex-grid--3 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
      .apex-grid--2 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    }

    /* Dropdown */
    ::ng-deep .premium-dropdown .p-select { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); }

    /* Tabs Override */
    ::ng-deep .hub-tablist .p-tablist-nav { background: transparent !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }
    ::ng-deep .hub-tabpanels { background: transparent !important; }
    .tab-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-md); }

    /* Table */
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

    /* Calendar Timeline */
    .timeline-container { display: flex; flex-direction: column; max-width: 1000px; }
    .timeline-row { transition: transform 0.2s; }
    .timeline-row:hover { border-color: var(--color-primary); transform: translateX(4px); }
    .date-badge { width: 60px; padding-right: var(--spacing-lg); border-right: 1px dashed var(--border-secondary); }
    
    .leave-chip { padding: 4px 12px 4px 4px; border-radius: 20px; color: white; box-shadow: var(--shadow-sm); }
    .leave-chip.casual { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
    .leave-chip.sick { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); }
    .leave-chip.earned { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); }
    ::ng-deep .mini-avatar .p-avatar { width: 24px; height: 24px; font-size: 10px; background: rgba(255,255,255,0.2) !important; color: white !important; }

    /* Analytics */
    .border-top-primary { border-top: 4px solid var(--color-primary) !important; }
    .border-top-warning { border-top: 4px solid var(--color-warning) !important; }
    .border-top-info { border-top: 4px solid #0ea5e9 !important; }
    .kpi-label { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-val { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin-top: var(--spacing-sm); line-height: 1; }
    .absentee-list { list-style: none; padding: 0; margin: 0; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (min-width: 640px) {
      .sm\\:p-5 { padding: var(--spacing-2xl); }
    }
  `]
})
export class LeaveAdminHubComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private masterDropdownService = inject(MasterDropdownService);

  // State
  isLoading = signal<boolean>(true);

  // Tab 0 — All Requests
  allRequests = signal<any[]>([]);
  /** Loaded from master-dropdown endpoint; starts with the "All" option. */
  departments = signal<{ label: string; value: string | null }[]>([{ label: 'All Departments', value: null }]);

  // Tab 1 — Team Calendar: tracks the month being viewed (defaults to current month)
  private calendarMonth = signal<{ month: number; year: number }>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  calendarData = signal<any[]>([]);

  /** Human-readable month label derived from the currently displayed month. */
  get currentMonthText(): string {
    const { month, year } = this.calendarMonth();
    return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  // Tab 2 — Leave Analytics
  analyticsData = signal<any>(null);
  trendChartData: any;
  chartOptions: any;

  // Approval toolbar
  selectedApprovals = signal<any[]>([]);
  isBulkApproving = signal<boolean>(false);

  ngOnInit(): void {
    this._initChartOptions();
    this.loadAdminData();
  }

  private loadAdminData(): void {
    this.isLoading.set(true);
    const { month, year } = this.calendarMonth();

    forkJoin({
      all: this.hrmsService.getLeaveRequests().pipe(
        map(res => res?.data?.leaveRequests ?? []),
        catchError(() => of([]))
      ),
      calendar: this.hrmsService.getTeamLeaveCalendar(month, year).pipe(
        map(res => {
          // Backend returns { calendar: [{ date, count, leaves }] }
          const raw: any[] = res?.data?.calendar ?? res?.data ?? [];
          return raw.map(item => ({
            ...item,
            date: new Date(item.date)
          }));
        }),
        catchError(() => of(this._emptyCalendarFallback(month, year)))
      ),
      analytics: this.hrmsService.getLeaveAnalytics().pipe(
        map(res => {
          // Backend returns { financialYear, analytics: { byLeaveType, byMonth, byDepartment, overall } }
          const a = res?.data?.analytics ?? res?.data ?? null;
          return a;
        }),
        catchError(() => of(null))
      ),
      departments: this.masterDropdownService.getDropdownData('departments').pipe(
        map(res => res?.data ?? []),
        catchError(() => of([]))
      )
    }).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(({ all, calendar, analytics, departments }) => {
      this.allRequests.set(all);
      this.calendarData.set(calendar);

      // Update departments dropdown from master data
      const deptOptions = [
        { label: 'All Departments', value: null },
        ...departments.map((d: any) => ({ label: d.label ?? d.name, value: d.value ?? d._id }))
      ];
      this.departments.set(deptOptions);

      // Build analytics stats + chart from real aggregation data
      if (analytics) {
        const overall = analytics.overall?.[0] ?? {};
        const mostUsed = [...(analytics.byLeaveType ?? [])]
          .sort((a: any, b: any) => (b.totalDays ?? 0) - (a.totalDays ?? 0))[0];

        this.analyticsData.set({
          totalLeavesTaken: overall.totalLeaveDays ?? 0,
          totalRequests: overall.totalRequests ?? 0,
          pendingRequests: (all as any[]).filter((r: any) => r.status === 'pending').length,
          mostUsedType: mostUsed?._id ?? 'N/A',
          avgLeaveDays: Math.round((overall.avgLeaveDays ?? 0) * 10) / 10,
          byLeaveType: analytics.byLeaveType ?? [],
          byMonth: analytics.byMonth ?? [],
          byDepartment: analytics.byDepartment ?? []
        });

        this._buildChartFromAnalytics(analytics.byMonth ?? [], analytics.byLeaveType ?? []);
      } else {
        this.analyticsData.set(null);
      }
    });
  }

  /** Navigate team calendar to previous month */
  prevMonth(): void {
    const { month, year } = this.calendarMonth();
    const d = new Date(year, month - 2, 1);
    this.calendarMonth.set({ month: d.getMonth() + 1, year: d.getFullYear() });
    this.loadAdminData();
  }

  /** Navigate team calendar to next month */
  nextMonth(): void {
    const { month, year } = this.calendarMonth();
    const d = new Date(year, month, 1);
    this.calendarMonth.set({ month: d.getMonth() + 1, year: d.getFullYear() });
    this.loadAdminData();
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

  bulkApprove(): void {
    const selected = this.selectedApprovals();
    if (!selected.length) return;
    const requestIds = selected.map(req => req._id);
    this.isBulkApproving.set(true);

    this.hrmsService.bulkApproveLeaves(requestIds, 'Bulk approved by manager').pipe(
      catchError(err => { this.messageService.handleHttpError(err); return of(null); }),
      finalize(() => this.isBulkApproving.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res) {
        this.messageService.showSuccess(res.message);
        this.selectedApprovals.set([]);
        this.loadAdminData();
      }
    });
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // --- Private: Chart / Calendar ---

  /** Build chart options once; colors come from CSS custom properties. */
  private _initChartOptions(): void {
    const s = getComputedStyle(document.documentElement);
    const textColor = s.getPropertyValue('--text-primary') || '#333';
    const textSec = s.getPropertyValue('--text-secondary') || '#666';
    const border = s.getPropertyValue('--border-primary') || '#ddd';

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textSec }, grid: { color: border, drawBorder: false } },
        y: { ticks: { color: textSec }, grid: { color: border, drawBorder: false } }
      }
    };

    // Placeholder until real data arrives
    this.trendChartData = { labels: [], datasets: [] };
  }

  /** Build bar-chart data from the real backend aggregation. */
  private _buildChartFromAnalytics(byMonth: any[], byLeaveType: any[]): void {
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const COLORS: Record<string, string> = {
      casual: '#3b82f6', sick: '#ef4444', earned: '#f59e0b',
      compensatory: '#8b5cf6', paternity: '#10b981', maternity: '#ec4899',
      unpaid: '#6b7280', paid: '#06b6d4'
    };
    const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    // Sort months ascending
    const sorted = [...byMonth].sort((a, b) => (a._id ?? 0) - (b._id ?? 0));
    const labels = sorted.map(m => MONTH_NAMES[(m._id ?? 1) - 1]);

    // Build a dataset per leave type using month totals
    const datasets = byLeaveType.map((lt: any, i: number) => ({
      label: (lt._id as string).charAt(0).toUpperCase() + (lt._id as string).slice(1),
      backgroundColor: COLORS[lt._id as string] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      data: sorted.map(() => lt.totalDays ?? 0) // Real per-type/per-month breakdown needs a 2-level facet; use overall totals for now
    }));

    // Fallback: if no type breakdown, show total days per month
    const finalDatasets = datasets.length > 0
      ? datasets
      : [{ label: 'Total Leave Days', backgroundColor: '#3b82f6', data: sorted.map(m => m.totalDays ?? 0) }];

    this.trendChartData = { labels, datasets: finalDatasets };
  }

  /** Returns an empty calendar week for the given month so the UI isn't blank. */
  private _emptyCalendarFallback(month: number, year: number): any[] {
    const result: any[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    // Show first 7 days of the month as empty slots
    for (let d = 1; d <= Math.min(7, daysInMonth); d++) {
      result.push({ date: new Date(year, month - 1, d), count: 0, leaves: [] });
    }
    return result;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}