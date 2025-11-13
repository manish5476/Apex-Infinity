import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service';
import { ConfirmationService } from 'primeng/api';

// --- PrimeNG Modules ---
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    TagModule,
    SkeletonModule
  ],
  templateUrl: './role-management.html',
  styleUrl: './role-management.scss',
  providers: [ConfirmationService] // AppMessageService is already root
})
export class RoleManagementComponent implements OnInit {
  // --- Injections ---
  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  // --- State ---
  roles: any[] = [];
  isLoading = false;

  // --- Dialog State ---
  showRoleDialog = false;
  isEditMode = false;
  currentRole: any = {};
  selectedPermissions: string[] = [];

  // --- Master Data (from your schema) ---
  allPermissionsList: string[] = [
    'read_users', 'create_users', 'update_users', 'delete_users',
    'read_products', 'create_products', 'update_products', 'delete_products',
    'read_customers', 'create_customers', 'update_customers', 'delete_customers',
    'read_invoices', 'create_invoices', 'update_invoices', 'delete_invoices',
    'read_purchases', 'create_purchases',
    'read_branches', 'create_branches', 'update_branches',
    'read_roles', 'create_roles', 'update_roles', 'delete_roles'
  ];

  // Formatted for the p-multiSelect component
  permissionOptions: { label: string; value: string; group: string }[] = [];

  ngOnInit(): void {
    // Transform the string array into an object array for the dropdown
    this.permissionOptions = this.allPermissionsList.map(permission => ({
      label: this.formatPermissionName(permission),
      value: permission,
      group: this.getPermissionGroup(permission)
    }));
    
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.apiService.getRoles().subscribe({
      next: (res) => {
        this.roles = res.data.roles;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        // Error toast is handled by interceptor
      }
    });
  }

  formatPermissionName(permission: string): string {
    return permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  getPermissionGroup(permission: string): string {
    const group = permission.split('_')[1]; // e.g., 'users', 'products'
    return group.charAt(0).toUpperCase() + group.slice(1);
  }

  // --- Dialog Methods ---

  openNewRoleDialog(): void {
    this.currentRole = {};
    this.selectedPermissions = [];
    this.isEditMode = false;
    this.showRoleDialog = true;
  }

  openEditRoleDialog(role: any): void {
    if (role.isSuperAdmin) {
      this.messageService.showWarn('Not Allowed', 'The Super Admin role cannot be edited.');
      return;
    }
    this.currentRole = { ...role }; // Create a copy
    this.selectedPermissions = [...role.permissions];
    this.isEditMode = true;
    this.showRoleDialog = true;
  }

  hideDialog(): void {
    this.showRoleDialog = false;
    this.currentRole = {};
  }

  saveRole(): void {
    if (!this.currentRole.name || this.currentRole.name.trim() === '') {
      this.messageService.showWarn('Validation Error', 'Role name is required.');
      return;
    }

    this.isLoading = true;
    const payload = {
      name: this.currentRole.name,
      permissions: this.selectedPermissions
    };

    const request$ = this.isEditMode
      ? this.apiService.updateRole(this.currentRole._id, payload)
      : this.apiService.createRole(payload);

    request$.subscribe({
      next: () => {
        this.messageService.showSuccess('Success', `Role ${this.isEditMode ? 'updated' : 'created'} successfully.`);
        this.loadRoles();
        this.hideDialog();
      },
      error: (err) => {
        this.isLoading = false;
        // Error toast handled by interceptor
      }
    }).add(() => this.isLoading = false); // Ensure loading is turned off
  }

  // --- Delete Method ---

  deleteRole(role: any): void {
    if (role.isSuperAdmin || role.isDefault) {
      this.messageService.showError('Not Allowed', 'Default or Super Admin roles cannot be deleted.');
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, delete',
      rejectLabel: 'Cancel',
      accept: () => {
        this.isLoading = true;
        this.apiService.deleteRole(role._id).subscribe({
          next: () => {
            this.messageService.showSuccess('Success', `Role "${role.name}" deleted.`);
            this.loadRoles();
          },
          error: (err) => {
            this.isLoading = false;
            // Error toast handled by interceptor
          }
        }).add(() => this.isLoading = false);
      }
    });
  }
}

// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ApiService } from '../../../../core/services/api';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { ConfirmationService } from 'primeng/api';

// // --- PrimeNG Modules ---
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { DialogModule } from 'primeng/dialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { TooltipModule } from 'primeng/tooltip';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';

