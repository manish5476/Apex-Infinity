import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

/* PrimeNG v18 Modules */
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';

/* Services */
import { AuthService } from '../../../auth/services/auth-service';
import { OrganizationService } from '../../organization.service';
import { MasterListService } from '../../../../core/services/master-list.service';

/* Shared Grid */
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

@Component({
  selector: 'app-org-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    // PrimeNG
    ButtonModule,
    InputTextModule,
    TableModule,
    DialogModule,
    TabsModule,
    ConfirmDialogModule,
    TagModule,
    TimelineModule,
    AvatarModule,
    DividerModule,
    TooltipModule,
    SelectModule,
    BadgeModule,
    ToastModule,
    AgShareGrid
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './org-settings.html',
  styleUrl: './org-settings.scss',
})
export class OrgSettingsComponent implements OnInit {
  // Dependencies
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private masterList = inject(MasterListService);

  // Signals
  isLoading = signal(true);
  isSaving = signal(false);
  activeTabValue = signal('0');

  // Data Signals
  organization = signal<any>(null);
  activeMembers = signal<any[]>([]);
  pendingMembers = signal<any[]>([]);
  activityLogs = signal<any[]>([]);

  // Grid Props
  column: any[] = [];

  // Computed: Determines if current user is the owner
  isOwner = computed(() => {
    const org = this.organization();
    const currentUser = this.authService.getCurrentUser();
    if (!org || !currentUser) return false;
    const ownerId = org.owner?._id || org.owner;
    return ownerId === currentUser._id;
  });

  // Forms
  orgForm!: FormGroup;
  inviteForm!: FormGroup;
  transferForm!: FormGroup;

  // Dialog State
  showInviteDialog = false;
  showTransferDialog = false;

