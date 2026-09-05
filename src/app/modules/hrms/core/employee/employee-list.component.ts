import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { SelectFilterComponent, SelectFilterOption } from '@shared/ui/filters/select-filter.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';
import {
  DeactivateEmployeeDto,
  Employee,
  HRMSService,
  InviteUserDto,
} from '../../hrms.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    SearchFilterComponent,
    SelectFilterComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        title="Employee Directory"
        subtitle="Canonical employee records, organizational roles, and identity links">
        <div header-right class="flex items-center gap-2 flex-wrap">
          <app-search-filter
            [value]="filter().search"
            (valueChange)="onSearchChange($event)"
            placeholder="Search name, code, email, phone...">
          </app-search-filter>

          <app-select-filter
            [options]="departmentOptions()"
            [value]="filter().departmentId"
            (valueChange)="updateFilter('departmentId', $event)"
            placeholder="Department">
          </app-select-filter>

          <app-select-filter
            [options]="statusOptions"
            [value]="filter().status"
            (valueChange)="updateFilter('status', $event)"
            placeholder="Status">
          </app-select-filter>

          <app-select-filter
            [options]="typeOptions"
            [value]="filter().employmentType"
            (valueChange)="updateFilter('employmentType', $event)"
            placeholder="Employment">
          </app-select-filter>

          <p-button
            icon="pi pi-refresh"
            [text]="true"
            severity="secondary"
            pTooltip="Reset Filters"
            (onClick)="resetFilters()">
          </p-button>

          <div class="w-px h-7 bg-[var(--border-primary)] mx-1 hidden sm:block"></div>

          <span class="total-badge">{{ totalCount() }} Employees</span>

          <p-button
            label="Onboard Employee"
            icon="pi pi-user-plus"
            (onClick)="createNew()">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <app-data-grid
          [columns]="columns"
          [data]="data()"
          [loading]="isLoading()"
          [rowActions]="rowActions"
          (gridEvent)="eventFromGrid($event)">
        </app-data-grid>
      </app-page-content>
    </app-page>

    <!-- Provision / Invite User Dialog -->
    <p-dialog
      header="Provision Login Access"
      [(visible)]="showInviteDialog"
      [modal]="true"
      [style]="{ width: '440px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-[var(--text-secondary)] m-0">
          Create system credentials and link a user account to
          <strong class="text-[var(--text-primary)]">{{ selectedEmployee()?.displayName || selectedEmployee()?.employeeId }}</strong>.
        </p>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            pInputText
            [(ngModel)]="inviteForm.name"
            placeholder="e.g. Jane Doe"
            class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Login Email</label>
          <input
            type="email"
            pInputText
            [(ngModel)]="inviteForm.email"
            placeholder="user@organization.com"
            class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Phone (Optional)</label>
          <input
            type="text"
            pInputText
            [(ngModel)]="inviteForm.phone"
            placeholder="+91..."
            class="w-full" />
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showInviteDialog.set(false)"></p-button>
          <p-button
            label="Send Invite & Link"
            icon="pi pi-send"
            [loading]="isProcessingAction()"
            (onClick)="submitInviteUser()">
          </p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Deactivate / Offboard Dialog -->
    <p-dialog
      header="Offboard / Deactivate Employee"
      [(visible)]="showDeactivateDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <div class="p-3 rounded-lg bg-[var(--danger-light,#fee2e2)] border border-[var(--danger-border,#fca5a5)] text-[var(--danger-dark,#991b1b)] text-xs flex gap-2 items-start">
          <i class="pi pi-exclamation-triangle mt-0.5 text-base"></i>
          <div>
            <strong>Warning:</strong> Deactivating will transition this employee record to inactive status, return assigned equipment, and optionally revoke system login access.
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Date of Exit</label>
          <input
            type="date"
            pInputText
            [(ngModel)]="deactivateForm.dateOfExit"
            class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Exit Reason</label>
          <textarea
            pInputText
            [(ngModel)]="deactivateForm.exitReason"
            placeholder="Reason for resignation, termination, or retirement..."
            rows="3"
            class="w-full"></textarea>
        </div>

        <label class="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            [(ngModel)]="deactivateForm.disableLoginAccess"
            class="rounded border-[var(--border-primary)] text-[var(--primary-color)] focus:ring-0" />
          <span class="text-sm text-[var(--text-primary)] font-medium">Disable associated login account</span>
        </label>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showDeactivateDialog.set(false)"></p-button>
          <p-button
            label="Confirm Deactivation"
            icon="pi pi-user-minus"
            severity="danger"
            [loading]="isProcessingAction()"
            (onClick)="submitDeactivate()">
          </p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }
    .total-badge {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--text-secondary);
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius);
      white-space: nowrap;
    }
  `]
})
export class EmployeeListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hrmsService = inject(HRMSService);
  private readonly masterDropdownService = inject(MasterDropdownService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);

  private readonly searchSubject = new Subject<string>();
  private currentPage = 1;
  private readonly pageSize = 50;

  readonly isLoading = signal(false);
  readonly isProcessingAction = signal(false);
  readonly data = signal<Employee[]>([]);
  readonly totalCount = signal(0);

  private readonly departmentMap = new Map<string, string>();
  private readonly designationMap = new Map<string, string>();

  readonly showInviteDialog = signal(false);
  readonly showDeactivateDialog = signal(false);
  readonly selectedEmployee = signal<Employee | null>(null);

  readonly departmentOptions = signal<SelectFilterOption[]>([
    { label: 'All Departments', value: null }
  ]);

  readonly filter = signal({
    search: '',
    departmentId: null as string | null,
    status: null as string | null,
    employmentType: null as string | null,
  });

  readonly statusOptions: SelectFilterOption[] = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Probation', value: 'probation' },
    { label: 'Notice Period', value: 'notice_period' },
    { label: 'Relieved', value: 'relieved' },
    { label: 'Terminated', value: 'terminated' },
    { label: 'Inactive', value: 'inactive' },
  ];

  readonly typeOptions: SelectFilterOption[] = [
    { label: 'All Types', value: null },
    { label: 'Permanent', value: 'permanent' },
    { label: 'Contract', value: 'contract' },
    { label: 'Intern', value: 'intern' },
    { label: 'Probation', value: 'probation' },
    { label: 'Consultant', value: 'consultant' },
  ];

  inviteForm: InviteUserDto = {
    name: '',
    email: '',
    phone: '',
  };

  deactivateForm: DeactivateEmployeeDto & { dateOfExitStr?: string } = {
    dateOfExit: new Date().toISOString().substring(0, 10),
    exitReason: '',
    disableLoginAccess: true,
  };

  readonly columns: GridColumn[] = [
    {
      field: 'employeeId',
      header: 'Employee',
      minWidth: '240px',
      sortable: true,
      formatter: (_v: any, row: Employee) => {
        const userObj = typeof row.user === 'object' && row.user !== null ? (row.user as any) : null;
        const name = row.displayName || [row.firstName, row.lastName].filter(Boolean).join(' ') || userObj?.name || (row.officialEmail ? row.officialEmail.split('@')[0] : null) || row.employeeId || 'Employee';
        const code = row.employeeId || (userObj?._id ? `EMP-${userObj._id.slice(-4).toUpperCase()}` : '—');
        const hasLogin = !!row.user;
        const loginTag = hasLogin
          ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ml-2">User Linked</span>'
          : '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 ml-2">No Login</span>';
        return `
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-[var(--primary-color)] text-white font-bold text-xs flex items-center justify-center shrink-0">
              ${name.charAt(0).toUpperCase()}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-semibold text-[var(--text-primary)] text-sm truncate flex items-center">
                ${name} ${loginTag}
              </span>
              <span class="text-xs text-[var(--text-secondary)] font-mono">${code}</span>
            </div>
          </div>
        `;
      },
    },
    {
      field: 'departmentId',
      header: 'Department & Role',
      minWidth: '200px',
      formatter: (_v: any, row: Employee) => {
        let dept = '—';
        if (typeof row.departmentId === 'object' && row.departmentId !== null) {
          dept = (row.departmentId as any).name || '—';
        } else if (typeof row.departmentId === 'string' && row.departmentId) {
          dept = this.departmentMap.get(row.departmentId) || (!/^[0-9a-fA-F]{24}$/.test(row.departmentId) ? row.departmentId : '—');
        }

        let desig = '—';
        if (typeof row.designationId === 'object' && row.designationId !== null) {
          desig = (row.designationId as any).title || '—';
        } else if (typeof row.designationId === 'string' && row.designationId) {
          desig = this.designationMap.get(row.designationId) || (!/^[0-9a-fA-F]{24}$/.test(row.designationId) ? row.designationId : '—');
        }

        const deptLabel = dept !== '—' ? dept : 'General Department';
        const desigLabel = desig !== '—' ? desig : 'Staff Member';

        return `
          <div class="flex flex-col">
            <span class="font-medium text-[var(--text-primary)] text-xs truncate">${deptLabel}</span>
            <span class="text-[11px] text-[var(--text-secondary)] truncate">${desigLabel}</span>
          </div>
        `;
      },
    },
    {
      field: 'officialEmail',
      header: 'Official Contact',
      minWidth: '190px',
      formatter: (_v: any, row: Employee) => {
        const userObj = typeof row.user === 'object' && row.user !== null ? (row.user as any) : null;
        const email = row.officialEmail || userObj?.email || '—';
        const phone = row.phone || userObj?.phone || '';
        return `
          <div class="flex flex-col">
            <span class="text-xs text-[var(--text-primary)] truncate">${email}</span>
            ${phone ? `<span class="text-[11px] text-[var(--text-secondary)] font-mono">${phone}</span>` : ''}
          </div>
        `;
      },
    },
    {
      field: 'employmentType',
      header: 'Type',
      width: '120px',
      type: 'badge',
      formatter: (v: string) => {
        if (!v) return 'Permanent';
        return v.charAt(0).toUpperCase() + v.slice(1);
      },
    },
    {
      field: 'workMode',
      header: 'Mode',
      width: '100px',
      type: 'badge',
      formatter: (v: string) => {
        if (!v) return 'Office';
        return v.charAt(0).toUpperCase() + v.slice(1);
      },
    },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      type: 'badge',
      formatter: (v: string) => {
        if (!v) return 'Active';
        return v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      },
    },
    {
      field: 'dateOfJoining',
      header: 'Joined',
      width: '120px',
      formatter: (v: any) => {
        if (!v) return '—';
        try {
          return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
          return '—';
        }
      },
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'workspace',
      icon: 'pi pi-id-card',
      tooltip: 'Employee Workspace 360',
      variant: 'primary',
      callback: (row: Employee) => this.router.navigate(['/hrms/employees/workspace', row._id]),
    },
    {
      id: 'edit',
      icon: 'pi pi-pencil',
      tooltip: 'Edit Record',
      variant: 'ghost',
      callback: (row: Employee) => this.router.navigate(['/hrms/employees/edit', row._id]),
    },
    {
      id: 'invite',
      icon: 'pi pi-user-plus',
      tooltip: 'Provision Login Access',
      variant: 'ghost',
      callback: (row: Employee) => this.openInviteDialog(row),
    },
    {
      id: 'deactivate',
      icon: 'pi pi-user-minus',
      tooltip: 'Offboard / Deactivate',
      variant: 'danger',
      callback: (row: Employee) => this.openDeactivateDialog(row),
    },
  ];

  ngOnInit(): void {
    this.loadDropdowns();

    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(term => {
      this.filter.update(f => ({ ...f, search: term }));
      this.getData(true);
    });

    this.getData(true);
  }

  private loadDropdowns(): void {
    this.masterDropdownService.getDropdownData('departments').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res?.data) {
        res.data.forEach(d => {
          if (d.value && d.label) this.departmentMap.set(d.value, d.label);
        });
        const opts: SelectFilterOption[] = [
          { label: 'All Departments', value: null },
          ...res.data.map(d => ({ label: d.label, value: d.value }))
        ];
        this.departmentOptions.set(opts);
      }
    });

    this.masterDropdownService.getDropdownData('designations').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res?.data) {
        res.data.forEach(d => {
          if (d.value && d.label) this.designationMap.set(d.value, d.label);
        });
      }
    });
  }

  onSearchChange(value: string): void {
    this.filter.update(f => ({ ...f, search: value }));
    this.searchSubject.next(value);
  }

  updateFilter(key: 'departmentId' | 'status' | 'employmentType', value: any): void {
    this.filter.update(f => ({ ...f, [key]: value }));
    this.getData(true);
  }

  resetFilters(): void {
    this.filter.set({
      search: '',
      departmentId: null,
      status: null,
      employmentType: null,
    });
    this.getData(true);
  }

  createNew(): void {
    this.router.navigate(['/hrms/employees/new']);
  }

  getData(isReset = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    if (isReset) {
      this.currentPage = 1;
      this.data.set([]);
      this.totalCount.set(0);
    }

    const raw = {
      ...this.filter(),
      page: this.currentPage,
      limit: this.pageSize,
    };
    const params = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null && v !== '')
    );

    this.hrmsService.getEmployees(params).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: res => {
        let employees: Employee[] = [];
        if (Array.isArray(res?.data)) {
          employees = res.data;
        } else if (Array.isArray(res?.data?.employees)) {
          employees = res.data.employees;
        } else if (Array.isArray((res as any)?.employees)) {
          employees = (res as any).employees;
        }
        this.totalCount.set(res?.pagination?.totalResults ?? res?.results ?? employees.length);
        this.data.update(prev => isReset ? employees : [...prev, ...employees]);
        if (employees.length > 0) {
          this.currentPage++;
        }
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'cellClicked' && event.row?._id) {
      this.router.navigate(['/hrms/employees/workspace', event.row._id]);
    }
    if (event.type === 'reachedBottom' && this.data().length < this.totalCount()) {
      this.getData(false);
    }
  }

  openInviteDialog(employee: Employee): void {
    if (employee.user) {
      this.messageService.showInfo('This employee already has a linked login account.');
      return;
    }
    this.selectedEmployee.set(employee);
    this.inviteForm = {
      name: employee.displayName || [employee.firstName, employee.lastName].filter(Boolean).join(' ') || '',
      email: employee.officialEmail || '',
      phone: employee.phone || '',
    };
    this.showInviteDialog.set(true);
  }

  submitInviteUser(): void {
    const emp = this.selectedEmployee();
    if (!emp?._id) return;

    if (!this.inviteForm.email || !this.inviteForm.name) {
      this.messageService.showError('Name and email are required to create a user account.');
      return;
    }

    this.isProcessingAction.set(true);
    this.hrmsService.inviteUserForEmployee(emp._id, this.inviteForm).pipe(
      finalize(() => this.isProcessingAction.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.messageService.showSuccess(res.message || 'User account provisioned successfully.');
        this.showInviteDialog.set(false);
        this.getData(true);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openDeactivateDialog(employee: Employee): void {
    this.selectedEmployee.set(employee);
    this.deactivateForm = {
      dateOfExit: new Date().toISOString().substring(0, 10),
      exitReason: '',
      disableLoginAccess: true,
    };
    this.showDeactivateDialog.set(true);
  }

  submitDeactivate(): void {
    const emp = this.selectedEmployee();
    if (!emp?._id) return;

    this.isProcessingAction.set(true);
    this.hrmsService.deactivateEmployee(emp._id, this.deactivateForm).pipe(
      finalize(() => this.isProcessingAction.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.messageService.showSuccess(res.message || 'Employee deactivated successfully.');
        this.showDeactivateDialog.set(false);
        this.getData(true);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }
}
