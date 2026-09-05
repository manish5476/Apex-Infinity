import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import { AppMessageService } from '@core/services/message.service';
import { MasterDropdownService } from '@core/services/master-dropdown.service';
import { HRMSService } from '../../hrms.service';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    TabsModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        title="Attendance & Leave Reports"
        subtitle="Consolidated analytics for enterprise attendance tracking and leave liability">
      </app-page-header>

      <app-page-content [padded]="false" class="pl-6 sm:pl-8 pr-4 sm:pr-6 pb-6 flex-1 flex flex-col min-h-0">
        <p-tabs value="0" class="flex-1 flex flex-col min-h-0">
          <p-tablist>
            <p-tab value="0">
              <i class="pi pi-calendar-times mr-2"></i> Attendance Report
            </p-tab>
            <p-tab value="1">
              <i class="pi pi-briefcase mr-2"></i> Leave Liability
            </p-tab>
          </p-tablist>

          <p-tabpanels class="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-secondary)] p-4">
            
            <!-- TAB 0: ATTENDANCE REPORT -->
            <p-tabpanel value="0">
              <div class="flex flex-col gap-4 h-full">
                <!-- Filter Bar -->
                <div class="flex flex-wrap items-end gap-4 p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--ui-border-radius)] shadow-sm">
                  <div class="flex flex-col gap-1 w-full max-w-[15rem]">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Date Period</label>
                    <p-datepicker
                      [(ngModel)]="dateRange"
                      selectionMode="range"
                      [readonlyInput]="true"
                      dateFormat="dd M yy"
                      appendTo="body"
                      placeholder="Select Date Range"
                      styleClass="w-full">
                    </p-datepicker>
                  </div>
                  
                  <div class="flex flex-col gap-1 w-full max-w-[15rem]">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Department</label>
                    <p-select
                      [options]="departments"
                      [(ngModel)]="selectedDept"
                      [showClear]="true"
                      appendTo="body"
                      placeholder="All Departments"
                      [filter]="true"
                      filterBy="label"
                      styleClass="w-full">
                    </p-select>
                  </div>
                  
                  <p-button
                    label="Generate"
                    icon="pi pi-bolt"
                    [loading]="isLoadingReport()"
                    (onClick)="loadAttendanceReport()">
                  </p-button>
                </div>

                <!-- Aggregated Stats Bar -->
                @if (attendanceSummary(); as s) {
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div class="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                      <span class="text-xs text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Total Emp</span>
                      <div class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ s.totalEmployees || 0 }}</div>
                    </div>
                    <div class="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                      <span class="text-xs text-rose-600 font-semibold uppercase tracking-wider">Total Absent</span>
                      <div class="text-xl font-bold text-rose-600 mt-1">{{ s.totalAbsent || 0 }}</div>
                    </div>
                    <div class="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                      <span class="text-xs text-amber-600 font-semibold uppercase tracking-wider">Total Late</span>
                      <div class="text-xl font-bold text-amber-600 mt-1">{{ s.totalLate || 0 }}</div>
                    </div>
                    <div class="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                      <span class="text-xs text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Half Days</span>
                      <div class="text-xl font-bold text-[var(--text-secondary)] mt-1">{{ s.totalHalfDay || 0 }}</div>
                    </div>
                    <div class="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                      <span class="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Avg Attendance</span>
                      <div class="text-xl font-bold text-emerald-600 mt-1">{{ s.avgAttendancePercentage || 0 }}%</div>
                    </div>
                    <div class="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                      <span class="text-xs text-blue-600 font-semibold uppercase tracking-wider">Work Hours</span>
                      <div class="text-xl font-bold text-blue-600 mt-1">{{ s.totalWorkHours || 0 }}h</div>
                    </div>
                  </div>
                }

                <div class="flex-1 min-h-[480px] flex flex-col w-full">
                  <app-data-grid [viewOnly]="true" 
                    [pagination]="true"
                    [enableExport]="true"
                    [columns]="attendanceColumns"
                    [data]="attendanceReportData()"
                    [loading]="isLoadingReport()"
                    class="flex-1 min-h-[480px] w-full">
                  </app-data-grid>
                </div>
              </div>
            </p-tabpanel>

            <!-- TAB 1: LEAVE LIABILITY -->
            <p-tabpanel value="1">
              <div class="flex flex-col gap-4 h-full">
                
                <!-- Filter Bar -->
                <div class="flex flex-wrap items-end gap-4 p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--ui-border-radius)] shadow-sm">
                  <div class="flex flex-col gap-1 w-full max-w-[15rem]">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Financial Year</label>
                    <p-select
                      [options]="financialYears"
                      [(ngModel)]="selectedFy"
                      appendTo="body"
                      [filter]="true"
                      filterBy="label"
                      styleClass="w-full">
                    </p-select>
                  </div>
                  <p-button
                    label="Fetch Liability"
                    icon="pi pi-chart-pie"
                    [loading]="isLoadingLeave()"
                    (onClick)="loadLeaveReport()">
                  </p-button>
                </div>

                @if (leaveReportSummary(); as summary) {
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <div class="p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xs flex items-center justify-between">
                      <div>
                        <span class="text-xs text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Total Employees</span>
                        <div class="text-2xl font-bold text-[var(--text-primary)] mt-1">{{ summary.totalEmployees || 0 }}</div>
                      </div>
                      <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                        <i class="pi pi-users text-lg"></i>
                      </div>
                    </div>
                    <div class="p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xs flex items-center justify-between">
                      <div>
                        <span class="text-xs text-rose-600 font-semibold uppercase tracking-wider">Enterprise Liability</span>
                        <div class="text-2xl font-bold text-rose-600 mt-1">{{ summary.totalLeaveBalance || 0 }} Days</div>
                      </div>
                      <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                        <i class="pi pi-briefcase text-lg"></i>
                      </div>
                    </div>
                  </div>
                }

                <div class="flex-1 min-h-[480px] flex flex-col w-full">
                  <app-data-grid [viewOnly]="true" 
                    [pagination]="true"
                    [enableExport]="true"
                    [columns]="leaveColumns"
                    [data]="leaveReportData()"
                    [loading]="isLoadingLeave()"
                    class="flex-1 min-h-[480px] w-full">
                  </app-data-grid>
                </div>
              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </app-page-content>
    </app-page>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; height: 100%; }
    
    ::ng-deep .p-tablist {
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-primary);
      padding-left: 0.5rem;
    }
    ::ng-deep .p-tabpanel { padding: 0 !important; display: flex; flex-direction: column; flex: 1; min-height: 0; }
    ::ng-deep .p-tabs { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    ::ng-deep .p-tabpanels { padding: var(--spacing-lg) 0.5rem !important; flex: 1; min-height: 0; overflow-y: auto; background-color: var(--bg-secondary); }

    .stat-circle {
      width: 44px; height: 44px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 14px;
    }
    .stat-pill {
      padding: 0 24px; height: 44px;
      border-radius: var(--ui-border-radius-pill);
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 14px;
    }

    .bg-primary-subtle { background-color: color-mix(in srgb, var(--color-primary) 10%, transparent); }
    .text-primary { color: var(--color-primary); }
    
    .bg-danger-subtle { background-color: var(--color-error-bg); }
    .text-danger { color: var(--color-error-text); }
    
    .bg-warning-subtle { background-color: var(--color-warning-bg); }
    .text-warning-dark { color: #b45309; } /* A darker yellow for contrast */
    
    .bg-success-subtle { background-color: var(--color-success-bg); }
    .text-success { color: var(--color-success-text); }
  `]
})
export class AttendanceReportsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly hrmsService = inject(HRMSService);
  private readonly masterDropdownService = inject(MasterDropdownService);
  private readonly messageService = inject(AppMessageService);

  dateRange: Date[] | null = null;
  departments: { label: string; value: string }[] = [];
  selectedDept: string | null = null;
  financialYears: { label: string; value: string }[] = [];
  selectedFy = '';

  readonly isLoadingReport = signal(false);
  readonly attendanceReportData = signal<any[]>([]);
  readonly attendanceSummary = signal<any>(null);

  readonly isLoadingLeave = signal(false);
  readonly leaveReportData = signal<any[]>([]);
  readonly leaveReportSummary = signal<any>(null);

  readonly attendanceColumns: GridColumn[] = [
    {
      field: 'employeeName', header: 'Employee', minWidth: '250px', sticky: 'left', sortable: true,
      formatter: (_v: any, row: any) => {
        const name = row?.employeeName || 'Staff Member';
        const code = row?.employeeId || (row?._id ? `EMP-${String(row._id).slice(-4).toUpperCase()}` : '—');
        return `
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-[var(--primary-color)] text-white font-bold text-xs flex items-center justify-center shrink-0">
              ${name.charAt(0).toUpperCase()}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-semibold text-[var(--text-primary)] text-sm truncate">${name}</span>
              <span class="text-xs text-[var(--text-secondary)] font-mono">${code}</span>
            </div>
          </div>
        `;
      }
    },
    {
      field: 'departmentName', header: 'Department', width: '180px', sortable: true,
      formatter: (v: any) => v || 'General Department'
    },
    { field: 'totalDays', header: 'Total Days', width: '120px', align: 'center' },
    {
      field: 'present', header: 'Present', width: '100px', align: 'center', type: 'badge',
      formatter: (v: any) => String(v ?? 0)
    },
    {
      field: 'absent', header: 'Absent', width: '100px', align: 'center',
      formatter: (v: any) => String(v ?? 0)
    },
    {
      field: 'late', header: 'Late', width: '100px', align: 'center',
      formatter: (v: any) => String(v ?? 0)
    },
    {
      field: 'totalWorkHours', header: 'Work Hrs', width: '120px', align: 'center',
      formatter: (v: any) => `${(v || 0).toFixed(1)}h`
    },
    {
      field: 'attendancePercentage', header: 'Attendance %', width: '150px', align: 'right', sticky: 'right', type: 'badge',
      formatter: (v: any) => `${v || 0}%`
    }
  ];

  readonly leaveColumns: GridColumn[] = [
    {
      field: 'employeeName', header: 'Employee', minWidth: '250px', sticky: 'left', sortable: true,
      formatter: (_v: any, row: any) => {
        const name = row?.employeeName || row?.user?.name || row?.employeeRef?.displayName || row?.employee?.displayName || 'Employee';
        const code = row?.employeeId || (row?.userId ? `EMP-${String(row.userId).slice(-4).toUpperCase()}` : '—');
        return `
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-[var(--primary-color)] text-white font-bold text-xs flex items-center justify-center shrink-0">
              ${name.charAt(0).toUpperCase()}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-semibold text-[var(--text-primary)] text-sm truncate">${name}</span>
              <span class="text-xs text-[var(--text-secondary)] font-mono">${code}</span>
            </div>
          </div>
        `;
      }
    },
    {
      field: 'departmentName', header: 'Department & Role', width: '200px', sortable: true,
      formatter: (_v: any, row: any) => {
        const dept = row?.departmentName || row?.department?.name || 'General Department';
        const desig = row?.designationTitle || row?.designation?.title || 'Staff Member';
        return `
          <div class="flex flex-col">
            <span class="font-medium text-[var(--text-primary)] text-xs truncate">${dept}</span>
            <span class="text-[11px] text-[var(--text-secondary)] truncate">${desig}</span>
          </div>
        `;
      }
    },
    {
      field: 'casualLeave.available', header: 'CL Available', width: '130px', align: 'center', type: 'badge',
      formatter: (_v: any, row: any) => String(row?.casualLeave?.available ?? ((row?.casualLeave?.total || 0) - (row?.casualLeave?.used || 0)))
    },
    {
      field: 'sickLeave.available', header: 'SL Available', width: '130px', align: 'center', type: 'badge',
      formatter: (_v: any, row: any) => String(row?.sickLeave?.available ?? ((row?.sickLeave?.total || 0) - (row?.sickLeave?.used || 0)))
    },
    {
      field: 'earnedLeave.available', header: 'EL Available', width: '130px', align: 'center', type: 'badge',
      formatter: (_v: any, row: any) => String(row?.earnedLeave?.available ?? ((row?.earnedLeave?.total || 0) - (row?.earnedLeave?.used || 0)))
    },
    {
      field: 'totalAvailable', header: 'Total Balance', width: '150px', align: 'right', sticky: 'right', type: 'badge',
      formatter: (_v: any, row: any) => String(row?.totalAvailable ?? row?.availableLeaves?.total ?? 0)
    }
  ];

  ngOnInit(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateRange = [startOfMonth, now];

    const currentYear = now.getFullYear();
    this.financialYears = [
      { label: `${currentYear - 1}-${currentYear}`, value: `${currentYear - 1}-${currentYear}` },
      { label: `${currentYear}-${currentYear + 1}`, value: `${currentYear}-${currentYear + 1}` },
    ];
    this.selectedFy = `${currentYear}-${currentYear + 1}`;

    this.masterDropdownService.getDropdownData('departments').pipe(
      takeUntil(this.destroy$)
    ).subscribe(res => {
      if (res?.data) {
        this.departments = res.data.map(d => ({ label: d.label, value: d.value }));
      }
    });

    this.loadAttendanceReport();
    this.loadLeaveReport();
  }

  loadAttendanceReport(): void {
    if (!this.dateRange || !this.dateRange[0] || !this.dateRange[1]) {
      this.messageService.showWarn('Please select a valid date range.');
      return;
    }

    this.isLoadingReport.set(true);
    const params = {
      fromDate: this.dateRange[0],
      toDate: this.dateRange[1],
      ...(this.selectedDept && { departmentId: this.selectedDept })
    };

    this.hrmsService.getAttendanceReport(params).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err);
        return of({ data: { report: [], summary: null } });
      }),
      finalize(() => this.isLoadingReport.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      this.attendanceReportData.set(res?.data?.report || []);
      this.attendanceSummary.set(res?.data?.summary || null);
    });
  }

  loadLeaveReport(): void {
    this.isLoadingLeave.set(true);
    this.hrmsService.getLeaveBalanceReport(this.selectedFy).pipe(
      catchError(() => of({ data: { report: [], summary: null } })),
      finalize(() => this.isLoadingLeave.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      this.leaveReportData.set(res?.data?.report || []);
      this.leaveReportSummary.set(res?.data?.summary || null);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

