import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';

// --- Services ---
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service'; 

// --- PrimeNG Modules ---
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

// --- Shared Components & Grid ---
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { GridApi, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';

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
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    TagModule,
    DividerModule,
    AgShareGrid
  ],
  templateUrl: './role-management.html',
  styleUrl: './role-management.scss',
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleManagementComponent implements OnInit {
  // --- Injections ---
  private apiService = inject(ApiService);
  private appMessage = inject(AppMessageService); 
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  // --- State Signals ---
  roles = signal<Role[]>([]);
  permissionsList = signal<Permission[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  
  // Filter state
  filterName = signal('');

  // Dialog state
  showRoleDialog = signal(false);
  isEditMode = signal(false);
  currentRole = signal<Partial<Role>>({});
  selectedPermissions = signal<string[]>([]); // Stores permission tags

  // --- Computed State (Reactive Selectors) ---
  
  /**
   * Reactive Filter: Automatically filters roles whenever 'roles' or 'filterName' change.
   */
  filteredRoles = computed(() => {
    const term = this.filterName().toLowerCase().trim();
    const allRoles = this.roles();
    if (!term) return allRoles;
    return allRoles.filter(r => r.name.toLowerCase().includes(term));
  });

  /**
   * MultiSelect Options: Groups permissions for the PrimeNG MultiSelect [group]="true".
   */
  permissionOptions = computed(() => {
    const perms = this.permissionsList();
    const groups: Record<string, any[]> = {};
    
    perms.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push({ label: p.description, value: p.tag });
    });

    return Object.keys(groups).sort().map(groupName => ({
      label: groupName,
      items: groups[groupName]
    }));
  });

  /**
   * Grouped Selection: Groups selected permissions for the Visual Summary area in the dialog.
   * This provides a clean review UI for administrators.
   */
  groupedSelectedPermissions = computed(() => {
    const selectedTags = this.selectedPermissions();
    if (selectedTags.length === 0) return [];

    const allPerms = this.permissionsList();
    const selectedObjs = allPerms.filter(p => selectedTags.includes(p.tag));
    
    const groups: Record<string, Permission[]> = {};
    selectedObjs.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => ({ name, items }));
  });

  // --- Grid Config ---
  private gridApi!: GridApi;
  columns: any[] = [];

  ngOnInit(): void {
    this.setupColumns();
    this.loadRoles();
    this.loadPermissions();
  }

  // --- Data Loading ---

  loadRoles(): void {
    this.isLoading.set(true);
    this.apiService.getRoles().subscribe({next: (res:any) => {
        this.roles.set(res.data.roles || []);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err, 'Fetch Roles');
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  loadPermissions(): void {
    this.apiService.permissions().subscribe({
      next: (res) => this.permissionsList.set(res.data || []),
      error: (err) => console.warn('Permissions load failed', err)
    });
  }

  // --- Grid Configuration ---

  setupColumns(): void {
    this.columns = [
      { 
        field: 'name', 
        headerName: 'Role Name', 
        flex: 1, 
        cellClass: 'font-semibold text-primary' 
      },
      {
        headerName: 'Type', 
        width: 130,
        cellRenderer: (params: ICellRendererParams) => {
          if (params.data.isSuperAdmin) return `<span class="ag-badge badge-danger">Super Admin</span>`;
          if (params.data.isDefault) return `<span class="ag-badge badge-contrast">Default</span>`;
          return `<span class="ag-badge badge-info">Custom</span>`;
        }
      },
      {
        field: 'permissions', 
        headerName: 'Access Scope', 
        flex: 2,
        cellRenderer: (params: ICellRendererParams) => {
           if (params.data.isSuperAdmin) return `<span class="text-tertiary italic">Full System Access</span>`;
           const count = params.value?.length || 0;
           return `<span class="ag-tag">${count} permission${count !== 1 ? 's' : ''}</span>`;
        }
      },
      {
        headerName: 'Actions', 
        colId: 'actions', 
        width: 100, 
        pinned: 'right',
        cellRenderer: (params: ICellRendererParams) => {
           const disabled = params.data.isSuperAdmin ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
           return `
             <div class="flex gap-2 justify-center py-1">
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

  onGridReady(params: GridReadyEvent) { 
    this.gridApi = params.api; 
  }

  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      const rowData = event.row as Role;
      const nativeEvent = event.event?.event as MouseEvent;
      const target = nativeEvent?.target as HTMLElement;

      if (!rowData) return;

      if (target?.closest('.action-edit')) {
        this.openEditRoleDialog(rowData);
        return;
      }

      if (target?.closest('.action-delete')) {
        this.deleteRole(rowData);
        return;
      }

      // Default: Open Edit on cell click (except Actions column)
      if (event.column?.getColId() !== 'actions') {
        this.openEditRoleDialog(rowData);
      }
    }
  }

  // --- Filter Actions ---

  applyFilters() { 
    this.cdr.markForCheck();
  }
  
  resetFilters() { 
    this.filterName.set(''); 
    this.cdr.markForCheck();
  }

  // --- Dialog Actions ---

  openNewRoleDialog() {
    this.currentRole.set({});
    this.selectedPermissions.set([]);
    this.isEditMode.set(false);
    this.showRoleDialog.set(true);
  }

  openEditRoleDialog(role: Role) {
    if (role.isSuperAdmin) {
      this.appMessage.showInfo('Super Admin roles cannot be modified.', 'System Role');
      return;
    }
    this.currentRole.set({ ...role });
    this.selectedPermissions.set([...(role.permissions || [])]);
    this.isEditMode.set(true);
    this.showRoleDialog.set(true);
  }

  hideDialog() { 
    this.showRoleDialog.set(false); 
  }

  /**
   * Helper to update currentRole signal from template safely.
   * Resolves compiler issues with object spreads inside HTML templates.
   */
  patchCurrentRole(patch: Partial<Role>) {
    this.currentRole.update(current => ({ ...current, ...patch }));
  }

  saveRole() {
    const roleData = this.currentRole();
    if (!roleData.name?.trim()) {
      this.appMessage.showWarn('Required', 'Please enter a role name');
      return;
    }

    const payload = { 
      name: roleData.name, 
      permissions: this.selectedPermissions() 
    };

    this.isSaving.set(true);
    const request$ = this.isEditMode() 
      ? this.apiService.updateRole(roleData._id!, payload) 
      : this.apiService.createRole(payload);
    
    request$.subscribe({
      next: () => {
        this.appMessage.showSuccess(`Role ${this.isEditMode() ? 'updated' : 'created'} successfully`);
        this.loadRoles();
        this.hideDialog();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err, 'Save Role');
        this.isSaving.set(false);
        this.cdr.markForCheck();
      },
      complete: () => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  deleteRole(role: Role) {
    if (role.isSuperAdmin) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${role.name}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.apiService.deleteRole(role._id).subscribe({
          next: () => {
            this.appMessage.showSuccess('Role removed successfully');
            this.loadRoles();
          },
          error: (err) => this.appMessage.handleHttpError(err, 'Delete Role')
        });
      }
    });
  }
}
// import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ApiService } from '../../../../core/services/api';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { ConfirmationService } from 'primeng/api';

// // --- AG Grid ---
// import { GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';

// // --- PrimeNG Modules ---
// import { ButtonModule } from 'primeng/button';
// import { DialogModule } from 'primeng/dialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { TooltipModule } from 'primeng/tooltip';
// import { TagModule } from 'primeng/tag';
// import { DividerModule } from 'primeng/divider';
// import { AgShareGrid } from "../../../shared/components/ag-shared-grid"; // Added Divider

// @Component({
//   selector: 'app-role-management',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,

//     ButtonModule,
//     DialogModule,
//     InputTextModule,
//     MultiSelectModule,
//     ToastModule,
//     ConfirmDialogModule,
//     TooltipModule,
//     TagModule,
//     DividerModule,
//     AgShareGrid
// ],
//   templateUrl: './role-management.html',
//   styleUrl: './role-management.scss',
//   providers: [ConfirmationService]
// })
// export class RoleManagementComponent implements OnInit {
//   // --- Injections ---
//   private apiService = inject(ApiService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);
//   private cdr = inject(ChangeDetectorRef);

//   // --- Grid State ---
//   private gridApi!: GridApi;
//   data: any[] = [];
//   column: any[] = [];
//   isLoading = false;
//   rowSelectionMode: 'single' | 'multiple' = 'single';

//   // --- Filter ---
//   roleFilter = { name: '' };

//   // --- Dialog State ---
//   showRoleDialog = false;
//   isEditMode = false;
//   currentRole: any = {};
  
//   // Permissions Data
//   allPermissionsList: any[] = [];
//   selectedPermissions: string[] = []; // Stores tags like 'invoice:read'
//   permissionOptions: any[] = [];      // For dropdown

//   ngOnInit(): void {
//     this.setupColumns();
//     this.loadRoles();
//     this.loadPermissions();
//   }

//   // --- Getters for UI ---
  
//   // This helps visualize the selected permissions grouped by category
//   get groupedSelectedPermissions() {
//     if (!this.selectedPermissions || this.selectedPermissions.length === 0) return [];

//     // 1. Find full objects for selected tags
//     const selectedObjs = this.allPermissionsList.filter(p => this.selectedPermissions.includes(p.tag));

//     // 2. Group them
//     const groups: { [key: string]: any[] } = {};
//     selectedObjs.forEach(p => {
//       if (!groups[p.group]) groups[p.group] = [];
//       groups[p.group].push(p);
//     });

//     // 3. Return array sorted by group name
//     return Object.keys(groups).sort().map(groupName => ({
//       name: groupName,
//       items: groups[groupName]
//     }));
//   }

//   // ... (Existing loadRoles, loadPermissions, etc. remain the same) ...
//   loadRoles(isReset: boolean = false): void {
//     if (this.isLoading) return;
//     this.isLoading = true;
//     this.apiService.getRoles().subscribe({
//       next: (res) => {
//         let roles = res.data.roles || [];
//         if (this.roleFilter.name) {
//           roles = roles.filter((r: any) => r.name.toLowerCase().includes(this.roleFilter.name.toLowerCase()));
//         }
//         this.data = roles;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: () => {
//         this.isLoading = false;
//         this.messageService.showError('Error', 'Failed to fetch roles.');
//       }
//     });
//   }

//   loadPermissions(): void {
//     this.apiService.permissions().subscribe({
//       next: (res) => {
//         this.allPermissionsList = res.data;
//         // Transform for PrimeNG MultiSelect (Grouped)
//         // Grouping requires a flat list with 'group' property or nested structure.
//         // PrimeNG [group]="true" expects: [{ label: 'Group A', items: [...] }, ...]
        
//         // Let's build that structure manually for better control
//         const groups: {[key:string]: any[]} = {};
//         this.allPermissionsList.forEach(p => {
//            if(!groups[p.group]) groups[p.group] = [];
//            groups[p.group].push({ label: p.description, value: p.tag });
//         });

//         this.permissionOptions = Object.keys(groups).sort().map(g => ({
//            label: g,
//            items: groups[g]
//         }));
//       }
//     });
//   }
// setupColumns(): void {
//   this.column = [
//     { 
//       field: 'name', 
//       headerName: 'Role Name', 
//       flex: 1, 
//       // Use project class instead of inline style object
//       cellClass: 'font-semibold text-primary' 
//     },
//     {
//       headerName: 'Type', 
//       width: 130,
//       cellRenderer: (params: ICellRendererParams) => {
//         // Ensuring system badges follow global theme tokens
//         if (params.data.isSuperAdmin) return `<span class="ag-badge badge-danger">Super Admin</span>`;
//         if (params.data.isDefault) return `<span class="ag-badge badge-contrast">Default</span>`;
//         return `<span class="ag-badge badge-info">Custom</span>`;
//       }
//     },
//     {
//       field: 'permissions', 
//       headerName: 'Access Scope', 
//       flex: 2,
//       cellRenderer: (params: ICellRendererParams) => {
//          if (params.data.isSuperAdmin) return `<span class="text-tertiary italic">Full System Access</span>`;
//          return `<span class="ag-tag">${params.value?.length || 0} permissions</span>`;
//       }
//     },
//     {
//       headerName: 'Actions', 
//       colId: 'actions', // Added colId for exclusion logic
//       width: 100, 
//       pinned: 'right',
//       cellRenderer: (params: ICellRendererParams) => {
//          const disabled = params.data.isSuperAdmin ? 'disabled' : '';
//          return `
//            <div class="flex gap-2 justify-center py-1">
//              <button class="action-btn action-edit" ${disabled} title="Edit Role">
//                 <i class="pi pi-pencil"></i>
//              </button>
//              <button class="action-btn action-delete" ${disabled} title="Delete Role">
//                 <i class="pi pi-trash"></i>
//              </button>
//            </div>`;
//       }
//     }
//   ];
// }
//   onGridReady(params: GridReadyEvent) { this.gridApi = params.api; }

//   // --- IN ROLE-MANAGEMENT.TS ---

// // --- UPDATED IN ROLE-MANAGEMENT.TS ---

// eventFromGrid(event: any) {
//   // Audit: Aligning with AgShareGrid's custom event emission structure
//   if (event.type === 'cellClicked') {
//     const rowData = event.row; // The key provided by your shared grid
//     const nativeEvent = event.event?.event; // Accessing the original MouseEvent
//     const target = nativeEvent?.target as HTMLElement;

//     if (!rowData) return;

//     // 1. Specific Button Click Detection (using closest for icon clicks)
//     if (target?.closest('.action-edit')) {
//       this.openEditRoleDialog(rowData);
//       return;
//     }

//     if (target?.closest('.action-delete')) {
//       this.deleteRole(rowData);
//       return;
//     }

//     // 2. Default Fallback: Open Edit dialog on general cell click 
//     // (excluding the actions column to prevent double-triggering)
//     if (event.column?.getColId() !== 'actions') {
//       this.openEditRoleDialog(rowData);
//     }
//   }
  
//   if (event.type === 'reachedBottom') {
//     // Logic for infinite scroll if implemented
//     // this.loadMoreRoles(); 
//   }
// }
//   // eventFromGrid(event: any) {
//   //   console.log(event);
//   //   if (event.type=== 'cellClicked') {
//   //     const target = event.event.event.target;
//   //     if (target.closest('.action-edit')) this.openEditRoleDialog(event.event.data);
//   //     if (target.closest('.action-delete')) this.deleteRole(event.event.data);
//   //   }
//   // }

//   // --- Actions ---
//   applyFilters() { this.loadRoles(true); }
//   resetFilters() { this.roleFilter.name = ''; this.loadRoles(true); }

//   openNewRoleDialog() {
//     this.currentRole = {};
//     this.selectedPermissions = [];
//     this.isEditMode = false;
//     this.showRoleDialog = true;
//   }

//   openEditRoleDialog(role: any) {
//     if (role.isSuperAdmin) return;
//     this.currentRole = { ...role };
//     this.selectedPermissions = [...(role.permissions || [])];
//     this.isEditMode = true;
//     this.showRoleDialog = true;
//   }

//   hideDialog() { this.showRoleDialog = false; }

//   saveRole() {
//     if (!this.currentRole.name?.trim()) {
//       this.messageService.showWarn('Required', 'Enter a role name');
//       return;
//     }
//     const payload = { name: this.currentRole.name, permissions: this.selectedPermissions };
//     const req$ = this.isEditMode ? this.apiService.updateRole(this.currentRole._id, payload) : this.apiService.createRole(payload);
    
//     this.isLoading = true;
//     req$.subscribe({
//       next: () => {
//         this.messageService.showSuccess('Saved', 'Role saved successfully');
//         this.loadRoles();
//         this.hideDialog();
//       },
//       error: () => this.isLoading = false
//     }).add(() => this.isLoading = false);
//   }

//   deleteRole(role: any) {
//     this.confirmationService.confirm({
//       message: `Delete ${role.name}?`,
//       accept: () => {
//         this.apiService.deleteRole(role._id).subscribe(() => {
//           this.messageService.showSuccess('Deleted', 'Role removed');
//           this.loadRoles();
//         });
//       }
//     });
//   }
// }
