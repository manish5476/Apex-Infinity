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
import { HRMSService } from '../../hrms.service';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
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
    IconFieldModule,
    InputIconModule,
    InputTextModule,
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

      <app-page-content [padded]="false">
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
                  <div class="flex flex-wrap items-center justify-between gap-6 px-2">
                    <div class="flex items-center gap-6">
                      <div class="flex flex-col items-center gap-2">
                        <span class="text-xs font-medium text-[var(--text-secondary)]">Total Emp.</span>
                        <div class="stat-circle bg-primary-subtle text-primary">{{ s.totalEmployees || 0 }}</div>
                      </div>
                      <div class="w-8 h-1 bg-[var(--border-secondary)] rounded"></div>
                      <div class="flex flex-col items-center gap-2">
                        <span class="text-xs font-medium text-[var(--text-secondary)]">Total Absent</span>
                        <div class="stat-circle bg-danger-subtle text-danger">{{ s.totalAbsent || 0 }}</div>
                      </div>
                      <div class="w-8 h-1 bg-[var(--border-secondary)] rounded"></div>
                      <div class="flex flex-col items-center gap-2">
                        <span class="text-xs font-medium text-[var(--text-secondary)]">Total Late</span>
                        <div class="stat-circle bg-warning-subtle text-warning-dark">{{ s.totalLate || 0 }}</div>
                      </div>
                      <div class="w-8 h-1 bg-[var(--border-secondary)] rounded"></div>
                      <div class="flex flex-col items-center gap-2">
                        <span class="text-xs font-medium text-[var(--text-secondary)]">Half Days</span>
                        <div class="stat-circle bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)]">{{ s.totalHalfDay || 0 }}</div>
                      </div>
                    </div>

                    <div class="flex items-center gap-6">
                      <div class="flex flex-col items-center gap-2">
                        <span class="text-xs font-medium text-[var(--text-secondary)]">Avg Attendance</span>
                        <div class="stat-pill bg-success-subtle text-success">{{ s.avgAttendancePercentage || 0 }}%</div>
                      </div>
                      <div class="flex flex-col items-center gap-2">
                        <span class="text-xs font-medium text-[var(--text-secondary)]">Total Work Hours</span>
                        <div class="stat-pill bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)]">{{ s.totalWorkHours || 0 }}h</div>
                      </div>
                    </div>
                  </div>
                }

                <div class="flex justify-between items-center mt-2">
                  <h3 class="font-bold text-lg text-[var(--text-primary)] m-0">Generated Report</h3>
                  <p-iconField iconPosition="left">
                    <p-inputIcon styleClass="pi pi-search text-[var(--text-tertiary)]"></p-inputIcon>
                    <input type="text" pInputText placeholder="Search records..." [(ngModel)]="attendanceSearch" class="w-[20rem]" />
                  </p-iconField>
                </div>

                <div class="flex-1 min-h-[450px]">
                  <app-data-grid [viewOnly]="true" 
                    [columns]="attendanceColumns"
                    [data]="filteredAttendanceReportData()"
                    [loading]="isLoadingReport()">
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
                  <div class="flex items-center gap-6 px-2">
                    <div class="flex flex-col items-center gap-2">
                      <span class="text-xs font-medium text-[var(--text-secondary)]">Total Employees</span>
                      <div class="stat-circle bg-primary-subtle text-primary">{{ summary.totalEmployees || 0 }}</div>
                    </div>
                    <div class="w-8 h-1 bg-[var(--border-secondary)] rounded"></div>
                    <div class="flex flex-col items-center gap-2">
                      <span class="text-xs font-medium text-[var(--text-secondary)]">Total Enterprise Liability</span>
                      <div class="stat-pill bg-danger-subtle text-danger font-bold">{{ summary.totalLeaveBalance || 0 }} Days</div>
                    </div>
                  </div>
                }

                <div class="flex justify-between items-center mt-2">
                  <h3 class="font-bold text-lg text-[var(--text-primary)] m-0">Leave Balances</h3>
                  <p-iconField iconPosition="left">
                    <p-inputIcon styleClass="pi pi-search text-[var(--text-tertiary)]"></p-inputIcon>
                    <input type="text" pInputText placeholder="Search employees..." [(ngModel)]="leaveSearch" class="w-[20rem]" />
                  </p-iconField>
                </div>

                <div class="flex-1 min-h-[450px]">
                  <app-data-grid [viewOnly]="true" 
                    [columns]="leaveColumns"
                    [data]="filteredLeaveReportData()"
                    [loading]="isLoadingLeave()">
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
    }
    ::ng-deep .p-tabpanel { padding: 0 !important; display: flex; flex-direction: column; flex: 1; min-height: 0; }
    ::ng-deep .p-tabs { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    ::ng-deep .p-tabpanels { padding: var(--spacing-lg) !important; flex: 1; min-height: 0; overflow-y: auto; background-color: var(--bg-secondary); }

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
  private readonly messageService = inject(AppMessageService);

  dateRange: Date[] | null = null;
  departments = [
    { label: 'Administration', value: '69eef9935011d1bea4120a26' },
    { label: 'Engineering', value: 'dept_eng' }
  ];
  selectedDept: string | null = null;
  financialYears = [
    { label: '2023-2024', value: '2023-2024' },
    { label: '2024-2025', value: '2024-2025' }
  ];
  selectedFy = '2024-2025';

  readonly isLoadingReport = signal(false);
  readonly attendanceReportData = signal<any[]>([]);
  readonly attendanceSummary = signal<any>(null);
  
  attendanceSearch = signal('');
  readonly filteredAttendanceReportData = computed(() => {
    const data = this.attendanceReportData();
    const search = this.attendanceSearch().toLowerCase();
    if (!search) return data;
    return data.filter(r => 
      (r.employeeName ?? '').toLowerCase().includes(search) || 
      (r.departmentName ?? '').toLowerCase().includes(search) ||
      (r.employeeId ?? '').toLowerCase().includes(search)
    );
  });

  readonly isLoadingLeave = signal(false);
  readonly leaveReportData = signal<any[]>([]);
  readonly leaveReportSummary = signal<any>(null);

  leaveSearch = signal('');
  readonly filteredLeaveReportData = computed(() => {
    const data = this.leaveReportData();
    const search = this.leaveSearch().toLowerCase();
    if (!search) return data;
    return data.filter(r => 
      (r.user?.name ?? '').toLowerCase().includes(search) || 
      (r.department?.name ?? '').toLowerCase().includes(search)
    );
  });

  readonly attendanceColumns: GridColumn[] = [
    {
      field: 'employeeName', header: 'Employee', minWidth: '250px', sticky: 'left', sortable: true,
      formatter: (_v: any, row: any) => `${row?.employeeName || 'Unknown'} (EMP ID: ${row?.employeeId || 'N/A'})`
    },
    { field: 'departmentName', header: 'Department', width: '180px', sortable: true },
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
      field: 'user.name', header: 'Employee', minWidth: '250px', sticky: 'left', sortable: true,
      formatter: (_v: any, row: any) => row?.user?.name || 'Unknown'
    },
    {
      field: 'department.name', header: 'Department', width: '200px', sortable: true,
      formatter: (_v: any, row: any) => row?.department?.name || 'N/A'
    },
    {
      field: 'clRemaining', header: 'CL Remaining', width: '140px', align: 'center',
      formatter: (_v: any, row: any) => String((row?.casualLeave?.total || 0) - (row?.casualLeave?.used || 0))
    },
    {
      field: 'slRemaining', header: 'SL Remaining', width: '140px', align: 'center',
      formatter: (_v: any, row: any) => String((row?.sickLeave?.total || 0) - (row?.sickLeave?.used || 0))
    },
    {
      field: 'elRemaining', header: 'EL Remaining', width: '140px', align: 'center',
      formatter: (_v: any, row: any) => String((row?.earnedLeave?.total || 0) - (row?.earnedLeave?.used || 0))
    },
    {
      field: 'availableLeaves.total', header: 'Total Liability', width: '160px', align: 'right', sticky: 'right', type: 'badge',
      formatter: (v: any) => String(v || 0)
    }
  ];

  ngOnInit(): void {
    this.dateRange = [new Date(2026, 4, 31), new Date(2026, 5, 29)];
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

