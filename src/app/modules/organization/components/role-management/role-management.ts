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
import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';
import { DataGridComponent, GridColumn, GridRowAction } from '../../../../shared/ui/grid';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
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
    DialogComponent,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    TagModule,
    DividerModule,
    CheckboxModule,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    DataGridComponent
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

  columns: GridColumn[] = [];
  rowActions: GridRowAction[] = [];

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
      { field: 'name', header: 'Role Name', width: '200px' },
      {
        field: 'isSuperAdmin',
        header: 'Type', 
        width: '130px',
        type: 'status',
        formatter: (value: any, row: any) => row.isSuperAdmin ? 'Super Admin' : (row.isDefault ? 'Default' : 'Custom')
      },
      {
        field: 'permissions', 
        header: 'Access Scope', 
        width: '250px',
        formatter: (value: any, row: any) => {
          if (row.isSuperAdmin) return 'Full System Access';
          const count = value?.length || 0;
          return `${count} permission${count !== 1 ? 's' : ''}`;
        }
      }
    ];

    this.rowActions = [
      {
        id: 'edit',
        icon: 'pi pi-pencil',
        label: 'Edit Role',
        callback: (row: Role) => this.openEditRoleDialog(row)
      },
      {
        id: 'delete',
        icon: 'pi pi-trash',
        label: 'Delete Role',
        variant: 'danger',
        callback: (row: Role) => this.deleteRole(row)
      }
    ];
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
