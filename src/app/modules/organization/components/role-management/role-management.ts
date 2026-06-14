import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { GridApi, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';

// --- Interfaces ---
export interface Role {
  _id?: string;
  name: string;
  isSuperAdmin?: boolean;
  isDefault?: boolean;
  permissions: string[];
}

export interface PermissionItem {
  tag: string;
  description: string;
}

export interface PermissionGroup {
  name: string;
  items: PermissionItem[];
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

  // --- State Signals ---
  roles = signal<Role[]>([]);
  permissionGroups = signal<PermissionGroup[]>([]);
  totalPermissions = signal<number>(0);

  isLoading = signal(false);
  isSaving = signal(false);

  // --- UI Signals ---
  filterName = signal('');
  permissionSearch = signal('');
  showRoleDialog = signal(false);
  isEditMode = signal(false);
  currentRole = signal<Partial<Role>>({});
  selectedPermissions = signal<string[]>([]);

  // --- Computed Values ---
  filteredRoles = computed(() => {
    const term = this.filterName().toLowerCase().trim();
    const allRoles = this.roles();
    if (!term) return allRoles;
    return allRoles.filter(r => r.name.toLowerCase().includes(term));
  });

  // Enterprise Feature: In-dialog search for permissions
  filteredPermissionGroups = computed(() => {
    const term = this.permissionSearch().toLowerCase().trim();
    const groups = this.permissionGroups();

    if (!term) return groups;

    return groups.map(g => ({
      ...g,
      items: g.items.filter(i =>
        i.description.toLowerCase().includes(term) ||
        i.tag.toLowerCase().includes(term)
      )
    })).filter(g => g.items.length > 0);
  });

  // Computed check for "Select All" functionality
  isAllSelected = computed(() => {
    const allTags = this.permissionGroups().flatMap(g => g.items.map(i => i.tag));
    const selected = this.selectedPermissions();
    return allTags.length > 0 && selected.length === allTags.length;
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
      next: (res: any) => {
        // Map the real JSON structure: data.groupedPermissions
        const groupedData = res.data?.groupedPermissions;
        if (groupedData) {
          const mappedGroups: PermissionGroup[] = Object.keys(groupedData).map(key => ({
            name: key,
            items: groupedData[key]
          }));
          this.permissionGroups.set(mappedGroups);
          this.totalPermissions.set(res.data?.total || 0);
        }
      },
      error: (err) => console.warn('Permissions load failed', err)
    });
  }

  setupColumns(): void {
    this.columns = [
      {
        field: 'name',
        headerName: 'Role Name',
        flex: 1.5,
        cellClass: 'font-semibold text-gray-900',
        cellRenderer: (params: ICellRendererParams) => {
          return `<div class="flex items-center h-full text-[var(--accent-primary)] font-bold text-sm">
                    ${params.value}
                  </div>`;
        }
      },
      {
        headerName: 'System Entity Type',
        width: 180,
        cellRenderer: (params: ICellRendererParams) => {
          if (params.data.isSuperAdmin) {
            return `<div class="flex items-center h-full"><span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wide shadow-sm">Super Admin</span></div>`;
          }
          if (params.data.isDefault) {
            return `<div class="flex items-center h-full"><span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300 uppercase tracking-wide shadow-sm">Default Role</span></div>`;
          }
          return `<div class="flex items-center h-full"><span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-[var(--accent-focus)] text-[var(--accent-primary)] border border-blue-200 uppercase tracking-wide shadow-sm">Custom Role</span></div>`;
        }
      },
      {
        field: 'permissions',
        headerName: 'Access Scope & Permissions',
        flex: 2,
        cellRenderer: (params: ICellRendererParams) => {
          const perms = params.value || [];
          if (params.data?.isSuperAdmin || perms.includes('*')) {
            return `<div class="flex items-center gap-2 h-full"><span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm"><i class="pi pi-star-fill text-[10px]"></i> Unrestricted Access</span></div>`;
          }
          const count = perms.length;
          return `<div class="flex items-center h-full"><span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">${count} Valid Permission${count !== 1 ? 's' : ''}</span></div>`;
        }
      },
      {
        headerName: 'Actions',
        colId: 'actions',
        width: 140,
        pinned: 'right',
        cellRenderer: (params: ICellRendererParams) => {
          // Disable interaction visually if Super Admin
          const isDisabled = params.data.isSuperAdmin;
          const editClasses = isDisabled
            ? 'opacity-40 cursor-not-allowed text-gray-400'
            : 'text-gray-500 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-focus)] cursor-pointer';
          const delClasses = isDisabled
            ? 'opacity-40 cursor-not-allowed text-gray-400'
            : 'text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer';

          return `
             <div class="flex items-center justify-center gap-2 h-full w-full">
               <button class="action-btn action-edit flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 ${editClasses}" title="Edit Configuration">
                  <i class="pi pi-pencil"></i>
               </button>
               <button class="action-btn action-delete flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 ${delClasses}" title="Remove Role">
                  <i class="pi pi-trash"></i>
               </button>
             </div>`;
        }
      }
    ];
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      const rowData = event.row as Role;
      const target = event.event?.target as HTMLElement;
      if (!rowData) return;

      // Handle custom button clicks within the cell renderer
      if (target?.closest('.action-edit') && !rowData.isSuperAdmin) {
        this.openEditRoleDialog(rowData);
        return;
      }
      if (target?.closest('.action-delete') && !rowData.isSuperAdmin) {
        this.deleteRole(rowData);
        return;
      }

      // Default action: double-click simulation/row click
      if (event.column?.getColId() !== 'actions' && !rowData.isSuperAdmin) {
        this.openEditRoleDialog(rowData);
      }
    }
  }

  applyFilters() {
    this.cdr.markForCheck();
  }

  resetFilters() {
    this.filterName.set('');
    this.cdr.markForCheck();
  }

  // --- Permission Selection Logic ---

  togglePermission(tag: string) {
    const current = this.selectedPermissions();
    if (current.includes(tag)) {
      this.selectedPermissions.set(current.filter(t => t !== tag));
    } else {
      this.selectedPermissions.set([...current, tag]);
    }
  }

  isGroupSelected(groupName: string): boolean {
    const group = this.filteredPermissionGroups().find(g => g.name === groupName);
    if (!group || group.items.length === 0) return false;
    return group.items.every(item => this.selectedPermissions().includes(item.tag));
  }

  getGroupSelectionCount(groupName: string): number {
    const group = this.permissionGroups().find(g => g.name === groupName);
    return group ? group.items.filter(item => this.selectedPermissions().includes(item.tag)).length : 0;
  }

  toggleGroup(group: PermissionGroup, event: any) {
    const tags = group.items.map(i => i.tag);
    if (event.checked) {
      this.selectedPermissions.set(Array.from(new Set([...this.selectedPermissions(), ...tags])));
    } else {
      this.selectedPermissions.set(this.selectedPermissions().filter(tag => !tags.includes(tag)));
    }
  }

  toggleAllPermissions(event: any) {
    if (event.checked) {
      const allTags = this.permissionGroups().flatMap(g => g.items.map(i => i.tag));
      this.selectedPermissions.set(allTags);
    } else {
      this.selectedPermissions.set([]);
    }
  }

  // --- Dialog & CRUD Operations ---

  openNewRoleDialog() {
    this.currentRole.set({ name: '' });
    this.selectedPermissions.set([]);
    this.permissionSearch.set('');
    this.isEditMode.set(false);
    this.showRoleDialog.set(true);
  }

  hideDialog() {
    this.showRoleDialog.set(false);
  }

  patchCurrentRole(patch: Partial<Role>) {
    this.currentRole.update(c => ({ ...c, ...patch }));
  }

  loadRoles(): void {
    this.isLoading.set(true);
    this.apiService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.roles.set(res.data?.roles || []);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openEditRoleDialog(role: Role) {
    if (role.isSuperAdmin) {
      this.appMessage.showInfo('System Override: Super Admin roles are protected and cannot be modified.');
      return;
    }
    this.currentRole.set({ ...role });
    // Filter out the '*' if it accidentally got saved to a normal role to prevent UI breaks
    const permsToSet = (role.permissions || []).filter(p => p !== '*');
    this.selectedPermissions.set([...permsToSet]);
    this.permissionSearch.set('');
    this.isEditMode.set(true);
    this.showRoleDialog.set(true);
  }

  saveRole() {
    const roleData = this.currentRole();
    if (!roleData.name?.trim()) {
      this.appMessage.showWarn('Validation Error: A unique Role Identity (Name) is required.');
      return;
    }

    this.isSaving.set(true);
    const payload = { name: roleData.name, permissions: this.selectedPermissions() };
    const req$ = this.isEditMode()
      ? this.apiService.updateRole(roleData._id!, payload)
      : this.apiService.createRole(payload);

    req$.pipe(
      finalize(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.appMessage.showSuccess(`Configuration for '${roleData.name}' successfully ${this.isEditMode() ? 'updated' : 'created'}.`);
        this.loadRoles();
        this.hideDialog();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
      }
    });
  }

  deleteRole(role: Role) {
    if (role.isSuperAdmin) return; // Guard clause

    this.confirmationService.confirm({
      message: `Are you absolutely certain you wish to permanently delete the <b>${role.name}</b> role? Users mapped to this role may lose access. This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.apiService.deleteRole(role._id!).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.appMessage.showSuccess(`Role '${role.name}' was successfully removed.`);
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