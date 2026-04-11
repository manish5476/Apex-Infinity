import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';

// --- Services ---
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service';

// --- PrimeNG Modules ---
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';

// --- Shared Components & Grid ---
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { GridApi, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from "rxjs/operators";

// --- Interfaces ---
export interface Role {
  _id: string;
  name: string;
  isSuperAdmin?: boolean;
  isDefault?: boolean;
  permissions: string[];
}

export interface Permission {
  tag: string;
  description: string;
  group: string;
}

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    TagModule,
    DividerModule,
    CheckboxModule,
    AgShareGrid
],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-management.html',
  styleUrl: './role-management.scss'
})
export class RoleManagementComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private apiService = inject(ApiService);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  roles = signal<Role[]>([]);
  permissionsList = signal<Permission[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  filterName = signal('');
  showRoleDialog = signal(false);
  isEditMode = signal(false);
  currentRole = signal<Partial<Role>>({});
  selectedPermissions = signal<string[]>([]);

  filteredRoles = computed(() => {
    const term = this.filterName().toLowerCase().trim();
    const allRoles = this.roles();
    if (!term) return allRoles;
    return allRoles.filter(r => r.name.toLowerCase().includes(term));
  });

  groupedPermissions = computed(() => {
    const perms = this.permissionsList();
    const groups: Record<string, Permission[]> = {};
    perms.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return Object.keys(groups).sort().map(name => ({ name, items: groups[name] }));
  });

  private gridApi!: GridApi;
  columns: any[] = [];

  ngOnInit(): void {
    this.setupColumns();
    this.loadRoles();
    this.loadPermissions();
  }


  loadPermissions(): void {
    this.apiService.permissions().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => this.permissionsList.set(res.data || []),
      error: (err) => console.warn('Permissions load failed', err)
    });
  }

  setupColumns(): void {
    this.columns = [
      { field: 'name', headerName: 'Role Name', flex: 1, cellClass: 'font-semibold text-primary' },
      {
        headerName: 'Type', width: 130,
        cellRenderer: (params: ICellRendererParams) => {
          if (params.data.isSuperAdmin) return `<span class="ag-badge badge-danger">Super Admin</span>`;
          if (params.data.isDefault) return `<span class="ag-badge badge-contrast">Default</span>`;
          return `<span class="ag-badge badge-info">Custom</span>`;
        }
      },
      {
        field: 'permissions', headerName: 'Access Scope', flex: 2,
        valueFormatter: (params: ICellRendererParams) => {
          if (params.data?.isSuperAdmin) return 'Full System Access';
          const count = params.value?.length || 0;
          return `${count} permission${count !== 1 ? 's' : ''}`;
        },
        cellRenderer: (params: ICellRendererParams) => {
          if (params.data?.isSuperAdmin) return `<span class="text-tertiary italic">Full System Access</span>`;
          const count = params.value?.length || 0;
          return `<span class="ag-tag">${count} permission${count !== 1 ? 's' : ''}</span>`;
        }
      },
      {
        headerName: 'Actions', colId: 'actions', width: 120, pinned: 'right',
        cellRenderer: (params: ICellRendererParams) => {
          const disabled = params.data.isSuperAdmin ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
          return `
             <div class="flex justify-center py-1">
               <button class="action-btn action-edit" ${disabled} title="Edit Role">
                  <i class="pi pi-pencil"></i>
               </button>
               <button class="action-btn action-delete" ${disabled} title="Delete Role">
                  <i class="pi pi-trash"></i>
               </button>
             </div>`;
        }
      }
    ];
  }

  onGridReady(params: GridReadyEvent) { this.gridApi = params.api; }

  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      const rowData = event.row as Role;
      const target = event.event?.event?.target as HTMLElement;
      if (!rowData) return;
      if (target?.closest('.action-edit')) { this.openEditRoleDialog(rowData); return; }
      if (target?.closest('.action-delete')) { this.deleteRole(rowData); return; }
      if (event.column?.getColId() !== 'actions') { this.openEditRoleDialog(rowData); }
    }
  }

  applyFilters() { this.cdr.markForCheck(); }
  resetFilters() { this.filterName.set(''); this.cdr.markForCheck(); }

  togglePermission(tag: string) {
    const current = this.selectedPermissions();
    if (current.includes(tag)) {
      this.selectedPermissions.set(current.filter(t => t !== tag));
    } else {
      this.selectedPermissions.set([...current, tag]);
    }
  }

  isGroupSelected(groupName: string): boolean {
    const group = this.groupedPermissions().find(g => g.name === groupName);
    if (!group || group.items.length === 0) return false;
    return group.items.every(item => this.selectedPermissions().includes(item.tag));
  }

  getGroupSelectionCount(groupName: string): number {
    const group = this.groupedPermissions().find(g => g.name === groupName);
    return group ? group.items.filter(item => this.selectedPermissions().includes(item.tag)).length : 0;
  }

  toggleGroup(group: any, event: any) {
    const tags = group.items.map((i: any) => i.tag);
    if (event.checked) {
      this.selectedPermissions.set(Array.from(new Set([...this.selectedPermissions(), ...tags])));
    } else {
      this.selectedPermissions.set(this.selectedPermissions().filter(tag => !tags.includes(tag)));
    }
  }

  openNewRoleDialog() {
    this.currentRole.set({ name: '' });
    this.selectedPermissions.set([]);
    this.isEditMode.set(false);
    this.showRoleDialog.set(true);
  }

  hideDialog() { this.showRoleDialog.set(false); }
  patchCurrentRole(patch: Partial<Role>) { this.currentRole.update(c => ({ ...c, ...patch })); }

  loadRoles(): void {
    this.isLoading.set(true);
    this.apiService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.roles.set(res.data?.roles || []);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Dropped the trailing context string for the global handler
        this.appMessage.handleHttpError(err);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openEditRoleDialog(role: Role) {
    if (role.isSuperAdmin) {
      // Combined into a single string to match the new pattern
      this.appMessage.showInfo('System Role: Super Admin roles cannot be modified.');
      return;
    }
    this.currentRole.set({ ...role });
    this.selectedPermissions.set([...(role.permissions || [])]);
    this.isEditMode.set(true);
    this.showRoleDialog.set(true);
  }

  saveRole() {
    const roleData = this.currentRole();
    if (!roleData.name?.trim()) {
      // Swapped to single-string warning
      this.appMessage.showWarn('Validation Error: Please enter a role name.');
      return;
    }

    this.isSaving.set(true);
    const payload = { name: roleData.name, permissions: this.selectedPermissions() };
    const req$ = this.isEditMode()
      ? this.apiService.updateRole(roleData._id!, payload)
      : this.apiService.createRole(payload);

    // Moved the reset logic into finalize for cleaner stream management
    req$.pipe(
      finalize(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.appMessage.showSuccess(`Role ${this.isEditMode() ? 'updated' : 'created'} successfully.`);
        this.loadRoles();
        this.hideDialog();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
      }
    });
  }

  deleteRole(role: Role) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${role.name}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteRole(role._id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.appMessage.showSuccess('Role removed successfully.');
            this.loadRoles();
          },
          error: (err) => {
            this.appMessage.handleHttpError(err);
          }
        });
      }
    });
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}



  // openEditRoleDialog(role: Role) {
  //   if (role.isSuperAdmin) {
  //     this.appMessage.showInfo('Super Admin roles cannot be modified.', 'System Role');
  //     return;
  //   }
  //   this.currentRole.set({ ...role });
  //   this.selectedPermissions.set([...(role.permissions || [])]);
  //   this.isEditMode.set(true);
  //   this.showRoleDialog.set(true);
  // }

  // saveRole() {
  //   const roleData = this.currentRole();
  //   if (!roleData.name?.trim()) {
  //     this.appMessage.showWarn('Required', 'Please enter a role name');
  //     return;
  //   }
  //   this.isSaving.set(true);
  //   const payload = { name: roleData.name, permissions: this.selectedPermissions() };
  //   const req$ = this.isEditMode() ? this.apiService.updateRole(roleData._id!, payload) : this.apiService.createRole(payload);
  //   req$.subscribe({
  //     next: () => {
  //       this.appMessage.showSuccess(`Role ${this.isEditMode() ? 'updated' : 'created'} successfully`);
  //       this.loadRoles();
  //       this.hideDialog();
  //     },
  //     error: (err) => {
  //       this.appMessage.handleHttpError(err, 'Save Role');
  //       this.isSaving.set(false);
  //       this.cdr.markForCheck();
  //     },
  //     complete: () => { this.isSaving.set(false); this.cdr.markForCheck(); }
  //   });
  // }

  // deleteRole(role: Role) {
  //   this.confirmationService.confirm({
  //     message: `Are you sure you want to delete <b>${role.name}</b>?`,
  //     header: 'Confirm Delete',
  //     icon: 'pi pi-exclamation-triangle',
  //     accept: () => {
  //       this.apiService.deleteRole(role._id).subscribe({
  //         next: () => {
  //           this.appMessage.showSuccess('Role removed successfully');
  //           this.loadRoles();
  //         },
  //         error: (err) => this.appMessage.handleHttpError(err, 'Delete Role')
  //       });
  //     }
  //   });
  // }

  // loadRoles(): void {
  //   this.isLoading.set(true);
  //   this.apiService.getRoles().subscribe({
  //     next: (res: any) => {
  //       this.roles.set(res.data?.roles || []);
  //       this.isLoading.set(false);
  //       this.cdr.markForCheck();
  //     },
  //     error: (err) => {
  //       this.appMessage.handleHttpError(err, 'Fetch Roles');
  //       this.isLoading.set(false);
  //       this.cdr.markForCheck();
  //     }
  //   });
  // }
