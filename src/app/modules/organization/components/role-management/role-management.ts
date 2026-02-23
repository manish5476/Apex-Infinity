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
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox'; 

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
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="list-page-container">
      <div class="list-header">
        <h2 class="list-title">
          <i class="pi pi-id-card text-[var(--accent-primary)]"></i>
          Role Management
        </h2>
        <p-button label="New Role" icon="pi pi-plus" (click)="openNewRoleDialog()"></p-button>
      </div>

      <div class="themed-card filter-card">
        <div class="se-filter-bar">
          <div class="se-filter-field">
            <label>Role Search</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input type="text" pInputText [ngModel]="filterName()" (ngModelChange)="filterName.set($event)"
                (keydown.enter)="applyFilters()" placeholder="Search by role name..." class="w-full" />
            </span>
          </div>
          <div class="se-filter-actions">
            <p-button label="Apply" icon="pi pi-check" (click)="applyFilters()"></p-button>
            <p-button label="Reset" icon="pi pi-refresh" styleClass="p-button-outlined" (click)="resetFilters()"></p-button>
          </div>
        </div>
      </div>

      <div class="themed-card list-grid-area">
        <app-ag-share-grid [columns]="columns" [data]="filteredRoles()" [showActions]="false" selectionMode="multiple"
          (gridEvent)="eventFromGrid($event)" style="height: 100%; width: 100%; display: block;">
        </app-ag-share-grid>
      </div>
    </div>

    <!-- IMPROVED ROLE DIALOG -->
    <p-dialog 
      appendTo="body" 
      [visible]="showRoleDialog()" 
      (visibleChange)="showRoleDialog.set($event)" 
      [modal]="true"
      [style]="{width: '80vw', height: '90vh', 'max-width': '1200px'}"
      [contentStyle]="{
        'display': 'flex', 
        'flex-direction': 'column', 
        'height': '100%', 
        'overflow': 'hidden',
        'padding': '0'
      }"
      [header]="isEditMode() ? 'Edit Role Configuration' : 'Create New Role'" 
      (onHide)="hideDialog()" 
      [draggable]="false"
      [resizable]="false" 
      styleClass="role-dialog">

      <div class="dialog-content-wrapper flex flex-col h-full overflow-hidden">
        
        <!-- Role Name Input (Sticky at top of dialog body) -->
        <div class="p-4 border-b border-[var(--border-primary)] bg-white shrink-0">
          <div class="form-field w-full">
            <label for="roleName" class="text-xs font-bold uppercase text-[var(--text-secondary)] mb-1 block">Role Name <span class="text-red-500">*</span></label>
            <input id="roleName" type="text" pInputText [ngModel]="currentRole().name"
              (ngModelChange)="patchCurrentRole({ name: $event })" placeholder="e.g. Sales Manager, Warehouse Staff" class="w-full p-inputtext-lg" />
          </div>
        </div>

        <!-- Scrollable Permission Matrix -->
        <div class="permissions-selection-area flex-1 overflow-y-auto p-4 bg-[var(--bg-primary)] min-h-0">
          @if (groupedPermissions().length === 0) {
            <div class="empty-state">
              <i class="pi pi-spin pi-spinner text-3xl mb-2 text-[var(--text-secondary)]"></i>
              <p>Loading permissions...</p>
            </div>
          } @else {
            <div class="flex flex-col gap-6">
              @for (group of groupedPermissions(); track group.name) {
                <div class="perm-category-section">
                  
                  <!-- Group Header -->
                  <div class="category-header sticky top-0 z-10 bg-white">
                    <div class="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                      <i class="pi pi-folder-open text-[var(--accent-primary)]"></i>
                      <span>{{ group.name }}</span>
                      <span class="count-badge">{{ getGroupSelectionCount(group.name) }} / {{ group.items.length }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <p-checkbox [binary]="true" 
                                  [ngModel]="isGroupSelected(group.name)" 
                                  (onChange)="toggleGroup(group, $event)" 
                                  label="Select Group"></p-checkbox>
                    </div>
                  </div>

                  <!-- Permission Cards Grid -->
                  <div class="category-grid">
                    @for (item of group.items; track item.tag) {
                      <div class="perm-toggle-card" 
                           [class.selected]="selectedPermissions().includes(item.tag)"
                           (click)="togglePermission(item.tag)">
                        
                        <div class="checkbox-indicator">
                          <i class="pi pi-check" *ngIf="selectedPermissions().includes(item.tag)"></i>
                        </div>
                        
                        <div class="perm-details">
                          <span class="perm-desc">{{ item.description }}</span>
                          <span class="perm-tag">{{ item.tag }}</span>
                        </div>
                      </div>
                    }
                  </div>

                </div>
              }
            </div>
          }
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer flex justify-between items-center w-full pt-2 border-t border-[var(--border-primary)]">
          <div class="summary-text text-xs text-[var(--text-secondary)]">
            @if (selectedPermissions().length > 0) {
              <strong class="text-[var(--text-primary)]">{{ selectedPermissions().length }}</strong> permissions assigned
            } @else {
              No permissions assigned yet.
            }
          </div>
          <div class="footer-actions flex gap-2">
            <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (click)="hideDialog()"></p-button>
            <p-button label="Save Role" icon="pi pi-save" (click)="saveRole()" [loading]="isSaving()"></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .list-page-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      padding: 1.5rem;
      gap: 1rem;
      background: var(--bg-primary, #f8f9fa);
      overflow: hidden;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      .list-title { font-size: 1.75rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; }
    }

    .themed-card {
      background: var(--bg-secondary, #ffffff);
      border-radius: 0.5rem;
      border: 1px solid var(--border-primary, #e5e7eb);
      padding: 1rem;
    }
    
    .filter-card { flex-shrink: 0; }

    .se-filter-bar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; }
    .se-filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex-grow: 1;
      min-width: 250px;
      label { font-size: 0.75rem; color: var(--text-label); text-transform: uppercase; font-weight: 600; }
    }

    .list-grid-area {
      flex: 1;
      min-height: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      app-ag-share-grid { height: 100%; width: 100%; display: block; }
    }

    /* === DIALOG SCROLL FIXES === */

    ::ng-deep .role-dialog {
        .p-dialog-content {
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
            overflow: hidden !important;
        }
    }

    .permissions-selection-area {
      /* Critical for scrolling */
      flex: 1; 
      min-height: 0; 
      overflow-y: auto;
      
      scrollbar-width: thin;
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-thumb { background: var(--border-secondary, #cbd5e1); border-radius: 3px; }
    }

    .perm-category-section {
      background: var(--bg-secondary, #ffffff);
      border: 1px solid var(--border-primary, #e2e8f0);
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-primary, #e2e8f0);
      
      .count-badge {
        background: var(--bg-primary, #f1f5f9);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
      padding: 1rem;
    }

    .perm-toggle-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid var(--border-primary, #e2e8f0);
      border-radius: 0.375rem;
      background: var(--bg-secondary, #ffffff);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--accent-primary);
        background: color-mix(in srgb, var(--accent-primary) 2%, #ffffff);
      }

      &.selected {
        border-color: var(--accent-primary);
        background: color-mix(in srgb, var(--accent-primary) 6%, #ffffff);
        .checkbox-indicator { background: var(--accent-primary); border-color: var(--accent-primary); color: white; }
      }

      .checkbox-indicator {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        border: 1px solid var(--border-secondary);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 2px;
        i { font-size: 0.6rem; }
      }

      .perm-details {
        display: flex;
        flex-direction: column;
        flex: 1;
        .perm-desc { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
        .perm-tag { font-size: 0.7rem; color: var(--text-secondary); font-family: monospace; }
      }
    }

    .empty-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    }

    ::ng-deep .action-btn {
      width: 2rem;
      height: 2rem;
      border-radius: 0.375rem;
      border: 1px solid var(--border-primary);
      color: var(--text-secondary);
      margin: 0 2px;
      &:hover:not([disabled]) { border-color: var(--accent-primary); color: var(--accent-primary); }
      &.action-delete:hover:not([disabled]) { border-color: #ef4444; color: #ef4444; }
    }
  `]
})
export class RoleManagementComponent implements OnInit {
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

  loadRoles(): void {
    this.isLoading.set(true);
    this.apiService.getRoles().subscribe({
      next: (res: any) => {
        this.roles.set(res.data?.roles || []);
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
        cellRenderer: (params: ICellRendererParams) => {
           if (params.data.isSuperAdmin) return `<span class="text-tertiary italic">Full System Access</span>`;
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

  hideDialog() { this.showRoleDialog.set(false); }
  patchCurrentRole(patch: Partial<Role>) { this.currentRole.update(c => ({ ...c, ...patch })); }

  saveRole() {
    const roleData = this.currentRole();
    if (!roleData.name?.trim()) {
      this.appMessage.showWarn('Required', 'Please enter a role name');
      return;
    }
    this.isSaving.set(true);
    const payload = { name: roleData.name, permissions: this.selectedPermissions() };
    const req$ = this.isEditMode() ? this.apiService.updateRole(roleData._id!, payload) : this.apiService.createRole(payload);
    req$.subscribe({
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
      complete: () => { this.isSaving.set(false); this.cdr.markForCheck(); }
    });
  }

  deleteRole(role: Role) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${role.name}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
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
// import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ConfirmationService } from 'primeng/api';

// // --- Services ---
// import { ApiService } from '../../../../core/services/api';
// import { AppMessageService } from '../../../../core/services/message.service'; 

// // --- PrimeNG Modules ---
// import { ButtonModule } from 'primeng/button';
// import { DialogModule } from 'primeng/dialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { TooltipModule } from 'primeng/tooltip';
// import { TagModule } from 'primeng/tag';
// import { DividerModule } from 'primeng/divider';
// import { CheckboxModule } from 'primeng/checkbox'; // Added for the new card selections

// // --- Shared Components & Grid ---
// import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
// import { GridApi, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';

// // --- Interfaces ---
// export interface Role {
//   _id: string;
//   name: string;
//   isSuperAdmin?: boolean;
//   isDefault?: boolean;
//   permissions: string[];
// }

// export interface Permission {
//   tag: string;
//   description: string;
//   group: string;
// }

// @Component({
//   selector: 'app-role-management',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ButtonModule,
//     DialogModule,
//     InputTextModule,
//     ToastModule,
//     ConfirmDialogModule,
//     TooltipModule,
//     TagModule,
//     DividerModule,
//     CheckboxModule,
//     AgShareGrid
//   ],
//   providers: [ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast></p-toast>
//     <p-confirmDialog></p-confirmDialog>

//     <div class="list-page-container">
//       <div class="list-header">
//         <h2 class="list-title">
//           <i class="pi pi-id-card text-[var(--accent-primary)]"></i>
//           Role Management
//         </h2>
//         <p-button label="New Role" icon="pi pi-plus" (click)="openNewRoleDialog()"></p-button>
//       </div>

//       <div class="themed-card filter-card">
//         <div class="se-filter-bar">
//           <div class="se-filter-field">
//             <label>Role Search</label>
//             <span class="p-input-icon-left w-full">
//               <i class="pi pi-search"></i>
//               <input type="text" pInputText [ngModel]="filterName()" (ngModelChange)="filterName.set($event)"
//                 (keydown.enter)="applyFilters()" placeholder="Search by role name..." class="w-full" />
//             </span>
//           </div>
//           <div class="se-filter-actions">
//             <p-button label="Apply" icon="pi pi-check" (click)="applyFilters()"></p-button>
//             <p-button label="Reset" icon="pi pi-refresh" styleClass="p-button-outlined" (click)="resetFilters()"></p-button>
//           </div>
//         </div>
//       </div>

//       <div class="themed-card list-grid-area">
//         <app-ag-share-grid [columns]="columns" [data]="filteredRoles()" [showActions]="false" selectionMode="multiple"
//           (gridEvent)="eventFromGrid($event)" style="height: 100%; width: 100%; display: block;">
//         </app-ag-share-grid>
//       </div>
//     </div>

//     <!-- IMPROVED ROLE DIALOG -->
//     <p-dialog appendTo="body" [visible]="showRoleDialog()" (visibleChange)="showRoleDialog.set($event)" [modal]="true"
// [contentStyle]="{
//         'display': 'flex', 
//         'flex-direction': 'column', 
//         'height': '100%', 
//         'width':'89%',
//         'overflow': 'hidden' 
//     }"
//       [header]="isEditMode() ? 'Edit Role Configuration' : 'Create New Role'" (onHide)="hideDialog()" [draggable]="false"
//       [resizable]="false" styleClass="role-dialog" [contentStyle]="{'overflow': 'hidden', 'display': 'flex', 'flex-direction': 'column'}">

//       <div class="dialog-content-wrapper flex flex-col h-full gap-4">
        
//         <!-- Role Name Input -->
//         <div class="form-field w-full mt-2">
//           <label for="roleName" class="text-sm font-semibold mb-1 block">Role Name <span class="text-red-500">*</span></label>
//           <input id="roleName" type="text" pInputText [ngModel]="currentRole().name"
//             (ngModelChange)="patchCurrentRole({ name: $event })" placeholder="e.g. Sales Manager, Warehouse Staff" class="w-full p-inputtext-lg" />
//         </div>

//         <p-divider align="center" styleClass="my-2">
//           <span class="text-xs font-bold text-[var(--text-secondary)] tracking-wider">ASSIGN PERMISSIONS</span>
//         </p-divider>

//         <!-- New Card-Based Permission Selector -->
//         <div class="permissions-selection-area flex-1 overflow-y-auto pr-2 pb-2">
//           @if (groupedPermissions().length === 0) {
//             <div class="empty-state">
//               <i class="pi pi-spin pi-spinner text-3xl mb-2 text-[var(--text-secondary)]"></i>
//               <p>Loading permissions...</p>
//             </div>
//           } @else {
//             <div class="flex flex-col gap-5">
//               @for (group of groupedPermissions(); track group.name) {
//                 <div class="perm-category-section">
                  
//                   <!-- Group Header -->
//                   <div class="category-header">
//                     <div class="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
//                       <i class="pi pi-folder-open text-[var(--accent-primary)]"></i>
//                       <span>{{ group.name }}</span>
//                       <span class="count-badge">{{ getGroupSelectionCount(group.name) }} / {{ group.items.length }}</span>
//                     </div>
//                     <div class="flex items-center gap-2">
//                       <p-checkbox [binary]="true" 
//                                   [ngModel]="isGroupSelected(group.name)" 
//                                   (onChange)="toggleGroup(group, $event)" 
//                                   label="Select All in Group"></p-checkbox>
//                     </div>
//                   </div>

//                   <!-- Permission Cards Grid -->
//                   <div class="category-grid">
//                     @for (item of group.items; track item.tag) {
//                       <div class="perm-toggle-card" 
//                            [class.selected]="selectedPermissions().includes(item.tag)"
//                            (click)="togglePermission(item.tag)">
                        
//                         <div class="checkbox-indicator">
//                           <i class="pi pi-check" *ngIf="selectedPermissions().includes(item.tag)"></i>
//                         </div>
                        
//                         <div class="perm-details">
//                           <span class="perm-desc">{{ item.description }}</span>
//                           <span class="perm-tag">{{ item.tag }}</span>
//                         </div>
//                       </div>
//                     }
//                   </div>

//                 </div>
//               }
//             </div>
//           }
//         </div>
//       </div>

//       <ng-template pTemplate="footer">
//         <div class="dialog-footer flex justify-between items-center w-full pt-4 border-t border-[var(--border-primary)]">
//           <div class="summary-text text-sm text-[var(--text-secondary)]">
//             @if (selectedPermissions().length > 0) {
//               Total: <strong class="text-[var(--text-primary)]">{{ selectedPermissions().length }}</strong> permissions assigned out of {{ permissionsList().length }}
//             } @else {
//               No permissions assigned yet.
//             }
//           </div>
//           <div class="footer-actions flex gap-2">
//             <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (click)="hideDialog()"></p-button>
//             <p-button label="Save Role" icon="pi pi-save" (click)="saveRole()" [loading]="isSaving()"></p-button>
//           </div>
//         </div>
//       </ng-template>
//     </p-dialog>
//   `,
//   styles: [`
//     /* ==============================================
//        ROLE MANAGEMENT COMPONENT
//        Theme: Enterprise Full Height
//        ============================================== */

//     :host {
//       display: block;
//       width: 100%;
//       height: 100%;
//       overflow: hidden;
//     }

//     .list-page-container {
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       width: 100%;
//       padding: var(--spacing-xl, 1.5rem);
//       gap: var(--spacing-lg, 1rem);
//       background: var(--bg-primary, #f8f9fa);
//       overflow: hidden;
//     }

//     /* === HEADER === */
//     .list-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       flex-shrink: 0;

//       .list-title {
//         font-size: var(--font-size-3xl, 1.75rem);
//         font-weight: 600;
//         color: var(--text-primary, #1f2937);
//         margin: 0;
//         display: flex;
//         align-items: center;
//         gap: var(--spacing-md, 0.5rem);
//       }
//     }

//     /* === CARD === */
//     .themed-card {
//       background: var(--bg-secondary, #ffffff);
//       border-radius: var(--ui-border-radius-lg, 0.5rem);
//       border: 1px solid var(--border-primary, #e5e7eb);
//       box-shadow: 0 1px 3px rgba(0,0,0,0.05);
//       padding: var(--spacing-lg, 1rem);
//     }
    
//     .filter-card { flex-shrink: 0; }

//     /* === FILTER BAR === */
//     .se-filter-bar {
//       display: flex;
//       flex-wrap: wrap;
//       gap: var(--spacing-lg, 1rem);
//       align-items: flex-end;
//     }

//     .se-filter-field {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm, 0.25rem);
//       flex-grow: 1;
//       min-width: 250px;

//       label {
//         font-size: 0.75rem;
//         color: var(--text-label, #6b7280);
//         text-transform: uppercase;
//         font-weight: 600;
//       }

//       input[pInputText] {
//         background: var(--bg-ternary, #f9fafb);
//         border-color: var(--border-primary, #d1d5db);
//         color: var(--text-primary, #111827);
//         transition: all 0.2s;
        
//         &:enabled:focus {
//             border-color: var(--accent-primary, #3b82f6);
//             box-shadow: 0 0 0 1px var(--accent-primary, #3b82f6);
//         }
//       }
//     }

//     .se-filter-actions {
//       display: flex;
//       gap: var(--spacing-md, 0.5rem);
//       padding-bottom: 2px;
//     }

//     /* === GRID AREA === */
//     .list-grid-area {
//       flex: 1;             
//       min-height: 0;       
//       padding: 0;          
//       overflow: hidden;    
//       display: flex;       
//       flex-direction: column;
//       app-ag-share-grid { height: 100%; width: 100%; display: block; }
//     }

//     /* === IMPROVED DIALOG STYLES (CARD DESIGN) === */
    
//     .permissions-selection-area {
//       background: var(--bg-primary, #f9fafb);
//       border-radius: var(--ui-border-radius, 0.5rem);
//       padding: 1rem;
//       border: 1px solid var(--border-primary, #e5e7eb);
//       min-height: 300px;
      
//       /* Smooth Scrollbar */
//       &::-webkit-scrollbar { width: 6px; }
//       &::-webkit-scrollbar-thumb { background: var(--border-secondary, #cbd5e1); border-radius: 3px; }
//       &::-webkit-scrollbar-track { background: transparent; }
//     }

//     .perm-category-section {
//       background: var(--bg-secondary, #ffffff);
//       border: 1px solid var(--border-primary, #e2e8f0);
//       border-radius: 0.5rem;
//       overflow: hidden;
//       box-shadow: 0 1px 2px rgba(0,0,0,0.02);
//     }

//     .category-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: 0.75rem 1rem;
//       background: color-mix(in srgb, var(--accent-primary, #3b82f6) 5%, transparent);
//       border-bottom: 1px solid var(--border-primary, #e2e8f0);
      
//       .count-badge {
//         background: var(--bg-primary, #f1f5f9);
//         padding: 2px 8px;
//         border-radius: 12px;
//         font-size: 0.75rem;
//         border: 1px solid var(--border-secondary, #cbd5e1);
//         color: var(--text-secondary, #64748b);
//       }
//     }

//     .category-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//       gap: 0.75rem;
//       padding: 1rem;
//     }

//     /* Interactive Permission Toggle Card */
//     .perm-toggle-card {
//       display: flex;
//       align-items: flex-start;
//       gap: 0.75rem;
//       padding: 0.75rem;
//       border: 1px solid var(--border-primary, #e2e8f0);
//       border-radius: 0.375rem;
//       background: var(--bg-secondary, #ffffff);
//       cursor: pointer;
//       transition: all 0.2s ease;
//       position: relative;
//       overflow: hidden;

//       &:hover {
//         border-color: var(--accent-primary, #3b82f6);
//         background: color-mix(in srgb, var(--accent-primary, #3b82f6) 2%, #ffffff);
//         transform: translateY(-1px);
//         box-shadow: 0 2px 5px rgba(0,0,0,0.05);
//       }

//       &.selected {
//         border-color: var(--accent-primary, #3b82f6);
//         background: color-mix(in srgb, var(--accent-primary, #3b82f6) 6%, #ffffff);
//         box-shadow: 0 1px 3px color-mix(in srgb, var(--accent-primary, #3b82f6) 20%, transparent);

//         .checkbox-indicator {
//           background: var(--accent-primary, #3b82f6);
//           border-color: var(--accent-primary, #3b82f6);
//           color: white;
//         }
//       }

//       .checkbox-indicator {
//         width: 20px;
//         height: 20px;
//         flex-shrink: 0;
//         border: 1px solid var(--border-secondary, #cbd5e1);
//         border-radius: 4px;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         transition: all 0.2s;
//         margin-top: 2px;
//         background: var(--bg-primary, #ffffff);

//         i { font-size: 0.7rem; font-weight: bold; }
//       }

//       .perm-details {
//         display: flex;
//         flex-direction: column;
//         gap: 0.25rem;
//         flex: 1;

//         .perm-desc {
//           font-size: 0.85rem;
//           font-weight: 600;
//           color: var(--text-primary, #1e293b);
//           line-height: 1.2;
//         }

//         .perm-tag {
//           font-size: 0.7rem;
//           color: var(--text-secondary, #64748b);
//           font-family: monospace;
//           background: var(--bg-primary, #f1f5f9);
//           padding: 2px 4px;
//           border-radius: 3px;
//           width: fit-content;
//         }
//       }
//     }

//     .empty-state {
//       height: 100%;
//       min-height: 200px;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       color: var(--text-secondary, #64748b);
//       p { font-weight: 500; margin: 0; }
//     }

//     /* Actions buttons for ag-grid */
//     ::ng-deep {
//       .action-btn {
//         display: inline-flex;
//         align-items: center;
//         justify-content: center;
//         transition: all 0.2s;
//         width: 2rem;
//         height: 2rem;
//         border-radius: 0.375rem;
//         background: transparent;
//         border: 1px solid var(--border-primary, #e2e8f0);
//         color: var(--text-secondary, #64748b);
//         margin: 0 2px;

//         &:hover:not([disabled]) {
//           background: color-mix(in srgb, var(--accent-primary, #3b82f6) 10%, transparent);
//           color: var(--accent-primary, #3b82f6);
//           border-color: var(--accent-primary, #3b82f6);
//           transform: translateY(-1px);
//         }

//         &.action-delete:hover:not([disabled]) {
//           background: #fee2e2;
//           color: #ef4444;
//           border-color: #ef4444;
//         }

//         &[disabled] {
//           opacity: 0.4;
//           cursor: not-allowed;
//           filter: grayscale(1);
//         }
//       }

//       .ag-row-hover { background-color: var(--bg-primary, #f8f9fa) !important; }
//     }
//   `]
// })
// export class RoleManagementComponent implements OnInit {
//   // --- Injections ---
//   private apiService = inject(ApiService);
//   private appMessage = inject(AppMessageService); 
//   private confirmationService = inject(ConfirmationService);
//   private cdr = inject(ChangeDetectorRef);

//   // --- State Signals ---
//   roles = signal<Role[]>([]);
//   permissionsList = signal<Permission[]>([]);
//   isLoading = signal(false);
//   isSaving = signal(false);
  
//   filterName = signal('');
//   showRoleDialog = signal(false);
//   isEditMode = signal(false);
//   currentRole = signal<Partial<Role>>({});
  
//   // Array of permission tags currently selected
//   selectedPermissions = signal<string[]>([]); 

//   // --- Computed State ---
  
//   filteredRoles = computed(() => {
//     const term = this.filterName().toLowerCase().trim();
//     const allRoles = this.roles();
//     if (!term) return allRoles;
//     return allRoles.filter(r => r.name.toLowerCase().includes(term));
//   });

//   /**
//    * Groups permissions for the new Card-Based layout.
//    * Returns an array of { name: 'Group Name', items: [permissions...] }
//    */
//   groupedPermissions = computed(() => {
//     const perms = this.permissionsList();
//     const groups: Record<string, Permission[]> = {};
    
//     perms.forEach(p => {
//       if (!groups[p.group]) groups[p.group] = [];
//       groups[p.group].push(p);
//     });

//     return Object.keys(groups).sort().map(groupName => ({
//       name: groupName,
//       items: groups[groupName]
//     }));
//   });

//   // --- Grid Config ---
//   private gridApi!: GridApi;
//   columns: any[] = [];

//   ngOnInit(): void {
//     this.setupColumns();
//     this.loadRoles();
//     this.loadPermissions();
//   }

//   // --- Data Loading ---

//   loadRoles(): void {
//     this.isLoading.set(true);
//     this.apiService.getRoles().subscribe({
//       next: (res:any) => {
//         this.roles.set(res.data?.roles || []);
//         this.isLoading.set(false);
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.appMessage.handleHttpError(err, 'Fetch Roles');
//         this.isLoading.set(false);
//         this.cdr.markForCheck();
//       }
//     });
//   }

//   loadPermissions(): void {
//     this.apiService.permissions().subscribe({
//       next: (res: any) => this.permissionsList.set(res.data || []),
//       error: (err) => console.warn('Permissions load failed', err)
//     });
//   }

//   // --- Grid Configuration ---

//   setupColumns(): void {
//     this.columns = [
//       { 
//         field: 'name', 
//         headerName: 'Role Name', 
//         flex: 1, 
//         cellClass: 'font-semibold text-primary' 
//       },
//       {
//         headerName: 'Type', 
//         width: 130,
//         cellRenderer: (params: ICellRendererParams) => {
//           if (params.data.isSuperAdmin) return `<span class="ag-badge badge-danger">Super Admin</span>`;
//           if (params.data.isDefault) return `<span class="ag-badge badge-contrast">Default</span>`;
//           return `<span class="ag-badge badge-info">Custom</span>`;
//         }
//       },
//       {
//         field: 'permissions', 
//         headerName: 'Access Scope', 
//         flex: 2,
//         cellRenderer: (params: ICellRendererParams) => {
//            if (params.data.isSuperAdmin) return `<span class="text-tertiary italic">Full System Access</span>`;
//            const count = params.value?.length || 0;
//            return `<span class="ag-tag">${count} permission${count !== 1 ? 's' : ''}</span>`;
//         }
//       },
//       {
//         headerName: 'Actions', 
//         colId: 'actions', 
//         width: 120, 
//         pinned: 'right',
//         cellRenderer: (params: ICellRendererParams) => {
//            const disabled = params.data.isSuperAdmin ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
//            return `
//              <div class="flex justify-center py-1">
//                <button class="action-btn action-edit" ${disabled} title="Edit Role">
//                   <i class="pi pi-pencil"></i>
//                </button>
//                <button class="action-btn action-delete" ${disabled} title="Delete Role">
//                   <i class="pi pi-trash"></i>
//                </button>
//              </div>`;
//         }
//       }
//     ];
//   }

//   onGridReady(params: GridReadyEvent) { 
//     this.gridApi = params.api; 
//   }

//   eventFromGrid(event: any) {
//     if (event.type === 'cellClicked') {
//       const rowData = event.row as Role;
//       const nativeEvent = event.event?.event as MouseEvent;
//       const target = nativeEvent?.target as HTMLElement;

//       if (!rowData) return;

//       if (target?.closest('.action-edit')) {
//         this.openEditRoleDialog(rowData);
//         return;
//       }

//       if (target?.closest('.action-delete')) {
//         this.deleteRole(rowData);
//         return;
//       }

//       // Default: Open Edit on cell click (except Actions column)
//       if (event.column?.getColId() !== 'actions') {
//         this.openEditRoleDialog(rowData);
//       }
//     }
//   }

//   // --- Filter Actions ---
//   applyFilters() { this.cdr.markForCheck(); }
//   resetFilters() { this.filterName.set(''); this.cdr.markForCheck(); }

//   // --- UI Toggles for Card-based Design ---

//   /** Toggles a single permission via the card click */
//   togglePermission(tag: string) {
//     const current = this.selectedPermissions();
//     if (current.includes(tag)) {
//       this.selectedPermissions.set(current.filter(t => t !== tag));
//     } else {
//       this.selectedPermissions.set([...current, tag]);
//     }
//   }

//   /** Checks if all items in a group are selected */
//   isGroupSelected(groupName: string): boolean {
//     const group = this.groupedPermissions().find(g => g.name === groupName);
//     if (!group || group.items.length === 0) return false;
//     return group.items.every(item => this.selectedPermissions().includes(item.tag));
//   }

//   /** Gets the count of selected items for a specific group */
//   getGroupSelectionCount(groupName: string): number {
//     const group = this.groupedPermissions().find(g => g.name === groupName);
//     if (!group) return 0;
//     return group.items.filter(item => this.selectedPermissions().includes(item.tag)).length;
//   }

//   /** Selects or deselects all permissions inside a category group */
//   toggleGroup(group: {name: string, items: Permission[]}, event: any) {
//     const isChecked = event.checked;
//     const groupTags = group.items.map(i => i.tag);
//     const currentSelection = this.selectedPermissions();

//     if (isChecked) {
//       // Add all group tags (avoiding duplicates)
//       const newSelection = Array.from(new Set([...currentSelection, ...groupTags]));
//       this.selectedPermissions.set(newSelection);
//     } else {
//       // Remove all group tags
//       const newSelection = currentSelection.filter(tag => !groupTags.includes(tag));
//       this.selectedPermissions.set(newSelection);
//     }
//   }

//   // --- Dialog Actions ---

//   openNewRoleDialog() {
//     this.currentRole.set({});
//     this.selectedPermissions.set([]);
//     this.isEditMode.set(false);
//     this.showRoleDialog.set(true);
//   }

//   openEditRoleDialog(role: Role) {
//     if (role.isSuperAdmin) {
//       this.appMessage.showInfo('Super Admin roles cannot be modified.', 'System Role');
//       return;
//     }
//     this.currentRole.set({ ...role });
//     this.selectedPermissions.set([...(role.permissions || [])]);
//     this.isEditMode.set(true);
//     this.showRoleDialog.set(true);
//   }

//   hideDialog() { 
//     this.showRoleDialog.set(false); 
//   }

//   patchCurrentRole(patch: Partial<Role>) {
//     this.currentRole.update(current => ({ ...current, ...patch }));
//   }

//   saveRole() {
//     const roleData = this.currentRole();
//     if (!roleData.name?.trim()) {
//       this.appMessage.showWarn('Required', 'Please enter a role name');
//       return;
//     }

//     const payload = { 
//       name: roleData.name, 
//       permissions: this.selectedPermissions() 
//     };

//     this.isSaving.set(true);
//     const request$ = this.isEditMode() 
//       ? this.apiService.updateRole(roleData._id!, payload) 
//       : this.apiService.createRole(payload);
    
//     request$.subscribe({
//       next: () => {
//         this.appMessage.showSuccess(`Role ${this.isEditMode() ? 'updated' : 'created'} successfully`);
//         this.loadRoles();
//         this.hideDialog();
//       },
//       error: (err) => {
//         this.appMessage.handleHttpError(err, 'Save Role');
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       },
//       complete: () => {
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       }
//     });
//   }

//   deleteRole(role: Role) {
//     if (role.isSuperAdmin) return;

//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete <b>${role.name}</b>?`,
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger p-button-text',
//       rejectButtonStyleClass: 'p-button-text p-button-secondary',
//       accept: () => {
//         this.apiService.deleteRole(role._id).subscribe({
//           next: () => {
//             this.appMessage.showSuccess('Role removed successfully');
//             this.loadRoles();
//           },
//           error: (err) => this.appMessage.handleHttpError(err, 'Delete Role')
//         });
//       }
//     });
//   }
// }
// // import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { ConfirmationService } from 'primeng/api';

// // // --- Services ---
// // import { ApiService } from '../../../../core/services/api';
// // import { AppMessageService } from '../../../../core/services/message.service'; 

// // // --- PrimeNG Modules ---
// // import { ButtonModule } from 'primeng/button';
// // import { DialogModule } from 'primeng/dialog';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { MultiSelectModule } from 'primeng/multiselect';
// // import { ToastModule } from 'primeng/toast';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { TagModule } from 'primeng/tag';
// // import { DividerModule } from 'primeng/divider';

// // // --- Shared Components & Grid ---
// // import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
// // import { GridApi, ICellRendererParams, GridReadyEvent } from 'ag-grid-community';

// // // --- Interfaces ---
// // export interface Role {
// //   _id: string;
// //   name: string;
// //   isSuperAdmin?: boolean;
// //   isDefault?: boolean;
// //   permissions: string[];
// // }

// // export interface Permission {
// //   tag: string;
// //   description: string;
// //   group: string;
// // }

// // @Component({
// //   selector: 'app-role-management',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     FormsModule,
// //     ButtonModule,
// //     DialogModule,
// //     InputTextModule,
// //     MultiSelectModule,
// //     ToastModule,
// //     ConfirmDialogModule,
// //     TooltipModule,
// //     TagModule,
// //     DividerModule,
// //     AgShareGrid
// //   ],
// //   templateUrl: './role-management.html',
// //   styleUrl: './role-management.scss',
// //   providers: [ConfirmationService],
// //   changeDetection: ChangeDetectionStrategy.OnPush
// // })
// // export class RoleManagementComponent implements OnInit {
// //   // --- Injections ---
// //   private apiService = inject(ApiService);
// //   private appMessage = inject(AppMessageService); 
// //   private confirmationService = inject(ConfirmationService);
// //   private cdr = inject(ChangeDetectorRef);

// //   // --- State Signals ---
// //   roles = signal<Role[]>([]);
// //   permissionsList = signal<Permission[]>([]);
// //   isLoading = signal(false);
// //   isSaving = signal(false);
  
// //   // Filter state
// //   filterName = signal('');

// //   // Dialog state
// //   showRoleDialog = signal(false);
// //   isEditMode = signal(false);
// //   currentRole = signal<Partial<Role>>({});
// //   selectedPermissions = signal<string[]>([]); // Stores permission tags

// //   // --- Computed State (Reactive Selectors) ---
  
// //   /**
// //    * Reactive Filter: Automatically filters roles whenever 'roles' or 'filterName' change.
// //    */
// //   filteredRoles = computed(() => {
// //     const term = this.filterName().toLowerCase().trim();
// //     const allRoles = this.roles();
// //     if (!term) return allRoles;
// //     return allRoles.filter(r => r.name.toLowerCase().includes(term));
// //   });

// //   /**
// //    * MultiSelect Options: Groups permissions for the PrimeNG MultiSelect [group]="true".
// //    */
// //   permissionOptions = computed(() => {
// //     const perms = this.permissionsList();
// //     const groups: Record<string, any[]> = {};
    
// //     perms.forEach(p => {
// //       if (!groups[p.group]) groups[p.group] = [];
// //       groups[p.group].push({ label: p.description, value: p.tag });
// //     });

// //     return Object.keys(groups).sort().map(groupName => ({
// //       label: groupName,
// //       items: groups[groupName]
// //     }));
// //   });

// //   /**
// //    * Grouped Selection: Groups selected permissions for the Visual Summary area in the dialog.
// //    * This provides a clean review UI for administrators.
// //    */
// //   groupedSelectedPermissions = computed(() => {
// //     const selectedTags = this.selectedPermissions();
// //     if (selectedTags.length === 0) return [];

// //     const allPerms = this.permissionsList();
// //     const selectedObjs = allPerms.filter(p => selectedTags.includes(p.tag));
    
// //     const groups: Record<string, Permission[]> = {};
// //     selectedObjs.forEach(p => {
// //       if (!groups[p.group]) groups[p.group] = [];
// //       groups[p.group].push(p);
// //     });

// //     return Object.entries(groups)
// //       .sort(([a], [b]) => a.localeCompare(b))
// //       .map(([name, items]) => ({ name, items }));
// //   });

// //   // --- Grid Config ---
// //   private gridApi!: GridApi;
// //   columns: any[] = [];

// //   ngOnInit(): void {
// //     this.setupColumns();
// //     this.loadRoles();
// //     this.loadPermissions();
// //   }

// //   // --- Data Loading ---

// //   loadRoles(): void {
// //     this.isLoading.set(true);
// //     this.apiService.getRoles().subscribe({next: (res:any) => {
// //         this.roles.set(res.data.roles || []);
// //         this.isLoading.set(false);
// //         this.cdr.markForCheck();
// //       },
// //       error: (err) => {
// //         this.appMessage.handleHttpError(err, 'Fetch Roles');
// //         this.isLoading.set(false);
// //         this.cdr.markForCheck();
// //       }
// //     });
// //   }

// //   loadPermissions(): void {
// //     this.apiService.permissions().subscribe({
// //       next: (res) => this.permissionsList.set(res.data || []),
// //       error: (err) => console.warn('Permissions load failed', err)
// //     });
// //   }

// //   // --- Grid Configuration ---

// //   setupColumns(): void {
// //     this.columns = [
// //       { 
// //         field: 'name', 
// //         headerName: 'Role Name', 
// //         flex: 1, 
// //         cellClass: 'font-semibold text-primary' 
// //       },
// //       {
// //         headerName: 'Type', 
// //         width: 130,
// //         cellRenderer: (params: ICellRendererParams) => {
// //           if (params.data.isSuperAdmin) return `<span class="ag-badge badge-danger">Super Admin</span>`;
// //           if (params.data.isDefault) return `<span class="ag-badge badge-contrast">Default</span>`;
// //           return `<span class="ag-badge badge-info">Custom</span>`;
// //         }
// //       },
// //       {
// //         field: 'permissions', 
// //         headerName: 'Access Scope', 
// //         flex: 2,
// //         cellRenderer: (params: ICellRendererParams) => {
// //            if (params.data.isSuperAdmin) return `<span class="text-tertiary italic">Full System Access</span>`;
// //            const count = params.value?.length || 0;
// //            return `<span class="ag-tag">${count} permission${count !== 1 ? 's' : ''}</span>`;
// //         }
// //       },
// //       {
// //         headerName: 'Actions', 
// //         colId: 'actions', 
// //         width: 100, 
// //         pinned: 'right',
// //         cellRenderer: (params: ICellRendererParams) => {
// //            const disabled = params.data.isSuperAdmin ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
// //            return `
// //              <div class="flex gap-2 justify-center py-1">
// //                <button class="action-btn action-edit" ${disabled} title="Edit Role">
// //                   <i class="pi pi-pencil"></i>
// //                </button>
// //                <button class="action-btn action-delete" ${disabled} title="Delete Role">
// //                   <i class="pi pi-trash"></i>
// //                </button>
// //              </div>`;
// //         }
// //       }
// //     ];
// //   }

// //   onGridReady(params: GridReadyEvent) { 
// //     this.gridApi = params.api; 
// //   }

// //   eventFromGrid(event: any) {
// //     if (event.type === 'cellClicked') {
// //       const rowData = event.row as Role;
// //       const nativeEvent = event.event?.event as MouseEvent;
// //       const target = nativeEvent?.target as HTMLElement;

// //       if (!rowData) return;

// //       if (target?.closest('.action-edit')) {
// //         this.openEditRoleDialog(rowData);
// //         return;
// //       }

// //       if (target?.closest('.action-delete')) {
// //         this.deleteRole(rowData);
// //         return;
// //       }

// //       // Default: Open Edit on cell click (except Actions column)
// //       if (event.column?.getColId() !== 'actions') {
// //         this.openEditRoleDialog(rowData);
// //       }
// //     }
// //   }

// //   // --- Filter Actions ---

// //   applyFilters() { 
// //     this.cdr.markForCheck();
// //   }
  
// //   resetFilters() { 
// //     this.filterName.set(''); 
// //     this.cdr.markForCheck();
// //   }

// //   // --- Dialog Actions ---

// //   openNewRoleDialog() {
// //     this.currentRole.set({});
// //     this.selectedPermissions.set([]);
// //     this.isEditMode.set(false);
// //     this.showRoleDialog.set(true);
// //   }

// //   openEditRoleDialog(role: Role) {
// //     if (role.isSuperAdmin) {
// //       this.appMessage.showInfo('Super Admin roles cannot be modified.', 'System Role');
// //       return;
// //     }
// //     this.currentRole.set({ ...role });
// //     this.selectedPermissions.set([...(role.permissions || [])]);
// //     this.isEditMode.set(true);
// //     this.showRoleDialog.set(true);
// //   }

// //   hideDialog() { 
// //     this.showRoleDialog.set(false); 
// //   }

// //   /**
// //    * Helper to update currentRole signal from template safely.
// //    * Resolves compiler issues with object spreads inside HTML templates.
// //    */
// //   patchCurrentRole(patch: Partial<Role>) {
// //     this.currentRole.update(current => ({ ...current, ...patch }));
// //   }

// //   saveRole() {
// //     const roleData = this.currentRole();
// //     if (!roleData.name?.trim()) {
// //       this.appMessage.showWarn('Required', 'Please enter a role name');
// //       return;
// //     }

// //     const payload = { 
// //       name: roleData.name, 
// //       permissions: this.selectedPermissions() 
// //     };

// //     this.isSaving.set(true);
// //     const request$ = this.isEditMode() 
// //       ? this.apiService.updateRole(roleData._id!, payload) 
// //       : this.apiService.createRole(payload);
    
// //     request$.subscribe({
// //       next: () => {
// //         this.appMessage.showSuccess(`Role ${this.isEditMode() ? 'updated' : 'created'} successfully`);
// //         this.loadRoles();
// //         this.hideDialog();
// //       },
// //       error: (err) => {
// //         this.appMessage.handleHttpError(err, 'Save Role');
// //         this.isSaving.set(false);
// //         this.cdr.markForCheck();
// //       },
// //       complete: () => {
// //         this.isSaving.set(false);
// //         this.cdr.markForCheck();
// //       }
// //     });
// //   }

// //   deleteRole(role: Role) {
// //     if (role.isSuperAdmin) return;

// //     this.confirmationService.confirm({
// //       message: `Are you sure you want to delete <b>${role.name}</b>?`,
// //       header: 'Confirm Delete',
// //       icon: 'pi pi-exclamation-triangle',
// //       acceptButtonStyleClass: 'p-button-danger p-button-text',
// //       rejectButtonStyleClass: 'p-button-text p-button-secondary',
// //       accept: () => {
// //         this.apiService.deleteRole(role._id).subscribe({
// //           next: () => {
// //             this.appMessage.showSuccess('Role removed successfully');
// //             this.loadRoles();
// //           },
// //           error: (err) => this.appMessage.handleHttpError(err, 'Delete Role')
// //         });
// //       }
// //     });
// //   }
// // }
// // // import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormsModule } from '@angular/forms';
// // // import { ApiService } from '../../../../core/services/api';
// // // import { AppMessageService } from '../../../../core/services/message.service';
// // // import { ConfirmationService } from 'primeng/api';

// // // // --- AG Grid ---
// // // import { GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';

// // // // --- PrimeNG Modules ---
// // // import { ButtonModule } from 'primeng/button';
// // // import { DialogModule } from 'primeng/dialog';
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { MultiSelectModule } from 'primeng/multiselect';
// // // import { ToastModule } from 'primeng/toast';
// // // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // // import { TooltipModule } from 'primeng/tooltip';
// // // import { TagModule } from 'primeng/tag';
// // // import { DividerModule } from 'primeng/divider';
// // // import { AgShareGrid } from "../../../shared/components/ag-shared-grid"; // Added Divider

// // // @Component({
// // //   selector: 'app-role-management',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     FormsModule,

// // //     ButtonModule,
// // //     DialogModule,
// // //     InputTextModule,
// // //     MultiSelectModule,
// // //     ToastModule,
// // //     ConfirmDialogModule,
// // //     TooltipModule,
// // //     TagModule,
// // //     DividerModule,
// // //     AgShareGrid
// // // ],
// // //   templateUrl: './role-management.html',
// // //   styleUrl: './role-management.scss',
// // //   providers: [ConfirmationService]
// // // })
// // // export class RoleManagementComponent implements OnInit {
// // //   // --- Injections ---
// // //   private apiService = inject(ApiService);
// // //   private messageService = inject(AppMessageService);
// // //   private confirmationService = inject(ConfirmationService);
// // //   private cdr = inject(ChangeDetectorRef);

// // //   // --- Grid State ---
// // //   private gridApi!: GridApi;
// // //   data: any[] = [];
// // //   column: any[] = [];
// // //   isLoading = false;
// // //   rowSelectionMode: 'single' | 'multiple' = 'single';

// // //   // --- Filter ---
// // //   roleFilter = { name: '' };

// // //   // --- Dialog State ---
// // //   showRoleDialog = false;
// // //   isEditMode = false;
// // //   currentRole: any = {};
  
// // //   // Permissions Data
// // //   allPermissionsList: any[] = [];
// // //   selectedPermissions: string[] = []; // Stores tags like 'invoice:read'
// // //   permissionOptions: any[] = [];      // For dropdown

// // //   ngOnInit(): void {
// // //     this.setupColumns();
// // //     this.loadRoles();
// // //     this.loadPermissions();
// // //   }

// // //   // --- Getters for UI ---
  
// // //   // This helps visualize the selected permissions grouped by category
// // //   get groupedSelectedPermissions() {
// // //     if (!this.selectedPermissions || this.selectedPermissions.length === 0) return [];

// // //     // 1. Find full objects for selected tags
// // //     const selectedObjs = this.allPermissionsList.filter(p => this.selectedPermissions.includes(p.tag));

// // //     // 2. Group them
// // //     const groups: { [key: string]: any[] } = {};
// // //     selectedObjs.forEach(p => {
// // //       if (!groups[p.group]) groups[p.group] = [];
// // //       groups[p.group].push(p);
// // //     });

// // //     // 3. Return array sorted by group name
// // //     return Object.keys(groups).sort().map(groupName => ({
// // //       name: groupName,
// // //       items: groups[groupName]
// // //     }));
// // //   }

// // //   // ... (Existing loadRoles, loadPermissions, etc. remain the same) ...
// // //   loadRoles(isReset: boolean = false): void {
// // //     if (this.isLoading) return;
// // //     this.isLoading = true;
// // //     this.apiService.getRoles().subscribe({
// // //       next: (res) => {
// // //         let roles = res.data.roles || [];
// // //         if (this.roleFilter.name) {
// // //           roles = roles.filter((r: any) => r.name.toLowerCase().includes(this.roleFilter.name.toLowerCase()));
// // //         }
// // //         this.data = roles;
// // //         this.isLoading = false;
// // //         this.cdr.markForCheck();
// // //       },
// // //       error: () => {
// // //         this.isLoading = false;
// // //         this.messageService.showError('Error', 'Failed to fetch roles.');
// // //       }
// // //     });
// // //   }

// // //   loadPermissions(): void {
// // //     this.apiService.permissions().subscribe({
// // //       next: (res) => {
// // //         this.allPermissionsList = res.data;
// // //         // Transform for PrimeNG MultiSelect (Grouped)
// // //         // Grouping requires a flat list with 'group' property or nested structure.
// // //         // PrimeNG [group]="true" expects: [{ label: 'Group A', items: [...] }, ...]
        
// // //         // Let's build that structure manually for better control
// // //         const groups: {[key:string]: any[]} = {};
// // //         this.allPermissionsList.forEach(p => {
// // //            if(!groups[p.group]) groups[p.group] = [];
// // //            groups[p.group].push({ label: p.description, value: p.tag });
// // //         });

// // //         this.permissionOptions = Object.keys(groups).sort().map(g => ({
// // //            label: g,
// // //            items: groups[g]
// // //         }));
// // //       }
// // //     });
// // //   }
// // // setupColumns(): void {
// // //   this.column = [
// // //     { 
// // //       field: 'name', 
// // //       headerName: 'Role Name', 
// // //       flex: 1, 
// // //       // Use project class instead of inline style object
// // //       cellClass: 'font-semibold text-primary' 
// // //     },
// // //     {
// // //       headerName: 'Type', 
// // //       width: 130,
// // //       cellRenderer: (params: ICellRendererParams) => {
// // //         // Ensuring system badges follow global theme tokens
// // //         if (params.data.isSuperAdmin) return `<span class="ag-badge badge-danger">Super Admin</span>`;
// // //         if (params.data.isDefault) return `<span class="ag-badge badge-contrast">Default</span>`;
// // //         return `<span class="ag-badge badge-info">Custom</span>`;
// // //       }
// // //     },
// // //     {
// // //       field: 'permissions', 
// // //       headerName: 'Access Scope', 
// // //       flex: 2,
// // //       cellRenderer: (params: ICellRendererParams) => {
// // //          if (params.data.isSuperAdmin) return `<span class="text-tertiary italic">Full System Access</span>`;
// // //          return `<span class="ag-tag">${params.value?.length || 0} permissions</span>`;
// // //       }
// // //     },
// // //     {
// // //       headerName: 'Actions', 
// // //       colId: 'actions', // Added colId for exclusion logic
// // //       width: 100, 
// // //       pinned: 'right',
// // //       cellRenderer: (params: ICellRendererParams) => {
// // //          const disabled = params.data.isSuperAdmin ? 'disabled' : '';
// // //          return `
// // //            <div class="flex gap-2 justify-center py-1">
// // //              <button class="action-btn action-edit" ${disabled} title="Edit Role">
// // //                 <i class="pi pi-pencil"></i>
// // //              </button>
// // //              <button class="action-btn action-delete" ${disabled} title="Delete Role">
// // //                 <i class="pi pi-trash"></i>
// // //              </button>
// // //            </div>`;
// // //       }
// // //     }
// // //   ];
// // // }
// // //   onGridReady(params: GridReadyEvent) { this.gridApi = params.api; }

// // //   // --- IN ROLE-MANAGEMENT.TS ---

// // // // --- UPDATED IN ROLE-MANAGEMENT.TS ---

// // // eventFromGrid(event: any) {
// // //   // Audit: Aligning with AgShareGrid's custom event emission structure
// // //   if (event.type === 'cellClicked') {
// // //     const rowData = event.row; // The key provided by your shared grid
// // //     const nativeEvent = event.event?.event; // Accessing the original MouseEvent
// // //     const target = nativeEvent?.target as HTMLElement;

// // //     if (!rowData) return;

// // //     // 1. Specific Button Click Detection (using closest for icon clicks)
// // //     if (target?.closest('.action-edit')) {
// // //       this.openEditRoleDialog(rowData);
// // //       return;
// // //     }

// // //     if (target?.closest('.action-delete')) {
// // //       this.deleteRole(rowData);
// // //       return;
// // //     }

// // //     // 2. Default Fallback: Open Edit dialog on general cell click 
// // //     // (excluding the actions column to prevent double-triggering)
// // //     if (event.column?.getColId() !== 'actions') {
// // //       this.openEditRoleDialog(rowData);
// // //     }
// // //   }
  
// // //   if (event.type === 'reachedBottom') {
// // //     // Logic for infinite scroll if implemented
// // //     // this.loadMoreRoles(); 
// // //   }
// // // }
// // //   // eventFromGrid(event: any) {
// // //   //   console.log(event);
// // //   //   if (event.type=== 'cellClicked') {
// // //   //     const target = event.event.event.target;
// // //   //     if (target.closest('.action-edit')) this.openEditRoleDialog(event.event.data);
// // //   //     if (target.closest('.action-delete')) this.deleteRole(event.event.data);
// // //   //   }
// // //   // }

// // //   // --- Actions ---
// // //   applyFilters() { this.loadRoles(true); }
// // //   resetFilters() { this.roleFilter.name = ''; this.loadRoles(true); }

// // //   openNewRoleDialog() {
// // //     this.currentRole = {};
// // //     this.selectedPermissions = [];
// // //     this.isEditMode = false;
// // //     this.showRoleDialog = true;
// // //   }

// // //   openEditRoleDialog(role: any) {
// // //     if (role.isSuperAdmin) return;
// // //     this.currentRole = { ...role };
// // //     this.selectedPermissions = [...(role.permissions || [])];
// // //     this.isEditMode = true;
// // //     this.showRoleDialog = true;
// // //   }

// // //   hideDialog() { this.showRoleDialog = false; }

// // //   saveRole() {
// // //     if (!this.currentRole.name?.trim()) {
// // //       this.messageService.showWarn('Required', 'Enter a role name');
// // //       return;
// // //     }
// // //     const payload = { name: this.currentRole.name, permissions: this.selectedPermissions };
// // //     const req$ = this.isEditMode ? this.apiService.updateRole(this.currentRole._id, payload) : this.apiService.createRole(payload);
    
// // //     this.isLoading = true;
// // //     req$.subscribe({
// // //       next: () => {
// // //         this.messageService.showSuccess('Saved', 'Role saved successfully');
// // //         this.loadRoles();
// // //         this.hideDialog();
// // //       },
// // //       error: () => this.isLoading = false
// // //     }).add(() => this.isLoading = false);
// // //   }

// // //   deleteRole(role: any) {
// // //     this.confirmationService.confirm({
// // //       message: `Delete ${role.name}?`,
// // //       accept: () => {
// // //         this.apiService.deleteRole(role._id).subscribe(() => {
// // //           this.messageService.showSuccess('Deleted', 'Role removed');
// // //           this.loadRoles();
// // //         });
// // //       }
// // //     });
// // //   }
// // // }
