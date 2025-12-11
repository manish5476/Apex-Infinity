import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service';
import { ConfirmationService } from 'primeng/api';

// --- AG Grid ---
import { GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';

// --- PrimeNG Modules ---
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider'; // Added Divider

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedGridComponent,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    TagModule,
    DividerModule
  ],
  templateUrl: './role-management.html',
  styleUrl: './role-management.scss',
  providers: [ConfirmationService]
})
export class RoleManagementComponent implements OnInit {
  // --- Injections ---
  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  // --- Grid State ---
  private gridApi!: GridApi;
  data: any[] = [];
  column: any[] = [];
  isLoading = false;
  rowSelectionMode: 'single' | 'multiple' = 'single';

  // --- Filter ---
  roleFilter = { name: '' };

  // --- Dialog State ---
  showRoleDialog = false;
  isEditMode = false;
  currentRole: any = {};
  
  // Permissions Data
  allPermissionsList: any[] = [];
  selectedPermissions: string[] = []; // Stores tags like 'invoice:read'
  permissionOptions: any[] = [];      // For dropdown

  ngOnInit(): void {
    this.setupColumns();
    this.loadRoles();
    this.loadPermissions();
  }

  // --- Getters for UI ---
  
  // This helps visualize the selected permissions grouped by category
  get groupedSelectedPermissions() {
    if (!this.selectedPermissions || this.selectedPermissions.length === 0) return [];

    // 1. Find full objects for selected tags
    const selectedObjs = this.allPermissionsList.filter(p => this.selectedPermissions.includes(p.tag));

    // 2. Group them
    const groups: { [key: string]: any[] } = {};
    selectedObjs.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });

    // 3. Return array sorted by group name
    return Object.keys(groups).sort().map(groupName => ({
      name: groupName,
      items: groups[groupName]
    }));
  }

  // ... (Existing loadRoles, loadPermissions, etc. remain the same) ...
  loadRoles(isReset: boolean = false): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.apiService.getRoles().subscribe({
      next: (res) => {
        let roles = res.data.roles || [];
        if (this.roleFilter.name) {
          roles = roles.filter((r: any) => r.name.toLowerCase().includes(this.roleFilter.name.toLowerCase()));
        }
        this.data = roles;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch roles.');
      }
    });
  }

  loadPermissions(): void {
    this.apiService.permissions().subscribe({
      next: (res) => {
        this.allPermissionsList = res.data;
        // Transform for PrimeNG MultiSelect (Grouped)
        // Grouping requires a flat list with 'group' property or nested structure.
        // PrimeNG [group]="true" expects: [{ label: 'Group A', items: [...] }, ...]
        
        // Let's build that structure manually for better control
        const groups: {[key:string]: any[]} = {};
        this.allPermissionsList.forEach(p => {
           if(!groups[p.group]) groups[p.group] = [];
           groups[p.group].push({ label: p.description, value: p.tag });
        });

        this.permissionOptions = Object.keys(groups).sort().map(g => ({
           label: g,
           items: groups[g]
        }));
      }
    });
  }

  setupColumns(): void {
    this.column = [
      { field: 'name', headerName: 'Role Name', flex: 1, cellStyle: { 'font-weight': '600' } },
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
        cellRenderer: (params: ICellRendererParams) => {
           if (params.data.isSuperAdmin) return `<span class="text-gray-500 italic">Full System Access</span>`;
           return `<span class="ag-tag">${params.value?.length || 0} permissions</span>`;
        }
      },
      {
        headerName: 'Actions', width: 100, pinned: 'right',
        cellRenderer: (params: ICellRendererParams) => {
           const disabled = params.data.isSuperAdmin ? 'disabled' : '';
           return `<div class="flex gap-2 justify-center">
             <button class="action-btn action-edit" ${disabled}><i class="pi pi-pencil"></i></button>
             <button class="action-btn action-delete" ${disabled}><i class="pi pi-trash"></i></button>
           </div>`;
        }
      }
    ];
  }

  onGridReady(params: GridReadyEvent) { this.gridApi = params.api; }
  
  eventFromGrid(event: any) {
    console.log(event);
    if (event.eventType === 'CellClickedEvent') {
      const target = event.event.event.target;
      if (target.closest('.action-edit')) this.openEditRoleDialog(event.event.data);
      if (target.closest('.action-delete')) this.deleteRole(event.event.data);
    }
  }

  // --- Actions ---
  applyFilters() { this.loadRoles(true); }
  resetFilters() { this.roleFilter.name = ''; this.loadRoles(true); }

  openNewRoleDialog() {
    this.currentRole = {};
    this.selectedPermissions = [];
    this.isEditMode = false;
    this.showRoleDialog = true;
  }

  openEditRoleDialog(role: any) {
    if (role.isSuperAdmin) return;
    this.currentRole = { ...role };
    this.selectedPermissions = [...(role.permissions || [])];
    this.isEditMode = true;
    this.showRoleDialog = true;
  }

  hideDialog() { this.showRoleDialog = false; }

  saveRole() {
    if (!this.currentRole.name?.trim()) {
      this.messageService.showWarn('Required', 'Enter a role name');
      return;
    }
    const payload = { name: this.currentRole.name, permissions: this.selectedPermissions };
    const req$ = this.isEditMode ? this.apiService.updateRole(this.currentRole._id, payload) : this.apiService.createRole(payload);
    
    this.isLoading = true;
    req$.subscribe({
      next: () => {
        this.messageService.showSuccess('Saved', 'Role saved successfully');
        this.loadRoles();
        this.hideDialog();
      },
      error: () => this.isLoading = false
    }).add(() => this.isLoading = false);
  }

  deleteRole(role: any) {
    this.confirmationService.confirm({
      message: `Delete ${role.name}?`,
      accept: () => {
        this.apiService.deleteRole(role._id).subscribe(() => {
          this.messageService.showSuccess('Deleted', 'Role removed');
          this.loadRoles();
        });
      }
    });
  }
}