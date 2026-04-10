
import { ChangeDetectorRef, Component, OnInit, effect, inject, signal, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// --- PrimeNG ---
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
// 👇 Import Confirmation Service and Module
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { MasterListService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/services/message.service';
import { ImageCellRendererComponent } from '../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { AgShareGrid, ActionColumnConfig } from '../../shared/components/ag-shared-grid';
import { UserManagementService } from '../user-management.service';
import { finalize, Subject } from 'rxjs';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    AgShareGrid,
    HasPermissionDirective
],
  providers: [UserManagementService, ConfirmationService],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserListComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  readonly userActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: true,
    showDelete: true,
    viewPermission: PERMISSIONS.USER.READ,
    editPermission: PERMISSIONS.USER.MANAGE,
    deletePermission: PERMISSIONS.USER.MANAGE,
  };

  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private dynamicDialog = inject(DynamicDialogServices);

  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;
  data: any[] = [];
  column: any[] = [];
  roleOptions = signal<any[]>([]);
  branchOptions = signal<any[]>([]);
  userFilter = {
    role: null,
    branchId: null,
    search: ''
  };
  constructor() {
    effect(() => {
      this.roleOptions.set(this.masterList.roles());
      this.branchOptions.set(this.masterList.branches());
    });
  }

  ngOnInit(): void {
    this.setupColumns();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.userFilter = { role: null, branchId: null, search: '' };
    this.getData(true);
  }

  createNew() {
    this.router.navigate(['/user/create']);
  }

  openExportDialog() {
    this.dynamicDialog.openUserExport();
  }


  onScrolledToBottom() {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      const userId = event.row._id;

      // Handle direct dialog triggers on specific columns
      if (event.field === 'security') {
        this.dynamicDialog.openUserStatus(event.row)?.onClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
          if (result) this.getData(false); // Refresh row data
        });
        return;
      }

      // Navigate to details if clicking the name column
      if (event.field === 'name') {
        this.router.navigate(['/user/details', userId]);
      }
    }

    if (event.type === 'view') {
      const userId = event.row._id;
      this.router.navigate(['/user/details', userId]);
    }

    if (event.type === 'editStart') {
      const userId = event.row._id;
      this.router.navigate(['/user/edit', userId]);
    }

    if (event.type === 'delete') {
      const userId = event.row._id;
      const userName = event.row.name;


      this.confirmationService.confirm({
        message: `Are you sure you want to permanently delete user <b>${userName}</b>?`,
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonStyleClass: 'p-button-danger p-button-text',
        rejectButtonStyleClass: 'p-button-secondary p-button-text',
        accept: () => {
          this.deleteUser(userId);
        }
      });
    }

    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom();
    }
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const params = {
      ...this.userFilter,
      page: this.currentPage,
      limit: this.pageSize
    };

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

          this.data = isReset ? newData : [...this.data, ...newData];

          if (newData.length > 0) {
            this.currentPage++;
          }
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  private deleteUser(id: string) {
    // Note: Usually, you'd wrap this in a ConfirmationService call first
    this.userService.deleteUser(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.messageService.showSuccess('User removed successfully.');
        // Refresh the list from page 1
        this.getData(true);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }
  setupColumns(): void {
    this.column = [

      {
        field: 'avatar',
        headerName: '',
        cellRenderer: ImageCellRendererComponent,
        width: 60,
        pinned: 'left',
        sortable: false,
        filter: false,
        suppressMenu: true,
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      },


      {
        field: 'name',
        headerName: 'Employee Name',
        width: 180,
        pinned: 'left',
        sortable: true,
        filter: true,
        cellStyle: {
          'display': 'flex',
          'align-items': 'center',
          'font-weight': '600',
          'color': 'var(--text-primary)',
          'font-size': '13px'
        }
      },


      {
        headerName: 'Role',
        field: 'role.name',
        width: 140,
        filter: true,
        cellRenderer: (params: any) => {
          const role = params.value || 'N/A';

          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background-color: var(--bg-secondary); 
                color: var(--accent-primary); 
                padding: 1px 8px; 
                border-radius: 4px; 
                font-weight: 600; 
                font-size: 10px; 
                text-transform: uppercase; 
                border: 1px solid var(--border-secondary);
                line-height: 1.2;
                letter-spacing: 0.5px;
                white-space: nowrap;
              ">
                ${role}
              </span>
            </div>`;
        }
      },


      {
        headerName: 'Contact Info',
        width: 220,
        cellRenderer: (params: any) => {
          const email = params.data.email;
          const phone = params.data.phone ? `<span style="color:var(--text-tertiary);"> • ${params.data.phone}</span>` : '';

          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; line-height:1.2;">
              <span style="color:var(--text-secondary); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${email}</span>
              <span style="font-size:10px; color:var(--text-tertiary);">${params.data.phone || ''}</span>
            </div>
          `;
        }
      },


      {
        headerName: 'Shift Name',
        width: 160,
        cellRenderer: (params: any) => {
          const config = params.data.attendanceConfig;

          if (!config?.isAttendanceEnabled) {
            return `<div style="display:flex; align-items:center; height:100%; color:#94a3b8; font-style:italic; font-size:12px;">Disabled</div>`;
          }

          if (config.shiftId && config.shiftId.name) {
            return `<div style="display:flex; align-items:center; height:100%; font-weight:600; color:var(--text-primary); font-size:12px; text-transform:capitalize;">
                      ${config.shiftId.name}
                    </div>`;
          }

          return `<div style="display:flex; align-items:center; height:100%; color:#ef4444; font-weight:600; font-size:12px;">
                    <i class="pi pi-exclamation-circle" style="margin-right:4px; font-size:10px;"></i> Assign Shift
                  </div>`;
        }
      },


      {
        headerName: 'Timing',
        width: 140,
        cellRenderer: (params: any) => {
          const shift = params.data.attendanceConfig?.shiftId;

          if (shift && shift.startTime && shift.endTime) {
            return `
              <div style="display:flex; align-items:center; height:100%; color:var(--text-secondary); font-size:12px; font-family:var(--font-mono, monospace);">
                ${shift.startTime} - ${shift.endTime}
              </div>
            `;
          }
          return `<div style="display:flex; align-items:center; height:100%; color:var(--text-tertiary);">-</div>`;
        }
      },


      {
        headerName: 'Config',
        width: 150,
        cellRenderer: (params: any) => {
          const config = params.data.attendanceConfig || {};
          const machineId = config.machineUserId;

          if (machineId) {

            return `
              <div style="display:flex; align-items:center; height:100%;">
                <span style="
                  background:var(--bg-secondary); 
                  border:1px solid var(--border-secondary); 
                  color:var(--text-secondary); 
                  padding: 0px 6px; 
                  border-radius:4px; 
                  font-family:monospace; 
                  font-size:10px; 
                  line-height: 1.4;
                ">
                  ID: ${machineId}
                </span>
              </div>`;
          }

          const methods = [];
          if (config.allowWebPunch) methods.push('Web');
          if (config.allowMobilePunch) methods.push('App');

          return methods.length > 0
            ? `<div style="display:flex; align-items:center; height:100%; font-size:11px; color:var(--text-tertiary);">${methods.join(', ')}</div>`
            : `<div style="display:flex; align-items:center; height:100%; color:var(--text-tertiary); font-size:11px;">-</div>`;
        }
      },


      {
        headerName: 'Branch',
        field: 'branchId.name',
        width: 130,
        valueFormatter: (p: any) => p.value || 'Global',
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'color': 'var(--text-secondary)', 'font-size': '12px' }
      },

      {
        headerName: 'Safety',
        field: 'security',
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const isBlocked = params.data.isLoginBlocked;
          const icon = isBlocked ? 'pi-lock text-error' : 'pi-shield text-primary';
          const tooltip = isBlocked ? 'Login Blocked' : 'Account Secure';

          return `
            <div style="display:flex; align-items:center; justify-content:center; height:100%; cursor:pointer;">
              <i class="pi ${icon}" style="font-size: 1.2rem;" title="${tooltip}"></i>
            </div>
          `;
        }
      }
    ];
    this.cdr.detectChanges();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
