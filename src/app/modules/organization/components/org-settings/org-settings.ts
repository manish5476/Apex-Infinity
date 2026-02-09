import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

/* PrimeNG v18 Modules */
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';

/* Custom */
import { AuthService } from '../../../auth/services/auth-service';
import { OrganizationService } from '../../organization.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { Divider } from "primeng/divider";

@Component({
  selector: 'app-org-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, FormsModule,
    ButtonModule, InputTextModule, DialogModule, TabsModule, ConfirmDialogModule,
    TagModule, AvatarModule, SelectModule, BadgeModule, ToastModule, AgShareGrid,
    Divider
],
  providers: [ConfirmationService, MessageService],
  templateUrl: './org-settings.html',
  styleUrl: './org-settings.scss',
})
export class OrgSettingsComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private masterList = inject(MasterListService);

  // State Signals
  isLoading = signal(true);
  isSaving = signal(false);
  activeTabValue = signal('0');

  // Data Signals
  organization = signal<any>(null);
  activeMembers = signal<any[]>([]);
  pendingMembers = signal<any[]>([]);
  
  // Computed
  isOwner = computed(() => {
    const org = this.organization();
    const currentUser = this.authService.getCurrentUser();
    return org && currentUser && (org.owner?._id === currentUser._id || org.owner === currentUser._id);
  });

  // Forms & Selections
  orgForm!: FormGroup;
  inviteForm!: FormGroup;
  transferForm!: FormGroup;
  showInviteDialog = false;
  showTransferDialog = false;
  
  // Selections for Pending Actions
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};
  
  // Lists
  roles: any[] = [];
  branches: any[] = [];
  availableRoles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Member', value: 'member' }
  ];

  // Grid Config
  column: any[] = [];

  constructor() {
    effect(() => {
      if (this.organization()) this.initGridColumns();
    });
  }

  ngOnInit() {
    this.initForms();
    this.loadData();
    
    // Subscribe to master list updates
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
      role: [null, Validators.required]
    });

    this.transferForm = this.fb.group({
      newOwnerId: [null, Validators.required],
      confirmName: ['', Validators.required]
    });
  }

  loadData() {
    this.isLoading.set(true);
    
    forkJoin({
      org: this.orgService.getMyOrganization(),
      pending: this.orgService.getPendingMembers()
    })
    .pipe(finalize(() => this.isLoading.set(false)))
    .subscribe({
      next: (res: any) => {
        const orgData = res.org.data;
        this.organization.set(orgData);

        // Populate Form
        this.orgForm.patchValue({
          name: orgData.name,
          primaryEmail: orgData.primaryEmail,
          primaryPhone: orgData.primaryPhone,
          gstNumber: orgData.gstNumber
        });

        // 🟢 HANDLE MEMBERS
        // 1. Members array from 'getMyOrganization' (Approved)
        if (orgData.members && Array.isArray(orgData.members)) {
          // Filter to ensure we only show approved users in the main grid
          this.activeMembers.set(orgData.members.filter((m: any) => m.status === 'approved' || !m.status));
        }

        // 2. Pending Members from specific endpoint
        const pendingList = res.pending.data?.pendingMembers || [];
        this.pendingMembers.set(pendingList);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not fetch organization details.' });
      }
    });
  }

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
            <div class="user-cell">
              <div class="avatar">${initials}</div>
              <div class="info">
                <div class="name">
                  ${params.value} 
                  ${isOwner ? '<i class="pi pi-shield text-blue-500 ml-1" title="Owner"></i>' : ''}
                </div>
                <div class="email">${params.data.email}</div>
              </div>
            </div>
          `;
        }
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 150,
        cellRenderer: (params: any) => {
            // Handle both object {name: 'Admin'} and string 'admin'
            const roleName = params.value?.name || params.value || 'Member';
            const styleClass = roleName.toLowerCase().includes('admin') ? 'badge-admin' : 'badge-member';
            return `<span class="p-badge ${styleClass}">${roleName}</span>`;
        }
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 150,
        valueFormatter: (p: any) => p.value || '-'
      }
    ];
  }

  // --- ACTIONS ---

  updateOrgDetails() {
    if (this.orgForm.invalid) return;
    this.isSaving.set(true);
    this.orgService.updateMyOrganization(this.orgForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Organization saved.' }),
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
      });
  }

  inviteUser() {
    if (this.inviteForm.invalid) return;
    this.isSaving.set(true);

    const payload = {
      ...this.inviteForm.value,
      branchId: this.organization().mainBranch // Default to main branch
    };

    this.orgService.inviteUser(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Invited', detail: 'Invitation sent.' });
          this.showInviteDialog = false;
          this.inviteForm.reset();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message })
      });
  }

  approveMember(userId: string) {
    const roleId = this.selectedRoles[userId];
    const branchId = this.selectedBranches[userId];

    if (!roleId || !branchId) {
      this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please select a Role and Branch.' });
      return;
    }

    this.orgService.approveMember({ userId, branchId, roleId }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Member joined the team.' });
        this.loadData(); // Reload to move user from Pending to Active
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
    });
  }
  
  rejectMember(userId: string) {
     this.confirmationService.confirm({
        message: 'Reject this user request? This cannot be undone.',
        header: 'Reject Request',
        icon: 'pi pi-times-circle',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
            this.orgService.rejectMember({ userId }).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'info', summary: 'Rejected', detail: 'Request removed.' });
                    this.loadData();
                }
            })
        }
     });
  }

  eventFromGrid(event: any) {
    if (event.type === 'delete') {
      this.removeMember(event.row._id);
    }
  }

  removeMember(memberId: string) {
    this.confirmationService.confirm({
      message: 'Remove this user from the organization? They will lose access immediately.',
      header: 'Remove Member',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.removeMember(memberId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'User access revoked.' });
            this.loadData();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }
  
  deleteOrganization() {
     const orgId = this.organization()?._id;
     if (!orgId) return;
     
     this.confirmationService.confirm({
        message: 'CRITICAL: This will permanently delete your organization and all data. Are you sure?',
        header: 'Delete Organization',
        icon: 'pi pi-trash',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
           this.orgService.deleteOrganization(orgId).subscribe({
              next: () => {
                 this.authService.logout();
                 this.router.navigate(['/auth/login']);
              },
              error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
           })
        }
     });
  }

  // --- HELPERS ---
  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'OR';
  }
  
  scrollToPending() {
     document.getElementById('pending-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}



















// import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
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
// import { ToastModule } from 'primeng/toast';

// /* Services */
// import { AuthService } from '../../../auth/services/auth-service';
// import { OrganizationService } from '../../organization.service';
// import { MasterListService } from '../../../../core/services/master-list.service';

// /* Shared Grid */
// import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

// @Component({
//   selector: 'app-org-settings',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     FormsModule,
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
//     ToastModule,
//     AgShareGrid
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

//   // Grid Props
//   column: any[] = [];

//   // Computed: Determines if current user is the owner
//   isOwner = computed(() => {
//     const org = this.organization();
//     const currentUser = this.authService.getCurrentUser();
//     if (!org || !currentUser) return false;
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

//   // Data
//   selectedRoles: { [userId: string]: string } = {};
//   selectedBranches: { [userId: string]: string } = {};
//   roles: any[] = [];
//   branches: any[] = [];

//   availableRoles = [
//     { label: 'Admin', value: 'admin' },
//     { label: 'Member', value: 'member' }
//   ];

//   constructor() {
//     // Reactively update grid columns when organization data is loaded
//     effect(() => {
//       if (this.organization()) {
//         this.initGridColumns();
//       }
//     });
//   }

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

//   // --- Grid Column Definition ---
//   initGridColumns() {
//     const ownerId = this.organization()?.owner?._id || this.organization()?.owner;

//     this.column = [
//       {
//         field: 'name',
//         headerName: 'User',
//         flex: 2,
//         minWidth: 250,
//         cellRenderer: (params: any) => {
//           if (!params.value) return '';
//           const initials = this.getInitials(params.value);
//           const isOwner = params.data._id === ownerId;

//           return `
//           <div class="user-cell-wrapper">
//             <div class="user-avatar-circle">${initials}</div>
//             <div class="user-info">
//               ${isOwner ? `<span class="owner-icon-small" title="Organization Owner"><i class="pi pi-shield-fill"></i></span>` : ''}
//               <span class="user-name" title="${params.value}">${params.value}</span>
//             </div>
//           </div>
//         `;
//         }
//       },
//       {
//         field: 'email',
//         headerName: 'Email',
//         flex: 2,
//         minWidth: 200,
//         cellStyle: { color: 'var(--text-secondary)' }
//       },
//       {
//         field: 'role.name',
//         headerName: 'Role',
//         width: 150,
//         cellRenderer: (params: any) => {
//           const role = params.value || 'Member';
//           const isOwner = params.data._id === ownerId;
//           // If it's owner, we might want to show Admin styling
//           const styleClass = (role === 'Admin' || isOwner) ? 'badge-info' : 'badge-secondary';
//           return `<span class="ag-badge ${styleClass}">${role}</span>`;
//         }
//       },
//     ];
//   }

