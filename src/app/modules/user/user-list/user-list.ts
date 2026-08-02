import { ChangeDetectorRef, Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// --- PrimeNG ---
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { AppMessageService } from '../../../core/services/message.service';
import { UserManagementService } from '../user-management.service';
import { finalize, Subject } from 'rxjs';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
import { takeUntil } from "rxjs/operators";
import { PermissionService } from '@core/auth/services/permission.service';
import { MasterDropdownService } from '../../../core/services/master-dropdown.service';

// --- Shared UI ---
import { PageComponent } from '../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../shared/ui/layout/page-content/page-content.component';
import { DataGridComponent, GridColumn, GridRowAction, GridPageState, GridFilterState, GridSortState } from '../../../shared/ui/grid';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    HasPermissionDirective,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    DataGridComponent
  ],
  providers: [UserManagementService, ConfirmationService],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private dynamicDialog = inject(DynamicDialogServices);
  private permissionService = inject(PermissionService);
  private masterDropdownService = inject(MasterDropdownService);

  // Pagination & Data state
  currentPage = 1;
  isLoading = false;
  totalCount = 0;
  pageSize = 50;
  data: any[] = [];
  column: GridColumn[] = [];
  rowActions: GridRowAction[] = [];

  userFilter = {
    role: null,
    branchId: null,
    search: '',
    sortField: '',
    sortOrder: 1
  };

  ngOnInit(): void {
    this.setupColumns();
    this.setupActions();
    this.getData(true);
    this.loadMasters();
  }

  loadMasters() {
    this.masterDropdownService.getDropdownData('roles').pipe(takeUntil(this.destroy$)).subscribe(res => {
      const col = this.column.find(c => c.field === 'role');
      if (col) col.options = res.data || [];
    });
    this.masterDropdownService.getDropdownData('departments').pipe(takeUntil(this.destroy$)).subscribe(res => {
      const col = this.column.find(c => c.field === 'employee.departmentId');
      if (col) col.options = res.data || [];
    });
    this.masterDropdownService.getDropdownData('designations').pipe(takeUntil(this.destroy$)).subscribe(res => {
      const col = this.column.find(c => c.field === 'employee.designationId');
      if (col) col.options = res.data || [];
    });
  }

  createNew() {
    this.router.navigate(['/user/create']);
  }

  openExportDialog() {
    this.dynamicDialog.openUserExport();
  }

  // Grid Event Handlers
  onPageChange(event: GridPageState) {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.getData(false);
  }

  onFilterChange(filters: GridFilterState[]) {
    // Map grid filters to our API fields if necessary
    this.userFilter.role = filters.find(f => f.field === 'role.name')?.value || null;
    this.userFilter.branchId = filters.find(f => f.field === 'branchId.name')?.value || null;
    this.getData(true);
  }

  onSortChange(sort: GridSortState[]) {
    if (sort.length > 0) {
      this.userFilter.sortField = sort[0].field;
      this.userFilter.sortOrder = sort[0].direction === 'asc' ? 1 : -1;
    } else {
      this.userFilter.sortField = '';
      this.userFilter.sortOrder = 1;
    }
    this.getData(true);
  }

  onSearchChange(query: string) {
    this.userFilter.search = query;
    this.getData(true);
  }

  onRowClick(row: any) {
    this.router.navigate(['/user/details', row._id]);
  }

  onRefresh() {
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.userFilter.role) params.role = this.userFilter.role;
    if (this.userFilter.branchId) params.branchId = this.userFilter.branchId;
    if (this.userFilter.search) params.search = this.userFilter.search;
    if (this.userFilter.sortField) {
      params.sortField = this.userFilter.sortField;
      params.sortOrder = this.userFilter.sortOrder;
    }

    this.userService.getAllUsers(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }), takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          const newData = res.data?.data || [];
          const pagination = res.data?.pagination;

          if (pagination) {
            this.totalCount = pagination.totalResults;
          } else {
            this.totalCount = res.results || this.totalCount;
          }

          this.data = newData;
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  private deleteUser(id: string, userName: string) {
    this.confirmationService.confirm({
      message: `Are you sure you want to permanently delete user <b>${userName}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () => {
        this.userService.deleteUser(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.messageService.showSuccess('User removed successfully.');
            this.getData(true);
          },
          error: (err) => {
            this.messageService.handleHttpError(err);
          }
        });
      }
    });
  }

  setupActions(): void {
    this.rowActions = [
      {
        id: 'view',
        icon: 'pi pi-eye',
        label: 'View Profile',
        permission: this.PERMISSIONS.USER.READ,
        callback: (row: any) => this.router.navigate(['/user/details', row._id])
      },
      {
        id: 'edit',
        icon: 'pi pi-pencil',
        label: 'Edit User',
        permission: this.PERMISSIONS.USER.MANAGE,
        callback: (row: any) => this.router.navigate(['/user/edit', row._id])
      },
      {
        id: 'security',
        icon: 'pi pi-shield',
        label: 'Security Settings',
        permission: this.PERMISSIONS.USER.MANAGE,
        callback: (row: any) => {
          this.dynamicDialog.openUserStatus(row)?.onClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
            if (result) this.getData(true);
          });
        }
      },
      {
        id: 'delete',
        icon: 'pi pi-trash',
        label: 'Delete User',
        variant: 'danger',
        permission: this.PERMISSIONS.USER.MANAGE,
        callback: (row: any) => this.deleteUser(row._id, row.name)
      }
    ];
  }

  setupColumns(): void {
    const isPrivileged = this.permissionService.isOwner() || this.permissionService.isSuperAdmin() || this.permissionService.hasPermission(this.PERMISSIONS.USER.MANAGE);

    const baseColumns: GridColumn[] = [
      {
        field: 'avatar',
        header: 'Avatar',
        type: 'avatar',
        width: '60px',
        pinned: 'left',
        sortable: false,
        filterable: false,
        searchable: false,
        editable: false,
      },
      {
        field: 'employee.employeeId',
        header: 'Emp ID',
        type: 'text',
        width: '100px',
        filterable: true,
        searchable: true,
        editable: false,
      },
      {
        field: 'name',
        header: 'Employee Name',
        type: 'text',
        width: '180px',
        pinned: 'left',
        sortable: true,
        filterable: true,
        searchable: true,
        editable: false,
        cellClass: 'font-semibold text-[var(--text-primary)]'
      },
      {
        field: 'role',
        header: 'Role',
        type: 'select',
        width: '140px',
        filterable: true,
        searchable: true,
        editable: true,
        formatter: (val: any) => typeof val === 'object' ? val?.name : (this.column.find(c => c.field === 'role')?.options?.find(o => o.value === val)?.label || val)
      },
      {
        field: 'employee.departmentId',
        header: 'Department',
        type: 'select',
        width: '140px',
        filterable: true,
        searchable: true,
        editable: true,
        formatter: (val: any) => typeof val === 'object' ? val?.name : (this.column.find(c => c.field === 'employee.departmentId')?.options?.find(o => o.value === val)?.label || val)
      },
      {
        field: 'employee.designationId',
        header: 'Designation',
        type: 'select',
        width: '140px',
        filterable: true,
        searchable: true,
        editable: true,
        formatter: (val: any) => typeof val === 'object' ? val?.title : (this.column.find(c => c.field === 'employee.designationId')?.options?.find(o => o.value === val)?.label || val)
      },
      {
        field: 'employee.workMode',
        header: 'Work Mode',
        type: 'select',
        width: '110px',
        filterable: true,
        editable: true,
        options: [
          { label: 'Office', value: 'office' },
          { label: 'Remote', value: 'remote' },
          { label: 'Hybrid', value: 'hybrid' }
        ],
        formatter: (val: any) => val ? val.charAt(0).toUpperCase() + val.slice(1) : ''
      },
      {
        field: 'attendanceConfig.shiftId.name',
        header: 'Shift Name',
        type: 'text',
        width: '140px',
        filterable: false,
        editable: false,
        formatter: (value: any, row: any) => {
          if (!row.attendanceConfig?.isAttendanceEnabled) return 'Disabled';
          return value || 'Assign Shift';
        }
      },
      {
        field: 'branchId.name',
        header: 'Branch',
        type: 'text',
        width: '120px',
        filterable: true,
        editable: false,
        formatter: (value: any) => value || 'Global'
      }
    ];

    if (isPrivileged) {
      baseColumns.push(
        {
          field: 'email',
          header: 'Email',
          type: 'email',
          width: '200px',
          filterable: true,
          searchable: true,
          editable: false,
        },
        {
          field: 'phone',
          header: 'Phone',
          type: 'phone',
          width: '130px',
          filterable: true,
          searchable: true,
          editable: false,
        },
        {
          field: 'isLoginBlocked',
          header: 'Security',
          type: 'status',
          width: '100px',
          sortable: false,
          filterable: true,
          editable: false,
          formatter: (value: any) => value ? 'Blocked' : 'Active'
        }
      );
    }

    this.column = baseColumns;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