// @Component({
//   selector: 'app-role-management',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     TableModule,
//     ButtonModule,
//     DialogModule,
//     InputTextModule,
//     MultiSelectModule,
//     ToastModule,
//     ConfirmDialogModule,
//     TooltipModule,
//     TagModule,
//     SkeletonModule
//   ],
//   templateUrl: './role-management.html',
//   styleUrl: './role-management.scss',
//   providers: [ConfirmationService] // AppMessageService is already root
// })
// export class RoleManagementComponent implements OnInit {
//   // --- Injections ---
//   private apiService = inject(ApiService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);

//   // --- State ---
//   roles: any[] = [];
//   isLoading = false;

//   // --- Dialog State ---
//   showRoleDialog = false;
//   isEditMode = false;
//   currentRole: any = {};
//   selectedPermissions: string[] = [];

//   // --- Master Data (from your schema) ---
//   allPermissionsList: string[] = [
//     'read_users', 'create_users', 'update_users', 'delete_users',
//     'read_products', 'create_products', 'update_products', 'delete_products',
//     'read_customers', 'create_customers', 'update_customers', 'delete_customers',
//     'read_invoices', 'create_invoices', 'update_invoices', 'delete_invoices',
//     'read_purchases', 'create_purchases',
//     'read_branches', 'create_branches', 'update_branches',
//     'read_roles', 'create_roles', 'update_roles', 'delete_roles'
//   ];

//   // Formatted for the p-multiSelect component
//   permissionOptions: { label: string; value: string; group: string }[] = [];

//   ngOnInit(): void {
//     // Transform the string array into an object array for the dropdown
//     this.permissionOptions = this.allPermissionsList.map(permission => ({
//       label: this.formatPermissionName(permission),
//       value: permission,
//       group: this.getPermissionGroup(permission)
//     }));
    
//     this.loadRoles();
//   }

//   loadRoles(): void {
//     this.isLoading = true;
//     this.apiService.getRoles().subscribe({
//       next: (res) => {
//         this.roles = res.data.roles;
//         this.isLoading = false;
//       },
//       error: (err) => {
//         this.isLoading = false;
//         // Error toast is handled by interceptor
//       }
//     });
//   }

//   formatPermissionName(permission: string): string {
//     return permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
//   }
  
//   getPermissionGroup(permission: string): string {
//     const group = permission.split('_')[1]; // e.g., 'users', 'products'
//     return group.charAt(0).toUpperCase() + group.slice(1);
//   }

//   // --- Dialog Methods ---

//   openNewRoleDialog(): void {
//     this.currentRole = {};
//     this.selectedPermissions = [];
//     this.isEditMode = false;
//     this.showRoleDialog = true;
//   }

//   openEditRoleDialog(role: any): void {
//     if (role.isSuperAdmin) {
//       this.messageService.showWarn('Not Allowed', 'The Super Admin role cannot be edited.');
//       return;
//     }
//     this.currentRole = { ...role }; // Create a copy
//     this.selectedPermissions = [...role.permissions];
//     this.isEditMode = true;
//     this.showRoleDialog = true;
//   }

//   hideDialog(): void {
//     this.showRoleDialog = false;
//     this.currentRole = {};
//   }

//   saveRole(): void {
//     if (!this.currentRole.name || this.currentRole.name.trim() === '') {
//       this.messageService.showWarn('Validation Error', 'Role name is required.');
//       return;
//     }

//     this.isLoading = true;
//     const payload = {
//       name: this.currentRole.name,
//       permissions: this.selectedPermissions
//     };

//     const request$ = this.isEditMode
//       ? this.apiService.updateRole(this.currentRole._id, payload)
//       : this.apiService.createRole(payload);

//     request$.subscribe({
//       next: () => {
//         this.messageService.showSuccess('Success', `Role ${this.isEditMode ? 'updated' : 'created'} successfully.`);
//         this.loadRoles();
//         this.hideDialog();
//       },
//       error: (err) => {
//         this.isLoading = false;
//         // Error toast handled by interceptor
//       }
//     }).add(() => this.isLoading = false); // Ensure loading is turned off
//   }

//   // --- Delete Method ---

//   deleteRole(role: any): void {
//     if (role.isSuperAdmin || role.isDefault) {
//       this.messageService.showError('Not Allowed', 'Default or Super Admin roles cannot be deleted.');
//       return;
//     }

//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
//       header: 'Confirm Deletion',
//       icon: 'pi pi-exclamation-triangle',
//       acceptLabel: 'Yes, delete',
//       rejectLabel: 'Cancel',
//       accept: () => {
//         this.isLoading = true;
//         this.apiService.deleteRole(role._id).subscribe({
//           next: () => {
//             this.messageService.showSuccess('Success', `Role "${role.name}" deleted.`);
//             this.loadRoles();
//           },
//           error: (err) => {
//             this.isLoading = false;
//             // Error toast handled by interceptor
//           }
//         }).add(() => this.isLoading = false);
//       }
//     });
//   }
// }