  // Data
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};
  roles: any[] = [];
  branches: any[] = [];

  availableRoles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Member', value: 'member' }
  ];

  constructor() {
    // Reactively update grid columns when organization data is loaded
    effect(() => {
      if (this.organization()) {
        this.initGridColumns();
      }
    });
  }

  ngOnInit() {
    this.initForms();
    this.loadData();
    this.roles = this.masterList.roles();
    this.branches = this.masterList.branches();
  }

  private initForms() {
    this.orgForm = this.fb.group({
      name: ['', Validators.required],
      primaryEmail: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', Validators.required],
      gstNumber: [''],
    });

    this.inviteForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: [null, Validators.required],
      branchId: [null]
    });

    this.transferForm = this.fb.group({
      newOwnerId: [null, Validators.required],
      confirmName: ['', Validators.required]
    });
  }

  // --- Grid Column Definition ---
  initGridColumns() {
    const ownerId = this.organization()?.owner?._id || this.organization()?.owner;

    this.column = [
      {
        field: 'name',
        headerName: 'User',
        flex: 2,
        minWidth: 250,
        cellRenderer: (params: any) => {
          if (!params.value) return '';
          const initials = this.getInitials(params.value);
          const isOwner = params.data._id === ownerId;

          return `
          <div class="user-cell-wrapper">
            <div class="user-avatar-circle">${initials}</div>
            <div class="user-info">
              ${isOwner ? `<span class="owner-icon-small" title="Organization Owner"><i class="pi pi-shield-fill"></i></span>` : ''}
              <span class="user-name" title="${params.value}">${params.value}</span>
            </div>
          </div>
        `;
        }
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 2,
        minWidth: 200,
        cellStyle: { color: 'var(--text-secondary)' }
      },
      {
        field: 'role.name',
        headerName: 'Role',
        width: 150,
        cellRenderer: (params: any) => {
          const role = params.value || 'Member';
          const isOwner = params.data._id === ownerId;
          // If it's owner, we might want to show Admin styling
          const styleClass = (role === 'Admin' || isOwner) ? 'badge-info' : 'badge-secondary';
          return `<span class="ag-badge ${styleClass}">${role}</span>`;
        }
      },
      // {
      //   headerName: 'Actions',
      //   width: 100,
      //   type: 'rightAligned',
      //   cellRenderer: (params: any) => {
      //     // Can't delete owner
      //     if (params.data._id === ownerId) return '';
      //     return `
      //       <div class="flex justify-end gap-2">
      //          <button class="action-btn delete-btn" (click)="eventFromGrid($event)" data-action="delete" title="Remove Member">
      //            <i class="pi pi-trash"></i>
      //          </button>
      //       </div>
      //     `;
      //   }
      // }
    ];
  }

  eventFromGrid(event: any) {
    console.log(event);
    if (event.type === 'delete') {
      const rowData = event.row
      this.removeMember(rowData._id);
    }
  }

  loadData() {
    forkJoin({
      org: this.orgService.getMyOrganization(),
      pending: this.orgService.getPendingMembers(),
      logs: this.orgService.getActivityLog()
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          const orgData = res.org.data;
          this.organization.set(orgData);

          this.orgForm.patchValue({
            name: orgData.name,
            primaryEmail: orgData.primaryEmail,
            primaryPhone: orgData.primaryPhone,
            gstNumber: orgData.gstNumber
          });

          if (orgData.members) {
            this.activeMembers.set(orgData.members.filter((m: any) => m.status === 'approved'));
          }

          this.pendingMembers.set(res.pending.data?.pendingMembers || []);
          this.activityLogs.set(res.logs.data?.logs || []);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load organization data.' });
        }
      });
  }

  // --- ACTIONS ---

  updateOrgDetails() {
    if (this.orgForm.invalid) return;
    this.orgService.updateMyOrganization(this.orgForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Organization details saved.' }),
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Update failed' })
      });
  }

  inviteUser() {
    if (this.inviteForm.invalid) return;

    const payload = {
      ...this.inviteForm.value,
      branchId: this.organization().mainBranch
    };

    this.orgService.inviteUser(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Invited', detail: 'Invitation sent successfully.' });
          this.showInviteDialog = false;
          this.inviteForm.reset();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
      });
  }

  approveMember(userId: string) {
    const roleId = this.selectedRoles[userId];
    const branchId = this.selectedBranches[userId];

    if (!roleId || !branchId) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Info', detail: 'Please select a role and branch.' });
      return;
    }

    this.orgService.approveMember({ userId, branchId, roleId }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Member has been added.' });
        this.loadData();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
    });
  }

  removeMember(memberId: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to remove this member? They will lose access immediately.',
      header: 'Revoke Access',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.removeMember(memberId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'Member removed successfully.' });
            this.loadData();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }

  transferOwnership() {
    if (this.transferForm.invalid) return;

    this.confirmationService.confirm({
      message: 'This action is irreversible. You will become a regular admin.',
      header: 'Transfer Ownership',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.transferOwnership(this.transferForm.value.newOwnerId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Transferred', detail: 'Ownership updated.' });
            window.location.reload();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }

  deleteOrganization() {
    const orgId = this.organization()?._id;

    if (!orgId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Organization ID not found.' });
      return;
    }

    this.confirmationService.confirm({
      message: 'This will permanently delete the organization and all associated data. This cannot be undone.',
      header: 'DELETE ORGANIZATION',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.deleteOrganization(orgId).subscribe({
          next: () => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }

  // --- HELPERS ---
  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }

  onTabChange(event: any) {
    this.activeTabValue.set(event);
  }
}
// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { forkJoin } from 'rxjs';
// import { finalize } from 'rxjs/operators';

// /* PrimeNG v18 Modules */
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TableModule } from 'primeng/table';
// import { DialogModule } from 'primeng/dialog';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService, MessageService } from 'primeng/api';
// import { TagModule } from 'primeng/tag';
// import { TimelineModule } from 'primeng/timeline';
// import { AvatarModule } from 'primeng/avatar';
// import { TabsModule } from 'primeng/tabs';
// import { DividerModule } from 'primeng/divider';
// import { TooltipModule } from 'primeng/tooltip';
// import { SelectModule } from 'primeng/select';
// import { BadgeModule } from 'primeng/badge';
// import { ToastModule } from 'primeng/toast'; // Use ToastModule, not just Toast component

// /* Services */
// import { AuthService } from '../../../auth/services/auth-service';
// import { OrganizationService } from '../../organization.service';
// import { MasterListService } from '../../../../core/services/master-list.service';

// @Component({
//   selector: 'app-org-settings',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,FormsModule,
//     // PrimeNG
//     ButtonModule,
//     InputTextModule,
//     TableModule,
//     DialogModule,
//     TabsModule,
//     ConfirmDialogModule,
//     TagModule,
//     TimelineModule,
//     AvatarModule,
//     DividerModule,
//     TooltipModule,
//     SelectModule,
//     BadgeModule,
//     ToastModule
//   ],
//   providers: [ConfirmationService, MessageService],
//   templateUrl: './org-settings.html',
//   styleUrl: './org-settings.scss',
// })
// export class OrgSettingsComponent implements OnInit {
//   // Dependencies
//   private orgService = inject(OrganizationService);
//   private authService = inject(AuthService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);
//   private confirmationService = inject(ConfirmationService);
//   private router = inject(Router);
//   selectedRoles: { [userId: string]: string } = {};
//   selectedBranches: { [userId: string]: string } = {};
//   roles: any[] = [];
//   branches: any[] = [];

//   private masterList = inject(MasterListService);

//   // Signals
//   isLoading = signal(true);
//   isSaving = signal(false);
//   activeTabValue = signal('0');

//   // Data Signals
//   organization = signal<any>(null);
//   activeMembers = signal<any[]>([]);
//   pendingMembers = signal<any[]>([]);
//   activityLogs = signal<any[]>([]);

//   // Computed: Determines if current user is the owner
//   isOwner = computed(() => {
//     const org = this.organization();
//     // Ensure you added getCurrentUser() to AuthService as per previous step!
//     const currentUser = this.authService.getCurrentUser();

//     if (!org || !currentUser) return false;
//     // Check nested owner object or direct ID depending on your backend population
//     const ownerId = org.owner?._id || org.owner;
//     return ownerId === currentUser._id;
//   });

//   // Forms
//   orgForm!: FormGroup;
//   inviteForm!: FormGroup;
//   transferForm!: FormGroup;

//   // Dialog State
//   showInviteDialog = false;
//   showTransferDialog = false;

//   // Mock Data
//   availableRoles = [
//     { label: 'Admin', value: 'admin' },
//     { label: 'Member', value: 'member' }
//   ];

//   ngOnInit() {
//     this.initForms();
//     this.loadData();

//     this.roles = this.masterList.roles();
//     this.branches = this.masterList.branches();
//   }

//   private initForms() {
//     this.orgForm = this.fb.group({
//       name: ['', Validators.required],
//       primaryEmail: ['', [Validators.required, Validators.email]],
//       primaryPhone: ['', Validators.required],
//       gstNumber: [''],
//     });

//     this.inviteForm = this.fb.group({
//       name: ['', Validators.required],
//       email: ['', [Validators.required, Validators.email]],
//       role: [null, Validators.required],
//       branchId: [null]
//     });

//     this.transferForm = this.fb.group({
//       newOwnerId: [null, Validators.required],
//       confirmName: ['', Validators.required]
//     });
//   }

//   loadData() {
//     // forkJoin to get Org Data, Pending Members, and Logs
//     forkJoin({
//       org: this.orgService.getMyOrganization(),
//       pending: this.orgService.getPendingMembers(),
//       logs: this.orgService.getActivityLog()
//     })
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe({
//         next: (res: any) => {
//           // 1. Handle Organization & Active Members
//           const orgData = res.org.data;
//           this.organization.set(orgData);

//           this.orgForm.patchValue({
//             name: orgData.name,
//             primaryEmail: orgData.primaryEmail,
//             primaryPhone: orgData.primaryPhone,
//             gstNumber: orgData.gstNumber
//           });

//           if (orgData.members) {
//             this.activeMembers.set(orgData.members.filter((m: any) => m.status === 'approved'));
//           }

//           // 2. Handle Pending Requests
//           this.pendingMembers.set(res.pending.data?.pendingMembers || []);

//           // 3. Handle Logs
//           this.activityLogs.set(res.logs.data?.logs || []);
//         },
//         error: (err) => {
//           this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load organization data.' });
//           console.error(err);
//         }
//       });
//   }

//   // --- ACTIONS ---

//   updateOrgDetails() {
//     if (this.orgForm.invalid) return;

//     this.orgService.updateMyOrganization(this.orgForm.value)
//       .pipe(finalize(() => this.isSaving.set(false)))
//       .subscribe({
//         next: () => this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Organization details saved.' }),
//         error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Update failed' })
//       });
//   }

//   inviteUser() {
//     if (this.inviteForm.invalid) return;

//     const payload = {
//       ...this.inviteForm.value,
//       branchId: this.organization().mainBranch // Default to main branch
//     };

//     this.orgService.inviteUser(payload)
//       .pipe(finalize(() => this.isSaving.set(false)))
//       .subscribe({
//         next: () => {
//           this.messageService.add({ severity: 'success', summary: 'Invited', detail: 'Invitation sent successfully.' });
//           this.showInviteDialog = false;
//           this.inviteForm.reset();
//         },
//         error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
//       });
//   }
//   approveMember(userId: string) {
//     const roleId = this.selectedRoles[userId];
//     const branchId = this.selectedBranches[userId];

//     if (!roleId || !branchId) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Missing Info',
//         detail: 'Please select a role and branch.'
//       });
//       return;
//     }

//     this.orgService.approveMember({ userId, branchId, roleId }).subscribe({
//       next: () => {
//         this.messageService.add({
//           severity: 'success',
//           summary: 'Approved',
//           detail: 'Member has been added.'
//         });
//         this.loadData();
//       },
//       error: (err) =>
//         this.messageService.add({
//           severity: 'error',
//           summary: 'Error',
//           detail: err.error?.message
//         })
//     });
//   }

//   removeMember(memberId: string) {
//     this.confirmationService.confirm({
//       message: 'Are you sure you want to remove this member? They will lose access immediately.',
//       header: 'Revoke Access',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.removeMember(memberId).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'Member removed successfully.' });
//             this.loadData();
//           },
//           error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
//         });
//       }
//     });
//   }

//   transferOwnership() {
//     if (this.transferForm.invalid) return;

//     this.confirmationService.confirm({
//       message: 'This action is irreversible. You will become a regular admin.',
//       header: 'Transfer Ownership',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.transferOwnership(this.transferForm.value.newOwnerId).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'success', summary: 'Transferred', detail: 'Ownership updated.' });
//             window.location.reload();
//           },
//           error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
//         });
//       }
//     });
//   }

//   deleteOrganization() {
//     // FIX: Get the actual ID from the signal, do not use 'let id: any'
//     const orgId = this.organization()?._id;

//     if (!orgId) {
//       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Organization ID not found.' });
//       return;
//     }

//     this.confirmationService.confirm({
//       message: 'This will permanently delete the organization and all associated data. This cannot be undone.',
//       header: 'DELETE ORGANIZATION',
//       icon: 'pi pi-trash',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.deleteOrganization(orgId).subscribe({
//           next: () => {
//             this.authService.logout();
//             this.router.navigate(['/auth/login']);
//           },
//           error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
//         });
//       }
//     });
//   }

//   // --- HELPERS ---
//   getInitials(name: string): string {
//     return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'ORG';
//   }
// }