//   eventFromGrid(event: any) {
//     console.log(event);
//     if (event.type === 'delete') {
//       const rowData = event.row
//       this.removeMember(rowData._id);
//     }
//     if (event.type === 'editStart') {
//       const userId = event.row._id;
//       this.router.navigate(['/user/details', userId]);
//     }
//   }


//   loadData() {
//     forkJoin({
//       org: this.orgService.getMyOrganization(),
//       pending: this.orgService.getPendingMembers(),
//       logs: this.orgService.getActivityLog()
//     })
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe({
//         next: (res: any) => {
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
//           this.pendingMembers.set(res.pending.data?.pendingMembers || []);
//           this.activityLogs.set(res.logs.data?.logs || []);
//         },
//         error: (err) => {
//           this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load organization data.' });
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
//       branchId: this.organization().mainBranch
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
//       this.messageService.add({ severity: 'warn', summary: 'Missing Info', detail: 'Please select a role and branch.' });
//       return;
//     }

//     this.orgService.approveMember({ userId, branchId, roleId }).subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Member has been added.' });
//         this.loadData();
//       },
//       error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
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

//   // transferOwnership() {
//   //   if (this.transferForm.invalid) return;

//   //   this.confirmationService.confirm({
//   //     message: 'This action is irreversible. You will become a regular admin.',
//   //     header: 'Transfer Ownership',
//   //     icon: 'pi pi-exclamation-triangle',
//   //     acceptButtonStyleClass: 'p-button-danger',
//   //     accept: () => {
//   //       this.orgService.transferOwnership({ user: this.transferForm.value.newOwnerId }).subscribe({
//   //         next: () => {
//   //           this.messageService.add({ severity: 'success', summary: 'Transferred', detail: 'Ownership updated.' });
//   //           window.location.reload();
//   //         },
//   //         error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
//   //       });
//   //     }
//   //   });
//   // }
//   transferOwnership() {
//     if (this.transferForm.invalid) return;

//     // 1. Get the target user ID from the form
//     const targetUserId = this.transferForm.value.newOwnerId;

//     this.confirmationService.confirm({
//       message: 'This will send an email to the selected user. They must accept the request to finalize the transfer.',
//       header: 'Initiate Ownership Transfer',
//       icon: 'pi pi-send',
//       acceptButtonStyleClass: 'p-button-warning',
//       accept: () => {

//         // 2. Call the Initiate API
//         // Backend expects { userId: string } based on your previous controller logic
//         const payload = { userId: targetUserId };

//         this.orgService.initiateTransfer(payload)
//           .pipe(finalize(() => this.showTransferDialog = false))
//           .subscribe({
//             next: (res: any) => {
//               // 3. Update UI to reflect "Pending" state (no page reload needed yet)
//               this.messageService.add({
//                 severity: 'success',
//                 summary: 'Request Sent',
//                 detail: 'An email has been sent to the new owner to accept the transfer.'
//               });
//               this.transferForm.reset();
//             },
//             error: (err) => {
//               this.messageService.add({
//                 severity: 'error',
//                 summary: 'Transfer Failed',
//                 detail: err.error?.message || 'Could not initiate transfer'
//               });
//             }
//           });
//       }
//     });
//   }
//   deleteOrganization() {
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
//     return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
//   }

//   onTabChange(event: any) {
//     this.activeTabValue.set(event);
//   }
// }